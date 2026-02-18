from django.urls import path
from .views import RegisterView, LoginView, CreateDiplomaView, SearchDiplomaView, MyDiplomasView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('certify/', CreateDiplomaView.as_view()),
    path('my-diplomas/', MyDiplomasView.as_view()),
    path('search/', SearchDiplomaView.as_view()),
]