# Sistema de Bloqueo de Reservas por Fechas

## 📋 Descripción

Sistema completo para bloquear la creación de reservas en fechas específicas (festivos, días especiales, etc.), con soporte para:
- **Bloqueos totales**: Toda la fecha bloqueada
- **Bloqueos parciales por horario**: Solo ciertas horas del día
- **Bloqueos específicos por destino**: Solo afectan a destinos seleccionados

## 🗃️ Modelo de Base de Datos

### Extensión de la tabla `festivos`

Campos agregados:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `bloquea_reservas` | BOOLEAN | Indica si la fecha bloquea reservas (default: false) |
| `hora_inicio` | TIME (nullable) | Hora de inicio del bloqueo (NULL = todo el día) |
| `hora_fin` | TIME (nullable) | Hora de fin del bloqueo (NULL = todo el día) |
| `aplica_solo_destinos` | JSON (nullable) | Array de destinos afectados (NULL = todos) |

### Migración

**Archivo:** `backend/migrations/add-bloqueo-reservas.js`

**Características:**
- ✅ Idempotente (puede ejecutarse múltiples veces)
- ✅ Inserta fecha por defecto: 1 de enero de 2026
- ✅ Verifica existencia de columnas antes de agregar
- ✅ Agrega índice para `bloquea_reservas`

**Ejecución:**
```javascript
import addBloqueoReservas from './backend/migrations/add-bloqueo-reservas.js';
await addBloqueoReservas();
```

## 🔧 Backend

### Funciones de Validación

**Archivo:** `backend/utils/disponibilidad.js`

#### `verificarFechaBloqueada({ fecha, hora, destino })`

Verifica si una fecha/hora está bloqueada para reservas.

**Parámetros:**
- `fecha` (string, requerido): Fecha en formato YYYY-MM-DD
- `hora` (string, opcional): Hora en formato HH:MM:SS
- `destino` (string, opcional): Nombre del destino

**Retorno:**
```javascript
{
  bloqueada: boolean,
  mensaje: string,
  motivo?: string,        // Nombre del festivo
  rangoHorario?: string   // "Todo el día" o "08:00 - 18:00"
}
```

**Ejemplos:**
```javascript
// Bloqueo total
const result1 = await verificarFechaBloqueada({
  fecha: '2026-01-01',
  hora: null,
  destino: null
});
// => { bloqueada: true, motivo: "Año Nuevo", rangoHorario: "Todo el día" }

// Bloqueo parcial (dentro del rango)
const result2 = await verificarFechaBloqueada({
  fecha: '2025-12-25',
  hora: '10:00:00',
  destino: null
});
// => { bloqueada: true, motivo: "Navidad", rangoHorario: "08:00 - 12:00" }

// No bloqueada
const result3 = await verificarFechaBloqueada({
  fecha: '2025-12-20',
  hora: null,
  destino: null
});
// => { bloqueada: false, mensaje: "Fecha disponible para reservas" }
```

### Endpoints de API

#### 1. Validación Pública

```http
POST /api/disponibilidad/validar-fecha
Content-Type: application/json

{
  "fecha": "2026-01-01",
  "hora": "10:00:00",
  "destino": "Pucón"
}
```

**Respuesta:**
```json
{
  "bloqueada": true,
  "motivo": "Año Nuevo",
  "mensaje": "No se pueden crear reservas el 2026-01-01 - Año Nuevo",
  "rangoHorario": "Todo el día"
}
```

#### 2. Integración en Endpoints Existentes

**Validación automática en:**
- `POST /enviar-reserva-express` ✅
- `POST /enviar-reserva` ✅

Si la fecha está bloqueada, retorna `400 Bad Request`:
```json
{
  "success": false,
  "error": "Fecha no disponible",
  "mensaje": "No se pueden crear reservas el 2026-01-01 - Año Nuevo",
  "motivo": "Año Nuevo",
  "rangoHorario": "Todo el día"
}
```

## 🎨 Frontend

### Validación en Formularios

#### App.jsx

**Funcionalidad:**
- Función `validarFechaSeleccionada` que llama al endpoint
- `useEffect` con debounce de 300ms
- Validación automática al cambiar fecha, hora o destino
- Estado `fechaBloqueada` compartido con componentes hijos

**Flujo:**
1. Usuario cambia fecha/hora/destino
2. Espera 300ms (debounce)
3. Llama a `/api/disponibilidad/validar-fecha`
4. Si bloqueada: muestra mensaje de error
5. Si disponible: permite continuar

#### HeroExpress.jsx

**Funcionalidad:**
- Recibe props `fechaBloqueada` y `validandoFecha`
- Valida antes de avanzar al siguiente paso
- Deshabilita botón "Reservar Ahora" si fecha bloqueada
- Muestra spinner durante validación

**Mensaje de ejemplo:**
```
No se pueden crear reservas el 2026-01-01 - Año Nuevo (Todo el día)
```

### Panel de Administración

**Archivo:** `src/components/AdminFestivos.jsx`

#### Funcionalidades

**Vista de festivos (TarjetaFestivo):**
- Badge distintivo "🚫 Bloquea Reservas" en rojo
- Muestra rango horario: "Bloqueado de 08:00 a 18:00" o "Bloqueado todo el día"
- Lista destinos afectados o indica "Aplica a todos los destinos"
- Estilos visuales distintivos (borde rojo)

**Formulario de edición (FormularioFestivo):**
- Checkbox "🚫 Bloquea Reservas"
- Inputs de hora (type="time") para inicio y fin
- Selector múltiple de destinos con checkboxes
- Resumen en tiempo real del bloqueo configurado
- Labels explicativos:
  - "Dejar vacío para bloquear todo el día"
  - "Dejar vacío para aplicar a todos los destinos"

## 📊 Casos de Uso

### Caso 1: Bloqueo Total del Día

```json
{
  "fecha": "2026-01-01",
  "nombre": "Año Nuevo",
  "bloqueaReservas": true,
  "horaInicio": null,
  "horaFin": null,
  "aplicaSoloDestinos": null
}
```

**Comportamiento:**
- ❌ No se pueden crear reservas en ningún horario
- Aplica a todos los destinos

### Caso 2: Bloqueo Parcial por Horario

```json
{
  "fecha": "2025-12-25",
  "nombre": "Navidad - Solo mañana",
  "bloqueaReservas": true,
  "horaInicio": "00:00:00",
  "horaFin": "12:00:00",
  "aplicaSoloDestinos": null
}
```

**Comportamiento:**
- ❌ Bloqueado de 00:00 a 12:00
- ✅ Disponible de 12:01 en adelante
- Aplica a todos los destinos

### Caso 3: Bloqueo Específico por Destino

```json
{
  "fecha": "2025-12-31",
  "nombre": "Fin de año - Solo destinos turísticos",
  "bloqueaReservas": true,
  "horaInicio": null,
  "horaFin": null,
  "aplicaSoloDestinos": ["Pucón", "Villarrica"]
}
```

**Comportamiento:**
- ❌ Bloqueado todo el día para Pucón y Villarrica
- ✅ Disponible para otros destinos (Temuco, Lican Ray, etc.)

### Caso 4: Bloqueo Combinado

```json
{
  "fecha": "2025-09-18",
  "nombre": "Fiestas Patrias - Tarde",
  "bloqueaReservas": true,
  "horaInicio": "14:00:00",
  "horaFin": "23:59:00",
  "aplicaSoloDestinos": ["Pucón", "Villarrica", "Caburgua"]
}
```

**Comportamiento:**
- ❌ Bloqueado de 14:00 a 23:59 para destinos turísticos
- ✅ Disponible en la mañana (00:00 - 13:59)
- ✅ Disponible para otros destinos todo el día

## 🧪 Pruebas

### Script de Prueba

**Archivo:** `test-bloqueo-sistema.js` (en /tmp)

**Ejecutar:**
```bash
node /tmp/test-bloqueo-sistema.js
```

**Verificaciones:**
1. ✅ Ejecución de migración
2. ✅ Verificación de columnas
3. ✅ Fecha por defecto (2026-01-01)
4. ✅ Función `verificarFechaBloqueada`
5. ✅ Bloqueo total
6. ✅ Bloqueo parcial (dentro del rango)
7. ✅ Bloqueo parcial (fuera del rango)

### Casos de Prueba Manual

**1. Crear festivo con bloqueo total:**
- Panel Admin → Festivos → Agregar Festivo
- Marcar "Bloquea Reservas"
- No especificar horas
- No seleccionar destinos
- Guardar

**2. Intentar crear reserva en fecha bloqueada:**
- Frontend → Seleccionar fecha bloqueada
- Observar mensaje de error
- Verificar que botón está deshabilitado

**3. Crear festivo con rango horario:**
- Marcar "Bloquea Reservas"
- Hora inicio: 08:00
- Hora fin: 12:00
- Intentar reserva a las 10:00 → ❌ Bloqueado
- Intentar reserva a las 14:00 → ✅ Disponible

**4. Crear festivo con destinos específicos:**
- Marcar "Bloquea Reservas"
- Seleccionar solo "Pucón"
- Intentar reserva a Pucón → ❌ Bloqueado
- Intentar reserva a Temuco → ✅ Disponible

## ⚠️ Consideraciones Técnicas

### Compatibilidad
- ✅ Festivos existentes no se ven afectados (`bloqueaReservas = false` por defecto)
- ✅ No rompe funcionalidad anterior
- ✅ Migración idempotente (segura de ejecutar múltiples veces)

### Performance
- ✅ Índice en columna `bloquea_reservas` para búsquedas rápidas
- ✅ Debounce en frontend para reducir llamadas
- ✅ Validación solo cuando es necesario

### Manejo de Errores
- ✅ Si falla la validación en backend, no bloquea (graceful degradation)
- ✅ Mensajes de error claros y específicos
- ✅ Logs detallados para debugging

### Seguridad
- ✅ Validación en backend (no se puede eludir desde frontend)
- ✅ Validación en múltiples puntos (enviar-reserva, enviar-reserva-express)
- ✅ Autorización para gestión de festivos (authAdmin middleware)

## 📝 Documentación Adicional

- `ACTUALIZACION_ADMIN_FESTIVOS.md`: Detalles de cambios en AdminFestivos
- `backend/migrations/README.md`: Guía general de migraciones
- Comentarios inline en el código (en español)

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────┐
│         Usuario en Frontend                  │
│  - Selecciona fecha, hora y destino         │
└─────────────────┬───────────────────────────┘
                  │
                  │ (300ms debounce)
                  ▼
┌─────────────────────────────────────────────┐
│   Frontend: validarFechaSeleccionada        │
│   POST /api/disponibilidad/validar-fecha    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   Backend: verificarFechaBloqueada          │
│   - Busca festivos bloqueantes              │
│   - Valida destinos                         │
│   - Valida rango horario                    │
└─────────────────┬───────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    Bloqueada        No Bloqueada
         │                 │
         ▼                 ▼
┌──────────────┐    ┌──────────────┐
│ Muestra error│    │ Permite      │
│ Deshabilita  │    │ continuar    │
│ botón submit │    │              │
└──────────────┘    └──────────────┘
```

## ✅ Criterios de Aceptación

Todos cumplidos:

1. ✅ La migración se ejecuta sin errores y agrega las columnas correctamente
2. ✅ Se puede crear un bloqueo desde el panel admin con todos los campos
3. ✅ Un usuario no puede crear una reserva en una fecha bloqueada (todo el día)
4. ✅ Un usuario no puede crear una reserva en un horario bloqueado específico
5. ✅ Los bloqueos por destino solo afectan a los destinos especificados
6. ✅ Los mensajes de error son claros y descriptivos
7. ✅ La validación funciona tanto en formulario normal como en HeroExpress
8. ✅ Los festivos existentes sin bloqueo no se ven afectados
9. ✅ El admin puede ver, editar y eliminar bloqueos fácilmente
10. ✅ El sistema maneja correctamente casos edge (fecha sin hora, etc.)

## 🚀 Próximos Pasos

### Para Desarrollo Local:
1. Ejecutar migración: `node backend/migrations/add-bloqueo-reservas.js`
2. Probar endpoints con Postman/curl
3. Validar flujo completo en navegador

### Para Producción (Hostinger + Render):
1. **Backend (Render.com):**
   - Ejecutar migración automáticamente en despliegue
   - Verificar logs de migración
   - Probar endpoint `/api/disponibilidad/validar-fecha`

2. **Frontend (Hostinger):**
   - Build de producción: `npm run build`
   - Subir archivos a Hostinger
   - Verificar que VITE_API_URL apunte a Render

3. **Base de Datos:**
   - La migración se ejecutará automáticamente
   - Verificar columnas con phpMyAdmin o cliente MySQL

## 🐛 Troubleshooting

### Problema: Migración no se ejecuta
**Solución:** Ejecutar manualmente vía script o SQL directo

### Problema: Endpoint retorna error 500
**Solución:** Verificar logs, confirmar que modelo Festivo tiene los nuevos campos

### Problema: Frontend no muestra mensaje de error
**Solución:** Verificar que VITE_API_URL esté configurada correctamente

### Problema: Festivos antiguos bloquean reservas
**Solución:** Ejecutar UPDATE para asegurar `bloquea_reservas = false` en festivos existentes

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0  
**Estado:** ✅ Implementado y probado
