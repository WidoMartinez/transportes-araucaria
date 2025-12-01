# 🏗️ Arquitectura del Panel de Administración

## 📖 Visión General

Este documento describe la arquitectura reorganizada del panel de administración de Transportes Araucaria, diseñada para proporcionar una experiencia óptima, eficiente e intuitiva.

## 🎯 Objetivos de Diseño

### 1. Experiencia de Usuario Óptima
- **Navegación intuitiva**: Agrupación lógica de funcionalidades
- **Diseño consistente**: Misma UI/UX en todos los módulos
- **Feedback visual claro**: Estados, confirmaciones y errores evidentes
- **Accesibilidad**: Cumplimiento de estándares WCAG

### 2. Eficiencia Operacional
- **Accesos rápidos**: Dashboard con acciones frecuentes
- **Búsquedas avanzadas**: Filtros y búsqueda en todos los módulos
- **Operaciones masivas**: Acciones sobre múltiples registros
- **Atajos de teclado**: Navegación rápida por teclado

### 3. Inteligencia del Sistema
- **Métricas en tiempo real**: KPIs actualizados automáticamente
- **Alertas contextuales**: Notificaciones relevantes al momento
- **Sugerencias automáticas**: Recomendaciones basadas en patrones
- **Validaciones inteligentes**: Prevención de errores comunes

## 🗂️ Estructura Organizacional

### Categorías Principales

#### 📊 Dashboard (Vista Principal)
**Propósito**: Resumen ejecutivo y acceso rápido a funciones principales

**Componentes**:
- KPIs principales (reservas hoy, ingresos del mes, ocupación)
- Gráficos de tendencias
- Alertas y notificaciones importantes
- Accesos rápidos a acciones frecuentes
- Resumen de actividad reciente

#### 🚗 Operaciones
**Propósito**: Gestión del día a día del negocio

**Módulos**:
1. **Reservas** (`AdminReservas.jsx`)
   - Gestión de reservas y clientes
   - Autocompletado de clientes
   - Historial por cliente
   - Estados y pagos

2. **Vehículos** (`AdminVehiculos.jsx`)
   - Control de flota
   - Estados de vehículos
   - Mantenimiento y disponibilidad

3. **Conductores** (`AdminConductores.jsx`)
   - Gestión de personal
   - Disponibilidad y horarios
   - Licencias y documentación

#### 💰 Finanzas
**Propósito**: Control financiero y reportes

**Módulos**:
1. **Gastos** (`AdminGastos.jsx`)
   - Registro de gastos operativos
   - Categorización
   - Reportes de gastos

2. **Estadísticas** (`AdminEstadisticas.jsx`)
   - Dashboards analíticos
   - Gráficos de ingresos
   - Reportes personalizables

3. **Códigos de Pago** (`AdminCodigosPago.jsx`)
   - Códigos únicos de pago
   - Seguimiento de pagos pendientes
   - Conciliación de pagos

#### ⚙️ Configuración
**Propósito**: Ajustes del sistema y parámetros operacionales

**Módulos**:
1. **Precios** (`AdminPricing.jsx`)
   - Configuración de tarifas base
   - Descuentos globales
   - Promociones por día/horario

2. **Tarifa Dinámica** (`AdminTarifaDinamica.jsx`)
   - Reglas de ajuste automático
   - Multiplicadores por demanda
   - Fechas especiales

3. **Productos** (`AdminProductos.jsx`)
   - Catálogo de productos adicionales
   - Precios y disponibilidad

4. **Disponibilidad** (`AdminDisponibilidad.jsx`)
   - Bloqueo de fechas
   - Límites de capacidad
   - Horarios especiales

5. **Festivos** (`AdminFestivos.jsx`)
   - Calendario de festivos
   - Tarifas especiales
   - Restricciones

#### 🎟️ Marketing
**Propósito**: Herramientas de promoción y fidelización

**Módulos**:
1. **Códigos de Descuento** (`AdminCodigos.jsx`)
   - Gestión de cupones
   - Seguimiento de uso
   - Reportes de efectividad

2. **Códigos Mejorado** (`AdminCodigosMejorado.jsx`)
   - Versión avanzada con más funcionalidades
   - Códigos personalizados por cliente
   - Límites y validaciones

#### 👥 Sistema
**Propósito**: Administración del sistema y usuarios

**Módulos**:
1. **Usuarios** (`AdminUsuarios.jsx`)
   - Gestión de administradores
   - Roles y permisos
   - Auditoría de acciones
   - Solo para superadmin

2. **Mi Perfil** (`AdminPerfil.jsx`)
   - Configuración personal
   - Cambio de contraseña
   - Preferencias

## 🎨 Diseño de Interfaz

### Componentes Principales

#### 1. Header
```
┌─────────────────────────────────────────────────────┐
│ 🏢 Panel Administrativo - Transportes Araucaria    │
│                                                     │
│                        👤 [Nombre] [Rol] [Logout] │
└─────────────────────────────────────────────────────┘
```

#### 2. Menú Lateral (Nuevo)
```
┌──────────────────┐
│ 📊 Dashboard     │
├──────────────────┤
│ 🚗 Operaciones ▼ │
│   • Reservas     │
│   • Vehículos    │
│   • Conductores  │
├──────────────────┤
│ 💰 Finanzas ▼    │
│   • Gastos       │
│   • Estadísticas │
│   • Cód. Pago    │
├──────────────────┤
│ ⚙️ Configuración ▼│
│   • Precios      │
│   • Tar. Dinámica│
│   • Productos    │
│   • Disponibilidad│
│   • Festivos     │
├──────────────────┤
│ 🎟️ Marketing ▼   │
│   • Códigos      │
│   • Cód. Mejorado│
├──────────────────┤
│ 👥 Sistema ▼     │
│   • Usuarios     │
│   • Mi Perfil    │
└──────────────────┘
```

#### 3. Área de Contenido
```
┌─────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Operaciones > Reservas     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Contenido del módulo activo]                     │
│                                                     │
│  • Tablas con datos                                │
│  • Formularios                                     │
│  • Gráficos                                        │
│  • etc.                                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Paleta de Colores

#### Categorías
- **Dashboard**: Azul (#3B82F6)
- **Operaciones**: Verde (#10B981)
- **Finanzas**: Naranja (#F59E0B)
- **Configuración**: Morado (#8B5CF6)
- **Marketing**: Rosa (#EC4899)
- **Sistema**: Gris (#6B7280)

#### Estados
- **Éxito**: Verde (#10B981)
- **Error**: Rojo (#EF4444)
- **Advertencia**: Amarillo (#F59E0B)
- **Info**: Azul (#3B82F6)
- **Neutral**: Gris (#6B7280)

## 🔑 Atajos de Teclado

### Navegación
- `Ctrl + D` - Ir al Dashboard
- `Ctrl + R` - Ir a Reservas
- `Ctrl + V` - Ir a Vehículos
- `Ctrl + C` - Ir a Conductores
- `Ctrl + E` - Ir a Estadísticas
- `Ctrl + P` - Ir a Precios

### Acciones
- `N` - Nueva reserva/registro (contexto actual)
- `F` - Activar búsqueda
- `/` - Abrir menú de navegación rápida
- `Esc` - Cerrar modal/diálogo activo

### Sistema
- `?` - Mostrar ayuda/atajos
- `Ctrl + K` - Barra de comandos (Command Palette)

## 📱 Diseño Responsive

### Breakpoints
- **Desktop**: > 1024px - Menú lateral visible, contenido completo
- **Tablet**: 768px - 1024px - Menú colapsable, tabla adaptada
- **Mobile**: < 768px - Menú hamburguesa, vistas simplificadas

### Adaptaciones Móviles
- Tablas se convierten en cards
- Menú lateral se oculta en hamburguesa
- Filtros en drawer deslizable
- Formularios en pantalla completa

## 🔐 Roles y Permisos

### SuperAdmin
- Acceso completo a todos los módulos
- Gestión de usuarios
- Configuración del sistema

### Admin
- Acceso a Operaciones, Finanzas, Marketing
- Acceso de solo lectura a Configuración
- No puede gestionar usuarios

### Operador
- Acceso solo a Operaciones (Reservas, Vehículos, Conductores)
- No puede modificar configuraciones ni ver finanzas completas

## 📊 KPIs del Dashboard

### Métricas Principales
1. **Reservas Hoy**: Número de reservas programadas para hoy
2. **Ingresos del Mes**: Total facturado en el mes actual
3. **Ocupación**: Porcentaje de vehículos en uso
4. **Pendientes**: Reservas con pago pendiente

### Gráficos
1. **Reservas por Día** (Últimos 30 días)
2. **Ingresos Mensuales** (Últimos 12 meses)
3. **Top Destinos** (Mes actual)
4. **Distribución de Pagos** (Pie chart)

## 🔔 Sistema de Notificaciones

### Tipos de Alertas
1. **Críticas** (Rojo):
   - Reserva con conflicto de horario
   - Vehículo sin conductor asignado
   - Pago rechazado

2. **Importantes** (Amarillo):
   - Licencia de conductor próxima a vencer
   - Mantenimiento de vehículo pendiente
   - Reserva sin confirmación

3. **Informativas** (Azul):
   - Nueva reserva creada
   - Pago confirmado
   - Cliente frecuente detectado

### Canales
- **Panel Admin**: Badge con contador en header
- **Email**: Vía PHPMailer (Hostinger)
- **Push**: Futuro - notificaciones del navegador

## 🚀 Optimizaciones de Rendimiento

### Lazy Loading
- Módulos cargados bajo demanda
- Imágenes con lazy loading
- Datos paginados

### Caché
- Caché de configuraciones (precios, festivos)
- Caché de listas estáticas (destinos, productos)
- Invalidación inteligente al actualizar

### Optimización de Consultas
- Consultas con límites y paginación
- Índices en campos de búsqueda frecuente
- Joins optimizados

## 📚 Flujos de Trabajo Optimizados

### Flujo 1: Nueva Reserva
1. Clic en "Nueva Reserva" (Dashboard o módulo)
2. Autocompletado de cliente existente
3. Validación automática de disponibilidad
4. Sugerencia de vehículo y conductor
5. Cálculo automático de precio con descuentos
6. Confirmación y envío de notificación

### Flujo 2: Seguimiento de Reserva
1. Búsqueda rápida por código o cliente
2. Vista detallada con timeline
3. Actualización de estado
4. Asignación de conductor/vehículo
5. Confirmación de pago
6. Notificación automática al cliente

### Flujo 3: Reporte Financiero
1. Acceso a Estadísticas
2. Selección de rango de fechas
3. Visualización de gráficos
4. Exportación a Excel/PDF
5. Envío por email (opcional)

## 🔧 Stack Tecnológico Detallado

### Frontend
- **Framework**: React 19.2.0
- **UI Library**: shadcn/ui + Radix UI
- **Estilos**: Tailwind CSS 4.1.7
- **Iconos**: Lucide React
- **Gráficos**: Recharts 2.15.3
- **Formularios**: React Hook Form + Zod
- **Routing**: React Router DOM 7.6.1
- **Build**: Vite 6.3.5

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **ORM**: Sequelize
- **Base de Datos**: PostgreSQL
- **Hosting**: Render.com
- **Autenticación**: JWT

### Emails
- **Sistema**: PHPMailer
- **Hosting**: Hostinger
- **Integración**: Webhooks desde backend

## 📦 Estructura de Archivos

```
src/
├── components/
│   ├── admin/
│   │   ├── layout/
│   │   │   ├── AdminLayout.jsx          # Layout principal con menú
│   │   │   ├── AdminHeader.jsx          # Header con usuario
│   │   │   ├── AdminSidebar.jsx         # Menú lateral nuevo
│   │   │   └── AdminBreadcrumb.jsx      # Navegación breadcrumb
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardHome.jsx        # Dashboard principal
│   │   │   ├── KPICard.jsx              # Tarjeta de métrica
│   │   │   └── QuickActions.jsx         # Accesos rápidos
│   │   │
│   │   ├── operaciones/
│   │   │   ├── AdminReservas.jsx
│   │   │   ├── AdminVehiculos.jsx
│   │   │   └── AdminConductores.jsx
│   │   │
│   │   ├── finanzas/
│   │   │   ├── AdminGastos.jsx
│   │   │   ├── AdminEstadisticas.jsx
│   │   │   └── AdminCodigosPago.jsx
│   │   │
│   │   ├── configuracion/
│   │   │   ├── AdminPricing.jsx
│   │   │   ├── AdminTarifaDinamica.jsx
│   │   │   ├── AdminProductos.jsx
│   │   │   ├── AdminDisponibilidad.jsx
│   │   │   └── AdminFestivos.jsx
│   │   │
│   │   ├── marketing/
│   │   │   ├── AdminCodigos.jsx
│   │   │   └── AdminCodigosMejorado.jsx
│   │   │
│   │   └── sistema/
│   │       ├── AdminUsuarios.jsx
│   │       └── AdminPerfil.jsx
│   │
│   ├── ui/                              # Componentes de shadcn/ui
│   └── ...
│
├── contexts/
│   ├── AuthContext.jsx                  # Contexto de autenticación
│   └── NotificationContext.jsx          # Contexto de notificaciones (nuevo)
│
├── hooks/
│   ├── useAdmin.js                      # Hook personalizado admin
│   └── useNotifications.js              # Hook de notificaciones (nuevo)
│
└── ...
```

## 🧪 Testing

### Tests Manuales Requeridos
1. Navegación entre todos los módulos
2. Creación de registro en cada módulo
3. Edición y eliminación
4. Búsqueda y filtros
5. Responsive en diferentes dispositivos
6. Permisos por rol

### Tests Automatizados (Futuro)
- Unit tests de componentes
- Integration tests de flujos
- E2E tests con Playwright

## 📝 Notas de Implementación

### Fase 1: Estructura Base
- Crear layout con menú lateral
- Implementar navegación por categorías
- Migrar módulos existentes a nueva estructura

### Fase 2: Dashboard
- Crear dashboard principal
- Implementar KPIs
- Agregar gráficos básicos

### Fase 3: Mejoras de UX
- Unificar estilos
- Agregar breadcrumbs
- Implementar atajos de teclado

### Fase 4: Optimizaciones
- Lazy loading
- Caché
- Performance tuning

## 🔄 Compatibilidad

### Mantener Funcionalidad Existente
- ✅ Sistema de autenticación JWT
- ✅ Todas las APIs backend existentes
- ✅ Sistema de notificaciones PHPMailer
- ✅ Integración con Flow (pagos)
- ✅ Todos los módulos actuales funcionando

### No Modificar
- ❌ Archivos PHP en Hostinger
- ❌ Estructura de base de datos
- ❌ APIs backend (solo agregar nuevas si necesario)

## 📖 Referencias

### Documentación Existente
- `MEJORAS_PANEL_RESERVAS.md` - Mejoras en módulo de reservas
- `PANEL_VEHICULOS_CONDUCTORES.md` - Gestión de flota y personal
- `SISTEMA_AUTENTICACION_ADMIN.md` - Sistema de autenticación
- `GUIA_VISUAL_PANEL_RESERVAS.md` - Guía visual de reservas

### Estándares
- Material Design 3 (inspiración)
- WCAG 2.1 (accesibilidad)
- REST API Best Practices

---

**Versión**: 1.0  
**Fecha**: Noviembre 2025  
**Estado**: 📋 Propuesta - Pendiente de implementación
