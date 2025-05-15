from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'ecole', views.EcoleViewSet)
router.register(r'classes', views.ClasseViewSet)
router.register(r'etudiants', views.EtudiantViewSet)
router.register(r'parents', views.ParentViewSet)
router.register(r'presences', views.PresenceViewSet)
router.register(r'messages', views.MessageViewSet)

urlpatterns = [
    # Routes d'authentification
    path('auth/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.get_user_profile, name='user_profile'),
    path('auth/register/', views.register_user, name='register_user'),

    # Routes pour les paramètres
    path('settings/', views.settings, name='settings'),

    # Routes pour la reconnaissance faciale
    path('reconnaissance/face/', views.recognize_face, name='recognize_face'),
    path('reconnaissance/reset-model/', views.reset_face_model, name='reset_face_model'),
    path('presences/register/', views.register_attendance, name='register_attendance'),

    # Routes pour les statistiques
    path('statistiques/presences/jour/', views.presence_count_by_date, name='presence_count_by_date'),
    path('statistiques/presences/classe/', views.presence_count_by_class, name='presence_count_by_class'),
    path('statistiques/assiduite/etudiants/', views.attendance_rate_by_student, name='attendance_rate_by_student'),
    path('statistiques/alertes/absences/', views.absence_alerts, name='absence_alerts'),
    path('statistiques/presences/aujourd-hui/', views.today_presence_summary, name='today_presence_summary'),

    # Routes pour les exportations
    path('export/presences/jour/', views.export_presence_count_by_date, name='export_presence_count_by_date'),
    path('export/presences/classe/', views.export_presence_count_by_class, name='export_presence_count_by_class'),
    path('export/assiduite/etudiants/', views.export_attendance_rate_by_student, name='export_attendance_rate_by_student'),
    path('export/alertes/absences/', views.export_absence_alerts, name='export_absence_alerts'),

    # Inclure les routes du routeur
    path('', include(router.urls)),
]
