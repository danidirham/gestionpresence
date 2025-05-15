from django.contrib import admin
from .models import Ecole

@admin.register(Ecole)
class EcoleAdmin(admin.ModelAdmin):
    list_display = ('nom', 'telephone', 'email', 'annee_scolaire_courante')
    search_fields = ('nom', 'email', 'telephone')
    fieldsets = (
        ('Informations générales', {
            'fields': ('nom', 'adresse', 'telephone', 'email', 'logo')
        }),
        ('Configuration', {
            'fields': ('annee_scolaire_courante', 'configuration')
        }),
    )
