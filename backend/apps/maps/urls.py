from django.urls import path
from . import views

urlpatterns = [
    path('lotes/', views.lotes_estado, name='lotes_estado'),
]
