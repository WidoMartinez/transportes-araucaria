# Matriz de Verificación de Pagos

| Flujo | Estado Webhook | Redirección Frontend | Tracking Ads (Base64) | Resultado Esperado |
|-------|----------------|----------------------|-----------------------|-------------------|
| **Reserva Express** | update: estadoPago | `/?flow_payment=success` | Parámetro `&d=` presente | Booking + Conversión |
| **Pagar con Código** | update: codigo_pago | `/flow-return?status=success` | Parámetro `&d=` presente | Saldo 0 + Conversión |
| **Saldos Pendientes** | update: estadoPago | `/flow-return?status=success` | Parámetro `&d=` presente | Deuda pagada |
| **Banner Promo** | update: estadoPago | `/flow-return?status=success` | Parámetro `&d=` presente | Oferta activada |
| **Oportunidades** | update: oportunidad | `/flow-return?status=success` | Parámetro `&d=` presente | Asignación conductor |
| **Test Fallido** | log: status rejected | `/flow-return?status=error` | N/A | Booking pendiente |

## Checklist de Verificación de Salud
- [ ] ¿El `paymentOrigin` es correcto?
- [ ] ¿El `reservaId` persiste en `optional` metadata?
- [ ] ¿El email pasó por `sanitizarEmailRobusto`?
- [ ] ¿Se guardó el registro en la tabla `flow_tokens`?
