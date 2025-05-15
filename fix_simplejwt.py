#!/usr/bin/env python
"""
Script pour corriger le problème de pkg_resources dans rest_framework_simplejwt.
Ce script crée un module pkg_resources factice si nécessaire.
"""
import os
import sys
import importlib.util
import site

def find_simplejwt_init():
    """Trouve le chemin du fichier __init__.py de rest_framework_simplejwt"""
    # Chemins possibles
    possible_paths = []
    
    # Chemin dans site-packages
    for site_dir in site.getsitepackages():
        path = os.path.join(site_dir, 'rest_framework_simplejwt', '__init__.py')
        if os.path.exists(path):
            possible_paths.append(path)
    
    # Chemin dans l'environnement virtuel
    venv_path = os.path.join('.venv', 'Lib', 'site-packages', 'rest_framework_simplejwt', '__init__.py')
    if os.path.exists(venv_path):
        possible_paths.append(venv_path)
    
    if not possible_paths:
        print("Impossible de trouver le fichier __init__.py de rest_framework_simplejwt")
        return None
    
    print(f"Fichiers trouvés: {possible_paths}")
    return possible_paths[0]

def create_mock_pkg_resources():
    """Crée un module mock pour pkg_resources"""
    mock_dir = os.path.join(os.path.dirname(__file__), 'mock_modules')
    os.makedirs(mock_dir, exist_ok=True)
    
    # Créer un fichier __init__.py vide
    with open(os.path.join(mock_dir, '__init__.py'), 'w') as f:
        pass
    
    # Créer un module mock pour pkg_resources
    with open(os.path.join(mock_dir, 'pkg_resources.py'), 'w') as f:
        f.write("""
# Mock module for pkg_resources
class DistributionNotFound(Exception):
    pass

def get_distribution(dist):
    class MockDistribution:
        def __init__(self):
            self.version = "5.3.0"  # Version fixe pour rest_framework_simplejwt
    return MockDistribution()
""")
    
    # Ajouter le répertoire mock au path
    sys.path.insert(0, os.path.abspath(mock_dir))
    print("Module mock pkg_resources créé")
    
    # Vérifier si le module est correctement mocké
    try:
        import pkg_resources
        print("Module pkg_resources mocké chargé avec succès")
        return True
    except ImportError:
        print("Erreur lors du chargement du module pkg_resources mocké")
        return False

def main():
    """Fonction principale"""
    print("Correction du problème de pkg_resources...")
    
    # Vérifier si pkg_resources est déjà disponible
    try:
        import pkg_resources
        print("pkg_resources est déjà installé, pas besoin de correction")
        return 0
    except ImportError:
        print("pkg_resources n'est pas disponible, création d'un module mock...")
    
    # Créer un module mock pour pkg_resources
    if not create_mock_pkg_resources():
        print("Échec de la création du module mock pkg_resources")
        return 1
    
    print("Correction terminée avec succès!")
    print("Vous pouvez maintenant démarrer le serveur Django.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
