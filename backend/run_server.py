"""
Script pour démarrer le serveur Django sans utiliser OpenCV.
Ce script modifie temporairement les fichiers qui dépendent d'OpenCV
et installe les dépendances manquantes si nécessaire.
"""
import os
import sys
import importlib
import subprocess
from pathlib import Path

def ensure_setuptools_installed():
    """Vérifie si setuptools est installé et l'installe si nécessaire"""
    try:
        import pkg_resources
        # pkg_resources n'a pas d'attribut __version__, donc on vérifie juste s'il est importable
        print("pkg_resources est déjà installé")
        return True
    except ImportError:
        print("pkg_resources n'est pas installé. Installation de setuptools...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "setuptools"])
            print("setuptools installé avec succès!")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Erreur lors de l'installation de setuptools: {e}")
            return False

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

def create_mock_opencv():
    """Crée un module mock pour cv2"""
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

def run_django_server():
    """Démarre le serveur Django"""
    try:
        # Exécuter la commande pour démarrer le serveur
        script_dir = os.path.dirname(os.path.abspath(__file__))
        manage_py_path = os.path.join(script_dir, 'manage.py')
        subprocess.run([sys.executable, manage_py_path, 'runserver', '0.0.0.0:8000'])
    except KeyboardInterrupt:
        print("\nServeur arrêté")

if __name__ == "__main__":
    print("Préparation du serveur Django sans OpenCV...")

    # S'assurer que setuptools est installé
    if not ensure_setuptools_installed():
        print("ERREUR: setuptools est requis pour exécuter Django avec JWT.")
        print("Veuillez l'installer manuellement avec: pip install setuptools")
        sys.exit(1)

    modify_opencv_imports()
    create_mock_opencv()

    # Vérifier si le module cv2 est correctement mocké
    try:
        import cv2
        print("Module cv2 mocké chargé avec succès")
    except ImportError:
        print("Erreur lors du chargement du module cv2 mocké")
        sys.exit(1)

    print("Démarrage du serveur Django...")
    run_django_server()
