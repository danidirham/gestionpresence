@echo off
echo === Patch de rest_framework_simplejwt et démarrage du serveur backend ===

echo 1. Application du patch pour contourner la dépendance à pkg_resources...
python patch_simplejwt.py

echo 2. Démarrage du serveur Django...
cd backend
python run_server.py

pause
