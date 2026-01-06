# Guía de Integración - EstadisticasConductor

## Ejemplos de Integración

### 1. Integración en AdminConductores

Agregar un botón "Ver Estadísticas" en la lista de conductores:

```jsx
// En AdminConductores.jsx

import { useState } from "react";
import EstadisticasConductor from "./EstadisticasConductor";
import { Button } from "./ui/button";
import { BarChart3 } from "lucide-react";

function AdminConductores() {
  const [vistaEstadisticas, setVistaEstadisticas] = useState(null);

  // Si está viendo estadísticas, mostrar el componente
  if (vistaEstadisticas) {
    return (
      <div>
        <Button onClick={() => setVistaEstadisticas(null)}>
          Volver a Conductores
        </Button>
        <EstadisticasConductor conductorId={vistaEstadisticas} />
      </div>
    );
  }

  // Vista normal de conductores
  return (
    <div>
      {/* ... resto del código ... */}
      <TableBody>
        {conductores.map((conductor) => (
          <TableRow key={conductor.id}>
            <TableCell>{conductor.nombre}</TableCell>
            {/* ... otros campos ... */}
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVistaEstadisticas(conductor.id)}
              >
                <BarChart3 className="w-4 h-4" />
                Ver Estadísticas
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </div>
  );
}
```

### 2. Integración en AdminPanel con Tabs

Agregar una pestaña de estadísticas en el panel principal:

```jsx
// En AdminPanel.jsx o AdminDashboard.jsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import EstadisticasConductor from "./EstadisticasConductor";

function AdminPanel() {
  const [conductorId, setConductorId] = useState(null);

  return (
    <Tabs defaultValue="dashboard">
      <TabsList>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="conductores">Conductores</TabsTrigger>
        <TabsTrigger value="estadisticas">Estadísticas Conductor</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard">
        {/* Dashboard content */}
      </TabsContent>

      <TabsContent value="conductores">
        <ConductoresList onSelectConductor={setConductorId} />
      </TabsContent>

      <TabsContent value="estadisticas">
        {conductorId ? (
          <EstadisticasConductor conductorId={conductorId} />
        ) : (
          <div>Seleccione un conductor primero</div>
        )}
      </TabsContent>
    </Tabs>
  );
}
```

### 3. Modal/Dialog con Estadísticas

Mostrar estadísticas en un modal al hacer clic en un conductor:

```jsx
// Usando Dialog de shadcn/ui

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import EstadisticasConductor from "./EstadisticasConductor";

function ConductorCard({ conductor }) {
  const [showStats, setShowStats] = useState(false);

  return (
    <>
      <Card>
        <CardContent>
          <h3>{conductor.nombre}</h3>
          <Button onClick={() => setShowStats(true)}>
            Ver Estadísticas
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estadísticas - {conductor.nombre}</DialogTitle>
          </DialogHeader>
          <EstadisticasConductor conductorId={conductor.id} />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### 4. Ruta Dedicada

Crear una ruta específica para estadísticas de conductores:

```jsx
// En App.jsx o router

import { Route, Routes, useParams } from "react-router-dom";
import EstadisticasConductor from "./components/EstadisticasConductor";

function EstadisticasPage() {
  const { conductorId } = useParams();

  return (
    <div className="container mx-auto">
      <EstadisticasConductor conductorId={conductorId} />
    </div>
  );
}

// En las rutas
<Routes>
  <Route path="/admin">
    <Route path="conductores" element={<AdminConductores />} />
    <Route
      path="conductores/:conductorId/estadisticas"
      element={<EstadisticasPage />}
    />
  </Route>
</Routes>
```

### 5. Integración con Selector de Conductor

Usar un dropdown para seleccionar el conductor:

```jsx
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import EstadisticasConductor from "./EstadisticasConductor";

function EstadisticasConSelector() {
  const [conductores, setConductores] = useState([]);
  const [conductorSeleccionado, setConductorSeleccionado] = useState("");

  useEffect(() => {
    // Cargar lista de conductores
    fetch("/api/conductores")
      .then((res) => res.json())
      .then((data) => setConductores(data.conductores));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <label className="font-semibold">Seleccionar Conductor:</label>
        <Select
          value={conductorSeleccionado}
          onValueChange={setConductorSeleccionado}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Elegir conductor..." />
          </SelectTrigger>
          <SelectContent>
            {conductores.map((conductor) => (
              <SelectItem key={conductor.id} value={conductor.id.toString()}>
                {conductor.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {conductorSeleccionado && (
        <EstadisticasConductor conductorId={conductorSeleccionado} />
      )}
    </div>
  );
}
```

### 6. Portal para Conductores (Futuro)

Crear una vista simplificada para que los conductores vean sus propias estadísticas:

```jsx
// Portal del Conductor

import { useAuth } from "../contexts/AuthContext";
import EstadisticasConductor from "./EstadisticasConductor";

function PortalConductor() {
  const { user } = useAuth();

  // Asumiendo que el usuario tiene un conductorId
  if (!user?.conductorId) {
    return <div>No tienes acceso a esta sección</div>;
  }

  return (
    <div className="container mx-auto">
      <h1>Mi Desempeño</h1>
      <EstadisticasConductor conductorId={user.conductorId} />
    </div>
  );
}
```

## Consideraciones

### Autenticación
- El componente usa `useAuthenticatedFetch` que requiere autenticación
- Asegúrate de que el usuario esté autenticado antes de mostrar el componente

### Permisos
- Solo administradores deberían ver estadísticas de todos los conductores
- Los conductores solo deberían ver sus propias estadísticas

### Performance
- El componente hace una petición al montar y cuando cambia `conductorId`
- Considera implementar caché si se consultan frecuentemente las mismas estadísticas
- Para listas grandes, usar lazy loading o paginación

### Responsive
- El componente está optimizado para móvil, tablet y desktop
- En modales, considera usar `max-w-6xl` para aprovechar el espacio
- En móvil, el scroll es vertical para mejor experiencia

### Navegación
- Siempre proporciona un botón "Volver" o breadcrumbs
- Mantén el contexto del usuario (de dónde vino)
- Considera usar el historial del navegador con rutas dedicadas

## Pruebas de Integración Recomendadas

1. **Navegación**: Verificar que el flujo de navegación sea intuitivo
2. **Estados**: Probar con/sin conductor seleccionado
3. **Errores**: Manejar errores de red o conductores inexistentes
4. **Permisos**: Verificar que solo usuarios autorizados accedan
5. **Responsive**: Probar en diferentes tamaños de pantalla
6. **Performance**: Verificar tiempo de carga con muchas evaluaciones

## Siguiente Paso: Backend

Recuerda que necesitas implementar el endpoint en el backend:

```javascript
// Ejemplo en Express.js
router.get("/api/conductores/:id/estadisticas", async (req, res) => {
  const { id } = req.params;

  // Obtener datos del conductor
  const conductor = await getConductor(id);

  // Calcular estadísticas
  const estadisticas = await calcularEstadisticasConductor(id);

  // Obtener últimas evaluaciones (sin propinas)
  const ultimasEvaluaciones = await getUltimasEvaluaciones(id, 10);

  res.json({
    conductor: {
      id: conductor.id,
      nombre: conductor.nombre,
    },
    estadisticas: {
      promedioGeneral: estadisticas.promedioGeneral,
      totalEvaluaciones: estadisticas.totalEvaluaciones,
      totalServiciosCompletados: estadisticas.totalServiciosCompletados,
      porcentajeEvaluado: estadisticas.porcentajeEvaluado,
      cantidadCincoEstrellas: estadisticas.cantidadCincoEstrellas,
      promedioPuntualidad: estadisticas.promedioPuntualidad,
      promedioLimpieza: estadisticas.promedioLimpieza,
      promedioSeguridad: estadisticas.promedioSeguridad,
      promedioComunicacion: estadisticas.promedioComunicacion,
      // NO incluir: totalPropinasRecibidas, cantidadPropinas, promedioPropina
    },
    ultimasEvaluaciones: ultimasEvaluaciones.map((e) => ({
      id: e.id,
      codigo_reserva: e.codigo_reserva,
      fecha_evaluacion: e.fecha_evaluacion,
      promedio: e.promedio,
      comentario: e.comentario,
      // NO incluir: propina
    })),
  });
});
```
