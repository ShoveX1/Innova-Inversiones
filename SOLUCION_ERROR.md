# 🔧 Solución al Error: ModuleNotFoundError: No module named 'django_extensions'

## ❌ El Problema

Estás intentando ejecutar Django pero Python no encuentra el módulo `django_extensions` porque **no estás usando el entorno virtual**.

## ✅ La Solución

### Paso 1: Activar el Entorno Virtual

**En PowerShell (Windows):**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
```

**En Git Bash o Terminal:**
```bash
cd backend
source venv/Scripts/activate
```

**En CMD (Símbolo del sistema):**
```cmd
cd backend
venv\Scripts\activate.bat
```

### Paso 2: Verificar que el Entorno Virtual Está Activo

Deberías ver `(venv)` al inicio de tu línea de comandos:
```
(venv) PS D:\innova\Innova-Inversiones\backend>
```

### Paso 3: Instalar Dependencias (si es necesario)

```powershell
pip install -r requirements.txt
```

### Paso 4: Ejecutar el Servidor

```powershell
python manage.py runserver
```

---

## 📝 Explicación para Principiantes

### ¿Qué es un Entorno Virtual?

Un **entorno virtual** es como un "contenedor" aislado donde se instalan las librerías de Python específicas para tu proyecto. Esto evita conflictos entre diferentes proyectos.

### ¿Por qué es necesario?

- Cada proyecto puede usar versiones diferentes de las mismas librerías
- Mantiene tu sistema Python limpio
- Facilita compartir el proyecto con otros desarrolladores

### Flujo Correcto:

```
1. Abrir terminal
   ↓
2. Ir a la carpeta backend
   ↓
3. Activar entorno virtual
   ↓
4. Ejecutar comandos Django
```

---

## 🚨 Si Sigue Sin Funcionar

### Opción 1: Instalar todas las dependencias de nuevo

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Opción 2: Verificar que estás usando el Python correcto

```powershell
# Debería mostrar la ruta al venv
python --version
where python
```

### Opción 3: Recrear el entorno virtual (último recurso)

```powershell
cd backend
# Eliminar el venv actual (opcional)
Remove-Item -Recurse -Force venv

# Crear nuevo entorno virtual
python -m venv venv

# Activar
.\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt
```

---

## 💡 Tip: Crear un Script de Inicio Rápido

Puedes crear un archivo `start.ps1` en la carpeta `backend`:

```powershell
# start.ps1
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

Luego solo ejecutas:
```powershell
.\start.ps1
```

---

## ✅ Verificación Final

Si todo está bien, deberías ver algo como:

```
(venv) PS D:\innova\Innova-Inversiones\backend> python manage.py runserver
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
Django version 5.2.5, using settings 'innova_inversiones.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

---

## 🌐 Nota sobre Producción

En **producción (Render)**, el entorno virtual se maneja automáticamente. Render:
- Detecta automáticamente el archivo `requirements.txt`
- Instala todas las dependencias
- Ejecuta el servidor con `gunicorn` (según el `Procfile`)
- Configura la `DATABASE_URL` desde las variables de entorno

No necesitas activar manualmente el entorno virtual en Render, todo se hace automáticamente.

¡Listo! 🎉


