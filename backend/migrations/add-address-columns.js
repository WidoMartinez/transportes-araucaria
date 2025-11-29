import sequelize from "../config/database.js";

const addAddressColumns = async () => {
	try {
		console.log("🔄 Verificando columnas de dirección en reservas...");

		const [columns] = await sequelize.query(`
			SHOW COLUMNS FROM reservas LIKE 'direccion_origen';
		`);

		if (columns.length === 0) {
			console.log("📋 Agregando columnas de dirección...");

			await sequelize.query(`
				ALTER TABLE reservas 
				ADD COLUMN direccion_origen VARCHAR(255) NULL COMMENT 'Dirección específica de origen',
				ADD COLUMN direccion_destino VARCHAR(255) NULL COMMENT 'Dirección específica de destino';
			`);

			console.log("✅ Columnas de dirección agregadas exitosamente");
		} else {
			console.log("✅ Columnas de dirección ya existen");
		}
	} catch (error) {
		console.error("❌ Error en migración de direcciones:", error);
	}
};

export default addAddressColumns;
