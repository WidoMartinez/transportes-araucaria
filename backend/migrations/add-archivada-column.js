/* eslint-env node */
import sequelize from "../config/database.js";

const addArchivadaColumn = async () => {
	try {
		console.log("🔄 Verificando columna archivada en reservas...");

		const [columns] = await sequelize.query(`
			SHOW COLUMNS FROM reservas LIKE 'archivada';
		`);

		if (columns.length === 0) {
			console.log("📋 Agregando columna archivada...");
			await sequelize.query(`
				ALTER TABLE reservas
				ADD COLUMN archivada BOOLEAN DEFAULT FALSE NOT NULL
				COMMENT 'Indica si la reserva ha sido archivada';
			`);
			console.log("✅ Columna archivada agregada exitosamente");
		} else {
			console.log("✅ Columna archivada ya existe");
		}
	} catch (error) {
		console.error("❌ Error en migración de archivada:", error.message);
	}
};

export default addArchivadaColumn;
