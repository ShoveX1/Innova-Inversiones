from django.shortcuts import render
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile


class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        profile = getattr(user, 'profile', None)
        token['role'] = getattr(profile, 'role', UserProfile.Role.CLIENTE)
        token['username'] = getattr(user, 'username', '')
        token['email'] = getattr(user, 'email', '')
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        profile = getattr(user, 'profile', None)
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': getattr(profile, 'role', UserProfile.Role.CLIENTE)
        }
        return data

class UserTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer

class UserTokenRefreshView(TokenRefreshView):
    pass

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        profile = getattr(user, 'profile', None)
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': getattr(profile, 'role', UserProfile.Role.CLIENTE),
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })
        
        


# Create your views here.
