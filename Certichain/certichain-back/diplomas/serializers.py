from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Diploma, UserProfile, SubscriptionPlan, QRPreset


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'display_name', 'annual_price', 'max_diplomas', 'level']


class UserSerializer(serializers.ModelSerializer):
    rectorate_email       = serializers.EmailField(write_only=True, required=True)
    subscription_plan     = serializers.CharField(write_only=True, required=True)  # e.g. 'ESSENTIEL'
    school_eth_address    = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    rectorate_eth_address = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    # RGPD Art. 7 – consentement explicite obligatoire à l'inscription
    gdpr_consent = serializers.BooleanField(write_only=True, required=True)
    # Informations établissement
    school_name    = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    school_type    = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    school_address = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    school_zip     = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    school_city    = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    school_phone   = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    school_website = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    director_name  = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    uai_code       = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    siret          = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password',
            'rectorate_email', 'subscription_plan',
            'school_eth_address', 'rectorate_eth_address',
            'gdpr_consent',
            'school_name', 'school_type', 'school_address', 'school_zip', 'school_city',
            'school_phone', 'school_website', 'director_name', 'uai_code', 'siret',
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value):
        import re
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$', value):
            raise serializers.ValidationError(
                "Le mot de passe doit faire au moins 12 caractères et contenir une majuscule, une minuscule, un chiffre et un caractère spécial."
            )
        return value

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
            raise serializers.ValidationError(f"Plan inconnu : {value}. Choisissez parmi ESSENTIEL, CAMPUS, UNIVERSITE, ACADEMIE.")

    def create(self, validated_data):
        rectorate_email       = validated_data.pop('rectorate_email')
        subscription_plan     = validated_data.pop('subscription_plan')  # already a SubscriptionPlan instance
        gdpr_consent          = validated_data.pop('gdpr_consent')
        school_eth_address    = validated_data.pop('school_eth_address', '') or None
        rectorate_eth_address = validated_data.pop('rectorate_eth_address', '') or None
        school_name    = validated_data.pop('school_name',    '') or None
        school_type    = validated_data.pop('school_type',    '') or None
        school_address = validated_data.pop('school_address', '') or None
        school_zip     = validated_data.pop('school_zip',     '') or None
        school_city    = validated_data.pop('school_city',    '') or None
        school_phone   = validated_data.pop('school_phone',   '') or None
        school_website = validated_data.pop('school_website', '') or None
        director_name  = validated_data.pop('director_name',  '') or None
        uai_code       = validated_data.pop('uai_code',       '') or None
        siret          = validated_data.pop('siret',          '') or None

        user = User.objects.create_user(**validated_data)

        UserProfile.objects.create(
            user=user,
            rectorate_email=rectorate_email,
            subscription_plan=subscription_plan,
            school_eth_address=school_eth_address,
            rectorate_eth_address=rectorate_eth_address,
            gdpr_consent=gdpr_consent,
            gdpr_consent_date=timezone.now() if gdpr_consent else None,
            school_name=school_name,
            school_type=school_type,
            school_address=school_address,
            school_zip=school_zip,
            school_city=school_city,
            school_phone=school_phone,
            school_website=school_website,
            director_name=director_name,
            uai_code=uai_code,
            siret=siret,
        )
        return user


class DiplomaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    def _build_url(self, file_field):
        if not file_field:
            return None
        try:
            url = file_field.url
        except Exception:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_image_url(self, obj):
        return self._build_url(obj.image)

    def get_photo_url(self, obj):
        return self._build_url(obj.photo)

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
    school_name    = serializers.SerializerMethodField()
    image_url      = serializers.SerializerMethodField()
    photo_url      = serializers.SerializerMethodField()

    def get_school_name(self, obj):
        return obj.owner.username if obj.owner_id else None

    def _build_url(self, file_field):
        if not file_field:
            return None
        try:
            url = file_field.url
        except Exception:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_image_url(self, obj):
        return self._build_url(obj.image)

    def get_photo_url(self, obj):
        return self._build_url(obj.photo)

    class Meta:
        model = Diploma
        fields = [
            'id', 'first_name', 'last_name', 'course_name',
            'date_of_birth', 'graduation_date', 'expiry_date',
            'school_name', 'image_url', 'photo_url',
            'status', 'status_display', 'diploma_hash', 'blockchain_tx_hash',
            'blockchain_status', 'created_at', 'verification_uuid',
        ]
class QRPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRPreset
        fields = ['id', 'name', 'embed_qr', 'qr_x_pct', 'qr_y_pct', 'qr_size_pct']

