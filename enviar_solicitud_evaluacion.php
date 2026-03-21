<?php
// ⚠️ DESPLIEGUE MANUAL EN HOSTINGER
// enviar_solicitud_evaluacion.php
// Envía correo al pasajero solicitando que evalúe su viaje.
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

// Campos requeridos
$required = ['cliente_email', 'token_evaluacion'];
foreach ($required as $f) {
    if (empty($data[$f])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Falta campo requerido: {$f}"]);
        exit;
    }
}

$clienteEmail    = $data['cliente_email'];
$clienteNombre   = htmlspecialchars($data['cliente_nombre'] ?? 'Estimado/a pasajero/a');
$origen          = htmlspecialchars($data['origen'] ?? 'No especificado');
$destino         = htmlspecialchars($data['destino'] ?? 'No especificado');
$fechaViaje      = htmlspecialchars($data['fecha_viaje'] ?? '');
$conductorNombre = htmlspecialchars($data['conductor_nombre'] ?? '');
$tokenEvaluacion = $data['token_evaluacion'];

// Formatear fecha para el correo
$fechaFormateada = '';
if (!empty($fechaViaje)) {
    $dt = DateTime::createFromFormat('Y-m-d', $fechaViaje) ?: new DateTime($fechaViaje);
    if ($dt) {
        $meses = [
            1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril',
            5 => 'mayo', 6 => 'junio', 7 => 'julio', 8 => 'agosto',
            9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre'
        ];
        $d = (int)$dt->format('j');
        $m = $meses[(int)$dt->format('n')];
        $y = $dt->format('Y');
        $fechaFormateada = "{$d} de {$m} de {$y}";
    }
}

// URL del enlace de evaluación
$urlEvaluacion = "https://www.transportesaraucaria.cl/#evaluar?token={$tokenEvaluacion}";

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
    $mail->addAddress($clienteEmail, $clienteNombre);
    
    // Enviar copia oculta (BCC) al administrador a modo de respaldo
    $mail->addBCC($emailConfig['username'], 'Respaldo Administrador');

    $mail->isHTML(true);
    $mail->Subject = "⭐ ¿Cómo fue tu viaje con Transportes Araucanía?";

    // Fila del conductor (opcional)
    $filaConductor = '';
    if (!empty($conductorNombre)) {
        $filaConductor = "
        <tr>
            <td style='padding:10px 0;border-bottom:1px solid #e8d5b7;color:#7c5a2a;width:40%;font-weight:bold;'>Conductor:</td>
            <td style='padding:10px 0;border-bottom:1px solid #e8d5b7;color:#3d2209;'>{$conductorNombre}</td>
        </tr>";
    }

    // Fila de fecha (opcional)
    $filaFecha = '';
    if (!empty($fechaFormateada)) {
        $filaFecha = "
        <tr>
            <td style='padding:10px 0;border-bottom:1px solid #e8d5b7;color:#7c5a2a;width:40%;font-weight:bold;'>Fecha del viaje:</td>
            <td style='padding:10px 0;border-bottom:1px solid #e8d5b7;color:#3d2209;'>{$fechaFormateada}</td>
        </tr>";
    }

    $mail->Body = "
    <!DOCTYPE html>
    <html lang='es'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Evalúa tu viaje</title>
    </head>
    <body style='margin:0;padding:0;background:#f5ede0;font-family:Arial,sans-serif;'>
        <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);'>

            <!-- Header -->
            <div style='background:linear-gradient(135deg,#7c3f00,#a0522d);padding:40px 30px;text-align:center;'>
                <div style='font-size:48px;margin-bottom:10px;'>⭐</div>
                <h1 style='color:#fff;margin:0;font-size:26px;font-weight:700;'>¿Cómo fue tu viaje?</h1>
                <p style='color:#f5deb3;margin:8px 0 0;font-size:15px;'>Tu opinión nos ayuda a mejorar cada día</p>
            </div>

            <!-- Saludo -->
            <div style='padding:30px;'>
                <p style='color:#3d2209;font-size:16px;margin:0 0 20px;'>
                    Hola <strong>{$clienteNombre}</strong>,
                </p>
                <p style='color:#5a3a1a;font-size:15px;line-height:1.6;margin:0 0 25px;'>
                    Esperamos que hayas disfrutado tu viaje con <strong>Transportes Araucanía</strong>. 
                    Nos gustaría conocer tu experiencia para seguir brindándote el mejor servicio.
                </p>

                <!-- Detalles del viaje -->
                <div style='background:#fdf6ed;border:1px solid #e8d5b7;border-radius:10px;padding:20px;margin-bottom:25px;'>
                    <h3 style='color:#7c3f00;margin:0 0 15px;font-size:16px;'>📋 Detalles de tu viaje</h3>
                    <table style='width:100%;border-collapse:collapse;'>
                        <tr>
                            <td style='padding:10px 0;border-bottom:1px solid #e8d5b7;color:#7c5a2a;width:40%;font-weight:bold;'>Origen:</td>
                            <td style='padding:10px 0;border-bottom:1px solid #e8d5b7;color:#3d2209;'>{$origen}</td>
                        </tr>
                        <tr>
                            <td style='padding:10px 0;border-bottom:1px solid #e8d5b7;color:#7c5a2a;width:40%;font-weight:bold;'>Destino:</td>
                            <td style='padding:10px 0;border-bottom:1px solid #e8d5b7;color:#3d2209;'>{$destino}</td>
                        </tr>
                        {$filaFecha}
                        {$filaConductor}
                    </table>
                </div>

                <!-- Botón principal -->
                <div style='text-align:center;margin:30px 0;'>
                    <a href='{$urlEvaluacion}' 
                       style='display:inline-block;background:linear-gradient(135deg,#7c3f00,#a0522d);color:#fff;
                              text-decoration:none;padding:16px 40px;border-radius:50px;font-size:17px;
                              font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(124,63,0,0.3);'>
                        ⭐ Calificar mi viaje
                    </a>
                </div>

                <!-- Propina -->
                <div style='background:#fffbf2;border:1px solid #f0d88a;border-radius:10px;padding:16px;margin-bottom:25px;text-align:center;'>
                    <p style='color:#7c5a2a;font-size:14px;margin:0;'>
                        💰 También puedes dejar una <strong>propina opcional</strong> para tu conductor mediante pago seguro con Flow.
                    </p>
                </div>

                <!-- Aviso de expiración -->
                <p style='color:#9c7a5a;font-size:13px;text-align:center;margin:0 0 20px;'>
                    ⏳ Este enlace expira en <strong>7 días</strong>.
                </p>

                <!-- Enlace alternativo -->
                <p style='color:#bda88a;font-size:12px;text-align:center;word-break:break-all;'>
                    Si el botón no funciona, copia este enlace en tu navegador:<br>
                    <a href='{$urlEvaluacion}' style='color:#a0522d;'>{$urlEvaluacion}</a>
                </p>
            </div>

            <!-- Footer -->
            <div style='background:#3d2209;padding:20px;text-align:center;'>
                <p style='color:#c8a882;font-size:13px;margin:0;'>
                    Transportes Araucanía — Servicio de traslados en la región de La Araucanía
                </p>
                <p style='color:#8b6a4a;font-size:12px;margin:8px 0 0;'>
                    © 2025 Transportes Araucanía. Todos los derechos reservados.
                </p>
            </div>
        </div>
    </body>
    </html>";

    $mail->AltBody = "Hola {$clienteNombre},\n\n¿Cómo fue tu viaje con Transportes Araucanía?\n\nViaje: {$origen} → {$destino}\n\nCalifica tu experiencia aquí (enlace válido por 7 días):\n{$urlEvaluacion}\n\nGracias por elegir Transportes Araucanía.";

    $mail->send();

    echo json_encode(['success' => true, 'message' => 'Correo de evaluación enviado exitosamente']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al enviar correo: ' . $mail->ErrorInfo]);
}
