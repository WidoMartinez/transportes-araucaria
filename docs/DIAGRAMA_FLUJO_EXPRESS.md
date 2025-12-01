# Diagrama de Flujo - Módulo Express

## 🔴 ANTES (Flujo Original)

```
┌─────────────────────────────────────────────┐
│         PASO 2: Datos y Pago                │
├─────────────────────────────────────────────┤
│                                             │
│  📋 Resumen del viaje                       │
│  ├─ Ruta: Aeropuerto → Pucón               │
│  ├─ Fecha: 15/10/2025                      │
│  └─ Pasajeros: 2                           │
│                                             │
│  👤 Datos personales                        │
│  ├─ Nombre: [_________________]            │
│  ├─ Email:  [_________________]            │
│  └─ Teléfono: [_________________]          │
│                                             │
│  💳 Opciones de pago                        │
│  ├─ [ ] Reservar con 40%                   │
│  └─ [ ] Pagar el 100%                      │
│                                             │
│  (Opciones de pago visibles solo después   │
│   de completar datos)                       │
│                                             │
│  ✅ [ ] Acepto términos...                  │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  [← Volver]  [Confirmar reserva →] │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  PROBLEMA:                                  │
│  - Usuario DEBE confirmar antes de ver     │
│    opciones de pago completas               │
│  - No hay opción de guardar sin pagar      │
│  - Flujo confuso con muchos pasos           │
└─────────────────────────────────────────────┘
```

## 🟢 DESPUÉS (Nuevo Flujo)

```
┌─────────────────────────────────────────────┐
│         PASO 2: Datos y Pago                │
├─────────────────────────────────────────────┤
│                                             │
│  📋 Resumen del viaje                       │
│  ├─ Ruta: Aeropuerto → Pucón               │
│  ├─ Fecha: 15/10/2025                      │
│  └─ Pasajeros: 2                           │
│                                             │
│  👤 Datos personales                        │
│  ├─ Nombre: [_________________]            │
│  ├─ Email:  [_________________]            │
│  └─ Teléfono: [_________________]          │
│                                             │
│  🎟️ ¿Código de descuento?                  │
│  └─ [_________________] [Aplicar]          │
│                                             │
│  ✅ [ ] Acepto términos...                  │
│                                             │
│  ╔═══════════════════════════════════════╗ │
│  ║  💳 Opciones de pago                  ║ │
│  ╠═══════════════════════════════════════╣ │
│  ║                                       ║ │
│  ║  Elige cuánto deseas pagar ahora:    ║ │
│  ║                                       ║ │
│  ║  ┌──────────────┐ ┌──────────────┐  ║ │
│  ║  │ Reservar con │ │  Pagar el    │  ║ │
│  ║  │     40%      │ │    100%      │  ║ │
│  ║  │              │ │              │  ║ │
│  ║  │  $24.000 CLP │ │ $60.000 CLP  │  ║ │
│  ║  └──────────────┘ └──────────────┘  ║ │
│  ║                                       ║ │
│  ║  Elige tu método de pago:            ║ │
│  ║                                       ║ │
│  ║  ┌──────────────┐ ┌──────────────┐  ║ │
│  ║  │   [Flow]     │ │ [MercadoPago]│  ║ │
│  ║  │   💳 🏦 💸   │ │    💳 💰     │  ║ │
│  ║  └──────────────┘ └──────────────┘  ║ │
│  ║                                       ║ │
│  ║  Click → Guarda + Redirige a pago   ║ │
│  ╚═══════════════════════════════════════╝ │
│                                             │
│  ╔═══════════════════════════════════════╗ │
│  ║  💾 Guardar y continuar después       ║ │
│  ╠═══════════════════════════════════════╣ │
│  ║                                       ║ │
│  ║  Guarda tu reserva ahora y recibe    ║ │
│  ║  un enlace por email para pagar      ║ │
│  ║  más tarde                            ║ │
│  ║                                       ║ │
│  ║  ┌──────────────────────────────┐    ║ │
│  ║  │ Guardar reserva para después │    ║ │
│  ║  └──────────────────────────────┘    ║ │
│  ║                                       ║ │
│  ║  Click → Guarda + Email con enlace   ║ │
│  ╚═══════════════════════════════════════╝ │
│                                             │
│  ╔═══════════════════════════════════════╗ │
│  ║ ✅ ¿Listo para pagar? Selecciona el  ║ │
│  ║ monto y método de pago arriba         ║ │
│  ║                                       ║ │
│  ║ Al elegir una opción de pago, tu     ║ │
│  ║ reserva se guardará automáticamente   ║ │
│  ╚═══════════════════════════════════════╝ │
│                                             │
│  [← Volver]                                 │
│                                             │
│  VENTAJAS:                                  │
│  ✅ Dos opciones claras: pagar o guardar   │
│  ✅ Pago directo en menos pasos             │
│  ✅ Captura leads sin pago inmediato        │
│  ✅ Instrucciones claras y visuales         │
└─────────────────────────────────────────────┘
```

## Comparación de Flujos

### 🔴 Flujo Original

```
Usuario completa datos
        ↓
Acepta términos
        ↓
Click "Confirmar reserva"
        ↓
Sistema guarda reserva
        ↓
Usuario ve opciones de pago completas
        ↓
Usuario selecciona y paga
```

**Problemas:**
- 🔴 Muchos pasos
- 🔴 No hay opción de guardar sin pagar
- 🔴 Confuso para el usuario

### 🟢 Nuevo Flujo - Opción 1: Pago Inmediato

```
Usuario completa datos
        ↓
Acepta términos
        ↓
Ve opciones de pago INMEDIATAMENTE
        ↓
Selecciona monto (40% o 100%)
        ↓
Selecciona método (Flow/MercadoPago)
        ↓
Sistema guarda reserva AUTOMÁTICAMENTE
        ↓
Redirige a pasarela de pago
```

**Ventajas:**
- ✅ Menos pasos
- ✅ Pago más rápido
- ✅ Claridad inmediata

### 🟢 Nuevo Flujo - Opción 2: Guardar para Después

```
Usuario completa datos
        ↓
Acepta términos
        ↓
Click "Guardar reserva para después"
        ↓
Sistema guarda reserva
        ↓
Sistema envía email con enlace de pago
        ↓
Usuario confirma y puede pagar después
```

**Ventajas:**
- ✅ Captura lead
- ✅ Usuario no presionado
- ✅ Email con enlace de pago

## Elementos de la Interfaz

### Sección de Pago Directo (Verde)
- **Color**: Fondo verde claro (`bg-green-50`)
- **Posición**: Arriba, después de aceptar términos
- **Contenido**:
  - Título: "💳 Opciones de pago"
  - Selector de monto: 2 tarjetas (40% / 100%)
  - Selector de método: 2 botones (Flow / MercadoPago)
  - Instrucción clara sobre el proceso

### Sección de Guardar para Después (Azul)
- **Color**: Fondo azul claro (`bg-blue-50`)
- **Posición**: Abajo, separada visualmente
- **Contenido**:
  - Título: "💾 Guardar y continuar después"
  - Descripción: Explicación del proceso
  - Botón: "Guardar reserva para después"
  - Estilo diferenciado (outline azul)

### Mensaje Instructivo (Verde)
- **Color**: Fondo verde claro (`bg-green-50`)
- **Posición**: Debajo del botón de guardar
- **Contenido**:
  - Confirma que las opciones están arriba
  - Explica que guardar es automático al pagar

## Código Clave

### Función de Guardar sin Pagar

```javascript
const handleGuardarReserva = async () => {
    if (!validarDatosReserva()) return;
    
    const result = await onSubmitWizard();
    
    if (result.success) {
        alert("✅ Reserva guardada. Te enviamos email con enlace de pago.");
    }
};
```

### Función de Pagar (Guarda + Redirige)

```javascript
const handleProcesarPago = async (gateway, type) => {
    if (!validarDatosReserva()) return;
    
    // Primero guardar
    const result = await onSubmitWizard();
    
    if (result.success) {
        // Luego redirigir a pago
        handlePayment(gateway, type);
    }
};
```

## Flujo de Datos

```
HeroExpress.jsx
     │
     ├─── handleGuardarReserva()
     │         │
     │         └──→ onSubmitWizard()
     │                  │
     │                  └──→ App.jsx: enviarReservaExpress()
     │                           │
     │                           ├──→ PHP: enviar_correo_mejorado.php
     │                           │         └─→ Email al admin
     │                           │
     │                           └──→ Backend: /enviar-reserva-express
     │                                     └─→ Guarda en DB
     │
     └─── handleProcesarPago(gateway, type)
               │
               ├──→ onSubmitWizard() (igual que arriba)
               │
               └──→ handlePayment(gateway, type)
                         │
                         └──→ Backend: /create-payment
                                  └─→ Genera URL de pago
                                       └─→ window.open(url)
```

## Notificaciones por Email

En ambos casos se envía email con:
- ✅ Datos del cliente
- ✅ Detalles del viaje
- ✅ Precio cotizado
- ✅ Enlace para completar pago (si no pagó inmediatamente)

## Resumen de Cambios en el Código

| Antes | Después |
|-------|---------|
| `handleStepTwoNext()` | `validarDatosReserva()` (extracción) |
| Botón "Confirmar reserva" | Botón "Guardar reserva para después" |
| Sin opción de guardar sin pagar | Nueva opción destacada |
| Botones de pago llaman a `handlePayment()` | Botones llaman a `handleProcesarPago()` |
| Confirmación → Opciones de pago | Opciones de pago SIEMPRE visibles |

## Compatibilidad

✅ **Frontend**: React + Vite
✅ **Backend**: Node.js + Express en Render.com (sin cambios)
✅ **Emails**: PHPMailer en Hostinger (sin cambios)
✅ **Pagos**: Flow + Mercado Pago (sin cambios)
✅ **Base de datos**: PostgreSQL en Render.com (sin cambios)
