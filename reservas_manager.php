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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #003366, #0066cc);
            color: white;
            padding: 30px 0;
            text-align: center;
            margin-bottom: 30px;
            border-radius: 10px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 10px;
        }
        
        .actions {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .action-group {
            margin-bottom: 25px;
        }
        
        .action-group h3 {
            margin-bottom: 15px;
            color: #003366;
        }
        
        .form-row {
            display: flex;
            gap: 15px;
            align-items: end;
            flex-wrap: wrap;
        }
        
        .form-group {
            flex: 1;
            min-width: 200px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #555;
        }
        
        input[type="date"], select {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        
        .btn {
            background: #0066cc;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            text-decoration: none;
            display: inline-block;
            transition: background-color 0.3s;
        }
        
        .btn:hover {
            background: #0052a3;
        }
        
        .btn-success {
            background: #28a745;
        }
        
        .btn-success:hover {
            background: #218838;
        }
        
        .btn-danger {
            background: #dc3545;
        }
        
        .btn-danger:hover {
            background: #c82333;
        }
        
        .recent-reservas {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .table-container {
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        
        tr:hover {
            background-color: #f5f5f5;
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status-nueva {
            background-color: #e3f2fd;
            color: #1976d2;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        
        @media (max-width: 768px) {
            .form-row {
                flex-direction: column;
            }
            
            .form-group {
                min-width: auto;
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
