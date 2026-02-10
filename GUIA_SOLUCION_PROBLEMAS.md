# 🔧 Guía de Solución de Problemas (Troubleshooting)

Este documento centraliza las soluciones a problemas comunes técnicos detectados durante el desarrollo, incluyendo migraciones y errores de enrutamiento.

## 1. Reservas Ida y Vuelta No Se Separan en Tramos (Flujo Express)

**Implementado: 13 Enero 2026**

### Problema
Las reservas de tipo "Ida y Vuelta" creadas desde el flujo "Pagar con Código" quedaban guardadas como una sola reserva en lugar de separarse en dos tramos vinculados (IDA y VUELTA), como estaba documentado en el sistema.

### Síntomas
- Reserva ida y vuelta aparece como una sola fila en el panel admin
- No muestra badges "IDA" y "RETORNO" separados
- No permite asignar conductores diferentes para cada tramo
- Dificulta el cierre de caja parcial (solo ida completada)

### Causa Raíz
La lógica de separación de tramos vinculados solo estaba implementada en el endpoint `/enviar-reserva` (líneas 2646-2752), pero **NO en `/enviar-reserva-express`** (usado por "Pagar con Código").

**Flujos afectados:**
- ❌ Pagar con Código → Usaba `/enviar-reserva-express` → No separaba
- ❌ Cualquier otro flujo que use `/enviar-reserva-express`

**Nota histórica:** El flujo principal de reservas que usaba `/enviar-reserva` fue removido del sistema, por lo que en la práctica **NINGUNA** reserva ida y vuelta se estaba separando correctamente.

### Solución (Enero 2026)

Se implementó la lógica de separación de tramos vinculados tanto en el endpoint `/enviar-reserva-express` como en el endpoint principal `/enviar-reserva`.

**Archivo modificado:** `backend/server-db.js`  
**Líneas modificadas:** 2646-2752 (Manual/Web) y 3380-3499 (Express)

**Lógica implementada:**
```javascript
// Después de crear la reserva (Manual o Express)
if ((!esModificacion || !reservaExistente) && datosReserva.idaVuelta) {
    console.log("🔄 Procesando reserva Ida y Vuelta: Generando tramos vinculados...");
    
    try {
        // 1. Crear tramo de VUELTA (hijo) con datos invertidos
        const reservaVuelta = await Reserva.create({
            // Origen/destino invertidos
            // Montos (total, abono, saldo, descuentos) divididos 50/50
            // Hora de regreso normalizada con normalizeTimeGlobal
            // Vinculación: tramoPadreId, tipoTramo: "vuelta"
        });
        
        // 2. Actualizar tramo de IDA (padre)
        await reservaExpress.update({
            // Montos divididos 50/50
            // Vinculación: tramoHijoId, tipoTramo: "ida"
            // Limpiar fechaRegreso/horaRegreso
        });
    } catch (errorSplit) {
        console.error("❌ Error al dividir reserva ida y vuelta:", errorSplit);
    }
}
```

**Características de la implementación:**
- ✅ División automática en dos registros independientes en TODOS los flujos.
- ✅ Precios, abonos, saldos y descuentos divididos 50/50.
- ✅ Normalización de hora de regreso en el tramo de vuelta.
- ✅ Vinculación mediante `tramoPadreId` y `tramoHijoId`.
- ✅ Flags `tipoTramo: "ida"` y `tipoTramo: "vuelta"`.
- ✅ Origen/destino invertidos automáticamente.
- ✅ Logs detallados para debugging.
- ✅ Error handling que no falla el request completo.

### Comportamiento Después de la Solución

**Antes:**
```
Reserva #204 - Ida y Vuelta
├─ Origen: Aeropuerto → Destino: Pucón
├─ Fecha Ida: 14-01-2026
├─ Fecha Vuelta: 16-01-2026
├─ Total: $120,000
└─ Abono: $48,000
```

**Después:**
```
Reserva #204 - IDA (Padre)
├─ Origen: Aeropuerto → Destino: Pucón
├─ Fecha: 14-01-2026
├─ Total: $60,000
├─ Abono: $24,000
├─ tipoTramo: "ida"
└─ tramoHijoId: 205

Reserva #205 - VUELTA (Hijo)
├─ Origen: Pucón → Destino: Aeropuerto
├─ Fecha: 16-01-2026
├─ Total: $60,000
├─ Abono: $24,000
├─ tipoTramo: "vuelta"
└─ tramoPadreId: 204
```

### Verificación

Para confirmar que el sistema funciona correctamente:

1. **Crear reserva ida y vuelta** (ya sea desde "Pagar con Código" o desde el Panel Admin "Nueva Reserva").
2. **Revisar logs de Render:**
   ```
   🔄 Procesando reserva Ida y Vuelta: Generando tramos vinculados...
   ✅ Tramo de vuelta creado: 205 (AR-XXXX)
   ✅ Tramo de ida actualizado y vinculado: 204
   ```
3. **Verificar en panel admin:**
   - Deben aparecer 2 filas separadas.
   - Badge verde "IDA" en la primera.
   - Badge azul "RETORNO" en la segunda.
   - Los montos deben estar correctamente divididos.

### Impacto en Reservas Existentes

**Reservas creadas ANTES de este fix:**
- Permanecen como una sola reserva (no se migran automáticamente).
- Se identifican con badge "IDA Y VUELTA" (legacy).

**Reservas creadas DESPUÉS de este fix:**
- Se separan automáticamente en dos tramos.
- Permiten gestión independiente de cada viaje.

### Archivos Modificados

- `backend/server-db.js`: Lógica de separación en todos los flujos.

> [!IMPORTANT]
> Este fix asegura la paridad entre el flujo de ventas web/manual y el flujo de pago con código. any reserva ida y vuelta ahora se gestionará como dos viajes independientes para facilitar la logística y asignación de conductores.

---

## 1.1. División de Pago Proporcional para Reservas Ida/Vuelta

**Implementado: 18 Enero 2026**

### Problema
Cuando un cliente pagaba una reserva de ida y vuelta, el sistema asignaba el 100% del monto a la reserva de IDA, dejando la reserva de VUELTA sin registro de pago. Esto causaba:
- Sobrepago contable en la IDA (ej: $100.000 pagados sobre $50.000 de costo)
- Saldo pendiente incorrecto en la VUELTA ($0 pagados sobre $50.000 de costo)
- Estados de pago inconsistentes entre ambos tramos
- Problemas para calcular gastos y comisiones por tramo

### Causa Raíz
El webhook de confirmación de Flow (`/api/flow-confirmation`) no dividía el monto del pago entre las reservas vinculadas. Simplemente:
1. Asignaba `payment.amount` completo a la reserva principal (IDA)
2. Copiaba el estado de pago a la VUELTA sin asignarle monto

Como las reservas se crean con precios divididos 50/50 (ver sección 1), esto generaba un desbalance contable.

### Solución (Enero 2026)

Se implementó **división proporcional del pago** en el webhook de Flow.

**Archivo modificado:** `backend/server-db.js`  
**Líneas modificadas:** 7985-8124

**Lógica implementada:**

```javascript
// 1. Calcular proporción de pago para cada tramo
if (reserva.tramoHijoId) {
    const reservaHija = await Reserva.findByPk(reserva.tramoHijoId);
    
    if (reservaHija) {
        const totalIda = parseFloat(reserva.totalConDescuento || 0);
        const totalVuelta = parseFloat(reservaHija.totalConDescuento || 0);
        const totalConjunto = totalIda + totalVuelta;
        
        // Dividir el pago proporcionalmente
        const factorIda = totalIda / totalConjunto;
        montoIda = Math.round(payment.amount * factorIda);
        montoVuelta = payment.amount - montoIda;
    }
}

// 2. Actualizar IDA con su monto correspondiente
const pagoAcumuladoIda = pagoPrevioIda + montoIda;
// Evaluar estados (pagado/parcial/confirmada) basado en montoIda

// 3. Actualizar VUELTA con su monto correspondiente
const pagoAcumuladoVuelta = pagoPrevioVuelta + montoVuelta;
// Evaluar estados independientemente basado en montoVuelta
```

### Comportamiento Después de la Solución

**Escenario 1: Pago Total ($100.000)**
```
Antes:
├─ IDA:    Precio $50k, Pago $100k ❌ (sobrepago)
└─ VUELTA: Precio $50k, Pago $0    ❌ (sin pago)

Después:
├─ IDA:    Precio $50k, Pago $50k ✅ → Estado: PAGADO
└─ VUELTA: Precio $50k, Pago $50k ✅ → Estado: PAGADO
```

**Escenario 2: Abono 40% ($40.000)**
```
Antes:
├─ IDA:    Precio $50k, Pago $40k ❌ (80% pagado, pero umbral es 40% de $50k = $20k)
└─ VUELTA: Precio $50k, Pago $0   ❌ (0% pagado)

Después:
├─ IDA:    Precio $50k, Pago $20k ✅ → Estado: CONFIRMADA (cumple umbral $20k)
└─ VUELTA: Precio $50k, Pago $20k ✅ → Estado: CONFIRMADA (cumple umbral $20k)
```

**Escenario 3: Pago Insuficiente ($10.000)**
```
Después:
├─ IDA:    Precio $50k, Pago $5k → Estado: PENDIENTE (no cumple umbral $20k)
└─ VUELTA: Precio $50k, Pago $5k → Estado: PENDIENTE (no cumple umbral $20k)
```

### Verificación

**Logs esperados en Render:**
```
🔄 Calculando división de pago para tramos vinculados (Ida/Vuelta)...
📊 División aplicada (Total Pago: 100000): Ida $50000 (50.0%) | Vuelta $50000
✅ Reserva vinculada actualizada: Estado confirmada, Pago pagado
```

**Verificación en Base de Datos:**
```sql
SELECT 
    id, 
    codigoReserva, 
    tipoTramo,
    totalConDescuento,
    pagoMonto,
    saldoPendiente,
    estadoPago,
    estado
FROM reservas 
WHERE tramoPadreId = X OR tramoHijoId = X;
```

Ambas reservas deben mostrar:
- `pagoMonto` aproximadamente igual a la mitad del pago total
- `estadoPago` y `estado` consistentes con el monto recibido
- `saldoPendiente` calculado correctamente

### Archivos Modificados

- `backend/server-db.js` (líneas 7985-8124): Lógica de split y actualización independiente
- `backend/test-split-logic.js` (nuevo): Script de pruebas para validar cálculos

### Script de Pruebas

Se incluye `backend/test-split-logic.js` para validar la lógica sin necesidad de pagos reales:

```bash
cd backend
node test-split-logic.js
```

> [!IMPORTANT]
> Este fix garantiza integridad contable en reservas ida/vuelta. Cada tramo ahora tiene su propio registro de pago proporcional, permitiendo cálculos correctos de gastos, comisiones y estados.

---

## 2. Problemas de Rutas y Backend (Error 500)


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

#### 04-02-2026: Mejora y Destaque Interfaz "Upgrade a Van"
- **Problema**: La sección de upgrade era abrumadora e inicialmente costaba distinguirla como una opción premium. Además, el upgrade no aparecía en viajes HACIA el aeropuerto.
- **Solución**: Se simplificaron las leyendas y avisos, se aplicó un contorno destacado en tonos café (chocolate) con una leyenda más descriptiva sobre confort y reclinación. Se corrigió la lógica para usar `targetName` en lugar de `formData.destino`, permitiendo que el upgrade aparezca en ambas direcciones.
- **Resultado**: Interfaz limpia pero llamativa que destaca la opción de upgrade de forma elegante, disponible tanto para viajes desde como hacia el aeropuerto.

**Verificación**:
```javascript
// En consola del navegador
localStorage.getItem('token') // Debe retornar un token válido
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

---

## 13. Duplicación de Reservas en Pago con Código Ida y Vuelta

**Implementado: 9 Febrero 2026**

### Problema
Cuando un cliente usaba un código de pago para una reserva ida y vuelta, el sistema presentaba tres problemas críticos:

1. **Duplicación de reservas**: Se generaban códigos de reserva adicionales cuando el sistema detectaba el tramo de vuelta recién creado como una "reserva existente pendiente" y la modificaba
2. **Estado pendiente tras pago confirmado**: Las reservas quedaban en estado `pendiente` en lugar de `confirmada`
3. **Datos de fecha/hora duplicados**: Los datos del tramo de ida se copiaban incorrectamente al tramo de vuelta

### Causa Raíz
La lógica de "modificación de reserva existente" en `/enviar-reserva-express` buscaba reservas pendientes por email sin excluir tramos vinculados, causando que el tramo de VUELTA recién creado se detectara como "reserva duplicada" y se modificara incorrectamente.

### Solución (Febrero 2026)

**Archivo modificado**: `backend/server-db.js`

**Cambios implementados**:

1. **Excluir tramos vinculados** (líneas 3146-3149):
```javascript
const reservaExistente = await Reserva.findOne({
    where: {
        email: emailNormalizado,
        estado: { [Op.in]: ["pendiente", "pendiente_detalles"] },
        estadoPago: "pendiente",
        // ✅ Excluir reservas que son parte de un viaje ida y vuelta
        tramoHijoId: null,
        tramoPadreId: null,
    },
    order: [["createdAt", "DESC"]],
});
```

2. **Validación de fechaRegreso** (líneas 3442-3445):
```javascript
if (!datosReserva.fechaRegreso) {
    console.error("❌ [EXPRESS] Error: idaVuelta=true pero falta fechaRegreso");
    // No dividir, mantener como reserva única
} else {
    // Proceder con la división...
}
```

3. **Logs mejorados** (líneas 3433-3440): Muestran datos de ida y vuelta antes de crear tramos

### Verificación

**Logs esperados**:
```
✅ Reserva express guardada: ID 269
📋 [EXPRESS] Datos de los tramos: { fechaIda: '2026-02-12', fechaVuelta: '2026-02-16' }
🔄 [EXPRESS] Procesando reserva Ida y Vuelta...
✅ [EXPRESS] Tramo de vuelta creado: 270
✅ Pago CONFIRMADO (Reserva 269)
```

**NO debe aparecer**: `🔄 Modificando reserva existente ID: 270`

**Resultado en BD**: Exactamente 2 reservas vinculadas, ambas con estado `confirmada` y `estadoPago: pagado`

> [!IMPORTANT]
> Este fix asegura que los pagos con código para reservas ida y vuelta funcionen correctamente, evitando duplicación de registros y garantizando estados de pago consistentes.

---

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

## 13. Pagos Fallidos No Registrados en Historial (Flow Status 3 y 4)

**Implementado: 3 Febrero 2026**

### Problema
Cuando un cliente intentaba pagar una reserva y el pago era rechazado o anulado por Flow (status 3 o 4), el sistema no registraba ningún intento de pago en la tabla de transacciones. Esto dificultaba el soporte técnico cuando un cliente afirmaba haber intentado pagar y haber tenido un error, ya que no había evidencia visible en el panel administrativo.

### Síntomas
- Cliente reporta error al pagar, pero no aparece ningún registro en el historial de transacciones
- Logs del backend muestran `ℹ️ Pago no exitoso (status: 3), no se actualiza reserva` pero no se crea ningún registro
- Panel administrativo muestra "0 transacción(es)" para reservas con intentos de pago fallidos
- Imposibilidad de rastrear intentos de pago rechazados para análisis o soporte

### Causa
El webhook de confirmación de Flow (`/api/flow-confirmation`) en `backend/server-db.js` validaba el estado del pago antes de identificar la reserva. Si el pago no era exitoso (status !== 2), simplemente retornaba sin crear ningún registro en la tabla `Transaccion`.

**Flujo anterior:**
```javascript
// 1. Obtener estado del pago de Flow
const payment = flowResponse.data;

// 2. Salir inmediatamente si no es exitoso
if (payment.status !== 2) {
    console.log(`ℹ️ Pago no exitoso (status: ${payment.status}), no se actualiza reserva`);
    return; // ❌ No se registra nada
}

// 3. Identificar reserva (nunca se ejecuta para pagos fallidos)
let reserva = await Reserva.findByPk(optionalReservaId);
```

### Solución (Febrero 2026)

Se refactorizó el webhook para identificar la reserva **antes** de validar el estado del pago, y se agregó lógica para registrar transacciones fallidas.

**Archivo modificado:** `backend/server-db.js`  
**Líneas modificadas:** 7864-8023

**Lógica implementada:**

```javascript
// 1. Responder a Flow
res.status(200).send("OK");

// 2. Extraer metadata y buscar reserva (independiente del estado del pago)
let reserva = await Reserva.findByPk(optionalReservaId);
// ... lógica de búsqueda por código, email, etc.

if (!reserva) {
    console.log("⚠️ Reserva no encontrada");
    return;
}

// 3. Registrar transacción fallida si el pago fue rechazado o anulado
if (payment.status === 3 || payment.status === 4) {
    const statusLabel = payment.status === 3 ? "Rechazado" : "Anulado";
    
    await Transaccion.create({
        reservaId: reserva.id,
        monto: Number(payment.amount) || 0,
        gateway: "flow",
        transaccionId: payment.flowOrder.toString(),
        estado: "fallido",
        emailPagador: email,
        metadata: { /* datos completos de Flow */ },
        notas: `Pago ${statusLabel} por Flow. No se actualizó el estado de la reserva.`
    });
    
    console.log(`💾 Transacción fallida registrada: Flow Order ${payment.flowOrder}`);
    return;
}

// 4. Procesar pagos exitosos (status 2)
if (payment.status !== 2) {
    return;
}
// ... resto de la lógica de pago exitoso
```

### Comportamiento Después de la Solución

**Antes:**
```
Cliente intenta pagar → Flow rechaza (status 3) → Sistema ignora
Panel Admin: "0 transacción(es)" ❌
```

**Después:**
```
Cliente intenta pagar → Flow rechaza (status 3) → Sistema registra transacción fallida
Panel Admin: "1 transacción(es)" con badge "✗ Fallido" ✅
```

### Verificación

**Logs esperados en Render:**
```
💳 Estado del pago Flow: { flowOrder: 159003188, status: 3, amount: '115000' }
❌ Pago Rechazado (status: 3). Registrando transacción fallida para reserva 246
💾 Transacción fallida registrada: Flow Order 159003188
```

**Panel Administrativo:**
1. Ir a "Reservas" → Ver detalles de la reserva
2. Sección "Historial de Transacciones"
3. Debe aparecer una fila con:
   - Estado: Badge rojo "✗ Fallido"
   - Monto: El monto del intento de pago
   - Gateway: "flow"
   - Referencia: Flow Order ID

### Script de Prueba

Se incluye `backend/test-failed-payment.js` para validar la lógica:

```bash
cd backend
node test-failed-payment.js
```

El script:
1. Busca una reserva existente
2. Simula un pago fallido (status 3)
3. Crea una transacción con estado "fallido"
4. Verifica que la reserva no fue modificada
5. Limpia los datos de prueba

### Archivos Modificados

- `backend/server-db.js` (líneas 7864-8023): Refactorización del webhook
- `backend/test-failed-payment.js` (nuevo): Script de pruebas

> [!IMPORTANT]
> Este cambio mejora la visibilidad de intentos de pago fallidos sin afectar la lógica de negocio. La reserva sigue sin actualizarse para pagos rechazados, pero ahora queda registro del intento para soporte técnico y análisis.

---

## 14. Fechas Inválidas en Reservas Express (252026-01-09)

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

## 15. Error en Procesador de Correos (ReferenceError: reserva is not defined)

**Implementado: 11 Enero 2026**

### Problema
El procesador de correos pendientes (`emailProcessor.js`) crasheaba repetidamente con el error:
```
❌ Error global en processPendingEmails: ReferenceError: reserva is not defined
    at Timeout.processPendingEmails [as _onTimeout] (file:///opt/render/project/src/backend/cron/emailProcessor.js:115:36)
```

### Síntomas
- El cron job se ejecuta cada 60 segundos pero falla inmediatamente
- Los correos de descuento programados no se envían
- Los logs muestran el error repetidamente
- El error ocurre en la línea 115 al intentar acceder a `reserva?.codigoReserva`

### Causa
La variable `reserva` estaba declarada dentro del bloque `try` (línea 43), pero se intentaba acceder a ella en el bloque `catch` (líneas 115 y 142-151), donde no estaba disponible debido al scope de JavaScript.

**Código problemático**:
```javascript
for (const emailTask of pendingEmails) {
    try {
        const reserva = await Reserva.findByPk(emailTask.reservaId); // ❌ Scope limitado al try
        // ... lógica de envío ...
    } catch (error) {
        console.error(`❌ Error procesando email ID ${emailTask.id}:`, {
            codigoReserva: reserva?.codigoReserva, // ❌ ReferenceError: reserva no existe aquí
        });
    }
}
```

### Solución (Enero 2026)

Se movió la declaración de `reserva` fuera del bloque `try` para que esté disponible en todo el scope del bucle:

**Código corregido** (líneas 41-44):
```javascript
for (const emailTask of pendingEmails) {
    let reserva = null; // ✅ Declarar fuera del try para que esté disponible en el catch
    try {
        reserva = await Reserva.findByPk(emailTask.reservaId);
        // ... lógica de envío ...
    } catch (error) {
        console.error(`❌ Error procesando email ID ${emailTask.id}:`, {
            codigoReserva: reserva?.codigoReserva, // ✅ Ahora funciona correctamente
        });
    }
}
```

Adicionalmente, se agregó validación en la notificación al admin (líneas 141-158):
```javascript
// Solo notificar si tenemos datos de la reserva
if (reserva) {
    await axios.post(phpUrl, {
        action: "notify_admin_failed_email",
        reservaId: reserva.id,
        codigoReserva: reserva.codigoReserva,
        // ... otros campos ...
    });
} else {
    console.warn(`⚠️ No se pudo notificar al admin: reserva no disponible para email ID ${emailTask.id}`);
}
```

### Archivos Modificados

- `backend/cron/emailProcessor.js` (líneas 42, 141-158)

### Prevención de Problemas Futuros

**Regla de scope en try/catch**:
- Siempre declarar variables que se necesiten en el `catch` **fuera** del bloque `try`
- Usar `let variable = null;` antes del `try` para garantizar disponibilidad
- Usar optional chaining (`?.`) al acceder a propiedades en el `catch` por si la variable es `null`

**Ejemplo correcto**:
```javascript
let recurso = null; // ✅ Declarar fuera
try {
    recurso = await obtenerRecurso();
    // ... usar recurso ...
} catch (error) {
    console.error(`Error con ${recurso?.id}`); // ✅ Funciona correctamente
}
```

> [!IMPORTANT]
> Este error solo se manifestaba en producción porque el cron job se ejecuta automáticamente. En desarrollo local, si no se ejecuta el cron, el error no aparece.

---

## 12. Historial de Transacciones no Visible

### Problema
Al entrar al detalle de una reserva en el panel administrativo, no aparece la sección "Historial de Transacciones" a pesar de que la reserva está pagada.

### Causa
El sistema de historial solo registra pagos realizados **después** de la implementación de la Fase 3 (Enero 2026).
- **Reservas Antiguas**: No tienen registros en la tabla `transacciones`. Solo tienen el monto acumulado en la reserva.
- **Reservas Nuevas**: Deberían aparecer. Si no aparecen, puede haber fallado el webhook de Flow.

### Diagnóstico
1. **Verificar Fecha**: ¿La reserva/pago es anterior al dia de implementación?
   - Si es anterior → Comportamiento normal (Legacy).
2. **Verificar Estado**: ¿El estado de pago es `pagado`, `abono` o `parcial`?
   - Si es `pendiente` y no hay intentos fallidos, no habrá registros.

### Solución
Si es una reserva nueva y debería tener historial:
1. Revisar los **Logs del Servidor** buscando:
   `API Flow Confirmation - Payload recibido:`
2. Verificar si hubo un error en la creación de la transacción:
   `Error creando transaccion para reserva`

El sistema está diseñado para ser **resiliente**: si falla el registro de la transacción detallada, **aún se actualiza** el estado y monto de la reserva principal para no bloquear la operación. En estos casos, la reserva aparecerá pagada pero sin historial detallado.

---

## 13. Error SQL: Unknown column 'Transaccion.createdAt' in 'ORDER BY'

### Problema
Al intentar cargar las transacciones, el backend devuelve un error 500 y en los logs de Render aparece: `SequelizeDatabaseError: Unknown column 'Transaccion.createdAt' in 'ORDER BY'`.

### Causa
Sequelize intenta ordenar por el nombre del atributo del modelo (`createdAt`) en lugar del nombre real de la columna en la base de datos (`created_at`), y no realiza el mapeo automático correctamente en cláusulas `order` complejas o literales.

### Solución
Forzar el uso del nombre de columna real en la base de datos mediante un literal de Sequelize:

```javascript
// En backend/server-db.js
order: [[sequelize.literal("created_at"), "DESC"]]
```

Esto garantiza que la consulta SQL generada sea `ORDER BY created_at DESC`, lo cual es compatible con MySQL sin ambigüedades.

---

## 14. Error "No se recibió información desde Webpay" en Flow

**Implementado: 8 Enero 2026**

### Problema
Los clientes recibían el error **"No se recibió información desde Webpay"** en Flow al intentar pagar desde "Consultar Reserva" o "Compra Productos". El pago quedaba en estado pendiente (Status: 1) y no se completaba correctamente.

### Síntomas
- ✅ El flujo de "Pagar con Código" funciona perfectamente
- ❌ El flujo de "Consultar Reserva" muestra error de Webpay
- ❌ El flujo de "Compra Productos" muestra error de Webpay
- Flow muestra: "¡Ups! Ha ocurrido un error - No se recibió información desde Webpay"
- El cliente retorna a la página de "Pago Pendiente de Confirmación"
- El pago nunca se completa (queda en Status: 1 indefinidamente)

### Causa Raíz
Inconsistencia en el método de redirección a Flow entre componentes:

- **`PagarConCodigo.jsx`** (funcional): Usa `window.location.href = pj.url`
- **`ConsultarReserva.jsx`** (falla): Usa `window.open(data.url, "_blank")`
- **`CompraProductos.jsx`** (falla): Usa `window.open(data.url, "_blank")`

El uso de `window.open()` causa problemas en navegadores móviles y con Flow/Webpay:

1. **Contexto de navegación separado**: Flow/Webpay pierden el contexto de la sesión original
2. **Bloqueadores de pop-ups**: Interfieren con la redirección
3. **Cookies no transferidas**: El contexto de seguridad se pierde entre ventanas
4. **Restricciones móviles**: iOS/Android limitan comunicación entre ventanas

### Solución (Enero 2026)

Se cambió `window.open()` por `window.location.href` en ambos archivos problemáticos:

**`src/components/ConsultarReserva.jsx`** (línea 116):
```javascript
// Antes
window.open(data.url, "_blank");

// Después
window.location.href = data.url;
```

**`src/components/CompraProductos.jsx`** (línea 89):
```javascript
// Antes
window.open(data.url, "_blank");

// Después  
window.location.href = data.url;
```

### Comportamiento Correcto

**Antes del fix:**
1. Usuario hace clic en "Pagar"
2. Se abre nueva pestaña/ventana
3. Flow muestra error "No se recibió información desde Webpay"
4. Pago queda pendiente

**Después del fix:**
1. Usuario hace clic en "Pagar"
2. La misma ventana redirige a Flow
3. Flow carga correctamente con el contexto
4. Usuario completa pago sin errores
5. Pago se confirma exitosamente

### Archivos Modificados

- `src/components/ConsultarReserva.jsx` (línea 116)
- `src/components/CompraProductos.jsx` (línea 89)

### Consistencia

Ahora **todos** los flujos de pago usan `window.location.href`, garantizando:
- ✅ Comportamiento uniforme en todos los navegadores
- ✅ Compatibilidad con móviles (iOS/Android)
- ✅ Sin errores de contexto de navegación
- ✅ Código más mantenible

> [!IMPORTANT]  
> **Regla para futuros componentes de pago**: Siempre usar `window.location.href` para redirigir a Flow/Webpay, nunca `window.open()`.

> [!TIP]  
> Si necesitas debug, verifica en Network tab del navegador que las cookies de sesión se envían correctamente en la petición a Flow.

---

## 16. Error al Eliminar Reservas (Restricción de Clave Foránea en pending_emails)

**Implementado: 13 Enero 2026**

### Problema
Al intentar eliminar una reserva desde el panel de administración, el sistema devuelve un error 500 y la operación falla.

### Síntomas
- ❌ Error 500 al hacer DELETE a `/api/reservas/:id`
- ❌ Mensaje: `SequelizeForeignKeyConstraintError`
- ❌ Detalles: `Cannot delete or update a parent row: a foreign key constraint fails (pending_emails, CONSTRAINT pending_emails_ibfk_1 FOREIGN KEY (reserva_id) REFERENCES reservas (id))`

**Error en logs**:
```
Error eliminando reserva: Error
    at Query.run (.../sequelize/lib/dialects/mysql/query.js:52:25)
  name: 'SequelizeForeignKeyConstraintError',
  parent: Error: Cannot delete or update a parent row: a foreign key constraint fails
    (`u419311572_araucaria`.`pending_emails`, CONSTRAINT `pending_emails_ibfk_1` 
    FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`))
```

### Causa
La tabla `pending_emails` almacena correos programados asociados a reservas mediante una clave foránea (`reserva_id`). Cuando se intenta eliminar una reserva que tiene correos pendientes asociados, MySQL bloquea la operación para mantener la integridad referencial.

**Orden incorrecto de eliminación**:
```javascript
// ❌ Falla: Intenta eliminar la reserva primero
await reserva.destroy(); // Error: hay registros dependientes en pending_emails
```

### Solución (Enero 2026)

Se modificó el endpoint `/api/reservas/:id` (DELETE) en `backend/server-db.js` (líneas 7045-7078) para eliminar primero los registros dependientes:

**Código implementado**:
```javascript
app.delete("/api/reservas/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		// 1. Eliminar registros dependientes para evitar errores de clave foránea
		await PendingEmail.destroy({
			where: { reservaId: id }
		});

		// 2. Eliminar la reserva
		await reserva.destroy();

		console.log(`✅ Reserva ${id} eliminada exitosamente`);

		res.json({
			success: true,
			message: "Reserva eliminada exitosamente",
		});
	} catch (error) {
		console.error("Error eliminando reserva:", error);
		
		// Proporcionar mensaje de error más específico
		if (error.name === "SequelizeForeignKeyConstraintError") {
			return res.status(409).json({ 
				error: "No se puede eliminar la reserva debido a restricciones de integridad referencial",
				details: error.message 
			});
		}
		
		res.status(500).json({ error: "Error interno del servidor" });
	}
});
```

### Flujo de Eliminación

**Antes (Fallaba)**:
```
1. Usuario hace clic en "Eliminar" en el panel admin
2. Backend intenta eliminar la reserva directamente
3. ❌ MySQL rechaza la operación por clave foránea
4. ❌ Error 500 se devuelve al frontend
```

**Ahora (Funciona)**:
```
1. Usuario hace clic en "Eliminar" en el panel admin
2. Backend elimina correos pendientes asociados (pending_emails)
3. Backend elimina la reserva
4. ✅ Operación exitosa, se confirma la eliminación
```

### Tablas Afectadas

| Tabla | Acción | Orden |
|-------|--------|-------|
| `pending_emails` | Eliminar registros donde `reserva_id = id` | 1° |
| `reservas` | Eliminar reserva con `id` | 2° |

### Archivos Modificados

- `backend/server-db.js` (líneas 7045-7078): Endpoint de eliminación
- `backend/models/PendingEmail.js`: Modelo con clave foránea

### Consideraciones

> [!IMPORTANT]
> Esta solución elimina **permanentemente** los correos pendientes asociados a la reserva. Si en el futuro se requiere mantener un historial de correos programados, considerar implementar soft-delete en lugar de hard-delete.

> [!TIP]
> **Prevención**: Para nuevas tablas relacionadas con `reservas`, considerar agregar `ON DELETE CASCADE` en la definición de la clave foránea para automatizar la eliminación en cascada:
> ```sql
> FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE
> ```

### Otras Tablas Relacionadas

Si se agregan nuevas tablas con claves foráneas a `reservas`, seguir el mismo patrón:
1. Identificar todas las tablas dependientes
2. Eliminar registros en orden correcto (hijas → padre)
3. Manejar errores de restricción con mensajes específicos

---

## 15. Error 500 al Agregar Conductor (Validación de Sequelize)

**Implementado: 11 Enero 2026**

### Problema
Al intentar agregar un nuevo conductor desde el panel de administración, el sistema devolvía un error 500 genérico sin información específica sobre qué campo estaba causando el problema.

### Síntomas
- ❌ Error 500 al hacer POST a `/api/conductores`
- ❌ Mensaje genérico: "Error interno del servidor"
- ❌ No se indica qué campo tiene el problema
- ❌ Difícil de diagnosticar para el usuario

### Causas Comunes

#### 1. RUT Duplicado
El error más común es intentar crear un conductor con un RUT que ya existe en la base de datos.

**Error de Sequelize**:
```
SequelizeUniqueConstraintError: Duplicate entry '12666981-K' for key 'rut'
```

#### 2. Email Inválido
Cuando se envía un email con formato incorrecto o una cadena vacía que no pasa la validación `isEmail` de Sequelize.

**Error de Sequelize**:
```
SequelizeValidationError: Validation isEmail on email failed
```

### Solución (Enero 2026)

Se mejoró el manejo de errores en los endpoints POST y PUT de `/api/conductores` para capturar y reportar errores de validación de Sequelize de manera específica.

**Código implementado** (`backend/server-db.js`, líneas 6016-6040):

```javascript
} catch (error) {
	console.error("Error creando conductor:", error);
	
	// Manejar errores de validación de Sequelize
	if (error.name === "SequelizeValidationError") {
		const validationErrors = error.errors.map(err => ({
			field: err.path,
			message: err.message
		}));
		console.error("Errores de validación:", validationErrors);
		return res.status(400).json({
			error: "Error de validación",
			details: validationErrors
		});
	}
	
	// Manejar errores de unicidad (RUT duplicado)
	if (error.name === "SequelizeUniqueConstraintError") {
		return res.status(409).json({
			error: "Ya existe un conductor con este RUT"
		});
	}
	
	res.status(500).json({ error: "Error interno del servidor" });
}
```

### Comportamiento Después de la Solución

#### RUT Duplicado
**Antes**:
```
Status: 500
Response: { "error": "Error interno del servidor" }
```

**Ahora**:
```
Status: 409 Conflict
Response: { "error": "Ya existe un conductor con este RUT" }
```

#### Email Inválido
**Antes**:
```
Status: 500
Response: { "error": "Error interno del servidor" }
```

**Ahora**:
```
Status: 400 Bad Request
Response: {
  "error": "Error de validación",
  "details": [
    {
      "field": "email",
      "message": "Validation isEmail on email failed"
    }
  ]
}
```

### Logs del Servidor

**RUT Duplicado**:
```
Error creando conductor: SequelizeUniqueConstraintError
  name: 'SequelizeUniqueConstraintError',
  errors: [
    ValidationErrorItem {
      message: 'rut must be unique',
      type: 'unique violation',
      path: 'rut',
      value: '12666981-K'
    }
  ]
```

**Email Inválido**:
```
Error creando conductor: SequelizeValidationError
Errores de validación: [
  {
    field: 'email',
    message: 'Validation isEmail on email failed'
  }
]
```

### Prevención

Para evitar estos errores:

1. **RUT Duplicado**: 
   - El sistema ya valida antes de intentar crear el conductor (líneas 5990-5998)
   - Si la validación previa falla, el nuevo manejo de errores captura el error de la base de datos

2. **Email Inválido**:
   - El backend normaliza emails vacíos a `null` (línea 5982)
   - Se recomienda agregar validación de formato en el frontend

### Archivos Modificados

- `backend/server-db.js` (líneas 6016-6040): Manejo de errores POST
- `backend/server-db.js` (líneas 6120-6144): Manejo de errores PUT

> [!IMPORTANT]
> El mismo manejo de errores se aplicó tanto al endpoint POST (crear) como PUT (actualizar) para mantener consistencia.

---

## 16. Códigos de Pago que no Vencen (Vencimiento Automático)

**Implementado: 13 Enero 2026**

### Problema
Los códigos de pago generados en el panel de administración no se marcaban como "vencidos" automáticamente cuando expiraba su `fechaVencimiento`. Permanecían en estado "activo" indefinidamente en la lista.

### Síntomas
- Códigos antiguos con fecha de vencimiento pasada aparecían como "Activo" (badge verde).
- Los administradores no tenían feedback visual de qué códigos seguían siendo válidos.
- Solo se invalidaban cuando el cliente intentaba usarlos, pero el panel mostraba información incorrecta.

### Causa Raíz
La validación de vencimiento solo estaba implementada en el momento de **uso** del código (`/api/codigos-pago/:codigo`). El endpoint de listado (`GET /api/codigos-pago`) simplemente retornaba los registros de la base de datos sin verificar si la fecha actual ya había superado la fecha de vencimiento.

### Solución (Enero 2026)

Se implementó un sistema de **Vencimiento Automático al Listar** y **Contadores en Tiempo Real**.

#### 1. Backend: Actualización Automática
Se modificó el endpoint `GET /api/codigos-pago` para ejecutar una actualización masiva de estados antes de retornar la lista.

**Archivo:** `backend/server-db.js` (líneas 3601-3633)
```javascript
// 🔄 Actualizar códigos vencidos ANTES de listar
const now = new Date();
await CodigoPago.update(
    { estado: "vencido" },
    {
        where: {
            estado: "activo",
            fechaVencimiento: { [Op.lt]: now }
        }
    }
);
```

#### 2. Frontend Admin: Contadores de Tiempo
Se añadió una función de cálculo de tiempo restante y actualización automática por cada minuto.

**Archivo:** `src/components/AdminCodigosPago.jsx`
- ✅ **Feedback visual Dinámico**:
    - 🟢 **Verde**: > 2 horas restantes.
    - 🟠 **Naranja**: < 2 horas restantes (urgente).
    - 🔴 **Rojo Parpadeante**: < 1 hora restante.
    - ❌ **Rojo Plano**: Vencido.
- ✅ **Auto-refresh**: La lista se re-renderiza cada minuto para mantener los contadores actualizados sin refrescar la página.

#### 3. Frontend Cliente: Alerta de Caducidad
Se añadió una alerta visual en el flujo de pago para que el cliente sepa exactamente cuánto tiempo tiene para completar la reserva.

**Archivo:** `src/components/PagarConCodigo.jsx` (línea 559)

### Verificación
1. Crear un código con vencimiento en 2 minutos.
2. Observar en el panel admin cómo cambia de color y finalmente a "Vencido" automáticamente.
3. Al vencer, el cliente recibirá un mensaje de error si intenta pagar.

### Archivos Modificados
- `backend/server-db.js`: Lógica de auto-vencimiento.
- `src/components/AdminCodigosPago.jsx`: Contadores y lógica visual.
- `src/components/PagarConCodigo.jsx`: Alerta para el cliente.

---

## 15. Error 404 al Probar Nuevos Endpoints en Desarrollo

**Documentado: 13 Enero 2026**

### Síntoma
Al intentar probar una funcionalidad nueva que requiere un nuevo endpoint de backend (ej: `bulk-update`), el navegador retorna un error **404 Not Found**, a pesar de que el código del backend parece estar correcto y el servidor local está corriendo.

### Causa
**Diferencia de Entornos (Shadowing)**: Por defecto, el frontend en desarrollo (`localhost:5173`) está configurado para conectarse al backend de **producción (Render)** para facilitar las pruebas con datos reales. 
Si el nuevo endpoint aún no ha sido desplegado en Render, las llamadas fallarán con 404 porque el servidor de producción no reconoce la nueva ruta.

### Solución
Para resolver este problema durante el desarrollo, se debe forzar al frontend a usar el backend local:

1.  **Configurar `.env.local`**:
    Asegurarse de que `VITE_API_URL` apunte a tu servidor local (ej: `http://localhost:3001`).
    ```env
    VITE_API_URL=http://localhost:3001
    ```

2.  **Verificar `lib/backend.js`**:
    El sistema tiene una lógica automática en `lib/backend.js` que prioriza localhost si detecta que estás en desarrollo. Sin embargo, algunos componentes pueden tener URLs "hardcoded" o dinámicas que requieren atención.

3.  **Despliegue**:
    La solución definitiva es hacer `push` de los cambios del backend a la rama `main` para que Render realice el despliegue automático del nuevo endpoint. Una vez desplegado, el error 404 desaparecerá incluso si el frontend apunta a producción.

---



---

## 14. Restricción de Anticipación Mínima No Respetada o Ineditable

**Implementado: 15 Enero 2026**

### Problema
El sistema permitía a los usuarios avanzar hasta la pantalla de pago incluso si la reserva se realizaba con una anticipación inferior a la mínima configurada (5 horas por defecto). Además, no existía una forma de editar esta restricción por destino desde el Panel de Administración.

### Síntomas
- Usuarios podían seleccionar una hora muy cercana (ej: 13 minutos de diferencia) y avanzar al paso de "Detalles y Pago".
- El error de anticipación solo aparecía al final, al intentar procesar el pago (`App.jsx:1634`), causando una mala experiencia de usuario.
- Administradores no podían ajustar las horas de anticipación para destinos específicos (ej: pedir 24h para destinos lejanos).

### Causa
1. **Falta de Interfaz**: La columna `minHorasAnticipacion` existía en la base de datos pero no tenía un campo de entrada en `AdminPricing.jsx`.
2. **Validación Tardía**: El componente `HeroExpress.jsx` no validaba la anticipación en el paso 1 (`handleStepOneNext`), permitiendo al usuario completar sus datos personales antes de ser bloqueado.
3. **Falta de Filtrado**: El selector de horarios (`timeOptions`) mostraba todas las horas del día independientemente de la hora actual.

### Solución (Enero 2026)

#### 1. Panel de Administración
Se añadió el campo **"Anticipación Mínima (horas)"** en `AdminPricing.jsx` para permitir configurar la restricción por cada destino.
- **Archivo**: `src/components/AdminPricing.jsx`
- **Líneas**: 1690-1705

#### 2. Validación Temprana (Frontend)
Se implementó una doble protección en `HeroExpress.jsx`:
- **Filtrado Dinámico**: Si el usuario selecciona "HOY" como fecha de reserva, el selector de horas solo muestra horarios que cumplen con la anticipación mínima del destino seleccionado.
- **Bloqueo en Paso 1**: Al hacer clic en "Siguiente" tras elegir ruta y fecha, el sistema recalcula la diferencia de horas y bloquea el avance si se viola la restricción, mostrando un mensaje claro.

**Lógica de filtrado en `HeroExpress.jsx`**:
```javascript
if (esHoy) {
    const anticipacion = destinoObj?.minHorasAnticipacion || 5;
    const ahora = new Date();
    options = options.filter(opt => {
        const [h, m] = opt.value.split(":").map(Number);
        const fechaOpt = new Date();
        fechaOpt.setHours(h, m, 0, 0);
        const diffHoras = (fechaOpt - ahora) / 3600000;
        return diffHoras >= anticipacion;
    });
}
```

### Verificación
1. **Configuración**: Ir a Admin > Precios y poner "24" horas de anticipación a un destino (ej: Pucón).
2. **Prueba de Selección**: Intentar reservar Pucón para hoy. El selector de horas debería aparecer vacío o solo con horas de la noche (si cumple las 24h).
3. **Prueba de Validación**: Si se manipula el estado para intentar avanzar con una hora inválida, el botón "Continuar" mostrará: *"Para Pucón, reserva con al menos 24 horas de anticipación"*.

### Archivos Modificados
- `src/components/AdminPricing.jsx`: Inclusión del campo en el formulario.
- `src/components/HeroExpress.jsx`: Lógica de filtrado y validación temprana.

> [!TIP]
> Para reservas de "Último Minuto" (menos de 5 horas), se recomienda dirigir al usuario al botón de WhatsApp para coordinación manual según disponibilidad de móviles.

---

## 20. Error de Conexión a BD en Email Processor (ETIMEDOUT)

**Implementado: 3 Febrero 2026**

### Problema
El procesador de emails (`emailProcessor.js`) fallaba con error `SequelizeConnectionError: ETIMEDOUT` al intentar conectarse a la base de datos MySQL, impidiendo el envío de notificaciones programadas (descuentos, asignaciones, etc.).

### Síntomas
```
❌ Error global en processPendingEmails: ConnectionError [SequelizeConnectionError]
    at ConnectionManager.connect (/opt/render/project/src/backend/node_modules/sequelize/lib/dialects/mysql/connection-manager.js:102:17)
{
  parent: AggregateError [ETIMEDOUT]: 
  code: 'ETIMEDOUT',
  fatal: true
}
```

**Impacto**:
- No se envían emails de descuento a pasajeros
- No se envían notificaciones de asignación de conductor/vehículo
- El cron job falla cada 60 segundos sin recuperarse
- Logs de Render saturados con errores de conexión

### Causa
1. **No hay verificación de conexión**: El processor ejecutaba consultas directamente sin verificar que la BD esté disponible
2. **Sin reintentos**: Si la conexión inicial fallaba, el error se propagaba sin intentar reconectar
3. **Timeouts insuficientes**: 60s puede ser insuficiente en Render (especialmente plan gratuito)
4. **Falta de manejo específico**: Errores de conexión se trataban igual que errores de lógica

### Solución (Febrero 2026)

#### 1. Verificación de Conexión con Reintentos

Se implementó una función `retryWithBackoff()` que intenta conectarse a la BD con backoff exponencial antes de ejecutar consultas.

**Archivo**: `backend/cron/emailProcessor.js`  
**Líneas**: 7-28 (función helper), 33-38 (verificación)

```javascript
// Constantes
const MAX_CONNECTION_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 segundos

// Función de reintentos con backoff exponencial
async function retryWithBackoff(fn, retries = MAX_CONNECTION_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, i);
            console.log(`⏳ Reintento de conexión ${i + 1}/${retries} en ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Uso en processPendingEmails()
await retryWithBackoff(async () => {
    await sequelize.authenticate();
    console.log("✅ Conexión a BD verificada para email processor");
});
```

**Patrón de reintentos**:
- Intento 1: Inmediato
- Intento 2: Después de 2 segundos
- Intento 3: Después de 4 segundos
- Si falla todo: Lanza error y sale gracefully

#### 2. Manejo Específico de Errores de Conexión

Se agregó detección específica de `SequelizeConnectionError` para salir gracefully sin crashear el proceso.

**Archivo**: `backend/cron/emailProcessor.js`  
**Líneas**: 194-207

```javascript
catch (globalError) {
    // Manejo específico de errores de conexión
    if (globalError.name === 'SequelizeConnectionError' || globalError.name === 'ConnectionError') {
        console.error("❌ Error de conexión a BD en email processor:", {
            error: globalError.message,
            code: globalError.parent?.code,
            host: process.env.DB_HOST,
            timestamp: new Date().toISOString()
        });
        console.log("⏭️ Saliendo gracefully. Se reintentará en el próximo ciclo (60s)");
        return; // Salir sin crashear
    }
    
    // Otros errores globales
    console.error("❌ Error global en processPendingEmails:", globalError);
}
```

**Beneficios**:
- El cron no crashea si la BD está temporalmente inaccesible
- Se reintenta automáticamente en el próximo ciclo (60s)
- Logging detallado para diagnóstico en Render

#### 3. Timeouts Aumentados para Render

Se aumentaron los timeouts de conexión de 60s a 90s para manejar mejor la latencia de Render (especialmente en plan gratuito donde la BD puede estar "dormida").

**Archivo**: `backend/config/database.js`  
**Líneas**: 15-26

```javascript
// Habilitar logging condicional para diagnóstico (DB_LOGGING=true en .env)
logging: process.env.DB_LOGGING === 'true' ? console.log : false,
pool: {
    max: 5,
    min: 0,
    acquire: 90000, // Aumentado a 90 segundos para Render
    idle: 10000,
},
dialectOptions: {
    connectTimeout: 90000, // Timeout de conexión: 90 segundos para Render
    timezone: process.env.DB_TIMEZONE || "-04:00",
},
```

**Cambios**:
- `acquire`: 60s → 90s
- `connectTimeout`: 60s → 90s
- Logging condicional con variable de entorno `DB_LOGGING`

### Comportamiento Después de la Solución

**Escenario 1: BD Disponible**
```
✅ Conexión a BD verificada para email processor
🔄 Procesando 3 correos pendientes...
✅ Correo de descuento enviado para AR-20260203-0001
```

**Escenario 2: BD Temporalmente Inaccesible**
```
⏳ Reintento de conexión 1/3 en 2000ms...
⏳ Reintento de conexión 2/3 en 4000ms...
✅ Conexión a BD verificada para email processor
🔄 Procesando 3 correos pendientes...
```

**Escenario 3: BD Completamente Caída**
```
⏳ Reintento de conexión 1/3 en 2000ms...
⏳ Reintento de conexión 2/3 en 4000ms...
⏳ Reintento de conexión 3/3 en 8000ms...
❌ Error de conexión a BD en email processor: {
  error: "connect ETIMEDOUT",
  code: "ETIMEDOUT",
  host: "srv1551.hstgr.io",
  timestamp: "2026-02-03T19:15:00.000Z"
}
⏭️ Saliendo gracefully. Se reintentará en el próximo ciclo (60s)
```

### Verificación

**Logs esperados en Render**:
```bash
# Conexión exitosa
✅ Conexión a BD verificada para email processor

# Con reintentos
⏳ Reintento de conexión 1/3 en 2000ms...
✅ Conexión a BD verificada para email processor

# Error de conexión (sin crash)
❌ Error de conexión a BD en email processor
⏭️ Saliendo gracefully. Se reintentará en el próximo ciclo (60s)
```

**Monitoreo en Render Dashboard**:
1. Ir a Logs en tiempo real
2. Buscar "email processor" o "processPendingEmails"
3. Verificar que no haya errores `ETIMEDOUT` sin manejo
4. Confirmar que el proceso no crashea si hay errores de conexión

### Variables de Entorno

**Nueva variable opcional**:
```bash
# En .env o Render Environment Variables
DB_LOGGING=true  # Habilita logging SQL para diagnóstico (solo desarrollo)
```

### Archivos Modificados

- `backend/cron/emailProcessor.js` (líneas 7-28, 33-38, 194-207)
- `backend/config/database.js` (líneas 15-26)

> [!IMPORTANT]
> Esta solución garantiza que el procesador de emails sea resiliente a problemas temporales de conexión a BD, evitando que el sistema de notificaciones falle completamente por timeouts transitorios.

> [!TIP]
> Si el problema persiste después de esta solución, verificar:
> - Estado de la BD en Hostinger (srv1551.hstgr.io)
> - Límites de conexiones simultáneas en el plan de hosting
> - Firewall o restricciones de red entre Render y Hostinger

---

## 21. Problemas en el Sistema de Oportunidades (Feb 2026)

Durante el refinamiento del sistema de reserva expedita de oportunidades, se detectaron y corrigieron los siguientes puntos críticos:

### A. Error 404: "La oportunidad no existe"
**Causa**: El frontend enviaba el `codigo` público (ej: `OP-20260210-001`) como identificador, pero el backend usaba `findByPk(oportunidadId)`, intentando buscar por el ID numérico interno de la base de datos.
**Solución**: Cambiar la búsqueda en el backend para usar `findOne`:
```javascript
// En backend/routes/oportunidades.js
const oportunidad = await Oportunidad.findOne({ where: { codigo: oportunidadId } });
```

### B. Error de Conexión: `ERR_CONNECTION_REFUSED` (Puertos 3001 vs 8080)
**Causa**: Desajuste entre el puerto configurado en el backend (`8080`) y el invocado en el frontend (`3001`). Además, la detección automática de `localhost` impedía conectar con el backend en Render durante el desarrollo local.
**Solución**: 
1. Estandarizar el uso de `getBackendUrl()` en todos los componentes.
2. Ajustar `getBackendUrl` para priorizar variables de entorno (`VITE_API_URL`) antes que el fallback de `localhost`.

### C. Advertencia: "Function components cannot be given refs"
**Causa**: Componentes de `ui/dialog.jsx` consumidos por Radix UI/Framer Motion sin soporte para `refs`.
**Solución**: Envolver `DialogOverlay`, `DialogContent`, `DialogTitle` y `DialogDescription` con `React.forwardRef`.

---

