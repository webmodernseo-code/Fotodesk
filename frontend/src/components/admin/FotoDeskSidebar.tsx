import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Archive, BarChart3, Cloud, FolderOpen, HardDrive,
  House, Images, LockKeyhole, Mail, Palette, Tags,
  Users, X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import { FotoDeskLogo } from '../common/FotoDeskLogo';

interface FotoDeskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { label: 'Tableau de bord', href: '/admin/dashboard', icon: House, exact: true },
  { label: 'Portfolio', href: '/admin/portfolio', icon: Images },
  { label: 'Galeries', href: '/admin/events', icon: FolderOpen },
  { label: 'Archives', href: '/admin/events/archives', icon: Archive },
  { label: 'Facturation', href: '/admin/factures', icon: HardDrive },
  { label: 'Analytique', href: '/admin/analytics', icon: BarChart3 },
];

const settingsNavItems = [
  { label: 'Types d’événements', href: '/admin/settings?tab=eventTypes', icon: Tags, tab: 'eventTypes' },
  { label: 'Marque', href: '/admin/settings?tab=branding', icon: Palette, tab: 'branding' },
  { label: 'Paramètres e-mail', href: '/admin/settings?tab=email', icon: Mail, tab: 'email' },
  { label: 'Sécurité', href: '/admin/settings?tab=security', icon: LockKeyhole, tab: 'security' },
  { label: 'Équipe & Accès', href: '/admin/settings?tab=users', icon: Users, tab: 'users' },
];

export const FotoDeskSidebar: React.FC<FotoDeskSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch real storage stats from backend
  const { data: dashboardStats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminService.getDashboardStats(),
    staleTime: 30000,
  });

  const storageBytes = dashboardStats?.storageUsed ?? 0;
  const storageFormatted = storageBytes > 0 ? adminService.formatBytes(storageBytes) : '0 Bytes';
  const maxBytes = 118.57 * 1024 * 1024 * 1024;
  const usedPercent = Math.min(100, Math.round((storageBytes / maxBytes) * 100) || 0);

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab');

  const isMainActive = (href: string, exact?: boolean) => {
    if (exact || href === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/dashboard';
    }
    if (href === '/admin/events') {
      return location.pathname === '/admin/events' || (location.pathname.startsWith('/admin/events') && !location.pathname.includes('/archives'));
    }
    return location.pathname.startsWith(href);
  };

  const isSettingsActive = (tab: string) => {
    return location.pathname.includes('/settings') && currentTab === tab;
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fd-mobile-backdrop"
          onClick={onClose}
          aria-label="Fermer le menu"
        />
      )}
      <aside className={`fd-sidebar ${isOpen ? 'fd-sidebar--open' : ''}`}>
        <div className="fd-sidebar-logo">
          <div
            className="fd-logo cursor-pointer"
            onClick={() => {
              navigate('/admin/dashboard');
              onClose();
            }}
            aria-label="Accueil FotoDesk"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white shadow-sm"><FotoDeskLogo size={18} className="text-white" /></span>
            <span className="font-bold tracking-tight">FotoDesk</span>
          </div>
          <button
            type="button"
            className="fd-close-mobile fd-icon-button"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="fd-side-navigation" aria-label="Navigation principale">
          {mainNavItems.map(({ label, href, icon: Icon, exact }) => {
            const active = isMainActive(href, exact);
            return (
              <a
                className={`fd-nav-link ${active ? 'fd-nav-link--active' : ''}`}
                href={href}
                key={href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(href);
                  onClose();
                }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={19} strokeWidth={1.75} />
                <span>{label}</span>
              </a>
            );
          })}

          <div className="fd-nav-divider" />

          {settingsNavItems.map(({ label, href, icon: Icon, tab }) => {
            const active = isSettingsActive(tab);
            return (
              <a
                className={`fd-nav-link ${active ? 'fd-nav-link--active' : ''}`}
                href={href}
                key={href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(href);
                  onClose();
                }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={19} strokeWidth={1.75} />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>

        <div className="fd-sidebar-footer">
          <div className="fd-cloud-card">
            <Cloud size={23} strokeWidth={1.6} />
            <div>
              <div className="font-semibold text-heading">FotoDesk Cloud</div>
              <div className="fd-synced"><span className="fd-status-dot" /> Synchronisé</div>
              <span className="fd-muted-small">Tout est à jour</span>
            </div>
            <span className="fd-cloud-dot" />
          </div>
          <div className="fd-storage-card">
            <div className="fd-storage-head">
              <span>Stockage utilisé</span>
              <strong>{storageFormatted}</strong>
            </div>
            <div className="fd-meter">
              <i style={{ width: `${usedPercent}%` }} />
            </div>
            <span className="fd-muted-small">{usedPercent}% de la limite 118.57 GB</span>
          </div>
        </div>
      </aside>
    </>
  );
};
export default FotoDeskSidebar;
