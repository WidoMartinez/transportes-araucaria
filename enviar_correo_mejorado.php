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
    'https://transportesaraucaria.cl',
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
$emailHost = getenv('EMAIL_HOST') ?: 'smtp.hostinger.com';
$emailPort = getenv('EMAIL_PORT') ?: 465;
$emailUser = getenv('EMAIL_USER') ?: 'contacto@transportesaraucaria.cl';
$emailPass = getenv('EMAIL_PASS') ?: 'TransportesAraucaria7.';
$emailTo = getenv('EMAIL_TO') ?: 'widomartinez@gmail.com';

// Configuración adicional
$sendCustomerConfirmation = true; // Enviar correo de confirmación al cliente si tiene email válido
$brandName = 'Transportes Araucaria';

// Utilidad: actualizar flags de correo en la reserva guardada
function actualizarFlagsCorreoReserva($archivo, $reservaId, $flags) {
    if (!$reservaId || !file_exists($archivo)) return false;
    $contenido = file_get_contents($archivo);
    $reservas = json_decode($contenido, true);
    if (!is_array($reservas)) return false;

    $actualizado = false;
    foreach ($reservas as &$r) {
        if (isset($r['id']) && $r['id'] === $reservaId) {
            foreach ($flags as $k => $v) {
                $r[$k] = $v;
            }
            $actualizado = true;
            break;
        }
    }
    if ($actualizado) {
        return file_put_contents($archivo, json_encode($reservas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
    }
    return false;
}

// Configuración del archivo de reservas
$reservasFile = 'reservas_data.json';

/**
 * Función para guardar reserva en archivo JSON
 */
function guardarReservaEnArchivo($archivo, $reserva)
{
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
    if (empty($reserva['id'])) {
        $reserva['id'] = uniqid('RES_', true);
    }
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
$emailInput = $data['email'] ?? '';
// Sanitización robusta: eliminar caracteres no ASCII y espacios
$emailInput = preg_replace('/[^\x20-\x7E]/', '', $emailInput);
$emailInput = str_replace(' ', '', trim($emailInput));
$emailInput = strtolower($emailInput);
$email = filter_var($emailInput, FILTER_VALIDATE_EMAIL) ?: '';
$emailDisplay = htmlspecialchars($email ?: $emailInput ?: 'No especificado', ENT_QUOTES, 'UTF-8');
$emailHref = $email ?: '#';
$hasValidCustomerEmail = $email !== '';

$telefono = htmlspecialchars($data['telefono'] ?? 'No especificado');
$codigoReserva = htmlspecialchars($data['codigoReserva'] ?? '');
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

// Datos adicionales opcionales del formulario
$descuentosPersonalizados = $data['descuentosPersonalizados'] ?? [];
if (!is_array($descuentosPersonalizados)) {
    $descuentosPersonalizados = [$descuentosPersonalizados];
}
$otroOrigen = htmlspecialchars($data['otroOrigen'] ?? '');
$otroDestino = htmlspecialchars($data['otroDestino'] ?? '');

// Estado de pago del cliente - usado para determinar qué tipo de correo enviar
$estadoPago = htmlspecialchars($data['estadoPago'] ?? 'pendiente');
$clienteHaPagado = in_array($estadoPago, ['aprobado', 'pagado', 'parcial']);

// NUEVO: Obtener la acción solicitada (por defecto 'normal' para compatibilidad)
$action = $data['action'] ?? 'normal'; // 'normal', 'notify_admin_only', 'send_discount_offer'

// Configuración del descuento para clientes sin pago (porcentaje)
$DESCUENTO_OFERTA_ESPECIAL = 10;

$formattedPrice = $precio ? '$' . number_format($precio, 0, ',', '.') . ' CLP' : 'A consultar';

// Preparar datos completos para guardar
$reservaCompleta = [
    'codigoReserva' => $codigoReserva,
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
    'totalConDescuento' => $totalConDescuento,
    'descuentosPersonalizados' => $descuentosPersonalizados,
    'otroOrigen' => $otroOrigen,
    'otroDestino' => $otroDestino,
    // Flags iniciales de correo/pago
    'correo_admin_enviado' => false,
    'correo_cliente_enviado' => false,
    'estado_pago' => 'sin_pago',
    'action_processed' => $action // Registrar qué acción se procesó
];

// --- LÓGICA DE ENVÍO SEGÚN ACCIÓN ---

// 1. Si es 'send_discount_offer', saltamos directamente al envío de descuento
if ($action === 'send_discount_offer') {
    goto enviar_descuento;
}

// 2. Si es 'notify_admin_only' o 'normal', enviamos al admin primero


// Intentar guardar la reserva ANTES de enviar el correo
$reservaGuardada = false;
try {
    // Generar ID para poder referenciar luego
    if (empty($reservaCompleta['id'])) {
        $reservaCompleta['id'] = uniqid('RES_', true);
    }
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
        <div style='padding: 20px;'>"
        . ($codigoReserva ? "
            <div style='background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;'>
                <h2 style='margin: 0 0 10px; font-size: 18px;'>📋 CÓDIGO DE RESERVA</h2>
                <div style='background-color: white; color: #3b82f6; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 2px;'>
                    {$codigoReserva}
                </div>
                <p style='margin: 10px 0 0; font-size: 12px;'>Guarda este código para consultar tu reserva</p>
            </div>" : "") . "
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

    // Intentar actualizar flags en la reserva
    if (!empty($reservaCompleta['id'])) {
        @actualizarFlagsCorreoReserva($reservasFile, $reservaCompleta['id'], [
            'correo_admin_enviado' => true,
            'correo_cliente_enviado' => false
        ]);
    }

    // Enviar confirmación al cliente según estado de pago
    // - Si ha pagado: enviar confirmación normal
    // - Si NO ha pagado: enviar correo único de descuento para captar atención
    if ($sendCustomerConfirmation && $hasValidCustomerEmail) {
        try {
            $mail->clearAllRecipients();
            $mail->clearReplyTos();

            $mail->setFrom($emailUser, $brandName);
            $mail->addAddress($email, $nombre ?: 'Cliente');
            // Copia al admin para respaldo de confirmaciones
            $mail->addBcc($emailTo);
            $mail->addReplyTo($emailUser, $brandName);

            $mail->isHTML(true);

            $precioHtml = $precio ? ('$' . number_format($precio, 0, ',', '.') . ' CLP') : 'A consultar';
            $totalHtml = $totalConDescuento ? ('$' . number_format($totalConDescuento, 0, ',', '.') . ' CLP') : $precioHtml;
            $abonoHtml = $abonoSugerido ? ('$' . number_format($abonoSugerido, 0, ',', '.') . ' CLP') : null;

            if ($clienteHaPagado) {
                // Cliente HA PAGADO - Enviar correo de confirmación normal
                $mail->Subject = "Confirmación de solicitud recibida - {$brandName}";

                $clienteHtml = "<div style='font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:20px auto; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;'>
                    <div style='background:#0f172a; color:#fff; padding:18px 22px;'>
                        <h2 style='margin:0; font-size:18px;'>{$brandName}</h2>
                        <p style='margin:4px 0 0; font-size:13px;'>Hemos recibido tu solicitud de traslado</p>
                    </div>
                    <div style='padding:20px;'>
                        <p>Hola <strong>" . htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') . "</strong>,</p>
                        <p>Gracias por contactarnos. Hemos recibido tu solicitud y te confirmaremos la disponibilidad a la brevedad. Aquí tienes el resumen:</p>

                        <div style='background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin:12px 0;'>
                            <p style='margin:6px 0'><strong>Origen:</strong> {$origen}</p>
                            <p style='margin:6px 0'><strong>Destino:</strong> {$destino}</p>
                            <p style='margin:6px 0'><strong>Fecha y hora:</strong> {$fecha} {$hora}</p>
                            <p style='margin:6px 0'><strong>Pasajeros:</strong> {$pasajeros}</p>
                            <p style='margin:6px 0'><strong>Vehículo:</strong> {$vehiculo}</p>
                            <p style='margin:6px 0'><strong>Valor estimado:</strong> {$totalHtml}</p>
                            " . ($abonoHtml ? "<p style='margin:6px 0'><strong>Abono sugerido:</strong> {$abonoHtml}</p>" : "") . "
                        </div>

                        <p style='font-size:13px; color:#334155;'>Si necesitas ajustar algún dato, responde a este correo para ayudarte.</p>
                        <p style='margin-top:16px;'>Saludos,<br><strong>{$brandName}</strong></p>
                    </div>
                </div>";

                $mail->Body = $clienteHtml;
                $mail->send();
                $confirmacionEnviada = true;
            } else {
                enviar_descuento:
                // Cliente NO HA PAGADO - Enviar correo único de descuento para captar atención
                // Usar el precio disponible (totalConDescuento o precio original como fallback)
                $precioBase = $totalConDescuento > 0 ? $totalConDescuento : $precio;
                $precioConDescuentoEspecial = $precioBase > 0 
                    ? round($precioBase * (1 - $DESCUENTO_OFERTA_ESPECIAL / 100)) 
                    : 0;
                $precioConDescuentoHtml = '$' . number_format($precioConDescuentoEspecial, 0, ',', '.') . ' CLP';

                $mail->Subject = "🎉 ¡Oferta Exclusiva! {$DESCUENTO_OFERTA_ESPECIAL}% de descuento en tu traslado - {$brandName}";

                $descuentoHtml = "<div style='font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:20px auto; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;'>
                    <div style='background: linear-gradient(135deg, #059669 0%, #10b981 100%); color:#fff; padding:24px 22px; text-align:center;'>
                        <h2 style='margin:0; font-size:24px;'>🎉 ¡Oferta Exclusiva para Ti!</h2>
                        <p style='margin:8px 0 0; font-size:16px; opacity:0.95;'>{$DESCUENTO_OFERTA_ESPECIAL}% de descuento en tu próximo traslado</p>
                    </div>
                    <div style='padding:20px;'>
                        <p>Hola <strong>" . htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') . "</strong>,</p>
                        <p>Notamos que tu reserva <strong>(Código: {$codigoReserva})</strong> aún está pendiente de pago. ¡Tenemos una oferta especial para <strong>esta misma reserva</strong>!</p>

                        <div style='background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border:2px solid #10b981; border-radius:12px; padding:20px; margin:16px 0; text-align:center;'>
                            <p style='margin:0 0 8px; font-size:14px; color:#065f46;'>PRECIO ORIGINAL</p>
                            <p style='margin:0; font-size:18px; text-decoration:line-through; color:#6b7280;'>{$totalHtml}</p>
                            <p style='margin:16px 0 8px; font-size:14px; color:#065f46;'>TU PRECIO ESPECIAL</p>
                            <p style='margin:0; font-size:32px; font-weight:bold; color:#059669;'>{$precioConDescuentoHtml}</p>
                            <p style='margin:8px 0 0; font-size:12px; color:#059669;'>¡Ahorras {$DESCUENTO_OFERTA_ESPECIAL}%!</p>
                        </div>

                        <div style='background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin:12px 0;'>
                            <h3 style='margin:0 0 12px; color:#1e293b; font-size:16px;'>📋 Detalles de tu reserva:</h3>
                            <p style='margin:6px 0'><strong>Origen:</strong> {$origen}</p>
                            <p style='margin:6px 0'><strong>Destino:</strong> {$destino}</p>
                            <p style='margin:6px 0'><strong>Fecha y hora:</strong> {$fecha} {$hora}</p>
                            <p style='margin:6px 0'><strong>Pasajeros:</strong> {$pasajeros}</p>
                            <p style='margin:6px 0'><strong>Vehículo:</strong> {$vehiculo}</p>
                        </div>

                        <div style='text-align:center; margin:24px 0;'>
                            <p style='margin:0 0 16px; font-size:14px; color:#374151;'>Para obtener este descuento, completa tu pago respondiendo a este correo o contáctanos por WhatsApp:</p>
                            <br>
                            <a href='https://wa.me/56936643540?text=Hola,%20quiero%20confirmar%20mi%20reserva%20{$codigoReserva}%20con%20descuento' style='background-color:#25D366; color:white; padding:12px 24px; text-decoration:none; border-radius:50px; font-weight:bold; font-size:16px; display:inline-block;'>
                                📱 Confirmar por WhatsApp
                            </a>
                            <p style='margin:16px 0 0; font-size:14px;'>
                                O escríbenos a: <a href='mailto:contacto@transportesaraucaria.cl' style='color:#059669;'>contacto@transportesaraucaria.cl</a>
                            </p>
                        </div>

                        <p style='font-size:12px; color:#6b7280; text-align:center; margin-top:20px;'>
                            *Esta oferta es válida por tiempo limitado. Responde a este correo para confirmar tu reserva con descuento.
                        </p>

                        <p style='margin-top:16px;'>Saludos,<br><strong>{$brandName}</strong></p>
                    </div>
                </div>";

            }
        } catch (Exception $e2) {
            // No interrumpir la respuesta por fallo en confirmación al cliente
            error_log('Error enviando confirmación al cliente: ' . $mail->ErrorInfo);
        }
    }

    // Respuesta exitosa
    echo json_encode([
        'message' => 'Mensaje enviado exitosamente.',
        'reserva_guardada' => $reservaGuardada,
        'id_reserva' => $reservaCompleta['id'] ?? null,
        'correo_admin_enviado' => $adminEmailEnviado,
        'correo_cliente_enviado' => $confirmacionEnviada
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'message' => "Error al enviar el correo: {$mail->ErrorInfo}",
        'reserva_guardada' => $reservaGuardada,
        'id_reserva' => $reservaCompleta['id'] ?? null,
        'correo_admin_enviado' => $adminEmailEnviado,
        'correo_cliente_enviado' => $confirmacionEnviada
    ]);
}
