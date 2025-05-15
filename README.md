# Système de Gestion de Présence Intelligente

## À propos du projet

Cette application web moderne de gestion de présence scolaire utilise la reconnaissance faciale pour optimiser le suivi des élèves. Cette solution innovante permet aux établissements scolaires de suivre automatiquement les présences des élèves, de générer des rapports détaillés et de communiquer efficacement avec les parents via des alertes SMS en temps réel.

## Fonctionnalités principales

- **Authentification sécurisée** : Système de connexion pour sécuriser l'accès à l'application
- **Reconnaissance faciale** : Identification automatique des élèves à leur arrivée
- **Gestion des élèves** : Ajout, modification et suppression des informations des élèves
- **Suivi des présences** : Enregistrement et visualisation des présences quotidiennes
- **Statistiques détaillées** : Tableaux de bord avec graphiques sur les taux de présence par classe
- **Notifications SMS** : Envoi automatique de messages aux parents en cas d'absence
- **Personnalisation** : Configuration des paramètres de l'école (logo, nom, classes)

## Architecture du projet

Le projet est organisé en deux parties principales :

- **Frontend** : Interface utilisateur React/TypeScript (page d'accueil et tableau de bord administratif)
- **Backend** : API et logique métier en Python/Django

## Technologies utilisées

Ce projet est construit avec les technologies suivantes :

- **Frontend** :
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui (composants UI)
  - face-api.js (reconnaissance faciale)

- **Backend** :
  - Python
  - Django
  - Django REST Framework
  - OpenCV (reconnaissance faciale)
  - MySQL

## Prérequis

- Python 3.8+ (pour le backend)
- Node.js 16+ (pour le frontend)
- npm 7+ ou yarn
- MySQL 8+

## Installation

### Cloner le dépôt

```bash
git clone https://github.com/votre-utilisateur/gestion-presence-intelligente.git
cd gestion-presence-intelligente
```

### Configuration et démarrage (Windows)

Pour faciliter l'installation et le démarrage, des scripts batch sont fournis :

1. **Installation des dépendances** :
   ```bash
   # Créer un environnement virtuel Python
   python -m venv .venv

   # Installer les dépendances Python
   python install_dependencies.py
   ```

2. **Démarrer le backend** :
   ```bash
   # Utiliser le script batch
   start_backend.bat

   # Ou manuellement
   cd backend
   ..\.venv\Scripts\python run_server.py
   ```

### Résolution des problèmes courants

Si vous rencontrez l'erreur `ModuleNotFoundError: No module named 'pkg_resources'` ou des problèmes liés à setuptools, vous avez plusieurs options :

1. **Solution 1** : Installer setuptools globalement et démarrer le serveur
   ```bash
   # Utiliser le script batch
   start_django.bat

   # Ou manuellement
   pip install setuptools
   cd backend
   python run_server.py
   ```

2. **Solution 2** : Utiliser un module mock pour pkg_resources
   ```bash
   # Utiliser le script batch
   start_django_with_fix.bat

   # Ou manuellement
   python fix_simplejwt.py
   cd backend
   python run_server.py
   ```

3. **Solution 3** : Démarrage direct sans dépendre de pkg_resources (recommandée)
   ```bash
   # Utiliser le script batch
   direct_start.bat

   # Ou manuellement
   python direct_start_django.py
   ```

### Configuration de la base de données

Le projet peut utiliser soit SQLite (par défaut), soit MySQL.

#### Utilisation de SQLite (par défaut)

SQLite est configuré par défaut et ne nécessite aucune installation supplémentaire. C'est la solution la plus simple pour le développement.

#### Utilisation de MySQL

Pour utiliser MySQL, vous devez :

1. **Vérifier si MySQL est installé et accessible** :
   ```bash
   # Utiliser le script batch
   check_mysql.bat

   # Ou manuellement
   python check_mysql.py
   ```
   Ce script vérifie si MySQL est installé et si la connexion est possible avec les informations de configuration.

2. **Configurer le projet pour utiliser MySQL** :
   - Un fichier `.env` a été créé dans le dossier backend avec la configuration MySQL
   - Assurez-vous que la ligne `USE_MYSQL=True` est présente dans ce fichier
   - Vérifiez que les informations de connexion (hôte, utilisateur, mot de passe, etc.) sont correctes

3. **Installation de mysqlclient** :
   ```bash
   # Utiliser le script batch
   install_mysql.bat

   # Ou manuellement
   python install_mysql.py
   ```
   Ce script installe le module `mysqlclient` nécessaire pour la connexion à MySQL.

Le script `direct_start.bat` détecte automatiquement si MySQL est configuré et tente de l'utiliser. En cas d'échec, il revient automatiquement à SQLite.

3. **Démarrer le frontend** :
   ```bash
   # Utiliser le script batch
   start_frontend.bat

   # Ou manuellement
   cd frontend
   npm install
   npm run dev
   ```

### Configuration manuelle (Linux/macOS)

```bash
# Créer et activer un environnement virtuel Python
python -m venv .venv
source .venv/bin/activate

# Installer les dépendances Python
cd backend
pip install -r requirements.txt

# Configurer la base de données
# 1. Créer un fichier .env dans le dossier backend avec les informations suivantes :
# DB_NAME=gestion-ecole
# DB_USER=votre_utilisateur
# DB_PASSWORD=votre_mot_de_passe
# DB_HOST=localhost
# DB_PORT=3306
# SECRET_KEY=votre_clé_secrète
# DEBUG=True

# 2. Initialiser la base de données
python init_db.py

# 3. Démarrer le serveur Django
python run_server.py
```

```bash
# Dans un autre terminal, configurer le frontend
cd frontend
npm install

# Configurer l'environnement frontend
# 1. Créer un fichier .env dans le dossier frontend avec les informations suivantes :
# VITE_API_URL=http://localhost:8000/api
# VITE_APP_NAME=Gestion de Présence Intelligente

# 2. Démarrer le serveur de développement frontend
npm run dev
```

## Structure du projet

### Backend (Django)

```
backend/
├── api/                  # API REST pour le frontend
├── authentication/       # Gestion de l'authentification
├── ecole/                # Modèle et vues pour l'école
├── etudiants/            # Gestion des étudiants
├── gestion_presence/     # Configuration principale Django
├── media/                # Fichiers média (photos, etc.)
├── mock_modules/         # Modules de simulation pour tests
├── presences/            # Gestion des présences
├── reconnaissance/       # Logique de reconnaissance faciale
├── database.sqlite       # Base de données SQLite
├── init_db.py            # Script d'initialisation de la BDD
├── manage.py             # Script de gestion Django
├── requirements.txt      # Dépendances Python
└── run_server.py         # Script de démarrage du serveur
```

### Frontend (React)

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

## Structure de la base de données

L'application utilise une base de données avec les tables suivantes :

- **ecole** : Informations sur l'établissement scolaire
- **classes** : Liste des classes disponibles (CP1, CP2, CE1, CE2, CM1, CM2, etc.)
- **etudiants** : Informations sur les élèves et leurs données biométriques
- **parents** : Coordonnées des parents d'élèves
- **presences** : Enregistrements des présences quotidiennes
- **messages** : Messages envoyés aux parents
- **utilisateurs** : Comptes utilisateurs pour l'accès à l'application

## Utilisation

### Accès à l'application

- **Frontend** : Accédez à l'interface utilisateur via `http://localhost:5173`
- **Backend API** : Les API sont disponibles sur `http://localhost:8000/api`
- **Admin Django** : L'interface d'administration est accessible via `http://localhost:8000/admin`

### Connexion à l'application

#### Tableau de bord administratif Django

Le script de démarrage crée automatiquement un superutilisateur par défaut si aucun n'existe :

- **URL** : http://localhost:8000/admin/
- **Nom d'utilisateur** : admin
- **Mot de passe** : admin123

Vous pouvez également créer un superutilisateur manuellement :
```bash
# Utiliser le script batch
create_admin.bat

# Ou manuellement
cd backend
python manage.py createsuperuser
```

#### Interface utilisateur React

Connectez-vous avec les identifiants par défaut :

- **Nom d'utilisateur** : admin
- **Mot de passe** : admin123

### Enregistrement des données biométriques

1. Accédez à la page "Étudiants"
2. Cliquez sur "Ajouter un étudiant"
3. Remplissez les informations et cliquez sur "Enregistrer les données biométriques"
4. Capturez une photo claire du visage de l'élève
5. Validez l'enregistrement

### Reconnaissance faciale

1. Accédez à la page "Reconnaissance"
2. Démarrez la caméra et positionnez l'élève devant celle-ci
3. Le système identifiera automatiquement l'élève et enregistrera sa présence
4. Un message de confirmation s'affichera avec le nom de l'élève

## Captures d'écran

![Dashboard](docs/screenshots/dashboard.png)
![Reconnaissance faciale](docs/screenshots/reconnaissance.png)
![Gestion des élèves](docs/screenshots/etudiants.png)
![Envoi de messages](docs/screenshots/messages.png)

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
