import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getBackendUrl } from "../lib/backend";

/**
 * Hook personalizado para realizar peticiones autenticadas
 * Maneja automáticamente los tokens JWT y su renovación
 */
export const useAuthenticatedFetch = () => {
	const { getValidToken, logout, renewToken } = useAuth();

	/**
	 * Realizar una petición autenticada
	 * @param {string} url - URL relativa del endpoint (ej: '/api/reservas')
	 * @param {object} options - Opciones de fetch (method, body, etc.)
	 * @returns {Promise<Response>} - Respuesta de la petición
	 */
	const authenticatedFetch = useCallback(
		async (url, options = {}) => {
			try {
				// Obtener token actual
				const token = await getValidToken();

				if (!token) {
					throw new Error("No autenticado");
				}

				// Preparar headers y realizar petición
				const getHeaders = (t) => ({
					"Content-Type": "application/json",
					...options.headers,
					Authorization: `Bearer ${t}`,
				});

				let response = await fetch(`${getBackendUrl()}${url}`, {
					...options,
					headers: getHeaders(token),
				});

				// Si el token es inválido (401), intentar renovar una vez
				if (response.status === 401) {
					console.warn("Token expirado (401). Intentando renovar...");
					const newToken = await renewToken();

					if (newToken) {
						console.log("Token renovado. Reintentando petición...");
						response = await fetch(`${getBackendUrl()}${url}`, {
							...options,
							headers: getHeaders(newToken),
						});
					}

					// Si después de intentar renovar sigue siendo 401 (o 403), cerrar sesión
					if (response.status === 401 || response.status === 403) {
						console.error("Sesión expirada o inválida después de intento de renovación.");
						logout();
						throw new Error("Sesión expirada");
					}

					// Si newToken es null por un error temporal (ej. 429), no cerrar sesión
					if (!newToken) {
						throw new Error("No se pudo renovar el token por un error temporal del servidor.");
					}
				}

				return response;
			} catch (error) {
				console.error("Error en petición autenticada:", error);
				throw error;
			}
		},
		[getValidToken, logout, renewToken]
	);

	/**
	 * GET autenticado
	 */
	const get = useCallback(async (url) => {
		const response = await authenticatedFetch(url, { method: "GET" });
		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: "Error en la petición" }));
			throw new Error(error.message || `HTTP ${response.status}`);
		}
		return response.json();
	}, [authenticatedFetch]);

	/**
	 * POST autenticado
	 */
	const post = useCallback(async (url, data) => {
		const response = await authenticatedFetch(url, {
			method: "POST",
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: "Error en la petición" }));
			throw new Error(error.message || `HTTP ${response.status}`);
		}
		return response.json();
	}, [authenticatedFetch]);

	/**
	 * PUT autenticado
	 */
	const put = useCallback(async (url, data) => {
		const response = await authenticatedFetch(url, {
			method: "PUT",
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: "Error en la petición" }));
			throw new Error(error.message || `HTTP ${response.status}`);
		}
		return response.json();
	}, [authenticatedFetch]);

	/**
	 * DELETE autenticado
	 */
	const del = useCallback(async (url) => {
		const response = await authenticatedFetch(url, { method: "DELETE" });
		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: "Error en la petición" }));
			throw new Error(error.message || `HTTP ${response.status}`);
		}
		return response.json();
	}, [authenticatedFetch]);

	return {
		authenticatedFetch,
		get,
		post,
		put,
		delete: del,
	};
};

export default useAuthenticatedFetch;
