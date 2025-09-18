from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from database.models import Lote
from django.core.cache import cache
from django.db import connection
import time
from . import snapshot
import hashlib


@api_view(['GET'])
def lotes_estado(request):
    """
    Vista optimizada para obtener el estado de todos los lotes.
    Usa cache y consultas optimizadas para mejor rendimiento.
    """
    cache_key = 'lotes_estado_cache'
    
    # Intentar obtener del cache primero
    cached_data = cache.get(cache_key)
    if cached_data:
        # ETag basado en longitud (simple) o podríamos usar updated_at del snapshot
        etag = hashlib.md5(str(len(cached_data)).encode('utf-8')).hexdigest()
        resp = Response(cached_data)
        resp["Cache-Control"] = "public, max-age=86400"  # 24h en CDN/navegador
        resp["ETag"] = etag
        return resp
    
    try:
        start_time = time.time()
        
        # Consulta optimizada usando values() para obtener solo los campos necesarios
        # y select_related para evitar N+1 queries
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
        
        # Serialización optimizada
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
        
        # Guardar en cache por 5 minutos y persistir snapshot
        cache.set(cache_key, data, None)  # sin expiración; se invalida por tarea/cron
        try:
            snapshot.write_snapshot({
                "updated_at": time.time(),
                "version": 1,
                "data": data,
            })
        except Exception:
            # Evitar que un fallo al escribir snapshot rompa la respuesta
            pass
        
        end_time = time.time()
        print(f"✅ Lotes procesados en {end_time - start_time:.3f} segundos")
        print(f"📊 Total de lotes: {len(data)}")
        
        etag = hashlib.md5(str(len(data)).encode('utf-8')).hexdigest()
        resp = Response(data)
        resp["Cache-Control"] = "public, max-age=86400"  # 24h en CDN/navegador
        resp["ETag"] = etag
        return resp
        
    except Exception as e:
        print(f"❌ Error en lotes_estado: {str(e)}")
        # Fallback a snapshot persistido, si existe
        snap = snapshot.read_snapshot()
        if snap and isinstance(snap, dict) and "data" in snap:
            etag = hashlib.md5(str(len(snap["data"])).encode('utf-8')).hexdigest()
            resp = Response(snap["data"])  # 200 con datos en caché persistida
            resp["Cache-Control"] = "public, max-age=86400"  # 24h en CDN/navegador
            resp["ETag"] = etag
            return resp
        return Response(
            {"error": "Error interno del servidor"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Create your views here.
