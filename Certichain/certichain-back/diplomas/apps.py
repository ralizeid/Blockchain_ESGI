from django.apps import AppConfig

PLANS_DATA = [
    dict(name='STARTER',  display_name='Starter',  annual_price='99.00',  max_diplomas=20,  level=1),
    dict(name='STANDARD', display_name='Standard', annual_price='299.00', max_diplomas=100, level=2),
    dict(name='PREMIUM',  display_name='Premium',  annual_price='999.00', max_diplomas=-1,  level=3),
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
        from diplomas.models import SubscriptionPlan
        for plan in PLANS_DATA:
            name = plan['name']
            SubscriptionPlan.objects.update_or_create(
                name=name,
                defaults={k: v for k, v in plan.items() if k != 'name'},
            )
    except Exception:
        pass  # Table pas encore créée (première migration)
