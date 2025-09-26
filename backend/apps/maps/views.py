from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from database.models import Lote
import time
import psycopg2  # para detectar errores de conexión específicos
from apps.maps import snapshot as map_snapshot
from django.utils.dateparse import parse_datetime
from django.utils.http import http_date
from datetime import datetime, timezone

# Flag global para habilitar/deshabilitar lectura desde snapshot
USE_SNAPSHOT = False


@api_view(['GET'])
def lotes_estado(request):
    """
    Devuelve el estado de todos los lotes.
    Por ahora se lee directamente de la base de datos para tener datos al instante.
    En el futuro, el snapshot podrá reactivarse para reducir carga.
    """

    attempts = 0
    max_attempts = 3
    delay = 0.2  # segundos entre reintentos

    source = (request.query_params.get('source') or 'db').lower()

    # Intento de responder desde snapshot SOLO si está habilitado explícitamente
    if source != 'db' and USE_SNAPSHOT:
        payload = map_snapshot.read_snapshot()
        if payload and isinstance(payload, dict) and 'data' in payload:
            data = payload.get('data') or []

            # ETag débil basado en updated_at+version para validación condicional
            updated_at_str = str(payload.get('updated_at') or '')
            version = str(payload.get('version') or '')
            etag = f'W/"lotes-{version}-{updated_at_str}"'

            # Last-Modified a partir de updated_at si es parseable
            last_modified_http = None
            dt = parse_datetime(updated_at_str) if updated_at_str else None
            if isinstance(dt, datetime):
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                ts = int(dt.timestamp())
                last_modified_http = http_date(ts)

            # Comprobar validadores condicionales del cliente
            req_etag = request.META.get('HTTP_IF_NONE_MATCH') or request.headers.get('If-None-Match')
            req_ims = request.META.get('HTTP_IF_MODIFIED_SINCE') or request.headers.get('If-Modified-Since')

            if req_etag and req_etag == etag:
                resp = Response(status=status.HTTP_304_NOT_MODIFIED)
                resp['ETag'] = etag
                if last_modified_http:
                    resp['Last-Modified'] = last_modified_http
                resp['X-Data-Source'] = 'snapshot'
                return resp

            if req_ims and last_modified_http and req_ims == last_modified_http:
                resp = Response(status=status.HTTP_304_NOT_MODIFIED)
                resp['ETag'] = etag
                resp['Last-Modified'] = last_modified_http
                resp['X-Data-Source'] = 'snapshot'
                return resp

            resp = Response(data)
            resp['ETag'] = etag
            if last_modified_http:
                resp['Last-Modified'] = last_modified_http
            resp['Cache-Control'] = 'max-age=0, must-revalidate'
            resp['X-Data-Source'] = 'snapshot'
            return resp

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

            # Responder con datos crudos de la DB

            end_time = time.time()
            print(f"✅ Lotes procesados en {end_time - start_time:.3f} segundos")
            print(f"📊 Total de lotes: {len(data)}")

            resp = Response(data)
            resp['X-Data-Source'] = 'db'
            return resp

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
