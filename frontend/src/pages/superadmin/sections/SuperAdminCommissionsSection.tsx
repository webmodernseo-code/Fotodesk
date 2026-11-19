import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Percent,
  Search,
  Wallet,
} from 'lucide-react';

type CommissionStatus = 'pending' | 'approved' | 'paid';

interface CommissionRow {
  ref: string;
  affiliateName: string;
  affiliateInitials: string;
  affiliateId: string;
  affiliateEmail: string;
  affiliateStudio: string;
  referredStudio: string;
  referredStudioId: string;
  referredOwner: string;
  plan: 'Pro Mensuel' | 'Pro Annuel';
  firstPaymentEur: number;
  rate: number;
  commissionEur: number;
  status: CommissionStatus;
  date: string;
  paymentRef: string;
  payoutRef: string;
}

const INITIAL_COMMISSIONS: CommissionRow[] = [
  {
    ref: 'COM-2026-001',
    affiliateName: 'Alex Morgan',
    affiliateInitials: 'AM',
    affiliateId: 'AFF-001230',
    affiliateEmail: 'alex@northlight.com',
    affiliateStudio: 'Northlight Studio',
    referredStudio: 'Studio Frame',
    referredStudioId: 'STD-001245',
    referredOwner: 'Sophia Taylor',
    plan: 'Pro Mensuel',
    firstPaymentEur: 9.9,
    rate: 20,
    commissionEur: 1.98,
    status: 'paid',
    date: '18 nov. 2026',
    paymentRef: 'INV-2026-2241',
    payoutRef: 'PAY-2026-001',
  },
  {
    ref: 'COM-2026-002',
    affiliateName: 'Emma Wilson',
    affiliateInitials: 'EW',
    affiliateId: 'AFF-001235',
    affiliateEmail: 'emma@lumiere.com',
    affiliateStudio: 'Lumière Photography',
    referredStudio: 'Velvet Lens',
    referredStudioId: 'STD-001250',
    referredOwner: 'Mia Laurent',
    plan: 'Pro Annuel',
    firstPaymentEur: 99,
    rate: 20,
    commissionEur: 19.8,
    status: 'pending',
    date: '16 nov. 2026',
    paymentRef: 'INV-2026-2239',
    payoutRef: '—',
  },
  {
    ref: 'COM-2026-003',
    affiliateName: 'Daniel Brown',
    affiliateInitials: 'DB',
    affiliateId: 'AFF-001236',
    affiliateEmail: 'daniel@capturehouse.com',
    affiliateStudio: 'Capture House',
    referredStudio: 'Sunlit Frames',
    referredStudioId: 'STD-001249',
    referredOwner: 'Lucas Martin',
    plan: 'Pro Mensuel',
    firstPaymentEur: 9.9,
    rate: 20,
    commissionEur: 1.98,
    status: 'approved',
    date: '14 nov. 2026',
    paymentRef: 'INV-2026-2234',
    payoutRef: 'PAY-2026-006',
  },
  {
    ref: 'COM-2026-004',
    affiliateName: 'James Miller',
    affiliateInitials: 'JM',
    affiliateId: 'AFF-001237',
    affiliateEmail: 'james@goldenhour.com',
    affiliateStudio: 'Golden Hour Studio',
    referredStudio: 'Atelier Nova',
    referredStudioId: 'STD-001242',
    referredOwner: 'Chloe Bernard',
    plan: 'Pro Annuel',
    firstPaymentEur: 99,
    rate: 20,
    commissionEur: 19.8,
    status: 'paid',
    date: '11 nov. 2026',
    paymentRef: 'INV-2026-2228',
    payoutRef: 'PAY-2026-001',
  },
  {
    ref: 'COM-2026-005',
    affiliateName: 'Olivia Davis',
    affiliateInitials: 'OD',
    affiliateId: 'AFF-001238',
    affiliateEmail: 'olivia@pixelhouse.com',
    affiliateStudio: 'Pixel House',
    referredStudio: 'Kindred Images',
    referredStudioId: 'STD-001241',
    referredOwner: 'Sofia Green',
    plan: 'Pro Mensuel',
    firstPaymentEur: 9.9,
    rate: 20,
    commissionEur: 1.98,
    status: 'pending',
    date: '09 nov. 2026',
    paymentRef: 'INV-2026-2220',
    payoutRef: '—',
  },
];

interface Props {
  onOpenStudio: (studioName: string) => void;
  onOpenPayouts: () => void;
}

export const SuperAdminCommissionsSection: React.FC<Props> = ({
  onOpenStudio,
  onOpenPayouts,
}) => {
  const [commissions, setCommissions] = useState<CommissionRow[]>(INITIAL_COMMISSIONS);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CommissionStatus>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'Pro Mensuel' | 'Pro Annuel'>('all');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const selected = useMemo(
    () => commissions.find((c) => c.ref === selectedRef) ?? null,
    [commissions, selectedRef]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return commissions.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (planFilter !== 'all' && c.plan !== planFilter) return false;
      if (
        q &&
        !c.ref.toLowerCase().includes(q) &&
        !c.affiliateName.toLowerCase().includes(q) &&
        !c.referredStudio.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [commissions, search, statusFilter, planFilter]);

  const badgeFor = (status: CommissionStatus) => {
    if (status === 'paid') return <span className="badge-success">Payée</span>;
    if (status === 'approved') return <span className="badge-info">Approuvée</span>;
    return <span className="badge-warning">En attente</span>;
  };

  const handleApprove = (ref: string) => {
    setCommissions((prev) =>
      prev.map((c) => (c.ref === ref ? { ...c, status: 'approved' } : c))
    );
    showToast(`Commission ${ref} approuvée.`);
  };

  // DETAIL VIEW
  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <button
            type="button"
            onClick={() => setSelectedRef(null)}
            className="text-heading hover:underline"
          >
            Commissions
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{selected.ref}</span>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-heading">{selected.ref}</h2>
              {badgeFor(selected.status)}
            </div>
            <p className="text-xs text-muted mt-1">
              Enregistrée le {selected.date} · {selected.plan} · {selected.paymentRef}
            </p>
          </div>
          {selected.status === 'pending' && (
            <button
              type="button"
              onClick={() => handleApprove(selected.ref)}
              className="btn-primary text-xs py-2 px-3.5"
            >
              Approuver la commission
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-heading">Résumé de la commission</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-subtle border border-line rounded-xl p-4">
                  <p className="text-muted">Montant de commission</p>
                  <p className="text-2xl font-bold text-heading mt-1">
                    €{selected.commissionEur.toFixed(2)}
                  </p>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4">
                  <p className="text-muted">Taux appliqué</p>
                  <p className="text-2xl font-bold text-heading mt-1">{selected.rate}%</p>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4">
                  <p className="text-muted">Premier paiement éligible</p>
                  <p className="text-2xl font-bold text-heading mt-1">
                    €{selected.firstPaymentEur.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-heading">Calcul de la commission</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-center">
                <div className="bg-subtle border border-line rounded-xl p-4">
                  <p className="text-[11px] text-muted">Premier paiement</p>
                  <p className="text-lg font-bold text-heading">€{selected.firstPaymentEur.toFixed(2)}</p>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4">
                  <p className="text-[11px] text-muted">Taux de commission</p>
                  <p className="text-lg font-bold text-heading">{selected.rate}%</p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--sem-success-bg)', color: 'var(--sem-success-fg)' }}>
                  <p className="text-[11px] opacity-80">Commission totale</p>
                  <p className="text-lg font-bold">€{selected.commissionEur.toFixed(2)}</p>
                </div>
              </div>
              <div className="banner-warning">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Les renouvellements d&apos;abonnement ne sont pas éligibles aux commissions.</span>
              </div>
            </div>
          </div>

          <div className="space-y-5 text-xs">
            <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-heading">Informations affilié</h3>
              <p className="font-semibold text-heading text-sm">{selected.affiliateName}</p>
              <p className="text-muted">{selected.affiliateEmail}</p>
              <p className="text-soft">Studio : {selected.affiliateStudio}</p>
              <p className="text-muted">{selected.affiliateId}</p>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-heading">Studio parrainé</h3>
              <p className="font-semibold text-heading text-sm">{selected.referredStudio}</p>
              <p className="text-muted">Propriétaire : {selected.referredOwner}</p>
              <p className="text-muted">Offre : {selected.plan}</p>
              <button
                type="button"
                onClick={() => onOpenStudio(selected.referredStudio)}
                className="btn-outline w-full justify-center text-xs mt-1"
              >
                Voir le studio <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {selected.payoutRef !== '—' && (
              <div className="bg-panel border border-line rounded-2xl p-5 space-y-2 shadow-xs">
                <h3 className="text-sm font-bold text-heading">Virement lié</h3>
                <button
                  type="button"
                  onClick={onOpenPayouts}
                  className="w-full bg-subtle hover:bg-hover border border-line rounded-xl p-3 flex items-center justify-between"
                >
                  <span className="font-semibold text-heading inline-flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    {selected.payoutRef}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted" />
                </button>
              </div>
            )}
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-5 right-5 z-50 bg-panel border border-line rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--sem-success-fg)' }} />
            <p className="text-xs font-medium text-heading">{toast}</p>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <div className="banner-info">
        <Percent className="w-4 h-4 shrink-0" />
        <span>Les commissions s&apos;appliquent uniquement au premier paiement d&apos;abonnement réussi (20 %).</span>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total généré', value: '€12 450', sub: 'Premiers paiements uniquement' },
          { label: 'En attente', value: '€2 450', sub: 'En attente de validation' },
          { label: 'Approuvées', value: '€3 200', sub: 'Prêtes pour virement' },
          { label: 'Payées', value: '€6 800', sub: 'Déjà versées' },
          { label: 'Total relevés', value: '1 180', sub: 'Commissions éligibles' },
        ].map((k) => (
          <div key={k.label} className="bg-panel border border-line rounded-2xl p-4 shadow-xs space-y-1">
            <p className="text-xs text-muted">{k.label}</p>
            <p className="text-2xl font-bold text-heading">{k.value}</p>
            <p className="text-[11px] text-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-heading">Tendance mensuelle</h3>
            <span className="text-xs text-muted">6 derniers mois</span>
          </div>
          <div className="h-36 flex items-end justify-between gap-2 pt-2">
            {[42, 50, 56, 62, 74, 90].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full max-w-[28px] rounded-t-md bg-neutral-900 dark:bg-neutral-100" style={{ height: `${h}%` }} />
                <span className="text-[10px] text-muted">{['Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-3 text-xs">
          <h3 className="text-sm font-bold text-heading">Répartition des statuts</h3>
          <p className="text-2xl font-bold text-heading">1 180 <span className="text-xs font-normal text-muted">relevés</span></p>
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="flex justify-between"><span className="badge-warning">En attente</span><strong>€2 450</strong></div>
            <div className="flex justify-between"><span className="badge-info">Approuvée</span><strong>€3 200</strong></div>
            <div className="flex justify-between"><span className="badge-success">Payée</span><strong>€6 800</strong></div>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-heading">Règle de calcul</h3>
            <span className="badge-neutral">20 %</span>
          </div>
          <p className="text-muted">Premier abonnement payé uniquement — aucun renouvellement.</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-subtle border border-line rounded-xl p-3">
              <p className="text-muted">Pro Mensuel</p>
              <p className="font-bold text-heading mt-0.5">€9,90 × 20% = €1,98</p>
            </div>
            <div className="bg-subtle border border-line rounded-xl p-3">
              <p className="text-muted">Pro Annuel</p>
              <p className="font-bold text-heading mt-0.5">€99 × 20% = €19,80</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Records Table */}
      <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-line space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-heading">Relevés de commissions</h2>
              <p className="text-xs text-muted">Consultez les commissions éligibles et approuvez celles en attente.</p>
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
                placeholder="Rechercher par référence, affilié ou studio..."
                className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | CommissionStatus)}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvée</option>
                <option value="paid">Payée</option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as 'all' | 'Pro Mensuel' | 'Pro Annuel')}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Toutes les offres</option>
                <option value="Pro Mensuel">Pro Mensuel</option>
                <option value="Pro Annuel">Pro Annuel</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="py-3 px-5">Référence</th>
                <th className="py-3 px-4">Affilié</th>
                <th className="py-3 px-4">Studio parrainé</th>
                <th className="py-3 px-4">Offre</th>
                <th className="py-3 px-4">1er paiement</th>
                <th className="py-3 px-4">Taux</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filtered.map((c) => (
                <tr key={c.ref} className="hover:bg-subtle/40">
                  <td className="py-3.5 px-5 font-semibold text-heading whitespace-nowrap">{c.ref}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-subtle border border-line text-[11px] font-bold flex items-center justify-center">
                        {c.affiliateInitials}
                      </span>
                      <span className="font-medium text-heading">{c.affiliateName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{c.referredStudio}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap"><span className="badge-neutral">{c.plan}</span></td>
                  <td className="py-3.5 px-4 text-soft">€{c.firstPaymentEur.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-soft">{c.rate}%</td>
                  <td className="py-3.5 px-4 font-semibold text-heading">€{c.commissionEur.toFixed(2)}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{badgeFor(c.status)}</td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-3">
                    {c.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(c.ref)}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: 'var(--sem-success-fg)' }}
                      >
                        Approuver
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedRef(c.ref)}
                      className="text-xs font-semibold text-heading hover:underline"
                    >
                      Voir
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

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-panel border border-line rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--sem-success-fg)' }} />
          <p className="text-xs font-medium text-heading">{toast}</p>
        </div>
      )}
    </div>
  );
};

