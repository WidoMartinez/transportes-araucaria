# Log de Correcciones - Timeout Emails

## 📅 Fecha: 17 de octubre de 2025

### 🐛 Error Corregido: Timeout en Envío de Emails

**Síntoma:**
```
❌ Error al enviar email express (no afecta la reserva): timeout of 10000ms exceeded
```

**Causa:**
- Timeout de 10 segundos era insuficiente
- La cadena completa (Render → Hostinger → SMTP) puede tardar 10-20s
- Especialmente en horas pico o con conexiones lentas

**Solución Aplicada:**
- Aumentar timeout de 10s a 30s en todas las peticiones de email
- Archivos modificados: `backend/server-db.js`
- Líneas: 1723, 1946, 3215

**Comando Usado:**
```bash
sed -i 's/timeout: 10000,/timeout: 30000,/g' server-db.js
```

---

## ⚠️ Lecciones Aprendidas

### 1. Timeouts en Cadena de Llamadas

Cuando hay múltiples servicios en cadena:
```
Frontend → Backend (Render) → PHP (Hostinger) → SMTP (Titan)
```

El timeout debe considerar:
- ✅ Latencia de red entre servicios (2-5s)
- ✅ Procesamiento PHP (1-3s)
- ✅ Conexión SMTP (5-15s en peor caso)
- ✅ Buffer de seguridad (5-10s)

**Recomendación:** Timeout >= 30s para email, 60s para reportes

### 2. No Bloquear el Flujo Principal

El código actual hace esto CORRECTAMENTE:
```javascript
try {
    await axios.post(phpUrl, emailData, { timeout: 30000 });
} catch (error) {
    console.error("❌ Error (no afecta la reserva):", error.message);
    // La reserva YA está guardada
}
```

✅ **Buena práctica:** Email es notificación secundaria, no falla el proceso principal

### 3. Variables de Configuración

Considerar hacer el timeout configurable:
```javascript
const EMAIL_TIMEOUT = process.env.EMAIL_TIMEOUT_MS || 30000;
```

---

## 📊 Métricas para Monitorear

Si el problema persiste, agregar logs de tiempo:

```javascript
const startTime = Date.now();
try {
    await axios.post(phpUrl, emailData, { timeout: 30000 });
    console.log(`⏱️ Email enviado en ${Date.now() - startTime}ms`);
} catch (error) {
    console.error(`⏱️ Timeout después de ${Date.now() - startTime}ms`);
}
```

---

## 🔄 Historial de Cambios en Timeouts

| Fecha | Timeout | Razón |
|-------|---------|-------|
| 15/10/2025 | 10s | Valor inicial conservador |
| 17/10/2025 | 30s | Timeout insuficiente para SMTP |

---

## 🎯 Próximos Pasos si Persiste

1. **Analizar logs de tiempo real:**
   - ¿Cuánto tarda en promedio?
   - ¿Hay patrones por hora del día?

2. **Optimizar PHP/SMTP:**
   - Revisar configuración de PHPMailer
   - Considerar SMTP alternativo más rápido
   - Agregar conexión keep-alive en SMTP

3. **Implementar cola asíncrona:**
   - Usar sistema de colas (Bull, RabbitMQ)
   - Enviar emails en background
   - ⚠️ Requiere plan pago en Render

---

## 🔒 Checklist Pre-Deploy

Antes de hacer deploy con cambios de timeout:

- [x] Verificar que timeout no sea demasiado bajo (<10s)
- [x] Verificar que timeout no sea excesivo (>60s)
- [x] Confirmar que try-catch no bloquea flujo principal
- [x] Documentar cambio en commit
- [x] Probar en ambiente local si es posible
- [ ] Monitorear logs después del deploy

---

**Estado:** ✅ Corregido  
**Deploy Pendiente:** Sí (Render auto-deploy al hacer push)  
**Archivos Modificados:** 
- `backend/server-db.js` (3 líneas)
- `FIX_TIMEOUT_EMAILS.md` (documentación)
- `LOGS_CORRECCIONES.md` (este archivo)

---

## 📝 Notas Adicionales

### Render.com Plan Free
- ✅ Sin shell access, pero no necesario
- ✅ Auto-deploy al hacer push a main
- ⚠️ El servicio "duerme" después de 15min de inactividad
- ⚠️ Primera petición después de despertar puede ser lenta (cold start)

### Sistema de Emails Actual
- **Servidor:** Hostinger (PHP)
- **SMTP:** Titan Email (smtp.titan.email:465)
- **Credenciales:** En variables de entorno
- **Límite:** No documentado, pero suficiente para tráfico actual

---

**Fin del Log**
