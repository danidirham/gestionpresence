from django.contrib import admin
from .models import Classe, Etudiant, Parent

@admin.register(Classe)
class ClasseAdmin(admin.ModelAdmin):
    list_display = ('nom', 'niveau', 'annee_scolaire')
    search_fields = ('nom', 'niveau')
    list_filter = ('niveau', 'annee_scolaire')

class ParentInline(admin.TabularInline):
    model = Parent
    extra = 1

@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin):
    list_display = ('nom', 'prenom', 'classe', 'sexe', 'date_naissance', 'statut')
    list_filter = ('classe', 'sexe', 'statut')
    search_fields = ('nom', 'prenom')
    inlines = [ParentInline]
    fieldsets = (
        ('Informations personnelles', {
            'fields': ('nom', 'prenom', 'date_naissance', 'sexe', 'adresse')
        }),
        ('Informations scolaires', {
            'fields': ('classe', 'statut')
        }),
        ('Biométrie', {
            'fields': ('photo', 'donnees_biometriques')
        }),
    )

@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ('nom', 'prenom', 'relation', 'etudiant', 'telephone', 'notifications_sms')
    list_filter = ('relation', 'notifications_sms', 'notifications_email')
    search_fields = ('nom', 'prenom', 'telephone', 'email')
    fieldsets = (
        ('Informations personnelles', {
            'fields': ('nom', 'prenom', 'telephone', 'email', 'adresse')
        }),
        ('Relation avec l\'étudiant', {
            'fields': ('etudiant', 'relation')
        }),
        ('Notifications', {
            'fields': ('notifications_sms', 'notifications_email')
        }),
    )
