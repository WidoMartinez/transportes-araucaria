import rateLimit from "express-rate-limit";

/**
 * Rate limiter para proteger el endpoint de login
 * Limita intentos de login por IP
 */
export const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 5, // Máximo 5 intentos
	message: {
		success: false,
		message:
			"Demasiados intentos de login. Por favor, intente nuevamente en 15 minutos.",
	},
	standardHeaders: true, // Retornar info en headers `RateLimit-*`
	legacyHeaders: false, // Deshabilitar headers `X-RateLimit-*`
	handler: (req, res) => {
		res.status(429).json({
			success: false,
			message:
				"Demasiados intentos de login. Por favor, intente nuevamente en 15 minutos.",
		});
	},
});

/**
 * Rate limiter general para las APIs administrativas
 * Más permisivo que el de login
 */
export const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 100, // Máximo 100 requests
	message: {
		success: false,
		message: "Demasiadas solicitudes. Por favor, intente más tarde.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

/**
 * Rate limiter estricto para operaciones sensibles
 * (crear usuarios, cambiar contraseñas, etc.)
 */
export const strictLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hora
	max: 10, // Máximo 10 operaciones
	message: {
		success: false,
		message:
			"Límite de operaciones alcanzado. Por favor, intente nuevamente en una hora.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

export default {
	loginLimiter,
	apiLimiter,
	strictLimiter,
};
