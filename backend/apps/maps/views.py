from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from database.models import Lote



@api_view(['GET'])
def lotes_estado(request):
    data = []
    for lote in Lote.objects.all():
        data.append({
            "codigo": lote.codigo.lower(),
            "estado": str(lote.estado.id)
        })
    return Response(data)
    

# Create your views here.
