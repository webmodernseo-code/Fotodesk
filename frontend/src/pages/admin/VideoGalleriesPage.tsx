import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit3,
  Film,
  Grid,
  List,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  Share2,
  Trash2,
  Upload,
  Video,
  Volume2,
  X,
} from 'lucide-react';

type GalleryStatus = 'draft' | 'active' | 'shared' | 'expired';

interface VideoComment {
  id: string;
  author: string;
  timestampSec: number;
  timestampLabel: string;
  text: string;
  createdAt: string;
}

interface VideoItem {
  id: string;
  title: string;
  durationMin: number;
  durationLabel: string;
  date: string;
  thumbnail: string;
  status: 'ready';
  comments: VideoComment[];
}

interface VideoGallery {
  id: string;
  name: string;
  client: string;
  clientEmail: string;
  project: string;
  description: string;
  coverImage: string;
  status: GalleryStatus;
  createdAt: string;
  sortOrder: number;
  allowDownloads: boolean;
  downloadValidityDays: 7 | 14 | 30;
  requireAccessCode: boolean;
  accessCode: string;
  videos: VideoItem[];
}

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
];

const INITIAL_GALLERIES: VideoGallery[] = [
  {
    id: 'vg-1',
    name: 'Event Highlights',
    client: 'Daniel Smith',
    clientEmail: 'daniel.smith@example.com',
    project: 'Corporate Event',
    description: 'Temps forts filmés lors de la conférence annuelle et du cocktail.',
    coverImage: COVER_IMAGES[2],
    status: 'shared',
    createdAt: '2 juin 2025',
    sortOrder: 3,
    allowDownloads: true,
    downloadValidityDays: 14,
    requireAccessCode: true,
    accessCode: 'DANIEL25',
    videos: [
      {
        id: 'v-101',
        title: 'Keynote Highlights',
        durationMin: 18,
        durationLabel: '18:00',
        date: '2 juin 2025',
        thumbnail: COVER_IMAGES[2],
        status: 'ready',
        comments: [],
      },
      {
        id: 'v-102',
        title: 'Networking & Interviews',
        durationMin: 22,
        durationLabel: '22:00',
        date: '2 juin 2025',
        thumbnail: COVER_IMAGES[3],
        status: 'ready',
        comments: [],
      },
      {
        id: 'v-103',
        title: 'Aftermovie Teaser',
        durationMin: 15,
        durationLabel: '15:00',
        date: '3 juin 2025',
        thumbnail: COVER_IMAGES[2],
        status: 'ready',
        comments: [],
      },
    ],
  },
  {
    id: 'vg-2',
    name: 'Brand Film Collection',
    client: 'Emily Carter',
    clientEmail: 'emily.carter@example.com',
    project: 'Brand Photography',
    description: 'Films de marque et portraits vidéo en studio.',
    coverImage: COVER_IMAGES[3],
    status: 'active',
    createdAt: '28 mai 2025',
    sortOrder: 2,
    allowDownloads: true,
    downloadValidityDays: 30,
    requireAccessCode: false,
    accessCode: 'EMILY25',
    videos: [
      {
        id: 'v-201',
        title: 'Studio Manifesto',
        durationMin: 35,
        durationLabel: '35:00',
        date: '28 mai 2025',
        thumbnail: COVER_IMAGES[3],
        status: 'ready',
        comments: [],
      },
      {
        id: 'v-202',
        title: 'Behind the Scenes',
        durationMin: 30,
        durationLabel: '30:00',
        date: '29 mai 2025',
        thumbnail: COVER_IMAGES[2],
        status: 'ready',
        comments: [],
      },
    ],
  },
  {
    id: 'vg-3',
    name: 'Wedding Film Collection',
    client: 'Sarah Johnson',
    clientEmail: 'sarah.johnson@example.com',
    project: 'Sarah & Michael Wedding',
    description: 'La collection complète du film de mariage, de la cérémonie à la soirée.',
    coverImage: COVER_IMAGES[0],
    status: 'shared',
    createdAt: '18 mai 2025',
    sortOrder: 1,
    allowDownloads: true,
    downloadValidityDays: 14,
    requireAccessCode: true,
    accessCode: 'SARAH25',
    videos: [
      {
        id: 'v-301',
        title: 'Ceremony Film',
        durationMin: 28,
        durationLabel: '28:00',
        date: '20 mai 2025',
        thumbnail: COVER_IMAGES[1],
        status: 'ready',
        comments: [
          {
            id: 'c-1',
            author: 'Michael Reed',
            timestampSec: 158,
            timestampLabel: '02:38',
            text: 'Pourrait-on raccourcir légèrement cette séquence ?',
            createdAt: '8 juin 2025 · 15:20',
          },
        ],
      },
      {
        id: 'v-302',
        title: 'Reception Highlights',
        durationMin: 30,
        durationLabel: '30:00',
        date: '21 mai 2025',
        thumbnail: COVER_IMAGES[0],
        status: 'ready',
        comments: [],
      },
      {
        id: 'v-303',
        title: 'Wedding Feature Film',
        durationMin: 62,
        durationLabel: '62:00',
        date: '20 mai 2025',
        thumbnail: COVER_IMAGES[0],
        status: 'ready',
        comments: [
          {
            id: 'c-2',
            author: 'Sarah Johnson',
            timestampSec: 222,
            timestampLabel: '03:42',
            text: 'Pouvez-vous revoir cette transition ?',
            createdAt: '8 juin 2025 · 15:20',
          },
          {
            id: 'c-3',
            author: 'Sarah Johnson',
            timestampSec: 438,
            timestampLabel: '07:18',
            text: "J'adore ce moment, gardons-le tel quel !",
            createdAt: '8 juin 2025 · 15:25',
          },
        ],
      },
    ],
  },
];

const MOCK_UPLOAD_PRESETS = [
  { name: 'cinematic-trailer.mp4', durationMin: 24, thumbnail: COVER_IMAGES[1] },
  { name: 'client-interview.mp4', durationMin: 18, thumbnail: COVER_IMAGES[2] },
  { name: 'extended-archive-film.mp4', durationMin: 280, thumbnail: COVER_IMAGES[3] },
];

const formatSecToMMSS = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const StatusPill: React.FC<{ status: GalleryStatus }> = ({ status }) => {
  const map: Record<GalleryStatus, { cls: string; dot: string; label: string }> = {
    shared: {
      cls: 'bg-emerald-500/90 text-white',
      dot: 'bg-white',
      label: 'Partagée',
    },
    active: {
      cls: 'bg-blue-600/90 text-white',
      dot: 'bg-white',
      label: 'Active',
    },
    draft: {
      cls: 'bg-neutral-800/80 text-white',
      dot: 'bg-white',
      label: 'Brouillon',
    },
    expired: {
      cls: 'bg-red-600/90 text-white',
      dot: 'bg-white',
      label: 'Expirée',
    },
  };
  const cfg = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full backdrop-blur-xs ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const inputCls =
  'w-full h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors';

const labelCls = 'block text-xs font-medium text-heading mb-1.5';

export const VideoGalleriesPage: React.FC = () => {
  const [galleries, setGalleries] = useState<VideoGallery[]>(INITIAL_GALLERIES);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [starterPreview, setStarterPreview] = useState(false);

  // List filters
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | GalleryStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [cardMenuId, setCardMenuId] = useState<string | null>(null);

  // Detail filters
  const [videoSearch, setVideoSearch] = useState('');
  const [videoSort, setVideoSort] = useState<'title' | 'duration'>('title');
  const [videoViewMode, setVideoViewMode] = useState<'grid' | 'list'>('grid');

  // Create / Edit modal
  const [createOpen, setCreateOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<VideoGallery | null>(null);
  const [formName, setFormName] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formProject, setFormProject] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCover, setFormCover] = useState(COVER_IMAGES[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Upload Videos modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [queuedUploads, setQueuedUploads] = useState<
    Array<{ id: string; name: string; durationMin: number; thumbnail: string; uploaded?: boolean }>
  >([]);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Share modal
  const [shareOpen, setShareOpen] = useState(false);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAllowDownloads, setSettingsAllowDownloads] = useState(true);
  const [settingsValidity, setSettingsValidity] = useState<7 | 14 | 30>(14);
  const [settingsRequireCode, setSettingsRequireCode] = useState(true);
  const [settingsAccessCode, setSettingsAccessCode] = useState('SARAH25');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<VideoGallery | null>(null);

  // Video Player & Timestamp Comments modal
  const [playerVideoId, setPlayerVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(180);
  const [commentInput, setCommentInput] = useState('');

  // Client Preview
  const [clientPreviewOpen, setClientPreviewOpen] = useState(false);
  const [clientUnlocked, setClientUnlocked] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const showToast = (message: string, title = 'Succès') => {
    setToast({ title, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const selectedGallery = useMemo(
    () => galleries.find((g) => g.id === selectedGalleryId) ?? null,
    [galleries, selectedGalleryId]
  );

  const storageLimitMin = starterPreview ? 60 : 500;
  const totalStorageUsedMin = useMemo(
    () =>
      galleries.reduce(
        (acc, g) => acc + g.videos.reduce((s, v) => s + v.durationMin, 0),
        0
      ),
    [galleries]
  );
  const playbackLimitMin = starterPreview ? 120 : 1000;
  const playbackUsedMin = starterPreview ? 45 : 420;

  const filteredGalleries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return galleries
      .filter((g) => {
        if (clientFilter !== 'all' && g.client !== clientFilter) return false;
        if (projectFilter !== 'all' && g.project !== projectFilter) return false;
        if (statusFilter !== 'all' && g.status !== statusFilter) return false;
        if (
          q &&
          !g.name.toLowerCase().includes(q) &&
          !g.client.toLowerCase().includes(q) &&
          !g.project.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.sortOrder - a.sortOrder;
        if (sortBy === 'oldest') return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name);
      });
  }, [galleries, search, clientFilter, projectFilter, statusFilter, sortBy]);

  const openCreateModal = () => {
    setEditingGallery(null);
    setFormName('');
    setFormClient('');
    setFormProject('');
    setFormDesc('');
    setFormCover(COVER_IMAGES[0]);
    setFormError(null);
    setCreateOpen(true);
  };

  const openEditModal = (g: VideoGallery) => {
    setEditingGallery(g);
    setFormName(g.name);
    setFormClient(g.client);
    setFormProject(g.project);
    setFormDesc(g.description);
    setFormCover(g.coverImage);
    setFormError(null);
    setCardMenuId(null);
    setCreateOpen(true);
  };

  const handleSaveGallery = () => {
    setFormError(null);
    if (!formName.trim()) {
      setFormError('Le nom de la galerie est requis.');
      return;
    }
    if (editingGallery) {
      setGalleries((prev) =>
        prev.map((g) =>
          g.id === editingGallery.id
            ? {
                ...g,
                name: formName.trim(),
                client: formClient.trim() || g.client,
                project: formProject.trim(),
                description: formDesc.trim(),
                coverImage: formCover,
              }
            : g
        )
      );
      setCreateOpen(false);
      showToast('Galerie vidéo mise à jour.');
    } else {
      const next: VideoGallery = {
        id: `vg-${Date.now()}`,
        name: formName.trim(),
        client: formClient.trim() || 'Jordan Harper',
        clientEmail: 'client@example.com',
        project: formProject.trim() || 'Anderson Wedding',
        description: formDesc.trim(),
        coverImage: formCover,
        status: 'draft',
        createdAt: "Aujourd'hui",
        sortOrder: Math.max(0, ...galleries.map((g) => g.sortOrder)) + 1,
        allowDownloads: true,
        downloadValidityDays: 14,
        requireAccessCode: true,
        accessCode: 'STUDIO25',
        videos: [],
      };
      setGalleries((prev) => [next, ...prev]);
      setCreateOpen(false);
      showToast('Galerie vidéo créée.');
    }
  };

  const openSettingsModal = (g: VideoGallery) => {
    setSettingsAllowDownloads(g.allowDownloads);
    setSettingsValidity(g.downloadValidityDays);
    setSettingsRequireCode(g.requireAccessCode);
    setSettingsAccessCode(g.accessCode);
    setCardMenuId(null);
    setSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    if (!selectedGallery) return;
    setGalleries((prev) =>
      prev.map((g) =>
        g.id === selectedGallery.id
          ? {
              ...g,
              allowDownloads: settingsAllowDownloads,
              downloadValidityDays: settingsValidity,
              requireAccessCode: settingsRequireCode,
              accessCode: settingsAccessCode.trim() || 'SARAH25',
            }
          : g
      )
    );
    setSettingsOpen(false);
    showToast('Paramètres de la galerie vidéo enregistrés.');
  };

  const handleAddQueuedPreset = (preset: (typeof MOCK_UPLOAD_PRESETS)[number]) => {
    setQueuedUploads((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${Math.random()}`,
        name: preset.name,
        durationMin: preset.durationMin,
        thumbnail: preset.thumbnail,
      },
    ]);
  };

  const queuedTotalMin = queuedUploads.reduce((s, q) => s + q.durationMin, 0);
  const projectedStorageMin = totalStorageUsedMin + queuedTotalMin;
  const exceedsStorage = projectedStorageMin > storageLimitMin;

  const handleConfirmUpload = () => {
    if (!selectedGallery || queuedUploads.length === 0 || exceedsStorage) return;
    const newVideos: VideoItem[] = queuedUploads.map((q) => ({
      id: `v-${Date.now()}-${Math.random()}`,
      title: q.name.replace(/\.[^/.]+$/, '').replace(/-/g, ' '),
      durationMin: q.durationMin,
      durationLabel: `${q.durationMin}:00`,
      date: "Aujourd'hui",
      thumbnail: q.thumbnail,
      status: 'ready',
      comments: [],
    }));
    setGalleries((prev) =>
      prev.map((g) =>
        g.id === selectedGallery.id ? { ...g, videos: [...g.videos, ...newVideos] } : g
      )
    );
    setQueuedUploads([]);
    setUploadOpen(false);
    showToast('Vidéos téléversées avec succès.');
  };

  const handleConfirmDeleteGallery = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setGalleries((prev) => prev.filter((g) => g.id !== id));
    setDeleteTarget(null);
    if (selectedGalleryId === id) {
      setSelectedGalleryId(null);
    }
    showToast('Galerie vidéo supprimée.');
  };

  const activePlayerVideo = useMemo(() => {
    if (!selectedGallery || !playerVideoId) return null;
    return selectedGallery.videos.find((v) => v.id === playerVideoId) ?? null;
  }, [selectedGallery, playerVideoId]);

  const handleAddComment = () => {
    if (!selectedGallery || !activePlayerVideo || !commentInput.trim()) return;
    const newComment: VideoComment = {
      id: `c-${Date.now()}`,
      author: selectedGallery.client,
      timestampSec: currentTimeSec,
      timestampLabel: formatSecToMMSS(currentTimeSec),
      text: commentInput.trim(),
      createdAt: "À l'instant",
    };
    setGalleries((prev) =>
      prev.map((g) =>
        g.id === selectedGallery.id
          ? {
              ...g,
              videos: g.videos.map((v) =>
                v.id === activePlayerVideo.id
                  ? { ...v, comments: [...v.comments, newComment] }
                  : v
              ),
            }
          : g
      )
    );
    setCommentInput('');
    showToast('Commentaire horodaté ajouté.');
  };

  // CLIENT PREVIEW OVERLAY
  if (clientPreviewOpen && selectedGallery) {
    const needsCode = selectedGallery.requireAccessCode && !clientUnlocked;
    const totalDuration = selectedGallery.videos.reduce((s, v) => s + v.durationMin, 0);

    return (
      <div className="space-y-6 pb-12">
        {needsCode ? (
          <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 text-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-lg bg-accent text-white font-bold text-sm flex items-center justify-center">
                    F
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-heading">Northlight Studio</p>
                    <p className="text-[11px] text-muted">Galerie vidéo privée</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setClientPreviewOpen(false)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="w-11 h-11 rounded-xl bg-subtle border border-line mx-auto flex items-center justify-center text-soft">
                <Video className="w-5 h-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-heading">{selectedGallery.name}</h2>
                <p className="text-xs text-muted mt-1">
                  Saisissez le code d&apos;accès fourni par Northlight Studio pour ouvrir cette galerie privée.
                </p>
              </div>

              <div className="text-left space-y-1.5">
                <label className={labelCls}>Code d&apos;accès</label>
                <input
                  type="text"
                  value={accessCodeInput}
                  onChange={(e) => {
                    setAccessCodeInput(e.target.value);
                    setAccessCodeError(null);
                  }}
                  placeholder={`Saisir le code (ex. ${selectedGallery.accessCode})`}
                  className={inputCls}
                />
                {accessCodeError && (
                  <p className="text-xs font-medium text-red-600">{accessCodeError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    accessCodeInput.trim().toUpperCase() ===
                    selectedGallery.accessCode.trim().toUpperCase()
                  ) {
                    setClientUnlocked(true);
                  } else {
                    setAccessCodeError("Le code d'accès saisi est incorrect.");
                  }
                }}
                className="btn-primary w-full justify-center text-sm"
              >
                Continuer
              </button>

              <button
                type="button"
                onClick={() => setClientPreviewOpen(false)}
                className="text-xs font-medium text-muted hover:text-heading"
              >
                Fermer l&apos;aperçu
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-panel border border-line rounded-2xl px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent text-white font-bold text-sm flex items-center justify-center">
                  F
                </div>
                <div>
                  <p className="text-sm font-semibold text-heading">Northlight Studio</p>
                  <p className="text-xs text-muted">Galerie vidéo privée</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setClientPreviewOpen(false);
                  setClientUnlocked(false);
                  setAccessCodeInput('');
                }}
                className="btn-outline text-xs"
              >
                Fermer l&apos;aperçu
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72 border border-line">
              <img
                src={selectedGallery.coverImage}
                alt={selectedGallery.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-6 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80">
                  Northlight Studio
                </p>
                <h1 className="text-2xl sm:text-4xl font-bold mt-1">{selectedGallery.name}</h1>
                <p className="text-xs sm:text-sm opacity-90 mt-2 max-w-xl">
                  {selectedGallery.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-muted">Vidéos</p>
                  <p className="text-lg font-bold text-heading">{selectedGallery.videos.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Durée totale</p>
                  <p className="text-lg font-bold text-heading">{totalDuration} min</p>
                </div>
              </div>
              {selectedGallery.allowDownloads && (
                <p className="text-xs text-muted">
                  Téléchargements disponibles pendant {selectedGallery.downloadValidityDays} jours
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {selectedGallery.videos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-panel border border-line rounded-2xl overflow-hidden shadow-xs flex flex-col"
                >
                  <div
                    onClick={() => {
                      setPlayerVideoId(vid.id);
                      setCurrentTimeSec(120);
                      setIsPlaying(false);
                    }}
                    className="relative h-44 bg-black cursor-pointer group"
                  >
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-black/60 border border-white/50 text-white flex items-center justify-center">
                        <Play className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2.5 right-2.5 text-[11px] font-semibold bg-black/75 text-white px-2 py-0.5 rounded-md">
                      {vid.durationLabel}
                    </span>
                  </div>
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-heading">{vid.title}</h3>
                      <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {vid.comments.length} commentaire{vid.comments.length > 1 ? 's' : ''} horodaté{vid.comments.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    {selectedGallery.allowDownloads && (
                      <button
                        type="button"
                        onClick={() => showToast(`Téléchargement de « ${vid.title} » préparé.`)}
                        className="w-full py-2 px-3 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/15 flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Télécharger la vidéo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {renderPlayerAndModals()}
      </div>
    );
  }

  function renderPlayerAndModals() {
    return (
      <>
        {/* Dark Video Player Modal with Timestamp Comments */}
        {activePlayerVideo && selectedGallery && (
          <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col">
            {/* Top Bar */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">{activePlayerVideo.title}</h2>
                <p className="text-xs text-neutral-400">
                  {selectedGallery.name} · {selectedGallery.client}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => showToast(`Téléchargement de « ${activePlayerVideo.title} » prêt.`)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerVideoId(null)}
                  className="w-8 h-8 rounded-lg bg-white text-red-600 flex items-center justify-center hover:bg-neutral-200"
                  aria-label="Fermer le lecteur"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body: Video + Timestamp Comments Sidebar */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Video Area */}
              <div className="flex-1 flex flex-col justify-between bg-black p-4 sm:p-6">
                <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-neutral-900">
                  <img
                    src={activePlayerVideo.thumbnail}
                    alt={activePlayerVideo.title}
                    className="max-h-full max-w-full object-contain opacity-90"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="absolute w-16 h-16 rounded-full bg-black/60 border border-white/60 flex items-center justify-center hover:scale-105 transition-transform"
                    aria-label={isPlaying ? 'Pause' : 'Lecture'}
                  >
                    {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                  </button>
                </div>

                {/* Scrubber */}
                <div className="mt-4 bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="text-white hover:text-accent"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="text-xs text-neutral-300 tabular-nums">
                      {formatSecToMMSS(currentTimeSec)}
                    </span>
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="range"
                        min={0}
                        max={activePlayerVideo.durationMin * 60}
                        value={currentTimeSec}
                        onChange={(e) => setCurrentTimeSec(Number(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                    </div>
                    <span className="text-xs text-neutral-400 tabular-nums">
                      {activePlayerVideo.durationLabel}
                    </span>
                    <Volume2 className="w-4 h-4 text-neutral-400" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>
                      {selectedGallery.videos.findIndex((v) => v.id === activePlayerVideo.id) + 1} sur{' '}
                      {selectedGallery.videos.length}
                    </span>
                    <span>
                      {activePlayerVideo.durationMin} minutes · {activePlayerVideo.comments.length}{' '}
                      commentaire{activePlayerVideo.comments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Timestamp Comments */}
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 bg-neutral-900 p-4 flex flex-col justify-between gap-4">
                <div className="space-y-3 overflow-y-auto flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Commentaires horodatés</h3>
                    <span className="text-xs text-neutral-400">
                      {activePlayerVideo.comments.length}
                    </span>
                  </div>

                  {activePlayerVideo.comments.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-6 text-center">
                      Aucun commentaire horodaté pour le moment.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activePlayerVideo.comments.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCurrentTimeSec(c.timestampSec)}
                          className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 space-y-1 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">{c.author}</span>
                            <span className="text-blue-400 font-semibold">{c.timestampLabel}</span>
                          </div>
                          <p className="text-xs text-neutral-200">{c.text}</p>
                          <p className="text-[10px] text-neutral-400">{c.createdAt}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-3 space-y-2.5">
                  <p className="text-xs text-neutral-300">
                    Commenter à <span className="font-semibold text-white">{formatSecToMMSS(currentTimeSec)}</span>
                  </p>
                  <textarea
                    rows={2}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Ajouter un retour à ce moment précis..."
                    className="w-full p-2.5 text-xs bg-neutral-800 border border-white/10 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    className="w-full py-2 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold transition-colors"
                  >
                    Ajouter un commentaire
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Gallery Modal */}
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">
                    {editingGallery ? 'Modifier la galerie vidéo' : 'Créer une nouvelle galerie vidéo'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelCls}>Nom de la galerie</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="ex. Wedding Film Collection"
                    className={`${inputCls} ${formError ? 'border-red-500' : ''}`}
                  />
                  {formError && <p className="text-xs text-red-600 mt-1">{formError}</p>}
                </div>
                <div>
                  <label className={labelCls}>Client</label>
                  <input
                    type="text"
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    placeholder="Rechercher un client..."
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Projet associé (Optionnel)</label>
                <input
                  type="text"
                  value={formProject}
                  onChange={(e) => setFormProject(e.target.value)}
                  placeholder="Rechercher un projet..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Description de la galerie (Optionnel)</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Description courte..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Image de couverture (Optionnel)</label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') setFormCover(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="border border-dashed border-line rounded-xl overflow-hidden cursor-pointer hover:border-accent/60 transition-colors"
                >
                  {editingGallery ? (
                    <img src={formCover} alt="Couverture" className="w-full h-28 object-cover" />
                  ) : (
                    <div className="py-6 text-center space-y-1.5 bg-subtle/50">
                      <Upload className="w-5 h-5 text-blue-600 mx-auto" />
                      <p className="text-xs font-semibold text-heading">
                        Sélectionner une image de couverture
                      </p>
                      <p className="text-[11px] text-muted">Cliquez pour choisir une image</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="btn-outline text-sm">
                  Annuler
                </button>
                <button type="button" onClick={handleSaveGallery} className="btn-primary text-sm">
                  {editingGallery ? 'Enregistrer les modifications' : 'Créer la galerie'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Videos Modal */}
        {uploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">Téléverser des vidéos</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-subtle border border-line/70 rounded-xl p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-bold text-heading">
                    {totalStorageUsedMin} / {storageLimitMin}{' '}
                    <span className="text-xs font-normal text-muted">minutes</span>
                  </p>
                  <p className="text-[11px] text-muted">Stockage vidéo du compte Pro</p>
                </div>
                <div className="h-2 bg-line rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (totalStorageUsedMin / storageLimitMin) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted">
                  {Math.max(0, storageLimitMin - totalStorageUsedMin)} minutes restantes
                </p>
              </div>

              <div className="border border-dashed border-line rounded-xl p-5 text-center space-y-2.5 bg-subtle/40">
                <Upload className="w-5 h-5 text-blue-600 mx-auto" />
                <p className="text-xs font-semibold text-heading">
                  Glissez-déposez des vidéos ici ou sélectionnez des fichiers
                </p>
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setQueuedUploads((prev) => [
                      ...prev,
                      ...files.map((f) => ({
                        id: `f-${Date.now()}-${f.name}`,
                        name: f.name,
                        durationMin: 15,
                        thumbnail: COVER_IMAGES[0],
                      })),
                    ]);
                  }}
                />
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="btn-outline text-xs py-1.5 px-3"
                  >
                    Parcourir les fichiers
                  </button>
                  {MOCK_UPLOAD_PRESETS.slice(0, 2).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleAddQueuedPreset(p)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-panel border border-line hover:bg-subtle text-soft"
                    >
                      + {p.name} ({p.durationMin} min)
                    </button>
                  ))}
                </div>
              </div>

              {queuedUploads.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {queuedUploads.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 bg-subtle/60 border border-line rounded-xl p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.thumbnail}
                          alt={item.name}
                          className="w-10 h-8 rounded-md object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-heading truncate">{item.name}</p>
                          <p className="text-muted">Prêt · {item.durationMin} minutes</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setQueuedUploads((prev) => prev.filter((x) => x.id !== item.id))
                        }
                        className="text-muted hover:text-red-500 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {queuedUploads.length > 0 && (
                <div
                  className={
                    exceedsStorage ? 'banner-danger flex-col items-stretch' : 'banner-info flex-col items-stretch'
                  }
                >
                  <div className="flex justify-between font-semibold">
                    <span>Stockage projeté après téléversement</span>
                    <span>
                      {projectedStorageMin} / {storageLimitMin} minutes
                    </span>
                  </div>
                  <p className="mt-0.5">
                    {exceedsStorage
                      ? `Les vidéos sélectionnées dépassent la limite de ${storageLimitMin} minutes.`
                      : `${storageLimitMin - projectedStorageMin} minutes resteront disponibles après téléversement.`}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setUploadOpen(false)} className="btn-outline text-sm">
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={queuedUploads.length === 0 || exceedsStorage}
                  onClick={handleConfirmUpload}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Téléverser les vidéos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Gallery Modal */}
        {shareOpen && selectedGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">Partager la galerie vidéo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 bg-subtle border border-line rounded-xl p-3">
                <img
                  src={selectedGallery.coverImage}
                  alt={selectedGallery.name}
                  className="w-11 h-11 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-heading truncate">{selectedGallery.name}</p>
                  <p className="text-xs text-muted">
                    {selectedGallery.client} · {selectedGallery.clientEmail}
                  </p>
                </div>
              </div>

              <div>
                <label className={labelCls}>URL privée de la galerie</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://video.fotodesk.test/${selectedGallery.id}`}
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(
                        `https://video.fotodesk.test/${selectedGallery.id}`
                      );
                      showToast('Lien de la galerie copié.');
                    }}
                    className="btn-outline text-xs shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copier le lien
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="bg-subtle border border-line rounded-xl p-2.5">
                  <p className="text-muted">Accès galerie</p>
                  <p className="font-semibold text-heading mt-0.5">Partagée</p>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-2.5">
                  <p className="text-muted">Code d&apos;accès</p>
                  <p className="font-semibold text-heading mt-0.5">
                    {selectedGallery.requireAccessCode ? selectedGallery.accessCode : 'Aucun'}
                  </p>
                </div>
                <div className="bg-subtle border border-line rounded-xl p-2.5">
                  <p className="text-muted">Téléchargement</p>
                  <p className="font-semibold text-heading mt-0.5">
                    {selectedGallery.downloadValidityDays} jours
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShareOpen(false)} className="btn-outline text-sm">
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGalleries((prev) =>
                      prev.map((g) =>
                        g.id === selectedGallery.id ? { ...g, status: 'shared' } : g
                      )
                    );
                    setShareOpen(false);
                    showToast('Galerie vidéo privée partagée.');
                  }}
                  className="btn-primary text-sm"
                >
                  Partager la galerie
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {settingsOpen && selectedGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">
                    Paramètres de la galerie vidéo
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-heading">Téléchargements clients</p>
                    <p className="text-xs text-muted">Autoriser le téléchargement tant que le lien est valide.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settingsAllowDownloads}
                    onClick={() => setSettingsAllowDownloads((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                      settingsAllowDownloads ? 'bg-accent' : 'bg-line'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-xs transition ${
                        settingsAllowDownloads ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className={labelCls}>Validité du lien de téléchargement</label>
                  <select
                    value={settingsValidity}
                    onChange={(e) => setSettingsValidity(Number(e.target.value) as 7 | 14 | 30)}
                    className={inputCls}
                  >
                    <option value={7}>7 jours</option>
                    <option value={14}>14 jours</option>
                    <option value={30}>30 jours</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-line">
                  <div>
                    <p className="text-sm font-medium text-heading">Code d&apos;accès requis</p>
                    <p className="text-xs text-muted">Les clients ouvrent la galerie sans compte FotoDesk.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settingsRequireCode}
                    onClick={() => setSettingsRequireCode((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                      settingsRequireCode ? 'bg-accent' : 'bg-line'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-xs transition ${
                        settingsRequireCode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {settingsRequireCode && (
                  <div>
                    <label className={labelCls}>Code d&apos;accès</label>
                    <input
                      type="text"
                      value={settingsAccessCode}
                      onChange={(e) => setSettingsAccessCode(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSettingsOpen(false)} className="btn-outline text-sm">
                  Annuler
                </button>
                <button type="button" onClick={handleSaveSettings} className="btn-primary text-sm">
                  Enregistrer
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
                  <h3 className="text-lg font-bold text-heading mt-0.5">
                    Supprimer la galerie vidéo ?
                  </h3>
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
                  Êtes-vous sûr de vouloir supprimer{' '}
                  <span className="font-semibold text-heading">{deleteTarget.name}</span> ? Les vidéos associées seront retirées. Les clients et projets ne seront pas supprimés.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="btn-outline text-sm">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteGallery}
                  className="btn-danger"
                >
                  Supprimer la galerie
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
  if (selectedGallery) {
    const totalDuration = selectedGallery.videos.reduce((s, v) => s + v.durationMin, 0);
    const totalComments = selectedGallery.videos.reduce((s, v) => s + v.comments.length, 0);
    const filteredVideos = selectedGallery.videos
      .filter((v) => v.title.toLowerCase().includes(videoSearch.trim().toLowerCase()))
      .sort((a, b) =>
        videoSort === 'title' ? a.title.localeCompare(b.title) : b.durationMin - a.durationMin
      );

    return (
      <div className="space-y-6 pb-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <button
            type="button"
            onClick={() => setSelectedGalleryId(null)}
            className="text-accent hover:underline"
          >
            Galeries vidéo
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-heading">{selectedGallery.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Galerie vidéo {selectedGallery.status === 'shared' ? 'partagée' : ''}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-heading mt-0.5">
              {selectedGallery.name}
            </h1>
            <p className="text-sm text-muted">
              {selectedGallery.client} · {selectedGallery.project} · Créée le {selectedGallery.createdAt}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="w-9 h-9 rounded-xl border border-line bg-panel flex items-center justify-center hover:bg-subtle text-soft"
              title="Partager"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openSettingsModal(selectedGallery)}
              className="w-9 h-9 rounded-xl border border-line bg-panel flex items-center justify-center hover:bg-subtle text-soft"
              title="Paramètres"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openEditModal(selectedGallery)}
              className="w-9 h-9 rounded-xl border border-line bg-panel flex items-center justify-center hover:bg-subtle text-soft"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(selectedGallery)}
              className="w-9 h-9 rounded-xl border border-red-500/30 bg-panel flex items-center justify-center hover:bg-red-500/10 text-red-600"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setClientUnlocked(!selectedGallery.requireAccessCode);
                setAccessCodeInput('');
                setAccessCodeError(null);
                setClientPreviewOpen(true);
              }}
              className="px-4 py-2 rounded-xl border border-blue-500/30 text-blue-600 bg-blue-500/8 hover:bg-blue-500/15 text-xs sm:text-sm font-semibold"
            >
              Aperçu galerie client
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted">Total des vidéos</p>
              <p className="text-2xl font-bold text-heading">{selectedGallery.videos.length}</p>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted">Durée totale</p>
              <p className="text-2xl font-bold text-heading">{totalDuration} min</p>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted">Stockage utilisé</p>
              <p className="text-2xl font-bold text-heading">{totalStorageUsedMin} min</p>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted">Commentaires clients</p>
              <p className="text-2xl font-bold text-heading">{totalComments}</p>
            </div>
          </div>
        </div>

        {/* Video Collection Card */}
        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-heading">Collection vidéo</h2>
              <p className="text-xs text-muted">
                {selectedGallery.videos.length} vidéo{selectedGallery.videos.length > 1 ? 's' : ''} · {totalDuration} minutes au total
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  placeholder="Rechercher des vidéos..."
                  className="h-9 pl-8 pr-3 text-xs bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <select
                value={videoSort}
                onChange={(e) => setVideoSort(e.target.value as 'title' | 'duration')}
                className="h-9 px-3 text-xs bg-panel border border-line rounded-xl text-heading"
              >
                <option value="title">Titre</option>
                <option value="duration">Durée</option>
              </select>

              <div className="inline-flex border border-line rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setVideoViewMode('grid')}
                  className={`p-2 ${videoViewMode === 'grid' ? 'bg-accent/15 text-accent' : 'text-soft hover:bg-subtle'}`}
                  aria-label="Vue grille"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setVideoViewMode('list')}
                  className={`p-2 ${videoViewMode === 'list' ? 'bg-accent/15 text-accent' : 'text-soft hover:bg-subtle'}`}
                  aria-label="Vue liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQueuedUploads([]);
                  setUploadOpen(true);
                }}
                className="btn-primary text-xs py-2 px-3.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Téléverser des vidéos
              </button>
            </div>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="border border-dashed border-line rounded-2xl py-14 px-4 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-subtle border border-line mx-auto flex items-center justify-center text-muted">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-heading">Aucune vidéo dans cette galerie</p>
                <p className="text-xs text-muted mt-0.5">
                  Téléversez des vidéos pour commencer à partager et recueillir les retours clients.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQueuedUploads([]);
                  setUploadOpen(true);
                }}
                className="btn-primary text-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                Téléverser des vidéos
              </button>
            </div>
          ) : videoViewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-panel border border-line rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all"
                >
                  <div
                    onClick={() => {
                      setPlayerVideoId(vid.id);
                      setCurrentTimeSec(180);
                      setIsPlaying(false);
                    }}
                    className="relative h-40 bg-black cursor-pointer group"
                  >
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 border border-white/60 text-white flex items-center justify-center">
                        <Play className="w-4 h-4 ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 text-[11px] font-semibold bg-black/75 text-white px-2 py-0.5 rounded-md">
                      {vid.durationLabel}
                    </span>
                  </div>
                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-heading truncate">{vid.title}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {vid.date} · {vid.comments.length} commentaire{vid.comments.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/12 px-2 py-0.5 rounded-full shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Prête
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-line/60 border border-line rounded-xl overflow-hidden">
              {filteredVideos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => {
                    setPlayerVideoId(vid.id);
                    setCurrentTimeSec(180);
                    setIsPlaying(false);
                  }}
                  className="p-3.5 flex items-center justify-between gap-4 hover:bg-subtle/40 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-black shrink-0">
                      <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 text-[10px] bg-black/75 text-white px-1 rounded">
                        {vid.durationLabel}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-heading truncate">{vid.title}</p>
                      <p className="text-xs text-muted">
                        {vid.date} · {vid.comments.length} commentaire{vid.comments.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/12 px-2.5 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Prête
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {renderPlayerAndModals()}
      </div>
    );
  }

  // MAIN LIST VIEW
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted mb-1">
            Espace de travail <span className="mx-1">/</span> Galeries vidéo
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            Galeries vidéo
          </h1>
          <p className="text-sm text-muted mt-1">
            Gérez vos galeries vidéo, consultez les retours clients et suivez l&apos;utilisation vidéo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStarterPreview((v) => !v)}
            className="px-3.5 py-2 rounded-xl border border-blue-500/30 bg-blue-500/8 text-blue-600 text-xs font-semibold hover:bg-blue-500/15 transition-colors"
          >
            {starterPreview ? 'Aperçu Starter · Passer en Pro' : 'Offre Pro · Aperçu accès Starter'}
          </button>
          <button type="button" onClick={openCreateModal} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Créer une galerie vidéo
          </button>
        </div>
      </div>

      {/* 2 Usage Quota Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-heading">Stockage vidéo</p>
              <p className="text-[11px] text-muted">{starterPreview ? 'Offre Starter' : 'Offre Pro'}</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-heading">
            {totalStorageUsedMin} / {storageLimitMin}{' '}
            <span className="text-xs font-normal text-muted">minutes</span>
          </p>
          <div className="h-2 bg-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalStorageUsedMin / storageLimitMin) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{Math.max(0, storageLimitMin - totalStorageUsedMin)} minutes restantes</span>
            <span>Partagé sur toutes les galeries · Ne se réinitialise pas</span>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Play className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-heading">Lecture vidéo ce mois-ci</p>
              <p className="text-[11px] text-muted">{starterPreview ? 'Offre Starter' : 'Offre Pro'}</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-heading">
            {playbackUsedMin} / {playbackLimitMin}{' '}
            <span className="text-xs font-normal text-muted">minutes</span>
          </p>
          <div className="h-2 bg-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (playbackUsedMin / playbackLimitMin) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{Math.max(0, playbackLimitMin - playbackUsedMin)} minutes restantes</span>
            <span>Réinitialisation le 1er juil. 2026 · Période 1–30 juin</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-panel border border-line rounded-2xl p-4 flex flex-col lg:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher des galeries vidéo..."
            className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading"
          >
            <option value="all">Tous les clients</option>
            <option value="Sarah Johnson">Sarah Johnson</option>
            <option value="Emily Carter">Emily Carter</option>
            <option value="Daniel Smith">Daniel Smith</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading"
          >
            <option value="all">Tous les projets</option>
            <option value="Sarah & Michael Wedding">Sarah & Michael Wedding</option>
            <option value="Brand Photography">Brand Photography</option>
            <option value="Corporate Event">Corporate Event</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | GalleryStatus)}
            className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="active">Active</option>
            <option value="shared">Partagée</option>
            <option value="expired">Expirée</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
            className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading"
          >
            <option value="newest">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
            <option value="name">Nom de galerie</option>
          </select>
        </div>
      </div>

      {/* 2-Column Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredGalleries.map((g) => {
          const totalMin = g.videos.reduce((s, v) => s + v.durationMin, 0);
          return (
            <div
              key={g.id}
              className="bg-panel border border-line rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all relative"
            >
              <div
                onClick={() => setSelectedGalleryId(g.id)}
                className="relative h-48 bg-black cursor-pointer group"
              >
                <img
                  src={g.coverImage}
                  alt={g.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-black/60 border border-white/60 text-white flex items-center justify-center">
                    <Play className="w-5 h-5 ml-0.5" />
                  </div>
                </div>
                <div className="absolute top-3 left-3">
                  <StatusPill status={g.status} />
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCardMenuId(cardMenuId === g.id ? null : g.id);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
                aria-label="Actions galerie"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {cardMenuId === g.id && (
                <div className="absolute top-12 right-3 w-44 bg-panel border border-line rounded-xl shadow-lg py-1.5 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCardMenuId(null);
                      setSelectedGalleryId(g.id);
                    }}
                    className="w-full px-3.5 py-2 text-left text-heading hover:bg-subtle"
                  >
                    Ouvrir la galerie
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(g)}
                    className="w-full px-3.5 py-2 text-left text-heading hover:bg-subtle"
                  >
                    Modifier la galerie
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardMenuId(null);
                      setDeleteTarget(g);
                    }}
                    className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-500/10"
                  >
                    Supprimer
                  </button>
                </div>
              )}

              <div
                onClick={() => setSelectedGalleryId(g.id)}
                className="p-4 cursor-pointer space-y-1.5"
              >
                <h3 className="text-base font-semibold text-heading">{g.name}</h3>
                <p className="text-xs text-muted">
                  {g.client} · {g.project}
                </p>
                <p className="text-xs text-soft pt-1">
                  {g.videos.length} vidéo{g.videos.length > 1 ? 's' : ''} · {totalMin} min · {g.createdAt}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {renderPlayerAndModals()}
    </div>
  );
};

