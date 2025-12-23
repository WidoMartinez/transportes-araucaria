/* eslint-disable react-refresh/only-export-components */
import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import { getBackendUrl } from "../lib/backend";

/**
 * Contexto de Autenticación
 * Maneja el estado de autenticación del usuario administrador
 */

const AuthContext = createContext(null);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth debe ser usado dentro de un AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [accessToken, setAccessToken] = useState(null);
	const [refreshToken, setRefreshToken] = useState(null);

	// Cargar usuario y tokens del localStorage al iniciar
	useEffect(() => {
		const storedUser = localStorage.getItem("adminUser");
		const storedAccessToken = localStorage.getItem("adminAccessToken");
		const storedRefreshToken = localStorage.getItem("adminRefreshToken");

		if (storedUser && storedAccessToken) {
			try {
				setUser(JSON.parse(storedUser));
				setAccessToken(storedAccessToken);
				setRefreshToken(storedRefreshToken);
			} catch (error) {
				console.error("Error al parsear datos de usuario:", error);
				localStorage.removeItem("adminUser");
				localStorage.removeItem("adminAccessToken");
				localStorage.removeItem("adminRefreshToken");
			}
		}

		setLoading(false);
	}, []);

	/**
	 * Iniciar sesión
	 */
	const login = useCallback(async (username, password) => {
		try {
			const response = await fetch(`${getBackendUrl()}/api/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			});

			// Capturar respuesta para debugging
			let data;
			try {
				data = await response.json();
			} catch (parseError) {
				console.error("Error al parsear respuesta JSON:", parseError);
				console.error("Status:", response.status, response.statusText);
				throw new Error(`Error del servidor (${response.status}): No se pudo parsear la respuesta`);
			}

			console.log("Respuesta del login:", { status: response.status, data });

			if (!response.ok) {
				throw new Error(data.message || "Error al iniciar sesión");
			}

			// Guardar datos en estado y localStorage
			const { accessToken, refreshToken, user } = data.data;

			setUser(user);
			setAccessToken(accessToken);
			setRefreshToken(refreshToken);

			localStorage.setItem("adminUser", JSON.stringify(user));
			localStorage.setItem("adminAccessToken", accessToken);
			localStorage.setItem("adminRefreshToken", refreshToken);

			return { success: true, user };
		} catch (error) {
			console.error("Error en login:", error);
			return {
				success: false,
				message: error.message || "Error al iniciar sesión",
			};
		}
	}, []);

	/**
	 * Cerrar sesión
	 */
	const logout = useCallback(async () => {
		try {
			if (accessToken) {
				await fetch(`${getBackendUrl()}/api/auth/logout`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				});
			}
		} catch (error) {
			console.error("Error al cerrar sesión:", error);
		} finally {
			// Limpiar estado y localStorage
			setUser(null);
			setAccessToken(null);
			setRefreshToken(null);

			localStorage.removeItem("adminUser");
			localStorage.removeItem("adminAccessToken");
			localStorage.removeItem("adminRefreshToken");
		}
	}, [accessToken]);

	/**
	 * Renovar token de acceso
	 */
	const renewToken = useCallback(async () => {
		if (!refreshToken) {
			logout();
			return null;
		}

		try {
			const response = await fetch(`${getBackendUrl()}/api/auth/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ refreshToken }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error("Error al renovar token");
			}

			const newAccessToken = data.data.accessToken;
			setAccessToken(newAccessToken);
			localStorage.setItem("adminAccessToken", newAccessToken);

			return newAccessToken;
		} catch (error) {
			console.error("Error al renovar token:", error);
			logout();
			return null;
		}
	}, [logout, refreshToken]);

	// Verificar token periódicamente (cada 10 minutos) solo si hay actividad
	useEffect(() => {
		if (!accessToken) return;

		let lastActivity = Date.now();

		// Detectar actividad del usuario
		const updateActivity = () => {
			lastActivity = Date.now();
		};

		// Escuchar eventos de actividad
		window.addEventListener("mousemove", updateActivity);
		window.addEventListener("keydown", updateActivity);
		window.addEventListener("click", updateActivity);

		const verifyToken = async () => {
			try {
				// Solo verificar si hubo actividad en los últimos 10 minutos
				const inactiveTime = Date.now() - lastActivity;
				if (inactiveTime > 10 * 60 * 1000) {
					return; // Usuario inactivo, no verificar
				}

				const response = await fetch(`${getBackendUrl()}/api/auth/verify`, {
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				});

				if (!response.ok) {
					// Token inválido, intentar renovar
					await renewToken();
				}
			} catch (error) {
				console.error("Error al verificar token:", error);
			}
		};

		const interval = setInterval(verifyToken, 10 * 60 * 1000); // 10 minutos

		return () => {
			clearInterval(interval);
			window.removeEventListener("mousemove", updateActivity);
			window.removeEventListener("keydown", updateActivity);
			window.removeEventListener("click", updateActivity);
		};
	}, [accessToken, renewToken]);

	/**
	 * Obtener token válido (renovar si es necesario)
	 */
	const getValidToken = useCallback(async () => {
		// Simplemente devolvemos el token actual para evitar un fetch innecesario a /verify
		// antes de cada petición real. Si el token expiró, la petición real devolverá 
		// un 401 y el useAuthenticatedFetch se encargará de manejarlo.
		return accessToken;
	}, [accessToken]);

	/**
	 * Cambiar contraseña
	 */
	const changePassword = async (currentPassword, newPassword) => {
		try {
			const token = await getValidToken();
			if (!token) {
				throw new Error("No autenticado");
			}

			const response = await fetch(
				`${getBackendUrl()}/api/auth/change-password`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ currentPassword, newPassword }),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Error al cambiar contraseña");
			}

			return { success: true, message: data.message };
		} catch (error) {
			console.error("Error al cambiar contraseña:", error);
			return {
				success: false,
				message: error.message || "Error al cambiar contraseña",
			};
		}
	};

	/**
	 * Verificar si el usuario tiene un rol específico
	 */
	const hasRole = useCallback((role) => {
		if (!user) return false;
		if (Array.isArray(role)) {
			return role.includes(user.rol);
		}
		return user.rol === role;
	}, [user]);

	const value = {
		user,
		loading,
		accessToken,
		isAuthenticated: !!user && !!accessToken,
		login,
		logout,
		renewToken,
		getValidToken,
		changePassword,
		hasRole,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
