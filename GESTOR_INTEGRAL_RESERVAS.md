# 🎯 Gestor Integral de Reservas - Guía Completa

## 📋 Índice
1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Dashboard de Estadísticas](#dashboard-de-estadísticas)
4. [Vistas del Gestor](#vistas-del-gestor)
5. [Wizard de Creación](#wizard-de-creación)
6. [Gestión de Reservas](#gestión-de-reservas)
7. [Flujos de Trabajo](#flujos-de-trabajo)
8. [Arquitectura Técnica](#arquitectura-técnica)
9. [Mejoras Futuras](#mejoras-futuras)

---

## 🎉 Introducción

El **Gestor Integral de Reservas** es un sistema unificado que centraliza toda la gestión del ciclo de vida de las reservas en un único flujo de trabajo intuitivo y eficiente.

### ✨ Características Principales

- **Dashboard con Métricas en Tiempo Real**: Visualiza KPIs clave al instante
- **3 Vistas Intercambiables**: Lista, Calendario y Kanban
- **Wizard Simplificado**: Crea reservas en 3 pasos simples
- **Filtros Avanzados**: Busca y filtra por múltiples criterios
- **Gestión Completa**: Ver detalles, editar estados, agregar observaciones
- **Responsive Design**: Funciona perfectamente en desktop, tablet y móvil
- **100% en Español**: Interfaz, comentarios y documentación

---

## 🚀 Acceso al Sistema

### Ubicación

El Gestor Integral está integrado en el panel administrativo:

**URL**: `/admin?panel=reservas`

O simplemente haz clic en **"Reservas"** en el menú lateral del panel administrativo.

### Requisitos

- Cuenta de administrador activa
- Token de autenticación válido (JWT)
- Navegador moderno con JavaScript habilitado

---

## 📊 Dashboard de Estadísticas

Al ingresar al gestor, verás un dashboard con 4 tarjetas de métricas clave:

### 1. Total Reservas
- **Indicador**: Número total de reservas en el sistema
- **Tendencia**: Porcentaje de cambio respecto al periodo anterior
- **Badges**: 
  - Reservas Pendientes (amarillo)
  - Reservas Confirmadas (azul)

### 2. Ingresos Totales
- **Indicador**: Suma total de ingresos de reservas pagadas
- **Formato**: CLP (Peso Chileno)
- **Tendencia**: Porcentaje de cambio en ingresos
- **Info adicional**: Número de reservas pagadas

### 3. Pendiente de Pago
- **Indicador**: Monto total pendiente de cobro
- **Color**: Naranja (alerta)
- **Info adicional**: Número de reservas sin pagar

### 4. Estado de Servicios
- **Indicador**: Número de servicios completados
- **Badges**:
  - Servicios Finalizados (verde)
  - Servicios Cancelados (rojo)

---

## 📱 Vistas del Gestor

El gestor ofrece 3 vistas diferentes para adaptarse a tu forma de trabajo:

### 🗂️ Vista de Lista

**Descripción**: Tabla detallada con todas las reservas

**Características**:
- ✅ Tabla responsive con 10 columnas
- ✅ Búsqueda en tiempo real (nombre, email, teléfono, código)
- ✅ Filtros por estado de reserva y estado de pago
- ✅ Paginación automática (20 items por página)
- ✅ Badges de color por estado
- ✅ Acciones rápidas (Ver/Editar)

**Columnas**:
1. ID y Código de Reserva
2. Cliente
3. Contacto (Email y Teléfono)
4. Ruta (Origen → Destino)
5. Fecha y Hora
6. Número de Pasajeros
7. Total (con formato CLP)
8. Estado de Reserva
9. Estado de Pago
10. Acciones

**Uso**:
```
1. Busca una reserva por nombre o código
2. Aplica filtros para refinar resultados
3. Haz clic en el ícono del ojo 👁️ para ver detalles
4. Haz clic en el ícono de lápiz ✏️ para editar
```

---

### 📅 Vista de Calendario

**Descripción**: Calendario mensual con reservas agrupadas por día

**Características**:
- ✅ Vista mensual completa
- ✅ Navegación entre meses (anterior/siguiente)
- ✅ Botón "Hoy" para volver al mes actual
- ✅ Indicador visual del día actual (borde azul)
- ✅ Reservas coloreadas por estado
- ✅ Contador de reservas por día
- ✅ Vista rápida de primeras 3 reservas del día

**Colores por Estado**:
- 🟡 **Amarillo**: Pendiente
- 🔵 **Azul**: Confirmada
- 🟢 **Verde**: Completada
- 🔴 **Rojo**: Cancelada
- 🟠 **Naranja**: Pendiente Detalles

**Uso**:
```
1. Navega entre meses con las flechas ← →
2. Identifica días con múltiples reservas (badge con número)
3. Haz clic en una reserva para ver detalles
4. Usa la leyenda inferior para identificar estados
```

**Casos de Uso Ideales**:
- Planificación de rutas semanales
- Identificación de días con alta demanda
- Visualización de reservas futuras
- Detección de conflictos de horario

---

### 📋 Vista Kanban

**Descripción**: Tablero visual con reservas organizadas por estado

**Características**:
- ✅ 4 columnas por estado
- ✅ Tarjetas visuales compactas
- ✅ Contador de reservas por columna
- ✅ Información esencial en cada tarjeta
- ✅ Alertas visuales (saldo pendiente)
- ✅ Estadísticas rápidas en el footer

**Columnas**:
1. **Pendientes** (Amarillo)
   - Estados: pendiente, pendiente_detalles
   - Icono: Reloj ⏰

2. **Confirmadas** (Azul)
   - Estados: confirmada
   - Icono: Check ✓

3. **Completadas** (Verde)
   - Estados: completada
   - Icono: Check doble ✓✓

4. **Canceladas** (Rojo)
   - Estados: cancelada
   - Icono: X ✗

**Información en Tarjetas**:
- Nombre del cliente
- ID de reserva
- Estado de pago (badge)
- Ruta (origen → destino)
- Fecha y hora
- Número de pasajeros
- Monto total
- Alertas (ej: saldo pendiente)

**Uso**:
```
1. Revisa rápidamente el estado general del negocio
2. Identifica cuellos de botella (columnas con muchas reservas)
3. Haz clic en cualquier tarjeta para ver detalles
4. Prioriza reservas pendientes de atención
```

**Casos de Uso Ideales**:
- Seguimiento del flujo de trabajo
- Priorización de tareas
- Identificación de reservas estancadas
- Visualización del pipeline de servicios

---

## 🧙 Wizard de Creación

El **Wizard de Creación de Reservas** simplifica el proceso en 3 pasos claros y validados.

### 🎯 Acceso

Haz clic en el botón **"+ Nueva Reserva"** en la esquina superior derecha del gestor.

---

### 📝 Paso 1: Información del Cliente y Ruta

**Datos del Cliente**:
- ✅ Nombre Completo (obligatorio)
- ✅ Email (obligatorio, validado)
- ✅ Teléfono (obligatorio)
- ⭕ RUT (opcional)

**Datos de la Ruta**:
- ✅ Origen (obligatorio, lista desplegable)
- ✅ Destino (obligatorio, lista desplegable)
- ✅ Fecha (obligatorio, no puede ser pasada)
- ✅ Hora (opcional, por defecto 08:00)
- ✅ Número de Pasajeros (1-8)

**Destinos Disponibles**:
- Aeropuerto La Araucanía
- Temuco Centro
- Terminal de Buses Temuco
- Pucón
- Villarrica
- Angol
- Victoria
- Lautaro
- Cunco

**Validaciones**:
- Email con formato válido (@domain.com)
- Fecha igual o posterior al día actual
- Todos los campos obligatorios completos

---

### 🗓️ Paso 2: Detalles del Viaje

**Opciones de Viaje**:
- ☑️ **Ida y Vuelta**: Aplica descuento del 10%
  - Si se marca, solicita Fecha y Hora de Regreso

**Información Adicional** (Todo opcional):
- Número de Vuelo
- Hotel
- Equipaje Especial (textarea)
- Requiere Silla Infantil (checkbox)
- Mensaje o Comentarios

**Validaciones**:
- Si "Ida y Vuelta" está marcado, fecha de regreso es obligatoria
- Fecha de regreso no puede ser anterior a fecha de ida

---

### ✅ Paso 3: Confirmación y Resumen

**Secciones del Resumen**:

1. **Cliente** (fondo gris):
   - Nombre
   - Email
   - Teléfono

2. **Viaje** (fondo azul):
   - Ruta completa con íconos
   - Fecha con día de semana completo
   - Hora de salida
   - Badge de "Ida y Vuelta" si aplica
   - Número de pasajeros

3. **Resumen Financiero** (fondo verde):
   - Precio Base
   - Descuento Ida y Vuelta (10%) - si aplica
   - Descuento Online (5%) - siempre aplica
   - **Total** (destacado en grande)
   - Abono sugerido (50%)

**Cálculo de Precios**:
```javascript
Precio Base: $30,000 CLP
Si pasajeros > 4: Precio Base * 1.5

Si Ida y Vuelta:
  - Precio total = Precio Base * 2
  - Descuento = 10% del precio total

Descuento Online: 5% siempre

Total = Precio Base - Descuentos
Abono Sugerido = 50% del Total
```

**Aviso Importante**:
```
⚠️ La reserva se creará con estado "Pendiente". 
Recuerda confirmarla y asignar vehículo/conductor 
cuando corresponda.
```

---

### 🔘 Navegación del Wizard

**Botones**:
- **Paso 1**: [Cancelar] - [Siguiente →]
- **Paso 2**: [← Anterior] - [Siguiente →]
- **Paso 3**: [← Anterior] - [✓ Crear Reserva]

**Indicador Visual**:
- Pasos completados: ✓ en círculo verde
- Paso actual: Número en círculo azul
- Pasos pendientes: Número en círculo gris
- Líneas conectoras: Verde (completadas), Gris (pendientes)

---

## 🔧 Gestión de Reservas

### 👁️ Ver Detalles

**Modal de Detalles Completos**:

Muestra toda la información de la reserva organizada en secciones:

1. **Encabezado**:
   - Estado de Reserva (badge)
   - Estado de Pago (badge)
   - Código de Reserva (si existe)
   - Botón "Editar" (esquina superior derecha)

2. **Información del Cliente**:
   - Nombre Completo
   - RUT (si existe)
   - Email con ícono ✉️
   - Teléfono con ícono 📞

3. **Detalles del Viaje**:
   - Origen y Destino
   - Direcciones específicas (si existen)
   - Fecha de Ida con formato largo
   - Hora
   - Número de Pasajeros
   - **Si es Ida y Vuelta**: Panel azul especial con fecha/hora regreso
   - Número de Vuelo (si existe)
   - Hotel (si existe)
   - Equipaje Especial (si existe)
   - Silla Infantil (badge si es Sí)
   - **Asignación**: Panel gris con Vehículo y Conductor (si existen)

4. **Información Financiera**:
   - Precio Base
   - Total con Descuento (grande, verde)
   - **Panel de Descuentos** (si hay alguno):
     - Descuento Base
     - Descuento Promoción
     - Descuento Ida y Vuelta
     - Descuento Online
   - Abono Sugerido
   - **Saldo Pendiente** (rojo si existe)
   - Método de Pago
   - Referencia de Pago (formato monospace)

5. **Notas y Comentarios**:
   - Mensaje del Cliente (fondo gris)
   - Observaciones Internas (fondo azul)

6. **Información Técnica**:
   - Origen de la reserva
   - Fecha de creación
   - Fecha de última actualización

---

### ✏️ Editar Reserva

**Modal de Edición Simplificado**:

Enfocado en cambios rápidos de estado y observaciones:

**Campos Editables**:

1. **Estado de Reserva** (desplegable):
   - Pendiente
   - Pendiente Detalles
   - Confirmada
   - Completada
   - Cancelada

2. **Estado de Pago** (desplegable):
   - Pendiente
   - Aprobado
   - Parcial
   - Pagado
   - Fallido
   - Reembolsado

3. **Método de Pago** (desplegable):
   - Sin especificar
   - Flow
   - Transferencia
   - Efectivo
   - Otro

4. **Referencia de Pago** (textarea):
   - Campo libre para ID de transacción
   - Número de operación
   - Cualquier referencia de pago

5. **Observaciones Internas** (textarea):
   - Notas privadas del administrador
   - No visibles para el cliente
   - Historial de llamadas, cambios, etc.

**Panel de Resumen Financiero** (solo lectura):
- Total a pagar
- Abono sugerido (si existe)
- Saldo pendiente (en rojo si existe)

**Botones**:
- [Cancelar] (cierra sin guardar)
- [Guardar Cambios] (guarda y cierra)

**Validación**:
- Guardado asíncrono con feedback
- Mensajes de error claros si falla
- Recarga automática de datos al guardar

---

## 🔄 Flujos de Trabajo

### Flujo 1: Atender Nueva Reserva

```
1. Dashboard → Ver "X Pendientes" en tarjeta de Total Reservas
2. Vista Lista → Aplicar filtro "Estado: Pendiente"
3. Click en ojo 👁️ → Revisar detalles completos
4. Verificar datos del cliente y ruta
5. Click en "Editar" → Cambiar estado a "Confirmada"
6. Agregar observaciones si es necesario
7. [Guardar Cambios]
```

**Tiempo estimado**: 2-3 minutos

---

### Flujo 2: Registrar Pago Recibido

```
1. Vista Lista → Buscar por nombre o teléfono del cliente
2. Click en lápiz ✏️ → Abrir modal de edición
3. Cambiar "Estado de Pago" a "Pagado"
4. Seleccionar "Método de Pago" (Flow, Transferencia, etc.)
5. Ingresar "Referencia de Pago" (ej: "Flow-ORD-12345")
6. Agregar observación: "Pago recibido y confirmado el DD/MM/YYYY"
7. [Guardar Cambios]
```

**Tiempo estimado**: 1-2 minutos

---

### Flujo 3: Completar Servicio

```
1. Vista Kanban → Ir a columna "Confirmadas"
2. Identificar reserva de hoy completada
3. Click en tarjeta → Ver detalles
4. Verificar que el pago esté completo
5. Click en "Editar"
6. Cambiar estado a "Completada"
7. Agregar observación: "Servicio completado sin novedades"
8. [Guardar Cambios]
```

**Tiempo estimado**: 1-2 minutos

---

### Flujo 4: Cancelar Reserva

```
1. Vista Lista → Buscar la reserva
2. Click en lápiz ✏️ → Abrir edición
3. Cambiar "Estado de Reserva" a "Cancelada"
4. Si hubo pago: Cambiar "Estado de Pago" a "Reembolsado"
5. Agregar observación con motivo:
   - "Cancelada por el cliente el DD/MM/YYYY"
   - "Motivo: [explicación]"
6. [Guardar Cambios]
```

**Tiempo estimado**: 2-3 minutos

---

### Flujo 5: Planificar Semana

```
1. Vista Calendario → Navegar al lunes de la semana
2. Identificar días con más reservas (badge con número)
3. Click en reservas de cada día → Verificar detalles
4. Anotar:
   - Rutas similares para agrupar
   - Horarios de pico
   - Necesidades especiales (silla infantil, equipaje)
5. Asignar vehículos y conductores según capacidad
```

**Tiempo estimado**: 15-20 minutos por semana

---

## 🏗️ Arquitectura Técnica

### Estructura de Componentes

```
GestorIntegralReservas.jsx (Componente Principal)
├── Dashboard de 4 KPIs
├── Tabs de navegación (Lista, Calendario, Kanban)
├── Botón "Nueva Reserva"
│
├── VistaListaReservas.jsx
│   ├── Filtros y Búsqueda
│   ├── Tabla de Reservas
│   ├── Paginación
│   ├── DetalleReserva.jsx (Modal)
│   └── EditarReserva.jsx (Modal)
│
├── VistaCalendarioReservas.jsx
│   ├── Navegación de Meses
│   ├── Grilla de Calendario
│   ├── DetalleReserva.jsx (Modal)
│   └── EditarReserva.jsx (Modal)
│
├── VistaKanbanReservas.jsx
│   ├── 4 Columnas por Estado
│   ├── Tarjetas de Reserva
│   ├── Estadísticas Footer
│   ├── DetalleReserva.jsx (Modal)
│   └── EditarReserva.jsx (Modal)
│
└── WizardReserva.jsx (Modal)
    ├── Paso 1: Cliente y Ruta
    ├── Paso 2: Detalles
    └── Paso 3: Confirmación
```

---

### Stack Tecnológico

**Frontend**:
- React 19.2.0
- Vite 6.3.6
- Tailwind CSS 4.1.7
- Radix UI (componentes base)
- Lucide React (íconos)
- date-fns 4.1.0 (manejo de fechas)

**Backend** (no modificado):
- Node.js + Express
- Sequelize ORM
- PostgreSQL
- Render.com

**Notificaciones** (no modificado):
- PHPMailer
- Hostinger

---

### Endpoints Utilizados

```javascript
// Listar todas las reservas
GET /api/reservas
Headers: { Authorization: "Bearer {token}" }

// Crear nueva reserva
POST /api/reservas
Headers: { 
  Authorization: "Bearer {token}",
  Content-Type: "application/json"
}
Body: { ...datosReserva }

// Actualizar reserva
PUT /api/reservas/:id
Headers: { 
  Authorization: "Bearer {token}",
  Content-Type: "application/json"
}
Body: { ...datosActualizados }

// Obtener detalles de una reserva
GET /api/reservas/:id
Headers: { Authorization: "Bearer {token}" }
```

---

### Modelo de Datos (Reserva)

```javascript
{
  // Identificación
  id: Integer (PK, auto-increment),
  codigoReserva: String (único, formato: AR-YYYYMMDD-XXXX),
  
  // Cliente
  clienteId: Integer (FK, opcional),
  rut: String,
  nombre: String (requerido),
  email: String (requerido),
  telefono: String (requerido),
  
  // Ruta
  origen: String (requerido),
  destino: String (requerido),
  direccionOrigen: String,
  direccionDestino: String,
  
  // Viaje
  fecha: Date (requerido),
  hora: Time,
  pasajeros: Integer (default: 1),
  idaVuelta: Boolean (default: false),
  fechaRegreso: Date,
  horaRegreso: Time,
  
  // Detalles
  numeroVuelo: String,
  hotel: String,
  equipajeEspecial: Text,
  sillaInfantil: Boolean (default: false),
  mensaje: Text,
  
  // Asignación
  vehiculoId: Integer (FK),
  vehiculo: String,
  conductorId: Integer (FK),
  
  // Financiero
  precio: Decimal(10,2),
  descuentoBase: Decimal(10,2),
  descuentoPromocion: Decimal(10,2),
  descuentoRoundTrip: Decimal(10,2),
  descuentoOnline: Decimal(10,2),
  totalConDescuento: Decimal(10,2),
  abonoSugerido: Decimal(10,2),
  saldoPendiente: Decimal(10,2),
  
  // Pago
  estadoPago: ENUM (pendiente, aprobado, parcial, pagado, fallido, reembolsado),
  metodoPago: String,
  tipoPago: String,
  pagoId: String,
  pagoGateway: String,
  pagoMonto: Decimal(10,2),
  pagoFecha: DateTime,
  referenciaPago: String,
  
  // Estado
  estado: ENUM (pendiente, pendiente_detalles, confirmada, completada, cancelada),
  observaciones: Text,
  
  // Metadata
  source: String (default: "web"),
  ipAddress: String,
  userAgent: Text,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

### Estados de Reserva

**Flujo Normal**:
```
pendiente → confirmada → completada
```

**Flujo con Falta de Datos**:
```
pendiente → pendiente_detalles → confirmada → completada
```

**Flujo de Cancelación**:
```
(cualquier estado) → cancelada
```

**Descripciones**:

- **pendiente**: Reserva creada, esperando confirmación
- **pendiente_detalles**: Falta información (vuelo, hotel, etc.)
- **confirmada**: Reserva confirmada, lista para el servicio
- **completada**: Servicio realizado exitosamente
- **cancelada**: Reserva cancelada por cualquier motivo

---

### Estados de Pago

**Flujo Normal**:
```
pendiente → aprobado → pagado
```

**Flujo Parcial**:
```
pendiente → parcial → pagado
```

**Flujo de Fallo**:
```
pendiente → fallido → (reintentar) → pagado
```

**Flujo de Reembolso**:
```
pagado → reembolsado
```

**Descripciones**:

- **pendiente**: Sin pago registrado
- **aprobado**: Pago aprobado por gateway, pendiente de confirmación
- **parcial**: Abono pagado, falta saldo
- **pagado**: Pago completo confirmado
- **fallido**: Intento de pago rechazado
- **reembolsado**: Pago devuelto al cliente

---

## 🚀 Mejoras Futuras

### Fase 2: Backend y Automatizaciones

- [ ] Endpoint `/api/dashboard/stats` para KPIs reales
- [ ] Cálculo de tendencias basado en datos históricos
- [ ] Asignación automática de vehículo según:
  - Capacidad disponible
  - Disponibilidad de conductor
  - Tipo de servicio
- [ ] Validación de disponibilidad en tiempo real
- [ ] Detección de conflictos de horario
- [ ] Sugerencias de conductores disponibles

### Fase 3: Timeline y Historial

- [ ] Componente `TimelineReserva.jsx`
- [ ] Registro automático de cambios
- [ ] Historial de modificaciones con usuario y fecha
- [ ] Vista de actividad por reserva
- [ ] Exportar historial a PDF

### Fase 4: Notificaciones

- [ ] Notificaciones en tiempo real (WebSocket)
- [ ] Alertas de reservas próximas a vencer
- [ ] Recordatorios de pagos pendientes
- [ ] Notificaciones de cambios de estado
- [ ] Integración con sistema de correos existente

### Fase 5: Drag and Drop en Kanban

- [ ] Librería `react-beautiful-dnd`
- [ ] Arrastrar tarjetas entre columnas
- [ ] Cambio automático de estado al mover
- [ ] Confirmación antes de cambiar
- [ ] Animaciones suaves

### Fase 6: Exportaciones

- [ ] Exportar a Excel (todas las vistas)
- [ ] Exportar a PDF con formato
- [ ] Generar reportes personalizados
- [ ] Filtros en exportaciones
- [ ] Programar exportaciones automáticas

### Fase 7: Optimizaciones

- [ ] Lazy loading de componentes pesados
- [ ] Code splitting por vista
- [ ] Caché inteligente de reservas
- [ ] Service Worker para offline
- [ ] Reducir tamaño del bundle

### Fase 8: Accesibilidad

- [ ] Navegación completa por teclado
- [ ] Lectores de pantalla (ARIA labels)
- [ ] Contraste mejorado (WCAG AAA)
- [ ] Modo de alto contraste
- [ ] Tamaños de fuente ajustables

---

## 📞 Soporte y Contacto

**Desarrollado por**: GitHub Copilot  
**Supervisado por**: @WidoMartinez  
**Versión**: 1.0.0  
**Fecha**: Diciembre 2025  
**Status**: ✅ COMPLETADO

### Reportar Problemas

Si encuentras algún bug o tienes sugerencias:

1. **Issue en GitHub**: Crear issue en el repositorio
2. **Email**: soporte@transportesaraucaria.cl
3. **Documentación**: Ver archivos .md en el repo

---

## 📄 Licencia

Este sistema es parte del proyecto Transportes Araucaria y está sujeto a las mismas políticas y licencias del proyecto principal.

---

**¡Gracias por usar el Gestor Integral de Reservas! 🎉**

Si tienes dudas, consulta esta documentación o contacta al equipo de soporte.
