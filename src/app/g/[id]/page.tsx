"use client";

import React, { useState, useEffect } from 'react';
import { getStoredGalleries, getStoredPhotos } from '@/lib/db';
import Link from 'next/link';
import ClientGallery from './ClientGallery';

export default function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const galleryId = resolvedParams.id;

  const [gallery, setGallery] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const galleries = await getStoredGalleries();
      const foundGallery = galleries.find(g => g.id === galleryId);
      if (foundGallery) {
        setGallery(foundGallery);
        const allPhotos = await getStoredPhotos();
        const foundPhotos = allPhotos.filter(p => p.galleryId === galleryId);
        setPhotos(foundPhotos);
      }
      setLoading(false);
    };
    loadData();
  }, [galleryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 font-sans">Chargement de la galerie...</p>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4 font-sans">Galerie introuvable</h1>
          <p className="text-gray-400 mb-8 font-sans">Le lien que vous avez suivi n'est pas valide ou a expiré.</p>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 font-medium font-sans">
            &larr; Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return <ClientGallery gallery={gallery} initialPhotos={photos} />;
}
