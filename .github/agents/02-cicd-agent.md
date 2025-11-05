# Agente: CI/CD y Despliegue (CI/CD Agent)

Responsabilidades:
- Orquestar builds, tests y despliegues a staging/production (Render).
- Validar artefactos antes de deploy.

Disparadores:
- Merge a main/release.
- Tag de versión.
- Despliegue manual.

Entradas:
- Artefactos de build, resultados de tests.

Salidas:
- Despliegue vía API de Render.
- Notificaciones de estado en PR o canal de comunicación.

Métricas:
- Tiempo de despliegue.
- Tasa de despliegues exitosos.

Implementación sugerida:
- Workflows de GitHub Actions con secrets para Render.
- Canary/staging antes de producción.
