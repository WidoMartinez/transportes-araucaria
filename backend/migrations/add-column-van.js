import sequelize from "./config/database.js";

/**
 * Agrega columna precio_base_van a la tabla destinos
 */
const addColumnVan = async () => {
	try {
		console.log("🔧 Ejecutando migración: Agregar precio_base_van a destinos");

// Verificar si la columna ya existe
		const [columns] = await sequelize.query("SHOW COLUMNS FROM destinos LIKE 'precio_base_van'");
		
		if (columns.length === 0) {
			console.log("Agregando columna precio_base_van...");
			await sequelize.query(`
				ALTER TABLE destinos 
				ADD COLUMN precio_base_van DECIMAL(10, 2) DEFAULT NULL
			`);
			console.log("✅ Columna precio_base_van agregada exitosamente");
		} else {
			console.log("ℹ️ La columna precio_base_van ya existe, omitiendo.");
		}

		return true;
	} catch (error) {
		console.error("❌ Error en migración addColumnVan:", error);
		throw error;
	}
};

// Bloque para ejecución independiente (CLI)
// Verificación simplificada para Windows/Unix
if (process.argv[1] && process.argv[1].includes('add-column-van.js')) {
	addColumnVan()
		.then(async () => {
			console.log("🎉 Ejecución standalone finalizada");
			await sequelize.close();
			process.exit(0);
		})
		.catch(async (error) => {
			console.error("💥 Error fatal en ejecución standalone:", error);
			try { await sequelize.close(); } catch(e) {} 
			process.exit(1);
		});
}

export default addColumnVan;
