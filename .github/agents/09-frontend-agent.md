# Agente: Frontend (Frontend Agent)

Responsabilidades:
- Validar builds del frontend y optimizar assets.
- Ejecutar pruebas de rendimiento y accesibilidad básica.

Disparadores:
- Cambios en carpetas de frontend (src/, public/).

Entradas:
- Código frontend, configuración de build.

Salidas:
- Build validado, reportes de optimización y accesibilidad.

Implementación sugerida:
- Workflow que haga build, bundle-analyze y lighthouse o axe-core checks.
