"use client";

import { useState, useEffect } from 'react';
import { getStoredGalleries, getStoredPhotos, Gallery, Photo } from '@/lib/db';
import Link from 'next/link';

export default function DashboardPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activePlan, setActivePlan] = useState<'free' | 'starter' | 'pro' | 'studio'>('starter');
  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'video' | 'mixed'>('all');

  const loadData = async () => {
    const dbGalleries = await getStoredGalleries();
    const dbPhotos = await getStoredPhotos();
    setGalleries(dbGalleries);
    setPhotos(dbPhotos);
    const savedPlan = localStorage.getItem('fotodesk_subscription_plan');
    if (savedPlan && ['free', 'starter', 'pro', 'studio'].includes(savedPlan)) {
      setActivePlan(savedPlan as any);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('fotodesk-db-updated', loadData);
    return () => {
      window.removeEventListener('fotodesk-db-updated', loadData);
    };
  }, []);

  const totalGalleries = galleries.length;
  const totalPhotos = photos.length;
  const activeClients = Array.from(new Set(galleries.map(g => g.clientName))).length;
  const videoProjects = galleries.filter(g => g.galleryType === 'video').length;

  const getStorageLimit = () => {
    switch (activePlan) {
      case 'free': return 5;
      case 'starter': return 30;
      case 'pro': return 150;
      case 'studio': return 750;
      default: return 30;
    }
  };
  const storageLimit = getStorageLimit();
  const storageUsed = Number((1.4 + (totalPhotos * 0.015)).toFixed(2));
  const storagePercent = Math.min(Math.round((storageUsed / storageLimit) * 100), 100);

  const handleOpenModal = () => {
    window.dispatchEvent(new CustomEvent('open-new-gallery-modal'));
  };

  const filteredGalleries = typeFilter === 'all'
    ? galleries
    : galleries.filter(g => g.galleryType === typeFilter);

  const filterTabs = [
    { key: 'all' as const, label: 'Tous', icon: '⊞' },
    { key: 'video' as const, label: 'Vidéo', icon: '🎬' },
    { key: 'photo' as const, label: 'Photo', icon: '📸' },
    { key: 'mixed' as const, label: 'Mixte', icon: '🎛️' },
  ];

  return (
    <div className="space-y-10">
      
      {/* Statistics */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Statistiques Générales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-[#1A1A1D] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
            <p className="text-gray-400 text-sm mb-2">Projets Totaux</p>
            <p className="text-3xl font-bold text-white mb-2">{totalGalleries}</p>
            <p className="text-xs text-green-500 font-medium">+100% <span className="text-gray-500">en ligne</span></p>
          </div>

          <div className="bg-[#1A1A1D] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
            <p className="text-gray-400 text-sm mb-2">Projets Vidéo</p>
            <p className="text-3xl font-bold text-white mb-2">{videoProjects}</p>
            <p className="text-xs text-purple-400 font-medium">🎬 <span className="text-gray-500">montages livrés</span></p>
          </div>

          <div className="bg-[#1A1A1D] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
            <p className="text-gray-400 text-sm mb-2">Espace utilisé</p>
            <p className="text-3xl font-bold text-white mb-2">{storageUsed} <span className="text-xl text-gray-500 font-normal">Go</span> <span className="text-sm text-gray-500 font-normal">/ {storageLimit} Go</span></p>
            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-gold h-1.5 rounded-full transition-all duration-500" style={{ width: `${storagePercent}%` }}></div>
            </div>
          </div>

          <div className="bg-[#1A1A1D] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
            <p className="text-gray-400 text-sm mb-2">Clients Actifs</p>
            <p className="text-3xl font-bold text-white mb-2">{activeClients}</p>
            <p className="text-xs text-gray-400 font-medium">Sélection sécurisée 2FA</p>
          </div>

        </div>
      </section>

      {/* Projects with type filter */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2 className="text-lg font-bold text-white">Projets Actifs</h2>

          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex bg-[#121214] border border-white/5 p-1 rounded-2xl gap-0.5">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setTypeFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    typeFilter === tab.key
                      ? 'bg-gold/10 text-gold border border-gold/20'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {totalGalleries > 0 && (
              <Link href="/dashboard/galleries" className="text-xs text-gold hover:underline font-semibold whitespace-nowrap">
                Tout voir →
              </Link>
            )}
          </div>
        </div>
        
        {filteredGalleries.length === 0 && totalGalleries === 0 ? (
          <div className="bg-[#161618] border border-gray-800 rounded-3xl p-8 text-center">
            <p className="text-gray-400 text-sm mb-4">Vous n'avez pas encore créé de projet.</p>
            <button 
              onClick={handleOpenModal}
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-full transition-all text-xs border border-emerald-500/10"
            >
              + Créer un projet
            </button>
          </div>
        ) : filteredGalleries.length === 0 ? (
          <div className="bg-[#161618] border border-gray-800 rounded-3xl p-8 text-center">
            <p className="text-gray-400 text-sm">Aucun projet de ce type pour l'instant.</p>
            <button
              onClick={() => setTypeFilter('all')}
              className="mt-3 text-xs text-gold hover:underline font-semibold"
            >
              Voir tous les projets
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGalleries.slice(0, 6).map((gallery) => {
              const progress = gallery.totalPhotos > 0
                ? Math.round((gallery.selectedPhotos / gallery.totalPhotos) * 100)
                : 0;
              
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
                <div key={gallery.id} className="bg-[#161618] border border-gray-800 rounded-3xl p-4 hover:border-gray-700 transition-all hover:shadow-2xl flex flex-col justify-between">
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
                    
                    <div className="px-2">
                      <h3 className="text-white font-bold text-lg mb-1 truncate">{gallery.title}</h3>
                      <div className="flex justify-between text-sm text-gray-500 mb-4">
                        <span>Client : {gallery.clientName}</span>
                        <span>{gallery.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-2 border-t border-gray-800 pt-4 mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">
                        {gallery.galleryType === 'video' ? 'Vidéos sélectionnées' : 'Médias sélectionnés'}
                      </p>
                      <p className="text-xs font-bold text-gold mt-0.5">
                        {gallery.selectedPhotos} <span className="text-gray-600 font-normal">/ {gallery.totalPhotos}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-[10px] font-semibold text-white">
                        {progress}%
                      </div>
                      <Link 
                        href={`/dashboard/galleries/${gallery.id}`}
                        className="bg-gold/10 hover:bg-gold/20 text-gold font-bold py-1.5 px-3 rounded-lg text-[10px] border border-gold/20 transition-all"
                      >
                        Gérer
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      
    </div>
  );
}
