import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo de ProductoReserva
 * Tabla intermedia que relaciona productos con reservas (muchos a muchos)
 * Almacena la cantidad y el precio al momento de la compra
 */
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
			field: "reserva_id",
			comment: "ID de la reserva",
		},
		productoId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "producto_id",
			comment: "ID del producto",
		},
		cantidad: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
			comment: "Cantidad de unidades del producto",
		},
		precioUnitario: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			field: "precio_unitario",
			comment: "Precio unitario al momento de agregar (para histórico)",
		},
		subtotal: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			defaultValue: 0,
			comment: "Subtotal calculado (cantidad * precioUnitario)",
		},
		notas: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Notas especiales sobre el producto (ej: sin azúcar, extra frío)",
		},
		estadoEntrega: {
			type: DataTypes.ENUM("pendiente", "preparado", "entregado", "cancelado"),
			defaultValue: "pendiente",
			field: "estado_entrega",
			comment: "Estado de entrega del producto",
		},
	},
	{
		tableName: "productos_reserva",
		timestamps: true,
		indexes: [
			{ fields: ["reserva_id"] },
			{ fields: ["producto_id"] },
			{ fields: ["estado_entrega"] },
		],
	}
);

export default ProductoReserva;
