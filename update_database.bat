@echo off
echo === Mise à jour de la base de données ===

echo 1. Vérification de l'environnement Python...
python -c "import sys; print(f'Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"

echo 2. Installation des dépendances nécessaires...
python -m pip install python-dotenv

echo 3. Exécution du script de mise à jour...
python update_database.py

echo 4. Mise à jour terminée.
pause
