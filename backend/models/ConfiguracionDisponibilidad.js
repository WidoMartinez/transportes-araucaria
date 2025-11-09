import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo para configurar parámetros de disponibilidad y descuentos por retorno
 * Permite configurar tiempos mínimos/óptimos entre viajes y descuentos graduales
 */
const ConfiguracionDisponibilidad = sequelize.define(
	"ConfiguracionDisponibilidad",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		// Tiempos de holgura (en minutos)
		holguraMinima: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 30,
			comment: "Tiempo mínimo obligatorio entre llegada y siguiente salida (minutos) - NO MODIFICABLE",
			validate: {
				min: 30,
				isInt: true,
			},
		},
		holguraOptima: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 60,
			comment: "Tiempo óptimo de descanso del conductor (minutos) - CONFIGURABLE",
			validate: {
				min: 30,
				isInt: true,
			},
		},
		holguraMaximaDescuento: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 180,
			comment: "Tiempo máximo para aplicar descuento por retorno (minutos) - CONFIGURABLE",
			validate: {
				min: 30,
				isInt: true,
			},
		},
		// Descuentos por retorno
		descuentoMinimo: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: false,
			defaultValue: 1.0,
			comment: "Descuento mínimo por retorno (%) - CONFIGURABLE",
			validate: {
				min: 0,
				max: 100,
			},
		},
		descuentoMaximo: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: false,
			defaultValue: 40.0,
			comment: "Descuento máximo por retorno (%) - CONFIGURABLE",
			validate: {
				min: 0,
				max: 100,
			},
		},
		// Restricciones de horario
		horaLimiteRetornos: {
			type: DataTypes.TIME,
			allowNull: false,
			defaultValue: "20:00:00",
			comment: "Hora límite para iniciar retornos con descuento - CONFIGURABLE",
		},
		// Control de activación
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			comment: "Si el sistema de descuentos por retorno está activo",
		},
		// Metadata
		descripcion: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Descripción de la configuración actual",
		},
		ultimaModificacionPor: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "Usuario que realizó la última modificación",
		},
	},
	{
		tableName: "configuracion_disponibilidad",
		timestamps: true,
		indexes: [
			{ fields: ["activo"] },
		],
	}
);

export default ConfiguracionDisponibilidad;
