import { useAuth } from "../contexts/AuthContext";
import { getBackendUrl } from "../lib/backend";

/**
 * Hook personalizado para realizar peticiones autenticadas
 * Maneja automáticamente los tokens JWT y su renovación
 */
export const useAuthenticatedFetch = () => {
	const { getValidToken, logout } = useAuth();

	/**
	 * Realizar una petición autenticada
	 * @param {string} url - URL relativa del endpoint (ej: '/api/reservas')
	 * @param {object} options - Opciones de fetch (method, body, etc.)
	 * @returns {Promise<Response>} - Respuesta de la petición
	 */
	const authenticatedFetch = async (url, options = {}) => {
		try {
			// Obtener token válido (renovar si es necesario)
			const token = await getValidToken();

			if (!token) {
				throw new Error("No autenticado");
			}

			// Preparar headers
			const headers = {
				"Content-Type": "application/json",
				...options.headers,
				Authorization: `Bearer ${token}`,
			};

			// Realizar petición
			const response = await fetch(`${getBackendUrl()}${url}`, {
				...options,
				headers,
			});

			// Si el token es inválido, cerrar sesión
			if (response.status === 401) {
				logout();
				throw new Error("Sesión expirada");
			}

			return response;
		} catch (error) {
			console.error("Error en petición autenticada:", error);
			throw error;
		}
	};

	/**
	 * GET autenticado
	 */
	const get = async (url) => {
		const response = await authenticatedFetch(url, { method: "GET" });
		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: "Error en la petición" }));
			throw new Error(error.message || `HTTP ${response.status}`);
		}
		return response.json();
	};

	/**
	 * POST autenticado
	 */
	const post = async (url, data) => {
		const response = await authenticatedFetch(url, {
			method: "POST",
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: "Error en la petición" }));
			throw new Error(error.message || `HTTP ${response.status}`);
		}
		return response.json();
	};

	/**
	 * PUT autenticado
	 */
	const put = async (url, data) => {
		const response = await authenticatedFetch(url, {
			method: "PUT",
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: "Error en la petición" }));
			throw new Error(error.message || `HTTP ${response.status}`);
		}
		return response.json();
	};

	/**
	 * DELETE autenticado
	 */
	const del = async (url) => {
		const response = await authenticatedFetch(url, { method: "DELETE" });
		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: "Error en la petición" }));
			throw new Error(error.message || `HTTP ${response.status}`);
		}
		return response.json();
	};

	return {
		authenticatedFetch,
		get,
		post,
		put,
		delete: del,
	};
};

export default useAuthenticatedFetch;
