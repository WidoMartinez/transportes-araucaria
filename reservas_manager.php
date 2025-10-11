<?php
// reservas_manager.php
// Sistema para gestionar y exportar reservas a Excel

// Habilitar la visualización de errores para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuración de CORS
$allowed_origins = [
    'https://www.transportesaraucaria.cl',
    'http://localhost:5173'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Configuración de archivos
$reservasFile = 'reservas_data.json';
$backupDir = 'backups/';

// Crear directorio de backups si no existe
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

/**
 * Función para leer reservas desde el archivo JSON
 */
function leerReservas($archivo) {
    if (!file_exists($archivo)) {
        return [];
    }
    
    $contenido = file_get_contents($archivo);
    $datos = json_decode($contenido, true);
    
    return is_array($datos) ? $datos : [];
}

/**
 * Función para guardar una nueva reserva
 */
function guardarReserva($archivo, $reserva) {
    $reservas = leerReservas($archivo);
    
    // Agregar timestamp y ID único
    $reserva['id'] = uniqid('RES_', true);
    $reserva['timestamp'] = date('Y-m-d H:i:s');
    $reserva['fecha_registro'] = date('Y-m-d H:i:s');
    
    // Agregar la nueva reserva al inicio del array
    array_unshift($reservas, $reserva);
    
    // Guardar en archivo
    $resultado = file_put_contents($archivo, json_encode($reservas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    // Crear backup cada 10 reservas
    if (count($reservas) % 10 === 0) {
        crearBackup($archivo);
    }
    
    return $resultado !== false;
}

/**
 * Función para crear backup
 */
function crearBackup($archivo) {
    global $backupDir;
    $fechaBackup = date('Y-m-d_H-i-s');
    $archivoBackup = $backupDir . "reservas_backup_{$fechaBackup}.json";
    
    if (file_exists($archivo)) {
        copy($archivo, $archivoBackup);
    }
}

/**
 * Función para borrar reservas recientes
 */
function borrarReservasRecientes($archivo, $dias = 7) {
    $reservas = leerReservas($archivo);
    
    if (empty($reservas)) {
        return ['success' => true, 'message' => 'No hay reservas para borrar', 'eliminadas' => 0];
    }
    
    // Crear backup antes de borrar
    crearBackup($archivo);
    
    $fechaLimite = date('Y-m-d H:i:s', strtotime("-{$dias} days"));
    $reservasOriginales = count($reservas);
    
    // Filtrar reservas que NO sean recientes (mantener las antiguas)
    $reservasFiltradas = array_filter($reservas, function($reserva) use ($fechaLimite) {
        return isset($reserva['timestamp']) && $reserva['timestamp'] < $fechaLimite;
    });
    
    $eliminadas = $reservasOriginales - count($reservasFiltradas);
    
    // Guardar las reservas filtradas
    $resultado = file_put_contents($archivo, json_encode(array_values($reservasFiltradas), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($resultado !== false) {
        return [
            'success' => true, 
            'message' => "Se eliminaron {$eliminadas} reservas recientes (últimos {$dias} días)",
            'eliminadas' => $eliminadas,
            'restantes' => count($reservasFiltradas)
        ];
    } else {
        return ['success' => false, 'message' => 'Error al guardar los cambios'];
    }
}

/**
 * Función para generar archivo Excel
 */
function generarExcel($reservas) {
    // Crear contenido CSV que Excel puede abrir
    $output = fopen('php://temp', 'r+');
    
    // BOM para UTF-8
    fwrite($output, "\xEF\xBB\xBF");
    
    // Encabezados
    $headers = [
        'ID',
        'Fecha Registro',
        'Nombre',
        'Email',
        'Teléfono',
        'Origen',
        'Destino',
        'Otro Origen',
        'Otro Destino',
        'Fecha Viaje',
        'Hora',
        'Pasajeros',
        'Precio (CLP)',
        'Total con Descuento (CLP)',
        'Vehículo',
        'Número Vuelo',
        'Hotel',
        'Equipaje Especial',
        'Silla Infantil',
        'Ida y Vuelta',
        'Fecha Regreso',
        'Hora Regreso',
        'Mensaje',
        'Fuente',
        'Abono Sugerido',
        'Saldo Pendiente',
        'Descuento Base',
        'Descuento Promoción',
        'Descuento RoundTrip',
        'Descuento Online',
        'Descuentos Personalizados',
        'IP Address',
        'User Agent',
        'Estado Pago',
        'Pago Monto',
        'Pago ID',
        'Pago Gateway',
        'Correo Admin Enviado',
        'Correo Cliente Enviado'
    ];
    
    fputcsv($output, $headers, ';');
    
    // Datos
    foreach ($reservas as $reserva) {
        $fila = [
            $reserva['id'] ?? '',
            $reserva['fecha_registro'] ?? '',
            $reserva['nombre'] ?? '',
            $reserva['email'] ?? '',
            $reserva['telefono'] ?? '',
            $reserva['origen'] ?? '',
            $reserva['destino'] ?? '',
            $reserva['otroOrigen'] ?? '',
            $reserva['otroDestino'] ?? '',
            $reserva['fecha'] ?? '',
            $reserva['hora'] ?? '',
            $reserva['pasajeros'] ?? '',
            number_format($reserva['precio'] ?? 0, 0, ',', '.'),
            number_format($reserva['totalConDescuento'] ?? 0, 0, ',', '.'),
            $reserva['vehiculo'] ?? '',
            $reserva['numeroVuelo'] ?? '',
            $reserva['hotel'] ?? '',
            $reserva['equipajeEspecial'] ?? '',
            $reserva['sillaInfantil'] ?? 'no',
            ($reserva['idaVuelta'] ?? false) ? 'Sí' : 'No',
            $reserva['fechaRegreso'] ?? '',
            $reserva['horaRegreso'] ?? '',
            $reserva['mensaje'] ?? '',
            $reserva['source'] ?? '',
            number_format($reserva['abonoSugerido'] ?? 0, 0, ',', '.'),
            number_format($reserva['saldoPendiente'] ?? 0, 0, ',', '.'),
            $reserva['descuentoBase'] ?? 0,
            $reserva['descuentoPromocion'] ?? 0,
            $reserva['descuentoRoundTrip'] ?? 0,
            $reserva['descuentoOnline'] ?? 0,
            (is_array($reserva['descuentosPersonalizados'] ?? null) ? implode('|', array_map(function($d){
                if (is_array($d)) { return ($d['id'] ?? '').':'.($d['valor'] ?? ''); }
                return (string)$d;
            }, $reserva['descuentosPersonalizados'])) : ''),
            $reserva['ip_address'] ?? '',
            $reserva['user_agent'] ?? '',
            $reserva['estado_pago'] ?? '',
            number_format($reserva['pago_monto'] ?? 0, 0, ',', '.'),
            $reserva['pago_id'] ?? '',
            $reserva['pago_gateway'] ?? '',
            ($reserva['correo_admin_enviado'] ?? false) ? 'Sí' : 'No',
            ($reserva['correo_cliente_enviado'] ?? false) ? 'Sí' : 'No'
        ];
        
        fputcsv($output, $fila, ';');
    }
    
    rewind($output);
    $csv_content = stream_get_contents($output);
    fclose($output);
    
    return $csv_content;
}

/**
 * Función para filtrar reservas por fecha
 */
function filtrarReservasPorFecha($reservas, $fechaInicio = null, $fechaFin = null) {
    if (!$fechaInicio && !$fechaFin) {
        return $reservas;
    }
    
    return array_filter($reservas, function($reserva) use ($fechaInicio, $fechaFin) {
        $fechaReserva = $reserva['fecha_registro'] ?? '';
        if (empty($fechaReserva)) return false;
        
        $fecha = date('Y-m-d', strtotime($fechaReserva));
        
        if ($fechaInicio && $fecha < $fechaInicio) return false;
        if ($fechaFin && $fecha > $fechaFin) return false;
        
        return true;
    });
}

// Procesar solicitudes
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Guardar nueva reserva
    header('Content-Type: application/json');
    
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
        exit;
    }
    
    if (guardarReserva($reservasFile, $data)) {
        echo json_encode(['success' => true, 'message' => 'Reserva guardada correctamente']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al guardar la reserva']);
    }
    
} elseif ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'download') {
        // Descargar Excel
        $reservas = leerReservas($reservasFile);
        
        // Filtrar por fechas si se especifican
        $fechaInicio = $_GET['fecha_inicio'] ?? null;
        $fechaFin = $_GET['fecha_fin'] ?? null;
        
        if ($fechaInicio || $fechaFin) {
            $reservas = filtrarReservasPorFecha($reservas, $fechaInicio, $fechaFin);
        }
        
        $excel_content = generarExcel($reservas);
        
        $filename = 'reservas_transportes_araucaria_' . date('Y-m-d_H-i-s') . '.csv';
        
        header('Content-Type: application/vnd.ms-excel; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');
        
        echo $excel_content;
        
    } elseif ($action === 'delete_recent') {
        // Borrar reservas recientes
        $dias = $_GET['dias'] ?? 7;
        $resultado = borrarReservasRecientes($reservasFile, $dias);
        
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($resultado);
        exit;
        
    } elseif ($action === 'list') {
        // Listar reservas (JSON)
        header('Content-Type: application/json');
        
        $reservas = leerReservas($reservasFile);
        
        // Filtrar por fechas si se especifican
        $fechaInicio = $_GET['fecha_inicio'] ?? null;
        $fechaFin = $_GET['fecha_fin'] ?? null;
        $limit = intval($_GET['limit'] ?? 50);
        
        if ($fechaInicio || $fechaFin) {
            $reservas = filtrarReservasPorFecha($reservas, $fechaInicio, $fechaFin);
        }
        
        // Limitar resultados
        $reservas = array_slice($reservas, 0, $limit);
        
        echo json_encode([
            'success' => true,
            'total' => count($reservas),
            'reservas' => $reservas
        ]);
        
    } elseif ($action === 'stats') {
        // Estadísticas básicas
        header('Content-Type: application/json');
        
        $reservas = leerReservas($reservasFile);
        
        $stats = [
            'total_reservas' => count($reservas),
            'reservas_hoy' => 0,
            'reservas_mes' => 0,
            'ingresos_estimados' => 0,
            'destinos_populares' => []
        ];
        
        $hoy = date('Y-m-d');
        $mesActual = date('Y-m');
        $destinosCount = [];
        
        foreach ($reservas as $reserva) {
            $fechaReserva = date('Y-m-d', strtotime($reserva['fecha_registro'] ?? ''));
            $mesReserva = date('Y-m', strtotime($reserva['fecha_registro'] ?? ''));
            
            if ($fechaReserva === $hoy) {
                $stats['reservas_hoy']++;
            }
            
            if ($mesReserva === $mesActual) {
                $stats['reservas_mes']++;
            }
            
            $stats['ingresos_estimados'] += $reserva['precio'] ?? 0;
            
            $destino = $reserva['destino'] ?? 'Sin especificar';
            $destinosCount[$destino] = ($destinosCount[$destino] ?? 0) + 1;
        }
        
        arsort($destinosCount);
        $stats['destinos_populares'] = array_slice($destinosCount, 0, 5, true);
        
        echo json_encode(['success' => true, 'stats' => $stats]);
        
    } else {
        // Mostrar interfaz de administración
        mostrarInterfazAdmin();
    }
}

/**
 * Interfaz de administración simple
 */
function mostrarInterfazAdmin() {
    ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Reservas - Transportes Araucaria</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
            color: #2c3e50;
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            margin-bottom: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            animation: slideDown 0.6s ease-out;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 600;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.95;
            font-weight: 300;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(0,0,0,0.05);
            animation: fadeInUp 0.6s ease-out;
            animation-fill-mode: both;
        }
        
        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
            line-height: 1.2;
        }
        
        .stat-card > div:last-child {
            font-size: 0.95rem;
            color: #6b7280;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .actions {
            background: white;
            padding: 35px;
            border-radius: 16px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            margin-bottom: 30px;
            border: 1px solid rgba(0,0,0,0.05);
            animation: fadeInUp 0.6s ease-out 0.5s;
            animation-fill-mode: both;
        }
        
        .action-group {
            margin-bottom: 30px;
            padding-bottom: 30px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .action-group:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .action-group h3 {
            margin-bottom: 20px;
            color: #1f2937;
            font-size: 1.3rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .form-row {
            display: flex;
            gap: 15px;
            align-items: end;
            flex-wrap: wrap;
        }
        
        .form-group {
            flex: 1;
            min-width: 220px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #374151;
            font-size: 0.9rem;
        }
        
        input[type="date"], select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            font-size: 15px;
            transition: all 0.3s ease;
            background: white;
            color: #1f2937;
        }
        
        input[type="date"]:focus, select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 28px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 500;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
        }
        
        .btn-success:hover {
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
        }
        
        .btn-danger:hover {
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }
        
        .recent-reservas {
            background: white;
            padding: 35px;
            border-radius: 16px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.05);
            animation: fadeInUp 0.6s ease-out 0.6s;
            animation-fill-mode: both;
        }
        
        .recent-reservas h3 {
            color: #1f2937;
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .table-container {
            overflow-x: auto;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
        }
        
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
        }
        
        th, td {
            padding: 16px 20px;
            text-align: left;
        }
        
        th {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            font-weight: 600;
            color: #374151;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        th:first-child {
            border-top-left-radius: 12px;
        }
        
        th:last-child {
            border-top-right-radius: 12px;
        }
        
        td {
            border-bottom: 1px solid #f3f4f6;
            color: #4b5563;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        tr:hover td {
            background-color: #f9fafb;
        }
        
        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            display: inline-block;
        }
        
        .status-nueva {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
        }
        
        .loading {
            text-align: center;
            padding: 40px 20px;
            color: #6b7280;
            font-size: 1rem;
        }
        
        small {
            color: #6b7280;
            font-size: 0.85rem;
            line-height: 1.5;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px 15px;
            }
            
            .header {
                padding: 30px 20px;
                border-radius: 16px;
            }
            
            .header h1 {
                font-size: 1.8rem;
            }
            
            .header p {
                font-size: 1rem;
            }
            
            .stats-grid {
                gap: 15px;
            }
            
            .stat-card {
                padding: 25px 20px;
            }
            
            .stat-number {
                font-size: 2.5rem;
            }
            
            .actions, .recent-reservas {
                padding: 25px 20px;
            }
            
            .form-row {
                flex-direction: column;
            }
            
            .form-group {
                min-width: auto;
                width: 100%;
            }
            
            .btn {
                width: 100%;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Gestión de Reservas</h1>
            <p>Transportes Araucania - Panel de Administración</p>
        </div>
        
        <div class="stats-grid" id="statsGrid">
            <div class="stat-card">
                <div class="stat-number" id="totalReservas">-</div>
                <div>Total Reservas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="reservasHoy">-</div>
                <div>Reservas Hoy</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="reservasMes">-</div>
                <div>Reservas Este Mes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="ingresosEstimados">-</div>
                <div>Ingresos Estimados</div>
            </div>
        </div>
        
        <div class="actions">
            <div class="action-group">
                <h3>Descargar Reservas en Excel</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="fechaInicio">Fecha Inicio (opcional):</label>
                        <input type="date" id="fechaInicio">
                    </div>
                    <div class="form-group">
                        <label for="fechaFin">Fecha Fin (opcional):</label>
                        <input type="date" id="fechaFin">
                    </div>
                    <div class="form-group">
                        <button class="btn btn-success" onclick="descargarExcel()">
                            📊 Descargar Excel
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="action-group">
                <h3>Acciones Rápidas</h3>
                <div class="form-row">
                    <a href="?action=download" class="btn">📥 Descargar Todas las Reservas</a>
                    <button class="btn" onclick="actualizarEstadisticas()">🔄 Actualizar Estadísticas</button>
                </div>
                <div class="form-row">
                    <button class="btn btn-danger" onclick="borrarReservasRecientes()">🗑️ Borrar Reservas Recientes</button>
                    <select id="diasBorrar" class="form-control" style="width: auto; display: inline-block;">
                        <option value="1">Último día</option>
                        <option value="3">Últimos 3 días</option>
                        <option value="7" selected>Últimos 7 días</option>
                        <option value="15">Últimos 15 días</option>
                        <option value="30">Últimos 30 días</option>
                    </select>
                </div>
                <div class="form-row" style="margin-top: 10px;">
                    <small style="color: #666; font-style: italic;">
                        ⚠️ Esta acción eliminará permanentemente las reservas seleccionadas. 
                        Se creará un backup automático antes de proceder.
                    </small>
                </div>
            </div>
        </div>
        
        <div class="recent-reservas">
            <h3>Reservas Recientes</h3>
            <div class="table-container">
                <div id="loadingReservas" class="loading">Cargando reservas...</div>
                <table id="reservasTable" style="display: none;">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Destino</th>
                            <th>Fecha Viaje</th>
                            <th>Precio</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody id="reservasBody">
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script>
        // Cargar estadísticas
        async function cargarEstadisticas() {
            try {
                const response = await fetch('?action=stats');
                const data = await response.json();
                
                if (data.success) {
                    const stats = data.stats;
                    document.getElementById('totalReservas').textContent = stats.total_reservas.toLocaleString();
                    document.getElementById('reservasHoy').textContent = stats.reservas_hoy;
                    document.getElementById('reservasMes').textContent = stats.reservas_mes;
                    document.getElementById('ingresosEstimados').textContent = 
                        '$' + stats.ingresos_estimados.toLocaleString() + ' CLP';
                }
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            }
        }
        
        // Cargar reservas recientes
        async function cargarReservasRecientes() {
            try {
                const response = await fetch('?action=list&limit=10');
                const data = await response.json();
                
                if (data.success) {
                    const tbody = document.getElementById('reservasBody');
                    tbody.innerHTML = '';
                    
                    data.reservas.forEach(reserva => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${new Date(reserva.fecha_registro).toLocaleDateString()}</td>
                            <td>${reserva.nombre || 'Sin nombre'}</td>
                            <td>${reserva.email || 'Sin email'}</td>
                            <td>${reserva.destino || 'Sin destino'}</td>
                            <td>${reserva.fecha || 'Sin fecha'}</td>
                            <td>$${(reserva.precio || 0).toLocaleString()} CLP</td>
                            <td><span class="status-badge status-nueva">Nueva</span></td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    document.getElementById('loadingReservas').style.display = 'none';
                    document.getElementById('reservasTable').style.display = 'table';
                }
            } catch (error) {
                console.error('Error al cargar reservas:', error);
                document.getElementById('loadingReservas').textContent = 'Error al cargar las reservas';
            }
        }
        
        // Descargar Excel con filtros
        function descargarExcel() {
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;
            
            let url = '?action=download';
            const params = [];
            
            if (fechaInicio) params.push(`fecha_inicio=${fechaInicio}`);
            if (fechaFin) params.push(`fecha_fin=${fechaFin}`);
            
            if (params.length > 0) {
                url += '&' + params.join('&');
            }
            
            window.location.href = url;
        }
        
        // Actualizar estadísticas
        function actualizarEstadisticas() {
            cargarEstadisticas();
            cargarReservasRecientes();
        }
        
        // Borrar reservas recientes
        async function borrarReservasRecientes() {
            const dias = document.getElementById('diasBorrar').value;
            const confirmacion = confirm(`¿Estás seguro de borrar las reservas de los últimos ${dias} días?\n\nEsta acción creará un backup automático pero no se puede deshacer.`);
            
            if (!confirmacion) {
                return;
            }
            
            try {
                const response = await fetch(`?action=delete_recent&dias=${dias}`);
                const data = await response.json();
                
                if (data.success) {
                    alert(`✅ ${data.message}\n\nReservas eliminadas: ${data.eliminadas}\nReservas restantes: ${data.restantes}`);
                    // Recargar las estadísticas y reservas
                    cargarEstadisticas();
                    cargarReservasRecientes();
                } else {
                    alert(`❌ Error: ${data.message}`);
                }
            } catch (error) {
                console.error('Error al borrar reservas:', error);
                alert('❌ Error al conectar con el servidor');
            }
        }
        
        // Cargar datos al inicio
        document.addEventListener('DOMContentLoaded', function() {
            cargarEstadisticas();
            cargarReservasRecientes();
        });
    </script>
</body>
</html>
    <?php
}
?>
