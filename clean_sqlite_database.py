"""
Script pour nettoyer la base de données SQLite en supprimant les anciennes tables Node.js
et en gardant uniquement les tables Django.
"""
import os
import sys
import sqlite3
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv(os.path.join('backend', '.env'))

# Chemin vers la base de données SQLite
SQLITE_DB_PATH = os.path.join('backend', 'database.sqlite')

# Liste des tables Django (à conserver)
DJANGO_TABLES = [
    # Tables Django par défaut
    'django_migrations',
    'django_content_type',
    'django_admin_log',
    'django_session',
    
    # Tables d'authentification
    'auth_group',
    'auth_group_permissions',
    'auth_permission',
    'authentication_utilisateur',
    'authentication_utilisateur_groups',
    'authentication_utilisateur_user_permissions',
    
    # Tables de l'application
    'ecole_ecole',
    'etudiants_classe',
    'etudiants_etudiant',
    'etudiants_parent',
    'presences_presence',
    'presences_message',
    'reconnaissance_donneesbiometriques',
]

def connect_to_database():
    """Se connecte à la base de données SQLite"""
    try:
        if not os.path.exists(SQLITE_DB_PATH):
            print(f"La base de données SQLite '{SQLITE_DB_PATH}' n'existe pas")
            return None
        
        conn = sqlite3.connect(SQLITE_DB_PATH)
        print(f"Connexion à la base de données SQLite '{SQLITE_DB_PATH}' réussie")
        return conn
    except sqlite3.Error as err:
        print(f"Erreur de connexion à la base de données: {err}")
        sys.exit(1)

def get_all_tables(conn):
    """Récupère toutes les tables de la base de données"""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [table[0] for table in cursor.fetchall()]
    cursor.close()
    return tables

def drop_non_django_tables(conn, all_tables):
    """Supprime toutes les tables qui ne sont pas des tables Django"""
    cursor = conn.cursor()
    
    tables_to_drop = [table for table in all_tables if table not in DJANGO_TABLES and table != 'sqlite_sequence']
    
    if not tables_to_drop:
        print("Aucune table non-Django à supprimer")
        cursor.close()
        return
    
    print(f"Tables à supprimer: {', '.join(tables_to_drop)}")
    
    for table in tables_to_drop:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS `{table}`")
            print(f"Table '{table}' supprimée avec succès")
        except sqlite3.Error as err:
            print(f"Erreur lors de la suppression de la table '{table}': {err}")
    
    cursor.close()

def run_django_migrations():
    """Exécute les migrations Django pour s'assurer que toutes les tables sont créées"""
    print("\nExécution des migrations Django...")
    try:
        os.chdir('backend')
        os.system(f"{sys.executable} manage.py migrate")
        print("Migrations Django exécutées avec succès")
    except Exception as e:
        print(f"Erreur lors de l'exécution des migrations Django: {e}")
    finally:
        os.chdir('..')

def main():
    """Fonction principale"""
    print("=== Nettoyage de la base de données SQLite ===")
    
    # Vérifier si SQLite est utilisé
    if os.getenv('USE_MYSQL', 'False') == 'True':
        print("Ce script est conçu pour SQLite. Veuillez configurer USE_MYSQL=False dans le fichier .env")
        sys.exit(1)
    
    # Se connecter à la base de données
    conn = connect_to_database()
    if conn is None:
        print("Création d'une nouvelle base de données SQLite...")
        run_django_migrations()
        return 0
    
    # Récupérer toutes les tables
    all_tables = get_all_tables(conn)
    print(f"Tables existantes: {', '.join(all_tables)}")
    
    # Supprimer les tables non-Django
    drop_non_django_tables(conn, all_tables)
    
    # Fermer la connexion
    conn.close()
    
    # Exécuter les migrations Django
    run_django_migrations()
    
    print("\n=== Nettoyage de la base de données SQLite terminé ===")
    return 0

if __name__ == "__main__":
    sys.exit(main())
