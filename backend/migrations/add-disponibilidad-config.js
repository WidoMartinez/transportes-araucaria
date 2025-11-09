// backend/migrations/add-disponibilidad-config.js
import sequelize from "../config/database.js";

/**
 * Migración para agregar tabla de configuración de disponibilidad
 * y campos de duración a destinos
 */
const addDisponibilidadConfig = async () => {
	try {
		console.log("🔄 Iniciando migración: add-disponibilidad-config...");

		// 1. Crear tabla configuracion_disponibilidad
		await sequelize.query(`
			CREATE TABLE IF NOT EXISTS configuracion_disponibilidad (
				id INT AUTO_INCREMENT PRIMARY KEY,
				holgura_minima INT NOT NULL DEFAULT 30 COMMENT 'Tiempo mínimo obligatorio entre llegada y siguiente salida (minutos)',
				holgura_optima INT NOT NULL DEFAULT 60 COMMENT 'Tiempo óptimo de descanso del conductor (minutos)',
				holgura_maxima_descuento INT NOT NULL DEFAULT 180 COMMENT 'Tiempo máximo para aplicar descuento por retorno (minutos)',
				descuento_minimo DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT 'Descuento mínimo por retorno (%)',
				descuento_maximo DECIMAL(5,2) NOT NULL DEFAULT 40.00 COMMENT 'Descuento máximo por retorno (%)',
				hora_limite_retornos TIME NOT NULL DEFAULT '20:00:00' COMMENT 'Hora límite para iniciar retornos con descuento',
				activo BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si el sistema de descuentos por retorno está activo',
				descripcion TEXT NULL COMMENT 'Descripción de la configuración actual',
				ultima_modificacion_por VARCHAR(100) NULL COMMENT 'Usuario que realizó la última modificación',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				INDEX idx_activo (activo)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
		console.log("✅ Tabla configuracion_disponibilidad creada");

		// 2. Agregar campos de duración a destinos si no existen
		const [columns] = await sequelize.query(`
			SELECT COLUMN_NAME 
			FROM INFORMATION_SCHEMA.COLUMNS 
			WHERE TABLE_SCHEMA = DATABASE() 
			AND TABLE_NAME = 'destinos'
		`);
		
		const columnNames = columns.map(col => col.COLUMN_NAME);

		if (!columnNames.includes('duracion_ida_minutos')) {
			await sequelize.query(`
				ALTER TABLE destinos 
				ADD COLUMN duracion_ida_minutos INT NULL DEFAULT 60 
				COMMENT 'Duración estimada del viaje de ida en minutos'
			`);
			console.log("✅ Campo duracion_ida_minutos agregado a destinos");
		}

		if (!columnNames.includes('duracion_vuelta_minutos')) {
			await sequelize.query(`
				ALTER TABLE destinos 
				ADD COLUMN duracion_vuelta_minutos INT NULL DEFAULT 60 
				COMMENT 'Duración estimada del viaje de vuelta en minutos'
			`);
			console.log("✅ Campo duracion_vuelta_minutos agregado a destinos");
		}

		// 3. Insertar configuración por defecto si no existe
		const [existing] = await sequelize.query(`
			SELECT id FROM configuracion_disponibilidad LIMIT 1
		`);

		if (existing.length === 0) {
			await sequelize.query(`
				INSERT INTO configuracion_disponibilidad (
					holgura_minima,
					holgura_optima,
					holgura_maxima_descuento,
					descuento_minimo,
					descuento_maximo,
					hora_limite_retornos,
					activo,
					descripcion
				) VALUES (
					30,
					60,
					180,
					1.00,
					40.00,
					'20:00:00',
					TRUE,
					'Configuración inicial del sistema de disponibilidad y descuentos por retorno'
				)
			`);
			console.log("✅ Configuración por defecto insertada");
		}

		// 4. Actualizar duraciones estimadas para destinos existentes (valores aproximados)
		await sequelize.query(`
			UPDATE destinos 
			SET 
				duracion_ida_minutos = CASE 
					WHEN LOWER(nombre) LIKE '%temuco%' THEN 45
					WHEN LOWER(nombre) LIKE '%villarrica%' THEN 90
					WHEN LOWER(nombre) LIKE '%pucón%' OR LOWER(nombre) LIKE '%pucon%' THEN 120
					WHEN LOWER(nombre) LIKE '%lonquimay%' THEN 180
					WHEN LOWER(nombre) LIKE '%icalma%' THEN 150
					WHEN LOWER(nombre) LIKE '%conguillío%' OR LOWER(nombre) LIKE '%conguillio%' THEN 150
					WHEN LOWER(nombre) LIKE '%corralco%' THEN 180
					ELSE 60
				END,
				duracion_vuelta_minutos = CASE 
					WHEN LOWER(nombre) LIKE '%temuco%' THEN 45
					WHEN LOWER(nombre) LIKE '%villarrica%' THEN 90
					WHEN LOWER(nombre) LIKE '%pucón%' OR LOWER(nombre) LIKE '%pucon%' THEN 120
					WHEN LOWER(nombre) LIKE '%lonquimay%' THEN 180
					WHEN LOWER(nombre) LIKE '%icalma%' THEN 150
					WHEN LOWER(nombre) LIKE '%conguillío%' OR LOWER(nombre) LIKE '%conguillio%' THEN 150
					WHEN LOWER(nombre) LIKE '%corralco%' THEN 180
					ELSE 60
				END
			WHERE duracion_ida_minutos IS NULL OR duracion_vuelta_minutos IS NULL
		`);
		console.log("✅ Duraciones estimadas actualizadas para destinos existentes");

		console.log("✅ Migración add-disponibilidad-config completada exitosamente");
		return true;
	} catch (error) {
		console.error("❌ Error en migración add-disponibilidad-config:", error);
		throw error;
	}
};

export default addDisponibilidadConfig;
