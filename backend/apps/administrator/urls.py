from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


urlpatterns = [
    path('lotes/', views.Admin_view_lote_codigo, name='admin-view-lote-codigo'),
    path('lotes/update/', views.AdminUpdateLote, name='admin-update-lote'),
]


