# Migración de AdminReservas al Sistema de Autenticación Moderno

## Problema

El componente `AdminReservas` estaba usando el sistema legacy de autenticación basado en `localStorage.getItem("adminToken")`, mientras que el sistema moderno usa:

- **AuthContext** con hooks `useAuth()`
- Token de acceso: `adminAccessToken` (8 horas)
- Token de refresco: `adminRefreshToken` (7 días)

Esto causaba que **después de hacer login, no se pudiera editar ni modificar reservas** porque el componente buscaba un token que ya no existe en el localStorage con ese nombre.

---

## Solución Implementada

### 1. Importar AuthContext

```jsx
import { useAuth } from "../contexts/AuthContext";
```

### 2. Usar el Hook en el Componente

```jsx
function AdminReservas() {
  // Sistema de autenticación moderno
  const { accessToken } = useAuth();

  // Token con compatibilidad backward y prioridad al nuevo sistema
  const ADMIN_TOKEN =
    accessToken ||  // ✅ Primero: token del contexto (sistema moderno)
    import.meta.env.VITE_ADMIN_TOKEN ||  // Segundo: variable de entorno
    (typeof window !== "undefined"
      ? localStorage.getItem("adminToken") || localStorage.getItem("adminAccessToken") || ""
      : "");
```

### 3. Eliminar Redefiniciones Locales

Se eliminaron **todas las redefiniciones locales** de `ADMIN_TOKEN` y `dynamicToken` en el componente (16 ocurrencias) para usar la constante global definida al inicio.

**Antes** (❌):

```jsx
const handleSave = async () => {
  try {
    const ADMIN_TOKEN = localStorage.getItem("adminToken");  // Redefinición innecesaria
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
  }
}
```

**Después** (✅):

```jsx
const handleSave = async () => {
  try {
    // Usa el ADMIN_TOKEN definido al inicio del componente
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
  }
}
```

---

## Archivos Modificados

| Archivo                            | Cambios                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `src/components/AdminReservas.jsx` | Importar `useAuth`, usar `accessToken`, eliminar 16 redefiniciones de token |

---

## Beneficios

### ✅ **Compatibilidad con Sistema Moderno**

- Usa el token del `AuthContext` automáticamente
- Se beneficia de la renovación automática de tokens (refresh)
- Sigue las mejores prácticas del sistema de autenticación

### ✅ **Backward Compatibility**

- Mantiene compatibilidad con `adminToken` (legacy)
- Mantiene compatibilidad con variable de entorno `VITE_ADMIN_TOKEN`
- No rompe instalaciones existentes

### ✅ **Código Limpio**

- Una sola definición de `ADMIN_TOKEN`
- No hay redefiniciones innecesarias
- Más fácil de mantener

### ✅ **Flujo de Autenticación Completo**

```
Usuario hace Login
  → AuthContext guarda accessToken
  → AdminReservas obtiene accessToken vía useAuth()
  → ADMIN_TOKEN usa accessToken
  → Todas las peticiones HTTP funcionan ✅
```

---

## Prioridad de Tokens

El sistema ahora prioriza tokens en este orden:

1. **`accessToken` del AuthContext** (sistema moderno JWT) ⭐
2. **`VITE_ADMIN_TOKEN`** (variable de entorno)
3. **`localStorage.getItem("adminToken")`** (legacy)
4. **`localStorage.getItem("adminAccessToken")`** (compatibilidad)

---

## Componentes Actualizados vs Pendientes

### ✅ Componentes con Sistema Moderno

- `AdminUsuarios.jsx`
- `AdminDashboard.jsx`
- `AdminPerfil.jsx`
- `LoginAdmin.jsx`
- **`AdminReservas.jsx`** ← Actualizado en esta corrección

### ⚠️ Componentes que AÚN usan Sistema Legacy

Estos componentes todavía acceden directamente a `localStorage.getItem("adminToken")`:

- `AdminVehiculos.jsx`
- `AdminProductos.jsx`
- `AdminPricing.jsx`
- `AdminGastos.jsx`
- `AdminEstadisticas.jsx`
- `AdminConductores.jsx`

**Recomendación**: Migrar estos componentes al sistema moderno en el futuro para mantener consistencia.

---

## Testing

### Verificar que Funciona

1. Hacer login en `/admin/login`
2. Ir a panel de reservas
3. Intentar editar una reserva
4. ✅ **Ahora funciona** sin pedir token adicional

### Verificar Compatibilidad Backward

Si alguien tiene el sistema antiguo:

```javascript
// Esto seguirá funcionando
localStorage.setItem("adminToken", "mi-token-legacy");
```

---

## Problemas Solucionados

| Problema                         | Causa                                                                         | Solución                            |
| -------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| "No puedo editar reservas"       | Buscaba `adminToken` en localStorage, pero el login guarda `adminAccessToken` | Usar `accessToken` del AuthContext  |
| Múltiples definiciones de token  | 16 redefiniciones locales innecesarias                                        | Una sola definición global          |
| Inconsistencia entre componentes | Unos usan AuthContext, otros localStorage                                     | AdminReservas ahora usa AuthContext |

---

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                     Login Admin                             │
│  (usuario/contraseña)                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│             Backend /api/auth/login                         │
│  - Valida credenciales                                      │
│  - Genera accessToken (8h) y refreshToken (7d)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               AuthContext guarda:                           │
│  - localStorage.setItem("adminAccessToken", token)          │
│  - localStorage.setItem("adminRefreshToken", refresh)       │
│  - setAccessToken(token) ← en estado React                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         AdminReservas usa useAuth()                         │
│  const { accessToken } = useAuth();                         │
│  const ADMIN_TOKEN = accessToken || fallbacks...            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│    Todas las peticiones HTTP incluyen:                      │
│    Authorization: Bearer ${ADMIN_TOKEN}                     │
│    ✅ Funciona correctamente                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Notas Técnicas

### AuthContext.jsx

- Guarda tokens en `localStorage` con claves específicas
- Renueva automáticamente el `accessToken` cuando expira
- Maneja logout limpiando todos los tokens

### Compatibilidad con Backend

El backend acepta tokens en header `Authorization: Bearer <token>`:

```javascript
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${ADMIN_TOKEN}`
}
```

Esto funciona tanto con el token moderno (JWT) como con el legacy.

---

## Próximos Pasos Recomendados

1. ✅ **AdminReservas** migrado (este commit)
2. ⏳ Migrar `AdminVehiculos.jsx` al sistema moderno
3. ⏳ Migrar `AdminProductos.jsx` al sistema moderno
4. ⏳ Migrar `AdminPricing.jsx` al sistema moderno
5. ⏳ Migrar `AdminGastos.jsx` al sistema moderno
6. ⏳ Migrar `AdminEstadisticas.jsx` al sistema moderno
7. ⏳ Migrar `AdminConductores.jsx` al sistema moderno

---

**Fecha**: Enero 2025  
**Autor**: Corrección del sistema de autenticación  
**Impacto**: Alto - Permite editar reservas después del login  
**Breaking Changes**: Ninguno (mantiene compatibilidad backward)
