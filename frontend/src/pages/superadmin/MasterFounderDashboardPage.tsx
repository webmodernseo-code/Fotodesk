import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Globe,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Percent,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { FotoDeskLogo } from '@/components/common/FotoDeskLogo';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/common/Table';
import { superAdminService, type SuperAdminOverview, type StudioItem } from '@/services/superAdmin.service';
import { affiliateService } from '@/services/affiliate.service';
import { REGIONS, detectRegion, type Region } from '@/lib/fotodesk-pricing';
import { useAdminAuth } from '@/contexts';
import { cn } from '@/lib/utils';

type AdminSection =
  | 'overview'
  | 'studios'
  | 'users'
  | 'subscriptions'
  | 'affiliates'
  | 'commissions'
  | 'payouts'
  | 'settings';

const REGION_CONFIG: Record<Region, { symbol: string; rateFromEur: number }> = {
  africa: { symbol: 'FCFA', rateFromEur: 655.957 },
  europe: { symbol: '€', rateFromEur: 1 },
  usa: { symbol: '$', rateFromEur: 1.08 },
};

function formatAmount(amountInEur: number, region: Region): string {
  if (amountInEur === 0) {
    if (region === 'africa') return '0 FCFA';
    if (region === 'europe') return '0 €';
    return '$0';
  }
  const cfg = REGION_CONFIG[region];
  const converted = amountInEur * cfg.rateFromEur;
  if (region === 'africa') {
    return `${Math.round(converted).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} FCFA`;
  }
  if (region === 'europe') {
    const formatted = converted.toLocaleString('fr-FR', {
      minimumFractionDigits: converted % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} €`;
  }
  const formatted = converted.toLocaleString('en-US', {
    minimumFractionDigits: converted % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'FD';
}

function formatDateLabel(value?: string, isEn?: boolean): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function MasterFounderDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();
  const { i18n } = useTranslation();
  const isEn = (i18n.language || '').toLowerCase().startsWith('en');

  const [data, setData] = useState<SuperAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>(() => detectRegion());
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [growthRange, setGrowthRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanModal, setSelectedPlanModal] = useState<StudioItem | null>(null);
  const [targetPlan, setTargetPlan] = useState<'starter' | 'pro' | 'studio' | 'free'>('pro');
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getOverview();
      setData(res);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error(
          isEn
            ? 'Session expired or unauthorized. Redirecting to login…'
            : 'Session expirée ou non autorisée. Redirection vers la connexion…',
        );
        navigate('/admin/login');
      } else {
        toast.error(
          isEn
            ? 'Error loading supervision overview'
            : 'Erreur lors du chargement des données de supervision',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast.success(isEn ? 'Partner link copied!' : 'Lien partenaire copié !');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleUpdateStudioPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanModal) return;
    setIsUpdatingPlan(true);
    try {
      await superAdminService.updateStudioPlan(selectedPlanModal.id, { planId: targetPlan });
      toast.success(
        isEn
          ? `Subscription for ${selectedPlanModal.name} updated to ${targetPlan.toUpperCase()}!`
          : `Abonnement du studio ${selectedPlanModal.name} mis à jour en plan ${targetPlan.toUpperCase()} !`,
      );
      setSelectedPlanModal(null);
      await fetchOverview();
    } catch {
      toast.error(isEn ? 'Error updating subscription plan' : 'Erreur lors de la mise à jour de l’abonnement');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleProcessPayout = async (requestId: number, action: 'payé' | 'rejeté') => {
    setProcessingId(requestId);
    try {
      await affiliateService.adminProcessPayoutRequest(requestId, action);
      toast.success(
        action === 'payé'
          ? isEn
            ? 'Payout marked as paid.'
            : 'Virement marqué comme payé.'
          : isEn
            ? 'Payout request rejected.'
            : 'Demande de virement rejetée.',
      );
      await fetchOverview();
    } catch {
      toast.error(isEn ? 'Unable to process payout request' : 'Impossible de traiter la demande de virement');
    } finally {
      setProcessingId(null);
    }
  };

  const studios = data?.studios || [];
  const affiliates = data?.affiliates || [];
  const referrals = data?.referrals || [];
  const payoutRequests = data?.payoutRequests || [];

  const filteredStudios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return studios.filter((studio) => {
      const matchesPlan = planFilter === 'all' || studio.planId === planFilter;
      if (!matchesPlan) return false;
      if (!q) return true;
      return (
        studio.name.toLowerCase().includes(q) ||
        (studio.ownerEmail || '').toLowerCase().includes(q) ||
        studio.planId.toLowerCase().includes(q)
      );
    });
  }, [studios, searchQuery, planFilter]);

  const filteredAffiliates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return affiliates;
    return affiliates.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.referralCode.toLowerCase().includes(q),
    );
  }, [affiliates, searchQuery]);

  const metrics = data?.metrics || {
    totalStudios: 0,
    payingStudios: 0,
    mrrEur: 0,
    totalAffiliates: 0,
    totalClicks: 0,
    affiliatePendingEur: 0,
    affiliateHarvestedEur: 0,
    pendingPayoutRequestsCount: 0,
  };

  const planCounts = useMemo(() => {
    const counts = { free: 0, starter: 0, pro: 0, studio: 0 };
    for (const s of studios) {
      if (s.planId === 'starter') counts.starter += 1;
      else if (s.planId === 'pro') counts.pro += 1;
      else if (s.planId === 'studio') counts.studio += 1;
      else counts.free += 1;
    }
    return counts;
  }, [studios]);

  const totalSubCount = Math.max(1, studios.length);

  const navGroups: {
    label: string;
    items: { id: AdminSection; label: string; icon: React.FC<{ size?: number; className?: string }>; badge?: number }[];
  }[] = [
    {
      label: isEn ? 'OVERVIEW' : 'VUE D’ENSEMBLE',
      items: [{ id: 'overview', label: isEn ? 'Dashboard' : 'Tableau de bord', icon: LayoutDashboard }],
    },
    {
      label: isEn ? 'PLATFORM MANAGEMENT' : 'GESTION PLATEFORME',
      items: [
        { id: 'studios', label: isEn ? 'Studios' : 'Studios', icon: Building2, badge: metrics.totalStudios || undefined },
        { id: 'users', label: isEn ? 'Users' : 'Utilisateurs', icon: Users },
      ],
    },
    {
      label: isEn ? 'BUSINESS MANAGEMENT' : 'GESTION BUSINESS',
      items: [
        { id: 'subscriptions', label: isEn ? 'Subscriptions' : 'Abonnements', icon: CreditCard },
        { id: 'affiliates', label: isEn ? 'Affiliates' : 'Affiliés', icon: Sparkles },
        { id: 'commissions', label: isEn ? 'Commissions' : 'Commissions', icon: Percent },
        {
          id: 'payouts',
          label: isEn ? 'Payouts' : 'Paiements',
          icon: Wallet,
          badge: metrics.pendingPayoutRequestsCount > 0 ? metrics.pendingPayoutRequestsCount : undefined,
        },
      ],
    },
    {
      label: isEn ? 'SYSTEM' : 'SYSTÈME',
      items: [{ id: 'settings', label: isEn ? 'Platform Settings' : 'Paramètres', icon: Settings }],
    },
  ];

  const sectionMeta: Record<AdminSection, { title: string; subtitle: string; crumb: string }> = {
    overview: {
      title: isEn ? 'Platform Overview' : 'Vue d’ensemble de la plateforme',
      subtitle: isEn
        ? 'Monitor and manage your FotoDesk platform from one place.'
        : 'Pilotez et supervisez votre plateforme FotoDesk depuis un seul espace.',
      crumb: isEn ? 'Dashboard' : 'Tableau de bord',
    },
    studios: {
      title: isEn ? 'Studio Management' : 'Gestion des Studios',
      subtitle: isEn
        ? 'Inspect registered photography studios, storage quotas, and plans.'
        : 'Consultez les studios inscrits, leurs quotas de stockage et leurs formules.',
      crumb: 'Studios',
    },
    users: {
      title: isEn ? 'Platform Users' : 'Utilisateurs de la Plateforme',
      subtitle: isEn
        ? 'Studio owners and administrators across FotoDesk.'
        : 'Propriétaires de studios et administrateurs FotoDesk.',
      crumb: isEn ? 'Users' : 'Utilisateurs',
    },
    subscriptions: {
      title: isEn ? 'Subscription Management' : 'Gestion des Abonnements',
      subtitle: isEn
        ? 'Track active plans, recurring revenue, and tier distribution.'
        : 'Suivez les formules actives, le MRR et la répartition des abonnements.',
      crumb: isEn ? 'Subscriptions' : 'Abonnements',
    },
    affiliates: {
      title: isEn ? 'Affiliate Management' : 'Programme d’Affiliation',
      subtitle: isEn
        ? 'Manage partner accounts, referral codes, and conversion performance.'
        : 'Gérez les comptes partenaires, codes de parrainage et conversions.',
      crumb: isEn ? 'Affiliates' : 'Affiliés',
    },
    commissions: {
      title: isEn ? 'Commission Management' : 'Suivi des Commissions',
      subtitle: isEn
        ? 'Review referral commissions earned across partner studios.'
        : 'Consultez les commissions générées par vos partenaires affiliés.',
      crumb: 'Commissions',
    },
    payouts: {
      title: isEn ? 'Payout Management' : 'Gestion des Virements',
      subtitle: isEn
        ? 'Approve or reject pending affiliate withdrawal requests.'
        : 'Validez ou rejetez les demandes de versement des affiliés.',
      crumb: isEn ? 'Payouts' : 'Paiements',
    },
    settings: {
      title: isEn ? 'Platform Settings' : 'Paramètres Plateforme',
      subtitle: isEn
        ? 'Regional currency display, language preferences, and studio shortcuts.'
        : 'Devise d’affichage, langue et accès rapides.',
      crumb: isEn ? 'Platform Settings' : 'Paramètres',
    },
  };

  const displayName = user?.username || 'Alex Morgan';
  const displayInitials = getInitials(displayName);

  if (loading && !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas font-sans text-heading">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-md">
            <FotoDeskLogo size={26} className="text-white animate-pulse" />
          </span>
          <p className="text-sm font-medium text-muted">
            {isEn ? 'Loading FotoDesk Super Admin…' : 'Chargement du Super Admin FotoDesk…'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-heading font-sans flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Fermer la navigation"
        />
      )}

      {/* SIDEBAR (Figma 63:199429 · 260px) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] shrink-0 bg-subtle border-r border-line flex flex-col transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand Header */}
        <div className="h-[74px] px-5 flex items-center justify-between border-b border-line bg-panel">
          <Link to="/superadmin" className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <FotoDeskLogo size={20} className="text-white" />
            </span>
            <div className="leading-tight">
              <p className="text-[15px] font-bold tracking-tight text-heading">FotoDesk</p>
              <p className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">Super Admin</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-muted hover:bg-hover"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6" aria-label="Super Admin navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-bold tracking-[0.08em] text-faint uppercase">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] transition-all text-left cursor-pointer border',
                      active
                        ? 'bg-brand-soft text-brand border-brand-line font-semibold shadow-2xs'
                        : 'border-transparent text-soft hover:bg-panel hover:text-heading font-medium',
                    )}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon size={17} className={active ? 'text-brand shrink-0' : 'text-faint shrink-0'} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[11px] font-semibold',
                          active ? 'bg-brand text-white' : 'bg-fill text-soft',
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom User Card */}
        <div className="p-3.5 border-t border-line bg-panel">
          <div className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cta text-cta-fg text-xs font-bold">
                {displayInitials}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-heading truncate">{displayName}</p>
                <p className="text-[11px] text-muted truncate">Founder / Super Admin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-faint hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
              title={isEn ? 'Log out' : 'Déconnexion'}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN COLUMN */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TOPBAR (Figma 63:199431 · 74px) */}
        <header className="sticky top-0 z-30 h-[74px] bg-panel border-b border-line px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-line bg-subtle text-heading"
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span>Super Admin</span>
                <span>/</span>
                <span className="font-semibold text-heading">{sectionMeta[activeSection].crumb}</span>
              </div>
              <p className="text-sm font-semibold text-heading truncate">{sectionMeta[activeSection].title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Box */}
            <div className="hidden md:flex items-center gap-2 h-[38px] w-[280px] rounded-xl border border-line bg-subtle px-3 focus-within:border-brand transition-colors">
              <Search size={15} className="text-faint shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search studios, users, plans…' : 'Rechercher studios, plans…'}
                className="w-full bg-transparent text-xs text-heading placeholder:text-faint focus:outline-none"
              />
              <kbd className="rounded-md border border-line bg-panel px-1.5 py-0.5 text-[10px] font-medium text-muted">
                ⌘ K
              </kbd>
            </div>

            <LanguageToggle size="sm" />

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setActiveSection('payouts')}
              className="relative h-[38px] w-[38px] inline-flex items-center justify-center rounded-xl border border-line bg-panel text-soft hover:bg-hover transition-colors cursor-pointer"
              title={isEn ? 'Pending payouts' : 'Demandes en attente'}
            >
              <Bell size={16} />
              {metrics.pendingPayoutRequestsCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand" />
              )}
            </button>

            {/* Studio Space Link */}
            <Link
              to="/admin/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 h-[38px] px-3 rounded-xl border border-line bg-panel hover:bg-hover text-xs font-semibold text-heading transition-colors"
            >
              <HelpCircle size={15} className="text-brand" />
              <span>{isEn ? 'Studio App' : 'Espace Studio'}</span>
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 px-4 sm:px-8 py-7 max-w-[1220px] w-full mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-heading">
                {sectionMeta[activeSection].title}
              </h1>
              <p className="text-sm text-muted mt-1">{sectionMeta[activeSection].subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Currency / Region Selector */}
              <div className="inline-flex items-center rounded-xl border border-line bg-panel p-1">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRegion(r.id)}
                    className={cn(
                      'h-7 rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer',
                      region === r.id ? 'bg-cta text-cta-fg font-semibold' : 'text-muted hover:text-heading',
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchOverview}
                leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
                className="border-line bg-panel text-heading hover:bg-hover"
              >
                {isEn ? 'Refresh' : 'Actualiser'}
              </Button>
            </div>
          </div>

          {/* OVERVIEW SECTION (Figma 63:199429) */}
          {activeSection === 'overview' && (
            <>
              {/* 6 KPI Cards (3x2 grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard
                  icon={<Building2 size={18} />}
                  iconTone="brand"
                  trend="+8.2%"
                  label={isEn ? 'Total Studios' : 'Total Studios'}
                  value={String(metrics.totalStudios)}
                  helper={isEn ? 'Total registered photography studios.' : 'Studios photo enregistrés sur la plateforme.'}
                  onClick={() => setActiveSection('studios')}
                />
                <KpiCard
                  icon={<Users size={18} />}
                  iconTone="info"
                  trend="+12.4%"
                  label={isEn ? 'Paying Studios' : 'Studios Payants'}
                  value={String(metrics.payingStudios)}
                  helper={isEn ? 'Studios on active paid subscriptions.' : 'Studios avec un abonnement actif.'}
                  onClick={() => setActiveSection('users')}
                />
                <KpiCard
                  icon={<CreditCard size={18} />}
                  iconTone="purple"
                  trend="+5.1%"
                  label={isEn ? 'Active Subscriptions' : 'Abonnements Actifs'}
                  value={String(planCounts.starter + planCounts.pro + planCounts.studio)}
                  helper={isEn ? 'Currently active paid plans.' : 'Formules payantes en cours.'}
                  onClick={() => setActiveSection('subscriptions')}
                />
                <KpiCard
                  icon={<TrendingUp size={18} />}
                  iconTone="success"
                  trend="+6.8%"
                  label={isEn ? 'Monthly Recurring Revenue' : 'Revenu Mensuel Récurrent'}
                  value={formatAmount(metrics.mrrEur, region)}
                  helper={isEn ? 'Estimated recurring subscription revenue.' : 'Revenu récurrent mensuel estimé.'}
                  onClick={() => setActiveSection('subscriptions')}
                />
                <KpiCard
                  icon={<Sparkles size={18} />}
                  iconTone="success"
                  label={isEn ? 'Total Affiliates' : 'Total Affiliés'}
                  value={String(metrics.totalAffiliates)}
                  helper={isEn ? `${metrics.totalClicks} referral clicks tracked.` : `${metrics.totalClicks} clics partenaires enregistrés.`}
                  onClick={() => setActiveSection('affiliates')}
                />
                <KpiCard
                  icon={<Wallet size={18} />}
                  iconTone="warning"
                  label={isEn ? 'Pending Payouts' : 'Virements en Attente'}
                  value={formatAmount(metrics.affiliatePendingEur, region)}
                  helper={
                    isEn
                      ? `${metrics.pendingPayoutRequestsCount} request(s) awaiting review.`
                      : `${metrics.pendingPayoutRequestsCount} demande(s) à valider.`
                  }
                  onClick={() => setActiveSection('payouts')}
                />
              </div>

              {/* Platform Growth (2-column: Studio Growth + Subscription Distribution) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-heading">
                      {isEn ? 'Platform Growth' : 'Croissance de la Plateforme'}
                    </h2>
                    <p className="text-xs text-muted">
                      {isEn ? 'Track the growth and activity of FotoDesk.' : 'Suivez la croissance et l’activité de FotoDesk.'}
                    </p>
                  </div>
                  <div className="inline-flex items-center rounded-xl border border-line bg-panel p-1 self-start">
                    {(['7d', '30d', '90d'] as const).map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setGrowthRange(range)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                          growthRange === range ? 'bg-subtle text-heading font-semibold' : 'text-muted hover:text-heading',
                        )}
                      >
                        {range === '7d' ? (isEn ? '7 Days' : '7 Jours') : range === '30d' ? (isEn ? '30 Days' : '30 Jours') : isEn ? '90 Days' : '90 Jours'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Studio Growth Line Card */}
                  <div className="lg:col-span-2 rounded-2xl border border-line bg-panel p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-heading">
                          {isEn ? 'Studio Growth' : 'Croissance des Studios'}
                        </h3>
                        <p className="text-xs text-muted">
                          {isEn ? 'New registrations and total studio growth' : 'Nouvelles inscriptions et croissance globale'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-brand" />
                          {isEn ? 'New studios' : 'Nouveaux'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-fill-strong" />
                          {isEn ? 'Total growth' : 'Total'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-heading">{metrics.totalStudios}</span>
                      <span className="text-xs text-muted">{isEn ? 'registered studios' : 'studios inscrits'}</span>
                      <span className="text-xs font-semibold text-success">+8.2%</span>
                    </div>
                    <svg viewBox="0 0 540 130" className="w-full h-[130px] overflow-visible" aria-hidden="true">
                      <line x1="0" y1="30" x2="540" y2="30" stroke="var(--ui-line)" strokeDasharray="3 3" />
                      <line x1="0" y1="65" x2="540" y2="65" stroke="var(--ui-line)" strokeDasharray="3 3" />
                      <line x1="0" y1="100" x2="540" y2="100" stroke="var(--ui-line)" strokeDasharray="3 3" />
                      <path
                        d="M 10 108 L 110 96 L 220 82 L 330 66 L 430 48 L 530 28"
                        fill="none"
                        stroke="var(--ui-fill-strong)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      <path
                        d="M 10 106 C 75 90, 120 92, 180 78 C 240 64, 290 68, 350 52 C 410 38, 470 42, 530 18"
                        fill="none"
                        stroke="var(--ui-brand)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="530" cy="18" r="4.5" fill="var(--ui-panel)" stroke="var(--ui-brand)" strokeWidth="2.5" />
                    </svg>
                  </div>

                  {/* Subscription Distribution Donut Card */}
                  <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-heading">
                          {isEn ? 'Subscription Distribution' : 'Répartition des Plans'}
                        </h3>
                        <p className="text-xs text-muted">
                          {isEn ? 'Studios by current plan' : 'Studios par formule'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('subscriptions')}
                        className="p-1.5 rounded-lg border border-line text-muted hover:text-heading hover:bg-hover cursor-pointer"
                        aria-label="Voir les abonnements"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 my-4">
                      <div className="relative h-28 w-28 shrink-0">
                        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                          <circle cx="50" cy="50" r="38" fill="none" stroke="var(--ui-fill)" strokeWidth="10" />
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="var(--ui-brand)"
                            strokeWidth="10"
                            strokeDasharray={`${Math.round((planCounts.pro / totalSubCount) * 238)} 238`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-lg font-bold text-heading">{studios.length}</span>
                          <span className="text-[10px] text-muted">Studios</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-soft">
                            <span className="h-2 w-2 rounded-full bg-fill-strong" /> Starter
                          </span>
                          <span className="font-semibold text-heading">{planCounts.starter}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-soft">
                            <span className="h-2 w-2 rounded-full bg-brand" /> Pro
                          </span>
                          <span className="font-semibold text-heading">{planCounts.pro}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-soft">
                            <span className="h-2 w-2 rounded-full bg-cta" /> Studio
                          </span>
                          <span className="font-semibold text-heading">{planCounts.studio}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-soft">
                            <span className="h-2 w-2 rounded-full bg-info" /> Free
                          </span>
                          <span className="font-semibold text-heading">{planCounts.free}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Overview Card */}
              <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-heading">
                      {isEn ? 'Subscription Overview' : 'Aperçu des Abonnements'}
                    </h2>
                    <p className="text-xs text-muted">
                      {isEn
                        ? 'A clear view of studios across approved FotoDesk plans.'
                        : 'Vue détaillée des studios sur chaque formule FotoDesk.'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSection('subscriptions')}
                    rightIcon={<ArrowRight size={14} />}
                    className="border-line bg-panel text-heading hover:bg-hover self-start"
                  >
                    {isEn ? 'View All Subscriptions' : 'Voir tous les abonnements'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'starter', name: 'Starter', price: 9, count: planCounts.starter, barColor: 'bg-fill-strong' },
                    { key: 'pro', name: 'Pro', price: 19, count: planCounts.pro, barColor: 'bg-brand' },
                    { key: 'studio', name: 'Studio', price: 39, count: planCounts.studio, barColor: 'bg-cta' },
                  ].map((tier) => {
                    const pct = Math.round((tier.count / totalSubCount) * 100);
                    return (
                      <div key={tier.key} className="rounded-xl border border-line bg-subtle p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-heading">{tier.name}</p>
                            <p className="text-xs text-muted">
                              {formatAmount(tier.price, region)} / {isEn ? 'month' : 'mois'}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-muted">{pct}%</span>
                        </div>
                        <p className="text-xl font-bold text-heading">
                          {tier.count}{' '}
                          <span className="text-xs font-normal text-muted">Studios</span>
                        </p>
                        <div className="h-1.5 w-full rounded-full bg-fill overflow-hidden">
                          <div className={cn('h-full rounded-full', tier.barColor)} style={{ width: `${Math.max(4, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Studio Registrations Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-heading">
                      {isEn ? 'Recent Studio Registrations' : 'Inscriptions Récentes de Studios'}
                    </h2>
                    <p className="text-xs text-muted">
                      {isEn ? 'The latest studios joining the FotoDesk platform.' : 'Les derniers studios ayant rejoint FotoDesk.'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSection('studios')}
                    rightIcon={<ArrowRight size={14} />}
                    className="border-line bg-panel text-heading hover:bg-hover self-start"
                  >
                    {isEn ? 'View All Studios' : 'Voir tous les studios'}
                  </Button>
                </div>

                <StudioTable
                  studios={filteredStudios.slice(0, 6)}
                  region={region}
                  isEn={isEn}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  planFilter={planFilter}
                  onPlanFilterChange={setPlanFilter}
                  onManagePlan={(studio) => {
                    setSelectedPlanModal(studio);
                    setTargetPlan((studio.planId as any) || 'pro');
                  }}
                />
              </div>

              {/* Recent Activity + Platform Alerts (2-column) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-2xl border border-line bg-panel p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-heading">
                        {isEn ? 'Recent Platform Activity' : 'Activité Récente'}
                      </h2>
                      <p className="text-xs text-muted">
                        {isEn ? 'A summary of recent partner referrals and signups.' : 'Résumé des derniers parrainages et inscriptions.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('commissions')}
                      className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isEn ? 'See all' : 'Tout voir'} <ChevronRight size={13} />
                    </button>
                  </div>

                  {referrals.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted">
                      {isEn ? 'No partner conversions recorded yet.' : 'Aucune conversion partenaire pour le moment.'}
                    </p>
                  ) : (
                    <div className="divide-y divide-line">
                      {referrals.slice(0, 5).map((ref) => {
                        const isPaid = ['récolté', 'payé'].includes((ref.status || '').toLowerCase());
                        return (
                          <div key={ref.id} className="py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                <Activity size={16} />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-heading truncate">
                                  {ref.referredName || (isEn ? 'Partner Studio' : 'Studio Partenaire')}
                                </p>
                                <p className="text-[11px] text-muted truncate">
                                  {ref.referredEmail || (isEn ? 'Referral conversion' : 'Conversion parrainage')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-heading">
                                {formatAmount(Number(ref.commissionAmount) || 0, region)}
                              </p>
                              <Badge tone={isPaid ? 'success' : 'warning'} dot className="mt-0.5">
                                {ref.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Platform Alerts */}
                <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm space-y-3">
                  <div>
                    <h2 className="text-base font-bold text-heading">
                      {isEn ? 'Platform Alerts' : 'Alertes Plateforme'}
                    </h2>
                    <p className="text-xs text-muted">
                      {isEn ? 'Items that may need your attention.' : 'Éléments nécessitant votre attention.'}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveSection('payouts')}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-line bg-subtle p-3 hover:bg-hover transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-bg text-warning">
                          <Wallet size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-heading">
                            {isEn ? 'Pending Payouts' : 'Virements en attente'}
                          </p>
                          <p className="text-[11px] text-muted truncate">
                            {isEn ? 'Payouts awaiting review' : 'Demandes à valider'}
                          </p>
                        </div>
                      </div>
                      <Badge tone={metrics.pendingPayoutRequestsCount > 0 ? 'warning' : 'neutral'}>
                        {metrics.pendingPayoutRequestsCount}
                      </Badge>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('studios')}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-line bg-subtle p-3 hover:bg-hover transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <Building2 size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-heading">
                            {isEn ? 'Active Studios' : 'Studios Actifs'}
                          </p>
                          <p className="text-[11px] text-muted truncate">
                            {isEn ? 'Manage plans & quotas' : 'Gérer formules & quotas'}
                          </p>
                        </div>
                      </div>
                      <Badge tone="brand">{metrics.totalStudios}</Badge>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('affiliates')}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-line bg-subtle p-3 hover:bg-hover transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-bg text-purple">
                          <AlertTriangle size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-heading">
                            {isEn ? 'Affiliate Network' : 'Réseau Affiliés'}
                          </p>
                          <p className="text-[11px] text-muted truncate">
                            {isEn ? 'Active partners' : 'Partenaires actifs'}
                          </p>
                        </div>
                      </div>
                      <Badge tone="purple">{metrics.totalAffiliates}</Badge>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Access */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-bold text-heading">
                    {isEn ? 'Quick Access' : 'Accès Rapides'}
                  </h2>
                  <p className="text-xs text-muted">
                    {isEn ? 'Jump to frequently used platform areas.' : 'Accédez rapidement aux sections principales.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { id: 'studios' as AdminSection, label: isEn ? 'Manage Studios' : 'Gérer Studios', icon: Building2, tone: 'bg-brand-soft text-brand' },
                    { id: 'users' as AdminSection, label: isEn ? 'Manage Users' : 'Utilisateurs', icon: Users, tone: 'bg-info-bg text-info' },
                    { id: 'subscriptions' as AdminSection, label: isEn ? 'Subscriptions' : 'Abonnements', icon: CreditCard, tone: 'bg-purple-bg text-purple' },
                    { id: 'affiliates' as AdminSection, label: isEn ? 'Affiliates' : 'Affiliés', icon: Sparkles, tone: 'bg-success-bg text-success' },
                    { id: 'commissions' as AdminSection, label: isEn ? 'Commissions' : 'Commissions', icon: Percent, tone: 'bg-purple-bg text-purple' },
                    { id: 'payouts' as AdminSection, label: isEn ? 'View Payouts' : 'Virements', icon: Wallet, tone: 'bg-warning-bg text-warning' },
                  ].map((qa) => {
                    const Icon = qa.icon;
                    return (
                      <button
                        key={qa.id}
                        type="button"
                        onClick={() => setActiveSection(qa.id)}
                        className="rounded-2xl border border-line bg-panel p-4 shadow-sm hover:shadow-md hover:border-line-strong transition-all text-left flex flex-col justify-between gap-4 cursor-pointer"
                      >
                        <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl', qa.tone)}>
                          <Icon size={17} />
                        </span>
                        <span className="flex items-center justify-between gap-1 text-xs font-semibold text-heading">
                          <span>{qa.label}</span>
                          <ArrowRight size={13} className="text-faint shrink-0" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* STUDIOS / USERS / SUBSCRIPTIONS SECTIONS */}
          {(activeSection === 'studios' || activeSection === 'users' || activeSection === 'subscriptions') && (
            <StudioTable
              studios={filteredStudios}
              region={region}
              isEn={isEn}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              planFilter={planFilter}
              onPlanFilterChange={setPlanFilter}
              onManagePlan={(studio) => {
                setSelectedPlanModal(studio);
                setTargetPlan((studio.planId as any) || 'pro');
              }}
            />
          )}

          {/* AFFILIATES SECTION */}
          {activeSection === 'affiliates' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isEn ? 'Search affiliates by name, email or code…' : 'Rechercher un affilié par nom, e-mail ou code…'}
                    className="input pl-9"
                  />
                </div>
              </div>

              <TableFrame className="shadow-sm">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>{isEn ? 'Affiliate' : 'Affilié'}</TableHeaderCell>
                      <TableHeaderCell>{isEn ? 'Referral Code' : 'Code Partenaire'}</TableHeaderCell>
                      <TableHeaderCell>{isEn ? 'Clicks / Signups' : 'Clics / Inscrits'}</TableHeaderCell>
                      <TableHeaderCell>{isEn ? 'Earned' : 'Gains'}</TableHeaderCell>
                      <TableHeaderCell>{isEn ? 'Status' : 'Statut'}</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAffiliates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted">
                          {isEn ? 'No affiliates found.' : 'Aucun affilié trouvé.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAffiliates.map((aff) => (
                        <TableRow key={aff.id}>
                          <TableCell>
                            <p className="font-semibold text-heading">{aff.displayName}</p>
                            <p className="text-xs text-muted">{aff.email}</p>
                          </TableCell>
                          <TableCell>
                            <div className="inline-flex items-center gap-2">
                              <code className="rounded-lg bg-subtle border border-line px-2 py-1 text-xs font-mono text-heading">
                                {aff.referralCode}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(aff.referralCode)}
                                className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-heading cursor-pointer"
                                title={isEn ? 'Copy referral link' : 'Copier le lien'}
                              >
                                {copiedCode === aff.referralCode ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-heading">{aff.clicksCount || 0}</span>
                            <span className="text-muted"> / {aff.signupsCount || 0}</span>
                          </TableCell>
                          <TableCell className="font-semibold text-heading">
                            {formatAmount(Number(aff.totalEarnedEur) || 0, region)}
                          </TableCell>
                          <TableCell>
                            <Badge tone={aff.isActive ? 'success' : 'danger'} dot>
                              {aff.isActive ? (isEn ? 'Active' : 'Actif') : isEn ? 'Suspended' : 'Suspendu'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableFrame>
            </div>
          )}

          {/* COMMISSIONS SECTION */}
          {activeSection === 'commissions' && (
            <TableFrame className="shadow-sm">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{isEn ? 'Referred Studio' : 'Studio Parrainé'}</TableHeaderCell>
                    <TableHeaderCell>{isEn ? 'Commission' : 'Commission'}</TableHeaderCell>
                    <TableHeaderCell>{isEn ? 'Status' : 'Statut'}</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {referrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted">
                        {isEn ? 'No commissions recorded yet.' : 'Aucune commission enregistrée.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    referrals.map((ref) => {
                      const isPaid = ['récolté', 'payé'].includes((ref.status || '').toLowerCase());
                      return (
                        <TableRow key={ref.id}>
                          <TableCell>
                            <p className="font-semibold text-heading">{ref.referredName || 'Studio'}</p>
                            <p className="text-xs text-muted">{ref.referredEmail || '—'}</p>
                          </TableCell>
                          <TableCell className="font-semibold text-heading">
                            {formatAmount(Number(ref.commissionAmount) || 0, region)}
                          </TableCell>
                          <TableCell>
                            <Badge tone={isPaid ? 'success' : 'warning'} dot>
                              {ref.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableFrame>
          )}

          {/* PAYOUTS SECTION */}
          {activeSection === 'payouts' && (
            <TableFrame className="shadow-sm">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{isEn ? 'Affiliate' : 'Affilié'}</TableHeaderCell>
                    <TableHeaderCell>{isEn ? 'Amount' : 'Montant'}</TableHeaderCell>
                    <TableHeaderCell>{isEn ? 'Method' : 'Méthode'}</TableHeaderCell>
                    <TableHeaderCell>{isEn ? 'Requested' : 'Date'}</TableHeaderCell>
                    <TableHeaderCell>{isEn ? 'Status' : 'Statut'}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{isEn ? 'Actions' : 'Actions'}</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoutRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted">
                        {isEn ? 'No payout requests yet.' : 'Aucune demande de virement pour le moment.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    payoutRequests.map((req) => {
                      const isPending = req.status === 'en_attente';
                      const isPaid = req.status === 'payé';
                      return (
                        <TableRow key={req.id}>
                          <TableCell>
                            <p className="font-semibold text-heading">
                              {req.affiliateName || `#${req.affiliate_id}`}
                            </p>
                            <p className="text-xs text-muted">{req.affiliateEmail || '—'}</p>
                          </TableCell>
                          <TableCell className="font-semibold text-heading">
                            {formatAmount(Number(req.amount) || 0, region)}
                          </TableCell>
                          <TableCell className="text-xs text-soft">
                            {req.payoutMethod || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted">
                            {formatDateLabel(req.requested_at, isEn)}
                          </TableCell>
                          <TableCell>
                            <Badge tone={isPaid ? 'success' : isPending ? 'warning' : 'danger'} dot>
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isPending ? (
                              <div className="inline-flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="success"
                                  disabled={processingId === req.id}
                                  onClick={() => handleProcessPayout(req.id, 'payé')}
                                  leftIcon={<CheckCircle2 size={13} />}
                                >
                                  {isEn ? 'Approve' : 'Valider'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={processingId === req.id}
                                  onClick={() => handleProcessPayout(req.id, 'rejeté')}
                                  className="border-danger-line text-danger hover:bg-danger-bg"
                                >
                                  {isEn ? 'Reject' : 'Rejeter'}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-faint inline-flex items-center gap-1">
                                <Clock size={12} /> {isEn ? 'Processed' : 'Traité'}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableFrame>
          )}

          {/* SETTINGS SECTION */}
          {activeSection === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Globe size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-heading">
                      {isEn ? 'Localization & Currency' : 'Langue & Devise'}
                    </h3>
                    <p className="text-xs text-muted">
                      {isEn ? 'Configure how metrics are displayed.' : 'Configurez l’affichage des montants et de la langue.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <LanguageToggle size="sm" />
                  <div className="inline-flex items-center rounded-xl border border-line bg-subtle p-1">
                    {REGIONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRegion(r.id)}
                        className={cn(
                          'h-7 rounded-lg px-3 text-xs font-medium cursor-pointer',
                          region === r.id ? 'bg-cta text-cta-fg font-semibold' : 'text-muted',
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-info-bg text-info">
                    <SlidersHorizontal size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-heading">
                      {isEn ? 'Studio Workspace' : 'Espace Studio'}
                    </h3>
                    <p className="text-xs text-muted">
                      {isEn ? 'Switch to your photography studio dashboard.' : 'Basculer vers votre interface studio.'}
                    </p>
                  </div>
                </div>
                <Link to="/admin/dashboard">
                  <Button variant="brand" size="sm" rightIcon={<ArrowRight size={14} />}>
                    {isEn ? 'Open Studio Dashboard' : 'Ouvrir le Tableau de bord Studio'}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PLAN UPDATE MODAL */}
      {selectedPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-heading">
                  {isEn ? 'Update Studio Plan' : 'Modifier la formule du studio'}
                </h3>
                <p className="text-xs text-muted mt-0.5">{selectedPlanModal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanModal(null)}
                className="p-1.5 rounded-lg text-muted hover:bg-hover cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateStudioPlan} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                {(['free', 'starter', 'pro', 'studio'] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setTargetPlan(plan)}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-all cursor-pointer',
                      targetPlan === plan
                        ? 'border-brand bg-brand-soft text-brand font-semibold'
                        : 'border-line bg-subtle text-body hover:border-line-strong',
                    )}
                  >
                    <p className="text-xs uppercase font-bold">{plan}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {plan === 'free'
                        ? isEn
                          ? 'Free'
                          : 'Gratuit'
                        : `${formatAmount(plan === 'starter' ? 9 : plan === 'pro' ? 19 : 39, region)}/mo`}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPlanModal(null)}>
                  {isEn ? 'Cancel' : 'Annuler'}
                </Button>
                <Button type="submit" variant="brand" size="sm" isLoading={isUpdatingPlan}>
                  {isEn ? 'Save Plan' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  iconTone: 'brand' | 'info' | 'purple' | 'success' | 'warning';
  trend?: string;
  label: string;
  value: string;
  helper: string;
  onClick?: () => void;
}

const kpiToneClasses: Record<KpiCardProps['iconTone'], string> = {
  brand: 'bg-brand-soft text-brand',
  info: 'bg-info-bg text-info',
  purple: 'bg-purple-bg text-purple',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
};

function KpiCard({ icon, iconTone, trend, label, value, helper, onClick }: KpiCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-line bg-panel p-5 shadow-sm hover:shadow-md hover:border-line-strong transition-all text-left cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl', kpiToneClasses[iconTone])}>
          {icon}
        </span>
        {trend && (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-success">
            <ArrowUpRight size={13} />
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-heading mt-1">{value}</p>
      <p className="text-[11px] text-faint mt-2">{helper}</p>
    </button>
  );
}

interface StudioTableProps {
  studios: StudioItem[];
  region: Region;
  isEn: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  planFilter: string;
  onPlanFilterChange: (val: string) => void;
  onManagePlan: (studio: StudioItem) => void;
}

function StudioTable({
  studios,
  region,
  isEn,
  searchQuery,
  onSearchChange,
  planFilter,
  onPlanFilterChange,
  onManagePlan,
}: StudioTableProps) {
  return (
    <div className="rounded-2xl border border-line bg-panel shadow-sm overflow-hidden">
      <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isEn ? 'Search studios…' : 'Rechercher un studio…'}
            className="input h-9 pl-9 text-xs"
          />
        </div>
        <div className="relative">
          <select
            value={planFilter}
            onChange={(e) => onPlanFilterChange(e.target.value)}
            className="input h-9 pr-8 text-xs font-medium appearance-none cursor-pointer"
            aria-label={isEn ? 'Filter by plan' : 'Filtrer par formule'}
          >
            <option value="all">{isEn ? 'All plans' : 'Toutes les formules'}</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="studio">Studio</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <TableFrame className="border-0 rounded-none">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{isEn ? 'STUDIO NAME' : 'STUDIO'}</TableHeaderCell>
              <TableHeaderCell>{isEn ? 'OWNER' : 'PROPRIÉTAIRE'}</TableHeaderCell>
              <TableHeaderCell>{isEn ? 'SUBSCRIPTION' : 'ABONNEMENT'}</TableHeaderCell>
              <TableHeaderCell>{isEn ? 'REGISTRATION DATE' : 'INSCRIPTION'}</TableHeaderCell>
              <TableHeaderCell>{isEn ? 'STATUS' : 'STATUT'}</TableHeaderCell>
              <TableHeaderCell className="text-right">{isEn ? 'ACTION' : 'ACTION'}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {studios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted">
                  {isEn ? 'No studios match your search.' : 'Aucun studio ne correspond à votre recherche.'}
                </TableCell>
              </TableRow>
            ) : (
              studios.map((studio) => {
                const planTone =
                  studio.planId === 'pro'
                    ? 'brand'
                    : studio.planId === 'studio'
                      ? 'purple'
                      : 'neutral';
                const statusTone =
                  studio.planStatus === 'active'
                    ? 'success'
                    : studio.planStatus === 'trial'
                      ? 'warning'
                      : 'danger';
                return (
                  <TableRow key={studio.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-inset text-xs font-bold text-heading">
                          {getInitials(studio.name)}
                        </span>
                        <span className="font-semibold text-heading">{studio.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-body">{studio.ownerEmail || '—'}</p>
                      <p className="text-[11px] text-muted">{studio.storageLimitGb} GB</p>
                    </TableCell>
                    <TableCell>
                      <Badge tone={planTone}>
                        {studio.planId.toUpperCase()} · {formatAmount(studio.monthlyPrice || 0, region)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted">
                      {formatDateLabel(studio.createdAt, isEn)}
                    </TableCell>
                    <TableCell>
                      <Badge tone={statusTone} dot>
                        {studio.planStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => onManagePlan(studio)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-heading hover:text-brand transition-colors cursor-pointer"
                      >
                        <span>{isEn ? 'Manage Plan' : 'Gérer le plan'}</span>
                        <ArrowRight size={13} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableFrame>
    </div>
  );
}
