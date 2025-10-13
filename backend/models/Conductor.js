import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo de Conductor
 * Representa a los conductores que realizan los viajes
 */
const Conductor = sequelize.define(
	"Conductor",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		nombre: {
			type: DataTypes.STRING(255),
			allowNull: false,
			comment: "Nombre completo del conductor",
		},
		telefono: {
			type: DataTypes.STRING(50),
			allowNull: false,
			comment: "Teléfono de contacto del conductor",
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: true,
			comment: "Email del conductor (opcional)",
		},
		notas: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Notas adicionales sobre el conductor",
		},
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			comment: "Indica si el conductor está activo",
		},
	},
	{
		tableName: "conductores",
		timestamps: true,
		indexes: [
			{ fields: ["nombre"] },
			{ fields: ["activo"] },
		],
	}
);

export default Conductor;
