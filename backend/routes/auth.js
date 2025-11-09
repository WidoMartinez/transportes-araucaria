import express from "express";
import { Op } from "sequelize";
import AdminUser from "../models/AdminUser.js";
import {
	hashPassword,
	comparePassword,
	generateToken,
	generateRefreshToken,
	verifyToken,
	isUserLocked,
	incrementLoginAttempts,
	resetLoginAttempts,
	validatePasswordStrength,
	sanitizeInput,
} from "../utils/auth.js";
import {
	logLogin,
	logLogout,
	logAccountLocked,
	getIpFromRequest,
	getUserAgentFromRequest,
} from "../utils/auditLog.js";
import { authJWT, requireRole } from "../middleware/authJWT.js";
import { loginLimiter, apiLimiter, strictLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post("/login", loginLimiter, async (req, res) => {
	try {
		const { username, password } = req.body;

		// Validar entrada
		if (!username || !password) {
			return res.status(400).json({
				success: false,
				message: "Usuario y contraseña son requeridos",
			});
		}

		// Sanitizar entrada
		const sanitizedUsername = sanitizeInput(username);

		// Buscar usuario
		const user = await AdminUser.findOne({
			where: { username: sanitizedUsername },
		});

		const ip = getIpFromRequest(req);
		const userAgent = getUserAgentFromRequest(req);

		if (!user) {
			// No revelar si el usuario existe o no
			await logLogin({
				adminUserId: null,
				username: sanitizedUsername,
				ip,
				userAgent,
				exitoso: false,
			});

			return res.status(401).json({
				success: false,
				message: "Credenciales inválidas",
			});
		}

		// Verificar si el usuario está bloqueado
		if (isUserLocked(user)) {
			await logAccountLocked({
				adminUserId: user.id,
				username: user.username,
				ip,
				userAgent,
			});

			return res.status(403).json({
				success: false,
				message: "Cuenta bloqueada temporalmente. Intente más tarde.",
				bloqueadoHasta: user.bloqueadoHasta,
			});
		}

		// Verificar si el usuario está activo
		if (!user.activo) {
			await logLogin({
				adminUserId: user.id,
				username: user.username,
				ip,
				userAgent,
				exitoso: false,
			});

			return res.status(403).json({
				success: false,
				message: "Usuario desactivado",
			});
		}

		// Comparar contraseña
		const isPasswordValid = await comparePassword(password, user.password);

		if (!isPasswordValid) {
			// Incrementar intentos fallidos
			const updates = incrementLoginAttempts(user);
			await user.update(updates);

			await logLogin({
				adminUserId: user.id,
				username: user.username,
				ip,
				userAgent,
				exitoso: false,
			});

			// Si alcanzó el máximo de intentos, notificar del bloqueo
			if (updates.bloqueadoHasta) {
				await logAccountLocked({
					adminUserId: user.id,
					username: user.username,
					ip,
					userAgent,
				});

				return res.status(403).json({
					success: false,
					message:
						"Demasiados intentos fallidos. Cuenta bloqueada temporalmente.",
					bloqueadoHasta: updates.bloqueadoHasta,
				});
			}

			return res.status(401).json({
				success: false,
				message: "Credenciales inválidas",
			});
		}

		// Login exitoso - resetear intentos fallidos
		await user.update({
			...resetLoginAttempts(),
			ultimoAcceso: new Date(),
		});

		// Generar tokens
		const tokenPayload = {
			id: user.id,
			username: user.username,
			rol: user.rol,
		};

		const accessToken = generateToken(tokenPayload);
		const refreshToken = generateRefreshToken(tokenPayload);

		// Guardar refresh token
		await user.update({ tokenRefresh: refreshToken });

		// Log de login exitoso
		await logLogin({
			adminUserId: user.id,
			username: user.username,
			ip,
			userAgent,
			exitoso: true,
		});

		res.json({
			success: true,
			message: "Login exitoso",
			data: {
				accessToken,
				refreshToken,
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					nombre: user.nombre,
					rol: user.rol,
				},
			},
		});
	} catch (error) {
		console.error("Error en login:", error);
		res.status(500).json({
			success: false,
			message: "Error al procesar el login",
		});
	}
});

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post("/logout", apiLimiter, authJWT, async (req, res) => {
	try {
		const user = await AdminUser.findByPk(req.user.id);

		if (user) {
			// Invalidar refresh token
			await user.update({ tokenRefresh: null });

			// Log de logout
			await logLogout({
				adminUserId: user.id,
				ip: getIpFromRequest(req),
				userAgent: getUserAgentFromRequest(req),
			});
		}

		res.json({
			success: true,
			message: "Logout exitoso",
		});
	} catch (error) {
		console.error("Error en logout:", error);
		res.status(500).json({
			success: false,
			message: "Error al procesar el logout",
		});
	}
});

/**
 * POST /api/auth/refresh
 * Renovar token de acceso usando refresh token
 */
router.post("/refresh", apiLimiter, async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(400).json({
				success: false,
				message: "Refresh token requerido",
			});
		}

		// Verificar refresh token
		const decoded = verifyToken(refreshToken);

		if (!decoded) {
			return res.status(401).json({
				success: false,
				message: "Refresh token inválido o expirado",
			});
		}

		// Buscar usuario
		const user = await AdminUser.findByPk(decoded.id);

		if (!user || user.tokenRefresh !== refreshToken) {
			return res.status(401).json({
				success: false,
				message: "Refresh token inválido",
			});
		}

		if (!user.activo) {
			return res.status(403).json({
				success: false,
				message: "Usuario desactivado",
			});
		}

		// Generar nuevo access token
		const tokenPayload = {
			id: user.id,
			username: user.username,
			rol: user.rol,
		};

		const accessToken = generateToken(tokenPayload);

		res.json({
			success: true,
			data: {
				accessToken,
			},
		});
	} catch (error) {
		console.error("Error al renovar token:", error);
		res.status(500).json({
			success: false,
			message: "Error al renovar token",
		});
	}
});

/**
 * GET /api/auth/verify
 * Verificar si el token actual es válido
 */
router.get("/verify", apiLimiter, authJWT, async (req, res) => {
	res.json({
		success: true,
		data: {
			user: req.user,
		},
	});
});

/**
 * POST /api/auth/change-password
 * Cambiar contraseña (requiere autenticación)
 */
router.post("/change-password", strictLimiter, authJWT, async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				message: "Contraseña actual y nueva contraseña son requeridas",
			});
		}

		// Validar fortaleza de la nueva contraseña
		const validation = validatePasswordStrength(newPassword);
		if (!validation.valid) {
			return res.status(400).json({
				success: false,
				message: "La contraseña no cumple con los requisitos de seguridad",
				errors: validation.errors,
			});
		}

		// Buscar usuario
		const user = await AdminUser.findByPk(req.user.id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "Usuario no encontrado",
			});
		}

		// Verificar contraseña actual
		const isPasswordValid = await comparePassword(
			currentPassword,
			user.password
		);

		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: "Contraseña actual incorrecta",
			});
		}

		// Hashear nueva contraseña
		const hashedPassword = await hashPassword(newPassword);

		// Actualizar contraseña
		await user.update({ password: hashedPassword });

		res.json({
			success: true,
			message: "Contraseña cambiada exitosamente",
		});
	} catch (error) {
		console.error("Error al cambiar contraseña:", error);
		res.status(500).json({
			success: false,
			message: "Error al cambiar contraseña",
		});
	}
});

/**
 * POST /api/auth/users
 * Crear nuevo usuario admin (solo superadmin)
 */
router.post(
	"/users",
	strictLimiter,
	authJWT,
	requireRole("superadmin"),
	async (req, res) => {
		try {
			const { username, email, password, nombre, rol } = req.body;

			// Validar entrada
			if (!username || !email || !password || !nombre) {
				return res.status(400).json({
					success: false,
					message: "Todos los campos son requeridos",
				});
			}

			// Sanitizar entrada
			const sanitizedUsername = sanitizeInput(username);
			const sanitizedEmail = sanitizeInput(email);
			const sanitizedNombre = sanitizeInput(nombre);

			// Validar fortaleza de contraseña
			const validation = validatePasswordStrength(password);
			if (!validation.valid) {
				return res.status(400).json({
					success: false,
					message: "La contraseña no cumple con los requisitos de seguridad",
					errors: validation.errors,
				});
			}

			// Verificar si el usuario ya existe
			const existingUser = await AdminUser.findOne({
				where: {
					[Op.or]: [{ username: sanitizedUsername }, { email: sanitizedEmail }],
				},
			});

			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: "El usuario o email ya existe",
				});
			}

			// Hashear contraseña
			const hashedPassword = await hashPassword(password);

			// Crear usuario
			const newUser = await AdminUser.create({
				username: sanitizedUsername,
				email: sanitizedEmail,
				password: hashedPassword,
				nombre: sanitizedNombre,
				rol: rol || "admin",
			});

			res.status(201).json({
				success: true,
				message: "Usuario creado exitosamente",
				data: {
					id: newUser.id,
					username: newUser.username,
					email: newUser.email,
					nombre: newUser.nombre,
					rol: newUser.rol,
				},
			});
		} catch (error) {
			console.error("Error al crear usuario:", error);
			res.status(500).json({
				success: false,
				message: "Error al crear usuario",
			});
		}
	}
);

/**
 * GET /api/auth/users
 * Listar usuarios admin (solo superadmin)
 */
router.get("/users", apiLimiter, authJWT, requireRole("superadmin"), async (req, res) => {
	try {
		const users = await AdminUser.findAll({
			attributes: [
				"id",
				"username",
				"email",
				"nombre",
				"rol",
				"activo",
				"ultimoAcceso",
				"createdAt",
			],
			order: [["createdAt", "DESC"]],
		});

		res.json({
			success: true,
			users,
		});
	} catch (error) {
		console.error("Error al listar usuarios:", error);
		res.status(500).json({
			success: false,
			message: "Error al listar usuarios",
		});
	}
});

/**
 * PUT /api/auth/users/:id
 * Actualizar usuario admin (solo superadmin)
 */
router.put(
	"/users/:id",
	strictLimiter,
	authJWT,
	requireRole("superadmin"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { email, password, nombre, rol, activo } = req.body;

			// Buscar usuario
			const user = await AdminUser.findByPk(id);

			if (!user) {
				return res.status(404).json({
					success: false,
					message: "Usuario no encontrado",
				});
			}

			// Preparar datos de actualización
			const updateData = {};

			if (email) {
				const sanitizedEmail = sanitizeInput(email);
				
				// Verificar si el email ya existe en otro usuario
				const existingUser = await AdminUser.findOne({
					where: {
						email: sanitizedEmail,
						id: { [Op.ne]: id },
					},
				});

				if (existingUser) {
					return res.status(400).json({
						success: false,
						message: "El email ya está en uso",
					});
				}

				updateData.email = sanitizedEmail;
			}

			if (nombre !== undefined) {
				updateData.nombre = sanitizeInput(nombre);
			}

			if (rol !== undefined) {
				if (!["admin", "superadmin"].includes(rol)) {
					return res.status(400).json({
						success: false,
						message: "Rol inválido",
					});
				}
				updateData.rol = rol;
			}

			if (activo !== undefined) {
				updateData.activo = activo;
			}

			if (password) {
				// Validar fortaleza de la nueva contraseña
				const validation = validatePasswordStrength(password);
				if (!validation.valid) {
					return res.status(400).json({
						success: false,
						message: "La contraseña no cumple con los requisitos de seguridad",
						errors: validation.errors,
					});
				}

				updateData.password = await hashPassword(password);
			}

			// Actualizar usuario
			await user.update(updateData);

			res.json({
				success: true,
				message: "Usuario actualizado exitosamente",
				data: {
					id: user.id,
					username: user.username,
					email: user.email,
					nombre: user.nombre,
					rol: user.rol,
					activo: user.activo,
				},
			});
		} catch (error) {
			console.error("Error al actualizar usuario:", error);
			res.status(500).json({
				success: false,
				message: "Error al actualizar usuario",
			});
		}
	}
);

/**
 * DELETE /api/auth/users/:id
 * Eliminar usuario admin (solo superadmin)
 */
router.delete(
	"/users/:id",
	strictLimiter,
	authJWT,
	requireRole("superadmin"),
	async (req, res) => {
		try {
			const { id } = req.params;

			// No permitir eliminar el propio usuario
			if (parseInt(id) === req.user.id) {
				return res.status(400).json({
					success: false,
					message: "No puedes eliminar tu propio usuario",
				});
			}

			// Buscar usuario
			const user = await AdminUser.findByPk(id);

			if (!user) {
				return res.status(404).json({
					success: false,
					message: "Usuario no encontrado",
				});
			}

			// Eliminar usuario
			await user.destroy();

			res.json({
				success: true,
				message: "Usuario eliminado exitosamente",
			});
		} catch (error) {
			console.error("Error al eliminar usuario:", error);
			res.status(500).json({
				success: false,
				message: "Error al eliminar usuario",
			});
		}
	}
);

export default router;
