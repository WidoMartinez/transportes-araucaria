# Configuración del Token de Administrador

## Problema Resuelto
Error 401 al intentar guardar configuraciones de tarifa dinámica desde el panel de administración.

## Causa
Las rutas administrativas del backend están protegidas con un token de autenticación (`ADMIN_TOKEN`), pero el frontend no tenía configurado este token correctamente.

## Solución Aplicada

### 1. Archivos Creados/Actualizados

#### Frontend:
- ✅ **`.env`** - Configuración local con el token
- ✅ **`.env.example`** - Ejemplo para otros desarrolladores

#### Backend:
- ✅ **`backend/.env`** - Agregado `ADMIN_TOKEN`
- ✅ **`backend/env.example`** - Documentado `ADMIN_TOKEN`

### 2. Token Configurado
```
ADMIN_TOKEN=araucaria-admin-2024-secure-token-xyz789
```

Este token debe estar **idéntico** en:
- `backend/.env` → `ADMIN_TOKEN`
- `.env` (frontend) → `VITE_ADMIN_TOKEN`

## Pasos para Aplicar los Cambios

### Desarrollo Local:

1. **Detener los servidores** (Ctrl+C en ambas terminales)

2. **Reiniciar el backend:**
   ```bash
   cd backend
   node server-db.js
   ```

3. **Reiniciar el frontend:**
   ```bash
   npm run dev
   ```

4. **Limpiar caché del navegador** (Ctrl+Shift+R o Ctrl+F5)

### Producción (Render.com):

1. **Ir al dashboard de Render.com**
2. **Seleccionar el servicio backend**
3. **Ir a "Environment" → "Environment Variables"**
4. **Agregar variable:**
   - **Key:** `ADMIN_TOKEN`
   - **Value:** `araucaria-admin-2024-secure-token-xyz789`
5. **Guardar y redesplegar**

### Producción Frontend (Hostinger/Netlify/Vercel):

Si el frontend está desplegado en un servicio de hosting:

1. **Configurar variable de entorno en el servicio:**
   - **Variable:** `VITE_ADMIN_TOKEN`
   - **Valor:** `araucaria-admin-2024-secure-token-xyz789`

2. **Reconstruir y redesplegar**

## Verificar que Funciona

1. Abre el panel de administración
2. Ve a "Tarifa Dinámica"
3. Edita una configuración y guarda
4. **NO debe aparecer error 401**
5. En consola del navegador verás: `✅ Configuración guardada correctamente`

## Seguridad

⚠️ **IMPORTANTE:**
- El archivo `.env` NO se sube a Git (está en `.gitignore`)
- Usa tokens diferentes para desarrollo y producción
- Cambia el token regularmente
- No compartas el token en mensajes públicos

## Cambiar el Token en el Futuro

1. Generar un nuevo token aleatorio:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Actualizar en ambos archivos `.env` (backend y frontend)

3. Reiniciar servidores

4. Actualizar en Render.com (producción)
