# Agente: Calidad de Código (Code QA Agent)

Responsabilidades:
- Ejecutar linters y formateadores (ESLint, Prettier).
- Análisis estático y detección de code smells.
- Comentar en PRs las advertencias críticas y sugerencias de refactor.

Disparadores:
- Push a ramas feature.
- PR abierto o actualizado.

Entradas:
- Código fuente (JS, PHP, otros).
- Configuración de linters.

Salidas:
- Comentarios en PR, reporte SARIF, issue si hay fallos críticos.

Métricas:
- Número de advertencias por PR.
- Tiempo medio de corrección.

Implementación sugerida:
- GitHub Actions que ejecuten ESLint/Prettier y suban resultados SARIF.
- Integración con comentarios automáticos en PR.
