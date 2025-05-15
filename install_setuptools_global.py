#!/usr/bin/env python
"""
Script pour installer setuptools dans l'environnement Python global.
"""
import subprocess
import sys

def main():
    print("Installation de setuptools dans l'environnement Python global...")
    
    try:
        # Installer setuptools
        subprocess.check_call([sys.executable, "-m", "pip", "install", "setuptools"])
        print("setuptools installé avec succès!")
        
        # Vérifier l'installation
        try:
            import pkg_resources
            print(f"pkg_resources (version {pkg_resources.__version__}) est maintenant disponible.")
            return 0
        except ImportError:
            print("ERREUR: pkg_resources n'est toujours pas disponible après l'installation.")
            return 1
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de l'installation de setuptools: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
