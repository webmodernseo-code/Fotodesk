import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  FolderKanban,
  Pencil,
  Plus,
  Users,
} from 'lucide-react';

import { Badge, Button, Card, EmptyState, Loading } from '../../components/common';
import { ClientFormModal } from '../../components/admin/ClientFormModal';
import { CustomerActivityCard } from '../../components/admin/CustomerActivityCard';
import { PermissionGate } from '../../components/admin/PermissionGate';
import { customerAdminService } from '../../services/customerAdmin.service';
import { projectsService } from '../../services/projects.service';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useLocalizedDate } from '../../hooks/useLocalizedDate';

function getDisplayName(c: {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): string {
  if (c.displayName?.trim()) return c.displayName.trim();
  const joined = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  return joined || c.email.split('@')[0] || c.email;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { format: fmtDate } = useLocalizedDate();
  const { flags } = useFeatureFlags();
  const { hasPermission } = usePermissions();

  const [editOpen, setEditOpen] = useState(false);

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['admin-customer', customerId],
    queryFn: () => customerAdminService.get(customerId),
    enabled: Number.isFinite(customerId) && customerId > 0,
  });

  const canListProjects = flags.projects && hasPermission('events.view');
  const { data: allProjects = [] } = useQuery({
    queryKey: ['admin-projects-counts'],
    queryFn: () => projectsService.list(),
    enabled: canListProjects,
  });

  const relatedProjects = useMemo(
    () => allProjects.filter((p) => p.customerAccountId === customerId),
    [allProjects, customerId],
  );

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return fmtDate(new Date(iso));
    } catch {
      return '—';
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error || !customer) {
    return (
      <EmptyState
        icon={Users}
        title={t('customers.notFoundTitle', 'Client introuvable')}
        description={t('customers.notFoundDesc', 'Cette fiche client n’existe plus ou vous n’y avez pas accès.')}
        actionLabel={t('customers.backToList', 'Retour aux clients')}
        onAction={() => navigate('/admin/clients/accounts')}
      />
    );
  }

  const displayName = getDisplayName(customer);
  const initials = getInitials(displayName);
  const formattedAddress = [
    customer.addressLine1,
    [customer.postalCode, customer.city].filter(Boolean).join(' '),
    customer.countryName,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <Link to="/admin/clients/accounts" className="text-sky-600 dark:text-sky-400 hover:underline">
              {t('navigation.clients', 'Clients')}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-soft truncate">{displayName}</span>
          </nav>

          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t('customers.profile.eyebrow', 'Profil client')}
          </p>
          <h1 className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-soft">
            {t('customers.profile.clientSince', 'Client depuis le {{date}}', {
              date: formatDate(customer.createdAt),
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PermissionGate permission="customers.manage">
            <Button
              type="button"
              variant="outline"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => setEditOpen(true)}
            >
              {t('customers.profile.editClient', 'Modifier le client')}
            </Button>
          </PermissionGate>
          {canListProjects && (
            <Button
              type="button"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate(`/admin/clients/projects?new=1&customerId=${customer.id}`)}
            >
              {t('customers.profile.createProject', 'Créer un projet')}
            </Button>
          )}
        </div>
      </div>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Client Info Card */}
        <Card padding="lg" className="lg:col-span-4 border border-line bg-panel shadow-2xs">
          <div className="flex items-center gap-3.5 pb-5 border-b border-line">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-line bg-subtle text-sm font-bold text-heading">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-heading truncate">{displayName}</p>
              <p className="text-xs text-muted truncate">{customer.email}</p>
            </div>
          </div>

          <dl className="divide-y divide-line text-sm">
            <div className="py-3.5">
              <dt className="text-xs font-medium text-muted">
                {t('customers.modal.email', 'Adresse e-mail')}
              </dt>
              <dd className="mt-1 font-medium text-heading break-all">{customer.email}</dd>
            </div>
            <div className="py-3.5">
              <dt className="text-xs font-medium text-muted">
                {t('customers.modal.phone', 'Numéro de téléphone')}
              </dt>
              <dd className="mt-1 font-medium text-heading">{customer.phone || '—'}</dd>
            </div>
            <div className="py-3.5">
              <dt className="text-xs font-medium text-muted">
                {t('customers.modal.address', 'Adresse')}
              </dt>
              <dd className="mt-1 font-medium text-heading">{formattedAddress || '—'}</dd>
            </div>
            <div className="py-3.5">
              <dt className="text-xs font-medium text-muted">
                {t('customers.table.since', 'Client depuis')}
              </dt>
              <dd className="mt-1 font-medium text-heading">{formatDate(customer.createdAt)}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl border border-line bg-subtle p-3.5">
            <p className="text-xs font-medium text-muted">
              {t('customers.modal.notes', 'Notes additionnelles')}
            </p>
            <p className="mt-1.5 text-sm text-heading whitespace-pre-wrap">
              {customer.notes?.trim() || t('customers.profile.noNotes', 'Aucune note ajoutée.')}
            </p>
          </div>
        </Card>

        {/* Right: Related Projects + Client Activity */}
        <div className="lg:col-span-8 space-y-6">
          {/* Related Projects */}
          <Card padding="lg" className="border border-line bg-panel shadow-2xs">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-heading">
                {t('customers.profile.relatedProjects', 'Projets associés')}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {relatedProjects.length}{' '}
                {relatedProjects.length > 1
                  ? t('customers.profile.projectsCountPlural', 'projets pour ce client')
                  : t('customers.profile.projectsCountSingular', 'projet pour ce client')}
              </p>
            </div>

            {relatedProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-subtle/40 p-6 text-center">
                <p className="text-sm text-soft">
                  {t('customers.profile.noProjects', 'Aucun projet associé à ce client pour le moment.')}
                </p>
                {canListProjects && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => navigate(`/admin/clients/projects?new=1&customerId=${customer.id}`)}
                  >
                    {t('customers.profile.createProject', 'Créer un projet')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-line">
                {relatedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-soft">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-heading truncate">{project.name}</p>
                        <p className="text-xs text-muted">{formatDate(project.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <Badge tone={project.status === 'archived' ? 'neutral' : 'info'}>
                        {project.status === 'archived'
                          ? t('projects.status.archived', 'Archivé')
                          : t('projects.status.active', 'En cours')}
                      </Badge>
                      <Link
                        to={`/admin/clients/projects/${project.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-line bg-subtle px-3 py-1.5 text-xs font-semibold text-heading hover:bg-hover transition-colors"
                      >
                        {t('customers.profile.viewProject', 'Voir le projet')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Client Activity */}
          <CustomerActivityCard customerId={customer.id} />
        </div>
      </div>

      {/* Edit Modal */}
      <ClientFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        client={customer}
      />
    </div>
  );
};
