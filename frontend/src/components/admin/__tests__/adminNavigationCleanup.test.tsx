/**
 * The admin navigation cleanup.
 *
 * Six surfaces stopped being top-level sidebar entries — Archives, Messages,
 * PicTransfer, Workflows, Users and System health — and moved into sections
 * or into Settings. Three things are easy to break here and all three are
 * invisible until someone hits them:
 *
 *  1. an entry reappearing at the top level, undoing the cleanup;
 *  2. a section entry showing when the section has nothing inside it (or
 *     hiding when it has), which strands a role on an empty page;
 *  3. a moved URL losing its redirect, which 404s bookmarks and links in
 *     already-sent email.
 */
import React from 'react';
import { render, renderHook, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Labels resolve to their key so assertions read as keys. Keyword lookups ask
// for an array, so they get one: a fixture here, with the real bundle checked
// separately below — otherwise this file would pass with en.json emptied.
const KEYWORD_FIXTURE: Record<string, string[]> = {
  'settings.keywords.email': ['smtp', 'imap', 'mail server'],
  'settings.keywords.branding': ['logo', 'identity', 'brand'],
};
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { returnObjects?: boolean }) =>
      (opts?.returnObjects ? (KEYWORD_FIXTURE[key] ?? []) : key),
    i18n: { language: 'fr', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

let granted = new Set<string>();
let flags: Record<string, boolean> = {};

vi.mock('../../../contexts/PermissionsContext', () => ({
  usePermissions: () => ({
    hasPermission: (p: string) => granted.has(p),
    hasAnyPermission: (perms: string[]) => perms.some((p) => granted.has(p)),
    isLoading: false,
  }),
}));
vi.mock('../../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ flags }),
}));
vi.mock('../../../contexts/AdminDarkModeContext', () => ({
  useAdminDarkMode: () => ({ isDark: false }),
}));
let isAnyDirty = false;
const confirmLeave = vi.fn(async () => true);
vi.mock('../../../contexts/UnsavedChangesContext', async () => {
  const { useNavigate } = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    useLeaveGuard: () => ({ confirmLeave, isAnyDirty }),
    // Same contract as the real hook, routed through the mocks above.
    useGuardedLinkClick: () => {
      const navigate = useNavigate();
      return (e: { preventDefault: () => void }, href: string, opts: { replace?: boolean; after?: () => void } = {}) => {
        if (!isAnyDirty) { opts.after?.(); return; }
        e.preventDefault();
        void confirmLeave().then((ok) => { if (ok) { opts.after?.(); navigate(href, { replace: !!opts.replace }); } });
      };
    },
  };
});
vi.mock('../../../hooks/usePublicSettings', () => ({
  usePublicSettings: () => ({ data: undefined }),
}));
vi.mock('../../../services/settings.service', () => ({
  settingsService: { getStorageInfo: vi.fn().mockResolvedValue({ total_used: 0, storage_limit: 100 }), formatBytes: () => '0 B' },
}));
vi.mock('../VersionInfo', () => ({ VersionInfo: () => null }));

import { AdminSidebar } from '../AdminSidebar';
import { AutomationLayout } from '../AutomationLayout';
import { useAdminSearchIndex } from '../adminSearchIndex';

/** Every permission the sidebar and its section hooks ever ask about. */
const ALL_PERMISSIONS = [
  'events.view', 'archives.view', 'email.view', 'workflows.view', 'analytics.view',
  'settings.view', 'users.view', 'customers.view', 'newsletters.view', 'accounting.view',
  'quotes.view', 'contracts.view', 'bills.view', 'backup.view',
];

function renderSidebar(path: string, { collapsed = false } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AdminSidebar isOpen onClose={() => {}} collapsed={collapsed} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => { cleanup(); granted = new Set(); flags = {}; isAnyDirty = false; confirmLeave.mockClear(); });

describe('admin sidebar — what is top level', () => {
  it('uses the validated FotoDesk navigation and keeps technical pages out of the main menu', () => {
    granted = new Set(ALL_PERMISSIONS);
    // Everything on, so nothing can be absent merely for being switched off.
    flags = {
      messaging: true, transfers: true, workflows: true, reminderEmails: true,
      analytics: true, userManagement: true, accounting: true, clients: true,
      projects: true, customerPortal: true, calendar: true, quotes: true,
      contracts: true, bills: true,
    };
    renderSidebar('/admin/dashboard');

    for (const key of [
      'navigation.transfers',
      'navigation.workflows', 'navigation.users', 'navigation.systemHealth',
    ]) {
      expect(screen.queryByText(key)).not.toBeInTheDocument();
    }

    for (const groupKey of [
      'navigation.groups.workspace',
      'navigation.groups.galleries',
      'navigation.groups.business',
    ]) {
      expect(screen.getByText(groupKey)).toBeInTheDocument();
    }

    for (const key of [
      'navigation.dashboard',
      'navigation.clients',
      'navigation.projects',
      'navigation.calendar',
      'navigation.photoGalleries',
      'navigation.videoGalleries',
      'navigation.quotes',
      'navigation.contracts',
      'navigation.invoices',
      'navigation.payments',
      'navigation.landingPageBuilder',
      'navigation.affiliate',
      'navigation.subscription',
      'navigation.teamMembers',
      'navigation.settings',
    ]) {
      expect(screen.getByText(key)).toBeInTheDocument();
    }
  });

  it('hides Galleries when the role cannot view events', () => {
    granted = new Set(['settings.view']);
    renderSidebar('/admin/dashboard');

    expect(screen.queryByText('navigation.photoGalleries')).not.toBeInTheDocument();
    expect(screen.queryByText('navigation.videoGalleries')).not.toBeInTheDocument();
  });
});

describe('promoted team members navigation', () => {
  it('marks Team Members active without also marking Settings active', () => {
    granted = new Set(['users.view', 'settings.view']);
    renderSidebar('/admin/settings?tab=users');

    expect(screen.getByText('navigation.teamMembers').closest('a'))
      .toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('navigation.settings').closest('a'))
      .not.toHaveAttribute('aria-current', 'page');
  });
});

describe('an empty section says which kind of empty it is', () => {
  const renderAutomation = () => render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/admin/automation/workflows']}>
        <AutomationLayout />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  it('offers the feature toggle when the flags are off', () => {
    granted = new Set(ALL_PERMISSIONS);
    flags = { workflows: false, reminderEmails: false };
    renderAutomation();
    expect(screen.getByText('automation.empty.title')).toBeInTheDocument();
  });

  it('does not tell a role to enable features that are already on', () => {
    // Reached by a bookmark to the old /admin/workflows path. Pointing this
    // admin at Settings > Features is advice they cannot act on: the features
    // are on, and they are not permitted to open the pages.
    granted = new Set(['events.view']); // neither workflows.view nor email.view
    flags = { workflows: true, reminderEmails: false };
    renderAutomation();
    expect(screen.getByText('automation.empty.noAccessTitle')).toBeInTheDocument();
    expect(screen.queryByText('automation.empty.title')).not.toBeInTheDocument();
  });
});

describe('the brand row is the home link', () => {
  const brandLink = () => screen.getAllByRole('link').find((a) => a.getAttribute('title') === 'navigation.dashboard')!;

  it('links the brand mark to the dashboard', () => {
    renderSidebar('/admin/analytics');
    expect(brandLink()).toHaveAttribute('href', '/admin/dashboard');
    expect(within(brandLink()).getByRole('img', { name: 'FotoDesk Logo' })).toBeInTheDocument();
  });

  it('shows a named icon on the collapsed rail instead of an empty link', () => {
    // Without a sidebar logo the collapsed desktop rail hides the wordmark,
    // so the link needs something to show and to be announced by.
    renderSidebar('/admin/analytics', { collapsed: true });
    expect(within(brandLink()).getByRole('img', { name: 'FotoDesk Logo' })).toBeInTheDocument();
  });
});

describe('admin sidebar — sections', () => {
  it('separates Quotes, Contracts and Invoices and marks Invoices as current', () => {
    granted = new Set(ALL_PERMISSIONS);
    flags = { clients: true, quotes: true, contracts: true, bills: true };
    renderSidebar('/admin/factures');
    expect(screen.getByText('navigation.quotes')).toBeInTheDocument();
    expect(screen.getByText('navigation.contracts')).toBeInTheDocument();
    expect(screen.getByText('navigation.invoices').closest('a'))
      .toHaveAttribute('aria-current', 'page');
  });
});

describe('settings search', () => {
  it('filters the Settings section and finds a tab by keyword, not just by title', () => {
    granted = new Set(ALL_PERMISSIONS);
    renderSidebar('/admin/settings?tab=features');

    const box = screen.getByLabelText('settings.search.label');
    expect(screen.getByText('settings.branding.title')).toBeInTheDocument();

    // "identity" appears in no tab label — only in Branding's keywords.
    fireEvent.change(box, { target: { value: 'identity' } });
    expect(screen.getByText('settings.branding.title')).toBeInTheDocument();
    expect(screen.queryByText('settings.general.title')).not.toBeInTheDocument();

    fireEvent.change(box, { target: { value: 'zzzznope' } });
    expect(screen.getByText('settings.search.noResults')).toBeInTheDocument();
  });

  it('asks an unsaved form before Enter leaves the page', async () => {
    // Every other way out of the sidebar goes through the leave guard —
    // clicks via guardedClick, the palette via its own confirmLeave. Enter in
    // the filter was the one path that navigated straight past it, losing a
    // dirty settings form's edits without asking.
    granted = new Set(ALL_PERMISSIONS);
    isAnyDirty = true;
    renderSidebar('/admin/settings?tab=features');

    const box = screen.getByLabelText('settings.search.label');
    fireEvent.change(box, { target: { value: 'identity' } });
    fireEvent.keyDown(box, { key: 'Enter' });

    expect(confirmLeave).toHaveBeenCalled();
  });

  it('does not interrupt when nothing is dirty', () => {
    granted = new Set(ALL_PERMISSIONS);
    isAnyDirty = false;
    renderSidebar('/admin/settings?tab=features');

    const box = screen.getByLabelText('settings.search.label');
    fireEvent.change(box, { target: { value: 'identity' } });
    fireEvent.keyDown(box, { key: 'Enter' });

    expect(confirmLeave).not.toHaveBeenCalled();
  });

  it('ships the keyword bundle the search reads, in both authored locales', () => {
    // The test above runs on a fixture, so it would keep passing if the real
    // terms were dropped. en and de are the authored pair; the rest inherit
    // English through i18next's fallbackLng.
    const load = (loc: string) =>
      JSON.parse(readFileSync(resolve(__dirname, `../../../i18n/locales/${loc}.json`), 'utf8'))
        ?.settings?.keywords ?? {};
    const en = load('en');
    const de = load('de');

    expect(en.email).toContain('smtp');
    expect(de.cms).toContain('impressum');
    // Parity in both directions is what the maintainer checks.
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
  });
});

const app = readFileSync(resolve(__dirname, '../../../App.tsx'), 'utf8');

describe('a page that left Settings keeps a permission gate', () => {
  // Settings gates its tabs by permission and snaps away from one the role
  // cannot see, so a Settings-hosted page was gated by living there. A section
  // page has no such inheritance — the section opens as soon as ANY item in it
  // is permitted — so Reminder emails needs the gate stated explicitly.
  it('wraps reminder-templates in both a feature and a permission guard', () => {
    const block = app.slice(app.indexOf('path="reminder-templates"') - 400,
                            app.indexOf('path="reminder-templates"') + 120);
    expect(block).toMatch(/RequireFeature flag="reminderEmails"/);
    expect(block).toMatch(/RequirePermission permission="email\.view"/);
  });

  it('gates the workflow builder on workflows.view too', () => {
    // The same rule, applied to both siblings in the section rather than one:
    // `reminderEmails` alone opens Automation, so without this a role with
    // email.view and no workflows.view reaches the builder.
    const block = app.slice(app.indexOf('path="automation"'),
                            app.indexOf('path="reminder-templates"'));
    expect(block).toMatch(/RequirePermission permission="workflows\.view"/);
    expect(block).toMatch(/path="workflows"/);
    expect(block).toMatch(/path="approvals"/);
  });

  it('redirects rather than rendering when the permission is absent', () => {
    const guard = readFileSync(
      resolve(__dirname, '../RequirePermission.tsx'), 'utf8');
    // Acting before the first fetch would redirect every role on a refresh.
    expect(guard).toMatch(/if \(isLoading\) return null;/);
    expect(guard).toMatch(/<Navigate to=\{fallback\} replace \/>/);
  });
});

describe('the command palette cannot offer what the sidebar hides', () => {
  const indexAt = () => renderHook(() => useAdminSearchIndex(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  }).result.current.map((e) => e.href);

  it('leaves out Accounting pages for a role without accounting.view', () => {
    // Accounting's nav hook filters on flags ALONE — the section's permission
    // lives on the sidebar entry. Indexing its items directly walked around
    // that entry and offered Inbox and Tax report to a role that 403s on both.
    granted = new Set(['events.view', 'settings.view']);
    flags = { accounting: true, incomingInvoices: true, expenses: true, taxReport: true };
    const hrefs = indexAt();
    expect(hrefs.some((h) => h.startsWith('/admin/accounting'))).toBe(false);
  });

  it('includes them once the role holds it', () => {
    granted = new Set(['events.view', 'settings.view', 'accounting.view']);
    flags = { accounting: true, incomingInvoices: true, expenses: true, taxReport: true };
    expect(indexAt().some((h) => h.startsWith('/admin/accounting'))).toBe(true);
  });

  it('leaves out Gestion pages for a role holding none of their permissions', () => {
    // Same shape: projects/calendar/quotes/contracts/bills declare no
    // permission of their own in useClientsNavItems.
    granted = new Set(['settings.view']);
    flags = { clients: true, quotes: true, contracts: true, projects: true };
    expect(indexAt().some((h) => h.startsWith('/admin/clients'))).toBe(false);
  });
});

describe('moved URLs keep working', () => {
  // Source-level, deliberately: mounting the whole route tree to prove a
  // redirect exists costs more than it catches, and what actually regresses
  // is someone deleting the line.

  it.each([
    ['archives', '/admin/events/archives'],
    ['workflows', '/admin/automation/workflows'],
    ['workflows/approvals', '/admin/automation/approvals'],
    ['users', '/admin/settings?tab=users'],
    ['system-health', '/admin/settings?tab=health'],
  ])('/admin/%s redirects to %s', (from, to) => {
    const pattern = new RegExp(
      `path="${from.replace(/\//g, '\\/')}"\\s+element=\\{<Navigate to="${to.replace(/[?]/g, '\\?')}" replace \\/>\\}`,
    );
    expect(app).toMatch(pattern);
  });

  it('keeps the workflow editor deep link working with its id', () => {
    expect(app).toMatch(/path="workflows\/:id"\s+element=\{<RedirectWorkflowEditor \/>\}/);
    expect(app).toMatch(/\/admin\/automation\/workflows\/\$\{id\}/);
  });

  it('redirects the reminder-templates settings tab to its new home', () => {
    // Above SettingsPage, not inside it: inside, it lost a race with that
    // page's URL-sync effect, which rewrites an unknown ?tab= to the default.
    expect(app).toMatch(/function SettingsRoute\(\)/);
    expect(app).toMatch(/params\.get\('tab'\) === 'reminderTemplates'/);
    expect(app).toMatch(/<Navigate to="\/admin\/automation\/reminder-templates" replace \/>/);
    expect(app).toMatch(/path="settings" element=\{<SettingsRoute \/>\}/);
  });
});
