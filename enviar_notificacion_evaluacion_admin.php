<?php
// enviar_notificacion_evaluacion_admin.php
// Notifica al admin sobre nueva evaluación (CON información de propinas)

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
$requiredFields = ['adminEmail', 'codigoReserva', 'conductorNombre', 'clienteNombre', 'clienteEmail', 'calificaciones'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
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
$adminEmail = $data['adminEmail'];
$codigoReserva = $data['codigoReserva'];
$conductorNombre = $data['conductorNombre'];
$clienteNombre = $data['clienteNombre'];
$clienteEmail = $data['clienteEmail'];
$calificaciones = $data['calificaciones'];
$comentario = isset($data['comentario']) ? $data['comentario'] : '';
$propinaMonto = isset($data['propinaMonto']) ? floatval($data['propinaMonto']) : 0;

// Función para generar estrellas visuales
function generarEstrellas($calificacion) {
    $estrellas = '';
    $calificacionInt = (int)$calificacion;
    for ($i = 1; $i <= 5; $i++) {
        $estrellas .= $i <= $calificacionInt ? '⭐' : '☆';
    }
    return $estrellas . ' (' . number_format($calificacion, 1) . '/5)';
}

// Determinar el color según el promedio
function getColorPromedio($promedio) {
    if ($promedio >= 4.5) return '#28a745'; // Verde
    if ($promedio >= 3.5) return '#ffc107'; // Amarillo
    return '#dc3545'; // Rojo
}

$promedio = $calificaciones['promedio'];
$colorPromedio = getColorPromedio($promedio);

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
    $mail->addAddress($adminEmail, 'Administración');

    // Contenido del correo
    $mail->isHTML(true);
    $mail->Subject = '⭐ Nueva Evaluación Registrada - Admin - Transportes Araucanía';

    $comentarioHtml = '';
    if (!empty($comentario)) {
        $comentarioHtml = '
        <div class="comentario-box">
            <h3 style="margin: 0 0 10px 0; color: #667eea;">💬 Comentario del Cliente:</h3>
            <p style="font-style: italic; margin: 0;">"' . htmlspecialchars($comentario) . '"</p>
        </div>
        ';
    }

    $propinaHtml = '';
    if ($propinaMonto > 0) {
        $propinaFormatted = '$' . number_format($propinaMonto, 0, ',', '.');
        $propinaHtml = '
        <div class="propina-box">
            <h3 style="margin: 0 0 10px 0; color: #28a745;">💰 Propina</h3>
            <p style="font-size: 24px; font-weight: bold; color: #28a745; margin: 0;">' . $propinaFormatted . ' CLP</p>
            <p style="font-size: 13px; color: #666; margin: 5px 0 0 0;"><em>(Pendiente de pago por el cliente)</em></p>
        </div>
        ';
    }

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
            .admin-badge { display: inline-block; background: #dc3545; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .promedio-box { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; margin: 20px 0; }
            .promedio-numero { font-size: 48px; font-weight: bold; color: ' . $colorPromedio . '; margin: 10px 0; }
            .calificacion-item { background: #ffffff; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .calificacion-item h4 { margin: 0 0 5px 0; color: #333; }
            .estrellas { font-size: 18px; }
            .comentario-box { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .propina-box { background: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; text-align: center; }
            .info-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .cliente-info { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⭐ Nueva Evaluación Registrada</h1>
                <span class="admin-badge">🔒 ADMIN</span>
            </div>
            <div class="content">
                <p><strong>Panel Administrativo - Reporte Completo</strong></p>
                
                <div class="info-box">
                    <p style="margin: 5px 0;"><strong>📋 Reserva:</strong> ' . htmlspecialchars($codigoReserva) . '</p>
                    <p style="margin: 5px 0;"><strong>👤 Conductor:</strong> ' . htmlspecialchars($conductorNombre) . '</p>
                </div>
                
                <div class="cliente-info">
                    <h3 style="margin: 0 0 10px 0; color: #856404;">Información del Cliente</h3>
                    <p style="margin: 5px 0;"><strong>Nombre:</strong> ' . htmlspecialchars($clienteNombre) . '</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ' . htmlspecialchars($clienteEmail) . '</p>
                </div>
                
                <div class="promedio-box">
                    <h3 style="margin: 0 0 10px 0; color: #666;">Calificación Promedio</h3>
                    <div class="promedio-numero">' . number_format($promedio, 2) . '</div>
                    <div style="font-size: 24px;">' . generarEstrellas($promedio) . '</div>
                </div>
                
                <h3 style="color: #667eea; margin: 30px 0 15px 0;">📊 Calificaciones Detalladas</h3>
                
                <div class="calificacion-item">
                    <h4>⏰ Puntualidad</h4>
                    <div class="estrellas">' . generarEstrellas($calificaciones['puntualidad']) . '</div>
                </div>
                
                <div class="calificacion-item">
                    <h4>✨ Limpieza del Vehículo</h4>
                    <div class="estrellas">' . generarEstrellas($calificaciones['limpieza']) . '</div>
                </div>
                
                <div class="calificacion-item">
                    <h4>🛡️ Conducción Segura</h4>
                    <div class="estrellas">' . generarEstrellas($calificaciones['seguridad']) . '</div>
                </div>
                
                <div class="calificacion-item">
                    <h4>💬 Comunicación y Trato</h4>
                    <div class="estrellas">' . generarEstrellas($calificaciones['comunicacion']) . '</div>
                </div>
                
                ' . $comentarioHtml . '
                
                ' . $propinaHtml . '
                
                <p style="margin-top: 30px; font-size: 13px; color: #666; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                    <strong>Nota de privacidad:</strong> La información de propinas es confidencial y solo visible para administradores. No se comparte con los conductores.
                </p>
            </div>
            <div class="footer">
                <p>Transportes Araucanía - Panel Administrativo</p>
                <p>www.transportesaraucania.cl</p>
            </div>
        </div>
    </body>
    </html>
    ';

    $mail->Body = $htmlBody;
    
    $textBody = "[ADMIN] Nueva Evaluación Registrada\n\n";
    $textBody .= "Reserva: {$codigoReserva}\n";
    $textBody .= "Conductor: {$conductorNombre}\n\n";
    $textBody .= "CLIENTE:\n";
    $textBody .= "Nombre: {$clienteNombre}\n";
    $textBody .= "Email: {$clienteEmail}\n\n";
    $textBody .= "Calificación Promedio: " . number_format($promedio, 2) . "/5\n\n";
    $textBody .= "Puntualidad: {$calificaciones['puntualidad']}/5\n";
    $textBody .= "Limpieza: {$calificaciones['limpieza']}/5\n";
    $textBody .= "Seguridad: {$calificaciones['seguridad']}/5\n";
    $textBody .= "Comunicación: {$calificaciones['comunicacion']}/5\n";
    if (!empty($comentario)) {
        $textBody .= "\nComentario: \"{$comentario}\"\n";
    }
    if ($propinaMonto > 0) {
        $textBody .= "\nPROPINA: $" . number_format($propinaMonto, 0, ',', '.') . " CLP (Pendiente de pago)\n";
    }
    $textBody .= "\nTransportes Araucanía - Panel Administrativo";
    
    $mail->AltBody = $textBody;

    // Enviar correo
    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'Notificación enviada al admin exitosamente'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al enviar correo: ' . $mail->ErrorInfo
    ]);
}
