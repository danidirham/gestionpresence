"""
Script principal pour mettre à jour la base de données en supprimant les anciennes tables Node.js
et en gardant uniquement les tables Django.
"""
import os
import sys
from dotenv import load_dotenv

def determine_database_type():
    """Détermine le type de base de données utilisé (MySQL ou SQLite)"""
    # Charger les variables d'environnement depuis le fichier .env
    env_path = os.path.join('backend', '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
        use_mysql = os.getenv('USE_MYSQL', 'False') == 'True'
        return 'mysql' if use_mysql else 'sqlite'
    else:
        # Si le fichier .env n'existe pas, vérifier si database.sqlite existe
        if os.path.exists(os.path.join('backend', 'database.sqlite')):
            return 'sqlite'
        else:
            # Par défaut, utiliser SQLite
            return 'sqlite'

def run_mysql_cleanup():
    """Exécute le script de nettoyage pour MySQL"""
    print("Exécution du script de nettoyage pour MySQL...")
    if sys.platform == 'win32':
        os.system('clean_database.bat')
    else:
        os.system('python clean_database.py')

def run_sqlite_cleanup():
    """Exécute le script de nettoyage pour SQLite"""
    print("Exécution du script de nettoyage pour SQLite...")
    if sys.platform == 'win32':
        os.system('clean_sqlite_database.bat')
    else:
        os.system('python clean_sqlite_database.py')

def main():
    """Fonction principale"""
    print("=== Mise à jour de la base de données ===")
    
    # Déterminer le type de base de données
    db_type = determine_database_type()
    print(f"Type de base de données détecté: {db_type}")
    
    # Exécuter le script de nettoyage approprié
    if db_type == 'mysql':
        run_mysql_cleanup()
    else:
        run_sqlite_cleanup()
    
    print("\n=== Mise à jour de la base de données terminée ===")
    return 0

if __name__ == "__main__":
    sys.exit(main())
