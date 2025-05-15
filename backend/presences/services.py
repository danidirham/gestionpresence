import requests
from django.conf import settings
import logging
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from email.mime.image import MIMEImage
from email.utils import formatdate

logger = logging.getLogger(__name__)

class SMSService:
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

            # Envoyer la requête à l'API
            response = requests.post(self.api_url, json=payload)

            # Vérifier la réponse
            if response.status_code == 200:
                result = response.json()
                logger.info(f"SMS envoyé avec succès: {result}")
                return {
                    'success': True,
                    'message': 'SMS envoyé avec succès',
                    'details': result
                }
            else:
                logger.error(f"Erreur lors de l'envoi du SMS: {response.text}")
                return {
                    'success': False,
                    'message': f"Erreur lors de l'envoi du SMS: {response.status_code}",
                    'details': response.text
                }

        except Exception as e:
            logger.exception(f"Exception lors de l'envoi du SMS: {str(e)}")
            return {
                'success': False,
                'message': f"Exception lors de l'envoi du SMS: {str(e)}",
                'details': None
            }

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
                    'message': 'Les notifications SMS sont désactivées pour ce parent'
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
        """Nettoie un numéro de téléphone pour s'assurer qu'il est au format international"""
        # Supprimer les espaces, tirets, etc.
        cleaned = ''.join(filter(str.isdigit, phone_number))

        # S'assurer que le numéro commence par le code pays
        if cleaned.startswith('0'):
            cleaned = '33' + cleaned[1:]

        # Ajouter le + si nécessaire
        if not cleaned.startswith('+'):
            cleaned = '+' + cleaned

        return cleaned

    def send_absence_notification(self, parent, etudiant, date):
        """Envoie une notification d'absence aux parents"""
        if not parent.notifications_sms:
            return {
                'success': False,
                'message': 'Les notifications SMS sont désactivées pour ce parent',
                'details': None
            }

        message = f"Bonjour {parent.prenom} {parent.nom}, nous vous informons que votre enfant {etudiant.prenom} {etudiant.nom} est absent aujourd'hui ({date}). Merci de contacter l'école pour plus d'informations."

        return self.send_sms(parent.telephone, message)

    def send_late_notification(self, parent, etudiant, date, heure):
        """Envoie une notification de retard aux parents"""
        if not parent.notifications_sms:
            return {
                'success': False,
                'message': 'Les notifications SMS sont désactivées pour ce parent',
                'details': None
            }

        message = f"Bonjour {parent.prenom} {parent.nom}, nous vous informons que votre enfant {etudiant.prenom} {etudiant.nom} est arrivé en retard aujourd'hui ({date}) à {heure}."

        return self.send_sms(parent.telephone, message)


class EmailService:
    """Service pour l'envoi d'emails"""

    def __init__(self):
        self.smtp_server = settings.EMAIL_HOST
        self.smtp_port = settings.EMAIL_PORT
        self.smtp_username = settings.EMAIL_HOST_USER
        self.smtp_password = settings.EMAIL_HOST_PASSWORD
        self.use_tls = settings.EMAIL_USE_TLS
        self.use_ssl = settings.EMAIL_USE_SSL
        self.default_from_email = settings.DEFAULT_FROM_EMAIL

    def send_email(self, to_email, subject, message, from_email=None, html_message=None, attachments=None, tracking_id=None):
        """
        Envoie un email à une adresse email

        Args:
            to_email (str): Adresse email du destinataire
            subject (str): Sujet de l'email
            message (str): Contenu texte de l'email
            from_email (str, optional): Adresse email de l'expéditeur. Par défaut, utilise DEFAULT_FROM_EMAIL.
            html_message (str, optional): Version HTML du message. Par défaut, None.
            attachments (list, optional): Liste de chemins de fichiers à joindre. Par défaut, None.
            tracking_id (str, optional): ID de suivi pour les statistiques d'ouverture. Par défaut, None.

        Returns:
            dict: Résultat de l'envoi avec les clés 'success', 'message' et 'details'
        """
        try:
            if not from_email:
                from_email = self.default_from_email

            # Créer le message
            msg = MIMEMultipart()
            msg['Subject'] = subject
            msg['From'] = from_email
            msg['To'] = to_email
            msg['Date'] = formatdate(localtime=True)

            # Créer la partie alternative (texte/html)
            alternative = MIMEMultipart('alternative')

            # Ajouter la version texte du message
            alternative.attach(MIMEText(message, 'plain'))

            # Ajouter la version HTML si fournie
            if html_message:
                # Ajouter un pixel de suivi si un ID de suivi est fourni
                if tracking_id:
                    tracking_url = f"{settings.BASE_URL}/api/messages/track/{tracking_id}/"
                    tracking_pixel = f'<img src="{tracking_url}" width="1" height="1" alt="" style="display:none">'
                    html_message += tracking_pixel

                alternative.attach(MIMEText(html_message, 'html'))

            # Ajouter la partie alternative au message
            msg.attach(alternative)

            # Ajouter les pièces jointes
            if attachments:
                for attachment in attachments:
                    # Vérifier si l'attachment est un chemin de fichier ou un objet File
                    if isinstance(attachment, str):
                        # C'est un chemin de fichier
                        filename = os.path.basename(attachment)
                        with open(attachment, 'rb') as f:
                            file_content = f.read()
                    else:
                        # C'est un objet File ou similaire
                        filename = attachment.name
                        attachment.open('rb')
                        file_content = attachment.read()
                        attachment.close()

                    # Déterminer le type de pièce jointe
                    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                        # C'est une image
                        part = MIMEImage(file_content)
                    else:
                        # C'est un autre type de fichier
                        part = MIMEApplication(file_content)

                    # Ajouter les en-têtes
                    part.add_header('Content-Disposition', 'attachment', filename=filename)
                    msg.attach(part)

            # Connexion au serveur SMTP
            if self.use_ssl:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            else:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)

            if self.use_tls:
                server.starttls()

            # Authentification si nécessaire
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)

            # Envoi de l'email
            server.sendmail(from_email, to_email, msg.as_string())
            server.quit()

            logger.info(f"Email envoyé avec succès à {to_email}")
            return {
                'success': True,
                'message': 'Email envoyé avec succès',
                'details': {'to': to_email, 'subject': subject}
            }

        except Exception as e:
            logger.exception(f"Exception lors de l'envoi de l'email: {str(e)}")
            return {
                'success': False,
                'message': f"Exception lors de l'envoi de l'email: {str(e)}",
                'details': None
            }

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
                    'message': 'Les notifications email sont désactivées pour ce parent ou email manquant'
                })
                continue

            result = self.send_email(parent.email, subject, message, html_message=html_message)

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

    def send_absence_notification(self, parent, etudiant, date):
        """Envoie une notification d'absence par email aux parents"""
        if not parent.notifications_email or not parent.email:
            return {
                'success': False,
                'message': 'Les notifications email sont désactivées pour ce parent ou email manquant',
                'details': None
            }

        subject = f"Absence de {etudiant.prenom} {etudiant.nom}"
        message = f"""
Bonjour {parent.prenom} {parent.nom},

Nous vous informons que votre enfant {etudiant.prenom} {etudiant.nom} est absent aujourd'hui ({date}).
Merci de contacter l'école pour plus d'informations.

Cordialement,
L'équipe de l'école
"""

        html_message = f"""
<html>
<body>
    <p>Bonjour {parent.prenom} {parent.nom},</p>
    <p>Nous vous informons que votre enfant <strong>{etudiant.prenom} {etudiant.nom}</strong> est absent aujourd'hui ({date}).</p>
    <p>Merci de contacter l'école pour plus d'informations.</p>
    <p>Cordialement,<br>L'équipe de l'école</p>
</body>
</html>
"""

        return self.send_email(parent.email, subject, message, html_message=html_message)

    def send_late_notification(self, parent, etudiant, date, heure):
        """Envoie une notification de retard par email aux parents"""
        if not parent.notifications_email or not parent.email:
            return {
                'success': False,
                'message': 'Les notifications email sont désactivées pour ce parent ou email manquant',
                'details': None
            }

        subject = f"Retard de {etudiant.prenom} {etudiant.nom}"
        message = f"""
Bonjour {parent.prenom} {parent.nom},

Nous vous informons que votre enfant {etudiant.prenom} {etudiant.nom} est arrivé en retard aujourd'hui ({date}) à {heure}.

Cordialement,
L'équipe de l'école
"""

        html_message = f"""
<html>
<body>
    <p>Bonjour {parent.prenom} {parent.nom},</p>
    <p>Nous vous informons que votre enfant <strong>{etudiant.prenom} {etudiant.nom}</strong> est arrivé en retard aujourd'hui ({date}) à {heure}.</p>
    <p>Cordialement,<br>L'équipe de l'école</p>
</body>
</html>
"""

        return self.send_email(parent.email, subject, message, html_message=html_message)