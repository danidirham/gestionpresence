#!/usr/bin/env python
"""
Script pour installer mysqlclient et configurer Django pour utiliser MySQL.
"""
import os
import sys
import subprocess
import platform

def is_windows():
    """Vérifie si le système d'exploitation est Windows"""
    return platform.system() == "Windows"

def install_mysqlclient():
    """Installe mysqlclient"""
    print("Installation de mysqlclient...")
    try:
        # Sur Windows, il peut être nécessaire d'installer des dépendances supplémentaires
        if is_windows():
            print("Sur Windows, vous devrez peut-être installer les dépendances suivantes :")
            print("1. Visual C++ Build Tools")
            print("2. MySQL Connector C")
            print("Vous pouvez les télécharger depuis :")
            print("- Visual C++ Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/")
            print("- MySQL Connector C: https://dev.mysql.com/downloads/connector/c/")
            
            # Demander confirmation
            response = input("Voulez-vous continuer avec l'installation de mysqlclient ? (o/n) ")
            if response.lower() != 'o':
                print("Installation annulée.")
                return False
        
        # Installer mysqlclient
        subprocess.check_call([sys.executable, "-m", "pip", "install", "mysqlclient"])
        print("mysqlclient installé avec succès!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de l'installation de mysqlclient: {e}")
        return False

def configure_mysql():
    """Configure Django pour utiliser MySQL"""
    print("Configuration de Django pour utiliser MySQL...")
    
    # Créer ou mettre à jour le fichier .env
    env_path = os.path.join('backend', '.env')
    
    # Demander les informations de connexion MySQL
    db_name = input("Nom de la base de données MySQL (par défaut: gestion-ecole): ") or "gestion-ecole"
    db_user = input("Nom d'utilisateur MySQL (par défaut: root): ") or "root"
    db_password = input("Mot de passe MySQL (par défaut: vide): ")
    db_host = input("Hôte MySQL (par défaut: localhost): ") or "localhost"
    db_port = input("Port MySQL (par défaut: 3306): ") or "3306"
    
    # Écrire les informations dans le fichier .env
    with open(env_path, 'w') as f:
        f.write(f"USE_MYSQL=True\n")
        f.write(f"DB_NAME={db_name}\n")
        f.write(f"DB_USER={db_user}\n")
        f.write(f"DB_PASSWORD={db_password}\n")
        f.write(f"DB_HOST={db_host}\n")
        f.write(f"DB_PORT={db_port}\n")
        f.write(f"SECRET_KEY=django-insecure-your-secret-key-here\n")
        f.write(f"DEBUG=True\n")
    
    print(f"Fichier .env créé à {env_path}")
    return True

def main():
    """Fonction principale"""
    print("=== Configuration de MySQL pour Django ===")
    
    if not install_mysqlclient():
        print("Échec de l'installation de mysqlclient.")
        return 1
    
    if not configure_mysql():
        print("Échec de la configuration de MySQL.")
        return 1
    
    print("\nConfiguration terminée avec succès!")
    print("Vous pouvez maintenant démarrer le serveur Django avec MySQL.")
    print("Utilisez le script direct_start.bat pour démarrer le serveur.")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
