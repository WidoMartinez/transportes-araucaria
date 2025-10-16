/* eslint-env node */
/* global process */
// Migración para crear tabla de códigos de pago
import sequelize from "../config/database.js";

const addCodigosPagoTable = async () => {
	try {
		console.log("🔄 Verificando tabla codigos_pago...");

		// Verificar si la tabla ya existe
		const [results] = await sequelize.query(`
			SHOW TABLES LIKE 'codigos_pago';
		`);

		if (results.length === 0) {
			console.log("📋 Creando tabla codigos_pago...");

			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS codigos_pago (
					id INT AUTO_INCREMENT PRIMARY KEY,
					codigo VARCHAR(50) NOT NULL UNIQUE,
					origen VARCHAR(255) NOT NULL,
					destino VARCHAR(255) NOT NULL,
					monto DECIMAL(10, 2) NOT NULL,
					descripcion TEXT,
					vehiculo VARCHAR(100),
					pasajeros INT DEFAULT 1,
					ida_vuelta BOOLEAN DEFAULT FALSE,
					estado ENUM('activo', 'usado', 'vencido', 'cancelado') DEFAULT 'activo',
					fecha_vencimiento DATETIME,
					usos_maximos INT DEFAULT 1,
					usos_actuales INT DEFAULT 0,
					reserva_id INT,
					email_cliente VARCHAR(255),
					fecha_uso DATETIME,
					observaciones TEXT,
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					INDEX idx_codigo (codigo),
					INDEX idx_estado (estado),
					INDEX idx_fecha_vencimiento (fecha_vencimiento),
					INDEX idx_reserva_id (reserva_id),
					INDEX idx_email_cliente (email_cliente)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
				COMMENT='Tabla de códigos de pago estandarizados para WhatsApp';
			`);

			console.log("✅ Tabla codigos_pago creada exitosamente");
		} else {
			console.log("✅ Tabla codigos_pago ya existe");
		}

		console.log("✅ Migración de codigos_pago completada");
	} catch (error) {
		console.error("❌ Error en migración de codigos_pago:", error.message);
		throw error;
	}
};

export default addCodigosPagoTable;
