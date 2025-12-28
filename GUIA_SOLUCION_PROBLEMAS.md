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

### Procedimiento de Migración
No existe un sistema de migración automatizado (tipo Sequelize CLI) configurado completamente. Las migraciones se manejan así:

1. **Detectar el cambio**: Comparar el modelo Sequelize local (`models/Reserva.js`) con la estructura en Render.
2. **Script de Migración**:
   - Se han creado scripts PHP/SQL auxiliares en `backend/migrar_reservas.php` (legacy) o se debe ejecutar SQL directo en la base de datos de Render.
3. **Verificación**: Usar endpoints de prueba o visualizar logs para confirmar que la columna ya es accesible.

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

---
**Nota**: Si el problema persiste, revisar la carpeta `docs/legacy/` para bitácoras históricas más específicas.
