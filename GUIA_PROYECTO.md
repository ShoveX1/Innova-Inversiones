# 📚 Guía Completa del Proyecto Innova Inversiones

## 🎯 ¿Qué es este proyecto?

**Innova Inversiones** es un sistema web para gestionar **lotes de terreno** (terrenos para construcción o inversión). Imagina que tienes un proyecto inmobiliario con muchos lotes y necesitas:

- Ver todos los lotes en un mapa interactivo
- Saber qué lotes están disponibles, reservados o vendidos
- Gestionar clientes que compran lotes
- Registrar pagos y créditos
- Administrar transacciones financieras

Este sistema permite hacer todo eso de forma digital y visual.

---

## 🏗️ Arquitectura del Proyecto

El proyecto está dividido en **dos partes principales**:

### 1. **Backend (Servidor)** - `backend/`
   - **Lenguaje**: Python
   - **Framework**: Django (framework web de Python)
   - **Base de datos**: PostgreSQL (local o en Render)
   - **Hosting**: Render (servicio de hosting en la nube)
   - **Función**: Maneja toda la lógica, almacena datos y proporciona APIs
   
   **Nota**: Anteriormente usaban Supabase, pero ahora están usando PostgreSQL directamente (localmente o en Render).

### 2. **Frontend (Interfaz)** - `frontend/`
   - **Lenguaje**: TypeScript (JavaScript con tipos)
   - **Framework**: React (biblioteca para crear interfaces)
   - **Herramientas**: Vite (herramienta de desarrollo rápida)
   - **Estilos**: Tailwind CSS (framework de estilos)
   - **Función**: Lo que el usuario ve y con lo que interactúa

---

## 🛠️ Tecnologías Utilizadas

### Backend (Python/Django)

| Tecnología | ¿Para qué sirve? |
|------------|------------------|
| **Django 5.2.5** | Framework principal que maneja todo el servidor |
| **Django REST Framework** | Crea APIs (interfaces para que el frontend se comunique con el backend) |
| **PostgreSQL** | Base de datos donde se guardan todos los datos (puede ser local o en Render) |
| **django-cors-headers** | Permite que el frontend se comunique con el backend desde diferentes dominios |
| **django-filter** | Facilita filtrar y buscar datos |
| **psycopg2** | Conector para comunicarse con PostgreSQL |
| **Render** | Servicio de hosting donde está desplegado el backend |

### Frontend (React/TypeScript)

| Tecnología | ¿Para qué sirve? |
|------------|------------------|
| **React 19** | Crea la interfaz de usuario (botones, formularios, mapas) |
| **TypeScript** | JavaScript con tipos, ayuda a evitar errores |
| **Vite** | Herramienta que compila y ejecuta el proyecto rápidamente |
| **React Router** | Maneja la navegación entre páginas |
| **Axios** | Hace peticiones HTTP al backend |
| **Tailwind CSS** | Estilos predefinidos para hacer la interfaz bonita |
| **jsPDF** | Genera archivos PDF |

---

## 📁 Estructura del Proyecto

```
Innova-Inversiones/
│
├── backend/                    # Código del servidor
│   ├── apps/
│   │   ├── administrator/     # Funciones de administración
│   │   └── maps/               # Funciones relacionadas con mapas
│   ├── database/              # Modelos de base de datos (tablas)
│   ├── innova_inversiones/    # Configuración principal de Django
│   │   ├── settings.py        # Configuraciones del proyecto
│   │   └── urls.py            # Rutas principales
│   ├── manage.py              # Script para ejecutar comandos Django
│   └── requirements.txt       # Dependencias de Python
│
└── frontend/                   # Código de la interfaz
    ├── src/
    │   ├── components/         # Componentes reutilizables
    │   │   ├── admin/         # Componentes del panel de admin
    │   │   ├── mapa/          # Componentes del mapa
    │   │   └── common/        # Componentes comunes
    │   ├── pages/             # Páginas principales
    │   │   ├── admin/         # Páginas del administrador
    │   │   └── public/        # Páginas públicas
    │   └── services/          # Servicios para comunicarse con el backend
    ├── package.json           # Dependencias de Node.js
    └── vite.config.ts         # Configuración de Vite
```

---

## 🗄️ Base de Datos - Modelos Principales

### 1. **Lote** (Terreno)
Representa un lote de terreno con:
- Código único (ej: "A1-001")
- Manzana y número de lote
- Área y perímetro
- Precio
- Estado (disponible, reservado, vendido, etc.)

### 2. **Cliente**
Información de las personas que compran lotes:
- Nombre, apellidos, DNI
- Email, teléfono, dirección
- Estado financiero (al día, deudor, conciliado)

### 3. **relacion_cliente_lote**
Conecta clientes con lotes:
- Qué cliente tiene qué lote
- Tipo de relación (Propietario, Reservante, Copropietario)
- Porcentaje de participación (si es copropietario)

### 4. **Credito**
Registra los créditos que los clientes tienen:
- Monto total del crédito
- Número de cuotas
- Cuotas pagadas
- Estado del crédito

### 5. **Transaccion**
Registra todos los pagos:
- Tipo (Reserva, Venta, Cuota, Amortización)
- Monto
- Método de pago (efectivo, transferencia, tarjeta)
- Fecha

### 6. **Usuario_Perfil**
Perfiles de usuarios del sistema:
- Vinculado a un usuario de Django
- Tiene un rol (administrador, vendedor, etc.)

---

## 🔄 ¿Cómo Funciona el Sistema?

### Flujo de Datos

```
Usuario (Navegador)
    ↓
Frontend (React) - Interfaz visual
    ↓ (Peticiones HTTP)
Backend (Django) - Procesa la lógica
    ↓ (Consultas SQL)
Base de Datos (PostgreSQL) - Almacena datos
    ↓ (Respuesta)
Backend devuelve datos
    ↓ (JSON)
Frontend muestra los datos
```

### Ejemplo Práctico: Ver un Lote

1. **Usuario hace clic** en un lote en el mapa
2. **Frontend** envía petición: `GET /api/maps/lotes/`
3. **Backend** consulta la base de datos
4. **Base de datos** devuelve información del lote
5. **Backend** envía JSON con los datos
6. **Frontend** muestra el panel de información del lote

---

## 🎨 Funcionalidades Principales

### Para Usuarios Públicos

1. **Mapa Interactivo** (`/`)
   - Ver todos los lotes en un mapa visual
   - Hacer clic en un lote para ver detalles
   - Ver estado de cada lote (colores diferentes)
   - Información: precio, área, descripción

### Para Administradores (`/admin/*`)

1. **Plano de Lotes** (`/admin/plano-lotes`)
   - Editar información de lotes
   - Cambiar estado de lotes
   - Actualizar precios y áreas

2. **Gestión de Clientes** (`/admin/gestion-clientes`)
   - Crear nuevos clientes
   - Editar información de clientes
   - Asignar lotes a clientes
   - Ver historial de compras

3. **Transacciones** (`/admin/transacciones`)
   - Registrar pagos
   - Ver historial de transacciones
   - Filtrar por cliente o lote

4. **Créditos por Cobrar** (`/admin/creditos-por-cobrar`)
   - Ver créditos activos
   - Registrar pagos de cuotas
   - Seguimiento de pagos pendientes

5. **Dashboard** (`/admin/dashboard`)
   - Estadísticas generales
   - Resumen de ventas
   - Métricas del negocio

---

## 🔌 APIs (Endpoints) Principales

### Mapas (Público)
- `GET /api/maps/lotes/` - Obtener todos los lotes con su estado

### Administración
- `GET /api/admin/lotes/` - Obtener un lote por código
- `PUT /api/admin/lotes/update/` - Actualizar un lote
- `GET /api/admin/clientes/listar/` - Listar clientes
- `POST /api/admin/clientes/crear/` - Crear cliente
- `GET /api/admin/cliente-lote/listar/` - Listar relaciones cliente-lote
- `POST /api/admin/cliente-lote/asignar/` - Asignar lote a cliente

---

## 🚀 Cómo Ejecutar el Proyecto

### Backend

1. **Instalar dependencias**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Configurar base de datos**:
   - Crear archivo `.env` en `backend/`
   - Agregar `DATABASE_URL` con la conexión a PostgreSQL
   - En producción (Render), la `DATABASE_URL` se configura automáticamente desde las variables de entorno de Render

3. **Ejecutar migraciones** (crear tablas):
```bash
python manage.py migrate
```

4. **Ejecutar servidor**:
```bash
python manage.py runserver
```

### Frontend

1. **Instalar dependencias**:
```bash
cd frontend
npm install
```

2. **Configurar variables de entorno**:
   - Crear archivo `.env` en `frontend/`
   - Agregar `VITE_API_URL=http://localhost:8000/api`

3. **Ejecutar servidor de desarrollo**:
```bash
npm run dev
```

---

## 📝 Conceptos Importantes para Principiantes

### ¿Qué es una API?
Una API (Application Programming Interface) es como un "menú" que el backend ofrece al frontend. El frontend puede pedir datos o enviar datos usando estas "rutas" definidas.

### ¿Qué es un Modelo?
Un modelo en Django es como una "plantilla" para crear tablas en la base de datos. Define qué campos tiene cada tabla y cómo se relacionan.

### ¿Qué es un Componente?
En React, un componente es una pieza reutilizable de la interfaz. Por ejemplo, un botón o un formulario pueden ser componentes.

### ¿Qué es un Estado?
El estado en React es información que puede cambiar y que afecta cómo se muestra la página. Por ejemplo, si un lote está seleccionado o no.

---

## 🔍 Archivos Clave para Entender

### Backend
- `backend/database/models.py` - Define todas las tablas de la base de datos
- `backend/apps/administrator/views.py` - Lógica de las funciones de administración
- `backend/apps/maps/views.py` - Lógica para obtener lotes del mapa
- `backend/innova_inversiones/settings.py` - Configuración del proyecto

### Frontend
- `frontend/src/App.tsx` - Componente principal que define las rutas
- `frontend/src/pages/public/mapa_page.tsx` - Página pública del mapa
- `frontend/src/pages/admin/admin_mapa_page.tsx` - Página principal del admin
- `frontend/src/services/api_base.ts` - Configuración para hacer peticiones al backend

---

## 🎓 Próximos Pasos para Aprender

1. **Explora el código**: Empieza por los archivos mencionados arriba
2. **Haz cambios pequeños**: Prueba cambiar textos o colores
3. **Agrega funcionalidades simples**: Por ejemplo, un botón que muestre un mensaje
4. **Lee la documentación**: 
   - [Django Docs](https://docs.djangoproject.com/)
   - [React Docs](https://react.dev/)
   - [TypeScript Docs](https://www.typescriptlang.org/docs/)

---

## ❓ Preguntas Frecuentes

**P: ¿Dónde se guardan los datos?**
R: En una base de datos PostgreSQL. El backend está desplegado en Render, que puede usar PostgreSQL local o una base de datos PostgreSQL proporcionada por Render. Anteriormente usaban Supabase, pero ya no.

**P: ¿Cómo se comunica el frontend con el backend?**
R: A través de peticiones HTTP (GET, POST, PUT, DELETE) usando JSON.

**P: ¿Qué pasa cuando un usuario hace clic en un lote?**
R: El frontend envía una petición al backend, el backend consulta la base de datos y devuelve la información del lote.

**P: ¿Cómo se actualiza el mapa cuando cambia un lote?**
R: El frontend hace peticiones periódicas (cada 30 segundos) o cuando detecta cambios usando BroadcastChannel.

---

## 📞 Notas Finales

Este proyecto es un sistema completo de gestión inmobiliaria. Si eres principiante, te recomiendo:

1. Empezar por entender el flujo de datos
2. Explorar el código poco a poco
3. Hacer cambios pequeños y ver qué pasa
4. Leer los comentarios en el código
5. No tener miedo de experimentar (siempre puedes volver atrás con Git)

¡Buena suerte aprendiendo! 🚀

