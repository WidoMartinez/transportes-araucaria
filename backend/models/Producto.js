import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo de Producto
 * Representa los productos disponibles que pueden agregarse a las reservas
 * (snacks, bebidas, accesorios, etc.)
 */
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
			comment: "Nombre del producto (ej: Agua mineral 500ml)",
		},
		descripcion: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Descripción detallada del producto",
		},
		categoria: {
			type: DataTypes.STRING(100),
			allowNull: false,
			defaultValue: "general",
			comment: "Categoría del producto (bebidas, snacks, accesorios, etc.)",
		},
		precio: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			defaultValue: 0,
			comment: "Precio del producto en CLP",
		},
		disponible: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			allowNull: false,
			comment: "Indica si el producto está disponible para la venta",
		},
		stock: {
			type: DataTypes.INTEGER,
			allowNull: true,
			comment: "Stock disponible (null = sin control de stock)",
		},
		imagenUrl: {
			type: DataTypes.STRING(500),
			allowNull: true,
			field: "imagen_url",
			comment: "URL de la imagen del producto",
		},
		orden: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0,
			comment: "Orden de visualización en el catálogo",
		},
		// Filtros adicionales para disponibilidad contextual
		disponibleEnRuta: {
			type: DataTypes.JSON,
			allowNull: true,
			field: "disponible_en_ruta",
			comment: "Array de destinos donde está disponible (null = todos)",
		},
		disponibleEnVehiculo: {
			type: DataTypes.JSON,
			allowNull: true,
			field: "disponible_en_vehiculo",
			comment: "Array de tipos de vehículo donde está disponible (null = todos)",
		},
	},
	{
		tableName: "productos",
		timestamps: true,
		indexes: [
			{ fields: ["categoria"] },
			{ fields: ["disponible"] },
			{ fields: ["orden"] },
		],
	}
);

export default Producto;
