import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo para gestionar la flota de vehículos
 */
const Vehiculo = sequelize.define(
	"Vehiculo",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		placa: {
			type: DataTypes.STRING(10),
			allowNull: false,
			unique: true,
			comment: "Patente del vehículo (ej: BBGG12)",
		},
		tipo: {
			type: DataTypes.ENUM("auto", "van", "minibus"),
			allowNull: false,
			defaultValue: "auto",
			comment: "Tipo de vehículo",
		},
		marca: {
			type: DataTypes.STRING(50),
			allowNull: true,
			comment: "Marca del vehículo (ej: Toyota, Mercedes)",
		},
		modelo: {
			type: DataTypes.STRING(50),
			allowNull: true,
			comment: "Modelo del vehículo (ej: Corolla, Sprinter)",
		},
		ano: {
			type: DataTypes.INTEGER,
			allowNull: true,
			comment: "Año de fabricación",
		},
		capacidad: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 4,
			comment: "Capacidad máxima de pasajeros",
		},
		color: {
			type: DataTypes.STRING(30),
			allowNull: true,
		},
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			comment: "Si el vehículo está disponible para asignación",
		},
		enMantenimiento: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			comment: "Si el vehículo está en mantenimiento",
		},
		fechaMantenimiento: {
			type: DataTypes.DATE,
			allowNull: true,
			comment: "Fecha del último mantenimiento",
		},
		proximoMantenimiento: {
			type: DataTypes.DATE,
			allowNull: true,
			comment: "Fecha del próximo mantenimiento programado",
		},
		kilometraje: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0,
			comment: "Kilometraje actual del vehículo",
		},
		observaciones: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Notas adicionales sobre el vehículo",
		},
	},
	{
		tableName: "vehiculos",
		timestamps: true,
		indexes: [
			{ fields: ["placa"], unique: true },
			{ fields: ["tipo"] },
			{ fields: ["activo"] },
		],
	}
);

export default Vehiculo;
