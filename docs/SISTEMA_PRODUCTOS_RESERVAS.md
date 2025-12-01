# Sistema de Productos para Reservas - Similar a Uber Eats

## Descripción General

Este sistema permite a los pasajeros agregar productos (snacks, bebidas, accesorios) a sus reservas confirmadas, mejorando la experiencia del cliente de manera similar a aplicaciones como Uber Eats.

## Características Principales

### 🛍️ Catálogo de Productos
- **Categorías organizadas**: Bebidas, Snacks, Accesorios
- **Información detallada**: Nombre, descripción, precio, disponibilidad
- **Control de stock**: Opcional, permite gestión de inventario
- **Filtros contextuales**: Productos disponibles según ruta o vehículo

### 📦 Gestión de Productos en Reservas
- **Agregar productos**: Los pasajeros pueden agregar productos a reservas confirmadas
- **Control de cantidad**: Selector de cantidad con validación de stock
- **Notas especiales**: Campo para instrucciones (ej: "sin azúcar", "extra frío")
- **Actualización en tiempo real**: Cálculo automático de subtotales y total de reserva
- **Eliminación flexible**: Los pasajeros pueden eliminar productos antes del viaje

### 📧 Notificaciones por Email
- **Al pasajero**: Confirmación de productos agregados con detalles y totales
- **Al conductor**: Notificación de productos pendientes de entrega con instrucciones
- **Formato profesional**: Emails HTML con marca Transportes Araucaria
- **Información completa**: Lista de productos, cantidades, notas especiales

## Arquitectura Técnica

### Backend (Node.js + Express + Sequelize)
**Ubicación**: `/backend/`
**Servidor**: Render.com (Free tier)

#### Modelos de Base de Datos

##### Producto (`/backend/models/Producto.js`)
```javascript
{
  id: INTEGER (PK),
  nombre: STRING(255),
  descripcion: TEXT,
  categoria: STRING(100), // bebidas, snacks, accesorios
  precio: DECIMAL(10,2),
  disponible: BOOLEAN,
  stock: INTEGER (nullable),
  imagenUrl: STRING(500),
  orden: INTEGER,
  disponibleEnRuta: JSON,
  disponibleEnVehiculo: JSON
}
```

##### ProductoReserva (`/backend/models/ProductoReserva.js`)
```javascript
{
  id: INTEGER (PK),
  reservaId: INTEGER (FK),
  productoId: INTEGER (FK),
  cantidad: INTEGER,
  precioUnitario: DECIMAL(10,2),
  subtotal: DECIMAL(10,2),
  notas: TEXT,
  estadoEntrega: ENUM('pendiente', 'preparado', 'entregado', 'cancelado')
}
```

#### Endpoints API

##### Listar Productos
```
GET /api/productos
Query params:
  - categoria: string (opcional)
  - disponible: boolean (opcional)

Response:
{
  "success": true,
  "productos": [...],
  "total": 10
}
```

##### Obtener Producto
```
GET /api/productos/:id

Response:
{
  "success": true,
  "producto": {...}
}
```

##### Obtener Productos de Reserva
```
GET /api/reservas/:id/productos

Response:
{
  "success": true,
  "productos": [...],
  "total": 3,
  "totalProductos": 7500
}
```

##### Agregar Producto a Reserva
```
POST /api/reservas/:id/productos
Body:
{
  "productoId": 1,
  "cantidad": 2,
  "notas": "Sin azúcar"
}

Response:
{
  "success": true,
  "mensaje": "Producto agregado exitosamente",
  "productoReserva": {...},
  "totalProductos": 3500,
  "nuevoTotalReserva": 45000
}
```

##### Actualizar Producto de Reserva
```
PUT /api/reservas/:id/productos/:productoReservaId
Body:
{
  "cantidad": 3,
  "notas": "Extra frío",
  "estadoEntrega": "preparado"
}

Response:
{
  "success": true,
  "mensaje": "Producto actualizado exitosamente",
  "productoReserva": {...},
  "totalProductos": 5000
}
```

##### Eliminar Producto de Reserva
```
DELETE /api/reservas/:id/productos/:productoReservaId

Response:
{
  "success": true,
  "mensaje": "Producto eliminado exitosamente",
  "totalProductos": 2000
}
```

### Frontend (React + Vite)
**Ubicación**: `/src/components/`
**Servidor**: Hostinger

#### Componente ProductosReserva
**Archivo**: `/src/components/ProductosReserva.jsx`

**Props**:
- `reservaId`: ID de la reserva
- `reserva`: Objeto completo de la reserva

**Funcionalidades**:
- Muestra catálogo de productos con filtros por categoría
- Control de cantidad con botones +/-
- Campo para notas especiales
- Lista de productos agregados con posibilidad de eliminar
- Cálculo automático de subtotales
- Integración con API del backend

**Integración**:
```jsx
// En ConsultarReserva.jsx
import ProductosReserva from "./ProductosReserva";

// Dentro del componente
<ProductosReserva reservaId={reserva.id} reserva={reserva} />
```

### Sistema de Notificaciones (PHP + PHPMailer)
**Ubicación**: `/enviar_notificacion_productos.php`
**Servidor**: Hostinger

**Configuración requerida**:
- PHPMailer instalado
- Archivo `config_reservas.php` con credenciales SMTP

**Funcionamiento**:
1. El backend de Node.js hace una petición POST al script PHP
2. El script PHP recibe datos de productos agregados
3. Genera emails HTML profesionales
4. Envía notificación al pasajero
5. Envía notificación al conductor (si está asignado)

## Instalación y Configuración

### 1. Base de Datos
La migración se ejecuta automáticamente al iniciar el servidor:

```bash
cd backend
npm install
npm start
```

La migración `add-productos-tables.js` crea:
- Tabla `productos` con productos de ejemplo
- Tabla `productos_reserva` para relaciones

### 2. Backend (Render.com)
Variables de entorno requeridas:
```env
DB_HOST=srv1551.hstgr.io
DB_PORT=3306
DB_NAME=u419311572_transportes_araucaria
DB_USER=u419311572_admin
DB_PASSWORD=tu_password

FRONTEND_URL=https://transportesaraucaria.cl
PORT=3001
```

### 3. Frontend (Hostinger)
El componente se integra automáticamente. Asegurar que:
- `ProductosReserva.jsx` esté en `/src/components/`
- Se importe en `ConsultarReserva.jsx`
- La variable `API_URL` apunte al backend correcto

### 4. Script PHP de Notificaciones (Hostinger)
**IMPORTANTE**: Este archivo debe ser subido manualmente al servidor de Hostinger.

Ubicar en: `https://transportesaraucaria.cl/enviar_notificacion_productos.php`

Verificar que:
- `config_reservas.php` exista y tenga credenciales SMTP correctas
- PHPMailer esté instalado
- Los permisos del archivo sean correctos (644)

## Productos de Ejemplo

La migración crea estos productos automáticamente:

| Producto | Categoría | Precio |
|----------|-----------|--------|
| Agua Mineral 500ml | bebidas | $1,500 |
| Jugo Natural 300ml | bebidas | $2,500 |
| Café Premium | bebidas | $2,000 |
| Snack Mix | snacks | $2,000 |
| Chocolate | snacks | $1,800 |
| Galletas | snacks | $1,500 |
| Cargador USB | accesorios | $8,000 |
| Almohada de viaje | accesorios | $12,000 |
| Manta de viaje | accesorios | $15,000 |
| Antiparras de sol | accesorios | $10,000 |

## Reglas de Negocio

### Cuándo se Pueden Agregar Productos
✅ Reserva en estado `confirmada`

❌ Reserva en estado `pendiente_detalles`
❌ Reserva en estado `pendiente`
❌ Reserva en estado `completada`
❌ Reserva en estado `cancelada`

### Control de Stock
- Si `stock` es NULL: Sin control (disponibilidad ilimitada)
- Si `stock` es número: Se valida disponibilidad al agregar
- Stock se actualiza automáticamente al agregar/eliminar productos

### Cálculo de Totales
```
Subtotal Producto = Precio Unitario × Cantidad
Total Productos = Suma de todos los subtotales
Nuevo Total Reserva = Total Original Reserva + Total Productos
```

## Pruebas y Validación

### Pruebas Locales
```bash
# Backend
cd backend
npm install
npm start
# Servidor en http://localhost:3001

# Frontend
cd ..
npm install
npm run dev
# Servidor en http://localhost:5173
```

### Pruebas de API
```bash
# Listar productos
curl http://localhost:3001/api/productos

# Agregar producto a reserva
curl -X POST http://localhost:3001/api/reservas/1/productos \
  -H "Content-Type: application/json" \
  -d '{"productoId": 1, "cantidad": 2, "notas": "Sin azúcar"}'

# Obtener productos de reserva
curl http://localhost:3001/api/reservas/1/productos
```

### Verificación de Emails
1. Agregar un producto a una reserva de prueba
2. Verificar que llegue email al pasajero
3. Si hay conductor asignado, verificar email al conductor
4. Revisar formato y contenido de los emails

## Flujo Completo del Usuario

1. **Pasajero busca su reserva**
   - Ingresa código de reserva en `/consultar-reserva`
   - Sistema muestra detalles de la reserva

2. **Pasajero ve productos disponibles**
   - Si la reserva está activa/confirmada, aparece sección "Productos Adicionales"
   - Click en "Agregar Productos"

3. **Pasajero selecciona productos**
   - Filtra por categoría (todos, bebidas, snacks, accesorios)
   - Selecciona cantidad
   - Agrega notas especiales (opcional)
   - Click en "Agregar"

4. **Sistema procesa la solicitud**
   - Valida estado de reserva
   - Verifica disponibilidad y stock
   - Registra en base de datos
   - Actualiza totales
   - Envía notificaciones por email

5. **Confirmación**
   - Producto aparece en lista de productos agregados
   - Totales actualizados
   - Emails enviados a pasajero y conductor

## Mantenimiento y Gestión

### Agregar Nuevos Productos
Insertar directamente en la base de datos:

```sql
INSERT INTO productos (nombre, descripcion, categoria, precio, disponible, orden)
VALUES ('Nuevo Producto', 'Descripción', 'categoria', 5000, TRUE, 11);
```

### Actualizar Precios
```sql
UPDATE productos 
SET precio = 2000 
WHERE id = 1;
```

### Deshabilitar Productos
```sql
UPDATE productos 
SET disponible = FALSE 
WHERE id = 1;
```

### Ver Productos Más Vendidos
```sql
SELECT 
  p.nombre,
  COUNT(pr.id) as total_pedidos,
  SUM(pr.cantidad) as cantidad_total,
  SUM(pr.subtotal) as ingresos_total
FROM productos p
JOIN productos_reserva pr ON p.id = pr.producto_id
GROUP BY p.id
ORDER BY cantidad_total DESC;
```

## Consideraciones de Seguridad

✅ Validación de stock antes de agregar productos
✅ Verificación de estado de reserva
✅ Sanitización de entradas (notas, cantidades)
✅ Precios guardados al momento de agregar (no se modifican después)
✅ Autenticación para endpoints administrativos

## Soporte y Contacto

Para problemas o consultas:
- **Email**: contacto@transportesaraucaria.cl
- **Teléfono**: +56 9 1234 5678

## Notas Importantes

⚠️ **Archivos PHP**: El archivo `enviar_notificacion_productos.php` debe ser subido manualmente a Hostinger ya que los archivos PHP no se despliegan automáticamente desde el repositorio.

⚠️ **Render.com Free Tier**: El servidor en Render.com puede tener cold starts (15-30 segundos) si no ha recibido tráfico recientemente.

⚠️ **Base de Datos**: La base de datos MySQL está alojada en Hostinger. Asegurar que las credenciales estén correctas en las variables de entorno.

⚠️ **CORS**: El backend permite peticiones desde el frontend de Hostinger. Verificar configuración de CORS si hay problemas de conexión.
