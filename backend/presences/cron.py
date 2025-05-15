import logging
from django.utils import timezone
from presences.services.message_scheduler import MessageSchedulerService

logger = logging.getLogger(__name__)

def process_scheduled_messages():
    """
    Tâche cron pour traiter les messages programmés
    Cette fonction sera exécutée selon la planification définie dans settings.py
    """
    logger.info(f"[CRON] Démarrage du traitement des messages programmés à {timezone.now()}")
    
    try:
        result = MessageSchedulerService.process_scheduled_messages()
        
        logger.info(f"[CRON] Traitement terminé: {result['processed']} messages traités, "
                   f"{result['success_count']} succès, {result['error_count']} échecs")
        
        return f"Traitement terminé: {result['processed']} messages traités"
    
    except Exception as e:
        logger.error(f"[CRON] Erreur lors du traitement des messages programmés: {str(e)}")
        return f"Erreur: {str(e)}"
