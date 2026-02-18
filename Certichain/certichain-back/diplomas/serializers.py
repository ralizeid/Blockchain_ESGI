from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Diploma

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Création sécurisée avec hachage du mot de passe
        user = User.objects.create_user(**validated_data)
        return user

class DiplomaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diploma
        fields = '__all__'
        read_only_fields = ['owner'] # L'owner est défini automatiquement par le serveur