import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Users,
} from 'lucide-react';

import { Button, Card, EmptyState, SkeletonTable } from '../../components/common';
import { ClientFormModal } from '../../components/admin/ClientFormModal';
import { DeleteClientModal } from '../../components/admin/DeleteClientModal';
import { PermissionGate } from '../../components/admin/PermissionGate';
import {
  customerAdminService,
  type CustomerAccountSummary,
} from '../../services/customerAdmin.service';
import { projectsService } from '../../services/projects.service';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useLocalizedDate } from '../../hooks/useLocalizedDate';

type ProjectFilter = 'all' | 'with_projects' | 'no_projects';
type SortOption = 'name_asc' | 'newest' | 'most_projects';

const PAGE_SIZE = 8;

function getDisplayName(c: CustomerAccountSummary): string {
  if (c.displayName?.trim()) return c.displayName.trim();
  const full = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  return c.email.split('@')[0] || c.email;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const CustomerManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { format: fmtDate } = useLocalizedDate();
  const { flags } = useFeatureFlags();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<CustomerAccountSummary | null>(null);
  const [deletingClient, setDeletingClient] = useState<{ id: number; name: string } | null>(null);

  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => customerAdminService.list({ status: 'active' }),
  });

  const canListProjects = flags.projects && hasPermission('events.view');
  const { data: projects = [] } = useQuery({
    queryKey: ['admin-projects-counts'],
    queryFn: () => projectsService.list(),
    enabled: canListProjects,
    staleTime: 30_000,
  });

  const projectCountByCustomer = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of projects) {
      if (p.customerAccountId) {
        map.set(p.customerAccountId, (map.get(p.customerAccountId) || 0) + 1);
      }
    }
    return map;
  }, [projects]);

  const getProjectCount = (c: CustomerAccountSummary): number => {
    if (canListProjects) {
      return projectCountByCustomer.get(c.id) ?? 0;
    }
    return c.eventCount ?? 0;
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return fmtDate(new Date(iso));
    } catch {
      return '—';
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = customers.filter((c) => {
      const name = getDisplayName(c).toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      if (q && !name.includes(q) && !email.includes(q) && !phone.includes(q)) {
        return false;
      }
      const count = getProjectCount(c);
      if (projectFilter === 'with_projects' && count === 0) return false;
      if (projectFilter === 'no_projects' && count > 0) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'most_projects') {
        const diff = getProjectCount(b) - getProjectCount(a);
        if (diff !== 0) return diff;
      }
      return getDisplayName(a).localeCompare(getDisplayName(b));
    });
  }, [customers, search, projectFilter, sortBy, projectCountByCustomer, canListProjects]);

  const totalCount = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginated = filteredAndSorted.slice(startIndex, startIndex + PAGE_SIZE);

  const openAddModal = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const openEditModal = (client: CustomerAccountSummary) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted">
            {t('navigation.groups.workspace', 'Workspace')} <span className="mx-1.5">/</span>{' '}
            <span className="text-soft">{t('navigation.clients', 'Clients')}</span>
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            {t('navigation.clients', 'Clients')}
          </h1>
          <p className="mt-1 text-sm text-soft">
            {t('customers.subtitle', 'Gérez les clients de votre studio et leurs informations.')}
          </p>
        </div>
        <PermissionGate permission="customers.manage">
          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openAddModal}
            className="w-full sm:w-auto"
          >
            {t('customers.addClient', 'Ajouter un client')}
          </Button>
        </PermissionGate>
      </div>

      {/* Stat Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card padding="md" className="border border-line bg-panel shadow-2xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-soft">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-heading">
                  {t('customers.stats.totalClients', 'Total clients')}
                </p>
                <p className="text-xs text-muted truncate">
                  {t('customers.stats.recordsHint', 'Fiches clients du studio')}
                </p>
              </div>
            </div>
            <span className="text-3xl font-bold tracking-tight text-heading tabular-nums">
              {isLoading ? '—' : customers.length}
            </span>
          </div>
        </Card>
      </div>

      {/* Client List Card */}
      <div className="rounded-2xl border border-line bg-panel shadow-2xs overflow-hidden">
        {/* Card Toolbar */}
        <div className="flex flex-col gap-4 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-heading">
              {t('customers.list.title', 'Liste des clients')}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {t('customers.list.subtitle', 'Consultez et gérez les contacts du studio')}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t('customers.list.searchPlaceholder', 'Rechercher un client...')}
                className="h-10 w-full rounded-xl border border-line bg-panel pl-9 pr-3 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <select
              aria-label={t('customers.list.filterLabel', 'Filtrer les clients')}
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value as ProjectFilter);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">{t('customers.list.filterAll', 'Tous les clients')}</option>
              <option value="with_projects">{t('customers.list.filterWithProjects', 'Avec projets')}</option>
              <option value="no_projects">{t('customers.list.filterNoProjects', 'Sans projet')}</option>
            </select>

            <select
              aria-label={t('customers.list.sortLabel', 'Trier les clients')}
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="name_asc">{t('customers.list.sortNameAsc', 'Nom A–Z')}</option>
              <option value="newest">{t('customers.list.sortNewest', 'Plus récents')}</option>
              <option value="most_projects">{t('customers.list.sortMostProjects', 'Plus de projets')}</option>
            </select>
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="p-5">
            <SkeletonTable rows={5} cols={6} />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              {t('customers.loadError', 'Impossible de charger les clients.')}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              {t('common.retry', 'Réessayer')}
            </Button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title={
                search || projectFilter !== 'all'
                  ? t('customers.emptyFilteredTitle', 'Aucun client trouvé')
                  : t('customers.emptyTitle', 'Aucun client pour le moment')
              }
              description={
                search || projectFilter !== 'all'
                  ? t('customers.emptyFilteredDesc', 'Essayez de modifier votre recherche ou vos filtres.')
                  : t('customers.emptyDesc', 'Ajoutez votre premier client pour suivre ses projets et galeries.')
              }
              actionLabel={
                !search && projectFilter === 'all' && hasPermission('customers.manage')
                  ? t('customers.addClient', 'Ajouter un client')
                  : undefined
              }
              onAction={!search && projectFilter === 'all' ? openAddModal : undefined}
            />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-subtle/60 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="px-5 py-3">{t('customers.table.name', 'Client')}</th>
                    <th className="px-5 py-3">{t('customers.table.email', 'E-mail')}</th>
                    <th className="px-5 py-3">{t('customers.table.phone', 'Téléphone')}</th>
                    <th className="px-5 py-3">{t('customers.table.projects', 'Projets')}</th>
                    <th className="px-5 py-3">{t('customers.table.since', 'Client depuis')}</th>
                    <th className="px-5 py-3 text-right">{t('customers.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm">
                  {paginated.map((c) => {
                    const name = getDisplayName(c);
                    const initials = getInitials(name);
                    const projCount = getProjectCount(c);
                    return (
                      <tr key={c.id} className="hover:bg-subtle/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/admin/clients/accounts/${c.id}`}
                            className="inline-flex items-center gap-3 group"
                          >
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line bg-subtle text-xs font-semibold text-soft">
                              {initials}
                            </span>
                            <span className="font-semibold text-heading group-hover:text-accent transition-colors">
                              {name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-soft">{c.email}</td>
                        <td className="px-5 py-3.5 text-soft whitespace-nowrap">{c.phone || '—'}</td>
                        <td className="px-5 py-3.5 text-soft whitespace-nowrap">
                          {projCount}{' '}
                          {projCount > 1
                            ? t('customers.table.projectsPlural', 'projets')
                            : t('customers.table.projectSingular', 'projet')}
                        </td>
                        <td className="px-5 py-3.5 text-soft whitespace-nowrap">{formatDate(c.createdAt)}</td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <PermissionGate permission="customers.manage">
                            <div className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => openEditModal(c)}
                                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                              >
                                {t('common.edit', 'Modifier')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingClient({ id: c.id, name })}
                                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                              >
                                {t('common.delete', 'Supprimer')}
                              </button>
                            </div>
                          </PermissionGate>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-line">
              {paginated.map((c) => {
                const name = getDisplayName(c);
                const initials = getInitials(name);
                const projCount = getProjectCount(c);
                return (
                  <div key={c.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        to={`/admin/clients/accounts/${c.id}`}
                        className="flex items-center gap-3 min-w-0"
                      >
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line bg-subtle text-xs font-semibold text-soft">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-heading truncate">{name}</p>
                          <p className="text-xs text-muted truncate">{c.email}</p>
                        </div>
                      </Link>
                      <span className="text-xs font-medium text-soft whitespace-nowrap">
                        {projCount} {projCount > 1 ? 'projets' : 'projet'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted pt-1">
                      <span>{c.phone || '—'} · {formatDate(c.createdAt)}</span>
                      <PermissionGate permission="customers.manage">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="font-medium text-sky-600 dark:text-sky-400"
                          >
                            {t('common.edit', 'Modifier')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingClient({ id: c.id, name })}
                            className="font-medium text-red-600 dark:text-red-400"
                          >
                            {t('common.delete', 'Supprimer')}
                          </button>
                        </div>
                      </PermissionGate>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col gap-3 border-t border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                {t('customers.pagination.showing', 'Affichage de {{from}}–{{to}} sur {{total}} clients', {
                  from: startIndex + 1,
                  to: Math.min(startIndex + PAGE_SIZE, totalCount),
                  total: totalCount,
                })}
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-panel text-soft hover:bg-subtle disabled:opacity-40"
                    aria-label={t('common.previous', 'Précédent')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                        pNum === safePage
                          ? 'bg-accent text-white shadow-2xs'
                          : 'border border-line bg-panel text-soft hover:bg-subtle'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-panel text-soft hover:bg-subtle disabled:opacity-40"
                    aria-label={t('common.next', 'Suivant')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      <ClientFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        client={editingClient}
      />

      {/* Delete Modal */}
      <DeleteClientModal
        isOpen={Boolean(deletingClient)}
        onClose={() => setDeletingClient(null)}
        client={deletingClient}
      />
    </div>
  );
};
