# 🔧 Guía de Solución de Problemas (Troubleshooting)

Este documento centraliza las soluciones a problemas comunes técnicos detectados durante el desarrollo, incluyendo migraciones y errores de enrutamiento.

## 1. Problemas de Rutas y Backend (Error 500)

### Síntoma
Error 500 al acceder a ciertos endpoints (ej. `/api/reservas/estadisticas`) o pantallas en blanco en el panel administrativo.

### Causa
- **Desincronización de BD**: Las tablas no existen en el entorno de Render (especialmente tras un despliegue limpio).
- **Rutas no coincidentes**: El frontend intenta acceder a rutas locales (`localhost`) en lugar de producción.

### Solución
1. **Verificar Variables de Entorno**: Asegurar que `VITE_API_URL` en `.env.local` apunte a `https://transportes-araucaria.onrender.com`.
2. **Sincronización de Tablas**:
   - El backend tiene una función `syncDatabase()` que debe ejecutarse al inicio.
   - Si faltan columnas (ej. `totalConDescuento` no existe), se debe forzar una migración o alteración de tabla.
3. **Logs**: Revisar logs de Render.com para ver el error SQL exacto.

> **Referencia detallada**: Ver `docs/legacy/PROBLEMA_BACKEND_500.md`.

## 2. Migración de Tablas y Base de Datos

### Problema
Cambios en el esquema local (ej. nuevas columnas en `Reservas`) no se reflejan automáticamente en producción, causando errores de consulta.

### Procedimiento de Migración (Estándar 2026)
El sistema utiliza un **sistema de auto-migración al inicio** (`server-db.js`).

1.  **Crear Script**: Crear el archivo en `backend/migrations/nombre-migracion.js` siguiendo el patrón estándar (ver `MIGRATION_README.md`).
2.  **Integrar**: Importar y ejecutar la función `await nombreMigracion()` dentro de la función `startServer()` en `backend/server-db.js`.
3.  **Despliegue**: Al hacer push, Render reiniciará el servidor y ejecutará la migración automáticamente con las credenciales de producción.

**Nota Importante**: No ejecutar scripts manualmente en local si no se tienen las credenciales de producción configuradas. Confiar en el ciclo de despliegue.

## 3. Problemas de Autenticación (Migración Auth)

### Problema
El panel administrativo no permite editar tras login.

### Solución (Aplicada)
Se migró de `localStorage.getItem('adminToken')` a un `AuthContext` robusto.
- **Antes**: Componentes buscaban un token estático.
- **Ahora**: `useAuth()` provee el token actualizado.

> **Referencia detallada**: Ver `docs/legacy/MIGRACION_AUTH_ADMINRESERVAS.md`.

## 4. Problemas de Google Maps (Rutas y Autocomplete)

### Problema
Error `RefererNotAllowedMapError` o advertencias de deprecación.

### Solución
- **Componente**: Usar `<place-autocomplete-element>` en lugar de la librería legacy de Google Places para evitar warnings de deprecación.

## 5. Problemas de Conversiones Google Ads (Rutas Fantasma)

### Problema
Las conversiones no se registraban porque la página de retorno (`/flow-return`) no cargaba, mostrando 404 o la página de inicio. Esto se debía a **"Rutas Fantasma" o Shadowing**: el enrutador del cliente (React Router) tenía rutas genéricas (`*` o `/`) que capturaban la URL antes que la ruta específica de retorno.

### Solución (App.jsx)
Se implementó un mecanismo de **detección manual de ruta** en `App.jsx` que bypasssea el enrutador normal cuando detecta un retorno de pago.

```javascript
// App.jsx
const resolveIsFlowReturnView = () => {
    // Detecta tanto /flow-return (path) como #flow-return (hash)
    const pathname = window.location.pathname.toLowerCase();
    return pathname.includes("/flow-return");
};

// Renderizado condicional prioritario
if (isFlowReturnView) {
    return <FlowReturn />;
}
```

Esto garantiza que la página de agradecimiento y el script de conversión (`gtag`) se ejecuten siempre, independientemente de la configuración del servidor o del enrutador cliente.

## 6. Planificación Mostrando Reservas No Pagadas

### Problema
La vista de planificación (calendario) mostraba reservas que no habían sido pagadas, incluyendo aquellas en estado pendiente sin confirmación de pago.

### Causa
El endpoint `/api/reservas/calendario` solo filtraba por estado (`cancelada`, `rechazada`) pero no verificaba el estado de pago de las reservas.

### Solución (Diciembre 2025)
Se modificó el endpoint en `backend/server-db.js` para incluir filtros de pago:

```javascript
// Solo incluir reservas confirmadas (con pago)
const reservasIda = await Reserva.findAll({
  where: {
    fecha: { [Op.gte]: startDate, [Op.lte]: endDateInclusive },
    estado: { [Op.notIn]: ["cancelada", "rechazada"] },
    // Filtrar solo reservas confirmadas
    [Op.or]: [
      { abonoPagado: true },
      { saldoPagado: true }
    ]
  },
  order: [["fecha", "ASC"], ["hora", "ASC"]],
});
```

Adicionalmente, se agregó la columna "Número de Reserva" en la tabla de planificación para facilitar la identificación de cada viaje.

**Archivos modificados**:
- `backend/server-db.js` (líneas 776-799)
- `src/components/AdminReservas.jsx` (líneas 629-673)

## 7. Planificación Mostrando Información Genérica de Asignación

### Problema
La vista de planificación imprimible mostraba información genérica como "Auto Privado" o "(Conductor asignado)" en lugar de los datos específicos del vehículo y conductor asignados (patente, nombre).

### Causa
El endpoint `/api/reservas/calendario` no incluía las relaciones con los modelos `Conductor` y `Vehiculo`, por lo que solo enviaba los campos básicos (`vehiculo` como texto genérico y `conductorId` como número).

### Solución (Diciembre 2025)

**Backend** - Se agregaron includes de Sequelize para obtener datos relacionados:

```javascript
// En ambas consultas (reservasIda y reservasVuelta)
include: [
  { model: Conductor, as: 'conductor_asignado', required: false },
  { model: Vehiculo, as: 'vehiculo_asignado', required: false }
]
```

Se agregaron nuevos campos en la respuesta del endpoint:
- `conductorNombre`: Nombre completo del conductor
- `vehiculoPatente`: Patente del vehículo (ej: "ABCD12")
- `vehiculoTipo`: Tipo de vehículo (ej: "SUV", "Sedan")

**Frontend** - Se mejoró la lógica de renderizado en `AdminReservas.jsx`:

```javascript
// Prioridad 1: Mostrar datos específicos si están disponibles
if (ev.vehiculoPatente || ev.conductorNombre) {
  asignacion = `
    🚗 ${vehiculoTipo} (${vehiculoPatente})<br>
    👤 ${conductorNombre}
  `;
}
// Prioridad 2: Fallback a información genérica
else if (ev.vehiculo || ev.conductorId) {
  asignacion = `${ev.vehiculo}<br>(Conductor asignado)`;
}
```

**Resultado**:
- **Antes**: "Auto Privado" / "(Conductor asignado)"
- **Ahora**: "🚗 SUV (ABCD12)" / "👤 Juan Pérez"

**Archivos modificados**:
- `backend/server-db.js` (líneas 789-869)
- `src/components/AdminReservas.jsx` (líneas 659-690)

---
**Nota**: Si el problema persiste, revisar la carpeta `docs/legacy/` para bitácoras históricas más específicas.

## 8. Configuración de Modal de WhatsApp

### Problema
El modal de WhatsApp no respeta la configuración establecida en el panel administrativo, o los cambios no se reflejan para los usuarios.

### Síntomas Comunes
- El modal sigue apareciendo después de desactivarlo en el panel admin
- Los cambios no se ven reflejados inmediatamente
- Error al intentar cambiar la configuración desde el panel
- El botón de WhatsApp no funciona correctamente

### Causas y Soluciones

#### 1. Caché del Navegador
**Causa**: El navegador del usuario tiene cacheada la configuración antigua en `localStorage`.

**Solución**:
- Los usuarios deben limpiar la caché del navegador (Ctrl+Shift+Delete)
- O abrir en ventana privada/incógnita para ver los cambios inmediatamente
- La configuración se actualizará automáticamente en la próxima visita

#### 2. Migración No Ejecutada
**Causa**: La tabla `configuracion` no existe en la base de datos porque la migración no se ejecutó.

**Solución**:
1. Verificar logs del servidor en Render.com
2. Buscar mensaje: "✅ Tabla configuracion creada exitosamente"
3. Si no aparece, verificar que `addConfiguracionTable()` esté siendo llamada en `startServer()` de `backend/server-db.js`
4. Redeploy del servidor para forzar ejecución de migraciones

**Verificación Manual** (si tienes acceso a BD):
```sql
-- Verificar que la tabla existe
SHOW TABLES LIKE 'configuracion';

-- Verificar que la configuración existe
SELECT * FROM configuracion WHERE clave = 'whatsapp_intercept_activo';
```

#### 3. Error de Autenticación en Panel Admin
**Causa**: El token JWT no es válido o ha expirado al intentar cambiar la configuración.

**Solución**:
1. Cerrar sesión y volver a iniciar sesión en el panel admin
2. Verificar que el usuario tenga permisos de administrador
3. Revisar consola del navegador (F12) para ver errores específicos

**Verificación**:
```javascript
// En consola del navegador
localStorage.getItem('token') // Debe retornar un token válido
```

#### 4. Endpoint No Responde
**Causa**: El backend no está respondiendo correctamente a las peticiones de configuración.

**Solución**:
1. Verificar que el servidor esté corriendo
2. Probar el endpoint manualmente:
   ```bash
   # GET (público)
   curl https://transportes-araucaria.onrender.com/api/configuracion/whatsapp-intercept
   
   # PUT (requiere token)
   curl -X PUT https://transportes-araucaria.onrender.com/api/configuracion/whatsapp-intercept \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"activo": false}'
   ```
3. Revisar logs del servidor para errores

#### 5. Tracking de Google Ads No Funciona
**Causa**: El tracking está configurado para funcionar en ambos casos (modal activo/inactivo), pero puede haber un error en la implementación.

**Verificación**:
- El tracking debe dispararse en `handleWhatsAppClick()` en `Header.jsx`
- Verificar en Network tab del navegador que se envía la petición a Google Ads
- ID de conversión: `AW-17529712870/M7-iCN_HtZUbEObh6KZB`

**Solución**:
- El tracking está implementado antes de verificar la configuración, por lo que debería funcionar siempre
- Si no funciona, revisar que la función `trackWhatsAppClick()` se esté ejecutando

### Verificación de Estado Correcto

Para verificar que el sistema funciona correctamente:

1. **Backend**:
   ```bash
   # Verificar que el endpoint responde
   curl https://transportes-araucaria.onrender.com/api/configuracion/whatsapp-intercept
   # Debe retornar: {"activo": true/false, "mensaje": "..."}
   ```

2. **Frontend - Panel Admin**:
   - Ir a "Configuración → Configuración General"
   - Verificar que el switch muestra el estado actual
   - Cambiar el estado y verificar mensaje de confirmación

3. **Frontend - Usuario**:
   - Abrir ventana privada
   - Ir a la página principal
   - Hacer clic en botón de WhatsApp
   - Verificar comportamiento según configuración:
     - **Activo**: Debe aparecer modal con descuentos
     - **Inactivo**: Debe abrir WhatsApp directamente

### Logs Útiles

**Backend** (Render.com):
```
🔄 Verificando tabla configuracion...
📋 Creando tabla configuracion...
✅ Tabla configuracion creada exitosamente
✅ Configuración inicial de WhatsApp establecida (activo: true)
✅ Migración de configuracion completada
```

**Frontend** (Consola del navegador):
```javascript
// Al cargar Header
"Configuración WhatsApp intercept cargada: true"

// Al hacer clic en WhatsApp con modal activo
"Mostrando modal de intercepción"

// Al hacer clic en WhatsApp con modal inactivo
"Abriendo WhatsApp directamente"
```

### Referencias
- **Documentación técnica**: `docs/WHATSAPP_INTERCEPT_CONFIG.md`
- **Guía de usuario**: `GUIA_USO_CONFIGURACION_WHATSAPP.md`
- **Código de migración**: `backend/migrations/add-configuracion-table.js`
- **Modelo**: `backend/models/Configuracion.js`

---

## 9. Sistema de Documentación y Workflow

**Implementado: 7 Enero 2026**

### Problema
Los agentes IA y desarrolladores no consultaban la documentación antes de hacer cambios, resultando en:
- Errores iterativos (resolver el mismo problema múltiples veces)
- Soluciones inconsistentes con la arquitectura establecida
- Documentación desactualizada y fragmentada
- Pérdida de conocimiento sobre problemas ya resueltos

### Causa
- No había un sistema estructurado para consultar documentación
- No existía un workflow estandarizado para actualizar documentación
- Las reglas del agente no priorizaban la consulta de documentación
- Información dispersa en múltiples archivos

### Solución (Sistema Completo Implementado)

#### 1. Documentos Maestros Oficiales

**Solo estos dos documentos deben mantenerse**:
- **`DOCUMENTACION_MAESTRA.md`**: Arquitectura, funcionalidades, flujos técnicos
- **`GUIA_SOLUCION_PROBLEMAS.md`**: Troubleshooting, errores recurrentes (este documento)

**Regla crítica**: NO crear documentos nuevos. Consolidar toda información en estos dos.

#### 2. Guía Rápida para Agentes

**Archivo**: `.agent/GUIA_AGENTE.md`

Contiene:
- Checklist pre-intervención
- Mapa de dónde encontrar información específica
- Reglas críticas de arquitectura
- Referencias rápidas a secciones clave

**Cuándo consultar**: SIEMPRE antes de hacer cualquier cambio en el proyecto.

#### 3. Workflow de Documentación

**Comando**: `/documentacion`

**Archivo**: `.agent/workflows/documentacion.md`

**Pasos del workflow**:
1. Revisar cambios recientes
2. Identificar qué documentar (funcionalidad vs problema)
3. Actualizar `DOCUMENTACION_MAESTRA.md` (si es funcionalidad/arquitectura)
4. Actualizar `GUIA_SOLUCION_PROBLEMAS.md` (si es bug/error)
5. Verificar consistencia
6. Commit de cambios (auto-ejecutable con turbo)

**Cuándo ejecutar**:
- Después de resolver un bug complejo
- Al implementar una nueva funcionalidad mayor
- Al modificar la arquitectura del sistema
- Cuando se detecte documentación desactualizada

#### 4. Configuración del Agente

**Archivo**: `.agent/customize.yaml`

**Reglas críticas agregadas**:
```yaml
# === DOCUMENTACIÓN OBLIGATORIA ===
- "CRÍTICO: Antes de intervenir el proyecto, SIEMPRE consultar .agent/GUIA_AGENTE.md, DOCUMENTACION_MAESTRA.md y GUIA_SOLUCION_PROBLEMAS.md"
- "Si el problema ya está documentado en GUIA_SOLUCION_PROBLEMAS.md, seguir la solución establecida sin inventar alternativas"
- "Después de resolver un problema nuevo o implementar funcionalidad, actualizar la documentación usando /documentacion"
```

### Flujo de Trabajo Correcto

**Para Agentes IA**:
```
1. Recibir tarea
2. Consultar .agent/GUIA_AGENTE.md (visión general)
3. Consultar DOCUMENTACION_MAESTRA.md (arquitectura/funcionalidad)
4. Consultar GUIA_SOLUCION_PROBLEMAS.md (si es un error)
5. ¿Problema ya documentado?
   - SÍ → Seguir solución establecida
   - NO → Implementar solución nueva
6. Ejecutar cambios
7. Ejecutar /documentacion
8. Actualizar documentos maestros
9. Commit
```

**Para Desarrolladores**:
```
1. Onboarding → Leer GUIA_AGENTE.md
2. Desarrollo → Consultar DOCUMENTACION_MAESTRA.md
3. Debugging → Consultar GUIA_SOLUCION_PROBLEMAS.md
4. Después de cambios → Ejecutar /documentacion
```

### Verificación de Uso Correcto

**Checklist antes de intervenir**:
- [ ] ¿Consulté `.agent/GUIA_AGENTE.md`?
- [ ] ¿Consulté `DOCUMENTACION_MAESTRA.md`?
- [ ] ¿Consulté `GUIA_SOLUCION_PROBLEMAS.md`?
- [ ] ¿El problema ya tiene solución documentada?
- [ ] ¿Entiendo la arquitectura del sistema?

**Checklist después de resolver**:
- [ ] ¿Ejecuté `/documentacion`?
- [ ] ¿Actualicé el documento correcto?
- [ ] ¿Documenté archivos y líneas modificadas?
- [ ] ¿Hice commit con mensaje descriptivo?

### Beneficios Esperados

✅ **Menos errores iterativos**: Problemas se resuelven una sola vez
✅ **Consistencia**: Todos siguen la misma arquitectura
✅ **Conocimiento centralizado**: Toda la información en 2 documentos
✅ **Onboarding rápido**: Nuevos desarrolladores encuentran todo fácilmente
✅ **Documentación actualizada**: Workflow automático mantiene docs al día

### Archivos Modificados

- `.agent/workflows/documentacion.md` (nuevo)
- `.agent/GUIA_AGENTE.md` (nuevo)
- `.agent/customize.yaml` (líneas 6-11)
- `DOCUMENTACION_MAESTRA.md` (líneas 3-4, 66-88)

### Referencias

- **Guía rápida**: `.agent/GUIA_AGENTE.md`
- **Workflow**: `.agent/workflows/documentacion.md`
- **Documentación maestra**: `DOCUMENTACION_MAESTRA.md` (Sección 2)
- **Configuración**: `.agent/customize.yaml`

> [!IMPORTANT]
> **Regla de Oro**: Siempre consultar documentación ANTES de intervenir. Si el problema ya está documentado aquí, seguir la solución establecida.

---

## 10. Error de Sincronización de Base de Datos (Key column doesn't exist)

### Problema
Al iniciar el servidor, se detiene con un error crítico indicando que una columna clave no existe, generalmente al intentar crear un índice.

**Error típico:**
`Error: Key column 'codigo_reserva_vinculado' doesn't exist in table`

### Causa
Esto ocurre cuando hay un conflicto en el **orden de inicialización** en `backend/server-db.js`.
1. El backend intenta ejecutar `syncDatabase()`, que lee el modelo (`CodigoPago.js`) donde se definen índices nuevos.
2. Sequelize intenta crear esos índices en la tabla física.
3. Si la migración que crea la columna (`addClientDataToCodigosPago`) está programada para ejecutarse **después** de `syncDatabase`, la columna aún no existe físicamente cuando Sequelize intenta indexarla.

### Solución (Aplicada Enero 2026)
Se debe modificar el orden de ejecución en `backend/server-db.js` para asegurar que las migraciones de estructura crítica ocurran **ANTES** de la sincronización de modelos.

**Orden Incorrecto (Falla):**
```javascript
await syncDatabase(false, [AdminUser, CodigoPago, ...]);
// ...
await addClientDataToCodigosPago(); // Falla: la columna se crea muy tarde
```

**Orden Correcto (Solución):**
```javascript
// 1. Ejecutar migraciones estructurales primero
await addCodigosPagoTable();
await addClientDataToCodigosPago(); 

// 2. Luego sincronizar modelos (los índices funcionarán porque la col ya existe)
await syncDatabase(false, [AdminUser, CodigoPago, ...]);
```

### Prevención
Cuando se agreguen columnas nuevas que tienen índices definidos en el modelo:
1. Crear la migración correspondiente.
2. Importarla en `server-db.js`.
3. Colocar su ejecución (`await miMigracion()`) **ANTES** de `await syncDatabase()`.

**Archivos afectados**:
- `backend/server-db.js` (Reordenamiento de inicialización)
- `backend/models/CodigoPago.js` (Definición de índices)
- `backend/migrations/add-client-data-to-codigos-pago.js` (Script de migración)
 
 ---
 
 ## 11. Error "Faltan campos requeridos: fecha" en Pagos de Diferencia
 
 ### Problema
 Al intentar pagar un código de diferencia vinculado a una reserva, el sistema arroja el error "Faltan campos requeridos: fecha" y no permite procesar el pago.
 
 ### Causa
 1. **Inconsistencia en el Frontend**: La interfaz ocultaba los campos de fecha/hora para códigos vinculados (usando el código de texto `AR-...`), pero la lógica de envío (`procesarPagoConCodigoFlow`) solo saltaba la creación de la reserva si existía el ID numérico (`reservaVinculadaId`).
 2. **Datos faltantes**: Si el ID era nulo, el frontend intentaba crear una "reserva express" vacía (ya que los campos estaban ocultos y no se validaban), lo que el backend rechazaba por falta de `fecha`.
 3. **Error en Admin**: El panel de administración no estaba enviando el `reservaVinculadaId` al crear el código, solo el código de texto.
 
 ### Solución (Enero 2026)
 1. **Admin**: Se actualizó `AdminCodigosPago.jsx` para incluir `reservaVinculadaId` en el payload de creación.
 2. **Bypass Robusto**: Se modificó `PagarConCodigo.jsx` para que el bypass de creación de reserva se active si existe **o bien el ID o bien el código de texto** (`AR-...`).
 3. **Consistencia**: Se unificaron los criterios de validación, renderizado y procesamiento bajo una misma lógica de vinculación.
 
 **Archivos afectados**:
 - `src/components/AdminCodigosPago.jsx` (Guardado de ID)
 - `src/components/PagarConCodigo.jsx` (Lógica de bypass y validación)
 - `backend/models/CodigoPago.js` (Estructura de datos)



---

## 12. Pagos Pendientes Tratados como Exitosos (Flow Status 1 vs 2)

**Implementado: 7 Enero 2026**

### Problema
Los pagos que quedaban en estado "Pendiente" (Flow Status 1) se trataban como exitosos, mostrando la pantalla de "¡Pago Exitoso!" al cliente y registrando conversiones en Google Ads antes de que el dinero estuviera realmente confirmado.

### Síntomas
- Cliente ve "¡Pago Exitoso!" pero en el panel de Flow aparece "Pendiente"
- Conversiones de Google Ads se registran para pagos no confirmados
- Logs del backend muestran `[CONVERSIÓN GA]` con monto real para pagos pendientes
- Discrepancia entre lo que ve el cliente y el estado real en Flow

### Causa
En `backend/server-db.js`, el endpoint `/api/payment-result` (línea 7059) aceptaba tanto `status === 2` (pagado) como `status === 1` (pendiente) y los trataba de la misma manera.

### Solución (Enero 2026)

**Backend**: Separar lógica de estados en `backend/server-db.js` (líneas 7058-7201):
- Solo `status === 2` redirige con `status=success` y registra conversión
- `status === 1` redirige con `status=pending` sin monto (evita conversión prematura)

**Frontend**: Agregar soporte para estado pendiente en `src/components/FlowReturn.jsx`:
- Detección de `status=pending` (líneas 92-96)
- Ícono Clock y UI apropiada (líneas 5, 287-302)
- Mensaje informativo explicando que el pago está siendo procesado

### Estados de Flow

| Status | Significado | Acción del Sistema |
|--------|-------------|-------------------|
| 1 | Pendiente | Mostrar mensaje de espera, NO registrar conversión |
| 2 | Pagado | Mostrar éxito, registrar conversión de Google Ads |
| 3 | Rechazado | Mostrar error |
| 4 | Anulado | Mostrar error |

### Archivos Modificados

- `backend/server-db.js` (líneas 7058-7201)
- `src/components/FlowReturn.jsx` (líneas 5, 92-96, 287-302, CardContent)

> [!IMPORTANT]
> El webhook de confirmación (`/api/flow-confirmation`) solo procesa pagos con `status === 2`, por lo que los pagos pendientes eventualmente se confirmarán cuando Flow los apruebe.

---

## 13. Fechas Inválidas en Reservas Express (252026-01-09)

**Implementado: 7 Enero 2026**

### Problema
Las reservas creadas desde el flujo de "Pagar con Código" se guardaban con fechas malformadas (ej: `'252026-01-09'` en lugar de `'2026-01-09'`), causando:
- Error de Moment.js: `Deprecation warning: value provided is not in a recognized RFC2822 or ISO format`
- La fecha se guardaba como `0000-00-00` en la base de datos
- La interfaz mostraba `0000-00-00` en los detalles de la reserva

### Síntomas
```
Deprecation warning: value provided is not in a recognized RFC2822 or ISO format.
Reserva express recibida: {
  fecha: '252026-01-09',  // ❌ Formato inválido
  ...
}
Error
    at hooks.createFromInputFallback (/opt/render/project/src/backend/node_modules/moment/moment.js:324:25)
```

### Causa
El backend no validaba ni sanitizaba las fechas recibidas del frontend. Si por alguna razón (concatenación incorrecta, error de input, manipulación de datos) la fecha llegaba malformada, se guardaba directamente en la base de datos sin verificación.

### Solución (Enero 2026)

Se implementó una función de validación y sanitización de fechas en `backend/server-db.js`:

**Función `validarYSanitizarFecha()`** (líneas 2881-2931):
```javascript
function validarYSanitizarFecha(fecha, nombreCampo = "fecha") {
  // 1. Sanitizar: eliminar caracteres no válidos (solo dígitos y guiones)
  let fechaStr = String(fecha).trim().replace(/[^0-9-]/g, "");
  
  // 2. Validar formato YYYY-MM-DD con regex
  const formatoFechaRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!formatoFechaRegex.test(fechaStr)) {
    throw new Error(`${nombreCampo} debe tener el formato YYYY-MM-DD`);
  }
  
  // 3. Validar que sea una fecha real
  const [year, month, day] = fechaStr.split("-").map(Number);
  const fechaObj = new Date(year, month - 1, day);
  
  if (fechaObj.getFullYear() !== year || 
      fechaObj.getMonth() !== month - 1 || 
      fechaObj.getDate() !== day) {
    throw new Error(`${nombreCampo} no es una fecha válida`);
  }
  
  return fechaStr;
}
```

**Aplicación en endpoint `/enviar-reserva-express`** (líneas 3050-3073):
```javascript
// Validar y sanitizar fechas
try {
  // Validar fecha principal (requerida)
  datosReserva.fecha = validarYSanitizarFecha(
    datosReserva.fecha,
    "Fecha del servicio"
  );
  
  // Validar fecha de regreso si existe (opcional)
  if (datosReserva.fechaRegreso) {
    datosReserva.fechaRegreso = validarYSanitizarFecha(
      datosReserva.fechaRegreso,
      "Fecha de regreso"
    );
  }
} catch (errorFecha) {
  return res.status(400).json({
    success: false,
    message: errorFecha.message,
  });
}
```

### Comportamiento Después de la Solución

**Fecha válida**:
```
Input:  '2026-01-09'
Output: '2026-01-09'
Log:    ✅ Fecha del servicio validada correctamente: "2026-01-09"
```

**Fecha malformada (sanitizada)**:
```
Input:  '252026-01-09'
Sanitizado: '252026-01-09'
Error: ❌ Formato de Fecha del servicio inválido
Respuesta: 400 Bad Request - "Fecha del servicio debe tener el formato YYYY-MM-DD"
```

**Fecha inválida (ej: 31 de febrero)**:
```
Input:  '2026-02-31'
Error: ❌ Fecha del servicio no es una fecha válida: "2026-02-31"
Respuesta: 400 Bad Request
```

### Prevención

La validación previene:
- ✅ Fechas con formato incorrecto (más o menos dígitos)
- ✅ Fechas con caracteres extra (espacios, letras, símbolos)
- ✅ Fechas inválidas (31 de febrero, 13 de mes, etc.)
- ✅ Valores null, undefined o vacíos
- ✅ Concatenaciones incorrectas que generen formatos raros

### Archivos Modificados

- `backend/server-db.js`:
  - Función `validarYSanitizarFecha()` (líneas 2881-2931)
  - Validación en `/enviar-reserva-express` (líneas 3050-3073)

> [!NOTE]
> Esta validación se aplica a **todas** las reservas express, incluyendo las creadas desde:
> - Flujo de "Pagar con Código"
> - Flujo de reserva express normal
> - Cualquier otro flujo que use el endpoint `/enviar-reserva-express`
   - Usa objeto `Date` nativo para validación

4. **Logging Detallado**:
   - Registra valor original y sanitizado en caso de error
   - Mensaje de éxito con fecha validada
   - Facilita debugging de problemas de formato

### Ejemplos de Validación

**Casos Exitosos**:
```javascript
validarYSanitizarFecha("2026-01-07", "fecha")
// ✅ Retorna: "2026-01-07"

validarYSanitizarFecha("  2026-01-07  ", "fecha")
// ✅ Retorna: "2026-01-07" (espacios eliminados)

validarYSanitizarFecha("2026-01-07T00:00:00", "fecha")
// ✅ Retorna: "2026-01-07" (hora eliminada)
```

**Casos de Error**:
```javascript
validarYSanitizarFecha("2024-02-30", "fecha")
// ❌ Error: "fecha no es una fecha válida (2024-02-30)"

validarYSanitizarFecha("07/01/2026", "fecha")
// ❌ Error: "fecha debe tener el formato YYYY-MM-DD"

validarYSanitizarFecha("2026-13-01", "fecha")
// ❌ Error: "fecha no es una fecha válida (2026-13-01)"

validarYSanitizarFecha("", "fecha")
// ❌ Error: "fecha es requerida"
```

### Beneficios

✅ **Seguridad**: Previene inyección SQL a través de campos de fecha  
✅ **Consistencia**: Garantiza formato uniforme YYYY-MM-DD en toda la base de datos  
✅ **Validación**: Rechaza fechas imposibles antes de llegar a la BD  
✅ **Debugging**: Logs claros facilitan identificación de problemas  
✅ **Robustez**: Maneja múltiples formatos de entrada y los normaliza

### Archivos Modificados

- `backend/server-db.js` (líneas 2878-2931): Función de validación
- `backend/server-db.js` (líneas 3053-3073): Integración en endpoint

### Prevención de Problemas Futuros

**Para nuevos endpoints que manejen fechas**:

1. Importar o usar la función `validarYSanitizarFecha()`
2. Aplicar validación ANTES de cualquier operación de base de datos
3. Capturar errores y retornar HTTP 400 con mensaje descriptivo
4. Aplicar tanto a fechas requeridas como opcionales

**Ejemplo de uso**:
```javascript
app.post("/mi-endpoint", async (req, res) => {
    try {
        const fechaValidada = validarYSanitizarFecha(
            req.body.fecha,
            "Fecha de inicio"
        );
        
        // Usar fechaValidada en lugar de req.body.fecha
        await Reserva.create({ fecha: fechaValidada, ... });
        
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
});
```

> [!TIP]
> **Buena Práctica**: Siempre validar fechas en el backend, incluso si el frontend ya las valida. La validación del frontend puede ser bypasseada por usuarios maliciosos o integraciones externas.

> [!WARNING]
> **No confiar en validación del frontend**: Aunque el frontend use componentes de fecha, siempre aplicar validación en el backend para garantizar seguridad e integridad de datos.

---

## 14. Códigos de Pago No Se Marcan Como "Usado" Después del Pago

**Implementado: 8 Enero 2026**

### Problema
Al implementar la funcionalidad de pago de saldos asociados a una reserva activa con código de pago, el proceso de pago se realizaba correctamente pero el estado del código no cambiaba a "usado" en el admin panel de Códigos de Pago.

### Síntomas
- ✅ El pago se procesa exitosamente en Flow
- ✅ La transacción se registra en la base de datos
- ✅ La reserva se actualiza correctamente
- ❌ El código de pago permanece en estado "activo" en lugar de cambiar a "usado"
- ❌ El campo `usosActuales` no se incrementa
- ❌ El campo `fechaUso` no se actualiza

### Causa Raíz
La lógica de actualización del código de pago en el webhook de Flow (`/api/flow-confirmation`) solo buscaba el código usando `reserva.referenciaPago` (texto del código). Sin embargo:

1. **Frontend envía `codigoPagoId`**: El componente `PagarConCodigo.jsx` envía correctamente el ID numérico del código en la metadata (línea 360)
2. **Backend recibe el ID**: Se captura en `optionalMetadata.codigoPagoId` (línea 7609 de `server-db.js`)
3. **Pero no se usa**: La lógica antigua (líneas 7707-7744) solo buscaba por `referenciaPago`, ignorando el `codigoPagoId`

Esto causaba que:
- **Pagos vinculados a saldos**: No actualizaban el código porque `referenciaPago` podía no coincidir o no estar presente
- **Pagos normales**: Funcionaban si `referenciaPago` coincidía exactamente con el código

### Solución (Enero 2026)

Se modificó la lógica de actualización del código de pago en `backend/server-db.js` (líneas 7707-7756) para:

1. **Priorizar `codigoPagoId`**: Buscar primero por ID numérico (más confiable)
2. **Fallback a `referenciaPago`**: Mantener compatibilidad con flujos antiguos
3. **Consolidar lógica**: Evitar duplicación de código

**Código implementado**:
```javascript
// Si la reserva proviene de un código de pago, marcarlo como usado
try {
    let registro = null;
    
    // PRIORIDAD 1: Usar codigoPagoId de metadata (más confiable para pagos de saldo)
    if (codigoPagoId && !isNaN(codigoPagoId)) {
        registro = await CodigoPago.findByPk(codigoPagoId);
        if (registro) {
            console.log(`✅ Código de pago encontrado por ID: ${codigoPagoId} (${registro.codigo})`);
        }
    }
    
    // PRIORIDAD 2: Buscar por referenciaPago (compatibilidad con flujos antiguos)
    if (!registro && reserva.referenciaPago) {
        const codigoDePago = reserva.referenciaPago;
        if (typeof codigoDePago === "string" && codigoDePago.trim().length > 0) {
            const codigo = codigoDePago.trim().toUpperCase();
            registro = await CodigoPago.findOne({ where: { codigo } });
            if (registro) {
                console.log(`✅ Código de pago encontrado por referencia: ${codigo}`);
            }
        }
    }
    
    // Si encontramos el código, actualizarlo
    if (registro) {
        reserva.motivoPago = registro.descripcion;
        
        const nuevosUsos = (parseInt(registro.usosActuales, 10) || 0) + 1;
        const estado = nuevosUsos >= registro.usosMaximos ? "usado" : registro.estado;
        
        await registro.update({
            usosActuales: nuevosUsos,
            reservaId: reserva.id,
            emailCliente: reserva.email,
            fechaUso: new Date(),
            estado,
        });
        
        console.log(`✅ Código de pago actualizado: ${registro.codigo} (Usos: ${nuevosUsos}/${registro.usosMaximos}, Estado: ${estado})`);
    } else {
        console.log("ℹ️ No se encontró código de pago para actualizar");
    }
} catch (cpError) {
    console.warn("⚠️ No se pudo actualizar el código de pago:", cpError.message);
}
```

### Flujo de Actualización

**Antes (Fallaba)**:
```
1. Pago exitoso en Flow
2. Webhook recibe confirmación
3. Busca código solo por referenciaPago
4. ❌ No encuentra código (referenciaPago no coincide)
5. ❌ Código permanece "activo"
```

**Ahora (Funciona)**:
```
1. Pago exitoso en Flow
2. Webhook recibe confirmación con codigoPagoId en metadata
3. Busca código por ID numérico
4. ✅ Encuentra código directamente
5. ✅ Actualiza: usosActuales++, estado="usado", fechaUso=now
```

### Logs de Verificación

**Pago exitoso con código**:
```
💳 Estado del pago Flow: { flowOrder: 123456, status: 2, amount: 50000 }
✅ Reserva encontrada: ID 789, Código AR-20260108-0001
✅ Código de pago encontrado por ID: 45 (PX-ABC123)
✅ Código de pago actualizado: PX-ABC123 (Usos: 1/1, Estado: usado)
💾 Reserva actualizada con información de pago Flow
```

**Pago sin código**:
```
💳 Estado del pago Flow: { flowOrder: 123457, status: 2, amount: 30000 }
✅ Reserva encontrada: ID 790, Código AR-20260108-0002
ℹ️ No se encontró código de pago para actualizar
💾 Reserva actualizada con información de pago Flow
```

### Casos de Uso Soportados

| Escenario | codigoPagoId | referenciaPago | Resultado |
|-----------|--------------|----------------|-----------|
| Pago de saldo con código | ✅ Presente | ✅ Presente | ✅ Actualiza por ID |
| Pago de saldo (ID sin referencia) | ✅ Presente | ❌ Ausente | ✅ Actualiza por ID |
| Pago normal con código (legacy) | ❌ Ausente | ✅ Presente | ✅ Actualiza por referencia |
| Pago sin código | ❌ Ausente | ❌ Ausente | ℹ️ No actualiza (esperado) |

### Archivos Modificados

- `backend/server-db.js` (líneas 7707-7756): Lógica de actualización mejorada

### Prevención de Problemas Futuros

**Para nuevos flujos de pago con códigos**:

1. **Frontend**: Siempre enviar `codigoPagoId` en la metadata de Flow
   ```javascript
   codigoPagoId: codigoValidado.id  // ID numérico
   ```

2. **Backend**: Confiar en `codigoPagoId` como fuente primaria
   - Más confiable que buscar por texto
   - Evita problemas de normalización (mayúsculas, espacios, etc.)
   - Más eficiente (búsqueda por primary key)

3. **Logging**: Los logs mejorados facilitan debugging
   - Indica si encontró el código por ID o por referencia
   - Muestra estado final del código
   - Registra errores sin romper el flujo de pago

> [!IMPORTANT]
> La actualización del código es **no crítica** para el flujo de pago. Si falla, el pago se procesa igualmente y solo se registra un warning en los logs. Esto previene que errores en códigos de pago afecten la experiencia del cliente.

> [!TIP]
> **Verificación manual**: Para verificar que un código se marcó correctamente como "usado", revisar en el admin panel:
> - Estado debe ser "Usado"
> - Usos actuales debe incrementarse
> - Fecha de uso debe estar presente
> - Email del cliente debe estar registrado
