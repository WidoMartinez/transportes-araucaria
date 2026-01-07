import sequelize from "../config/database.js";
import { DataTypes } from "sequelize";

/**
 * Migración: Crear tabla transacciones para historial de pagos
 * Fecha: 2026-01-07
 * Propósito: Registrar cada pago individual asociado a una reserva
 */
export default async function addTransaccionesTable() {
	const tableName = "transacciones";

	try {
		// Verificar si la tabla ya existe
		const [tables] = await sequelize.query(
			`SHOW TABLES LIKE '${tableName}'`
		);

		if (tables.length > 0) {
			console.log(`✅ Tabla ${tableName} ya existe, saltando migración`);
			return;
		}

		console.log(`📋 Creando tabla ${tableName}...`);

		await sequelize.query(`
			CREATE TABLE ${tableName} (
				id INT AUTO_INCREMENT PRIMARY KEY,
				reserva_id INT NOT NULL,
				codigo_pago_id INT NULL,
				monto DECIMAL(10, 2) NOT NULL COMMENT 'Monto de esta transacción específica',
				gateway VARCHAR(50) NOT NULL DEFAULT 'flow' COMMENT 'Gateway de pago utilizado',
				transaccion_id VARCHAR(255) NULL COMMENT 'ID de la transacción en el gateway',
				referencia VARCHAR(100) NULL COMMENT 'Referencia del código de pago',
				tipo_pago VARCHAR(20) NULL COMMENT 'Tipo de pago (abono, saldo, total, diferencia)',
				estado ENUM('pendiente', 'aprobado', 'fallido', 'reembolsado') DEFAULT 'aprobado' COMMENT 'Estado de la transacción',
				email_pagador VARCHAR(255) NULL COMMENT 'Email del pagador',
				metadata JSON NULL COMMENT 'Datos adicionales del gateway',
				notas TEXT NULL COMMENT 'Notas adicionales',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				
				INDEX idx_reserva_id (reserva_id),
				INDEX idx_codigo_pago_id (codigo_pago_id),
				INDEX idx_transaccion_id (transaccion_id),
				INDEX idx_gateway (gateway),
				INDEX idx_estado (estado),
				INDEX idx_created_at (created_at),
				
				FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
				FOREIGN KEY (codigo_pago_id) REFERENCES codigos_pago(id) ON DELETE SET NULL
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);

		console.log(`✅ Tabla ${tableName} creada exitosamente`);
		console.log(`   - Incluye FK a reservas y codigos_pago`);
		console.log(`   - Índices optimizados para consultas`);
		console.log(`   - Soporte para metadata JSON`);

	} catch (error) {
		console.error(`❌ Error creando tabla ${tableName}:`, error.message);
		throw error;
	}
}
