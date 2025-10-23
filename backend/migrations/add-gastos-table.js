/* eslint-env node */
// Migración para crear tabla de gastos
import sequelize from "../config/database.js";

const addGastosTable = async () => {
	try {
		console.log("🔄 Verificando tabla gastos...");

		const [results] = await sequelize.query(`
			SHOW TABLES LIKE 'gastos';
		`);

		if (results.length === 0) {
			console.log("📋 Creando tabla gastos...");

			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS gastos (
					id INT AUTO_INCREMENT PRIMARY KEY,
					reserva_id INT NOT NULL,
					tipo_gasto VARCHAR(50) NOT NULL,
					monto DECIMAL(10, 2) NOT NULL,
					porcentaje DECIMAL(5, 2) DEFAULT NULL,
					descripcion TEXT,
					fecha DATE NOT NULL,
					comprobante VARCHAR(255) DEFAULT NULL,
					conductor_id INT DEFAULT NULL,
					vehiculo_id INT DEFAULT NULL,
					observaciones TEXT,
					created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					INDEX idx_reserva_id (reserva_id),
					INDEX idx_conductor_id (conductor_id),
					INDEX idx_vehiculo_id (vehiculo_id),
					INDEX idx_fecha (fecha),
					INDEX idx_tipo_gasto (tipo_gasto),
					CONSTRAINT fk_gastos_reserva FOREIGN KEY (reserva_id) REFERENCES reservas (id) ON DELETE CASCADE,
					CONSTRAINT fk_gastos_conductor FOREIGN KEY (conductor_id) REFERENCES conductores (id) ON DELETE SET NULL,
					CONSTRAINT fk_gastos_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id) ON DELETE SET NULL
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
				COMMENT='Tabla de gastos asociados a reservas';
			`);

			console.log("✅ Tabla gastos creada exitosamente");
		} else {
			console.log("✅ Tabla gastos ya existe");
		}

		console.log("✅ Migración de gastos completada");
	} catch (error) {
		console.error("❌ Error en migración de gastos:", error.message);
		throw error;
	}
};

export default addGastosTable;
