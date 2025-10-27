from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


urlpatterns = [
    # URLs para Lotes
    path('lotes/', views.Admin_view_lote_codigo, name='admin-view-lote-codigo'),
    path('lotes/update/', views.AdminUpdateLote, name='admin-update-lote'),
    
    # URLs para Clientes
    path('clientes/', views.ListarClientes, name='listar-clientes'),
    path('clientes/crear/', views.CrearCliente, name='crear-cliente'),
    path('clientes/<uuid:cliente_id>/', views.ObtenerCliente, name='obtener-cliente'),
    path('clientes/<uuid:cliente_id>/actualizar/', views.ActualizarCliente, name='actualizar-cliente'),
    path('clientes/<uuid:cliente_id>/eliminar/', views.EliminarCliente, name='eliminar-cliente'),
    path('clientes/<uuid:cliente_id>/activar/', views.ActivarCliente, name='activar-cliente'),
]


