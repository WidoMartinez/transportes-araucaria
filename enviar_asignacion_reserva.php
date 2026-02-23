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
$vehiculoTipo = $data['vehiculoTipo'] ?? '';
$vehiculoPatenteLast4 = $data['vehiculoPatenteLast4'] ?? '';
$origen = htmlspecialchars($data['origen'] ?? 'No especificado');
$destino = htmlspecialchars($data['destino'] ?? 'No especificado');
$fecha = $data['fecha'] ?? '';
$hora = $data['hora'] ?? '';
$pasajeros = $data['pasajeros'] ?? '';
$conductorNombre = $data['conductorNombre'] ?? '';
$upgradeVan = $data['upgradeVan'] ?? false;
// Correo enviado para el tramo de VUELTA (incluye contexto tramo IDA)
$esTramoVuelta = $data['esTramoVuelta'] ?? false;
$tramoIda = $data['tramoIda'] ?? null;       // Datos de la IDA (si este correo es de la VUELTA)
// Retrocompatibilidad: campo anterior tramoVuelta / idaVuelta
$tramoVuelta = $data['tramoVuelta'] ?? null;
$idaVuelta = $data['idaVuelta'] ?? false;
$fechaRegreso = $data['fechaRegreso'] ?? '';
$horaRegreso = $data['horaRegreso'] ?? '';

// Verificar estado de pago - solo enviar correo a clientes que han pagado
$estadoPago = $data['estadoPago'] ?? 'pendiente';
$clienteHaPagado = in_array($estadoPago, ['aprobado', 'pagado', 'parcial']);

if (!$clienteHaPagado) {
    echo json_encode([
        'success' => true, 
        'message' => 'Correo de asignación omitido - cliente sin pago confirmado'
    ]);
    exit;
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
    $mail->addAddress($email, $nombre);
    if (!empty($emailConfig['to'])) {
        $mail->addBCC($emailConfig['to'], 'Admin');
    }

    $mail->isHTML(true);

    // Determinar si el correo trae contexto de otro tramo
    $tieneContextoIda = !empty($tramoIda);
    $tieneContextoVuelta = !empty($tramoVuelta) || ($idaVuelta && $fechaRegreso); // retrocompat

    if ($esTramoVuelta) {
        $mail->Subject = "🚐 Asignación de Vuelta Confirmada - Reserva {$codigoReserva}";
        $tituloSeccionActual = "🔄 Viaje de Vuelta";
    } elseif ($tieneContextoVuelta) {
        // Retrocompatibilidad: correo enviado cuando se asigna la vuelta en el modelo anterior
        $mail->Subject = "🚐 Asignación de Vehículo (Ida y Vuelta) - Reserva {$codigoReserva}";
        $tituloSeccionActual = "✈️ Viaje de Ida";
    } else {
        $mail->Subject = "🚐 Asignación de Vehículo - Reserva {$codigoReserva}";
        $tituloSeccionActual = "Detalles de tu Viaje";
    }

    // HTML conductor del tramo actual
    $conductorHtml = '';
    if ($conductorNombre) {
        $conductorHtml = "
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Conductor:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>" . htmlspecialchars($conductorNombre) . "</td>
            </tr>";
    }

    // --- Bloque HTML del tramo IDA (contexto, cuando el correo es de VUELTA) ---
    $tramoPrevioHtml = '';
    if ($tieneContextoIda) {
        $idaOrigen    = htmlspecialchars($tramoIda['origen'] ?? 'No especificado');
        $idaDestino   = htmlspecialchars($tramoIda['destino'] ?? 'No especificado');
        $idaFecha     = htmlspecialchars($tramoIda['fecha'] ?? '');
        $idaHora      = htmlspecialchars($tramoIda['hora'] ?? '');
        $idaVehiculo  = htmlspecialchars($tramoIda['vehiculo'] ?? '');
        $idaConductor = htmlspecialchars($tramoIda['conductorNombre'] ?? '');
        $idaConductorHtml = $idaConductor
            ? "<tr><td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Conductor:</strong></td>
               <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$idaConductor}</td></tr>"
            : '';

        $tramoPrevioHtml = "
        <h2 style='color:#0f172a;font-size:18px;margin:0 0 12px 0;border-bottom:2px solid #e5e7eb;padding-bottom:8px'>
            ✈️ Viaje de Ida (ya confirmado)
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
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Vehículo:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$idaVehiculo}</td>
            </tr>
            {$idaConductorHtml}
        </table>
        <hr style='border:none;border-top:2px solid #7c3aed;margin:16px 0'>
        ";
    }

    // --- Bloque HTML del tramo VUELTA (retrocompat: cuando se envía desde la IDA en el formato anterior) ---
    $tramoSecundarioHtml = '';
    if (!empty($tramoVuelta)) {
        $vtOrigen    = htmlspecialchars($tramoVuelta['origen'] ?? 'No especificado');
        $vtDestino   = htmlspecialchars($tramoVuelta['destino'] ?? 'No especificado');
        $vtFecha     = htmlspecialchars($tramoVuelta['fecha'] ?? '');
        $vtHora      = htmlspecialchars($tramoVuelta['hora'] ?? '');
        $vtVehiculo  = htmlspecialchars($tramoVuelta['vehiculo'] ?? $vehiculo);
        $vtConductor = htmlspecialchars($tramoVuelta['conductorNombre'] ?? '');
        $vtConductorHtml = $vtConductor
            ? "<tr><td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Conductor:</strong></td>
               <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$vtConductor}</td></tr>"
            : '';

        $tramoSecundarioHtml = "
        <h2 style='color:#0f172a;font-size:18px;margin:24px 0 12px 0;border-bottom:2px solid #7c3aed;padding-bottom:8px'>
            🔄 Viaje de Vuelta
        </h2>
        <table style='width:100%;border-collapse:collapse;margin-bottom:16px'>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Ruta:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$vtOrigen} → {$vtDestino}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Fecha:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$vtFecha}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Hora:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$vtHora}</td>
            </tr>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Vehículo:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$vtVehiculo}</td>
            </tr>
            {$vtConductorHtml}
        </table>";
    } elseif ($idaVuelta && $fechaRegreso) {
        // Retrocompatibilidad: fechaRegreso/horaRegreso
        $tramoSecundarioHtml = "
        <h2 style='color:#0f172a;font-size:18px;margin:24px 0 12px 0;border-bottom:2px solid #7c3aed;padding-bottom:8px'>
            🔄 Viaje de Vuelta
        </h2>
        <table style='width:100%;border-collapse:collapse;margin-bottom:16px'>
            <tr>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280;width:40%'><strong>Fecha Regreso:</strong></td>
                <td style='padding:8px 0;border-bottom:1px solid #eee;color:#7c3aed;font-weight:600'>🔄 {$fechaRegreso} a las {$horaRegreso}</td>
            </tr>
        </table>";
    }

    $vehiculoDisplay = (!empty($vehiculoTipo) ? $vehiculoTipo : (explode(' ', trim($vehiculo))[0] ?? $vehiculo))
        . (!empty($vehiculoPatenteLast4) ? " <span style='color:#6b7280'>(patente •••{$vehiculoPatenteLast4})</span>" : "");

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
                {$tramoPrevioHtml}
                <h2 style='color:#0f172a;font-size:18px;margin:0 0 12px 0;border-bottom:2px solid #e5e7eb;padding-bottom:8px'>
                    {$tituloSeccionActual}
                </h2>
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
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#111827'>{$vehiculoDisplay}</td>
                    </tr>
                    " . ($upgradeVan ? "
                    <tr>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#6b7280'><strong>Premium:</strong></td>
                        <td style='padding:8px 0;border-bottom:1px solid #eee;color:#7c2d12;font-weight:bold'>✨ Upgrade a Van</td>
                    </tr>" : "") . "
                    {$conductorHtml}
                </table>
                {$tramoSecundarioHtml}
                <p style='color:#374151;font-size:14px'>
                    Si necesitas actualizar algún detalle (número de vuelo, hotel, etc.), responde a este correo.
                </p>
                <div style='background-color:#f9fafb;padding:16px;border-radius:4px;text-align:center;margin-top:20px'>
                    <p style='margin:0 0 8px 0;color:#6b7280;font-size:13px'>¿Necesitas ayuda? Contáctanos:</p>
                    <p style='margin:0;color:#111827;font-size:14px'>
                        📧 <a href='mailto:contacto@transportesaraucaria.cl' style='color:#3b82f6;text-decoration:none'>contacto@transportesaraucaria.cl</a><br>
                        📱 <a href='tel:+56936643540' style='color:#3b82f6;text-decoration:none'>+56 9 3664 3540</a>
                    </p>
                </div>
                <p style='color:#6b7280;font-size:12px;margin-top:16px'>Gracias por elegir Transportes Araucaria.</p>
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
