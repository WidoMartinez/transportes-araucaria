# Capturas y Vista Previa de la APP de Reservas

## 📸 Descripción Visual de la Interfaz

### 1. Header y Acciones Principales

```
┌─────────────────────────────────────────────────────────────────────┐
│ Gestión de Reservas                                                  │
│                                                                       │
│ [🔄 Actualizar]  [📥 Exportar CSV]  [➕ Nueva Reserva]              │
└─────────────────────────────────────────────────────────────────────┘
```

**Elementos**:
- Título grande y claro
- 3 botones de acción principales
- Diseño limpio y espaciado

---

### 2. Estadísticas (4 Cards)

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ 👥 Total        │ ⏰ Pendientes   │ ✅ Confirmadas  │ 💰 Ingresos     │
│   Reservas      │                 │                 │   Totales       │
│                 │                 │                 │                 │
│    150          │      20         │      100        │  $4,500,000     │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Características**:
- 4 tarjetas con métricas clave
- Iconos descriptivos
- Números grandes y legibles
- Actualización en tiempo real

---

### 3. Sección de Filtros

```
┌───────────────────────────────────────────────────────────────────────┐
│ 🔍 Filtros                                                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ [🔎 Nombre, email, teléfono...] [Fecha Desde] [Fecha Hasta]         │
│ [Estado: Todos ▼] [Estado Pago: Todos ▼]                            │
│                                                                       │
│ [Aplicar Filtros]  [Limpiar]                                        │
└───────────────────────────────────────────────────────────────────────┘
```

**Elementos**:
- Campo de búsqueda con icono
- 2 selectores de fecha
- 2 dropdowns para estados
- Botones de acción

---

### 4. Tabla de Reservas (Vista Principal)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Reservas (150 total)                                                                │
├────┬──────────┬─────────────┬─────────────────┬────────────┬──────┬────────┬───────┤
│ ID │ Nombre   │ Contacto    │ Ruta            │ Fecha/Hora │ Pax  │ Monto  │ Estado│
├────┼──────────┼─────────────┼─────────────────┼────────────┼──────┼────────┼───────┤
│ 1  │ Juan     │ juan@e.com  │ Temuco          │ 20/10/2025 │  2   │$45,000 │[🟡 Pe]│
│    │ Pérez    │ +569123456  │ → Pucón         │ 10:00      │      │        │[🟡 Pe]│
├────┼──────────┼─────────────┼─────────────────┼────────────┼──────┼────────┼───────┤
│ 2  │ María    │ maria@e.com │ Aeropuerto      │ 21/10/2025 │  4   │$60,000 │[🟢 Co]│
│    │ González │ +569876543  │ → Villarrica    │ 14:30      │      │        │[🟢 Pa]│
├────┼──────────┼─────────────┼─────────────────┼────────────┼──────┼────────┼───────┤
│ 3  │ Pedro    │ pedro@e.com │ Pucón           │ 22/10/2025 │  1   │$35,000 │[🔵 Co]│
│    │ López    │ +569555555  │ → Temuco        │ 08:00      │      │$32,000 │[🟡 Pe]│
└────┴──────────┴─────────────┴─────────────────┴────────────┴──────┴────────┴───────┘

                            [◀ Anterior] Página 1 de 8 [Siguiente ▶]
```

**Características**:
- Diseño compacto pero legible
- Información en dos líneas cuando es necesario
- Badges de colores para estados
- Precio original tachado si hay descuento
- Navegación de páginas clara

**Colores de Estados**:
- 🟡 Pendiente (Amarillo)
- 🟠 Pendiente Detalles (Naranja)
- 🟢 Confirmada/Pagado (Verde)
- 🔴 Cancelada/Fallido (Rojo)
- 🔵 Completada (Azul)
- 🟣 Reembolsado (Púrpura)

---

### 5. Modal: Nueva Reserva

```
┌───────────────────────────────────────────────────────────────┐
│ Crear Nueva Reserva                                      [✕]  │
├───────────────────────────────────────────────────────────────┤
│ Introduce los datos de la reserva manualmente                │
│                                                               │
│ Nombre *                          Email *                     │
│ [________________]                [________________]          │
│                                                               │
│ Teléfono *                        Pasajeros *                 │
│ [________________]                [__2__]                     │
│                                                               │
│ Origen *                          Destino *                   │
│ [________________]                [________________]          │
│                                                               │
│ Fecha *                           Hora                        │
│ [____/____/____]                  [__:__]                     │
│                                                               │
│ Precio (CLP) *                    Total con Descuento *       │
│ [________________]                [________________]          │
│                                                               │
│ Vehículo                          Estado                      │
│ [________________]                [Pendiente ▼]               │
│                                                               │
│ Observaciones                                                 │
│ [_____________________________________________]               │
│ [_____________________________________________]               │
│ [_____________________________________________]               │
│                                                               │
│                         [Cancelar]  [Crear Reserva]          │
└───────────────────────────────────────────────────────────────┘
```

**Características**:
- Formulario organizado en 2 columnas
- Campos marcados con * son obligatorios
- Validación en tiempo real
- Botones de acción claros
- Scroll para campos adicionales

---

### 6. Interacción: Cambio de Estado

**Antes del click**:
```
┌─────────────────────────────────────┐
│ Estado                              │
├─────────────────────────────────────┤
│ [🟡 pendiente ▼]                    │
└─────────────────────────────────────┘
```

**Después del click (dropdown abierto)**:
```
┌─────────────────────────────────────┐
│ [🟡 pendiente ▼]                    │
├─────────────────────────────────────┤
│ > Pendiente                         │
│   Pendiente Detalles                │
│   Confirmada                        │
│   Cancelada                         │
│   Completada                        │
└─────────────────────────────────────┘
```

**Después de seleccionar nuevo estado**:
```
┌─────────────────────────────────────┐
│ Estado                              │
├─────────────────────────────────────┤
│ [🟢 confirmada ▼]                   │
└─────────────────────────────────────┘
```

**Proceso**:
1. Usuario hace click en el badge
2. Se abre dropdown con opciones
3. Usuario selecciona nueva opción
4. Se envía PUT al backend
5. Badge se actualiza automáticamente

---

### 7. Exportación a CSV

**Archivo generado: `reservas_2025-10-11.csv`**

```csv
ID,Nombre,Email,Teléfono,Origen,Destino,Fecha,Hora,Pasajeros,Precio,Total con Descuento,Estado,Estado Pago,Método Pago,Observaciones,Fecha Creación
1,"Juan Pérez",juan@email.com,+56912345678,"Temuco","Pucón",2025-10-20,10:00,2,50000,45000,pendiente,pendiente,,Cliente VIP,2025-10-11
2,"María González",maria@email.com,+56987654321,"Aeropuerto","Villarrica",2025-10-21,14:30,4,65000,60000,confirmada,pagado,Transferencia,,2025-10-11
```

**Características**:
- BOM UTF-8 para correcta visualización en Excel
- Comillas en campos de texto con posibles comas
- Todos los campos incluidos
- Formato estándar CSV

---

### 8. Vista Responsive - Móvil

```
┌──────────────────────┐
│ Gestión de Reservas  │
├──────────────────────┤
│ [🔄] [📥] [➕]       │
├──────────────────────┤
│ 👥 Total: 150        │
│ ⏰ Pendientes: 20    │
│ ✅ Confirmadas: 100  │
│ 💰 Ingresos: $4.5M   │
├──────────────────────┤
│ 🔍 Filtros           │
│ [Búsqueda...       ] │
│ [Fecha Desde       ] │
│ [Fecha Hasta       ] │
│ [Estado ▼         ] │
│ [Estado Pago ▼    ] │
│ [Aplicar] [Limpiar] │
├──────────────────────┤
│ Reservas (150)       │
├──────────────────────┤
│ ╔═══════════════════╗│
│ ║ #1 - Juan Pérez   ║│
│ ║ juan@email.com    ║│
│ ║ +56912345678      ║│
│ ║ Temuco → Pucón    ║│
│ ║ 20/10 10:00 (2p)  ║│
│ ║ $45,000           ║│
│ ║ 🟡 Pendiente      ║│
│ ║ 🟡 Pendiente      ║│
│ ╚═══════════════════╝│
├──────────────────────┤
│ ╔═══════════════════╗│
│ ║ #2 - María G.     ║│
│ ║ maria@email.com   ║│
│ ║ +56987654321      ║│
│ ║ Aerop → Villarri  ║│
│ ║ 21/10 14:30 (4p)  ║│
│ ║ $60,000           ║│
│ ║ 🟢 Confirmada     ║│
│ ║ 🟢 Pagado         ║│
│ ╚═══════════════════╝│
├──────────────────────┤
│ [◀] Pág 1 de 8 [▶]  │
└──────────────────────┘
```

**Adaptaciones Móviles**:
- Botones más grandes y táctiles
- Estadísticas en lista vertical
- Tabla convertida a cards
- Información condensada
- Scroll vertical optimizado

---

### 9. Estados de Carga

**Cargando Inicial**:
```
┌──────────────────────────────────┐
│                                  │
│          ⚙️ Loading...          │
│     Cargando reservas...         │
│                                  │
└──────────────────────────────────┘
```

**Sin Resultados**:
```
┌──────────────────────────────────┐
│ Reservas (0 total - filtradas)   │
├──────────────────────────────────┤
│                                  │
│     📭 No se encontraron         │
│        reservas                  │
│                                  │
└──────────────────────────────────┘
```

**Error**:
```
┌──────────────────────────────────┐
│ ⚠️ Error al cargar reservas      │
│ Error: No se pudo conectar       │
│        al servidor               │
└──────────────────────────────────┘
```

---

## 🎨 Paleta de Colores

### Colores de Estado (Reserva)
- **Pendiente**: `bg-yellow-500` (#EAB308)
- **Pendiente Detalles**: `bg-orange-500` (#F97316)
- **Confirmada**: `bg-green-500` (#22C55E)
- **Cancelada**: `bg-red-500` (#EF4444)
- **Completada**: `bg-blue-500` (#3B82F6)

### Colores de Estado (Pago)
- **Pendiente**: `bg-yellow-500` (#EAB308)
- **Pagado**: `bg-green-500` (#22C55E)
- **Fallido**: `bg-red-500` (#EF4444)
- **Reembolsado**: `bg-purple-500` (#A855F7)

### Colores Principales
- **Primary**: Azul del branding
- **Background**: Blanco (#FFFFFF)
- **Muted**: Gris claro (#F3F4F6)
- **Border**: Gris medio (#E5E7EB)
- **Text**: Negro (#000000)
- **Muted Text**: Gris oscuro (#6B7280)

---

## 🖱️ Interacciones del Usuario

### Hover en Botones
```
Normal:    [Exportar CSV]
Hover:     [Exportar CSV] ← Color más oscuro, cursor pointer
```

### Hover en Filas de Tabla
```
Normal:    │ 1 │ Juan Pérez │ ... │
Hover:     │ 1 │ Juan Pérez │ ... │ ← Fondo gris claro
```

### Click en Dropdown
```
Cerrado:   [🟡 pendiente ▼]
Abierto:   [🟡 pendiente ▲] con menú desplegable
```

### Loading en Botón
```
Normal:    [Actualizar]
Loading:   [⚙️ Cargando...]
```

---

## 📱 Breakpoints Responsive

### Desktop (≥ 1024px)
- Tabla completa con todas las columnas
- Filtros en grid de 5 columnas
- Estadísticas en 4 columnas

### Tablet (768px - 1023px)
- Tabla scrollable horizontalmente
- Filtros en grid de 3 columnas
- Estadísticas en 2 columnas

### Móvil (< 768px)
- Cards en lugar de tabla
- Filtros en columna única
- Estadísticas en columna única
- Botones full-width

---

## ✨ Animaciones y Transiciones

1. **Apertura de Modal**: Fade in + scale (300ms)
2. **Cambio de Estado**: Badge color transition (200ms)
3. **Hover**: Smooth background transition (150ms)
4. **Loading**: Spinner rotation continua
5. **Filtros aplicados**: Fade in de resultados (300ms)

---

## 🎯 Accesibilidad

- ✅ Etiquetas semánticas (aria-labels)
- ✅ Navegación por teclado
- ✅ Contraste de colores WCAG AA
- ✅ Tamaños de texto legibles
- ✅ Áreas de click de al menos 44x44px
- ✅ Mensajes de error claros

---

**Nota**: Estas son representaciones textuales de la interfaz. Para ver la interfaz real, acceder al panel administrativo en el navegador.

**Última actualización**: Octubre 2025
