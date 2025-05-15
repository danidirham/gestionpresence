#!/usr/bin/env python
"""
Script pour patcher le fichier __init__.py de rest_framework_simplejwt
afin de contourner la dépendance à pkg_resources.
"""
import os
import sys
import site
import subprocess

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

def patch_file(file_path):
    """Patche le fichier pour contourner la dépendance à pkg_resources"""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Vérifier si le fichier contient déjà l'import de pkg_resources
    if 'from pkg_resources import' in content:
        # Remplacer l'import par une version mockée
        patched_content = content.replace(
            'from pkg_resources import DistributionNotFound, get_distribution',
            '''
# Mock pour pkg_resources
try:
    from pkg_resources import DistributionNotFound, get_distribution
except ImportError:
    class DistributionNotFound(Exception):
        pass
    
    def get_distribution(dist):
        class MockDistribution:
            def __init__(self):
                self.version = "5.3.0"  # Version fixe pour rest_framework_simplejwt
        return MockDistribution()
'''
        )
        
        # Sauvegarder le fichier patché
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(patched_content)
        
        print(f"Fichier patché avec succès: {file_path}")
        return True
    else:
        print(f"Le fichier ne contient pas l'import attendu: {file_path}")
        return False

def main():
    print("Recherche et patch du fichier __init__.py de rest_framework_simplejwt...")
    
    file_path = find_simplejwt_init()
    if not file_path:
        return 1
    
    if patch_file(file_path):
        print("Patch appliqué avec succès!")
        print("Vous pouvez maintenant démarrer le serveur Django.")
        return 0
    else:
        print("Échec de l'application du patch.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
