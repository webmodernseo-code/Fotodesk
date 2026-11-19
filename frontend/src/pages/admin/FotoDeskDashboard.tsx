import React, { useId, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  MoreHorizontal,
  Plus,
  Receipt,
  UserPlus,
  Users,
  Video,
  CheckCircle2,
  CreditCard,
  Sparkles,
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
    path: 'M2 36 C16 32, 22 22, 34 25 C46 28, 52 14, 66 18 C78 21, 88 10, 102 6',
    stroke: '#8b5cf6',
  },
  amber: {
    path: 'M2 32 C16 34, 24 18, 36 22 C48 26, 58 28, 70 16 C82 6, 92 18, 102 12',
    stroke: '#f97316',
  },
  indigo: {
    path: 'M2 28 C14 18, 24 34, 38 26 C50 18, 60 12, 74 20 C86 26, 94 10, 102 14',
    stroke: '#6366f1',
  },
  emerald: {
    path: 'M2 36 C18 35, 28 28, 42 29 C54 30, 66 20, 78 14 C88 9, 96 6, 102 4',
    stroke: '#10b981',
  },
};

function MiniSparkline({ tone }: { tone: SparkTone }) {
  const gradId = useId();
  const { path, stroke } = SPARK_PATHS[tone];
  return (
    <svg className="w-24 h-10 shrink-0" viewBox="0 0 104 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L102 40 L2 40 Z`} fill={`url(#${gradId})`} />
      <path d={path} stroke={stroke} strokeWidth="2" strokeLinecap="round" />
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
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108" aria-hidden="true">
        <circle
          cx="54"
          cy="54"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-neutral-200 dark:text-neutral-800"
          strokeWidth="12"
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
                cx="54"
                cy="54"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={`${Math.max(0, dash - 2)} ${circumference}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
              />
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-heading leading-none">{total}</span>
        <span className="text-[11px] text-muted mt-0.5">Total</span>
      </div>
    </div>
  );
}

const PROJECT_STATUS_META: Record<string, { label: string; badgeClass: string; progress: number; color: string }> = {
  planning: {
    label: 'Planifié',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    progress: 25,
    color: '#f59e0b',
  },
  in_progress: {
    label: 'En cours',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    progress: 65,
    color: '#3b82f6',
  },
  editing: {
    label: 'Retouche',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60',
    progress: 82,
    color: '#8b5cf6',
  },
  review: {
    label: 'En révision',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    progress: 95,
    color: '#10b981',
  },
  completed: {
    label: 'Terminé',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    progress: 100,
    color: '#10b981',
  },
};

function formatDateParts(iso?: string | null) {
  if (!iso) return { day: '—', month: '—', short: 'À planifier' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: '—', month: '—', short: 'À planifier' };
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
  const short = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return { day, month, short };
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
    queryFn: () => adminService.getRecentActivity(5),
    staleTime: 30000,
    retry: 1,
  });

  const overview = overviewQuery.data;
  const studioLabel = overview?.studio?.name || propStudioName || 'votre studio';

  const firstName = useMemo(() => {
    const candidate =
      user?.first_name?.trim() ||
      user?.name?.trim()?.split(/\s+/)[0] ||
      user?.username?.trim() ||
      propEmail?.split('@')[0] ||
      user?.email?.split('@')[0];
    if (!candidate) return 'Photographe';
    const clean = candidate.split(/[._-]/)[0];
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Photographe';
  }, [user, propEmail]);

  const todayFormatted = useMemo(() => {
    const raw = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  // Mini calendar state
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const calendarGrid = useMemo(() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
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

  const customersCount = overview?.kpis?.customersCount ?? 0;
  const projectsCount = overview?.kpis?.projectsCount ?? 0;
  const upcomingAppointments = overview?.upcomingAppointments ?? [];
  const recentProjects = overview?.recentProjects ?? [];
  const invoicesSummary = overview?.kpis?.invoicesSummary;
  const pendingAmountMinor = Math.max(
    0,
    (invoicesSummary?.totalAmountMinor ?? 0) - (invoicesSummary?.paidAmountMinor ?? 0)
  );

  const projectsByStatus = overview?.kpis?.projectsByStatus ?? {};
  const donutSegments = [
    { label: 'Planifié', count: projectsByStatus.planning ?? 0, color: '#f59e0b' },
    { label: 'En cours', count: projectsByStatus.in_progress ?? 0, color: '#3b82f6' },
    { label: 'Retouche', count: projectsByStatus.editing ?? 0, color: '#8b5cf6' },
    { label: 'En révision', count: (projectsByStatus.review ?? 0) + (projectsByStatus.completed ?? 0), color: '#10b981' },
  ];

  const kpiCards = [
    {
      label: 'Total clients',
      value: overviewQuery.isLoading ? '—' : String(customersCount),
      sub: 'Portefeuille actif',
      tone: 'violet' as SparkTone,
      icon: Users,
    },
    {
      label: 'Projets actifs',
      value: overviewQuery.isLoading ? '—' : String(projectsCount),
      sub: `${projectsByStatus.in_progress ?? 0} en cours`,
      tone: 'amber' as SparkTone,
      icon: FolderKanban,
    },
    {
      label: 'Séances à venir',
      value: overviewQuery.isLoading ? '—' : String(upcomingAppointments.length),
      sub: '14 prochains jours',
      tone: 'indigo' as SparkTone,
      icon: CalendarDays,
    },
    {
      label: 'Paiements en attente',
      value: overviewQuery.isLoading ? '—' : formatEur(pendingAmountMinor),
      sub: `${invoicesSummary?.pendingCount ?? 0} facture(s)`,
      tone: 'emerald' as SparkTone,
      icon: CreditCard,
    },
  ];

  const quickActions = [
    { label: 'Ajouter un client', icon: UserPlus, to: '/admin/clients/accounts' },
    { label: 'Créer un projet', icon: FolderKanban, to: '/admin/clients/projects' },
    {
      label: 'Créer une galerie photo',
      icon: ImageIcon,
      onClick: () => (onCreateGallery ? onCreateGallery() : navigate('/admin/events/new')),
    },
    { label: 'Créer une galerie vidéo', icon: Video, to: '/admin/video-galleries' },
    { label: 'Créer une facture', icon: Receipt, to: '/admin/factures/new' },
  ];

  const recentActivity = Array.isArray(activityQuery.data) ? activityQuery.data.slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-canvas text-body">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* En-tête */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted">{todayFormatted}</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading mt-0.5">
              Bonjour, {firstName}
            </h1>
            <p className="text-sm text-muted mt-1">
              Voici l&apos;activité de {studioLabel} aujourd&apos;hui.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/clients/projects')}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nouveau projet
          </button>
        </header>

        {/* 4 Cartes KPI */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className="bg-panel border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted">{card.label}</span>
                  <span className="w-8 h-8 rounded-lg border border-line bg-canvas flex items-center justify-center text-muted">
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-heading">{card.value}</div>
                    <div className="text-xs text-muted mt-1">{card.sub}</div>
                  </div>
                  <MiniSparkline tone={card.tone} />
                </div>
              </article>
            );
          })}
        </section>

        {/* Actions rapides */}
        <section className="bg-panel border border-line rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-heading">Actions rapides</h2>
            <p className="text-xs text-muted">Démarrez vos flux de travail les plus fréquents.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {quickActions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  type="button"
                  onClick={() => (act.onClick ? act.onClick() : navigate(act.to!))}
                  className="flex items-center justify-between gap-2 h-11 px-3.5 rounded-xl border border-line bg-canvas hover:bg-hover text-left transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-muted shrink-0" />
                    <span className="text-xs font-medium text-heading truncate">{act.label}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Grille principale asymétrique */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Colonne gauche (8/12) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Séances à venir */}
            <section className="bg-panel border border-line rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-heading">Séances à venir</h2>
                  <p className="text-xs text-muted">Vos prochains rendez-vous planifiés</p>
                </div>
                <Link
                  to="/admin/agenda"
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Voir le calendrier
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-6 text-center">
                  <p className="text-sm font-medium text-heading">Aucune séance planifiée</p>
                  <p className="text-xs text-muted mt-1">
                    Ajoutez un rendez-vous dans votre agenda pour le voir apparaître ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingAppointments.map((appt) => {
                    const parts = formatDateParts(appt.appointment_date);
                    return (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas/50 p-3 hover:bg-hover/60 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl border border-line bg-panel flex flex-col items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-heading leading-none">{parts.day}</span>
                            <span className="text-[10px] font-medium text-muted uppercase mt-0.5">{parts.month}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-heading truncate">{appt.title}</p>
                            <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {appt.start_time || 'Journée'}
                                {appt.end_time ? ` – ${appt.end_time}` : ''}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/admin/agenda')}
                          className="w-8 h-8 rounded-lg hover:bg-panel flex items-center justify-center text-muted hover:text-heading cursor-pointer shrink-0"
                          aria-label="Ouvrir l'agenda"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Projets récents */}
            <section className="bg-panel border border-line rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-heading">Projets récents</h2>
                  <p className="text-xs text-muted">Suivi d&apos;avancement des prestations studio</p>
                </div>
                <Link
                  to="/admin/clients/projects"
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Tout voir
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-6 text-center">
                  <p className="text-sm font-medium text-heading">Aucun projet pour le moment</p>
                  <p className="text-xs text-muted mt-1">
                    Créez votre premier projet client pour suivre sa progression.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-line text-[11px] font-medium text-muted">
                        <th className="pb-2.5 pr-4">Projet</th>
                        <th className="pb-2.5 px-3">Date</th>
                        <th className="pb-2.5 px-3">Statut</th>
                        <th className="pb-2.5 pl-3 text-right">Progression</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {recentProjects.map((proj) => {
                        const meta = PROJECT_STATUS_META[proj.status] || PROJECT_STATUS_META.planning;
                        const dateInfo = formatDateParts(proj.event_date || proj.created_at);
                        return (
                          <tr
                            key={proj.id}
                            onClick={() => navigate(`/admin/clients/projects/${proj.id}`)}
                            className="hover:bg-hover/50 transition-colors cursor-pointer"
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-8 h-8 rounded-lg border border-line bg-canvas flex items-center justify-center text-xs font-semibold text-heading shrink-0">
                                  {proj.name.slice(0, 2).toUpperCase()}
                                </span>
                                <span className="text-sm font-medium text-heading truncate">{proj.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-xs text-muted whitespace-nowrap">{dateInfo.short}</td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                            </td>
                            <td className="py-3 pl-3">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-sky-500"
                                    style={{ width: `${meta.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-muted w-8 text-right">
                                  {meta.progress}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Colonne droite (4/12) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Statut des projets (Donut SVG) */}
            <section className="bg-panel border border-line rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-heading">Statut des projets</h2>
                <p className="text-xs text-muted">{projectsCount} projet(s) au total</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <ProjectStatusDonut total={projectsCount} segments={donutSegments} />
                <ul className="flex-1 space-y-2">
                  {donutSegments.map((seg) => (
                    <li key={seg.label} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 text-body">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        {seg.label}
                      </span>
                      <span className="font-semibold text-heading">{seg.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Activité récente */}
            <section className="bg-panel border border-line rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-heading">Activité récente</h2>
                <p className="text-xs text-muted">Dernières mises à jour du studio</p>
              </div>
              {recentActivity.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-4 text-center text-xs text-muted">
                  Aucune activité récente enregistrée.
                </div>
              ) : (
                <ul className="space-y-3">
                  {recentActivity.map((act: any, idx: number) => (
                    <li key={act.id || idx} className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-full border border-line bg-canvas flex items-center justify-center text-muted shrink-0 mt-0.5">
                        {idx % 2 === 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-heading truncate">
                          {act.description || act.action || 'Action studio'}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {act.createdAt
                            ? new Date(act.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Récent'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Mini calendrier mensuel */}
            <section className="bg-panel border border-line rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-heading capitalize">{calendarGrid.title}</h2>
                  <p className="text-xs text-muted">Calendrier studio</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                    }
                    className="w-7 h-7 rounded-lg border border-line hover:bg-hover flex items-center justify-center text-muted hover:text-heading cursor-pointer"
                    aria-label="Mois précédent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                    }
                    className="w-7 h-7 rounded-lg border border-line hover:bg-hover flex items-center justify-center text-muted hover:text-heading cursor-pointer"
                    aria-label="Mois suivant"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted pt-1">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarGrid.cells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`h-8 flex items-center justify-center rounded-lg text-xs ${
                      cell.day === null
                        ? ''
                        : cell.isToday
                        ? 'bg-amber-600 text-white font-semibold'
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
