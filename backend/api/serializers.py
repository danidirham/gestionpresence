from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from ecole.models import Ecole
from etudiants.models import Classe, Etudiant, Parent
from presences.models import Presence, Message
from reconnaissance.models import DonneesBiometriques

User = get_user_model()

# Sérialiseurs pour l'authentification
class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = ('id',)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Ajouter des informations supplémentaires au token
        user = self.user
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
        }

        # Mettre à jour la dernière connexion
        user.derniere_connexion = timezone.now()
        user.save()

        return data

# Sérialiseurs pour l'école
class EcoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ecole
        fields = '__all__'

# Sérialiseurs pour les classes
class ClasseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classe
        fields = '__all__'

class ClasseDetailSerializer(serializers.ModelSerializer):
    etudiants_count = serializers.SerializerMethodField()

    class Meta:
        model = Classe
        fields = '__all__'

    def get_etudiants_count(self, obj):
        return obj.etudiants.count()

# Sérialiseurs pour les étudiants
class EtudiantSerializer(serializers.ModelSerializer):
    # Ensure date_naissance is always in ISO format (YYYY-MM-DD)
    date_naissance = serializers.DateField(format='%Y-%m-%d')
    # Make photo field optional to avoid validation errors
    photo = serializers.ImageField(required=False, allow_null=True)
    classe_nom = serializers.SerializerMethodField()

    class Meta:
        model = Etudiant
        fields = '__all__'

    def validate(self, data):
        """
        Custom validation to handle photo field
        """
        # If photo is a string and looks like base64, remove it from data
        # It will be handled separately by the register_face endpoint
        if 'photo' in data and isinstance(data['photo'], str) and len(data['photo']) > 100:
            data.pop('photo')
        return data
    
    def get_classe_nom(self, obj):
        return obj.classe.nom

class EtudiantListSerializer(serializers.ModelSerializer):
    classe_nom = serializers.ReadOnlyField(source='classe.nom')
    date_naissance = serializers.DateField(format='%Y-%m-%d')

    class Meta:
        model = Etudiant
        fields = ('id', 'nom', 'prenom', 'classe', 'classe_nom', 'sexe', 'statut', 'photo', 'date_naissance')

class EtudiantDetailSerializer(serializers.ModelSerializer):
    classe = ClasseSerializer(read_only=True)
    date_naissance = serializers.DateField(format='%Y-%m-%d')

    class Meta:
        model = Etudiant
        fields = '__all__'

# Sérialiseurs pour les parents
class ParentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parent
        fields = '__all__'

class ParentDetailSerializer(serializers.ModelSerializer):
    etudiant = EtudiantListSerializer(read_only=True)

    class Meta:
        model = Parent
        fields = '__all__'

# Sérialiseurs pour les présences
class PresenceSerializer(serializers.ModelSerializer):
    # Ajouter les champs pour les noms d'étudiant et de classe
    etudiant_nom = serializers.ReadOnlyField(source='etudiant.nom')
    etudiant_prenom = serializers.ReadOnlyField(source='etudiant.prenom')
    etudiant_photo = serializers.ImageField(source='etudiant.photo', read_only=True)
    classe_nom = serializers.ReadOnlyField(source='etudiant.classe.nom')

    class Meta:
        model = Presence
        fields = '__all__'

class PresenceDetailSerializer(serializers.ModelSerializer):
    etudiant = EtudiantListSerializer(read_only=True)

    class Meta:
        model = Presence
        fields = '__all__'

# Sérialiseurs pour les messages
class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'

class MessageDetailSerializer(serializers.ModelSerializer):
    parent = ParentSerializer(read_only=True)
    classe = ClasseSerializer(read_only=True)

    class Meta:
        model = Message
        fields = '__all__'

class BulkMessageSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=Message.TYPE_CHOICES, default='sms')
    sujet = serializers.CharField(max_length=255, required=True)
    contenu = serializers.CharField(required=True)
    classe_id = serializers.IntegerField(required=False, allow_null=True)
    tous_parents = serializers.BooleanField(default=False)

# Sérialiseurs pour les données biométriques
class DonneesBiometriquesSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonneesBiometriques
        fields = '__all__'
