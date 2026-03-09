from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Diploma, UserProfile, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'display_name', 'annual_price', 'max_diplomas', 'level']


class UserSerializer(serializers.ModelSerializer):
    rectorate_email   = serializers.EmailField(write_only=True, required=True)
    subscription_plan = serializers.CharField(write_only=True, required=True)  # e.g. 'STARTER'

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'rectorate_email', 'subscription_plan']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_subscription_plan(self, value):
        try:
            return SubscriptionPlan.objects.get(name=value.upper())
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError(f"Plan inconnu : {value}. Choisissez parmi STARTER, STANDARD, PREMIUM.")

    def create(self, validated_data):
        rectorate_email   = validated_data.pop('rectorate_email')
        subscription_plan = validated_data.pop('subscription_plan')  # already a SubscriptionPlan instance

        user = User.objects.create_user(**validated_data)

        UserProfile.objects.create(
            user=user,
            rectorate_email=rectorate_email,
            subscription_plan=subscription_plan,
        )
        return user

class DiplomaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Diploma
        fields = '__all__'
        read_only_fields = ['owner', 'status', 'school_validated', 'rectorate_validated', 'school_token', 'rectorate_token']