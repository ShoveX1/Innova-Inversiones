from database.models import Lote
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny


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

    raw_estado = request.data.get("input_estado")
    raw_area_lote = request.data.get("input_area_lote")
    raw_perimetro = request.data.get("input_perimetro")
    raw_precio = request.data.get("input_precio")
    raw_precio_metro_cuadrado = request.data.get("input_precio_metro_cuadrado")
    raw_descripcion = request.data.get("input_descripcion")

    if raw_estado is None:
        pass
    else:
        nuevo_estado_id = int(raw_estado)
        lote.estado_id = nuevo_estado_id

    if raw_area_lote is None:
        pass
    else:
        nuevo_area_lote = float(raw_area_lote)
        lote.area_lote = nuevo_area_lote

    if raw_perimetro is None:
        pass
    else:
        nuevo_perimetro = float(raw_perimetro)
        lote.perimetro = nuevo_perimetro

    if raw_precio is None:
        lote.precio = float(0)
    else:
        nuevo_precio = float(raw_precio)
        lote.precio = nuevo_precio  

    if raw_precio_metro_cuadrado is None:
        lote.precio_metro_cuadrado = float(0)
    else:
        nuevo_precio_metro_cuadrado = float(raw_precio_metro_cuadrado)
        lote.precio_metro_cuadrado = nuevo_precio_metro_cuadrado

    if raw_descripcion is None:
        lote.descripcion = None
    else:
        lote.descripcion = raw_descripcion

    # asignación correcta del FK
    lote.save(update_fields=["estado", "area_lote", "perimetro", "precio", "precio_metro_cuadrado", "descripcion", "actualizado_en"])

    return Response({"message": "Lote actualizado correctamente"}, status=status.HTTP_200_OK)