import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const CodigoDescuento = sequelize.define(
	"CodigoDescuento",
	{
		id: {
			type: DataTypes.STRING,
			primaryKey: true,
			allowNull: false,
		},
		codigo: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		descripcion: {
			type: DataTypes.STRING,
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
		limiteUsos: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		usosActuales: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		fechaVencimiento: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		destinosAplicables: {
			type: DataTypes.JSON,
			defaultValue: [],
		},
		montoMinimo: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0,
		},
		combinable: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		exclusivo: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		fechaCreacion: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		creadoPor: {
			type: DataTypes.STRING,
			defaultValue: "admin",
		},
		limiteUsosPorUsuario: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
		},
		usuariosQueUsaron: {
			type: DataTypes.JSON,
			defaultValue: [],
		},
	},
	{
		tableName: "codigos_descuento",
		timestamps: true,
	}
);

export default CodigoDescuento;
