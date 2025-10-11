# 📊 Diagrama Entidad-Relación - Sistema de Reservas

## 🎨 Diagrama Visual ASCII

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SISTEMA DE BASE DE DATOS - TRANSPORTES ARAUCARIA                │
└────────────────────────────────────────────────────────────────────────────────────────┘


                                    ┌──────────────────┐
                                    │   DESCUENTOS_    │
                                    │    GLOBALES      │
                                    ├──────────────────┤
                                    │ • tipo (PK)      │
                                    │ • valor (%)      │
                                    │ • activo         │
                                    └──────────────────┘
                                             │
                                             │ Aplica a
                                             ↓
    ┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
    │   PROMOCIONES    │           │     DESTINOS     │           │  CODIGOS_DESC    │
    ├──────────────────┤           ├──────────────────┤           ├──────────────────┤
    │ • id (PK)        │           │ • id (PK)        │           │ • codigo (PK)    │
    │ • dia semana     │ Aplica a  │ • nombre (UQ)    │  Define   │ • tipo           │
    │ • tipo           │ ────────→ │ • precioIda      │ ←──────── │ • valor          │
    │ • valor (%)      │           │ • precioVuelta   │  precio   │ • limiteUsos     │
    │ • activo         │           │ • precioIdaVuelta│           │ • usosActuales   │
    └──────────────────┘           │ • maxPasajeros   │           │ • fechaVenc      │
             │                     │ • minHoras       │           │ • activo         │
             │                     │ • activo         │           └──────────────────┘
             │                     └──────────────────┘                    │
             │                              │                              │
             │                              │ Referencia                   │
             │                              │                              │
             └──────────────────────────────┼──────────────────────────────┘
                                            │
                                            ↓
                                  ┌────────────────────┐
                                  │      RESERVAS      │
                                  ├────────────────────┤
                                  │ DATOS BÁSICOS      │
                                  │ • id (PK)          │
                                  │ • nombre           │
                                  │ • email (INDEX)    │
                                  │ • telefono         │
                                  ├────────────────────┤
                                  │ VIAJE              │
                                  │ • origen           │
                                  │ • destino          │
                                  │ • fecha (INDEX)    │
                                  │ • hora             │
                                  │ • pasajeros        │
                                  │ • idaVuelta        │
                                  │ • fechaRegreso     │
                                  │ • horaRegreso      │
                                  ├────────────────────┤
                                  │ DETALLES           │
                                  │ • numeroVuelo      │
                                  │ • hotel            │
                                  │ • equipajeEsp      │
                                  │ • sillaInfantil    │
                                  │ • mensaje          │
                                  ├────────────────────┤
                                  │ FINANCIERO         │
                                  │ • precio           │
                                  │ • vehiculo         │
                                  │ • abonoSugerido    │
                                  │ • saldoPendiente   │
                                  │ • descuentoBase    │
                                  │ • descuentoPromo   │
                                  │ • descuentoRT      │
                                  │ • descuentoOnline  │
                                  │ • totalConDesc     │
                                  │ • codigoDescuento  │
                                  ├────────────────────┤
                                  │ PAGO               │
                                  │ • metodoPago       │
                                  │ • estadoPago       │
                                  │ • referenciaPago   │
                                  ├────────────────────┤
                                  │ OPERACIONAL ✨     │
                                  │ • conductor_id     │
                                  │ • conductor_nombre │
                                  │ • conductor_tel    │
                                  │ • patente_vehiculo │
                                  │ • latitud          │
                                  │ • longitud         │
                                  ├────────────────────┤
                                  │ FEEDBACK ✨        │
                                  │ • calificacion     │
                                  │ • comentario_cli   │
                                  │ • fecha_completada │
                                  ├────────────────────┤
                                  │ CONTROL            │
                                  │ • estado (INDEX)   │
                                  │ • source           │
                                  │ • ipAddress        │
                                  │ • userAgent        │
                                  │ • observaciones    │
                                  │ • notif_enviadas ✨│
                                  │ • ultimo_record ✨ │
                                  │ • created_at       │
                                  │ • updated_at       │
                                  └────────────────────┘
                                            │
                                            │ Genera
                                            │
                                            ↓
                                  ┌────────────────────┐
                                  │ AUDITORIA_RESERVAS │
                                  │        ✨          │
                                  ├────────────────────┤
                                  │ • id (PK)          │
                                  │ • reserva_id (FK)  │
                                  │ • campo_modif      │
                                  │ • valor_anterior   │
                                  │ • valor_nuevo      │
                                  │ • usuario          │
                                  │ • ip_address       │
                                  │ • metodo           │
                                  │ • fecha_cambio     │
                                  └────────────────────┘

✨ = Campos/Tabla agregados en migraciones opcionales
```

## 🔑 Leyenda de Símbolos

| Símbolo | Significado |
|---------|-------------|
| PK | Primary Key (Clave Primaria) |
| FK | Foreign Key (Clave Foránea) |
| UQ | Unique (Único) |
| INDEX | Campo indexado para búsquedas rápidas |
| ✨ | Nuevo campo/tabla (opcional, requiere migración) |
| → | Relación/Referencia entre tablas |
| % | Valor en porcentaje |

## 📋 Relaciones entre Tablas

### 1. DESTINOS → RESERVAS
- **Tipo**: 1:N (Uno a muchos)
- **Descripción**: Un destino puede tener muchas reservas
- **Campo relacionado**: `reservas.destino` referencia `destinos.nombre`
- **Integridad**: Soft reference (no FK física, pero validación en aplicación)

### 2. CODIGOS_DESCUENTO → RESERVAS
- **Tipo**: 1:N (Uno a muchos)
- **Descripción**: Un código puede ser usado en múltiples reservas
- **Campo relacionado**: `reservas.codigoDescuento` referencia `codigos_descuento.codigo`
- **Integridad**: Soft reference con validación

### 3. RESERVAS → AUDITORIA_RESERVAS
- **Tipo**: 1:N (Uno a muchos)
- **Descripción**: Una reserva puede tener múltiples registros de auditoría
- **Campo relacionado**: `auditoria_reservas.reserva_id` → `reservas.id`
- **Integridad**: FK con ON DELETE CASCADE

### 4. PROMOCIONES → RESERVAS
- **Tipo**: N:M (Muchos a muchos - implícita)
- **Descripción**: Las promociones se aplican automáticamente por día
- **Relación**: Calculada en tiempo de ejecución según día de la semana

### 5. DESCUENTOS_GLOBALES → RESERVAS
- **Tipo**: N:M (Muchos a muchos - implícita)
- **Descripción**: Descuentos globales aplicables a todas las reservas
- **Relación**: Calculada en tiempo de ejecución

## 🔄 Flujo de Estados de Reserva

```
┌─────────────┐
│  PENDIENTE  │ ← Estado inicial (después de capturar datos del hero)
└──────┬──────┘
       │
       │ Cliente completa pago
       ↓
┌─────────────────────┐
│ PENDIENTE_DETALLES  │ ← Pago confirmado, faltan detalles opcionales
└──────┬──────────────┘
       │
       │ Cliente completa hora, vuelo, hotel, etc.
       ↓
┌─────────────┐
│ CONFIRMADA  │ ← Reserva lista para ser procesada
└──────┬──────┘
       │
       │ Servicio completado
       ↓
┌─────────────┐
│ COMPLETADA  │ ← Servicio finalizado, puede recibir calificación
└─────────────┘

       ↓ (En cualquier momento)
┌─────────────┐
│  CANCELADA  │ ← Reserva cancelada por cliente o admin
└─────────────┘
```

## 💳 Flujo de Estados de Pago

```
┌─────────────┐
│  PENDIENTE  │ ← Estado inicial
└──────┬──────┘
       │
       ├─→ Pago exitoso ─────→ ┌─────────┐
       │                       │ PAGADO  │
       │                       └─────────┘
       │
       └─→ Pago fallido ──────→ ┌─────────┐
                                 │ FALLIDO │
                                 └─────────┘
                                      ↓
                        (Puede volver a intentar → PENDIENTE)

       (Si es necesario reembolso)
                ↓
         ┌──────────────┐
         │ REEMBOLSADO  │
         └──────────────┘
```

## 📊 Cardinalidad Detallada

### Tabla RESERVAS (Principal)

```
RESERVAS
│
├─→ N:1 con DESTINOS (muchas reservas, un destino)
├─→ N:1 con CODIGOS_DESCUENTO (muchas reservas, un código)
├─→ 1:N con AUDITORIA_RESERVAS (una reserva, muchos cambios)
├─→ N:M con PROMOCIONES (implícita, por día)
└─→ N:M con DESCUENTOS_GLOBALES (implícita, automática)
```

## 🔍 Índices Optimizados

### Tabla RESERVAS

```sql
-- Búsquedas por email (clientes frecuentes)
INDEX idx_email ON reservas(email);

-- Consultas por rango de fechas
INDEX idx_fecha ON reservas(fecha);

-- Filtrado por estado
INDEX idx_estado ON reservas(estado);

-- Reportes cronológicos
INDEX idx_created_at ON reservas(created_at);

-- Búsquedas combinadas (agregadas en migración ✨)
INDEX idx_fecha_estado ON reservas(fecha, estado);
INDEX idx_created_estado_pago ON reservas(created_at, estadoPago);
INDEX idx_conductor ON reservas(conductor_id);
```

### Tabla DESTINOS

```sql
UNIQUE INDEX idx_nombre ON destinos(nombre);
INDEX idx_activo ON destinos(activo);
```

### Tabla CODIGOS_DESCUENTO

```sql
UNIQUE INDEX idx_codigo ON codigos_descuento(codigo);
INDEX idx_activo ON codigos_descuento(activo);
INDEX idx_fecha_vencimiento ON codigos_descuento(fechaVencimiento);
```

### Tabla AUDITORIA_RESERVAS ✨

```sql
INDEX idx_reserva_fecha ON auditoria_reservas(reserva_id, fecha_cambio);
INDEX idx_campo ON auditoria_reservas(campo_modificado);
INDEX idx_usuario ON auditoria_reservas(usuario);
INDEX idx_fecha ON auditoria_reservas(fecha_cambio);
```

## 📐 Modelo Relacional Normalizado

### Forma Normal: 3NF (Tercera Forma Normal)

**Justificación:**
- ✅ No hay dependencias transitivas
- ✅ Todos los atributos dependen de la clave primaria
- ✅ No hay redundancia de datos
- ✅ Integridad referencial mantenida

### Campos JSON

Algunos campos utilizan JSON para flexibilidad:
- `codigos_descuento.destinosAplicables`: Array de destinos
- `codigos_descuento.usuariosQueUsaron`: Array de emails
- `reservas.notificaciones_enviadas`: Historial de notificaciones

**Nota**: JSON permite flexibilidad pero sacrifica algunas capacidades de consulta. Se usa solo donde la estructura es variable.

## 🎯 Casos de Uso del Diagrama

### Caso 1: Reserva Express (Flujo Mínimo)
```
USUARIO → HeroExpress
    ↓
CAPTURA: nombre, email, telefono, origen, destino, fecha, pasajeros
    ↓
CONSULTA: DESTINOS (obtener precio)
    ↓
APLICA: DESCUENTOS_GLOBALES, PROMOCIONES (si aplica)
    ↓
VALIDA: CODIGOS_DESCUENTO (si usuario ingresó código)
    ↓
CREA: RESERVAS (estado: pendiente)
    ↓
PAGO: Procesa con Flow/MercadoPago
    ↓
ACTUALIZA: RESERVAS (estado: pendiente_detalles, estadoPago: pagado)
    ↓
REGISTRA: AUDITORIA_RESERVAS (cambio de estado)
```

### Caso 2: Completar Detalles Post-Pago
```
USUARIO → Formulario de detalles
    ↓
CAPTURA: hora, numeroVuelo, hotel, equipajeEspecial, sillaInfantil
    ↓
ACTUALIZA: RESERVAS (campos opcionales)
    ↓
ACTUALIZA: estado → confirmada
    ↓
REGISTRA: AUDITORIA_RESERVAS (múltiples cambios)
    ↓
ENVIA: Notificación de confirmación
    ↓
ACTUALIZA: notificaciones_enviadas, ultimo_recordatorio
```

### Caso 3: Asignación de Conductor
```
ADMIN → Panel de administración
    ↓
SELECCIONA: Reserva confirmada
    ↓
ASIGNA: conductor_id, conductor_nombre, conductor_telefono, patente_vehiculo
    ↓
ACTUALIZA: RESERVAS
    ↓
REGISTRA: AUDITORIA_RESERVAS (asignación)
    ↓
ENVIA: Notificación al cliente con datos del conductor
```

### Caso 4: Feedback Post-Servicio
```
SERVICIO → Completado
    ↓
ACTUALIZA: RESERVAS (estado: completada, fecha_completada: NOW())
    ↓
ENVIA: Solicitud de calificación al cliente
    ↓
CLIENTE → Ingresa calificacion (1-5) y comentario_cliente
    ↓
ACTUALIZA: RESERVAS (campos de feedback)
    ↓
REGISTRA: AUDITORIA_RESERVAS
```

## 🔐 Consideraciones de Seguridad

### Datos Sensibles
```
• email: Indexado pero no expuesto en logs
• telefono: Validado y sanitizado
• ipAddress: Almacenado para auditoría
• userAgent: Para detección de fraude
```

### Auditoría Automática
```
• Trigger en RESERVAS → AUDITORIA_RESERVAS
• Tracking de cambios en campos críticos
• Registro de usuario e IP
```

### Integridad de Datos
```
• CHECK constraints en calificacion (1-5)
• ENUM para estados (previene valores inválidos)
• DEFAULT values para campos opcionales
• NOT NULL en campos críticos
```

## 📚 Referencias Cruzadas

- **Diseño Completo**: Ver `backend/DISEÑO_BASE_DATOS.md`
- **Migraciones**: Ver `backend/migrations/README.md`
- **Configuración**: Ver `backend/config/database.js`
- **Modelos**: Ver `backend/models/`

---

**Última actualización**: 2025-01-11  
**Versión**: 1.0  
**Autor**: Sistema de Reservas - Transportes Araucaria
