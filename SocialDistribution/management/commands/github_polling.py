from django.core.management.base import BaseCommand
from SocialDistribution.models import User, process_github_activity

class Command(BaseCommand):
    help = 'Fetch GitHub activity for users'

    def handle(self, *args, **options):
        users = User.objects.filter(github_username__isnull=False)
        for user in users:
            process_github_activity(user)