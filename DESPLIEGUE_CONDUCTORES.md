# 🚀 Guía de Despliegue - Sistema de Conductores y Vehículos

## Resumen de Cambios

Este PR agrega un sistema completo de gestión de conductores y vehículos para Transportes Araucaria, permitiendo:

- ✅ Registrar conductores con información completa
- ✅ Registrar vehículos con patente única
- ✅ Asignar conductor y vehículo a reservas
- ✅ Llevar historial de viajes por conductor
- ✅ Registrar montos pagados a conductores (manual)
- ✅ Notificar automáticamente al cliente con info de conductor y vehículo
- ✅ Mostrar solo últimos 4 dígitos de patente por seguridad

## 📋 Pasos para Desplegar

### 1. Backend en Render.com

El backend se desplegará automáticamente cuando se haga merge de este PR.

#### ¿Qué sucederá automáticamente?

1. ✅ Render.com detectará los cambios en el repositorio
2. ✅ Ejecutará `npm install` en el directorio backend
3. ✅ Ejecutará `npm run start:migrate` que incluye:
   - Migración de clientes (ya existente)
   - **Migración de conductores y vehículos (NUEVA)**
   - Inicio del servidor

#### Verificar el Despliegue

1. Ir al dashboard de Render.com
2. Buscar el servicio `transportes-araucaria-backend`
3. Ver los logs del despliegue
4. Buscar estos mensajes:

```
🔧 Iniciando migración: agregar conductores y vehículos...
📦 Creando tabla conductores...
✅ Tabla conductores creada
📦 Creando tabla vehiculos...
✅ Tabla vehiculos creada
📦 Creando tabla viajes_conductor...
✅ Tabla viajes_conductor creada
📦 Agregando campo conductor_id a reservas...
✅ Campo conductor_id agregado
📦 Agregando campo vehiculo_id a reservas...
✅ Campo vehiculo_id agregado
✅ Migración completada exitosamente
```

5. Verificar que el servidor inicia correctamente:
```
🚀 Servidor ejecutándose en puerto 10000
```

#### Probar los Endpoints

Usar Postman, Thunder Client o curl:

```bash
# Verificar salud del servidor
curl https://transportes-araucaria.onrender.com/health

# Listar conductores (debería devolver array vacío al inicio)
curl https://transportes-araucaria.onrender.com/api/conductores

# Listar vehículos
curl https://transportes-araucaria.onrender.com/api/vehiculos
```

### 2. Notificaciones por Email (Hostinger)

⚠️ **ACCIÓN MANUAL REQUERIDA**

Las notificaciones por email cuando se asigna conductor/vehículo requieren un archivo PHP en el servidor de Hostinger.

#### Pasos:

1. **Copiar el archivo template al servidor**
   
   Archivo: `enviar_notificacion_asignacion.php.template`
   
   a. Conectarse al servidor de Hostinger vía FTP o File Manager
   b. Navegar al directorio donde está `enviar_correo_mejorado.php`
   c. Copiar el contenido de `enviar_notificacion_asignacion.php.template`
   d. Crear nuevo archivo: `enviar_notificacion_asignacion.php`
   e. Pegar el contenido

2. **Verificar configuración SMTP**

   El archivo usa las mismas credenciales que `enviar_correo_mejorado.php`:
   ```php
   $emailHost = 'smtp.hostinger.com';
   $emailPort = 465;
   $emailUser = 'contacto@transportesaraucaria.cl';
   $emailPass = 'TransportesAraucaria7.';
   ```

3. **Habilitar en el backend**

   Editar `backend/utils/emailHelpers.js` y descomentar estas líneas:

   ```javascript
   // Líneas 86-93 aproximadamente
   const response = await fetch(emailUrl, {
       method: "POST",
       headers: {
           "Content-Type": "application/json",
       },
       body: JSON.stringify(payload),
   });
   
   return await response.json();
   ```

   Y comentar esta línea:
   ```javascript
   // return { success: true, message: "Notificación registrada (desarrollo)" };
   ```

4. **Volver a desplegar el backend** (opcional, si se quieren activar las notificaciones inmediatamente)

### 3. Verificar la Base de Datos

Conectarse a la base de datos PostgreSQL en Render.com y verificar:

```sql
-- Verificar que las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conductores', 'vehiculos', 'viajes_conductor');

-- Verificar nuevos campos en reservas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservas' 
AND column_name IN ('conductor_id', 'vehiculo_id');

-- Ver estructura de tabla conductores
\d conductores

-- Ver estructura de tabla vehiculos
\d vehiculos

-- Ver estructura de tabla viajes_conductor
\d viajes_conductor
```

## 🧪 Testing Manual

### 1. Crear un Conductor

```bash
curl -X POST https://transportes-araucaria.onrender.com/api/conductores \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "telefono": "+56912345678",
    "email": "juan@example.com",
    "notas": "Conductor experimentado"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Conductor creado exitosamente",
  "conductor": {
    "id": 1,
    "nombre": "Juan Pérez",
    "telefono": "+56912345678",
    "email": "juan@example.com",
    "activo": true
  }
}
```

### 2. Crear un Vehículo

```bash
curl -X POST https://transportes-araucaria.onrender.com/api/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "patente": "ABCD12",
    "tipo": "SUV",
    "capacidad": 7,
    "marca": "Toyota",
    "modelo": "RAV4",
    "anio": 2022
  }'
```

### 3. Asignar a una Reserva

```bash
curl -X PUT https://transportes-araucaria.onrender.com/api/reservas/123/asignar \
  -H "Content-Type: application/json" \
  -d '{
    "conductorId": 1,
    "vehiculoId": 1,
    "montoPago": 25000,
    "notas": "Viaje al aeropuerto"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Conductor y vehículo asignados exitosamente",
  "reserva": {
    "id": 123,
    "conductorId": 1,
    "vehiculoId": 1,
    "conductor": { "nombre": "Juan Pérez" },
    "vehiculo": { "tipo": "SUV", "patente": "ABCD12" },
    "conductorDisplay": "Juan Pérez",
    "vehiculoDisplay": "SUV (***CD12)"
  }
}
```

**Verificar:**
- ✅ En los logs del backend debe aparecer: `✅ Notificación de asignación enviada para reserva 123`
- ✅ Si las notificaciones PHP están habilitadas, el cliente recibirá un email

### 4. Ver Historial de Viajes de un Conductor

```bash
curl https://transportes-araucaria.onrender.com/api/conductores/1/viajes
```

## 📊 Monitoreo Post-Despliegue

### Logs a Vigilar

En el dashboard de Render.com, monitorear:

1. **Logs de migración** (solo en el primer despliegue):
   - ✅ Creación de tablas
   - ✅ Creación de índices
   - ⚠️ Advertencias (no son críticas si las tablas ya existen)

2. **Logs de operación**:
   ```
   📧 Notificación de asignación de conductor/vehículo: {...}
   ✅ Notificación de asignación enviada para reserva X
   ```

3. **Errores a observar**:
   - ❌ Error de conexión a base de datos
   - ❌ Error en migración (columnas duplicadas, etc.)
   - ⚠️ Error enviando notificación (no crítico)

### Métricas a Revisar

- Tiempo de respuesta de endpoints (debería ser < 1 segundo)
- Tasa de error (debería ser 0%)
- Uso de memoria (no debería aumentar significativamente)

## 🔧 Rollback (si algo sale mal)

Si hay problemas después del despliegue:

### Opción 1: Rollback en Render.com

1. Ir al dashboard de Render.com
2. Seleccionar el servicio `transportes-araucaria-backend`
3. En la pestaña "Deploys", buscar el deploy anterior exitoso
4. Hacer clic en "Rollback to this deploy"

### Opción 2: Revertir Migración (extremo)

**⚠️ SOLO SI ES ABSOLUTAMENTE NECESARIO**

```sql
-- Eliminar campos de reservas
ALTER TABLE reservas DROP COLUMN conductor_id;
ALTER TABLE reservas DROP COLUMN vehiculo_id;

-- Eliminar tablas (perderá datos!)
DROP TABLE IF EXISTS viajes_conductor;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS conductores;
```

**Nota:** Esto eliminará TODOS los datos de conductores, vehículos y viajes registrados.

## 📝 Checklist Post-Despliegue

- [ ] Backend desplegado correctamente en Render.com
- [ ] Migración ejecutada sin errores
- [ ] Tablas creadas: `conductores`, `vehiculos`, `viajes_conductor`
- [ ] Campos agregados a `reservas`: `conductor_id`, `vehiculo_id`
- [ ] Endpoints respondiendo correctamente:
  - [ ] GET /api/conductores
  - [ ] POST /api/conductores
  - [ ] GET /api/vehiculos
  - [ ] POST /api/vehiculos
  - [ ] PUT /api/reservas/:id/asignar
- [ ] Logs mostrando operaciones correctamente
- [ ] (Opcional) Archivo PHP copiado a Hostinger
- [ ] (Opcional) Notificaciones por email funcionando
- [ ] Documentación revisada: `SISTEMA_CONDUCTORES_VEHICULOS.md`

## 🆘 Soporte

Si hay problemas durante el despliegue:

1. Revisar logs en Render.com dashboard
2. Consultar documentación: `SISTEMA_CONDUCTORES_VEHICULOS.md`
3. Verificar que las variables de entorno están configuradas
4. Revisar este documento para pasos de rollback

## 📚 Documentación Relacionada

- `SISTEMA_CONDUCTORES_VEHICULOS.md` - Documentación completa del sistema
- `backend/models/Conductor.js` - Modelo de conductor
- `backend/models/Vehiculo.js` - Modelo de vehículo
- `backend/models/ViajesConductor.js` - Modelo de viajes
- `backend/migrations/add-conductores-vehiculos.js` - Script de migración
- `backend/utils/emailHelpers.js` - Utilidades para emails
- `enviar_notificacion_asignacion.php.template` - Template para notificaciones PHP

---

**Fecha de creación**: Octubre 2025  
**Desarrollador**: GitHub Copilot  
**Estado**: ✅ Listo para despliegue
