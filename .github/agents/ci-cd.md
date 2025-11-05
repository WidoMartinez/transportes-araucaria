---
name: ci-cd
description: Agente para gestionar pipelines de integración y despliegue continuo
---

# Agente: CI/CD

## Responsabilidades:
- Gestionar pipelines de integración continua
- Automatizar despliegues a Render.com
- Validar builds antes de merge

## Disparadores:
- Push a ramas principales
- Merge de PR
- Tags de versión

## Entradas:
- Código fuente
- Configuración de despliegue

## Salidas:
- Estado de builds
- Logs de despliegue
- Notificaciones de estado

## Métricas:
- Tiempo de build
- Tasa de éxito de despliegues

## Implementación sugerida:
- GitHub Actions para CI/CD
- Integración con Render.com
