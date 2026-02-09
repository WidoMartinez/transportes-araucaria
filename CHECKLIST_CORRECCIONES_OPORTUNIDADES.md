# ✅ CHECKLIST DE CORRECCIONES - Sistema de Oportunidades

## 🔴 ALTA PRIORIDAD (CRÍTICAS - Antes de producción)

### 1. Arreglar generación de código único
- [ ] **Archivo**: `backend/routes/oportunidades.js` línea 11-17
- [ ] Cambiar de `random 0-999` a timestamp + random base36
- [ ] Agregar verificación de unicidad con retry
- [ ] Actualizar tests si existen
- **Estimación**: 30 minutos
- **Impacto**: 🔴 Alto - Puede causar errores de BD en producción

### 2. Mover asociaciones dentro de setupAssociations()
- [ ] **Archivo**: `backend/models/associations.js` línea 170-193
- [ ] Mover import de Oportunidad al inicio del archivo
- [ ] Mover todo el código de asociaciones dentro de la función
- [ ] Verificar que no haya errores de inicialización
- [ ] Probar creación de oportunidades y reservas
- **Estimación**: 15 minutos
- **Impacto**: 🔴 Alto - Puede causar errores de inicialización

### 3. Corregir manejo de JSON en suscripciones
- [ ] **Archivo**: `backend/routes/oportunidades.js` línea 253, 262, 274
- [ ] Eliminar `JSON.stringify(rutas)` en update (línea 253)
- [ ] Eliminar `JSON.stringify(rutas)` en create (línea 262)
- [ ] Eliminar `JSON.parse(suscripcion.rutas)` en response (línea 274)
- [ ] Probar crear y actualizar suscripciones
- **Estimación**: 10 minutos
- **Impacto**: 🔴 Medio-Alto - Puede causar datos corruptos

### 4. Eliminar duplicación de codigoOportunidad
- [ ] **Archivo**: `src/pages/OportunidadesTraslado.jsx` línea 81
- [ ] Eliminar línea duplicada
- [ ] Opcional: Cambiar `window.location.href` por React Router
- **Estimación**: 5 minutos
- **Impacto**: 🟡 Bajo - Solo código redundante

### 5. Agregar validación de entrada
- [ ] **Archivo**: `backend/routes/oportunidades.js` línea 233
- [ ] Instalar zod: `npm install zod`
- [ ] Crear schema de validación para suscripciones
- [ ] Aplicar validación antes de procesar
- [ ] Manejar errores de validación apropiadamente
- **Estimación**: 45 minutos
- **Impacto**: 🔴 Alto - Seguridad

---

## 🟡 MEDIA PRIORIDAD (Implementar en sprint actual)

### 6. Implementar rate limiting
- [ ] **Archivo**: `backend/routes/oportunidades.js`
- [ ] Verificar que existe `middleware/rateLimiter.js`
- [ ] Aplicar limiter a `/api/oportunidades` (30/min)
- [ ] Aplicar limiter estricto a `/api/oportunidades/suscribir` (5/15min)
- [ ] Probar que funciona correctamente
- **Estimación**: 20 minutos
- **Impacto**: 🟡 Medio - Seguridad y rendimiento

### 7. Agregar límite a consultas
- [ ] **Archivo**: `backend/routes/oportunidades.js` línea 191
- [ ] Agregar parámetros `limit` y `offset` a query params
- [ ] Cambiar `findAll` por `findAndCountAll`
- [ ] Agregar paginación a la respuesta
- [ ] Actualizar frontend para manejar paginación (opcional)
- **Estimación**: 30 minutos
- **Impacto**: 🟡 Medio - Rendimiento

### 8. Usar useCallback para cargarOportunidades
- [ ] **Archivo**: `src/pages/OportunidadesTraslado.jsx` línea 35
- [ ] Importar `useCallback` de React
- [ ] Envolver `cargarOportunidades` con useCallback
- [ ] Agregar dependencias correctas
- [ ] Actualizar useEffect para usar la función memoizada
- [ ] Agregar condicional para console.log
- **Estimación**: 20 minutos
- **Impacto**: 🟡 Medio - Corrección de bug potencial

### 9. Mejorar manejo de zonas horarias
- [ ] **Archivo**: `src/components/OportunidadCard.jsx` línea 44
- [ ] Cambiar lógica de `formatFecha`
- [ ] Usar split y crear fecha sin timezone
- [ ] Probar con diferentes fechas
- **Estimación**: 15 minutos
- **Impacto**: 🟡 Medio - UX

### 10. Agregar validaciones de Sequelize
- [ ] **Archivo**: `backend/models/Oportunidad.js`
- [ ] Agregar validación de formato a campo `codigo`
- [ ] Agregar validación de rango a campo `descuento` (0-100)
- [ ] Agregar validación a otros campos críticos
- [ ] Probar que las validaciones funcionan
- **Estimación**: 25 minutos
- **Impacto**: 🟡 Medio - Integridad de datos

---

## 🟢 BAJA PRIORIDAD (Backlog)

### 11. Extraer constantes a configuración
- [ ] Crear `backend/config/oportunidades.js`
- [ ] Mover BASE, descuentos, rutas comunes
- [ ] Actualizar imports en archivos relevantes
- **Estimación**: 30 minutos

### 12. Implementar tests unitarios
- [ ] Instalar Jest o Mocha
- [ ] Tests para `generarCodigoOportunidad`
- [ ] Tests para `detectarYGenerarOportunidades`
- [ ] Tests para componentes React
- **Estimación**: 4 horas

### 13. Agregar caché
- [ ] Implementar Redis o caché en memoria
- [ ] Cachear lista de oportunidades
- [ ] Invalidar caché cuando se crean/actualizan
- **Estimación**: 2 horas

### 14. Mejorar mensajes de error
- [ ] Crear objeto de mensajes de error
- [ ] Internacionalización (opcional)
- [ ] Mensajes más específicos para el usuario
- **Estimación**: 1 hora

### 15. Estandarizar comentarios
- [ ] Revisar todos los comentarios
- [ ] Traducir comentarios en inglés a español
- [ ] Mantener consistencia
- **Estimación**: 30 minutos

---

## 📊 PROGRESO GENERAL

**Alta Prioridad**: ☐☐☐☐☐ 0/5 (0%)
**Media Prioridad**: ☐☐☐☐☐ 0/5 (0%)
**Baja Prioridad**: ☐☐☐☐☐ 0/5 (0%)

**TOTAL**: ☐☐☐☐☐☐☐☐☐☐☐☐☐☐☐ 0/15 (0%)

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Sprint 1 (Esta semana) - CRÍTICO
1. Día 1: Correcciones 1, 2, 3 (1 hora)
2. Día 2: Correcciones 4, 5 (1 hora)
3. Día 3: Testing y validación

### Sprint 2 (Próxima semana) - IMPORTANTE
4. Día 1: Correcciones 6, 7 (1 hora)
5. Día 2: Correcciones 8, 9, 10 (1.5 horas)
6. Día 3: Testing completo

### Backlog (Futuro)
- Implementar según prioridad de negocio
- Revisar en retrospectiva

---

## 📝 NOTAS

- Cada corrección debe incluir pruebas manuales
- Documentar cambios en CHANGELOG
- Actualizar documentación técnica si es necesario
- Hacer commit por cada corrección con mensaje descriptivo

## ✍️ FIRMA DE REVISIÓN

**Revisado por**: Agente de Calidad de Código
**Fecha**: $(date +"%Y-%m-%d")
**Estado**: Pendiente de correcciones

---

**Última actualización**: Usar `git log CHECKLIST_CORRECCIONES_OPORTUNIDADES.md` para ver historial
