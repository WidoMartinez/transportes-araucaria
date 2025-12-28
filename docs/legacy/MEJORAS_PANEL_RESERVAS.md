# Mejoras Panel de Reservas Admin

## 📋 Resumen

Este documento detalla las mejoras implementadas en el panel de administración de reservas (`admin?panel=reservas`), que incluyen gestión avanzada de clientes, autocompletado, columnas configurables y seguimiento de historial.

## 🎯 Objetivos Cumplidos

### 1. Sistema de Clasificación de Clientes
- **Clientes vs Cotizadores**: Se diferencia automáticamente entre usuarios que solo cotizan y aquellos que realmente reservan y pagan.
- **Marcado Automático**: Cuando un usuario realiza al menos un pago, se marca automáticamente como "Cliente".
- **Marcado Manual**: Opción para marcar manualmente como cliente (útil para reservas por WhatsApp u otros canales).

### 2. Campo RUT
- Nuevo campo `rut` en el modelo de Reserva y Cliente.
- Formato esperado: `12345678-9`
- Campo opcional pero útil para identificación de clientes chilenos.
- Permite búsqueda por RUT en el autocompletado.

### 3. Autocompletado Inteligente
- **Búsqueda Multi-campo**: Busca clientes por nombre, email, RUT o teléfono.
- **Sugerencias en Tiempo Real**: Muestra hasta 10 resultados mientras el usuario escribe.
- **Relleno Automático**: Al seleccionar un cliente, rellena automáticamente todos sus datos.
- **Indicadores Visuales**: Muestra badges para clientes recurrentes y número de reservas previas.

### 4. Gestión de Columnas Visibles
- **Selector de Columnas**: Modal con checkboxes para mostrar/ocultar columnas.
- **Columnas Disponibles**:
  - ID
  - Cliente (Nombre)
  - Contacto (Email y Teléfono)
  - RUT
  - Tipo (Cliente/Cotizador)
  - Núm. Viajes
  - Ruta (Origen → Destino)
  - Fecha/Hora
  - Pasajeros
  - Total
  - Estado
  - Pago
  - Saldo
  - Acciones

### 5. Historial de Cliente
- **Modal Completo**: Muestra todo el historial de un cliente específico.
- **Estadísticas**:
  - Total de reservas
  - Reservas pagadas
  - Reservas pendientes
  - Total gastado
- **Lista de Reservas**: Todas las reservas del cliente ordenadas cronológicamente.
- **Navegación Rápida**: Clic en una reserva del historial abre los detalles completos.

## 🗄️ Cambios en Base de Datos

### Nueva Tabla: `clientes`

```sql
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rut VARCHAR(20) UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(50) NOT NULL,
  esCliente BOOLEAN DEFAULT FALSE,           -- TRUE si ha pagado al menos una vez
  marcadoManualmente BOOLEAN DEFAULT FALSE,  -- TRUE si fue marcado manualmente
  totalReservas INT DEFAULT 0,
  totalPagos INT DEFAULT 0,
  totalGastado DECIMAL(10, 2) DEFAULT 0,
  primeraReserva DATE,
  ultimaReserva DATE,
  notas TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_rut (rut),
  INDEX idx_esCliente (esCliente),
  INDEX idx_telefono (telefono)
);
```

### Campos Nuevos en `reservas`

```sql
ALTER TABLE reservas ADD COLUMN clienteId INT;
ALTER TABLE reservas ADD COLUMN rut VARCHAR(20);
ALTER TABLE reservas ADD INDEX idx_clienteId (clienteId);
ALTER TABLE reservas ADD INDEX idx_rut (rut);
```

### Script de Migración

Ejecutar: `node backend/migrations/add-cliente-fields.js`

Este script:
- Crea la tabla `clientes` si no existe
- Agrega campos `clienteId` y `rut` a la tabla `reservas`
- Crea los índices necesarios
- Es seguro ejecutarlo múltiples veces (usa `IF NOT EXISTS`)

## 🔌 Nuevos Endpoints API

### 1. Buscar Clientes (Autocompletado)
```
GET /api/clientes/buscar?query={texto}
```
**Respuesta:**
```json
{
  "clientes": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "telefono": "+56912345678",
      "rut": "12345678-9",
      "esCliente": true,
      "totalReservas": 5
    }
  ]
}
```

### 2. Historial de Cliente
```
GET /api/clientes/:id/historial
```
**Respuesta:**
```json
{
  "cliente": { /* datos del cliente */ },
  "reservas": [ /* array de reservas */ ],
  "estadisticas": {
    "totalReservas": 5,
    "totalPagadas": 3,
    "totalPendientes": 2,
    "totalGastado": 150000,
    "ultimaReserva": "2025-10-10",
    "primeraReserva": "2025-01-15"
  }
}
```

### 3. Marcar/Desmarcar Cliente
```
PUT /api/clientes/:id/marcar-cliente
Content-Type: application/json

{
  "esCliente": true,
  "marcadoManualmente": true,
  "notas": "Cliente frecuente de WhatsApp"
}
```

### 4. Crear o Actualizar Cliente
```
POST /api/clientes/crear-o-actualizar
Content-Type: application/json

{
  "rut": "12345678-9",
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "+56912345678",
  "notas": "Cliente VIP"
}
```
**Comportamiento:**
- Si existe un cliente con ese RUT o email, actualiza solo los campos opcionales.
- Si no existe, crea un nuevo cliente.
- No sobrescribe datos históricos (totalReservas, totalPagos, etc.).

### 5. Actualización Automática al Pagar
El endpoint `PUT /api/reservas/:id/pago` ahora:
- Cuando `estadoPago = "pagado"`, actualiza automáticamente:
  - `cliente.esCliente = true`
  - `cliente.totalPagos += 1`
  - `cliente.totalGastado += monto`

## 💻 Cambios en Frontend

### Componente: `AdminReservas.jsx`

#### Nuevos Estados
```javascript
// Autocompletado
const [clienteSugerencias, setClienteSugerencias] = useState([]);
const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);
const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

// Columnas visibles
const [columnasVisibles, setColumnasVisibles] = useState({
  id: true,
  cliente: true,
  contacto: true,
  rut: false,
  esCliente: false,
  numViajes: false,
  // ... más columnas
});

// Historial
const [showHistorialDialog, setShowHistorialDialog] = useState(false);
const [historialCliente, setHistorialCliente] = useState(null);
```

#### Nuevas Funciones
```javascript
buscarClientes(query)           // Busca clientes para autocompletar
seleccionarCliente(cliente)     // Selecciona cliente del autocompletado
verHistorialCliente(clienteId)  // Abre modal con historial
toggleClienteManual(id, estado) // Marca/desmarca cliente manualmente
```

#### Formulario de Nueva Reserva
- Campo RUT agregado junto a nombre
- Autocompletado con sugerencias desplegables
- Indicador visual cuando se selecciona cliente existente
- Badge mostrando número de reservas previas

#### Tabla de Reservas
- Botón "Columnas" en el header para configurar visibilidad
- Columnas condicionales basadas en `columnasVisibles`
- Badge clickeable en columna "Tipo" para marcar/desmarcar cliente
- Botón "Ver historial" en columna "Núm. Viajes"

#### Modal de Historial
- Información completa del cliente
- Cards con estadísticas
- Lista de todas las reservas
- Navegación rápida a detalles de reserva

## 🎨 Características Visuales

### Badges
- **Cliente**: Badge verde con estrella (⭐) para clientes con pagos
- **Cotizador**: Badge gris para usuarios sin pagos
- **Marcado Manualmente**: Se muestra en el historial si fue marcado por admin

### Iconos
- `Star`: Cliente VIP
- `History`: Ver historial
- `Settings2`: Configurar columnas
- Mantiene iconos existentes: `User`, `Mail`, `Phone`, `MapPin`, etc.

### Colores
- Verde: Cliente, pagado, saldo $0
- Rojo: Cotizador en algunos contextos, saldo pendiente
- Azul: Información del cliente seleccionado
- Gris: Neutro, secundario

## 📝 Flujo de Uso

### Crear Reserva para Cliente Existente
1. Admin hace clic en "Nueva Reserva"
2. Comienza a escribir nombre o RUT del cliente
3. Aparecen sugerencias con datos del cliente
4. Selecciona el cliente deseado
5. Datos se rellenan automáticamente
6. Admin completa detalles del viaje
7. Al guardar, se asocia la reserva al cliente existente

### Crear Reserva para Cliente Nuevo
1. Admin hace clic en "Nueva Reserva"
2. Ingresa nombre, email, teléfono (y opcionalmente RUT)
3. Si no hay coincidencias, sigue con los datos ingresados
4. Al guardar, se crea un nuevo registro de cliente automáticamente
5. Reserva queda asociada al nuevo cliente

### Marcar Cliente Manualmente
1. Buscar cliente en la tabla
2. Activar columna "Tipo" si está oculta
3. Hacer clic en el badge "Cotizador"
4. Cliente se marca como "Cliente" con `marcadoManualmente = true`
5. Útil para clientes que reservan por WhatsApp o teléfono

### Ver Historial de Cliente
1. Activar columna "Núm. Viajes"
2. Hacer clic en el botón con icono de historial
3. Se abre modal con todo el historial del cliente
4. Revisar estadísticas y lista de reservas
5. Opcional: Hacer clic en una reserva para ver detalles completos

### Configurar Columnas Visibles
1. Hacer clic en botón "Columnas" en el header de la tabla
2. Marcar/desmarcar columnas deseadas
3. Cerrar modal
4. Tabla se actualiza mostrando solo columnas seleccionadas
5. Configuración se mantiene durante la sesión

## 🔐 Seguridad y Validaciones

### Backend
- Validación de campos obligatorios (nombre, email, teléfono)
- Email único por cliente
- RUT único por cliente (si se proporciona)
- Índices para optimizar búsquedas
- Transacciones para mantener integridad de datos

### Frontend
- Validación de campos obligatorios antes de guardar
- Mensajes de error claros
- Confirmación antes de acciones destructivas
- Timeout en autocompletado para evitar búsquedas excesivas

## 🚀 Despliegue

### Backend (Render.com)
1. Push a la rama → Render detecta cambios automáticamente
2. Render ejecuta `npm install` y reinicia el servicio
3. **IMPORTANTE**: Ejecutar migración manualmente:
   ```bash
   node backend/migrations/add-cliente-fields.js
   ```
   Esto se puede hacer desde la shell de Render o conectándose vía SSH.

### Frontend (Hostinger)
1. Build local: `npm run build`
2. Subir contenido de `dist/` a Hostinger
3. No modificar archivos PHP existentes

## 📊 Métricas de Éxito

### Funcionalidades Clave
- ✅ Diferenciación automática Cliente vs Cotizador
- ✅ Autocompletado funcional con búsqueda multi-campo
- ✅ Campo RUT integrado
- ✅ Marcado manual de clientes
- ✅ Historial completo con estadísticas
- ✅ Columnas configurables
- ✅ Asociación de reservas a cliente
- ✅ Actualización inteligente sin sobrescribir histórico

### Métricas de Uso Esperadas
- Reducción de duplicados de clientes
- Mayor precisión en datos de contacto
- Mejor segmentación para marketing
- Identificación rápida de clientes VIP
- Análisis de recurrencia de clientes

## 🐛 Solución de Problemas

### Cliente no aparece en búsqueda
- Verificar que el cliente existe en la tabla `clientes`
- Verificar ortografía del nombre/email/RUT
- Intentar buscar por teléfono

### Datos no se actualizan
- Verificar que la migración se ejecutó correctamente
- Revisar logs del backend en Render
- Verificar que el frontend está conectado al backend correcto

### Columnas no se muestran
- Abrir configurador de columnas
- Verificar que las columnas están marcadas
- Recargar la página si es necesario

## 📚 Referencias

### Modelos
- `backend/models/Cliente.js` - Modelo de cliente
- `backend/models/Reserva.js` - Modelo actualizado con clienteId y rut

### Endpoints
- `backend/server-db.js` - Líneas 1758+ (endpoints de cliente)

### Frontend
- `src/components/AdminReservas.jsx` - Componente principal

### Migración
- `backend/migrations/add-cliente-fields.js` - Script de migración

## ✅ Próximas Mejoras Sugeridas

1. **Dashboard de Clientes**: Panel separado para gestión exclusiva de clientes
2. **Exportar Datos**: Exportar lista de clientes a Excel/CSV
3. **Notas de Cliente**: Sistema de notas más robusto con timestamps
4. **Tags/Etiquetas**: Sistema de etiquetas para categorizar clientes
5. **Alertas**: Notificar cuando cliente VIP hace una reserva
6. **Análisis**: Gráficos de recurrencia, ingresos por cliente, etc.
7. **Integración WhatsApp**: Importar reservas directamente desde WhatsApp Business API

---

**Fecha de implementación**: Octubre 2025  
**Desarrollador**: GitHub Copilot  
**Estado**: ✅ Completado y listo para despliegue
