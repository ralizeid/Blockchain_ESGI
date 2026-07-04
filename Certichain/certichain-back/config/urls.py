from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # On dit à Django : "Si l'URL commence par api/, va voir dans diplomas/urls.py"
    path('api/', include('diplomas.urls')),
]

if settings.DEBUG:
    from django.contrib import admin
    urlpatterns = [path('admin/', admin.site.urls)] + urlpatterns

# Ajout pour servir les fichiers médias (diplômes) en mode DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)