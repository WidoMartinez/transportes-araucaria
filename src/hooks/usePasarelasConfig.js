/**
 * Hook para obtener la configuración de pasarelas de pago desde el backend.
 * Lee qué pasarelas están habilitadas y cuáles son sus imágenes configuradas.
 * Los datos se cachean en sessionStorage para evitar múltiples peticiones por página.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { getBackendUrl } from "../lib/backend";

// Configuración predeterminada si el backend no está disponible
const PASARELAS_DEFAULT = {
	flow: {
		habilitado: true,
		nombre: "Flow",
		descripcion: "Tarjeta / Débito",
		imagen_url: null,
	},
	mercadopago: {
		habilitado: true,
		nombre: "Mercado Pago",
		descripcion: "MP / Débito / Cuotas",
		imagen_url: null,
	},
};

const CACHE_KEY = "config_pasarelas_pago_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de caché
// Evento para notificar a todas las instancias del hook que recarguen
const REFRESH_EVENT = "pasarelas-config-refresh";

/**
 * Devuelve la configuración de pasarelas y las pasarelas habilitadas como arreglo.
 * - `pasarelas`: objeto con la configuración completa { flow: {...}, mercadopago: {...} }
 * - `pasarelasHabilitadas`: arreglo con las pasarelas activas [{ id, nombre, descripcion, imagen_url }]
 * - `loading`: true mientras se carga la configuración
 * - `error`: mensaje de error si la carga falla
 * - `recargar`: función para forzar recarga del backend
 */
export function usePasarelasConfig() {
	const [pasarelas, setPasarelas] = useState(PASARELAS_DEFAULT);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// useCallback estabiliza la referencia para usarla en el listener de eventos
	const cargar = useCallback(async (forzar = false) => {
		// Verificar caché en sessionStorage
		if (!forzar) {
			try {
				const cached = sessionStorage.getItem(CACHE_KEY);
				if (cached) {
					const { data, ts } = JSON.parse(cached);
					if (Date.now() - ts < CACHE_TTL_MS) {
						setPasarelas(data);
						setLoading(false);
						return;
					}
				}
			} catch {
				// Si el parsing falla se ignora el caché
			}
		}

		try {
			setLoading(true);
			const res = await fetch(
				`${getBackendUrl()}/api/configuracion/pasarelas-pago`,
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			const datos = json.pasarelas || PASARELAS_DEFAULT;
			setPasarelas(datos);
			setError(null);
			// Guardar en caché
			try {
				sessionStorage.setItem(
					CACHE_KEY,
					JSON.stringify({ data: datos, ts: Date.now() }),
				);
			} catch {
				// sessionStorage puede no estar disponible
			}
		} catch (err) {
			console.warn(
				"No se pudo cargar configuración de pasarelas:",
				err.message,
			);
			setError(err.message);
			// En caso de error se usan los valores predeterminados
			setPasarelas(PASARELAS_DEFAULT);
		} finally {
			setLoading(false);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		cargar();
		// Escucha el evento de refresco: cuando el admin guarda/sube imagen,
		// todas las instancias del hook (en los flujos de pago) recargan del backend
		const onRefresh = () => cargar(true);
		window.addEventListener(REFRESH_EVENT, onRefresh);
		return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
	}, [cargar]);

	// Arreglo memoizado con las pasarelas habilitadas en orden: flow primero.
	// useMemo estabiliza la referencia para que el useEffect en SelectorPasarela
	// no se dispare en cada render, solo cuando el contenido real cambia.
	const pasarelasHabilitadas = useMemo(
		() =>
			["flow", "mercadopago"]
				.filter((id) => pasarelas[id]?.habilitado)
				.map((id) => ({ id, ...pasarelas[id] })),
		[pasarelas],
	);

	return {
		pasarelas,
		pasarelasHabilitadas,
		loading,
		error,
		recargar: () => cargar(true),
	};
}

/**
 * Invalida el caché de pasarelas. Úsalo después de guardar la configuración
 * en AdminConfiguracion para que los flujos de pago lean la nueva config.
 */
export function invalidarCachePasarelas() {
	try {
		sessionStorage.removeItem(CACHE_KEY);
	} catch {
		// ignorar
	}
	// Notificar a todas las instancias del hook montadas para que recarguen del backend
	window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
}
