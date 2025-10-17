<?php
// enviar_asignacion_reserva.php
// Envía correo al pasajero cuando se asigna vehículo y/o conductor a su reserva

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

// Campos requeridos mínimos
$required = ['email', 'nombre', 'codigoReserva', 'vehiculo'];
foreach ($required as $f) {
    if (empty($data[$f])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Falta campo: {$f}"]);
        exit;
    }
}

$email = $data['email'];
$nombre = $data['nombre'];
$codigoReserva = $data['codigoReserva'];
$vehiculo = $data['vehiculo'];
$origen = $data['origen'] ?? 'No especificado';
$destino = $data['destino'] ?? 'No especificado';
$fecha = $data['fecha'] ?? '';
$hora = $data['hora'] ?? '';
$pasajeros = $data['pasajeros'] ?? '';
$conductorNombre = $data['conductorNombre'] ?? '';
$conductorRut = $data['conductorRut'] ?? '';

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
    $mail->addAddress($email, $nombre);
    if (!empty($emailConfig['to'])) {
        $mail->addBCC($emailConfig['to'], 'Admin');
    }

    $mail->isHTML(true);
    $mail->Subject = "🚐 Asignación de Vehículo - Reserva {$codigoReserva}";

    $conductorHtml = '';
    if ($conductorNombre) {
        $conductorHtml = "
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Conductor:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$conductorNombre}"
                . ($conductorRut ? " ({$conductorRut})" : "") .
            "</td>
            </tr>";
    }

    $mail->Body = "
    <!DOCTYPE html>
    <html>
    <head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'></head>
    <body style='margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f8fafc'>
        <div style='max-width:600px;margin:0 auto;background-color:#ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.08)'>
            <div style='background:#0f172a;color:#ffffff;padding:24px;text-align:center'>
                <div style='font-size:14px;opacity:0.9;margin-bottom:8px'>Código de Reserva</div>
                <div style='font-size:28px;font-weight:bold;letter-spacing:2px'>{$codigoReserva}</div>
                <h1 style='margin:12px 0 0;font-size:22px'>Asignación Confirmada</h1>
                <p style='margin:6px 0 0;opacity:0.9'>Tu vehículo ha sido asignado</p>
            </div>
            <div style='padding:24px'>
                <div style='background-color:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin-bottom:20px;border-radius:4px;color:#1e40af'>
                    Estimad@ <strong>{$nombre}</strong>, tu traslado ha sido programado con el siguiente vehículo.
                </div>
                <h2 style='color:#0f172a;font-size:18px;margin:0 0 12px 0;border-bottom:2px solid #e5e7eb;padding-bottom:8px'>Detalles de tu Viaje</h2>
                <table style='width:100%;border-collapse:collapse;margin-bottom:16px'>
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Ruta:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$origen} → {$destino}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Fecha:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$fecha}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Hora:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$hora}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Pasajeros:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$pasajeros}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Vehículo:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$vehiculo}</td>
                    </tr>
                    {$conductorHtml}
                </table>
                <p style='color:#374151;font-size:14px'>
                    Si necesitas actualizar algún detalle (número de vuelo, hotel, etc.), responde a este correo.
                </p>
                <p style='color:#6b7280;font-size:12px;margin-top:16px'>
                    Gracias por elegir Transportes Araucaria.
                </p>
            </div>
        </div>
    </body>
    </html>";

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'Correo enviado']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error enviando correo: ' . $e->getMessage()]);
}

