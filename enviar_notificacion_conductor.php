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
$upgradeVan = $data['upgradeVan'] ?? false;
// Contexto del tramo IDA (cuando este correo es del tramo VUELTA y mismo conductor)
$tramoIda = $data['tramoIda'] ?? null;
// Retrocompatibilidad: campo anterior segundoTramo
$segundoTramo = $data['segundoTramo'] ?? null;

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

// Generar archivo .ics para un solo evento
function generateICS($uid, $fecha, $hora, $origen, $destino, $location, $pasajeroNombre, $observaciones) {
    $timestamp = strtotime($fecha . ' ' . $hora);
    $dtstart   = gmdate('Ymd\THis\Z', $timestamp);
    $dtend     = gmdate('Ymd\THis\Z', $timestamp + 7200);
    $dtstamp   = gmdate('Ymd\THis\Z');
    $desc = "Pasajero: {$pasajeroNombre}";
    if ($observaciones) $desc .= "\\nObs: {$observaciones}";

    $ev  = "BEGIN:VEVENT\r\n";
    $ev .= "UID:{$uid}\r\n";
    $ev .= "DTSTAMP:{$dtstamp}\r\n";
    $ev .= "DTSTART:{$dtstart}\r\n";
    $ev .= "DTEND:{$dtend}\r\n";
    $ev .= "SUMMARY:Traslado: {$origen} → {$destino}\r\n";
    $ev .= "DESCRIPTION:{$desc}\r\n";
    $ev .= "LOCATION:{$location}\r\n";
    $ev .= "STATUS:CONFIRMED\r\n";
    $ev .= "SEQUENCE:0\r\n";
    $ev .= "END:VEVENT\r\n";
    return $ev;
}

// Generar .ics con dos eventos (viaje actual + tramo IDA de contexto)
function buildICSCalendar(array $events) {
    $ics  = "BEGIN:VCALENDAR\r\n";
    $ics .= "VERSION:2.0\r\n";
    $ics .= "PRODID:-//Transportes Araucaria//ES\r\n";
    $ics .= "CALSCALE:GREGORIAN\r\n";
    $ics .= "METHOD:REQUEST\r\n";
    foreach ($events as $ev) {
        $ics .= $ev;
    }
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
    if (!empty($emailConfig['to'])) {
        $mail->addBCC($emailConfig['to'], 'Admin');
    }

    $mail->isHTML(true);

    // Determinar si incluimos contexto de otro tramo
    $tieneContextoIda = !empty($tramoIda);
    // Retrocompatibilidad con el campo anterior
    $tieneContextoVuelta = !empty($segundoTramo);

    if ($tieneContextoIda) {
        $mail->Subject = "🚗 Traslado de Vuelta Asignado - {$codigoReserva}";
    } elseif ($tieneContextoVuelta) {
        $mail->Subject = "🚗 Nuevo Servicio Asignado (Ida y Vuelta) - {$codigoReserva}";
    } else {
        $mail->Subject = "🚗 Nuevo Servicio Asignado - {$codigoReserva}";
    }

    // Detalles adicionales del tramo actual
    $detallesAdicionales = '';
    if ($numeroVuelo) {
        $detallesAdicionales .= "<tr><td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Nº Vuelo:</strong></td>
            <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$numeroVuelo}</td></tr>";
    }
    if ($hotel) {
        $detallesAdicionales .= "<tr><td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Hotel:</strong></td>
            <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$hotel}</td></tr>";
    }
    if ($observaciones) {
        $detallesAdicionales .= "<tr><td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Observaciones:</strong></td>
            <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$observaciones}</td></tr>";
    }

    // --- Bloque HTML del contexto IDA (cuando este correo es de la VUELTA) ---
    $contextoPrevioHtml = '';
    if ($tieneContextoIda) {
        $idaOrigen = htmlspecialchars($tramoIda['origen'] ?? 'No especificado');
        $idaDestino = htmlspecialchars($tramoIda['destino'] ?? 'No especificado');
        $idaFecha = htmlspecialchars($tramoIda['fecha'] ?? '');
        $idaHora = htmlspecialchars($tramoIda['hora'] ?? '');
        $idaDir = htmlspecialchars($tramoIda['direccionEspecifica'] ?? '');
        $idaVehiculo = htmlspecialchars($tramoIda['vehiculo'] ?? $vehiculo);

        $contextoPrevioHtml = "
        <h2 style='color:#0f172a;font-size:18px;margin:0 0 12px 0;border-bottom:2px solid #e5e7eb;padding-bottom:8px'>
            ✈️ Viaje de Ida (ya notificado)
        </h2>
        <table style='width:100%;border-collapse:collapse;margin-bottom:20px;opacity:0.85'>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Ruta:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$idaOrigen} → {$idaDestino}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Fecha:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$idaFecha}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Hora:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$idaHora}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Dirección:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$idaDir}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Vehículo:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$idaVehiculo}</td>
            </tr>
        </table>
        <hr style='border:none;border-top:2px solid #059669;margin:16px 0'>
        ";
    }

    // --- Bloque HTML del tramo secundario (retrocompat: segundoTramo) ---
    $tramoSecundarioHtml = '';
    if ($tieneContextoVuelta) {
        $st2 = $segundoTramo;
        $st2Origen  = htmlspecialchars($st2['origen'] ?? 'No especificado');
        $st2Destino = htmlspecialchars($st2['destino'] ?? 'No especificado');
        $st2Fecha   = htmlspecialchars($st2['fecha'] ?? '');
        $st2Hora    = htmlspecialchars($st2['hora'] ?? '');
        $st2Dir     = htmlspecialchars($st2['direccionEspecifica'] ?? '');
        $st2Vh      = htmlspecialchars($st2['vehiculo'] ?? $vehiculo);

        $tramoSecundarioHtml = "
        <h2 style='color:#0f172a;font-size:18px;margin:24px 0 12px 0;border-bottom:2px solid #7c3aed;padding-bottom:8px'>
            🔄 Viaje de Vuelta
        </h2>
        <table style='width:100%;border-collapse:collapse;margin-bottom:16px'>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Ruta:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$st2Origen} → {$st2Destino}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Fecha:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$st2Fecha}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Hora:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$st2Hora}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Dirección:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$st2Dir}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Vehículo:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$st2Vh}</td>
            </tr>
        </table>";
    }

    $tituloSeccionActual = $tieneContextoIda ? "🔄 Viaje de Vuelta" : "Información del Servicio";

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
                {$contextoPrevioHtml}
                <h2 style='color:#0f172a;font-size:18px;margin:0 0 12px 0;border-bottom:2px solid #e5e7eb;padding-bottom:8px'>
                    {$tituloSeccionActual}
                </h2>
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
                    " . ($upgradeVan ? "
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Premium:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#7c2d12;font-weight:bold'>✨ Upgrade a Van</td>
                    </tr>" : "") . "
                    {$detallesAdicionales}
                </table>
                {$tramoSecundarioHtml}
                <div style='background-color:#eff6ff;border:1px solid #3b82f6;border-radius:8px;padding:16px;margin:20px 0;text-align:center'>
                    <p style='margin:0 0 8px;color:#1e40af;font-size:14px'>📅 <strong>Agregar a tu Calendario</strong></p>
                    <p style='margin:0;color:#374151;font-size:12px'>El archivo adjunto (.ics) te permite agregar este servicio a Google Calendar, Outlook o cualquier aplicación de calendario.</p>
                </div>
                <p style='color:#374151;font-size:14px'>Si tienes alguna duda, contacta a la oficina.</p>
                <div style='background-color:#f9fafb;padding:12px;border-radius:4px;text-align:center;margin-top:16px;border:1px solid #e5e7eb'>
                    <p style='margin:0 0 5px 0;color:#6b7280;font-size:12px'>Contacto Oficina:</p>
                    <p style='margin:0;color:#111827;font-size:13px'>
                        📱 <a href='tel:+56936643540' style='color:#059669;text-decoration:none'>+56 9 3664 3540</a> | 
                        📧 <a href='mailto:contacto@transportesaraucaria.cl' style='color:#059669;text-decoration:none'>contacto@transportesaraucaria.cl</a>
                    </p>
                </div>
                <p style='color:#6b7280;font-size:12px;margin-top:16px'>
                    Gracias por tu profesionalismo.<br>
                    <strong>Transportes Araucaria</strong>
                </p>
            </div>
        </div>
    </body>
    </html>";

    // Obtener ubicación para calendario
    $calendarLocation = htmlspecialchars($data['calendarLocation'] ?? $direccionEspecifica);

    // Generar archivo .ics
    $icsEvents = [];
    if ($tieneContextoIda) {
        // Incluir evento IDA (contexto)
        $idaDir = htmlspecialchars($tramoIda['direccionEspecifica'] ?? $calendarLocation);
        $icsEvents[] = generateICS(
            "reserva-{$codigoReserva}-ida@transportesaraucania.cl",
            $tramoIda['fecha'], $tramoIda['hora'],
            htmlspecialchars($tramoIda['origen'] ?? ''),
            htmlspecialchars($tramoIda['destino'] ?? ''),
            $idaDir, $pasajeroNombre, ''
        );
        // Evento VUELTA (actual)
        $icsEvents[] = generateICS(
            "reserva-{$codigoReserva}-vuelta@transportesaraucania.cl",
            $fecha, $hora, $origen, $destino, $calendarLocation, $pasajeroNombre, $observaciones
        );
        $icsFile = "servicio-{$codigoReserva}-ida-vuelta.ics";
    } elseif ($tieneContextoVuelta) {
        // Retrocompat: segundoTramo
        $st2Dir = htmlspecialchars($segundoTramo['direccionEspecifica'] ?? $calendarLocation);
        $icsEvents[] = generateICS(
            "reserva-{$codigoReserva}-ida@transportesaraucania.cl",
            $fecha, $hora, $origen, $destino, $calendarLocation, $pasajeroNombre, $observaciones
        );
        $icsEvents[] = generateICS(
            "reserva-{$codigoReserva}-vuelta@transportesaraucania.cl",
            $segundoTramo['fecha'], $segundoTramo['hora'],
            htmlspecialchars($segundoTramo['origen'] ?? ''),
            htmlspecialchars($segundoTramo['destino'] ?? ''),
            $st2Dir, $pasajeroNombre, ''
        );
        $icsFile = "servicio-{$codigoReserva}-ida-vuelta.ics";
    } else {
        // Solo un tramo
        $icsEvents[] = generateICS(
            "reserva-{$codigoReserva}@transportesaraucania.cl",
            $fecha, $hora, $origen, $destino, $calendarLocation, $pasajeroNombre, $observaciones
        );
        $icsFile = "servicio-{$codigoReserva}.ics";
    }

    $icsContent = buildICSCalendar($icsEvents);
    $mail->addStringAttachment($icsContent, $icsFile, 'base64', 'text/calendar');

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'Correo enviado al conductor']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error enviando correo: ' . $e->getMessage()]);
}
