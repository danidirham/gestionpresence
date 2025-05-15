"""
Script pour nettoyer la base de données en supprimant les anciennes tables Node.js
et en gardant uniquement les tables Django.
"""
import os
import sys
import mysql.connector
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv(os.path.join('backend', '.env'))

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'port': os.getenv('DB_PORT', '3306')
}

# Nom de la base de données
DB_NAME = os.getenv('DB_NAME', 'gestion-ecole')

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
    """Se connecte à la base de données MySQL"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
        print(f"Connexion à la base de données '{DB_NAME}' réussie")
        return conn
    except mysql.connector.Error as err:
        print(f"Erreur de connexion à la base de données: {err}")
        sys.exit(1)

def get_all_tables(conn):
    """Récupère toutes les tables de la base de données"""
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = [table[0] for table in cursor.fetchall()]
    cursor.close()
    return tables

def drop_non_django_tables(conn, all_tables):
    """Supprime toutes les tables qui ne sont pas des tables Django"""
    cursor = conn.cursor()
    
    # Désactiver les contraintes de clé étrangère temporairement
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    
    tables_to_drop = [table for table in all_tables if table not in DJANGO_TABLES]
    
    if not tables_to_drop:
        print("Aucune table non-Django à supprimer")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        cursor.close()
        return
    
    print(f"Tables à supprimer: {', '.join(tables_to_drop)}")
    
    for table in tables_to_drop:
        try:
            cursor.execute(f"DROP TABLE `{table}`")
            print(f"Table '{table}' supprimée avec succès")
        except mysql.connector.Error as err:
            print(f"Erreur lors de la suppression de la table '{table}': {err}")
    
    # Réactiver les contraintes de clé étrangère
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
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
    print("=== Nettoyage de la base de données ===")
    
    # Vérifier si MySQL est utilisé
    if os.getenv('USE_MYSQL', 'False') != 'True':
        print("Ce script est conçu pour MySQL. Veuillez configurer USE_MYSQL=True dans le fichier .env")
        sys.exit(1)
    
    # Se connecter à la base de données
    conn = connect_to_database()
    
    # Récupérer toutes les tables
    all_tables = get_all_tables(conn)
    print(f"Tables existantes: {', '.join(all_tables)}")
    
    # Supprimer les tables non-Django
    drop_non_django_tables(conn, all_tables)
    
    # Fermer la connexion
    conn.close()
    
    # Exécuter les migrations Django
    run_django_migrations()
    
    print("\n=== Nettoyage de la base de données terminé ===")
    return 0

if __name__ == "__main__":
    sys.exit(main())
