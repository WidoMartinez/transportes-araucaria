// backend/models/EstadisticasConductor.js
// Modelo para estadísticas agregadas de conductores
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const EstadisticasConductor = sequelize.define(
	"EstadisticasConductor",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		conductorId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true,
			field: "conductor_id",
			comment: "ID del conductor",
		},
		// Promedios de calificación
		promedioGeneral: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: true,
			defaultValue: 0,
			field: "promedio_general",
			comment: "Promedio general de todas las evaluaciones",
		},
		promedioPuntualidad: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: true,
			defaultValue: 0,
			field: "promedio_puntualidad",
			comment: "Promedio de calificaciones de puntualidad",
		},
		promedioLimpieza: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: true,
			defaultValue: 0,
			field: "promedio_limpieza",
			comment: "Promedio de calificaciones de limpieza",
		},
		promedioSeguridad: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: true,
			defaultValue: 0,
			field: "promedio_seguridad",
			comment: "Promedio de calificaciones de seguridad",
		},
		promedioComunicacion: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: true,
			defaultValue: 0,
			field: "promedio_comunicacion",
			comment: "Promedio de calificaciones de comunicación",
		},
		// Contadores
		totalEvaluaciones: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			field: "total_evaluaciones",
			comment: "Total de evaluaciones recibidas",
		},
		totalServiciosCompletados: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			field: "total_servicios_completados",
			comment: "Total de servicios completados",
		},
		porcentajeEvaluado: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: true,
			defaultValue: 0,
			field: "porcentaje_evaluado",
			comment: "Porcentaje de servicios evaluados",
		},
		// Estadísticas de propinas (solo visibles para admin)
		totalPropinasRecibidas: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
			field: "total_propinas_recibidas",
			comment: "Total de propinas recibidas (solo admin)",
		},
		cantidadPropinas: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			field: "cantidad_propinas",
			comment: "Cantidad de propinas recibidas",
		},
		promedioPropina: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
			field: "promedio_propina",
			comment: "Promedio de propinas recibidas",
		},
		// Métricas adicionales
		cantidad5Estrellas: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			field: "cantidad_5_estrellas",
			comment: "Cantidad de evaluaciones con 5 estrellas",
		},
		mejorCalificadoEn: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: "mejor_calificado_en",
			comment: "Categoría con mejor calificación",
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			field: "updated_at",
		},
	},
	{
		tableName: "estadisticas_conductor",
		timestamps: false,
		indexes: [
			{ fields: ["conductor_id"], unique: true },
			{ fields: ["promedio_general"] },
		],
	}
);

export default EstadisticasConductor;
