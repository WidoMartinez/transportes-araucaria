# Agente: Notificaciones por Correo (Email Agent — PHPMailer)

Responsabilidades:
- Enviar correos transaccionales y alertas (errores de CI, confirmaciones).
- Gestionar plantillas centralizadas.

Disparadores:
- Evento de sistema (merge, fallo CI, confirmación de pago, error crítico).

Entradas:
- Plantilla + datos contextuales (usuario, PR, error).

Salidas:
- Correo enviado vía PHPMailer.

Notas de implementación:
- Mantener PHPMailer en backend PHP o microservicio en Render.
- Guardar credenciales en GitHub Secrets; registrar envíos en logs.
