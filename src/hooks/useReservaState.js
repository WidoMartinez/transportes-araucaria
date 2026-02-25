import { useState, useCallback } from 'react';
import {
	ESTADOS_RESERVA,
	TRANSICIONES_PERMITIDAS,
	esTransicionValida,
	obtenerEstadosSiguientes
} from '../types/reservas';

/**
 * Hook para gestionar el estado de una reserva individual
 * 
 * Maneja transiciones de estado, validaciones de negocio y
 * el historial de cambios de una reserva.
 * 
 * @param {Object} reservaInicial - Reserva inicial
 * @returns {Object} Estado y funciones de gestión
 */
export const useReservaState = (reservaInicial = null) => {
	const [reserva, setReserva] = useState(reservaInicial);
	const [historial, setHistorial] = useState(reservaInicial?.historial || []);
	const [error, setError] = useState(null);

	/**
	 * Valida si la reserva puede transicionar a un nuevo estado
	 * @param {string} nuevoEstado - Estado destino
	 * @returns {Object} { valido: boolean, mensaje: string }
	 */
	const validarTransicion = useCallback((nuevoEstado) => {
		if (!reserva) {
			return {
				valido: false,
				mensaje: 'No hay reserva para cambiar de estado'
			};
		}

		const estadoActual = reserva.estado || ESTADOS_RESERVA.BORRADOR;

		// Validar que la transición está permitida
		if (!esTransicionValida(estadoActual, nuevoEstado)) {
			return {
				valido: false,
				mensaje: `No se puede cambiar de ${estadoActual} a ${nuevoEstado}`
			};
		}

		// Validaciones de negocio específicas
		switch (nuevoEstado) {
			case ESTADOS_RESERVA.CONFIRMADA:
				// Para confirmar, debe tener datos básicos completos
				if (!reserva.cliente?.nombre || !reserva.viaje?.origen || !reserva.viaje?.destino) {
					return {
						valido: false,
						mensaje: 'Faltan datos obligatorios del cliente o viaje'
					};
				}
				break;

			case ESTADOS_RESERVA.ASIGNADA:
				// Para asignar, debe tener vehículo y conductor
				if (!reserva.asignacion?.vehiculo_id || !reserva.asignacion?.conductor_id) {
					return {
						valido: false,
						mensaje: 'Debe asignar vehículo y conductor antes de cambiar a este estado'
					};
				}
				break;

			case ESTADOS_RESERVA.EN_PROGRESO:
				// Para iniciar, debe estar asignada
				if (estadoActual !== ESTADOS_RESERVA.ASIGNADA) {
					return {
						valido: false,
						mensaje: 'La reserva debe estar asignada para iniciar el viaje'
					};
				}
				break;

			case ESTADOS_RESERVA.COMPLETADA:
				// Para completar, debe estar en progreso
				if (estadoActual !== ESTADOS_RESERVA.EN_PROGRESO) {
					return {
						valido: false,
						mensaje: 'La reserva debe estar en progreso para completarla'
					};
				}
				break;

			default:
				break;
		}

		return {
			valido: true,
			mensaje: 'Transición válida'
		};
	}, [reserva]);

	/**
	 * Cambia el estado de la reserva
	 * @param {string} nuevoEstado - Nuevo estado
	 * @param {string} comentario - Comentario opcional sobre el cambio
	 * @returns {boolean} true si el cambio fue exitoso
	 */
	const cambiarEstado = useCallback((nuevoEstado, comentario = '') => {
		const validacion = validarTransicion(nuevoEstado);

		if (!validacion.valido) {
			setError(validacion.mensaje);
			return false;
		}

		const estadoAnterior = reserva.estado;

		// Actualizar el estado de la reserva
		const reservaActualizada = {
			...reserva,
			estado: nuevoEstado,
			updated_at: new Date().toISOString()
		};

		// Agregar entrada al historial
		const nuevaEntrada = {
			tipo: 'cambio_estado',
			estado_anterior: estadoAnterior,
			estado_nuevo: nuevoEstado,
			comentario,
			timestamp: new Date().toISOString(),
			// TODO: Integrar con AuthContext en Fase 2 para obtener usuario real
			usuario: 'Sistema'
		};

		setReserva(reservaActualizada);
		setHistorial(prev => [...prev, nuevaEntrada]);
		setError(null);

		return true;
	}, [reserva, validarTransicion]);

	/**
	 * Obtiene los estados siguientes válidos
	 * @returns {string[]} Array de estados válidos
	 */
	const obtenerEstadosDisponibles = useCallback(() => {
		if (!reserva) return [];
		const estadoActual = reserva.estado || ESTADOS_RESERVA.BORRADOR;
		return obtenerEstadosSiguientes(estadoActual);
	}, [reserva]);

	/**
	 * Verifica si una transición específica es válida
	 * @param {string} estado - Estado a verificar
	 * @returns {boolean} true si es válida
	 */
	const puedeTransicionarA = useCallback((estado) => {
		const validacion = validarTransicion(estado);
		return validacion.valido;
	}, [validarTransicion]);

	/**
	 * Actualiza datos de la reserva sin cambiar el estado
	 * @param {Object} datosActualizados - Datos a actualizar
	 */
	const actualizarDatos = useCallback((datosActualizados) => {
		setReserva(prev => ({
			...prev,
			...datosActualizados,
			updated_at: new Date().toISOString()
		}));

		// Agregar entrada al historial
		const nuevaEntrada = {
			tipo: 'modificacion',
			cambios: datosActualizados,
			timestamp: new Date().toISOString(),
			// TODO: Integrar con AuthContext en Fase 2 para obtener usuario real
			usuario: 'Sistema'
		};

		setHistorial(prev => [...prev, nuevaEntrada]);
	}, []);

	/**
	 * Agrega un comentario al historial
	 * @param {string} comentario - Comentario a agregar
	 */
	const agregarComentario = useCallback((comentario) => {
		const nuevaEntrada = {
			tipo: 'comentario',
			comentario,
			timestamp: new Date().toISOString(),
			// TODO: Integrar con AuthContext en Fase 2 para obtener usuario real
			usuario: 'Sistema'
		};

		setHistorial(prev => [...prev, nuevaEntrada]);
	}, []);

	/**
	 * Resetea el estado del hook
	 * @param {Object} nuevaReserva - Nueva reserva a cargar
	 */
	const resetear = useCallback((nuevaReserva = null) => {
		setReserva(nuevaReserva);
		setHistorial(nuevaReserva?.historial || []);
		setError(null);
	}, []);

	return {
		// Estado
		reserva,
		historial,
		error,

		// Funciones de estado
		cambiarEstado,
		validarTransicion,
		obtenerEstadosDisponibles,
		puedeTransicionarA,

		// Funciones de datos
		actualizarDatos,
		agregarComentario,

		// Utilidades
		resetear,
		setReserva
	};
};
