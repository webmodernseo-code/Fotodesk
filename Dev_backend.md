# FotoDesk — Plan de Développement Backend (`Dev_backend.md`)

Ce document est la feuille de route vivante du développement backend de **FotoDesk**. Chaque étape est cochée (`[x]`) au fur et à mesure de son implémentation, testée et poussée sur `origin/main`.

## Stack & Architecture Cible
- **Runtime & Serveur** : Node.js `>= 22.12.0`, Express `4.22.3`
- **Base de données** : Knex.js (`sqlite3` en développement local, `pg` PostgreSQL en production)
- **Stockage médias** : Local dev / **Cloudflare R2** (`@aws-sdk/client-s3` + URLs signées `s3-request-presigner`) en production
- **Traitement médias** : `sharp` (images/miniatures), `fluent-ffmpeg` (durée/traitement vidéo)
- **E-mails & PDF** : `nodemailer`, `pdfkit` / `pdf-lib`
- **Sécurité** : JWT / Cookies HttpOnly, `bcrypt`, `helmet`, `express-rate-limit`, `express-validator` / `joi`

---

## Tableau de Bord d'Avancement

| Phase | Intitulé | Statut |
| --- | --- | --- |
| Phase 1 | Socle Base de Données, Multi-Tenancy (`studios`) & Migrations | Terminée |
| Phase 2 | Authentification, Sessions Actives & Permissions par Module | Terminée |
| Phase 3 | APIs Espace Studio (Dashboard, Clients, Projets, Calendrier, Factures) | Terminée |
| Phase 4 | Galeries Photo, Galeries Vidéo, Commentaires Horodatés & Quotas | Terminée |
| Phase 5 | Affiliation, Commissions (20 % 1er paiement) & Souscriptions | Terminée |
| Phase 6 | APIs Super Admin (`/api/superadmin/*`) | À faire |
| Phase 7 | Paramètres, Sécurité, Tests d'Intégration & Déploiement VPS | À faire |

---

## Phase 1 — Socle Base de Données, Multi-Tenancy & Migrations
- [x] **1.1** Auditer les migrations Knex existantes dans `backend/migrations/`.
- [x] **1.2** Créer/compléter la table `studios` (`id`, `slug`, `name`, `owner_user_id`, `plan`, `status`, `city`, `country`, `business_email`, `phone`, `website`, `description`, `logo_url`, `social_links`, `created_at`, `updated_at`).
- [x] **1.3** Ajouter `studio_id` et les index associés sur les tables métier (`customers`, `projects`, `calendar_events`, `galleries`, `videos`, `invoices`, `team_members`).
- [x] **1.4** Créer le middleware d'isolation multi-tenant `attachStudioContext` (garantit qu'un studio n'accède jamais aux données d'un autre studio).
- [x] **1.5** Mettre à jour le seed de démonstration (`founder@fotodesk.com` Super Admin + `user_b@fotodesk.com` Studio Northlight).

---

## Phase 2 — Authentification, Sessions Actives & Permissions par Module
- [x] **2.1** Endpoints d'inscription & connexion :
  - `POST /api/auth/register` : création compte + studio `starter` + code affilié unique (`ref_code`).
  - `POST /api/auth/admin/login` : connexion unifiée pour Studio (`admin` / `team_member`) et Super Admin (`super_admin`).
  - `POST /api/auth/logout` & `GET /api/auth/me`.
- [x] **2.2** Gestion des sessions actives (`user_sessions`) :
  - `GET /api/admin/settings/sessions` : lister les appareils connectés.
  - `DELETE /api/admin/settings/sessions/:id` : révoquer une session distante.
- [x] **2.3** Matrice de permissions des membres d'équipe (`member_module_permissions`) :
  - Modules : `dashboard`, `clients`, `projects`, `calendar`, `photoGalleries`, `videoGalleries`, `invoices`, `landingBuilder`, `affiliate`, `settings`.
  - Droits par module : `can_view`, `can_create`, `can_edit`, `can_delete`.
  - Middleware `requireModulePermission(module, action)` renvoyant `403 Forbidden` côté serveur.
  - CRUD complet `/api/admin/team-members` (invitation, modification des permissions, renvoi d'invitation, retrait).

---

## Phase 3 — APIs Espace Studio (Dashboard, Clients, Projets, Calendrier, Factures)
- [x] **3.1** **Dashboard Studio** : `GET /api/admin/dashboard/overview` (KPIs clients, projets, factures, galeries, stockage).
- [x] **3.2** **Clients** : CRUD `/api/admin/customers` + fiche détaillée (projets, galeries et factures liés).
- [x] **3.3** **Projets** : CRUD `/api/admin/projects` (`planning`, `in_progress`, `editing`, `review`) avec filtres par statut/type et liaisons galeries/factures.
- [x] **3.4** **Calendrier** : CRUD `/api/admin/calendar/events` lié aux clients et projets.
- [x] **3.5** **Factures (suivi manuel hors plateforme)** :
  - CRUD `/api/admin/invoices` + tables `invoice_items` et `invoice_activities`.
  - `PATCH /api/admin/invoices/:id/status` (`draft`, `sent`, `paid`, `overdue`, `cancelled`).
  - `POST /api/admin/invoices/:id/duplicate` & `GET /api/public/invoices/:token` (vue client + export PDF).
- [x] **3.6** **Constructeur de page d'accueil (`/admin/portfolio`)** :
  - `GET / PUT /api/admin/portfolio` (profil public studio, sections portfolio, services, contact) & `GET /api/public/portfolio/:slug`.

---

## Phase 4 — Galeries Photo, Galeries Vidéo, Commentaires Horodatés & Quotas
- [x] **4.1** **Service de quotas par offre** (`starter` vs `pro_monthly` / `pro_yearly`) :
  - Starter : max 3 galeries photo, 3 Go photo, 0 min vidéo.
  - Pro : galeries photo illimitées, 100 Go photo, 500 min stockage vidéo, 1 000 min lecture vidéo/mois.
  - Rejet HTTP `403` / `413` côté serveur si dépassement de quota.
- [x] **4.2** **Galeries Photo** : CRUD `/api/admin/galleries`, upload vers stockage local/R2, sélection favoris client, expiration de lien.
- [x] **4.3** **Galeries Vidéo** :
  - CRUD `/api/admin/video-galleries` + upload vidéo avec extraction automatique de durée (`ffprobe`).
  - `POST /api/public/video-galleries/:slug/verify-code` (vérification code d'accès client).
  - `GET` / `POST /api/public/video-galleries/:slug/videos/:videoId/comments` (commentaires horodatés `timestamp_sec`).
  - Suivi de la consommation mensuelle de lecture vidéo (`video_playback_usage`) avec reset le 1er de chaque mois.

---

## Phase 5 — Affiliation, Commissions (20 % 1er Paiement) & Souscriptions
- [x] **5.1** **Souscription Studio** :
  - `GET /api/admin/subscription` (plan actuel, quotas utilisés, factures `subscription_invoices`).
  - `POST /api/admin/subscription/upgrade` (passage Starter -> Pro Mensuel/Annuel + génération facture).
- [x] **5.2** **Affiliation Studio** :
  - `GET /api/admin/affiliates/overview` (code unique, clics, parrainages, conversions, commissions, virements).
  - Attribution automatique lors de `POST /api/auth/register` via `referralCode`.
- [x] **5.3** **Moteur de commissions** :
  - Création automatique d'une commission à **20 %** uniquement lors du **premier paiement d'abonnement Pro réussi** (`€1,98` sur `€9,90`, `€19,80` sur `€99`).
  - Aucune commission générée sur les renouvellements.

---

## Phase 6 — APIs Super Admin (`/api/superadmin/*`)
Protection stricte par middleware `requireSuperAdmin` (`role.name === 'super_admin'`) :
- [ ] **6.1** `GET /api/superadmin/overview` : KPIs globaux, croissance (7j/30j/90j), MRR/ARR, alertes plateforme.
- [ ] **6.2** `GET /api/superadmin/studios` & `GET /api/superadmin/studios/:id` & `PATCH /api/superadmin/studios/:id/status` (suspension/réactivation avec motif obligatoire + `status_history`).
- [ ] **6.3** `GET /api/superadmin/users` & `GET /api/superadmin/users/:id` & `PATCH /api/superadmin/users/:id/status` (suspension/réactivation + activité).
- [ ] **6.4** `GET /api/superadmin/subscriptions` & `GET /api/superadmin/subscriptions/:id` (répartition, quotas, historique de facturation).
- [ ] **6.5** `GET /api/superadmin/affiliates`, `PATCH /api/superadmin/affiliates/:id/status`.
- [ ] **6.6** `GET /api/superadmin/commissions`, `PATCH /api/superadmin/commissions/:id/approve`.
- [ ] **6.7** `GET /api/superadmin/payouts` & `GET /api/superadmin/payouts/:id`.
- [ ] **6.8** `GET / PUT /api/superadmin/settings` (paramètres globaux de la plateforme).

---

## Phase 7 — Paramètres, Sécurité, Tests d'Intégration & Déploiement VPS
- [ ] **7.1** **Paramètres Studio** : `GET / PUT /api/admin/settings/studio-profile`, `account-preferences`, `notifications`, `workspace-preferences`, `password`.
- [ ] **7.2** **Tests d'intégration Jest + Supertest** :
  - Isolation multi-tenant entre deux studios.
  - Contrôle des permissions modules (`view`, `create`, `edit`, `delete`).
  - Respect des quotas Starter/Pro.
  - Règle des commissions 20 % sur le 1er paiement uniquement.
  - Garde `super_admin` (403 pour un utilisateur studio).
- [ ] **7.3** **Préparation Production** : configuration `.env.production`, Cloudflare R2, PostgreSQL, Nginx/Caddy SSL, PM2/Docker.

