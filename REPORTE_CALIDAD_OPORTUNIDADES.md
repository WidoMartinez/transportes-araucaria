# 🔍 REPORTE DE REVISIÓN DE CALIDAD - Sistema de Oportunidades de Traslado

## 📋 Resumen Ejecutivo
- **Archivos Revisados**: 11 archivos (5 backend, 3 frontend, 3 modificados)
- **Fecha de Revisión**: $(date)
- **Revisado por**: Agente de Calidad de Código

---

## ✅ PUNTOS POSITIVOS

### 1. **Estructura y Organización**
- ✅ Separación clara de responsabilidades (modelos, rutas, migraciones)
- ✅ Convenciones de nombres consistentes en español
- ✅ Uso correcto de ES6 modules (import/export)
- ✅ Documentación JSDoc en componentes frontend

### 2. **Modelos Sequelize**
- ✅ Definiciones de modelos bien estructuradas
- ✅ Uso apropiado de DataTypes
- ✅ Campos comentados para claridad
- ✅ Índices apropiados definidos en migraciones
- ✅ Uso correcto de `field` para mapear camelCase a snake_case

### 3. **Migraciones**
- ✅ Verificación de existencia de tablas antes de crear
- ✅ Uso de índices para optimizar consultas
- ✅ Comentarios descriptivos en tablas
- ✅ Manejo de errores con try-catch

### 4. **Frontend - React**
- ✅ Uso de hooks modernos (useState, useEffect)
- ✅ Componentes funcionales bien estructurados
- ✅ Separación de componentes (OportunidadCard, SuscripcionOportunidades)
- ✅ Interfaz de usuario intuitiva y responsive

---

## ⚠️ PROBLEMAS CRÍTICOS

### 1. **Backend - oportunidades.js**

#### 🔴 CRÍTICO: Dependencia circular en useEffect (línea 60-62)
```javascript
useEffect(() => {
  cargarOportunidades();
}, [filtros]);
```
**Problema**: La función `cargarOportunidades` usa `filtros` pero no está en las dependencias. Esto puede causar valores obsoletos (stale closure).

**Recomendación**:
```javascript
useEffect(() => {
  cargarOportunidades();
}, [filtros]); // Y asegurar que cargarOportunidades esté memoizada o definida dentro del useEffect
```

#### 🔴 CRÍTICO: Doble asignación de codigoOportunidad (líneas 80-82 OportunidadesTraslado.jsx)
```javascript
datosReserva.codigoOportunidad = oportunidad.id;  // línea 78
// ...
datosReserva.codigoOportunidad = oportunidad.id;  // línea 81 DUPLICADO
```
**Problema**: Código duplicado innecesario.

#### 🔴 CRÍTICO: Generación de código no único (línea 11-17 oportunidades.js)
```javascript
const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
return `OP-${year}${month}${day}-${random}`;
```
**Problema**: Con solo 1000 posibilidades por día, existe alta probabilidad de colisión. El campo es UNIQUE en BD, causará errores.

**Recomendación**: 
```javascript
const timestamp = Date.now().toString(36);
const random = Math.random().toString(36).substring(2, 9);
return `OP-${year}${month}${day}-${timestamp}${random}`.toUpperCase();
```

#### 🟡 MODERADO: Falta validación de entrada (línea 233-285)
```javascript
const { email, nombre, rutas, descuentoMinimo } = req.body;
```
**Problema**: No valida formato de email, no valida estructura de rutas.

**Recomendación**: Agregar validación con librería como `joi` o `zod`.

#### 🟡 MODERADO: Conversión JSON inconsistente (línea 253, 263, 274)
```javascript
rutas: JSON.stringify(rutas), // línea 253
// vs
rutas: JSON.parse(suscripcion.rutas), // línea 274
```
**Problema**: Sequelize con DataTypes.JSON hace stringify/parse automático. Esto puede causar doble stringify.

**Recomendación**: Eliminar JSON.stringify/parse manual:
```javascript
rutas: rutas, // Sequelize lo maneja automáticamente
```

#### 🟡 MODERADO: Cálculo de horas puede dar valores negativos (línea 104-106)
```javascript
fechaHora.setHours(parseInt(horas) - 2, parseInt(minutos));
horaAproximada = `${String(fechaHora.getHours()).padStart(2, "0")}:...`;
```
**Problema**: Si la hora es 01:00, restar 2 horas da 23:00 del día anterior, pero no se ajusta la fecha.

**Recomendación**: Usar biblioteca como `date-fns` o validar el resultado.

### 2. **Frontend - OportunidadesTraslado.jsx**

#### 🟡 MODERADO: Dependencias faltantes en useEffect (línea 64-70)
```javascript
useEffect(() => {
  const intervalId = setInterval(() => {
    console.log("Actualizando oportunidades automáticamente...");
    cargarOportunidades();
  }, 120000);
  return () => clearInterval(intervalId);
}, [filtros]);
```
**Problema**: `cargarOportunidades` no está en las dependencias. Si la función se redefine, el intervalo usará la versión antigua.

**Recomendación**: Usar `useCallback` para `cargarOportunidades`.

#### 🟡 MODERADO: console.log en producción (línea 66)
```javascript
console.log("Actualizando oportunidades automáticamente...");
```
**Problema**: Logs innecesarios en producción.

**Recomendación**: Usar condicional `if (process.env.NODE_ENV === 'development')` o eliminar.

#### 🟢 MENOR: Formato de fecha inconsistente (línea 240)
```javascript
min={new Date().toISOString().split("T")[0]}
```
**Problema**: Funciona pero es poco elegante.

**Recomendación**: Usar una función helper o `date-fns`.

### 3. **Frontend - OportunidadCard.jsx**

#### 🟡 MODERADO: Zona horaria en formatFecha (línea 44)
```javascript
return new Date(fecha + "T00:00:00").toLocaleDateString("es-CL", opciones);
```
**Problema**: Agregar "T00:00:00" puede causar problemas de zona horaria. La fecha puede mostrarse un día antes/después según la zona.

**Recomendación**:
```javascript
const [year, month, day] = fecha.split('-');
return new Date(year, month - 1, day).toLocaleDateString("es-CL", opciones);
```

### 4. **Backend - associations.js**

#### 🟡 MODERADO: Asociaciones fuera de función (línea 170-194)
```javascript
// Código de asociaciones después de export default
import Oportunidad from "./Oportunidad.js";

Reserva.hasMany(Oportunidad, {
  foreignKey: "reservaRelacionadaId",
  ...
```
**Problema**: Este código está fuera de la función `setupAssociations()`, se ejecutará al importar el módulo, no cuando se llame la función. Puede causar problemas de orden de inicialización.

**Recomendación**: Mover este código dentro de `setupAssociations()`.

---

## 🔧 PROBLEMAS DE MANTENIBILIDAD

### 1. **Números mágicos**
- Línea 62 oportunidades.js: `const descuento = 50;` - Debería ser configurable
- Línea 119 oportunidades.js: `const descuento = 50;` - Mismo descuento hardcodeado
- Línea 68 OportunidadesTraslado.jsx: `120000` (2 minutos) - Usar constante
- Línea 254 SuscripcionOportunidades.jsx: `descuentoMinimo || 40` - Valor por defecto hardcodeado

### 2. **Constantes duplicadas**
- BASE = "Temuco" (línea 85 oportunidades.js) - Debería estar en config
- Rutas comunes (línea 26-35 SuscripcionOportunidades.jsx) - Deberían venir de API

### 3. **Falta de manejo de errores específico**
- No se diferencian errores de red vs errores de validación
- Mensajes de error genéricos para el usuario

---

## 🎯 MEJORAS DE CALIDAD

### 1. **Uso de Sequelize**

#### ✅ CORRECTO:
- Uso de Op.gt, Op.lt para operadores
- Uso de include para eager loading
- Timestamps automáticos configurados

#### ⚠️ MEJORABLE:
- No usa transacciones para operaciones críticas
- No usa validaciones de Sequelize (validate)
- No usa hooks (beforeCreate, afterUpdate)

**Ejemplo de mejora**:
```javascript
// En modelo Oportunidad.js
codigo: {
  type: DataTypes.STRING(50),
  allowNull: false,
  unique: true,
  validate: {
    is: /^OP-\d{8}-[A-Z0-9]+$/i  // Validar formato
  }
}
```

### 2. **Seguridad**

#### 🔴 SQL Injection: Mitigado ✅
- Uso correcto de Sequelize (no raw queries con interpolación)

#### 🟡 XSS: Parcialmente mitigado
- React escapa por defecto, pero el campo `motivoDescuento` se muestra sin sanitizar

#### 🟡 Rate Limiting: No implementado
- Las rutas públicas (/api/oportunidades, /api/oportunidades/suscribir) no tienen rate limiting

**Recomendación**:
```javascript
import { apiLimiter } from "./middleware/rateLimiter.js";
app.get("/api/oportunidades", apiLimiter, async (req, res) => {
```

### 3. **Rendimiento**

#### ✅ BIEN:
- Índices en campos de búsqueda
- Paginación implícita (aunque no explícita)
- Actualización automática cada 2 minutos (no polling agresivo)

#### ⚠️ MEJORABLE:
- No hay caché de oportunidades
- Query de estadísticas puede ser pesada (línea 426-494)
- No hay límite en findAll (puede devolver miles de registros)

**Recomendación**:
```javascript
const oportunidades = await Oportunidad.findAll({
  where,
  order: [["fecha", "ASC"], ["horaAproximada", "ASC"]],
  limit: 50, // Agregar límite
  ...
});
```

---

## 📊 CONSISTENCIA DE ESTILOS

### ✅ CONSISTENTE:
- Indentación (2 espacios)
- Comillas (dobles en JSX, simples en JS)
- Nombres de variables en camelCase
- Nombres de archivos en PascalCase (componentes) o camelCase (utils)

### ⚠️ INCONSISTENTE:
- Algunos comentarios en inglés, otros en español
- Uso mixto de function declarations y arrow functions
- Algunos archivos con líneas de 100+ caracteres

---

## 🐛 BUGS POTENCIALES

### 1. **Race Condition en actualización de estado**
Línea 72-86 OportunidadesTraslado.jsx:
```javascript
const handleReservar = (oportunidad) => {
  const datosReserva = { ... };
  datosReserva.codigoOportunidad = oportunidad.id;
  datosReserva.codigoOportunidad = oportunidad.id; // DUPLICADO
  localStorage.setItem("datosOportunidad", JSON.stringify(datosReserva));
  window.location.href = "/";
};
```
**Problema**: Usa `window.location.href` en lugar de navegación React Router.

### 2. **Timezone Issues**
Las fechas se manejan sin considerar timezone explícitamente. Puede causar:
- Oportunidades que expiran 1 hora antes/después
- Fechas que se muestran con 1 día de diferencia

### 3. **Memory Leak Potencial**
Línea 64-70 OportunidadesTraslado.jsx: El intervalo se limpia correctamente ✅

---

## 📈 MÉTRICAS DE CALIDAD

| Métrica | Valor | Estado |
|---------|-------|--------|
| Complejidad Ciclomática | Media | ⚠️ |
| Cobertura de Tests | 0% | 🔴 |
| Duplicación de Código | Baja | ✅ |
| Deuda Técnica | Media | ⚠️ |
| Documentación | Básica | ⚠️ |

---

## 🎯 RECOMENDACIONES PRIORITARIAS

### 🔴 ALTA PRIORIDAD (Implementar antes de producción):
1. Arreglar generación de código único (colisiones)
2. Mover asociaciones dentro de setupAssociations()
3. Corregir manejo de JSON en suscripciones
4. Eliminar duplicación de codigoOportunidad
5. Agregar validación de entrada en endpoints públicos

### 🟡 MEDIA PRIORIDAD (Implementar en sprint actual):
6. Implementar rate limiting en endpoints públicos
7. Agregar límite a consultas findAll
8. Usar useCallback para cargarOportunidades
9. Mejorar manejo de zonas horarias
10. Agregar validaciones de Sequelize

### 🟢 BAJA PRIORIDAD (Backlog):
11. Extraer constantes a archivo de configuración
12. Implementar tests unitarios
13. Agregar caché para oportunidades
14. Mejorar mensajes de error
15. Estandarizar comentarios en español

---

## 📝 CONCLUSIÓN

El código es **funcional y bien estructurado**, pero tiene varios puntos críticos que deben ser corregidos antes de producción, especialmente:
- La generación de códigos únicos
- Las asociaciones de Sequelize fuera de la función setup
- La duplicación de código
- La falta de validaciones

**Calificación General**: 7.5/10 ⚠️

**Estado**: REQUIERE CORRECCIONES ANTES DE MERGE


---

## 📋 ANEXO: EJEMPLOS DE CÓDIGO PARA CORRECCIONES

### 1. Arreglar generación de código único

**Archivo**: `backend/routes/oportunidades.js` línea 11-17

**Código actual (PROBLEMÁTICO)**:
```javascript
const generarCodigoOportunidad = () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `OP-${year}${month}${day}-${random}`;
};
```

**Código propuesto (SOLUCIÓN)**:
```javascript
const generarCodigoOportunidad = async () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  
  // Generar código único con timestamp y random
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const codigo = `OP-${year}${month}${day}-${timestamp}${random}`;
  
  // Verificar que no exista (por seguridad extra)
  const existe = await Oportunidad.findOne({ where: { codigo } });
  if (existe) {
    // Recursión en caso extremo de colisión
    return generarCodigoOportunidad();
  }
  
  return codigo;
};
```

---

### 2. Mover asociaciones dentro de setupAssociations()

**Archivo**: `backend/models/associations.js` línea 170-193

**Código actual (PROBLEMÁTICO)**:
```javascript
export default setupAssociations;

// Importar modelos de oportunidades
import Oportunidad from "./Oportunidad.js";

// Relación: Reserva -> Oportunidades generadas
Reserva.hasMany(Oportunidad, {
  foreignKey: "reservaRelacionadaId",
  as: "oportunidadesGeneradas",
});
// ... más asociaciones
```

**Código propuesto (SOLUCIÓN)**:
```javascript
// Importar modelos de oportunidades al inicio del archivo (línea 16)
import Oportunidad from "./Oportunidad.js";
import SuscripcionOportunidad from "./SuscripcionOportunidad.js";

// Función para establecer todas las asociaciones
export const setupAssociations = () => {
  // ... asociaciones existentes ...
  
  // Relación: Reserva -> Oportunidades generadas (Una reserva puede generar varias oportunidades)
  Reserva.hasMany(Oportunidad, {
    foreignKey: "reservaRelacionadaId",
    as: "oportunidadesGeneradas",
  });
  
  Oportunidad.belongsTo(Reserva, {
    foreignKey: "reservaRelacionadaId",
    as: "reservaRelacionada",
  });
  
  // Relación: Reserva -> Oportunidad aprovechada
  Reserva.hasOne(Oportunidad, {
    foreignKey: "reservaAprovechadaId",
    as: "oportunidadAprovechada",
  });
  
  Oportunidad.belongsTo(Reserva, {
    foreignKey: "reservaAprovechadaId",
    as: "reservaAprovechada",
  });
  
  console.log("✅ Asociaciones de modelos establecidas correctamente");
};

export default setupAssociations;
```

---

### 3. Corregir manejo de JSON en suscripciones

**Archivo**: `backend/routes/oportunidades.js` línea 244-276

**Código actual (PROBLEMÁTICO)**:
```javascript
// Actualizar suscripción existente
await suscripcion.update({
  nombre,
  rutas: JSON.stringify(rutas),  // ❌ DOBLE STRINGIFY
  descuentoMinimo: descuentoMinimo || 40,
  activa: true,
});
// ...
res.json({
  success: true,
  message: "Suscripción creada exitosamente",
  suscripcion: {
    email: suscripcion.email,
    nombre: suscripcion.nombre,
    rutas: JSON.parse(suscripcion.rutas),  // ❌ DOBLE PARSE
    descuentoMinimo: suscripcion.descuentoMinimo,
  },
});
```

**Código propuesto (SOLUCIÓN)**:
```javascript
// Actualizar suscripción existente
await suscripcion.update({
  nombre,
  rutas,  // ✅ Sequelize maneja automáticamente DataTypes.JSON
  descuentoMinimo: descuentoMinimo || 40,
  activa: true,
});
// ...
res.json({
  success: true,
  message: "Suscripción creada exitosamente",
  suscripcion: {
    email: suscripcion.email,
    nombre: suscripcion.nombre,
    rutas: suscripcion.rutas,  // ✅ Ya es un objeto JS
    descuentoMinimo: suscripcion.descuentoMinimo,
  },
});
```

---

### 4. Eliminar duplicación y usar React Router

**Archivo**: `src/pages/OportunidadesTraslado.jsx` línea 72-86

**Código actual (PROBLEMÁTICO)**:
```javascript
const handleReservar = (oportunidad) => {
  const datosReserva = {
    origen: oportunidad.origen,
    destino: oportunidad.destino,
    fecha: oportunidad.fecha,
    hora: oportunidad.horaAproximada,
    codigoOportunidad: oportunidad.id,
  };
  // Agregar un identificador de oportunidad para tracking
  datosReserva.codigoOportunidad = oportunidad.id;  // ❌ DUPLICADO
  localStorage.setItem("datosOportunidad", JSON.stringify(datosReserva));
  
  // Redirigir a la página principal con el formulario
  window.location.href = "/";  // ❌ Recarga completa
};
```

**Código propuesto (SOLUCIÓN)**:
```javascript
import { useNavigate } from "react-router-dom";

function OportunidadesTraslado() {
  const navigate = useNavigate();
  // ... resto del código ...
  
  const handleReservar = (oportunidad) => {
    const datosReserva = {
      origen: oportunidad.origen,
      destino: oportunidad.destino,
      fecha: oportunidad.fecha,
      hora: oportunidad.horaAproximada,
      codigoOportunidad: oportunidad.id,  // ✅ Una sola vez
    };
    
    localStorage.setItem("datosOportunidad", JSON.stringify(datosReserva));
    
    // ✅ Usar React Router (sin recarga)
    navigate("/", { 
      state: { fromOportunidad: true }
    });
  };
  // ...
}
```

---

### 5. Agregar validación de entrada

**Archivo**: `backend/routes/oportunidades.js` línea 233-242

**Código actual (SIN VALIDACIÓN)**:
```javascript
app.post("/api/oportunidades/suscribir", async (req, res) => {
  try {
    const { email, nombre, rutas, descuentoMinimo } = req.body;
    
    if (!email || !rutas || !Array.isArray(rutas) || rutas.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Email y rutas son requeridos",
      });
    }
    // ...
```

**Código propuesto (CON VALIDACIÓN)**:
```javascript
// Al inicio del archivo
import { z } from "zod";

const suscripcionSchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().optional(),
  rutas: z.array(
    z.object({
      origen: z.string().min(1, "Origen requerido"),
      destino: z.string().min(1, "Destino requerido"),
    })
  ).min(1, "Debe seleccionar al menos una ruta"),
  descuentoMinimo: z.number().int().min(30).max(70).optional(),
});

app.post("/api/oportunidades/suscribir", async (req, res) => {
  try {
    // Validar entrada
    const validacion = suscripcionSchema.safeParse(req.body);
    
    if (!validacion.success) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        detalles: validacion.error.errors,
      });
    }
    
    const { email, nombre, rutas, descuentoMinimo } = validacion.data;
    // ... resto del código
```

---

### 6. Usar useCallback para evitar stale closures

**Archivo**: `src/pages/OportunidadesTraslado.jsx` línea 35-70

**Código actual (PROBLEMÁTICO)**:
```javascript
const cargarOportunidades = async () => {
  // ... usa filtros
};

useEffect(() => {
  cargarOportunidades();
}, [filtros]);  // ❌ cargarOportunidades no está en dependencias

useEffect(() => {
  const intervalId = setInterval(() => {
    cargarOportunidades();  // ❌ Puede usar versión obsoleta
  }, 120000);
  return () => clearInterval(intervalId);
}, [filtros]);
```

**Código propuesto (SOLUCIÓN)**:
```javascript
import { useState, useEffect, useCallback } from "react";

function OportunidadesTraslado() {
  // ...
  
  const cargarOportunidades = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (filtros.origen) params.append("origen", filtros.origen);
      if (filtros.destino) params.append("destino", filtros.destino);
      if (filtros.fecha) params.append("fecha", filtros.fecha);

      const url = getBackendUrl() + "/api/oportunidades?" + params.toString();
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setOportunidades(data.oportunidades);
      } else {
        setError(data.error || "Error al cargar oportunidades");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error de conexión. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [filtros]);  // ✅ Dependencias correctas

  useEffect(() => {
    cargarOportunidades();
  }, [cargarOportunidades]);  // ✅ Ahora es estable

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log("Actualizando oportunidades automáticamente...");
      }
      cargarOportunidades();  // ✅ Siempre usa la versión actual
    }, 120000);
    return () => clearInterval(intervalId);
  }, [cargarOportunidades]);  // ✅ Dependencia correcta
  // ...
}
```

---

### 7. Agregar rate limiting

**Archivo**: `backend/routes/oportunidades.js` línea 173-230

**Código actual (SIN RATE LIMITING)**:
```javascript
app.get("/api/oportunidades", async (req, res) => {
  // ...
});

app.post("/api/oportunidades/suscribir", async (req, res) => {
  // ...
});
```

**Código propuesto (CON RATE LIMITING)**:
```javascript
import { apiLimiter } from "../middleware/rateLimiter.js";

// Limiter específico para oportunidades (más permisivo)
const oportunidadesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto
  message: "Demasiadas solicitudes, intenta nuevamente en un minuto",
});

app.get("/api/oportunidades", oportunidadesLimiter, async (req, res) => {
  // ...
});

// Limiter más estricto para suscripciones
const suscripcionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 suscripciones por IP cada 15 min
  message: "Demasiadas suscripciones, intenta nuevamente más tarde",
});

app.post("/api/oportunidades/suscribir", suscripcionLimiter, async (req, res) => {
  // ...
});
```

---

### 8. Agregar límite y paginación

**Archivo**: `backend/routes/oportunidades.js` línea 191-201

**Código actual (SIN LÍMITE)**:
```javascript
const oportunidades = await Oportunidad.findAll({
  where,
  order: [["fecha", "ASC"], ["horaAproximada", "ASC"]],
  include: [ /* ... */ ],
});
```

**Código propuesto (CON LÍMITE Y PAGINACIÓN)**:
```javascript
const { origen, destino, fecha, limit = 50, offset = 0 } = req.query;

const where = {
  estado: "disponible",
  validoHasta: { [Op.gt]: new Date() },
};

if (origen) where.origen = origen;
if (destino) where.destino = destino;
if (fecha) where.fecha = fecha;

const { count, rows: oportunidades } = await Oportunidad.findAndCountAll({
  where,
  order: [["fecha", "ASC"], ["horaAproximada", "ASC"]],
  limit: Math.min(parseInt(limit), 100), // Máximo 100
  offset: parseInt(offset),
  include: [
    {
      model: Reserva,
      as: "reservaRelacionada",
      attributes: ["id", "codigoReserva"],
    },
  ],
});

res.json({
  success: true,
  oportunidades: oportunidades.map(/* ... */),
  pagination: {
    total: count,
    limit: parseInt(limit),
    offset: parseInt(offset),
    hasMore: offset + oportunidades.length < count,
  },
});
```

---

## 🔍 HERRAMIENTAS RECOMENDADAS

### Para ejecutar en local:

1. **ESLint** (ya configurado):
```bash
npm run lint
```

2. **Prettier** (para formateo):
```bash
npm install --save-dev prettier
npx prettier --write "src/**/*.{js,jsx}" "backend/**/*.js"
```

3. **Análisis de complejidad**:
```bash
npm install --save-dev complexity-report
npx cr backend/routes/oportunidades.js
```

4. **Detección de vulnerabilidades**:
```bash
npm audit
npm audit fix
```

5. **Chequeo de tipos (opcional)**:
```bash
npm install --save-dev @types/node
npx tsc --checkJs --noEmit backend/**/*.js
```

---

## 📞 CONTACTO Y SEGUIMIENTO

Para cualquier duda o aclaración sobre este reporte, contactar al equipo de Calidad de Código.

**Próxima revisión programada**: Después de implementar las correcciones de ALTA PRIORIDAD.

---

**Generado automáticamente por el Agente de Calidad de Código**
**Fecha**: $(date +"%Y-%m-%d %H:%M:%S")

