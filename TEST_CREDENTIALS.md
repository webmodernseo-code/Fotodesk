# Comptes et Liens de Test — FotoDesk

Voici les informations de connexion et les liens d'accès pour tester les différents espaces (Fondateur, Photographe, Affilié, et Client) sur votre environnement local.

---

## 1. Espace Fondateur / Administrateur (Vault) 🔐

Cet espace est privé et non indexé par les moteurs de recherche. Il permet de piloter la plateforme, d'approuver les retraits des affiliés et de voir les statistiques de vente.

- **Lien de connexion** : [http://localhost:3000/login](http://localhost:3000/login) *(Redirige automatiquement vers le portail admin après la 2FA)*
- **Lien direct** : [http://localhost:3000/admin-portal](http://localhost:3000/admin-portal)
- **Identifiants** :
  - **Email** : `founder@fotodesk.com`
  - **Mot de passe** : `admin2026`
  - **Code de double authentification (2FA)** : `654321`

---

## 2. Espace Photographe 📸

Espace où les photographes gèrent leurs galeries clients, leur forfait et leurs paramètres.

- **Lien de connexion** : [http://localhost:3000/login](http://localhost:3000/login)
- **Identifiants** :
  - **Email** : N'importe quelle adresse e-mail (ex: `photographe@fotodesk.com`)
  - **Mot de passe** : N'importe quel mot de passe (ex: `123456`)
  - **Code de double authentification (2FA)** : `654321`

---

## 3. Espace Affiliés (Parrains) 💎

Espace permettant aux parrains de générer leur lien de parrainage, suivre leurs clics, leurs inscriptions et demander des virements de commissions.

- **Lien de connexion** : [http://localhost:3000/affiliate/login](http://localhost:3000/affiliate/login)
- **Lien d'inscription** : [http://localhost:3000/affiliate/register](http://localhost:3000/affiliate/register)
- **Compte de test pré-rempli** :
  - **Email** : `affiliate@fotodesk.com`
  - **Mot de passe** : `123456`
- **Code Promo de Test** : `MARC20`
- **Lien Affilié de Test** : [http://localhost:3000/register?ref=marc](http://localhost:3000/register?ref=marc)

---

## 4. Espace Galeries Clients (Sélection Privée) 🔒

Les galeries sécurisées envoyées aux clients finaux pour qu'ils sélectionnent et commentent leurs photos préférées.

- **Galerie 1 (Sophie - Mariage)** :
  - **Lien direct** : [http://localhost:3000/g/g-wedding-01](http://localhost:3000/g/g-wedding-01)
  - **Mot de passe** : `1234`
- **Galerie 2 (Léa - Mode Studio)** :
  - **Lien direct** : [http://localhost:3000/g/g-portrait-02](http://localhost:3000/g/g-portrait-02)
  - **Mot de passe** : `abcd`
