# Migraciones de Base de Datos

Este directorio contiene scripts de migración para actualizar el esquema de la base de datos.

## 📋 Migraciones Disponibles

### `add-gastos-table.js` ⭐ **NUEVO**
Crea la tabla `gastos` para registrar gastos asociados a reservas.

**Cambios incluidos:**
- Crea tabla `gastos` con todos sus campos e índices
- Relaciones con reservas, conductores y vehículos
- Índices para optimizar búsquedas
- Tipos de gasto: comisión Flow, peajes, combustible, conductor, etc.

### `add-cliente-fields.js`
Agrega la tabla `clientes` y campos relacionados a la tabla `reservas`.

**Cambios incluidos:**
- Crea tabla `clientes` con todos sus campos e índices
- Agrega campo `clienteId` a tabla `reservas`
- Agrega campo `rut` a tabla `reservas`
- Crea índices para optimizar búsquedas

### `add-codigo-reserva-column.js`
Agrega el campo `codigo_reserva` único a cada reserva.

**Cambios incluidos:**
- Agrega columna `codigo_reserva` (VARCHAR(50), UNIQUE)
- Crea índice único para búsquedas rápidas
- Genera códigos automáticos para reservas existentes
- Formato: AR-YYYYMMDD-XXXX (Ej: AR-20251015-0001)

## 🚀 Cómo Ejecutar una Migración

### En Desarrollo Local

```bash
# Asegúrate de tener las variables de entorno configuradas
# (.env con credenciales de base de datos)

cd backend/migrations
node add-cliente-fields.js
```

### En Render.com

#### Opción 1: Desde la Shell de Render
1. Ve a tu servicio en Render.com
2. Haz clic en "Shell" en el menú lateral
3. Ejecuta:
   ```bash
   cd backend/migrations
   node add-cliente-fields.js
   ```

#### Opción 2: Script One-time Job
1. En Render.com, crea un nuevo "Background Worker" o "One-off Job"
2. Usa el comando:
   ```bash
   node backend/migrations/add-cliente-fields.js
   ```
3. Ejecuta el job

#### Opción 3: SSH (si está habilitado)
```bash
# Desde tu terminal local
ssh usuario@tu-servicio.render.com
cd /opt/render/project/src/backend/migrations
node add-cliente-fields.js
```

## ⚠️ Consideraciones Importantes

### Antes de Ejecutar
1. **Backup de Base de Datos**: Siempre haz un backup antes de ejecutar migraciones
2. **Revisar el Script**: Lee el contenido del script para entender qué cambios hará
3. **Verificar Conexión**: Asegúrate de que las variables de entorno estén correctamente configuradas

### Durante la Ejecución
- Las migraciones usan `IF NOT EXISTS` para evitar errores si ya se ejecutaron
- Es seguro ejecutar el mismo script múltiples veces
- El script imprimirá mensajes de progreso

### Después de Ejecutar
1. Verifica que todos los cambios se aplicaron correctamente
2. Revisa los logs en busca de errores
3. Prueba la funcionalidad en el frontend

## 🔍 Verificar que la Migración se Ejecutó

### Verificar tabla clientes
```sql
DESCRIBE clientes;
-- Debe mostrar todos los campos: id, rut, nombre, email, etc.
```

### Verificar campos en reservas
```sql
DESCRIBE reservas;
-- Debe incluir: clienteId, rut, codigo_reserva
```

### Verificar código de reserva
```sql
SELECT id, codigo_reserva, nombre, fecha FROM reservas LIMIT 10;
-- Todas las reservas deben tener un codigo_reserva único
```

### Verificar índices
```sql
SHOW INDEX FROM clientes;
SHOW INDEX FROM reservas;
-- Debe incluir idx_codigo_reserva (UNIQUE)
```

## 📝 Crear una Nueva Migración

Si necesitas crear una nueva migración:

1. Crea un nuevo archivo en este directorio: `nombre-descriptivo.js`
2. Usa esta plantilla:

```javascript
import sequelize from "../config/database.js";

async function miNuevaMigracion() {
  try {
    console.log("🔧 Iniciando migración: [nombre]...");
    
    // Tus cambios aquí
    await sequelize.query(`
      -- Tu SQL aquí
    `);
    
    console.log("✅ Migración completada exitosamente");
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

miNuevaMigracion().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
```

3. Prueba en desarrollo antes de ejecutar en producción
4. Documenta los cambios en este README

## 🆘 Solución de Problemas

### Error: "Cannot find module"
- Asegúrate de estar en el directorio correcto
- Verifica que `node_modules` esté instalado: `npm install`

### Error: "Connection refused"
- Verifica las variables de entorno de la base de datos
- Verifica que el servicio de MySQL/PostgreSQL esté corriendo

### Error: "Table already exists"
- Si el error es de una migración que usa `IF NOT EXISTS`, puedes ignorarlo
- Si no, significa que la migración ya se ejecutó

### Error: "Access denied"
- Verifica las credenciales de la base de datos
- Asegúrate de tener permisos para crear tablas y modificar esquema

## 🎯 Ejecutar Migración del Código de Reserva

**IMPORTANTE:** Esta migración debe ejecutarse en el servidor de Render después de actualizar el código.

```bash
# En Render Shell o localmente
cd backend/migrations
node add-codigo-reserva-column.js
```

Esta migración:
1. ✅ Agrega la columna `codigo_reserva` a la tabla `reservas`
2. ✅ Crea un índice único para el campo
3. ✅ Genera códigos automáticamente para todas las reservas existentes
4. ✅ Los códigos nuevos se generarán automáticamente al crear reservas

**Formato de Códigos:**
- `AR-20251015-0001` (Araucanía - Fecha - Consecutivo del día)
- `AR-20251015-0002`
- etc.

## 📚 Recursos

- [Documentación de Sequelize](https://sequelize.org/)
- [Documentación de Render](https://render.com/docs)
- [MySQL ALTER TABLE](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)

---

**Nota**: Mantén este directorio actualizado con todas las migraciones que crees para tener un historial claro de cambios en el esquema.
