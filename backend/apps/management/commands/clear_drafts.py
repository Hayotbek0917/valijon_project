from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.models import PosCartDraft

class Command(BaseCommand):
    help = 'Eski qoralama savatlarni o\'chiradi'

    def handle(self, *args, **kwargs):
        threshold = timezone.now() - timedelta(days=1)
        count, _ = PosCartDraft.objects.filter(updated_at__lt=threshold).delete()
        self.stdout.write(self.style.SUCCESS(f"{count} ta eski qoralama muvaffaqiyatli o'chirildi."))