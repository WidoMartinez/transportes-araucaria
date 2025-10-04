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

echo json_encode(['success' => true, 'id_reserva' => $reservas[$index]['id'] ?? null]);
?>

