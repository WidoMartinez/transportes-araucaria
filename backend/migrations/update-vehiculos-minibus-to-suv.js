/* eslint-env node */
import sequelize from "../config/database.js";

const updateVehiculosMinibusToSuv = async () => {
	try {
		console.log("🔄 Iniciando migración: Minibus → SUV en tabla vehiculos...");

		// 1. Actualizar registros existentes con tipo 'minibus' → 'suv'
		const [result] = await sequelize.query(`
			UPDATE vehiculos SET tipo = 'suv' WHERE tipo = 'minibus';
		`);
		console.log(`✅ Registros actualizados: ${result.affectedRows ?? 0} vehículo(s) cambiado(s) de minibus a suv`);

		// 2. Modificar el ENUM de la columna para eliminar 'minibus' y agregar 'suv'
		console.log("🔄 Actualizando ENUM de la columna tipo...");
		await sequelize.query(`
			ALTER TABLE vehiculos
			MODIFY COLUMN tipo ENUM('sedan', 'van', 'suv') NOT NULL DEFAULT 'sedan';
		`);
		console.log("✅ ENUM actualizado correctamente: sedan, van, suv");

		// 3. Verificar resultado
		const [vehiculos] = await sequelize.query(`
			SELECT tipo, COUNT(*) as total FROM vehiculos GROUP BY tipo;
		`);
		console.log("📊 Estado actual de tipos de vehículos:", vehiculos);

	} catch (error) {
		console.error("❌ Error en migración minibus→suv:", error.message);
		throw error;
	}
};

export default updateVehiculosMinibusToSuv;
