# AGENTS.md

## 💡 Propósito

Este documento establece **reglas y convenciones obligatorias** para agentes que colaboren en este repositorio (p. ej., Codex en VS Code). Su objetivo es mantener coherencia técnica, de estilo y de flujo de trabajo.

---

## 🌐 Idioma y documentación

- **Todo lo que se documente debe estar en español.**
- **Todos los comentarios en el código deben estar en español.**
- Mensajes de consola, logs, descripciones de PR, issues y notas técnicas: **en español**.

---

## 📚 Documentación Primero (Documentation First)

- **Consultar antes de actuar**: Antes de realizar cambios o preguntas, verificar si la respuesta existe en:
  - `DOCUMENTACION_MAESTRA.md`: Para arquitectura y guías generales.
  - `GUIA_SOLUCION_PROBLEMAS.md`: Para errores conocidos (500, migraciones, auth).
- **Mantener actualizada**: Si realizas cambios que afecten flujos de trabajo, arquitectura o solución de problemas, **DEBES actualizar** la documentación correspondiente.
- **Documentar cambios técnicos**: Al implementar nuevas funcionalidades, es **OBLIGATORIO** actualizar `DOCUMENTACION_MAESTRA.md` (sección "Sistemas Técnicos Detallados") describiendo la lógica implementada, endpoints creados y decisiones de arquitectura relevantes.
- **Evitar duplicidad**: No crear nuevos archivos de documentación si se puede actualizar uno existente. Centralizar en la Documentación Maestra.

---

## 📨 Notificaciones y pagos

- **Sistema de notificaciones por correo electrónico:** mantener **PHPMailer**. No reemplazar por otras librerías sin autorización explícita.
- **Backend de pagos y demás servicios**: se ejecutan en **Render.com**. No migrar ni modificar esta arquitectura sin aprobación.

---

## 🛡️ Archivos y ámbitos protegidos

- **Nunca eliminar**:
  - `.github/instructions/instrucciones.instructions.md`
  - `.github/copilot-instructions.md`
- Evitar renombrar o mover archivos bajo `.github/` salvo que se solicite explícitamente.

---

## 🐘 PHP en Hostinger (edición permitida con reglas)

- **Se permite editar archivos `.php`.**
- **Regla de comentario obligatorio:** al modificar un archivo PHP, **agrega al inicio** del archivo (o del bloque modificado) un comentario indicando que **este archivo se sube manualmente a Hostinger**.
  - Ejemplo (PHP):
    ```php
    <?php
    // AVISO: Este archivo se despliega manualmente en Hostinger (frontend y PHP en Hostinger).
    // Cualquier cambio local debe subirse manualmente al servidor.
    ```
- **No automatizar el despliegue de archivos PHP** desde este repositorio salvo aprobación explícita.
- **No introducir dependencias o rutas** que asuman un entorno distinto al de Hostinger sin validación previa.

---

## 🧭 Política de edición y alcance de cambios

- Realizar cambios **mínimos y acotados** al alcance de la solicitud.
- Mantener compatibilidad con la infraestructura actual (**Hostinger + Render.com + PHPMailer**).
- Antes de introducir dependencias, verificar si ya existe una solución interna.
- Preferir configuración y utilidades ya presentes en el repo.

---

## ✅ Flujo de commits (confirmación requerida)

- **Siempre preguntar si se necesita hacer un commit.**
- Si la respuesta es afirmativa, **sugerir un mensaje de commit en español**, **abreviado y conciso**, en formato:
  - `tipo: resumen breve en español`
  - Ejemplos de `tipo`: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`.
- Incluir, si corresponde, un cuerpo (opcional) de 1–2 líneas con el “por qué” del cambio.
- **Nunca realizar commits sin confirmación previa.**

> **Plantilla de mensaje de commit sugerido (ejemplo)**  
> `docs: alinear comentarios y documentación al español`
>
> Cuerpo opcional (si aplica):  
> `Ajusta comentarios y README para cumplir la política de idioma.`

---

## 🔀 Pull Requests (PR) en español

- **Todos los PR deben generarse en español (todos los campos posibles).**
- Plantilla sugerida para la descripción del PR:
  1. **Resumen breve:** ¿Qué cambia y por qué?
  2. **Tipo de cambio:** `feat | fix | docs | chore | refactor | test | ci`
  3. **Detalles técnicos:** decisiones y consideraciones.
  4. **Impacto en infraestructura:** Render.com / Hostinger / PHPMailer (si aplica).
  5. **Pruebas realizadas:** comandos y resultados.
  6. **Checklist:**
     - [ ] No se eliminaron archivos protegidos en `.github/`
     - [ ] Documentación y comentarios en español
     - [ ] Se respeta PHPMailer y Render.com
     - [ ] Si hubo cambios en PHP, **archivo(s) comentado(s) con aviso de despliegue manual en Hostinger**
  7. **Notas de despliegue:** pasos si son necesarios.
  8. **Screenshots / evidencia (opcional)**

---

## 🧪 Pruebas y validación (si aplica)

- Añadir o actualizar pruebas relevantes al cambio.
- Documentar cómo reproducir localmente (comandos o pasos).
- No introducir _breaking changes_ sin aviso explícito.

---

## 🔒 Seguridad y datos sensibles

- No exponer secretos en código, commits ni PR.
- Mantener variables sensibles en los mecanismos ya definidos (env/secret managers del proyecto).

---

## 🚫 Acciones que NO debes realizar

- Eliminar los archivos protegidos listados en **Archivos y ámbitos protegidos**.
- Migrar el sistema de notificaciones fuera de **PHPMailer**.
- Cambiar la plataforma de ejecución del backend fuera de **Render.com**.
- Generar PR o commits en idioma distinto al español.
- Automatizar despliegues a Hostinger sin aprobación (los **PHP se suben manualmente**).

---

## 📝 Estilo de código y comentarios

- Comentarios claros, en español, explicando _por qué_ y no solo _qué_.
- Seguir las guías de estilo del lenguaje correspondiente en este repo.
- Mantener consistencia con las convenciones existentes.

---

---

## 🚐 Lógica de Reservas y Vehículos

- **Capacidad de Vehículos**: El backend filtra estrictamente por capacidad (`capacidad >= pasajeros`).
- **Validación Frontend**: 
  - Para grupos de 1-4 pasajeros, el flujo es estándar.
  - Para grupos de 5-7 pasajeros, se requiere un vehículo tipo "Van".
  - Si `/api/disponibilidad/verificar` retorna falso para >4 pasajeros, **SIEMPRE derivar a WhatsApp** usando `WhatsAppButton.jsx`. No intentar forzar la reserva sin validación.
- **Panel Administrativo**: Mantener siempre el filtrado visual en `AdminReservas` para evitar asignar vehículos pequeños a grupos grandes.

---

## 📊 Conversiones y Analytics

- **Robustez en el Monto**: Al implementar flujos de pago o redirecciones que activen eventos de conversión (Google Ads, Meta, etc.), **SIEMPRE asegurar que el monto (`amount`) se pase en la URL**, incluso en escenarios de error o fallback.
  - **Nunca confiar solo en la sesión del cliente** o en re-consultas que pueden fallar.
  - El backend debe recuperar el monto de la pasarela (Flow) y pasarlo explícitamente al frontend.
- **Evitar Valor Cero**: Implementar lógicas defensivas para que, si el monto no está disponible, se use un valor por defecto sensato en lugar de `0` (que invalida la conversión).
- **Parámetros URL**: Usar siempre `amount`, `reserva_id` y `status` como estándar para comunicar el estado del pago a la página de retorno.

---

## 🧰 Notas para agentes

- Antes de iniciar, **leer este AGENTS.md** y revisar `.github/` para políticas adicionales.
- **CRÍTICO:** Siempre consultar `DOCUMENTACION_MAESTRA.md` y `GUIA_SOLUCION_PROBLEMAS.md` como contexto antes de proponer soluciones, especialmente ante errores de backend o despliegue.
- Cuando completes una tarea:
  1. **Pregunta si se requiere commit.**
  2. Si la respuesta es sí, **sugiere un mensaje de commit breve en español** (ver formato).
  3. Ofrece crear un **PR en español** usando la plantilla indicada.
