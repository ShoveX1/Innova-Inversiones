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
    if not codigo:
        return Response({"error": "Debe enviar un código"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        lote = Lote.objects.get(codigo__iexact=codigo)
    except Lote.DoesNotExist:
        return Response({"error": "Lote no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    raw = request.data.get("input_estado")
    if raw is None:
        return Response({"error": "input_estado requerido"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        nuevo_estado_id = int(raw)
    except (TypeError, ValueError):
        return Response({"error": "input_estado inválido"}, status=status.HTTP_400_BAD_REQUEST)

    if lote.estado_id == nuevo_estado_id:
        return Response({"message": "Sin cambios (mismo estado)"}, status=status.HTTP_200_OK)

    # asignación correcta del FK
    lote.estado_id = nuevo_estado_id
    lote.save(update_fields=["estado", "actualizado_en"])

    return Response({"message": "Lote actualizado correctamente"}, status=status.HTTP_200_OK)