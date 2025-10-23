<!--
Plantilla de Pull Request (PR)
Todo en español. Completa solo lo necesario, mantén la brevedad y la claridad.
-->

## 🧾 Resumen

_Describe brevemente qué cambia y por qué es necesario._

- **Motivación / problema:** <!-- ¿Qué problema resuelve? -->
- **Solución propuesta:** <!-- ¿Qué hiciste? -->
- **Alternativas consideradas (opcional):**

## 🧩 Tipo de cambio

Selecciona uno o más:

- [ ] feat (nueva funcionalidad)
- [ ] fix (corrección de bug)
- [ ] docs (documentación/comentarios)
- [ ] refactor (cambio interno sin alterar comportamiento)
- [ ] test (pruebas)
- [ ] ci (configuración de CI/CD)
- [ ] chore (tareas varias: dependencias, scripts, etc.)

## 🛠️ Detalles técnicos

_Explica decisiones relevantes, estructuras, librerías, trade-offs y consideraciones de diseño._

## ☁️ Infraestructura y servicios

_Menciona impacto si aplica._

- **PHPMailer (notificaciones por correo):** <!-- Sin cambios / Cambios menores / Cambios relevantes -->
- **Render.com (backend y servicios):** <!-- Sin cambios / Cambios menores / Cambios relevantes -->
- **Hostinger (PHP y front-end):** <!-- Sin cambios / Cambios menores / Cambios relevantes -->

## ✅ Checklist de cumplimiento

- [ ] **Documentación y comentarios en español.**
- [ ] **NO se eliminaron archivos protegidos**:
  - `.github/instructions/instrucciones.instructions.md`
  - `.github/copilot-instructions.md`
- [ ] Se mantiene el uso de **PHPMailer** para notificaciones.
- [ ] La arquitectura de **Render.com** se respeta (sin migraciones no autorizadas).
- [ ] Si se modificaron archivos **`.php`**, se agregó al inicio el comentario:
  ```php
  <?php
  // AVISO: Este archivo se despliega manualmente en Hostinger (frontend y PHP en Hostinger).
  // Cualquier cambio local debe subirse manualmente al servidor.
  ```
