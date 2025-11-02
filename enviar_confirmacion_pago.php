<?php
// enviar_confirmacion_pago.php
// Endpoint para enviar correos de confirmación de pago al cliente y admin

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

// Leer datos JSON del body
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON inválido']);
    exit;
}

// Validar campos requeridos
$requiredFields = ['email', 'nombre', 'codigoReserva'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Campo requerido faltante: {$field}"]);
        exit;
    }
}

// Cargar configuración de email
$configFile = __DIR__ . '/config_reservas.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Configuración de email no encontrada']);
    exit;
}

require_once $configFile;

if (!function_exists('getEmailConfig')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Función getEmailConfig no disponible']);
    exit;
}

$emailConfig = getEmailConfig();

// Cargar PHPMailer
$phpMailerPath = __DIR__ . '/PHPMailer/src/PHPMailer.php';
if (!file_exists($phpMailerPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'PHPMailer no encontrado']);
    exit;
}

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Extraer datos
$email = $data['email'];
$nombre = $data['nombre'];
$codigoReserva = $data['codigoReserva'];
$origen = $data['origen'] ?? 'No especificado';
$destino = $data['destino'] ?? 'No especificado';
$fecha = $data['fecha'] ?? 'No especificada';
$hora = $data['hora'] ?? 'No especificada';
$pasajeros = $data['pasajeros'] ?? 1;
$vehiculo = $data['vehiculo'] ?? 'Por asignar';
$monto = $data['monto'] ?? 0;
$gateway = $data['gateway'] ?? 'MercadoPago';
$paymentId = $data['paymentId'] ?? '';
$estadoPago = $data['estadoPago'] ?? 'approved';

// Formatear monto
$montoFormateado = '$' . number_format($monto, 0, ',', '.') . ' CLP';

// Crear instancia de PHPMailer
$mail = new PHPMailer(true);

try {
    // Configuración del servidor SMTP
    $mail->isSMTP();
    $mail->Host       = $emailConfig['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $emailConfig['username'];
    $mail->Password   = $emailConfig['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $emailConfig['port'];
    $mail->CharSet    = 'UTF-8';

    // Remitente
    $mail->setFrom($emailConfig['username'], $emailConfig['from_name']);

    // Destinatario principal (cliente)
    $mail->addAddress($email, $nombre);

    // Copia oculta al admin
    if (!empty($emailConfig['to'])) {
        $mail->addBCC($emailConfig['to'], 'Admin');
    }

    // Contenido del correo
    $mail->isHTML(true);
    $mail->Subject = "✅ Pago Confirmado - Reserva {$codigoReserva} - Transportes Araucaria";

    // Cuerpo del correo HTML
    $mail->Body = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    </head>
    <body style='margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6'>
        <div style='max-width:600px;margin:0 auto;background-color:#ffffff'>
            
            <!-- Banner superior con código -->
            <div style='background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);color:#ffffff;padding:32px 24px;text-align:center'>
                <div style='background-color:rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:16px'>
                    <div style='font-size:14px;opacity:0.9;margin-bottom:8px'>Código de Reserva</div>
                    <div style='font-size:28px;font-weight:bold;letter-spacing:2px'>{$codigoReserva}</div>
                </div>
                <h1 style='margin:0;font-size:24px'>✅ ¡Pago Confirmado!</h1>
                <p style='margin:8px 0 0;font-size:15px;opacity:0.9'>Tu reserva ha sido confirmada exitosamente</p>
            </div>

            <!-- Contenido principal -->
            <div style='padding:32px 24px'>
                
                <!-- Mensaje de bienvenida -->
                <div style='background-color:#ecfdf5;border-left:4px solid #10b981;padding:16px;margin-bottom:24px;border-radius:4px'>
                    <p style='margin:0;color:#065f46;font-size:14px'>
                        <strong>¡Gracias por tu pago, {$nombre}!</strong><br>
                        Hemos confirmado tu pago de <strong>{$montoFormateado}</strong>
                    </p>
                </div>

                <!-- Detalles de la reserva -->
                <h2 style='color:#0f172a;font-size:18px;margin:0 0 16px 0;border-bottom:2px solid #e5e7eb;padding-bottom:8px'>
                    📋 Detalles de tu Reserva
                </h2>

                <table style='width:100%;border-collapse:collapse;margin-bottom:24px'>
                    <tr>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;width:40%'>
                            <strong>Código:</strong>
                        </td>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px'>
                            {$codigoReserva}
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px'>
                            <strong>Origen:</strong>
                        </td>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px'>
                            {$origen}
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px'>
                            <strong>Destino:</strong>
                        </td>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px'>
                            {$destino}
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px'>
                            <strong>Fecha:</strong>
                        </td>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px'>
                            {$fecha}
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px'>
                            <strong>Hora:</strong>
                        </td>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px'>
                            {$hora}
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px'>
                            <strong>Pasajeros:</strong>
                        </td>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px'>
                            {$pasajeros}
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px'>
                            <strong>Vehículo:</strong>
                        </td>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px'>
                            {$vehiculo}
                        </td>
                    </tr>
                </table>

                <!-- Detalles del pago -->
                <h2 style='color:#0f172a;font-size:18px;margin:0 0 16px 0;border-bottom:2px solid #e5e7eb;padding-bottom:8px'>
                    💳 Detalles del Pago
                </h2>

                <table style='width:100%;border-collapse:collapse;margin-bottom:24px'>
                    <tr>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;width:40%'>
                            <strong>Monto Pagado:</strong>
                        </td>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#10b981;font-size:16px;font-weight:bold'>
                            {$montoFormateado}
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px'>
                            <strong>Método de Pago:</strong>
                        </td>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px'>
                            {$gateway}
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px'>
                            <strong>ID de Transacción:</strong>
                        </td>
                        <td style='padding:12px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px'>
                            {$paymentId}
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:12px 0;color:#6b7280;font-size:14px'>
                            <strong>Estado:</strong>
                        </td>
                        <td style='padding:12px 0;color:#10b981;font-size:14px'>
                            <span style='background-color:#d1fae5;color:#065f46;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600'>
                                ✓ APROBADO
                            </span>
                        </td>
                    </tr>
                </table>

                <!-- Próximos pasos -->
                <div style='background-color:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin-bottom:24px;border-radius:4px'>
                    <h3 style='margin:0 0 8px 0;color:#1e40af;font-size:16px'>📌 Próximos Pasos</h3>
                    <ul style='margin:0;padding-left:20px;color:#1e3a8a;font-size:14px'>
                        <li style='margin-bottom:8px'>Guarda este correo como comprobante de tu reserva</li>
                        <li style='margin-bottom:8px'>Nos pondremos en contacto contigo para coordinar los detalles finales</li>
                        <li style='margin-bottom:8px'>Si tienes alguna consulta, responde a este correo</li>
                        <li>Puedes consultar tu reserva en cualquier momento usando tu código: <strong>{$codigoReserva}</strong></li>
                    </ul>
                </div>

                <!-- Contacto -->
                <div style='background-color:#f9fafb;padding:16px;border-radius:4px;text-align:center'>
                    <p style='margin:0 0 8px 0;color:#6b7280;font-size:13px'>
                        ¿Necesitas ayuda? Contáctanos:
                    </p>
                    <p style='margin:0;color:#111827;font-size:14px'>
                        📧 <a href='mailto:contacto@transportesaraucaria.cl' style='color:#3b82f6;text-decoration:none'>contacto@transportesaraucaria.cl</a><br>
                        📱 <a href='tel:+56936643540' style='color:#3b82f6;text-decoration:none'>+569 3664 3540</a>
                    </p>
                </div>

            </div>

            <!-- Footer -->
            <div style='background-color:#f3f4f6;padding:24px;text-align:center;border-top:1px solid #e5e7eb'>
                <p style='margin:0 0 8px 0;color:#0f172a;font-size:16px;font-weight:600'>
                    Transportes Araucaria
                </p>
                <p style='margin:0;color:#6b7280;font-size:13px'>
                    Tu transporte seguro y confiable en la Región de la Araucanía
                </p>
                <p style='margin:8px 0 0 0;color:#9ca3af;font-size:12px'>
                    © 2025 Transportes Araucaria. Todos los derechos reservados.
                </p>
            </div>

        </div>
    </body>
    </html>
    ";

    // Versión de texto plano
    $mail->AltBody = "
    ✅ PAGO CONFIRMADO - Transportes Araucaria
    
    Código de Reserva: {$codigoReserva}
    
    ¡Gracias por tu pago, {$nombre}!
    Hemos confirmado tu pago de {$montoFormateado}
    
    DETALLES DE TU RESERVA:
    - Código: {$codigoReserva}
    - Origen: {$origen}
    - Destino: {$destino}
    - Fecha: {$fecha}
    - Hora: {$hora}
    - Pasajeros: {$pasajeros}
    - Vehículo: {$vehiculo}
    
    DETALLES DEL PAGO:
    - Monto Pagado: {$montoFormateado}
    - Método de Pago: {$gateway}
    - ID de Transacción: {$paymentId}
    - Estado: APROBADO
    
    PRÓXIMOS PASOS:
    - Guarda este correo como comprobante
    - Nos pondremos en contacto para coordinar detalles finales
    - Si tienes consultas, responde a este correo
    - Consulta tu reserva usando el código: {$codigoReserva}
    
    ¿Necesitas ayuda?
    Email: contacto@transportesaraucaria.cl
    Teléfono: +569 3664 3540
    
    © 2025 Transportes Araucaria
    ";

    // Enviar correo
    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'Email de confirmación de pago enviado exitosamente',
        'codigoReserva' => $codigoReserva
    ]);
} catch (Exception $e) {
    error_log("Error al enviar email de confirmación de pago: " . $mail->ErrorInfo);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al enviar el correo: ' . $mail->ErrorInfo
    ]);
}
