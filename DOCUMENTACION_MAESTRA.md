# ðŸ“˜ DocumentaciÃ³n Maestra - Transportes Araucaria

> **Ãšltima ActualizaciÃ³n**: 16 Abril 2026
> **VersiÃ³n**: 2.1

Este documento centraliza toda la informaciÃ³n tÃ©cnica, operativa y de usuario para el proyecto **Transportes Araucaria**. Reemplaza a la documentaciÃ³n fragmentada anterior.

---

## ðŸ“‘ Ãndice

1. [VisiÃ³n General del Proyecto](#1-visiÃ³n-general-del-proyecto)
2. [GuÃ­a para Desarrolladores](#2-guÃ­a-para-desarrolladores)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Manual de Usuario (Panel Admin)](#4-manual-de-usuario-panel-admin)
5. [Sistemas TÃ©cnicos Detallados](#5-sistemas-tÃ©cnicos-detallados)
   - [AutenticaciÃ³n](#51-sistema-de-autenticaciÃ³n)
   - [Pagos y Finanzas](#52-pagos-y-finanzas)
   - [Notificaciones](#53-notificaciones-via-email)
   - [Integraciones Externas](#54-integraciones-externas)
   - [LÃ³gica de Disponibilidad y AnticipaciÃ³n](#55-lÃ³gica-de-disponibilidad-y-anticipaciÃ³n)
   - [EstÃ¡ndares de Flujos de Pago](#56-estÃ¡ndares-de-flujos-de-pago-y-notificaciones)
   - [CÃ¡lculo de Precios DinÃ¡micos](#57-lÃ³gica-de-precios-y-descuentos)
   - [Sistema de Bloqueos de Fecha](#58-sistema-de-bloqueos-de-fecha)
   - [GestiÃ³n de Clientes Frecuentes](#59-gestiÃ³n-de-clientes-frecuentes)
   - [Descuentos Personalizados](#510-sistema-de-descuentos-personalizados)
   - [Ajuste de Umbrales de Pasajeros](#511-ajuste-de-umbrales-de-pasajeros-por-tipo-de-vehÃ­culo)
   - [SoluciÃ³n UI/UX Modal](#512-soluciÃ³n-de-uiux-crÃ­tica-modal-de-intercepciÃ³n-y-stacking-contexts)
   - [Sistema de Migraciones](#513-sistema-de-migraciones-de-base-de-datos)
   - [Historial de Transacciones](#514-sistema-de-historial-de-transacciones-flow)
   - [GestiÃ³n de Vencimiento de CÃ³digos](#515-sistema-de-vencimiento-y-tiempos-restantes-en-cÃ³digos-de-pago)
   - [Sistema de ActualizaciÃ³n Unificada (Bulk Update)](#516-sistema-de-actualizaciÃ³n-unificada-bulk-update)
   - [Sistema de Oportunidades de Traslado](#517-sistema-de-oportunidades-de-traslado)
   - [Sistema de Banners Promocionales](#518-sistema-de-banners-promocionales)
   - [Sistema de Seguimiento de Conversiones (Google Ads)](#519-sistema-de-seguimiento-de-conversiones-google-ads)
   - [Mejoras en la GestiÃ³n y VisualizaciÃ³n de Reservas (Panel Admin)](#520-mejoras-en-la-gestiÃ³n-y-visualizaciÃ³n-de-reservas-panel-admin)
   - [Sistema de AuditorÃ­a y Logs](#521-sistema-de-auditorÃ­a-y-logs-adminauditlog)
   - [Sistema de RecuperaciÃ³n de Detalles Incompletos](#522-sistema-de-recuperaciÃ³n-de-detalles-incompletos)
   - [Sistema de RecuperaciÃ³n de Leads Abandonados (HeroExpress)](#523-sistema-de-recuperaciÃ³n-de-leads-abandonados-heroexpress)
   - [Sistema de Persistencia y Robustez de Pagos](#524-sistema-de-persistencia-y-robustez-de-pagos)
   - [Almacenamiento Persistente de ImÃ¡genes (Cloudinary)](#525-almacenamiento-persistente-de-imÃ¡genes-cloudinary)
   - [Estrategia de Logs en Render](#526-estrategia-de-logs-en-render)
   - [IntegraciÃ³n Mercado Pago Checkout Pro](#527-integraciÃ³n-mercado-pago-checkout-pro)

- [ConfiguraciÃ³n DinÃ¡mica de Pasarelas y Logos](#528-configuraciÃ³n-dinÃ¡mica-de-pasarelas-y-logos-flowmercado-pago)
- [MÃ³dulo Aeropuerto-Hoteles](#529-mÃ³dulo-aeropuerto-hoteles-con-reserva-y-admin-dedicados)

6. [Mantenimiento y Despliegue](#6-mantenimiento-y-despliegue)
   - [Acceso SSH a Hostinger](#61-acceso-ssh-a-hostinger-hosting-compartido)
7. [SoluciÃ³n de Problemas (Troubleshooting)](#7-soluciÃ³n-de-problemas-troubleshooting)
8. [Anexos HistÃ³ricos](#8-anexos-histÃ³ricos)

---

## 1. VisiÃ³n General del Proyecto

### DescripciÃ³n

PÃ¡gina web profesional y sistema de gestiÃ³n para **Transportes Araucaria**, especializada en traslados desde el Aeropuerto de La AraucanÃ­a. El sistema incluye un frontend pÃºblico para captaciÃ³n de leads/reservas y un panel administrativo completo para la gestiÃ³n del negocio.

### TecnologÃ­as Clave

- **Frontend**: React 18, Vite, Tailwind CSS, Shadcn/UI.
- **Backend**: Node.js + Express (hospedado en **Render.com**).
- **Base de Datos**: MySQL (vÃ­a Sequelize).
- **Infraestructura Legacy**: Scripts PHP para emails (hospedados en **Hostinger**).

---

## 2. GuÃ­a para Desarrolladores

### Setup Local

1. **Requisitos**: Node.js 18+, npm.
2. **InstalaciÃ³n**:
   ```bash
   npm install
   ```
3. **Desarrollo**:
   ```bash
   npm run dev
   ```
   _Nota: El frontend local (puerto 5173) se conecta al backend de producciÃ³n en Render por defecto, salvo configuraciÃ³n contraria en `.env.local`._

### Variables de Entorno (`.env.local`)

```env
VITE_API_URL=https://transportes-araucaria.onrender.com
# Para desarrollo backend local:
# VITE_API_URL=http://localhost:3001
```

### Sistema de diseÃ±o frontend: shadcn/ui + Tailwind v4

- El frontend usa **shadcn/ui** con estilo `new-york`, React 18 en JSX y **Tailwind CSS v4**.
- La configuraciÃ³n base de shadcn vive en `components.json` y apunta a `src/App.css` como archivo CSS principal.
- Los componentes generados por shadcn deben mantenerse en `src/components/ui/` y la lÃ³gica de negocio debe componerse fuera de esa carpeta, en wrappers o componentes del dominio.
- Los tokens visuales del proyecto se definen en `src/App.css` mediante `@theme inline {}`. Para nuevas interfaces se deben priorizar tokens semÃ¡nticos como `bg-primary`, `bg-secondary`, `bg-accent`, `text-foreground` y `border-border`.
- El proyecto tiene operativo el registry `@shadcn` vÃ­a MCP. Antes de agregar una pieza nueva, se debe revisar si ya existe un componente equivalente en `src/components/ui/` y luego consultar el registry para ejemplos o instalaciÃ³n.
- Los alias `chocolate-*` se mantienen solo por compatibilidad con mÃ³dulos legacy. El sistema visual actual prioriza la paleta `forest` + `cafe`.

### Reglas de ContribuciÃ³n (`AGENTS.md`)

- **Idioma**: Todo en EspaÃ±ol (cÃ³digo, commits, docs).
- **Archivos Protegidos**: No modificar archivos en `.github/` sin autorizaciÃ³n.
- **PHP**: Los archivos PHP en Hostinger se despliegan **manualmente**. No sobrescribir lÃ³gica de correos sin verificar `INTEGRACION_EMAILS_PHP.md`.

### Sistema de DocumentaciÃ³n

**Documentos Maestros Oficiales:**

- **`DOCUMENTACION_MAESTRA.md`**: Funcionalidades, arquitectura, flujos de usuario y sistemas tÃ©cnicos
- **`GUIA_SOLUCION_PROBLEMAS.md`**: Troubleshooting, errores recurrentes y sus soluciones

**Workflow de DocumentaciÃ³n:**
El proyecto incluye el workflow `/documentacion` que debe ejecutarse despuÃ©s de:

- Resolver un bug complejo
- Implementar una nueva funcionalidad mayor
- Modificar la arquitectura del sistema
- Detectar que la documentaciÃ³n estÃ¡ desactualizada

**Reglas CrÃ­ticas para Agentes:**

1. **SIEMPRE consultar** `DOCUMENTACION_MAESTRA.md` y `GUIA_SOLUCION_PROBLEMAS.md` antes de intervenir el proyecto
2. Si el problema ya estÃ¡ documentado en `GUIA_SOLUCION_PROBLEMAS.md`, seguir la soluciÃ³n establecida
3. DespuÃ©s de resolver un problema nuevo, actualizar la documentaciÃ³n usando `/documentacion`
4. **No crear documentos nuevos** innecesarios, editar y completar los existentes

> [!IMPORTANT]
> **Para Agentes IA**: La documentaciÃ³n contiene soluciones a problemas recurrentes. Consultarla antes de actuar evita errores iterativos y mantiene la consistencia del proyecto.

---

## 3. Arquitectura del Sistema

### Estructura del Panel Administrativo

El panel ha sido rediseÃ±ado (v2.0) para optimizar la operaciÃ³n:

- **Dashboard**: KPIs en tiempo real (Ingresos, OcupaciÃ³n, Reservas Hoy).
- **Operaciones**:
  - `AdminReservas`: GestiÃ³n central, vista calendario.
  - `AdminVehiculos` / `AdminConductores`: GestiÃ³n de flota y personal.
- **Finanzas**:
  - Control de gastos asociados a reservas.
  - **EstadÃ­sticas**: Panel de mÃ©tricas financieras y operativas.
    - **Filtrado Inteligente**: Las estadÃ­sticas consideran **Ãºnicamente reservas completadas** para reflejar la realidad financiera.
    - **MÃ©tricas Disponibles**: Total de reservas, ingresos, gastos y utilidad neta.
    - **Filtros Temporales**: Ãšltimos 15/30 dÃ­as, mes actual, mes pasado, todo el historial o rango personalizado.
    - **Vistas**: Por conductor, por vehÃ­culo, por tipo de gasto.
  - CÃ³digos de pago para facilitar cobros.
- **ConfiguraciÃ³n**: Tarifas base, precios dinÃ¡micos, festivos y bloqueos.
- **Marketing**: GestiÃ³n de cÃ³digos de descuento.

### Diagrama de Flujo de Datos

```mermaid
graph TD
    A[Cliente Web] -->|Reserva| B[Backend API (Render)]
    B -->|Persistencia| C[PostgreSQL]
    B -->|Webhook/Post| D[Script PHP (Hostinger)]
    D -->|SMTP| E[Email NotificaciÃ³n]
    A -->|Pago| F[Flow / Webpay]
    F -->|ConfirmaciÃ³n| B
```

---

## 4. Manual de Usuario (Panel Admin)

### Acceso

- **URL**: `/admin`
- **Credenciales**: Gestionadas por SuperAdmin.

### Funcionalidades Clave

1. **Crear Reserva**:
   - BotÃ³n "Nueva Reserva".
   - Autocompletado de clientes frecuentes.
   - CÃ¡lculo automÃ¡tico de tarifa (incluyendo reglas dinÃ¡micas).
2. **Gestionar Estados**:
   - Estados: `Pendiente` -> `Confirmada` -> `Completada`.
   - Pagos: Registro de abonos o pagos completos.
3. **Calendario de PlanificaciÃ³n**:
   - Vista visual de ocupaciÃ³n de vehÃ­culos.
   - Alertas de conflictos de horario.
4. **ConfiguraciÃ³n de Precios por Pasajero**:
   - GestiÃ³n de **porcentaje adicional** por cada pasajero extra.
   - ConfiguraciÃ³n independiente para **Autos** (1-3 pasajeros) y **Vans** (4-7 pasajeros).
   - Valores en formato decimal: `0.10` = 10% de incremento.
   - **FÃ³rmula Auto**: `Precio Final = Base + (Pasajeros - 1) Ã— (Base Ã— % Adicional)`
   - **FÃ³rmula Van**: `Precio Final = Base + (Pasajeros - 4) Ã— (Base Ã— % Adicional)`
   - Ejemplo Auto: $30,000 con 10% adicional â†’ 2 pax = $33,000, 3 pax = $36,000
   - Ejemplo Van: $50,000 con 5% adicional â†’ 4 pax = $50,000, 5 pax = $52,500, 6 pax = $55,000
5. **GestiÃ³n de VehÃ­culos de Alta Capacidad (Vans)**:
   - **Soporte extendido**: El sistema permite reservas de hasta 7 pasajeros.
   - **Requisito de Flota**: Para aceptar reservas de 5-7 pasajeros, debe existir un vehÃ­culo tipo "Van" con capacidad 7 en `AdminVehiculos`.
   - **AsignaciÃ³n Manual Segura**: El sistema filtra automÃ¡ticamente los vehÃ­culos en el momento de la asignaciÃ³n, mostrando solo aquellos con capacidad suficiente para el grupo (ej: al asignar una reserva de 6 pax, solo se mostrarÃ¡n Vans, ocultando los autos pequeÃ±os).
   - **Fallback a WhatsApp**: Si un cliente intenta reservar para 5-7 pasajeros y no hay Vans disponibles, el sistema le redirige automÃ¡ticamente a WhatsApp para gestiÃ³n manual.

### SoluciÃ³n de Problemas Comunes

- **Error de Carga**: Si el panel no carga datos, verificar conexiÃ³n a internet y estado de Render (puede "dormirse" en plan gratuito).
- **Emails no llegan**: Verificar carpeta SPAM y logs en `AdminEmails`.

---

## 5. Sistemas TÃ©cnicos Detallados

### 5.1 Sistema de AutenticaciÃ³n

Usa **JWT (JSON Web Tokens)**.

- El token se almacena en `localStorage`.
- ExpiraciÃ³n automÃ¡tica.
- Middleware en backend `authenticateToken` protege las rutas crÃ­ticas.

### 5.2 Pagos y Finanzas

- **IntegraciÃ³n Flow**: Para pagos con tarjetas chilenas.
- **CÃ³digos de Pago**: Sistema propio para generar links de pago Ãºnicos.
  - **Vencimiento Inteligente**: Los cÃ³digos se marcan automÃ¡ticamente como "vencido" al expirar.
  - **Feedback Visual**: Contadores de tiempo restante con alertas por colores segÃºn urgencia.
  - **AsociaciÃ³n Directa**: VinculaciÃ³n a reservas existentes para cobro de saldos.
- **ValidaciÃ³n de Datos**:
  - **Emails**: Se aplica sanitizaciÃ³n robusta (vÃ­a `sanitizarEmailRobusto`) y validaciÃ³n de formato Regex antes de cualquier interacciÃ³n con Flow para prevenir el error 1620.

### 5.3 Notificaciones vÃ­a Email

El sistema utiliza una arquitectura hÃ­brida:

1. **Backend Node** recibe la solicitud de envÃ­o.
2. **Backend Node** hace POST a script PHP en Hostinger.
3. **PHP** utiliza `PHPMailer` autenticado para el envÃ­o final.
   _Archivos Clave_: `enviar_asignacion_reserva.php` (Pasajero) y `enviar_notificacion_conductor.php` (Conductor).

#### 5.3.1 Notificaciones para Reservas de Tramos Vinculados (Ida y Vuelta)

**Implementado: Febrero 2026**

Para mejorar la claridad en reservas de ida y vuelta (donde la reserva se divide en dos registros independientes), se implementÃ³ una lÃ³gica de notificaciones con contexto:

1.  **Regla de NotificaciÃ³n**: Cada tramo se notifica de forma independiente en el momento de su asignaciÃ³n. Esto permite flexibilidad si no se conocen ambos conductores al mismo tiempo.
2.  **Contexto en el Correo de Vuelta**:
    - Si se asigna el tramo de **VUELTA** y el tramo de **IDA** ya tiene conductor/vehÃ­culo asignado, el correo al pasajero incluirÃ¡ automÃ¡ticamente una secciÃ³n de "âœˆï¸ Viaje de Ida (ya confirmado)" arriba del viaje actual.
    - Esto garantiza que el cliente tenga siempre a mano la informaciÃ³n completa del servicio unificado.
3.  **NotificaciÃ³n al Conductor**:
    - Si el **mismo conductor** es asignado a ambos tramos, recibirÃ¡ un correo unificado con los detalles de la ida y la vuelta.
    - El archivo `.ics` (calendario) adjunto contendrÃ¡ **dos eventos** (ida y vuelta) para facilitar su agendamiento.
    - Si son conductores distintos, cada uno recibe su notificaciÃ³n individual por el tramo que le corresponde.

### 5.4 Integraciones Externas

- **Google Ads**: Conversiones mejoradas implementadas en flujos de pago.
  - **Tracking Robusto**: El backend (`/api/payment-result`) inyecta el monto real de la transacciÃ³n en la URL de retorno, garantizando que el tag de conversiÃ³n (`gtag`) reciba el valor correcto incluso si falla la consulta de base de datos local.
- **Google Maps**: Autocomplete de direcciones mediante `AddressAutocomplete`, implementado con Places API (New) por HTTP para mantener control total del input en React y evitar inconsistencias del Web Component en ediciÃ³n y selecciÃ³n de direcciones. El valor persistido debe conservar el texto seleccionado por el usuario desde Google cuando represente un lugar o hotel, para que los enlaces enviados a conductor apunten al sitio correcto y no solo a la calle formateada.

### 5.5 LÃ³gica de Disponibilidad y AnticipaciÃ³n

### 5.5.1 Capacidad Extendida (Vans)

Se implementÃ³ soporte para hasta 7 pasajeros con una lÃ³gica de fallback hÃ­brida:

1.  **Backend (`/api/disponibilidad/verificar`)**:
    - Recibe `pasajeros` y filtra vehÃ­culos con `capacidad >= pasajeros`.
    - Retorna `disponible: false` si no encuentra vehÃ­culos adecuados en el horario.

2.  **Frontend (`Hero.jsx` / `HeroExpress.jsx`)**:
    - Consume el endpoint de verificaciÃ³n.
    - **LÃ³gica de Fallback**: Si el endpoint retorna `false` y el grupo es de 5-7 personas (Vans), se intercepta el bloqueo estÃ¡ndar y se muestra un componente `WhatsAppButton`.
    - Esto permite capturar leads de grupos grandes incluso sin disponibilidad automÃ¡tica configurada.

3.  **Componentes Reutilizables**:
    - `WhatsAppButton.jsx`: Centraliza la lÃ³gica de contacto + Tracking de Google Ads. Usar este componente para cualquier nuevo punto de contacto.

4.  **Panel de AdministraciÃ³n**:
    - En `AdminReservas`, el selector de vehÃ­culos filtra automÃ¡ticamente por capacidad en el frontend: `vehiculos.filter(v => capacity >= required)`.
    - Esto previene errores operativos de asignaciÃ³n de vehÃ­culos pequeÃ±os a grupos grandes.

### 5.5.2 RestricciÃ³n de AnticipaciÃ³n MÃ­nima

**Implementado: Enero 2026**

El sistema implementa una doble validaciÃ³n para evitar reservas de "Ãºltimo minuto" que son operativamente inviables:

1.  **Modelo de Datos**: Cada `Destino` tiene un campo `minHorasAnticipacion` (configurable desde el Admin). Por defecto 5 horas.
2.  **ValidaciÃ³n Frontend**:
    - **Filtrado Visual**: En `HeroExpress.jsx`, si el usuario selecciona HOY, se ocultan del selector las horas que violan la restricciÃ³n.
  - **Selectores Enriquecidos**: El flujo pÃºblico usa `Select` de shadcn para origen, destino, hora y pasajeros, mostrando resÃºmenes dinÃ¡micos de trayecto y servicio sugerido segÃºn la ruta elegida.
    - **Bloqueo LÃ³gico**: Al intentar avanzar al paso de pago, se recalcula la diferencia horaria y se bloquea el avance si no cumple.
  - **Servicios Especiales**: Si `configSillas.habilitado` estÃ¡ activo, `HeroExpress.jsx` expone la solicitud de sillas infantiles y envÃ­a la cantidad seleccionada a la cotizaciÃ³n backend.

### 5.6 EstÃ¡ndares de Flujos de Pago y Notificaciones

Para garantizar la consistencia operativa y del marketing (Google Ads), se han estandarizado los 3 flujos de reserva. Toda modificaciÃ³n futura **debe respetar estas directrices**:

#### A. MÃ³dulo Principal (Express)

- **Ruta**: Home â†’ CotizaciÃ³n â†’ Pago â†’ `CompletarDetalles.jsx`.
- **Captura de DirecciÃ³n**:
  - Obligatorio usar `AddressAutocomplete` en el campo `hotel` dentro de `CompletarDetalles.jsx`.
  - **ValidaciÃ³n Frontend**: El componente valida que el campo no estÃ© vacÃ­o antes de enviar (lÃ­neas 161-166).
  - **ValidaciÃ³n Backend**: El endpoint `/completar-reserva-detalles` retorna error HTTP 400 si falta la direcciÃ³n.
- **Notificaciones**:
  1.  **Pago**: Webhook (`/api/flow-confirmation`) notifica el dinero recibido (Admin + Cliente).
  2.  **LogÃ­stica**: Al guardar detalles en `PUT /completar-reserva-detalles`, se dispara la notificaciÃ³n logÃ­stica (Admin + Cliente).
- **Tracking**: La conversiÃ³n se dispara en `App.jsx` al retornar de Flow, usando los parÃ¡metros `amount` y `d` (datos de usuario encriptados).
- **Consentimiento Legal**: El paso de pago en `HeroExpress.jsx` debe mantener accesibles los modales de `TÃ©rminos y Condiciones` y `PolÃ­tica de Privacidad` antes de aceptar la casilla de consentimiento.

#### B. Pagar con CÃ³digo

- **Escenarios**:
  1.  **Nueva Reserva**: Crea una reserva express con los datos del cÃ³digo.
  2.  **Pago de Saldo/Diferencia**: Paga un monto vinculado a una reserva existente (`reservaVinculadaId`).
- **Ruta**: Usuario ingresa cÃ³digo â†’ Vista (Formulario Completo o Resumen Vinculado) â†’ Pago â†’ `FlowReturn.jsx`.
- **Captura de DirecciÃ³n**:
  - Obligatorio usar `AddressAutocomplete` en el formulario inicial de `PagarConCodigo.jsx`.
  - Campos condicionales: `direccionDestino` (viajes DESDE aeropuerto) o `direccionOrigen` (viajes HACIA aeropuerto).
  - **ValidaciÃ³n Frontend**: El componente valida segÃºn sentido del viaje (lÃ­neas 196-212).
  - **Mapeo Inteligente Backend**: El endpoint `/enviar-reserva-express` determina automÃ¡ticamente quÃ© direcciÃ³n usar y la guarda en el campo `hotel` (lÃ­neas 2793-2815).
- **Notificaciones**:
  1.  **LogÃ­stica**: Ocurre al crear la reserva inicial (`POST /enviar-reserva-express`).
  2.  **Pago**: Webhook (`/api/flow-confirmation`) notifica solo el pago (el sistema detecta que es flujo de cÃ³digo y evita duplicar la logÃ­stica).
- **ActualizaciÃ³n de CÃ³digo**:
  - El webhook localiza el cÃ³digo mediante `codigoPagoId` (prioritario) o `referenciaPago` y lo marca como **usado** automÃ¡ticamente tras el pago exitoso.
- **Tracking**: La conversiÃ³n se dispara en `FlowReturn.jsx` usando los parÃ¡metros `amount` y `d`.

#### C. Consultar Reserva / Pagos Pendientes

- **Ruta**: #consultar-reserva â†’ Ver Estado â†’ Pagar Saldo â†’ `FlowReturn.jsx`.
- **Notificaciones**: Solo notificaciÃ³n de pago (Financiera).
- **Tracking**: ConversiÃ³n en `FlowReturn.jsx` con monto del abono o saldo pagado.

#### ðŸ› ï¸ Directrices TÃ©cnicas Generales

1.  **Regla de Oro: DivisiÃ³n entre LogÃ­stica y Referencia**:
    - **Principio**: Se deben capturar dos datos distintos para evitar ambigÃ¼edades.
    - **DirecciÃ³n EspecÃ­fica (LogÃ­stica)**: Capturada vÃ­a `AddressAutocomplete` (Google Maps). Se almacena internamente en `direccionOrigen` o `direccionDestino` para navegaciÃ³n y visualizaciÃ³n en Ruta.
    - **Referencia / Hotel (Opcional)**: Campo de texto libre para detalles descriptivos (ej: "Dpto 402", "Casa Amarilla"). Se almacena en el campo `hotel`.
    - **Mapeo AutomÃ¡tico**: El backend determina si la direcciÃ³n de Google corresponde al origen o destino basÃ¡ndose en el sentido del viaje respecto al aeropuerto.
    - **NotificaciÃ³n Conductor**: El mensaje concatena ambos datos para mÃ¡xima precisiÃ³n: `Ruta (DirecciÃ³n Google) [Referencia]`.

2.  **Google Ads (Conversiones Avanzadas)**:
    - **Backend**: El endpoint de redirecciÃ³n (`/api/payment-result`) siempre debe inyectar el parÃ¡metro `d` en la URL de retorno. Este parÃ¡metro es un JSON Base64 con `{email, nombre, telefono}`.
    - **Frontend**: El tag de conversiÃ³n `gtag` debe incluir siempre `email`, `phone_number` y `address` (mapeado desde el nombre) para mejorar la precisiÃ³n de Google Ads.
3.  **ProtecciÃ³n de Duplicados**: Usar siempre `sessionStorage` con una clave Ãºnica (`flow_conversion_[transactionId]`) antes de disparar `gtag` para evitar conversiones dobles en recargas de pÃ¡gina.
4.  **Campo Maestro de DirecciÃ³n**: El campo `hotel` en la base de datos es el contenedor para direcciones precisas capturadas por Google Maps. Nunca usar campos de texto simple para direcciones finales si el componente permite el autocomplete.
5.  **PHP Integration**: Los scripts de Hostinger esperan `hotel`, `idaVuelta`, `fechaRegreso` y `horaRegreso` para una operaciÃ³n fluida. Asegurar que el backend siempre los propague en los payloads de `axios`.

#### ðŸ”§ ImplementaciÃ³n de ValidaciÃ³n y Mapeo de Direcciones

**ActualizaciÃ³n: 2 Enero 2026**

Se implementÃ³ validaciÃ³n obligatoria y mapeo inteligente de direcciones en ambos flujos principales:

**Flujo A (Express)**:

- **Frontend** (`CompletarDetalles.jsx` lÃ­neas 161-166): ValidaciÃ³n antes de enviar formulario.
- **Backend** (`/completar-reserva-detalles` lÃ­nea 3614): Retorna HTTP 400 si falta direcciÃ³n.
- **Guardado**: Directo al campo `hotel` con `.trim()` para limpiar espacios.

**Flujo B (Pagar con CÃ³digo)**:

- **Frontend** (`PagarConCodigo.jsx` lÃ­neas 196-212): ValidaciÃ³n condicional segÃºn sentido del viaje.
- **Backend** (`/enviar-reserva-express` lÃ­neas 2793-2815): LÃ³gica inteligente de mapeo:
  ```javascript
  // Determina automÃ¡ticamente la direcciÃ³n especÃ­fica
  if (origenEsAeropuerto && direccionDestinoCliente) {
  	direccionEspecifica = direccionDestinoCliente; // Viaje DESDE aeropuerto
  } else if (destinoEsAeropuerto && direccionOrigenCliente) {
  	direccionEspecifica = direccionOrigenCliente; // Viaje HACIA aeropuerto
  }
  ```
- **Guardado**: Mapeo inteligente al campo `hotel` segÃºn sentido del viaje.

**Resultado**: Ambos flujos garantizan que el campo `hotel` (DirecciÃ³n EspecÃ­fica) estÃ© siempre poblado antes de confirmar una reserva, cumpliendo con la "Regla de Oro".

### 5.7 Sistema de EstadÃ­sticas Financieras

El panel de estadÃ­sticas (`AdminEstadisticas.jsx`) proporciona mÃ©tricas clave para la toma de decisiones operativas y financieras.

#### Principio Fundamental: Solo Reservas Completadas

**Desde Diciembre 2025**, el sistema filtra **Ãºnicamente reservas con estado `completada`** en todos los cÃ¡lculos estadÃ­sticos. Esto garantiza que:

- Los ingresos reflejen dinero realmente recibido
- Los gastos correspondan a servicios ejecutados
- La utilidad sea precisa y accionable

#### ImplementaciÃ³n TÃ©cnica

**Backend** (`server-db.js`):

- Endpoints modificados: `/api/estadisticas/conductores`, `/api/estadisticas/vehiculos`, `/api/estadisticas/conductores/:id`
- Filtro aplicado: `{ estado: "completada" }` en todas las consultas de reservas
- LÃ­neas clave: 7587-7590, 7714-7717, 7953-7956

```javascript
const whereReservas =
	fechaInicio || fechaFin
		? { fecha: filtroReservas, estado: "completada" }
		: { estado: "completada" };
```

**Frontend** (`AdminEstadisticas.jsx`):

- No requiere cambios, consume los datos filtrados del backend
- CÃ¡lculo de totales: `calcularTotales()` suma mÃ©tricas de conductores/vehÃ­culos
- VisualizaciÃ³n: Cards con Total Reservas, Total Ingresos, Total Gastos, Utilidad

#### MÃ©tricas Disponibles

| Vista           | MÃ©tricas                                                                       |
| --------------- | ------------------------------------------------------------------------------ |
| **Conductores** | Reservas completadas, ingresos, gastos, pagos al conductor, utilidad           |
| **VehÃ­culos**   | Reservas completadas, ingresos, gastos de combustible, mantenimiento, utilidad |
| **Gastos**      | Total por perÃ­odo, registros, desglose por tipo (combustible, peajes, etc.)    |

#### Filtros Temporales

- Ãšltimos 15 dÃ­as
- Ãšltimos 30 dÃ­as (predeterminado)
- Mes actual
- Mes pasado
- Todo el historial
- Rango personalizado

> [!IMPORTANT]
> **Cambio de Comportamiento**: Antes de Diciembre 2025, las estadÃ­sticas incluÃ­an todas las reservas (pendientes, canceladas, etc.), lo que inflaba los nÃºmeros. Ahora solo se consideran reservas cerradas para reflejar la realidad operativa.

### 5.8 Sistema de Reservas Ida y Vuelta (Tramos Separados)

**Implementado: Diciembre 2025**  
**Actualizado: 13 Enero 2026** (Fix para flujo Express)

Para resolver problemas de asignaciÃ³n de conductores distintos para la ida y la vuelta, y permitir cierres de caja parciales, se implementÃ³ un cambio estructural en cÃ³mo se manejan los viajes redondos.

#### LÃ³gica de Negocio

Cuando un usuario (o admin) crea una reserva de tipo "Ida y Vuelta":

1.  **Backend**: El sistema intercepta la creaciÃ³n y genera **DOS** registros en la base de datos:
    - **Registro A (Ida)**: Contiene los datos del viaje de ida.
    - **Registro B (Vuelta)**: Contiene los datos de regreso (origen/destino invertidos).
2.  **VinculaciÃ³n**: Ambos registros quedan unidos mediante los campos `tramoPadreId` y `tramoHijoId`.
3.  **DivisiÃ³n de Costos**: El precio total y los abonos se dividen **50/50** entre ambos tramos.
    - _Ejemplo_: Reserva de $40.000. Se crean dos reservas de $20.000 cada una.
4.  **Independencia Operativa**:
    - Cada tramo puede tener su propio **Conductor** y **VehÃ­culo**.
    - Cada tramo puede tener su propio estado de pago y estado de ejecuciÃ³n (`Confirmada` vs `Completada`).

#### ImplementaciÃ³n TÃ©cnica

**Endpoints con lÃ³gica de separaciÃ³n:**

- âœ… `/enviar-reserva` (lÃ­neas 2646-2752): Implementado desde Diciembre 2025
- âœ… `/enviar-reserva-express` (lÃ­neas 3380-3499): **Implementado 13 Enero 2026**

**Flujos que usan la separaciÃ³n:**

- âœ… Pagar con CÃ³digo â†’ `/enviar-reserva-express`
- âœ… Cualquier flujo que use `/enviar-reserva-express`

> [!IMPORTANT]
> **Fix CrÃ­tico (13 Enero 2026)**: Se detectÃ³ que el endpoint `/enviar-reserva-express` (usado por "Pagar con CÃ³digo") NO tenÃ­a la lÃ³gica de separaciÃ³n, causando que todas las reservas ida y vuelta quedaran como una sola. Este problema fue corregido copiando la lÃ³gica de separaciÃ³n al endpoint express. Ver `GUIA_SOLUCION_PROBLEMAS.md` secciÃ³n 1 para detalles.

#### Impacto en Panel Admin (`AdminReservas`)

- **VisualizaciÃ³n**: Las reservas aparecen como filas separadas.
- **Identificadores**:
  - Badge **IDA** (Verde): Indica el primer tramo.
  - Badge **RETORNO** (Azul): Indica el segundo tramo.
- **Acciones**: Puede completar y cerrar la "Ida" (y registrar sus gastos) mientras la "Vuelta" permanece pendiente para dÃ­as futuros.

> **Nota**: Desde Feb 2026, la vista principal **oculta por defecto** las reservas de tipo "Vuelta" para evitar duplicados en la lista. Se accede a ellas a travÃ©s de la reserva de "Ida" vinculada.

> **Nota Legacy**: Las reservas antiguas (creadas antes de este cambio) mantienen el comportamiento "Legacy" (una sola fila para todo el viaje) y se identifican con el badge **IDA Y VUELTA**.

#### Script de DiagnÃ³stico de Tramos

**Creado: 10 Febrero 2026**

Para verificar la integridad de los datos de reservas ida/vuelta y detectar posibles problemas de asignaciÃ³n de `tipoTramo`, se creÃ³ un script de diagnÃ³stico reutilizable.

**Archivo**: [`backend/diagnosticar-tipo-tramo.js`](file:///c:/Users/widom/Documents/web}/transportes-araucaria/backend/diagnosticar-tipo-tramo.js)

**Funcionalidades**:

1. Verifica la existencia de la columna `tipo_tramo` en la base de datos
2. Muestra la distribuciÃ³n de reservas por tipo ('ida', 'vuelta', 'solo_ida')
3. Lista las Ãºltimas 10 reservas vinculadas con sus tipos y relaciones
4. Detecta automÃ¡ticamente problemas de integridad:
   - Reservas hijas (con `tramoPadreId`) que NO sean tipo 'vuelta'
   - Reservas padres (con `tramoHijoId`) que NO sean tipo 'ida'

**Uso**:

```bash
cd backend
node diagnosticar-tipo-tramo.js
```

**Hallazgos del Ãšltimo DiagnÃ³stico (10 Feb 2026)**:

- âœ… La columna `tipo_tramo` existe y estÃ¡ correctamente configurada
- âœ… Todas las reservas vinculadas tienen tipos correctos asignados
- âœ… No se detectaron inconsistencias en los datos actuales
- â„¹ï¸ El sistema estÃ¡ funcionando correctamente desde la implementaciÃ³n

> [!TIP]
> **Para Troubleshooting**: Si un usuario reporta problemas con reservas ida/vuelta, ejecutar primero este script de diagnÃ³stico para verificar si el problema estÃ¡ en los datos (backend) o en la visualizaciÃ³n (frontend).

### 5.9 OptimizaciÃ³n del Modal de Detalles de Reserva

**Implementado: 2 Enero 2026**

Para mejorar la experiencia de usuario en el panel administrativo, se optimizÃ³ el modal "Ver Detalles" de reservas para ocultar campos vacÃ­os y concentrar la informaciÃ³n relevante.

#### Problema Identificado

El modal mostraba todos los campos posibles, incluso cuando estaban vacÃ­os (con guiones "-" o valores en $0). Esto dificultaba la lectura rÃ¡pida de informaciÃ³n importante, especialmente en reservas con datos mÃ­nimos.

#### SoluciÃ³n Implementada

Se implementÃ³ **renderizado condicional** en `AdminReservas.jsx` para mostrar solo campos con contenido real.

#### Campos Optimizados

**Detalles del Viaje:**

- `vehiculo`: Solo se muestra si estÃ¡ asignado

**InformaciÃ³n Adicional:**

- SecciÃ³n completa se oculta si todos los campos estÃ¡n vacÃ­os
- `numeroVuelo`: Solo si tiene valor
- `hotel`: Solo si tiene valor
- `equipajeEspecial`: Solo si tiene valor
- `sillaInfantil`: Solo si es `true` (muestra "SÃ­")

**InformaciÃ³n Financiera:**

- `descuentoBase`: Solo si > 0
- `descuentoPromocion`: Solo si > 0
- `descuentoRoundTrip`: Solo si > 0
- `descuentoOnline`: Solo si > 0
- `codigoDescuento`: Solo si tiene valor

**Estado y Pago:**

- `metodoPago`: Solo si tiene valor
- `referenciaPago`: Solo si tiene valor

**InformaciÃ³n TÃ©cnica:**

- `ipAddress`: Solo si tiene valor

#### ImplementaciÃ³n TÃ©cnica

**Archivo**: `src/components/AdminReservas.jsx`

**PatrÃ³n de CÃ³digo**:

```jsx
// Para campos de texto/string
{
	selectedReserva.campo && (
		<div>
			<Label>Etiqueta</Label>
			<p>{selectedReserva.campo}</p>
		</div>
	);
}

// Para campos numÃ©ricos (descuentos)
{
	selectedReserva.descuento > 0 && (
		<div>
			<Label>Descuento</Label>
			<p>{formatCurrency(selectedReserva.descuento)}</p>
		</div>
	);
}

// Para secciones completas
{
	(campo1 || campo2 || campo3) && (
		<div>
			<h3>SecciÃ³n</h3>
			{/* Campos individuales con sus propias condiciones */}
		</div>
	);
}
```

**LÃ­neas Modificadas**: 3173-3178, 3303-3348, 3354-3393, 3448-3455, 3477-3495, 3535-3540

#### Beneficios

- âœ… **Claridad Visual**: Solo informaciÃ³n relevante
- âœ… **Lectura RÃ¡pida**: Menos scroll, mÃ¡s concentraciÃ³n
- âœ… **Profesionalismo**: Interfaz limpia y ordenada
- âœ… **Mantenibilidad**: PatrÃ³n claro para futuros campos

> [!TIP]
> **Para Futuros Desarrolladores**: Si agregas nuevos campos al modal de detalles, sigue el patrÃ³n de renderizado condicional mostrado arriba. PregÃºntate: "Â¿Este campo puede estar vacÃ­o o en 0?" Si la respuesta es sÃ­, envuÃ©lvelo en una condiciÃ³n.

### 5.9.1 Mejora Visual de Reservas Ida y Vuelta en Modal de Detalles

**Implementado: 23 Enero 2026**

Se implementÃ³ una mejora significativa en la visualizaciÃ³n de reservas de ida y vuelta en todos los modales de detalle del sistema, para hacer la informaciÃ³n mÃ¡s clara y evitar confusiones operativas.

#### Problema Identificado

Cuando una reserva era de tipo **ida y vuelta** (`idaVuelta === true`), la informaciÃ³n del viaje de regreso (fecha y hora de vuelta) no se mostraba de manera prominente. Los campos `fechaRegreso` y `horaRegreso` aparecÃ­an mezclados con otros datos, lo que dificultaba:

- Identificar rÃ¡pidamente que era un viaje de ida y vuelta
- Visualizar claramente las fechas y horas de ambos viajes
- Detectar cuando faltaba informaciÃ³n del viaje de regreso

#### SoluciÃ³n Implementada

Se implementÃ³ un **diseÃ±o visual mejorado con separaciÃ³n por colores** que distingue claramente entre el viaje de ida y el viaje de vuelta:

**CaracterÃ­sticas Principales:**

1. **Indicador Visual del Tipo de Viaje**: Badge azul que indica "Viaje Ida y Vuelta"
2. **Tarjeta Verde para Viaje de Ida**: Con borde izquierdo verde, fondo degradado verde claro
3. **Tarjeta Azul para Viaje de Vuelta**: Con borde izquierdo azul, fondo degradado azul claro
4. **Iconos SVG Direccionales**: Flecha derecha (â†’) para ida, flecha izquierda (â†) para vuelta
5. **Advertencia Visual**: Alert amarillo cuando falta `fechaRegreso` o `horaRegreso`
6. **InformaciÃ³n de Direcciones**: Se mantiene visible en ambas tarjetas cuando existe

#### Archivos Modificados

**1. AdminReservas.jsx** (LÃ­neas ~3173-3297)

```jsx
{
	/* Indicador del tipo de viaje */
}
{
	selectedReserva.idaVuelta && (
		<div className="mb-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
			<svg
				className="w-4 h-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
				/>
			</svg>
			<span className="font-semibold text-sm">Viaje Ida y Vuelta</span>
		</div>
	);
}

{
	/* Viaje de Ida - Tarjeta Verde */
}
<div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-4 mb-4">
	<h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
		<svg
			className="w-5 h-5"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M17 8l4 4m0 0l-4 4m4-4H3"
			/>
		</svg>
		VIAJE DE IDA
	</h4>
	{/* Contenido del viaje de ida */}
</div>;

{
	/* Viaje de Vuelta - Tarjeta Azul con Advertencia */
}
{
	selectedReserva.idaVuelta && (
		<div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
			<h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
				<svg
					className="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M7 16l-4-4m0 0l4-4m-4 4h18"
					/>
				</svg>
				VIAJE DE VUELTA
			</h4>
			{/* Contenido del viaje de vuelta */}

			{/* Advertencia si falta informaciÃ³n */}
			{(!selectedReserva.fechaRegreso || !selectedReserva.horaRegreso) && (
				<div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
					<svg
						className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<div>
						<p className="text-sm font-semibold text-yellow-800">
							InformaciÃ³n Incompleta del Viaje de Vuelta
						</p>
						<p className="text-xs text-yellow-700 mt-1">
							Es necesario completar la fecha y hora del regreso para coordinar
							el servicio.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
```

**2. ConsultarReserva.jsx** (Líneas ~399-466)

- Vista armonizada al sistema visual corporativo (`forest + cafe`) con `shadcn/ui` + Tailwind v4.
- Separación visual por tramos usando tokens semánticos:
  - **Ida**: `bg-primary/5 border-primary/25`
  - **Vuelta**: `bg-secondary/10 border-secondary/25`
  - **Advertencia**: `bg-accent/10 border-accent/35`
- Mensaje de advertencia adaptado: "Nos comunicaremos contigo para confirmar la fecha y hora del regreso".
- Entrada de código con máscara inteligente y validación en tiempo real (`AR-YYYYMMDD-XXXX`) para reducir errores de consulta.
- Se añadieron bloques informativos previos al resultado (consulta inmediata, pago seguro y soporte) para mejorar contexto y reducir sensación de pantalla vacía.
- Se incorporó botón de **Acciones rápidas** con menú inteligente contextual (pegar/copiar código, ejemplo, limpieza, soporte y atajos según estado de la reserva).

#### ArmonizaciÃ³n UI (Abril 2026)

- Se alineÃ³ la vista pÃºblica de oportunidades (`/oportunidades`) al sistema visual oficial (`forest + cafe`) usando tokens semÃ¡nticos (`bg-primary`, `bg-secondary`, `bg-card`, `border-border`).
- Se reforzÃ³ el enfoque **shadcn/ui + Tailwind v4** en la interfaz:
  - Tarjetas de oportunidad y bloque de suscripciÃ³n adaptados a componentes `Card`, `Badge`, `Button`, `Input`, `Select`, `Alert` y `Slider`.
  - Modal de reserva expedita estilizado con `Dialog` + `ScrollArea` para mejorar legibilidad y scroll en mÃ³vil.
- No se modificÃ³ la lÃ³gica de negocio ni los endpoints del sistema de oportunidades; el cambio es de presentaciÃ³n y consistencia visual.

---

### 5.18 Sistema de Banners Promocionales

**Implementado: Febrero 2026**

Sistema integral para crear y administrar ofertas especiales con imÃ¡genes, desplegadas en un carrusel pÃºblico y con flujo de reserva rÃ¡pida.

#### CaracterÃ­sticas Clave

- **Admin**: CRUD completo de banners con upload de imÃ¡genes.
- **Frontend**: Carrusel auto-gestionable en Home.
- **Reserva**: Modal de captura rÃ¡pida de datos + Pago diferido.

#### Flujo de Pago

El sistema utiliza una redirecciÃ³n automÃ¡tica a Flow (`/create-payment`) inmediatamente despuÃ©s de crear la reserva, garantizando que las promos se paguen al instante.

> [!NOTE]
> Para detalles tÃ©cnicos profundos (Modelo de datos, API, ConfiguraciÃ³n), consultar la **[GuÃ­a de Deployment y Arquitectura de Banners](./GUIA_DEPLOYMENT_BANNERS.md)**.

### 5.19 Sistema de Seguimiento de Conversiones (Google Ads)

**Implementado: Febrero 2026**

Sistema robusto para rastrear conversiones de marketing con alta precisiÃ³n, diseÃ±ado para resistir fallos en la transmisiÃ³n de datos y mejorar la atribuciÃ³n mediante "Enhanced Conversions".

#### Componentes del Rastreo

1.  **Evento de ConversiÃ³n (`gtag`)**:
    - Se dispara Ãºnicamente en las pÃ¡ginas de Ã©xito (`FlowReturn.jsx`, `App.jsx`).
    - **ID de ConversiÃ³n**: `AW-17529712870/M7-iCN_HtZUbEObh6KZB`.
    - **ProtecciÃ³n de Duplicados**: Utiliza `sessionStorage` para asegurar que cada transacciÃ³n solo cuente una vez, incluso si el usuario recarga la pÃ¡gina.

2.  **Conversiones Mejoradas (Enhanced Conversions)**:
    - EnvÃ­a datos de cliente (Email, TelÃ©fono) hasheados con SHA256.
    - Permite a Google atribuir ventas cross-device y recuperar conversiones donde las cookies han expirado.
    - **Mecanismo**: El backend codifica estos datos en Base64 en el parÃ¡metro `d` de la URL de retorno, y el frontend los decodifica y hashea antes de enviarlos.

3.  **Robustez del Valor Monetario**:
    - **Problema**: Flujos de pago interrumpidos a veces resultan en montos `0` o `null`.
    - **SoluciÃ³n**: El sistema implementa una cascada de fallbacks:
      1. Monto reportado por Flow.
      2. Monto registrado en base de datos.
      3. **Valor Centinela (1.0)**: Si todo fallo, se envÃ­a 1.0 para garantizar que la conversiÃ³n se registre.

#### Flujos Soportados

- **Reserva Web**: `App.jsx` maneja el retorno.
- **Pagar con CÃ³digo**: `FlowReturn.jsx` maneja el retorno.
- **Pago de Saldo**: `FlowReturn.jsx` maneja el retorno.
- **Banner Promocional**: `FlowReturn.jsx` maneja el retorno.

> [!IMPORTANT]
> **Defensa en Profundidad**: El sistema prioriza **capturar el evento** sobre la precisiÃ³n del dato. Es preferible registrar una venta con valor $1 que perder la seÃ±al de que un cliente comprÃ³.

---

### 5.25 Almacenamiento Persistente de ImÃ¡genes (Cloudinary)

**Implementado: 13 Marzo 2026**

#### Problema que resuelve

Render.com (plan gratuito y Starter) utiliza un **filesystem efÃ­mero**: cualquier archivo guardado en disco se borra al reiniciar o redesplegar el servicio. Antes de esta implementaciÃ³n, las imÃ¡genes de los banners promocionales se almacenaban en `public/banners/` del servidor, por lo que se perdÃ­an en cada deploy, obligando al administrador a volver a subirlas manualmente.

#### SoluciÃ³n implementada

Las imÃ¡genes se suben directamente a **Cloudinary** (CDN de imÃ¡genes en la nube). La URL permanente de Cloudinary se guarda en la Base de Datos (`imagen_url`), por lo que sobrevive indefinidamente a cualquier reinicio del backend.

#### Arquitectura tÃ©cnica

**Archivo principal**: `backend/routes/promociones-banner.routes.js`

```
[Admin sube imagen]
        â†“
[Multer: memoryStorage]   â† Sin tocar disco (buffer en RAM)
        â†“
[cloudinary.uploader.upload_stream()]
        â†“
[Cloudinary devuelve secure_url]
        â†“
[BD guarda la URL absoluta: https://res.cloudinary.com/...]
```

**OrganizaciÃ³n en Cloudinary**:

- Carpeta: `transportes-araucaria/banners/`
- TransformaciÃ³n automÃ¡tica: `quality: auto, fetch_format: auto` (optimizaciÃ³n de peso/formato)

**EliminaciÃ³n de imÃ¡genes antiguas**:

- Al editar una promociÃ³n con nueva imagen â†’ se destruye el `public_id` anterior via `cloudinary.uploader.destroy()`
- Al eliminar una promociÃ³n â†’ Ã­dem. La funciÃ³n helper `extractCloudinaryPublicId(url)` extrae el `public_id` desde la URL completa.

#### Variables de entorno requeridas (solo en Render â€” nunca en cÃ³digo)

| Variable                | DescripciÃ³n                  |
| ----------------------- | ---------------------------- |
| `CLOUDINARY_CLOUD_NAME` | `dsmjdnzkq`                  |
| `CLOUDINARY_API_KEY`    | API Key de la cuenta Root    |
| `CLOUDINARY_API_SECRET` | API Secret de la cuenta Root |

> [!WARNING]
> Las credenciales se configuran **exclusivamente** en el panel de Render (`Environment â†’ Add Environment Variable`). Nunca escribirlas en cÃ³digo ni commitearlas al repositorio.

#### DetecciÃ³n de URL absoluta vs. relativa (Frontend)

Las `imagen_url` guardadas antes de esta migraciÃ³n apuntan a URLs relativas (`/banners/foto.jpg`). Las nuevas apuntan a URLs absolutas de Cloudinary (`https://res.cloudinary.com/...`). El frontend detecta el tipo con:

```jsx
// GestionPromociones.jsx y PromocionBanners.jsx
src={promo.imagen_url?.startsWith('http')
  ? promo.imagen_url                          // Cloudinary â†’ usar directamente
  : `${getBackendUrl()}${promo.imagen_url}`}  // Legado â†’ prepender backend URL
```

> [!NOTE]
> Las promociones con URLs legadas (`/banners/...`) mostrarÃ¡n imagen rota hasta que se editen y se les reasigne una imagen. Las nuevas creaciones funcionan correctamente de inmediato.

#### CachÃ© de la API de banners

El endpoint pÃºblico `GET /api/promociones-banner/activas` envÃ­a `Cache-Control: no-store` para que los navegadores no cacheen los datos y reflejen cambios del admin en tiempo real.

#### Dependencia instalada

```bash
# En backend/
pnpm add cloudinary   # v2.9.0
```

---

### 5.26 Estrategia de Logs en Render

**Implementado: 13 Marzo 2026**

#### Principio general

Los logs en Render (plan gratuito) son el Ãºnico canal de observabilidad disponible sin acceso a shell. La estrategia es: **cero ruido, mÃ¡xima seÃ±al en lo que realmente importa** (pagos, conversiones, errores).

#### Logs eliminados (ruido sin valor diagnÃ³stico)

| Log eliminado                                         | Archivo         | Motivo                                                                                                           |
| ----------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Token expirado` / `Token invÃ¡lido`                   | `utils/auth.js` | Flujo normal del refresh automÃ¡tico. No es un error; si llenara logs es seÃ±al de alta actividad, no de problema. |
| `ðŸ” CORS Preflight` + `âœ… CORS Preflight respondido`  | `server-db.js`  | El navegador genera preflight en cada sesiÃ³n activa. Completamente rutinario.                                    |
| `ðŸ“… Solicitud de calendario: fechaInicio a fechaFin`  | `server-db.js`  | Se dispara en cada apertura del selector de fecha. Sin valor diagnÃ³stico.                                        |
| `PUT /pricing recibido` + dump completo del body JSON | `server-db.js`  | Ãštil en debug inicial. En producciÃ³n expone datos de configuraciÃ³n y no aporta.                                  |
| `âŒ Destino excluido: PucÃ³n/Villarrica`               | `server-db.js`  | Estaba **dentro de un bucle** sobre configuraciones â†’ se imprimÃ­a N veces por cada cÃ¡lculo de tarifa dinÃ¡mica.   |
| Log de email sanitizado en flujo Flow                 | `server-db.js`  | Expone datos parciales del cliente sin valor en producciÃ³n.                                                      |

#### Logs mejorados (conversiones y eventos crÃ­ticos)

**Inicio de proceso de pago** (`/api/create-payment`):

```
ðŸš€ [INICIO PAGO] 2026-03-13T14:38:02.000Z | Pasarela: flow | Monto: $45000 | Reserva: AR-20260313-0001 | Tipo: anticipo | Origen: directo
```

**Webhook de confirmaciÃ³n Flow** (conversiÃ³n real confirmada):

```
ðŸ’³ [CONVERSIÃ“N PAGO] 2026-03-13T14:39:50.000Z | Estado: PAGADO | Monto: $45000 | FlowOrder: 12345 | Payer: wid***
```

Los estados de Flow se mapean a texto legible: `1â†’PENDIENTE`, `2â†’PAGADO`, `3â†’RECHAZADO`, `4â†’ANULADO`.

**Subida de imagen a Cloudinary**:

```
ðŸ–¼ï¸  [BANNER] Imagen subida a Cloudinary: transportes-araucaria/banners/banner-1741872000000
```

#### PolÃ­tica para futuros logs

| Nivel           | CuÃ¡ndo usar                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `console.log`   | Eventos de negocio significativos: conversiÃ³n confirmada, cambio de estado de reserva, inicio de pago  |
| `console.warn`  | Situaciones inesperadas no crÃ­ticas: metadata invÃ¡lida, fallback activado, dato faltante no bloqueante |
| `console.error` | Errores reales que requieren atenciÃ³n: fallo de BD, fallo de pasarela de pago, error de Cloudinary     |
| **Silencio**    | Todo flujo normal/rutinario que se repite en bucles o por cada request HTTP estÃ¡ndar                   |

> [!IMPORTANT]
> Si en el futuro se agrega lÃ³gica que itera sobre colecciones (tarifas, configuraciones, destinos), **nunca poner logs dentro del bucle**. Acumular resultados y loguear una sola vez al final si es necesario.

---

### 5.27 IntegraciÃ³n Mercado Pago Checkout Pro

**Implementado: 8 Abril 2026**

#### DescripciÃ³n General

Se integrÃ³ **Mercado Pago Checkout Pro** como segunda pasarela de pago junto a **Flow**, disponible en todos los puntos de entrada de pago del sistema. El usuario puede seleccionar entre ambas pasarelas antes de confirmar el pago.

#### Arquitectura

```
Frontend (selector UI)
  â”œâ”€â”€ pasarela = "flow"        â†’ POST /create-payment      â†’ Flow
  â””â”€â”€ pasarela = "mercadopago" â†’ POST /api/create-payment-mp â†’ Mercado Pago
                                         â†“
                               Preference (SDK v2)
                                         â†“
                               Redirect a init_point
                                         â†“
                               Webhook POST /api/mp-confirmation
                                         â†“
                               DB update + email + oportunidades
                                         â†“
                               Retorno a /mp-return â†’ MercadoPagoReturn.jsx
```

#### Componentes creados / modificados

| Archivo                                | Tipo       | Cambio                                                                                         |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `src/components/MercadoPagoReturn.jsx` | **Nuevo**  | PÃ¡gina de retorno post-pago MP, anÃ¡loga a `FlowReturn.jsx`                                     |
| `src/App.jsx`                          | Modificado | Nuevo resolver `resolveIsMpReturnView`, estado `isMpReturnView`, render de `MercadoPagoReturn` |
| `src/components/PagarConCodigo.jsx`    | Modificado | Estado `pasarela`, funciÃ³n `procesarPagoConCodigoMP()`, selector UI                            |
| `src/components/ConsultarReserva.jsx`  | Modificado | Estado `pasarela`, lÃ³gica bifurcada en `continuarPago()`, selector UI                          |
| `src/components/HeroExpress.jsx`       | Modificado | Estado `pasarela`, selector UI, `handleProcesarPago(pasarela, ...)`                            |
| `backend/server-db.js`                 | Modificado | Endpoints `POST /api/create-payment-mp` y `POST /api/mp-confirmation` + import SDK             |
| `backend/package.json`                 | Modificado | Dependencia `mercadopago` SDK v2 instalada                                                     |

#### Endpoints backend

**`POST /api/create-payment-mp`**

Crea una preferencia de pago en Mercado Pago y retorna la URL de redirecciÃ³n.

```json
// Request
{
  "amount": 45000,
  "description": "Traslado ZCO - Temuco",
  "email": "cliente@example.com",
  "nombre": "Juan PÃ©rez",
  "telefono": "+56912345678",
  "reservaId": 123,
  "codigoReserva": "AR-20260408-0001",
  "tipoPago": "total",
  "paymentOrigin": "reserva_express"
}

// Response
{ "url": "https://www.mercadopago.cl/checkout/v1/redirect?...", "preferenceId": "..." }
```

Campos de la preferencia que cumplen el checklist de calidad MP (14 campos requeridos):

- `items`: `id`, `title`, `description`, `category_id`, `quantity`, `unit_price`, `currency_id`
- `payer`: `email`, `first_name`, `last_name`, `phone`
- `back_urls`: `success`, `pending`, `failure` (con `amount`, `reserva_id`, `codigo`, `d` Base64)
- `auto_return`: `"approved"`
- `notification_url`: `https://transportes-araucaria.onrender.com/api/mp-confirmation`
- `external_reference`: `reserva_{id}_{codigo}`
- `statement_descriptor`: `"Transportes Araucaria"`
- `metadata`: campos completos de la reserva
- `expires`: `true` con ventana de 2 horas

Guarda el `preference.id` en tabla `FlowToken` con `gateway: "mercadopago"`.

En desarrollo (`NODE_ENV=development` o `MP_SANDBOX=true`) usa `sandbox_init_point`.

**`POST /api/mp-confirmation`** (webhook IPN)

Procesa notificaciones de pago de Mercado Pago.

1. Responde HTTP 200 de inmediato (requerido por MP)
2. Solo procesa eventos `type === "payment"`
3. Consulta el estado real del pago al API de MP vÃ­a SDK
4. Solo actÃºa si `status === "approved"`
5. Extrae `reservaId` desde `external_reference`
6. Actualiza BD: `estadoPago: "pagado"`, `estado: "confirmada"`, `metodoPago: "mercadopago"`, `referenciaPagoExterno: paymentId`
7. Guarda en tabla `Transaccion`
8. EnvÃ­a email de confirmaciÃ³n vÃ­a PHPMailer
9. Llama a `detectarYGenerarOportunidades()`
10. Idempotencia: si `reserva.estadoPago === "pagado"` ya, retorna sin procesar

#### Componente MercadoPagoReturn.jsx

AnÃ¡logo a `FlowReturn.jsx`. Se activa cuando `window.location.pathname === "/mp-return"`.

**ParÃ¡metros URL recibidos desde MP:**

- `collection_id` / `payment_id`: ID Ãºnico del pago en MP
- `status`: estado del pago (`approved`, `pending`, `failure`)
- `amount`: monto embebido en `back_url` por el backend
- `reserva_id`, `codigo`: identificadores de la reserva
- `d`: datos del usuario en Base64 (email, nombre, telÃ©fono) para Enhanced Conversions

**ConversiÃ³n Google Ads:**

- Etiqueta de compra: `AW-17529712870/yZz-CJqiicUbEObh6KZB`
- `transaction_id`: usa `collection_id` de MP (Ãºnico garantizado)
- DeduplicaciÃ³n: clave `mp_conversion_{collection_id}` en `sessionStorage`
- Enhanced Conversions: decodifica `d` (Base64) â†’ `gtag('set', 'user_data', {...})`
- Estrategia de polling para pagos pending: 6 Ã— 5s rÃ¡pidos + 18 Ã— 15s lentos (~5 min)

#### Variables de entorno requeridas (Render.com)

```env
MP_ACCESS_TOKEN=APP_USR-7632289193248021-XXXXXX...   # Token de producciÃ³n
MP_SANDBOX=false                                       # Omitir o false en producciÃ³n
```

> [!IMPORTANT]
> El `MP_ACCESS_TOKEN` debe ser el token de **producciÃ³n** de la aplicaciÃ³n "Ruta Araucaria pasarela" (AppID `7632289193248021`). Se obtiene en mercadopago.com/developers.

#### Selector de pasarela (UI)

En los tres puntos de entrada de pago se muestra un selector de 2 botones antes del botÃ³n de pago:

```
[ ðŸ’³ Flow ]  [ ðŸŸ¦ Mercado Pago ]
```

- Por defecto: `Flow` (sin cambio de comportamiento para usuarios existentes)
- El texto del indicador de seguridad se adapta dinÃ¡micamente a la pasarela seleccionada
- La lÃ³gica en `handlePayment` (App.jsx) selecciona el endpoint correcto segÃºn `gateway`

#### Consideraciones de seguridad

- El webhook no confÃ­a en el monto enviado por MP en el IPN; siempre re-consulta el estado real al API de MP vÃ­a SDK
- El monto de retorno es embebido por el backend en la `back_url` al crear la preferencia, nunca depende solo de lo que devuelve MP en el redirect
- Idempotencia implementada en el webhook para evitar doble procesamiento

---

### 5.28 ConfiguraciÃ³n DinÃ¡mica de Pasarelas y Logos (Flow/Mercado Pago)

**Implementado: Abril 2026**

#### Objetivo

Permitir que el panel admin controle, sin deploy, quÃ© pasarelas de pago estÃ¡n activas y quÃ© logo se muestra para cada una en los flujos de pago del frontend.

#### Alcance funcional

- Habilitar/deshabilitar por pasarela: `flow`, `mercadopago`.
- Personalizar nombre y descripciÃ³n visible en el selector.
- Subir y eliminar imagen de referencia (logo) por pasarela.
- Reflejar cambios en tiempo real en los formularios de pago.

#### Backend

**Ruta dedicada**: `backend/routes/configuracion-pasarelas.routes.js`

**Endpoints**:

- `GET /api/configuracion/pasarelas-pago`: entrega configuraciÃ³n pÃºblica para frontend.
- `PUT /api/configuracion/pasarelas-pago`: actualiza `habilitado`, `nombre`, `descripcion` (admin).
- `POST /api/configuracion/pasarelas-pago/:gateway/imagen`: sube logo a Cloudinary (admin).
- `DELETE /api/configuracion/pasarelas-pago/:gateway/imagen`: elimina logo de pasarela (admin).

**Persistencia**:

- Clave en tabla `configuracion`: `config_pasarelas_pago`.
- Estructura base por pasarela: `habilitado`, `nombre`, `descripcion`, `imagen_url`.
- Merge profundo por pasarela en lectura/escritura para tolerar registros parciales.

**Cloudinary (pasarelas)**:

- Carpeta: `transportes-araucaria/pasarelas`.
- Subida en memoria (`multer.memoryStorage`) para compatibilidad con filesystem efÃ­mero en Render.
- URL de imagen guardada en formato versionado para mitigar cachÃ© agresivo del CDN/navegador.
- `invalidate: true` en overwrite para invalidaciÃ³n de cachÃ©.

#### Frontend

**Hook**: `src/hooks/usePasarelasConfig.js`

- Carga configuraciÃ³n con fallback seguro (ambas pasarelas habilitadas por defecto).
- CachÃ© en `sessionStorage` con TTL de 5 minutos.
- NormalizaciÃ³n defensiva para garantizar presencia consistente de `flow` y `mercadopago`.
- SincronizaciÃ³n inmediata tras cambios del admin:
  - Evento local para instancias montadas.
  - SeÃ±al en `localStorage` para refresco entre pestaÃ±as.

**Componente**: `src/components/SelectorPasarela.jsx`

- Si hay 2 pasarelas activas: muestra selector con botones y logos.
- Si hay 1 pasarela activa: muestra tarjeta fija (solo lectura) con logo y datos.
- Si no hay imagen: usa fallback visual por pasarela.

**Panel admin**: `src/components/AdminConfiguracion.jsx`

- GestiÃ³n completa de habilitaciÃ³n y branding visual de pasarelas.
- Subida de imagen usando `authenticatedFetch` (JWT vÃ¡lido del contexto de auth).
- Mensajes de Ã©xito/error visibles para operaciÃ³n de subida/eliminaciÃ³n.

#### Correcciones clave aplicadas durante la implementaciÃ³n

- Se eliminÃ³ bloqueo por estado de carga en selector para no ocultar opciones mientras Render despierta.
- Se corrigiÃ³ merge superficial que podÃ­a perder campos por pasarela.
- Se evitÃ³ fijar `Content-Type: application/json` en peticiones `FormData` autenticadas.
- Se reemplazÃ³ uso de token legacy en subida por flujo estÃ¡ndar de autenticaciÃ³n.
- Se agregÃ³ trazabilidad de errores de subida (frontend y backend) para diagnÃ³stico rÃ¡pido.

#### Consideraciones futuras para nuevas intervenciones

1. **No romper multipart**:
   En cualquier helper HTTP compartido, no forzar `Content-Type` cuando `body` sea `FormData`.

2. **Mantener sincronizaciÃ³n cross-tab**:
   Si se modifica el mecanismo de cachÃ©, conservar refresco local + refresco entre pestaÃ±as.

3. **Evitar regresiÃ³n visual con pasarela Ãºnica**:
   No ocultar el bloque de mÃ©todo de pago cuando exista solo una pasarela activa; debe mostrarse el logo de referencia.

4. **Respetar merge profundo**:
   Al agregar nuevas propiedades por pasarela, actualizar defaults y merge en backend y frontend para compatibilidad hacia atrÃ¡s.

5. **Preservar observabilidad en Render**:
   Mantener logs compactos de inicio/error/Ã©xito para subida de imÃ¡genes y evitar logs verbosos en bucles.

6. **Compatibilidad local + producciÃ³n**:
   Validar flujo tanto en localhost como en backend Render, considerando latencia de wake-up y cachÃ© de CDN.

7. **Checklist mÃ­nimo antes de cerrar cambios de pasarelas**:

- Admin guarda habilitaciÃ³n correctamente.
- Logo se sube y queda visible en vista previa admin.
- Logo se refleja en HeroExpress, ConsultarReserva y PagarConCodigo.
- Con 1 pasarela activa se muestra tarjeta fija con imagen.
- Con 2 pasarelas activas se muestran ambas opciones.

---

### 5.29 MÃ³dulo Aeropuerto-Hoteles con Reserva y Admin Dedicados

**Implementado: Abril 2026**

#### Objetivo

Crear un servicio paralelo al flujo principal, orientado exclusivamente a traslados entre **Aeropuerto La AraucanÃ­a** y hoteles relevantes de la regiÃ³n, con:

- Tarifas fijas por hotel.
- Reglas de viaje propias.
- Reserva pÃºblica especializada.
- Panel administrativo independiente.

#### Reglas de negocio implementadas

1. Si el origen es **aeropuerto**, el cliente puede reservar:
   - `solo_ida`, o
   - `ida_vuelta`.
2. Si el origen es **hotel**, solo puede reservar:
   - `solo_ida` hacia aeropuerto.
3. Para `ida_vuelta` se exige `fechaVuelta` y `horaVuelta`.
4. El rango operativo del mÃ³dulo se limita a 1â€“7 pasajeros.

#### Backend (Render.com)

**Modelo dedicado**:

- `backend/models/TrasladoHotelAeropuerto.js`
- Tabla: `traslados_hoteles`
- `backend/models/HotelTraslado.js`
- Tabla: `hoteles_traslado` (catálogo administrable de hoteles y tarifas)

**MigraciÃ³n dedicada**:

- `backend/migrations/add-traslados-hoteles-table.js`
- `backend/migrations/add-hoteles-traslado-table.js`

**Rutas del mÃ³dulo**:

- `backend/routes/traslados-hoteles.js`
- Registro en `backend/server-db.js` con `setupTrasladosHotelesRoutes(app, authAdmin)`.

**Endpoints pÃºblicos**:

- `GET /api/traslados-hoteles/catalogo`: devuelve hoteles y tarifario fijo.
- `POST /api/traslados-hoteles/reservas`: crea reserva del servicio.

**Endpoints administrativos** (requieren JWT admin):

- `GET /api/admin/traslados-hoteles/reservas`: listado con filtros y resumen.
- `PATCH /api/admin/traslados-hoteles/reservas/:id/estado`: cambio de estado.
- `GET /api/admin/traslados-hoteles/hoteles`: listado completo del catálogo.
- `POST /api/admin/traslados-hoteles/hoteles`: crear hotel/tarifas.
- `PUT /api/admin/traslados-hoteles/hoteles/:id`: editar hotel/tarifas/estado/orden.

#### Frontend pÃºblico

**PÃ¡gina dedicada**:

- `src/pages/TrasladosAeropuertoHoteles.jsx`
- Ruta: `/aeropuerto-hoteles` (y hash `#aeropuerto-hoteles`).

**IntegraciÃ³n de navegaciÃ³n**:

- `src/App.jsx`: resoluciÃ³n de vista y render de la nueva pÃ¡gina.
- `src/components/Header.jsx`: acceso directo en menÃº principal.
- `src/components/Servicios.jsx`: tarjeta especÃ­fica del nuevo servicio.

#### Admin especializado

**Componente dedicado**:

- `src/components/admin/AdminTrasladosHoteles.jsx`
  - Incluye submódulo de catálogo para administrar hoteles, tarifas solo ida, tarifas ida/vuelta, orden y estado activo.

**IntegraciÃ³n en panel**:

- `src/components/AdminDashboard.jsx`: panel `traslados-hoteles`.
- `src/components/admin/layout/AdminSidebar.jsx`: item "Aeropuerto-Hoteles" en Operaciones.

#### Consideraciones tÃ©cnicas

- Este mÃ³dulo no reemplaza ni altera la lÃ³gica de `Reserva` del sistema principal; opera como subsistema independiente.
- Mantiene compatibilidad con arquitectura actual: frontend React/Vite, backend Node/Express en Render.com.
- No modifica el sistema de correos PHPMailer en Hostinger.
- El formulario público consume solo hoteles activos desde `hoteles_traslado`, evitando depender de valores hardcodeados.

---

## 6. Mantenimiento y Despliegue

### Archivos Legacy

La documentaciÃ³n antigua se ha archivado en `docs/legacy/` para referencia histÃ³rica. Consultar esa carpeta si se busca informaciÃ³n muy especÃ­fica sobre versiones anteriores (v1) o logs de cambios detallados.

---

## 7. SoluciÃ³n de Problemas (Troubleshooting)

Se ha compilado una guÃ­a especÃ­fica para resolver problemas recurrentes como:

- **Backend 500**: Errores de ruta o base de datos.
- **Migraciones**: CÃ³mo crear e integrar nuevas migraciones. **IMPORTANTE**: Revisar la secciÃ³n [5.13 Sistema de Migraciones](#513-sistema-de-migraciones-de-base-de-datos) para entender el sistema de auto-migraciones.
- **AutenticaciÃ³n**: SoluciÃ³n al bloqueo de ediciÃ³n.

ðŸ‘‰ **Ver GuÃ­a Completa**: [GUIA_SOLUCION_PROBLEMAS.md](./GUIA_SOLUCION_PROBLEMAS.md)

---

## 8. Anexos HistÃ³ricos

Para consultar bitÃ¡coras de cambios especÃ­ficas o guÃ­as visuales antiguas, revisar la carpeta `docs/legacy`. Archivos notables movidos allÃ­:

- `GUIA_USUARIO_PANEL_ADMIN_V2.md`
- `ARQUITECTURA_PANEL_ADMIN.md`
- `INTEGRACION_EMAILS_PHP.md`
- `LOGS_CORRECCIONES.md`

---

---

### 5.17 Sistema de Oportunidades de Traslado

**Actualizado: Febrero 2026**

El Sistema de Oportunidades permite aprovechar los traslados vacÃ­os (retornos e idas) convirtiÃ©ndolos en oportunidades de venta con descuentos de hasta 60%, manteniendo el concepto de traslado 100% privado.

#### CaracterÃ­sticas Principales

1. **DetecciÃ³n AutomÃ¡tica**:
   - _Retornos VacÃ­os_: Genera una oportunidad en direcciÃ³n contraria tras una reserva confirmada (ej: destino â†’ origen). VÃ¡lido hasta 2 horas antes del viaje con 50-60% de descuento.
   - _Idas VacÃ­as_: Si el origen de una reserva no es la Base (Temuco), genera oportunidad Base â†’ origen. VÃ¡lido hasta 3 horas antes con 50% de descuento limitando la capacidad ociosa.
2. **GeneraciÃ³n Automatizada**: El endpoint `GET /api/oportunidades/generar` permite al sistema leer las reservas futuras y registrar opciones disponibles.
3. **Flujo Cautivo del Cliente**:
   - Muestra ofertas en `OportunidadesTraslado.jsx` (`/#oportunidades`).
   - Al reservar se almacenan los datos de la ruta en `localStorage` y se pre-llena el formulario `HeroExpress`.
   - Al completarse el pago, la oportunidad se marca como `reservada`.
4. **Monitoreo Continuo**: ExpiraciÃ³n automÃ¡tica (`marcarOportunidadesExpiradas()`) antes de cada listado pÃºblico.
5. **SuscripciÃ³n de Alertas**: Los clientes pueden registrar su email y ruta para recibir notificaciones cuando se abra un descuento coincidente.

---

### 5.18 Sistema de Banners Promocionales

**Actualizado: Febrero 2026**

El sistema de promociones permite crear ofertas atractivas con imÃ¡genes que se muestran en la pÃ¡gina principal (`PromocionBanners.jsx`). Estas promociones generan reservas rÃ¡pidas con flujos de pago simplificados.

#### CaracterÃ­sticas Principales

1.  **Tipos de Viaje EspecÃ­ficos**:
    - `Desde Aeropuerto`: Fija el origen en Aeropuerto La AraucanÃ­a.
    - `Hacia Aeropuerto`: Fija el destino en Aeropuerto La AraucanÃ­a.
    - `Ida y Vuelta`: Permite libre elecciÃ³n de ruta.

2.  **Restricciones de Pasajeros**:
    - **Rango Configurable**: Se define un mÃ­nimo (`min_pasajeros`) y mÃ¡ximo (`max_pasajeros`) de pasajeros.
    - **Selector DinÃ¡mico**: El cliente selecciona la cantidad exacta dentro del rango permitido al reservar (ej: de 2 a 4).

3.  **Restricciones Horarias**:
    - **Ventana de Reserva**: Se pueden definir horas de inicio y fin (ej: solo vÃ¡lido de 10:00 a 14:00).
    - **Filtrado Inteligente**: El modal de reserva oculta automÃ¡ticamente las horas fuera del rango permitido.

4.  **GeneraciÃ³n de Leads e IntegraciÃ³n**:
    - **Link Directo**: Cada promociÃ³n tiene un link Ãºnico (`/?promo=ID`) para campaÃ±as de marketing (Google Ads, Facebook).
    - **Conversiones**: Las reservas generadas se marcan con `source: "banner_promocional"` para tracking de efectividad.

5.  **Flujo TÃ©cnico**:
    - **API POST**: `POST /api/promociones-banner/desde-promocion/:id` crea la reserva vinculada a la promociÃ³n.
    - **Frontend**: `ReservaRapidaModal.jsx` maneja la interfaz de usuario simplificada.
    - **Panel Admin**: `GestionPromociones.jsx` permite crear, editar, subir imÃ¡genes y activar promociones.

### 5.19 Sistema de Seguimiento de Conversiones (Google Ads)

**Actualizado: 15 Marzo 2026**

El sistema utiliza Google gtag.js para el seguimiento de conversiones en Google Ads, diferenciando entre eventos de "Lead" (intenciÃ³n de compra) y "Purchase" (reserva pagada). Para maximizar la precisiÃ³n, se utiliza el estÃ¡ndar de **Enhanced Conversions** en ambos eventos de la cascada y a travÃ©s de mÃºltiples componentes.

#### Arquitectura del Seguimiento

1.  **Eventos de Lead (IntenciÃ³n de Pago)**:
    - Se disparan inmediatamente antes de redirigir al usuario a la pasarela (Flow o Mercado Pago) en los flujos principales (`App.jsx`/HeroExpress, `ConsultarReserva.jsx`, `PagarConCodigo.jsx`, `ReservaRapidaModal.jsx`, `OportunidadesTraslado.jsx`).
    - **ID de ConversiÃ³n**: `AW-17529712870/8GVlCLP-05MbEObh6KZB`.
    - **Enhanced Conversions**: Captura y envÃ­a inmediatamente los datos del formulario (Email, TelÃ©fono formateado a E.164, y Nombre dividido en first/last_name) mediante el objeto `user_data`.
    - **PatrÃ³n**: Usan `waitForGtag` con timeout de 2 segundos (el usuario disparÃ³ el click, asÃ­ que el riesgo de carrera es bajo pero se protege igualmente).
2.  **Eventos de Purchase (Compra Exitosa)**:
    - Se disparan Ãºnicamente en los puntos de retorno de Ã©xito (`FlowReturn.jsx`, `App.jsx`, `CompletarDetalles.jsx` como respaldo).
    - **ID de ConversiÃ³n**: `AW-17529712870/yZz-CJqiicUbEObh6KZB` (Moneda: `CLP`).
    - **Enhanced Conversions**: El backend codifica estos datos en Base64 en el parÃ¡metro `d` de la URL de retorno, y el frontend los decodifica para pasarlos a `user_data` al disparar el evento.
3.  **ProtecciÃ³n de Duplicados (Purchase)**:
    - Se utiliza `sessionStorage` con una clave basada en el ID de la transacciÃ³n (`id_reserva_token`) para evitar registrar la misma conversiÃ³n repetida si el usuario recarga la pÃ¡gina. Conversiones con un nuevo pago por el mismo cliente (abono + saldo pago restante) se registrarÃ¡n como 2 transacciones diferentes (lo cual es correcto).
    - En `FlowReturn.jsx` y `MercadoPagoReturn.jsx` la deduplicaciÃ³n **no debe** basarse solo en `reserva_id`, porque bloquearÃ­a pagos vÃ¡lidos adicionales sobre la misma reserva dentro de la misma sesiÃ³n.

#### Comportamiento del Gateway Flow: Doble RedirecciÃ³n (descubierto 15 Marzo 2026)

Flow envÃ­a la URL de retorno **dos veces** con distintos estados:

1. **RedirecciÃ³n de navegador (status=1, Pendiente)**: Ocurre inmediatamente cuando el usuario termina en Flow. El navegador del usuario aterriza en `urlReturn` con `status=1`.
2. **Webhook server-side (status=2, Confirmado)**: Llega segundos / minutos despuÃ©s al servidor, actualizando `estadoPago = "pagado"` en la BD.

**Impacto**: Si el frontend disparaba la conversiÃ³n al recibir `status=2` en la URL, nunca lo recibirÃ­a para pagos con cÃ³digo (PagarConCodigo), porque esos pagos siempre llegan con `status=1` al navegador y solo el webhook backend recibe `status=2`.

**SoluciÃ³n**: Mecanismo de polling en el frontend (ver secciÃ³n siguiente).

#### Endpoint `/api/payment-status` (Implementado: 15 Marzo 2026)

Nuevo endpoint pÃºblico en `backend/server-db.js` que permite al frontend consultar el estado real del pago en la BD:

```
GET /api/payment-status?token=<flowToken>&reserva_id=<id>
```

**Respuesta:**

```json
{
  "pagado": false,
  "transaccionConfirmada": true,
  "status": "parcial",
  "monto": 25000,
  "montoAcumulado": 50000
}
```

- `transaccionConfirmada` indica que el pago actual fue aprobado aunque la reserva haya quedado en estado `parcial`.
- `monto` debe representar el valor de la transacciÃ³n actual cuando exista token de pago; `montoAcumulado` queda como referencia administrativa.

- Requiere `token` **o** `reserva_id` (al menos uno).
- Si `token` estÃ¡ presente, busca el `FlowToken` para obtener el `reservaId` asociado.
- Devuelve `pagado: false` y `monto: null` mientras el webhook aÃºn no confirmÃ³ el pago.

#### PatrÃ³n de Polling para `status=pending` (Implementado: 15 Marzo 2026)

Cuando el backend redirige al frontend con `status=pending`, el componente React inicia un polling a `/api/payment-status`:

```javascript
// Polling: 5 segundos de intervalo, mÃ¡ximo 24 intentos (2 minutos total)
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
	if (data.pagado) {
		clearInterval(pollingInterval);
		setPaymentStatus("success");
		const montoConfirmado = data.monto?.toString() || amountParam;
		await waitForGtag();
		triggerConversion(montoConfirmado, reservaIdParam, token);
	}
}, 5000);
// Limpiar polling al desmontar el componente
return () => {
	cancelado = true;
	clearInterval(pollingInterval);
};
```

#### PatrÃ³n Obligatorio: `waitForGtag` (Fix Race Condition - Marzo 2026)

**Problema identificado**: `gtag.js` se carga de forma **asÃ­ncrona** desde los servidores de Google. En flujos donde la conversiÃ³n se dispara automÃ¡ticamente al cargar la pÃ¡gina (ej: al volver de Flow), el script puede no estar disponible aÃºn, causando que el evento se **pierda silenciosamente**.

**SoluciÃ³n**: Todos los eventos de _Purchase_ y _Lead_ automÃ¡ticos deben usar el patrÃ³n `waitForGtag` antes de llamar a `window.gtag(...)`:

```javascript
// âœ… PATRÃ“N CORRECTO: Esperar a que gtag estÃ© disponible (polling cada 100ms, mÃ¡x configurable)
const waitForGtag = (maxMs = 5000) =>
	new Promise((resolve) => {
		if (typeof window.gtag === "function") {
			resolve(true);
			return;
		}
		const startTime = Date.now();
		const interval = setInterval(() => {
			if (typeof window.gtag === "function") {
				clearInterval(interval);
				resolve(true);
			} else if (Date.now() - startTime >= maxMs) {
				clearInterval(interval);
				resolve(false); // Timeout: gtag no cargÃ³
			}
		}, 100);
	});

// En la funciÃ³n async que dispara la conversiÃ³n:
const gtagListo = await waitForGtag();
if (gtagListo) {
	window.gtag("event", "conversion", conversionData);
}
```

> [!IMPORTANT]
> **CuÃ¡ndo aplicar**: Este patrÃ³n es **obligatorio** en cualquier conversiÃ³n que se dispare automÃ¡ticamente al montar un componente (en un `useEffect`). Para eventos disparados por **interacciÃ³n del usuario** (click), el patrÃ³n es opcional ya que `gtag` ya habrÃ¡ cargado para entonces, pero se recomienda aplicarlo igualmente para uniformidad.

> [!NOTE]
> **Compatibilidad en mÃ³dulos ES6**:
> En componentes React y otros mÃ³dulos ESM, preferir siempre `window.gtag(...)` por sobre `gtag(...)`.
> Ambas formas apuntan al mismo tag global, pero `window.gtag` evita depender de variables globales implÃ­citas y reduce falsos positivos de lint o diferencias de scope entre builds.

#### Tabla de Cobertura Completa de Flujos (Estado: 15 Marzo 2026)

| Flujo               | `paymentOrigin`        | Componente Purchase  | Lead status          | Polling pending |
| ------------------- | ---------------------- | -------------------- | -------------------- | --------------- |
| PagarConCodigo      | `pagar_con_codigo`     | `FlowReturn.jsx`     | `waitForGtag` 2s     | âœ… FlowReturn   |
| ConsultarReserva    | `consultar_reserva`    | `FlowReturn.jsx`     | `waitForGtag` 2s     | âœ… FlowReturn   |
| Oportunidades       | `oportunidad_traslado` | `FlowReturn.jsx`     | `waitForGtag` 2s     | âœ… FlowReturn   |
| Banners/Promociones | `banner_promocional`   | `FlowReturn.jsx`     | `waitForGtag` 2s     | âœ… FlowReturn   |
| HeroExpress         | `reserva_express`      | `App.jsx` (redirect) | `waitForGtag` 5s     | âœ… App.jsx      |

#### Archivos de Purchase que usan `waitForGtag`

| Archivo                                | Flujo                             | FunciÃ³n                                          |
| -------------------------------------- | --------------------------------- | ------------------------------------------------ |
| `src/components/FlowReturn.jsx`        | Todos los flujos no-express       | `verifyPayment()` / polling â†’ `waitForGtag()`    |
| `src/App.jsx`                          | Reserva Express (retorno al Home) | `dispararConversionExpress()` â†’ `waitForGtag()`  |
| `src/components/CompletarDetalles.jsx` | Flujo Normal (respaldo)           | `dispararConversionRespaldo()` â†’ `waitForGtag()` |

#### Archivos de Lead que usan `waitForGtag`

| Archivo                                     | Evento                        | Timeout |
| ------------------------------------------- | ----------------------------- | ------- |
| `src/components/Header/index.jsx`           | Lead â†’ WhatsApp               | 2s      |
| `src/pages/FletesLanding.jsx`               | Lead â†’ WhatsApp               | 2s      |
| `src/components/WhatsAppButton.jsx`         | Lead â†’ WhatsApp               | 2s      |
| `src/components/WhatsAppInterceptModal.jsx` | Lead â†’ WhatsApp               | 2s      |
| `src/App.jsx`                               | Lead â†’ WhatsApp (HeroExpress) | 2s      |
| `src/components/ConsultarReserva.jsx`       | Lead â†’ Pago                   | 2s      |
| `src/pages/OportunidadesTraslado.jsx`       | Lead â†’ Pago                   | 2s      |
| `src/components/ReservaRapidaModal.jsx`     | Lead â†’ Pago                   | 2s      |
| `src/components/PagarConCodigo.jsx`         | Lead â†’ Pago                   | 2s      |

#### Pruebas sin pago real (QA)

Para validar conversiones sin pagar una reserva, existe la vista `TestGoogleAds` en la ruta `/test-google-ads`:

1. Configurar `token`, `reserva_id`, `amount`, `email`, `nombre` y `telefono`.
2. Simular retorno exitoso en `FlowReturn`, `MercadoPagoReturn` o `HeroExpress` usando los botones del panel.
3. Verificar en DevTools (Network) que el evento `conversion` se envÃ­a con `value=<amount>`.
4. Verificar en consola del navegador los logs de `FlowReturn` / `MPReturn` que confirman `user_data` (Enhanced Conversions).

Esta vista no confirma atribuciÃ³n en Google Ads productivo (no hay pago real), pero sÃ­ permite validar:

- Estructura del payload.
- Presencia de `user_data`.
- Valor (`amount`) enviado en el evento.

#### Especificaciones TÃ©cnicas

- **NormalizaciÃ³n TelefÃ³nica**: Es esencial usar la funciÃ³n local `normalizePhoneToE164` para los nÃºmeros al montar los payloads de Enhanced Conversions.
- **Robustez del Valor Monetario**: El evento _Purchase_ implementa fallbacks progresivos (ParÃ¡metro Flow â†’ Respuesta Backend â†’ Centinela `1.0`) para prevenir que problemas de red eviten notificar la conversiÃ³n.

> [!WARNING]
> **Nota de Mantenimiento CrÃ­tica**:
> Al agregar nuevos flujos de pago, **SIEMPRE** usar el patrÃ³n `waitForGtag` descrito arriba para conversiones _Purchase_ disparadas automÃ¡ticamente. No usar `if (typeof window.gtag === "function") { ... }` como Ãºnico guard: eso solo funciona si el script ya cargÃ³, pero no espera si aÃºn estÃ¡ cargando.
> Si el nuevo flujo puede recibir `status=1` (pending) desde Flow, implementar el polling usando el endpoint `/api/payment-status`.

---

### 5.20 Mejoras en la GestiÃ³n y VisualizaciÃ³n de Reservas (Panel Admin)

**Implementado: 15 Febrero 2026**

Se han realizado mejoras significativas en el panel de administraciÃ³n de reservas para facilitar la bÃºsqueda, el ordenamiento y la identificaciÃ³n de servicios especiales (sillas infantiles) y retornos vinculados.

#### 1. Ordenamiento DinÃ¡mico de la Tabla

Anteriormente, la lista de reservas era estÃ¡tica. Se ha implementado un sistema de ordenamiento que permite al administrador organizar la informaciÃ³n segÃºn sus necesidades:

- **Columnas Ordenables**: "Fecha/Hora Viaje" ("fecha") y "Fecha CreaciÃ³n" ("created_at").
- **Estados**: Ascendente y Descendente con indicadores visuales (flechas ^|^v).
- **Persistencia**: El ordenamiento se realiza directamente en la base de datos a travÃ©s de la API para mantener el rendimiento con grandes volÃºmenes de datos.

#### 2. VisualizaciÃ³n Mejorada de Viajes de Regreso

Para las reservas marcadas como "Ida y Vuelta", el panel ahora muestra informaciÃ³n del tramo de regreso directamente en la tabla:

- **Datos Visibles**: Fecha y Hora de regreso (si estÃ¡n disponibles).
- **AsociaciÃ³n TÃ©cnica**: Se utiliza la asociaciÃ³n "tramoHijo" en el backend para recuperar automÃ¡ticamente los datos vinculados del tramo de vuelta.

#### 3. Indicador de Silla Infantil (Baby Seat)

Se ha aÃ±adido un identificador visual crÃ­tico para la logÃ­stica de los conductores:

- **Icono**: Icono de "Baby" ("lucide-react") resaltado en color cafÃ© junto al nÃºmero de pasajeros.
- **ActivaciÃ³n**: Se muestra automÃ¡ticamente si la reserva tiene el campo "sillaInfantil: true".

#### 4. Detalles TÃ©cnicos (Backend)

- **Asociaciones**: Se implementÃ³ "tramoHijo" y "tramoPadre" en "associations.js" para vincular reservas del mismo viaje.
- **API "GET /api/reservas"**:
  - Soporta parÃ¡metros "sort" (columna) y "order" ("asc"/"desc").
  - Incluye por defecto la asociaciÃ³n "tramoHijo".
  - Orden predeterminado: "created_at" DESC (reservas mÃ¡s nuevas primero).

---

## 5.21 Sistema de AuditorÃ­a y Logs (AdminAuditLog)

El sistema cuenta con un mecanismo de auditorÃ­a (`AdminAuditLog`) diseÃ±ado para registrar acciones crÃ­ticas realizadas por usuarios administradores. Este registro es esencial para la seguridad, trazabilidad y depuraciÃ³n de incidentes.

### Funcionalidad

Cada vez que se realiza una acciÃ³n sensible en el panel administrativo, el backend crea un registro en la tabla `admin_audit_logs` con la siguiente informaciÃ³n:

- **Actor**: ID del administrador (`adminUserId`)
- **AcciÃ³n**: Tipo de evento (ej: `login`, `eliminar`, `update_config`)
- **Entidad**: Objeto afectado (ej: `Reserva`, `Configuracion`)
- **Detalles**: Snapshot JSON de los datos relevantes (ej: backup de una reserva eliminada)
- **Contexto**: DirecciÃ³n IP y User Agent

### Eventos Registrados Actualmente

1. **Seguridad**:
   - Inicio de sesiÃ³n (`login`)
   - Cierre de sesiÃ³n (`logout`)
2. **ConfiguraciÃ³n**:
   - Cambios en variables globales (`update_config`), como activar/desactivar el modal de WhatsApp anterior.
3. **GestiÃ³n de Reservas**:
   - **EliminaciÃ³n (`accion: eliminar`)**: Implementado en Febrero 2026 tras incidente de pÃ©rdida de datos. Registra todos los detalles de la reserva eliminada para permitir su recuperaciÃ³n manual si fuera necesario.

### Consultas de AuditorÃ­a

Actualmente los logs se pueden consultar directamente en la base de datos:

```sql
SELECT * FROM admin_audit_logs ORDER BY created_at DESC;
```

> [!IMPORTANT]
> **RecuperaciÃ³n de Datos**: Si una reserva es eliminada accidentalmente, buscar en este log el evento `accion='eliminar'` y `entidadId=[ID]`. El campo `detalles` contendrÃ¡ el JSON con la informaciÃ³n necesaria para restaurarla.

### 5.22 Sistema de RecuperaciÃ³n de Detalles Incompletos

Implementado en Febrero 2026 para gestionar el escenario donde un cliente completa un pago Express pero cierra la ventana antes de rellenar la direcciÃ³n logÃ­stica.

#### Componentes del Sistema

1.  **IdentificaciÃ³n Visual (Panel Admin)**:
    - El campo virtual `detallesCompletos` en el modelo `Reserva` detecta la falta de direcciÃ³n geogrÃ¡fica.
    - En `AdminReservas`, estas reservas se marcan con un badge rojo **"âš ï¸ Detalles Incompletos"**.

2.  **Mecanismo de Solicitud**:
    - BotÃ³n **"ðŸ“§ Solicitar Datos Faltantes"** en el modal de detalles del Administrador.
    - EnvÃ­a un correo automÃ¡tico con un enlace personalizado que lleva al cliente directamente a su reserva.

3.  **ActualizaciÃ³n AutÃ³noma**: - El cliente accede a `ConsultarReserva.jsx`, ve un aviso destacado y puede abrir el formulario de `CompletarDetalles` sin necesidad de login adicional. - Una vez guardados los datos, la reserva se actualiza en tiempo real y desaparece la alerta roja en el panel del administrador.
    1647:
    1648: ### 5.23 Sistema de RecuperaciÃ³n de Leads Abandonados (HeroExpress)
    1649:
    1650: Implementado en Marzo 2026 para maximizar la conversiÃ³n en el mÃ³dulo HeroExpress, capturando datos de clientes que inician una cotizaciÃ³n pero no completan el pago.
    1651:
    1652: #### Funcionamiento TÃ©cnico
    1653:
    1654: 1. **Captura Silenciosa (Frontend)**:
    1655: - El componente `HeroExpress.jsx` utiliza un mecanismo de **debounce** (500ms) para capturar los datos del formulario (`nombre`, `email`, `telÃ©fono`, `ruta`, `precio`) tan pronto como el cliente los ingresa.
    1656: - Los datos se envÃ­an de forma asÃ­ncrona al endpoint `/api/reservas/capturar-lead` sin interrumpir la experiencia del usuario.
    1657:
    1658: 2. **Persistencia y Cola de Correo (Backend)**:
    1659: - El backend crea o actualiza un registro de reserva en estado `pendiente`.
    1660: - Un proceso en segundo plano (`emailProcessor.js`) detecta estas reservas abandonadas (que no han pasado a `pagado` tras un tiempo prudencial) y programa un correo de recuperaciÃ³n.
    1661:
    1662: 3. **Correo de RecuperaciÃ³n Mejorado**:
    1663: - Se utiliza la acciÃ³n `send_lead_recovery` en el script PHP.
    1664: - El correo incluye un **enlace de pago directo** que redirige al cliente a Flow con el monto exacto cotizado, facilitando la conversiÃ³n en un solo clic.
    1665: - El enlace utiliza el endpoint `/api/reservas/:id/pay-redirect` para generar el pago dinÃ¡micamente.
    1666:
    1667: 4. **Monitoreo y Respaldo (Admin BCC)**:
    1668: - Para garantizar el seguimiento manual, se aÃ±ade una copia oculta (**BCC**) al administrador (`widomartinez@gmail.com`) en todos los correos de recuperaciÃ³n de leads.
    1669: - Si el envÃ­o de correo falla definitivamente tras 3 intentos, el sistema envÃ­a una **alerta de fallo crÃ­tico** al administrador.
    1670:
    1671: 5. **Seguimiento Administrativo**:
    1672: - En `AdminReservas`, los leads abandonados muestran un botÃ³n de **"Seguimiento WhatsApp"** que permite al administrador copiar un mensaje personalizado y contactar al cliente de forma manual si el correo automÃ¡tico no surte efecto.
    1673:
    1674: ---

### 5.24 Sistema de Persistencia y Robustez de Pagos

**Implementado: Marzo 2026**

Este sistema garantiza que no se pierdan datos de conversiÃ³n de Google Ads ni trazabilidad de pagos, incluso ante fallos de red o latencia en la API de Flow.

#### Componentes TÃ©cnicos

1.  **Modelo `FlowToken`**:
    - Tabla en la base de datos que registra cada `token` generado por Flow en el momento de la creaciÃ³n del pago.
    - **Datos persistidos**: `amount` (monto real cotizado), `email` del cliente, `reservaId`, `paymentOrigin` y `metadata` JSON.
    - **ExpiraciÃ³n**: Los tokens tienen una validez de 1 hora en la base de datos.

2.  **Estrategia de Fallback en Cascada**:
    Al retornar de la pasarela, el sistema intenta recuperar el monto para la conversiÃ³n en este orden:
    1.  **Flow API**: Intenta una llamada `getStatus` a Flow.
    2.  **Metadata Local**: Si Flow API falla, busca el token en la tabla `FlowToken`.
    3.  **Base de Datos**: Si lo anterior falla, busca el monto en la tabla `Reserva` asociada.
    4.  **Monto SimbÃ³lico**: Como Ãºltimo recurso, envÃ­a un valor centinela (`1.0 CLP`) para evitar que Google Ads registre una conversiÃ³n de valor cero.

3.  **NormalizaciÃ³n de ParÃ¡metros**:
    - El backend es agnÃ³stico al componente que origina el pago.
    - Acepta indistintamente `reservaId` o `reservationId` (usado en componentes de productos).
    - Identifica el origen mediante `paymentOrigin` para decidir la ruta de redirecciÃ³n final (Home vs generic FlowReturn).

#### Flujos Cubiertos

- **Express**: Home â†’ CotizaciÃ³n â†’ Pago.
- **Pagar con CÃ³digo**: Uso de cÃ³digos de prepago.
- **Consulta de Reserva**: Pago de saldos pendientes.
- **Oportunidades**: Compra de retornos con descuento.
- **Banners**: Reservas desde promociones destacadas.
- **Productos**: AdiciÃ³n de servicios extras (cafÃ©, WiFi, etc.) post-reserva.

---

## 6. Mantenimiento y Despliegue

### 6.1 Acceso SSH a Hostinger (Hosting Compartido)

El frontend React (build) y los scripts PHP se alojan en el hosting compartido de Hostinger. A continuaciÃ³n se documentan los datos de conexiÃ³n y el flujo de trabajo para administrar el servidor de forma remota.

#### Datos de ConexiÃ³n SSH

| Campo          | Valor            |
| -------------- | ---------------- |
| **IP**         | `82.112.246.242` |
| **Puerto**     | `65002`          |
| **Usuario**    | `u419311572`     |
| **ContraseÃ±a** | `TeamoGadiel7.`  |

> [!IMPORTANT]
> Hostinger usa un **puerto no estÃ¡ndar** (`65002`). Siempre especificarlo explÃ­citamente con `-p 65002`, de lo contrario la conexiÃ³n fallarÃ¡.

#### Comando de ConexiÃ³n

```bash
ssh u419311572@82.112.246.242 -p 65002
```

#### Estructura de Directorios en el Servidor

```
/home/u419311572/                                          â† RaÃ­z del usuario (home)
â””â”€â”€ domains/
    â””â”€â”€ transportesaraucaria.cl/
        â””â”€â”€ public_html/                                   â† Document root del sitio web
            â”œâ”€â”€ index.html                                 â† Frontend React (build)
            â”œâ”€â”€ assets/                                    â† JS/CSS del build de Vite
            â””â”€â”€ *.php                                      â† Scripts PHP (emails, etc.)
```

> [!TIP]
> Al conectarte por SSH, usa `pwd` para verificar en quÃ© directorio estÃ¡s y `ls` para listar archivos. Por defecto te posicionas en `/home/u419311572/`.

#### Comandos SSH Esenciales

```bash
# Verificar ubicaciÃ³n actual
pwd

# Ir al document root del sitio
cd /home/u419311572/domains/transportesaraucaria.cl/public_html/

# Listar archivos del directorio actual
ls -la

# Ver el contenido de un archivo PHP
cat enviar_correo_mejorado.php

# Editar un archivo directamente en el servidor (editor nano)
nano enviar_correo_mejorado.php

# Ver las Ãºltimas lÃ­neas de un log (si existe)
tail -n 50 error_log

# Salir de la sesiÃ³n SSH
exit
```

#### Flujo de Trabajo para Actualizar Archivos PHP

Los archivos PHP **se despliegan manualmente** (no hay CI/CD para Hostinger). El flujo recomendado es:

1. **Editar localmente** el archivo `.php` en el repositorio.
2. **Agregar el comentario de aviso** al inicio del archivo (ver regla en `AGENTS.md`):
   ```php
   <?php
   // AVISO: Este archivo se despliega manualmente en Hostinger (frontend y PHP en Hostinger).
   // Cualquier cambio local debe subirse manualmente al servidor.
   ```
3. **Subir el archivo** al servidor. Opciones:
   - **SFTP** (recomendado con FileZilla u otro cliente): mismos datos que SSH.
   - **SCP desde terminal**:
     ```bash
     scp -P 65002 ./ruta/local/archivo.php u419311572@82.112.246.242:/home/u419311572/domains/transportesaraucaria.cl/public_html/
     ```
4. **Verificar** conectÃ¡ndose por SSH y revisando el archivo subido.

#### Flujo de Trabajo para Actualizar el Frontend (Build React)

El build de Vite genera la carpeta `dist/`. Su contenido se sube al `public_html/`:

```bash
# 1. Generar el build localmente
npm run build

# 2. Subir la carpeta dist/ completa por SFTP o SCP
scp -P 65002 -r ./dist/* u419311572@82.112.246.242:/home/u419311572/domains/transportesaraucaria.cl/public_html/
```

> [!WARNING]
> Al subir el build, los archivos en `assets/` cambian de nombre (hash de Vite). Si subes solo algunos archivos delta, puede quedar una versiÃ³n inconsistente. **Siempre sube el contenido completo de `dist/`**.

#### SoluciÃ³n de Problemas SSH

| SÃ­ntoma              | Causa probable                   | SoluciÃ³n                                        |
| -------------------- | -------------------------------- | ----------------------------------------------- |
| `Connection refused` | Puerto incorrecto                | Asegurarse de usar `-p 65002`                   |
| `Permission denied`  | ContraseÃ±a incorrecta            | Verificar/cambiar contraseÃ±a en panel Hostinger |
| SSH deshabilitado    | El acceso SSH puede desactivarse | Activarlo en Hostinger â†’ Avanzado â†’ Acceso SSH  |
| Archivo no aparece   | Ruta equivocada                  | Navegar a `public_html/` y verificar con `ls`   |

