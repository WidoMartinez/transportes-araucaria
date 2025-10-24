import sequelize from "../config/database.js";
import { QueryInterface } from "sequelize";
import process from "process";

/**
 * Migración para agregar campos relacionados con clientes
 * - Agrega tabla clientes usando Sequelize (compatible con MySQL y PostgreSQL)
 * - Agrega campos clienteId y rut a la tabla reservas
 */
async function addClienteFields() {
	const queryInterface = sequelize.getQueryInterface();

	try {
		console.log("🔧 Iniciando migración: agregar campos de cliente...");

		// Verificar si la tabla clientes ya existe
		const tables = await queryInterface.showAllTables();
		const clientesExists = tables.includes("clientes") || tables.includes("Clientes");

		if (!clientesExists) {
			console.log("📦 Creando tabla clientes...");
			await queryInterface.createTable("clientes", {
				id: {
					type: sequelize.Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true,
				},
				rut: {
					type: sequelize.Sequelize.STRING(20),
					allowNull: true,
				},
				nombre: {
					type: sequelize.Sequelize.STRING(255),
					allowNull: false,
				},
				email: {
					type: sequelize.Sequelize.STRING(255),
					allowNull: false,
				},
				telefono: {
					type: sequelize.Sequelize.STRING(50),
					allowNull: false,
				},
				esCliente: {
					type: sequelize.Sequelize.BOOLEAN,
					defaultValue: false,
				},
				marcadoManualmente: {
					type: sequelize.Sequelize.BOOLEAN,
					defaultValue: false,
				},
				totalReservas: {
					type: sequelize.Sequelize.INTEGER,
					defaultValue: 0,
				},
				totalPagos: {
					type: sequelize.Sequelize.INTEGER,
					defaultValue: 0,
				},
				totalGastado: {
					type: sequelize.Sequelize.DECIMAL(10, 2),
					defaultValue: 0,
				},
				primeraReserva: {
					type: sequelize.Sequelize.DATEONLY,
					allowNull: true,
				},
				ultimaReserva: {
					type: sequelize.Sequelize.DATEONLY,
					allowNull: true,
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

			// Agregar índices
			await queryInterface.addIndex("clientes", ["email"], { name: "idx_clientes_email" });
			await queryInterface.addIndex("clientes", ["rut"], { name: "idx_clientes_rut" });
			await queryInterface.addIndex("clientes", ["esCliente"], { name: "idx_clientes_esCliente" });
			await queryInterface.addIndex("clientes", ["telefono"], { name: "idx_clientes_telefono" });

			console.log("✅ Tabla clientes creada");
		} else {
			console.log("ℹ️  Tabla clientes ya existe, omitiendo creación");
		}

		// Verificar si el campo cliente_id existe en reservas (snake_case en MySQL)
		const reservasColumns = await queryInterface.describeTable("reservas").catch(() => ({}));

		if (!reservasColumns.cliente_id && !reservasColumns.clienteId) {
			console.log("📦 Agregando campo cliente_id a reservas...");
			await queryInterface.addColumn("reservas", "cliente_id", {
				type: sequelize.Sequelize.INTEGER,
				allowNull: true,
			});
			console.log("✅ Campo cliente_id agregado");
		} else {
			console.log("ℹ️  Campo cliente_id ya existe en reservas");
		}

		if (!reservasColumns.rut) {
			console.log("📦 Agregando campo rut a reservas...");
			await queryInterface.addColumn("reservas", "rut", {
				type: sequelize.Sequelize.STRING(20),
				allowNull: true,
			});
			console.log("✅ Campo rut agregado");
		} else {
			console.log("ℹ️  Campo rut ya existe en reservas");
		}

		// Agregar índices a reservas si no existen (usando snake_case)
		try {
			console.log("📦 Agregando índices a reservas...");
			await queryInterface.addIndex("reservas", ["cliente_id"], {
				name: "idx_reservas_cliente_id",
			}).catch(() => {
				console.log("ℹ️  Índice idx_reservas_cliente_id ya existe");
			});

			await queryInterface.addIndex("reservas", ["rut"], {
				name: "idx_reservas_rut",
			}).catch(() => {
				console.log("ℹ️  Índice idx_reservas_rut ya existe");
			});
			console.log("✅ Índices agregados");
		} catch {
			console.log("ℹ️  Algunos índices ya existen, continuando...");
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
addClienteFields()
	.then(() => {
		console.log("🎉 Migración finalizada exitosamente");
		process.exit(0);
	})
	.catch((error) => {
		console.error("💥 Error fatal en migración:", error);
		console.error("Stack trace:", error.stack);
		process.exit(1); // Salir con error para detener el despliegue
	});
