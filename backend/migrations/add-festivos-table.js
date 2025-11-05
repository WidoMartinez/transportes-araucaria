/* eslint-env node */
// Migración para crear tabla de festivos y fechas especiales
import sequelize from "../config/database.js";

const addFestivosTable = async () => {
	try {
		console.log("🔄 Verificando tabla festivos...");

		const [results] = await sequelize.query(`
			SHOW TABLES LIKE 'festivos';
		`);

		if (results.length === 0) {
			console.log("📋 Creando tabla festivos...");

			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS festivos (
					id INT AUTO_INCREMENT PRIMARY KEY,
					fecha DATE NOT NULL COMMENT 'Fecha del festivo (YYYY-MM-DD)',
					nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del festivo o fecha especial',
					tipo ENUM('feriado_nacional', 'feriado_regional', 'fecha_especial') NOT NULL DEFAULT 'feriado_nacional' COMMENT 'Tipo de festivo',
					recurrente BOOLEAN DEFAULT FALSE COMMENT 'Si el festivo se repite cada año (ej: Navidad, Año Nuevo)',
					porcentaje_recargo DECIMAL(5, 2) DEFAULT NULL COMMENT 'Porcentaje de recargo específico para esta fecha',
					activo BOOLEAN DEFAULT TRUE COMMENT 'Si el festivo está activo',
					descripcion TEXT DEFAULT NULL COMMENT 'Descripción o notas adicionales',
					created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					INDEX idx_fecha (fecha),
					INDEX idx_activo (activo),
					INDEX idx_tipo (tipo),
					INDEX idx_recurrente (recurrente)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
				COMMENT='Tabla de festivos y fechas especiales';
			`);

			console.log("✅ Tabla festivos creada exitosamente");

			// Insertar festivos nacionales de Chile para 2025
			console.log("📋 Insertando festivos nacionales de Chile 2025...");

			await sequelize.query(`
				INSERT INTO festivos (fecha, nombre, tipo, recurrente, descripcion) 
				VALUES
				('2025-01-01', 'Año Nuevo', 'feriado_nacional', TRUE, 'Año Nuevo'),
				('2025-04-18', 'Viernes Santo', 'feriado_nacional', FALSE, 'Viernes Santo 2025'),
				('2025-04-19', 'Sábado Santo', 'feriado_nacional', FALSE, 'Sábado Santo 2025'),
				('2025-05-01', 'Día del Trabajo', 'feriado_nacional', TRUE, 'Día del Trabajo'),
				('2025-05-21', 'Día de las Glorias Navales', 'feriado_nacional', TRUE, 'Glorias Navales'),
				('2025-06-29', 'San Pedro y San Pablo', 'feriado_nacional', FALSE, 'San Pedro y San Pablo 2025'),
				('2025-07-16', 'Día de la Virgen del Carmen', 'feriado_nacional', TRUE, 'Virgen del Carmen'),
				('2025-08-15', 'Asunción de la Virgen', 'feriado_nacional', TRUE, 'Asunción de la Virgen'),
				('2025-09-18', 'Día de la Independencia', 'feriado_nacional', TRUE, 'Fiestas Patrias'),
				('2025-09-19', 'Día de las Glorias del Ejército', 'feriado_nacional', TRUE, 'Fiestas Patrias'),
				('2025-10-12', 'Encuentro de Dos Mundos', 'feriado_nacional', FALSE, 'Día de la Raza 2025'),
				('2025-10-31', 'Día de las Iglesias Evangélicas y Protestantes', 'feriado_nacional', TRUE, 'Día de las Iglesias Evangélicas'),
				('2025-11-01', 'Día de Todos los Santos', 'feriado_nacional', TRUE, 'Todos los Santos'),
				('2025-12-08', 'Inmaculada Concepción', 'feriado_nacional', TRUE, 'Inmaculada Concepción'),
				('2025-12-25', 'Navidad', 'feriado_nacional', TRUE, 'Navidad');
			`);

			console.log("✅ Festivos nacionales insertados exitosamente");
		} else {
			console.log("✅ Tabla festivos ya existe");
		}

		console.log("✅ Migración de festivos completada");
	} catch (error) {
		console.error("❌ Error en migración de festivos:", error.message);
		throw error;
	}
};

export default addFestivosTable;
