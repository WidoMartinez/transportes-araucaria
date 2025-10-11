# 📋 Tareas de Implementación - Mejoras Formulario Reservas

Este documento detalla las tareas específicas para implementar las mejoras identificadas en el análisis del formulario de reservas.

---

## 🚀 FASE 1: FUNDAMENTOS (Sprint 1 - 2 semanas)

### ✅ TAREA-001: Agregar Indicadores de Campo Obligatorio
**Prioridad**: 🔴 CRÍTICA  
**Estimación**: 1 hora  
**Asignado a**: Por asignar

#### Descripción
Agregar asterisco (*) rojo en todos los labels de campos requeridos para que los usuarios identifiquen inmediatamente qué información es obligatoria.

#### Archivos a Modificar
- `src/components/Hero.jsx`

#### Cambios Específicos
```jsx
// Antes
<Label htmlFor="nombre-hero">Nombre completo</Label>

// Después
<Label htmlFor="nombre-hero">
  Nombre completo <span className="text-red-500">*</span>
</Label>
```

#### Campos Afectados (Step 1)
- Origen (*)
- Destino (*)
- Fecha (*)
- Hora (*)
- Pasajeros (*)

#### Campos Afectados (Step 2)
- Nombre completo (*)
- Email (*)
- Teléfono móvil (*)

#### Criterios de Aceptación
- [ ] Todos los campos obligatorios tienen asterisco rojo
- [ ] El asterisco es visible en todos los tamaños de pantalla
- [ ] El color del asterisco cumple contraste WCAG 2.1 AA
- [ ] Sin errores de ESLint
- [ ] Probado en Chrome, Firefox, Safari

#### Notas Técnicas
- Usar `text-red-500` de Tailwind para consistencia
- No modificar lógica de validación, solo visual
- Documentar patrón en guía de estilos

---

### ✅ TAREA-002: Validación Visual de Email en Tiempo Real
**Prioridad**: 🔴 CRÍTICA  
**Estimación**: 2 horas  
**Asignado a**: Por asignar

#### Descripción
Implementar validación visual en tiempo real del campo email con iconos y colores que indiquen si el formato es correcto.

#### Archivos a Modificar
- `src/components/Hero.jsx`

#### Componentes Necesarios
```jsx
import { CheckCircle2, AlertCircle } from "lucide-react";
```

#### Implementación
```jsx
// Estado para validación de email
const [emailValidation, setEmailValidation] = useState({
  isValid: null,
  message: ""
});

// Función de validación
const validateEmail = (email) => {
  if (!email) return { isValid: null, message: "" };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  return {
    isValid,
    message: isValid 
      ? "Email válido" 
      : "Ingresa un email válido (ej: tu@email.cl)"
  };
};

// En onChange del input
const handleEmailChange = (e) => {
  const email = e.target.value;
  handleInputChange(e);
  setEmailValidation(validateEmail(email));
};

// Renderizado del campo
<div className="space-y-2 relative">
  <Label htmlFor="email-hero">
    Email <span className="text-red-500">*</span>
  </Label>
  <div className="relative">
    <Input
      id="email-hero"
      type="email"
      name="email"
      value={formData.email}
      onChange={handleEmailChange}
      placeholder="tu@email.cl"
      className={cn(
        emailValidation.isValid === true && "border-green-500 focus:ring-green-500",
        emailValidation.isValid === false && "border-red-500 focus:ring-red-500"
      )}
    />
    {emailValidation.isValid !== null && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {emailValidation.isValid ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
    )}
  </div>
  {emailValidation.message && (
    <p className={cn(
      "text-xs",
      emailValidation.isValid ? "text-green-600" : "text-red-600"
    )}>
      {emailValidation.message}
    </p>
  )}
</div>
```

#### Criterios de Aceptación
- [ ] Validación ocurre en tiempo real (onChange)
- [ ] Icono verde para email válido
- [ ] Icono rojo para email inválido
- [ ] Mensaje descriptivo debajo del campo
- [ ] Border del input cambia según validación
- [ ] No interfiere con validación existente
- [ ] Responsive en móvil
- [ ] Sin errores de ESLint

#### Casos de Prueba
1. Email válido: `usuario@example.com` → ✅ Verde
2. Email sin @: `usuario.com` → ❌ Rojo
3. Email sin dominio: `usuario@` → ❌ Rojo
4. Email vacío: `` → Sin indicador
5. Email con espacios: `usuario @example.com` → ❌ Rojo

---

### ✅ TAREA-003: Validación Visual de Teléfono en Tiempo Real
**Prioridad**: 🔴 CRÍTICA  
**Estimación**: 2 horas  
**Asignado a**: Por asignar

#### Descripción
Implementar validación visual en tiempo real del campo teléfono con formato chileno (+56 9 XXXX XXXX).

#### Archivos a Modificar
- `src/components/Hero.jsx`

#### Implementación
```jsx
// Estado para validación de teléfono
const [phoneValidation, setPhoneValidation] = useState({
  isValid: null,
  message: ""
});

// Función de validación (usar la existente validarTelefono si está disponible)
const validatePhone = (phone) => {
  if (!phone) return { isValid: null, message: "" };
  
  // Formato chileno: +56 9 XXXX XXXX o 9 XXXX XXXX o +569XXXXXXXX
  const phoneRegex = /^(\+?56)?(\s)?9\s?\d{4}\s?\d{4}$/;
  const isValid = phoneRegex.test(phone);
  
  return {
    isValid,
    message: isValid 
      ? "Teléfono válido" 
      : "Formato: +56 9 1234 5678 o 9 1234 5678"
  };
};

// En onChange del input
const handlePhoneChange = (e) => {
  const phone = e.target.value;
  handleInputChange(e);
  setPhoneValidation(validatePhone(phone));
};

// Renderizado similar a TAREA-002 pero para teléfono
```

#### Criterios de Aceptación
- [ ] Validación ocurre en tiempo real
- [ ] Acepta formatos: `+56 9 1234 5678`, `9 1234 5678`, `+569 12345678`
- [ ] Icono verde/rojo según validación
- [ ] Mensaje descriptivo con ejemplo
- [ ] Border del input cambia según validación
- [ ] Integrado con validación existente (validarTelefono)
- [ ] Responsive en móvil
- [ ] Sin errores de ESLint

#### Casos de Prueba
1. `+56 9 1234 5678` → ✅ Válido
2. `9 1234 5678` → ✅ Válido
3. `+569 12345678` → ✅ Válido
4. `8 1234 5678` → ❌ Inválido (no empieza con 9)
5. `9 123 456` → ❌ Inválido (muy corto)

---

### ✅ TAREA-004: Indicador de Progreso Numérico
**Prioridad**: 🟡 MEDIA  
**Estimación**: 30 minutos  
**Asignado a**: Por asignar

#### Descripción
Agregar texto "Paso X de 3" encima o al lado de la barra de progreso para mayor claridad.

#### Archivos a Modificar
- `src/components/Hero.jsx` (líneas 600-646)

#### Implementación
```jsx
// Antes de la barra de progreso
<div className="space-y-4">
  <div className="text-center">
    <span className="text-sm font-medium text-muted-foreground">
      Paso {currentStep + 1} de {steps.length}
    </span>
  </div>
  <div className="grid gap-4 md:grid-cols-3">
    {/* Cards de pasos existentes */}
  </div>
  <Progress value={progressValue} className="h-2" />
</div>
```

#### Criterios de Aceptación
- [ ] Texto visible en todos los pasos (0-2)
- [ ] Actualiza correctamente al cambiar de paso
- [ ] Centrado y legible
- [ ] No rompe diseño existente
- [ ] Responsive en móvil

---

## 🎨 FASE 2: MEJORAS UX (Sprint 2 - 2 semanas)

### ✅ TAREA-005: Migrar Select Origen a Radix UI
**Prioridad**: 🟡 ALTA  
**Estimación**: 1.5 horas  
**Asignado a**: Por asignar

#### Descripción
Reemplazar el `<select>` HTML nativo del campo Origen por el componente `<Select>` de Radix UI.

#### Archivos a Modificar
- `src/components/Hero.jsx` (líneas 652-668)

#### Implementación
```jsx
// Antes (líneas 654-667)
<select
  id="origen-hero"
  name="origen"
  value={formData.origen}
  onChange={handleInputChange}
  className="..."
>
  {origenes.map((origen) => (
    <option key={origen} value={origen}>
      {origen}
    </option>
  ))}
</select>

// Después
<Select
  value={formData.origen}
  onValueChange={(value) => {
    handleInputChange({ target: { name: 'origen', value } });
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona tu origen" />
  </SelectTrigger>
  <SelectContent>
    {origenes.map((origen) => (
      <SelectItem key={origen} value={origen}>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {origen}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Criterios de Aceptación
- [ ] Funcionalidad idéntica al select nativo
- [ ] Estilos consistentes con Select de hora
- [ ] Icono de ubicación (MapPin) en cada opción
- [ ] Placeholder visible
- [ ] Accesible por teclado
- [ ] Valor por defecto funciona correctamente
- [ ] Sin errores de ESLint

---

### ✅ TAREA-006: Migrar Select Destino a Radix UI
**Prioridad**: 🟡 ALTA  
**Estimación**: 1.5 horas  
**Asignado a**: Por asignar

#### Descripción
Reemplazar el `<select>` HTML nativo del campo Destino por el componente `<Select>` de Radix UI.

#### Archivos a Modificar
- `src/components/Hero.jsx` (líneas 669-686)

#### Implementación
Similar a TAREA-005 pero para destinos.

```jsx
<Select
  value={formData.destino}
  onValueChange={(value) => {
    handleInputChange({ target: { name: 'destino', value } });
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona tu destino" />
  </SelectTrigger>
  <SelectContent>
    {destinos.map((destino) => (
      <SelectItem key={destino} value={destino}>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {destino}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Criterios de Aceptación
- [ ] Funcionalidad idéntica al select nativo
- [ ] Estilos consistentes con otros Selects
- [ ] Placeholder "Selecciona tu destino" visible
- [ ] Icono de ubicación en cada opción
- [ ] No tiene valor por defecto (debe seleccionar)
- [ ] Accesible por teclado
- [ ] Sin errores de ESLint

---

### ✅ TAREA-007: Migrar Select Pasajeros a Radix UI
**Prioridad**: 🟡 ALTA  
**Estimación**: 1 hora  
**Asignado a**: Por asignar

#### Descripción
Reemplazar el `<select>` HTML nativo del campo Pasajeros por el componente `<Select>` de Radix UI.

#### Archivos a Modificar
- `src/components/Hero.jsx` (líneas 725-741)

#### Implementación
```jsx
<Select
  value={formData.pasajeros.toString()}
  onValueChange={(value) => {
    handleInputChange({ target: { name: 'pasajeros', value } });
  }}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {[...Array(maxPasajeros)].map((_, i) => (
      <SelectItem key={i + 1} value={(i + 1).toString()}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          {i + 1} pasajero{i > 0 ? 's' : ''}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Criterios de Aceptación
- [ ] Funcionalidad idéntica al select nativo
- [ ] Valor por defecto es 1
- [ ] Icono de Users en cada opción
- [ ] Plural correcto (1 pasajero, 2+ pasajeros)
- [ ] Respeta maxPasajeros
- [ ] Accesible por teclado
- [ ] Sin errores de ESLint

---

### ✅ TAREA-008: Crear Componente StickyPriceSummary
**Prioridad**: 🟡 ALTA  
**Estimación**: 4 horas  
**Asignado a**: Por asignar

#### Descripción
Crear un nuevo componente que muestre un resumen persistente del precio visible en todos los pasos del wizard.

#### Archivos a Crear
- `src/components/StickyPriceSummary.jsx`

#### Estructura del Componente
```jsx
import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowRight, Tag } from "lucide-react";

function StickyPriceSummary({
  origen,
  destino,
  fecha,
  pasajeros,
  pricing,
  descuentoRate,
  visible = true,
  onToggle,
}) {
  if (!visible && window.innerWidth < 768) return null;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(value || 0);

  return (
    <div className="fixed bottom-4 right-4 z-50 md:sticky md:top-24 md:h-fit">
      <Card className="shadow-lg border-2 w-80 max-w-full">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Resumen de tu viaje</h3>
            <button
              onClick={onToggle}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* Ruta */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium truncate">{origen}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{destino}</span>
          </div>

          {/* Detalles */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>📅 {fecha || "Fecha por seleccionar"}</p>
            <p>👥 {pasajeros || 1} pasajero(s)</p>
          </div>

          {/* Precio */}
          {pricing && (
            <>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio base</span>
                  <span className="line-through">
                    {formatCurrency(pricing.precioBase)}
                  </span>
                </div>

                {descuentoRate > 0 && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-green-600 flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Descuento
                    </span>
                    <span className="text-green-600 font-medium">
                      -{formatCurrency(pricing.descuentoOnline)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(pricing.totalConDescuento)}
                  </span>
                </div>
              </div>

              <Badge className="w-full justify-center" variant="secondary">
                Ahorras {descuentoRate}%
              </Badge>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StickyPriceSummary;
```

#### Criterios de Aceptación
- [ ] Muestra origen → destino
- [ ] Muestra fecha y pasajeros
- [ ] Muestra desglose de precios si está disponible
- [ ] Fixed bottom-right en móvil
- [ ] Sticky top en desktop
- [ ] Botón para colapsar en móvil
- [ ] Animación suave al mostrar/ocultar
- [ ] No interfiere con scroll
- [ ] Sin errores de ESLint

---

### ✅ TAREA-009: Integrar StickyPriceSummary en Hero
**Prioridad**: 🟡 ALTA  
**Estimación**: 2 horas  
**Asignado a**: Por asignar

#### Descripción
Integrar el componente StickyPriceSummary en el Hero para que se muestre en todos los pasos del wizard.

#### Archivos a Modificar
- `src/components/Hero.jsx`

#### Implementación
```jsx
import StickyPriceSummary from "./StickyPriceSummary";

// En el componente Hero, agregar estado
const [showSummary, setShowSummary] = useState(true);

// En el JSX, después del Card principal
{showBookingModule && currentStep > 0 && (
  <StickyPriceSummary
    origen={origenFinal}
    destino={destinoFinal}
    fecha={fechaLegible}
    pasajeros={formData.pasajeros}
    pricing={pricing}
    descuentoRate={descuentoRate}
    visible={showSummary}
    onToggle={() => setShowSummary(!showSummary)}
  />
)}
```

#### Criterios de Aceptación
- [ ] Se muestra desde Step 1 en adelante
- [ ] Datos se actualizan en tiempo real
- [ ] No se muestra cuando el módulo está cerrado
- [ ] Funciona toggle en móvil
- [ ] No interfiere con el flujo del wizard
- [ ] Sin errores de ESLint

---

## 💰 FASE 3: OPTIMIZACIÓN DE CONVERSIÓN (Sprint 3 - 1 semana)

### ✅ TAREA-010: Mejorar Visibilidad Código de Descuento
**Prioridad**: 🟡 ALTA  
**Estimación**: 3 horas  
**Asignado a**: Por asignar

#### Descripción
Hacer el componente de código de descuento más visible y atractivo con badge animado y mejor UX.

#### Archivos a Modificar
- `src/components/CodigoDescuento.jsx`
- `src/components/Hero.jsx`

#### Implementación en Hero.jsx (Step 2)
```jsx
{/* Después del campo de mensaje/notas */}
<div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Tag className="h-5 w-5 text-primary" />
      <h4 className="font-semibold text-primary">¿Tienes un código de descuento?</h4>
    </div>
    <Badge className="animate-pulse bg-green-500">
      ¡Ahorra más!
    </Badge>
  </div>
  
  <CodigoDescuento
    codigoAplicado={codigoAplicado}
    codigoError={codigoError}
    validandoCodigo={validandoCodigo}
    onAplicarCodigo={onAplicarCodigo}
    onRemoverCodigo={onRemoverCodigo}
  />
  
  {codigoAplicado && (
    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800">
            ¡Código aplicado!
          </p>
          <p className="text-xs text-green-600">
            Ahorro adicional del {codigoAplicado.descuentoPorcentaje}%
          </p>
        </div>
      </div>
    </div>
  )}
</div>
```

#### Criterios de Aceptación
- [ ] Badge "¡Ahorra más!" con animación pulse
- [ ] Borde punteado llamativo
- [ ] Fondo sutilmente coloreado
- [ ] Icono de Tag visible
- [ ] Confirmación visual al aplicar código
- [ ] Mensaje de error claro si falla
- [ ] Animación al aplicar con éxito
- [ ] Sin errores de ESLint

---

### ✅ TAREA-011: Agregar Tooltips Informativos
**Prioridad**: 🟢 MEDIA  
**Estimación**: 2 horas  
**Asignado a**: Por asignar

#### Descripción
Agregar tooltips usando `@radix-ui/react-tooltip` en términos que puedan generar dudas.

#### Archivos a Modificar
- `src/components/Hero.jsx`

#### Instalación
```bash
npm install @radix-ui/react-tooltip
```

#### Crear Componente Tooltip Wrapper
```jsx
// src/components/ui/tooltip-wrapper.jsx
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

function InfoTooltip({ content, children, side = "top" }) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center ml-1"
          >
            {children || <HelpCircle className="h-4 w-4 text-muted-foreground" />}
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side={side}
          className={cn(
            "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
            "animate-in fade-in-0 zoom-in-95",
            "max-w-xs"
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-border" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
}

export { InfoTooltip };
```

#### Uso en Hero.jsx
```jsx
import { InfoTooltip } from "./ui/tooltip-wrapper";

// Ejemplo en el resumen de precio
<p className="text-sm uppercase tracking-wide text-muted-foreground flex items-center">
  Vehículo sugerido
  <InfoTooltip content="Basado en la cantidad de pasajeros y distancia del viaje" />
</p>

<p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center">
  Descuento base
  <InfoTooltip content="Descuento exclusivo por reservar online" />
</p>
```

#### Tooltips a Agregar
1. "Vehículo sugerido" → "Seleccionado automáticamente según pasajeros y distancia"
2. "Descuento base" → "Descuento exclusivo del 5% por reservar online"
3. "Descuento online" → "Ahorro total aplicado a tu reserva"
4. "Horario de anticipación" → "Tiempo mínimo requerido entre reserva y viaje"
5. "Ida y vuelta" → "Reserva ambos trayectos y obtén 10% adicional"

#### Criterios de Aceptación
- [ ] Tooltips se muestran al hover
- [ ] Tooltips accesibles por teclado (focus)
- [ ] Contenido claro y conciso
- [ ] Posicionamiento correcto (no se sale de pantalla)
- [ ] Animación suave de entrada
- [ ] No interfiere con interacción de otros elementos
- [ ] Responsive en móvil (touch para mostrar)
- [ ] Sin errores de ESLint

---

### ✅ TAREA-012: Mejorar Mensajes de Error con Iconos
**Prioridad**: 🟢 MEDIA  
**Estimación**: 2 horas  
**Asignado a**: Por asignar

#### Descripción
Mejorar la visualización de mensajes de error agregando iconos y componente Alert de shadcn/ui.

#### Archivos a Modificar
- `src/components/Hero.jsx`

#### Implementación
```jsx
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";

// Reemplazar renderizado de stepError
{stepError && (
  <Alert variant="destructive" className="animate-shake">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{stepError}</AlertDescription>
  </Alert>
)}

// Agregar animación shake en index.css o App.css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
```

#### Criterios de Aceptación
- [ ] Todos los stepError usan el nuevo formato
- [ ] Icono de alerta visible
- [ ] Animación shake al aparecer
- [ ] Color rojo/destructive aplicado
- [ ] Mensaje claro y legible
- [ ] No se solapa con otros elementos
- [ ] Responsive en móvil
- [ ] Sin errores de ESLint

---

## ✨ FASE 4: POLISH (Sprint 4 - 1 semana)

### ✅ TAREA-013: Implementar Animaciones Micro-interacciones
**Prioridad**: 🔵 BAJA  
**Estimación**: 4 horas  
**Asignado a**: Por asignar

#### Descripción
Agregar animaciones sutiles en transiciones de pasos y hover de botones.

#### Archivos a Modificar
- `src/components/Hero.jsx`
- `src/index.css` o `src/App.css`

#### Animaciones a Agregar

##### 1. Slide entre pasos
```jsx
// En CardContent
<CardContent className="space-y-8">
  {currentStep === 0 && (
    <div className="animate-slideIn">
      {/* Contenido Step 1 */}
    </div>
  )}
  {currentStep === 1 && (
    <div className="animate-slideIn">
      {/* Contenido Step 2 */}
    </div>
  )}
  {currentStep === 2 && (
    <div className="animate-slideIn">
      {/* Contenido Step 3 */}
    </div>
  )}
</CardContent>
```

```css
/* En CSS */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}
```

##### 2. Bounce en botones principales
```jsx
<Button
  className="... hover:animate-bounce-subtle"
  onClick={handleStepOneNext}
>
  Continuar con mis datos
</Button>
```

```css
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.hover\:animate-bounce-subtle:hover {
  animation: bounce-subtle 0.5s ease-in-out;
}
```

##### 3. Shimmer en loading
```jsx
{isSubmitting && (
  <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
    <div className="animate-shimmer">
      <LoaderCircle className="h-8 w-8 animate-spin" />
    </div>
  </div>
)}
```

```css
@keyframes shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
```

#### Criterios de Aceptación
- [ ] Animaciones suaves (60fps)
- [ ] No interfieren con funcionalidad
- [ ] Pueden deshabilitarse con `prefers-reduced-motion`
- [ ] Consistentes en todos los navegadores
- [ ] Sin errores de ESLint

---

### ✅ TAREA-014: Mejorar Checkbox Ida y Vuelta
**Prioridad**: 🔵 BAJA  
**Estimación**: 2 horas  
**Asignado a**: Por asignar

#### Descripción
Hacer más visible el checkbox de ida y vuelta enfatizando el beneficio del 10% de descuento.

#### Archivos a Modificar
- `src/components/Hero.jsx` (líneas 744-821)

#### Implementación
```jsx
<div className="rounded-lg border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5 p-4 space-y-4">
  <div className="flex items-start gap-3">
    <Checkbox
      id="ida-vuelta"
      checked={formData.idaVuelta}
      onCheckedChange={(value) => {
        // ... lógica existente
      }}
      className="mt-1"
    />
    <div className="flex-1">
      <label
        htmlFor="ida-vuelta"
        className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2"
      >
        ¿Deseas reservar también el regreso?
        <Badge className="bg-green-500 text-white animate-pulse">
          ¡10% EXTRA!
        </Badge>
      </label>
      <p className="text-xs text-muted-foreground mt-1">
        Coordina ida y vuelta en una sola solicitud y obtén descuento adicional
      </p>
    </div>
  </div>

  {formData.idaVuelta && (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-slideDown">
      {/* Campos de regreso existentes */}
    </div>
  )}

  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Info className="h-4 w-4" />
    <span>
      Validaremos disponibilidad del retorno junto con tu reserva inicial
    </span>
  </div>
</div>
```

```css
/* Animación de expansión */
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.animate-slideDown {
  animation: slideDown 0.3s ease-out;
}
```

#### Criterios de Aceptación
- [ ] Badge "¡10% EXTRA!" visible y animado
- [ ] Borde más destacado
- [ ] Gradiente sutil en fondo
- [ ] Expansión animada al activar
- [ ] Label como cursor pointer
- [ ] Icono de info al final
- [ ] Sin errores de ESLint

---

### ✅ TAREA-015: Testing Cross-Browser y Responsive
**Prioridad**: 🟡 ALTA  
**Estimación**: 4 horas  
**Asignado a**: QA Team / Por asignar

#### Descripción
Realizar pruebas exhaustivas de todas las mejoras en diferentes navegadores y dispositivos.

#### Checklist de Pruebas

##### Navegadores Desktop
- [ ] Chrome (última versión)
- [ ] Firefox (última versión)
- [ ] Safari (última versión)
- [ ] Edge (última versión)

##### Dispositivos Móviles
- [ ] iPhone (Safari iOS)
- [ ] Android (Chrome móvil)
- [ ] iPad (Safari)

##### Breakpoints
- [ ] 375px (móvil pequeño)
- [ ] 768px (tablet)
- [ ] 1024px (laptop)
- [ ] 1920px (desktop grande)

##### Funcionalidades a Probar
1. **Validación en tiempo real**
   - [ ] Email válido/inválido
   - [ ] Teléfono válido/inválido
   - [ ] Iconos se muestran correctamente

2. **Selects Radix UI**
   - [ ] Origen seleccionable
   - [ ] Destino seleccionable
   - [ ] Pasajeros seleccionable
   - [ ] Hora seleccionable
   - [ ] Funcionan en móvil

3. **StickyPriceSummary**
   - [ ] Visible en desktop (sticky)
   - [ ] Visible en móvil (fixed bottom)
   - [ ] Toggle funciona en móvil
   - [ ] Precios se actualizan en tiempo real

4. **Tooltips**
   - [ ] Se muestran al hover (desktop)
   - [ ] Se muestran al tap (móvil)
   - [ ] No se salen de la pantalla
   - [ ] Legibles en todos los tamaños

5. **Animaciones**
   - [ ] Slide entre pasos funciona
   - [ ] Shake en errores funciona
   - [ ] Pulse en badges funciona
   - [ ] Performance aceptable (60fps)

6. **Accesibilidad**
   - [ ] Navegación por teclado funciona
   - [ ] Labels asociados correctamente
   - [ ] Contraste de colores adecuado
   - [ ] Screen readers compatibles

#### Reporte de Bugs
Documentar cualquier problema encontrado en formato:
```
BUG-XXX: [Título descriptivo]
Navegador: [Chrome/Firefox/Safari/Edge]
Dispositivo: [Desktop/Mobile/Tablet]
Pasos para reproducir:
1. ...
2. ...
Comportamiento esperado: ...
Comportamiento actual: ...
Screenshot: [adjuntar si aplica]
Prioridad: [Crítica/Alta/Media/Baja]
```

---

### ✅ TAREA-016: Documentar Cambios y Patrones UI
**Prioridad**: 🟢 MEDIA  
**Estimación**: 2 horas  
**Asignado a**: Por asignar

#### Descripción
Crear documentación de los nuevos patrones UI implementados para mantener consistencia en futuros desarrollos.

#### Archivos a Crear
- `DOCUMENTACION_UI_PATTERNS.md`

#### Contenido del Documento
```markdown
# Patrones UI - Formulario de Reservas

## Validación de Campos

### Email
- Icono: CheckCircle2 (verde) / AlertCircle (rojo)
- Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- Mensaje éxito: "Email válido"
- Mensaje error: "Ingresa un email válido (ej: tu@email.cl)"

### Teléfono
- Formato: +56 9 XXXX XXXX
- Regex: /^(\+?56)?(\s)?9\s?\d{4}\s?\d{4}$/
- Icono: CheckCircle2 (verde) / AlertCircle (rojo)
- Mensaje éxito: "Teléfono válido"
- Mensaje error: "Formato: +56 9 1234 5678"

## Componentes Radix UI

### Select
Usar componente Radix en lugar de <select> nativo para:
- Mejor experiencia móvil
- Capacidad de agregar iconos
- Estilos consistentes

Ejemplo:
[código aquí]

## Tooltips

Usar InfoTooltip para términos técnicos.
Mantener textos breves (max 100 caracteres).

## Mensajes de Error

Usar componente Alert con:
- Icono AlertCircle
- Variante "destructive"
- Animación shake

## Animaciones

- Transiciones: 0.3s ease-out
- Slides: translateX(20px) → 0
- Bounce: translateY(-5px)
- Todos respetan prefers-reduced-motion

## Colores de Estado

- Success: green-500 (#10b981)
- Error: red-500 (#ef4444)
- Warning: amber-500 (#f59e0b)
- Info: blue-500 (#3b82f6)
```

#### Criterios de Aceptación
- [ ] Documento completo y claro
- [ ] Ejemplos de código incluidos
- [ ] Screenshots de referencia
- [ ] Enlazado desde README principal
- [ ] Revisado por el equipo

---

## 📊 Resumen de Esfuerzo

### Por Fase
- **Fase 1 (Fundamentos)**: 5.5 horas
- **Fase 2 (Mejoras UX)**: 12 horas
- **Fase 3 (Conversión)**: 7 horas
- **Fase 4 (Polish)**: 12 horas

### Total: ~36.5 horas (~4.5 días)

---

## 🎯 Orden de Implementación Sugerido

1. TAREA-001 → Rápida, alto impacto
2. TAREA-004 → Rápida, mejora orientación
3. TAREA-002 → Validación email crítica
4. TAREA-003 → Validación teléfono crítica
5. TAREA-012 → Mejora mensajes error
6. TAREA-005-007 → Unificación selects (en paralelo)
7. TAREA-008-009 → Sticky summary
8. TAREA-010 → Código descuento visible
9. TAREA-011 → Tooltips informativos
10. TAREA-014 → Mejora ida y vuelta
11. TAREA-013 → Animaciones polish
12. TAREA-015 → Testing completo
13. TAREA-016 → Documentación

---

## 📝 Notas Finales

- Todas las tareas deben pasar lint antes de commit
- Usar commits semánticos: `feat:`, `fix:`, `docs:`, `style:`
- Crear PR individual por fase para facilitar review
- Incluir screenshots en PRs de cambios visuales
- Actualizar CHANGELOG.md con cada merge

---

**Documento creado**: 2025-10-10  
**Versión**: 1.0  
**Estado**: Listo para asignación
