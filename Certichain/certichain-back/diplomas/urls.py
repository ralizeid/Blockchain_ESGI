from django.urls import path
from .views import (
    RegisterView, LoginView,
    CreateDiplomaView, SearchDiplomaView, MyDiplomasView, ValidateDiplomaView,
    QuotaView,
    SubscriptionPlansView, UpgradeSubscriptionView,
    ExportDataView, DeleteAccountView,
    RevokeDiplomaView, VerifyBlockchainView,
)

urlpatterns = [
    path('register/',   RegisterView.as_view()),
    path('login/',      LoginView.as_view()),
    path('certify/',    CreateDiplomaView.as_view()),
    path('my-diplomas/', MyDiplomasView.as_view()),
    path('search/',     SearchDiplomaView.as_view()),
    path('validate/<uuid:token>/', ValidateDiplomaView.as_view()),
    path('quota/',      QuotaView.as_view()),
    # Abonnements
    path('plans/',      SubscriptionPlansView.as_view()),
    path('upgrade/',    UpgradeSubscriptionView.as_view()),
    # RGPD
    path('export-data/',    ExportDataView.as_view()),
    path('delete-account/', DeleteAccountView.as_view()),
    # Blockchain
    path('revoke-diploma/',    RevokeDiplomaView.as_view()),
    path('verify-blockchain/', VerifyBlockchainView.as_view()),
]
