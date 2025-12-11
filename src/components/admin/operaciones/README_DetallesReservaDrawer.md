# DetallesReservaDrawer Component

## Descripción
Componente drawer lateral deslizable que muestra información completa y detallada de una reserva en el sistema integral de gestión. Implementado con Sheet de shadcn/ui (@radix-ui/react-dialog).

## Características Principales

### 📋 Secciones de Información
1. **Información del Cliente**
   - Nombre completo
   - Email
   - Teléfono

2. **Detalles del Viaje**
   - Origen y destino
   - Fecha y hora del servicio
   - Número de pasajeros
   - Tipo de viaje (ida o ida y vuelta)
   - Fecha de regreso (si aplica)

3. **Información Adicional** (condicional)
   - Número de vuelo
   - Nombre del hotel
   - Información de equipaje
   - Requerimiento de silla infantil

4. **Información Financiera**
   - Precio base
   - Descuentos aplicados
   - Total con descuento
   - Saldo pendiente (destacado si existe)

5. **Estado y Pago**
   - Estado actual de la reserva
   - Estado de pago (pendiente, pagado, parcial, fallido)
   - Método de pago
   - Código de pago (si existe)

6. **Vehículo y Conductor**
   - Información del vehículo asignado
   - Datos del conductor asignado
   - Alerta si no hay asignación

7. **Timeline de Actividad**
   - Historial de acciones realizadas
   - Carga dinámica desde el backend
   - Visualización cronológica con línea temporal

8. **Notas y Observaciones** (condicional)
   - Notas adicionales de la reserva

### 🎯 Acciones Rápidas
- **Editar**: Abre modal de edición de reserva
- **Asignar Vehículo**: Modal para asignar vehículo y conductor
- **Registrar Pago**: Modal para registrar pagos

### 🎨 Sistema de Colores

#### Estados de Reserva
- **Pendiente**: Gris (Clock icon)
- **Confirmada**: Azul (CheckCircle2 icon)
- **Asignada**: Morado (Car icon)
- **En Progreso**: Naranja (Activity icon)
- **Completada**: Verde (CheckCircle2 icon)
- **Cancelada**: Rojo (XCircle icon)

#### Estados de Pago
- **Pendiente**: Gris
- **Pagado**: Verde
- **Parcial**: Naranja
- **Fallido**: Rojo

## Props

```typescript
interface DetallesReservaDrawerProps {
  reserva: Reserva | null;    // Objeto de reserva con toda la información
  open: boolean;              // Estado de apertura del drawer
  onClose: () => void;        // Callback para cerrar el drawer
  onUpdate: () => void;       // Callback para refrescar datos tras actualizaciones
}
```

## Dependencias

### Componentes UI (shadcn/ui)
- Sheet (SheetContent, SheetHeader, SheetTitle, SheetDescription)
- Card (Card, CardContent, CardHeader, CardTitle)
- Badge
- Button
- Separator
- ScrollArea

### Iconos (lucide-react)
- User, Mail, Phone, MapPin, Calendar, Clock, Users
- DollarSign, CreditCard, Car, UserCircle
- Package, Baby, Plane, Hotel, FileText
- Edit, CheckCircle2, XCircle, AlertCircle, Activity, ArrowRight

### Utilidades
- date-fns (format) con locale español
- useAuthenticatedFetch hook
- getBackendUrl function

## Endpoints del Backend

### GET /api/reservas/:id/timeline
Obtiene el timeline de actividad de una reserva específica.

**Respuesta esperada:**
```json
{
  "timeline": [
    {
      "accion": "Reserva creada",
      "fecha": "2024-01-15T10:30:00Z",
      "usuario": "admin@ejemplo.com"
    }
  ]
}
```

## Uso

```jsx
import DetallesReservaDrawer from './DetallesReservaDrawer';

function GestionReservas() {
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAbrirDetalles = (reserva) => {
    setSelectedReserva(reserva);
    setDrawerOpen(true);
  };

  const handleCerrar = () => {
    setDrawerOpen(false);
    setSelectedReserva(null);
  };

  const handleActualizar = () => {
    // Recargar datos de reservas
  };

  return (
    <div>
      {/* Tu componente principal */}
      
      <DetallesReservaDrawer
        reserva={selectedReserva}
        open={drawerOpen}
        onClose={handleCerrar}
        onUpdate={handleActualizar}
      />
    </div>
  );
}
```

## Formato de Datos

### Objeto Reserva
```typescript
interface Reserva {
  id: number;
  codigoReserva?: string;
  
  // Cliente
  nombre: string;
  email?: string;
  telefono: string;
  
  // Viaje
  origen: string;
  destino: string;
  fecha: string;
  hora?: string;
  pasajeros: number;
  idaVuelta: boolean;
  fechaRegreso?: string;
  
  // Adicional
  numeroVuelo?: string;
  nombreHotel?: string;
  equipaje?: string;
  sillaInfantil?: boolean;
  
  // Financiero
  precio?: number;
  precioBase?: number;
  descuento: number;
  total?: number;
  totalConDescuento?: number;
  saldoPendiente: number;
  
  // Estado y pago
  estado: 'pendiente' | 'confirmada' | 'asignada' | 'en_progreso' | 'completada' | 'cancelada';
  estadoPago: 'pendiente' | 'pagado' | 'parcial' | 'fallido';
  metodoPago?: string;
  codigoPago?: string;
  
  // Asignaciones
  vehiculoId?: number;
  conductorId?: number;
  vehiculo?: {
    marca: string;
    modelo: string;
    patente: string;
  };
  conductor?: {
    nombre: string;
    telefono?: string;
  };
  
  // Metadata
  notas?: string;
  fechaCreacion?: string;
  createdAt?: string;
}
```

## Características Técnicas

### Responsive
- Mobile: Drawer ocupa ancho completo
- Tablet/Desktop: Max-width de 2xl (672px)

### Scroll
- ScrollArea interno para navegación fluida
- Preserva header fijo al hacer scroll

### Formateo
- **Fechas**: Formato largo en español (ej: "15 de enero de 2024")
- **Fechas y horas**: Formato corto (ej: "15/01/2024 10:30")
- **Moneda**: Formato CLP sin decimales (ej: "$50.000")

### Performance
- Carga lazy del timeline solo cuando se abre el drawer
- Manejo eficiente de estados con hooks

## TODOs Pendientes
- [ ] Implementar modal de edición de reserva
- [ ] Implementar modal de asignación de vehículo/conductor
- [ ] Implementar modal de registro de pago
- [ ] Agregar validaciones en acciones rápidas
- [ ] Agregar confirmaciones antes de acciones críticas

## Mantenimiento
- **Autor**: Sistema Copilot Agent
- **Fecha**: Diciembre 2024
- **Versión**: 1.0.0

## Notas
- Todos los comentarios están en español
- Documentación en español
- Usa convenciones del proyecto existente
- Compatible con el sistema de gestión integral de reservas
