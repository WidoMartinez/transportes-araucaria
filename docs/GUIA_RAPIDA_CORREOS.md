# Guía Rápida - Sistema de Correos Automatizados Mejorado

## 🚀 Quick Start

Esta guía proporciona información rápida sobre las mejoras implementadas en el sistema de correos automatizados.

---

## 📋 ¿Qué Cambió?

### 1️⃣ Exponential Backoff (Reintentos Inteligentes)
Los correos que fallan ya no se reenvían inmediatamente. Ahora hay delays progresivos:
- **Intento 1:** Falla → espera **2 minutos**
- **Intento 2:** Falla → espera **4 minutos**  
- **Intento 3:** Falla → se marca como **fallido** y notifica al admin

### 2️⃣ Notificaciones al Admin
Cuando un correo falla 3 veces, el admin recibe automáticamente un correo con:
- Detalles de la reserva
- Error específico
- Información del cliente
- Recomendaciones de acción

### 3️⃣ Logs Mejorados
Los errores ahora incluyen contexto completo para debugging:
```javascript
{
  error: "SMTP timeout",
  reservaId: 123,
  codigoReserva: "TAXI-2026-001",
  email: "cliente@example.com",
  attempts: 2,
  tipo: "discount_offer"
}
```

### 4️⃣ Programación Optimizada
No se programan correos si:
- El cliente ya tiene un `pagoMonto > 0`
- La reserva se creó con `source: "codigo_pago"`

### 5️⃣ Limpieza Automática
Cada 7 días, el sistema limpia automáticamente:
- Correos enviados (`sent`) > 7 días
- Correos cancelados (`cancelled`) > 7 días
- Correos fallidos (`failed`) > 7 días

---

## 📁 Archivos Modificados

| Archivo | Cambios | Descripción |
|---------|---------|-------------|
| `backend/cron/emailProcessor.js` | +54 líneas | Backoff, notificaciones, logs |
| `backend/cron/cleanOldEmails.js` | NUEVO | Limpieza automática |
| `backend/server-db.js` | +27 líneas | Optimizaciones, cron limpieza |

---

## 🔍 Comandos Útiles de Monitoreo

### Ver procesamiento de correos
```bash
grep "Procesando.*correos pendientes" logs/app.log
```

### Ver reintentos con backoff
```bash
grep "Reintento.*programado" logs/app.log
```

### Ver notificaciones al admin
```bash
grep "Notificación de fallo enviada" logs/app.log
```

### Ver limpieza de correos antiguos
```bash
grep "Limpiados.*correos antiguos" logs/app.log
```

---

## 🗄️ Consultas SQL Útiles

### Ver estadísticas de correos
```sql
SELECT status, COUNT(*) as count 
FROM pending_emails 
GROUP BY status;
```

### Ver correos fallidos recientes
```sql
SELECT * FROM pending_emails 
WHERE status = 'failed' 
ORDER BY updatedAt DESC 
LIMIT 10;
```

### Ver correos con múltiples reintentos
```sql
SELECT * FROM pending_emails 
WHERE attempts > 1 AND status = 'pending'
ORDER BY attempts DESC;
```

---

## ⚙️ Variables de Entorno

### PHP_EMAIL_URL
**Descripción:** URL del script PHP en Hostinger  
**Requerido:** Sí (recomendado)  
**Fallback:** `https://www.transportesaraucaria.cl/enviar_correo_mejorado.php`  
**Nota:** Si no está configurado, verás warnings en los logs

**Configurar en Render.com:**
```
PHP_EMAIL_URL=https://www.transportesaraucaria.cl/enviar_correo_mejorado.php
```

### NODE_ENV
**Descripción:** Entorno de ejecución  
**Valores:** `development` | `production`  
**Impacto:** En `development` se muestran stack traces completos en logs

---

## 🆘 Troubleshooting

### Problema: Correos no se están enviando
**Posibles causas:**
1. Verificar que el procesador esté corriendo (debe ver logs cada 60s)
2. Revisar configuración SMTP en el PHP
3. Verificar conexión a la base de datos

**Verificación:**
```bash
grep "Procesador de correos" logs/app.log
```

### Problema: Correos se marcan como fallidos muy rápido
**Causa:** El exponential backoff requiere tiempo entre reintentos
**Solución:** Esperar al menos 2+4+8 = 14 minutos antes de marcar como fallido

### Problema: No se reciben notificaciones de fallos
**Posibles causas:**
1. El archivo PHP en Hostinger no tiene la nueva acción `notify_admin_failed_email`
2. La configuración SMTP en el PHP no es correcta
3. El email del admin no está configurado

**Solución:** Ver `docs/INSTRUCCIONES_PHP_HOSTINGER.md`

---

## 📞 Documentación Completa

- **Técnica detallada:** `docs/MEJORAS_SISTEMA_CORREOS.md`
- **Actualizar PHP:** `docs/INSTRUCCIONES_PHP_HOSTINGER.md`
- **Resumen completo:** `docs/RESUMEN_IMPLEMENTACION.md`

---

## ⏱️ Tiempos y Frecuencias

| Proceso | Frecuencia | Detalles |
|---------|-----------|----------|
| Procesador de correos | 60 segundos | Revisa correos pendientes |
| Limpiador automático | 7 días | Elimina correos antiguos |
| Limpieza inicial | 5 minutos | Al arrancar el servidor |
| Backoff intento 1 | 2 minutos | Después del primer fallo |
| Backoff intento 2 | 4 minutos | Después del segundo fallo |
| Backoff intento 3 | 8 minutos | Después del tercer fallo |

---

## 🎯 Estados de Correos

| Estado | Descripción | Acción |
|--------|-------------|---------|
| `pending` | Esperando envío | Se procesará cuando llegue `scheduledAt` |
| `sent` | Enviado exitosamente | Se eliminará después de 7 días |
| `cancelled` | Cancelado (cliente pagó) | Se eliminará después de 7 días |
| `failed` | Falló 3 veces | Admin notificado, se eliminará después de 7 días |

---

## 🔔 Eventos Importantes

### Cuando se crea una reserva pendiente
1. Se programa un correo de descuento para 30 minutos después
2. Se envía notificación inmediata solo al admin

### Cuando llega el momento de enviar
1. Se verifica que la reserva siga pendiente
2. Si ya pagó, se cancela el correo
3. Si sigue pendiente, se envía el descuento

### Cuando un correo falla
1. Se registra el error en `lastError`
2. Se incrementa el contador `attempts`
3. Si `attempts < 3`: se reprograma con backoff
4. Si `attempts >= 3`: se marca como `failed` y notifica al admin

### Cuando pasa una semana
1. El limpiador revisa correos con estados finales
2. Elimina los que tienen `updatedAt > 7 días`
3. Registra cuántos se eliminaron

---

## ✅ Checklist de Verificación Post-Deploy

- [ ] El servidor arranca correctamente
- [ ] Aparece log: "🕒 Procesador de correos pendientes iniciado"
- [ ] Aparece log: "🧹 Limpiador de correos antiguos iniciado"
- [ ] No hay warnings de `PHP_EMAIL_URL` (si está configurado)
- [ ] Después de 5 minutos, ver log: "🔄 Ejecutando limpieza inicial"
- [ ] Los correos pendientes se procesan correctamente
- [ ] El archivo PHP en Hostinger está actualizado

---

## 🔗 Enlaces Útiles

- **Repositorio:** https://github.com/WidoMartinez/transportes-araucaria
- **Backend (Render):** https://render.com (tu proyecto)
- **Frontend/PHP (Hostinger):** https://www.transportesaraucaria.cl

---

**Última actualización:** 2026-01-04  
**Versión:** 1.0.0  
**Branch:** `copilot/optimize-automated-email-system`
