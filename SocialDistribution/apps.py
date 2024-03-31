from django.apps import AppConfig
from django.db.models.signals import post_migrate
from django.dispatch import receiver


class SocialdistributionConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "SocialDistribution"
    def ready(self):
        post_migrate.connect(create_default_signup_settings, sender=self)


@receiver(post_migrate)
def create_default_signup_settings(sender, **kwargs):
    from .models import SignUpSettings
    if not SignUpSettings.objects.exists():
        SignUpSettings.objects.create()