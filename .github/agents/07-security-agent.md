# Agente: Seguridad y Dependencias (Security Agent)

Responsabilidades:
- Escanear dependencias por vulnerabilidades (SCA).
- Revisar commits por secretos accidentalmente subidos.

Disparadores:
- Escaneo programado (semanal) y en cada PR.

Entradas:
- package.json, composer.json, commits.

Salidas:
- Alerts (issues/PRs) con recomendaciones de actualización.
- Lista de secretos detectados y pasos para rotación.

Implementación sugerida:
- Activar Dependabot y GitHub Security Alerts.
- Complementar con acciones de SCA y pre-commit hooks que detecten secretos.
