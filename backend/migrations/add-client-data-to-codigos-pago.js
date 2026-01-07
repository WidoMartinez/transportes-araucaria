/* eslint-env node */
// Migración para agregar campos de datos del cliente a códigos de pago
import sequelize from "../config/database.js";

const addClientDataToCodigosPago = async () => {
	try {
		console.log("🔄 Verificando campos de cliente en codigos_pago...");

		// Verificar si las columnas ya existen
		const [nombreColumn] = await sequelize.query(`
			SHOW COLUMNS FROM codigos_pago LIKE 'nombre_cliente';
		`);
		const [telefonoColumn] = await sequelize.query(`
			SHOW COLUMNS FROM codigos_pago LIKE 'telefono_cliente';
		`);
		const [direccionColumn] = await sequelize.query(`
			SHOW COLUMNS FROM codigos_pago LIKE 'direccion_cliente';
		`);
		const [reservaVinculadaColumn] = await sequelize.query(`
			SHOW COLUMNS FROM codigos_pago LIKE 'reserva_vinculada_id';
		`);
		const [codigoReservaVinculadoColumn] = await sequelize.query(`
			SHOW COLUMNS FROM codigos_pago LIKE 'codigo_reserva_vinculado';
		`);

		let cambiosRealizados = false;

		// Agregar nombre_cliente si no existe
		if (nombreColumn.length === 0) {
			console.log("📋 Agregando columna nombre_cliente...");
			await sequelize.query(`
				ALTER TABLE codigos_pago
				ADD COLUMN nombre_cliente VARCHAR(255) NULL
				COMMENT 'Nombre del cliente (pre-llenado opcional)';
			`);
			cambiosRealizados = true;
			console.log("✅ Columna nombre_cliente agregada");
		}

		// Agregar telefono_cliente si no existe
		if (telefonoColumn.length === 0) {
			console.log("📋 Agregando columna telefono_cliente...");
			await sequelize.query(`
				ALTER TABLE codigos_pago
				ADD COLUMN telefono_cliente VARCHAR(50) NULL
				COMMENT 'Teléfono del cliente (pre-llenado opcional)';
			`);
			cambiosRealizados = true;
			console.log("✅ Columna telefono_cliente agregada");
		}

		// Agregar direccion_cliente si no existe
		if (direccionColumn.length === 0) {
			console.log("📋 Agregando columna direccion_cliente...");
			await sequelize.query(`
				ALTER TABLE codigos_pago
				ADD COLUMN direccion_cliente TEXT NULL
				COMMENT 'Dirección específica del cliente (pre-llenado opcional)';
			`);
			cambiosRealizados = true;
			console.log("✅ Columna direccion_cliente agregada");
		}

		// Agregar reserva_vinculada_id si no existe
		if (reservaVinculadaColumn.length === 0) {
			console.log("📋 Agregando columna reserva_vinculada_id...");
			await sequelize.query(`
				ALTER TABLE codigos_pago
				ADD COLUMN reserva_vinculada_id INT NULL
				COMMENT 'ID de la reserva original si es un pago adicional';
			`);
			cambiosRealizados = true;
			console.log("✅ Columna reserva_vinculada_id agregada");
		}

		// Agregar codigo_reserva_vinculado si no existe
		if (codigoReservaVinculadoColumn.length === 0) {
			console.log("📋 Agregando columna codigo_reserva_vinculado...");
			await sequelize.query(`
				ALTER TABLE codigos_pago
				ADD COLUMN codigo_reserva_vinculado VARCHAR(50) NULL
				COMMENT 'Código de la reserva original (ej: AR-20260107-0001)';
			`);
			cambiosRealizados = true;
			console.log("✅ Columna codigo_reserva_vinculado agregada");
		}

		// Crear índice para codigo_reserva_vinculado si se agregó la columna
		if (codigoReservaVinculadoColumn.length === 0) {
			try {
				await sequelize.query(`
					CREATE INDEX idx_codigo_reserva_vinculado 
					ON codigos_pago(codigo_reserva_vinculado);
				`);
				console.log("✅ Índice idx_codigo_reserva_vinculado creado");
			} catch (indexError) {
				// Si el índice ya existe o hay error, solo advertir
				console.warn("⚠️ No se pudo crear índice idx_codigo_reserva_vinculado:", indexError.message);
			}
		}

		if (cambiosRealizados) {
			console.log("✅ Migración de datos de cliente completada exitosamente");
		} else {
			console.log("✅ Todas las columnas de datos de cliente ya existen");
		}
	} catch (error) {
		console.error("❌ Error en migración de datos de cliente:", error.message);
		// No lanzamos error para no detener el servidor
	}
};

export default addClientDataToCodigosPago;
