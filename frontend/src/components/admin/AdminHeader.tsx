import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Settings, Search, Bell, Lock, CheckCircle, Trash2, Sun, Moon, Globe, ChevronDown, Eye, Download, Heart, Calendar, Image, Archive, AlertCircle, Clock, Database, FileText, Folder, Key, Mail, Tag, ToggleRight, UserCog, Webhook } from 'lucide-react';

// getNotificationStyle returns an icon NAME — map the ones we render to
// components; anything unmapped keeps the Bell (codex review of #849:
// the styles existed but every row hard-coded <Bell>).
// Complete over getNotificationStyle's icon names (grep-verified) so every
// style renders its declared icon (codex review of #849 round 2).
const NOTIFICATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Bell, Eye, Download, Heart, Calendar, Image, Archive, AlertCircle, Clock, Lock,
  CheckCircle, Database, FileText, Folder, Globe, Key, LogOut, Mail, Settings,
  Tag, ToggleRight, Trash2, User, UserCog, Webhook,
};
import { useTranslation } from 'react-i18next';
import { DashboardHomeLink } from './DashboardHomeLink';
import { useLeaveGuard } from '../../contexts/UnsavedChangesContext';
import { useLocalizedDate } from '../../hooks/useLocalizedDate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAdminAuth } from '../../contexts';
import { useAdminDarkMode } from '../../contexts/AdminDarkModeContext';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { usePublicSettings } from '../../hooks/usePublicSettings';
import { useModal } from '../../hooks';
import { PasswordChangeModal } from './PasswordChangeModal';
import { SUPPORTED_LANGUAGES, LanguageToggle } from '../common';
import { notificationsService } from '../../services/notifications.service';
import { toast } from 'react-toastify';
import { buildResourceUrl } from '../../utils/url';
import { useHasVisibleSettings } from '../../features/settings/settingsNav';

interface AdminHeaderProps {
  onMenuClick: () => void;
  /** Opens the command palette; the keyboard shortcut is bound in AdminLayout. */
  onOpenSearch?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, onOpenSearch }) => {
  const navigate = useNavigate();
  // Mac shows the Command glyph, everything else spells out Ctrl. Read from
  // the platform string rather than the user agent: this only picks a label.
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
  // Same gate as the sidebar's Settings entry: any visible tab, not settings.view.
  const hasVisibleSettings = useHasVisibleSettings();
  const { confirmLeave } = useLeaveGuard();
  const { user, logout } = useAdminAuth();
  const { isDark, toggle: toggleDarkMode, forcedMode } = useAdminDarkMode();
  const { t, i18n } = useTranslation();
  const { formatDistanceToNow } = useLocalizedDate();
  const userMenuModal = useModal();
  const userMenuLangSectionModal = useModal();
  const notificationsModal = useModal();
  const passwordModal = useModal();
  const queryClient = useQueryClient();

  const { data: brandingSettings, isLoading: brandingLoading } = usePublicSettings();
  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  const companyName = brandingSettings?.branding_company_name?.trim() || 'FotoDesk';
  // Dark-mode logo variant. Symmetric fallback: if only one logo is set,
  // use it for both modes (dark → dark||light, light → light||dark).
  const lightLogo = brandingSettings?.branding_logo_url?.trim();
  const darkLogo = brandingSettings?.branding_logo_url_dark?.trim();
  const logoUrl = isDark ? (darkLogo || lightLogo) : (lightLogo || darkLogo);
  const logoDisplayMode = brandingSettings?.branding_logo_display_mode || 'logo_and_text';
  // Logo placement honours the same Branding > Logo Position setting
  // the gallery does. 'sidepanel' moves the logo into the AdminSidebar
  // brand row — suppress it here so it doesn't double up. left /
  // center / right reposition the logo block within this header bar.
  const logoPosition = brandingSettings?.branding_logo_position || 'left';
  const logoInSidebar = logoPosition === 'sidepanel';
  const resolvedLogoUrl = logoUrl
    ? (logoUrl.startsWith('http') ? logoUrl : buildResourceUrl(logoUrl))
    : '/logo.png';

  // #523 follow-up 2: graceful fallback when the configured logo URL
  // 404s or stalls. Without an error handler, the <img> failure draws
  // the browser's default broken-image-icon + alt text rendering — see
  // Rekoo-PS's 3.60.3-beta.0 screenshot where "Arkan Studio" appeared
  // as the alt text of a broken icon, not the real wordmark span. The
  // chain:
  //   1. configured URL fails → try the bundled fotodesk fallback
  //   2. bundled fallback fails → hide the image entirely, let the
  //      wordmark carry the brand
  // Reset on URL change so a dark-mode toggle (which can flip lightLogo
  // ↔ darkLogo) retries the new URL instead of being permanently sad.
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [fallbackLoadError, setFallbackLoadError] = useState(false);
  useEffect(() => {
    setLogoLoadError(false);
    setFallbackLoadError(false);
  }, [resolvedLogoUrl]);
  const logoImgSrc = logoLoadError ? '/logo.png' : resolvedLogoUrl;

  // Renders the logo + wordmark block per the current logo_display_mode.
  // Re-used in left / center / right slots below so all three positions
  // produce visually identical brand chrome.
  const showLogo = !logoInSidebar && (logoDisplayMode === 'logo_only' || logoDisplayMode === 'logo_and_text');
  const showText = logoDisplayMode === 'text_only' || logoDisplayMode === 'logo_and_text';
  const logoEffectivelyVisible = showLogo && !fallbackLoadError;
  // On <sm the wordmark hides when the logo carries the brand identity
  // (logo_and_text). Same pattern LanguageSelector uses for its language
  // name (#527). Without this, even with truncate, a phone-width admin
  // shows things like "Ar..." after the logo image — readable but ugly,
  // and on accounts whose company name lets the text reach the right
  // cluster it overlaps the LanguageSelector button (#523 follow-up,
  // Rekoo-PS's "Arkan Studio" screenshot in v3.59.0-beta.0). text_only
  // mode keeps the wordmark on every width — nothing else would render.
  //
  // #523 follow-up 2: when both the configured URL AND the bundled
  // fallback have failed (fallbackLoadError → logoEffectivelyVisible
  // false), unhide the wordmark on <sm too — otherwise the phone header
  // shows nothing at all for the brand block.
  const wordmarkVisibilityClass = logoEffectivelyVisible ? 'hidden sm:inline' : 'inline';
  const renderBrandBlock = () => {
    // Skeleton placeholder while `usePublicSettings()` is in flight (#523
    // follow-up — Rekoo-PS's "logo took some time to load" screenshot in
    // 3.60.1-beta.0). The previous code used the static fallback image
    // /logo.png as the during-loading state, and
    // because the wordmark is `hidden sm:inline` whenever a logo is
    // *intended* to be shown, a phone-width admin saw an empty header
    // for the ~hundreds-of-ms window before the real branding payload
    // arrived. The skeleton block holds the same h-8 (so no layout
    // shift when the real content lands) and is wider on sm+ to hint
    // at the wordmark slot.
    if (brandingLoading) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 sm:w-32 bg-fill rounded animate-pulse" />
        </div>
      );
    }
    // min-w-0 + truncate on the name span so long company names shrink
    // within the left cluster instead of pushing into the right-side
    // action buttons on narrow mobile widths (#523 regression).
    // The brand is also the home button (DashboardHomeLink asks before
    // leaving a form with unsaved edits).
    return (
      <DashboardHomeLink className="flex items-center gap-2 min-w-0 -mx-2 px-2 py-1 rounded-lg hover:bg-hover-soft transition-colors pointer-events-auto">
        {logoEffectivelyVisible && (
          <img
            src={logoImgSrc}
            alt={companyName}
            className="h-8 w-auto object-contain flex-shrink-0"
            onError={() => {
              // First failure: configured URL → try the bundled fallback.
              // Second failure: bundled fallback → hide entirely, let
              // the wordmark carry the brand (#523 follow-up 2).
              if (!logoLoadError) setLogoLoadError(true);
              else setFallbackLoadError(true);
            }}
          />
        )}
        {showText && (
          <span className={`${wordmarkVisibilityClass} text-xl font-bold tracking-tight text-heading truncate`}>{companyName === 'FotoDesk' ? <>Foto<span className="font-normal text-muted">Desk</span></> : companyName}</span>
        )}
      </DashboardHomeLink>
    );
  };

  // #523 follow-up: closes the user-menu lang sub-section whenever the
  // outer dropdown closes, so re-opening it doesn't surprise the user
  // with the language list already expanded from the previous session.
  const closeUserMenu = () => {
    userMenuModal.close();
    userMenuLangSectionModal.close();
  };
  const handleUserMenuLangSelect = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    closeUserMenu();
  };

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(userMenuRef, closeUserMenu);
  useOnClickOutside(notificationRef, notificationsModal.close);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', notificationsModal.isOpen],
    queryFn: () => notificationsService.getNotifications(notificationsModal.isOpen, 20),
    refetchInterval: 60000, // Refetch every minute
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t('admin.notificationToasts.markedAllRead'));
    },
  });

  // Clear notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: notificationsService.clearAllNotifications,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t('admin.notificationToasts.clearedAll', { count: data.deletedCount }));
    },
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  return (
    // border-b is on the OUTER <header> so it spans the full header
    // width — putting it on the inner row instead left a 32px gap on
    // the left (the px-4/sm:px-6/lg:px-8 padding) before the divider
    // started, visible as a missing segment between the sidebar's
    // brand-row bottom border and the header's bottom border.
    //
    // From sm upward the outer header is h-16 with the default border-box,
    // matching the sidebar brand row. Phones use a tighter 56px bar.
    <header className="sticky top-0 z-30 bg-shell h-14 sm:h-16 border-b border-line">
      <div className="px-3 sm:px-6 lg:px-8 h-full">
        <div className="relative flex items-center justify-between h-full gap-2 sm:gap-3">
          {/* Left side - Menu button, optional left-positioned logo, Date.
              Logo block appears here when logo_position = 'left' (the
              default). For 'center' it's absolutely positioned across
              the whole header; for 'right' it sits in the right-side
              cluster just before the action widgets. */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-body hover:bg-hover-soft transition-colors"
              aria-label={t('common.menu', 'Menu')}
            >
              <Menu className="w-5 h-5" />
            </button>

            {!logoInSidebar && logoPosition === 'left' && (
              <div className="hidden sm:flex shrink-0">{renderBrandBlock()}</div>
            )}
            {/* Narrow-viewport fallback for center / right positions */}
            {!logoInSidebar && logoPosition === 'center' && (
              <div className="hidden sm:flex lg:hidden shrink-0">{renderBrandBlock()}</div>
            )}
            {!logoInSidebar && logoPosition === 'right' && (
              <div className="hidden sm:flex md:hidden shrink-0">{renderBrandBlock()}</div>
            )}
          </div>

          {/* Phones get one predictable composition regardless of the desktop
              logo-position preference: menu, centered brand, account actions. */}
          {!logoInSidebar && (
            <div className="sm:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[7rem] overflow-hidden">
              {renderBrandBlock()}
            </div>
          )}

          {/* Centered Search Bar */}
          {onOpenSearch && (
            <div className="hidden md:flex flex-1 max-w-xl mx-4 sm:mx-8 justify-center">
              <button
                type="button"
                onClick={onOpenSearch}
                className="w-full max-w-md flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-subtle/80 hover:bg-subtle border border-line text-muted hover:text-body transition-all shadow-2xs group cursor-pointer"
                aria-label="Rechercher un client, une galerie, un événement..."
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Search className="w-4 h-4 text-muted group-hover:text-primary-600 transition-colors shrink-0" />
                  <span className="text-xs text-muted group-hover:text-body truncate">
                    Rechercher un client, une galerie, un événement...
                  </span>
                </div>
                <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-line bg-panel text-muted shrink-0 shadow-2xs">
                  {isMac ? '⌘K' : 'Ctrl K'}
                </kbd>
              </button>
            </div>
          )}

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            {!logoInSidebar && logoPosition === 'right' && (
              <div className="hidden md:flex mr-1 pr-2 border-r border-line">
                {renderBrandBlock()}
              </div>
            )}

            {/* The language selector used to sit here on sm+. It now lives
                in the user dropdown at every width, and its canonical home
                is Settings > General > Language — which also carries the
                gallery/guest default next to it, so the two scopes are
                visible side by side. Dropping it here takes the widget
                cluster from four to three, which is what #523 asked for on
                phones and reads better everywhere else too. */}

            {/* Dark Mode Toggle — hidden entirely when an admin has locked
                the instance to a specific mode via Branding > Force color mode. */}
            {/* Premium Language Switcher (FR / EN) with Flags */}
            <LanguageToggle size="sm" className="inline-flex" />

            {!forcedMode && (
              <button
                onClick={toggleDarkMode}
                className="hidden sm:inline-flex h-10 w-10 items-center justify-center text-muted hover:text-body hover:bg-hover-soft rounded-lg transition-colors"
                title={isDark ? t('admin.lightMode', 'Switch to light mode') : t('admin.darkMode', 'Switch to dark mode')}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={notificationsModal.toggle}
                className="relative inline-flex h-10 w-10 items-center justify-center text-muted hover:text-body hover:bg-hover-soft rounded-lg transition-colors"
                aria-label={t('admin.notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Notifications dropdown */}
              {notificationsModal.isOpen && (
                <div className="fixed left-3 right-3 top-14 mt-2 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-96 bg-panel rounded-lg shadow-lg border border-line">
                  <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-heading">{t('admin.notifications')}</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsReadMutation.mutate()}
                          className="text-xs text-accent hover:opacity-80 flex items-center gap-1"
                          title={t('admin.markAllRead')}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {t('admin.markAllRead')}
                        </button>
                      )}
                      <button
                        onClick={() => clearAllMutation.mutate()}
                        className="text-xs text-soft hover:text-body flex items-center gap-1"
                        title={t('admin.clearAll')}
                      >
                        <Trash2 className="w-3 h-3" />
                        {t('admin.clearAll')}
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted">
                        {t('admin.noNotificationsMessage')}
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const style = notificationsService.getNotificationStyle(notification.type);
                        return (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-hover cursor-pointer border-l-4 ${
                              notification.isRead ? 'border-transparent opacity-75' : 'border-accent-dark'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 ${style.color}`}>
                                {(() => {
                                  const Icon = NOTIFICATION_ICONS[style.icon] || Bell;
                                  return <Icon className="w-4 h-4" />;
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-heading">
                                  {notificationsService.formatNotificationMessage(notification)}
                                </p>
                                <p className="text-xs text-muted mt-1">
                                  {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-line text-center">
                      <button
                        onClick={notificationsModal.close}
                        className="text-sm text-accent hover:opacity-80"
                      >
                        {t('admin.close')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={userMenuModal.toggle}
                className="flex h-9 items-center gap-2 px-1.5 hover:bg-hover-soft rounded-xl transition-colors border border-transparent hover:border-line cursor-pointer"
                aria-label={t('admin.accountMenu', 'Account menu')}
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-semibold text-xs flex items-center justify-center border border-line shrink-0">
                  {(() => {
                    const name = user?.username || brandingSettings?.branding_company_name || 'Studio FotoDesk';
                    const parts = name.trim().split(/\s+/);
                    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
                    return name.slice(0, 2).toUpperCase();
                  })()}
                </div>
                <span className="hidden md:inline text-xs font-medium text-heading truncate max-w-[120px]">
                  {user?.username || brandingSettings?.branding_company_name || 'Studio'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0 hidden sm:block" />
              </button>

              {/* User dropdown */}
              {userMenuModal.isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-panel rounded-lg shadow-lg border border-line py-1">
                  <div className="px-4 py-2 border-b border-line sm:hidden">
                    <p className="text-sm font-medium text-heading">{user?.username}</p>
                    <p className="text-xs text-muted">{user?.email}</p>
                  </div>
                  {!forcedMode && (
                    <button
                      onClick={toggleDarkMode}
                      className="sm:hidden w-full px-4 py-2 text-left text-sm text-body hover:bg-hover flex items-center gap-3"
                    >
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      {isDark ? t('admin.lightMode', 'Switch to light mode') : t('admin.darkMode', 'Switch to dark mode')}
                    </button>
                  )}
                  {/* Language sub-section — phone-only (#523 follow-up).
                      Rekoo-PS asked for language to live inside the profile
                      menu since it's a set-once preference. It now shows at
                      every width: the header selector is gone, and an admin
                      who lands on a language they can't read must not have to
                      navigate Settings in that language to get out. Settings >
                      General > Language is the same preference, spelled out.
                      Collapsible so the menu isn't 8 rows taller by default. */}
                  <div className="border-b border-line">
                    <button
                      onClick={userMenuLangSectionModal.toggle}
                      className="w-full px-4 py-2 text-left text-sm text-body hover:bg-hover flex items-center gap-3"
                      aria-expanded={userMenuLangSectionModal.isOpen}
                    >
                      <Globe className="w-4 h-4" />
                      <span className="flex-1">{t('common.language', 'Language')}</span>
                      <currentLanguage.Flag className="w-4 h-4" />
                      <ChevronDown className={`w-4 h-4 transition-transform ${userMenuLangSectionModal.isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {userMenuLangSectionModal.isOpen && (
                      <div className="bg-shell py-1">
                        {SUPPORTED_LANGUAGES.map((language) => (
                          <button
                            key={language.code}
                            onClick={() => handleUserMenuLangSelect(language.code)}
                            className={`w-full pl-11 pr-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-hover ${
                              language.code === i18n.language
                                ? 'text-accent bg-accent-dark/15'
                                : 'text-body'
                            }`}
                          >
                            <language.Flag className="w-4 h-4" />
                            <span>{language.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {hasVisibleSettings && (
                  <button
                    onClick={() => {
                      closeUserMenu();
                      void confirmLeave().then((ok) => { if (ok) navigate('/admin/settings'); });
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-body hover:bg-hover flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    {t('navigation.settings')}
                  </button>
                  )}
                  <button
                    onClick={() => {
                      closeUserMenu();
                      passwordModal.open();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-body hover:bg-hover flex items-center gap-3"
                  >
                    <Lock className="w-4 h-4" />
                    {t('admin.changePassword')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-body hover:bg-hover flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('common.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={passwordModal.isOpen}
        onClose={passwordModal.close}
      />
    </header>
  );
};
