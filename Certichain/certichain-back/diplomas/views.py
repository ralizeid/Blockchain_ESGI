from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from .models import Diploma, UserProfile
from .serializers import DiplomaSerializer, UserSerializer

# --- AUTHENTIFICATION ---

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Compte école créé avec profil rectorat !"}, status=status.HTTP_201_CREATED)
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

# --- DIPLÔMES & VALIDATION ---

# N'oublie pas de vérifier que settings est bien importé en haut du fichier !
# from django.conf import settings

class CreateDiplomaView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "Non authentifié"}, status=status.HTTP_403_FORBIDDEN)

        serializer = DiplomaSerializer(data=request.data)
        if serializer.is_valid():
            try:
                profile = UserProfile.objects.get(user_id=user_id)
            except UserProfile.DoesNotExist:
                return Response({"error": "Profil incomplet : Email rectorat manquant"}, status=400)

            diploma = serializer.save(
                owner_id=user_id,
                rectorate_email_snapshot=profile.rectorate_email
            )
            
            # --- C'EST ICI QUE TOUT SE JOUE ---
            # On utilise la variable qui s'adapte toute seule !
            frontend_url = settings.FRONTEND_URL.rstrip('/') # rstrip('/') évite d'avoir un double slash si tu mets 'http://site.com/'
            
            school_link = f"{frontend_url}/validate/{diploma.school_token}"
            send_mail(
                'Action Requise : Confirmez votre émission de diplôme',
                f'Bonjour,\n\nCliquez sur le lien ci-dessous pour confirmer l\'émission du diplôme pour {diploma.first_name} {diploma.last_name} :\n\n{school_link}\n\nL\'équipe CertiChain.',
                settings.EMAIL_HOST_USER,
                [profile.user.email or 'ecole@test.com'],
                fail_silently=False,
            )

            rectorate_link = f"{frontend_url}/validate/{diploma.rectorate_token}"
            send_mail(
                'Action Requise : Validation Rectorat',
                f'Bonjour,\n\nL\'établissement {profile.user.username} a émis un diplôme pour {diploma.first_name} {diploma.last_name}.\n\nVeuillez valider cette certification ici :\n\n{rectorate_link}\n\nL\'équipe CertiChain.',
                settings.EMAIL_HOST_USER,
                [profile.rectorate_email],
                fail_silently=False,
            )
            
            return Response({"message": "Diplôme créé. Emails de validation envoyés !"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class ValidateDiplomaView(APIView):
    def get(self, request, token):
        try:
            diploma = None
            validation_type = None

            if Diploma.objects.filter(school_token=token).exists():
                diploma = Diploma.objects.get(school_token=token)
                diploma.school_validated = True
                validation_type = "École"
            
            elif Diploma.objects.filter(rectorate_token=token).exists():
                diploma = Diploma.objects.get(rectorate_token=token)
                diploma.rectorate_validated = True
                validation_type = "Rectorat"
            
            else:
                return Response({"error": "Lien de validation invalide ou déjà utilisé."}, status=404)

            if diploma.school_validated and diploma.rectorate_validated:
                diploma.status = 'VALIDATED'
            
            diploma.save()

            return Response({
                "message": f"La validation {validation_type} a été effectuée avec succès !",
                "statut_global": diploma.status
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)

class MyDiplomasView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response([])
        diplomas = Diploma.objects.filter(owner_id=user_id).order_by('-created_at')
        return Response(DiplomaSerializer(diplomas, many=True).data)

class SearchDiplomaView(APIView):
    def get(self, request):
        query = request.query_params.get('query')
        if not query:
            return Response([])

        if query.isdigit():
            diplomas = Diploma.objects.filter(id=query, status='VALIDATED')
        else:
            diplomas = Diploma.objects.filter(last_name__icontains=query, status='VALIDATED')
            
        return Response(DiplomaSerializer(diplomas, many=True).data)