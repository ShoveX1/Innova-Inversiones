from django.contrib import admin
from .models import Property, PropertyImage, Favorite, Contact

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['title', 'property_type', 'price', 'bedrooms', 'bathrooms', 'area_sqm', 'city', 'status', 'is_featured', 'is_active']
    list_filter = ['property_type', 'status', 'city', 'is_featured', 'is_active', 'has_garden', 'has_pool', 'created_at']
    search_fields = ['title', 'description', 'address', 'neighborhood', 'city']
    list_editable = ['status', 'is_featured', 'is_active']
    readonly_fields = ['created_at', 'updated_at', 'price_per_sqm']
    fieldsets = (
        ('Información Básica', {
            'fields': ('title', 'description', 'property_type', 'status', 'agent')
        }),
        ('Precios', {
            'fields': ('price', 'price_per_sqm')
        }),
        ('Características Físicas', {
            'fields': ('bedrooms', 'bathrooms', 'parking_spaces', 'area_sqm', 'floor', 'total_floors')
        }),
        ('Ubicación', {
            'fields': ('address', 'neighborhood', 'city', 'latitude', 'longitude')
        }),
        ('Características Adicionales', {
            'fields': ('has_garden', 'has_pool', 'has_balcony', 'has_elevator', 'is_furnished'),
            'classes': ('collapse',)
        }),
        ('SEO y Visibilidad', {
            'fields': ('is_featured', 'is_active'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ['property', 'image', 'is_primary', 'order', 'caption']
    list_filter = ['is_primary', 'property__property_type']
    search_fields = ['property__title', 'caption']
    list_editable = ['is_primary', 'order']

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'property', 'created_at']
    list_filter = ['created_at', 'property__property_type']
    search_fields = ['user__username', 'property__title']
    readonly_fields = ['created_at']

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'property', 'contact_type', 'created_at', 'is_processed']
    list_filter = ['contact_type', 'is_processed', 'created_at', 'property__property_type']
    search_fields = ['name', 'email', 'message', 'property__title']
    list_editable = ['is_processed']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Información del Contacto', {
            'fields': ('name', 'email', 'phone', 'contact_type')
        }),
        ('Mensaje', {
            'fields': ('message',)
        }),
        ('Propiedad', {
            'fields': ('property',)
        }),
        ('Estado', {
            'fields': ('is_processed', 'created_at')
        }),
    )
