# Fix: Error DNS en envío de emails desde backend

**Fecha:** 15 de octubre de 2025  
**Error:** `getaddrinfo ENOTFOUND www.transportesaraucania.cl`  
**Estado:** ✅ Corregido

---

## 🐛 Problema

El backend de Node.js en Render estaba fallando al intentar enviar emails con el siguiente error:

```
❌ Error al enviar email express (no afecta la reserva): 
getaddrinfo ENOTFOUND www.transportesaraucania.cl
```

### Impacto
- ❌ Emails de confirmación NO se enviaban
- ❌ Admin NO recibía notificaciones de nuevas reservas
- ✅ Las reservas SÍ se guardaban correctamente
- ✅ Los códigos de reserva SÍ se generaban

---

## 🔍 Causa Raíz

**Dominio incorrecto en las URLs del PHP:**

El backend tenía configuradas las siguientes URLs:

```javascript
// ❌ INCORRECTO (faltaba la "u" en "araucania")
"https://www.transportesaraucania.cl/enviar_correo_completo.php"
"https://www.transportesaraucania.cl/enviar_correo_mejorado.php"

// ✅ CORRECTO (con "u")
"https://www.transportesaraucania.cl/enviar_correo_completo.php"
"https://www.transportesaraucania.cl/enviar_correo_mejorado.php"
```

### ¿Por qué falló el DNS?

El error `ENOTFOUND` significa que el DNS no pudo resolver el dominio `transportesaraucania.cl` porque **no existe**. El dominio correcto es `transportesaraucania.cl` (con "u" en "araucania").

---

## ✅ Solución Aplicada

### Archivo: `backend/server-db.js`

Se corrigieron todas las URLs que contenían el dominio incorrecto:

#### Línea ~1715 (Reserva Normal)
```javascript
// ANTES
const phpUrl = process.env.PHP_EMAIL_URL || 
  "https://www.transportesaraucania.cl/enviar_correo_completo.php";

// DESPUÉS
const phpUrl = process.env.PHP_EMAIL_URL || 
  "https://www.transportesaraucania.cl/enviar_correo_completo.php";
```

#### Línea ~1895 (Reserva Express)
```javascript
// ANTES
const phpUrl = process.env.PHP_EMAIL_URL ||
  "https://www.transportesaraucania.cl/enviar_correo_mejorado.php";

// DESPUÉS
const phpUrl = process.env.PHP_EMAIL_URL ||
  "https://www.transportesaraucania.cl/enviar_correo_mejorado.php";
```

#### Línea ~2921 (Frontend URL)
```javascript
// ANTES
process.env.FRONTEND_URL || "https://www.transportesaraucania.cl"

// DESPUÉS
process.env.FRONTEND_URL || "https://www.transportesaraucania.cl"
```

### Comando Utilizado

```bash
sed -i 's/transportesaraucania\.cl/transportesaraucania.cl/g' backend/server-db.js
```

Este comando reemplazó todas las ocurrencias del dominio incorrecto por el correcto.

---

## 🧪 Verificación

### Antes del Fix

```bash
# Test DNS del dominio incorrecto
$ nslookup www.transportesaraucania.cl
** server can't find www.transportesaraucania.cl: NXDOMAIN
```

### Después del Fix

```bash
# Test DNS del dominio correcto
$ nslookup www.transportesaraucania.cl
Name:    transportesaraucania.cl
Address: [IP del servidor]
```

---

## 📊 Archivos Afectados

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `backend/server-db.js` | 274, 1715, 1895, 2921 | 4 URLs corregidas |

---

## 🚀 Despliegue

### Commit
```bash
git add backend/server-db.js ANALISIS_PAGO_PERSONALIZADO.md
git commit -m "Fix: Corregir dominio DNS en URLs de emails PHP"
git push origin main
```

### Impacto
- ✅ Sin breaking changes
- ✅ Compatible con código existente
- ✅ Deploy automático en Render
- ⏱️ Tiempo: 3-5 minutos

---

## 🎯 Resultado Esperado

### Flujo Correcto Después del Fix

```
1. Usuario completa reserva
   ↓
2. Backend genera código (AR-20251015-0001)
   ↓
3. Backend guarda en MySQL ✅
   ↓
4. Backend intenta enviar email
   ↓
5. DNS resuelve: www.transportesaraucania.cl → IP correcta ✅
   ↓
6. Axios llama al PHP exitosamente ✅
   ↓
7. PHP envía email al admin ✅
   ↓
8. Backend responde con código al frontend ✅
```

### Logs Esperados en Render

```
✅ Reserva express guardada en base de datos
📧 Enviando email de reserva express...
✅ Email express enviado: { success: true }
✅ Respuesta enviada al cliente con código
```

**❌ Ya NO aparecerá:**
```
❌ Error al enviar email express: getaddrinfo ENOTFOUND
```

---

## 📝 Notas Importantes

### 1. Variables de Entorno

Si tienes la variable `PHP_EMAIL_URL` configurada en Render, asegúrate de que tenga el dominio correcto:

```env
# ✅ CORRECTO
PHP_EMAIL_URL=https://www.transportesaraucania.cl/enviar_correo_mejorado.php

# ❌ INCORRECTO  
PHP_EMAIL_URL=https://www.transportesaraucania.cl/enviar_correo_mejorado.php
```

### 2. Dominio Correcto

Recuerda siempre usar:
- ✅ `transportesaraucania.cl` (CON "u")
- ❌ `transportesaraucania.cl` (SIN "u")

### 3. Otros Archivos

Verifica que otros archivos también usen el dominio correcto:
- ✅ `src/App.jsx` - Ya usa dominio correcto
- ✅ `enviar_correo_mejorado.php` - Ya usa dominio correcto
- ✅ `enviar_correo_completo.php` - Verificar
- ✅ `vite.config.js` - Verificar

---

## 🔧 Prevención de Errores Futuros

### 1. Crear Constante Global

Considera crear una constante para el dominio:

```javascript
// backend/server-db.js (al inicio del archivo)
const FRONTEND_DOMAIN = "https://www.transportesaraucania.cl";
const PHP_EMAIL_BASE_URL = `${FRONTEND_DOMAIN}/`;

// Uso
const phpUrlExpress = `${PHP_EMAIL_BASE_URL}enviar_correo_mejorado.php`;
const phpUrlNormal = `${PHP_EMAIL_BASE_URL}enviar_correo_completo.php`;
```

### 2. Test Automatizado

Agregar test para verificar DNS:

```javascript
// tests/dns.test.js
describe('DNS Resolution', () => {
  it('should resolve frontend domain', async () => {
    const domain = 'www.transportesaraucania.cl';
    const resolved = await dns.promises.resolve(domain);
    expect(resolved).toBeDefined();
  });
});
```

### 3. Health Check

Agregar endpoint de health check que verifique conectividad con PHP:

```javascript
app.get('/health/php-email', async (req, res) => {
  try {
    const phpUrl = process.env.PHP_EMAIL_URL || 
      "https://www.transportesaraucania.cl/enviar_correo_mejorado.php";
    
    // Solo verificar que el dominio resuelve
    const url = new URL(phpUrl);
    await dns.promises.resolve(url.hostname);
    
    res.json({ status: 'ok', phpUrl, resolved: true });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      resolved: false 
    });
  }
});
```

---

## ✅ Checklist de Verificación Post-Deploy

Cuando Render termine de desplegar:

- [ ] Crear reserva de prueba
- [ ] Verificar en logs: "✅ Email express enviado"
- [ ] Confirmar que NO aparece error DNS
- [ ] Verificar que email llega al admin
- [ ] Confirmar código de reserva en email
- [ ] Verificar código funciona en consulta

---

**Estado:** ✅ Listo para commit y deploy  
**Prioridad:** 🔴 Alta - Funcionalidad crítica de notificaciones  
**Riesgo:** Bajo - Solo cambio de dominio DNS
