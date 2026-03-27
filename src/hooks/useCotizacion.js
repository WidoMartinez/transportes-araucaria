/**
 * useCotizacion.js — Hook de cotización centralizada
 *
 * Reemplaza el useMemo `pricing` de App.jsx que calculaba precios en el cliente.
 * Ahora la fuente de verdad del precio es el backend (POST /api/cotizar).
 *
 * VENTAJAS:
 *  - Sin ventana de inconsistencia: tarifa dinámica + descuentos en una sola llamada.
 *  - Sin lógica de negocio en el frontend (no manipulable por el usuario).
 *  - Estado de carga explícito para mostrar indicador al usuario.
 *
 * USO:
 *   const { cotizacion, cargando, error } = useCotizacion(params);
 *
 * `params` se puede pasar directamente desde formData de App.jsx.
 * El hook aplica debounce de 400ms para no saturar el backend al teclear.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Obtiene la URL base del backend, usando la misma lógica que el resto de la app.
 * @returns {string}
 */
const getBackendUrl = () =>
	typeof window !== "undefined" && window.__BACKEND_URL__
		? window.__BACKEND_URL__
		: import.meta.env?.VITE_BACKEND_URL ||
		  "https://transportes-araucaria.onrender.com";

/** Estado inicial del resultado de cotización (cuando no hay datos aún) */
const COTIZACION_VACIA = {
	vehiculo: null,
	esUpgradeVan: false,
	precioBaseIda: null,
	precioBaseVuelta: 0,
	precioBase: null,
	tarifaDinamica: { ida: null },
	descuentos: {
		online: 0,
		personalizados: 0,
		promocion: 0,
		roundTrip: 0,
		codigo: 0,
		total: 0,
		limiteAplicado: false,
		promocionActiva: null,
		codigoAplicado: null,
	},
	extras: { sillas: 0, cantidadSillas: 0 },
	totalConDescuento: null,
	abono: null,
	saldoPendiente: null,
};

// ─── Comparación superficial de parámetros ────────────────────────────────────

/**
 * Compara dos objetos de parámetros de cotización de forma superficial.
 * Evita re-llamadas al backend cuando los valores no cambiaron.
 */
const sonIguales = (a, b) => {
	if (!a || !b) return a === b;
	const campos = [
		"origen", "destino", "pasajeros", "fecha", "hora",
		"idaVuelta", "fechaRegreso", "horaRegreso", "upgradeVan",
		"codigoDescuento", "sillaInfantil", "cantidadSillas",
	];
	return campos.every((c) => a[c] === b[c]);
};

// ─── Hook principal ───────────────────────────────────────────────────────────

/**
 * @param {object|null} params - Parámetros del viaje a cotizar.
 *   Si es null o si faltan campos requeridos, no se realiza la llamada.
 * @param {object}      [opciones]
 * @param {number}      [opciones.debounceMs=400] - Tiempo de debounce en ms
 * @returns {{ cotizacion: object, cargando: boolean, error: string|null }}
 */
export const useCotizacion = (params, { debounceMs = 400 } = {}) => {
	const [cotizacion, setCotizacion] = useState(COTIZACION_VACIA);
	const [cargando, setCargando] = useState(false);
	const [error, setError] = useState(null);

	// Ref para comparar params previos y evitar llamadas innecesarias
	const ultimosParamsRef = useRef(null);
	// Ref para cancelar llamadas anteriores (AbortController)
	const abortRef = useRef(null);
	// Ref para el timer de debounce
	const timerRef = useRef(null);

	// Función de llamada al backend (estable entre renders)
	const llamarBackend = useCallback(async (p) => {
		// Cancelar llamada anterior si existe
		if (abortRef.current) abortRef.current.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setCargando(true);
		setError(null);

		try {
			const response = await fetch(`${getBackendUrl()}/api/cotizar`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(p),
				signal: controller.signal,
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error || `Error ${response.status} al cotizar`);
			}

			const resultado = await response.json();
			setCotizacion(resultado);
		} catch (err) {
			// Ignorar errores de cancelación (AbortError)
			if (err.name !== "AbortError") {
				console.error("useCotizacion — error al cotizar:", err);
				setError(err.message || "Error desconocido al cotizar");
				setCotizacion(COTIZACION_VACIA);
			}
		} finally {
			setCargando(false);
		}
	}, []);

	useEffect(() => {
		// Si no hay params o faltan campos mínimos, resetear
		if (!params?.origen || !params?.destino || !params?.pasajeros || !params?.fecha) {
			setCotizacion(COTIZACION_VACIA);
			setError(null);
			setCargando(false);
			return;
		}

		// Evitar llamada si los params no cambiaron
		if (sonIguales(params, ultimosParamsRef.current)) return;
		ultimosParamsRef.current = { ...params };

		// Limpiar timer anterior
		if (timerRef.current) clearTimeout(timerRef.current);

		// Aplicar debounce antes de llamar al backend
		timerRef.current = setTimeout(() => {
			llamarBackend(params);
		}, debounceMs);

		// Cleanup al desmontar o al cambiar params
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [params, debounceMs, llamarBackend]);

	// Cleanup al desmontar el componente
	useEffect(() => {
		return () => {
			if (abortRef.current) abortRef.current.abort();
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	return { cotizacion, cargando, error };
};

export default useCotizacion;
