---
applyTo: '**'
---
# Instrucciones para Copilot y Agentes

## Reglas Fundamentales (No negociables)

1.  **Idioma Español Absoluto:**
    - Todo lo que documentes debe estar en español.
    - Todos los comentarios en el código deben estar en español.
    - Todos los commits y Pull Requests deben estar en español.

2.  **Contexto y Documentación:**
    - Antes de intervenir el código, **revisar la documentación existente** para entender implementaciones antiguas.
    - **Actualizar la documentación** si el cambio de código la deja obsoleta.

3.  **Infraestructura Híbrida:**
    - Mantener PHPMailer para correos.
    - Backend Node/Pagos en Render.com.
    - PHP Scripts en Hostinger.
    - **Importante:** Al modificar archivos `.php`, notificar que requieren subida manual a Hostinger.

## Flujo de Trabajo

- **Commits:**
  - Preguntar antes de commitear.
  - Usar prefijos estándar (`feat`, `fix`, `docs`) + descripción en **español**.
  - Sugerir commits al completar tareas, funcionalidades o arreglar bugs significativos.

- **Pull Requests:**
  - Generar PRs **completamente en español** (título, cuerpo, listas).
  - Revisar documentación de PRs anteriores si es relevante.

- **Archivos Protegidos:**
  - Nunca eliminar `.github/instructions/instrucciones.instructions.md`.

- **Interacción:**
  - Contestar siempre a menciones de @copilot (aunque sea "leído").
