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

### Función de Normalización E.164 - `src/components/FlowReturn.jsx`

Se agregó una función para normalizar números de teléfono al formato internacional E.164:

```javascript
/**
 * Normaliza un número de teléfono al formato E.164 internacional
 * Formato E.164: +[código país][número]
 * Ejemplo: +56987654321 (Chile)
 */
function normalizePhoneToE164(phone) {
  if (!phone) return '';
  
  // Limpiar espacios, guiones, paréntesis y otros caracteres especiales
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Si ya tiene +56 al inicio, retornar
  if (cleaned.startsWith('+56')) {
    return cleaned;
  }
  
  // Si empieza con 56 (sin +), agregar +
  if (cleaned.startsWith('56')) {
    return '+' + cleaned;
  }
  
  // Si empieza con 9 (número chileno móvil), agregar +56
  if (cleaned.startsWith('9') && cleaned.length >= 9) {
    return '+56' + cleaned;
  }
  
  // Si no cumple ningún caso, asumir que es chileno y agregar +56
  return '+56' + cleaned;
}
```

**Ejemplos de conversión:**
- `'+56987654321'` → `'+56987654321'` ✅
- `'56987654321'` → `'+56987654321'` ✅
- `'987654321'` → `'+56987654321'` ✅
- `'9 8765 4321'` → `'+56987654321'` ✅
- `'(9) 8765-4321'` → `'+56987654321'` ✅

### Frontend - `src/components/FlowReturn.jsx`

**Líneas modificadas:** ~104-150

La función `triggerConversion` fue modificada para:

1. **Decodificar datos desde Base64 (nuevo formato seguro):**
```javascript
// Extraer datos de usuario de los parámetros URL para conversiones avanzadas
const urlParams = new URLSearchParams(window.location.search);

let userEmail = '';
let userName = '';
let userPhone = '';

// Intentar decodificar datos codificados en Base64 (nuevo formato seguro)
const encodedData = urlParams.get('d');
if (encodedData) {
  try {
    const decodedData = atob(encodedData); // Decodificar Base64
    const userData = JSON.parse(decodedData);
    userEmail = userData.email || '';
    userName = userData.nombre || '';
    userPhone = userData.telefono || '';
    console.log('✅ Datos de usuario decodificados desde parámetro Base64');
  } catch (error) {
    console.warn('⚠️ Error decodificando datos de usuario:', error);
    // Fallback a parámetros individuales (compatibilidad con URLs antiguas)
    userEmail = urlParams.get('email') || '';
    userName = urlParams.get('nombre') || '';
    userPhone = urlParams.get('telefono') || '';
  }
} else {
  // Fallback: Leer parámetros individuales (compatibilidad con URLs antiguas)
  userEmail = urlParams.get('email') || '';
  userName = urlParams.get('nombre') || '';
  userPhone = urlParams.get('telefono') || '';
}
```

2. **Normalizar teléfono a formato E.164:**
```javascript
// Email: lowercase y trim
conversionData.email = userEmail.toLowerCase().trim();

// Teléfono: normalizar al formato E.164 (+56...)
const phoneNormalized = normalizePhoneToE164(userPhone);
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

**Líneas modificadas:** ~6398-6420

El endpoint `/api/payment-result` fue modificado para codificar datos de usuario en Base64:

```javascript
// Crear objeto con datos de usuario para conversiones avanzadas de Google Ads
const userData = {
  email: reserva.email || '',
  nombre: reserva.nombre || '',
  telefono: reserva.telefono || ''
};

// Codificar datos de usuario en Base64 para mayor privacidad
const userDataEncoded = Buffer.from(JSON.stringify(userData)).toString('base64');

// Construir URL con datos codificados
const returnUrl = `${frontendBase}/flow-return?token=${token}&status=success&reserva_id=${reservaId}&amount=${total}&d=${userDataEncoded}`;

return res.redirect(303, returnUrl);
```

**Ejemplo de URL generada:**

```
https://www.transportesaraucaria.cl/flow-return
  ?token=ABC123
  &status=success
  &reserva_id=456
  &amount=75000
  &d=eyJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20iLCJub21icmUiOiJKdWFuIFDDqXJleiIsInRlbGVmb25vIjoiOTg3NjU0MzIxIn0=
```

**Decodificación del parámetro `d`:**
```bash
echo "eyJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20iLCJub21icmUiOiJKdWFuIFDDqXJleiIsInRlbGVmb25vIjoiOTg3NjU0MzIxIn0=" | base64 -d
# Resultado: {"email":"juan@example.com","nombre":"Juan Pérez","telefono":"987654321"}
```

### Compatibilidad con URLs Antiguas

El frontend mantiene compatibilidad con URLs que usen parámetros individuales:

```javascript
// URL nueva (con Base64):
/flow-return?token=ABC&d=eyJlbWFpbCI6...

// URL antigua (sin Base64):
/flow-return?token=ABC&email=juan@test.com&nombre=Juan&telefono=987654321

// ✅ Ambas funcionan correctamente gracias al fallback
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
  // Datos de prueba para conversiones avanzadas (formato E.164 para teléfono)
  email: 'test@example.com',
  phone_number: '+56987654321', // Formato E.164: +56 (Chile) + número móvil
  address: {
    first_name: 'usuario',
    last_name: 'prueba',
    country: 'CL'
  }
};
```

---

## 🧪 Pruebas y Verificación

### Prueba 1: Normalización de Teléfono

Probar diferentes formatos de entrada para verificar la normalización a E.164:

```javascript
// En la consola del navegador o en un test
normalizePhoneToE164('+56987654321')    // → '+56987654321' ✅
normalizePhoneToE164('56987654321')     // → '+56987654321' ✅
normalizePhoneToE164('987654321')       // → '+56987654321' ✅
normalizePhoneToE164('9 8765 4321')     // → '+56987654321' ✅
normalizePhoneToE164('(9) 8765-4321')   // → '+56987654321' ✅
normalizePhoneToE164('+56 9 8765 4321') // → '+56987654321' ✅
```

### Prueba 2: URL con Base64 (nuevo formato)

```bash
# URL nueva con datos codificados en Base64
http://localhost:5173/flow-return?token=TEST&status=success&reserva_id=1&amount=50000&d=eyJlbWFpbCI6Imp1YW5AdGVzdC5jb20iLCJub21icmUiOiJKdWFuIFDDqXJleiIsInRlbGVmb25vIjoiOTg3NjU0MzIxIn0=

# Decodificar para verificar (en bash):
echo "eyJlbWFpbCI6Imp1YW5AdGVzdC5jb20iLCJub21icmUiOiJKdWFuIFDDqXJleiIsInRlbGVmb25vIjoiOTg3NjU0MzIxIn0=" | base64 -d
# Resultado: {"email":"juan@test.com","nombre":"Juan Pérez","telefono":"987654321"}
```

**Verificar en DevTools Console:**
```
✅ Datos de usuario decodificados desde parámetro Base64
✅ Evento de conversión Google Ads disparado
   - email: juan@test.com
   - phone_number: +56987654321  // ← Normalizado a E.164 desde "987654321"
   - address: { first_name: 'juan', last_name: 'pérez', country: 'CL' }
```

### Prueba 3: Compatibilidad con URL Antigua (fallback)

```bash
# URL antigua con parámetros individuales (sin Base64)
http://localhost:5173/flow-return?token=TEST&status=success&reserva_id=1&amount=50000&email=juan@test.com&nombre=Juan%20Pérez&telefono=987654321
```

**Verificar en DevTools Console:**
```
✅ Evento de conversión Google Ads disparado
   - email: juan@test.com
   - phone_number: +56987654321  // ← Normalizado desde "987654321"
   - address: { first_name: 'juan', last_name: 'pérez', country: 'CL' }
```

### Prueba 4: Flujo HeroExpress (localhost)

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

## 🔒 Seguridad de Datos en URL

### ⚠️ Importante: Base64 es Codificación, NO Encriptación

La codificación Base64 utilizada para los datos de usuario en la URL proporciona **ofuscación**, no **encriptación real**:

```javascript
// Base64 es REVERSIBLE - cualquiera puede decodificar
const encoded = btoa(JSON.stringify({ email: 'juan@example.com' }));
const decoded = atob(encoded); // ← Decodificación simple
```

### ✅ Beneficios de Base64 en URLs

1. **Privacidad básica:** Datos no legibles a simple vista en URL
2. **Historial del navegador:** Reduce exposición en capturas de pantalla
3. **Logs del servidor:** Menos información sensible visible en texto plano
4. **URL más corta:** Un solo parámetro en lugar de múltiples
5. **Mantenibilidad:** Más fácil agregar nuevos campos sin cambiar la URL

### ❌ Base64 NO protege contra:

1. **Man-in-the-Middle (MITM):** Usar HTTPS para protección de tráfico
2. **Análisis de tráfico:** Cualquiera que intercepte puede decodificar
3. **Logs del servidor:** Los datos se decodifican en el servidor
4. **Inspección deliberada:** No es encriptación, solo ofuscación

### 🔐 Mejores Prácticas de Seguridad

**Implementadas:**
- ✅ HTTPS obligatorio en producción
- ✅ Normalización de teléfono a formato estándar E.164
- ✅ Validación de datos en frontend y backend
- ✅ Google Ads hashea automáticamente los datos con SHA-256
- ✅ Datos no persistidos en sessionStorage (solo flag de conversión)

**Opcionales para mayor seguridad:**
- 🔐 JWT (JSON Web Tokens) con firma HMAC
- 🔐 Encriptación simétrica (AES) con clave secreta
- 🔐 Tokens de un solo uso con TTL (Time To Live)
- 🔐 Lookup tokens (ID que referencia datos en servidor)

### Ejemplo de Mejora Futura (Opcional)

Para mayor seguridad, se podría implementar un sistema de tokens:

```javascript
// Backend: Generar token temporal
const tempToken = crypto.randomUUID();
await redis.setex(`flow_data_${tempToken}`, 300, JSON.stringify(userData)); // 5 min TTL

// URL segura (sin datos sensibles)
const returnUrl = `${frontendBase}/flow-return?token=${token}&dt=${tempToken}`;

// Frontend: Consultar datos con token
const response = await fetch(`/api/flow-data/${tempToken}`);
const userData = await response.json();
```

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

### Problema: Teléfono no se normaliza correctamente

**Solución:**
1. Verificar que el número esté en un formato válido (debe empezar con 9 para Chile)
2. Revisar console del navegador para ver el teléfono normalizado
3. Usar formato E.164 directamente en la base de datos: `+56987654321`

**Ejemplo de debug:**
```javascript
// En console del navegador
const phone = '9 8765 4321';
const normalized = normalizePhoneToE164(phone);
console.log(normalized); // Debe mostrar: +56987654321
```

### Problema: Error decodificando datos Base64

**Solución:**
1. Verificar que el parámetro `d` esté presente en la URL
2. Revisar console para mensaje: "⚠️ Error decodificando datos de usuario"
3. Si hay error, el sistema usa fallback automático a parámetros individuales
4. Verificar que el backend esté generando el Base64 correctamente:

```javascript
// En backend (Node.js)
const userData = { email: 'test@example.com', nombre: 'Test', telefono: '987654321' };
const encoded = Buffer.from(JSON.stringify(userData)).toString('base64');
console.log(encoded); // Debe ser string válido Base64
```

### Problema: Conversión funciona pero sin datos avanzados

**Solución:**
1. Verificar que los datos estén en la petición HTTP (DevTools → Network)
2. Asegurarse de que el dominio tenga certificado SSL (HTTPS)
3. Contactar soporte de Google Ads para verificar configuración
4. Verificar que el teléfono esté en formato E.164 (+56...)

---

## 📞 Soporte

Para preguntas sobre esta implementación:
- 📧 Email: contacto@transportesaraucaria.cl
- 📱 WhatsApp: +569 3664 3540

---

**Última actualización:** Diciembre 2024
**Versión:** 2.0.0 - Incluye normalización E.164 y codificación Base64
