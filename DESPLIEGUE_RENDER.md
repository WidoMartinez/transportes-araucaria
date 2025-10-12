# 🚀 Guía de Despliegue en Render.com

## Último PR Implementado: #68

**Funcionalidad**: Persistir clienteId y RUT en endpoints de reserva + validación de formato RUT

---

## 📦 Cambios en el Backend

### Archivos Modificados:

1. ✅ `backend/models/Cliente.js` - Validación de RUT chileno
2. ✅ `backend/models/Reserva.js` - Campos clienteId y rut agregados
3. ✅ `backend/server-db.js` - Endpoints actualizados con clienteId y rut
4. ✅ `backend/migrations/add-cliente-fields.js` - **Migración de base de datos**
5. ✅ `backend/package.json` - Scripts para ejecutar migración
6. ✅ `render.yaml` - Configuración para ejecutar migración en despliegue

### Nuevas Características:

- ✨ Validación automática de formato RUT chileno (XX.XXX.XXX-X o XXXXXXXX-X)
- ✨ Persistencia de `clienteId` en tablas de reservas
- ✨ Persistencia de `rut` en tablas de reservas
- 🔧 Endpoints `/enviar-reserva` y `/enviar-reserva-express` actualizados
- 🗃️ **Migración automática de base de datos en cada despliegue**

---

## 🎯 Cómo Desplegar en Render.com

### ⚠️ IMPORTANTE: Migración de Base de Datos

Este PR incluye una **migración de base de datos** que se ejecutará automáticamente al desplegar.

**La migración agregará:**

- ✅ Tabla `clientes` (si no existe)
- ✅ Campo `clienteId` en tabla `reservas`
- ✅ Campo `rut` en tabla `reservas`
- ✅ Índices para optimizar consultas

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
// Test endpoint de reserva con nuevos campos
fetch("https://tu-backend.onrender.com/enviar-reserva", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		nombre: "Juan Pérez",
		email: "juan@example.com",
		telefono: "+56912345678",
		clienteId: 1, // ← NUEVO CAMPO
		rut: "12.345.678-9", // ← NUEVO CAMPO
		origen: "Temuco",
		destino: "Pucón",
		fecha: "2025-10-20",
		pasajeros: 2,
	}),
});
```

### 3. Verificar Base de Datos

Revisa que las columnas `clienteId` y `rut` existan en la tabla `reservas`:

```sql
SELECT clienteId, rut, nombre, email FROM reservas LIMIT 5;
```

---

## ⚠️ Posibles Problemas y Soluciones

### Problema 1: Error 500 en endpoints

**Solución**:

- Verifica los logs de Render
- Asegúrate que las migraciones se ejecutaron correctamente
- Revisa que la base de datos tenga las columnas nuevas

### Problema 2: Validación de RUT falla

**Causa**: El formato del RUT no coincide con el regex
**Solución**:

- Usar formato `12.345.678-9` (con puntos y guión)
- O formato `12345678-9` (sin puntos, con guión)

### Problema 3: clienteId null en base de datos

**Causa**: El frontend no está enviando el campo
**Solución**:

- Actualiza también el frontend (ya incluido en el PR)
- Verifica que `datosReserva.clienteId` se esté enviando desde el formulario

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
