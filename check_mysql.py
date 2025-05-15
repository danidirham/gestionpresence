#!/usr/bin/env python
"""
Script pour vérifier si MySQL est installé et accessible.
"""
import os
import sys
import subprocess
import platform

def is_windows():
    """Vérifie si le système d'exploitation est Windows"""
    return platform.system() == "Windows"

def check_mysql_installed():
    """Vérifie si MySQL est installé"""
    print("Vérification de l'installation de MySQL...")
    
    try:
        if is_windows():
            # Sur Windows, vérifier si le service MySQL est installé
            result = subprocess.run(
                ["sc", "query", "MySQL"],
                capture_output=True,
                text=True,
                check=False
            )
            if "RUNNING" in result.stdout:
                print("Le service MySQL est installé et en cours d'exécution.")
                return True
            elif "SERVICE_NAME: MySQL" in result.stdout:
                print("Le service MySQL est installé mais n'est pas en cours d'exécution.")
                return True
            else:
                print("Le service MySQL n'est pas installé.")
                return False
        else:
            # Sur Linux/macOS, vérifier si la commande mysql est disponible
            result = subprocess.run(
                ["which", "mysql"],
                capture_output=True,
                text=True,
                check=False
            )
            if result.returncode == 0:
                print("MySQL est installé.")
                return True
            else:
                print("MySQL n'est pas installé.")
                return False
    except Exception as e:
        print(f"Erreur lors de la vérification de l'installation de MySQL: {e}")
        return False

def check_mysql_connection():
    """Vérifie si la connexion à MySQL est possible"""
    print("\nVérification de la connexion à MySQL...")
    
    # Lire les informations de connexion depuis le fichier .env
    env_path = os.path.join('backend', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            env_content = f.read()
        
        # Extraire les informations de connexion
        db_host = None
        db_user = None
        db_password = None
        db_name = None
        
        for line in env_content.splitlines():
            if line.startswith('DB_HOST='):
                db_host = line.split('=', 1)[1]
            elif line.startswith('DB_USER='):
                db_user = line.split('=', 1)[1]
            elif line.startswith('DB_PASSWORD='):
                db_password = line.split('=', 1)[1]
            elif line.startswith('DB_NAME='):
                db_name = line.split('=', 1)[1]
        
        if db_host and db_user is not None and db_name:
            print(f"Tentative de connexion à MySQL avec les informations suivantes:")
            print(f"Hôte: {db_host}")
            print(f"Utilisateur: {db_user}")
            print(f"Base de données: {db_name}")
            
            try:
                # Tenter de se connecter à MySQL
                if is_windows():
                    mysql_cmd = "mysql"
                else:
                    mysql_cmd = "mysql"
                
                # Construire la commande
                cmd = [mysql_cmd, "-h", db_host, "-u", db_user]
                if db_password:
                    cmd.extend(["-p" + db_password])
                cmd.extend(["-e", "SELECT 1;"])
                
                # Exécuter la commande
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    check=False
                )
                
                if result.returncode == 0:
                    print("Connexion à MySQL réussie!")
                    
                    # Vérifier si la base de données existe
                    cmd = [mysql_cmd, "-h", db_host, "-u", db_user]
                    if db_password:
                        cmd.extend(["-p" + db_password])
                    cmd.extend(["-e", f"USE {db_name};"])
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        check=False
                    )
                    
                    if result.returncode == 0:
                        print(f"La base de données '{db_name}' existe.")
                        return True
                    else:
                        print(f"La base de données '{db_name}' n'existe pas.")
                        
                        # Demander si l'utilisateur souhaite créer la base de données
                        response = input("Voulez-vous créer la base de données? (o/n) ")
                        if response.lower() == 'o':
                            cmd = [mysql_cmd, "-h", db_host, "-u", db_user]
                            if db_password:
                                cmd.extend(["-p" + db_password])
                            cmd.extend(["-e", f"CREATE DATABASE `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"])
                            
                            result = subprocess.run(
                                cmd,
                                capture_output=True,
                                text=True,
                                check=False
                            )
                            
                            if result.returncode == 0:
                                print(f"Base de données '{db_name}' créée avec succès!")
                                return True
                            else:
                                print(f"Erreur lors de la création de la base de données: {result.stderr}")
                                return False
                        else:
                            print("Création de la base de données annulée.")
                            return False
                else:
                    print(f"Erreur de connexion à MySQL: {result.stderr}")
                    return False
            except Exception as e:
                print(f"Erreur lors de la connexion à MySQL: {e}")
                return False
        else:
            print("Informations de connexion incomplètes dans le fichier .env")
            return False
    else:
        print(f"Le fichier .env n'existe pas à l'emplacement {env_path}")
        return False

def main():
    """Fonction principale"""
    print("=== Vérification de MySQL ===\n")
    
    if not check_mysql_installed():
        print("\nMySQL n'est pas installé ou n'est pas accessible.")
        print("Veuillez installer MySQL et réessayer.")
        print("Vous pouvez télécharger MySQL depuis: https://dev.mysql.com/downloads/")
        return 1
    
    if not check_mysql_connection():
        print("\nLa connexion à MySQL a échoué.")
        print("Veuillez vérifier les informations de connexion dans le fichier backend/.env")
        return 1
    
    print("\nMySQL est correctement configuré et accessible!")
    print("Vous pouvez maintenant démarrer le serveur Django avec MySQL.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
