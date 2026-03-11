from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import logging
from .models import Diploma, UserProfile, SubscriptionPlan
from .serializers import DiplomaSerializer, UserSerializer, SubscriptionPlanSerializer, PublicDiplomaSerializer
from .web3_service import (
    compute_diploma_hash,
    certify_diploma_on_blockchain,
    revoke_diploma_on_blockchain,
    verify_diploma_on_blockchain,
    verify_eth_signature,
)
logging.basicConfig(level=logging.INFO)
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

# --- MISE À JOUR DU PROFIL ---

class UpdateProfileView(APIView):
    """
    GET  ?user_id=X  → retourne email, rectorate_email, school_eth_address, rectorate_eth_address
    PATCH            → met à jour ces champs
    """

    def _get_profile(self, user_id):
        try:
            return UserProfile.objects.select_related('user').get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return None

    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "Non authentifié"}, status=400)
        profile = self._get_profile(user_id)
        if not profile:
            return Response({"error": "Profil introuvable"}, status=404)
        return Response({
            "email":                 profile.user.email,
            "rectorate_email":       profile.rectorate_email,
            "school_eth_address":    profile.school_eth_address or "",
            "rectorate_eth_address": profile.rectorate_eth_address or "",
        })

    def patch(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "Non authentifié"}, status=400)
        profile = self._get_profile(user_id)
        if not profile:
            return Response({"error": "Profil introuvable"}, status=404)

        # Validation adresses Ethereum (format 0x + 40 hex)
        import re
        eth_re = re.compile(r'^0x[0-9a-fA-F]{40}$')

        school_eth    = request.data.get('school_eth_address', '').strip()
        rectorate_eth = request.data.get('rectorate_eth_address', '').strip()

        if school_eth and not eth_re.match(school_eth):
            return Response({"error": "Adresse MetaMask école invalide (format 0x + 40 hex)"}, status=400)
        if rectorate_eth and not eth_re.match(rectorate_eth):
            return Response({"error": "Adresse MetaMask rectorat invalide (format 0x + 40 hex)"}, status=400)

        # Email principal
        email = request.data.get('email', '').strip()
        if email:
            profile.user.email = email
            profile.user.save(update_fields=['email'])

        # Email rectorat
        rectorate_email = request.data.get('rectorate_email', '').strip()
        if rectorate_email:
            profile.rectorate_email = rectorate_email

        # Adresses MetaMask (on accepte chaîne vide pour effacer)
        if 'school_eth_address' in request.data:
            profile.school_eth_address = school_eth or None
        if 'rectorate_eth_address' in request.data:
            profile.rectorate_eth_address = rectorate_eth or None

        profile.save()

        # Changement de mot de passe
        current_password = request.data.get('current_password', '').strip()
        new_password     = request.data.get('new_password', '').strip()
        if current_password or new_password:
            if not current_password or not new_password:
                return Response({"error": "Fournissez le mot de passe actuel et le nouveau mot de passe."}, status=400)
            if not profile.user.check_password(current_password):
                return Response({"error": "Mot de passe actuel incorrect."}, status=400)
            if len(new_password) < 8:
                return Response({"error": "Le nouveau mot de passe doit contenir au moins 8 caractères."}, status=400)
            profile.user.set_password(new_password)
            profile.user.save(update_fields=['password'])

        return Response({"message": "Profil mis à jour avec succès."})

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
            # Sauvegarde initiale – school_token (UUID) est généré automatiquement par le modèle
            diploma = serializer.save(
                owner_id=user_id,
                rectorate_email_snapshot=profile.rectorate_email,
            )

            # RGPD Art. 5.1.f – Pseudonymisation : hash calculé APRÈS save pour
            # inclure school_token comme sel cryptographique aléatoire.
            # Format : "prénom|nom|intitulé|uuid-secret" → SHA-256 → bytes32
            diploma.diploma_hash = compute_diploma_hash(
                diploma.first_name,
                diploma.last_name,
                diploma.course_name,
                str(diploma.school_token),
            )
            diploma.save(update_fields=['diploma_hash'])

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
            "first_name":        diploma.first_name,
            "last_name":         diploma.last_name,
            "course_name":       diploma.course_name,
            "graduation_date":   str(diploma.graduation_date),
            "diploma_hash":      diploma.diploma_hash,   # nécessaire pour la signature MetaMask
            "validation_type":   validation_type,
            "status":            diploma.status,
            "already_validated": already_validated,
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
            eth_signature = request.data.get('eth_signature')
            eth_address   = request.data.get('eth_address')

            if not eth_signature or not eth_address:
                return Response(
                    {"error": "Signature MetaMask requise (eth_signature + eth_address)."},
                    status=400,
                )
            if not diploma.diploma_hash:
                return Response(
                    {"error": "Hash du diplôme manquant, impossible de vérifier la signature."},
                    status=400,
                )
            if not verify_eth_signature(diploma.diploma_hash, eth_signature, eth_address):
                return Response(
                    {"error": "Signature invalide : l'adresse MetaMask ne correspond pas à la signature fournie."},
                    status=400,
                )

            # Vérification du whitelist : seule l'adresse enregistrée à l'inscription peut signer
            profile = diploma.owner.profile
            if validation_type == "École":
                registered = profile.school_eth_address
                if registered and eth_address.lower() != registered.lower():
                    return Response(
                        {"error": f"Adresse MetaMask non autorisée pour le rôle École. Adresse attendue : {registered}"},
                        status=403,
                    )
            elif validation_type == "Rectorat":
                registered = profile.rectorate_eth_address
                if registered and eth_address.lower() != registered.lower():
                    return Response(
                        {"error": f"Adresse MetaMask non autorisée pour le rôle Rectorat. Adresse attendue : {registered}"},
                        status=403,
                    )

            if validation_type == "École":
                diploma.school_validated     = True
                diploma.school_eth_address   = eth_address
                diploma.school_eth_signature = eth_signature
            elif validation_type == "Rectorat":
                diploma.rectorate_validated     = True
                diploma.rectorate_eth_address   = eth_address
                diploma.rectorate_eth_signature = eth_signature

            # --- AUTOMATISATION BLOCKCHAIN (CUSTODIAL) ---
            if diploma.school_validated and diploma.rectorate_validated:
                diploma.status = 'VALIDATED'
                logging.info(f"Certification blockchain du diplôme {diploma.id} (hash: {diploma.diploma_hash[:10]}…)")

                tx_hash = certify_diploma_on_blockchain(
                    diploma.diploma_hash,
                    diploma.school_eth_address,
                    diploma.rectorate_eth_address,
                )
                if tx_hash:
                    diploma.blockchain_tx_hash = tx_hash
                    diploma.blockchain_status  = 'ANCHORED'
                    logging.info(f"Diplôme gravé on-chain. Tx: {tx_hash}")
                else:
                    diploma.blockchain_status = 'FAILED'
                    logging.error("Échec de la communication avec la blockchain.")
                    diploma.save()
                    return Response(
                        {"error": "Validation réussie, mais échec de la connexion à la Blockchain."},
                        status=500,
                    )
            # ---------------------------------------------

            diploma.save()
            return Response({
                "message":       f"La validation ({validation_type}) a bien été enregistrée !",
                "statut_global": diploma.status,
            })
            
        return Response({"error": "Action inconnue."}, status=400)


# --- UTILITAIRE INTERNE ---

def _auto_revoke_expired(owner_id=None):
    """
    Révoque automatiquement les diplômes dont expiry_date < aujourd'hui.
    - Si ANCHORED : appelle revoke() on-chain pour mettre à jour le flag blockchain.
    - Dans tous les cas : passe status='REVOKED' en DB.
    """
    today = timezone.now().date()
    qs = Diploma.objects.filter(expiry_date__lt=today, status='VALIDATED')
    if owner_id:
        qs = qs.filter(owner_id=owner_id)
    for diploma in qs:
        if diploma.blockchain_status == 'ANCHORED' and diploma.diploma_hash:
            tx = revoke_diploma_on_blockchain(diploma.diploma_hash)
            if tx:
                diploma.blockchain_status = 'REVOKED'
                logging.info(f"Diplôme #{diploma.id} expiré → révoqué on-chain ({tx})")
            else:
                logging.warning(f"Diplôme #{diploma.id} expiré → échec on-chain, DB seule mise à jour")
        diploma.status = 'REVOKED'
        diploma.save(update_fields=['status', 'blockchain_status'])


class MyDiplomasView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response([])
        _auto_revoke_expired(owner_id=user_id)
        diplomas = Diploma.objects.filter(owner_id=user_id).order_by('-created_at')
        return Response(DiplomaSerializer(diplomas, many=True).data)

class SearchDiplomaView(APIView):
    def get(self, request):
        query = request.query_params.get('query')
        if not query:
            return Response([])
        _auto_revoke_expired()
        if query.isdigit():
            diplomas = Diploma.objects.select_related('owner').filter(id=query, status__in=['VALIDATED', 'REVOKED'])
        else:
            diplomas = Diploma.objects.select_related('owner').filter(last_name__icontains=query, status__in=['VALIDATED', 'REVOKED'])
        # RGPD Art. 5.1.c – minimisation : on n'expose pas les tokens ni l'id propriétaire
        return Response(PublicDiplomaSerializer(diplomas, many=True).data)


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
                "gdpr_consent":       profile.gdpr_consent if profile else None,
                "gdpr_consent_date":  str(profile.gdpr_consent_date) if (profile and profile.gdpr_consent_date) else None,
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


class StudentErasureView(APIView):
    """
    RGPD Art. 17 – Étape 1 : demande de suppression.

    Génère un OTP à 6 chiffres valable 30 minutes et l'envoie à l'adresse
    email de l'étudiant enregistrée lors de l'émission du diplôme.

    POST /api/student-erasure/
      { "uuid": "<verification_uuid>", "deletion_token": "<student_deletion_token>" }

    Si l'étudiant n'a plus accès à son email, il doit contacter l'école directement.
    """
    def post(self, request):
        import random
        raw_uuid       = request.data.get('uuid')
        deletion_token = request.data.get('deletion_token')

        if not raw_uuid or not deletion_token:
            return Response({"error": "uuid et deletion_token requis."}, status=400)

        try:
            diploma = Diploma.objects.get(verification_uuid=raw_uuid)
        except Diploma.DoesNotExist:
            return Response({"error": "Identifiant de diplôme invalide."}, status=404)

        # Vérification du token privé
        if str(diploma.student_deletion_token) != str(deletion_token):
            return Response(
                {"error": "Token de suppression invalide. Seul l'étudiant titulaire peut exercer ce droit."},
                status=403,
            )

        if diploma.first_name == '[Supprimé]':
            return Response({"message": "Les données de ce diplôme ont déjà été supprimées."}, status=200)

        if not diploma.student_email:
            return Response(
                {"error": "Aucun email étudiant enregistré pour ce diplôme. Contactez directement l'établissement émetteur."},
                status=400,
            )

        # Générer un OTP à 6 chiffres valable 30 minutes
        otp = f"{random.randint(0, 999999):06d}"
        diploma.erasure_otp            = otp
        diploma.erasure_otp_expires_at = timezone.now() + timezone.timedelta(minutes=30)
        diploma.save(update_fields=['erasure_otp', 'erasure_otp_expires_at'])

        # Masquer l'email pour la réponse (vie privée)
        email = diploma.student_email
        parts = email.split('@')
        masked = parts[0][:2] + '***@' + parts[1] if len(parts) == 2 else '***'

        try:
            send_mail(
                subject='[CertiChain] Code de confirmation – Droit à l\'oubli (RGPD Art. 17)',
                message=(
                    f"Bonjour,\n\n"
                    f"Vous avez demandé la suppression définitive de vos données personnelles "
                    f"associées au diplôme « {diploma.course_name } ».\n\n"
                    f"Votre code de confirmation est : {otp}\n\n"
                    f"Ce code est valable 30 minutes.\n\n"
                    f"Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\n"
                    f"— L'équipe CertiChain"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            logging.error(f"Échec envoi email OTP erasure: {e}")
            return Response({"error": "Impossible d'envoyer le code de confirmation par email."}, status=500)

        logging.info(f"RGPD – OTP envoyé à {masked} pour le diplôme {diploma.id}.")
        return Response({
            "status":       "otp_sent",
            "email_masked": masked,
            "message":      f"Un code de confirmation a été envoyé à {masked}. Valable 30 minutes.",
        })


class StudentErasureConfirmView(APIView):
    """
    RGPD Art. 17 – Étape 2 : confirmation par code OTP.

    POST /api/student-erasure/confirm/
      { "uuid": "…", "deletion_token": "…", "otp": "123456" }

    Vérifie l'OTP + son expiration, puis efface les données personnelles.
    """
    def post(self, request):
        import uuid as uuid_lib
        raw_uuid       = request.data.get('uuid')
        deletion_token = request.data.get('deletion_token')
        otp_input      = request.data.get('otp', '').strip()

        if not raw_uuid or not deletion_token or not otp_input:
            return Response({"error": "uuid, deletion_token et otp requis."}, status=400)

        try:
            diploma = Diploma.objects.get(verification_uuid=raw_uuid)
        except Diploma.DoesNotExist:
            return Response({"error": "Identifiant de diplôme invalide."}, status=404)

        if str(diploma.student_deletion_token) != str(deletion_token):
            return Response({"error": "Token de suppression invalide."}, status=403)

        if diploma.first_name == '[Supprimé]':
            return Response({"message": "Les données de ce diplôme ont déjà été supprimées."}, status=200)

        # Vérification OTP
        if not diploma.erasure_otp:
            return Response({"error": "Aucun code en attente. Recommencez la demande."}, status=400)

        if timezone.now() > diploma.erasure_otp_expires_at:
            diploma.erasure_otp = None
            diploma.erasure_otp_expires_at = None
            diploma.save(update_fields=['erasure_otp', 'erasure_otp_expires_at'])
            return Response({"error": "Code expiré. Recommencez la demande."}, status=400)

        if otp_input != diploma.erasure_otp:
            return Response({"error": "Code incorrect. Vérifiez votre email et réessayez."}, status=400)

        # ── Anonymisation RGPD Art. 17 ──────────────────────────────────────────
        diploma.first_name = '[Supprimé]'
        diploma.last_name  = '[Supprimé]'
        if diploma.image:
            try:
                diploma.image.delete(save=False)
            except Exception:
                pass
            diploma.image = None
        if diploma.photo:
            try:
                diploma.photo.delete(save=False)
            except Exception:
                pass
            diploma.photo = None
        # Effacement de l'email et de l'OTP (plus aucune donnée personnelle résiduelle)
        diploma.student_email          = None
        diploma.erasure_otp            = None
        diploma.erasure_otp_expires_at = None
        # Rotation de l'UUID : l'ancien lien ne fonctionnera plus
        diploma.verification_uuid = uuid_lib.uuid4()
        diploma.save()

        logging.info(f"RGPD Art. 17 – Étudiant a confirmé son droit à l'oubli sur le diplôme {diploma.id}.")
        return Response({
            "message": (
                "Vos données personnelles ont été supprimées conformément au RGPD (Art. 17). "
                "La preuve cryptographique sur la blockchain est conservée (Art. 17.3.b) "
                "mais ne contient aucune information personnelle."
            )
        })


class SchoolDiplomaErasureView(APIView):
    """
    RGPD Art. 17 – Effacement des données personnelles d’un diplôme par l’école émettrice.

    Seul le propriétaire du diplôme (vérifié via user_id) peut effectuer cet effacement.
    Le hash + la preuve blockchain sont conservés (Art. 17.3.b).

    POST /api/school-diploma-erasure/
      { "user_id": X, "diploma_id": Y, "confirm": true }
    """
    def post(self, request):
        import uuid as uuid_lib
        user_id    = request.data.get('user_id')
        diploma_id = request.data.get('diploma_id')
        confirm    = request.data.get('confirm', False)

        if not user_id or not diploma_id or not confirm:
            return Response({"error": "user_id, diploma_id et confirm=true requis."}, status=400)

        try:
            diploma = Diploma.objects.get(pk=diploma_id, owner_id=user_id)
        except Diploma.DoesNotExist:
            return Response({"error": "Diplôme introuvable ou non autorisé."}, status=404)

        if diploma.first_name == '[Supprimé]':
            return Response({"message": "Les données de ce diplôme ont déjà été supprimées."}, status=200)

        # Anonymisation RGPD Art. 17
        diploma.first_name    = '[Supprimé]'
        diploma.last_name     = '[Supprimé]'
        diploma.student_email = None
        if diploma.image:
            try:
                diploma.image.delete(save=False)
            except Exception:
                pass
            diploma.image = None
        if diploma.photo:
            try:
                diploma.photo.delete(save=False)
            except Exception:
                pass
            diploma.photo = None
        # Rotation de l'UUID
        diploma.verification_uuid = uuid_lib.uuid4()
        diploma.save()

        logging.info(f"RGPD Art. 17 – École (user {user_id}) a effacé les données du diplôme {diploma.id}.")
        return Response({
            "message": (
                "Les données personnelles du diplôme ont été supprimées (RGPD Art. 17). "
                "La preuve blockchain est conservée (Art. 17.3.b)."
            )
        })


class RevokeDiplomaView(APIView):
    """
    Révoque un diplôme ancré sur la blockchain.
    – Seul le propriétaire (école émettrice) peut révoquer ses propres diplômes.
    – Le hash reste sur la chaîne (preuve d'historique) mais le flag revoked = true.
    – Le statut Django passe à REJECTED (plus comptabilisé dans le quota).
    """
    def post(self, request):
        user_id    = request.data.get('user_id')
        diploma_id = request.data.get('diploma_id')

        if not user_id or not diploma_id:
            return Response({"error": "user_id et diploma_id requis."}, status=400)

        try:
            diploma = Diploma.objects.get(pk=diploma_id, owner_id=user_id)
        except Diploma.DoesNotExist:
            return Response({"error": "Diplôme introuvable ou non autorisé."}, status=404)

        if diploma.blockchain_status != 'ANCHORED':
            return Response(
                {"error": "Seuls les diplômes ancrés (ANCHORED) peuvent être révoqués."},
                status=400,
            )

        tx_hash = revoke_diploma_on_blockchain(diploma.diploma_hash)
        if not tx_hash:
            return Response({"error": "Échec de la révocation sur la blockchain."}, status=500)

        diploma.blockchain_status = 'REVOKED'
        diploma.status            = 'REVOKED'
        diploma.save(update_fields=['blockchain_status', 'status'])

        return Response({
            "message":  "Diplôme révoqué avec succès sur la blockchain.",
            "tx_hash":  tx_hash,
            "diploma_hash": diploma.diploma_hash,
        })


class VerifyBlockchainView(APIView):
    """
    Vérifie l'état d'un diplôme directement sur le contrat (lecture seule, public).
    Paramètre GET : hash=0x...
    """
    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        diploma_hash = request.query_params.get('hash')
        if not diploma_hash:
            return Response({"error": "Paramètre 'hash' requis."}, status=400)

        result = verify_diploma_on_blockchain(diploma_hash)
        if result is None:
            return Response(
                {"error": "Impossible de contacter la blockchain. Vérifiez que le nœud Hardhat est lancé."},
                status=503,
            )
        return Response(result)


class VerifyByUUIDView(APIView):
    """
    Vérification publique par UUID étudiant.

    L'étudiant reçoit un lien /verify/<uuid> (QR Code ou email).
    Cette vue retrouve le diplôme, vérifie son état on-chain et retourne
    les informations nécessaires à l'affichage.

    Droit à l'oubli (RGPD Art. 17) :
    Si l'école a effacé les données, first_name == '[Supprimé]'.
    Le hash reste sur la blockchain (preuve d'historique), mais
    aucune information personnelle n'est exposée — le hash devient
    une "empreinte morte" que personne ne peut recalculer.
    """
    authentication_classes = []
    permission_classes     = []

    def get(self, request, uuid):
        try:
            diploma = Diploma.objects.select_related('owner').get(verification_uuid=uuid)
        except Diploma.DoesNotExist:
            return Response({"error": "Lien de vérification invalide ou révoqué."}, status=404)

        # Déclenche la révocation automatique si la date d'expiration est passée
        _auto_revoke_expired()
        diploma.refresh_from_db()

        data_deleted = (diploma.first_name == '[Supprimé]')

        bc_result = None
        # On interroge la blockchain uniquement si le diplôme y a été ancré.
        # Si le nœud est down ou a été redémarré, on retourne None et le frontend
        # distingue  ANCHORED+bc_null  (nœud indisponible) de  NOT_ANCHORED.
        if diploma.diploma_hash and not data_deleted and diploma.blockchain_status in ('ANCHORED', 'REVOKED'):
            bc_result = verify_diploma_on_blockchain(diploma.diploma_hash)

        return Response({
            "found":        True,
            "data_deleted": data_deleted,
            "diploma":      PublicDiplomaSerializer(diploma, context={'request': request}).data,
            "blockchain":   bc_result,
        })

