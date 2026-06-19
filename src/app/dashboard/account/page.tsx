"use client";

import { useState, useEffect } from 'react';
import { detectCurrency, RegionDevise } from '@/lib/geo';
import { recordConversion } from '@/lib/affiliateDb';

export default function AccountPage() {
  const [activePlan, setActivePlan] = useState<'free' | 'starter' | 'pro' | 'studio'>('starter');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'pro' | 'studio'>('starter');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 2FA App Settings states
  const [app2FaActive, setApp2FaActive] = useState(false);
  const [show2faModal, setShow2faModal] = useState(false);
  const [code2faInput, setCode2faInput] = useState('');
  const [code2faError, setCode2faError] = useState('');

  const [currencyMode, setCurrencyMode] = useState<RegionDevise>('africa');

  // Sync with localStorage & Geo-IP
  useEffect(() => {
    const savedPlan = localStorage.getItem('fotodesk_subscription_plan');
    if (savedPlan && ['free', 'starter', 'pro', 'studio'].includes(savedPlan)) {
      setActivePlan(savedPlan as any);
      setSelectedPlan(savedPlan as any);
    }

    const saved2fa = localStorage.getItem('fotodesk_app_2fa_active');
    if (saved2fa === 'true') {
      setApp2FaActive(true);
    }

    detectCurrency().then(detected => {
      setCurrencyMode(detected);
    });
  }, []);

  const handlePlanChange = (plan: 'free' | 'starter' | 'pro' | 'studio') => {
    if (plan === activePlan) return;
    
    // Affiliate check for upgrades
    const referrer = localStorage.getItem('fotodesk_user_referrer');
    const alreadyCredited = localStorage.getItem('fotodesk_referrer_credited') === 'true';
    if (referrer && !alreadyCredited && plan !== 'free') {
      let amount = 5000;
      if (plan === 'pro') amount = 12000;
      if (plan === 'studio') amount = 25000;
      
      const savedProfile = localStorage.getItem('fotodesk_profile_v1');
      let studioName = 'Studio Parrainé';
      if (savedProfile) {
        try {
          studioName = JSON.parse(savedProfile).studioName || studioName;
        } catch(e) {}
      }
      
      recordConversion(referrer, studioName, plan, amount, currencyMode);
      localStorage.setItem('fotodesk_referrer_credited', 'true');
    }

    setActivePlan(plan);
    localStorage.setItem('fotodesk_subscription_plan', plan);
    
    // Show toast
    const planNames = {
      free: 'FotoDesk Gratuit',
      starter: 'FotoDesk Starter',
      pro: 'FotoDesk Pro',
      studio: 'FotoDesk Studio'
    };
    setToastMessage(`Votre forfait a été mis à jour avec succès vers : ${planNames[plan]}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handle2faActivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (code2faInput === '987654') {
      setApp2FaActive(true);
      localStorage.setItem('fotodesk_app_2fa_active', 'true');
      setShow2faModal(false);
      setCode2faInput('');
      setCode2faError('');
      
      setToastMessage('Double authentification (2FA) activée sur votre compte !');
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setCode2faError('Code de sécurité incorrect. Veuillez entrer 987654 pour valider la démo.');
    }
  };

  const handle2faDeactivation = () => {
    setApp2FaActive(false);
    localStorage.setItem('fotodesk_app_2fa_active', 'false');
    
    setToastMessage('ℹ️ Double authentification (2FA) désactivée de votre compte.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Dynamic calculations based on plan
  const storageUsed = 1.4; // Go
  const getStorageLimit = () => {
    switch(activePlan) {
      case 'free': return 5;
      case 'starter': return 30;
      case 'pro': return 150;
      case 'studio': return 750;
      default: return 30;
    }
  };
  const storageLimit = getStorageLimit();
  const storagePercent = Math.round((storageUsed / storageLimit) * 100);
  
  const getPlanPrice = () => {
    if (activePlan === 'free') return '0 FCFA';
    if (currencyMode === 'africa') {
      if (activePlan === 'starter') return '5 000 FCFA';
      if (activePlan === 'pro') return '12 000 FCFA';
      return '25 000 FCFA'; // studio
    } else if (currencyMode === 'europe') {
      if (activePlan === 'starter') return '8,99 €';
      if (activePlan === 'pro') return '18,99 €';
      return '38,99 €'; // studio
    } else {
      if (activePlan === 'starter') return '$9.99';
      if (activePlan === 'pro') return '$19.99';
      return '$39.99'; // studio
    }
  };
  const planPrice = getPlanPrice();

  const getPlanPriceFor = (plan: 'free' | 'starter' | 'pro' | 'studio') => {
    if (plan === 'free') {
      if (currencyMode === 'africa') return '0 FCFA';
      if (currencyMode === 'europe') return '0 €';
      return '$0';
    }
    if (currencyMode === 'africa') {
      if (plan === 'starter') return '5 000 FCFA';
      if (plan === 'pro') return '12 000 FCFA';
      return '25 000 FCFA';
    } else if (currencyMode === 'europe') {
      if (plan === 'starter') return '8,99 €';
      if (plan === 'pro') return '18,99 €';
      return '38,99 €';
    } else {
      if (plan === 'starter') return '$9.99';
      if (plan === 'pro') return '$19.99';
      return '$39.99';
    }
  };

  const planDetails = {
    free: {
      name: 'FotoDesk Gratuit',
      tagline: 'Idéal pour tester toutes les fonctionnalités de base sans engagement.',
      features: [
        "Jusqu'à 2 galeries actives simultanément",
        "5 Go de stockage SSD sécurisé pour vos photos",
        "Sélection client interactive et commentaires",
        "Téléchargement des photos en résolution HD",
        "Lien de partage public personnalisé",
        "Support client standard par ticket",
      ]
    },
    starter: {
      name: 'FotoDesk Starter',
      tagline: 'Parfait pour les photographes qui débutent leur activité commerciale.',
      features: [
        "Jusqu'à 15 galeries actives en simultané",
        "30 Go de stockage SSD + support vidéo HD",
        "Sélection client interactive & commentaires avancés",
        "Téléchargement HD et plein format pour vos clients",
        "Watermark FotoDesk discret sur vos aperçus",
        "Support client prioritaire sous 48h",
      ]
    },
    pro: {
      name: 'FotoDesk Pro',
      tagline: 'Le choix populaire pour les photographes professionnels actifs.',
      features: [
        "Galeries actives en ligne illimitées",
        "150 Go de stockage SSD de niveau entreprise",
        "Support vidéo haute définition Full HD & 4K",
        "Filigrane (Watermark) personnalisé avec votre logo",
        "Statistiques détaillées de consultation des clients",
        "Support client ultra-prioritaire sous 24h",
      ]
    },
    studio: {
      name: 'FotoDesk Studio',
      tagline: 'Pour les grands studios, les agences de production et les équipes.',
      features: [
        "Galeries actives en ligne illimitées",
        "750 Go de stockage SSD ultra-rapide",
        "Vidéos illimitées (toutes résolutions)",
        "Intégration WhatsApp Business pour notifications clients",
        "Multi-utilisateurs & accès collaborateurs",
        "Gestionnaire de compte dédié & support instantané",
      ]
    }
  };

  return (
    <div className="space-y-8 max-w-5xl relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#161925] border border-gold/30 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-slide-up">
          <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Abonnement mis à jour</p>
            <p className="text-sm font-bold text-white">{toastMessage}</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white mb-1">Votre Abonnement</h2>
        <p className="text-sm text-gray-400">Gérez vos forfaits SaaS, votre stockage de galeries et vos facturations.</p>
      </div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Subscription Status & Plans */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active plan status banner */}
          <div className="bg-gradient-to-r from-[#1E1C18] to-[#121215] border border-gold/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] bg-gold/15 text-gold font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Forfait Actif
                </span>
                <h3 className="text-2xl font-bold text-white mt-3 flex items-center gap-2">
                  {activePlan === 'free' && 'SaaS Photographe Gratuit'}
                  {activePlan === 'starter' && 'SaaS Photographe Starter'}
                  {activePlan === 'pro' && 'SaaS Photographe Pro'}
                  {activePlan === 'studio' && 'SaaS Photographe Studio'}
                  {activePlan === 'pro' && <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">Recommandé</span>}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Prochaine facturation le 12 Juillet 2026</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-extrabold text-white">{planPrice}</p>
                <p className="text-xs text-gray-500">/ mois TTC</p>
              </div>
            </div>

            {/* Storage Usage bar */}
            <div className="mt-8 space-y-2 border-t border-white/5 pt-6">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-400">Espace disque utilisé ({storageUsed} Go / {storageLimit} Go)</span>
                <span className="text-gold">{storagePercent}% utilisé</span>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gold h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Plan Options Selector */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h4 className="text-white font-bold text-lg">Choisissez un forfait FotoDesk</h4>
              
              {/* Plan Switcher Tabs */}
              <div className="flex bg-[#121214] border border-white/5 p-1 rounded-2xl w-full sm:w-auto sm:min-w-[320px]">
                {(['free', 'starter', 'pro', 'studio'] as const).map((plan) => {
                  const planNames = {
                    free: 'Gratuit',
                    starter: 'Starter',
                    pro: 'Pro',
                    studio: 'Studio',
                  };
                  const isSelected = selectedPlan === plan;
                  const isActive = activePlan === plan;
                  return (
                    <button
                      key={plan}
                      onClick={() => setSelectedPlan(plan)}
                      type="button"
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all duration-200 relative ${
                        isSelected
                          ? 'bg-gold/10 text-gold border border-gold/20 shadow-[0_2px_8px_rgba(212,169,83,0.1)]'
                          : 'text-gray-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        {planNames[plan]}
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Tab Premium Card */}
            <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-300">
              <div className="absolute right-0 top-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left side: Plan title, price and action */}
                <div className="md:col-span-5 space-y-6">
                  <div>
                    {selectedPlan === 'pro' && (
                      <span className="text-[10px] bg-gold/15 text-gold font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-3 inline-block">
                        Populaire
                      </span>
                    )}
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {planDetails[selectedPlan].name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      {planDetails[selectedPlan].tagline}
                    </p>
                  </div>
                  
                  <div className="border-t border-white/5 pt-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-white">
                        {getPlanPriceFor(selectedPlan)}
                      </span>
                      <span className="text-xs text-gray-500">/ mois TTC</span>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handlePlanChange(selectedPlan)}
                      type="button"
                      className={`w-full py-3.5 px-6 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 ${
                        activePlan === selectedPlan
                          ? 'bg-gold/10 text-gold border border-gold/20 cursor-default shadow-none'
                          : 'bg-gold hover:bg-gold-light text-background active:scale-[0.98]'
                      }`}
                    >
                      {activePlan === selectedPlan ? (
                        <>
                          <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Forfait Actuel</span>
                        </>
                      ) : (
                        <span>Activer ce forfait</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right side: Key features checklist */}
                <div className="md:col-span-7 bg-black/25 border border-white/5 rounded-2xl p-6 self-stretch flex flex-col justify-center">
                  <h5 className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">Avantages inclus :</h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-gray-400">
                    {planDetails[selectedPlan].features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-gold shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight text-gray-300">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

        {/* Double Authentification App Section */}
          <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 mt-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-white font-bold text-lg">Double Authentification (2FA via Application)</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Sécurisez les connexions à votre espace photographe en demandant un code à usage unique généré par une application tierce (Google Authenticator, Duo, Microsoft Authenticator).
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0 select-none ${
                app2FaActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-500 border border-white/5'
              }`}>
                {app2FaActive ? 'Activé' : 'Désactivé'}
              </span>
            </div>

            <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white">Application Authentificatrice</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Recommandé pour une sécurité optimale de vos galeries.</p>
              </div>
              {app2FaActive ? (
                <button 
                  onClick={handle2faDeactivation}
                  className="bg-transparent border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold py-2.5 px-6 rounded-xl transition-all text-xs"
                >
                  Désactiver la double authentification
                </button>
              ) : (
                <button 
                  onClick={() => setShow2faModal(true)}
                  className="bg-gold hover:bg-gold-light text-background font-bold py-2.5 px-6 rounded-xl transition-all shadow-gold text-xs"
                >
                  Configurer et Activer
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Invoices & Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
            <h4 className="text-white font-bold text-md mb-4">Informations de facturation</h4>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Mode de paiement</span>
                <span className="text-white font-medium">Visa •••• 4242</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Prochaine facturation</span>
                <span className="text-white font-medium">12 Juillet 2026</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Devise du compte</span>
                <span className="text-white font-medium">
                  {currencyMode === 'africa' ? 'FCFA (XOF)' : currencyMode === 'europe' ? 'EUR (€)' : 'USD ($)'}
                </span>
              </div>
              <button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white font-semibold py-2.5 px-4 rounded-xl border border-white/10 transition-colors text-center">
                Mettre à jour le paiement
              </button>
            </div>
          </div>

          <div className="bg-[#161618] border border-white/5 rounded-3xl p-6">
            <h4 className="text-white font-bold text-md mb-3">Factures Récentes</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <div>
                  <p className="text-white font-medium">12 Juin 2026</p>
                  <p className="text-[10px] text-gray-500">Starter - Mensuel</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">
                    {currencyMode === 'africa' ? '5 000 F' : currencyMode === 'europe' ? '8,99 €' : '$9.99'}
                  </p>
                  <a href="#" className="text-[10px] text-gold hover:underline">Télécharger PDF</a>
                </div>
              </div>
              <div className="flex justify-between items-center py-1">
                <div>
                  <p className="text-white font-medium">12 Mai 2026</p>
                  <p className="text-[10px] text-gray-500">Starter - Mensuel</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">
                    {currencyMode === 'africa' ? '5 000 F' : currencyMode === 'europe' ? '8,99 €' : '$9.99'}
                  </p>
                  <a href="#" className="text-[10px] text-gold hover:underline">Télécharger PDF</a>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Google Authenticator 2FA Setup Modal */}
      {show2faModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShow2faModal(false)} />
          
          <div className="relative bg-[#161925] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] animate-slide-up z-10">
            <button 
              onClick={() => {
                setShow2faModal(false);
                setCode2faInput('');
                setCode2faError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Configurer le 2FA par App</h3>
              <p className="text-xs text-gray-400 mt-1">Liez Google Authenticator, Duo ou Microsoft Authenticator à votre compte.</p>
            </div>

            <div className="space-y-5">
              {/* Step 1: scan QR code */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gold uppercase tracking-wider">Étape 1 : Scannez le QR Code</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ouvrez votre application d'authentification et scannez ce code, ou copiez la clé secrète ci-dessous.
                </p>
                
                {/* QR Code SVG Mockup */}
                <div className="w-40 h-40 bg-white p-3 rounded-2xl mx-auto my-4 flex items-center justify-center shadow-lg border border-white/5">
                  <svg className="w-full h-full text-black" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4">
                    {/* Mock QR Code Pattern */}
                    <rect x="5" y="5" width="25" height="25" strokeWidth="6" />
                    <rect x="10" y="10" width="15" height="15" fill="currentColor" />
                    <rect x="70" y="5" width="25" height="25" strokeWidth="6" />
                    <rect x="75" y="10" width="15" height="15" fill="currentColor" />
                    <rect x="5" y="70" width="25" height="25" strokeWidth="6" />
                    <rect x="10" y="75" width="15" height="15" fill="currentColor" />
                    <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                    <rect x="70" y="70" width="10" height="10" fill="currentColor" />
                    <rect x="85" y="85" width="10" height="10" fill="currentColor" />
                    <rect x="45" y="10" width="10" height="20" fill="currentColor" />
                    <rect x="10" y="45" width="20" height="10" fill="currentColor" />
                    <circle cx="80" cy="50" r="5" fill="currentColor" />
                  </svg>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Clé secrète</p>
                    <p className="text-xs font-mono text-white font-medium select-all">FOTO-DSK-2FA-AUTH-KEY</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('FOTO-DSK-2FA-AUTH-KEY');
                      setToastMessage('Clé de secours copiée !');
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="text-gold hover:text-gold-light text-xs font-semibold"
                  >
                    Copier
                  </button>
                </div>
              </div>

              {/* Step 2: enter code */}
              <form onSubmit={handle2faActivation} className="space-y-4 border-t border-white/5 pt-4">
                <p className="text-xs font-semibold text-gold uppercase tracking-wider">Étape 2 : Entrez le code à 6 chiffres</p>
                
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={code2faInput}
                  onChange={(e) => setCode2faInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest text-white focus:outline-none focus:border-gold transition-colors"
                  placeholder="000000"
                />

                <p className="text-gold/80 text-[10px] italic text-center">
                  *(Pour la démo, saisissez le code : **987654**)*
                </p>

                {code2faError && (
                  <p className="text-red-400 text-xs text-center font-medium mt-2">{code2faError}</p>
                )}

                <button 
                  type="submit"
                  className="w-full bg-gold text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-xs"
                >
                  Vérifier et Activer
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
