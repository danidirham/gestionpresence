# Migration vers l'API réelle

Ce document décrit les modifications apportées pour passer des données simulées (hardcodées) à l'utilisation de l'API réelle du backend Django.

## Fichiers créés

### 1. Services API

- **`frontend/src/services/apiService.ts`** : Service central pour gérer les appels API, l'authentification et les erreurs.
- **`frontend/src/services/studentService.ts`** : Service pour gérer les appels API liés aux étudiants.

### 2. Modifications apportées

- **`frontend/src/services/dashboardService.ts`** : Mise à jour pour utiliser l'API réelle au lieu des données simulées.
- **`frontend/src/pages/Login.tsx`** : Mise à jour pour utiliser l'authentification réelle.
- **`frontend/src/pages/Students.tsx`** : Mise à jour pour utiliser l'API réelle pour la gestion des étudiants.

## Fonctionnalités implémentées

### 1. Authentification

- Connexion avec JWT (JSON Web Token)
- Stockage du token dans le localStorage
- Gestion des erreurs d'authentification

### 2. Gestion des étudiants

- Récupération de la liste des étudiants depuis l'API
- Ajout d'un nouvel étudiant via l'API
- Suppression d'un étudiant via l'API
- Gestion des erreurs API

### 3. Tableau de bord

- Récupération des statistiques depuis l'API
- Calcul des données pour les graphiques à partir des données réelles
- Affichage des présences récentes

## Mode de secours

Pour assurer une expérience utilisateur fluide même en cas de problème avec l'API, un mode de secours a été implémenté :

- Si l'API n'est pas disponible, des données simulées sont utilisées
- Les opérations CRUD sont simulées en mode développement si l'API échoue
- Des messages d'erreur appropriés sont affichés à l'utilisateur

## Configuration

Le fichier `.env` contient la configuration de l'URL de l'API :

```
VITE_API_URL=http://localhost:8000/api
```

## Utilisation

1. Assurez-vous que le backend Django est en cours d'exécution sur le port 8000
2. Démarrez l'application frontend avec `npm run dev`
3. Connectez-vous avec les identifiants fournis par le backend

## Prochaines étapes

- Implémenter la gestion des parents
- Implémenter la gestion des présences
- Implémenter la gestion des messages
- Ajouter des tests unitaires pour les services API
