import BloqueoAgenda from "../models/BloqueoAgenda.js";

/**
 * Migración para crear la tabla bloqueos_agenda
 * Permite bloquear días, horarios o fechas específicas para reservas
 */
const addBloqueosAgendaTable = async () => {
	try {
		console.log("🔧 Ejecutando migración: add-bloqueos-agenda-table");

		// Sincronizar el modelo con la base de datos
		// alter: true permite modificar la tabla si ya existe
		await BloqueoAgenda.sync({ alter: true });

		console.log("✅ Tabla bloqueos_agenda creada/actualizada exitosamente");
		return true;
	} catch (error) {
		console.error("❌ Error al crear tabla bloqueos_agenda:", error);
		throw error;
	}
};

export default addBloqueosAgendaTable;
