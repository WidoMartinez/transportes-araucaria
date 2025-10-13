# Sistema de Conductores y Vehículos

## Descripción General

Este documento describe el sistema de gestión de conductores y vehículos implementado para Transportes Araucaria. El sistema permite llevar un registro de conductores, vehículos y asignarlos a las reservas, además de enviar notificaciones a los pasajeros con la información del conductor y vehículo asignado.

## Características Principales

### 1. Gestión de Conductores
- Registro de conductores con información completa (nombre, teléfono, email, notas)
- Estado activo/inactivo para gestionar disponibilidad
- Historial de viajes realizados por cada conductor
- Registro de montos pagados por viaje (ingreso manual)

### 2. Gestión de Vehículos
- Registro de vehículos con patente única
- Tipos de vehículos: Sedan, SUV, Van, Minibus
- Información detallada: marca, modelo, año, capacidad
- Estado activo/inactivo

### 3. Asignación de Conductor y Vehículo a Reservas
- Asignar conductor y vehículo a cualquier reserva
- Registro automático en tabla de viajes
- Notificación automática al pasajero por email
- **Seguridad**: Solo se muestra el nombre del conductor y los últimos 4 dígitos de la patente

### 4. Historial de Viajes
- Relación entre conductor, vehículo y reserva
- Registro de monto pagado al conductor (ingreso manual)
- Estadísticas por conductor (total de viajes, monto total pagado)

## Estructura de Base de Datos

### Tabla: `conductores`

```sql
CREATE TABLE conductores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre),
  INDEX idx_activo (activo)
);
```

### Tabla: `vehiculos`

```sql
CREATE TABLE vehiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patente VARCHAR(10) NOT NULL UNIQUE,
  tipo ENUM('Sedan', 'SUV', 'Van', 'Minibus') NOT NULL,
  capacidad INT NOT NULL DEFAULT 4,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  anio INT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patente (patente),
  INDEX idx_tipo (tipo),
  INDEX idx_activo (activo)
);
```

### Tabla: `viajes_conductor`

```sql
CREATE TABLE viajes_conductor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conductor_id INT NOT NULL,
  vehiculo_id INT NOT NULL,
  reserva_id INT NOT NULL,
  monto_pago DECIMAL(10, 2) DEFAULT 0,
  notas TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_conductor_id (conductor_id),
  INDEX idx_vehiculo_id (vehiculo_id),
  INDEX idx_reserva_id (reserva_id),
  INDEX idx_created_at (createdAt)
);
```

### Campos Agregados a Tabla `reservas`

```sql
ALTER TABLE reservas ADD COLUMN conductor_id INT;
ALTER TABLE reservas ADD COLUMN vehiculo_id INT;
ALTER TABLE reservas ADD INDEX idx_conductor_id (conductor_id);
ALTER TABLE reservas ADD INDEX idx_vehiculo_id (vehiculo_id);
```

## API Endpoints

### Conductores

#### GET `/api/conductores`
Obtener todos los conductores.

**Query Parameters:**
- `activo` (opcional): `true` o `false` para filtrar por estado

**Respuesta:**
```json
{
  "conductores": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "telefono": "+56912345678",
      "email": "juan@example.com",
      "notas": "Conductor experimentado",
      "activo": true,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

#### GET `/api/conductores/:id`
Obtener un conductor específico con su historial de viajes.

#### POST `/api/conductores`
Crear un nuevo conductor.

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "telefono": "+56912345678",
  "email": "juan@example.com",
  "notas": "Conductor experimentado"
}
```

#### PUT `/api/conductores/:id`
Actualizar información de un conductor.

#### DELETE `/api/conductores/:id`
Eliminar un conductor (solo si no tiene viajes asignados).

### Vehículos

#### GET `/api/vehiculos`
Obtener todos los vehículos.

**Query Parameters:**
- `activo` (opcional): `true` o `false`
- `tipo` (opcional): `Sedan`, `SUV`, `Van`, `Minibus`

#### GET `/api/vehiculos/:id`
Obtener un vehículo específico con su historial.

#### POST `/api/vehiculos`
Crear un nuevo vehículo.

**Body:**
```json
{
  "patente": "ABCD12",
  "tipo": "SUV",
  "capacidad": 7,
  "marca": "Toyota",
  "modelo": "RAV4",
  "anio": 2022,
  "notas": "Vehículo en excelente estado"
}
```

#### PUT `/api/vehiculos/:id`
Actualizar información de un vehículo.

#### DELETE `/api/vehiculos/:id`
Eliminar un vehículo (solo si no tiene viajes asignados).

### Asignación y Viajes

#### PUT `/api/reservas/:id/asignar`
Asignar conductor y vehículo a una reserva.

**Body:**
```json
{
  "conductorId": 1,
  "vehiculoId": 1,
  "montoPago": 25000,
  "notas": "Viaje al aeropuerto"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Conductor y vehículo asignados exitosamente",
  "reserva": {
    "id": 123,
    "nombre": "María González",
    "email": "maria@example.com",
    "conductorId": 1,
    "vehiculoId": 1,
    "conductor": {
      "id": 1,
      "nombre": "Juan Pérez"
    },
    "vehiculo": {
      "id": 1,
      "patente": "ABCD12",
      "tipo": "SUV"
    },
    "conductorDisplay": "Juan Pérez",
    "vehiculoDisplay": "SUV (***CD12)"
  }
}
```

#### POST `/api/viajes`
Crear un registro de viaje.

#### PUT `/api/viajes/:id`
Actualizar un viaje (principalmente el monto de pago).

**Body:**
```json
{
  "montoPago": 30000,
  "notas": "Monto actualizado"
}
```

#### GET `/api/conductores/:id/viajes`
Obtener historial completo de viajes de un conductor con estadísticas.

**Respuesta:**
```json
{
  "conductor": {
    "id": 1,
    "nombre": "Juan Pérez"
  },
  "viajes": [
    {
      "id": 1,
      "conductorId": 1,
      "vehiculoId": 1,
      "reservaId": 123,
      "montoPago": 25000,
      "reserva": { /* datos de la reserva */ },
      "vehiculo": { /* datos del vehículo */ }
    }
  ],
  "estadisticas": {
    "totalViajes": 50,
    "totalPagado": 1250000
  }
}
```

## Notificaciones por Email

Cuando se asigna un conductor y vehículo a una reserva, el sistema envía automáticamente un email al pasajero con:

- **Nombre completo del conductor**: Ej. "Juan Pérez"
- **Tipo de vehículo y últimos 4 dígitos de la patente**: Ej. "SUV (***CD12)"

### Seguridad y Privacidad

Por motivos de seguridad, en las notificaciones al cliente:
- ✅ Se muestra el nombre completo del conductor
- ✅ Se muestran solo los últimos 4 dígitos de la patente (formato: `***XXXX`)
- ❌ NO se muestra la patente completa
- ❌ NO se muestra información de contacto del conductor

## Migración de Base de Datos

Para crear las tablas necesarias, ejecutar:

```bash
npm run migrate:conductores
```

O durante el despliegue en Render.com, se ejecutará automáticamente:

```bash
npm run start:migrate
```

### Verificar Migración

La migración creará:
1. Tabla `conductores` con índices
2. Tabla `vehiculos` con índices
3. Tabla `viajes_conductor` con índices
4. Campos `conductor_id` y `vehiculo_id` en tabla `reservas`

La migración es **idempotente**: se puede ejecutar múltiples veces sin problemas. Si las tablas ya existen, las omitirá.

## Flujo de Trabajo Recomendado

### 1. Registrar Conductores y Vehículos

Antes de asignar, registrar en el sistema:
```bash
POST /api/conductores
POST /api/vehiculos
```

### 2. Crear Reserva

Crear la reserva normalmente a través del formulario web o API.

### 3. Asignar Conductor y Vehículo

Desde el panel de administración:
```bash
PUT /api/reservas/:id/asignar
```

Esto automáticamente:
- Actualiza la reserva con conductor y vehículo
- Crea registro en `viajes_conductor`
- Envía email al pasajero

### 4. Registrar Monto de Pago al Conductor

Manualmente, actualizar el monto pagado:
```bash
PUT /api/viajes/:id
{
  "montoPago": 25000
}
```

### 5. Consultar Historial

Ver todos los viajes de un conductor:
```bash
GET /api/conductores/:id/viajes
```

## Utilidades para Desarrolladores

### Funciones Helper

El archivo `backend/utils/emailHelpers.js` contiene funciones útiles:

```javascript
import {
  obtenerUltimos4Patente,
  formatearInfoConductor,
  formatearInfoVehiculo
} from './utils/emailHelpers.js';

// Obtener últimos 4 dígitos de patente
const ultimos4 = obtenerUltimos4Patente('ABCD12'); // "CD12"

// Formatear conductor para email
const conductorDisplay = formatearInfoConductor(conductor); // "Juan Pérez"

// Formatear vehículo para email
const vehiculoDisplay = formatearInfoVehiculo(vehiculo); // "SUV (***CD12)"
```

## Consideraciones de Seguridad

1. **Protección de Datos Personales**
   - Los emails solo muestran información necesaria
   - Patente parcialmente oculta por seguridad

2. **Validaciones**
   - No se puede eliminar conductor/vehículo con viajes asignados
   - Patente única por vehículo
   - Validación de tipos de vehículo

3. **Auditoría**
   - Todas las asignaciones quedan registradas en `viajes_conductor`
   - Timestamps automáticos en todas las tablas

## Próximas Mejoras

- [ ] Panel de administración web para gestionar conductores y vehículos
- [ ] Dashboard con estadísticas de conductores (viajes, ingresos, etc.)
- [ ] Calendario de disponibilidad de conductores
- [ ] Notificaciones push a conductores cuando se les asigna un viaje
- [ ] App móvil para conductores
- [ ] Integración con GPS para tracking en tiempo real
- [ ] Evaluación de conductores por parte de pasajeros

## Soporte

Para dudas o problemas con el sistema de conductores y vehículos:
- Revisar logs del servidor: `console.log` muestra notificaciones
- Verificar que la migración se ejecutó correctamente
- Consultar este documento para endpoints disponibles

---

**Fecha de implementación**: Octubre 2025  
**Desarrollador**: GitHub Copilot  
**Estado**: ✅ Implementado y listo para despliegue en Render.com
