#!/usr/bin/env python
"""
Script pour démarrer directement le serveur Django sans dépendre de pkg_resources.
"""
import os
import sys
import subprocess
from pathlib import Path

def create_mock_opencv():
    """Crée un module mock pour cv2"""
    os.chdir('backend')

    mock_dir = Path('mock_modules')
    mock_dir.mkdir(exist_ok=True)

    # Créer un fichier __init__.py vide
    (mock_dir / '__init__.py').touch()

    # Créer un module mock pour cv2
    with open(mock_dir / 'cv2.py', 'w', encoding='utf-8') as file:
        file.write("""
# Mock module for cv2
class CascadeClassifier:
    def __init__(self, *args, **kwargs):
        pass

    def detectMultiScale(self, *args, **kwargs):
        return []

class face:
    @staticmethod
    def LBPHFaceRecognizer_create():
        return FaceRecognizer()

class FaceRecognizer:
    def __init__(self):
        pass

    def read(self, *args, **kwargs):
        pass

    def write(self, *args, **kwargs):
        pass

    def train(self, *args, **kwargs):
        pass

    def update(self, *args, **kwargs):
        pass

    def predict(self, *args, **kwargs):
        return 0, 0

# Mock data
data = type('obj', (object,), {
    'haarcascades': 'mock_cascades/'
})
""")

    # Ajouter le répertoire mock au path
    sys.path.insert(0, str(mock_dir.absolute()))
    print("Module mock cv2 créé")

def modify_opencv_imports():
    """Modifie les imports OpenCV pour éviter les erreurs"""
    files_to_modify = [
        ('reconnaissance/services.py', 'import cv2', '# import cv2'),
        ('reconnaissance/utils.py', 'import cv2', '# import cv2'),
    ]

    for file_path, old_text, new_text in files_to_modify:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()

            modified_content = content.replace(old_text, new_text)

            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(modified_content)

            print(f"Modifié: {file_path}")

def create_mock_pkg_resources():
    """Crée un module mock pour pkg_resources"""
    mock_dir = Path('mock_modules')
    mock_dir.mkdir(exist_ok=True)

    # Créer un module mock pour pkg_resources
    with open(mock_dir / 'pkg_resources.py', 'w', encoding='utf-8') as file:
        file.write("""
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
    sys.path.insert(0, str(mock_dir.absolute()))
    print("Module mock pkg_resources créé")

def run_django_server():
    """Démarre le serveur Django"""
    try:
        # Exécuter la commande pour démarrer le serveur
        subprocess.run([sys.executable, 'manage.py', 'runserver', '0.0.0.0:8000'])
    except KeyboardInterrupt:
        print("\nServeur arrêté")

def initialize_database():
    """Initialise la base de données (SQLite ou MySQL)"""
    # Vérifier si MySQL est configuré
    use_mysql = False
    env_path = os.path.join('backend', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            env_content = f.read()

        for line in env_content.splitlines():
            if line.startswith('USE_MYSQL=True'):
                use_mysql = True
                break

    if use_mysql:
        print("Initialisation de la base de données MySQL...")
        try:
            # Vérifier si mysqlclient est installé
            try:
                import MySQLdb
                print("Module MySQLdb (mysqlclient) est déjà installé.")
            except ImportError:
                print("Module MySQLdb (mysqlclient) n'est pas installé. Installation en cours...")
                subprocess.run([sys.executable, '-m', 'pip', 'install', 'mysqlclient'], check=True)
                print("Module mysqlclient installé avec succès!")

            # Exécuter les migrations
            subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
            print("Base de données MySQL initialisée avec succès!")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Erreur lors de l'initialisation de la base de données MySQL: {e}")
            print("Passage à SQLite comme solution de secours...")

            # Modifier le fichier .env pour utiliser SQLite
            with open(env_path, 'r') as f:
                env_content = f.read()

            env_content = env_content.replace('USE_MYSQL=True', 'USE_MYSQL=False')

            with open(env_path, 'w') as f:
                f.write(env_content)

            print("Configuration modifiée pour utiliser SQLite.")

            # Initialiser SQLite
            return initialize_sqlite()
        except Exception as e:
            print(f"Erreur inattendue lors de l'initialisation de MySQL: {e}")
            return False
    else:
        return initialize_sqlite()

def initialize_sqlite():
    """Initialise la base de données SQLite"""
    print("Initialisation de la base de données SQLite...")
    try:
        # Exécuter les migrations
        subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
        print("Base de données SQLite initialisée avec succès!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de l'initialisation de la base de données SQLite: {e}")
        return False

def create_superuser():
    """Crée un superutilisateur par défaut si aucun n'existe"""
    print("Vérification de l'existence d'un superutilisateur...")

    # Créer un script temporaire pour vérifier et créer un superutilisateur
    script_content = """
import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_presence.settings')
django.setup()

User = get_user_model()

# Vérifier si un superutilisateur existe déjà
if not User.objects.filter(is_superuser=True).exists():
    print("Création d'un superutilisateur par défaut...")
    User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='admin123'
    )
    print("Superutilisateur 'admin' créé avec succès!")
    print("Nom d'utilisateur: admin")
    print("Mot de passe: admin123")
else:
    print("Un superutilisateur existe déjà.")
"""

    # Écrire le script dans un fichier temporaire
    with open('create_superuser_temp.py', 'w') as f:
        f.write(script_content)

    try:
        # Exécuter le script
        subprocess.run([sys.executable, 'create_superuser_temp.py'], check=True)
        # Supprimer le fichier temporaire
        os.remove('create_superuser_temp.py')
        return True
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de la création du superutilisateur: {e}")
        # Supprimer le fichier temporaire
        if os.path.exists('create_superuser_temp.py'):
            os.remove('create_superuser_temp.py')
        return False

def main():
    """Fonction principale"""
    print("=== Démarrage direct du serveur Django ===")

    print("1. Préparation de l'environnement...")
    create_mock_opencv()
    modify_opencv_imports()
    create_mock_pkg_resources()

    print("2. Initialisation de la base de données...")
    initialize_database()

    print("3. Création d'un superutilisateur si nécessaire...")
    create_superuser()

    print("4. Démarrage du serveur Django...")
    print("\nVous pouvez accéder au tableau de bord administratif à l'adresse: http://localhost:8000/admin/")
    print("Nom d'utilisateur: admin")
    print("Mot de passe: admin123")
    run_django_server()

    return 0

if __name__ == "__main__":
    sys.exit(main())
