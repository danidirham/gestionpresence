# Traitement des messages programmés

Ce document explique comment utiliser le système de messages programmés dans l'application de gestion de présence.

## Fonctionnalités

Le système de messages programmés permet de :
- Programmer l'envoi de messages (SMS ou emails) à une date et heure spécifiques
- Envoyer des messages à un parent spécifique ou à un groupe de parents
- Suivre l'état des messages (programmé, envoyé, échec)
- Obtenir des statistiques sur les messages envoyés

## Configuration technique

### Base de données

Le modèle `Message` a été mis à jour avec les champs suivants :
- `date_programmee` : Date et heure de programmation du message
- `est_lu` : Indique si un email a été lu
- `date_lecture` : Date et heure de lecture du message
- `statut` : Statut du message (brouillon, programme, en_attente, envoye, echec)

### API

Les endpoints suivants ont été ajoutés :
- `GET /api/messages/scheduled/` : Liste tous les messages programmés
- `POST /api/messages/process_scheduled/` : Traite les messages programmés
- `POST /api/messages/{id}/mark_as_read/` : Marque un message comme lu
- `GET /api/messages/message_stats/` : Obtient des statistiques sur les messages

## Utilisation

### Programmer un message

Pour programmer un message, définissez une date dans le champ `date_programmee` et mettez le statut à 'programme'.

Exemple de requête API :
```json
POST /api/messages/
{
  "type": "email",
  "sujet": "Réunion parents-professeurs",
  "contenu": "Bonjour, nous vous rappelons la réunion parents-professeurs du 15 juin.",
  "statut": "programme",
  "date_programmee": "2025-06-14T18:00:00Z",
  "est_message_groupe": true,
  "classe": 5
}
```

### Traitement automatique des messages programmés

Un script a été créé pour traiter automatiquement les messages programmés. Ce script peut être exécuté manuellement ou configuré comme une tâche planifiée.

#### Exécution manuelle

```
python process_scheduled_messages.py
```

#### Configuration comme tâche planifiée sous Windows

1. Ouvrez le Planificateur de tâches Windows (taskschd.msc)
2. Créez une nouvelle tâche de base
3. Donnez un nom à la tâche (ex: "Traitement des messages programmés")
4. Configurez le déclencheur (ex: toutes les 5 minutes)
5. Sélectionnez "Démarrer un programme" comme action
6. Parcourez et sélectionnez le fichier `process_scheduled_messages.bat`
7. Définissez le dossier de démarrage comme le dossier backend du projet

## Logs

Le script génère des logs dans le fichier `scheduled_messages.log` dans le dossier backend. Ces logs contiennent des informations sur les messages traités, les succès et les échecs.

## Remarques importantes

- En mode de développement, le script simule l'envoi des messages pour éviter d'envoyer de vrais SMS ou emails
- Pour activer l'envoi réel, décommentez les sections correspondantes dans le script
- Pour un environnement de production, il est recommandé d'utiliser un serveur Linux avec cron plutôt que le Planificateur de tâches Windows
