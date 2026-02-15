/* eslint-env node */
import sequelize from "../config/database.js";

const addSillaInfantilCountToReservas = async () => {
	try {
		console.log("🔄 Verificando columna cantidad_sillas_infantiles en reservas...");

		// Paso 1: Verificar si ya existe (idempotencia)
		const [columns] = await sequelize.query(
			"SHOW COLUMNS FROM reservas LIKE 'cantidad_sillas_infantiles'"
		);
		
		if (columns.length === 0) {
			console.log("📋 Aplicando migración: añadir cantidad_sillas_infantiles a reservas...");
			
			// Paso 2: Ejecutar cambio
			await sequelize.query(`
				ALTER TABLE reservas 
				ADD COLUMN cantidad_sillas_infantiles INTEGER DEFAULT 0 COMMENT 'Cantidad de sillas infantiles solicitadas'
			`);
			
			console.log("✅ Columna cantidad_sillas_infantiles añadida exitosamente");
		} else {
			console.log("✅ Columna cantidad_sillas_infantiles ya existe");
		}
	} catch (error) {
		console.error("❌ Error en migración addSillaInfantilCountToReservas:", error.message);
	}
};

export default addSillaInfantilCountToReservas;
