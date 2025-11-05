# Agente: Pruebas Automatizadas (Testing Agent)

Responsabilidades:
- Ejecutar pruebas unitarias, integraciones y E2E.
- Generar reportes y cobertura.

Disparadores:
- Push a rama feature, PR, despliegue a staging.

Entradas:
- Código, fixtures, variables de entorno para tests.

Salidas:
- Resultados de tests, artefactos (logs, cobertura).

Implementación sugerida:
- GitHub Actions con matrix para Node.js.
- Cypress o Playwright para E2E; publicar artefactos de reporte.
