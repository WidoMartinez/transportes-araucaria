---
description: Organizar y actualizar la documentación maestra del proyecto
---

# Workflow: Organización de Documentación

Este workflow debe ejecutarse cuando se necesite actualizar o reorganizar la documentación del proyecto.

## Paso 1: Revisar cambios recientes

Antes de actualizar la documentación, revisar:
- Commits recientes en el repositorio
- Issues cerrados o PRs mergeados
- Conversaciones del agente sobre problemas resueltos
- Nuevas funcionalidades implementadas

## Paso 2: Consolidar documentación fragmentada (CRÍTICO)

**Propósito**: Evitar proliferación de archivos `.md` innecesarios en el repositorio.

### 2.1 Buscar documentación fragmentada

Ejecutar búsqueda de archivos markdown en el repositorio:

```bash
# Buscar todos los archivos .md excluyendo node_modules y .git
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/docs/legacy/*"
```

O usar herramientas del IDE para listar archivos `.md` en:
- Raíz del proyecto
- Carpetas `docs/`, `backend/`, `src/`
- Cualquier subcarpeta del proyecto

### 2.2 Identificar documentos a consolidar

Para cada archivo `.md` encontrado (excepto los oficiales), determinar:

**Documentos oficiales (NO tocar)**:
- `README.md`
- `DOCUMENTACION_MAESTRA.md`
- `GUIA_SOLUCION_PROBLEMAS.md`
- `GUIA_USUARIO.md`
- `.agent/GUIA_AGENTE.md`
- `.agent/workflows/*.md`
- `docs/legacy/*` (archivos ya archivados)

**Documentos a revisar** (cualquier otro `.md`):
- Archivos de documentación técnica
- Guías específicas de features
- Logs de cambios
- Documentación de arquitectura antigua
- READMEs de subcarpetas

### 2.3 Consolidar información

Para cada documento a revisar:

1. **Leer el contenido completo**
2. **Determinar destino**:
   - ¿Es información técnica/arquitectónica? → `DOCUMENTACION_MAESTRA.md`
   - ¿Es solución a un problema? → `GUIA_SOLUCION_PROBLEMAS.md`
   - ¿Es información obsoleta/histórica? → Mover a `docs/legacy/`
   - ¿Es información duplicada? → Eliminar
3. **Extraer información valiosa**:
   - Copiar secciones relevantes al documento oficial correspondiente
   - Adaptar formato al estilo del documento maestro
   - Actualizar referencias y links
4. **Archivar o eliminar**:
   - Si tiene valor histórico: `git mv archivo.md docs/legacy/`
   - Si está duplicado/obsoleto: `git rm archivo.md`

### 2.4 Ejemplos de consolidación

**Ejemplo 1**: Encontrado `INTEGRACION_EMAILS_PHP.md`
```
1. Leer contenido
2. Información técnica sobre emails → DOCUMENTACION_MAESTRA.md Sección 5.3
3. Consolidar en sección existente
4. Mover a legacy: git mv INTEGRACION_EMAILS_PHP.md docs/legacy/
```

**Ejemplo 2**: Encontrado `PROBLEMA_BACKEND_500.md`
```
1. Leer contenido
2. Solución a problema → GUIA_SOLUCION_PROBLEMAS.md
3. Ya existe Sección 1 sobre este tema → Actualizar sección existente
4. Eliminar: git rm PROBLEMA_BACKEND_500.md
```

**Ejemplo 3**: Encontrado `NUEVA_FEATURE_X.md`
```
1. Leer contenido
2. Documentación de feature → DOCUMENTACION_MAESTRA.md Sección 5
3. Agregar nueva subsección 5.X
4. Eliminar: git rm NUEVA_FEATURE_X.md
```

### 2.5 Verificar consolidación

Después de consolidar:
- [ ] No hay archivos `.md` duplicados en el repositorio (excepto oficiales)
- [ ] Toda información valiosa está en documentos maestros
- [ ] Archivos históricos movidos a `docs/legacy/`
- [ ] Referencias actualizadas en documentos maestros

## Paso 3: Identificar qué documentar

Determinar si el cambio corresponde a:

**DOCUMENTACION_MAESTRA.md** (Funcionalidades y arquitectura):
- Nuevas funcionalidades del sistema
- Cambios en la arquitectura
- Modificaciones en flujos de usuario
- Actualizaciones de tecnologías o dependencias
- Nuevos endpoints o APIs
- Cambios en modelos de datos

**GUIA_SOLUCION_PROBLEMAS.md** (Troubleshooting):
- Errores recurrentes y sus soluciones
- Problemas de configuración
- Issues de despliegue
- Bugs corregidos que podrían reaparecer
- Problemas de integración con servicios externos

## Paso 4: Actualizar DOCUMENTACION_MAESTRA.md

Si hay cambios funcionales o arquitectónicos:

1. Abrir `DOCUMENTACION_MAESTRA.md`
2. Localizar la sección correspondiente según el índice
3. Agregar o actualizar la información:
   - Usar formato markdown consistente
   - Incluir ejemplos de código cuando sea relevante
   - Agregar diagramas mermaid si ayuda a la comprensión
   - Referenciar archivos con rutas absolutas
   - Actualizar la fecha en el encabezado
4. Si es una funcionalidad nueva mayor, considerar agregar una nueva subsección en el índice

**Secciones principales:**
- Sección 1-4: Información general y guías de usuario
- Sección 5: Sistemas técnicos detallados (aquí va la mayoría de cambios técnicos)
- Sección 6-8: Mantenimiento y referencias

## Paso 5: Actualizar GUIA_SOLUCION_PROBLEMAS.md

Si se resolvió un problema o error:

1. Abrir `GUIA_SOLUCION_PROBLEMAS.md`
2. Determinar si el problema ya está documentado:
   - **Si existe**: Actualizar la solución con nueva información
   - **Si es nuevo**: Agregar nueva sección numerada
3. Usar el formato estándar:
   ```markdown
   ## N. [Título del Problema]
   
   ### Problema
   [Descripción clara del síntoma]
   
   ### Causa
   [Explicación de la causa raíz]
   
   ### Solución
   [Pasos específicos para resolver]
   
   **Archivos modificados**:
   - `ruta/archivo.js` (líneas X-Y)
   ```
4. Incluir comandos, código o queries SQL cuando sea aplicable
5. Referenciar la documentación maestra si hay información relacionada

## Paso 6: Verificar consistencia

Después de actualizar:

1. **Revisar referencias cruzadas**: 
   - Los enlaces entre documentos deben funcionar
   - Las referencias a archivos deben usar rutas correctas
   
2. **Verificar formato**:
   - Código en bloques con sintaxis correcta
   - Listas numeradas/con viñetas consistentes
   - Encabezados con jerarquía correcta
   
3. **Actualizar metadatos**:
   - Fecha de última actualización
   - Versión del documento (si aplica)

## Paso 7: Commit de cambios

// turbo
```bash
git add DOCUMENTACION_MAESTRA.md GUIA_SOLUCION_PROBLEMAS.md
git commit -m "docs: actualizar documentación [descripción breve del cambio]"
```

Si se consolidaron archivos, incluir en el commit:
```bash
git add DOCUMENTACION_MAESTRA.md GUIA_SOLUCION_PROBLEMAS.md docs/legacy/
git commit -m "docs: consolidar documentación fragmentada en documentos maestros"
```

## Notas Importantes

- **No crear documentos nuevos** a menos que sea absolutamente necesario
- **Consolidar información**: Si hay múltiples documentos sobre el mismo tema, consolidar en los documentos maestros
- **Eliminar redundancia**: Si la información está duplicada, mantener solo una versión en el lugar más apropiado
- **Documentar para el futuro**: Escribir pensando en que el agente o un desarrollador nuevo necesitará entender el problema sin contexto previo

## Cuándo ejecutar este workflow

- Después de resolver un bug complejo
- Al implementar una nueva funcionalidad mayor
- Al modificar la arquitectura del sistema
- Cuando se detecte que la documentación está desactualizada
- Antes de cerrar un issue importante
- Al finalizar un sprint o milestone
