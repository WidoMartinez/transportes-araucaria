<?php

/**
 * ⚠️ IMPORTANTE: DESPLIEGUE MANUAL EN HOSTINGER ⚠️
 * 
 * Este archivo PHP debe ser subido manualmente al servidor de Hostinger.
 * Los archivos PHP NO se despliegan automáticamente desde el repositorio.
 * 
 * Ubicación en Hostinger: https://transportesaraucaria.cl/enviar_notificacion_productos.php
 * 
 * Pasos para desplegar:
 * 1. Conectar a Hostinger via FTP o File Manager
 * 2. Subir este archivo a la raíz del dominio
 * 3. Verificar permisos (644)
 * 4. Verificar que config_reservas.php existe con credenciales SMTP
 * 
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Script para enviar notificaciones por email cuando se agregan productos a una reserva
 * 
 * USO: Se debe llamar desde el backend de Node.js vía HTTP POST
 * Endpoint: https://transportesaraucaria.cl/enviar_notificacion_productos.php
 * 
 * Datos POST esperados:
 * - reservaId: ID de la reserva
 * - codigoReserva: Código de reserva
 * - emailPasajero: Email del pasajero
 * - nombrePasajero: Nombre del pasajero
 * - productos: Array de productos agregados (JSON)
 * - totalProductos: Total de productos agregados
 * - nuevoTotal: Nuevo total de la reserva
 */

// Prevenir acceso directo sin POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Método no permitido']));
}

// Headers para respuesta JSON
header('Content-Type: application/json; charset=utf-8');

// Cargar configuración de PHPMailer
require_once 'config_reservas.php';

// Intentar cargar manualmente PHPMailer si está disponible localmente (Hostinger)
if (file_exists(__DIR__ . '/PHPMailer/src/PHPMailer.php')) {
    require_once __DIR__ . '/PHPMailer/src/Exception.php';
    require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
    require_once __DIR__ . '/PHPMailer/src/SMTP.php';
}

use PHPMailer\PHPMailer\PHPMailer;

// Definir constantes SMTP si no existen, tomando valores de $EMAIL_CONFIG
if (!defined('SMTP_HOST') && isset($EMAIL_CONFIG['host'])) define('SMTP_HOST', $EMAIL_CONFIG['host']);
if (!defined('SMTP_PORT') && isset($EMAIL_CONFIG['port'])) define('SMTP_PORT', $EMAIL_CONFIG['port']);
if (!defined('SMTP_USER') && isset($EMAIL_CONFIG['username'])) define('SMTP_USER', $EMAIL_CONFIG['username']);
if (!defined('SMTP_PASS') && isset($EMAIL_CONFIG['password'])) define('SMTP_PASS', $EMAIL_CONFIG['password']);
if (!defined('EMAIL_FROM') && isset($EMAIL_CONFIG['username'])) define('EMAIL_FROM', $EMAIL_CONFIG['username']);
if (!defined('EMAIL_FROM_NAME') && isset($EMAIL_CONFIG['from_name'])) define('EMAIL_FROM_NAME', $EMAIL_CONFIG['from_name']);

try {
    // Obtener datos del POST
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        throw new \Exception('No se recibieron datos válidos');
    }

    // Validar datos requeridos
    $required = ['reservaId', 'codigoReserva', 'emailPasajero', 'nombrePasajero', 'productos', 'totalProductos'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new \Exception("Campo requerido faltante: $field");
        }
    }

    $reservaId = $data['reservaId'];
    $codigoReserva = $data['codigoReserva'];
    $emailPasajero = $data['emailPasajero'];
    $nombrePasajero = $data['nombrePasajero'];
    $productos = $data['productos'];
    $totalProductos = $data['totalProductos'];
    $nuevoTotal = isset($data['nuevoTotal']) ? $data['nuevoTotal'] : null;
    $emailConductor = isset($data['emailConductor']) ? $data['emailConductor'] : null;
    $nombreConductor = isset($data['nombreConductor']) ? $data['nombreConductor'] : null;

    // Formatear moneda CLP
    function formatCLP($monto)
    {
        return '$' . number_format($monto, 0, ',', '.');
    }

    // Generar HTML de productos
    $productosHTML = '';
    foreach ($productos as $prod) {
        $productosHTML .= '
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>' . htmlspecialchars($prod['nombre']) . '</strong><br>
                <small style="color: #666;">Cantidad: ' . $prod['cantidad'] . '</small>
                ' . (isset($prod['notas']) && $prod['notas'] ? '<br><small style="color: #666; font-style: italic;">Nota: ' . htmlspecialchars($prod['notas']) . '</small>' : '') . '
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                ' . formatCLP($prod['precioUnitario']) . ' c/u
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                <strong>' . formatCLP($prod['subtotal']) . '</strong>
            </td>
        </tr>';
    }

    // Configuración de monitoreo/admin (BCC)
    $adminEmail = $EMAIL_CONFIG['to'] ?? null; // Correo de monitoreo para copia oculta

    // Activar modo depuración opcional
    $debugMode = (isset($_GET['debug']) && $_GET['debug'] == '1') || (isset($_SERVER['HTTP_X_DEBUG']) && $_SERVER['HTTP_X_DEBUG'] === '1');
    $smtpLogs = [];

    // ========== EMAIL AL PASAJERO ==========
    $mailPasajero = new PHPMailer(true);

    // Configuración del servidor SMTP
    $mailPasajero->isSMTP();
    $mailPasajero->Host = SMTP_HOST;
    $mailPasajero->SMTPAuth = true;
    $mailPasajero->Username = SMTP_USER;
    $mailPasajero->Password = SMTP_PASS;
    $mailPasajero->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mailPasajero->Port = SMTP_PORT;
    $mailPasajero->CharSet = 'UTF-8';
    if ($debugMode) {
        $mailPasajero->SMTPDebug = 2; // Detallado
        $mailPasajero->Debugoutput = function ($str, $level) use (&$smtpLogs) {
            $line = '[SMTP DEBUG] ' . trim($str);
            $smtpLogs[] = $line;
            error_log($line);
        };
    }

    // Destinatario
    $mailPasajero->setFrom(EMAIL_FROM, EMAIL_FROM_NAME);
    $destinatarios = [];
    $bccEnviada = false;
    if (filter_var($emailPasajero, FILTER_VALIDATE_EMAIL)) {
        $mailPasajero->addAddress($emailPasajero, $nombrePasajero);
        $destinatarios[] = $emailPasajero;
    }
    // BCC a admin para auditoría
    if ($adminEmail && filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
        $mailPasajero->addBCC($adminEmail);
        $bccEnviada = true;
    }
    // Reply-To al pasajero si es válido
    if (filter_var($emailPasajero, FILTER_VALIDATE_EMAIL)) {
        $mailPasajero->addReplyTo($emailPasajero, $nombrePasajero);
    }

    // Contenido del email
    $mailPasajero->isHTML(true);
    $mailPasajero->Subject = '🛍️ Productos agregados a tu reserva ' . $codigoReserva;

    $mailPasajero->Body = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .productos-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; }
            .total-box { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛍️ ¡Productos Agregados!</h1>
                <p style="margin: 0; font-size: 18px;">Reserva ' . htmlspecialchars($codigoReserva) . '</p>
            </div>
            
            <div class="content">
                <p>Hola <strong>' . htmlspecialchars($nombrePasajero) . '</strong>,</p>
                
                <p>Hemos agregado los siguientes productos a tu reserva. Los tendremos listos para tu viaje:</p>
                
                <table class="productos-table">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 12px; text-align: left;">Producto</th>
                            <th style="padding: 12px; text-align: right;">Precio Unit.</th>
                            <th style="padding: 12px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ' . $productosHTML . '
                    </tbody>
                </table>
                
                <div class="total-box">
                    <p style="margin: 0; font-size: 14px; color: #0369a1;">Total de Productos</p>
                    <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #0c4a6e;">' . formatCLP($totalProductos) . '</p>
                    ' . ($nuevoTotal ? '<p style="margin: 10px 0 0 0; font-size: 14px; color: #0369a1;">Nuevo Total de Reserva: <strong>' . formatCLP($nuevoTotal) . '</strong></p>' : '') . '
                </div>
                
                <p style="margin-top: 30px;">
                    <a href="https://transportesaraucaria.cl/consultar-reserva" class="button">
                        Ver Mi Reserva
                    </a>
                </p>
                
                <p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <strong>Nota:</strong> Los productos serán entregados durante tu viaje. Si tienes alguna preferencia especial, contáctanos.
                </p>
            </div>
            
            <div class="footer">
                <p><strong>Transportes Araucaria</strong></p>
                <p>Transfer y Traslados de Pasajeros</p>
                <p>📞 +56 9 1234 5678 | 📧 contacto@transportesaraucaria.cl</p>
            </div>
        </div>
    </body>
    </html>';

    // Enviar email al pasajero (o solo BCC admin si email pasajero no es válido)
    $mailPasajero->send();

    $respuesta = [
        'success' => true,
        'mensaje' => 'Notificación enviada',
        'emailsPasajero' => count($destinatarios),
        'bccAdmin' => $bccEnviada,
        'sentTo' => $destinatarios,
    ];
    if ($debugMode) {
        $respuesta['smtpDebug'] = $smtpLogs;
    }

    // ========== EMAIL AL CONDUCTOR (si está asignado) ==========
    if ($emailConductor && $nombreConductor) {
        $mailConductor = new PHPMailer(true);

        // Configuración del servidor SMTP
        $mailConductor->isSMTP();
        $mailConductor->Host = SMTP_HOST;
        $mailConductor->SMTPAuth = true;
        $mailConductor->Username = SMTP_USER;
        $mailConductor->Password = SMTP_PASS;
        $mailConductor->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mailConductor->Port = SMTP_PORT;
        $mailConductor->CharSet = 'UTF-8';
        if ($debugMode) {
            $mailConductor->SMTPDebug = 2;
            $mailConductor->Debugoutput = function ($str, $level) use (&$smtpLogs) {
                $line = '[SMTP DEBUG] ' . trim($str);
                $smtpLogs[] = $line;
                error_log($line);
            };
        }

        // Destinatario
        $mailConductor->setFrom(EMAIL_FROM, EMAIL_FROM_NAME);
        $mailConductor->addAddress($emailConductor, $nombreConductor);

        // Contenido del email
        $mailConductor->isHTML(true);
        $mailConductor->Subject = '📦 Productos agregados - Reserva ' . $codigoReserva;

        $mailConductor->Body = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; }
                .productos-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; }
                .info-box { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📦 Productos Agregados</h1>
                    <p style="margin: 0; font-size: 18px;">Reserva ' . htmlspecialchars($codigoReserva) . '</p>
                </div>
                
                <div class="content">
                    <p>Hola <strong>' . htmlspecialchars($nombreConductor) . '</strong>,</p>
                    
                    <p>El pasajero <strong>' . htmlspecialchars($nombrePasajero) . '</strong> ha agregado productos a su reserva:</p>
                    
                    <table class="productos-table">
                        <thead>
                            <tr style="background: #f1f5f9;">
                                <th style="padding: 12px; text-align: left;">Producto</th>
                                <th style="padding: 12px; text-align: right;">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>';

        foreach ($productos as $prod) {
            $mailConductor->Body .= '
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    <strong>' . htmlspecialchars($prod['nombre']) . '</strong>
                                    ' . (isset($prod['notas']) && $prod['notas'] ? '<br><small style="color: #666; font-style: italic;">Nota: ' . htmlspecialchars($prod['notas']) . '</small>' : '') . '
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                                    ' . $prod['cantidad'] . '
                                </td>
                            </tr>';
        }

        $mailConductor->Body .= '
                        </tbody>
                    </table>
                    
                    <div class="info-box">
                        <p style="margin: 0; font-size: 14px;"><strong>📋 Instrucciones:</strong></p>
                        <p style="margin: 10px 0 0 0;">Por favor, asegúrate de tener estos productos preparados antes del viaje. Si hay notas especiales, síguelas cuidadosamente.</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>Transportes Araucaria</strong></p>
                    <p>Sistema de Gestión de Reservas</p>
                </div>
            </div>
        </body>
        </html>';

        // Enviar email al conductor
        $mailConductor->send();

        $respuesta['emailsConductor'] = 1;
        $respuesta['mensaje'] = 'Notificaciones enviadas';
        if ($debugMode) {
            $respuesta['smtpDebug'] = $smtpLogs;
        }
    }

    // Respuesta exitosa
    echo json_encode($respuesta);
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
