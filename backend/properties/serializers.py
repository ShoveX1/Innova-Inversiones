from rest_framework import serializers
from .models import Property, PropertyImage, Favorite, Contact
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'caption', 'is_primary', 'order']


class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    agent = UserSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'property_type', 'status',
            'price', 'price_per_sqm', 'bedrooms', 'bathrooms', 
            'parking_spaces', 'area_sqm', 'floor', 'total_floors',
            'address', 'neighborhood', 'city', 'latitude', 'longitude',
            'has_garden', 'has_pool', 'has_balcony', 'has_elevator', 
            'is_furnished', 'agent', 'images', 'primary_image',
            'is_featured', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['price_per_sqm', 'created_at', 'updated_at']
    
    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return PropertyImageSerializer(primary_image).data
        return None


class PropertyListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    agent_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'property_type', 'status', 'price', 
            'price_per_sqm', 'bedrooms', 'bathrooms', 'area_sqm',
            'address', 'neighborhood', 'city', 'latitude', 'longitude',
            'primary_image', 'agent_name', 'is_featured', 'created_at'
        ]
    
    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return {
                'id': primary_image.id,
                'image': primary_image.image.url,
                'caption': primary_image.caption
            }
        return None
    
    def get_agent_name(self, obj):
        return f"{obj.agent.first_name} {obj.agent.last_name}".strip() or obj.agent.username


class PropertyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            'title', 'description', 'property_type', 'status',
            'price', 'bedrooms', 'bathrooms', 'parking_spaces', 
            'area_sqm', 'floor', 'total_floors', 'address', 
            'neighborhood', 'city', 'latitude', 'longitude',
            'has_garden', 'has_pool', 'has_balcony', 'has_elevator', 
            'is_furnished', 'is_featured', 'is_active'
        ]
    
    def create(self, validated_data):
        # Asignar el usuario actual como agente
        validated_data['agent'] = self.context['request'].user
        return super().create(validated_data)


class PropertyImageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['image', 'caption', 'is_primary', 'order']
    
    def create(self, validated_data):
        property_id = self.context.get('property_id')
        validated_data['property_id'] = property_id
        return super().create(validated_data)


class FavoriteSerializer(serializers.ModelSerializer):
    property = PropertyListSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'property', 'created_at']
        read_only_fields = ['created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ContactSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True)
    
    class Meta:
        model = Contact
        fields = [
            'id', 'property', 'property_title', 'name', 'email', 
            'phone', 'message', 'contact_type', 'created_at', 'is_processed'
        ]
        read_only_fields = ['created_at', 'is_processed']
    
    def create(self, validated_data):
        return super().create(validated_data)
