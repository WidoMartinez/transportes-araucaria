import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Producto = sequelize.define(
	"Producto",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		nombre: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		descripcion: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		precio: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			defaultValue: 0,
		},
		imagen: {
			type: DataTypes.STRING(500),
			allowNull: true,
		},
		categoria: {
			type: DataTypes.STRING(100),
			allowNull: true,
			defaultValue: "General",
		},
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		orden: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		stock: {
			type: DataTypes.INTEGER,
			allowNull: true,
			comment: "Stock disponible (null = sin control de stock)",
		},
	},
	{
		tableName: "productos",
		timestamps: true,
		indexes: [
			{ fields: ["activo"] },
			{ fields: ["categoria"] },
			{ fields: ["orden"] },
		],
	}
);

export default Producto;
