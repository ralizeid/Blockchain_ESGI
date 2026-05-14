from django.apps import AppConfig

PLANS_DATA = [
    dict(name='ESSENTIEL',  display_name='Essentiel',  annual_price='250.00',  max_diplomas=100,  level=1),
    dict(name='CAMPUS', display_name='Campus', annual_price='950.00', max_diplomas=500, level=2),
    dict(name='UNIVERSITE',  display_name='Université',  annual_price='2800.00', max_diplomas=2000,  level=3),
    dict(name='ACADEMIE',  display_name='Académie',  annual_price='5500.00', max_diplomas=5000,  level=4),
]
PACKS_DATA = [
    dict(name='Pack 50', diplomas_amount=50, price='90.00'),
    dict(name='Pack 100', diplomas_amount=100, price='150.00'),
    dict(name='Pack 500', diplomas_amount=500, price='650.00'),
    dict(name='Pack 1 000', diplomas_amount=1000, price='1100.00'),
    dict(name='Pack 5 000', diplomas_amount=5000, price='4500.00'),
]
class DiplomasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'diplomas'

    def ready(self):
        from django.db.models.signals import post_migrate
        post_migrate.connect(_seed_plans, sender=self)


def _seed_plans(sender, **kwargs):
    """CrÃ©e ou met Ã  jour les plans d'abonnement et les packs aprÃ¨s chaque migrate."""
    try:
        from diplomas.models import SubscriptionPlan, UserProfile, DiplomaPack
        for plan in PLANS_DATA:
            name = plan['name']
            SubscriptionPlan.objects.update_or_create(
                name=name,
                defaults={k: v for k, v in plan.items() if k != 'name'},
            )

        for pack in PACKS_DATA:
            name = pack['name']
            DiplomaPack.objects.update_or_create(
                name=name,
                defaults={k: v for k, v in pack.items() if k != 'name'},
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
