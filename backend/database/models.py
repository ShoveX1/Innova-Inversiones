from django.db import models
from django.contrib.auth.models import User
import uuid

# ==============================
# TABLAS DE CATÁLOGO
# ==============================
class RolUsuario(models.Model):
    nombre = models.CharField(max_length=20, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class EstadoLote(models.Model):
    nombre = models.CharField(max_length=20, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class TipoSolicitud(models.Model):
    nombre = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.nombre


# ==============================
# TABLAS PRINCIPALES
# ==============================
class Usuario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='usuario', null=True, blank=True)
    rol = models.ForeignKey(RolUsuario, on_delete=models.PROTECT)
    estado = models.BooleanField(default=True)  # activo/inactivo
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_conexion = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.user.username


class Lote(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    manzana = models.CharField(max_length=5)
    lote_numero = models.CharField(max_length=10)
    perimetro = models.DecimalField(max_digits=20, decimal_places=2)
    area_lote = models.DecimalField(max_digits=20, decimal_places=2)
    precio = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    precio_metro_cuadrado = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    estado = models.ForeignKey(EstadoLote, on_delete=models.PROTECT, default=1)
    descripcion = models.TextField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.codigo} - {self.manzana}/{self.lote_numero}"



class Solicitud(models.Model):
    mensaje = models.TextField()
    tipo_solicitud = models.ForeignKey(TipoSolicitud, on_delete=models.PROTECT)
    lote = models.ForeignKey(Lote, on_delete=models.SET_NULL, null=True, blank=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Solicitud #{self.id} - {self.tipo_solicitud.nombre}"


class Transaccion(models.Model):
    class Tipo(models.TextChoices):
        RESERVA = "RESERVA", "Reserva"
        VENTA = "VENTA", "Venta"

    tipo = models.CharField(max_length=8, choices=Tipo.choices)
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo} - {self.lote.codigo}"


class HistorialEstado(models.Model):
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)
    estado_anterior = models.ForeignKey(EstadoLote, on_delete=models.PROTECT, related_name="estado_anterior")
    estado_nuevo = models.ForeignKey(EstadoLote, on_delete=models.PROTECT, related_name="estado_nuevo")
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lote.codigo} -> {self.estado_nuevo.nombre}"

