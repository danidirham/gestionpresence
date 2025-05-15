from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta

from etudiants.models import Classe
from presences.models import Message
from presences.services.message_scheduler import MessageSchedulerService
from .serializers import MessageSerializer, MessageDetailSerializer

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all().order_by('-date_envoi')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MessageDetailSerializer
        return MessageSerializer

    @action(detail=False, methods=['get'])
    def by_parent(self, request):
        parent_id = request.query_params.get('parent_id')
        if not parent_id:
            return Response({'error': 'ID du parent non fourni'}, status=status.HTTP_400_BAD_REQUEST)

        messages = Message.objects.filter(parent_id=parent_id).order_by('-date_envoi')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_classe(self, request):
        classe_id = request.query_params.get('classe_id')
        if not classe_id:
            return Response({'error': 'ID de la classe non fourni'}, status=status.HTTP_400_BAD_REQUEST)

        messages = Message.objects.filter(classe_id=classe_id, est_message_groupe=True).order_by('-date_envoi')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def bulk_messages(self, request):
        messages = Message.objects.filter(est_message_groupe=True).order_by('-date_envoi')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def scheduled(self, request):
        """
        Récupère tous les messages programmés
        """
        messages = Message.objects.filter(statut='programme').order_by('date_programmee')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['post'])
    def process_scheduled(self, request):
        """
        Traite tous les messages programmés dont la date de programmation est passée
        """
        result = MessageSchedulerService.process_scheduled_messages()
        return Response(result)
        
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Marque un message comme lu
        """
        message = self.get_object()
        if message.type != 'email':
            return Response({'error': 'Seuls les emails peuvent être marqués comme lus'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        message.est_lu = True
        message.date_lecture = timezone.now()
        message.save()
        
        return Response({
            'success': True,
            'message': 'Message marqué comme lu'
        })
        
    @action(detail=False, methods=['get'])
    def message_stats(self, request):
        """
        Récupère les statistiques des messages
        """
        # Statistiques générales
        total_messages = Message.objects.count()
        total_sms = Message.objects.filter(type='sms').count()
        total_email = Message.objects.filter(type='email').count()
        
        # Statistiques par statut
        status_counts = {
            'envoye': Message.objects.filter(statut='envoye').count(),
            'echec': Message.objects.filter(statut='echec').count(),
            'programme': Message.objects.filter(statut='programme').count(),
            'en_attente': Message.objects.filter(statut='en_attente').count(),
            'brouillon': Message.objects.filter(statut='brouillon').count()
        }
        
        # Taux de lecture des emails
        total_emails_sent = Message.objects.filter(type='email', statut='envoye').count()
        emails_read = Message.objects.filter(type='email', statut='envoye', est_lu=True).count()
        read_rate = (emails_read / total_emails_sent * 100) if total_emails_sent > 0 else 0
        
        # Messages par classe
        messages_by_class = []
        for classe in Classe.objects.all():
            count = Message.objects.filter(classe=classe, est_message_groupe=True).count()
            messages_by_class.append({
                'classe': classe.nom,
                'count': count
            })
        
        # Messages par jour (30 derniers jours)
        today = timezone.now().date()
        start_date = today - timedelta(days=30)
        messages_by_day = []
        
        for i in range(31):
            day = start_date + timedelta(days=i)
            count = Message.objects.filter(date_envoi__date=day).count()
            messages_by_day.append({
                'date': day.strftime('%Y-%m-%d'),
                'count': count
            })
        
        return Response({
            'total_messages': total_messages,
            'total_sms': total_sms,
            'total_email': total_email,
            'status_counts': status_counts,
            'read_rate': read_rate,
            'messages_by_class': messages_by_class,
            'messages_by_day': messages_by_day
        })
