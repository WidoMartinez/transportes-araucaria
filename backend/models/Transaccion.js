import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo para registrar el historial de transacciones de pago
 * Cada registro representa un pago individual asociado a una reserva
 */
const Transaccion = sequelize.define(
	"Transaccion",
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
			comment: "ID de la reserva asociada (FK)",
		},
		codigoPagoId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "codigo_pago_id",
			comment: "ID del código de pago usado (FK, nullable)",
		},
		monto: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			comment: "Monto de esta transacción específica",
		},
		gateway: {
			type: DataTypes.STRING(50),
			allowNull: false,
			defaultValue: "flow",
			comment: "Gateway de pago utilizado (flow, transferencia, efectivo)",
		},
		transaccionId: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "transaccion_id",
			comment: "ID de la transacción en el gateway (ej: flowOrder)",
		},
		referencia: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "Referencia del código de pago (ej: PX-KRK9CT)",
		},
		tipoPago: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: "tipo_pago",
			comment: "Tipo de pago (abono, saldo, total, diferencia)",
		},
		estado: {
			type: DataTypes.ENUM("pendiente", "aprobado", "fallido", "reembolsado"),
			defaultValue: "aprobado",
			comment: "Estado de la transacción",
		},
		emailPagador: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "email_pagador",
			comment: "Email del pagador (puede diferir del cliente)",
		},
		metadata: {
			type: DataTypes.JSON,
			allowNull: true,
			comment: "Datos adicionales del gateway (JSON)",
		},
		notas: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Notas adicionales sobre la transacción",
		},
	},
	{
		tableName: "transacciones",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
		indexes: [
			{ fields: ["reserva_id"] },
			{ fields: ["codigo_pago_id"] },
			{ fields: ["transaccion_id"] },
			{ fields: ["gateway"] },
			{ fields: ["estado"] },
			{ fields: ["created_at"] },
		],
	}
);

export default Transaccion;
