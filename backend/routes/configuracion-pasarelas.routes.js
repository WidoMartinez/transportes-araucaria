/* eslint-env node */
/* global process */
/**
 * Rutas para configurar las pasarelas de pago habilitadas y sus imágenes.
 * Las imágenes se suben a Cloudinary (mismo proveedor que los banners).
 * La configuración se almacena en la tabla `configuracion` con clave `config_pasarelas_pago`.
 */
import express from "express";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import Configuracion from "../models/Configuracion.js";
import { authJWT } from "../middleware/authJWT.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Cloudinary se configura con variables de entorno (nunca credenciales en código)
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Pasarelas soportadas por el sistema
const PASARELAS_SOPORTADAS = ["flow", "mercadopago"];

// Valores predeterminados para la configuración de pasarelas
const CONFIG_DEFAULT = {
	flow: {
		habilitado: true,
		nombre: "Flow",
		descripcion: "Tarjeta / Débito / Webpay",
		imagen_url: null,
	},
	mercadopago: {
		habilitado: true,
		nombre: "Mercado Pago",
		descripcion: "MP / Débito / Cuotas",
		imagen_url: null,
	},
};

/**
 * Sube un buffer de imagen a Cloudinary en la carpeta de pasarelas.
 */
const subirImagenPasarela = (buffer, mimetype, gatewayId) => {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{
				folder: "transportes-araucaria/pasarelas",
				public_id: `pasarela-${gatewayId}`,
				overwrite: true,
				resource_type: "image",
				transformation: [{ quality: "auto", fetch_format: "auto" }],
			},
			(error, result) => {
				if (error) return reject(error);
				resolve(result);
			},
		);
		stream.end(buffer);
	});
};

/**
 * Extrae el public_id de una URL de Cloudinary para poder borrarla.
 */
const extractCloudinaryPublicId = (url) => {
	if (!url || !url.includes("cloudinary.com")) return null;
	const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
	return match ? match[1] : null;
};

// Multer en memoria (evita escritura en disco efímero de Render)
const fileFilter = (req, file, cb) => {
	const allowedTypes = /jpeg|jpg|png|gif|webp/;
	const extname = allowedTypes.test(
		path.extname(file.originalname).toLowerCase(),
	);
	const mimetype = allowedTypes.test(file.mimetype);
	if (mimetype && extname) return cb(null, true);
	cb(new Error("Solo se permiten imágenes (jpg, png, gif, webp)"));
};

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
	fileFilter,
});

// Middleware para errores de multer
const handleMulterError = (err, req, res, next) => {
	if (err && err.code === "LIMIT_FILE_SIZE") {
		return res
			.status(400)
			.json({ error: "Imagen demasiado grande. Máximo 5MB." });
	}
	if (err && err.name === "MulterError") {
		return res
			.status(400)
			.json({ error: `Error al subir imagen: ${err.message}` });
	}
	next(err);
};

/**
 * GET /api/configuracion/pasarelas-pago
 * Retorna la configuración actual de las pasarelas (público).
 * Úsalo en los flujos de pago para saber qué pasarelas mostrar.
 */
router.get("/", async (req, res) => {
	try {
		const config = await Configuracion.getValorParseado(
			"config_pasarelas_pago",
			CONFIG_DEFAULT,
		);
		// Merge profundo por gateway: garantiza que todos los campos existan
		// incluso si el registro guardado tiene estructura parcial
		const configCompleta = {};
		for (const id of PASARELAS_SOPORTADAS) {
			configCompleta[id] = { ...CONFIG_DEFAULT[id], ...(config?.[id] || {}) };
		}
		res.json({ success: true, pasarelas: configCompleta });
	} catch (error) {
		console.error("Error obteniendo configuración de pasarelas:", error);
		res
			.status(500)
			.json({ error: "Error al obtener configuración de pasarelas" });
	}
});

/**
 * PUT /api/configuracion/pasarelas-pago
 * Actualiza la configuración de las pasarelas (admin).
 * Body: { flow: { habilitado, nombre, descripcion }, mercadopago: { habilitado, nombre, descripcion } }
 * Las imágenes NO se actualizan aquí; se gestionan con el endpoint de imagen.
 */
router.put("/", apiLimiter, authJWT, async (req, res) => {
	try {
		const datosNuevos = req.body;
		if (!datosNuevos || typeof datosNuevos !== "object") {
			return res.status(400).json({ error: "Body inválido" });
		}

		// Leer config actual para no perder imágenes ya almacenadas
		const configActual = await Configuracion.getValorParseado(
			"config_pasarelas_pago",
			CONFIG_DEFAULT,
		);
		// Merge profundo por gateway
		const configFinal = {};
		for (const id of PASARELAS_SOPORTADAS) {
			configFinal[id] = {
				...CONFIG_DEFAULT[id],
				...(configActual?.[id] || {}),
			};
		}

		for (const gatewayId of PASARELAS_SOPORTADAS) {
			if (datosNuevos[gatewayId]) {
				const datos = datosNuevos[gatewayId];
				configFinal[gatewayId] = {
					...configFinal[gatewayId],
					habilitado: Boolean(datos.habilitado),
					nombre: datos.nombre || configFinal[gatewayId].nombre,
					descripcion: datos.descripcion || configFinal[gatewayId].descripcion,
					// imagen_url se conserva: no se toca en este endpoint
				};
			}
		}

		await Configuracion.setValor(
			"config_pasarelas_pago",
			configFinal,
			"json",
			"Configuración de pasarelas de pago (habilitado, nombre, descripcion, imagen_url)",
		);

		res.json({ success: true, pasarelas: configFinal });
	} catch (error) {
		console.error("Error actualizando configuración de pasarelas:", error);
		res
			.status(500)
			.json({ error: "Error al actualizar configuración de pasarelas" });
	}
});

/**
 * POST /api/configuracion/pasarelas-pago/:gateway/imagen
 * Sube la imagen representativa de una pasarela a Cloudinary (admin).
 * Reemplaza automáticamente la imagen anterior de esa pasarela.
 */
router.post(
	"/:gateway/imagen",
	apiLimiter,
	authJWT,
	upload.single("imagen"),
	handleMulterError,
	async (req, res) => {
		const { gateway } = req.params;

		if (!PASARELAS_SOPORTADAS.includes(gateway)) {
			return res
				.status(400)
				.json({ error: `Pasarela no soportada: ${gateway}` });
		}
		if (!req.file) {
			return res
				.status(400)
				.json({ error: "Se requiere un archivo de imagen" });
		}

		try {
			// Leer config actual para eliminar imagen anterior si existe
			const configActual = await Configuracion.getValorParseado(
				"config_pasarelas_pago",
				CONFIG_DEFAULT,
			);
			// Merge profundo por gateway
			const configFinal = {};
			for (const id of PASARELAS_SOPORTADAS) {
				configFinal[id] = {
					...CONFIG_DEFAULT[id],
					...(configActual?.[id] || {}),
				};
			}

			// Eliminar imagen anterior de Cloudinary si existe
			const oldPublicId = extractCloudinaryPublicId(
				configFinal[gateway]?.imagen_url,
			);
			if (oldPublicId) {
				try {
					await cloudinary.uploader.destroy(oldPublicId);
					console.log(
						`🗑️ [PASARELA] Imagen anterior eliminada: ${oldPublicId}`,
					);
				} catch (e) {
					console.error(
						"Error eliminando imagen anterior de Cloudinary:",
						e.message,
					);
				}
			}

			// Subir nueva imagen a Cloudinary
			const cloudResult = await subirImagenPasarela(
				req.file.buffer,
				req.file.mimetype,
				gateway,
			);
			console.log(
				`🖼️ [PASARELA] Imagen subida a Cloudinary: ${cloudResult.public_id}`,
			);

			// Actualizar URL en la configuración
			configFinal[gateway] = {
				...configFinal[gateway],
				imagen_url: cloudResult.secure_url,
			};

			await Configuracion.setValor(
				"config_pasarelas_pago",
				configFinal,
				"json",
				"Configuración de pasarelas de pago (habilitado, nombre, descripcion, imagen_url)",
			);

			res.json({
				success: true,
				imagen_url: cloudResult.secure_url,
				pasarelas: configFinal,
			});
		} catch (error) {
			console.error(`Error subiendo imagen para pasarela ${gateway}:`, error);
			res
				.status(500)
				.json({ error: "Error al subir la imagen. Intenta nuevamente." });
		}
	},
);

/**
 * DELETE /api/configuracion/pasarelas-pago/:gateway/imagen
 * Elimina la imagen representativa de una pasarela (admin).
 */
router.delete("/:gateway/imagen", apiLimiter, authJWT, async (req, res) => {
	const { gateway } = req.params;

	if (!PASARELAS_SOPORTADAS.includes(gateway)) {
		return res.status(400).json({ error: `Pasarela no soportada: ${gateway}` });
	}

	try {
		const configActual = await Configuracion.getValorParseado(
			"config_pasarelas_pago",
			CONFIG_DEFAULT,
		);
		// Merge profundo por gateway
		const configFinal = {};
		for (const id of PASARELAS_SOPORTADAS) {
			configFinal[id] = {
				...CONFIG_DEFAULT[id],
				...(configActual?.[id] || {}),
			};
		}

		const publicId = extractCloudinaryPublicId(
			configFinal[gateway]?.imagen_url,
		);
		if (publicId) {
			await cloudinary.uploader.destroy(publicId);
			console.log(`🗑️ [PASARELA] Imagen eliminada de Cloudinary: ${publicId}`);
		}

		configFinal[gateway] = { ...configFinal[gateway], imagen_url: null };

		await Configuracion.setValor(
			"config_pasarelas_pago",
			configFinal,
			"json",
			"Configuración de pasarelas de pago",
		);

		res.json({ success: true, pasarelas: configFinal });
	} catch (error) {
		console.error(`Error eliminando imagen de pasarela ${gateway}:`, error);
		res.status(500).json({ error: "Error al eliminar la imagen" });
	}
});

export default router;
