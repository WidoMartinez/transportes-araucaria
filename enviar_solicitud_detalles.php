<?php
// enviar_solicitud_detalles.php
// Script para enviar recordatorio de completar detalles de reserva
// Desplegar manualmente en Hostinger

ini_set('display_errors', 0);
error_reporting(E_ALL);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

// --- Configuración de CORS ---
$allowed_origins = [
    'https://www.transportesaraucaria.cl',
    'https://transportesaraucaria.cl',
    'http://localhost:5173'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

header('Content-Type: application/json');

// --- Configuración de Email ---
$emailHost = getenv('EMAIL_HOST') ?: 'smtp.hostinger.com';
$emailPort = getenv('EMAIL_PORT') ?: 465;
$emailUser = getenv('EMAIL_USER') ?: 'contacto@transportesaraucaria.cl';
$emailPass = getenv('EMAIL_PASS') ?: 'TransportesAraucaria7.';
$emailTo = getenv('EMAIL_TO') ?: 'widomartinez@gmail.com';
$brandName = 'Transportes Araucaria';

// Obtiene el cuerpo de la solicitud JSON
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!$data || !isset($data['email']) || !isset($data['codigoReserva'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Error: Datos insuficientes.']);
    exit;
}

$nombre = htmlspecialchars($data['nombre'] ?? 'Cliente');
$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$codigoReserva = htmlspecialchars($data['codigoReserva']);
$origen = htmlspecialchars($data['origen'] ?? '');
$destino = htmlspecialchars($data['destino'] ?? '');
$fecha = htmlspecialchars($data['fecha'] ?? '');
$hora = htmlspecialchars($data['hora'] ?? '');

// Generar link de consulta (usa el hash para navegar en React)
$linkReserva = "https://www.transportesaraucaria.cl/#consultar-reserva?id={$codigoReserva}&email=" . urlencode($email);

// HTML del correo de solicitud
$emailHtml = "
<div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);'>
    <div style='background: #1e3a8a; color: white; padding: 30px 20px; text-align: center;'>
        <h1 style='margin: 0; font-size: 24px;'>¡Hola {$nombre}!</h1>
        <p style='margin: 10px 0 0; opacity: 0.9;'>Falta un detalle importante de tu reserva</p>
    </div>
    
    <div style='padding: 30px 25px;'>
        <p style='font-size: 16px; margin-top: 0;'>Hemos recibido tu pago para la reserva <strong>{$codigoReserva}</strong>, ¡muchas gracias!</p>
        
        <div style='background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 4px;'>
            <p style='margin: 0; color: #9a3412; font-weight: 600;'>⚠️ Acción requerida: Dirección faltante</p>
            <p style='margin: 5px 0 0; color: #9a3412; font-size: 14px;'>Aún no nos has indicado la dirección exacta de recogida o destino. Necesitamos este dato para que el conductor pueda llegar sin problemas.</p>
        </div>

        <p><strong>Resumen de tu viaje:</strong></p>
        <ul style='list-style: none; padding: 0;'>
            <li>📍 <strong>Ruta:</strong> {$origen} → {$destino}</li>
            <li>📅 <strong>Fecha:</strong> {$fecha}</li>
            <li>⏰ <strong>Hora:</strong> {$hora}</li>
        </ul>

        <div style='text-align: center; margin: 35px 0;'>
            <a href='{$linkReserva}' style='background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
                📍 Completar Dirección Ahora
            </a>
            <p style='margin-top: 15px; font-size: 12px; color: #6b7280;'>Si el botón no funciona, copia este link: <br> <span style='word-break: break-all;'>{$linkReserva}</span></p>
        </div>

        <p style='font-size: 14px; border-top: 1px solid #f3f4f6; padding-top: 20px;'>Si tienes alguna duda, puedes responder a este correo o contactarnos vía WhatsApp.</p>
        
        <p style='margin-bottom: 0;'>Saludos,<br><strong>Equipo de {$brandName}</strong></p>
    </div>
    
    <div style='background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af;'>
        <p style='margin: 0;'>Este es un mensaje automático del sistema de reservas.</p>
    </div>
</div>";

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $emailHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $emailUser;
    $mail->Password   = $emailPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $emailPort;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom($emailUser, $brandName);
    $mail->addAddress($email, $nombre);
    $mail->addReplyTo($emailUser, $brandName);

    $mail->isHTML(true);
    $mail->Subject = "⚠️ Acción Requerida: Falta dirección en tu reserva {$codigoReserva}";
    $mail->Body    = $emailHtml;

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'Correo enviado correctamente']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "Error al enviar: {$mail->ErrorInfo}"]);
}
