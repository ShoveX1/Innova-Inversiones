from django.urls import path
from .views import UserTokenObtainPairView, UserTokenRefreshView, MeView


urlpatterns = [
    path('login/', UserTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', UserTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
]
