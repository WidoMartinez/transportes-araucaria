# Agente: Triage de Issues y PRs (Triage Agent)

Responsabilidades:
- Etiquetar y priorizar issues/PRs automáticamente.
- Detectar issues duplicados o incompletos y solicitar info.

Disparadores:
- Creación de issue o PR.
- Comentarios con palabras clave.

Entradas:
- Texto del issue/PR, metadata (autor, archivos cambiados).

Salidas:
- Etiquetas, comentarios solicitando más info, asignaciones iniciales.

Implementación sugerida:
- Probot app o GitHub Actions que use la API para etiquetar y asignar.
- Reglas configurables en .github/triage-rules.yml.
