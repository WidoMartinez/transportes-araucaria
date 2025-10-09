<?php
// config_reservas.php
// Archivo de configuración para el sistema de reservas

// === CONFIGURACIÓN GENERAL ===
define('RESERVAS_FILE', 'reservas_data.json');
define('BACKUP_DIR', 'backups/');
define('MAX_RESERVAS', 1000); // Máximo número de reservas en el archivo principal
define('BACKUP_FREQUENCY', 10); // Crear backup cada X reservas

// === CONFIGURACIÓN DE EXCEL ===
define('EXCEL_FILENAME_PREFIX', 'reservas_transportes_araucaria_');
define('EXCEL_SEPARATOR', ';'); // Separador para CSV (';' funciona mejor con Excel en español)
define('EXCEL_ENCODING', 'UTF-8'); // Codificación del archivo

// === CONFIGURACIÓN DE SEGURIDAD ===
$ALLOWED_ORIGINS = [
    'https://www.transportesaraucaria.cl',
    'https://transportesaraucaria.cl',
    'http://localhost:5173',
    'http://localhost:3000'
];

// === CONFIGURACIÓN DE EMAIL ===
$EMAIL_CONFIG = [
    'host' => getenv('EMAIL_HOST') ?: 'smtp.hostinger.com',
    'port' => getenv('EMAIL_PORT') ?: 465,
    'username' => getenv('EMAIL_USER') ?: 'contacto@transportesaraucaria.cl',
    'password' => getenv('EMAIL_PASS') ?: 'TransportesAraucaria7.',
    'to' => getenv('EMAIL_TO') ?: 'widomartinez@gmail.com',
    'from_name' => 'Sistema de Reservas - Transportes Araucania'
];

// === CONFIGURACIÓN DE CAMPOS EXCEL ===
$EXCEL_HEADERS = [
    'ID' => 'id',
    'Fecha Registro' => 'fecha_registro',
    'Nombre' => 'nombre',
    'Email' => 'email',
    'Teléfono' => 'telefono',
    'Origen' => 'origen',
    'Destino' => 'destino',
    'Fecha Viaje' => 'fecha',
    'Hora' => 'hora',
    'Pasajeros' => 'pasajeros',
    'Precio (CLP)' => 'precio',
    'Vehículo' => 'vehiculo',
    'Número Vuelo' => 'numeroVuelo',
    'Hotel' => 'hotel',
    'Equipaje Especial' => 'equipajeEspecial',
    'Silla Infantil' => 'sillaInfantil',
    'Ida y Vuelta' => 'idaVuelta',
    'Fecha Regreso' => 'fechaRegreso',
    'Hora Regreso' => 'horaRegreso',
    'Mensaje' => 'mensaje',
    'Fuente' => 'source',
    'Abono Sugerido' => 'abonoSugerido',
    'Saldo Pendiente' => 'saldoPendiente',
    'IP Address' => 'ip_address',
    'Navegador' => 'user_agent'
];

// === CONFIGURACIÓN DE DESTINOS POPULARES ===
$DESTINOS_PRINCIPALES = [
    'Pucón',
    'Villarrica',
    'Lonquimay',
    'Corralco',
    'Temuco',
    'Aeropuerto La Araucanía'
];

// === CONFIGURACIÓN DE VEHÍCULOS ===
$TIPOS_VEHICULOS = [
    'Sedan' => ['capacidad' => 4, 'equipaje' => 'Estándar'],
    'SUV' => ['capacidad' => 7, 'equipaje' => 'Extra'],
    'Van' => ['capacidad' => 12, 'equipaje' => 'Múltiple'],
    'Minibus' => ['capacidad' => 20, 'equipaje' => 'Comercial']
];

// === CONFIGURACIÓN DE MENSAJES ===
$MENSAJES = [
    'reserva_guardada' => '✅ Reserva guardada correctamente en el sistema',
    'reserva_error' => '❌ Error al guardar la reserva en el sistema',
    'email_enviado' => '📧 Correo de notificación enviado correctamente',
    'email_error' => '📧 Error al enviar correo de notificación',
    'backup_creado' => '💾 Backup automático creado',
    'excel_generado' => '📊 Archivo Excel generado correctamente'
];

// === CONFIGURACIÓN DE ZONA HORARIA ===
date_default_timezone_set('America/Santiago');

// === FUNCIONES DE UTILIDAD ===

/**
 * Obtener configuración de CORS
 */
function getCorsConfig() {
    global $ALLOWED_ORIGINS;
    return $ALLOWED_ORIGINS;
}

/**
 * Obtener configuración de email
 */
function getEmailConfig() {
    global $EMAIL_CONFIG;
    return $EMAIL_CONFIG;
}

/**
 * Obtener headers para Excel
 */
function getExcelHeaders() {
    global $EXCEL_HEADERS;
    return $EXCEL_HEADERS;
}

/**
 * Formatear precio para mostrar
 */
function formatearPrecio($precio) {
    return '$' . number_format($precio, 0, ',', '.') . ' CLP';
}

/**
 * Formatear fecha para mostrar
 */
function formatearFecha($fecha) {
    if (empty($fecha)) return 'Sin fecha';
    
    try {
        $dt = new DateTime($fecha);
        return $dt->format('d/m/Y H:i');
    } catch (Exception $e) {
        return $fecha;
    }
}

/**
 * Validar email
 */
function validarEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validar teléfono chileno
 */
function validarTelefonoChileno($telefono) {
    // Patrón básico para teléfonos chilenos
    $patron = '/^(\+56)?[2-9]\d{8}$/';
    $telefonoLimpio = preg_replace('/[\s\-\(\)]/', '', $telefono);
    return preg_match($patron, $telefonoLimpio);
}

/**
 * Obtener estadísticas básicas de un array de reservas
 */
function calcularEstadisticas($reservas) {
    $stats = [
        'total' => count($reservas),
        'hoy' => 0,
        'mes_actual' => 0,
        'ingresos_total' => 0,
        'destinos_populares' => [],
        'vehiculos_usados' => [],
        'fuentes_reserva' => []
    ];
    
    $hoy = date('Y-m-d');
    $mesActual = date('Y-m');
    
    foreach ($reservas as $reserva) {
        // Conteo por fecha
        $fechaReserva = date('Y-m-d', strtotime($reserva['fecha_registro'] ?? ''));
        $mesReserva = date('Y-m', strtotime($reserva['fecha_registro'] ?? ''));
        
        if ($fechaReserva === $hoy) {
            $stats['hoy']++;
        }
        
        if ($mesReserva === $mesActual) {
            $stats['mes_actual']++;
        }
        
        // Ingresos
        $stats['ingresos_total'] += $reserva['precio'] ?? 0;
        
        // Destinos populares
        $destino = $reserva['destino'] ?? 'Sin especificar';
        $stats['destinos_populares'][$destino] = ($stats['destinos_populares'][$destino] ?? 0) + 1;
        
        // Vehículos
        $vehiculo = $reserva['vehiculo'] ?? 'Sin especificar';
        $stats['vehiculos_usados'][$vehiculo] = ($stats['vehiculos_usados'][$vehiculo] ?? 0) + 1;
        
        // Fuentes
        $fuente = $reserva['source'] ?? 'Sin especificar';
        $stats['fuentes_reserva'][$fuente] = ($stats['fuentes_reserva'][$fuente] ?? 0) + 1;
    }
    
    // Ordenar arrays por popularidad
    arsort($stats['destinos_populares']);
    arsort($stats['vehiculos_usados']);
    arsort($stats['fuentes_reserva']);
    
    // Mantener solo los top 5
    $stats['destinos_populares'] = array_slice($stats['destinos_populares'], 0, 5, true);
    $stats['vehiculos_usados'] = array_slice($stats['vehiculos_usados'], 0, 5, true);
    $stats['fuentes_reserva'] = array_slice($stats['fuentes_reserva'], 0, 5, true);
    
    return $stats;
}

/**
 * Log de actividad
 */
function logActividad($mensaje, $tipo = 'INFO') {
    $logFile = 'reservas_activity.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    $logEntry = "[{$timestamp}] [{$tipo}] [{$ip}] {$mensaje}" . PHP_EOL;
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// === CONFIGURACIÓN AVANZADA ===

// Configuración para desarrollo/producción
$IS_DEVELOPMENT = (strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false);

if ($IS_DEVELOPMENT) {
    // Configuración para desarrollo
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    // Configuración para producción
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}

// Configuración de límites PHP
ini_set('max_execution_time', 300); // 5 minutos para operaciones de Excel grandes
ini_set('memory_limit', '256M'); // Memoria suficiente para procesar archivos grandes

?>
