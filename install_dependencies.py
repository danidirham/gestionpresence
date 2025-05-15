#!/usr/bin/env python
"""
Script pour installer toutes les dépendances nécessaires dans l'environnement virtuel.
"""
import subprocess
import sys
import os
import platform

def is_windows():
    return platform.system() == "Windows"

def run_command(command):
    """Exécute une commande shell et affiche la sortie en temps réel."""
    print(f"Exécution de: {command}")
    process = subprocess.Popen(
        command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )
    
    for line in process.stdout:
        print(line, end='')
    
    process.wait()
    return process.returncode

def main():
    print("=== Installation des dépendances ===")
    
    # Vérifier si l'environnement virtuel existe
    venv_dir = ".venv"
    if not os.path.exists(venv_dir):
        print("Création de l'environnement virtuel...")
        run_command("python -m venv .venv")
    
    # Déterminer les commandes selon le système d'exploitation
    if is_windows():
        python_cmd = f"{venv_dir}\\Scripts\\python"
        pip_cmd = f"{venv_dir}\\Scripts\\pip"
    else:
        python_cmd = f"{venv_dir}/bin/python"
        pip_cmd = f"{venv_dir}/bin/pip"
    
    # Mettre à jour pip et setuptools
    print("\nMise à jour de pip et setuptools...")
    run_command(f"{pip_cmd} install --upgrade pip setuptools")
    
    # Installer les dépendances une par une
    print("\nInstallation de Django...")
    run_command(f"{pip_cmd} install Django==4.2.7")
    
    print("\nInstallation de Django REST Framework...")
    run_command(f"{pip_cmd} install djangorestframework==3.14.0")
    
    print("\nInstallation de Simple JWT...")
    run_command(f"{pip_cmd} install djangorestframework-simplejwt==5.3.0")
    
    print("\nInstallation de CORS Headers...")
    run_command(f"{pip_cmd} install django-cors-headers==4.3.0")
    
    print("\nInstallation de MySQL Client...")
    run_command(f"{pip_cmd} install mysqlclient==2.2.0")
    
    print("\nInstallation de Pillow...")
    run_command(f"{pip_cmd} install Pillow==10.1.0")
    
    print("\nInstallation de NumPy...")
    run_command(f"{pip_cmd} install numpy==1.26.1")
    
    print("\nInstallation de Requests...")
    run_command(f"{pip_cmd} install requests==2.31.0")
    
    print("\nInstallation de python-dotenv...")
    run_command(f"{pip_cmd} install python-dotenv==1.0.0")
    
    # OpenCV est optionnel car nous utilisons un mock
    print("\nInstallation terminée avec succès!")
    print("\nPour démarrer le serveur Django, exécutez:")
    if is_windows():
        print("cd backend && ..\.venv\Scripts\python run_server.py")
    else:
        print("cd backend && ../.venv/bin/python run_server.py")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
