/* eslint-env node */
/* global process */
// Migración para agregar columna codigo_reserva a la tabla reservas
import sequelize from "../config/database.js";

async function addCodigoReservaColumn() {
	try {
		console.log("🔄 Iniciando migración: Agregar columna codigo_reserva...");

		// Agregar la columna codigo_reserva si no existe
		await sequelize.query(`
			ALTER TABLE reservas 
			ADD COLUMN IF NOT EXISTS codigo_reserva VARCHAR(50) NULL UNIQUE
			COMMENT 'Código único de reserva (formato: AR-YYYYMMDD-XXXX)';
		`);

		console.log("✅ Columna codigo_reserva agregada exitosamente");

		// Crear índice único si no existe
		await sequelize.query(`
			CREATE UNIQUE INDEX IF NOT EXISTS idx_codigo_reserva 
			ON reservas(codigo_reserva);
		`);

		console.log("✅ Índice único para codigo_reserva creado exitosamente");

		// Generar códigos de reserva para registros existentes
		console.log("🔄 Generando códigos para reservas existentes...");

		const [reservasSinCodigo] = await sequelize.query(`
			SELECT id, created_at 
			FROM reservas 
			WHERE codigo_reserva IS NULL 
			ORDER BY created_at ASC;
		`);

		console.log(`📋 Encontradas ${reservasSinCodigo.length} reservas sin código`);

		// Generar códigos por fecha
		const reservasPorFecha = {};
		
		for (const reserva of reservasSinCodigo) {
			const fecha = new Date(reserva.created_at);
			const año = fecha.getFullYear();
			const mes = String(fecha.getMonth() + 1).padStart(2, '0');
			const dia = String(fecha.getDate()).padStart(2, '0');
			const fechaStr = `${año}${mes}${dia}`;

			if (!reservasPorFecha[fechaStr]) {
				reservasPorFecha[fechaStr] = 0;
			}

			reservasPorFecha[fechaStr]++;
			const consecutivo = String(reservasPorFecha[fechaStr]).padStart(4, '0');
			const codigoReserva = `AR-${fechaStr}-${consecutivo}`;

			// Actualizar la reserva con el código generado
			await sequelize.query(`
				UPDATE reservas 
				SET codigo_reserva = :codigoReserva 
				WHERE id = :id;
			`, {
				replacements: { codigoReserva, id: reserva.id }
			});
		}

		console.log(`✅ Códigos generados para ${reservasSinCodigo.length} reservas existentes`);
		console.log("✅ Migración completada exitosamente");

	} catch (error) {
		console.error("❌ Error en la migración:", error);
		throw error;
	}
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	addCodigoReservaColumn()
		.then(() => {
			console.log("✅ Proceso de migración finalizado");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Error fatal en migración:", error);
			process.exit(1);
		});
}

export default addCodigoReservaColumn;
