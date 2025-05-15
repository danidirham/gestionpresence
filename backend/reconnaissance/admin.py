from django.contrib import admin
from .models import DonneesBiometriques

@admin.register(DonneesBiometriques)
class DonneesBiometriquesAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'date_capture', 'derniere_mise_a_jour')
    search_fields = ('etudiant__nom', 'etudiant__prenom')
    readonly_fields = ('date_capture', 'derniere_mise_a_jour')
