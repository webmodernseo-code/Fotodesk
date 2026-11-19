import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CreditCard,
  Percent,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

type AdminSection =
  | 'overview'
  | 'studios'
  | 'users'
  | 'subscriptions'
  | 'affiliates'
  | 'commissions'
  | 'payouts'
  | 'settings';

interface Props {
  onNavigate: (section: AdminSection) => void;
  onOpenStudio: (studioName: string) => void;
}

const RECENT_STUDIOS = [
  {
    id: 'STD-001248',
    initials: 'NS',
    name: 'Northlight Studio',
    owner: 'Alex Morgan',
    email: 'alex@northlight.com',
    plan: 'Pro Mensuel',
    date: '12 nov. 2026',
    status: 'active' as const,
  },
  {
    id: 'STD-001247',
    initials: 'LP',
    name: 'Lumière Photography',
    owner: 'Emma Wilson',
    email: 'emma@lumiere.com',
    plan: 'Starter',
    date: '10 nov. 2026',
    status: 'active' as const,
  },
  {
    id: 'STD-001246',
    initials: 'CH',
    name: 'Capture House',
    owner: 'Daniel Brown',
    email: 'daniel@capturehouse.com',
    plan: 'Pro Annuel',
    date: '08 nov. 2026',
    status: 'active' as const,
  },
  {
    id: 'STD-001245',
    initials: 'SF',
    name: 'Studio Frame',
    owner: 'Sophia Taylor',
    email: 'sophia@studioframe.com',
    plan: 'Starter',
    date: '05 nov. 2026',
    status: 'suspended' as const,
  },
  {
    id: 'STD-001244',
    initials: 'GH',
    name: 'Golden Hour Studio',
    owner: 'James Miller',
    email: 'james@goldenhour.com',
    plan: 'Pro Mensuel',
    date: '02 nov. 2026',
    status: 'active' as const,
  },
];

const REVENUE_MONTHS = [
  { label: 'Juil', monthly: 45, yearly: 28 },
  { label: 'Août', monthly: 52, yearly: 32 },
  { label: 'Sept', monthly: 48, yearly: 36 },
  { label: 'Oct', monthly: 62, yearly: 40 },
  { label: 'Nov', monthly: 70, yearly: 44 },
  { label: 'Déc', monthly: 74, yearly: 48 },
  { label: 'Jan', monthly: 68, yearly: 46 },
  { label: 'Fév', monthly: 76, yearly: 50 },
  { label: 'Mar', monthly: 82, yearly: 54 },
  { label: 'Avr', monthly: 88, yearly: 58 },
  { label: 'Mai', monthly: 95, yearly: 64 },
];

export const SuperAdminOverviewSection: React.FC<Props> = ({ onNavigate, onOpenStudio }) => {
  const [growthRange, setGrowthRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [revenueMode, setRevenueMode] = useState<'both' | 'monthly' | 'yearly'>('both');
  const [studioQuery, setStudioQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  const filteredStudios = RECENT_STUDIOS.filter((s) => {
    if (planFilter !== 'all' && s.plan !== planFilter) return false;
    const q = studioQuery.trim().toLowerCase();
    if (
      q &&
      !s.name.toLowerCase().includes(q) &&
      !s.owner.toLowerCase().includes(q) &&
      !s.email.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  const growthCount = growthRange === '7d' ? 38 : growthRange === '30d' ? 142 : 418;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="banner-info justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>
            Les indicateurs de la plateforme reflètent l&apos;activité consolidée des studios FotoDesk.
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('studios')}
          className="font-semibold hover:underline shrink-0 inline-flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </button>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('studios')}
          className="bg-panel border border-line rounded-2xl p-5 text-left hover:border-neutral-400 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-subtle border border-line flex items-center justify-center text-heading">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="badge-success">+8,2 %</span>
          </div>
          <p className="text-xs text-muted mt-3">Total des studios</p>
          <p className="text-2xl font-bold text-heading mt-0.5">1 248</p>
          <p className="text-xs text-muted mt-1">Studios photo enregistrés sur la plateforme</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('users')}
          className="bg-panel border border-line rounded-2xl p-5 text-left hover:border-neutral-400 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-subtle border border-line flex items-center justify-center text-heading">
              <Users className="w-4 h-4" />
            </div>
            <span className="badge-success">+12,4 %</span>
          </div>
          <p className="text-xs text-muted mt-3">Total des utilisateurs</p>
          <p className="text-2xl font-bold text-heading mt-0.5">2 840</p>
          <p className="text-xs text-muted mt-1">Comptes utilisateurs enregistrés</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('subscriptions')}
          className="bg-panel border border-line rounded-2xl p-5 text-left hover:border-neutral-400 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-subtle border border-line flex items-center justify-center text-heading">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="badge-success">+4,7 %</span>
          </div>
          <p className="text-xs text-muted mt-3">Abonnements actifs</p>
          <p className="text-2xl font-bold text-heading mt-0.5">684</p>
          <p className="text-xs text-muted mt-1">Souscriptions payantes actives</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('subscriptions')}
          className="bg-panel border border-line rounded-2xl p-5 text-left hover:border-neutral-400 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-subtle border border-line flex items-center justify-center text-heading">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="badge-success">+6,9 %</span>
          </div>
          <p className="text-xs text-muted mt-3">Revenu mensuel récurrent (MRR)</p>
          <p className="text-2xl font-bold text-heading mt-0.5">€6 771,60</p>
          <p className="text-xs text-muted mt-1">Revenu mensuel récurrent estimé</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('affiliates')}
          className="bg-panel border border-line rounded-2xl p-5 text-left hover:border-neutral-400 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-subtle border border-line flex items-center justify-center text-heading">
              <Percent className="w-4 h-4" />
            </div>
            <span className="badge-success">+14,2 %</span>
          </div>
          <p className="text-xs text-muted mt-3">Total des affiliés</p>
          <p className="text-2xl font-bold text-heading mt-0.5">328</p>
          <p className="text-xs text-muted mt-1">Comptes affiliés enregistrés</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('payouts')}
          className="bg-panel border border-line rounded-2xl p-5 text-left hover:border-neutral-400 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-subtle border border-line flex items-center justify-center text-heading">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="badge-warning">À valider</span>
          </div>
          <p className="text-xs text-muted mt-3">Paiements en attente</p>
          <p className="text-2xl font-bold text-heading mt-0.5">€1 240,00</p>
          <p className="text-xs text-muted mt-1">Commissions en attente de versement</p>
        </button>
      </div>

      {/* Platform Growth */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-heading">Croissance de la plateforme</h2>
            <p className="text-xs text-muted">Suivez la croissance et l&apos;activité de FotoDesk.</p>
          </div>
          <div className="inline-flex bg-panel border border-line rounded-xl p-1 text-xs">
            {[
              { id: '7d' as const, label: '7 jours' },
              { id: '30d' as const, label: '30 jours' },
              { id: '90d' as const, label: '90 jours' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setGrowthRange(r.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  growthRange === r.id ? 'bg-subtle text-heading font-semibold' : 'text-muted hover:text-heading'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Line Chart Card */}
          <div className="lg:col-span-2 bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-heading">Croissance des studios</h3>
                <p className="text-xs text-muted">Nouvelles inscriptions et croissance totale</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-heading">{growthCount}</span>
                  <span className="badge-success">+8,2 %</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white" />
                  Nouveaux studios
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  Tendance
                </span>
              </div>
            </div>

            <div className="h-44 w-full">
              <svg viewBox="0 0 600 160" className="w-full h-full overflow-visible">
                {[30, 65, 100, 135].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="600"
                    y2={y}
                    stroke="currentColor"
                    className="text-line"
                    strokeDasharray="3 3"
                  />
                ))}
                <path
                  d="M 10 132 C 80 120, 130 118, 190 105 C 250 92, 310 95, 370 76 C 430 58, 500 62, 585 26"
                  fill="none"
                  stroke="#211E1A"
                  className="dark:stroke-neutral-100"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="585" cy="26" r="4" fill="#211E1A" className="dark:fill-neutral-100" />
              </svg>
            </div>
          </div>

          {/* Donut Distribution */}
          <div className="bg-panel border border-line rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-heading">Répartition des abonnements</h3>
                <p className="text-xs text-muted">Studios par offre actuelle</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('subscriptions')}
                className="text-xs text-muted hover:text-heading"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-5 my-4">
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-line" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#24558B"
                    strokeWidth="4"
                    strokeDasharray="67 100"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#1F623F"
                    strokeWidth="4"
                    strokeDasharray="13 100"
                    strokeDashoffset="-67"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#211E1A"
                    strokeWidth="4"
                    strokeDasharray="10 100"
                    strokeDashoffset="-80"
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-base font-bold text-heading">732</p>
                  <p className="text-[10px] text-muted">Studios</p>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-soft">Starter</span>
                  <span className="font-semibold text-heading">564 <span className="text-muted font-normal">77%</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-soft">Pro Mensuel</span>
                  <span className="font-semibold text-heading">96 <span className="text-muted font-normal">13%</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-soft">Pro Annuel</span>
                  <span className="font-semibold text-heading">72 <span className="text-muted font-normal">10%</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Overview Bar Chart */}
      <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-heading">Aperçu des revenus</h3>
            <p className="text-xs text-muted">Revenus mensuels vs annuels estimés</p>
          </div>
          <div className="inline-flex bg-subtle border border-line rounded-xl p-1 text-xs">
            {[
              { id: 'both' as const, label: 'Tous' },
              { id: 'monthly' as const, label: 'Mensuel' },
              { id: 'yearly' as const, label: 'Annuel' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setRevenueMode(m.id)}
                className={`px-3 py-1 rounded-lg font-medium ${
                  revenueMode === m.id ? 'bg-panel text-heading font-semibold shadow-2xs' : 'text-muted'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-8">
          <div>
            <p className="text-xs text-muted">Revenu mensuel</p>
            <p className="text-xl font-bold text-heading mt-0.5">€6 771,60</p>
          </div>
          <div>
            <p className="text-xs text-muted">Revenu annuel</p>
            <p className="text-xl font-bold text-heading mt-0.5">€7 128,00</p>
          </div>
        </div>

        <div className="h-44 flex items-end justify-between gap-2 pt-4 border-t border-line/60">
          {REVENUE_MONTHS.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-1 h-32">
                {revenueMode !== 'yearly' && (
                  <div
                    className="w-2.5 sm:w-3.5 rounded-t-md bg-neutral-300 dark:bg-neutral-600 transition-all"
                    style={{ height: `${m.yearly}%` }}
                  />
                )}
                {revenueMode !== 'monthly' && (
                  <div
                    className="w-2.5 sm:w-3.5 rounded-t-md bg-neutral-900 dark:bg-neutral-100 transition-all"
                    style={{ height: `${m.monthly}%` }}
                  />
                )}
              </div>
              <span className="text-[11px] text-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-heading">Aperçu des abonnements</h2>
            <p className="text-xs text-muted">Vue consolidée des studios sur les offres FotoDesk.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('subscriptions')}
            className="btn-outline text-xs py-1.5 px-3"
          >
            Voir les souscriptions <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-panel border border-line rounded-2xl p-4 space-y-2 shadow-xs">
            <p className="text-xs font-semibold text-heading">Starter</p>
            <p className="text-[11px] text-muted">Gratuit</p>
            <p className="text-xl font-bold text-heading pt-1">564 <span className="text-xs font-normal text-muted">Studios</span></p>
            <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
              <div className="h-full bg-neutral-400 rounded-full" style={{ width: '77%' }} />
            </div>
            <p className="text-[11px] text-muted">77% du total des abonnements</p>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-4 space-y-2 shadow-xs">
            <p className="text-xs font-semibold text-heading">Pro Mensuel</p>
            <p className="text-[11px] text-muted">€9,90 / mois</p>
            <p className="text-xl font-bold text-heading pt-1">96 <span className="text-xs font-normal text-muted">Studios</span></p>
            <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
              <div className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full" style={{ width: '13%' }} />
            </div>
            <p className="text-[11px] text-muted">13% du total des abonnements</p>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-4 space-y-2 shadow-xs">
            <p className="text-xs font-semibold text-heading">Pro Annuel</p>
            <p className="text-[11px] text-muted">€99 / an</p>
            <p className="text-xl font-bold text-heading pt-1">72 <span className="text-xs font-normal text-muted">Studios</span></p>
            <div className="h-1.5 bg-subtle rounded-full overflow-hidden">
              <div className="h-full bg-neutral-700 dark:bg-neutral-300 rounded-full" style={{ width: '10%' }} />
            </div>
            <p className="text-[11px] text-muted">10% du total des abonnements</p>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs">
            <p className="text-2xl font-bold text-heading">732</p>
            <p className="text-xs text-muted">Studios</p>
            <p className="text-[11px] text-muted mt-2">Répartition sur 732 studios abonnés</p>
          </div>
        </div>
      </div>

      {/* Recent Studio Registrations */}
      <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-heading">Inscriptions récentes de studios</h2>
            <p className="text-xs text-muted">Les derniers studios inscrits sur la plateforme FotoDesk.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('studios')}
            className="btn-outline text-xs py-1.5 px-3"
          >
            Voir tous les studios <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 border-b border-line flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={studioQuery}
              onChange={(e) => setStudioQuery(e.target.value)}
              placeholder="Rechercher des studios..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:border-neutral-400"
            />
          </div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
          >
            <option value="all">Toutes les offres</option>
            <option value="Starter">Starter</option>
            <option value="Pro Mensuel">Pro Mensuel</option>
            <option value="Pro Annuel">Pro Annuel</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="py-3 px-5">Studio</th>
                <th className="py-3 px-4">Propriétaire</th>
                <th className="py-3 px-4">Offre</th>
                <th className="py-3 px-4">Date d&apos;inscription</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredStudios.map((s) => (
                <tr key={s.id} className="hover:bg-subtle/40 transition-colors">
                  <td className="py-3 px-5 font-semibold text-heading whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-subtle border border-line text-[11px] font-bold flex items-center justify-center">
                        {s.initials}
                      </span>
                      {s.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="text-xs font-medium text-heading">{s.owner}</p>
                    <p className="text-[11px] text-muted">{s.email}</p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={s.plan === 'Pro Annuel' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium px-2.5 py-0.5 rounded-full' : 'badge-neutral'}>
                      {s.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-soft whitespace-nowrap">{s.date}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={s.status === 'active' ? 'badge-success' : 'badge-danger'}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {s.status === 'active' ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenStudio(s.name)}
                      className="text-xs font-medium text-heading hover:underline inline-flex items-center gap-1"
                    >
                      Voir le studio <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity + Platform Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-bold text-heading">Activité récente de la plateforme</h3>
          <div className="divide-y divide-line/60 text-xs">
            {[
              { title: 'Nouveau studio inscrit', sub: 'Northlight Studio', time: "Aujourd'hui, 10:42" },
              { title: 'Passage en offre Pro Mensuel', sub: 'Lumière Photography', time: "Aujourd'hui, 09:15" },
              { title: 'Souscription Pro Annuel activée', sub: 'Capture House', time: 'Hier, 16:22' },
              { title: 'Nouveau parrainage affilié converti', sub: 'Parrainage #AFF-3028', time: 'Hier, 14:15' },
              { title: 'Commission enregistrée', sub: 'Commission #CM-1842', time: '22 mai, 11:30' },
            ].map((item, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-heading">{item.title}</p>
                  <p className="text-muted">{item.sub}</p>
                </div>
                <span className="text-muted shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-bold text-heading">Alertes de la plateforme</h3>
          <div className="space-y-2.5 text-xs">
            {[
              { label: 'Virements en attente', sub: 'Demandes à valider', count: 5, badge: 'badge-warning', target: 'payouts' as const },
              { label: 'Problèmes de souscription', sub: 'Paiements nécessitant attention', count: 2, badge: 'badge-danger', target: 'subscriptions' as const },
              { label: 'Nouvelles inscriptions', sub: 'Nouveaux studios cette semaine', count: 14, badge: 'badge-info', target: 'studios' as const },
              { label: 'Mises à jour de commissions', sub: 'Nouveaux relevés disponibles', count: 8, badge: 'badge-neutral', target: 'commissions' as const },
            ].map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => onNavigate(a.target)}
                className="w-full bg-subtle/60 hover:bg-subtle border border-line rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-soft shrink-0" />
                  <div>
                    <p className="font-semibold text-heading">{a.label}</p>
                    <p className="text-muted">{a.sub}</p>
                  </div>
                </div>
                <span className={a.badge}>{a.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-heading">Accès rapide</h3>
          <p className="text-xs text-muted">Accédez directement aux sections clés de la plateforme.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Gérer les studios', target: 'studios' as const, icon: Building2 },
            { label: 'Gérer les utilisateurs', target: 'users' as const, icon: Users },
            { label: 'Voir les souscriptions', target: 'subscriptions' as const, icon: CreditCard },
            { label: 'Gérer les affiliés', target: 'affiliates' as const, icon: Percent },
            { label: 'Voir les commissions', target: 'commissions' as const, icon: TrendingUp },
            { label: 'Voir les virements', target: 'payouts' as const, icon: Wallet },
          ].map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.label}
                type="button"
                onClick={() => onNavigate(q.target)}
                className="bg-subtle/60 hover:bg-subtle border border-line rounded-xl p-3 text-left space-y-2 transition-colors"
              >
                <Icon className="w-4 h-4 text-heading" />
                <p className="text-xs font-semibold text-heading">{q.label}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
