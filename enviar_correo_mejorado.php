<?php
// AVISO: Este archivo se despliega manualmente en Hostinger (frontend y PHP en Hostinger).
// Cualquier cambio local debe subirse manualmente al servidor.

// enviar_correo_mejorado.php
// Versión mejorada que envía correo Y guarda los datos de reserva
// En producción, NO mostrar errores en la salida para no corromper el JSON
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
// Los errores se registran en el log del servidor, no en la salida
@ini_set('log_errors', 1);

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
$emailTo = getenv('EMAIL_TO') ?: 'contacto@transportesaraucaria.cl';

// Configuración adicional
$sendCustomerConfirmation = true; // Enviar correo de confirmación al cliente si tiene email válido
$brandName = 'Transportes Araucaria';

// Utilidad: actualizar flags de correo en la reserva guardada
function actualizarFlagsCorreoReserva($archivo, $reservaId, $flags)
{
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
// Normalizar nomenclatura
if (strtolower($vehiculo) === 'sedan' || $vehiculo === 'Auto Privado') {
    $vehiculo = 'Sedán';
}

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
$pagoMonto = $data['pagoMonto'] ?? 0; // NUEVO
$descuentoBase = $data['descuentoBase'] ?? 0;
$descuentoPromocion = $data['descuentoPromocion'] ?? 0;
$descuentoRoundTrip = $data['descuentoRoundTrip'] ?? 0;
$descuentoOnline = $data['descuentoOnline'] ?? 0;
$totalConDescuento = $data['totalConDescuento'] ?? $precio;
$upgradeVan = $data['upgradeVan'] ?? false;

// Determinar el icono del vehículo dinámicamente
$esVan = (stripos($vehiculo, 'van') !== false);
$vehiculoIcono = $esVan ? '🚐' : '🚗';

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

// CORRECCIÓN: Usar totalConDescuento si está disponible (incluye ida+vuelta), sino usar precio
$precioParaMostrar = ($totalConDescuento > 0) ? $totalConDescuento : $precio;
$formattedPrice = $precioParaMostrar ? '$' . number_format($precioParaMostrar, 0, ',', '.') . ' CLP' : 'A consultar';

// Preparar datos completos para guardar
$reservaCompleta = [
    'id' => $data['id'] ?? ($data['reservaId'] ?? null),
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
    'upgradeVan' => $upgradeVan,
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

// Inicializar variables de estado
$reservaGuardada = false;
$adminEmailEnviado = false;
$confirmacionEnviada = false;

if ($action === 'send_discount_offer') {
    // La lógica de send_discount_offer se define más abajo
    // pero mantenemos la estructura if para evitar errores de sintaxis
}

// =========================================================
// RAMA: send_lead_recovery — correo de recuperación de carrito abandonado
// =========================================================
if ($action === 'send_lead_recovery') {
    if (!$hasValidCustomerEmail) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email del cliente inválido.']);
        exit;
    }

    $mail3 = new PHPMailer(true);
    try {
        $mail3->isSMTP();
        $mail3->Host       = $emailHost;
        $mail3->SMTPAuth   = true;
        $mail3->Username   = $emailUser;
        $mail3->Password   = $emailPass;
        $mail3->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail3->Port       = $emailPort;
        $mail3->CharSet    = 'UTF-8';

        $mail3->setFrom($emailUser, $brandName);
        $mail3->addAddress($email, $nombre ?: 'Cliente');
        $mail3->addBCC($emailTo); // Copia al admin para respaldo y monitoreo
        $mail3->addReplyTo($emailUser, $brandName);
        $mail3->isHTML(true);

        $backendBase = getenv('BACKEND_URL') ?: 'https://transportes-araucaria.onrender.com';
        $payLink = "{$backendBase}/api/reservas/{$reservaCompleta['id']}/pay-redirect?type=abono";
        $totalHtml = $totalConDescuento ? ('$' . number_format($totalConDescuento, 0, ',', '.') . ' CLP') : ('$' . number_format($precio, 0, ',', '.') . ' CLP');

        $mail3->Subject = "🚐 ¡No pierdas tu traslado! Asegura tu cupo ahora - {$brandName}";

        $mail3->Body = "
        <div style='font-family: \"Segoe UI\", Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 20px auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>
            <div style='background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 32px 24px; text-align: center;'>
                <h1 style='margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em;'>¡Casi listo! 🚌</h1>
                <p style='margin: 8px 0 0; font-size: 16px; opacity: 0.9;'>Aún puedes asegurar tu traslado a {$destino}</p>
            </div>
            
            <div style='padding: 32px 24px; background-color: #ffffff;'>
                <p style='font-size: 16px; margin: 0 0 20px;'>Hola <strong style='color: #111827;'>" . htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') . "</strong>,</p>
                <p style='margin: 0 0 24px;'>Notamos que no alcanzaste a completar tu reserva. ¡No te preocupes! Hemos guardado tu cotización para que no tengas que empezar de nuevo.</p>
                
                <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px;'>
                    <h3 style='margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;'>Resumen de tu viaje</h3>
                    <div style='margin-bottom: 12px;'>
                        <span style='color: #94a3b8; font-size: 13px;'>Ruta:</span><br>
                        <strong style='font-size: 15px;'>{$origen} → {$destino}</strong>
                    </div>
                    <div style='display: flex; gap: 20px; margin-bottom: 12px;'>
                        <div style='flex: 1;'>
                            <span style='color: #94a3b8; font-size: 13px;'>Fecha:</span><br>
                            <strong style='font-size: 15px;'>{$fecha}</strong>
                        </div>
                        <div style='flex: 1;'>
                            <span style='color: #94a3b8; font-size: 13px;'>Hora:</span><br>
                            <strong style='font-size: 15px;'>{$hora}</strong>
                        </div>
                    </div>
                    <div style='margin-top: 16px; padding-top: 16px; border-top: 1px dashed #cbd5e1;'>
                        <span style='color: #94a3b8; font-size: 13px;'>Total Cotizado:</span><br>
                        <strong style='font-size: 22px; color: #1e40af;'>{$totalHtml}</strong>
                    </div>
                </div>

                <div style='text-align: center; margin-bottom: 32px;'>
                    <a href='{$payLink}' style='background-color: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);'>
                        💳 Pagar Abono y Asegurar Cupo
                    </a>
                    <p style='font-size: 14px; color: #1e40af; font-weight: bold; margin-top: 12px;'>✨ ¡Hasta 3 cuotas precio contado!</p>
                    <p style='font-size: 13px; color: #6b7280; margin-top: 4px;'>Paga con Webpay, Débito, Crédito o Transferencia vía <strong>Flow</strong>.</p>
                    <p style='font-size: 12px; color: #9ca3af; margin-top: 4px;'>*Solo necesitas pagar el 40% para confirmar.</p>
                </div>

                <!-- Bloque urgencia WhatsApp con descuento especial -->
                <div style='background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px solid #ea580c; border-radius: 14px; padding: 24px; text-align: center; margin-top: 28px;'>
                    <!-- Badge de urgencia -->
                    <div style='display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 50px; letter-spacing: 0.08em; margin-bottom: 14px; text-transform: uppercase;'>⏰ OFERTA POR TIEMPO LIMITADO</div>
                    <h3 style='margin: 0 0 10px; font-size: 19px; color: #7c2d12; font-weight: 800; line-height: 1.3;'>¡Hay un descuento especial<br>disponible para tu ruta!</h3>
                    <p style='margin: 0 0 8px; font-size: 14px; color: #9a3412; line-height: 1.5;'>
                        Escríbenos <strong>ahora por WhatsApp</strong> y pregunta por el<br>
                        <strong>descuento exclusivo</strong> que tenemos para tu traslado.
                    </p>
                    <p style='margin: 0 0 20px; font-size: 13px; color: #c2410c; font-style: italic;'>⚡ Cupos limitados — esta oferta puede expirar en cualquier momento.</p>
                    <!-- Botón WhatsApp principal -->
                    <a href='https://wa.me/56936643540?text=Hola!%20Vi%20que%20hay%20un%20descuento%20especial%20disponible%20para%20mi%20traslado%20de%20{$origen}%20a%20{$destino}.%20C%C3%B3digo%20de%20reserva%3A%20{$codigoReserva}%20%C2%BFMe%20pueden%20confirmar%20el%20descuento?' style='background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; padding: 15px 32px; border-radius: 50px; font-weight: 800; font-size: 17px; text-decoration: none; display: inline-block; box-shadow: 0 6px 12px -2px rgba(22, 163, 74, 0.4); letter-spacing: 0.01em;'>
                        📱 ¡Quiero mi descuento especial!
                    </a>
                    <p style='font-size: 12px; color: #9a3412; margin-top: 14px; margin-bottom: 0;'>Respuesta inmediata &middot; Sin compromisos &middot; Solo por WhatsApp</p>
                </div>
            </div>
            
            <div style='background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af;'>
                <p style='margin: 0;'>© " . date('Y') . " {$brandName}. Todos los derechos reservados.</p>
                <p style='margin: 4px 0 0;'>Servicio de traslados ejecutivos y privados.</p>
            </div>
        </div>";

        $mail3->send();
        echo json_encode([
            'success' => true,
            'message' => 'Correo de recuperación enviado exitosamente.',
            'reserva_id' => $reservaCompleta['id']
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al enviar correo de recuperación: ' . $mail3->ErrorInfo
        ]);
    }
    exit;
}

// =========================================================
// RAMA: send_discount_offer — correo de descuento (cron o manual)
// =========================================================
if ($action === 'send_discount_offer') {
    if (!$hasValidCustomerEmail) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email del cliente inválido.']);
        exit;
    }

    $mail4 = new PHPMailer(true);
    try {
        $mail4->isSMTP();
        $mail4->Host       = $emailHost;
        $mail4->SMTPAuth   = true;
        $mail4->Username   = $emailUser;
        $mail4->Password   = $emailPass;
        $mail4->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail4->Port       = $emailPort;
        $mail4->CharSet    = 'UTF-8';

        $mail4->setFrom($emailUser, $brandName);
        $mail4->addAddress($email, $nombre ?: 'Cliente');
        $mail4->addBCC($emailTo); // Copia al admin para respaldo
        $mail4->addReplyTo($emailUser, $brandName);
        $mail4->isHTML(true);

        $precioHtml  = $precio ? ('$' . number_format($precio, 0, ',', '.') . ' CLP') : 'A consultar';
        $totalHtml   = $totalConDescuento ? ('$' . number_format($totalConDescuento, 0, ',', '.') . ' CLP') : $precioHtml;
        $precioBase  = $totalConDescuento > 0 ? $totalConDescuento : $precio;
        $precioConDescuentoEspecial = $precioBase > 0
            ? round($precioBase * (1 - $DESCUENTO_OFERTA_ESPECIAL / 100))
            : 0;
        $precioConDescuentoHtml = '$' . number_format($precioConDescuentoEspecial, 0, ',', '.') . ' CLP';

        $mail4->Subject = "🎉 ¡Oferta Exclusiva! {$DESCUENTO_OFERTA_ESPECIAL}% de descuento en tu traslado - {$brandName}";

        $mail4->Body = "<div style='font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:20px auto; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;'>
            <div style='background: linear-gradient(135deg, #059669 0%, #10b981 100%); color:#fff; padding:24px 22px; text-align:center;'>
                <h2 style='margin:0; font-size:24px;'>{$vehiculoIcono} ¡Oferta Exclusiva para Ti!</h2>
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
                    <p style='margin:12px 0 0; font-size:15px; color:#059669; font-weight:bold;'>💳 ¡Paga en 3 cuotas sin interés!</p>
                    <p style='margin:4px 0 0; font-size:13px; color:#065f46;'>Aceptamos Débito, Crédito y Transferencia vía Flow.</p>
                </div>
                <div style='text-align:center; margin:24px 0;'>
                    <a href='https://wa.me/56936643540?text=Hola,%20quiero%20confirmar%20mi%20reserva%20{$codigoReserva}%20con%20descuento' style='background-color:#25D366; color:white; padding:12px 24px; text-decoration:none; border-radius:50px; font-weight:bold; font-size:16px; display:inline-block;'>
                        📱 Confirmar por WhatsApp con Descuento
                    </a>
                </div>
                <p style='font-size:12px; color:#6b7280; text-align:center;'>*Esta oferta es válida por tiempo limitado.</p>
                <p style='margin-top:16px;'>Saludos,<br><strong>{$brandName}</strong></p>
            </div>
        </div>";

        $mail4->send();
        echo json_encode(['success' => true, 'message' => 'Correo de descuento enviado exitosamente.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al enviar de descuento: ' . $mail4->ErrorInfo]);
    }
    exit;
}

// =========================================================
// RAMA: notify_admin_failed_email — fallo en cron
// =========================================================
if ($action === 'notify_admin_failed_email') {
    $mail5 = new PHPMailer(true);
    try {
        $mail5->isSMTP();
        $mail5->Host       = $emailHost;
        $mail5->SMTPAuth   = true;
        $mail5->Username   = $emailUser;
        $mail5->Password   = $emailPass;
        $mail5->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail5->Port       = $emailPort;
        $mail5->CharSet    = 'UTF-8';

        $mail5->setFrom($emailUser, 'Sistema de Alertas');
        $mail5->addAddress($emailTo);
        $mail5->isHTML(true);

        $lastError = htmlspecialchars($data['lastError'] ?? 'Error desconocido');
        $tipoEnvio = htmlspecialchars($data['tipo'] ?? 'Desconocido');
        $attempts = htmlspecialchars($data['attempts'] ?? '3');

        $mail5->Subject = "⚠️ ERROR: Fallo definitivo envío de correo ({$tipoEnvio}) - {$codigoReserva}";
        $mail5->Body = "
            <h3>Error Crítico en Sistema de Correos Automáticos</h3>
            <p>Se han agotado los intentos de envío para el siguiente correo:</p>
            <ul>
                <li><strong>Reserva:</strong> {$codigoReserva}</li>
                <li><strong>Cliente:</strong> {$nombre} ({$email})</li>
                <li><strong>Tipo de Envío:</strong> {$tipoEnvio}</li>
                <li><strong>Intentos:</strong> {$attempts}</li>
                <li><strong>Último Error:</strong> <code style='color: red;'>{$lastError}</code></li>
            </ul>
            <p>Por favor, revisa el estado del servidor PHP o el log de errores.</p>
        ";

        $mail5->send();
        echo json_encode(['success' => true, 'message' => 'Notificación de fallo enviada al admin.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al notificar al admin: ' . $mail5->ErrorInfo]);
    }
    exit;
}

// =========================================================
// RAMA: normal / notify_admin_only — envío al admin primero
// =========================================================


// Intentar guardar la reserva ANTES de enviar el correo
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
            <h1 style='margin: 0;'>{$vehiculoIcono} Nueva Solicitud de Cotización</h1>
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
                " . ($upgradeVan ? "<p style='margin: 5px 0; font-size: 14px; color: #7c2d12; font-weight: bold;'>✨ Opción Premium: Upgrade a Van</p>" : "") . "
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

// Información financiera si hay descuentos o pagos
if ($totalConDescuento != $precio || $pagoMonto > 0) {
    $emailHtml .= "
            <h2>Información Financiera</h2>
            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>";

    if ($precio > 0) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold; color: #a16207;'>Precio Base:</td><td style='padding: 8px;'>$" . number_format($precio, 0, ',', '.') . " CLP</td></tr>";
    }

    if ($descuentoBase > 0) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold; color: #a16207;'>Descuento Base:</td><td style='padding: 8px;'>-$" . number_format($descuentoBase, 0, ',', '.') . " CLP</td></tr>";
    }
    if ($descuentoPromocion > 0) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold; color: #a16207;'>Descuento Promoción:</td><td style='padding: 8px;'>-$" . number_format($descuentoPromocion, 0, ',', '.') . " CLP</td></tr>";
    }
    if ($descuentoRoundTrip > 0 && $idaVuelta) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold; color: #a16207;'>Descuento Ida y Vuelta:</td><td style='padding: 8px;'>-$" . number_format($descuentoRoundTrip, 0, ',', '.') . " CLP</td></tr>";
    }
    if ($descuentoOnline > 0) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold; color: #a16207;'>Descuento Online:</td><td style='padding: 8px;'>-$" . number_format($descuentoOnline, 0, ',', '.') . " CLP</td></tr>";
    }

    if ($totalConDescuento > 0 && $totalConDescuento != $precio) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold; color: #84cc16;'>Precio Final:</td><td style='padding: 8px; font-weight: bold;'>$" . number_format($totalConDescuento, 0, ',', '.') . " CLP</td></tr>";
    }

    if ($pagoMonto > 0) {
        $emailHtml .= "<tr style='border-bottom: 1px solid #eee;'><td style='padding: 8px; font-weight: bold; color: #22c55e;'>Monto Pagado:</td><td style='padding: 8px; font-weight: bold;'>$" . number_format($pagoMonto, 0, ',', '.') . " CLP</td></tr>";
    }

    $saldoCalculado = max(0, $totalConDescuento - $pagoMonto);
    if ($saldoCalculado > 0) {
        $emailHtml .= "<tr><td style='padding: 8px; font-weight: bold; color: #ef4444;'>Saldo Pendiente:</td><td style='padding: 8px; font-weight: bold; color: #ef4444;'>$" . number_format($saldoCalculado, 0, ',', '.') . " CLP</td></tr>";
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
    $mail->Subject = "{$vehiculoIcono} Nueva Cotización de Transfer: {$destino} - " . ($reservaGuardada ? "GUARDADA" : "NO GUARDADA");
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
                        <h2 style='margin:0; font-size:18px;'>{$vehiculoIcono} {$brandName}</h2>
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
                            " . ($upgradeVan ? "<p style='margin:6px 0; color: #7c2d12; font-weight: bold;'>✨ Upgrade a Van</p>" : "") . "
                            " . ($idaVuelta && $fechaRegreso ? "<p style='margin:6px 0; color: #7c3aed; font-weight: 600;'>🔄 Regreso: {$fechaRegreso} {$horaRegreso}</p>" : "") . "
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
                        <h2 style='margin:0; font-size:24px;'>{$vehiculoIcono} ¡Oferta Exclusiva para Ti!</h2>
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
                            <p style='margin:12px 0 0; font-size:15px; color:#059669; font-weight:bold;'>💳 ¡Hasta 3 cuotas precio contado!</p>
                            <p style='margin:4px 0 0; font-size:13px; color:#065f46;'>Webpay, Débito, Crédito y Transferencia vía Flow.</p>
                        </div>

                        <div style='background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin:12px 0;'>
                            <h3 style='margin:0 0 12px; color:#1e293b; font-size:16px;'>📋 Detalles de tu reserva:</h3>
                            <p style='margin:6px 0'><strong>Origen:</strong> {$origen}</p>
                            <p style='margin:6px 0'><strong>Destino:</strong> {$destino}</p>
                            <p style='margin:6px 0'><strong>Fecha y hora:</strong> {$fecha} {$hora}</p>
                            <p style='margin:6px 0'><strong>Pasajeros:</strong> {$pasajeros}</p>
                            <p style='margin:6px 0'><strong>Vehículo:</strong> {$vehiculo}</p>
                            " . ($upgradeVan ? "<p style='margin:6px 0; color: #7c2d12; font-weight: bold;'>✨ Upgrade a Van Incluido</p>" : "") . "
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
        'success'               => true,
        'message'               => 'Mensaje enviado exitosamente.',
        'reserva_guardada'      => $reservaGuardada,
        'id_reserva'            => $reservaCompleta['id'] ?? null,
        'correo_admin_enviado'  => $adminEmailEnviado,
        'correo_cliente_enviado' => $confirmacionEnviada
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success'               => false,
        'message'               => "Error al enviar el correo: {$mail->ErrorInfo}",
        'reserva_guardada'      => $reservaGuardada,
        'id_reserva'            => $reservaCompleta['id'] ?? null,
        'correo_admin_enviado'  => $adminEmailEnviado,
        'correo_cliente_enviado' => $confirmacionEnviada
    ]);
}
