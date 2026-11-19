import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Search,
  User,
  Users,
  X,
} from 'lucide-react';

type UserStatus = 'active' | 'pending' | 'suspended';
type UserType = "Membre d'équipe" | 'Propriétaire';

interface PlatformUser {
  id: string;
  initials: string;
  name: string;
  email: string;
  userType: UserType;
  studioName: string;
  studioId: string;
  studioPlan: string;
  registeredAt: string;
  lastActivity: string;
  status: UserStatus;
  activities: Array<{ id: string; title: string; date: string; tag: string }>;
  statusHistory: Array<{ id: string; from: string; to: string; by: string; date: string; reason: string }>;
}

const INITIAL_USERS: PlatformUser[] = [
  {
    id: 'USR-002444',
    initials: 'NA',
    name: 'Noah Anderson',
    email: 'noah@northlight.com',
    userType: "Membre d'équipe",
    studioName: 'Northlight Studio',
    studioId: 'STD-001248',
    studioPlan: 'Pro Mensuel',
    registeredAt: '14 nov. 2026',
    lastActivity: "Aujourd'hui, 08:52",
    status: 'active',
    activities: [
      { id: 'ua-1', title: 'Dernière connexion', date: "Aujourd'hui, 08:52", tag: 'Compte' },
      { id: 'ua-2', title: 'A rejoint le studio Northlight Studio', date: '14 nov. 2026', tag: 'Studio' },
      { id: 'ua-3', title: "Vérification de l'e-mail terminée", date: '14 nov. 2026', tag: 'Compte' },
      { id: 'ua-4', title: 'Compte créé', date: '14 nov. 2026', tag: 'Compte' },
    ],
    statusHistory: [],
  },
  {
    id: 'USR-002450',
    initials: 'AM',
    name: 'Alex Morgan',
    email: 'alex@northlight.com',
    userType: 'Propriétaire',
    studioName: 'Northlight Studio',
    studioId: 'STD-001248',
    studioPlan: 'Pro Mensuel',
    registeredAt: '12 nov. 2026',
    lastActivity: "Aujourd'hui, 10:42",
    status: 'active',
    activities: [
      { id: 'ua-5', title: 'Dernière connexion', date: "Aujourd'hui, 10:42", tag: 'Compte' },
      { id: 'ua-6', title: 'Studio Northlight créé', date: '12 nov. 2026', tag: 'Studio' },
    ],
    statusHistory: [],
  },
  {
    id: 'USR-002443',
    initials: 'IT',
    name: 'Isabella Thomas',
    email: 'isabella@capturehouse.com',
    userType: "Membre d'équipe",
    studioName: 'Capture House',
    studioId: 'STD-001246',
    studioPlan: 'Pro Annuel',
    registeredAt: '11 nov. 2026',
    lastActivity: 'Hier, 18:24',
    status: 'active',
    activities: [{ id: 'ua-7', title: 'Compte créé', date: '11 nov. 2026', tag: 'Compte' }],
    statusHistory: [],
  },
  {
    id: 'USR-002449',
    initials: 'EW',
    name: 'Emma Wilson',
    email: 'emma@lumiere.com',
    userType: 'Propriétaire',
    studioName: 'Lumière Photography',
    studioId: 'STD-001247',
    studioPlan: 'Starter',
    registeredAt: '10 nov. 2026',
    lastActivity: "Aujourd'hui, 09:18",
    status: 'active',
    activities: [{ id: 'ua-8', title: 'Compte créé', date: '10 nov. 2026', tag: 'Compte' }],
    statusHistory: [],
  },
  {
    id: 'USR-002448',
    initials: 'DB',
    name: 'Daniel Brown',
    email: 'daniel@capturehouse.com',
    userType: 'Propriétaire',
    studioName: 'Capture House',
    studioId: 'STD-001246',
    studioPlan: 'Pro Annuel',
    registeredAt: '08 nov. 2026',
    lastActivity: 'Hier, 16:32',
    status: 'active',
    activities: [{ id: 'ua-9', title: 'Compte créé', date: '08 nov. 2026', tag: 'Compte' }],
    statusHistory: [],
  },
  {
    id: 'USR-002447',
    initials: 'ST',
    name: 'Sophia Taylor',
    email: 'sophia@studioframe.com',
    userType: 'Propriétaire',
    studioName: 'Studio Frame',
    studioId: 'STD-001245',
    studioPlan: 'Starter',
    registeredAt: '05 nov. 2026',
    lastActivity: '06 nov. 2026',
    status: 'suspended',
    activities: [{ id: 'ua-10', title: 'Compte créé', date: '05 nov. 2026', tag: 'Compte' }],
    statusHistory: [
      { id: 'uh-1', from: 'Actif', to: 'Suspendu', by: 'Alex Morgan', date: '06 nov. 2026', reason: 'Vérification requise' },
    ],
  },
  {
    id: 'USR-002446',
    initials: 'JM',
    name: 'James Miller',
    email: 'james@goldenhour.com',
    userType: 'Propriétaire',
    studioName: 'Golden Hour Studio',
    studioId: 'STD-001244',
    studioPlan: 'Pro Mensuel',
    registeredAt: '02 nov. 2026',
    lastActivity: '04 nov. 2026',
    status: 'pending',
    activities: [{ id: 'ua-11', title: 'Invitation envoyée', date: '02 nov. 2026', tag: 'Compte' }],
    statusHistory: [],
  },
  {
    id: 'USR-002445',
    initials: 'CD',
    name: 'Claire Dubois',
    email: 'claire@atelierriviera.fr',
    userType: 'Propriétaire',
    studioName: 'Atelier Riviera',
    studioId: 'STD-001243',
    studioPlan: 'Pro Annuel',
    registeredAt: '29 oct. 2026',
    lastActivity: "Aujourd'hui, 07:45",
    status: 'active',
    activities: [{ id: 'ua-12', title: 'Compte créé', date: '29 oct. 2026', tag: 'Compte' }],
    statusHistory: [],
  },
];

interface Props {
  initialEmail?: string | null;
  onOpenStudio: (studioName: string) => void;
}

export const SuperAdminUsersSection: React.FC<Props> = ({ initialEmail, onOpenStudio }) => {
  const [users, setUsers] = useState<PlatformUser[]>(INITIAL_USERS);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (!initialEmail) return null;
    return INITIAL_USERS.find((u) => u.email.toLowerCase() === initialEmail.toLowerCase())?.id ?? null;
  });

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | UserType>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az'>('newest');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);

  // Suspend modal
  const [suspendTarget, setSuspendTarget] = useState<PlatformUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendError, setSuspendError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedId) ?? null,
    [users, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => {
        if (statusFilter !== 'all' && u.status !== statusFilter) return false;
        if (typeFilter !== 'all' && u.userType !== typeFilter) return false;
        if (
          q &&
          !u.name.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q) &&
          !u.studioName.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'az') return a.name.localeCompare(b.name);
        if (sortBy === 'oldest') return a.id.localeCompare(b.id);
        return b.id.localeCompare(a.id);
      });
  }, [users, search, statusFilter, typeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const statusBadge = (status: UserStatus) => {
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

  const handleConfirmSuspend = () => {
    if (!suspendTarget) return;
    if (!suspendReason.trim()) {
      setSuspendError('Veuillez saisir une raison de suspension.');
      return;
    }
    const nextStatus: UserStatus = suspendTarget.status === 'suspended' ? 'active' : 'suspended';
    setUsers((prev) =>
      prev.map((u) =>
        u.id === suspendTarget.id
          ? {
              ...u,
              status: nextStatus,
              statusHistory: [
                {
                  id: `uh-${Date.now()}`,
                  from: u.status === 'suspended' ? 'Suspendu' : 'Actif',
                  to: nextStatus === 'suspended' ? 'Suspendu' : 'Actif',
                  by: 'Alex Morgan',
                  date: "Aujourd'hui",
                  reason: suspendReason.trim(),
                },
                ...u.statusHistory,
              ],
            }
          : u
      )
    );
    setSuspendTarget(null);
    setSuspendReason('');
    setSuspendError(null);
    showToast(
      nextStatus === 'suspended'
        ? 'Utilisateur suspendu avec succès.'
        : 'Utilisateur réactivé avec succès.'
    );
  };

  // DETAIL VIEW
  if (selectedUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-heading hover:underline"
          >
            Utilisateurs
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{selectedUser.name}</span>
        </div>

        {/* Header Card */}
        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-subtle border border-line font-bold text-heading flex items-center justify-center shrink-0">
              {selectedUser.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-heading">{selectedUser.name}</h2>
                <span className="badge-neutral">{selectedUser.userType}</span>
                {statusBadge(selectedUser.status)}
              </div>
              <p className="text-xs text-muted mt-1">
                {selectedUser.id} · {selectedUser.email} · Inscrit le {selectedUser.registeredAt}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSuspendTarget(selectedUser);
              setSuspendReason('');
              setSuspendError(null);
            }}
            className={
              selectedUser.status === 'suspended'
                ? 'btn-primary text-xs py-2 px-3.5'
                : 'btn-danger text-xs py-2 px-3.5'
            }
          >
            {selectedUser.status === 'suspended' ? "Réactiver l'utilisateur" : "Suspendre l'utilisateur"}
          </button>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-heading">Informations utilisateur</h3>
                <p className="text-xs text-muted">Détails du compte et statut sur la plateforme.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted">Nom complet</p>
                    <p className="font-semibold text-heading mt-0.5">{selectedUser.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted">Adresse e-mail</p>
                    <p className="font-semibold text-heading mt-0.5">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted">Type de compte</p>
                    <p className="font-semibold text-heading mt-0.5">{selectedUser.userType}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted">Date d&apos;inscription</p>
                    <p className="font-semibold text-heading mt-0.5">{selectedUser.registeredAt}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted">Dernière activité</p>
                  <p className="font-semibold text-heading mt-0.5">{selectedUser.lastActivity}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Statut du compte</p>
                  {statusBadge(selectedUser.status)}
                </div>
              </div>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-heading">Activité du compte</h3>
                <p className="text-xs text-muted">Chronologie des événements de ce compte.</p>
              </div>
              <div className="divide-y divide-line/60 text-xs">
                {selectedUser.activities.map((a) => (
                  <div key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-heading">{a.title}</p>
                      <p className="text-muted">{a.date}</p>
                    </div>
                    <span className="badge-neutral">{a.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-panel border border-line rounded-2xl p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-heading">Studio associé</h3>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-muted" />
                  <div>
                    <p className="text-sm font-semibold text-heading">{selectedUser.studioName}</p>
                    <p className="text-[11px] text-muted">{selectedUser.studioId}</p>
                  </div>
                </div>
                <span className="badge-success">Actif</span>
              </div>
              <div className="text-xs flex justify-between pt-2 border-t border-line">
                <span className="text-muted">Offre</span>
                <span className="font-semibold text-heading">{selectedUser.studioPlan}</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenStudio(selectedUser.studioName)}
                className="btn-outline w-full justify-center text-xs"
              >
                Voir le studio <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-heading">Historique des statuts</h3>
              {selectedUser.statusHistory.length === 0 ? (
                <p className="text-xs text-muted">Aucun changement de statut enregistré.</p>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {selectedUser.statusHistory.map((h) => (
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
                    {suspendTarget.status === 'suspended' ? 'Réactiver cet utilisateur ?' : 'Suspendre cet utilisateur ?'}
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
                <strong className="text-heading">
                  {suspendTarget.name} ({suspendTarget.email})
                </strong>{' '}
                ?
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
                Ce changement restreint uniquement l&apos;accès. Il ne supprime pas le compte ni les données du studio.
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
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total des utilisateurs', value: '2 450', sub: 'Tous les comptes inscrits' },
          { label: 'Utilisateurs actifs', value: '2 180', sub: 'Comptes actifs' },
          { label: 'En attente', value: '120', sub: 'Comptes en attente' },
          { label: 'Suspendus', value: '150', sub: 'Accès restreint' },
        ].map((k) => (
          <div key={k.label} className="bg-panel border border-line rounded-2xl p-4 shadow-xs space-y-1.5">
            <Users className="w-4 h-4 text-muted" />
            <p className="text-xs text-muted pt-1">{k.label}</p>
            <p className="text-2xl font-bold text-heading">{k.value}</p>
            <p className="text-[11px] text-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* All Users Table */}
      <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-line space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-heading">Tous les utilisateurs</h2>
              <p className="text-xs text-muted">Consultez et gérez chaque compte utilisateur de la plateforme.</p>
            </div>
            <span className="text-xs text-muted">{filtered.length} résultats</span>
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
                placeholder="Rechercher par nom, e-mail ou studio..."
                className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:border-neutral-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | UserStatus);
                  setPage(1);
                }}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="pending">En attente</option>
                <option value="suspended">Suspendu</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as 'all' | UserType);
                  setPage(1);
                }}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Tous les types</option>
                <option value="Propriétaire">Propriétaire</option>
                <option value="Membre d'équipe">Membre d&apos;équipe</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'az')}
                className="h-10 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="newest">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="az">Nom A–Z</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="py-3 px-5">Utilisateur</th>
                <th className="py-3 px-4">Adresse e-mail</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Studio associé</th>
                <th className="py-3 px-4">Inscription</th>
                <th className="py-3 px-4">Dernière activité</th>
                <th className="py-3 px-5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {paginated.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className="hover:bg-subtle/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-subtle border border-line text-xs font-bold flex items-center justify-center shrink-0">
                        {u.initials}
                      </span>
                      <div>
                        <p className="font-semibold text-heading">{u.name}</p>
                        <p className="text-[11px] text-muted">{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{u.email}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="badge-neutral">{u.userType}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-heading whitespace-nowrap">{u.studioName}</td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{u.registeredAt}</td>
                  <td className="py-3.5 px-4 text-soft whitespace-nowrap">{u.lastActivity}</td>
                  <td className="py-3.5 px-5 whitespace-nowrap">{statusBadge(u.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>Lignes par page</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 px-2 bg-panel border border-line rounded-lg text-heading"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
          <span>
            Affichage {filtered.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1}–
            {Math.min(safePage * rowsPerPage, filtered.length)} sur {filtered.length}
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
