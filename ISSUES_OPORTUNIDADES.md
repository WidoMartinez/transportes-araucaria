# 🐛 Issues del Sistema de Oportunidades de Traslado

## Issue #1: 🔴 CRÍTICO - Generación de códigos no únicos

**Descripción**: El generador de códigos de oportunidad tiene solo 1000 posibilidades por día, lo que genera alta probabilidad de colisión al crecer el sistema.

**Ubicación**: `backend/routes/oportunidades.js:11-17`

**Código problemático**:
```javascript
const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
return `OP-${year}${month}${day}-${random}`;
```

**Impacto**: 🔴 Alto - Errores de BD por violación de constraint UNIQUE

**Etiquetas**: `bug`, `crítico`, `backend`, `oportunidades`

---

## Issue #2: 🔴 CRÍTICO - Asociaciones Sequelize fuera de setupAssociations()

**Descripción**: Las asociaciones de Oportunidad están definidas fuera de la función `setupAssociations()`, ejecutándose al importar el módulo en lugar de cuando se llama la función.

**Ubicación**: `backend/models/associations.js:170-193`

**Impacto**: 🔴 Alto - Problemas de orden de inicialización

**Etiquetas**: `bug`, `crítico`, `backend`, `sequelize`

---

## Issue #3: 🔴 MODERADO - Doble stringify/parse de JSON en suscripciones

**Descripción**: Se hace `JSON.stringify()` y `JSON.parse()` manual cuando Sequelize ya maneja automáticamente los campos `DataTypes.JSON`.

**Ubicación**: `backend/routes/oportunidades.js:253,262,274`

**Impacto**: 🟡 Medio - Datos potencialmente corruptos

**Etiquetas**: `bug`, `backend`, `oportunidades`

---

## Issue #4: 🟡 MODERADO - Falta validación de entrada en endpoints públicos

**Descripción**: Los endpoints `/api/oportunidades/suscribir` y `/api/oportunidades` no validan adecuadamente la entrada del usuario.

**Ubicación**: `backend/routes/oportunidades.js:233-285,175-230`

**Impacto**: 🔴 Alto - Seguridad

**Etiquetas**: `seguridad`, `backend`, `validación`

---

## Issue #5: 🟡 MODERADO - Sin rate limiting en rutas públicas

**Descripción**: Las rutas públicas de oportunidades no tienen rate limiting, permitiendo abuso.

**Ubicación**: `backend/routes/oportunidades.js:175,233`

**Impacto**: 🟡 Medio - Seguridad y rendimiento

**Etiquetas**: `seguridad`, `rendimiento`, `backend`

---

## Issue #6: 🟡 MODERADO - Dependencias faltantes en useEffect

**Descripción**: La función `cargarOportunidades` no está en las dependencias de useEffect, causando stale closures.

**Ubicación**: `src/pages/OportunidadesTraslado.jsx:60-70`

**Impacto**: 🟡 Medio - Bug potencial

**Etiquetas**: `bug`, `frontend`, `react`

---

## Issue #7: 🟡 MODERADO - Sin límite en consultas findAll

**Descripción**: Las consultas a la base de datos no tienen límite, pudiendo devolver miles de registros.

**Ubicación**: `backend/routes/oportunidades.js:191-201`

**Impacto**: 🟡 Medio - Rendimiento

**Etiquetas**: `rendimiento`, `backend`, `optimización`

---

## Issue #8: 🟡 MODERADO - Manejo inconsistente de zonas horarias

**Descripción**: Las fechas se manejan sin considerar timezone explícitamente, causando inconsistencias.

**Ubicación**: `src/components/OportunidadCard.jsx:44`

**Impacto**: 🟡 Medio - UX

**Etiquetas**: `bug`, `frontend`, `ux`

---

## Issue #9: 🟢 MENOR - Código duplicado en handleReservar

**Descripción**: Se asigna `codigoOportunidad` dos veces innecesariamente.

**Ubicación**: `src/pages/OportunidadesTraslado.jsx:78-81`

**Impacto**: 🟢 Bajo - Code smell

**Etiquetas**: `code-quality`, `frontend`

---

## Issue #10: 🟢 MENOR - console.log en producción

**Descripción**: Hay console.log que se ejecutarán en producción.

**Ubicación**: `src/pages/OportunidadesTraslado.jsx:66`

**Impacto**: 🟢 Bajo - Limpieza

**Etiquetas**: `code-quality`, `frontend`

---

## Issue #11: 🟢 MENOR - Números mágicos hardcodeados

**Descripción**: Valores como descuentos (50%), BASE ("Temuco"), intervalos (120000) están hardcodeados.

**Ubicación**: Múltiples archivos

**Impacto**: 🟢 Bajo - Mantenibilidad

**Etiquetas**: `refactor`, `mantenibilidad`

---

## 📊 Estadísticas

- **Total de issues**: 11
- **Críticos**: 3 🔴
- **Moderados**: 5 🟡
- **Menores**: 3 🟢

## 🎯 Roadmap de correcciones

1. **Semana 1**: Issues #1, #2, #3, #4 (críticos y seguridad)
2. **Semana 2**: Issues #5, #6, #7, #8 (rendimiento y UX)
3. **Backlog**: Issues #9, #10, #11 (calidad de código)

