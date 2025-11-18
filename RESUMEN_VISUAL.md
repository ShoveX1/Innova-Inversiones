# 🎨 Resumen Visual del Proyecto

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (Navegador)                      │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │      FRONTEND (React)         │
        │  - Interfaz de Usuario         │
        │  - Componentes Visuales       │
        │  - Páginas (Mapa, Admin)      │
        └───────────────┬───────────────┘
                        │
                        │ HTTP Requests (JSON)
                        │ GET /api/maps/lotes/
                        │ POST /api/admin/clientes/
                        │
                        ▼
        ┌───────────────────────────────┐
        │      BACKEND (Django)          │
        │  - Procesa Lógica             │
        │  - Valida Datos               │
        │  - APIs REST                  │
        │  - Hosting: Render             │
        └───────────────┬───────────────┘
                        │
                        │ SQL Queries
                        │ SELECT * FROM lote
                        │ INSERT INTO cliente
                        │
                        ▼
        ┌───────────────────────────────┐
        │   BASE DE DATOS (PostgreSQL)  │
        │  - Almacena Datos             │
        │  - Local o en Render          │
        │  - Tablas: Lote, Cliente, etc.│
        └───────────────────────────────┘
```

## 🔄 Flujo de una Acción: Ver Detalles de un Lote

```
1. Usuario hace clic en un lote
   │
   ▼
2. Frontend detecta el clic
   │
   ▼
3. Frontend ya tiene los datos (cargados al inicio)
   │
   ▼
4. Frontend muestra panel con información del lote
   │
   └─► Usuario ve: precio, área, estado, descripción
```

## 🔄 Flujo de una Acción: Actualizar un Lote (Admin)

```
1. Admin edita precio de un lote
   │
   ▼
2. Frontend envía: PUT /api/admin/lotes/update/
   │   Body: { codigo: "A1-001", input_precio: 50000 }
   │
   ▼
3. Backend (en Render) recibe la petición
   │
   ▼
4. Backend valida los datos
   │
   ▼
5. Backend actualiza en PostgreSQL:
   │   UPDATE lote SET precio = 50000 WHERE codigo = 'A1-001'
   │
   ▼
6. Backend responde: { "message": "Lote actualizado correctamente" }
   │
   ▼
7. Frontend muestra mensaje de éxito
   │
   ▼
8. Frontend actualiza el mapa (recarga datos)
```

## 🗂️ Estructura de Datos (Modelos)

```
┌─────────────────┐
│   Usuario       │
│   (Django User) │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│ Usuario_Perfil  │──┐
│ - rol           │  │
│ - estado        │  │
└─────────────────┘  │
                     │ 1:1
                     ▼
┌─────────────────┐
│    Cliente      │
│ - nombre        │
│ - apellidos     │
│ - dni           │
│ - email         │
└────────┬────────┘
         │
         │ N:M (a través de relacion_cliente_lote)
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ relacion_       │      │      Lote         │
│ cliente_lote    │◄─────┤ - codigo         │
│ - tipo_relacion │      │ - manzana        │
│ - porcentaje    │      │ - area_lote      │
└─────────────────┘      │ - precio         │
                         │ - estado         │
                         └────────┬─────────┘
                                  │
                                  │ 1:N
                                  ▼
                         ┌──────────────────┐
                         │   Transaccion    │
                         │ - tipo           │
                         │ - monto          │
                         │ - metodo_pago    │
                         └──────────────────┘
                                  │
                                  │ N:1
                                  ▼
                         ┌──────────────────┐
                         │    Credito       │
                         │ - monto_total   │
                         │ - num_cuotas    │
                         │ - estado        │
                         └──────────────────┘
```

## 🎯 Páginas y Rutas

```
/ (Página Pública)
│
├─► Mapa Interactivo
   └─► Muestra todos los lotes
   └─► Click en lote → Panel de información

/admin/* (Panel de Administración)
│
├─► /admin/plano-lotes
   └─► Editar lotes en el mapa
   └─► Cambiar estado, precio, área
│
├─► /admin/gestion-clientes
   └─► Listar clientes
   └─► Crear/Editar clientes
   └─► Asignar lotes a clientes
│
├─► /admin/transacciones
   └─► Registrar pagos
   └─► Ver historial
│
├─► /admin/creditos-por-cobrar
   └─► Ver créditos activos
   └─► Registrar pagos de cuotas
│
└─► /admin/dashboard
   └─► Estadísticas generales
```

## 🎨 Componentes Principales del Frontend

```
App.tsx (Componente Principal)
│
├─► Router (React Router)
│   │
│   ├─► Route: "/" → MapaPage
│   │   │
│   │   ├─► MapaLotes (Componente del mapa)
│   │   └─► InfoPanel (Panel de información)
│   │
│   └─► Route: "/admin/*" → AdminMapaPage
│       │
│       ├─► SidebarAdmin (Menú lateral)
│       │
│       └─► Routes internos:
│           ├─► PlanoLotes
│           ├─► GestionClientes
│           ├─► Transacciones
│           ├─► CreditosPorCobrar
│           └─► Dashboard
```

## 🔐 Estados de un Lote

```
┌─────────────┐
│ Disponible  │ (Verde) - Lote libre para venta
└─────────────┘
       │
       ▼
┌─────────────┐
│ Reservado   │ (Amarillo) - Cliente reservó pero no pagó completo
└─────────────┘
       │
       ▼
┌─────────────┐
│ Vendido     │ (Rojo) - Lote completamente vendido
└─────────────┘
       │
       ▼
┌─────────────┐
│ Bloqueado   │ (Gris) - Lote no disponible temporalmente
└─────────────┘
```

## 💰 Tipos de Transacciones

```
Transaccion
│
├─► RESERVA
│   └─► Pago inicial para reservar un lote
│
├─► VENTA
│   └─► Pago completo de un lote
│
├─► CUOTA
│   └─► Pago de una cuota de crédito
│
└─► AMORTIZACION
    └─► Pago adicional para reducir el crédito
```

## 🔄 Ciclo de Vida de un Lote

```
1. Lote Creado
   │
   ▼ Estado: Disponible
   │
2. Cliente hace RESERVA
   │
   ▼ Estado: Reservado
   │
3. Cliente paga VENTA completa
   │
   ▼ Estado: Vendido
   │
4. Si hay crédito:
   │
   ├─► Cliente paga CUOTAS periódicamente
   │
   └─► Cuando todas las cuotas pagadas:
       │
       └─► Crédito completado
```

## 🛠️ Tecnologías por Capa

```
┌─────────────────────────────────────┐
│         CAPA DE PRESENTACIÓN        │
│  React + TypeScript + Tailwind CSS  │
│  (Lo que ve el usuario)             │
└─────────────────────────────────────┘
              │
              │ HTTP/JSON
              ▼
┌─────────────────────────────────────┐
│         CAPA DE LÓGICA              │
│  Django + Django REST Framework     │
│  (Procesa y valida datos)           │
│  Hosting: Render                    │
└─────────────────────────────────────┘
              │
              │ SQL
              ▼
┌─────────────────────────────────────┐
│         CAPA DE DATOS              │
│  PostgreSQL (Local o en Render)    │
│  (Almacena información)             │
└─────────────────────────────────────┘
```

## 📱 Responsive Design

```
Desktop (> 1024px)
├─► Sidebar completo visible
├─► Mapa a pantalla completa
└─► Paneles laterales expandidos

Tablet (768px - 1024px)
├─► Sidebar colapsable
├─► Mapa adaptado
└─► Paneles modales

Mobile (< 768px)
├─► Sidebar oculto (menú hamburguesa)
├─► Mapa en pantalla completa
└─► Paneles como modales
```

## 🌐 Despliegue (Deployment)

```
Desarrollo Local
├─► Backend: localhost:8000
├─► Frontend: localhost:5173 (Vite)
└─► Base de datos: PostgreSQL local

Producción
├─► Backend: Render (render.com)
│   └─► Gunicorn como servidor WSGI
│   └─► PostgreSQL en Render o externo
└─► Frontend: Vercel (vercel.app)
    └─► Build estático de React
```

---

¡Espero que estos diagramas te ayuden a visualizar mejor cómo funciona el proyecto! 🚀


