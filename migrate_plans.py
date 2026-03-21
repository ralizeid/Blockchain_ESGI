import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from diplomas.models import SubscriptionPlan, UserProfile

try:
    essentiel = SubscriptionPlan.objects.get(name='ESSENTIEL')
    campus = SubscriptionPlan.objects.get(name='CAMPUS')
    universite = SubscriptionPlan.objects.get(name='UNIVERSITE')

    for p in UserProfile.objects.filter(subscription_plan__name='STARTER'):
        p.subscription_plan = essentiel
        p.save()
    for p in UserProfile.objects.filter(subscription_plan__name='STANDARD'):
        p.subscription_plan = campus
        p.save()
    for p in UserProfile.objects.filter(subscription_plan__name='PREMIUM'):
        p.subscription_plan = universite
        p.save()

    print('Migrations done. Deleting...')
    deleted = SubscriptionPlan.objects.filter(name__in=['STARTER', 'STANDARD', 'PREMIUM']).delete()
    print('Deleted :} ', deleted)
except Exception as e:
    print('Error:', e)