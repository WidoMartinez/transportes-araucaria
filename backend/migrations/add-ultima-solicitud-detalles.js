// migrations/add-ultima-solicitud-detalles.js
// Migración: Añadir campo ultima_solicitud_detalles a la tabla reservas
// Registra la fecha/hora del último recordatorio de datos enviado al cliente

import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

async function addUltimaSolicitudDetalles() {
	try {
		console.log("🔄 Verificando columna ultima_solicitud_detalles en tabla reservas...");

		const columns = await sequelize.query(
			"SHOW COLUMNS FROM reservas",
			{ type: QueryTypes.SELECT }
		);

		const columnNames = columns.map((col) => col.Field);

		if (!columnNames.includes("ultima_solicitud_detalles")) {
			console.log("➕ Agregando columna ultima_solicitud_detalles...");
			await sequelize.query(
				"ALTER TABLE reservas ADD COLUMN ultima_solicitud_detalles DATETIME NULL COMMENT 'Fecha y hora del último correo de solicitud de detalles enviado'"
			);
			console.log("✅ Columna ultima_solicitud_detalles agregada");
		} else {
			console.log("✅ Columna ultima_solicitud_detalles ya existe, omitiendo");
		}

		return true;
	} catch (error) {
		console.error("❌ Error en migración ultima_solicitud_detalles:", error);
		throw error;
	}
}

export default addUltimaSolicitudDetalles;
