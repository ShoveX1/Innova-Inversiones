from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


urlpatterns = [
    # URLs para Lotes
    path('lotes/', views.Admin_view_lote_codigo, name='admin-view-lote-codigo'),
    path('lotes/update/', views.AdminUpdateLote, name='admin-update-lote'),
    path('lotes/listar/', views.ListarLotes, name='listar-lotes'),
    
    # URLs para Clientes
    path('clientes/listar/', views.ListarClientes, name='listar-clientes'),
    path('clientes/crear/', views.CrearCliente, name='crear-cliente'),
    path('clientes/obtener/<uuid:cliente_id>/', views.ObtenerCliente, name='obtener-cliente'),
    path('clientes/actualizar/<uuid:cliente_id>/', views.ActualizarCliente, name='actualizar-cliente'),
    path('clientes/eliminar/<uuid:cliente_id>/', views.EliminarCliente, name='eliminar-cliente'),
    path('clientes/activar/<uuid:cliente_id>/', views.ActivarCliente, name='activar-cliente'),
    
    # URLs para Relaciones Cliente-Lote
    path('cliente-lote/listar/', views.ListarRelacionesClienteLote, name='listar-relaciones'),
    path('cliente-lote/asignar/', views.AsignarLoteACliente, name='asignar-lote-cliente'),
    path('cliente-lote/actualizar/<uuid:relacion_id>/', views.ActualizarRelacionClienteLote, name='actualizar-relacion'),
    path('cliente-lote/eliminar/<uuid:relacion_id>/', views.EliminarRelacionClienteLote, name='eliminar-relacion'),
]


