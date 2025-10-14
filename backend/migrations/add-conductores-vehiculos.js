/**
 * Migración para agregar tablas de conductores y vehículos
 * - Agrega tabla conductores
 * - Agrega tabla vehiculos
 * - Agrega tabla viajes_conductor
 * - Agrega campos conductorId y vehiculoId a la tabla reservas
 */

import "dotenv/config";
import sequelize from "../config/database.js";

/**
 * Ejecuta la migración
 */
async function addConductoresVehiculos() {
	const queryInterface = sequelize.getQueryInterface();

	try {
		console.log("🔧 Iniciando migración: agregar conductores y vehículos...");

		// Verificar tablas existentes
		// Obtener todas las tablas y normalizar los nombres para evitar problemas de mayúsculas/minúsculas
		const tablesRaw = await queryInterface.showAllTables();
		const tables = tablesRaw.map((t) => t.toString().toLowerCase());

		// Verificar si existen las tablas conductores y vehiculos
		const conductoresExists = tables.includes("conductores");
		const vehiculosExists = tables.includes("vehiculos");
		const viajesExists =
			tables.includes("viajes_conductor") || tables.includes("ViajesConductor");

		// ===== CREAR TABLA CONDUCTORES =====
		if (!conductoresExists) {
			console.log("📦 Creando tabla conductores...");
			await queryInterface.createTable("conductores", {
				id: {
					type: sequelize.Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true,
				},
				nombre: {
					type: sequelize.Sequelize.STRING(255),
					allowNull: false,
				},
				telefono: {
					type: sequelize.Sequelize.STRING(50),
					allowNull: false,
				},
				email: {
					type: sequelize.Sequelize.STRING(255),
					allowNull: true,
				},
				notas: {
					type: sequelize.Sequelize.TEXT,
					allowNull: true,
				},
				activo: {
					type: sequelize.Sequelize.BOOLEAN,
					defaultValue: true,
				},
				createdAt: {
					type: sequelize.Sequelize.DATE,
					allowNull: false,
					defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
				},
				updatedAt: {
					type: sequelize.Sequelize.DATE,
					allowNull: false,
					defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
				},
			});
			console.log("✅ Tabla conductores creada");

			// Agregar índices para conductores
			await queryInterface.addIndex("conductores", ["nombre"], {
				name: "idx_conductores_nombre",
			});
			await queryInterface.addIndex("conductores", ["activo"], {
				name: "idx_conductores_activo",
			});
			console.log("✅ Índices de conductores creados");
		} else {
			console.log("ℹ️  Tabla conductores ya existe, omitiendo...");
		}

		// ===== CREAR TABLA VEHICULOS =====
		if (!vehiculosExists) {
			console.log("📦 Creando tabla vehiculos...");
			await queryInterface.createTable("vehiculos", {
				id: {
					type: sequelize.Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true,
				},
				patente: {
					type: sequelize.Sequelize.STRING(10),
					allowNull: false,
					unique: true,
				},
				tipo: {
					type: sequelize.Sequelize.ENUM("Sedan", "SUV", "Van", "Minibus"),
					allowNull: false,
				},
				capacidad: {
					type: sequelize.Sequelize.INTEGER,
					allowNull: false,
					defaultValue: 4,
				},
				marca: {
					type: sequelize.Sequelize.STRING(100),
					allowNull: true,
				},
				modelo: {
					type: sequelize.Sequelize.STRING(100),
					allowNull: true,
				},
				anio: {
					type: sequelize.Sequelize.INTEGER,
					allowNull: true,
				},
				notas: {
					type: sequelize.Sequelize.TEXT,
					allowNull: true,
				},
				activo: {
					type: sequelize.Sequelize.BOOLEAN,
					defaultValue: true,
				},
				createdAt: {
					type: sequelize.Sequelize.DATE,
					allowNull: false,
					defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
				},
				updatedAt: {
					type: sequelize.Sequelize.DATE,
					allowNull: false,
					defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
				},
			});
			console.log("✅ Tabla vehiculos creada");

			// Agregar índices para vehiculos
			await queryInterface.addIndex("vehiculos", ["patente"], {
				name: "idx_vehiculos_patente",
			});
			await queryInterface.addIndex("vehiculos", ["tipo"], {
				name: "idx_vehiculos_tipo",
			});
			await queryInterface.addIndex("vehiculos", ["activo"], {
				name: "idx_vehiculos_activo",
			});
			console.log("✅ Índices de vehiculos creados");
		} else {
			console.log("ℹ️  Tabla vehiculos ya existe, omitiendo...");
		}

		// ===== CREAR TABLA VIAJES_CONDUCTOR =====
		if (!viajesExists) {
			console.log("📦 Creando tabla viajes_conductor...");
			await queryInterface.createTable("viajes_conductor", {
				id: {
					type: sequelize.Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true,
				},
				conductor_id: {
					type: sequelize.Sequelize.INTEGER,
					allowNull: false,
				},
				vehiculo_id: {
					type: sequelize.Sequelize.INTEGER,
					allowNull: false,
				},
				reserva_id: {
					type: sequelize.Sequelize.INTEGER,
					allowNull: false,
				},
				monto_pago: {
					type: sequelize.Sequelize.DECIMAL(10, 2),
					allowNull: true,
					defaultValue: 0,
				},
				notas: {
					type: sequelize.Sequelize.TEXT,
					allowNull: true,
				},
				createdAt: {
					type: sequelize.Sequelize.DATE,
					allowNull: false,
					defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
				},
				updatedAt: {
					type: sequelize.Sequelize.DATE,
					allowNull: false,
					defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
				},
			});
			console.log("✅ Tabla viajes_conductor creada");

			// Agregar índices para viajes_conductor
			await queryInterface.addIndex("viajes_conductor", ["conductor_id"], {
				name: "idx_viajes_conductor_id",
			});
			await queryInterface.addIndex("viajes_conductor", ["vehiculo_id"], {
				name: "idx_viajes_vehiculo_id",
			});
			await queryInterface.addIndex("viajes_conductor", ["reserva_id"], {
				name: "idx_viajes_reserva_id",
			});
			await queryInterface.addIndex("viajes_conductor", ["createdAt"], {
				name: "idx_viajes_created_at",
			});
			console.log("✅ Índices de viajes_conductor creados");
		} else {
			console.log("ℹ️  Tabla viajes_conductor ya existe, omitiendo...");
		}

		// ===== AGREGAR CAMPOS A TABLA RESERVAS =====
		const reservasColumns = await queryInterface.describeTable("reservas");

		if (!reservasColumns.conductor_id) {
			console.log("📦 Agregando campo conductor_id a reservas...");
			await queryInterface.addColumn("reservas", "conductor_id", {
				type: sequelize.Sequelize.INTEGER,
				allowNull: true,
			});
			console.log("✅ Campo conductor_id agregado");

			// Agregar índice
			await queryInterface.addIndex("reservas", ["conductor_id"], {
				name: "idx_reservas_conductor_id",
			});
			console.log("✅ Índice conductor_id creado");
		} else {
			console.log("ℹ️  Campo conductor_id ya existe en reservas");
		}

		if (!reservasColumns.vehiculo_id) {
			console.log("📦 Agregando campo vehiculo_id a reservas...");
			await queryInterface.addColumn("reservas", "vehiculo_id", {
				type: sequelize.Sequelize.INTEGER,
				allowNull: true,
			});
			console.log("✅ Campo vehiculo_id agregado");

			// Agregar índice
			await queryInterface.addIndex("reservas", ["vehiculo_id"], {
				name: "idx_reservas_vehiculo_id",
			});
			console.log("✅ Índice vehiculo_id creado");
		} else {
			console.log("ℹ️  Campo vehiculo_id ya existe en reservas");
		}

		console.log("✅ Migración completada exitosamente");
	} catch (error) {
		console.error("❌ Error en la migración:", error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

// Ejecutar migración
addConductoresVehiculos()
	.then(() => {
		console.log("✅ Proceso completado");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Proceso falló:", error);
		process.exit(1);
	});
