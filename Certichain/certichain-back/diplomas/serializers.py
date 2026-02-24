from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Diploma, UserProfile

class UserSerializer(serializers.ModelSerializer):
    rectorate_email = serializers.EmailField(write_only=True, required=True) # Champ ajouté

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'rectorate_email']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # On extrait l'email du rectorat des données
        rectorate_email = validated_data.pop('rectorate_email')
        
        # Création du User
        user = User.objects.create_user(**validated_data)
        
        # Création du Profil lié
        UserProfile.objects.create(user=user, rectorate_email=rectorate_email)
        
        return user

class DiplomaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Diploma
        fields = '__all__'
        read_only_fields = ['owner', 'status', 'school_validated', 'rectorate_validated', 'school_token', 'rectorate_token']