# 📘 Documentación Maestra - Transportes Araucaria

> **Última Actualización**: Diciembre 2025
> **Versión**: 1.0 (Unificada)

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
- **Finanzas**: Control de gastos, estadísticas y códigos de pago.
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
