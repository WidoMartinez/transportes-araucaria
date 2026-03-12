import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Modelo para leads incompletos: usuarios que inician una reserva pero no completan el pago
const LeadIncompleto = sequelize.define(
	"LeadIncompleto",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		origen: {
			type: DataTypes.STRING(255),
			allowNull: false,
			comment: "Origen del traslado ingresado en Paso 1",
		},
		destino: {
			type: DataTypes.STRING(255),
			allowNull: false,
			comment: "Destino del traslado ingresado en Paso 1",
		},
		fechaViaje: {
			type: DataTypes.DATEONLY,
			allowNull: false,
			field: "fecha_viaje",
			comment: "Fecha del viaje seleccionada",
		},
		horaViaje: {
			type: DataTypes.TIME,
			allowNull: false,
			field: "hora_viaje",
			comment: "Hora del viaje seleccionada",
		},
		numPasajeros: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "num_pasajeros",
			comment: "Número de pasajeros",
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: true,
			comment: "Email del usuario (capturado en Paso 2, opcional)",
		},
		telefono: {
			type: DataTypes.STRING(20),
			allowNull: true,
			comment: "Teléfono del usuario (capturado en Paso 2, opcional)",
		},
		nombre: {
			type: DataTypes.STRING(255),
			allowNull: true,
			comment: "Nombre del usuario (capturado en Paso 2, opcional)",
		},
		precioEstimado: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			field: "precio_estimado",
			comment: "Precio estimado de la cotización",
		},
		sessionId: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true,
			field: "session_id",
			comment: "Identificador único de sesión generado en el frontend",
		},
		estado: {
			type: DataTypes.ENUM(
				"sin_datos_contacto",
				"con_email",
				"contactado",
				"convertido",
				"descartado"
			),
			defaultValue: "sin_datos_contacto",
			comment: "Estado del lead en el embudo de conversión",
		},
		intentosContacto: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: "intentos_contacto",
			comment: "Número de intentos de contacto realizados",
		},
		ultimaFechaContacto: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "ultima_fecha_contacto",
			comment: "Fecha/hora del último intento de contacto",
		},
	},
	{
		tableName: "leads_incompletos",
		timestamps: true,
		createdAt: "fecha_creacion",
		updatedAt: "fecha_actualizacion",
		indexes: [
			{ fields: ["session_id"], unique: true },
			{ fields: ["estado"] },
			{ fields: ["email"] },
			{ fields: ["fecha_actualizacion"] },
		],
	}
);

export default LeadIncompleto;
