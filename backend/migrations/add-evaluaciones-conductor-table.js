/* eslint-env node */
// backend/migrations/add-evaluaciones-conductor-table.js
// Migración para crear la tabla de evaluaciones de conductor post-viaje

import sequelize from "../config/database.js";

const addEvaluacionesConductorTable = async () => {
	try {
		console.log("🔄 Verificando tabla evaluaciones_conductor...");

		const [results] = await sequelize.query(`
			SHOW TABLES LIKE 'evaluaciones_conductor';
		`);

		if (results.length === 0) {
			console.log("📋 Creando tabla evaluaciones_conductor...");

			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS evaluaciones_conductor (
					id INT AUTO_INCREMENT PRIMARY KEY,
					reserva_id INT NOT NULL UNIQUE,
					conductor_nombre VARCHAR(255) DEFAULT NULL,
					cliente_email VARCHAR(255) NOT NULL,
					cliente_nombre VARCHAR(255) DEFAULT NULL,

					calificacion_puntualidad TINYINT DEFAULT NULL,
					calificacion_limpieza TINYINT DEFAULT NULL,
					calificacion_seguridad TINYINT DEFAULT NULL,
					calificacion_comunicacion TINYINT DEFAULT NULL,
					calificacion_promedio DECIMAL(3,2) DEFAULT NULL,

					comentario TEXT DEFAULT NULL,

					propina_monto DECIMAL(10,2) NOT NULL DEFAULT 0,
					propina_pagada TINYINT(1) NOT NULL DEFAULT 0,
					propina_flow_order INT DEFAULT NULL,
					propina_flow_token VARCHAR(255) DEFAULT NULL,
					propina_payment_id VARCHAR(255) DEFAULT NULL,

					solicitud_enviada TINYINT(1) NOT NULL DEFAULT 0,
					fecha_solicitud DATETIME DEFAULT NULL,
					notificacion_admin_enviada TINYINT(1) NOT NULL DEFAULT 0,

					token_evaluacion VARCHAR(100) NOT NULL UNIQUE,
					token_expiracion DATETIME DEFAULT NULL,
					evaluada TINYINT(1) NOT NULL DEFAULT 0,
					fecha_evaluacion DATETIME DEFAULT NULL,

					publicado TINYINT(1) NOT NULL DEFAULT 0,
					publicado_nombre VARCHAR(255) DEFAULT NULL,
					publicado_en DATETIME DEFAULT NULL,

					created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

					INDEX idx_evaluacion_reserva_id (reserva_id),
					INDEX idx_evaluacion_token (token_evaluacion),
					INDEX idx_evaluacion_evaluada (evaluada),
					INDEX idx_evaluacion_flow_order (propina_flow_order),
					INDEX idx_evaluacion_publicado (publicado),

					CONSTRAINT fk_evaluacion_reserva FOREIGN KEY (reserva_id)
						REFERENCES reservas(id) ON DELETE CASCADE
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
				COMMENT='Tabla de evaluaciones de conductor post-viaje con soporte de propinas y testimonios';
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
