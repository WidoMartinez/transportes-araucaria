import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Catálogo administrable de hoteles para el módulo Aeropuerto-Hoteles
const HotelTraslado = sequelize.define(
	"HotelTraslado",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		codigo: {
			type: DataTypes.STRING(80),
			allowNull: false,
			unique: true,
			comment: "Identificador único del hotel (slug administrable)",
		},
		nombre: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		comuna: {
			type: DataTypes.STRING(120),
			allowNull: false,
		},
		tarifaSoloIda: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			field: "tarifa_solo_ida",
		},
		tarifaIdaVuelta: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			field: "tarifa_ida_vuelta",
		},
		activo: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		orden: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		tableName: "hoteles_traslado",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: "updated_at",
		indexes: [{ fields: ["codigo"] }, { fields: ["activo", "orden"] }],
	},
);

export default HotelTraslado;
