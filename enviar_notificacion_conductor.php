<?php
// enviar_notificacion_conductor.php
// Envía correo al conductor cuando se le asigna un viaje

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

// Campos requeridos
$required = ['conductorEmail', 'conductorNombre', 'codigoReserva', 'pasajeroNombre', 'fecha', 'hora'];
foreach ($required as $f) {
    if (empty($data[$f])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Falta campo: {$f}"]);
        exit;
    }
}

$conductorEmail = $data['conductorEmail'];
$conductorNombre = $data['conductorNombre'];
$codigoReserva = $data['codigoReserva'];
$pasajeroNombre = htmlspecialchars($data['pasajeroNombre'] ?? 'No especificado');
$pasajeroTelefono = htmlspecialchars($data['pasajeroTelefono'] ?? 'No especificado');
$origen = htmlspecialchars($data['origen'] ?? 'No especificado');
$destino = htmlspecialchars($data['destino'] ?? 'No especificado');
$direccionEspecifica = htmlspecialchars($data['direccionEspecifica'] ?? $data['direccionRecogida'] ?? 'No especificada');
$fecha = $data['fecha'];
$hora = $data['hora'];
$pasajeros = $data['pasajeros'] ?? 1;
$vehiculo = htmlspecialchars($data['vehiculo'] ?? 'No asignado');
$observaciones = htmlspecialchars($data['observaciones'] ?? '');
$numeroVuelo = htmlspecialchars($data['numeroVuelo'] ?? '');
$hotel = htmlspecialchars($data['hotel'] ?? '');

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

// Generar archivo .ics para calendario
// Generar archivo .ics para calendario
function generateICS($codigoReserva, $fecha, $hora, $pasajeroNombre, $origen, $destino, $location, $observaciones) {
    $fechaHora = $fecha . ' ' . $hora;
    $timestamp = strtotime($fechaHora);
    
    // Formato UTC para el .ics
    $dtstart = gmdate('Ymd\THis\Z', $timestamp);
    // Duración estimada: 2 horas
    $dtend = gmdate('Ymd\THis\Z', $timestamp + 7200);
    $dtstamp = gmdate('Ymd\THis\Z');
    
    $summary = "Traslado: {$origen} → {$destino}";
    $description = "Código: {$codigoReserva}\\nPasajero: {$pasajeroNombre}";
    if ($observaciones) {
        $description .= "\\nObservaciones: {$observaciones}";
    }
    
    $ics = "BEGIN:VCALENDAR\r\n";
    $ics .= "VERSION:2.0\r\n";
    $ics .= "PRODID:-//Transportes Araucaria//ES\r\n";
    $ics .= "CALSCALE:GREGORIAN\r\n";
    $ics .= "METHOD:REQUEST\r\n";
    $ics .= "BEGIN:VEVENT\r\n";
    $ics .= "UID:reserva-{$codigoReserva}@transportesaraucania.cl\r\n";
    $ics .= "DTSTAMP:{$dtstamp}\r\n";
    $ics .= "DTSTART:{$dtstart}\r\n";
    $ics .= "DTEND:{$dtend}\r\n";
    $ics .= "SUMMARY:{$summary}\r\n";
    $ics .= "DESCRIPTION:{$description}\r\n";
    $ics .= "LOCATION:{$location}\r\n";
    $ics .= "STATUS:CONFIRMED\r\n";
    $ics .= "SEQUENCE:0\r\n";
    $ics .= "END:VEVENT\r\n";
    $ics .= "END:VCALENDAR\r\n";
    
    return $ics;
}

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
    $mail->addAddress($conductorEmail, $conductorNombre);
    // Enviar copia al admin para que tenga registro de las asignaciones
    if (!empty($emailConfig['to'])) {
        $mail->addBCC($emailConfig['to'], 'Admin');
    }

    $mail->isHTML(true);
    $mail->Subject = "🚗 Nuevo Servicio Asignado - {$codigoReserva}";

    // Detalles adicionales
    $detallesAdicionales = '';
    if ($numeroVuelo) {
        $detallesAdicionales .= "
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Nº Vuelo:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$numeroVuelo}</td>
            </tr>";
    }
    if ($hotel) {
        $detallesAdicionales .= "
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Hotel:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$hotel}</td>
            </tr>";
    }
    if ($observaciones) {
        $detallesAdicionales .= "
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Observaciones:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$observaciones}</td>
            </tr>";
    }

    $mail->Body = "
    <!DOCTYPE html>
    <html>
    <head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'></head>
    <body style='margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f8fafc'>
        <div style='max-width:600px;margin:0 auto;background-color:#ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.08)'>
            <div style='background:#059669;color:#ffffff;padding:24px;text-align:center'>
                <div style='font-size:14px;opacity:0.9;margin-bottom:8px'>Nuevo Servicio Asignado</div>
                <div style='font-size:28px;font-weight:bold;letter-spacing:2px'>{$codigoReserva}</div>
                <h1 style='margin:12px 0 0;font-size:22px'>Detalles del Traslado</h1>
            </div>
            <div style='padding:24px'>
                <div style='background-color:#d1fae5;border-left:4px solid #059669;padding:12px 16px;margin-bottom:20px;border-radius:4px;color:#065f46'>
                    Hola <strong>{$conductorNombre}</strong>, se te ha asignado un nuevo servicio de traslado.
                </div>
                <h2 style='color:#0f172a;font-size:18px;margin:0 0 12px 0;border-bottom:2px solid #e5e7eb;padding-bottom:8px'>Información del Servicio</h2>
                <table style='width:100%;border-collapse:collapse;margin-bottom:16px'>
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Pasajero:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$pasajeroNombre}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Teléfono:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'><a href='tel:{$pasajeroTelefono}'>{$pasajeroTelefono}</a></td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Origen:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$origen}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Destino:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$destino}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Dirección Específica:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$direccionEspecifica}</td>
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
                    {$detallesAdicionales}
                </table>
                <div style='background-color:#eff6ff;border:1px solid #3b82f6;border-radius:8px;padding:16px;margin:20px 0;text-align:center'>
                    <p style='margin:0 0 8px;color:#1e40af;font-size:14px'>📅 <strong>Agregar a tu Calendario</strong></p>
                    <p style='margin:0;color:#374151;font-size:12px'>El archivo adjunto (.ics) te permite agregar este servicio a Google Calendar, Outlook o cualquier aplicación de calendario.</p>
                </div>
                <p style='color:#374151;font-size:14px'>
                    Si tienes alguna duda o necesitas modificar algo, contacta a la oficina.
                </p>
                <p style='color:#6b7280;font-size:12px;margin-top:16px'>
                    Gracias por tu profesionalismo.<br>
                    <strong>Transportes Araucaria</strong>
                </p>
            </div>
        </div>
    </body>
    </html>";

    // Obtener ubicación para calendario (preferiblemente dirección específica)
    $calendarLocation = htmlspecialchars($data['calendarLocation'] ?? $direccionEspecifica);

    // Adjuntar archivo .ics
    $icsContent = generateICS($codigoReserva, $fecha, $hora, $pasajeroNombre, $origen, $destino, $calendarLocation, $observaciones);
    $mail->addStringAttachment($icsContent, "servicio-{$codigoReserva}.ics", 'base64', 'text/calendar');

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'Correo enviado al conductor']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error enviando correo: ' . $e->getMessage()]);
}
