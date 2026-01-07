# Documentación de Mejoras al Sistema de Correos Automatizados

## Fecha: 2026-01-04
## Versión: 1.0.0

---

## 📋 Resumen de Cambios

Este documento detalla las mejoras implementadas en el sistema de correos automatizados con descuentos para reservas pendientes de pago.

---

## 🎯 Problemas Solucionados

### 1. ✅ Exponential Backoff en Reintentos
**Archivo:** `backend/cron/emailProcessor.js`

**Problema:** Los reintentos de correos fallidos ocurrían inmediatamente, saturando el sistema.

**Solución Implementada:**
- Backoff exponencial: 2min, 4min, 8min...
- Cálculo: `delayMinutes = Math.pow(2, newAttempts)`
- Reprogramación automática del correo con el nuevo scheduledAt

```javascript
// Implementar exponential backoff: 2min, 4min, 8min...
const delayMinutes = Math.pow(2, newAttempts);
updateData.scheduledAt = new Date(Date.now() + delayMinutes * 60000);
console.log(`⏰ Reintento ${newAttempts} programado en ${delayMinutes} minutos para email ID ${emailTask.id}`);
```

---

### 2. ✅ Notificación al Admin en Fallos Definitivos
**Archivo:** `backend/cron/emailProcessor.js`

**Problema:** Cuando un correo fallaba 3 veces, se marcaba como `failed` pero nadie era notificado.

**Solución Implementada:**
- Notificación automática al admin después de 3 intentos fallidos
- Incluye contexto completo: reservaId, código, error, datos del cliente
- Acción PHP: `notify_admin_failed_email`

```javascript
if (newAttempts >= 3) {
    updateData.status = "failed";
    
    // Notificar al administrador sobre el fallo definitivo
    await axios.post(phpUrl, {
        action: "notify_admin_failed_email",
        reservaId: reserva.id,
        codigoReserva: reserva.codigoReserva,
        email: emailTask.email,
        attempts: newAttempts,
        lastError: error.message,
        tipo: emailTask.type,
        // ... más datos
    }, { timeout: 10000 });
}
```

---

### 3. ✅ Logging Mejorado para Debugging
**Archivo:** `backend/cron/emailProcessor.js`

**Problema:** Los logs de errores no incluían suficiente contexto.

**Solución Implementada:**
- Log estructurado con objeto JSON
- Incluye: error, reservaId, código, email, attempts, scheduledAt, tipo
- Stack trace en modo desarrollo

```javascript
console.error(`❌ Error procesando email ID ${emailTask.id}:`, {
    error: error.message,
    reservaId: emailTask.reservaId,
    codigoReserva: reserva?.codigoReserva,
    email: emailTask.email,
    attempts: emailTask.attempts + 1,
    scheduledAt: emailTask.scheduledAt,
    tipo: emailTask.type,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
});
```

---

### 4. ✅ Optimización de Programación de Correos
**Archivo:** `backend/server-db.js` (líneas 2716-2769)

**Problema:** Se programaban correos aunque hubiera pago parcial.

**Solución Implementada:**
- Verificación adicional de `pagoMonto > 0`
- Logging de debug cuando no se programa un correo
- Comentarios explicativos sobre el flujo

```javascript
if (
    estadoPagoInicial === "pendiente" &&
    datosReserva.source !== "codigo_pago" &&
    (!reservaGuardada.pagoMonto || reservaGuardada.pagoMonto === 0)
) {
    // Programar correo
} else if (estadoPagoInicial === "pendiente") {
    console.log(`ℹ️ Correo de descuento NO programado para ${reservaGuardada.codigoReserva}:`, {
        source: datosReserva.source,
        pagoMonto: reservaGuardada.pagoMonto
    });
}
```

---

### 5. ✅ Limpieza Automática de Correos Antiguos
**Archivo nuevo:** `backend/cron/cleanOldEmails.js`

**Problema:** La tabla `pending_emails` podía crecer indefinidamente.

**Solución Implementada:**
- Función `cleanOldEmails()` que elimina correos > 7 días con estados finales
- Función `getEmailStats()` para monitoreo
- Ejecución automática cada 7 días
- Limpieza inicial después de 5 minutos del arranque

```javascript
export const cleanOldEmails = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const deleted = await PendingEmail.destroy({
        where: {
            status: { [Op.in]: ["sent", "cancelled", "failed"] },
            updatedAt: { [Op.lt]: sevenDaysAgo }
        }
    });
    
    if (deleted > 0) {
        console.log(`🧹 Limpiados ${deleted} correos antiguos de pending_emails`);
    }
    
    return deleted;
};
```

**Integración en `server-db.js`:**
```javascript
// Iniciar limpiador de correos antiguos (cada 7 días)
setInterval(cleanOldEmails, 7 * 24 * 60 * 60 * 1000);

// Limpieza inicial al arrancar (después de 5 minutos)
setTimeout(async () => {
    await cleanOldEmails();
    await getEmailStats();
}, 5 * 60 * 1000);
```

---

## 🔧 Cambios Necesarios en Hostinger (PHP)

### ⚠️ IMPORTANTE: Agregar nueva acción al archivo PHP

El archivo `enviar_correo_mejorado.php` en Hostinger debe ser actualizado para manejar la nueva acción `notify_admin_failed_email`.

**Ubicación:** Servidor de Hostinger  
**Archivo:** `/enviar_correo_mejorado.php`

**Código a agregar:**

```php
// En la línea 173, actualizar el comentario:
$action = $data['action'] ?? 'normal'; 
// Valores posibles: 'normal', 'notify_admin_only', 'send_discount_offer', 'notify_admin_failed_email'

// Después de la línea 224, agregar nueva lógica:

// 1.5 Si es 'notify_admin_failed_email', enviar notificación de error al admin
if ($action === 'notify_admin_failed_email') {
    // Extraer datos del fallo
    $reservaId = $data['reservaId'] ?? 'Desconocido';
    $codigoReserva = $data['codigoReserva'] ?? 'Desconocido';
    $emailCliente = $data['email'] ?? 'Desconocido';
    $attempts = $data['attempts'] ?? 0;
    $lastError = $data['lastError'] ?? 'Error desconocido';
    $tipo = $data['tipo'] ?? 'discount_offer';
    $nombreCliente = $data['nombre'] ?? 'Desconocido';
    $origen = $data['origen'] ?? 'N/A';
    $destino = $data['destino'] ?? 'N/A';
    $fecha = $data['fecha'] ?? 'N/A';
    
    // Crear correo para el administrador
    $mail = new PHPMailer(true);
    
    try {
        // Configuración SMTP
        $mail->isSMTP();
        $mail->Host = $emailHost;
        $mail->SMTPAuth = true;
        $mail->Username = $emailUser;
        $mail->Password = $emailPass;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = $emailPort;
        $mail->CharSet = 'UTF-8';
        
        // Destinatarios
        $mail->setFrom($emailUser, $brandName);
        $mail->addAddress($emailTo);
        
        // Contenido del correo
        $mail->isHTML(true);
        $mail->Subject = "🚨 FALLO: Correo automático no enviado - Reserva $codigoReserva";
        
        $mail->Body = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
                .error-box { background-color: #fff; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
                .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                .info-table td { padding: 8px; border-bottom: 1px solid #ddd; }
                .info-table td:first-child { font-weight: bold; width: 40%; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>🚨 Fallo en Sistema de Correos Automatizados</h2>
                </div>
                <div class='content'>
                    <p>Se ha producido un fallo definitivo al intentar enviar un correo automático después de <strong>$attempts intentos</strong>.</p>
                    
                    <div class='error-box'>
                        <h3>❌ Error:</h3>
                        <p>$lastError</p>
                    </div>
                    
                    <h3>📋 Información de la Reserva:</h3>
                    <table class='info-table'>
                        <tr>
                            <td>Código Reserva:</td>
                            <td><strong>$codigoReserva</strong></td>
                        </tr>
                        <tr>
                            <td>ID Reserva:</td>
                            <td>$reservaId</td>
                        </tr>
                        <tr>
                            <td>Cliente:</td>
                            <td>$nombreCliente</td>
                        </tr>
                        <tr>
                            <td>Email Cliente:</td>
                            <td>$emailCliente</td>
                        </tr>
                        <tr>
                            <td>Tipo de Correo:</td>
                            <td>$tipo</td>
                        </tr>
                        <tr>
                            <td>Ruta:</td>
                            <td>$origen → $destino</td>
                        </tr>
                        <tr>
                            <td>Fecha Viaje:</td>
                            <td>$fecha</td>
                        </tr>
                        <tr>
                            <td>Intentos Realizados:</td>
                            <td><strong>$attempts</strong></td>
                        </tr>
                    </table>
                    
                    <h3>🔧 Acciones Recomendadas:</h3>
                    <ul>
                        <li>Verificar la configuración SMTP</li>
                        <li>Revisar los logs del servidor backend</li>
                        <li>Contactar manualmente al cliente si es necesario</li>
                        <li>Verificar que el email del cliente sea válido</li>
                    </ul>
                    
                    <div class='footer'>
                        <p>Este es un correo automático generado por el sistema de correos de $brandName</p>
                        <p>Timestamp: " . date('Y-m-d H:i:s') . "</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        ";
        
        $mail->AltBody = "FALLO: Correo automático no enviado después de $attempts intentos\n\n" .
                        "Reserva: $codigoReserva\n" .
                        "Cliente: $nombreCliente ($emailCliente)\n" .
                        "Error: $lastError\n" .
                        "Tipo: $tipo\n\n" .
                        "Por favor, revisa los logs del sistema.";
        
        $mail->send();
        
        echo json_encode([
            'success' => true,
            'message' => 'Notificación de fallo enviada al administrador',
            'action' => 'notify_admin_failed_email'
        ]);
        
    } catch (Exception $e) {
        error_log("Error enviando notificación de fallo: " . $mail->ErrorInfo);
        echo json_encode([
            'success' => false,
            'message' => 'Error enviando notificación: ' . $mail->ErrorInfo,
            'action' => 'notify_admin_failed_email'
        ]);
    }
    
    exit; // Terminar aquí para esta acción
}

// 2. Si es 'notify_admin_only' o 'normal', continuamos con la lógica existente
```

---

## 📊 Beneficios Implementados

### ✅ Menor Uso de Recursos
- Backoff exponencial evita saturar el sistema con reintentos inmediatos
- Reducción de carga en servidor SMTP

### ✅ Mejor Mantenibilidad  
- Limpieza automática evita crecimiento descontrolado de la BD
- Base de datos más limpia y eficiente

### ✅ Mayor Visibilidad
- Notificaciones automáticas al admin para fallos críticos
- Logs detallados facilitan debugging y diagnóstico

### ✅ Mejor Experiencia del Usuario
- Evita correos duplicados
- Sistema más robusto ante errores transitorios

---

## 🧪 Pruebas Recomendadas

### 1. Prueba de Backoff Exponencial
1. Simular un fallo de SMTP temporal
2. Verificar que los reintentos ocurran en: 2min, 4min, 8min
3. Verificar logs en consola

### 2. Prueba de Notificación al Admin
1. Simular 3 fallos consecutivos
2. Verificar que se envíe correo al admin con toda la info
3. Revisar el correo recibido por el admin

### 3. Prueba de Limpieza
1. Crear correos antiguos de prueba
2. Esperar la ejecución del cron (o ejecutar manualmente)
3. Verificar que se eliminan solo los correos > 7 días con estados finales

### 4. Prueba de Optimización de Programación
1. Crear reserva con `pagoMonto > 0`
2. Verificar que NO se programa correo de descuento
3. Verificar log de debug

---

## 📝 Notas de Implementación

### Configuración de Entorno
- `NODE_ENV=development` - Muestra stack traces completos
- `PHP_EMAIL_URL` - URL del script PHP en Hostinger

### Intervalos de Cron Jobs
- **Procesador de correos:** 60 segundos
- **Limpiador de correos:** 7 días (604800000 ms)
- **Limpieza inicial:** 5 minutos después del arranque

### Estados de Correos
- `pending` - Pendiente de envío
- `sent` - Enviado exitosamente
- `cancelled` - Cancelado (ej: cliente pagó)
- `failed` - Fallido después de 3 intentos

---

## 🔍 Monitoreo

### Logs a Revisar
```bash
# Ver procesamiento de correos
grep "Procesando.*correos pendientes" logs/app.log

# Ver reintentos con backoff
grep "Reintento.*programado" logs/app.log

# Ver notificaciones al admin
grep "Notificación de fallo enviada" logs/app.log

# Ver limpieza
grep "Limpiados.*correos antiguos" logs/app.log
```

### Consultas SQL Útiles
```sql
-- Ver estadísticas de correos
SELECT status, COUNT(*) as count 
FROM pending_emails 
GROUP BY status;

-- Ver correos fallidos recientes
SELECT * FROM pending_emails 
WHERE status = 'failed' 
ORDER BY updatedAt DESC 
LIMIT 10;

-- Ver correos con múltiples reintentos
SELECT * FROM pending_emails 
WHERE attempts > 1 AND status = 'pending'
ORDER BY attempts DESC;
```

---

## 🚀 Despliegue

### Backend (Render.com)
Los cambios se desplegarán automáticamente al hacer merge del PR.

### PHP (Hostinger)
**⚠️ ACCIÓN MANUAL REQUERIDA:**
1. Acceder al servidor de Hostinger vía FTP o cPanel
2. Editar el archivo `enviar_correo_mejorado.php`
3. Agregar el código para manejar `notify_admin_failed_email`
4. Probar el endpoint con un POST de prueba

---

## 📚 Referencias

- **Issue Original:** #[número]
- **PR:** #[número]
- **Commit:** [hash]

---

## ✍️ Autor

- **GitHub:** @copilot
- **Fecha:** 2026-01-04
- **Versión:** 1.0.0

---

## 📄 Licencia

Este documento forma parte del proyecto Transportes Araucaria.
