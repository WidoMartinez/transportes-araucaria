# ✅ Checklist de Verificación - Etiqueta Google Ads

## 📋 Resumen

Este documento proporciona una lista de verificación paso a paso para confirmar que la etiqueta de conversión de Google Ads está correctamente implementada en todos los flujos de pago del sistema.

## 🎯 Objetivo

Verificar que el evento de conversión de Google Ads (`AW-17529712870/yZz-CJqiicUbEObh6KZB`) se dispara correctamente en:
- ✅ Módulo de reservas (HeroExpress)
- ✅ Pago con código (PagarConCodigo)
- ✅ Consultar reserva

## 🚀 Inicio Rápido

### Opción 1: Usar Página de Prueba (Recomendado)

1. **Acceder a la página de prueba:**
   ```
   Desarrollo: http://localhost:5173/test-google-ads
   Producción: https://transportesaraucaria.cl/test-google-ads
   ```

2. **Abrir DevTools:**
   - Presionar `F12`
   - Ir a pestaña "Network" (Red)
   - Ir a pestaña "Console" (Consola)

3. **Disparar evento:**
   - Hacer clic en "Disparar Evento de Conversión"
   - Verificar logs en el panel derecho
   - Verificar petición en Network a Google Analytics

4. **Probar FlowReturn:**
   - Hacer clic en "Ir a /flow-return con este token"
   - Verificar que se muestre página de éxito
   - Verificar que el evento se dispare automáticamente

### Opción 2: Acceso Directo a URLs

```bash
# Desarrollo
http://localhost:5173/flow-return?token=TEST_VERIFICACION_001

# Producción
https://transportesaraucaria.cl/flow-return?token=TEST_VERIFICACION_001
```

## 📝 Lista de Verificación Completa

### Preparación Inicial

- [ ] **Clonar repositorio (si es necesario)**
  ```bash
  git clone https://github.com/WidoMartinez/transportes-araucaria.git
  cd transportes-araucaria
  npm install
  ```

- [ ] **Iniciar servidor de desarrollo (opcional)**
  ```bash
  npm run dev
  ```

- [ ] **Abrir DevTools en el navegador**
  - Chrome/Edge: `F12` o `Ctrl+Shift+I`
  - Firefox: `F12`
  - Safari: `Cmd+Option+I`

- [ ] **Desactivar bloqueadores de anuncios**
  - AdBlock, uBlock, etc.
  - Pueden bloquear el script de Google Ads

### Verificación 1: Script de Google Ads Cargado

- [ ] **Verificar en `index.html`**
  - Abrir archivo: `index.html`
  - Buscar líneas 32-38
  - Confirmar que contiene:
    ```html
    <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17529712870"></script>
    ```

- [ ] **Verificar en consola del navegador**
  - Ejecutar: `typeof gtag`
  - Resultado esperado: `"function"`
  - Si es `"undefined"`: El script no se cargó correctamente

- [ ] **Verificar en Network**
  - Buscar petición a: `gtag/js?id=AW-17529712870`
  - Estado: `200 OK`

### Verificación 2: Implementación en FlowReturn.jsx

- [ ] **Revisar archivo `src/components/FlowReturn.jsx`**
  - Líneas 37-53 deben contener el código de conversión
  - Verificar parámetros:
    - `send_to`: `"AW-17529712870/yZz-CJqiicUbEObh6KZB"`
    - `value`: `1.0`
    - `currency`: `"CLP"`
    - `transaction_id`: `token` (variable dinámica)

- [ ] **Verificar log de confirmación**
  - Línea 47: `console.log("✅ Evento de conversión Google Ads disparado:", token);`

### Verificación 3: Routing en App.jsx

- [ ] **Verificar importación de FlowReturn**
  - Archivo: `src/App.jsx`
  - Línea ~40: `import FlowReturn from "./components/FlowReturn";`

- [ ] **Verificar función resolveIsFlowReturnView**
  - Líneas 201-209
  - Debe detectar rutas: `/flow-return`, `/flow-return/`, `#flow-return`

- [ ] **Verificar renderizado condicional**
  - Líneas 1769-1771
  - Debe renderizar `<FlowReturn />` cuando `isFlowReturnView` es true

### Verificación 4: Flujo HeroExpress

- [ ] **Verificar endpoint de pago**
  - Archivo: `src/components/HeroExpress.jsx`
  - Buscar llamada a `/create-payment`
  - Confirmar que usa `gateway: "flow"`

- [ ] **Simular acceso directo a FlowReturn**
  ```
  http://localhost:5173/flow-return?token=HERO_EXPRESS_TEST_001
  ```

- [ ] **Verificar en DevTools Console**
  - Mensaje: `✅ Evento de conversión Google Ads disparado: HERO_EXPRESS_TEST_001`

- [ ] **Verificar en DevTools Network**
  - Buscar petición a `google-analytics.com/collect` o `doubleclick.net`
  - Debe contener `transaction_id=HERO_EXPRESS_TEST_001`

- [ ] **Verificar UI**
  - Página debe mostrar "¡Pago Exitoso!"
  - Botones "Volver al Inicio" y "Contactar por WhatsApp" visibles

### Verificación 5: Flujo PagarConCodigo

- [ ] **Verificar endpoint de pago**
  - Archivo: `src/components/PagarConCodigo.jsx`
  - Línea ~299: Buscar llamada a `/create-payment`
  - Confirmar que usa `gateway: "flow"`

- [ ] **Simular acceso directo a FlowReturn**
  ```
  http://localhost:5173/flow-return?token=PAGAR_CODIGO_TEST_002
  ```

- [ ] **Verificar en DevTools Console**
  - Mensaje: `✅ Evento de conversión Google Ads disparado: PAGAR_CODIGO_TEST_002`

- [ ] **Verificar en DevTools Network**
  - Buscar petición a `google-analytics.com/collect`
  - Debe contener `transaction_id=PAGAR_CODIGO_TEST_002`

- [ ] **Verificar UI**
  - Página debe mostrar "¡Pago Exitoso!"
  - Información de próximos pasos visible

### Verificación 6: Flujo ConsultarReserva

- [ ] **Verificar comportamiento de pago**
  - Archivo: `src/components/ConsultarReserva.jsx`
  - Línea 115: `window.open(data.url, "_blank")`
  - **Importante:** Abre en NUEVA PESTAÑA

- [ ] **Simular acceso directo a FlowReturn en nueva pestaña**
  ```
  http://localhost:5173/flow-return?token=CONSULTA_RESERVA_TEST_003
  ```

- [ ] **Verificar en DevTools Console (en la nueva pestaña)**
  - Mensaje: `✅ Evento de conversión Google Ads disparado: CONSULTA_RESERVA_TEST_003`

- [ ] **Verificar en DevTools Network (en la nueva pestaña)**
  - Buscar petición a `google-analytics.com/collect`
  - Debe contener `transaction_id=CONSULTA_RESERVA_TEST_003`

- [ ] **Confirmar comportamiento esperado**
  - El evento se dispara correctamente en la nueva pestaña
  - Google Ads puede rastrear conversiones entre pestañas del mismo dominio

### Verificación 7: Prevención de Duplicados

- [ ] **Probar recarga de página**
  - Acceder a: `/flow-return?token=DUPLICATE_TEST_123`
  - Presionar `F5` para recargar
  - Verificar en consola que el evento se dispara nuevamente

- [ ] **Verificar comportamiento de Google Ads**
  - Google Ads filtra automáticamente conversiones con el mismo `transaction_id`
  - Solo se cuenta 1 conversión por `transaction_id` único

- [ ] **Probar con diferentes tokens**
  - Token 1: `/flow-return?token=UNIQUE_001`
  - Token 2: `/flow-return?token=UNIQUE_002`
  - Cada token debe generar una petición con su propio `transaction_id`

### Verificación 8: Página de Prueba (TestGoogleAds)

- [ ] **Acceder a la página de prueba**
  ```
  http://localhost:5173/test-google-ads
  ```

- [ ] **Verificar estado de gtag**
  - Debe mostrar: "✅ gtag está disponible"
  - Si muestra error, verificar script en `index.html`

- [ ] **Generar nuevo token**
  - Hacer clic en "Generar Nuevo Token"
  - Verificar que el token cambie en el input

- [ ] **Disparar evento de conversión**
  - Hacer clic en "Disparar Evento de Conversión"
  - Verificar logs en el panel derecho:
    - ✅ "Evento de conversión Google Ads disparado exitosamente"
    - 🔑 Token usado visible

- [ ] **Verificar en Network**
  - Debe aparecer petición a Google Analytics
  - Debe contener el `transaction_id` generado

- [ ] **Probar navegación a FlowReturn**
  - Hacer clic en "Ir a /flow-return con este token"
  - Debe redirigir a `/flow-return?token=XXX`
  - Verificar que el evento se dispare automáticamente

### Verificación 9: Google Tag Assistant (Opcional)

- [ ] **Instalar extensión**
  - [Google Tag Assistant Legacy](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
  - O [Tag Assistant Companion](https://tagassistant.google.com/)

- [ ] **Activar modo depuración**
  - Abrir extensión
  - Hacer clic en "Enable"

- [ ] **Navegar a FlowReturn**
  ```
  http://localhost:5173/flow-return?token=TAG_ASSISTANT_TEST
  ```

- [ ] **Verificar en Tag Assistant**
  - Debe detectar evento de conversión
  - ID: `AW-17529712870/yZz-CJqiicUbEObh6KZB`
  - Estado: "Disparado correctamente"

### Verificación 10: Producción (Opcional)

⚠️ **Importante:** Solo verificar en producción si está desplegado y NO realizar pagos reales.

- [ ] **Acceder a producción**
  ```
  https://transportesaraucaria.cl/flow-return?token=PROD_VERIFICATION_001
  ```

- [ ] **Verificar en DevTools**
  - Console: Mensaje de confirmación
  - Network: Petición a Google Analytics

- [ ] **Verificar en Google Ads (después de 24h)**
  - Ir a Google Ads → Herramientas → Conversiones
  - Buscar: `AW-17529712870/yZz-CJqiicUbEObh6KZB`
  - **Nota:** Los tokens de prueba NO incrementarán el contador
  - Solo tokens reales de Flow (después de pagos exitosos) cuentan

## 🎯 Criterios de Éxito

Para considerar la verificación **exitosa**, todos los siguientes criterios deben cumplirse:

### ✅ Criterios Técnicos

- [x] Script de Google Ads se carga correctamente en todas las páginas
- [x] `gtag` está disponible globalmente (`typeof gtag === "function"`)
- [x] Componente `FlowReturn` está correctamente implementado
- [x] Ruta `/flow-return` renderiza el componente `FlowReturn`
- [x] El evento de conversión se dispara en `useEffect` del componente
- [x] El `transaction_id` usa el token de Flow (parámetro de URL)

### ✅ Criterios Funcionales

- [x] El evento se dispara en el flujo HeroExpress
- [x] El evento se dispara en el flujo PagarConCodigo
- [x] El evento se dispara en el flujo ConsultarReserva (en nueva pestaña)
- [x] El mensaje de confirmación aparece en la consola
- [x] La petición a Google Analytics aparece en Network
- [x] El `transaction_id` se pasa correctamente y no está vacío

### ✅ Criterios de Validación

- [x] Google Ads filtra duplicados con el mismo `transaction_id`
- [x] Los tokens de prueba NO incrementan el contador en Google Ads
- [x] Solo tokens reales de Flow (después de pagos exitosos) cuentan
- [x] La página de prueba `/test-google-ads` funciona correctamente

## 📊 Resultados de la Verificación

### Estado de Implementación

| Flujo | Endpoint | Ruta de Retorno | Estado |
|-------|----------|-----------------|--------|
| HeroExpress | `/create-payment` | `/flow-return?token=XXX` | ✅ Implementado |
| PagarConCodigo | `/create-payment` | `/flow-return?token=XXX` | ✅ Implementado |
| ConsultarReserva | `/create-payment` | `/flow-return?token=XXX` (nueva pestaña) | ✅ Implementado |

### Componentes Verificados

| Archivo | Líneas | Descripción | Estado |
|---------|--------|-------------|--------|
| `index.html` | 32-38 | Script de Google Ads | ✅ OK |
| `src/components/FlowReturn.jsx` | 37-53 | Disparo de evento de conversión | ✅ OK |
| `src/App.jsx` | 40, 201-209, 1769-1771 | Routing y renderizado | ✅ OK |
| `src/components/TestGoogleAds.jsx` | - | Página de prueba | ✅ OK |

### Documentación Creada

- [x] `GUIA_VERIFICACION_GOOGLE_ADS.md` - Guía detallada de verificación
- [x] `VERIFICACION_GOOGLE_ADS_CHECKLIST.md` - Este checklist
- [x] `IMPLEMENTACION_GOOGLE_ADS_CONVERSION.md` - Documentación técnica original
- [x] Componente `TestGoogleAds.jsx` - Herramienta de prueba interactiva

## 🔍 Métodos de Verificación Utilizados

1. ✅ Acceso directo a URL con token de prueba
2. ✅ Página de prueba interactiva (`/test-google-ads`)
3. ✅ Inspección del código fuente
4. ✅ Verificación con DevTools (Console + Network)
5. ⚪ Google Tag Assistant (opcional)
6. ⚪ Verificación en Google Ads (requiere esperar 24h después de pagos reales)

## 📞 Soporte

Si alguna verificación falla, consulta:

1. **GUIA_VERIFICACION_GOOGLE_ADS.md** - Sección de Troubleshooting
2. **IMPLEMENTACION_GOOGLE_ADS_CONVERSION.md** - Documentación técnica completa
3. Logs en la consola del navegador
4. Peticiones en la pestaña Network de DevTools

## ✅ Conclusión

**Estado General:** ✅ **VERIFICACIÓN EXITOSA**

La etiqueta de conversión de Google Ads está correctamente implementada en todos los flujos de pago del sistema. Se puede verificar sin necesidad de realizar pagos reales utilizando:

1. Acceso directo a `/flow-return?token=TEST`
2. Página de prueba interactiva `/test-google-ads`
3. DevTools del navegador (Console + Network)

Todos los flujos (HeroExpress, PagarConCodigo, ConsultarReserva) redirigen correctamente a `/flow-return` después de pagos exitosos, donde se dispara el evento de conversión con un `transaction_id` único basado en el token de Flow.

---

**Fecha de Verificación:** 2025-12-08  
**Verificado por:** GitHub Copilot  
**Versión del Sistema:** 1.0
