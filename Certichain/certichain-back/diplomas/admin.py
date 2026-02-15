from django.contrib import admin
from .models import Diploma

@admin.register(Diploma)
class DiplomaAdmin(admin.ModelAdmin):
    # J'ai retiré 'is_minted' et ajouté 'owner' pour voir quelle école a créé le diplôme
    list_display = ('last_name', 'first_name', 'course_name', 'graduation_date', 'owner')
    
    search_fields = ('last_name', 'first_name', 'course_name')
    
    # J'ai retiré 'is_minted' des filtres
    list_filter = ('graduation_date', 'created_at')