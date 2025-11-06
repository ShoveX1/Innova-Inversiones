from database.models import Lote, Cliente, relacion_cliente_lote
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import ClienteSerializer, RelacionClienteLoteSerializer
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import Sum


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

    if not codigo:
        return Response({"error": "Debe enviar un código"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        lote = Lote.objects.get(codigo__iexact=codigo)
    except Lote.DoesNotExist:
        return Response({"error": "Lote no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": "Error al buscar el lote",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
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
    
    except ValueError as e:
        return Response({
            "error": "Error de formato en los datos",
            "detalle": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            "error": "Error al actualizar el lote",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================
# VISTAS PARA GESTIÓN DE CLIENTES
# =====================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def ListarClientes(request):
    """
    Vista para listar todos los clientes o buscar por filtros
    Parámetros opcionales:
    - search: Buscar por nombre, apellidos, dni, email, lote, manzana, lote_numero o tipo de relacion
    - estado: Filtrar por estado (true/false)
    """
    try:
        clientes = Cliente.objects.prefetch_related('compras__lote', 'compras__lote__estado')
        
        # Filtro de búsqueda
        search = request.query_params.get('search', None)
        if search:
            from django.db.models import Q
            clientes = clientes.filter(
                Q(nombre__icontains=search) |
                Q(apellidos__icontains=search) |
                Q(dni__icontains=search) |
                Q(email__icontains=search) |
                #lote
                Q(compras__lote__codigo__icontains=search) |
                Q(compras__lote__manzana__icontains=search) |
                Q(compras__lote__lote_numero__icontains=search) |
                #tipo de relacion cliente_lote
                Q(compras__tipo_relacion__icontains=search)
            ).distinct()
        
        # Filtro por estado
        estado_param = request.query_params.get('estado', None)
        if estado_param is not None:
            estado_bool = estado_param.lower() == 'true'
            clientes = clientes.filter(estado=estado_bool)
        
        # Ordenar por fecha de creación (más reciente primero)
        clientes = clientes.order_by('id')
        

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
        cliente = Cliente.objects.prefetch_related('compras__lote', 'compras__lote__estado').get(id=cliente_id)
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


# =====================================================
# VISTAS PARA GESTIÓN DE RELACIONES CLIENTE-LOTE
# =====================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def ListarLotes(request):
    """
    Vista para listar todos los lotes disponibles
    Parámetros opcionales:
    - search: Buscar por código, manzana o lote_numero
    """
    try:
        lotes = Lote.objects.select_related('estado').all()
        
        # Filtro de búsqueda
        search = request.query_params.get('search', None)
        if search:
            from django.db.models import Q
            lotes = lotes.filter(
                Q(codigo__icontains=search) |
                Q(manzana__icontains=search) |
                Q(lote_numero__icontains=search)
            )
        
        # Ordenar por código
        lotes = lotes.order_by('codigo')
        
        data = [
            {
                "id": lote.id,
                "codigo": lote.codigo,
                "manzana": lote.manzana,
                "lote_numero": lote.lote_numero,
                "estado": lote.estado.id,
                "estado_nombre": lote.estado.nombre,
                "area_lote": float(lote.area_lote),
                "perimetro": float(lote.perimetro),
                "precio": float(lote.precio) if lote.precio else None,
                "precio_metro_cuadrado": float(lote.precio_metro_cuadrado) if lote.precio_metro_cuadrado else None,
                "descripcion": lote.descripcion,
            }
            for lote in lotes
        ]
        
        return Response({
            "count": len(data),
            "lotes": data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": "Error al obtener la lista de lotes",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def AsignarLoteACliente(request):
    """
    Vista para asignar un lote a un cliente
    Campos requeridos: cliente (UUID), lote (ID), tipo_relacion
    Campos opcionales: porcentaje_participacion
    """
    try:
        # Log para debug
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Datos recibidos: {request.data}")
        
        serializer = RelacionClienteLoteSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"Errores del serializer: {serializer.errors}")
            return Response({
                "error": "Datos inválidos",
                "detalles": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener cliente y lote del serializer (PrimaryKeyRelatedField ya los resuelve como instancias)
        cliente = serializer.validated_data.get('cliente')
        lote = serializer.validated_data.get('lote')
        
        logger.info(f"Cliente obtenido del serializer: {cliente}, tipo: {type(cliente)}")
        logger.info(f"Lote obtenido del serializer: {lote}, tipo: {type(lote)}")
        
        # Verificar que cliente y lote son instancias válidas
        if not isinstance(cliente, Cliente):
            return Response({
                "error": f"Error: El cliente no es una instancia válida. Tipo recibido: {type(cliente)}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not isinstance(lote, Lote):
            return Response({
                "error": f"Error: El lote no es una instancia válida. Tipo recibido: {type(lote)}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si ya existe una relación entre este cliente y lote
        relacion_existente = relacion_cliente_lote.objects.filter(
            cliente=cliente,
            lote=lote
        ).first()
        
        if relacion_existente:
            return Response({
                "error": f"Ya existe una relación entre este cliente y el lote. Tipo actual: {relacion_existente.tipo_relacion}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar porcentaje de participación si es copropietario
        tipo_relacion = serializer.validated_data.get('tipo_relacion')
        porcentaje = serializer.validated_data.get('porcentaje_participacion')
        
        if tipo_relacion == 'copropietario' and porcentaje is not None:
            # Calcular el porcentaje total de participación de otros copropietarios
            porcentaje_total_existente = relacion_cliente_lote.objects.filter(
                lote=lote,
                tipo_relacion='copropietario'
            ).exclude(cliente=cliente).aggregate(
                total=Sum('porcentaje_participacion')
            )['total'] or 0
            
            porcentaje_total = float(porcentaje_total_existente) + float(porcentaje)
            
            if porcentaje_total > 100:
                return Response({
                    "error": f"El porcentaje total de participación excede el 100%. Porcentaje actual de otros copropietarios: {porcentaje_total_existente}%, intentando agregar: {porcentaje}%"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear la relación
        try:
            relacion = serializer.save()
            return Response({
                "message": "Lote asignado al cliente exitosamente",
                "relacion": RelacionClienteLoteSerializer(relacion).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                "error": f"Error al guardar la relación: {str(e)}",
                "tipo_error": type(e).__name__
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        import traceback
        return Response({
            "error": "Error al asignar el lote al cliente",
            "detalle": str(e),
            "tipo_error": type(e).__name__,
            "traceback": traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def ActualizarRelacionClienteLote(request, relacion_id):
    """
    Vista para actualizar una relación cliente-lote existente
    PUT: Actualización completa
    PATCH: Actualización parcial
    """
    try:
        relacion = relacion_cliente_lote.objects.get(id=relacion_id)
        
        # partial=True permite actualización parcial con PATCH
        partial = request.method == 'PATCH'
        serializer = RelacionClienteLoteSerializer(relacion, data=request.data, partial=partial)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Relación actualizada exitosamente",
                "relacion": serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            "error": "Datos inválidos",
            "detalles": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except relacion_cliente_lote.DoesNotExist:
        return Response({
            "error": "Relación no encontrada"
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            "error": "Error al actualizar la relación",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def EliminarRelacionClienteLote(request, relacion_id):
    """
    Vista para eliminar una relación cliente-lote
    """
    try:
        relacion = relacion_cliente_lote.objects.get(id=relacion_id)
        cliente_nombre = f"{relacion.cliente.nombre} {relacion.cliente.apellidos}"
        lote_codigo = relacion.lote.codigo
        
        relacion.delete()
        
        return Response({
            "message": f"Relación entre {cliente_nombre} y lote {lote_codigo} eliminada exitosamente"
        }, status=status.HTTP_200_OK)
        
    except relacion_cliente_lote.DoesNotExist:
        return Response({
            "error": "Relación no encontrada"
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            "error": "Error al eliminar la relación",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def ListarRelacionesClienteLote(request):
    """
    Vista para listar todas las relaciones cliente-lote
    Parámetros opcionales:
    - cliente_id: Filtrar por cliente específico
    - lote_id: Filtrar por lote específico
    - tipo_relacion: Filtrar por tipo de relación
    - codigo_lote: Buscar por código del lote
    - nombre_cliente: Buscar por nombre o apellidos del cliente
    - dni: Buscar por DNI del cliente (dato único)
    - estado_lote: Buscar por estado del lote (ID o nombre)
    """
    try:
        relaciones = relacion_cliente_lote.objects.select_related(
            'cliente', 'lote', 'lote__estado'
        ).all()
        
        # Filtro por cliente
        cliente_id = request.query_params.get('cliente_id', None)
        if cliente_id:
            relaciones = relaciones.filter(cliente_id=cliente_id)
        
        # Filtro por lote
        lote_id = request.query_params.get('lote_id', None)
        if lote_id:
            relaciones = relaciones.filter(lote_id=lote_id)
        
        # Filtro por tipo de relación
        tipo_relacion = request.query_params.get('tipo_relacion', None)
        if tipo_relacion:
            relaciones = relaciones.filter(tipo_relacion=tipo_relacion)
        
        # Búsqueda por código de lote
        codigo_lote = request.query_params.get('codigo_lote', None)
        if codigo_lote:
            relaciones = relaciones.filter(lote__codigo__icontains=codigo_lote)
        
        # Búsqueda por nombre de cliente (nombre o apellidos)
        nombre_cliente = request.query_params.get('nombre_cliente', None)
        if nombre_cliente:
            from django.db.models import Q
            relaciones = relaciones.filter(
                Q(cliente__nombre__icontains=nombre_cliente) |
                Q(cliente__apellidos__icontains=nombre_cliente)
            )
        
        # Búsqueda por DNI del cliente (dato único)
        dni = request.query_params.get('dni', None)
        if dni:
            relaciones = relaciones.filter(cliente__dni__icontains=dni)
        
        # Búsqueda por estado del lote (puede ser ID o nombre)
        estado_lote = request.query_params.get('estado_lote', None)
        if estado_lote:
            try:
                # Intentar primero como ID
                estado_id = int(estado_lote)
                relaciones = relaciones.filter(lote__estado__id=estado_id)
            except ValueError:
                # Si no es número, buscar por nombre
                relaciones = relaciones.filter(lote__estado__nombre__icontains=estado_lote)
        
        # Ordenar por fecha (más reciente primero)
        relaciones = relaciones.order_by('-fecha')
        
        serializer = RelacionClienteLoteSerializer(relaciones, many=True)
        
        return Response({
            "count": relaciones.count(),
            "relaciones": serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "error": "Error al obtener las relaciones",
            "detalle": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    