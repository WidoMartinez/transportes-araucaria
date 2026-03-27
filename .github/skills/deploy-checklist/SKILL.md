---
name: deploy-checklist
description: "Skill para generar la lista de verificación completa antes de hacer deploy. Úsalo antes de cada push a main para asegurar que nada queda sin subir a Hostinger ni actualizar en Render."
---

# Checklist de Deploy — Transportes Araucanía

## Propósito

Antes de hacer `git push` o merge a `main`, este skill genera automáticamente la lista de tareas pendientes para que ningún archivo ni variable se quede sin actualizar en producción.

---

## Paso 1 — Detectar archivos cambiados

Analizar los archivos modificados en el commit/PR actual y clasificarlos:

### Archivos de Hostinger (subida manual FTP)
Buscar cualquier archivo con extensión `.php` o `.html` en la raíz del proyecto:

```
enviar_asignacion_reserva.php
enviar_confirmacion_pago.php
enviar_correo_completo.php
enviar_correo_mejorado.php
enviar_notificacion_conductor.php
enviar_notificacion_evaluacion_admin.php
enviar_notificacion_productos.php
enviar_solicitud_detalles.php
enviar_solicitud_evaluacion.php
config_reservas.php
reservas_manager.php
index.html
fletes/index.html
fletes/index.php
```

**Si alguno fue modificado**, generar alerta:
```
📤 SUBIDA MANUAL A HOSTINGER REQUERIDA
Archivos a subir por FTP:
- [lista de archivos PHP/HTML modificados]
Ruta destino en Hostinger: /public_html/
```

### Archivos de Render.com (deploy automático vía git push)
Cualquier archivo bajo `backend/` se despliega automáticamente. Sin acción manual.

### Archivos de Render que requieren variables de entorno
Si hay cambios en `backend/config/` o `render.yaml`, verificar si se agregaron nuevas variables de entorno.

---

## Paso 2 — Verificar variables de entorno de Render

Variables de entorno críticas en Render.com (confirmar que están configuradas):

| Variable | Propósito | Sensible |
|----------|-----------|---------|
| `DATABASE_URL` | Conexión MySQL | ✅ Sí |
| `JWT_SECRET` | Firma de tokens | ✅ Sí |
| `FLOW_API_KEY` | Pasarela de pagos Flow | ✅ Sí |
| `FLOW_SECRET_KEY` | Secreto de Flow | ✅ Sí |
| `NODE_ENV` | Entorno (production) | No |
| `FRONTEND_URL` | URL del frontend Hostinger | No |
| `CLOUDINARY_URL` | Almacenamiento de imágenes | ✅ Sí |

Si el PR agrega código que usa `process.env.NUEVA_VAR`, incluir en checklist:
```
⚙️ NUEVA VARIABLE DE ENTORNO EN RENDER:
Ir a: Dashboard Render → tu servicio → Environment → Add Environment Variable
```

---

## Paso 3 — Verificar migraciones de base de datos

Si hay archivos nuevos en `backend/migrations/`, verificar:
- [ ] La migración tiene nombre con timestamp (`YYYYMMDDHHMMSS-nombre.js`)
- [ ] Tiene método `up` y `down`
- [ ] El endpoint `GET /api/migrate` o script de migración fue invocado (Render lo ejecuta en el start del servicio si está configurado)

---

## Paso 4 — Verificar compatibilidad CORS

Si el frontend cambió de URL o se agregó un nuevo origen, actualizar en `backend/server-db.js`:
```javascript
// Buscar el array de origenes permitidos
const allowedOrigins = [...]
```

---

## Paso 5 — Checklist final antes del push

Generar este checklist y mostrarlo al usuario:

```markdown
## ✅ Checklist de Deploy — [fecha]

### Frontend (Hostinger)
- [ ] Archivos PHP modificados subidos por FTP
- [ ] Cache del hosting limpiado (si aplica)

### Backend (Render.com)
- [ ] Push a `main` hará redeploy automático
- [ ] Nuevas variables de entorno agregadas en Render Dashboard
- [ ] Migraciones de BD listas para ejecutarse

### Pruebas post-deploy (esperar 2-3 min para plan gratuito)
- [ ] Verificar endpoint de salud: GET /api/health
- [ ] Probar flujo crítico afectado por los cambios
- [ ] Revisar logs de Render los primeros 5 minutos

### Conversiones (si aplica)
- [ ] Tracking de Google Ads sigue funcionando
- [ ] Monto `amount` se pasa correctamente en URL de retorno
```

---

## Cómo usar este skill

Actívalo antes de cada push significativo diciendo:
> "Genera el checklist de deploy para los cambios de este PR"

El skill analizará automáticamente los archivos del diff y personalizará el checklist.
