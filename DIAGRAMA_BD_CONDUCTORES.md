# 📊 Diagrama de Base de Datos - Sistema de Conductores y Vehículos

## Esquema de Relaciones

```
┌─────────────────────┐
│     CONDUCTORES     │
├─────────────────────┤
│ • id (PK)          │
│ • nombre           │
│ • telefono         │
│ • email            │
│ • notas            │
│ • activo           │
│ • createdAt        │
│ • updatedAt        │
└─────────────────────┘
         │
         │ 1
         │
         │ N
         ▼
┌─────────────────────┐         ┌─────────────────────┐
│  VIAJES_CONDUCTOR   │    N    │      VEHICULOS      │
├─────────────────────┤ ◄──────►├─────────────────────┤
│ • id (PK)          │    1    │ • id (PK)          │
│ • conductor_id (FK) │         │ • patente (UNIQUE) │
│ • vehiculo_id (FK)  │         │ • tipo             │
│ • reserva_id (FK)   │         │ • capacidad        │
│ • monto_pago       │         │ • marca            │
│ • notas            │         │ • modelo           │
│ • createdAt        │         │ • anio             │
│ • updatedAt        │         │ • notas            │
└─────────────────────┘         │ • activo           │
         │                       │ • createdAt        │
         │ N                     │ • updatedAt        │
         │                       └─────────────────────┘
         │ 1
         ▼
┌─────────────────────┐
│      RESERVAS       │
├─────────────────────┤
│ • id (PK)          │
│ • conductor_id (FK) │ ◄─── NUEVO
│ • vehiculo_id (FK)  │ ◄─── NUEVO
│ • cliente_id (FK)   │
│ • rut              │
│ • nombre           │
│ • email            │
│ • telefono         │
│ • origen           │
│ • destino          │
│ • fecha            │
│ • hora             │
│ • pasajeros        │
│ • precio           │
│ • estado           │
│ • estadoPago       │
│ • ... (más campos) │
└─────────────────────┘
```

## Relaciones Detalladas

### 1:N - Conductor → Viajes
Un conductor puede realizar **muchos viajes**.

```
CONDUCTOR (1)
    └── VIAJE (1)
    └── VIAJE (2)
    └── VIAJE (3)
    └── ...
```

### 1:N - Vehículo → Viajes
Un vehículo puede ser usado en **muchos viajes**.

```
VEHICULO (1)
    └── VIAJE (1)
    └── VIAJE (2)
    └── VIAJE (3)
    └── ...
```

### 1:1 - Reserva ↔ Viaje
Una reserva tiene **un único viaje** (cuando se asigna conductor y vehículo).

```
RESERVA (123) ←→ VIAJE (1)
```

### N:M - Conductor ↔ Vehículo (a través de Viajes)
Un conductor puede usar **múltiples vehículos** a lo largo del tiempo.
Un vehículo puede ser usado por **múltiples conductores**.

```
CONDUCTOR A ──┐
              ├── VIAJES ──┐
CONDUCTOR B ──┘             ├── VEHICULO X
                            ├── VEHICULO Y
              ┌── VIAJES ───┘
CONDUCTOR C ──┘
```

## Índices Creados

### Tabla: conductores
```sql
CREATE INDEX idx_conductores_nombre ON conductores(nombre);
CREATE INDEX idx_conductores_activo ON conductores(activo);
```

### Tabla: vehiculos
```sql
CREATE INDEX idx_vehiculos_patente ON vehiculos(patente);
CREATE INDEX idx_vehiculos_tipo ON vehiculos(tipo);
CREATE INDEX idx_vehiculos_activo ON vehiculos(activo);
```

### Tabla: viajes_conductor
```sql
CREATE INDEX idx_viajes_conductor_id ON viajes_conductor(conductor_id);
CREATE INDEX idx_viajes_vehiculo_id ON viajes_conductor(vehiculo_id);
CREATE INDEX idx_viajes_reserva_id ON viajes_conductor(reserva_id);
CREATE INDEX idx_viajes_created_at ON viajes_conductor(createdAt);
```

### Tabla: reservas (nuevos índices)
```sql
CREATE INDEX idx_reservas_conductor_id ON reservas(conductor_id);
CREATE INDEX idx_reservas_vehiculo_id ON reservas(vehiculo_id);
```

## Restricciones

### UNIQUE (Unicidad)
- `vehiculos.patente` - Cada vehículo tiene patente única

### NOT NULL (Obligatorios)
- `conductores.nombre`
- `conductores.telefono`
- `vehiculos.patente`
- `vehiculos.tipo`
- `viajes_conductor.conductor_id`
- `viajes_conductor.vehiculo_id`
- `viajes_conductor.reserva_id`

### ENUM (Valores Permitidos)
- `vehiculos.tipo` → Solo: 'Sedan', 'SUV', 'Van', 'Minibus'

### DEFAULT (Valores por Defecto)
- `conductores.activo` → `true`
- `vehiculos.activo` → `true`
- `vehiculos.capacidad` → `4`
- `viajes_conductor.monto_pago` → `0`

## Ejemplo de Datos

### Conductor
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "telefono": "+56912345678",
  "email": "juan@example.com",
  "notas": "Conductor experimentado",
  "activo": true,
  "createdAt": "2025-10-13T10:00:00Z",
  "updatedAt": "2025-10-13T10:00:00Z"
}
```

### Vehículo
```json
{
  "id": 1,
  "patente": "ABCD12",
  "tipo": "SUV",
  "capacidad": 7,
  "marca": "Toyota",
  "modelo": "RAV4",
  "anio": 2022,
  "notas": "Vehículo en excelente estado",
  "activo": true,
  "createdAt": "2025-10-13T10:00:00Z",
  "updatedAt": "2025-10-13T10:00:00Z"
}
```

### Viaje
```json
{
  "id": 1,
  "conductor_id": 1,
  "vehiculo_id": 1,
  "reserva_id": 123,
  "monto_pago": 25000,
  "notas": "Viaje al aeropuerto",
  "createdAt": "2025-10-13T10:00:00Z",
  "updatedAt": "2025-10-13T10:00:00Z"
}
```

### Reserva (campos nuevos)
```json
{
  "id": 123,
  "conductor_id": 1,
  "vehiculo_id": 1,
  "nombre": "María González",
  "email": "maria@example.com",
  "origen": "Aeropuerto La Araucanía",
  "destino": "Pucón",
  "fecha": "2025-11-15",
  "hora": "10:00"
}
```

## Flujo de Datos

### 1. Crear Conductor
```sql
INSERT INTO conductores (nombre, telefono, email, activo)
VALUES ('Juan Pérez', '+56912345678', 'juan@example.com', true);
```

### 2. Crear Vehículo
```sql
INSERT INTO vehiculos (patente, tipo, capacidad, marca, modelo, anio, activo)
VALUES ('ABCD12', 'SUV', 7, 'Toyota', 'RAV4', 2022, true);
```

### 3. Cliente Crea Reserva
```sql
INSERT INTO reservas (nombre, email, telefono, origen, destino, fecha, hora)
VALUES ('María González', 'maria@example.com', '+56987654321', 
        'Aeropuerto', 'Pucón', '2025-11-15', '10:00');
```

### 4. Asignar Conductor y Vehículo
```sql
-- Actualizar reserva
UPDATE reservas 
SET conductor_id = 1, vehiculo_id = 1 
WHERE id = 123;

-- Crear registro de viaje
INSERT INTO viajes_conductor (conductor_id, vehiculo_id, reserva_id, monto_pago)
VALUES (1, 1, 123, 0);
```

### 5. Registrar Pago al Conductor
```sql
UPDATE viajes_conductor 
SET monto_pago = 25000 
WHERE id = 1;
```

## Consultas Útiles

### Obtener viajes de un conductor con detalles
```sql
SELECT 
    c.nombre AS conductor,
    v.tipo AS vehiculo,
    v.patente,
    r.origen,
    r.destino,
    r.fecha,
    vc.monto_pago
FROM viajes_conductor vc
JOIN conductores c ON vc.conductor_id = c.id
JOIN vehiculos v ON vc.vehiculo_id = v.id
JOIN reservas r ON vc.reserva_id = r.id
WHERE c.id = 1
ORDER BY r.fecha DESC;
```

### Estadísticas por conductor
```sql
SELECT 
    c.nombre,
    COUNT(vc.id) AS total_viajes,
    SUM(vc.monto_pago) AS total_pagado,
    AVG(vc.monto_pago) AS promedio_pago
FROM conductores c
LEFT JOIN viajes_conductor vc ON c.id = vc.conductor_id
WHERE c.activo = true
GROUP BY c.id, c.nombre
ORDER BY total_viajes DESC;
```

### Vehículos más usados
```sql
SELECT 
    v.patente,
    v.tipo,
    v.marca,
    v.modelo,
    COUNT(vc.id) AS total_viajes
FROM vehiculos v
LEFT JOIN viajes_conductor vc ON v.id = vc.vehiculo_id
WHERE v.activo = true
GROUP BY v.id
ORDER BY total_viajes DESC;
```

### Reservas con conductor y vehículo asignado
```sql
SELECT 
    r.id,
    r.nombre AS cliente,
    r.origen,
    r.destino,
    r.fecha,
    c.nombre AS conductor,
    CONCAT(v.tipo, ' (***', SUBSTRING(v.patente, -4), ')') AS vehiculo_display
FROM reservas r
LEFT JOIN conductores c ON r.conductor_id = c.id
LEFT JOIN vehiculos v ON r.vehiculo_id = v.id
WHERE r.conductor_id IS NOT NULL
ORDER BY r.fecha DESC;
```

## Tamaño Estimado

### Registros Iniciales
- Conductores: ~10-20 registros
- Vehículos: ~5-15 registros
- Viajes: Crece con cada asignación (estimado: 100-200/mes)

### Espacio en Disco
- conductores: ~2KB por registro
- vehiculos: ~2KB por registro
- viajes_conductor: ~1KB por registro
- Índices: ~1-2MB inicialmente

---

**Fecha**: Octubre 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Producción
