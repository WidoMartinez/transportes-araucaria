import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Utilidades de autenticación
 */

// Constantes de configuración
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "transportes-araucaria-secret-2024";
const JWT_EXPIRES_IN = "8h"; // Token expira en 8 horas
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // Refresh token expira en 7 días
const MAX_LOGIN_ATTEMPTS = 5; // Máximo de intentos fallidos
const LOCK_TIME = 30 * 60 * 1000; // 30 minutos de bloqueo

/**
 * Hashear contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} - Hash de la contraseña
 */
export const hashPassword = async (password) => {
	try {
		const salt = await bcrypt.genSalt(SALT_ROUNDS);
		const hash = await bcrypt.hash(password, salt);
		return hash;
	} catch (error) {
		console.error("Error al hashear contraseña:", error);
		throw new Error("Error al procesar la contraseña");
	}
};

/**
 * Comparar contraseña con hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado
 * @returns {Promise<boolean>} - True si coinciden
 */
export const comparePassword = async (password, hash) => {
	try {
		return await bcrypt.compare(password, hash);
	} catch (error) {
		console.error("Error al comparar contraseña:", error);
		return false;
	}
};

/**
 * Generar token JWT
 * @param {object} payload - Datos a incluir en el token
 * @param {string} expiresIn - Tiempo de expiración
 * @returns {string} - Token JWT
 */
export const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
	try {
		return jwt.sign(payload, JWT_SECRET, { expiresIn });
	} catch (error) {
		console.error("Error al generar token:", error);
		throw new Error("Error al generar token de autenticación");
	}
};

/**
 * Generar refresh token
 * @param {object} payload - Datos a incluir en el token
 * @returns {string} - Refresh token JWT
 */
export const generateRefreshToken = (payload) => {
	return generateToken(payload, REFRESH_TOKEN_EXPIRES_IN);
};

/**
 * Verificar token JWT
 * @param {string} token - Token a verificar
 * @returns {object|null} - Payload del token o null si es inválido
 */
export const verifyToken = (token) => {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			console.log("Token expirado");
		} else if (error.name === "JsonWebTokenError") {
			console.log("Token inválido");
		}
		return null;
	}
};

/**
 * Verificar si el usuario está bloqueado
 * @param {object} user - Objeto de usuario
 * @returns {boolean} - True si está bloqueado
 */
export const isUserLocked = (user) => {
	if (!user.bloqueadoHasta) return false;
	return new Date(user.bloqueadoHasta) > new Date();
};

/**
 * Incrementar intentos fallidos de login
 * @param {object} user - Objeto de usuario
 * @returns {object} - Datos actualizados
 */
export const incrementLoginAttempts = (user) => {
	const updates = {
		intentosFallidos: user.intentosFallidos + 1,
	};

	// Si alcanza el máximo de intentos, bloquear la cuenta
	if (updates.intentosFallidos >= MAX_LOGIN_ATTEMPTS) {
		updates.bloqueadoHasta = new Date(Date.now() + LOCK_TIME);
	}

	return updates;
};

/**
 * Resetear intentos fallidos de login
 * @returns {object} - Datos a actualizar
 */
export const resetLoginAttempts = () => {
	return {
		intentosFallidos: 0,
		bloqueadoHasta: null,
	};
};

/**
 * Validar fortaleza de contraseña
 * @param {string} password - Contraseña a validar
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validatePasswordStrength = (password) => {
	const errors = [];

	if (password.length < 8) {
		errors.push("La contraseña debe tener al menos 8 caracteres");
	}

	if (!/[a-z]/.test(password)) {
		errors.push("La contraseña debe contener al menos una letra minúscula");
	}

	if (!/[A-Z]/.test(password)) {
		errors.push("La contraseña debe contener al menos una letra mayúscula");
	}

	if (!/[0-9]/.test(password)) {
		errors.push("La contraseña debe contener al menos un número");
	}

	if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
		errors.push("La contraseña debe contener al menos un carácter especial");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
};

/**
 * Sanitizar input para prevenir inyecciones
 * @param {string} input - Input a sanitizar
 * @returns {string} - Input sanitizado
 */
export const sanitizeInput = (input) => {
	if (typeof input !== "string") return input;
	return input.trim().replace(/[<>]/g, "");
};

export const authConfig = {
	SALT_ROUNDS,
	JWT_SECRET,
	JWT_EXPIRES_IN,
	REFRESH_TOKEN_EXPIRES_IN,
	MAX_LOGIN_ATTEMPTS,
	LOCK_TIME,
};
