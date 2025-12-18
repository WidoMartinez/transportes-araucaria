# 📊 Conversiones Avanzadas de Google Ads - Implementación

## 🎯 ¿Qué son las Conversiones Avanzadas?

Las **Conversiones Avanzadas** (Enhanced Conversions) de Google Ads son una función que mejora la precisión del seguimiento de conversiones enviando datos de usuario de manera segura y hasheada a Google Ads.

### Beneficios

- ✅ **Mayor precisión**: Mejora el seguimiento de conversiones hasta un 20%
- 🔒 **Seguridad**: Los datos se hashean automáticamente con SHA-256
- 📈 **Mejor optimización**: Permite a Google Ads optimizar mejor las campañas
- 🎯 **Remarketing mejorado**: Datos más precisos para audiencias personalizadas

### Datos Enviados

Según la documentación oficial de Google ([enlace](https://support.google.com/google-ads/answer/13258081)), enviamos:

```javascript
{
  email: 'usuario@ejemplo.com',           // Hasheado por Google
  phone_number: '+56912345678',           // Hasheado por Google
  address: {
    first_name: 'juan',                   // Hasheado por Google
    last_name: 'pérez',                   // Hasheado por Google
    country: 'CL'                         // Chile
  }
}
```

**IMPORTANTE:** Los datos se envían en texto plano pero Google los hashea automáticamente en el servidor. **NO debemos** hashearlos nosotros.

---

## 🚀 Flujos de Pago Implementados

### 1. ✅ Flujo Principal - HeroExpress

**Componente:** `src/components/HeroExpress.jsx`

**Proceso:**
1. Cliente completa formulario de reserva
2. Ingresa email, teléfono y nombre
3. Paga a través de Flow
4. Flow redirige a `/flow-return` con datos de usuario
5. Se dispara conversión avanzada con datos del cliente

**Datos disponibles:**
- ✅ Email (desde formData)
- ✅ Teléfono (desde formData)
- ✅ Nombre completo (desde formData)

**Ejemplo de URL de retorno:**
```
https://www.transportesaraucaria.cl/flow-return
  ?token=HERO_12345
  &status=success
  &reserva_id=123
  &amount=50000
  &email=juan@ejemplo.com
  &nombre=Juan%20Pérez
  &telefono=%2B56912345678
```

---

### 2. ✅ Flujo Pago con Código - PagarConCodigo

**Componente:** `src/components/PagarConCodigo.jsx`

**Proceso:**
1. Cliente recibe código por WhatsApp
2. Valida código en el sistema
3. Completa datos personales (email, teléfono, nombre)
4. Paga a través de Flow
5. Flow redirige a `/flow-return` con datos de usuario
6. Se dispara conversión avanzada con datos del cliente

**Datos disponibles:**
- ✅ Email (ingresado en formulario)
- ✅ Teléfono (ingresado en formulario)
- ✅ Nombre completo (ingresado en formulario)

**Ejemplo de URL de retorno:**
```
https://www.transportesaraucaria.cl/flow-return
  ?token=CODIGO_12345
  &status=success
  &reserva_id=456
  &amount=75000
  &email=maria@ejemplo.com
  &nombre=María%20González
  &telefono=%2B56987654321
```

---

### 3. ✅ Flujo Consultar Reserva - ConsultarReserva

**Componente:** `src/components/ConsultarReserva.jsx`

**Proceso:**
1. Cliente busca reserva con código
2. Sistema muestra saldo pendiente
3. Cliente hace clic en "Pagar saldo"
4. Flow se abre en **nueva pestaña** (`window.open(data.url, "_blank")`)
5. Flow redirige a `/flow-return` **en la nueva pestaña**
6. Se dispara conversión avanzada con datos de la reserva

**Datos disponibles:**
- ✅ Email (desde reserva cargada)
- ✅ Teléfono (desde reserva cargada)
- ✅ Nombre completo (desde reserva cargada)

**⚠️ IMPORTANTE - Nueva Pestaña:**

Este flujo abre Flow en una nueva pestaña con `window.open(data.url, "_blank")` (línea 116 de ConsultarReserva.jsx).

✅ **Esto está BIEN** porque:
- Google Ads rastrea conversiones entre pestañas del mismo dominio
- El `transaction_id` único previene duplicados
- La cookie de `gtag` es compartida entre pestañas del mismo sitio

**Ejemplo de URL de retorno:**
```
https://www.transportesaraucaria.cl/flow-return
  ?token=SALDO_12345
  &status=success
  &reserva_id=789
  &amount=30000
  &email=carlos@ejemplo.com
  &nombre=Carlos%20López
  &telefono=%2B56956789012
```

---

## 📝 Implementación Técnica

### Frontend - `src/components/FlowReturn.jsx`

**Líneas modificadas:** ~62-90

La función `triggerConversion` fue modificada para:

1. **Extraer datos de URL:**
```javascript
const urlParams = new URLSearchParams(window.location.search);
const userEmail = urlParams.get('email');
const userName = urlParams.get('nombre');
const userPhone = urlParams.get('telefono');
```

2. **Normalizar datos:**
```javascript
// Email: lowercase y trim
conversionData.email = userEmail.toLowerCase().trim();

// Teléfono: eliminar espacios y caracteres especiales
const phoneNormalized = userPhone.replace(/[\s\-\(\)]/g, '');
conversionData.phone_number = phoneNormalized;
```

3. **Separar nombre:**
```javascript
const nameParts = userName.trim().split(' ');
const firstName = nameParts[0] || '';
const lastName = nameParts.slice(1).join(' ') || '';

conversionData.address = {
  first_name: firstName.toLowerCase(),
  last_name: lastName.toLowerCase(),
  country: 'CL'
};
```

4. **Enviar a Google:**
```javascript
window.gtag("event", "conversion", conversionData);
```

### Backend - `backend/server-db.js`

**Líneas modificadas:** ~6399-6411

El endpoint `/api/payment-result` fue modificado para agregar datos de usuario a la URL de retorno:

```javascript
// Extraer datos de la reserva
const emailEncoded = encodeURIComponent(reserva.email || '');
const nombreEncoded = encodeURIComponent(reserva.nombre || '');
const telefonoEncoded = encodeURIComponent(reserva.telefono || '');

// Redirigir con datos
return res.redirect(303, 
  `${frontendBase}/flow-return?token=${token}&status=success&reserva_id=${reservaId}&amount=${total}&email=${emailEncoded}&nombre=${nombreEncoded}&telefono=${telefonoEncoded}`
);
```

### Componente de Prueba - `src/components/TestGoogleAds.jsx`

**Líneas modificadas:** ~73-78

Agregados datos de prueba para verificar la implementación:

```javascript
const conversionData = {
  send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB",
  value: 1.0,
  currency: "CLP",
  transaction_id: testToken,
  // Datos de prueba para conversiones avanzadas
  email: 'test@example.com',
  phone_number: '+1234567890',
  address: {
    first_name: 'usuario',
    last_name: 'prueba',
    country: 'CL'
  }
};
```

---

## 🧪 Pruebas y Verificación

### Prueba 1: Flujo HeroExpress (localhost)

```bash
# Simular pago desde módulo principal
http://localhost:5173/flow-return?token=HERO_TEST_001&status=success&reserva_id=1&amount=50000&email=test@example.com&nombre=Juan%20Pérez&telefono=+56912345678
```

**Verificar en DevTools (F12) → Console:**
```
✅ Evento de conversión Google Ads disparado (ID: 1, Valor: 50000)
   - email: test@example.com
   - phone_number: +56912345678
   - address.first_name: juan
   - address.last_name: pérez
   - address.country: CL
```

### Prueba 2: Flujo PagarConCodigo (localhost)

```bash
# Simular pago con código
http://localhost:5173/flow-return?token=CODIGO_TEST_002&status=success&reserva_id=2&amount=75000&email=test@example.com&nombre=María%20González&telefono=+56987654321
```

**Verificar en DevTools (F12) → Console:**
```
✅ Evento de conversión Google Ads disparado (ID: 2, Valor: 75000)
   - email: test@example.com
   - phone_number: +56987654321
   - address.first_name: maría
   - address.last_name: gonzález
   - address.country: CL
```

### Prueba 3: Flujo ConsultarReserva (localhost)

```bash
# Simular pago de saldo (en nueva pestaña)
http://localhost:5173/flow-return?token=SALDO_TEST_003&status=success&reserva_id=3&amount=30000&email=test@example.com&nombre=Carlos%20López&telefono=+56956789012
```

**Verificar en DevTools (F12) → Console:**
```
✅ Evento de conversión Google Ads disparado (ID: 3, Valor: 30000)
   - email: test@example.com
   - phone_number: +56956789012
   - address.first_name: carlos
   - address.last_name: lópez
   - address.country: CL
```

### Prueba 4: Componente de Prueba

1. Ir a `http://localhost:5173/test-google-ads`
2. Hacer clic en "Disparar Evento de Conversión"
3. Verificar logs en el panel derecho:
   - ✅ `email: test@example.com`
   - ✅ `phone_number: +1234567890`
   - ✅ `address.first_name: usuario`
   - ✅ `address.last_name: prueba`
   - ✅ `address.country: CL`

### Verificar en DevTools → Network

1. Abrir DevTools (F12)
2. Ir a pestaña "Network" (Red)
3. Filtrar por "collect" o "google-analytics"
4. Buscar petición a `doubleclick.net` o `google-analytics.com`
5. Verificar parámetros:
   - `em` (email hasheado)
   - `ph` (phone hasheado)
   - `fn` (first name hasheado)
   - `ln` (last name hasheado)
   - `ct` (country)

---

## ✅ Verificación en Google Ads

### Después de 24-48 horas

1. Ir a **Google Ads → Herramientas → Conversiones**
2. Seleccionar la conversión configurada
3. Hacer clic en **"Diagnóstico"**
4. Verificar mensaje:

```
✅ "Tu configuración de conversiones avanzadas está activa"
```

### Indicadores de Éxito

- **Estado:** Activo ✅
- **Conversiones detectadas:** > 0
- **Datos de usuario coincidentes:** > 70%
- **Tasa de coincidencia mejorada:** +15-20%

---

## 🔒 Consideraciones de Privacidad

### Cumplimiento GDPR y Normativas

1. **Hasheo automático:** Google hashea los datos con SHA-256 en el servidor
2. **No almacenamiento local:** Los datos no se guardan en navegador
3. **Transmisión segura:** HTTPS obligatorio
4. **Uso limitado:** Solo para optimización de campañas

### Política de Privacidad

La política de privacidad debe incluir:

> "Utilizamos Google Ads para optimizar nuestras campañas publicitarias. 
> Los datos personales proporcionados durante el proceso de reserva 
> (email, teléfono, nombre) son enviados de manera segura y hasheada a 
> Google Ads para mejorar la precisión del seguimiento de conversiones. 
> Google no utiliza estos datos para ningún otro propósito."

### Derechos del Usuario

Los usuarios pueden:
- ❌ Opt-out de seguimiento de Google Ads
- 🔒 Solicitar eliminación de datos
- 📧 Contactar para preguntas sobre privacidad

---

## 📚 Referencias

- [Documentación oficial de Google Ads - Enhanced Conversions](https://support.google.com/google-ads/answer/13258081)
- [Implementación actual de Google Ads](IMPLEMENTACION_GOOGLE_ADS_CONVERSION.md)
- [Guía de verificación de Google Ads](GUIA_VERIFICACION_GOOGLE_ADS.md)
- [Sistema de códigos de pago](SISTEMA_CODIGOS_PAGO.md)

---

## 🐛 Troubleshooting

### Problema: No se envían datos de usuario

**Solución:**
1. Verificar que la URL tenga los parámetros `email`, `nombre`, `telefono`
2. Revisar console para ver si hay errores
3. Verificar que la reserva tenga los datos en la base de datos

### Problema: Datos no aparecen en Google Ads

**Solución:**
1. Esperar 24-48 horas (tiempo de procesamiento de Google)
2. Verificar que el evento se dispare en DevTools → Network
3. Confirmar que `gtag` esté disponible en la página

### Problema: Conversión funciona pero sin datos avanzados

**Solución:**
1. Verificar que los datos estén en la petición HTTP (DevTools → Network)
2. Asegurarse de que el dominio tenga certificado SSL (HTTPS)
3. Contactar soporte de Google Ads para verificar configuración

---

## 📞 Soporte

Para preguntas sobre esta implementación:
- 📧 Email: contacto@transportesaraucaria.cl
- 📱 WhatsApp: +569 3664 3540

---

**Última actualización:** Diciembre 2024
**Versión:** 1.0.0
