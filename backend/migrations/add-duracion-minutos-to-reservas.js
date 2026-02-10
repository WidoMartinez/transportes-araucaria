/* eslint-env node */
// Migración para agregar campo duracion_minutos a reservas
import sequelize from "../config/database.js";

const addDuracionMinutosToReservas = async () => {
	try {
		console.log("🔄 Verificando campo duracion_minutos en reservas...");

		// Verificar si la columna ya existe
		const [duracionColumn] = await sequelize.query(`
			SHOW COLUMNS FROM reservas LIKE 'duracion_minutos';
		`);

		if (duracionColumn.length === 0) {
			console.log("📋 Agregando columna duracion_minutos a tabla reservas...");
			await sequelize.query(`
				ALTER TABLE reservas
				ADD COLUMN duracion_minutos INT NULL
				COMMENT 'Duración aproximada del viaje en minutos (proveniente de código de pago o manual)';
			`);
			console.log("✅ Columna duracion_minutos agregada exitosamente a reservas");
		} else {
			console.log("✅ Columna duracion_minutos ya existe en reservas");
		}
	} catch (error) {
		console.error("❌ Error en migración de duracion_minutos en reservas:", error.message);
	}
};

export default addDuracionMinutosToReservas;
