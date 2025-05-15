import requests
import json

# URL de l'API d'authentification
API_URL = "http://localhost:8000/api/auth/token/"

# Identifiants à tester
credentials = {
    "username": "admin",
    "password": "Admin123!"
}

# Effectuer la requête
response = requests.post(API_URL, json=credentials)

# Afficher les résultats
print(f"Status code: {response.status_code}")
print(f"Response headers: {response.headers}")

try:
    print(f"Response body: {json.dumps(response.json(), indent=2)}")
except:
    print(f"Response body: {response.text}")
