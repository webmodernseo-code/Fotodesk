/**
 * Admin → Project Overview list page.
 *
 * Matches the FotoDesk Figma "Projects Flow" design:
 * - 4 KPI status cards
 * - "All projects" container with List / Grid view toggle, search & status filter
 * - Quick-action Create / Edit / Archive(Delete) modals
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FolderKanban,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../../../components/common';
import { projectsService, type ProjectSummary } from '../../../services/projects.service';
import { useLocalizedDate } from '../../../hooks/useLocalizedDate';
import { formatMoneyMinor } from '../../../utils/money';
import { cn } from '../../../lib/utils';

function formatValuation(p: ProjectSummary): string {
  const buckets = p.valuation?.byCurrency?.filter((b) => b.totalMinor !== 0) || [];
  if (buckets.length === 0) return '—';
  return buckets.map((b) => formatMoneyMinor(b.totalMinor, b.currency)).join(' · ');
}

const PAGE_SIZE = 8;

export const ProjectsListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { format } = useLocalizedDate();

  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [page, setPage] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [editProject, setEditProject] = useState<ProjectSummary | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<ProjectSummary | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      const value = search.trim();
      if ((next.get('q') || '') === value) return;
      if (value) next.set('q', value);
      else next.delete('q');
      setSearchParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, searchParams, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy]);

  const projectsQuery = useQuery({
    queryKey: ['projects', { search }],
    queryFn: () => projectsService.list({ q: search || undefined }),
  });
  const { data: projects, isLoading } = projectsQuery;

  const createMutation = useMutation({
    mutationFn: () => projectsService.create({ name: newName.trim() }),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setNewName('');
      setCreateModalOpen(false);
      toast.success(t('projects.toast.created', 'Project created') as string);
      navigate(`/admin/clients/projects/${project.id}`);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error ||
          err?.message ||
          (t('projects.toast.createFailed', 'Could not create project') as string),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, status }: { id: number; name: string; status: string }) =>
      projectsService.update(id, { name: name.trim(), status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setEditProject(null);
      toast.success(t('projects.toast.updated', 'Project updated successfully') as string);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error ||
          err?.message ||
          (t('projects.toast.updateFailed', 'Could not update project') as string),
      );
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => projectsService.update(id, { status: 'archived' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setDeleteProjectTarget(null);
      toast.success(t('projects.toast.archived', 'Project archived') as string);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error ||
          err?.message ||
          (t('projects.toast.archiveFailed', 'Could not archive project') as string),
      );
    },
  });

  const allProjects = projects || [];
  const kpis = useMemo(() => {
    const active = allProjects.filter((p) => p.status !== 'archived').length;
    const withEvents = allProjects.filter((p) => (p.eventCount ?? 0) > 0).length;
    const withValuation = allProjects.filter(
      (p) => (p.valuation?.byCurrency?.filter((b) => b.totalMinor !== 0).length ?? 0) > 0,
    ).length;
    const archived = allProjects.filter((p) => p.status === 'archived').length;
    return { active, withEvents, withValuation, archived };
  }, [allProjects]);

  const filteredProjects = useMemo(() => {
    const list = allProjects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
    if (sortBy === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [allProjects, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const paginatedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header (Figma Projects Flow) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted mb-1">
            {t('common.workspace', 'Workspace')} / <span className="font-semibold text-heading">{t('projects.crumb', 'Projects')}</span>
          </p>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-heading">
            {t('projects.title', 'Projects')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('projects.subtitle', 'Manage your photography projects and track their progress.')}
          </p>
        </div>
        <Button
          variant="brand"
          size="md"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" strokeWidth={1.75} />}
        >
          {t('projects.create.button', 'Create Project')}
        </Button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm flex items-center gap-3.5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-soft border border-line">
            <Calendar className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-xs font-medium text-muted">{t('projects.kpi.active', 'Active')}</p>
            <p className="text-xl font-bold text-heading">
              {kpis.active} <span className="text-xs font-normal text-muted">{t('projects.kpi.projects', 'projects')}</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm flex items-center gap-3.5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-bg text-info border border-info-line/70 shadow-2xs">
            <Clock className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-xs font-medium text-muted">{t('projects.kpi.inProgress', 'In Progress')}</p>
            <p className="text-xl font-bold text-heading">
              {kpis.withEvents} <span className="text-xs font-normal text-muted">{t('projects.kpi.projects', 'projects')}</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm flex items-center gap-3.5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-bg text-purple border border-purple-line/70 shadow-2xs">
            <Sparkles className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-xs font-medium text-muted">{t('projects.kpi.valued', 'Billed / Quoted')}</p>
            <p className="text-xl font-bold text-heading">
              {kpis.withValuation} <span className="text-xs font-normal text-muted">{t('projects.kpi.projects', 'projects')}</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm flex items-center gap-3.5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-bg text-success border border-success-line/70 shadow-2xs">
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-xs font-medium text-muted">{t('projects.kpi.archived', 'Archived')}</p>
            <p className="text-xl font-bold text-heading">
              {kpis.archived} <span className="text-xs font-normal text-muted">{t('projects.kpi.projects', 'projects')}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main "All projects" Card */}
      <div className="rounded-2xl border border-line bg-panel shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-heading">{t('projects.allTitle', 'All projects')}</h2>
            <p className="text-xs text-muted">
              {filteredProjects.length} {t('projects.records', 'project records')}
            </p>
          </div>
          <div className="inline-flex items-center rounded-xl border border-line bg-subtle p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-lg transition-colors cursor-pointer',
                viewMode === 'list' ? 'bg-panel text-heading shadow-2xs' : 'text-muted hover:text-heading',
              )}
              aria-label={t('projects.viewList', 'List view')}
            >
              <LayoutList className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-colors cursor-pointer',
                viewMode === 'grid' ? 'bg-panel text-heading shadow-2xs' : 'text-muted hover:text-heading',
              )}
              aria-label={t('projects.viewGrid', 'Grid view')}
            >
              <LayoutGrid className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3.5 border-b border-line flex flex-col sm:flex-row sm:items-center gap-3 bg-panel">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('projects.search', 'Search by name or customer…') as string}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input h-9 sm:w-44 text-xs font-medium cursor-pointer"
            aria-label={t('projects.filterStatus', 'Filter by status')}
          >
            <option value="all">{t('projects.allStatuses', 'All statuses')}</option>
            <option value="active">{t('projects.status.active', 'Active')}</option>
            <option value="archived">{t('projects.status.archived', 'Archived')}</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'name')}
            className="input h-9 sm:w-40 text-xs font-medium cursor-pointer"
            aria-label={t('projects.sortBy', 'Sort projects')}
          >
            <option value="recent">{t('projects.sortRecent', 'Project date')}</option>
            <option value="name">{t('projects.sortName', 'Name A–Z')}</option>
          </select>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="p-8">
            <Loading />
          </div>
        ) : projectsQuery.isError ? (
          <div className="p-6">
            <ErrorState
              title={t('projects.loadError', 'Could not load projects')}
              description={t('projects.loadErrorHelp', 'Check your connection, then try again.')}
              actionLabel={t('common.retry', 'Retry')}
              onAction={() => projectsQuery.refetch()}
            />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<FolderKanban className="h-5 w-5" />}
              title={search ? t('projects.noSearchResults', 'No matching projects') : t('projects.emptyTitle', 'No projects yet')}
              description={
                search
                  ? t('projects.noSearchResultsHelp', 'Try another project or customer name.')
                  : t('projects.empty', 'Create a project above, or events you already have will be grouped automatically.')
              }
              actionLabel={search ? t('projects.clearSearch', 'Clear search') : t('projects.create.button', 'Create Project')}
              onAction={search ? () => setSearch('') : () => setCreateModalOpen(true)}
            />
          </div>
        ) : viewMode === 'list' ? (
          <TableFrame className="border-0 rounded-none">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t('projects.col.name', 'PROJECT NAME')}</TableHeaderCell>
                  <TableHeaderCell>{t('projects.col.customer', 'CLIENT')}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t('projects.col.events', 'EVENTS')}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t('projects.col.value', 'VALUE')}</TableHeaderCell>
                  <TableHeaderCell>{t('projects.col.updated', 'UPDATED')}</TableHeaderCell>
                  <TableHeaderCell>{t('projects.col.status', 'STATUS')}</TableHeaderCell>
                  <TableHeaderCell className="text-right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProjects.map((p) => (
                  <TableRow
                    key={p.id}
                    onClick={() => navigate(`/admin/clients/projects/${p.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle border border-line text-soft">
                          <FolderKanban className="w-4 h-4" strokeWidth={1.75} />
                        </span>
                        <span className="font-semibold text-heading">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-info font-medium">{p.customerEmail || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums text-body">{p.eventCount ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-heading">
                      {formatValuation(p)}
                    </TableCell>
                    <TableCell className="text-xs text-muted">
                      {p.updatedAt ? format(p.updatedAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge tone={p.status === 'archived' ? 'neutral' : 'success'} dot>
                        {t(`projects.status.${p.status}`, p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                          className="p-1.5 rounded-lg text-muted hover:text-heading hover:bg-hover cursor-pointer"
                          aria-label={t('common.actions', 'Actions')}
                        >
                          <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        {openMenuId === p.id && (
                          <div className="absolute right-0 mt-1 w-40 rounded-xl border border-line bg-panel shadow-lg py-1 z-30 text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate(`/admin/clients/projects/${p.id}`);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-body hover:bg-hover flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> {t('projects.action.view', 'View details')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setEditProject(p);
                                setEditName(p.name);
                                setEditStatus(p.status);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-body hover:bg-hover flex items-center gap-2 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> {t('projects.action.edit', 'Edit project')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleteProjectTarget(p);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-danger hover:bg-danger-bg flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> {t('projects.action.archive', 'Archive project')}
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/admin/clients/projects/${p.id}`)}
                className="rounded-2xl border border-line bg-panel p-4 shadow-2xs hover:shadow-md hover:border-line-strong transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-subtle border border-line text-soft">
                      <FolderKanban className="w-4 h-4" strokeWidth={1.75} />
                    </span>
                    <div>
                      <Badge tone={p.status === 'archived' ? 'neutral' : 'success'} dot>
                        {t(`projects.status.${p.status}`, p.status)}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-heading">{p.name}</h3>
                    <p className="text-xs text-info">{p.customerEmail || '—'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditProject(p);
                      setEditName(p.name);
                      setEditStatus(p.status);
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-heading hover:bg-hover cursor-pointer"
                    aria-label={t('projects.action.edit', 'Edit project')}
                  >
                    <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>

                <div className="pt-3 border-t border-line-faint flex items-center justify-between text-xs text-muted">
                  <span>{p.eventCount ?? 0} {t('projects.col.events', 'events')}</span>
                  <span className="font-semibold text-heading">{formatValuation(p)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProjects.length > 0 && (
          <div className="px-5 py-3 border-t border-line flex items-center justify-between text-xs text-muted">
            <span>
              {t('projects.showing', 'Showing')} {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filteredProjects.length)} {t('projects.of', 'of')} {filteredProjects.length}
            </span>
            <div className="inline-flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    'h-7 min-w-[28px] px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                    page === n ? 'bg-brand text-white' : 'bg-subtle text-body hover:bg-hover',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE PROJECT MODAL (QUICK ACTION) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">Quick Action</p>
                <h3 className="text-lg font-bold text-heading mt-0.5">
                  {t('projects.create.modalTitle', 'Create project')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:bg-hover cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newName.trim()) createMutation.mutate();
              }}
              className="mt-4 space-y-4"
            >
              <Input
                label={t('projects.create.label', 'Project Name') as string}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('projects.create.placeholder', 'e.g. Müller wedding 2026') as string}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  disabled={!newName.trim() || createMutation.isPending}
                  isLoading={createMutation.isPending}
                >
                  {t('projects.create.button', 'Create Project')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL (QUICK ACTION · Figma Edit project pop up) */}
      {editProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">Quick Action</p>
                <h3 className="text-lg font-bold text-heading mt-0.5">
                  {t('projects.edit.modalTitle', 'Edit project')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditProject(null)}
                className="p-1.5 rounded-lg text-muted hover:bg-hover cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editName.trim()) {
                  updateMutation.mutate({ id: editProject.id, name: editName, status: editStatus });
                }
              }}
              className="mt-4 space-y-4"
            >
              <Input
                label={t('projects.col.name', 'Project Name') as string}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
              <div>
                <label className="block text-sm font-medium text-body mb-1.5">
                  {t('projects.col.status', 'Project Status')}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="input h-10 text-sm cursor-pointer"
                >
                  <option value="active">{t('projects.status.active', 'Active')}</option>
                  <option value="archived">{t('projects.status.archived', 'Archived')}</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditProject(null)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  disabled={!editName.trim() || updateMutation.isPending}
                  isLoading={updateMutation.isPending}
                >
                  {t('common.saveChanges', 'Save Changes')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARCHIVE / DELETE PROJECT MODAL (QUICK ACTION · Figma Delete project pop up) */}
      {deleteProjectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">Quick Action</p>
              <button
                type="button"
                onClick={() => setDeleteProjectTarget(null)}
                className="p-1.5 rounded-lg text-muted hover:bg-hover cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
            <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-danger-bg text-danger">
              <Archive className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-heading">
              {t('projects.archive.title', 'Archive project?')}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {t(
                'projects.archive.description',
                `You're about to archive ${deleteProjectTarget.name}. Related galleries, client records, contracts, quotes and invoices remain preserved.`,
              )}
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteProjectTarget(null)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={archiveMutation.isPending}
                onClick={() => archiveMutation.mutate(deleteProjectTarget.id)}
              >
                {t('projects.archive.confirm', 'Archive Project')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
