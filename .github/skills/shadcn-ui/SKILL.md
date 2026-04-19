# SKILL: shadcn/ui — Superpoderes para Transportes Araucanía

## Propósito
Guía maestra de referencia rápida para instalar, usar, personalizar y extender **shadcn/ui** en este proyecto. Cubre todos los comandos CLI, componentes disponibles, tematización, patrones de composición y anti-patrones a evitar.

---

## 🏗️ Configuración actual del proyecto

```json
// components.json (valores actuales del proyecto)
{
  "style": "new-york",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "",
    "css": "src/App.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Stack del proyecto:**
| Capa | Valor |
|------|-------|
| Stack | React 18 (JSX, NO TypeScript) |
| Bundler | Vite |
| Estilos | Tailwind CSS v4 |
| Estilo shadcn | `new-york` |
| CSS variables | `true` |
| Componentes UI | `src/components/ui/` |
| Package manager | `pnpm` |

---

## 🤖 Operativa MCP + Tailwind v4

El proyecto ya tiene operativo el MCP de shadcn y el registry configurado es `@shadcn`.

### Flujo recomendado para el agente
1. **Revisar primero** si el componente ya existe en `src/components/ui/`.
2. **Consultar el registry vía MCP** antes de instalar nada nuevo.
3. **Pedir ejemplos o ver el item** si la composición no es obvia.
4. **Agregar solo lo que falta** con el comando generado por shadcn.
5. **Personalizar fuera de `ui/`** creando wrappers en componentes de negocio.
6. **Aplicar estilos con Tailwind v4** usando tokens semánticos y `@theme inline {}` en `src/App.css`.

### Herramientas MCP a priorizar
```text
mcp_shadcn_get_project_registries
mcp_shadcn_search_items_in_registries
mcp_shadcn_view_items_in_registries
mcp_shadcn_get_item_examples_from_registries
mcp_shadcn_get_add_command_for_items
```

### Regla de diseño del proyecto
- Priorizar `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-accent`, `border-border` y demás tokens semánticos antes que colores hardcodeados.
- Usar la paleta `forest` y `cafe` definida en `src/App.css`.
- Mantener `chocolate-*` solo como alias de compatibilidad donde el proyecto ya lo use.

---

## ⚡ Comandos CLI de shadcn (pnpm)

### Agregar componentes
```bash
# Agregar un componente
pnpm dlx shadcn@latest add button

# Agregar múltiples componentes de una vez
pnpm dlx shadcn@latest add button card dialog input

# Agregar todos los componentes disponibles
pnpm dlx shadcn@latest add --all

# Forzar sobreescritura de un componente existente
pnpm dlx shadcn@latest add button --overwrite

# Vista previa sin escribir archivos (dry-run)
pnpm dlx shadcn@latest add button --dry-run

# Ver diff de un componente antes de instalarlo
pnpm dlx shadcn@latest add button --diff
```

### Ver y buscar componentes
```bash
# Ver el código de un componente antes de instalarlo
pnpm dlx shadcn@latest view button

# Ver múltiples componentes
pnpm dlx shadcn@latest view button card dialog

# Buscar componentes en el registry
pnpm dlx shadcn@latest search @shadcn -q "button"

# Listar todos los componentes disponibles
pnpm dlx shadcn@latest list @shadcn
```

### Documentación y diagnóstico
```bash
# Ver docs y API de un componente
pnpm dlx shadcn@latest docs button

# Ver información del proyecto actual
pnpm dlx shadcn@latest info

# Inicializar (si fuera un proyecto nuevo)
pnpm dlx shadcn@latest init -t vite
```

### Migraciones
```bash
# Migrar a imports unificados de radix-ui
pnpm dlx shadcn@latest migrate radix

# Migrar componentes para soporte RTL
pnpm dlx shadcn@latest migrate rtl
```

---

## 📦 Componentes ya instalados en el proyecto

Todos ubicados en `src/components/ui/`:

| Componente | Archivo | Uso principal |
|-----------|---------|---------------|
| Accordion | `accordion.jsx` | FAQ, secciones expandibles |
| Alert | `alert.jsx` | Mensajes de estado/error |
| Alert Dialog | `alert-dialog.jsx` | Confirmaciones destructivas |
| Aspect Ratio | `aspect-ratio.jsx` | Contenedores con proporción fija |
| Avatar | `avatar.jsx` | Foto de perfil de conductores/usuarios |
| Badge | `badge.jsx` | Etiquetas de estado de reservas |
| Breadcrumb | `breadcrumb.jsx` | Navegación por pasos |
| Button | `button.jsx` | Botones principales del sistema |
| Calendar | `calendar.jsx` | Selección de fechas de reserva |
| Card | `card.jsx` | Tarjetas de información |
| Carousel | `carousel.jsx` | Galería de imágenes/tours |
| Chart | `chart.jsx` | Gráficas del dashboard admin |
| Checkbox | `checkbox.jsx` | Formularios de selección múltiple |
| Collapsible | `collapsible.jsx` | Secciones colapsables |
| Command | `command.jsx` | Búsqueda y comandos |
| Context Menu | `context-menu.jsx` | Menú contextual con clic derecho |
| Date Picker | `date-picker.jsx` | Selector de fecha amigable |
| Dialog | `dialog.jsx` | Modales del sistema |
| Drawer | `drawer.jsx` | Panel lateral móvil |
| Dropdown Menu | `dropdown-menu.jsx` | Menús desplegables |
| Form | `form.jsx` | Formularios con validación (react-hook-form) |
| Hover Card | `hover-card.jsx` | Tarjeta de información al hover |
| Input | `input.jsx` | Campos de texto |
| Input OTP | `input-otp.jsx` | Códigos de verificación |
| Label | `label.jsx` | Etiquetas de formularios |
| Menubar | `menubar.jsx` | Barra de menú horizontal |
| Navigation Menu | `navigation-menu.jsx` | Navegación principal |
| Pagination | `pagination.jsx` | Paginación de reservas/admin |
| Popover | `popover.jsx` | Información emergente |
| Progress | `progress.jsx` | Progreso de reservas por pasos |
| Radio Group | `radio-group.jsx` | Selección única |
| Resizable | `resizable.jsx` | Paneles redimensionables |
| Scroll Area | `scroll-area.jsx` | Áreas con scroll personalizado |
| Select | `select.jsx` | Listas desplegables |
| Separator | `separator.jsx` | Separadores visuales |
| Sheet | `sheet.jsx` | Panel lateral (drawer) |
| Sidebar | `sidebar.jsx` | Barra lateral del panel admin |
| Skeleton | `skeleton.jsx` | Carga esqueleto |
| Slider | `slider.jsx` | Controles deslizantes |
| Sonner | `sonner.jsx` | Notificaciones toast |
| Switch | `switch.jsx` | Interruptores on/off |
| Table | `table.jsx` | Tablas de datos admin |
| Tabs | `tabs.jsx` | Pestañas de navegación |
| Textarea | `textarea.jsx` | Campos de texto multilínea |
| Toggle | `toggle.jsx` | Botones de alternancia |
| Toggle Group | `toggle-group.jsx` | Grupo de toggles |
| Tooltip | `tooltip.jsx` | Textos de ayuda al hover |
| **Address Autocomplete** | `address-autocomplete.jsx` | **Personalizado: Google Maps** |

---

## 🎨 Sistema de tematización

### Tokens semánticos disponibles
```jsx
// Parejas fondo / texto
bg-background    text-foreground         // Superficie base de la app
bg-card          text-card-foreground    // Tarjetas y paneles
bg-popover       text-popover-foreground // Flotantes, dropdowns
bg-primary       text-primary-foreground // Acciones principales (Forest #1E3A14)
bg-secondary     text-secondary-foreground // Acciones secundarias (Cafe #8C5E42)
bg-muted         text-muted-foreground   // Texto y superficies sutiles
bg-accent        text-accent-foreground  // Hover, focus (Verde oscuro)
bg-destructive   text-destructive-foreground // Acciones peligrosas
border-border    // Bordes estándar
border-input     // Bordes de formularios
ring-ring        // Anillos de foco
```

### Paleta personalizada del proyecto
```css
/* Uso en Tailwind — colores del proyecto */
bg-forest-600      /* #1E3A14 — Primario semántico actual */
bg-cafe-500        /* #8C5E42 — Secundario actual */
bg-accent          /* Usa el token accent del sistema */
bg-chocolate-500   /* Alias de compatibilidad para módulos legacy */

/* Ejemplo real en componente */
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  Reservar ahora
</Button>
```

### Escala de radios
```css
/* Controlado por --radius en App.css */
rounded-sm   /* calc(var(--radius) * 0.6) */
rounded-md   /* calc(var(--radius) * 0.8) */
rounded-lg   /* var(--radius)              */
rounded-xl   /* calc(var(--radius) * 1.4)  */
rounded-2xl  /* calc(var(--radius) * 1.8)  */
```

---

## 🧩 Patrones de uso — Componentes clave

### Button — Variantes disponibles
```jsx
import { Button } from "@/components/ui/button"

// Variantes
<Button variant="default">Reservar</Button>        // Fondo primario
<Button variant="secondary">Ver más</Button>       // Fondo secundario
<Button variant="outline">Cancelar</Button>        // Solo borde
<Button variant="ghost">Menú</Button>              // Sin fondo
<Button variant="destructive">Eliminar</Button>    // Rojo/peligro
<Button variant="link">Ver detalles</Button>       // Solo enlace

// Tamaños
<Button size="default" />
<Button size="sm" />
<Button size="lg" />
<Button size="icon"><IconName /></Button>

// Con icono
import { PlaneTakeoff } from "lucide-react"
<Button>
  <PlaneTakeoff className="mr-2 h-4 w-4" />
  Reservar vuelo
</Button>

// Cargando (deshabilitar al cargar)
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Procesando...
</Button>
```

### Dialog — Modales
```jsx
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Ver detalles de reserva</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Reserva #1234</DialogTitle>
      <DialogDescription>
        Detalles del viaje Santiago → Temuco
      </DialogDescription>
    </DialogHeader>
    {/* Contenido */}
    <DialogFooter>
      <Button type="submit">Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form — Con react-hook-form + zod
```jsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form, FormControl, FormDescription,
  FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Esquema de validación
const esquema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
})

function FormularioReserva() {
  const form = useForm({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: "", email: "" },
  })

  function onSubmit(valores) {
    console.log(valores)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez" {...field} />
              </FormControl>
              <FormDescription>Como aparece en tu documento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Reservar</Button>
      </form>
    </Form>
  )
}
```

### Card — Tarjeta estándar
```jsx
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle
} from "@/components/ui/card"

<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Transfer Aeropuerto ZCO</CardTitle>
    <CardDescription>Temuco → Malalcahuello</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold text-primary">$45.000 CLP</p>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Reservar ahora</Button>
  </CardFooter>
</Card>
```

### Select — Listas desplegables
```jsx
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select"

<Select onValueChange={(valor) => setDestino(valor)}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Selecciona destino" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="temuco">Temuco</SelectItem>
    <SelectItem value="malalcahuello">Malalcahuello</SelectItem>
    <SelectItem value="pucon">Pucón</SelectItem>
  </SelectContent>
</Select>
```

### Table — Tablas del panel admin
```jsx
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table"

<Table>
  <TableCaption>Lista de reservas activas</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>ID</TableHead>
      <TableHead>Pasajero</TableHead>
      <TableHead>Destino</TableHead>
      <TableHead className="text-right">Monto</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {reservas.map((r) => (
      <TableRow key={r.id}>
        <TableCell className="font-medium">#{r.id}</TableCell>
        <TableCell>{r.pasajero}</TableCell>
        <TableCell>{r.destino}</TableCell>
        <TableCell className="text-right">${r.monto}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Toast/Sonner — Notificaciones
```jsx
// En el layout raíz (ya configurado)
import { Toaster } from "@/components/ui/sonner"
<Toaster />

// Disparar desde cualquier componente
import { toast } from "sonner"

toast("Reserva creada exitosamente")
toast.success("Pago procesado correctamente")
toast.error("Error al procesar el pago")
toast.warning("Sesión próxima a expirar")
toast.info("Recuerda confirmar tu reserva")

// Con descripción
toast("Reserva #1234", {
  description: "Transfer para el 25 de diciembre a las 08:00",
})

// Con acción
toast("Reserva eliminada", {
  action: {
    label: "Deshacer",
    onClick: () => restaurarReserva(),
  },
})
```

### Skeleton — Estados de carga
```jsx
import { Skeleton } from "@/components/ui/skeleton"

// Tarjeta cargando
<div className="flex flex-col space-y-3">
  <Skeleton className="h-[125px] w-full rounded-xl" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>
```

### Badge — Etiquetas de estado
```jsx
import { Badge } from "@/components/ui/badge"

// Estados de reserva
<Badge variant="default">Confirmada</Badge>
<Badge variant="secondary">Pendiente</Badge>
<Badge variant="destructive">Cancelada</Badge>
<Badge variant="outline">Sin pagar</Badge>

// Custom con colores del proyecto
<Badge className="bg-green-100 text-green-800">Pagada</Badge>
<Badge className="bg-chocolate-100 text-chocolate-800">En curso</Badge>
```

### Sheet — Panel lateral (ideal para mobile)
```jsx
import {
  Sheet, SheetContent, SheetDescription,
  SheetHeader, SheetTitle, SheetTrigger
} from "@/components/ui/sheet"

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Filtros</Button>
  </SheetTrigger>
  <SheetContent side="right"> {/* left | right | top | bottom */}
    <SheetHeader>
      <SheetTitle>Filtrar reservas</SheetTitle>
      <SheetDescription>Ajusta los criterios de búsqueda.</SheetDescription>
    </SheetHeader>
    {/* Contenido de filtros */}
  </SheetContent>
</Sheet>
```

### Progress — Progreso por pasos
```jsx
import { Progress } from "@/components/ui/progress"

// Paso 2 de 4 = 50%
<Progress value={50} className="w-full" />

// Con estado en React
const [progreso, setProgreso] = useState(25)
<Progress value={progreso} />
```

### Tabs — Pestañas
```jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="ida" className="w-full">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="ida">Solo ida</TabsTrigger>
    <TabsTrigger value="retorno">Ida y vuelta</TabsTrigger>
  </TabsList>
  <TabsContent value="ida">
    {/* Formulario solo ida */}
  </TabsContent>
  <TabsContent value="retorno">
    {/* Formulario ida y vuelta */}
  </TabsContent>
</Tabs>
```

---

## 🔧 Utilidades esenciales

### `cn()` — Fusión de clases
```jsx
// Importar siempre desde @/lib/utils
import { cn } from "@/lib/utils"

// Uso básico: combinar clases con lógica condicional
<div className={cn(
  "base-class otra-clase",
  isActive && "clase-activa",
  variant === "primary" && "bg-primary text-primary-foreground",
  className // permitir override externo
)} />
```

### `cva()` — Variantes de componentes
```jsx
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Crear variantes de un componente personalizado
const tarjetaVariantes = cva(
  "rounded-lg border p-4 transition-colors", // clases base
  {
    variants: {
      tipo: {
        reserva: "border-chocolate-200 bg-chocolate-50",
        pago: "border-green-200 bg-green-50",
        error: "border-red-200 bg-red-50",
      },
      tamano: {
        sm: "p-2 text-sm",
        md: "p-4",
        lg: "p-6 text-lg",
      },
    },
    defaultVariants: {
      tipo: "reserva",
      tamano: "md",
    },
  }
)

function TarjetaEstado({ tipo, tamano, className, ...props }) {
  return (
    <div className={cn(tarjetaVariantes({ tipo, tamano }), className)} {...props} />
  )
}
```

---

## 🏗️ Patrones de composición avanzada

### Componente UI personalizado con shadcn
```jsx
// Extender un componente base — Botón de WhatsApp
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MessageCircle } from "lucide-react"

function BotonWhatsApp({ mensaje, className, ...props }) {
  const url = `https://wa.me/56XXXXXXXXX?text=${encodeURIComponent(mensaje)}`
  return (
    <Button
      asChild
      className={cn("bg-green-500 hover:bg-green-600 text-white", className)}
      {...props}
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="mr-2 h-4 w-4" />
        Contactar por WhatsApp
      </a>
    </Button>
  )
}
```

### Tabla con estado vacío y carga esqueleto
```jsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

function TablaReservas({ reservas, cargando }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pasajero</TableHead>
          <TableHead>Destino</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cargando ? (
          // Estado de carga
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            </TableRow>
          ))
        ) : reservas.length === 0 ? (
          // Estado vacío
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
              No hay reservas para mostrar
            </TableCell>
          </TableRow>
        ) : (
          reservas.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.pasajero}</TableCell>
              <TableCell>{r.destino}</TableCell>
              <TableCell><Badge>{r.estado}</Badge></TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
```

---

## 🚫 Anti-patrones a evitar

| ❌ Incorrecto | ✅ Correcto |
|--------------|-----------|
| `import Button from "@/components/ui/button"` | `import { Button } from "@/components/ui/button"` |
| Usar `className` en lugar de `variant` para variantes | Usar `variant="destructive"` |
| Crear componentes `.tsx` en este proyecto | Siempre `.jsx` (tsx: false en components.json) |
| Modificar archivos en `src/components/ui/` directamente para lógica de negocio | Crear componentes propios que los envuelvan |
| Usar `tailwind.config.js` para extensiones | Usar `@theme inline {}` en CSS (Tailwind v4) |
| Crear UI nueva sin consultar el registry MCP | Buscar primero en MCP y luego decidir si instalar |
| `react-toastify` para notificaciones | Usar `sonner` ya instalado |
| Radix primitivas directas sin shadcn | Usar always los componentes shadcn |

---

## 📋 Checklist al agregar un nuevo componente

- [ ] Verificar si ya está en `src/components/ui/` antes de instalarlo
- [ ] Instalar con `pnpm dlx shadcn@latest add [nombre]`
- [ ] Importar con destructuring: `import { Nombre } from "@/components/ui/nombre"`
- [ ] Usar `cn()` de `@/lib/utils` para combinar clases
- [ ] Comentar el código en español
- [ ] Verificar que funcione correctamente en móvil (>= 320px)
- [ ] No modificar el archivo de `ui/` — crear un wrapper si se necesita personalización

---

## 🔍 Componentes aún NO instalados (disponibles para agregar)

```bash
# Componentes útiles que aún no están en el proyecto
pnpm dlx shadcn@latest add  \
  input-otp \       # ya instalado
  data-table \      # tabla avanzada con filtros
  combobox \        # select con búsqueda
  multi-select \    # selección múltiple
  file-upload \     # carga de archivos
  phone-input \     # input de teléfono con bandera
  stepper \         # wizard de pasos (multi-step form)
  number-field \    # campo numérico avanzado
  timeline \        # historial de eventos
  rating \          # calificaciones con estrellas
```

---

## 📚 Referencias rápidas

| Recurso | URL |
|---------|-----|
| Documentación oficial | https://ui.shadcn.com/docs |
| Lista de componentes | https://ui.shadcn.com/docs/components |
| Tematización | https://ui.shadcn.com/docs/theming |
| CLI completo | https://ui.shadcn.com/docs/cli |
| Creador visual de temas | https://ui.shadcn.com/create |
| Registry comunitario | https://ui.shadcn.com/docs/directory |
| v0.dev (generador IA) | https://v0.dev |
