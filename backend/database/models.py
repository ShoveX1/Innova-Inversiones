from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import uuid

# ==============================
# TABLAS DE CATÁLOGO
# ==============================
class Rol_Usuario(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=20, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class Estado_Lote(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=20, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class TipoSolicitud(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.nombre


# ==============================
# TABLAS PRINCIPALES
# ==============================
class Usuario_Perfil(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='usuario', null=True, blank=True)
    rol = models.ForeignKey(Rol_Usuario, on_delete=models.PROTECT)
    estado = models.BooleanField(default=True)  # activo/inactivo
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_conexion = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.user.username


class Cliente(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100)
    apellidos=models.CharField(max_length=100)
    dni=models.CharField(max_length=8, unique=True, null=True, blank=True)
    direccion=models.CharField(max_length=100, null=True, blank=True)
    telefono=models.CharField(max_length=12, null=True, blank=True,)
    email=models.EmailField(max_length=254, unique=True, null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    estado = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} {self.apellidos}"



class Lote(models.Model):
    id = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=20, unique=True)
    manzana = models.CharField(max_length=5)
    lote_numero = models.CharField(max_length=10)
    perimetro = models.DecimalField(max_digits=20, decimal_places=2)
    area_lote = models.DecimalField(max_digits=20, decimal_places=2)
    precio = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    precio_metro_cuadrado = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    estado = models.ForeignKey(Estado_Lote, on_delete=models.PROTECT, default=1)
    descripcion = models.TextField(null=True, blank=True)
    relacion_cliente_lote = models.ManyToManyField("Cliente", through="relacion_cliente_lote", related_name="lotes", blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.codigo} - {self.manzana}/{self.lote_numero}"



class relacion_cliente_lote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="compras", related_query_name="compra")
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE, related_name="compras", related_query_name="compra")
    fecha = models.DateTimeField(auto_now_add=True)
    tipo_relacion = models.CharField(
        max_length=20,
        choices=[
            ("Propietario", "Propietario"),
            ("reservante", "Reservante"),
            ("copropietario", "Copropietario"),
            ("declinado", "Declinado"),
        ]
    )
    porcentaje_participacion = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
       
    def __str__(self):
        return f"{self.cliente.nombre} - {self.lote.codigo}"


class Solicitud(models.Model):
    id = models.AutoField(primary_key=True)
    mensaje = models.TextField()
    tipo_solicitud = models.ForeignKey(TipoSolicitud, on_delete=models.PROTECT)
    lote = models.ForeignKey(Lote, on_delete=models.SET_NULL, null=True, blank=True)
    usuario = models.ForeignKey(Usuario_Perfil, on_delete=models.CASCADE, null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Solicitud #{self.id} - {self.tipo_solicitud.nombre}"




class Credito(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)
    monto_base = models.DecimalField(max_digits=12, decimal_places=2)
    interes = models.PositiveIntegerField(default=0)
    monto_total = models.DecimalField(max_digits=12, decimal_places=2)
    num_cuotas_totales = models.PositiveIntegerField()
    num_cuotas_pagadas = models.PositiveIntegerField(default=0)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField(null=True, blank=True) 
    class EstadoCredito(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        EN_PROCESO = "en_proceso", "En Proceso"
        CANCELADO = "cancelado", "Cancelado"
    estado_credito = models.CharField(max_length=20, choices=EstadoCredito.choices)
    
    # Relación inversa para acceder a las transacciones
    @property
    def transacciones(self):
        return Transaccion.objects.filter(credito=self)

    def __str__(self):
        return f"{self.cliente.nombre} - {self.lote.codigo}"
    
    def contar_cuotas_pagadas(self):
        """Cuenta las transacciones de tipo CUOTA registradas para este crédito"""
        return self.transacciones.filter(tipo=Transaccion.Tipo.CUOTA).count()
    
    def actualizar_cuotas_pagadas(self):
        """Actualiza el contador de cuotas pagadas basado en las transacciones reales"""
        self.num_cuotas_pagadas = self.contar_cuotas_pagadas()
    
    @property
    def cuotas_restantes(self):
        """Calcula cuántas cuotas faltan por pagar"""
        return self.num_cuotas_totales - self.num_cuotas_pagadas
    
    @property
    def credito_completado(self):
        """Verifica si el crédito está completamente pagado"""
        return self.num_cuotas_pagadas >= self.num_cuotas_totales
    
    @property
    def porcentaje_pagado(self):
        """Calcula el porcentaje de cuotas pagadas"""
        if self.num_cuotas_totales == 0:
            return 0
        return round((self.num_cuotas_pagadas / self.num_cuotas_totales) * 100, 2)
    
    def save(self, *args, **kwargs):
        self.monto_total = round(self.monto_base +(self.monto_base * self.interes /100),2)
        # Actualizar el contador de cuotas pagadas antes de guardar
        self.actualizar_cuotas_pagadas()
        super().save(*args, **kwargs)


class Transaccion(models.Model):
    id = models.AutoField(primary_key=True)
    credito = models.ForeignKey(Credito, on_delete=models.CASCADE, null=True, blank=True)
    class Tipo(models.TextChoices):
        RESERVA = "RESERVA", "Reserva"
        VENTA = "VENTA", "Venta"
        CUOTA = "CUOTA", "Cuota"
        AMORTIZACION = "AMORTIZACION", "Amortización"
    tipo = models.CharField(max_length=12, choices=Tipo.choices, null=True, blank=True)
    monto = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    metodo_pago = models.CharField(
        max_length=20,
        choices=[
            ("efectivo", "Efectivo"),
            ("transferencia", "Transferencia"),
            ("tarjeta_debito", "Tarjeta Debito"),
            ("tarjeta_credito", "Tarjeta Credito"),
        ],
        null=True, blank=True
    )
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"{self.tipo} - {self.lote.codigo}"



class Historial_Estado(models.Model):
    id = models.AutoField(primary_key=True)
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)
    estado_anterior = models.ForeignKey(Estado_Lote, on_delete=models.PROTECT, related_name="estado_anterior")
    estado_nuevo = models.ForeignKey(Estado_Lote, on_delete=models.PROTECT, related_name="estado_nuevo")
    usuario = models.ForeignKey(Usuario_Perfil, on_delete=models.CASCADE)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lote.codigo} -> {self.estado_nuevo.nombre}"

