/* eslint-env node */
// backend/models/EvaluacionConductor.js
// Modelo Sequelize para evaluaciones de conductor post-viaje

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
			comment: "ID de la reserva asociada (FK a Reservas)",
		},
		conductorNombre: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "conductor_nombre",
			comment: "Nombre del conductor (sin FK a tabla conductores)",
		},
		clienteEmail: {
			type: DataTypes.STRING(255),
			allowNull: false,
			field: "cliente_email",
			comment: "Email del pasajero evaluador",
		},
		clienteNombre: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "cliente_nombre",
			comment: "Nombre del pasajero evaluador",
		},
		// --- Calificaciones por categoría ---
		calificacionPuntualidad: {
			type: DataTypes.TINYINT,
			allowNull: true,
			field: "calificacion_puntualidad",
			comment: "Calificación de puntualidad (1-5)",
		},
		calificacionLimpieza: {
			type: DataTypes.TINYINT,
			allowNull: true,
			field: "calificacion_limpieza",
			comment: "Calificación de limpieza del vehículo (1-5)",
		},
		calificacionSeguridad: {
			type: DataTypes.TINYINT,
			allowNull: true,
			field: "calificacion_seguridad",
			comment: "Calificación de seguridad durante el viaje (1-5)",
		},
		calificacionComunicacion: {
			type: DataTypes.TINYINT,
			allowNull: true,
			field: "calificacion_comunicacion",
			comment: "Calificación de comunicación del conductor (1-5)",
		},
		calificacionPromedio: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: true,
			field: "calificacion_promedio",
			comment: "Promedio calculado de las 4 calificaciones",
		},
		comentario: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Comentario libre del pasajero",
		},
		// --- Propina ---
		propinaMonto: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			defaultValue: 0,
			field: "propina_monto",
			comment: "Monto de propina en CLP",
		},
		propinaPagada: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			field: "propina_pagada",
			comment: "Indica si la propina fue pagada mediante Flow",
		},
		propinaFlowOrder: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "propina_flow_order",
			comment: "Número de orden Flow para la propina",
		},
		propinaFlowToken: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "propina_flow_token",
			comment: "Token de Flow para la propina",
		},
		propinaPaymentId: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "propina_payment_id",
			comment: "ID de pago Flow confirmado para la propina",
		},
		// --- Estado de solicitud ---
		solicitudEnviada: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			field: "solicitud_enviada",
			comment: "Indica si ya se envió el correo de solicitud al pasajero",
		},
		fechaSolicitud: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "fecha_solicitud",
			comment: "Fecha y hora en que se envió la solicitud de evaluación",
		},
		notificacionAdminEnviada: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			field: "notificacion_admin_enviada",
			comment: "Indica si ya se notificó al admin sobre la evaluación recibida",
		},
		// --- Token de evaluación ---
		tokenEvaluacion: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true,
			field: "token_evaluacion",
			comment: "Token SHA-256 único para el enlace de evaluación",
		},
		tokenExpiracion: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "token_expiracion",
			comment: "Fecha de expiración del token (7 días desde creación)",
		},
		evaluada: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: "Indica si el pasajero ya completó la evaluación",
		},
		fechaEvaluacion: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "fecha_evaluacion",
			comment: "Fecha en que el pasajero completó la evaluación",
		},
		// --- Testimonios públicos ---
		publicado: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: "Indica si el testimonio fue aprobado por el admin para mostrarse públicamente",
		},
		publicadoNombre: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "publicado_nombre",
			comment: "Nombre público a mostrar en el testimonio (ej: 'María P.' o nombre completo)",
		},
		publicadoEn: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "publicado_en",
			comment: "Fecha en que el admin publicó el testimonio",
		},
	},
	{
		tableName: "evaluaciones_conductor",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
		indexes: [
			{ fields: ["reserva_id"] },
			{ fields: ["token_evaluacion"] },
			{ fields: ["evaluada"] },
			{ fields: ["propina_flow_order"] },
			{ fields: ["publicado"] },
		],
	}
);

export default EvaluacionConductor;
