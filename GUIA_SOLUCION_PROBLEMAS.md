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
