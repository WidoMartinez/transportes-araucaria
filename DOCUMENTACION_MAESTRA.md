# 📘 Documentación Maestra - Transportes Araucaria

> **Última Actualización**: 7 Enero 2026
> **Versión**: 1.3

Este documento centraliza toda la información técnica, operativa y de usuario para el proyecto **Transportes Araucaria**. Reemplaza a la documentación fragmentada anterior.

---

## 📑 Índice

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Guía para Desarrolladores](#2-guía-para-desarrolladores)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Manual de Usuario (Panel Admin)](#4-manual-de-usuario-panel-admin)
5. [Sistemas Técnicos Detallados](#5-sistemas-técnicos-detallados)
   - [Autenticación](#51-sistema-de-autenticación)
   - [Pagos y Finanzas](#52-pagos-y-finanzas)
   - [Notificaciones](#53-notificaciones-via-email)
   - [Integraciones Externas](#54-integraciones-externas)
6. [Mantenimiento y Despliegue](#6-mantenimiento-y-despliegue)
7. [Solución de Problemas (Troubleshooting)](#7-solución-de-problemas-troubleshooting)
8. [Anexos Históricos](#8-anexos-históricos)

---

## 1. Visión General del Proyecto

### Descripción
Página web profesional y sistema de gestión para **Transportes Araucaria**, especializada en traslados desde el Aeropuerto de La Araucanía. El sistema incluye un frontend público para captación de leads/reservas y un panel administrativo completo para la gestión del negocio.

### Tecnologías Clave
- **Frontend**: React 18, Vite, Tailwind CSS, Shadcn/UI.
- **Backend**: Node.js + Express (hospedado en **Render.com**).
- **Base de Datos**: PostgreSQL (vía Sequelize).
- **Infraestructura Legacy**: Scripts PHP para emails (hospedados en **Hostinger**).

---

## 2. Guía para Desarrolladores

### Setup Local
1. **Requisitos**: Node.js 18+, npm.
2. **Instalación**:
   ```bash
   npm install
   ```
3. **Desarrollo**:
   ```bash
   npm run dev
   ```
   *Nota: El frontend local (puerto 5173) se conecta al backend de producción en Render por defecto, salvo configuración contraria en `.env.local`.*

### Variables de Entorno (`.env.local`)
```env
VITE_API_URL=https://transportes-araucaria.onrender.com
# Para desarrollo backend local:
# VITE_API_URL=http://localhost:3001
```

### Reglas de Contribución (`AGENTS.md`)
- **Idioma**: Todo en Español (código, commits, docs).
- **Archivos Protegidos**: No modificar archivos en `.github/` sin autorización.
- **PHP**: Los archivos PHP en Hostinger se despliegan **manualmente**. No sobrescribir lógica de correos sin verificar `INTEGRACION_EMAILS_PHP.md`.

### Sistema de Documentación

**Documentos Maestros Oficiales:**
- **`DOCUMENTACION_MAESTRA.md`**: Funcionalidades, arquitectura, flujos de usuario y sistemas técnicos
- **`GUIA_SOLUCION_PROBLEMAS.md`**: Troubleshooting, errores recurrentes y sus soluciones

**Workflow de Documentación:**
El proyecto incluye el workflow `/documentacion` que debe ejecutarse después de:
- Resolver un bug complejo
- Implementar una nueva funcionalidad mayor
- Modificar la arquitectura del sistema
- Detectar que la documentación está desactualizada

**Reglas Críticas para Agentes:**
1. **SIEMPRE consultar** `DOCUMENTACION_MAESTRA.md` y `GUIA_SOLUCION_PROBLEMAS.md` antes de intervenir el proyecto
2. Si el problema ya está documentado en `GUIA_SOLUCION_PROBLEMAS.md`, seguir la solución establecida
3. Después de resolver un problema nuevo, actualizar la documentación usando `/documentacion`
4. **No crear documentos nuevos** innecesarios, editar y completar los existentes

> [!IMPORTANT]
> **Para Agentes IA**: La documentación contiene soluciones a problemas recurrentes. Consultarla antes de actuar evita errores iterativos y mantiene la consistencia del proyecto.

---

## 3. Arquitectura del Sistema

### Estructura del Panel Administrativo
El panel ha sido rediseñado (v2.0) para optimizar la operación:

- **Dashboard**: KPIs en tiempo real (Ingresos, Ocupación, Reservas Hoy).
- **Operaciones**:
  - `AdminReservas`: Gestión central, vista calendario.
  - `AdminVehiculos` / `AdminConductores`: Gestión de flota y personal.
- **Finanzas**: 
  - Control de gastos asociados a reservas.
  - **Estadísticas**: Panel de métricas financieras y operativas.
    - **Filtrado Inteligente**: Las estadísticas consideran **únicamente reservas completadas** para reflejar la realidad financiera.
    - **Métricas Disponibles**: Total de reservas, ingresos, gastos y utilidad neta.
    - **Filtros Temporales**: Últimos 15/30 días, mes actual, mes pasado, todo el historial o rango personalizado.
    - **Vistas**: Por conductor, por vehículo, por tipo de gasto.
  - Códigos de pago para facilitar cobros.
- **Configuración**: Tarifas base, precios dinámicos, festivos y bloqueos.
- **Marketing**: Gestión de códigos de descuento.

### Diagrama de Flujo de Datos
```mermaid
graph TD
    A[Cliente Web] -->|Reserva| B[Backend API (Render)]
    B -->|Persistencia| C[PostgreSQL]
    B -->|Webhook/Post| D[Script PHP (Hostinger)]
    D -->|SMTP| E[Email Notificación]
    A -->|Pago| F[Flow / Webpay]
    F -->|Confirmación| B
```

---

## 4. Manual de Usuario (Panel Admin)

### Acceso
- **URL**: `/admin`
- **Credenciales**: Gestionadas por SuperAdmin.

### Funcionalidades Clave
1. **Crear Reserva**:
   - Botón "Nueva Reserva".
   - Autocompletado de clientes frecuentes.
   - Cálculo automático de tarifa (incluyendo reglas dinámicas).
2. **Gestionar Estados**:
   - Estados: `Pendiente` -> `Confirmada` -> `Completada`.
   - Pagos: Registro de abonos o pagos completos.
3. **Calendario de Planificación**:
   - Vista visual de ocupación de vehículos.
   - Alertas de conflictos de horario.
4. **Configuración de Precios por Pasajero**:
   - Gestión de **porcentaje adicional** por cada pasajero extra.
   - Configuración independiente para **Autos** (1-3 pasajeros) y **Vans** (4-7 pasajeros).
   - Valores en formato decimal: `0.10` = 10% de incremento.
   - **Fórmula Auto**: `Precio Final = Base + (Pasajeros - 1) × (Base × % Adicional)`
   - **Fórmula Van**: `Precio Final = Base + (Pasajeros - 4) × (Base × % Adicional)`
   - Ejemplo Auto: $30,000 con 10% adicional → 2 pax = $33,000, 3 pax = $36,000
   - Ejemplo Van: $50,000 con 5% adicional → 4 pax = $50,000, 5 pax = $52,500, 6 pax = $55,000
5. **Gestión de Vehículos de Alta Capacidad (Vans)**:
   - **Soporte extendido**: El sistema permite reservas de hasta 7 pasajeros.
   - **Requisito de Flota**: Para aceptar reservas de 5-7 pasajeros, debe existir un vehículo tipo "Van" con capacidad 7 en `AdminVehiculos`.
   - **Asignación Manual Segura**: El sistema filtra automáticamente los vehículos en el momento de la asignación, mostrando solo aquellos con capacidad suficiente para el grupo (ej: al asignar una reserva de 6 pax, solo se mostrarán Vans, ocultando los autos pequeños).
   - **Fallback a WhatsApp**: Si un cliente intenta reservar para 5-7 pasajeros y no hay Vans disponibles, el sistema le redirige automáticamente a WhatsApp para gestión manual.

### Solución de Problemas Comunes
- **Error de Carga**: Si el panel no carga datos, verificar conexión a internet y estado de Render (puede "dormirse" en plan gratuito).
- **Emails no llegan**: Verificar carpeta SPAM y logs en `AdminEmails`.

---

## 5. Sistemas Técnicos Detallados

### 5.1 Sistema de Autenticación
Usa **JWT (JSON Web Tokens)**.
- El token se almacena en `localStorage`.
- Expiración automática.
- Middleware en backend `authenticateToken` protege las rutas críticas.

### 5.2 Pagos y Finanzas
- **Integración Flow**: Para pagos con tarjetas chilenas.
- **Códigos de Pago**: Sistema propio para generar links de pago únicos.
  - Vencimiento configurable.
  - Asociación directa a reservas.

### 5.3 Notificaciones vía Email
El sistema utiliza una arquitectura híbrida:
1. **Backend Node** recibe la solicitud de envío.
2. **Backend Node** hace POST a script PHP en Hostinger (`enviar_email_avanzado.php`).
3. **PHP** utiliza `PHPMailer` autenticado para el envío final.
*Motivo: Mejor entregabilidad y uso de infraestructura de correo existente en Hostinger.*

### 5.4 Integraciones Externas
- **Google Ads**: Conversiones mejoradas implementadas en flujos de pago.
  - **Tracking Robusto**: El backend (`/api/payment-result`) inyecta el monto real de la transacción en la URL de retorno, garantizando que el tag de conversión (`gtag`) reciba el valor correcto incluso si falla la consulta de base de datos local.
- **Google Maps**: Autocomplete V2 (`PlaceAutocompleteElement`) para direcciones.

### 5.5 Lógica de Disponibilidad y Capacidad Extendida
Se implementó soporte para hasta 7 pasajeros con una lógica de fallback híbrida:

1.  **Backend (`/api/disponibilidad/verificar`)**:
    - Recibe `pasajeros` y filtra vehículos con `capacidad >= pasajeros`.
    - Retorna `disponible: false` si no encuentra vehículos adecuados en el horario.

2.  **Frontend (`Hero.jsx` / `HeroExpress.jsx`)**:
    - Consume el endpoint de verificación.
    - **Lógica de Fallback**: Si el endpoint retorna `false` y el grupo es de 5-7 personas (Vans), se intercepta el bloqueo estándar y se muestra un componente `WhatsAppButton`.
    - Esto permite capturar leads de grupos grandes incluso sin disponibilidad automática configurada.

3.  **Componentes Reutilizables**:
    - `WhatsAppButton.jsx`: Centraliza la lógica de contacto + Tracking de Google Ads. Usar este componente para cualquier nuevo punto de contacto.

4.  **Panel de Administración**:
    - En `AdminReservas`, el selector de vehículos filtra automáticamente por capacidad en el frontend: `vehiculos.filter(v => capacity >= required)`.
    - Esto previene errores operativos de asignación de vehículos pequeños a grupos grandes.

### 5.6 Estándares de Flujos de Pago y Notificaciones

Para garantizar la consistencia operativa y del marketing (Google Ads), se han estandarizado los 3 flujos de reserva. Toda modificación futura **debe respetar estas directrices**:

#### A. Módulo Principal (Express)
*   **Ruta**: Home → Cotización → Pago → `CompletarDetalles.jsx`.
*   **Captura de Dirección**: 
    - Obligatorio usar `AddressAutocomplete` en el campo `hotel` dentro de `CompletarDetalles.jsx`.
    - **Validación Frontend**: El componente valida que el campo no esté vacío antes de enviar (líneas 161-166).
    - **Validación Backend**: El endpoint `/completar-reserva-detalles` retorna error HTTP 400 si falta la dirección.
*   **Notificaciones**:
    1.  **Pago**: Webhook (`/api/flow-confirmation`) notifica el dinero recibido (Admin + Cliente).
    2.  **Logística**: Al guardar detalles en `PUT /completar-reserva-detalles`, se dispara la notificación logística (Admin + Cliente).
*   **Tracking**: La conversión se dispara en `App.jsx` al retornar de Flow, usando los parámetros `amount` y `d` (datos de usuario encriptados).

#### B. Pagar con Código
*   **Ruta**: Usuario ingresa código → Cotización + Detalles upfront → Pago → `FlowReturn.jsx`.
*   **Captura de Dirección**: 
    - Obligatorio usar `AddressAutocomplete` en el formulario inicial de `PagarConCodigo.jsx`.
    - Campos condicionales: `direccionDestino` (viajes DESDE aeropuerto) o `direccionOrigen` (viajes HACIA aeropuerto).
    - **Validación Frontend**: El componente valida según sentido del viaje (líneas 196-212).
    - **Mapeo Inteligente Backend**: El endpoint `/enviar-reserva-express` determina automáticamente qué dirección usar y la guarda en el campo `hotel` (líneas 2793-2815).
*   **Notificaciones**:
    1.  **Logística**: Ocurre al crear la reserva inicial (`POST /enviar-reserva-express`).
    2.  **Pago**: Webhook (`/api/flow-confirmation`) notifica solo el pago (el sistema detecta que es flujo de código y evita duplicar la logística).
*   **Tracking**: La conversión se dispara en `FlowReturn.jsx` usando los parámetros `amount` y `d`.

#### C. Consultar Reserva / Pagos Pendientes
*   **Ruta**: #consultar-reserva → Ver Estado → Pagar Saldo → `FlowReturn.jsx`.
*   **Notificaciones**: Solo notificación de pago (Financiera).
*   **Tracking**: Conversión en `FlowReturn.jsx` con monto del abono o saldo pagado.

#### 🛠️ Directrices Técnicas Generales

1.  **Regla de Oro: Dirección Específica Única**:
    - **Principio**: Existe UN SOLO campo de ubicación preciso para la logística (`direccionEspecifica`), que corresponde al punto que **NO** es el aeropuerto.
    - **Frontend**: El cliente completa un solo campo "Dirección Específica *" (anteriormente `hotel`).
    - **Backend**: El sistema determina inteligentemente si esta dirección corresponde a la *Recogida* (viajes AL aeropuerto) o *Llegada* (viajes DESDE el aeropuerto).
    - **Notificación Conductor**: El correo debe mostrar SOLO:
        - Origen (Referencia general)
        - Destino (Referencia general)
        - **Dirección Específica** (El dato exacto para GPS)
    - **Evitar Redundancia**: No enviar `direccionRecogida`, `hotel` y `destino` por separado si representan lo mismo.

2.  **Google Ads (Conversiones Avanzadas)**:
    - **Backend**: El endpoint de redirección (`/api/payment-result`) siempre debe inyectar el parámetro `d` en la URL de retorno. Este parámetro es un JSON Base64 con `{email, nombre, telefono}`.
    - **Frontend**: El tag de conversión `gtag` debe incluir siempre `email`, `phone_number` y `address` (mapeado desde el nombre) para mejorar la precisión de Google Ads.
3.  **Protección de Duplicados**: Usar siempre `sessionStorage` con una clave única (`flow_conversion_[transactionId]`) antes de disparar `gtag` para evitar conversiones dobles en recargas de página.
4.  **Campo Maestro de Dirección**: El campo `hotel` en la base de datos es el contenedor para direcciones precisas capturadas por Google Maps. Nunca usar campos de texto simple para direcciones finales si el componente permite el autocomplete.
5.  **PHP Integration**: Los scripts de Hostinger esperan `hotel`, `idaVuelta`, `fechaRegreso` y `horaRegreso` para una operación fluida. Asegurar que el backend siempre los propague en los payloads de `axios`.

#### 🔧 Implementación de Validación y Mapeo de Direcciones

**Actualización: 2 Enero 2026**

Se implementó validación obligatoria y mapeo inteligente de direcciones en ambos flujos principales:

**Flujo A (Express)**:
- **Frontend** (`CompletarDetalles.jsx` líneas 161-166): Validación antes de enviar formulario.
- **Backend** (`/completar-reserva-detalles` línea 3614): Retorna HTTP 400 si falta dirección.
- **Guardado**: Directo al campo `hotel` con `.trim()` para limpiar espacios.

**Flujo B (Pagar con Código)**:
- **Frontend** (`PagarConCodigo.jsx` líneas 196-212): Validación condicional según sentido del viaje.
- **Backend** (`/enviar-reserva-express` líneas 2793-2815): Lógica inteligente de mapeo:
  ```javascript
  // Determina automáticamente la dirección específica
  if (origenEsAeropuerto && direccionDestinoCliente) {
      direccionEspecifica = direccionDestinoCliente; // Viaje DESDE aeropuerto
  } else if (destinoEsAeropuerto && direccionOrigenCliente) {
      direccionEspecifica = direccionOrigenCliente; // Viaje HACIA aeropuerto
  }
  ```
- **Guardado**: Mapeo inteligente al campo `hotel` según sentido del viaje.

**Resultado**: Ambos flujos garantizan que el campo `hotel` (Dirección Específica) esté siempre poblado antes de confirmar una reserva, cumpliendo con la "Regla de Oro".

### 5.7 Sistema de Estadísticas Financieras

El panel de estadísticas (`AdminEstadisticas.jsx`) proporciona métricas clave para la toma de decisiones operativas y financieras.

#### Principio Fundamental: Solo Reservas Completadas

**Desde Diciembre 2025**, el sistema filtra **únicamente reservas con estado `completada`** en todos los cálculos estadísticos. Esto garantiza que:

- Los ingresos reflejen dinero realmente recibido
- Los gastos correspondan a servicios ejecutados
- La utilidad sea precisa y accionable

#### Implementación Técnica

**Backend** (`server-db.js`):
- Endpoints modificados: `/api/estadisticas/conductores`, `/api/estadisticas/vehiculos`, `/api/estadisticas/conductores/:id`
- Filtro aplicado: `{ estado: "completada" }` en todas las consultas de reservas
- Líneas clave: 7587-7590, 7714-7717, 7953-7956

```javascript
const whereReservas =
    (fechaInicio || fechaFin)
        ? { fecha: filtroReservas, estado: "completada" }
        : { estado: "completada" };
```

**Frontend** (`AdminEstadisticas.jsx`):
- No requiere cambios, consume los datos filtrados del backend
- Cálculo de totales: `calcularTotales()` suma métricas de conductores/vehículos
- Visualización: Cards con Total Reservas, Total Ingresos, Total Gastos, Utilidad

#### Métricas Disponibles

| Vista | Métricas |
|-------|----------|
| **Conductores** | Reservas completadas, ingresos, gastos, pagos al conductor, utilidad |
| **Vehículos** | Reservas completadas, ingresos, gastos de combustible, mantenimiento, utilidad |
| **Gastos** | Total por período, registros, desglose por tipo (combustible, peajes, etc.) |

#### Filtros Temporales

- Últimos 15 días
- Últimos 30 días (predeterminado)
- Mes actual
- Mes pasado
- Todo el historial
- Rango personalizado

> [!IMPORTANT]
> **Cambio de Comportamiento**: Antes de Diciembre 2025, las estadísticas incluían todas las reservas (pendientes, canceladas, etc.), lo que inflaba los números. Ahora solo se consideran reservas cerradas para reflejar la realidad operativa.

### 5.8 Sistema de Reservas Ida y Vuelta (Tramos Separados)

**Implementado: Diciembre 2025**

Para resolver problemas de asignación de conductores distintos para la ida y la vuelta, y permitir cierres de caja parciales, se implementó un cambio estructural en cómo se manejan los viajes redondos.

#### Lógica de Negocio
Cuando un usuario (o admin) crea una reserva de tipo "Ida y Vuelta":
1.  **Backend**: El sistema intercepta la creación y genera **DOS** registros en la base de datos:
    - **Registro A (Ida)**: Contiene los datos del viaje de ida.
    - **Registro B (Vuelta)**: Contiene los datos de regreso (origen/destino invertidos).
2.  **Vinculación**: Ambos registros quedan unidos mediante los campos `tramoPadreId` y `tramoHijoId`.
3.  **División de Costos**: El precio total y los abonos se dividen **50/50** entre ambos tramos. 
    - *Ejemplo*: Reserva de $40.000. Se crean dos reservas de $20.000 cada una.
4.  **Independencia Operativa**:
    - Cada tramo puede tener su propio **Conductor** y **Vehículo**.
    - Cada tramo puede tener su propio estado de pago y estado de ejecución (`Confirmada` vs `Completada`).

#### Impacto en Panel Admin (`AdminReservas`)
- **Visualización**: Las reservas aparecen como filas separadas.
- **Identificadores**:
    - Badge **IDA** (Verde): Indica el primer tramo.
    - Badge **RETORNO** (Azul): Indica el segundo tramo.
- **Acciones**: Puede completar y cerrar la "Ida" (y registrar sus gastos) mientras la "Vuelta" permanece pendiente para días futuros.

> **Nota**: Las reservas antiguas (creadas antes de este cambio) mantienen el comportamiento "Legacy" (una sola fila para todo el viaje) y se identifican con el badge **IDA Y VUELTA**.

### 5.9 Optimización del Modal de Detalles de Reserva

**Implementado: 2 Enero 2026**

Para mejorar la experiencia de usuario en el panel administrativo, se optimizó el modal "Ver Detalles" de reservas para ocultar campos vacíos y concentrar la información relevante.

#### Problema Identificado
El modal mostraba todos los campos posibles, incluso cuando estaban vacíos (con guiones "-" o valores en $0). Esto dificultaba la lectura rápida de información importante, especialmente en reservas con datos mínimos.

#### Solución Implementada
Se implementó **renderizado condicional** en `AdminReservas.jsx` para mostrar solo campos con contenido real.

#### Campos Optimizados

**Detalles del Viaje:**
- `vehiculo`: Solo se muestra si está asignado

**Información Adicional:**
- Sección completa se oculta si todos los campos están vacíos
- `numeroVuelo`: Solo si tiene valor
- `hotel`: Solo si tiene valor
- `equipajeEspecial`: Solo si tiene valor
- `sillaInfantil`: Solo si es `true` (muestra "Sí")

**Información Financiera:**
- `descuentoBase`: Solo si > 0
- `descuentoPromocion`: Solo si > 0
- `descuentoRoundTrip`: Solo si > 0
- `descuentoOnline`: Solo si > 0
- `codigoDescuento`: Solo si tiene valor

**Estado y Pago:**
- `metodoPago`: Solo si tiene valor
- `referenciaPago`: Solo si tiene valor

**Información Técnica:**
- `ipAddress`: Solo si tiene valor

#### Implementación Técnica

**Archivo**: `src/components/AdminReservas.jsx`

**Patrón de Código**:
```jsx
// Para campos de texto/string
{selectedReserva.campo && (
  <div>
    <Label>Etiqueta</Label>
    <p>{selectedReserva.campo}</p>
  </div>
)}

// Para campos numéricos (descuentos)
{selectedReserva.descuento > 0 && (
  <div>
    <Label>Descuento</Label>
    <p>{formatCurrency(selectedReserva.descuento)}</p>
  </div>
)}

// Para secciones completas
{(campo1 || campo2 || campo3) && (
  <div>
    <h3>Sección</h3>
    {/* Campos individuales con sus propias condiciones */}
  </div>
)}
```

**Líneas Modificadas**: 3173-3178, 3303-3348, 3354-3393, 3448-3455, 3477-3495, 3535-3540

#### Beneficios
- ✅ **Claridad Visual**: Solo información relevante
- ✅ **Lectura Rápida**: Menos scroll, más concentración
- ✅ **Profesionalismo**: Interfaz limpia y ordenada
- ✅ **Mantenibilidad**: Patrón claro para futuros campos

> [!TIP]
> **Para Futuros Desarrolladores**: Si agregas nuevos campos al modal de detalles, sigue el patrón de renderizado condicional mostrado arriba. Pregúntate: "¿Este campo puede estar vacío o en 0?" Si la respuesta es sí, envuélvelo en una condición.

### 5.10 Sistema de Descuentos Personalizados

**Implementado: Enero 2026**

El sistema permite configurar descuentos adicionales por tramo/destino con restricciones específicas de días y horarios. Estos descuentos se **suman** a los descuentos globales (online, ida y vuelta, promociones) en el cálculo del precio final.

#### Características Principales

- **Múltiples descuentos simultáneos**: Se pueden configurar varios descuentos personalizados que se suman entre sí
- **Aplicación por tramo**: Los descuentos se calculan sobre el precio de cada tramo individual
- **Duplicación automática**: En viajes ida y vuelta, el descuento se aplica a ambos tramos
- **Activación/desactivación**: Cada descuento puede activarse o desactivarse sin eliminarlo
- **Restricciones opcionales**: Por días de la semana y rangos horarios

#### Flujo de Datos Completo

**1. Almacenamiento (Backend)**

**Archivo**: [`backend/server-db.js`](file:///c:/Users/widom/Documents/web}/transportes-araucaria/backend/server-db.js)  
**Líneas**: 1114, 1130-1137, 1319-1335

Los descuentos se almacenan en la tabla `DescuentoGlobal` con `tipo: "descuentoPersonalizado"`.

```javascript
// Formateo para envío al frontend
descuentosFormatted.descuentosPersonalizados = [];

descuentosGlobales.forEach((descuento) => {
  if (descuento.tipo === "descuentoPersonalizado") {
    descuentosFormatted.descuentosPersonalizados.push({
      nombre: descuento.nombre,
      valor: descuento.valor,        // Porcentaje (ej: 10 = 10%)
      activo: descuento.activo,      // Boolean
      descripcion: descuento.descripcion,
    });
  }
});
```

**Endpoint**: `GET /pricing` retorna los descuentos en `descuentosGlobales.descuentosPersonalizados`

**2. Cálculo del Porcentaje Total (Frontend)**

**Archivo**: [`src/App.jsx`](file:///c:/Users/widom/Documents/web}/transportes-araucaria/src/App.jsx)  
**Líneas**: 1002-1006

```javascript
// Suma todos los descuentos personalizados activos
const personalizedDiscountRate =
  descuentosGlobales?.descuentosPersonalizados
    ?.filter((desc) => desc.activo && desc.valor > 0)
    .reduce((sum, desc) => sum + desc.valor / 100, 0) || 0;
```

**Ejemplo**: Si hay descuentos de 10% y 5% activos → `personalizedDiscountRate = 0.15`

**3. Aplicación al Precio por Tramo**

**Archivo**: [`src/App.jsx`](file:///c:/Users/widom/Documents/web}/transportes-araucaria/src/App.jsx)  
**Líneas**: 1308-1314

```javascript
// Calcular descuento sobre precio de un tramo
const descuentosPersonalizadosPorTramo = Math.round(
  precioIda * personalizedDiscountRate
);

// Duplicar si es ida y vuelta
const descuentosPersonalizados = formData.idaVuelta
  ? descuentosPersonalizadosPorTramo * 2
  : descuentosPersonalizadosPorTramo;
```

**4. Inclusión en el Total Final**

**Archivo**: [`src/App.jsx`](file:///c:/Users/widom/Documents/web}/transportes-araucaria/src/App.jsx)  
**Líneas**: 1360-1373

```javascript
// Suma de todos los descuentos
const descuentoTotalSinLimite =
  descuentoOnline +
  descuentoPromocion +
  descuentoRoundTrip +
  descuentosPersonalizados +  // ← Incluido aquí
  descuentoCodigo +
  descuentoRetornoUniversal;

// Límite máximo del 75% del precio base
const descuentoMaximo = Math.round(precioBase * 0.75);
const descuentoOnlineTotal = Math.min(descuentoTotalSinLimite, descuentoMaximo);

// Precio final
const totalConDescuento = Math.max(precioBase - descuentoOnlineTotal, 0) + costoSilla;
```

#### Visualización en la Interfaz

**Archivo**: [`src/components/Hero.jsx`](file:///c:/Users/widom/Documents/web}/transportes-araucaria/src/components/Hero.jsx)

Los descuentos personalizados se muestran en 3 ubicaciones:

1. **Texto principal** (líneas 669-672): Descripción en el hero
2. **Módulo de reserva** (líneas 759-764): Texto destacado en el formulario
3. **Badge visual** (líneas 803-810): Etiqueta morada "Especial +X%"

```jsx
{personalizedDiscountPercentage > 0 && (
  <Badge variant="default" className="bg-purple-500">
    Especial +{personalizedDiscountPercentage}%
  </Badge>
)}
```

#### Ejemplo de Cálculo Completo

```
Escenario: Viaje ida y vuelta, Temuco → Aeropuerto
Precio base por tramo: $30,000
Descuentos configurados:
  - Online: 5%
  - Personalizado 1 (Temuco): 10%
  - Ida y vuelta: 10%

Cálculo:
  Precio base total (ida + vuelta): $60,000
  
  Descuentos por tramo:
    - Online (5% × $30,000 × 2): -$3,000
    - Personalizado (10% × $30,000 × 2): -$6,000
  
  Descuentos sobre total:
    - Ida y vuelta (10% × $60,000): -$6,000
  
  Total descuentos: $15,000 (25% del total)
  Precio final: $45,000
```

#### Gestión en Panel Admin

**Componente**: [`AdminPricing.jsx`](file:///c:/Users/widom/Documents/web}/transportes-araucaria/src/components/AdminPricing.jsx)

**Funciones clave**:
- `addDescuentoPersonalizado()` (línea 477): Agregar nuevo descuento
- `handleDescuentoPersonalizadoChange()` (línea 497): Editar descuento
- `toggleDescuentoPersonalizado()` (línea 531): Activar/desactivar
- `removeDescuentoPersonalizado()` (línea 518): Eliminar descuento

**Campos configurables**:
- `nombre`: Identificador del descuento
- `valor`: Porcentaje (número entero, ej: 10 = 10%)
- `activo`: Estado del descuento (boolean)
- `descripcion`: Información adicional (opcional)

> [!IMPORTANT]
> **Límite de Descuentos**: El sistema aplica un límite máximo del **75%** sobre el precio base para evitar precios negativos o excesivamente bajos. Este límite se aplica a la suma de TODOS los descuentos (online + promociones + personalizados + códigos).

> [!TIP]
> **Debugging**: Para verificar que los descuentos se aplican correctamente, descomentar las líneas de debug en `App.jsx` (1391-1414) que muestran el desglose completo de descuentos en la consola del navegador.

#### Referencias de Código

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `backend/server-db.js` | 1114, 1130-1137 | Formateo y envío de descuentos al frontend |
| `backend/server-db.js` | 1319-1335 | Guardado de descuentos en base de datos |
| `backend/models/DescuentoGlobal.js` | 16 | Definición del tipo "descuentoPersonalizado" |
| `src/App.jsx` | 1002-1006 | Cálculo del porcentaje total de descuentos personalizados |
| `src/App.jsx` | 1308-1314 | Aplicación al precio por tramo |
| `src/App.jsx` | 1360-1373 | Suma en el descuento total final |
| `src/components/Hero.jsx` | 529-531, 669-672, 759-764, 803-810 | Visualización en interfaz de usuario |
| `src/components/AdminPricing.jsx` | 476-540, 1096-1114 | Gestión en panel administrativo |




### 5.11 Ajuste de Umbrales de Pasajeros por Tipo de Vehículo

**Implementado: 7 Enero 2026**

Para optimizar la comodidad de los pasajeros y garantizar espacio adecuado para equipaje, se ajustaron los umbrales de asignación automática de vehículos.

#### Problema Identificado

Con la configuración anterior (Auto Privado para 1-4 pasajeros), se detectó que:
- **4 pasajeros en sedán**: Espacio muy limitado para pasajeros
- **Equipaje insuficiente**: La cajuela de un sedán no puede acomodar adecuadamente el equipaje de 4 personas
- **Experiencia degradada**: Los clientes viajan incómodos

#### Solución Implementada

Se modificó el umbral para aplicar un **salto exponencial en el 4to pasajero**, enviándolo directamente a la categoría Van:

**Nueva Configuración:**
- **Auto Privado (Sedán)**: 1-3 pasajeros
- **Van de Pasajeros**: 4-7 pasajeros

#### Ajuste de Precios

Para mantener la coherencia financiera, se ajustó el cálculo de precios de Van:

**Antes:**
```javascript
// Van comenzaba en 5 pasajeros
const pasajerosAdicionales = numPasajeros - 5;
// 5 pax = base, 6 pax = base + 5%, 7 pax = base + 10%
```

**Después:**
```javascript
// Van comienza en 4 pasajeros
const pasajerosAdicionales = numPasajeros - 4;
// 4 pax = base, 5 pax = base + 5%, 6 pax = base + 10%, 7 pax = base + 15%
```

#### Ejemplo de Precios

Asumiendo precio base van de $50,000 con incremento del 5%:

| Pasajeros | Cálculo | Precio Final |
|-----------|---------|--------------|
| 4 pax | $50,000 (base) | **$50,000** |
| 5 pax | $50,000 + (1 × $2,500) | **$52,500** |
| 6 pax | $50,000 + (2 × $2,500) | **$55,000** |
| 7 pax | $50,000 + (3 × $2,500) | **$57,500** |

#### Beneficios

✅ **Comodidad real**: Hasta 3 pasajeros viajan cómodamente en sedán  
✅ **Espacio para equipaje**: La cajuela puede acomodar el equipaje de 3 personas  
✅ **Salto lógico**: El 4to pasajero justifica el costo de una van  
✅ **Mejor experiencia**: Los clientes no viajan apretados  
✅ **Precio justo**: El precio base van cubre el costo operativo del vehículo más grande

#### Implementación Técnica

**Archivo**: [`src/App.jsx`](file:///c:/Users/widom/Documents/web}/transportes-araucaria/src/App.jsx)  
**Líneas modificadas**: 1061, 1079, 1087-1088

```javascript
// Línea 1061: Cambio de umbral para Auto
if (numPasajeros > 0 && numPasajeros <= 3) {  // Antes: <= 4
    vehiculoAsignado = "Auto Privado";
    // ... cálculo de precio
}

// Línea 1079: Cambio de umbral para Van
else if (numPasajeros >= 4 && numPasajeros <= destinoInfo.maxPasajeros) {  // Antes: >= 5
    vehiculoAsignado = "Van de Pasajeros";
    
    // Línea 1088: Ajuste de cálculo de pasajeros adicionales
    const pasajerosAdicionales = numPasajeros - 4;  // Antes: - 5
    // ... cálculo de precio
}
```

> [!IMPORTANT]
> **Impacto en Operaciones**: Este cambio afecta directamente la asignación automática de vehículos. Asegúrate de que el precio base de Van esté configurado adecuadamente en el panel de administración para reflejar el costo real de operar vehículos más grandes.

> [!TIP]
> **Configuración Recomendada**: El precio base de Van debería ser aproximadamente 1.5x - 1.7x el precio base de Auto para reflejar los costos operativos adicionales (combustible, mantenimiento, seguro).


### 5.12 Solución de UI/UX Crítica: Modal de Intercepción y Stacking Contexts


**Documentado: 3 Enero 2026**

Esta sección documenta la solución técnica definitiva aplicada al problema recurrente de visualización del "Modal de WhatsApp" en dispositivos de escritorio y móviles con pantallas pequeñas.

#### Problema Identificado
El modal de intercepción (que aparece al intentar ir a WhatsApp) presentaba dos fallos críticos:
1.  **Corte Superior (Clipping)**: En pantallas con poca altura (laptops), la parte superior del modal desaparecía y no era accesible mediante scroll.
2.  **Visualización Errática**: El modal se movía o cortaba inesperadamente dependiendo del scroll de la página.

#### Causa Raíz Técnica
El problema se debía a un conflicto de **Stacking Context (Contexto de Apilamiento)** en CSS:
- El componente modal estaba anidado dentro de `<motion.header>` en `Header.jsx`.
- `<motion.header>` aplica propiedades de transformación (`transform: translateY(...)`) para animar la entrada.
- **Regla CSS Crítica**: Todo elemento con `position: fixed` que sea hijo de un elemento con `transform`, deja de comportarse como fijo respecto al viewport y pasa a comportarse como `absolute` respecto al padre transformado.
- Esto "atrapaba" el modal dentro de las dimensiones del header, causando cortes y mal posicionamiento.

#### Solución Implementada (Patrón de Referencia)

Para evitar este problema en el futuro, se establecen las siguientes reglas de implementación para Modales:

1.  **Arquitectura de Componentes**:
    - **Nunca anidar modales dentro de componentes animados** (como navbars, headers, o cards con motion).
    - Mover el componente modal al nivel más alto posible del árbol DOM, preferiblemente como hermano directo de los contenedores principales, o usar `React Portals` (`createPortal`) para renderizarlos directamente en `document.body`.
    - En este caso, se movió `<WhatsAppInterceptModal />` fuera de `<motion.header>` en `Header.jsx`.

2.  **Layout "Safe Scroll" (Prueba de Fallos)**:
    Se reemplazó el centrado CSS tradicional por una estructura que garantiza scroll si el contenido excede la altura de la pantalla (Tailwind UI Pattern):
    
    ```jsx
    {/* 1. Contenedor Padre fijo al viewport con scroll habilitado */}
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      
      {/* 2. Contenedor Flex con altura mínima garantizada */}
      <div className="flex min-h-full items-center justify-center p-4">
        
        {/* 3. El Modal en sí (sin margin auto fijos que bloqueen scroll) */}
        <div className="relative bg-white rounded-xl ...">
          {/* Contenido */}
        </div>
      </div>
    </div>
    ```

3.  **Colores Robustos**:
    - Se eliminó la dependencia de variables CSS (`bg-primary`) que fallaban en ciertos contextos.
    - Se usan códigos hexadecimales explícitos (`#6B4423`) para elementos críticos de marca como el header del modal.

4.  **Tracking Unificado**:
    - Se replicó el script de conversión de Google Ads (`gtag('event', 'conversion', ...)` con ID `AW-17529712870...`) en el botón "Continuar a WhatsApp" del modal.
    - Esto asegura que la conversión se registre idénticamente si el usuario clickea en el header o pasa por el modal.

---


## 6. Mantenimiento y Despliegue

### Frontend
- Build: `npm run build`
- Output: `dist/`
- Despliegue: Automático (o manual vía subida de `dist/` a hosting estático/Hostinger).

### Backend (Render)
- Repositorio conectado a Render.com.
- Despliegue automático al push en `main`.
- **Nota**: El servicio spinning down (dormir) en capa gratuita causa delays iniciales.

### Archivos Legacy
La documentación antigua se ha archivado en `docs/legacy/` para referencia histórica. Consultar esa carpeta si se busca información muy específica sobre versiones anteriores (v1) o logs de cambios detallados.

---

## 7. Solución de Problemas (Troubleshooting)

Se ha compilado una guía específica para resolver problemas recurrentes como:
- **Backend 500**: Errores de ruta o base de datos.
- **Migraciones**: Cómo aplicar cambios de tabla de forma manual. **IMPORTANTE**: Revisar `backend/MIGRATION_README.md` antes de crear nuevas migraciones para evitar errores de conexión.
- **Autenticación**: Solución al bloqueo de edición.

👉 **Ver Guía Completa**: [GUIA_SOLUCION_PROBLEMAS.md](./GUIA_SOLUCION_PROBLEMAS.md)

---

## 8. Anexos Históricos

Para consultar bitácoras de cambios específicas o guías visuales antiguas, revisar la carpeta `docs/legacy`. Archivos notables movidos allí:
- `GUIA_USUARIO_PANEL_ADMIN_V2.md`
- `ARQUITECTURA_PANEL_ADMIN.md`
- `INTEGRACION_EMAILS_PHP.md`
- `LOGS_CORRECCIONES.md`

---
**Transportes Araucaria - Documentación Unificada**
