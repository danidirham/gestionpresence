"""
Script pour traiter les messages programmés.
Ce script est conçu pour être exécuté par le Planificateur de tâches Windows.
"""

import os
import sys
import django
import logging
import requests
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate

# Configurer le logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('scheduled_messages.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Configurer l'environnement Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_presence.settings')
django.setup()

# Importer les modèles Django après avoir configuré l'environnement
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
from presences.models import Message
from etudiants.models import Parent

# Classes de service simplifiées pour l'envoi de messages
class SimpleSMSService:
    def __init__(self):
        self.api_key = settings.SMS_API_KEY
        self.api_url = settings.SMS_API_URL
        self.sender = settings.SMS_SENDER_NAME

    def send_sms(self, phone_number, message):
        """Envoie un SMS à un numéro de téléphone"""
        try:
            # Nettoyer le numéro de téléphone
            phone_number = self._clean_phone_number(phone_number)

            # Préparer les données pour l'API
            payload = {
                'apiKey': self.api_key,
                'to': phone_number,
                'from': self.sender,
                'message': message
            }

            # Simuler l'envoi (pour éviter d'envoyer de vrais SMS pendant les tests)
            logger.info(f"Simulation d'envoi de SMS à {phone_number}: {message[:50]}...")

            # Décommenter pour un envoi réel
            # response = requests.post(self.api_url, json=payload)
            # if response.status_code == 200:
            #     result = response.json()
            #     return {'success': True, 'message': 'SMS envoyé avec succès', 'details': result}
            # else:
            #     return {'success': False, 'message': f"Erreur: {response.status_code}", 'details': response.text}

            # Simulation de succès
            return {'success': True, 'message': 'SMS envoyé avec succès (simulation)', 'details': None}

        except Exception as e:
            logger.exception(f"Exception lors de l'envoi du SMS: {str(e)}")
            return {'success': False, 'message': f"Exception: {str(e)}", 'details': None}

    def send_bulk_sms(self, parents, message):
        """Envoie un SMS à plusieurs parents"""
        results = {
            'success': 0,
            'failed': 0,
            'total': len(parents),
            'details': []
        }

        for parent in parents:
            if not parent.notifications_sms:
                results['failed'] += 1
                results['details'].append({
                    'parent': f"{parent.prenom} {parent.nom}",
                    'success': False,
                    'message': 'Notifications SMS désactivées'
                })
                continue

            result = self.send_sms(parent.telephone, message)

            if result['success']:
                results['success'] += 1
            else:
                results['failed'] += 1

            results['details'].append({
                'parent': f"{parent.prenom} {parent.nom}",
                'success': result['success'],
                'message': result['message']
            })

        return results

    def _clean_phone_number(self, phone_number):
        """Nettoie un numéro de téléphone"""
        # Supprimer les espaces, tirets, etc.
        cleaned = ''.join(filter(str.isdigit, phone_number))

        # S'assurer que le numéro commence par le code pays
        if cleaned.startswith('0'):
            cleaned = '33' + cleaned[1:]

        # Ajouter le + si nécessaire
        if not cleaned.startswith('+'):
            cleaned = '+' + cleaned

        return cleaned

class SimpleEmailService:
    """Service simplifié pour l'envoi d'emails"""

    def __init__(self):
        self.smtp_server = settings.EMAIL_HOST
        self.smtp_port = settings.EMAIL_PORT
        self.smtp_username = settings.EMAIL_HOST_USER
        self.smtp_password = settings.EMAIL_HOST_PASSWORD
        self.use_tls = settings.EMAIL_USE_TLS
        self.use_ssl = settings.EMAIL_USE_SSL
        self.default_from_email = settings.DEFAULT_FROM_EMAIL

    def send_email(self, to_email, subject, message, html_message=None):
        """Envoie un email"""
        try:
            # Simuler l'envoi (pour éviter d'envoyer de vrais emails pendant les tests)
            logger.info(f"Simulation d'envoi d'email à {to_email}: {subject}")

            # Décommenter pour un envoi réel
            # msg = MIMEMultipart()
            # msg['Subject'] = subject
            # msg['From'] = self.default_from_email
            # msg['To'] = to_email
            # msg['Date'] = formatdate(localtime=True)
            #
            # # Ajouter la partie texte
            # msg.attach(MIMEText(message, 'plain'))
            #
            # # Ajouter la partie HTML si fournie
            # if html_message:
            #     msg.attach(MIMEText(html_message, 'html'))
            #
            # # Connexion au serveur SMTP
            # if self.use_ssl:
            #     server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            # else:
            #     server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            #
            # if self.use_tls:
            #     server.starttls()
            #
            # # Authentification
            # if self.smtp_username and self.smtp_password:
            #     server.login(self.smtp_username, self.smtp_password)
            #
            # # Envoi
            # server.sendmail(self.default_from_email, to_email, msg.as_string())
            # server.quit()

            # Simulation de succès
            return {'success': True, 'message': 'Email envoyé avec succès (simulation)', 'details': None}

        except Exception as e:
            logger.exception(f"Exception lors de l'envoi de l'email: {str(e)}")
            return {'success': False, 'message': f"Exception: {str(e)}", 'details': None}

    def send_bulk_email(self, parents, subject, message, html_message=None):
        """Envoie un email à plusieurs parents"""
        results = {
            'success': 0,
            'failed': 0,
            'total': len(parents),
            'details': []
        }

        for parent in parents:
            if not parent.notifications_email or not parent.email:
                results['failed'] += 1
                results['details'].append({
                    'parent': f"{parent.prenom} {parent.nom}",
                    'success': False,
                    'message': 'Notifications email désactivées ou email manquant'
                })
                continue

            result = self.send_email(parent.email, subject, message, html_message)

            if result['success']:
                results['success'] += 1
            else:
                results['failed'] += 1

            results['details'].append({
                'parent': f"{parent.prenom} {parent.nom}",
                'success': result['success'],
                'message': result['message']
            })

        return results

def process_scheduled_messages():
    """
    Traite tous les messages programmés dont la date de programmation est passée
    """
    now = timezone.now()
    logger.info(f"Recherche des messages programmés à {now}")

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

    sms_service = SimpleSMSService()
    email_service = SimpleEmailService()

    # Traiter chaque message programmé
    for message in scheduled_messages:
        try:
            # Envoyer le message selon son type
            if message.type == 'sms':
                if message.est_message_groupe and message.classe:
                    # Envoyer à tous les parents de la classe
                    parents = Parent.objects.filter(etudiant__classe=message.classe, notifications_sms=True).distinct()
                    result = sms_service.send_bulk_sms(parents, message.contenu)
                elif message.est_message_groupe:
                    # Envoyer à tous les parents
                    parents = Parent.objects.filter(notifications_sms=True)
                    result = sms_service.send_bulk_sms(parents, message.contenu)
                else:
                    # Envoyer à un parent spécifique
                    result = sms_service.send_sms(message.parent.telephone, message.contenu)
            else:  # email
                if message.est_message_groupe and message.classe:
                    # Envoyer à tous les parents de la classe
                    parents = Parent.objects.filter(
                        etudiant__classe=message.classe,
                        notifications_email=True
                    ).exclude(
                        Q(email='') | Q(email__isnull=True)
                    ).distinct()
                    result = email_service.send_bulk_email(parents, message.sujet, message.contenu)
                elif message.est_message_groupe:
                    # Envoyer à tous les parents
                    parents = Parent.objects.filter(
                        notifications_email=True
                    ).exclude(
                        Q(email='') | Q(email__isnull=True)
                    )
                    result = email_service.send_bulk_email(parents, message.sujet, message.contenu)
                else:
                    # Envoyer à un parent spécifique
                    result = email_service.send_email(message.parent.email, message.sujet, message.contenu)

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

def main():
    """
    Fonction principale pour traiter les messages programmés
    """
    logger.info(f"Démarrage du traitement des messages programmés à {datetime.now()}")

    try:
        result = process_scheduled_messages()

        logger.info(f"Traitement terminé: {result['processed']} messages traités, "
                   f"{result['success_count']} succès, {result['error_count']} échecs")

        return f"Traitement terminé: {result['processed']} messages traités"

    except Exception as e:
        logger.error(f"Erreur lors du traitement des messages programmés: {str(e)}")
        return f"Erreur: {str(e)}"

if __name__ == '__main__':
    main()
