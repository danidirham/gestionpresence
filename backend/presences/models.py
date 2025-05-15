from django.db import models
from etudiants.models import Etudiant

class Presence(models.Model):
    STATUT_CHOICES = [
        ('present', 'Présent'),
        ('absent', 'Absent'),
        ('retard', 'En retard'),
        ('depart_anticipe', 'Départ anticipé'),
    ]

    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE, related_name='presences')
    date = models.DateField()
    heure_arrivee = models.TimeField(blank=True, null=True)
    heure_depart = models.TimeField(blank=True, null=True)
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='present')
    notification_envoyee = models.BooleanField(default=False)
    commentaire = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['etudiant', 'date']
        verbose_name = 'Présence'
        verbose_name_plural = 'Présences'

    def __str__(self):
        return f"{self.etudiant} - {self.date} - {self.statut}"



class Message(models.Model):
    TYPE_CHOICES = [
        ('sms', 'SMS'),
        ('email', 'Email'),
    ]

    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('programme', 'Programmé'),
        ('en_attente', 'En attente'),
        ('envoye', 'Envoyé'),
        ('echec', 'Échec'),
    ]

    parent = models.ForeignKey('etudiants.Parent', on_delete=models.CASCADE, related_name='messages')
    type = models.CharField(max_length=5, choices=TYPE_CHOICES)
    contenu = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)
    date_programmee = models.DateTimeField(blank=True, null=True, verbose_name="Date programmée")
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='brouillon')
    details_erreur = models.TextField(blank=True, null=True)
    est_message_groupe = models.BooleanField(default=False, verbose_name="Message de groupe")
    classe = models.ForeignKey('etudiants.Classe', on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')
    sujet = models.CharField(max_length=255, blank=True, null=True)
    est_lu = models.BooleanField(default=False, verbose_name="Message lu")
    date_lecture = models.DateTimeField(blank=True, null=True, verbose_name="Date de lecture")

    def __str__(self):
        if self.est_message_groupe:
            destinataire = f"Groupe: {self.classe.nom if self.classe else 'Tous les parents'}"
        else:
            destinataire = str(self.parent)
        return f"{self.type} à {destinataire} - {self.date_envoi.strftime('%d/%m/%Y %H:%M')}"
