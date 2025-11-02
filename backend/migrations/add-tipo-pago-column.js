// migrations/add-tipo-pago-column.js
// Agrega la columna tipo_pago a la tabla reservas para registrar abonos/saldos

import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

async function addTipoPagoColumn() {
	try {
		console.log("Verificando columna tipo_pago en tabla reservas...");

		const columns = await sequelize.query("SHOW COLUMNS FROM reservas LIKE 'tipo_pago'", {
			type: QueryTypes.SELECT,
		});

		if (!Array.isArray(columns) || columns.length === 0) {
			console.log("Agregando columna tipo_pago...");
			await sequelize.query(`
				ALTER TABLE reservas
				ADD COLUMN tipo_pago VARCHAR(20) NULL DEFAULT NULL
				COMMENT 'Tipo de pago registrado (abono, saldo, total)' AFTER metodo_pago
			`);
			console.log("Columna tipo_pago agregada correctamente.");
		} else {
			console.log("La columna tipo_pago ya existe. No se realizan cambios.");
		}

		return true;
	} catch (error) {
		console.error("Error en migracion add-tipo-pago-column:", error);
		throw error;
	}
}

export default addTipoPagoColumn;
