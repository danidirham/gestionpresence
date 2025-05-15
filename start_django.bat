@echo off
echo === Démarrage du serveur Django ===

cd backend

echo 1. Installation de setuptools...
pip install setuptools

echo 2. Démarrage du serveur Django...
python run_server.py

pause
