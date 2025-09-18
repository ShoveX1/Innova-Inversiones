from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from database.models import Lote
from django.core.cache import cache
import time
from . import snapshot
import hashlib
import psycopg2  # para detectar errores de conexión específicos


@api_view(['GET'])
def lotes_estado(request):
    """
    Vista optimizada para obtener el estado de todos los lotes.
    Usa cache, snapshot y reintentos para reducir fallos por DB.
    """
    cache_key = 'lotes_estado_cache'
    
    # Intentar obtener del cache primero
    cached_data = cache.get(cache_key)
    if cached_data:
        etag = hashlib.md5(str(len(cached_data)).encode('utf-8')).hexdigest()
        resp = Response(cached_data)
        resp["Cache-Control"] = "public, max-age=86400"  # 24h
        resp["ETag"] = etag
        return resp

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

            # Cache y snapshot
            cache.set(cache_key, data, None)
            try:
                snapshot.write_snapshot({
                    "updated_at": time.time(),
                    "version": 1,
                    "data": data,
                })
            except Exception:
                pass

            end_time = time.time()
            print(f"✅ Lotes procesados en {end_time - start_time:.3f} segundos")
            print(f"📊 Total de lotes: {len(data)}")

            etag = hashlib.md5(str(len(data)).encode('utf-8')).hexdigest()
            resp = Response(data)
            resp["Cache-Control"] = "public, max-age=86400"
            resp["ETag"] = etag
            return resp

        except psycopg2.OperationalError as e:
            attempts += 1
            print(f"⚠️ Fallo de conexión (intento {attempts}/{max_attempts}): {e}")
            time.sleep(delay)
        except Exception as e:
            print(f"❌ Error inesperado en lotes_estado: {str(e)}")
            break

    # Si fallaron todos los intentos → usar snapshot o error
    snap = snapshot.read_snapshot()
    if snap and isinstance(snap, dict) and "data" in snap:
        etag = hashlib.md5(str(len(snap["data"])).encode('utf-8')).hexdigest()
        resp = Response(snap["data"])
        resp["Cache-Control"] = "public, max-age=86400"
        resp["ETag"] = etag
        return resp
    
    return Response(
        {"error": "Error interno del servidor"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
