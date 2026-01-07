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

## Paso 2: Identificar qué documentar

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

## Paso 3: Actualizar DOCUMENTACION_MAESTRA.md

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

## Paso 4: Actualizar GUIA_SOLUCION_PROBLEMAS.md

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

## Paso 5: Verificar consistencia

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

## Paso 6: Commit de cambios

// turbo
```bash
git add DOCUMENTACION_MAESTRA.md GUIA_SOLUCION_PROBLEMAS.md
git commit -m "docs: actualizar documentación [descripción breve del cambio]"
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
