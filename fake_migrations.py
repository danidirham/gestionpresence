import os
import django
from django.db import connection

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_presence.settings')
django.setup()

# Obtenir le curseur de la base de données
cursor = connection.cursor()

# Marquer toutes les migrations comme appliquées
apps = [
    'authentication',
    'ecole',
    'etudiants',
    'reconnaissance'
]

for app in apps:
    # Obtenir toutes les migrations pour cette application
    migrations_dir = os.path.join(app, 'migrations')
    if not os.path.exists(migrations_dir):
        print(f"Le répertoire {migrations_dir} n'existe pas. Création...")
        os.makedirs(migrations_dir)
        # Créer un fichier __init__.py vide
        with open(os.path.join(migrations_dir, '__init__.py'), 'w') as f:
            pass
        print(f"Répertoire {migrations_dir} créé.")
    
    # Trouver toutes les migrations
    migrations = []
    for filename in os.listdir(migrations_dir):
        if filename.endswith('.py') and filename != '__init__.py':
            migration_name = filename[:-3]  # Enlever l'extension .py
            migrations.append(migration_name)
    
    # Insérer les migrations dans la table django_migrations
    for migration in migrations:
        print(f"Marquage de la migration {app}.{migration} comme appliquée...")
        try:
            cursor.execute(
                "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, NOW())",
                [app, migration]
            )
            print(f"Migration {app}.{migration} marquée comme appliquée.")
        except Exception as e:
            print(f"Erreur lors du marquage de la migration {app}.{migration}: {e}")

print("Toutes les migrations ont été marquées comme appliquées.")
