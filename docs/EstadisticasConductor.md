# EstadisticasConductor - Documentación

## Descripción
Componente React para visualizar estadísticas individuales de conductores. Muestra métricas de desempeño, promedios por categoría y últimas evaluaciones, respetando la privacidad de información sensible como propinas.

## Uso

```jsx
import EstadisticasConductor from './components/EstadisticasConductor';

// Uso básico
<EstadisticasConductor conductorId={123} />
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `conductorId` | number \| string | Sí | ID del conductor para mostrar estadísticas |

## API Endpoint

El componente consume el siguiente endpoint:

```
GET /api/conductores/:id/estadisticas
```

### Respuesta esperada:

```json
{
  "conductor": {
    "id": 123,
    "nombre": "Juan Pérez"
  },
  "estadisticas": {
    "promedioGeneral": 4.5,
    "totalEvaluaciones": 45,
    "totalServiciosCompletados": 50,
    "porcentajeEvaluado": 90.0,
    "cantidadCincoEstrellas": 30,
    "promedioPuntualidad": 4.8,
    "promedioLimpieza": 4.6,
    "promedioSeguridad": 4.7,
    "promedioComunicacion": 4.3
  },
  "ultimasEvaluaciones": [
    {
      "id": 1,
      "codigo_reserva": "RES-2024-001",
      "fecha_evaluacion": "2024-01-15T10:30:00",
      "promedio": 4.5,
      "comentario": "Excelente servicio, muy puntual"
    }
  ]
}
```

## Secciones del Componente

### 1. Header
- Muestra el nombre del conductor
- Descripción del contenido

### 2. Métricas Principales (Cards)
- **Promedio General**: Destacado con estrellas, tamaño grande y colores según calificación
- **Total Evaluaciones**: Cantidad total de evaluaciones recibidas
- **Servicios Completados**: Total de servicios realizados
- **Porcentaje Evaluado**: % de servicios que fueron evaluados
- **5 Estrellas**: Cantidad de evaluaciones con calificación perfecta

### 3. Gráfico de Promedios por Categoría
Muestra barras de progreso visuales para:
- **Puntualidad** (icono: Clock)
- **Limpieza** (icono: Sparkles)
- **Seguridad** (icono: Shield)
- **Comunicación** (icono: MessageCircle)

Cada barra incluye:
- Valor numérico (0.0 - 5.0)
- Barra de progreso visual
- Color según promedio (verde >= 4.5, amarillo >= 3.5, rojo < 3.5)

### 4. Badge de Categoría Mejor Calificada
- Identifica automáticamente la categoría con mejor promedio
- Muestra un badge destacado con el nombre y valor

### 5. Lista de Últimas 10 Evaluaciones
Cada evaluación muestra:
- Fecha de evaluación
- Código de reserva (formato: RES-YYYY-NNN)
- Calificación promedio con estrellas
- Comentario truncado (si existe)

## Privacidad

⚠️ **IMPORTANTE**: Este componente NO muestra información de propinas:
- `totalPropinasRecibidas`
- `cantidadPropinas`
- `promedioPropina`

Esta información solo es visible en el componente `AdminEvaluaciones` para administradores.

## Colores por Calificación

| Promedio | Color de Texto | Color de Fondo |
|----------|---------------|----------------|
| >= 4.5 | Verde (#16a34a) | Verde claro |
| >= 3.5 | Amarillo (#ca8a04) | Amarillo claro |
| < 3.5 | Rojo (#dc2626) | Rojo claro |

## Estados

### Loading
Muestra un spinner con mensaje "Cargando estadísticas..."

### Error
Muestra una alerta con el mensaje de error

### Sin Datos
Muestra un mensaje informativo cuando no hay estadísticas disponibles

### Sin Evaluaciones
Muestra un ícono y mensaje cuando no hay evaluaciones registradas

## Dependencias

- `react` - Hooks useState, useEffect
- `lucide-react` - Iconos
- `./ui/card` - Componente Card de shadcn/ui
- `./ui/badge` - Componente Badge de shadcn/ui
- `./ui/progress` - Componente Progress de shadcn/ui
- `./ui/alert` - Componente Alert de shadcn/ui
- `../lib/backend` - Función getBackendUrl
- `../hooks/useAuthenticatedFetch` - Hook para peticiones autenticadas

## Responsive Design

- **Mobile (< 768px)**: Cards en 1 columna, evaluaciones en formato vertical
- **Tablet (768px - 1024px)**: Cards en 2 columnas
- **Desktop (>= 1024px)**: Cards en 5 columnas, diseño optimizado

## Ejemplo de Integración en AdminPanel

```jsx
import { useState } from 'react';
import EstadisticasConductor from './EstadisticasConductor';
import { Button } from './ui/button';

function PanelConductores() {
  const [conductorSeleccionado, setConductorSeleccionado] = useState(null);

  return (
    <div>
      {conductorSeleccionado ? (
        <div>
          <Button onClick={() => setConductorSeleccionado(null)}>
            Volver
          </Button>
          <EstadisticasConductor conductorId={conductorSeleccionado} />
        </div>
      ) : (
        <ListaConductores onSelect={setConductorSeleccionado} />
      )}
    </div>
  );
}
```

## Pruebas Recomendadas

1. **Con datos completos**: Verificar que todas las secciones se muestren correctamente
2. **Sin evaluaciones**: Verificar mensaje de "No hay evaluaciones"
3. **Con comentarios largos**: Verificar truncamiento de texto
4. **Diferentes promedios**: Verificar colores (verde, amarillo, rojo)
5. **Error de red**: Verificar manejo de errores
6. **Carga lenta**: Verificar estado de loading

## Notas Adicionales

- El componente usa `authenticatedFetch` para peticiones seguras
- Los datos se recargan automáticamente si cambia el `conductorId`
- Las fechas se formatean en español chileno (es-CL)
- Los comentarios se truncan a 80 caracteres con "..."
- La información es de solo lectura (no permite edición)
