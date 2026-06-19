"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createNewGallery } from '@/lib/db';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // New Gallery Modal and Toast state
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const mockNotifications = [
    { id: 1, title: 'Sélection Validée 📸', desc: 'Sophie Kouassi a validé sa sélection pour "Mariage de Sophie & Marc".', time: 'Il y a 10 min' },
    { id: 2, title: 'Nouveau Parrainage 💎', desc: 'Un nouveau photographe s\'est inscrit avec votre code affilié.', time: 'Il y a 1h' },
    { id: 3, title: 'Abonnement Activé ✨', desc: 'Votre forfait "Studio" a été activé avec succès.', time: 'Hier' }
  ];

  useEffect(() => {
    const syncSession = async () => {
      const email = localStorage.getItem('fotodesk_logged_in_email') || '';
      if (email.toLowerCase() === 'founder@fotodesk.com') {
        router.push('/admin-portal');
        return;
      }

      const { isSupabaseConfigured } = await import('@/lib/db');
      if (isSupabaseConfigured()) {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
        } else if (user.email) {
          localStorage.setItem('fotodesk_logged_in_email', user.email);
        }
      }
    };
    syncSession();
  }, [router]);

  // Form inputs for new gallery
  const [titleInput, setTitleInput] = useState('');
  const [clientNameInput, setClientNameInput] = useState('');
  const [clientUsernameInput, setClientUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [clientPhoneInput, setClientPhoneInput] = useState('');
  const [clientEmailInput, setClientEmailInput] = useState('');
  const [validityDuration, setValidityDuration] = useState('1month');
  const [galleryTypeInput, setGalleryTypeInput] = useState<'photo' | 'video' | 'mixed'>('mixed');

  useEffect(() => {
    const handleOpenModal = () => setShowModal(true);
    window.addEventListener('open-new-gallery-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-new-gallery-modal', handleOpenModal);
    };
  }, []);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail === 'string') {
        setToastMessage(customEvent.detail);
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
    };
    window.addEventListener('fotodesk-toast', handleToast);
    return () => {
      window.removeEventListener('fotodesk-toast', handleToast);
    };
  }, []);

  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput || !clientNameInput || !clientUsernameInput || !passwordInput) return;

    // Calculate expirationDate
    let expirationDate = '';
    const now = new Date();
    if (validityDuration === '1week') {
      now.setDate(now.getDate() + 7);
      expirationDate = now.toISOString().split('T')[0];
    } else if (validityDuration === '2weeks') {
      now.setDate(now.getDate() + 14);
      expirationDate = now.toISOString().split('T')[0];
    } else if (validityDuration === '1month') {
      now.setMonth(now.getMonth() + 1);
      expirationDate = now.toISOString().split('T')[0];
    } else if (validityDuration === '3months') {
      now.setMonth(now.getMonth() + 3);
      expirationDate = now.toISOString().split('T')[0];
    }

    const newGallery = await createNewGallery({
      title: titleInput,
      clientName: clientNameInput,
      clientUsername: clientUsernameInput,
      password: passwordInput,
      clientPhone: clientPhoneInput,
      clientEmail: clientEmailInput,
      expirationDate,
      galleryType: galleryTypeInput,
      date: new Date().toISOString().split('T')[0]
    });

    // Reset inputs
    setTitleInput('');
    setClientNameInput('');
    setClientUsernameInput('');
    setPasswordInput('');
    setClientPhoneInput('');
    setClientEmailInput('');
    setValidityDuration('1month');
    setGalleryTypeInput('mixed');

    setShowModal(false);
    
    // Redirect to the newly created gallery configuration/detail page
    router.push(`/dashboard/galleries/${newGallery.id}`);
  };

  // Helper to determine link styling
  const getLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    
    return isActive 
      ? "flex items-center justify-between px-4 py-3 bg-[#1A1A1D] rounded-xl border border-gold/20 text-gold shadow-[0_0_15px_rgba(212,168,83,0.1)] group transition-all"
      : "flex items-center justify-between px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all";
  };

  // Helper to determine if a generic link is active (simple class)
  const getSimpleLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    return isActive
      ? "flex items-center space-x-3 px-4 py-3 bg-[#1A1A1D] text-gold border border-gold/20 rounded-xl transition-all"
      : "flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all";
  };

  const getHeaderInfo = () => {
    if (pathname === '/dashboard') return { title: 'Dashboard', subtitle: 'Vue d\'ensemble' };
    if (pathname.startsWith('/dashboard/galleries')) return { title: 'Galeries', subtitle: 'Gérez vos projets' };
    if (pathname.startsWith('/dashboard/clients')) return { title: 'Clients', subtitle: 'Suivi de vos clients' };
    if (pathname.startsWith('/dashboard/portfolio')) return { title: 'Portfolio', subtitle: 'Gestion de votre vitrine publique' };
    if (pathname.startsWith('/dashboard/settings')) return { title: 'Paramètres', subtitle: 'Préférences de l\'application' };
    if (pathname.startsWith('/dashboard/account')) return { title: 'Mon Compte', subtitle: 'Gérer votre forfait' };
    if (pathname.startsWith('/dashboard/help')) return { title: 'Aide & Support', subtitle: 'Guides et assistance' };
    return { title: 'Dashboard', subtitle: 'Vue d\'ensemble' };
  };

  const header = getHeaderInfo();

  return (
    <div className="min-h-screen bg-background text-foreground flex md:p-4 lg:p-8">
      {/* Outer App Container for that "Native App" rounded look on desktop */}
      <div className="flex-1 flex flex-col md:flex-row bg-[#0E0E11] md:border border-gray-800 md:rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 border-r border-gray-800 bg-[#121215] flex flex-col">
          <div className="p-8">
            <Link href="/" className="flex items-center space-x-1.5">
              <img src="/logo.png" alt="FotoDesk Logo" className="w-12 h-12 object-contain" />
              <span className="text-xl font-bold text-white tracking-tight">
                Foto<span className="text-gold">Desk</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-8">
            <Link href="/dashboard" className={getLinkClass('/dashboard')}>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="font-semibold">Dashboard</span>
              </div>
              {pathname === '/dashboard' && <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_#D4A853]"></div>}
            </Link>

            <Link href="/dashboard/galleries" className={getSimpleLinkClass('/dashboard/galleries')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Galleries</span>
            </Link>

            <Link href="/dashboard/clients" className={getSimpleLinkClass('/dashboard/clients')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-medium">Clients</span>
            </Link>

            <Link href="/dashboard/portfolio" className={getLinkClass('/dashboard/portfolio')}>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="font-medium">Portfolio</span>
              </div>
              {pathname === '/dashboard/portfolio' && <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_#D4A853]"></div>}
            </Link>

            <div className="pt-6 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Preferences</p>
            </div>

            <Link href="/dashboard/settings" className={getSimpleLinkClass('/dashboard/settings')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Settings</span>
            </Link>

            <Link href="/dashboard/account" className={getSimpleLinkClass('/dashboard/account')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">Account</span>
            </Link>


          </nav>
          
          <div className="p-4 border-t border-gray-800">
             <Link href="/dashboard/help" className={getSimpleLinkClass('/dashboard/help')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-sm">Help & Support</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0C]">
          {/* Header */}
          <header className="h-24 px-8 flex items-center justify-between border-b border-gray-800/50">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{header.title}</h1>
              <p className="text-sm text-gray-400">{header.subtitle}</p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="relative hidden md:block">
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-[#161618] border border-gray-800 text-sm rounded-full pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 w-64 transition-all"
                />
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-full transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] border border-emerald-500/10 text-sm"
              >
                + New Gallery
              </button>
              
              <div className="flex items-center space-x-4 border-l border-gray-800 pl-6 relative">
                
                {/* Notification Bell with Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative text-gray-400 hover:text-white transition-colors p-1 rounded-full focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A0A0C]"></span>
                  </button>

                  {/* Dropdown menu */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-[#161925] border border-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-slide-up">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                        <button 
                          onClick={() => setShowNotifications(false)}
                          className="text-[10px] text-indigo-400 hover:underline font-semibold"
                        >
                          Tout marquer comme lu
                        </button>
                      </div>
                      <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                        {mockNotifications.map((n) => (
                          <div key={n.id} className="bg-black/20 p-2.5 rounded-xl border border-white/5 space-y-1 hover:bg-black/30 transition-colors">
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-bold text-white">{n.title}</p>
                              <span className="text-[9px] text-gray-500">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-normal">{n.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar wrapped in Link */}
                <Link 
                  href="/dashboard/account"
                  className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden cursor-pointer hover:border-gold/50 transition-colors"
                  title="Mon Compte"
                >
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Profile" className="w-full h-full object-cover" />
                </Link>
              </div>
            </div>
          </header>

          {/* Page Content Scrollable */}
          <div className="flex-1 overflow-y-auto p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#161925] border border-gold/30 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-slide-up">
          <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-bold text-white">{toastMessage}</p>
        </div>
      )}

      {/* Modal Nouvelle Galerie */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-[#12141C] border border-white/8 rounded-3xl p-8 md:p-10 w-full max-w-md shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-y-auto max-h-[92vh] animate-slide-up z-10">
            
            {/* Close button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-8">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Nouvelle Galerie</h3>
              <p className="text-sm text-gray-500 mt-1">Configurez l'accès client et la durée de validité.</p>
            </div>

            <form onSubmit={handleCreateGallery} className="space-y-5">
              
              {/* Nom du projet */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wider uppercase">Nom du projet</label>
                <input 
                  type="text" 
                  required
                  value={titleInput} 
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full bg-white/4 border border-white/8 hover:border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/6 transition-all"
                  placeholder="Ex: Mariage Sophie & Marc"
                />
              </div>

              {/* Client info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wider uppercase">Nom client</label>
                  <input 
                    type="text" 
                    required
                    value={clientNameInput} 
                    onChange={(e) => setClientNameInput(e.target.value)}
                    className="w-full bg-white/4 border border-white/8 hover:border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/6 transition-all"
                    placeholder="Sophie"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wider uppercase">Identifiant</label>
                  <input 
                    type="text" 
                    required
                    value={clientUsernameInput} 
                    onChange={(e) => setClientUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="w-full bg-white/4 border border-white/8 hover:border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/6 transition-all"
                    placeholder="sophie"
                  />
                </div>
              </div>

              {/* Séparateur */}
              <div className="border-t border-white/5 pt-1" />

              {/* Mot de passe */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wider uppercase">Mot de passe d'accès</label>
                <input 
                  type="password" 
                  required
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-white/4 border border-white/8 hover:border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/6 transition-all"
                  placeholder="Mot de passe sécurisé"
                />
              </div>

              {/* Validité + Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wider uppercase">Validité</label>
                  <select 
                    value={validityDuration}
                    onChange={(e) => setValidityDuration(e.target.value)}
                    className="w-full bg-[#0D0F16] border border-white/8 hover:border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="1week">1 Semaine</option>
                    <option value="2weeks">2 Semaines</option>
                    <option value="1month">1 Mois</option>
                    <option value="3months">3 Mois</option>
                    <option value="nolimit">Illimitée</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wider uppercase">Type</label>
                  <select 
                    value={galleryTypeInput}
                    onChange={(e) => setGalleryTypeInput(e.target.value as any)}
                    className="w-full bg-[#0D0F16] border border-white/8 hover:border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="mixed">Mixte</option>
                    <option value="photo">Photos</option>
                    <option value="video">Vidéos</option>
                  </select>
                </div>
              </div>

              {/* Séparateur */}
              <div className="border-t border-white/5 pt-1" />

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wider uppercase">WhatsApp</label>
                  <input 
                    type="text" 
                    required
                    value={clientPhoneInput} 
                    onChange={(e) => setClientPhoneInput(e.target.value)}
                    className="w-full bg-white/4 border border-white/8 hover:border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/6 transition-all"
                    placeholder="+225 07..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wider uppercase">Email <span className="normal-case text-gray-600">(optionnel)</span></label>
                  <input 
                    type="email" 
                    value={clientEmailInput} 
                    onChange={(e) => setClientEmailInput(e.target.value)}
                    className="w-full bg-white/4 border border-white/8 hover:border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/6 transition-all"
                    placeholder="client@mail.com"
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_28px_rgba(16,185,129,0.4)] active:scale-[0.98] text-sm"
                >
                  Créer la galerie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
