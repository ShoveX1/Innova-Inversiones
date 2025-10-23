from database.models import Lote, Cliente
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import ClienteSerializer
from django.core.exceptions import ValidationError
from django.db import IntegrityError


@api_view(['GET'])
def Admin_view_lote_codigo(request):
    """
    Vista para obtener un solo lote por código seleccionado (?codigo=XYZ)
    """
    codigo = request.query_params.get("codigo")

    if not codigo:
        return Response({"error": "Debe enviar un código"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        lote = Lote.objects.get(codigo__iexact=codigo)
    except Lote.DoesNotExist:
        return Response({"error": "Lote no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    data = {
        "codigo": lote.codigo.lower(),
        "estado": int(lote.estado.id),
        "area_lote": float(lote.area_lote),
        "perimetro": float(lote.perimetro),
        "precio": float(lote.precio) if lote.precio is not None else None,
        "precio_metro_cuadrado": float(lote.precio_metro_cuadrado) if lote.precio_metro_cuadrado is not None else None,
        "descripcion": lote.descripcion,
        "actualizado_en": lote.actualizado_en,
    }
    return Response(data, status=status.HTTP_200_OK)


    
@api_view(['PUT'])
@permission_classes([AllowAny])
def AdminUpdateLote(request):
    codigo = request.query_params.get("codigo") or request.data.get("codigo")

    lote = Lote.objects.get(codigo__iexact=codigo)

    # Solo actualizar campos presentes en el request; si falta la clave, no tocar el valor existente
    if "input_estado" in request.data:
        raw_estado = request.data.get("input_estado")
        lote.estado_id = int(raw_estado)

    if "input_area_lote" in request.data:
        raw_area_lote = request.data.get("input_area_lote")
        lote.area_lote = float(raw_area_lote)

    if "input_perimetro" in request.data:
        raw_perimetro = request.data.get("input_perimetro")
        lote.perimetro = float(raw_perimetro)

    if "input_precio" in request.data:
        raw_precio = request.data.get("input_precio")
        # Si viene vacío o null explicitamente, interpretarlo como 0; de lo contrario castear a float
        lote.precio = float(0) if raw_precio in (None, "") else float(raw_precio)

    if "input_precio_metro_cuadrado" in request.data:
        raw_precio_metro_cuadrado = request.data.get("input_precio_metro_cuadrado")
        lote.precio_metro_cuadrado = float(0) if raw_precio_metro_cuadrado in (None, "") else float(raw_precio_metro_cuadrado)

    if "input_descripcion" in request.data:
        raw_descripcion = request.data.get("input_descripcion")
        # Permitir limpiar la descripción con null o string vacío
        lote.descripcion = None if raw_descripcion in (None, "") else raw_descripcion

    # Guardar cambios
    lote.save()

    return Response({"message": "Lote actualizado correctamente"}, status=status.HTTP_200_OK)


# =====================================================
# VISTAS PARA GESTIÓN DE CLIENTES
# =====================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def ListarClientes(request):
    """
    Vista para listar todos los clientes o buscar por filtros
    Parámetros opcionales:
    - search: Buscar por nombre, apellidos, dni o email
    - estado: Filtrar por estado (true/false)
    """
    try:
        clientes = Cliente.objects.all()
        
        # Filtro de búsqueda
        search = request.query_params.get('search', None)
        if search:
            from django.db.models import Q
            clientes = clientes.filter(
                Q(nombre__icontains=search) |
                Q(apellidos__icontains=search) |
                Q(dni__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Filtro por estado
        estado_param = request.query_params.get('estado', None)
        if estado_param is not None:
            estado_bool = estado_param.lower() == 'true'
            clientes = clientes.filter(estado=estado_bool)
        
        # Ordenar por fecha de creación (más reciente primero)
        clientes = clientes.order_by('-creado_en')
        
        serializer = ClienteSerializer(clientes, many=True)
        return Response({
            "count": clientes.count(),
            "clientes": serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": "Error al obtener la lista de clientes",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def ObtenerCliente(request, cliente_id):
    """
    Vista para obtener un cliente específico por su ID
    """
    try:
        cliente = Cliente.objects.get(id=cliente_id)
        serializer = ClienteSerializer(cliente)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Cliente.DoesNotExist:
        return Response({
            "error": "Cliente no encontrado"
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            "error": "Error al obtener el cliente",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def CrearCliente(request):
    """
    Vista para crear un nuevo cliente
    Campos requeridos: nombre, apellidos
    Campos opcionales: dni, direccion, telefono, email, fecha_nacimiento, estado
    """
    try:
        serializer = ClienteSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Cliente creado exitosamente",
                "cliente": serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            "error": "Datos inválidos",
            "detalles": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except IntegrityError as e:
        error_msg = str(e)
        if 'dni' in error_msg:
            return Response({
                "error": "Ya existe un cliente con este DNI"
            }, status=status.HTTP_400_BAD_REQUEST)
        elif 'email' in error_msg:
            return Response({
                "error": "Ya existe un cliente con este email"
            }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                "error": "Error de integridad en los datos",
                "detalle": error_msg
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            "error": "Error al crear el cliente",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def ActualizarCliente(request, cliente_id):
    """
    Vista para actualizar un cliente existente
    PUT: Actualización completa
    PATCH: Actualización parcial
    """
    try:
        cliente = Cliente.objects.get(id=cliente_id)
        
        # partial=True permite actualización parcial con PATCH
        partial = request.method == 'PATCH'
        serializer = ClienteSerializer(cliente, data=request.data, partial=partial)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Cliente actualizado exitosamente",
                "cliente": serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            "error": "Datos inválidos",
            "detalles": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Cliente.DoesNotExist:
        return Response({
            "error": "Cliente no encontrado"
        }, status=status.HTTP_404_NOT_FOUND)
        
    except IntegrityError as e:
        error_msg = str(e)
        if 'dni' in error_msg:
            return Response({
                "error": "Ya existe otro cliente con este DNI"
            }, status=status.HTTP_400_BAD_REQUEST)
        elif 'email' in error_msg:
            return Response({
                "error": "Ya existe otro cliente con este email"
            }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                "error": "Error de integridad en los datos",
                "detalle": error_msg
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            "error": "Error al actualizar el cliente",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def EliminarCliente(request, cliente_id):
    """
    Vista para eliminar (desactivar) un cliente
    Por defecto hace un soft delete (cambia estado a False)
    Si se envía ?hard=true, hace eliminación física
    """
    try:
        cliente = Cliente.objects.get(id=cliente_id)
        
        # Verificar si se requiere eliminación física
        hard_delete = request.query_params.get('hard', 'false').lower() == 'true'
        
        if hard_delete:
            # Eliminación física (permanente)
            nombre_completo = f"{cliente.nombre} {cliente.apellidos}"
            cliente.delete()
            return Response({
                "message": f"Cliente '{nombre_completo}' eliminado permanentemente"
            }, status=status.HTTP_200_OK)
        else:
            # Soft delete (desactivar)
            cliente.estado = False
            cliente.save()
            return Response({
                "message": "Cliente desactivado exitosamente",
                "cliente": ClienteSerializer(cliente).data
            }, status=status.HTTP_200_OK)
        
    except Cliente.DoesNotExist:
        return Response({
            "error": "Cliente no encontrado"
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            "error": "Error al eliminar el cliente",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def ActivarCliente(request, cliente_id):
    """
    Vista para reactivar un cliente desactivado
    """
    try:
        cliente = Cliente.objects.get(id=cliente_id)
        
        if cliente.estado:
            return Response({
                "message": "El cliente ya está activo"
            }, status=status.HTTP_200_OK)
        
        cliente.estado = True
        cliente.save()
        
        return Response({
            "message": "Cliente activado exitosamente",
            "cliente": ClienteSerializer(cliente).data
        }, status=status.HTTP_200_OK)
        
    except Cliente.DoesNotExist:
        return Response({
            "error": "Cliente no encontrado"
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            "error": "Error al activar el cliente",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    