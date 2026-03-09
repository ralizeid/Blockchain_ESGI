from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import Diploma, UserProfile, SubscriptionPlan
from .serializers import DiplomaSerializer, UserSerializer, SubscriptionPlanSerializer

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

        try:
            profile = UserProfile.objects.select_related('subscription_plan').get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response({"error": "Profil introuvable"}, status=404)

        plan = profile.subscription_plan
        limit = plan.max_diplomas if plan else 0  # 0 si aucun abonnement

        current_year = timezone.now().year
        used_quota = Diploma.objects.filter(
            owner_id=user_id,
            created_at__year=current_year,
        ).exclude(status='REJECTED').count()

        unlimited = (limit == -1)

        return Response({
            "used":      used_quota,
            "limit":     limit,
            "remaining": None if unlimited else max(0, limit - used_quota),
            "unlimited": unlimited,
            "has_plan":     plan is not None,
            "plan_name":    plan.display_name if plan else "Aucun",
            "plan_id":      plan.id if plan else None,
            "plan_level":   plan.level if plan else 0,
            "annual_price": str(plan.annual_price) if plan else "0.00",
        })

# --- DIPLÔMES & VALIDATION ---

class CreateDiplomaView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "Non authentifié"}, status=status.HTTP_403_FORBIDDEN)

        try:
            profile = UserProfile.objects.select_related('subscription_plan').get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response({"error": "Profil incomplet : Email rectorat manquant"}, status=400)

        plan = profile.subscription_plan
        if plan is None:
            return Response({"error": "Aucun abonnement actif. Veuillez souscrire à un plan."}, status=status.HTTP_403_FORBIDDEN)

        max_diplomas = plan.max_diplomas  # -1 = illimité

        if max_diplomas != -1:
            current_year = timezone.now().year
            used_quota = Diploma.objects.filter(
                owner_id=user_id,
                created_at__year=current_year,
            ).exclude(status='REJECTED').count()

            if used_quota >= max_diplomas:
                return Response(
                    {"error": f"Limite annuelle atteinte ({used_quota}/{max_diplomas}). "
                               f"Veuillez souscrire à un abonnement supérieur."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = DiplomaSerializer(data=request.data)
        if serializer.is_valid():
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


# --- ABONNEMENTS ---

class SubscriptionPlansView(APIView):
    """Retourne la liste des plans disponibles (utilisée à l'inscription et dans le dashboard)."""
    def get(self, request):
        plans = SubscriptionPlan.objects.all()
        return Response(SubscriptionPlanSerializer(plans, many=True).data)


class UpgradeSubscriptionView(APIView):
    """Permet à une école de passer à un plan supérieur (jamais inférieur)."""
    def post(self, request):
        user_id = request.data.get('user_id')
        new_plan_name = request.data.get('plan')  # 'STARTER' | 'STANDARD' | 'PREMIUM'

        if not user_id or not new_plan_name:
            return Response({"error": "user_id et plan sont requis."}, status=400)

        try:
            profile = UserProfile.objects.select_related('subscription_plan').get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response({"error": "Profil introuvable."}, status=404)

        try:
            new_plan = SubscriptionPlan.objects.get(name=new_plan_name.upper())
        except SubscriptionPlan.DoesNotExist:
            return Response({"error": f"Plan inconnu : {new_plan_name}."}, status=400)

        current_plan = profile.subscription_plan

        # Règle : on ne peut qu'upgrader (niveau supérieur)
        if current_plan and new_plan.level <= current_plan.level:
            return Response(
                {"error": f"Impossible de passer de '{current_plan.display_name}' à '{new_plan.display_name}'. "
                           f"Vous ne pouvez choisir qu'un plan de niveau supérieur."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.subscription_plan  = new_plan
        profile.subscription_start = timezone.now().date()
        profile.save()

        return Response({
            "message":  f"Abonnement mis à jour vers {new_plan.display_name} !",
            "plan_name": new_plan.display_name,
            "max_diplomas": new_plan.max_diplomas,
            "annual_price": str(new_plan.annual_price),
        })


# --- RGPD ---

class ExportDataView(APIView):
    """RGPD Art. 15 & 20 – Export de toutes les données personnelles."""
    def get(self, request):
        from django.contrib.auth.models import User
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "user_id requis."}, status=400)

        try:
            user = User.objects.select_related('profile').get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=404)

        profile = getattr(user, 'profile', None)
        diplomas = Diploma.objects.filter(owner_id=user_id).values(
            'id', 'first_name', 'last_name', 'course_name',
            'graduation_date', 'status', 'created_at',
            'diploma_hash', 'blockchain_tx_hash', 'blockchain_status',
        )

        data = {
            "compte": {
                "id":         user.id,
                "username":   user.username,
                "email":      user.email,
                "date_joined": str(user.date_joined),
            },
            "profil": {
                "rectorate_email":    profile.rectorate_email if profile else None,
                "subscription_plan":  profile.subscription_plan.display_name if (profile and profile.subscription_plan) else None,
                "subscription_start": str(profile.subscription_start) if profile else None,
            } if profile else {},
            "diplomes_emis": list(diplomas),
        }
        return Response(data)


class DeleteAccountView(APIView):
    """RGPD Art. 17 – Suppression du compte avec anonymisation des diplômes validés."""
    def post(self, request):
        from django.contrib.auth.models import User
        user_id = request.data.get('user_id')
        confirm = request.data.get('confirm', False)

        if not user_id or not confirm:
            return Response({"error": "user_id et confirm=true requis."}, status=400)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=404)

        # Anonymiser les diplômes validés (conserver la preuve blockchain – Art. 17.3.b)
        Diploma.objects.filter(owner_id=user_id, status='VALIDATED').update(
            first_name='[Supprimé]',
            last_name='[Supprimé]',
        )
        # Supprimer les diplômes non validés
        Diploma.objects.filter(owner_id=user_id).exclude(status='VALIDATED').delete()

        # Supprimer le compte (cascade sur UserProfile)
        user.delete()

        return Response({"message": "Votre compte et vos données personnelles ont été supprimés."})