/* eslint-env node */
// Migración para crear tabla de evaluaciones de conductores
import sequelize from "../config/database.js";

const addEvaluacionesConductorTable = async () => {
	try {
		console.log("🔄 Verificando tabla evaluaciones_conductor...");

		// Verificar si la tabla ya existe
		const [results] = await sequelize.query(`
			SHOW TABLES LIKE 'evaluaciones_conductor';
		`);

		if (results.length === 0) {
			console.log("📋 Creando tabla evaluaciones_conductor...");

			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS evaluaciones_conductor (
					id INT AUTO_INCREMENT PRIMARY KEY,
					reserva_id INT NOT NULL UNIQUE,
					conductor_id INT NOT NULL,
					cliente_email VARCHAR(255) NOT NULL,
					cliente_nombre VARCHAR(255),
					
					calificacion_puntualidad TINYINT NOT NULL,
					calificacion_limpieza TINYINT NOT NULL,
					calificacion_seguridad TINYINT NOT NULL,
					calificacion_comunicacion TINYINT NOT NULL,
					calificacion_promedio DECIMAL(3,2),
					
					comentario TEXT,
					
					propina_monto DECIMAL(10,2) DEFAULT 0,
					propina_pagada BOOLEAN DEFAULT FALSE,
					propina_flow_order INT,
					propina_flow_token VARCHAR(255),
					propina_payment_id VARCHAR(255),
					
					notificacion_conductor_enviada BOOLEAN DEFAULT FALSE,
					fecha_notificacion_conductor DATETIME,
					notificacion_admin_enviada BOOLEAN DEFAULT FALSE,
					fecha_notificacion_admin DATETIME,
					
					token_evaluacion VARCHAR(100) NOT NULL UNIQUE,
					token_expiracion DATETIME,
					evaluada BOOLEAN DEFAULT FALSE,
					fecha_evaluacion DATETIME,
					
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					
					INDEX idx_reserva_id (reserva_id),
					INDEX idx_conductor_id (conductor_id),
					INDEX idx_token (token_evaluacion),
					INDEX idx_evaluada (evaluada),
					INDEX idx_flow_order (propina_flow_order),
					
					FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
					FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE CASCADE
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
				COMMENT='Tabla de evaluaciones de conductores con sistema de calificación y propinas';
			`);

			console.log("✅ Tabla evaluaciones_conductor creada exitosamente");
		} else {
			console.log("✅ Tabla evaluaciones_conductor ya existe");
		}

		console.log("✅ Migración de evaluaciones_conductor completada");
	} catch (error) {
		console.error("❌ Error en migración de evaluaciones_conductor:", error.message);
		throw error;
	}
};

export default addEvaluacionesConductorTable;
