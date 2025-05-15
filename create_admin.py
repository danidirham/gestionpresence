#!/usr/bin/env python
"""
Script pour créer un superutilisateur Django.
"""
import os
import sys
import django
from pathlib import Path

def main():
    """Fonction principale"""
    print("=== Création d'un superutilisateur Django ===")
    
    # Changer de répertoire pour le backend
    os.chdir('backend')
    
    # Configurer l'environnement Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_presence.settings')
    django.setup()
    
    # Importer le modèle utilisateur
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Vérifier si un superutilisateur existe déjà
    if User.objects.filter(is_superuser=True).exists():
        print("Un superutilisateur existe déjà.")
        print("Vous pouvez utiliser les identifiants existants pour vous connecter au tableau de bord administratif.")
        return 0
    
    # Créer un superutilisateur
    username = input("Nom d'utilisateur (par défaut: admin): ") or "admin"
    email = input("Adresse e-mail (par défaut: admin@example.com): ") or "admin@example.com"
    password = input("Mot de passe (par défaut: admin123): ") or "admin123"
    
    try:
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"\nSuperutilisateur '{username}' créé avec succès!")
        print("\nVous pouvez maintenant vous connecter au tableau de bord administratif avec ces identifiants:")
        print(f"Nom d'utilisateur: {username}")
        print(f"Mot de passe: {password}")
        print("\nURL du tableau de bord administratif: http://localhost:8000/admin/")
        return 0
    except Exception as e:
        print(f"Erreur lors de la création du superutilisateur: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
