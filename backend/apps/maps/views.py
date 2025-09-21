from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from database.models import Lote
import time
import psycopg2  # para detectar errores de conexión específicos


@api_view(['GET'])
def lotes_estado(request):
    """
    Devuelve el estado de todos los lotes directamente desde la base de datos.
    Sin cache ni snapshot para probar la DB.
    """

    attempts = 0
    max_attempts = 3
    delay = 0.2  # segundos entre reintentos

    while attempts < max_attempts:
        try:
            start_time = time.time()

            # Consulta optimizada
            lotes_data = Lote.objects.select_related('estado').values(
                'codigo', 
                'manzana',
                'lote_numero',
                'estado__id',
                'estado__nombre',
                'area_lote',
                'perimetro',
                'precio',
                'descripcion'
            )

            data = [
                {
                    "codigo": lote['codigo'].lower(),
                    "manzana": str(lote['manzana']),
                    "lote_numero": lote['lote_numero'],
                    "estado": str(lote['estado__id']),
                    "estado_nombre": lote['estado__nombre'],
                    "area_lote": float(lote['area_lote']),
                    "perimetro": float(lote['perimetro']),
                    "precio": float(lote['precio']) if lote['precio'] else None,
                    "descripcion": str(lote['descripcion']) if lote['descripcion'] else None
                }
                for lote in lotes_data
            ]

            # Responder directamente sin cache ni snapshot

            end_time = time.time()
            print(f"✅ Lotes procesados en {end_time - start_time:.3f} segundos")
            print(f"📊 Total de lotes: {len(data)}")

            return Response(data)

        except psycopg2.OperationalError as e:
            attempts += 1
            print(f"⚠️ Fallo de conexión (intento {attempts}/{max_attempts}): {e}")
            time.sleep(delay)
        except Exception as e:
            print(f"❌ Error inesperado en lotes_estado: {str(e)}")
            break

    # Si fallaron todos los intentos → error
    return Response(
        {"error": "Error interno del servidor"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
