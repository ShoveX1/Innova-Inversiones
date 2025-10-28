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