import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Search,
} from 'lucide-react';

type SubStatus = 'active' | 'cancelled' | 'past_due' | 'expired';
type SubPlan = 'Starter' | 'Pro Mensuel' | 'Pro Annuel';
type BillingCycle = 'Gratuit' | 'Mensuel' | 'Annuel';

interface SubscriptionRow {
  id: string;
  studioInitials: string;
  studioName: string;
  studioId: string;
  owner: string;
  ownerEmail: string;
  plan: SubPlan;
  cycle: BillingCycle;
  price: string;
  status: SubStatus;
  startDate: string;
  nextBilling: string;
  duration: string;
  photoUsedGb: number;
  photoLimitGb: number;
  videoUsedMin: number;
  videoLimitMin: number;
  playbackUsedMin: number;
  playbackLimitMin: number;
}

const INITIAL_SUBS: SubscriptionRow[] = [
  {
    id: 'SUB-001850',
    studioInitials: 'NS',
    studioName: 'Northlight Studio',
    studioId: 'STD-001248',
    owner: 'Alex Morgan',
    ownerEmail: 'alex@northlight.com',
    plan: 'Pro Mensuel',
    cycle: 'Mensuel',
    price: '€9,90 / mois',
    status: 'active',
    startDate: '12 nov. 2026',
    nextBilling: '12 déc. 2026',
    duration: '6 mois',
    photoUsedGb: 68,
    photoLimitGb: 100,
    videoUsedMin: 320,
    videoLimitMin: 500,
    playbackUsedMin: 720,
    playbackLimitMin: 1000,
  },
  {
    id: 'SUB-001849',
    studioInitials: 'LP',
    studioName: 'Lumière Photography',
    studioId: 'STD-001247',
    owner: 'Emma Wilson',
    ownerEmail: 'emma@lumiere.com',
    plan: 'Starter',
    cycle: 'Gratuit',
    price: '€0',
    status: 'active',
    startDate: '10 nov. 2026',
    nextBilling: '—',
    duration: '1 mois',
    photoUsedGb: 1.8,
    photoLimitGb: 3,
    videoUsedMin: 0,
    videoLimitMin: 0,
    playbackUsedMin: 0,
    playbackLimitMin: 0,
  },
  {
    id: 'SUB-001848',
    studioInitials: 'CH',
    studioName: 'Capture House',
    studioId: 'STD-001246',
    owner: 'Daniel Brown',
    ownerEmail: 'daniel@capturehouse.com',
    plan: 'Pro Annuel',
    cycle: 'Annuel',
    price: '€99 / an',
    status: 'active',
    startDate: '08 nov. 2026',
    nextBilling: '08 nov. 2027',
    duration: '12 mois',
    photoUsedGb: 64,
    photoLimitGb: 100,
    videoUsedMin: 210,
    videoLimitMin: 500,
    playbackUsedMin: 480,
    playbackLimitMin: 1000,
  },
  {
    id: 'SUB-001847',
    studioInitials: 'SF',
    studioName: 'Studio Frame',
    studioId: 'STD-001245',
    owner: 'Sophia Taylor',
    ownerEmail: 'sophia@studioframe.com',
    plan: 'Starter',
    cycle: 'Gratuit',
    price: '€0',
    status: 'active',
    startDate: '05 nov. 2026',
    nextBilling: '—',
    duration: '1 mois',
    photoUsedGb: 2.1,
    photoLimitGb: 3,
    videoUsedMin: 0,
    videoLimitMin: 0,
    playbackUsedMin: 0,
    playbackLimitMin: 0,
  },
  {
    id: 'SUB-001846',
    studioInitials: 'GH',
    studioName: 'Golden Hour Studio',
    studioId: 'STD-001244',
    owner: 'James Miller',
    ownerEmail: 'james@goldenhour.com',
    plan: 'Pro Mensuel',
    cycle: 'Mensuel',
    price: '€9,90 / mois',
    status: 'past_due',
    startDate: '02 nov. 2026',
    nextBilling: '02 déc. 2026',
    duration: '2 mois',
    photoUsedGb: 25,
    photoLimitGb: 100,
    videoUsedMin: 90,
    videoLimitMin: 500,
    playbackUsedMin: 120,
    playbackLimitMin: 1000,
  },
];

interface Props {
  initialStudioName?: string | null;
  onOpenStudio: (studioName: string) => void;
}

export const SuperAdminSubscriptionsSection: React.FC<Props> = ({
  initialStudioName,
  onOpenStudio,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (!initialStudioName) return null;
    return INITIAL_SUBS.find((s) => s.studioName === initialStudioName)?.id ?? null;
  });

  // Filters
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | SubPlan>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SubStatus>('all');
  const [cycleFilter, setCycleFilter] = useState<'all' | BillingCycle>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'studio'>('newest');
  const [toast] = useState<string | null>(null);

  const selectedSub = useMemo(
    () => INITIAL_SUBS.find((s) => s.id === selectedId) ?? null,
    [selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INITIAL_SUBS.filter((s) => {
      if (planFilter !== 'all' && s.plan !== planFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (cycleFilter !== 'all' && s.cycle !== cycleFilter) return false;
      if (
        q &&
        !s.studioName.toLowerCase().includes(q) &&
        !s.owner.toLowerCase().includes(q) &&
        !s.ownerEmail.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'studio') return a.studioName.localeCompare(b.studioName);
      if (sortBy === 'oldest') return a.id.localeCompare(b.id);
      return b.id.localeCompare(a.id);
    });
  }, [search, planFilter, statusFilter, cycleFilter, sortBy]);

  const statusBadge = (status: SubStatus) => {
    if (status === 'active') {
      return (
        <span className="badge-success">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Actif
        </span>
      );
    }
    if (status === 'past_due') {
      return (
        <span className="badge-warning">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          En retard
        </span>
      );
    }
    if (status === 'expired') {
      return (
        <span className="badge-danger">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Expiré
        </span>
      );
    }
    return (
      <span className="badge-neutral">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Annulé
      </span>
    );
  };

  // DETAIL VIEW
  if (selectedSub) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-heading hover:underline"
          >
            Souscriptions
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{selectedSub.studioName}</span>
        </div>

        {/* Header Card */}
        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold flex items-center justify-center shrink-0">
              {selectedSub.studioInitials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-heading">{selectedSub.studioName}</h2>
                <span className="badge-neutral">{selectedSub.plan}</span>
                {statusBadge(selectedSub.status)}
              </div>
              <p className="text-xs text-muted mt-1">
                {selectedSub.id} · Démarré le {selectedSub.startDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenStudio(selectedSub.studioName)}
            className="btn-outline text-xs py-2 px-3.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            Voir le studio
          </button>
        </div>

        {/* 4 Summary Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-panel border border-line rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-muted">Offre actuelle</p>
            <p className="text-base font-bold text-heading mt-1">{selectedSub.plan}</p>
            <p className="text-xs text-muted mt-0.5">{selectedSub.price}</p>
          </div>
          <div className="bg-panel border border-line rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-muted">Statut</p>
            <p className="text-base font-bold text-heading mt-1">
              {selectedSub.status === 'active' ? 'Actif' : selectedSub.status === 'past_due' ? 'En retard' : 'Inactif'}
            </p>
            <p className="text-xs text-muted mt-0.5">Payé</p>
          </div>
          <div className="bg-panel border border-line rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-muted">Prochaine facturation</p>
            <p className="text-base font-bold text-heading mt-1">{selectedSub.nextBilling}</p>
            <p className="text-xs text-muted mt-0.5">{selectedSub.cycle}</p>
          </div>
          <div className="bg-panel border border-line rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-muted">Durée</p>
            <p className="text-base font-bold text-heading mt-1">{selectedSub.duration}</p>
            <p className="text-xs text-muted mt-0.5">Depuis le {selectedSub.startDate}</p>
          </div>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 space-y-5">
            {/* Plan Usage */}
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-heading">Utilisation de l&apos;offre</h3>
                <p className="text-xs text-muted">Consommation actuelle par rapport aux quotas inclus.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-subtle border border-line rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Stockage photo
                  </p>
                  <p className="text-base font-bold text-heading">
                    {selectedSub.photoUsedGb} Go / {selectedSub.photoLimitGb} Go
                  </p>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
                      style={{
                        width: `${Math.min(100, (selectedSub.photoUsedGb / Math.max(1, selectedSub.photoLimitGb)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Galeries photo
                  </p>
                  <p className="text-base font-bold text-heading">
                    {selectedSub.plan === 'Starter' ? '2 / 3 Galeries' : 'Galeries illimitées'}
                  </p>
                  <p className="text-xs text-muted">Inclus dans l&apos;offre {selectedSub.plan}</p>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Stockage vidéo
                  </p>
                  <p className="text-base font-bold text-heading">
                    {selectedSub.videoUsedMin} / {selectedSub.videoLimitMin} min
                  </p>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
                      style={{
                        width: `${selectedSub.videoLimitMin > 0 ? Math.min(100, (selectedSub.videoUsedMin / selectedSub.videoLimitMin) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Lecture vidéo mensuelle
                  </p>
                  <p className="text-base font-bold text-heading">
                    {selectedSub.playbackUsedMin} / {selectedSub.playbackLimitMin} min
                  </p>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
                      style={{
                        width: `${selectedSub.playbackLimitMin > 0 ? Math.min(100, (selectedSub.playbackUsedMin / selectedSub.playbackLimitMin) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="banner-warning">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Atteindre une limite ne supprime aucun fichier existant et n&apos;entraîne pas de frais supplémentaires.
                </span>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-line flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-heading">Historique de facturation</h3>
                  <p className="text-xs text-muted">Reçus et paiements enregistrés pour cette souscription.</p>
                </div>
                <span className="text-xs text-muted">3 relevés</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <th className="py-3 px-5">Facture</th>
                      <th className="py-3 px-4">Période</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Montant</th>
                      <th className="py-3 px-4">Méthode</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-5 text-right">Reçu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    <tr>
                      <td colSpan={7} className="py-6 px-5 text-center text-xs text-muted">
                        Aucune facture d&apos;abonnement enregistrée pour ce studio.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div className="bg-panel border border-line rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-heading">Informations du studio</h3>
                <span className="badge-success">Actif</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-heading">{selectedSub.studioName}</p>
                <p className="text-xs text-muted">{selectedSub.studioId}</p>
              </div>
              <div className="space-y-1 text-xs pt-2 border-t border-line">
                <p className="text-muted">Propriétaire : <strong className="text-heading">{selectedSub.owner}</strong></p>
                <p className="text-muted">E-mail : <strong className="text-heading">{selectedSub.ownerEmail}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => onOpenStudio(selectedSub.studioName)}
                className="btn-outline w-full justify-center text-xs"
              >
                Voir le studio <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-heading">Avantages inclus ({selectedSub.plan})</h3>
              <ul className="space-y-2 text-xs text-soft">
                {[
                  'Galeries photo illimitées',
                  '100 Go de stockage photo',
                  '500 minutes de stockage vidéo',
                  '1 000 minutes de lecture vidéo / mois',
                  'Liens privés & code d’accès client',
                  'Sélection photo & commentaires horodatés',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--sem-success-fg)' }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
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
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total des souscriptions', value: '1 850', sub: 'Souscriptions plateforme' },
          { label: 'Souscriptions actives', value: '1 620', sub: 'Actives actuellement' },
          { label: 'Offres Starter', value: '1 200', sub: 'Offre gratuite' },
          { label: 'Pro Mensuel', value: '420', sub: 'Souscriptions mensuelles' },
          { label: 'Pro Annuel', value: '230', sub: 'Souscriptions annuelles' },
        ].map((k) => (
          <div key={k.label} className="bg-panel border border-line rounded-2xl p-4 shadow-xs space-y-1.5">
            <CreditCard className="w-4 h-4 text-muted" />
            <p className="text-xs text-muted pt-1">{k.label}</p>
            <p className="text-2xl font-bold text-heading">{k.value}</p>
            <p className="text-[11px] text-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Distribution + Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-heading">Répartition des offres</h3>
              <p className="text-xs text-muted">Offres FotoDesk approuvées</p>
            </div>
            <span className="text-xs font-semibold text-heading">1 850 au total</span>
          </div>

          <div className="h-3 bg-subtle rounded-full overflow-hidden flex">
            <div className="bg-neutral-400 h-full" style={{ width: '65%' }} />
            <div className="bg-neutral-900 dark:bg-neutral-100 h-full" style={{ width: '23%' }} />
            <div className="bg-neutral-600 dark:bg-neutral-400 h-full" style={{ width: '12%' }} />
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs pt-1">
            <div>
              <p className="font-semibold text-heading">Starter</p>
              <p className="text-muted">Gratuit · <strong className="text-heading">1 200</strong></p>
            </div>
            <div>
              <p className="font-semibold text-heading">Pro Mensuel</p>
              <p className="text-muted">€9,90/mois · <strong className="text-heading">420</strong></p>
            </div>
            <div>
              <p className="font-semibold text-heading">Pro Annuel</p>
              <p className="text-muted">€99/an · <strong className="text-heading">230</strong></p>
            </div>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5 shadow-xs space-y-2.5 text-xs">
          <h3 className="text-sm font-bold text-heading">Statut des souscriptions</h3>
          <div className="flex items-center justify-between py-1">
            <span className="badge-success">Actif</span>
            <span className="font-bold text-heading">1 620</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="badge-neutral">Annulé</span>
            <span className="font-bold text-heading">80</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="badge-warning">En retard</span>
            <span className="font-bold text-heading">95</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="badge-danger">Expiré</span>
            <span className="font-bold text-heading">55</span>
          </div>
        </div>
      </div>

      {/* All Subscriptions Table */}
      <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-line space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-heading">Toutes les souscriptions</h2>
              <p className="text-xs text-muted">Consultez les offres, cycles de facturation et statuts.</p>
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
                placeholder="Rechercher par studio, propriétaire ou e-mail..."
                className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:border-neutral-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as 'all' | SubPlan)}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Toutes les offres</option>
                <option value="Starter">Starter</option>
                <option value="Pro Mensuel">Pro Mensuel</option>
                <option value="Pro Annuel">Pro Annuel</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | SubStatus)}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="past_due">En retard</option>
                <option value="cancelled">Annulé</option>
                <option value="expired">Expiré</option>
              </select>

              <select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value as 'all' | BillingCycle)}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Tous les cycles</option>
                <option value="Gratuit">Gratuit</option>
                <option value="Mensuel">Mensuel</option>
                <option value="Annuel">Annuel</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'studio')}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="newest">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="studio">Nom du studio</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="py-3 px-5">Studio</th>
                <th className="py-3 px-4">Offre</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Prix</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Début</th>
                <th className="py-3 px-4">Prochaine facturation</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-subtle/40 transition-colors">
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-subtle border border-line text-xs font-bold flex items-center justify-center shrink-0">
                        {s.studioInitials}
                      </span>
                      <div>
                        <p className="font-semibold text-heading">{s.studioName}</p>
                        <p className="text-[11px] text-muted">{s.owner}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={s.plan === 'Pro Annuel' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium px-2.5 py-0.5 rounded-full' : 'badge-neutral'}>
                      {s.plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{s.cycle}</td>
                  <td className="py-3.5 px-4 font-semibold text-heading whitespace-nowrap">{s.price}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{statusBadge(s.status)}</td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{s.startDate}</td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{s.nextBilling}</td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
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

