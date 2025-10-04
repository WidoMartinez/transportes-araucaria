<?php
// actualizar_reserva_pago.php
// Endpoint para actualizar estado de pago de una reserva en reservas_data.json

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

$reservasFile = 'reservas_data.json';

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

// Campos esperados
$id = $data['id_reserva'] ?? null;
$email = isset($data['email']) ? strtolower(trim($data['email'])) : null;
$gateway = $data['gateway'] ?? 'mercadopago';
$paymentId = $data['payment_id'] ?? null;
$status = $data['status'] ?? null; // approved, pending, rejected, etc
$statusDetail = $data['status_detail'] ?? null;
$amount = $data['amount'] ?? null;
$description = $data['description'] ?? null;

if (!file_exists($reservasFile)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'No existe el archivo de reservas']);
    exit;
}

$contenido = file_get_contents($reservasFile);
$reservas = json_decode($contenido, true);
if (!is_array($reservas)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Estructura de reservas inválida']);
    exit;
}

// Buscar reserva: por id o por email (última por fecha_registro)
$index = -1;
if ($id) {
    foreach ($reservas as $i => $r) {
        if (isset($r['id']) && $r['id'] === $id) { $index = $i; break; }
    }
} elseif ($email) {
    foreach ($reservas as $i => $r) {
        $re = isset($r['email']) ? strtolower(trim($r['email'])) : '';
        if ($re && $re === $email) { $index = $i; break; }
    }
}

if ($index === -1) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Reserva no encontrada']);
    exit;
}

// Actualizar campos de pago
$now = date('Y-m-d H:i:s');
$reservas[$index]['pago_gateway'] = $gateway;
if ($paymentId) $reservas[$index]['pago_id'] = $paymentId;
if ($amount !== null) $reservas[$index]['pago_monto'] = $amount;
if ($description) $reservas[$index]['pago_descripcion'] = $description;
if ($status) $reservas[$index]['estado_pago'] = $status;
if ($statusDetail) $reservas[$index]['pago_detalle'] = $statusDetail;

// Historial
if (!isset($reservas[$index]['pago_historial']) || !is_array($reservas[$index]['pago_historial'])) {
    $reservas[$index]['pago_historial'] = [];
}
$reservas[$index]['pago_historial'][] = [
    'fecha' => $now,
    'status' => $status,
    'status_detail' => $statusDetail,
    'gateway' => $gateway,
    'payment_id' => $paymentId,
    'amount' => $amount,
];

if ($status === 'approved') {
    $reservas[$index]['pago_confirmado'] = true;
    $reservas[$index]['pago_confirmado_en'] = $now;
}

$ok = file_put_contents($reservasFile, json_encode($reservas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
if ($ok === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudo guardar la actualización']);
    exit;
}

// Enviar correo de confirmación de pago si fue aprobado
if ($status === 'approved') {
    // Cargar configuración de email si existe
    @include_once __DIR__ . '/config_reservas.php';

    $email_to_admin = null;
    $smtp_host = null; $smtp_user = null; $smtp_pass = null; $smtp_port = 465;
    $from_name = 'Sistema de Reservas';

    if (function_exists('getEmailConfig')) {
        $cfg = getEmailConfig();
        $smtp_host = $cfg['host'] ?? null;
        $smtp_user = $cfg['username'] ?? null;
        $smtp_pass = $cfg['password'] ?? null;
        $smtp_port = $cfg['port'] ?? 465;
        $email_to_admin = $cfg['to'] ?? null;
        $from_name = $cfg['from_name'] ?? $from_name;
    }

    $cliente_email = $reservas[$index]['email'] ?? $email; // fallback
    if ($cliente_email) {
        // Cargar PHPMailer manualmente si está disponible
        $hasPhpMailer = file_exists(__DIR__ . '/PHPMailer/src/PHPMailer.php');
        if ($hasPhpMailer) {
            require_once __DIR__ . '/PHPMailer/src/Exception.php';
            require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
            require_once __DIR__ . '/PHPMailer/src/SMTP.php';
            try {
                $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                $mail->isSMTP();
                $mail->Host       = $smtp_host ?: 'smtp.hostinger.com';
                $mail->SMTPAuth   = true;
                $mail->Username   = $smtp_user ?: 'contacto@transportesaraucaria.cl';
                $mail->Password   = $smtp_pass ?: '';
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
                $mail->Port       = $smtp_port ?: 465;
                $mail->CharSet    = 'UTF-8';

                $mail->setFrom($smtp_user ?: 'no-reply@transportesaraucaria.cl', $from_name);
                $mail->addAddress($cliente_email, $reservas[$index]['nombre'] ?? 'Cliente');
                if ($email_to_admin) { $mail->addBcc($email_to_admin); }

                $mail->isHTML(true);
                $mail->Subject = 'Pago confirmado - Transportes Araucaria';

                $monto = isset($reservas[$index]['pago_monto']) ? '$' . number_format($reservas[$index]['pago_monto'], 0, ',', '.') . ' CLP' : '';
                $destino = $reservas[$index]['destino'] ?? '';
                $fecha = $reservas[$index]['fecha'] ?? '';
                $vehiculo = $reservas[$index]['vehiculo'] ?? '';
                $idReserva = $reservas[$index]['id'] ?? '';

                $mail->Body = "<div style='font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:620px;margin:16px auto;border:1px solid #eee;border-radius:8px'>
                    <div style='background:#0f172a;color:#fff;padding:16px;border-radius:8px 8px 0 0'>
                        <h2 style='margin:0'>Pago confirmado</h2>
                        <p style='margin:4px 0 0;font-size:13px'>Gracias por tu pago. Hemos confirmado tu reserva.</p>
                    </div>
                    <div style='padding:16px'>
                        <p><strong>ID Reserva:</strong> {$idReserva}</p>
                        <p><strong>Destino:</strong> {$destino}</p>
                        <p><strong>Fecha:</strong> {$fecha}</p>
                        <p><strong>Vehículo:</strong> {$vehiculo}</p>
                        <p><strong>Monto pagado:</strong> {$monto}</p>
                        <p style='font-size:13px;color:#334155'>Nos pondremos en contacto para coordinar los detalles finales. Si necesitas asistencia, responde este correo.</p>
                        <p>Saludos,<br><strong>Transportes Araucaria</strong></p>
                    </div>
                </div>";
                $mail->send();
            } catch (\Exception $e) {
                // Silencioso: no romper respuesta
                error_log('No se pudo enviar confirmación de pago: ' . $e->getMessage());
            }
        }
    }
}

echo json_encode(['success' => true, 'id_reserva' => $reservas[$index]['id'] ?? null]);
?>

