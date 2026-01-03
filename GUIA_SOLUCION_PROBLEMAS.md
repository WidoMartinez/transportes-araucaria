# 🔧 Guía de Solución de Problemas (Troubleshooting)

Este documento centraliza las soluciones a problemas comunes técnicos detectados durante el desarrollo, incluyendo migraciones y errores de enrutamiento.

## 1. Problemas de Rutas y Backend (Error 500)

### Síntoma
Error 500 al acceder a ciertos endpoints (ej. `/api/reservas/estadisticas`) o pantallas en blanco en el panel administrativo.

### Causa
- **Desincronización de BD**: Las tablas no existen en el entorno de Render (especialmente tras un despliegue limpio).
- **Rutas no coincidentes**: El frontend intenta acceder a rutas locales (`localhost`) en lugar de producción.

### Solución
1. **Verificar Variables de Entorno**: Asegurar que `VITE_API_URL` en `.env.local` apunte a `https://transportes-araucaria.onrender.com`.
2. **Sincronización de Tablas**:
   - El backend tiene una función `syncDatabase()` que debe ejecutarse al inicio.
   - Si faltan columnas (ej. `totalConDescuento` no existe), se debe forzar una migración o alteración de tabla.
3. **Logs**: Revisar logs de Render.com para ver el error SQL exacto.

> **Referencia detallada**: Ver `docs/legacy/PROBLEMA_BACKEND_500.md`.

## 2. Migración de Tablas y Base de Datos

### Problema
Cambios en el esquema local (ej. nuevas columnas en `Reservas`) no se reflejan automáticamente en producción, causando errores de consulta.

### Procedimiento de Migración (Estándar 2026)
El sistema utiliza un **sistema de auto-migración al inicio** (`server-db.js`).

1.  **Crear Script**: Crear el archivo en `backend/migrations/nombre-migracion.js` siguiendo el patrón estándar (ver `MIGRATION_README.md`).
2.  **Integrar**: Importar y ejecutar la función `await nombreMigracion()` dentro de la función `startServer()` en `backend/server-db.js`.
3.  **Despliegue**: Al hacer push, Render reiniciará el servidor y ejecutará la migración automáticamente con las credenciales de producción.

**Nota Importante**: No ejecutar scripts manualmente en local si no se tienen las credenciales de producción configuradas. Confiar en el ciclo de despliegue.

## 3. Problemas de Autenticación (Migración Auth)

### Problema
El panel administrativo no permite editar tras login.

### Solución (Aplicada)
Se migró de `localStorage.getItem('adminToken')` a un `AuthContext` robusto.
- **Antes**: Componentes buscaban un token estático.
- **Ahora**: `useAuth()` provee el token actualizado.

> **Referencia detallada**: Ver `docs/legacy/MIGRACION_AUTH_ADMINRESERVAS.md`.

## 4. Problemas de Google Maps (Rutas y Autocomplete)

### Problema
Error `RefererNotAllowedMapError` o advertencias de deprecación.

### Solución
- **Componente**: Usar `<place-autocomplete-element>` en lugar de la librería legacy de Google Places para evitar warnings de deprecación.

## 5. Problemas de Conversiones Google Ads (Rutas Fantasma)

### Problema
Las conversiones no se registraban porque la página de retorno (`/flow-return`) no cargaba, mostrando 404 o la página de inicio. Esto se debía a **"Rutas Fantasma" o Shadowing**: el enrutador del cliente (React Router) tenía rutas genéricas (`*` o `/`) que capturaban la URL antes que la ruta específica de retorno.

### Solución (App.jsx)
Se implementó un mecanismo de **detección manual de ruta** en `App.jsx` que bypasssea el enrutador normal cuando detecta un retorno de pago.

```javascript
// App.jsx
const resolveIsFlowReturnView = () => {
    // Detecta tanto /flow-return (path) como #flow-return (hash)
    const pathname = window.location.pathname.toLowerCase();
    return pathname.includes("/flow-return");
};

// Renderizado condicional prioritario
if (isFlowReturnView) {
    return <FlowReturn />;
}
```

Esto garantiza que la página de agradecimiento y el script de conversión (`gtag`) se ejecuten siempre, independientemente de la configuración del servidor o del enrutador cliente.

## 6. Planificación Mostrando Reservas No Pagadas

### Problema
La vista de planificación (calendario) mostraba reservas que no habían sido pagadas, incluyendo aquellas en estado pendiente sin confirmación de pago.

### Causa
El endpoint `/api/reservas/calendario` solo filtraba por estado (`cancelada`, `rechazada`) pero no verificaba el estado de pago de las reservas.

### Solución (Diciembre 2025)
Se modificó el endpoint en `backend/server-db.js` para incluir filtros de pago:

```javascript
// Solo incluir reservas confirmadas (con pago)
const reservasIda = await Reserva.findAll({
  where: {
    fecha: { [Op.gte]: startDate, [Op.lte]: endDateInclusive },
    estado: { [Op.notIn]: ["cancelada", "rechazada"] },
    // Filtrar solo reservas confirmadas
    [Op.or]: [
      { abonoPagado: true },
      { saldoPagado: true }
    ]
  },
  order: [["fecha", "ASC"], ["hora", "ASC"]],
});
```

Adicionalmente, se agregó la columna "Número de Reserva" en la tabla de planificación para facilitar la identificación de cada viaje.

**Archivos modificados**:
- `backend/server-db.js` (líneas 776-799)
- `src/components/AdminReservas.jsx` (líneas 629-673)

## 7. Planificación Mostrando Información Genérica de Asignación

### Problema
La vista de planificación imprimible mostraba información genérica como "Auto Privado" o "(Conductor asignado)" en lugar de los datos específicos del vehículo y conductor asignados (patente, nombre).

### Causa
El endpoint `/api/reservas/calendario` no incluía las relaciones con los modelos `Conductor` y `Vehiculo`, por lo que solo enviaba los campos básicos (`vehiculo` como texto genérico y `conductorId` como número).

### Solución (Diciembre 2025)

**Backend** - Se agregaron includes de Sequelize para obtener datos relacionados:

```javascript
// En ambas consultas (reservasIda y reservasVuelta)
include: [
  { model: Conductor, as: 'conductor_asignado', required: false },
  { model: Vehiculo, as: 'vehiculo_asignado', required: false }
]
```

Se agregaron nuevos campos en la respuesta del endpoint:
- `conductorNombre`: Nombre completo del conductor
- `vehiculoPatente`: Patente del vehículo (ej: "ABCD12")
- `vehiculoTipo`: Tipo de vehículo (ej: "SUV", "Sedan")

**Frontend** - Se mejoró la lógica de renderizado en `AdminReservas.jsx`:

```javascript
// Prioridad 1: Mostrar datos específicos si están disponibles
if (ev.vehiculoPatente || ev.conductorNombre) {
  asignacion = `
    🚗 ${vehiculoTipo} (${vehiculoPatente})<br>
    👤 ${conductorNombre}
  `;
}
// Prioridad 2: Fallback a información genérica
else if (ev.vehiculo || ev.conductorId) {
  asignacion = `${ev.vehiculo}<br>(Conductor asignado)`;
}
```

**Resultado**:
- **Antes**: "Auto Privado" / "(Conductor asignado)"
- **Ahora**: "🚗 SUV (ABCD12)" / "👤 Juan Pérez"

**Archivos modificados**:
- `backend/server-db.js` (líneas 789-869)
- `src/components/AdminReservas.jsx` (líneas 659-690)

---
**Nota**: Si el problema persiste, revisar la carpeta `docs/legacy/` para bitácoras históricas más específicas.
