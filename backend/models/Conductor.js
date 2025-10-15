// backend/models/Conductor.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

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
			validate: {
				notEmpty: true,
			},
		},
		rut: {
			type: DataTypes.STRING(20),
			allowNull: false,
			unique: true,
			validate: {
				notEmpty: true,
			},
		},
		telefono: {
			type: DataTypes.STRING(50),
			allowNull: false,
			validate: {
				notEmpty: true,
			},
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: true,
			validate: {
				isEmail: true,
			},
		},
		licencia: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		fechaVencimientoLicencia: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		estado: {
			type: DataTypes.ENUM("disponible", "ocupado", "descanso", "inactivo"),
			allowNull: false,
			defaultValue: "disponible",
		},
		observaciones: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: "conductores",
		timestamps: true,
		indexes: [
			{ fields: ["rut"], unique: true },
			{ fields: ["estado"] },
		],
	}
);

export default Conductor;
