from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Property, PropertyImage, Favorite, Contact
from .serializers import (
    PropertySerializer, PropertyListSerializer, PropertyCreateSerializer,
    PropertyImageSerializer, PropertyImageCreateSerializer,
    FavoriteSerializer, ContactSerializer
)


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.filter(is_active=True)
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['property_type', 'status', 'city', 'neighborhood', 'is_featured']
    search_fields = ['title', 'description', 'address', 'neighborhood', 'city']
    ordering_fields = ['price', 'area_sqm', 'bedrooms', 'bathrooms', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PropertyCreateSerializer
        elif self.action == 'list':
            return PropertyListSerializer
        return PropertySerializer
    
    def get_queryset(self):
        queryset = Property.objects.filter(is_active=True)
        
        # Filtros adicionales
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        min_area = self.request.query_params.get('min_area')
        max_area = self.request.query_params.get('max_area')
        bedrooms = self.request.query_params.get('bedrooms')
        bathrooms = self.request.query_params.get('bathrooms')
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if min_area:
            queryset = queryset.filter(area_sqm__gte=min_area)
        if max_area:
            queryset = queryset.filter(area_sqm__lte=max_area)
        if bedrooms:
            queryset = queryset.filter(bedrooms__gte=bedrooms)
        if bathrooms:
            queryset = queryset.filter(bathrooms__gte=bathrooms)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Obtener propiedades destacadas"""
        featured_properties = self.get_queryset().filter(is_featured=True)
        serializer = PropertyListSerializer(featured_properties, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Búsqueda avanzada de propiedades"""
        query = request.query_params.get('q', '')
        if query:
            queryset = self.get_queryset().filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(address__icontains=query) |
                Q(neighborhood__icontains=query) |
                Q(city__icontains=query)
            )
        else:
            queryset = self.get_queryset()
        
        serializer = PropertyListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_to_favorites(self, request, pk=None):
        """Agregar propiedad a favoritos"""
        property_obj = self.get_object()
        user = request.user
        
        if not user.is_authenticated:
            return Response(
                {'error': 'Debes estar autenticado para agregar favoritos'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        favorite, created = Favorite.objects.get_or_create(
            user=user,
            property=property_obj
        )
        
        if created:
            return Response(
                {'message': 'Propiedad agregada a favoritos'},
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {'message': 'La propiedad ya está en favoritos'},
                status=status.HTTP_200_OK
            )
    
    @action(detail=True, methods=['delete'])
    def remove_from_favorites(self, request, pk=None):
        """Remover propiedad de favoritos"""
        property_obj = self.get_object()
        user = request.user
        
        if not user.is_authenticated:
            return Response(
                {'error': 'Debes estar autenticado'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            favorite = Favorite.objects.get(user=user, property=property_obj)
            favorite.delete()
            return Response(
                {'message': 'Propiedad removida de favoritos'},
                status=status.HTTP_200_OK
            )
        except Favorite.DoesNotExist:
            return Response(
                {'error': 'La propiedad no está en favoritos'},
                status=status.HTTP_404_NOT_FOUND
            )


class PropertyImageViewSet(viewsets.ModelViewSet):
    queryset = PropertyImage.objects.all()
    serializer_class = PropertyImageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PropertyImageCreateSerializer
        return PropertyImageSerializer
    
    def get_queryset(self):
        property_id = self.kwargs.get('property_pk')
        if property_id:
            return PropertyImage.objects.filter(property_id=property_id)
        return PropertyImage.objects.all()
    
    def perform_create(self, serializer):
        property_id = self.kwargs.get('property_pk')
        serializer.save(property_id=property_id)


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save()
