/* eslint-env node */
// Migración para agregar campos de tarifa dinámica a la tabla de reservas
import sequelize from "../config/database.js";

const addTarifaDinamicaFields = async () => {
	try {
		console.log("🔄 Verificando campos de tarifa dinámica en reservas...");

		// Verificar si los campos ya existen
		const [columns] = await sequelize.query(`
			SHOW COLUMNS FROM reservas LIKE 'ajuste_tarifa_dinamica';
		`);

		if (columns.length === 0) {
			console.log("📋 Agregando campos de tarifa dinámica a reservas...");

			await sequelize.query(`
				ALTER TABLE reservas
				ADD COLUMN ajuste_tarifa_dinamica DECIMAL(10, 2) DEFAULT 0 COMMENT 'Monto del ajuste de tarifa dinámica aplicado',
				ADD COLUMN porcentaje_tarifa_dinamica DECIMAL(5, 2) DEFAULT 0 COMMENT 'Porcentaje total de ajuste de tarifa dinámica aplicado',
				ADD COLUMN detalle_ajustes_tarifa JSON DEFAULT NULL COMMENT 'JSON con desglose de ajustes de tarifa dinámica aplicados';
			`);

			console.log("✅ Campos de tarifa dinámica agregados exitosamente");
		} else {
			console.log("✅ Campos de tarifa dinámica ya existen");
		}

		console.log("✅ Migración de campos de tarifa dinámica completada");
	} catch (error) {
		console.error(
			"❌ Error en migración de campos de tarifa dinámica:",
			error.message
		);
		throw error;
	}
};

export default addTarifaDinamicaFields;
