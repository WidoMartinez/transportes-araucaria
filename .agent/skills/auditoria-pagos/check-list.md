# 🏁 Checklist de Auditoría de Pagos

El agente DEBE completar estos puntos durante una auditoría completa:

- [ ] **Integridad de Tramos**: Verificar que las reservas Ida/Vuelta tengan Ids vinculados.
- [ ] **División de Montos**: Confirmar que el `totalConDescuento` se dividió al 50%.
- [ ] **Estado de Pago**: Verificar que `pagoMonto` sea mayor a 0 si la pasarela confirmó el éxito.
- [ ] **Tracking Ads**: Confirmar que el `transaction_id` de Flow se pasó al `gtag`.
- [ ] **Dirección (Regla de Oro)**: Confirmar que el campo `hotel` no esté vacío.
- [ ] **Vencimiento de Códigos**: Si se usó un código, verificar que su estado sea 'usado'.
- [ ] **Notificaciones**: Revisar logs de PHP (Hostinger) si el cliente no recibió el correo confirmatorio.

---
> [!IMPORTANT]
> Si detectas un fallo en el balance de pagos, usa el script `backend/test-split-logic.js` para simular la corrección antes de aplicarla.
