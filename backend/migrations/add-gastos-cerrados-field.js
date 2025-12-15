// Migración para agregar campo gastos_cerrados a reservas
import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

async function addGastosCerradosField() {
	try {
		console.log("🔄 Verificando columna gastos_cerrados...");

		const reservasColumns = await sequelize.query(
			"SHOW COLUMNS FROM reservas",
			{ type: QueryTypes.SELECT }
		);
		const reservasColumnNames = reservasColumns.map((col) => col.Field);

		if (!reservasColumnNames.includes("gastos_cerrados")) {
			console.log("➕ Agregando columna gastos_cerrados en reservas...");
			await sequelize.query(
				"ALTER TABLE reservas ADD COLUMN gastos_cerrados TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el registro de gastos está cerrado para esta reserva'"
			);
			console.log("✅ Columna gastos_cerrados agregada");
		} else {
			console.log("✅ Columna gastos_cerrados ya existe");
		}

		console.log("✅ Migración de gastos_cerrados completada");
		return true;
	} catch (error) {
		console.error("❌ Error en migración de gastos_cerrados:", error);
		throw error;
	}
}

export default addGastosCerradosField;
