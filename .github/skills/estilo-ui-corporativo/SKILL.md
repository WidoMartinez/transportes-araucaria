# SKILL: Estilo UI/UX Corporativo Premium — Transportes Araucanía

## Propósito
Esta guía estandariza la línea visual "Premium, Minimalista y Corporativa" que el proyecto exige. Los agentes deben consultar esta guía antes de agregar o modificar componentes visuales en el frontend para asegurar que no se rompa la cohesión de la marca.

---

## 🎨 Paleta de Colores Oficial

El diseño se basa en tonos tierra premium (café y verde bosque) con altos contrastes y fondos amplios.

### 1. Colores Principales (Brand)
- **Café Primario (Acentos/Botones principales)**: `#8C5E42`
- **Café Claro (Textos destacados/Logos)**: `#C4895E`
- **Verde Bosque Oscuro (Fondos de tarjetas/Secciones)**: `#1E3A14`, `#162B0E`, `#1C3812`

### 2. Variables CSS (`src/App.css`)
Mantener el uso de las variables definidas en la configuración de Tailwind:
- `text-slate-900` para títulos oscuros.
- `text-slate-500` para subtítulos y descripciones.
- `bg-slate-50` o `bg-white` para fondos limpios y minimalistas en tarjetas.

---

## 🔲 Estructura de Componentes y Formas

El diseño premium de este proyecto se caracteriza por evitar esquinas duras e integrar sensación de suavidad y modernidad.

### 1. Bordes Redondeados (Border Radius)
- **Tarjetas/Contenedores Grandes**: Utilizar siempre curvaturas amplias como `rounded-[2.5rem]` o `rounded-[3rem]`.
- **Modales/Popovers**: Usar `rounded-3xl` o `rounded-2xl`.
- **Botones y Badges**: Usar `rounded-full` (forma de píldora) o `rounded-2xl`.
- **Inputs de formulario**: Usar `rounded-xl` a `rounded-2xl`.

### 2. Sombras y Elevación (Shadows)
Las sombras deben ser profundas pero difuminadas para dar sensación de levitación.
- **Tarjetas destacadas**: `shadow-[0_20px_50px_rgba(0,0,0,0.3)]` o `shadow-2xl shadow-slate-900/30`.
- **Menús y Dropdowns**: `shadow-xl border border-slate-100`.

### 3. Glassmorphism (Efecto Cristal)
Especialmente útil en navegaciones flotantes y badges sobre fondos oscuros o imágenes.
- **Clases estándar**: `bg-white/10 backdrop-blur-md border border-white/20`.
- **En modo claro**: `bg-white/90 backdrop-blur-md border border-slate-200`.

---

## 📐 Fondos y Texturas

Para evitar un look plano, las secciones principales emplean texturas sutiles alineadas a una estética corporativa de alto nivel.
- **Malla corporativa**: `bg-pattern-mesh` (patrón de cuadrícula técnica suave, reemplaza al ruido clásico).
- **Textura Topográfica**: Usar la clase `bg-pattern-topo` con opacidad controlada (`opacity-60`).
- **Fondos ambientales (Blurs)**: Utilizar círculos difuminados en posiciones absolutas para dar ambiente sin recargar. 
  *Ejemplo:* `absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-[#8C5E42]/10 blur-[120px] opacity-40`

---

## 👆 Experiencia Táctil y Botones

### 1. Dimensiones y Espaciado (Mobile First)
- **Táctil (Mobile-first)**: Todo botón o control debe tener un mínimo de 44x44px de área de tap. 
- **Padding Interno**: Elementos de formulario deben ser legibles y cómodos; preferir `h-12` o `h-14` para inputs y botones principales en el Hero.
- **Antisolapamiento estricto**: Asegurar que los componentes absolutos de navegación de sliders (como las flechas o contadores `01 / 04`) no se pisen con los badges de texto. Esto implica márgenes inferiores amplios en móviles (`pb-32` o superior) o modificar layouts fijos problemáticos a contenedores fluidos mínimos (`min-h-[550px]`). Adicionalmente, el texto debe truncarse elegantemente en pantallas angostas.

### 2. Microinteracciones (Animaciones)
Al tocar elementos interactivos, usar escalado suave que otorga una respuesta premium:
- **Clases estándar Tailwind**: `transition-all duration-300 active:scale-[0.98]`.
- **Framer Motion**: `whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`.

---

## 🚫 Prácticas Estrictamente Prohibidas

1. **Colores genéricos saturados**: Evitar Tailwind base colors como `bg-red-500`, `bg-blue-600` o degradados estándar no personalizados. Todo debe adherirse a los rangos Bosque/Café y neutros (Slate).
2. **Esquinas rectas o casi imperceptibles**: Diseñar siempre evitando esquinas filosas. Nada de `rounded-sm`; las tarjetas deben ser muy curvas.
3. **Over-engineering en Layouts de Móvil**: No forzar `aspect-ratio` rígidos (ej. `aspect-[4/5]`) si ahorcan el texto en dispositivos angostos. Primar la altura dinámica usando `min-h-[600px]` o `h-auto`.
4. **Tarjetas planas sin contraste**: Todo elemento interactivo principal debe diferenciarse de los fondos estáticos vía elevación y contornos suaves.

---

## ⚙️ Checklist para el Agente UI

Cuando se modifique o cree una vista nueva:
1. Validar el uso de los colores Brand (`#8C5E42`, `#1E3A14`).
2. Implementar bordes grandes (`rounded-[3rem]`, `rounded-full`).
3. Verificar overlaps de texto en *Mobile* y utilizar `truncate`, así como espaciados generosos al final (`pb-24` a `pb-36`).
4. Si requiere texturas de fondo, usar mallas corporativas (`bg-pattern-mesh`) en lugar de estática.
