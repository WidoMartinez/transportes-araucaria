import { DataTypes } from "sequelize";

/**
 * Migración para crear la tabla flow_tokens
 */
export default async function addFlowTokensTable(sequelize) {
	const queryInterface = sequelize.getQueryInterface();
	const tableExists = await queryInterface.showAllTables();

	if (!tableExists.includes("flow_tokens")) {
		console.log("🚀 Creando tabla flow_tokens...");
		await queryInterface.createTable("flow_tokens", {
			token: {
				type: DataTypes.STRING(255),
				primaryKey: true,
				allowNull: false,
			},
			reserva_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: {
					model: "reservas",
					key: "id",
				},
				onUpdate: "CASCADE",
				onDelete: "SET NULL",
			},
			amount: {
				type: DataTypes.DECIMAL(10, 2),
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			payment_origin: {
				type: DataTypes.STRING(100),
				allowNull: true,
			},
			metadata: {
				type: DataTypes.JSON,
				allowNull: true,
			},
			expires_at: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			created_at: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			updated_at: {
				type: DataTypes.DATE,
				allowNull: false,
			},
		});

		await queryInterface.addIndex("flow_tokens", ["expires_at"]);
		await queryInterface.addIndex("flow_tokens", ["reserva_id"]);
		console.log("✅ Tabla flow_tokens creada exitosamente.");
	} else {
		console.log("ℹ️ La tabla flow_tokens ya existe.");
	}
}
