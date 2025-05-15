# Instructions pour configurer la tâche planifiée

Ce document explique comment configurer une tâche planifiée sous Windows pour traiter automatiquement les messages programmés.

## Étape 1 : Ouvrir le Planificateur de tâches Windows

1. Appuyez sur la touche Windows + R pour ouvrir la boîte de dialogue Exécuter
2. Tapez `taskschd.msc` et appuyez sur Entrée

## Étape 2 : Créer une nouvelle tâche

1. Dans le panneau de droite, cliquez sur "Créer une tâche de base..."
2. Donnez un nom à la tâche, par exemple "Traitement des messages programmés"
3. Ajoutez une description si nécessaire, puis cliquez sur "Suivant"

## Étape 3 : Configurer le déclencheur

1. Sélectionnez "Quotidiennement" et cliquez sur "Suivant"
2. Définissez l'heure de début (par exemple, minuit)
3. Sélectionnez "Tous les jours" et cliquez sur "Suivant"

## Étape 4 : Configurer l'action

1. Sélectionnez "Démarrer un programme" et cliquez sur "Suivant"
2. Dans le champ "Programme/script", parcourez et sélectionnez le fichier `process_scheduled_messages.bat`
3. Dans le champ "Démarrer dans", entrez le chemin complet vers le dossier backend (par exemple, `D:\gestion-presence-intelligente-main\backend`)
4. Cliquez sur "Suivant"

## Étape 5 : Finaliser la configuration

1. Vérifiez les paramètres et cliquez sur "Terminer"

## Étape 6 : Configurer des options supplémentaires (facultatif)

1. Faites un clic droit sur la tâche nouvellement créée et sélectionnez "Propriétés"
2. Dans l'onglet "Déclencheurs", cliquez sur "Modifier" pour le déclencheur existant
3. Cochez "Répéter la tâche toutes les" et sélectionnez "5 minutes" dans le menu déroulant
4. Définissez "pendant une durée de" à "Indéfiniment"
5. Cliquez sur "OK" pour enregistrer les modifications

## Vérification

Pour vérifier que la tâche fonctionne correctement :

1. Faites un clic droit sur la tâche et sélectionnez "Exécuter"
2. Vérifiez le fichier `scheduled_messages.log` dans le dossier backend pour voir les résultats

## Remarques

- Assurez-vous que l'ordinateur est allumé aux heures où la tâche doit s'exécuter
- Si l'ordinateur est éteint à l'heure prévue, la tâche ne s'exécutera pas
- Pour un environnement de production, il est recommandé d'utiliser un serveur Linux avec cron
