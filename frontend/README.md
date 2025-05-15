# Frontend - Gestion de Présence Intelligente

Ce dossier contient le code frontend de l'application de gestion de présence intelligente, développé avec React, TypeScript et Vite.

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

Le serveur de développement sera accessible à l'adresse : http://localhost:5173

## Connexion à l'application

Pour vous connecter à l'application, utilisez les identifiants suivants :

- **Nom d'utilisateur** : admin
- **Mot de passe** : admin123

## Structure du projet

```
frontend/
├── public/               # Fichiers statiques
├── src/
│   ├── components/       # Composants React réutilisables
│   ├── contexts/         # Contextes React (auth, etc.)
│   ├── hooks/            # Hooks personnalisés
│   ├── lib/              # Utilitaires et fonctions
│   ├── pages/            # Pages de l'application
│   └── styles/           # Styles CSS/SCSS
├── index.html            # Point d'entrée HTML
├── package.json          # Dépendances JavaScript
├── tsconfig.json         # Configuration TypeScript
└── vite.config.ts        # Configuration Vite
```

## Pages principales

- **/** - Page d'accueil
- **/login** - Page de connexion
- **/dashboard** - Tableau de bord principal
- **/students** - Gestion des étudiants
- **/recognition** - Reconnaissance faciale
- **/messages** - Envoi de messages aux parents
- **/settings** - Paramètres de l'application

## Fonctionnalités

- **Authentification** : Connexion sécurisée à l'application
- **Tableau de bord amélioré** :
  - Visualisation des statistiques de présence avec des cartes interactives
  - Graphique circulaire pour le taux de présence par classe
  - Graphique à barres pour les présences par jour
  - Tableau des dernières présences enregistrées avec pagination
- **Gestion des étudiants** : Ajout, modification et suppression des étudiants
- **Reconnaissance faciale** : Identification des étudiants et enregistrement des présences
- **Messagerie** : Envoi de messages aux parents
- **Paramètres** : Configuration de l'application (classes, caméra, etc.)

## Bibliothèques utilisées

- **React Router** : Navigation entre les pages
- **Recharts** : Création de graphiques interactifs
- **Lucide React** : Icônes modernes et personnalisables
- **Tailwind CSS** : Framework CSS utilitaire

## Communication avec le backend

Le frontend communique avec le backend Django via des API REST. Les appels API sont configurés pour pointer vers `http://localhost:8000/api`.

Actuellement, l'authentification est simulée côté frontend. Une fois le backend configuré, les appels API seront activés pour une authentification réelle.

## Développement

Pour modifier le comportement de l'authentification, vous pouvez éditer le fichier `src/pages/Login.tsx`.

Pour connecter le frontend au backend, assurez-vous que :
1. Le serveur backend Django est en cours d'exécution sur le port 8000
2. Les API d'authentification sont correctement configurées
3. CORS est activé sur le backend pour permettre les requêtes depuis le frontend
