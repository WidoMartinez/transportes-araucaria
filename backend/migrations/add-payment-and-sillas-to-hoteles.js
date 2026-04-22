/* eslint-env node */
// backend/migrations/add-payment-and-sillas-to-hoteles.js
// Migración para agregar campos de pago y sillas infantiles a la tabla traslados_hoteles

import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

async function addPaymentAndSillasToHoteles() {
	try {
		console.log("🔄 Verificando campos de pago y sillas en tabla traslados_hoteles...");

		// Obtener columnas existentes
		const columns = await sequelize.query(
			"SHOW COLUMNS FROM traslados_hoteles",
			{ type: QueryTypes.SELECT }
		);

		const columnNames = columns.map((col) => col.Field);

		// Campo: estado_pago
		if (!columnNames.includes("estado_pago")) {
			console.log("➕ Agregando columna estado_pago...");
			await sequelize.query(
				"ALTER TABLE traslados_hoteles ADD COLUMN estado_pago ENUM('pendiente', 'aprobado', 'pagado', 'fallido', 'reembolsado') DEFAULT 'pendiente' AFTER estado"
			);
			console.log("✅ Columna estado_pago agregada");
		}

		// Campo: pago_id
		if (!columnNames.includes("pago_id")) {
			console.log("➕ Agregando columna pago_id...");
			await sequelize.query(
				"ALTER TABLE traslados_hoteles ADD COLUMN pago_id VARCHAR(255) NULL COMMENT 'ID de transacción del gateway de pago' AFTER estado_pago"
			);
			console.log("✅ Columna pago_id agregada");
		}

		// Campo: pago_gateway
		if (!columnNames.includes("pago_gateway")) {
			console.log("➕ Agregando columna pago_gateway...");
			await sequelize.query(
				"ALTER TABLE traslados_hoteles ADD COLUMN pago_gateway VARCHAR(50) NULL COMMENT 'Gateway de pago utilizado' AFTER pago_id"
			);
			console.log("✅ Columna pago_gateway agregada");
		}

		// Campo: pago_monto
		if (!columnNames.includes("pago_monto")) {
			console.log("➕ Agregando columna pago_monto...");
			await sequelize.query(
				"ALTER TABLE traslados_hoteles ADD COLUMN pago_monto DECIMAL(10,2) NULL COMMENT 'Monto pagado' AFTER pago_gateway"
			);
			console.log("✅ Columna pago_monto agregada");
		}

		// Campo: pago_fecha
		if (!columnNames.includes("pago_fecha")) {
			console.log("➕ Agregando columna pago_fecha...");
			await sequelize.query(
				"ALTER TABLE traslados_hoteles ADD COLUMN pago_fecha DATETIME NULL COMMENT 'Fecha y hora del pago' AFTER pago_monto"
			);
			console.log("✅ Columna pago_fecha agregada");
		}

		// Campo: metodo_pago
		if (!columnNames.includes("metodo_pago")) {
			console.log("➕ Agregando columna metodo_pago...");
			await sequelize.query(
				"ALTER TABLE traslados_hoteles ADD COLUMN metodo_pago VARCHAR(50) NULL AFTER pago_fecha"
			);
			console.log("✅ Columna metodo_pago agregada");
		}

		// Campo: silla_infantil
		if (!columnNames.includes("silla_infantil")) {
			console.log("➕ Agregando columna silla_infantil...");
			await sequelize.query(
				"ALTER TABLE traslados_hoteles ADD COLUMN silla_infantil BOOLEAN DEFAULT FALSE AFTER pasajeros"
			);
			console.log("✅ Columna silla_infantil agregada");
		}

		// Campo: cantidad_sillas_infantiles
		if (!columnNames.includes("cantidad_sillas_infantiles")) {
			console.log("➕ Agregando columna cantidad_sillas_infantiles...");
			await sequelize.query(
				"ALTER TABLE traslados_hoteles ADD COLUMN cantidad_sillas_infantiles INT DEFAULT 0 AFTER silla_infantil"
			);
			console.log("✅ Columna cantidad_sillas_infantiles agregada");
		}

		// Agregar índices
		try {
			await sequelize.query("CREATE INDEX idx_th_pago_id ON traslados_hoteles(pago_id)");
			console.log("✅ Índice idx_th_pago_id creado");
		} catch (error) {
			if (!error.message.includes("Duplicate key name")) console.error(error.message);
		}

		try {
			await sequelize.query("CREATE INDEX idx_th_estado_pago ON traslados_hoteles(estado_pago)");
			console.log("✅ Índice idx_th_estado_pago creado");
		} catch (error) {
			if (!error.message.includes("Duplicate key name")) console.error(error.message);
		}

		console.log("✅ Migración de campos traslados_hoteles completada exitosamente");
		return true;
	} catch (error) {
		console.error("❌ Error en migración de traslados_hoteles:", error);
		throw error;
	}
}

export default addPaymentAndSillasToHoteles;
