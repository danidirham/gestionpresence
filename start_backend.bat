@echo off
echo === Démarrage du serveur backend ===
cd backend
..\\.venv\\Scripts\\python -m pip install djangorestframework djangorestframework-simplejwt django-cors-headers
..\\.venv\\Scripts\\python run_server.py
pause
