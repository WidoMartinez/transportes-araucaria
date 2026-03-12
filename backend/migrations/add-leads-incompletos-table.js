/* eslint-env node */
// Migración para crear tabla de leads incompletos (usuarios que abandonan antes de pagar)
import sequelize from "../config/database.js";

const addLeadsIncompletosTable = async () => {
	try {
		console.log("🔄 Verificando tabla leads_incompletos...");

		// Verificar si la tabla ya existe
		const [results] = await sequelize.query(`
			SHOW TABLES LIKE 'leads_incompletos';
		`);

		if (results.length === 0) {
			console.log("📋 Creando tabla leads_incompletos...");

			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS leads_incompletos (
					id INT AUTO_INCREMENT PRIMARY KEY,
					origen VARCHAR(255) NOT NULL,
					destino VARCHAR(255) NOT NULL,
					fecha_viaje DATE NOT NULL,
					hora_viaje TIME NOT NULL,
					num_pasajeros INT NOT NULL,
					email VARCHAR(255),
					telefono VARCHAR(20),
					nombre VARCHAR(255),
					precio_estimado DECIMAL(10,2),
					session_id VARCHAR(100) UNIQUE,
					estado ENUM('sin_datos_contacto', 'con_email', 'contactado', 'convertido', 'descartado') DEFAULT 'sin_datos_contacto',
					intentos_contacto INT DEFAULT 0,
					fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					ultima_fecha_contacto TIMESTAMP NULL,
					INDEX idx_session (session_id),
					INDEX idx_estado (estado),
					INDEX idx_email (email),
					INDEX idx_fecha_actualizacion (fecha_actualizacion)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
				COMMENT='Leads incompletos: usuarios que iniciaron reserva pero no completaron el pago';
			`);

			console.log("✅ Tabla leads_incompletos creada exitosamente");
		} else {
			console.log("✅ Tabla leads_incompletos ya existe");
		}
	} catch (error) {
		console.error("❌ Error al crear tabla leads_incompletos:", error);
		throw error;
	}
};

export default addLeadsIncompletosTable;
