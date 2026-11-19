/**
 * /admin/agenda (/admin/clients/calendar) — Studio Calendar.
 *
 * Renders five layers fetched from /api/admin/calendar/items:
 *   - appointments (studio sessions / consultations)
 *   - events (galleries)
 *   - hour entries
 *   - pending quotes
 *   - pending contracts
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
import deLocale from '@fullcalendar/core/locales/de';
import frLocale from '@fullcalendar/core/locales/fr';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

import { Button, Loading } from '../../../components/common';
import {
  calendarService,
  type CalendarAppointmentItem,
  type CalendarItem,
  type CalendarHoursItem,
} from '../../../services/calendar.service';
import { businessProfileService } from '../../../services/businessProfile.service';
import { customerAdminService } from '../../../services/customerAdmin.service';
import { projectsService } from '../../../services/projects.service';
import { getCalendarView, setCalendarView, type CalendarView } from '../../../utils/calendarPrefs';
import { HourEntryDragCreateModal } from './HourEntryDragCreateModal';
import { HourEntryInlinePopover } from './HourEntryInlinePopover';
import {
  CalendarEventDetailsModal,
  CalendarEventFormModal,
} from './CalendarEventModals';

const COLOR_EVENT = '#3B82F6';
const COLOR_APPOINTMENT = '#2563EB';
const COLOR_HOURS = '#10B981';
const COLOR_HOURS_LOCKED = '#9CA3AF';
const COLOR_QUOTE_BORDER = '#F59E0B';
const COLOR_CONTRACT_BORDER = '#A855F7';

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

function getItemDate(item: CalendarItem): string {
  if (item.kind === 'hours') return item.entryDate.slice(0, 10);
  if (item.kind === 'appointment') return item.date.slice(0, 10);
  return item.eventDate.slice(0, 10);
}

function getItemTitle(item: CalendarItem): string {
  if (item.kind === 'appointment') return item.title;
  if (item.kind === 'event') return item.eventName;
  if (item.kind === 'hours') {
    return item.customerName
      ? `${item.customerName} — ${item.description || ''}`.trim().replace(/—\s*$/, '')
      : item.description || 'Heures';
  }
  if (item.kind === 'quote') return item.eventName ? `${item.quoteNumber} — ${item.eventName}` : item.quoteNumber;
  return item.eventName ? `${item.contractNumber} — ${item.eventName}` : item.contractNumber;
}

function getItemTimeLabel(item: CalendarItem): string | null {
  if (item.kind === 'appointment') {
    return `${item.startTime.slice(0, 5)} – ${item.endTime.slice(0, 5)}`;
  }
  if (item.kind === 'hours') {
    return `${item.startTime.slice(0, 5)} – ${item.endTime.slice(0, 5)}`;
  }
  if (item.kind === 'event' && !item.isFullDay && item.eventTimeStart) {
    return item.eventTimeEnd
      ? `${item.eventTimeStart.slice(0, 5)} – ${item.eventTimeEnd.slice(0, 5)}`
      : item.eventTimeStart.slice(0, 5);
  }
  return null;
}

function getItemColor(item: CalendarItem): string {
  if (item.kind === 'appointment') return COLOR_APPOINTMENT;
  if (item.kind === 'event') return COLOR_EVENT;
  if (item.kind === 'hours') return item.locked ? COLOR_HOURS_LOCKED : COLOR_HOURS;
  if (item.kind === 'quote') return COLOR_QUOTE_BORDER;
  return COLOR_CONTRACT_BORDER;
}

function mapItemToFcEvent(item: CalendarItem): EventInput {
  const editable = item.kind === 'hours' && !item.locked;
  const dateStr = getItemDate(item);
  const base: EventInput = {
    id: `${item.kind}-${item.id}`,
    title: getItemTitle(item),
    editable,
    startEditable: editable,
    durationEditable: editable,
    extendedProps: { item },
  };

  if (item.kind === 'appointment') {
    base.backgroundColor = 'rgba(37, 99, 235, 0.12)';
    base.borderColor = COLOR_APPOINTMENT;
    base.textColor = '#1D4ED8';
    base.start = item.startTime ? `${dateStr}T${item.startTime}` : dateStr;
    base.end = item.endTime ? `${dateStr}T${item.endTime}` : undefined;
  } else if (item.kind === 'event') {
    base.backgroundColor = COLOR_EVENT;
    base.borderColor = COLOR_EVENT;
    base.textColor = '#FFFFFF';
    if (item.isFullDay || !item.eventTimeStart) {
      base.start = dateStr;
      base.allDay = true;
    } else {
      base.start = `${dateStr}T${item.eventTimeStart}`;
      base.end = item.eventTimeEnd ? `${dateStr}T${item.eventTimeEnd}` : undefined;
    }
  } else if (item.kind === 'hours') {
    const c = item.locked ? COLOR_HOURS_LOCKED : COLOR_HOURS;
    base.backgroundColor = c;
    base.borderColor = c;
    base.textColor = '#FFFFFF';
    if (item.locked) base.classNames = ['cal-hours-locked'];
    base.start = `${dateStr}T${item.startTime}`;
    base.end = `${dateStr}T${item.endTime}`;
  } else if (item.kind === 'quote') {
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
  }
  return base;
}

function bufferedRange(active: { start: Date; end: Date }) {
  const startMs = active.start.getTime() - 7 * 24 * 60 * 60 * 1000;
  const endMs = active.end.getTime() + 7 * 24 * 60 * 60 * 1000;
  const from = new Date(startMs).toISOString().slice(0, 10);
  const to = new Date(endMs).toISOString().slice(0, 10);
  return { from, to };
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const CalendarPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar | null>(null);
  const { flags } = useFeatureFlags();
  const hoursLoggingEnabled = !!flags.hoursLogging;
  const canEdit = usePermission('customers.edit');
  const { timeFormat } = useLocalizedDate();
  const fcHour12 = timeFormat === '12h';

  const fcTimeFormat: Intl.DateTimeFormatOptions = useMemo(() => ({
    hour: '2-digit',
    minute: '2-digit',
    hour12: fcHour12,
    meridiem: fcHour12 ? 'short' : false,
  } as Intl.DateTimeFormatOptions), [fcHour12]);

  const [view, setView] = useState<CalendarView>(() => getCalendarView());
  const [selectedDate, setSelectedDate] = useState<string>(() => todayIso());
  const [periodTitle, setPeriodTitle] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const [dragCreateState, setDragCreateState] = useState<{
    entryDate: string; startTime: string; endTime: string;
  } | null>(null);
  const [activeHoursItem, setActiveHoursItem] = useState<CalendarHoursItem | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<CalendarAppointmentItem | null>(null);
  const [detailsAppointment, setDetailsAppointment] = useState<CalendarAppointmentItem | null>(null);

  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  const { data: itemsResp, isLoading: itemsLoading } = useQuery({
    queryKey: ['calendar-items', range?.from, range?.to],
    queryFn: () => calendarService.list(range as { from: string; to: string }),
    enabled: !!range,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
  });

  const { data: bpSnapshot } = useQuery({
    queryKey: ['business-profile-for-calendar'],
    queryFn: () => businessProfileService.get(),
    staleTime: 5 * 60_000,
  });
  const resolvedTz = bpSnapshot?.profile?.timezone
    || Intl.DateTimeFormat().resolvedOptions().timeZone
    || 'UTC';

  const { data: clients = [] } = useQuery({
    queryKey: ['admin-customers-for-calendar'],
    queryFn: () => customerAdminService.list({ status: 'active' }),
    staleTime: 60_000,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['admin-projects-for-calendar'],
    queryFn: () => projectsService.list(),
    enabled: !!flags.projects,
    staleTime: 60_000,
  });

  const filteredItems = useMemo(() => {
    const raw = itemsResp?.items || [];
    const clientMatch = selectedClientId !== 'all' ? clients.find((c) => String(c.id) === selectedClientId) : null;
    const clientNames = clientMatch
      ? new Set(
          [
            clientMatch.displayName,
            [clientMatch.firstName, clientMatch.lastName].filter(Boolean).join(' '),
            clientMatch.email,
          ]
            .filter(Boolean)
            .map((s) => String(s).trim().toLowerCase()),
        )
      : null;

    return raw.filter((item) => {
      if (selectedClientId !== 'all') {
        const cid = Number(selectedClientId);
        if (item.kind === 'appointment') {
          if (item.customerAccountId !== cid) return false;
        } else if (item.kind === 'hours') {
          if (item.customerAccountId !== cid) return false;
        } else {
          const itemName = (item.customerName || '').trim().toLowerCase();
          if (!itemName || !clientNames?.has(itemName)) return false;
        }
      }
      if (selectedProjectId !== 'all') {
        const pid = Number(selectedProjectId);
        if (item.kind === 'appointment') {
          if (item.projectId !== pid) return false;
        } else {
          return false;
        }
      }
      return true;
    });
  }, [itemsResp, selectedClientId, selectedProjectId, clients]);

  const fcEvents = useMemo(
    () => filteredItems.map(mapItemToFcEvent),
    [filteredItems],
  );

  const selectedDayItems = useMemo(
    () => filteredItems.filter((item) => getItemDate(item) === selectedDate),
    [filteredItems, selectedDate],
  );

  useEffect(() => {
    setCalendarView(view);
    const api = calendarRef.current?.getApi();
    if (api && api.view.type !== view) {
      api.changeView(view);
    }
  }, [view]);

  const handleDatesSet = (arg: DatesSetArg) => {
    if (arg.view?.title) {
      setPeriodTitle(arg.view.title);
    }
    const next = bufferedRange({ start: arg.start, end: arg.end });
    setRange((prev) => {
      if (prev && prev.from === next.from && prev.to === next.to) return prev;
      return next;
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const item = arg.event.extendedProps.item as CalendarItem | undefined;
    if (!item) return;
    openItem(item);
  };

  const openItem = (item: CalendarItem) => {
    if (item.kind === 'appointment') setDetailsAppointment(item);
    else if (item.kind === 'event') navigate(`/admin/events/${item.slug}`);
    else if (item.kind === 'quote') navigate(`/admin/clients/quotes/${item.id}`);
    else if (item.kind === 'contract') navigate(`/admin/clients/contracts/${item.id}`);
    else if (item.kind === 'hours') setActiveHoursItem(item);
  };

  const handleDateSelect = (sel: DateSelectArg) => {
    if (sel.allDay) return;
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
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['calendar-items'] }),
        queryClient.refetchQueries({
          queryKey: ['admin-customer-hour-entries', item.customerAccountId],
        }),
      ]);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const serverMsg = err?.response?.data?.error;
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
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['calendar-items'] }),
        queryClient.refetchQueries({
          queryKey: ['admin-customer-hour-entries', item.customerAccountId],
        }),
      ]);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const serverMsg = err?.response?.data?.error;
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

  const openCreateModal = () => {
    setEditingAppointment(null);
    setFormModalOpen(true);
  };

  const selectedDayDisplay = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    if (Number.isNaN(d.getTime())) return { primary: selectedDate, secondary: '' };
    const lang = i18n.language || 'fr';
    const primary = new Intl.DateTimeFormat(lang, { month: 'long', day: 'numeric' }).format(d);
    const weekday = new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(d);
    return { primary, secondary: `${d.getFullYear()} · ${weekday}` };
  }, [selectedDate, i18n.language]);

  const fallbackPeriodTitle = useMemo(() => {
    if (periodTitle) return periodTitle;
    const d = new Date(`${selectedDate}T12:00:00`);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(i18n.language || 'fr', { month: 'long', year: 'numeric' }).format(d);
  }, [periodTitle, selectedDate, i18n.language]);

  const viewEyebrow = view === 'dayGridMonth'
    ? t('calendar.viewLabel.month', 'Mois')
    : view === 'timeGridWeek'
      ? t('calendar.viewLabel.week', 'Semaine')
      : t('calendar.viewLabel.day', 'Jour sélectionné');

  return (
    <div className="space-y-5">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted">
            {t('navigation.groups.workspace', 'Workspace')} <span className="mx-1.5">/</span>{' '}
            <span className="text-soft">{t('navigation.calendar', 'Calendrier')}</span>
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            {t('navigation.calendar', 'Calendrier')}
          </h1>
          <p className="mt-1 text-sm text-soft">
            {t('calendar.subtitle', 'Gérez vos séances photo, rendez-vous et plannings projets en un seul endroit.')}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
          disabled={!canEdit}
          title={!canEdit ? t('calendar.readOnly', 'Agenda en lecture seule') : undefined}
          className="w-full sm:w-auto"
        >
          {t('calendar.addEvent', 'Ajouter un événement')}
        </Button>
      </div>

      {/* Navigation & View Toolbar Card */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => calendarRef.current?.getApi().prev?.()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-soft hover:bg-subtle hover:text-heading transition-colors"
              aria-label={t('common.previous', 'Précédent')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => calendarRef.current?.getApi().next?.()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-soft hover:bg-subtle hover:text-heading transition-colors"
              aria-label={t('common.next', 'Suivant')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedDate(todayIso());
              calendarRef.current?.getApi().today?.();
            }}
            className="h-9 rounded-lg border border-line bg-panel px-3.5 text-xs font-semibold text-heading hover:bg-subtle transition-colors"
          >
            {t('calendar.today', 'Aujourd’hui')}
          </button>

          <div className="pl-2 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{viewEyebrow}</p>
            <p className="text-sm sm:text-base font-bold text-heading capitalize truncate">
              {fallbackPeriodTitle}
            </p>
          </div>
        </div>

        {/* Segmented Month / Week / Day switcher */}
        <div className="inline-flex items-center rounded-xl border border-line bg-subtle p-1 self-start sm:self-auto">
          {([
            { id: 'dayGridMonth', label: t('calendar.viewMonth', 'Mois') },
            { id: 'timeGridWeek', label: t('calendar.viewWeek', 'Semaine') },
            { id: 'timeGridDay', label: t('calendar.viewDay', 'Jour') },
          ] as const).map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-panel text-heading shadow-2xs border border-line'
                    : 'text-soft hover:text-heading border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-panel px-5 py-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-sky-600 dark:text-sky-400">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-heading">
              {t('calendar.filters.title', 'Filtres de l’agenda')}
            </p>
            <p className="text-xs text-muted">
              {selectedClientId === 'all' && selectedProjectId === 'all'
                ? t('calendar.filters.allShown', 'Tous les événements planifiés affichés')
                : t('calendar.filters.filteredCount', '{{count}} élément(s) affiché(s)', { count: filteredItems.length })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[440px]">
          <div>
            <label htmlFor="calendar-filter-client" className="block text-[11px] font-semibold text-muted mb-1">
              {t('calendar.modal.client', 'Client')}
            </label>
            <select
              id="calendar-filter-client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="h-10 w-full rounded-xl border border-line bg-panel px-3 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">{t('calendar.filters.allClients', 'Tous les clients')}</option>
              {clients.map((c) => {
                const name = c.displayName?.trim() || [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.email;
                return (
                  <option key={c.id} value={String(c.id)}>{name}</option>
                );
              })}
            </select>
          </div>

          <div>
            <label htmlFor="calendar-filter-project" className="block text-[11px] font-semibold text-muted mb-1">
              {t('calendar.filters.project', 'Projet')}
            </label>
            <select
              id="calendar-filter-project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-10 w-full rounded-xl border border-line bg-panel px-3 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">{t('calendar.filters.allProjects', 'Tous les projets')}</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main 2-column Grid: Calendar + Selected Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 xl:col-span-9 rounded-2xl border border-line bg-panel p-4 shadow-2xs">
          {itemsLoading && !itemsResp && (
            <div className="mb-3 flex items-center gap-2 text-sm text-muted">
              <Loading />
              <span>{t('calendar.loading', 'Chargement des éléments…')}</span>
            </div>
          )}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={view}
            timeZone={resolvedTz}
            locales={[deLocale, frLocale]}
            locale={i18n.language || 'fr'}
            slotLabelFormat={fcTimeFormat}
            eventTimeFormat={fcTimeFormat}
            dayHeaderContent={(arg) => formatDayHeader(arg.date, arg.view.type, i18n.language)}
            headerToolbar={false}
            firstDay={1}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:30:00"
            height="auto"
            expandRows
            events={fcEvents}
            eventClick={handleEventClick}
            dateClick={(arg) => setSelectedDate(arg.dateStr.slice(0, 10))}
            datesSet={handleDatesSet}
            selectable={hoursLoggingEnabled}
            selectMirror
            editable={hoursLoggingEnabled}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            select={handleDateSelect}
          />
        </div>

        {/* Selected Day Panel */}
        <aside className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-line bg-panel p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-line">
            <div>
              <h2 className="text-lg font-bold text-heading capitalize">{selectedDayDisplay.primary}</h2>
              <p className="text-xs text-muted capitalize">{selectedDayDisplay.secondary}</p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-subtle px-2.5 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-hover transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('common.add', 'Ajouter')}
              </button>
            )}
          </div>

          {selectedDayItems.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-subtle text-sky-600 dark:text-sky-400">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-heading">
                {t('calendar.dayPanel.emptyTitle', 'Aucun événement ce jour.')}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t('calendar.dayPanel.emptyDesc', 'Ajoutez un événement pour organiser votre planning.')}
              </p>
              {canEdit && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={openCreateModal}
                >
                  {t('calendar.dayPanel.addForDay', 'Planifier ce jour')}
                </Button>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {selectedDayItems.map((item) => {
                const timeLabel = getItemTimeLabel(item);
                const sub = [
                  item.kind === 'appointment' ? (item.clientName || item.customerName) : item.customerName,
                  item.kind === 'appointment' ? item.projectName : null,
                ]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={() => openItem(item)}
                    className="w-full text-left flex items-center justify-between gap-3 rounded-xl border border-line bg-subtle/50 hover:bg-subtle px-3.5 py-3 transition-colors"
                    style={{ borderLeftWidth: '3px', borderLeftColor: getItemColor(item) }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-heading truncate">{getItemTitle(item)}</p>
                      {timeLabel && <p className="text-xs text-soft mt-0.5">{timeLabel}</p>}
                      {sub && <p className="text-[11px] text-muted truncate mt-0.5">{sub}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      {/* Add / Edit Appointment Modal */}
      <CalendarEventFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingAppointment(null);
        }}
        defaultDate={selectedDate}
        appointment={editingAppointment}
        clients={clients}
        projects={projects}
      />

      {/* Appointment Details Modal */}
      <CalendarEventDetailsModal
        appointment={detailsAppointment}
        onClose={() => setDetailsAppointment(null)}
        canEdit={canEdit}
        onEdit={(appt) => {
          setDetailsAppointment(null);
          setEditingAppointment(appt);
          setFormModalOpen(true);
        }}
      />

      {dragCreateState && (
        <HourEntryDragCreateModal
          entryDate={dragCreateState.entryDate}
          startTime={dragCreateState.startTime}
          endTime={dragCreateState.endTime}
          onClose={() => {
            calendarRef.current?.getApi().unselect?.();
            setDragCreateState(null);
          }}
          onCreated={(created) => {
            calendarRef.current?.getApi().addEvent?.({
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
            calendarRef.current?.getApi().unselect?.();
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

      <style>{`
        .fc { --cal-border: #e5e7eb; --cal-muted: #6b7280; --cal-text: #111827; --fc-border-color: var(--cal-border); }
        .dark .fc { --cal-border: #262626; --cal-muted: #a3a3a3; --cal-text: #f5f5f5; }
        .cal-dashed { border-style: dashed !important; background-color: transparent !important; }
        .cal-dashed .fc-event-title, .cal-dashed .fc-event-time { font-style: italic; }
        .cal-hours-locked { opacity: 0.7; }
        .fc .fc-col-header-cell-cushion { font-size: 12px; font-weight: 600; color: var(--cal-muted); padding: 8px 4px; }
        .fc .fc-daygrid-day-number { font-size: 12px; font-weight: 600; color: var(--cal-text); padding: 6px 8px; }
        .fc .fc-day-today { background-color: rgba(200, 149, 97, 0.08) !important; }
        .fc .fc-timegrid-col:not(:first-of-type),
        .fc .fc-day:not(:first-child),
        .fc .fc-timegrid-cols > table > tbody > tr > td:not(:first-child) {
          box-shadow: inset 1px 0 0 var(--cal-border);
        }
      `}</style>
    </div>
  );
};
