# Módulo de Productos - Transportes Araucaria

## 📦 Descripción General

Sistema completo de gestión de productos para complementar las reservas de transporte. Los clientes pueden agregar productos como bebidas, snacks y comidas a sus reservas usando el código de reserva.

## 🎯 Características Principales

### Panel Administrativo
- **Gestión CRUD completa** de productos
- **Categorización** por tipo (Bebidas, Comida, Snacks, etc.)
- **Control de stock** opcional
- **Imágenes** de productos
- **Activación/desactivación** de productos
- **Orden personalizado** de visualización

### Experiencia de Usuario
- **Interfaz estilo UberEats** con diseño moderno
- **Búsqueda por código** de reserva
- **Categorías visuales** con iconos
- **Contador de cantidad** por producto
- **Carrito de compras** con resumen en tiempo real
- **Cálculo automático** del total

## 🚀 Acceso

### Panel de Administración
- **URL**: `/admin` o `?admin=true`
- **Pestaña**: "Productos"
- Gestiona todo el catálogo de productos desde aquí

### Página de Productos para Clientes
- **URL**: `/productos` o `#productos`
- Los clientes ingresan su código de reserva
- Pueden agregar productos a su reserva existente

## 📊 Base de Datos

### Tabla: `productos`
```sql
- id (INT, PK)
- nombre (VARCHAR 255)
- descripcion (TEXT)
- precio (DECIMAL 10,2)
- imagen (VARCHAR 500)
- categoria (VARCHAR 100)
- activo (BOOLEAN)
- orden (INT)
- stock (INT, nullable)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Tabla: `productos_reservas`
```sql
- id (INT, PK)
- reservaId (INT, FK → reservas.id)
- productoId (INT, FK → productos.id)
- cantidad (INT)
- precioUnitario (DECIMAL 10,2)
- subtotal (DECIMAL 10,2)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

## 🔌 API Endpoints

### Productos

```javascript
// Obtener todos los productos (o solo activos)
GET /api/productos?activos=true

// Obtener un producto específico
GET /api/productos/:id

// Crear un nuevo producto
POST /api/productos
Body: {
  nombre: string,
  descripcion: string,
  precio: number,
  imagen: string,
  categoria: string,
  activo: boolean,
  orden: number,
  stock: number | null
}

// Actualizar un producto
PUT /api/productos/:id
Body: { ...campos a actualizar }

// Eliminar un producto
DELETE /api/productos/:id
```

### Productos en Reservas

```javascript
// Agregar productos a una reserva
POST /api/reservas/:id/productos
Body: {
  productos: [
    { productoId: number, cantidad: number },
    ...
  ]
}

// Obtener productos de una reserva
GET /api/reservas/:id/productos
Response: {
  productos: [...],
  totalProductos: number
}
```

## 💡 Productos de Ejemplo

El sistema inicializa automáticamente 6 productos de ejemplo:

1. **Coca-Cola 500ml** - $1,500
2. **Agua Mineral 500ml** - $1,000
3. **Sándwich Jamón y Queso** - $3,500
4. **Galletas de Chocolate** - $1,800
5. **Café Americano** - $2,000
6. **Snack Mix** - $2,500

## 🎨 Categorías

- **Bebidas**: Refrescos, agua, café
- **Comida**: Sándwiches, comidas preparadas
- **Snacks**: Galletas, chips, frutos secos
- **General**: Productos sin categoría específica
- **Otros**: Categoría personalizable

## 🔄 Flujo de Uso

### Para Clientes:

1. Cliente realiza una reserva de transporte
2. Recibe código de reserva (ID)
3. Accede a `/productos`
4. Ingresa su código de reserva
5. Navega por las categorías de productos
6. Agrega productos y ajusta cantidades
7. Confirma y guarda los productos
8. Los productos quedan vinculados a su reserva

### Para Administradores:

1. Accede al panel de administración
2. Selecciona la pestaña "Productos"
3. Puede:
   - Ver todos los productos
   - Crear nuevos productos
   - Editar productos existentes
   - Activar/desactivar productos
   - Eliminar productos
   - Cambiar orden de visualización

## 🎯 Casos de Uso

### Agregar Bebida a Reserva
```
Cliente reserva traslado Temuco → Pucón
ID Reserva: 123
Accede a /productos
Ingresa código: 123
Selecciona: 2x Coca-Cola + 1x Agua
Total productos: $4,000
Confirma
```

### Crear Producto Estacional
```
Admin crea "Chocolate Caliente"
Categoría: Bebidas
Precio: $2,500
Imagen: [URL]
Activo: Sí
Aparece en catálogo
```

## 🔒 Seguridad

- Validación de ID de reserva
- Solo productos activos visibles para clientes
- Control de stock opcional
- Precios guardados al momento de compra
- Subtotales calculados automáticamente

## 📱 Responsive

- Diseño totalmente responsive
- Funciona en móviles, tablets y desktop
- Grid adaptativo para productos
- Carrito fijo en móvil para fácil acceso

## 🚧 Futuras Mejoras Sugeridas

- [ ] Integración con sistema de pago
- [ ] Notificaciones por email de productos agregados
- [ ] Recomendaciones de productos
- [ ] Combos y ofertas especiales
- [ ] Control de disponibilidad por horario
- [ ] Imágenes múltiples por producto
- [ ] Valoraciones y reseñas
- [ ] Historial de productos más vendidos

## 📝 Notas Técnicas

- **Backend**: Node.js + Express + Sequelize
- **Frontend**: React + Vite + Tailwind CSS
- **Base de Datos**: MySQL
- **Componentes UI**: shadcn/ui
- **Íconos**: Lucide React

## 🐛 Troubleshooting

### Productos no cargan
- Verificar conexión a API
- Revisar que haya productos activos
- Verificar logs del servidor

### No se pueden guardar productos
- Verificar ID de reserva válido
- Comprobar que la reserva existe
- Revisar permisos de API

### Imágenes no se muestran
- Verificar URLs de imágenes
- Usar HTTPS para imágenes
- Comprobar CORS si es externo
