# 📸 Guía Visual - Prueba de Etiqueta Google Ads

## 🎯 Objetivo

Esta guía proporciona instrucciones visuales paso a paso para verificar que la etiqueta de Google Ads se dispara correctamente usando la página de prueba interactiva.

---

## 🚀 Acceso a la Página de Prueba

### Paso 1: Acceder a la URL

**Desarrollo Local:**
```
http://localhost:5173/test-google-ads
```

**Producción:**
```
https://transportesaraucaria.cl/test-google-ads
```

### Paso 2: Abrir DevTools

Presionar **F12** o **Ctrl+Shift+I** (Windows/Linux) o **Cmd+Option+I** (Mac)

**Pestañas importantes a tener abiertas:**
- 🟢 **Console** (Consola) - Para ver logs de JavaScript
- 🔵 **Network** (Red) - Para ver peticiones HTTP

---

## 📋 Elementos de la Interfaz

La página de prueba tiene 3 secciones principales:

### 1. Panel de Control (Izquierda)
```
┌─────────────────────────────────┐
│ Panel de Control                │
│                                 │
│ Token de Prueba:                │
│ [TEST_TOKEN_1733675123456] [📋]│
│                                 │
│ [Disparar Evento de Conversión] │
│ [Generar Nuevo Token]           │
│ [Ir a /flow-return con token]   │
│ [Limpiar Logs]                  │
└─────────────────────────────────┘
```

### 2. Panel de Logs (Derecha)
```
┌─────────────────────────────────┐
│ Logs de Ejecución               │
│                                 │
│ ✅ gtag está disponible         │
│    14:30:25                     │
│                                 │
│ (Logs aparecerán aquí)          │
└─────────────────────────────────┘
```

### 3. Estado de gtag (Superior)
```
┌─────────────────────────────────┐
│ ✅ gtag disponible: El script  │
│    de Google Ads se cargó      │
│    correctamente.               │
└─────────────────────────────────┘
```

---

## ✅ Verificación Exitosa - Paso a Paso

### Paso 1: Verificar Estado de gtag

**Qué ver:**
```
┌─────────────────────────────────────┐
│ ✅ gtag disponible                  │
│    El script de Google Ads se       │
│    cargó correctamente.             │
└─────────────────────────────────────┘
```

**Si aparece error:**
```
┌─────────────────────────────────────┐
│ ❌ gtag no disponible               │
│    Asegúrate de que el script de   │
│    Google Ads esté en index.html   │
└─────────────────────────────────────┘
```

**Solución:**
1. Desactivar bloqueadores de anuncios (AdBlock, uBlock)
2. Recargar la página (F5)
3. Verificar que `index.html` tenga el script de Google Ads

---

### Paso 2: Disparar Evento de Conversión

**Acción:** Hacer clic en **"Disparar Evento de Conversión"**

**Resultado esperado en Logs:**
```
┌─────────────────────────────────────────────┐
│ Logs de Ejecución                           │
│                                             │
│ 🚀 Iniciando prueba de evento de conversión│
│    14:30:25                                 │
│                                             │
│ 📦 Datos de conversión preparados:         │
│    14:30:25                                 │
│                                             │
│    - send_to: AW-17529712870/yZz-CJq...   │
│    14:30:25                                 │
│                                             │
│    - value: 1.0                            │
│    14:30:25                                 │
│                                             │
│    - currency: CLP                          │
│    14:30:25                                 │
│                                             │
│    - transaction_id: TEST_TOKEN_17336...   │
│    14:30:25                                 │
│                                             │
│ ✅ Evento de conversión Google Ads         │
│    disparado exitosamente                   │
│    14:30:25                                 │
│                                             │
│ 🔑 Token usado: TEST_TOKEN_1733675123456   │
│    14:30:25                                 │
│                                             │
│ 📊 Ahora verifica en DevTools → Network:  │
│    14:30:25                                 │
└─────────────────────────────────────────────┘
```

---

### Paso 3: Verificar en DevTools Console

**Ubicación:** DevTools → Pestaña **Console**

**Qué buscar:**
```javascript
✅ Evento de conversión Google Ads disparado: TEST_TOKEN_1733675123456
```

**Si aparece warning:**
```javascript
⚠️ gtag no está disponible para tracking de conversión
```

**Acción:** Desactivar bloqueadores de anuncios y recargar

---

### Paso 4: Verificar en DevTools Network

**Ubicación:** DevTools → Pestaña **Network**

**Filtro:** Escribir "collect" o "google" en el filtro de búsqueda

**Qué buscar:**

1. **Petición a Google Analytics:**
   ```
   Nombre: collect?v=2&tid=...
   Estado: 200 OK
   Dominio: google-analytics.com
   ```

2. **Parámetros de la petición:**
   - Hacer clic en la petición
   - Ir a pestaña "Payload" o "Query String Parameters"
   - Verificar:
     ```
     send_to: AW-17529712870/yZz-CJqiicUbEObh6KZB
     transaction_id: TEST_TOKEN_1733675123456
     value: 1.0
     currency: CLP
     ```

**Captura esperada:**
```
┌─────────────────────────────────────────────┐
│ Network                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Name             Status  Type    Size   │ │
│ │ collect?v=2...   200     xhr     1.2KB  │ │
│ │ doubleclick.net  200     script  15KB   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Query String Parameters:                   │
│ ┌─────────────────────────────────────────┐ │
│ │ send_to: AW-17529712870/yZz-CJqiicUb... │ │
│ │ transaction_id: TEST_TOKEN_17336751234  │ │
│ │ value: 1.0                              │ │
│ │ currency: CLP                           │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

### Paso 5: Probar Navegación a FlowReturn

**Acción:** Hacer clic en **"Ir a /flow-return con este token"**

**Resultado esperado:**
1. La página redirige a `/flow-return?token=TEST_TOKEN_1733675123456`
2. Se muestra la página de éxito:

```
┌─────────────────────────────────────────────┐
│                                             │
│              [Logo]                         │
│                                             │
│         ┌───────────────────┐               │
│         │    ✅ Checkmark   │               │
│         └───────────────────┘               │
│                                             │
│         ¡Pago Exitoso!                      │
│                                             │
│    Tu reserva ha sido confirmada            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📧 Próximos pasos:                  │   │
│  │  ✓ Recibirás un correo de confirm. │   │
│  │  ✓ Nuestro equipo te contactará    │   │
│  │  ✓ Guarda tu código de reserva     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Volver al Inicio] [Contactar WhatsApp]   │
│                                             │
└─────────────────────────────────────────────┘
```

3. En DevTools Console aparece:
```javascript
✅ Evento de conversión Google Ads disparado: TEST_TOKEN_1733675123456
```

4. En DevTools Network aparece nueva petición a Google Analytics

---

## 🔄 Probar Múltiples Tokens

### Paso 1: Generar Nuevo Token

**Acción:** Hacer clic en **"Generar Nuevo Token"**

**Resultado en Logs:**
```
🔄 Nuevo token generado: TEST_TOKEN_1733675234567
   14:35:30
```

**Efecto:** El campo de token se actualiza automáticamente

### Paso 2: Disparar Nuevo Evento

**Acción:** Hacer clic en **"Disparar Evento de Conversión"**

**Resultado:** 
- Nuevo evento con nuevo `transaction_id`
- Nueva petición en Network con el nuevo token

### Verificar en Network:

**Primera petición:**
```
transaction_id: TEST_TOKEN_1733675123456
```

**Segunda petición:**
```
transaction_id: TEST_TOKEN_1733675234567
```

**Importante:** Cada token genera una petición separada. Google Ads cuenta solo 1 conversión por token único.

---

## 📊 Interpretación de Resultados

### ✅ Verificación Exitosa

**Indicadores de éxito:**
1. ✅ Badge verde "gtag disponible"
2. ✅ Log: "Evento de conversión Google Ads disparado exitosamente"
3. ✅ Mensaje en Console: "✅ Evento de conversión..."
4. ✅ Petición en Network a google-analytics.com (Status: 200)
5. ✅ Parámetros correctos en la petición

**Conclusión:** La etiqueta está funcionando correctamente ✅

---

### ❌ Problemas Comunes y Soluciones

#### Problema 1: "gtag no disponible"

**Síntomas:**
```
❌ gtag no disponible
```

**Causas posibles:**
- Bloqueador de anuncios activo
- Script de Google Ads no cargado
- Error de red

**Solución:**
1. Desactivar AdBlock/uBlock
2. Verificar en Network que se cargue `gtag/js?id=AW-17529712870`
3. Recargar la página (F5)

---

#### Problema 2: No aparece petición en Network

**Síntomas:**
- Logs muestran evento disparado
- No hay petición en Network

**Causas posibles:**
- Bloqueador de anuncios interceptando petición
- Filtro de Network mal configurado

**Solución:**
1. Desactivar todos los bloqueadores
2. Limpiar filtro de Network (Clear)
3. Asegurarse de que "All" esté seleccionado (no solo "XHR")
4. Disparar evento nuevamente

---

#### Problema 3: Error al copiar token

**Síntomas:**
```
❌ Error al copiar: [error message]
```

**Causas posibles:**
- Navegador no soporta clipboard API
- Página no está en HTTPS

**Solución:**
- Copiar manualmente el token (seleccionar y Ctrl+C)
- El token sigue siendo válido para pruebas

---

## 🎓 Tips y Mejores Prácticas

### 1. Mantener DevTools Abierto

Siempre tener DevTools abierto ANTES de disparar el evento para no perder logs.

### 2. Usar Diferentes Tokens

Generar un nuevo token para cada prueba para simular transacciones únicas.

### 3. Limpiar Logs Regularmente

Usar el botón "Limpiar Logs" entre pruebas para mantener claridad.

### 4. Verificar en Múltiples Navegadores

Probar en Chrome, Firefox, Safari para confirmar compatibilidad.

### 5. Desactivar Extensiones Temporalmente

Si hay problemas, desactivar TODAS las extensiones del navegador temporalmente.

---

## 📱 Prueba en Móvil

### Opción 1: Inspección Remota (Android + Chrome)

1. En PC: Abrir Chrome → `chrome://inspect`
2. En móvil: Activar "Depuración USB"
3. Conectar móvil al PC con USB
4. En PC: Click en "Inspect" en el dispositivo
5. Navegar a `/test-google-ads` en el móvil
6. Ver logs en DevTools del PC

### Opción 2: Eruda (Consola en móvil)

No implementado por defecto, pero se puede agregar:

```javascript
// Agregar temporalmente en index.html para pruebas móviles
<script src="//cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

---

## 🎯 Checklist Visual Rápido

Usar esta lista para verificación rápida:

- [ ] Badge verde "gtag disponible" visible
- [ ] Token generado en el campo de input
- [ ] Botón "Disparar Evento" clickeable
- [ ] Logs aparecen después de clic
- [ ] Mensaje verde "Evento disparado exitosamente"
- [ ] Console muestra "✅ Evento de conversión..."
- [ ] Network muestra petición a google-analytics
- [ ] Parámetros visibles en la petición
- [ ] Navegación a FlowReturn funciona
- [ ] Página de éxito se muestra correctamente

**Si todos los items están ✅, la verificación es exitosa.**

---

## 🔗 Siguientes Pasos

Después de verificar la implementación:

1. **Probar con flujos reales (sin pagar):**
   - Ir a HeroExpress y llenar formulario hasta "Pagar con Flow"
   - NO completar el pago, solo verificar que redirige a Flow

2. **Validar en staging/producción:**
   - Acceder directamente a `/flow-return?token=PROD_TEST`
   - Verificar que funciona igual que en desarrollo

3. **Coordinar con Marketing:**
   - Compartir esta guía con el equipo de marketing
   - Explicar que solo pagos reales incrementan el contador
   - Configurar alertas en Google Ads

4. **Monitorear conversiones:**
   - Revisar Google Ads semanalmente
   - Confirmar que conversiones aumentan con pagos
   - Verificar que transaction_id esté poblado

---

**Última actualización:** 2025-12-08  
**Autor:** GitHub Copilot  
**Versión:** 1.0
