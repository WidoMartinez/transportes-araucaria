# Cambios en la Lógica de Envío de Correos Según Estado de Pago

## Resumen de Cambios

Este documento describe las modificaciones realizadas en el sistema de envío de correos electrónicos para cumplir con los siguientes requisitos:

1. **Eliminar todo tipo de correo al cliente que NO haya pagado el servicio** (excepto el correo de descuento)
2. **Enviar correo único de descuento** a clientes que NO han pagado para captar su atención
3. **Mantener el envío de correo normal** cuando el cliente paga el servicio
4. **El número +569 1234 5678 NO debe utilizarse para contacto** (solo se usa como ejemplo en placeholders)

---

## Archivos Modificados

### 1. `enviar_correo_mejorado.php` (PHP - Hostinger)

**Ubicación:** Raíz del proyecto / Hostinger

**Cambios realizados:**

- Agregada variable `$estadoPago` para detectar el estado de pago del cliente
- Agregada variable `$clienteHaPagado` que verifica si el cliente ha pagado (estados: `aprobado`, `pagado`, `parcial`)
- Nueva lógica condicional para el envío de correo al cliente:
  - **Si el cliente HA PAGADO**: Se envía el correo de confirmación normal con los detalles de la reserva
  - **Si el cliente NO HA PAGADO**: Se envía un correo único ofreciendo un 15% de descuento para incentivar el pago

**Plantilla del correo de descuento incluye:**
- Header con gradiente verde atractivo
- Precio original tachado
- Precio con descuento destacado
- Detalles de la reserva
- Información de contacto: contacto@transportesaraucaria.cl y +569 3664 3540
- Nota de oferta por tiempo limitado

### 2. `enviar_asignacion_reserva.php` (PHP - Hostinger)

**Ubicación:** Raíz del proyecto / Hostinger

**Cambios realizados:**

- Agregada verificación del estado de pago antes de enviar el correo
- Si el cliente NO ha pagado, el correo de asignación de vehículo NO se envía
- Se retorna una respuesta indicando que el correo fue omitido por falta de pago confirmado

### 3. `backend/server-db.js` (Node.js - Render.com)

**Ubicación:** backend/server-db.js

**Cambios realizados:**

- En el endpoint `/enviar-reserva`: Se incluye el `estadoPago` en los datos enviados al PHP
- En el endpoint `/enviar-reserva-express`: Se incluye el `estadoPago` en los datos enviados al PHP
- En la asignación de vehículo/conductor: Se incluye el `estadoPago` para que el PHP pueda verificar si debe enviar el correo

---

## ⚠️ IMPORTANTE: Despliegue Manual en Hostinger

Los archivos PHP modificados deben ser subidos manualmente al servidor de Hostinger:

1. Conectar a Hostinger vía FTP o File Manager
2. Subir los siguientes archivos a la raíz del dominio:
   - `enviar_correo_mejorado.php`
   - `enviar_asignacion_reserva.php`
3. Verificar permisos (644)
4. Verificar que `config_reservas.php` existe con credenciales SMTP correctas

---

## Flujo de Correos Actualizado

```
┌─────────────────────────────────────────────────────────────┐
│                    NUEVA RESERVA                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────┐
               │   ¿Cliente ha pagado?        │
               │   (estadoPago en payload)    │
               └──────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────┐            ┌─────────────────┐
    │  SÍ - PAGADO    │            │  NO - PENDIENTE │
    │  (aprobado,     │            │                 │
    │   pagado,       │            │                 │
    │   parcial)      │            │                 │
    └─────────────────┘            └─────────────────┘
              │                               │
              ▼                               ▼
    ┌─────────────────┐            ┌─────────────────┐
    │ CORREO NORMAL   │            │ CORREO DESCUENTO│
    │ • Confirmación  │            │ • Oferta 15%    │
    │ • Detalles      │            │ • Precio esp.   │
    │ • Resumen       │            │ • CTA contacto  │
    └─────────────────┘            └─────────────────┘
```

---

## Contacto para Soporte

El número de teléfono válido para contacto es: **+569 3664 3540**

⚠️ **IMPORTANTE:** El número +569 1234 5678 es solo un ejemplo/placeholder y NO debe utilizarse para contacto real.

---

## Fecha de Implementación

Diciembre 2024

---

## Archivos que NO Requieren Cambios

- `enviar_correo_completo.php` - Ya no envía correos al cliente, solo al administrador
- `enviar_confirmacion_pago.php` - Solo se ejecuta cuando el pago está confirmado (después de Flow)
- `enviar_notificacion_productos.php` - Solo se ejecuta después de pago confirmado
