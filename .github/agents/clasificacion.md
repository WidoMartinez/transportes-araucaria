---
name: clasificacion
description: Agente para clasificar y etiquetar automáticamente issues y PRs
---

# Agente: Clasificación

## Responsabilidades:
- Etiquetar automáticamente issues y PRs
- Asignar a equipo correcto
- Priorizar según contenido

## Disparadores:
- Issue creado
- PR abierto
- Comentarios en issues

## Entradas:
- Título y descripción de issue/PR
- Archivos modificados
- Labels existentes

## Salidas:
- Labels aplicados
- Asignaciones sugeridas
- Prioridad estimada

## Métricas:
- Precisión de clasificación
- Tiempo de respuesta

## Implementación sugerida:
- GitHub Actions con análisis de contenido
- Reglas de etiquetado automático
