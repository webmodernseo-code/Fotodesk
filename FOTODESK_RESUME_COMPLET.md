# 📸🎬 FotoDesk — Résumé Complet du SaaS
*Mis à jour le 18 Juin 2026*

> Document de référence exhaustif : architecture, fonctionnalités, utilisateurs, logique métier et état technique actuel.

---

## 🧭 C'est quoi FotoDesk ?

**FotoDesk** est un **SaaS (Software as a Service)** destiné à **deux types de créatifs** :
1. **Les photographes professionnels** qui veulent partager leurs photos avec leurs clients pour qu'ils fassent leur sélection
2. **Les monteurs vidéo** qui veulent livrer leurs montages à leurs clients de façon professionnelle et sécurisée

**Le problème qu'il résout :**
Après un shooting photo ou une prestation de montage vidéo, le créatif doit partager ses fichiers avec son client. Sans outil dédié, cela se fait par WhatsApp, e-mail, WeTransfer, Dropbox… ce qui est peu professionnel, non sécurisé et impossible à suivre.

**La solution FotoDesk :**
Le photographe ou monteur crée une **galerie/livraison privée sécurisée**, la partage via un lien unique à son client. Le client se connecte avec un mot de passe, visualise ses photos/vidéos, en sélectionne, laisse des commentaires. Le créatif voit tout en temps réel depuis son tableau de bord.

**Marchés cibles :**
- Afrique de l'Ouest (Côte d'Ivoire, Sénégal, Cameroun, Mali…) — tarifs en FCFA
- Europe — tarifs en €
- USA — tarifs en $

---

## 🏗️ Stack Technique

| Élément | Technologie |
|---|---|
| Framework | **Next.js 15/16** (App Router) |
| Langage | **TypeScript + TSX** |
| Style | **TailwindCSS** + CSS custom |
| Police | **Inter** (Google Fonts, sans-serif) |
| Base de données | **Supabase** (PostgreSQL) + **localStorage** (Hybride, Démo automatique) |
| Hébergement cible | **Vercel** |
| Couleur principale | **Or / Gold** (`#D4A853`) sur fond sombre (`#0A0A0C`) |

> ⚠️ **Important** : L'application supporte désormais la connexion réelle à **Supabase** (Auth & Database). Si aucune clé Supabase n'est configurée dans `.env.local`, elle bascule de manière transparente sur le stockage LocalStorage (Mode Démo).

---

## 👥 Les 4 Types d'Utilisateurs

### 1. 🔐 Le Fondateur (toi)
- **Qui c'est** : Le créateur de FotoDesk. Pas un photographe, pas un client.
- **Comment il se connecte** :
  - Via `/login` avec l'email `founder@fotodesk.com` + mot de passe `admin2026`
  - Après la 2FA (code `654321`), il est **automatiquement redirigé** vers `/admin-portal` (le "Vault")
- **Ce qu'il voit dans son Vault** :
  - MRR (revenus mensuels simulés calculés automatiquement)
  - Liste de tous les photographes/monteurs inscrits (avec leur forfait)
  - Liste de tous les affiliés et leurs performances
  - Les demandes de retrait des affiliés → il peut les **approuver** en un clic
- **URL** : `http://localhost:3000/admin-portal`

---

### 2. 📸🎬 Le Photographe / Monteur Vidéo
- **Qui c'est** : Un créatif (photographe OU monteur vidéo) qui s'abonne à FotoDesk pour livrer ses travaux à ses clients.
- **Comment il se connecte** :
  - Via `/login` avec n'importe quel email + n'importe quel mot de passe (démo)
  - Code 2FA : `654321`
  - Redirigé vers `/dashboard`
- **Ce qu'il fait dans son dashboard** :
  - Voir ses statistiques (projets totaux, projets vidéo, stockage, clients actifs)
  - **Filtrer ses projets** par type : ⊞ Tous / 🎬 Vidéo / 📸 Photo / 🎛️ Mixte
  - Créer des galeries/livraisons privées pour ses clients (photo, vidéo ou mixte)
  - Gérer chaque galerie (voir les sélections client, modifier les infos)
  - Gérer son portfolio public
  - Gérer ses clients
  - Choisir son abonnement
  - Activer la double authentification (2FA)
- **URL** : `http://localhost:3000/dashboard`

---

### 3. 💎 L'Affilié (Parrain)
- **Qui c'est** : Une personne qui fait la promotion de FotoDesk et gagne des commissions.
- **Comment il se connecte** :
  - Via `/affiliate/login` avec son email
  - Compte de test : `affiliate@fotodesk.com`
  - Ou inscription sur `/affiliate/register`
- **Ce qu'il fait dans son dashboard** :
  - Voir ses stats (clics, inscriptions, ventes, commissions)
  - Copier son lien d'affilié unique (ex: `fotodesk.com/register?ref=marc`)
  - Copier son code promo (ex: `MARC20`)
  - Demander un retrait de ses gains
- **Règles de retrait** :
  - Max 2 retraits par mois calendaire
  - Délai de 10 jours ouvrés (14 calendaires) entre chaque retrait
  - Méthodes : Wave, Orange Money, MTN MoMo, Moov Money, PayPal
- **URL** : `http://localhost:3000/affiliate/dashboard`

---

### 4. 🖼️🎥 Le Client Final
- **Qui c'est** : La personne à qui le créatif a envoyé un lien de galerie (mariée, entreprise, acteur, producteur…).
- **Comment il accède** :
  - Via un lien unique : `http://localhost:3000/g/[id-galerie]`
  - Il entre le mot de passe défini par le créatif
- **Ce qu'il fait** :
  - Voir ses photos et/ou vidéos
  - Sélectionner (cocher) les médias qu'il veut garder
  - Laisser des commentaires
  - Télécharger (selon forfait du créatif)

---

## 🗂️ Structure des Pages (Routes Next.js)

```
src/app/
├── page.tsx                    → Redirige vers la landing page publique
├── layout.tsx                  → Layout racine (police Inter, meta tags)
├── globals.css                 → Styles globaux
│
├── login/page.tsx              → Connexion 2 étapes : email/mdp → 2FA
│                                 (bifurcation auto Fondateur ↔ Photographe)
├── register/page.tsx           → Inscription (capte ref= affilié dans URL)
├── forgot-password/page.tsx    → Mot de passe oublié
│
├── dashboard/                  → Espace Photographe/Monteur
│   ├── layout.tsx              → Sidebar, header, modal "Nouvelle Galerie", notifs
│   ├── page.tsx                → Stats + projets actifs avec filtres type
│   ├── galleries/
│   │   ├── page.tsx            → Liste galeries avec filtres ⊞ 🎬 📸 🎛️
│   │   └── [id]/page.tsx       → Gestion d'une galerie spécifique
│   ├── clients/page.tsx        → Liste des clients
│   ├── portfolio/page.tsx      → Portfolio public du créatif
│   ├── settings/page.tsx       → Paramètres
│   ├── account/page.tsx        → Abonnement, 2FA, facturation
│   └── help/page.tsx           → Aide & Support
│
├── g/[id]/                     → Galerie client (accès public avec mot de passe)
│   ├── page.tsx                → Chargement de la galerie
│   └── ClientGallery.tsx       → Affichage galerie (sélection, commentaires, filtres)
│
├── admin-portal/page.tsx       → Portail Fondateur (Vault) — non indexé
│
├── affiliate/
│   ├── login/page.tsx          → Connexion Affilié
│   ├── register/page.tsx       → Inscription Affilié
│   └── dashboard/page.tsx      → Dashboard Affilié
│
├── [photographer]/page.tsx     → Portfolio public (URL: /marc-studio)
│
├── legal/page.tsx              → Mentions légales
├── privacy/page.tsx            → Politique de confidentialité
└── terms/page.tsx              → CGU
```

---

## 🗄️ La "Base de Données" (localStorage)

Tout est stocké dans le navigateur. Voici les clés utilisées :

| Clé localStorage | Contenu |
|---|---|
| `fotodesk_galleries_v1` | Tableau JSON de toutes les galeries/livraisons |
| `fotodesk_photos_v1` | Tableau JSON de tous les médias (photos + vidéos) |
| `fotodesk_profile_v1` | Profil du créatif connecté |
| `fotodesk_affiliates_v1` | Tableau des affiliés inscrits |
| `fotodesk_conversions_v1` | Tableau des ventes parrainées |
| `fotodesk_payouts_v1` | Tableau des demandes de retrait |
| `fotodesk_simulated_photographers_v1` | Utilisateurs inscrits (visible dans le Vault) |
| `fotodesk_active_affiliate_session` | ID de l'affilié connecté |
| `fotodesk_admin_session` | `"true"` si le fondateur est connecté |
| `fotodesk_logged_in_email` | Email du créatif connecté |
| `fotodesk_subscription_plan` | Forfait actif (`free/starter/pro/studio`) |
| `fotodesk_app_2fa_active` | `"true"` si la 2FA par app est activée |
| `fotodesk_user_referrer` | Code de parrainage utilisé à l'inscription |
| `fotodesk_referrer_credited` | `"true"` si la commission a déjà été attribuée |

> ⚠️ **Pour réinitialiser les données de démo** : F12 → Application → Local Storage → Clear. Les données par défaut se rechargent automatiquement au prochain accès.

---

## 🎬📸 Types de Projets / Galeries

Chaque projet peut être de 3 types. C'est valable autant pour les photographes que pour les monteurs vidéo :

| Type | Badge | Usage |
|---|---|---|
| 📸 **Photo** | Bleu | Galeries de photos uniquement (shootings, reportages, corporate…) |
| 🎬 **Vidéo** | Violet | Livraison de montages vidéo, court-métrages, clips, films d'entreprise… |
| 🎛️ **Mixte** | Or | Projets combinant photos et vidéos (mariages, événements…) |

Les filtres **⊞ 🎬 📸 🎛️** sont disponibles sur :
- Le **Dashboard** (section "Projets Actifs")
- La **page Galeries** (avec compteur par type sur chaque onglet)

---

## 💰 Les Abonnements (Tarification)

Le prix s'adapte automatiquement à la région via détection Geo-IP.

| Forfait | Afrique (FCFA) | Europe (€) | USA ($) | Galeries | Stockage |
|---|---|---|---|---|---|
| **Gratuit** | 0 | 0 | $0 | 2 galeries | 5 Go |
| **Starter** | 5 000/mois | 8,99 €/mois | $9.99/mois | 15 galeries | 30 Go |
| **Pro** | 12 000/mois | 18,99 €/mois | $19.99/mois | Illimitées | 150 Go |
| **Studio** | 25 000/mois | 38,99 €/mois | $39.99/mois | Illimitées | 750 Go |

---

## 🔁 Le Système d'Affiliation

- Chaque affilié a un **lien unique** (`/register?ref=marc`) et un **code promo** (`MARC20`)
- Quand un créatif s'inscrit via ce lien, le code est capturé et stocké
- Quand ce créatif passe à un forfait payant → commission automatique : **20% du montant payé**
- L'affilié peut demander un virement via Wave, Orange Money, MTN, Moov, PayPal
- Le fondateur voit les demandes dans son Vault et les approuve manuellement
- Contraintes : max 2 retraits/mois, délai de 14 jours entre chaque retrait

---

## 🔐 Système d'Authentification

### Photographe / Monteur Vidéo
1. `/login` → Email + mot de passe (n'importe lesquels en démo) → email sauvegardé en localStorage
2. Code 2FA → `654321` → redirection vers `/dashboard`

### Fondateur
1. `/login` → `founder@fotodesk.com` + `admin2026`
2. Code 2FA → `654321` → redirection automatique vers `/admin-portal`
3. Flag `fotodesk_admin_session = "true"` posé en localStorage

### Affilié
- `/affiliate/login` → email uniquement (pas de mot de passe en démo)
- Session stockée dans `fotodesk_active_affiliate_session`

---

## 🔑 Tous les Identifiants de Test

### Fondateur / Admin (Vault)
| Champ | Valeur |
|---|---|
| URL | `http://localhost:3000/login` (redirection auto) |
| URL directe | `http://localhost:3000/admin-portal` |
| Email | `founder@fotodesk.com` |
| Mot de passe | `admin2026` |
| Code 2FA | `654321` |

### Photographe / Monteur Vidéo
| Champ | Valeur |
|---|---|
| URL | `http://localhost:3000/login` |
| Email | N'importe lequel (ex: `photo@test.com`) |
| Mot de passe | N'importe lequel (ex: `123456`) |
| Code 2FA | `654321` |

### Affilié
| Champ | Valeur |
|---|---|
| URL login | `http://localhost:3000/affiliate/login` |
| URL inscription | `http://localhost:3000/affiliate/register` |
| Email test | `affiliate@fotodesk.com` |
| Code promo test | `MARC20` |
| Lien affilié test | `http://localhost:3000/register?ref=marc` |

### Galeries Clients (4 projets de démo)

| Projet | Type | URL | Mot de passe |
|---|---|---|---|
| Mariage de Sophie & Marc | 🎛️ Mixte | `/g/g-wedding-01` | `1234` |
| Shooting Mode Studio (Léa) | 🎛️ Mixte | `/g/g-portrait-02` | `abcd` |
| **Court-métrage — Horizon Films** | 🎬 Vidéo | `/g/g-video-03` | `video2026` |
| **Corporate Branding — TechCorp CI** | 📸 Photo | `/g/g-photo-04` | `corp2026` |

### 2FA App (dans les paramètres compte)
- Code d'activation : `987654`

---

## 🧩 Composants & Fichiers Clés

| Fichier | Rôle |
|---|---|
| [layout.tsx (dashboard)](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/fotodesk/src/app/dashboard/layout.tsx) | Sidebar, header, modal "Nouvelle Galerie", notifications |
| [dashboard/page.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/fotodesk/src/app/dashboard/page.tsx) | Stats + projets actifs avec filtres type |
| [galleries/page.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/fotodesk/src/app/dashboard/galleries/page.tsx) | Liste galeries avec filtres et compteurs |
| [db.ts](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/fotodesk/src/lib/db.ts) | Toute la logique de base de données simulée |
| [mockData.ts](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/fotodesk/src/lib/mockData.ts) | 4 galeries de démo + 11 médias (photos + vidéos) |
| [affiliateDb.ts](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/fotodesk/src/lib/affiliateDb.ts) | Toute la logique du système d'affiliation |
| [FounderPortalClient.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/fotodesk/src/components/FounderPortalClient.tsx) | Le portail Vault du fondateur complet |
| [account/page.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/fotodesk/src/app/dashboard/account/page.tsx) | Abonnements, tarification, 2FA, facturation |
| [login/page.tsx](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/fotodesk/src/app/login/page.tsx) | Connexion 2 étapes avec bifurcation Fondateur |
| [TEST_CREDENTIALS.md](file:///c:/Users/monep/OneDrive/Desktop/Tous%20mes%20dossiers/PROJET%20WEB/fotodesk/TEST_CREDENTIALS.md) | Fichier résumé de tous les accès de test |
| `public/landing.html` | Page d'accueil publique (HTML statique) |
| `public/logo.png` | Logo FotoDesk utilisé partout |

---

## 📊 Données de Démo Pré-chargées

### 4 Galeries / Projets (dans mockData.ts)

| ID | Titre | Client | Type | Statut | Mdp |
|---|---|---|---|---|---|
| `g-wedding-01` | Mariage de Sophie & Marc | Sophie | 🎛️ Mixte | En attente | `1234` |
| `g-portrait-02` | Shooting Mode Studio | Léa | 🎛️ Mixte | Validée | `abcd` |
| `g-video-03` | Court-métrage — Horizon Films | Horizon Films | 🎬 Vidéo | En attente | `video2026` |
| `g-photo-04` | Corporate Branding — TechCorp CI | TechCorp CI | 📸 Photo | Validée | `corp2026` |

### Médias (11 au total)

| Galerie | Photos | Vidéos |
|---|---|---|
| Sophie (mariage) | 2 | 1 |
| Léa (studio) | 1 | 1 |
| Horizon Films (montage) | 0 | 3 |
| TechCorp CI (corporate) | 3 | 0 |

### Affilié de démo

| Champ | Valeur |
|---|---|
| Nom | Marc Parrainage |
| Email | `affiliate@fotodesk.com` |
| Code parrainage | `marc` / Code promo : `MARC20` |
| Solde retirable | 45 000 FCFA |
| Total gagné | 60 000 FCFA |
| Conversions | 3 ventes parrainées |

### Photographes/monteurs inscrits (visibles dans le Vault)

| Studio | Email | Forfait | Parrainé par |
|---|---|---|---|
| Studio Lumière | lumiere@studio.com | Pro | marc |
| Kreativ Agency | contact@kreativ.ci | Starter | marc |
| Abidjan Wedding | photos@abidjanwedding.com | Studio | marc |
| Elegance Portrait | elegance@gmail.com | Gratuit | — |
| Douala Studio | douala@photo.cm | Pro | — |

---

## 🎨 Charte Graphique

| Élément | Valeur |
|---|---|
| Fond principal | `#0A0A0C` (noir profond) |
| Fond cartes | `#161618` / `#12141C` |
| Or (accent principal) | `#D4A853` — classes `text-gold`, `bg-gold`, `border-gold` |
| Vert actions | `emerald-600` (boutons "Créer galerie") |
| Violet (vidéo) | `purple-500/20` — badge type Vidéo |
| Bleu (photo) | `blue-500/20` — badge type Photo |
| Police | **Inter, sans-serif** (Google Fonts, forcée partout) |
| Arrondis | `rounded-2xl` / `rounded-3xl` (design pill premium) |
| Animations | `animate-slide-up` pour modals et toasts |

---

## ⚠️ État Actuel & Limitations Connues

1. **Backend hybride connecté à Supabase** : Si les clés d'environnement Supabase sont renseignées dans `.env.local`, l'application fonctionne avec la base de données réelle en temps réel. Sinon, elle bascule automatiquement en "Mode Démo" via `localStorage`.
2. **Sécurité & Triggers** : L'application intègre un audit de sécurité complet. Les mots de passe des galeries sont isolés dans une table privée et vérifiés via RPC (`verify_gallery_credentials`). Des triggers anti-altération interdisent les modifications non autorisées par les clients.
3. **Middleware d'authentification** : Les accès aux routes `/dashboard/*` sont protégés et redirigés vers `/login` côté serveur par le middleware si l'utilisateur n'est pas connecté.
4. **Upload simulé** : Les médias ajoutés via le dashboard sont simulés par des images de démonstration stockées sur Unsplash/Mixkit.
5. **Paiements simulés** : Changement de forfait sans vrai paiement.
6. **La landing page** est un fichier HTML statique (`public/landing.html`), pas intégrée dans Next.js.

---

*Document mis à jour le 19 Juin 2026 — Intégration de la base de données réelle Supabase avec détection automatique, support asynchrone hybride et audit de sécurité complet.*
