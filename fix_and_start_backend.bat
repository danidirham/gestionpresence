@echo off
echo === Installation de setuptools et démarrage du serveur backend ===

echo 1. Installation de setuptools...
pip install setuptools

echo 2. Démarrage du serveur Django...
cd backend
python run_server.py

pause
