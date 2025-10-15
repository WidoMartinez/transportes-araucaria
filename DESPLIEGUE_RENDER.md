# 🚀 Guía de Despliegue en Render.com

## Último PR Implementado: ID de Reserva

**Funcionalidad**: Generar código único de reserva (formato AR-YYYYMMDD-XXXX) para todas las reservas

---

## 📦 Cambios en el Backend

### Archivos Modificados:

1. ✅ `backend/models/Reserva.js` - Campo `codigoReserva` agregado
2. ✅ `backend/server-db.js` - Función de generación de código y endpoints actualizados
3. ✅ `backend/migrations/add-codigo-reserva.js` - **Nueva migración de base de datos**
4. ✅ `src/components/AdminReservas.jsx` - Visualización del código en el panel admin

### Nuevas Características:

- ✨ Generación automática de código único de reserva (formato: `AR-YYYYMMDD-XXXX`)
- ✨ Campo `codigoReserva` en modelo de Reserva con índice único
- ✨ Código generado automáticamente al crear reserva (normal y express)
- ✨ Código visible en panel administrativo (tabla y vista de detalles)
- ✨ Consecutivo diario para facilitar identificación
- 🔧 Endpoints `/enviar-reserva` y `/enviar-reserva-express` devuelven el código
- 🗃️ **Migración automática de base de datos**

---

## 🎯 Cómo Desplegar en Render.com

### ⚠️ IMPORTANTE: Migración de Base de Datos

Este PR incluye una **migración de base de datos** que debe ejecutarse antes del despliegue.

**La migración agregará:**

- ✅ Campo `codigo_reserva` en tabla `reservas` (VARCHAR(50), único)
- ✅ Índice único en `codigo_reserva` para garantizar unicidad
- ✅ Soporte para formato `AR-YYYYMMDD-XXXX`

**La migración es idempotente**: Se puede ejecutar múltiples veces sin problemas. Si las tablas/campos ya existen, los omitirá.

---

### Opción 1: Despliegue Automático (Recomendado)

Render detecta automáticamente los cambios en la rama `main`:

1. **Accede a tu Dashboard de Render.com**

   - URL: https://dashboard.render.com/

2. **Localiza tu servicio de backend**

   - Busca el servicio llamado algo como `transportes-araucaria-backend`

3. **Verifica el estado del despliegue**

   - ✅ Si dice "Live" con el commit más reciente → **Ya está desplegado**
   - ⏳ Si dice "Deploying" → **Espera a que termine (puede tardar 3-7 minutos debido a la migración)**
   - ❌ Si no se activó → **Continúa con Opción 2**

4. **Revisa los logs durante el despliegue**
   - Busca los mensajes de la migración:
     ```
     🔧 Iniciando migración: agregar campos de cliente...
     📦 Creando tabla clientes...
     ✅ Tabla clientes creada
     📦 Agregando campo clienteId a reservas...
     ✅ Campo clienteId agregado
     📦 Agregando campo rut a reservas...
     ✅ Campo rut agregado
     ✅ Migración completada exitosamente
     ```

---

### Opción 2: Trigger Manual

Si el despliegue automático no se activó:

1. **Entra a tu servicio en Render**
2. **Haz clic en el botón "Manual Deploy"**
3. **Selecciona "Deploy latest commit"**
4. **Espera 2-5 minutos** mientras Render:
   - Descarga el código actualizado
   - Instala dependencias (`npm install`)
   - Ejecuta migraciones de base de datos
   - Reinicia el servicio

---

## 🔍 Verificar el Despliegue

### 1. Revisar Logs en Render

```
Logs → Buscar mensajes como:
✅ "Database synchronized successfully"
✅ "Server is running on port XXXX"
✅ "Connected to PostgreSQL database"
```

### 2. Probar Endpoints Actualizados

Desde la consola del navegador o Postman, prueba:

```javascript
// Test endpoint de reserva - debe devolver codigoReserva
fetch("https://tu-backend.onrender.com/enviar-reserva", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		nombre: "Juan Pérez",
		email: "juan@example.com",
		telefono: "+56912345678",
		origen: "Temuco",
		destino: "Pucón",
		fecha: "2025-10-20",
		pasajeros: 2,
		totalConDescuento: 50000,
	}),
})
	.then((res) => res.json())
	.then((data) => {
		console.log("✅ Reserva creada:", data);
		console.log("📋 Código de reserva:", data.codigoReserva); // ← NUEVO CAMPO
		// Debería ver algo como: AR-20251015-0001
	});
```

### 3. Verificar Base de Datos

Revisa que la columna `codigo_reserva` exista en la tabla `reservas`:

```sql
-- Ejemplo de consulta para ver códigos de reserva
SELECT id, codigo_reserva, nombre, email, fecha, created_at
FROM reservas
ORDER BY created_at DESC
LIMIT 10;

-- Verificar que el índice único existe
SHOW INDEX FROM reservas WHERE Key_name = 'idx_reservas_codigo_reserva';
```

### 4. Verificar Respuesta del Servidor

La respuesta del endpoint ahora incluye el `codigoReserva`:

```json
{
	"success": true,
	"message": "Reserva recibida y guardada correctamente",
	"reservaId": 123,
	"codigoReserva": "AR-20251015-0001"
}
```

### 5. Verificar en Panel Administrativo

1. Ve a `/admin?panel=reservas`
2. Verifica que las reservas muestren el código bajo el ID
3. Abre los detalles de una reserva
4. El código debe mostrarse en un cuadro azul destacado

---

## ⚠️ Posibles Problemas y Soluciones

### Problema 1: Error 500 en endpoints

**Solución**:

- Verifica los logs de Render
- Asegúrate que las migraciones se ejecutaron correctamente
- Revisa que la base de datos tenga la columna `codigo_reserva`

### Problema 2: Código de reserva no se genera

**Causa**: La migración no se ejecutó correctamente
**Solución**:

- Ejecuta manualmente la migración: `node backend/migrations/add-codigo-reserva.js`
- Verifica que la columna `codigo_reserva` existe en la tabla `reservas`
- Revisa los logs del servidor para errores

### Problema 3: Código duplicado (error de unicidad)

**Causa**: Poco probable, pero podría ocurrir con alta concurrencia
**Solución**:

- El sistema reintentar automáticamente con un nuevo consecutivo
- Si persiste, revisa que el índice único esté correctamente creado

---

## 📊 Verificación Post-Despliegue

### Checklist:

- [ ] Render muestra el servicio como "Live"
- [ ] Los logs no muestran errores
- [ ] El endpoint `/enviar-reserva` acepta `clienteId` y `rut`
- [ ] El endpoint `/enviar-reserva-express` acepta `clienteId` y `rut`
- [ ] La validación de RUT funciona correctamente
- [ ] Los datos se persisten en la base de datos
- [ ] El frontend puede crear reservas sin errores

---

## 🔗 Enlaces Útiles

- **Dashboard Render**: https://dashboard.render.com/
- **Documentación Render**: https://render.com/docs
- **Repositorio GitHub**: https://github.com/WidoMartinez/transportes-araucaria
- **PR Implementado**: https://github.com/WidoMartinez/transportes-araucaria/pull/68

---

## 📝 Notas Importantes

⚠️ **IMPORTANTE**: Este despliegue modifica el backend en Render.com. Asegúrate de:

1. Hacer backup de la base de datos antes de grandes cambios
2. Probar en un ambiente de desarrollo primero (si existe)
3. Monitorear los logs durante las primeras horas post-despliegue
4. Tener un plan de rollback si algo falla

✅ **Buenas Prácticas**:

- Siempre revisa los logs después del despliegue
- Prueba los endpoints críticos manualmente
- Monitorea el uso de recursos en Render
- Documenta cualquier problema encontrado

---

**Última actualización**: 11 de octubre de 2025
**Versión del Backend**: Commit `526ae71` (PR #68)
