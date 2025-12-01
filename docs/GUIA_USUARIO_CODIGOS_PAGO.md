# Guía de Usuario: Pago con Código

## Para Clientes 👤

### ¿Qué es un código de pago?

Un código de pago es un identificador único que te enviamos por WhatsApp para que puedas pagar tu traslado directamente en nuestra página web.

**Ejemplo de código:** `A-TCO-25`

### ¿Cómo usar mi código?

#### Paso 1: Recibe tu código
Te enviamos el código por WhatsApp junto con los detalles de tu traslado.

#### Paso 2: Ingresa a la página de pago
Visita: [www.transportesaraucaria.cl/#pagar-codigo](https://www.transportesaraucaria.cl/#pagar-codigo)

#### Paso 3: Valida tu código
1. Ingresa el código que recibiste (ejemplo: `A-TCO-25`)
2. Haz clic en "Validar"
3. Verás un resumen de tu servicio:
   - 📍 Origen y destino
   - 💰 Monto total
   - 🚐 Tipo de vehículo
   - 👥 Número de pasajeros

#### Paso 4: Completa tus datos
Ingresa tu información personal:
- ✅ Nombre completo
- ✅ Correo electrónico
- ✅ Teléfono
- Número de vuelo (opcional)
- Hotel (opcional)

#### Paso 5: Elige tu método de pago
Puedes pagar con:
- **Flow:** Webpay, Tarjetas, Transferencia
- **Mercado Pago:** Tarjetas, Billetera digital

#### Paso 6: Completa el pago
Serás redirigido a la plataforma de pago segura. Sigue las instrucciones para completar tu pago.

#### Paso 7: Recibe tu confirmación
Una vez completado el pago:
- ✅ Recibirás un email de confirmación
- ✅ Te llegará tu código de reserva
- ✅ Nos pondremos en contacto para coordinar detalles finales

### ¿Qué pasa si mi código no funciona?

**Posibles razones:**

1. **Código incorrecto:** Verifica que lo ingresaste correctamente
2. **Código ya usado:** Solo se puede usar una vez
3. **Código vencido:** Contacta con nosotros para uno nuevo

**Solución:** Contáctanos por WhatsApp para verificar tu código

### Preguntas Frecuentes

**¿Puedo usar mi código más de una vez?**
No, cada código es de un solo uso. Si necesitas hacer otra reserva, te enviaremos un nuevo código.

**¿Mi código tiene vencimiento?**
Algunos códigos tienen fecha de vencimiento. Te lo indicaremos al enviártelo por WhatsApp.

**¿Puedo cambiar el monto del código?**
No, el monto está fijado en el código. Si necesitas un servicio diferente, solicítanos un nuevo código.

**¿Es seguro pagar en la web?**
Sí, usamos plataformas de pago certificadas (Flow y Mercado Pago) con las máximas medidas de seguridad.

---

## Para Administradores 👨‍💼

### Crear un Código de Pago

#### Acceso al Panel
1. Ir a: [www.transportesaraucaria.cl/#admin](https://www.transportesaraucaria.cl/#admin)
2. Ingresar credenciales de administrador
3. Hacer clic en "Códigos de Pago"

#### Crear Nuevo Código

1. **Haz clic en "Nuevo Código"**

2. **Completa los datos requeridos:**
   - **Código*** (ej: A-TCO-25, A-VLL-35520)
   - **Monto*** (ej: 25000 o 35520 para montos no cerrados)
   - **Origen*** (ej: Aeropuerto Temuco)
   - **Destino*** (ej: Temuco Centro)

3. **Completa datos opcionales:**
   - Vehículo (ej: Sedan, Van)
   - Pasajeros (default: 1)
   - Descripción del servicio
   - Fecha de vencimiento
   - Usos máximos (default: 1)
   - Observaciones internas

4. **Haz clic en "Crear Código"**

5. **Envía el código al cliente:**
   - Copia el código generado
   - Envíalo por WhatsApp con los detalles del servicio

### Gestionar Códigos Existentes

#### Ver Todos los Códigos
En el panel de "Códigos de Pago" verás una tabla con:
- Código
- Ruta (origen → destino)
- Monto
- Estado (Activo, Usado, Vencido, Cancelado)
- Usos actuales/máximos
- Fecha de vencimiento

#### Estados de Códigos

| Estado | Descripción | Acción |
|--------|-------------|--------|
| 🟢 Activo | Puede ser usado | Cliente puede pagar |
| ⚫ Usado | Ya fue utilizado | No se puede reusar |
| 🔴 Vencido | Pasó la fecha límite | Crear nuevo código |
| ⚪ Cancelado | Cancelado manualmente | Crear nuevo código |

#### Eliminar un Código
- Solo se pueden eliminar códigos **no usados**
- Haz clic en el ícono de papelera
- Confirma la eliminación

### Convención de Códigos Sugerida

Para facilitar la identificación:

```
[Origen]-[Destino]-[Monto o referencia]
```

**Ejemplos:**
- `A-TCO-25` = Aeropuerto → Temuco ($25.000)
- `A-VLL-35` = Aeropuerto → Villarrica ($35.000)
- `P-TCO-30` = Pucón → Temuco ($30.000)
- `TCO-P-30` = Temuco → Pucón ($30.000)
- `A-M-45` = Aeropuerto → Malalcahuello ($45.000)
- `A-TCO-35520` = Aeropuerto → Temuco ($35.520) - monto no cerrado

**Nota:** El sistema acepta montos cerrados (25000) y no cerrados (35520).

**Prefijos Comunes:**
- `A` = Aeropuerto
- `TCO` = Temuco
- `VLL` = Villarrica
- `P` = Pucón
- `M` = Malalcahuello
- `L` = Lonquimay
- `C` = Conguillío

### Flujo de Trabajo Recomendado

1. **Cliente solicita cotización por WhatsApp**
   - Registra: origen, destino, fecha, pasajeros

2. **Crea el código de pago en el panel**
   - Usa la convención de nombres
   - Establece monto según tarifa
   - Agrega descripción para referencia

3. **Envía código al cliente por WhatsApp**
   ```
   ¡Hola! 👋
   
   Tu código de pago es: A-TCO-25
   
   📍 Servicio: Aeropuerto → Temuco Centro
   💰 Monto: $25.000
   🚐 Vehículo: Sedan (hasta 4 pasajeros)
   
   Para pagar:
   1. Ingresa a: www.transportesaraucaria.cl/#pagar-codigo
   2. Ingresa tu código: A-TCO-25
   3. Completa tus datos y paga
   
   ¿Dudas? Responde este mensaje 😊
   ```

4. **Monitorea el estado del código**
   - Revisa el panel para ver si fue usado
   - Una vez usado, verás la reserva asociada

5. **Coordina detalles finales**
   - Contacta al cliente para confirmar hora exacta
   - Asigna vehículo y conductor

### Casos Especiales

#### Cliente perdió su código
- Busca el código en el panel por email o nombre
- Reenvía el código por WhatsApp

#### Cliente necesita cambiar el servicio
- Cancela el código anterior (si no fue usado)
- Crea un nuevo código con los datos actualizados

#### Código usado por error
- El sistema marca automáticamente el código como usado
- Si fue un error, contacta a soporte técnico

#### Cliente quiere pagar en efectivo
- No crees código de pago
- Usa el flujo de reserva normal

### Reportes y Seguimiento

#### Ver códigos activos del día
- Filtrar por estado: "Activo"
- Revisar cuáles están pendientes de pago

#### Ver códigos usados
- Filtrar por estado: "Usado"
- Verificar reservas asociadas

#### Seguimiento de conversión
- Códigos creados vs. códigos usados
- Identificar códigos sin usar para hacer seguimiento

---

## Mensajes de WhatsApp Sugeridos 📱

### Envío de Código Inicial

```
¡Hola [Nombre]! 👋

Gracias por confiar en Transportes Araucaria.

Tu código de pago personalizado es:
🎟️ [CODIGO]

📋 Detalles de tu servicio:
📍 Origen: [Origen]
🎯 Destino: [Destino]
💰 Monto: $[Monto]
👥 Pasajeros: [N]
🚐 Vehículo: [Tipo]

Para pagar online:
1️⃣ Visita: www.transportesaraucaria.cl/#pagar-codigo
2️⃣ Ingresa tu código
3️⃣ Completa tus datos
4️⃣ Elige Flow o Mercado Pago
5️⃣ ¡Listo! Te confirmamos por email

¿Preguntas? ¡Escríbenos! 😊
```

### Recordatorio de Código No Usado

```
Hola [Nombre],

Te recordamos que tienes un código de pago pendiente:
🎟️ [CODIGO]

Para completar tu reserva, paga en:
👉 www.transportesaraucaria.cl/#pagar-codigo

Si ya no lo necesitas o tienes dudas, avísanos 😊
```

### Confirmación Después del Pago

```
¡Pago confirmado! ✅

Gracias [Nombre], recibimos tu pago.

📋 Código de reserva: [AR-XXXXXXXX-XXXX]
🎟️ Código de pago usado: [CODIGO]

Te enviamos todos los detalles a tu email.

Pronto nos contactaremos para coordinar:
- Hora exacta de recogida
- Punto de encuentro
- Datos del conductor

¡Nos vemos pronto! 🚐
```

---

## Soporte 🆘

### Para Clientes
- WhatsApp: [Número de contacto]
- Email: contacto@transportesaraucaria.cl
- Web: www.transportesaraucaria.cl

### Para Administradores
- Documentación técnica: Ver `SISTEMA_CODIGOS_PAGO.md`
- Soporte IT: [Contacto de soporte técnico]

---

**Versión:** 1.0  
**Última actualización:** 16 de octubre de 2025
