import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  AlertCircle,
  Check,
  Copy,
  RefreshCw,
  Search,
  Share2,
  Users,
} from 'lucide-react';
import { fotodeskService } from '../../../services/fotodesk.service';
import { useLocalizedDate } from '../../../hooks/useLocalizedDate';

type AffiliateTab = 'overview' | 'referrals' | 'commissions';

interface ReferredStudio {
  id: number;
  name: string;
  plan_id: string | null;
  status: string;
  created_at: string;
}

interface AffiliateCommissionRow {
  id: number;
  referred_studio_id: number;
  studio_name: string | null;
  plan_id: string | null;
  base_amount_minor: number;
  commission_rate: number;
  commission_minor: number;
  status: 'pending' | 'approved' | 'paid' | string;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
}

interface AffiliateOverviewResponse {
  referralCode: string;
  commissionRate: number;
  stats: {
    referredStudiosCount: number;
    proConversionsCount: number;
    pendingCommissionMinor: number;
    approvedCommissionMinor: number;
    paidCommissionMinor: number;
    totalCommissionMinor: number;
  };
  referredStudios: ReferredStudio[];
  commissions: AffiliateCommissionRow[];
}

function formatEur(minor: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format((minor || 0) / 100);
}

function commissionBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case 'paid':
      return {
        label: 'Payée',
        cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      };
    case 'approved':
      return {
        label: 'Approuvée',
        cls: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
      };
    default:
      return {
        label: 'En attente',
        cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      };
  }
}

export const AdminAffiliatesPage: React.FC = () => {
  const { format: formatDate } = useLocalizedDate();
  const [activeTab, setActiveTab] = useState<AffiliateTab>('overview');
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<'code' | 'link' | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<AffiliateOverviewResponse>({
    queryKey: ['admin-affiliates-overview'],
    queryFn: () => fotodeskService.affiliates.getOverview(),
  });

  const referralCode = data?.referralCode || '';
  const referralUrl = referralCode
    ? `${window.location.origin}/register?ref=${referralCode}`
    : '';

  const copyText = (text: string, key: 'code' | 'link', label: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    toast.success(label);
    window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
  };

  const referredStudios = data?.referredStudios ?? [];
  const commissions = data?.commissions ?? [];
  const stats = data?.stats ?? {
    referredStudiosCount: 0,
    proConversionsCount: 0,
    pendingCommissionMinor: 0,
    approvedCommissionMinor: 0,
    paidCommissionMinor: 0,
    totalCommissionMinor: 0,
  };

  const filteredStudios = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return referredStudios;
    return referredStudios.filter((s) => (s.name || '').toLowerCase().includes(q));
  }, [referredStudios, search]);

  const filteredCommissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return commissions;
    return commissions.filter((c) => (c.studio_name || '').toLowerCase().includes(q));
  }, [commissions, search]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted mb-1">
            Studio <span className="mx-1">/</span> Affiliation
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            Programme d&apos;affiliation
          </h1>
          <p className="text-sm text-muted mt-1">
            Partagez votre lien de parrainage et percevez{' '}
            {Math.round((data?.commissionRate ?? 0.2) * 100)} % sur chaque premier paiement confirmé.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-panel border border-line rounded-2xl p-10 text-center text-sm text-muted">
          Chargement du programme d&apos;affiliation…
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
                Impossible de charger les données d&apos;affiliation
              </p>
              <p className="text-xs text-muted mt-0.5">
                Vérifiez votre connexion et réessayez.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel hover:bg-hover px-4 py-2 text-xs font-semibold text-heading cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : (
        <>
          {/* Referral Link & Code Card */}
          <div className="bg-panel border border-line rounded-2xl p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Share2 className="w-4 h-4" />
                <span>Votre lien de parrainage</span>
              </div>
              <p className="text-xs text-muted">
                Code : <span className="font-mono font-semibold text-heading">{referralCode}</span>
              </p>
              <p className="text-xs font-mono text-body break-all">{referralUrl}</p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => copyText(referralCode, 'code', 'Code de parrainage copié.')}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel hover:bg-hover px-3.5 py-2 text-xs font-semibold text-heading cursor-pointer"
              >
                {copiedKey === 'code' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copier le code</span>
              </button>
              <button
                type="button"
                onClick={() => copyText(referralUrl, 'link', 'Lien de parrainage copié.')}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                {copiedKey === 'link' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copier le lien</span>
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-panel border border-line rounded-2xl p-4 shadow-2xs">
              <p className="text-xs font-medium text-muted">Commission totale</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatEur(stats.totalCommissionMinor)}
              </p>
            </div>
            <div className="bg-panel border border-line rounded-2xl p-4 shadow-2xs">
              <p className="text-xs font-medium text-muted">En attente</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatEur(stats.pendingCommissionMinor)}
              </p>
            </div>
            <div className="bg-panel border border-line rounded-2xl p-4 shadow-2xs">
              <p className="text-xs font-medium text-muted">Approuvées</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatEur(stats.approvedCommissionMinor)}
              </p>
            </div>
            <div className="bg-panel border border-line rounded-2xl p-4 shadow-2xs">
              <p className="text-xs font-medium text-muted">Payées</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatEur(stats.paidCommissionMinor)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="rounded-2xl border border-line bg-panel p-1.5 shadow-2xs flex flex-wrap gap-1">
            {[
              { key: 'overview' as const, label: 'Vue d’ensemble' },
              { key: 'referrals' as const, label: `Filleuls (${referredStudios.length})` },
              { key: 'commissions' as const, label: `Commissions (${commissions.length})` },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-neutral-950 border border-neutral-200/80 shadow-xs dark:bg-neutral-800 dark:text-white dark:border-white/10'
                      : 'text-muted hover:text-heading hover:bg-hover/70 border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Search */}
          {activeTab !== 'overview' && (
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un studio filleul…"
                className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          )}

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-panel border border-line rounded-2xl p-5 shadow-2xs space-y-2">
                <p className="text-xs font-medium text-muted">Studios inscrits via votre lien</p>
                <p className="text-3xl font-bold text-heading">{stats.referredStudiosCount}</p>
              </div>
              <div className="bg-panel border border-line rounded-2xl p-5 shadow-2xs space-y-2">
                <p className="text-xs font-medium text-muted">Conversions Premium confirmées</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.proConversionsCount}
                </p>
              </div>
            </div>
          )}

          {/* Referrals */}
          {activeTab === 'referrals' && (
            <div className="bg-panel border border-line rounded-2xl overflow-hidden shadow-2xs">
              {filteredStudios.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <Users className="w-7 h-7 text-muted mx-auto opacity-60" />
                  <p className="text-sm font-semibold text-heading">Aucun filleul pour le moment</p>
                  <p className="text-xs text-muted">
                    Partagez votre lien pour suivre ici les studios inscrits.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {filteredStudios.map((studio) => (
                    <div
                      key={studio.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-heading">{studio.name}</p>
                        <p className="text-xs text-muted">
                          Inscrit le {formatDate(studio.created_at)}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 self-start sm:self-center">
                        {studio.plan_id === 'pro_monthly' || studio.plan_id === 'pro_yearly'
                          ? 'Premium'
                          : 'Starter'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Commissions */}
          {activeTab === 'commissions' && (
            <div className="bg-panel border border-line rounded-2xl overflow-hidden shadow-2xs">
              {filteredCommissions.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <p className="text-sm font-semibold text-heading">Aucune commission enregistrée</p>
                  <p className="text-xs text-muted">
                    Les commissions apparaissent dès qu&apos;un filleul règle son abonnement Premium.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {filteredCommissions.map((c) => {
                    const badge = commissionBadge(c.status);
                    return (
                      <div
                        key={c.id}
                        className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-heading">
                            {c.studio_name || `Studio #${c.referred_studio_id}`}
                          </p>
                          <p className="text-xs text-muted">
                            Paiement initial {formatEur(c.base_amount_minor)} ·{' '}
                            {formatDate(c.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatEur(c.commission_minor)}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
