import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DescuentoGlobal = sequelize.define(
	"DescuentoGlobal",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		tipo: {
			type: DataTypes.ENUM(
				"descuentoOnline",
				"descuentoRoundTrip",
				"descuentoPersonalizado"
			),
			allowNull: false,
			unique: true,
		},
		nombre: {
			type: DataTypes.STRING,
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
		tableName: "descuentos_globales",
		timestamps: true,
	}
);

export default DescuentoGlobal;
