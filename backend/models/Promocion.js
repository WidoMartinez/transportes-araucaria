import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Promocion = sequelize.define(
	"Promocion",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		nombre: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		dia: {
			type: DataTypes.ENUM(
				"lunes",
				"martes",
				"miercoles",
				"jueves",
				"viernes",
				"sabado",
				"domingo"
			),
			allowNull: false,
		},
		tipo: {
			type: DataTypes.ENUM("porcentaje", "monto_fijo"),
			allowNull: false,
		},
		valor: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		descripcion: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
	},
	{
		tableName: "promociones",
		timestamps: true,
	}
);

export default Promocion;
