from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class SubscriptionPlan(models.Model):
    PLAN_CHOICES = [
        ('STARTER',  'Starter'),
        ('STANDARD', 'Standard'),
        ('PREMIUM',  'Premium'),
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

    # RGPD – Art. 7 : consentement explicite au traitement des données
    gdpr_consent      = models.BooleanField(default=False, verbose_name="Consentement RGPD")
    gdpr_consent_date = models.DateTimeField(null=True, blank=True, verbose_name="Date du consentement RGPD")

    def __str__(self):
        plan = self.subscription_plan.display_name if self.subscription_plan else "Sans abonnement"
        return f"Profil de {self.user.username} – {plan}"

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
    course_name = models.CharField(max_length=200)
    graduation_date = models.DateField()
    image = models.FileField(upload_to='diplomas/') 
    
    # --- SECURITÉ & DOUBLE VALIDATION ---
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Validation École
    school_validated = models.BooleanField(default=False)
    school_token = models.UUIDField(default=uuid.uuid4, editable=False)
    
    # Validation Rectorat
    rectorate_validated = models.BooleanField(default=False)
    rectorate_token = models.UUIDField(default=uuid.uuid4, editable=False)
    rectorate_email_snapshot = models.EmailField(blank=True, null=True) # On garde une trace de qui a validé
    
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

    # Date d'expiration – null signifie "n'expire jamais"
    expiry_date = models.DateField(
        null=True, blank=True,
        help_text="Date d'expiration du diplôme (laisser vide si le diplôme n'expire jamais)."
    )

    # Tech fields
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.last_name} - {self.status}"