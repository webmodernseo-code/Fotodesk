import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Wallet,
} from 'lucide-react';

type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface PayoutRow {
  ref: string;
  affiliateInitials: string;
  affiliateName: string;
  affiliateEmail: string;
  affiliateId: string;
  studioName: string;
  commissionsCount: number;
  amountEur: number;
  payoutDate: string;
  createdDate: string;
  status: PayoutStatus;
}

const INITIAL_PAYOUTS: PayoutRow[] = [
  {
    ref: 'PAY-2026-006',
    affiliateInitials: 'AM',
    affiliateName: 'Alex Morgan',
    affiliateEmail: 'alex@northlight.com',
    affiliateId: 'AFF-001230',
    studioName: 'Northlight Studio',
    commissionsCount: 2,
    amountEur: 39.6,
    payoutDate: 'Non disponible',
    createdDate: '20 nov. 2026',
    status: 'pending',
  },
  {
    ref: 'PAY-2026-005',
    affiliateInitials: 'EW',
    affiliateName: 'Emma Wilson',
    affiliateEmail: 'emma@lumiere.com',
    affiliateId: 'AFF-001235',
    studioName: 'Lumière Photography',
    commissionsCount: 1,
    amountEur: 19.8,
    payoutDate: '19 nov. 2026',
    createdDate: '18 nov. 2026',
    status: 'processing',
  },
  {
    ref: 'PAY-2026-004',
    affiliateInitials: 'DB',
    affiliateName: 'Daniel Brown',
    affiliateEmail: 'daniel@capturehouse.com',
    affiliateId: 'AFF-001236',
    studioName: 'Capture House',
    commissionsCount: 4,
    amountEur: 79.2,
    payoutDate: '15 nov. 2026',
    createdDate: '14 nov. 2026',
    status: 'completed',
  },
  {
    ref: 'PAY-2026-003',
    affiliateInitials: 'OD',
    affiliateName: 'Olivia Davis',
    affiliateEmail: 'olivia@pixelhouse.com',
    affiliateId: 'AFF-001238',
    studioName: 'Pixel House',
    commissionsCount: 2,
    amountEur: 39.6,
    payoutDate: 'Non disponible',
    createdDate: '10 nov. 2026',
    status: 'pending',
  },
  {
    ref: 'PAY-2026-001',
    affiliateInitials: 'AM',
    affiliateName: 'Alex Morgan',
    affiliateEmail: 'alex@northlight.com',
    affiliateId: 'AFF-001230',
    studioName: 'Northlight Studio',
    commissionsCount: 5,
    amountEur: 138.6,
    payoutDate: '05 nov. 2026',
    createdDate: '03 nov. 2026',
    status: 'completed',
  },
];

interface Props {
  onOpenAffiliates: () => void;
}

export const SuperAdminPayoutsSection: React.FC<Props> = ({ onOpenAffiliates }) => {
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PayoutStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest');

  const selected = useMemo(
    () => INITIAL_PAYOUTS.find((p) => p.ref === selectedRef) ?? null,
    [selectedRef]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INITIAL_PAYOUTS.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (
        q &&
        !p.ref.toLowerCase().includes(q) &&
        !p.affiliateName.toLowerCase().includes(q) &&
        !p.studioName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'highest') return b.amountEur - a.amountEur;
      if (sortBy === 'oldest') return a.ref.localeCompare(b.ref);
      return b.ref.localeCompare(a.ref);
    });
  }, [search, statusFilter, sortBy]);

  const badgeFor = (status: PayoutStatus) => {
    if (status === 'completed') return <span className="badge-success">Terminé</span>;
    if (status === 'processing') return <span className="badge-info">En cours</span>;
    if (status === 'failed') return <span className="badge-danger">Échoué</span>;
    return <span className="badge-warning">En attente</span>;
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
            Virements
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
            <p className="text-xs text-muted mt-1">Créé le {selected.createdDate}</p>
          </div>
          <span className="badge-neutral">Lecture seule</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-heading">Résumé du virement</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-subtle border border-line rounded-xl p-4">
                  <p className="text-muted">Montant du virement</p>
                  <p className="text-2xl font-bold text-heading mt-1">
                    €{selected.amountEur.toFixed(2)}
                  </p>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4">
                  <p className="text-muted">Commissions incluses</p>
                  <p className="text-base font-bold text-heading mt-1">
                    {selected.commissionsCount} relevés
                  </p>
                  <p className="text-muted mt-1">Date : {selected.payoutDate}</p>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4">
                  <p className="text-muted">Devise</p>
                  <p className="text-base font-bold text-heading mt-1">EUR</p>
                  <p className="text-muted mt-1">Créé le {selected.createdDate}</p>
                </div>
              </div>
            </div>

            <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-line">
                <h3 className="text-base font-bold text-heading">Commissions incluses</h3>
                <p className="text-xs text-muted">Commissions approuvées rattachées à ce virement.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <th className="py-3 px-5">Référence</th>
                      <th className="py-3 px-4">Studio parrainé</th>
                      <th className="py-3 px-4">Offre</th>
                      <th className="py-3 px-4">1er paiement</th>
                      <th className="py-3 px-5 text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    <tr>
                      <td className="py-3 px-5 font-semibold text-heading">COM-2026-090</td>
                      <td className="py-3 px-4 text-soft">Harbor Creative</td>
                      <td className="py-3 px-4"><span className="badge-neutral">Pro Annuel</span></td>
                      <td className="py-3 px-4 text-soft">€99,00</td>
                      <td className="py-3 px-5 text-right font-semibold text-heading">€19,80</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-semibold text-heading">COM-2026-091</td>
                      <td className="py-3 px-4 text-soft">Atelier Rose</td>
                      <td className="py-3 px-4"><span className="badge-neutral">Pro Annuel</span></td>
                      <td className="py-3 px-4 text-soft">€99,00</td>
                      <td className="py-3 px-5 text-right font-semibold text-heading">€19,80</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-5 text-xs">
            <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-heading">Informations affilié</h3>
                <span className="badge-success">Actif</span>
              </div>
              <p className="text-sm font-semibold text-heading">{selected.affiliateName}</p>
              <p className="text-muted">{selected.affiliateEmail}</p>
              <p className="text-soft flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted" />
                {selected.studioName}
              </p>
              <button
                type="button"
                onClick={onOpenAffiliates}
                className="btn-outline w-full justify-center text-xs mt-2"
              >
                Voir l&apos;affilié <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-5 space-y-2.5 shadow-xs">
              <h3 className="text-sm font-bold text-heading">Informations virement</h3>
              <p className="flex items-center gap-2 text-soft">
                <Wallet className="w-3.5 h-3.5 text-muted" />
                Référence : <strong className="text-heading">{selected.ref}</strong>
              </p>
              <p className="flex items-center gap-2 text-soft">
                <Calendar className="w-3.5 h-3.5 text-muted" />
                Date : <strong className="text-heading">{selected.payoutDate}</strong>
              </p>
            </div>

            <div className="banner-warning">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Aucun traitement bancaire automatisé n&apos;est activé dans cette vue.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <div className="banner-warning">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Les virements contiennent uniquement les commissions approuvées. Les versements sont effectués hors plateforme.</span>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total virements', value: '€8 450', sub: 'Montant total approuvé' },
          { label: 'En attente', value: '€2 150', sub: 'En attente de versement' },
          { label: 'En cours', value: '€1 200', sub: 'Versements en traitement' },
          { label: 'Terminés', value: '€5 100', sub: 'Versements confirmés' },
          { label: 'Total demandes', value: '185', sub: 'Relevés de virement' },
        ].map((k) => (
          <div key={k.label} className="bg-panel border border-line rounded-2xl p-4 shadow-xs space-y-1">
            <Wallet className="w-4 h-4 text-muted" />
            <p className="text-xs text-muted pt-1">{k.label}</p>
            <p className="text-2xl font-bold text-heading">{k.value}</p>
            <p className="text-[11px] text-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-heading">Répartition des statuts</h3>
          <div className="h-2.5 bg-subtle rounded-full overflow-hidden flex">
            <div style={{ width: '26%', backgroundColor: 'var(--sem-warning-fg)' }} />
            <div style={{ width: '12%', backgroundColor: 'var(--sem-info-fg)' }} />
            <div style={{ width: '60%', backgroundColor: 'var(--sem-success-fg)' }} />
            <div style={{ width: '2%', backgroundColor: 'var(--sem-danger-fg)' }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="badge-warning">En attente</span> <strong>48</strong></div>
            <div><span className="badge-info">En cours</span> <strong>22</strong></div>
            <div><span className="badge-success">Terminés</span> <strong>111</strong></div>
            <div><span className="badge-danger">Échoués</span> <strong>4</strong></div>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-heading">Tendance mensuelle</h3>
            <span className="text-xs font-semibold text-heading">€5 100 versés</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-2 pt-2">
            {[36, 44, 52, 60, 68, 86].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full max-w-[28px] rounded-t-md bg-neutral-900 dark:bg-neutral-100" style={{ height: `${h}%` }} />
                <span className="text-[10px] text-muted">{['Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-2.5 text-xs">
          <h3 className="text-sm font-bold text-heading">Résumé des soldes</h3>
          <p className="text-2xl font-bold text-heading">€8 450</p>
          <div className="flex justify-between pt-2 border-t border-line">
            <span className="text-muted">Déjà versé</span>
            <strong className="text-heading">€5 100</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">En attente de versement</span>
            <strong className="text-heading">€3 350</strong>
          </div>
        </div>
      </div>

      {/* Payout Records Table */}
      <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-line space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-heading">Relevés de virements</h2>
              <p className="text-xs text-muted">Consultez les virements par affilié et statut.</p>
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
                onChange={(e) => setStatusFilter(e.target.value as 'all' | PayoutStatus)}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="processing">En cours</option>
                <option value="completed">Terminé</option>
                <option value="failed">Échoué</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'highest')}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="newest">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="highest">Montant décroissant</option>
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
                <th className="py-3 px-4">Studio associé</th>
                <th className="py-3 px-4">Commissions</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4">Date de versement</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filtered.map((p) => (
                <tr key={p.ref} className="hover:bg-subtle/40">
                  <td className="py-3.5 px-5 font-semibold text-heading whitespace-nowrap">{p.ref}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-subtle border border-line text-[11px] font-bold flex items-center justify-center">
                        {p.affiliateInitials}
                      </span>
                      <span className="font-medium text-heading">{p.affiliateName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{p.studioName}</td>
                  <td className="py-3.5 px-4 text-heading">{p.commissionsCount}</td>
                  <td className="py-3.5 px-4 font-semibold text-heading">€{p.amountEur.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{p.payoutDate}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{badgeFor(p.status)}</td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedRef(p.ref)}
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
    </div>
  );
};

