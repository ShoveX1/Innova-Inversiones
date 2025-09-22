from django.db import models
from  django.conf import settings


class UserProfile(models.Model):
    class Role(models.TextChoices):
        GERENTE = 'gerente', 'Gerente'
        SUPERVISOR = 'supervisor', 'Supervisor'
        VENDEDOR = 'vendedor', 'Vendedor'
        CLIENTE = 'cliente', 'Cliente'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENTE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"perfil de {getattr(self.user, 'username', self.user_id)} ({self.role})"