// migrations/add-tramos-fields.js
// Migración para agregar campos de vinculación de tramos (Ida/Vuelta)

import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

async function addTramosFields() {
	try {
		console.log("🔄 Verificando campos de tramos en tabla reservas...");

		// Obtener columnas existentes
		const columns = await sequelize.query(
			"SHOW COLUMNS FROM reservas",
			{ type: QueryTypes.SELECT }
		);

		const columnNames = columns.map((col) => col.Field);

		// Campo: tramo_padre_id
		if (!columnNames.includes("tramo_padre_id")) {
			console.log("➕ Agregando columna tramo_padre_id...");
			await sequelize.query(
				"ALTER TABLE reservas ADD COLUMN tramo_padre_id INT NULL COMMENT 'ID de la reserva principal (ida) si esta es una vuelta'"
			);
			console.log("✅ Columna tramo_padre_id agregada");
		}

		// Campo: tramo_hijo_id
		if (!columnNames.includes("tramo_hijo_id")) {
			console.log("➕ Agregando columna tramo_hijo_id...");
			await sequelize.query(
				"ALTER TABLE reservas ADD COLUMN tramo_hijo_id INT NULL COMMENT 'ID de la reserva vinculada (vuelta) si esta es una ida'"
			);
			console.log("✅ Columna tramo_hijo_id agregada");
		}

		// Campo: tipo_tramo
		if (!columnNames.includes("tipo_tramo")) {
			console.log("➕ Agregando columna tipo_tramo...");
			await sequelize.query(
				"ALTER TABLE reservas ADD COLUMN tipo_tramo ENUM('ida', 'vuelta', 'solo_ida') DEFAULT 'solo_ida' COMMENT 'Tipo de tramo de la reserva'"
			);
			console.log("✅ Columna tipo_tramo agregada");
		}

		// Agregar índices
		try {
			await sequelize.query("CREATE INDEX idx_tramo_padre ON reservas(tramo_padre_id)");
			console.log("✅ Índice idx_tramo_padre creado");
		} catch (error) {
			if (!error.message.includes("Duplicate key name")) {
				console.warn("⚠️ No se pudo crear índice idx_tramo_padre:", error.message);
			}
		}

        try {
			await sequelize.query("CREATE INDEX idx_tramo_hijo ON reservas(tramo_hijo_id)");
			console.log("✅ Índice idx_tramo_hijo creado");
		} catch (error) {
			if (!error.message.includes("Duplicate key name")) {
				console.warn("⚠️ No se pudo crear índice idx_tramo_hijo:", error.message);
			}
		}

		console.log("✅ Migración de campos de tramos completada exitosamente");
		return true;
	} catch (error) {
		console.error("❌ Error en migración de campos de tramos:", error);
		throw error;
	}
}

export default addTramosFields;
