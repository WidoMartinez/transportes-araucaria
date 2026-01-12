import { useCallback, useState } from 'react';
import { getBackendUrl } from '../lib/backend';
import { ESTADOS_RESERVA, TIPOS_EVENTO } from '../types/reservas';

/**
 * Hook para ejecutar acciones sobre reservas
 * 
 * Proporciona funciones para realizar operaciones comunes sobre reservas
 * como crear, actualizar, cambiar estado, asignar recursos, registrar pagos, etc.
 * 
 * @returns {Object} Funciones de acción y estado de carga
 */
export const useReservaActions = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	/**
	 * Crea una nueva reserva
	 * @param {Object} datosReserva - Datos de la reserva
	 * @returns {Promise<Object>} Reserva creada
	 */
	const crearReserva = useCallback(async (datosReserva) => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...datosReserva,
					estado: datosReserva.estado || ESTADOS_RESERVA.BORRADOR
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al crear reserva');
			}

			const data = await response.json();
			return data.reserva;
		} catch (err) {
			console.error('Error al crear reserva:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Actualiza una reserva existente
	 * @param {number} id - ID de la reserva
	 * @param {Object} datosActualizados - Datos a actualizar
	 * @returns {Promise<Object>} Reserva actualizada
	 */
	const actualizarReserva = useCallback(async (id, datosActualizados) => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas/${id}`;
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(datosActualizados)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al actualizar reserva');
			}

			const data = await response.json();
			return data.reserva;
		} catch (err) {
			console.error('Error al actualizar reserva:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Cambia el estado de una reserva
	 * @param {number} id - ID de la reserva
	 * @param {string} nuevoEstado - Nuevo estado
	 * @param {string} comentario - Comentario opcional
	 * @returns {Promise<Object>} Reserva actualizada
	 */
	const cambiarEstado = useCallback(async (id, nuevoEstado, comentario = '') => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas/${id}/estado`;
			const response = await fetch(url, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					estado: nuevoEstado,
					comentario
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al cambiar estado');
			}

			const data = await response.json();
			return data.reserva;
		} catch (err) {
			console.error('Error al cambiar estado:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Asigna vehículo y conductor a una reserva
	 * @param {number} id - ID de la reserva
	 * @param {number} vehiculoId - ID del vehículo
	 * @param {number} conductorId - ID del conductor
	 * @returns {Promise<Object>} Reserva actualizada
	 */
	const asignarRecursos = useCallback(async (id, vehiculoId, conductorId) => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas/${id}/asignar`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					vehiculo_id: vehiculoId,
					conductor_id: conductorId
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al asignar recursos');
			}

			const data = await response.json();
			return data.reserva;
		} catch (err) {
			console.error('Error al asignar recursos:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Registra un pago para una reserva
	 * @param {number} id - ID de la reserva
	 * @param {Object} datosPago - Información del pago
	 * @param {number} datosPago.monto - Monto del pago
	 * @param {string} datosPago.metodo - Método de pago
	 * @param {string} datosPago.referencia - Referencia del pago
	 * @returns {Promise<Object>} Reserva actualizada con el pago registrado
	 */
	const registrarPago = useCallback(async (id, datosPago) => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas/${id}/pagos`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(datosPago)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al registrar pago');
			}

			const data = await response.json();
			return data.reserva;
		} catch (err) {
			console.error('Error al registrar pago:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Envía una notificación al cliente
	 * @param {number} id - ID de la reserva
	 * @param {string} tipo - Tipo de notificación (confirmacion, recordatorio, etc.)
	 * @param {Object} datosAdicionales - Datos adicionales para la notificación
	 * @returns {Promise<boolean>} true si se envió correctamente
	 */
	const enviarNotificacion = useCallback(async (id, tipo, datosAdicionales = {}) => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas/${id}/notificar`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					tipo,
					...datosAdicionales
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al enviar notificación');
			}

			return true;
		} catch (err) {
			console.error('Error al enviar notificación:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Cancela una reserva
	 * @param {number} id - ID de la reserva
	 * @param {string} motivo - Motivo de la cancelación
	 * @returns {Promise<Object>} Reserva cancelada
	 */
	const cancelarReserva = useCallback(async (id, motivo = '') => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas/${id}/cancelar`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ motivo })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al cancelar reserva');
			}

			const data = await response.json();
			return data.reserva;
		} catch (err) {
			console.error('Error al cancelar reserva:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Duplica una reserva existente
	 * @param {number} id - ID de la reserva a duplicar
	 * @returns {Promise<Object>} Nueva reserva creada
	 */
	const duplicarReserva = useCallback(async (id) => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas/${id}/duplicar`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				}
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al duplicar reserva');
			}

			const data = await response.json();
			return data.reserva;
		} catch (err) {
			console.error('Error al duplicar reserva:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Agrega un comentario a la reserva
	 * @param {number} id - ID de la reserva
	 * @param {string} comentario - Comentario a agregar
	 * @returns {Promise<Object>} Reserva actualizada
	 */
	const agregarComentario = useCallback(async (id, comentario) => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas/${id}/comentarios`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ comentario })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error al agregar comentario');
			}

			const data = await response.json();
			return data.reserva;
		} catch (err) {
			console.error('Error al agregar comentario:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		// Estado
		loading,
		error,

		// Acciones principales
		crearReserva,
		actualizarReserva,
		cambiarEstado,

		// Asignación
		asignarRecursos,

		// Pagos
		registrarPago,

		// Comunicaciones
		enviarNotificacion,

		// Operaciones
		cancelarReserva,
		duplicarReserva,
		agregarComentario,

		// Utilidades
		setError
	};
};
