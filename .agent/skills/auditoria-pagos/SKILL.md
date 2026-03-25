---
name: auditoria-pagos
description: Capacidad para auditar el flujo de pagos, verificar integraciones con Flow, depurar el tracking de Google Ads y asegurar la integridad de las reservas vinculadas (Ida/Vuelta).
---

# 🕵️ Auditoría de Pagos y Reservas

Esta habilidad permite al agente realizar un chequeo exhaustivo de la salud del sistema de cobros y de los datos de reserva.

## 📋 Cuándo Usar Esta Skill
- Tras reportes de pagos no registrados en Admin.
- Ante dudas sobre si una reserva Ida/Vuelta se separó correctamente.
- Si hay discrepancias en las conversiones de Google Ads.
- Tras realizar cambios en `backend/server-db.js` relacionados con pagos.

## 🛠️ Procedimiento de Auditoría

### 1. Verificación de Reservas Vinculadas (Ida/Vuelta)
Si una reserva debe ser "Ida y Vuelta", el agente debe verificar que en la base de datos existan dos registros con:
- `tipoTramo`: "ida" y "vuelta" respectivamente.
- `tramoPadreId` y `tramoHijoId` cruzados.
- **Monto**: El total del pago (`totalConDescuento`) y abonos deben estar divididos proporcionalmente (aprox. 50/50).

**Comando de diagnóstico**:
```bash
node backend/diagnosticar-tipo-tramo.js
```

### 2. Inspección de Flujo Flow e Integración
Verificar que el webhook haya procesado la confirmación.
- Revisar `pagoMonto`, `referenciaPago` y `metodoPago`.
- Si el pago es exitoso, `estadoPago` debe ser "pagado" o "abono" y `estado` debe ser "confirmada" o "completada".

### 3. Debugging de Google Ads (Conversiones)
- Verificar si el parámetro `d` (Base64) se generó en la redirección (`/api/payment-result`).
- Asegurar que no existan "Shadowing Routes" en `App.jsx` que intercepten `/flow-return`.

### 4. Chequeo de Errores Comunes (Checklist)
Consultar siempre el archivo `check-list.md` adjunto para asegurar que ningún paso se omita.

## 📝 Reglas Críticas
- **No duplicar pagos**: Asegurar que el webhook no aplique el monto total a ambos tramos (debe dividirse).
- **Direcciones**: El campo `hotel` debe estar poblado (Regla de Oro).
- **Logs**: Usar siempre `console.log` descriptivos en Node para auditoría futura.
