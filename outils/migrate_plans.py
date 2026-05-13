from pathlib import Path
import os
import sys

import django


REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / 'Certichain' / 'certichain-back'

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from diplomas.models import SubscriptionPlan, UserProfile


try:
    essentiel = SubscriptionPlan.objects.get(name='ESSENTIEL')
    campus = SubscriptionPlan.objects.get(name='CAMPUS')
    universite = SubscriptionPlan.objects.get(name='UNIVERSITE')

    for profile in UserProfile.objects.filter(subscription_plan__name='STARTER'):
        profile.subscription_plan = essentiel
        profile.save()
    for profile in UserProfile.objects.filter(subscription_plan__name='STANDARD'):
        profile.subscription_plan = campus
        profile.save()
    for profile in UserProfile.objects.filter(subscription_plan__name='PREMIUM'):
        profile.subscription_plan = universite
        profile.save()

    print('Migrations done. Deleting...')
    deleted = SubscriptionPlan.objects.filter(name__in=['STARTER', 'STANDARD', 'PREMIUM']).delete()
    print('Deleted :} ', deleted)
except Exception as error:
    print('Error:', error)
