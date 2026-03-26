---
name: auditoria-conversiones
description: "Skill para auditar, investigar y estandarizar flujos de conversión de marketing (Google Ads, Meta) en Transportes Araucanía. Usar cuando: una conversión no se disparó, el monto fue 0, existe un nuevo flujo de pago sin tracking, se detecta duplicidad, o se quiere revisar exhaustivamente todos los puntos de conversión del sistema."
---

# Auditoría y Estandarización de Flujos de Conversión

## Propósito

Investigar sistemáticamente por qué una conversión no se registró (o se registró mal), mapear todos los puntos de tracking del sistema y estandarizar la implementación para evitar regresiones futuras.

---

## Paso 1 — Identificar el Flujo Afectado

Antes de buscar código, preguntar o inferir:

1. **¿Cuál es el origen del pago?** (banner de promoción, reserva express, oportunidades de traslado, pago con código, abono, etc.)
2. **¿Cuál es el tipo de evento esperado?** (`Lead` antes de pagar / `Purchase` al retornar con éxito)
3. **¿Qué log apareció en consola del navegador?** (buscar `⚠️ Amount no presente`, `⚠️ Monto inválido`, `ℹ️ Conversión ya registrada`)
4. **¿El backend pasó `amount` en la URL de retorno?**

### IDs de conversión del proyecto

| Tipo | ID de etiqueta Google Ads | Dónde se dispara |
|------|--------------------------|-----------------|
| **Lead** (intención de pago) | `AW-17529712870/8GVlCLP-05MbEObh6KZB` | `PagarConCodigo.jsx`, `ReservaRapidaModal.jsx`, `OportunidadesTraslado.jsx` |
| **Purchase** (compra exitosa) | `AW-17529712870/yZz-CJqiicUbEObh6KZB` | `FlowReturn.jsx`, `App.jsx` (HeroExpress), `CompletarDetalles.jsx` (respaldo) |
| **WhatsApp click** | Evento micro-conversión | `WhatsAppButton.jsx` |

---

## Paso 2 — Mapa Completo de Puntos de Conversión

Para cada flujo, verificar que existan **tres capas**:

```
[A] Evento Lead → antes de ir a Flow
[B] Evento Purchase → al regresar de Flow con status=success
[C] Respaldo / Fallback → si B falla (sessionStorage, localStorage pending)
```

### Checklist de flujos actuales

- [ ] **Reserva Express (HeroExpress)** → `App.jsx` líneas 550-710
  - A: ¿Se guarda `ga_pending_conversion_express` en localStorage antes de redireccionar?
  - B: ¿`dispararConversionExpress()` recibe `amount` válido desde la URL?
  - C: ¿`CompletarDetalles.jsx` actúa como respaldo con misma clave `sessionStorage`?

- [ ] **Flujo Normal (FlowReturn)** → `src/components/FlowReturn.jsx`
  - A: ¿El componente que inicia el pago dispara Lead antes de redirigir?
  - B: ¿`triggerConversion(amountParam, ...)` recibe `amountParam` no vacío?
  - C: ¿El polling de estado pendiente pasa `data.monto` o `amountParam` al disparar?

- [ ] **Oportunidades de Traslado** → `src/pages/OportunidadesTraslado.jsx`
  - A: ¿`validatePaymentAmount(data.precio)` retorna valor > 0?
  - B: ¿El `paymentOrigin: "oportunidad_traslado"` llega al redirect de retorno?
  - C: ¿Hay mecanismo de respaldo si el retorno falla?

- [ ] **Banner de Promoción** → `src/components/PromocionBanners.jsx`
  - A: ¿Se dispara Lead al iniciar el pago desde el banner?
  - B: ¿El backend incluye `amount` en la URL de retorno para este flujo?
  - C: ¿El `paymentOrigin` identifica el flujo como "banner_promocion"?
  - **⚠️ RIESGO IDENTIFICADO**: Al 26/03/2026 este componente NO tiene tracking de conversión propio.

- [ ] **Pago con Código** → `src/components/PagarConCodigo.jsx`
  - A: ¿Se dispara Lead con `waitForGtag` antes de redirigir a Flow?
  - B: ¿La URL de retorno del backend incluye `amount`?

---

## Paso 3 — Diagnóstico del Monto Faltante

Si el problema es `amount=0` o `amount` ausente, seguir este árbol:

```
¿El log "Amount no presente en URL" aparece en consola?
│
├── SÍ → El frontend recibió URL sin amount
│         → Revisar el endpoint de backend que construye la URL de retorno
│         → Buscar: /api/payment-result, /api/flow/return, /api/retorno
│         → Verificar que se recupera el monto desde Flow o desde la DB antes de redirigir
│
└── NO → El frontend recibió amount pero el parseo falló
          → Revisar si amount llega como string vacío, "null" o "undefined"
          → Verificar encoding en URLSearchParams del backend
```

### Comandos de diagnóstico rápido

```bash
# Buscar endpoint de retorno de pago en el backend
grep -r "urlReturn\|payment-result\|retorno\|returnUrl" backend/routes/ backend/endpoints/ --include="*.js" -l

# Ver cómo se construye la URL de retorno con amount
grep -rn "amount\|monto" backend/routes/ backend/endpoints/ --include="*.js" | grep -i "url\|redirect\|return"

# Verificar si el flujo de banner tiene paymentOrigin definido
grep -rn "paymentOrigin\|banner\|promo" src/ --include="*.jsx" --include="*.js"
```

---

## Paso 4 — Estandarizar un Flujo Nuevo o Corregido

Al agregar o corregir tracking en un flujo, usar este patrón canónico:

### Plantilla: Lead (antes de pagar)

```jsx
// Usar siempre waitForGtag con timeout de 2 segundos
const waitForGtag = (timeoutMs = 2000) => new Promise((resolve) => {
  if (typeof window.gtag === "function") { resolve(true); return; }
  const t0 = Date.now();
  const iv = setInterval(() => {
    if (typeof window.gtag === "function") { clearInterval(iv); resolve(true); }
    else if (Date.now() - t0 >= timeoutMs) { clearInterval(iv); resolve(false); }
  }, 100);
});

// ANTES de redirigir al usuario a Flow:
await waitForGtag();
if (typeof window.gtag === "function") {
  window.gtag("set", "user_data", { email, phone_number, address: { first_name, last_name, country: "CL" } });
  window.gtag("event", "conversion", {
    send_to: "AW-17529712870/8GVlCLP-05MbEObh6KZB", // Lead
    value: validatePaymentAmount(monto),
    currency: "CLP",
    transaction_id: `lead_${reservaId}_${Date.now()}`,
  });
}
// Guardar monto en localStorage como seguro de respaldo
localStorage.setItem("ga_pending_conversion_express", JSON.stringify({ reservaId, amount: monto }));
```

### Plantilla: Purchase (al retornar con éxito)

```jsx
// Verificar duplicado primero
const conversionKey = `flow_conversion_${reservaId}_${token?.substring(0,8)}`;
if (sessionStorage.getItem(conversionKey)) return; // Ya se registró

let conversionValue = validatePaymentAmount(amountFromUrl);
if (conversionValue <= 0) {
  // Intentar recuperar de localStorage
  const pending = JSON.parse(localStorage.getItem("ga_pending_conversion_express") || "{}");
  conversionValue = validatePaymentAmount(pending?.amount, 1.0);
  console.error("❌ [GA-ALERTA] Conversión disparada con fallback. Revisar que backend pase amount en URL.");
}

await waitForGtag();
window.gtag("event", "conversion", {
  send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB", // Purchase
  value: conversionValue,
  currency: "CLP",
  transaction_id: `${reservaId}_${token?.substring(0,8) || Date.now()}`,
});
sessionStorage.setItem(conversionKey, "true");
localStorage.removeItem("ga_pending_conversion_express");
```

---

## Paso 5 — Verificación Post-Implementación

Después de cualquier cambio en conversiones, ejecutar este checklist:

### En el navegador (localhost + producción)

1. Abrir DevTools → Consola → Filtrar por `[FlowReturn]` / `[App.jsx]` / nombre del componente
2. Completar un pago de prueba
3. Verificar que aparezca: `🚀 Disparando conversión Google Ads: { value: XXX, currency: "CLP" }`
4. Verificar que **NO** aparezca: `⚠️ Amount no presente` ni `❌ GA-ALERTA`
5. En DevTools → Red → Filtrar por `googletagmanager.com` o `gtag` → confirmar evento enviado

### En Google Ads (24-48 hs después)

- Herramientas → Conversiones → Ver "Reservas completadas" / "Pagos banner"
- Confirmar que el valor promedio es razonable (no ~1 CLP que indica fallback)
- Comparar cantidad de conversiones con reservas pagadas en la DB del mismo período

### Script de investigación rápida en backend

```bash
# Correr script existente para auditar conversiones vs reservas pagadas
node backend/investiga-conversiones.js
```

---

## Paso 6 — Documentar el Hallazgo

Después de identificar y corregir un flujo roto:

1. Actualizar `DOCUMENTACION_MAESTRA.md` → Sección "5.19 Sistema de Seguimiento de Conversiones"
2. Agregar el flujo al checklist de este SKILL.md (Paso 2)
3. Si el fix fue en el backend (URL de retorno sin `amount`), documentar el endpoint corregido
4. Sugerir commit: `fix: agregar amount a URL de retorno en flujo [nombre_flujo]`

---

## Casos Conocidos y Soluciones

| Síntoma | Causa raíz | Solución |
|--------|-----------|---------|
| Conversión con value=1.0 | Backend no pasa `amount` en URL de retorno | Revisar endpoint `/api/payment-result` o equivalente; recuperar monto de Flow o DB antes de construir URL |
| Conversión no disparada en banner | `PromocionBanners.jsx` no tiene tracking | Agregar Lead antes de redirigir a Flow + verificar que retorno incluya `paymentOrigin=banner_promocion` |
| Conversión duplicada | `sessionStorage` key diferente entre flujos | Estandarizar clave como `flow_conversion_${reservaId}` en todos los componentes |
| gtag no disponible (timeout) | Script de GA cargando lento por ad-blocker o conexión | Los logs muestran `⏲️ Timeout esperando gtag`. No hay solución perfecta; considerar server-side tracking |
| Conversión en estado `pending` no disparada | Polling terminó antes de confirmar pago | Aumentar `MAX_INTENTOS` en `FlowReturn.jsx` o implementar notificación vía webhook |

---

## Archivos Clave del Sistema de Conversiones

| Archivo | Rol |
|---------|-----|
| [src/App.jsx](../../../src/App.jsx) | Flujo Express: Lead + Purchase + Enhanced Conversions |
| [src/components/FlowReturn.jsx](../../../src/components/FlowReturn.jsx) | Flujo Normal: Purchase con polling para pagos pendientes |
| [src/components/CompletarDetalles.jsx](../../../src/components/CompletarDetalles.jsx) | Respaldo de Purchase si FlowReturn no alcanzó a disparar |
| [src/pages/OportunidadesTraslado.jsx](../../../src/pages/OportunidadesTraslado.jsx) | Lead en flujo de oportunidades |
| [src/components/PromocionBanners.jsx](../../../src/components/PromocionBanners.jsx) | **⚠️ Sin tracking — agregar Lead y verificar Purchase** |
| [src/utils/paymentValidation.js](../../../src/utils/paymentValidation.js) | `validatePaymentAmount()` — usar en TODOS los flujos |
| [backend/investiga-conversiones.js](../../../backend/investiga-conversiones.js) | Auditoría de reservas pagadas vs conversiones registradas |
| [DOCUMENTACION_MAESTRA.md](../../../DOCUMENTACION_MAESTRA.md) | Documentación técnica del sistema (sección 5.19) |
