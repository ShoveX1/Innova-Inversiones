from django.urls import path, include
from rest_framework.routers import DefaultRouter, SimpleRouter
from .views import PropertyViewSet, PropertyImageViewSet, FavoriteViewSet, ContactViewSet

# Router principal
router = DefaultRouter()
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'contacts', ContactViewSet, basename='contact')

# Router para imágenes de propiedades
property_router = SimpleRouter()
property_router.register(r'images', PropertyImageViewSet, basename='property-image')

urlpatterns = [
    # URLs principales
    path('api/', include(router.urls)),
    
    # URLs para imágenes de propiedades específicas
    path('api/properties/<int:property_pk>/', include(property_router.urls)),
]
