from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class SubscriptionPlan(models.Model):
    PLAN_CHOICES = [
        ('ESSENTIEL',  'Essentiel'),
        ('CAMPUS', 'Campus'),
        ('UNIVERSITE', 'Université'),
        ('ACADEMIE', 'Académie'),
    ]
    name         = models.CharField(max_length=20, choices=PLAN_CHOICES, unique=True)
    display_name = models.CharField(max_length=50)
    annual_price = models.DecimalField(max_digits=8, decimal_places=2)
    max_diplomas = models.IntegerField(help_text='-1 signifie illimité')
    level        = models.IntegerField(help_text='Niveau pour contrôler les upgrades (plus grand = meilleur)')

    class Meta:
        ordering = ['level']

    def __str__(self):
        return f"{self.display_name} ({self.max_diplomas} diplômes/an)"


class UserProfile(models.Model):
    user              = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    rectorate_email   = models.EmailField(verbose_name="Email du Rectorat de rattachement")
    subscription_plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='subscribers',
    )
    subscription_start = models.DateField(default=timezone.now)

    # Informations de l'établissement
    school_name    = models.CharField(max_length=200, blank=True, null=True, verbose_name="Nom officiel de l'établissement")
    school_type    = models.CharField(
        max_length=50, blank=True, null=True,
        choices=[
            ('UNIVERSITE',  'Université'),
            ('GRANDE_ECOLE','Grande École'),
            ('INGENIEUR',   "École d'ingénieurs"),
            ('COMMERCE',    'École de commerce'),
        ],
        verbose_name="Type d'établissement",
    )
    school_address = models.CharField(max_length=255, blank=True, null=True, verbose_name='Adresse postale')
    school_zip     = models.CharField(max_length=10,  blank=True, null=True, verbose_name='Code postal')
    school_city    = models.CharField(max_length=100, blank=True, null=True, verbose_name='Ville')
    school_phone   = models.CharField(max_length=20,  blank=True, null=True, verbose_name='Téléphone')
    school_website = models.URLField(max_length=200,  blank=True, null=True, verbose_name='Site web')
    director_name  = models.CharField(max_length=150, blank=True, null=True, verbose_name='Nom du directeur / chef d\'établissement')
    uai_code       = models.CharField(max_length=8,   blank=True, null=True, verbose_name='Code UAI/RNE', help_text='7 chiffres + 1 lettre, ex : 0750654E')
    siret          = models.CharField(max_length=14,  blank=True, null=True, verbose_name='Numéro SIRET', help_text='14 chiffres')

    # Adresses MetaMask enregistrées à l'inscription – seules ces adresses peuvent signer les diplômes
    school_eth_address    = models.CharField(max_length=42, blank=True, null=True, help_text="Adresse MetaMask officielle de l'école (0x...)")
    rectorate_eth_address = models.CharField(max_length=42, blank=True, null=True, help_text="Adresse MetaMask officielle du rectorat (0x...")

    # RGPD – Art. 7 : consentement explicite au traitement des données
    gdpr_consent      = models.BooleanField(default=False, verbose_name="Consentement RGPD")
    gdpr_consent_date = models.DateTimeField(null=True, blank=True, verbose_name="Date du consentement RGPD")

    def __str__(self):
        plan = self.subscription_plan.display_name if self.subscription_plan else "Sans abonnement"
        return f"Profil de {self.user.username} – {plan}"


class ActionOTP(models.Model):
    """Code OTP à usage unique envoyé par email pour valider chaque action critique."""
    ACTION_CHOICES = [
        ('CREATE_DIPLOMA',  'Émettre un diplôme'),
        ('REVOKE_DIPLOMA',  'Révoquer un diplôme'),
        ('ERASE_DIPLOMA',   'Effacer données RGPD'),
        ('UPDATE_PROFILE',  'Modifier le profil'),
        ('CHANGE_PASSWORD', 'Changer le mot de passe'),
        ('DELETE_ACCOUNT',  'Supprimer le compte'),
    ]
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='action_otps')
    action_type = models.CharField(max_length=30, choices=ACTION_CHOICES)
    code        = models.CharField(max_length=6)
    created_at  = models.DateTimeField(auto_now_add=True)
    expires_at  = models.DateTimeField()
    used        = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP {self.action_type} – {self.user.username} ({'utilisé' if self.used else 'actif'})"


class Diploma(models.Model):
    STATUS_CHOICES = [
        ('PENDING',   'En attente de validation'),
        ('VALIDATED', 'Validé par tous'),
        ('REJECTED',  'Rejeté'),
        ('REVOKED',   'Révoqué'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='diplomas')
    
    # Infos Étudiant
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True, help_text="Date de naissance (identification visuelle anti-usurpation)")
    course_name = models.CharField(max_length=200)
    graduation_date = models.DateField(null=True, blank=True)
    image = models.FileField(upload_to='diplomas/', help_text='Fichier du diplôme (PDF, image…)')
    photo = models.FileField(upload_to='photos/', null=True, blank=True, help_text="Photo d'identité de l’étudiant (JPG, PNG…)")
    
    # --- SECURITÉ & DOUBLE VALIDATION ---
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Validation École
    school_validated = models.BooleanField(default=False)
    school_token = models.UUIDField(default=uuid.uuid4, editable=False)
    
    # Validation Rectorat
    rectorate_validated = models.BooleanField(default=False)
    rectorate_token = models.UUIDField(default=uuid.uuid4, editable=False)
    rectorate_email_snapshot = models.EmailField(blank=True, null=True) # On garde une trace de qui a validé

    # Lien étudiant – UUID opaque transmis à l'étudiant (QR Code / lien de vérification)
    # N'est PAS intégré dans le hash : c'est un simple lookup token, jamais devinable
    verification_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # Token privé de suppression RGPD Art. 17 – NE doit PAS apparaître dans le QR Code public.
    # Seul l'établissement le connaît ; il le transmet directement à l'étudiant (email, courrier…).
    student_deletion_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # Email étudiant – uniquement pour l'envoi du code de confirmation RGPD.
    # N'est jamais exposé publiquement ni intégré dans le hash.
    student_email = models.EmailField(blank=True, null=True, help_text="Email étudiant (envoi code OTP droit à l'oubli uniquement)")

    # OTP de confirmation d'effacement (6 chiffres, valable 30 minutes)
    erasure_otp            = models.CharField(max_length=6,  blank=True, null=True)
    erasure_otp_expires_at = models.DateTimeField(blank=True, null=True)
    
    # Blockchain
    diploma_hash       = models.CharField(max_length=66, blank=True, null=True, help_text='SHA-256 pseudonymisé des données clés (préfixé 0x) – jamais de données perso en clair')
    blockchain_tx_hash = models.CharField(max_length=66, blank=True, null=True, help_text='Hash de la transaction Ethereum')
    blockchain_status  = models.CharField(
        max_length=20,
        choices=[
            ('NOT_ANCHORED', 'Non ancré'),
            ('ANCHORED',     'Ancré sur la blockchain'),
            ('FAILED',       "Échec d'ancrage"),
            ('REVOKED',      'Révoqué sur la blockchain'),
        ],
        default='NOT_ANCHORED',
    )

    # Double signature MetaMask – preuve cryptographique de co-validation (École + Rectorat)
    school_eth_address      = models.CharField(max_length=42,  blank=True, null=True, help_text='Adresse MetaMask de l\'école')
    school_eth_signature    = models.CharField(max_length=200, blank=True, null=True)
    rectorate_eth_address   = models.CharField(max_length=42,  blank=True, null=True, help_text='Adresse MetaMask du rectorat')
    rectorate_eth_signature = models.CharField(max_length=200, blank=True, null=True)

    # Tech fields
    expiry_date = models.DateField(
        null=True, blank=True,
        help_text="Date d'expiration du diplôme. Null = n'expire jamais."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.last_name} - {self.status}"
class QRPreset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='qr_presets')
    name = models.CharField(max_length=100)
    embed_qr = models.BooleanField(default=True)
    qr_x_pct = models.FloatField(default=72.0)
    qr_y_pct = models.FloatField(default=72.0)
    qr_size_pct = models.FloatField(default=18.0)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.user.username})"
