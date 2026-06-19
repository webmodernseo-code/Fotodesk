"use client";

import React, { useState, useEffect } from 'react';
import { getStoredGalleries, saveStoredGalleries, getStoredPhotos, saveStoredPhotos, Photo, Gallery } from '@/lib/db';
import Link from 'next/link';

export default function GalleryDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const galleryId = resolvedParams.id;

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');

  // Sync logic with localStorage
  useEffect(() => {
    const loadData = async () => {
      const galleries = await getStoredGalleries();
      const foundGallery = galleries.find(g => g.id === galleryId);
      if (foundGallery) {
        setGallery(foundGallery);
      }
      
      const allPhotos = await getStoredPhotos();
      const foundPhotos = allPhotos.filter(p => p.galleryId === galleryId);
      setPhotos(foundPhotos);
    };

    loadData();
    window.addEventListener('fotodesk-db-updated', loadData);
    return () => {
      window.removeEventListener('fotodesk-db-updated', loadData);
    };
  }, [galleryId]);

  if (!gallery) {
    return <div className="text-white p-8">Galerie introuvable ou en cours de chargement...</div>;
  }

  // Expiration / validity computation
  let validityStatus = "Non spécifiée";
  let validityColor = "text-gray-400";
  if (gallery.expirationDate) {
    const expTime = new Date(gallery.expirationDate).getTime() + 24 * 60 * 60 * 1000;
    const nowTime = new Date().getTime();
    const diffTime = expTime - nowTime;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      validityStatus = `Expirée depuis ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''} (le ${gallery.expirationDate})`;
      validityColor = "text-red-500 font-bold animate-pulse";
    } else {
      validityStatus = `${diffDays} jour${diffDays > 1 ? 's' : ''} restant${diffDays > 1 ? 's' : ''} (jusqu'au ${gallery.expirationDate})`;
      validityColor = "text-green-500 font-semibold";
    }
  }

  // Clipboard copy helper
  const handleCopyLink = () => {
    const clientUrl = `${window.location.origin}/g/${gallery.id}`;
    navigator.clipboard.writeText(clientUrl);
    setToastMessage("🔗 Lien de la galerie copié !");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mock Media (Photo/Video) Uploader helper
  const handleMockUpload = async () => {
    const mockPhotosPool = [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507504038482-7621c37b3f9d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1472653425572-cf5b2662bb85?auto=format&fit=crop&w=800&q=80'
    ];

    const mockVideosPool = [
      {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-mother-with-her-son-in-a-field-of-flowers-40280-large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=400&q=80'
      },
      {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-through-pine-trees-4835-large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1452587925148-ce544e77e60d?auto=format&fit=crop&w=400&q=80'
      },
      {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-couples-hands-connecting-each-other-42194-large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80'
      }
    ];

    let uploadType: 'image' | 'video' = 'image';
    if (gallery.galleryType === 'photo') {
      uploadType = 'image';
    } else if (gallery.galleryType === 'video') {
      uploadType = 'video';
    } else {
      uploadType = Math.random() > 0.4 ? 'image' : 'video';
    }

    let url = '';
    let thumbnail = '';

    if (uploadType === 'image') {
      url = mockPhotosPool[Math.floor(Math.random() * mockPhotosPool.length)];
      thumbnail = url.replace('&w=800&q=80', '&w=400&q=80');
    } else {
      const selectedVideo = mockVideosPool[Math.floor(Math.random() * mockVideosPool.length)];
      url = selectedVideo.url;
      thumbnail = selectedVideo.thumbnail;
    }

    const newPhotoId = `p-${gallery.id}-${Date.now()}`;
    const newPhoto: Photo = {
      id: newPhotoId,
      galleryId: gallery.id,
      url,
      thumbnail,
      selected: false,
      comments: [],
      type: uploadType
    };

    // Save to database
    const allPhotos = await getStoredPhotos();
    const updatedPhotos = [newPhoto, ...allPhotos];
    await saveStoredPhotos(updatedPhotos);

    // Update gallery totals
    const allGalleries = await getStoredGalleries();
    const updatedGalleries = allGalleries.map(g => {
      if (g.id === gallery.id) {
        return { ...g, totalPhotos: g.totalPhotos + 1 };
      }
      return g;
    });
    await saveStoredGalleries(updatedGalleries);

    setToastMessage(uploadType === 'image' ? "Nouvelle photo ajoutée !" : "Nouvelle vidéo ajoutée !");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const clientGalleryUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/g/${gallery.id}`
    : `http://localhost:3000/g/${gallery.id}`;
  
  let whatsappMsg = `Bonjour *${gallery.clientName}*,\n\nVoici vos accès sécurisés pour consulter et sélectionner vos photos sur *FotoDesk* :\n\n`;
  whatsappMsg += `🔗 *Lien* : ${clientGalleryUrl}\n`;
  whatsappMsg += `👤 *Identifiant* : ${gallery.clientUsername}\n`;
  whatsappMsg += `🔑 *Mot de passe* : ${gallery.password}\n\n`;
  whatsappMsg += `Pour des raisons de sécurité, un code de validation à 6 chiffres vous sera envoyé sur ce numéro WhatsApp lors de votre connexion.\n\n`;
  whatsappMsg += `Merci pour votre confiance !`;

  const whatsappShareUrl = `https://wa.me/${gallery.clientPhone?.replace(/[\s+]/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;

  let emailBody = `Bonjour ${gallery.clientName},\n\nVoici vos accès sécurisés pour votre galerie photo FotoDesk :\n\n`;
  emailBody += `Lien : ${clientGalleryUrl}\n`;
  emailBody += `Identifiant : ${gallery.clientUsername}\n`;
  emailBody += `Mot de passe : ${gallery.password}\n\n`;
  emailBody += `Pour des raisons de sécurité, un code de validation à 6 chiffres vous sera également envoyé par WhatsApp sur votre numéro lors de votre connexion.\n\n`;
  emailBody += `Cordialement,\nVotre Photographe`;

  const mailtoUrl = gallery.clientEmail 
    ? `mailto:${gallery.clientEmail}?subject=${encodeURIComponent(`Vos accès FotoDesk — ${gallery.title}`)}&body=${encodeURIComponent(emailBody)}`
    : "#";

  const filteredPhotos = photos.filter(photo => {
    if (mediaFilter === 'photo') return photo.type === 'image' || !photo.type;
    if (mediaFilter === 'video') return photo.type === 'video';
    return true;
  });

  return (
    <div className="space-y-6 relative pb-20">
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

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/galleries" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mb-2 inline-block">
            &larr; Retour aux galeries
          </Link>
          <h1 className="text-3xl font-bold text-white">{gallery.title}</h1>
          <p className="text-gray-400 mt-1">Client: {gallery.clientName} • Statut:{' '}
            <span className={`font-semibold ${
              gallery.status === 'validated' ? 'text-green-400' : 
              gallery.status === 'delivered' ? 'text-blue-400' : 'text-yellow-400'
            }`}>
              {gallery.status === 'validated' ? 'Validée' : gallery.status === 'delivered' ? 'Livrée' : 'En attente'}
            </span>
          </p>
        </div>
        <button 
          onClick={handleCopyLink}
          className="bg-gold hover:bg-gold-light text-background font-bold py-2.5 px-6 rounded-full transition-all shadow-gold hover:shadow-gold-lg text-sm shrink-0"
        >
          Copier le lien client
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#161925] p-5 rounded-3xl border border-white/5">
          <p className="text-gray-400 text-sm">Médias uploadés</p>
          <p className="text-2xl font-bold text-white mt-1">{gallery.totalPhotos}</p>
        </div>
        <div className="bg-[#161925] p-5 rounded-3xl border border-white/5">
          <p className="text-gray-400 text-sm">Sélectionnés</p>
          <p className="text-2xl font-bold text-gold mt-1">{gallery.selectedPhotos} <span className="text-gray-600 font-normal">/ {gallery.totalPhotos}</span></p>
        </div>
        <div className="bg-[#161925] p-5 rounded-3xl border border-white/5 flex items-center justify-center">
          <button 
            onClick={handleMockUpload}
            className="w-full py-3 border border-white/10 hover:bg-white/5 text-white rounded-2xl transition-all text-xs font-semibold"
          >
            + Ajouter des photos / vidéos
          </button>
        </div>
      </div>

      {/* Access and validity settings */}
      {gallery.clientUsername && (
        <div className="bg-[#161925] border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Accès Client & Validité Temporelle</h3>
            <span className="text-[10px] text-gold font-medium bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-md uppercase">2FA Double Facteur par WhatsApp</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-6 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Identifiant Client</p>
              <p className="text-white font-mono font-medium">{gallery.clientUsername}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Mot de passe / Code</p>
              <p className="text-white font-mono font-medium">{gallery.password}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Numéro WhatsApp</p>
              <p className="text-white font-mono font-medium">{gallery.clientPhone || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">E-mail</p>
              <p className="text-white font-mono font-medium truncate" title={gallery.clientEmail}>{gallery.clientEmail || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Type de galerie</p>
              <p className="text-gold font-bold">
                {gallery.galleryType === 'photo' ? '📸 Photos' : gallery.galleryType === 'video' ? '🎥 Vidéos' : '🎛️ Mixte'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Statut de validité</p>
              <p className={validityColor}>{validityStatus}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a 
              href={whatsappShareUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors inline-flex items-center gap-2 shadow-md"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Envoyer par WhatsApp</span>
            </a>
            {gallery.clientEmail && (
              <a 
                href={mailtoUrl}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 00-2 2z" />
                </svg>
                <span>Envoyer par E-mail</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Photos Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-white">Aperçu des médias</h2>
          
          {/* Media Type Filter Tabs */}
          {(gallery.galleryType === 'mixed' || !gallery.galleryType) && (
            <div className="flex bg-[#161925] border border-white/5 p-1 rounded-xl gap-1">
              <button 
                onClick={() => setMediaFilter('all')}
                className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                  mediaFilter === 'all' 
                    ? 'bg-gold text-background shadow-md shadow-gold/15' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Tous
              </button>
              <button 
                onClick={() => setMediaFilter('photo')}
                className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                  mediaFilter === 'photo' 
                    ? 'bg-gold text-background shadow-md shadow-gold/15' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Photos
              </button>
              <button 
                onClick={() => setMediaFilter('video')}
                className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                  mediaFilter === 'video' 
                    ? 'bg-gold text-background shadow-md shadow-gold/15' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Vidéos
              </button>
            </div>
          )}
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="text-center py-12 bg-[#161925] rounded-3xl border border-white/5">
            <p className="text-gray-400">Aucun média ne correspond au filtre sélectionné.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredPhotos.map(photo => (
              <div key={photo.id} className="bg-[#161925] border border-white/5 rounded-3xl overflow-hidden group flex flex-col shadow-lg">
                <div className="relative aspect-square bg-gray-800 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundImage: `url(${photo.thumbnail})` }}
                  />
                  {/* Play overlay for video */}
                  {photo.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Overlay for selected photos */}
                  {photo.selected && (
                    <div className="absolute inset-0 bg-gold/10 border-2 border-gold" />
                  )}
                  {/* Selection Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    {photo.selected ? (
                      <span className="bg-gold text-background text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                        Sélectionnée
                      </span>
                    ) : (
                      <span className="bg-black/50 text-white text-[10px] font-medium px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        Non sélectionnée
                      </span>
                    )}
                  </div>
                </div>
                {/* Comments display */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  {photo.comments && photo.comments.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-gold text-xs font-bold mb-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Remarques ({photo.comments.length}) :</span>
                      </div>
                      <div className="max-h-[100px] overflow-y-auto space-y-1.5 pr-1">
                        {photo.comments.map((comment, i) => (
                          <p key={i} className="text-[11px] text-gray-300 bg-white/5 rounded-xl px-3 py-1.5 border border-white/5 leading-tight break-words">
                            {comment}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 italic text-center py-2">Aucune remarque</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
