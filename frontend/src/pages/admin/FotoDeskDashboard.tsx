import React, { useId, useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, ArrowRight, ArrowUpRight,
  CalendarDays, Download, Eye,
  ExternalLink, HardDrive, Image as ImageIcon,
  MoreHorizontal, Plus, Settings2, Palette, Cloud, Globe, Video,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../../services/admin.service";
import { fotodeskService } from "../../services/fotodesk.service";
import { eventsService } from "../../services/events.service";
import { ErrorState, Loading } from "../../components/common";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { useAdminDarkMode } from "../../contexts/AdminDarkModeContext";
import "../../styles/fotodesk-dashboard.css";

type MetricTone = "amber" | "blue" | "green" | "storage";
type TaskStatus = "ready" | "progress" | "waiting";

export type DashboardProps = {
  studioName?: string;
  email?: string;
  portfolioUrl?: string;
  onCreateGallery?: () => void;
  onPublishGallery?: (taskId: string) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenActivity?: () => void;
  standalone?: boolean;
};

function Sparkline({ tone }: { tone: MetricTone }) {
  const gradientId = useId();
  const line = tone === "amber"
    ? "M2 55 C18 56 22 40 34 42 S53 47 64 28 S84 33 96 18 S116 21 126 3"
    : tone === "blue"
    ? "M2 40 C17 28 22 51 36 43 S55 14 73 26 S96 31 106 13 S119 15 126 3"
    : "M2 56 C19 52 25 36 39 40 S58 34 70 25 S91 31 103 15 S117 9 126 4";
  return (
    <svg className="fd-sparkline" viewBox="0 0 128 64" preserveAspectRatio="none" role="img" aria-label="Tendance croissante">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--spark)" stopOpacity=".28" />
          <stop offset="100%" stopColor="var(--spark)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L126 64 L2 64 Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke="var(--spark)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function PhotoQuotaRing({ percent }: { percent: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(8, Math.min(100, percent));
  const dash = (clamped / 100) * c;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0" aria-hidden="true">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(16, 185, 129, 0.16)" strokeWidth="5" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="#10b981"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 28 28)"
      />
      <text
        x="28"
        y="32"
        textAnchor="middle"
        fill="currentColor"
        fontSize="11"
        fontWeight="600"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

function VideoWaveformBars() {
  const bars = [14, 24, 34, 20, 28, 16];
  return (
    <svg width="64" height="44" viewBox="0 0 64 44" className="shrink-0" aria-hidden="true">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={4 + i * 10}
          y={40 - h}
          width="5"
          height={h}
          rx="2.5"
          fill="#3b82f6"
          fillOpacity={0.35 + (i % 3) * 0.25}
        />
      ))}
    </svg>
  );
}

function MetricCard({ item, onClick }: {
  item: {
    label: string;
    value: string;
    change: string;
    icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
    tone: MetricTone;
    subLabel?: string;
    usedPercent?: number;
    iconTileStyle?: React.CSSProperties;
    visual?: 'photoRing' | 'videoBars';
  };
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <article
      className={`fd-card fd-metric fd-metric--${item.tone} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="fd-metric-head">
        <div className="fd-icon-tile" style={item.iconTileStyle}><Icon size={21} strokeWidth={1.8} /></div>
        <span className="fd-metric-label">{item.label}</span>
      </div>
      <div className="fd-metric-bottom">
        <div>
          <strong className="fd-metric-value">{item.value}</strong>
          {item.tone === "storage" ? (
            <>
              <div className="fd-meter" aria-label={`${item.usedPercent || 0}% du stockage utilisé`}>
                <i style={{ width: `${Math.min(100, item.usedPercent || 0)}%`, background: '#f97316' }} />
              </div>
              <p className="fd-metric-description">{item.subLabel || "0% de la limite 118.57 GB"}</p>
            </>
          ) : (
            <>
              <p className="fd-growth">{item.change}</p>
              <p className="fd-metric-description">{item.subLabel || "Studio actif"}</p>
            </>
          )}
        </div>
        {item.visual === 'photoRing' && <PhotoQuotaRing percent={item.usedPercent ?? 0} />}
        {item.visual === 'videoBars' && <VideoWaveformBars />}
      </div>
    </article>
  );
}

function TaskRow({ item, onPublish, onOpen }: {
  item: {
    id: string; title: string; detail: string; deadline: string;
    photo: string; status: TaskStatus; action: string;
  };
  onPublish?: (id: string) => void;
  onOpen?: (id: string) => void;
}) {
  return (
    <div className="fd-task-row">
      <img className="fd-task-image" src={item.photo} alt="" loading="lazy" />
      <div className="fd-task-body">
        <div className="fd-task-title">{item.title}</div>
        <div className="fd-task-detail">{item.detail}</div>
        <div className="fd-task-date"><CalendarDays size={14} /> {item.deadline}</div>
      </div>
      <button
        type="button"
        className={`fd-status fd-status--${item.status}`}
        onClick={() => item.status === "ready" ? onPublish?.(item.id) : onOpen?.(item.id)}
        title={item.status === "ready" ? "Publier la galerie" : "Ouvrir le projet"}
      >
        {item.status !== "ready" && <span className="fd-status-dot" />}
        {item.action}
      </button>
      <button type="button" className="fd-more fd-icon-button" aria-label={`Ouvrir ${item.title}`} onClick={() => onOpen?.(item.id)}>
        <MoreHorizontal size={21} />
      </button>
    </div>
  );
}

function ActivityRow({ item }: {
  item: {
    id: string; title: string; detail: string; time: string;
    icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
    tone: "purple" | "green" | "blue" | "neutral";
  };
}) {
  const Icon = item.icon;
  return (
    <div className="fd-activity-row">
      <span className={`fd-activity-icon fd-activity-icon--${item.tone}`}><Icon size={20} strokeWidth={1.8} /></span>
      <div className="fd-activity-body">
        <div className="fd-activity-title">{item.title}</div>
        <div className="fd-activity-detail">{item.detail}</div>
      </div>
      <span className="fd-activity-time">{item.time}</span>
    </div>
  );
}

function SectionHeading({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="fd-section-heading">
      <div className="fd-section-label">{icon}<h2>{title}</h2></div>
      {action}
    </div>
  );
}

export const FotoDeskDashboard: React.FC<DashboardProps> = ({
  studioName: propStudioName,
  email: propEmail,
  portfolioUrl: propPortfolioUrl,
  onCreateGallery,
  onPublishGallery,
  onOpenTask,
  onOpenActivity,
}) => {
  // Safe auth context access (fallback to null if outside provider)
  let user: any = null;
  try {
    const auth = useAdminAuth();
    user = auth?.user ?? null;
  } catch {
    user = null;
  }

  // Safe dark mode context access (fallback to document class or false if outside provider)
  let isDark = false;
  try {
    const darkMode = useAdminDarkMode();
    isDark = darkMode?.isDark ?? false;
  } catch {
    isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  }

  const navigate = useNavigate();

  const email = propEmail || user?.email || "";

  const userFirstName = useMemo(() => {
    // 1. Explicit first name or prenom
    if (user?.first_name?.trim()) return user.first_name.trim();
    if (user?.prenom?.trim()) return user.prenom.trim();

    // 2. Full name or credit name (e.g. "Marc Dubois" -> "Marc")
    const fullName = user?.name?.trim() || user?.creditName?.trim();
    if (fullName && !fullName.includes('@')) {
      const firstWord = fullName.split(/\s+/)[0];
      if (firstWord) return firstWord;
    }

    // 3. Username or email (e.g. "founder@fotodesk.com" -> "Founder", "jean.dupont@..." -> "Jean")
    const rawAccount = user?.username?.trim() || user?.email?.trim() || email?.trim();
    if (rawAccount) {
      const handle = rawAccount.split('@')[0];
      const namePart = handle.split(/[._-]/)[0];
      if (namePart && namePart.length > 0) {
        return namePart.charAt(0).toUpperCase() + namePart.slice(1);
      }
    }

    // 4. Studio name or fallback
    if (propStudioName && !propStudioName.includes('@')) return propStudioName;
    if (user?.company_name?.trim()) return user.company_name.trim();

    return "Photographe";
  }, [user, email, propStudioName]);
  const portfolioUrl = propPortfolioUrl || (typeof window !== 'undefined' ? `${window.location.origin}/portfolio` : '/portfolio');

  // Live FotoDesk API stats
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminService.getDashboardStats(),
    staleTime: 30000,
  });

  // Live expiring events for tasks
  const tasksQuery = useQuery({
    queryKey: ['admin-events-summary', 'expiring'],
    queryFn: () => eventsService.getEvents({ limit: 5, status: 'expiring', sortBy: 'expires_at', sortOrder: 'asc' }),
    staleTime: 30000,
  });

  // Live recent activity
  const activityQuery = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: () => adminService.getRecentActivity(8),
    staleTime: 30000,
  });

  const videoGalleriesQuery = useQuery({
    queryKey: ['admin-video-galleries-count'],
    queryFn: () => fotodeskService.videoGalleries.list(),
    staleTime: 30000,
    retry: 1,
  });
  const dashboardStats = dashboardQuery.data;
  const expiringEventsData = tasksQuery.data;
  const recentActivity = activityQuery.data;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toLocaleString('fr-FR')}`;
    return num.toString();
  };

  const metrics = useMemo(() => {
    const unavailable = dashboardQuery.isLoading || dashboardQuery.isError;
    const activeCount = dashboardStats?.activeEvents ?? 0;
    const activeVal = unavailable ? "—" : formatNumber(activeCount);
    const photoQuotaPct = Math.min(100, Math.round((activeCount / 3) * 100));
    const videoList = Array.isArray(videoGalleriesQuery.data?.galleries)
      ? videoGalleriesQuery.data.galleries
      : [];
    const videoCount = videoList.length;
    const videoTotalMin = Math.ceil(
      videoList.reduce((acc: number, g: any) => acc + Number(g.totalDurationSec || 0), 0) / 60
    );
    const videoVal = videoGalleriesQuery.isLoading ? "—" : formatNumber(videoCount);

    const storageBytes = dashboardStats?.storageUsed;
    const storageFormatted = unavailable || storageBytes == null ? "—" : adminService.formatBytes(storageBytes);
    const maxBytes = 118.57 * 1024 * 1024 * 1024;
    const usedPercent = storageBytes == null ? 0 : Math.round((storageBytes / maxBytes) * 100) || 0;

    return [
      {
        label: "Galerie photo",
        value: activeVal,
        change: `${activeCount} active(s)`,
        subLabel: "Ouvrir les galeries photo",
        icon: ImageIcon,
        tone: "green" as MetricTone,
        usedPercent: photoQuotaPct,
        visual: 'photoRing' as const,
        to: '/admin/events',
      },
      {
        label: "Galerie vidéo",
        value: videoVal,
        change: `${videoTotalMin} min stockées`,
        subLabel: "Ouvrir les galeries vidéo",
        icon: Video,
        tone: "blue" as MetricTone,
        visual: 'videoBars' as const,
        to: '/admin/video-galleries',
      },
      {
        label: "Stockage",
        value: storageFormatted,
        change: "",
        icon: HardDrive,
        tone: "storage" as MetricTone,
        iconTileStyle: { background: 'rgba(249, 115, 22, 0.14)', color: '#f97316' },
        subLabel: storageBytes == null ? "Mesure indisponible" : `${usedPercent}% de la limite 118.57 GB`,
        usedPercent,
        to: '/admin/subscription',
      },
    ];
  }, [dashboardQuery.isError, dashboardQuery.isLoading, dashboardStats, videoGalleriesQuery.data, videoGalleriesQuery.isLoading]);

  const tasks = useMemo(() => {
    if (expiringEventsData?.events && expiringEventsData.events.length > 0) {
      return expiringEventsData.events.slice(0, 3).map((event) => ({
        id: String(event.id),
        title: event.event_name,
        detail: "Cette galerie arrive bientôt à expiration",
        deadline: (() => {
          if (!event.expires_at) return "Échéance non renseignée";
          const d = new Date(event.expires_at);
          if (Number.isNaN(d.getTime())) return "Échéance non renseignée";
          return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d);
        })(),
        photo: (event as any).cover_photo_url || '/assets/images/camera-hero.jpg',
        status: "waiting" as TaskStatus,
        action: "Vérifier",
      }));
    }
    return [];
  }, [expiringEventsData]);

  const activities = useMemo(() => {
    if (recentActivity && recentActivity.length > 0) {
      const relative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
      return recentActivity.slice(0, 4).map((act: any, idx: number) => {
        let icon = ImageIcon;
        let tone: "purple" | "green" | "blue" | "neutral" = "neutral";
        if (act.type?.includes("download")) { icon = Download; tone = "blue"; }
        else if (act.type?.includes("created") || act.type?.includes("event")) { icon = ImageIcon; tone = "green"; }
        else if (act.type?.includes("theme") || act.type?.includes("setting")) { icon = Settings2; tone = "neutral"; }
        else if (act.type?.includes("brand")) { icon = Palette; tone = "purple"; }

        const parsedTime = act.createdAt ? new Date(act.createdAt).getTime() : NaN;
        const elapsedMinutes = Number.isFinite(parsedTime) ? Math.round((parsedTime - Date.now()) / 60000) : null;
        return {
          id: String(act.id || idx),
          title: act.eventName ? `${act.eventName}` : (act.metadata?.name || act.type || "Activité studio"),
          detail: act.actorName ? `Par ${act.actorName}` : (act.metadata?.detail || `Par ${email}`),
          time: elapsedMinutes == null || !Number.isFinite(elapsedMinutes)
            ? "Date indisponible"
            : Math.abs(elapsedMinutes) < 60
              ? relative.format(elapsedMinutes, 'minute')
              : relative.format(Math.round(elapsedMinutes / 60), 'hour'),
          icon,
          tone,
        };
      });
    }
    return [];
  }, [recentActivity, email]);

  const displayDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      }).format(new Date());
    } catch {
      return "";
    }
  }, []);

  const handleCreateGallery = () => {
    if (onCreateGallery) onCreateGallery();
    else navigate('/admin/events/new');
  };

  const handlePublish = (id: string) => {
    if (onPublishGallery) onPublishGallery(id);
    else navigate(`/admin/events/${id}`);
  };

  const handleOpenTask = (id: string) => {
    if (onOpenTask) onOpenTask(id);
    else navigate(`/admin/events/${id}`);
  };

  const handleOpenActivity = () => {
    if (onOpenActivity) onOpenActivity();
    else navigate('/admin/events');
  };

  return (
    <div className="fd-dashboard-view" data-theme={isDark ? "dark" : "light"}>
      <main className="fd-main">
        {/* Hero Banner */}
        <section className="fd-hero" aria-label="Bienvenue dans votre studio">
          <div className="fd-hero-copy">
            <p className="fd-date">{displayDate}</p>
            <h1>Bonjour, <strong>{userFirstName}</strong></h1>
            <p className="fd-hero-subtitle">Gérez, partagez et valorisez vos souvenirs en toute simplicité.</p>
            <div className="fd-hero-chips">
              <div className="fd-hero-chip">
                <span className="fd-live-dot" />
                <Cloud size={17} className="text-neutral-300 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <strong className="text-xs font-semibold text-white">Données du studio</strong>
                  <span className="text-[11px] text-neutral-400">
                    {dashboardQuery.isLoading ? "Actualisation…" : dashboardQuery.isError ? "Actualisation impossible" : "Indicateurs actualisés"}
                  </span>
                </div>
              </div>
              <a className="fd-hero-chip fd-hero-chip-link" href={portfolioUrl} target="_blank" rel="noopener noreferrer">
                <Globe size={17} className="text-neutral-300 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <strong className="text-xs font-semibold text-white">Portfolio public</strong>
                  <span className="text-[11px] text-neutral-400">Ouvrir le portfolio</span>
                </div>
                <ExternalLink size={15} className="text-neutral-400 shrink-0 ml-1" />
              </a>
            </div>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 font-semibold text-[14px] transition-all hover:brightness-95 active:scale-[0.99] cursor-pointer shrink-0"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F7F7 60%, #D6D6D6 100%)',
              color: '#050505',
              borderRadius: '8px',
              padding: '10px 20px',
              border: 'none',
            }}
            type="button"
            onClick={handleCreateGallery}
          >
            <Plus size={16} strokeWidth={2.2} />
            Nouvelle galerie
          </button>
        </section>

        {/* 3 KPIs : Galerie photo, Galerie vidéo et Stockage */}
        <section
          className="fd-metrics"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
          aria-label="Indicateurs clés"
        >
          {metrics.map(item => (
            <MetricCard
              key={item.label}
              item={item}
              onClick={item.to ? () => navigate(item.to) : undefined}
            />
          ))}
        </section>

        {/* 2 Bottom Panels */}
        <section className="fd-content-grid">
          {/* Panel 1: À traiter aujourd'hui */}
          <article className="fd-card fd-panel">
            <SectionHeading
              icon={<CalendarDays size={23} />}
              title="À traiter aujourd’hui"
              action={
                <button
                  type="button"
                  className="fd-secondary-button"
                  onClick={() => navigate('/admin/events')}
                >
                  Voir tout <ArrowRight size={16} />
                </button>
              }
            />
            <div className="fd-panel-list">
              {tasksQuery.isLoading ? <Loading /> : tasksQuery.isError ? (
                <ErrorState
                  className="min-h-40"
                  title="Impossible de charger les échéances"
                  actionLabel="Réessayer"
                  onAction={() => tasksQuery.refetch()}
                />
              ) : tasks.length ? (
                tasks.map(item => (
                  <TaskRow
                    key={item.id}
                    item={item}
                    onPublish={handlePublish}
                    onOpen={handleOpenTask}
                  />
                ))
              ) : (
                <p className="fd-empty">Aucune tâche pour le moment.</p>
              )}
            </div>
          </article>

          {/* Panel 2: Activité récente */}
          <article className="fd-card fd-panel fd-activity-panel">
            <SectionHeading
              icon={<Activity size={23} />}
              title="Activité récente"
              action={
                <button
                  type="button"
                  className="fd-secondary-button"
                  onClick={handleOpenActivity}
                >
                  Voir tout <ArrowRight size={16} />
                </button>
              }
            />
            <div className="fd-panel-list">
              {activityQuery.isLoading ? <Loading /> : activityQuery.isError ? (
                <ErrorState
                  className="min-h-40"
                  title="Impossible de charger l’activité"
                  actionLabel="Réessayer"
                  onAction={() => activityQuery.refetch()}
                />
              ) : activities.length ? (
                activities.map(item => <ActivityRow key={item.id} item={item} />)
              ) : (
                <p className="fd-empty">Aucune activité récente.</p>
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default FotoDeskDashboard;
