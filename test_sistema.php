<?php
// test_sistema.php
// Archivo simple para probar que el sistema funciona en Hostinger

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Sistema Reservas - Transportes Araucania</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f5f5f5;
        }
        .card {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .btn {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin: 5px;
        }
        .btn:hover { background: #0056b3; }
        pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>🔧 Test del Sistema de Reservas</h1>
    
    <div class="card">
        <h2>📍 Información del Servidor</h2>
        <p><strong>Servidor:</strong> <?php echo $_SERVER['SERVER_NAME'] ?? 'Desconocido'; ?></p>
        <p><strong>PHP Version:</strong> <?php echo PHP_VERSION; ?></p>
        <p><strong>Directorio actual:</strong> <?php echo __DIR__; ?></p>
        <p><strong>Fecha/Hora servidor:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
    </div>

    <div class="card">
        <h2>📁 Verificación de Archivos</h2>
        <?php
        $archivos_necesarios = [
            'enviar_correo.php' => 'Archivo original de envío de correos',
            'enviar_correo_mejorado.php' => 'Nuevo archivo con sistema de reservas',
            'reservas_manager.php' => 'Panel de administración de reservas',
            'config_reservas.php' => 'Archivo de configuración',
            'migrar_reservas.php' => 'Herramienta de migración'
        ];
        
        foreach ($archivos_necesarios as $archivo => $descripcion) {
            if (file_exists($archivo)) {
                echo "<p class='success'>✅ {$archivo} - {$descripcion}</p>";
            } else {
                echo "<p class='error'>❌ {$archivo} - {$descripcion} (FALTA)</p>";
            }
        }
        ?>
    </div>

    <div class="card">
        <h2>🔧 Verificación de Permisos</h2>
        <?php
        $directorio_actual = __DIR__;
        if (is_writable($directorio_actual)) {
            echo "<p class='success'>✅ El directorio tiene permisos de escritura</p>";
        } else {
            echo "<p class='error'>❌ El directorio NO tiene permisos de escritura</p>";
            echo "<p class='warning'>⚠️ Necesitas configurar permisos 755 o 775 en este directorio</p>";
        }
        
        // Test de creación de archivo
        $test_file = 'test_permisos.txt';
        if (file_put_contents($test_file, 'test') !== false) {
            echo "<p class='success'>✅ Puede crear archivos correctamente</p>";
            unlink($test_file); // Limpiar archivo de prueba
        } else {
            echo "<p class='error'>❌ NO puede crear archivos</p>";
        }
        ?>
    </div>

    <div class="card">
        <h2>📊 Estado del Sistema de Reservas</h2>
        <?php
        if (file_exists('reservas_data.json')) {
            $reservas = json_decode(file_get_contents('reservas_data.json'), true);
            $total_reservas = is_array($reservas) ? count($reservas) : 0;
            echo "<p class='success'>✅ Archivo de reservas existe</p>";
            echo "<p><strong>Total de reservas:</strong> {$total_reservas}</p>";
            
            if ($total_reservas > 0) {
                $ultima_reserva = $reservas[0];
                echo "<p><strong>Última reserva:</strong> " . ($ultima_reserva['fecha_registro'] ?? 'Sin fecha') . "</p>";
            }
        } else {
            echo "<p class='warning'>⚠️ Archivo de reservas no existe aún (se creará automáticamente)</p>";
        }
        ?>
    </div>

    <div class="card">
        <h2>🔗 Enlaces de Prueba</h2>
        <?php
        $base_url = 'https://' . $_SERVER['SERVER_NAME'];
        $archivos_enlace = [
            'reservas_manager.php' => 'Panel de Administración de Reservas',
            'migrar_reservas.php' => 'Herramienta de Migración',
            'enviar_correo_mejorado.php' => 'Endpoint de Reservas (POST only)'
        ];
        
        foreach ($archivos_enlace as $archivo => $descripcion) {
            if (file_exists($archivo)) {
                echo "<a href='{$base_url}/{$archivo}' class='btn' target='_blank'>{$descripcion}</a><br>";
            }
        }
        ?>
    </div>

    <div class="card">
        <h2>⚙️ Configuración Recomendada</h2>
        <h3>1. Permisos de Archivos:</h3>
        <pre>chmod 755 *.php
chmod 775 . (directorio actual)</pre>
        
        <h3>2. Cambio en App.jsx:</h3>
        <pre>// Línea 586 en src/App.jsx
const emailApiUrl = "<?php echo $base_url; ?>/enviar_correo_mejorado.php";</pre>
        
        <h3>3. URLs del Sistema:</h3>
        <pre>Panel de Reservas: <?php echo $base_url; ?>/reservas_manager.php
Migración: <?php echo $base_url; ?>/migrar_reservas.php</pre>
    </div>

    <div class="card">
        <h2>📝 Próximos Pasos</h2>
        <ol>
            <li>Si ves archivos faltantes arriba, súbelos via File Manager de Hostinger</li>
            <li>Si los permisos fallan, configúralos en File Manager</li>
            <li>Cambia la URL en tu App.jsx como se muestra arriba</li>
            <li>Haz clic en los enlaces de prueba para verificar que funcionan</li>
            <li>Una vez todo esté verde, ¡el sistema estará listo!</li>
        </ol>
    </div>

    <div class="card">
        <h2>🆘 Si algo no funciona...</h2>
        <p><strong>Revisa:</strong></p>
        <ul>
            <li>Que todos los archivos PHP estén en la misma carpeta que enviar_correo.php</li>
            <li>Que los permisos sean correctos (755 para archivos, 775 para directorio)</li>
            <li>Que PHP esté habilitado en tu hosting</li>
            <li>Los logs de error de PHP en tu panel de Hostinger</li>
        </ul>
    </div>

    <p><small>Test ejecutado el: <?php echo date('Y-m-d H:i:s'); ?></small></p>
</body>
</html>
