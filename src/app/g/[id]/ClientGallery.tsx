"use client";

import { useState, useEffect } from 'react';
import { getStoredPhotos, saveStoredPhotos, getStoredGalleries, saveStoredGalleries, Gallery, Photo, isSupabaseConfigured } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';

export default function ClientGallery({
  gallery,
  initialPhotos,
}: {
  gallery: Gallery;
  initialPhotos: Photo[];
}) {
  const [photos, setPhotos] = useState<Photo[]>(
    initialPhotos.map(p => ({ ...p, comments: p.comments || [] }))
  );

  useEffect(() => {
    const syncPhotos = async () => {
      const allStoredPhotos = await getStoredPhotos();
      const galleryPhotos = allStoredPhotos.filter(p => p.galleryId === gallery.id);
      if (galleryPhotos.length > 0) {
        setPhotos(galleryPhotos.map(p => ({ ...p, comments: p.comments || [] })));
      }
    };
    syncPhotos();
  }, [gallery.id]);

  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number; filename: string } | null>(null);

  const filteredPhotos = photos.filter(photo => {
    if (mediaFilter === 'photo') return photo.type === 'image' || !photo.type;
    if (mediaFilter === 'video') return photo.type === 'video';
    return true;
  });

  // Security and Expiration States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // 2FA states
  const [code2faInput, setCode2faInput] = useState('');
  const [code2faError, setCode2faError] = useState('');

  const hasSecurity = gallery.hasSecurity ?? !!(gallery.clientUsername && gallery.password);
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa' | 'unlocked'>(
    hasSecurity ? 'credentials' : 'unlocked'
  );

  // Expiration date calculation (valid until end of expiration day)
  const isExpired = gallery.expirationDate 
    ? new Date().getTime() > new Date(gallery.expirationDate).getTime() + 24 * 60 * 60 * 1000 
    : false;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: isValid, error } = await supabase.rpc('verify_gallery_credentials', {
          p_gallery_id: gallery.id,
          p_username: usernameInput,
          p_password: passwordInput
        });
        if (error) {
          console.error("Error verifying credentials:", error);
          setLoginError('Une erreur est survenue lors de la vérification.');
          return;
        }
        if (isValid) {
          setLoginStep('2fa');
          setLoginError('');
        } else {
          setLoginError('Identifiant ou mot de passe incorrect.');
        }
      } catch (err) {
        console.error("Exception verifying credentials:", err);
        setLoginError('Une erreur est survenue.');
      }
    } else {
      if (usernameInput === gallery.clientUsername && passwordInput === gallery.password) {
        setLoginStep('2fa');
        setLoginError('');
      } else {
        setLoginError('Identifiant ou mot de passe incorrect.');
      }
    }
  };

  const handle2faSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code2faInput === '123456') { // Mock SMS code
      setLoginStep('unlocked');
      setCode2faError('');
    } else {
      setCode2faError('Code de sécurité incorrect. Veuillez réessayer.');
    }
  };

  const handleLogout = () => {
    setLoginStep('credentials');
    setUsernameInput('');
    setPasswordInput('');
    setCode2faInput('');
    setCommentText('');
  };

  // Computed state
  const selectedCount = photos.filter((p) => p.selected).length;
  const totalCount = photos.length;

  const togglePhoto = async (id: string) => {
    const updated = photos.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p));
    setPhotos(updated);

    const allPhotos = await getStoredPhotos();
    const newAllPhotos = allPhotos.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p));
    await saveStoredPhotos(newAllPhotos);

    const allGalleries = await getStoredGalleries();
    const newSelectedPhotos = updated.filter((p) => p.selected).length;
    const newGalleries = allGalleries.map((g) =>
      g.id === gallery.id ? { ...g, selectedPhotos: newSelectedPhotos } : g
    );
    await saveStoredGalleries(newGalleries);
  };

  const addComment = async (photoId: string) => {
    if (!commentText.trim()) return;
    const updated = photos.map((p) =>
      p.id === photoId
        ? { ...p, comments: [...(p.comments || []), commentText.trim()] }
        : p
    );
    setPhotos(updated);

    const allPhotos = await getStoredPhotos();
    const newAllPhotos = allPhotos.map((p) =>
      p.id === photoId
        ? { ...p, comments: [...(p.comments || []), commentText.trim()] }
        : p
    );
    await saveStoredPhotos(newAllPhotos);
    setCommentText('');
  };

  const deleteComment = async (photoId: string, index: number) => {
    const updated = photos.map((p) =>
      p.id === photoId
        ? { ...p, comments: p.comments.filter((_, i) => i !== index) }
        : p
    );
    setPhotos(updated);

    const allPhotos = await getStoredPhotos();
    const newAllPhotos = allPhotos.map((p) =>
      p.id === photoId
        ? { ...p, comments: p.comments.filter((_, i) => i !== index) }
        : p
    );
    await saveStoredPhotos(newAllPhotos);
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('CORS or network error');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.warn('Fallback link for download:', error);
      window.open(url, '_blank');
    }
  };

  const handleDownloadAll = async () => {
    const total = photos.length;
    for (let i = 0; i < total; i++) {
      const photo = photos[i];
      const extension = photo.type === 'video' ? 'mp4' : 'jpg';
      const prefix = photo.type === 'video' ? 'vidéo' : 'photo';
      const filename = `${prefix}-${gallery.title}-${photo.id}.${extension}`;
      setDownloadProgress({ current: i + 1, total, filename });
      await downloadImage(photo.url, filename);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setTimeout(() => setDownloadProgress(null), 1200);
  };

  const handleDownloadSelection = async () => {
    const selected = photos.filter((p) => p.selected);
    const total = selected.length;
    for (let i = 0; i < total; i++) {
      const photo = selected[i];
      const extension = photo.type === 'video' ? 'mp4' : 'jpg';
      const prefix = photo.type === 'video' ? 'vidéo' : 'photo';
      const filename = `${prefix}-${gallery.title}-${photo.id}.${extension}`;
      setDownloadProgress({ current: i + 1, total, filename });
      await downloadImage(photo.url, filename);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setTimeout(() => setDownloadProgress(null), 1200);
  };

  const handleValidationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationStatus('sending');
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setValidationStatus('success');
    const allGalleries = await getStoredGalleries();
    const newGalleries = allGalleries.map((g) =>
      g.id === gallery.id ? { ...g, status: 'validated' } : g
    );
    await saveStoredGalleries(newGalleries);
  };

  const handleNotifyWhatsApp = () => {
    const selectedList = photos.filter((p) => p.selected);
    const commentedList = photos.filter((p) => p.comments && p.comments.length > 0);

    let msg = `Bonjour, je viens de valider ma sélection sur *FotoDesk* pour la galerie : *${gallery.title}*.\n\n`;
    msg += `📸 *Photos sélectionnées* : ${selectedList.length} / ${photos.length}\n`;
    
    if (commentedList.length > 0) {
      msg += `💬 *Remarques / retouches demandées* :\n`;
      commentedList.forEach((p, idx) => {
        msg += `👉 Photo n°${idx + 1} (${p.id.substring(0, 8)}) : "${p.comments.join(' ; ')}"\n`;
      });
    }

    msg += `\nLien de la galerie : ${window.location.href}`;
    
    const whatsappUrl = `https://wa.me/22507070707?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  // 1. Render Expired Screen if expirationDate is exceeded
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Galerie Expirée</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            L'accès temporaire à cette galerie a expiré le <strong className="text-white">{gallery.expirationDate}</strong>.<br/>
            Veuillez contacter votre photographe pour renouveler l'accès ou télécharger les fichiers.
          </p>
          <a 
            href={`https://wa.me/22507070707?text=${encodeURIComponent(`Bonjour, l'accès à ma galerie "${gallery.title}" a expiré. Pourriez-vous le prolonger ?`)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg active:scale-95 text-sm gap-2"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contacter le photographe
          </a>
        </div>
      </div>
    );
  }

  // 2. Render Secure Lock Screen if not unlocked
  if (loginStep === 'credentials') {
    return (
      <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Galerie Protégée</h2>
            <p className="text-gray-400 mt-2 text-xs">Saisissez les accès fournis par votre prestataire</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Identifiant client</label>
              <input 
                type="text" 
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                placeholder="Ex: sophie"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Mot de passe / Code</label>
              <input 
                type="password" 
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                placeholder="••••"
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-xs text-center font-medium mt-2">{loginError}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-gold hover:bg-gold-light text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Render 2FA code verification step
  if (loginStep === '2fa') {
    return (
      <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#161925] p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Validation 2FA</h2>
            <p className="text-gray-400 mt-2 text-xs">Un code temporaire a été envoyé par **WhatsApp** au numéro de téléphone associé à votre compte client.</p>
            <p className="text-gold/80 text-[10px] italic mt-2">*(Code de test WhatsApp : 123456)*</p>
          </div>

          <form onSubmit={handle2faSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Code de sécurité à 6 chiffres</label>
              <input 
                type="text" 
                required
                maxLength={6}
                value={code2faInput}
                onChange={(e) => setCode2faInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#0A0B10] border border-white/10 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                placeholder="000000"
              />
            </div>

            {code2faError && (
              <p className="text-red-400 text-xs text-center font-medium mt-2">{code2faError}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-gold text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-gold active:scale-95 text-sm"
            >
              Vérifier le code
            </button>
            
            <button 
              type="button"
              onClick={() => setLoginStep('credentials')}
              className="w-full text-xs text-gray-500 hover:text-white transition-colors text-center"
            >
              Retour
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Render Normal Gallery
  return (
    <div className="min-h-screen bg-[#0A0B10] pb-48 md:pb-0">

      {/* === DOWNLOAD PROGRESS OVERLAY === */}
      {downloadProgress && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90vw] max-w-md">
          <div className="bg-[#161925] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gold animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-white text-xs font-bold">Téléchargement en cours...</span>
              </div>
              <span className="text-gold font-black text-sm">{downloadProgress.current} <span className="text-gray-500 font-normal">/ {downloadProgress.total}</span></span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mb-2">
              <div
                className="bg-gold h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((downloadProgress.current / downloadProgress.total) * 100)}%` }}
              />
            </div>
            <p className="text-gray-500 text-[10px] truncate">{downloadProgress.filename}</p>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-[#0A0B10]/80 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white truncate max-w-[150px] md:max-w-md">{gallery.title}</h1>
              <p className="text-xs md:text-sm text-gray-400">Sélection de {gallery.clientName}</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleDownloadAll}
                className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2.5 px-4 rounded-full transition-all border border-white/10 active:scale-95"
              >
                Télécharger tout
              </button>
              <button 
                onClick={handleDownloadSelection}
                disabled={selectedCount === 0}
                className="bg-white/10 disabled:bg-gray-800/50 disabled:text-gray-600 hover:bg-white/20 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-full transition-all border border-white/10 active:scale-95"
              >
                Télécharger la sélection ({selectedCount})
              </button>
              <div className="h-8 w-px bg-white/10 mx-2" />
              <div className="text-right">
                <p className="text-xs text-gray-400">Sélectionnées</p>
                <p className="text-lg font-bold text-indigo-400">
                  {selectedCount} <span className="text-gray-600">/ {totalCount}</span>
                </p>
              </div>
              <button 
                onClick={() => setShowValidationModal(true)}
                disabled={selectedCount === 0}
                className="bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-indigo-500 text-white font-medium py-2.5 px-6 rounded-full transition-all shadow-[0_2px_6px_rgba(79,70,229,0.12)] hover:shadow-[0_4px_12px_rgba(79,70,229,0.2)] disabled:shadow-none active:scale-95"
              >
                Valider ma sélection
              </button>

              {/* Logout button */}
              {hasSecurity && (
                <button 
                  onClick={handleLogout}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-semibold py-2.5 px-4 rounded-full transition-all active:scale-95 ml-2"
                >
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="pt-24 md:pt-28 pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {photos.length > 0 && (photos.some(p => p.type === 'video') && photos.some(p => p.type === 'image' || !p.type) || gallery.galleryType === 'mixed' || !gallery.galleryType) && (
          <div className="flex justify-center mb-8">
            <div className="flex bg-[#161925] border border-white/5 p-1 rounded-xl gap-1">
              <button 
                onClick={() => {
                  setMediaFilter('all');
                  setActivePhotoIndex(null);
                }}
                className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                  mediaFilter === 'all' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Tous
              </button>
              <button 
                onClick={() => {
                  setMediaFilter('photo');
                  setActivePhotoIndex(null);
                }}
                className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                  mediaFilter === 'photo' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Photos
              </button>
              <button 
                onClick={() => {
                  setMediaFilter('video');
                  setActivePhotoIndex(null);
                }}
                className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                  mediaFilter === 'video' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Vidéos
              </button>
            </div>
          </div>
        )}

        {filteredPhotos.length === 0 ? (
          <div className="text-center py-20 bg-[#161925]/30 rounded-3xl border border-white/5">
            <p className="text-gray-400 text-lg">Aucun média ne correspond au filtre sélectionné.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {filteredPhotos.map((photo, index) => (
              <div 
                key={photo.id} 
                onClick={() => setActivePhotoIndex(index)}
                className={`group relative bg-[#161925] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  photo.selected 
                    ? 'border-2 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.2)] transform -translate-y-1' 
                    : 'border-2 border-transparent hover:border-white/10 hover:-translate-y-1'
                }`}
              >
                <div className="relative aspect-[4/5] bg-gray-800 overflow-hidden">
                  <div 
                    className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out ${
                      photo.selected ? 'scale-110' : 'group-hover:scale-105'
                    }`}
                    style={{ backgroundImage: `url(${photo.thumbnail})` }}
                  />
                  {/* Video Play Badge overlay */}
                  {photo.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Watermark Overlay */}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                    <span className="text-white/20 text-3xl md:text-4xl font-extrabold rotate-[-30deg] tracking-widest select-none">
                      FOTODESK
                    </span>
                  </div>
                  
                  {/* Selected Overlay Gradient */}
                  <div className={`absolute inset-0 bg-indigo-900/20 transition-opacity duration-300 ${
                    photo.selected ? 'opacity-100' : 'opacity-0'
                  }`} />
                </div>
                
                {/* Heart / Select Badge on Hover/Active */}
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePhoto(photo.id);
                    }}
                    className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-300 shadow-lg ${
                      photo.selected 
                        ? 'bg-indigo-600 text-white scale-100' 
                        : 'bg-black/40 backdrop-blur-md text-white/50 border border-white/10 hover:bg-black/60 hover:text-white scale-95 hover:scale-100'
                    }`}
                  >
                    <svg className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${photo.selected ? 'scale-110' : 'scale-100'}`} fill={photo.selected ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={photo.selected ? 0 : 2} d={photo.selected ? "M5 13l4 4L19 7" : "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"} />
                    </svg>
                  </button>
                </div>

                {/* Comment Counter Badge */}
                {photo.comments && photo.comments.length > 0 && (
                  <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white border border-white/10 px-2.5 py-1 rounded-full text-xs flex items-center space-x-1.5 shadow-md">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-semibold">{photo.comments.length}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Bar - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 p-4 pb-6 bg-gradient-to-t from-[#0A0B10] via-[#0A0B10]/95 to-transparent">
        <div className="bg-[#161925] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Sélection</p>
              <p className="text-base font-bold text-white">
                {selectedCount} <span className="text-gray-500 font-normal">/ {totalCount}</span>
              </p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handleDownloadSelection}
                disabled={selectedCount === 0}
                className="bg-white/5 disabled:bg-gray-900 disabled:text-gray-600 border border-white/10 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all"
              >
                Télécharger ({selectedCount})
              </button>
              <button 
                onClick={() => setShowValidationModal(true)}
                disabled={selectedCount === 0}
                className="bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium py-2 px-5 rounded-xl transition-all active:scale-95 text-sm"
              >
                Valider
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
            <button 
              onClick={handleDownloadAll}
              className="text-indigo-400 font-medium hover:underline text-left"
            >
              Télécharger toute la galerie ({totalCount})
            </button>
            {hasSecurity && (
              <button 
                onClick={handleLogout}
                className="text-red-400 font-bold hover:underline text-right"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Photo Detail & Comments Modal */}
      {activePhotoIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => setActivePhotoIndex(null)} />
          
          <div className="relative bg-[#161925] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl z-10">
            {/* Close button */}
            <button 
              onClick={() => setActivePhotoIndex(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-20 bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Left Column: Image/Video view */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[500px]">
              {filteredPhotos[activePhotoIndex].type === 'video' ? (
                <video 
                  src={filteredPhotos[activePhotoIndex].url} 
                  controls 
                  playsInline 
                  className="max-h-[50vh] md:max-h-[80vh] max-w-full z-10"
                  poster={filteredPhotos[activePhotoIndex].thumbnail}
                />
              ) : (
                <img 
                  src={filteredPhotos[activePhotoIndex].url} 
                  alt="Aperçu" 
                  className="max-h-[50vh] md:max-h-[80vh] max-w-full object-contain"
                />
              )}
              {/* Watermark */}
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                <span className="text-white/15 text-3xl md:text-5xl font-extrabold rotate-[-30deg] tracking-widest select-none">
                  FOTODESK
                </span>
              </div>
              
              {/* Navigation arrows inside image view */}
              <button 
                onClick={() => setActivePhotoIndex((activePhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length)}
                className="absolute left-4 w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-indigo-600 transition-all font-bold"
              >
                &#10094;
              </button>
              <button 
                onClick={() => setActivePhotoIndex((activePhotoIndex + 1) % filteredPhotos.length)}
                className="absolute right-4 w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-indigo-600 transition-all font-bold"
              >
                &#10095;
              </button>
            </div>

            {/* Right Column: Information, Select and Comments */}
            <div className="w-full md:w-[380px] p-6 border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-between bg-[#121420]/50 max-h-[40vh] md:max-h-[90vh]">
              <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
                <h3 className="text-lg font-bold text-white mb-1">Détails du média</h3>
                <p className="text-xs text-gray-400 mb-4">Média {activePhotoIndex + 1} sur {filteredPhotos.length}</p>

                {/* Actions row: Select and Download */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => togglePhoto(filteredPhotos[activePhotoIndex!].id)}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center space-x-2 border ${
                      filteredPhotos[activePhotoIndex!].selected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={filteredPhotos[activePhotoIndex!].selected ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{filteredPhotos[activePhotoIndex!].selected ? 'Sélectionnée' : 'Sélectionner'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const photo = filteredPhotos[activePhotoIndex!];
                      const extension = photo.type === 'video' ? 'mp4' : 'jpg';
                      const prefix = photo.type === 'video' ? 'video' : 'photo';
                      downloadImage(photo.url, `${prefix}-${gallery.title}-${photo.id}.${extension}`);
                    }}
                    className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl font-medium text-sm transition-all flex items-center justify-center active:scale-95"
                    title={filteredPhotos[activePhotoIndex!].type === 'video' ? "Télécharger cette vidéo" : "Télécharger cette photo"}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>

                {/* Comments Section */}
                <div className="border-t border-white/5 pt-4 flex-1 flex flex-col min-h-0">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Remarques & retouches</h4>
                  
                  {/* Comments list */}
                  <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[120px]">
                    {!filteredPhotos[activePhotoIndex!].comments || filteredPhotos[activePhotoIndex!].comments.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">Aucune remarque sur cette photo pour le moment.</p>
                    ) : (
                      filteredPhotos[activePhotoIndex!].comments.map((comment, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-start group animate-fade-in">
                          <p className="text-xs text-gray-300 leading-relaxed break-words flex-1 pr-2">{comment}</p>
                          <button
                            onClick={() => deleteComment(filteredPhotos[activePhotoIndex!].id, idx)}
                            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Supprimer la remarque"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Form Input at the bottom of panel */}
              <div className="border-t border-white/10 pt-4 bg-[#161925] mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Éclaircir le fond, retoucher le visage..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addComment(filteredPhotos[activePhotoIndex!].id);
                      }
                    }}
                    className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => addComment(filteredPhotos[activePhotoIndex!].id)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowValidationModal(false);
            setValidationStatus('idle');
          }} />
          
          <div className="relative bg-[#161925] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl overflow-hidden transform transition-all">
            {validationStatus === 'success' ? (
              <div className="text-center py-8">
                <button 
                  onClick={() => {
                    setShowValidationModal(false);
                    setValidationStatus('idle');
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Sélection Validée !</h3>
                <p className="text-gray-400 text-sm mb-6">Votre photographe a été notifié de votre sélection. Vous pouvez également lui envoyer un récapitulatif directement par WhatsApp.</p>
                
                <button
                  onClick={handleNotifyWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Notifier par WhatsApp</span>
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setShowValidationModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Valider ma sélection</h3>
                  <p className="text-gray-400 text-sm">
                    Vous êtes sur le point de valider votre sélection de <strong>{selectedCount} média{selectedCount > 1 ? 's' : ''}</strong>.
                  </p>
                  {photos.filter(p => p.comments && p.comments.length > 0).length > 0 && (
                    <p className="text-indigo-400 text-xs mt-2">
                      💡 Vos remarques/demandes de retouche seront également transmises au photographe.
                    </p>
                  )}
                </div>

                <form onSubmit={handleValidationSubmit} className="space-y-6">
                  <button 
                    type="submit"
                    disabled={validationStatus === 'sending'}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_2px_6px_rgba(79,70,229,0.12)] active:scale-95 flex items-center justify-center text-sm"
                  >
                    {validationStatus === 'sending' ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Confirmer la sélection'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
