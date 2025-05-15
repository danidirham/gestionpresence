from django.contrib import admin
from .models import Presence, Message

@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'date', 'statut', 'heure_arrivee', 'notification_envoyee')
    list_filter = ('date', 'statut', 'notification_envoyee')
    search_fields = ('etudiant__nom', 'etudiant__prenom', 'commentaire')
    date_hierarchy = 'date'

    fieldsets = (
        ('Informations de base', {
            'fields': ('etudiant', 'date', 'statut')
        }),
        ('Horaires', {
            'fields': ('heure_arrivee', 'heure_depart')
        }),
        ('Notifications', {
            'fields': ('notification_envoyee', 'commentaire')
        }),
    )



@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('get_destinataire', 'type', 'sujet', 'date_envoi', 'statut', 'est_message_groupe')
    list_filter = ('type', 'statut', 'date_envoi', 'est_message_groupe', 'classe')
    search_fields = ('parent__nom', 'parent__prenom', 'contenu', 'sujet')
    date_hierarchy = 'date_envoi'

    def get_destinataire(self, obj):
        if obj.est_message_groupe:
            return f"Groupe: {obj.classe.nom if obj.classe else 'Tous les parents'}"
        return str(obj.parent)
    get_destinataire.short_description = 'Destinataire'

    def get_fieldsets(self, request, obj=None):
        if obj and obj.est_message_groupe:
            return (
                ('Destinataire', {
                    'fields': ('est_message_groupe', 'classe')
                }),
                ('Message', {
                    'fields': ('type', 'sujet', 'contenu', 'contenu_html', 'template')
                }),
                ('Statut', {
                    'fields': ('statut', 'date_programmee', 'date_creation', 'date_envoi', 'details_erreur')
                }),
                ('Suivi', {
                    'fields': ('est_lu', 'date_lecture', 'tracking_id')
                }),
            )
        else:
            return (
                ('Destinataire', {
                    'fields': ('est_message_groupe', 'parent', 'classe')
                }),
                ('Message', {
                    'fields': ('type', 'sujet', 'contenu', 'contenu_html', 'template')
                }),
                ('Statut', {
                    'fields': ('statut', 'date_programmee', 'date_creation', 'date_envoi', 'details_erreur')
                }),
                ('Suivi', {
                    'fields': ('est_lu', 'date_lecture', 'tracking_id')
                }),
            )


