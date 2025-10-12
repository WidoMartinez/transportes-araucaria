# Módulo de Pago Personalizado con Sistema de Códigos

## 📋 Descripción

El módulo de **Pago Personalizado** permite a los clientes generar de forma autónoma enlaces de pago para traslados y valores personalizados que no están disponibles en la base de datos del sistema, utilizando un **sistema de códigos** simple y eficiente.

## 🎯 Problema que resuelve

Anteriormente, cuando los clientes contactaban por WhatsApp para solicitar pagos de tramos personalizados (que no están en la base de datos), el administrador tenía que:
1. Solicitar los datos manualmente
2. Generar el link de pago con valores personalizados
3. Enviar el link al cliente
4. El cliente tenía que llenar todos los datos del traslado nuevamente

Esto consumía mucho tiempo y generaba fricción en el proceso de pago.

## ✨ Solución con Sistema de Códigos

Ahora el proceso es mucho más simple:

### Para el administrador:
1. Crea un código simple como `A-CARAHUE-35` (Aeropuerto → Carahue por $35.000)
2. Envía el link con el código al cliente: `/?view=pago-personalizado&codigo=A-CARAHUE-35`
3. El cliente solo completa sus datos personales y procede al pago

### Para el cliente:
1. Recibe un código o link del administrador
2. Ingresa el código (si no está en el link)
3. Los datos del traslado se cargan automáticamente
4. Completa sus datos personales (nombre, email, teléfono)
5. Completa detalles del viaje (dirección, fecha, hora)
6. Selecciona método de pago y procede

## 🔑 Sistema de Códigos

### Formato del código: `ORIGEN-DESTINO-MONTO`

**Estructura:**
- **ORIGEN**: Origen del traslado (puede usar abreviaciones)
- **DESTINO**: Destino del traslado
- **MONTO**: Valor en miles de pesos (ej: 35 = $35.000)

**Ejemplos válidos:**
```
A-CARAHUE-35          → Aeropuerto La Araucanía → Carahue por $35.000
TEMUCO-PUCON-60       → Temuco → Pucón por $60.000
A-LONQUIMAY-45        → Aeropuerto → Lonquimay por $45.000
VILLARRICA-TEMUCO-25  → Villarrica → Temuco por $25.000
```

### Abreviaciones soportadas

**Orígenes:**
- `A` o `AEROPUERTO` → Aeropuerto La Araucanía
- `TEMUCO` → Temuco
- `VILLARRICA` → Villarrica
- `PUCON` → Pucón
- `LONQUIMAY` → Lonquimay

**Destinos:**
- `CARAHUE` → Carahue
- `TEMUCO` → Temuco
- `VILLARRICA` → Villarrica
- `PUCON` → Pucón
- `LONQUIMAY` → Lonquimay
- `CURACAUTIN` → Curacautín
- `VICTORIA` → Victoria
- `MALALCAHUELLO` → Malalcahuello
- `CONGUILLIO` o `CONGUILLÍO` → Parque Nacional Conguillío
- `CORRALCO` → Corralco
- `ICALMA` → Laguna Icalma

## 🔗 Formas de acceder

### Opción 1: Con código en la URL (RECOMENDADO)
```
/?view=pago-personalizado&codigo=A-CARAHUE-35
```
El cliente solo ve el formulario con los datos ya cargados.

### Opción 2: Link directo para que el cliente ingrese el código
```
/?view=pago-personalizado
```
El cliente ingresa manualmente el código que recibió.

### Opción 3: Desde el menú de navegación
- En desarrollo: Click en "Pago Personalizado" en el header
- En producción: `https://www.transportesaraucaria.cl/pago-personalizado`

## 📱 Flujo de uso

### Flujo recomendado (con código)

**Paso 1 - Administrador:**
1. Cliente contacta por WhatsApp solicitando traslado Aeropuerto → Carahue
2. Administrador acuerda precio: $35.000
3. Administrador crea código: `A-CARAHUE-35`
4. Envía mensaje: "Tu código de pago es: A-CARAHUE-35. Paga aquí: [link]"
   - Link: `https://transportesaraucaria.cl/?view=pago-personalizado&codigo=A-CARAHUE-35`

**Paso 2 - Cliente:**
1. Abre el link
2. Ve los datos del traslado ya cargados (origen, destino, monto)
3. Completa solo sus datos:
   - Nombre completo
   - Email
   - Teléfono
   - Dirección exacta (hotel, dirección)
   - Fecha y hora del traslado
4. Selecciona método de pago (Flow o Mercado Pago)
5. Completa el pago en ventana segura

### Flujo alternativo (sin código en URL)

**Para el cliente:**
1. Recibe código por WhatsApp: "Tu código es A-CARAHUE-35"
2. Accede a `/?view=pago-personalizado`
3. Ingresa el código `A-CARAHUE-35` en el campo
4. Datos se cargan automáticamente
5. Completa sus datos personales y detalles del viaje
6. Procede al pago

## 🎨 Características

### Sistema de códigos inteligente
- **Parseo automático**: El código se procesa en tiempo real
- **Validación instantánea**: Muestra si el código es válido o no
- **Mapeo de abreviaciones**: `A` se convierte en "Aeropuerto La Araucanía"
- **Cálculo automático**: El monto en el código (ej: 35) se convierte a $35.000
- **Campos bloqueados**: Origen, destino y monto no se pueden modificar cuando viene de código

### Validación en tiempo real
- Todos los campos obligatorios están marcados con asterisco rojo (*)
- Los botones de pago solo se habilitan cuando todos los campos son válidos
- Validación de formato de email
- Validación de fecha (no permite fechas pasadas)
- Formateo automático de montos en pesos chilenos (CLP)

### Campos inteligentes
- **Dirección dinámica**: El label cambia según el origen
  - Si es desde aeropuerto: "Dirección de llegada"
  - Si no es aeropuerto: "Dirección de origen"
- **Fecha y hora requeridas**: Para coordinar el traslado correctamente
- **Descripción incluida en el pago**: Todos los detalles se envían a la pasarela

### Seguridad
- Integración directa con el backend existente (`/create-payment`)
- Sin modificaciones al backend
- Validación de datos antes de enviar
- Apertura de ventana segura para pagos
- No se almacenan datos sensibles en el frontend

### Experiencia de usuario
- Interfaz limpia y profesional
- Mensajes de ayuda contextuales
- Feedback visual inmediato (✓ Código válido)
- Compatible con dispositivos móviles
- Pre-llenado automático desde URL o código
- Proceso simplificado: menos campos que llenar para el cliente

## 🛠️ Implementación técnica

### Archivos nuevos
- `src/components/PagoPersonalizado.jsx` - Componente principal del módulo

### Archivos modificados
- `src/App.jsx` - Agregado import, resolver y renderizado condicional
- `src/components/Header.jsx` - Agregado link en navegación

### Integración con backend
El módulo usa el mismo endpoint del backend que el sistema regular:
```javascript
POST /create-payment
{
  gateway: "mercadopago" | "flow",
  amount: number,
  description: string,
  email: string,
  reservationId: null
}
```

**No se requieren cambios en el backend.**

## 📊 Casos de uso

### Ejemplo 1: Traslado desde aeropuerto
**Código:** `A-CARAHUE-35`
**Resultado:**
- Origen: Aeropuerto La Araucanía
- Destino: Carahue
- Monto: $35.000
- Cliente completa: nombre, email, teléfono, dirección de llegada, fecha, hora

### Ejemplo 2: Transfer inter-ciudades
**Código:** `TEMUCO-PUCON-60`
**Resultado:**
- Origen: Temuco
- Destino: Pucón
- Monto: $60.000
- Cliente completa: datos personales, dirección de origen, fecha, hora

### Ejemplo 3: Ruta turística
**Código:** `A-CONGUILLIO-70`
**Resultado:**
- Origen: Aeropuerto La Araucanía
- Destino: Parque Nacional Conguillío
- Monto: $70.000
- Cliente completa: sus datos y detalles del viaje

### Ejemplo 4: Link compartible
**WhatsApp:**
```
¡Hola! Para pagar tu traslado Aeropuerto → Carahue, 
usa este link: 
https://transportesaraucaria.cl/?view=pago-personalizado&codigo=A-CARAHUE-35

Tu código es: A-CARAHUE-35
Solo completa tus datos y procede al pago 💳
```

## 🔒 Notas de seguridad

- El módulo no guarda información sensible en el frontend
- Los pagos se procesan a través de las pasarelas oficiales (Flow y Mercado Pago)
- Los emails de confirmación se envían desde el backend
- No se exponen credenciales de API en el cliente

## 🌐 Compatibilidad

- ✅ Funciona en localhost (desarrollo)
- ✅ Funciona en Hostinger (producción)
- ✅ Compatible con navegadores modernos
- ✅ Responsive (móvil y desktop)
- ✅ No requiere cambios en PHP del servidor

## 💡 Recomendaciones de uso

1. **Para administrador**: Genera links pre-llenados y compártelos directamente con clientes
2. **Para clientes**: Envíales el link limpio `/?view=pago-personalizado` y que ellos completen todo
3. **Para marketing**: Úsalo en campañas específicas con destinos personalizados

## 🎯 Beneficios

- ⏱️ **Ahorro de tiempo**: El administrador ya no necesita generar links manualmente
- 🤝 **Autonomía del cliente**: Los clientes pueden pagar sin intermediarios
- 📈 **Escalabilidad**: Maneja múltiples solicitudes simultáneas sin problemas
- 💼 **Profesionalismo**: Proceso automatizado y confiable
- 🔄 **Flexibilidad**: Funciona para cualquier origen/destino/monto

## 📞 Soporte

Para cualquier consulta o problema:
- WhatsApp: +56 9 3664 3540
- Email: contacto@transportesaraucaria.cl

---

**Versión**: 1.0  
**Fecha**: Octubre 2025  
**Autor**: Sistema Transportes Araucaria
