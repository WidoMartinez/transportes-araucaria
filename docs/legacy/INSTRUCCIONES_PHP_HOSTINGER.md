# Instrucciones para Actualizar PHP en Hostinger

## ⚠️ ACCIÓN MANUAL REQUERIDA

Este archivo contiene las instrucciones paso a paso para actualizar el archivo PHP en el servidor de Hostinger. Los cambios en el backend (Render.com) ya están implementados, pero el PHP necesita ser actualizado manualmente.

---

## 📍 Ubicación del Archivo

**Servidor:** Hostinger  
**Ruta:** `/public_html/enviar_correo_mejorado.php` (o similar según configuración)  
**Método de acceso:** FTP, SFTP, o cPanel File Manager

---

## 🎯 Objetivo

Agregar soporte para la nueva acción `notify_admin_failed_email` que permite notificar al administrador cuando un correo automático falla después de 3 intentos.

---

## 📝 Paso 1: Actualizar el Comentario de Acciones

**Ubicación:** Línea 173 aproximadamente

**Buscar:**
```php
$action = $data['action'] ?? 'normal'; // 'normal', 'notify_admin_only', 'send_discount_offer'
```

**Reemplazar por:**
```php
$action = $data['action'] ?? 'normal'; // 'normal', 'notify_admin_only', 'send_discount_offer', 'notify_admin_failed_email'
```

---

## 📝 Paso 2: Agregar Lógica para la Nueva Acción

**Ubicación:** Después de la línea 224 aproximadamente (después del bloque que maneja `send_discount_offer`)

**Buscar este bloque:**
```php
// 1. Si es 'send_discount_offer', saltamos directamente al envío de descuento
if ($action === 'send_discount_offer') {
    goto enviar_descuento;
}

// 2. Si es 'notify_admin_only' o 'normal', enviamos al admin primero
```

**Agregar ANTES de "// 2. Si es 'notify_admin_only'...":**

```php
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
```

---

## ✅ Verificación

Después de hacer los cambios, verificar que el archivo PHP no tenga errores de sintaxis:

### Opción 1: Desde terminal SSH (si tienes acceso)
```bash
php -l enviar_correo_mejorado.php
```

Debería mostrar: `No syntax errors detected in enviar_correo_mejorado.php`

### Opción 2: Probar con curl
```bash
curl -X POST https://www.transportesaraucaria.cl/enviar_correo_mejorado.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "notify_admin_failed_email",
    "reservaId": 999,
    "codigoReserva": "TEST-001",
    "email": "test@example.com",
    "attempts": 3,
    "lastError": "Test error",
    "tipo": "discount_offer",
    "nombre": "Cliente Test",
    "origen": "Santiago",
    "destino": "Temuco",
    "fecha": "2026-01-10"
  }'
```

Debería retornar:
```json
{
  "success": true,
  "message": "Notificación de fallo enviada al administrador",
  "action": "notify_admin_failed_email"
}
```

---

## 🔍 Estructura del Código Final

Después de los cambios, la sección de acciones debería verse así:

```php
// --- LÓGICA DE ENVÍO SEGÚN ACCIÓN ---

// 1. Si es 'send_discount_offer', saltamos directamente al envío de descuento
if ($action === 'send_discount_offer') {
    goto enviar_descuento;
}

// 1.5 Si es 'notify_admin_failed_email', enviar notificación de error al admin
if ($action === 'notify_admin_failed_email') {
    // ... código agregado ...
}

// 2. Si es 'notify_admin_only' o 'normal', enviamos al admin primero
// ... código existente ...
```

---

## 📋 Checklist de Actualización

- [ ] Hacer backup del archivo `enviar_correo_mejorado.php` actual
- [ ] Conectar al servidor vía FTP/SFTP o cPanel
- [ ] Abrir el archivo `enviar_correo_mejorado.php`
- [ ] Actualizar el comentario en línea 173
- [ ] Agregar el nuevo bloque de código después de la línea 224
- [ ] Guardar los cambios
- [ ] Verificar sintaxis PHP (si es posible)
- [ ] Probar con curl o Postman
- [ ] Verificar que se recibe el correo de notificación en el email del admin
- [ ] Documentar la fecha y hora de la actualización

---

## ⚠️ Notas Importantes

1. **No eliminar código existente** - Solo agregar el nuevo bloque
2. **Respetar la indentación** - Mantener el estilo del código existente
3. **Verificar variables de entorno** - `$emailTo` debe tener el email correcto del admin
4. **Hacer backup** - Siempre tener una copia del archivo original
5. **Probar en producción** - Después de actualizar, hacer una prueba real

---

## 🆘 Solución de Problemas

### Problema: Error de sintaxis PHP
**Solución:** Verificar que todas las llaves `{}` estén balanceadas y que no falten `;`

### Problema: No se envía el correo
**Solución:** 
- Verificar configuración SMTP en variables de entorno
- Revisar logs del servidor
- Verificar que `$emailTo` tenga un email válido

### Problema: JSON malformado en respuesta
**Solución:** Verificar que no haya `echo` o `print` adicionales antes del `json_encode`

---

## 📞 Contacto

Si tienes dudas sobre la implementación:
1. Revisar el documento completo en `docs/MEJORAS_SISTEMA_CORREOS.md`
2. Consultar los logs del backend en Render.com
3. Revisar el código en `backend/cron/emailProcessor.js`

---

**Última actualización:** 2026-01-04  
**Versión:** 1.0.0
