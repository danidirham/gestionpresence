@echo off
echo === Installation des dépendances frontend ===

cd frontend

echo 1. Installation des dépendances pour les graphiques et les icônes...
npm install recharts lucide-react

echo 2. Installation terminée avec succès!
echo Vous pouvez maintenant démarrer le frontend avec la commande:
echo npm run dev

pause
