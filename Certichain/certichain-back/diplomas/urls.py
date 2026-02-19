from django.urls import path
# IL MANQUAIT ValidateDiplomaView DANS CETTE LISTE ▼
from .views import RegisterView, LoginView, CreateDiplomaView, SearchDiplomaView, MyDiplomasView, ValidateDiplomaView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('certify/', CreateDiplomaView.as_view()),
    path('my-diplomas/', MyDiplomasView.as_view()),
    path('search/', SearchDiplomaView.as_view()),
    
    # Route de validation
    path('validate/<uuid:token>/', ValidateDiplomaView.as_view()),
]