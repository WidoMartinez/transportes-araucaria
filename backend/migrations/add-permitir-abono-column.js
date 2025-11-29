/* eslint-env node */
import sequelize from "../config/database.js";

const addPermitirAbonoColumn = async () => {
	try {
		console.log("🔄 Verificando columna permitir_abono en codigos_pago...");

		const [columns] = await sequelize.query(`
			SHOW COLUMNS FROM codigos_pago LIKE 'permitir_abono';
		`);

		if (columns.length === 0) {
			console.log("📋 Agregando columna permitir_abono...");
			await sequelize.query(`
				ALTER TABLE codigos_pago
				ADD COLUMN permitir_abono BOOLEAN DEFAULT FALSE
				COMMENT 'Si permite pagar solo el 40% como abono';
			`);
			console.log("✅ Columna permitir_abono agregada exitosamente");
		} else {
			console.log("✅ Columna permitir_abono ya existe");
		}
	} catch (error) {
		console.error("❌ Error en migración de permitir_abono:", error.message);
		// No lanzamos error para no detener el servidor si es algo menor,
		// pero idealmente deberíamos manejarlo.
	}
};

export default addPermitirAbonoColumn;
