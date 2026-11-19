import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Calendar, Clock, MapPin, Pencil, Trash2, X } from 'lucide-react';

import { Button, Input } from '../../../components/common';
import {
  calendarService,
  type CalendarAppointmentItem,
} from '../../../services/calendar.service';
import type { CustomerAccountSummary } from '../../../services/customerAdmin.service';
import type { ProjectSummary } from '../../../services/projects.service';

export interface CalendarEventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string;
  appointment?: CalendarAppointmentItem | null;
  clients: CustomerAccountSummary[];
  projects: ProjectSummary[];
}

const CATEGORIES = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'wedding', label: 'Mariage' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'other', label: 'Autre' },
];

function clientLabel(c: CustomerAccountSummary): string {
  const name = c.displayName?.trim() || [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  return name ? `${name} (${c.email})` : c.email;
}

export const CalendarEventFormModal: React.FC<CalendarEventFormModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  appointment,
  clients,
  projects,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = Boolean(appointment?.id);

  const [title, setTitle] = useState('');
  const [customerAccountId, setCustomerAccountId] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [category, setCategory] = useState('portrait');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (appointment) {
      setTitle(appointment.title || '');
      setCustomerAccountId(appointment.customerAccountId ?? '');
      setProjectId(appointment.projectId ?? '');
      setCategory(appointment.category || 'portrait');
      setDate(appointment.date?.slice(0, 10) || defaultDate);
      setStartTime(appointment.startTime?.slice(0, 5) || '10:00');
      setEndTime(appointment.endTime?.slice(0, 5) || '11:30');
      setLocation(appointment.location || '');
      setNotes(appointment.notes || '');
    } else {
      setTitle('');
      setCustomerAccountId('');
      setProjectId('');
      setCategory('portrait');
      setDate(defaultDate);
      setStartTime('10:00');
      setEndTime('11:30');
      setLocation('');
      setNotes('');
    }
  }, [isOpen, appointment, defaultDate]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const selectedClient = customerAccountId !== '' ? clients.find((c) => c.id === Number(customerAccountId)) : undefined;
  const filteredProjects = customerAccountId !== ''
    ? projects.filter((p) => p.customerAccountId === Number(customerAccountId))
    : projects;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error(t('calendar.modal.titleRequired', 'Veuillez saisir un titre d’événement.'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: cleanTitle,
        clientName: selectedClient
          ? (selectedClient.displayName?.trim() || [selectedClient.firstName, selectedClient.lastName].filter(Boolean).join(' ').trim() || selectedClient.email)
          : undefined,
        category,
        date,
        startTime,
        endTime,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        customerAccountId: customerAccountId === '' ? null : Number(customerAccountId),
        projectId: projectId === '' ? null : Number(projectId),
      };

      if (isEditing && appointment?.id) {
        await calendarService.updateAppointment(appointment.id, payload);
        toast.success(t('calendar.modal.updatedSuccess', 'Événement mis à jour.'));
      } else {
        await calendarService.createAppointment(payload);
        toast.success(t('calendar.modal.createdSuccess', 'Événement créé avec succès.'));
      }

      await queryClient.invalidateQueries({ queryKey: ['calendar-items'] });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || t('common.error', 'Une erreur est survenue');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-event-modal-title"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-line bg-panel shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-line/60 flex-shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t('calendar.modal.eyebrow', 'Action rapide')}
            </p>
            <h2 id="calendar-event-modal-title" className="mt-1 text-xl font-bold text-heading">
              {isEditing
                ? t('calendar.modal.editTitle', 'Modifier l’événement')
                : t('calendar.modal.addTitle', 'Ajouter un rendez-vous à l’agenda')}
            </h2>
            <p className="mt-0.5 text-xs text-soft">
              {t('calendar.modal.subtitle', 'Planifiez une séance ou un rendez-vous dans votre agenda studio.')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-subtle text-soft hover:text-heading hover:bg-hover transition-colors"
            aria-label={t('common.close', 'Fermer')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('calendar.modal.eventTitle', 'Titre de l’événement')}
              placeholder={t('calendar.modal.eventTitlePlaceholder', 'ex. Shooting portrait famille')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="cal-client-select" className="text-sm font-medium text-heading">
                  {t('calendar.modal.client', 'Client')}
                </label>
                <span className="text-xs text-muted">{t('common.optional', 'Optionnel')}</span>
              </div>
              <select
                id="cal-client-select"
                value={customerAccountId}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  setCustomerAccountId(val);
                  if (val !== '' && projectId !== '') {
                    const p = projects.find((pr) => pr.id === Number(projectId));
                    if (p && p.customerAccountId !== val) setProjectId('');
                  }
                }}
                className="h-10 w-full rounded-xl border border-line bg-panel px-3 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">{t('calendar.modal.noClient', 'Aucun client')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{clientLabel(c)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="cal-project-select" className="text-sm font-medium text-heading">
                  {t('calendar.modal.project', 'Projet associé')}
                </label>
                <span className="text-xs text-muted">{t('common.optional', 'Optionnel')}</span>
              </div>
              <select
                id="cal-project-select"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}
                className="h-10 w-full rounded-xl border border-line bg-panel px-3 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">{t('calendar.modal.noProject', 'Aucun projet')}</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cal-category-select" className="block text-sm font-medium text-heading mb-1.5">
                {t('calendar.modal.category', 'Type d’événement')}
              </label>
              <select
                id="cal-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-panel px-3 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={t('calendar.modal.date', 'Date')}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label={t('calendar.modal.startTime', 'Début')}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label={t('calendar.modal.endTime', 'Fin')}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cal-location-input" className="text-sm font-medium text-heading">
                {t('calendar.modal.location', 'Lieu')}
              </label>
              <span className="text-xs text-muted">{t('common.optional', 'Optionnel')}</span>
            </div>
            <Input
              id="cal-location-input"
              placeholder={t('calendar.modal.locationPlaceholder', 'Studio, lieu ou adresse')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cal-notes-input" className="text-sm font-medium text-heading">
                {t('calendar.modal.notes', 'Notes')}
              </label>
              <span className="text-xs text-muted">{t('common.optional', 'Optionnel')}</span>
            </div>
            <textarea
              id="cal-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('calendar.modal.notesPlaceholder', 'Ajoutez des détails utiles sur l’événement...')}
              className="w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {t('common.save', 'Enregistrer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface CalendarEventDetailsModalProps {
  appointment: CalendarAppointmentItem | null;
  onClose: () => void;
  onEdit: (appointment: CalendarAppointmentItem) => void;
  canEdit: boolean;
}

function computeDuration(start: string, end: string): string {
  const [sh, sm] = (start || '').split(':').map(Number);
  const [eh, em] = (end || '').split(':').map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) {
    return '—';
  }
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
}

export const CalendarEventDetailsModal: React.FC<CalendarEventDetailsModalProps> = ({
  appointment,
  onClose,
  onEdit,
  canEdit,
}) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  if (!appointment) return null;

  const formattedDate = (() => {
    const d = new Date(`${appointment.date.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(d.getTime())) return appointment.date;
    return new Intl.DateTimeFormat(i18n.language || 'fr', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  })();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await calendarService.deleteAppointment(appointment.id);
      toast.success(t('calendar.modal.deletedSuccess', 'Événement supprimé.'));
      await queryClient.invalidateQueries({ queryKey: ['calendar-items'] });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || t('common.error', 'Une erreur est survenue');
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-details-modal-title"
      onClick={() => !deleting && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-line bg-panel shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-line/60">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t('calendar.modal.eyebrow', 'Action rapide')}
            </p>
            <h2 id="calendar-details-modal-title" className="mt-1 text-xl font-bold text-heading">
              {t('calendar.details.title', 'Détails de l’événement')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-subtle text-soft hover:text-heading hover:bg-hover transition-colors"
            aria-label={t('common.close', 'Fermer')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-line">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-sky-600 dark:text-sky-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-heading truncate">{appointment.title}</p>
              <p className="text-xs text-muted capitalize">{formattedDate}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-muted flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {t('calendar.details.time', 'Horaire')}
              </dt>
              <dd className="mt-1 font-semibold text-heading">
                {appointment.startTime?.slice(0, 5)} – {appointment.endTime?.slice(0, 5)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">{t('calendar.details.duration', 'Durée')}</dt>
              <dd className="mt-1 font-semibold text-heading">
                {computeDuration(appointment.startTime, appointment.endTime)}
              </dd>
            </div>
            {appointment.location && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {t('calendar.details.location', 'Lieu')}
                </dt>
                <dd className="mt-1 font-semibold text-heading">{appointment.location}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-muted">{t('calendar.modal.client', 'Client')}</dt>
              <dd className="mt-1 font-semibold text-heading">
                {appointment.customerAccountId ? (
                  <Link
                    to={`/admin/clients/accounts/${appointment.customerAccountId}`}
                    className="text-sky-600 dark:text-sky-400 hover:underline"
                    onClick={onClose}
                  >
                    {appointment.clientName || appointment.customerName || `Client #${appointment.customerAccountId}`}
                  </Link>
                ) : (
                  appointment.clientName || appointment.customerName || '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">{t('calendar.modal.project', 'Projet associé')}</dt>
              <dd className="mt-1 font-semibold text-heading">
                {appointment.projectId ? (
                  <Link
                    to={`/admin/clients/projects/${appointment.projectId}`}
                    className="text-sky-600 dark:text-sky-400 hover:underline"
                    onClick={onClose}
                  >
                    {appointment.projectName || `Projet #${appointment.projectId}`}
                  </Link>
                ) : (
                  appointment.projectName || '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">{t('calendar.modal.category', 'Type d’événement')}</dt>
              <dd className="mt-1 font-semibold text-heading capitalize">{appointment.category || '—'}</dd>
            </div>
          </dl>

          {appointment.notes && (
            <div className="rounded-xl border border-line bg-subtle p-3.5">
              <p className="text-xs font-medium text-muted">{t('calendar.modal.notes', 'Notes')}</p>
              <p className="mt-1.5 text-sm text-heading whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-line">
            {canEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('calendar.details.delete', 'Supprimer')}
              </button>
            ) : <span />}

            <div className="flex items-center gap-2.5">
              <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
                {t('common.close', 'Fermer')}
              </Button>
              {canEdit && (
                <Button
                  type="button"
                  variant="primary"
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                  onClick={() => onEdit(appointment)}
                >
                  {t('calendar.details.edit', 'Modifier')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

