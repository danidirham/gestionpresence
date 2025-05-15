"""
Script pour initialiser la base de données MySQL sans utiliser Django.
Ce script crée les tables nécessaires pour le projet.
"""
import os
import mysql.connector
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'port': os.getenv('DB_PORT', '3306')
}

# Nom de la base de données
DB_NAME = os.getenv('DB_NAME', 'gestion-ecole')

def create_database():
    """Crée la base de données si elle n'existe pas"""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"Base de données '{DB_NAME}' créée ou déjà existante")
    except mysql.connector.Error as err:
        print(f"Erreur lors de la création de la base de données: {err}")
    finally:
        cursor.close()
        conn.close()

def create_tables():
    """Crée les tables nécessaires pour le projet"""
    # Connexion à la base de données
    conn = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
    cursor = conn.cursor()
    
    try:
        # Table pour les utilisateurs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `authentication_utilisateur` (
            `id` int NOT NULL AUTO_INCREMENT,
            `password` varchar(128) NOT NULL,
            `last_login` datetime(6) DEFAULT NULL,
            `is_superuser` tinyint(1) NOT NULL,
            `username` varchar(150) NOT NULL,
            `first_name` varchar(150) NOT NULL,
            `last_name` varchar(150) NOT NULL,
            `email` varchar(254) NOT NULL,
            `is_staff` tinyint(1) NOT NULL,
            `is_active` tinyint(1) NOT NULL,
            `date_joined` datetime(6) NOT NULL,
            `role` varchar(20) NOT NULL,
            `derniere_connexion` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `username` (`username`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # Table pour les écoles
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `ecole_ecole` (
            `id` int NOT NULL AUTO_INCREMENT,
            `nom` varchar(255) NOT NULL,
            `adresse` text,
            `telephone` varchar(20) DEFAULT NULL,
            `email` varchar(254) DEFAULT NULL,
            `logo` varchar(100) DEFAULT NULL,
            `annee_scolaire_courante` varchar(20) DEFAULT NULL,
            `configuration` json DEFAULT NULL,
            `created_at` datetime(6) NOT NULL,
            `updated_at` datetime(6) NOT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # Table pour les classes
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `etudiants_classe` (
            `id` int NOT NULL AUTO_INCREMENT,
            `nom` varchar(255) NOT NULL,
            `niveau` varchar(50) NOT NULL,
            `description` text,
            `annee_scolaire` varchar(20) NOT NULL,
            `created_at` datetime(6) NOT NULL,
            `updated_at` datetime(6) NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `nom` (`nom`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # Table pour les étudiants
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `etudiants_etudiant` (
            `id` int NOT NULL AUTO_INCREMENT,
            `nom` varchar(255) NOT NULL,
            `prenom` varchar(255) NOT NULL,
            `date_naissance` date DEFAULT NULL,
            `sexe` varchar(1) DEFAULT NULL,
            `adresse` text,
            `photo` varchar(100) DEFAULT NULL,
            `donnees_biometriques` text,
            `statut` varchar(10) NOT NULL,
            `created_at` datetime(6) NOT NULL,
            `updated_at` datetime(6) NOT NULL,
            `classe_id` int NOT NULL,
            PRIMARY KEY (`id`),
            KEY `etudiants_etudiant_classe_id_fk` (`classe_id`),
            CONSTRAINT `etudiants_etudiant_classe_id_fk` FOREIGN KEY (`classe_id`) REFERENCES `etudiants_classe` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # Table pour les parents
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `etudiants_parent` (
            `id` int NOT NULL AUTO_INCREMENT,
            `nom` varchar(255) NOT NULL,
            `prenom` varchar(255) NOT NULL,
            `telephone` varchar(20) NOT NULL,
            `email` varchar(254) DEFAULT NULL,
            `adresse` text,
            `relation` varchar(10) NOT NULL,
            `notifications_sms` tinyint(1) NOT NULL,
            `notifications_email` tinyint(1) NOT NULL,
            `created_at` datetime(6) NOT NULL,
            `updated_at` datetime(6) NOT NULL,
            `etudiant_id` int NOT NULL,
            PRIMARY KEY (`id`),
            KEY `etudiants_parent_etudiant_id_fk` (`etudiant_id`),
            CONSTRAINT `etudiants_parent_etudiant_id_fk` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants_etudiant` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # Table pour les présences
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `presences_presence` (
            `id` int NOT NULL AUTO_INCREMENT,
            `date` date NOT NULL,
            `heure_arrivee` time(6) DEFAULT NULL,
            `heure_depart` time(6) DEFAULT NULL,
            `statut` varchar(15) NOT NULL,
            `notification_envoyee` tinyint(1) NOT NULL,
            `commentaire` text,
            `created_at` datetime(6) NOT NULL,
            `updated_at` datetime(6) NOT NULL,
            `etudiant_id` int NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `presences_presence_etudiant_id_date_uniq` (`etudiant_id`, `date`),
            CONSTRAINT `presences_presence_etudiant_id_fk` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants_etudiant` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # Table pour les messages
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `presences_message` (
            `id` int NOT NULL AUTO_INCREMENT,
            `type` varchar(5) NOT NULL,
            `contenu` text NOT NULL,
            `date_envoi` datetime(6) NOT NULL,
            `statut` varchar(10) NOT NULL,
            `details_erreur` text,
            `parent_id` int NOT NULL,
            PRIMARY KEY (`id`),
            KEY `presences_message_parent_id_fk` (`parent_id`),
            CONSTRAINT `presences_message_parent_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `etudiants_parent` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # Table pour les données biométriques
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS `reconnaissance_donneesbiometriques` (
            `id` int NOT NULL AUTO_INCREMENT,
            `descripteur_facial` longblob,
            `date_capture` datetime(6) NOT NULL,
            `derniere_mise_a_jour` datetime(6) NOT NULL,
            `etudiant_id` int NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `etudiant_id` (`etudiant_id`),
            CONSTRAINT `reconnaissance_donneesbiometriques_etudiant_id_fk` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants_etudiant` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        print("Tables créées avec succès")
    except mysql.connector.Error as err:
        print(f"Erreur lors de la création des tables: {err}")
    finally:
        cursor.close()
        conn.close()

def insert_initial_data():
    """Insère des données initiales dans la base de données"""
    # Connexion à la base de données
    conn = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
    cursor = conn.cursor()
    
    try:
        # Insérer un utilisateur administrateur
        cursor.execute("""
        INSERT INTO `authentication_utilisateur` 
        (`password`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `date_joined`, `role`)
        VALUES
        ('pbkdf2_sha256$600000$5FmAEEIBfLwXnFOMnRwRtL$ntH7UTx14/8LKcuJwPACWQZoYgGTrwIdU9AKvZ+BvbA=', 1, 'admin', 'Admin', 'User', 'admin@example.com', 1, 1, NOW(), 'admin')
        ON DUPLICATE KEY UPDATE `username` = 'admin';
        """)
        
        # Insérer des classes
        cursor.execute("""
        INSERT INTO `etudiants_classe` (`nom`, `niveau`, `description`, `annee_scolaire`, `created_at`, `updated_at`)
        VALUES
        ('CP1', 'Primaire', 'Cours Préparatoire 1', '2023-2024', NOW(), NOW()),
        ('CP2', 'Primaire', 'Cours Préparatoire 2', '2023-2024', NOW(), NOW()),
        ('CE1', 'Primaire', 'Cours Élémentaire 1', '2023-2024', NOW(), NOW()),
        ('CE2', 'Primaire', 'Cours Élémentaire 2', '2023-2024', NOW(), NOW()),
        ('CM1', 'Primaire', 'Cours Moyen 1', '2023-2024', NOW(), NOW()),
        ('CM2', 'Primaire', 'Cours Moyen 2', '2023-2024', NOW(), NOW())
        ON DUPLICATE KEY UPDATE `niveau` = VALUES(`niveau`);
        """)
        
        conn.commit()
        print("Données initiales insérées avec succès")
    except mysql.connector.Error as err:
        print(f"Erreur lors de l'insertion des données initiales: {err}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("Initialisation de la base de données...")
    create_database()
    create_tables()
    insert_initial_data()
    print("Initialisation terminée.")
