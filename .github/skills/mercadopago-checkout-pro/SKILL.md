---
name: mercadopago-checkout-pro
description: "Skill para integrar Mercado Pago Checkout Pro como pasarela de pago adicional junto a Flow en Transportes Araucanía. Usar cuando: se necesite implementar o depurar Mercado Pago Checkout Pro, configurar webhooks de MP, crear el componente de retorno con tracking de Google Ads, agregar selector de pasarela en el frontend, o verificar la calidad de la integración con el checklist oficial de MP."
---

# Integración Mercado Pago Checkout Pro

## Propósito

Guiar la implementación completa de Mercado Pago Checkout Pro como **segunda pasarela de pago** junto a Flow, manteniendo:
- Tracking de conversiones de Google Ads (Lead + Purchase) con monto real.
- Arquitectura existente (backend Node.js en Render + frontend React en Hostinger).
- Sistema de notificaciones por correo PHPMailer.
- Coherencia con el flujo de reservas actual.

---

## Datos del Proyecto

| Campo | Valor |
|-------|-------|
| **AppID Mercado Pago** | `7632289193248021` |
| **Nombre de la app** | Ruta Araucaria pasarela |
| **País** | Chile (`MLC`) |
| **Moneda** | CLP |
| **Backend** | `https://transportes-araucaria.onrender.com` |
| **Frontend** | `https://www.transportesaraucaria.cl` |
| **SDK a usar** | `mercadopago` (npm, Node.js) |

---

## Paso 1 — Instalar y Configurar el SDK en el Backend

### Instalación

```bash
cd backend
npm install mercadopago
```

### Variables de entorno necesarias en Render

Agregar en el panel de Render (`Environment > Environment Variables`):

```env
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXX   # Access Token de producción (Panel MP > Credenciales)
MP_PUBLIC_KEY=APP_USR-XXXXXXXXXXXX     # Public Key (para el frontend)
MP_WEBHOOK_SECRET=XXXXXXXXXXXX         # Secret para verificar firmas de webhooks MP (opcional pero recomendado)
```

> **⚠️ Para pruebas:** usar las credenciales de TEST del panel de MP en "Tus integraciones > App > Credenciales de prueba".

---

## Paso 2 — Endpoint Backend: Crear Preferencia de Pago MP

### Archivo: `backend/routes/` o dentro de `backend/server-db.js`

Agregar el endpoint `POST /api/create-payment-mp`. El SDK usa `MercadoPagoConfig` y `Preference`:

```javascript
// Importar SDK al inicio del archivo
import MercadoPago from 'mercadopago';

// Configuración inicial del cliente MP
const mpClient = new MercadoPago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// ----- Endpoint -----
// POST /api/create-payment-mp
app.post('/api/create-payment-mp', async (req, res) => {
  const {
    amount,
    description,
    email,
    nombre,
    telefono,
    reservaId,
    codigoReserva,
    tipoPago,
    paymentOrigin,
  } = req.body;

  // Validación básica
  if (!amount || !email || !codigoReserva) {
    return res.status(400).json({ message: 'Faltan campos requeridos: amount, email, codigoReserva' });
  }

  const montoEntero = Math.round(Number(amount));
  if (isNaN(montoEntero) || montoEntero <= 0) {
    return res.status(400).json({ message: 'Monto inválido' });
  }

  // Separar nombre en partes para payer (requerido por checklist de calidad MP)
  const nombrePartes = (nombre || '').trim().split(' ');
  const primerNombre = nombrePartes[0] || '';
  const apellido = nombrePartes.slice(1).join(' ') || '';

  const frontendBase = process.env.FRONTEND_URL || 'https://www.transportesaraucaria.cl';
  const backendBase  = process.env.BACKEND_URL  || 'https://transportes-araucaria.onrender.com';

  // Metadata para recuperar la reserva en el webhook
  const metadata = {
    reservaId: reservaId || null,
    codigoReserva,
    tipoPago: tipoPago || 'total',
    paymentOrigin: paymentOrigin || 'desconocido',
  };

  try {
    const preferenceClient = new MercadoPago.Preference(mpClient);

    const preferenceBody = {
      items: [
        {
          id: codigoReserva,                       // Checklist: item_id
          title: description || `Traslado ${codigoReserva}`, // Checklist: item_title
          description: `Reserva ${codigoReserva} - Transportes Araucanía`, // Checklist: item_description
          category_id: 'transportation',           // Checklist: item_category_id
          quantity: 1,                             // Checklist: item_quantity
          unit_price: montoEntero,                 // Checklist: item_unit_price
          currency_id: 'CLP',
        },
      ],
      payer: {
        email,                                     // Checklist: email
        first_name: primerNombre,                  // Checklist: payer_first_name
        last_name: apellido,                       // Checklist: payer_last_name
        phone: {
          area_code: '+56',
          number: (telefono || '').replace(/\D/g, '').slice(-9),
        },
      },
      // Checklist: back_urls
      back_urls: {
        success: `${frontendBase}/mp-return?status=success&reserva_id=${reservaId || ''}&codigo=${codigoReserva}&amount=${montoEntero}`,
        failure: `${frontendBase}/mp-return?status=failure&reserva_id=${reservaId || ''}&codigo=${codigoReserva}&amount=${montoEntero}`,
        pending: `${frontendBase}/mp-return?status=pending&reserva_id=${reservaId || ''}&codigo=${codigoReserva}&amount=${montoEntero}`,
      },
      auto_return: 'approved',                     // Redirige automáticamente al éxito
      // Checklist: notification_url (webhooks)
      notification_url: `${backendBase}/api/mp-confirmation`,
      // Checklist: external_reference (correlación con sistema interno)
      external_reference: codigoReserva,
      // Checklist: statement_descriptor (descriptor en tarjeta)
      statement_descriptor: 'TRANSP ARAUCANIA',
      // Metadata interna para usar en el webhook
      metadata,
      // Buenas prácticas: binary_mode para aprobación instantánea
      binary_mode: true,
    };

    const preference = await preferenceClient.create({ body: preferenceBody });

    console.log(`🚀 [MP] Preferencia creada | Reserva: ${codigoReserva} | Monto: $${montoEntero} | ID: ${preference.id}`);

    return res.json({
      url: preference.init_point,       // URL de pago en producción
      // sandbox_url: preference.sandbox_init_point, // Para pruebas
      preferenceId: preference.id,
    });

  } catch (error) {
    console.error('❌ [MP] Error al crear preferencia:', error?.cause || error?.message || error);
    return res.status(500).json({ message: 'Error al crear preferencia de pago MP', detail: error?.message });
  }
});
```

> **Nota:** `init_point` es para producción. Usar `sandbox_init_point` en pruebas. Controlar con variable de entorno `NODE_ENV`.

---

## Paso 3 — Webhook de Confirmación MP

### Endpoint: `POST /api/mp-confirmation`

A diferencia de Flow, Mercado Pago notifica via webhooks con el `payment_id`. Se debe consultar la Payment API para obtener el estado y detalle.

```javascript
import { createHmac } from 'crypto';

// POST /api/mp-confirmation
app.post('/api/mp-confirmation', async (req, res) => {
  // Responder inmediatamente para evitar reintentos de MP
  res.status(200).send('OK');

  const { type, data } = req.body;

  // Solo procesar notificaciones de pagos
  if (type !== 'payment') {
    console.log(`[MP Webhook] Tipo ignorado: ${type}`);
    return;
  }

  const paymentId = data?.id;
  if (!paymentId) {
    console.warn('[MP Webhook] Sin payment_id en el body');
    return;
  }

  try {
    // Consultar el pago en la API de MP
    const paymentClient = new MercadoPago.Payment(mpClient);
    const payment = await paymentClient.get({ id: paymentId });

    console.log(`💳 [MP Webhook] Payment ID: ${paymentId} | Status: ${payment.status} | Monto: $${payment.transaction_amount}`);

    if (payment.status !== 'approved') {
      console.log(`[MP Webhook] Pago no aprobado (${payment.status}), sin acción.`);
      return;
    }

    const codigoReserva = payment.external_reference;
    const monto = payment.transaction_amount;
    const payerEmail = payment.payer?.email || '';

    if (!codigoReserva) {
      console.error('[MP Webhook] Sin external_reference. No se puede vincular reserva.');
      return;
    }

    // Buscar la reserva en la BD por código
    const reserva = await Reserva.findOne({ where: { codigoReserva } });
    if (!reserva) {
      console.error(`[MP Webhook] Reserva no encontrada: ${codigoReserva}`);
      return;
    }

    // Actualizar estado de la reserva
    await reserva.update({
      estadoPago: 'aprobado',
      pagoId: String(paymentId),
      pagoGateway: 'mercadopago',
      pagoMonto: monto,
      pagoFecha: new Date(payment.date_approved),
      estado: 'confirmada',
    });

    console.log(`✅ [MP Webhook] Reserva ${codigoReserva} confirmada. Pago: $${monto}`);

    // Enviar email de confirmación (mismo sistema PHPMailer que Flow)
    const phpEmailUrl = process.env.PHP_EMAIL_URL;
    if (phpEmailUrl) {
      await axios.post(phpEmailUrl, {
        tipo: 'confirmacion_pago',
        codigoReserva: reserva.codigoReserva,
        nombre: reserva.nombre,
        email: reserva.email,
        telefono: reserva.telefono,
        origen: reserva.origen,
        destino: reserva.destino,
        fecha: reserva.fecha,
        hora: reserva.hora,
        pasajeros: reserva.pasajeros,
        monto,
        gateway: 'mercadopago',
        paymentId: String(paymentId),
        estadoPago: 'approved',
      }).catch(err => console.error('[MP Webhook] Error enviando email:', err.message));
    }

  } catch (error) {
    console.error('❌ [MP Webhook] Error procesando pago:', error?.message || error);
  }
});
```

---

## Paso 4 — Endpoint de Verificación de Estado (Polling Frontend)

El frontend hace polling igual que con Flow. Reutilizar `/api/payment-status` existente, que ya busca por `reserva_id`. Solo asegurarse de que funciona con pagos de MP (el campo `pagoGateway` puede ser `"mercadopago"`).

Si no funciona bien con MP, agregar soporte en el endpoint existente:

```javascript
// En el endpoint /api/payment-status existente, verificar que la condición
// de "pagado" incluya pagos de MP:
const pagado = reserva.estadoPago === 'aprobado' && 
               ['flow', 'mercadopago'].includes(reserva.pagoGateway);
```

---

## Paso 5 — Componente Frontend: `MercadoPagoReturn.jsx`

### Archivo: `src/components/MercadoPagoReturn.jsx`

Análogo a `FlowReturn.jsx`, maneja la página `/mp-return`. **Debe disparar las mismas conversiones de Google Ads.**

```jsx
// src/components/MercadoPagoReturn.jsx
import { useState, useEffect } from 'react';
// ... (mismos imports que FlowReturn.jsx: Card, logo, etc.)

/**
 * Componente MercadoPagoReturn
 * Página de retorno después de completar o fallar un pago con Mercado Pago Checkout Pro.
 * Dispara el evento de conversión Google Ads (Purchase) una sola vez por transacción exitosa.
 */
function MercadoPagoReturn() {
  const [paymentStatus, setPaymentStatus] = useState('processing');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam  = urlParams.get('status');       // success | failure | pending
    const amountParam  = urlParams.get('amount');
    const reservaId    = urlParams.get('reserva_id');
    const codigoReserva = urlParams.get('codigo');
    // MP también puede enviar: collection_id, collection_status, payment_id, merchant_order_id

    const mpPaymentId  = urlParams.get('collection_id') || urlParams.get('payment_id');

    // Usar payment_id de MP como transaction_id para evitar duplicados en Google Ads
    const transactionId = mpPaymentId || codigoReserva || 'mp-' + Date.now();

    const apiBase = import.meta.env.VITE_API_URL || 'https://transportes-araucaria.onrender.com';

    // ── Función para disparar conversión de Google Ads ──────────────────────
    const triggerConversion = (amount, txId) => {
      let conversionValue = 0;
      const parsed = Number(amount);
      if (!isNaN(parsed) && parsed > 0) conversionValue = parsed;
      else console.warn('⚠️ [MPReturn] Monto inválido, usando 1.0 de respaldo. amount:', amount);

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: 'AW-17529712870/yZz-CJqiicUbEObh6KZB', // Mismo evento Purchase que Flow
          value: conversionValue || 1.0,
          currency: 'CLP',
          transaction_id: txId,
        });
        console.log(`✅ [MPReturn] Conversión Google Ads disparada | TX: ${txId} | Valor: ${conversionValue}`);
      } else {
        console.warn('⚠️ [MPReturn] gtag no disponible para conversión');
      }
    };

    const verifyPayment = async () => {
      // Caso 1: MP redirigió con status=success (auto_return: 'approved')
      if (statusParam === 'success') {
        setPaymentStatus('success');
        triggerConversion(amountParam, transactionId);
        return;
      }

      // Caso 2: Pendiente → polling al backend (igual que FlowReturn)
      if (statusParam === 'pending') {
        setPaymentStatus('pending');
        const MAX_INTENTOS = 24;
        let intentos = 0;
        const intervalo = setInterval(async () => {
          intentos++;
          try {
            const resp = await fetch(`${apiBase}/api/payment-status?reserva_id=${reservaId}`);
            const data = await resp.json();
            if (data.pagado) {
              clearInterval(intervalo);
              setPaymentStatus('success');
              triggerConversion(data.monto?.toString() || amountParam, transactionId);
            } else if (intentos >= MAX_INTENTOS) {
              clearInterval(intervalo);
              setPaymentStatus('pending'); // Mantener en pending si no se confirma
            }
          } catch (e) {
            console.error('[MPReturn] Error en polling:', e.message);
          }
        }, 5000);
        return;
      }

      // Caso 3: failure → mostrar error
      if (statusParam === 'failure') {
        setPaymentStatus('error');
        return;
      }

      // Caso 4: sin parámetros reconocibles
      setPaymentStatus('error');
    };

    verifyPayment();
  }, []);

  // ... (mismo JSX de FlowReturn.jsx adaptado, cambiando referencias a "Mercado Pago")
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      {/* Reutilizar la misma UI de FlowReturn.jsx */}
    </div>
  );
}

export default MercadoPagoReturn;
```

---

## Paso 6 — Agregar Ruta en App.jsx

```jsx
// En src/App.jsx, dentro del bloque de rutas principales:
import MercadoPagoReturn from './components/MercadoPagoReturn';

// Agregar junto a la ruta /flow-return:
{ path === '/mp-return' && <MercadoPagoReturn /> }
```

> Verificar que el `.htaccess` de Hostinger ya tenga el fallback SPA configurado (lo tiene).

---

## Paso 7 — Agregar Selector de Pasarela en el Frontend

En los componentes que inician el pago (`HeroExpress` / `PagarConCodigo` / `ConsultarReserva`), agregar la opción de pagar con Mercado Pago:

```jsx
// Estado para selección de pasarela
const [pasarela, setPasarela] = useState('flow'); // 'flow' | 'mercadopago'

// Botones/radio de selección
<div className="flex gap-3 mb-4">
  <button
    onClick={() => setPasarela('flow')}
    className={pasarela === 'flow' ? 'border-2 border-blue-600' : 'border'}
  >
    <img src="/flow-logo.png" alt="Flow" />
    Pagar con Flow
  </button>
  <button
    onClick={() => setPasarela('mercadopago')}
    className={pasarela === 'mercadopago' ? 'border-2 border-blue-600' : 'border'}
  >
    <img src="/mp-logo.png" alt="Mercado Pago" />
    Pagar con Mercado Pago
  </button>
</div>

// Al hacer clic en "Pagar":
const endpoint = pasarela === 'mercadopago' ? '/api/create-payment-mp' : '/create-payment';
const response = await fetch(`${apiBase}${endpoint}`, { ... });

// Si es MP, usar data.url (init_point). Si es Flow, usar data.url como ya se hace.
if (pasarela === 'mercadopago') {
  // Guardar intención Lead en Google Ads antes de redirigir
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', { send_to: 'AW-17529712870/8GVlCLP-05MbEObh6KZB' });
  }
  window.location.href = data.url; // init_point de MP
}
```

---

## Paso 8 — Checklist de Calidad MP (Campos Obligatorios)

Basado en el checklist oficial del AppID `7632289193248021`. **Todos deben cumplirse antes de pasar a producción:**

| # | Campo en Preferencia | Estado | Dónde se envía |
|---|---------------------|--------|----------------|
| 1 | `items[0].quantity` | Obligatorio | `= 1` siempre |
| 2 | `items[0].unit_price` | Obligatorio | `= montoEntero` |
| 3 | `items[0].title` | Obligatorio | `description` |
| 4 | `items[0].id` | Obligatorio | `codigoReserva` |
| 5 | `items[0].description` | Obligatorio | texto descriptivo |
| 6 | `items[0].category_id` | Obligatorio | `"transportation"` |
| 7 | `statement_descriptor` | Obligatorio | `"TRANSP ARAUCANIA"` |
| 8 | `back_urls.success/failure/pending` | Obligatorio | URLs a `/mp-return` |
| 9 | `notification_url` | Obligatorio | `/api/mp-confirmation` |
| 10 | `external_reference` | Obligatorio | `codigoReserva` |
| 11 | `payer.email` | Obligatorio | email del cliente |
| 12 | `payer.first_name` | Obligatorio | primer nombre del cliente |
| 13 | `payer.last_name` | Obligatorio | apellido del cliente |
| 14 | SDK de backend | Obligatorio | `npm install mercadopago` |
| 15 | `binary_mode: true` | Buena práctica | aprobación instantánea |

### Verificar calidad de la integración

```bash
# Usar el MCP de Mercado Pago para evaluar la integración:
# mcp_mcp_mercadopa_quality_evaluation con appId: 7632289193248021
```

---

## Paso 9 — Conversiones Google Ads: Tabla de Cobertura

El sistema debe mantener **Lead + Purchase** en Mercado Pago igual que en Flow:

| Flujo | Lead (intención) | Purchase (confirmado) |
|-------|------------------|-----------------------|
| HeroExpress + MP | En `App.jsx` antes de redirigir a `init_point` | En `MercadoPagoReturn.jsx` con `amount` de URL |
| PagarConCodigo + MP | En `PagarConCodigo.jsx` antes de redirigir | En `MercadoPagoReturn.jsx` con `amount` de URL |
| ConsultarReserva + MP | En `ConsultarReserva.jsx` antes de redirigir | En `MercadoPagoReturn.jsx` con `amount` de URL |

### Reglas de conversión para MP

1. `transaction_id` = `collection_id` (MP payment_id) — garantiza no-duplicados.
2. `amount` se pasa en la `back_url.success` desde el backend al construir la preferencia.
3. Si el status es `pending`, hacer polling al mismo endpoint `/api/payment-status?reserva_id=X`.
4. Usar el mismo ID de conversión de Google Ads que Flow: `AW-17529712870/yZz-CJqiicUbEObh6KZB`.

---

## Paso 10 — Pruebas

### Variables de entorno de prueba

```env
MP_ACCESS_TOKEN=TEST-XXXXXXXXXXXX    # Token de prueba del panel MP
```

### Crear usuario de prueba (via MCP)

```bash
# Usar herramienta: mcp_mcp_mercadopa_create_test_user
# Parámetros: siteId: "MLC", description: "comprador_prueba"
# Luego: mcp_mcp_mercadopa_add_money_test_user para cargar saldo
```

### Simular retorno exitoso (localhost)

```
http://localhost:5173/mp-return?status=success&reserva_id=1&codigo=AR-TEST-001&amount=50000&collection_id=123456789
```

### Verificar en DevTools (Console)

```
✅ [MPReturn] Conversión Google Ads disparada | TX: 123456789 | Valor: 50000
```

### Probar webhook desde terminal

```bash
curl -X POST https://transportes-araucaria.onrender.com/api/mp-confirmation \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"123456789"}}'
```

---

## Paso 11 — Historial de Notificaciones (Diagnóstico)

Para revisar webhooks recibidos desde el panel o via MCP:

```bash
# Usar herramienta: mcp_mcp_mercadopa_notifications_history
# Parámetros: appId: 7632289193248021
```

---

## Errores Frecuentes a Evitar

> ⚠️ Leer antes de implementar para no repetir errores conocidos del proyecto.

| Error | Causa | Solución |
|-------|-------|----------|
| Conversión con `amount=0` | `back_url.success` no incluía `amount` | Pasar `amount` siempre en la back_url al crear la preferencia |
| `transaction_id` duplicado | Usar `codigoReserva` (puede reutilizarse en abonos) | Usar `collection_id` de MP como `transaction_id` |
| Webhook no llega en Render | Cold start del servidor free | Implementar polling igual que con Flow |
| Pago aprobado pero reserva sin confirmar | Webhook tardío, MP reintenta | El webhook responde 200 inmediatamente y procesa async |
| `init_point` vs `sandbox_init_point` | Usar producción en pruebas o viceversa | Controlar con `NODE_ENV === 'production'` |
| Error 401 en API MP | `MP_ACCESS_TOKEN` expirado o de sandbox en producción | Verificar credenciales en panel MP |

---

## Archivos Involucrados

```
backend/
├── server-db.js               # Agregar endpoints /api/create-payment-mp y /api/mp-confirmation
└── .env                       # Agregar MP_ACCESS_TOKEN, MP_PUBLIC_KEY

src/
├── components/
│   ├── MercadoPagoReturn.jsx  # NUEVO: página de retorno con tracking Google Ads
│   ├── HeroExpress.jsx        # Modificar: agregar selector de pasarela
│   ├── PagarConCodigo.jsx     # Modificar: agregar selector de pasarela
│   └── ConsultarReserva.jsx   # Modificar: agregar selector de pasarela
└── App.jsx                    # Agregar ruta /mp-return → MercadoPagoReturn
```

---

## Variables de Entorno Completas del Proyecto

Al agregar MP, el backend necesita estas variables adicionales en Render:

```env
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXX
MP_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXXX
# MP_WEBHOOK_SECRET=XXXXXXXX  (opcional, para verificar firma HMAC de webhooks)
```
