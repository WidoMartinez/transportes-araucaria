/* eslint-env node */
// Migración para agregar campo duracion_minutos a códigos de pago
import sequelize from "../config/database.js";

const addDuracionMinutosToCodigosPago = async () => {
	try {
		console.log("🔄 Verificando campo duracion_minutos en codigos_pago...");

		// Verificar si la columna ya existe
		const [duracionColumn] = await sequelize.query(`
			SHOW COLUMNS FROM codigos_pago LIKE 'duracion_minutos';
		`);

		if (duracionColumn.length === 0) {
			console.log("📋 Agregando columna duracion_minutos...");
			await sequelize.query(`
				ALTER TABLE codigos_pago
				ADD COLUMN duracion_minutos INT NULL
				COMMENT 'Duración aproximada del viaje en minutos (para destinos personalizados "Otro")';
			`);
			console.log("✅ Columna duracion_minutos agregada exitosamente");
		} else {
			console.log("✅ Columna duracion_minutos ya existe");
		}
	} catch (error) {
		console.error("❌ Error en migración de duracion_minutos:", error.message);
		// No lanzamos error para no detener el servidor
	}
};

export default addDuracionMinutosToCodigosPago;
