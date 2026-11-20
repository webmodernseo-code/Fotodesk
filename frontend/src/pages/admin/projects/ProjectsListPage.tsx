import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Archive,
  ChevronRight,
  FolderKanban,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { projectsService, type ProjectSummary } from '../../../services/projects.service';
import { customerAdminService } from '../../../services/customerAdmin.service';
import { useLocalizedDate } from '../../../hooks/useLocalizedDate';

const inputCls =
  'w-full h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors';

const labelCls = 'block text-xs font-medium text-heading mb-1.5';

export const ProjectsListPage: React.FC = () => {
  const { t } = useTranslation();
  const { format: formatDate } = useLocalizedDate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialStatus = searchParams.get('status') || 'all';

  const [search, setSearch] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  // Sync URL query params when search or status changes
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (search.trim()) {
      next.set('q', search.trim());
    } else {
      next.delete('q');
    }
    if (statusFilter && statusFilter !== 'all') {
      next.set('status', statusFilter);
    } else {
      next.delete('status');
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [search, statusFilter, searchParams, setSearchParams]);

  const {
    data: projects = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-projects', search.trim(), statusFilter],
    queryFn: () =>
      projectsService.list({
        ...(search.trim() ? { q: search.trim() } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      }),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers-picker'],
    queryFn: () => customerAdminService.list(),
    staleTime: 60_000,
  });

  // Create / Edit Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);
  const [formName, setFormName] = useState('');
  const [formCustomerId, setFormCustomerId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormCustomerId('');
    setFormError(null);
    setEditorOpen(true);
  };

  const openEditModal = (project: ProjectSummary) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormCustomerId(project.customerAccountId ? String(project.customerAccountId) : '');
    setFormError(null);
    setEditorOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmed = formName.trim();
      if (!trimmed) {
        throw new Error(t('projects.nameRequired', 'Le nom du projet est requis.'));
      }
      const customerAccountId = formCustomerId ? Number(formCustomerId) : null;
      if (editingProject) {
        return projectsService.update(editingProject.id, {
          name: trimmed,
          customerAccountId,
        });
      }
      return projectsService.create({
        name: trimmed,
        customerAccountId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      toast.success(
        editingProject
          ? t('projects.updated', 'Projet mis à jour.')
          : t('projects.created', 'Projet créé.'),
      );
      setEditorOpen(false);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        t('projects.saveError', 'Impossible d’enregistrer le projet.');
      setFormError(msg);
      toast.error(msg);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (project: ProjectSummary) =>
      projectsService.update(project.id, {
        status: project.status === 'archived' ? 'active' : 'archived',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      toast.success(t('projects.statusUpdated', 'Statut du projet mis à jour.'));
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error ||
          t('projects.saveError', 'Impossible de mettre à jour le projet.'),
      );
    },
  });

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status !== 'archived').length;
    const archived = projects.filter((p) => p.status === 'archived').length;
    return { total: projects.length, active, archived };
  }, [projects]);

  const hasFilter = Boolean(search.trim() || statusFilter !== 'all');

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted mb-1">
            Studio <span className="mx-1">/</span> {t('projects.title', 'Projets')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            {t('projects.title', 'Projets')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('projects.subtitle', 'Regroupez vos galeries, clients et factures par projet.')}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('projects.create', 'Créer un projet')}</span>
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-panel border border-line rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted">{t('projects.stats.total', 'Total')}</p>
          <p className="text-2xl font-bold text-heading mt-1">{stats.total}</p>
        </div>
        <div className="bg-panel border border-line rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted">{t('projects.stats.active', 'Actifs')}</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.active}
          </p>
        </div>
        <div className="bg-panel border border-line rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted">{t('projects.stats.archived', 'Archivés')}</p>
          <p className="text-2xl font-bold text-heading mt-1">{stats.archived}</p>
        </div>
      </div>

      {/* Search & Status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('projects.searchPlaceholder', 'Search by name or customer…')}
            className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          aria-label={t('projects.statusFilter', 'Statut')}
        >
          <option value="all">{t('projects.filter.all', 'Tous les statuts')}</option>
          <option value="active">{t('projects.filter.active', 'Actifs')}</option>
          <option value="archived">{t('projects.filter.archived', 'Archivés')}</option>
        </select>
      </div>

      {/* Content states */}
      {isLoading ? (
        <div className="bg-panel border border-line rounded-2xl p-10 text-center text-sm text-muted">
          {t('common.loading', 'Chargement…')}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="bg-panel border border-red-200 dark:border-red-900/50 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-heading">
                {t('projects.loadError', 'Could not load projects')}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {t('projects.loadErrorHint', 'Vérifiez votre connexion et réessayez.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel hover:bg-hover px-4 py-2 text-xs font-semibold text-heading cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.retry', 'Retry')}</span>
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-panel border border-line rounded-2xl p-10 text-center space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-subtle border border-line mx-auto flex items-center justify-center text-muted">
            <FolderKanban className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-heading">
            {hasFilter
              ? t('projects.noMatching', 'No matching projects')
              : t('projects.empty', 'No projects yet')}
          </p>
          {!hasFilter && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('projects.create', 'Créer un projet')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-panel border border-line rounded-2xl divide-y divide-line overflow-hidden shadow-2xs">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-hover/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    to={`/admin/clients/projects/${project.id}`}
                    className="text-sm font-semibold text-heading hover:text-emerald-600 dark:hover:text-emerald-400 truncate"
                  >
                    {project.name}
                  </Link>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      project.status === 'archived'
                        ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}
                  >
                    {project.status === 'archived'
                      ? t('projects.status.archived', 'Archivé')
                      : t('projects.status.active', 'Actif')}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  {project.customerEmail && <span>{project.customerEmail}</span>}
                  {typeof project.eventCount === 'number' && (
                    <span>
                      {project.eventCount} {project.eventCount === 1 ? 'galerie' : 'galeries'}
                    </span>
                  )}
                  {project.createdAt && <span>{formatDate(project.createdAt)}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(project)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel hover:bg-hover px-3 py-1.5 text-xs font-medium text-heading cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{t('common.edit', 'Modifier')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => archiveMutation.mutate(project)}
                  disabled={archiveMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel hover:bg-hover px-3 py-1.5 text-xs font-medium text-heading cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>
                    {project.status === 'archived'
                      ? t('projects.unarchive', 'Restaurer')
                      : t('projects.archive', 'Archiver')}
                  </span>
                </button>
                <Link
                  to={`/admin/clients/projects/${project.id}`}
                  className="inline-flex items-center gap-1 rounded-xl border border-line bg-panel hover:bg-hover px-3 py-1.5 text-xs font-semibold text-heading"
                >
                  <span>{t('projects.open', 'Ouvrir')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-heading">
                  {editingProject
                    ? t('projects.editTitle', 'Modifier le projet')
                    : t('projects.createTitle', 'Nouveau projet')}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {t('projects.modalSubtitle', 'Associez un nom de projet et un client.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-heading hover:bg-hover cursor-pointer"
                aria-label={t('common.close', 'Fermer')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300"
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="project-name" className={labelCls}>
                  {t('projects.nameLabel', 'Nom du projet')}
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Mariage Dupont"
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label htmlFor="project-customer" className={labelCls}>
                  {t('projects.customerLabel', 'Client (optionnel)')}
                </label>
                <select
                  id="project-customer"
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">{t('projects.noCustomer', 'Aucun client associé')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.displayName || c.email} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="btn-outline text-sm"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saveMutation.isPending
                    ? t('common.saving', 'Enregistrement…')
                    : t('common.save', 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
