# 📂 Migraciones de Base de Datos

Este directorio contiene las migraciones para evolucionar el esquema de la base de datos de Transportes Araucaria de manera controlada y reversible.

## 📋 Migraciones Disponibles

### 001_add_enhanced_fields.js
**Descripción**: Agrega campos mejorados a la tabla `reservas` para soportar funcionalidades avanzadas.

**Campos agregados:**
- `latitud` y `longitud`: Geolocalización del punto de recogida
- `calificacion` y `comentario_cliente`: Sistema de reviews
- `fecha_completada`: Tracking de finalización del servicio
- `conductor_id`, `conductor_nombre`, `conductor_telefono`, `patente_vehiculo`: Información del conductor y vehículo asignado
- `notificaciones_enviadas`: Historial de notificaciones
- `ultimo_recordatorio`: Control de recordatorios

**Índices agregados:**
- `idx_fecha_estado`: Búsqueda optimizada por fecha y estado
- `idx_created_estado_pago`: Reportes financieros
- `idx_conductor`: Consultas por conductor

### 002_create_auditoria.js
**Descripción**: Crea la tabla `auditoria_reservas` para tracking completo de cambios en las reservas.

**Características:**
- Registro automático de cambios mediante triggers
- Tracking de usuario e IP
- Auditoría de campos críticos (estado, pago, fecha, hora, precio)
- Índices optimizados para consultas de auditoría

## 🚀 Cómo Ejecutar Migraciones

### Ejecutar una migración específica

```bash
# Aplicar migración (up)
node backend/migrations/001_add_enhanced_fields.js up

# Revertir migración (down)
node backend/migrations/001_add_enhanced_fields.js down
```

### Ejecutar todas las migraciones

```bash
# Desde el directorio backend
node migrations/001_add_enhanced_fields.js up
node migrations/002_create_auditoria.js up
```

### Revertir todas las migraciones

```bash
# Ejecutar en orden inverso
node migrations/002_create_auditoria.js down
node migrations/001_add_enhanced_fields.js down
```

## 📝 Crear una Nueva Migración

### Estructura básica

```javascript
// backend/migrations/00X_nombre_descriptivo.js
import sequelize from '../config/database.js';

async function up() {
  try {
    console.log('🔧 Ejecutando migración...');
    
    // Tu código de migración aquí
    await sequelize.query(`
      -- SQL statements
    `);
    
    console.log('✅ Migración completada');
    return { success: true };
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('⏮️ Revirtiendo migración...');
    
    // Código para revertir cambios
    
    console.log('✅ Rollback completado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error en rollback:', error);
    throw error;
  }
}

// Ejecutar desde línea de comandos
if (import.meta.url === `file://${process.argv[1]}`) {
  const action = process.argv[2] || 'up';
  
  (async () => {
    try {
      if (action === 'up') {
        await up();
      } else if (action === 'down') {
        await down();
      }
      process.exit(0);
    } catch (error) {
      console.error('💥 Error:', error);
      process.exit(1);
    } finally {
      await sequelize.close();
    }
  })();
}

export { up, down };
export default up;
```

## ⚠️ Consideraciones Importantes

### Antes de Ejecutar Migraciones

1. **Backup de la Base de Datos**
   ```bash
   # Crear backup desde el panel de Hostinger o usando mysqldump
   mysqldump -u usuario -p nombre_bd > backup_antes_migracion.sql
   ```

2. **Probar en Entorno de Desarrollo**
   - Siempre probar migraciones en desarrollo antes de producción
   - Verificar que los cambios no afecten funcionalidad existente

3. **Verificar Conexión a BD**
   ```bash
   node backend/test-connection.js
   ```

### Durante la Migración

- ✅ Las migraciones son idempotentes (se pueden ejecutar múltiples veces)
- ✅ Verifican existencia de columnas/tablas antes de crear
- ✅ Los errores no críticos se registran como warnings
- ⚠️ Algunas operaciones pueden tardar en bases de datos grandes

### Después de la Migración

1. **Verificar cambios**
   ```sql
   -- Verificar nuevas columnas
   DESCRIBE reservas;
   
   -- Verificar nueva tabla de auditoría
   SHOW TABLES LIKE 'auditoria_reservas';
   
   -- Verificar índices
   SHOW INDEX FROM reservas;
   ```

2. **Probar funcionalidad**
   - Crear una reserva de prueba
   - Verificar que los nuevos campos funcionan
   - Revisar logs de auditoría

## 🔄 Orden de Ejecución

**Importante**: Las migraciones deben ejecutarse en orden numérico:

1. ✅ 001_add_enhanced_fields.js (Primero)
2. ✅ 002_create_auditoria.js (Después)

Para rollback, ejecutar en orden inverso:

1. ❌ 002_create_auditoria.js (Primero)
2. ❌ 001_add_enhanced_fields.js (Después)

## 📊 Estado de Migraciones

| # | Nombre | Estado | Fecha | Notas |
|---|--------|--------|-------|-------|
| 001 | add_enhanced_fields | ⏳ Pendiente | - | Campos opcionales, no afecta sistema actual |
| 002 | create_auditoria | ⏳ Pendiente | - | Tabla nueva, triggers automáticos |

## 🐛 Solución de Problemas

### Error: "Table already exists"
```bash
# La migración ya fue ejecutada o la tabla existe
# Verificar con:
SHOW TABLES;
```

### Error: "Column already exists"
```bash
# Las migraciones verifican esto automáticamente
# Si ves este error, la columna ya fue agregada anteriormente
```

### Error: "Foreign key constraint fails"
```bash
# Verificar que la tabla referenciada existe
# Para tabla auditoria_reservas, la tabla reservas debe existir primero
```

### Revertir cambios manualmente
```sql
-- Si una migración falla a medio camino
-- Identificar qué columnas se agregaron
SHOW COLUMNS FROM reservas;

-- Eliminar columnas específicas si es necesario
ALTER TABLE reservas DROP COLUMN nombre_columna;
```

## 📚 Referencias

- Diseño completo de BD: `backend/DISEÑO_BASE_DATOS.md`
- Documentación de migración original: `backend/MIGRATION_README.md`
- Configuración de BD: `backend/config/database.js`
- Modelos Sequelize: `backend/models/`

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs del servidor
2. Verificar conexión a base de datos
3. Comprobar permisos del usuario de BD
4. Consultar documentación de MySQL/Sequelize

---

**Última actualización**: 2025-01-11
**Versión**: 1.0
