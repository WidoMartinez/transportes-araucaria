# Skill: Verificación Integral de Pagos

Esta skill permite al agente verificar la correcta implementación y funcionamiento de todos los flujos de pago disponibles en Transportes Araucaria.

## 📋 Ámbitos de Verificación

Se deben validar los 6 flujos de entrada de dinero al sistema:

1.  **Reserva Express (Home)**: `/enviar-reserva-express` -> Web -> Flow.
2.  **Pagar con Código**: `/api/codigos-pago` -> Verificación en `#pagar-codigo`.
3.  **Consultar Reserva**: Búsqueda por email/ID -> Pago de saldos pendientes.
4.  **Compra de Productos**: Adición de extras a reservas existentes.
5.  **Banner Promocional**: Ofertas desde el Hero o Popups.
6.  **Oportunidades de Traslado**: Sistema de subasta/ofertas flash.

## 🛠️ Procedimientos de Prueba

### A. Verificación de Inicio de Pago (`create-payment`)
Para cada flujo, verificar que el objeto enviado a la pasarela contenga:
- `amount` > 0 (Validar en el log de consola del backend).
- `email` sanitizado robustamente.
- `paymentOrigin` correctamente etiquetado para trazabilidad.
- `metadata` (optional) con el `reservaId`.

### B. Verificación de Redirección y Conversión (`payment-result`)
Inspeccionar `/api/payment-result` para asegurar que:
- El parámetro `amount` se pase en la URL de redirección.
- Los datos del usuario estén en Base64 bajo el parámetro `d`.
- **Regla Crítica**: El monto NUNCA debe ser 0 en la URL de retorno (usar fallbacks de `pagoMonto` o `totalConDescuento`).

### C. Verificación de Webhooks (`flow-confirmation`)
Confirmar que el webhook:
- Valide la firma de Flow.
- Actualice el `estadoPago` a 'pagado' o 'parcial'.
- Registre la `pagoFecha` y el `pagoId` (Token de Flow).

## 🚨 Señales de Alerta (S.O.S)
- Reservas que quedan en "Pendiente" después de un pago exitoso.
- Google Ads reportando conversiones con valor 0.
- Pérdida del `reservaId` en el proceso de retorno.

## 📜 Comandos de Ayuda
- `/verificar_pagos`: Ejecuta el workflow de pruebas automáticas.
- `node backend/test-reserva-express.js`: Prueba unitaria del flujo principal.
