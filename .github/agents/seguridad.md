---
name: seguridad
description: Agente para análisis de vulnerabilidades y auditorías de seguridad
---

# Agente: Seguridad

## Responsabilidades:
- Escanear vulnerabilidades
- Auditar dependencias
- Validar prácticas de seguridad

## Disparadores:
- Push con cambios en dependencias
- PR con código sensible
- Actualización de paquetes

## Entradas:
- Código fuente
- Dependencias (package.json, composer.json)
- Configuración de seguridad

## Salidas:
- Reporte de vulnerabilidades
- Alertas de seguridad
- Sugerencias de parches

## Métricas:
- Vulnerabilidades detectadas
- Tiempo de resolución

## Implementación sugerida:
- GitHub Dependabot
- CodeQL analysis
- Snyk o similar
