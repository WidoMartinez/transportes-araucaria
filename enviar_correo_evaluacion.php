<?php
// enviar_correo_evaluacion.php
// Endpoint para enviar solicitud de evaluación al cliente

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
$requiredFields = ['email', 'nombre', 'codigoReserva', 'conductorNombre', 'enlaceEvaluacion', 'fechaExpiracion'];
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
$conductorNombre = $data['conductorNombre'];
$enlaceEvaluacion = $data['enlaceEvaluacion'];
$fechaExpiracion = $data['fechaExpiracion'];

// Crear instancia de PHPMailer
$mail = new PHPMailer(true);

try {
    // Configuración del servidor SMTP
    $mail->isSMTP();
    $mail->Host = $emailConfig['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = $emailConfig['smtp_username'];
    $mail->Password = $emailConfig['smtp_password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = $emailConfig['smtp_port'];
    $mail->CharSet = 'UTF-8';

    // Remitente y destinatario
    $mail->setFrom($emailConfig['from_email'], $emailConfig['from_name']);
    $mail->addAddress($email, $nombre);

    // Contenido del correo
    $mail->isHTML(true);
    $mail->Subject = '⭐ ¿Cómo fue tu experiencia? - Transportes Araucanía';

    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; text-align: center; }
            .button:hover { opacity: 0.9; }
            .stars { font-size: 32px; text-align: center; margin: 20px 0; }
            .info-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .highlight { color: #667eea; font-weight: bold; }
            .expiration { color: #dc3545; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⭐ Evalúa tu Experiencia</h1>
            </div>
            <div class="content">
                <p>Hola <strong>' . htmlspecialchars($nombre) . '</strong>,</p>
                
                <p>¡Gracias por viajar con nosotros! Tu opinión es muy importante para mejorar nuestro servicio.</p>
                
                <div class="stars">⭐⭐⭐⭐⭐</div>
                
                <div class="info-box">
                    <p style="margin: 5px 0;"><strong>📋 Reserva:</strong> ' . htmlspecialchars($codigoReserva) . '</p>
                    <p style="margin: 5px 0;"><strong>👤 Conductor:</strong> ' . htmlspecialchars($conductorNombre) . '</p>
                </div>
                
                <p>Nos gustaría conocer tu experiencia sobre:</p>
                <ul>
                    <li>⏰ Puntualidad</li>
                    <li>✨ Limpieza del vehículo</li>
                    <li>🛡️ Conducción segura</li>
                    <li>💬 Comunicación y trato</li>
                </ul>
                
                <p style="text-align: center;">
                    <a href="' . htmlspecialchars($enlaceEvaluacion) . '" class="button">
                        Evaluar Servicio
                    </a>
                </p>
                
                <p style="font-size: 14px; text-align: center;">
                    <span class="expiration">⏱️ Este enlace es válido hasta el ' . htmlspecialchars($fechaExpiracion) . '</span>
                </p>
                
                <p style="font-size: 13px; color: #666; margin-top: 20px;">
                    <em>Nota: Tu evaluación es anónima y nos ayuda a mantener la calidad de nuestro servicio.</em>
                </p>
            </div>
            <div class="footer">
                <p>Transportes Araucanía | www.transportesaraucania.cl</p>
                <p>Si tienes alguna consulta, contáctanos a contacto@transportesaraucania.cl</p>
            </div>
        </div>
    </body>
    </html>
    ';

    $mail->Body = $htmlBody;
    $mail->AltBody = "Hola {$nombre},\n\nGracias por viajar con nosotros. Por favor evalúa tu experiencia en: {$enlaceEvaluacion}\n\nReserva: {$codigoReserva}\nConductor: {$conductorNombre}\n\nEste enlace es válido hasta el {$fechaExpiracion}.\n\nTransportes Araucanía";

    // Enviar correo
    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'Correo de evaluación enviado exitosamente'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al enviar correo: ' . $mail->ErrorInfo
    ]);
}
