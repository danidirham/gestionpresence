from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta

from .serializers import (
    UtilisateurSerializer, CustomTokenObtainPairSerializer,
    EcoleSerializer, ClasseSerializer, ClasseDetailSerializer,
    EtudiantSerializer, EtudiantListSerializer, EtudiantDetailSerializer,
    ParentSerializer, ParentDetailSerializer,
    PresenceSerializer, PresenceDetailSerializer,
    MessageSerializer, MessageDetailSerializer, BulkMessageSerializer,
    DonneesBiometriquesSerializer
)
from django.conf import settings as django_settings
import base64
import os
from django.core.files.base import ContentFile

from django.contrib.auth import get_user_model
from django.db.models import Q
from ecole.models import Ecole
from etudiants.models import Classe, Etudiant, Parent
from presences.models import Presence, Message
from reconnaissance.models import DonneesBiometriques
from reconnaissance.services import FaceRecognitionService
from presences.services import SMSService, EmailService
from presences.services.message_scheduler import MessageSchedulerService

User = get_user_model()

# Vues pour l'authentification
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    serializer = UtilisateurSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UtilisateurSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.set_password(request.data['password'])
        user.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Vues pour l'école
class EcoleViewSet(viewsets.ModelViewSet):
    queryset = Ecole.objects.all()
    serializer_class = EcoleSerializer

# Vues pour les classes
class ClasseViewSet(viewsets.ModelViewSet):
    queryset = Classe.objects.all().order_by('nom')
    serializer_class = ClasseSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ClasseDetailSerializer
        return ClasseSerializer

    @action(detail=True, methods=['get'])
    def etudiants(self, request, pk=None):
        classe = self.get_object()
        etudiants = classe.etudiants.all()
        serializer = EtudiantListSerializer(etudiants, many=True)
        return Response(serializer.data)

# Vues pour les étudiants
class EtudiantViewSet(viewsets.ModelViewSet):
    queryset = Etudiant.objects.all().order_by('nom', 'prenom')

    def get_serializer_class(self):
        if self.action == 'list':
            return EtudiantListSerializer
        elif self.action == 'retrieve':
            return EtudiantDetailSerializer
        return EtudiantSerializer

    def create(self, request, *args, **kwargs):
        """
        Surcharge de la méthode create pour gérer les erreurs de photo
        """
        try:
            # Vérifier si la photo est une chaîne base64
            if 'photo' in request.data and isinstance(request.data['photo'], str) and len(request.data['photo']) > 100:
                # Créer une copie mutable des données
                mutable_data = request.data.copy()
                # Supprimer la photo des données
                mutable_data.pop('photo')
                # Remplacer les données de la requête
                request._full_data = mutable_data

            return super().create(request, *args, **kwargs)
        except Exception as e:
            # Journaliser l'erreur
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la création de l'étudiant: {str(e)}")
            # Retourner une réponse d'erreur plus détaillée
            return Response(
                {"detail": f"Erreur lors de la création de l'étudiant: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        """
        Surcharge de la méthode update pour gérer les erreurs de photo
        """
        try:
            # Vérifier si la photo est une chaîne base64
            if 'photo' in request.data and isinstance(request.data['photo'], str) and len(request.data['photo']) > 100:
                # Créer une copie mutable des données
                mutable_data = request.data.copy()
                # Supprimer la photo des données
                mutable_data.pop('photo')
                # Remplacer les données de la requête
                request._full_data = mutable_data

            return super().update(request, *args, **kwargs)
        except Exception as e:
            # Journaliser l'erreur
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la mise à jour de l'étudiant: {str(e)}")
            # Retourner une réponse d'erreur plus détaillée
            return Response(
                {"detail": f"Erreur lors de la mise à jour de l'étudiant: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def parents(self, request, pk=None):
        etudiant = self.get_object()
        parents = etudiant.parents.all()
        serializer = ParentSerializer(parents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def presences(self, request, pk=None):
        etudiant = self.get_object()
        presences = etudiant.presences.all().order_by('-date')
        serializer = PresenceSerializer(presences, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def register_face(self, request, pk=None):
        etudiant = self.get_object()
        base64_image = request.data.get('image')

        if not base64_image:
            return Response({'error': 'Image non fournie'}, status=status.HTTP_400_BAD_REQUEST)

        face_service = FaceRecognitionService()
        result = face_service.register_face(etudiant.id, base64_image)
        
        if result['success']:
            # Mettre à jour la photo de l'étudiant
            image_data = base64.b64decode(base64_image)
            image_name = f"{etudiant.id}_face.jpg"  # Generate a unique image name
            image_path = os.path.join(django_settings.MEDIA_ROOT, 'photos_etudiants', image_name)

        # Save the image file
            with open(image_path, "wb") as img_file:
                img_file.write(image_data)

        # Save the image to the Etudiant model
            etudiant.photo.save(image_name, ContentFile(image_data), save=True)

            # Mettre à jour ou créer les données biométriques
            DonneesBiometriques.objects.update_or_create(
                etudiant=etudiant,
                defaults={'descripteur_facial': b'OpenCV_Model'}
            )

        return Response(result)

# Vues pour les parents
class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all().order_by('nom', 'prenom')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ParentDetailSerializer
        return ParentSerializer

    @action(detail=True, methods=['post'])
    def send_sms(self, request, pk=None):
        parent = self.get_object()
        message = request.data.get('message')

        if not message:
            return Response({'error': 'Message non fourni'}, status=status.HTTP_400_BAD_REQUEST)

        sms_service = SMSService()
        result = sms_service.send_sms(parent.telephone, message)

        if result['success']:
            # Enregistrer le message dans la base de données
            Message.objects.create(
                parent=parent,
                type='sms',
                contenu=message,
                statut='envoye'
            )
        else:
            # Enregistrer l'échec dans la base de données
            Message.objects.create(
                parent=parent,
                type='sms',
                contenu=message,
                statut='echec',
                details_erreur=result.get('message', '')
            )

        return Response(result)

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        parent = self.get_object()
        subject = request.data.get('subject', '')
        message = request.data.get('message')

        if not message:
            return Response({'error': 'Message non fourni'}, status=status.HTTP_400_BAD_REQUEST)

        if not parent.email:
            return Response({'error': 'Ce parent n\'a pas d\'adresse email'}, status=status.HTTP_400_BAD_REQUEST)

        if not parent.notifications_email:
            return Response({'error': 'Les notifications email sont désactivées pour ce parent'}, status=status.HTTP_400_BAD_REQUEST)

        email_service = EmailService()
        result = email_service.send_email(parent.email, subject, message)

        if result['success']:
            # Enregistrer le message dans la base de données
            Message.objects.create(
                parent=parent,
                type='email',
                contenu=message,
                sujet=subject,
                statut='envoye'
            )
        else:
            # Enregistrer l'échec dans la base de données
            Message.objects.create(
                parent=parent,
                type='email',
                contenu=message,
                sujet=subject,
                statut='echec',
                details_erreur=result.get('message', '')
            )

        return Response(result)

    @action(detail=False, methods=['post'])
    def send_bulk_sms(self, request):
        serializer = BulkMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        classe_id = data.get('classe_id')
        tous_parents = data.get('tous_parents', False)

        # Récupérer les parents selon les critères
        if classe_id:
            # Parents d'une classe spécifique
            classe = get_object_or_404(Classe, id=classe_id)
            parents = Parent.objects.filter(etudiant__classe=classe, notifications_sms=True).distinct()
            classe_obj = classe
        elif tous_parents:
            # Tous les parents
            parents = Parent.objects.filter(notifications_sms=True).distinct()
            classe_obj = None
        else:
            return Response({
                'error': 'Vous devez spécifier une classe ou sélectionner tous les parents'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not parents.exists():
            return Response({
                'error': 'Aucun parent trouvé avec les critères spécifiés'
            }, status=status.HTTP_404_NOT_FOUND)

        # Envoyer les SMS
        sms_service = SMSService()
        result = sms_service.send_bulk_sms(parents, data['contenu'])

        # Enregistrer le message pour chaque parent
        for parent_result in result['details']:
            parent_name = parent_result['parent'].split(' ')
            if len(parent_name) >= 2:
                prenom, nom = parent_name[0], parent_name[1]
                parent = parents.filter(prenom=prenom, nom=nom).first()
                if parent:
                    Message.objects.create(
                        parent=parent,
                        type=data['type'],
                        contenu=data['contenu'],
                        sujet=data['sujet'],
                        statut='envoye' if parent_result['success'] else 'echec',
                        details_erreur=None if parent_result['success'] else parent_result['message'],
                        est_message_groupe=True,
                        classe=classe_obj
                    )

        return Response({
            'success': True,
            'message': f"Message envoyé à {result['success']} parents sur {result['total']}",
            'details': result
        })

    @action(detail=False, methods=['post'])
    def send_bulk_email(self, request):
        serializer = BulkMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        classe_id = data.get('classe_id')
        tous_parents = data.get('tous_parents', False)

        # Récupérer les parents selon les critères
        if classe_id:
            # Parents d'une classe spécifique
            classe = get_object_or_404(Classe, id=classe_id)
            parents = Parent.objects.filter(etudiant__classe=classe, notifications_email=True).exclude(email='').exclude(email__isnull=True).distinct()
            classe_obj = classe
        elif tous_parents:
            # Tous les parents
            parents = Parent.objects.filter(notifications_email=True).exclude(email='').exclude(email__isnull=True).distinct()
            classe_obj = None
        else:
            return Response({
                'error': 'Vous devez spécifier une classe ou sélectionner tous les parents'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not parents.exists():
            return Response({
                'error': 'Aucun parent trouvé avec les critères spécifiés'
            }, status=status.HTTP_404_NOT_FOUND)

        # Envoyer les emails
        email_service = EmailService()
        result = email_service.send_bulk_email(parents, data['sujet'], data['contenu'])

        # Enregistrer le message pour chaque parent
        for parent_result in result['details']:
            parent_name = parent_result['parent'].split(' ')
            if len(parent_name) >= 2:
                prenom, nom = parent_name[0], parent_name[1]
                parent = parents.filter(prenom=prenom, nom=nom).first()
                if parent:
                    Message.objects.create(
                        parent=parent,
                        type='email',
                        contenu=data['contenu'],
                        sujet=data['sujet'],
                        statut='envoye' if parent_result['success'] else 'echec',
                        details_erreur=None if parent_result['success'] else parent_result['message'],
                        est_message_groupe=True,
                        classe=classe_obj
                    )

        return Response({
            'success': True,
            'message': f"Email envoyé à {result['success']} parents sur {result['total']}",
            'details': result
        })

# Vues pour les présences
class PresenceViewSet(viewsets.ModelViewSet):
    queryset = Presence.objects.all().order_by('-date')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PresenceDetailSerializer
        return PresenceSerializer

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        presences = Presence.objects.filter(date=today)
        serializer = PresenceSerializer(presences, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        # Statistiques de présence pour la semaine en cours
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        # Présences par jour de la semaine
        presences_par_jour = []
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            count = Presence.objects.filter(date=day).count()
            presences_par_jour.append({
                'jour': day.strftime('%A'),
                'date': day.strftime('%Y-%m-%d'),
                'count': count
            })

        # Taux de présence par classe
        classes = Classe.objects.all()
        taux_par_classe = []
        for classe in classes:
            total_etudiants = classe.etudiants.count()
            if total_etudiants > 0:
                presents_today = Presence.objects.filter(
                    etudiant__classe=classe,
                    date=today,
                    statut='present'
                ).count()
                taux = (presents_today / total_etudiants) * 100
            else:
                taux = 0

            taux_par_classe.append({
                'classe': classe.nom,
                'taux': taux,
                'presents': presents_today,
                'total': total_etudiants
            })

        return Response({
            'presences_par_jour': presences_par_jour,
            'taux_par_classe': taux_par_classe
        })

# Vues pour les messages
from .views_messages import MessageViewSet

# Vues pour les statistiques et exportations
from presences.statistics import PresenceStatisticsService
from presences.exports import ExportService

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def presence_count_by_date(request):
    """
    Récupère le nombre de présences par jour dans une période donnée
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    classe_id = request.query_params.get('classe_id')

    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour start_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour end_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    result = PresenceStatisticsService.get_presence_count_by_date(
        start_date=start_date,
        end_date=end_date,
        classe_id=classe_id
    )

    return Response(list(result))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def presence_count_by_class(request):
    """
    Récupère le nombre de présences par classe dans une période donnée
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour start_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour end_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    result = PresenceStatisticsService.get_presence_count_by_class(
        start_date=start_date,
        end_date=end_date
    )

    return Response(list(result))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_rate_by_student(request):
    """
    Calcule le taux de présence par étudiant dans une période donnée
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    classe_id = request.query_params.get('classe_id')

    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour start_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour end_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    result = PresenceStatisticsService.get_attendance_rate_by_student(
        start_date=start_date,
        end_date=end_date,
        classe_id=classe_id
    )

    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def absence_alerts(request):
    """
    Identifie les étudiants dont le taux de présence est inférieur au seuil donné
    """
    threshold = request.query_params.get('threshold', 70)
    days = request.query_params.get('days', 30)

    try:
        threshold = float(threshold)
        days = int(days)
    except ValueError:
        return Response({'error': 'Valeurs invalides pour threshold ou days'},
                       status=status.HTTP_400_BAD_REQUEST)

    result = PresenceStatisticsService.get_absence_alerts(
        threshold=threshold,
        days=days
    )

    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_presence_summary(request):
    """
    Récupère un résumé des présences du jour
    """
    result = PresenceStatisticsService.get_today_presence_summary()
    return Response(result)

# Vues pour l'exportation des données
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_presence_count_by_date(request):
    """
    Exporte le nombre de présences par jour dans une période donnée
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    classe_id = request.query_params.get('classe_id')
    format = request.query_params.get('format', 'xlsx')

    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour start_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour end_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    try:
        return ExportService.export_presence_count_by_date(
            start_date=start_date,
            end_date=end_date,
            classe_id=classe_id,
            format=format
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_presence_count_by_class(request):
    """
    Exporte le nombre de présences par classe dans une période donnée
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    format = request.query_params.get('format', 'xlsx')

    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour start_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour end_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    try:
        return ExportService.export_presence_count_by_class(
            start_date=start_date,
            end_date=end_date,
            format=format
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_attendance_rate_by_student(request):
    """
    Exporte le taux de présence par étudiant dans une période donnée
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    classe_id = request.query_params.get('classe_id')
    format = request.query_params.get('format', 'xlsx')

    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour start_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format de date invalide pour end_date (YYYY-MM-DD)'},
                           status=status.HTTP_400_BAD_REQUEST)

    try:
        return ExportService.export_attendance_rate_by_student(
            start_date=start_date,
            end_date=end_date,
            classe_id=classe_id,
            format=format
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_absence_alerts(request):
    """
    Exporte les alertes d'absence
    """
    threshold = request.query_params.get('threshold', 70)
    days = request.query_params.get('days', 30)
    format = request.query_params.get('format', 'xlsx')

    try:
        threshold = float(threshold)
        days = int(days)
    except ValueError:
        return Response({'error': 'Valeurs invalides pour threshold ou days'},
                       status=status.HTTP_400_BAD_REQUEST)

    try:
        return ExportService.export_absence_alerts(
            threshold=threshold,
            days=days,
            format=format
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Vues pour les paramètres
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def settings(request):
    if request.method == 'GET':
        return Response({
            'face_recognition_confidence_threshold': getattr(django_settings, 'FACE_RECOGNITION_CONFIDENCE_THRESHOLD', 85),
        })
    elif request.method == 'POST':
        # Mettre à jour les paramètres
        confidence_threshold = request.data.get('face_recognition_confidence_threshold')
        if confidence_threshold is not None:
            try:
                # Convertir en entier et vérifier la plage
                confidence_threshold = int(confidence_threshold)
                if confidence_threshold < 50 or confidence_threshold > 99:
                    return Response({'error': 'Le seuil de confiance doit être entre 50 et 99'},
                                   status=status.HTTP_400_BAD_REQUEST)

                # Mettre à jour le paramètre dans les settings
                
                setattr(django_settings, 'FACE_RECOGNITION_CONFIDENCE_THRESHOLD', confidence_threshold)

                # Enregistrer dans le fichier .env si disponible
                try:
                    import os
                    from dotenv import load_dotenv, find_dotenv, set_key
                    env_file = find_dotenv()
                    if env_file:
                        set_key(env_file, 'FACE_RECOGNITION_CONFIDENCE_THRESHOLD', str(confidence_threshold))
                except Exception as e:
                    logger.error(f"Erreur lors de la mise à jour du fichier .env: {str(e)}")

                return Response({'success': True, 'message': 'Paramètres mis à jour avec succès'})
            except ValueError:
                return Response({'error': 'Valeur invalide pour le seuil de confiance'},
                               status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Aucun paramètre fourni'}, status=status.HTTP_400_BAD_REQUEST)

# Vues pour la reconnaissance faciale
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_face_model(request):
    """Réinitialise le modèle de reconnaissance faciale"""
    face_service = FaceRecognitionService()
    result = face_service.reset_model()
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recognize_face(request):
    base64_image = request.data.get('image')
    mode = request.data.get('mode', 'arrivee')  # Mode par défaut: arrivée

    if not base64_image:
        return Response({'error': 'Image non fournie'}, status=status.HTTP_400_BAD_REQUEST)

    face_service = FaceRecognitionService()
    result = face_service.recognize_face(base64_image)

    if result['recognized']:
        # Récupérer l'étudiant
        try:
            etudiant = Etudiant.objects.get(id=result['student_id'])
            current_time = timezone.now().time()
            today = timezone.now().date()

            # Vérifier si l'étudiant a déjà été marqué présent aujourd'hui
            presence, created = Presence.objects.get_or_create(
                etudiant=etudiant,
                date=today,
                defaults={
                    'heure_arrivee': current_time,
                    'statut': 'present'
                }
            )

            if mode == 'arrivee':
                if not created and presence.heure_arrivee:
                    # L'étudiant a déjà pointé son arrivée aujourd'hui
                    result['already_present'] = True
                    result['presence_time'] = presence.heure_arrivee.strftime('%H:%M')
                    result['mode'] = 'arrivee'
                    result['message'] = f"Vous avez déjà pointé votre arrivée à {presence.heure_arrivee.strftime('%H:%M')}. Un seul pointage d'arrivée est autorisé par jour."
                else:
                    # Enregistrer l'heure d'arrivée
                    presence.heure_arrivee = current_time
                    presence.save()
                    result['already_present'] = False
                    result['presence_time'] = current_time.strftime('%H:%M')
                    result['mode'] = 'arrivee'
                    result['message'] = f"Arrivée enregistrée à {current_time.strftime('%H:%M')}"
            elif mode == 'depart':
                if not created and presence.heure_depart:
                    # L'étudiant a déjà pointé son départ aujourd'hui
                    result['already_present'] = True
                    result['presence_time'] = presence.heure_depart.strftime('%H:%M')
                    result['mode'] = 'depart'
                    result['message'] = f"Vous avez déjà pointé votre départ à {presence.heure_depart.strftime('%H:%M')}. Un seul pointage de départ est autorisé par jour."
                else:
                    # Vérifier si l'étudiant a pointé son arrivée avant de pointer son départ
                    if not presence.heure_arrivee:
                        # Si l'étudiant n'a pas pointé son arrivée, on l'enregistre aussi
                        presence.heure_arrivee = current_time
                        result['message'] = f"Arrivée automatiquement enregistrée à {current_time.strftime('%H:%M')} lors du pointage de départ."

                    # Enregistrer l'heure de départ
                    presence.heure_depart = current_time
                    presence.save()
                    result['already_present'] = False
                    result['presence_time'] = current_time.strftime('%H:%M')
                    result['mode'] = 'depart'
                    if not result.get('message'):
                        result['message'] = f"Départ enregistré à {current_time.strftime('%H:%M')}"

            # Ajouter les informations de l'étudiant
            result['student'] = EtudiantSerializer(etudiant).data

        except Etudiant.DoesNotExist:
            result['recognized'] = False
            result['message'] = "Étudiant non trouvé dans la base de données"

    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_attendance(request):
    student_id = request.data.get('student_id')
    status = request.data.get('status', 'present')

    if not student_id:
        return Response({'error': 'ID étudiant non fourni'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        etudiant = Etudiant.objects.get(id=student_id)

        # Enregistrer la présence
        today = timezone.now().date()
        presence, created = Presence.objects.get_or_create(
            etudiant=etudiant,
            date=today,
            defaults={
                'heure_arrivee': timezone.now().time(),
                'statut': status
            }
        )

        if not created:
            # Mettre à jour le statut si l'étudiant a déjà été marqué
            presence.statut = status
            presence.save()

            return Response({
                'success': True,
                'message': f"Présence mise à jour pour {etudiant}",
                'already_present': True,
                'presence': PresenceSerializer(presence).data
            })

        # Si l'étudiant est absent ou en retard, envoyer une notification aux parents
        if status in ['absent', 'retard']:
            for parent in etudiant.parents.filter(notifications_sms=True):
                sms_service = SMSService()
                if status == 'absent':
                    sms_service.send_absence_notification(parent, etudiant, today.strftime('%d/%m/%Y'))
                else:
                    sms_service.send_late_notification(parent, etudiant, today.strftime('%d/%m/%Y'), presence.heure_arrivee.strftime('%H:%M'))

                # Marquer la notification comme envoyée
                presence.notification_envoyee = True
                presence.save()

        return Response({
            'success': True,
            'message': f"Présence enregistrée pour {etudiant}",
            'already_present': False,
            'presence': PresenceSerializer(presence).data
        })

    except Etudiant.DoesNotExist:
        return Response({'error': 'Étudiant non trouvé'}, status=status.HTTP_404_NOT_FOUND)