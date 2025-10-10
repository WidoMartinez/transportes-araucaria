# Configuración del Sistema de Notificaciones por Correo Electrónico

## Descripción
El sistema utiliza PHPMailer para enviar notificaciones por correo electrónico antes del paso 3 (pago) del proceso de reserva.

## Requisitos

### 1. PHPMailer
La biblioteca PHPMailer debe estar instalada en el directorio raíz del proyecto:

```bash
# Descargar PHPMailer
wget https://github.com/PHPMailer/PHPMailer/archive/refs/tags/v6.9.1.tar.gz -O phpmailer.tar.gz

# Extraer y organizar
tar -xzf phpmailer.tar.gz
mv PHPMailer-6.9.1/src PHPMailer
rm -rf PHPMailer-6.9.1 phpmailer.tar.gz
```

### 2. Configuración de Variables de Entorno
Las credenciales de correo se pueden configurar mediante variables de entorno o usar los valores por defecto en el código:

- `EMAIL_HOST`: Servidor SMTP (por defecto: smtp.hostinger.com)
- `EMAIL_PORT`: Puerto SMTP (por defecto: 465)
- `EMAIL_USER`: Usuario de correo (por defecto: contacto@transportesaraucaria.cl)
- `EMAIL_PASS`: Contraseña del correo
- `EMAIL_TO`: Correo del administrador que recibe las notificaciones

## Archivos Importantes

### enviar_correo_mejorado.php
Archivo principal que:
1. Recibe los datos de la reserva desde el frontend
2. Guarda la reserva en `reservas_data.json`
3. Envía correo al administrador con los detalles
4. Envía correo de confirmación al cliente (si tiene email válido)

### test_email.php
Script de prueba para verificar la configuración de correo:

```bash
php test_email.php
```

Este script:
- Verifica que PHPMailer esté instalado
- Muestra la configuración actual
- Intenta enviar un correo de prueba
- Proporciona salida detallada para diagnóstico

## Flujo de Envío de Correos

### En el Frontend (App.jsx)
1. El usuario completa el Paso 1 (detalles del viaje)
2. El usuario completa el Paso 2 (datos de contacto)
3. **AQUÍ SE ENVÍA EL CORREO** mediante fetch a `/enviar_correo_mejorado.php`
4. Si el correo se envía exitosamente, se avanza al Paso 3 (pago)

### En el Backend (enviar_correo_mejorado.php)
1. Recibe datos JSON del frontend
2. Valida y sanitiza los datos
3. Guarda la reserva en archivo JSON
4. Configura PHPMailer con las credenciales
5. Envía correo al administrador con detalles completos
6. Envía correo de confirmación al cliente
7. Actualiza flags en la reserva guardada
8. Retorna respuesta JSON con el estado

## Diagnóstico de Problemas

### Problema: No se envían correos
**Causas posibles:**
1. PHPMailer no está instalado → Ver sección "Requisitos"
2. Credenciales SMTP incorrectas → Verificar variables de entorno
3. Puerto bloqueado por firewall → Verificar con hosting
4. Límite de envío alcanzado → Revisar con proveedor de email

### Verificación
1. Revisar logs del servidor PHP
2. Ejecutar `test_email.php` para diagnóstico
3. Revisar console del navegador para errores de fetch
4. Verificar que el archivo PHP sea accesible: `https://tudominio.com/enviar_correo_mejorado.php`

### Logs
Los mensajes de log se escriben usando `error_log()` y pueden verse en:
- Logs del servidor web (ej: `/var/log/apache2/error.log`)
- Panel de control del hosting

Ejemplos de logs:
```
✅ Correo administrativo enviado exitosamente a: widomartinez@gmail.com
✅ Correo de confirmación enviado exitosamente al cliente: cliente@example.com
❌ Error al enviar correo: SMTP connect() failed
```

## Seguridad

### Credenciales
- **NUNCA** hacer commit de credenciales en el código
- Usar variables de entorno en producción
- Los valores por defecto en el código son solo para desarrollo local

### Validación
- Todos los datos del usuario son sanitizados con `htmlspecialchars()`
- Los emails son validados con `filter_var()`
- Las respuestas incluyen control de errores apropiado

## Mantenimiento

### Actualizar PHPMailer
```bash
# Descargar nueva versión
wget https://github.com/PHPMailer/PHPMailer/archive/refs/tags/vX.X.X.tar.gz -O phpmailer.tar.gz

# Respaldar versión actual
mv PHPMailer PHPMailer.backup

# Instalar nueva versión
tar -xzf phpmailer.tar.gz
mv PHPMailer-X.X.X/src PHPMailer
rm -rf PHPMailer-X.X.X phpmailer.tar.gz
```

### Monitoreo
- Revisar regularmente el archivo `reservas_data.json` para verificar que las reservas se guardan
- Verificar que los flags `correo_admin_enviado` y `correo_cliente_enviado` se actualizan correctamente
- Mantener un registro de errores de correo para identificar patrones

## Soporte Técnico
Para problemas relacionados con el envío de correos:
1. Ejecutar script de prueba: `php test_email.php`
2. Revisar logs del servidor
3. Verificar configuración SMTP con el proveedor de hosting
4. Contactar al administrador del sistema
