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
	console.log(
		"🔄 Procesando reserva Ida y Vuelta: Generando tramos vinculados...",
	);

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

## 1.2. Flujo Editar Reserva: doble contabilización y reseteo de pago

**Implementado: 12 Abril 2026**

### Problemas detectados

- Al usar "Recuperar pago original" podía cargarse el monto total del gateway y volver a sumarse al guardar, generando doble contabilización.
- Al usar "Resetear Pago (Volver a $0)", el backend podía rechazar el guardado por una validación que miraba el monto previo en vez del monto ya reseteado.
- En reservas ida/vuelta, al editar la ida se arrastraba el estado al tramo de vuelta aunque la vuelta tuviera ciclo operativo distinto.
- El endpoint de sincronización de tramos podía devolver resultados duplicados cuando ajustaba diferencias de redondeo.

### Solución aplicada

- Frontend (`AdminReservas.jsx`):
  - "Recuperar pago original" ahora propone solo el monto pendiente por registrar para evitar duplicados.
  - Si el pago ya está totalmente acreditado, informa y no carga monto adicional.
  - La actualización automática del tramo de vuelta ya no fuerza su estado.
- Backend (`server-db.js`):
  - `bulk-update` valida el estado `pendiente` usando el monto efectivo posterior al bloque de pago, permitiendo reseteos legítimos.
  - `sincronizar-tramos` actualiza el ajuste final de redondeo sin duplicar filas en `resultados`.

### Resultado esperado

- El admin puede recuperar pagos sin riesgo de sumar dos veces el mismo monto.
- El reseteo de pago a `$0` funciona de forma consistente.
- La vuelta no cambia de estado automáticamente al editar la ida.
- El resumen de sincronización muestra una sola línea por tramo.

---

## 1.3. Asignación obligatoria de ambos tramos en reservas Ida/Vuelta

**Implementado: 16 Abril 2026**

### Problema

En el modal de asignación de `AdminReservas`, al trabajar con reservas vinculadas (IDA/VUELTA), el sistema exigía seleccionar vehículo también para la VUELTA cuando se desmarcaba "Asignar el mismo conductor y vehículo para ambos tramos".

Esto impedía un caso operativo válido: asignar primero solo la IDA y dejar la VUELTA pendiente para más tarde.

### Síntomas

- Al intentar guardar solo la IDA en una reserva ida/vuelta, aparecía validación de VUELTA obligatoria.
- El botón de guardar no permitía confirmar si VUELTA no tenía vehículo.

### Causa raíz

La función `handleGuardarAsignacion` en `src/components/AdminReservas.jsx` validaba de forma estricta `vueltaVehiculoSeleccionado` cuando existía `reservaVuelta` y `asignarAmbas` era `false`, forzando la asignación de ambos tramos.

### Solución aplicada

- Se eliminó la validación obligatoria de vehículo para VUELTA en ese escenario.
- Se agregó lógica `debeAsignarVuelta` para llamar al endpoint de asignación de VUELTA **solo** cuando:
  - se marcó "asignar ambas", o
  - se seleccionó explícitamente un vehículo para la VUELTA.
- Se agregó opción `Sin asignar` en el selector de vehículo de VUELTA.
- Se mejoró el mensaje de éxito para distinguir:
  - asignación de ambos tramos, o
  - asignación solo de IDA.

### Resultado esperado

- En reservas ida/vuelta ahora se puede asignar únicamente la IDA sin bloquear el guardado.
- La VUELTA puede quedar pendiente sin generar error.
- Si luego se desea, se puede reasignar y completar la VUELTA en una segunda operación.

---

## 1.4. Calendario del Hero Express desalineado o en inglés

**Implementado: 18 Abril 2026**

### Problema

El selector de fecha del bloque `HeroExpress` podía mostrar los encabezados de días desalineados, con la grilla rota o con el mes y los días en inglés.

### Causa raíz

El wrapper reutilizable `src/components/ui/calendar.jsx` seguía usando nombres de clases y componentes de una versión anterior de `react-day-picker`, mientras el proyecto ya estaba en `react-day-picker@9`.

### Solución aplicada

- Se actualizó el wrapper para usar la API de clases de DayPicker v9 (`month_caption`, `month_grid`, `weekdays`, `weekday`, `week`, `day_button`, `button_previous`, `button_next`).
- Se reemplazó la navegación antigua (`IconLeft` / `IconRight`) por el componente `Chevron` esperado por DayPicker v9.
- Se fijó el locale por defecto a español usando `date-fns/locale`.

### Resultado esperado

- El calendario vuelve a renderizar la grilla completa.
- La navegación de meses se muestra correctamente.
- Meses y días aparecen en español dentro del flujo de reserva.

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

## 1.1. Estrategia de Notificaciones para Tramos Vinculados (Ida y Vuelta)

**Implementado: Febrero 2026**

### Contexto

Tras separar las reservas en dos tramos (IDA y VUELTA), surgió el reto de cómo notificar al cliente: ¿Dos correos separados o uno unificado?

### Primera Versión (Rígida)

Inicialmente se intentó postergar la notificación de la IDA hasta que se asignara la VUELTA para enviar un único correo unificado.

- **Problema**: En la práctica, a veces se conoce al conductor de la ida días antes que al de la vuelta. Esto bloqueaba la información necesaria para el primer viaje.

### Solución Final (Flexible y con Contexto)

Se implementó una lógica que siempre notifica el tramo actual pero añade contexto si está disponible.

**Lógica Implementada:**

1.  **Independencia**: Siempre que se hace clic en "Guardar y Notificar" en un tramo, el sistema envía el correo.
2.  **Contexto Inteligente (Pasajero)**:
    - Si el correo es del tramo **VUELTA**, el sistema busca si la **IDA** ya tiene asignación.
    - Si existe la IDA, el correo de vuelta se renderiza con una sección superior que resume el viaje de ida.
3.  **Eficiencia para el Conductor**:
    - Si el **mismo conductor** hace ambos viajes, recibe un único correo unificado con ambos tramos y un `.ics` con 2 eventos.
    - Si los conductores son distintos, cada uno recibe su notificación individual del tramo que le corresponde.

**Archivos Clave:**

- `backend/server-db.js`: Lógica de detección de contexto y armado del payload.
- `enviar_asignacion_reserva.php`: Renderizado de secciones Ida/Vuelta.
- `enviar_notificacion_conductor.php`: Renderizado unificado y generación de `.ics` doble.

> [!TIP]
> Esta estrategia permite que el cliente reciba su confirmación de ida apenas esté lista, y una confirmación de vuelta que "recuerda" y valida todo el servicio completo cuando se asigna el segundo tramo.

---

## 1.2. Visibilidad y Paginación de Reservas Ida/Vuelta en Admin

**Implementado: 15 Febrero 2026**

### Problema

Tras la implementación de la separación de tramos (Ver 1.0), el panel administrativo mostraba comportamientos erróneos en la paginación:

- **Síntoma**: Al cargar la sección "Reservas", la tabla aparecía vacía o con muy pocos resultados, obligando a pulsar "Siguiente" para ver datos.
- **Causa**: El backend paginaba los resultados (ej. 20 por página) incluyendo tanto "Idas" como "Vueltas". Si las reservas más recientes eran mayoritariamente "Vueltas", estas llenaban la página 1. El frontend, que filtraba ocultando las "Vueltas" para evitar duplicados visuales, terminaba ocultando la mayoría de los resultados de esa página.

### Solución

Se movió la lógica de filtrado del Cliente al Servidor.

**Backend (`server-db.js`)**:

- El endpoint `GET /api/reservas` ahora excluye por defecto los registros con `tipoTramo = 'vuelta'`.
- Esto asegura que cada página de resultados contenga 20 reservas "Principales" (Idas o Solo Ida) visibles.

**Frontend (`AdminReservas.jsx`)**:

- Se eliminó el filtro cliente `r.tipoTramo !== "vuelta"`, ya que el backend entrega los datos depurados.

**Resultado**:

- La paginación es precisa y la vista inicial siempre muestra datos.
- Las "Vueltas" siguen siendo accesibles al ver los detalles de su reserva "Ida" vinculada o mediante búsqueda directa.

---

## 1.5. Errores de Pago y Webhooks en Módulo de Hoteles

**Implementado: Abril 2026**

### Problema

Al introducir el módulo de hoteles, los webhooks de pago (Flow/Mercado Pago) no sabían inicialmente en qué tabla buscar la reserva (si en `Reserva` o en `TrasladoHotelAeropuerto`), lo que causaba que los pagos de hoteles no se marcaran como "pagados" en la base de datos.

### Síntomas

- El usuario paga exitosamente en Flow/MP, pero el registro de hotel sigue apareciendo como "pendiente".
- Errores de "Reserva no encontrada" en los logs de los webhooks.
- El fallback de `/api/payment-status` devuelve error 404 para reservas de hoteles.

### Causa Raíz

Los webhooks estaban hardcodeados para usar el modelo `Reserva`. Al existir un segundo modelo (`TrasladoHotelAeropuerto`), se requería una lógica polimórfica basada en metadatos.

### Solución

Se implementó el uso de `paymentOrigin` dentro de los metadatos de la transacción:

1.  **Metadata en Pasarela**: Al crear el pago desde el frontend, se envía `paymentOrigin: 'hotel'`.
2.  **Lógica Polimórfica en Backend**:
    ```javascript
    const isHotel = optionalData?.paymentOrigin === "hotel";
    let reserva = null;
    if (isHotel) {
        reserva = await TrasladoHotelAeropuerto.findByPk(reservaId);
    } else {
        reserva = await Reserva.findByPk(reservaId);
    }
    ```
3.  **Adaptación de Campos**: Se evitaron campos exclusivos de traslados privados (como `abonoPagado` o `saldoPagado`) al actualizar registros de hoteles.

### Verificación

- Revisar logs con el prefijo `[Flow Webhook]` o `[MP-webhook]`.
- Confirmar que aparezca el mensaje: `✅ Pago de HOTEL procesado para ID X`.
- Verificar que el endpoint `/api/payment-status?token=XXX` retorne los datos del hotel correctamente.

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
		[Op.or]: [{ abonoPagado: true }, { saldoPagado: true }],
	},
	order: [
		["fecha", "ASC"],
		["hora", "ASC"],
	],
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
	{ model: Conductor, as: "conductor_asignado", required: false },
	{ model: Vehiculo, as: "vehiculo_asignado", required: false },
];
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
localStorage.getItem("token"); // Debe retornar un token válido
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
localStorage.getItem("token"); // Debe retornar un token válido
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
"Configuración WhatsApp intercept cargada: true";

// Al hacer clic en WhatsApp con modal activo
"Mostrando modal de intercepción";

// Al hacer clic en WhatsApp con modal inactivo
"Abriendo WhatsApp directamente";
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

  ***

## 11. Error "Faltan campos requeridos: fecha" en Pagos de Diferencia

### Problema

Al intentar pagar un código de diferencia vinculado a una reserva, el sistema arroja el error "Faltan campos requeridos: fecha" y no permite procesar el pago.

### Causa

1.  **Inconsistencia en el Frontend**: La interfaz ocultaba los campos de fecha/hora para códigos vinculados (usando el código de texto `AR-...`), pero la lógica de envío (`procesarPagoConCodigoFlow`) solo saltaba la creación de la reserva si existía el ID numérico (`reservaVinculadaId`).
2.  **Datos faltantes**: Si el ID era nulo, el frontend intentaba crear una "reserva express" vacía (ya que los campos estaban ocultos y no se validaban), lo que el backend rechazaba por falta de `fecha`.
3.  **Error en Admin**: El panel de administración no estaba enviando el `reservaVinculadaId` al crear el código, solo el código de texto.

### Solución (Enero 2026)

1.  **Admin**: Se actualizó `AdminCodigosPago.jsx` para incluir `reservaVinculadaId` en el payload de creación.
2.  **Bypass Robusto**: Se modificó `PagarConCodigo.jsx` para que el bypass de creación de reserva se active si existe **o bien el ID o bien el código de texto** (`AR-...`).
3.  **Consistencia**: Se unificaron los criterios de validación, renderizado y procesamiento bajo una misma lógica de vinculación.

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

## 14. Conversiones de Google Ads No Registradas (ReferenceError en App.jsx)

**Detectado: 19 Febrero 2026**

### Problema

Las conversiones de Google Ads no se registraban para el flujo express (el flujo principal de reservas del sitio). El problema era silencioso: ningún error visible en el frontend, pero las conversiones simplemente no llegaban a Google Ads.

### Síntomas

- Google Ads muestra conversiones con valor $0 o directamente no registra conversiones del día
- El flujo de pago completa la reserva correctamente (reservas sí se crean en BD)
- No hay errores visibles en la UI para el usuario

### Causa Raíz

En `src/App.jsx`, dentro del `useEffect` que maneja el retorno de pago Flow, existía un `console.log` que referenciaba la variable `token` sin haberla definido previamente:

```javascript
// ❌ CÓDIGO CON BUG
if (flowSuccess) {
    console.log(`🔍 [App.jsx] Datos de conversión recibidos:`, {
        token,         // <--- ReferenceError: token is not defined
        amount,
        reservaId,
        // ...
    });
    // Todo el código posterior (incluido el gtag) NUNCA se ejecuta
    if (typeof window.gtag === "function") { ... }
}
```

En JavaScript, el `ReferenceError` lanzado por `token` interrumpe silenciosamente la ejecución del `useEffect` completo, haciendo que la llamada a `window.gtag("event", "conversion", ...)` nunca se ejecute.

### Solución (Febrero 2026)

**Archivo modificado**: `src/App.jsx` (línea ~462)

**Cambio**: Remover la variable `token` del `console.log` (la variable no existe en este bloque; el token pertenece al flujo de `FlowReturn.jsx`).

```javascript
// ✅ CÓDIGO CORREGIDO
console.log(`🔍 [App.jsx] Datos de conversión recibidos:`, {
	amount,
	reservaId,
	warning,
	encodedData: encodedData ? "presente" : "ausente",
});
```

### Verificación

Navegar a `/?flow_payment=success&reserva_id=<ID>&amount=<MONTO>&d=<BASE64>` y verificar en la consola del navegador que aparezca:

```
🔍 [App.jsx] Datos de conversión recibidos: { amount: "59670", ... }
✅ [App.jsx] Valor de conversión parseado: 59670
🚀 [App.jsx] Disparando conversión Google Ads: { send_to: ..., value: 59670, currency: "CLP", ... }
```

**Sin el fix**: El `console.log` con `token` lanzaba `ReferenceError` y nada de lo anterior aparecía.

> [!IMPORTANT]
> Este fix asegura que los pagos con código para reservas ida y vuelta funcionen correctamente, evitando duplicación de registros y garantizando estados de pago consistentes.

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

| Status | Significado | Acción del Sistema                                 |
| ------ | ----------- | -------------------------------------------------- |
| 1      | Pendiente   | Mostrar mensaje de espera, NO registrar conversión |
| 2      | Pagado      | Mostrar éxito, registrar conversión de Google Ads  |
| 3      | Rechazado   | Mostrar error                                      |
| 4      | Anulado     | Mostrar error                                      |

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
	console.log(
		`ℹ️ Pago no exitoso (status: ${payment.status}), no se actualiza reserva`,
	);
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
		metadata: {
			/* datos completos de Flow */
		},
		notas: `Pago ${statusLabel} por Flow. No se actualizó el estado de la reserva.`,
	});

	console.log(
		`💾 Transacción fallida registrada: Flow Order ${payment.flowOrder}`,
	);
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
	let fechaStr = String(fecha)
		.trim()
		.replace(/[^0-9-]/g, "");

	// 2. Validar formato YYYY-MM-DD con regex
	const formatoFechaRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!formatoFechaRegex.test(fechaStr)) {
		throw new Error(`${nombreCampo} debe tener el formato YYYY-MM-DD`);
	}

	// 3. Validar que sea una fecha real
	const [year, month, day] = fechaStr.split("-").map(Number);
	const fechaObj = new Date(year, month - 1, day);

	if (
		fechaObj.getFullYear() !== year ||
		fechaObj.getMonth() !== month - 1 ||
		fechaObj.getDate() !== day
	) {
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
		"Fecha del servicio",
	);

	// Validar fecha de regreso si existe (opcional)
	if (datosReserva.fechaRegreso) {
		datosReserva.fechaRegreso = validarYSanitizarFecha(
			datosReserva.fechaRegreso,
			"Fecha de regreso",
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
>
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
validarYSanitizarFecha("2026-01-07", "fecha");
// ✅ Retorna: "2026-01-07"

validarYSanitizarFecha("  2026-01-07  ", "fecha");
// ✅ Retorna: "2026-01-07" (espacios eliminados)

validarYSanitizarFecha("2026-01-07T00:00:00", "fecha");
// ✅ Retorna: "2026-01-07" (hora eliminada)
```

**Casos de Error**:

```javascript
validarYSanitizarFecha("2024-02-30", "fecha");
// ❌ Error: "fecha no es una fecha válida (2024-02-30)"

validarYSanitizarFecha("07/01/2026", "fecha");
// ❌ Error: "fecha debe tener el formato YYYY-MM-DD"

validarYSanitizarFecha("2026-13-01", "fecha");
// ❌ Error: "fecha no es una fecha válida (2026-13-01)"

validarYSanitizarFecha("", "fecha");
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
			console.log(
				`✅ Código de pago encontrado por ID: ${codigoPagoId} (${registro.codigo})`,
			);
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
		const estado =
			nuevosUsos >= registro.usosMaximos ? "usado" : registro.estado;

		await registro.update({
			usosActuales: nuevosUsos,
			reservaId: reserva.id,
			emailCliente: reserva.email,
			fechaUso: new Date(),
			estado,
		});

		console.log(
			`✅ Código de pago actualizado: ${registro.codigo} (Usos: ${nuevosUsos}/${registro.usosMaximos}, Estado: ${estado})`,
		);
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

| Escenario                         | codigoPagoId | referenciaPago | Resultado                   |
| --------------------------------- | ------------ | -------------- | --------------------------- |
| Pago de saldo con código          | ✅ Presente  | ✅ Presente    | ✅ Actualiza por ID         |
| Pago de saldo (ID sin referencia) | ✅ Presente  | ❌ Ausente     | ✅ Actualiza por ID         |
| Pago normal con código (legacy)   | ❌ Ausente   | ✅ Presente    | ✅ Actualiza por referencia |
| Pago sin código                   | ❌ Ausente   | ❌ Ausente     | ℹ️ No actualiza (esperado)  |

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
>
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
	console.warn(
		`⚠️ No se pudo notificar al admin: reserva no disponible para email ID ${emailTask.id}`,
	);
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
order: [[sequelize.literal("created_at"), "DESC"]];
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
			where: { reservaId: id },
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
				error:
					"No se puede eliminar la reserva debido a restricciones de integridad referencial",
				details: error.message,
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

| Tabla            | Acción                                     | Orden |
| ---------------- | ------------------------------------------ | ----- |
| `pending_emails` | Eliminar registros donde `reserva_id = id` | 1°    |
| `reservas`       | Eliminar reserva con `id`                  | 2°    |

### Archivos Modificados

- `backend/server-db.js` (líneas 7045-7078): Endpoint de eliminación
- `backend/models/PendingEmail.js`: Modelo con clave foránea

### Consideraciones

> [!IMPORTANT]
> Esta solución elimina **permanentemente** los correos pendientes asociados a la reserva. Si en el futuro se requiere mantener un historial de correos programados, considerar implementar soft-delete en lugar de hard-delete.

> [!TIP]
> **Prevención**: Para nuevas tablas relacionadas con `reservas`, considerar agregar `ON DELETE CASCADE` en la definición de la clave foránea para automatizar la eliminación en cascada:
>
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
			fechaVencimiento: { [Op.lt]: now },
		},
	},
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
	options = options.filter((opt) => {
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
3. **Prueba de Validación**: Si se manipula el estado para intentar avanzar con una hora inválida, el botón "Continuar" mostrará: _"Para Pucón, reserva con al menos 24 horas de anticipación"_.

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
			console.log(
				`⏳ Reintento de conexión ${i + 1}/${retries} en ${delay}ms...`,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
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
>
> - Estado de la BD en Hostinger (srv1551.hstgr.io)
> - Límites de conexiones simultáneas en el plan de hosting
> - Firewall o restricciones de red entre Render y Hostinger

### Diagnóstico Adicional (Si el Problema Persiste)

**Implementado: 16 Marzo 2026**

Si los timeouts ETIMEDOUT continúan ocurriendo después de implementar la solución anterior, ejecutar el script de diagnóstico avanzado:

```bash
# En local (requiere acceso a las mismas variables de entorno que Render)
cd backend
node scripts/test-db-connection.js

# En Render (vía SSH o añadiendo al build command temporalmente)
# Agregar al render.yaml como comando temporal:
# - npm run diagnose-db
```

**Script**: `backend/scripts/test-db-connection.js`

**Qué verifica**:

1. ✅ Resolución DNS del host `srv1551.hstgr.io`
2. ✅ Conexión TCP a MySQL (authenticate)
3. ✅ Consulta simple SELECT 1
4. ✅ Estado del pool de conexiones
5. ✅ 5 conexiones paralelas simultáneas

**Salida esperada (conexión saludable)**:

```
🔍 Ejecutando diagnóstico de conexión a BD...
1️⃣ Probando resolución DNS...
   ✅ DNS resuelto: 104.21.xxx.xxx (45ms)
2️⃣ Probando conexión TCP a BD...
   ✅ Conexión establecida (1234ms)
3️⃣ Probando consulta simple...
   ✅ Consulta exitosa (89ms)
4️⃣ Estado del pool de conexiones:
   - Total: 1
   - Disponibles: 1
   - En uso: 0
   - Esperando: 0
5️⃣ Probando 5 conexiones paralelas...
   ✅ Exitosas: 5/5
   ⏱️ Duración total: 456ms
```

**Salida problemática (conexión inestable)**:

```
2️⃣ Probando conexión TCP a BD...
   ❌ Error de conexión TCP: {
     mensaje: 'connect ETIMEDOUT',
     código: 'ETIMEDOUT',
     timeout: 90000,
     duración: '>90000ms'
   }
```

### Soluciones Adicionales Según Diagnóstico

#### Caso A: Timeouts superiores a 10 segundos pero conexión exitosa

**Síntoma**: Conexión TCP toma 10-30 segundos pero eventualmente funciona.  
**Causa**: Latencia alta entre Render y Hostinger.  
**Solución**:

1. Aumentar timeouts en `backend/config/database.js`:
   ```javascript
   pool: {
       acquire: 120000, // 120s
       idle: 10000,
   },
   dialectOptions: {
       connectTimeout: 120000, // 120s
   },
   ```
2. Reducir frecuencia del cron en `backend/server-db.js`:
   ```javascript
   // De cada 60s a cada 120s
   setInterval(processPendingEmails, 120000);
   ```

#### Caso B: Resolución DNS falla o toma > 5 segundos

**Síntoma**: DNS no resuelve o toma más de 5 segundos.  
**Causa**: Problema de DNS en Render o bloqueo de Hostinger.  
**Solución**:

1. Usar IP directa en lugar de hostname (requiere actualizar `DB_HOST` en Render):

   ```bash
   # Obtener IP de srv1551.hstgr.io
   nslookup srv1551.hstgr.io

   # Actualizar variable de entorno en Render:
   DB_HOST=104.21.xxx.xxx  # Reemplazar con IP real
   ```

2. Contactar soporte de Render para verificar configuración de DNS interno.

#### Caso C: Conexiones paralelas fallan (< 3/5 exitosas)

**Síntoma**: De 5 conexiones paralelas, 2 o más fallan.  
**Causa**: Límite de conexiones simultáneas en Hostinger o pool saturado.  
**Solución**:

1. Reducir tamaño del pool en `backend/config/database.js`:
   ```javascript
   pool: {
       max: 2,  // De 5 a 2
       min: 0,
       acquire: 90000,
       idle: 10000,
   },
   ```
2. Verificar plan de hosting en Hostinger:
   - **Plan básico**: 10-25 conexiones simultáneas
   - **Plan premium**: 50-100 conexiones
3. Contactar soporte de Hostinger para aumentar límite de conexiones.

#### Caso C.1: Hostinger acepta todas las IPs, pero aparecen `Too many connections` y `ETIMEDOUT`

**Síntoma**: El acceso remoto MySQL está abierto para todas las IPs (`%`), pero Render registra errores alternados:

- `mensaje: 'Too many connections'`
- `codigo: 'ETIMEDOUT'`
- `SequelizeConnectionError` en reservas, configuración de precios o `config_sillas`

**Causa**: Límite de conexiones simultáneas o saturación temporal del MySQL compartido de Hostinger. Si una conexión tarda hasta 90s en fallar, el cron de correos cada 60s puede solaparse con el ciclo anterior y agregar presión al pool.

**Solución implementada**:

1. `backend/config/database.js` usa un pool más conservador por defecto:
   ```bash
   DB_POOL_MAX=2
   DB_POOL_ACQUIRE_MS=90000
   DB_CONNECT_TIMEOUT_MS=90000
   DB_RETRY_MAX=3
   ```
2. `backend/cron/emailProcessor.js` evita ciclos concurrentes del procesador de correos. Si el ciclo anterior sigue activo, el siguiente se omite y queda registro en logs.
3. Si el problema persiste, reducir temporalmente:
   ```bash
   DB_POOL_MAX=1
   DB_RETRY_MAX=1
   ```
   y solicitar a Hostinger revisión de `max_user_connections` / límite de conexiones del usuario MySQL.

#### Caso D: Error persiste incluso con todos los ajustes

**Síntoma**: ETIMEDOUT constante independiente de configuración.  
**Causa**: Firewall o bloqueo de IP de Render en Hostinger.  
**Solución**:

1. **Verificar whitelist de IPs en Hostinger**:
   - Acceder a cPanel → Remote MySQL
   - Agregar rangos de IP de Render (verificar con `curl icanhazip.com` desde Render SSH)
   - Render usa IPs dinámicas, puede requerir whitelist amplia o `%` (cualquier host)
2. **Migrar BD a servicio externo** (si el problema persiste):
   - Considerar PlanetScale (MySQL serverless)
   - Railway (MySQL gestionado)
   - AWS RDS (si presupuesto lo permite)
3. **Split de arquitectura**:
   - Mantener PHP y BD en Hostinger para el frontend
   - Crear BD secundaria en servicio externo solo para el backend de Render
   - Sincronizar datos críticos vía API

### Monitoreo Preventivo

Para evitar que el problema vuelva a aparecer sin detección:

1. **Agregar monitoreo de salud en Render**:

   ```javascript
   // En server-db.js, endpoint de health check
   app.get("/health/db", async (req, res) => {
   	try {
   		await sequelize.authenticate();
   		const [result] = await sequelize.query("SELECT 1");
   		res.json({
   			status: "healthy",
   			database: "connected",
   			timestamp: new Date().toISOString(),
   		});
   	} catch (error) {
   		res.status(503).json({
   			status: "unhealthy",
   			database: "disconnected",
   			error: error.message,
   			code: error.parent?.code,
   			timestamp: new Date().toISOString(),
   		});
   	}
   });
   ```

2. **Configurar alertas en Render Dashboard**:
   - Ir a Service → Alerts
   - Crear alerta para `Health Check Failed`
   - Configurar notificaciones por email

3. **Logging estructurado con timestamps**:
   - Ya implementado en `emailProcessor.js` (línea 241-248)
   - Verificar logs en Render cada 24h durante una semana después del despliegue

---

## 0. Pantalla Blanca en AdminReservas tras rediseño (Iconos Faltantes)

**Documentado: 12 Marzo 2026**

### Problema

Al cargar el panel administrativo, la pantalla se queda en blanco (o Vite reporta error 500/Internal Server Error en la consola). El error específico suele ser `ReferenceError: [IconName] is not defined`.

### Causa

Se están utilizando iconos nuevos de la librería `lucide-react` en el componente `AdminReservas.jsx` pero no se han incluido en la sentencia de importación al inicio del archivo.

**Iconos recurrentemente olvidados:**

- `Edit3`, `ClipboardList`, `Hash`, `Link2`, `MessageSquare`, `Tag`, `CreditCard`, `RefreshCcw`.

### Solución

Asegurar que todos los iconos usados en el JSX estén presentes en la importación de `lucide-react`:

```javascript
import {
	// ...otros iconos
	Edit3,
	ClipboardList,
	Hash,
	Link2,
	MessageSquare,
	Tag,
	CreditCard,
	RefreshCcw,
} from "lucide-react";
```

---

## 21. Problemas en el Sistema de Oportunidades (Feb 2026)

Durante el refinamiento del sistema de reserva expedita de oportunidades, se detectaron y corrigieron los siguientes puntos críticos:

### A. Error 404: "La oportunidad no existe"

**Causa**: El frontend enviaba el `codigo` público (ej: `OP-20260210-001`) como identificador, pero el backend usaba `findByPk(oportunidadId)`, intentando buscar por el ID numérico interno de la base de datos.
**Solución**: Cambiar la búsqueda en el backend para usar `findOne`:

```javascript
// En backend/routes/oportunidades.js
const oportunidad = await Oportunidad.findOne({
	where: { codigo: oportunidadId },
});
```

### B. Error de Conexión: `ERR_CONNECTION_REFUSED` (Puertos 3001 vs 8080)

**Causa**: Desajuste entre el puerto configurado en el backend (`8080`) y el invocado en el frontend (`3001`). Además, la detección automática de `localhost` impedía conectar con el backend en Render durante el desarrollo local.
**Solución**:

1. Estandarizar el uso de `getBackendUrl()` en todos los componentes.
2. Ajustar `getBackendUrl` para priorizar variables de entorno (`VITE_API_URL`) antes que el fallback de `localhost`.

### C. Advertencia: "Function components cannot be given refs"

**Causa**: Componentes de `ui/dialog.jsx` consumidos por Radix UI/Framer Motion sin soporte para `refs`.
**Solución**: Envolver `DialogOverlay`, `DialogContent`, `DialogTitle` y `DialogDescription` con `React.forwardRef`.

### D. Error CORS: "Method PATCH is not allowed by Access-Control-Allow-Methods in preflight response"

**Causa**: El backend respondía el preflight CORS sin incluir `PATCH` en `Access-Control-Allow-Methods`, aunque rutas administrativas como `/api/admin/traslados-hoteles/reservas/:id/estado` sí usan ese método.
**Solución**:

1. Mantener `PATCH` dentro de la lista central de métodos permitidos en `backend/server-db.js`.
2. Reutilizar esa misma lista tanto en `corsOptions.methods` como en la respuesta manual de `app.options("*", ...)`.
3. Si el error aparece solo en desarrollo local, confirmar que el frontend realmente esté apuntando al backend actualizado en Render o al backend local correcto.

---

## 13.1. Pago de Aeropuerto-Hoteles muestra "Aún no tenemos un valor para generar el enlace de pago"

**Implementado: 22 Abril 2026**

### Problema

Al confirmar una reserva del módulo Aeropuerto-Hoteles y presionar el botón de pago, el frontend mostraba la alerta **"Aún no tenemos un valor para generar el enlace de pago"** y no abría la pasarela.

### Causa Raíz

La función global `handlePayment` en `src/App.jsx` calculaba el monto usando solo `pricing.totalConDescuento` o `abono`, que pertenecen al flujo express principal.

El flujo de hoteles sí enviaba `identificadores.amount` y `paymentOrigin: "hotel"`, pero el frontend ignoraba ambos valores y forzaba `paymentOrigin: "reserva_express"`.

### Solución aplicada

- Priorizar `identificadores.amount` cuando el flujo llamador entrega un monto explícito.
- Respetar `identificadores.paymentOrigin` en el payload enviado a Flow o Mercado Pago.
- Generar una descripción específica para el pago del módulo Aeropuerto-Hoteles usando el código de reserva cuando exista.

### Resultado esperado

- El botón de pago del módulo Aeropuerto-Hoteles abre correctamente la pasarela.
- El backend recibe el monto real del traslado hotel.
- El retorno de pago conserva el origen `hotel` y aplica la lógica especializada del módulo.

---

## 13.2. Reservas duplicadas del mismo pasajero en Aeropuerto-Hoteles

**Implementado: 22 Abril 2026**

### Problema

Un pasajero podía confirmar varias veces el mismo traslado Aeropuerto-Hoteles antes de pagar, generando múltiples reservas pendientes para el mismo hotel, fecha y horario.

### Causa Raíz

El módulo Aeropuerto-Hoteles creaba siempre una nueva fila en `traslados_hoteles` desde `POST /api/traslados-hoteles/reservas`, sin verificar si ya existía una reserva activa equivalente para el mismo pasajero.

### Solución aplicada

- El backend busca una reserva activa similar antes de crear una nueva.
- La coincidencia considera email o teléfono, hotel, origen, tipo de servicio, fecha y hora de ida; en ida y vuelta también considera fecha y hora de vuelta.
- Si encuentra una reserva activa con pago pendiente o aprobado, la actualiza con los últimos datos del formulario, responde `duplicate: true` y conserva el código original.
- `HeroExpress.jsx` interpreta `duplicate: true` como reutilización y muestra la reserva pendiente para continuar el pago.

### Resultado esperado

- El doble clic, refresh o reintento del pasajero no crea N reservas iguales.
- El cliente puede seguir pagando la reserva existente.
- Reservas legítimas para otro hotel, fecha u horario no quedan bloqueadas.

---

## 13.3. Mercado Pago en Aeropuerto-Hoteles queda pendiente y `payment-status` dice que no hay token Flow

**Implementado: 22 Abril 2026**

### Problema

Después de generar una preferencia de Mercado Pago para una reserva Aeropuerto-Hoteles, los logs podían mostrar:

```text
ℹ️ [payment-status] Reserva X pendiente en DB pero no hay token para consultar Flow.
✅ [MP] Preferencia creada: ... para reserva Y
```

### Causa Raíz

`MercadoPagoReturn.jsx` consultaba `/api/payment-status` solo con `reserva_id`, sin indicar que el gateway era Mercado Pago. El backend intentaba resolver un token Flow o inferir la pasarela desde `FlowToken`, pero los tokens de Mercado Pago no quedaban marcados en `metadata.gateway`.

En algunos entornos MySQL/Sequelize, `FlowToken.metadata` puede volver como texto JSON en vez de objeto. Si no se normaliza, `metadata.gateway` queda como `undefined` y el backend trata el `preference.id` de Mercado Pago como si fuera un token Flow, generando errores 400 contra Flow API.

En paralelo, las horas del módulo Aeropuerto-Hoteles podían llegar como `HH:mm` desde el frontend y guardarse/compararse como `HH:mm:ss`, debilitando la detección de reservas activas equivalentes.

### Solución aplicada

- `MercadoPagoReturn.jsx` envía `gateway=mercadopago` al polling de `/api/payment-status`.
- `/api/payment-status` usa ese gateway o `FlowToken.metadata.gateway` para consultar Mercado Pago en vez de Flow.
- `/api/payment-status` normaliza `FlowToken.metadata` aunque llegue como texto JSON y usa el formato de `preference.id` de Mercado Pago como fallback defensivo.
- Las preferencias Mercado Pago se guardan en `FlowToken` con `paymentOrigin` y `metadata.gateway = "mercadopago"`.
- `POST /api/create-payment-mp` debe calcular `payUrl` antes de guardar `FlowToken`; si `payUrl` se usa antes de declararse, el pago redirige pero se pierde la metadata de pasarela y se debilita el fallback.
- Las consultas administrativas de recuperación de pago deben enviar `gateway=mercadopago` cuando la reserva ya tiene `metodoPago`/`pagoGateway` de Mercado Pago.
- `backend/routes/traslados-hoteles.js` normaliza horas a `HH:mm:ss` para creación, edición y detección de duplicados.

### Resultado esperado

- El polling de Mercado Pago deja de caer en el mensaje de token Flow faltante.
- Si el webhook de Mercado Pago se retrasa, `payment-status` puede consultar MP por `external_reference`.
- La reutilización de reservas activas de hoteles es más consistente entre reintentos.

---

## 14. Descuentos por Retorno Aplicados Incorrectamente

**Implementado: 14 Febrero 2026**

### Problema

El sistema aplicaba descuentos por retorno (ej: 50%, 30%) a cualquier horario seleccionado por el usuario siempre que estuviera dentro de una ventana amplia de 3 horas (holgura máxima). Esto permitía que usuarios seleccionaran horarios no óptimos (ej: 15:30 cuando la recomendación era 18:30) y aun así recibieran el descuento, generando inconsistencias operativas y financieras.

### Causa Raíz

La función `buscarOportunidadesRetorno` en `backend/utils/disponibilidad.js` utilizaba una validación por rango (`tiempoEspera >= min && tiempoEspera <= max`) que era demasiado permisiva, en lugar de verificar si el horario seleccionado coincidía con las opciones específicas ofrecidas (tarjetas verdes).

### Solución (Febrero 2026)

Se modificó la lógica de validación en el backend para ser estricta y solo permitir descuentos si el horario seleccionado coincide con los "offsets" estandarizados, con una tolerancia de 5 minutos.

**Offsets Válidos:**

- **Retorno (Post-Trip)**: +30 min (50%), +45 min (30%), +60 min (20%)
- **Posicionamiento (Pre-Trip)**: 0 min (50%), +15 min (30%), +30 min (20%) [salir antes]

**Archivo modificado:** `backend/utils/disponibilidad.js`

### Verificación

1. **Frontend**: Al seleccionar una hora exacta sugerida (ej: 18:30), el descuento se aplica.
2. **Frontend**: Al seleccionar una hora manual arbitraria (ej: 15:00) aunque esté cerca, si no calza con los offsets (+/- 5 min), el descuento NO se aplica.
3. **Backend**: La API de validación responde con `hayOportunidad: false` para horarios fuera de los slots permitidos.

**Actualización UI (14 Feb 2026):**
Se corrigió un bug en `HeroExpress.jsx` donde el mensaje "¡Descuento por retorno aplicado!" dependía de un estado local desincronizado. Ahora el mensaje se activa directamente verificando `pricing.descuentoRetornoUniversal > 0` (expuesto en `App.jsx`), asegurando que si hay descuento en el precio, siempre haya aviso visual.

---

## 22. Conversiones Google Ads con Valor Cero (Robustez de Monto)

**Implementado: 15 Febrero 2026**

### Problema

Algunas conversiones de Google Ads se registraban con valor 0 o no se registraban cuando el parámetro `amount` fallaba en la redirección desde Flow, causando que Google Ads descartara la conversión o la registrara sin valor económico.

### Causa

El sistema dependía estrictamente de que el parámetro `amount` llegara correctamente en la URL. Si llegaba vacío, null o 0, el sistema enviaba ese valor a Google.

### Solución

Se implementó una estrategia de "defensa en profundidad" tanto en frontend como backend:

1.  **Backend (`server-db.js`)**: Si el monto de Flow falla, busca en la BD (`totalConDescuento` o `reserva.total`). Si todo falla, usa `1.0` como fallback. Validaciones estrictas antes de redirigir.
2.  **Frontend (`App.jsx` y `FlowReturn.jsx`)**:
    - Parsea el monto con `parseFloat`.
    - Si el resultado es falsy o 0, fuerza el valor a `1.0`.
    - **Conversiones Mejoradas**: Se envía `email` y `telefono` hasheados (SHA256) para mejorar la atribución.

### Archivos Modificados

- `backend/server-db.js`
- `src/App.jsx`
- `src/components/FlowReturn.jsx`

> [!IMPORTANT]
> **Regla de Oro**: Una conversión con valor 1.0 es infinitamente mejor que ninguna conversión. El sistema ahora prioriza capturar el evento sobre la precisión del monto en casos de fallo de datos.

---

## 12. Optimización Premium y Móvil de HeroExpress

**Implementado: 15 Febrero 2026**

### Problema

El componente `HeroExpress` presentaba una experiencia de usuario subóptima en dispositivos móviles y falta de armonía visual en PC:

- **Móvil**: Los selectores de cantidad de sillas usaban botones pequeños (32px), difíciles de accionar. Los checkboxes eran menos intuitivos que los interruptores (Switches) para activar opciones.
- **PC**: La disposición vertical de las opciones extra ("Regreso" y "Sillas") generaba espacios vacíos y anchos desiguales, rompiendo la estética premium.
- **Visual**: Había problemas de "clipping" (recorte) en los anillos de enfoque/selección debido a contenedores con `overflow-hidden`.

### Solución

Se realizó un rediseño integral enfocado en **Accesibilidad Táctil** y **Armonía Visual**:

1. **Controles de Interacción**:
   - Reemplazo de `Checkbox` por `Switch` para "Necesito regreso" y "¿Silla para niños?". Los switches son más ergonómicos para el pulgar en móviles.
   - **Target Táctil de 48px**: Se aumentó el tamaño de los botones numéricos a 48x48px (mínimo recomendado para accesibilidad) con anillos de enfoque de 4px para un feedback claro.

2. **Disposición Adaptativa (Grid)**:
   - **Móvil**: Estructura vertical optimizada.
   - **PC**: Implementación de `grid-cols-2` para agrupar las opciones extra en una sola fila simétrica, logrando una disposición equilibrada junto al botón principal.

3. **Manejo de Animaciones y Clipping**:
   - Se cambió `overflow-hidden` por `overflow-visible` en los contenedores de animación de Framer Motion.
   - Se añadió padding interno (`p-1`) para permitir que los efectos de sombra (shadow-lg) y anillos de selección (ring-4) se visualicen completos sin recortes.

4. **Identidad Visual**:
   - Corrección de paleta de colores: Cambio de Ámbar por **Chocolate Brown** (`#4A3728`) para alinearse con la estética premium de la marca en todas las secciones de interacción.

### Gotchas Técnicas

- **Propagación de Clicks**: Al usar `Switch` dentro de un contenedor con `onClick`, fue necesario usar `e.stopPropagation()` o clases como `no-click-prop` para evitar disparos dobles del toggle.
- **Z-Index en Móvil**: La tarjeta del formulario usa `-mt-6` y `z-10` para superponerse elegantemente a la imagen de cabecera en móviles, proporcionando una sensación de profundidad.

**Archivos modificados**:

- `src/components/HeroExpress.jsx`: Lógica de componentes, estilos de grid y targets táctiles.
- `src/App.css`: Definición de la paleta `chocolate`.

---

---

## 13. Reservas Huérfanas (Invisible en Panel pero visible en Planificación)

**Detectado: 16 Febrero 2026**

### Problema

Ciertas reservas de retorno confirmadas desaparecen del listado principal del panel administrativo ("Reservas"), pero siguen apareciendo en la vista de "Planificación" y existen en la base de datos.

### Causa Raíz

1. **Eliminación Parcial**: El tramo de IDA (padre) fue eliminado físicamente de la base de datos, dejando el tramo de VUELTA (hijo) huérfano.
2. **Filtrado de UI**: El endpoint `/api/reservas` y el frontend están diseñados para ocultar los tramos de vuelta (para mostrarlos anidados bajo su padre, como `tramoHijo`). Al ser eliminada la Ida (padre), la Vuelta no tiene referencia para mostrarse.
3. **Planificación sin Filtro**: El endpoint de calendario no aplica este filtro jerárquico y consulta todas las reservas del día, por lo que muestra la reserva huérfana.
4. **Falta de Auditoría**: La eliminación original no dejó rastro en `admin_audit_logs` porque el endpoint `DELETE` no tenía implementado el registro de acciones.

### Solución (Febrero 2026)

**1. Recuperación de Datos (Script)**
Se creó un script (`backend/restore-reserva.js`) para "adoptar" las reservas huérfanas creando un nuevo tramo de ida genérico que actúe como padre y las vincule correctamente (`tramoPadreId`).

**2. Mejora de Seguridad y Auditoría**
Se modificó `backend/server-db.js` el endpoint `DELETE /api/reservas/:id`:

- **Autenticación Obligatoria**: Se agregó middleware `authAdmin` para requerir token de administrador.
- **Auditoría**: Se implementó `AdminAuditLog.create()` para registrar **quién** inició la eliminación, **cuándo** y los detalles de la reserva eliminada (incluyendo sus IDs vinculados).

**Prevención**:
El sistema ahora impide eliminaciones anónimas y deja un rastro claro de auditoría, facilitando la investigación de cualquier futura desaparición de reservas.

---

---

## 14. Direcciones Vagas o Faltantes en Flujo Express

**Implementado: 18 Febrero 2026**

### Problema

En el flujo Express, el cliente paga primero y completa los detalles (dirección, vuelo, etc.) en una ventana posterior al pago.

- **Síntoma**: Reservas que aparecen en el administrador marcadas como "Pagado/Confirmado" pero con la columna de Ruta vacía.
- **Causa**: El cliente cierra el navegador o la pestaña tras ver la confirmación del pago, saltándose el paso de "Completar Detalles".

### Solución (Febrero 2026)

Se implementó un sistema de **Recuperación de Detalles Incompletos**.

#### 1. Identificación Logística

Se separó el dato de **Dirección Geográfica** (Google Maps) del dato de **Referencia** (Hotel).

- El campo virtual `detallesCompletos` en `Reserva.js` ahora valida específicamente que exista una dirección en los campos de ruta (`direccionOrigen` / `Destino`).
- En el panel Admin, las reservas incompletas se destacan con un **Badge Rojo ⚠️ Detalles Incompletos**.

#### 2. Flujo de Recuperación

Se añadió un mecanismo para que el administrador solicite los datos faltantes:

- **Botón "📧 Solicitar Datos Faltantes"**: Disponible en el modal de detalles de la reserva.
- **Email Automatizado**: Envía un correo elegante al cliente con un enlace directo a su consulta de reserva (`#consultar-reserva`).
- **Update Autónomo**: El cliente puede rellenar el formulario de detalles desde la página pública sin necesidad de loguearse.

### Cómo Verificar

1. Si ves una reserva con el badge rojo, haz clic en ella.
2. Pulsa el botón del sobre para enviar el recordatorio.
3. El sistema registrará el envío en el historial de la reserva.
4. Cuando el cliente complete los datos, el badge rojo desaparecerá automáticamente y verás la dirección en la columna de Ruta.

> [!TIP]
> Este sistema reduce la carga operativa de llamar manualmente a cada cliente que olvida completar su dirección tras el pago.

---

## 15. Error Flow 1620 (The userEmail: ... is not valid)

**Implementado: 20 Febrero 2026**

### Problema

Al intentar generar un pago desde la "Consulta de Reserva" o "Pagar con Código", el sistema arrojaba el error `code: 1620` de Flow, indicando que el email del usuario no es válido.

### Síntomas

- El usuario pulsa "Pagar" y recibe un mensaje: "Error al generar pago (500) Error al generar el pago con Flow".
- En los logs del servidor se observa: `Error al crear el pago con Flow: { code: 1620, message: 'The userEmail: ... is not valid.' }`.

### Causa Raíz

1. **Emails Nulos**: En algunas reservas antiguas o manuales, el campo `email` podía ser `null`. La función de sanitización devolvía un string vacío, el cual Flow rechaza.
2. **Caracteres Invisibles/Especiales**: Emails capturados con espacios incrustados o caracteres no-ASCII que Flow no procesa correctamente.

### Solución (Febrero 2026)

Se implementó un sistema de **Sanitización y Validación Robusta** antes de enviar cualquier dato a Flow.

#### 1. Backend (`backend/server-db.js`)

- **Sanitización Previa**: Se utiliza `sanitizarEmailRobusto(email)` que elimina espacios, convierte a minúsculas y quita caracteres no-ASCII.
- **Validación de Formato**: Se agregó un Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` para verificar el email _después_ de ser sanitizado.
- **Filtro de Seguridad**: Si el email es inválido o está vacío, el servidor detiene el proceso y retorna un error `400 Bad Request` con el mensaje: "El email de la reserva no tiene un formato válido. Por favor contacta a soporte". Esto evita llamadas fallidas a la API de Flow.
- **Log Diagnóstico**: Se agregó un log detallado que muestra la longitud y dominio del email para facilitar el debug de casos específicos.

#### 2. Frontend (`src/components/ConsultarReserva.jsx`)

- Se mejoró el manejo de errores para capturar y mostrar el mensaje detallado enviado por el servidor (`errData.message`).

### Cómo Verificar

1. Busca una reserva en "Consultar Reserva".
2. Si el email es inválido, ahora verás un mensaje claro en lugar de un error genérico 500.
3. En los logs de Render aparecerá: `❌ [Flow] Email inválido para Flow después de sanitizar`.

> [!IMPORTANT]
> Esta mejora garantiza que no se pierdan intentos de pago por errores de formato simples y proporciona feedback inmediato al administrador y al cliente.

## 5. Problemas de Google Ads

### 5.1 Deduplicación Incorrecta de Reservas Consecutivas

**Implementado: 27 Febrero 2026**

**Problema Identificado**:
Cuando un usuario realizaba dos reservas "Solo Ida" consecutivas en un periodo muy corto de tiempo, Google Ads ocasionalmente descartaba la segunda conversión. Al revisar ambas compras, los pagos (`pago_id`) e IDs de reserva (`reserva_id`) eran distintos, sin embargo, la etiqueta global `gtag` estaba enviando únicamente el `reservaId` como el `transaction_id`.

**Causa Raíz**:
Google Ads procesa la unicidad de las conversiones (deduplication) basado en el `transaction_id`. Si por algún motivo de la sesión activa, recargas de página o sincronización de los metadatos de "Enhanced Conversions" (como el mismo correo electrónico en periodos muy breves) se interpretaba una colisión de ventana, el ID simple (`509`) podría fusionarse o sobrescribirse inadvertidamente si el `window.gtag` de la recarga previa bloqueaba el scope.

Además, los callbacks de Flow a veces redirigen con la falta del `reserva_id`, provocando que el timestamp temporal sea usado.

**Solución Implementada**:
Para forzar una diferenciación absoluta de `transaction_id` entre compras consecutivas reales del mismo cliente, se modificaron los archivos `src/App.jsx` y `src/components/FlowReturn.jsx`.
Ahora, el `transaction_id` combina el ID de la reserva con un substring del token único de Flow (ej: `509_8fA2bC1`), generando una huella criptográfica inequívoca para cada transacción pagada en la ventana activa.

## 11. Pérdida de Conversiones de Google Ads por Latencia en Flow

**Implementado: 12 Marzo 2026**

### Problema

Se detectaron casos donde las conversiones de Google Ads se registraban con valor cero o no se registraban en absoluto, a pesar de que el usuario había pagado exitosamente en Flow.

### Síntomas

- Reservas pagadas aparecen en el panel admin pero no marcan valor de conversión en Google Ads.
- Logs muestran errores de timeout o excepciones al intentar consultar el estado del pago en Flow.
- La URL de retorno no contiene el parámetro de monto (`amount`).

### Causa Raíz

El backend dependía totalmente de una llamada asíncrona a la API de Flow (`getStatus`) durante la redirección del usuario. Si esta llamada fallaba por latencia de Render o respuesta lenta de Flow, el sistema activaba un fallback que enviaba al usuario a la página de retorno sin el valor del monto, lo que invalidaba la conversión de Google Ads.

### Solución (Marzo 2026)

Se implementó un **Sistema de Persistencia Previa de Tokens**.

1.  **Modelo `FlowToken`**: Ahora, antes de redirigir al usuario a Flow, el backend guarda el monto y los metadatos de la intención de pago vinculados al token.
2.  **Fallback Robusto**: Si la API de Flow falla durante el retorno, el sistema consulta la tabla `FlowToken` y recupera el monto persistido localmente.
3.  **Valor Centinela**: Se implementó una protección donde, si fallan todos los métodos de recuperación, se inyecta un valor de `1.0 CLP` en lugar de dejar el monto vacío, asegurando que Google Ads reciba un valor numérico válido.

### Archivos Modificados

- `backend/server-db.js`: Lógica de persistencia en `/create-payment` y fallbacks en `/api/payment-result`.
- `backend/models/FlowToken.js`: Definición del nuevo modelo.
- `src/components/FlowReturn.jsx`: Mejoras en la detección y tracking.
- `src/App.jsx`: Normalización de parámetros de origen.

> [!NOTE]
> Para más detalles técnicos sobre el funcionamiento, ver [Sección 5.24 de la Documentación Maestra](DOCUMENTACION_MAESTRA.md#524-sistema-de-persistencia-y-robustez-de-pagos).

---

## 16. Conversiones Perdidas por Doble Redirección de Flow (PagarConCodigo)

**Detectado e implementado: 15 Marzo 2026**

### Problema

Las conversiones de Google Ads de _Purchase_ no se registraban para pagos realizados con código (flujo `PagarConCodigo`). El pago se completaba correctamente y aparecía como pagado en el panel de administración, pero Google Ads nunca registraba la conversión.

### Síntomas

- Reservas con código (`estadoPago = "pagado"`) visibles en el panel admin sin conversión en Google Ads.
- La página `FlowReturn.jsx` se mostraba con el **icono de reloj** (estado pendiente) en lugar del ícono de éxito.
- El navegador permanecía indefinidamente en el estado "Procesando pago..." sin avanzar a "¡Pago Exitoso!".
- Logs de Render confirmaban que el webhook recibía `status=2` (pagado), pero el frontend nunca lo recibía.

### Causa Raíz: Doble Redirección de Flow

Flow envía la URL de retorno **dos veces con distintos estados**:

| Momento                             | Destinatario          | Status           | Acción del Backend                       |
| ----------------------------------- | --------------------- | ---------------- | ---------------------------------------- |
| Inmediato (usuario cierra pasarela) | Navegador del usuario | `1` (Pendiente)  | Redirige a `/flow-return?status=pending` |
| Segundos/minutos después            | Webhook del servidor  | `2` (Confirmado) | Actualiza BD, **NO redirige**            |

**Consecuencia**: El navegador del usuario siempre recibía `status=1` (pendiente) para pagos con código. El frontend nunca recibía `status=2`, por lo que **nunca disparaba la conversión**.

### Solución (15 Marzo 2026)

Se implementó un mecanismo de **polling desde el frontend** que consulta periódicamente el estado real del pago en la base de datos, resolviendo la brecha entre la redirección de browser y el webhook:

#### 1. Nuevo Endpoint: `GET /api/payment-status`

**Archivo**: `backend/server-db.js`

```javascript
app.get("/api/payment-status", async (req, res) => {
    const { token, reserva_id } = req.query;
    // Busca por token → FlowToken → Reserva, o directamente por reserva_id
    const transaccionConfirmada =
        reserva.estadoPago === "pagado" || reserva.estadoPago === "parcial";
    const monto = transaccionConfirmada ? Number(...) : null;
    return res.json({
        pagado: reserva.estadoPago === "pagado",
        transaccionConfirmada,
        status: reserva.estadoPago,
        monto,
    });
});
```

Endpoint público (sin autenticación), consultable por token de Flow o ID de reserva.
Si `status === "parcial"`, el frontend debe tratarlo como pago confirmado para cerrar el polling y disparar la conversión de la transacción actual.

#### 2. Polling en `FlowReturn.jsx`

Cuando el backend redirige con `status=pending`, el componente inicia polling:

```javascript
// 5 segundos de intervalo, máximo 24 intentos (≈ 2 minutos)
if (statusParam === "pending") {
	setPaymentStatus("pending");
	let intentos = 0;
	const pollingInterval = setInterval(async () => {
		intentos++;
		if (intentos > 24) {
			clearInterval(pollingInterval);
			return;
		}
		const resp = await fetch(
			`${apiBase}/api/payment-status?token=${token}&reserva_id=${reservaId}`,
		);
		const data = await resp.json();
		if (data.transaccionConfirmada || data.pagado || data.status === "parcial") {
			clearInterval(pollingInterval);
			setPaymentStatus("success");
			await waitForGtag(); // esperar gtag antes de disparar
			triggerConversion(
				amountParam || data.monto?.toString(),
				reservaId,
				token,
			);
		}
	}, 5000);
	return () => {
		cancelado = true;
		clearInterval(pollingInterval);
	};
}
```

#### 3. Polling en `App.jsx` (flujo HeroExpress)

Para el flujo de reserva express, `App.jsx` detecta `?flow_payment=pending` y realiza el mismo polling. Al confirmar el pago, hace un **redirect interno** a `?flow_payment=success&amount=<montoReal>`:

```javascript
const flowPending = url.searchParams.get("flow_payment") === "pending";
if (flowPending && reservaId) {
	const pollingInterval = setInterval(async () => {
		const data = await fetch(
			`${apiBase}/api/payment-status?reserva_id=${reservaId}`,
		).then((r) => r.json());
		if (data.pagado) {
			clearInterval(pollingInterval);
			nuevaUrl.searchParams.set("flow_payment", "success");
			nuevaUrl.searchParams.set("amount", data.monto || amount);
			window.location.replace(nuevaUrl.toString());
		}
	}, 5000);
}
```

### Diagnóstico

Para verificar que el polling funciona, revisar en consola del navegador:

```
[FlowReturn] status=pending detectado, iniciando polling de estado...
[FlowReturn] Polling intento 1...
[FlowReturn] Pago confirmado por BD. Disparando conversión con monto: 59670
🚀 [FlowReturn] Disparando conversión Google Ads: { value: 59670, ... }
```

### Archivos Modificados (commits bf0d8b9, 0d88974, 63b6d26)

- `backend/server-db.js`: Nuevo endpoint `GET /api/payment-status`.
- `src/components/FlowReturn.jsx`: Polling para `status=pending`.
- `src/App.jsx`: Detección de `flow_payment=pending` + polling + redirect.
- `src/pages/OportunidadesTraslado.jsx`: Lead event mejorado con `waitForGtag` 2s.
- `src/components/ReservaRapidaModal.jsx`: Lead event mejorado con `waitForGtag` 2s.

> [!WARNING]
> **Para nuevos flujos de pago**: Si el nuevo flujo puede recibir `status=1` (pendiente) al retornar de Flow, **siempre implementar el polling** usando `/api/payment-status`. No basta con detectar `status=2` en la URL de retorno porque Flow puede no enviarlo al navegador.

---

## 17. Pruebas de conversiones sin pagar una reserva (QA)

### Objetivo

Validar que los eventos de Google Ads (Lead y Purchase), Enhanced Conversions y el monto (`amount`) se envian correctamente sin ejecutar un pago real.

### Herramienta interna

Usar la vista de pruebas: `/test-google-ads` (componente `src/components/TestGoogleAds.jsx`).

### Procedimiento rapido

1. Abrir `/test-google-ads`.
2. Configurar valores de prueba: `token`, `reserva_id`, `amount`, `email`, `nombre`, `telefono`.
3. Hacer clic en:
   - `Probar Purchase directo con monto` para validar payload directo.
   - `Simular /flow-return success` para validar flujo `FlowReturn.jsx`.
   - `Simular /mp-return success` para validar flujo `MercadoPagoReturn.jsx`.
   - `Simular /?flow_payment=success` para validar flujo express en `App.jsx`.
4. Revisar DevTools > Network y confirmar:
   - Evento `conversion`.
   - `send_to` correcto.
   - `value=<amount>` configurado.
5. Revisar consola y confirmar logs de `user_data` (Enhanced Conversions).

### Notas

- Si no aparece el evento, revisar bloqueadores (AdBlock) y carga de `gtag` en `index.html`.
- Si se repite una prueba con el mismo token/reserva, limpiar claves de deduplicacion desde la misma vista para evitar bloqueos por `sessionStorage`.

---

## 10. Errores de Transferencia SCP en Despliegue (Conexión Cerrada)

**Implementado: 1 Abril 2026**

### Problema

Al intentar desplegar el build del frontend (`dist/`) mediante el comando `scp -r`, la conexión se cierra inesperadamente después de ingresar la contraseña ("Connection closed by 82.112.246.242 port 65002").

### Causa Raíz

- **Límites de Hosting Compartido**: Hostinger puede cerrar conexiones SCP que intentan transferir demasiados archivos pequeños de forma simultánea o que superan un umbral de tiempo/datos en una sola sesión.
- **Latencia y Overhead**: El build de React/Vite genera cientos de archivos en `assets/`, lo que genera mucho overhead en el protocolo SCP.

### Solución (Estrategia de Compresión)

La forma más robusta de transferir el build es comprimirlo localmente, subir un solo archivo y descomprimirlo en el servidor.

#### Opción A: Pipe con Tar (Recomendado - Windows/Linux)

Este comando comprime, transfiere y descomprime en un solo paso sin dejar archivos temporales pesados:

```bash
tar -czf - -C dist . | ssh -p 65002 u419311572@82.112.246.242 "tar -xzf - -C /home/u419311572/domains/transportesaraucaria.cl/public_html/"
```

#### Opción B: Proceso Manual de 3 Pasos

Si el pipe falla, realizar el proceso por partes:

1. **Comprimir localmente**:
   ```bash
   tar -czf dist.tar.gz -C dist .
   ```
2. **Subir archivo único**:
   ```bash
   scp -P 65002 dist.tar.gz u419311572@82.112.246.242:/home/u419311572/domains/transportesaraucaria.cl/public_html/
   ```
3. **Descomprimir y limpiar en el servidor**:
   ```bash
   ssh -p 65002 u419311572@82.112.246.242 "tar -xzf /home/u419311572/domains/transportesaraucaria.cl/public_html/dist.tar.gz -C /home/u419311572/domains/transportesaraucaria.cl/public_html/ && rm /home/u419311572/domains/transportesaraucaria.cl/public_html/dist.tar.gz"
   ```

### Verificación

1. Acceder al sitio web y verificar que los cambios visuales están presentes.
2. Si el sitio muestra pantalla en blanco, verificar que `index.html` y la carpeta `assets/` estén correctamente ubicados en `public_html/`.

---
