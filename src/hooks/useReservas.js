import { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getBackendUrl } from "../lib/backend";

export function useReservas() {
	const { accessToken } = useAuth();
	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	// --- Estados de Datos ---
	const [reservas, setReservas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// --- Estados de Filtros y Búsqueda ---
	const [searchTerm, setSearchTerm] = useState("");
	const [estadoFiltro, setEstadoFiltro] = useState("todos");
	const [estadoPagoFiltro, setEstadoPagoFiltro] = useState("todos");
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");
	const [filtroInteligente, setFiltroInteligente] = useState("todos"); // 'sin_asignacion', 'incompletas', 'archivadas'
	const [rangoFecha, setRangoFecha] = useState("todos");
	
	// --- Estado de Ordenamiento ---
	const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });

	// --- Estados de Paginación ---
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalReservas, setTotalReservas] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [isSaving, setIsSaving] = useState(false);

	// --- Lógica de Fechas Locales ---
	const formatDateLocal = (date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const handleRangoFechaChange = useCallback((valor) => {
		setRangoFecha(valor);
		const hoy = new Date();
		
		let desde = "";
		let hasta = "";

		if (valor === "hoy") {
			const hoyStr = formatDateLocal(hoy);
			desde = hoyStr;
			hasta = hoyStr;
		} else if (valor === "ayer") {
			const ayer = new Date(hoy);
			ayer.setDate(hoy.getDate() - 1);
			const ayerStr = formatDateLocal(ayer);
			desde = ayerStr;
			hasta = ayerStr;
		} else if (valor === "semana") { // Últimos 7 días
			const hace7 = new Date(hoy);
			hace7.setDate(hoy.getDate() - 7);
			desde = formatDateLocal(hace7);
			hasta = formatDateLocal(hoy);
		} else if (valor === "quincena") { // Últimos 15 días
			const hace15 = new Date(hoy);
			hace15.setDate(hoy.getDate() - 15);
			desde = formatDateLocal(hace15);
			hasta = formatDateLocal(hoy);
		} else if (valor === "mes") { // Mes actual
			const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
			desde = formatDateLocal(primerDia);
			const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
			hasta = formatDateLocal(ultimoDia);
		} else if (valor === "todos") {
			desde = "";
			hasta = "";
		}
		
		if (valor !== "personalizado") {
			setFechaDesde(desde);
			setFechaHasta(hasta);
		}
	}, []);

	const handleSort = useCallback((key) => {
		setSortConfig((prev) => {
			let direction = "asc";
			if (prev.key === key && prev.direction === "asc") {
				direction = "desc";
			}
			return { key, direction };
		});
	}, []);

	const fetchReservas = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				page: currentPage,
				limit: itemsPerPage,
			});

			if (estadoFiltro !== "todos") {
				params.append("estado", estadoFiltro);
			}

			if (fechaDesde && String(fechaDesde).trim() !== "") {
				params.append("fecha_desde", fechaDesde);
			}

			if (fechaHasta && String(fechaHasta).trim() !== "") {
				params.append("fecha_hasta", fechaHasta);
			}

			if (filtroInteligente === "sin_asignacion") {
				params.append("sin_asignacion", "true");
			} else if (filtroInteligente === "incompletas") {
				params.append("estado_avanzado", "incompletas");
			} else if (filtroInteligente === "archivadas") {
				params.append("archivadas", "true");
			}

			params.append("incluir_cerradas", "true");

			if (sortConfig.key) {
				params.append("sort", sortConfig.key);
				params.append("order", sortConfig.direction);
			}

			const response = await fetch(`${apiUrl}/api/reservas?${params}`);

			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			const reservasNormalizadas = (data.reservas || []).map((reserva) => {
				const cliente = reserva.cliente || {};
				return {
					...reserva,
					esCliente: cliente.esCliente || false,
					nombre: cliente.nombre || reserva.nombre || "",
					rut: cliente.rut || reserva.rut || "",
					email: cliente.email || reserva.email || "",
					telefono: cliente.telefono || reserva.telefono || "",
					clienteId: cliente.id || reserva.clienteId || null,
					clasificacionCliente: cliente.clasificacion || null,
					totalReservas: cliente.totalReservas || 0,
					abonoPagado: Boolean(reserva.abonoPagado),
					saldoPagado: Boolean(reserva.saldoPagado),
				};
			});
			setReservas(reservasNormalizadas);
			const nuevasTotalPages = data.pagination?.totalPages || 1;
			setTotalPages(nuevasTotalPages);
			if (currentPage > nuevasTotalPages) {
				setCurrentPage(Math.max(1, nuevasTotalPages));
			}
			setTotalReservas(data.pagination?.total || 0);
		} catch (error) {
			console.error("Error cargando reservas:", error);
			setError(error.message || "Error al cargar las reservas");
		} finally {
			setLoading(false);
		}
	}, [
		apiUrl,
		currentPage,
		itemsPerPage,
		estadoFiltro,
		fechaDesde,
		fechaHasta,
		filtroInteligente,
		sortConfig,
	]);

	const handleSave = useCallback(async (reservaId, formData) => {
		setIsSaving(true);
		try {
			const response = await fetch(`${apiUrl}/api/reservas/${reservaId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Error al guardar la reserva");
			}

			await fetchReservas();
			return await response.json();
		} catch (error) {
			console.error("Error al guardar reserva:", error);
			throw error;
		} finally {
			setIsSaving(false);
		}
	}, [apiUrl, accessToken, fetchReservas]);

	const handleSaveNewReserva = useCallback(async (newReservaForm) => {
		setIsSaving(true);
		try {
			const response = await fetch(`${apiUrl}/api/reservas`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(newReservaForm),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Error al crear la reserva");
			}

			await fetchReservas();
			return await response.json();
		} catch (error) {
			console.error("Error al crear reserva:", error);
			throw error;
		} finally {
			setIsSaving(false);
		}
	}, [apiUrl, accessToken, fetchReservas]);

	const handleArchivar = useCallback(async (reserva) => {
		if (
			!window.confirm(
				`¿Estás seguro de que deseas ${
					reserva.archivada ? "desarchivar" : "archivar"
				} esta reserva?`
			)
		) {
			return;
		}

		try {
			const response = await fetch(
				`${apiUrl}/api/reservas/${reserva.id}/archivar`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify({ archivada: !reserva.archivada }),
				}
			);

			if (response.ok) {
				await fetchReservas();
			} else {
				alert("Error al cambiar estado de archivado");
			}
		} catch (error) {
			console.error("Error archivando reserva:", error);
			alert("Error al conectar con el servidor");
		}
	}, [apiUrl, accessToken, fetchReservas]);

	const handleBulkChangeStatus = useCallback(async (selectedReservas, bulkEstado) => {
		if (!bulkEstado) {
			alert("Por favor selecciona un estado");
			return;
		}

		setIsSaving(true);
		try {
			const promises = selectedReservas.map((id) =>
				fetch(`${apiUrl}/api/reservas/${id}/estado`, {
					method: "PUT",
					headers: { 
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`
					},
					body: JSON.stringify({ estado: bulkEstado }),
				})
			);

			await Promise.all(promises);
			await fetchReservas();
			alert(`Estado actualizado para ${selectedReservas.length} reserva(s)`);
		} catch (error) {
			console.error("Error actualizando estado:", error);
			alert("Error al actualizar el estado de algunas reservas");
		} finally {
			setIsSaving(false);
		}
	}, [apiUrl, accessToken, fetchReservas]);

	const handleBulkDelete = useCallback(async (selectedReservas) => {
		if (!window.confirm(`¿Estás seguro de que deseas eliminar ${selectedReservas.length} reserva(s)?`)) {
			return;
		}

		setIsSaving(true);
		try {
			const results = await Promise.all(
				selectedReservas.map((id) =>
					fetch(`${apiUrl}/api/reservas/${id}`, {
						method: "DELETE",
						headers: {
							Authorization: `Bearer ${accessToken}`
						}
					})
				)
			);

			const failures = [];
			for (let i = 0; i < results.length; i++) {
				if (!results[i].ok) {
					failures.push(selectedReservas[i]);
				}
			}

			if (failures.length > 0) {
				alert(`Hubo errores al eliminar algunas reservas (#${failures.join(", #")})`);
			} else {
				alert(`${selectedReservas.length} reserva(s) eliminada(s) exitosamente`);
			}

			await fetchReservas();
		} catch (error) {
			console.error("Error eliminando reservas:", error);
			alert("Error al eliminar algunas reservas");
		} finally {
			setIsSaving(false);
		}
	}, [apiUrl, accessToken, fetchReservas]);

	// Auto-fetch cuando cambien los parámetros principales
	useEffect(() => {
		fetchReservas();
	}, [fetchReservas]);

	// Filtrado local adicional (por término de búsqueda y estado de pago)
	const reservasFiltradas = useMemo(() => {
		let filtered = reservas;

		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(r) =>
					r.nombre?.toLowerCase().includes(term) ||
					r.email?.toLowerCase().includes(term) ||
					r.telefono?.toLowerCase().includes(term) ||
					r.id?.toString().includes(term)
			);
		}

		if (estadoPagoFiltro !== "todos") {
			filtered = filtered.filter((r) => r.estadoPago === estadoPagoFiltro);
		}

		return filtered;
	}, [reservas, searchTerm, estadoPagoFiltro]);

	const toggleClienteManual = useCallback(async (clienteId, esActualmenteCliente) => {
		try {
			const response = await fetch(`${apiUrl}/api/clientes/${clienteId}/toggle-cliente`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({ esCliente: !esActualmenteCliente }),
			});

			if (response.ok) {
				await fetchReservas();
			} else {
				alert("Error al cambiar tipo de cliente");
			}
		} catch (error) {
			console.error("Error toggle-cliente:", error);
			alert("Error al conectar con el servidor");
		}
	}, [apiUrl, accessToken, fetchReservas]);

	return {
		reservas,
		reservasFiltradas,
		loading,
		error,
		fetchReservas,

		// Paginación
		currentPage,
		setCurrentPage,
		totalPages,
		totalReservas,
		itemsPerPage,
		setItemsPerPage,

		// Filtros
		searchTerm,
		setSearchTerm,
		estadoFiltro,
		setEstadoFiltro,
		estadoPagoFiltro,
		setEstadoPagoFiltro,
		fechaDesde,
		setFechaDesde,
		fechaHasta,
		setFechaHasta,
		rangoFecha,
		handleRangoFechaChange,
		filtroInteligente,
		setFiltroInteligente,

		// Ordenamiento
		sortConfig,
		handleSort,

		// Mutaciones
		isSaving,
		handleSave,
		handleSaveNewReserva,
		handleArchivar,
		handleBulkChangeStatus,
		handleBulkDelete,
		toggleClienteManual,
	};
}
