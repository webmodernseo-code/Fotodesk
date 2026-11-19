import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Mail,
  Percent,
  Search,
  Users,
  X,
} from 'lucide-react';

type AffiliateStatus = 'active' | 'suspended';

interface AffiliateRow {
  id: string;
  initials: string;
  name: string;
  email: string;
  studioName: string;
  registeredAt: string;
  clicks: number;
  referrals: number;
  conversions: number;
  conversionRate: number;
  earnedEur: number;
  pendingEur: number;
  approvedEur: number;
  paidEur: number;
  status: AffiliateStatus;
  refSlug: string;
}

const INITIAL_AFFILIATES: AffiliateRow[] = [
  {
    id: 'AFF-001238',
    initials: 'OD',
    name: 'Olivia Davis',
    email: 'olivia@pixelhouse.com',
    studioName: 'Pixel House',
    registeredAt: '15 août 2026',
    clicks: 135,
    referrals: 19,
    conversions: 6,
    conversionRate: 31.6,
    earnedEur: 29.7,
    pendingEur: 9.9,
    approvedEur: 9.9,
    paidEur: 9.9,
    status: 'active',
    refSlug: 'olivia-davis',
  },
  {
    id: 'AFF-001237',
    initials: 'JM',
    name: 'James Miller',
    email: 'james@goldenhour.com',
    studioName: 'Golden Hour Studio',
    registeredAt: '03 août 2026',
    clicks: 268,
    referrals: 26,
    conversions: 8,
    conversionRate: 30.8,
    earnedEur: 69.3,
    pendingEur: 9.9,
    approvedEur: 19.8,
    paidEur: 39.6,
    status: 'suspended',
    refSlug: 'james-miller',
  },
  {
    id: 'AFF-001236',
    initials: 'DB',
    name: 'Daniel Brown',
    email: 'daniel@capturehouse.com',
    studioName: 'Capture House',
    registeredAt: '19 juil. 2026',
    clicks: 412,
    referrals: 38,
    conversions: 17,
    conversionRate: 44.7,
    earnedEur: 178.2,
    pendingEur: 19.8,
    approvedEur: 39.6,
    paidEur: 118.8,
    status: 'active',
    refSlug: 'daniel-brown',
  },
  {
    id: 'AFF-001235',
    initials: 'EW',
    name: 'Emma Wilson',
    email: 'emma@lumiere.com',
    studioName: 'Lumière Photography',
    registeredAt: '10 juil. 2026',
    clicks: 190,
    referrals: 21,
    conversions: 7,
    conversionRate: 33.3,
    earnedEur: 49.5,
    pendingEur: 9.9,
    approvedEur: 19.8,
    paidEur: 19.8,
    status: 'active',
    refSlug: 'emma-wilson',
  },
];

interface Props {
  onOpenStudio: (studioName: string) => void;
}

export const SuperAdminAffiliatesSection: React.FC<Props> = ({ onOpenStudio }) => {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>(INITIAL_AFFILIATES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AffiliateStatus>('all');
  const [perfFilter, setPerfFilter] = useState<'all' | 'high' | 'mid'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rate' | 'earned'>('newest');

  const [suspendTarget, setSuspendTarget] = useState<AffiliateRow | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const selectedAffiliate = useMemo(
    () => affiliates.find((a) => a.id === selectedId) ?? null,
    [affiliates, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return affiliates
      .filter((a) => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (perfFilter === 'high' && a.conversionRate < 40) return false;
        if (perfFilter === 'mid' && (a.conversionRate < 25 || a.conversionRate >= 40)) return false;
        if (
          q &&
          !a.name.toLowerCase().includes(q) &&
          !a.email.toLowerCase().includes(q) &&
          !a.studioName.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rate') return b.conversionRate - a.conversionRate;
        if (sortBy === 'earned') return b.earnedEur - a.earnedEur;
        return b.id.localeCompare(a.id);
      });
  }, [affiliates, search, statusFilter, perfFilter, sortBy]);

  const handleConfirmSuspend = () => {
    if (!suspendTarget) return;
    if (!suspendReason.trim()) {
      setSuspendError('Veuillez indiquer une raison.');
      return;
    }
    const nextStatus: AffiliateStatus = suspendTarget.status === 'suspended' ? 'active' : 'suspended';
    setAffiliates((prev) =>
      prev.map((a) => (a.id === suspendTarget.id ? { ...a, status: nextStatus } : a))
    );
    setSuspendTarget(null);
    setSuspendReason('');
    setSuspendError(null);
    showToast(
      nextStatus === 'suspended' ? 'Affilié suspendu avec succès.' : 'Affilié réactivé avec succès.'
    );
  };

  function renderModalsAndToast() {
    return (
      <>
        {suspendTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-subtle border border-line flex items-center justify-center text-heading">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-heading">
                    {suspendTarget.status === 'suspended'
                      ? 'Réactiver cet affilié ?'
                      : 'Suspendre cet affilié ?'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSuspendTarget(null)}
                  className="w-8 h-8 rounded-full bg-subtle text-muted hover:text-heading flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-soft">
                Confirmez-vous la modification d&apos;accès affilié pour{' '}
                <strong className="text-heading">{suspendTarget.name}</strong> ?
              </p>
              <div>
                <label className="block text-xs font-medium text-heading mb-1.5">
                  Raison du changement <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => {
                    setSuspendReason(e.target.value);
                    setSuspendError(null);
                  }}
                  placeholder="Saisissez le motif..."
                  className="w-full p-3 text-sm bg-panel border border-line rounded-xl text-heading focus:outline-none focus:border-neutral-500"
                />
                {suspendError && <p className="text-xs text-red-600 mt-1">{suspendError}</p>}
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setSuspendTarget(null)} className="btn-outline text-sm">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  className={suspendTarget.status === 'suspended' ? 'btn-primary text-sm' : 'btn-danger text-sm'}
                >
                  {suspendTarget.status === 'suspended' ? 'Réactiver' : 'Confirmer la suspension'}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-5 right-5 z-50 bg-panel border border-line rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--sem-success-fg)' }} />
            <p className="text-xs font-medium text-heading">{toast}</p>
          </div>
        )}
      </>
    );
  }

  // DETAIL VIEW
  if (selectedAffiliate) {
    const refUrl = `https://fotodesk.app/ref/${selectedAffiliate.refSlug}`;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-heading hover:underline"
          >
            Affiliés
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{selectedAffiliate.name}</span>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-subtle border border-line font-bold text-heading flex items-center justify-center shrink-0">
              {selectedAffiliate.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-heading">{selectedAffiliate.name}</h2>
                <span className={selectedAffiliate.status === 'active' ? 'badge-success' : 'badge-danger'}>
                  {selectedAffiliate.status === 'active' ? 'Actif' : 'Suspendu'}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                {selectedAffiliate.id} · {selectedAffiliate.email} · {selectedAffiliate.studioName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSuspendTarget(selectedAffiliate);
              setSuspendReason('');
              setSuspendError(null);
            }}
            className={
              selectedAffiliate.status === 'suspended'
                ? 'btn-primary text-xs py-2 px-3.5'
                : 'btn-danger text-xs py-2 px-3.5'
            }
          >
            {selectedAffiliate.status === 'suspended' ? "Réactiver l'affilié" : "Suspendre l'affilié"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-heading">Informations de parrainage</h3>
                <p className="text-xs text-muted">Activité associée à ce compte photographe.</p>
              </div>
              <div className="bg-subtle border border-line rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted">Lien de parrainage unique</p>
                  <p className="text-xs font-semibold text-heading truncate">{refUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(refUrl);
                    showToast('Lien de parrainage copié.');
                  }}
                  className="btn-outline text-xs py-1.5 px-3"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copier le lien
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Clics totaux', val: selectedAffiliate.clicks },
                  { label: 'Comptes parrainés', val: selectedAffiliate.referrals },
                  { label: 'Conversions', val: selectedAffiliate.conversions },
                  { label: 'Taux de conversion', val: `${selectedAffiliate.conversionRate}%` },
                ].map((s) => (
                  <div key={s.label} className="bg-subtle border border-line rounded-xl p-3.5">
                    <p className="text-[11px] text-muted">{s.label}</p>
                    <p className="text-lg font-bold text-heading mt-0.5">{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-line">
                <h3 className="text-base font-bold text-heading">Historique des parrainages</h3>
                <p className="text-xs text-muted">Studios inscrits via ce lien d&apos;affiliation.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <th className="py-3 px-5">Studio parrainé</th>
                      <th className="py-3 px-4">Propriétaire</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Offre</th>
                      <th className="py-3 px-5">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    <tr>
                      <td className="py-3 px-5 font-semibold text-heading">Kindred Images</td>
                      <td className="py-3 px-4 text-soft">Sofia Green</td>
                      <td className="py-3 px-4 text-soft">10 nov. 2026</td>
                      <td className="py-3 px-4"><span className="badge-neutral">Pro Mensuel</span></td>
                      <td className="py-3 px-5"><span className="badge-success">Converti</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-semibold text-heading">Paper Sky Photo</td>
                      <td className="py-3 px-4 text-soft">Jack Adams</td>
                      <td className="py-3 px-4 text-soft">01 nov. 2026</td>
                      <td className="py-3 px-4"><span className="badge-neutral">Starter</span></td>
                      <td className="py-3 px-5"><span className="badge-neutral">Non converti</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs text-xs">
              <h3 className="text-sm font-bold text-heading">Profil affilié</h3>
              <div className="space-y-2 pt-1">
                <p className="flex items-center gap-2 text-soft">
                  <Mail className="w-3.5 h-3.5 text-muted" />
                  {selectedAffiliate.email}
                </p>
                <p className="flex items-center gap-2 text-soft">
                  <Building2 className="w-3.5 h-3.5 text-muted" />
                  {selectedAffiliate.studioName}
                </p>
                <p className="flex items-center gap-2 text-soft">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  Inscrit le {selectedAffiliate.registeredAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenStudio(selectedAffiliate.studioName)}
                className="btn-outline w-full justify-center text-xs mt-2"
              >
                Voir le studio <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs text-xs">
              <h3 className="text-sm font-bold text-heading">Résumé des commissions</h3>
              <p className="text-2xl font-bold text-heading">€{selectedAffiliate.earnedEur.toFixed(2)}</p>
              <p className="text-muted">20 % du premier paiement d&apos;abonnement réussi</p>
              <div className="space-y-1.5 pt-2 border-t border-line">
                <div className="flex justify-between">
                  <span className="text-muted">En attente</span>
                  <span className="font-semibold text-heading">€{selectedAffiliate.pendingEur.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Approuvées</span>
                  <span className="font-semibold text-heading">€{selectedAffiliate.approvedEur.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Payées</span>
                  <span className="font-semibold text-heading">€{selectedAffiliate.paidEur.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {renderModalsAndToast()}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <div className="banner-info">
        Chaque photographe reçoit un accès affilié par défaut, sans inscription séparée.
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total des affiliés', value: '1 240', sub: 'Photographes affiliés' },
          { label: 'Affiliés actifs', value: '980', sub: 'Comptes actifs' },
          { label: 'Parrainages totaux', value: '3 450', sub: 'Studios parrainés' },
          { label: 'Parrainages convertis', value: '1 180', sub: 'Premiers paiements réussis' },
          { label: 'Commissions en attente', value: '€2 450', sub: 'En attente de validation' },
        ].map((k) => (
          <div key={k.label} className="bg-panel border border-line rounded-2xl p-4 shadow-xs space-y-1">
            <Users className="w-4 h-4 text-muted" />
            <p className="text-xs text-muted pt-1">{k.label}</p>
            <p className="text-2xl font-bold text-heading">{k.value}</p>
            <p className="text-[11px] text-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Affiliate Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-heading">Aperçu des parrainages</h3>
              <p className="text-xs text-muted">6 derniers mois</p>
            </div>
            <span className="badge-success">Taux 34,2 %</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-subtle border border-line rounded-xl p-3">
              <p className="text-muted">Clics</p>
              <p className="text-base font-bold text-heading">12 480</p>
            </div>
            <div className="bg-subtle border border-line rounded-xl p-3">
              <p className="text-muted">Studios parrainés</p>
              <p className="text-base font-bold text-heading">3 450</p>
            </div>
            <div className="bg-subtle border border-line rounded-xl p-3">
              <p className="text-muted">Conversions</p>
              <p className="text-base font-bold text-heading">1 180</p>
            </div>
            <div className="bg-subtle border border-line rounded-xl p-3">
              <p className="text-muted">Conversion</p>
              <p className="text-base font-bold text-heading">34,2 %</p>
            </div>
          </div>
          <div className="h-36 flex items-end justify-between gap-3 pt-2">
            {[
              { m: 'Juin', h: 38 },
              { m: 'Juil', h: 48 },
              { m: 'Août', h: 56 },
              { m: 'Sept', h: 64 },
              { m: 'Oct', h: 78 },
              { m: 'Nov', h: 92 },
            ].map((b) => (
              <div key={b.m} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className="w-8 sm:w-10 rounded-t-lg bg-neutral-900 dark:bg-neutral-100"
                  style={{ height: `${b.h}%` }}
                />
                <span className="text-[11px] text-muted">{b.m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-heading">Entonnoir de conversion</h3>
            <p className="text-xs text-muted">Du clic au premier paiement</p>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="bg-subtle border border-line rounded-xl p-3 flex justify-between">
              <span className="text-soft">Clics</span>
              <span className="font-bold text-heading">12 480 (100%)</span>
            </div>
            <div className="bg-subtle border border-line rounded-xl p-3 flex justify-between">
              <span className="text-soft">Comptes parrainés</span>
              <span className="font-bold text-heading">3 450 (27,6%)</span>
            </div>
            <div className="bg-subtle border border-line rounded-xl p-3 flex justify-between">
              <span className="text-soft">Premiers paiements</span>
              <span className="font-bold text-heading">1 180 (34,2%)</span>
            </div>
          </div>
          <div className="banner-info">
            <Percent className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Commission de 20 % sur le premier abonnement payé uniquement.</span>
          </div>
        </div>
      </div>

      {/* All Affiliates Table */}
      <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-line space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-heading">Tous les affiliés</h2>
              <p className="text-xs text-muted">Consultez les comptes affiliés et leurs performances.</p>
            </div>
            <span className="text-xs text-muted">{filtered.length} résultats</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un affilié, e-mail ou studio..."
                className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | AffiliateStatus)}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
              </select>
              <select
                value={perfFilter}
                onChange={(e) => setPerfFilter(e.target.value as 'all' | 'high' | 'mid')}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Toutes performances</option>
                <option value="high">40 %+ conversion</option>
                <option value="mid">25–39 % conversion</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'rate' | 'earned')}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="newest">Plus récents</option>
                <option value="rate">Meilleur taux</option>
                <option value="earned">Plus de gains</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="py-3 px-5">Affilié</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Studio associé</th>
                <th className="py-3 px-4">Parrainages</th>
                <th className="py-3 px-4">Conversions</th>
                <th className="py-3 px-4">Taux</th>
                <th className="py-3 px-4">Gains</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-subtle/40">
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-subtle border border-line text-xs font-bold flex items-center justify-center">
                        {a.initials}
                      </span>
                      <div>
                        <p className="font-semibold text-heading">{a.name}</p>
                        <p className="text-[11px] text-muted">{a.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{a.email}</td>
                  <td className="py-3.5 px-4 font-medium text-heading whitespace-nowrap">{a.studioName}</td>
                  <td className="py-3.5 px-4 text-heading">{a.referrals}</td>
                  <td className="py-3.5 px-4 text-heading">{a.conversions}</td>
                  <td className="py-3.5 px-4 text-heading">{a.conversionRate}%</td>
                  <td className="py-3.5 px-4 font-semibold text-heading">€{a.earnedEur.toFixed(2)}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={a.status === 'active' ? 'badge-success' : 'badge-danger'}>
                      {a.status === 'active' ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedId(a.id)}
                      className="text-xs font-semibold text-heading hover:underline"
                    >
                      Voir les détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t border-line flex items-center justify-between text-xs text-muted">
          <span>Affichage 1–{filtered.length} sur {filtered.length}</span>
          <div className="flex items-center gap-1.5">
            <span className="w-8 h-8 rounded-lg border border-line flex items-center justify-center opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </span>
            <span className="w-8 h-8 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold flex items-center justify-center">
              1
            </span>
            <span className="w-8 h-8 rounded-lg border border-line flex items-center justify-center opacity-40">
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {renderModalsAndToast()}
    </div>
  );
};

