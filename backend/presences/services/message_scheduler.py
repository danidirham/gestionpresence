from django.utils import timezone
from django.db.models import Q
from presences.models import Message
import logging
import sys
import os

# Ajouter le chemin du projet au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Importer directement les classes depuis le module services.py
from presences.services import SMSService, EmailService

logger = logging.getLogger(__name__)

class MessageSchedulerService:
    """
    Service pour gérer les messages programmés
    """

    @staticmethod
    def process_scheduled_messages():
        """
        Traite tous les messages programmés dont la date de programmation est passée
        """
        now = timezone.now()

        # Récupérer tous les messages programmés dont la date est passée
        scheduled_messages = Message.objects.filter(
            statut='programme',
            date_programmee__lte=now
        )

        if not scheduled_messages.exists():
            logger.info("Aucun message programmé à envoyer")
            return {
                'success': True,
                'message': "Aucun message programmé à envoyer",
                'processed': 0,
                'success_count': 0,
                'error_count': 0
            }

        processed = 0
        success_count = 0
        error_count = 0

        # Traiter chaque message programmé
        for message in scheduled_messages:
            try:
                # Envoyer le message selon son type
                if message.type == 'sms':
                    result = MessageSchedulerService._send_sms(message)
                else:  # email
                    result = MessageSchedulerService._send_email(message)

                # Mettre à jour le statut du message
                if result['success']:
                    message.statut = 'envoye'
                    message.date_envoi = now
                    success_count += 1
                else:
                    message.statut = 'echec'
                    message.details_erreur = result.get('message', 'Erreur inconnue')
                    error_count += 1

                message.save()
                processed += 1

            except Exception as e:
                logger.error(f"Erreur lors du traitement du message programmé {message.id}: {str(e)}")
                message.statut = 'echec'
                message.details_erreur = str(e)
                message.save()
                error_count += 1
                processed += 1

        return {
            'success': True,
            'message': f"Traitement terminé: {processed} messages traités, {success_count} succès, {error_count} échecs",
            'processed': processed,
            'success_count': success_count,
            'error_count': error_count
        }

    @staticmethod
    def _send_sms(message):
        """
        Envoie un SMS programmé
        """
        sms_service = SMSService()

        if message.est_message_groupe and message.classe:
            # Envoyer à tous les parents de la classe
            parents = message.classe.get_parents()
            return sms_service.send_bulk_sms(parents, message.contenu)
        elif message.est_message_groupe:
            # Envoyer à tous les parents
            from etudiants.models import Parent
            parents = Parent.objects.filter(notifications_sms=True)
            return sms_service.send_bulk_sms(parents, message.contenu)
        else:
            # Envoyer à un parent spécifique
            return sms_service.send_sms(message.parent.telephone, message.contenu)

    @staticmethod
    def _send_email(message):
        """
        Envoie un email programmé
        """
        email_service = EmailService()

        if message.est_message_groupe and message.classe:
            # Envoyer à tous les parents de la classe
            parents = message.classe.get_parents().filter(
                notifications_email=True
            ).exclude(
                Q(email='') | Q(email__isnull=True)
            )
            return email_service.send_bulk_email(parents, message.sujet, message.contenu)
        elif message.est_message_groupe:
            # Envoyer à tous les parents
            from etudiants.models import Parent
            parents = Parent.objects.filter(
                notifications_email=True
            ).exclude(
                Q(email='') | Q(email__isnull=True)
            )
            return email_service.send_bulk_email(parents, message.sujet, message.contenu)
        else:
            # Envoyer à un parent spécifique
            return email_service.send_email(message.parent.email, message.sujet, message.contenu)
