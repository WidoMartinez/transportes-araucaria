# Integración de Google Maps Autocomplete

## Descripción General

Se ha implementado un sistema de autocompletado de direcciones utilizando la API de Google Places Autocomplete. Esta funcionalidad mejora la experiencia del usuario al permitir la selección precisa de direcciones en los formularios del sistema.

## Características

- **Modo Degradado**: Funciona como un campo de texto normal si no hay una API key configurada
- **Restricción Geográfica**: Limitado a direcciones en Chile para mayor precisión
- **Integración Transparente**: Se integra perfectamente con los formularios existentes
- **Autocompletado Inteligente**: Sugerencias en tiempo real mientras el usuario escribe
- **Compatible con Móviles**: Funciona correctamente en dispositivos móviles y desktop

## Configuración

### 1. Obtener una API Key de Google Maps

1. Visita [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Places API**
4. Crea credenciales (API Key)
5. Configura restricciones para la API key:
   - Restricción de aplicación: Referentes HTTP
   - Agrega tu dominio: `*.transportesaraucaria.cl/*` y `localhost:*` para desarrollo
   - Restricción de API: Solo habilita "Places API"

### 2. Configurar la Variable de Entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```bash
VITE_GOOGLE_MAPS_API_KEY=tu-api-key-aqui
```

**Nota**: La aplicación funciona sin esta variable, pero el autocompletado no estará disponible.

### 3. Consideraciones de Costos

La API de Google Maps Places tiene un nivel gratuito:
- $200 USD de crédito mensual gratis
- Aproximadamente 28,500 solicitudes de autocompletado gratuitas por mes
- Después del límite gratuito: $2.83 USD por 1,000 solicitudes

**Recomendaciones para controlar costos**:
- Configura alertas de facturación en Google Cloud Console
- Establece cuotas de uso diarias
- Implementa caching de resultados si es necesario

## Uso del Componente

### Importación

```jsx
import { AddressAutocomplete } from "./ui/address-autocomplete";
```

### Ejemplo Básico

```jsx
<AddressAutocomplete
  id="direccion"
  name="direccion"
  value={formData.direccion}
  onChange={handleInputChange}
  placeholder="Ingresa una dirección"
  required
/>
```

### Propiedades Disponibles

| Propiedad | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `value` | string | Sí | Valor actual del campo |
| `onChange` | function | Sí | Callback cuando cambia el valor |
| `id` | string | Sí | ID del input HTML |
| `name` | string | Sí | Nombre del input HTML |
| `placeholder` | string | No | Texto de placeholder |
| `className` | string | No | Clases CSS adicionales |
| `required` | boolean | No | Si el campo es requerido |
| `onPlaceSelected` | function | No | Callback con información completa del lugar seleccionado |
| `autocompleteOptions` | object | No | Opciones adicionales para Google Places API |

### Ejemplo Avanzado con Callback

```jsx
const handlePlaceSelected = (placeInfo) => {
  console.log("Dirección:", placeInfo.address);
  console.log("Coordenadas:", placeInfo.geometry.location);
  console.log("Componentes:", placeInfo.components);
};

<AddressAutocomplete
  id="direccion"
  name="direccion"
  value={formData.direccion}
  onChange={handleInputChange}
  onPlaceSelected={handlePlaceSelected}
  placeholder="Ingresa una dirección"
/>
```

## Componentes Integrados

Los siguientes componentes ya tienen integración de autocompletado:

### 1. PagarConCodigo.jsx
- **Campo**: Dirección de origen
- **Campo**: Dirección de destino
- **Ubicación**: Formulario de pago con código

### 2. Contacto.jsx
- **Campo**: Destino
- **Ubicación**: Formulario de contacto

## Comportamiento sin API Key

Si no se proporciona una API key de Google Maps:

1. El componente funciona como un campo de texto normal
2. No se muestran sugerencias de autocompletado
3. El usuario puede ingresar direcciones manualmente
4. Todas las validaciones siguen funcionando normalmente

## Solución de Problemas

### El autocompletado no aparece

1. Verifica que la API key esté configurada en `.env`
2. Verifica que la Places API esté habilitada en Google Cloud Console
3. Revisa la consola del navegador en busca de errores
4. Asegúrate de que el dominio esté en la lista blanca de la API key

### Error de facturación

1. Verifica que tengas un método de pago configurado en Google Cloud
2. Revisa los límites de uso en Google Cloud Console
3. Considera implementar un sistema de cuotas

### El componente no carga

1. Verifica que el script de Google Maps se esté cargando correctamente
2. Revisa la consola del navegador en busca de errores de CORS
3. Asegúrate de que la API key tenga los permisos correctos

## Desarrollo Futuro

Posibles mejoras para implementar:

1. **Caché de Direcciones**: Guardar direcciones frecuentes para reducir llamadas a la API
2. **Validación de Cobertura**: Verificar que la dirección esté dentro del área de servicio
3. **Cálculo de Distancias**: Integrar Distance Matrix API para calcular distancias reales
4. **Visualización en Mapa**: Mostrar un mapa con la ubicación seleccionada
5. **Historial de Direcciones**: Sugerir direcciones previamente usadas por el usuario
6. **Integración en HeroExpress y Hero**: Agregar autocompletado en los componentes principales (requiere refactorización de selectores)

## Estructura de Archivos

```
src/
├── hooks/
│   └── useGoogleMaps.js              # Hook para cargar Google Maps API
└── components/
    └── ui/
        └── address-autocomplete.jsx   # Componente de autocompletado
```

## Referencias

- [Google Places Autocomplete Documentation](https://developers.google.com/maps/documentation/javascript/place-autocomplete)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)

## Soporte

Para reportar problemas o sugerir mejoras, por favor abre un issue en el repositorio.
