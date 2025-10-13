# Guía Visual - Módulo de Productos

## 🎨 Capturas de Pantalla y Flujo Visual

### 1. Panel de Administración - Vista Principal

**Ubicación**: `/admin?panel=productos` o `/admin` → Pestaña "Productos"

```
┌─────────────────────────────────────────────────────────────┐
│ Panel Administrativo                                         │
├─────────────────────────────────────────────────────────────┤
│ [Reservas] [Precios] [Productos] [Códigos] [Códigos Mejorado]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Gestión de Productos                    [+ Nuevo Producto] │
│  Administra los productos disponibles para las reservas      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📦 Productos (6)                                       │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Imagen │ Nombre              │ Categoría │ Precio  │   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ [🥤]   │ Coca-Cola 500ml     │ Bebidas   │ $1.500  │✓  │ │
│  │ [💧]   │ Agua Mineral 500ml  │ Bebidas   │ $1.000  │✓  │ │
│  │ [🥪]   │ Sándwich J&Q        │ Comida    │ $3.500  │✓  │ │
│  │ [🍪]   │ Galletas Chocolate  │ Snacks    │ $1.800  │✓  │ │
│  │ [☕]   │ Café Americano      │ Bebidas   │ $2.000  │✓  │ │
│  │ [🥜]   │ Snack Mix           │ Snacks    │ $2.500  │✓  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Crear/Editar Producto - Modal

**Acción**: Click en "+ Nuevo Producto" o "Editar"

```
┌─────────────────────────────────────────────┐
│ Nuevo Producto                          [X] │
├─────────────────────────────────────────────┤
│ Agrega un nuevo producto al catálogo        │
│                                             │
│ Nombre *                                    │
│ ┌─────────────────────────────────────┐    │
│ │ Coca-Cola 500ml                      │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Descripción                                 │
│ ┌─────────────────────────────────────┐    │
│ │ Bebida refrescante en botella...    │    │
│ │                                      │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Precio (CLP) *     │ Categoría              │
│ ┌─────────┐        │ ┌──────────────┐      │
│ │ 1500    │        │ │ Bebidas ▼    │      │
│ └─────────┘        │ └──────────────┘      │
│                                             │
│ URL de Imagen                               │
│ ┌─────────────────────────────────────┐    │
│ │ https://...imagen.jpg               │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ [Vista previa de imagen]                    │
│                                             │
│ Orden          │ Stock (opcional)           │
│ ┌────┐         │ ┌────┐                     │
│ │ 0  │         │ │    │                     │
│ └────┘         │ └────┘                     │
│                                             │
│ ☑ Producto activo                           │
│                                             │
│          [Cancelar]  [Crear Producto]       │
└─────────────────────────────────────────────┘
```

### 3. Página de Productos para Clientes

**Ubicación**: `/productos` o `#productos`

#### Vista Inicial - Búsqueda de Reserva

```
┌─────────────────────────────────────────────┐
│                                             │
│         Agregar Productos                   │
│   Complementa tu viaje con productos        │
│         para el camino                      │
│                                             │
│  ┌───────────────────────────────────┐     │
│  │ 🔍 Buscar Reserva                 │     │
│  ├───────────────────────────────────┤     │
│  │                                   │     │
│  │ Código de Reserva                 │     │
│  │ ┌──────────────────────────┐     │     │
│  │ │ Ej: 123                  │     │     │
│  │ └──────────────────────────┘     │     │
│  │ Ingresa el número de tu reserva  │     │
│  │                                   │     │
│  │   [Buscar Reserva]               │     │
│  └───────────────────────────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

#### Vista Principal - Selección de Productos

```
┌──────────────────────────────────────────────────────────┐
│ Agregar Productos                                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Reserva #123                                        │  │
│ ├─────────────────────────────────────────────────────┤  │
│ │ Juan Pérez  │  Pucón  │  2025-10-15                 │  │
│ │ [Buscar otra reserva]                               │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ ☕ Bebidas 🔢 3                                      │  │
│ ├─────────────────────────────────────────────────────┤  │
│ │  ┌────────────────────┐  ┌────────────────────┐    │  │
│ │  │ [🥤]               │  │ [💧]               │    │  │
│ │  │ Coca-Cola 500ml    │  │ Agua Mineral       │    │  │
│ │  │ Bebida refrescante │  │ Agua mineral sin gas│   │  │
│ │  │ $1.500             │  │ $1.000             │    │  │
│ │  │ [- 2 +] [X]        │  │ [Agregar]          │    │  │
│ │  └────────────────────┘  └────────────────────┘    │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 🍔 Comida 🔢 1                                      │  │
│ ├─────────────────────────────────────────────────────┤  │
│ │  ┌────────────────────┐                            │  │
│ │  │ [🥪]               │                            │  │
│ │  │ Sándwich J&Q       │                            │  │
│ │  │ Jamón y queso con  │                            │  │
│ │  │ vegetales frescos  │                            │  │
│ │  │ $3.500             │                            │  │
│ │  │ [- 1 +] [X]        │                            │  │
│ │  └────────────────────┘                            │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 🍪 Snacks 🔢 2                                      │  │
│ ├─────────────────────────────────────────────────────┤  │
│ │  (productos de snacks...)                          │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Total items: 🔢 4                                   │  │
│ │ Total productos: $7.800                             │  │
│ │                           [🛒 Confirmar (4)]        │  │
│ └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 4. Resumen del Carrito (Vista Móvil)

```
┌──────────────────────┐
│                      │
│  🛒 4 productos      │
│                      │
│  $7.800             │
│                      │
│  [Guardar Productos] │
│                      │
└──────────────────────┘
```

### 5. Confirmación de Guardado

```
┌──────────────────────────────────────┐
│ ✓ ¡Productos guardados!              │
│                                      │
│ Se han agregado 4 productos a tu     │
│ reserva #123                         │
└──────────────────────────────────────┘
```

## 🎯 Flujo Completo de Usuario

### Paso a Paso - Cliente

1. **Hacer Reserva**
   - Cliente reserva transporte en la página principal
   - Recibe confirmación con ID de reserva: #123

2. **Acceder a Productos**
   - Navega a `/productos`
   - Ve formulario de búsqueda

3. **Buscar Reserva**
   - Ingresa código: 123
   - Click en "Buscar Reserva"
   - Sistema valida y muestra información de la reserva

4. **Seleccionar Productos**
   - Navega por categorías (Bebidas, Comida, Snacks)
   - Click en "Agregar" para producto deseado
   - Usa [+] y [-] para ajustar cantidad
   - Ve resumen actualizado en tiempo real

5. **Confirmar Compra**
   - Revisa carrito con total
   - Click en "Guardar Productos"
   - Recibe confirmación de éxito

### Paso a Paso - Administrador

1. **Acceder al Admin**
   - Navega a `/admin`
   - Click en pestaña "Productos"

2. **Crear Producto**
   - Click en "+ Nuevo Producto"
   - Completa formulario:
     - Nombre: "Jugo Natural"
     - Precio: $2500
     - Categoría: Bebidas
     - Imagen URL
   - Click en "Crear Producto"

3. **Editar Producto**
   - Click en icono de editar (✏️)
   - Modifica campos necesarios
   - Click en "Actualizar"

4. **Gestionar Estado**
   - Click en badge de estado (Activo/Inactivo)
   - Alterna entre activo e inactivo
   - Solo productos activos aparecen a clientes

5. **Eliminar Producto**
   - Click en icono de eliminar (🗑️)
   - Confirma eliminación
   - Producto se elimina permanentemente

## 📱 Diseño Responsive

### Desktop (> 1024px)
- 3 columnas de productos
- Panel lateral con resumen
- Navegación horizontal de categorías

### Tablet (768px - 1024px)
- 2 columnas de productos
- Resumen integrado en contenido
- Categorías en scroll horizontal

### Móvil (< 768px)
- 1 columna de productos
- Carrito fijo en parte inferior
- Categorías colapsables

## 🎨 Paleta de Colores

- **Primary**: Azul #0066CC (botones principales)
- **Success**: Verde #22C55E (confirmaciones)
- **Warning**: Amarillo #F59E0B (advertencias)
- **Destructive**: Rojo #EF4444 (eliminar)
- **Muted**: Gris #6B7280 (texto secundario)

## 🔤 Iconografía

- ☕ Bebidas (Coffee)
- 🍔 Comida (Utensils)
- 🍪 Snacks (Cookie)
- 📦 General/Sin categoría (Package)
- 🛒 Carrito (ShoppingCart)
- ➕ Agregar (Plus)
- ➖ Quitar (Minus)
- ❌ Eliminar (X)
- ✏️ Editar (Edit)
- 🗑️ Borrar (Trash)
- ✓ Confirmado (CheckCircle)

## 💻 Tecnologías de UI

- **Framework**: React 19
- **Estilos**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Iconos**: Lucide React
- **Formularios**: React Hook Form
- **Estados**: React Hooks

## 🎭 Animaciones

- Hover en productos: Sombra + Escala
- Transiciones: 200ms ease-in-out
- Loading: Pulse animation
- Confirmación: Fade in/out

Esta guía visual proporciona una referencia completa del diseño y flujo del módulo de productos.
