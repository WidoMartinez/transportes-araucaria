# Sistema Integral de Gestión de Reservas

Este directorio contiene los componentes del sistema integral de gestión de reservas con vista Kanban, drag & drop y métricas en tiempo real.

## Componentes Principales

### 1. GestionReservasIntegral.jsx

**Descripción:** Componente principal que orquesta todo el sistema de gestión de reservas.

**Características:**
- Vista Kanban con 5 columnas (Pendiente, Confirmada, Asignada, En Progreso, Completada)
- Drag & drop para cambiar estados de reservas
- Búsqueda y filtros avanzados (por texto, rango de fechas)
- Integración con dashboard de métricas
- Panel lateral de detalles (drawer)
- Actualización en tiempo real

**Dependencias:**
- `@dnd-kit/core` - Sistema de drag & drop
- `DashboardMetricas` - Componente de métricas
- `KanbanColumn` - Columnas del Kanban
- `ReservaCard` - Tarjetas de reservas
- `DetallesReservaDrawer` - Panel de detalles

**Props:** Ninguna (componente standalone)

**Endpoints utilizados:**
- `GET /api/reservas/kanban` - Obtener datos del Kanban
- `GET /api/reservas/metricas` - Obtener métricas
- `PUT /api/reservas/:id/cambiar-estado` - Cambiar estado de reserva

---

### 2. DashboardMetricas.jsx

**Descripción:** Dashboard que muestra métricas en tiempo real y alertas importantes.

**Características:**
- Tarjetas de KPIs principales (reservas hoy, pendientes, confirmadas, etc.)
- Indicadores de tendencia con iconos
- Alertas destacadas con colores según tipo
- Métricas adicionales (tasa de conversión, tiempo de respuesta, clientes nuevos/recurrentes)
- Formateo automático de números y montos

**Props:**
```jsx
{
  metricas: {
    reservas_hoy: number,
    pendientes: number,
    confirmadas: number,
    en_progreso: number,
    completadas_mes: number,
    ingresos_mes: number,
    ocupacion: number,
    satisfaccion: number,
    tendencia_reservas_hoy: number,
    tendencia_confirmadas: number,
    tendencia_completadas: number,
    tendencia_ingresos: number,
    tasa_conversion: number,
    tiempo_respuesta_promedio: number,
    clientes_nuevos: number,
    clientes_recurrentes: number
  },
  alertas: Array<{
    tipo: 'error' | 'warning' | 'info',
    titulo: string,
    mensaje: string
  }>,
  onAlertaClick: (tipo: string) => void
}
```

---

### 3. KanbanColumn.jsx

**Descripción:** Columna individual del tablero Kanban que actúa como zona droppable.

**Características:**
- Zona droppable para recibir tarjetas arrastradas
- Indicador visual al pasar elementos sobre ella
- Header con título, icono y contador de reservas
- Lista scrollable de reservas
- Estados de carga

**Props:**
```jsx
{
  id: string,                    // ID de la columna (estado de la reserva)
  titulo: string,                // Título visible de la columna
  color: 'gray' | 'blue' | 'purple' | 'orange' | 'green',
  icono: LucideIcon,             // Componente de icono de lucide-react
  descripcion: string,           // Descripción breve
  reservas: Array<Reserva>,      // Array de reservas
  onReservaClick: (reserva) => void,
  loading: boolean
}
```

**Dependencias:**
- `@dnd-kit/core` - Hook useDroppable
- `@dnd-kit/sortable` - SortableContext
- `ReservaCard` - Componente de tarjeta

---

### 4. ReservaCard.jsx

**Descripción:** Tarjeta individual de reserva con información resumida y capacidad de arrastre.

**Características:**
- Elemento sortable/draggable
- Información compacta (código, cliente, contacto, fecha, ruta, monto)
- Indicador visual de urgencia (borde de color según fecha)
- Badges para estado de pago, tipo de servicio, pasajeros, asignaciones
- Handle de arrastre (grip vertical)
- Click para abrir detalles completos

**Props:**
```jsx
{
  reserva: {
    id: number,
    codigo_reserva: string,
    nombre_cliente: string,
    email_cliente: string,
    telefono_cliente: string,
    fecha_servicio: string,
    hora_servicio: string,
    origen: string,
    destino: string,
    monto_total: number,
    estado_pago: string,
    tipo_servicio: string,
    pasajeros: number,
    vehiculo_asignado: boolean,
    conductor_asignado: boolean
  },
  onClick: () => void,
  isDragging: boolean             // Indica si está siendo usado como overlay
}
```

**Dependencias:**
- `@dnd-kit/sortable` - Hook useSortable
- `@dnd-kit/utilities` - Utilidades CSS

---

## Flujo de Trabajo

1. **Carga Inicial:**
   - `GestionReservasIntegral` se monta y carga datos del Kanban y métricas
   - Datos se distribuyen en las 5 columnas según estado

2. **Búsqueda y Filtros:**
   - Usuario puede buscar por texto o filtrar por rango de fechas
   - Los filtros actualizan automáticamente la vista Kanban

3. **Drag & Drop:**
   - Usuario arrastra una `ReservaCard` de una columna a otra
   - Se actualiza el estado en el backend
   - Si tiene éxito, actualiza el estado local y recarga métricas
   - Si falla, muestra error y recarga datos

4. **Ver Detalles:**
   - Click en una tarjeta abre `DetallesReservaDrawer`
   - Se pueden realizar acciones sobre la reserva
   - Al cerrar o actualizar, se refresca la vista

5. **Métricas y Alertas:**
   - `DashboardMetricas` muestra KPIs actualizados
   - Alertas importantes se destacan visualmente
   - Click en alerta puede filtrar vista (opcional)

---

## Estilos y Colores

### Esquema de Colores por Estado:

- **Pendiente:** Gris (`gray`)
  - Reservas esperando confirmación
  
- **Confirmada:** Azul (`blue`)
  - Reservas confirmadas, pendiente de asignación
  
- **Asignada:** Morado (`purple`)
  - Vehículo/conductor asignado
  
- **En Progreso:** Naranja (`orange`)
  - Servicio en curso
  
- **Completada:** Verde (`green`)
  - Servicios finalizados

### Indicadores de Urgencia (Borde de Tarjeta):

- **Rojo:** Fecha ya pasó
- **Naranja:** Hoy
- **Amarillo:** Mañana
- **Azul:** Próximos 3 días
- **Gris:** Más de 3 días

---

## Integración Backend

### Endpoints Requeridos:

#### 1. GET /api/reservas/kanban
```javascript
// Query params opcionales:
// - search: string
// - fecha_desde: YYYY-MM-DD
// - fecha_hasta: YYYY-MM-DD

// Response:
{
  kanban: {
    pendiente: Array<Reserva>,
    confirmada: Array<Reserva>,
    asignada: Array<Reserva>,
    en_progreso: Array<Reserva>,
    completada: Array<Reserva>
  }
}
```

#### 2. GET /api/reservas/metricas
```javascript
// Response:
{
  metricas: {
    reservas_hoy: number,
    pendientes: number,
    confirmadas: number,
    // ... (ver DashboardMetricas props)
  },
  alertas: Array<{
    tipo: string,
    titulo: string,
    mensaje: string
  }>
}
```

#### 3. PUT /api/reservas/:id/cambiar-estado
```javascript
// Body:
{
  nuevoEstado: string,
  observaciones: string
}

// Response:
{
  success: boolean,
  message: string,
  reserva: Reserva
}
```

---

## Instalación y Uso

### Dependencias necesarias (ya instaladas):

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "lucide-react": "^0.510.0"
}
```

### Uso en tu aplicación:

```jsx
import GestionReservasIntegral from './components/admin/operaciones/GestionReservasIntegral';

function AdminPanel() {
  return (
    <div>
      <GestionReservasIntegral />
    </div>
  );
}
```

---

## Mantenimiento

### Agregar un nuevo estado:

1. Agregar estado en `columnas` array de `GestionReservasIntegral`
2. Agregar estado en `kanbanData` inicial
3. Actualizar backend para soportar el nuevo estado
4. Agregar color en `getColorClasses` de `KanbanColumn`

### Agregar nueva métrica:

1. Agregar campo en props de `DashboardMetricas`
2. Agregar tarjeta en `metricCards` array
3. Actualizar endpoint `/api/reservas/metricas`

### Agregar campo a tarjeta de reserva:

1. Agregar campo en estructura de `reserva` prop
2. Actualizar UI en `ReservaCard.jsx`
3. Asegurar que endpoint `/api/reservas/kanban` devuelva el campo

---

## Testing

### Casos de prueba recomendados:

1. **Carga inicial:**
   - Verificar que se cargan todas las columnas
   - Verificar que se cargan métricas y alertas

2. **Drag & Drop:**
   - Arrastrar entre columnas funciona
   - Estado se actualiza en backend
   - Estado local se actualiza correctamente
   - Manejo de errores funciona

3. **Búsqueda y Filtros:**
   - Búsqueda por texto funciona
   - Filtros de fecha funcionan
   - Limpiar filtros funciona

4. **Responsive:**
   - Vista funciona en mobile
   - Vista funciona en tablet
   - Vista funciona en desktop

---

## Notas de Desarrollo

- Todos los comentarios en código están en español
- Los componentes usan Tailwind CSS para estilos
- Se usan componentes UI de shadcn/ui
- El sistema es completamente responsive
- Se incluye manejo de errores y estados de carga
- Compatible con React 19

---

## Autor

Sistema creado como parte del panel administrativo de Transportes Araucanía.

Fecha de creación: Diciembre 2024
