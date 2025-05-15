#!/usr/bin/env python
"""
Script d'installation et de démarrage pour le projet Gestion de Présence Intelligente.
Ce script installe les dépendances nécessaires et démarre les serveurs backend et frontend.
"""
import os
import sys
import subprocess
import platform

def is_windows():
    return platform.system() == "Windows"

def run_command(command, cwd=None):
    """Exécute une commande shell et affiche la sortie en temps réel."""
    print(f"Exécution de: {command}")
    process = subprocess.Popen(
        command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        cwd=cwd
    )

    for line in process.stdout:
        print(line, end='')

    process.wait()
    return process.returncode

def setup_backend():
    """Configure l'environnement backend et installe les dépendances."""
    print("\n=== Configuration du Backend ===\n")

    # Vérifier si l'environnement virtuel existe déjà
    venv_dir = ".venv"
    if not os.path.exists(venv_dir):
        print("Création de l'environnement virtuel Python...")
        run_command("python -m venv .venv")

    # Activer l'environnement virtuel et installer les dépendances
    if is_windows():
        activate_cmd = f"{venv_dir}\\Scripts\\activate"
        pip_cmd = f"{venv_dir}\\Scripts\\pip"
    else:
        activate_cmd = f"source {venv_dir}/bin/activate"
        pip_cmd = f"{venv_dir}/bin/pip"

    print("Installation des dépendances Python...")
    if is_windows():
        run_command(f"{pip_cmd} install -U pip setuptools")
        run_command(f"{pip_cmd} install -r backend/requirements.txt")
    else:
        run_command(f"{activate_cmd} && pip install -U pip setuptools && pip install -r backend/requirements.txt", shell=True)

    print("Configuration du backend terminée avec succès!")

def start_backend():
    """Démarre le serveur backend Django."""
    print("\n=== Démarrage du serveur Backend ===\n")

    if is_windows():
        python_cmd = ".venv\\Scripts\\python"
    else:
        python_cmd = ".venv/bin/python"

    # Changer de répertoire pour exécuter le script dans le bon contexte
    os.chdir("backend")
    run_command(f"{python_cmd} run_server.py")
    os.chdir("..")

def main():
    """Fonction principale qui exécute le script d'installation."""
    print("=== Installation du projet Gestion de Présence Intelligente ===")

    # Configurer le backend
    setup_backend()

    # Démarrer le backend
    start_backend()

if __name__ == "__main__":
    main()
