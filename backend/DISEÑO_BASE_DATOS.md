# 🗄️ Diseño de Sistema de Base de Datos - Transportes Araucaria

## 📋 Resumen Ejecutivo

Este documento describe el diseño completo del sistema de base de datos para la plataforma de reservas de Transportes Araucaria, alineado con el nuevo formulario de reservas express implementado en el componente HeroExpress.

## 🎯 Objetivos del Sistema

1. **Persistencia robusta**: Almacenar todas las reservas y configuraciones de manera permanente
2. **Flujo express optimizado**: Soportar reservas rápidas en 2 pasos con datos mínimos
3. **Completitud posterior**: Permitir agregar detalles después del pago
4. **Trazabilidad completa**: Auditoría de todos los cambios y estados
5. **Escalabilidad**: Preparado para crecimiento futuro

## 📊 Diagrama de Entidad-Relación

```
┌─────────────────────┐
│     DESTINOS        │
├─────────────────────┤
│ id (PK)             │
│ nombre (UNIQUE)     │
│ precioIda           │
│ precioVuelta        │
│ precioIdaVuelta     │
│ activo              │
│ orden               │
│ descripcion         │
│ tiempo              │
│ imagen              │
│ maxPasajeros        │
│ minHorasAnticipacion│
│ created_at          │
│ updated_at          │
└─────────────────────┘
         │
         │ 1:N
         ↓
┌─────────────────────┐      ┌──────────────────────┐
│     RESERVAS        │←────→│  CODIGOS_DESCUENTO   │
├─────────────────────┤ N:1  ├──────────────────────┤
│ id (PK)             │      │ id (PK)              │
│ nombre              │      │ codigo (UNIQUE)      │
│ email (INDEX)       │      │ descripcion          │
│ telefono            │      │ tipo                 │
│ origen              │      │ valor                │
│ destino             │      │ activo               │
│ fecha (INDEX)       │      │ limiteUsos           │
│ hora                │      │ usosActuales         │
│ pasajeros           │      │ fechaVencimiento     │
│ precio              │      │ destinosAplicables   │
│ vehiculo            │      │ montoMinimo          │
│ numeroVuelo         │      │ combinable           │
│ hotel               │      │ exclusivo            │
│ equipajeEspecial    │      │ fechaCreacion        │
│ sillaInfantil       │      │ creadoPor            │
│ idaVuelta           │      │ limiteUsosPorUsuario │
│ fechaRegreso        │      │ usuariosQueUsaron    │
│ horaRegreso         │      │ created_at           │
│ abonoSugerido       │      │ updated_at           │
│ saldoPendiente      │      └──────────────────────┘
│ descuentoBase       │
│ descuentoPromocion  │      ┌──────────────────────┐
│ descuentoRoundTrip  │      │    PROMOCIONES       │
│ descuentoOnline     │      ├──────────────────────┤
│ totalConDescuento   │      │ id (PK)              │
│ mensaje             │      │ nombre               │
│ source              │      │ dia (ENUM)           │
│ estado (INDEX)      │      │ tipo                 │
│ ipAddress           │      │ valor                │
│ userAgent           │      │ activo               │
│ codigoDescuento     │      │ descripcion          │
│ metodoPago          │      │ created_at           │
│ estadoPago          │      │ updated_at           │
│ referenciaPago      │      └──────────────────────┘
│ observaciones       │
│ created_at (INDEX)  │      ┌──────────────────────┐
│ updated_at          │      │ DESCUENTOS_GLOBALES  │
└─────────────────────┘      ├──────────────────────┤
                             │ id (PK)              │
                             │ tipo (UNIQUE)        │
                             │ nombre               │
                             │ valor                │
                             │ activo               │
                             │ descripcion          │
                             │ created_at           │
                             │ updated_at           │
                             └──────────────────────┘
```

## 📑 Especificación Detallada de Tablas

### 1. Tabla: `reservas`

**Propósito**: Almacenar todas las reservas del sistema, tanto express como completas.

#### Campos Principales

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `id` | INTEGER | Identificador único autoincrementable | PRIMARY KEY |
| `nombre` | VARCHAR(255) | Nombre completo del pasajero | NOT NULL |
| `email` | VARCHAR(255) | Correo electrónico | NOT NULL, INDEX |
| `telefono` | VARCHAR(50) | Teléfono de contacto | NOT NULL |

#### Datos del Viaje

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `origen` | VARCHAR(255) | Punto de origen | NOT NULL |
| `destino` | VARCHAR(255) | Punto de destino | NOT NULL |
| `fecha` | DATE | Fecha del traslado | NOT NULL, INDEX |
| `hora` | TIME | Hora del traslado | DEFAULT '08:00' |
| `pasajeros` | INTEGER | Número de pasajeros | NOT NULL, DEFAULT 1 |

#### Detalles Adicionales (Opcionales)

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `numeroVuelo` | VARCHAR(50) | Número de vuelo | NULL |
| `hotel` | VARCHAR(255) | Hotel de destino | NULL |
| `equipajeEspecial` | TEXT | Descripción de equipaje especial | NULL |
| `sillaInfantil` | BOOLEAN | Requiere silla infantil | DEFAULT false |
| `mensaje` | TEXT | Mensaje adicional del cliente | NULL |

#### Información de Ida y Vuelta

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `idaVuelta` | BOOLEAN | Es viaje de ida y vuelta | DEFAULT false |
| `fechaRegreso` | DATE | Fecha de regreso | NULL |
| `horaRegreso` | TIME | Hora de regreso | NULL |

#### Información Financiera

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `precio` | DECIMAL(10,2) | Precio base del servicio | NOT NULL |
| `vehiculo` | VARCHAR(100) | Tipo de vehículo asignado | NULL |
| `abonoSugerido` | DECIMAL(10,2) | Abono inicial (40%) | DEFAULT 0 |
| `saldoPendiente` | DECIMAL(10,2) | Saldo restante | DEFAULT 0 |
| `descuentoBase` | DECIMAL(10,2) | Descuento base web | DEFAULT 0 |
| `descuentoPromocion` | DECIMAL(10,2) | Descuento por promoción | DEFAULT 0 |
| `descuentoRoundTrip` | DECIMAL(10,2) | Descuento ida y vuelta | DEFAULT 0 |
| `descuentoOnline` | DECIMAL(10,2) | Descuento online | DEFAULT 0 |
| `totalConDescuento` | DECIMAL(10,2) | Total final con descuentos | NOT NULL |
| `codigoDescuento` | VARCHAR(50) | Código aplicado | NULL |

#### Control de Pago

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `metodoPago` | VARCHAR(50) | Método de pago seleccionado | 'flow', 'mercadopago', NULL |
| `estadoPago` | ENUM | Estado del pago | 'pendiente', 'pagado', 'fallido', 'reembolsado' |
| `referenciaPago` | VARCHAR(255) | ID de transacción externa | NULL |

#### Estado y Trazabilidad

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `estado` | ENUM | Estado de la reserva | 'pendiente', 'pendiente_detalles', 'confirmada', 'cancelada', 'completada' |
| `source` | VARCHAR(100) | Origen de la reserva | 'web', 'express', 'admin', etc. |
| `ipAddress` | VARCHAR(45) | IP del cliente | NULL (IPv4/IPv6) |
| `userAgent` | TEXT | User agent del navegador | NULL |
| `observaciones` | TEXT | Notas internas | NULL |
| `created_at` | TIMESTAMP | Fecha de creación | AUTO, INDEX |
| `updated_at` | TIMESTAMP | Última actualización | AUTO |

#### Índices

```sql
INDEX idx_email ON reservas(email);
INDEX idx_fecha ON reservas(fecha);
INDEX idx_estado ON reservas(estado);
INDEX idx_created_at ON reservas(created_at);
INDEX idx_estado_pago ON reservas(estadoPago);
INDEX idx_codigo_descuento ON reservas(codigoDescuento);
```

#### Estados del Flujo Express

1. **`pendiente`**: Reserva creada, esperando pago inicial
2. **`pendiente_detalles`**: Pago confirmado, faltan detalles (hora, vuelo, etc.)
3. **`confirmada`**: Reserva completa y confirmada
4. **`cancelada`**: Reserva cancelada
5. **`completada`**: Servicio completado

---

### 2. Tabla: `destinos`

**Propósito**: Catálogo de destinos disponibles con sus precios y características.

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `id` | INTEGER | Identificador único | PRIMARY KEY |
| `nombre` | VARCHAR(255) | Nombre del destino | NOT NULL, UNIQUE |
| `precioIda` | DECIMAL(10,2) | Precio solo ida | NOT NULL |
| `precioVuelta` | DECIMAL(10,2) | Precio solo vuelta | NOT NULL |
| `precioIdaVuelta` | DECIMAL(10,2) | Precio ida y vuelta | NOT NULL |
| `activo` | BOOLEAN | Destino disponible | DEFAULT true |
| `orden` | INTEGER | Orden de visualización | DEFAULT 0 |
| `descripcion` | TEXT | Descripción del destino | NULL |
| `tiempo` | VARCHAR(255) | Tiempo estimado de viaje | NULL |
| `imagen` | VARCHAR(255) | URL de imagen | NULL |
| `maxPasajeros` | INTEGER | Máximo de pasajeros | DEFAULT 4 |
| `minHorasAnticipacion` | INTEGER | Horas mínimas de anticipación | DEFAULT 5 |
| `created_at` | TIMESTAMP | Fecha de creación | AUTO |
| `updated_at` | TIMESTAMP | Última actualización | AUTO |

#### Índices

```sql
UNIQUE INDEX idx_nombre ON destinos(nombre);
INDEX idx_activo ON destinos(activo);
```

---

### 3. Tabla: `codigos_descuento`

**Propósito**: Gestión de códigos promocionales personalizados.

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `id` | VARCHAR(50) | Identificador único | PRIMARY KEY |
| `codigo` | VARCHAR(50) | Código promocional | NOT NULL, UNIQUE |
| `descripcion` | VARCHAR(255) | Descripción del código | NOT NULL |
| `tipo` | ENUM | Tipo de descuento | 'porcentaje', 'monto_fijo' |
| `valor` | DECIMAL(10,2) | Valor del descuento | NOT NULL |
| `activo` | BOOLEAN | Código activo | DEFAULT true |
| `limiteUsos` | INTEGER | Límite total de usos | DEFAULT 0 (ilimitado) |
| `usosActuales` | INTEGER | Usos actuales | DEFAULT 0 |
| `fechaVencimiento` | DATE | Fecha de vencimiento | NOT NULL |
| `destinosAplicables` | JSON | Array de destinos aplicables | DEFAULT [] |
| `montoMinimo` | DECIMAL(10,2) | Monto mínimo de compra | DEFAULT 0 |
| `combinable` | BOOLEAN | Se puede combinar con otras promos | DEFAULT true |
| `exclusivo` | BOOLEAN | Exclusivo (no aplica otros desc.) | DEFAULT false |
| `fechaCreacion` | DATE | Fecha de creación | NOT NULL |
| `creadoPor` | VARCHAR(100) | Usuario creador | DEFAULT 'admin' |
| `limiteUsosPorUsuario` | INTEGER | Usos por usuario | DEFAULT 1 |
| `usuariosQueUsaron` | JSON | Array de emails que lo usaron | DEFAULT [] |
| `created_at` | TIMESTAMP | Timestamp de creación | AUTO |
| `updated_at` | TIMESTAMP | Última actualización | AUTO |

#### Índices

```sql
UNIQUE INDEX idx_codigo ON codigos_descuento(codigo);
INDEX idx_activo ON codigos_descuento(activo);
INDEX idx_fecha_vencimiento ON codigos_descuento(fechaVencimiento);
```

---

### 4. Tabla: `promociones`

**Propósito**: Promociones automáticas por día de la semana.

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `id` | INTEGER | Identificador único | PRIMARY KEY |
| `nombre` | VARCHAR(255) | Nombre de la promoción | NOT NULL |
| `dia` | ENUM | Día de la semana | 'lunes', 'martes', ... 'domingo' |
| `tipo` | ENUM | Tipo de descuento | 'porcentaje', 'monto_fijo' |
| `valor` | DECIMAL(10,2) | Valor del descuento | NOT NULL |
| `activo` | BOOLEAN | Promoción activa | DEFAULT true |
| `descripcion` | TEXT | Descripción de la promoción | NULL |
| `created_at` | TIMESTAMP | Fecha de creación | AUTO |
| `updated_at` | TIMESTAMP | Última actualización | AUTO |

#### Índices

```sql
INDEX idx_dia ON promociones(dia);
INDEX idx_activo ON promociones(activo);
```

---

### 5. Tabla: `descuentos_globales`

**Propósito**: Configuración de descuentos globales del sistema.

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `id` | INTEGER | Identificador único | PRIMARY KEY |
| `tipo` | ENUM | Tipo de descuento | 'descuentoOnline', 'descuentoRoundTrip', 'descuentoPersonalizado' |
| `nombre` | VARCHAR(255) | Nombre descriptivo | NOT NULL |
| `valor` | DECIMAL(10,2) | Valor del descuento (porcentaje) | NOT NULL |
| `activo` | BOOLEAN | Descuento activo | DEFAULT true |
| `descripcion` | TEXT | Descripción | NULL |
| `created_at` | TIMESTAMP | Fecha de creación | AUTO |
| `updated_at` | TIMESTAMP | Última actualización | AUTO |

#### Índices

```sql
UNIQUE INDEX idx_tipo ON descuentos_globales(tipo);
INDEX idx_activo ON descuentos_globales(activo);
```

---

## 🔄 Flujo de Datos - Reserva Express

### Paso 1: Captura Inicial (Hero Express)

**Campos requeridos mínimos:**
- origen
- destino
- fecha
- pasajeros
- nombre
- email
- telefono

**Datos calculados automáticamente:**
- precio (desde tabla `destinos`)
- vehiculo (basado en pasajeros)
- abonoSugerido (40% del total)
- saldoPendiente (60% del total)
- descuentos aplicables
- totalConDescuento

**Estado inicial:** `pendiente`

### Paso 2: Proceso de Pago

**Campos adicionales:**
- metodoPago ('flow' o 'mercadopago')
- referenciaPago (ID de transacción)
- estadoPago (inicialmente 'pendiente')

**Estado después del pago:** `pendiente_detalles`

### Paso 3: Completar Detalles (Post-pago)

**Campos opcionales completados:**
- hora (especificada por el cliente)
- numeroVuelo
- hotel
- equipajeEspecial
- sillaInfantil
- mensaje

**Estado final:** `confirmada`

---

## 🔒 Seguridad y Validaciones

### Validaciones a Nivel de Base de Datos

1. **Integridad referencial**: Claves foráneas donde aplique
2. **Restricciones de unicidad**: Códigos, emails en contexto
3. **Valores por defecto**: Estados iniciales apropiados
4. **NOT NULL**: Campos críticos obligatorios

### Validaciones a Nivel de Aplicación

```javascript
// Ejemplo de validaciones en el backend
const validarReservaExpress = (datos) => {
  // Campos obligatorios mínimos
  const requeridos = ['nombre', 'email', 'telefono', 'origen', 'destino', 'fecha', 'pasajeros'];
  
  // Validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Validación de teléfono chileno
  const telefonoRegex = /^\+?56\s?9\s?\d{4}\s?\d{4}$/;
  
  // Validación de fecha futura
  const fechaReserva = new Date(datos.fecha);
  const hoy = new Date();
  
  // Retornar errores o éxito
};
```

---

## 📈 Optimizaciones y Mejoras Propuestas

### 1. Nuevos Índices Recomendados

```sql
-- Búsqueda por rango de fechas
CREATE INDEX idx_fecha_estado ON reservas(fecha, estado);

-- Reportes financieros
CREATE INDEX idx_created_estado_pago ON reservas(created_at, estadoPago);

-- Seguimiento de códigos
CREATE INDEX idx_codigo_created ON reservas(codigoDescuento, created_at);
```

### 2. Campos Adicionales Sugeridos

#### Para tabla `reservas`:

```sql
-- Geolocalización
ALTER TABLE reservas ADD COLUMN latitud DECIMAL(10, 8) NULL;
ALTER TABLE reservas ADD COLUMN longitud DECIMAL(11, 8) NULL;

-- Rating y feedback (post-servicio)
ALTER TABLE reservas ADD COLUMN calificacion INTEGER NULL CHECK (calificacion BETWEEN 1 AND 5);
ALTER TABLE reservas ADD COLUMN comentario_cliente TEXT NULL;
ALTER TABLE reservas ADD COLUMN fecha_completada TIMESTAMP NULL;

-- Información del conductor (cuando se asigne)
ALTER TABLE reservas ADD COLUMN conductor_id INTEGER NULL;
ALTER TABLE reservas ADD COLUMN conductor_nombre VARCHAR(255) NULL;
ALTER TABLE reservas ADD COLUMN conductor_telefono VARCHAR(50) NULL;
ALTER TABLE reservas ADD COLUMN patente_vehiculo VARCHAR(20) NULL;

-- Notificaciones
ALTER TABLE reservas ADD COLUMN notificaciones_enviadas JSON DEFAULT '[]';
ALTER TABLE reservas ADD COLUMN ultimo_recordatorio TIMESTAMP NULL;
```

### 3. Nueva Tabla Sugerida: `auditoria_reservas`

**Propósito**: Historial completo de cambios en reservas

```sql
CREATE TABLE auditoria_reservas (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  reserva_id INTEGER NOT NULL,
  campo_modificado VARCHAR(100) NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  usuario VARCHAR(100) DEFAULT 'sistema',
  ip_address VARCHAR(45),
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
  INDEX idx_reserva_fecha (reserva_id, fecha_cambio)
);
```

### 4. Nueva Tabla Sugerida: `notificaciones`

**Propósito**: Gestión de notificaciones enviadas

```sql
CREATE TABLE notificaciones (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  reserva_id INTEGER NOT NULL,
  tipo ENUM('email', 'sms', 'whatsapp') NOT NULL,
  destinatario VARCHAR(255) NOT NULL,
  asunto VARCHAR(255),
  contenido TEXT,
  estado ENUM('pendiente', 'enviado', 'fallido') DEFAULT 'pendiente',
  fecha_envio TIMESTAMP NULL,
  error TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
  INDEX idx_reserva_tipo (reserva_id, tipo),
  INDEX idx_estado (estado)
);
```

---

## 🔧 Scripts de Migración

### Script 1: Agregar Campos de Mejora a Reservas

```javascript
// backend/migrations/001_add_enhanced_fields.js
import sequelize from '../config/database.js';

async function addEnhancedFields() {
  try {
    console.log('🔧 Agregando campos mejorados a la tabla reservas...');
    
    await sequelize.query(`
      ALTER TABLE reservas 
      ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8),
      ADD COLUMN IF NOT EXISTS calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
      ADD COLUMN IF NOT EXISTS comentario_cliente TEXT,
      ADD COLUMN IF NOT EXISTS fecha_completada TIMESTAMP,
      ADD COLUMN IF NOT EXISTS conductor_id INTEGER,
      ADD COLUMN IF NOT EXISTS conductor_nombre VARCHAR(255),
      ADD COLUMN IF NOT EXISTS conductor_telefono VARCHAR(50),
      ADD COLUMN IF NOT EXISTS patente_vehiculo VARCHAR(20),
      ADD COLUMN IF NOT EXISTS notificaciones_enviadas JSON,
      ADD COLUMN IF NOT EXISTS ultimo_recordatorio TIMESTAMP
    `);
    
    console.log('✅ Campos agregados exitosamente');
  } catch (error) {
    console.error('❌ Error agregando campos:', error);
    throw error;
  }
}

export default addEnhancedFields;
```

### Script 2: Crear Tabla de Auditoría

```javascript
// backend/migrations/002_create_auditoria.js
import sequelize from '../config/database.js';

async function createAuditoriaTable() {
  try {
    console.log('🔧 Creando tabla de auditoría...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS auditoria_reservas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reserva_id INT NOT NULL,
        campo_modificado VARCHAR(100) NOT NULL,
        valor_anterior TEXT,
        valor_nuevo TEXT,
        usuario VARCHAR(100) DEFAULT 'sistema',
        ip_address VARCHAR(45),
        fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
        INDEX idx_reserva_fecha (reserva_id, fecha_cambio)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabla de auditoría creada exitosamente');
  } catch (error) {
    console.error('❌ Error creando tabla de auditoría:', error);
    throw error;
  }
}

export default createAuditoriaTable;
```

---

## 📊 Consultas SQL Útiles

### Reportes de Negocio

```sql
-- Reservas por día de la semana
SELECT 
  DAYNAME(fecha) as dia_semana,
  COUNT(*) as total_reservas,
  SUM(totalConDescuento) as ingresos_totales
FROM reservas
WHERE estadoPago = 'pagado'
GROUP BY dia_semana
ORDER BY FIELD(dia_semana, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- Destinos más populares
SELECT 
  destino,
  COUNT(*) as cantidad,
  AVG(totalConDescuento) as precio_promedio
FROM reservas
WHERE estado = 'confirmada'
GROUP BY destino
ORDER BY cantidad DESC
LIMIT 10;

-- Efectividad de códigos de descuento
SELECT 
  cd.codigo,
  cd.descripcion,
  cd.usosActuales,
  cd.limiteUsos,
  COUNT(r.id) as reservas_con_codigo,
  SUM(r.totalConDescuento) as ingresos_generados
FROM codigos_descuento cd
LEFT JOIN reservas r ON r.codigoDescuento = cd.codigo
WHERE cd.activo = true
GROUP BY cd.id
ORDER BY reservas_con_codigo DESC;

-- Tasa de conversión de reservas express
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as reservas_creadas,
  SUM(CASE WHEN estadoPago = 'pagado' THEN 1 ELSE 0 END) as reservas_pagadas,
  ROUND(SUM(CASE WHEN estadoPago = 'pagado' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as tasa_conversion
FROM reservas
WHERE source = 'express'
GROUP BY DATE(created_at)
ORDER BY fecha DESC
LIMIT 30;

-- Reservas pendientes de completar detalles
SELECT 
  id,
  nombre,
  email,
  telefono,
  origen,
  destino,
  fecha,
  totalConDescuento,
  DATEDIFF(fecha, CURDATE()) as dias_hasta_viaje
FROM reservas
WHERE estado = 'pendiente_detalles'
  AND estadoPago = 'pagado'
  AND fecha >= CURDATE()
ORDER BY fecha ASC;
```

---

## 🚀 Implementación por Fases

### Fase 1: Fundamentos (Actual - Completado ✅)
- ✅ Tabla `reservas` con campos básicos
- ✅ Tabla `destinos`
- ✅ Tabla `codigos_descuento`
- ✅ Tabla `promociones`
- ✅ Tabla `descuentos_globales`

### Fase 2: Mejoras Operativas (Recomendado - Próximo)
- [ ] Agregar campos de conductor y vehículo
- [ ] Agregar campos de geolocalización
- [ ] Implementar tabla `auditoria_reservas`
- [ ] Agregar índices optimizados adicionales

### Fase 3: Funcionalidades Avanzadas (Futuro)
- [ ] Sistema de notificaciones con tabla dedicada
- [ ] Sistema de calificaciones y reviews
- [ ] Dashboard de analíticas en tiempo real
- [ ] API de integración con sistemas de terceros

### Fase 4: Escalamiento (Largo Plazo)
- [ ] Particionamiento de tablas por fecha
- [ ] Cache de consultas frecuentes (Redis)
- [ ] Réplicas de lectura
- [ ] Backup automático y disaster recovery

---

## 📝 Notas Importantes

### Consideraciones del Flujo Express

1. **Datos Mínimos**: El formulario express captura solo lo esencial para iniciar el proceso
2. **Hora por Defecto**: Se asigna 08:00 como hora por defecto, ajustable después
3. **Confirmación Progresiva**: El cliente puede completar detalles después del pago
4. **Flexibilidad**: El sistema permite múltiples actualizaciones antes del servicio

### Compatibilidad con Sistema Actual

- ✅ Compatible con `migrar_reservas.php`
- ✅ Compatible con `reservas_manager.php`
- ✅ Compatible con notificaciones por email (PHPMailer)
- ✅ Integrado con pasarelas de pago (Flow y Mercado Pago)

### Mantenimiento

- **Backups**: Configurar backups diarios automáticos en Hostinger
- **Limpieza**: Archivar reservas completadas de más de 1 año
- **Monitoreo**: Alertas para reservas con estados inconsistentes
- **Auditoría**: Revisión mensual de logs y métricas

---

## 📞 Soporte y Documentación

Para más información sobre:
- Migración de datos: Ver `backend/MIGRATION_README.md`
- Gestión de reservas: Ver `INSTRUCCIONES_RESERVAS_EXCEL.md`
- API REST: Ver documentación del servidor en `backend/server-db.js`

---

**Última actualización**: 2025-01-11  
**Versión**: 1.0  
**Estado**: Producción
