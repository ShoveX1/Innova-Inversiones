from django.core.management.base import BaseCommand
from apps.maps import snapshot


class Command(BaseCommand):
    help = "Refresca y guarda el snapshot de lotes para el mapa"

    def add_arguments(self, parser):
        parser.add_argument("--silent", action="store_true")

    def handle(self, *args, **options):
        payload = snapshot.refresh_snapshot()
        if not options.get("silent"):
            self.stdout.write(self.style.SUCCESS(f"Snapshot actualizado: {payload.get('updated_at')}"))


