/**
 * /admin/agenda — admin calendar (read-only skeleton for E.6).
 *
 * Renders four layers fetched in one shot from /api/admin/calendar/items
 * (backend route adminCalendar.js, E.3):
 *
 *   - events (galleries)              → blue solid
 *   - hour entries                    → green solid (greyed when locked)
 *   - pending quotes (not converted)  → amber dashed
 *   - pending contracts (not converted) → purple dashed
 *
 * View toggle (Month / Week) persists per admin via localStorage
 * (`utils/calendarPrefs.ts`).
 *
 * Click behaviour:
 *   - event    → /admin/events/:slug
 *   - quote    → /admin/clients/quotes/:id
 *   - contract → /admin/clients/contracts/:id
 *   - hours    → noop in E.6; E.7 adds the inline edit popover.
 *
 * Interactions deferred to E.7:
 *   - drag-create on empty slots (hour-entry create modal)
 *   - drag-resize / drag-move on unlocked hour entries
 *   - inline edit popover on hour entries
 *
 * Bundle note: this file is the entry point of the `fullcalendar` chunk
 * carved in vite.config.ts (E.5). FullCalendar's plugin imports flow
 * through here only — the calling App.tsx loads this module lazily.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLocalizedDate } from '../../../hooks/useLocalizedDate';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { usePermission } from '../../../hooks/usePermission';
import FullCalendar from '@fullcalendar/react';
import type {
  EventInput,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  DateSelectArg,
} from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
// F.4 — bundle locales for the languages picpeak speaks. Importing
// the locale module registers it with FC's locale registry; the
// `locale` prop then resolves to it by code. Other locales (fr/nl/
// pt/ru) fall back to English day/month names.
import deLocale from '@fullcalendar/core/locales/de';
import { Card, ErrorState, Loading } from '../../../components/common';
import {
  calendarService,
  type CalendarItem,
  type CalendarAppointmentItem,
  type CalendarHoursItem,
} from '../../../services/calendar.service';
import { businessProfileService } from '../../../services/businessProfile.service';
import { customerAdminService } from '../../../services/customerAdmin.service';
import { projectsService } from '../../../services/projects.service';
import { getCalendarView, setCalendarView, type CalendarView } from '../../../utils/calendarPrefs';
import { HourEntryDragCreateModal } from './HourEntryDragCreateModal';
import { HourEntryInlinePopover } from './HourEntryInlinePopover';
import {
  Calendar as CalendarIcon,
  Plus,
  LayoutGrid,
  Download,
  Trash2,
  X,
  MapPin,
  Clock,
  ArrowRight,
  MoreHorizontal,
  Check,
} from 'lucide-react';

// Color tokens. Hex literals (rather than tailwind utility classes)
// because FullCalendar applies these as inline `background-color` /
// `border-color` styles on the rendered event chips — tailwind classes
// wouldn't take effect.
const COLOR_EVENT = '#3B82F6';      // blue-500
const COLOR_HOURS = '#10B981';      // emerald-500
const COLOR_HOURS_LOCKED = '#9CA3AF'; // gray-400 (greyed)
const COLOR_QUOTE_BORDER = '#F59E0B'; // amber-500
const COLOR_CONTRACT_BORDER = '#A855F7'; // purple-500
const COLOR_APPOINTMENT = '#6366F1'; // data-series colour used by FullCalendar
const COLOR_APPOINTMENT_BORDER = '#4F46E5'; // data-series colour used by FullCalendar

/**
 * Column-header text for the calendar's day headers.
 *
 * FC's default in en-US renders as "Thu 5/21" (M/D), which is wrong for
 * DE / CH operators who expect day.month. dayHeaderContent (NOT
 * dayHeaderFormat, which only accepts an Intl options object in FC v6 and
 * throws if handed a function) returns the rendered string directly.
 * Locale-aware short weekday + explicit DD.MM. to match the project-wide
 * useLocalizedDate convention (per
 * feedback_respect_general_format_settings.md).
 *
 * Only the time-grid views have one date per column. dayGridMonth's header
 * row labels seven generic weekday columns shared by every week in the grid,
 * and FC fills `arg.date` there from its internal reference week
 * (1970-01-04..10) — which is why the month header used to read a fixed
 * "Mo 05.01. … So 04.01." whatever month was on screen. The weekday is still
 * correct, so month view renders the weekday alone: there is no single date
 * that column could legitimately show.
 */
export function formatDayHeader(date: Date, viewType: string, language: string): string {
  const weekday = date.toLocaleDateString(language || 'en', {
    weekday: 'short',
    timeZone: 'UTC',
  });
  if (viewType === 'dayGridMonth') {
    return weekday;
  }
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${weekday} ${day}.${month}.`;
}

/**
 * Convert a backend CalendarItem to a FullCalendar EventInput. Embeds
 * the original item in `extendedProps` so the event-click handler can
 * read the `kind` discriminator without re-fetching.
 */
export function mapItemToFcEvent(item: CalendarItem): EventInput {
  // Only unlocked hour entries are draggable/resizable. Everything
  // else stays inert — click-to-deep-link is the only interaction.
  const editable = item.kind === 'hours' && !item.locked;
  const base: EventInput = {
    id: `${item.kind}-${item.id}`,
    extendedProps: { item },
    editable,
    durationEditable: editable,
    startEditable: editable,
  };

  // Backend should return YYYY-MM-DD, but a prior bug (a pg date
  // column round-tripping as a full ISO timestamp like
  // "2026-05-18T00:00:00.000Z") slipped through and ended up
  // concatenated into FC start strings as
  // "2026-05-18T00:00:00.000ZT09:00", which FC parsed to NaN and
  // silently dropped. Slice to 10 chars here as a safety belt so any
  // future Date-vs-string drift on the backend can't repeat that.
  const rawDate = (item as { eventDate?: string; entryDate?: string }).eventDate
    || (item as { entryDate?: string }).entryDate
    || '';
  const dateStr = typeof rawDate === 'string' ? rawDate.slice(0, 10) : '';

  if (item.kind === 'event') {
    base.title = item.eventName || 'Event';
    base.backgroundColor = COLOR_EVENT;
    base.borderColor = COLOR_EVENT;
    if (item.isFullDay || !item.eventTimeStart) {
      base.start = dateStr;
      base.allDay = true;
    } else {
      base.start = `${dateStr}T${item.eventTimeStart}`;
      base.end = item.eventTimeEnd ? `${dateStr}T${item.eventTimeEnd}` : undefined;
    }
  } else if (item.kind === 'hours') {
    // Hours always have HH:MM start + end (entered via the form).
    base.title = item.customerName
      ? `${item.customerName} — ${item.description || ''}`.trim().replace(/—\s*$/, '')
      : item.description || 'Hours';
    if (item.locked) {
      base.backgroundColor = COLOR_HOURS_LOCKED;
      base.borderColor = COLOR_HOURS_LOCKED;
      base.classNames = ['cal-hours-locked'];
    } else {
      base.backgroundColor = COLOR_HOURS;
      base.borderColor = COLOR_HOURS;
    }
    base.start = `${dateStr}T${item.startTime}`;
    base.end = `${dateStr}T${item.endTime}`;
  } else if (item.kind === 'quote') {
    base.title = item.eventName
      ? `${item.quoteNumber} — ${item.eventName}`
      : item.quoteNumber;
    base.backgroundColor = 'transparent';
    base.borderColor = COLOR_QUOTE_BORDER;
    base.textColor = COLOR_QUOTE_BORDER;
    base.classNames = ['cal-dashed'];
    if (item.eventTimeStart) {
      base.start = `${dateStr}T${item.eventTimeStart}`;
      base.end = item.eventTimeEnd ? `${dateStr}T${item.eventTimeEnd}` : undefined;
    } else {
      base.start = dateStr;
      base.allDay = true;
    }
  } else if (item.kind === 'contract') {
    base.title = item.eventName
      ? `${item.contractNumber} — ${item.eventName}`
      : item.contractNumber;
    base.backgroundColor = 'transparent';
    base.borderColor = COLOR_CONTRACT_BORDER;
    base.textColor = COLOR_CONTRACT_BORDER;
    base.classNames = ['cal-dashed'];
    if (item.eventTimeStart) {
      base.start = `${dateStr}T${item.eventTimeStart}`;
      base.end = item.eventTimeEnd ? `${dateStr}T${item.eventTimeEnd}` : undefined;
    } else {
      base.start = dateStr;
      base.allDay = true;
    }
  } else if (item.kind === 'appointment') {
    base.title = item.clientName ? `${item.title} (${item.clientName})` : item.title;
    base.start = `${item.date.slice(0, 10)}T${item.startTime}`;
    base.end = `${item.date.slice(0, 10)}T${item.endTime}`;
    base.backgroundColor = item.status === 'cancelled' ? COLOR_HOURS_LOCKED : COLOR_APPOINTMENT;
    base.borderColor = item.status === 'cancelled' ? COLOR_HOURS_LOCKED : COLOR_APPOINTMENT_BORDER;
    base.textColor = 'var(--ui-cta-fg)';
    base.editable = false;
  }
  return base;
}

/**
 * Derive an ISO YYYY-MM-DD pair covering the calendar's current visible
 * range plus a 1-week buffer on each side. The buffer keeps the cache
 * hot during week-by-week navigation so the user doesn't see a
 * loading flicker each step.
 */
function bufferedRange(active: { start: Date; end: Date }) {
  const startMs = active.start.getTime() - 7 * 24 * 60 * 60 * 1000;
  const endMs = active.end.getTime() + 7 * 24 * 60 * 60 * 1000;
  const from = new Date(startMs).toISOString().slice(0, 10);
  const to = new Date(endMs).toISOString().slice(0, 10);
  return { from, to };
}

export const CalendarPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar | null>(null);
  // I.3 — master `hoursLogging` flag gates ALL hour-entry interactions
  // on the calendar (drag-create / drag-move / drag-resize / inline
  // edit). When off, the calendar stays read-only: existing entries
  // still render so the admin sees their history, but no new ones can
  // be created and existing ones can't be moved. The Customers detail
  // page is where the per-customer flag is set; THIS gate is the
  // global Settings → Features master switch.
  const { flags } = useFeatureFlags();
  const hoursLoggingEnabled = !!flags.hoursLogging;
  const canEditAppointments = usePermission('customers.edit');
  // F.4 — admin's general_time_format drives FC's time labels.
  // dateFormat is consumed only for the (deferred) custom title
  // formatter; FC's built-in title/header formatting follows the
  // `locale` prop below for now.
  const { timeFormat } = useLocalizedDate();
  const fcHour12 = timeFormat === '12h';
  // Single Intl.DateTimeFormatOptions object reused by slotLabelFormat
  // and eventTimeFormat so the time-grid axis and event-chip prefixes
  // stay in sync. 24h installs see "14:00"; 12h installs see "2:00 PM".
  const fcTimeFormat: Intl.DateTimeFormatOptions = useMemo(() => ({
    hour: '2-digit',
    minute: '2-digit',
    hour12: fcHour12,
    // 24h installs prefer no leading zero on the hour ("9:00" not "09:00");
    // FC accepts the `meridiem: false` shortcut for that.
    meridiem: fcHour12 ? 'short' : false,
  } as Intl.DateTimeFormatOptions), [fcHour12]);

  // View persisted in localStorage (E.5 / E.6 — utils/calendarPrefs.ts).
  const [view] = useState<CalendarView>(() => getCalendarView());

  // Interaction state (E.7): drag-create payload + the hour entry the
  // inline popover is open against. Each is mutually exclusive; opening
  // one closes the other through the consumer's onClose.
  const [dragCreateState, setDragCreateState] = useState<{
    entryDate: string; startTime: string; endTime: string;
  } | null>(null);
  const [activeHoursItem, setActiveHoursItem] = useState<CalendarHoursItem | null>(null);

  // Range owned by the calendar instance — initialised lazily once
  // FullCalendar fires its first `datesSet`. Until then the query is
  // disabled so we don't fire a request for a guessed range.
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  const { data: itemsResp, isLoading: itemsLoading, isError: itemsError, refetch: refetchItems } = useQuery({
    queryKey: ['calendar-items', range?.from, range?.to],
    queryFn: () => calendarService.list(range as { from: string; to: string }),
    enabled: !!range,
    // I.5 — staleTime bumped to 5 min so navigation away from the
    // calendar and back within a reasonable window reads cache only;
    // no refetch fires that could (per the bug the user keeps
    // reporting) overwrite the local optimistic-merged items with a
    // server response that's missing the freshly-saved entry. After
    // 5 min the natural staleness kicks in + the entry is in the DB
    // anyway by then. gcTime stays at the default 5 min so the cache
    // entry survives a brief nav away.
    staleTime: 5 * 60_000,
    // Don't refetch on every remount — the cache is the source of
    // truth for the duration of the staleTime. datesSet (a real range
    // change) still triggers a fresh fetch via the queryKey change.
    refetchOnMount: false,
  });

  // Resolve the timezone the calendar should render in. business_profile
  // .timezone wins; fall back to the browser's IANA tz.
  const { data: bpSnapshot } = useQuery({
    queryKey: ['business-profile-for-calendar'],
    queryFn: () => businessProfileService.get(),
    staleTime: 5 * 60_000, // Settings change infrequently — long stale window.
  });
  const resolvedTz = bpSnapshot?.profile.timezone
    || Intl.DateTimeFormat().resolvedOptions().timeZone
    || 'UTC';

  const [displayTab, setDisplayTab] = useState<'calendar' | 'cards'>('calendar');
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [cardsFilter, setCardsFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [newApt, setNewApt] = useState({
    title: '',
    clientName: '',
    customerAccountId: '',
    projectId: '',
    category: 'portrait',
    date: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    endTime: '11:30',
    location: 'Studio FotoDesk',
    notes: '',
    imageUrl: '',
    status: 'scheduled' as CalendarAppointmentItem['status'],
  });

  const { data: appointmentCustomers = [] } = useQuery({
    queryKey: ['calendar-appointment-customers'],
    queryFn: () => customerAdminService.list({ status: 'active' }),
    staleTime: 5 * 60_000,
    enabled: appointmentModalOpen,
  });
  const { data: appointmentProjects = [] } = useQuery({
    queryKey: ['calendar-appointment-projects'],
    queryFn: () => projectsService.list({ status: 'active' }),
    staleTime: 5 * 60_000,
    enabled: appointmentModalOpen && !!flags.projects,
    retry: false,
  });
  const compatibleProjects = appointmentProjects.filter((project) => (
    !newApt.customerAccountId
    || !project.customerAccountId
    || project.customerAccountId === Number(newApt.customerAccountId)
  ));

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApt.title.trim()) {
      toast.error('Veuillez renseigner un titre pour cet événement.');
      return;
    }
    try {
      const payload = {
        title: newApt.title.trim(),
        clientName: newApt.clientName.trim() || undefined,
        category: newApt.category,
        date: newApt.date,
        startTime: newApt.startTime,
        endTime: newApt.endTime,
        location: newApt.location.trim() || undefined,
        notes: newApt.notes.trim() || undefined,
        customerAccountId: newApt.customerAccountId ? Number(newApt.customerAccountId) : null,
        projectId: newApt.projectId ? Number(newApt.projectId) : null,
        status: newApt.status,
      };
      if (editingAppointmentId) await calendarService.updateAppointment(editingAppointmentId, payload);
      else await calendarService.createAppointment(payload);
      await queryClient.invalidateQueries({ queryKey: ['calendar-items'] });
      toast.success(editingAppointmentId ? 'Rendez-vous mis à jour.' : 'Rendez-vous ajouté avec succès à l’agenda !');
      setAppointmentModalOpen(false);
      setEditingAppointmentId(null);
      setNewApt({
        title: '', clientName: '', customerAccountId: '', projectId: '', category: 'portrait',
        date: new Date().toISOString().slice(0, 10),
        startTime: '10:00', endTime: '11:30',
        location: 'Studio FotoDesk', notes: '', imageUrl: '', status: 'scheduled',
      });
    } catch {
      toast.error('Impossible d’ajouter ce rendez-vous. Réessayez.');
    }
  };

  const openAppointmentEditor = (item: CalendarAppointmentItem) => {
    setEditingAppointmentId(item.id);
    setNewApt({
      title: item.title,
      clientName: item.clientName || '',
      customerAccountId: item.customerAccountId ? String(item.customerAccountId) : '',
      projectId: item.projectId ? String(item.projectId) : '',
      category: item.category,
      date: item.date.slice(0, 10),
      startTime: item.startTime.slice(0, 5),
      endTime: item.endTime.slice(0, 5),
      location: item.location || '',
      notes: item.notes || '',
      imageUrl: '',
      status: item.status,
    });
    setAppointmentModalOpen(true);
  };

  const openAppointmentCreator = () => {
    setEditingAppointmentId(null);
    setNewApt({
      title: '', clientName: '', customerAccountId: '', projectId: '', category: 'portrait',
      date: new Date().toISOString().slice(0, 10), startTime: '10:00', endTime: '11:30',
      location: 'Studio FotoDesk', notes: '', imageUrl: '', status: 'scheduled',
    });
    setAppointmentModalOpen(true);
  };

  const handleDeleteIntervention = async (id: number) => {
    if (window.confirm('Supprimer ce rendez-vous ?')) {
      try {
        await calendarService.deleteAppointment(id);
        await queryClient.invalidateQueries({ queryKey: ['calendar-items'] });
        toast.success('Rendez-vous supprimé de l’agenda.');
      } catch {
        toast.error('Impossible de supprimer ce rendez-vous. Réessayez.');
      }
    }
  };

  const handleExportIcs = (item: CalendarAppointmentItem) => {
    const [year, month, day] = item.date.split('-').map(Number);
    const [hours, minutes] = (item.startTime || '10:00').split(':').map(Number);
    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);

    const formatIcs = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FotoDesk//Agenda RDV//FR',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${item.id}@fotodesk`,
      `DTSTAMP:${formatIcs(new Date())}`,
      `DTSTART:${formatIcs(startDate)}`,
      `DTEND:${formatIcs(endDate)}`,
      `SUMMARY:${item.title} - ${item.clientName}`,
      `DESCRIPTION:${item.notes || ''}`,
      `LOCATION:${item.location || ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `rdv-${item.date}-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Fichier calendrier (.ics) téléchargé.');
  };

  // Map backend → FC event shape. Recomputed on every items change;
  // the cost is tiny relative to FC's render path.
  const fcEvents = useMemo(() => {
    return (itemsResp?.items || []).map(mapItemToFcEvent);
  }, [itemsResp]);

  const sortedInterventions = useMemo(() => {
    const appointments = (itemsResp?.items || []).filter(
      (item): item is CalendarAppointmentItem => item.kind === 'appointment',
    );
    return [...appointments].sort((a, b) => {
      const timeA = `${a.date}T${a.startTime || '00:00'}`;
      const timeB = `${b.date}T${b.startTime || '00:00'}`;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  }, [itemsResp]);

  // Persist view changes. We don't use FC's viewClassNames or similar
  // — the explicit toggle buttons drive both the FC instance + the
  // stored pref.
  useEffect(() => {
    setCalendarView(view);
    const api = calendarRef.current?.getApi();
    if (api && api.view.type !== view) {
      api.changeView(view);
    }
  }, [view]);

  const handleDatesSet = (arg: DatesSetArg) => {
    const next = bufferedRange({ start: arg.start, end: arg.end });
    setRange((prev) => {
      // Avoid a re-render storm: only update when the buffered range
      // actually shifts past its window.
      if (prev && prev.from === next.from && prev.to === next.to) return prev;
      return next;
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const item = arg.event.extendedProps.item as CalendarItem | undefined;
    if (!item) return;
    if (item.kind === 'event') navigate(`/admin/events/${item.slug}`);
    else if (item.kind === 'quote') navigate(`/admin/clients/quotes/${item.id}`);
    else if (item.kind === 'contract') navigate(`/admin/clients/contracts/${item.id}`);
    else if (item.kind === 'hours') setActiveHoursItem(item);
    else if (item.kind === 'appointment') {
      if (canEditAppointments) openAppointmentEditor(item);
      else toast.info('Agenda en lecture seule pour votre rôle.');
    }
  };

  /**
   * Drag-select on the time grid → open the create modal pre-filled
   * with the selected range. In month view a single-click select gets a
   * full-day range (no times) — guard against that so we don't open the
   * modal with HH:MM=00:00–00:00 across a multi-day span. Single-day,
   * sub-24h selects with explicit times are the supported case.
   *
   * I.3 — refuse if master hoursLogging flag is off. The backend would
   * 409 the save anyway; this prevents the modal from opening in the
   * first place. Toast tells the admin where to enable it.
   */
  const handleDateSelect = (sel: DateSelectArg) => {
    if (sel.allDay) return;
    // Use local-component extraction (matches handleEventDrop /
    // handleEventResize). The previous `.toISOString().slice(0, 10)`
    // path read UTC, so a drag-select on Wed 01:00 in Berlin (UTC+2)
    // shifted entryDate back to Tuesday's UTC date — the entry was
    // saved under the wrong day and "disappeared" from the visible
    // week on the next refresh.
    const pad = (n: number) => String(n).padStart(2, '0');
    const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const startDay = ymd(sel.start);
    const endDay = ymd(sel.end);
    if (startDay !== endDay) return;
    if (!hoursLoggingEnabled) {
      toast.error(t('calendar.hourEntry.featureOffToast', 'Hour logging is disabled.') as string);
      calendarRef.current?.getApi().unselect();
      return;
    }
    const hh = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDragCreateState({ entryDate: startDay, startTime: hh(sel.start), endTime: hh(sel.end) });
  };

  /**
   * Drag-move: admin drags the whole block to a different day or slot.
   * FullCalendar gives us the new start / end as Date objects. We
   * translate to (entryDate, startTime, endTime) and PUT through the
   * existing hour-entry update route. On 4xx/5xx, FC's `revert()` puts
   * the chip back where it was so the UI never lies about persistence.
   */
  const handleEventDrop = async (arg: EventDropArg) => {
    const item = arg.event.extendedProps.item as CalendarItem | undefined;
    if (!item || item.kind !== 'hours' || item.locked) {
      arg.revert();
      return;
    }
    const start = arg.event.start;
    const end = arg.event.end;
    if (!start || !end) {
      arg.revert();
      return;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const entryDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    try {
      await customerAdminService.updateHourEntry(item.customerAccountId, item.id, {
        entryDate, startTime, endTime,
      });
      toast.success(t('calendar.hourEntry.movedToast', 'Hours updated.'));
      // F.7 — refetch (not just invalidate) so the calendar visibly
      // reflects the move/resize before any subsequent user action.
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['calendar-items'] }),
        queryClient.refetchQueries({
          queryKey: ['admin-customer-hour-entries', item.customerAccountId],
        }),
      ]);
    } catch (err) {
      // I.2 — friendly toast when the hour-logging flag is off
      // server-side; raw axios message otherwise.
      const e = err as any;
      const code = e?.response?.data?.code;
      const serverMsg = e?.response?.data?.error;
      if (code === 'FEATURE_OFF') {
        toast.error(t('calendar.hourEntry.featureOffToast',
          'Hour logging is disabled for this customer. Enable it on the customer detail page first.') as string);
      } else {
        const msg = serverMsg || (err instanceof Error ? err.message : String(err));
        toast.error(t('calendar.hourEntry.moveFailed', { message: msg, defaultValue: `Couldn't move: ${msg}` }) as string);
      }
      arg.revert();
    }
  };

  /**
   * Drag-resize: same as drop, but the start tends to be preserved and
   * only the end shifts (or vice-versa for the leading edge). The PUT
   * payload doesn't care which edge moved — we just send the canonical
   * triple.
   */
  const handleEventResize = async (arg: EventResizeDoneArg) => {
    const item = arg.event.extendedProps.item as CalendarItem | undefined;
    if (!item || item.kind !== 'hours' || item.locked) {
      arg.revert();
      return;
    }
    const start = arg.event.start;
    const end = arg.event.end;
    if (!start || !end) {
      arg.revert();
      return;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const entryDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    try {
      await customerAdminService.updateHourEntry(item.customerAccountId, item.id, {
        entryDate, startTime, endTime,
      });
      toast.success(t('calendar.hourEntry.resizedToast', 'Hours updated.'));
      // F.7 — refetch (not just invalidate) so the calendar visibly
      // reflects the move/resize before any subsequent user action.
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['calendar-items'] }),
        queryClient.refetchQueries({
          queryKey: ['admin-customer-hour-entries', item.customerAccountId],
        }),
      ]);
    } catch (err) {
      // I.2 — friendly toast on FEATURE_OFF (per-customer hour
      // logging disabled server-side); raw message otherwise.
      const e = err as any;
      const code = e?.response?.data?.code;
      const serverMsg = e?.response?.data?.error;
      if (code === 'FEATURE_OFF') {
        toast.error(t('calendar.hourEntry.featureOffToast',
          'Hour logging is disabled for this customer. Enable it on the customer detail page first.') as string);
      } else {
        const msg = serverMsg || (err instanceof Error ? err.message : String(err));
        toast.error(t('calendar.hourEntry.resizeFailed', { message: msg, defaultValue: `Couldn't resize: ${msg}` }) as string);
      }
      arg.revert();
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [activeFcView, setActiveFcView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>(
    (view as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') || 'dayGridMonth',
  );

  const switchCalendarView = (nextView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setActiveFcView(nextView);
    try {
      calendarRef.current?.getApi()?.changeView(nextView);
    } catch {
      // Safe no-op in mocked test environments
    }
  };

  const selectedDayAppointments = useMemo(() => {
    return sortedInterventions.filter((item) => {
      if (item.date !== selectedDay) return false;
      if (clientFilter !== 'all' && String(item.customerAccountId ?? '') !== clientFilter) return false;
      return true;
    });
  }, [sortedInterventions, selectedDay, clientFilter]);
  const upcomingCount = sortedInterventions.filter(i => i.date >= todayStr).length;
  const allCount = sortedInterventions.length;
  const pastCount = sortedInterventions.filter(i => i.date < todayStr).length;

  const filteredInterventions = sortedInterventions.filter(int => {
    if (cardsFilter === 'upcoming') return int.date >= todayStr;
    if (cardsFilter === 'past') return int.date < todayStr;
    return true;
  });

  const renderStatusBadge = (int: CalendarAppointmentItem) => {
    if (int.status === 'cancelled') return <span className="rounded-full bg-danger-bg px-2.5 py-1 text-[11px] font-semibold text-danger">Annulé</span>;
    if (int.status === 'completed') return <span className="rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">Terminé</span>;
    if (int.status === 'archived') return <span className="rounded-full border border-line bg-inset px-2.5 py-1 text-[11px] font-semibold text-muted">Archivé</span>;
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-info-line bg-info-bg px-2.5 py-1 text-[11px] font-semibold text-info">
        <Check className="h-3 w-3 stroke-[2.5]" />
        <span>Planifié</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Figma Calendar Flow Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted mb-1">
            Workspace / <span className="font-semibold text-heading">Calendar</span>
          </p>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-heading">Agenda</h1>
          <p className="text-sm text-muted mt-1">
            Retrouvez vos shootings, rendez-vous et échéances dans un planning partagé.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl border border-line bg-panel p-1">
            <button
              type="button"
              onClick={() => setDisplayTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                displayTab === 'calendar'
                  ? 'bg-brand-soft text-brand'
                  : 'text-muted hover:text-heading'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Grille calendrier
            </button>
            <button
              type="button"
              onClick={() => setDisplayTab('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                displayTab === 'cards'
                  ? 'bg-brand-soft text-brand'
                  : 'text-muted hover:text-heading'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Prochains RDV ({sortedInterventions.length})
            </button>
          </div>

          <button
            type="button"
            onClick={openAppointmentCreator}
            disabled={!canEditAppointments}
            title={canEditAppointments ? undefined : 'Agenda en lecture seule'}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-hover cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajouter un événement
          </button>
        </div>
      </div>

      {/* Calendar View Switcher & Filters Card (Figma Calendar Flow) */}
      {displayTab === 'calendar' && (
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-bg text-info border border-info-line/70 shadow-2xs">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-heading">Filtres du calendrier</p>
              <p className="text-[11px] text-muted">Affichage des événements planifiés</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="input h-9 w-40 text-xs font-medium cursor-pointer"
              aria-label="Filtrer par client"
            >
              <option value="all">Tous les clients</option>
              {appointmentCustomers.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.companyName || c.displayName || c.email}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-xl border border-line bg-subtle p-1">
              {([
                { id: 'dayGridMonth', label: 'Month' },
                { id: 'timeGridWeek', label: 'Week' },
                { id: 'timeGridDay', label: 'Day' },
              ] as const).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => switchCalendarView(v.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeFcView === v.id
                      ? 'bg-panel text-heading shadow-2xs'
                      : 'text-muted hover:text-heading'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keep legacy toolbar for Cards view */}
      <div className={displayTab === 'cards' ? 'relative overflow-hidden rounded-2xl border border-line bg-panel p-4 shadow-sm sm:p-5' : 'hidden'}>

        {/* Toolbar row with status filters */}
        <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
          <div className="inline-flex rounded-xl border border-line bg-inset p-1">
            <button
              type="button"
              onClick={() => setCardsFilter('upcoming')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                cardsFilter === 'upcoming'
                  ? 'border border-gold bg-gold-soft text-gold shadow-xs'
                  : 'text-muted hover:text-heading'
              }`}
            >
              À venir ({upcomingCount})
            </button>
            <button
              type="button"
              onClick={() => setCardsFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                cardsFilter === 'all'
                  ? 'border border-gold bg-gold-soft text-gold shadow-xs'
                  : 'text-muted hover:text-heading'
              }`}
            >
              Tous ({allCount})
            </button>
            <button
              type="button"
              onClick={() => setCardsFilter('past')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                cardsFilter === 'past'
                  ? 'border border-gold bg-gold-soft text-gold shadow-xs'
                  : 'text-muted hover:text-heading'
              }`}
            >
              Passés ({pastCount})
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <CalendarIcon className="w-3.5 h-3.5 text-gold" />
              <span>{upcomingCount} événements à venir</span>
            </div>
            <button
              type="button"
              onClick={() => setDisplayTab('calendar')}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-medium text-body transition-all hover:bg-hover hover:text-heading"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-gold" />
              <span>Vue calendrier →</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          DISPLAY TAB : CALENDAR (FullCalendar)
          ═══════════════════════════════════════ */}
      {displayTab === 'calendar' ? (
        <>
          <Legend />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-4 items-start">
            <Card padding="md" className="shadow-sm">
              {itemsLoading && !itemsResp && (
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <Loading />
                  <span>{t('calendar.loading', 'Loading items…')}</span>
                </div>
              )}
              {itemsError && !itemsResp && (
                <ErrorState
                  className="mb-4 min-h-40"
                  title={t('calendar.loadError', 'Impossible de charger l’agenda')}
                  description={t('calendar.loadErrorHelp', 'Vérifiez votre connexion puis réessayez.')}
                  actionLabel={t('common.retry', 'Réessayer')}
                  onAction={() => refetchItems()}
                />
              )}
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={view}
                timeZone={resolvedTz}
                locales={[deLocale]}
                locale={i18n.language || 'en'}
                slotLabelFormat={fcTimeFormat}
                eventTimeFormat={fcTimeFormat}
                dayHeaderContent={(arg) => formatDayHeader(arg.date, arg.view.type, i18n.language)}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: '',
                }}
                firstDay={1}
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                slotDuration="00:30:00"
                height="auto"
                expandRows
                events={fcEvents}
                eventClick={handleEventClick}
                dateClick={(arg: any) => {
                  if (arg?.dateStr) setSelectedDay(arg.dateStr.slice(0, 10));
                }}
                datesSet={handleDatesSet}
                selectable={hoursLoggingEnabled}
                selectMirror
                editable={hoursLoggingEnabled}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                select={handleDateSelect}
              />
            </Card>

            {/* Selected Day Sidebar Panel (Figma Calendar Flow) */}
            <aside className="rounded-2xl border border-line bg-panel p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
                <div>
                  <p className="text-sm font-bold text-heading">
                    {new Date(`${selectedDay}T12:00:00`).toLocaleDateString(i18n.language || 'fr-FR', {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-[11px] text-muted">
                    {new Date(`${selectedDay}T12:00:00`).toLocaleDateString(i18n.language || 'fr-FR', {
                      year: 'numeric',
                      weekday: 'long',
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAppointmentCreator}
                  disabled={!canEditAppointments}
                  className="inline-flex items-center gap-1 rounded-lg bg-info-bg px-2.5 py-1.5 text-xs font-semibold text-info hover:opacity-90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {selectedDayAppointments.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <span className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl bg-info-bg text-info border border-info-line/70 shadow-2xs">
                    <CalendarIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-heading">
                      Aucun événement prévu ce jour
                    </p>
                    <p className="text-[11px] text-muted mt-1">
                      Ajoutez un rendez-vous ou un shooting pour organiser votre journée.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAppointmentCreator}
                    disabled={!canEditAppointments}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-hover cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Planifier un créneau
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDayAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => openAppointmentEditor(apt)}
                      disabled={!canEditAppointments}
                      className="w-full rounded-xl border border-line bg-subtle p-3 text-left hover:bg-hover transition-colors flex items-center justify-between gap-2 cursor-pointer border-l-4 border-l-info"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-heading truncate">{apt.title}</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {apt.startTime || '09:00'}{apt.endTime ? ` – ${apt.endTime}` : ''}
                        </p>
                        {apt.location && (
                          <p className="text-[11px] text-faint truncate mt-0.5">{apt.location}</p>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-faint shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </>
      ) : (
        /* ═══════════════════════════════════════
           DISPLAY TAB : CARDS (Grille de Shootings)
           ═══════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredInterventions.map((int: any, idx: number) => {
            const [, monthNum, dayNum] = (int.date || '2026-10-23').split('-').map(Number);
            const monthsFr = ['JAN.', 'FÉV.', 'MARS', 'AVR.', 'MAI', 'JUIN', 'JUIL.', 'AOÛT', 'SEPT.', 'OCT.', 'NOV.', 'DÉC.'];
            const monthName = monthsFr[(monthNum || 10) - 1] || 'OCT.';
            const dayStr = String(dayNum || 23);
            const isWideCard = idx === 3 && filteredInterventions.length === 4;

            const timeDisplay = int.endTime
              ? `${int.startTime} - ${int.endTime}`
              : (int.startTime?.includes('Début') ? int.startTime : `Début : ${int.startTime || '19:00'}`);

            return (
              <div
                key={int.id}
                className={`group relative flex flex-col justify-between rounded-2xl border border-line bg-panel p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isWideCard ? 'lg:col-span-2' : ''
                }`}
              >
                <div>
                  {/* Photo Banner with Badges */}
                  <div className={`relative w-full overflow-hidden rounded-xl bg-inset ${
                    isWideCard ? 'h-48 sm:h-56' : 'h-44 sm:h-48'
                  }`}>
                    <img
                      src={int.imageUrl || '/assets/images/camera-hero.jpg'}
                      alt={int.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Status badge on top-left of image */}
                    <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-success-line bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success backdrop-blur-md">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                      <span>{int.date >= todayStr ? 'À venir' : 'Terminé'}</span>
                    </div>

                    {/* Date badge on top-right of image */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/15 backdrop-blur-md text-white">
                      <div className="text-right leading-none">
                        <span className="text-base sm:text-lg font-bold text-white block">
                          {dayStr}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-gray-300 font-semibold">
                          {monthName}
                        </span>
                      </div>
                      <CalendarIcon className="w-4 h-4 text-gray-300 shrink-0" />
                    </div>
                  </div>

                  {/* Title & Details */}
                  <h3 className="text-base font-bold text-heading mt-3.5 truncate" title={int.title}>
                    {int.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-muted mt-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="truncate">{int.location || 'Studio FotoDesk'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted mt-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{timeDisplay}</span>
                  </div>
                </div>

                {/* Footer with status pill & actions */}
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between gap-2">
                  <div>{renderStatusBadge(int)}</div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openAppointmentEditor(int)}
                      disabled={!canEditAppointments}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-body hover:text-heading bg-hover hover:bg-hover/80 transition-all flex items-center gap-1"
                    >
                      <span>Modifier</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {/* Client Avatars */}
                    {int.avatars && int.avatars.length > 0 ? (
                      <div className="flex items-center -space-x-1.5 ml-1">
                        {int.avatars.map((av: string, avIdx: number) => (
                          <img
                            key={avIdx}
                            src={av}
                            alt="Client"
                            className="h-5 w-5 rounded-full border-2 border-panel object-cover"
                          />
                        ))}
                        {int.extraAvatars && (
                          <span className="text-[10px] text-muted ml-1.5 font-medium">
                            +{int.extraAvatars}
                          </span>
                        )}
                      </div>
                    ) : (
                      /* Context menu for ics download and delete */
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === int.id ? null : int.id)}
                          className="p-1 rounded-md text-muted hover:text-heading hover:bg-hover transition-colors"
                          title="Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeMenuId === int.id && (
                          <div className="absolute right-0 bottom-full mb-1 w-44 bg-panel border border-line rounded-xl shadow-lg p-1 z-30">
                            <button
                              type="button"
                              onClick={() => {
                                handleExportIcs(int);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-body hover:text-heading hover:bg-hover rounded-lg transition-colors text-left"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Exporter (.ics)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteIntervention(int.id);
                                setActiveMenuId(null);
                              }}
                              disabled={!canEditAppointments}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-danger transition-colors hover:bg-danger-bg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ═══════════════════════════════════════
              CARD 5 : "VOUS AVEZ D'AUTRES ÉVÉNEMENTS ?"
              ═══════════════════════════════════════ */}
          <div className="relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-line bg-panel p-6 text-center shadow-sm">
            {/* Subtle decorative gold curves */}
            <svg
              className="pointer-events-none absolute bottom-0 right-0 h-36 w-64 text-gold opacity-40"
              viewBox="0 0 250 140"
              fill="none"
            >
              <path d="M0 140 C80 140 120 70 250 30" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
              <path d="M40 140 C110 140 160 85 250 55" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35" />
              <path d="M90 140 C150 140 180 100 250 85" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.2" />
            </svg>

            <div className="relative z-10 mb-3.5 flex h-14 w-14 items-center justify-center rounded-full border border-gold bg-gold-soft text-gold">
              <CalendarIcon className="h-6 w-6" />
            </div>

            <h3 className="relative z-10 text-base font-bold text-heading">
              Vous avez d'autres événements ?
            </h3>

            <p className="relative z-10 text-xs text-muted max-w-xs mt-1.5 mb-5 leading-relaxed">
              Ajoutez vos prochains shootings, rendez-vous ou événements pour un planning toujours à jour.
            </p>

            <button
              type="button"
              onClick={openAppointmentCreator}
              disabled={!canEditAppointments}
              title={canEditAppointments ? undefined : 'Agenda en lecture seule'}
              className="relative z-10 inline-flex items-center justify-center gap-2 rounded-xl bg-cta px-5 py-2.5 text-xs font-semibold text-cta-fg shadow-md transition-all hover:bg-cta-hover"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un événement</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal to add an appointment */}
      {appointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 p-6 shadow-xl dark:bg-gray-900 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingAppointmentId ? 'Modifier le rendez-vous' : 'Ajouter un rendez-vous à l’agenda'}
              </h2>
              <button
                type="button"
                onClick={() => setAppointmentModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Titre du rendez-vous *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Shooting portrait famille, Mariage Sophie & Marc..."
                  value={newApt.title}
                  onChange={(e) => setNewApt({ ...newApt, title: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Client lié
                  </label>
                  <select
                    value={newApt.customerAccountId}
                    onChange={(e) => setNewApt({ ...newApt, customerAccountId: e.target.value, projectId: '' })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="">Aucun client</option>
                    {appointmentCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.companyName
                          || customer.displayName
                          || [customer.firstName, customer.lastName].filter(Boolean).join(' ')
                          || customer.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={newApt.category}
                    onChange={(e) => setNewApt({ ...newApt, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="mariage">Mariage</option>
                    <option value="grossesse">Grossesse</option>
                    <option value="evenement">Événement</option>
                    <option value="mode">Mode & Book</option>
                    <option value="produit">Produit & Packshot</option>
                  </select>
                </div>
              </div>

              {flags.projects && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Projet lié
                  </label>
                  <select
                    value={newApt.projectId}
                    onChange={(e) => setNewApt({ ...newApt, projectId: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="">Aucun projet</option>
                    {compatibleProjects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {editingAppointmentId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    État
                  </label>
                  <select
                    value={newApt.status}
                    onChange={(e) => setNewApt({ ...newApt, status: e.target.value as CalendarAppointmentItem['status'] })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="scheduled">Planifié</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newApt.date}
                    onChange={(e) => setNewApt({ ...newApt, date: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Heure début *
                  </label>
                  <input
                    type="time"
                    required
                    value={newApt.startTime}
                    onChange={(e) => setNewApt({ ...newApt, startTime: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Heure fin
                  </label>
                  <input
                    type="time"
                    value={newApt.endTime}
                    onChange={(e) => setNewApt({ ...newApt, endTime: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Lieu
                </label>
                <input
                  type="text"
                  placeholder="Ex: Studio FotoDesk, 14 rue de la Roquette..."
                  value={newApt.location}
                  onChange={(e) => setNewApt({ ...newApt, location: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Notes & consignes
                </label>
                <textarea
                  rows={2}
                  placeholder="Détails du shooting, matériel à prévoir..."
                  value={newApt.notes}
                  onChange={(e) => setNewApt({ ...newApt, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setAppointmentModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-gray-400"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900"
                >
                  {editingAppointmentId ? 'Enregistrer les modifications' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dragCreateState && (
        <HourEntryDragCreateModal
          entryDate={dragCreateState.entryDate}
          startTime={dragCreateState.startTime}
          endTime={dragCreateState.endTime}
          onClose={() => {
            calendarRef.current?.getApi().unselect();
            setDragCreateState(null);
          }}
          onCreated={(created) => {
            // H.1 — push the new chip into FC's eventStore directly so
            // it appears immediately, independent of the useQuery cache
            // and the events-prop diffing that was silently dropping
            // the new entry. The background invalidate from the modal
            // will eventually replace this with the server-shaped row.
            calendarRef.current?.getApi().addEvent({
              id: `hours-${created.id}`,
              title: created.customerName
                ? `${created.customerName} — ${created.description || ''}`.trim().replace(/—\s*$/, '')
                : created.description || 'Hours',
              start: `${created.entryDate}T${created.startTime}`,
              end: `${created.entryDate}T${created.endTime}`,
              backgroundColor: COLOR_HOURS,
              borderColor: COLOR_HOURS,
              editable: true,
              durationEditable: true,
              startEditable: true,
              extendedProps: {
                item: {
                  kind: 'hours' as const,
                  id: created.id,
                  customerAccountId: created.customerAccountId,
                  entryDate: created.entryDate,
                  startTime: created.startTime,
                  endTime: created.endTime,
                  description: created.description,
                  status: 'unbilled' as const,
                  invoiceId: null,
                  invoiceStatus: null,
                  locked: false,
                  customerName: created.customerName,
                },
              },
            });
            calendarRef.current?.getApi().unselect();
            setDragCreateState(null);
          }}
        />
      )}

      {activeHoursItem && (
        <HourEntryInlinePopover
          item={activeHoursItem}
          onClose={() => setActiveHoursItem(null)}
          onMutated={() => setActiveHoursItem(null)}
        />
      )}

      {/* Per-instance CSS:
          - dashed quote/contract chips (Tailwind can't reach inline FC
            chip styles, so we override with a small local rule).
          - F.5 — FC's prev/next/today buttons styled to match picpeak's
            .btn-outline / .btn-primary tokens. FC ships its own
            .fc-button-primary class; we override the relevant rules
            and bind to the CSS variables the rest of the admin theme
            uses (--color-accent-dark, --color-surface-border,
            --color-muted-text). The "today" / disabled-edge buttons
            and the active state (selected view) all read from these
            vars so the calendar respects custom branding palettes. */}
      <style>{`
        /* Admin-toggle-aware chrome vars — gallery theme writes inline
           --color-* on :root which would otherwise override .dark; scope
           local vars so the calendar follows the admin light/dark toggle. */
        .fc { --cal-border: var(--ui-line); --cal-muted: var(--ui-muted); --cal-text: var(--ui-body); }
        .cal-dashed {
          border-style: dashed !important;
          background-color: transparent !important;
        }
        .cal-dashed .fc-event-title,
        .cal-dashed .fc-event-time {
          font-style: italic;
        }
        .cal-hours-locked {
          opacity: 0.7;
        }

        /* FC button restyle — match picpeak admin .btn-outline shape. */
        .fc .fc-button-primary {
          background-color: transparent;
          border: 1px solid var(--cal-border);
          color: var(--cal-muted);
          text-transform: none;
          font-weight: 500;
          box-shadow: none;
          transition: opacity 0.15s, background-color 0.15s;
        }
        .fc .fc-button-primary:hover:not(:disabled) {
          opacity: 0.8;
          background-color: transparent;
          border-color: var(--cal-border);
          color: var(--cal-muted);
        }
        .fc .fc-button-primary:focus,
        .fc .fc-button-primary:focus-visible {
          box-shadow: 0 0 0 2px var(--color-accent-dark);
          outline: none;
        }
        /* "today" / active view button — picpeak's primary fill. */
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: var(--color-accent-dark);
          border-color: var(--color-accent-dark);
          color: white;
        }
        .fc .fc-button-primary:disabled {
          opacity: 0.5;
          background-color: transparent;
          border-color: var(--cal-border);
          color: var(--cal-muted);
        }
        /* Toolbar title (month / week range) reads the regular text
           colour rather than FC's hardcoded #333 so dark mode looks
           right. */
        .fc .fc-toolbar-title {
          color: var(--cal-text);
          font-size: 1.125rem;
          font-weight: 600;
        }

        /* Week-view day dividers.
           Pin --fc-border-color so FC's header cells + horizontal
           slot lines pick up the admin theme. The vertical dividers
           in the time-grid body need a separate trick: FC v6 either
           merges the day columns into one wide cell or sets a zero
           border more specifically than our rule can override, so
           plain border-left doesn't render. Use box-shadow with
           "inset 1px 0 0" instead — it draws a 1px line inside the
           column without affecting layout, survives border-collapse,
           and isn't clipped by overflow:hidden. Apply on every
           selector that maps to a day column so the rule works
           regardless of which DOM shape FC ends up rendering. */
        .fc {
          --fc-border-color: var(--cal-border);
        }
        .fc .fc-timegrid-col:not(:first-of-type),
        .fc .fc-day:not(:first-child),
        .fc .fc-timegrid-cols > table > tbody > tr > td:not(:first-child) {
          box-shadow: inset 1px 0 0 var(--cal-border);
        }
      `}</style>
    </div>
  );
};

/**
 * Color-legend strip rendered above the calendar. Kept inline rather
 * than as a sibling component because it never reuses elsewhere and
 * sharing the COLOR_* tokens with the mapper above is cheap.
 */
const Legend: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Card padding="sm">
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <LegendSwatch color={COLOR_EVENT} label={t('calendar.legend.events', 'Events')} />
        <LegendSwatch color={COLOR_HOURS} label={t('calendar.legend.hours', 'Hours')} />
        <LegendSwatch
          color={COLOR_QUOTE_BORDER}
          label={t('calendar.legend.pendingQuotes', 'Pending quotes')}
          dashed
        />
        <LegendSwatch
          color={COLOR_CONTRACT_BORDER}
          label={t('calendar.legend.pendingContracts', 'Pending contracts')}
          dashed
        />
        <LegendSwatch
          color={COLOR_HOURS_LOCKED}
          label={t('calendar.legend.hoursLocked', 'Locked (billed)')}
        />
      </div>
    </Card>
  );
};

const LegendSwatch: React.FC<{ color: string; label: string; dashed?: boolean }> = ({
  color, label, dashed,
}) => (
  <div className="flex items-center gap-2">
    <span
      aria-hidden
      className="inline-block w-4 h-3 rounded-sm"
      style={{
        backgroundColor: dashed ? 'transparent' : color,
        border: dashed ? `1.5px dashed ${color}` : `1px solid ${color}`,
      }}
    />
    <span>{label}</span>
  </div>
);
