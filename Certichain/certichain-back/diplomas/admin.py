from django.contrib import admin
from .models import Diploma, SubscriptionPlan, UserProfile


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'name', 'annual_price', 'max_diplomas', 'level')
    ordering     = ('level',)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display  = ('user', 'rectorate_email', 'subscription_plan', 'subscription_start')
    list_filter   = ('subscription_plan',)
    search_fields = ('user__username', 'rectorate_email')


@admin.register(Diploma)
class DiplomaAdmin(admin.ModelAdmin):
    list_display  = ('last_name', 'first_name', 'course_name', 'graduation_date', 'owner', 'status')
    search_fields = ('last_name', 'first_name', 'course_name')
    list_filter   = ('status', 'graduation_date', 'created_at')