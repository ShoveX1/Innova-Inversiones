# 📖 Índice de Guías del Proyecto

¡Bienvenido! Este es el punto de partida para entender el proyecto **Innova Inversiones**.

---

## 🎯 ¿Por dónde empezar?

Si eres **completamente nuevo** en el proyecto, te recomiendo leer los documentos en este orden:

### 1️⃣ **GUIA_PROYECTO.md** (Empezar aquí)
📚 **Guía Completa del Proyecto**

Esta es la guía principal que explica:
- ✅ ¿Qué es el proyecto?
- ✅ Arquitectura (Backend y Frontend)
- ✅ Tecnologías utilizadas
- ✅ Estructura de carpetas
- ✅ Modelos de base de datos
- ✅ Funcionalidades principales
- ✅ Cómo ejecutar el proyecto
- ✅ Conceptos importantes para principiantes

**👉 [Leer GUIA_PROYECTO.md](./GUIA_PROYECTO.md)**

---

### 2️⃣ **RESUMEN_VISUAL.md** (Recomendado)
🎨 **Resumen Visual con Diagramas**

Esta guía contiene diagramas visuales que ayudan a entender:
- 📊 Diagrama de arquitectura
- 🔄 Flujos de acciones (ver lote, actualizar lote)
- 🗂️ Estructura de datos (modelos y relaciones)
- 🎯 Páginas y rutas
- 🎨 Componentes del frontend
- 🔐 Estados de lotes
- 💰 Tipos de transacciones

**👉 [Leer RESUMEN_VISUAL.md](./RESUMEN_VISUAL.md)**

---

### 3️⃣ **EJEMPLOS_CODIGO.md** (Cuando estés listo para código)
💻 **Ejemplos de Código Explicados**

Esta guía contiene ejemplos prácticos del código real:
- 🔵 Ejemplos de Backend (Python/Django)
  - Modelos
  - Vistas API
  - Actualización de datos
- 🟢 Ejemplos de Frontend (React/TypeScript)
  - Componentes
  - Estados
  - Peticiones HTTP
- 🔗 Conexión Frontend-Backend
- 🎯 Tips para principiantes

**👉 [Leer EJEMPLOS_CODIGO.md](./EJEMPLOS_CODIGO.md)**

---

## 📋 Resumen Rápido

### ¿Qué es este proyecto?
Sistema web para gestionar lotes de terreno (proyecto inmobiliario) con:
- Mapa interactivo de lotes
- Gestión de clientes
- Registro de transacciones y créditos
- Panel de administración

### Tecnologías principales
- **Backend**: Python + Django + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS

### Estructura
```
Innova-Inversiones/
├── backend/     (Servidor - Django)
└── frontend/    (Interfaz - React)
```

---

## 🚀 Inicio Rápido

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Archivos Importantes del Proyecto
- `backend/database/models.py` - Modelos de base de datos
- `backend/apps/administrator/views.py` - Lógica de administración
- `frontend/src/App.tsx` - Componente principal
- `frontend/src/pages/public/mapa_page.tsx` - Página del mapa

---

## ❓ ¿Necesitas Ayuda?

1. **Lee primero** la GUIA_PROYECTO.md completa
2. **Revisa los diagramas** en RESUMEN_VISUAL.md
3. **Estudia los ejemplos** en EJEMPLOS_CODIGO.md
4. **Explora el código** en los archivos mencionados
5. **Experimenta** haciendo cambios pequeños

---

## 🎓 Orden de Aprendizaje Recomendado

```
1. Leer GUIA_PROYECTO.md
   ↓
2. Revisar RESUMEN_VISUAL.md
   ↓
3. Estudiar EJEMPLOS_CODIGO.md
   ↓
4. Explorar código real del proyecto
   ↓
5. Hacer cambios pequeños y experimentar
```

---

¡Buena suerte aprendiendo! 🚀

