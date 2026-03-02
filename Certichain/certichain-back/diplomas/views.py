from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
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

# --- GESTION DU QUOTA ---

class QuotaView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "Non authentifié"}, status=400)
            
        current_year = timezone.now().year
        used_quota = Diploma.objects.filter(
            owner_id=user_id, 
            created_at__year=current_year
        ).exclude(status='REJECTED').count()
        
        limit = 3 
        
        return Response({
            "used": used_quota,
            "limit": limit,
            "remaining": limit - used_quota
        })

# --- DIPLÔMES & VALIDATION ---

class CreateDiplomaView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "Non authentifié"}, status=status.HTTP_403_FORBIDDEN)

        current_year = timezone.now().year
        used_quota = Diploma.objects.filter(
            owner_id=user_id, 
            created_at__year=current_year
        ).exclude(status='REJECTED').count()
        
        if used_quota >= 3:
            return Response({"error": "Limite annuelle atteinte (3/3). Veuillez souscrire à un abonnement supérieur."}, status=status.HTTP_403_FORBIDDEN)

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
            
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
            
            school_link = f"{frontend_url}/validate/{diploma.school_token}"
            send_mail(
                'Action Requise : Confirmez votre émission de diplôme',
                f'Bonjour,\n\nUn diplôme a été généré pour {diploma.first_name} {diploma.last_name}.\nCliquez sur ce lien pour en voir les détails et le valider :\n\n{school_link}\n\nL\'équipe CertiChain.',
                settings.EMAIL_HOST_USER,
                [profile.user.email or 'ecole@test.com'],
                fail_silently=False,
            )

            rectorate_link = f"{frontend_url}/validate/{diploma.rectorate_token}"
            send_mail(
                'Action Requise : Validation Rectorat',
                f'Bonjour,\n\nL\'établissement {profile.user.username} a émis un diplôme pour {diploma.first_name} {diploma.last_name}.\n\nVeuillez examiner et valider cette certification ici :\n\n{rectorate_link}\n\nL\'équipe CertiChain.',
                settings.EMAIL_HOST_USER,
                [profile.rectorate_email],
                fail_silently=False,
            )
            
            return Response({"message": "Diplôme créé. Emails de validation envoyés !"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ValidateDiplomaView(APIView):
    authentication_classes = [] 
    permission_classes = []

    def _get_diploma_and_type(self, token):
        if Diploma.objects.filter(school_token=token).exists():
            return Diploma.objects.get(school_token=token), "École"
        elif Diploma.objects.filter(rectorate_token=token).exists():
            return Diploma.objects.get(rectorate_token=token), "Rectorat"
        return None, None

    def get(self, request, token):
        diploma, validation_type = self._get_diploma_and_type(token)
        
        if not diploma:
            return Response({"error": "Lien de validation invalide ou expiré."}, status=404)
        
        # NOUVEAU : On vérifie si la personne qui a ce token a DÉJÀ validé
        already_validated = False
        if validation_type == "École":
            already_validated = diploma.school_validated
        elif validation_type == "Rectorat":
            already_validated = diploma.rectorate_validated
            
        return Response({
            "first_name": diploma.first_name,
            "last_name": diploma.last_name,
            "course_name": diploma.course_name,
            "graduation_date": str(diploma.graduation_date), 
            "validation_type": validation_type,
            "status": diploma.status,
            "already_validated": already_validated # On envoie l'info au frontend
        })

    def post(self, request, token):
        action = request.data.get('action') 
        diploma, validation_type = self._get_diploma_and_type(token)
        
        if not diploma:
            return Response({"error": "Lien de validation invalide ou expiré."}, status=404)
            
        if diploma.status == 'REJECTED':
            return Response({"error": "Ce diplôme a déjà été refusé."}, status=400)

        if action == 'reject':
            diploma.status = 'REJECTED'
            diploma.save()
            return Response({"message": f"Le diplôme a été refusé par : {validation_type}. Le quota a été restauré."})

        elif action == 'validate':
            if validation_type == "École":
                diploma.school_validated = True
            elif validation_type == "Rectorat":
                diploma.rectorate_validated = True

            if diploma.school_validated and diploma.rectorate_validated:
                diploma.status = 'VALIDATED'
                
            diploma.save()
            return Response({
                "message": f"La validation ({validation_type}) a bien été enregistrée !",
                "statut_global": diploma.status
            })
            
        return Response({"error": "Action inconnue."}, status=400)


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