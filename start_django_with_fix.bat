@echo off
echo === Démarrage du serveur Django avec correction pkg_resources ===

echo 1. Application de la correction pour pkg_resources...
python fix_simplejwt.py

echo 2. Démarrage du serveur Django...
cd backend
python run_server.py

pause
