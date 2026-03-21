<?php
// ⚠️ DESPLIEGUE MANUAL EN HOSTINGER
// enviar_notificacion_evaluacion_admin.php
// Envía notificación al administrador cuando se recibe una evaluación de pasajero.
// Este archivo se sube manualmente al servidor de Hostinger.

ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON inválido']);
    exit;
}

// Datos de la evaluación
$reservaCodigo    = htmlspecialchars($data['reserva_codigo'] ?? 'Sin código');
$clienteNombre    = htmlspecialchars($data['cliente_nombre'] ?? 'Pasajero desconocido');
$conductorNombre  = htmlspecialchars($data['conductor_nombre'] ?? 'No especificado');
$promedio         = number_format((float)($data['promedio'] ?? 0), 2);
$comentario       = htmlspecialchars($data['comentario'] ?? '');
$propinaMonto     = (float)($data['propina_monto'] ?? 0);
$propinaPagada    = !empty($data['propina_pagada']);

// Calificaciones por categoría
$califs = $data['calificaciones'] ?? [];
$puntualidad    = (int)($califs['puntualidad'] ?? 0);
$limpieza       = (int)($califs['limpieza'] ?? 0);
$seguridad      = (int)($califs['seguridad'] ?? 0);
$comunicacion   = (int)($califs['comunicacion'] ?? 0);

// Función para renderizar estrellas en HTML
function renderEstrellas($valor) {
    $html = '';
    for ($i = 1; $i <= 5; $i++) {
        $html .= $i <= $valor ? '⭐' : '☆';
    }
    return $html . " ({$valor}/5)";
}

// Información de propina (marcada como confidencial)
$propinaMonto_fmt = number_format($propinaMonto, 0, ',', '.');
$propinaHtml = '';
if ($propinaMonto > 0) {
    $estadoPropina = $propinaPagada
        ? "<span style='color:#16a34a;font-weight:bold;'>✅ PAGADA</span>"
        : "<span style='color:#d97706;font-weight:bold;'>⏳ PENDIENTE</span>";
    $propinaHtml = "
    <div style='background:#fef3c7;border:2px solid #f59e0b;border-radius:10px;padding:20px;margin:20px 0;'>
        <h3 style='color:#92400e;margin:0 0 15px;font-size:16px;'>🔒 PROPINA — INFORMACIÓN CONFIDENCIAL</h3>
        <table style='width:100%;border-collapse:collapse;'>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #fde68a;color:#92400e;width:40%;font-weight:bold;'>Monto propina:</td>
                <td style='padding:8px 0;border-bottom:1px solid #fde68a;color:#451a03;font-size:18px;font-weight:bold;'>
                    \${$propinaMonto_fmt} CLP
                </td>
            </tr>
            <tr>
                <td style='padding:8px 0;color:#92400e;font-weight:bold;'>Estado pago:</td>
                <td style='padding:8px 0;'>{$estadoPropina}</td>
            </tr>
        </table>
        <p style='color:#92400e;font-size:12px;margin:12px 0 0;'>
            🔒 Esta información es confidencial y solo visible para el administrador.
        </p>
    </div>";
}

// Cargar config correo
$configFile = __DIR__ . '/config_reservas.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Configuración no encontrada']);
    exit;
}
require_once $configFile;
if (!function_exists('getEmailConfig')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Función de config no disponible']);
    exit;
}
$emailConfig = getEmailConfig();

// PHPMailer
require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $emailConfig['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $emailConfig['username'];
    $mail->Password   = $emailConfig['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $emailConfig['port'];
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom($emailConfig['username'], $emailConfig['from_name']);
    // Notificación al admin
    $adminEmail = $emailConfig['to'] ?? $emailConfig['username'];
    $mail->addAddress($adminEmail, 'Administrador');

    $mail->isHTML(true);
    $mail->Subject = "⭐ Nueva Evaluación Recibida — Reserva #{$reservaCodigo}";

    $comentarioHtml = !empty($comentario)
        ? "<div style='background:#fdf6ed;border-left:4px solid #a0522d;padding:15px;border-radius:0 8px 8px 0;margin-top:10px;'>
               <p style='color:#3d2209;font-style:italic;margin:0;font-size:14px;'>\"" . nl2br($comentario) . "\"</p>
           </div>"
        : "<p style='color:#9c7a5a;font-style:italic;font-size:14px;'>Sin comentarios</p>";

    $mail->Body = "
    <!DOCTYPE html>
    <html lang='es'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Nueva Evaluación</title>
    </head>
    <body style='margin:0;padding:0;background:#f5ede0;font-family:Arial,sans-serif;'>
        <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);'>

            <!-- Header -->
            <div style='background:linear-gradient(135deg,#3d2209,#7c3f00);padding:35px 30px;text-align:center;'>
                <div style='font-size:44px;margin-bottom:10px;'>⭐</div>
                <h1 style='color:#fff;margin:0;font-size:24px;font-weight:700;'>Nueva Evaluación Recibida</h1>
                <p style='color:#f5deb3;margin:8px 0 0;font-size:14px;'>Reserva #{$reservaCodigo}</p>
            </div>

            <div style='padding:30px;'>

                <!-- Promedio grande -->
                <div style='text-align:center;margin-bottom:25px;'>
                    <div style='display:inline-block;background:linear-gradient(135deg,#7c3f00,#a0522d);
                                color:#fff;border-radius:50%;width:80px;height:80px;
                                line-height:80px;font-size:28px;font-weight:800;'>
                        {$promedio}
                    </div>
                    <p style='color:#7c3f00;font-size:14px;margin:8px 0 0;'>Calificación Promedio</p>
                </div>

                <!-- Datos de la evaluación -->
                <div style='background:#fdf6ed;border:1px solid #e8d5b7;border-radius:10px;padding:20px;margin-bottom:20px;'>
                    <h3 style='color:#7c3f00;margin:0 0 15px;font-size:16px;'>📋 Datos del viaje evaluado</h3>
                    <table style='width:100%;border-collapse:collapse;'>
                        <tr>
                            <td style='padding:8px 0;border-bottom:1px solid #e8d5b7;color:#7c5a2a;width:40%;font-weight:bold;'>Pasajero:</td>
                            <td style='padding:8px 0;border-bottom:1px solid #e8d5b7;color:#3d2209;'>{$clienteNombre}</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 0;border-bottom:1px solid #e8d5b7;color:#7c5a2a;width:40%;font-weight:bold;'>Conductor:</td>
                            <td style='padding:8px 0;border-bottom:1px solid #e8d5b7;color:#3d2209;'>{$conductorNombre}</td>
                        </tr>
                    </table>
                </div>

                <!-- Calificaciones por categoría -->
                <div style='background:#fdf6ed;border:1px solid #e8d5b7;border-radius:10px;padding:20px;margin-bottom:20px;'>
                    <h3 style='color:#7c3f00;margin:0 0 15px;font-size:16px;'>📊 Calificaciones por categoría</h3>
                    <table style='width:100%;border-collapse:collapse;'>
                        <tr>
                            <td style='padding:8px 0;border-bottom:1px solid #e8d5b7;color:#7c5a2a;font-weight:bold;'>⏰ Puntualidad</td>
                            <td style='padding:8px 0;border-bottom:1px solid #e8d5b7;color:#3d2209;'>". renderEstrellas($puntualidad) ."</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 0;border-bottom:1px solid #e8d5b7;color:#7c5a2a;font-weight:bold;'>✨ Limpieza</td>
                            <td style='padding:8px 0;border-bottom:1px solid #e8d5b7;color:#3d2209;'>". renderEstrellas($limpieza) ."</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 0;border-bottom:1px solid #e8d5b7;color:#7c5a2a;font-weight:bold;'>🛡️ Seguridad</td>
                            <td style='padding:8px 0;border-bottom:1px solid #e8d5b7;color:#3d2209;'>". renderEstrellas($seguridad) ."</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 0;color:#7c5a2a;font-weight:bold;'>💬 Comunicación</td>
                            <td style='padding:8px 0;color:#3d2209;'>". renderEstrellas($comunicacion) ."</td>
                        </tr>
                    </table>
                </div>

                <!-- Comentario -->
                <div style='margin-bottom:20px;'>
                    <h3 style='color:#7c3f00;margin:0 0 10px;font-size:16px;'>💬 Comentario del pasajero</h3>
                    {$comentarioHtml}
                </div>

                <!-- Propina (confidencial) -->
                {$propinaHtml}

                <!-- Enlace al panel admin -->
                <div style='text-align:center;margin-top:25px;'>
                    <a href='https://www.transportesaraucania.cl/?admin=true&panel=evaluaciones'
                       style='display:inline-block;background:linear-gradient(135deg,#7c3f00,#a0522d);color:#fff;
                              text-decoration:none;padding:12px 30px;border-radius:50px;font-size:14px;font-weight:700;'>
                        📋 Ver en Panel Administrativo
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style='background:#3d2209;padding:20px;text-align:center;'>
                <p style='color:#c8a882;font-size:13px;margin:0;'>
                    Sistema de Evaluaciones — Transportes Araucanía
                </p>
            </div>
        </div>
    </body>
    </html>";

    $mail->AltBody = "Nueva evaluación recibida para reserva #{$reservaCodigo}.\nPasajero: {$clienteNombre}\nPromedio: {$promedio}/5\nPuntualidad: {$puntualidad}/5 | Limpieza: {$limpieza}/5 | Seguridad: {$seguridad}/5 | Comunicación: {$comunicacion}/5\nComentario: {$comentario}";

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'Notificación enviada al administrador']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al enviar notificación: ' . $mail->ErrorInfo]);
}
