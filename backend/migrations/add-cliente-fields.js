import sequelize from "../config/database.js";

/**
 * Migración para agregar campos relacionados con clientes
 * - Agrega tabla clientes
 * - Agrega campos clienteId y rut a la tabla reservas
 */
async function addClienteFields() {
	try {
		console.log("🔧 Iniciando migración: agregar campos de cliente...");

		// Crear tabla clientes
		console.log("📦 Creando tabla clientes...");
		await sequelize.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rut VARCHAR(20) UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        telefono VARCHAR(50) NOT NULL,
        esCliente BOOLEAN DEFAULT FALSE COMMENT 'TRUE si ha realizado al menos un pago',
        marcadoManualmente BOOLEAN DEFAULT FALSE COMMENT 'TRUE si fue marcado manualmente como cliente',
        totalReservas INT DEFAULT 0 COMMENT 'Número total de reservas',
        totalPagos INT DEFAULT 0 COMMENT 'Número total de pagos completados',
        totalGastado DECIMAL(10, 2) DEFAULT 0 COMMENT 'Total gastado',
        primeraReserva DATE COMMENT 'Fecha de la primera reserva',
        ultimaReserva DATE COMMENT 'Fecha de la última reserva',
        notas TEXT COMMENT 'Notas adicionales',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_rut (rut),
        INDEX idx_esCliente (esCliente),
        INDEX idx_telefono (telefono)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
		console.log("✅ Tabla clientes creada");

		// Agregar campo clienteId a reservas
		console.log("📦 Agregando campo clienteId a reservas...");
		await sequelize.query(`
      ALTER TABLE reservas
      ADD COLUMN IF NOT EXISTS clienteId INT COMMENT 'ID del cliente asociado';
    `);
		console.log("✅ Campo clienteId agregado");

		// Agregar campo rut a reservas
		console.log("📦 Agregando campo rut a reservas...");
		await sequelize.query(`
      ALTER TABLE reservas
      ADD COLUMN IF NOT EXISTS rut VARCHAR(20) COMMENT 'RUT del cliente (formato: 12345678-9)';
    `);
		console.log("✅ Campo rut agregado");

		// Agregar índice para clienteId
		console.log("📦 Agregando índice para clienteId...");
		await sequelize.query(`
      ALTER TABLE reservas
      ADD INDEX IF NOT EXISTS idx_clienteId (clienteId);
    `);
		console.log("✅ Índice para clienteId agregado");

		// Agregar índice para rut
		console.log("📦 Agregando índice para rut...");
		await sequelize.query(`
      ALTER TABLE reservas
      ADD INDEX IF NOT EXISTS idx_rut (rut);
    `);
		console.log("✅ Índice para rut agregado");

		console.log("✅ Migración completada exitosamente");
	} catch (error) {
		console.error("❌ Error en la migración:", error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

// Ejecutar la migración
addClienteFields().catch((error) => {
	console.error("Error fatal:", error);
	process.exit(1);
});
