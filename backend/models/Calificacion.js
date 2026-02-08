// backend/models/Calificacion.js
// Modelo para el sistema de calificación del servicio

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Calificacion = sequelize.define(
	"Calificacion",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		reserva_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true,
			field: "reserva_id",
			comment: "ID de la reserva calificada (FK a Reserva)",
		},
		puntuacion: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				min: 1,
				max: 5,
			},
			comment: "Calificación general del servicio (1-5 estrellas)",
		},
		comentario: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Comentario opcional del pasajero (máx 500 caracteres)",
		},
		aspectos: {
			type: DataTypes.JSON,
			allowNull: true,
			comment: "JSON con puntualidad, limpieza, amabilidad, conduccion (1-5 cada uno)",
		},
		fecha_calificacion: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			field: "fecha_calificacion",
			comment: "Fecha y hora en que se realizó la calificación",
		},
		ip_cliente: {
			type: DataTypes.STRING(45),
			allowNull: true,
			field: "ip_cliente",
			comment: "Dirección IP del cliente que calificó",
		},
		dispositivo: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "User agent del dispositivo usado para calificar",
		},
	},
	{
		tableName: "Calificaciones",
		timestamps: false,
		indexes: [
			{ fields: ["reserva_id"], unique: true },
			{ fields: ["puntuacion"] },
			{ fields: ["fecha_calificacion"] },
		],
	}
);

export default Calificacion;
