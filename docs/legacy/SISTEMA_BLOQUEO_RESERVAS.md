# Sistema de Bloqueo de Reservas

## Descripción General

Este documento describe la implementación del sistema de bloqueo de reservas para Transportes Araucaria. El sistema permite a los administradores bloquear días, horarios o fechas específicas para evitar que los usuarios generen reservas en esos períodos.

## Características Implementadas

### 1. Modelo de Datos

**Tabla: `bloqueos_agenda`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER | ID único del bloqueo (PK, auto-increment) |
| `fecha_inicio` | DATE | Fecha de inicio del bloqueo (formato YYYY-MM-DD) |
| `fecha_fin` | DATE | Fecha de fin del bloqueo (opcional, para rangos) |
| `hora_inicio` | TIME | Hora de inicio del bloqueo (opcional, formato HH:MM:SS) |
| `hora_fin` | TIME | Hora de fin del bloqueo (opcional, formato HH:MM:SS) |
| `tipo` | ENUM | Tipo de bloqueo: `dia_completo`, `rango_horario`, `fecha_especifica` |
| `motivo` | VARCHAR(255) | Motivo del bloqueo (ej: "Mantenimiento", "Festivo") |
| `activo` | BOOLEAN | Si el bloqueo está activo (default: true) |
| `descripcion` | TEXT | Descripción detallada adicional (opcional) |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |

**Índices:**
- `fecha_inicio`
- `fecha_fin`
- `activo`
- `tipo`
- Compuesto: `(fecha_inicio, fecha_fin, activo)`

### 2. Backend (Node.js + Express + Sequelize)

#### Archivos Creados/Modificados

**Nuevos Archivos:**
- `backend/models/BloqueoAgenda.js` - Modelo Sequelize
- `backend/migrations/add-bloqueos-agenda-table.js` - Migración de BD
- `backend/utils/bloqueoAgenda.js` - Utilidades de validación

**Modificados:**
- `backend/server-db.js` - Importaciones, migración y endpoints

#### Endpoints API

##### Públicos (sin autenticación)

**GET /api/bloqueos**
- Obtiene todos los bloqueos de agenda
- Respuesta: Array de objetos bloqueo

**POST /api/bloqueos/verificar**
- Verifica si una fecha/hora específica está bloqueada
- Body: `{ fecha: "2024-12-25", hora: "10:00" }`
- Respuesta: `{ success: true, bloqueado: boolean, motivo?: string }`

**POST /api/bloqueos/rango**
- Obtiene bloqueos en un rango de fechas
- Body: `{ fechaInicio: "2024-12-20", fechaFin: "2024-12-30" }`
- Respuesta: `{ success: true, bloqueos: Array }`

##### Administrativos (requieren autenticación)

**POST /api/bloqueos**
- Crea un nuevo bloqueo
- Headers: `Authorization: Bearer <token>`
- Body: Objeto con campos del bloqueo
- Respuesta: Bloqueo creado

**PUT /api/bloqueos/:id**
- Actualiza un bloqueo existente
- Headers: `Authorization: Bearer <token>`
- Respuesta: Bloqueo actualizado

**DELETE /api/bloqueos/:id**
- Elimina un bloqueo
- Headers: `Authorization: Bearer <token>`
- Respuesta: `{ success: true, message: "Bloqueo eliminado exitosamente" }`

#### Validación en Reservas

La validación se ejecuta automáticamente en:

1. **POST /enviar-reserva** (reservas web normales)
2. **POST /enviar-reserva-express** (reservas express)

**Flujo de validación:**
```javascript
// 1. Se recibe la solicitud de reserva
const datosReserva = req.body;

// 2. Se verifica si la fecha/hora está bloqueada
const bloqueoResultado = await verificarBloqueoAgenda(
    datosReserva.fecha,
    datosReserva.hora
);

// 3. Si está bloqueado, se rechaza la reserva
if (bloqueoResultado.bloqueado) {
    return res.status(400).json({
        success: false,
        message: "Agenda completada",
        error: bloqueoResultado.motivo,
        bloqueado: true,
    });
}

// 4. Si no está bloqueado, continúa el proceso normal
```

#### Lógica de Validación

La función `verificarBloqueoAgenda()` implementa la siguiente lógica:

**Para tipo "dia_completo" o "fecha_especifica":**
- Si la fecha de la reserva está dentro del rango bloqueado → **BLOQUEADA**

**Para tipo "rango_horario":**
- Si la fecha está bloqueada Y la hora está dentro del rango → **BLOQUEADA**
- Se comparan solo HH:MM (ignorando segundos)

**Ejemplo:**
```javascript
// Bloqueo: 2024-12-25, tipo: rango_horario, 08:00-12:00
// Reserva 1: 2024-12-25 10:30 → BLOQUEADA ✗
// Reserva 2: 2024-12-25 14:00 → PERMITIDA ✓
// Reserva 3: 2024-12-26 10:30 → PERMITIDA ✓
```

### 3. Frontend (React + shadcn/ui)

#### Componente AdminBloqueosAgenda

**Ubicación:** `src/components/AdminBloqueosAgenda.jsx`

**Características:**
- ✅ Listado de todos los bloqueos en tabla
- ✅ Creación de nuevos bloqueos con formulario
- ✅ Edición de bloqueos existentes
- ✅ Eliminación con confirmación
- ✅ Filtrado visual por tipo (badges de colores)
- ✅ Estado activo/inactivo con toggle
- ✅ Validación de campos requeridos

**Estados del formulario:**
```javascript
{
    fechaInicio: "",      // Requerido
    fechaFin: "",         // Opcional (excepto fecha_especifica)
    horaInicio: "",       // Solo para rango_horario
    horaFin: "",          // Solo para rango_horario
    tipo: "dia_completo", // dia_completo | rango_horario | fecha_especifica
    motivo: "",           // Texto libre
    activo: true,         // Boolean
    descripcion: "",      // Opcional
}
```

#### Integración en Panel Admin

**AdminDashboard.jsx:**
- Importado `AdminBloqueosAgenda`
- Agregado case para `active === "bloqueos"`
- Accesible vía URL: `?panel=bloqueos`

**AdminSidebar.jsx:**
- Nueva opción en categoría "Configuración"
- Ícono: `Ban` (lucide-react)
- Label: "Bloqueos de Agenda"
- Posición: Después de "Festivos"

#### Manejo de Errores en Formulario de Reserva

**Archivo:** `src/App.jsx`

```javascript
// Detección de respuesta de bloqueo
if (result.bloqueado || result.message === "Agenda completada") {
    throw new Error(
        "Agenda completada. " + 
        (result.error || "Esta fecha/hora no está disponible para reservas.")
    );
}
```

El usuario verá un mensaje de error claro:
> **"Agenda completada. [Motivo del bloqueo]"**

## Tipos de Bloqueo

### 1. Día Completo
Bloquea todas las horas de un día o rango de días.

**Ejemplo:**
```json
{
    "tipo": "dia_completo",
    "fechaInicio": "2024-12-25",
    "fechaFin": "2024-12-26",
    "motivo": "Feriado de Navidad",
    "activo": true
}
```

### 2. Rango Horario
Bloquea solo un rango de horas en días específicos.

**Ejemplo:**
```json
{
    "tipo": "rango_horario",
    "fechaInicio": "2024-12-20",
    "fechaFin": "2024-12-30",
    "horaInicio": "22:00",
    "horaFin": "06:00",
    "motivo": "Horario nocturno no disponible",
    "activo": true
}
```

### 3. Fecha Específica
Bloquea un día específico sin rango.

**Ejemplo:**
```json
{
    "tipo": "fecha_especifica",
    "fechaInicio": "2024-12-31",
    "motivo": "Año Nuevo",
    "activo": true
}
```

## Casos de Uso

### Caso 1: Bloquear día festivo
1. Admin accede a "Configuración > Bloqueos de Agenda"
2. Click en "Nuevo Bloqueo"
3. Selecciona tipo: "Día Completo"
4. Fecha inicio: 2024-12-25
5. Motivo: "Navidad"
6. Guardar

**Resultado:** Ningún usuario puede reservar para el 25 de diciembre

### Caso 2: Bloquear rango horario nocturno
1. Nuevo Bloqueo
2. Tipo: "Rango Horario"
3. Fecha inicio: 2024-12-01
4. Fecha fin: 2024-12-31
5. Hora inicio: 23:00
6. Hora fin: 05:00
7. Motivo: "Horario nocturno sin servicio"
8. Guardar

**Resultado:** Durante diciembre, no se aceptan reservas entre 23:00 y 05:00

### Caso 3: Mantenimiento programado
1. Nuevo Bloqueo
2. Tipo: "Día Completo"
3. Fecha inicio: 2024-12-15
4. Fecha fin: 2024-12-17
5. Motivo: "Mantenimiento de flota"
6. Guardar

**Resultado:** No se aceptan reservas del 15 al 17 de diciembre

## Flujo de Usuario Final

### Escenario: Usuario intenta reservar en fecha bloqueada

1. Usuario completa formulario de reserva
2. Selecciona fecha: 2024-12-25 (bloqueada)
3. Click en "Continuar al pago"
4. Sistema valida en backend
5. **Respuesta:** Error 400
   ```json
   {
       "success": false,
       "message": "Agenda completada",
       "error": "Navidad",
       "bloqueado": true
   }
   ```
6. Frontend muestra mensaje:
   > ⚠️ **Agenda completada. Navidad**
   > 
   > Esta fecha/hora no está disponible para reservas.

7. Usuario debe seleccionar otra fecha

## Consideraciones de Seguridad

### Autenticación
- Endpoints de modificación (POST, PUT, DELETE) requieren token JWT
- Solo usuarios con rol `admin` pueden gestionar bloqueos
- Middleware: `authJWT` (backend/middleware/authJWT.js)

### Validación
- Campos requeridos validados en frontend y backend
- Fechas validadas en formato ISO 8601 (YYYY-MM-DD)
- Horas validadas en formato HH:MM o HH:MM:SS
- Tipo debe ser uno de los valores ENUM permitidos

### Errores Manejados
- Bloqueo no encontrado (404)
- Campos faltantes (400)
- Error de base de datos (500)
- Sin autenticación (401)
- Sin permisos (403)

## Pruebas Recomendadas

### Backend
```bash
# 1. Crear bloqueo día completo
curl -X POST http://localhost:5000/api/bloqueos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "dia_completo",
    "fechaInicio": "2024-12-25",
    "motivo": "Test Navidad",
    "activo": true
  }'

# 2. Verificar bloqueo
curl -X POST http://localhost:5000/api/bloqueos/verificar \
  -H "Content-Type: application/json" \
  -d '{"fecha": "2024-12-25"}'

# 3. Intentar crear reserva bloqueada
curl -X POST http://localhost:5000/enviar-reserva-express \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@test.com",
    "telefono": "+56912345678",
    "origen": "Temuco",
    "destino": "Aeropuerto",
    "fecha": "2024-12-25",
    "hora": "10:00",
    "pasajeros": 1
  }'
# Esperado: Error 400 "Agenda completada"
```

### Frontend
1. **Crear bloqueo:**
   - Navegar a /admin?panel=bloqueos
   - Click "Nuevo Bloqueo"
   - Completar formulario
   - Verificar que aparece en tabla

2. **Editar bloqueo:**
   - Click en ícono de editar
   - Modificar campos
   - Guardar y verificar cambios

3. **Eliminar bloqueo:**
   - Click en ícono de eliminar
   - Confirmar eliminación
   - Verificar que desaparece de tabla

4. **Reserva bloqueada:**
   - Ir a formulario de reserva principal
   - Seleccionar fecha/hora bloqueada
   - Intentar continuar
   - Verificar mensaje "Agenda completada"

## Mantenimiento y Monitoreo

### Logs
El sistema registra en consola:
```
✅ Tabla bloqueos_agenda creada/actualizada exitosamente
❌ Reserva bloqueada: { fecha, hora, motivo }
```

### Base de Datos
```sql
-- Ver todos los bloqueos activos
SELECT * FROM bloqueos_agenda WHERE activo = 1 ORDER BY fecha_inicio;

-- Ver bloqueos futuros
SELECT * FROM bloqueos_agenda 
WHERE activo = 1 
  AND fecha_inicio >= CURDATE() 
ORDER BY fecha_inicio;

-- Desactivar bloqueo sin eliminar
UPDATE bloqueos_agenda SET activo = 0 WHERE id = 1;
```

### Performance
- Índices optimizados para consultas frecuentes
- Validación rápida con búsqueda por rango de fechas
- Sin impacto en reservas no bloqueadas

## Mejoras Futuras (Opcional)

1. **Bloqueos recurrentes:**
   - Bloquear todos los domingos
   - Bloquear primer día de cada mes
   - Patrón cron-like

2. **Notificaciones:**
   - Alertar a admins de bloqueos próximos a expirar
   - Enviar recordatorios antes de bloqueos importantes

3. **Historial:**
   - Guardar log de reservas rechazadas por bloqueo
   - Estadísticas de bloqueos más usados

4. **Importación:**
   - Importar festivos nacionales automáticamente
   - Sincronizar con calendario externo

5. **Excepciones:**
   - Permitir reservas admin en fechas bloqueadas
   - Whitelist de usuarios VIP

## Contacto y Soporte

Para preguntas o problemas:
- Revisar logs del servidor en Render.com
- Verificar conectividad a base de datos MySQL
- Consultar documentación de APIs relacionadas

---

**Fecha de implementación:** Diciembre 2024  
**Versión:** 1.0.0  
**Autor:** GitHub Copilot Agent - Admin Panel Optimizer
