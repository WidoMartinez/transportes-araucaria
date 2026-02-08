<?php
// enviar_calificacion.php
// Endpoint para enviar correos automáticos de solicitud de calificación al completar un viaje

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
$requiredFields = ['email', 'nombre', 'reservaId'];
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
$reservaId = $data['reservaId'];
$codigoReserva = $data['codigoReserva'] ?? "Reserva #{$reservaId}";
$origen = $data['origen'] ?? 'No especificado';
$destino = $data['destino'] ?? 'No especificado';
$fecha = $data['fecha'] ?? 'No especificada';

// Construir URL de calificación
$baseUrl = $data['baseUrl'] ?? 'https://www.transportesaraucaria.cl';
$urlCalificacion = "{$baseUrl}/#calificar?reserva={$reservaId}";

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

    // Logging para debug
    error_log("Enviando solicitud de calificación a: {$email} para reserva ID: {$reservaId}");

    // Contenido del correo
    $mail->isHTML(true);
    $mail->Subject = "🌟 ¿Cómo fue tu experiencia? - Transportes Araucanía";

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
            
            <!-- Banner superior con degradado -->
            <div style='background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);color:#ffffff;padding:40px 24px;text-align:center'>
                <div style='font-size:48px;margin-bottom:16px'>🌟</div>
                <h1 style='margin:0;font-size:28px;font-weight:bold'>¡Gracias por viajar con nosotros!</h1>
                <p style='margin:12px 0 0;font-size:16px;opacity:0.95'>Tu opinión nos ayuda a mejorar</p>
            </div>

            <!-- Contenido principal -->
            <div style='padding:32px 24px'>
                
                <!-- Saludo personalizado -->
                <p style='font-size:16px;color:#1f2937;margin:0 0 24px;line-height:1.6'>
                    Hola <strong>{$nombre}</strong>,
                </p>

                <p style='font-size:16px;color:#1f2937;margin:0 0 24px;line-height:1.6'>
                    Esperamos que hayas disfrutado de tu viaje con <strong>Transportes Araucanía</strong>. 
                    Nos encantaría conocer tu opinión sobre el servicio.
                </p>

                <!-- Detalles del viaje -->
                <div style='background-color:#f9fafb;border-left:4px solid #3b82f6;padding:20px;margin:24px 0;border-radius:4px'>
                    <div style='font-size:14px;color:#6b7280;margin-bottom:8px'>Detalles de tu viaje</div>
                    <div style='font-size:16px;color:#1f2937;margin-bottom:8px'>
                        <strong>Código:</strong> {$codigoReserva}
                    </div>
                    <div style='font-size:16px;color:#1f2937;margin-bottom:8px'>
                        <strong>Ruta:</strong> {$origen} → {$destino}
                    </div>
                    <div style='font-size:16px;color:#1f2937'>
                        <strong>Fecha:</strong> {$fecha}
                    </div>
                </div>

                <!-- Llamado a la acción -->
                <div style='text-align:center;margin:32px 0'>
                    <p style='font-size:18px;color:#1f2937;margin:0 0 24px;font-weight:500'>
                        Califica tu experiencia en solo 2 minutos
                    </p>
                    <a href='{$urlCalificacion}' 
                       style='display:inline-block;background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 6px rgba(59, 130, 246, 0.3)'>
                        ⭐ Calificar mi viaje
                    </a>
                </div>

                <!-- Información adicional -->
                <div style='background-color:#eff6ff;padding:20px;border-radius:8px;margin:32px 0'>
                    <p style='font-size:14px;color:#1e40af;margin:0 0 12px;font-weight:500'>
                        📝 ¿Qué puedes calificar?
                    </p>
                    <ul style='font-size:14px;color:#1e40af;margin:0;padding-left:20px;line-height:1.8'>
                        <li>Puntualidad del servicio</li>
                        <li>Limpieza del vehículo</li>
                        <li>Amabilidad del conductor</li>
                        <li>Calidad de la conducción</li>
                        <li>Tu experiencia general</li>
                    </ul>
                </div>

                <p style='font-size:14px;color:#6b7280;margin:24px 0 0;line-height:1.6;text-align:center'>
                    Tu feedback es muy valioso para nosotros y nos ayuda a mejorar constantemente nuestro servicio.
                </p>

            </div>

            <!-- Footer -->
            <div style='background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb'>
                <p style='margin:0 0 8px;font-size:14px;color:#6b7280'>
                    <strong>Transportes Araucanía</strong>
                </p>
                <p style='margin:0 0 8px;font-size:13px;color:#9ca3af'>
                    Servicio de transporte confiable en la Región de la Araucanía
                </p>
                <p style='margin:0;font-size:12px;color:#9ca3af'>
                    📧 contacto@transportesaraucaria.cl | 📱 WhatsApp: +56 9 XXXX XXXX
                </p>
                <p style='margin:16px 0 0;font-size:11px;color:#d1d5db'>
                    Si no deseas recibir estos correos, por favor contáctanos.
                </p>
            </div>

        </div>
    </body>
    </html>
    ";

    // Versión texto plano como fallback
    $mail->AltBody = "
Hola {$nombre},

¡Gracias por viajar con Transportes Araucanía!

Esperamos que hayas disfrutado de tu viaje. Nos encantaría conocer tu opinión sobre el servicio.

Detalles de tu viaje:
- Código: {$codigoReserva}
- Ruta: {$origen} → {$destino}
- Fecha: {$fecha}

Para calificar tu experiencia, visita:
{$urlCalificacion}

Tu feedback es muy valioso para nosotros.

Saludos,
Equipo Transportes Araucanía
    ";

    // Enviar correo
    $mail->send();

    error_log("Correo de calificación enviado exitosamente a {$email}");

    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => 'Correo de calificación enviado exitosamente',
        'email' => $email,
        'reservaId' => $reservaId
    ]);

} catch (Exception $e) {
    error_log("Error al enviar correo de calificación: {$mail->ErrorInfo}");
    
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error al enviar el correo',
        'error' => $mail->ErrorInfo
    ]);
}
