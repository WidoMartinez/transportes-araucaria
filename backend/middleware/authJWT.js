import { verifyToken } from "../utils/auth.js";
import AdminUser from "../models/AdminUser.js";

/**
 * Middleware de autenticación JWT
 * Verifica que el usuario tenga un token JWT válido
 */
export const authJWT = async (req, res, next) => {
	try {
		// Obtener token del header Authorization
		const authHeader = req.headers["authorization"];

		if (!authHeader) {
			return res.status(401).json({
				success: false,
				message: "Token de autenticación no proporcionado",
			});
		}

		// Extraer el token (formato: "Bearer TOKEN")
		const token = authHeader.startsWith("Bearer ")
			? authHeader.substring(7)
			: authHeader;

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Token de autenticación no válido",
			});
		}

		// Verificar token
		const decoded = verifyToken(token);

		if (!decoded) {
			return res.status(401).json({
				success: false,
				message: "Token expirado o inválido",
			});
		}

		// Verificar que el usuario existe y está activo
		const user = await AdminUser.findByPk(decoded.id);

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Usuario no encontrado",
			});
		}

		if (!user.activo) {
			return res.status(403).json({
				success: false,
				message: "Usuario desactivado",
			});
		}

		// Adjuntar información del usuario al request
		req.user = {
			id: user.id,
			username: user.username,
			email: user.email,
			nombre: user.nombre,
			rol: user.rol,
		};

		next();
	} catch (error) {
		console.error("Error en middleware de autenticación:", error);
		return res.status(500).json({
			success: false,
			message: "Error al verificar autenticación",
		});
	}
};

/**
 * Middleware para verificar rol de administrador
 * Debe usarse después de authJWT
 */
export const requireRole = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: "Usuario no autenticado",
			});
		}

		if (!roles.includes(req.user.rol)) {
			return res.status(403).json({
				success: false,
				message: "No tiene permisos para realizar esta acción",
			});
		}

		next();
	};
};

/**
 * Middleware de autenticación compatible con el sistema anterior (ADMIN_TOKEN)
 * Permite acceso con el token antiguo o con JWT
 */
export const authAdminCompatible = async (req, res, next) => {
	// Intentar autenticación JWT primero
	const authHeader = req.headers["authorization"];
	
	if (authHeader) {
		const token = authHeader.startsWith("Bearer ")
			? authHeader.substring(7)
			: authHeader;
		
		// Verificar si es un JWT válido
		const decoded = verifyToken(token);
		
		if (decoded) {
			// Es un JWT válido, usar authJWT
			return authJWT(req, res, next);
		}
		
		// Si no es JWT, verificar si es el token antiguo
		const adminToken = process.env.ADMIN_TOKEN;
		
		if (adminToken && authHeader === `Bearer ${adminToken}`) {
			// Token antiguo válido, permitir acceso
			req.user = {
				id: null,
				username: "admin_legacy",
				email: "",
				nombre: "Administrador Legacy",
				rol: "superadmin",
			};
			return next();
		}
	}
	
	// Sin token o token inválido
	return res.status(401).json({
		success: false,
		message: "Token de autenticación no válido o expirado",
	});
};

export default {
	authJWT,
	requireRole,
	authAdminCompatible,
};
