/* eslint-env node */
// Migración para crear tabla de estadísticas de conductores
import sequelize from "../config/database.js";

const addEstadisticasConductorTable = async () => {
	try {
		console.log("🔄 Verificando tabla estadisticas_conductor...");

		// Verificar si la tabla ya existe
		const [results] = await sequelize.query(`
			SHOW TABLES LIKE 'estadisticas_conductor';
		`);

		if (results.length === 0) {
			console.log("📋 Creando tabla estadisticas_conductor...");

			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS estadisticas_conductor (
					id INT AUTO_INCREMENT PRIMARY KEY,
					conductor_id INT NOT NULL UNIQUE,
					
					promedio_general DECIMAL(3,2) DEFAULT 0,
					promedio_puntualidad DECIMAL(3,2) DEFAULT 0,
					promedio_limpieza DECIMAL(3,2) DEFAULT 0,
					promedio_seguridad DECIMAL(3,2) DEFAULT 0,
					promedio_comunicacion DECIMAL(3,2) DEFAULT 0,
					
					total_evaluaciones INT DEFAULT 0,
					total_servicios_completados INT DEFAULT 0,
					porcentaje_evaluado DECIMAL(5,2) DEFAULT 0,
					
					total_propinas_recibidas DECIMAL(10,2) DEFAULT 0,
					cantidad_propinas INT DEFAULT 0,
					promedio_propina DECIMAL(10,2) DEFAULT 0,
					
					cantidad_5_estrellas INT DEFAULT 0,
					mejor_calificado_en VARCHAR(50),
					
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					
					INDEX idx_conductor_id (conductor_id),
					INDEX idx_promedio_general (promedio_general),
					
					FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE CASCADE
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
				COMMENT='Tabla de estadísticas agregadas de conductores';
			`);

			console.log("✅ Tabla estadisticas_conductor creada exitosamente");
		} else {
			console.log("✅ Tabla estadisticas_conductor ya existe");
		}

		console.log("✅ Migración de estadisticas_conductor completada");
	} catch (error) {
		console.error("❌ Error en migración de estadisticas_conductor:", error.message);
		throw error;
	}
};

export default addEstadisticasConductorTable;
