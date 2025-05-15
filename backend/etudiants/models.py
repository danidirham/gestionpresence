from django.db import models

class Classe(models.Model):
    nom = models.CharField(max_length=255, unique=True)
    niveau = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    annee_scolaire = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom

class Etudiant(models.Model):
    SEXE_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]
    
    STATUT_CHOICES = [
        ('actif', 'Actif'),
        ('inactif', 'Inactif'),
    ]
    
    nom = models.CharField(max_length=255)
    prenom = models.CharField(max_length=255)
    date_naissance = models.DateField(blank=True, null=True)
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES, blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='photos_etudiants/', blank=True, null=True)
    donnees_biometriques = models.TextField(blank=True, null=True)
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name='etudiants')
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='actif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.prenom} {self.nom}"

class Parent(models.Model):
    RELATION_CHOICES = [
        ('père', 'Père'),
        ('mère', 'Mère'),
        ('tuteur', 'Tuteur'),
        ('autre', 'Autre'),
    ]
    
    nom = models.CharField(max_length=255)
    prenom = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    relation = models.CharField(max_length=10, choices=RELATION_CHOICES, default='autre')
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE, related_name='parents')
    notifications_sms = models.BooleanField(default=True)
    notifications_email = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.relation} de {self.etudiant})"
