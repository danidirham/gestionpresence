from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class Utilisateur(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('enseignant', 'Enseignant'),
        ('surveillant', 'Surveillant'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='surveillant')
    derniere_connexion = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def save(self, *args, **kwargs):
        if not self.pk:
            # Si c'est un nouvel utilisateur, définir la date de dernière connexion
            self.derniere_connexion = timezone.now()
        super().save(*args, **kwargs)
