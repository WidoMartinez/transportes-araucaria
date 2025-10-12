import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Modelo para almacenar información consolidada de clientes
const Cliente = sequelize.define(
	"Cliente",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		rut: {
			type: DataTypes.STRING(20),
			allowNull: true,
			unique: true,
			comment: "RUT del cliente (formato: 12345678-9)",
		},
		nombre: {
			type: DataTypes.STRING(255),
			allowNull: false,
			comment: "Nombre completo del cliente",
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: true,
			comment: "Email principal del cliente",
		},
		telefono: {
			type: DataTypes.STRING(50),
			allowNull: false,
			comment: "Teléfono de contacto principal",
		},
		esCliente: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			comment:
				"TRUE si ha realizado al menos un pago o fue marcado manualmente como cliente",
		},
		marcadoManualmente: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			comment:
				"TRUE si fue marcado manualmente como cliente (reservas por WhatsApp, etc)",
		},
		totalReservas: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			comment: "Número total de reservas realizadas",
		},
		totalPagos: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			comment: "Número total de pagos completados",
		},
		totalGastado: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0,
			comment: "Total gastado en reservas pagadas",
		},
		primeraReserva: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			comment: "Fecha de la primera reserva",
		},
		ultimaReserva: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			comment: "Fecha de la última reserva",
		},
		notas: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Notas adicionales sobre el cliente",
		},
	},
	{
		tableName: "clientes",
		timestamps: true,
		indexes: [
			{ fields: ["email"] },
			{ fields: ["rut"] },
			{ fields: ["esCliente"] },
			{ fields: ["telefono"] },
		],
	}
);

export default Cliente;
