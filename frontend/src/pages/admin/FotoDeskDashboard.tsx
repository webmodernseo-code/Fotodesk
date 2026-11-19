import React, { useId, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FolderKanban,
  Image as ImageIcon,
  MoreHorizontal,
  Plus,
  Receipt,
  Sparkles,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

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

type SparkTone = 'violet' | 'amber' | 'indigo' | 'emerald';

const SPARK_PATHS: Record<SparkTone, { path: string; stroke: string }> = {
  violet: {
    path: 'M2 32 C16 29, 24 20, 36 22 C48 24, 56 14, 68 17 C80 20, 90 10, 102 7',
    stroke: '#8b5cf6',
  },
  amber: {
    path: 'M2 30 C16 32, 26 19, 38 22 C50 25, 60 26, 72 15 C84 7, 92 17, 102 12',
    stroke: '#f59e0b',
  },
  indigo: {
    path: 'M2 27 C14 19, 26 31, 38 25 C50 18, 62 13, 74 20 C86 25, 94 11, 102 14',
    stroke: '#6366f1',
  },
  emerald: {
    path: 'M2 33 C18 32, 28 26, 42 27 C54 28, 66 19, 78 13 C88 8, 96 6, 102 4',
    stroke: '#10b981',
  },
};

const DEMO_APPOINTMENTS = [
  { id: 101, title: 'Séance fiançailles Anderson', appointment_date: '2026-06-14', start_time: '10:00', end_time: '12:00', location: 'Jardin des Tuileries, Paris' },
  { id: 102, title: 'Campagne marque Harper', appointment_date: '2026-06-18', start_time: '14:30', end_time: '17:30', location: 'Northlight Studio' },
  { id: 103, title: 'Portraits famille Patel', appointment_date: '2026-06-22', start_time: '16:00', end_time: '18:00', location: 'Parc Monceau, Paris' },
];

const DEMO_PROJECTS = [
  { id: 201, name: 'Mariage Anderson', client: 'Elena & James', status: 'in_progress', event_date: '2026-06-14', progress: 68 },
  { id: 202, name: 'Shooting marque Harper', client: 'Harper & Co.', status: 'editing', event_date: '2026-06-18', progress: 82 },
  { id: 203, name: 'Famille Patel', client: 'Maya Patel', status: 'planning', event_date: '2026-06-22', progress: 24 },
  { id: 204, name: 'Naissance Chen', client: 'Lina Chen', status: 'review', event_date: '2026-06-25', progress: 94 },
];

const DEMO_ACTIVITY = [
  { id: 'a1', title: 'Contrat signé', detail: 'Elena Anderson a signé le contrat Mariage', time: 'Il y a 12 min', tone: 'emerald' },
  { id: 'a2', title: 'Paiement reçu', detail: '1 200 € reçus de Harper & Co.', time: 'Il y a 1 h', tone: 'emerald' },
  { id: 'a3', title: 'Galerie publiée', detail: 'Famille Patel 2026 est maintenant en ligne', time: 'Il y a 3 h', tone: 'amber' },
  { id: 'a4', title: 'Nouveau client ajouté', detail: 'Ava & Noah ajoutés au portefeuille', time: 'Hier', tone: 'indigo' },
];

function MiniSparkline({ tone }: { tone: SparkTone }) {
  const gradId = useId();
  const { path, stroke } = SPARK_PATHS[tone];
  return (
    <svg className="w-[84px] h-9 shrink-0" viewBox="0 0 104 38" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L102 38 L2 38 Z`} fill={`url(#${gradId})`} />
      <path d={path} stroke={stroke} strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  );
}

function ProjectStatusDonut({
  total,
  segments,
}: {
  total: number;
  segments: Array<{ label: string; count: number; color: string }>;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-neutral-200/80 dark:text-neutral-800"
          strokeWidth="10"
        />
        {total > 0 &&
          segments.map((seg) => {
            if (seg.count <= 0) return null;
            const dash = (seg.count / total) * circumference;
            const currentOffset = offset;
            offset += dash;
            return (
              <circle
                key={seg.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="10"
                strokeDasharray={`${Math.max(0, dash - 2)} ${circumference}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
              />
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-semibold tracking-tight tabular-nums text-heading leading-none">{total}</span>
        <span className="text-[11px] text-muted mt-0.5">Total</span>
      </div>
    </div>
  );
}

const PROJECT_STATUS_META: Record<string, { label: string; badgeClass: string; progress: number }> = {
  planning: {
    label: 'Planifié',
    badgeClass: 'bg-amber-50/80 text-amber-700 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50',
    progress: 24,
  },
  in_progress: {
    label: 'En cours',
    badgeClass: 'bg-sky-50/80 text-sky-700 border-sky-200/80 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/50',
    progress: 68,
  },
  editing: {
    label: 'Retouche',
    badgeClass: 'bg-violet-50/80 text-violet-700 border-violet-200/80 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800/50',
    progress: 82,
  },
  review: {
    label: 'En révision',
    badgeClass: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50',
    progress: 94,
  },
  completed: {
    label: 'Terminé',
    badgeClass: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50',
    progress: 100,
  },
};

function formatDateParts(iso?: string | null) {
  if (!iso) return { day: '14', month: 'Juin', short: '14 juin' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: '14', month: 'Juin', short: '14 juin' };
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
  const short = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return { day, month: month.charAt(0).toUpperCase() + month.slice(1), short };
}

function formatEur(minor: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);
}

export const FotoDeskDashboard: React.FC<DashboardProps> = ({
  studioName: propStudioName,
  email: propEmail,
  onCreateGallery,
}) => {
  const navigate = useNavigate();

  let user: any = null;
  try {
    user = useAdminAuth()?.user ?? null;
  } catch {
    user = null;
  }

  const overviewQuery = useQuery({
    queryKey: ['admin-dashboard-overview'],
    queryFn: () => adminService.getDashboardOverview(),
    staleTime: 30000,
    retry: 1,
  });

  const activityQuery = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: () => adminService.getRecentActivity(4),
    staleTime: 30000,
    retry: 1,
  });

  const overview = overviewQuery.data;
  const studioLabel = overview?.studio?.name && !overview.studio.name.includes('@')
    ? overview.studio.name
    : propStudioName || 'Northlight Studio';

  const firstName = useMemo(() => {
    const candidate =
      user?.first_name?.trim() ||
      user?.name?.trim()?.split(/\s+/)[0] ||
      user?.username?.trim() ||
      propEmail?.split('@')[0] ||
      user?.email?.split('@')[0];
    if (!candidate) return 'Sofia';
    const clean = candidate.split(/[._-]/)[0];
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Sofia';
  }, [user, propEmail]);

  const todayFormatted = useMemo(() => {
    const raw = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  const [calendarCursor, setCalendarCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const calendarGrid = useMemo(() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const cells: Array<{ day: number | null; isToday: boolean }> = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push({ day: null, isToday: false });
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({ day: d, isToday: isCurrentMonth && d === today.getDate() });
    }
    return {
      title: calendarCursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      cells,
    };
  }, [calendarCursor]);

  // Conserve les valeurs de démonstration réalistes tant que la base est vide
  const hasRealClients = (overview?.kpis?.customersCount ?? 0) > 0;
  const hasRealProjects = (overview?.kpis?.projectsCount ?? 0) > 0;
  const hasRealAppointments = (overview?.upcomingAppointments?.length ?? 0) > 0;
  const hasRealInvoices = (overview?.kpis?.invoicesSummary?.totalCount ?? 0) > 0;

  const customersCount = hasRealClients ? overview!.kpis.customersCount : 248;
  const projectsCount = hasRealProjects ? overview!.kpis.projectsCount : 18;
  const upcomingAppointments = hasRealAppointments ? overview!.upcomingAppointments : DEMO_APPOINTMENTS;
  const recentProjects = hasRealProjects
    ? overview!.recentProjects.map((p) => ({
        ...p,
        client: 'Client studio',
        progress: (PROJECT_STATUS_META[p.status] || PROJECT_STATUS_META.planning).progress,
      }))
    : DEMO_PROJECTS;

  const pendingAmountMinor = hasRealInvoices
    ? Math.max(0, (overview!.kpis.invoicesSummary.totalAmountMinor || 0) - (overview!.kpis.invoicesSummary.paidAmountMinor || 0))
    : 842000;
  const pendingInvoicesCount = hasRealInvoices ? overview!.kpis.invoicesSummary.pendingCount : 5;

  const rawByStatus = overview?.kpis?.projectsByStatus ?? {};
  const donutSegments = hasRealProjects
    ? [
        { label: 'Planifié', count: rawByStatus.planning ?? 0, color: '#f59e0b' },
        { label: 'En cours', count: rawByStatus.in_progress ?? 0, color: '#3b82f6' },
        { label: 'Retouche', count: rawByStatus.editing ?? 0, color: '#8b5cf6' },
        { label: 'En révision', count: (rawByStatus.review ?? 0) + (rawByStatus.completed ?? 0), color: '#10b981' },
      ]
    : [
        { label: 'Planifié', count: 5, color: '#f59e0b' },
        { label: 'En cours', count: 7, color: '#3b82f6' },
        { label: 'Retouche', count: 4, color: '#8b5cf6' },
        { label: 'En révision', count: 2, color: '#10b981' },
      ];

  const kpiCards = [
    {
      label: 'Total clients',
      value: String(customersCount),
      sub: '+12 ce mois-ci',
      subPositive: true,
      tone: 'violet' as SparkTone,
      icon: Users,
    },
    {
      label: 'Projets actifs',
      value: String(projectsCount),
      sub: '6 dus cette semaine',
      subPositive: false,
      tone: 'amber' as SparkTone,
      icon: FolderKanban,
    },
    {
      label: 'Séances à venir',
      value: String(hasRealAppointments ? upcomingAppointments.length : 9),
      sub: '14 prochains jours',
      subPositive: false,
      tone: 'indigo' as SparkTone,
      icon: CalendarDays,
    },
    {
      label: 'Paiements en attente',
      value: formatEur(pendingAmountMinor),
      sub: `${pendingInvoicesCount} factures`,
      subPositive: false,
      tone: 'emerald' as SparkTone,
      icon: CreditCard,
    },
  ];

  const quickActions = [
    { label: 'Ajouter un client', icon: UserPlus, to: '/admin/clients/accounts' },
    { label: 'Créer un projet', icon: FolderKanban, to: '/admin/clients/projects' },
    {
      label: 'Galerie photo',
      icon: ImageIcon,
      onClick: () => (onCreateGallery ? onCreateGallery() : navigate('/admin/events/new')),
    },
    { label: 'Galerie vidéo', icon: Video, to: '/admin/video-galleries' },
    { label: 'Créer un devis', icon: Receipt, to: '/admin/clients/quotes/new' },
  ];

  const liveActivity = Array.isArray(activityQuery.data) && activityQuery.data.length > 0
    ? activityQuery.data.slice(0, 4).map((act: any, idx: number) => ({
        id: String(act.id || idx),
        title: act.action || 'Mise à jour studio',
        detail: act.description || 'Activité enregistrée',
        time: act.createdAt
          ? new Date(act.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
          : 'Récent',
        tone: idx % 2 === 0 ? 'emerald' : 'amber',
      }))
    : DEMO_ACTIVITY;

  return (
    <div className="min-h-screen bg-canvas text-body">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* En-tête sobre */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-muted">{todayFormatted}</p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-heading mt-0.5">
              Bonjour, {firstName}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Voici l&apos;activité de {studioLabel} aujourd&apos;hui.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/clients/projects')}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau projet
          </button>
        </header>

        {/* 4 Cartes KPI */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className="bg-panel border border-line rounded-xl p-4 shadow-2xs flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted">{card.label}</span>
                  <span className="w-7 h-7 rounded-lg border border-line bg-canvas flex items-center justify-center text-muted">
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.6} />
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[24px] font-semibold tracking-tight tabular-nums text-heading leading-tight">
                      {card.value}
                    </div>
                    <div
                      className={`text-[11px] mt-1 ${
                        card.subPositive ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted'
                      }`}
                    >
                      {card.sub}
                    </div>
                  </div>
                  <MiniSparkline tone={card.tone} />
                </div>
              </article>
            );
          })}
        </section>

        {/* Actions rapides */}
        <section className="bg-panel border border-line rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h2 className="text-[13px] font-semibold text-heading">Actions rapides</h2>
              <p className="text-[11px] text-muted">Démarrez vos flux de travail les plus fréquents.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {quickActions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  type="button"
                  onClick={() => (act.onClick ? act.onClick() : navigate(act.to!))}
                  className="flex items-center justify-between gap-2 h-10 px-3 rounded-lg border border-line bg-canvas/60 hover:bg-hover text-left transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.6} />
                    <span className="text-xs font-medium text-heading truncate">{act.label}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.6} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Grille principale asymétrique */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Colonne gauche (8/12) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Séances à venir */}
            <section className="bg-panel border border-line rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[13px] font-semibold text-heading">Séances à venir</h2>
                  <p className="text-[11px] text-muted">Vos prochains rendez-vous planifiés</p>
                </div>
                <Link
                  to="/admin/agenda"
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Voir le calendrier
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.6} />
                </Link>
              </div>

              <div className="divide-y divide-line">
                {upcomingAppointments.map((appt: any) => {
                  const parts = formatDateParts(appt.appointment_date);
                  return (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg border border-line bg-canvas flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-semibold tabular-nums text-heading leading-none">{parts.day}</span>
                          <span className="text-[10px] text-muted mt-0.5">{parts.month}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-heading truncate">{appt.title}</p>
                          <p className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5 truncate">
                            <Clock className="w-3 h-3 shrink-0" strokeWidth={1.6} />
                            <span>
                              {appt.start_time || '10:00'}
                              {appt.location ? ` · ${appt.location}` : ''}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/agenda')}
                        className="w-7 h-7 rounded-md hover:bg-hover flex items-center justify-center text-muted hover:text-heading cursor-pointer shrink-0"
                        aria-label="Ouvrir l'agenda"
                      >
                        <MoreHorizontal className="w-4 h-4" strokeWidth={1.6} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Projets récents */}
            <section className="bg-panel border border-line rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[13px] font-semibold text-heading">Projets récents</h2>
                  <p className="text-[11px] text-muted">Suivi d&apos;avancement des prestations studio</p>
                </div>
                <Link
                  to="/admin/clients/projects"
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Tout voir
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.6} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line text-[11px] font-medium text-muted">
                      <th className="pb-2 pr-4">Projet</th>
                      <th className="pb-2 px-3">Séance</th>
                      <th className="pb-2 px-3">Statut</th>
                      <th className="pb-2 pl-3 text-right">Progression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {recentProjects.map((proj: any) => {
                      const meta = PROJECT_STATUS_META[proj.status] || PROJECT_STATUS_META.planning;
                      const dateInfo = formatDateParts(proj.event_date || proj.created_at);
                      const pct = proj.progress ?? meta.progress;
                      return (
                        <tr
                          key={proj.id}
                          onClick={() => navigate('/admin/clients/projects')}
                          className="hover:bg-hover/50 transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-7 h-7 rounded-md border border-line bg-canvas flex items-center justify-center text-[11px] font-medium text-heading shrink-0">
                                {proj.name.slice(0, 2).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <div className="text-[13px] font-medium text-heading truncate">{proj.name}</div>
                                <div className="text-[11px] text-muted truncate">{proj.client || 'Client studio'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted whitespace-nowrap">{dateInfo.short}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-2.5 pl-3">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                                <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[11px] tabular-nums text-muted w-7 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Colonne droite (4/12) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Statut des projets (Donut SVG) */}
            <section className="bg-panel border border-line rounded-xl p-4 shadow-2xs space-y-3">
              <div>
                <h2 className="text-[13px] font-semibold text-heading">Statut des projets</h2>
                <p className="text-[11px] text-muted">{projectsCount} projet(s) actifs</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <ProjectStatusDonut total={projectsCount} segments={donutSegments} />
                <ul className="flex-1 space-y-2">
                  {donutSegments.map((seg) => (
                    <li key={seg.label} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 text-body">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        {seg.label}
                      </span>
                      <span className="font-medium tabular-nums text-heading">{seg.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Activité récente */}
            <section className="bg-panel border border-line rounded-xl p-4 shadow-2xs space-y-3">
              <div>
                <h2 className="text-[13px] font-semibold text-heading">Activité récente</h2>
                <p className="text-[11px] text-muted">Dernières mises à jour du studio</p>
              </div>
              <ul className="space-y-2.5">
                {liveActivity.map((act: any) => (
                  <li key={act.id} className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-full border border-line bg-canvas flex items-center justify-center text-muted shrink-0 mt-0.5">
                      {act.tone === 'emerald' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.6} />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.6} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-heading truncate">{act.title}</p>
                      <p className="text-[11px] text-muted truncate">{act.detail}</p>
                      <p className="text-[10px] text-muted/80 mt-0.5">{act.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Mini calendrier mensuel */}
            <section className="bg-panel border border-line rounded-xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[13px] font-semibold text-heading capitalize">{calendarGrid.title}</h2>
                  <p className="text-[11px] text-muted">Calendrier studio</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                    }
                    className="w-6 h-6 rounded-md border border-line hover:bg-hover flex items-center justify-center text-muted hover:text-heading cursor-pointer"
                    aria-label="Mois précédent"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                    }
                    className="w-6 h-6 rounded-md border border-line hover:bg-hover flex items-center justify-center text-muted hover:text-heading cursor-pointer"
                    aria-label="Mois suivant"
                  >
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.6} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted pt-1">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarGrid.cells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`h-7 flex items-center justify-center rounded-md text-[11px] tabular-nums ${
                      cell.day === null
                        ? ''
                        : cell.isToday
                        ? 'bg-amber-600 text-white font-medium'
                        : 'text-body hover:bg-hover cursor-pointer'
                    }`}
                    onClick={() => cell.day && navigate('/admin/agenda')}
                  >
                    {cell.day ?? ''}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FotoDeskDashboard;
