# 💻 Ejemplos de Código Explicados

Este documento contiene ejemplos prácticos del código del proyecto con explicaciones detalladas para principiantes.

---

## 🔵 Backend (Python/Django)

### Ejemplo 1: Modelo de Lote

```python
# backend/database/models.py

class Lote(models.Model):
    # Campo de ID automático (Django lo crea solo)
    id = models.AutoField(primary_key=True)
    
    # Código único del lote (ej: "A1-001")
    codigo = models.CharField(max_length=20, unique=True)
    
    # Manzana del lote (ej: "A1")
    manzana = models.CharField(max_length=5)
    
    # Número del lote (ej: "001")
    lote_numero = models.CharField(max_length=10)
    
    # Área en metros cuadrados (decimal con 2 decimales)
    area_lote = models.DecimalField(max_digits=20, decimal_places=2)
    
    # Precio del lote (puede ser null/vacío)
    precio = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Estado del lote (relación con otra tabla)
    estado = models.ForeignKey(Estado_Lote, on_delete=models.PROTECT, default=1)
    
    # Fecha de creación (se llena automáticamente)
    creado_en = models.DateTimeField(auto_now_add=True)
    
    # Fecha de actualización (se actualiza automáticamente)
    actualizado_en = models.DateTimeField(auto_now=True)
```

**¿Qué hace esto?**
- Define la estructura de la tabla `Lote` en la base de datos PostgreSQL
- Cada campo representa una columna en la tabla
- `ForeignKey` crea una relación con otra tabla (Estado_Lote)
- `auto_now_add` y `auto_now` son campos que Django llena automáticamente

---

### Ejemplo 2: Vista API para Obtener Lotes

```python
# backend/apps/maps/views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from database.models import Lote

@api_view(['GET'])  # Esta función solo acepta peticiones GET
def lotes_estado(request):
    """
    Devuelve el estado de todos los lotes desde la base de datos PostgreSQL.
    """
    # Consulta a PostgreSQL: obtener todos los lotes
    lotes_data = Lote.objects.select_related('estado').values(
        'codigo', 
        'manzana',
        'lote_numero',
        'estado__id',        # __id accede al ID del estado relacionado
        'estado__nombre',    # __nombre accede al nombre del estado
        'area_lote',
        'precio'
    )
    
    # Convertir los datos a una lista de diccionarios
    data = [
        {
            "codigo": lote['codigo'].lower(),  # Convertir a minúsculas
            "manzana": str(lote['manzana']),
            "estado": str(lote['estado__id']),
            "estado_nombre": lote['estado__nombre'],
            "area_lote": float(lote['area_lote']),
            "precio": float(lote['precio']) if lote['precio'] else None
        }
        for lote in lotes_data  # List comprehension: crea lista iterando
    ]
    
    # Devolver los datos como JSON
    return Response(data)
```

**¿Qué hace esto?**
1. Recibe una petición GET del frontend
2. Consulta todos los lotes de PostgreSQL
3. Formatea los datos en un formato JSON
4. Devuelve la respuesta al frontend

**Flujo:**
```
Frontend → GET /api/maps/lotes/ → Backend (Render) → PostgreSQL → JSON → Frontend
```

---

### Ejemplo 3: Vista API para Actualizar un Lote

```python
# backend/apps/administrator/views.py

@api_view(['PUT'])  # Solo acepta peticiones PUT (actualizar)
@permission_classes([AllowAny])  # Permite acceso sin autenticación
def AdminUpdateLote(request):
    # Obtener el código del lote desde los parámetros o el body
    codigo = request.query_params.get("codigo") or request.data.get("codigo")
    
    if not codigo:
        # Si no hay código, devolver error
        return Response(
            {"error": "Debe enviar un código"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Buscar el lote en PostgreSQL
        lote = Lote.objects.get(codigo__iexact=codigo)  # iexact = sin importar mayúsculas/minúsculas
        
    except Lote.DoesNotExist:
        # Si no existe, devolver error 404
        return Response(
            {"error": "Lote no encontrado"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Actualizar solo los campos que vienen en el request
    if "input_precio" in request.data:
        raw_precio = request.data.get("input_precio")
        # Si viene vacío, poner 0; si no, convertir a float
        lote.precio = float(0) if raw_precio in (None, "") else float(raw_precio)
    
    if "input_area_lote" in request.data:
        lote.area_lote = float(request.data.get("input_area_lote"))
    
    # Guardar los cambios en PostgreSQL
    lote.save()
    
    # Devolver mensaje de éxito
    return Response(
        {"message": "Lote actualizado correctamente"}, 
        status=status.HTTP_200_OK
    )
```

**¿Qué hace esto?**
1. Recibe el código del lote a actualizar
2. Busca el lote en PostgreSQL
3. Actualiza solo los campos que vienen en la petición
4. Guarda los cambios en PostgreSQL
5. Devuelve confirmación

---

## 🟢 Frontend (React/TypeScript)

### Ejemplo 1: Componente de Página del Mapa

```typescript
// frontend/src/pages/public/mapa_page.tsx

import { useEffect, useState } from "react";
import { api } from "@/services";

// Definir la estructura de un Lote (tipo TypeScript)
export interface Lote {
  codigo: string;
  manzana: string;
  estado: string;
  precio: number | null;
  area_lote: number;
}

export default function MapaPage() {
  // Estado: lista de lotes (inicialmente vacía)
  const [lotes, setLotes] = useState<Lote[]>([]);
  
  // Estado: si está cargando datos
  const [loading, setLoading] = useState(true);
  
  // Estado: si hay un error
  const [error, setError] = useState<string | null>(null);
  
  // Estado: código del lote seleccionado
  const [selectedCodigo, setSelectedCodigo] = useState<string | null>(null);

  // Función para obtener lotes del backend (en Render)
  const fetchLotes = async () => {
    try {
      setError(null);  // Limpiar errores anteriores
      setLoading(true);  // Indicar que está cargando
      
      // Hacer petición GET al backend en Render
      const data = await api.get('api/maps/lotes/');
      
      // Actualizar el estado con los datos recibidos
      setLotes(data as Lote[]);
      
    } catch (e: any) {
      // Si hay error, guardarlo en el estado
      setError(e?.message ?? "Error al cargar lotes");
    } finally {
      // Siempre quitar el estado de carga
      setLoading(false);
    }
  };

  // useEffect: se ejecuta cuando el componente se monta (carga la página)
  useEffect(() => {
    fetchLotes();  // Cargar lotes al iniciar
  }, []);  // Array vacío = solo se ejecuta una vez

  // Buscar el lote seleccionado en la lista
  const selectedLote = lotes.find(l => l.codigo === selectedCodigo) ?? null;

  // Renderizar la interfaz
  return (
    <div className="flex min-h-screen">
      {/* Componente del mapa */}
      <MapaLotes
        lotes={lotes}
        loading={loading}
        error={error}
        onSelectCodigo={setSelectedCodigo}  // Función para seleccionar lote
        selectedCodigo={selectedCodigo}
      />
      
      {/* Panel de información (solo si hay lote seleccionado) */}
      {selectedLote && (
        <InfoPanel lote={selectedLote} />
      )}
    </div>
  );
}
```

**¿Qué hace esto?**
1. Define un componente React que muestra un mapa
2. Usa `useState` para manejar datos que cambian (lotes, loading, error)
3. Usa `useEffect` para cargar datos cuando la página se monta
4. Hace una petición al backend en Render usando `api.get()`
5. Renderiza el mapa y un panel de información

**Conceptos clave:**
- **useState**: Guarda datos que pueden cambiar y causan re-render
- **useEffect**: Ejecuta código cuando el componente se monta o cambian dependencias
- **async/await**: Maneja operaciones asíncronas (peticiones HTTP)

---

### Ejemplo 2: Servicio API

```typescript
// frontend/src/services/api_base.ts

// URL base de la API (desde variables de entorno o por defecto)
// En producción apunta al backend en Render
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Función genérica para hacer peticiones
  request: async (endpoint: string, options: RequestInit = {}) => {
    // Construir la URL completa
    const base = API_URL.replace(/\/+$/, '');  // Quitar barras finales
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${base}${path}`;

    // Hacer la petición HTTP al backend (Render en producción)
    const response = await fetch(url, {
      cache: 'no-store',  // No guardar en caché
      headers: {
        'Content-Type': 'application/json',  // Tipo de contenido
        ...options.headers,  // Headers adicionales
      },
      ...options,  // Otras opciones (method, body, etc.)
    });

    // Si la respuesta no es exitosa, lanzar error
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      
      const error = new Error(`HTTP error! status: ${response.status}`) as any;
      error.response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }

    // Devolver los datos como JSON
    return response.json();
  },

  // Métodos abreviados para diferentes tipos de peticiones
  get: (endpoint: string) => api.request(endpoint),
  
  post: (endpoint: string, data: any) =>
    api.request(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data)  // Convertir objeto a JSON
    }),
  
  put: (endpoint: string, data: any) =>
    api.request(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  
  delete: (endpoint: string) => 
    api.request(endpoint, { method: 'DELETE' }),
};
```

**¿Qué hace esto?**
- Crea un objeto `api` con métodos para hacer peticiones HTTP
- `get()`: Obtener datos
- `post()`: Crear datos
- `put()`: Actualizar datos
- `delete()`: Eliminar datos

**Uso:**
```typescript
// Obtener lotes del backend en Render
const lotes = await api.get('api/maps/lotes/');

// Crear cliente
await api.post('api/admin/clientes/crear/', {
  nombre: "Juan",
  apellidos: "Pérez"
});

// Actualizar lote
await api.put('api/admin/lotes/update/', {
  codigo: "A1-001",
  input_precio: 50000
});
```

---

### Ejemplo 3: Actualizar un Lote desde el Frontend

```typescript
// Ejemplo de cómo se actualizaría un lote desde un componente

const handleUpdateLote = async (codigo: string, nuevoPrecio: number) => {
  try {
    // Mostrar indicador de carga
    setLoading(true);
    
    // Hacer petición PUT al backend en Render
    await api.put('api/admin/lotes/update/', {
      codigo: codigo,
      input_precio: nuevoPrecio
    });
    
    // Mostrar mensaje de éxito
    alert('Lote actualizado correctamente');
    
    // Recargar los lotes para ver los cambios
    await fetchLotes();
    
  } catch (error: any) {
    // Mostrar mensaje de error
    alert(`Error: ${error.response?.data?.error || error.message}`);
  } finally {
    // Quitar indicador de carga
    setLoading(false);
  }
};
```

**Flujo completo:**
```
1. Usuario hace clic en "Guardar"
   │
   ▼
2. handleUpdateLote() se ejecuta
   │
   ▼
3. api.put() envía petición HTTP al backend en Render
   │
   ▼
4. Backend (Render) recibe y procesa
   │
   ▼
5. Backend actualiza PostgreSQL
   │
   ▼
6. Backend responde con éxito
   │
   ▼
7. Frontend muestra mensaje
   │
   ▼
8. Frontend recarga datos
```

---

## 🔗 Conexión Frontend-Backend

### Ejemplo Completo: Crear un Cliente

**Frontend (TypeScript):**
```typescript
const crearCliente = async () => {
  const nuevoCliente = {
    nombre: "María",
    apellidos: "González",
    dni: "12345678",
    email: "maria@example.com",
    telefono: "987654321"
  };
  
  try {
    // Petición al backend en Render
    const respuesta = await api.post('api/admin/clientes/crear/', nuevoCliente);
    console.log('Cliente creado:', respuesta.cliente);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Backend (Python) - Ejecutándose en Render:**
```python
@api_view(['POST'])
def CrearCliente(request):
    # request.data contiene los datos enviados desde el frontend
    serializer = ClienteSerializer(data=request.data)
    
    if serializer.is_valid():
        # Guardar en PostgreSQL
        serializer.save()
        return Response({
            "message": "Cliente creado exitosamente",
            "cliente": serializer.data
        }, status=status.HTTP_201_CREATED)
    
    # Si hay errores de validación
    return Response({
        "error": "Datos inválidos",
        "detalles": serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)
```

**Flujo:**
```
Frontend (Vercel) → POST /api/admin/clientes/crear/ + JSON → 
Backend (Render) → Validar → Guardar en PostgreSQL → Respuesta → Frontend
```

---

## 🎯 Tips para Principiantes

### 1. Entender el Flujo de Datos
```
Usuario → Frontend (Vercel) → Backend (Render) → PostgreSQL → Backend → Frontend → Usuario
```

### 2. Estados en React
```typescript
// Estado inicial
const [lotes, setLotes] = useState<Lote[]>([]);

// Actualizar estado
setLotes([...lotes, nuevoLote]);  // Agregar nuevo lote
setLotes(lotes.filter(l => l.id !== id));  // Eliminar lote
```

### 3. Manejo de Errores
```typescript
try {
  // Código que puede fallar
  await api.get('endpoint');
} catch (error) {
  // Qué hacer si falla
  console.error('Error:', error);
  setError('Algo salió mal');
}
```

### 4. useEffect - Cuándo Usarlo
```typescript
// Se ejecuta una vez al montar
useEffect(() => {
  fetchData();
}, []);

// Se ejecuta cuando cambia 'id'
useEffect(() => {
  fetchData(id);
}, [id]);
```

---

¡Espero que estos ejemplos te ayuden a entender mejor el código! 🚀


