// backend/models/EvaluacionConductor.js
// Modelo para evaluaciones de conductores con sistema de calificación y propinas
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const EvaluacionConductor = sequelize.define(
	"EvaluacionConductor",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		reservaId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true,
			field: "reserva_id",
			comment: "ID de la reserva evaluada",
		},
		conductorId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "conductor_id",
			comment: "ID del conductor evaluado",
		},
		clienteEmail: {
			type: DataTypes.STRING(255),
			allowNull: false,
			field: "cliente_email",
			comment: "Email del cliente que evalúa",
		},
		clienteNombre: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "cliente_nombre",
			comment: "Nombre del cliente que evalúa",
		},
		// Calificaciones por categoría (1-5 estrellas)
		calificacionPuntualidad: {
			type: DataTypes.TINYINT,
			allowNull: false,
			validate: {
				min: 1,
				max: 5,
			},
			field: "calificacion_puntualidad",
			comment: "Calificación de puntualidad (1-5)",
		},
		calificacionLimpieza: {
			type: DataTypes.TINYINT,
			allowNull: false,
			validate: {
				min: 1,
				max: 5,
			},
			field: "calificacion_limpieza",
			comment: "Calificación de limpieza del vehículo (1-5)",
		},
		calificacionSeguridad: {
			type: DataTypes.TINYINT,
			allowNull: false,
			validate: {
				min: 1,
				max: 5,
			},
			field: "calificacion_seguridad",
			comment: "Calificación de conducción segura (1-5)",
		},
		calificacionComunicacion: {
			type: DataTypes.TINYINT,
			allowNull: false,
			validate: {
				min: 1,
				max: 5,
			},
			field: "calificacion_comunicacion",
			comment: "Calificación de comunicación y trato (1-5)",
		},
		calificacionPromedio: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: true,
			field: "calificacion_promedio",
			comment: "Promedio de todas las calificaciones",
		},
		// Comentario opcional
		comentario: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Comentario opcional del cliente",
		},
		// Sistema de propinas
		propinaMonto: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
			field: "propina_monto",
			comment: "Monto de propina elegido (0 si no hay propina)",
		},
		propinaPagada: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			field: "propina_pagada",
			comment: "Si la propina fue pagada exitosamente",
		},
		propinaFlowOrder: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "propina_flow_order",
			comment: "ID de orden Flow para la propina",
		},
		propinaFlowToken: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "propina_flow_token",
			comment: "Token Flow para la propina",
		},
		propinaPaymentId: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "propina_payment_id",
			comment: "ID de pago Flow para la propina",
		},
		// Notificaciones
		notificacionConductorEnviada: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			field: "notificacion_conductor_enviada",
			comment: "Si se envió notificación al conductor",
		},
		fechaNotificacionConductor: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "fecha_notificacion_conductor",
			comment: "Fecha de envío de notificación al conductor",
		},
		notificacionAdminEnviada: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			field: "notificacion_admin_enviada",
			comment: "Si se envió notificación al admin",
		},
		fechaNotificacionAdmin: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "fecha_notificacion_admin",
			comment: "Fecha de envío de notificación al admin",
		},
		// Control de token y evaluación
		tokenEvaluacion: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true,
			field: "token_evaluacion",
			comment: "Token único para evaluar (válido 72 horas)",
		},
		tokenExpiracion: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "token_expiracion",
			comment: "Fecha de expiración del token",
		},
		evaluada: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: "Si la evaluación ya fue completada",
		},
		fechaEvaluacion: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "fecha_evaluacion",
			comment: "Fecha en que se completó la evaluación",
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			field: "created_at",
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			field: "updated_at",
		},
	},
	{
		tableName: "evaluaciones_conductor",
		timestamps: true,
		indexes: [
			{ fields: ["reserva_id"], unique: true },
			{ fields: ["conductor_id"] },
			{ fields: ["token_evaluacion"], unique: true },
			{ fields: ["evaluada"] },
			{ fields: ["propina_flow_order"] },
		],
	}
);

export default EvaluacionConductor;
