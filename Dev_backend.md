# FotoDesk — Plan de recette et de mise en production

Réinitialisé le 20 novembre 2026. Ce document remplace le suivi historique des neuf phases, conservé dans Git. Les validations antérieures restent des indices. Une case se ferme sur une preuve rejouable pour la version candidate.

**Verdict actuel — lancement bloqué.** Le dépôt contient des parcours en cours de modification. La recette doit porter sur une révision identifiée, une base isolée et un inventaire des fonctionnalités effectivement accessibles. Aucun VPS, DNS public, compte fournisseur ni secret de production n'est requis pour commencer les lots locaux.

## Écarts constatés

- **Clients et galeries photo** — les listes remplaçaient une réponse vide par des exemples. Les fallbacks ont été retirés. Vérifier le parcours avec un studio neuf puis un enregistrement créé depuis l'interface.
- **Messages studio** — l'indisponibilité des données pouvait afficher des fils de démonstration avec des identifiants actionnables. La page affiche désormais le résultat de l'API et propose un nouvel essai en cas d'erreur.
- **Abonnements** — la route de mise à niveau fabriquait une facture payée et pouvait déclencher une commission. Une garde bloque ce chemin en production et Checkout renvoie une indisponibilité si Stripe est absent. L'écran studio appelle encore la route de mise à niveau et affiche des exemples de factures et de coordonnées. Le lot FD-06 doit relier l'interface au paiement confirmé.
- **Autres données à traiter** — exemples et actions à vérifier dans les projets, galeries vidéo, affiliation studio et espace factures. Déterminer les points d'entrée actifs via le routeur et les liens. Passer aussi en revue les pages publiques, le portfolio et la console fondateur pour les métriques, contenus, raccourcis et valeurs par défaut.
- **Offres publiques** — Starter à 0 € et Premium à 6,99 € par mois. Le cycle annuel n'est plus affiché sur la landing. En FD-06, valider les cycles et devises proposés par l'espace studio et l'affiliation, les quotas affichés et la facturation réelle.
- **Livraison** — deux manifests de production coexistent. Le Compose court lit backend/.env et prévoit un mot de passe PostgreSQL de substitution. L'autre référence des images PicPeak. Choisir et éprouver une chaîne FotoDesk unique avant tout déploiement.
- **Recette** — le rapport frontend précédent mentionne une campagne E2E officielle bloquée et une revue accessibilité incomplète. Rejouer sur la version candidate avec PostgreSQL. L'exécutable Docker n'a pas été détecté sur le poste dans le PATH ni à son emplacement Windows standard.

## Unités de travail à exécuter par l'agent

Prendre une unité à la fois. Dans chaque unité, ouvrir avec un état des lieux des points d'entrée et tests existants, corriger dans le code utilisé par ces points d'entrée, rejouer les tests concernés et consigner la commande, la révision, le résultat, les écarts et les preuves. Pour chaque liste, couvrir retour vide, données persistées, chargement et erreur avec nouvel essai. Les jeux de recette sont isolés. Les écrans de production lisent les données du studio ou affichent un état explicite.

| ID | Dépendances | Travail | Preuve de sortie |
| --- | --- | --- | --- |
| FD-01 | — | Inventorier écrans, endpoints, rôles, flags, jobs et intégrations. Recenser les commandes et les dépendances. Mettre en place la recette isolée avec deux studios, un membre et un client dans chacun, une base PostgreSQL et les services locaux requis. | Matrice route → acteur → API → test → statut. Build candidat et démarrage reproductibles. Migration sur base vierge et copie anonymisée d'une version précédente. |
| FD-02 | FD-01 | Revoir inscription, vérification, connexions studio/client/affilié, invitations, récupération, MFA, sessions, permissions et suspension. Vérifier le cloisonnement des requêtes et jobs dans les services, documents, médias et exports. | Tests de permissions attendues sur deux studios et trois niveaux d'accès. Révocation et suspension effectives. Aucun accès indu lors des contrôles défensifs d'autorisation. |
| FD-03 | FD-01/02 | Enlever les exemples de projets et relier toutes les mutations au backend. Recetter CRM, clients, projets, agenda, temps, tableau de bord et fils studio. | Création, modification, rechargement, liens métier, recherche, pagination et état vide du studio neuf. Un refus serveur reste visible. |
| FD-04 | FD-01/02 | Terminer photo, vidéo, retours client, transferts, archives et portfolio. Vérifier stockage local, miniatures, durée vidéo, traitement asynchrone, accès public, quotas et nettoyage des échecs. | Upload de vrais fichiers de recette, affichage, lecture, commentaires, téléchargement, expiration et suppression. Contrôles des quotas sous opérations simultanées. |
| FD-05 | FD-01/02 | Vérifier factures, PDF, portail, comptabilité et exports. Résoudre les écrans factices repérés et vérifier les transitions métier. | Facture émise et réglée selon le circuit prévu, PDF et export issus des mêmes données. Vérifier numérotation, montants, arrondis et droits. |
| FD-06 | FD-01/02 | Relier souscription et affiliation aux données persistées. Checkout et webhooks signés avec traitement idempotent. L'activation, les factures et la commission suivent les paiements confirmés. Couvrir renouvellement, échec, annulation et remboursement selon la règle produit. Remplacer les coordonnées, historiques et métriques fictifs. | Aucun passage Pro, facture payée ni commission sur simple demande. Rejeu sans doublon, contrôle de la première commission, rapprochement avec les événements fournisseur. Tests locaux puis Stripe test avant ouverture. |
| FD-07 | FD-01/02 | Recetter console fondateur, support, configuration studio, pages et formulaires publics, e-mails, automatisations, webhooks sortants, journalisation et files. Remplacer les succès simulés par des résultats observables. | Paramètres persistés, profils autorisés, e-mails capturés dans un SMTP de recette, tâches relancées sans double effet selon le contrat, échec visible et exploitable. |
| FD-08 | FD-03 à FD-07 | Exécuter la recette transversale et corriger les écarts. Couvrir desktop/mobile, clavier, lecteur d'écran, contrastes, langues, dates, latence, limites médias et redémarrage. | Typecheck, build, lint, suites backend/frontend et Playwright avec bilan complet. Toute fonctionnalité exposée a une preuve ou un ticket bloquant. |
| FD-09 | FD-01 | Préparer le déploiement candidat et sa configuration. Choisir le manifest, retirer les valeurs de substitution sensibles, gérer secrets, volumes, readiness, migrations et image versionnée. Préparer supervision, sauvegardes et procédure de restauration. | Déploiement et retour arrière répétés en environnement isolé. Restauration de la base et des médias mesurée avec les objectifs de reprise validés. |
| FD-10 | FD-08/09 | Mener l'audit final sur la version candidate puis valider les intégrations sur une préproduction privée. Rejouer migrations, rôles, parcours, reprise et contrôles de configuration. | Rapport daté, révision et image identifiées, aucun défaut bloquant ou critique ouvert. Décision explicite de mise en ligne puis smoke test public et fenêtre de surveillance. |

## Ce qu'il faudra provisionner

| Élément | Préparation et validation |
| --- | --- |
| Domaine, DNS et Cloudflare | Domaine et accès à la zone, hôtes de préproduction et production, TLS jusqu'à l'origine, règles de cache qui préservent comptes et médias privés, protection de l'origine. Vérifier notamment les gros transferts via les chemins choisis. |
| VPS ou hébergeur compatible | Dimensionner selon le trafic, la taille des médias et les traitements. Prévoir accès nominatif, pare-feu, mises à jour, espace temporaire et persistant, registre d'images FotoDesk, reverse proxy et remontée des métriques. |
| PostgreSQL | Instances ou bases séparées, comptes dédiés, accès réseau privé, sauvegardes chiffrées hors serveur, migrations reproductibles et restauration vérifiée. |
| Redis et services auxiliaires | Confirmer via FD-01 les usages en production, notamment files, limitation de débit et cache. Recenser aussi FFmpeg, traitement d'images et tout service optionnel de l'architecture choisie. |
| Stockage R2 ou S3 compatible | Buckets et identifiants distincts, permissions minimales, CORS limité si upload direct, URLs signées, rétention, capacité et restauration des médias. |
| E-mails transactionnels et support | Fournisseur SMTP/API, domaine expéditeur authentifié, SPF/DKIM/DMARC, boîte support, rebonds et tests de réception. |
| Stripe | Comptes et clés de test puis live, catalogue et devise approuvés, endpoint webhook et secret dédiés, rapprochement factures et commissions. |
| Secrets, exploitation et données | Stockage et rotation des secrets, alertes et responsable d'astreinte, politique de logs et rétention, coordonnées légales validées, procédure d'export et suppression, politiques de sauvegarde et d'accès. |

## Séquence de mise en ligne

1. Terminer la recette locale et l'audit de la version candidate. Fixer le périmètre de lancement, l'image à livrer, les objectifs de reprise et les responsables.
2. Provisionner une préproduction privée. Déployer la même image que celle prévue pour la production. Connecter le stockage et l'e-mail de recette ainsi que Stripe en mode test.
3. Exécuter le parcours de bout en bout et une restauration. Vérifier secrets, santé, alertes, permissions, caches, téléchargements signés, gros uploads, e-mail, événements de paiement et retour arrière.
4. Après l'accord de mise en ligne, provisionner les ressources de production. Sauvegarder avant migration, démarrer l'application derrière le proxy, valider en accès restreint puis ouvrir le DNS et le trafic public.
5. Vérifier inscription, connexions, médias, e-mails et paiement avec un parcours contrôlé. Surveiller erreurs, traitements et consommation. En cas de défaut bloquant, fermer l'admission et appliquer le retour arrière éprouvé.

## Suivi

Le [dossier de recette FD-01](docs/RECETTE_FD01.md) relie les parcours, acteurs, API et campagnes de test. Le build frontend passe. PostgreSQL portable a permis de vérifier le démarrage, la migration d'une base synthétique de la version précédente et le parcours d'invitation par e-mail sur navigateur desktop et mobile. La campagne officielle Docker Compose reste à rejouer sur un hôte équipé.

La campagne Docker de FD-01 est suspendue à la demande du porteur du projet. FD-02 est ouvert. La campagne FD-01 reste requise avant la mise en production.

### Vérifications du 20 novembre 2026

- `npm.cmd --prefix frontend run build:check` passe après correction des incompatibilités TypeScript. Les fichiers signalés par l'avertissement de taille Vite restent à mesurer en FD-08.
- FD-02 a commencé par les tests backend de sessions, MFA, permissions, contexte studio, API studio et fils de discussion. Huit suites passent, avec 59 tests réussis hors calendrier.
- Le calendrier applique le périmètre du studio aux événements, heures, devis, contrats et rendez-vous. Les 8 tests ciblés passent. Ils couvrent deux studios, les droits sur les événements d'un même studio et le refus d'associer un client d'un autre studio à un rendez-vous.
- Les statistiques, l'activité et les galeries du tableau de bord suivent le périmètre du studio et le rôle de l'utilisateur. L'agrégation globale reste accessible au superadmin. Les suites tableau de bord, calendrier et retrait de membre passent ensemble avec 19 tests réussis.
- La migration 291 conserve la trace du retrait d'un membre. Après la perte de son dernier studio, les sessions enregistrées sont révoquées et l'accès ne peut plus être rétabli par l'adhésion par défaut. La migration a été appliquée sur le PostgreSQL local de recette.
- FD-02 reste ouvert. Vérifier l'isolation des documents, médias, exports et tâches de fond en dehors du calendrier, ainsi que les parcours d'invitation, de récupération et de suspension de bout en bout sur deux studios.
- Les devis et contrats sont retirés du SaaS. Les écrans et routes dédiés sont désactivés et les workflows associés sont mis hors service. La migration conserve les données historiques. L'activation des factures est indépendante.
- `node --check backend/src/routes/adminSubscription.js` passe après l'ajout des gardes de production. Le parcours Stripe reste ouvert.
- Isolation multi-studios FD-02 renforcée et vérifiée : correction des timestamps `customer_invitations`/`customer_password_resets` (`studioTeamAccess.test.js` 4/4), cloisonnement `studio_id` sur `loadDocumentCustomer` et `transfers` (`fd02StudioIsolation.test.js` 3/3) et correction `photos.uploaded_at` dans `photoFilterBuilder.js`.
- Écrans métier reliés au backend et nettoyés des données d'exemple : `ProjectsListPage.tsx` (`ProjectsListPage.states.test.tsx` 2/2, `StudioMessagesPage.test.tsx` 4/4, `CalendarPage.appointments.test.tsx` 2/2, `FotoDeskDashboard.states.test.tsx` 2/2), `VideoGalleriesPage.tsx`, `InvoicesWorkspace.tsx` (`billsService`), `AdminAffiliatesPage.tsx` (`/admin/affiliates/overview`), `SubscriptionPage.tsx` (Stripe Checkout `/admin/subscription/checkout`, offre Starter 0 € / Premium 6,99 €) et `SuperAdminSubscriptionsSection.tsx`.
- `npm --prefix frontend run build:check` (`tsc -b && node ./scripts/build.js`) passe avec succès (code 0, 4018 modules).

- Webhook Stripe signé et idempotent implémenté (`POST /api/webhooks/stripe` dans `backend/src/routes/stripeWebhook.js`, `cancelCommissionForInvoice` dans `commissionService.js`) : `fd06StripeWebhook.test.js` passe (2/2 — rejet signature invalide, activation Pro, facture unique, rejeu sans doublon, renouvellement sans 2e commission, remboursement avec annulation de commission et résiliation).
- Recette FD-04 (médias & partage) : correction Windows NTFS sur `publicUploadQuota.js` (`stat.files === 0 && stat.ffree === 0` ne bloque plus en HTTP 507), garde `hasTable('studios')` dans `studioQuotaService.js`, nettoyage des données fictives/Unsplash et isolement `studioId` dans `backend/src/routes/portfolios.js`, correction mock `.returning()` dans `phase4And5QuotasAndCommissions.test.js`. Suites passées : `adminPhotos.reference.test.js`, `adminThumbnails.regenerate.test.js`, `transferDownloadCapRace.test.js`, `transferUploadDirCleanup.test.js`, `phase4And5QuotasAndCommissions.test.js` (5 suites, 31/31), ainsi que `photoProcessor.processPhoto.test.js`, `videoRenditionService.test.js`, `videoRenditionQueue.test.js`, `galleryVideoWebCopy.test.js`, `galleryProtectedVideoUrls.test.js`, `galleryFeedbackVisibility.test.js`, `feedbackAbuseLimits.test.js`, `adminArchivesQuery.test.js`, `transferService.gating.test.js` et `transferCreateGuards.test.js`.

- [ ] FD-01 — inventaire et référence de recette.
- [x] FD-02 — identités, droits et isolation (suites auth, session, MFA, permissions, calendrier, tableau de bord, fils studio, documents, transferts, exports et archives passées).
- [x] FD-03 — opérations studio et CRM (`ProjectsListPage`, `FotoDeskDashboard`, `StudioMessagesPage`, `CalendarPage.appointments` passés).
- [x] FD-04 — médias et partage (upload photos, miniatures, rendus vidéo, retours client, transferts, archives, portfolio isolé par studio et quotas vérifiés).
- [ ] FD-05 — documents et finances studio.
- [x] FD-06 — abonnements et affiliation (`SubscriptionPage`, `AdminAffiliatesPage`, `stripeWebhook.js` et `fd06StripeWebhook.test.js` passés ; mode Stripe test à rejouer avant ouverture).
- [ ] FD-07 — administration et services transversaux.
- [ ] FD-08 — recette complète.
- [ ] FD-09 — déploiement, restauration et retour arrière.
- [ ] FD-10 — audit final, préproduction et décision de lancement.
