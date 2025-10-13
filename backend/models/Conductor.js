import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo para gestionar conductores/choferes
 */
const Conductor = sequelize.define(
	"Conductor",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		rut: {
			type: DataTypes.STRING(20),
			allowNull: false,
			unique: true,
			comment: "RUT del conductor (formato: 12345678-9)",
		},
		nombre: {
			type: DataTypes.STRING(100),
			allowNull: false,
			comment: "Nombre completo del conductor",
		},
		telefono: {
			type: DataTypes.STRING(50),
			allowNull: false,
			comment: "Teléfono de contacto",
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "Email del conductor",
		},
		licenciaConducir: {
			type: DataTypes.STRING(20),
			allowNull: false,
			comment: "Número de licencia de conducir",
		},
		tipoLicencia: {
			type: DataTypes.ENUM("clase_b", "clase_a1", "clase_a2", "clase_a3", "clase_a4", "clase_a5"),
			allowNull: false,
			defaultValue: "clase_b",
			comment: "Tipo de licencia de conducir chilena",
		},
		fechaVencimientoLicencia: {
			type: DataTypes.DATE,
			allowNull: false,
			comment: "Fecha de vencimiento de la licencia",
		},
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			comment: "Si el conductor está activo para asignaciones",
		},
		fechaIngreso: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: DataTypes.NOW,
			comment: "Fecha de ingreso del conductor",
		},
		direccion: {
			type: DataTypes.STRING(255),
			allowNull: true,
			comment: "Dirección del conductor",
		},
		calificacionPromedio: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: true,
			defaultValue: 5.0,
			comment: "Calificación promedio del conductor (0-5)",
		},
		observaciones: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Notas adicionales sobre el conductor",
		},
	},
	{
		tableName: "conductores",
		timestamps: true,
		indexes: [
			{ fields: ["rut"], unique: true },
			{ fields: ["activo"] },
			{ fields: ["licenciaConducir"] },
		],
	}
);

export default Conductor;
