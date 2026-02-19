<?php
// enviar_correo_completo.php
// Versión final con correo mejorado y sin envío al cliente
// Habilitar la visualización de errores para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- ¡CARGA MANUAL DE PHPMailer CON LA RUTA CORRECTA! ---
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

// Extrae y sanitiza TODOS los datos posibles
$nombre = htmlspecialchars($data['nombre'] ?? 'No especificado');
$email = filter_var($data['email'] ?? '', FILTER_SANITIZE_EMAIL);
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

// Datos financieros
$abonoSugerido = $data['abonoSugerido'] ?? 0;
$saldoPendiente = $data['saldoPendiente'] ?? 0;
$descuentoBase = $data['descuentoBase'] ?? 0;
$descuentoPromocion = $data['descuentoPromocion'] ?? 0;
$descuentoRoundTrip = $data['descuentoRoundTrip'] ?? 0;
$descuentoOnline = $data['descuentoOnline'] ?? 0;
$totalConDescuento = $data['totalConDescuento'] ?? $precio;

// Datos adicionales del formulario
$otroOrigen = htmlspecialchars($data['otroOrigen'] ?? '');
$otroDestino = htmlspecialchars($data['otroDestino'] ?? '');
$codigoReserva = htmlspecialchars($data['codigoReserva'] ?? '');
$upgradeVan = $data['upgradeVan'] ?? false;

$formattedPrice = $precio ? '$' . number_format($precio, 0, ',', '.') . ' CLP' : 'A consultar';
$formattedTotalConDescuento = $totalConDescuento ? '$' . number_format($totalConDescuento, 0, ',', '.') . ' CLP' : 'A consultar';

// Preparar datos completos para guardar
$reservaCompleta = [
    'nombre' => $nombre,
    'email' => $email,
    'telefono' => $telefono,
    'source' => $source,
    'mensaje' => $mensaje,
    'origen' => $origen,
    'destino' => $destino,
    'otroOrigen' => $otroOrigen,
    'otroDestino' => $otroDestino,
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
    'upgradeVan' => $upgradeVan
];

// Intentar guardar la reserva ANTES de enviar el correo
$reservaGuardada = false;
try {
    $reservaGuardada = guardarReservaEnArchivo($reservasFile, $reservaCompleta);
} catch (Exception $e) {
    error_log("Error al guardar reserva: " . $e->getMessage());
}

// HTML del correo COMPLETO con TODOS los datos
$emailHtml = "
<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;'>
    <!-- Header -->
    <div style='background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px 25px; text-align: center;'>
        <h1 style='margin: 0; font-size: 28px; font-weight: 700;'>🚐 Nueva Reserva de Transfer</h1>
        <p style='margin: 10px 0 5px; font-size: 16px; opacity: 0.95;'>Fuente: <strong>{$source}</strong></p>
        <p style='margin: 5px 0 0; font-size: 13px; opacity: 0.8;'>" . date('d/m/Y H:i:s') . "</p>
        <div style='margin-top: 15px; padding: 10px; border-radius: 6px; " .
    ($reservaGuardada ?
        "background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4);'><span style='font-size: 14px;'>✅ Reserva guardada en sistema</span>" :
        "background: rgba(251, 191, 36, 0.2); border: 1px solid rgba(251, 191, 36, 0.4);'><span style='font-size: 14px;'>⚠️ Reserva NO guardada en sistema</span>"
    ) . "
        </div>
    </div>

    <!-- Contenido Principal -->
    <div style='padding: 30px 25px;'>";

// Código de Reserva (si existe)
if (!empty($codigoReserva)) {
    $emailHtml .= "
        <!-- Código de Reserva -->
        <div style='background: #dbeafe; border: 3px solid #3b82f6; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;'>
            <div style='display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;'>
                <svg width='24' height='24' fill='#1e40af' viewBox='0 0 24 24'>
                    <path d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' stroke='#1e40af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'/>
                </svg>
                <h3 style='margin: 0; color: #1e40af; font-size: 18px; font-weight: 600;'>Código de Reserva</h3>
            </div>
            <p style='margin: 0; font-size: 32px; font-weight: 800; color: #1e3a8a; letter-spacing: 2px; font-family: monospace;'>{$codigoReserva}</p>
            <p style='margin: 10px 0 0; font-size: 13px; color: #1e40af;'>Guarda este código para consultar tu reserva</p>
        </div>";
}

$emailHtml .= "
        <!-- Resumen Financiero -->
        <div style='background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 2px solid #0ea5e9; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;'>
            <h2 style='margin: 0 0 15px; color: #0c4a6e; font-size: 22px;'>💰 Resumen Financiero</h2>
            <div style='display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px;'>
                <div style='flex: 1; min-width: 200px;'>
                    <p style='margin: 5px 0; font-size: 18px; color: #0c4a6e;'><strong>Precio Base:</strong></p>
                    <p style='margin: 0; font-size: 24px; font-weight: bold; color: #1e40af;'>{$formattedPrice}</p>
                </div>";

if ($totalConDescuento != $precio && $totalConDescuento > 0) {
    $emailHtml .= "
                <div style='flex: 1; min-width: 200px;'>
                    <p style='margin: 5px 0; font-size: 18px; color: #059669;'><strong>Precio Final:</strong></p>
                    <p style='margin: 0; font-size: 24px; font-weight: bold; color: #059669;'>{$formattedTotalConDescuento}</p>
                </div>";
}

$emailHtml .= "
            </div>
            <p style='margin: 15px 0 5px; font-size: 16px; color: #0c4a6e;'><strong>Vehículo:</strong> {$vehiculo}</p>
            " . ($upgradeVan ? "<p style='margin: 5px 0 0; font-size: 14px; color: #7c2d12; font-weight: bold;'>✨ OPCIÓN PREMIUM: UPGRADE A VAN</p>" : "") . "
            " . ($idaVuelta ? "<p style='margin: 5px 0 0; font-size: 14px; color: #7c3aed; font-weight: 600;'>🔄 VIAJE DE IDA Y VUELTA</p>" : "") . "
        </div>

        <!-- Información del Viaje -->
        <div style='background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 25px;'>
            <h2 style='margin: 0 0 15px; color: #1e293b; font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;'>🗺️ Detalles del Viaje</h2>
            <div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;'>
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #475569;'>Origen:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #3b82f6;'>{$origen}" . ($otroOrigen ? " ({$otroOrigen})" : "") . "</p>
                </div>
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #475569;'>Destino:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #10b981;'>{$destino}" . ($otroDestino ? " ({$otroDestino})" : "") . "</p>
                </div>
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #475569;'>Fecha y Hora:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #f59e0b;'>{$fecha} a las {$hora}</p>
                </div>
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #475569;'>Pasajeros:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #8b5cf6;'>{$pasajeros} persona" . ($pasajeros > 1 ? 's' : '') . "</p>
                </div>";

if ($idaVuelta && $fechaRegreso && $horaRegreso) {
    $emailHtml .= "
                <div style='grid-column: 1 / -1; background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;'>
                    <p style='margin: 0 0 8px; font-weight: 600; color: #92400e;'>🔄 Viaje de Regreso:</p>
                    <p style='margin: 0; color: #92400e;'><strong>Fecha:</strong> {$fechaRegreso} | <strong>Hora:</strong> {$horaRegreso}</p>
                </div>";
}

$emailHtml .= "
            </div>
        </div>

        <!-- Información del Cliente -->
        <div style='background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 25px;'>
            <h2 style='margin: 0 0 15px; color: #1e293b; font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;'>👤 Información del Cliente</h2>
            <div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;'>
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #475569;'>Nombre Completo:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #3b82f6;'>{$nombre}</p>
                </div>
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #475569;'>Teléfono:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #10b981;'><a href='tel:{$telefono}' style='color: #059669; text-decoration: none;'>{$telefono}</a></p>
                </div>
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #475569;'>Email:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #f59e0b;'><a href='mailto:{$email}' style='color: #d97706; text-decoration: none;'>{$email}</a></p>
                </div>
            </div>
        </div>";

// Servicios Adicionales
if ($numeroVuelo || $hotel || $equipajeEspecial || $sillaInfantil === 'si') {
    $emailHtml .= "
        <!-- Servicios Adicionales -->
        <div style='background: #f0fdf4; border-radius: 10px; padding: 20px; margin-bottom: 25px; border: 1px solid #bbf7d0;'>
            <h2 style='margin: 0 0 15px; color: #14532d; font-size: 20px; border-bottom: 2px solid #bbf7d0; padding-bottom: 10px;'>🎯 Servicios Adicionales</h2>
            <div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;'>";

    if ($numeroVuelo) {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #15803d;'>✈️ Número de Vuelo:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #22c55e;'>{$numeroVuelo}</p>
                </div>";
    }

    if ($hotel) {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #15803d;'>🏨 Hotel:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #22c55e;'>{$hotel}</p>
                </div>";
    }

    if ($equipajeEspecial) {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #15803d;'>🧳 Equipaje Especial:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #22c55e;'>{$equipajeEspecial}</p>
                </div>";
    }

    if ($sillaInfantil === 'si') {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #15803d;'>👶 Silla Infantil:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #22c55e;'>✅ Requerida</p>
                </div>";
    }

    $emailHtml .= "
            </div>
        </div>";
}

// Información Financiera Detallada
if ($abonoSugerido > 0 || $totalConDescuento != $precio) {
    $emailHtml .= "
        <!-- Información Financiera Detallada -->
        <div style='background: #fefce8; border-radius: 10px; padding: 20px; margin-bottom: 25px; border: 1px solid #fde047;'>
            <h2 style='margin: 0 0 15px; color: #713f12; font-size: 20px; border-bottom: 2px solid #fde047; padding-bottom: 10px;'>💳 Desglose Financiero</h2>
            <div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;'>";

    if ($precio > 0) {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #a16207;'>Precio Original:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #eab308;'>$" . number_format($precio, 0, ',', '.') . " CLP</p>
                </div>";
    }

    if ($descuentoBase > 0) {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #a16207;'>Descuento Base:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #eab308;'>{$descuentoBase}%</p>
                </div>";
    }

    if ($descuentoPromocion > 0) {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #a16207;'>Descuento Promoción:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #eab308;'>{$descuentoPromocion}%</p>
                </div>";
    }

    if ($descuentoRoundTrip > 0 && $idaVuelta) {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #a16207;'>Descuento Ida y Vuelta:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #eab308;'>{$descuentoRoundTrip}%</p>
                </div>";
    }

    if ($descuentoOnline > 0) {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #a16207;'>Descuento Online:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #eab308;'>{$descuentoOnline}%</p>
                </div>";
    }

    if ($abonoSugerido > 0) {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #a16207;'>Abono Sugerido:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #eab308;'>$" . number_format($abonoSugerido, 0, ',', '.') . " CLP</p>
                </div>";
    }

    if ($saldoPendiente > 0) {
        $emailHtml .= "
                <div>
                    <p style='margin: 8px 0 4px; font-weight: 600; color: #a16207;'>Saldo Pendiente:</p>
                    <p style='margin: 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #eab308;'>$" . number_format($saldoPendiente, 0, ',', '.') . " CLP</p>
                </div>";
    }

    $emailHtml .= "
            </div>
        </div>";
}

        </div>";
}

$emailHtml .= "
        <!-- Contacto Oficina -->
        <div style='background-color:#f8fafc; padding:20px; border-radius:10px; text-align:center; margin-bottom:25px; border:1px solid #e2e8f0'>
            <p style='margin:0 0 10px 0; color:#64748b; font-size:14px; font-weight:600'>Transportes Araucaria - Contacto Oficial</p>
            <p style='margin:0; color:#1e3a8a; font-size:16px; font-weight:700'>
                📱 +56 9 3664 3540 | 📧 contacto@transportesaraucaria.cl
            </p>
        </div>";

if ($mensaje) {
    $emailHtml .= "
        <!-- Mensaje del Cliente -->
        <div style='background: #f1f5f9; border-radius: 10px; padding: 20px; margin-bottom: 25px; border: 1px solid #cbd5e1;'>
            <h2 style='margin: 0 0 15px; color: #334155; font-size: 20px; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px;'>💬 Mensaje del Cliente</h2>
            <div style='background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1;'>
                <p style='margin: 0; font-style: italic; color: #475569; line-height: 1.6;'>\"" . nl2br($mensaje) . "\"</p>
            </div>
        </div>";
}

// Información Técnica
$emailHtml .= "
        <!-- Información Técnica -->
        <div style='background: #f8fafc; border-radius: 10px; padding: 20px; border: 1px solid #e2e8f0;'>
            <h3 style='margin: 0 0 15px; color: #64748b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;'>🔧 Información Técnica</h3>
            <div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 12px; color: #64748b;'>
                <p style='margin: 4px 0;'><strong>ID Reserva:</strong> " . ($reservaCompleta['id'] ?? 'N/A') . "</p>
                <p style='margin: 4px 0;'><strong>Fecha Registro:</strong> " . date('d/m/Y H:i:s') . "</p>
                <p style='margin: 4px 0;'><strong>IP Cliente:</strong> " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A') . "</p>
                <p style='margin: 4px 0;'><strong>Estado Guardado:</strong> " . ($reservaGuardada ? "✅ Exitoso" : "❌ Error") . "</p>
            </div>
        </div>
    </div>
</div>";

$mail = new PHPMailer(true);

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

    // Destinatarios - SOLO AL ADMINISTRADOR, NO AL CLIENTE
    $mail->setFrom($emailUser, 'Sistema de Reservas - Transportes Araucaria');
    $mail->addAddress($emailTo); // Solo tu correo administrativo
    $mail->addReplyTo($email, $nombre); // Para que puedas responder al cliente

    // Contenido
    $mail->isHTML(true);
    $mail->Subject = "🚐 Nueva Reserva: {$destino} - " . ($reservaGuardada ? "GUARDADA" : "NO GUARDADA") . " - " . $nombre;
    $mail->Body    = $emailHtml;

    $mail->send();

    // Respuesta exitosa
    echo json_encode([
        'message' => 'Reserva procesada y notificación enviada correctamente.',
        'reserva_guardada' => $reservaGuardada,
        'id_reserva' => $reservaCompleta['id'] ?? null,
        'correo_cliente' => false // Confirma que NO se envía correo al cliente
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'message' => "Error al procesar la reserva: {$mail->ErrorInfo}",
        'reserva_guardada' => $reservaGuardada,
        'id_reserva' => $reservaCompleta['id'] ?? null,
        'correo_cliente' => false
    ]);
}
