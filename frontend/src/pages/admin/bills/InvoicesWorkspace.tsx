import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  billsService,
  isDraftInvoice,
  type InvoiceSort,
  type InvoiceStatus,
  type InvoiceSummary,
} from '../../../services/bills.service';
import { useLocalizedDate } from '../../../hooks/useLocalizedDate';

function formatMoney(minor: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format((minor || 0) / 100);
  } catch {
    return `${((minor || 0) / 100).toFixed(2)} ${currency || 'EUR'}`;
  }
}

function customerLabel(inv: InvoiceSummary): string {
  const c = inv.customer;
  if (!c) return `Client #${inv.customerAccountId}`;
  return (
    c.companyName ||
    c.displayName ||
    [c.firstName, c.lastName].filter(Boolean).join(' ') ||
    c.email ||
    `Client #${inv.customerAccountId}`
  );
}

function statusBadge(inv: InvoiceSummary): { label: string; cls: string } {
  if (inv.kind === 'storno') {
    return {
      label: 'Avoir',
      cls: 'bg-subtle text-body',
    };
  }
  if (isDraftInvoice(inv)) {
    return {
      label: 'Brouillon',
      cls: 'bg-subtle text-body',
    };
  }
  switch (inv.status) {
    case 'paid':
      return {
        label: 'Payée',
        cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      };
    case 'overdue':
      return {
        label: 'En retard',
        cls: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
      };
    case 'sent':
      return {
        label: 'Envoyée',
        cls: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
      };
    case 'scheduled':
      return {
        label: 'Programmée',
        cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      };
    case 'pending_delivery':
      return {
        label: 'En attente de livraison',
        cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      };
    case 'cancelled':
      return {
        label: 'Annulée',
        cls: 'bg-subtle text-muted',
      };
    default:
      return {
        label: inv.status,
        cls: 'bg-subtle text-body',
      };
  }
}

export const InvoicesWorkspace: React.FC = () => {
  const { t } = useTranslation();
  const { format: formatDate } = useLocalizedDate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [sort, setSort] = useState<InvoiceSort>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-invoices', search.trim(), statusFilter, sort, page],
    queryFn: () =>
      billsService.list({
        ...(search.trim() ? { q: search.trim() } : {}),
        ...(statusFilter !== 'all' ? { status: [statusFilter] } : {}),
        sort,
        page,
        pageSize,
        includeDrafts: true,
      }),
  });

  const invoices = data?.invoices ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, pageSize, totalPages: 1 };

  const stats = useMemo(() => {
    let totalMinor = 0;
    let paidMinor = 0;
    let overdueCount = 0;
    let currency = invoices[0]?.currency || 'EUR';
    for (const inv of invoices) {
      if (inv.status === 'cancelled' || inv.kind === 'storno') continue;
      currency = inv.currency || currency;
      totalMinor += inv.totalAmountMinor || 0;
      paidMinor += inv.paidAmountMinor || 0;
      if (inv.status === 'overdue') overdueCount += 1;
    }
    return {
      totalMinor,
      paidMinor,
      outstandingMinor: Math.max(0, totalMinor - paidMinor),
      overdueCount,
      currency,
    };
  }, [invoices]);

  const sendMutation = useMutation({
    mutationFn: (id: number) => billsService.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success(t('bills.sentSuccess', 'Facture envoyée au client.'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || t('bills.actionError', 'Action impossible.'));
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (inv: InvoiceSummary) =>
      billsService.markPaid(inv.id, {
        amountMinor: Math.max(0, (inv.totalAmountMinor || 0) - (inv.paidAmountMinor || 0)),
        paymentMethod: 'bank_transfer',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success(t('bills.paidSuccess', 'Paiement enregistré.'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || t('bills.actionError', 'Action impossible.'));
    },
  });

  const reminderMutation = useMutation({
    mutationFn: (id: number) => billsService.sendReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success(t('bills.reminderSuccess', 'Relance envoyée.'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || t('bills.actionError', 'Action impossible.'));
    },
  });

  const handleOpenPdf = async (id: number) => {
    try {
      const url = await billsService.pdfUrl(id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('bills.pdfError', 'Impossible de générer le PDF.'));
    }
  };

  const hasFilter = Boolean(search.trim() || statusFilter !== 'all');

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted mb-1">
            Studio <span className="mx-1">/</span> {t('bills.title', 'Factures')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            {t('bills.title', 'Factures')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('bills.subtitle', 'Émettez vos factures, suivez les encaissements et téléchargez les PDF.')}
          </p>
        </div>

        <Link
          to="/admin/factures/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('bills.create', 'Nouvelle facture')}</span>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-panel border border-line rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted">{t('bills.stats.invoiced', 'Facturé (page)')}</p>
          <p className="text-2xl font-bold text-heading mt-1">
            {formatMoney(stats.totalMinor, stats.currency)}
          </p>
        </div>
        <div className="bg-panel border border-line rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted">{t('bills.stats.collected', 'Encaissé (page)')}</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatMoney(stats.paidMinor, stats.currency)}
          </p>
        </div>
        <div className="bg-panel border border-line rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted">{t('bills.stats.outstanding', 'Reste à percevoir')}</p>
          <p className="text-2xl font-bold text-heading mt-1">
            {formatMoney(stats.outstandingMinor, stats.currency)}
          </p>
          {stats.overdueCount > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {stats.overdueCount} en retard
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('bills.searchPlaceholder', 'Rechercher par numéro ou client…')}
            className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'all' | InvoiceStatus);
            setPage(1);
          }}
          className="h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          aria-label={t('bills.statusFilter', 'Statut')}
        >
          <option value="all">{t('bills.filter.all', 'Tous les statuts')}</option>
          <option value="scheduled">{t('bills.filter.draft', 'Brouillons & Programmées')}</option>
          <option value="sent">{t('bills.filter.sent', 'Envoyées')}</option>
          <option value="paid">{t('bills.filter.paid', 'Payées')}</option>
          <option value="overdue">{t('bills.filter.overdue', 'En retard')}</option>
          <option value="cancelled">{t('bills.filter.cancelled', 'Annulées')}</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as InvoiceSort)}
          className="h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          aria-label={t('bills.sort', 'Trier')}
        >
          <option value="newest">Plus récentes</option>
          <option value="oldest">Plus anciennes</option>
          <option value="due_asc">Échéance la plus proche</option>
          <option value="value_desc">Montant décroissant</option>
        </select>
      </div>

      {/* List states */}
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
                {t('bills.loadError', 'Impossible de charger les factures')}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {t('bills.loadErrorHint', 'Vérifiez votre connexion et réessayez.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel hover:bg-hover px-4 py-2 text-xs font-semibold text-heading cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.retry', 'Réessayer')}</span>
          </button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-panel border border-line rounded-2xl p-10 text-center space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-subtle border border-line mx-auto flex items-center justify-center text-muted">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-heading">
            {hasFilter
              ? t('bills.noMatching', 'Aucune facture ne correspond aux filtres')
              : t('bills.empty', 'Aucune facture pour le moment')}
          </p>
          {!hasFilter && (
            <Link
              to="/admin/factures/new"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('bills.create', 'Nouvelle facture')}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-panel border border-line rounded-2xl divide-y divide-line overflow-hidden shadow-2xs">
          {invoices.map((inv) => {
            const badge = statusBadge(inv);
            const draft = isDraftInvoice(inv);
            const canPay =
              inv.kind !== 'storno' &&
              inv.status !== 'paid' &&
              inv.status !== 'cancelled' &&
              (inv.totalAmountMinor || 0) > (inv.paidAmountMinor || 0);

            return (
              <div
                key={inv.id}
                className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-hover/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Link
                      to={`/admin/factures/${inv.id}`}
                      className="text-sm font-semibold text-heading hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      {inv.invoiceNumber || `Facture #${inv.id}`}
                    </Link>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-sm font-bold text-heading">
                      {formatMoney(inv.totalAmountMinor, inv.currency)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span>{customerLabel(inv)}</span>
                    {inv.eventName && <span>· {inv.eventName}</span>}
                    {inv.issueDate && <span>· Émise le {formatDate(inv.issueDate)}</span>}
                    {inv.dueDate && <span>· Échéance {formatDate(inv.dueDate)}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {draft && (
                    <button
                      type="button"
                      onClick={() => sendMutation.mutate(inv.id)}
                      disabled={sendMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer</span>
                    </button>
                  )}
                  {inv.status === 'overdue' && (
                    <button
                      type="button"
                      onClick={() => reminderMutation.mutate(inv.id)}
                      disabled={reminderMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel hover:bg-hover px-3 py-1.5 text-xs font-medium text-heading cursor-pointer disabled:opacity-50"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Relancer</span>
                    </button>
                  )}
                  {canPay && !draft && (
                    <button
                      type="button"
                      onClick={() => markPaidMutation.mutate(inv)}
                      disabled={markPaidMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel hover:bg-hover px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marquer payée</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleOpenPdf(inv.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel hover:bg-hover px-3 py-1.5 text-xs font-medium text-heading cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <Link
                    to={`/admin/factures/${inv.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel hover:bg-hover px-3 py-1.5 text-xs font-semibold text-heading"
                  >
                    <span>Détails</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted pt-2">
          <span>
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} factures)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-line bg-panel px-3 py-1.5 font-medium text-heading disabled:opacity-40 cursor-pointer"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-line bg-panel px-3 py-1.5 font-medium text-heading disabled:opacity-40 cursor-pointer"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
