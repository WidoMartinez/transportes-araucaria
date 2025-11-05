/* eslint-env node */
// Migración para crear tabla de configuración de tarifa dinámica e inicializar con valores por defecto
import sequelize from "../config/database.js";

const addTarifaDinamicaTable = async () => {
	try {
		console.log("🔄 Verificando tabla configuracion_tarifa_dinamica...");

		const [results] = await sequelize.query(`
			SHOW TABLES LIKE 'configuracion_tarifa_dinamica';
		`);

		if (results.length === 0) {
			console.log("📋 Creando tabla configuracion_tarifa_dinamica...");

			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS configuracion_tarifa_dinamica (
					id INT AUTO_INCREMENT PRIMARY KEY,
					nombre VARCHAR(100) NOT NULL COMMENT 'Nombre descriptivo de la configuración',
					tipo ENUM('anticipacion', 'dia_semana', 'horario', 'descuento_retorno') NOT NULL COMMENT 'Tipo de regla de tarifa dinámica',
					dias_minimos INT DEFAULT NULL COMMENT 'Días mínimos de anticipación para esta regla',
					dias_maximos INT DEFAULT NULL COMMENT 'Días máximos de anticipación para esta regla (null = sin límite)',
					dias_semana JSON DEFAULT NULL COMMENT 'Array de días de la semana: [0=domingo, 1=lunes, ..., 6=sábado]',
					hora_inicio TIME DEFAULT NULL COMMENT 'Hora de inicio para el recargo (formato HH:MM:SS)',
					hora_fin TIME DEFAULT NULL COMMENT 'Hora de fin para el recargo (formato HH:MM:SS)',
					porcentaje_ajuste DECIMAL(5, 2) NOT NULL COMMENT 'Porcentaje de ajuste: positivo=recargo, negativo=descuento',
					activo BOOLEAN DEFAULT TRUE COMMENT 'Si la regla está activa',
					prioridad INT DEFAULT 0 COMMENT 'Orden de prioridad (mayor = se aplica primero)',
					destinos_excluidos JSON DEFAULT NULL COMMENT 'Array de nombres de destinos excluidos de esta regla',
					descripcion TEXT DEFAULT NULL COMMENT 'Descripción detallada de la regla',
					tiempo_espera_maximo INT DEFAULT 240 COMMENT 'Tiempo máximo de espera en minutos (para descuento retorno)',
					created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					INDEX idx_tipo (tipo),
					INDEX idx_activo (activo),
					INDEX idx_prioridad (prioridad)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
				COMMENT='Configuración de reglas de tarifa dinámica';
			`);

			console.log("✅ Tabla configuracion_tarifa_dinamica creada exitosamente");

			// Insertar configuraciones predeterminadas
			console.log("📋 Insertando configuraciones predeterminadas...");

			await sequelize.query(`
				INSERT INTO configuracion_tarifa_dinamica 
				(nombre, tipo, dias_minimos, dias_maximos, porcentaje_ajuste, activo, prioridad, descripcion) 
				VALUES
				-- Configuraciones por anticipación
				('Mismo día (+25%)', 'anticipacion', 0, 0, 25.00, TRUE, 10, 'Recargo por reserva en el mismo día del viaje'),
				('1-3 días (+10%)', 'anticipacion', 1, 3, 10.00, TRUE, 9, 'Recargo por reserva con 1 a 3 días de anticipación'),
				('4-13 días (estándar)', 'anticipacion', 4, 13, 0.00, TRUE, 8, 'Precio estándar sin ajustes'),
				('14-20 días (-5%)', 'anticipacion', 14, 20, -5.00, TRUE, 7, 'Descuento por reserva con 2-3 semanas de anticipación'),
				('21-29 días (-10%)', 'anticipacion', 21, 29, -10.00, TRUE, 6, 'Descuento por reserva con 3-4 semanas de anticipación'),
				('30+ días (-15%)', 'anticipacion', 30, NULL, -15.00, TRUE, 5, 'Descuento por reserva con 1 mes o más de anticipación'),
				
				-- Configuraciones por día de semana
				('Fin de semana (+10%)', 'dia_semana', NULL, NULL, 10.00, TRUE, 4, 'Recargo para viernes, sábado y domingo'),
				
				-- Configuraciones por horario
				('Horario temprano (+15%)', 'horario', NULL, NULL, 15.00, TRUE, 3, 'Recargo para horarios antes de las 9:00 AM');
			`);

			// Actualizar el JSON de días de semana para fin de semana (viernes=5, sábado=6, domingo=0)
			await sequelize.query(`
				UPDATE configuracion_tarifa_dinamica 
				SET dias_semana = JSON_ARRAY(0, 5, 6)
				WHERE nombre = 'Fin de semana (+10%)';
			`);

			// Actualizar horas para horario temprano
			await sequelize.query(`
				UPDATE configuracion_tarifa_dinamica 
				SET hora_inicio = '00:00:00', hora_fin = '09:00:00'
				WHERE nombre = 'Horario temprano (+15%)';
			`);

			console.log("✅ Configuraciones predeterminadas insertadas exitosamente");
		} else {
			console.log("✅ Tabla configuracion_tarifa_dinamica ya existe");
		}

		console.log("✅ Migración de tarifa dinámica completada");
	} catch (error) {
		console.error("❌ Error en migración de tarifa dinámica:", error.message);
		throw error;
	}
};

export default addTarifaDinamicaTable;
