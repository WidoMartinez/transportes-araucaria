<?php
// test_email.php
// Script de prueba para verificar la configuración de correo electrónico
// Ejecutar desde línea de comandos: php test_email.php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

echo "=== Test de Configuración de Correo Electrónico ===\n\n";

// Configuración
$emailHost = getenv('EMAIL_HOST') ?: 'smtp.hostinger.com';
$emailPort = getenv('EMAIL_PORT') ?: 465;
$emailUser = getenv('EMAIL_USER') ?: 'contacto@transportesaraucaria.cl';
$emailPass = getenv('EMAIL_PASS') ?: 'TransportesAraucaria7.';
$emailTo = getenv('EMAIL_TO') ?: 'widomartinez@gmail.com';

echo "Configuración:\n";
echo "- Host: {$emailHost}\n";
echo "- Port: {$emailPort}\n";
echo "- User: {$emailUser}\n";
echo "- To: {$emailTo}\n\n";

// Verificar que PHPMailer está cargado
if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
    die("❌ Error: PHPMailer no está disponible.\n");
}
echo "✅ PHPMailer cargado correctamente\n\n";

// Crear instancia de PHPMailer
$mail = new PHPMailer(true);

try {
    // Habilitar depuración detallada
    $mail->SMTPDebug = 2;
    $mail->Debugoutput = function($str, $level) {
        echo "Debug level $level: $str\n";
    };

    // Configuración del servidor
    $mail->isSMTP();
    $mail->Host       = $emailHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $emailUser;
    $mail->Password   = $emailPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $emailPort;
    $mail->CharSet    = 'UTF-8';

    // Destinatarios
    $mail->setFrom($emailUser, 'Test Transportes Araucaria');
    $mail->addAddress($emailTo);

    // Contenido
    $mail->isHTML(true);
    $mail->Subject = 'Test de Configuración de Correo - ' . date('Y-m-d H:i:s');
    $mail->Body    = '<p>Este es un correo de prueba para verificar la configuración de PHPMailer.</p><p>Si recibes este mensaje, la configuración está funcionando correctamente.</p>';

    echo "\nIntentando enviar correo de prueba...\n\n";
    $mail->send();
    echo "\n✅ ¡Correo enviado exitosamente!\n";
} catch (Exception $e) {
    echo "\n❌ Error al enviar el correo: {$mail->ErrorInfo}\n";
    echo "Excepción: {$e->getMessage()}\n";
}
