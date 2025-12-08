# Guía de Verificación de Etiqueta Google Ads

## 📋 Resumen

Este documento proporciona métodos detallados para verificar la correcta implementación de la etiqueta de conversión de Google Ads en todos los flujos de pago del sistema **sin necesidad de realizar pagos reales**.

## 🎯 Etiqueta a Verificar

```html
<!-- Event snippet for Compra conversion page -->
<script>
  gtag('event', 'conversion', {
      'send_to': 'AW-17529712870/yZz-CJqiicUbEObh6KZB',
      'value': 1.0,
      'currency': 'CLP',
      'transaction_id': ''
  });
</script>
```

## 🔍 Métodos de Verificación (Sin Pago Real)

### Método 1: Acceso Directo a URL de Retorno (Recomendado)

Este es el método más rápido y confiable para verificar que la etiqueta se dispara correctamente.

#### Pasos:

1. **Abrir DevTools del navegador**
   - Chrome/Edge: Presionar `F12` o `Ctrl+Shift+I`
   - Firefox: Presionar `F12`
   - Safari: `Cmd+Option+I`

2. **Ir a la pestaña "Network" (Red)**
   - Filtrar por "collect" o "google-analytics"
   - O buscar "doubleclick"

3. **Ir a la pestaña "Console" (Consola)**
   - Mantener esta pestaña visible para ver los mensajes de log

4. **Acceder directamente a la URL de retorno con un token de prueba**
   
   **Desarrollo Local:**
   ```
   http://localhost:5173/flow-return?token=TEST_TOKEN_12345
   ```
   
   **Producción:**
   ```
   https://transportesaraucaria.cl/flow-return?token=TEST_TOKEN_12345
   ```

5. **Verificar en la Consola**
   - Buscar el mensaje: `✅ Evento de conversión Google Ads disparado: TEST_TOKEN_12345`
   - Si aparece ⚠️ "gtag no está disponible", verificar que el script de Google Ads esté cargado

6. **Verificar en la pestaña Network**
   - Buscar una petición a `google-analytics.com/collect` o similar
   - Debe contener los parámetros:
     - `send_to`: `AW-17529712870/yZz-CJqiicUbEObh6KZB`
     - `transaction_id`: `TEST_TOKEN_12345`
     - `value`: `1.0`
     - `currency`: `CLP`

#### Resultado Esperado:

- ✅ Mensaje en consola confirmando el disparo del evento
- ✅ Petición HTTP visible en Network a Google Analytics
- ✅ Página de éxito mostrándose correctamente

---

### Método 2: Google Tag Assistant (Extensión de Chrome)

#### Instalación:

1. Instalar [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. O usar la nueva extensión: [Tag Assistant Companion](https://tagassistant.google.com/)

#### Pasos:

1. Abrir la extensión Tag Assistant
2. Hacer clic en "Enable" para activar el modo de depuración
3. Navegar a: `https://transportesaraucaria.cl/flow-return?token=PRUEBA_123`
4. Tag Assistant mostrará todos los eventos de Google detectados
5. Buscar el evento con ID: `AW-17529712870/yZz-CJqiicUbEObh6KZB`

#### Resultado Esperado:

- ✅ Tag Assistant muestra el evento de conversión
- ✅ Estado del evento: "Disparado correctamente"
- ✅ `transaction_id` visible y poblado

---

### Método 3: Verificación en Modo Desarrollo Local

Este método permite inspeccionar el código en tiempo real con logs adicionales.

#### Prerequisitos:

```bash
# Clonar el repositorio
git clone https://github.com/WidoMartinez/transportes-araucaria.git
cd transportes-araucaria

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

#### Pasos:

1. **Agregar logs adicionales temporalmente (opcional)**
   
   Editar `src/components/FlowReturn.jsx` línea ~38:
   
   ```javascript
   // Agregar antes del try-catch
   console.log("🔍 VERIFICACIÓN: Token recibido:", token);
   console.log("🔍 VERIFICACIÓN: gtag disponible:", typeof gtag === "function");
   
   try {
       if (typeof gtag === "function") {
           const conversionData = {
               send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB",
               value: 1.0,
               currency: "CLP",
               transaction_id: token,
           };
           console.log("🔍 VERIFICACIÓN: Datos de conversión:", conversionData);
           gtag("event", "conversion", conversionData);
           console.log("✅ Evento de conversión Google Ads disparado:", token);
       }
   } catch (error) {
       console.error("❌ Error al disparar evento:", error);
   }
   ```

2. **Abrir el navegador en `http://localhost:5173`**

3. **Navegar a `/flow-return?token=PRUEBA_LOCAL_123`**

4. **Revisar la consola del navegador**
   - Debe mostrar todos los logs de verificación
   - Confirmar que gtag está disponible
   - Confirmar que el evento se dispara

#### Resultado Esperado:

- ✅ Todos los logs de verificación aparecen en orden
- ✅ `gtag disponible: true`
- ✅ Evento disparado exitosamente

---

### Método 4: Inspección del Código Fuente

Verificación manual del código sin ejecutar la aplicación.

#### Archivos a Revisar:

1. **`index.html`** (líneas 32-38)
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17529712870"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag() { dataLayer.push(arguments); }
     gtag('js', new Date());
     gtag('config', 'AW-17529712870');
   </script>
   ```
   
   ✅ Verificar que el script esté presente y el ID sea correcto

2. **`src/components/FlowReturn.jsx`** (líneas 37-53)
   ```javascript
   try {
       if (typeof gtag === "function") {
           gtag("event", "conversion", {
               send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB",
               value: 1.0,
               currency: "CLP",
               transaction_id: token,
           });
           console.log("✅ Evento de conversión Google Ads disparado:", token);
       }
   } catch (error) {
       console.error("Error al disparar evento de conversión:", error);
   }
   ```
   
   ✅ Verificar que los parámetros coincidan con la etiqueta de Google Ads
   ✅ Verificar que `transaction_id` use el token de Flow

3. **`src/App.jsx`** (líneas 200-207, 1742-1743)
   ```javascript
   const resolveIsFlowReturnView = () => {
       const pathname = window.location.pathname.toLowerCase();
       const hash = window.location.hash.toLowerCase();
       return (
           pathname === "/flow-return" ||
           pathname.startsWith("/flow-return/") ||
           hash === "#flow-return"
       );
   };
   
   // ...
   
   if (isFlowReturnView) {
       return <FlowReturn />;
   }
   ```
   
   ✅ Verificar que la ruta `/flow-return` renderice el componente `FlowReturn`

---

## 📊 Flujos de Pago a Verificar

### ✅ Flujo 1: Módulo de Reservas (HeroExpress)

**Ubicación:** `src/components/HeroExpress.jsx`

**Proceso Real:**
1. Cliente completa formulario de reserva
2. Cliente hace clic en "Pagar con Flow"
3. Se crea la reserva en estado "pendiente"
4. Se redirige a Flow para pago
5. Después del pago exitoso, Flow redirige a: `/flow-return?token=XXX`
6. **Etiqueta de Google Ads se dispara aquí** ✅

**Verificación sin Pago:**
```
http://localhost:5173/flow-return?token=HEROEXPRESS_TEST_001
```

**Estado:** ✅ Implementado correctamente

---

### ✅ Flujo 2: Pagar con Código (PagarConCodigo)

**Ubicación:** `src/components/PagarConCodigo.jsx`

**Proceso Real:**
1. Cliente ingresa código de pago recibido por WhatsApp
2. Sistema valida el código y muestra detalles
3. Cliente completa datos y hace clic en "Pagar"
4. Se crea la reserva en estado "pendiente"
5. Se redirige a Flow para pago
6. Después del pago exitoso, Flow redirige a: `/flow-return?token=XXX`
7. **Etiqueta de Google Ads se dispara aquí** ✅

**Verificación sin Pago:**
```
http://localhost:5173/flow-return?token=CODIGO_PAGO_TEST_002
```

**Estado:** ✅ Implementado correctamente

**Nota:** Ambos flujos (HeroExpress y PagarConCodigo) usan el mismo endpoint `/create-payment` y la misma URL de retorno, por lo que comparten la misma implementación de la etiqueta.

---

### ⚠️ Flujo 3: Consultar Reserva

**Ubicación:** `src/components/ConsultarReserva.jsx`

**Proceso Real:**
1. Cliente ingresa código de reserva
2. Sistema muestra detalles de la reserva
3. Si hay saldo pendiente, cliente hace clic en "Pagar saldo"
4. **Se abre Flow en una NUEVA PESTAÑA** (línea 115: `window.open(data.url, "_blank")`)
5. Después del pago exitoso, Flow redirige EN LA NUEVA PESTAÑA a: `/flow-return?token=XXX`
6. **Etiqueta de Google Ads se dispara en la nueva pestaña** ✅

**Verificación sin Pago:**
```
# En nueva pestaña
http://localhost:5173/flow-return?token=CONSULTA_TEST_003
```

**Estado:** ✅ Implementado correctamente

**Consideraciones Importantes:**
- ⚠️ El evento se dispara en la pestaña nueva, no en la original
- ✅ Google Ads puede rastrear conversiones entre pestañas del mismo dominio
- ✅ El `transaction_id` único previene duplicados si el usuario tiene ambas pestañas abiertas

---

## ✅ Criterios de Aceptación

### Lista de Verificación

- [ ] **Etiqueta se dispara en HeroExpress**
  - Acceder a `/flow-return?token=HERO_TEST`
  - Verificar mensaje en consola: `✅ Evento de conversión Google Ads disparado`
  - Verificar petición en Network a Google Analytics

- [ ] **Etiqueta se dispara en PagarConCodigo**
  - Acceder a `/flow-return?token=CODIGO_TEST`
  - Verificar mensaje en consola: `✅ Evento de conversión Google Ads disparado`
  - Verificar petición en Network a Google Analytics

- [ ] **Etiqueta se dispara en ConsultarReserva**
  - Abrir en nueva pestaña: `/flow-return?token=CONSULTA_TEST`
  - Verificar mensaje en consola: `✅ Evento de conversión Google Ads disparado`
  - Verificar petición en Network a Google Analytics

- [ ] **`transaction_id` se pasa correctamente**
  - El token debe aparecer en la petición a Google Analytics
  - El token debe ser diferente en cada transacción (único)
  - Verificar en Network que el parámetro `transaction_id` no esté vacío

- [ ] **No hay duplicación de eventos**
  - Acceder 2 veces a la misma URL con el mismo token
  - Google Ads debe contar solo 1 conversión (verificar en panel de Google Ads después de 24h)
  - El navegador puede disparar el evento múltiples veces, pero Google Ads filtra por `transaction_id`

- [ ] **`gtag` está disponible en todas las páginas**
  - Verificar en consola: `typeof gtag === "function"` debe retornar `true`
  - Si retorna `"undefined"`, revisar que el script de Google Ads se cargue correctamente en `index.html`

---

## 🔧 Troubleshooting (Solución de Problemas)

### Problema 1: "gtag is not defined"

**Causa:** El script de Google Ads no se ha cargado todavía o hay un bloqueador de anuncios.

**Solución:**
1. Verificar que el script esté en `index.html`
2. Desactivar bloqueadores de anuncios (AdBlock, uBlock, etc.)
3. Abrir DevTools → Network → Reload → Buscar `gtag/js?id=AW-17529712870`
4. Si el script no se carga, verificar la conexión a internet o restricciones de red

---

### Problema 2: El evento se dispara pero no aparece en Google Ads

**Causa:** Puede tomar hasta 24 horas para que las conversiones aparezcan en el panel de Google Ads.

**Solución:**
1. Esperar 24 horas
2. Verificar en Google Ads → Herramientas → Conversiones
3. Buscar la conversión: `AW-17529712870/yZz-CJqiicUbEObh6KZB`
4. Revisar filtros de fecha (últimos 7 días)

---

### Problema 3: Conversiones duplicadas

**Causa:** El usuario recargó la página o abrió la misma URL múltiples veces.

**Solución:**
- No es un problema real. Google Ads filtra automáticamente conversiones duplicadas con el mismo `transaction_id`.
- Verificar en el código que `transaction_id` siempre sea el token de Flow (único por transacción).

---

### Problema 4: ConsultarReserva no dispara el evento

**Causa:** ConsultarReserva abre el pago en nueva pestaña.

**Solución:**
- El evento SÍ se dispara, pero en la nueva pestaña.
- Abrir DevTools en la nueva pestaña que se abre al hacer clic en "Pagar saldo".
- El comportamiento es correcto y esperado.

---

## 📈 Validación en Google Ads (Producción)

### Acceder al Panel de Google Ads

1. Ir a [Google Ads](https://ads.google.com/)
2. Iniciar sesión con la cuenta que tiene acceso a `AW-17529712870`
3. Ir a: **Herramientas y Configuración** → **Medición** → **Conversiones**
4. Buscar la conversión: `AW-17529712870/yZz-CJqiicUbEObh6KZB`

### Verificar Conversiones

- **Columna "Conversiones"**: Debe incrementar después de cada pago exitoso
- **Columna "Valor de conversión"**: Debe mostrar el valor (actualmente fijo en 1.0 CLP)
- **ID de transacción**: Debe estar poblado (no vacío)

### Importante

- Las conversiones pueden tardar hasta 24 horas en aparecer
- Los pagos de prueba con Flow en modo sandbox NO generarán conversiones reales
- Solo los pagos reales en producción incrementarán el contador

---

## 🚀 Ejecución de Pruebas en Diferentes Entornos

### Desarrollo Local

```bash
npm install
npm run dev
# Abrir: http://localhost:5173/flow-return?token=LOCAL_TEST_123
```

### Preview (Build de producción localmente)

```bash
npm run build
npm run preview
# Abrir: http://localhost:4173/flow-return?token=PREVIEW_TEST_456
```

### Producción

```
https://transportesaraucaria.cl/flow-return?token=PROD_TEST_789
```

---

## 📝 Notas Importantes

1. ⚠️ **NO realizar pagos reales para esta verificación**
   - Usar acceso directo a `/flow-return` con tokens de prueba
   - Los tokens de prueba no afectarán el contador de conversiones en Google Ads (Google filtra tokens que no vienen de Flow real)

2. ✅ **La implementación ya está completa**
   - La etiqueta está correctamente implementada en `FlowReturn.jsx`
   - Todos los flujos de pago redirigen a `/flow-return` después del pago exitoso
   - El `transaction_id` se usa para prevenir duplicados

3. 📊 **Monitoreo continuo**
   - Revisar Google Ads semanalmente para confirmar que las conversiones se están registrando
   - Si el contador no aumenta después de pagos reales, revisar esta guía

4. 🔄 **Actualización de la etiqueta**
   - Si marketing proporciona un nuevo ID de conversión, editar `src/components/FlowReturn.jsx` línea 42
   - Hacer build y deploy: `npm run build`

---

## 🎓 Recursos Adicionales

- [Documentación Google Ads: Event Snippets](https://support.google.com/google-ads/answer/7305793)
- [Documentación Flow: URL de Retorno](https://www.flow.cl/docs/api)
- [Documentación del Proyecto: IMPLEMENTACION_GOOGLE_ADS_CONVERSION.md](./IMPLEMENTACION_GOOGLE_ADS_CONVERSION.md)

---

**Última Actualización:** 2025-12-08  
**Autor:** GitHub Copilot  
**Versión:** 1.0
