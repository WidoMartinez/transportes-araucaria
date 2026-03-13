import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo para almacenar temporalmente los tokens de Flow y sus datos asociados.
 * Esto permite recuperar el monto y la reserva incluso si la API de Flow falla
 * durante la redirección de retorno.
 */
const FlowToken = sequelize.define(
	"FlowToken",
	{
		token: {
			type: DataTypes.STRING(255),
			primaryKey: true,
			allowNull: false,
			comment: "Token entregado por Flow",
		},
		reservaId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "reserva_id",
			comment: "ID de la reserva asociada",
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			comment: "Monto del pago",
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: true,
			comment: "Email del pagador",
		},
		paymentOrigin: {
			type: DataTypes.STRING(100),
			allowNull: true,
			field: "payment_origin",
			comment: "Origen del flujo de pago",
		},
		metadata: {
			type: DataTypes.JSON,
			allowNull: true,
			comment: "Datos adicionales",
		},
		expiresAt: {
			type: DataTypes.DATE,
			allowNull: false,
			field: "expires_at",
			comment: "Fecha de expiración para limpieza",
		},
	},
	{
		tableName: "flow_tokens",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
		indexes: [
			{ fields: ["expires_at"] },
			{ fields: ["reserva_id"] },
		],
	}
);

export default FlowToken;
