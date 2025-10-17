# Fix: Timeout en Envío de Emails

## 🐛 Problema Identificado

El sistema de notificaciones por email estaba fallando con el siguiente error:

```
❌ Error al enviar email express (no afecta la reserva): timeout of 10000ms exceeded
```

### Causa Raíz

El servidor SMTP (smtp.titan.email) o la conexión entre Render y Hostinger estaba tardando más de 10 segundos en responder, causando que la petición axios alcanzara el timeout configurado.

---

## ✅ Solución Aplicada

### Cambios en Backend

**Archivo:** `backend/server-db.js`

Se aumentó el timeout de las peticiones de email de **10 segundos a 30 segundos** para dar más margen de tiempo a:

1. La conexión HTTP entre Render y Hostinger
2. El procesamiento PHP en Hostinger
3. La conexión SMTP con Titan Email

### Líneas Modificadas

- **Línea 1723**: Timeout de reservas normales (`enviar_correo_completo.php`)
- **Línea 1946**: Timeout de reservas express (`enviar_correo_mejorado.php`)
- **Línea 3215**: Timeout de otro endpoint de emails

**Antes:**
```javascript
const emailResponse = await axios.post(phpUrl, emailData, {
    headers: { "Content-Type": "application/json" },
    timeout: 10000, // 10 segundos timeout
});
```

**Después:**
```javascript
const emailResponse = await axios.post(phpUrl, emailData, {
    headers: { "Content-Type": "application/json" },
    timeout: 30000, // 30 segundos timeout
});
```

---

## 📊 Comparación de Timeouts

| Tipo de Email | Timeout Anterior | Timeout Nuevo | Mejora |
|---------------|------------------|---------------|--------|
| Reserva Normal | 10 segundos | 30 segundos | +200% |
| Reserva Express | 10 segundos | 30 segundos | +200% |
| Confirmación Pago | 10 segundos | 30 segundos | +200% |

---

## 🔍 Consideraciones

### ¿Por qué 30 segundos?

- ✅ **Margen suficiente**: Da tiempo para conexiones lentas o congestión temporal
- ✅ **No bloquea**: Aún es razonable para el usuario (el error no bloquea la reserva)
- ✅ **Casos de uso**: PHPMailer + SMTP puede tardar 10-20s en casos extremos
- ⚠️ **Trade-off**: Si el servidor está caído, el usuario esperará 30s en lugar de 10s

### Manejo de Errores

El sistema **NO se ve afectado** si el email falla:

```javascript
try {
    // Enviar email...
} catch (emailError) {
    console.error("❌ Error al enviar email (no afecta la reserva):", emailError.message);
    // La reserva ya está guardada, solo falla la notificación
}
```

---

## 🎯 Beneficios de la Solución

✅ **Mayor confiabilidad**: Menos fallos por timeout en emails  
✅ **No afecta UX**: La reserva se guarda independientemente del email  
✅ **Cambio mínimo**: Solo ajuste de configuración  
✅ **Sin cambios en PHP**: No requiere modificar archivos en Hostinger  
✅ **Compatible con plan Free**: No requiere shell access en Render  

---

## 🧪 Testing Recomendado

Para verificar que el fix funciona:

1. Hacer una reserva express desde el sitio
2. Verificar en logs de Render:
   - ✅ Debe mostrar: `✅ Email express enviado exitosamente`
   - ✅ NO debe mostrar: `timeout of 30000ms exceeded`
3. Confirmar que el email llega a la bandeja del administrador
4. Verificar que la reserva se guardó correctamente en la base de datos

### Logs Esperados

```bash
📧 Enviando email de notificación express...
✅ Email express enviado exitosamente: { success: true, message: '...' }
```

---

## 📝 Próximos Pasos (Opcional)

Si los timeouts continúan después de este fix, considerar:

### 1. Optimizar PHP/SMTP
- Revisar configuración de `PHPMailer` en Hostinger
- Considerar usar un SMTP más rápido (SendGrid, AWS SES)
- Agregar logs de tiempo en `enviar_correo_mejorado.php`

### 2. Implementar Cola de Emails
- Usar un sistema de colas (Bull, RabbitMQ)
- Enviar emails de forma asíncrona
- ⚠️ Requiere plan pago en Render

### 3. Monitoreo
- Agregar métricas de tiempo de respuesta
- Alertas si los emails tardan > 20s
- Dashboard de salud del sistema de emails

---

## 🔒 Seguridad y Compatibilidad

- ✅ No expone datos sensibles
- ✅ Compatible con plan Free de Render
- ✅ No requiere cambios en frontend
- ✅ No requiere cambios en PHP/Hostinger
- ✅ Backward compatible

---

## 📌 Resumen

| Aspecto | Detalle |
|---------|---------|
| **Problema** | Timeout de 10s insuficiente para emails |
| **Solución** | Aumentar timeout a 30s |
| **Archivos modificados** | `backend/server-db.js` (3 líneas) |
| **Impacto** | Reducción de errores de timeout en emails |
| **Deploy requerido** | ✅ Sí - Render se redespliegará automáticamente |

---

**Fecha:** 17 de octubre de 2025  
**Estado:** ✅ Implementado  
**Prioridad:** Media - Mejora de confiabilidad  
**Requiere Deploy:** Sí (Render auto-deploy)
