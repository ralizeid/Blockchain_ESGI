from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Diploma, UserProfile, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'display_name', 'annual_price', 'max_diplomas', 'level']


class UserSerializer(serializers.ModelSerializer):
    rectorate_email   = serializers.EmailField(write_only=True, required=True)
    subscription_plan = serializers.CharField(write_only=True, required=True)  # e.g. 'STARTER'
    # RGPD Art. 7 – consentement explicite obligatoire à l'inscription
    gdpr_consent = serializers.BooleanField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'rectorate_email', 'subscription_plan', 'gdpr_consent']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_gdpr_consent(self, value):
        if not value:
            raise serializers.ValidationError(
                "Vous devez accepter la politique de confidentialité pour créer un compte."
            )
        return value

    def validate_subscription_plan(self, value):
        try:
            return SubscriptionPlan.objects.get(name=value.upper())
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError(f"Plan inconnu : {value}. Choisissez parmi STARTER, STANDARD, PREMIUM.")

    def create(self, validated_data):
        rectorate_email   = validated_data.pop('rectorate_email')
        subscription_plan = validated_data.pop('subscription_plan')  # already a SubscriptionPlan instance
        gdpr_consent      = validated_data.pop('gdpr_consent')

        user = User.objects.create_user(**validated_data)

        UserProfile.objects.create(
            user=user,
            rectorate_email=rectorate_email,
            subscription_plan=subscription_plan,
            gdpr_consent=gdpr_consent,
            gdpr_consent_date=timezone.now() if gdpr_consent else None,
        )
        return user


class DiplomaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Diploma
        fields = '__all__'
        read_only_fields = ['owner', 'status', 'school_validated', 'rectorate_validated', 'school_token', 'rectorate_token', 'verification_uuid']

    def validate(self, data):
        from django.utils import timezone as tz
        today = tz.now().date()
        grad_date   = data.get('graduation_date')
        expiry_date = data.get('expiry_date')
        if grad_date and grad_date > today:
            raise serializers.ValidationError(
                {'graduation_date': "La date d'obtention ne peut pas être dans le futur."}
            )
        if expiry_date:
            if expiry_date <= today:
                raise serializers.ValidationError(
                    {'expiry_date': "La date d'expiration doit être strictement dans le futur."}
                )
            if grad_date and expiry_date <= grad_date:
                raise serializers.ValidationError(
                    {'expiry_date': "La date d'expiration doit être postérieure à la date d'obtention."}
                )
        return data


# RGPD Art. 5.1.c – minimisation des données : seuls les champs publics sont exposés
class PublicDiplomaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Diploma
        fields = [
            'id', 'first_name', 'last_name', 'course_name', 'graduation_date',
            'expiry_date',
            'status', 'status_display', 'diploma_hash', 'blockchain_tx_hash',
            'blockchain_status', 'created_at', 'verification_uuid',
        ]