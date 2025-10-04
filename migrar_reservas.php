<?php
// migrar_reservas.php
// Herramienta para migrar reservas existentes o importar desde otros formatos

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuración
$reservasFile = 'reservas_data.json';
$backupFile = 'reservas_backup_migracion_' . date('Y-m-d_H-i-s') . '.json';

/**
 * Función para crear reserva de ejemplo (para testing)
 */
function crearReservasEjemplo() {
    $ejemplos = [
        [
            'nombre' => 'Juan Pérez',
            'email' => 'juan.perez@email.com',
            'telefono' => '+56912345678',
            'origen' => 'Aeropuerto La Araucanía',
            'destino' => 'Pucón',
            'fecha' => '2024-12-15',
            'hora' => '14:30',
            'pasajeros' => '2',
            'precio' => 45000,
            'vehiculo' => 'Sedan',
            'source' => 'Formulario Web',
            'mensaje' => 'Llegada de vuelo desde Santiago',
            'numeroVuelo' => 'LA1234',
            'hotel' => 'Hotel Antumalal',
            'equipajeEspecial' => '',
            'sillaInfantil' => 'no',
            'idaVuelta' => false,
            'fechaRegreso' => '',
            'horaRegreso' => '',
            'abonoSugerido' => 22500,
            'saldoPendiente' => 22500
        ],
        [
            'nombre' => 'María González',
            'email' => 'maria.gonzalez@email.com',
            'telefono' => '+56987654321',
            'origen' => 'Temuco Centro',
            'destino' => 'Villarrica',
            'fecha' => '2024-12-16',
            'hora' => '09:00',
            'pasajeros' => '4',
            'precio' => 35000,
            'vehiculo' => 'SUV',
            'source' => 'Reserva Telefónica',
            'mensaje' => 'Viaje familiar para vacaciones',
            'numeroVuelo' => '',
            'hotel' => 'Hotel Villarrica',
            'equipajeEspecial' => '2 maletas grandes',
            'sillaInfantil' => 'si',
            'idaVuelta' => true,
            'fechaRegreso' => '2024-12-20',
            'horaRegreso' => '16:00',
            'abonoSugerido' => 35000,
            'saldoPendiente' => 35000
        ],
        [
            'nombre' => 'Carlos Rodríguez',
            'email' => 'carlos.rodriguez@email.com',
            'telefono' => '+56956789123',
            'origen' => 'Aeropuerto La Araucanía',
            'destino' => 'Lonquimay',
            'fecha' => '2024-12-17',
            'hora' => '11:15',
            'pasajeros' => '1',
            'precio' => 65000,
            'vehiculo' => 'Sedan',
            'source' => 'WhatsApp',
            'mensaje' => 'Viaje de negocios urgente',
            'numeroVuelo' => 'JA5678',
            'hotel' => '',
            'equipajeEspecial' => 'Equipos de trabajo',
            'sillaInfantil' => 'no',
            'idaVuelta' => false,
            'fechaRegreso' => '',
            'horaRegreso' => '',
            'abonoSugerido' => 32500,
            'saldoPendiente' => 32500
        ]
    ];

    return $ejemplos;
}

/**
 * Función para guardar reservas con metadatos
 */
function guardarReservas($archivo, $reservas) {
    $reservasConMetadatos = [];
    
    foreach ($reservas as $index => $reserva) {
        // Agregar metadatos si no existen
        if (!isset($reserva['id'])) {
            $reserva['id'] = uniqid('RES_', true);
        }
        if (!isset($reserva['timestamp'])) {
            $reserva['timestamp'] = date('Y-m-d H:i:s', strtotime('-' . $index . ' hours'));
        }
        if (!isset($reserva['fecha_registro'])) {
            $reserva['fecha_registro'] = $reserva['timestamp'];
        }
        if (!isset($reserva['ip_address'])) {
            $reserva['ip_address'] = 'Migración';
        }
        if (!isset($reserva['user_agent'])) {
            $reserva['user_agent'] = 'Sistema de Migración';
        }
        
        $reservasConMetadatos[] = $reserva;
    }
    
    return file_put_contents($archivo, json_encode($reservasConMetadatos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Procesamiento de la solicitud
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'upload') {
    // Subir archivo CSV/Excel para migrar
    header('Content-Type: application/json');
    
    if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'Error al subir archivo']);
        exit;
    }
    
    $archivo = $_FILES['archivo']['tmp_name'];
    $extension = pathinfo($_FILES['archivo']['name'], PATHINFO_EXTENSION);
    
    if (!in_array(strtolower($extension), ['csv', 'txt'])) {
        echo json_encode(['success' => false, 'message' => 'Solo se permiten archivos CSV']);
        exit;
    }
    
    // Leer archivo CSV
    $reservas = [];
    if (($handle = fopen($archivo, "r")) !== FALSE) {
        $headers = fgetcsv($handle, 1000, ","); // Primera línea como headers
        
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            $reserva = [];
            foreach ($headers as $index => $header) {
                $reserva[trim($header)] = $data[$index] ?? '';
            }
            $reservas[] = $reserva;
        }
        fclose($handle);
    }
    
    if (count($reservas) > 0) {
        // Crear backup antes de migrar
        if (file_exists($reservasFile)) {
            copy($reservasFile, $backupFile);
        }
        
        if (guardarReservas($reservasFile, $reservas)) {
            echo json_encode([
                'success' => true, 
                'message' => count($reservas) . ' reservas migradas correctamente',
                'backup' => $backupFile
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al guardar reservas']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'No se encontraron datos válidos']);
    }
    
} elseif ($method === 'POST' && $action === 'ejemplos') {
    // Crear reservas de ejemplo
    header('Content-Type: application/json');
    
    $ejemplos = crearReservasEjemplo();
    
    // Crear backup si existe archivo
    if (file_exists($reservasFile)) {
        copy($reservasFile, $backupFile);
    }
    
    if (guardarReservas($reservasFile, $ejemplos)) {
        echo json_encode([
            'success' => true, 
            'message' => count($ejemplos) . ' reservas de ejemplo creadas',
            'backup' => file_exists($backupFile) ? $backupFile : null
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al crear ejemplos']);
    }
    
} else {
    // Mostrar interfaz de migración
    ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Migración de Reservas - Transportes Araucania</title>
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
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #003366, #0066cc);
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
            border-radius: 10px;
        }
        
        .card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        input[type="file"] {
            width: 100%;
            padding: 12px;
            border: 2px dashed #ddd;
            border-radius: 8px;
            background-color: #fafafa;
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
            margin-right: 10px;
            margin-bottom: 10px;
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
        
        .btn-warning {
            background: #ffc107;
            color: #212529;
        }
        
        .btn-warning:hover {
            background: #e0a800;
        }
        
        .alert {
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            display: none;
        }
        
        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .info-box {
            background-color: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .csv-example {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 15px;
            font-family: monospace;
            font-size: 12px;
            overflow-x: auto;
            white-space: pre;
        }
        
        .actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Migración de Reservas</h1>
            <p>Importa reservas existentes o crea datos de ejemplo</p>
        </div>
        
        <div id="alertContainer"></div>
        
        <div class="card">
            <h2>📊 Crear Reservas de Ejemplo</h2>
            <p>Si quieres probar el sistema, puedes crear algunas reservas de ejemplo.</p>
            <div class="info-box">
                <strong>Incluye:</strong> 3 reservas de ejemplo con diferentes tipos de viaje, datos completos y variedad de servicios.
            </div>
            <button class="btn btn-warning" onclick="crearEjemplos()">
                ✨ Crear Reservas de Ejemplo
            </button>
        </div>
        
        <div class="card">
            <h2>📤 Importar desde CSV</h2>
            <p>Sube un archivo CSV con tus reservas existentes. El archivo debe tener encabezados en la primera fila.</p>
            
            <div class="info-box">
                <strong>Formato CSV esperado:</strong>
                <div class="csv-example">nombre,email,telefono,origen,destino,fecha,hora,pasajeros,precio,vehiculo,source
Juan Pérez,juan@email.com,+56912345678,Aeropuerto,Pucón,2024-12-15,14:30,2,45000,Sedan,Web</div>
            </div>
            
            <form id="uploadForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="archivo">Seleccionar archivo CSV:</label>
                    <input type="file" id="archivo" name="archivo" accept=".csv,.txt" required>
                </div>
                <button type="submit" class="btn btn-success">
                    📥 Importar Reservas
                </button>
            </form>
        </div>
        
        <div class="card">
            <h2>🔗 Enlaces Útiles</h2>
            <div class="actions">
                <a href="reservas_manager.php" class="btn">
                    📊 Ver Panel Principal
                </a>
                <a href="reservas_manager.php?action=download" class="btn">
                    📥 Descargar Excel Actual
                </a>
                <a href="reservas_manager.php?action=list" class="btn" target="_blank">
                    📋 Ver JSON de Reservas
                </a>
            </div>
        </div>
        
        <div class="card">
            <h2>⚠️ Importante</h2>
            <ul style="padding-left: 20px;">
                <li>Antes de cualquier migración se crea un backup automático</li>
                <li>Los archivos CSV deben usar comas como separador</li>
                <li>La primera fila debe contener los nombres de las columnas</li>
                <li>Se recomienda probar con pocos datos primero</li>
            </ul>
        </div>
    </div>
    
    <script>
        function mostrarAlerta(mensaje, tipo) {
            const container = document.getElementById('alertContainer');
            const alert = document.createElement('div');
            alert.className = `alert alert-${tipo}`;
            alert.textContent = mensaje;
            alert.style.display = 'block';
            
            container.innerHTML = '';
            container.appendChild(alert);
            
            setTimeout(() => {
                alert.style.display = 'none';
            }, 5000);
        }
        
        async function crearEjemplos() {
            try {
                const response = await fetch('?action=ejemplos', {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    mostrarAlerta(result.message, 'success');
                    if (result.backup) {
                        mostrarAlerta('Backup creado: ' + result.backup, 'success');
                    }
                } else {
                    mostrarAlerta(result.message, 'error');
                }
            } catch (error) {
                mostrarAlerta('Error al crear ejemplos: ' + error.message, 'error');
            }
        }
        
        document.getElementById('uploadForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            const archivo = document.getElementById('archivo').files[0];
            
            if (!archivo) {
                mostrarAlerta('Por favor selecciona un archivo', 'error');
                return;
            }
            
            formData.append('archivo', archivo);
            
            try {
                const response = await fetch('?action=upload', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    mostrarAlerta(result.message, 'success');
                    if (result.backup) {
                        mostrarAlerta('Backup creado: ' + result.backup, 'success');
                    }
                    document.getElementById('uploadForm').reset();
                } else {
                    mostrarAlerta(result.message, 'error');
                }
            } catch (error) {
                mostrarAlerta('Error al subir archivo: ' + error.message, 'error');
            }
        });
    </script>
</body>
</html>
    <?php
}
?>
