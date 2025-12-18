# Conversiones Avanzadas de Google Ads (Enhanced Conversions)

## 📋 Resumen

Sistema implementado para mejorar la precisión del seguimiento de conversiones de Google Ads mediante el envío de datos de usuario de manera segura. Esto permite a Google Ads hacer un mejor seguimiento de las conversiones incluso cuando hay restricciones de cookies o los usuarios interactúan con anuncios desde múltiples dispositivos.

## 🎯 ¿Qué son las Conversiones Avanzadas?

Las **Conversiones Avanzadas** (Enhanced Conversions) es una característica de Google Ads que mejora la medición de conversiones al enviar datos de usuarios de primera parte (first-party data) de manera segura a Google Ads. Google hashea estos datos usando SHA-256 antes de compararlos con cuentas de Google que hayan iniciado sesión, lo que ayuda a atribuir conversiones de manera más precisa.

### Beneficios

1. ✅ **Mayor precisión de medición**: Mejor atribución de conversiones
2. ✅ **Compatible con privacidad**: Los datos se hashean automáticamente
3. ✅ **Seguimiento entre dispositivos**: Identifica al mismo usuario en diferentes dispositivos
4. ✅ **Resistente a restricciones de cookies**: Funciona incluso con limitaciones de terceros
5. ✅ **Mejora el aprendizaje automático**: Mejor rendimiento de Smart Bidding

## 🔧 Implementación Técnica

### Datos Enviados

Según la [documentación oficial de Google Ads](https://support.google.com/google-ads/answer/13258081), enviamos los siguientes datos **en texto plano** (Google los hashea automáticamente):

\`\`\`javascript
{
  'email': 'usuario@ejemplo.com',
  'phone_number': '+56912345678',
  'address': {
    'first_name': 'juan',
    'last_name': 'pérez',
    'country': 'CL'
  }
}
\`\`\`

### Archivos Modificados

#### 1. Frontend: \`src/components/FlowReturn.jsx\`

**Cambios realizados:**
- Extracción de datos de usuario de parámetros URL (\`email\`, \`nombre\`, \`telefono\`)
- Normalización de datos (email en minúsculas, teléfono sin caracteres especiales)
- Separación de nombre completo en \`first_name\` y \`last_name\`
- Inclusión de datos en el evento de conversión

**Ejemplo de datos enviados:**
\`\`\`javascript
const conversionData = {
  send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB",
  value: conversionValue,
  currency: "CLP",
  transaction_id: transactionId,
  email: 'usuario@ejemplo.com',
  phone_number: '+56912345678',
  address: {
    first_name: 'juan',
    last_name: 'pérez',
    country: 'CL'
  }
};
\`\`\`

#### 2. Backend: \`backend/server-db.js\`

**Cambios realizados:**
- Inclusión de datos de usuario en la URL de redirección a \`/flow-return\`
- Codificación correcta para URL usando \`encodeURIComponent()\`
- Extracción de datos desde el modelo \`Reserva\`

**Línea modificada (~6405):**
\`\`\`javascript
// ANTES
return res.redirect(303, \`\${frontendBase}/flow-return?token=\${token}&status=success&reserva_id=\${reservaId}&amount=\${total}\`);

// DESPUÉS
const emailEncoded = encodeURIComponent(reserva.email || '');
const nombreEncoded = encodeURIComponent(reserva.nombre || '');
const telefonoEncoded = encodeURIComponent(reserva.telefono || '');

return res.redirect(303, \`\${frontendBase}/flow-return?token=\${token}&status=success&reserva_id=\${reservaId}&amount=\${total}&email=\${emailEncoded}&nombre=\${nombreEncoded}&telefono=\${telefonoEncoded}\`);
\`\`\`

#### 3. Componente de Prueba: \`src/components/TestGoogleAds.jsx\`

**Cambios realizados:**
- Inclusión de datos de prueba en el evento de conversión
- Logs adicionales para verificar que se envían los datos
- Datos de prueba: \`test@transportesaraucaria.cl\`, \`+56936643540\`, \`usuario prueba\`

## ✅ Criterios de Aceptación

1. ✅ **Datos enviados correctamente**: email, teléfono y nombre se incluyen en el evento
2. ✅ **Normalización de datos**: 
   - Email en minúsculas y sin espacios
   - Teléfono sin caracteres especiales (solo números y +)
   - Nombre separado en first_name y last_name
3. ✅ **Compatibilidad hacia atrás**: Funciona aunque falten datos opcionales
4. ✅ **Sin romper funcionalidad**: Conversiones básicas siguen funcionando
5. ✅ **Componente de prueba actualizado**: Incluye datos de ejemplo

## 🧪 Cómo Verificar la Implementación

### 1. Verificación Local

**Opción A: Usando el componente de prueba**
\`\`\`bash
npm run dev
# Abrir: http://localhost:5173/test-google-ads
# Hacer clic en "Disparar Evento de Conversión"
\`\`\`

Verificar en los logs que aparezcan los datos de usuario:
- ✅ email: test@transportesaraucaria.cl
- ✅ phone_number: +56936643540
- ✅ address.first_name: usuario
- ✅ address.last_name: prueba
- ✅ address.country: CL

**Opción B: Simulando URL de retorno**
\`\`\`
http://localhost:5173/flow-return?token=TEST_123&status=success&reserva_id=999&amount=50000&email=test@example.com&nombre=Juan%20Pérez&telefono=+56912345678
\`\`\`

Verificar en la consola del navegador:
\`\`\`
✅ Evento de conversión Google Ads disparado (ID: 999, Valor: 50000)
📊 Conversión avanzada: Datos de usuario incluidos {hasEmail: true, hasPhone: true, hasName: true}
\`\`\`

### 2. Verificación en DevTools

1. Abrir DevTools (F12)
2. Ir a la pestaña **Network**
3. Filtrar por "collect" o "google-analytics"
4. Disparar un evento de conversión
5. Buscar la petición HTTP a Google
6. Verificar que incluya parámetros hasheados

### 3. Verificación en Google Ads

**Importante:** Los datos hasheados no son visibles en Google Ads, pero puedes verificar que las conversiones avanzadas estén activas:

1. Ir a [Google Ads](https://ads.google.com/)
2. **Herramientas y Configuración** → **Medición** → **Conversiones**
3. Seleccionar la conversión \`AW-17529712870/yZz-CJqiicUbEObh6KZB\`
4. Buscar la sección **"Conversiones avanzadas"**
5. Verificar que muestre: ✅ **"Activo"** o **"Configurado correctamente"**

**Nota:** Puede tomar 24-48 horas para que Google Ads procese y muestre el estado.

## 🔒 Privacidad y Seguridad

### Cumplimiento de Privacidad

✅ **Los datos se hashean automáticamente**: Google hashea todos los datos con SHA-256 antes de almacenarlos
✅ **No se almacenan en nuestro servidor**: Los datos solo pasan por URL temporalmente
✅ **Solo datos necesarios**: Solo enviamos email, teléfono y nombre
✅ **Transmisión segura**: Todo se envía por HTTPS
✅ **Cumple con políticas de Google**: Implementación según documentación oficial

### ¿Qué Hace Google con los Datos?

1. Recibe los datos en texto plano
2. Los hashea inmediatamente con SHA-256
3. Compara los hashes con usuarios de Google que hayan iniciado sesión
4. Si hay coincidencia, atribuye la conversión
5. Los datos hasheados se eliminan después de 90 días

## 📊 Datos Técnicos

### Configuración Actual

| Parámetro | Valor |
|-----------|-------|
| **ID de Conversión** | AW-17529712870 |
| **Etiqueta de Conversión** | yZz-CJqiicUbEObh6KZB |
| **Moneda** | CLP |
| **País** | CL (Chile) |
| **Datos enviados** | email, phone_number, address (first_name, last_name, country) |

### Flujos de Pago Compatibles

✅ **Pagar con Código** (\`codigo_pago\`)
✅ **Consultar Reserva** (\`consultar_reserva\`)
✅ **Compra de Productos** (\`compra_productos\`)

**Nota:** El flujo de Reserva Express redirige a "Completar Detalles" en lugar de \`/flow-return\`, por lo que no dispara conversiones avanzadas en ese punto.

## 📚 Referencias

- [Documentación oficial: Enhanced Conversions](https://support.google.com/google-ads/answer/13258081)
- [Guía de implementación: gtag.js](https://support.google.com/google-ads/answer/7305793)
- [Política de privacidad de Google Ads](https://policies.google.com/privacy)

## 📝 Notas Importantes

1. ⚠️ **NO hashear los datos manualmente**: Google lo hace automáticamente
2. ✅ **Enviar datos en texto plano**: Exactamente como se recopilaron
3. ✅ **Normalizar antes de enviar**: Minúsculas, sin espacios, etc.
4. ⚠️ **Los datos de prueba no generan conversiones reales**: Solo pagos reales incrementan el contador
5. ✅ **Funciona sin datos de usuario**: Si faltan datos, la conversión básica aún funciona

---

**Implementado:** 2024-12-18  
**Autor:** GitHub Copilot  
**Versión:** 1.0  
**Basado en:** Documentación oficial de Google Ads Enhanced Conversions
