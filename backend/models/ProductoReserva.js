import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ProductoReserva = sequelize.define(
	"ProductoReserva",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		reservaId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: "reservas",
				key: "id",
			},
			onDelete: "CASCADE",
		},
		productoId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: "productos",
				key: "id",
			},
			onDelete: "CASCADE",
		},
		cantidad: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
		precioUnitario: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			comment: "Precio del producto al momento de la compra",
		},
		subtotal: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			comment: "cantidad * precioUnitario",
		},
	},
	{
		tableName: "productos_reservas",
		timestamps: true,
		indexes: [
			{ fields: ["reservaId"] },
			{ fields: ["productoId"] },
		],
	}
);

export default ProductoReserva;
