"""
Script pour vérifier la structure actuelle de la base de données.
"""
import os
import sys
import mysql.connector
import sqlite3
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv(os.path.join('backend', '.env'))

# Configuration de la base de données MySQL
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'port': os.getenv('DB_PORT', '3306')
}

# Nom de la base de données MySQL
DB_NAME = os.getenv('DB_NAME', 'gestion-ecole')

# Chemin vers la base de données SQLite
SQLITE_DB_PATH = os.path.join('backend', 'database.sqlite')

def check_mysql_database():
    """Vérifie la structure de la base de données MySQL"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
        cursor = conn.cursor()
        
        # Récupérer toutes les tables
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        print(f"Base de données MySQL '{DB_NAME}' contient {len(tables)} tables:")
        for table in sorted(tables):
            # Récupérer le nombre d'enregistrements dans la table
            cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
            count = cursor.fetchone()[0]
            print(f"  - {table} ({count} enregistrements)")
        
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Erreur lors de la vérification de la base de données MySQL: {err}")

def check_sqlite_database():
    """Vérifie la structure de la base de données SQLite"""
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"La base de données SQLite '{SQLITE_DB_PATH}' n'existe pas")
        return
    
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        
        # Récupérer toutes les tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [table[0] for table in cursor.fetchall()]
        
        print(f"Base de données SQLite '{SQLITE_DB_PATH}' contient {len(tables)} tables:")
        for table in sorted(tables):
            # Récupérer le nombre d'enregistrements dans la table
            cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
            count = cursor.fetchone()[0]
            print(f"  - {table} ({count} enregistrements)")
        
        cursor.close()
        conn.close()
    except sqlite3.Error as err:
        print(f"Erreur lors de la vérification de la base de données SQLite: {err}")

def main():
    """Fonction principale"""
    print("=== Vérification de la structure de la base de données ===")
    
    # Vérifier le type de base de données utilisé
    use_mysql = os.getenv('USE_MYSQL', 'False') == 'True'
    
    if use_mysql:
        print("Type de base de données: MySQL")
        check_mysql_database()
    else:
        print("Type de base de données: SQLite")
        check_sqlite_database()
    
    print("\n=== Vérification terminée ===")
    return 0

if __name__ == "__main__":
    sys.exit(main())
