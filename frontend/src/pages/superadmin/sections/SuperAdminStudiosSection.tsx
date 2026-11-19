import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  User,
  X,
} from 'lucide-react';

type StudioStatus = 'active' | 'suspended' | 'pending';
type PlanName = 'Starter' | 'Pro Mensuel' | 'Pro Annuel';

interface StudioRow {
  id: string;
  initials: string;
  name: string;
  owner: string;
  ownerEmail: string;
  ownerPhone: string;
  plan: PlanName;
  priceLabel: string;
  registeredAt: string;
  status: StudioStatus;
  location: string;
  country: string;
  website: string;
  description: string;
  photoStorageGb: number;
  photoLimitGb: number;
  videoStorageMin: number;
  videoLimitMin: number;
  playbackMin: number;
  playbackLimitMin: number;
  statusHistory: Array<{ id: string; from: string; to: string; by: string; date: string; reason: string }>;
}

const INITIAL_STUDIOS: StudioRow[] = [
  {
    id: 'STD-001248',
    initials: 'NS',
    name: 'Northlight Studio',
    owner: 'Alex Morgan',
    ownerEmail: 'alex@northlight.com',
    ownerPhone: '+33 1 42 68 55 00',
    plan: 'Pro Mensuel',
    priceLabel: '€9,90 / mois',
    registeredAt: '12 nov. 2026',
    status: 'active',
    location: 'Paris, France',
    country: 'France',
    website: 'northlight.com',
    description: 'Studio de photographie spécialisé en portraits éditoriaux et campagnes de marque.',
    photoStorageGb: 42,
    photoLimitGb: 100,
    videoStorageMin: 320,
    videoLimitMin: 500,
    playbackMin: 650,
    playbackLimitMin: 1000,
    statusHistory: [
      { id: 'h-1', from: 'Suspendu', to: 'Actif', by: 'Alex Morgan', date: '16 nov. 2026, 09:30', reason: 'Problème résolu' },
      { id: 'h-2', from: 'Actif', to: 'Suspendu', by: 'Alex Morgan', date: '15 nov. 2026, 16:12', reason: 'Vérification du compte' },
    ],
  },
  {
    id: 'STD-001247',
    initials: 'LP',
    name: 'Lumière Photography',
    owner: 'Emma Wilson',
    ownerEmail: 'emma@lumiere.com',
    ownerPhone: '+33 6 22 44 18 90',
    plan: 'Starter',
    priceLabel: 'Gratuit',
    registeredAt: '10 nov. 2026',
    status: 'active',
    location: 'Lyon, France',
    country: 'France',
    website: 'lumiere.photo',
    description: 'Photographie de mariage et portraits familiaux en lumière naturelle.',
    photoStorageGb: 1.8,
    photoLimitGb: 3,
    videoStorageMin: 0,
    videoLimitMin: 0,
    playbackMin: 0,
    playbackLimitMin: 0,
    statusHistory: [],
  },
  {
    id: 'STD-001246',
    initials: 'CH',
    name: 'Capture House',
    owner: 'Daniel Brown',
    ownerEmail: 'daniel@capturehouse.com',
    ownerPhone: '+33 6 48 11 22 33',
    plan: 'Pro Annuel',
    priceLabel: '€99 / an',
    registeredAt: '08 nov. 2026',
    status: 'active',
    location: 'Bordeaux, France',
    country: 'France',
    website: 'capturehouse.com',
    description: 'Production photo et vidéo pour mariages et événements d’entreprise.',
    photoStorageGb: 64,
    photoLimitGb: 100,
    videoStorageMin: 210,
    videoLimitMin: 500,
    playbackMin: 480,
    playbackLimitMin: 1000,
    statusHistory: [],
  },
  {
    id: 'STD-001245',
    initials: 'SF',
    name: 'Studio Frame',
    owner: 'Sophia Taylor',
    ownerEmail: 'sophia@studioframe.com',
    ownerPhone: '+33 6 77 90 12 34',
    plan: 'Starter',
    priceLabel: 'Gratuit',
    registeredAt: '05 nov. 2026',
    status: 'suspended',
    location: 'Marseille, France',
    country: 'France',
    website: 'studioframe.com',
    description: 'Studio de portrait et shooting mode.',
    photoStorageGb: 2.4,
    photoLimitGb: 3,
    videoStorageMin: 0,
    videoLimitMin: 0,
    playbackMin: 0,
    playbackLimitMin: 0,
    statusHistory: [
      { id: 'h-3', from: 'Actif', to: 'Suspendu', by: 'Alex Morgan', date: '06 nov. 2026, 14:20', reason: 'Non-conformité aux conditions' },
    ],
  },
  {
    id: 'STD-001244',
    initials: 'GH',
    name: 'Golden Hour Studio',
    owner: 'James Miller',
    ownerEmail: 'james@goldenhour.com',
    ownerPhone: '+33 6 19 88 77 66',
    plan: 'Pro Mensuel',
    priceLabel: '€9,90 / mois',
    registeredAt: '02 nov. 2026',
    status: 'pending',
    location: 'Nice, France',
    country: 'France',
    website: 'goldenhour.studio',
    description: 'Séances couple et événements sur la Côte d’Azur.',
    photoStorageGb: 15,
    photoLimitGb: 100,
    videoStorageMin: 90,
    videoLimitMin: 500,
    playbackMin: 120,
    playbackLimitMin: 1000,
    statusHistory: [],
  },
  {
    id: 'STD-001243',
    initials: 'AR',
    name: 'Atelier Riviera',
    owner: 'Claire Dubois',
    ownerEmail: 'claire@atelierriviera.fr',
    ownerPhone: '+33 6 55 44 33 22',
    plan: 'Pro Annuel',
    priceLabel: '€99 / an',
    registeredAt: '29 oct. 2026',
    status: 'active',
    location: 'Toulouse, France',
    country: 'France',
    website: 'atelierriviera.fr',
    description: 'Reportages éditoriaux et architecture.',
    photoStorageGb: 38,
    photoLimitGb: 100,
    videoStorageMin: 140,
    videoLimitMin: 500,
    playbackMin: 310,
    playbackLimitMin: 1000,
    statusHistory: [],
  },
];

interface Props {
  initialStudioName?: string | null;
  onOpenUser: (email: string) => void;
  onOpenSubscription: (studioName: string) => void;
}

export const SuperAdminStudiosSection: React.FC<Props> = ({
  initialStudioName,
  onOpenUser,
  onOpenSubscription,
}) => {
  const [studios, setStudios] = useState<StudioRow[]>(INITIAL_STUDIOS);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (!initialStudioName) return null;
    return INITIAL_STUDIOS.find((s) => s.name === initialStudioName)?.id ?? null;
  });

  // Filters
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | PlanName>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StudioStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Suspend modal
  const [suspendTarget, setSuspendTarget] = useState<StudioRow | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendError, setSuspendError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const selectedStudio = useMemo(
    () => studios.find((s) => s.id === selectedId) ?? null,
    [studios, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return studios
      .filter((s) => {
        if (planFilter !== 'all' && s.plan !== planFilter) return false;
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        if (
          q &&
          !s.name.toLowerCase().includes(q) &&
          !s.owner.toLowerCase().includes(q) &&
          !s.ownerEmail.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'az') return a.name.localeCompare(b.name);
        if (sortBy === 'za') return b.name.localeCompare(a.name);
        if (sortBy === 'oldest') return a.id.localeCompare(b.id);
        return b.id.localeCompare(a.id);
      });
  }, [studios, search, planFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleConfirmSuspend = () => {
    if (!suspendTarget) return;
    if (!suspendReason.trim()) {
      setSuspendError('Veuillez indiquer une raison de suspension.');
      return;
    }
    const nextStatus: StudioStatus = suspendTarget.status === 'suspended' ? 'active' : 'suspended';
    setStudios((prev) =>
      prev.map((s) =>
        s.id === suspendTarget.id
          ? {
              ...s,
              status: nextStatus,
              statusHistory: [
                {
                  id: `h-${Date.now()}`,
                  from: s.status === 'suspended' ? 'Suspendu' : 'Actif',
                  to: nextStatus === 'suspended' ? 'Suspendu' : 'Actif',
                  by: 'Alex Morgan',
                  date: "Aujourd'hui",
                  reason: suspendReason.trim(),
                },
                ...s.statusHistory,
              ],
            }
          : s
      )
    );
    setSuspendTarget(null);
    setSuspendReason('');
    setSuspendError(null);
    showToast(
      nextStatus === 'suspended' ? 'Studio suspendu avec succès.' : 'Studio réactivé avec succès.'
    );
  };

  const statusBadge = (status: StudioStatus) => {
    if (status === 'active') {
      return (
        <span className="badge-success">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Actif
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="badge-warning">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          En attente
        </span>
      );
    }
    return (
      <span className="badge-danger">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Suspendu
      </span>
    );
  };

  // DETAIL VIEW
  if (selectedStudio) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-heading hover:underline"
          >
            Studios
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{selectedStudio.name}</span>
        </div>

        {/* Header Card */}
        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold flex items-center justify-center shrink-0">
              {selectedStudio.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-heading">{selectedStudio.name}</h2>
                {statusBadge(selectedStudio.status)}
              </div>
              <p className="text-xs text-muted mt-1">
                {selectedStudio.id} · Inscrit le {selectedStudio.registeredAt} ·{' '}
                <span className="font-semibold text-heading">{selectedStudio.plan}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenUser(selectedStudio.ownerEmail)}
              className="btn-outline text-xs py-2 px-3"
            >
              <User className="w-3.5 h-3.5" />
              Voir le propriétaire
            </button>
            <button
              type="button"
              onClick={() => onOpenSubscription(selectedStudio.name)}
              className="btn-outline text-xs py-2 px-3"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Voir la souscription
            </button>
            <button
              type="button"
              onClick={() => {
                setSuspendTarget(selectedStudio);
                setSuspendReason('');
                setSuspendError(null);
              }}
              className={selectedStudio.status === 'suspended' ? 'btn-primary text-xs py-2 px-3' : 'btn-danger text-xs py-2 px-3'}
            >
              {selectedStudio.status === 'suspended' ? 'Réactiver le studio' : 'Suspendre le studio'}
            </button>
          </div>
        </div>

        {/* Main 2-column Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-heading">Informations du studio</h3>
                <p className="text-xs text-muted">Profil professionnel et coordonnées d&apos;inscription.</p>
              </div>
              <div className="bg-subtle border border-line rounded-xl p-4 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Description du studio
                </p>
                <p className="text-sm text-heading">{selectedStudio.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted">Localisation</p>
                    <p className="font-semibold text-heading mt-0.5">{selectedStudio.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted">Pays</p>
                    <p className="font-semibold text-heading mt-0.5">{selectedStudio.country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted">E-mail professionnel</p>
                    <p className="font-semibold text-heading mt-0.5">{selectedStudio.ownerEmail}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted">Téléphone</p>
                    <p className="font-semibold text-heading mt-0.5">{selectedStudio.ownerPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted">Site web</p>
                    <p className="font-semibold text-heading mt-0.5">{selectedStudio.website}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted">Date d&apos;inscription</p>
                    <p className="font-semibold text-heading mt-0.5">{selectedStudio.registeredAt}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Studio Usage */}
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-heading">Utilisation du studio</h3>
                <p className="text-xs text-muted">Consommation de stockage et médias.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-subtle border border-line rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Stockage photo
                  </p>
                  <p className="text-base font-bold text-heading">
                    {selectedStudio.photoStorageGb} Go / {selectedStudio.photoLimitGb} Go
                  </p>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
                      style={{
                        width: `${Math.min(100, (selectedStudio.photoStorageGb / Math.max(1, selectedStudio.photoLimitGb)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Galeries photo
                  </p>
                  <p className="text-base font-bold text-heading">
                    {selectedStudio.plan === 'Starter' ? '2 / 3 Galeries' : 'Galeries illimitées'}
                  </p>
                  <p className="text-xs text-muted">Inclus dans l&apos;offre {selectedStudio.plan}</p>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Stockage vidéo
                  </p>
                  <p className="text-base font-bold text-heading">
                    {selectedStudio.videoStorageMin} / {selectedStudio.videoLimitMin} min
                  </p>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
                      style={{
                        width: `${selectedStudio.videoLimitMin > 0 ? Math.min(100, (selectedStudio.videoStorageMin / selectedStudio.videoLimitMin) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Lecture vidéo mensuelle
                  </p>
                  <p className="text-base font-bold text-heading">
                    {selectedStudio.playbackMin} / {selectedStudio.playbackLimitMin} min
                  </p>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
                      style={{
                        width: `${selectedStudio.playbackLimitMin > 0 ? Math.min(100, (selectedStudio.playbackMin / selectedStudio.playbackLimitMin) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div className="bg-panel border border-line rounded-2xl p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-heading">Propriétaire du studio</h3>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-heading">{selectedStudio.owner}</p>
                  <p className="text-xs text-muted">{selectedStudio.ownerEmail}</p>
                  <p className="text-xs text-muted">{selectedStudio.ownerPhone}</p>
                </div>
                {statusBadge(selectedStudio.status)}
              </div>
              <button
                type="button"
                onClick={() => onOpenUser(selectedStudio.ownerEmail)}
                className="btn-outline w-full justify-center text-xs"
              >
                Voir le profil utilisateur <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-heading">Souscription du studio</h3>
                <span className="badge-success">Actif</span>
              </div>
              <p className="text-base font-bold text-heading">{selectedStudio.plan}</p>
              <p className="text-xs text-muted">{selectedStudio.priceLabel}</p>
              <button
                type="button"
                onClick={() => onOpenSubscription(selectedStudio.name)}
                className="btn-outline w-full justify-center text-xs"
              >
                Voir les détails d&apos;abonnement <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-heading">Historique des statuts</h3>
              {selectedStudio.statusHistory.length === 0 ? (
                <p className="text-xs text-muted">Aucun changement de statut enregistré.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {selectedStudio.statusHistory.map((h) => (
                    <div key={h.id} className="bg-subtle border border-line rounded-xl p-3 space-y-1">
                      <p className="font-semibold text-heading">
                        {h.from} → {h.to}
                      </p>
                      <p className="text-muted">Par {h.by} · {h.date}</p>
                      <p className="text-soft">Motif : {h.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {renderModalAndToast()}
      </div>
    );
  }

  function renderModalAndToast() {
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
                    {suspendTarget.status === 'suspended' ? 'Réactiver ce studio ?' : 'Suspendre ce studio ?'}
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

              <p className="text-xs text-soft leading-relaxed">
                Confirmez-vous la modification d&apos;accès pour{' '}
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

              <div className="banner-info">
                Ce changement affecte uniquement l&apos;accès au compte. Les données du studio ne sont pas supprimées.
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setSuspendTarget(null)} className="btn-outline text-sm">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  className={suspendTarget.status === 'suspended' ? 'btn-primary text-sm' : 'btn-danger text-sm'}
                >
                  {suspendTarget.status === 'suspended' ? 'Confirmer la réactivation' : 'Confirmer la suspension'}
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

  // LIST VIEW
  return (
    <div className="space-y-6">
      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total des studios', value: '1 248', sub: 'Studios inscrits', badge: 'badge-neutral' },
          { label: 'Studios actifs', value: '1 179', sub: 'Comptes actifs', badge: 'badge-success' },
          { label: 'Studios Starter', value: '1 080', sub: 'Utilisant Starter', badge: 'badge-info' },
          { label: 'Studios Pro', value: '168', sub: 'Souscriptions Pro', badge: 'badge-info' },
          { label: 'Studios suspendus', value: '68', sub: 'Accès restreint', badge: 'badge-danger' },
        ].map((k) => (
          <div key={k.label} className="bg-panel border border-line rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <Building2 className="w-4 h-4 text-muted" />
              <span className={`${k.badge} w-2 h-2 p-0 rounded-full`} />
            </div>
            <p className="text-xs text-muted">{k.label}</p>
            <p className="text-2xl font-bold text-heading">{k.value}</p>
            <p className="text-[11px] text-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* All Studios Table */}
      <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-visible">
        <div className="p-5 border-b border-line space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-heading">Tous les studios</h2>
              <p className="text-xs text-muted">Consultez et gérez chaque studio enregistré sur FotoDesk.</p>
            </div>
            <span className="text-xs text-muted">{filtered.length} studios affichés</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher par nom de studio, propriétaire ou e-mail..."
                className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:border-neutral-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value as 'all' | PlanName);
                  setPage(1);
                }}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Toutes les offres</option>
                <option value="Starter">Starter</option>
                <option value="Pro Mensuel">Pro Mensuel</option>
                <option value="Pro Annuel">Pro Annuel</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | StudioStatus);
                  setPage(1);
                }}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="pending">En attente</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'az' | 'za')}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="newest">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="az">Nom A–Z</option>
                <option value="za">Nom Z–A</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="py-3 px-5">Studio</th>
                <th className="py-3 px-4">Propriétaire</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Offre</th>
                <th className="py-3 px-4">Inscription</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {paginated.map((s) => (
                <tr key={s.id} className="hover:bg-subtle/40 transition-colors">
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className="flex items-center gap-3 text-left hover:underline"
                    >
                      <span className="w-8 h-8 rounded-lg bg-subtle border border-line text-xs font-bold flex items-center justify-center shrink-0">
                        {s.initials}
                      </span>
                      <div>
                        <p className="font-semibold text-heading">{s.name}</p>
                        <p className="text-[11px] text-muted">{s.id}</p>
                      </div>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-heading whitespace-nowrap">{s.owner}</td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{s.ownerEmail}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={s.plan === 'Pro Annuel' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium px-2.5 py-0.5 rounded-full' : 'badge-neutral'}>
                      {s.plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{s.registeredAt}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{statusBadge(s.status)}</td>
                  <td className="py-3.5 px-5 text-right relative whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                      className="w-8 h-8 rounded-lg hover:bg-subtle inline-flex items-center justify-center text-soft"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenuId === s.id && (
                      <div className="absolute right-5 mt-1 w-48 bg-panel border border-line rounded-xl shadow-lg py-1.5 z-30 text-left text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setSelectedId(s.id);
                          }}
                          className="w-full px-3.5 py-2 hover:bg-subtle text-heading"
                        >
                          Voir le studio
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onOpenUser(s.ownerEmail);
                          }}
                          className="w-full px-3.5 py-2 hover:bg-subtle text-heading"
                        >
                          Voir le propriétaire
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onOpenSubscription(s.name);
                          }}
                          className="w-full px-3.5 py-2 hover:bg-subtle text-heading"
                        >
                          Voir la souscription
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t border-line flex items-center justify-between text-xs text-muted">
          <span>
            Affichage {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filtered.length)} sur {filtered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-line flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                type="button"
                onClick={() => setPage(pNum)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                  pNum === safePage ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'border border-line'
                }`}
              >
                {pNum}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg border border-line flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {renderModalAndToast()}
    </div>
  );
};
