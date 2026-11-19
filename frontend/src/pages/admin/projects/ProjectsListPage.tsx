import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  FolderKanban,
  Grid,
  Images,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Sparkles,
  Trash2,
  Video,
  X,
} from 'lucide-react';

type ProjectStatus = 'planning' | 'in_progress' | 'editing' | 'review';
type ProjectType = 'Mariage' | 'Portrait' | 'Commercial' | 'Événement';

interface ProjectRecord {
  id: string;
  name: string;
  client: string;
  clientEmail: string;
  clientPhone: string;
  type: ProjectType;
  date: string;
  time: string;
  location: string;
  status: ProjectStatus;
  notes: string;
  photoGalleries: Array<{ id: string; title: string; subtitle: string; status: 'Publiée' | 'Brouillon' }>;
  videoGalleries: Array<{ id: string; title: string; subtitle: string; status: 'Publiée' | 'Brouillon' }>;
  invoiceRef: { number: string; status: string };
  sortOrder: number;
}

const INITIAL_PROJECTS: ProjectRecord[] = [
  {
    id: 'prj-1',
    name: 'Rivera Editorial',
    client: 'Amelia Rivera',
    clientEmail: 'amelia@example.com',
    clientPhone: '(646) 555-0195',
    type: 'Commercial',
    date: '2025-05-24',
    time: '09:00',
    location: 'Northlight Studio',
    status: 'editing',
    notes: 'Série de portraits éditoriaux pour une publication indépendante.',
    photoGalleries: [
      { id: 'pg-1', title: 'Rivera Editorial — Preview', subtitle: '64 photos · Mis à jour le 8 juin', status: 'Publiée' },
    ],
    videoGalleries: [
      { id: 'vg-1', title: 'Rivera Editorial — Film', subtitle: '2 vidéos · Brouillon du 6 juin', status: 'Brouillon' },
    ],
    invoiceRef: { number: 'INV-2034', status: 'En attente' },
    sortOrder: 8,
  },
  {
    id: 'prj-2',
    name: 'Bennett Engagement',
    client: 'Ava Bennett',
    clientEmail: 'ava.bennett@example.com',
    clientPhone: '(212) 555-0142',
    type: 'Mariage',
    date: '2025-05-30',
    time: '17:00',
    location: 'DUMBO, Brooklyn',
    status: 'review',
    notes: 'Séance couple au coucher du soleil sur les quais de Brooklyn.',
    photoGalleries: [
      { id: 'pg-2', title: 'Bennett Engagement Gallery', subtitle: '48 photos · Prête', status: 'Publiée' },
    ],
    videoGalleries: [],
    invoiceRef: { number: 'INV-2031', status: 'Payée' },
    sortOrder: 7,
  },
  {
    id: 'prj-3',
    name: 'Anderson Wedding',
    client: 'Elena Anderson',
    clientEmail: 'elena.anderson@example.com',
    clientPhone: '(917) 555-0178',
    type: 'Mariage',
    date: '2025-06-14',
    time: '10:00',
    location: 'Brooklyn Botanic Garden',
    status: 'in_progress',
    notes: 'Couverture complète de la cérémonie et réception.',
    photoGalleries: [],
    videoGalleries: [],
    invoiceRef: { number: 'INV-2038', status: 'Envoyée' },
    sortOrder: 6,
  },
  {
    id: 'prj-4',
    name: 'Harper Brand Campaign',
    client: 'Jordan Harper',
    clientEmail: 'jordan.harper@example.com',
    clientPhone: '(718) 555-0133',
    type: 'Commercial',
    date: '2025-06-18',
    time: '14:00',
    location: 'Northlight Studio',
    status: 'editing',
    notes: 'Campagne printemps-été pour le lancement produit.',
    photoGalleries: [
      { id: 'pg-3', title: 'Harper Lookbook', subtitle: '92 photos · Sélection client', status: 'Publiée' },
    ],
    videoGalleries: [],
    invoiceRef: { number: 'INV-2035', status: 'Payée' },
    sortOrder: 5,
  },
  {
    id: 'prj-5',
    name: 'Patel Family Portraits',
    client: 'Maya Patel',
    clientEmail: 'maya.patel@example.com',
    clientPhone: '(646) 555-0121',
    type: 'Portrait',
    date: '2025-06-22',
    time: '10:00',
    location: 'Prospect Park',
    status: 'planning',
    notes: 'Séance famille en extérieur le matin.',
    photoGalleries: [],
    videoGalleries: [],
    invoiceRef: { number: 'INV-2040', status: 'Brouillon' },
    sortOrder: 4,
  },
  {
    id: 'prj-6',
    name: 'Chen Newborn Session',
    client: 'Lina Chen',
    clientEmail: 'lina.chen@example.com',
    clientPhone: '(212) 555-0166',
    type: 'Portrait',
    date: '2025-06-25',
    time: '11:00',
    location: 'Résidence Chen',
    status: 'planning',
    notes: 'Lumière naturelle à domicile.',
    photoGalleries: [],
    videoGalleries: [],
    invoiceRef: { number: 'INV-2041', status: 'Brouillon' },
    sortOrder: 3,
  },
  {
    id: 'prj-7',
    name: 'Summit Tech Conference',
    client: 'Daniel Smith',
    clientEmail: 'daniel.smith@example.com',
    clientPhone: '(646) 555-0147',
    type: 'Événement',
    date: '2025-07-02',
    time: '08:30',
    location: 'Javits Center',
    status: 'in_progress',
    notes: 'Conférences et photos de groupe.',
    photoGalleries: [],
    videoGalleries: [],
    invoiceRef: { number: 'INV-2042', status: 'Envoyée' },
    sortOrder: 2,
  },
  {
    id: 'prj-8',
    name: 'Carter Personal Branding',
    client: 'Emily Carter',
    clientEmail: 'emily.carter@example.com',
    clientPhone: '(917) 555-0114',
    type: 'Portrait',
    date: '2025-07-08',
    time: '15:00',
    location: 'Northlight Studio',
    status: 'planning',
    notes: 'Portraits corporate et réseaux sociaux.',
    photoGalleries: [],
    videoGalleries: [],
    invoiceRef: { number: 'INV-2043', status: 'Brouillon' },
    sortOrder: 1,
  },
];

const formatDateFr = (isoDate: string) => {
  if (!isoDate) return '—';
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CL';

const StatusPill: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const cfg: Record<ProjectStatus, { cls: string; dot: string; label: string }> = {
    planning: {
      cls: 'badge-neutral',
      dot: 'bg-current opacity-70',
      label: 'Planification',
    },
    in_progress: {
      cls: 'badge-info',
      dot: 'bg-current',
      label: 'En cours',
    },
    editing: {
      cls: 'badge-warning',
      dot: 'bg-current',
      label: 'Retouche',
    },
    review: {
      cls: 'badge-success',
      dot: 'bg-current',
      label: 'Révision',
    },
  };
  const item = cfg[status];
  return (
    <span className={item.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
};

const inputCls =
  'w-full h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors';

const labelCls = 'block text-xs font-medium text-heading mb-1.5';

export const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRecord[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filters & view
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ProjectType>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Create / Edit modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  const [formName, setFormName] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formType, setFormType] = useState<ProjectType>('Commercial');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('planning');
  const [formDate, setFormDate] = useState('2025-06-15');
  const [formTime, setFormTime] = useState('10:00');
  const [formLocation, setFormLocation] = useState('Northlight Studio');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<ProjectRecord | null>(null);

  // Toast
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const showToast = (message: string, title = 'Succès') => {
    setToast({ title, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  // KPIs
  const kpis = useMemo(() => {
    return {
      planning: projects.filter((p) => p.status === 'planning').length,
      inProgress: projects.filter((p) => p.status === 'in_progress').length,
      editing: projects.filter((p) => p.status === 'editing').length,
      review: projects.filter((p) => p.status === 'review').length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (typeFilter !== 'all' && p.type !== typeFilter) return false;
        if (
          q &&
          !p.name.toLowerCase().includes(q) &&
          !p.client.toLowerCase().includes(q) &&
          !p.location.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return a.date.localeCompare(b.date);
      });
  }, [projects, search, statusFilter, typeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedProjects = filteredProjects.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormClient('');
    setFormType('Commercial');
    setFormStatus('planning');
    setFormDate('2025-06-15');
    setFormTime('10:00');
    setFormLocation('Northlight Studio');
    setFormNotes('');
    setFormError(null);
    setEditorOpen(true);
  };

  const openEditModal = (project: ProjectRecord) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormClient(project.client);
    setFormType(project.type);
    setFormStatus(project.status);
    setFormDate(project.date);
    setFormTime(project.time);
    setFormLocation(project.location);
    setFormNotes(project.notes);
    setFormError(null);
    setOpenMenuId(null);
    setEditorOpen(true);
  };

  const handleSaveProject = () => {
    setFormError(null);
    if (!formName.trim()) {
      setFormError('Le nom du projet est requis.');
      return;
    }
    if (editingProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? {
                ...p,
                name: formName.trim(),
                client: formClient.trim() || p.client,
                type: formType,
                status: formStatus,
                date: formDate,
                time: formTime,
                location: formLocation.trim() || p.location,
                notes: formNotes.trim(),
              }
            : p
        )
      );
      setEditorOpen(false);
      showToast('Projet mis à jour avec succès.');
    } else {
      const next: ProjectRecord = {
        id: `prj-${Date.now()}`,
        name: formName.trim(),
        client: formClient.trim() || 'Nouveau client',
        clientEmail: 'client@example.com',
        clientPhone: '(212) 555-0100',
        type: formType,
        date: formDate,
        time: formTime,
        location: formLocation.trim() || 'Northlight Studio',
        status: formStatus,
        notes: formNotes.trim(),
        photoGalleries: [],
        videoGalleries: [],
        invoiceRef: { number: `INV-${2044 + projects.length}`, status: 'Brouillon' },
        sortOrder: Math.max(0, ...projects.map((p) => p.sortOrder)) + 1,
      };
      setProjects((prev) => [next, ...prev]);
      setPage(1);
      setEditorOpen(false);
      showToast('Projet créé avec succès.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleteTarget(null);
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
    showToast('Projet supprimé avec succès.');
  };

  function renderModalsAndToast() {
    return (
      <>
        {/* Create / Edit Project Modal */}
        {editorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">
                    {editingProject ? 'Modifier le projet' : 'Créer un projet'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <p className="text-xs font-medium text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelCls}>Nom du projet</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ex. Rivera Editorial"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Client</label>
                  <input
                    type="text"
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    placeholder="ex. Amelia Rivera"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Type de projet</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ProjectType)}
                    className={inputCls}
                  >
                    <option value="Mariage">Mariage</option>
                    <option value="Portrait">Portrait</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Événement">Événement</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Statut du projet</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                    className={inputCls}
                  >
                    <option value="planning">Planification</option>
                    <option value="in_progress">En cours</option>
                    <option value="editing">Retouche</option>
                    <option value="review">Révision</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Date du projet</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Heure</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Lieu du projet</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Notes (Optionnel)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notes sur la séance..."
                  className="w-full p-3 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setEditorOpen(false)} className="btn-outline text-sm">
                  Annuler
                </button>
                <button type="button" onClick={handleSaveProject} className="btn-primary text-sm">
                  {editingProject ? 'Enregistrer les modifications' : 'Créer le projet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">Supprimer le projet ?</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 py-1">
                <div className="w-11 h-11 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <p className="text-sm text-soft leading-relaxed">
                  Vous êtes sur le point de supprimer{' '}
                  <span className="font-semibold text-heading">{deleteTarget.name}</span>. Cela supprime uniquement la fiche du projet et ne supprime pas automatiquement les galeries, clients ou factures associés.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="btn-outline text-sm">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="btn-danger"
                >
                  Supprimer le projet
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
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </>
    );
  }

  // DETAIL VIEW
  if (selectedProject) {
    return (
      <div className="space-y-6 pb-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <button
            type="button"
            onClick={() => setSelectedProjectId(null)}
            className="text-accent hover:underline"
          >
            Projets
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-heading">{selectedProject.name}</span>
        </div>

        {/* Header Card */}
        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-subtle border border-line flex items-center justify-center text-soft shrink-0">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Projet {selectedProject.type}
                </p>
                <h1 className="text-2xl font-bold text-heading">{selectedProject.name}</h1>
                <p className="text-xs font-medium text-blue-600">{selectedProject.client}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedProject.status}
                onChange={(e) => {
                  const nextStatus = e.target.value as ProjectStatus;
                  setProjects((prev) =>
                    prev.map((p) => (p.id === selectedProject.id ? { ...p, status: nextStatus } : p))
                  );
                  showToast('Statut du projet mis à jour.');
                }}
                className="h-9 px-3 text-xs font-medium bg-panel border border-line rounded-xl text-heading"
              >
                <option value="planning">Planification</option>
                <option value="in_progress">En cours</option>
                <option value="editing">Retouche</option>
                <option value="review">Révision</option>
              </select>

              <button
                type="button"
                onClick={() => openEditModal(selectedProject)}
                className="btn-outline text-xs sm:text-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Modifier le projet
              </button>

              <button
                type="button"
                onClick={() => setDeleteTarget(selectedProject)}
                className="px-3.5 py-2 rounded-xl border border-red-500/30 text-red-600 hover:bg-red-500/10 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-line text-xs">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-muted shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted">Date & Heure</p>
                <p className="text-sm font-semibold text-heading">
                  {formatDateFr(selectedProject.date)} · {selectedProject.time}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-muted shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted">Lieu</p>
                <p className="text-sm font-semibold text-heading">{selectedProject.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <FolderKanban className="w-4 h-4 text-muted shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted">Client</p>
                <p className="text-sm font-semibold text-heading">{selectedProject.client}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-5">
            {/* Project Overview */}
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h2 className="text-base font-semibold text-heading">Aperçu du projet</h2>
                <p className="text-xs text-muted mt-0.5">Informations et notes du projet</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="border-b border-line/60 pb-3">
                  <p className="text-muted">Type de projet</p>
                  <p className="text-sm font-semibold text-heading mt-0.5">{selectedProject.type}</p>
                </div>
                <div className="border-b border-line/60 pb-3">
                  <p className="text-muted mb-1">Statut actuel</p>
                  <StatusPill status={selectedProject.status} />
                </div>
                <div className="border-b border-line/60 pb-3">
                  <p className="text-muted">Date du projet</p>
                  <p className="text-sm font-semibold text-heading mt-0.5">
                    {formatDateFr(selectedProject.date)}
                  </p>
                </div>
                <div className="border-b border-line/60 pb-3">
                  <p className="text-muted">Heure de début</p>
                  <p className="text-sm font-semibold text-heading mt-0.5">{selectedProject.time}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-muted">Notes du projet</p>
                  <p className="text-sm text-heading mt-1">{selectedProject.notes || 'Aucune note.'}</p>
                </div>
              </div>
            </div>

            {/* Photo Galleries */}
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-heading">Galeries photo</h2>
                  <p className="text-xs text-muted mt-0.5">Galeries photo liées à ce projet</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/events')}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/15"
                >
                  + Créer une galerie
                </button>
              </div>
              {selectedProject.photoGalleries.length === 0 ? (
                <p className="text-xs text-muted py-2">Aucune galerie photo associée.</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedProject.photoGalleries.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-wrap items-center justify-between gap-3 bg-subtle/60 border border-line rounded-xl p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-panel border border-line flex items-center justify-center text-soft">
                          <Images className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-heading">{g.title}</p>
                          <p className="text-xs text-muted">{g.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                          • {g.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate('/admin/events')}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/15"
                        >
                          Ouvrir la galerie
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Galleries */}
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-heading">Galeries vidéo</h2>
                  <p className="text-xs text-muted mt-0.5">Films liés à ce projet</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/video-galleries')}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/15"
                >
                  + Créer une galerie
                </button>
              </div>
              {selectedProject.videoGalleries.length === 0 ? (
                <p className="text-xs text-muted py-2">Aucune galerie vidéo associée.</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedProject.videoGalleries.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-wrap items-center justify-between gap-3 bg-subtle/60 border border-line rounded-xl p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center">
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-heading">{g.title}</p>
                          <p className="text-xs text-muted">{g.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-medium text-soft bg-panel border border-line px-2.5 py-0.5 rounded-full">
                          • {g.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate('/admin/video-galleries')}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/15"
                        >
                          Ouvrir la galerie
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Related Client */}
            <div className="bg-panel border border-line rounded-2xl p-5 space-y-4 shadow-xs">
              <div>
                <h2 className="text-base font-semibold text-heading">Client associé</h2>
                <p className="text-xs text-muted mt-0.5">Contact principal du projet</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-subtle border border-line flex items-center justify-center text-xs font-bold text-heading shrink-0">
                    {getInitials(selectedProject.client)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-heading truncate">
                      {selectedProject.client}
                    </p>
                    <p className="text-xs text-muted truncate">{selectedProject.clientEmail}</p>
                    <p className="text-xs text-muted">{selectedProject.clientPhone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/clients/accounts')}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/15 shrink-0"
                >
                  Voir le client
                </button>
              </div>
            </div>

            {/* Related Invoice */}
            <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
              <div>
                <h2 className="text-base font-semibold text-heading">Facturation associée</h2>
                <p className="text-xs text-muted mt-0.5">Facture liée à ce projet</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/factures')}
                className="w-full flex items-center justify-between gap-3 bg-subtle/60 hover:bg-subtle border border-line rounded-xl p-3 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-soft" />
                  <div>
                    <p className="text-[11px] text-muted">Facture</p>
                    <p className="text-sm font-semibold text-heading">
                      {selectedProject.invoiceRef.number}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-soft bg-panel border border-line px-2.5 py-0.5 rounded-full">
                  • {selectedProject.invoiceRef.status}
                </span>
              </button>
            </div>
          </div>
        </div>

        {renderModalsAndToast()}
      </div>
    );
  }

  // MAIN LIST / GRID VIEW
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted mb-1">
            Espace de travail <span className="mx-1">/</span> Projets
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">Projets</h1>
          <p className="text-sm text-muted mt-1">
            Gérez vos projets photographiques et suivez leur avancement.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Créer un projet
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Planification</p>
            <p className="text-2xl font-bold text-heading">
              {kpis.planning}{' '}
              <span className="text-xs font-normal text-muted">
                projet{kpis.planning > 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">En cours</p>
            <p className="text-2xl font-bold text-heading">
              {kpis.inProgress}{' '}
              <span className="text-xs font-normal text-muted">
                projet{kpis.inProgress > 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Retouche</p>
            <p className="text-2xl font-bold text-heading">
              {kpis.editing}{' '}
              <span className="text-xs font-normal text-muted">
                projet{kpis.editing > 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Révision</p>
            <p className="text-2xl font-bold text-heading">
              {kpis.review}{' '}
              <span className="text-xs font-normal text-muted">
                projet{kpis.review > 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* All Projects Card */}
      <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-visible">
        <div className="p-5 sm:p-6 space-y-4 border-b border-line">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-heading">Tous les projets</h2>
              <p className="text-xs text-muted mt-0.5">
                {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="inline-flex border border-line rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-accent/15 text-accent' : 'text-soft hover:bg-subtle'}`}
                aria-label="Vue liste"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-accent/15 text-accent' : 'text-soft hover:bg-subtle'}`}
                aria-label="Vue grille"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
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
                placeholder="Rechercher des projets..."
                className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | ProjectStatus);
                  setPage(1);
                }}
                className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Tous les statuts</option>
                <option value="planning">Planification</option>
                <option value="in_progress">En cours</option>
                <option value="editing">Retouche</option>
                <option value="review">Révision</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as 'all' | ProjectType);
                  setPage(1);
                }}
                className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading"
              >
                <option value="all">Tous les types</option>
                <option value="Mariage">Mariage</option>
                <option value="Portrait">Portrait</option>
                <option value="Commercial">Commercial</option>
                <option value="Événement">Événement</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading"
              >
                <option value="date">Date du projet</option>
                <option value="name">Nom (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="py-3 px-5">Nom du projet</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Lieu</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-sm">
                {paginatedProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-heading whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedProjectId(p.id)}
                        className="inline-flex items-center gap-2.5 hover:underline text-left"
                      >
                        <FolderKanban className="w-4 h-4 text-muted shrink-0" />
                        <span>{p.name}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-blue-600 font-medium whitespace-nowrap">
                      {p.client}
                    </td>
                    <td className="py-3.5 px-4 text-soft whitespace-nowrap">{p.type}</td>
                    <td className="py-3.5 px-4 text-soft whitespace-nowrap">
                      {formatDateFr(p.date)}
                    </td>
                    <td className="py-3.5 px-4 text-soft whitespace-nowrap">{p.location}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right relative whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                        className="w-8 h-8 rounded-lg hover:bg-subtle inline-flex items-center justify-center text-soft"
                        aria-label="Actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {openMenuId === p.id && (
                        <div className="absolute right-5 mt-1 w-44 bg-panel border border-line rounded-xl shadow-lg py-1.5 z-30 text-left text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setSelectedProjectId(p.id);
                            }}
                            className="w-full px-3.5 py-2 hover:bg-subtle text-heading"
                          >
                            Voir les détails
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="w-full px-3.5 py-2 hover:bg-subtle text-heading"
                          >
                            Modifier le projet
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setDeleteTarget(p);
                            }}
                            className="w-full px-3.5 py-2 hover:bg-red-500/10 text-red-600"
                          >
                            Supprimer le projet
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className="bg-panel border border-line rounded-2xl p-4 space-y-3 hover:border-accent/40 hover:shadow-sm transition-all cursor-pointer relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-subtle border border-line flex items-center justify-center text-soft">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-heading">{p.name}</h3>
                  <p className="text-xs font-medium text-blue-600 mt-0.5">{p.client}</p>
                </div>
                <div className="space-y-1 text-xs text-muted pt-1 border-t border-line/60">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateFr(p.date)} · {p.time}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {p.location}
                  </p>
                  <p className="text-soft font-medium pt-0.5">{p.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-line flex items-center justify-between text-xs text-muted">
          <span>
            Affichage {filteredProjects.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredProjects.length)} sur {filteredProjects.length}{' '}
            projets
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
                className={`w-8 h-8 rounded-lg text-xs font-semibold ${
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

      {renderModalsAndToast()}
    </div>
  );
};
