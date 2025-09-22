## Documentación de operación del mapa: caché, snapshot y estabilidad

### Objetivo
Garantizar que el mapa cargue rápido y siga funcionando aunque la base de datos (Supabase) rechace conexiones o el backend se “duerma”, minimizando el consumo de conexiones y CPU.

### Cambios realizados
- Frontend
  - Unificación del consumo de API usando `frontend/src/services/api.ts` con base `VITE_API_URL`.
  - Llamada del mapa: `GET /api/maps/lotes/` (una sola solicitud al montar).
  - Normalización de URLs en `api.ts` para evitar duplicar `/api`.

- Backend (Django)
  - Endpoint `GET /api/maps/lotes/` optimizado con `values()` y `select_related('estado')`.
  - Caché en memoria del resultado (ahora sin expiración por defecto) y headers HTTP:
    - `Cache-Control: public, max-age=86400` (24 h para CDN/navegador)
    - `ETag` simple para validar cambios.
  - Snapshot persistente en disco: `BASE_DIR/data/lotes_snapshot.json`.
  - Fallback a snapshot si la BD falla (el endpoint responde con el último snapshot disponible).
  - Comando de gestión: `python manage.py refresh_map_snapshot` para regenerar el snapshot bajo demanda o por cron.

### Ubicaciones de código relevantes
- Frontend
  - `frontend/src/services/api.ts` (base de API y normalización de paths)
  - `frontend/src/components/MapaLotesPanel.tsx` (carga de lotes del mapa)
- Backend
  - `backend/apps/maps/views.py` (endpoint, caché, headers y fallback)
  - `backend/apps/maps/snapshot.py` (leer/escribir/generar snapshot)
  - `backend/apps/maps/management/commands/refresh_map_snapshot.py` (comando de refresco)
  - `backend/innova_inversiones/settings.py` (caché, DB y CORS)

### Variables de entorno (frontend)
- `VITE_API_URL`
  - Opción B (recomendada si el backend expone `/api`):
    - Producción: `https://tu-backend.com`
    - Desarrollo con proxy de Vite: `/api`
  - Llamar en código: `api.get('/api/maps/lotes/')`

### Variables de entorno (backend)
- `DATABASE_URL`
  - Usar el connection string del pooler de Supabase (puerto 6543) en producción.
  - SSL requerido.
- `DEBUG`, `SECRET_KEY`, CORS (dominios permitidos).

### Caché y snapshot
- Caché Django (actual): `LocMemCache`, sin expiración (`TIMEOUT=None`).
  - Nota: es por proceso. Si hay múltiples procesos/instancias, cada uno mantiene su copia. Para producción con alta concurrencia, se recomienda Redis como backend de caché compartida.
- Headers HTTP:
  - `Cache-Control: public, max-age=86400` → CDN/navegador pueden servir sin golpear el backend durante 24 h.
  - `ETag` → permite validación condicional y refresco cuando cambie el contenido.
- Snapshot persistente:
  - Ruta: `BASE_DIR/data/lotes_snapshot.json`
  - Se actualiza cuando el endpoint consulta la BD con éxito y a través del comando de gestión.
  - Si la BD está caída, el endpoint responde con este snapshot.

### Tareas programadas (recomendado)
- Refresco diario del snapshot (24 h):
  - Comando: `python manage.py refresh_map_snapshot`
  - Render Scheduled Job o cron externo.
  - Frecuencia sugerida: 24 h (o 5–10 min si deseas más frescura).

### Mantener Render despierto (si usas plan Free)
- Un ping periódico evita el “sleep” y mantiene respuesta rápida:
  - `curl -fsS -H "Cache-Control: no-cache" "https://tu-backend/api/maps/lotes/?wake=1" > /dev/null`
  - Frecuencia sugerida: cada 5–10 minutos.
- Importante: pingeando el frontend no siempre se despierta el backend (CDN puede responder sin llegar al servidor), por eso se recomienda ping directo al backend.
- Con plan de pago (always on), no es necesario.

### CDN (opcional recomendado)
- Colocar el backend detrás de un CDN (p. ej., Cloudflare) y cachear `/api/maps/lotes/` respetando `Cache-Control`.
- Beneficios: 0 hits al backend durante el TTL y latencia menor.

### Invalidación / actualización inmediata
- Manual: ejecutar `python manage.py refresh_map_snapshot` para regenerar snapshot y recalentar caché.
- En flujos de “modo administrador” (futuro): después de actualizar lotes, invalidar la clave y refrescar snapshot para reflejo inmediato.
  - Ejemplo de pasos: `cache.delete('lotes_estado_cache')` y luego `refresh_map_snapshot`.
  - Con Redis, la invalidación se propaga a todos los procesos/instancias.

### Comandos útiles
- Ejecutar servidor local: `python manage.py runserver`
- Refrescar snapshot: `python manage.py refresh_map_snapshot`
- Probar endpoint local: `http://127.0.0.1:8000/api/maps/lotes/`

### Recomendaciones de producción
- Usar el pooler de Supabase (puerto 6543) en `DATABASE_URL`.
- Considerar Redis para caché compartida si hay múltiples workers/instancias.
- Mantener un job de “wake”/ping en plan Free o usar plan pago para evitar sleep.
- (Opcional) Desactivar la UI navegable de DRF en producción para que el endpoint solo devuelva JSON (reduce assets secundarios en `/static/rest_framework`).

### Notas de seguridad / RLS
- Si activas RLS en Supabase, recuerda definir políticas de lectura para los datos públicos del mapa o usar la service role key desde backend/cron.
- Evita exponer datos sensibles en el snapshot (solo campos necesarios para el mapa).

---
Última actualización: reemplazo de TTL por caché indefinida con refresco diario y ETag/Cache-Control a 24 h. Snapshot como respaldo si la BD falla. Frontend apuntando a `/api/maps/lotes/` vía `VITE_API_URL`.


