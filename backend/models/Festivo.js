import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo para gestionar festivos y fechas especiales
 */
const Festivo = sequelize.define(
	"Festivo",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		fecha: {
			type: DataTypes.DATEONLY,
			allowNull: false,
			comment: "Fecha del festivo (YYYY-MM-DD)",
		},
		nombre: {
			type: DataTypes.STRING(100),
			allowNull: false,
			comment: "Nombre del festivo o fecha especial",
		},
		tipo: {
			type: DataTypes.ENUM("feriado_nacional", "feriado_regional", "fecha_especial"),
			allowNull: false,
			defaultValue: "feriado_nacional",
			comment: "Tipo de festivo",
		},
		recurrente: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			comment: "Si el festivo se repite cada año (ej: Navidad, Año Nuevo)",
		},
		porcentajeRecargo: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: true,
			defaultValue: null,
			comment: "Porcentaje de recargo específico para esta fecha (si es null, usa configuración general)",
		},
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			comment: "Si el festivo está activo",
		},
		descripcion: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Descripción o notas adicionales",
		},
	},
	{
		tableName: "festivos",
		timestamps: true,
		indexes: [
			{ fields: ["fecha"] },
			{ fields: ["activo"] },
			{ fields: ["tipo"] },
			{ fields: ["recurrente"] },
		],
	}
);

export default Festivo;
