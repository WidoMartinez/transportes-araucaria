# Arquitectura de la APP de Gestión de Reservas

## 📊 Diagrama de Componentes

```
App.jsx
  └── AdminDashboard.jsx
        ├── AdminPricing.jsx (Pestaña: Precios)
        ├── AdminReservas.jsx (Pestaña: Reservas) ⭐ NUEVO
        ├── AdminCodigos.jsx (Pestaña: Códigos)
        └── AdminCodigosMejorado.jsx (Pestaña: Códigos Mejorado)
```

## 🎨 Estructura de AdminReservas.jsx

```
AdminReservas
├── Header Section
│   ├── Título
│   └── Botones de Acción
│       ├── Actualizar
│       ├── Exportar CSV
│       └── Nueva Reserva (abre Dialog)
│
├── Estadísticas (4 Cards)
│   ├── Total Reservas
│   ├── Pendientes
│   ├── Confirmadas
│   └── Ingresos Totales
│
├── Filtros (Card)
│   ├── Búsqueda (texto libre)
│   ├── Fecha Desde
│   ├── Fecha Hasta
│   ├── Estado (dropdown)
│   ├── Estado Pago (dropdown)
│   └── Botones (Aplicar/Limpiar)
│
├── Tabla de Reservas (Card)
│   ├── Headers
│   ├── Filas de datos
│   │   ├── Información básica
│   │   ├── Dropdown Estado (inline)
│   │   ├── Dropdown Estado Pago (inline)
│   │   └── Botón Ver Detalles
│   └── Paginación
│
└── Dialog: Nueva Reserva
    ├── Formulario (12 campos)
    └── Botones (Cancelar/Crear)
```

## 🔄 Flujo de Datos

### 1. Carga Inicial
```
Usuario accede al panel
  ↓
AdminDashboard carga
  ↓
Usuario selecciona pestaña "Reservas"
  ↓
AdminReservas se monta
  ↓
useEffect se ejecuta
  ↓
cargarReservas() + cargarEstadisticas()
  ↓
GET /api/reservas
GET /api/reservas/estadisticas
  ↓
Estado se actualiza
  ↓
UI se renderiza
```

### 2. Crear Nueva Reserva
```
Usuario hace clic en "Nueva Reserva"
  ↓
Dialog se abre
  ↓
Usuario completa formulario
  ↓
Usuario hace clic en "Crear"
  ↓
POST /api/reservas
  ↓
Backend valida y crea reserva
  ↓
Respuesta exitosa
  ↓
Dialog se cierra
Formulario se limpia
cargarReservas() se ejecuta
  ↓
Tabla se actualiza
```

### 3. Cambiar Estado de Reserva
```
Usuario hace clic en dropdown de Estado
  ↓
Usuario selecciona nuevo estado
  ↓
onValueChange se dispara
  ↓
actualizarEstado(id, nuevoEstado)
  ↓
PUT /api/reservas/:id/estado
  ↓
Backend actualiza la reserva
  ↓
Respuesta exitosa
  ↓
cargarReservas() se ejecuta
  ↓
Tabla se actualiza con nuevo estado
```

### 4. Cambiar Estado de Pago
```
Usuario hace clic en dropdown de Estado Pago
  ↓
Usuario selecciona nuevo estado de pago
  ↓
onValueChange se dispara
  ↓
actualizarEstadoPago(id, nuevoEstadoPago)
  ↓
PUT /api/reservas/:id/pago
  ↓
Backend actualiza el estado de pago
  ↓
Respuesta exitosa
  ↓
cargarReservas() se ejecuta
  ↓
Tabla se actualiza con nuevo estado de pago
```

### 5. Aplicar Filtros
```
Usuario modifica filtros
  ↓
Usuario hace clic en "Aplicar Filtros"
  ↓
cargarReservas() se ejecuta
  ↓
Parámetros de URL se construyen
  ↓
GET /api/reservas?estado=X&fecha_desde=Y&fecha_hasta=Z
  ↓
Filtros adicionales se aplican en cliente (búsqueda, estadoPago)
  ↓
Estado se actualiza
  ↓
Tabla se renderiza con datos filtrados
```

### 6. Exportar a CSV
```
Usuario hace clic en "Exportar CSV"
  ↓
exportarCSV() se ejecuta
  ↓
Recorre array de reservas actual
  ↓
Construye contenido CSV con headers
  ↓
Agrega BOM UTF-8 para Excel
  ↓
Crea Blob con tipo text/csv
  ↓
Genera URL temporal
  ↓
Crea link invisible y lo hace clic
  ↓
Archivo se descarga
  ↓
Limpia recursos
```

### 7. Paginación
```
Usuario hace clic en "Siguiente"/"Anterior"
  ↓
setPaginacion actualiza page
  ↓
useEffect detecta cambio en paginacion.page
  ↓
cargarReservas() se ejecuta
  ↓
GET /api/reservas?page=X&limit=20
  ↓
Nueva página se carga
  ↓
Tabla se actualiza
```

## 🗄️ Estructura de Base de Datos

### Tabla: reservas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Primary Key, Auto Increment |
| nombre | STRING(255) | Nombre del cliente |
| email | STRING(255) | Email del cliente |
| telefono | STRING(50) | Teléfono del cliente |
| origen | STRING(255) | Punto de origen |
| destino | STRING(255) | Punto de destino |
| fecha | DATEONLY | Fecha del viaje |
| hora | TIME | Hora del viaje |
| pasajeros | INTEGER | Número de pasajeros |
| precio | DECIMAL(10,2) | Precio base |
| totalConDescuento | DECIMAL(10,2) | Precio final |
| vehiculo | STRING(100) | Tipo de vehículo |
| estado | ENUM | pendiente, pendiente_detalles, confirmada, cancelada, completada |
| estadoPago | ENUM | pendiente, pagado, fallido, reembolsado |
| metodoPago | STRING(50) | Método de pago usado |
| referenciaPago | STRING(255) | Referencia del pago |
| observaciones | TEXT | Notas adicionales |
| source | STRING(100) | Origen de la reserva (web, admin_manual) |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Fecha de última actualización |

## 🔌 Endpoints del Backend

### GET /api/reservas
**Descripción**: Obtener lista de reservas con paginación y filtros

**Query Parameters**:
- `page` (number): Número de página (default: 1)
- `limit` (number): Resultados por página (default: 20)
- `estado` (string): Filtrar por estado
- `fecha_desde` (date): Filtrar desde fecha
- `fecha_hasta` (date): Filtrar hasta fecha

**Respuesta**:
```json
{
  "reservas": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### POST /api/reservas
**Descripción**: Crear nueva reserva manualmente

**Body**:
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "+56912345678",
  "origen": "Temuco",
  "destino": "Pucón",
  "fecha": "2025-10-20",
  "hora": "10:00",
  "pasajeros": 2,
  "precio": 50000,
  "totalConDescuento": 45000,
  "vehiculo": "Van",
  "estado": "pendiente",
  "estadoPago": "pendiente",
  "observaciones": "Cliente VIP"
}
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Reserva creada exitosamente",
  "reserva": { ... }
}
```

### PUT /api/reservas/:id/estado
**Descripción**: Actualizar estado de una reserva

**Body**:
```json
{
  "estado": "confirmada",
  "observaciones": "Confirmado por teléfono"
}
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Estado de reserva actualizado",
  "reserva": { ... }
}
```

### PUT /api/reservas/:id/pago
**Descripción**: Actualizar estado de pago de una reserva

**Body**:
```json
{
  "estadoPago": "pagado",
  "metodoPago": "Transferencia",
  "referenciaPago": "TRX123456"
}
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Estado de pago actualizado",
  "reserva": { ... }
}
```

### GET /api/reservas/estadisticas
**Descripción**: Obtener estadísticas de reservas

**Respuesta**:
```json
{
  "totalReservas": 150,
  "reservasPendientes": 20,
  "reservasConfirmadas": 100,
  "reservasPagadas": 80,
  "ingresosTotales": 4500000
}
```

## 🎨 Librerías UI Utilizadas

- **shadcn/ui**: Componentes base (Button, Card, Table, Dialog, Select, Input, etc.)
- **lucide-react**: Iconos (Calendar, Download, Filter, Search, etc.)
- **Tailwind CSS**: Estilos y responsive design
- **React Hooks**: useState, useEffect para manejo de estado

## 📦 Dependencias

### Frontend
- react: ^19.1.0
- lucide-react: ^0.510.0
- @radix-ui/* (múltiples componentes)
- tailwindcss: ^4.1.7

### Backend
- express: ^4.19.2
- sequelize: ^6.37.7
- mysql2: ^3.15.1
- cors: ^2.8.5
- dotenv: ^16.4.5

## 🚀 Variables de Entorno

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

### Backend (.env)
```
DB_HOST=localhost
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=transportes_araucaria
DB_PORT=3306
PORT=3001
```

## 🔐 Consideraciones de Seguridad

1. **Validación en Backend**: Todos los endpoints validan campos requeridos
2. **Protección CORS**: Configurado en el backend
3. **Sanitización**: Los datos se sanitizan antes de guardar
4. **Estados ENUM**: Restricción a valores permitidos en la base de datos
5. **Timestamps**: Registro automático de creación y actualización

## 🧪 Testing

### Tests Recomendados

1. **Componente AdminReservas**:
   - Renderizado inicial
   - Apertura/cierre de dialogs
   - Validación de formularios
   - Aplicación de filtros
   - Exportación a CSV

2. **Endpoints del Backend**:
   - Crear reserva con datos válidos
   - Crear reserva con datos inválidos
   - Actualizar estado existente
   - Actualizar estado inexistente
   - Obtener reservas con filtros
   - Obtener estadísticas

3. **Integración**:
   - Flujo completo de creación de reserva
   - Flujo completo de actualización de estado
   - Exportación con diferentes filtros
   - Paginación correcta

## 📈 Métricas de Rendimiento

- **Carga inicial**: < 2 segundos
- **Actualización de tabla**: < 500ms
- **Exportación CSV**: < 1 segundo (1000 registros)
- **Cambio de estado**: < 300ms
- **Búsqueda/Filtrado**: Instantáneo (cliente)

## 🔄 Actualizaciones Futuras

Ver sección "Mejoras Futuras Sugeridas" en GUIA_APP_RESERVAS.md

---

**Última actualización**: Octubre 2025
**Versión**: 1.0.0
