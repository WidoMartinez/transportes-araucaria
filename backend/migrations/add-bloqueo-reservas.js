/* eslint-env node */
// Migración para agregar campos de bloqueo de reservas a la tabla festivos
import sequelize from "../config/database.js";

const addBloqueoReservas = async () => {
	try {
		console.log("🔄 Agregando campos de bloqueo de reservas a tabla festivos...");

		// Verificar si la tabla festivos existe
		const [tables] = await sequelize.query(`
			SHOW TABLES LIKE 'festivos';
		`);

		if (tables.length === 0) {
			console.log("⚠️  Tabla festivos no existe. Ejecute primero add-festivos-table.js");
			return;
		}

		// Verificar columnas existentes
		const [columns] = await sequelize.query(`
			SHOW COLUMNS FROM festivos;
		`);

		const columnNames = columns.map(col => col.Field);

		// Agregar columna bloqueaReservas si no existe
		if (!columnNames.includes('bloquea_reservas')) {
			console.log("📋 Agregando columna bloquea_reservas...");
			await sequelize.query(`
				ALTER TABLE festivos 
				ADD COLUMN bloquea_reservas BOOLEAN DEFAULT FALSE 
				COMMENT 'Indica si la fecha bloquea reservas';
			`);
			console.log("✅ Columna bloquea_reservas agregada");
		} else {
			console.log("ℹ️  Columna bloquea_reservas ya existe");
		}

		// Agregar columna horaInicio si no existe
		if (!columnNames.includes('hora_inicio')) {
			console.log("📋 Agregando columna hora_inicio...");
			await sequelize.query(`
				ALTER TABLE festivos 
				ADD COLUMN hora_inicio TIME NULL 
				COMMENT 'Hora de inicio del bloqueo (NULL = todo el día)';
			`);
			console.log("✅ Columna hora_inicio agregada");
		} else {
			console.log("ℹ️  Columna hora_inicio ya existe");
		}

		// Agregar columna horaFin si no existe
		if (!columnNames.includes('hora_fin')) {
			console.log("📋 Agregando columna hora_fin...");
			await sequelize.query(`
				ALTER TABLE festivos 
				ADD COLUMN hora_fin TIME NULL 
				COMMENT 'Hora de fin del bloqueo (NULL = todo el día)';
			`);
			console.log("✅ Columna hora_fin agregada");
		} else {
			console.log("ℹ️  Columna hora_fin ya existe");
		}

		// Agregar columna aplicaSoloDestinos si no existe
		if (!columnNames.includes('aplica_solo_destinos')) {
			console.log("📋 Agregando columna aplica_solo_destinos...");
			await sequelize.query(`
				ALTER TABLE festivos 
				ADD COLUMN aplica_solo_destinos JSON NULL 
				COMMENT 'Array de destinos afectados (NULL = todos los destinos)';
			`);
			console.log("✅ Columna aplica_solo_destinos agregada");
		} else {
			console.log("ℹ️  Columna aplica_solo_destinos ya existe");
		}

		// Agregar índice para bloquea_reservas si no existe
		const [indexes] = await sequelize.query(`
			SHOW INDEX FROM festivos WHERE Key_name = 'idx_bloquea_reservas';
		`);

		if (indexes.length === 0) {
			console.log("📋 Agregando índice para bloquea_reservas...");
			await sequelize.query(`
				ALTER TABLE festivos 
				ADD INDEX idx_bloquea_reservas (bloquea_reservas);
			`);
			console.log("✅ Índice agregado");
		} else {
			console.log("ℹ️  Índice para bloquea_reservas ya existe");
		}

		// Insertar el 1 de enero de 2026 como fecha bloqueada por defecto
		console.log("📋 Verificando fecha bloqueada por defecto (1 de enero 2026)...");
		
		const [existingDate] = await sequelize.query(`
			SELECT id FROM festivos 
			WHERE fecha = '2026-01-01';
		`);

		if (existingDate.length === 0) {
			await sequelize.query(`
				INSERT INTO festivos (
					fecha, 
					nombre, 
					tipo, 
					recurrente, 
					bloquea_reservas, 
					activo, 
					descripcion
				) VALUES (
					'2026-01-01',
					'Año Nuevo',
					'feriado_nacional',
					TRUE,
					TRUE,
					TRUE,
					'Fecha bloqueada para reservas - Año Nuevo 2026'
				);
			`);
			console.log("✅ Fecha bloqueada insertada: 1 de enero 2026");
		} else {
			// Si ya existe, actualizar para asegurar que bloquea reservas
			await sequelize.query(`
				UPDATE festivos 
				SET bloquea_reservas = TRUE,
				    descripcion = 'Fecha bloqueada para reservas - Año Nuevo 2026'
				WHERE fecha = '2026-01-01';
			`);
			console.log("✅ Fecha actualizada: 1 de enero 2026 ahora bloquea reservas");
		}

		console.log("✅ Migración de bloqueo de reservas completada exitosamente");
	} catch (error) {
		console.error("❌ Error en migración de bloqueo de reservas:", error.message);
		throw error;
	}
};

export default addBloqueoReservas;
