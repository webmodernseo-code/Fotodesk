import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CreditCard,
  Globe,
  Info,
  Moon,
  Percent,
  Settings,
  ShieldCheck,
  Sliders,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { FotoDeskLogo } from '@/components/common/FotoDeskLogo';

type SettingsTab =
  | 'general'
  | 'plans'
  | 'affiliate'
  | 'preferences'
  | 'localization'
  | 'security';

export const SuperAdminSettingsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // General
  const [platformName, setPlatformName] = useState('FotoDesk');
  const [supportEmail, setSupportEmail] = useState('support@fotodesk.app');
  const [platformDesc, setPlatformDesc] = useState('Plateforme de gestion pour studios photo');
  const [platformUrl, setPlatformUrl] = useState('https://fotodesk.app');
  const [copyrightText, setCopyrightText] = useState('© 2026 FotoDesk. Tous droits réservés.');
  const [footerBrand, setFooterBrand] = useState('FotoDesk');

  // Preferences
  const [defaultAppearance, setDefaultAppearance] = useState<'light' | 'dark'>('light');
  const [defaultLang, setDefaultLang] = useState<'fr' | 'en'>('fr');
  const [defaultCurrency, setDefaultCurrency] = useState<'EUR' | 'USD' | 'FCFA'>('EUR');
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY'>('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>('24h');

  // Modals & Toast
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [planModal, setPlanModal] = useState<'starter' | 'pro' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const tabs: Array<{ id: SettingsTab; label: string; sub: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'general', label: 'Paramètres généraux', sub: 'Identité et pied de page', icon: Settings },
    { id: 'plans', label: "Offres d'abonnement", sub: 'Offres et limites approuvées', icon: CreditCard },
    { id: 'affiliate', label: 'Affiliation & Commissions', sub: 'Politique approuvée', icon: Percent },
    { id: 'preferences', label: 'Préférences plateforme', sub: 'Valeurs par défaut', icon: Sliders },
    { id: 'localization', label: 'Localisation', sub: 'Langues et devises', icon: Globe },
    { id: 'security', label: 'Sécurité & Confidentialité', sub: 'Exigences de conformité', icon: ShieldCheck },
  ];

  const inputCls =
    'w-full h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading focus:outline-none focus:border-neutral-400';

  return (
    <div className="space-y-6">
      <div className="banner-info">
        <Info className="w-4 h-4 shrink-0" />
        <span>
          Les réglages éditables s&apos;appliquent à l&apos;interface. Les paramètres politiques en lecture seule reflètent la configuration approuvée.
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sub-nav */}
        <aside className="w-full lg:w-64 shrink-0 bg-panel border border-line rounded-2xl p-3 shadow-xs space-y-1">
          <div className="px-3 py-2">
            <p className="text-xs font-bold text-heading">Paramètres</p>
            <p className="text-[11px] text-muted">Configuration globale</p>
          </div>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  active ? 'bg-subtle text-heading font-semibold' : 'text-soft hover:bg-subtle/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs truncate">{t.label}</p>
                  <p className="text-[10px] text-muted truncate">{t.sub}</p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Right Panel */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <>
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-heading">Informations de la plateforme</h3>
                  <p className="text-xs text-muted">Détails globaux affichés sur la plateforme FotoDesk.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-heading mb-1.5">Nom de la plateforme *</label>
                    <input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-heading mb-1.5">E-mail de support *</label>
                    <input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-heading mb-1.5">Description *</label>
                    <input value={platformDesc} onChange={(e) => setPlatformDesc(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-heading mb-1.5">URL du site *</label>
                    <input value={platformUrl} onChange={(e) => setPlatformUrl(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-heading">Identité visuelle</h3>
                  <p className="text-xs text-muted">Logo affiché sur les interfaces gérées par FotoDesk.</p>
                </div>
                <div className="flex flex-wrap items-center gap-5 bg-subtle border border-line rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                      <FotoDeskLogo size={22} className="text-white" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-heading">FotoDesk</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted">Super Admin</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Téléversement du logo simulé.')}
                    className="btn-outline text-xs py-1.5 px-3"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Importer un logo
                  </button>
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-heading">Pied de page</h3>
                  <p className="text-xs text-muted">Texte affiché dans les pieds de page FotoDesk.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-heading mb-1.5">Copyright *</label>
                    <input value={copyrightText} onChange={(e) => setCopyrightText(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-heading mb-1.5">Nom de marque *</label>
                    <input value={footerBrand} onChange={(e) => setFooterBrand(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xs">
                <span className="text-xs text-muted">Toutes les modifications sont locales</span>
                <button type="button" onClick={() => setSaveConfirmOpen(true)} className="btn-primary text-sm">
                  Enregistrer les modifications
                </button>
              </div>
            </>
          )}

          {/* TAB 2: SUBSCRIPTION PLANS */}
          {activeTab === 'plans' && (
            <div className="space-y-5">
              <div className="banner-warning">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Les tarifs et quotas sont en lecture seule jusqu&apos;à confirmation de la configuration plateforme.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-panel border border-line rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Offre Starter</p>
                      <h3 className="text-lg font-bold text-heading">Starter</h3>
                    </div>
                    <span className="text-xl font-bold text-heading">Gratuit</span>
                  </div>
                  <div className="divide-y divide-line/60 text-xs">
                    {[
                      ['Galeries photo', '3 maximum'],
                      ['Stockage photo', '3 Go'],
                      ['Stockage vidéo', 'Non disponible'],
                      ['Liens privés & code', 'Inclus'],
                    ].map(([k, v]) => (
                      <div key={k} className="py-2 flex justify-between">
                        <span className="text-muted">{k}</span>
                        <span className="font-semibold text-heading">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setPlanModal('starter')} className="btn-outline w-full justify-center text-xs">
                    Voir les détails de l&apos;offre
                  </button>
                </div>

                <div className="bg-panel border border-line rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Offre Pro</p>
                      <h3 className="text-lg font-bold text-heading">Pro</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-heading">€9,90</span>
                      <p className="text-[11px] text-muted">/ mois · €99/an</p>
                    </div>
                  </div>
                  <div className="divide-y divide-line/60 text-xs">
                    {[
                      ['Galeries photo', 'Illimitées'],
                      ['Stockage photo', '100 Go'],
                      ['Stockage vidéo', '500 minutes'],
                      ['Lecture vidéo / mois', '1 000 minutes'],
                    ].map(([k, v]) => (
                      <div key={k} className="py-2 flex justify-between">
                        <span className="text-muted">{k}</span>
                        <span className="font-semibold text-heading">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setPlanModal('pro')} className="btn-outline w-full justify-center text-xs">
                    Voir les détails de l&apos;offre
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AFFILIATE & COMMISSION */}
          {activeTab === 'affiliate' && (
            <div className="space-y-5">
              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-3 shadow-xs">
                <h3 className="text-base font-bold text-heading">Configuration d&apos;affiliation</h3>
                <div className="divide-y divide-line/60 text-xs">
                  {[
                    ['Accès affilié', 'Activé par défaut'],
                    ['Inscription séparée', 'Non requise'],
                    ['Taux de commission', '20 %'],
                    ['Éligibilité', 'Premier paiement d’abonnement réussi uniquement'],
                    ['Commission sur renouvellements', 'Non applicable'],
                  ].map(([k, v]) => (
                    <div key={k} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-muted">{k}</p>
                        <p className="font-semibold text-heading mt-0.5">{v}</p>
                      </div>
                      <span className="badge-neutral">Lecture seule</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
                <h3 className="text-base font-bold text-heading">Exemple de calcul de commission</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-subtle border border-line rounded-xl p-4">
                    <p className="text-muted">Pro Mensuel</p>
                    <p className="text-base font-bold text-heading mt-1">€9,90 × 20 % = €1,98</p>
                  </div>
                  <div className="bg-subtle border border-line rounded-xl p-4">
                    <p className="text-muted">Pro Annuel</p>
                    <p className="text-base font-bold text-heading mt-1">€99,00 × 20 % = €19,80</p>
                  </div>
                </div>
                <div className="banner-success">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>La configuration suit la politique d&apos;affiliation FotoDesk approuvée.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PLATFORM PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-heading">Préférences globales par défaut</h3>
                <p className="text-xs text-muted">Valeurs par défaut pour les nouvelles sessions FotoDesk.</p>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-heading">Apparence par défaut</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDefaultAppearance('light')}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 ${
                      defaultAppearance === 'light' ? 'border-neutral-900 bg-subtle text-heading' : 'border-line text-muted'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Mode clair
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultAppearance('dark')}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 ${
                      defaultAppearance === 'dark' ? 'border-neutral-900 bg-subtle text-heading' : 'border-line text-muted'
                    }`}
                  >
                    <Moon className="w-4 h-4" /> Mode sombre
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-heading mb-1.5">Langue par défaut</label>
                  <select value={defaultLang} onChange={(e) => setDefaultLang(e.target.value as 'fr' | 'en')} className={inputCls}>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-heading mb-1.5">Devise d&apos;affichage</label>
                  <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value as 'EUR' | 'USD' | 'FCFA')} className={inputCls}>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="FCFA">FCFA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-heading mb-1.5">Format de date</label>
                  <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY')} className={inputCls}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-heading mb-1.5">Format d&apos;heure</label>
                  <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value as '24h' | '12h')} className={inputCls}>
                    <option value="24h">24 heures</option>
                    <option value="12h">12 heures</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setSaveConfirmOpen(true)} className="btn-primary text-sm">
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: LOCALIZATION */}
          {activeTab === 'localization' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
                  <h3 className="text-sm font-bold text-heading">Langues supportées</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-2 border-b border-line/60">
                      <span className="font-semibold text-heading">EN · English</span>
                      <span className="badge-success">Disponible</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-heading">FR · Français</span>
                      <span className="badge-success">Disponible</span>
                    </div>
                  </div>
                </div>
                <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
                  <h3 className="text-sm font-bold text-heading">Devises supportées</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-2 border-b border-line/60">
                      <span className="font-semibold text-heading">EUR · Euro</span>
                      <span className="badge-success">Disponible</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-line/60">
                      <span className="font-semibold text-heading">FCFA · Franc CFA</span>
                      <span className="badge-success">Disponible</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-heading">USD · Dollar US</span>
                      <span className="badge-success">Disponible</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="banner-warning">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>La disponibilité des devises dépend de la configuration finale du prestataire. Aucune conversion automatique n&apos;est effectuée ici.</span>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY & PRIVACY */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  title: 'Sécurité du compte',
                  items: [
                    ['HTTPS / TLS', 'Requis', 'badge-success'],
                    ['Contrôle d’accès par rôle', 'Requis', 'badge-success'],
                    ['Validation des permissions serveur', 'Requis', 'badge-success'],
                  ],
                },
                {
                  title: 'Protection des médias',
                  items: [
                    ['Stockage média privé', 'Requis', 'badge-success'],
                    ['URLs signées à durée limitée', 'Requis', 'badge-success'],
                    ['Validation d’accès galerie', 'Requis', 'badge-success'],
                  ],
                },
                {
                  title: 'Protection des données',
                  items: [
                    ['Politique de sauvegarde', 'Configuration requise', 'badge-info'],
                    ['Export des données', 'Pris en charge', 'badge-success'],
                    ['Rétention des données', 'Confirmation requise', 'badge-warning'],
                  ],
                },
                {
                  title: 'RGPD & Confidentialité',
                  items: [
                    ['Informations de confidentialité', 'Requis', 'badge-success'],
                    ['Exigences de protection', 'Requis', 'badge-success'],
                    ['Gestion des données utilisateur', 'Requis', 'badge-success'],
                  ],
                },
              ].map((card) => (
                <div key={card.title} className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
                  <h3 className="text-sm font-bold text-heading">{card.title}</h3>
                  <div className="divide-y divide-line/60 text-xs">
                    {card.items.map(([label, badgeLabel, cls]) => (
                      <div key={label} className="py-2.5 flex items-center justify-between gap-2">
                        <span className="text-soft">{label}</span>
                        <span className={cls}>{badgeLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Save Modal */}
      {saveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-heading">Enregistrer les paramètres plateforme ?</h3>
              <button
                type="button"
                onClick={() => setSaveConfirmOpen(false)}
                className="w-8 h-8 rounded-full bg-subtle text-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-soft">
              Confirmez l&apos;enregistrement de ces paramètres d&apos;interface pour la console Super Admin.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setSaveConfirmOpen(false)} className="btn-outline text-sm">
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaveConfirmOpen(false);
                  showToast('Paramètres de la plateforme enregistrés.');
                }}
                className="btn-primary text-sm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Details Modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-heading">
                {planModal === 'starter' ? 'Configuration Offre Starter' : 'Configuration Offre Pro'}
              </h3>
              <button
                type="button"
                onClick={() => setPlanModal(null)}
                className="w-8 h-8 rounded-full bg-subtle text-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-subtle border border-line rounded-xl p-3">
                <p className="text-muted">Tarif</p>
                <p className="font-bold text-heading mt-0.5">
                  {planModal === 'starter' ? 'Gratuit' : '€9,90/mois · €99/an'}
                </p>
              </div>
              <div className="bg-subtle border border-line rounded-xl p-3">
                <p className="text-muted">Stockage photo</p>
                <p className="font-bold text-heading mt-0.5">{planModal === 'starter' ? '3 Go' : '100 Go'}</p>
              </div>
              <div className="bg-subtle border border-line rounded-xl p-3">
                <p className="text-muted">Galeries photo</p>
                <p className="font-bold text-heading mt-0.5">{planModal === 'starter' ? '3 maximum' : 'Illimitées'}</p>
              </div>
              <div className="bg-subtle border border-line rounded-xl p-3">
                <p className="text-muted">Statut</p>
                <p className="font-bold text-heading mt-0.5">Configuration approuvée</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setPlanModal(null)} className="btn-primary text-sm">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-panel border border-line rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--sem-success-fg)' }} />
          <p className="text-xs font-medium text-heading">{toast}</p>
        </div>
      )}
    </div>
  );
};

