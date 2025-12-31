# 📘 Documentación Maestra - Transportes Araucaria

> **Última Actualización**: 31 Diciembre 2025
> **Versión**: 1.1

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
   - Configuración independiente para **Autos** (1-4 pasajeros) y **Vans** (5-7 pasajeros).
   - Valores en formato decimal: `0.10` = 10% de incremento.
   - **Fórmula Auto**: `Precio Final = Base + (Pasajeros - 1) × (Base × % Adicional)`
   - **Fórmula Van**: `Precio Final = Base + (Pasajeros - 5) × (Base × % Adicional)`
   - Ejemplo: Auto $30,000 con 10% adicional → 2 pax = $33,000, 3 pax = $36,000
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
*   **Captura de Dirección**: Obligatorio usar `AddressAutocomplete` en el campo `hotel` dentro de `CompletarDetalles.jsx`.
*   **Notificaciones**:
    1.  **Pago**: Webhook (`/api/flow-confirmation`) notifica el dinero recibido (Admin + Cliente).
    2.  **Logística**: Al guardar detalles en `PUT /completar-reserva-detalles`, se dispara la notificación logística (Admin + Cliente).
*   **Tracking**: La conversión se dispara en `App.jsx` al retornar de Flow, usando los parámetros `amount` y `d` (datos de usuario encriptados).

#### B. Pagar con Código
*   **Ruta**: Usuario ingresa código → Cotización + Detalles upfront → Pago → `FlowReturn.jsx`.
*   **Captura de Dirección**: Obligatorio usar `AddressAutocomplete` en el formulario inicial de `PagarConCodigo.jsx`.
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
