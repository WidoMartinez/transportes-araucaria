<?php
// enviar_correo_mejorado.php
// Versión mejorada que envía correo Y guarda los datos de reserva
// Habilitar la visualización de errores para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- ¡CARGA MANUAL DE PHPMailer CON LA RUTA CORRECTA! ---
// Se asume que la carpeta 'PHPMailer' está en el mismo directorio que este archivo.
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

// --- Configuración de CORS ---
$allowed_origins = [
    'https://www.transportesaraucaria.cl',
    'http://localhost:5173'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

header('Content-Type: application/json');

// --- Carga las variables de entorno o defínelas aquí ---
$emailHost = getenv('EMAIL_HOST') ?: 'smtp.titan.email';
$emailPort = getenv('EMAIL_PORT') ?: 465;
$emailUser = getenv('EMAIL_USER') ?: 'contacto@anunciads.cl';
$emailPass = getenv('EMAIL_PASS') ?: 'TeamoGadiel7.';
$emailTo = getenv('EMAIL_TO') ?: 'widomartinez@gmail.com';

// Configuración del archivo de reservas
$reservasFile = 'reservas_data.json';

/**
 * Función para guardar reserva en archivo JSON
 */
function guardarReservaEnArchivo($archivo, $reserva) {
    // Leer reservas existentes
    $reservas = [];
    if (file_exists($archivo)) {
        $contenido = file_get_contents($archivo);
        $reservasExistentes = json_decode($contenido, true);
        if (is_array($reservasExistentes)) {
            $reservas = $reservasExistentes;
        }
    }
    
    // Agregar metadatos a la reserva
    $reserva['id'] = uniqid('RES_', true);
    $reserva['timestamp'] = date('Y-m-d H:i:s');
    $reserva['fecha_registro'] = date('Y-m-d H:i:s');
    $reserva['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? 'Desconocida';
    $reserva['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? 'Desconocido';
    
    // Agregar la nueva reserva al inicio del array
    array_unshift($reservas, $reserva);
    
    // Mantener solo las últimas 1000 reservas para evitar archivos muy grandes
    if (count($reservas) > 1000) {
        $reservas = array_slice($reservas, 0, 1000);
    }
    
    // Guardar en archivo
    $resultado = file_put_contents($archivo, json_encode($reservas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    return $resultado !== false;
}

// Obtiene el cuerpo de la solicitud JSON
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'Error: No se recibieron datos válidos.']);
    exit;
}

// Extrae y sanitiza los datos
$nombre = htmlspecialchars($data['nombre'] ?? 'No especificado');
$emailInput = trim($data['email'] ?? '');
$email = filter_var($emailInput, FILTER_VALIDATE_EMAIL) ?: '';
$emailDisplay = htmlspecialchars($email ?: $emailInput ?: 'No especificado', ENT_QUOTES, 'UTF-8');
$emailHref = $email ?: '#';
$hasValidCustomerEmail = $email !== '';

$telefono = htmlspecialchars($data['telefono'] ?? 'No especificado');
$source = htmlspecialchars($data['source'] ?? 'Sitio Web');
$mensaje = htmlspecialchars($data['mensaje'] ?? '');
$origen = htmlspecialchars($data['origen'] ?? 'No especificado');
$destino = htmlspecialchars($data['destino'] ?? 'No especificado');
$fecha = htmlspecialchars($data['fecha'] ?? 'No especificada');
$hora = htmlspecialchars($data['hora'] ?? 'No especificada');
$pasajeros = htmlspecialchars($data['pasajeros'] ?? 'No especificado');
$precio = $data['precio'] ?? 0;
$vehiculo = htmlspecialchars($data['vehiculo'] ?? 'No asignado');

// Datos adicionales para las reservas
$numeroVuelo = htmlspecialchars($data['numeroVuelo'] ?? '');
$hotel = htmlspecialchars($data['hotel'] ?? '');
$equipajeEspecial = htmlspecialchars($data['equipajeEspecial'] ?? '');
$sillaInfantil = htmlspecialchars($data['sillaInfantil'] ?? 'no');
$idaVuelta = $data['idaVuelta'] ?? false;
$fechaRegreso = htmlspecialchars($data['fechaRegreso'] ?? '');
$horaRegreso = htmlspecialchars($data['horaRegreso'] ?? '');
$abonoSugerido = $data['abonoSugerido'] ?? 0;
$saldoPendiente = $data['saldoPendiente'] ?? 0;
$descuentoBase = $data['descuentoBase'] ?? 0;
$descuentoPromocion = $data['descuentoPromocion'] ?? 0;
$descuentoRoundTrip = $data['descuentoRoundTrip'] ?? 0;
$descuentoOnline = $data['descuentoOnline'] ?? 0;
$totalConDescuento = $data['totalConDescuento'] ?? $precio;

$formattedPrice = $precio ? '$' . number_format($precio, 0, ',', '.') . ' CLP' : 'A consultar';

// Preparar datos completos para guardar
$reservaCompleta = [
    'nombre' => $nombre,
    'email' => $email,
    'telefono' => $telefono,
    'source' => $source,
    'mensaje' => $mensaje,
    'origen' => $origen,
    'destino' => $destino,
    'fecha' => $fecha,
    'hora' => $hora,
    'pasajeros' => $pasajeros,
    'precio' => $precio,
    'vehiculo' => $vehiculo,
    'numeroVuelo' => $numeroVuelo,
    'hotel' => $hotel,
    'equipajeEspecial' => $equipajeEspecial,
    'sillaInfantil' => $sillaInfantil,
    'idaVuelta' => $idaVuelta,
    'fechaRegreso' => $fechaRegreso,
    'horaRegreso' => $horaRegreso,
    'abonoSugerido' => $abonoSugerido,
    'saldoPendiente' => $saldoPendiente,
    'descuentoBase' => $descuentoBase,
    'descuentoPromocion' => $descuentoPromocion,
    'descuentoRoundTrip' => $descuentoRoundTrip,
    'descuentoOnline' => $descuentoOnline,
    'totalConDescuento' => $totalConDescuento
];

// Intentar guardar la reserva ANTES de enviar el correo
$reservaGuardada = false;
try {
    $reservaGuardada = guardarReservaEnArchivo($reservasFile, $reservaCompleta);
} catch (Exception $e) {
    error_log("Error al guardar reserva: " . $e->getMessage());
}

// El HTML del correo mejorado con más información
$emailHtml = "
    <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;'>
        <div style='background-color: #003366; color: white; padding: 20px; text-align: center;'>
            <h1 style='margin: 0;'>Nueva Solicitud de Cotización</h1>
            <p style='margin: 5px 0 0;'>Recibida desde: {$source}</p>
            " . ($reservaGuardada ? "<p style='margin: 5px 0 0; font-size: 12px;'>✅ Reserva guardada en sistema</p>" : "<p style='margin: 5px 0 0; font-size: 12px; color: #ffeb3b;'>⚠️ Reserva NO guardada en sistema</p>") . "
        </div>
        <div style='padding: 20px;'>
            <div style='background-color: #e3f2fd; border: 2px solid #3b82f6; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;'>
                <h2 style='margin: 0 0 10px;'>Resumen del Viaje</h2>
                <p style='margin: 5px 0; font-size: 18px;'><strong>Valor:</strong> <span style='font-size: 22px; font-weight: bold;'>{$formattedPrice}</span></p>
                <p style='margin: 5px 0; font-size: 16px;'><strong>Vehículo:</strong> {$vehiculo}</p>
                " . ($idaVuelta ? "<p style='margin: 5px 0; font-size: 14px; color: #0066cc;'><strong>🔄 Viaje de ida y vuelta</strong></p>" : "") . "
            </div>
            
            <h2>Detalles del Viaje</h2>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                <tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Origen:</td><td style='padding: 8px;'>{$origen}</td></tr>
                <tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Destino:</td><td style='padding: 8px;'>{$destino}</td></tr>
                <tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Fecha:</td><td style='padding: 8px;'>{$fecha}</td></tr>
                <tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Hora:</td><td style='padding: 8px;'>{$hora}</td></tr>
                <tr" . ($idaVuelta ? " style='border-bottom: 1px solid #eee;'" : "") . "><td style='padding: 8px; font-weight: bold;'>Pasajeros:</td><td style='padding: 8px;'>{$pasajeros}</td></tr>";

if ($idaVuelta && $fechaRegreso && $horaRegreso) {
    $emailHtml .= "
                <tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Fecha Regreso:</td><td style='padding: 8px;'>{$fechaRegreso}</td></tr>
                <tr><td style='padding: 8px; font-weight: bold;'>Hora Regreso:</td><td style='padding: 8px;'>{$horaRegreso}</td></tr>";
}

$emailHtml .= "
            </table>
            
            <h2>Información del Cliente</h2>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                <tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Nombre:</td><td style='padding: 8px;'>{$nombre}</td></tr>
                <tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Teléfono:</td><td style='padding: 8px;'><a href='tel:{$telefono}'>{$telefono}</a></td></tr>
                <tr><td style='padding: 8px; font-weight: bold;'>Email:</td><td style='padding: 8px;'><a href='mailto:{$emailHref}'>{$emailDisplay}</a></td></tr>
            </table>";

// Agregar detalles adicionales si existen
if ($numeroVuelo || $hotel || $equipajeEspecial || $sillaInfantil === 'si') {
    $emailHtml .= "
            <h2>Detalles Adicionales</h2>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>";
    
    if ($numeroVuelo) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Número de Vuelo:</td><td style='padding: 8px;'>{$numeroVuelo}</td></tr>";
    }
    if ($hotel) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Hotel:</td><td style='padding: 8px;'>{$hotel}</td></tr>";
    }
    if ($equipajeEspecial) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Equipaje Especial:</td><td style='padding: 8px;'>{$equipajeEspecial}</td></tr>";
    }
    if ($sillaInfantil === 'si') {
        $emailHtml .= "<tr><td style='padding: 8px; font-weight: bold;'>Silla Infantil:</td><td style='padding: 8px;'>✅ Requerida</td></tr>";
    }
    
    $emailHtml .= "</table>";
}

// Información financiera si hay descuentos o abonos
if ($abonoSugerido > 0 || $totalConDescuento != $precio) {
    $emailHtml .= "
            <h2>Información Financiera</h2>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>";
    
    if ($totalConDescuento != $precio) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Precio Original:</td><td style='padding: 8px;'>$" . number_format($precio, 0, ',', '.') . " CLP</td></tr>";
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Precio con Descuentos:</td><td style='padding: 8px;'>$" . number_format($totalConDescuento, 0, ',', '.') . " CLP</td></tr>";
    }
    
    if ($abonoSugerido > 0) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold;'>Abono Sugerido:</td><td style='padding: 8px;'>$" . number_format($abonoSugerido, 0, ',', '.') . " CLP</td></tr>";
        $emailHtml .= "<tr><td style='padding: 8px; font-weight: bold;'>Saldo Pendiente:</td><td style='padding: 8px;'>$" . number_format($saldoPendiente, 0, ',', '.') . " CLP</td></tr>";
    }
    
    $emailHtml .= "</table>";
}

if ($mensaje) {
    $emailHtml .= "
            <h2>Mensaje Adicional</h2>
            <div style='background-color: #f8f9fa; border-left: 4px solid #ccc; padding: 15px; margin-bottom: 20px;'>
                <p style='margin: 0; font-style: italic;'>\"" . nl2br($mensaje) . "\"</p>
            </div>";
}

$emailHtml .= "
            <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-size: 12px; color: #666;'>
                <p style='margin: 0;'><strong>Información técnica:</strong></p>
                <p style='margin: 5px 0 0;'>Fecha de registro: " . date('Y-m-d H:i:s') . "</p>
                <p style='margin: 5px 0 0;'>Estado de guardado: " . ($reservaGuardada ? "✅ Exitoso" : "❌ Error") . "</p>
            </div>
        </div>
    </div>";

$mail = new PHPMailer(true);

$adminEmailEnviado = false;
$confirmacionEnviada = false;

try {
    // Configuración del servidor
    $mail->isSMTP();
    $mail->Host       = $emailHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $emailUser;
    $mail->Password   = $emailPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $emailPort;
    $mail->CharSet    = 'UTF-8';

    // Destinatarios
    $mail->setFrom($emailUser, 'Notificación Sitio Web');
    $mail->addAddress($emailTo);
    if ($hasValidCustomerEmail) {
        $mail->addReplyTo($email, $nombre);
    }

    // Contenido
    $mail->isHTML(true);
    $mail->Subject = "Nueva Cotización de Transfer: {$destino} - " . ($reservaGuardada ? "GUARDADA" : "NO GUARDADA");
    $mail->Body    = $emailHtml;

    $mail->send();
    $adminEmailEnviado = true;
    // Confirmación al cliente deshabilitada: solo se notifica al administrador.

    // Respuesta exitosa
    echo json_encode([
        'message' => 'Mensaje enviado exitosamente.',
        'reserva_guardada' => $reservaGuardada,
        'id_reserva' => $reservaCompleta['id'] ?? null,
        'correo_enviado' => $adminEmailEnviado,
        'confirmacion_enviada' => $confirmacionEnviada
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'message' => "Error al enviar el correo: {$mail->ErrorInfo}",
        'reserva_guardada' => $reservaGuardada,
        'id_reserva' => $reservaCompleta['id'] ?? null,
        'correo_enviado' => $adminEmailEnviado,
        'confirmacion_enviada' => $confirmacionEnviada
    ]);
}
?>
