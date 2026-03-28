# Gestor Integral de Reservas

## Descripción

Este módulo contiene la nueva arquitectura del Gestor Integral de Reservas de Transportes Araucanía. Proporciona una interfaz unificada para gestionar todas las reservas del sistema, desde su creación hasta su completación.

## Estructura

```
reservas/
├── README.md                    # Este archivo
├── ReservasManager.jsx          # Componente principal contenedor
├── Timeline.jsx                 # Timeline visual de eventos
├── ActionPanel.jsx              # Panel de acciones contextuales
└── cards/                       # Componentes Card
    ├── ClienteCard.jsx          # Información del cliente
    ├── ViajeCard.jsx            # Detalles del viaje
    ├── AsignacionCard.jsx       # Asignación de recursos
    └── FinancieroCard.jsx       # Información financiera
```

## Componentes Principales

### ReservasManager

Componente contenedor principal que integra todos los demás componentes y gestiona el estado global de las reservas.

**Props:** Ninguno (usa ReservasContext)

**Características:**
- Navegación entre vistas (Lista, Kanban, Calendario)
- Toolbar con acciones globales
- Sistema de notificaciones
- Manejo de errores centralizado

### Cards

Los componentes Card muestran información específica de la reserva de forma modular:

- **ClienteCard**: Muestra datos del cliente (nombre, contacto, RUT, historial)
- **ViajeCard**: Muestra detalles del viaje (origen, destino, fecha, hora, pasajeros)
- **AsignacionCard**: Muestra y permite gestionar asignación de vehículo y conductor
- **FinancieroCard**: Muestra información financiera (total, abono, saldo, pagos)

### Timeline

Componente que muestra una línea de tiempo visual con todos los eventos de la reserva:
- Creación de la reserva
- Cambios de estado
- Asignaciones de recursos
- Pagos registrados
- Comentarios y notas

### ActionPanel

Panel que muestra acciones contextuales según el estado actual de la reserva:
- Transiciones de estado válidas
- Acciones rápidas (notificar, imprimir, etc.)
- Validaciones antes de ejecutar acciones

## Contexto y Hooks

### ReservasContext

Proporciona estado global para todas las reservas:
- Lista de reservas
- Reserva seleccionada
- Filtros aplicados
- Vista activa
- Funciones CRUD

### useReservaState

Hook para gestionar el estado de una reserva individual:
- Cambios de estado con validaciones
- Historial de cambios
- Validación de transiciones

### useReservaActions

Hook para ejecutar acciones sobre reservas:
- Crear, actualizar, eliminar
- Asignar recursos
- Registrar pagos
- Enviar notificaciones

## Estados de Reserva

El sistema maneja los siguientes estados:

1. **Borrador**: Reserva en proceso de creación
2. **Pendiente**: Esperando confirmación del cliente
3. **Confirmada**: Confirmada, esperando asignación
4. **Asignada**: Vehículo y conductor asignados
5. **En Progreso**: Viaje en curso
6. **Completada**: Viaje finalizado
7. **Cancelada**: Reserva cancelada

## Flujo de Transiciones

```
Borrador → Pendiente → Confirmada → Asignada → En Progreso → Completada
              ↓            ↓           ↓            ↓
           Cancelada   Cancelada   Cancelada   Cancelada
```

## Uso

### Integrar el Provider

```jsx
import { ReservasProvider } from './contexts/ReservasContext';

function App() {
  return (
    <ReservasProvider>
      {/* Tu aplicación aquí */}
    </ReservasProvider>
  );
}
```

### Usar el Gestor

```jsx
import ReservasManager from './components/reservas/ReservasManager';

function AdminPanel() {
  return (
    <div>
      <ReservasManager />
    </div>
  );
}
```

### Usar hooks individuales

```jsx
import { useReservaState } from './hooks/useReservaState';
import { useReservaActions } from './hooks/useReservaActions';

function MiComponente({ reserva }) {
  const { cambiarEstado, obtenerEstadosDisponibles } = useReservaState(reserva);
  const { registrarPago, enviarNotificacion } = useReservaActions();

  // Usar las funciones según necesidad
}
```

## Notas Importantes

- **No modificar** los componentes existentes (HeroExpress.jsx, AdminReservas.jsx)
- Este gestor coexiste con el sistema actual
- Los datos se obtienen del mismo backend en Render.com
- Las notificaciones siguen usando PHPMailer en Hostinger
- Mantiene el sistema de códigos AR-YYYYMMDD-NNNN

## Próximos Pasos (Fases Futuras)

- Fase 2: Integración con backend completo
- Fase 3: Vistas Kanban y Calendario
- Fase 4: Sistema de notificaciones avanzado
- Fase 5: Reportes y estadísticas
- Fase 6: Migración completa del sistema antiguo

## Soporte

Para más información, consultar:
- Issue #197
- Custom Agent: @gestor-integral-reservas
- Documentación: `.github/agents/gestor-integral-reservas.md`
