// backend/models/associations.js
// Define las relaciones entre los modelos

import Reserva from "./Reserva.js";
import Cliente from "./Cliente.js";
import Vehiculo from "./Vehiculo.js";
import Conductor from "./Conductor.js";

// Función para establecer todas las asociaciones
export const setupAssociations = () => {
	// Relación: Cliente -> Reservas (Un cliente puede tener muchas reservas)
	Cliente.hasMany(Reserva, {
		foreignKey: "clienteId",
		as: "reservas",
	});
	
	Reserva.belongsTo(Cliente, {
		foreignKey: "clienteId",
		as: "cliente",
	});

	// Relación: Vehiculo -> Reservas (Un vehículo puede tener muchas reservas)
	Vehiculo.hasMany(Reserva, {
		foreignKey: "vehiculoId",
		as: "reservas",
	});
	
	Reserva.belongsTo(Vehiculo, {
		foreignKey: "vehiculoId",
		as: "vehiculo_asignado", // Usar un alias diferente para no confundir con el campo de texto
	});

	// Relación: Conductor -> Reservas (Un conductor puede tener muchas reservas)
	Conductor.hasMany(Reserva, {
		foreignKey: "conductorId",
		as: "reservas",
	});
	
	Reserva.belongsTo(Conductor, {
		foreignKey: "conductorId",
		as: "conductor_asignado",
	});

	console.log("✅ Asociaciones de modelos establecidas correctamente");
};

export default setupAssociations;
