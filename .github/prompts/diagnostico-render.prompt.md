---
mode: 'agent'
description: 'Diagnostica errores del backend en Render.com analizando logs pegados por el usuario. Úsalo cuando el backend falla y no tienes acceso a shell (plan gratuito).'
---

# Diagnóstico de Errores en Render.com

## Contexto del proyecto
- Backend Node.js + Express hospedado en **Render.com** (plan gratuito, sin shell).
- Base de datos MySQL con Sequelize.
- Frontend React en Hostinger.
- Archivos PHP de correos (PHPMailer) en Hostinger.

## Instrucciones para el agente

Cuando el usuario pegue logs de Render, seguir este proceso:

### Paso 1 — Clasificar el error
Identificar a qué categoría pertenece el log:

| Patrón en el log | Categoría | Acción típica |
|-----------------|-----------|---------------|
| `SequelizeConnectionError` / `ECONNREFUSED` | BD caída o env var incorrecta | Verificar `DATABASE_URL` en Render |
| `relation does not exist` / `Unknown column` | Migración pendiente | Ejecutar migración faltante |
| `Cannot GET /api/...` / `404` | Ruta no registrada | Revisar `routes/` y `server-db.js` |
| `401 Unauthorized` / `jwt malformed` | Token inválido o expirado | Revisar `JWT_SECRET` en vars de entorno |
| `CORS error` / `origin not allowed` | Origen bloqueado | Actualizar lista CORS en `server-db.js` |
| `TypeError: Cannot read properties of undefined` | Variable nula inesperada | Revisar el endpoint específico |
| `Memory limit exceeded` / `R14` | Proceso pesado en plan free | Optimizar consulta o agregar índice |
| `SIGTERM` / `Shutting down` | Render reinició el servicio | Normal en plan gratuito; revisar si persiste |

### Paso 2 — Buscar el archivo afectado
Según la categoría, buscar en:
- **Rutas**: `backend/routes/` y `backend/endpoints/`
- **Modelos**: `backend/models/`
- **Migraciones**: `backend/migrations/`
- **Config**: `backend/config/`
- **Servidor principal**: `backend/server-db.js`

### Paso 3 — Proponer solución
- Mostrar el fragmento de código exacto con el problema.
- Proponer el fix mínimo y acotado.
- Si requiere cambio en variable de entorno de Render, indicarlo claramente con:
  ```
  ⚙️ VARIABLE DE ENTORNO A ACTUALIZAR EN RENDER:
  Nombre: [NOMBRE_VAR]
  Valor: [valor o descripción]
  ```
- Si es una migración nueva, generarla con el formato del proyecto.
- Si requiere subir archivo PHP a Hostinger, indicarlo:
  ```
  📤 ARCHIVO A SUBIR MANUALMENTE A HOSTINGER:
  Ruta: [ruta/del/archivo.php]
  ```

### Paso 4 — Verificación post-fix
Indicar qué endpoint testear para confirmar que el fix funcionó:
```bash
# Desde localhost (reemplazar con la URL de Render en producción)
curl https://transportes-araucaria.onrender.com/api/[endpoint]
```

---

## Cómo usar este prompt

1. Ve al dashboard de Render.com → tu servicio → pestaña **Logs**.
2. Copia los últimos 50-100 líneas de logs relevantes.
3. Activa este prompt y pega los logs.
4. El agente los analizará y propondrá el fix.

---

> **Nota**: Dado que el plan gratuito de Render.com no incluye shell SSH, todos los cambios se aplican a través del código del repositorio. Render redespliega automáticamente al hacer push a `main`.
