#!/usr/bin/env python
"""
Script pour installer setuptools dans l'environnement virtuel existant.
"""
import subprocess
import sys
import os
import platform

def is_windows():
    return platform.system() == "Windows"

def main():
    print("Installation de setuptools...")
    
    # Déterminer le chemin de pip dans l'environnement virtuel
    if is_windows():
        pip_cmd = ".venv\\Scripts\\pip"
    else:
        pip_cmd = ".venv/bin/pip"
    
    # Installer setuptools
    try:
        subprocess.check_call([pip_cmd, "install", "setuptools==69.0.3"])
        print("setuptools installé avec succès!")
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de l'installation de setuptools: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
