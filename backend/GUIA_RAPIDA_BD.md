# 🚀 Guía Rápida de Base de Datos

## ⚡ Comandos Esenciales

### Conectar a la Base de Datos
```bash
# Verificar conexión
node backend/test-connection.js

# Ver estado de la BD
node backend/test-db.js
```

### Ejecutar Migraciones
```bash
# Aplicar todas las migraciones
npm run migrate

# Migración específica
node backend/migrations/001_add_enhanced_fields.js up
node backend/migrations/002_create_auditoria.js up

# Revertir migración
node backend/migrations/001_add_enhanced_fields.js down
```

### Iniciar Servidor
```bash
# Desarrollo
npm run dev

# Producción con BD
npm start
```

## 📋 Estructura de Tablas

### RESERVAS (Principal)
```javascript
{
  // Obligatorio en Hero Express
  nombre: "Juan Pérez",
  email: "juan@email.com",
  telefono: "+56912345678",
  origen: "Aeropuerto La Araucanía",
  destino: "Pucón",
  fecha: "2024-12-15",
  pasajeros: 2,
  
  // Opcional - Se completa después
  hora: "14:30",
  numeroVuelo: "LA1234",
  hotel: "Hotel Antumalal",
  equipajeEspecial: "2 bicicletas",
  sillaInfantil: false,
  
  // Calculado automáticamente
  precio: 45000,
  vehiculo: "Sedan",
  abonoSugerido: 18000,
  saldoPendiente: 27000,
  totalConDescuento: 38250,
  
  // Estado
  estado: "pendiente_detalles",
  estadoPago: "pagado",
  metodoPago: "flow",
  referenciaPago: "FLW123456"
}
```

### Estados Posibles

**Estados de Reserva:**
- `pendiente`: Creada, esperando pago
- `pendiente_detalles`: Pagada, faltan detalles
- `confirmada`: Completa y confirmada
- `completada`: Servicio finalizado
- `cancelada`: Reserva cancelada

**Estados de Pago:**
- `pendiente`: Esperando pago
- `pagado`: Pago confirmado
- `fallido`: Pago rechazado
- `reembolsado`: Dinero devuelto

## 🔍 Consultas Comunes

### Buscar Reservas

```javascript
// Por email
const reservas = await Reserva.findAll({
  where: { email: 'cliente@email.com' }
});

// Por rango de fechas
const reservas = await Reserva.findAll({
  where: {
    fecha: {
      [Op.between]: ['2024-12-01', '2024-12-31']
    }
  }
});

// Pendientes de completar
const pendientes = await Reserva.findAll({
  where: {
    estado: 'pendiente_detalles',
    estadoPago: 'pagado'
  },
  order: [['fecha', 'ASC']]
});
```

### Actualizar Reserva

```javascript
// Completar detalles después del pago
await reserva.update({
  hora: '14:30',
  numeroVuelo: 'LA1234',
  hotel: 'Hotel Antumalal',
  estado: 'confirmada'
});

// Asignar conductor
await reserva.update({
  conductor_nombre: 'Carlos López',
  conductor_telefono: '+56987654321',
  patente_vehiculo: 'ABCD12'
});
```

### Reportes

```sql
-- Reservas por día
SELECT DATE(fecha) as dia, COUNT(*) as total
FROM reservas
WHERE estadoPago = 'pagado'
GROUP BY DATE(fecha)
ORDER BY dia DESC;

-- Ingresos por destino
SELECT destino, SUM(totalConDescuento) as ingresos
FROM reservas
WHERE estadoPago = 'pagado'
GROUP BY destino
ORDER BY ingresos DESC;

-- Tasa de conversión
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN estadoPago = 'pagado' THEN 1 ELSE 0 END) as pagadas,
  ROUND(SUM(CASE WHEN estadoPago = 'pagado' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as conversion
FROM reservas
WHERE source = 'express';
```

## 🎨 Flujo de Reserva Express

### Paso 1: Crear Reserva (Datos Mínimos)
```javascript
const reserva = await Reserva.create({
  nombre: formData.nombre,
  email: formData.email,
  telefono: formData.telefono,
  origen: formData.origen,
  destino: formData.destino,
  fecha: formData.fecha,
  pasajeros: formData.pasajeros,
  precio: precioCalculado,
  vehiculo: vehiculoAsignado,
  abonoSugerido: precioCalculado * 0.4,
  saldoPendiente: precioCalculado * 0.6,
  totalConDescuento: precioConDescuentos,
  estado: 'pendiente',
  estadoPago: 'pendiente',
  source: 'express'
});
```

### Paso 2: Confirmar Pago
```javascript
await reserva.update({
  metodoPago: 'flow',
  estadoPago: 'pagado',
  referenciaPago: paymentReference,
  estado: 'pendiente_detalles'
});
```

### Paso 3: Completar Detalles
```javascript
await reserva.update({
  hora: '14:30',
  numeroVuelo: 'LA1234',
  hotel: 'Hotel Antumalal',
  equipajeEspecial: '2 maletas grandes',
  sillaInfantil: false,
  mensaje: 'Llegada internacional',
  estado: 'confirmada'
});
```

## 🔧 Mantenimiento

### Backup Manual
```bash
# Desde línea de comandos
mysqldump -u usuario -p nombre_bd > backup_$(date +%Y%m%d).sql

# Restaurar
mysql -u usuario -p nombre_bd < backup_20240115.sql
```

### Limpiar Datos de Prueba
```sql
-- Eliminar reservas de prueba
DELETE FROM reservas 
WHERE email LIKE '%@test.com' 
OR email LIKE '%@ejemplo.%';

-- Limpiar reservas antiguas canceladas (más de 1 año)
DELETE FROM reservas 
WHERE estado = 'cancelada' 
AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### Verificar Integridad
```sql
-- Contar registros
SELECT 'reservas' as tabla, COUNT(*) as registros FROM reservas
UNION ALL
SELECT 'destinos', COUNT(*) FROM destinos
UNION ALL
SELECT 'codigos_descuento', COUNT(*) FROM codigos_descuento
UNION ALL
SELECT 'promociones', COUNT(*) FROM promociones;

-- Verificar índices
SHOW INDEX FROM reservas;

-- Tamaño de tablas
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = DATABASE()
ORDER BY size_mb DESC;
```

## ⚠️ Troubleshooting

### Error: "Cannot connect to database"
```bash
# 1. Verificar variables de entorno
cat backend/.env | grep DB_

# 2. Verificar conexión
node backend/test-connection.js

# 3. Verificar acceso remoto en Hostinger
# Panel → MySQL Remoto → Agregar IP
```

### Error: "Table doesn't exist"
```bash
# Ejecutar migraciones
npm run migrate

# O sincronizar modelos (desarrollo)
node -e "import('./backend/config/database.js').then(db => db.syncDatabase())"
```

### Error: "Duplicate entry"
```bash
# Verificar restricciones UNIQUE
SHOW INDEX FROM reservas WHERE Non_unique = 0;

# Si es código de descuento duplicado
SELECT * FROM codigos_descuento WHERE codigo = 'CODIGO';
```

### Logs Lentos
```sql
-- Habilitar slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Ver consultas lentas
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

## 📊 Índices Recomendados

Si las consultas son lentas, agregar estos índices:

```sql
-- Búsqueda por múltiples criterios
CREATE INDEX idx_estado_fecha ON reservas(estado, fecha);
CREATE INDEX idx_destino_fecha ON reservas(destino, fecha);

-- Reportes
CREATE INDEX idx_created_source ON reservas(created_at, source);
CREATE INDEX idx_estadoPago_fecha ON reservas(estadoPago, fecha);
```

## 🎯 Best Practices

### ✅ Hacer
- Siempre usar transacciones para operaciones críticas
- Validar datos antes de insertar
- Usar índices en campos de búsqueda frecuente
- Hacer backups antes de migraciones
- Probar en desarrollo antes de producción

### ❌ Evitar
- No usar SELECT * en producción
- No almacenar contraseñas en texto plano
- No hacer cambios directos en producción sin backup
- No ignorar errores de integridad
- No exponer datos sensibles en logs

## 📞 Recursos

- **Documentación completa**: `backend/DISEÑO_BASE_DATOS.md`
- **Diagrama ER**: `backend/DIAGRAMA_ER.md`
- **Migraciones**: `backend/migrations/README.md`
- **Sequelize Docs**: https://sequelize.org/docs/v6/

## 🆘 Soporte Rápido

```javascript
// Modo debug
process.env.NODE_ENV = 'development';
process.env.DEBUG = 'sequelize:*';

// Ver todas las consultas SQL
import sequelize from './config/database.js';
sequelize.options.logging = console.log;
```

---

**Tip**: Guarda este archivo en favoritos para acceso rápido durante el desarrollo.
