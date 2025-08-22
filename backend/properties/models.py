from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

# Create your models here.

class Property(models.Model):
    PROPERTY_TYPES = [
        ('house', 'Casa'),
        ('apartment', 'Apartamento'),
        ('office', 'Oficina'),
        ('land', 'Terreno'),
        ('commercial', 'Local Comercial'),
        ('warehouse', 'Bodega'),
    ]
    
    STATUS_CHOICES = [
        ('available', 'Disponible'),
        ('sold', 'Vendida'),
        ('rented', 'Arrendada'),
        ('reserved', 'Reservada'),
    ]
    
    # Información básica
    title = models.CharField(max_length=200, verbose_name='Título')
    description = models.TextField(verbose_name='Descripción')
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES, verbose_name='Tipo de Propiedad')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available', verbose_name='Estado')
    
    # Precios
    price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Precio')
    price_per_sqm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Precio por m²')
    
    # Características físicas
    bedrooms = models.PositiveIntegerField(default=0, verbose_name='Habitaciones')
    bathrooms = models.PositiveIntegerField(default=0, verbose_name='Baños')
    parking_spaces = models.PositiveIntegerField(default=0, verbose_name='Espacios de Parqueo')
    area_sqm = models.DecimalField(max_digits=8, decimal_places=2, verbose_name='Área (m²)')
    floor = models.PositiveIntegerField(null=True, blank=True, verbose_name='Piso')
    total_floors = models.PositiveIntegerField(null=True, blank=True, verbose_name='Total de Pisos')
    
    # Ubicación
    address = models.CharField(max_length=500, verbose_name='Dirección')
    neighborhood = models.CharField(max_length=100, verbose_name='Barrio')
    city = models.CharField(max_length=100, verbose_name='Ciudad')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, verbose_name='Latitud')
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, verbose_name='Longitud')
    
    # Características adicionales
    has_garden = models.BooleanField(default=False, verbose_name='Jardín')
    has_pool = models.BooleanField(default=False, verbose_name='Piscina')
    has_balcony = models.BooleanField(default=False, verbose_name='Balcón')
    has_elevator = models.BooleanField(default=False, verbose_name='Ascensor')
    is_furnished = models.BooleanField(default=False, verbose_name='Amueblado')
    
    # Información del agente
    agent = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Agente')
    
    # Fechas
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de Actualización')
    
    # SEO y visibilidad
    is_featured = models.BooleanField(default=False, verbose_name='Destacada')
    is_active = models.BooleanField(default=True, verbose_name='Activa')
    
    class Meta:
        verbose_name = 'Propiedad'
        verbose_name_plural = 'Propiedades'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.address}"
    
    def save(self, *args, **kwargs):
        # Calcular precio por m² automáticamente
        if self.price and self.area_sqm:
            self.price_per_sqm = self.price / self.area_sqm
        super().save(*args, **kwargs)


class PropertyImage(models.Model):
    property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE, verbose_name='Propiedad')
    image = models.ImageField(upload_to='properties/', verbose_name='Imagen')
    caption = models.CharField(max_length=200, blank=True, verbose_name='Descripción')
    is_primary = models.BooleanField(default=False, verbose_name='Imagen Principal')
    order = models.PositiveIntegerField(default=0, verbose_name='Orden')
    
    class Meta:
        verbose_name = 'Imagen de Propiedad'
        verbose_name_plural = 'Imágenes de Propiedades'
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"Imagen de {self.property.title}"


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Usuario')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, verbose_name='Propiedad')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    
    class Meta:
        verbose_name = 'Favorito'
        verbose_name_plural = 'Favoritos'
        unique_together = ['user', 'property']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.property.title}"


class Contact(models.Model):
    CONTACT_TYPES = [
        ('inquiry', 'Consulta'),
        ('visit', 'Solicitud de Visita'),
        ('offer', 'Oferta'),
        ('other', 'Otro'),
    ]
    
    property = models.ForeignKey(Property, on_delete=models.CASCADE, verbose_name='Propiedad')
    name = models.CharField(max_length=100, verbose_name='Nombre')
    email = models.EmailField(verbose_name='Email')
    phone = models.CharField(max_length=20, verbose_name='Teléfono')
    message = models.TextField(verbose_name='Mensaje')
    contact_type = models.CharField(max_length=20, choices=CONTACT_TYPES, default='inquiry', verbose_name='Tipo de Contacto')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    is_processed = models.BooleanField(default=False, verbose_name='Procesado')
    
    class Meta:
        verbose_name = 'Contacto'
        verbose_name_plural = 'Contactos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.property.title}"
