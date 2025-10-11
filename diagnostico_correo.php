<?php
// diagnostico_correo.php
// Script completo de diagnóstico del sistema de correo
// Ejecutar visitando: https://tudominio.com/diagnostico_correo.php

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnóstico del Sistema de Correo - Transportes Araucaria</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 20px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .panel {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #003366; margin-top: 0; }
        h2 { color: #0066cc; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
        .success { color: #28a745; font-weight: bold; }
        .error { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .info { color: #17a2b8; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; overflow-x: auto; }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 10px;
        }
        .btn:hover { background: #0052a3; }
    </style>
</head>
<body>
    <div class="panel">
        <h1>🔍 Diagnóstico del Sistema de Correo Electrónico</h1>
        <p>Este script verifica la configuración del sistema de notificaciones por correo.</p>
    </div>

    <?php
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;

    // 1. Verificar PHP y extensiones
    echo '<div class="panel"><h2>1. Información de PHP</h2>';
    echo '<table>';
    echo '<tr><th>Item</th><th>Valor</th><th>Estado</th></tr>';
    
    $phpVersion = phpversion();
    echo '<tr><td>Versión de PHP</td><td>' . $phpVersion . '</td><td>';
    echo version_compare($phpVersion, '7.4.0', '>=') ? '<span class="success">✓ OK</span>' : '<span class="error">✗ Requiere PHP 7.4+</span>';
    echo '</td></tr>';
    
    $extensions = ['openssl', 'sockets', 'json'];
    foreach ($extensions as $ext) {
        echo '<tr><td>Extensión: ' . $ext . '</td><td>';
        echo extension_loaded($ext) ? 'Instalada' : 'No instalada';
        echo '</td><td>';
        echo extension_loaded($ext) ? '<span class="success">✓ OK</span>' : '<span class="error">✗ Falta</span>';
        echo '</td></tr>';
    }
    
    echo '</table></div>';

    // 2. Verificar archivos
    echo '<div class="panel"><h2>2. Archivos del Sistema</h2>';
    echo '<table>';
    echo '<tr><th>Archivo</th><th>Estado</th></tr>';
    
    $files = [
        'PHPMailer/src/PHPMailer.php' => 'PHPMailer principal',
        'PHPMailer/src/SMTP.php' => 'Módulo SMTP',
        'PHPMailer/src/Exception.php' => 'Excepciones',
        'enviar_correo_mejorado.php' => 'Endpoint de correo',
        'reservas_data.json' => 'Archivo de reservas'
    ];
    
    foreach ($files as $file => $desc) {
        echo '<tr><td>' . $desc . ' <span class="info">(' . $file . ')</span></td><td>';
        if (file_exists($file)) {
            echo '<span class="success">✓ Existe</span>';
            if ($file === 'reservas_data.json' && !is_writable($file)) {
                echo ' <span class="warning">⚠ No escribible</span>';
            }
        } else {
            echo '<span class="error">✗ No existe</span>';
        }
        echo '</td></tr>';
    }
    
    echo '</table></div>';

    // 3. Cargar PHPMailer
    echo '<div class="panel"><h2>3. Carga de PHPMailer</h2>';
    
    $phpmailerLoaded = false;
    try {
        require_once 'PHPMailer/src/Exception.php';
        require_once 'PHPMailer/src/PHPMailer.php';
        require_once 'PHPMailer/src/SMTP.php';
        
        if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            echo '<p class="success">✓ PHPMailer cargado correctamente</p>';
            $mail = new PHPMailer(true);
            echo '<p>Versión: ' . PHPMailer::VERSION . '</p>';
            $phpmailerLoaded = true;
        } else {
            echo '<p class="error">✗ PHPMailer no se pudo cargar</p>';
        }
    } catch (Exception $e) {
        echo '<p class="error">✗ Error al cargar PHPMailer: ' . $e->getMessage() . '</p>';
    }
    
    echo '</div>';

    // 4. Configuración de correo
    echo '<div class="panel"><h2>4. Configuración de Correo</h2>';
    
    $emailHost = getenv('EMAIL_HOST') ?: 'smtp.hostinger.com';
    $emailPort = getenv('EMAIL_PORT') ?: 465;
    $emailUser = getenv('EMAIL_USER') ?: 'contacto@transportesaraucaria.cl';
    $emailPass = getenv('EMAIL_PASS') ?: '***OCULTO***';
    $emailTo = getenv('EMAIL_TO') ?: 'widomartinez@gmail.com';
    
    echo '<table>';
    echo '<tr><th>Parámetro</th><th>Valor</th></tr>';
    echo '<tr><td>Host SMTP</td><td>' . htmlspecialchars($emailHost) . '</td></tr>';
    echo '<tr><td>Puerto SMTP</td><td>' . htmlspecialchars($emailPort) . '</td></tr>';
    echo '<tr><td>Usuario</td><td>' . htmlspecialchars($emailUser) . '</td></tr>';
    echo '<tr><td>Contraseña</td><td>' . (getenv('EMAIL_PASS') ? '***CONFIGURADA***' : '***USAR VALOR POR DEFECTO***') . '</td></tr>';
    echo '<tr><td>Destinatario Admin</td><td>' . htmlspecialchars($emailTo) . '</td></tr>';
    echo '</table>';
    
    echo '</div>';

    // 5. Prueba de conexión SMTP
    if ($phpmailerLoaded) {
        echo '<div class="panel"><h2>5. Prueba de Conexión SMTP</h2>';
        
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $emailHost;
            $mail->SMTPAuth = true;
            $mail->Username = getenv('EMAIL_USER') ?: 'contacto@transportesaraucaria.cl';
            $mail->Password = getenv('EMAIL_PASS') ?: 'TransportesAraucaria7.';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port = $emailPort;
            $mail->Timeout = 10;
            
            // Configuración SSL
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );
            
            // Intentar conectar
            echo '<p class="info">Intentando conectar a ' . $emailHost . ':' . $emailPort . '...</p>';
            
            if ($mail->smtpConnect()) {
                echo '<p class="success">✓ Conexión SMTP exitosa</p>';
                $mail->smtpClose();
            } else {
                echo '<p class="error">✗ No se pudo conectar al servidor SMTP</p>';
            }
            
        } catch (Exception $e) {
            echo '<p class="error">✗ Error en la conexión: ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
        
        echo '</div>';
    }

    // 6. Verificar últimas reservas
    echo '<div class="panel"><h2>6. Últimas Reservas</h2>';
    
    if (file_exists('reservas_data.json')) {
        $contenido = file_get_contents('reservas_data.json');
        $reservas = json_decode($contenido, true);
        
        if (is_array($reservas) && count($reservas) > 0) {
            echo '<p>Total de reservas: <strong>' . count($reservas) . '</strong></p>';
            echo '<p>Últimas 5 reservas:</p>';
            echo '<table>';
            echo '<tr><th>ID</th><th>Fecha</th><th>Correo Admin</th><th>Correo Cliente</th></tr>';
            
            $ultimas = array_slice($reservas, 0, 5);
            foreach ($ultimas as $reserva) {
                echo '<tr>';
                echo '<td>' . htmlspecialchars($reserva['id'] ?? 'N/A') . '</td>';
                echo '<td>' . htmlspecialchars($reserva['fecha_registro'] ?? 'N/A') . '</td>';
                echo '<td>';
                if (isset($reserva['correo_admin_enviado']) && $reserva['correo_admin_enviado']) {
                    echo '<span class="success">✓ Enviado</span>';
                } else {
                    echo '<span class="error">✗ No enviado</span>';
                }
                echo '</td>';
                echo '<td>';
                if (isset($reserva['correo_cliente_enviado']) && $reserva['correo_cliente_enviado']) {
                    echo '<span class="success">✓ Enviado</span>';
                } else {
                    echo '<span class="warning">- No enviado</span>';
                }
                echo '</td>';
                echo '</tr>';
            }
            
            echo '</table>';
        } else {
            echo '<p class="warning">No hay reservas guardadas aún</p>';
        }
    } else {
        echo '<p class="warning">El archivo de reservas no existe todavía</p>';
    }
    
    echo '</div>';

    // 7. Recomendaciones
    echo '<div class="panel"><h2>7. Recomendaciones</h2>';
    echo '<ul>';
    
    if (!$phpmailerLoaded) {
        echo '<li class="error">Instalar PHPMailer siguiendo las instrucciones en INSTRUCCIONES_EMAIL.md</li>';
    }
    
    if (!extension_loaded('openssl')) {
        echo '<li class="error">Habilitar la extensión OpenSSL en PHP para conexiones seguras</li>';
    }
    
    if (file_exists('reservas_data.json') && !is_writable('reservas_data.json')) {
        echo '<li class="warning">Dar permisos de escritura al archivo reservas_data.json</li>';
    }
    
    echo '<li class="info">Revisar los logs del servidor para ver mensajes detallados de error</li>';
    echo '<li class="info">Probar el script test_email.php desde línea de comandos</li>';
    echo '<li class="info">Verificar con el proveedor de hosting que el puerto SMTP no esté bloqueado</li>';
    
    echo '</ul>';
    echo '</div>';

    // 8. Acciones
    echo '<div class="panel"><h2>8. Acciones Disponibles</h2>';
    echo '<p>Scripts de prueba:</p>';
    echo '<div class="code">php test_email.php</div>';
    echo '<p>Ver documentación completa:</p>';
    echo '<a href="INSTRUCCIONES_EMAIL.md" class="btn">Ver INSTRUCCIONES_EMAIL.md</a>';
    echo '</div>';
    ?>

    <div class="panel">
        <p style="text-align: center; color: #666; font-size: 12px;">
            Diagnóstico generado el <?php echo date('Y-m-d H:i:s'); ?>
        </p>
    </div>
</body>
</html>
