from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from database.models import Lote
from django.core.cache import cache
from django.db import connection
import time


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
        return Response(cached_data)
    
    try:
        start_time = time.time()
        
        # Consulta optimizada usando values() para obtener solo los campos necesarios
        # y select_related para evitar N+1 queries
        lotes_data = Lote.objects.select_related('estado').values(
            'codigo', 
            'estado__id',
            'estado__nombre',
            'area_lote',
            'perimetro',
            'precio'
        )
        
        # Serialización optimizada
        data = [
            {
                "codigo": lote['codigo'].lower(),
                "estado": str(lote['estado__id']),
                "estado_nombre": lote['estado__nombre'],
                "area_lote": float(lote['area_lote']),
                "perimetro": float(lote['perimetro']),
                "precio": float(lote['precio']) if lote['precio'] else None
            }
            for lote in lotes_data
        ]
        
        # Guardar en cache por 5 minutos
        cache.set(cache_key, data, 300)
        
        end_time = time.time()
        print(f"✅ Lotes procesados en {end_time - start_time:.3f} segundos")
        print(f"📊 Total de lotes: {len(data)}")
        
        return Response(data)
        
    except Exception as e:
        print(f"❌ Error en lotes_estado: {str(e)}")
        return Response(
            {"error": "Error interno del servidor"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def lotes_estado_fast(request):
    """
    Versión ultra-rápida usando consulta SQL directa para casos críticos.
    """
    try:
        start_time = time.time()
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT l.codigo, l.estado_id, e.nombre as estado_nombre, 
                       l.area_lote, l.perimetro, l.precio
                FROM database_lote l
                JOIN database_estadolote e ON l.estado_id = e.id
                ORDER BY l.codigo
            """)
            
            data = [
                {
                    "codigo": row[0].lower(),
                    "estado": str(row[1]),
                    "estado_nombre": row[2],
                    "area_lote": float(row[3]),
                    "perimetro": float(row[4]),
                    "precio": float(row[5]) if row[5] else None
                }
                for row in cursor.fetchall()
            ]
        
        end_time = time.time()
        print(f"⚡ Lotes procesados (SQL directo) en {end_time - start_time:.3f} segundos")
        
        return Response(data)
        
    except Exception as e:
        print(f"❌ Error en lotes_estado_fast: {str(e)}")
        return Response(
            {"error": "Error interno del servidor"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Create your views here.
