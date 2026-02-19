/* eslint-env node */
import sequelize from "../config/database.js";

const addUpgradeVanToReservas = async () => {
	try {
		console.log("🔄 Verificando columna upgrade_van en reservas...");

		const [columns] = await sequelize.query(`
			SHOW COLUMNS FROM reservas LIKE 'upgrade_van';
		`);

		if (columns.length === 0) {
			console.log("📋 Agregando columna upgrade_van...");
			await sequelize.query(`
				ALTER TABLE reservas 
				ADD COLUMN upgrade_van TINYINT(1) DEFAULT 0
				COMMENT 'Indica si el cliente solicitó un upgrade voluntario a Van'
			`);
			console.log("✅ Columna upgrade_van agregada exitosamente");
		} else {
			console.log("✅ Columna upgrade_van ya existe");
		}
	} catch (error) {
		console.error("❌ Error en migración de upgrade_van:", error.message);
	}
};

export default addUpgradeVanToReservas;
