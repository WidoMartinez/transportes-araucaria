# Agente: Pagos (Payments Agent)

Responsabilidades:
- Orquestar validación de pagos, confirmaciones, retries y manejo de webhooks.
- Registrar eventos y notificar al usuario.

Disparadores:
- Webhooks del proveedor de pagos.
- Solicitud interna de pago o reintento.

Entradas:
- Payloads de pagos, sesión de usuario, configuración del gateway.

Salidas:
- Actualización de estado de pedido, notificaciones (correo/registro).

Notas:
- Backend de pagos en Render; claves en GitHub Secrets.
- Validación idempotente y registro seguro de webhooks.
