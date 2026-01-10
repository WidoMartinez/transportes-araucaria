/**
 * Tipos y Constantes para el Sistema de Reservas
 * 
 * Define los estados posibles de una reserva, las transiciones permitidas
 * entre estados, y los tipos de datos utilizados en el sistema.
 */

/**
 * Estados posibles de una reserva
 * @typedef {Object} EstadosReserva
 */
export const ESTADOS_RESERVA = {
	/** Reserva en proceso de creación, aún no enviada */
	BORRADOR: 'borrador',
	/** Reserva enviada, esperando confirmación del cliente */
	PENDIENTE: 'pendiente',
	/** Reserva confirmada por el cliente, esperando asignación */
	CONFIRMADA: 'confirmada',
	/** Vehículo y conductor asignados */
	ASIGNADA: 'asignada',
	/** Viaje en progreso */
	EN_PROGRESO: 'en_progreso',
	/** Viaje completado */
	COMPLETADA: 'completada',
	/** Reserva cancelada */
	CANCELADA: 'cancelada'
};

/**
 * Transiciones de estado permitidas
 * Define qué estados pueden seguir a cada estado actual
 * @typedef {Object} TransicionesPermitidas
 */
export const TRANSICIONES_PERMITIDAS = {
	[ESTADOS_RESERVA.BORRADOR]: [
		ESTADOS_RESERVA.PENDIENTE,
		ESTADOS_RESERVA.CANCELADA
	],
	[ESTADOS_RESERVA.PENDIENTE]: [
		ESTADOS_RESERVA.CONFIRMADA,
		ESTADOS_RESERVA.CANCELADA
	],
	[ESTADOS_RESERVA.CONFIRMADA]: [
		ESTADOS_RESERVA.ASIGNADA,
		ESTADOS_RESERVA.CANCELADA
	],
	[ESTADOS_RESERVA.ASIGNADA]: [
		ESTADOS_RESERVA.EN_PROGRESO,
		ESTADOS_RESERVA.CONFIRMADA, // Permite reasignación
		ESTADOS_RESERVA.CANCELADA
	],
	[ESTADOS_RESERVA.EN_PROGRESO]: [
		ESTADOS_RESERVA.COMPLETADA,
		ESTADOS_RESERVA.CANCELADA
	],
	[ESTADOS_RESERVA.COMPLETADA]: [],
	[ESTADOS_RESERVA.CANCELADA]: []
};

/**
 * Etiquetas legibles para los estados
 */
export const ETIQUETAS_ESTADO = {
	[ESTADOS_RESERVA.BORRADOR]: 'Borrador',
	[ESTADOS_RESERVA.PENDIENTE]: 'Pendiente',
	[ESTADOS_RESERVA.CONFIRMADA]: 'Confirmada',
	[ESTADOS_RESERVA.ASIGNADA]: 'Asignada',
	[ESTADOS_RESERVA.EN_PROGRESO]: 'En Progreso',
	[ESTADOS_RESERVA.COMPLETADA]: 'Completada',
	[ESTADOS_RESERVA.CANCELADA]: 'Cancelada'
};

/**
 * Colores asociados a cada estado (para badges y visualización)
 */
export const COLORES_ESTADO = {
	[ESTADOS_RESERVA.BORRADOR]: 'secondary',
	[ESTADOS_RESERVA.PENDIENTE]: 'default',
	[ESTADOS_RESERVA.CONFIRMADA]: 'blue',
	[ESTADOS_RESERVA.ASIGNADA]: 'purple',
	[ESTADOS_RESERVA.EN_PROGRESO]: 'yellow',
	[ESTADOS_RESERVA.COMPLETADA]: 'green',
	[ESTADOS_RESERVA.CANCELADA]: 'destructive'
};

/**
 * Tipos de evento en el timeline
 */
export const TIPOS_EVENTO = {
	CREACION: 'creacion',
	CAMBIO_ESTADO: 'cambio_estado',
	ASIGNACION: 'asignacion',
	REASIGNACION: 'reasignacion',
	PAGO: 'pago',
	MODIFICACION: 'modificacion',
	COMENTARIO: 'comentario',
	NOTIFICACION: 'notificacion'
};

/**
 * Estados de pago
 */
export const ESTADOS_PAGO = {
	SIN_PAGO: 'sin_pago',
	ABONO_PARCIAL: 'abono_parcial',
	PAGADO: 'pagado'
};

/**
 * Tipos de cliente
 */
export const TIPOS_CLIENTE = {
	CLIENTE: 'cliente',
	COTIZADOR: 'cotizador'
};

/**
 * Tipos de viaje
 */
export const TIPOS_VIAJE = {
	IDA: 'ida',
	IDA_VUELTA: 'ida_vuelta'
};

/**
 * Vistas disponibles en el gestor
 */
export const VISTAS_GESTOR = {
	LISTA: 'lista',
	KANBAN: 'kanban',
	CALENDARIO: 'calendario'
};

/**
 * Valida si una transición de estado es permitida
 * @param {string} estadoActual - Estado actual de la reserva
 * @param {string} estadoNuevo - Estado al que se quiere transicionar
 * @returns {boolean} true si la transición es válida
 */
export const esTransicionValida = (estadoActual, estadoNuevo) => {
	const transicionesPermitidas = TRANSICIONES_PERMITIDAS[estadoActual];
	return transicionesPermitidas && transicionesPermitidas.includes(estadoNuevo);
};

/**
 * Obtiene los estados siguientes válidos para un estado dado
 * @param {string} estadoActual - Estado actual de la reserva
 * @returns {string[]} Array de estados válidos siguientes
 */
export const obtenerEstadosSiguientes = (estadoActual) => {
	return TRANSICIONES_PERMITIDAS[estadoActual] || [];
};

/**
 * Estructura de datos de una reserva (TypeDef para JSDoc)
 * @typedef {Object} Reserva
 * @property {number} id - ID único de la reserva
 * @property {string} codigo - Código de reserva (formato AR-YYYYMMDD-NNNN)
 * @property {string} estado - Estado actual de la reserva
 * @property {Object} cliente - Información del cliente
 * @property {string} cliente.nombre - Nombre completo del cliente
 * @property {string} cliente.email - Email del cliente
 * @property {string} cliente.telefono - Teléfono del cliente
 * @property {string} [cliente.rut] - RUT del cliente
 * @property {string} cliente.tipo - Tipo de cliente (cliente/cotizador)
 * @property {Object} viaje - Información del viaje
 * @property {string} viaje.origen - Lugar de origen
 * @property {string} viaje.destino - Lugar de destino
 * @property {string} viaje.fecha - Fecha del viaje (ISO 8601)
 * @property {string} viaje.hora - Hora del viaje (HH:mm)
 * @property {number} viaje.pasajeros - Número de pasajeros
 * @property {string} viaje.tipo - Tipo de viaje (ida/ida_vuelta)
 * @property {Object} [viaje.regreso] - Información del regreso (si aplica)
 * @property {string} [viaje.regreso.fecha] - Fecha de regreso
 * @property {string} [viaje.regreso.hora] - Hora de regreso
 * @property {Object} [asignacion] - Información de asignación
 * @property {number} [asignacion.vehiculo_id] - ID del vehículo asignado
 * @property {number} [asignacion.conductor_id] - ID del conductor asignado
 * @property {Object} financiero - Información financiera
 * @property {number} financiero.total - Total de la reserva
 * @property {number} financiero.abono - Abono pagado
 * @property {number} financiero.saldo - Saldo pendiente
 * @property {string} financiero.estado_pago - Estado del pago
 * @property {Array} historial - Historial de eventos
 * @property {string} created_at - Fecha de creación (ISO 8601)
 * @property {string} updated_at - Fecha de última actualización (ISO 8601)
 */
