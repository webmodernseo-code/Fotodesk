import { mockGalleries, mockPhotos } from './mockData';
import { createClient } from './supabase/client';

export type Photo = {
  id: string;
  galleryId: string;
  url: string;
  thumbnail: string;
  selected: boolean;
  comments: string[];
  type?: 'image' | 'video';
};

export type Gallery = {
  id: string;
  title: string;
  date: string;
  coverImage: string;
  totalPhotos: number;
  selectedPhotos: number;
  clientName: string;
  status: string;
  clientUsername?: string;
  password?: string;
  expirationDate?: string;
  clientPhone?: string;
  clientEmail?: string;
  galleryType?: 'photo' | 'video' | 'mixed';
  hasSecurity?: boolean;
};

export type Profile = {
  studioName: string;
  slug: string;
  bio: string;
  location: string;
  whatsapp: string;
  categories: string[];
  photos: { id: string; url: string; category: string }[];
  avatarImage?: string;
  coverImage?: string;
  websiteLink?: string;
  facebookLink?: string;
  instagramLink?: string;
};

const DEFAULT_PROFILE: Profile = {
  studioName: "Marc Kouamé",
  slug: "marc-studio",
  bio: "Photographe passionné basé à Abidjan. Spécialisé en mariage et portrait de studio.",
  location: "Abidjan, Côte d'Ivoire",
  whatsapp: "+225 0700000000",
  categories: ["Mariage", "Studio", "Corporate"],
  photos: [
    { id: 'port-1', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80', category: 'Mariage' },
    { id: 'port-2', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80', category: 'Studio' }
  ],
  avatarImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  coverImage: "https://images.unsplash.com/photo-1452587925148-ce544e77e60d?auto=format&fit=crop&w=1200&q=80",
  websiteLink: "https://www.marckouame.com",
  facebookLink: "https://facebook.com/marckouame.photo",
  instagramLink: "https://instagram.com/marckouame.photo"
};

const STORAGE_KEYS = {
  GALLERIES: 'fotodesk_galleries_v1',
  PHOTOS: 'fotodesk_photos_v1',
  PROFILE: 'fotodesk_profile_v1'
};

const isClient = () => typeof window !== 'undefined';

// HELPER: Déterminer si Supabase est correctement configuré dans .env.local
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes('ton-projet') && !key.startsWith('eyJh'));
}

// ----------------------------------------------------
// Mappings SQL <=> JS
// ----------------------------------------------------
const mapGalleryToSql = (g: Gallery, photographerId: string) => ({
  id: g.id,
  photographer_id: photographerId,
  title: g.title,
  date: g.date,
  client_name: g.clientName,
  cover_image: g.coverImage,
  status: g.status,
  client_phone: g.clientPhone,
  client_email: g.clientEmail,
  gallery_type: g.galleryType,
  has_security: g.hasSecurity ?? !!(g.clientUsername && g.password)
});

const mapGalleryToJs = (g: any): Gallery => ({
  id: g.id,
  title: g.title,
  date: g.date,
  coverImage: g.cover_image,
  totalPhotos: 0,
  selectedPhotos: 0,
  clientName: g.client_name,
  status: g.status,
  clientUsername: g.client_username || '',
  password: g.password || '',
  expirationDate: g.expiration_date,
  clientPhone: g.client_phone,
  clientEmail: g.client_email,
  galleryType: g.gallery_type,
  hasSecurity: g.has_security
});

const mapPhotoToSql = (p: Photo) => ({
  id: p.id,
  gallery_id: p.galleryId,
  url: p.url,
  thumbnail: p.thumbnail,
  selected: p.selected,
  comments: p.comments || [],
  type: p.type || 'image'
});

const mapPhotoToJs = (p: any): Photo => ({
  id: p.id,
  galleryId: p.gallery_id,
  url: p.url,
  thumbnail: p.thumbnail,
  selected: p.selected,
  comments: p.comments || [],
  type: p.type || 'image'
});

const mapProfileToSql = (p: Profile, id: string) => ({
  id,
  full_name: p.studioName,
  business_name: p.studioName,
  slug: p.slug,
  bio: p.bio,
  location: p.location,
  whatsapp: p.whatsapp,
  categories: p.categories || [],
  avatar_url: p.avatarImage,
  cover_url: p.coverImage,
  portfolio_photos: p.photos || [],
  website_link: p.websiteLink,
  facebook_link: p.facebookLink,
  instagram_link: p.instagramLink
});

const mapProfileToJs = (p: any): Profile => ({
  studioName: p.business_name || p.full_name || "Marc Kouamé",
  slug: p.slug || "marc-studio",
  bio: p.bio || "Photographe passionné basé à Abidjan. Spécialisé en mariage et portrait de studio.",
  location: p.location || "Abidjan, Côte d'Ivoire",
  whatsapp: p.whatsapp || "+225 0700000000",
  categories: p.categories || ["Mariage", "Studio", "Corporate"],
  photos: p.portfolio_photos || [],
  avatarImage: p.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  coverImage: p.cover_url || "https://images.unsplash.com/photo-1452587925148-ce544e77e60d?auto=format&fit=crop&w=1200&q=80",
  websiteLink: p.website_link || "",
  facebookLink: p.facebook_link || "",
  instagramLink: p.instagram_link || ""
});

// ----------------------------------------------------
// Fonctions de Récupération & Sauvegarde
// ----------------------------------------------------

export async function getStoredGalleries(): Promise<Gallery[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase.from('galleries').select('*, gallery_credentials(client_username, password)');
      if (user) {
        // Si connecté en tant que photographe, RLS autorise la jointure avec gallery_credentials
        query = query.eq('photographer_id', user.id);
      } else {
        // Si accès invité, on ne demande pas la jointure de credentials car elle sera bloquée par RLS
        query = supabase.from('galleries').select('*');
      }
      
      const { data: galleries, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      if (!galleries || galleries.length === 0) return [];

      // Charger les stats des photos (total/sélectionnées) en une seule fois
      const galleryIds = galleries.map(g => g.id);
      const { data: photos } = await supabase
        .from('photos')
        .select('gallery_id, selected')
        .in('gallery_id', galleryIds);

      return galleries.map(g => {
        const matchingPhotos = photos?.filter(p => p.gallery_id === g.id) || [];
        const credArray = g.gallery_credentials;
        const creds = Array.isArray(credArray) ? (credArray[0] || {}) : (credArray || {});
        
        return {
          ...mapGalleryToJs(g),
          clientUsername: creds.client_username || '',
          password: creds.password || '',
          totalPhotos: matchingPhotos.length,
          selectedPhotos: matchingPhotos.filter(p => p.selected).length
        };
      });
    } catch (e) {
      console.error("Erreur de récupération Supabase galleries :", e);
      return [];
    }
  }

  // Fallback LocalStorage
  if (!isClient()) return mockGalleries;
  const stored = localStorage.getItem(STORAGE_KEYS.GALLERIES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.GALLERIES, JSON.stringify(mockGalleries));
    return mockGalleries;
  }
  return JSON.parse(stored);
}

export async function saveStoredGalleries(galleries: Gallery[]): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // En tant que photographe propriétaire : on upsert les galeries publiques
        const sqlGalleries = galleries.map(g => mapGalleryToSql(g, user.id));
        const { error } = await supabase.from('galleries').upsert(sqlGalleries);
        if (error) throw error;

        // On upsert également les credentials de galerie dans la table privée correspondante
        const sqlCreds = galleries.map(g => ({
          gallery_id: g.id,
          client_username: g.clientUsername || '',
          password: g.password || ''
        })).filter(c => c.client_username || c.password);

        if (sqlCreds.length > 0) {
          const { error: credError } = await supabase.from('gallery_credentials').upsert(sqlCreds);
          if (credError) throw credError;
        }
      } else {
        // En tant qu'invité (client) : on met à jour uniquement le statut (autorisé par RLS & Triggers)
        for (const g of galleries) {
          await supabase
            .from('galleries')
            .update({ status: g.status })
            .eq('id', g.id);
        }
      }
      
      if (isClient()) {
        window.dispatchEvent(new CustomEvent('fotodesk-db-updated'));
      }
      return;
    } catch (e) {
      console.error("Erreur d'upsert Supabase galleries :", e);
    }
  }

  // Fallback LocalStorage
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.GALLERIES, JSON.stringify(galleries));
  window.dispatchEvent(new CustomEvent('fotodesk-db-updated'));
}

export async function getStoredPhotos(): Promise<Photo[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase.from('photos').select('*');
      
      // Si photographe connecté, on filtre pour n'avoir que les photos de ses galeries
      if (user) {
        const { data: galleries } = await supabase
          .from('galleries')
          .select('id')
          .eq('photographer_id', user.id);
        const galleryIds = galleries?.map(g => g.id) || [];
        if (galleryIds.length === 0) return [];
        query = query.in('gallery_id', galleryIds);
      }

      const { data: photos, error } = await query;
      if (error) throw error;

      return (photos || []).map(mapPhotoToJs);
    } catch (e) {
      console.error("Erreur de récupération Supabase photos :", e);
      return [];
    }
  }

  // Fallback LocalStorage
  if (!isClient()) return mockPhotos;
  const stored = localStorage.getItem(STORAGE_KEYS.PHOTOS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(mockPhotos));
    return mockPhotos;
  }
  return JSON.parse(stored);
}

export async function saveStoredPhotos(photos: Photo[]): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const sqlPhotos = photos.map(mapPhotoToSql);
      const { error } = await supabase.from('photos').upsert(sqlPhotos);
      if (error) throw error;

      if (isClient()) {
        window.dispatchEvent(new CustomEvent('fotodesk-db-updated'));
      }
      return;
    } catch (e) {
      console.error("Erreur d'upsert Supabase photos :", e);
    }
  }

  // Fallback LocalStorage
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
  window.dispatchEvent(new CustomEvent('fotodesk-db-updated'));
}

export async function getStoredProfile(): Promise<Profile> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (profile) {
          return mapProfileToJs(profile);
        }

        // Créer un profil par défaut si inexistant
        const newProfile: Profile = {
          ...DEFAULT_PROFILE,
          studioName: user.user_metadata?.full_name || user.user_metadata?.business_name || "Nouveau Studio"
        };
        const sqlProf = mapProfileToSql(newProfile, user.id);
        await supabase.from('profiles').insert(sqlProf);
        return newProfile;
      }
    } catch (e) {
      console.error("Erreur de récupération Supabase profile :", e);
    }
  }

  // Fallback LocalStorage
  if (!isClient()) return DEFAULT_PROFILE;
  const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  }
  return JSON.parse(stored);
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) {
        console.error("Erreur getProfileBySlug Supabase :", error);
        return null;
      }
      return mapProfileToJs(profile);
    } catch (e) {
      console.error("Exception dans getProfileBySlug :", e);
      return null;
    }
  }
  
  // En mode démo, on ignore le slug et on renvoie le profil local
  return getStoredProfile();
}

export async function saveStoredProfile(profile: Profile): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sqlProf = mapProfileToSql(profile, user.id);
      const { error } = await supabase.from('profiles').upsert(sqlProf);
      if (error) throw error;

      if (isClient()) {
        window.dispatchEvent(new CustomEvent('fotodesk-db-updated'));
      }
      return;
    } catch (e) {
      console.error("Erreur d'upsert Supabase profile :", e);
    }
  }

  // Fallback LocalStorage
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('fotodesk-db-updated'));
}

export async function createNewGallery(data: Omit<Gallery, 'id' | 'coverImage' | 'totalPhotos' | 'selectedPhotos' | 'status'>): Promise<Gallery> {
  const cleanName = data.clientName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const newId = `g-${cleanName || 'client'}-${Date.now().toString().slice(-4)}`;
  const gType = data.galleryType || 'mixed';
  
  let coverImage = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
  if (gType === 'video') {
    coverImage = 'https://images.unsplash.com/photo-1452587925148-ce544e77e60d?auto=format&fit=crop&w=800&q=80';
  }

  const newGallery: Gallery = {
    ...data,
    galleryType: gType,
    id: newId,
    coverImage,
    totalPhotos: 3,
    selectedPhotos: 0,
    status: 'pending'
  };

  let newPhotosList: Photo[] = [];
  if (gType === 'photo') {
    newPhotosList = [
      { id: `p-${newId}-1`, galleryId: newId, url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80', selected: false, comments: [], type: 'image' },
      { id: `p-${newId}-2`, galleryId: newId, url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=400&q=80', selected: false, comments: [], type: 'image' },
      { id: `p-${newId}-3`, galleryId: newId, url: 'https://images.unsplash.com/photo-1507504038482-7621c37b3f9d?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1507504038482-7621c37b3f9d?auto=format&fit=crop&w=400&q=80', selected: false, comments: [], type: 'image' }
    ];
  } else if (gType === 'video') {
    newPhotosList = [
      { id: `p-${newId}-1`, galleryId: newId, url: 'https://assets.mixkit.co/videos/preview/mixkit-mother-with-her-son-in-a-field-of-flowers-40280-large.mp4', thumbnail: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=400&q=80', selected: false, comments: [], type: 'video' },
      { id: `p-${newId}-2`, galleryId: newId, url: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-through-pine-trees-4835-large.mp4', thumbnail: 'https://images.unsplash.com/photo-1452587925148-ce544e77e60d?auto=format&fit=crop&w=400&q=80', selected: false, comments: [], type: 'video' },
      { id: `p-${newId}-3`, galleryId: newId, url: 'https://assets.mixkit.co/videos/preview/mixkit-couples-hands-connecting-each-other-42194-large.mp4', thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80', selected: false, comments: [], type: 'video' }
    ];
  } else {
    newPhotosList = [
      { id: `p-${newId}-1`, galleryId: newId, url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80', selected: false, comments: [], type: 'image' },
      { id: `p-${newId}-2`, galleryId: newId, url: 'https://assets.mixkit.co/videos/preview/mixkit-mother-with-her-son-in-a-field-of-flowers-40280-large.mp4', thumbnail: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=400&q=80', selected: false, comments: [], type: 'video' },
      { id: `p-${newId}-3`, galleryId: newId, url: 'https://images.unsplash.com/photo-1507504038482-7621c37b3f9d?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1507504038482-7621c37b3f9d?auto=format&fit=crop&w=400&q=80', selected: false, comments: [], type: 'image' }
    ];
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié.");

      // Insertion galerie (sans mot de passe et username)
      const sqlGal = mapGalleryToSql(newGallery, user.id);
      const { error: galErr } = await supabase.from('galleries').insert(sqlGal);
      if (galErr) throw galErr;

      // Insertion credentials dans la table privée gallery_credentials
      const { error: credErr } = await supabase.from('gallery_credentials').insert({
        gallery_id: newId,
        client_username: data.clientUsername || '',
        password: data.password || ''
      });
      if (credErr) throw credErr;

      // Insertion photos
      const sqlPhotos = newPhotosList.map(mapPhotoToSql);
      const { error: phoErr } = await supabase.from('photos').insert(sqlPhotos);
      if (phoErr) throw phoErr;

      if (isClient()) {
        window.dispatchEvent(new CustomEvent('fotodesk-db-updated'));
      }
      return newGallery;
    } catch (e) {
      console.error("Erreur de création de galerie Supabase :", e);
    }
  }

  // LocalStorage
  const galleries = await getStoredGalleries();
  const updatedGalleries = [newGallery, ...galleries];
  await saveStoredGalleries(updatedGalleries);
  
  const photos = await getStoredPhotos();
  const updatedPhotos = [...newPhotosList, ...photos];
  await saveStoredPhotos(updatedPhotos);

  return newGallery;
}
