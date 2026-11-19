import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

import { Button, Input } from '../common';
import { eventsService } from '../../services/events.service';
import { eventTypesService } from '../../services/eventTypes.service';
import { customerAdminService } from '../../services/customerAdmin.service';
import { projectsService } from '../../services/projects.service';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { usePermissions } from '../../contexts/PermissionsContext';

export interface CreateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaMode?: 'photo' | 'video';
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const CreateGalleryModal: React.FC<CreateGalleryModalProps> = ({
  isOpen,
  onClose,
  mediaMode = 'photo',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  let flags: Record<string, boolean> = {};
  try {
    flags = useFeatureFlags().flags as unknown as Record<string, boolean>;
  } catch {
    flags = {};
  }
  const { hasPermission } = usePermissions();

  const [eventName, setEventName] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [eventType, setEventType] = useState('wedding');
  const [eventDate, setEventDate] = useState(() => todayIso());
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canListClients = hasPermission('customers.view');
  const { data: clients = [] } = useQuery({
    queryKey: ['admin-customers-for-gallery-modal'],
    queryFn: () => customerAdminService.list({ status: 'active' }),
    enabled: isOpen && canListClients,
    staleTime: 60_000,
  });

  const canListProjects = !!flags.projects;
  const { data: projects = [] } = useQuery({
    queryKey: ['admin-projects-for-gallery-modal'],
    queryFn: () => projectsService.list(),
    enabled: isOpen && canListProjects,
    staleTime: 60_000,
  });

  const { data: eventTypes = [] } = useQuery({
    queryKey: ['admin-event-types', 'active'],
    queryFn: () => eventTypesService.getEventTypes(false),
    enabled: isOpen,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!isOpen) return;
    setEventName('');
    setClientId('');
    setProjectId('');
    setEventDate(todayIso());
    setDescription('');
    if (eventTypes.length > 0) {
      setEventType(eventTypes[0].slug_prefix || 'wedding');
    }
  }, [isOpen, eventTypes]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const selectedClient = clientId ? clients.find((c) => String(c.id) === clientId) : undefined;
  const filteredProjects = clientId
    ? projects.filter((p) => String(p.customerAccountId) === clientId)
    : projects;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = eventName.trim();
    if (!cleanName) {
      toast.error(t('events.modal.nameRequired', 'Veuillez saisir le nom de la galerie.'));
      return;
    }

    setSubmitting(true);
    try {
      const clientName = selectedClient
        ? (selectedClient.displayName?.trim() || [selectedClient.firstName, selectedClient.lastName].filter(Boolean).join(' ').trim() || selectedClient.email)
        : undefined;

      const created = await eventsService.createEvent({
        event_name: cleanName,
        event_type: eventType || 'wedding',
        event_date: eventDate || undefined,
        customer_name: clientName,
        customer_email: selectedClient?.email || undefined,
        welcome_message: description.trim() || undefined,
        customer_account_ids: selectedClient ? [selectedClient.id] : undefined,
      });

      if (projectId && created?.id) {
        try {
          await projectsService.assignEvent(Number(projectId), created.id);
        } catch {
          // Gallery is created; project link failure shouldn't block opening it.
        }
      }

      toast.success(t('events.modal.createdSuccess', 'Galerie créée avec succès.'));
      await queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      onClose();
      if (created?.id) {
        navigate(`/admin/events/${created.id}`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || t('common.error', 'Une erreur est survenue');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-gallery-modal-title"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-line bg-panel shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-line/60 flex-shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t('events.modal.eyebrow', 'Action rapide')}
            </p>
            <h2 id="create-gallery-modal-title" className="mt-1 text-xl font-bold text-heading">
              {mediaMode === 'video'
                ? t('events.modal.createVideoTitle', 'Créer une galerie vidéo')
                : t('events.modal.createPhotoTitle', 'Créer une galerie photo')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-subtle text-soft hover:text-heading hover:bg-hover transition-colors"
            aria-label={t('common.close', 'Fermer')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('events.modal.galleryName', 'Nom de la galerie')}
              placeholder={t('events.modal.galleryNamePlaceholder', 'ex. Souvenirs de mariage')}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="gallery-client-select" className="text-sm font-medium text-heading">
                  {t('events.modal.selectClient', 'Client')}
                </label>
                <span className="text-xs text-muted">{t('common.optional', 'Optionnel')}</span>
              </div>
              <select
                id="gallery-client-select"
                value={clientId}
                onChange={(e) => {
                  const val = e.target.value;
                  setClientId(val);
                  if (val && projectId) {
                    const p = projects.find((pr) => String(pr.id) === projectId);
                    if (p && String(p.customerAccountId) !== val) setProjectId('');
                  }
                }}
                className="h-10 w-full rounded-xl border border-line bg-panel px-3 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">{t('events.modal.noClient', 'Aucun client')}</option>
                {clients.map((c) => {
                  const name = c.displayName?.trim() || [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.email;
                  return <option key={c.id} value={String(c.id)}>{name}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {canListProjects && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="gallery-project-select" className="text-sm font-medium text-heading">
                    {t('events.modal.selectProject', 'Projet associé')}
                  </label>
                  <span className="text-xs text-muted">{t('common.optional', 'Optionnel')}</span>
                </div>
                <select
                  id="gallery-project-select"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-panel px-3 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">{t('events.modal.noProject', 'Aucun projet')}</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="gallery-type-select" className="block text-sm font-medium text-heading mb-1.5">
                {t('events.modal.eventType', 'Type d’événement')}
              </label>
              <select
                id="gallery-type-select"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-panel px-3 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {eventTypes.length > 0 ? (
                  eventTypes.map((et) => (
                    <option key={et.id} value={et.slug_prefix}>{et.name}</option>
                  ))
                ) : (
                  <>
                    <option value="wedding">Mariage</option>
                    <option value="portrait">Portrait</option>
                    <option value="family">Famille</option>
                    <option value="corporate">Corporate</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <Input
            label={t('events.modal.date', 'Date de la séance')}
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="gallery-desc-input" className="text-sm font-medium text-heading">
                {t('events.modal.description', 'Description')}
              </label>
              <span className="text-xs text-muted">{t('common.optional', 'Optionnel')}</span>
            </div>
            <textarea
              id="gallery-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('events.modal.descriptionPlaceholder', 'Décrivez cette galerie pour vos clients...')}
              className="w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {t('events.modal.createButton', 'Créer la galerie')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

