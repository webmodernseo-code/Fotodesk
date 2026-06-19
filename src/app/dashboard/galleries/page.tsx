"use client";

import { useState, useEffect } from 'react';
import { getStoredGalleries, Gallery } from '@/lib/db';
import Link from 'next/link';

export default function GalleriesListPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'video' | 'mixed'>('all');

  useEffect(() => {
    const loadGalleries = async () => {
      const dbGalleries = await getStoredGalleries();
      setGalleries(dbGalleries);
    };
    loadGalleries();

    window.addEventListener('fotodesk-db-updated', loadGalleries);
    return () => {
      window.removeEventListener('fotodesk-db-updated', loadGalleries);
    };
  }, []);

  const handleOpenModal = () => {
    window.dispatchEvent(new CustomEvent('open-new-gallery-modal'));
  };

  const filterTabs = [
    { key: 'all' as const, label: 'Tous', icon: '⊞', count: galleries.length },
    { key: 'video' as const, label: 'Vidéo', icon: '🎬', count: galleries.filter(g => g.galleryType === 'video').length },
    { key: 'photo' as const, label: 'Photo', icon: '📸', count: galleries.filter(g => g.galleryType === 'photo').length },
    { key: 'mixed' as const, label: 'Mixte', icon: '🎛️', count: galleries.filter(g => g.galleryType === 'mixed').length },
  ];

  const filteredGalleries = typeFilter === 'all'
    ? galleries
    : galleries.filter(g => g.galleryType === typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Vos Galeries & Projets</h2>
          <p className="text-sm text-gray-400">Gérez, partagez et suivez la sélection de vos clients.</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] border border-emerald-500/10 text-sm shrink-0"
        >
          + Nouvelle Galerie
        </button>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex bg-[#121214] border border-white/5 p-1 rounded-2xl gap-0.5 w-full sm:w-auto sm:inline-flex">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setTypeFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex-1 sm:flex-none justify-center ${
              typeFilter === tab.key
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              typeFilter === tab.key ? 'bg-gold/20 text-gold' : 'bg-white/5 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filteredGalleries.length === 0 ? (
        <div className="text-center py-20 bg-[#161618] border border-white/5 rounded-3xl">
          {galleries.length === 0 ? (
            <>
              <p className="text-gray-400 text-lg">Aucune galerie n'a encore été créée.</p>
              <button 
                onClick={handleOpenModal}
                className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-full transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] border border-emerald-500/10 text-sm"
              >
                Créer ma première galerie
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-400">Aucun projet de type « {typeFilter} » trouvé.</p>
              <button onClick={() => setTypeFilter('all')} className="mt-3 text-xs text-gold hover:underline font-semibold">
                Voir tous les projets
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGalleries.map((gallery) => {
            let statusText = "En attente";
            let statusStyle = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/10";
            if (gallery.status === 'validated') {
              statusText = "Validée";
              statusStyle = "bg-green-500/10 text-green-400 border border-green-500/10";
            } else if (gallery.status === 'delivered') {
              statusText = "Livrée";
              statusStyle = "bg-blue-500/10 text-blue-400 border border-blue-500/10";
            }

            const typeLabel = gallery.galleryType === 'video' ? '🎬 Vidéo'
              : gallery.galleryType === 'photo' ? '📸 Photo'
              : '🎛️ Mixte';

            const typeBadge = gallery.galleryType === 'video'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : gallery.galleryType === 'photo'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-gold/15 text-gold border border-gold/20';

            return (
              <div 
                key={gallery.id} 
                className="bg-[#161618] border border-white/5 rounded-3xl p-4 flex flex-col justify-between hover:border-white/10 hover:shadow-2xl transition-all"
              >
                <div>
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-gray-800 mb-4 relative">
                    <img src={gallery.coverImage} alt={gallery.title} className="w-full h-full object-cover" />
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded border ${statusStyle}`}>
                      {statusText}
                    </span>
                    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm ${typeBadge}`}>
                      {typeLabel}
                    </span>
                  </div>
                  
                  <h3 className="text-white font-bold text-lg leading-snug mb-1">{gallery.title}</h3>
                  <p className="text-xs text-gray-500 mb-4">Client: {gallery.clientName} • {gallery.date}</p>
                </div>

                <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">
                      {gallery.galleryType === 'video' ? 'Vidéos sélectionnées' : 'Médias sélectionnés'}
                    </p>
                    <p className="text-sm font-bold text-gold">{gallery.selectedPhotos} <span className="text-gray-600 font-normal">/ {gallery.totalPhotos}</span></p>
                  </div>
                  
                  <Link 
                    href={`/dashboard/galleries/${gallery.id}`}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors"
                  >
                    Gérer
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
