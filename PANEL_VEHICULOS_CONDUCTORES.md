# Panel de Gestión de Vehículos y Conductores

## Descripción

Se ha implementado un sistema completo de gestión de vehículos y conductores en el panel administrativo, permitiendo llevar un control detallado de la flota y el personal.

## Características Implementadas

### Panel de Vehículos

**Gestión completa de vehículos:**
- ✅ Crear nuevos vehículos
- ✅ Editar vehículos existentes
- ✅ Eliminar vehículos
- ✅ Búsqueda por patente, marca o modelo
- ✅ Filtros por tipo (Sedan, Van, Minibus)
- ✅ Filtros por estado (Disponible, En Uso, Mantenimiento, Inactivo)

**Campos del vehículo:**
- Patente (obligatorio, único)
- Tipo: Sedan, Van, Minibus (obligatorio)
- Marca
- Modelo
- Año
- Capacidad de pasajeros
- Estado
- Observaciones

### Panel de Conductores

**Gestión completa de conductores:**
- ✅ Crear nuevos conductores
- ✅ Editar conductores existentes
- ✅ Eliminar conductores
- ✅ Búsqueda por nombre, RUT o teléfono
- ✅ Filtros por estado (Disponible, Ocupado, Descanso, Inactivo)

**Campos del conductor:**
- Nombre completo (obligatorio)
- RUT (obligatorio, único, con formato automático)
- Teléfono (obligatorio)
- Email
- Número de licencia
- Fecha de vencimiento de licencia
- Estado
- Observaciones

## Estructura Técnica

### Backend

**Modelos creados:**
- `backend/models/Vehiculo.js` - Modelo Sequelize para vehículos
- `backend/models/Conductor.js` - Modelo Sequelize para conductores

**Endpoints API creados:**

#### Vehículos
- `GET /api/vehiculos` - Listar todos los vehículos (con filtros opcionales)
- `GET /api/vehiculos/:id` - Obtener un vehículo específico
- `POST /api/vehiculos` - Crear un nuevo vehículo
- `PUT /api/vehiculos/:id` - Actualizar un vehículo
- `DELETE /api/vehiculos/:id` - Eliminar un vehículo

#### Conductores
- `GET /api/conductores` - Listar todos los conductores (con filtros opcionales)
- `GET /api/conductores/:id` - Obtener un conductor específico
- `POST /api/conductores` - Crear un nuevo conductor
- `PUT /api/conductores/:id` - Actualizar un conductor
- `DELETE /api/conductores/:id` - Eliminar un conductor

**Características del backend:**
- Validación de campos obligatorios
- Formateo automático de RUT chileno
- Validación de unicidad (patente para vehículos, RUT para conductores)
- Manejo de errores robusto
- Transacciones para mantener integridad de datos

### Frontend

**Componentes creados:**
- `src/components/AdminVehiculos.jsx` - Panel de gestión de vehículos
- `src/components/AdminConductores.jsx` - Panel de gestión de conductores

**Características de la UI:**
- Diseño responsivo y moderno
- Interfaz intuitiva con iconos
- Diálogos modales para crear/editar
- Confirmación antes de eliminar
- Badges de estado con colores
- Búsqueda en tiempo real
- Filtros múltiples
- Mensajes de error claros

**Integración:**
- Añadidos botones "Vehículos" y "Conductores" en `AdminDashboard.jsx`
- Sistema de navegación por URL params
- Estado reactivo con hooks de React

## Uso del Sistema

### Acceso al Panel

1. Ingresar al panel administrativo: `/admin`
2. Hacer clic en el botón "Vehículos" o "Conductores" en la barra de navegación

### Gestionar Vehículos

**Crear un vehículo:**
1. Hacer clic en "Nuevo Vehículo"
2. Completar los campos obligatorios (Patente y Tipo)
3. Opcionalmente completar marca, modelo, año, capacidad
4. Seleccionar el estado del vehículo
5. Hacer clic en "Crear"

**Editar un vehículo:**
1. Hacer clic en el botón de edición (lápiz) en la fila del vehículo
2. Modificar los campos deseados
3. Hacer clic en "Actualizar"

**Eliminar un vehículo:**
1. Hacer clic en el botón de eliminación (papelera) en la fila del vehículo
2. Confirmar la eliminación en el diálogo

### Gestionar Conductores

**Crear un conductor:**
1. Hacer clic en "Nuevo Conductor"
2. Completar los campos obligatorios (Nombre, RUT, Teléfono)
3. Opcionalmente completar email, licencia, fecha de vencimiento
4. Seleccionar el estado del conductor
5. Hacer clic en "Crear"

**Editar un conductor:**
1. Hacer clic en el botón de edición (lápiz) en la fila del conductor
2. Modificar los campos deseados
3. Hacer clic en "Actualizar"

**Eliminar un conductor:**
1. Hacer clic en el botón de eliminación (papelera) en la fila del conductor
2. Confirmar la eliminación en el diálogo

## Base de Datos

### Tabla: vehiculos

```sql
CREATE TABLE vehiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patente VARCHAR(10) NOT NULL UNIQUE,
  tipo ENUM('sedan', 'van', 'minibus') NOT NULL DEFAULT 'sedan',
  marca VARCHAR(50),
  modelo VARCHAR(50),
  anio INT,
  capacidad INT NOT NULL DEFAULT 4,
  estado ENUM('disponible', 'en_uso', 'mantenimiento', 'inactivo') NOT NULL DEFAULT 'disponible',
  observaciones TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patente (patente),
  INDEX idx_tipo (tipo),
  INDEX idx_estado (estado)
);
```

### Tabla: conductores

```sql
CREATE TABLE conductores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  rut VARCHAR(20) NOT NULL UNIQUE,
  telefono VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  licencia VARCHAR(50),
  fechaVencimientoLicencia DATE,
  estado ENUM('disponible', 'ocupado', 'descanso', 'inactivo') NOT NULL DEFAULT 'disponible',
  observaciones TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rut (rut),
  INDEX idx_estado (estado)
);
```

## Próximas Mejoras Sugeridas

1. **Integración con Reservas:**
   - Asignar vehículo y conductor a cada reserva
   - Validar disponibilidad antes de asignar
   - Mostrar historial de viajes por vehículo/conductor

2. **Dashboard de Estadísticas:**
   - Total de vehículos por tipo y estado
   - Total de conductores por estado
   - Vehículos más utilizados
   - Conductores con más viajes

3. **Mantenimiento de Vehículos:**
   - Programar mantenimientos
   - Alertas de vencimiento de licencias
   - Historial de mantenimientos

4. **Reportes:**
   - Exportar listado de vehículos a Excel/PDF
   - Exportar listado de conductores a Excel/PDF
   - Generar reportes de uso

## Capturas de Pantalla

### Panel de Vehículos
![Panel de Vehículos](https://github.com/user-attachments/assets/54d582c0-ffec-4505-8085-9d1085b9bb6d)

### Formulario de Nuevo Vehículo
![Formulario de Vehículo](https://github.com/user-attachments/assets/99eb464f-babe-4117-b2bc-daea688f98ad)

### Panel de Conductores
![Panel de Conductores](https://github.com/user-attachments/assets/48520281-dbc9-49cc-b725-438d34141653)

### Formulario de Nuevo Conductor
![Formulario de Conductor](https://github.com/user-attachments/assets/1b8b0f8e-e3f9-4a89-806b-66ddd1b35fc9)

## Notas Técnicas

- El backend usa Sequelize ORM para la gestión de datos
- Las tablas se crean automáticamente mediante sincronización de modelos
- El formateo de RUT sigue el estándar chileno (XXXXXXXX-X)
- Los estados de los vehículos y conductores son enumeraciones para garantizar consistencia
- Las validaciones están tanto en frontend como en backend para máxima seguridad
