// backend/models/associations.js
// Define las relaciones entre los modelos

import Reserva from "./Reserva.js";
import Cliente from "./Cliente.js";
import Vehiculo from "./Vehiculo.js";
import Conductor from "./Conductor.js";
import Gasto from "./Gasto.js";
import Producto from "./Producto.js";
import ProductoReserva from "./ProductoReserva.js";

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

	// Relación: Reserva -> Gastos (Una reserva puede tener muchos gastos)
	Reserva.hasMany(Gasto, {
		foreignKey: "reservaId",
		as: "gastos",
	});
	
	Gasto.belongsTo(Reserva, {
		foreignKey: "reservaId",
		as: "reserva",
	});

	// Relación: Conductor -> Gastos (Un conductor puede tener muchos gastos)
	Conductor.hasMany(Gasto, {
		foreignKey: "conductorId",
		as: "gastos",
	});
	
	Gasto.belongsTo(Conductor, {
		foreignKey: "conductorId",
		as: "conductor",
	});

	// Relación: Vehiculo -> Gastos (Un vehículo puede tener muchos gastos)
	Vehiculo.hasMany(Gasto, {
		foreignKey: "vehiculoId",
		as: "gastos",
	});
	
	Gasto.belongsTo(Vehiculo, {
		foreignKey: "vehiculoId",
		as: "vehiculo",
	});

	// Relación: Reserva <-> Producto (Muchos a Muchos a través de ProductoReserva)
	Reserva.belongsToMany(Producto, {
		through: ProductoReserva,
		foreignKey: "reservaId",
		otherKey: "productoId",
		as: "productos",
	});

	Producto.belongsToMany(Reserva, {
		through: ProductoReserva,
		foreignKey: "productoId",
		otherKey: "reservaId",
		as: "reservas",
	});

	// Relación directa para acceder a la tabla intermedia
	Reserva.hasMany(ProductoReserva, {
		foreignKey: "reservaId",
		as: "productosReserva",
	});

	ProductoReserva.belongsTo(Reserva, {
		foreignKey: "reservaId",
		as: "reserva",
	});

	ProductoReserva.belongsTo(Producto, {
		foreignKey: "productoId",
		as: "producto",
	});

	Producto.hasMany(ProductoReserva, {
		foreignKey: "productoId",
		as: "productosReserva",
	});

	console.log("✅ Asociaciones de modelos establecidas correctamente");
};

export default setupAssociations;
