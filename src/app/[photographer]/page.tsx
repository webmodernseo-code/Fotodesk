"use client";

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getProfileBySlug } from '@/lib/db';

export default function PortfolioPage({ params }: { params: Promise<{ photographer: string }> }) {
  const resolvedParams = use(params);
  
  // Dynamic profile representation loaded from local storage DB
  const [profile, setProfile] = useState({
    name: 'Marc Kouamé',
    studio: "Marc Kouamé Studio d'Art",
    location: "Abidjan, Côte d'Ivoire",
    level: "Photographe Pro Premium",
    bio: "Photographe passionné basé à Abidjan. Spécialisé en mariage et portrait de studio.",
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    cover: 'https://images.unsplash.com/photo-1452587925148-ce544e77e60d?auto=format&fit=crop&w=1200&q=80',
    whatsapp: '2250700000000',
    websiteLink: '',
    facebookLink: '',
    instagramLink: '',
    categories: [
      { id: 'mariage', name: 'Mariage' },
      { id: 'studio', name: 'Studio' },
      { id: 'corporate', name: 'Corporate' }
    ],
    photos: [
      { id: 'port-1', categoryId: 'mariage', title: 'Photo Mariage', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80', tags: ['Mariage'] },
      { id: 'port-2', categoryId: 'studio', title: 'Photo Studio', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', tags: ['Studio'] }
    ]
  });

  useEffect(() => {
    const loadProfile = async () => {
      const dbData = await getProfileBySlug(resolvedParams.photographer);
      if (dbData) {
        setProfile({
          name: dbData.studioName || 'Marc Kouamé',
          studio: dbData.studioName || 'Marc Kouamé Studio',
          location: dbData.location || "Abidjan, Côte d'Ivoire",
          level: "Photographe Pro Premium",
          bio: dbData.bio || "Aucune biographie pour le moment.",
          avatar: dbData.avatarImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          cover: dbData.coverImage || 'https://images.unsplash.com/photo-1452587925148-ce544e77e60d?auto=format&fit=crop&w=1200&q=80',
          whatsapp: (dbData.whatsapp || '').replace(/[\s+]/g, ''),
          websiteLink: dbData.websiteLink || '',
          facebookLink: dbData.facebookLink || '',
          instagramLink: dbData.instagramLink || '',
          categories: (dbData.categories || []).map(cat => ({
            id: cat.toLowerCase(),
            name: cat
          })),
          photos: (dbData.photos || []).map((p, idx) => ({
            id: p.id || String(idx),
            categoryId: (p.category || 'Général').toLowerCase(),
            title: `Photo ${p.category || 'Général'}`,
            url: p.url,
            tags: [p.category || 'Général']
          }))
        });
      }
    };
    loadProfile();
  }, [resolvedParams.photographer]);

  const [activeFilter, setActiveFilter] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredPhotos = activeFilter === 'all' ? profile.photos : profile.photos.filter(p => p.categoryId === activeFilter);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setToastMessage("Lien du portfolio copié !");
      setTimeout(() => setToastMessage(null), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-32 transition-colors">
      
      {/* Top Bar Navigation */}
      <div className="absolute top-8 left-0 right-0 px-8 z-20 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-md border border-white/20 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">
          ← Retour au site
        </Link>
        <ThemeToggle />
      </div>

      {/* Cover Banner */}
      <header 
        className="relative h-[350px] sm:h-[450px] w-full border-b border-border"
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent 0%, var(--background) 100%), url('${profile.cover}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <section className="relative text-center -mt-[120px] z-10 pb-12">
          <img 
            src={profile.avatar} 
            alt={`Photo de ${profile.name}`} 
            className="w-[200px] h-[200px] rounded-full border-[8px] border-background object-cover mx-auto mb-6 shadow-2xl"
          />
          
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 text-foreground">{profile.name}</h1>
            <p className="text-xl text-[#D4A853] font-semibold mb-4">{profile.studio}</p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-text-secondary text-sm mb-8 font-medium">
              <span className="flex items-center gap-1">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {profile.location}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                {profile.level}
              </span>
            </div>
            
            <p className="text-text-secondary leading-relaxed text-base sm:text-lg mb-10">
              {profile.bio}
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a 
                href={`https://wa.me/${profile.whatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold py-3 px-8 rounded-full transition-colors text-base shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contact WhatsApp
              </a>
                          {profile.instagramLink && (
                <a 
                  href={profile.instagramLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-[#D4A853]/10 hover:border-[#D4A853] hover:text-[#D4A853] transition-all shadow-sm"
                  title="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}
              
              {profile.facebookLink && (
                <a 
                  href={profile.facebookLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-[#D4A853]/10 hover:border-[#D4A853] hover:text-[#D4A853] transition-all shadow-sm"
                  title="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                </a>
              )}
              
              {profile.websiteLink && (
                <a 
                  href={profile.websiteLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-[#D4A853]/10 hover:border-[#D4A853] hover:text-[#D4A853] transition-all shadow-sm"
                  title="Site Web"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
                </a>
              )}
              
              <button onClick={copyLink} className="w-12 h-12 flex items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-[#D4A853] hover:border-[#D4A853] hover:text-[#0A0A0B] transition-all shadow-sm" title="Copier le lien du portfolio">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </button>
            </div>
          </div>
        </section>

        {/* Categories / Filters */}
        <section>
          <div className="flex flex-wrap justify-center gap-2 mb-12 px-4">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`py-2 px-6 rounded-full text-sm font-medium transition-all ${activeFilter === 'all' ? 'bg-[#D4A853] text-[#0A0A0B] border-[#D4A853] shadow-[0_0_15px_rgba(212,168,83,0.3)]' : 'bg-card border border-border text-text-secondary hover:bg-[#D4A853]/10 hover:text-[#D4A853] hover:border-[#D4A853]/50'}`}
            >
              Tous
            </button>
            {profile.categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`py-2 px-6 rounded-full text-sm font-medium transition-all ${activeFilter === cat.id ? 'bg-[#D4A853] text-[#0A0A0B] border-[#D4A853] shadow-[0_0_15px_rgba(212,168,83,0.3)]' : 'bg-card border border-border text-text-secondary hover:bg-[#D4A853]/10 hover:text-[#D4A853] hover:border-[#D4A853]/50'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo, index) => (
              <div 
                key={photo.id} 
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-border bg-card cursor-pointer shadow-sm hover:shadow-lg transition-all"
                onClick={() => setLightboxIndex(index)}
              >
                <img 
                  src={photo.url} 
                  alt={photo.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-lg font-semibold text-white mb-2">{photo.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.map(tag => (
                      <span key={tag} className="text-xs bg-[#D4A853]/20 text-[#D4A853] px-2 py-1 rounded border border-[#D4A853]/30 backdrop-blur-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
          <button 
            className="absolute top-8 right-8 text-4xl text-white hover:text-[#D4A853] transition-colors"
            onClick={() => setLightboxIndex(null)}
          >
            &times;
          </button>
          
          <button 
            className="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white text-2xl hover:bg-[#D4A853] hover:border-[#D4A853] hover:text-[#0A0A0B] transition-all"
            onClick={() => setLightboxIndex(prev => prev === null ? null : (prev - 1 + filteredPhotos.length) % filteredPhotos.length)}
          >
            &#10094;
          </button>

          <button 
            className="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white text-2xl hover:bg-[#D4A853] hover:border-[#D4A853] hover:text-[#0A0A0B] transition-all"
            onClick={() => setLightboxIndex(prev => prev === null ? null : (prev + 1) % filteredPhotos.length)}
          >
            &#10095;
          </button>

          <div className="flex flex-col items-center justify-center w-full max-w-5xl">
            <img 
              src={filteredPhotos[lightboxIndex].url} 
              alt={filteredPhotos[lightboxIndex].title} 
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl mb-6"
            />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">{filteredPhotos[lightboxIndex].title}</h2>
              <div className="flex justify-center gap-2">
                {filteredPhotos[lightboxIndex].tags.map(tag => (
                  <span key={tag} className="text-xs bg-[#D4A853]/20 text-[#D4A853] px-2 py-1 rounded border border-[#D4A853]/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border border-[#D4A853] text-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-50 animate-bounce">
          <span className="text-green-500 flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </span>
          <span className="font-medium text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            {toastMessage}
          </span>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-32 pt-16 pb-8 border-t border-border bg-card text-center text-text-secondary">
        <p className="text-sm mb-2">Ce portfolio de démonstration est propulsé par <strong className="text-foreground">FotoDesk</strong>.</p>
        <p className="text-xs">&copy; 2026 Kouamé Assi Studio. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
