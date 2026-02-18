from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from .models import Diploma
from .serializers import DiplomaSerializer, UserSerializer
import uuid

# --- AUTHENTIFICATION ---

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Compte école créé !"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user:
            return Response({
                "message": "Connexion réussie",
                "user_id": user.id,
                "username": user.username
            })
        return Response({"error": "Identifiants invalides"}, status=status.HTTP_401_UNAUTHORIZED)

# --- DIPLÔMES ---

class CreateDiplomaView(APIView):
    def post(self, request):
        # On vérifie si l'utilisateur est "connecté" via l'ID envoyé (Méthode simple pour V2)
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "Non authentifié"}, status=status.HTTP_403_FORBIDDEN)

        serializer = DiplomaSerializer(data=request.data)
        if serializer.is_valid():
            # On simule les données blockchain
            diploma = serializer.save(owner_id=user_id) # On lie le diplôme à l'utilisateur
            diploma.ipfs_cid = f"QmSimu{uuid.uuid4().hex[:8]}"
            diploma.tx_hash = f"0x{uuid.uuid4().hex}"
            diploma.token_id = diploma.id
            diploma.save()
            
            return Response({"id": diploma.id, "message": "Diplôme créé"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyDiplomasView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response([])
        # On récupère QUE les diplômes de cet utilisateur
        diplomas = Diploma.objects.filter(owner_id=user_id).order_by('-created_at')
        return Response(DiplomaSerializer(diplomas, many=True).data)

class SearchDiplomaView(APIView):
    def get(self, request):
        query = request.query_params.get('query') # Peut être un ID ou un Nom
        if not query:
            return Response([])

        # Logique de recherche : ID exact OU Nom de famille partiel
        if query.isdigit():
            diplomas = Diploma.objects.filter(id=query)
        else:
            diplomas = Diploma.objects.filter(last_name__icontains=query)
            
        return Response(DiplomaSerializer(diplomas, many=True).data)