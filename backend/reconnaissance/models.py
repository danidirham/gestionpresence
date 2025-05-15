from django.db import models
from etudiants.models import Etudiant

class DonneesBiometriques(models.Model):
    etudiant = models.OneToOneField(Etudiant, on_delete=models.CASCADE, related_name='biometrie')
    descripteur_facial = models.BinaryField(blank=True, null=True)
    date_capture = models.DateTimeField(auto_now_add=True)
    derniere_mise_a_jour = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Données biométriques'
        verbose_name_plural = 'Données biométriques'
    
    def __str__(self):
        return f"Données biométriques de {self.etudiant}"
