import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Destino = sequelize.define(
	"Destino",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		nombre: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		precioIda: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		precioVuelta: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		precioIdaVuelta: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		orden: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		descripcion: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		tiempo: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		imagen: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		maxPasajeros: {
			type: DataTypes.INTEGER,
			defaultValue: 4,
		},
		minHorasAnticipacion: {
			type: DataTypes.INTEGER,
			defaultValue: 5,
		},
	},
	{
		tableName: "destinos",
		timestamps: true,
	}
);

export default Destino;
