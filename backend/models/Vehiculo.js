import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo de Vehículo
 * Representa los vehículos utilizados para los servicios
 */
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
			comment: "Patente del vehículo (ej: ABCD12)",
		},
		tipo: {
			type: DataTypes.ENUM("Sedan", "SUV", "Van", "Minibus"),
			allowNull: false,
			comment: "Tipo de vehículo",
		},
		capacidad: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 4,
			comment: "Capacidad de pasajeros",
		},
		marca: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "Marca del vehículo",
		},
		modelo: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "Modelo del vehículo",
		},
		anio: {
			type: DataTypes.INTEGER,
			allowNull: true,
			comment: "Año del vehículo",
		},
		notas: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Notas adicionales sobre el vehículo",
		},
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			comment: "Indica si el vehículo está activo",
		},
	},
	{
		tableName: "vehiculos",
		timestamps: true,
		indexes: [
			{ fields: ["patente"] },
			{ fields: ["tipo"] },
			{ fields: ["activo"] },
		],
	}
);

export default Vehiculo;
