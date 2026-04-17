# SKILL: Copiar el Diseño de `ruta-araucaria` → `transportes-araucaria`

## Propósito
Guía maestra para que el agente replique el sistema de diseño del repositorio **`WidoMartinez/ruta-araucaria`** en el proyecto **`transportes-araucaria`**. Contiene los tokens exactos, patrones de layout, componentes clave y reglas de uso que deben respetarse.

---

## 🔑 Regla fundamental

El proyecto `transportes-araucaria` usa **React (JSX)**, NO TypeScript. Al copiar código del repo `ruta-araucaria` (que usa `.tsx`):
- Eliminar todas las anotaciones de tipo (`: Type`, `<Type>`, `interface`, `type`, `as Type`).
- Mantener la misma lógica y clases Tailwind sin cambios.

---

## 🎨 Sistema de Diseño — Tokens

### Paleta de colores (hardcoded en Tailwind)

| Token | Hex | Uso |
|---|---|---|
| Verde primario | `#1E3A14` | Fondo hero, sidebar admin, botones primarios |
| Verde medio | `#2D5219` | Blobs decorativos, hover secundario |
| Verde claro | `#2a5020` | Hover del botón primario |
| Verde oscuro hover | `#162E0F` | Hover del CTA principal |
| Verde fondo admin | `#162B0E` | Card de servicio grupos |
| Footer oscuro | `#111F0A` | Fondo del footer |
| Café/terracota | `#8C5E42` | Acento, logo, botón reservar, íconos |
| Café claro | `#C4895E` | Texto eyebrow, color destacado en hero |
| Café hover | `#7A5038` | Hover del botón café |
| Café más claro | `#B87D5A` | Acento cards grupos |
| Verde oliva | `#6B9E4A` | Acento cards corporativo |

### Fondos y overlays usados

```css
bg-[#1E3A14]         /* Hero, sidebar */
bg-[#111F0A]         /* Footer */
bg-[#F8F7F4]         /* Fondo sección servicios slider */
bg-white             /* Cards, formulario */
bg-gray-50           /* Fondo panel admin */
```

### Opacidades frecuentes

```
bg-[#8C5E42]/12     /* Eyebrow pill fondo */
bg-[#8C5E42]/8      /* Blob decorativo */
bg-[#2D5219]/30     /* Blob izquierdo */
border-white/8      /* Bordes sutiles sobre fondo verde */
border-white/10     /* Separadores en sidebar */
text-white/70       /* Texto secundario sobre verde */
text-white/40       /* Texto terciario / fecha sidebar */
```

---

## 🔤 Tipografía

```css
/* En index.css — importar SIEMPRE así */
@import url("https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Fraunces:opsz,ital,wght@9..144,0,400;9..144,0,500;9..144,0,700;9..144,1,400&display=swap");

@theme {
  --font-sans: "Sora", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Fraunces", ui-serif, Georgia, serif;
}
```

- **`font-sans`** (`Sora`): Todo el cuerpo de texto, UI, botones, badges, etiquetas.
- **`font-serif`** (`Fraunces`): Títulos de sección, headline del hero, números grandes de stats.

### Clases de título usadas en el repo

```jsx
/* Hero principal */
<h1 className="font-serif text-[clamp(3rem,7vw,5.5rem)] font-medium leading-[1.05] text-white">

/* Títulos de sección */
<h2 className="font-serif text-4xl font-medium text-slate-900 md:text-5xl">

/* Eyebrow (pequeño label sobre el título) */
<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8C5E42]">

/* Subtítulo descriptor */
<p className="text-sm leading-relaxed text-slate-500">
```

---

## 🧱 Layouts Principales

### Layout Hero (landing)

```jsx
/* Fondo */
<section className="relative min-h-screen overflow-hidden bg-[#1E3A14]">
  {/* Decoraciones de fondo */}
  <div className="pointer-events-none absolute inset-0 select-none">
    <div className="absolute -right-48 -top-48 h-175 w-175 rounded-full bg-[#8C5E42]/8 blur-3xl" />
    <div className="absolute -left-32 bottom-0 h-125 w-125 rounded-full bg-[#2D5219]/30 blur-3xl" />
    {/* Grid sutil */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[64px_64px]" />
    {/* Viñeta radial */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(140,94,66,0.10),transparent)]" />
  </div>

  {/* Grid: copy izquierda + formulario derecha */}
  <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-0 px-6 pt-24 pb-10 lg:grid-cols-[1fr_520px] lg:gap-12 lg:pt-0">
    {/* Columna izquierda: copy */}
    <div className="flex flex-col justify-center py-16 lg:py-0">
      {/* Eyebrow pill */}
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#8C5E42]/30 bg-[#8C5E42]/12 px-3.5 py-1.5 text-xs font-semibold text-[#C4895E]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#C4895E]" />
        Aeropuerto Araucanía · Pucón · Villarrica
      </div>
      {/* Headline */}
      <h1 className="mt-6 font-serif text-[clamp(3rem,7vw,5.5rem)] font-medium leading-[1.05] text-white">
        Traslados<br />
        <em className="not-italic text-[#C4895E]">privados</em><br />
        al sur de Chile.
      </h1>
      {/* Trust badges */}
      <div className="mt-9 flex flex-wrap gap-3">
        {['Disponible 24/7', 'Hasta 15 pasajeros'].map((badge) => (
          <span key={badge} className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70">
            {badge}
          </span>
        ))}
      </div>
    </div>

    {/* Columna derecha: formulario (card blanca) */}
    {/* ... */}
  </div>
</section>
```

---

## 🧭 Navbar Flotante

```jsx
/* Estado: scrolled cambia el fondo */
<header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
  scrolled
    ? "border-b border-white/8 bg-[#1E3A14]/95 shadow-lg shadow-black/20 backdrop-blur-md"
    : "bg-transparent"
}`}>
  <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
    {/* Logo */}
    <a href="#inicio" className="flex items-center gap-3 text-white">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8C5E42] shadow-md shadow-[#8C5E42]/30">
        <Plane className="h-4 w-4 rotate-45 text-white" />
      </span>
      <div className="leading-none">
        <p className="font-serif text-base font-medium text-white">Araucanía</p>
        <p className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-slate-400">
          Executive Transfer
        </p>
      </div>
    </a>

    {/* Desktop links */}
    <ul className="hidden items-center gap-8 md:flex">
      {links.map((link) => (
        <li key={link.href}>
          <a href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
            {link.label}
          </a>
        </li>
      ))}
    </ul>

    {/* CTAs */}
    <div className="hidden md:flex items-center gap-3">
      {/* Admin */}
      <a href="/admin" className="inline-flex h-9 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-medium text-white/70 transition-all hover:border-white/40 hover:text-white">
        <LayoutDashboard className="h-3.5 w-3.5" />Admin
      </a>
      {/* Reservar */}
      <a href="#reservas" className="inline-flex h-9 items-center rounded-full bg-[#8C5E42] px-5 text-sm font-semibold text-white shadow shadow-[#8C5E42]/30 transition-all hover:bg-[#7A5038] hover:shadow-md hover:shadow-[#8C5E42]/40 active:scale-95">
        Reservar ahora
      </a>
    </div>
  </nav>
</header>
```

---

## 📦 Componentes UI — Variantes del Repo

### Botones

```jsx
{/* Primario verde — CTA principal */}
<button className="inline-flex h-12 items-center rounded-full bg-[#1E3A14] px-8 text-sm font-semibold text-white shadow-lg shadow-[#1E3A14]/30 transition-all hover:bg-[#162E0F] hover:shadow-xl hover:shadow-[#1E3A14]/40 active:scale-95">

{/* Café — botón de reserva */}
<a className="inline-flex h-9 items-center rounded-full bg-[#8C5E42] px-5 text-sm font-semibold text-white shadow shadow-[#8C5E42]/30 transition-all hover:bg-[#7A5038] active:scale-95">

{/* Outline sutil sobre fondo oscuro */}
<a className="inline-flex h-9 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-medium text-white/70 hover:border-white/40 hover:text-white">
```

### Badge del Hero (trust badges)

```jsx
<span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70">
  Disponible 24/7
</span>
```

### Card de servicio (slider)

```jsx
{/* Fondo dinámico por servicio */}
<div style={{ backgroundColor: service.bg }}>
  <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: accent + '18' }}>
    <Icon className="h-7 w-7" style={{ color: accent }} />
  </div>
  <h3 className="mt-4 font-serif text-3xl font-medium text-white">Título</h3>
  <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-400">Descripción.</p>
  {/* Highlight pills */}
  {highlights.map((h) => (
    <span key={h} className="rounded-full px-3.5 py-1.5 text-xs font-medium text-white/80" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
      {h}
    </span>
  ))}
</div>
```

### Stats en sección de servicios

```jsx
<div className="flex flex-col items-center justify-center gap-2 px-8 py-12">
  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D5219]/12">
    <Icon className="h-5 w-5 text-[#8C5E42]" />
  </span>
  <p className="font-serif text-4xl font-medium text-slate-900">{value}</p>
  <p className="text-sm text-slate-500">{label}</p>
</div>
```

### Pasos "Cómo funciona"

```jsx
{/* Fondo verde oscuro, número grande con baja opacidad */}
<div className="bg-[#1E3A14] px-10 py-12">
  <p className="font-serif text-6xl font-medium text-white/10">{step}</p>
  <div className="mt-4 h-0.5 w-10 bg-[#8C5E42]" />
  <h3 className="mt-4 font-serif text-xl font-medium text-white">{title}</h3>
  <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
</div>
```

---

## 🏛️ Panel Admin — Patrones

### Sidebar

```jsx
<aside className={cn(
  "flex flex-col bg-[#1E3A14] text-white transition-all duration-300 min-h-screen sticky top-0",
  isCollapsed ? "w-16" : "w-60"
)}>
  {/* Header del sidebar */}
  <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
    {!isCollapsed && (
      <div>
        <p className="font-bold text-sm text-[#C4895E] leading-tight">Transportes</p>
        <p className="font-black text-lg text-white leading-tight">Araucaria</p>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Admin</p>
      </div>
    )}
  </div>

  {/* Items de navegación */}
  {/* Item activo: bg-white/15 text-white | Inactivo: text-white/70 hover:bg-white/10 */}
</aside>
```

### StatCard del Dashboard

```jsx
{/* Card con border-left de color */}
<Card className={`border-l-4 ${color} hover:shadow-md transition-shadow cursor-pointer`} onClick={onClick}>
  <CardContent className="p-5">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="rounded-full p-2.5 bg-gray-50">{icon}</div>
    </div>
  </CardContent>
</Card>

{/* Colores de borde usados */}
border-blue-400   /* Total reservas */
border-green-400  /* Vehículos */
border-purple-400 /* Conductores */
border-amber-400  /* Ingresos */
```

### Estado cards (Pendiente/Confirmada/Cancelada)

```jsx
{/* Pendiente */}
<Card className="border-0 shadow-sm bg-yellow-50">
  <CardContent className="p-4 flex items-center gap-4">
    <div className="rounded-full p-2 bg-yellow-100">
      <Clock className="h-5 w-5 text-yellow-600" />
    </div>
    <div>
      <p className="text-xs text-yellow-700 font-medium">Pendientes</p>
      <p className="text-2xl font-bold text-yellow-800">{count}</p>
    </div>
  </CardContent>
</Card>
```

### Encabezado de módulos admin

```jsx
<div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
  <div className="flex items-center gap-2">
    <Icon className="h-5 w-5 text-[#1E3A14]" />
    <div>
      <p className="font-semibold text-gray-800">Nombre del módulo</p>
      <p className="text-xs text-gray-500">Descripción breve</p>
    </div>
  </div>
  <div className="flex gap-2">
    <Button variant="outline" size="sm" onClick={refresh}>
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
    </Button>
    <Button size="sm" className="gap-2 bg-[#1E3A14] hover:bg-[#2a5020]">
      <Plus className="h-4 w-4" /> Añadir
    </Button>
  </div>
</div>
```

---

## 🦶 Footer

```jsx
<footer id="contacto" className="bg-[#111F0A] text-slate-400">
  <div className="mx-auto max-w-7xl px-6 py-20">
    {/* Grid: brand + 3 columnas de links */}
    <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
      {/* Brand column */}
      <div>
        {/* Logo igual que navbar */}
        <p className="mt-5 max-w-xs text-sm leading-relaxed">Descripción del servicio.</p>
        {/* Lista de contacto con ícono en box */}
        <ul className="mt-7 space-y-3 text-sm">
          <li className="flex items-center gap-2.5 transition-colors hover:text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
              <Phone className="h-3.5 w-3.5 text-[#8C5E42]" />
            </span>
            +56 9 XXXX XXXX
          </li>
        </ul>
      </div>

      {/* Link columns */}
      {Object.entries(footerLinks).map(([title, links]) => (
        <div key={title}>
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">{title}</p>
          <ul className="space-y-3 text-sm">
            {links.map((link) => (
              <li key={link}><a href="#" className="transition-colors hover:text-white">{link}</a></li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    {/* Divider */}
    <div className="my-12 h-px bg-white/6" />

    {/* Bottom bar */}
    <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
      <p>© 2026 Araucanía Executive Transfer SpA</p>
    </div>
  </div>
</footer>
```

---

## 📋 Reglas de aplicación al proyecto actual

### ✅ Qué aplicar directamente
1. Importar tipografías `Sora` + `Fraunces` en `index.css`
2. Reemplazar la navbar por el patrón con blur/scroll
3. Aplicar el layout del hero (fondo verde + grid 2 columnas + blobs)
4. Usar el sidebar admin con fondo `#1E3A14` colapsable
5. Aplicar StatCards con border-left de color en el dashboard
6. Usar el footer oscuro `#111F0A`

### ⚠️ Qué NO hacer
- No borrar lógica de negocio existente (pagos, evaluaciones, promotions, códigos)
- No cambiar el sistema de autenticación (`AuthContext`)
- No modificar archivos `.php`
- No cambiar las URLs del backend
- Nunca eliminar archivos bajo `.github/`

### 🔄 Proceso de migración de un componente
1. Identificar el componente a modernizar
2. Leer el componente original para entender su lógica/props
3. Aplicar solo las clases de diseño del repo `ruta-araucaria`
4. Mantener toda la lógica de estado y efectos sin cambios
5. Verificar que no haya errores con `get_errors`

---

## 🆚 Equivalencias de clases más usadas

| Estilo actual (chocolate/dark) | Equivalente en ruta-araucaria |
|---|---|
| `bg-primary` | `bg-[#1E3A14]` |
| `text-primary` | `text-[#1E3A14]` |
| `bg-chocolate-950` | `bg-[#111F0A]` |
| `text-chocolate-400` | `text-[#8C5E42]` |
| Navbar sin blur | `backdrop-blur-md bg-[#1E3A14]/95` |
| Botón primario redondeado | `rounded-full bg-[#1E3A14] ... active:scale-95` |
| Título serif grande | `font-serif text-[clamp(3rem,7vw,5.5rem)] font-medium` |
