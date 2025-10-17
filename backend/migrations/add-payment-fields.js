// migrations/add-payment-fields.js
// Migración para agregar campos de información de pago a la tabla reservas

import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

async function addPaymentFields() {
	try {
		console.log("🔄 Verificando campos de pago en tabla reservas...");

		// Obtener columnas existentes
		const columns = await sequelize.query(
			"SHOW COLUMNS FROM reservas",
			{ type: QueryTypes.SELECT }
		);

		const columnNames = columns.map((col) => col.Field);

		// Verificar si estadoPago necesita actualización con nuevo valor 'aprobado'
		const estadoPagoColumn = columns.find(
			(col) => col.Field === "estado_pago"
		);

		if (estadoPagoColumn) {
			const enumValues = estadoPagoColumn.Type;
			if (!enumValues.includes("aprobado")) {
				console.log("📝 Actualizando ENUM de estado_pago para incluir 'aprobado'...");
				await sequelize.query(
					"ALTER TABLE reservas MODIFY COLUMN estado_pago ENUM('pendiente', 'aprobado', 'pagado', 'fallido', 'reembolsado') DEFAULT 'pendiente'"
				);
				console.log("✅ ENUM de estado_pago actualizado");
			}
		}

		// Campo: pago_id
		if (!columnNames.includes("pago_id")) {
			console.log("➕ Agregando columna pago_id...");
			await sequelize.query(
				"ALTER TABLE reservas ADD COLUMN pago_id VARCHAR(255) NULL COMMENT 'ID de transacción del gateway de pago'"
			);
			console.log("✅ Columna pago_id agregada");
		}

		// Campo: pago_gateway
		if (!columnNames.includes("pago_gateway")) {
			console.log("➕ Agregando columna pago_gateway...");
			await sequelize.query(
				"ALTER TABLE reservas ADD COLUMN pago_gateway VARCHAR(50) NULL COMMENT 'Gateway de pago utilizado (flow, transferencia, efectivo, etc)'"
			);
			console.log("✅ Columna pago_gateway agregada");
		}

		// Campo: pago_monto
		if (!columnNames.includes("pago_monto")) {
			console.log("➕ Agregando columna pago_monto...");
			await sequelize.query(
				"ALTER TABLE reservas ADD COLUMN pago_monto DECIMAL(10,2) NULL COMMENT 'Monto pagado en la transacción'"
			);
			console.log("✅ Columna pago_monto agregada");
		}

		// Campo: pago_fecha
		if (!columnNames.includes("pago_fecha")) {
			console.log("➕ Agregando columna pago_fecha...");
			await sequelize.query(
				"ALTER TABLE reservas ADD COLUMN pago_fecha DATETIME NULL COMMENT 'Fecha y hora del pago confirmado'"
			);
			console.log("✅ Columna pago_fecha agregada");
		}

		// Agregar índices para mejorar búsquedas
		try {
			await sequelize.query(
				"CREATE INDEX idx_pago_id ON reservas(pago_id)"
			);
			console.log("✅ Índice idx_pago_id creado");
		} catch (error) {
			if (!error.message.includes("Duplicate key name")) {
				throw error;
			}
		}

		try {
			await sequelize.query(
				"CREATE INDEX idx_estado_pago ON reservas(estado_pago)"
			);
			console.log("✅ Índice idx_estado_pago creado");
		} catch (error) {
			if (!error.message.includes("Duplicate key name")) {
				throw error;
			}
		}

		console.log("✅ Migración de campos de pago completada exitosamente");
		return true;
	} catch (error) {
		console.error("❌ Error en migración de campos de pago:", error);
		throw error;
	}
}

export default addPaymentFields;
