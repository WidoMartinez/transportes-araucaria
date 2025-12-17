# AGENTS.md

## 💡 Propósito

Este documento establece **reglas y convenciones obligatorias** para agentes que colaboren en este repositorio (p. ej., Jules, Copilot). Su objetivo es mantener coherencia técnica, de estilo y de flujo de trabajo, asegurando que el asistente se comporte exactamente como el usuario desea.

---

## 🇪🇸 Idioma y Comunicación (Regla de Oro)

- **TODO debe estar en ESPAÑOL.**
  - Comunicación con el usuario.
  - Comentarios en el código.
  - Documentación.
  - Mensajes de commit y descripciones de Pull Requests.
  - Logs y mensajes de consola.

---

## 📚 Documentación y Contexto Histórico

- **Revisión Previa Obligatoria:** Antes de escribir una sola línea de código, **DEBES revisar la documentación existente** (archivos `.md` en la raíz) para entender las implementaciones antiguas y el contexto histórico. No asumas nada; verifica cómo se hacía antes.
- **Mantenimiento de Documentación:** Si modificas código que tiene documentación asociada, **DEBES actualizar esa documentación en el mismo cambio**. La documentación nunca debe quedar obsoleta.

---

## 📨 Notificaciones e Infraestructura

- **Sistema de notificaciones:** Mantener **PHPMailer**. No reemplazar por otras librerías.
- **Backend:**
  - Node.js/Pagos: **Render.com**.
  - PHP (Scripts auxiliares/Email): **Hostinger**.
- **Alerta de Despliegue Manual (PHP):**
  - Si modificas un archivo `.php`, al finalizar tu turno o mensaje, **DEBES recordar explícitamente al usuario** que esos cambios requieren subida manual al servidor de Hostinger.
  - Además, mantén la regla de agregar el comentario de aviso al inicio del archivo PHP.

---

## ✅ Flujo de trabajo y Commits

- **Formato de Commits:**
  - Usar prefijos estándar en inglés: `feat`, `fix`, `docs`, `chore`, `refactor`.
  - **Descripción OBLIGATORIA en ESPAÑOL.**
  - Ejemplo: `feat: agregar validación de formulario de reservas`
- **Confirmación:** Siempre preguntar antes de hacer commit.
- **Pull Requests (PR):**
  - Deben escribirse **COMPLETAMENTE en ESPAÑOL**.
  - Título, descripción, lista de cambios, impacto y notas de despliegue en español.

---

## 🛡️ Archivos y ámbitos protegidos

- **Nunca eliminar**:
  - `.github/instructions/instrucciones.instructions.md`
  - `.github/copilot-instructions.md`
  - `.agent/customize.yaml`
  - Este archivo `AGENTS.md`

---

## 📝 Estilo de código

- Comentarios claros en español explicando el *por qué*.
- Seguir las guías de estilo del framework (React/Laravel-style PHP).
- Mantener consistencia con el código existente (revisado en el paso de documentación).

---

## 🧰 Resumen para el Agente

Cuando recibas una tarea:
1.  **Lee la documentación** antigua relacionada.
2.  **Planifica** tus cambios.
3.  **Ejecuta** en español.
4.  Si tocaste PHP -> **Alerta** sobre despliegue manual.
5.  Si tocaste lógica documentada -> **Actualiza** el doc correspondiente.
6.  **Commit** en español (`feat: descripción`).
7.  **PR** 100% en español.
