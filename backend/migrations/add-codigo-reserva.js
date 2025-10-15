/* eslint-env node */
/* global process */
/**
 * Migración para agregar el campo codigo_reserva a la tabla reservas
 * Este campo almacenará un código legible único para cada reserva (formato: RES-YYYYMMDD-XXXX)
 */

import sequelize from "../config/database.js";

async function addCodigoReserva() {
	const queryInterface = sequelize.getQueryInterface();

	try {
		console.log("🚀 Iniciando migración para agregar codigo_reserva...");

		// Verificar si la columna ya existe
		const tableDescription = await queryInterface.describeTable("reservas");
		
		if (!tableDescription.codigo_reserva) {
			console.log("📦 Agregando columna codigo_reserva a la tabla reservas...");
			
			await queryInterface.addColumn("reservas", "codigo_reserva", {
				type: sequelize.Sequelize.STRING(50),
				allowNull: true,
				unique: true,
				comment: "Código único de reserva legible (formato: RES-YYYYMMDD-XXXX)",
			});

			console.log("✅ Columna codigo_reserva agregada exitosamente");

			// Agregar índice único
			try {
				console.log("📦 Agregando índice único para codigo_reserva...");
				await queryInterface.addIndex("reservas", ["codigo_reserva"], {
					name: "idx_reservas_codigo_reserva",
					unique: true,
				});
				console.log("✅ Índice agregado exitosamente");
			} catch (indexError) {
				console.log("ℹ️  Índice ya existe o no se pudo crear:", indexError.message);
			}

			// Generar códigos para reservas existentes que no tengan uno
			console.log("📦 Generando códigos para reservas existentes...");
			
			const Reserva = sequelize.models.Reserva;
			const reservasSinCodigo = await Reserva.findAll({
				where: {
					codigoReserva: null
				},
				order: [['createdAt', 'ASC']]
			});

			console.log(`📊 Encontradas ${reservasSinCodigo.length} reservas sin código`);

			for (const reserva of reservasSinCodigo) {
				// Generar código basado en la fecha de creación de la reserva
				const fecha = new Date(reserva.createdAt);
				const year = fecha.getFullYear();
				const month = String(fecha.getMonth() + 1).padStart(2, '0');
				const day = String(fecha.getDate()).padStart(2, '0');
				const fechaStr = `${year}${month}${day}`;
				
				// Usar el ID como parte del código para garantizar unicidad
				const contador = String(reserva.id).padStart(4, '0');
				const codigoReserva = `RES-${fechaStr}-${contador}`;
				
				await reserva.update({ codigoReserva });
			}

			console.log("✅ Códigos generados para todas las reservas existentes");
		} else {
			console.log("ℹ️  La columna codigo_reserva ya existe");
		}

		console.log("✅ Migración completada exitosamente");
	} catch (error) {
		console.error("❌ Error en la migración:", error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

// Ejecutar la migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	addCodigoReserva()
		.then(() => {
			console.log("✅ Migración ejecutada correctamente");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Error ejecutando migración:", error);
			process.exit(1);
		});
}

export default addCodigoReserva;
