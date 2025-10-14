import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo de ViajesConductor
 * Registra la relación entre conductores, vehículos y reservas/viajes
 * Permite llevar un registro de qué conductor usó qué vehículo para cada reserva
 * y el monto pagado por el viaje
 */
const ViajesConductor = sequelize.define(
	"ViajesConductor",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		conductorId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "conductor_id",
			comment: "ID del conductor que realizó el viaje",
		},
		vehiculoId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "vehiculo_id",
			comment: "ID del vehículo usado en el viaje",
		},
		reservaId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: "reserva_id",
			comment: "ID de la reserva asociada al viaje",
		},
		montoPago: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
			field: "monto_pago",
			comment: "Monto pagado al conductor por este viaje (ingreso manual)",
		},
		notas: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Notas adicionales sobre el viaje",
		},
	},
	{
		tableName: "viajes_conductor",
		timestamps: true,
		indexes: [
			{ fields: ["conductor_id"] },
			{ fields: ["vehiculo_id"] },
			{ fields: ["reserva_id"] },
			{ fields: ["created_at"] },
		],
	}
);

// Definir asociaciones
// Estas asociaciones permiten hacer eager loading de datos relacionados
import Reserva from "./Reserva.js";
import Conductor from "./Conductor.js";
import Vehiculo from "./Vehiculo.js";

ViajesConductor.belongsTo(Reserva, {
	foreignKey: "reservaId",
	as: "reserva",
});

ViajesConductor.belongsTo(Conductor, {
	foreignKey: "conductorId",
	as: "conductor",
});

ViajesConductor.belongsTo(Vehiculo, {
	foreignKey: "vehiculoId",
	as: "vehiculo",
});

export default ViajesConductor;
