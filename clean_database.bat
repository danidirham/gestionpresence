@echo off
echo === Nettoyage de la base de données ===

echo 1. Vérification de l'environnement Python...
python -c "import sys; print(f'Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"

echo 2. Installation des dépendances nécessaires...
python -m pip install mysql-connector-python python-dotenv

echo 3. Exécution du script de nettoyage...
python clean_database.py

echo 4. Nettoyage terminé.
pause
