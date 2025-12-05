import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PendingEmail = sequelize.define(
	"PendingEmail",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		reservaId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "reserva_id",
			references: {
				model: "reservas",
				key: "id",
			},
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "discount_offer", // discount_offer, reminder, etc.
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "pending", // pending, sent, cancelled, failed
		},
		scheduledAt: {
			type: DataTypes.DATE,
			allowNull: false,
			field: "scheduled_at",
		},
		sentAt: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "sent_at",
		},
		attempts: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		lastError: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
	},
	{
		tableName: "pending_emails",
		timestamps: true,
		indexes: [
			{
				fields: ["status", "scheduledAt"],
			},
			{
				fields: ["reservaId"],
			},
		],
	}
);

export default PendingEmail;
