from django.db import models
from django.contrib.auth.models import User

class Diploma(models.Model):
    # Lien avec l'école (L'utilisateur connecté)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='diplomas')
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    course_name = models.CharField(max_length=200)
    graduation_date = models.DateField()
    image = models.FileField(upload_to='diplomas/') 
    
    # Tech fields
    ipfs_cid = models.CharField(max_length=255, blank=True, null=True)
    tx_hash = models.CharField(max_length=255, blank=True, null=True)
    token_id = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.last_name} {self.first_name}"