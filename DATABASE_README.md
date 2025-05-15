# Mise à jour de la base de données

Ce dossier contient des scripts pour mettre à jour la base de données en supprimant les anciennes tables Node.js et en gardant uniquement la nouvelle structure de la base de données sous Python Django.

## Scripts disponibles

### Script principal

- `update_database.py` - Script principal qui détecte automatiquement le type de base de données utilisé (MySQL ou SQLite) et exécute le script de nettoyage approprié.
- `update_database.bat` - Fichier batch pour exécuter le script principal sous Windows.

### Scripts spécifiques

- `clean_database.py` - Script pour nettoyer la base de données MySQL.
- `clean_database.bat` - Fichier batch pour exécuter le script de nettoyage MySQL sous Windows.
- `clean_sqlite_database.py` - Script pour nettoyer la base de données SQLite.
- `clean_sqlite_database.bat` - Fichier batch pour exécuter le script de nettoyage SQLite sous Windows.

### Utilitaires

- `check_database.py` - Script pour vérifier la structure actuelle de la base de données.

## Utilisation

### Méthode simple (recommandée)

1. Exécutez le fichier batch `update_database.bat` (sous Windows) ou le script Python `update_database.py` (sous Linux/macOS) :

```bash
# Sous Windows
update_database.bat

# Sous Linux/macOS
python update_database.py
```

Ce script détectera automatiquement le type de base de données utilisé et exécutera le script de nettoyage approprié.

### Méthode avancée

Si vous savez quel type de base de données vous utilisez, vous pouvez exécuter directement le script de nettoyage correspondant :

#### Pour MySQL

```bash
# Sous Windows
clean_database.bat

# Sous Linux/macOS
python clean_database.py
```

#### Pour SQLite

```bash
# Sous Windows
clean_sqlite_database.bat

# Sous Linux/macOS
python clean_sqlite_database.py
```

### Vérification de la base de données

Pour vérifier la structure actuelle de la base de données après le nettoyage, exécutez :

```bash
python check_database.py
```

## Que font ces scripts ?

1. Ils se connectent à la base de données configurée dans le fichier `.env` (MySQL) ou à la base de données SQLite dans le dossier `backend`.
2. Ils identifient toutes les tables existantes dans la base de données.
3. Ils suppriment toutes les tables qui ne font pas partie de la structure Django.
4. Ils exécutent les migrations Django pour s'assurer que toutes les tables nécessaires sont créées.

## Configuration

La configuration de la base de données est lue à partir du fichier `.env` dans le dossier `backend`. Assurez-vous que ce fichier contient les informations correctes pour votre base de données.

### Exemple de configuration MySQL

```
USE_MYSQL=True
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=gestion-ecole
DB_PORT=3306
```

### Exemple de configuration SQLite

```
USE_MYSQL=False
```

## Dépendances

Ces scripts nécessitent les packages Python suivants :

- `mysql-connector-python` (pour MySQL)
- `python-dotenv`

Ils seront installés automatiquement lors de l'exécution des fichiers batch.
