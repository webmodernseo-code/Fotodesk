"use client";

import { useState, useEffect } from 'react';
import { getStoredProfile, saveStoredProfile, Profile } from '@/lib/db';

const TAKEN_SLUGS = ['sophie', 'lea', 'jean', 'studio-lumiere', 'photo-art', 'wedding-studio'];

const SAMPLE_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507504038482-7621c37b3f9d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1472653425572-cf5b2662bb85?auto=format&fit=crop&w=400&q=80'
];

const PREMIUM_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
];

const PREMIUM_COVERS = [
  'https://images.unsplash.com/photo-1452587925148-ce544e77e60d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1472653425572-cf5b2662bb85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80'
];

export default function PortfolioManager() {
  const [profile, setProfile] = useState<Profile>({
    studioName: '',
    slug: '',
    bio: '',
    location: '',
    whatsapp: '',
    categories: [],
    photos: [],
    avatarImage: '',
    coverImage: '',
    websiteLink: '',
    facebookLink: '',
    instagramLink: ''
  });

  const [slugStatus, setSlugStatus] = useState<'idle' | 'valid' | 'taken'>('idle');
  const [newCategoryText, setNewCategoryText] = useState('');
  const [activePreviewFilter, setActivePreviewFilter] = useState('Tous');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  const handleRandomAvatar = () => {
    const current = profile.avatarImage;
    const filtered = PREMIUM_AVATARS.filter(url => url !== current);
    const next = filtered[Math.floor(Math.random() * filtered.length)];
    handleInputChange('avatarImage', next);
  };

  const handleRandomCover = () => {
    const current = profile.coverImage;
    const filtered = PREMIUM_COVERS.filter(url => url !== current);
    const next = filtered[Math.floor(Math.random() * filtered.length)];
    handleInputChange('coverImage', next);
  };

  // Load profile from localStorage database
  useEffect(() => {
    const loadProfile = async () => {
      const data = await getStoredProfile();
      setProfile(data);
      
      // Check initial slug status
      if (data.slug) {
        if (TAKEN_SLUGS.includes(data.slug.trim().toLowerCase())) {
          setSlugStatus('taken');
        } else {
          setSlugStatus('valid');
        }
      }
    };
    loadProfile();
  }, []);

  // Handle input changes
  const handleInputChange = (field: keyof Profile, value: any) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);

    if (field === 'slug') {
      const slugVal = value.trim().toLowerCase();
      if (!slugVal) {
        setSlugStatus('idle');
      } else if (TAKEN_SLUGS.includes(slugVal)) {
        setSlugStatus('taken');
      } else {
        setSlugStatus('valid');
      }
    }
  };

  // Add Category
  const handleAddCategory = () => {
    if (!newCategoryText.trim()) return;
    const cat = newCategoryText.trim();
    if (profile.categories.includes(cat)) return;
    
    const updated = {
      ...profile,
      categories: [...profile.categories, cat]
    };
    setProfile(updated);
    setNewCategoryText('');
  };

  // Remove Category
  const handleRemoveCategory = (catToRemove: string) => {
    const updated = {
      ...profile,
      categories: profile.categories.filter(c => c !== catToRemove)
    };
    setProfile(updated);
    if (activePreviewFilter === catToRemove) {
      setActivePreviewFilter('Tous');
    }
  };

  // Add highlighted photo mockup
  const handleAddPhoto = () => {
    const randomUrl = SAMPLE_PHOTO_POOL[Math.floor(Math.random() * SAMPLE_PHOTO_POOL.length)];
    const randomCat = profile.categories.length > 0 
      ? profile.categories[Math.floor(Math.random() * profile.categories.length)] 
      : 'Général';
    
    const newPhoto = {
      id: `p-port-${Date.now()}`,
      url: randomUrl,
      category: randomCat
    };

    const updated = {
      ...profile,
      photos: [...profile.photos, newPhoto]
    };
    setProfile(updated);

    setToastMessage("Photo ajoutée à votre portfolio !");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Remove Highlighted Photo
  const handleRemovePhoto = (id: string) => {
    const updated = {
      ...profile,
      photos: profile.photos.filter(p => p.id !== id)
    };
    setProfile(updated);
  };

  // Change Photo Category
  const handleChangePhotoCategory = (id: string, category: string) => {
    const updated = {
      ...profile,
      photos: profile.photos.map(p => p.id === id ? { ...p, category } : p)
    };
    setProfile(updated);
  };

  // Save Settings
  const handleSave = async () => {
    if (slugStatus === 'taken') {
      setToastMessage("Impossible d'enregistrer : cette URL est déjà prise.");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    await saveStoredProfile(profile);
    setToastMessage("Portfolio mis à jour avec succès !");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtering photos inside live mockup preview
  const filteredPreviewPhotos = activePreviewFilter === 'Tous'
    ? profile.photos
    : profile.photos.filter(p => p.category === activePreviewFilter);

  return (
    <div className="space-y-8 relative pb-20">
      {/* Toast popup */}
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Portfolio Public</h2>
          <p className="text-sm text-gray-400">Gérez votre vitrine publique et vos meilleures photos.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <a 
            href={`/${profile.slug || 'my-portfolio'}`} 
            target="_blank" 
            rel="noreferrer" 
            className="bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-5 rounded-full transition-all text-xs flex items-center space-x-2 border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Voir mon site</span>
          </a>
          <button 
            onClick={() => setShowEditor(true)}
            type="button"
            className="bg-gold hover:bg-gold-light text-background font-bold py-2.5 px-5 rounded-full transition-all text-xs flex items-center gap-1.5 shadow-[0_2px_6px_rgba(212,169,83,0.15)] border border-gold/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Personnaliser</span>
          </button>
          <button 
            onClick={handleSave}
            type="button"
            disabled={slugStatus === 'taken'}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-full transition-all border border-emerald-500/10"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col items-center bg-[#111113]/30 border border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-inner min-h-[700px] relative overflow-hidden">
        
        {/* Public Link Bar */}
        <div className="w-full max-w-[500px] mb-6 space-y-2">
          <div className="flex bg-[#161618] border border-white/10 rounded-2xl p-1.5 items-center justify-between focus-within:border-gold/40 transition-colors shadow-lg">
            <div className="flex items-center space-x-2 px-2.5 text-gray-400 shrink-0 select-none">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs text-gray-500 font-mono">https://</span>
            </div>
            <span className="text-xs text-gray-300 font-mono truncate flex-1 px-1">
              fotodesk.app/{profile.slug || 'mon-portfolio'}
            </span>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${profile.slug || ''}`);
                  setToastMessage("Lien du portfolio copié !");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                type="button"
                className="bg-white/5 hover:bg-white/10 text-xs font-semibold text-white px-3.5 py-1.5 rounded-xl border border-white/10 transition-all active:scale-95"
              >
                Copier
              </button>
              <a 
                href={`/${profile.slug || 'my-portfolio'}`} 
                target="_blank" 
                rel="noreferrer" 
                className="bg-gold text-background hover:bg-gold-light text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all active:scale-95 flex items-center space-x-1"
              >
                <span>Visiter</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-500 text-center uppercase tracking-widest mb-4">Aperçu en direct</p>
          
          {/* Mode Switcher */}
          <div className="flex bg-[#161618] border border-white/10 p-1 rounded-2xl mb-8 items-center space-x-1 shrink-0">
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                previewMode === 'mobile'
                  ? 'bg-gold text-background shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
              <span>Mobile</span>
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                previewMode === 'tablet'
                  ? 'bg-gold text-background shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
              <span>Tablette</span>
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                previewMode === 'desktop'
                  ? 'bg-gold text-background shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>Desktop</span>
            </button>
          </div>

          {/* Device Mockup Wrapper */}
          <div className="w-full flex-1 flex items-center justify-center">
            
            {/* 1. Mobile Preview (iPhone) */}
            {previewMode === 'mobile' && (
              <div className="w-full max-w-[320px] aspect-[9/18.5] bg-[#0A0A0B] rounded-[3rem] p-3 border-[6px] border-[#222] shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden animate-fade-in">
                {/* Camera Notch Mockup */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-[#222] rounded-full z-30 flex items-center justify-between px-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
                  <span className="w-8 h-1 bg-gray-900 rounded-full"></span>
                </div>

                {/* Screen Area */}
                <div className="flex-1 bg-[#090A0E] rounded-[2.5rem] overflow-y-auto px-4 pt-8 pb-4 relative flex flex-col no-scrollbar">
                  
                  {/* Header Logo */}
                  <div className="flex justify-between items-center py-4 border-b border-white/5">
                    <span className="text-white text-xs font-bold tracking-widest flex items-center gap-1">
                      <img src="/logo.png" alt="FotoDesk Logo" className="w-4 h-4 object-contain" />
                      <span>Foto<span className="text-gold">Desk</span></span>
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  {/* Cover Image inside Phone */}
                  <div className="h-24 w-full -mx-4 shrink-0 relative overflow-hidden bg-gray-900">
                    {profile.coverImage ? (
                      <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-950"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090A0E] to-transparent"></div>
                  </div>

                  {/* Profile Widget inside Phone */}
                  <div className="text-center py-4 relative z-10 -mt-10">
                    {/* Photo avatar placeholder */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gold to-indigo-500 mx-auto mb-3.5 p-0.5 flex items-center justify-center shadow-lg">
                      <div className="w-full h-full bg-[#090A0E] rounded-full overflow-hidden">
                        <img src={profile.avatarImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <h3 className="text-white text-sm font-bold tracking-tight">{profile.studioName || 'Studio Photo'}</h3>
                    <p className="text-[9px] text-gray-500 mt-1 flex items-center justify-center gap-1">
                      <svg className="w-2.5 h-2.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{profile.location || 'Localisation non définie'}</span>
                    </p>

                    <p className="text-[10px] text-gray-400 mt-3 px-2 leading-relaxed italic">
                      "{profile.bio || 'Aucune biographie pour le moment.'}"
                    </p>
                  </div>

                  {/* WhatsApp button inside Phone */}
                  {profile.whatsapp && (
                    <a 
                      href={`https://wa.me/${profile.whatsapp.replace(/[\s+]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full bg-[#25D366] hover:bg-[#1ebd59] text-white py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 mb-3"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.631-1.019-5.105-2.876-6.964-1.857-1.859-4.335-2.88-6.97-2.88-5.437 0-9.863 4.42-9.867 9.852-.001 1.73.458 3.422 1.33 4.927l-.988 3.6 3.69-.968zm11.233-7.241c-.29-.145-1.72-.848-1.986-.944-.266-.097-.459-.145-.652.145-.193.29-.747.944-.917 1.137-.17.193-.341.217-.63.072-1.349-.672-2.332-1.117-3.267-2.723-.25-.429.25-.398.715-1.325.077-.154.039-.29-.019-.406-.058-.116-.459-1.105-.63-1.516-.167-.402-.335-.348-.459-.354l-.391-.008c-.193 0-.507.072-.773.354-.266.29-1.014.99-1.014 2.415 0 1.425 1.038 2.801 1.182 2.995.145.193 2.043 3.12 4.949 4.373.69.298 1.23.476 1.65.61.694.22 1.326.19 1.825.115.556-.083 1.72-.702 1.962-1.381.242-.678.242-1.258.17-1.381-.072-.123-.266-.193-.556-.338z"/>
                      </svg>
                      <span>Contactez-moi sur WhatsApp</span>
                    </a>
                  )}

                  {/* Social networks links in Phone */}
                  <div className="flex items-center justify-center gap-3 mb-6">
                    {profile.websiteLink && (
                      <a href={profile.websiteLink} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="2" y1="12" x2="22" y2="12"></line>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                      </a>
                    )}
                    {profile.instagramLink && (
                      <a href={profile.instagramLink} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </a>
                    )}
                    {profile.facebookLink && (
                      <a href={profile.facebookLink} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    )}
                  </div>

                  {/* Categories Tabs - Interactive inside preview */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Catégories</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                      <button 
                        onClick={() => setActivePreviewFilter('Tous')}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-colors ${
                          activePreviewFilter === 'Tous'
                            ? 'bg-gold text-background'
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        Tous
                      </button>
                      {profile.categories.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setActivePreviewFilter(cat)}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-colors ${
                            activePreviewFilter === cat
                              ? 'bg-gold text-background'
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Highlighted Photos Grid inside phone */}
                  <div className="mt-4 flex-1">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Portfolio</p>
                    
                    {filteredPreviewPhotos.length === 0 ? (
                      <p className="text-[9px] text-gray-600 italic text-center py-6">Aucune photo dans cette catégorie.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {filteredPreviewPhotos.map(p => (
                          <div key={p.id} className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative shadow border border-white/5">
                            <img src={p.url} alt="Portfolio preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mobile Footer */}
                  <div className="text-center py-4 border-t border-white/5 mt-8">
                    <p className="text-[8px] text-gray-600">FotoDesk App © 2026</p>
                  </div>

                </div>
              </div>
            )}

          {/* 2. Tablet Preview (iPad) */}
          {previewMode === 'tablet' && (
            <div className="w-full max-w-[540px] aspect-[4/3] bg-[#0A0A0B] rounded-[2.5rem] p-3.5 border-[6px] border-[#222] shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden animate-fade-in">
                {/* Camera / Sensors */}
                <div className="absolute top-1/2 left-2 transform -translate-y-1/2 w-1 h-5 bg-[#222] rounded-full z-30"></div>

                {/* Screen Area */}
                <div className="flex-1 bg-[#090A0E] rounded-[1.8rem] overflow-y-auto px-5 py-4 relative flex flex-col no-scrollbar">
                  
                  {/* Header Logo */}
                  <div className="flex justify-between items-center py-2.5 border-b border-white/5 mb-3">
                    <span className="text-white text-xs font-bold tracking-widest flex items-center gap-1">
                      <img src="/logo.png" alt="FotoDesk Logo" className="w-3.5 h-3.5 object-contain" />
                      <span>Foto<span className="text-gold">Desk</span></span>
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>

                  {/* Cover Image */}
                  <div className="h-28 w-full shrink-0 relative overflow-hidden bg-gray-900 rounded-xl">
                    {profile.coverImage ? (
                      <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-950"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090A0E] to-transparent"></div>
                  </div>

                  {/* Profile Widgets */}
                  <div className="flex gap-4 py-3 relative z-10 -mt-6 items-center px-1">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gold to-indigo-500 p-0.5 flex items-center justify-center shadow-lg shrink-0">
                      <div className="w-full h-full bg-[#090A0E] rounded-full overflow-hidden">
                        <img src={profile.avatarImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white text-xs font-bold tracking-tight">{profile.studioName || 'Studio Photo'}</h3>
                      <p className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <svg className="w-2.5 h-2.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{profile.location || 'Localisation non définie'}</span>
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1 leading-relaxed italic max-w-[280px] line-clamp-2">
                        "{profile.bio || 'Aucune biographie pour le moment.'}"
                      </p>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-white/5 pb-3">
                    {profile.whatsapp ? (
                      <a 
                        href={`https://wa.me/${profile.whatsapp.replace(/[\s+]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-[#25D366] hover:bg-[#1ebd59] text-white py-1 px-3 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1"
                      >
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.631-1.019-5.105-2.876-6.964-1.857-1.859-4.335-2.88-6.97-2.88-5.437 0-9.863 4.42-9.867 9.852-.001 1.73.458 3.422 1.33 4.927l-.988 3.6 3.69-.968zm11.233-7.241c-.29-.145-1.72-.848-1.986-.944-.266-.097-.459-.145-.652.145-.193.29-.747.944-.917 1.137-.17.193-.341.217-.63.072-1.349-.672-2.332-1.117-3.267-2.723-.25-.429.25-.398.715-1.325.077-.154.039-.29-.019-.406-.058-.116-.459-1.105-.63-1.516-.167-.402-.335-.348-.459-.354l-.391-.008c-.193 0-.507.072-.773.354-.266.29-1.014.99-1.014 2.415 0 1.425 1.038 2.801 1.182 2.995.145.193 2.043 3.12 4.949 4.373.69.298 1.23.476 1.65.61.694.22 1.326.19 1.825.115.556-.083 1.72-.702 1.962-1.381.242-.678.242-1.258.17-1.381-.072-.123-.266-.193-.556-.338z"/>
                        </svg>
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <div />
                    )}
                    
                    <div className="flex items-center gap-1.5">
                      {profile.websiteLink && (
                        <a href={profile.websiteLink} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                          </svg>
                        </a>
                      )}
                      {profile.instagramLink && (
                        <a href={profile.instagramLink} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                          </svg>
                        </a>
                      )}
                      {profile.facebookLink && (
                        <a href={profile.facebookLink} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="mb-3.5">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button 
                        onClick={() => setActivePreviewFilter('Tous')}
                        className={`px-3 py-1 rounded-full text-[9px] font-bold whitespace-nowrap transition-colors ${
                          activePreviewFilter === 'Tous' ? 'bg-gold text-background' : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        Tous
                      </button>
                      {profile.categories.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setActivePreviewFilter(cat)}
                          className={`px-3 py-1 rounded-full text-[9px] font-bold whitespace-nowrap transition-colors ${
                            activePreviewFilter === cat ? 'bg-gold text-background' : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photos Grid */}
                  <div className="flex-1">
                    {filteredPreviewPhotos.length === 0 ? (
                      <p className="text-[9px] text-gray-600 italic text-center py-6">Aucune photo dans cette catégorie.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {filteredPreviewPhotos.map(p => (
                          <div key={p.id} className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative shadow border border-white/5">
                            <img src={p.url} alt="Portfolio preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="text-center py-2.5 border-t border-white/5 mt-4">
                    <p className="text-[7px] text-gray-600">FotoDesk App © 2026</p>
                  </div>
                </div>
              </div>
            )}

          {/* 3. Desktop Preview (PC) */}
          {previewMode === 'desktop' && (
            <div className="w-full max-w-[640px] bg-[#0A0A0B] rounded-t-2xl border-[6px] border-b-[18px] border-[#222] shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden animate-fade-in">
                {/* Browser bar */}
                <div className="h-6 bg-[#1A1A1D] border-b border-white/5 flex items-center px-3 space-x-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/80"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/80"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500/80"></span>
                  <div className="flex-1 bg-black/40 text-[8px] text-gray-500 rounded-md text-center py-0.5 max-w-[150px] mx-auto truncate font-mono">
                    {profile.slug ? `fotodesk.app/${profile.slug}` : 'fotodesk.app/studio'}
                  </div>
                </div>

                {/* Screen Area */}
                <div className="aspect-[16/10] bg-[#090A0E] overflow-y-auto px-5 py-4 relative flex flex-col no-scrollbar">
                  
                  {/* Cover Banner */}
                  <div className="h-20 w-full shrink-0 relative overflow-hidden bg-gray-900 rounded-lg">
                    {profile.coverImage ? (
                      <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-950"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090A0E] to-transparent"></div>
                  </div>

                  {/* Profile Detail */}
                  <div className="text-center relative z-10 -mt-6 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gold to-indigo-500 p-0.5 flex items-center justify-center shadow-lg mx-auto mb-1.5 shrink-0">
                      <div className="w-full h-full bg-[#090A0E] rounded-full overflow-hidden">
                        <img src={profile.avatarImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    
                    <h3 className="text-white text-xs font-bold tracking-tight">{profile.studioName || 'Studio Photo'}</h3>
                    <p className="text-[8px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                      <svg className="w-2.5 h-2.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{profile.location || 'Localisation non définie'}</span>
                    </p>
                    <p className="text-[8px] text-gray-500 mt-1 max-w-[280px] mx-auto leading-relaxed italic line-clamp-1">
                      "{profile.bio || 'Aucune biographie pour le moment.'}"
                    </p>

                    {/* Socials */}
                    <div className="flex items-center justify-center gap-2 mt-2.5">
                      {profile.whatsapp && (
                        <a 
                          href={`https://wa.me/${profile.whatsapp.replace(/[\s+]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-[#25D366] text-white py-0.5 px-2 rounded-full text-[8px] font-bold transition-all flex items-center gap-1"
                        >
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.631-1.019-5.105-2.876-6.964-1.857-1.859-4.335-2.88-6.97-2.88-5.437 0-9.863 4.42-9.867 9.852-.001 1.73.458 3.422 1.33 4.927l-.988 3.6 3.69-.968zm11.233-7.241c-.29-.145-1.72-.848-1.986-.944-.266-.097-.459-.145-.652.145-.193.29-.747.944-.917 1.137-.17.193-.341.217-.63.072-1.349-.672-2.332-1.117-3.267-2.723-.25-.429.25-.398.715-1.325.077-.154.039-.29-.019-.406-.058-.116-.459-1.105-.63-1.516-.167-.402-.335-.348-.459-.354l-.391-.008c-.193 0-.507.072-.773.354-.266.29-1.014.99-1.014 2.415 0 1.425 1.038 2.801 1.182 2.995.145.193 2.043 3.12 4.949 4.373.69.298 1.23.476 1.65.61.694.22 1.326.19 1.825.115.556-.083 1.72-.702 1.962-1.381.242-.678.242-1.258.17-1.381-.072-.123-.266-.193-.556-.338z"/>
                          </svg>
                          <span>Contact</span>
                        </a>
                      )}
                      {profile.websiteLink && (
                        <a href={profile.websiteLink} target="_blank" rel="noreferrer" className="w-4.5 h-4.5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                          <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                          </svg>
                        </a>
                      )}
                      {profile.instagramLink && (
                        <a href={profile.instagramLink} target="_blank" rel="noreferrer" className="w-4.5 h-4.5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                          </svg>
                        </a>
                      )}
                      {profile.facebookLink && (
                        <a href={profile.facebookLink} target="_blank" rel="noreferrer" className="w-4.5 h-4.5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex justify-center gap-1 pb-1 mb-3 scrollbar-none">
                    <button 
                      onClick={() => setActivePreviewFilter('Tous')}
                      className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold whitespace-nowrap transition-colors ${
                        activePreviewFilter === 'Tous' ? 'bg-gold text-background' : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      Tous
                    </button>
                    {profile.categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setActivePreviewFilter(cat)}
                        className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold whitespace-nowrap transition-colors ${
                          activePreviewFilter === cat ? 'bg-gold text-background' : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Photos Grid */}
                  <div className="flex-1">
                    {filteredPreviewPhotos.length === 0 ? (
                      <p className="text-[8px] text-gray-600 italic text-center py-6">Aucune photo dans cette catégorie.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {filteredPreviewPhotos.map(p => (
                          <div key={p.id} className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative shadow border border-white/5">
                            <img src={p.url} alt="Portfolio preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="text-center py-2.5 border-t border-white/5 mt-4">
                    <p className="text-[7px] text-gray-600">Ce portfolio de démonstration est propulsé par FotoDesk App © 2026</p>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>


      {/* Slide-over Editor Drawer (Right Side Panel) */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#111113] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${showEditor ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Drawer Header */}
        <div className="sticky top-0 bg-[#111113] border-b border-white/5 px-6 py-5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-md font-bold text-white">Personnalisation</h3>
            <p className="text-xs text-gray-500">Mettez à jour vos informations en temps réel.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSave}
              disabled={slugStatus === 'taken'}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-5 rounded-full text-xs transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] border border-emerald-500/10"
            >
              Enregistrer
            </button>
            <button 
              onClick={() => setShowEditor(false)}
              className="text-gray-400 hover:text-white text-2xl font-semibold leading-none p-1.5 transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          {/* Section 1: Profil Details */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-5 shadow-sm">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Informations Générales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Nom du Studio / Photographe</label>
                <input 
                  type="text" 
                  value={profile.studioName} 
                  onChange={(e) => handleInputChange('studioName', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold transition-colors"
                  placeholder="Ex: Marc Kouamé Studio"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Lien personnalisé de votre site</label>
                <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-gold transition-colors">
                  <span className="bg-black/80 text-gray-500 px-3 py-2.5 text-xs flex items-center border-r border-white/5">
                    fotodesk.app/
                  </span>
                  <input 
                    type="text" 
                    value={profile.slug} 
                    onChange={(e) => handleInputChange('slug', e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                    className="w-full bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none"
                    placeholder="nom-studio"
                  />
                </div>
                
                {/* Real-time Unique Slug feedback */}
                {slugStatus === 'taken' && (
                  <p className="text-red-400 text-[10px] font-semibold mt-1.5 flex items-center gap-1.5 animate-pulse">
                    <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Ce nom de lien est déjà réservé par un autre utilisateur.</span>
                  </p>
                )}
                {slugStatus === 'valid' && (
                  <p className="text-emerald-400 text-[10px] font-semibold mt-1.5 flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Nom de lien disponible !</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Localisation</label>
                <input 
                  type="text" 
                  value={profile.location} 
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold transition-colors"
                  placeholder="Ex: Abidjan, Côte d'Ivoire"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Contact WhatsApp</label>
                <input 
                  type="text" 
                  value={profile.whatsapp} 
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold transition-colors"
                  placeholder="Ex: +225 07070707"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Biographie</label>
                <textarea 
                  rows={2} 
                  value={profile.bio} 
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold resize-none transition-colors leading-relaxed"
                  placeholder="Présentez brièvement votre travail et votre style..."
                />
              </div>
            </div>
          </div>

          {/* Section: Photos de Profil & Couverture */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-5 shadow-sm">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Photos du Profil</h3>
            
            <div className="space-y-4">
              {/* Photo de Profil */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Photo de Profil (Avatar)</label>
                <div className="flex items-center space-x-3.5">
                  <div className="w-14 h-14 rounded-full bg-black/60 border border-white/10 overflow-hidden shrink-0">
                    {profile.avatarImage ? (
                      <img src={profile.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px]">Aucun</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input 
                      type="text" 
                      value={profile.avatarImage || ''} 
                      onChange={(e) => handleInputChange('avatarImage', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold transition-colors"
                      placeholder="Lien URL de l'image de profil"
                    />
                    <button 
                      onClick={handleRandomAvatar}
                      className="bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 text-[9px] font-bold py-1.5 px-3 rounded-lg border border-violet-500/20 transition-all uppercase tracking-wide flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-1.81-5.096L2.1 14l5.09-1.904L9 7l1.81 5.096L15.9 14l-5.087 1.904z" />
                      </svg>
                      <span>Photo Premium Aléatoire</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Photo de Couverture */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Photo de Couverture</label>
                <div className="flex flex-col space-y-1.5">
                  <div className="w-full h-16 rounded-xl bg-black/60 border border-white/10 overflow-hidden relative">
                    {profile.coverImage ? (
                      <img src={profile.coverImage} alt="Couverture" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Aucune couverture</div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={profile.coverImage || ''} 
                      onChange={(e) => handleInputChange('coverImage', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold transition-colors"
                      placeholder="Lien URL de l'image de couverture"
                    />
                    <button 
                      onClick={handleRandomCover}
                      className="bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 text-[9px] font-bold py-1.5 px-3 rounded-lg border border-violet-500/20 transition-all uppercase tracking-wide whitespace-nowrap flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-1.81-5.096L2.1 14l5.09-1.904L9 7l1.81 5.096L15.9 14l-5.087 1.904z" />
                      </svg>
                      <span>Couverture Premium</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Réseaux Sociaux & Liens */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-5 shadow-sm">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Réseaux Sociaux & Liens</h3>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Site Web</label>
                <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-gold transition-colors items-center bg-black/40">
                  <span className="bg-black/80 text-gray-500 px-3 py-2.5 text-xs flex items-center border-r border-white/5">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    value={profile.websiteLink || ''} 
                    onChange={(e) => handleInputChange('websiteLink', e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-xs text-white focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Instagram</label>
                <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-gold transition-colors items-center bg-black/40">
                  <span className="bg-black/80 text-gray-500 px-3 py-2.5 text-xs flex items-center border-r border-white/5">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    value={profile.instagramLink || ''} 
                    onChange={(e) => handleInputChange('instagramLink', e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-xs text-white focus:outline-none"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Facebook</label>
                <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-gold transition-colors items-center bg-black/40">
                  <span className="bg-black/80 text-gray-500 px-3 py-2.5 text-xs flex items-center border-r border-white/5">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    value={profile.facebookLink || ''} 
                    onChange={(e) => handleInputChange('facebookLink', e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-xs text-white focus:outline-none"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Categories Management */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Catégories & Domaines</h3>
            
            <div className="flex flex-wrap gap-2 py-1">
              {profile.categories.map(cat => (
                <span 
                  key={cat} 
                  className="bg-black/60 border border-white/5 text-gray-200 px-3 py-1.5 rounded-xl text-[10px] flex items-center space-x-1.5 shadow-sm"
                >
                  <span>{cat}</span>
                  <button 
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-gray-500 hover:text-red-400 text-xs font-bold pl-1 transition-colors"
                    title="Supprimer cette catégorie"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input 
                type="text"
                placeholder="Ajouter une catégorie..."
                value={newCategoryText}
                onChange={(e) => setNewCategoryText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory();
                }}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold transition-colors"
              />
              <button 
                onClick={handleAddCategory}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                + Ajouter
              </button>
            </div>
          </div>

          {/* Section 3: Highlighted Photos */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">Photos à la une</h3>
              <button 
                onClick={handleAddPhoto}
                className="text-gold hover:text-gold-light text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span>+ Ajouter une photo</span>
              </button>
            </div>

            {profile.photos.length === 0 ? (
              <div className="text-center py-8 bg-black/25 rounded-2xl border border-dashed border-white/5">
                <p className="text-xs text-gray-500">Aucune photo mise en avant.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {profile.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square bg-[#0c0c0e] rounded-xl overflow-hidden border border-white/5 group shadow-sm">
                    <img src={photo.url} alt="Portfolio preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    
                    {/* Dark overlay with actions */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                      <div>
                        <select 
                          value={photo.category}
                          onChange={(e) => handleChangePhotoCategory(photo.id, e.target.value)}
                          className="w-full bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-white focus:outline-none"
                        >
                          <option value="Général">Général</option>
                          {profile.categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-end">
                        <button 
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="bg-red-500/80 hover:bg-red-500 text-white rounded p-1 transition-colors"
                          title="Supprimer la photo"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-gold border border-white/5">
                      {photo.category}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="sticky bottom-0 bg-[#111113] border-t border-white/5 p-4 flex items-center justify-between z-10">
          <button 
            onClick={() => setShowEditor(false)}
            className="bg-white/5 hover:bg-white/10 text-white font-semibold py-2.5 px-5 rounded-full text-xs transition-colors"
          >
            Fermer l'éditeur
          </button>
          <button 
            onClick={handleSave}
            disabled={slugStatus === 'taken'}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-full text-xs transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] border border-emerald-500/10"
          >
            Sauvegarder les modifications
          </button>
        </div>

      </div>

      {/* Drawer Backdrop Overlay */}
      {showEditor && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
