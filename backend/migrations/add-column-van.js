/* eslint-env node */
import sequelize from "../config/database.js";

const addColumnVan = async () => {
	try {
		console.log("🔄 Verificando columna precio_base_van en destinos...");

		const [columns] = await sequelize.query(`
			SHOW COLUMNS FROM destinos LIKE 'precio_base_van';
		`);

		if (columns.length === 0) {
			console.log("📋 Agregando columna precio_base_van...");
			await sequelize.query(`
				ALTER TABLE destinos 
				ADD COLUMN precio_base_van DECIMAL(10, 2) DEFAULT NULL
			`);
			console.log("✅ Columna precio_base_van agregada exitosamente");
		} else {
			console.log("✅ Columna precio_base_van ya existe");
		}
	} catch (error) {
		console.error("❌ Error en migración de precio_base_van:", error.message);
	}
};

export default addColumnVan;
