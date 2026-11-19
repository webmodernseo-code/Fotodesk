import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGuardedLinkClick, useLeaveGuard } from '../../contexts/UnsavedChangesContext';
import {
  Home,
  ArrowLeft,
  Settings,
  X,
  Landmark,
  Workflow,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  CalendarDays,
  Search,
  Images,
  Video,
  Cloud,
  Users,
  FolderKanban,
  FileText,
  ScrollText,
  CreditCard,
  LayoutTemplate,
  Share2,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { settingsService } from '../../services/settings.service';
import { FotoDeskLogo } from '../common/FotoDeskLogo';
import { LanguageToggle } from '../common/LanguageToggle';
import { DashboardHomeLink } from './DashboardHomeLink';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useAdminDarkMode } from '../../contexts/AdminDarkModeContext';
import { useFeatureFlags, type FeatureKey } from '../../contexts/FeatureFlagsContext';
import { usePublicSettings } from '../../hooks/usePublicSettings';
import { buildResourceUrl } from '../../utils/url';
import {
  DEFAULT_SETTINGS_TAB,
  SETTINGS_PATH,
  type SettingsTab,
  isValidSettingsTab,
  searchScore,
  settingsTabHref,
  useSettingsNavGroups,
} from '../../features/settings/settingsNav';
import { useAccountingNavItems } from './AccountingLayout';
import { useAutomationNavItems } from './AutomationLayout';

const PROMOTED_SETTINGS_TABS = new Set<SettingsTab>(['eventTypes', 'email', 'users', 'backup']);
// A section that takes over the sidebar while the admin is inside it:
// the main menu is replaced by the section's own navigation, with a
// "Back to menu" row and the section title pinned on top.
interface SidebarSectionItem {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  /** Navigate with history.replace (tab switches inside one page). */
  replace?: boolean;
  /** Extra search terms, so the Settings filter finds a tab by what it does. */
  keywords?: string[];
}
interface SidebarSectionGroup {
  /** Omitted for sections with a single, unlabelled list. */
  label?: string;
  items: SidebarSectionItem[];
}
interface SidebarSection {
  key: string;
  /**
   * Route prefixes that activate the section, and the first of them is where
   * the main-menu entry points by default. Usually one, but Sharing spans
   * /admin/events and /admin/transfers: a section is a grouping of pages, and
   * pages it groups need not share a URL prefix.
   */
  paths: string[];
  title: string;
  icon: LucideIcon;
  groups: SidebarSectionGroup[];
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Desktop-only: collapse to icon-rail when true. Persisted by parent. */
  collapsed?: boolean;
  /** Desktop-only: toggle for the collapse button rendered in the title bar. */
  onToggleCollapse?: () => void;
}

interface NavItem {
  nameKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'workspace' | 'galleries' | 'business';
  permission?: string | false;
  /** Single required flag — entry hidden when this is false. */
  featureFlag?: FeatureKey;
  /**
   * "At least one of these must be on" — used by the Clients section
   * to hide the sidebar entry when the parent flag is on but no
   * child sub-feature is enabled. Empty arrays are treated as no
   * constraint.
   */
  featureFlagsAny?: FeatureKey[];
  /**
   * Alternative permissions, any ONE of which reveals the entry. For a
   * section whose sub-features are gated independently server-side — Clients
   * hosts both customer accounts and newsletters, and the backend supports a
   * role holding `newsletters.view` without `customers.view` (#1264).
   */
  permissionAny?: string[];
}

// Sidebar shape after the Settings reorg (#feature-flags-settings-reorg)
// and the navigation cleanup that followed it.
//
// Removed (now live as Settings tabs, with redirects from the old
// top-level paths so bookmarks keep working):
//   /admin/email, /admin/branding, /admin/event-types, /admin/backup,
//   /admin/cms, /admin/users, /admin/system-health.
//
// Folded into sections (same: redirects kept):
//   /admin/archives  → Events section
//   /admin/transfers → Sharing section (same URL, new home)
//   /admin/workflows → Automation section
//
// What is left is eight entries, of which four disappear entirely on an
// install with the matching features off.
//
// Feature-gated (only render when the corresponding feature flag is on):
//   Analytics  → flags.analytics
//   Messages   → flags.messaging
//   Automation → flags.workflows | flags.reminderEmails
// Exported so Settings → Features can render its "Sidebar preview" against
// the same declaration the real sidebar uses (it used to keep a second,
// hand-maintained array that only knew about 2 of the feature gates).
//
// Section entries (Sharing, Automation, Settings) carry their
// FLAGS here — the preview reads them and applies nothing else — but no
// permission fields. Their visibility is decided in the sidebar by asking the
// section's own nav hook whether it has anything to show, which cannot drift
// from what is inside the way a duplicated permission list can.
export const adminNavigation: NavItem[] = [
  // WORKSPACE
  { nameKey: 'navigation.dashboard', href: '/admin/dashboard', icon: Home, permission: false, group: 'workspace' },
  {
    nameKey: 'navigation.clients', href: '/admin/clients/accounts', icon: Users,
    featureFlag: 'clients', permissionAny: ['customers.view', 'newsletters.view'], group: 'workspace',
  },
  {
    nameKey: 'navigation.projects', href: '/admin/clients/projects', icon: FolderKanban,
    featureFlag: 'projects', permission: 'events.view', group: 'workspace',
  },
  {
    nameKey: 'navigation.calendar', href: '/admin/agenda', icon: CalendarDays,
    featureFlag: 'calendar', permission: 'customers.view', group: 'workspace',
  },
  // GALLERIES
  {
    nameKey: 'navigation.photoGalleries', href: '/admin/events', icon: Images,
    permission: 'events.view', group: 'galleries',
  },
  {
    nameKey: 'navigation.videoGalleries', href: '/admin/video-galleries', icon: Video,
    permission: 'events.view', group: 'galleries',
  },
  // BUSINESS
  {
    nameKey: 'navigation.quotes', href: '/admin/clients/quotes', icon: FileText,
    featureFlag: 'quotes', permission: 'quotes.view', group: 'business',
  },
  {
    nameKey: 'navigation.contracts', href: '/admin/clients/contracts', icon: ScrollText,
    featureFlag: 'contracts', permission: 'contracts.view', group: 'business',
  },
  {
    nameKey: 'navigation.invoices', href: '/admin/factures', icon: Receipt,
    featureFlag: 'bills', permission: 'bills.view', group: 'business',
  },
  {
    nameKey: 'navigation.payments', href: '/admin/billing', icon: CreditCard,
    permission: false, group: 'business',
  },
  {
    nameKey: 'navigation.landingPageBuilder', href: '/admin/portfolio', icon: LayoutTemplate,
    permission: 'events.view', group: 'business',
  },
  {
    nameKey: 'navigation.affiliate', href: '/admin/affiliates', icon: Share2,
    permission: false, group: 'business',
  },
  {
    nameKey: 'navigation.teamMembers', href: '/admin/settings?tab=users', icon: UserCog,
    permission: 'users.view', group: 'business',
  },
  { nameKey: 'navigation.settings', href: '/admin/settings', icon: Settings, group: 'business' },
];

/**
 * Does this main-menu entry pass its declared permission and feature gates?
 *
 * Exported because the command palette indexes the same menu and must not
 * offer a destination the sidebar hides. Section entries are NOT decided here
 * — their visibility follows the item count inside the section (see
 * `sectionItemCounts`), which is narrower and cannot drift.
 */
/**
 * Main-menu entries that open a section rather than a page.
 *
 * The sidebar decides these from the section's own contents and the command
 * palette indexes their sub-pages instead of the entry, so both need the same
 * list — and a section added to one but not the other would be indexed through
 * `navItemAllowed`, which returns true for everyone because a section entry
 * carries no permission of its own.
 */
export const SECTION_PATHS: readonly string[] = [
  SETTINGS_PATH,
  '/admin/automation',
  '/admin/accounting',
];

export function navItemAllowed(
  item: NavItem,
  hasPermission: (p: string) => boolean,
  flags: ReturnType<typeof useFeatureFlags>['flags'],
): boolean {
  if (item.permission && !hasPermission(item.permission as string)) return false;
  if (item.permissionAny?.length
    && !item.permissionAny.some((p) => hasPermission(p))) return false;
  if (item.featureFlag && !flags[item.featureFlag]) return false;
  // featureFlagsAny: entry is hidden when none of the listed
  // sub-flags are on, even if the parent flag IS on. Used by
  // the Clients section so the sidebar entry only appears when
  // there's at least one sub-feature it can link to.
  if (item.featureFlagsAny && item.featureFlagsAny.length > 0
      && !item.featureFlagsAny.some((k) => flags[k])) {
    return false;
  }
  return true;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose, collapsed = false, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmLeave, isAnyDirty } = useLeaveGuard();
  // A settings form with unsaved edits gets to say no before the sidebar
  // navigates away from it (UnsavedChangesProvider).
  const guardedLinkClick = useGuardedLinkClick();
  const guardedClick = (e: React.MouseEvent, href: string, replace: boolean | undefined, after: () => void) =>
    guardedLinkClick(e, href, { replace, after });
  const { t } = useTranslation();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const { flags } = useFeatureFlags();
  // Branding lookup for the "logo_position = sidepanel" mode — when
  // chosen, the logo replaces the "PicPeak Admin" text in the brand
  // row, and the favicon takes over in the collapsed icon rail.
  const { data: publicSettings } = usePublicSettings();
  const { isDark } = useAdminDarkMode();
  const logoInSidebar = publicSettings?.branding_logo_position === 'sidepanel';
  // Theme-aware logo with symmetric fallback (one logo serves both modes).
  const lightLogo = publicSettings?.branding_logo_url?.trim();
  const darkLogo = publicSettings?.branding_logo_url_dark?.trim();
  const rawLogoUrl = isDark ? (darkLogo || lightLogo) : (lightLogo || darkLogo);
  const rawFaviconUrl = publicSettings?.branding_favicon_url?.trim();
  const resolvedLogoUrl = rawLogoUrl
    ? (rawLogoUrl.startsWith('http') ? rawLogoUrl : buildResourceUrl(rawLogoUrl))
    : null;
  const resolvedFaviconUrl = rawFaviconUrl
    ? (rawFaviconUrl.startsWith('http') ? rawFaviconUrl : buildResourceUrl(rawFaviconUrl))
    : null;
  // In collapsed rail, prefer the favicon (it's already a square,
  // tight crop). Fall back to the logo when no favicon is set, then
  // to nothing — better an empty rail than a stretched logo.
  const sidebarBrandImageUrl = collapsed
    ? (resolvedFaviconUrl || resolvedLogoUrl)
    : (resolvedLogoUrl || resolvedFaviconUrl);
  const showLogoBrand = logoInSidebar && !!sidebarBrandImageUrl;
  const brandAlt = publicSettings?.branding_company_name?.trim() || t('admin.title');

  const settingsGroups = useSettingsNavGroups();
  const automationItems = useAutomationNavItems();

  // A section entry follows what is actually inside the section. Each of
  // these hooks already applies that section's flags AND permissions, so
  // asking it for a count is both the narrowest correct gate and the one
  // that cannot drift from the section's contents — the failure this
  // replaces is an entry that opens an empty section (or, worse, a page the
  // backend then 403s). Settings needs it because its tabs accept narrower
  // permissions than `settings.view`; the rest because their sub-pages are
  // independently flagged.
  //
  // `entry` is where the menu entry points. It is NOT always the section root:
  // /admin/events is the events list, which 403s for a role holding only
  // `archives.view` — and that role legitimately has the section, because
  // Archives is in it. Clients, Accounting, Communication and Automation each
  // redirect their root to the first reachable child; Events has no such root
  // to redirect, so the entry aims at the first item directly. Settings keeps
  // its own root, which snaps to a permitted tab by itself.
  const sectionState: Record<string, { count: number; entry?: string }> = {
    [SETTINGS_PATH]: { count: settingsGroups.length },
    '/admin/automation': { count: automationItems.length },
    // Clients and Accounting keep the declared permission/flag gating they
    // already had. Converting them to count-gating would be an improvement,
    // but it is a behaviour change to sections this PR does not otherwise
    // touch, so it stays out of this diff.
  };

  const filteredNavigation = adminNavigation.filter((item) => {
    const section = sectionState[item.href];
    if (section) return section.count > 0;
    return navItemAllowed(item, hasPermission, flags);
  });

  /** Where the main-menu entry for `href` should actually navigate. */
  const entryHref = (href: string) => sectionState[href]?.entry ?? href;

  // Sections take over the sidebar: while the admin is inside Settings,
  // CRM or Accounting the main menu is replaced by that section's
  // navigation, with a "Back to menu" row on top. `peekMain` lets the
  // admin flip back to the main menu without leaving the page; it resets
  // on every navigation so clicking the section entry again (or
  // deep-linking) lands in section mode.
  const [peekMain, setPeekMain] = useState(false);
  useEffect(() => { setPeekMain(false); }, [location.key]);

  const accountingItems = useAccountingNavItems();
  const urlTab = new URLSearchParams(location.search).get('tab');
  const activeSettingsTab = isValidSettingsTab(urlTab) ? urlTab : DEFAULT_SETTINGS_TAB;
  const isUnder = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  /**
   * Mark the matching item with the LONGEST path as active, not every item
   * whose path is a prefix of the URL. The Events section is the first one
   * where a sub-page lives under a sibling entry's path
   * (/admin/events/archives under /admin/events), and a plain prefix test
   * highlights Events and Archives at the same time. Longest-prefix-wins is
   * the general rule; it is a no-op for sections whose items don't nest.
   */
  const activeKeys = <T extends { key: string; to: string }>(items: T[]): Set<string> => {
    const matches = items.filter((i) => isUnder(i.to));
    if (matches.length === 0) return new Set();
    const longest = matches.reduce((a, b) => (b.to.length > a.to.length ? b : a));
    return new Set([longest.key]);
  };
  const activeAutomation = activeKeys(automationItems);

  const sections: SidebarSection[] = [
    {
      key: 'settings',
      paths: [SETTINGS_PATH],
      title: t('navigation.settings'),
      icon: Settings,
      groups: settingsGroups.map((g) => ({
        label: g.label,
        items: g.items
          .filter((i) => !PROMOTED_SETTINGS_TABS.has(i.key))
          .map((i) => ({
            key: i.key,
            href: settingsTabHref(i.key),
            label: i.label,
            icon: i.icon,
            active: activeSettingsTab === i.key,
            replace: true,
            keywords: i.keywords,
          })),
      })).filter((g) => g.items.length > 0),
    },
    {
      key: 'accounting',
      paths: ['/admin/accounting'],
      title: t('navigation.accounting'),
      icon: Landmark,
      groups: [{
        items: accountingItems.map((i) => ({
          key: i.key, href: i.to, label: i.label, icon: i.icon, active: isUnder(i.to),
        })),
      }],
    },
    {
      key: 'automation',
      paths: ['/admin/automation'],
      title: t('navigation.automation', 'Automation'),
      icon: Workflow,
      groups: [{
        items: automationItems.map((i) => ({
          key: i.key, href: i.to, label: i.label, icon: i.icon, active: activeAutomation.has(i.key),
        })),
      }],
    },
  ];
  const onPromotedSettingsTab =
    location.pathname === SETTINGS_PATH && PROMOTED_SETTINGS_TABS.has(activeSettingsTab);
  const activeSection = onPromotedSettingsTab
    ? null
    : sections.find((sec) => sec.paths.some(isUnder)) ?? null;
  const section = peekMain ? null : activeSection;

  // Settings is 30 tabs in 8 groups — long enough that scanning it is the
  // slow part. Only Settings gets the filter; every other section is short
  // enough to read at a glance, and a search box on a list of three would be
  // noise.
  const searchable = section?.key === 'settings' && !collapsed;
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  // Leaving the section (or collapsing to the rail) drops the filter, so
  // coming back never shows a mysteriously short list.
  useEffect(() => { if (!searchable) setQuery(''); }, [searchable]);

  const sectionGroups = useMemo(() => {
    if (!section) return [];
    if (!searchable || !query.trim()) return section.groups;
    return section.groups
      .map((g) => ({
        ...g,
        items: g.items
          .map((i) => ({ item: i, score: searchScore(query, i.label, i.keywords) }))
          .filter((r) => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((r) => r.item),
      }))
      .filter((g) => g.items.length > 0);
  }, [section, searchable, query]);

  const firstMatch = sectionGroups[0]?.items[0];

  // Desktop width: full nav (w-64) vs icon rail (w-16). Mobile is always
  // w-64 since the collapse affordance only applies on lg+ viewports.
  const widthClasses = collapsed ? 'w-64 lg:w-16' : 'w-64';

  // Reference states (pricing section): the selected item is the "selector
  // pill" (cta fill, semibold), idle items are quiet and gain a hairline-soft
  // fill on hover.
  // Reference active state pill (exact match to user screenshot): warm dark bronze gradient,
  // delicate warm border, crisp white outline icon and text, subtle inner specular highlight.
  const itemClass = (isActive: boolean) => `group flex items-center py-2.5 text-[14px] rounded-xl border border-transparent transition-all duration-200 select-none ${
    collapsed ? 'px-3 lg:px-0 lg:justify-center' : 'px-3.5'
  } ${
    isActive
      ? 'fd-active-nav-pill font-semibold shadow-xs'
      : 'font-medium text-slate-700 dark:text-neutral-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/75 hover:border-transparent dark:hover:bg-neutral-800/70 dark:hover:border-transparent hover:shadow-[0_4px_14px_rgba(15,23,42,0.09)]'
  }`;
  const iconClass = (isActive: boolean) => `fd-solid-nav-icon w-[18px] h-[18px] flex-shrink-0 ${
    collapsed ? 'mr-3 lg:mr-0' : 'mr-3'
  } ${
    isActive ? 'dark:text-white text-black' : 'text-slate-500 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white'
  }`;

  return (
    <div
      // Right edge drawn via box-shadow rather than `border-r` so the
      // brand row's `border-b` can extend to the sidebar's full width
      // and meet the header's `border-b` cleanly at the L-junction. A
      // 1px border-r would shrink the brand row's content by 1px and
      // leave a visible step in the horizontal divider where the
      // sidebar meets the main column. Shadow uses the same neutral
      // border colors so it looks identical to the previous border.
      className={`fixed inset-y-0 left-0 z-50 ${widthClasses} bg-white dark:bg-shell shadow-[1px_0_0_0_theme(colors.neutral.200)] dark:shadow-[1px_0_0_0_theme(colors.neutral.700)] transform transition-all duration-200 ease-in-out lg:relative lg:translate-x-0 lg:h-screen ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-screen lg:h-full">
        {/* Brand row: title on the left, mobile close (X) on the
            right. The desktop collapse toggle used to live here but
            was moved down next to the version / storage widgets so
            it sits in admins' muscle-memory zone for chrome controls.
            When collapsed on desktop the title hides and the row
            becomes an empty spacer (no rail-width fight). */}
        {/* The brand doubles as the home button: the link carries the
            row's padding so the whole row (minus the mobile close button)
            goes to the dashboard, asking first if a form is dirty. */}
        <div className="relative flex items-stretch h-16 border-b border-line flex-shrink-0">
          <DashboardHomeLink
            onNavigate={onClose}
            className={`flex flex-1 items-center gap-2 min-w-0 hover:bg-hover-soft transition-colors focus-visible:ring-inset ${
              collapsed ? 'lg:justify-center lg:px-2 px-6' : 'px-6'
            }`}
          >
            {showLogoBrand ? (
              <>
                {/* Logo brand variant — fed by Branding > Logo
                    Position = "Sidebar". On the collapsed rail, only
                    the favicon (or logo as fallback) is shown — sized
                    to fit the 64px-wide rail. Expanded shows the full
                    logo at the same h-8 the admin header uses for
                    visual continuity. */}
                <img
                  src={sidebarBrandImageUrl!}
                  alt={brandAlt}
                  className={collapsed ? 'h-8 w-8 object-contain lg:h-9 lg:w-9' : 'h-8 w-auto object-contain max-w-full'}
                />
                {/* On mobile the rail-narrow style only applies at
                    lg+, so when collapsed=true the mobile view still
                    has the regular w-64 width — show the company name
                    next to the logo so the brand row doesn't feel
                    empty there. */}
                {collapsed && (
                  <span className="text-xl font-bold text-heading lg:hidden truncate">
                    {brandAlt}
                  </span>
                )}
              </>
            ) : (
              <>
                {/* Default brand: the FotoDesk logo mark, in place of the
                    "Panneau d'administration" wordmark. One component serves the
                    expanded sidebar, the collapsed rail and the mobile sheet. */}
                <FotoDeskLogo
                  size={collapsed ? 30 : 36}
                  className="text-heading flex-shrink-0 transition-transform duration-200 hover:scale-105"
                />
              </>
            )}
          </DashboardHomeLink>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`group/collapse hidden lg:inline-flex absolute z-10 top-1/2 -translate-y-1/2 items-center justify-center w-9 h-9 rounded-xl border border-line-strong bg-gradient-to-br from-panel to-subtle text-soft shadow-[0_6px_18px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.55)] hover:text-heading hover:border-accent/50 hover:shadow-[0_8px_24px_rgba(15,23,42,0.2),0_0_0_3px_rgba(184,122,68,0.12)] hover:-translate-y-[55%] active:-translate-y-1/2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-shell transition-all duration-200 ${
                collapsed ? '-right-4' : 'right-3'
              }`}
              aria-label={collapsed ? t('admin.expandSidebar', 'Expand sidebar') : t('admin.collapseSidebar', 'Collapse sidebar')}
              title={collapsed ? t('admin.expandSidebar', 'Expand sidebar') : t('admin.collapseSidebar', 'Collapse sidebar')}
            >
              <span className="absolute inset-x-2 top-1 h-px rounded-full bg-white/60 dark:bg-white/15" aria-hidden="true" />
              {collapsed
                ? <PanelLeftOpen className="w-[18px] h-[18px] transition-transform duration-200 group-hover/collapse:translate-x-0.5" />
                : <PanelLeftClose className="w-[18px] h-[18px] transition-transform duration-200 group-hover/collapse:-translate-x-0.5" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="lg:hidden self-center mr-4 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-line bg-panel text-faint shadow-sm hover:text-heading hover:bg-hover active:scale-95 transition-all"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section mode: section title + back row pinned above the
            scrolling list so they stay reachable however long the list
            gets. The sidebar reads top-down as "brand → where am I →
            back → pages". The back row uses the item styles so it sits
            in the same type scale and icon column as the list. The
            brand row above stays the brand (logo or wordmark) in every
            mode — see issue 1712. On the collapsed rail the title hides
            and the active item identifies the section. */}
        {section && (
          <div className="flex-shrink-0 animate-panel-in-right">
            {/* One rule, under the back row: it marks the boundary between
                leaving the section and navigating inside it. The filter keeps
                no rule of its own — two hairlines inside four rows read as
                three separate things stacked above the list (c21ce2f5), and
                the filter belongs with the list it filters. */}
            <div className={`border-b border-line py-2 ${
              collapsed ? 'px-4 lg:px-2' : 'px-4'
            }`}>
              <div className={`flex items-center px-3 mt-1 mb-2 ${collapsed ? 'lg:hidden' : ''}`}>
                <section.icon className="w-5 h-5 mr-3 flex-shrink-0 text-body" />
                <span className="text-xl font-semibold text-heading truncate">{section.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setPeekMain(true)}
                title={collapsed ? t('admin.backToMenu', 'Back to menu') : undefined}
                className={`w-full text-left ${itemClass(false)}`}
              >
                <ArrowLeft className={iconClass(false)} />
                <span className={collapsed ? 'lg:hidden' : ''}>{t('admin.backToMenu', 'Back to menu')}</span>
              </button>
            </div>
            {searchable && (
              <div className="px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setQuery(''); return; }
                      // Enter goes to the best match, so a filter that has
                      // narrowed to one result doesn't still need the mouse.
                      // It leaves the page, so it owes the open form the same
                      // question every other route out of here asks — clicks
                      // go through guardedClick, the palette through its own
                      // confirmLeave, and this was the one path that did not.
                      if (e.key === 'Enter' && firstMatch) {
                        e.preventDefault();
                        const go = () => {
                          navigate(firstMatch.href, { replace: !!firstMatch.replace });
                          onClose();
                        };
                        if (!isAnyDirty) { go(); return; }
                        void confirmLeave().then((ok) => { if (ok) go(); });
                      }
                    }}
                    placeholder={t('settings.search.placeholder', 'Search settings…')}
                    aria-label={t('settings.search.label', 'Search settings')}
                    className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-subtle text-heading placeholder:text-muted border border-transparent focus:bg-panel focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation. Two panels share this slot: the main menu and the
            active section's navigation (see `section`). Re-keying the
            wrapper replays a short slide so the switch reads as a
            drill-down. */}
        <nav
          aria-label={section ? section.title : undefined}
          className={`flex-1 py-4 overflow-y-auto overflow-x-hidden min-h-0 ${
            collapsed ? 'px-4 lg:px-2' : 'px-4'
          }`}
        >
          {section ? (
            <div key={section.key} className="animate-panel-in-right">
              <div className={collapsed ? 'space-y-4 lg:space-y-2' : 'space-y-4'}>
                {sectionGroups.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted">
                    {t('settings.search.noResults', 'No settings match “{{query}}”.', { query })}
                  </p>
                )}
                {sectionGroups.map((group, groupIndex) => (
                  <div key={group.label ?? groupIndex}>
                    {group.label && (
                      <h3 className={`px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 ${
                        collapsed ? 'lg:hidden' : ''
                      }`}>
                        {group.label}
                      </h3>
                    )}
                    {/* Collapsed rail: the group label has no room, so a
                        hairline between groups keeps the icon column
                        readable. */}
                    {collapsed && groupIndex > 0 && (
                      <div className="hidden lg:block mx-2 mb-2 border-t border-line" />
                    )}
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = item.active;
                        // Link, not NavLink: NavLink decides "active" from the
                        // pathname alone, and every Settings item shares one
                        // pathname with a different ?tab=, so it would mark
                        // all of them aria-current="page". Active state is
                        // computed here and set explicitly.
                        return (
                          <Link
                            key={item.key}
                            to={item.href}
                            replace={item.replace}
                            onClick={(e) => guardedClick(e, item.href, item.replace, () => onClose())}
                            title={collapsed ? item.label : undefined}
                            aria-current={isActive ? 'page' : undefined}
                            className={itemClass(isActive)}
                          >
                            <item.icon className={iconClass(isActive)} />
                            <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div key="main" className={`space-y-1 ${peekMain ? 'animate-panel-in-left' : ''}`}>

              {filteredNavigation.map((item, index) => {
                const startsGroup = index === 0 || filteredNavigation[index - 1].group !== item.group;
                const groupLabel = item.group === 'workspace'
                  ? t('navigation.groups.workspace', 'Workspace')
                  : item.group === 'galleries'
                  ? t('navigation.groups.galleries', 'Galleries')
                  : t('navigation.groups.business', 'Business');
                const isActive =
                  item.href === '/admin/dashboard'
                    ? location.pathname === '/admin/dashboard'
                    : item.href === '/admin/settings?tab=users'
                    ? location.pathname === '/admin/settings' && activeSettingsTab === 'users'
                    : item.href === '/admin/settings'
                    ? location.pathname === '/admin/settings' && !PROMOTED_SETTINGS_TABS.has(activeSettingsTab)
                    : item.href === '/admin/events'
                    ? (location.pathname === '/admin/events' || location.pathname.startsWith('/admin/events/')) &&
                      !location.pathname.startsWith('/admin/events/archives')
                    : item.href === '/admin/portfolio'
                    ? location.pathname.startsWith('/admin/portfolio') || location.pathname.startsWith('/admin/landing-builder')
                    : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                const label = t(item.nameKey);

                return (
                  <React.Fragment key={item.nameKey}>
                    {startsGroup && (
                      <div className={index === 0 ? 'pb-1' : 'pt-4 pb-1'}>
                        <h3 className={`px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 ${
                          collapsed ? 'lg:hidden' : ''
                        }`}>{groupLabel}</h3>
                        {collapsed && index > 0 && <div className="hidden lg:block mx-2 border-t border-line" />}
                      </div>
                    )}
                    <Link
                    to={entryHref(item.href)}
                    onClick={(e) => guardedClick(e, entryHref(item.href), false, () => {
                      // Clicking the current section's entry while peeking
                      // at the main menu hands the sidebar back to section
                      // mode even if the URL doesn't change.
                      if (activeSection?.paths.includes(item.href)) setPeekMain(false);
                      onClose();
                    })}
                    title={collapsed ? label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={itemClass(isActive)}
                  >
                    {/* Selected item: solid accent-dark fill with white text/icon
                        for unambiguous high-contrast selection — matches the
                        .tile-selected pattern used in the customizer. The accent
                        -dark token defaults to the legacy primary green so users
                        who haven't set CI colours yet see no migration regression. */}
                    <item.icon className={iconClass(isActive)} />
                    <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
                    </Link>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </nav>

        {/* Desktop collapse / expand toggle.
            Lives directly above the version + storage widgets — sits
            in admins' muscle-memory zone for chrome controls and
            stays visible even when the sidebar is collapsed so the
            rail can always be re-expanded. Hidden on mobile (the X
            in the brand row already closes the sheet there). */}
        {/* Bottom section - sticky to bottom (only for users with settings.view permission).
            Hidden on desktop when collapsed since these widgets don't fit in the icon rail;
            mobile keeps them visible because mobile width is always w-64.

            #523 follow-up 2: render OPTIMISTICALLY while permissions are
            still hydrating from the auth context (Rekoo-PS's 3.60.3-beta.0
            screenshot showed the whole bottom block missing on first paint
            right after a deploy — `hasPermission` returns false during the
            ~hundreds-of-ms hydration window, the widgets vanish entirely,
            then re-appear). Only HIDE the block when we definitively know
            the user lacks the permission. VersionInfo + StorageInfo each
            have their own loading states so admins see "—" / a spinner
            instead of nothing during the actual data fetch. */}
        {/* Hidden in section mode: the section list needs the vertical
            space more than the version / storage widgets, which are one
            click away on the main menu. */}
        {!section && (permissionsLoading || hasPermission('settings.view')) && (
          <div className={`flex-shrink-0 ${collapsed ? 'lg:hidden' : ''}`}>
            {/* Language switcher with pure vector flags */}
            <div className="px-4 py-2 flex items-center justify-between border-t border-line">
              <span className="text-xs text-soft font-medium">{t('common.language', 'Langue')}</span>
              <LanguageToggle size="sm" />
            </div>

            {/* Compact Storage Info */}
            <StorageInfo />
          </div>
        )}
      </div>
    </div>
  );
};

const StorageInfo: React.FC = () => {
  const { data: storageInfo } = useQuery({
    queryKey: ['storage-info'],
    queryFn: () => settingsService.getStorageInfo(),
    refetchInterval: 60000 // Refresh every minute
  });

  const limitInUse = storageInfo?.storage_soft_limit || storageInfo?.storage_limit || 127316705280; // ~118.57 GB fallback
  const totalUsed = storageInfo?.total_used || 0;
  const usagePercent = limitInUse
    ? Math.round((totalUsed / limitInUse) * 100)
    : 0;
  const softLimitDisplay = settingsService.formatBytes(limitInUse);
  const usedDisplay = settingsService.formatBytes(totalUsed);

  return (
    <div className="px-4 py-2.5 border-t border-line">
      <div className="flex items-center justify-between gap-2 text-[11px] mb-1.5">
        <span className="flex items-center gap-1.5 font-medium text-heading truncate">
          <Cloud className="w-3.5 h-3.5 text-[#C89561] flex-shrink-0" />
          FotoDesk Cloud
        </span>
        <span className="text-muted font-medium whitespace-nowrap">
          {usedDisplay}{storageInfo?.storage_partial ? '+' : ''} / {softLimitDisplay}
        </span>
      </div>
      <div className="w-full bg-neutral-200/80 dark:bg-fill rounded-full h-1 overflow-hidden">
        <div
          className="bg-[#C89561] h-1 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(usagePercent, 0)}%` }}
        />
      </div>
    </div>
  );
};
