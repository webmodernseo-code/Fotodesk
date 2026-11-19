import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Info,
  LayoutGrid,
  Monitor,
  Moon,
  Palette,
  Settings2,
  ShieldCheck,
  Sun,
  UserCog,
  X,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type SettingsSection =
  | 'overview'
  | 'studio'
  | 'account'
  | 'appearance'
  | 'notifications'
  | 'security'
  | 'workspace';

const VALID_SECTIONS: SettingsSection[] = [
  'overview',
  'studio',
  'account',
  'appearance',
  'notifications',
  'security',
  'workspace',
];

interface ToastState {
  title: string;
  message: string;
}

interface StudioProfileState {
  logoPreview: string | null;
  studioName: string;
  city: string;
  country: string;
  description: string;
  businessEmail: string;
  phone: string;
  website: string;
  instagram: string;
  facebook: string;
  linkedin: string;
}

interface AccountPrefsState {
  avatarPreview: string | null;
  fullName: string;
  email: string;
  phone: string;
  language: 'fr' | 'en';
  country: string;
  timezone: string;
}

interface NotificationPrefsState {
  importantUpdates: boolean;
  subscriptionBilling: boolean;
  securityAlerts: boolean;
  newClientActivity: boolean;
  projectUpdates: boolean;
  photoGalleryActivity: boolean;
  videoGalleryActivity: boolean;
  quoteUpdates: boolean;
  contractUpdates: boolean;
  invoiceUpdates: boolean;
  paymentUpdates: boolean;
  inApp: boolean;
  email: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  browserLocation: string;
  lastActive: string;
  isCurrent: boolean;
}

interface WorkspacePrefsState {
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '24h' | '12h';
  currency: 'EUR' | 'USD' | 'GBP' | 'CHF' | 'CAD';
  defaultCalendarView: 'month' | 'week' | 'day';
  defaultLandingLanguage: 'fr' | 'en';
}

const INITIAL_STUDIO: StudioProfileState = {
  logoPreview: null,
  studioName: 'Northlight Studio',
  city: 'Paris',
  country: 'France',
  description:
    'Northlight Studio est un studio de photographie basé à Paris, reconnu pour son approche éditoriale, ses portraits soignés et son accompagnement client attentif.',
  businessEmail: 'hello@northlight.studio',
  phone: '+33 1 42 68 55 00',
  website: 'https://northlight.studio',
  instagram: 'https://instagram.com/northlightstudio',
  facebook: 'https://facebook.com/northlightstudio',
  linkedin: 'https://linkedin.com/company/northlightstudio',
};

const INITIAL_ACCOUNT: AccountPrefsState = {
  avatarPreview: null,
  fullName: 'Alex Morgan',
  email: 'alex@northlight.com',
  phone: '+33 6 12 34 56 78',
  language: 'fr',
  country: 'France',
  timezone: 'Central European Time (Paris)',
};

const INITIAL_NOTIFICATIONS: NotificationPrefsState = {
  importantUpdates: true,
  subscriptionBilling: true,
  securityAlerts: true,
  newClientActivity: true,
  projectUpdates: true,
  photoGalleryActivity: true,
  videoGalleryActivity: false,
  quoteUpdates: true,
  contractUpdates: true,
  invoiceUpdates: true,
  paymentUpdates: true,
  inApp: true,
  email: true,
};

const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'win-pc',
    device: 'Windows PC',
    browserLocation: 'Chrome · Paris, France',
    lastActive: 'Session actuelle',
    isCurrent: true,
  },
  {
    id: 'macbook-pro',
    device: 'MacBook Pro',
    browserLocation: 'Safari · Lyon, France',
    lastActive: 'Actif il y a 2 jours',
    isCurrent: false,
  },
];

const INITIAL_WORKSPACE: WorkspacePrefsState = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  currency: 'EUR',
  defaultCalendarView: 'month',
  defaultLandingLanguage: 'fr',
};

const inputCls =
  'w-full h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors';

const labelCls = 'block text-xs font-medium text-heading mb-1.5';

interface ToggleRowProps {
  title: string;
  enabled: boolean;
  onChange: (next: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ title, enabled, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-line/60 last:border-b-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-heading">{title}</p>
      <p className="text-xs text-muted mt-0.5">{enabled ? 'Activé' : 'Désactivé'}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 ${
        enabled ? 'bg-accent' : 'bg-line'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export const SettingsWorkspace: React.FC = () => {
  const { i18n } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawSection = searchParams.get('section') as SettingsSection | null;
  const activeSection: SettingsSection =
    rawSection && VALID_SECTIONS.includes(rawSection) ? rawSection : 'overview';

  const setActiveSection = (section: SettingsSection) => {
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    if (section === 'overview') {
      next.delete('section');
    } else {
      next.set('section', section);
    }
    setSearchParams(next, { replace: true });
  };

  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (message: string, title = 'Succès') => {
    setToast({ title, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Studio Profile state
  const [studioSaved, setStudioSaved] = useState<StudioProfileState>(INITIAL_STUDIO);
  const [studioForm, setStudioForm] = useState<StudioProfileState>(INITIAL_STUDIO);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Account Preferences state
  const [accountSaved, setAccountSaved] = useState<AccountPrefsState>(INITIAL_ACCOUNT);
  const [accountForm, setAccountForm] = useState<AccountPrefsState>(INITIAL_ACCOUNT);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Appearance state
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Notifications state
  const [notifSaved, setNotifSaved] = useState<NotificationPrefsState>(INITIAL_NOTIFICATIONS);
  const [notifForm, setNotifForm] = useState<NotificationPrefsState>(INITIAL_NOTIFICATIONS);

  // Security state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [lastPwUpdate, setLastPwUpdate] = useState('12 mai 2025');
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [sessionToSignOut, setSessionToSignOut] = useState<ActiveSession | null>(null);

  // Workspace Preferences state
  const [workspaceSaved, setWorkspaceSaved] = useState<WorkspacePrefsState>(INITIAL_WORKSPACE);
  const [workspaceForm, setWorkspaceForm] = useState<WorkspacePrefsState>(INITIAL_WORKSPACE);

  const navItems: Array<{
    key: Exclude<SettingsSection, 'overview'>;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      key: 'studio',
      label: 'Profil du studio',
      description: 'Gérez le nom de votre studio, le logo, les coordonnées et les informations professionnelles.',
      icon: Building2,
    },
    {
      key: 'account',
      label: 'Préférences du compte',
      description: 'Mettez à jour vos informations personnelles et vos préférences de langue.',
      icon: UserCog,
    },
    {
      key: 'appearance',
      label: 'Apparence',
      description: "Personnalisez le thème d'affichage (clair, sombre ou système) et la densité.",
      icon: Palette,
    },
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Gérez vos préférences de notifications pour le studio et la facturation.',
      icon: Bell,
    },
    {
      key: 'security',
      label: 'Sécurité',
      description: 'Gérez votre mot de passe, vos informations de sécurité et vos sessions actives.',
      icon: ShieldCheck,
    },
    {
      key: 'workspace',
      label: "Préférences de l'espace",
      description: "Configurez les préférences régionales et générales de votre espace FotoDesk.",
      icon: LayoutGrid,
    },
  ];

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoad: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLoad(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatDisplayExample = () => {
    const datePart =
      workspaceForm.dateFormat === 'DD/MM/YYYY'
        ? '29/05/2025'
        : workspaceForm.dateFormat === 'MM/DD/YYYY'
        ? '05/29/2025'
        : '2025-05-29';
    const timePart = workspaceForm.timeFormat === '24h' ? '14:30' : '2:30 PM';
    const amountPart =
      workspaceForm.currency === 'EUR'
        ? '1 250,00 €'
        : workspaceForm.currency === 'USD'
        ? '$1,250.00'
        : workspaceForm.currency === 'GBP'
        ? '£1,250.00'
        : workspaceForm.currency === 'CHF'
        ? 'CHF 1,250.00'
        : 'CA$1,250.00';
    return `${datePart} · ${timePart} · ${amountPart}`;
  };

  const handleUpdatePassword = () => {
    setPwError(null);
    if (!currentPw.trim()) {
      setPwError('Veuillez saisir votre mot de passe actuel.');
      return;
    }
    if (newPw.length < 8) {
      setPwError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('La confirmation du mot de passe ne correspond pas.');
      return;
    }
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setLastPwUpdate("Aujourd'hui");
    showToast('Mot de passe mis à jour avec succès.');
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div>
        <p className="text-xs font-medium text-muted mb-1">
          Espace de travail <span className="mx-1">/</span> Paramètres
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">Paramètres</h1>
        <p className="text-sm text-muted mt-1">
          Gérez les informations de votre studio, vos préférences de compte et les paramètres de l&apos;espace de travail.
        </p>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Navigation Card */}
        <aside className="w-full lg:w-64 shrink-0 bg-panel border border-line rounded-2xl p-3 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeSection === 'overview'
                ? 'bg-accent/10 text-accent'
                : 'text-soft hover:text-heading hover:bg-subtle'
            }`}
          >
            <Settings2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Vue d&apos;ensemble</span>
          </button>

          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted px-3 pt-4 pb-1.5">
            Préférences
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-soft hover:text-heading hover:bg-subtle'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* OVERVIEW */}
          {activeSection === 'overview' && (
            <>
              <div>
                <h2 className="text-xl font-bold text-heading">Vue d&apos;ensemble</h2>
                <p className="text-sm text-muted mt-0.5">
                  Sélectionnez une catégorie pour gérer vos préférences de studio et d&apos;espace de travail.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveSection(item.key)}
                      className="group bg-panel border border-line rounded-2xl p-5 text-left hover:border-accent/40 hover:shadow-sm transition-all flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-subtle border border-line/70 flex items-center justify-center shrink-0 text-soft group-hover:text-accent transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-heading">{item.label}</h3>
                          <p className="text-xs text-muted mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted group-hover:text-heading shrink-0 mt-1 transition-colors" />
                    </button>
                  );
                })}
              </div>

              <div className="banner-info">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong className="font-semibold">Accès propriétaire du studio</strong> — Les membres de l&apos;équipe ne voient que les sections de paramètres autorisées par leurs permissions.
                </p>
              </div>
            </>
          )}

          {/* STUDIO PROFILE */}
          {activeSection === 'studio' && (
            <>
              <div>
                <p className="text-xs font-medium text-muted mb-1">
                  Paramètres <span className="mx-1">/</span> Profil du studio
                </p>
                <h2 className="text-xl font-bold text-heading">Profil du studio</h2>
                <p className="text-sm text-muted mt-0.5">
                  Gérez les informations associées à votre studio photographique.
                </p>
              </div>

              {/* Studio Branding */}
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">Identité du studio</h3>
                  <p className="text-xs text-muted mt-0.5">Votre identité studio sur FotoDesk.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center overflow-hidden shrink-0">
                    {studioForm.logoPreview ? (
                      <img
                        src={studioForm.logoPreview}
                        alt="Logo du studio"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold text-accent">
                        {studioForm.studioName
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'NS'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-heading">Logo du studio</p>
                    <p className="text-xs text-muted">Logo carré, minimum 256 × 256 pixels.</p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, (url) =>
                            setStudioForm((prev) => ({ ...prev, logoPreview: url }))
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="btn-outline text-xs py-1.5 px-3"
                      >
                        Remplacer le logo
                      </button>
                      {studioForm.logoPreview && (
                        <button
                          type="button"
                          onClick={() =>
                            setStudioForm((prev) => ({ ...prev, logoPreview: null }))
                          }
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Supprimer le logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nom du studio</label>
                    <input
                      type="text"
                      value={studioForm.studioName}
                      onChange={(e) =>
                        setStudioForm((prev) => ({ ...prev, studioName: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Ville</label>
                    <input
                      type="text"
                      value={studioForm.city}
                      onChange={(e) =>
                        setStudioForm((prev) => ({ ...prev, city: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Pays</label>
                    <input
                      type="text"
                      value={studioForm.country}
                      onChange={(e) =>
                        setStudioForm((prev) => ({ ...prev, country: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Description du studio</label>
                    <textarea
                      rows={3}
                      value={studioForm.description}
                      onChange={(e) =>
                        setStudioForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full p-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">Coordonnées</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Coordonnées professionnelles utilisées dans l&apos;espace de travail.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>E-mail professionnel</label>
                    <input
                      type="email"
                      value={studioForm.businessEmail}
                      onChange={(e) =>
                        setStudioForm((prev) => ({ ...prev, businessEmail: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Téléphone</label>
                    <input
                      type="tel"
                      value={studioForm.phone}
                      onChange={(e) =>
                        setStudioForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Site web</label>
                    <input
                      type="url"
                      value={studioForm.website}
                      onChange={(e) =>
                        setStudioForm((prev) => ({ ...prev, website: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">Réseaux sociaux</h3>
                  <p className="text-xs text-muted mt-0.5">Liens optionnels vers votre studio.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Instagram</label>
                    <input
                      type="url"
                      value={studioForm.instagram}
                      onChange={(e) =>
                        setStudioForm((prev) => ({ ...prev, instagram: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Facebook</label>
                    <input
                      type="url"
                      value={studioForm.facebook}
                      onChange={(e) =>
                        setStudioForm((prev) => ({ ...prev, facebook: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>LinkedIn</label>
                    <input
                      type="url"
                      value={studioForm.linkedin}
                      onChange={(e) =>
                        setStudioForm((prev) => ({ ...prev, linkedin: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Save Bar */}
              <div className="bg-panel border border-line rounded-2xl px-5 py-3.5 flex items-center justify-end gap-3 shadow-xs">
                <button
                  type="button"
                  onClick={() => setStudioForm(studioSaved)}
                  className="btn-outline text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudioSaved(studioForm);
                    showToast('Profil du studio mis à jour avec succès.');
                  }}
                  className="btn-primary text-sm"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </>
          )}

          {/* ACCOUNT PREFERENCES */}
          {activeSection === 'account' && (
            <>
              <div>
                <p className="text-xs font-medium text-muted mb-1">
                  Paramètres <span className="mx-1">/</span> Préférences du compte
                </p>
                <h2 className="text-xl font-bold text-heading">Préférences du compte</h2>
                <p className="text-sm text-muted mt-0.5">
                  Gérez vos informations personnelles et vos préférences de compte.
                </p>
              </div>

              {/* Personal Information */}
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">Informations personnelles</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Informations associées à votre compte propriétaire.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center overflow-hidden shrink-0">
                    {accountForm.avatarPreview ? (
                      <img
                        src={accountForm.avatarPreview}
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold text-accent">
                        {accountForm.fullName
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'AM'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-heading">Photo de profil</p>
                    <p className="text-xs text-muted">Affichée dans l&apos;espace FotoDesk.</p>
                    <div className="pt-1">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, (url) =>
                            setAccountForm((prev) => ({ ...prev, avatarPreview: url }))
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="btn-outline text-xs py-1.5 px-3"
                      >
                        Remplacer la photo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nom complet</label>
                    <input
                      type="text"
                      value={accountForm.fullName}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Adresse e-mail</label>
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Téléphone</label>
                    <input
                      type="tel"
                      value={accountForm.phone}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Language Preferences */}
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">Préférences de langue</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Choisissez la langue utilisée dans votre espace de travail.
                  </p>
                </div>
                <div className="max-w-md">
                  <label className={labelCls}>Langue de l&apos;interface</label>
                  <select
                    value={accountForm.language}
                    onChange={(e) =>
                      setAccountForm((prev) => ({
                        ...prev,
                        language: e.target.value as 'fr' | 'en',
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {/* Regional Preferences */}
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">Préférences régionales</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Définissez la localisation et le fuseau horaire de votre compte.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Pays</label>
                    <select
                      value={accountForm.country}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, country: e.target.value }))
                      }
                      className={inputCls}
                    >
                      <option value="France">France</option>
                      <option value="Belgique">Belgique</option>
                      <option value="Suisse">Suisse</option>
                      <option value="Canada">Canada</option>
                      <option value="États-Unis">États-Unis</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Fuseau horaire</label>
                    <select
                      value={accountForm.timezone}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, timezone: e.target.value }))
                      }
                      className={inputCls}
                    >
                      <option value="Central European Time (Paris)">
                        Central European Time (Paris)
                      </option>
                      <option value="UTC">UTC (Temps universel)</option>
                      <option value="Eastern Time (New York)">
                        Eastern Time (New York)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl px-5 py-3.5 flex items-center justify-end gap-3 shadow-xs">
                <button
                  type="button"
                  onClick={() => setAccountForm(accountSaved)}
                  className="btn-outline text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountSaved(accountForm);
                    void i18n.changeLanguage(accountForm.language);
                    showToast('Préférences du compte mises à jour avec succès.');
                  }}
                  className="btn-primary text-sm"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </>
          )}

          {/* APPEARANCE */}
          {activeSection === 'appearance' && (
            <>
              <div>
                <p className="text-xs font-medium text-muted mb-1">
                  Paramètres <span className="mx-1">/</span> Apparence
                </p>
                <h2 className="text-xl font-bold text-heading">Apparence</h2>
                <p className="text-sm text-muted mt-0.5">
                  Personnalisez le thème visuel et le confort d&apos;affichage de votre espace.
                </p>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">Thème de l&apos;interface</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Choisissez le mode d&apos;affichage de votre tableau de bord FotoDesk.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'light' as const, label: 'Clair', icon: Sun, desc: 'Fond lumineux épuré' },
                    { id: 'dark' as const, label: 'Sombre', icon: Moon, desc: 'Confort visuel nocturne' },
                    { id: 'system' as const, label: 'Système', icon: Monitor, desc: 'Suit le réglage OS' },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = themeMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setThemeMode(opt.id)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                          active
                            ? 'border-accent bg-accent/8 ring-1 ring-accent/30'
                            : 'border-line bg-panel hover:bg-subtle'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${active ? 'text-accent' : 'text-soft'}`} />
                        <div>
                          <p className="text-sm font-semibold text-heading">{opt.label}</p>
                          <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">Densité d&apos;affichage</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Ajustez l&apos;espacement des listes et tableaux dans votre studio.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'comfortable' as const, label: 'Confortable', desc: 'Espacement aéré recommandé' },
                    { id: 'compact' as const, label: 'Compacte', desc: 'Plus d’informations à l’écran' },
                  ].map((opt) => {
                    const active = density === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDensity(opt.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          active
                            ? 'border-accent bg-accent/8 ring-1 ring-accent/30'
                            : 'border-line bg-panel hover:bg-subtle'
                        }`}
                      >
                        <p className="text-sm font-semibold text-heading">{opt.label}</p>
                        <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl px-5 py-3.5 flex items-center justify-end gap-3 shadow-xs">
                <button
                  type="button"
                  onClick={() => showToast("Préférences d'apparence enregistrées.")}
                  className="btn-primary text-sm"
                >
                  Enregistrer les préférences
                </button>
              </div>
            </>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <>
              <div>
                <p className="text-xs font-medium text-muted mb-1">
                  Paramètres <span className="mx-1">/</span> Notifications
                </p>
                <h2 className="text-xl font-bold text-heading">Notifications</h2>
                <p className="text-sm text-muted mt-0.5">
                  Choisissez les notifications que vous souhaitez recevoir.
                </p>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-2 shadow-xs">
                <div className="pb-2">
                  <h3 className="text-base font-semibold text-heading">Notifications du compte</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Mises à jour importantes concernant votre compte FotoDesk.
                  </p>
                </div>
                <ToggleRow
                  title="Mises à jour importantes du compte"
                  enabled={notifForm.importantUpdates}
                  onChange={(v) => setNotifForm((p) => ({ ...p, importantUpdates: v }))}
                />
                <ToggleRow
                  title="Abonnement et facturation"
                  enabled={notifForm.subscriptionBilling}
                  onChange={(v) => setNotifForm((p) => ({ ...p, subscriptionBilling: v }))}
                />
                <ToggleRow
                  title="Notifications de sécurité"
                  enabled={notifForm.securityAlerts}
                  onChange={(v) => setNotifForm((p) => ({ ...p, securityAlerts: v }))}
                />
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-2 shadow-xs">
                <div className="pb-2">
                  <h3 className="text-base font-semibold text-heading">Activité du studio</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Mises à jour liées à l&apos;activité quotidienne de votre studio.
                  </p>
                </div>
                <ToggleRow
                  title="Nouvelle activité client"
                  enabled={notifForm.newClientActivity}
                  onChange={(v) => setNotifForm((p) => ({ ...p, newClientActivity: v }))}
                />
                <ToggleRow
                  title="Mises à jour de projets"
                  enabled={notifForm.projectUpdates}
                  onChange={(v) => setNotifForm((p) => ({ ...p, projectUpdates: v }))}
                />
                <ToggleRow
                  title="Activité des galeries photo"
                  enabled={notifForm.photoGalleryActivity}
                  onChange={(v) => setNotifForm((p) => ({ ...p, photoGalleryActivity: v }))}
                />
                <ToggleRow
                  title="Activité des galeries vidéo"
                  enabled={notifForm.videoGalleryActivity}
                  onChange={(v) => setNotifForm((p) => ({ ...p, videoGalleryActivity: v }))}
                />
                <ToggleRow
                  title="Mises à jour de devis"
                  enabled={notifForm.quoteUpdates}
                  onChange={(v) => setNotifForm((p) => ({ ...p, quoteUpdates: v }))}
                />
                <ToggleRow
                  title="Mises à jour de contrats"
                  enabled={notifForm.contractUpdates}
                  onChange={(v) => setNotifForm((p) => ({ ...p, contractUpdates: v }))}
                />
                <ToggleRow
                  title="Mises à jour de factures"
                  enabled={notifForm.invoiceUpdates}
                  onChange={(v) => setNotifForm((p) => ({ ...p, invoiceUpdates: v }))}
                />
                <ToggleRow
                  title="Mises à jour de paiements"
                  enabled={notifForm.paymentUpdates}
                  onChange={(v) => setNotifForm((p) => ({ ...p, paymentUpdates: v }))}
                />
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-2 shadow-xs">
                <div className="pb-2">
                  <h3 className="text-base font-semibold text-heading">Canaux de notification</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Choisissez où apparaissent les notifications activées.
                  </p>
                </div>
                <ToggleRow
                  title="Notifications dans l'application"
                  enabled={notifForm.inApp}
                  onChange={(v) => setNotifForm((p) => ({ ...p, inApp: v }))}
                />
                <ToggleRow
                  title="Notifications par e-mail"
                  enabled={notifForm.email}
                  onChange={(v) => setNotifForm((p) => ({ ...p, email: v }))}
                />
              </div>

              <div className="bg-panel border border-line rounded-2xl px-5 py-3.5 flex items-center justify-end gap-3 shadow-xs">
                <button
                  type="button"
                  onClick={() => setNotifForm(notifSaved)}
                  className="btn-outline text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotifSaved(notifForm);
                    showToast('Préférences de notification mises à jour avec succès.');
                  }}
                  className="btn-primary text-sm"
                >
                  Enregistrer les préférences
                </button>
              </div>
            </>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <>
              <div>
                <p className="text-xs font-medium text-muted mb-1">
                  Paramètres <span className="mx-1">/</span> Sécurité
                </p>
                <h2 className="text-xl font-bold text-heading">Sécurité</h2>
                <p className="text-sm text-muted mt-0.5">
                  Gérez votre mot de passe et vos préférences de sécurité.
                </p>
              </div>

              {/* Change Password */}
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">Changer le mot de passe</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Utilisez au moins 8 caractères pour votre nouveau mot de passe.
                  </p>
                </div>

                {pwError && (
                  <p role="alert" className="banner-danger font-medium">
                    {pwError}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Mot de passe actuel</label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        className={`${inputCls} pr-16`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-accent hover:underline"
                      >
                        {showCurrentPw ? 'Masquer' : 'Afficher'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        className={`${inputCls} pr-16`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-accent hover:underline"
                      >
                        {showNewPw ? 'Masquer' : 'Afficher'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Confirmer le nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        className={`${inputCls} pr-16`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-accent hover:underline"
                      >
                        {showConfirmPw ? 'Masquer' : 'Afficher'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPw('');
                      setNewPw('');
                      setConfirmPw('');
                      setPwError(null);
                    }}
                    className="btn-outline text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    className="btn-primary text-sm"
                  >
                    Mettre à jour le mot de passe
                  </button>
                </div>
              </div>

              {/* Account Security Information */}
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">
                    Informations de sécurité du compte
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    État actuel de la sécurité de votre compte.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-subtle border border-line/70 rounded-xl p-3.5">
                    <p className="text-xs text-muted">E-mail du compte</p>
                    <p className="text-sm font-semibold text-heading mt-1">{accountSaved.email}</p>
                  </div>
                  <div className="bg-subtle border border-line/70 rounded-xl p-3.5">
                    <p className="text-xs text-muted">Statut du compte</p>
                    <span className="badge-success mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Actif
                    </span>
                  </div>
                  <div className="bg-subtle border border-line/70 rounded-xl p-3.5">
                    <p className="text-xs text-muted">Dernière mise à jour du mot de passe</p>
                    <p className="text-sm font-semibold text-heading mt-1">{lastPwUpdate}</p>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">Sessions actives</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Appareils actuellement connectés à votre compte.
                  </p>
                </div>
                <div className="divide-y divide-line/60">
                  {sessions.map((s) => (
                    <div key={s.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-subtle border border-line/70 flex items-center justify-center text-soft shrink-0">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-heading">{s.device}</p>
                          <p className="text-xs text-muted">{s.browserLocation}</p>
                          <p className="text-xs text-muted">{s.lastActive}</p>
                        </div>
                      </div>
                      {s.isCurrent ? (
                        <span className="badge-success shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          Actuelle
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSessionToSignOut(s)}
                          className="btn-outline text-xs py-1.5 px-3 shrink-0"
                        >
                          Déconnecter
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* WORKSPACE PREFERENCES */}
          {activeSection === 'workspace' && (
            <>
              <div>
                <p className="text-xs font-medium text-muted mb-1">
                  Paramètres <span className="mx-1">/</span> Préférences de l&apos;espace
                </p>
                <h2 className="text-xl font-bold text-heading">Préférences de l&apos;espace</h2>
                <p className="text-sm text-muted mt-0.5">
                  Gérez les préférences générales de votre espace FotoDesk.
                </p>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">
                    Préférences d&apos;affichage régionales
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Contrôlez le format d&apos;affichage des dates, heures et devises.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Format de date</label>
                    <select
                      value={workspaceForm.dateFormat}
                      onChange={(e) =>
                        setWorkspaceForm((p) => ({
                          ...p,
                          dateFormat: e.target.value as WorkspacePrefsState['dateFormat'],
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Format d&apos;heure</label>
                    <select
                      value={workspaceForm.timeFormat}
                      onChange={(e) =>
                        setWorkspaceForm((p) => ({
                          ...p,
                          timeFormat: e.target.value as WorkspacePrefsState['timeFormat'],
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="24h">24 heures</option>
                      <option value="12h">12 heures (AM/PM)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Devise par défaut</label>
                    <select
                      value={workspaceForm.currency}
                      onChange={(e) =>
                        setWorkspaceForm((p) => ({
                          ...p,
                          currency: e.target.value as WorkspacePrefsState['currency'],
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CHF">CHF</option>
                      <option value="CAD">CAD (CA$)</option>
                    </select>
                  </div>
                  <div className="bg-subtle border border-line/70 rounded-xl px-4 py-2.5 flex flex-col justify-center">
                    <p className="text-[11px] font-medium text-muted">Exemple d&apos;affichage</p>
                    <p className="text-sm font-semibold text-heading mt-0.5">
                      {formatDisplayExample()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-heading">
                    Préférences générales de l&apos;espace
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Valeurs par défaut pour les écrans FotoDesk connectés.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Vue calendrier par défaut</label>
                    <select
                      value={workspaceForm.defaultCalendarView}
                      onChange={(e) =>
                        setWorkspaceForm((p) => ({
                          ...p,
                          defaultCalendarView: e.target.value as WorkspacePrefsState['defaultCalendarView'],
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="month">Mois</option>
                      <option value="week">Semaine</option>
                      <option value="day">Jour</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Langue par défaut de la page d&apos;accueil</label>
                    <select
                      value={workspaceForm.defaultLandingLanguage}
                      onChange={(e) =>
                        setWorkspaceForm((p) => ({
                          ...p,
                          defaultLandingLanguage: e.target.value as 'fr' | 'en',
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl px-5 py-3.5 flex items-center justify-end gap-3 shadow-xs">
                <button
                  type="button"
                  onClick={() => setWorkspaceForm(workspaceSaved)}
                  className="btn-outline text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceSaved(workspaceForm);
                    showToast("Préférences de l'espace enregistrées avec succès.");
                  }}
                  className="btn-primary text-sm"
                >
                  Enregistrer les préférences
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sign Out Session Modal */}
      {sessionToSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Action rapide
                </p>
                <h3 className="text-lg font-bold text-heading mt-0.5">
                  Déconnecter cette session ?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSessionToSignOut(null)}
                className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 py-1">
              <div className="w-11 h-11 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-sm text-soft">
                Voulez-vous déconnecter la session{' '}
                <span className="font-semibold text-heading">{sessionToSignOut.device}</span> (
                {sessionToSignOut.browserLocation}) ?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSessionToSignOut(null)}
                className="btn-outline text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = sessionToSignOut;
                  setSessions((prev) => prev.filter((item) => item.id !== target.id));
                  setSessionToSignOut(null);
                  showToast(`Session ${target.device} déconnectée avec succès.`);
                }}
                className="btn-primary text-sm"
              >
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
            aria-label="Fermer la notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

