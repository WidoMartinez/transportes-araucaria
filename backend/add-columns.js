import sequelize from "./config/database.js";

async function addColumns() {
	try {
		console.log("🔧 Agregando nuevas columnas a la tabla destinos...");

		// Agregar columnas una por una
		await sequelize.query(`
      ALTER TABLE destinos 
      ADD COLUMN IF NOT EXISTS descripcion TEXT,
      ADD COLUMN IF NOT EXISTS tiempo VARCHAR(255),
      ADD COLUMN IF NOT EXISTS imagen VARCHAR(255),
      ADD COLUMN IF NOT EXISTS max_pasajeros INT DEFAULT 4,
      ADD COLUMN IF NOT EXISTS min_horas_anticipacion INT DEFAULT 5
    `);

		console.log("✅ Columnas agregadas exitosamente");
	} catch (error) {
		console.error("❌ Error agregando columnas:", error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	addColumns()
		.then(() => {
			console.log("🎉 Migración completada");
			process.exit(0);
		})
		.catch((error) => {
			console.error("💥 Error en la migración:", error);
			process.exit(1);
		});
}

export default addColumns;
