import { useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { getBackendUrl } from "../lib/backend";

const AEROPUERTO_LABEL = "Aeropuerto La Araucanía";
const normalizeDestino = (value) => (value || "").toString().trim().toLowerCase();

export function useCatalogos() {
	const { accessToken } = useAuth();
	const { authenticatedFetch } = useAuthenticatedFetch();
	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	// --- Destinos ---
	const [destinosCatalog, setDestinosCatalog] = useState([]);
	
	const fetchDestinosCatalog = useCallback(async () => {
		try {
			const resp = await fetch(`${apiUrl}/pricing`);
			if (resp.ok) {
				const data = await resp.json();
				const names = Array.isArray(data.destinos)
					? data.destinos
							.map((d) => (d && d.nombre ? String(d.nombre).trim() : ""))
							.filter(Boolean)
					: [];
				const uniqueNames = [...new Set(names)];
				const includesAeropuerto = uniqueNames.some(
					(n) => normalizeDestino(n) === normalizeDestino(AEROPUERTO_LABEL)
				);
				const merged = includesAeropuerto
					? uniqueNames
					: [AEROPUERTO_LABEL, ...uniqueNames];
				setDestinosCatalog(merged);
			}
		} catch {
			setDestinosCatalog([AEROPUERTO_LABEL]);
		}
	}, [apiUrl]);

	// --- Estadísticas ---
	const [estadisticas, setEstadisticas] = useState({
		totalReservas: 0,
		reservasPendientes: 0,
		reservasConfirmadas: 0,
		reservasPagadas: 0,
		totalIngresos: 0,
	});

	const fetchEstadisticas = useCallback(async () => {
		try {
			const response = await fetch(`${apiUrl}/api/reservas/estadisticas`, {
				headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
			});
			if (response.ok) {
				const data = await response.json();
				setEstadisticas(data);
			} else {
				console.warn(
					`Error cargando estadísticas: ${response.status} ${response.statusText}`
				);
				// Establecer estadísticas por defecto en caso de error
				setEstadisticas({
					totalReservas: 0,
					reservasPendientes: 0,
					reservasConfirmadas: 0,
					reservasPagadas: 0,
					totalIngresos: 0,
				});
			}
		} catch (error) {
			console.error("Error cargando estadísticas:", error);
			setEstadisticas({
				totalReservas: 0,
				reservasPendientes: 0,
				reservasConfirmadas: 0,
				reservasPagadas: 0,
				totalIngresos: 0,
			});
		}
	}, [apiUrl, accessToken]);

	// --- Vehículos ---
	const [vehiculos, setVehiculos] = useState([]);

	const fetchVehiculos = useCallback(async () => {
		try {
			const response = await authenticatedFetch(`/api/vehiculos`);
			if (response.ok) {
				const data = await response.json();
				setVehiculos(data.vehiculos || []);
			}
		} catch (error) {
			console.error("Error cargando vehículos:", error);
		}
	}, [authenticatedFetch]);

	// --- Conductores ---
	const [conductores, setConductores] = useState([]);

	const fetchConductores = useCallback(async () => {
		try {
			const response = await authenticatedFetch(`/api/conductores`);
			if (response.ok) {
				const data = await response.json();
				setConductores(data.conductores || []);
			}
		} catch (error) {
			console.error("Error cargando conductores:", error);
		}
	}, [authenticatedFetch]);

	// Función para cargar todo (opcional por si queremos llamarlos juntos en useEffect inicial)
	const fetchAllCatalogos = useCallback(() => {
		fetchDestinosCatalog();
		fetchEstadisticas();
		fetchVehiculos();
		fetchConductores();
	}, [fetchDestinosCatalog, fetchEstadisticas, fetchVehiculos, fetchConductores]);

	return {
		AEROPUERTO_LABEL,
		normalizeDestino,
		destinosCatalog,
		setDestinosCatalog, // por si se necesita modificar directamente
		fetchDestinosCatalog,

		estadisticas,
		fetchEstadisticas,

		vehiculos,
		fetchVehiculos,

		conductores,
		fetchConductores,
		
		fetchAllCatalogos
	};
}
