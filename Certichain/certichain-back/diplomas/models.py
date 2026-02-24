from django.db import models
from django.contrib.auth.models import User
import uuid

# Extension du User pour stocker l'email du rectorat
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    rectorate_email = models.EmailField(verbose_name="Email du Rectorat de rattachement")

    def __str__(self):
        return f"Profil de {self.user.username}"

class Diploma(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'En attente de validation'),
        ('VALIDATED', 'Validé par tous'),
        ('REJECTED', 'Rejeté'),
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
    
    # Tech fields
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.last_name} - {self.status}"