import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Gasto = sequelize.define(
	"Gasto",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		reservaId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "reserva_id",
			comment: "ID de la reserva asociada",
		},
		tipoGasto: {
			type: DataTypes.ENUM(
				"combustible",
				"comision_flow",
				"pago_conductor",
				"peaje",
				"mantenimiento",
				"estacionamiento",
				"otro"
			),
			allowNull: false,
			field: "tipo_gasto",
			comment: "Tipo de gasto registrado",
		},
		monto: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			defaultValue: 0,
			comment: "Monto del gasto",
		},
		porcentaje: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: true,
			comment: "Porcentaje aplicado (ej: 3.19 para comisión Flow)",
		},
		descripcion: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Descripción adicional del gasto",
		},
		fecha: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
			comment: "Fecha del gasto",
		},
		comprobante: {
			type: DataTypes.STRING(255),
			allowNull: true,
			comment: "URL o referencia del comprobante",
		},
		conductorId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "conductor_id",
			comment: "ID del conductor asociado (si aplica)",
		},
		vehiculoId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "vehiculo_id",
			comment: "ID del vehículo asociado (si aplica)",
		},
		observaciones: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Observaciones adicionales",
		},
	},
	{
		tableName: "gastos",
		timestamps: true,
		indexes: [
			{ fields: ["reserva_id"] },
			{ fields: ["tipo_gasto"] },
			{ fields: ["fecha"] },
			{ fields: ["conductor_id"] },
			{ fields: ["vehiculo_id"] },
		],
	}
);

export default Gasto;
