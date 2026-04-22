import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Modelo dedicado para el servicio de traslados Aeropuerto <-> Hoteles
const TrasladoHotelAeropuerto = sequelize.define(
	"TrasladoHotelAeropuerto",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		codigoReserva: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: true,
			field: "codigo_reserva",
			comment: "Código único del servicio Aeropuerto-Hoteles (TH-YYYYMMDD-XXXX)",
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
		hotelCodigo: {
			type: DataTypes.STRING(80),
			allowNull: false,
			field: "hotel_codigo",
		},
		hotelNombre: {
			type: DataTypes.STRING(255),
			allowNull: false,
			field: "hotel_nombre",
		},
		origenTipo: {
			type: DataTypes.ENUM("aeropuerto", "hotel"),
			allowNull: false,
			field: "origen_tipo",
			comment: "Indica si el pasajero parte desde aeropuerto o hotel",
		},
		origen: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		destino: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		tipoServicio: {
			type: DataTypes.ENUM("solo_ida", "ida_vuelta"),
			allowNull: false,
			field: "tipo_servicio",
			comment: "Regla del módulo: ida y vuelta solo disponible desde aeropuerto",
		},
		fechaIda: {
			type: DataTypes.DATEONLY,
			allowNull: false,
			field: "fecha_ida",
		},
		horaIda: {
			type: DataTypes.TIME,
			allowNull: false,
			field: "hora_ida",
		},
		fechaVuelta: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			field: "fecha_vuelta",
		},
		horaVuelta: {
			type: DataTypes.TIME,
			allowNull: true,
			field: "hora_vuelta",
		},
		pasajeros: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
		montoTotal: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			field: "monto_total",
		},
		moneda: {
			type: DataTypes.STRING(10),
			allowNull: false,
			defaultValue: "CLP",
		},
		observaciones: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		estado: {
			type: DataTypes.ENUM("pendiente", "confirmada", "completada", "cancelada"),
			allowNull: false,
			defaultValue: "pendiente",
		},
		source: {
			type: DataTypes.STRING(80),
			allowNull: false,
			defaultValue: "web_hoteles",
		},
	},
	{
		tableName: "traslados_hoteles",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
		indexes: [
			{ fields: ["codigo_reserva"] },
			{ fields: ["estado"] },
			{ fields: ["hotel_codigo"] },
			{ fields: ["fecha_ida"] },
		],
	},
);

export default TrasladoHotelAeropuerto;
