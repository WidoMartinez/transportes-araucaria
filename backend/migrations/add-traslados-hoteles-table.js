/* eslint-env node */
// Migración para crear tabla dedicada al servicio Aeropuerto <-> Hoteles
import sequelize from "../config/database.js";

const addTrasladosHotelesTable = async () => {
	try {
		console.log("🔄 Verificando tabla traslados_hoteles...");

		const [results] = await sequelize.query(`
			SHOW TABLES LIKE 'traslados_hoteles';
		`);

		if (results.length === 0) {
			console.log("📋 Creando tabla traslados_hoteles...");

			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS traslados_hoteles (
					id INT AUTO_INCREMENT PRIMARY KEY,
					codigo_reserva VARCHAR(50) NOT NULL UNIQUE,
					nombre VARCHAR(255) NOT NULL,
					email VARCHAR(255) NOT NULL,
					telefono VARCHAR(50) NOT NULL,
					hotel_codigo VARCHAR(80) NOT NULL,
					hotel_nombre VARCHAR(255) NOT NULL,
					origen_tipo ENUM('aeropuerto', 'hotel') NOT NULL,
					origen VARCHAR(255) NOT NULL,
					destino VARCHAR(255) NOT NULL,
					tipo_servicio ENUM('solo_ida', 'ida_vuelta') NOT NULL,
					fecha_ida DATE NOT NULL,
					hora_ida TIME NOT NULL,
					fecha_vuelta DATE NULL,
					hora_vuelta TIME NULL,
					pasajeros INT NOT NULL DEFAULT 1,
					monto_total DECIMAL(10, 2) NOT NULL,
					moneda VARCHAR(10) NOT NULL DEFAULT 'CLP',
					observaciones TEXT NULL,
					estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada') NOT NULL DEFAULT 'pendiente',
					source VARCHAR(80) NOT NULL DEFAULT 'web_hoteles',
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					INDEX idx_th_estado (estado),
					INDEX idx_th_hotel_codigo (hotel_codigo),
					INDEX idx_th_fecha_ida (fecha_ida)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
				COMMENT='Reservas del módulo especializado de traslados Aeropuerto-Hoteles';
			`);

			console.log("✅ Tabla traslados_hoteles creada exitosamente");
		} else {
			console.log("✅ Tabla traslados_hoteles ya existe");
		}
	} catch (error) {
		console.error("❌ Error al crear tabla traslados_hoteles:", error);
		throw error;
	}
};

export default addTrasladosHotelesTable;
