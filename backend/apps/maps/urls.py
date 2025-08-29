from django.urls import path
from . import views

urlpatterns = [
    path('lotes/', views.lotes_estado, name='lotes_estado'),
    path('lotes/fast/', views.lotes_estado_fast, name='lotes_estado_fast'),
]
