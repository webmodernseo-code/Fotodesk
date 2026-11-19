/** Keeps the Settings preview aligned with the compact F-C sidebar. */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string, fallback?: unknown) => (
      typeof fallback === 'string' ? fallback : key
    ) }),
  };
});

import { SidebarPreview } from '../components/SidebarPreview';
import { DEFAULT_FLAGS, type FeatureFlags } from '../../../contexts/FeatureFlagsContext';

const staged = (overrides: Partial<FeatureFlags>): FeatureFlags =>
  ({ ...DEFAULT_FLAGS, ...overrides }) as FeatureFlags;

describe('SidebarPreview feature gates (QA J.14)', () => {
  it('always lists the unconditional compact-navigation entries', () => {
    render(<SidebarPreview staged={staged({ clients: false, projects: false, calendar: false, quotes: false, contracts: false, bills: false })} />);

    expect(screen.getByText('navigation.dashboard')).toBeInTheDocument();
    expect(screen.getByText('navigation.photoGalleries')).toBeInTheDocument();
    expect(screen.getByText('navigation.videoGalleries')).toBeInTheDocument();
    expect(screen.getByText('navigation.payments')).toBeInTheDocument();
    expect(screen.getByText('navigation.landingPageBuilder')).toBeInTheDocument();
    expect(screen.getByText('navigation.affiliate')).toBeInTheDocument();
    expect(screen.getByText('navigation.subscription')).toBeInTheDocument();
    expect(screen.getByText('navigation.teamMembers')).toBeInTheDocument();
    expect(screen.getByText('navigation.settings')).toBeInTheDocument();
  });

  it.each([
    ['clients', 'navigation.clients'],
    ['projects', 'navigation.projects'],
    ['calendar', 'navigation.calendar'],
    ['quotes', 'navigation.quotes'],
    ['contracts', 'navigation.contracts'],
    ['bills', 'navigation.invoices'],
  ] as const)(
    'shows %s entry (%s) only when its feature flag is enabled',
    (flag, key) => {
      const { unmount } = render(<SidebarPreview staged={staged({ [flag]: false })} />);
      expect(screen.queryByText(key)).not.toBeInTheDocument();
      unmount();

      render(<SidebarPreview staged={staged({ [flag]: true })} />);
      expect(screen.getByText(key)).toBeInTheDocument();
    },
  );
});
