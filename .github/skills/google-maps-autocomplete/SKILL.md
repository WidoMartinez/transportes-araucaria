---
name: google-maps-autocomplete
description: "Skill para operar, configurar y depurar el sistema de autocompletado de direcciones con Google Maps Places API (PlaceAutocompleteElement v2). Usar cuando: se necesite agregar autocompletado en nuevos formularios, depurar errores de carga de la API, ajustar opciones de restricción de país o tipos de lugar, modificar estilos del Web Component, entender el flujo de eventos, o resolver ApiTargetBlockedMapError y otros errores conocidos."
---

# Skill: Google Maps Autocomplete — Transportes Araucanía

## Propósito

Guía completa para trabajar con el autocompletado de direcciones basado en **Google Maps Places API v2** (`PlaceAutocompleteElement`), la arquitectura híbrida React + Web Component, el manejo de eventos y los errores conocidos del sistema.

---

## Arquitectura General

```
Formulario React (ej: HeroExpress.jsx)
  └── <AddressAutocomplete value={...} onChange={...} onPlaceSelected={...} />
         ├── useGoogleMaps()                    ← carga el script de Maps
         │     └── window.google.maps.places    ← verifica disponibilidad
         └── PlaceAutocompleteElement           ← Web Component montado en DOM
               ├── eventos: focusin / focusout / input
               ├── evento: gmp-placeautocomplete-place-changed
               └── prediction.toPlace().fetchFields()  ← obtiene formattedAddress
```

### Por qué arquitectura híbrida (React + Web Component)

- `PlaceAutocompleteElement` es un **Web Component nativo** del DOM, no un componente React.  
- El input React (`<input ref={inputRef}>`) actúa como **fuente de verdad del formulario** (mantiene `value` y `name` para envíos / validaciones).
- El Web Component se superpone visualmente (overlay `position: absolute`) con `opacity: 0` en el input React cuando el overlay está activo.
- Esto permite compatibilidad con cualquier librería de formularios (estado controlado de React).

---

## Mapa de Archivos Clave

| Archivo | Rol |
|---------|-----|
| `src/hooks/useGoogleMaps.js` | Carga el script de Maps y expone `{ isLoaded, loadError, isAvailable }` |
| `src/components/ui/address-autocomplete.jsx` | Componente `<AddressAutocomplete>` — monta el Web Component, gestiona eventos |
| `src/App.css` (línea ~274) | Estilos CSS para `PlaceAutocompleteElement` (`.gmp-autocomplete-wrapper`) |

### Componentes que usan `<AddressAutocomplete>`

| Componente | Contexto |
|------------|----------|
| `src/components/HeroExpress.jsx` | Origen/destino en reserva express |
| `src/components/CompletarDetalles.jsx` | Detalles de dirección en reserva |
| `src/components/AdminReservas.jsx` | Edición de dirección en panel admin |
| `src/components/PagarConCodigo.jsx` | Dirección en flujo pago con código |

---

## Variable de Entorno

```bash
# .env (desarrollo local)
VITE_GOOGLE_MAPS_API_KEY=TU_CLAVE_AQUI

# En Render.com (producción) → Environment Variables del servicio
VITE_GOOGLE_MAPS_API_KEY=TU_CLAVE_AQUI
```

- Sin esta variable, el hook retorna `isAvailable: false` y el componente actúa como **input de texto simple** (fallback seguro).
- La clave debe tener habilitada la API: **Maps JavaScript API** + **Places API (New)**.

---

## Hook `useGoogleMaps`

```js
import { useGoogleMaps } from "../../hooks/useGoogleMaps";
const { isLoaded, loadError, isAvailable } = useGoogleMaps();
```

| Retorno | Tipo | Descripción |
|---------|------|-------------|
| `isLoaded` | `boolean` | `true` cuando `window.google.maps.places` está disponible Y hay API key |
| `loadError` | `string\|null` | Mensaje de error si el script falló al cargar |
| `isAvailable` | `boolean` | `true` si existe la variable `VITE_GOOGLE_MAPS_API_KEY` |

### Lógica de carga del script

El hook:
1. Verifica si `window.google.maps.places` ya existe (evita doble carga).
2. Si existe un `<script src="maps.googleapis.com">` sin terminar, usa `setInterval` cada 100ms para detectar la carga.
3. Si no hay script, lo crea con:
   ```
   ?key=...&loading=async&libraries=places&language=es&region=CL&callback=googleMapsCallback
   ```
4. **NO usa `v=beta`** — esto evita `ApiTargetBlockedMapError` con claves con restricciones de target.

---

## Componente `<AddressAutocomplete>`

### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` | — | Valor controlado del input |
| `onChange` | `function` | — | Callback `(event) => void` con `event.target.{ name, value }` |
| `onPlaceSelected` | `function` | — | Callback `({ address, components, geometry }) => void` al seleccionar un lugar |
| `placeholder` | `string` | `"Ingresa una dirección"` | Placeholder visible |
| `id` | `string` | — | Atributo `id` del input interno |
| `name` | `string` | — | Atributo `name` del input (necesario para formularios) |
| `className` | `string` | `""` | Clases CSS adicionales para el input |
| `required` | `boolean` | `false` | Marca el input como requerido |
| `autocompleteOptions` | `object` | `{}` | Opciones para `PlaceAutocompleteElement` (ver abajo) |

### `autocompleteOptions` — opciones del Web Component

Opciones que se pasan directamente al constructor `new PlaceAutocompleteElement({...})`:

```js
// Valores por defecto en el componente:
{
  componentRestrictions: { country: "cl" },  // Solo Chile
  types: ["address"],                         // Solo direcciones
}

// Ejemplo para permitir también establecimientos y ciudades:
<AddressAutocomplete
  autocompleteOptions={{
    componentRestrictions: { country: "cl" },
    types: ["geocode", "establishment"],
  }}
/>

// Ejemplo sin restricción de país (global):
<AddressAutocomplete
  autocompleteOptions={{
    types: ["address"],
  }}
/>
```

### Uso básico en un formulario React

```jsx
import { AddressAutocomplete } from "../ui/address-autocomplete";

// Estado del formulario
const [direccion, setDireccion] = useState("");

// En el JSX
<AddressAutocomplete
  id="direccion-origen"
  name="origen"
  value={direccion}
  onChange={(e) => setDireccion(e.target.value)}
  onPlaceSelected={({ address, components, geometry }) => {
    setDireccion(address);
    // components: array de AddressComponent con tipos (locality, country, etc.)
    // geometry: { location: LatLng } o null
  }}
  placeholder="Ingresa dirección de origen"
  required
/>
```

---

## Flujo de Eventos del Web Component

```
Usuario escribe texto
  └── evento "input"
        └── si selectedAddressRef.current === null
              → onChangeRef.current({ target: { name, value: texto_escrito } })

Usuario selecciona una sugerencia
  └── evento "gmp-placeautocomplete-place-changed"
        ├── prediction = event.placePrediction ?? element.value
        ├── fallbackAddress = prediction.text.text  (síncrono, sin API call)
        │     → selectedAddressRef.current = fallbackAddress
        │     → onChangeRef.current(...)  # actualiza React de inmediato
        ├── place = prediction.toPlace()
        ├── await place.fetchFields({ fields: ["formattedAddress", ...] })
        │     → onChangeRef.current(...)  # actualiza con dirección completa
        │     → onPlaceSelectedRef.current({ address, components, geometry })
        └── finally: setActive(false)

Usuario sale del campo (focusout)
  └── setTimeout 300ms → setActive(false)
  (el delay previene ocultar el dropdown antes de que mousedown seleccione)
```

### Por qué `selectedAddressRef`

Una vez seleccionado un lugar, el Web Component puede disparar eventos `input` con texto parcial. `selectedAddressRef` bloquea esos eventos para evitar sobreescribir la dirección ya completada.

---

## Estilos CSS

El Web Component se inyecta dentro de `.gmp-autocomplete-wrapper`. Los estilos se deben declarar en `src/App.css`:

```css
/* === Estilos para PlaceAutocompleteElement === */
.gmp-autocomplete-wrapper gmp-placeautocomplete {
  width: 100%;
  height: 100%;
  /* El input interno del Web Component */
}

/* Para personalizar el dropdown de sugerencias se usa ::part() */
.gmp-autocomplete-wrapper gmp-placeautocomplete::part(input) {
  /* estilos del input interno */
}
```

> ⚠️ Los Web Components con Shadow DOM pueden limitar el CSS externo.
> Usar `::part()` o variables CSS expuestas por Google.

---

## Errores Conocidos y Soluciones

### `ApiTargetBlockedMapError`

**Causa**: Se usaba `v=beta` en la URL del script. Las claves con restricciones de "API target" bloquean versiones beta.  
**Solución**: **No incluir `v=beta`**. El hook actual ya corrigió esto. `PlaceAutocompleteElement` está disponible en la versión estable desde 2024.

### `prediction es null — selección ignorada`

**Causa**: `event.placePrediction` y `element.value` son ambos nulos/vacíos al dispararse el evento.  
**Diagnóstico**: Revisar en consola los logs `[AC]` que el componente imprime.  
**Solución**: Verificar que `libraries=places` está en la URL del script y que la clave tiene "Places API (New)" habilitada.

### `fetchFields falló`

**Causa**: La clave no tiene permisos para `Places API (New)` o se excedió la cuota.  
**Comportamiento**: El componente maneja el error con `try/catch` y usa `fallbackAddress` (texto de la sugerencia sin campos enriquecidos).

### Script de Maps no carga

**Diagnóstico**: Abrir consola del navegador y buscar:
```
[AC-INIT] isLoaded: false | isAvailable: true
[AC-INIT] window.google existe: false
```
Luego verificar en la pestaña Network que la request a `maps.googleapis.com` no retorne 403.  
**Solución**: Verificar que `VITE_GOOGLE_MAPS_API_KEY` esté correctamente definida y que la clave tenga los dominios autorizados correctos (incluir `localhost` para desarrollo).

### Input React no actualiza al escribir

**Causa**: `selectedAddressRef.current` quedó con un valor de una selección anterior.  
**Comportamiento esperado**: Al hacer foco de nuevo (`focusin`), `selectedAddressRef.current` se resetea a `null`.

---

## Checklist para Agregar Autocompletado en un Nuevo Componente

- [ ] Importar `AddressAutocomplete` desde `../../ui/address-autocomplete` (ajustar ruta relativa).
- [ ] Declarar estado controlado: `const [dir, setDir] = useState("")`.
- [ ] Pasar `value`, `onChange`, `name`, `id` y opcionalmente `onPlaceSelected`.
- [ ] Verificar que `VITE_GOOGLE_MAPS_API_KEY` esté en `.env` y en Render.com.
- [ ] Probar en localhost y en producción (diferentes dominios autorizados en la clave de GCP).
- [ ] Si se necesita más de un campo de dirección en el mismo formulario, cada `<AddressAutocomplete>` es independiente (cada uno monta su propio Web Component).

---

## Restricciones y Consideraciones

- **Solo Chile por defecto**: `componentRestrictions: { country: "cl" }`. Modificar via `autocompleteOptions` si se necesita otro país.
- **Un script por página**: `useGoogleMaps` detecta si el script ya existe para no cargarlo dos veces. No crear tags `<script>` de Maps adicionales.
- **Fallback a texto libre**: Si `isAvailable` es `false` (sin API key), el componente renderiza un `<input>` normal, lo que permite que los formularios sigan funcionando.
- **No es un componente PHP**: Los archivos `.php` en Hostinger **no** interactúan con este sistema; el autocompletado es 100% frontend.

---

## Deploy y Entornos

| Entorno | URL base | Restricción de dominio (GCP) |
|---------|----------|------------------------------|
| Local | `http://localhost:5173` | Agregar `localhost` en GCP Console → APIs → Maps JS API → Restricciones |
| Producción (Hostinger) | `https://transportesaraucania.cl` | Dominio ya autorizado |

Los cambios en este módulo son **solo frontend** y se despliegan con el build de Vite a Hostinger.

