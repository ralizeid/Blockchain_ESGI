from django.apps import AppConfig

PLANS_DATA = [
    dict(name='ESSENTIEL',  display_name='Essentiel',  annual_price='250.00',  max_diplomas=100,  level=1),
    dict(name='CAMPUS', display_name='Campus', annual_price='950.00', max_diplomas=500, level=2),
    dict(name='UNIVERSITE',  display_name='Université',  annual_price='2800.00', max_diplomas=2000,  level=3),
    dict(name='ACADEMIE',  display_name='Académie',  annual_price='5500.00', max_diplomas=5000,  level=4),
]


class DiplomasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'diplomas'

    def ready(self):
        from django.db.models.signals import post_migrate
        post_migrate.connect(_seed_plans, sender=self)


def _seed_plans(sender, **kwargs):
    """Crée ou met à jour les plans d'abonnement après chaque migrate."""
    try:
        from diplomas.models import SubscriptionPlan, UserProfile
        for plan in PLANS_DATA:
            name = plan['name']
            SubscriptionPlan.objects.update_or_create(
                name=name,
                defaults={k: v for k, v in plan.items() if k != 'name'},
            )

        # Migration silencieuse des anciens comptes s'il en reste vers les nouveaux plans (sans print)
        try:
            essentiel = SubscriptionPlan.objects.get(name='ESSENTIEL')
            campus = SubscriptionPlan.objects.get(name='CAMPUS')
            universite = SubscriptionPlan.objects.get(name='UNIVERSITE')

            UserProfile.objects.filter(subscription_plan__name='STARTER').update(subscription_plan=essentiel)
            UserProfile.objects.filter(subscription_plan__name='STANDARD').update(subscription_plan=campus)
            UserProfile.objects.filter(subscription_plan__name='PREMIUM').update(subscription_plan=universite)

            # Suppression silencieuse des vieux abonnements qui ne sont plus utilisés
            SubscriptionPlan.objects.filter(name__in=['STARTER', 'STANDARD', 'PREMIUM']).delete()
        except Exception:
            pass

    except Exception:
        pass  # Table pas encore créée (première migration)
