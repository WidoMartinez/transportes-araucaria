// backend/models/Vehiculo.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Vehiculo = sequelize.define(
	"Vehiculo",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		patente: {
			type: DataTypes.STRING(10),
			allowNull: false,
			unique: true,
			validate: {
				notEmpty: true,
			},
		},
		tipo: {
			type: DataTypes.ENUM("sedan", "van", "minibus"),
			allowNull: false,
			defaultValue: "sedan",
		},
		marca: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		modelo: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		anio: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 1900,
				max: 2100,
			},
		},
		capacidad: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 4,
			validate: {
				min: 1,
				max: 100,
			},
		},
		estado: {
			type: DataTypes.ENUM("disponible", "en_uso", "mantenimiento", "inactivo"),
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
		tableName: "vehiculos",
		timestamps: true,
		indexes: [
			{ fields: ["patente"], unique: true },
			{ fields: ["tipo"] },
			{ fields: ["estado"] },
		],
	}
);

export default Vehiculo;
