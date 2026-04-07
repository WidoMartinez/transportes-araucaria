# SKILL: Diseño Optimizado para Móvil — Transportes Araucanía

## Propósito
Guía maestra para diseñar, revisar y mejorar la interfaz visual de **Transportes Araucanía** con foco en dispositivos móviles. Cubre el sistema de diseño del proyecto, tendencias UI/UX 2025-2026 y patrones de código concretos.

---

## 🏗️ Stack tecnológico del proyecto

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 (JSX, no TSX) |
| Estilos | Tailwind CSS v4 (`@import "tailwindcss"`) |
| Componentes UI | shadcn/ui — estilo **new-york** |
| Primitivas | Radix UI |
| Animaciones | Framer Motion |
| Iconos | Lucide React |
| Bundler | Vite |
| Tipografía | Sistema por defecto de shadcn/ui |
| Alias | `@/components`, `@/lib`, `@/hooks` |

---

## 🎨 Sistema de diseño del proyecto

### Paleta principal (CSS custom properties)
```css
/* Colores primarios — Chocolate */
--color-chocolate-50:  #efebe9
--color-chocolate-100: #d7ccc8
--color-chocolate-200: #bcaaa4
--color-chocolate-300: #a1887f
--color-chocolate-400: #8d6e63
--color-chocolate-500: #795548   ← primario (light)
--color-chocolate-600: #6d4c41
--color-chocolate-700: #5d4037
--color-chocolate-800: #4e342e
--color-chocolate-900: #3e2723
--color-chocolate-950: #281916   ← fondo footer/dark

/* Variables semánticas */
--primary:   #795548              /* Chocolate 500 */
--secondary: oklch(0.45 0.12 160) /* Verde oscuro */
--accent:    oklch(0.35 0.25 140) /* Verde más oscuro */
--background: oklch(0.98 0.01 240)
```

### Dark mode
```css
--primary: #a1887f  /* Chocolate 300 — más claro para dark */
--primary-foreground: #281916
```

### Uso en Tailwind
```jsx
// Clases disponibles por paleta personalizada
className="bg-chocolate-950"   // Fondo oscuro (footer, header oscuro)
className="text-primary"       // Color principal
className="bg-primary"         // Fondo primario
className="bg-secondary"       // Verde secundario
className="bg-accent"          // Verde acento
className="border-border"      // Bordes estándar
```

---

## 📐 Sistema de breakpoints

```js
// Tailwind v4 breakpoints estándar
sm:  640px   // Móvil grande / landscape
md:  768px   // Tablet / límite mobile-desktop
lg:  1024px  // Laptop
xl:  1280px  // Desktop
2xl: 1536px  // Pantalla grande
```

```js
// Hook propio del proyecto
import { useIsMobile } from "@/hooks/use-mobile";
// → true si ancho < 768px

import { useMediaQuery } from "@/hooks/useMediaQuery";
// → uso genérico: useMediaQuery('(max-width: 767px)')
```

**Regla Mobile First**: escribir estilos base para móvil, agregar prefijos (`md:`, `lg:`) para pantallas mayores.

---

## 🧩 Componentes shadcn/ui disponibles en el proyecto

Todos estos ya están instalados y listos para usar:

| Componente | Uso típico |
|-----------|-----------|
| `Button` | Acciones principales, CTA |
| `Sheet` | Menú lateral móvil (ya usado en Header.jsx) |
| `Dialog` | Modales en desktop |
| `Drawer` | Modales tipo drawer en móvil |
| `Card` | Tarjetas de contenido |
| `Input` / `Textarea` | Formularios |
| `Select` | Selectores |
| `Popover` | Tooltips y popovers |
| `Badge` | Etiquetas de estado |
| `Skeleton` | Loading states |
| `Sonner` | Notificaciones toast |
| `Tabs` | Navegación por pestañas |
| `Carousel` | Carruseles |
| `Progress` | Barras de progreso |
| `Alert` | Mensajes de alerta |
| `Avatar` | Fotos de perfil |
| `Separator` | Divisores visuales |

**Patrón recomendado** para decisión Dialog vs Drawer:
```jsx
import { useIsMobile } from "@/hooks/use-mobile";

function MiModal({ open, onClose }) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <Drawer open={open} onOpenChange={onClose}>...</Drawer>;
  }
  return <Dialog open={open} onOpenChange={onClose}>...</Dialog>;
}
```

---

## 🗂️ Componentes críticos del proyecto

### Header.jsx
- Usa `Sheet` para menú hamburguesa en móvil
- Usa `framer-motion` para animaciones de scroll (`useScroll`, `useMotionValueEvent`)
- Logo: `src/assets/logo.png` / `src/assets/logoblanco.png`
- Tracking Google Ads integrado en clics de WhatsApp

### HeroExpress.jsx
- Layout: `flex-col` en móvil → `lg:grid lg:grid-cols-2` en desktop
- Imagen hero móvil: `h-[35vh]` con `object-cover`
- Imagen hero desktop: `h-screen sticky top-0`

### Footer.jsx
- `bg-chocolate-950 text-white`
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Iconos redes: `Facebook`, `Instagram` de Lucide

### WhatsAppButton.jsx
- Botón flotante fijo en móvil
- Debe respetar z-index y no solapar CTAs principales

---

## 📱 Reglas de diseño móvil — Checklist obligatorio

### Interacción táctil
```jsx
// ✅ Tamaño mínimo 44×44px en botones táctiles
<Button className="min-h-[44px] min-w-[44px]" />

// ✅ Separación entre elementos táctiles
<div className="space-y-3"> {/* al menos 8px entre ítems */}

// ❌ No usar solo hover — agregar focus-visible
className="hover:bg-primary focus-visible:ring-2"
```

### Tipografía responsive
```jsx
// ✅ Escala de fuente adaptativa
<h1 className="text-2xl md:text-4xl lg:text-5xl font-bold" />
<p className="text-base md:text-lg leading-relaxed" />

// ✅ Legibilidad mínima: 16px en móvil (text-base)
// ❌ Nunca usar text-xs en texto funcional en móvil
```

### Imágenes y medios
```jsx
// ✅ Siempre lazy loading
<img loading="lazy" src={...} alt={...} className="w-full h-auto" />

// ✅ object-fit para evitar distorsión
<img className="object-cover w-full h-full" />

// ✅ aspect-ratio para reservar espacio
<div className="aspect-video w-full">
  <img className="w-full h-full object-cover" />
</div>
```

### Formularios móviles
```jsx
// ✅ inputMode y autocomplete correctos
<Input type="tel"   inputMode="numeric" autoComplete="tel" />
<Input type="email" inputMode="email"   autoComplete="email" />
<Input type="text"  inputMode="text"    autoComplete="name" />

// ✅ Tamaño mínimo 44px height en inputs
<Input className="h-12" />

// ✅ Focus visible para accesibilidad
<Input className="focus-visible:ring-2 focus-visible:ring-primary" />
```

### Grid y Flexbox responsive
```jsx
// ✅ Patrón de grid adaptativo del proyecto
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" />

// ✅ Stack vertical en móvil, lado a lado en desktop
<div className="flex flex-col md:flex-row gap-4" />

// ✅ Padding/margin responsivo
<section className="px-4 py-8 md:px-8 md:py-16 lg:px-16 lg:py-24" />
```

---

## 🎬 Animaciones con Framer Motion

### Patrones del proyecto
```jsx
import { motion, AnimatePresence } from "framer-motion";

// ✅ Entrada suave (fade + slide) — patrón estándar del proyecto
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

// ✅ Lista con stagger
const container = {
  animate: { transition: { staggerChildren: 0.1 } }
};

// ✅ Hover con scale (no usar en móvil táctil, solo en desktop)
<motion.div
  className="cursor-pointer"
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.98 }}
/>

// ✅ Reducir movimiento cuando el sistema lo pide
<motion.div
  variants={fadeInUp}
  style={{ willChange: "transform, opacity" }}
/>
```

### Reglas de performance en animaciones
- Usar solo `transform` y `opacity` (evitar animar `width`, `height`, `top`, `left`)
- Agregar `will-change: transform` solo en animaciones críticas
- Usar `AnimatePresence` para animaciones de entrada/salida de componentes
- **Respetar `prefers-reduced-motion`** — Framer Motion lo hace automáticamente si se configura

---

## 🚀 Tendencias UI/UX 2025-2026 aplicables al proyecto

### 1. Glassmorphism sutil
```jsx
// Para cards sobre imágenes o fondos con color
<div className="backdrop-blur-md bg-white/80 dark:bg-black/40 border border-white/20 rounded-xl" />
```

### 2. Gradientes suaves (en tono con la paleta chocolate)
```jsx
// Gradiente del color primario al secundario
<div className="bg-gradient-to-br from-chocolate-700 to-chocolate-900" />
// Gradiente sutil en hero
<div className="bg-gradient-to-b from-transparent to-black/60" />
```

### 3. Tipografía grande y bold en hero
```jsx
<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none" />
```

### 4. Micro-interacciones con feedback táctil
```jsx
// ✅ press feedback en botones móviles
<motion.button
  whileTap={{ scale: 0.95 }}
  className="active:bg-chocolate-700 transition-colors duration-150"
/>
```

### 5. Bottom sheets en lugar de modales centrados (móvil)
```jsx
// Usar Drawer de shadcn/ui que ya está instalado
<Drawer>
  <DrawerContent className="rounded-t-2xl">
    <DrawerHandle className="mx-auto w-12 h-1.5 rounded-full bg-border mb-4" />
    {/* contenido */}
  </DrawerContent>
</Drawer>
```

### 6. Skeleton loading (UX percibida mejor)
```jsx
import { Skeleton } from "@/components/ui/skeleton";

// En vez de spinner, mostrar estructura de la UI
function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
```

### 7. Navegación con bottom bar en móvil (si aplica)
```jsx
// Para secciones con navegación frecuente, considerar barra inferior fija
<nav className="fixed bottom-0 inset-x-0 flex items-center justify-around
                bg-background/95 backdrop-blur border-t border-border
                pb-safe h-16 z-50 md:hidden">
  {/* ítems de navegación */}
</nav>
```

### 8. Safe areas para dispositivos con notch/isla dinámica
```css
/* En App.css o Tailwind */
padding-bottom: env(safe-area-inset-bottom);
padding-top: env(safe-area-inset-top);
```
```jsx
// Clases Tailwind para safe area (Tailwind iOS safe area plugin)
className="pb-safe"   // padding-bottom seguro
className="pt-safe"   // padding-top seguro
```

### 9. Contraste y legibilidad (WCAG AA mínimo)
- Texto sobre fondo chocolate: usar `text-white` o `text-chocolate-50`
- Texto sobre fondo claro: usar `text-chocolate-900` o `text-foreground`
- No usar grises claros (`text-gray-400`) sobre blancos — mínimo ratio 4.5:1
- Revisar siempre contraste en modo oscuro

### 10. Scroll suave y snap
```jsx
// Carruseles táctiles con scroll snap
<div className="flex overflow-x-auto snap-x snap-mandatory gap-4 scrollbar-hide pb-4">
  {items.map(item => (
    <div key={item.id} className="snap-start flex-shrink-0 w-[85vw] md:w-auto">
      <Card />
    </div>
  ))}
</div>
```

---

## ⚡ Performance móvil

### Métricas objetivo (Core Web Vitals)
| Métrica | Objetivo |
|---------|---------|
| LCP | < 2.5s |
| FID / INP | < 100ms |
| CLS | < 0.1 |
| Lighthouse Mobile | > 90 |
| Bundle (gzipped) | < 500KB |

### Optimizaciones críticas para el proyecto
```jsx
// ✅ Imágenes: usar loading="lazy" + dimensiones explícitas
<img loading="lazy" width={800} height={600} src={img} alt="..." />

// ✅ Code splitting (React.lazy)
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));

// ✅ Evitar renders innecesarios en listas
import { memo } from "react";
const ItemCard = memo(({ data }) => <Card>{data.nombre}</Card>);

// ✅ Animaciones solo con transform/opacity
// ❌ NO animar: width, height, top, left, margin, padding

// ✅ Imágenes hero con fetchpriority="high"
<img fetchpriority="high" src={heroImg} alt="Hero" className="object-cover" />
```

---

## 🔍 Flujo de revisión para este agente

Cuando se pida revisar o mejorar un componente para móvil, seguir este orden:

1. **Verificar breakpoints**: ¿la vista móvil (<768px) se ve correcta?
2. **Tamaños táctiles**: ¿botones/inputs tienen mínimo 44×44px?
3. **Tipografía**: ¿texto legible en móvil? (≥16px para texto funcional)
4. **Imágenes**: ¿lazy loading? ¿aspect-ratio definido?
5. **Formularios**: ¿inputMode y autoComplete correctos?
6. **Animaciones**: ¿solo transform/opacity? ¿respeta prefers-reduced-motion?
7. **Colores/contraste**: ¿cumple WCAG AA con la paleta del proyecto?
8. **Performance**: ¿hay renders innecesarios? ¿code splitting aplicado?
9. **Safe areas**: ¿el layout funciona en iPhone con notch?
10. **Tendencias**: ¿se pueden aplicar mejoras UX 2025-2026 sin over-engineering?

---

## 📁 Archivos clave del proyecto para modificar estilos

| Archivo | Qué contiene |
|---------|-------------|
| `src/App.css` | Tokens CSS del tema (colores, radios, variables) |
| `src/index.css` | Reset y estilos globales base |
| `src/components/ui/*.jsx` | Componentes shadcn/ui (modificar con precaución) |
| `src/components/Header.jsx` | Navegación + menú móvil con Sheet |
| `src/components/HeroExpress.jsx` | Componente hero principal |
| `src/components/Footer.jsx` | Pie de página |
| `vite.config.js` | Configuración del bundler |
| `components.json` | Config de shadcn/ui |

---

## 🚫 Restricciones del proyecto

- **No modificar archivos `.php`** — pertenecen a Hostinger y se suben manualmente
- Mantener **PHPMailer** para notificaciones (no afecta el frontend)
- El backend corre en **Render.com** — solo afecta peticiones API, no estilos
- **Escribir todos los comentarios en español**
- No renombrar ni eliminar archivos bajo `.github/`
