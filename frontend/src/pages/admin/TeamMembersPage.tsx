import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';

type MemberStatus = 'pending' | 'active' | 'inactive';

type PermissionKey = 'view' | 'create' | 'edit' | 'delete';

interface ModulePermission {
  moduleId: string;
  moduleLabel: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  accessLevel: string;
  status: MemberStatus;
  dateAdded: string;
  sortOrder: number;
  permissions: ModulePermission[];
}

const MODULES: Array<{ id: string; label: string }> = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'clients', label: 'Clients' },
  { id: 'projects', label: 'Projets' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'photoGalleries', label: 'Galeries photo' },
  { id: 'videoGalleries', label: 'Galeries vidéo' },
  { id: 'quotes', label: 'Devis' },
  { id: 'contracts', label: 'Contrats' },
  { id: 'invoices', label: 'Factures' },
  { id: 'payments', label: 'Paiements' },
  { id: 'landingBuilder', label: 'Constructeur de page' },
  { id: 'affiliate', label: 'Affiliation' },
  { id: 'settings', label: 'Paramètres' },
];

function buildPermissions(
  enabledMap: Record<string, Partial<Record<PermissionKey, boolean>>>
): ModulePermission[] {
  return MODULES.map((m) => {
    const cfg = enabledMap[m.id] ?? {};
    return {
      moduleId: m.id,
      moduleLabel: m.label,
      view: Boolean(cfg.view),
      create: Boolean(cfg.create),
      edit: Boolean(cfg.edit),
      delete: Boolean(cfg.delete),
    };
  });
}

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'm-1',
    fullName: 'Daniel Brown',
    email: 'daniel@northlight.com',
    accessLevel: 'Accès personnalisé',
    status: 'pending',
    dateAdded: '8 juin 2025',
    sortOrder: 8,
    permissions: buildPermissions({
      dashboard: { view: true },
      clients: { view: true, create: true, edit: true, delete: true },
      projects: { view: true, create: true, edit: true, delete: true },
      calendar: { view: true, create: true, edit: true, delete: true },
      photoGalleries: { view: true },
      videoGalleries: { view: true },
      quotes: { view: true, create: true, edit: true, delete: true },
      contracts: { view: true, create: true, edit: true, delete: true },
      invoices: { view: true },
      payments: { view: true },
    }),
  },
  {
    id: 'm-2',
    fullName: 'Noah Clark',
    email: 'noah@northlight.com',
    accessLevel: 'Accès personnalisé',
    status: 'pending',
    dateAdded: '7 juin 2025',
    sortOrder: 7,
    permissions: buildPermissions({
      dashboard: { view: true },
      photoGalleries: { view: true, create: true, edit: true },
      videoGalleries: { view: true, create: true },
    }),
  },
  {
    id: 'm-3',
    fullName: 'Alex Morgan',
    email: 'alex@northlight.com',
    accessLevel: 'Accès personnalisé',
    status: 'active',
    dateAdded: '3 juin 2025',
    sortOrder: 6,
    permissions: buildPermissions({
      dashboard: { view: true, create: true },
      clients: { view: true, create: true, edit: true },
      projects: { view: true, create: true, edit: true },
      calendar: { view: true, create: true, edit: true },
      photoGalleries: { view: true, create: true, edit: true },
      videoGalleries: { view: true, create: true, edit: true, delete: true },
      quotes: { view: true, create: true },
      contracts: { view: true, edit: true, delete: true },
    }),
  },
  {
    id: 'm-4',
    fullName: 'Emma Wilson',
    email: 'emma@northlight.com',
    accessLevel: 'Accès personnalisé',
    status: 'active',
    dateAdded: '26 mai 2025',
    sortOrder: 5,
    permissions: buildPermissions({
      dashboard: { view: true },
      clients: { view: true, create: true },
      calendar: { view: true, create: true, edit: true },
      photoGalleries: { view: true, create: true },
      invoices: { view: true },
    }),
  },
  {
    id: 'm-5',
    fullName: 'Sophia Taylor',
    email: 'sophia@northlight.com',
    accessLevel: 'Accès personnalisé',
    status: 'active',
    dateAdded: '18 mai 2025',
    sortOrder: 4,
    permissions: buildPermissions({
      dashboard: { view: true },
      projects: { view: true, edit: true },
      photoGalleries: { view: true, create: true, edit: true },
      contracts: { view: true },
    }),
  },
  {
    id: 'm-6',
    fullName: 'Liam Carter',
    email: 'liam@northlight.com',
    accessLevel: 'Accès personnalisé',
    status: 'active',
    dateAdded: '10 mai 2025',
    sortOrder: 3,
    permissions: buildPermissions({
      dashboard: { view: true },
      clients: { view: true },
      quotes: { view: true, create: true },
      invoices: { view: true, create: true },
      payments: { view: true },
      affiliate: { view: true },
    }),
  },
  {
    id: 'm-7',
    fullName: 'Chloé Martin',
    email: 'chloe@northlight.com',
    accessLevel: 'Accès personnalisé',
    status: 'inactive',
    dateAdded: '2 mai 2025',
    sortOrder: 2,
    permissions: buildPermissions({
      dashboard: { view: true },
      photoGalleries: { view: true },
    }),
  },
  {
    id: 'm-8',
    fullName: 'Lucas Bernard',
    email: 'lucas@northlight.com',
    accessLevel: 'Accès personnalisé',
    status: 'active',
    dateAdded: '24 avr. 2025',
    sortOrder: 1,
    permissions: buildPermissions({
      dashboard: { view: true },
      calendar: { view: true },
      projects: { view: true },
      videoGalleries: { view: true, create: true, edit: true },
    }),
  },
];

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'TM';

const countViewedModules = (permissions: ModulePermission[]) =>
  permissions.filter((p) => p.view || p.create || p.edit || p.delete).length;

const StatusPill: React.FC<{ status: MemberStatus }> = ({ status }) => {
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
      Inactif
    </span>
  );
};

export const TeamMembersPage: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Modals
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPermissions, setFormPermissions] = useState<ModulePermission[]>(() =>
    buildPermissions({})
  );
  const [formError, setFormError] = useState<string | null>(null);

  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  // Toast
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const showToast = (message: string, title = 'Succès') => {
    setToast({ title, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  );

  // KPIs
  const kpis = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === 'active').length;
    const pending = members.filter((m) => m.status === 'pending').length;
    const inactive = members.filter((m) => m.status === 'inactive').length;
    return { total, active, pending, inactive };
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => {
        if (statusFilter !== 'all' && m.status !== statusFilter) return false;
        if (q && !m.fullName.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.sortOrder - a.sortOrder;
        if (sortBy === 'oldest') return a.sortOrder - b.sortOrder;
        return a.fullName.localeCompare(b.fullName);
      });
  }, [members, search, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedMembers = filteredMembers.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormEmail('');
    setFormPermissions(buildPermissions({}));
    setFormError(null);
    setEditorOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormName(member.fullName);
    setFormEmail(member.email);
    setFormPermissions(member.permissions.map((p) => ({ ...p })));
    setFormError(null);
    setEditorOpen(true);
  };

  const togglePermission = (moduleId: string, key: PermissionKey) => {
    setFormPermissions((prev) =>
      prev.map((row) => {
        if (row.moduleId !== moduleId) return row;
        const nextVal = !row[key];
        const updated = { ...row, [key]: nextVal };
        if (key !== 'view' && nextVal) {
          updated.view = true;
        }
        if (key === 'view' && !nextVal) {
          updated.create = false;
          updated.edit = false;
          updated.delete = false;
        }
        return updated;
      })
    );
  };

  const selectAllPermissions = () => {
    setFormPermissions((prev) =>
      prev.map((row) => ({ ...row, view: true, create: true, edit: true, delete: true }))
    );
  };

  const clearAllPermissions = () => {
    setFormPermissions((prev) =>
      prev.map((row) => ({ ...row, view: false, create: false, edit: false, delete: false }))
    );
  };

  const handleSaveMember = () => {
    setFormError(null);
    if (!formName.trim()) {
      setFormError('Veuillez saisir le nom complet du membre.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    if (editingMember) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? {
                ...m,
                fullName: formName.trim(),
                email: formEmail.trim(),
                permissions: formPermissions,
              }
            : m
        )
      );
      setEditorOpen(false);
      showToast('Membre mis à jour avec succès.');
    } else {
      const nextMember: TeamMember = {
        id: `m-${Date.now()}`,
        fullName: formName.trim(),
        email: formEmail.trim(),
        accessLevel: 'Accès personnalisé',
        status: 'pending',
        dateAdded: "Aujourd'hui",
        sortOrder: Math.max(0, ...members.map((m) => m.sortOrder)) + 1,
        permissions: formPermissions,
      };
      setMembers((prev) => [nextMember, ...prev]);
      setPage(1);
      setEditorOpen(false);
      showToast('Invitation envoyée avec succès.');
    }
  };

  const handleConfirmRemove = () => {
    if (!memberToRemove) return;
    const removedId = memberToRemove.id;
    setMembers((prev) => prev.filter((m) => m.id !== removedId));
    setMemberToRemove(null);
    if (selectedMemberId === removedId) {
      setSelectedMemberId(null);
    }
    showToast('Membre retiré avec succès.');
  };

  const selectedModulesCount = countViewedModules(formPermissions);

  // DETAIL VIEW
  if (selectedMember) {
    const moduleCount = countViewedModules(selectedMember.permissions);

    return (
      <div className="space-y-6 pb-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <button
            type="button"
            onClick={() => setSelectedMemberId(null)}
            className="text-accent hover:underline"
          >
            Membres de l&apos;équipe
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-heading">{selectedMember.fullName}</span>
        </div>

        {/* Member Header Card */}
        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-base font-bold text-accent shrink-0">
              {getInitials(selectedMember.fullName)}
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Membre de l&apos;équipe
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-heading">
                {selectedMember.fullName}
              </h1>
              <p className="text-xs text-muted">
                {selectedMember.email} · Ajouté le {selectedMember.dateAdded}
              </p>
              <div className="pt-1">
                <StatusPill status={selectedMember.status} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => openEditModal(selectedMember)}
              className="btn-outline text-xs sm:text-sm"
            >
              Modifier le membre
            </button>
            {selectedMember.status === 'pending' && (
              <button
                type="button"
                onClick={() => showToast('Invitation renvoyée avec succès.')}
                className="btn-outline text-xs sm:text-sm"
              >
                Renvoyer l&apos;invitation
              </button>
            )}
            <button
              type="button"
              onClick={() => setMemberToRemove(selectedMember)}
              className="px-3.5 py-2 rounded-xl border border-red-500/30 text-red-600 hover:bg-red-500/10 text-xs sm:text-sm font-medium transition-colors"
            >
              {selectedMember.status === 'pending' ? "Supprimer l'invitation" : 'Retirer le membre'}
            </button>
          </div>
        </div>

        {/* Member Info & Access Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-base font-semibold text-heading">Informations du membre</h2>
              <p className="text-xs text-muted mt-0.5">
                Détails d&apos;accès et d&apos;invitation au studio.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="border-b border-line/60 pb-3">
                <p className="text-xs text-muted">Nom complet</p>
                <p className="text-sm font-semibold text-heading mt-0.5">
                  {selectedMember.fullName}
                </p>
              </div>
              <div className="border-b border-line/60 pb-3">
                <p className="text-xs text-muted">E-mail</p>
                <p className="text-sm font-semibold text-heading mt-0.5">{selectedMember.email}</p>
              </div>
              <div className="border-b border-line/60 pb-3">
                <p className="text-xs text-muted">Type d&apos;accès</p>
                <p className="text-sm font-semibold text-heading mt-0.5">
                  {selectedMember.accessLevel}
                </p>
              </div>
              <div className="border-b border-line/60 pb-3">
                <p className="text-xs text-muted">Date d&apos;ajout</p>
                <p className="text-sm font-semibold text-heading mt-0.5">
                  {selectedMember.dateAdded}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Statut de l&apos;invitation</p>
                <StatusPill status={selectedMember.status} />
              </div>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <h2 className="text-base font-semibold text-heading">Résumé des accès</h2>
              <p className="text-xs text-muted mt-0.5">Accès par fonctionnalité.</p>
            </div>
            <div className="bg-subtle border border-line/70 rounded-xl p-5 text-center my-4">
              <p className="text-3xl font-bold text-heading">{moduleCount}</p>
              <p className="text-xs text-muted mt-1">sur {MODULES.length} modules</p>
            </div>
            <p className="text-xs text-muted text-center leading-relaxed">
              La gestion des membres de l&apos;équipe est toujours réservée au propriétaire du studio.
            </p>
          </div>
        </div>

        {/* Assigned Permissions Table */}
        <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 border-b border-line">
            <div>
              <h2 className="text-base font-semibold text-heading">Permissions attribuées</h2>
              <p className="text-xs text-muted mt-0.5">
                Accès actuels pour chaque module de l&apos;espace photographe.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openEditModal(selectedMember)}
              className="btn-outline text-xs sm:text-sm"
            >
              Modifier les permissions
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle/70 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="py-3 px-5">Module</th>
                  <th className="py-3 px-4 text-center">Voir</th>
                  <th className="py-3 px-4 text-center">Créer</th>
                  <th className="py-3 px-4 text-center">Modifier</th>
                  <th className="py-3 px-4 text-center">Supprimer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-sm">
                {selectedMember.permissions.map((perm) => (
                  <tr key={perm.moduleId} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3 px-5 font-medium text-heading">{perm.moduleLabel}</td>
                    {(['view', 'create', 'edit', 'delete'] as PermissionKey[]).map((key) => (
                      <td key={key} className="py-3 px-4 text-center">
                        {perm[key] ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            Oui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted">
                            <X className="w-3.5 h-3.5" />
                            Non
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals & Toast */}
        {renderModals()}
      </div>
    );
  }

  function renderModals() {
    return (
      <>
        {/* Add / Edit Member Modal */}
        {editorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-line flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h2 className="text-lg font-bold text-heading mt-0.5">
                    {editingMember ? 'Modifier le membre' : 'Ajouter un membre'}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Invitez un collaborateur dans votre studio et personnalisez ses accès.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 shrink-0"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {formError && (
                  <p className="text-xs font-medium text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2">
                    {formError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-heading mb-1.5">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Saisir le nom complet"
                      className="w-full h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-heading mb-1.5">
                      Adresse e-mail
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="Saisir l'adresse e-mail"
                      className="w-full h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-heading mb-1.5">
                      Type d&apos;accès
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Accès personnalisé"
                      className="w-full h-10 px-3.5 text-sm bg-subtle border border-line rounded-xl text-soft cursor-default"
                    />
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-heading">
                        Personnaliser les permissions
                      </h3>
                      <p className="text-xs text-muted">
                        Choisissez les zones du studio accessibles à ce membre.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllPermissions}
                        className="btn-outline text-xs py-1.5 px-3"
                      >
                        Tout sélectionner
                      </button>
                      <button
                        type="button"
                        onClick={clearAllPermissions}
                        className="text-xs font-medium text-accent hover:underline px-2 py-1"
                      >
                        Tout effacer
                      </button>
                    </div>
                  </div>

                  <div className="border border-line rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-subtle border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                          <th className="py-2.5 px-4">Module</th>
                          <th className="py-2.5 px-3 text-center">Voir</th>
                          <th className="py-2.5 px-3 text-center">Créer</th>
                          <th className="py-2.5 px-3 text-center">Modifier</th>
                          <th className="py-2.5 px-3 text-center">Supprimer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60 text-sm">
                        {formPermissions.map((row) => (
                          <tr key={row.moduleId} className="hover:bg-subtle/40">
                            <td className="py-2.5 px-4 font-medium text-heading">
                              {row.moduleLabel}
                            </td>
                            {(['view', 'create', 'edit', 'delete'] as PermissionKey[]).map(
                              (key) => {
                                const checked = row[key];
                                return (
                                  <td key={key} className="py-2.5 px-3 text-center">
                                    <button
                                      type="button"
                                      role="checkbox"
                                      aria-checked={checked}
                                      onClick={() => togglePermission(row.moduleId, key)}
                                      className={`w-5 h-5 rounded-md border inline-flex items-center justify-center transition-colors ${
                                        checked
                                          ? 'bg-accent border-accent text-white'
                                          : 'bg-panel border-line hover:border-accent/60'
                                      }`}
                                    >
                                      {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                    </button>
                                  </td>
                                );
                              }
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-subtle border border-line/70 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-heading">
                      {selectedModulesCount} sur {MODULES.length} modules sélectionnés
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Les modules sans accès Voir sont masqués dans la barre latérale du membre.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-line flex items-center justify-end gap-3 bg-panel">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="btn-outline text-sm"
                >
                  Annuler
                </button>
                <button type="button" onClick={handleSaveMember} className="btn-primary text-sm">
                  {editingMember ? 'Enregistrer les modifications' : "Envoyer l'invitation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Confirmation Modal */}
        {memberToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">
                    Retirer ce membre ?
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMemberToRemove(null)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 py-1">
                <div className="w-11 h-11 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <p className="text-sm text-soft leading-relaxed">
                  Êtes-vous sûr de vouloir retirer{' '}
                  <span className="font-semibold text-heading">{memberToRemove.fullName}</span> de
                  votre studio ? Il n&apos;aura plus accès à votre espace de travail.
                </p>
                <p className="text-xs text-muted">
                  Les projets, clients, galeries, factures et autres contenus du studio ne seront pas supprimés.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMemberToRemove(null)}
                  className="btn-outline text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemove}
                  className="btn-danger"
                >
                  Retirer le membre
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 bg-panel border border-line rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-heading">{toast.title}</p>
              <p className="text-xs text-muted">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 shrink-0"
              aria-label="Fermer la notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </>
    );
  }

  // MAIN LIST VIEW
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted mb-1">
            Espace de travail <span className="mx-1">/</span> Membres de l&apos;équipe
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            Membres de l&apos;équipe
          </h1>
          <p className="text-sm text-muted mt-1">
            Gérez l&apos;équipe de votre studio et contrôlez les accès de chaque membre.
          </p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary text-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Ajouter un membre
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-panel border border-line rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Total des membres</p>
            <p className="text-2xl font-bold text-heading mt-0.5">
              {String(kpis.total).padStart(2, '0')}
            </p>
            <p className="text-xs text-muted mt-0.5">Tous les membres du studio</p>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Membres actifs</p>
            <p className="text-2xl font-bold text-heading mt-0.5">
              {String(kpis.active).padStart(2, '0')}
            </p>
            <p className="text-xs text-muted mt-0.5">Accès à l&apos;espace activé</p>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Invitations en attente</p>
            <p className="text-2xl font-bold text-heading mt-0.5">
              {String(kpis.pending).padStart(2, '0')}
            </p>
            <p className="text-xs text-muted mt-0.5">En attente d&apos;acceptation</p>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
            <X className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Membres inactifs</p>
            <p className="text-2xl font-bold text-heading mt-0.5">
              {String(kpis.inactive).padStart(2, '0')}
            </p>
            <p className="text-xs text-muted mt-0.5">Accès désactivé</p>
          </div>
        </div>
      </div>

      {/* Studio Team Table Card */}
      <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 space-y-4 border-b border-line">
          <div>
            <h2 className="text-base font-semibold text-heading">Équipe du studio</h2>
            <p className="text-xs text-muted mt-0.5">
              Consultez les invitations et les accès par fonctionnalité.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher par nom ou e-mail..."
                className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | MemberStatus);
                  setPage(1);
                }}
                className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>

              <select
                defaultValue="all"
                className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="all">Tous les niveaux d&apos;accès</option>
                <option value="custom">Accès personnalisé</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="newest">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="name">Nom (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="py-3 px-5">Membre</th>
                <th className="py-3 px-4">Adresse e-mail</th>
                <th className="py-3 px-4">Niveau d&apos;accès</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Date d&apos;ajout</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-sm">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-muted">
                    Aucun membre ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const featureCount = countViewedModules(member.permissions);
                  return (
                    <tr key={member.id} className="hover:bg-subtle/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/15 text-accent font-semibold text-xs flex items-center justify-center shrink-0">
                            {getInitials(member.fullName)}
                          </div>
                          <span className="font-medium text-heading whitespace-nowrap">
                            {member.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-soft whitespace-nowrap">{member.email}</td>
                      <td className="py-3.5 px-4 text-soft whitespace-nowrap">
                        {member.accessLevel}
                      </td>
                      <td className="py-3.5 px-4 text-soft whitespace-nowrap">
                        {featureCount} {featureCount > 1 ? 'modules' : 'module'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusPill status={member.status} />
                      </td>
                      <td className="py-3.5 px-4 text-soft whitespace-nowrap">
                        {member.dateAdded}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-3 text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberId(member.id)}
                            className="text-blue-600 hover:underline"
                          >
                            Voir
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            className="text-blue-600 hover:underline"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberToRemove(member)}
                            className="text-red-600 hover:underline"
                          >
                            Retirer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <span>
            Affichage {filteredMembers.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredMembers.length)} sur {filteredMembers.length}{' '}
            membres
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-line flex items-center justify-center hover:bg-subtle disabled:opacity-40"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
              <button
                key={pNum}
                type="button"
                onClick={() => setPage(pNum)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  pNum === safePage
                    ? 'bg-accent text-white'
                    : 'border border-line text-soft hover:bg-subtle'
                }`}
              >
                {pNum}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg border border-line flex items-center justify-center hover:bg-subtle disabled:opacity-40"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Permission Access Examples */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-heading">
            Exemples d&apos;accès par permissions
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Aperçu de l&apos;impact des permissions sur l&apos;espace de travail d&apos;un membre.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* View Only */}
          <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Lecture seule
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-subtle border border-line/70 flex items-center justify-center text-soft">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-heading">Clients</p>
                <p className="text-xs text-muted">La liste des clients reste accessible</p>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="w-full py-2 px-3 rounded-xl border border-line text-center text-xs font-medium text-blue-600 bg-panel">
                Ouvrir la fiche client
              </div>
              <div className="grid grid-cols-2 gap-2 opacity-50">
                <div className="py-1.5 px-2 rounded-lg border border-line text-center text-xs text-muted">
                  Ajouter un client
                </div>
                <div className="py-1.5 px-2 rounded-lg border border-line text-center text-xs text-muted">
                  Modifier
                </div>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Les actions de création et de modification sont désactivées car seule la lecture est accordée.
            </p>
          </div>

          {/* No Module Access */}
          <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Aucun accès module
            </p>
            <div className="bg-subtle border border-line/70 rounded-xl p-3 space-y-2 text-xs">
              <div className="text-soft font-medium">Tableau de bord</div>
              <div className="text-soft font-medium">Clients</div>
              <div className="text-soft font-medium">Projets</div>
              <div className="flex items-center justify-between text-muted pt-1 border-t border-line/60">
                <span>Paiements</span>
                <span className="px-2 py-0.5 rounded-md bg-panel border border-line text-[11px]">
                  Masqué
                </span>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Paiements est retiré de la barre latérale du membre lorsque l&apos;accès Voir n&apos;est pas accordé.
            </p>
          </div>

          {/* Owner Restricted */}
          <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Réservé au propriétaire
            </p>
            <div className="bg-subtle border border-line/70 rounded-xl p-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-panel border border-line flex items-center justify-center text-soft shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-heading truncate">
                    Membres de l&apos;équipe
                  </p>
                  <p className="text-[11px] text-muted truncate">Propriétaire uniquement</p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-panel border border-line text-soft shrink-0">
                • Restreint
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Les membres ne peuvent pas inviter, modifier des permissions, désactiver ou retirer d&apos;autres membres.
            </p>
          </div>
        </div>

        <div className="banner-info">
          <span>
            <strong className="font-semibold">Aperçu des permissions :</strong> en production, les autorisations doivent être vérifiées côté serveur sur chaque action et requête protégée. Masquer les contrôles d&apos;interface seul ne constitue pas une sécurité.
          </span>
        </div>
      </div>

      {renderModals()}
    </div>
  );
};

