-- Schéma complet et sécurisé pour FotoDesk SaaS

-- Activation de l'extension pgcrypto pour générer des UUIDs si besoin
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table : Profiles (Liée à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  business_name TEXT,
  slug TEXT UNIQUE,
  bio TEXT,
  location TEXT,
  whatsapp TEXT,
  categories TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  cover_url TEXT,
  portfolio_photos JSONB DEFAULT '[]'::jsonb,
  website_link TEXT,
  facebook_link TEXT,
  instagram_link TEXT,
  subscription_plan TEXT DEFAULT 'starter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table : Galleries (Sans mot de passe pour éviter toute fuite en clair)
CREATE TABLE IF NOT EXISTS public.galleries (
  id TEXT PRIMARY KEY, -- TEXT pour supporter les clés générées du type g-wedding-01-1234
  photographer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date TEXT,
  client_name TEXT,
  cover_image TEXT,
  status TEXT DEFAULT 'pending', -- pending, validated, delivered
  client_phone TEXT,
  client_email TEXT,
  gallery_type TEXT DEFAULT 'mixed', -- photo, video, mixed
  has_security BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table : Gallery Credentials (Table isolée et sécurisée)
CREATE TABLE IF NOT EXISTS public.gallery_credentials (
  gallery_id TEXT REFERENCES public.galleries(id) ON DELETE CASCADE PRIMARY KEY,
  client_username TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table : Photos
CREATE TABLE IF NOT EXISTS public.photos (
  id TEXT PRIMARY KEY, -- TEXT pour supporter les IDs personnalisés générés par le client
  gallery_id TEXT REFERENCES public.galleries(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  selected BOOLEAN DEFAULT false,
  comments TEXT[] DEFAULT '{}',
  type TEXT DEFAULT 'image', -- image, video
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer la sécurité Row Level Security (RLS) sur les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Policies pour Profiles
-- ----------------------------------------------------
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Les profils publics sont lisibles par tout le monde" 
  ON public.profiles FOR SELECT USING (true);

-- ----------------------------------------------------
-- Policies pour Galleries
-- ----------------------------------------------------
CREATE POLICY "Les photographes peuvent tout faire sur leurs galeries" 
  ON public.galleries FOR ALL USING (auth.uid() = photographer_id);
  
CREATE POLICY "Tout le monde peut lire une galerie via son ID" 
  ON public.galleries FOR SELECT USING (true);

CREATE POLICY "Les clients peuvent modifier le statut d'une galerie" 
  ON public.galleries FOR UPDATE USING (true);

-- ----------------------------------------------------
-- Policies pour Gallery Credentials
-- ----------------------------------------------------
CREATE POLICY "Les photographes gèrent les credentials de leurs galeries" 
  ON public.gallery_credentials FOR ALL USING (EXISTS (
    SELECT 1 FROM public.galleries 
    WHERE public.galleries.id = public.gallery_credentials.gallery_id 
      AND public.galleries.photographer_id = auth.uid()
  ));

-- ----------------------------------------------------
-- Policies pour Photos
-- ----------------------------------------------------
CREATE POLICY "Les photographes gèrent les photos de leurs galeries" 
  ON public.photos FOR ALL USING (EXISTS (
    SELECT 1 FROM public.galleries 
    WHERE public.galleries.id = public.photos.gallery_id 
      AND public.galleries.photographer_id = auth.uid()
  ));

CREATE POLICY "Tout le monde peut lire les photos d'une galerie" 
  ON public.photos FOR SELECT USING (true);

CREATE POLICY "Tout le monde peut mettre à jour la sélection et les commentaires" 
  ON public.photos FOR UPDATE USING (true);

-- ----------------------------------------------------
-- RPC : Vérification sécurisée des identifiants d'une galerie
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_gallery_credentials(
  p_gallery_id TEXT, 
  p_username TEXT, 
  p_password TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.gallery_credentials 
    WHERE gallery_id = p_gallery_id 
      AND client_username = p_username 
      AND password = p_password
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------
-- Triggers : Anti-Tampering (Contrôle des modifications clients)
-- ----------------------------------------------------

-- Enforce client update restrictions on galleries
CREATE OR REPLACE FUNCTION public.prevent_gallery_tampering()
RETURNS trigger AS $$
BEGIN
  -- Si l'utilisateur n'est pas le photographe propriétaire de la galerie
  IF auth.uid() IS NULL OR auth.uid() <> OLD.photographer_id THEN
    -- L'invité ne peut modifier QUE le status (et seulement vers 'validated')
    IF OLD.id <> NEW.id 
      OR OLD.photographer_id <> NEW.photographer_id 
      OR OLD.title <> NEW.title 
      OR OLD.date <> NEW.date 
      OR OLD.cover_image <> NEW.cover_image 
      OR OLD.created_at <> NEW.created_at 
      OR OLD.gallery_type <> NEW.gallery_type 
      OR OLD.has_security <> NEW.has_security 
    THEN
      RAISE EXCEPTION 'Les clients ne peuvent pas modifier les paramètres de la galerie.';
    END IF;
    
    IF NEW.status <> 'validated' THEN
      RAISE EXCEPTION 'Les clients ne peuvent que valider la galerie.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_gallery_update
  BEFORE UPDATE ON public.galleries
  FOR EACH ROW EXECUTE FUNCTION public.prevent_gallery_tampering();

-- Enforce client update restrictions on photos
CREATE OR REPLACE FUNCTION public.prevent_photo_tampering()
RETURNS trigger AS $$
BEGIN
  -- Si l'utilisateur n'est pas le photographe propriétaire de la galerie
  IF NOT EXISTS (
    SELECT 1 FROM public.galleries 
    WHERE public.galleries.id = NEW.gallery_id 
      AND public.galleries.photographer_id = auth.uid()
  ) THEN
    -- L'invité ne peut modifier QUE les colonnes 'selected' et 'comments'
    IF OLD.id <> NEW.id 
      OR OLD.gallery_id <> NEW.gallery_id 
      OR OLD.url <> NEW.url 
      OR OLD.thumbnail <> NEW.thumbnail 
      OR OLD.type <> NEW.type 
      OR OLD.created_at <> NEW.created_at 
    THEN
      RAISE EXCEPTION 'Les clients ne peuvent modifier que la sélection et les commentaires.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_photo_update
  BEFORE UPDATE ON public.photos
  FOR EACH ROW EXECUTE FUNCTION public.prevent_photo_tampering();

-- ----------------------------------------------------
-- Trigger automatique lors de la création d'un utilisateur Auth
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, business_name, subscription_plan)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'business_name', ''),
    COALESCE(new.raw_user_meta_data->>'subscription_plan', 'starter')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
