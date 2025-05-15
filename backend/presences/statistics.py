from django.db.models import Count, F, Q, Sum, Case, When, IntegerField, Value
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta, datetime
from .models import Presence
from etudiants.models import Etudiant, Classe

class PresenceStatisticsService:
    """Service pour générer des statistiques de présence"""

    @staticmethod
    def get_presence_count_by_date(start_date=None, end_date=None, classe_id=None):
        """
        Récupère le nombre de présences et d'absences par jour dans une période donnée
        """
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()

        # Nombre total d'étudiants (global ou par classe)
        if classe_id:
            total_students = Etudiant.objects.filter(classe_id=classe_id).count()
        else:
            total_students = Etudiant.objects.count()

        # Base de la requête pour les présences
        queryset = Presence.objects.filter(date__gte=start_date, date__lte=end_date)
        if classe_id:
            queryset = queryset.filter(etudiant__classe_id=classe_id)

        # Obtenir les présences par jour
        presences_by_day = (
            queryset
            .annotate(day=TruncDate('date'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        # Ajouter le nombre total d'étudiants et calculer les absences
        result = []
        for presence in presences_by_day:
            # Calculer le nombre d'absents pour ce jour
            absent_count = total_students - presence['count']

            # Ajouter les informations au résultat
            result.append({
                'day': presence['day'],
                'count': presence['count'],
                'total_students': total_students,
                'absent_count': absent_count
            })

        return result

    @staticmethod
    def get_presence_count_by_class(start_date=None, end_date=None):
        """
        Récupère le nombre de présences par classe dans une période donnée
        """
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()

        return (
            Presence.objects.filter(date__gte=start_date, date__lte=end_date)
            .values('etudiant__classe__nom')
            .annotate(classe_nom=F('etudiant__classe__nom'))
            .annotate(count=Count('id'))
            .order_by('-count')
        )

    @staticmethod
    def get_attendance_rate_by_student(start_date=None, end_date=None, classe_id=None):
        """
        Calcule le taux de présence par étudiant dans une période donnée
        """
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()

        # Nombre de jours ouvrables dans la période
        working_days = 0
        current_date = start_date
        while current_date <= end_date:
            # Exclure les weekends (samedi et dimanche)
            if current_date.weekday() < 5:
                working_days += 1
            current_date += timedelta(days=1)

        # Si pas de jours ouvrables, retourner une liste vide
        if working_days == 0:
            return []

        # Filtrer les étudiants par classe si nécessaire
        students = Etudiant.objects.all()
        if classe_id:
            students = students.filter(classe_id=classe_id)

        # Récupérer le nombre de présences par étudiant
        presence_counts = (
            Presence.objects.filter(date__gte=start_date, date__lte=end_date)
            .values('etudiant')
            .annotate(count=Count('id'))
        )

        # Convertir en dictionnaire pour un accès facile
        presence_dict = {p['etudiant']: p['count'] for p in presence_counts}

        # Calculer le taux de présence pour chaque étudiant
        result = []
        for student in students:
            presence_count = presence_dict.get(student.id, 0)
            attendance_rate = (presence_count / working_days) * 100
            result.append({
                'etudiant_id': student.id,
                'etudiant_nom': student.nom,
                'etudiant_prenom': student.prenom,
                'classe_nom': student.classe.nom if student.classe else None,
                'presence_count': presence_count,
                'working_days': working_days,
                'attendance_rate': round(attendance_rate, 2)
            })

        # Trier par taux de présence décroissant
        return sorted(result, key=lambda x: x['attendance_rate'], reverse=True)

    @staticmethod
    def get_absence_alerts(threshold=70, days=30):
        """
        Identifie les étudiants dont le taux de présence est inférieur au seuil donné
        """
        attendance_rates = PresenceStatisticsService.get_attendance_rate_by_student(
            start_date=timezone.now().date() - timedelta(days=days)
        )

        return [
            student for student in attendance_rates
            if student['attendance_rate'] < threshold
        ]

    @staticmethod
    def get_today_presence_summary():
        """
        Récupère un résumé des présences du jour
        """
        today = timezone.now().date()

        # Nombre total d'étudiants
        total_students = Etudiant.objects.count()

        # Nombre d'étudiants présents aujourd'hui
        present_students = Presence.objects.filter(date=today).count()

        # Taux de présence
        attendance_rate = (present_students / total_students) * 100 if total_students > 0 else 0

        # Présences par classe
        class_presence = (
            Presence.objects.filter(date=today)
            .values('etudiant__classe__nom')
            .annotate(classe_nom=F('etudiant__classe__nom'))
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return {
            'date': today,
            'total_students': total_students,
            'present_students': present_students,
            'absent_students': total_students - present_students,
            'attendance_rate': round(attendance_rate, 2),
            'class_presence': list(class_presence)
        }
