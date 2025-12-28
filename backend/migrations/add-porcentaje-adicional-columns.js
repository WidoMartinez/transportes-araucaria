import sequelize from "./config/database.js";

async function addPorcentajeAdicionalColumns() {
	try {
		console.log("🔧 Agregando columnas de porcentaje adicional a la tabla destinos...");

		// Agregar columnas para porcentajes adicionales
		await sequelize.query(`
      ALTER TABLE destinos 
      ADD COLUMN IF NOT EXISTS porcentaje_adicional_auto DECIMAL(5,4) DEFAULT 0.1,
      ADD COLUMN IF NOT EXISTS porcentaje_adicional_van DECIMAL(5,4) DEFAULT 0.05
    `);

		console.log("✅ Columnas de porcentaje adicional agregadas exitosamente");
		console.log("   - porcentaje_adicional_auto: DECIMAL(5,4) DEFAULT 0.1");
		console.log("   - porcentaje_adicional_van: DECIMAL(5,4) DEFAULT 0.05");
	} catch (error) {
		console.error("❌ Error agregando columnas:", error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	addPorcentajeAdicionalColumns()
		.then(() => {
			console.log("🎉 Migración completada");
			process.exit(0);
		})
		.catch((error) => {
			console.error("💥 Error en la migración:", error);
			process.exit(1);
		});
}

export default addPorcentajeAdicionalColumns;
