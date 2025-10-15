// Migración para agregar campo codigo_reserva a la tabla reservas
import sequelize from "../config/database.js";
import process from "process";

/**
 * Migración para agregar código único de reserva
 * - Agrega campo codigo_reserva a la tabla reservas
 * - Agrega índice único para el campo
 */
async function addCodigoReserva() {
	const queryInterface = sequelize.getQueryInterface();

	try {
		console.log("🔧 Iniciando migración: agregar código de reserva...");

		// Verificar si el campo codigo_reserva existe en reservas
		const reservasColumns = await queryInterface
			.describeTable("reservas")
			.catch(() => ({}));

		if (!reservasColumns.codigo_reserva) {
			console.log("📦 Agregando campo codigo_reserva a reservas...");
			await queryInterface.addColumn("reservas", "codigo_reserva", {
				type: sequelize.Sequelize.STRING(50),
				allowNull: true,
				unique: true,
				comment: "Código único de reserva (formato: AR-YYYYMMDD-XXXX)",
			});
			console.log("✅ Campo codigo_reserva agregado");
		} else {
			console.log("ℹ️  Campo codigo_reserva ya existe en reservas");
		}

		// Agregar índice único si no existe
		try {
			console.log("📦 Agregando índice único a codigo_reserva...");
			await queryInterface
				.addIndex("reservas", ["codigo_reserva"], {
					name: "idx_reservas_codigo_reserva",
					unique: true,
				})
				.catch(() => {
					console.log("ℹ️  Índice idx_reservas_codigo_reserva ya existe");
				});
			console.log("✅ Índice agregado");
		} catch {
			console.log("ℹ️  Índice ya existe, continuando...");
		}

		console.log("✅ Migración completada exitosamente");
	} catch (error) {
		console.error("❌ Error en la migración:", error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

// Ejecutar la migración
addCodigoReserva()
	.then(() => {
		console.log("🎉 Migración finalizada exitosamente");
		process.exit(0);
	})
	.catch((error) => {
		console.error("💥 Error fatal en migración:", error);
		console.error("Stack trace:", error.stack);
		process.exit(1);
	});
