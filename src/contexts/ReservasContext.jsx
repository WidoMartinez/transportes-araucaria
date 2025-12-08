/* eslint-disable react-refresh/only-export-components */
import {
	createContext,
	useContext,
	useState,
	useCallback
} from "react";
import { getBackendUrl } from "../lib/backend";
import { ESTADOS_RESERVA, VISTAS_GESTOR } from "../types/reservas";

/**
 * Contexto del Gestor Integral de Reservas
 * 
 * Proporciona estado centralizado y funciones para gestionar reservas,
 * filtros, vistas y selección de reservas.
 */

const ReservasContext = createContext(null);

/**
 * Hook para acceder al contexto de reservas
 * @throws {Error} Si se usa fuera del ReservasProvider
 * @returns {Object} Contexto de reservas
 */
export const useReservas = () => {
	const context = useContext(ReservasContext);
	if (!context) {
		throw new Error("useReservas debe ser usado dentro de un ReservasProvider");
	}
	return context;
};

/**
 * Provider del contexto de reservas
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export const ReservasProvider = ({ children }) => {
	// Estado de las reservas
	const [reservas, setReservas] = useState([]);
	const [selectedReserva, setSelectedReserva] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Estado de la vista
	const [vistaActiva, setVistaActiva] = useState(VISTAS_GESTOR.LISTA);

	// Estado de filtros
	const [filtros, setFiltros] = useState({
		estado: null,
		fechaDesde: null,
		fechaHasta: null,
		busqueda: '',
		estadoPago: null
	});

	/**
	 * Obtiene la lista de reservas desde el backend
	 * @param {Object} parametros - Parámetros de filtrado
	 */
	const fetchReservas = useCallback(async (parametros = {}) => {
		setLoading(true);
		setError(null);

		try {
			const queryParams = new URLSearchParams();
			
			// Aplicar filtros si existen
			if (parametros.estado) {
				queryParams.append('estado', parametros.estado);
			}
			if (parametros.fechaDesde) {
				queryParams.append('fecha_desde', parametros.fechaDesde);
			}
			if (parametros.fechaHasta) {
				queryParams.append('fecha_hasta', parametros.fechaHasta);
			}
			if (parametros.busqueda) {
				queryParams.append('busqueda', parametros.busqueda);
			}

			const url = `${getBackendUrl()}/api/reservas?${queryParams.toString()}`;
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Error al cargar reservas: ${response.status}`);
			}

			const data = await response.json();
			setReservas(data.reservas || []);
		} catch (err) {
			console.error('Error al cargar reservas:', err);
			setError(err.message);
			setReservas([]);
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Crea una nueva reserva
	 * @param {Object} datosReserva - Datos de la nueva reserva
	 * @returns {Promise<Object>} Reserva creada
	 */
	const createReserva = useCallback(async (datosReserva) => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(datosReserva)
			});

			if (!response.ok) {
				throw new Error(`Error al crear reserva: ${response.status}`);
			}

			const data = await response.json();
			
			// Agregar la nueva reserva al estado
			setReservas(prev => [data.reserva, ...prev]);
			
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
	const updateReserva = useCallback(async (id, datosActualizados) => {
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
				throw new Error(`Error al actualizar reserva: ${response.status}`);
			}

			const data = await response.json();
			
			// Actualizar la reserva en el estado
			setReservas(prev => 
				prev.map(r => r.id === id ? data.reserva : r)
			);

			// Si es la reserva seleccionada, actualizarla también
			if (selectedReserva?.id === id) {
				setSelectedReserva(data.reserva);
			}
			
			return data.reserva;
		} catch (err) {
			console.error('Error al actualizar reserva:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [selectedReserva]);

	/**
	 * Elimina una reserva
	 * @param {number} id - ID de la reserva a eliminar
	 */
	const deleteReserva = useCallback(async (id) => {
		setLoading(true);
		setError(null);

		try {
			const url = `${getBackendUrl()}/api/reservas/${id}`;
			const response = await fetch(url, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error(`Error al eliminar reserva: ${response.status}`);
			}

			// Remover la reserva del estado
			setReservas(prev => prev.filter(r => r.id !== id));

			// Si es la reserva seleccionada, limpiar selección
			if (selectedReserva?.id === id) {
				setSelectedReserva(null);
			}
		} catch (err) {
			console.error('Error al eliminar reserva:', err);
			setError(err.message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [selectedReserva]);

	/**
	 * Aplica filtros a las reservas
	 * @param {Object} nuevosFiltros - Nuevos filtros a aplicar
	 */
	const applyFilters = useCallback((nuevosFiltros) => {
		setFiltros(prev => ({
			...prev,
			...nuevosFiltros
		}));

		// Recargar reservas con los nuevos filtros
		fetchReservas(nuevosFiltros);
	}, [fetchReservas]);

	/**
	 * Limpia todos los filtros aplicados
	 */
	const clearFilters = useCallback(() => {
		const filtrosVacios = {
			estado: null,
			fechaDesde: null,
			fechaHasta: null,
			busqueda: '',
			estadoPago: null
		};
		setFiltros(filtrosVacios);
		fetchReservas();
	}, [fetchReservas]);

	/**
	 * Cambia la vista activa del gestor
	 * @param {string} vista - Nueva vista (lista, kanban, calendario)
	 */
	const cambiarVista = useCallback((vista) => {
		if (Object.values(VISTAS_GESTOR).includes(vista)) {
			setVistaActiva(vista);
		}
	}, []);

	// Valor del contexto
	const value = {
		// Estado
		reservas,
		selectedReserva,
		loading,
		error,
		vistaActiva,
		filtros,

		// Funciones de gestión de reservas
		fetchReservas,
		createReserva,
		updateReserva,
		deleteReserva,

		// Funciones de selección
		setSelectedReserva,

		// Funciones de filtrado
		applyFilters,
		clearFilters,

		// Funciones de vista
		cambiarVista,

		// Funciones de estado local
		setReservas,
		setError
	};

	return (
		<ReservasContext.Provider value={value}>
			{children}
		</ReservasContext.Provider>
	);
};
