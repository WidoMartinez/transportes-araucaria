# Sistema de Captura de Leads Incompletos

## Descripción

Sistema que captura información de usuarios que inician una reserva en HeroExpress pero abandonan antes de completar el pago. Permite remarketing y recuperación de ventas perdidas.

## Fase 1: Captura Base (Implementada)

### Base de Datos

- **Tabla:** `leads_incompletos`
- **Script SQL de referencia:** `backend/sql/crear_tabla_leads_incompletos.sql`
- **Migración automática:** `backend/migrations/add-leads-incompletos-table.js`

### Campos Principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `session_id` | VARCHAR(100) UNIQUE | Identificador único del usuario (localStorage) |
| `origen` | VARCHAR(255) | Origen del traslado |
| `destino` | VARCHAR(255) | Destino del traslado |
| `fecha_viaje` | DATE | Fecha seleccionada |
| `hora_viaje` | TIME | Hora seleccionada |
| `num_pasajeros` | INT | Número de pasajeros |
| `email` | VARCHAR(255) | Email del usuario (Paso 2, opcional) |
| `telefono` | VARCHAR(20) | Teléfono del usuario (Paso 2, opcional) |
| `nombre` | VARCHAR(255) | Nombre del usuario (Paso 2, opcional) |
| `precio_estimado` | DECIMAL(10,2) | Precio de la cotización |
| `estado` | ENUM | Estado en el embudo de conversión |

### Estados del Lead

| Estado | Descripción |
|--------|-------------|
| `sin_datos_contacto` | Avanzó a Paso 2 sin ingresar email |
| `con_email` | Ingresó su email en Paso 2 |
| `contactado` | Se intentó contactar manualmente (Fase 2) |
| `convertido` | Completó el pago exitosamente |
| `descartado` | Descartado manualmente (Fase 2) |

---

## Flujo de Captura

### Paso 1 → Paso 2

Al hacer clic en "Reservar Ahora":
1. Se genera un `session_id` único (si no existe en `localStorage`)
2. Se llama a `POST /api/leads/guardar` con datos del viaje
3. El lead se crea con estado `sin_datos_contacto`

### Durante Paso 2

Cuando el usuario ingresa su email (debounce de 2 segundos):
1. Se llama nuevamente a `POST /api/leads/guardar` con datos de contacto
2. El lead existente se actualiza (mismo `session_id`)
3. El estado cambia a `con_email`

### Al Completar Pago

1. Se llama a `POST /api/leads/convertido` con el `session_id`
2. El estado cambia a `convertido`
3. Se limpia `leadId` y `sessionId` del `localStorage`

---

## API Endpoints

### `POST /api/leads/guardar`

Guarda o actualiza un lead incompleto.

**Body:**
```json
{
  "origen": "Aeropuerto La Araucanía",
  "destino": "Pucón",
  "fecha_viaje": "2026-04-15",
  "hora_viaje": "10:00",
  "num_pasajeros": 2,
  "precio_estimado": 45000,
  "session_id": "session_1234567890_abc123",
  "email": "cliente@example.com",
  "telefono": "+56912345678",
  "nombre": "Juan Pérez"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "leadId": 123,
  "accion": "creado",
  "message": "Lead creado correctamente"
}
```

### `POST /api/leads/convertido`

Marca un lead como convertido al completar el pago.

**Body:**
```json
{ "session_id": "session_1234567890_abc123" }
```

### `GET /api/leads`

Lista leads para el panel de administración.

**Query params:** `estado`, `page`, `limit`

---

## Archivos del Sistema

| Archivo | Descripción |
|---------|-------------|
| `backend/models/LeadIncompleto.js` | Modelo Sequelize |
| `backend/migrations/add-leads-incompletos-table.js` | Migración automática |
| `backend/routes/leads.js` | Rutas Express |
| `backend/sql/crear_tabla_leads_incompletos.sql` | Script SQL de referencia |
| `src/components/HeroExpress.jsx` | Lógica de captura en frontend |

---

## Testing Manual

1. Abrir la página principal con HeroExpress
2. Completar el Paso 1 (origen, destino, fecha, hora, pasajeros)
3. Hacer clic en "Reservar Ahora"
4. Verificar en consola del navegador: `✅ Lead guardado: creado - ID: X`
5. Ingresar un email válido en el Paso 2
6. Esperar ~2 segundos y verificar: `✅ Lead guardado: actualizado - ID: X`
7. Verificar en la base de datos:

```sql
SELECT * FROM leads_incompletos ORDER BY fecha_creacion DESC LIMIT 5;
```

---

## Notas de Implementación

- El sistema **no interrumpe la experiencia del usuario** si falla
- Los errores se registran en consola pero no se muestran al usuario
- El `session_id` persiste en `localStorage` hasta completar el pago
- Se usa debounce de 2 segundos al capturar el email para evitar múltiples llamadas
- Los datos de contacto no sobreescriben valores existentes con `null`

---

## Próximas Fases

### Fase 2: Emails Automáticos de Recuperación (Pendiente)

- Correos automáticos a leads con estado `con_email`
- Templates HTML de recuperación
- Cron job para envíos programados (backend/cron)

### Fase 3: Panel de Administración (Pendiente)

- Dashboard de leads con métricas
- Gestión manual de estados
- Reportes de conversión
