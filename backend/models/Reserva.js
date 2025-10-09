import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Reserva = sequelize.define(
	"Reserva",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		nombre: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		telefono: {
			type: DataTypes.STRING(50),
			allowNull: false,
		},
		origen: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		destino: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		fecha: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		hora: {
			type: DataTypes.TIME,
			allowNull: true,
			defaultValue: "08:00:00",
		},
		pasajeros: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
		precio: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			defaultValue: 0,
		},
		vehiculo: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		numeroVuelo: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		hotel: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		equipajeEspecial: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		sillaInfantil: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		idaVuelta: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		fechaRegreso: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		horaRegreso: {
			type: DataTypes.TIME,
			allowNull: true,
		},
		abonoSugerido: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		saldoPendiente: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		descuentoBase: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		descuentoPromocion: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		descuentoRoundTrip: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		descuentoOnline: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		totalConDescuento: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		mensaje: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		source: {
			type: DataTypes.STRING(100),
			allowNull: true,
			defaultValue: "web",
		},
		estado: {
			type: DataTypes.ENUM(
				"pendiente",
				"pendiente_detalles",
				"confirmada",
				"cancelada",
				"completada"
			),
			defaultValue: "pendiente",
		},
		ipAddress: {
			type: DataTypes.STRING(45),
			allowNull: true,
		},
		userAgent: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		codigoDescuento: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		metodoPago: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		estadoPago: {
			type: DataTypes.ENUM("pendiente", "pagado", "fallido", "reembolsado"),
			defaultValue: "pendiente",
		},
		referenciaPago: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		observaciones: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		detallesCompletos: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
		},
	},
	{
		tableName: "reservas",
		timestamps: true,
		indexes: [
			{
				fields: ["email"],
			},
			{
				fields: ["fecha"],
			},
			{
				fields: ["estado"],
			},
			{
				fields: ["created_at"],
			},
		],
	}
);

export default Reserva;
