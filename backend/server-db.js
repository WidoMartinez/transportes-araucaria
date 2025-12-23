/* eslint-env node */
/* global process */
// backend/server-db.js - Servidor con base de datos MySQL
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";
import { testConnection, syncDatabase } from "./config/database.js";
import { Op } from "sequelize";
import sequelize from "./config/database.js";
import CodigoDescuento from "./models/CodigoDescuento.js";
import Destino from "./models/Destino.js";
import Promocion from "./models/Promocion.js";
import DescuentoGlobal from "./models/DescuentoGlobal.js";
import Reserva from "./models/Reserva.js";
import Cliente from "./models/Cliente.js";
import Vehiculo from "./models/Vehiculo.js";
import Conductor from "./models/Conductor.js";
import Gasto from "./models/Gasto.js";
import Producto from "./models/Producto.js";
import ProductoReserva from "./models/ProductoReserva.js";
import ConfiguracionTarifaDinamica from "./models/ConfiguracionTarifaDinamica.js";
import ConfiguracionDisponibilidad from "./models/ConfiguracionDisponibilidad.js";
import Festivo from "./models/Festivo.js";
import PendingEmail from "./models/PendingEmail.js";
import BloqueoAgenda from "./models/BloqueoAgenda.js";
import addPaymentFields from "./migrations/add-payment-fields.js";
import addCodigosPagoTable from "./migrations/add-codigos-pago-table.js";
import addPermitirAbonoColumn from "./migrations/add-permitir-abono-column.js";
import CodigoPago from "./models/CodigoPago.js";
import addAbonoFlags from "./migrations/add-abono-flags.js";
import addTipoPagoColumn from "./migrations/add-tipo-pago-column.js";
import addGastosTable from "./migrations/add-gastos-table.js";
import addProductosTables from "./migrations/add-productos-tables.js";
import addTarifaDinamicaTable from "./migrations/add-tarifa-dinamica-table.js";
import addTarifaDinamicaFields from "./migrations/add-tarifa-dinamica-fields.js";
import addFestivosTable from "./migrations/add-festivos-table.js";
import addDisponibilidadConfig from "./migrations/add-disponibilidad-config.js";
import addPendingEmailsTable from "./migrations/add-pending-emails-table.js";
import addBloqueosAgendaTable from "./migrations/add-bloqueos-agenda-table.js";
import addGastosCerradosField from "./migrations/add-gastos-cerrados-field.js";
import addArchivadaColumn from "./migrations/add-archivada-column.js";

import addAddressColumns from "./migrations/add-address-columns.js";
import setupAssociations from "./models/associations.js";
import authRoutes from "./routes/auth.js";
import { authJWT } from "./middleware/authJWT.js";
import AdminUser from "./models/AdminUser.js";
import AdminAuditLog from "./models/AdminAuditLog.js";
import bcrypt from "bcryptjs";
import { verificarBloqueoAgenda, obtenerBloqueosEnRango } from "./utils/bloqueoAgenda.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

// Configurar asociaciones entre modelos para habilitar includes en consultas
setupAssociations();

// Importar procesador de correos
import { processPendingEmails } from "./cron/emailProcessor.js";

// Iniciar procesador de correos (cada 60 segundos)
setInterval(processPendingEmails, 60000);
console.log("🕒 Procesador de correos pendientes iniciado (intervalo: 60s)");

// --- FUNCIÓN PARA FIRMAR PARÁMETROS DE FLOW ---
const signParams = (params) => {
	const secretKey = process.env.FLOW_SECRET_KEY;
	const sortedKeys = Object.keys(params).sort();
	let toSign = "";
	sortedKeys.forEach((key) => {
		toSign += key + params[key];
	});
	return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
};

const app = express();

// Configurar trust proxy para que Express confíe en los proxies (Render.com, nginx, etc.)
// Esto es necesario para que express-rate-limit y otras librerías puedan leer correctamente
// los headers X-Forwarded-For, X-Forwarded-Proto, etc.
app.set("trust proxy", 1);

// Configurar CORS para permitir todos los métodos (incluyendo PATCH)
app.use(cors({
	origin: true, // Permite cualquier origen (o especifica URLs específicas)
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	credentials: true,
	allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware de autenticación para rutas administrativas
// Usar sistema de autenticación JWT moderno
const authAdmin = authJWT;

app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const generatePromotionId = () =>
	`promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Función para validar RUT chileno con dígito verificador (Módulo 11)
const validarRUT = (rut) => {
	if (!rut) return false;

	// Eliminar puntos, guiones y espacios
	const rutLimpio = rut.toString().replace(/[.\-\s]/g, "");

	if (rutLimpio.length < 2) return false;

	// Separar cuerpo y dígito verificador
	const cuerpo = rutLimpio.slice(0, -1);
	const dv = rutLimpio.slice(-1).toUpperCase();

	// Validar que el cuerpo sea numérico
	if (!/^\d+$/.test(cuerpo)) return false;

	// Calcular dígito verificador esperado
	let suma = 0;
	let multiplicador = 2;

	for (let i = cuerpo.length - 1; i >= 0; i--) {
		suma += parseInt(cuerpo.charAt(i)) * multiplicador;
		multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
	}

	const dvEsperado = 11 - (suma % 11);
	const dvCalculado =
		dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

	return dv === dvCalculado;
};

// Función para formatear RUT chileno
const formatearRUT = (rut) => {
	if (!rut) return null;

	// Eliminar puntos, guiones y espacios
	const rutLimpio = rut.toString().replace(/[.\-\s]/g, "");

	if (rutLimpio.length < 2) return null;

	// Separar dígito verificador
	const cuerpo = rutLimpio.slice(0, -1);
	const dv = rutLimpio.slice(-1).toUpperCase();

	// Formatear sin puntos: XXXXXXXX-X
	return `${cuerpo}-${dv}`;
};

const parsePromotionMetadata = (record) => {
	if (!record || typeof record.descripcion !== "string") {
		return null;
	}
	try {
		const parsed = JSON.parse(record.descripcion);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? parsed
			: null;
	} catch (error) {
		console.error("Error parsePromotionMetadata:", error);
		return null;
	}
};

const toNumber = (value, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

// Funciones de validación robustas para campos numéricos
const parsePositiveInteger = (value, fieldName, defaultValue = 1) => {
	const parsed = parseInt(value, 10);
	if (isNaN(parsed)) {
		console.warn(
			`⚠️ Valor inválido para ${fieldName}: "${value}", usando ${defaultValue}`
		);
		return defaultValue;
	}
	if (parsed < 1) {
		console.warn(
			`⚠️ Valor menor a 1 para ${fieldName}: ${parsed}, usando ${defaultValue}`
		);
		return defaultValue;
	}
	return parsed;
};

const parsePositiveDecimal = (value, fieldName, defaultValue = 0) => {
	const parsed = parseFloat(value);
	if (isNaN(parsed)) {
		console.warn(
			`⚠️ Valor inválido para ${fieldName}: "${value}", usando ${defaultValue}`
		);
		return defaultValue;
	}
	if (parsed < 0) {
		const fallback = Math.max(0, defaultValue);
		console.warn(
			`⚠️ Valor negativo para ${fieldName}: ${parsed}, usando ${fallback}`
		);
		return fallback;
	}
	return parsed;
};

const parseJsonArray = (raw) => {
	if (!raw) return [];
	let value = raw;
	const seen = new Set();

	while (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed.length === 0) {
			return [];
		}
		if (seen.has(trimmed)) {
			break;
		}
		seen.add(trimmed);
		try {
			value = JSON.parse(trimmed);
		} catch (error) {
			console.error("Error parseJsonArray:", error);
			return [];
		}
	}

	return Array.isArray(value) ? value : [];
};

// Normalizar horas aceptando 'HH:MM' o 'HH:MM:SS' y devolviendo 'HH:MM:SS' o null
const normalizeTimeGlobal = (hora) => {
	if (!hora && hora !== 0) return null;
	const str = String(hora).trim();
	if (str.length === 0) return null;
	const parts = str.split(":").map((p) => p.padStart(2, "0"));
	if (parts.length === 2) {
		return `${parts[0].slice(-2)}:${parts[1].slice(-2)}:00`;
	}
	if (parts.length >= 3) {
		return `${parts[0].slice(-2)}:${parts[1].slice(-2)}:${parts[2].slice(-2)}`;
	}
	return null;
};

// Determinar la clasificación del cliente según reservas completadas
const obtenerClasificacionCliente = (reservasCompletadas) => {
	if (!reservasCompletadas || reservasCompletadas <= 0) {
		return null;
	}
	if (reservasCompletadas >= 10) {
		return "Cliente Élite";
	}
	if (reservasCompletadas >= 5) {
		return "Cliente Premium";
	}
	if (reservasCompletadas >= 3) {
		return "Cliente Frecuente";
	}
	// Para 1-2 reservas completadas ya se muestra la etiqueta general "Cliente".
	// No devolver una clasificación adicional para evitar duplicidad con "Cliente Activo".
	return null;
};

// Actualizar métricas y clasificación del cliente después de modificar una reserva
const actualizarResumenCliente = async (clienteId, transaction) => {
	if (!clienteId) {
		return null;
	}

	const reservasCliente = await Reserva.findAll({
		where: { clienteId },
		order: [["created_at", "DESC"]],
		transaction,
	});

	if (!reservasCliente || reservasCliente.length === 0) {
		return null;
	}

	const totalReservasCliente = reservasCliente.length;
	const reservasCompletadas = reservasCliente.filter(
		(reserva) => reserva.estado === "completada"
	).length;
	const reservasPagadas = reservasCliente.filter(
		(reserva) => reserva.estadoPago === "pagado"
	).length;
	const totalGastado = reservasCliente
		.filter((reserva) => reserva.estadoPago === "pagado")
		.reduce(
			(suma, reserva) => suma + parseFloat(reserva.totalConDescuento || 0),
			0
		);

	const clasificacion = obtenerClasificacionCliente(reservasCompletadas);

	const cliente = await Cliente.findByPk(clienteId, { transaction });
	if (!cliente) {
		return null;
	}

	await cliente.update(
		{
			esCliente:
				reservasPagadas > 0 || reservasCompletadas > 0 || cliente.esCliente,
			totalReservas: totalReservasCliente,
			totalPagos: reservasPagadas,
			totalGastado,
			clasificacion,
			ultimaReserva: reservasCliente[0]?.fecha || cliente.ultimaReserva,
			primeraReserva:
				reservasCliente[totalReservasCliente - 1]?.fecha ||
				cliente.primeraReserva,
		},
		{ transaction }
	);

	return cliente;
};

// Función auxiliar para obtener o crear un cliente asociado a la reserva express
const obtenerClienteParaReservaExpress = async ({
	clienteId,
	rutFormateado,
	emailNormalizado,
	nombre,
	telefono,
}) => {
	let cliente = null;

	if (clienteId) {
		cliente = await Cliente.findByPk(clienteId);
	}

	if (!cliente && rutFormateado) {
		cliente = await Cliente.findOne({ where: { rut: rutFormateado } });
	}

	if (!cliente && emailNormalizado) {
		cliente = await Cliente.findOne({ where: { email: emailNormalizado } });
	}

	if (cliente) {
		const cambios = {};

		if (rutFormateado && cliente.rut !== rutFormateado) {
			cambios.rut = rutFormateado;
		}

		if (emailNormalizado && cliente.email !== emailNormalizado) {
			cambios.email = emailNormalizado;
		}

		if (telefono && cliente.telefono !== telefono) {
			cambios.telefono = telefono;
		}

		if (nombre && cliente.nombre !== nombre) {
			cambios.nombre = nombre;
		}

		if (Object.keys(cambios).length > 0) {
			await cliente.update(cambios);
		}
	} else if (emailNormalizado) {
		cliente = await Cliente.create({
			rut: rutFormateado,
			nombre: nombre || "Sin nombre",
			email: emailNormalizado,
			telefono: telefono || "",
			esCliente: false,
			totalReservas: 0,
			totalPagos: 0,
			totalGastado: 0,
		});
	}

	return cliente;
};

// Función para generar código único de reserva
const generarCodigoReserva = async () => {
	try {
		// Obtener fecha actual
		const fecha = new Date();
		const año = fecha.getFullYear();
		const mes = String(fecha.getMonth() + 1).padStart(2, "0");
		const dia = String(fecha.getDate()).padStart(2, "0");
		const fechaStr = `${año}${mes}${dia}`;

		// Calcular inicio y fin del día actual
		const inicioDelDia = new Date(fecha);
		inicioDelDia.setHours(0, 0, 0, 0);

		const finDelDia = new Date(fecha);
		finDelDia.setHours(23, 59, 59, 999);

		// Contar reservas creadas hoy
		const reservasDelDia = await Reserva.count({
			where: {
				createdAt: {
					[Op.gte]: inicioDelDia,
					[Op.lte]: finDelDia,
				},
			},
		});

		// Generar consecutivo (siguiente número del día)
		const consecutivo = String(reservasDelDia + 1).padStart(4, "0");

		// Formato: AR-YYYYMMDD-XXXX
		const codigoReserva = `AR-${fechaStr}-${consecutivo}`;

		console.log(`📋 Código de reserva generado: ${codigoReserva}`);

		return codigoReserva;
	} catch (error) {
		console.error("Error generando código de reserva:", error);
		// Generar código de respaldo con timestamp si falla la consulta
		const timestamp = Date.now();
		return `AR-${timestamp}`;
	}
};

const normalizeDestinosAplicables = (raw) => {
	const parsed = parseJsonArray(raw);
	return parsed
		.map((item) => {
			if (typeof item === "string") return item;
			if (item && typeof item === "object") {
				return item.value || item.nombre || item.label || "";
			}
			return "";
		})
		.filter(Boolean);
};

const normalizeUsuariosQueUsaron = (raw) => {
	const parsed = parseJsonArray(raw);
	return parsed
		.map((item) => (typeof item === "string" ? item : ""))
		.filter(Boolean);
};

// --- Configuración CORS ---
// Nota: ampliamos headers permitidos y respondemos a preflight para evitar bloqueos desde el dominio público
const corsOptions = {
	origin: function (origin, callback) {
	const allowedOrigins = [
		"https://www.transportesaraucaria.cl",
		"https://transportesaraucaria.cl",
		"https://www.transportes-araucaria.cl",
		"https://transportes-araucaria.cl",
		"https://www.flow.cl", // Permitir peticiones desde Flow durante retorno de pago
		"http://localhost:3000",
		"http://localhost:5173",
		"http://127.0.0.1:5173",
	];
		
		// Permitir peticiones sin origin (como Postman, curl, o server-to-server)
		if (!origin) return callback(null, true);
		
		if (allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			console.warn(`⚠️ CORS: Origen no permitido: ${origin}`);
			callback(null, false);
		}
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"Accept",
		"Origin",
	],
	optionsSuccessStatus: 200,
	maxAge: 86400, // Cache preflight por 24 horas
};

app.use(cors(corsOptions));

// Middleware de logging de peticiones CORS
app.use((req, res, next) => {
	if (req.method === 'OPTIONS') {
		console.log(`🔍 CORS Preflight: ${req.method} ${req.path} desde ${req.headers.origin || 'sin origin'}`);
	}
	next();
});

// Responder explícitamente a las solicitudes de preflight con headers manuales
app.options("*", (req, res) => {
	const origin = req.headers.origin || "*";
	console.log(`✅ CORS Preflight respondido para: ${origin}`);
	res.header("Access-Control-Allow-Origin", origin);
	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
	res.header("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Max-Age", "86400");
	res.sendStatus(200);
});

// --- RUTAS DE AUTENTICACIÓN ---
app.use("/api/auth", authRoutes);

// --- INICIALIZACIÓN DE BASE DE DATOS ---
// Función para ejecutar migración automática del código de reserva
const ejecutarMigracionCodigoReserva = async () => {
	try {
		console.log("🔄 Verificando migración de codigo_reserva...");

		// Verificar si la columna ya existe
		const [columns] = await sequelize.query(`
			SHOW COLUMNS FROM reservas LIKE 'codigo_reserva';
		`);

		if (columns.length === 0) {
			console.log("📋 Agregando columna codigo_reserva...");

			// Agregar la columna
			await sequelize.query(`
				ALTER TABLE reservas 
				ADD COLUMN codigo_reserva VARCHAR(50) NULL UNIQUE
				COMMENT 'Código único de reserva (formato: AR-YYYYMMDD-XXXX)';
			`);

			// Crear índice único
			await sequelize.query(`
				CREATE UNIQUE INDEX idx_codigo_reserva 
				ON reservas(codigo_reserva);
			`);

			console.log("✅ Columna codigo_reserva agregada exitosamente");
		} else {
			console.log("✅ Columna codigo_reserva ya existe");
		}

		// Generar códigos para reservas sin código
		const [reservasSinCodigo] = await sequelize.query(`
			SELECT id, created_at 
			FROM reservas 
			WHERE codigo_reserva IS NULL 
			ORDER BY created_at ASC;
		`);

		if (reservasSinCodigo.length > 0) {
			console.log(
				`📋 Generando códigos para ${reservasSinCodigo.length} reservas existentes...`
			);

			const reservasPorFecha = {};

			for (const reserva of reservasSinCodigo) {
				const fecha = new Date(reserva.created_at);
				const año = fecha.getFullYear();
				const mes = String(fecha.getMonth() + 1).padStart(2, "0");
				const dia = String(fecha.getDate()).padStart(2, "0");
				const fechaStr = `${año}${mes}${dia}`;

				if (!reservasPorFecha[fechaStr]) {
					reservasPorFecha[fechaStr] = 0;
				}

				reservasPorFecha[fechaStr]++;
				const consecutivo = String(reservasPorFecha[fechaStr]).padStart(4, "0");
				const codigoReserva = `AR-${fechaStr}-${consecutivo}`;

				await sequelize.query(
					`
					UPDATE reservas 
					SET codigo_reserva = :codigoReserva 
					WHERE id = :id;
				`,
					{
						replacements: { codigoReserva, id: reserva.id },
					}
				);
			}

			console.log(
				`✅ Códigos generados para ${reservasSinCodigo.length} reservas`
			);
		}

		console.log("✅ Migración de codigo_reserva completada");
	} catch (error) {
		// Si hay error pero no es crítico, solo advertir
		console.warn(
			"⚠️ Advertencia en migración de codigo_reserva:",
			error.message
		);
	}
};

const initializeDatabase = async () => {
	try {
		const connected = await testConnection();
		if (!connected) {
			throw new Error("No se pudo conectar a la base de datos");
		}
		// Sincronizar solo los modelos principales en orden para evitar ALTER TABLE masivos
		await addPendingEmailsTable();
		await syncDatabase(false, [
			AdminUser, // Primero los usuarios admin
			AdminAuditLog, // Logs de auditoría de admin
			Destino,
			Cliente,
			Vehiculo,
			Conductor,
			Reserva,
			CodigoDescuento,
			CodigoPago,
			Promocion,
			DescuentoGlobal,
			PendingEmail,
		]); // false = no forzar recreación

		// Crear o actualizar usuario admin por defecto
		try {
			let adminUser = await AdminUser.findOne({
				where: { username: 'admin' }
			});

			const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
			const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'contacto@transportesaraucaria.cl';

			if (!adminUser) {
				console.log('👤 Creando usuario administrador por defecto...');
				
				const hashedPassword = await bcrypt.hash(defaultPassword, 10);

				adminUser = await AdminUser.create({
					username: 'admin',
					email: defaultEmail,
					password: hashedPassword,
					nombre: 'Administrador Principal',
					rol: 'superadmin',
					activo: true
				});

				console.log('✅ Usuario administrador creado exitosamente');
				console.log('📝 Credenciales por defecto:');
				console.log('   Usuario: admin');
				console.log(`   Contraseña: ${defaultPassword}`);
				console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
			} else {
				console.log('✅ Usuario administrador ya existe');
				console.log(`📧 Email actual: ${adminUser.email}`);
				console.log(`👤 Nombre: ${adminUser.nombre}`);
				console.log(`🔑 Rol: ${adminUser.rol}`);
				
				// Actualizar contraseña si es diferente del hash esperado
				const hashedPassword = await bcrypt.hash(defaultPassword, 10);
				const passwordMatch = await bcrypt.compare(defaultPassword, adminUser.password);
				
				if (!passwordMatch) {
					console.log('🔄 Actualizando contraseña a valor por defecto...');
					adminUser.password = hashedPassword;
					adminUser.email = defaultEmail; // También actualizar email
					await adminUser.save();
					console.log('✅ Credenciales actualizadas:');
					console.log('   Usuario: admin');
					console.log(`   Contraseña: ${defaultPassword}`);
					console.log(`   Email: ${defaultEmail}`);
				}
			}
		} catch (adminError) {
			console.error('⚠️ Error al crear usuario admin:', adminError.message);
		}

		// Ejecutar migraciones automáticas
		await ejecutarMigracionCodigoReserva();
		await addPaymentFields();
		await addTipoPagoColumn();
		await addAbonoFlags();
		await addCodigosPagoTable();
		await addGastosTable();
		await addProductosTables(); // Migración para tablas de productos
		await addTarifaDinamicaTable(); // Migración para tabla de tarifa dinámica
		await addTarifaDinamicaFields(); // Migración para campos de tarifa dinámica en reservas
		await addFestivosTable(); // Migración para tabla de festivos
		await addDisponibilidadConfig(); // Migración para configuración de disponibilidad y descuentos por retorno
		await addAddressColumns(); // Migración para columnas de dirección
		await addBloqueosAgendaTable(); // Migración para tabla de bloqueos de agenda
		await addGastosCerradosField(); // Migración para campo gastos_cerrados

		// Asegurar índice UNIQUE en codigos_descuento.codigo sin exceder límite de índices
		try {
			const [idxRows] = await sequelize.query(
				"SHOW INDEX FROM codigos_descuento WHERE Column_name = 'codigo'"
			);
			const hasUnique = Array.isArray(idxRows)
				? idxRows.some((r) => String(r.Non_unique) === "0")
				: false;

			if (!hasUnique) {
				// Contar índices actuales de la tabla para evitar ER_TOO_MANY_KEYS (max 64)
				const [countRows] = await sequelize.query(
					"SHOW INDEX FROM codigos_descuento"
				);
				const indexNames = new Set(
					(Array.isArray(countRows) ? countRows : []).map((r) => r.Key_name)
				);
				if (indexNames.size >= 64) {
					console.warn(
						"La tabla codigos_descuento ya tiene 64 índices. No se puede crear índice único para codigo. Se continuará sin UNIQUE."
					);
				} else {
					await sequelize.query(
						"CREATE UNIQUE INDEX idx_codigos_descuento_codigo ON codigos_descuento(codigo)"
					);
					console.log("✅ Índice único idx_codigos_descuento_codigo creado");
				}
			}
		} catch (idxErr) {
			console.warn(
				"⚠️ No se pudo asegurar índice único en codigos_descuento.codigo:",
				idxErr.message
			);
		}

		// Asegurar tabla de historial de asignaciones (para uso interno)
		await sequelize.query(`
				CREATE TABLE IF NOT EXISTS reserva_asignaciones (
					id INT AUTO_INCREMENT PRIMARY KEY,
					reserva_id INT NOT NULL,
					vehiculo VARCHAR(100) NULL,
					conductor VARCHAR(255) NULL,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					INDEX idx_reserva_asignaciones_reserva_id (reserva_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
			`);

		console.log("✅ Base de datos inicializada correctamente");
	} catch (error) {
		console.error("❌ Error inicializando base de datos:", error);
		process.exit(1);
	}
};

// --- ENDPOINTS PARA CONFIGURACION DE PRECIOS ---
const PRICING_CACHE_TTL_MS = Number(process.env.PRICING_CACHE_TTL_MS || 60000);
let pricingCache = { payload: null, expiresAt: 0 };

const setPricingCache = (payload) => {
	pricingCache = {
		payload,
		expiresAt: Date.now() + PRICING_CACHE_TTL_MS,
	};
};

const invalidatePricingCache = () => {
	pricingCache = { payload: null, expiresAt: 0 };
};

const buildPromotionKey = (sourceId, day) => `${sourceId}::${day}`;

const extractPromotionKeyFromRecord = (promo) => {
	const metadata = parsePromotionMetadata(promo);
	const sourceId = metadata?.sourceId || promo.sourceId || `promo-${promo.id}`;
	const dayTag =
		metadata?.diaIndividual ||
		(Array.isArray(metadata?.dias) && metadata.dias[0]) ||
		promo.dia ||
		(Array.isArray(promo.dias) && promo.dias[0]) ||
		"lunes";
	return buildPromotionKey(sourceId, dayTag);
};

const buildPromotionEntries = (promocion) => {
	const metadata = parsePromotionMetadata(promocion);
	const porcentaje = toNumber(
		metadata?.porcentaje ??
			promocion.porcentaje ??
			promocion.descuentoPorcentaje ??
			promocion.valor ??
			0,
		0
	);
	const aplicaPorDias =
		metadata?.aplicaPorDias ?? Boolean(promocion.aplicaPorDias);
	const diasMetadata = Array.isArray(metadata?.dias)
		? metadata.dias.filter(Boolean)
		: [];
	const diasDesdePromo = Array.isArray(promocion.dias)
		? promocion.dias.filter(Boolean)
		: [];
	const diaBase =
		metadata?.diaIndividual ||
		promocion.dia ||
		diasDesdePromo[0] ||
		diasMetadata[0] ||
		"lunes";
	const diasParaIterar = aplicaPorDias
		? diasMetadata.length > 0
			? diasMetadata
			: diasDesdePromo.length > 0
			? diasDesdePromo
			: [diaBase]
		: [diaBase];
	const destino = metadata?.destino || promocion.destino || "";
	const nombre =
		metadata?.nombre ||
		promocion.nombre ||
		metadata?.descripcion ||
		promocion.descripcion ||
		"Promocion";
	const descripcion = metadata?.descripcion || promocion.descripcion || "";
	const aplicaPorHorario =
		metadata?.aplicaPorHorario ?? Boolean(promocion.aplicaPorHorario);
	const horaInicio = metadata?.horaInicio ?? promocion.horaInicio ?? "";
	const horaFin = metadata?.horaFin ?? promocion.horaFin ?? "";
	const tipoViaje =
		metadata?.aplicaTipoViaje || promocion.aplicaTipoViaje || {};
	const tipoViajeNormalizado = {
		ida: Boolean(tipoViaje.ida),
		vuelta: Boolean(tipoViaje.vuelta),
		ambos: Boolean(tipoViaje.ambos),
	};
	const activo = metadata?.activo ?? promocion.activo ?? true;
	const sourceId = metadata?.sourceId || promocion.id || generatePromotionId();

	return diasParaIterar.map((dia) => {
		const payload = {
			sourceId,
			nombre,
			destino,
			descripcion,
			dias: aplicaPorDias ? diasParaIterar : [],
			aplicaPorDias,
			aplicaPorHorario,
			horaInicio,
			horaFin,
			porcentaje,
			aplicaTipoViaje: tipoViajeNormalizado,
			activo,
			diaIndividual: dia,
		};

		return {
			key: buildPromotionKey(sourceId, dia),
			record: {
				nombre,
				dia,
				tipo: "porcentaje",
				valor: porcentaje,
				activo,
				descripcion: JSON.stringify(payload),
			},
		};
	});
};

const buildPricingPayload = async () => {
	const [destinos, dayPromotions, descuentosGlobales, codigosDescuento] =
		await Promise.all([
			Destino.findAll({
				order: [
					["orden", "ASC"],
					["nombre", "ASC"],
				],
			}),
			Promocion.findAll({
				order: [["dia", "ASC"]],
			}),
			DescuentoGlobal.findAll(),
			CodigoDescuento.findAll({
				order: [["fechaCreacion", "DESC"]],
			}),
		]);

	const dayPromotionsFormatted = dayPromotions.map((promo) => {
		const metadata = parsePromotionMetadata(promo);
		const baseId = metadata?.sourceId || `promo-${promo.id}`;
		const porcentajeBase = metadata?.porcentaje;
		const porcentaje =
			porcentajeBase !== undefined
				? toNumber(porcentajeBase, 0)
				: promo.tipo === "porcentaje"
				? toNumber(promo.valor, 0)
				: 0;
		const aplicaPorDias =
			metadata?.aplicaPorDias !== undefined
				? Boolean(metadata.aplicaPorDias)
				: true;
		const diasMetadata = Array.isArray(metadata?.dias)
			? metadata.dias.filter(Boolean)
			: [];
		const diasDesdePromo = Array.isArray(promo.dias)
			? promo.dias.filter(Boolean)
			: [];
		const defaultDay =
			metadata?.diaIndividual ||
			promo.dia ||
			diasDesdePromo[0] ||
			diasMetadata[0] ||
			"lunes";
		const dias = aplicaPorDias
			? diasMetadata.length > 0
				? diasMetadata
				: diasDesdePromo.length > 0
				? diasDesdePromo
				: [defaultDay]
			: [];
		const tipoViaje = metadata?.aplicaTipoViaje || {};
		return {
			id: baseId,
			nombre: metadata?.nombre || promo.nombre || "",
			destino: metadata?.destino || "",
			descripcion:
				metadata?.descripcion !== undefined
					? metadata.descripcion
					: promo.descripcion || "",
			dias,
			aplicaPorDias,
			aplicaPorHorario:
				metadata?.aplicaPorHorario !== undefined
					? Boolean(metadata.aplicaPorHorario)
					: false,
			horaInicio: metadata?.horaInicio || "",
			horaFin: metadata?.horaFin || "",
			descuentoPorcentaje: porcentaje,
			aplicaTipoViaje: {
				ida: tipoViaje.ida !== undefined ? Boolean(tipoViaje.ida) : true,
				vuelta:
					tipoViaje.vuelta !== undefined ? Boolean(tipoViaje.vuelta) : true,
				ambos: tipoViaje.ambos !== undefined ? Boolean(tipoViaje.ambos) : true,
			},
			activo:
				metadata?.activo !== undefined
					? Boolean(metadata.activo)
					: promo.activo !== undefined
					? Boolean(promo.activo)
					: true,
		};
	});

	const descuentosFormatted = {
		descuentoOnline: {
			valor: 5,
			activo: true,
			nombre: "Descuento por Reserva Online",
		},
		descuentoRoundTrip: {
			valor: 10,
			activo: true,
			nombre: "Descuento por Ida y Vuelta",
		},
		descuentosPersonalizados: [],
	};

	descuentosGlobales.forEach((descuento) => {
		if (descuento.tipo === "descuentoOnline") {
			descuentosFormatted.descuentoOnline = {
				valor: descuento.valor,
				activo: descuento.activo,
				nombre: descuento.nombre,
			};
		} else if (descuento.tipo === "descuentoRoundTrip") {
			descuentosFormatted.descuentoRoundTrip = {
				valor: descuento.valor,
				activo: descuento.activo,
				nombre: descuento.nombre,
			};
		} else if (descuento.tipo === "descuentoPersonalizado") {
			descuentosFormatted.descuentosPersonalizados.push({
				nombre: descuento.nombre,
				valor: descuento.valor,
				activo: descuento.activo,
				descripcion: descuento.descripcion,
			});
		}
	});

	const codigosFormateados = codigosDescuento.map((codigo) => {
		const codigoJson = codigo.toJSON();
		return {
			...codigoJson,
			destinosAplicables: normalizeDestinosAplicables(
				codigoJson.destinosAplicables ?? codigo.destinosAplicables
			),
			usuariosQueUsaron: normalizeUsuariosQueUsaron(
				codigoJson.usuariosQueUsaron ?? codigo.usuariosQueUsaron
			),
		};
	});

	const destinosFormateados = destinos.map((destino) => ({
		...destino.toJSON(),
		precios: {
			auto: {
				base: destino.precioIda,
				porcentajeAdicional: 0.1,
			},
			van: {
				base: destino.precioIda * 1.8,
				porcentajeAdicional: 0.1,
			},
		},
		descripcion: destino.descripcion || "",
		tiempo: destino.tiempo || "45 min",
		imagen: destino.imagen || "",
		maxPasajeros: destino.maxPasajeros || 4,
		minHorasAnticipacion: destino.minHorasAnticipacion || 5,
	}));

	return {
		destinos: destinosFormateados,
		dayPromotions: dayPromotionsFormatted,
		descuentosGlobales: descuentosFormatted,
		codigosDescuento: codigosFormateados,
		updatedAt: new Date().toISOString(),
	};
};

app.get("/pricing", async (req, res) => {
	try {
		const now = Date.now();
		if (pricingCache.payload && pricingCache.expiresAt > now) {
			return res.json(pricingCache.payload);
		}

		const payload = await buildPricingPayload();
		setPricingCache(payload);
		res.json(payload);
	} catch (error) {
		console.error("Error al obtener la configuracion de precios:", error);
		res.status(500).json({
			message: "No se pudo obtener la configuracion de precios.",
		});
	}
});

app.put("/pricing", async (req, res) => {
	console.log("PUT /pricing recibido");
	console.log("Body recibido:", JSON.stringify(req.body, null, 2));

	const { destinos, dayPromotions, descuentosGlobales } = req.body || {};

	if (!Array.isArray(destinos) || !Array.isArray(dayPromotions)) {
		return res.status(400).json({
			message:
				"La estructura de datos enviada es incorrecta. Se esperaba un objeto con 'destinos' y 'dayPromotions'.",
		});
	}

	try {
		invalidatePricingCache();

		await Promise.all(
			(destinos || []).map((destino) => {
				const precioBase =
					destino.precios?.auto?.base || destino.precioIda || 0;
				const precioVuelta =
					destino.precios?.auto?.base || destino.precioVuelta || 0;
				const precioIdaVuelta =
					destino.precios?.auto?.base || destino.precioIdaVuelta || 0;
				const duracionIdaValor = Number(destino.duracionIdaMinutos);
				const duracionVueltaValor = Number(destino.duracionVueltaMinutos);
				const duracionIda =
					Number.isFinite(duracionIdaValor) && duracionIdaValor > 0
						? duracionIdaValor
						: 60;
				const duracionVuelta =
					Number.isFinite(duracionVueltaValor) && duracionVueltaValor > 0
						? duracionVueltaValor
						: 60;

				return Destino.upsert({
					nombre: destino.nombre,
					precioIda: precioBase,
					precioVuelta,
					precioIdaVuelta,
					activo: destino.activo !== false,
					orden: destino.orden || 0,
					descripcion: destino.descripcion || "",
					tiempo: destino.tiempo || "45 min",
					imagen: destino.imagen || "",
					maxPasajeros: destino.maxPasajeros || 4,
					minHorasAnticipacion: destino.minHorasAnticipacion || 5,
					duracionIdaMinutos: duracionIda,
					duracionVueltaMinutos: duracionVuelta,
				});
			})
		);

		const existingPromotions = await Promocion.findAll();
		const existingPromotionMap = new Map(
			existingPromotions.map((promo) => [
				extractPromotionKeyFromRecord(promo),
				promo,
			])
		);
		const seenPromotionKeys = new Set();

		for (const promocion of dayPromotions) {
			for (const entry of buildPromotionEntries(promocion)) {
				seenPromotionKeys.add(entry.key);
				const existing = existingPromotionMap.get(entry.key);
				if (existing) {
					await existing.update(entry.record);
				} else {
					await Promocion.create(entry.record);
				}
			}
		}

		const idsToDelete = [];
		for (const [key, promo] of existingPromotionMap.entries()) {
			if (!seenPromotionKeys.has(key)) {
				idsToDelete.push(promo.id);
			}
		}

		if (idsToDelete.length > 0) {
			await Promocion.destroy({ where: { id: idsToDelete } });
		}

		if (descuentosGlobales) {
			const globalUpdates = [];

			if (descuentosGlobales.descuentoOnline) {
				globalUpdates.push(
					DescuentoGlobal.upsert({
						tipo: "descuentoOnline",
						nombre: descuentosGlobales.descuentoOnline.nombre,
						valor: descuentosGlobales.descuentoOnline.valor,
						activo: descuentosGlobales.descuentoOnline.activo,
						descripcion: "Descuento por reserva online",
					})
				);
			}

			if (descuentosGlobales.descuentoRoundTrip) {
				globalUpdates.push(
					DescuentoGlobal.upsert({
						tipo: "descuentoRoundTrip",
						nombre: descuentosGlobales.descuentoRoundTrip.nombre,
						valor: descuentosGlobales.descuentoRoundTrip.valor,
						activo: descuentosGlobales.descuentoRoundTrip.activo,
						descripcion: "Descuento por ida y vuelta",
					})
				);
			}

			await Promise.all(globalUpdates);

			if (Array.isArray(descuentosGlobales.descuentosPersonalizados)) {
				await DescuentoGlobal.destroy({
					where: { tipo: "descuentoPersonalizado" },
				});

				if (descuentosGlobales.descuentosPersonalizados.length > 0) {
					await DescuentoGlobal.bulkCreate(
						descuentosGlobales.descuentosPersonalizados.map((descuento) => ({
							tipo: "descuentoPersonalizado",
							nombre: descuento.nombre,
							valor: descuento.valor,
							activo: descuento.activo,
							descripcion: descuento.descripcion || "",
						}))
					);
				}
			}
		}

		const payload = await buildPricingPayload();
		setPricingCache(payload);
		res.json(payload);
	} catch (error) {
		console.error("Error al guardar la configuracion de precios:", error);
		res.status(500).json({
			message: "No se pudo guardar la configuracion de precios.",
		});
	}
});

// --- ENDPOINTS PARA CODIGOS DE DESCUENTO ---
app.get("/api/codigos", async (req, res) => {
	try {
		const codigos = await CodigoDescuento.findAll({
			order: [["fechaCreacion", "DESC"]],
		});

		// Asegurar que usuariosQueUsaron sea siempre un array
		const codigosFormateados = codigos.map((codigo) => {
			const codigoJson = codigo.toJSON();
			return {
				...codigoJson,
				destinosAplicables: normalizeDestinosAplicables(
					codigoJson.destinosAplicables ?? codigo.destinosAplicables
				),
				usuariosQueUsaron: normalizeUsuariosQueUsaron(
					codigoJson.usuariosQueUsaron ?? codigo.usuariosQueUsaron
				),
			};
		});

		res.json(codigosFormateados);
	} catch (error) {
		console.error("Error obteniendo códigos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.post("/api/codigos", async (req, res) => {
	try {
		const nuevoCodigo = {
			...req.body,
			destinosAplicables: normalizeDestinosAplicables(
				req.body.destinosAplicables
			),
			id: req.body.codigo,
			usosActuales: 0,
			fechaCreacion: new Date().toISOString().split("T")[0],
			creadoPor: "admin",
		};

		const codigoCreado = await CodigoDescuento.create(nuevoCodigo);
		res.json(codigoCreado);
	} catch (error) {
		console.error("Error creando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.put("/api/codigos/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const payload = { ...req.body };

		if (Object.prototype.hasOwnProperty.call(req.body, "destinosAplicables")) {
			payload.destinosAplicables = normalizeDestinosAplicables(
				req.body.destinosAplicables
			);
		}

		const [updatedRows] = await CodigoDescuento.update(payload, {
			where: { id },
		});

		if (updatedRows === 0) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		const codigoActualizado = await CodigoDescuento.findByPk(id);
		res.json(codigoActualizado);
	} catch (error) {
		console.error("Error actualizando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.delete("/api/codigos/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const deletedRows = await CodigoDescuento.destroy({
			where: { id },
		});

		if (deletedRows === 0) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		res.json({ message: "Código eliminado correctamente" });
	} catch (error) {
		console.error("Error eliminando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para validar código de descuento
app.post("/api/codigos/validar", async (req, res) => {
	try {
		const { codigo, destino, monto, email, telefono } = req.body;

		// Crear identificador único del usuario basado en email + teléfono
		const usuarioId =
			email && telefono
				? crypto
						.createHash("sha256")
						.update(`${email}-${telefono}`)
						.digest("hex")
				: null;

		const codigoEncontrado = await CodigoDescuento.findOne({
			where: { codigo, activo: true },
		});

		if (!codigoEncontrado) {
			return res.json({ valido: false, error: "Código no válido o agotado" });
		}

		// Verificar límite de usos
		if (codigoEncontrado.usosActuales >= codigoEncontrado.limiteUsos) {
			return res.json({ valido: false, error: "Código agotado" });
		}

		// Verificar fecha de vencimiento
		const ahora = new Date();
		const vencimiento = new Date(codigoEncontrado.fechaVencimiento);
		if (vencimiento < ahora) {
			return res.json({ valido: false, error: "Código vencido" });
		}

		// Verificar si el usuario ya usó este código
		if (usuarioId) {
			const usuariosQueUsaron = normalizeUsuariosQueUsaron(
				codigoEncontrado.usuariosQueUsaron || []
			);
			const usuarioYaUso = usuariosQueUsaron.includes(usuarioId);
			if (usuarioYaUso) {
				return res.json({
					valido: false,
					error: "Ya has usado este código de descuento anteriormente",
				});
			}
		}

		const destinosAplicables = normalizeDestinosAplicables(
			codigoEncontrado.destinosAplicables
		);

		// Verificar destino aplicable
		if (
			destinosAplicables.length > 0 &&
			!destinosAplicables.includes(destino)
		) {
			return res.json({
				valido: false,
				error: "Código no aplicable para este destino",
			});
		}

		// Verificar monto mínimo
		if (monto < codigoEncontrado.montoMinimo) {
			return res.json({
				valido: false,
				error: `Monto mínimo requerido: $${codigoEncontrado.montoMinimo.toLocaleString()}`,
			});
		}

		const codigoPlano = codigoEncontrado.toJSON();
		codigoPlano.destinosAplicables = destinosAplicables;
		codigoPlano.usuariosQueUsaron = normalizeUsuariosQueUsaron(
			codigoPlano.usuariosQueUsaron ?? codigoEncontrado.usuariosQueUsaron
		);

		res.json({ valido: true, codigo: codigoPlano });
	} catch (error) {
		console.error("Error validando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para registrar el uso de un código por un usuario
app.post("/api/codigos/usar", async (req, res) => {
	try {
		const { codigo, email, telefono } = req.body;

		// Crear identificador único del usuario basado en email + teléfono
		const usuarioId =
			email && telefono
				? crypto
						.createHash("sha256")
						.update(`${email}-${telefono}`)
						.digest("hex")
				: null;

		const codigoEncontrado = await CodigoDescuento.findOne({
			where: { codigo },
		});

		if (!codigoEncontrado) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		// Verificar si el usuario ya usó este código
		if (usuarioId) {
			const usuariosQueUsaron = normalizeUsuariosQueUsaron(
				codigoEncontrado.usuariosQueUsaron || []
			);
			const usuarioYaUso = usuariosQueUsaron.includes(usuarioId);
			if (usuarioYaUso) {
				return res.json({
					exito: false,
					error: "Ya has usado este código de descuento anteriormente",
				});
			}
		}

		// Actualizar usos - asegurar que no se duplique el usuario
		const usuariosActuales = normalizeUsuariosQueUsaron(
			codigoEncontrado.usuariosQueUsaron || []
		);
		const nuevosUsuarios = usuarioId
			? [...usuariosActuales, usuarioId]
			: usuariosActuales;

		await CodigoDescuento.update(
			{
				usosActuales: codigoEncontrado.usosActuales + 1,
				usuariosQueUsaron: nuevosUsuarios,
			},
			{
				where: { codigo },
			}
		);

		res.json({
			exito: true,
			usosActuales: codigoEncontrado.usosActuales + 1,
			usuariosQueUsaron: nuevosUsuarios,
		});
	} catch (error) {
		console.error("Error registrando uso del código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para eliminar un usuario específico de un código
app.delete("/api/codigos/:codigo/usuarios/:usuarioId", async (req, res) => {
	try {
		const { codigo, usuarioId } = req.params;
		const codigoEncontrado = await CodigoDescuento.findOne({
			where: { codigo },
		});

		if (!codigoEncontrado) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		const usuariosActualizados = (
			codigoEncontrado.usuariosQueUsaron || []
		).filter((id) => id !== usuarioId);

		await CodigoDescuento.update(
			{
				usuariosQueUsaron: usuariosActualizados,
			},
			{
				where: { codigo },
			}
		);

		res.json({
			exito: true,
			usuariosQueUsaron: usuariosActualizados,
		});
	} catch (error) {
		console.error("Error eliminando usuario del código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// --- ENDPOINTS MEJORADOS PARA PANEL DE ADMINISTRACIÓN ---

// Endpoint para obtener usuarios de un código específico con detalles
app.get("/api/codigos/:id/usuarios", async (req, res) => {
	try {
		const { id } = req.params;
		const codigo = await CodigoDescuento.findByPk(id);

		if (!codigo) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		const usuariosQueUsaron = normalizeUsuariosQueUsaron(
			codigo.usuariosQueUsaron || []
		);

		// Obtener detalles de las reservas de estos usuarios
		const reservas = await Reserva.findAll({
			where: {
				codigoDescuento: codigo.codigo,
			},
			attributes: [
				"id",
				"nombre",
				"email",
				"telefono",
				"created_at",
				"totalConDescuento",
				"estado",
				"estadoPago",
			],
			order: [["created_at", "DESC"]],
		});

		// Combinar datos de usuarios con reservas
		const usuariosConDetalles = usuariosQueUsaron.map((usuarioId) => {
			const reserva = reservas.find((r) => {
				const hashUsuario = crypto
					.createHash("sha256")
					.update(`${r.email}-${r.telefono}`)
					.digest("hex");
				return hashUsuario === usuarioId;
			});

			return {
				usuarioId,
				nombre: reserva?.nombre || "Usuario no encontrado",
				email: reserva?.email || "Email no disponible",
				telefono: reserva?.telefono || "Teléfono no disponible",
				fechaUso: reserva?.created_at || null,
				monto: reserva?.totalConDescuento || 0,
				estado: reserva?.estado || "No disponible",
				estadoPago: reserva?.estadoPago || "No disponible",
			};
		});

		res.json({
			codigo: {
				id: codigo.id,
				codigo: codigo.codigo,
				descripcion: codigo.descripcion,
				usosActuales: codigo.usosActuales,
				limiteUsos: codigo.limiteUsos,
				activo: codigo.activo,
			},
			usuarios: usuariosConDetalles,
			totalUsuarios: usuariosConDetalles.length,
		});
	} catch (error) {
		console.error("Error obteniendo usuarios del código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para resetear un código (eliminar todos los usuarios y resetear contador)
app.post("/api/codigos/:id/reset", async (req, res) => {
	try {
		const { id } = req.params;
		const { confirmar } = req.body;

		if (!confirmar) {
			return res.status(400).json({
				error: "Debe confirmar la acción de reset",
			});
		}

		const codigo = await CodigoDescuento.findByPk(id);
		if (!codigo) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		await CodigoDescuento.update(
			{
				usosActuales: 0,
				usuariosQueUsaron: [],
			},
			{
				where: { id },
			}
		);

		res.json({
			exito: true,
			message: "Código reseteado exitosamente",
			codigo: {
				id: codigo.id,
				codigo: codigo.codigo,
				usosActuales: 0,
				usuariosQueUsaron: [],
			},
		});
	} catch (error) {
		console.error("Error reseteando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para probar la conexión a la base de datos
app.get("/api/test-db", async (req, res) => {
	try {
		await sequelize.authenticate();
		res.json({
			status: "ok",
			message: "Conexión a la base de datos exitosa",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error de conexión a la base de datos:", error);
		res.status(500).json({
			error: "Error de conexión a la base de datos",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint para verificar tablas existentes
app.get("/api/test-tables", async (req, res) => {
	try {
		await sequelize.authenticate();

		// Verificar si la tabla codigos_descuento existe
		const [results] = await sequelize.query(
			"SHOW TABLES LIKE 'codigos_descuento'"
		);
		const tableExists = results.length > 0;

		// Si la tabla no existe, intentar crearla
		if (!tableExists) {
			console.log("Tabla codigos_descuento no existe, sincronizando...");
			await sequelize.sync({ force: false });
		}

		// Contar registros en la tabla
		let codigosCount = 0;
		if (tableExists) {
			codigosCount = await CodigoDescuento.count();
		}

		res.json({
			status: "ok",
			message: "Verificación de tablas completada",
			tableExists,
			codigosCount,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error verificando tablas:", error);
		res.status(500).json({
			error: "Error verificando tablas",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint para forzar la sincronización de todas las tablas
app.get("/api/sync-all", async (req, res) => {
	try {
		// Verificar conexión primero
		await sequelize.authenticate();

		// Importar todos los modelos
		const CodigoDescuento = (await import("./models/CodigoDescuento.js"))
			.default;
		const Reserva = (await import("./models/Reserva.js")).default;
		const Destino = (await import("./models/Destino.js")).default;
		const Promocion = (await import("./models/Promocion.js")).default;
		const DescuentoGlobal = (await import("./models/DescuentoGlobal.js"))
			.default;

		// Sincronizar tablas una por una para evitar conflictos
		// NOTA: Removido alter:true para evitar modificar estructura en producción
		console.log("Sincronizando tabla codigos_descuento...");
		await CodigoDescuento.sync({ force: false });

		console.log("Sincronizando tabla reservas...");
		await Reserva.sync({ force: false });

		console.log("Sincronizando tabla destinos...");
		await Destino.sync({ force: false });

		console.log("Sincronizando tabla promociones...");
		await Promocion.sync({ force: false });

		console.log("Sincronizando tabla descuentos_globales...");
		await DescuentoGlobal.sync({ force: false });

		// Verificar estructura de las tablas principales
		const [codigosResults] = await sequelize.query(
			"DESCRIBE codigos_descuento"
		);
		const [reservasResults] = await sequelize.query("DESCRIBE reservas");

		res.json({
			status: "ok",
			message: "Todas las tablas sincronizadas correctamente",
			tables: {
				codigos_descuento: codigosResults.map((row) => row.Field),
				reservas: reservasResults.map((row) => row.Field),
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error sincronizando tablas:", error);
		res.status(500).json({
			error: "Error sincronizando tablas",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint para forzar la sincronización de la tabla
app.get("/api/codigos/sync", async (req, res) => {
	try {
		// Verificar conexión primero
		await sequelize.authenticate();

		// Sincronizar sin alterar estructura (usar migraciones para cambios de esquema)
		await sequelize.sync({ force: false });

		// Verificar que las columnas existen
		const [results] = await sequelize.query("DESCRIBE codigos_descuento");
		const columns = results.map((row) => row.Field);

		res.json({
			status: "ok",
			message: "Tabla sincronizada correctamente",
			columns,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error sincronizando tabla:", error);
		res.status(500).json({
			error: "Error sincronizando tabla",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint simple para probar el modelo CodigoDescuento
app.get("/api/codigos/test", async (req, res) => {
	try {
		// Verificar conexión primero
		await sequelize.authenticate();

		// Intentar sincronizar la tabla si no existe
		await sequelize.sync({ force: false });

		// Contar códigos (esto debería funcionar si la tabla existe)
		const totalCodigos = await CodigoDescuento.count();

		res.json({
			status: "ok",
			totalCodigos,
			message: "Modelo CodigoDescuento funcionando correctamente",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error probando modelo CodigoDescuento:", error);
		res.status(500).json({
			error: "Error probando modelo",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint para obtener estadísticas de códigos
app.get("/api/codigos/estadisticas", async (req, res) => {
	try {
		// Verificar conexión primero
		await sequelize.authenticate();

		// Sincronizar sin alterar estructura (usar migraciones para cambios de esquema)
		await sequelize.sync({ force: false });

		const totalCodigos = await CodigoDescuento.count();
		const codigosActivos = await CodigoDescuento.count({
			where: { activo: true },
		});

		// Verificar si las columnas necesarias existen antes de usarlas
		let codigosAgotados = 0;
		let codigosMasUsados = [];
		let totalUsos = 0;

		try {
			// Verificar si las columnas existen
			const [results] = await sequelize.query("DESCRIBE codigos_descuento");
			const columns = results.map((row) => row.Field);
			const hasUsosActuales = columns.includes("usosActuales");
			const hasLimiteUsos = columns.includes("limiteUsos");

			if (hasUsosActuales && hasLimiteUsos) {
				codigosAgotados = await CodigoDescuento.count({
					where: {
						activo: true,
						[Op.and]: [
							sequelize.where(
								sequelize.col("usosActuales"),
								Op.gte,
								sequelize.col("limiteUsos")
							),
						],
					},
				});

				// Códigos más usados
				codigosMasUsados = await CodigoDescuento.findAll({
					where: { activo: true },
					order: [["usosActuales", "DESC"]],
					limit: 5,
					attributes: ["codigo", "descripcion", "usosActuales", "limiteUsos"],
				});

				// Total de usos en el sistema
				totalUsos = await CodigoDescuento.sum("usosActuales");
			}
		} catch (columnError) {
			console.warn(
				"Columnas de uso no disponibles, usando valores por defecto:",
				columnError.message
			);
		}

		res.json({
			totalCodigos,
			codigosActivos,
			codigosAgotados,
			codigosMasUsados,
			totalUsos,
		});
	} catch (error) {
		console.error("Error obteniendo estadísticas:", error);
		res.status(500).json({
			error: "Error interno del servidor",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint para buscar códigos con filtros avanzados
app.get("/api/codigos/buscar", async (req, res) => {
	try {
		const {
			activo,
			agotado,
			vencido,
			buscar,
			ordenar = "fechaCreacion",
			direccion = "DESC",
			limite = 20,
			pagina = 1,
		} = req.query;

		const offset = (pagina - 1) * limite;
		const whereClause = {};

		// Filtros
		if (activo !== undefined) {
			whereClause.activo = activo === "true";
		}

		if (agotado === "true") {
			whereClause[Op.and] = [
				sequelize.where(
					sequelize.col("usosActuales"),
					Op.gte,
					sequelize.col("limiteUsos")
				),
			];
		}

		if (vencido === "true") {
			whereClause.fechaVencimiento = {
				[Op.lt]: new Date(),
			};
		}

		if (buscar) {
			whereClause[Op.or] = [
				{ codigo: { [Op.like]: `%${buscar}%` } },
				{ descripcion: { [Op.like]: `%${buscar}%` } },
			];
		}

		const { count, rows: codigos } = await CodigoDescuento.findAndCountAll({
			where: whereClause,
			order: [[ordenar, direccion]],
			limit: parseInt(limite),
			offset: parseInt(offset),
		});

		res.json({
			codigos,
			paginacion: {
				total: count,
				pagina: parseInt(pagina),
				limite: parseInt(limite),
				totalPaginas: Math.ceil(count / limite),
			},
		});
	} catch (error) {
		console.error("Error buscando códigos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para obtener historial de usos de códigos
app.get("/api/codigos/historial", async (req, res) => {
	try {
		const {
			codigo,
			fechaDesde,
			fechaHasta,
			estado,
			ordenar = "created_at",
			direccion = "DESC",
		} = req.query;

		const whereClause = {};

		// Filtros
		if (codigo) {
			whereClause.codigoDescuento = { [Op.like]: `%${codigo}%` };
		}

		if (fechaDesde || fechaHasta) {
			whereClause.created_at = {};
			if (fechaDesde) whereClause.created_at[Op.gte] = fechaDesde;
			if (fechaHasta) whereClause.created_at[Op.lte] = fechaHasta;
		}

		if (estado) {
			whereClause.estado = estado;
		}

		// Obtener reservas con códigos de descuento
		const reservas = await Reserva.findAll({
			where: {
				...whereClause,
				codigoDescuento: { [Op.ne]: null, [Op.ne]: "" },
			},
			attributes: [
				"id",
				"nombre",
				"email",
				"telefono",
				"created_at",
				"totalConDescuento",
				"estado",
				"estadoPago",
				"codigoDescuento",
			],
			order: [[ordenar, direccion]],
		});

		// Formatear datos para el historial
		const historial = reservas.map((reserva) => ({
			codigo: reserva.codigoDescuento,
			nombre: reserva.nombre,
			email: reserva.email,
			telefono: reserva.telefono,
			fechaUso: reserva.created_at,
			monto: reserva.totalConDescuento,
			estado: reserva.estado,
			estadoPago: reserva.estadoPago,
		}));

		// Estadísticas
		const totalUsos = historial.length;
		const usuariosUnicos = new Set(
			historial.map((h) => `${h.email}-${h.telefono}`)
		).size;
		const totalDescuentos = historial.reduce(
			(sum, h) => sum + (h.monto || 0),
			0
		);

		// Usos de hoy
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);
		const usosHoy = historial.filter((h) => new Date(h.fechaUso) >= hoy).length;

		const estadisticas = {
			totalUsos,
			usuariosUnicos,
			totalDescuentos,
			usosHoy,
		};

		res.json({
			historial,
			estadisticas,
		});
	} catch (error) {
		console.error("Error obteniendo historial:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para recibir reservas desde el formulario web
app.post("/enviar-reserva", async (req, res) => {
	try {
		const datosReserva = req.body || {};
		const enviarCorreo = datosReserva.enviarCorreo !== false;
		const limpiarTextoPlano = (valor) => {
			if (valor === undefined || valor === null) return "";
			return String(valor).trim();
		};
		const detallesDirecciones = [];
		const direccionDestinoCliente = limpiarTextoPlano(
			datosReserva.direccionDestino
		);
		if (direccionDestinoCliente) {
			detallesDirecciones.push(
				`Direccion destino: ${direccionDestinoCliente}`
			);
		}
		const direccionOrigenCliente = limpiarTextoPlano(
			datosReserva.direccionOrigen
		);
		if (direccionOrigenCliente) {
			detallesDirecciones.push(`Direccion origen: ${direccionOrigenCliente}`);
		}
		const mensajeBaseCliente = limpiarTextoPlano(datosReserva.mensaje);
		const mensajeDirecciones =
			detallesDirecciones.length > 0
				? `Direcciones confirmadas:\n${detallesDirecciones.join("\n")}`
				: "";
		const mensajeDetallado = [mensajeBaseCliente, mensajeDirecciones]
			.filter((segmento) => segmento.length > 0)
			.join("\n\n");
		const mensajeParaGuardar =
			mensajeDetallado.length > 0 ? mensajeDetallado : undefined;
		const numeroVueloCliente = limpiarTextoPlano(datosReserva.numeroVuelo);
		const hotelCliente = limpiarTextoPlano(datosReserva.hotel);
		const equipajeEspecialCliente = limpiarTextoPlano(
			datosReserva.equipajeEspecial
		);
		const sillaInfantilCliente =
			datosReserva.sillaInfantil !== undefined
				? Boolean(datosReserva.sillaInfantil)
				: undefined;

		// Se usa normalizeTimeGlobal definida en scope superior

		// Formatear RUT si se proporciona
		const rutFormateado = datosReserva.rut
			? formatearRUT(datosReserva.rut)
			: null;

		// Generar código único de reserva
		const codigoReserva = await generarCodigoReserva();

		console.log("Reserva web recibida:", {
			nombre: datosReserva.nombre,
			email: datosReserva.email,
			telefono: datosReserva.telefono,
			clienteId: datosReserva.clienteId,
			rut: rutFormateado,
			codigoReserva: codigoReserva,
			origen: datosReserva.origen,
			destino: datosReserva.destino,
			fecha: datosReserva.fecha,
			hora: datosReserva.hora,
			pasajeros: datosReserva.pasajeros,
			totalConDescuento: datosReserva.totalConDescuento,
			estado: datosReserva.estado,
			estadoPago: datosReserva.estadoPago,
			source: datosReserva.source || "web",
		});

		// Verificar si la fecha/hora está bloqueada
		const bloqueoResultado = await verificarBloqueoAgenda(
			datosReserva.fecha,
			datosReserva.hora
		);

		if (bloqueoResultado.bloqueado) {
			console.log("RESERVA BLOQUEADA:", {
				fecha: datosReserva.fecha,
				hora: datosReserva.hora,
				motivo: bloqueoResultado.motivo,
			});
			return res.status(400).json({
				success: false,
				message: "Agenda completada",
				error: bloqueoResultado.motivo,
				bloqueado: true,
			});
		}

		const normalizeEstado = (valor) =>
			typeof valor === "string" ? valor.trim().toLowerCase() : "";

		const estadosReservaValidos = new Set([
			"pendiente",
			"pendiente_detalles",
			"confirmada",
			"cancelada",
			"completada",
		]);

		const estadosPagoValidos = new Set([
			"pendiente",
			"aprobado",
			"parcial",
			"pagado",
			"fallido",
			"reembolsado",
		]);

		const precioCalculado = parsePositiveDecimal(
			datosReserva.precio,
			"precio",
			0
		);

		const totalCalculado = parsePositiveDecimal(
			datosReserva.totalConDescuento,
			"totalConDescuento",
			precioCalculado
		);

		const abonoCalculado = parsePositiveDecimal(
			datosReserva.abonoSugerido,
			"abonoSugerido",
			0
		);

		// No confiar en saldoPendiente enviado por el cliente cuando no hay
		// evidencia de pago (pagoMonto o estadoPago 'pagado'). Si no hay
		// evidencia, forzamos saldo = totalCalculado (es decir, pago 0).
		const hasSaldoProvided = Object.prototype.hasOwnProperty.call(
			datosReserva,
			"saldoPendiente"
		);

		let saldoEntrada;
		const pagoMontoProvided =
			datosReserva.pagoMonto !== undefined &&
			datosReserva.pagoMonto !== null &&
			datosReserva.pagoMonto !== "" &&
			parsePositiveDecimal(datosReserva.pagoMonto, "pagoMonto", 0) > 0;

		if (
			hasSaldoProvided &&
			(pagoMontoProvided || estadoPagoSolicitado === "pagado")
		) {
			saldoEntrada = parsePositiveDecimal(
				datosReserva.saldoPendiente,
				"saldoPendiente",
				Math.max(totalCalculado - abonoCalculado, 0)
			);
		} else {
			// No se asume ningún pago: saldo = total
			saldoEntrada = totalCalculado;
		}

		const estadoSolicitado = normalizeEstado(datosReserva.estado);
		const estadoPagoSolicitado = normalizeEstado(datosReserva.estadoPago);

		let estadoInicial = estadosReservaValidos.has(estadoSolicitado)
			? estadoSolicitado
			: "pendiente";
		let estadoPagoInicial = estadosPagoValidos.has(estadoPagoSolicitado)
			? estadoPagoSolicitado
			: "pendiente";

		let saldoCalculado = saldoEntrada;
		if (estadoPagoInicial === "pagado" || estadoPagoInicial === "reembolsado") {
			saldoCalculado = 0;
		} else if (estadoPagoInicial === "fallido") {
			saldoCalculado = totalCalculado;
		}
		if (saldoCalculado < 0) saldoCalculado = 0;

		if (estadoPagoInicial === "pagado" && estadoInicial === "pendiente") {
			estadoInicial = "confirmada";
		} else if (
			estadoPagoInicial === "reembolsado" &&
			estadoInicial === "pendiente"
		) {
			estadoInicial = "cancelada";
		}

		// Determinar monto pagado reportado: solo usar pago explícito o cuando
		// el estado enviado indique 'pagado'. No inferir pago a partir del
		// saldo pendiente calculado por defecto, ya que `abonoSugerido` y
		// `saldoPendiente` son valores informativos en el frontend y no
		// significan que se haya realizado un pago real.
		let montoPagadoCalculado = 0;
		if (pagoMontoProvided) {
			montoPagadoCalculado = parsePositiveDecimal(
				datosReserva.pagoMonto,
				"pagoMonto",
				0
			);
		} else if (estadoPagoInicial === "pagado") {
			// Si el cliente/servicio explícitamente indicó 'pagado', asumir pago total
			montoPagadoCalculado = totalCalculado;
		} else {
			montoPagadoCalculado = 0; // No se asume pago alguno
		}
		const umbralAbono = Math.max(totalCalculado * 0.4, abonoCalculado || 0);

		// Log temporal para depuración: mostrar los valores que se usarán para guardar
		console.log("[DEBUG] /enviar-reserva - cálculos financieros:", {
			totalCalculado,
			abonoCalculado,
			saldoEntrada,
			montoPagadoCalculado,
			umbralAbono,
			estadoPagoInicial,
		});

		let abonoPagado = false;
		let saldoPagado = false;

		if (estadoPagoInicial === "pagado") {
			abonoPagado = true;
			if (totalCalculado > 0) {
				saldoPagado = true;
			}
		} else if (estadoPagoInicial === "reembolsado") {
			abonoPagado = false;
			saldoPagado = false;
		} else if (montoPagadoCalculado >= umbralAbono && totalCalculado > 0) {
			abonoPagado = true;
		}

		if (
			estadoPagoInicial === "pagado" &&
			totalCalculado > 0 &&
			saldoCalculado <= 0
		) {
			saldoPagado = true;
		}

		// Guardar reserva en la base de datos con validaciones robustas
		const reservaGuardada = await Reserva.create({
			codigoReserva: codigoReserva,
			nombre: datosReserva.nombre || "No especificado",
			email: datosReserva.email || "",
			telefono: datosReserva.telefono || "",
			clienteId: datosReserva.clienteId || null,
			rut: rutFormateado,
			origen: datosReserva.origen || "",
			destino: datosReserva.destino || "",
			fecha: datosReserva.fecha || new Date(),
			hora: datosReserva.hora || "00:00:00",
			pasajeros: parsePositiveInteger(datosReserva.pasajeros, "pasajeros", 1),
			precio: precioCalculado,
			vehiculo: datosReserva.vehiculo || "",
			numeroVuelo: datosReserva.numeroVuelo || "",
			hotel: datosReserva.hotel || "",
			equipajeEspecial: datosReserva.equipajeEspecial || "",
			sillaInfantil: Boolean(
				datosReserva.sillaInfantil === "si" ||
					datosReserva.sillaInfantil === true
			),
			idaVuelta: Boolean(datosReserva.idaVuelta),
			fechaRegreso: datosReserva.fechaRegreso || null,
			horaRegreso: datosReserva.horaRegreso || null,
			abonoSugerido: abonoCalculado,
			saldoPendiente: saldoCalculado,
			descuentoBase: parsePositiveDecimal(
				datosReserva.descuentoBase,
				"descuentoBase",
				0
			),
			descuentoPromocion: parsePositiveDecimal(
				datosReserva.descuentoPromocion,
				"descuentoPromocion",
				0
			),
			descuentoRoundTrip: parsePositiveDecimal(
				datosReserva.descuentoRoundTrip,
				"descuentoRoundTrip",
				0
			),
			descuentoOnline: parsePositiveDecimal(
				datosReserva.descuentoOnline,
				"descuentoOnline",
				0
			),
			totalConDescuento: totalCalculado,
			mensaje: datosReserva.mensaje || "",
			source: datosReserva.source || "web",
			estado: estadoInicial,
			ipAddress: req.ip || req.connection.remoteAddress || "",
			userAgent: req.get("User-Agent") || "",
			codigoDescuento: datosReserva.codigoDescuento || "",
			estadoPago: estadoPagoInicial,
			metodoPago: datosReserva.metodoPago || "",
			referenciaPago: datosReserva.referenciaPago || "",
			pagoGateway: datosReserva.metodoPago || null,
			pagoMonto: montoPagadoCalculado > 0 ? montoPagadoCalculado : null,
			pagoFecha: montoPagadoCalculado > 0 ? new Date() : null,
			abonoPagado,
			saldoPagado,
		});

		console.log(
			"✅ Reserva guardada en base de datos con ID:",
			reservaGuardada.id,
			"Código:",
			reservaGuardada.codigoReserva
		);

		// Enviar email de confirmación llamando al PHP en Hostinger si corresponde
		// El tipo de correo enviado al cliente dependerá del estado de pago
		if (enviarCorreo) {
			try {
				const phpUrl =
					process.env.PHP_EMAIL_URL ||
					"https://www.transportesaraucaria.cl/enviar_correo_completo.php";

				const emailData = {
					...datosReserva,
					codigoReserva: reservaGuardada.codigoReserva,
					rut: rutFormateado,
					// Incluir estado de pago para determinar tipo de correo al cliente
					estadoPago: reservaGuardada.estadoPago || estadoPagoInicial,
				};

				console.log("📧 Enviando email de confirmación al PHP...");

				const emailResponse = await axios.post(phpUrl, emailData, {
					headers: { "Content-Type": "application/json" },
					timeout: 30000, // 30 segundos timeout
				});

				if (emailResponse.data.success) {
					console.log("✅ Email enviado correctamente");
				} else {
					console.warn(
						"⚠️ Email no se pudo enviar:",
						emailResponse.data.message
					);
				}
			} catch (emailError) {
				console.error("❌ Error enviando email:", emailError.message);
				// No fallar la respuesta si el email falla
			}
		} else {
			console.log("ℹ️ Email de confirmación omitido (enviarCorreo = false)");
		}

		// --- LÓGICA DE CORREO DIFERIDO (DESCUENTO) ---
		// Si la reserva está pendiente de pago, programar correo de descuento
		if (
			estadoPagoInicial === "pendiente" &&
			datosReserva.source !== "codigo_pago" // No enviar descuento si paga con código (se asume proceso diferente)
		) {
			try {
				// Calcular fecha de envío (30 minutos después)
				const scheduledAt = new Date(Date.now() + 30 * 60 * 1000);
				
				await PendingEmail.create({
					reservaId: reservaGuardada.id,
					email: reservaGuardada.email,
					type: "discount_offer",
					status: "pending",
					scheduledAt: scheduledAt
				});
				
				console.log(`⏳ Correo de descuento programado para reserva ${reservaGuardada.codigoReserva} a las ${scheduledAt.toISOString()}`);
				
				// Enviar notificación SOLO al administrador inmediatamente
				// Usamos action='notify_admin_only' para que el PHP sepa qué hacer
				try {
					const phpUrl = process.env.PHP_EMAIL_URL || "https://www.transportesaraucaria.cl/enviar_correo_mejorado.php";
					await axios.post(phpUrl, {
						...datosReserva,
						codigoReserva: reservaGuardada.codigoReserva,
						rut: rutFormateado,
						estadoPago: "pendiente",
						action: "notify_admin_only" // NUEVO PARÁMETRO
					}, {
						headers: { "Content-Type": "application/json" },
						timeout: 10000
					});
					console.log("✅ Notificación al admin enviada correctamente");
				} catch (adminEmailError) {
					console.error("❌ Error enviando notificación al admin:", adminEmailError.message);
				}

			} catch (scheduleError) {
				console.error("❌ Error programando correo de descuento:", scheduleError);
			}
		}

		return res.json({
			success: true,
			message: "Reserva recibida y guardada correctamente",
			reservaId: reservaGuardada.id,
			codigoReserva: reservaGuardada.codigoReserva,
		});
	} catch (error) {
		console.error("Error al procesar la reserva:", error);
		return res.status(500).json({
			success: false,
			message: "Error interno del servidor",
		});
	}
});

// Endpoint para recibir reservas express (flujo simplificado)
app.post("/enviar-reserva-express", async (req, res) => {
	try {
		const datosReserva = req.body || {};
		const enviarCorreo = datosReserva.enviarCorreo !== false;
		const limpiarTextoPlano = (valor) => {
			if (valor === undefined || valor === null) return "";
			return String(valor).trim();
		};
		const detallesDirecciones = [];
		const direccionDestinoCliente = limpiarTextoPlano(
			datosReserva.direccionDestino
		);
		if (direccionDestinoCliente) {
			detallesDirecciones.push(
				`Dirección destino: ${direccionDestinoCliente}`
			);
		}
		const direccionOrigenCliente = limpiarTextoPlano(
			datosReserva.direccionOrigen
		);
		if (direccionOrigenCliente) {
			detallesDirecciones.push(`Dirección origen: ${direccionOrigenCliente}`);
		}
		const mensajeBaseCliente = limpiarTextoPlano(datosReserva.mensaje);
		const mensajeDirecciones =
			detallesDirecciones.length > 0
				? `Direcciones confirmadas:\n${detallesDirecciones.join("\n")}`
				: "";
		const mensajeDetallado = [mensajeBaseCliente, mensajeDirecciones]
			.filter((segmento) => segmento.length > 0)
			.join("\n\n");
		const mensajeParaGuardar =
			mensajeDetallado.length > 0 ? mensajeDetallado : undefined;
		const numeroVueloCliente = limpiarTextoPlano(datosReserva.numeroVuelo);
		const hotelCliente = limpiarTextoPlano(datosReserva.hotel);
		const equipajeEspecialCliente = limpiarTextoPlano(
			datosReserva.equipajeEspecial
		);
		const sillaInfantilCliente =
			datosReserva.sillaInfantil !== undefined
				? Boolean(datosReserva.sillaInfantil)
				: undefined;

		// Formatear RUT si se proporciona
		const rutFormateado = datosReserva.rut
			? formatearRUT(datosReserva.rut)
			: null;
		const emailNormalizado = datosReserva.email
			? datosReserva.email.toLowerCase().trim()
			: "";

		console.log("Reserva express recibida:", {
			nombre: datosReserva.nombre,
			email: emailNormalizado,
			telefono: datosReserva.telefono,
			clienteId: datosReserva.clienteId,
			rut: rutFormateado,
			origen: datosReserva.origen,
			destino: datosReserva.destino,
			fecha: datosReserva.fecha,
			pasajeros: datosReserva.pasajeros,
			totalConDescuento: datosReserva.totalConDescuento,
			source: datosReserva.source || "express_web",
		});

		// Validar campos mínimos requeridos
		const camposRequeridos = [
			"nombre",
			"email",
			"telefono",
			"origen",
			"destino",
			"fecha",
		];
		const camposFaltantes = camposRequeridos.filter(
			(campo) => !datosReserva[campo]
		);

		if (camposFaltantes.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Faltan campos requeridos: ${camposFaltantes.join(", ")}`,
			});
		}

		if (!emailNormalizado) {
			return res.status(400).json({
				success: false,
				message: "El email es obligatorio",
			});
		}

		datosReserva.email = emailNormalizado;

		// Verificar si la fecha/hora está bloqueada
		const bloqueoResultado = await verificarBloqueoAgenda(
			datosReserva.fecha,
			datosReserva.hora
		);

		if (bloqueoResultado.bloqueado) {
			console.log("RESERVA EXPRESS BLOQUEADA:", {
				fecha: datosReserva.fecha,
				hora: datosReserva.hora,
				motivo: bloqueoResultado.motivo,
			});
			return res.status(400).json({
				success: false,
				message: "Agenda completada",
				error: bloqueoResultado.motivo,
				bloqueado: true,
			});
		}

		const clienteAsociado = await obtenerClienteParaReservaExpress({
			clienteId: datosReserva.clienteId,
			rutFormateado,
			emailNormalizado,
			nombre: datosReserva.nombre,
			telefono: datosReserva.telefono,
		});
		const clienteIdAsociado = clienteAsociado ? clienteAsociado.id : null;

		// Verificar si existe una reserva activa sin pagar para este email
		const reservaExistente = await Reserva.findOne({
			where: {
				email: emailNormalizado,
				estado: {
					[Op.in]: ["pendiente", "pendiente_detalles"],
				},
				estadoPago: "pendiente",
			},
			order: [["createdAt", "DESC"]],
		});

		let reservaExpress;
		let esModificacion = false;

		if (reservaExistente) {
			// MODIFICAR reserva existente sin pagar
			console.log(
				`🔄 Modificando reserva existente ID: ${reservaExistente.id}, Código: ${reservaExistente.codigoReserva}`
			);
			esModificacion = true;

			// Actualizar la reserva existente con los nuevos datos (incluir hora si viene del cliente)
			// Calcular totales y abono para la modificación: no aceptar saldo enviado
			// por el cliente si no existe evidencia de pago.
			const totalCalculadoExistente = parsePositiveDecimal(
				datosReserva.totalConDescuento,
				"totalConDescuento",
				reservaExistente.totalConDescuento ||
					parsePositiveDecimal(datosReserva.precio, "precio", 0)
			);
			const abonoCalculadoExistente = parsePositiveDecimal(
				datosReserva.abonoSugerido,
				"abonoSugerido",
				reservaExistente.abonoSugerido || 0
			);
			const hasSaldoProvidedExistente = Object.prototype.hasOwnProperty.call(
				datosReserva,
				"saldoPendiente"
			);
			const pagoMontoProvidedExistente =
				datosReserva.pagoMonto !== undefined &&
				datosReserva.pagoMonto !== null &&
				datosReserva.pagoMonto !== "" &&
				parsePositiveDecimal(datosReserva.pagoMonto, "pagoMonto", 0) > 0;

			let saldoParaActualizarExistente;
			if (
				hasSaldoProvidedExistente &&
				(pagoMontoProvidedExistente || datosReserva.estadoPago === "pagado")
			) {
				saldoParaActualizarExistente = parsePositiveDecimal(
					datosReserva.saldoPendiente,
					"saldoPendiente",
					Math.max(totalCalculadoExistente - abonoCalculadoExistente, 0)
				);
			} else {
				// No hay evidencia de pago: mantenemos saldo igual al total (no asumir abono)
				saldoParaActualizarExistente = totalCalculadoExistente;
			}

			console.log(
				"[DEBUG] /enviar-reserva-express - modificación: cálculos financieros:",
				{
					reservaId: reservaExistente.id,
					totalCalculadoExistente,
					abonoCalculadoExistente,
					hasSaldoProvidedExistente,
					pagoMontoProvidedExistente,
					saldoParaActualizarExistente,
					estadoPago: datosReserva.estadoPago,
				}
			);

			await reservaExistente.update({
				nombre: datosReserva.nombre,
				email: emailNormalizado || reservaExistente.email,
				telefono: datosReserva.telefono,
				clienteId: clienteIdAsociado || reservaExistente.clienteId || null,
				rut: rutFormateado,
				origen: datosReserva.origen,
				destino: datosReserva.destino,
				direccionOrigen: direccionOrigenCliente,
				direccionDestino: direccionDestinoCliente,
				fecha: datosReserva.fecha,
				hora: normalizeTimeGlobal(datosReserva.hora) || reservaExistente.hora,
				pasajeros: parsePositiveInteger(datosReserva.pasajeros, "pasajeros", 1),
				precio: parsePositiveDecimal(datosReserva.precio, "precio", 0),
				vehiculo: datosReserva.vehiculo || "",
				numeroVuelo:
					datosReserva.numeroVuelo !== undefined
						? numeroVueloCliente
						: reservaExistente.numeroVuelo,
				hotel:
					datosReserva.hotel !== undefined
						? hotelCliente
						: reservaExistente.hotel,
				equipajeEspecial:
					datosReserva.equipajeEspecial !== undefined
						? equipajeEspecialCliente
						: reservaExistente.equipajeEspecial,
				sillaInfantil:
					datosReserva.sillaInfantil !== undefined
						? Boolean(datosReserva.sillaInfantil)
						: reservaExistente.sillaInfantil,
				idaVuelta: Boolean(datosReserva.idaVuelta),
				fechaRegreso:
					datosReserva.fechaRegreso !== undefined
						? datosReserva.fechaRegreso || null
						: reservaExistente.fechaRegreso,
				horaRegreso:
					datosReserva.horaRegreso !== undefined
						? normalizeTimeGlobal(datosReserva.horaRegreso) || null
						: reservaExistente.horaRegreso,
				abonoSugerido: abonoCalculadoExistente,
				saldoPendiente: saldoParaActualizarExistente,
				descuentoBase: parsePositiveDecimal(
					datosReserva.descuentoBase,
					"descuentoBase",
					0
				),
				descuentoPromocion: parsePositiveDecimal(
					datosReserva.descuentoPromocion,
					"descuentoPromocion",
					0
				),
				descuentoRoundTrip: parsePositiveDecimal(
					datosReserva.descuentoRoundTrip,
					"descuentoRoundTrip",
					0
				),
				descuentoOnline: parsePositiveDecimal(
					datosReserva.descuentoOnline,
					"descuentoOnline",
					0
				),
				totalConDescuento: parsePositiveDecimal(
					datosReserva.totalConDescuento,
					"totalConDescuento",
					0
				),
				mensaje:
					mensajeParaGuardar !== undefined
						? mensajeParaGuardar
						: reservaExistente.mensaje,
				codigoDescuento:
					datosReserva.codigoDescuento || reservaExistente.codigoDescuento,
				// Mantener el código de reserva original
				// Actualizar metadata
				ipAddress:
					req.ip || req.connection.remoteAddress || reservaExistente.ipAddress,
				userAgent: req.get("User-Agent") || reservaExistente.userAgent,
				referenciaPago:
					datosReserva.referenciaPago || reservaExistente.referenciaPago,
				tipoPago: datosReserva.tipoPago || reservaExistente.tipoPago,
			});

			reservaExpress = reservaExistente;
			console.log(
				`✅ Reserva modificada exitosamente: ID ${reservaExpress.id}`
			);
		} else {
			// CREAR nueva reserva
			const codigoReserva = await generarCodigoReserva();
			console.log(`➕ Creando nueva reserva con código: ${codigoReserva}`);

			// Calcular totales y abono para decidir saldo guardado.
			const totalCalculadoExpress = parsePositiveDecimal(
				datosReserva.totalConDescuento,
				"totalConDescuento",
				parsePositiveDecimal(datosReserva.precio, "precio", 0)
			);
			const abonoCalculadoExpress = parsePositiveDecimal(
				datosReserva.abonoSugerido,
				"abonoSugerido",
				0
			);

			const pagoMontoProvidedExpress =
				datosReserva.pagoMonto !== undefined &&
				datosReserva.pagoMonto !== null &&
				datosReserva.pagoMonto !== "" &&
				parsePositiveDecimal(datosReserva.pagoMonto, "pagoMonto", 0) > 0;

			let saldoPendienteParaGuardar;
			if (pagoMontoProvidedExpress || datosReserva.estadoPago === "pagado") {
				// Si frontend informó un saldo explícito y hay pago indicado, respetarlo
				saldoPendienteParaGuardar = parsePositiveDecimal(
					datosReserva.saldoPendiente,
					"saldoPendiente",
					Math.max(totalCalculadoExpress - abonoCalculadoExpress, 0)
				);
			} else {
				// No hay evidencia de pago: saldo = total
				saldoPendienteParaGuardar = totalCalculadoExpress;
			}

			// Log temporal para depuración del flujo express
			console.log("[DEBUG] /enviar-reserva-express - cálculos financieros:", {
				totalCalculadoExpress,
				abonoCalculadoExpress,
				pagoMontoProvidedExpress,
				saldoPendienteParaGuardar,
				estadoPago: datosReserva.estadoPago,
			});

			reservaExpress = await Reserva.create({
				codigoReserva: codigoReserva,
				nombre: datosReserva.nombre,
				email: emailNormalizado,
				telefono: datosReserva.telefono,
				clienteId: clienteIdAsociado,
				rut: rutFormateado,
				origen: datosReserva.origen,
				destino: datosReserva.destino,
				fecha: datosReserva.fecha,
				// Normalizar y usar la hora enviada por el cliente, o null si no se proporciona
				hora: normalizeTimeGlobal(datosReserva.hora),
				pasajeros: parsePositiveInteger(datosReserva.pasajeros, "pasajeros", 1),
				precio: parsePositiveDecimal(datosReserva.precio, "precio", 0),
				vehiculo: datosReserva.vehiculo || "",
				referenciaPago: datosReserva.referenciaPago || null,

				// Campos que se completarán después del pago (opcionales por ahora)
				numeroVuelo: numeroVueloCliente,
				hotel: hotelCliente,
				equipajeEspecial: equipajeEspecialCliente,
				sillaInfantil:
					sillaInfantilCliente !== undefined ? sillaInfantilCliente : false,
				idaVuelta: Boolean(datosReserva.idaVuelta),
				fechaRegreso: datosReserva.fechaRegreso || null,
				horaRegreso: normalizeTimeGlobal(datosReserva.horaRegreso),

				// Campos financieros con validación
				abonoSugerido: abonoCalculadoExpress,
				saldoPendiente: saldoPendienteParaGuardar,
				descuentoBase: parsePositiveDecimal(
					datosReserva.descuentoBase,
					"descuentoBase",
					0
				),
				descuentoPromocion: parsePositiveDecimal(
					datosReserva.descuentoPromocion,
					"descuentoPromocion",
					0
				),
				descuentoRoundTrip: parsePositiveDecimal(
					datosReserva.descuentoRoundTrip,
					"descuentoRoundTrip",
					0
				),
				descuentoOnline: parsePositiveDecimal(
					datosReserva.descuentoOnline,
					"descuentoOnline",
					0
				),
				totalConDescuento: parsePositiveDecimal(
					datosReserva.totalConDescuento,
					"totalConDescuento",
					0
				),
				mensaje: mensajeParaGuardar ?? "",

				// Metadata del sistema
				source: datosReserva.source || "express_web",
				// Respetar el estado enviado por el frontend si existe.
				// Si la reserva se crea desde un pago con código (source === 'codigo_pago')
				// queremos mantenerla en 'pendiente' hasta la confirmación del pago
				// (webhook). Por compatibilidad con el flujo express por defecto,
				// usamos 'pendiente_detalles' sólo si no se indica lo contrario.
				estado:
					datosReserva.estado ||
					(datosReserva.source === "codigo_pago"
						? "pendiente"
						: "pendiente_detalles"),
				ipAddress: req.ip || req.connection.remoteAddress || "",
				userAgent: req.get("User-Agent") || "",
				codigoDescuento: datosReserva.codigoDescuento || "",
				tipoPago: datosReserva.tipoPago || null,
				estadoPago: datosReserva.estadoPago || "pendiente",
			});

			console.log(
				"✅ Reserva express guardada en base de datos con ID:",
				reservaExpress.id,
				"Código:",
				reservaExpress.codigoReserva
			);
		}

		if (clienteIdAsociado) {
			try {
				await actualizarResumenCliente(clienteIdAsociado);
			} catch (resumenError) {
				console.error(
					"Error al actualizar el resumen del cliente en reserva express:",
					resumenError
				);
			}
		}

		// Enviar notificación por email usando el PHP de Hostinger
		// El correo enviado al cliente dependerá del estado de pago
		if (enviarCorreo) {
			try {
				console.log("📧 Enviando email de notificación express...");
				const emailDataExpress = {
					...datosReserva,
					codigoReserva: reservaExpress.codigoReserva,
					precio: reservaExpress.precio,
					totalConDescuento: reservaExpress.totalConDescuento,
					source: reservaExpress.source || "express_web",
					// Incluir estado de pago para determinar tipo de correo al cliente
					estadoPago: reservaExpress.estadoPago || "pendiente",
				};

				const phpUrl =
					process.env.PHP_EMAIL_URL ||
					"https://www.transportesaraucaria.cl/enviar_correo_mejorado.php";

				const emailResponse = await axios.post(phpUrl, emailDataExpress, {
					headers: { "Content-Type": "application/json" },
					timeout: 30000,
				});

				console.log(
					"✅ Email express enviado exitosamente:",
					emailResponse.data
				);
			} catch (emailError) {
				console.error(
					"❌ Error al enviar email express (no afecta la reserva):",
					emailError.message
				);
			}
		} else {
			console.log(
				"ℹ️ Email de notificación express omitido (enviarCorreo = false)"
			);
		}

		// --- LÓGICA DE CORREO DIFERIDO (DESCUENTO) - EXPRESS ---
		// Si la reserva está pendiente de pago, programar correo de descuento
		if (
			(reservaExpress.estadoPago === "pendiente") &&
			datosReserva.source !== "codigo_pago"
		) {
			try {
				// Verificar si ya existe un correo pendiente para esta reserva para no duplicar
				const existingPending = await PendingEmail.findOne({
					where: {
						reservaId: reservaExpress.id,
						status: "pending",
						type: "discount_offer"
					}
				});

				if (!existingPending) {
					// Calcular fecha de envío (30 minutos después)
					const scheduledAt = new Date(Date.now() + 30 * 60 * 1000);
					
					await PendingEmail.create({
						reservaId: reservaExpress.id,
						email: reservaExpress.email,
						type: "discount_offer",
						status: "pending",
						scheduledAt: scheduledAt
					});
					
					console.log(`⏳ Correo de descuento express programado para reserva ${reservaExpress.codigoReserva} a las ${scheduledAt.toISOString()}`);
					
					// Enviar notificación SOLO al administrador inmediatamente
					if (enviarCorreo) {
						try {
							const phpUrl = process.env.PHP_EMAIL_URL || "https://www.transportesaraucaria.cl/enviar_correo_mejorado.php";
							await axios.post(phpUrl, {
								...datosReserva,
								codigoReserva: reservaExpress.codigoReserva,
								precio: reservaExpress.precio,
								totalConDescuento: reservaExpress.totalConDescuento,
								source: reservaExpress.source || "express_web",
								estadoPago: "pendiente",
								action: "notify_admin_only" // NUEVO PARÁMETRO
							}, {
								headers: { "Content-Type": "application/json" },
								timeout: 10000
							});
							console.log("✅ Notificación express al admin enviada correctamente");
						} catch (adminEmailError) {
							console.error("❌ Error enviando notificación express al admin:", adminEmailError.message);
						}
					}
				}
			} catch (scheduleError) {
				console.error("❌ Error programando correo de descuento express:", scheduleError);
			}
		}

		return res.json({
			success: true,
			message: esModificacion
				? "Reserva modificada correctamente"
				: "Reserva express creada correctamente",
			reservaId: reservaExpress.id,
			codigoReserva: reservaExpress.codigoReserva,
			tipo: "express",
			esModificacion: esModificacion,
		});
	} catch (error) {
		console.error("Error al procesar la reserva express:", error);
		return res.status(500).json({
			success: false,
			message: "Error interno del servidor",
		});
	}
});

// --- ENDPOINTS PARA CODIGOS DE PAGO ---

// Crear código de pago (Admin)
app.post("/api/codigos-pago", authAdmin, async (req, res) => {
	try {
		const body = req.body || {};
		const codigo = String(body.codigo || "")
			.trim()
			.toUpperCase();
		const origen = String(body.origen || "Aeropuerto Temuco").trim();
		const destino = String(body.destino || "").trim();
		const monto = parsePositiveDecimal(body.monto, "monto", 0);
		const descripcion = body.descripcion || "";
		const vehiculo = body.vehiculo || "";
		const pasajeros = parsePositiveInteger(body.pasajeros, "pasajeros", 1);
		const idaVuelta = Boolean(body.idaVuelta);
		const permitirAbono = Boolean(body.permitirAbono); // Nuevo campo
		const fechaVencimiento = body.fechaVencimiento
			? new Date(body.fechaVencimiento)
			: null;
		const usosMaximos = parsePositiveInteger(
			body.usosMaximos,
			"usosMaximos",
			1
		);
		const observaciones = body.observaciones || "";

		if (!codigo) {
			return res
				.status(400)
				.json({ success: false, message: "El código es requerido" });
		}
		if (!destino) {
			return res
				.status(400)
				.json({ success: false, message: "El destino es requerido" });
		}
		if (!Number.isFinite(monto) || monto <= 0) {
			return res
				.status(400)
				.json({ success: false, message: "El monto debe ser mayor a 0" });
		}

		const existente = await CodigoPago.findOne({ where: { codigo } });
		if (existente) {
			return res
				.status(409)
				.json({ success: false, message: "El código ya existe" });
		}

		const created = await CodigoPago.create({
			codigo,
			origen,
			destino,
			monto,
			descripcion,
			vehiculo,
			pasajeros,
			idaVuelta,
			permitirAbono, // Nuevo campo
			fechaVencimiento,
			usosMaximos,
			usosActuales: 0,
			observaciones,
			estado: "activo",
		});

		return res.json({ success: true, codigoPago: created });
	} catch (error) {
		console.error("Error creando código de pago:", error);
		return res
			.status(500)
			.json({ success: false, message: "Error interno del servidor" });
	}
});

// Listar códigos de pago (Admin)
app.get("/api/codigos-pago", authAdmin, async (req, res) => {
	try {
		const { estado, page = 1, limit = 50 } = req.query;
		const where = {};
		if (estado) where.estado = estado;
		const pageNum = Math.max(1, parseInt(page, 10) || 1);
		const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
		const offset = (pageNum - 1) * limitNum;

		const { count, rows } = await CodigoPago.findAndCountAll({
			where,
			order: [["created_at", "DESC"]],
			limit: limitNum,
			offset,
		});

		return res.json({
			success: true,
			codigosPago: rows,
			pagination: {
				total: count,
				page: pageNum,
				limit: limitNum,
				totalPages: Math.ceil(count / limitNum),
			},
		});
	} catch (error) {
		console.error("Error listando códigos de pago:", error);
		return res
			.status(500)
			.json({ success: false, message: "Error interno del servidor" });
	}
});

// Obtener/validar un código de pago (Público)
app.get("/api/codigos-pago/:codigo", async (req, res) => {
	try {
		const codigo = String(req.params.codigo || "")
			.trim()
			.toUpperCase();
		if (!codigo) {
			return res
				.status(400)
				.json({ success: false, message: "Código inválido" });
		}

		const registro = await CodigoPago.findOne({ where: { codigo } });
		if (!registro) {
			return res.json({
				success: false,
				message: "Código de pago no encontrado",
			});
		}

		// Verificar vencimiento
		if (registro.fechaVencimiento) {
			const now = new Date();
			if (
				new Date(registro.fechaVencimiento) < now &&
				registro.estado === "activo"
			) {
				// Marcar como vencido si está activo y ya pasó la fecha
				await registro.update({ estado: "vencido" }).catch(() => {});
			}
		}

		// Verificar usos
		if (registro.usosActuales >= registro.usosMaximos) {
			if (registro.estado !== "usado") {
				await registro.update({ estado: "usado" }).catch(() => {});
			}
			return res.json({
				success: false,
				message: "El código está usado",
				estado: "usado",
			});
		}

		if (registro.estado === "cancelado" || registro.estado === "vencido") {
			return res.json({
				success: false,
				message: `El código está ${registro.estado}`,
				estado: registro.estado,
			});
		}

		return res.json({ success: true, codigoPago: registro });
	} catch (error) {
		console.error("Error validando código de pago:", error);
		return res
			.status(500)
			.json({ success: false, message: "Error interno del servidor" });
	}
});

// Marcar un código de pago como usado (Interno)
app.put("/api/codigos-pago/:codigo/usar", async (req, res) => {
	try {
		const codigo = String(req.params.codigo || "")
			.trim()
			.toUpperCase();
		const { reservaId, emailCliente } = req.body || {};
		const registro = await CodigoPago.findOne({ where: { codigo } });
		if (!registro) {
			return res
				.status(404)
				.json({ success: false, message: "Código de pago no encontrado" });
		}

		const nuevosUsos = (parseInt(registro.usosActuales, 10) || 0) + 1;
		const estado =
			nuevosUsos >= registro.usosMaximos ? "usado" : registro.estado;

		await registro.update({
			usosActuales: nuevosUsos,
			reservaId: reservaId ?? registro.reservaId,
			emailCliente: emailCliente ?? registro.emailCliente,
			fechaUso: new Date(),
			estado,
		});

		return res.json({
			success: true,
			message: "Código marcado como usado",
			codigoPago: registro,
		});
	} catch (error) {
		console.error("Error marcando código de pago como usado:", error);
		return res
			.status(500)
			.json({ success: false, message: "Error interno del servidor" });
	}
});

// Eliminar un código de pago (Admin)
app.delete("/api/codigos-pago/:codigo", authAdmin, async (req, res) => {
	try {
		const codigo = String(req.params.codigo || "")
			.trim()
			.toUpperCase();
		const registro = await CodigoPago.findOne({ where: { codigo } });
		if (!registro) {
			return res
				.status(404)
				.json({ success: false, message: "Código de pago no encontrado" });
		}
		if (registro.estado === "usado") {
			return res.status(400).json({
				success: false,
				message: "No se puede eliminar un código usado",
			});
		}
		await CodigoPago.destroy({ where: { codigo } });
		return res.json({
			success: true,
			message: "Código de pago eliminado correctamente",
		});
	} catch (error) {
		console.error("Error eliminando código de pago:", error);
		return res
			.status(500)
			.json({ success: false, message: "Error interno del servidor" });
	}
});

// Endpoint para completar detalles después del pago
app.put("/completar-reserva-detalles/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const detalles = req.body;

		console.log(`Completando detalles para reserva ${id}:`, detalles);

		// Buscar la reserva
		const reserva = await Reserva.findByPk(id, {
			include: [
				{
					model: Cliente,
					as: "cliente",
					attributes: [
						"id",
						"nombre",
						"email",
						"telefono",
						"esCliente",
						"clasificacion",
						"totalReservas",
					],
				},
			],
		});
		if (!reserva) {
			return res.status(404).json({
				success: false,
				message: "Reserva no encontrada",
			});
		}

		// Actualizar con los detalles proporcionados
		const datosActualizados = {
			hora: normalizeTimeGlobal(detalles.hora) || reserva.hora,
			// Permitir actualizar la fecha explicitamente si la envía el cliente
			fecha: detalles.fecha || reserva.fecha,
			numeroVuelo: detalles.numeroVuelo || "",
			hotel: detalles.hotel || "",
			equipajeEspecial: detalles.equipajeEspecial || "",
			sillaInfantil: detalles.sillaInfantil || reserva.sillaInfantil,
			idaVuelta: Boolean(detalles.idaVuelta),
			fechaRegreso: detalles.fechaRegreso || reserva.fechaRegreso,
			horaRegreso:
				normalizeTimeGlobal(detalles.horaRegreso) || reserva.horaRegreso,
			// No escribir campos virtuales; solo estado
			estado: "confirmada",
		};

		await reserva.update(datosActualizados);

		console.log(`✅ Detalles completados para reserva ${id}`);

		return res.json({
			success: true,
			message: "Detalles actualizados correctamente",
			reserva: await Reserva.findByPk(id), // Devolver reserva actualizada
		});
	} catch (error) {
		console.error("Error actualizando detalles de reserva:", error);
		return res.status(500).json({
			success: false,
			message: "Error interno del servidor",
		});
	}
});

// --- ENDPOINTS PARA GESTIONAR RECURSOS (CONDUCTORES/VEHICULOS) ---

// Obtener lista de conductores (Admin)
app.get("/api/conductores", authAdmin, async (req, res) => {
	try {
        const { estado } = req.query;
        const whereClause = {};
        
        if (estado) {
            whereClause.estado = estado;
        }

		const conductores = await Conductor.findAll({
            where: whereClause,
			order: [["nombre", "ASC"]],
		});
        
		res.json({ success: true, conductores });
	} catch (error) {
		console.error("Error obteniendo conductores:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener lista de vehiculos (Admin)
app.get("/api/vehiculos", authAdmin, async (req, res) => {
	try {
        const { estado } = req.query;
        const whereClause = {};
        
        if (estado) {
            whereClause.estado = estado;
        }

		const vehiculos = await Vehiculo.findAll({
            where: whereClause,
			order: [["patente", "ASC"]],
		});
        
		res.json({ success: true, vehiculos });
	} catch (error) {
		console.error("Error obteniendo vehiculos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// --- ENDPOINTS PARA GESTIONAR RESERVAS ---

// Obtener estadísticas de reservas (MOVIDO ANTES DE :id y con AUTH)
app.get("/api/reservas/estadisticas", authAdmin, async (req, res) => {
	try {
		// Usar consultas separadas con manejo de errores individual
		let totalReservas = 0;
		let reservasPendientes = 0;
		let reservasConfirmadas = 0;
		let reservasPagadas = 0;
		let totalIngresos = 0;

		try {
			totalReservas = await Reserva.count();
		} catch (error) {
			console.error("Error contando total de reservas:", error.message);
		}

		try {
			reservasPendientes = await Reserva.count({
				where: { estado: "pendiente" },
			});
		} catch (error) {
			console.error("Error contando reservas pendientes:", error.message);
		}

		try {
			reservasConfirmadas = await Reserva.count({
				where: { estado: "confirmada" },
			});
		} catch (error) {
			console.error("Error contando reservas confirmadas:", error.message);
		}

		try {
			reservasPagadas = await Reserva.count({
				where: { estadoPago: "pagado" },
			});
		} catch (error) {
			console.error("Error contando reservas pagadas:", error.message);
		}

		// Ingresos totales con manejo de errores mejorado
		try {
			// Usar método de Sequelize que maneja automáticamente los nombres de columnas
			// Esto evita problemas con camelCase vs snake_case
			const reservasPagadasList = await Reserva.findAll({
				where: { estadoPago: "pagado" },
				attributes: ["totalConDescuento"],
			});

			totalIngresos = reservasPagadasList.reduce((sum, reserva) => {
				const monto = parseFloat(reserva.totalConDescuento) || 0;
				return sum + monto;
			}, 0);
		} catch (error) {
			console.error("Error calculando ingresos totales:", error.message);
			// Continuar con totalIngresos = 0
		}

		res.json({
			totalReservas,
			reservasPendientes,
			reservasConfirmadas,
			reservasPagadas,
			totalIngresos: totalIngresos || 0,
		});
	} catch (error) {
		console.error("Error obteniendo estadísticas:", error);
		console.error("Stack completo:", error.stack);
		// Devolver valores por defecto en lugar de error
		res.json({
			totalReservas: 0,
			reservasPendientes: 0,
			reservasConfirmadas: 0,
			reservasPagadas: 0,
			totalIngresos: 0,
			error: "Error al obtener estadísticas, mostrando valores por defecto",
		});
	}
});

// Obtener una una reserva específica
app.get("/api/reservas/:id", authAdmin, async (req, res) => {
	try {
        // Verificar si es ID numerico valido antes de consultar
        if (!req.params.id || isNaN(req.params.id)) {
             return res.status(400).json({ success: false, message: "ID inválido" });
        }

		const reserva = await Reserva.findByPk(req.params.id, {
			include: [
				{
					model: Cliente,
					as: "cliente",
					attributes: [
						"id",
						"nombre",
						"email",
						"telefono",
						"esCliente",
						"clasificacion",
						"totalReservas",
					],
				},
			],
		});

		if (!reserva) {
			return res.status(404).json({
				success: false,
				message: "Reserva no encontrada",
			});
		}

		// Retornar el objeto reserva directamente para que el frontend lo consuma correctamente
		// (El frontend espera las propiedades en la raíz, no envueltas en "reserva")
		return res.json(reserva);
	} catch (error) {
		console.error("Error obteniendo reserva:", error);
		return res.status(500).json({
			success: false,
			message: "Error interno del servidor",
		});
	}
});

// Obtener todas las reservas
app.get("/api/reservas", async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			estado,
			fecha_desde,
			fecha_hasta,
			incluir_cerradas,
		} = req.query;

		const whereClause = {};
		if (estado) {
			whereClause.estado = estado;
			// Si filtramos por completadas, excluir las que tienen gastos cerrados
			// EXCEPTO si incluir_cerradas=true
			if (estado === 'completada' && incluir_cerradas !== 'true') {
				whereClause.gastosCerrados = false;
			}
		}
		if (fecha_desde || fecha_hasta) {
			whereClause.fecha = {};
			if (fecha_desde) whereClause.fecha[Op.gte] = fecha_desde;
			if (fecha_hasta) whereClause.fecha[Op.lte] = fecha_hasta;
		}

		// Filtro: Sin Asignación (conductor o vehiculo faltante)
		if (req.query.sin_asignacion === 'true') {
			whereClause[Op.or] = [
				{ conductorId: null },
				{ vehiculoId: null }
			];
			// Excluir canceladas/completadas si no se especifica estado
			if (!estado) {
				whereClause.estado = {
					[Op.notIn]: ['cancelada', 'completada']
				};
			}
		}

		// Filtro: Estado Avanzado (Incompletas)
		if (req.query.estado_avanzado === 'incompletas') {
			whereClause[Op.and] = [
				{
					[Op.or]: [
						{ numeroVuelo: null },
						{ numeroVuelo: '' },
						{ hotel: null },
						{ hotel: '' }
					]
				},
				// Solo considerar reservas pendientes/confirmadas
				{
					estado: {
						[Op.in]: ['pendiente', 'confirmada', 'pendiente_detalles']
					}
				}
			];
		}

		// Filtro: Archivadas
		// Por defecto archivada = false, salvo que se pida explicitamente
		if (req.query.archivadas === 'true') {
			whereClause.archivada = true;
		} else {
			whereClause.archivada = false;
		}

		// Configurar opciones de consulta
		const queryOptions = {
			where: whereClause,
			order: [["created_at", "DESC"]],
			include: [
				{
					model: Cliente,
					as: "cliente",
					attributes: [
						"id",
						"nombre",
						"email",
						"telefono",
						"esCliente",
						"clasificacion",
						"totalReservas",
					],
				},
			],
		};

		// Manejar paginación
		const limitNum = parseInt(limit);
		const pageNum = parseInt(page);
		
		// Solo aplicar límite y offset si limit > 0
		// Si limit es -1, se devolverán todos los registros sin paginación
		if (limitNum > 0) {
			queryOptions.limit = limitNum;
			queryOptions.offset = (pageNum - 1) * limitNum;
		}

		const { count, rows: reservas } = await Reserva.findAndCountAll(queryOptions);

		res.json({
			reservas,
			pagination: {
				total: count,
				page: pageNum,
				limit: limitNum,
				totalPages: limitNum > 0 ? Math.ceil(count / limitNum) : 1,
			},
		});
	} catch (error) {
		console.error("Error obteniendo reservas:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});



// Obtener una reserva específica
app.get("/api/reservas/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const reserva = await Reserva.findByPk(id);

		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		res.json(reserva);
	} catch (error) {
		console.error("Error obteniendo reserva:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Archivar/Desarchivar reserva (Admin)
app.put("/api/reservas/:id/archivar", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const { archivada } = req.body;
		
		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({ success: false, message: "Reserva no encontrada" });
		}

		await reserva.update({ archivada: Boolean(archivada) });
		
		return res.json({ 
			success: true, 
			message: archivada ? "Reserva archivada" : "Reserva restaurada",
			reserva 
		});
	} catch (error) {
		console.error("Error archivando reserva:", error);
		return res.status(500).json({ success: false, message: "Error interno del servidor" });
	}
});

// Buscar reserva por código de reserva (público)
app.get("/api/reservas/codigo/:codigo", async (req, res) => {
	try {
		const { codigo } = req.params;

		console.log(`🔍 Buscando reserva con código: ${codigo}`);

		const codigoUpper = (codigo || "").toUpperCase();
		let reserva = null;

		// 1) Intentar por código de reserva estándar (AR-YYYYMMDD-XXXX)
		reserva = await Reserva.findOne({
			where: { codigoReserva: codigoUpper },
			include: [
				{
					model: Cliente,
					as: "cliente",
					attributes: [
						"id",
						"nombre",
						"email",
						"telefono",
						"esCliente",
						"clasificacion",
						"totalReservas",
					],
				},
				{
					model: ProductoReserva,
					as: "productosReserva",
					include: [
						{
							model: Producto,
							as: "producto",
						},
					],
				},
			],
		});

		// 2) Si no existe y parece un código de pago u otro identificador, intentar por referenciaPago
		if (!reserva) {
			reserva = await Reserva.findOne({
				where: { referenciaPago: codigoUpper },
				include: [
					{
						model: Cliente,
						as: "cliente",
						attributes: [
							"id",
							"nombre",
							"email",
							"telefono",
							"esCliente",
							"clasificacion",
							"totalReservas",
						],
					},
					{
						model: ProductoReserva,
						as: "productosReserva",
						include: [
							{
								model: Producto,
								as: "producto",
							},
						],
					},
				],
				order: [["created_at", "DESC"]],
			});
		}

		// 3) Fallback: si existe un registro en codigos_pago con ese código y tiene reservaId, cargar la reserva
		if (!reserva) {
			try {
				const cp = await CodigoPago.findOne({ where: { codigo: codigoUpper } });
				if (cp && cp.reservaId) {
					reserva = await Reserva.findByPk(cp.reservaId, {
						include: [
							{
								model: Cliente,
								as: "cliente",
								attributes: [
									"id",
									"nombre",
									"email",
									"telefono",
									"esCliente",
									"clasificacion",
									"totalReservas",
								],
							},
							{
								model: ProductoReserva,
								as: "productosReserva",
								include: [
									{
										model: Producto,
										as: "producto",
									},
								],
							},
						],
					});
				}
			} catch (err) {
				// Ignorar errores no críticos intencionalmente
				// `void err;` evita la advertencia de variable no usada y permite
				// habilitar un registro rápido si es necesario en el futuro.
				void err;
			}
		}

		if (!reserva) {
			console.log(`❌ No se encontró reserva con código: ${codigo}`);
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		console.log(`✅ Reserva encontrada: ID ${reserva.id}`);
		res.json(reserva);
	} catch (error) {
		console.error("Error buscando reserva por código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Verificar si existe una reserva activa sin pagar para un email
app.get("/api/reservas/verificar-activa/:email", async (req, res) => {
	try {
		const { email } = req.params;

		console.log(`🔍 Verificando reserva activa para email: ${email}`);

		// Buscar reservas activas (pendiente o pendiente_detalles) sin pagar
		const reservaActiva = await Reserva.findOne({
			where: {
				email: email.toLowerCase().trim(),
				estado: {
					[Op.in]: ["pendiente", "pendiente_detalles"],
				},
				estadoPago: "pendiente",
			},
			order: [["createdAt", "DESC"]], // La más reciente primero
		});

		if (!reservaActiva) {
			console.log(`✅ No hay reserva activa sin pagar para: ${email}`);
			return res.json({
				tieneReservaActiva: false,
				mensaje: "No hay reservas activas sin pagar",
			});
		}

		console.log(
			`⚠️ Se encontró reserva activa sin pagar: ID ${reservaActiva.id}, Código: ${reservaActiva.codigoReserva}`
		);
		res.json({
			tieneReservaActiva: true,
			reserva: {
				id: reservaActiva.id,
				codigoReserva: reservaActiva.codigoReserva,
				origen: reservaActiva.origen,
				destino: reservaActiva.destino,
				fecha: reservaActiva.fecha,
				pasajeros: reservaActiva.pasajeros,
				precio: reservaActiva.precio,
				totalConDescuento: reservaActiva.totalConDescuento,
				createdAt: reservaActiva.createdAt,
			},
			mensaje:
				"Se encontró una reserva activa sin pagar. Se modificará en lugar de crear una nueva.",
		});
	} catch (error) {
		console.error("Error verificando reserva activa:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// NOTA: Endpoint de actualización de estado movido a línea 6031 (versión mejorada)

// Toggle estado de gastos cerrados (Admin)
app.patch("/api/reservas/:id/toggle-gastos", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const reserva = await Reserva.findByPk(id);
		
		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}
		
		// Toggle el estado de gastosCerrados
		const nuevoEstado = !reserva.gastosCerrados;
		await reserva.update({ gastosCerrados: nuevoEstado });
		
		res.json({
			success: true,
			message: nuevoEstado 
				? "Registro de gastos cerrado" 
				: "Registro de gastos reabierto",
			gastosCerrados: nuevoEstado,
			reserva
		});
	} catch (error) {
		console.error("Error al cambiar estado de gastos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar estado de pago de una reserva (con transacciones para garantizar consistencia)
app.put("/api/reservas/:id/pago", async (req, res) => {
	const transaction = await sequelize.transaction();

	try {
		const { id } = req.params;
		const {
			estadoPago,
			metodoPago,
			referenciaPago,
			montoPagado,
			tipoPago: _tipoPago,
			estadoReserva: estadoReservaRaw,
		} = req.body;

		// Log de depuración: registrar intento de actualización de pago
		try {
			const hasAuth = !!req.headers.authorization;
			console.log(`DEBUG [PUT /api/reservas/${id}/pago] payload:`, {
				id,
				estadoPago,
				metodoPago,
				referenciaPago,
				montoPagado,
				tipoPago: _tipoPago,
				hasAuth,
			});
		} catch (lerr) {
			console.warn(
				"DEBUG: no se pudo loggear payload de actualización de pago",
				lerr
			);
		}

		const normalizarEstado = (valor) =>
			typeof valor === "string" ? valor.trim().toLowerCase() : null;
		const estadoPagoSolicitado = normalizarEstado(estadoPago);
		const estadoReservaSolicitado = normalizarEstado(estadoReservaRaw);
		const normalizarTipoPago = (valor) => {
			if (typeof valor !== "string") {
				return null;
			}
			const normalizado = valor.trim().toLowerCase();
			return ["abono", "saldo", "total"].includes(normalizado)
				? normalizado
				: null;
		};
		const limpiarTipoPago =
			_tipoPago === null ||
			(typeof _tipoPago === "string" && _tipoPago.trim().length === 0);
		const tipoPagoSolicitado = normalizarTipoPago(_tipoPago);
		const estadosReservaPermitidos = [
			"pendiente",
			"pendiente_detalles",
			"confirmada",
			"cancelada",
			"completada",
		];
		const estadoReservaValido = estadosReservaPermitidos.includes(
			estadoReservaSolicitado
		)
			? estadoReservaSolicitado
			: null;
		const deseaCompletada = estadoReservaSolicitado === "completada";

		const reserva = await Reserva.findByPk(id, { transaction });
		if (!reserva) {
			await transaction.rollback();
			return res.status(404).json({ error: "Reserva no encontrada" });
		}
		let nuevoTipoPago = reserva.tipoPago || null;
		if (limpiarTipoPago) {
			nuevoTipoPago = null;
		} else if (tipoPagoSolicitado) {
			nuevoTipoPago = tipoPagoSolicitado;
		}

		const totalReserva = parseFloat(reserva.totalConDescuento || 0) || 0;
		const abonoSugerido = parseFloat(reserva.abonoSugerido || 0) || 0;
		const saldoPendienteActual =
			parseFloat(
				reserva.saldoPendiente != null
					? reserva.saldoPendiente
					: Math.max(totalReserva - abonoSugerido, 0)
			) || 0;
		const montoPago =
			montoPagado !== undefined && montoPagado !== null
				? parsePositiveDecimal(montoPagado, "montoPagado", 0)
				: null;

		// monto ya pagado previamente (si existe) y nuevo acumulado
		const pagoPrevio = parseFloat(reserva.pagoMonto || 0) || 0;
		let pagoTotalNuevo = pagoPrevio;
		let debeActualizarPagoMonto = false;
		let pagoFechaFinal = reserva.pagoFecha || null;

		let nuevoEstadoPago = estadoPagoSolicitado || reserva.estadoPago;
		let nuevoEstadoReserva = estadoReservaValido || reserva.estado;
		let nuevoSaldoPendiente = saldoPendienteActual;
		let abonoPagado = Boolean(reserva.abonoPagado);
		let saldoPagado = Boolean(reserva.saldoPagado);
		const fechaPago = new Date();

		// Umbral de confirmacion: 40% del total (o el abono sugerido, si es mayor)
		const umbralAbono = Math.max(totalReserva * 0.4, abonoSugerido || 0);

		const seRegistraPago = montoPago !== null && montoPago > 0;

		if (seRegistraPago) {
			pagoTotalNuevo = pagoPrevio + montoPago;
			// Recalcular saldo en base al nuevo acumulado
			nuevoSaldoPendiente = Math.max(totalReserva - pagoTotalNuevo, 0);
			debeActualizarPagoMonto = true;
			pagoFechaFinal = fechaPago;

			// Evaluar estados segun acumulado
			if (pagoTotalNuevo >= totalReserva && totalReserva > 0) {
				// Pago completo
				nuevoEstadoPago = "pagado";
				// Permitir establecer explícitamente "confirmada" incluso si previamente era "completada"
				if (estadoReservaSolicitado === "confirmada") {
					nuevoEstadoReserva = "confirmada";
				} else {
					nuevoEstadoReserva =
						deseaCompletada || reserva.estado === "completada"
							? "completada"
							: "confirmada";
				}
				nuevoSaldoPendiente = 0;
				abonoPagado = true;
				saldoPagado = true;
				if (!tipoPagoSolicitado) {
					nuevoTipoPago = "total";
				}
			} else if (pagoTotalNuevo > 0) {
				// Pago parcial
				if (
					pagoTotalNuevo >= umbralAbono &&
					["pendiente", "pendiente_detalles"].includes(nuevoEstadoReserva)
				) {
					nuevoEstadoReserva = "confirmada";
				}
				nuevoEstadoPago = "parcial"; // ahora soportado por ENUM y migracion
				if (pagoTotalNuevo >= umbralAbono) {
					abonoPagado = true;
					if (!tipoPagoSolicitado) {
						nuevoTipoPago = "abono";
					}
				}
			}

			// Si se especifico explicitamente tipoPago 'saldo' y saldo queda 0 por el acumulado, asegurar flags
			if (
				nuevoSaldoPendiente <= 0 &&
				pagoTotalNuevo >= totalReserva &&
				totalReserva > 0
			) {
				saldoPagado = true;
				abonoPagado = true;
				nuevoEstadoPago = "pagado";
				nuevoEstadoReserva =
					deseaCompletada || reserva.estado === "completada"
						? "completada"
						: "confirmada";
				nuevoSaldoPendiente = 0;
			}

			// Si se solicito explicitamente marcar como completada y el pago quedo pagado,
			// aseguramos que el estado final respete esa eleccion incluso con total 0.
			if (deseaCompletada && nuevoEstadoPago === "pagado") {
				nuevoEstadoReserva = "completada";
			}
		}

		if (estadoPagoSolicitado) {
			switch (estadoPagoSolicitado) {
				case "reembolsado": {
					nuevoEstadoPago = "reembolsado";
					nuevoEstadoReserva = "cancelada";
					nuevoSaldoPendiente = 0;
					abonoPagado = false;
					saldoPagado = false;
					pagoTotalNuevo = 0;
					debeActualizarPagoMonto = true;
					pagoFechaFinal = null;
					nuevoTipoPago = null;
					break;
				}
				case "fallido": {
					nuevoEstadoPago = "fallido";
					nuevoEstadoReserva =
						estadoReservaValido ||
						(["completada", "cancelada"].includes(reserva.estado)
							? "cancelada"
							: reserva.estado === "pendiente_detalles"
							? "pendiente_detalles"
							: "pendiente");
					nuevoSaldoPendiente = totalReserva;
					abonoPagado = false;
					saldoPagado = false;
					pagoTotalNuevo = 0;
					debeActualizarPagoMonto = true;
					pagoFechaFinal = null;
					nuevoTipoPago = null;
					break;
				}
				case "pendiente": {
					nuevoEstadoPago = "pendiente";
					nuevoEstadoReserva =
						estadoReservaValido ||
						(reserva.estado === "pendiente_detalles"
							? "pendiente_detalles"
							: "pendiente");
					nuevoSaldoPendiente = totalReserva;
					abonoPagado = false;
					saldoPagado = false;
					pagoTotalNuevo = 0;
					debeActualizarPagoMonto = true;
					pagoFechaFinal = null;
					nuevoTipoPago = null;
					break;
				}
				case "pagado": {
					nuevoEstadoPago = "pagado";
					abonoPagado = true;
					saldoPagado = true;
					if (totalReserva > 0 && pagoTotalNuevo < totalReserva) {
						pagoTotalNuevo = totalReserva;
						debeActualizarPagoMonto = true;
					}
					nuevoSaldoPendiente = Math.max(totalReserva - pagoTotalNuevo, 0);
					if (
						deseaCompletada ||
						estadoReservaValido === "completada" ||
						reserva.estado === "completada"
					) {
						nuevoEstadoReserva = "completada";
					} else if (
						["pendiente", "pendiente_detalles"].includes(nuevoEstadoReserva)
					) {
						nuevoEstadoReserva = "confirmada";
					}
					if (!pagoFechaFinal) {
						pagoFechaFinal = fechaPago;
					}
					if (!tipoPagoSolicitado) {
						nuevoTipoPago = "total";
					}
					break;
				}
				case "parcial":
				case "aprobado": {
					nuevoEstadoPago = estadoPagoSolicitado;
					nuevoSaldoPendiente = Math.max(totalReserva - pagoTotalNuevo, 0);
					if (
						estadoPagoSolicitado === "parcial" &&
						["pendiente", "pendiente_detalles"].includes(nuevoEstadoReserva) &&
						(pagoTotalNuevo >= umbralAbono || reserva.abonoPagado)
					) {
						nuevoEstadoReserva = "confirmada";
					}
					if (estadoPagoSolicitado === "parcial" && pagoTotalNuevo <= 0) {
						abonoPagado = false;
						saldoPagado = false;
						if (!tipoPagoSolicitado) {
							nuevoTipoPago = null;
						}
					} else if (
						estadoPagoSolicitado === "parcial" &&
						!tipoPagoSolicitado &&
						pagoTotalNuevo >= umbralAbono
					) {
						nuevoTipoPago = "abono";
					}
					break;
				}
				default:
					break;
			}
		}

		// Evitar valores negativos por ajustes manuales
		if (nuevoSaldoPendiente < 0) {
			nuevoSaldoPendiente = 0;
		}
		if (pagoTotalNuevo < 0) {
			pagoTotalNuevo = 0;
		}

		const payloadActualizacion = {
			estadoPago: nuevoEstadoPago,
			metodoPago: metodoPago || reserva.metodoPago,
			referenciaPago: referenciaPago || reserva.referenciaPago,
			tipoPago: nuevoTipoPago,
			saldoPendiente: nuevoSaldoPendiente,
			abonoPagado,
			saldoPagado,
			estado: nuevoEstadoReserva,
		};

		if (debeActualizarPagoMonto) {
			payloadActualizacion.pagoMonto = pagoTotalNuevo;
			payloadActualizacion.pagoFecha = pagoFechaFinal;
		} else if (saldoPagado && !reserva.saldoPagado) {
			payloadActualizacion.pagoFecha = pagoFechaFinal || fechaPago;
		}

		await reserva.update(payloadActualizacion, { transaction });

		let clienteActualizado = null;
		if (reserva.clienteId) {
			clienteActualizado = await actualizarResumenCliente(
				reserva.clienteId,
				transaction
			);
		}

		await transaction.commit();

		const reservaActualizada = await Reserva.findByPk(id, {
			include: [
				{
					model: Cliente,
					as: "cliente",
					attributes: [
						"id",
						"nombre",
						"email",
						"telefono",
						"esCliente",
						"clasificacion",
						"totalReservas",
					],
				},
			],
		});

		res.json({
			success: true,
			message: "Estado de pago actualizado",
			reserva: reservaActualizada,
			cliente: clienteActualizado,
		});
	} catch (error) {
		await transaction.rollback();
		console.error("Error actualizando estado de pago:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// --- ENDPOINTS DE DASHBOARD Y ASIGNACIONES ---

// Obtener estadísticas para el dashboard
app.get("/api/dashboard/stats", async (req, res) => {
	try {
        // Consultas paralelas para mayor eficiencia
		const [
            totalReservas, 
            reservasPendientes, 
            reservasConfirmadas, 
            reservasPagadas,
            ingresosResult
        ] = await Promise.all([
            Reserva.count(),
            Reserva.count({ where: { estado: ['pendiente', 'pendiente_detalles'] } }),
            Reserva.count({ where: { estado: 'confirmada' } }),
            Reserva.count({ where: { estadoPago: 'pagado' } }),
            Reserva.sum('totalConDescuento', { where: { estadoPago: 'pagado' } })
        ]);

		res.json({
			totalReservas,
			reservasPendientes,
			reservasConfirmadas,
			reservasPagadas,
			totalIngresos: ingresosResult || 0,
		});
	} catch (error) {
		console.error("Error obteniendo estadísticas:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener historial de asignaciones de una reserva
app.get("/api/reservas/:id/asignaciones", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		
        // Verificar que la reserva existe
        const reserva = await Reserva.findByPk(id);
        if (!reserva) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }

        // Obtener historial ordenado por fecha descendente
		const historial = await sequelize.query(
			"SELECT * FROM reserva_asignaciones WHERE reserva_id = :id ORDER BY created_at DESC",
			{ 
                replacements: { id },
                type: sequelize.QueryTypes.SELECT 
            }
		);

		res.json({
            success: true, 
            historial: historial || [] 
        });
	} catch (error) {
		console.error("Error obteniendo historial de asignaciones:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Asignar vehículo y conductor a una reserva
app.put("/api/reservas/:id/asignar", authAdmin, async (req, res) => {
    const transaction = await sequelize.transaction();
	try {
		const { id } = req.params;
		const { vehiculoId, conductorId, sendEmail, sendEmailDriver } = req.body;

        console.log(`📝 Asignando recursos a reserva ${id}: Vehiculo=${vehiculoId}, Conductor=${conductorId}`);

		const reserva = await Reserva.findByPk(id, { transaction });
		if (!reserva) {
            await transaction.rollback();
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

        // Obtener datos del vehículo
        const vehiculo = await Vehiculo.findByPk(vehiculoId, { transaction });
        if (!vehiculo) {
            await transaction.rollback();
            return res.status(400).json({ error: "Vehículo no encontrado" });
        }

        // Obtener datos del conductor (si se proporciona)
        let conductor = null;
        if (conductorId) {
            conductor = await Conductor.findByPk(conductorId, { transaction });
            if (!conductor) {
                await transaction.rollback();
                return res.status(400).json({ error: "Conductor no encontrado" });
            }
        }

        // Construir string de vehículo (formato: "TIPO (patente PATENTE)")
        const vehiculoStr = `${vehiculo.tipo} (patente ${vehiculo.patente})`.trim();
        
        // Actualizar observaciones con el conductor
        let nuevasObservaciones = reserva.observaciones || "";
        // Eliminar asignación anterior de conductor si existe en observaciones
        nuevasObservaciones = nuevasObservaciones.replace(/Conductor asignado:.*(\r\n|\n|\r)?/g, "").trim();
        
        if (conductor) {
            if (nuevasObservaciones) nuevasObservaciones += "\n";
            nuevasObservaciones += `Conductor asignado: ${conductor.nombre}`;
        }

        // Actualizar reserva con IDs para que AdminGastos pueda acceder a ellos
        await reserva.update({
            vehiculo: vehiculoStr,
            vehiculoId: vehiculoId,
            conductorId: conductorId || null,
            observaciones: nuevasObservaciones
        }, { transaction });

        // Registrar en historial
        await sequelize.query(
            `INSERT INTO reserva_asignaciones (reserva_id, vehiculo, conductor, created_at) 
             VALUES (:reservaId, :vehiculo, :conductor, NOW())`,
            {
                replacements: {
                    reservaId: id,
                    vehiculo: vehiculoStr,
                    conductor: conductor ? conductor.nombre : null
                },
                transaction
            }
        );

        await transaction.commit();

        // Enviar notificación por correo al cliente si se solicitó
        if (sendEmail) {
            try {
                // Preparar datos para el correo usando el script específico de asignación
                // Asumimos que el script está en la raíz pública o accesible vía URL
                const phpUrl = process.env.PHP_ASSIGNMENT_EMAIL_URL || "https://www.transportesaraucaria.cl/enviar_asignacion_reserva.php";
                
                // Extraer patente (últimos 4 caracteres) y tipo para el formato del correo
                const last4Patente = vehiculo.patente ? vehiculo.patente.slice(-4) : "";
                
                // Payload específico para enviar_asignacion_reserva.php
                const emailPayload = {
                    email: reserva.email,
                    nombre: reserva.nombre,
                    codigoReserva: reserva.codigoReserva,
                    vehiculo: vehiculoStr, // String completo para fallback
                    vehiculoTipo: vehiculo.tipo,
                    vehiculoPatenteLast4: last4Patente,
                    origen: reserva.origen,
                    destino: reserva.destino,
                    fecha: reserva.fecha,
                    hora: reserva.hora,
                    pasajeros: reserva.pasajeros,
                    conductorNombre: conductor ? conductor.nombre : "",
                    estadoPago: reserva.estadoPago || "pendiente" // CRÍTICO: El script PHP valida esto
                };

                await axios.post(phpUrl, emailPayload, {
                    headers: { "Content-Type": "application/json" },
                    timeout: 10000
                });
                
                console.log(`📧 Notificación de asignación enviada al cliente para reserva ${reserva.codigoReserva}`);
            } catch (emailError) {
                console.error("❌ Error enviando notificación al cliente:", emailError.message);
                // No fallamos la request si el email falla
            }
        }

        // Enviar notificación al conductor si tiene email y el flag está activado
        if (sendEmailDriver && conductor && conductor.email) {
            try {
                const phpConductorUrl = process.env.PHP_DRIVER_EMAIL_URL || "https://www.transportesaraucaria.cl/enviar_notificacion_conductor.php";
                
                const conductorPayload = {
                    conductorEmail: conductor.email,
                    conductorNombre: conductor.nombre,
                    codigoReserva: reserva.codigoReserva,
                    pasajeroNombre: reserva.nombre,
                    pasajeroTelefono: reserva.telefono,
                    origen: reserva.origen,
                    destino: reserva.destino,
                    direccionRecogida: reserva.direccionOrigen || reserva.origen,
                    fecha: reserva.fecha,
                    hora: reserva.hora,
                    pasajeros: reserva.pasajeros,
                    vehiculo: vehiculoStr,
                    observaciones: reserva.observaciones || "",
                    numeroVuelo: reserva.numeroVuelo || "",
                    hotel: reserva.hotel || ""
                };

                await axios.post(phpConductorUrl, conductorPayload, {
                    headers: { "Content-Type": "application/json" },
                    timeout: 10000
                });

                console.log(`📧 Notificación enviada al conductor ${conductor.nombre} (${conductor.email}) para reserva ${reserva.codigoReserva}`);
            } catch (conductorEmailError) {
                console.error("❌ Error enviando notificación al conductor:", conductorEmailError.message);
                // No fallamos la request si el email al conductor falla
            }
        }

		res.json({
			success: true,
			message: "Asignación realizada correctamente",
            reserva
		});
	} catch (error) {
        if (transaction) await transaction.rollback();
		console.error("Error asignando recursos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Asegurar tabla de historial de pagos y exponer endpoints para historial y registro manual
const ensureReservaPagosTable = async () => {
	await sequelize.query(`
		CREATE TABLE IF NOT EXISTS reserva_pagos (
			id INT AUTO_INCREMENT PRIMARY KEY,
			reserva_id INT NOT NULL,
			amount DECIMAL(10,2) NOT NULL,
			metodo VARCHAR(100) NULL,
			referencia VARCHAR(255) NULL,
			source VARCHAR(50) DEFAULT 'manual',
			is_manual TINYINT(1) DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			INDEX idx_reserva_pagos_reserva_id (reserva_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`);
};

// Endpoint: obtener historial de pagos de una reserva
app.get("/api/reservas/:id/pagos", async (req, res) => {
	try {
		const { id } = req.params;
		await ensureReservaPagosTable();
		const [rows] = await sequelize.query(
			"SELECT id, reserva_id AS reservaId, amount, metodo, referencia, source, is_manual AS isManual, created_at AS createdAt FROM reserva_pagos WHERE reserva_id = :id ORDER BY created_at DESC",
			{ replacements: { id } }
		);
		res.json({ success: true, pagos: rows });
	} catch (error) {
		console.error("Error obteniendo historial de pagos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint: registrar pago manual para una reserva (inserta en historial y actualiza reserva)
app.post("/api/reservas/:id/pagos", async (req, res) => {
	const transaction = await sequelize.transaction();
	try {
		const { id } = req.params;
		const { amount, metodo, referencia, source } = req.body;
		// Log de depuración: registrar intento de pago manual
		try {
			const hasAuth = !!req.headers.authorization;
			console.log(`DEBUG [POST /api/reservas/${id}/pagos] payload:`, {
				id,
				amount,
				metodo,
				referencia,
				source,
				hasAuth,
			});
		} catch (lerr) {
			console.warn("DEBUG: no se pudo loggear payload de pago manual", lerr);
		}

		const monto = parseFloat(amount || 0) || 0;
		if (monto <= 0) {
			await transaction.rollback();
			return res.status(400).json({ error: "Monto inválido" });
		}

		const reserva = await Reserva.findByPk(id, { transaction });
		if (!reserva) {
			await transaction.rollback();
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		await ensureReservaPagosTable();

		// Insertar registro en historial
		const insertSql = `
			INSERT INTO reserva_pagos (reserva_id, amount, metodo, referencia, source, is_manual)
			VALUES (:reservaId, :amount, :metodo, :referencia, :source, :isManual)
		`;
		await sequelize.query(insertSql, {
			replacements: {
				reservaId: id,
				amount: monto,
				metodo: metodo || null,
				referencia: referencia || null,
				source: source || "manual",
				isManual: source === "web" ? 0 : 1,
			},
			transaction,
		});

		// Reutilizar lógica de acumulado similar a /pago: actualizar reserva con el monto
		const totalReserva = parseFloat(reserva.totalConDescuento || 0);
		const abonoSugerido = parseFloat(reserva.abonoSugerido || 0);
		const pagoPrevio = parseFloat(reserva.pagoMonto || 0) || 0;
		const pagoTotalNuevo = pagoPrevio + monto;
		const umbralAbono = Math.max(totalReserva * 0.4, abonoSugerido || 0);

		let nuevoEstadoPago = reserva.estadoPago;
		let nuevoEstadoReserva = reserva.estado;
		let nuevoSaldoPendiente = Math.max(totalReserva - pagoTotalNuevo, 0);
		let abonoPagado = reserva.abonoPagado;
		let saldoPagado = reserva.saldoPagado;

		if (pagoTotalNuevo >= totalReserva && totalReserva > 0) {
			nuevoEstadoPago = "pagado";
			nuevoEstadoReserva = "completada";
			nuevoSaldoPendiente = 0;
			abonoPagado = true;
			saldoPagado = true;
		} else if (pagoTotalNuevo > 0) {
			if (
				pagoTotalNuevo >= umbralAbono &&
				["pendiente", "pendiente_detalles"].includes(nuevoEstadoReserva)
			) {
				nuevoEstadoReserva = "confirmada";
			}
			nuevoEstadoPago = "parcial";
			if (pagoTotalNuevo >= umbralAbono) abonoPagado = true;
		}

		if (
			nuevoSaldoPendiente <= 0 &&
			pagoTotalNuevo >= totalReserva &&
			totalReserva > 0
		) {
			saldoPagado = true;
			abonoPagado = true;
			nuevoEstadoPago = "pagado";
			nuevoEstadoReserva = "completada";
		}

		const updatePayload = {
			estadoPago: nuevoEstadoPago,
			saldoPendiente: nuevoSaldoPendiente,
			abonoPagado,
			saldoPagado,
			estado: nuevoEstadoReserva,
			pagoMonto: pagoTotalNuevo,
			pagoFecha: new Date(),
		};

		await reserva.update(updatePayload, { transaction });

		let clienteActualizado = null;
		if (reserva.clienteId) {
			clienteActualizado = await actualizarResumenCliente(
				reserva.clienteId,
				transaction
			);
		}

		await transaction.commit();

		// Devolver reserva actualizada y el pago insertado
		const [rows] = await sequelize.query(
			"SELECT id, reserva_id AS reservaId, amount, metodo, referencia, source, is_manual AS isManual, created_at AS createdAt FROM reserva_pagos WHERE reserva_id = :id ORDER BY created_at DESC LIMIT 1",
			{ replacements: { id } }
		);
		const pagoInsertado = rows[0] || null;

		const reservaActualizada = await Reserva.findByPk(id, {
			include: [
				{
					model: Cliente,
					as: "cliente",
					attributes: [
						"id",
						"nombre",
						"email",
						"telefono",
						"esCliente",
						"clasificacion",
						"totalReservas",
					],
				},
			],
		});

		res.json({
			success: true,
			reserva: reservaActualizada,
			pago: pagoInsertado,
			cliente: clienteActualizado,
		});
	} catch (error) {
		await transaction.rollback();
		console.error("Error registrando pago manual:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar campos generales de una reserva (admin)
app.put("/api/reservas/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		const {
			nombre,
			email,
			telefono,
			fecha,
			hora,
			pasajeros,
			numeroVuelo,
			hotel,
			equipajeEspecial,
			sillaInfantil,
			idaVuelta,
			fechaRegreso,
			horaRegreso,
			mensaje,
			direccionOrigen,
			direccionDestino,
		} = req.body || {};

		await reserva.update({
			nombre: nombre !== undefined ? nombre : reserva.nombre,
			email: email !== undefined ? email : reserva.email,
			telefono: telefono !== undefined ? telefono : reserva.telefono,
			fecha: fecha !== undefined ? fecha : reserva.fecha,
			hora: hora !== undefined ? hora : reserva.hora,
			direccionOrigen:
				direccionOrigen !== undefined ? direccionOrigen : reserva.direccionOrigen,
			direccionDestino:
				direccionDestino !== undefined ? direccionDestino : reserva.direccionDestino,
			pasajeros:
				pasajeros !== undefined ? parseInt(pasajeros, 10) : reserva.pasajeros,
			numeroVuelo:
				numeroVuelo !== undefined ? numeroVuelo : reserva.numeroVuelo,
			hotel: hotel !== undefined ? hotel : reserva.hotel,
			equipajeEspecial:
				equipajeEspecial !== undefined
					? equipajeEspecial
					: reserva.equipajeEspecial,
			sillaInfantil:
				sillaInfantil !== undefined
					? Boolean(sillaInfantil)
					: reserva.sillaInfantil,
			idaVuelta:
				idaVuelta !== undefined ? Boolean(idaVuelta) : reserva.idaVuelta,
			fechaRegreso:
				fechaRegreso !== undefined ? fechaRegreso : reserva.fechaRegreso,
			horaRegreso:
				horaRegreso !== undefined ? horaRegreso : reserva.horaRegreso,
			mensaje: mensaje !== undefined ? mensaje : reserva.mensaje,
		});

		res.json({ success: true, message: "Reserva actualizada", reserva });
	} catch (error) {
		console.error("Error actualizando reserva:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar ruta (origen/destino) de una reserva
app.put("/api/reservas/:id/ruta", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const { origen, destino } = req.body || {};
		if (!origen || !destino) {
			return res.status(400).json({ error: "Origen y Destino son requeridos" });
		}
		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}
		await reserva.update({ origen, destino });

		// DEBUG accidental eliminado: no corresponde a este endpoint
		res.json({ success: true, message: "Ruta actualizada", reserva });
	} catch (error) {
		console.error("Error actualizando ruta de reserva:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// NOTA: Endpoint de asignación movido a línea 4068 (versión con transacciones y emails completos)

// Obtener historial de asignaciones de una reserva (uso interno)
app.get("/api/reservas/:id/asignaciones", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const [rows] = await sequelize.query(
			`SELECT id, vehiculo, conductor, created_at FROM reserva_asignaciones WHERE reserva_id = :id ORDER BY id DESC`,
			{ replacements: { id } }
		);
		res.json({ historial: rows || [] });
	} catch (error) {
		console.error("Error obteniendo historial de asignaciones:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// --- ENDPOINTS PARA GESTIONAR CLIENTES ---

// Buscar cliente por email, RUT o nombre (autocompletado)
app.get("/api/clientes/buscar", async (req, res) => {
	try {
		const { query } = req.query;

		if (!query || query.length < 2) {
			return res.json({ clientes: [] });
		}

		const clientes = await Cliente.findAll({
			where: {
				[Op.or]: [
					{ email: { [Op.like]: `%${query}%` } },
					{ nombre: { [Op.like]: `%${query}%` } },
					{ rut: { [Op.like]: `%${query}%` } },
					{ telefono: { [Op.like]: `%${query}%` } },
				],
			},
			limit: 10,
			order: [["ultimaReserva", "DESC"]],
		});

		res.json({ clientes });
	} catch (error) {
		console.error("Error buscando clientes:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener historial completo de un cliente
app.get("/api/clientes/:id/historial", async (req, res) => {
	try {
		const { id } = req.params;

		const cliente = await Cliente.findByPk(id);
		if (!cliente) {
			return res.status(404).json({ error: "Cliente no encontrado" });
		}

		// Obtener todas las reservas del cliente
		const reservas = await Reserva.findAll({
			where: { clienteId: id },
			order: [["created_at", "DESC"]],
		});

		// Calcular estadísticas
		const estadisticas = {
			totalReservas: reservas.length,
			totalPagadas: reservas.filter((r) => r.estadoPago === "pagado").length,
			totalPendientes: reservas.filter((r) => r.estadoPago === "pendiente")
				.length,
			totalGastado: reservas
				.filter((r) => r.estadoPago === "pagado")
				.reduce((sum, r) => sum + parseFloat(r.totalConDescuento || 0), 0),
			ultimaReserva: reservas[0]?.created_at || null,
			primeraReserva: reservas[reservas.length - 1]?.created_at || null,
		};

		res.json({
			cliente,
			reservas,
			estadisticas,
		});
	} catch (error) {
		console.error("Error obteniendo historial del cliente:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Marcar/desmarcar cliente manualmente
app.put("/api/clientes/:id/marcar-cliente", async (req, res) => {
	try {
		const { id } = req.params;
		const { esCliente, marcadoManualmente, notas } = req.body;

		const cliente = await Cliente.findByPk(id);
		if (!cliente) {
			return res.status(404).json({ error: "Cliente no encontrado" });
		}

		await cliente.update({
			esCliente: esCliente !== undefined ? esCliente : cliente.esCliente,
			marcadoManualmente:
				marcadoManualmente !== undefined
					? marcadoManualmente
					: cliente.marcadoManualmente,
			notas: notas !== undefined ? notas : cliente.notas,
		});

		res.json({
			success: true,
			message: "Cliente actualizado",
			cliente,
		});
	} catch (error) {
		console.error("Error actualizando cliente:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Crear o actualizar cliente (desde formulario de reserva)
app.post("/api/clientes/crear-o-actualizar", async (req, res) => {
	try {
		const { rut, nombre, email, telefono, notas } = req.body;

		if (!nombre || !email || !telefono) {
			return res.status(400).json({
				error: "Nombre, email y teléfono son obligatorios",
			});
		}

		// Formatear RUT si se proporciona
		const rutFormateado = rut ? formatearRUT(rut) : null;

		// Buscar cliente existente por email o RUT
		let cliente = null;
		if (rutFormateado) {
			cliente = await Cliente.findOne({ where: { rut: rutFormateado } });
		}
		if (!cliente) {
			cliente = await Cliente.findOne({ where: { email } });
		}

		if (cliente) {
			// Actualizar datos opcionales sin sobrescribir histórico
			const updateData = {};
			if (rutFormateado && rutFormateado !== cliente.rut) {
				updateData.rut = rutFormateado;
			}
			if (telefono && telefono !== cliente.telefono) {
				updateData.telefono = telefono;
			}
			if (nombre && nombre !== cliente.nombre) {
				updateData.nombre = nombre;
			}
			if (notas) {
				updateData.notas = notas;
			}

			if (Object.keys(updateData).length > 0) {
				await cliente.update(updateData);
			}
		} else {
			// Crear nuevo cliente
			cliente = await Cliente.create({
				rut: rutFormateado,
				nombre,
				email,
				telefono,
				notas: notas || null,
				totalReservas: 0,
				totalPagos: 0,
				esCliente: false,
			});
		}

		res.json({
			success: true,
			cliente,
			created: !cliente,
		});
	} catch (error) {
		console.error("Error creando/actualizando cliente:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// ==================== RUTAS DE VEHÍCULOS ====================

// Listar todos los vehículos
app.get("/api/vehiculos", async (req, res) => {
	try {
		const { estado, tipo } = req.query;
		const where = {};

		if (estado) {
			where.estado = estado;
		}
		if (tipo) {
			where.tipo = tipo;
		}

		const vehiculos = await Vehiculo.findAll({
			where,
			order: [["patente", "ASC"]],
		});

		res.json({ vehiculos });
	} catch (error) {
		console.error("Error obteniendo vehículos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// ==================== RUTAS DE DESTINOS (ADMIN) ====================
// Listar destinos (opcionalmente solo activos)
app.get("/api/destinos", async (req, res) => {
	try {
		const { activos } = req.query;
		const where = {};
		if (activos === "true") where.activo = true;
		if (activos === "false") where.activo = false;
		const destinos = await Destino.findAll({
			where,
			order: [
				["orden", "ASC"],
				["nombre", "ASC"],
			],
		});
		res.json({ destinos });
	} catch (error) {
		console.error("Error obteniendo destinos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Crear destino rápido (sin activarlo por defecto)
app.post("/api/destinos", authAdmin, async (req, res) => {
	try {
		const {
			nombre,
			precioIda = 0,
			precioVuelta = 0,
			precioIdaVuelta = 0,
			descripcion = "",
		} = req.body || {};
		if (!nombre || !nombre.trim()) {
			return res.status(400).json({ error: "Nombre de destino es requerido" });
		}
		const existing = await Destino.findOne({
			where: { nombre: nombre.trim() },
		});
		if (existing) {
			return res.json({ success: true, destino: existing, existed: true });
		}
		const destino = await Destino.create({
			nombre: nombre.trim(),
			precioIda: Number(precioIda) || 0,
			precioVuelta: Number(precioVuelta) || 0,
			precioIdaVuelta: Number(precioIdaVuelta) || 0,
			activo: false,
			descripcion,
			tiempo: "",
			imagen: "",
			maxPasajeros: 4,
			minHorasAnticipacion: 5,
			orden: 9999,
		});
		res.status(201).json({ success: true, destino, existed: false });
	} catch (error) {
		console.error("Error creando destino:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar destino (activar, precios, nombre, etc.)
app.put("/api/destinos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const destino = await Destino.findByPk(id);
		if (!destino) {
			return res.status(404).json({ error: "Destino no encontrado" });
		}
		const {
			nombre,
			precioIda,
			precioVuelta,
			precioIdaVuelta,
			activo,
			descripcion,
			tiempo,
			imagen,
			maxPasajeros,
			minHorasAnticipacion,
			orden,
			duracionIdaMinutos,
			duracionVueltaMinutos,
		} = req.body || {};

		await destino.update({
			nombre: nombre !== undefined ? nombre : destino.nombre,
			precioIda:
				precioIda !== undefined ? Number(precioIda) : destino.precioIda,
			precioVuelta:
				precioVuelta !== undefined
					? Number(precioVuelta)
					: destino.precioVuelta,
			precioIdaVuelta:
				precioIdaVuelta !== undefined
					? Number(precioIdaVuelta)
					: destino.precioIdaVuelta,
			activo: activo !== undefined ? Boolean(activo) : destino.activo,
			descripcion:
				descripcion !== undefined ? descripcion : destino.descripcion,
			tiempo: tiempo !== undefined ? tiempo : destino.tiempo,
			imagen: imagen !== undefined ? imagen : destino.imagen,
			maxPasajeros:
				maxPasajeros !== undefined
					? Number(maxPasajeros)
					: destino.maxPasajeros,
			minHorasAnticipacion:
				minHorasAnticipacion !== undefined
					? Number(minHorasAnticipacion)
					: destino.minHorasAnticipacion,
			orden: orden !== undefined ? Number(orden) : destino.orden,
			duracionIdaMinutos:
				duracionIdaMinutos !== undefined
					? Number(duracionIdaMinutos)
					: destino.duracionIdaMinutos,
			duracionVueltaMinutos:
				duracionVueltaMinutos !== undefined
					? Number(duracionVueltaMinutos)
					: destino.duracionVueltaMinutos,
		});

		res.json({ success: true, destino });
	} catch (error) {
		console.error("Error actualizando destino:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener un vehículo por ID
app.get("/api/vehiculos/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const vehiculo = await Vehiculo.findByPk(id);

		if (!vehiculo) {
			return res.status(404).json({ error: "Vehículo no encontrado" });
		}

		res.json({ vehiculo });
	} catch (error) {
		console.error("Error obteniendo vehículo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Crear un nuevo vehículo
app.post("/api/vehiculos", authAdmin, async (req, res) => {
	try {
		const {
			patente,
			tipo,
			marca,
			modelo,
			anio,
			capacidad,
			estado,
			observaciones,
		} = req.body;

		if (!patente || !tipo) {
			return res.status(400).json({
				error: "Patente y tipo son obligatorios",
			});
		}

		// Normalizar patente: convertir a mayúsculas y trim para evitar duplicados por casing
		const patenteNorm = patente?.trim().toUpperCase();

		// Normalizar año: convertir cadena vacía a null para respetar allowNull
		const anioNorm =
			anio === "" || anio === null || anio === undefined ? null : Number(anio);

		// Normalizar capacidad
		const capacidadNorm =
			capacidad === "" || capacidad === null || capacidad === undefined
				? 4
				: Number(capacidad);

		// Validar año y capacidad
		if (
			(anioNorm !== null &&
				(isNaN(anioNorm) ||
					anioNorm < 1900 ||
					anioNorm > new Date().getFullYear() + 1)) ||
			isNaN(capacidadNorm) ||
			!Number.isInteger(capacidadNorm) ||
			capacidadNorm < 1 ||
			capacidadNorm > 50
		) {
			return res.status(400).json({
				error:
					"Año o capacidad inválidos. Año debe ser un número entre 1900 y el próximo año, capacidad debe ser un entero positivo entre 1 y 50.",
			});
		}
		// Verificar si ya existe un vehículo con esa patente normalizada
		const existente = await Vehiculo.findOne({
			where: { patente: patenteNorm },
		});
		if (existente) {
			return res.status(409).json({
				error: "Ya existe un vehículo con esta patente",
			});
		}

		const vehiculo = await Vehiculo.create({
			patente: patenteNorm,
			tipo,
			marca,
			modelo,
			anio: anioNorm,
			capacidad: capacidadNorm,
			estado: estado || "disponible",
			observaciones,
		});

		res.status(201).json({
			success: true,
			message: "Vehículo creado exitosamente",
			vehiculo,
		});
	} catch (error) {
		console.error("Error creando vehículo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar un vehículo
app.put("/api/vehiculos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const {
			patente,
			tipo,
			marca,
			modelo,
			anio,
			capacidad,
			estado,
			observaciones,
		} = req.body;

		const vehiculo = await Vehiculo.findByPk(id);
		if (!vehiculo) {
			return res.status(404).json({ error: "Vehículo no encontrado" });
		}

		// Normalizar patente si viene
		const patenteNorm = patente
			? patente.trim().toUpperCase()
			: vehiculo.patente;

		// Validar y normalizar año
		let anioNorm;
		if (anio === "") {
			anioNorm = null;
		} else if (anio !== undefined) {
			const anioNum = Number(anio);
			const currentYear = new Date().getFullYear();
			if (isNaN(anioNum) || anioNum < 1900 || anioNum > currentYear + 1) {
				return res.status(400).json({
					error:
						"El año debe ser un número válido entre 1900 y " +
						(currentYear + 1),
				});
			}
			anioNorm = anioNum;
		} else {
			anioNorm = vehiculo.anio;
		}

		// Validar y normalizar capacidad
		let capacidadNorm;
		if (capacidad !== undefined) {
			const capacidadNum = Number(capacidad);
			const MAX_CAPACIDAD = 50; // Si el valor máximo es configurable, reemplazar por la variable correspondiente
			if (isNaN(capacidadNum) || capacidadNum <= 0) {
				return res.status(400).json({
					error: "La capacidad debe ser un número positivo válido",
				});
			}
			if (capacidadNum > MAX_CAPACIDAD) {
				return res.status(400).json({
					error: `La capacidad máxima permitida es ${MAX_CAPACIDAD}`,
				});
			}
			capacidadNorm = capacidadNum;
		} else {
			capacidadNorm = vehiculo.capacidad;
		}

		// Si se está cambiando la patente, verificar que no exista otra con ese valor
		if (patenteNorm !== vehiculo.patente) {
			const existente = await Vehiculo.findOne({
				where: { patente: patenteNorm },
			});
			if (existente) {
				return res.status(409).json({
					error: "Ya existe un vehículo con esta patente",
				});
			}
		}

		await vehiculo.update({
			patente: patenteNorm,
			tipo: tipo || vehiculo.tipo,
			marca: marca !== undefined ? marca : vehiculo.marca,
			modelo: modelo !== undefined ? modelo : vehiculo.modelo,
			anio: anioNorm,
			capacidad: capacidadNorm,
			estado: estado !== undefined ? estado : vehiculo.estado,
			observaciones:
				observaciones !== undefined ? observaciones : vehiculo.observaciones,
		});

		res.json({
			success: true,
			message: "Vehículo actualizado exitosamente",
			vehiculo,
		});
	} catch (error) {
		console.error("Error actualizando vehículo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Eliminar un vehículo
app.delete("/api/vehiculos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const vehiculo = await Vehiculo.findByPk(id);
		if (!vehiculo) {
			return res.status(404).json({ error: "Vehículo no encontrado" });
		}

		await vehiculo.destroy();

		res.json({
			success: true,
			message: "Vehículo eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error eliminando vehículo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// ==================== RUTAS DE CONDUCTORES ====================

// Listar todos los conductores
app.get("/api/conductores", async (req, res) => {
	try {
		const { estado } = req.query;
		const where = {};

		if (estado) {
			where.estado = estado;
		}

		const conductores = await Conductor.findAll({
			where,
			order: [["nombre", "ASC"]],
		});

		res.json({ conductores });
	} catch (error) {
		console.error("Error obteniendo conductores:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener un conductor por ID
app.get("/api/conductores/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const conductor = await Conductor.findByPk(id);

		if (!conductor) {
			return res.status(404).json({ error: "Conductor no encontrado" });
		}

		res.json({ conductor });
	} catch (error) {
		console.error("Error obteniendo conductor:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Crear un nuevo conductor
app.post("/api/conductores", authAdmin, async (req, res) => {
	try {
		const {
			nombre,
			rut,
			telefono,
			email,
			licencia,
			fechaVencimientoLicencia,
			estado,
			observaciones,
		} = req.body;

		if (!nombre || !rut || !telefono) {
			return res.status(400).json({
				error: "Nombre, RUT y teléfono son obligatorios",
			});
		}

		// Validar RUT con dígito verificador
		if (!validarRUT(rut)) {
			return res
				.status(400)
				.json({ error: "RUT inválido. Verifique el dígito verificador." });
		}

		// Formatear RUT
		const rutFormateado = formatearRUT(rut);
		if (!rutFormateado) {
			return res.status(400).json({ error: "RUT inválido" });
		}

		// Normalizar email: cadena vacía a null para respetar validación isEmail
		const emailNorm = email?.trim() === "" || !email ? null : email.trim();

		// Normalizar fecha: cadena vacía a null para evitar fechas inválidas
		const fechaNorm =
			!fechaVencimientoLicencia || fechaVencimientoLicencia === ""
				? null
				: fechaVencimientoLicencia;

		// Verificar si ya existe un conductor con ese RUT
		const existente = await Conductor.findOne({
			where: { rut: rutFormateado },
		});
		if (existente) {
			return res.status(409).json({
				error: "Ya existe un conductor con este RUT",
			});
		}

		const conductor = await Conductor.create({
			nombre,
			rut: rutFormateado,
			telefono,
			email: emailNorm,
			licencia,
			fechaVencimientoLicencia: fechaNorm,
			estado: estado || "disponible",
			observaciones,
		});

		res.status(201).json({
			success: true,
			message: "Conductor creado exitosamente",
			conductor,
		});
	} catch (error) {
		console.error("Error creando conductor:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar un conductor
app.put("/api/conductores/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const {
			nombre,
			rut,
			telefono,
			email,
			licencia,
			fechaVencimientoLicencia,
			estado,
			observaciones,
		} = req.body;

		const conductor = await Conductor.findByPk(id);
		if (!conductor) {
			return res.status(404).json({ error: "Conductor no encontrado" });
		}

		// Si se está cambiando el RUT, validar y formatear
		let rutFormateado = conductor.rut;
		if (rut && rut !== conductor.rut) {
			// Validar RUT con dígito verificador
			if (!validarRUT(rut)) {
				return res
					.status(400)
					.json({ error: "RUT inválido. Verifique el dígito verificador." });
			}

			rutFormateado = formatearRUT(rut);
			if (!rutFormateado) {
				return res.status(400).json({ error: "RUT inválido" });
			}

			const existente = await Conductor.findOne({
				where: { rut: rutFormateado },
			});
			if (existente) {
				return res.status(409).json({
					error: "Ya existe un conductor con este RUT",
				});
			}
		}

		// Normalizar email: aplicar trim y cadena vacía a null
		const emailNorm =
			typeof email === "string" && email.trim() === ""
				? null
				: typeof email === "string"
				? email.trim()
				: email;

		// Normalizar fecha: cadena vacía a null
		const fechaNorm =
			fechaVencimientoLicencia === "" ? null : fechaVencimientoLicencia;

		await conductor.update({
			nombre: nombre || conductor.nombre,
			rut: rutFormateado,
			telefono: telefono || conductor.telefono,
			email: email !== undefined ? emailNorm : conductor.email,
			licencia: licencia !== undefined ? licencia : conductor.licencia,
			fechaVencimientoLicencia:
				fechaVencimientoLicencia !== undefined
					? fechaNorm
					: conductor.fechaVencimientoLicencia,
			estado: estado !== undefined ? estado : conductor.estado,
			observaciones:
				observaciones !== undefined ? observaciones : conductor.observaciones,
		});

		res.json({
			success: true,
			message: "Conductor actualizado exitosamente",
			conductor,
		});
	} catch (error) {
		console.error("Error actualizando conductor:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Eliminar un conductor
app.delete("/api/conductores/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const conductor = await Conductor.findByPk(id);
		if (!conductor) {
			return res.status(404).json({ error: "Conductor no encontrado" });
		}

		await conductor.destroy();

		res.json({
			success: true,
			message: "Conductor eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error eliminando conductor:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// --- ENDPOINTS PARA TARIFA DINÁMICA ---

// Listar todas las configuraciones de tarifa dinámica
app.get("/api/tarifa-dinamica", async (req, res) => {
	try {
		const configuraciones = await ConfiguracionTarifaDinamica.findAll({
			order: [
				["prioridad", "DESC"],
				["tipo", "ASC"],
				["created_at", "DESC"],
			],
		});

		// Normalizar los campos JSON para asegurar que sean arrays
		const configuracionesNormalizadas = configuraciones.map((config) => {
			const configData = config.toJSON();
			return {
				...configData,
				diasSemana: Array.isArray(configData.diasSemana)
					? configData.diasSemana
					: [],
				destinosExcluidos: Array.isArray(configData.destinosExcluidos)
					? configData.destinosExcluidos
					: [],
			};
		});

		res.json(configuracionesNormalizadas);
	} catch (error) {
		console.error(
			"Error obteniendo configuraciones de tarifa dinámica:",
			error
		);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Crear nueva configuración de tarifa dinámica
app.post("/api/tarifa-dinamica", authAdmin, async (req, res) => {
	try {
		const nuevaConfig = await ConfiguracionTarifaDinamica.create(req.body);
		res.status(201).json(nuevaConfig);
	} catch (error) {
		console.error("Error creando configuración de tarifa dinámica:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar configuración de tarifa dinámica
app.put("/api/tarifa-dinamica/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		console.log("📝 Actualizando configuración ID:", id);
		console.log("📝 Datos recibidos:", JSON.stringify(req.body, null, 2));
		console.log(
			"📝 diasSemana recibido:",
			req.body.diasSemana,
			"tipo:",
			typeof req.body.diasSemana
		);

		const config = await ConfiguracionTarifaDinamica.findByPk(id);
		if (!config) {
			return res.status(404).json({ error: "Configuración no encontrada" });
		}

		await config.update(req.body);

		console.log("✅ Configuración actualizada");
		console.log(
			"✅ diasSemana guardado:",
			config.diasSemana,
			"tipo:",
			typeof config.diasSemana
		);

		res.json(config);
	} catch (error) {
		console.error(
			"Error actualizando configuración de tarifa dinámica:",
			error
		);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Eliminar configuración de tarifa dinámica
app.delete("/api/tarifa-dinamica/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const config = await ConfiguracionTarifaDinamica.findByPk(id);
		if (!config) {
			return res.status(404).json({ error: "Configuración no encontrada" });
		}

		await config.destroy();

		res.json({
			success: true,
			message: "Configuración eliminada exitosamente",
		});
	} catch (error) {
		console.error("Error eliminando configuración de tarifa dinámica:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Calcular tarifa dinámica para un viaje específico
app.post("/api/tarifa-dinamica/calcular", async (req, res) => {
	try {
		const { precioBase, destino, fecha, hora } = req.body;

		if (!precioBase || !fecha) {
			return res.status(400).json({
				error: "Se requieren precioBase y fecha",
			});
		}

		// Obtener todas las configuraciones activas ordenadas por prioridad
		const configuraciones = await ConfiguracionTarifaDinamica.findAll({
			where: { activo: true },
			order: [["prioridad", "DESC"]],
		});

		// Calcular ajustes aplicables
		const ajustesAplicados = [];
		let porcentajeTotal = 0;

		// Analizar la fecha como YYYY-MM-DD para evitar problemas de zona horaria
		const [year, month, day] = fecha.split("-");
		const fechaViaje = new Date(
			parseInt(year),
			parseInt(month) - 1,
			parseInt(day)
		);
		const diaSemana = fechaViaje.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado

		console.log("📅 DEBUG Tarifa Dinámica:");
		console.log("  Fecha recibida:", fecha);
		console.log("  Fecha parseada:", fechaViaje);
		console.log(
			"  Día de la semana:",
			diaSemana,
			["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][diaSemana]
		);
		console.log("  Hora:", hora);
		console.log("  Precio base:", precioBase);
		console.log("  Destino:", destino);

		// Calcular los días de anticipación usando solo la fecha (sin hora) para evitar problemas de zona horaria
		const ahora = new Date();
		const hoyInicio = new Date(
			ahora.getFullYear(),
			ahora.getMonth(),
			ahora.getDate()
		);
		const diasAnticipacion = Math.floor(
			(fechaViaje - hoyInicio) / (1000 * 60 * 60 * 24)
		);

		// Verificar si la fecha es festivo
		const fechaStr = fecha; // Usar la cadena de fecha original
		const festivo = await Festivo.findOne({
			where: {
				activo: true,
				[Op.or]: [
					{ fecha: fechaStr },
					{
						recurrente: true,
						[Op.and]: sequelize.where(
							sequelize.fn("DATE_FORMAT", sequelize.col("fecha"), "%m-%d"),
							sequelize.fn("DATE_FORMAT", fechaStr, "%m-%d")
						),
					},
				],
			},
		});

		// Si es festivo y tiene recargo específico, aplicarlo
		if (festivo && festivo.porcentajeRecargo) {
			ajustesAplicados.push({
				nombre: `Festivo: ${festivo.nombre}`,
				tipo: "festivo",
				porcentaje: parseFloat(festivo.porcentajeRecargo),
				detalle: festivo.nombre,
				descripcion:
					festivo.descripcion || `Recargo por festivo: ${festivo.nombre}`,
			});
			porcentajeTotal += parseFloat(festivo.porcentajeRecargo);
		}

		console.log(
			`\n🔍 Evaluando ${configuraciones.length} configuraciones activas...`
		);

		for (const config of configuraciones) {
			console.log(
				`\n  ⚙️  Evaluando: "${config.nombre}" (tipo: ${config.tipo})`
			);

			// Verificar si el destino está excluido
			if (
				config.destinosExcluidos &&
				Array.isArray(config.destinosExcluidos) &&
				config.destinosExcluidos.includes(destino)
			) {
				console.log(`    ❌ Destino excluido: ${destino}`);
				continue;
			}

			let aplica = false;
			let detalle = "";

			switch (config.tipo) {
				case "anticipacion":
					if (
						diasAnticipacion >= config.diasMinimos &&
						(config.diasMaximos === null ||
							diasAnticipacion <= config.diasMaximos)
					) {
						aplica = true;
						detalle = `${config.diasMinimos}${
							config.diasMaximos ? `-${config.diasMaximos}` : "+"
						} días de anticipación`;
					}
					break;

				case "dia_semana":
					console.log(`    📆 Días configurados:`, config.diasSemana);
					console.log(`    📆 Día del viaje: ${diaSemana}`);
					if (
						config.diasSemana &&
						Array.isArray(config.diasSemana) &&
						config.diasSemana.includes(diaSemana)
					) {
						aplica = true;
						const nombresDias = [
							"Domingo",
							"Lunes",
							"Martes",
							"Miércoles",
							"Jueves",
							"Viernes",
							"Sábado",
						];
						detalle = `${nombresDias[diaSemana]}`;
						console.log(`    ✅ APLICA - Día ${detalle}`);
					} else {
						console.log(`    ❌ NO APLICA - Día no incluido`);
					}
					break;

				case "horario":
					if (hora && config.horaInicio && config.horaFin) {
						const horaViaje = hora.substring(0, 5);
						const horaInicio = config.horaInicio.substring(0, 5);
						const horaFin = config.horaFin.substring(0, 5);

						// Manejar rangos horarios que cruzan la medianoche (por ejemplo, 22:00 - 06:00)
						let dentroRango = false;
						if (horaInicio <= horaFin) {
							// Rango horario normal (por ejemplo, 08:00 - 20:00)
							dentroRango = horaViaje >= horaInicio && horaViaje <= horaFin;
						} else {
							// Rango que abarca la medianoche (por ejemplo, 22:00 - 06:00)
							dentroRango = horaViaje >= horaInicio || horaViaje <= horaFin;
						}

						if (dentroRango) {
							aplica = true;
							detalle = `Horario ${horaInicio} - ${horaFin}`;
						}
					}
					break;

				case "descuento_retorno":
					// Este tipo requiere lógica adicional de disponibilidad de vehículos
					// Por ahora lo dejamos para implementación futura
					break;
			}

			if (aplica) {
				console.log(`    ✅ Ajuste aplicado: ${config.porcentajeAjuste}%`);
				ajustesAplicados.push({
					nombre: config.nombre,
					tipo: config.tipo,
					porcentaje: parseFloat(config.porcentajeAjuste),
					detalle: detalle,
					descripcion: config.descripcion,
				});
				porcentajeTotal += parseFloat(config.porcentajeAjuste);
			}
		}

		// Calcular montos
		const ajusteMonto = Math.round((precioBase * porcentajeTotal) / 100);
		const precioFinal = Math.max(0, precioBase + ajusteMonto); // Garantiza que el precio final nunca sea menor que cero

		console.log("\n💰 RESULTADO:");
		console.log("  Precio base:", precioBase);
		console.log("  Ajuste total:", porcentajeTotal + "%");
		console.log("  Ajuste monto:", ajusteMonto);
		console.log("  Precio final:", precioFinal);
		console.log("  Ajustes aplicados:", ajustesAplicados.length);

		res.json({
			precioBase: parseFloat(precioBase),
			ajusteTotal: porcentajeTotal,
			ajusteMonto: ajusteMonto,
			precioFinal: precioFinal,
			diasAnticipacion: diasAnticipacion,
			ajustesAplicados: ajustesAplicados,
		});
	} catch (error) {
		console.error("Error calculando tarifa dinámica:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// --- ENDPOINTS PARA FESTIVOS Y FECHAS ESPECIALES ---

// Listar todos los festivos
app.get("/api/festivos", async (req, res) => {
	try {
		const festivos = await Festivo.findAll({
			order: [["fecha", "ASC"]],
		});

		res.json(festivos);
	} catch (error) {
		console.error("Error obteniendo festivos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Crear nuevo festivo
app.post("/api/festivos", authAdmin, async (req, res) => {
	try {
		const nuevoFestivo = await Festivo.create(req.body);
		res.status(201).json(nuevoFestivo);
	} catch (error) {
		console.error("Error creando festivo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar festivo
app.put("/api/festivos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const festivo = await Festivo.findByPk(id);
		if (!festivo) {
			return res.status(404).json({ error: "Festivo no encontrado" });
		}

		await festivo.update(req.body);

		res.json(festivo);
	} catch (error) {
		console.error("Error actualizando festivo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Eliminar festivo
app.delete("/api/festivos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const festivo = await Festivo.findByPk(id);
		if (!festivo) {
			return res.status(404).json({ error: "Festivo no encontrado" });
		}

		await festivo.destroy();

		res.json({
			success: true,
			message: "Festivo eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error eliminando festivo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// ============================================
// ENDPOINTS DE BLOQUEOS DE AGENDA
// ============================================

// Obtener todos los bloqueos de agenda
app.get("/api/bloqueos", async (req, res) => {
	try {
		const bloqueos = await BloqueoAgenda.findAll({
			order: [["fechaInicio", "ASC"]],
		});

		res.json(bloqueos);
	} catch (error) {
		console.error("Error obteniendo bloqueos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Verificar si una fecha/hora específica está bloqueada
app.post("/api/bloqueos/verificar", async (req, res) => {
	try {
		const { fecha, hora } = req.body;

		if (!fecha) {
			return res.status(400).json({
				success: false,
				error: "La fecha es requerida",
			});
		}

		const resultado = await verificarBloqueoAgenda(fecha, hora);

		res.json({
			success: true,
			bloqueado: resultado.bloqueado,
			motivo: resultado.motivo,
			bloqueo: resultado.bloqueo,
		});
	} catch (error) {
		console.error("Error verificando bloqueo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener bloqueos en un rango de fechas
app.post("/api/bloqueos/rango", async (req, res) => {
	try {
		const { fechaInicio, fechaFin } = req.body;

		if (!fechaInicio || !fechaFin) {
			return res.status(400).json({
				success: false,
				error: "Las fechas de inicio y fin son requeridas",
			});
		}

		const bloqueos = await obtenerBloqueosEnRango(fechaInicio, fechaFin);

		res.json({
			success: true,
			bloqueos,
		});
	} catch (error) {
		console.error("Error obteniendo bloqueos en rango:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Crear nuevo bloqueo de agenda
app.post("/api/bloqueos", authAdmin, apiLimiter, async (req, res) => {
	try {
		const nuevoBloqueo = await BloqueoAgenda.create(req.body);
		res.status(201).json(nuevoBloqueo);
	} catch (error) {
		console.error("Error creando bloqueo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar bloqueo de agenda
app.put("/api/bloqueos/:id", authAdmin, apiLimiter, async (req, res) => {
	try {
		const { id } = req.params;

		const bloqueo = await BloqueoAgenda.findByPk(id);
		if (!bloqueo) {
			return res.status(404).json({ error: "Bloqueo no encontrado" });
		}

		await bloqueo.update(req.body);

		res.json(bloqueo);
	} catch (error) {
		console.error("Error actualizando bloqueo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Eliminar bloqueo de agenda
app.delete("/api/bloqueos/:id", authAdmin, apiLimiter, async (req, res) => {
	try {
		const { id } = req.params;

		const bloqueo = await BloqueoAgenda.findByPk(id);
		if (!bloqueo) {
			return res.status(404).json({ error: "Bloqueo no encontrado" });
		}

		await bloqueo.destroy();

		res.json({
			success: true,
			message: "Bloqueo eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error eliminando bloqueo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// ============================================
// ENDPOINTS DE DISPONIBILIDAD Y DESCUENTOS POR RETORNO
// ============================================

// Importar funciones de utilidad
import {
	verificarDisponibilidadVehiculos,
	buscarOportunidadesRetorno,
	validarHorarioMinimo,
	obtenerConfiguracionDisponibilidad,
} from "./utils/disponibilidad.js";

// Obtener configuración de disponibilidad (para panel admin)
app.get("/api/disponibilidad/configuracion", authAdmin, async (req, res) => {
	try {
		const config = await ConfiguracionDisponibilidad.findOne({
			where: { activo: true },
			order: [["createdAt", "DESC"]],
		});

		if (!config) {
			// Crear configuración por defecto si no existe
			const nuevaConfig = await ConfiguracionDisponibilidad.create({
				holguraMinima: 30,
				holguraOptima: 60,
				holguraMaximaDescuento: 180,
				descuentoMinimo: 1.0,
				descuentoMaximo: 40.0,
				horaLimiteRetornos: "20:00:00",
				activo: true,
				descripcion: "Configuración inicial del sistema",
			});
			return res.json(nuevaConfig);
		}

		res.json(config);
	} catch (error) {
		console.error("Error obteniendo configuración de disponibilidad:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar configuración de disponibilidad (para panel admin)
app.put("/api/disponibilidad/configuracion/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const {
			holguraOptima,
			holguraMaximaDescuento,
			descuentoMinimo,
			descuentoMaximo,
			horaLimiteRetornos,
			activo,
			descripcion,
		} = req.body;

		const config = await ConfiguracionDisponibilidad.findByPk(id);
		if (!config) {
			return res.status(404).json({ error: "Configuración no encontrada" });
		}

		// Validaciones
		if (holguraOptima < 30) {
			return res.status(400).json({
				error: "La holgura óptima no puede ser menor a 30 minutos",
			});
		}

		if (holguraMaximaDescuento < holguraOptima) {
			return res.status(400).json({
				error: "La holgura máxima debe ser mayor o igual a la holgura óptima",
			});
		}

		if (descuentoMinimo < 0 || descuentoMinimo > 100) {
			return res.status(400).json({
				error: "El descuento mínimo debe estar entre 0 y 100",
			});
		}

		if (descuentoMaximo < descuentoMinimo || descuentoMaximo > 100) {
			return res.status(400).json({
				error: "El descuento máximo debe ser mayor o igual al mínimo y no superar 100",
			});
		}

		await config.update({
			holguraOptima,
			holguraMaximaDescuento,
			descuentoMinimo,
			descuentoMaximo,
			horaLimiteRetornos,
			activo,
			descripcion,
			ultimaModificacionPor: req.user?.username || "admin",
		});

		res.json({
			success: true,
			message: "Configuración actualizada exitosamente",
			config,
		});
	} catch (error) {
		console.error("Error actualizando configuración:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Verificar disponibilidad de vehículos (público, para formulario de reserva)
app.post("/api/disponibilidad/verificar", async (req, res) => {
	try {
		const { fecha, hora, duracionMinutos, pasajeros, excludeReservaId } = req.body;

		if (!fecha || !hora) {
			return res.status(400).json({
				error: "Fecha y hora son requeridas",
			});
		}

		const resultado = await verificarDisponibilidadVehiculos({
			fecha,
			hora,
			duracionMinutos: duracionMinutos || 60,
			pasajeros: pasajeros || 1,
			excludeReservaId,
		});

		res.json(resultado);
	} catch (error) {
		console.error("Error verificando disponibilidad:", error);
		res.status(500).json({
			error: "Error interno del servidor",
			mensaje: error.message,
		});
	}
});

// Buscar oportunidades de retorno (público, para formulario de reserva)
app.post("/api/disponibilidad/oportunidades-retorno", async (req, res) => {
	try {
		const { origen, destino, fecha, hora } = req.body;

		if (!origen || !destino || !fecha || !hora) {
			return res.status(400).json({
				error: "Origen, destino, fecha y hora son requeridos",
			});
		}

		const resultado = await buscarOportunidadesRetorno({
			origen,
			destino,
			fecha,
			hora,
		});

		res.json(resultado);
	} catch (error) {
		console.error("Error buscando oportunidades de retorno:", error);
		res.status(500).json({
			error: "Error interno del servidor",
			mensaje: error.message,
		});
	}
});

// Buscar retornos disponibles (público, para formulario de reserva - NUEVO)
// No requiere email ni hora, busca todas las reservas con retornos disponibles
app.post("/api/disponibilidad/buscar-retornos-disponibles", async (req, res) => {
	try {
		const { origen, destino, fecha } = req.body;

		if (!origen || !destino || !fecha) {
			return res.status(400).json({
				error: "Origen, destino y fecha son requeridos",
			});
		}

		// Importar la función dinámicamente
		const { buscarRetornosDisponibles } = await import("./utils/disponibilidad.js");

		const resultado = await buscarRetornosDisponibles({
			origen,
			destino,
			fecha,
		});

		res.json(resultado);
	} catch (error) {
		console.error("Error buscando retornos disponibles:", error);
		res.status(500).json({
			error: "Error interno del servidor",
			mensaje: error.message,
		});
	}
});

// Validar horario mínimo (público, para formulario de reserva)
app.post("/api/disponibilidad/validar-horario", async (req, res) => {
	try {
		const { fecha, hora, vehiculoId, excludeReservaId } = req.body;

		if (!fecha || !hora) {
			return res.status(400).json({
				error: "Fecha y hora son requeridas",
			});
		}

		const resultado = await validarHorarioMinimo({
			fecha,
			hora,
			vehiculoId,
			excludeReservaId,
		});

		res.json(resultado);
	} catch (error) {
		console.error("Error validando horario:", error);
		res.status(500).json({
			error: "Error interno del servidor",
			mensaje: error.message,
		});
	}
});

// ============================================
// FIN ENDPOINTS DE DISPONIBILIDAD
// ============================================

// Eliminar una reserva
app.delete("/api/reservas/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		await reserva.destroy();

		res.json({
			success: true,
			message: "Reserva eliminada exitosamente",
		});
	} catch (error) {
		console.error("Error eliminando reserva:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Cambiar estado de una reserva
app.put("/api/reservas/:id/estado", async (req, res) => {
	console.log(
		"PUT /api/reservas/:id/estado llamado con id:",
		req.params.id,
		"estado:",
		req.body?.estado
	);
	try {
		const { id } = req.params;
		const { estado, observaciones } = req.body || {};

		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			console.log("Reserva no encontrada:", id);
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		// Validar que no se pueda cambiar a pendiente si ya hay pagos realizados
		if (estado === "pendiente" && (reserva.pagoMonto || 0) > 0) {
			console.log(
				"Intento de cambiar a pendiente con pagos:",
				reserva.pagoMonto
			);
			return res.status(400).json({
				error:
					"No se puede cambiar a pendiente una reserva que ya tiene pagos realizados",
			});
		}

		// Permitir dejar observaciones vacías: si viene "" lo convertimos a NULL
		const obsValue =
			observaciones !== undefined
				? typeof observaciones === "string" && observaciones.trim() === ""
					? null
					: observaciones
				: reserva.observaciones;

		await reserva.update({
			estado,
			observaciones: obsValue,
		});

		console.log(
			"Estado actualizado exitosamente para reserva:",
			id,
			"a:",
			estado
		);
		res.json({
			success: true,
			message: "Estado actualizado",
			reserva,
		});
	} catch (error) {
		console.error("Error actualizando estado:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para generar pagos desde el frontend
app.post("/create-payment", async (req, res) => {
		const {
		gateway,
		amount,
		description,
		email,
		reservaId,
		codigoReserva,
		tipoPago,
		referenciaPago,
		paymentOrigin, // Nuevo: Identifica el origen del pago (consultar_reserva, compra_productos, etc.)
	} = req.body || {};

	if (!gateway || !amount || !description || !email) {
		return res.status(400).json({
			message:
				"Faltan parametros requeridos: gateway, amount, description, email.",
		});
	}

	const frontendBase =
		process.env.FRONTEND_URL || "https://www.transportesaraucaria.cl";
	const backendBase =
		process.env.BACKEND_URL || "https://transportes-araucaria.onrender.com";

	if (gateway === "flow") {
		const flowApiUrl = process.env.FLOW_API_URL || "https://www.flow.cl/api";
		const codigoReservaNormalizado =
			typeof codigoReserva === "string" && codigoReserva.trim().length > 0
				? codigoReserva.trim().toUpperCase()
				: null;
		const comercioBase = codigoReservaNormalizado || "ORDEN";
		const commerceOrder = `${comercioBase}-${Date.now()}`;

		// Incluir datos auxiliares para que el webhook identifique la reserva sin depender del correo
		const optionalPayload = {};
		if (email) optionalPayload.email = email;
		if (reservaId) optionalPayload.reservaId = reservaId;
		if (codigoReservaNormalizado)
			optionalPayload.codigoReserva = codigoReservaNormalizado;
		if (tipoPago) optionalPayload.tipoPago = tipoPago;
		if (referenciaPago) optionalPayload.referenciaPago = referenciaPago;
		if (paymentOrigin) optionalPayload.paymentOrigin = paymentOrigin;

		const params = {
			apiKey: process.env.FLOW_API_KEY,
			commerceOrder,
			subject: description,
			currency: "CLP",
			amount: Number(amount),
			email: email,
			urlConfirmation: `${backendBase}/api/flow-confirmation`,
			// Modificado: Flow hace un POST al retorno. React no puede leer el body del POST desde la navegación.
			// Solución: Retornar a un endpoint del backend que reciba el POST y redirija al frontend con GET.
			urlReturn: `${backendBase}/api/payment-result`,
		};

		if (Object.keys(optionalPayload).length > 0) {
			optionalPayload.commerceOrder = commerceOrder;
			try {
				const jsonOptional = JSON.stringify(optionalPayload);
				params.optional = jsonOptional;
				console.log("📦 Metadata optional para Flow:", jsonOptional);
			} catch (optionalError) {
				console.warn(
					"⚠️ No se pudo serializar la metadata optional para Flow:",
					optionalError.message
				);
			}
		} else {
			console.log("ℹ️ No hay metadata optional para enviar a Flow");
		}

		params.s = signParams(params);

		try {
			const response = await axios.post(
				`${flowApiUrl}/payment/create`,
				new URLSearchParams(params).toString(),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}
			);
			const payment = response.data;
			if (!payment.url || !payment.token) {
				throw new Error("Respuesta invalida desde Flow");
			}
			const redirectUrl = `${payment.url}?token=${payment.token}`;
			return res.json({ url: redirectUrl });
		} catch (error) {
			console.error(
				"Error al crear el pago con Flow:",
				error.response ? error.response.data : error.message
			);
			return res.status(500).json({
				message: "Error al generar el pago con Flow.",
			});
		}
	}

	return res.status(400).json({ message: "Pasarela de pago no válida." });
});

// Endpoint para manejar el retorno de Flow (POST -> GET Redirect)
// Flow envía el token por POST. Este endpoint lo captura y redirige al frontend via GET.
app.use("/api/payment-result", express.urlencoded({ extended: true }));
app.post("/api/payment-result", async (req, res) => {
	console.log("🔄 Recibiendo retorno de Flow via POST (Procesando redirección inteligente)...");
	
	try {
		let token = req.body.token;
		// Soporte para variaciones
		if (!token && req.body.Token) token = req.body.Token;

		const frontendBase = process.env.FRONTEND_URL || "https://www.transportesaraucaria.cl";

		if (!token) {
			console.warn("⚠️ No se recibió token en /api/payment-result body:", req.body);
			return res.redirect(303, `${frontendBase}/flow-return?error=missing_token`);
		}

		console.log("✅ Token capturado:", token);

		// Intentar obtener el ID de reserva desde Flow para redirigir a la vista de detalles
		try {
			const params = {
				apiKey: process.env.FLOW_API_KEY,
				token: token,
			};
			params.s = signParams(params);

			const flowApiUrl = process.env.FLOW_API_URL || "https://www.flow.cl/api";
			const statusResponse = await axios.get(`${flowApiUrl}/payment/getStatus`, {
				params: params
			});

			const flowData = statusResponse.data;
			
			// Intentar extraer reservaId de los datos opcionales
			let reservaId = null;
			let optionalData = null; // Elevamos scope para evitar ReferenceError en logs posteriores
			
			if (flowData.optional) {
				try {
					// Verificar si ya es un objeto (axios podría haberlo parseado si Flow devolvió JSON)
					// Esta lógica viene de la rama fix-flow-payment-error-handling y es más robusta
					optionalData = typeof flowData.optional === "string"
						? JSON.parse(flowData.optional)
						: flowData.optional;

					reservaId = optionalData?.reservaId;
				} catch (e) {
					console.warn("⚠️ Error parseando optional data de Flow:", e.message, "Data:", flowData.optional);
				}
			}

			// Si tenemos reservaId y el pago fue exitoso (2) o está pendiente (1)
			if (reservaId && (flowData.status === 2 || flowData.status === 1)) {
				// Buscar la reserva en la base de datos para determinar el flujo de redirección
				const reserva = await Reserva.findByPk(reservaId);
				
				// Re-parsear optional data para asegurar acceso en este scope
				let optionalDataSafe = {};
				try {
					if (flowData.optional) {
						optionalDataSafe = typeof flowData.optional === "string"
							? JSON.parse(flowData.optional)
							: flowData.optional;
					}
				} catch (e) {
					console.warn("Error parsing optional data again:", e.message);
				}

				// Determinar el origen del pago (desde DB o desde metadata optional)
				const paymentOrigin = optionalDataSafe?.paymentOrigin;
				const tipoPago = optionalDataSafe?.tipoPago; // 'total', 'abono', 'saldo', 'saldo_total'

				const isCodigoPago = reserva && reserva.source === "codigo_pago";
				const isConsultaReserva = paymentOrigin === "consultar_reserva";
				const isCompraProductos = paymentOrigin === "compra_productos";

				if (isCodigoPago || isConsultaReserva || isCompraProductos) {
					// Caso: Pagar con Código, Consultar Reserva o Compra Productos
					// Redirigir a la página de éxito estándar (FlowReturn)
					// Pasar parámetros adicionales para el tracking preciso
					console.log(`✅ Pago detectado (Reserva ${reservaId}, Origen: ${paymentOrigin || reserva.source}). Redirigiendo a FlowReturn.`);
					
					// Lógica de valor de conversión (Estrategia B):
					// Siempre enviar el TOTAL de la reserva.
					// Google Ads se encarga de deduplicar si hay múltiples pagos para la misma reserva.
					const total = reserva.totalConDescuento || reserva.precio || 0;
					
					console.log(`💰 Monto para conversión: ${total} (Estrategia B: Valor Total)`);

					// Crear objeto con datos de usuario para conversiones avanzadas de Google Ads
					const userData = {
						email: reserva.email || '',
						nombre: reserva.nombre || '',
						telefono: reserva.telefono || ''
					};
					
					// Codificar datos de usuario en Base64 para mayor privacidad
					const userDataEncoded = Buffer.from(JSON.stringify(userData)).toString('base64');
					
					// Construir URL con datos codificados
					const returnUrl = `${frontendBase}/flow-return?token=${token}&status=success&reserva_id=${reservaId}&amount=${total}&d=${userDataEncoded}`;
					
					return res.redirect(303, returnUrl);
				}

				// Caso: Reserva Express (flujo normal)
				// Redirigir a Completar Detalles
				console.log(`✅ Reserva Express detectada (Reserva ${reservaId}). Redirigiendo a Completar Detalles.`);
				return res.redirect(303, `${frontendBase}/?flow_payment=success&reserva_id=${reservaId}`);
			} else if (flowData.status === 3 || flowData.status === 4) {
				// Pago rechazado (3) o anulado (4)
				console.warn(`⚠️ Pago rechazado/anulado por Flow (Status ${flowData.status}). Redirigiendo a error.`);
				return res.redirect(303, `${frontendBase}/flow-return?token=${token}&status=error&flow_status=${flowData.status}`);
			}
		} catch (flowError) {
			console.error("⚠️ Error consultando estado en Flow (usando fallback):", flowError.message);
			// Continuar al fallback
		}
		
		// Fallback: Redirigir a la página genérica de retorno (Asumir éxito si no podemos verificar, o manejar como pendiente)
		// IMPORTANTE: Si llegamos aquí es porque falló la consulta a Flow o no hay reservaId, pero Flow nos redirigió.
		// Para seguridad, pasamos status=unknown para que el frontend decida o muestre "Verificando..."
		console.log("ℹ️ Usando fallback de redirección a /flow-return");
		res.redirect(303, `${frontendBase}/flow-return?token=${token}&status=unknown`);
	} catch (error) {
		console.error("❌ Error en redirección de pago:", error);
		const frontendBase = process.env.FRONTEND_URL || "https://www.transportesaraucaria.cl";
		res.redirect(303, `${frontendBase}/flow-return?error=server_error`);
	}
});

// --- ENDPOINT DE PAGO FLOW ---
app.post("/api/create-flow-payment", async (req, res) => {
	try {
		const { amount, subject, email, nombre, apellido, telefono } = req.body;

		const params = {
			apiKey: process.env.FLOW_API_KEY,
			commerceOrder: `order_${Date.now()}`,
			subject: subject,
			amount: amount,
			email: email,
			urlConfirmation: `${process.env.BACKEND_URL}/api/flow-confirmation`,
			urlReturn: `${process.env.FRONTEND_URL}/confirmacion`,
			optional: JSON.stringify({
				nombre: nombre,
				apellido: apellido,
				telefono: telefono,
			}),
		};

		params.s = signParams(params);

		const response = await axios.post(
			"https://www.flow.cl/api/payment/create",
			params,
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			}
		);

		res.json(response.data);
	} catch (error) {
		console.error("Error creando pago Flow:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Webhook para Flow - Maneja confirmaciones de pago

// Importar express para usar urlencoded (en módulos ES)

app.use("/api/flow-confirmation", express.urlencoded({ extended: true }));

app.post("/api/flow-confirmation", async (req, res) => {
	try {
		// Log completo del body y headers para depuración
		console.log("🔔 Confirmación Flow recibida:", req.body);
		console.log("🔎 Headers recibidos:", req.headers);

		// Soporte para diferentes formatos de envío (JSON o x-www-form-urlencoded)
		let token = req.body.token;
		// Si viene como 'Token' (mayúscula)
		if (!token && req.body.Token) token = req.body.Token;
		// Si viene como query param (por compatibilidad)
		if (!token && req.query && req.query.token) token = req.query.token;

		if (!token) {
			console.log("⚠️  No se recibió token de Flow (body recibido):", req.body);
			return res.status(400).send("Missing token");
		}

		// Consultar estado del pago en Flow
		const params = {
			apiKey: process.env.FLOW_API_KEY,
			token: token,
		};
		params.s = signParams(params);

		const flowResponse = await axios.get(
			"https://www.flow.cl/api/payment/getStatus",
			{ params }
		);

		const payment = flowResponse.data;
		console.log("💳 Estado del pago Flow:", {
			flowOrder: payment.flowOrder,
			status: payment.status,
			amount: payment.amount,
		});

		// Responder a Flow
		res.status(200).send("OK");

		// Solo procesar pagos exitosos (status 2 = pagado)
		if (payment.status !== 2) {
			console.log(
				`ℹ️  Pago no exitoso (status: ${payment.status}), no se actualiza reserva`
			);
			return;
		}

		// Extraer metadata auxiliar enviada en el optional de Flow
		let optionalMetadata = {};
		if (payment.optional && typeof payment.optional === "string") {
			try {
				optionalMetadata =
					payment.optional.trim().length > 0
						? JSON.parse(payment.optional)
						: {};
			} catch (optionalParseError) {
				console.warn(
					"⚠️  No se pudo interpretar la metadata optional de Flow:",
					optionalParseError.message
				);
				optionalMetadata = {};
			}
		}
		const emailOptional = optionalMetadata.email;
		const email = payment.payer?.email || emailOptional;
		const commerceOrder = payment.commerceOrder;
		const optionalReservaId =
			optionalMetadata.reservaId !== undefined &&
			optionalMetadata.reservaId !== null &&
			optionalMetadata.reservaId !== ""
				? Number(optionalMetadata.reservaId)
				: null;
		const optionalCodigoReserva =
			typeof optionalMetadata.codigoReserva === "string" &&
			optionalMetadata.codigoReserva.trim().length > 0
				? optionalMetadata.codigoReserva.trim().toUpperCase()
				: null;
		const optionalTipoPago =
			typeof optionalMetadata.tipoPago === "string" &&
			optionalMetadata.tipoPago.trim().length > 0
				? optionalMetadata.tipoPago.trim().toLowerCase()
				: null;
		const optionalReferenciaPago =
			typeof optionalMetadata.referenciaPago === "string" &&
			optionalMetadata.referenciaPago.trim().length > 0
				? optionalMetadata.referenciaPago.trim().toUpperCase()
				: null;

		if (
			!commerceOrder &&
			!optionalReservaId &&
			!optionalCodigoReserva &&
			!email
		) {
			console.log(
				"⚠️  No se puede identificar la reserva (falta metadata suficiente)"
			);
			return;
		}

		let reserva = null;

		if (optionalReservaId && !Number.isNaN(optionalReservaId)) {
			reserva = await Reserva.findByPk(optionalReservaId);
		}

		if (!reserva && optionalCodigoReserva) {
			reserva = await Reserva.findOne({
				where: { codigoReserva: optionalCodigoReserva },
			});
		}

		if (!reserva && commerceOrder) {
			const partesCommerce = commerceOrder.split("-");
			if (partesCommerce.length > 2) {
				const posibleCodigo = partesCommerce.slice(0, -1).join("-");
				if (posibleCodigo) {
					reserva = await Reserva.findOne({
						where: { codigoReserva: posibleCodigo },
					});
				}
			}
		}

		if (!reserva && email) {
			reserva = await Reserva.findOne({
				where: { email: email },
				order: [["created_at", "DESC"]],
			});
		}

		if (!reserva && emailOptional && emailOptional !== email) {
			reserva = await Reserva.findOne({
				where: { email: emailOptional },
				order: [["created_at", "DESC"]],
			});
		}

		if (!reserva) {
			console.log("⚠️  Reserva no encontrada en la base de datos");
			return;
		}

		console.log(
			`✅ Reserva encontrada: ID ${reserva.id}, Código ${reserva.codigoReserva}`
		);

		// Reglas: parcial (>= 40% del total) => confirmada, total => confirmada (estado completada se gestiona manualmente)
		const totalReserva = parseFloat(reserva.totalConDescuento || 0) || 0;
		const pagoPrevio = parseFloat(reserva.pagoMonto || 0) || 0;
		const montoActual = Number(payment.amount) || 0;
		const pagoAcumulado = pagoPrevio + montoActual;
		const umbralAbono = Math.max(
			totalReserva * 0.4,
			parseFloat(reserva.abonoSugerido || 0) || 0
		);

		let nuevoEstadoPago = reserva.estadoPago;
		let nuevoEstadoReserva = reserva.estado;
		let nuevoSaldoPendiente = Math.max(totalReserva - pagoAcumulado, 0);
		let abonoPagado = reserva.abonoPagado;
		let saldoPagado = reserva.saldoPagado;
		const referenciaPagoFinal =
			optionalReferenciaPago || reserva.referenciaPago || null;

		let tipoPagoFinal = optionalTipoPago || reserva.tipoPago;
		if (!tipoPagoFinal) {
			if (pagoAcumulado >= totalReserva && totalReserva > 0) {
				tipoPagoFinal = "total";
			} else if (pagoAcumulado > 0) {
				tipoPagoFinal = "abono";
			}
		}

		if (pagoAcumulado >= totalReserva && totalReserva > 0) {
			nuevoEstadoPago = "pagado";
			nuevoSaldoPendiente = 0;
			abonoPagado = true;
			saldoPagado = true;
			if (
				["pendiente", "pendiente_detalles", "confirmada"].includes(
					nuevoEstadoReserva
				)
			) {
				nuevoEstadoReserva = "confirmada";
			}
		} else if (pagoAcumulado > 0) {
			nuevoEstadoPago = "parcial";
			if (
				pagoAcumulado >= umbralAbono &&
				["pendiente", "pendiente_detalles"].includes(nuevoEstadoReserva)
			) {
				nuevoEstadoReserva = "confirmada";
			}
			if (pagoAcumulado >= umbralAbono) {
				abonoPagado = true;
			}
		}

		// Actualizar estado de pago en la reserva (acumulando pagoMonto)
		await reserva.update({
			estadoPago: nuevoEstadoPago,
			pagoId: payment.flowOrder.toString(),
			pagoGateway: "flow",
			pagoMonto: pagoAcumulado,
			pagoFecha: new Date(payment.paymentDate || new Date()),
			estado: nuevoEstadoReserva,
			saldoPendiente: nuevoSaldoPendiente,
			referenciaPago: referenciaPagoFinal,
			tipoPago: tipoPagoFinal,
			abonoPagado,
			saldoPagado,
		});

		// Intentar vincular la reserva con un cliente existente o crearlo si es necesario
		let clienteActualizado = null;
		try {
			let clienteId = reserva.clienteId;
			let clienteAsociado = null;

			if (clienteId) {
				clienteAsociado = await Cliente.findByPk(clienteId);
			} else {
				const emailNormalizado = (reserva.email || "").trim().toLowerCase();
				const telefonoNormalizado = (reserva.telefono || "").trim();

				if (emailNormalizado) {
					clienteAsociado = await Cliente.findOne({
						where: sequelize.where(
							sequelize.fn("LOWER", sequelize.col("email")),
							emailNormalizado
						),
					});
				}

				if (!clienteAsociado && telefonoNormalizado) {
					clienteAsociado = await Cliente.findOne({
						where: { telefono: telefonoNormalizado },
					});
				}

				if (!clienteAsociado) {
					clienteAsociado = await Cliente.create({
						nombre: reserva.nombre || "Cliente sin nombre",
						email: reserva.email || email || "",
						telefono: telefonoNormalizado || "",
						rut: reserva.rut || null,
						notas: null,
						esCliente: false,
						marcadoManualmente: false,
						totalReservas: 0,
						totalPagos: 0,
						totalGastado: 0,
					});
				}

				if (clienteAsociado && reserva.clienteId !== clienteAsociado.id) {
					await reserva.update({ clienteId: clienteAsociado.id });
					clienteId = clienteAsociado.id;
				} else if (clienteAsociado) {
					clienteId = clienteAsociado.id;
				}
			}

			if (!clienteAsociado && clienteId) {
				clienteAsociado = await Cliente.findByPk(clienteId);
			}

			if (clienteAsociado) {
				clienteActualizado = await actualizarResumenCliente(clienteAsociado.id);
			}
		} catch (clienteError) {
			console.error(
				"⚠️ No se pudo sincronizar el cliente tras pago Flow:",
				clienteError.message
			);
		}

		if (clienteActualizado) {
			console.log(
				`👤 Cliente sincronizado tras pago Flow: ${clienteActualizado.id}`
			);
		}

		console.log("💾 Reserva actualizada con información de pago Flow");

		// Si la reserva proviene de un código de pago, marcarlo como usado
		try {
			const codigoDePago = reserva.referenciaPago;
			if (
				codigoDePago &&
				typeof codigoDePago === "string" &&
				codigoDePago.trim().length > 0
			) {
				const codigo = codigoDePago.trim().toUpperCase();
				const registro = await CodigoPago.findOne({ where: { codigo } });
				if (registro) {
					const nuevosUsos = (parseInt(registro.usosActuales, 10) || 0) + 1;
					const estado =
						nuevosUsos >= registro.usosMaximos ? "usado" : registro.estado;
					await registro.update({
						usosActuales: nuevosUsos,
						reservaId: reserva.id,
						emailCliente: reserva.email,
						fechaUso: new Date(),
						estado,
					});
					console.log("✅ Código de pago marcado como usado:", codigo);
				} else {
					console.log(
						"ℹ️ Código de pago no encontrado para marcar uso:",
						codigo
					);
				}
			}
		} catch (cpError) {
			console.warn(
				"⚠️ No se pudo marcar el código de pago como usado:",
				cpError.message
			);
		}

		// Enviar correo de confirmación de pago
		try {
			console.log("📧 Enviando email de confirmación de pago...");

			const emailData = {
				email: reserva.email,
				nombre: reserva.nombre,
				codigoReserva: reserva.codigoReserva,
				origen: reserva.origen,
				destino: reserva.destino,
				fecha: reserva.fecha,
				hora: reserva.hora,
				pasajeros: reserva.pasajeros,
				vehiculo: reserva.vehiculo,
				monto: payment.amount,
				gateway: "Flow",
				paymentId: payment.flowOrder.toString(),
				estadoPago: "approved",
			};

			const phpUrl =
				process.env.PHP_PAYMENT_CONFIRMATION_URL ||
				"https://www.transportesaraucaria.cl/enviar_confirmacion_pago.php";

			const emailResponse = await axios.post(phpUrl, emailData, {
				headers: { "Content-Type": "application/json" },
				timeout: 30000,
			});

			console.log(
				"✅ Email de confirmación de pago Flow enviado:",
				emailResponse.data
			);
		} catch (emailError) {
			console.error(
				"❌ Error al enviar email de confirmación (no crítico):",
				emailError.message
			);
		}

		// Enviar notificación de productos si corresponde
		try {
			const productosEnReserva = await ProductoReserva.findAll({
				where: { reservaId: reserva.id },
				include: [{ model: Producto, as: "producto" }],
			});

			if (productosEnReserva.length > 0) {
				console.log(
					`📧 Enviando notificación de productos para reserva ${reserva.codigoReserva}...`
				);

				const productosParaNotificacion = productosEnReserva.map((pr) => ({
					nombre: pr.producto?.nombre || "Producto",
					cantidad: pr.cantidad,
					precioUnitario: parseFloat(pr.precioUnitario),
					subtotal: parseFloat(pr.subtotal),
					notas: pr.notas || null,
				}));

				const totalProductos = productosParaNotificacion.reduce(
					(sum, p) => sum + p.subtotal,
					0
				);

				const notifData = {
					reservaId: reserva.id,
					codigoReserva: reserva.codigoReserva,
					emailPasajero: reserva.email,
					nombrePasajero: reserva.nombre,
					productos: productosParaNotificacion,
					totalProductos: totalProductos,
				};

				const notifUrl =
					"https://www.transportesaraucaria.cl/enviar_notificacion_productos.php";

				const resp = await axios.post(notifUrl, notifData, {
					headers: {
						"Content-Type": "application/json",
						"X-Debug": process.env.NOTIF_DEBUG === "1" ? "1" : "0",
					},
					timeout: 10000,
				});

				console.log(
					`✅ Notificación de productos enviada para reserva ${reserva.codigoReserva}`
				);
				if (resp?.data) {
					console.log(
						"   • Respuesta PHP:",
						typeof resp.data === "string"
							? resp.data
							: JSON.stringify(resp.data)
					);
				}
			}
		} catch (notifError) {
			// Log detallado para depurar errores provenientes del PHP en Hostinger
			const status = notifError?.response?.status;
			const body = notifError?.response?.data;
			console.error(
				"❌ Error al enviar notificación de productos (no crítico):",
				notifError.message
			);
			if (status) console.error("   • Código HTTP:", status);
			if (body)
				console.error(
					"   • Respuesta del servidor:",
					typeof body === "string" ? body : JSON.stringify(body)
				);
		}
	} catch (error) {
		console.error("❌ Error procesando confirmación Flow:", error.message);
		res.status(500).send("Error");
	}
});

// --- RUTAS DE GASTOS ---
//
// Nota: Se asume que existe un modelo Gasto en ./models/Gasto.js exportado
// y que las asociaciones con Reserva, Conductor y Vehiculo están definidas en models/associations.js
//
// Las rutas requieren autenticación admin (authAdmin) para operaciones de creación/edición/eliminación
//

// Obtener todos los gastos de una reserva
app.get("/api/reservas/:id/gastos", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const gastos = await Gasto.findAll({
			where: { reservaId: id },
			include: [
				{
					model: Conductor,
					as: "conductor",
					attributes: ["id", "nombre"],
				},
				{
					model: Vehiculo,
					as: "vehiculo",
					attributes: ["id", "patente", "marca", "modelo"],
				},
			],
			order: [["fecha", "DESC"]],
		});

		const totalGastos = gastos.reduce(
			(sum, gasto) => sum + parseFloat(gasto.monto || 0),
			0
		);

		res.json({
			success: true,
			gastos,
			totalGastos,
		});
	} catch (error) {
		console.error("Error al obtener gastos:", error);
		res.status(500).json({
			success: false,
			error: "Error al obtener gastos",
		});
	}
});

// Crear un nuevo gasto
app.post("/api/gastos", authAdmin, async (req, res) => {
	try {
		const {
			reservaId,
			tipoGasto,
			monto,
			porcentaje,
			descripcion,
			fecha,
			comprobante,
			conductorId,
			vehiculoId,
			observaciones,
		} = req.body;

		// Validaciones
		if (!reservaId || !tipoGasto || !monto) {
			return res.status(400).json({
				success: false,
				error: "Faltan campos requeridos: reservaId, tipoGasto, monto",
			});
		}

		// Verificar que la reserva existe
		const reserva = await Reserva.findByPk(reservaId);
		if (!reserva) {
			return res.status(404).json({
				success: false,
				error: "Reserva no encontrada",
			});
		}

		// Calcular monto automáticamente si es comisión Flow
		let montoFinal = parseFloat(monto);
		if (tipoGasto === "comision_flow" && porcentaje) {
			montoFinal =
				(parseFloat(reserva.totalConDescuento) * parseFloat(porcentaje)) / 100;
		}

		const gasto = await Gasto.create({
			reservaId,
			tipoGasto,
			monto: montoFinal,
			porcentaje: porcentaje || null,
			descripcion: descripcion || null,
			fecha: fecha || new Date(),
			comprobante: comprobante || null,
			conductorId: conductorId || null,
			vehiculoId: vehiculoId || null,
			observaciones: observaciones || null,
		});

		// Cargar relaciones para la respuesta
		const gastoCompleto = await Gasto.findByPk(gasto.id, {
			include: [
				{
					model: Conductor,
					as: "conductor",
					attributes: ["id", "nombre"],
				},
				{
					model: Vehiculo,
					as: "vehiculo",
					attributes: ["id", "patente", "marca", "modelo"],
				},
			],
		});

		res.json({
			success: true,
			gasto: gastoCompleto,
		});
	} catch (error) {
		console.error("Error al crear gasto:", error);
		res.status(500).json({
			success: false,
			error: "Error al crear gasto",
		});
	}
});

// Actualizar un gasto
app.put("/api/gastos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const {
			tipoGasto,
			monto,
			porcentaje,
			descripcion,
			fecha,
			comprobante,
			conductorId,
			vehiculoId,
			observaciones,
		} = req.body;

		const gasto = await Gasto.findByPk(id);
		if (!gasto) {
			return res.status(404).json({
				success: false,
				error: "Gasto no encontrado",
			});
		}

		await gasto.update({
			tipoGasto: tipoGasto || gasto.tipoGasto,
			monto: monto !== undefined ? monto : gasto.monto,
			porcentaje: porcentaje !== undefined ? porcentaje : gasto.porcentaje,
			descripcion: descripcion !== undefined ? descripcion : gasto.descripcion,
			fecha: fecha || gasto.fecha,
			comprobante: comprobante !== undefined ? comprobante : gasto.comprobante,
			conductorId: conductorId !== undefined ? conductorId : gasto.conductorId,
			vehiculoId: vehiculoId !== undefined ? vehiculoId : gasto.vehiculoId,
			observaciones:
				observaciones !== undefined ? observaciones : gasto.observaciones,
		});

		// Cargar relaciones para la respuesta
		const gastoActualizado = await Gasto.findByPk(id, {
			include: [
				{
					model: Conductor,
					as: "conductor",
					attributes: ["id", "nombre"],
				},
				{
					model: Vehiculo,
					as: "vehiculo",
					attributes: ["id", "patente", "marca", "modelo"],
				},
			],
		});

		res.json({
			success: true,
			gasto: gastoActualizado,
		});
	} catch (error) {
		console.error("Error al actualizar gasto:", error);
		res.status(500).json({
			success: false,
			error: "Error al actualizar gasto",
		});
	}
});

// Eliminar un gasto
app.delete("/api/gastos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const gasto = await Gasto.findByPk(id);
		if (!gasto) {
			return res.status(404).json({
				success: false,
				error: "Gasto no encontrado",
			});
		}

		await gasto.destroy();

		res.json({
			success: true,
			message: "Gasto eliminado correctamente",
		});
	} catch (error) {
		console.error("Error al eliminar gasto:", error);
		res.status(500).json({
			success: false,
			error: "Error al eliminar gasto",
		});
	}
});

// Obtener estadísticas por conductor
app.get("/api/estadisticas/conductores", authAdmin, async (req, res) => {
	try {
		const { from, to } = req.query;
		const fechaInicio = from ? new Date(from) : null;
		const fechaFin = to ? new Date(to) : null;

		if (
			(from && Number.isNaN(fechaInicio?.getTime())) ||
			(to && Number.isNaN(fechaFin?.getTime()))
		) {
			return res.status(400).json({
				success: false,
				error: "Parámetros de fecha inválidos.",
			});
		}

		if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
			return res.status(400).json({
				success: false,
				error: "El rango de fechas es inválido.",
			});
		}

		const filtroReservas = {};
		if (fechaInicio) {
			filtroReservas[Op.gte] = fechaInicio;
		}
		if (fechaFin) {
			filtroReservas[Op.lte] = fechaFin;
		}
		const whereReservas =
			(fechaInicio || fechaFin)
				? { fecha: filtroReservas }
				: undefined;

		const filtroGastos = {};
		if (fechaInicio) {
			filtroGastos[Op.gte] = fechaInicio;
		}
		if (fechaFin) {
			filtroGastos[Op.lte] = fechaFin;
		}
		const whereGastos =
			Object.keys(filtroGastos).length > 0
				? { fecha: filtroGastos }
				: undefined;

		// NO filtrar gastos por fecha aquí, ya que necesitamos filtrarlos por reservaId
	// Los gastos deben corresponder a las reservas del período, no por su propia fecha
	const conductores = await Conductor.findAll({
		include: [
			{
				model: Reserva,
				as: "reservas",
				attributes: ["id", "totalConDescuento", "estado", "fecha"],
				where: whereReservas,
				required: false,
			},
			{
				model: Gasto,
				as: "gastos",
				attributes: ["id", "monto", "tipoGasto", "fecha", "reservaId"],
				// NO aplicar filtro de fecha aquí
				required: false,
			},
		],
	});

	const estadisticas = conductores.map((conductor) => {
		const reservas = conductor.reservas || [];
		const todosLosGastos = conductor.gastos || [];
		
		// Filtrar gastos: solo los que pertenecen a las reservas filtradas
		const reservaIds = new Set(reservas.map(r => r.id));
		const gastos = todosLosGastos.filter(g => 
			g.reservaId && reservaIds.has(g.reservaId)
		);

		const totalReservas = reservas.length;
		const reservasCompletadas = reservas.filter(
			(r) => r.estado === "completada"
		).length;
		const totalIngresos = reservas.reduce(
			(sum, r) => sum + parseFloat(r.totalConDescuento || 0),
			0
		);
		const totalGastos = gastos.reduce(
			(sum, g) => sum + parseFloat(g.monto || 0),
			0
		);
		const pagosConductor = gastos
			.filter((g) => g.tipoGasto === "pago_conductor")
			.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);

		return {
			id: conductor.id,
			nombre: conductor.nombre,
			rut: conductor.rut,
			telefono: conductor.telefono,
			email: conductor.email,
			totalReservas,
			reservasCompletadas,
			totalIngresos,
			totalGastos,
			pagosConductor,
			utilidad: totalIngresos - totalGastos,
		};
	});

		res.json({
			success: true,
			estadisticas,
			filtro: {
				from: fechaInicio ? fechaInicio.toISOString() : null,
				to: fechaFin ? fechaFin.toISOString() : null,
			},
		});
	} catch (error) {
		console.error("Error al obtener estadísticas de conductores:", error);
		res.status(500).json({
			success: false,
			error: "Error al obtener estadísticas de conductores",
		});
	}
});

// Obtener estadísticas por vehículo
app.get("/api/estadisticas/vehiculos", authAdmin, async (req, res) => {
	try {
		const { from, to } = req.query;
		const fechaInicio = from ? new Date(from) : null;
		const fechaFin = to ? new Date(to) : null;

		if (
			(from && Number.isNaN(fechaInicio?.getTime())) ||
			(to && Number.isNaN(fechaFin?.getTime()))
		) {
			return res.status(400).json({
				success: false,
				error: "Parámetros de fecha inválidos.",
			});
		}

		if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
			return res.status(400).json({
				success: false,
				error: "El rango de fechas es inválido.",
			});
		}

		const filtroReservas = {};
		if (fechaInicio) {
			filtroReservas[Op.gte] = fechaInicio;
		}
		if (fechaFin) {
			filtroReservas[Op.lte] = fechaFin;
		}
		const whereReservas =
			(fechaInicio || fechaFin)
				? { fecha: filtroReservas }
				: undefined;

		const filtroGastos = {};
		if (fechaInicio) {
			filtroGastos[Op.gte] = fechaInicio;
		}
		if (fechaFin) {
			filtroGastos[Op.lte] = fechaFin;
		}
		const whereGastos =
			Object.keys(filtroGastos).length > 0
				? { fecha: filtroGastos }
				: undefined;

		// NO filtrar gastos por fecha aquí, ya que necesitamos filtrarlos por reservaId
	// Los gastos deben corresponder a las reservas del período, no por su propia fecha
	const vehiculos = await Vehiculo.findAll({
		include: [
			{
				model: Reserva,
				as: "reservas",
				attributes: ["id", "totalConDescuento", "estado", "fecha"],
				where: whereReservas,
				required: false,
			},
			{
				model: Gasto,
				as: "gastos",
				attributes: ["id", "monto", "tipoGasto", "fecha", "reservaId"],
				// NO aplicar filtro de fecha aquí
				required: false,
			},
		],
	});

	const estadisticas = vehiculos.map((vehiculo) => {
		const reservas = vehiculo.reservas || [];
		const todosLosGastos = vehiculo.gastos || [];
		
		// Filtrar gastos: solo los que pertenecen a las reservas filtradas
		const reservaIds = new Set(reservas.map(r => r.id));
		const gastos = todosLosGastos.filter(g => 
			g.reservaId && reservaIds.has(g.reservaId)
		);

		const totalReservas = reservas.length;
		const reservasCompletadas = reservas.filter(
			(r) => r.estado === "completada"
		).length;
		const totalIngresos = reservas.reduce(
			(sum, r) => sum + parseFloat(r.totalConDescuento || 0),
			0
		);
		const totalGastos = gastos.reduce(
			(sum, g) => sum + parseFloat(g.monto || 0),
			0
		);
		const gastoCombustible = gastos
			.filter((g) => g.tipoGasto === "combustible")
			.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
		const gastoMantenimiento = gastos
			.filter((g) => g.tipoGasto === "mantenimiento")
			.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);

		return {
			id: vehiculo.id,
			patente: vehiculo.patente,
			marca: vehiculo.marca,
			modelo: vehiculo.modelo,
			tipo: vehiculo.tipo,
			capacidad: vehiculo.capacidad,
			totalReservas,
			reservasCompletadas,
			totalIngresos,
			totalGastos,
			gastoCombustible,
			gastoMantenimiento,
			utilidad: totalIngresos - totalGastos,
		};
	});

		res.json({
			success: true,
			estadisticas,
			filtro: {
				from: fechaInicio ? fechaInicio.toISOString() : null,
				to: fechaFin ? fechaFin.toISOString() : null,
			},
		});
	} catch (error) {
		console.error("Error al obtener estadísticas de vehículos:", error);
		res.status(500).json({
			success: false,
			error: "Error al obtener estadísticas de vehículos",
		});
	}
});

app.get("/api/estadisticas/gastos", authAdmin, async (req, res) => {
	try {
		const { from, to, tipo } = req.query;
		const fechaInicio = from ? new Date(from) : null;
		const fechaFin = to ? new Date(to) : null;
		const tipoFiltrado = tipo && tipo !== "todos" ? tipo : null;

		const tiposValidos = [
			"combustible",
			"comision_flow",
			"pago_conductor",
			"peaje",
			"mantenimiento",
			"estacionamiento",
			"otro",
		];

		if (
			(from && Number.isNaN(fechaInicio?.getTime())) ||
			(to && Number.isNaN(fechaFin?.getTime()))
		) {
			return res.status(400).json({
				success: false,
				error: "Parámetros de fecha inválidos.",
			});
		}

		if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
			return res.status(400).json({
				success: false,
				error: "El rango de fechas es inválido.",
			});
		}

		if (tipoFiltrado && !tiposValidos.includes(tipoFiltrado)) {
			return res.status(400).json({
				success: false,
				error: "Tipo de gasto inválido.",
			});
		}

		const where = {};
		if (fechaInicio || fechaFin) {
			where.fecha = {};
			if (fechaInicio) {
				where.fecha[Op.gte] = fechaInicio;
			}
			if (fechaFin) {
				where.fecha[Op.lte] = fechaFin;
			}
		}
		if (tipoFiltrado) {
			where.tipoGasto = tipoFiltrado;
		}

		const gastos = await Gasto.findAll({
			where,
			attributes: ["fecha", "monto", "tipoGasto"],
			raw: true,
		});

		const resumenPorFechaMap = {};
		const totalesPorTipo = {};
		let totalGeneral = 0;

		gastos.forEach((gasto) => {
			const fechaClave = new Date(gasto.fecha).toISOString().slice(0, 10);
			const monto = Number.parseFloat(gasto.monto || 0);
			const tipoGasto = gasto.tipoGasto;

			if (!Number.isFinite(monto)) {
				return;
			}

			totalGeneral += monto;

			if (!totalesPorTipo[tipoGasto]) {
				totalesPorTipo[tipoGasto] = 0;
			}
			totalesPorTipo[tipoGasto] += monto;

			if (!resumenPorFechaMap[fechaClave]) {
				resumenPorFechaMap[fechaClave] = {
					fecha: fechaClave,
					total: 0,
					porTipo: {},
					registros: 0,
				};
			}

			resumenPorFechaMap[fechaClave].total += monto;
			resumenPorFechaMap[fechaClave].registros += 1;
			if (!resumenPorFechaMap[fechaClave].porTipo[tipoGasto]) {
				resumenPorFechaMap[fechaClave].porTipo[tipoGasto] = 0;
			}
			resumenPorFechaMap[fechaClave].porTipo[tipoGasto] += monto;
		});

		const resumenPorFecha = Object.values(resumenPorFechaMap).sort(
			(a, b) => new Date(a.fecha) - new Date(b.fecha)
		);

		res.json({
			success: true,
			totalGeneral,
			totalRegistros: gastos.length,
			totalesPorTipo,
			resumenPorFecha,
			filtro: {
				from: fechaInicio ? fechaInicio.toISOString() : null,
				to: fechaFin ? fechaFin.toISOString() : null,
				tipo: tipoFiltrado || "todos",
			},
		});
	} catch (error) {
		console.error("Error al obtener resumen de gastos:", error);
		res.status(500).json({
			success: false,
			error: "Error al obtener resumen de gastos",
		});
	}
});

// Obtener estadísticas detalladas de un conductor
app.get("/api/estadisticas/conductores/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const { from, to } = req.query;
		const fechaInicio = from ? new Date(from) : null;
		const fechaFin = to ? new Date(to) : null;

		const filtroReservas = {};
		if (fechaInicio) {
			filtroReservas[Op.gte] = fechaInicio;
		}
		if (fechaFin) {
			filtroReservas[Op.lte] = fechaFin;
		}
		const whereReservas =
			(fechaInicio || fechaFin)
				? { fecha: filtroReservas }
				: undefined;

		const conductor = await Conductor.findByPk(id, {
			include: [
				{
					model: Reserva,
					as: "reservas",
					where: whereReservas,
					required: false,
					include: [
						{
							model: Vehiculo,
							as: "vehiculo_asignado",
							attributes: ["id", "patente", "marca", "modelo"],
						},
					],
				},
				{
					model: Gasto,
					as: "gastos",
					attributes: ["id", "monto", "tipoGasto", "fecha", "reservaId", "descripcion"],
					// NO filtrar por fecha aquí
					required: false,
					include: [
						{
							model: Reserva,
							as: "reserva",
							attributes: ["id", "codigoReserva", "fecha"],
						},
					],
				},
			],
		});

		if (!conductor) {
			return res.status(404).json({
				success: false,
				error: "Conductor no encontrado",
			});
		}

		const reservas = conductor.reservas || [];
		const todosLosGastos = conductor.gastos || [];

		// Filtrar gastos: solo los que pertenecen a las reservas filtradas
		const reservaIds = new Set(reservas.map(r => r.id));
		const gastos = todosLosGastos.filter(g => 
			g.reservaId && reservaIds.has(g.reservaId)
		);

		// Agrupar gastos por tipo
		const gastosPorTipo = gastos.reduce((acc, gasto) => {
			const tipo = gasto.tipoGasto;
			if (!acc[tipo]) {
				acc[tipo] = { total: 0, cantidad: 0 };
			}
			acc[tipo].total += parseFloat(gasto.monto || 0);
			acc[tipo].cantidad += 1;
			return acc;
		}, {});

		// Vehículos asociados
		const vehiculosSet = new Set();
		reservas.forEach((r) => {
			if (r.vehiculo_asignado) {
				vehiculosSet.add(
					JSON.stringify({
						id: r.vehiculo_asignado.id,
						patente: r.vehiculo_asignado.patente,
						marca: r.vehiculo_asignado.marca,
						modelo: r.vehiculo_asignado.modelo,
					})
				);
			}
		});
		const vehiculosAsociados = Array.from(vehiculosSet).map((v) =>
			JSON.parse(v)
		);

		res.json({
			success: true,
			conductor: {
				id: conductor.id,
				nombre: conductor.nombre,
				rut: conductor.rut,
				telefono: conductor.telefono,
				email: conductor.email,
			},
			reservas: reservas.map((r) => ({
				id: r.id,
				codigoReserva: r.codigoReserva,
				fecha: r.fecha,
				origen: r.origen,
				destino: r.destino,
				estado: r.estado,
				totalConDescuento: r.totalConDescuento,
				vehiculo: r.vehiculo_asignado
					? {
							id: r.vehiculo_asignado.id,
							patente: r.vehiculo_asignado.patente,
							marca: r.vehiculo_asignado.marca,
							modelo: r.vehiculo_asignado.modelo,
					  }
					: null,
			})),
			gastos: gastos.map((g) => ({
				id: g.id,
				tipoGasto: g.tipoGasto,
				monto: g.monto,
				fecha: g.fecha,
				descripcion: g.descripcion,
				reserva: g.reserva
					? {
							id: g.reserva.id,
							codigoReserva: g.reserva.codigoReserva,
							fecha: g.reserva.fecha,
					  }
					: null,
			})),
			gastosPorTipo,
			vehiculosAsociados,
			totalReservas: reservas.length,
			totalIngresos: reservas.reduce(
				(sum, r) => sum + parseFloat(r.totalConDescuento || 0),
				0
			),
			totalGastos: gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0),
		});
	} catch (error) {
		console.error("Error al obtener estadísticas del conductor:", error);
		res.status(500).json({
			success: false,
			error: "Error al obtener estadísticas del conductor",
		});
	}
});

// ==========================================
// ENDPOINTS DE PRODUCTOS
// ==========================================

/**
 * GET /api/productos
 * Listar todos los productos disponibles
 * Filtros opcionales: categoria, disponible
 */
const limpiarListaTexto = (lista) =>
	lista
		.map((item) =>
			item !== undefined && item !== null ? String(item).trim() : ""
		)
		.filter((item) => item.length > 0);

const normalizarListaFlexible = (valor) => {
	if (valor === undefined || valor === null) {
		return null;
	}

	if (Array.isArray(valor)) {
		const valores = limpiarListaTexto(valor);
		return valores.length > 0 ? valores : null;
	}

	if (typeof valor === "string") {
		const texto = valor.trim();
		if (!texto) {
			return null;
		}

		try {
			const posibleJson = JSON.parse(texto);
			if (Array.isArray(posibleJson)) {
				const valores = limpiarListaTexto(posibleJson);
				return valores.length > 0 ? valores : null;
			}
		} catch {
			// Ignorar errores de parseo y continuar con la lógica por defecto
		}

		const valores = limpiarListaTexto(texto.split(/[,;\n]/));
		return valores.length > 0 ? valores : null;
	}

	if (typeof valor === "object") {
		const valores = limpiarListaTexto(Object.values(valor));
		return valores.length > 0 ? valores : null;
	}

	return null;
};

const normalizarBooleano = (valor, predeterminado = true) => {
	if (valor === undefined || valor === null) {
		return predeterminado;
	}

	if (typeof valor === "boolean") {
		return valor;
	}

	if (typeof valor === "number") {
		return valor === 1;
	}

	if (typeof valor === "string") {
		const texto = valor.trim().toLowerCase();
		if (["true", "1", "si", "sí", "on"].includes(texto)) {
			return true;
		}
		if (["false", "0", "no", "off"].includes(texto)) {
			return false;
		}
	}

	return predeterminado;
};

app.get("/api/productos", async (req, res) => {
	try {
		const { categoria, disponible } = req.query;
		const where = {};

		if (categoria) {
			where.categoria = categoria;
		}

		if (disponible !== undefined) {
			where.disponible = normalizarBooleano(disponible);
		}

		const productos = await Producto.findAll({
			where,
			order: [
				[sequelize.literal("orden IS NULL"), "ASC"],
				["orden", "ASC"],
				["nombre", "ASC"],
			],
		});

		res.json({
			success: true,
			productos,
			total: productos.length,
		});
	} catch (error) {
		console.error("Error al obtener productos:", error);
		res.status(500).json({
			success: false,
			error: "Error al obtener productos",
		});
	}
});

/**
 * GET /api/productos/:id
 * Obtener detalles de un producto específico
 */
app.get("/api/productos/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const producto = await Producto.findByPk(id);

		if (!producto) {
			return res.status(404).json({
				success: false,
				error: "Producto no encontrado",
			});
		}

		res.json({
			success: true,
			producto,
		});
	} catch (error) {
		console.error("Error al obtener producto:", error);
		res.status(500).json({
			success: false,
			error: "Error al obtener producto",
		});
	}
});

/**
 * POST /api/productos
 * Crear un nuevo producto para el catálogo
 */
app.post("/api/productos", authAdmin, async (req, res) => {
	try {
		const {
			nombre,
			descripcion = "",
			categoria = "general",
			precio,
			disponible = true,
			stock,
			imagenUrl,
			orden,
			disponibleEnRuta,
			disponibleEnVehiculo,
		} = req.body || {};

		const nombreNormalizado = typeof nombre === "string" ? nombre.trim() : "";
		if (!nombreNormalizado) {
			return res.status(400).json({
				success: false,
				error: "El nombre del producto es obligatorio",
			});
		}

		const existente = await Producto.findOne({
			where: sequelize.where(
				sequelize.fn("LOWER", sequelize.col("nombre")),
				nombreNormalizado.toLowerCase()
			),
		});

		if (existente) {
			return res.status(409).json({
				success: false,
				error: "Ya existe un producto con este nombre",
			});
		}

		const precioTexto =
			precio === undefined || precio === null ? "0" : String(precio).toString();
		const precioNormalizado = Number.parseFloat(precioTexto);
		if (Number.isNaN(precioNormalizado) || precioNormalizado < 0) {
			return res.status(400).json({
				success: false,
				error: "El precio debe ser un número válido mayor o igual a 0",
			});
		}

		let stockNormalizado = null;
		if (stock !== undefined) {
			if (stock === null || stock === "") {
				stockNormalizado = null;
			} else {
				const stockNumero = Number.parseInt(stock, 10);
				if (Number.isNaN(stockNumero) || stockNumero < 0) {
					return res.status(400).json({
						success: false,
						error: "El stock debe ser un número entero mayor o igual a 0",
					});
				}
				stockNormalizado = stockNumero;
			}
		}

		let ordenNormalizado = null;
		if (orden !== undefined) {
			if (orden === null || orden === "") {
				ordenNormalizado = null;
			} else {
				const ordenNumero = Number.parseInt(orden, 10);
				if (Number.isNaN(ordenNumero)) {
					return res.status(400).json({
						success: false,
						error: "El orden debe ser un número entero válido",
					});
				}
				ordenNormalizado = ordenNumero;
			}
		}

		const producto = await Producto.create({
			nombre: nombreNormalizado,
			descripcion,
			categoria:
				typeof categoria === "string" && categoria.trim()
					? categoria.trim()
					: "general",
			precio: precioNormalizado,
			disponible: normalizarBooleano(disponible, true),
			stock: stockNormalizado,
			imagenUrl:
				typeof imagenUrl === "string" && imagenUrl.trim()
					? imagenUrl.trim()
					: null,
			orden: ordenNormalizado,
			disponibleEnRuta: normalizarListaFlexible(disponibleEnRuta),
			disponibleEnVehiculo: normalizarListaFlexible(disponibleEnVehiculo),
		});

		await producto.reload();

		res.status(201).json({
			success: true,
			mensaje: "Producto creado exitosamente",
			producto,
		});
	} catch (error) {
		console.error("Error al crear producto:", error);
		res.status(500).json({
			success: false,
			error: "Error al crear el producto",
		});
	}
});

/**
 * PUT /api/productos/:id
 * Actualizar los datos de un producto existente
 */
app.put("/api/productos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const producto = await Producto.findByPk(id);

		if (!producto) {
			return res.status(404).json({
				success: false,
				error: "Producto no encontrado",
			});
		}

		const {
			nombre,
			descripcion,
			categoria,
			precio,
			disponible,
			stock,
			imagenUrl,
			orden,
			disponibleEnRuta,
			disponibleEnVehiculo,
		} = req.body || {};

		const cambios = {};

		if (nombre !== undefined) {
			const nombreNormalizado = typeof nombre === "string" ? nombre.trim() : "";
			if (!nombreNormalizado) {
				return res.status(400).json({
					success: false,
					error: "El nombre del producto no puede quedar vacío",
				});
			}

			if (nombreNormalizado.toLowerCase() !== producto.nombre.toLowerCase()) {
				const existente = await Producto.findOne({
					where: {
						[Op.and]: [
							sequelize.where(
								sequelize.fn("LOWER", sequelize.col("nombre")),
								nombreNormalizado.toLowerCase()
							),
							{ id: { [Op.ne]: producto.id } },
						],
					},
				});

				if (existente) {
					return res.status(409).json({
						success: false,
						error: "Ya existe otro producto con este nombre",
					});
				}
			}

			cambios.nombre = nombreNormalizado;
		}

		if (descripcion !== undefined) {
			cambios.descripcion = descripcion;
		}

		if (categoria !== undefined) {
			cambios.categoria =
				typeof categoria === "string" && categoria.trim()
					? categoria.trim()
					: producto.categoria;
		}

		if (precio !== undefined) {
			const precioNumero = Number.parseFloat(String(precio));
			if (Number.isNaN(precioNumero) || precioNumero < 0) {
				return res.status(400).json({
					success: false,
					error: "El precio debe ser un número válido mayor o igual a 0",
				});
			}
			cambios.precio = precioNumero;
		}

		if (disponible !== undefined) {
			cambios.disponible = normalizarBooleano(disponible, producto.disponible);
		}

		if (stock !== undefined) {
			if (stock === null || stock === "") {
				cambios.stock = null;
			} else {
				const stockNumero = Number.parseInt(stock, 10);
				if (Number.isNaN(stockNumero) || stockNumero < 0) {
					return res.status(400).json({
						success: false,
						error: "El stock debe ser un número entero mayor o igual a 0",
					});
				}
				cambios.stock = stockNumero;
			}
		}

		if (imagenUrl !== undefined) {
			cambios.imagenUrl =
				typeof imagenUrl === "string" && imagenUrl.trim()
					? imagenUrl.trim()
					: null;
		}

		if (orden !== undefined) {
			if (orden === null || orden === "") {
				cambios.orden = null;
			} else {
				const ordenNumero = Number.parseInt(orden, 10);
				if (Number.isNaN(ordenNumero)) {
					return res.status(400).json({
						success: false,
						error: "El orden debe ser un número entero válido",
					});
				}
				cambios.orden = ordenNumero;
			}
		}

		if (disponibleEnRuta !== undefined) {
			cambios.disponibleEnRuta = normalizarListaFlexible(disponibleEnRuta);
		}

		if (disponibleEnVehiculo !== undefined) {
			cambios.disponibleEnVehiculo =
				normalizarListaFlexible(disponibleEnVehiculo);
		}

		await producto.update(cambios);
		await producto.reload();

		res.json({
			success: true,
			mensaje: "Producto actualizado exitosamente",
			producto,
		});
	} catch (error) {
		console.error("Error al actualizar producto:", error);
		res.status(500).json({
			success: false,
			error: "Error al actualizar el producto",
		});
	}
});

/**
 * DELETE /api/productos/:id
 * Eliminar un producto del catálogo (solo si no tiene reservas asociadas)
 */
app.delete("/api/productos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const producto = await Producto.findByPk(id);

		if (!producto) {
			return res.status(404).json({
				success: false,
				error: "Producto no encontrado",
			});
		}

		const reservasAsociadas = await ProductoReserva.count({
			where: { productoId: id },
		});

		if (reservasAsociadas > 0) {
			return res.status(409).json({
				success: false,
				error:
					"No es posible eliminar el producto porque está asociado a reservas existentes",
			});
		}

		await producto.destroy();

		res.json({
			success: true,
			mensaje: "Producto eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error al eliminar producto:", error);
		res.status(500).json({
			success: false,
			error: "Error al eliminar el producto",
		});
	}
});

/**
 * GET /api/reservas/:id/productos
 * Obtener todos los productos agregados a una reserva
 */
app.get("/api/reservas/:id/productos", async (req, res) => {
	try {
		const { id } = req.params;

		// Verificar que la reserva existe
		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({
				success: false,
				error: "Reserva no encontrada",
			});
		}

		// Obtener productos de la reserva con toda la información
		const productosReserva = await ProductoReserva.findAll({
			where: { reservaId: id },
			include: [
				{
					model: Producto,
					as: "producto",
				},
			],
			order: [["createdAt", "ASC"]],
		});

		// Calcular total de productos
		const totalProductos = productosReserva.reduce(
			(sum, pr) => sum + parseFloat(pr.subtotal || 0),
			0
		);

		res.json({
			success: true,
			productos: productosReserva,
			total: productosReserva.length,
			totalProductos,
		});
	} catch (error) {
		console.error("Error al obtener productos de reserva:", error);
		res.status(500).json({
			success: false,
			error: "Error al obtener productos de reserva",
		});
	}
});

/**
 * POST /api/reservas/:id/productos
 * Agregar un producto a una reserva confirmada
 */
app.post("/api/reservas/:id/productos", async (req, res) => {
	try {
		const { id } = req.params;
		const { productoId, cantidad = 1, notas } = req.body;

		// Validaciones
		if (!productoId) {
			return res.status(400).json({
				success: false,
				error: "El ID del producto es requerido",
			});
		}

		if (cantidad < 1) {
			return res.status(400).json({
				success: false,
				error: "La cantidad debe ser mayor a 0",
			});
		}

		// Verificar que la reserva existe y está en estado válido
		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({
				success: false,
				error: "Reserva no encontrada",
			});
		}

		// Verificar que la reserva está confirmada
		if (reserva.estado !== "confirmada") {
			return res.status(400).json({
				success: false,
				error: "Solo se pueden agregar productos a reservas confirmadas",
			});
		}

		// Verificar que el producto existe y está disponible
		const producto = await Producto.findByPk(productoId);
		if (!producto) {
			return res.status(404).json({
				success: false,
				error: "Producto no encontrado",
			});
		}

		if (!producto.disponible) {
			return res.status(400).json({
				success: false,
				error: "El producto no está disponible actualmente",
			});
		}

		// Verificar stock si está controlado
		if (producto.stock !== null && producto.stock < cantidad) {
			return res.status(400).json({
				success: false,
				error: `Stock insuficiente. Disponible: ${producto.stock}`,
			});
		}

		// Calcular subtotal
		const precioUnitario = parseFloat(producto.precio);
		const subtotal = precioUnitario * cantidad;

		// Agregar producto a la reserva
		const productoReserva = await ProductoReserva.create({
			reservaId: id,
			productoId,
			cantidad,
			precioUnitario,
			subtotal,
			notas: notas || null,
			estadoEntrega: "pendiente",
		});

		// Actualizar stock si está controlado
		if (producto.stock !== null) {
			await producto.update({
				stock: producto.stock - cantidad,
			});
		}

		// Obtener el producto agregado con sus detalles
		const productoAgregado = await ProductoReserva.findByPk(
			productoReserva.id,
			{
				include: [
					{
						model: Producto,
						as: "producto",
					},
				],
			}
		);

		// Calcular nuevo total de productos
		const todosProductos = await ProductoReserva.findAll({
			where: { reservaId: id },
		});
		const totalProductos = todosProductos.reduce(
			(sum, pr) => sum + parseFloat(pr.subtotal || 0),
			0
		);

		// Calcular nuevo total de la reserva (precio base + productos)
		const nuevoTotal =
			parseFloat(reserva.totalConDescuento || 0) + totalProductos;

		console.log(
			`✅ Producto agregado a reserva ${reserva.codigoReserva}: ${producto.nombre} x${cantidad}`
		);

		// NOTA: La notificación de productos NO se envía aquí al agregar cada producto.
		// Se envía solo al confirmar el pago (ver endpoint de confirmación Flow),
		// cuando ya están todos los productos agregados a la reserva.

		res.json({
			success: true,
			mensaje: "Producto agregado exitosamente",
			productoReserva: productoAgregado,
			totalProductos,
			nuevoTotalReserva: nuevoTotal,
		});
	} catch (error) {
		console.error("Error al agregar producto a reserva:", error);
		res.status(500).json({
			success: false,
			error: "Error al agregar producto a reserva",
		});
	}
});

/**
 * PUT /api/reservas/:id/productos/:productoReservaId
 * Actualizar cantidad o notas de un producto en una reserva
 */
app.put("/api/reservas/:id/productos/:productoReservaId", async (req, res) => {
	try {
		const { id, productoReservaId } = req.params;
		const { cantidad, notas, estadoEntrega } = req.body;

		// Buscar el producto en la reserva
		const productoReserva = await ProductoReserva.findOne({
			where: {
				id: productoReservaId,
				reservaId: id,
			},
			include: [
				{
					model: Producto,
					as: "producto",
				},
			],
		});

		if (!productoReserva) {
			return res.status(404).json({
				success: false,
				error: "Producto no encontrado en la reserva",
			});
		}

		// Actualizar campos
		const updates = {};

		if (cantidad !== undefined && cantidad > 0) {
			// Actualizar stock si es necesario
			const producto = productoReserva.producto;
			if (producto.stock !== null) {
				const diferencia = cantidad - productoReserva.cantidad;
				if (diferencia > 0 && producto.stock < diferencia) {
					return res.status(400).json({
						success: false,
						error: `Stock insuficiente. Disponible: ${producto.stock}`,
					});
				}
				await producto.update({
					stock: producto.stock - diferencia,
				});
			}

			updates.cantidad = cantidad;
			updates.subtotal = parseFloat(productoReserva.precioUnitario) * cantidad;
		}

		if (notas !== undefined) {
			updates.notas = notas;
		}

		if (estadoEntrega) {
			updates.estadoEntrega = estadoEntrega;
		}

		await productoReserva.update(updates);

		// Recargar con datos actualizados
		await productoReserva.reload({
			include: [
				{
					model: Producto,
					as: "producto",
				},
			],
		});

		// Calcular nuevo total de productos
		const todosProductos = await ProductoReserva.findAll({
			where: { reservaId: id },
		});
		const totalProductos = todosProductos.reduce(
			(sum, pr) => sum + parseFloat(pr.subtotal || 0),
			0
		);

		res.json({
			success: true,
			mensaje: "Producto actualizado exitosamente",
			productoReserva,
			totalProductos,
		});
	} catch (error) {
		console.error("Error al actualizar producto de reserva:", error);
		res.status(500).json({
			success: false,
			error: "Error al actualizar producto de reserva",
		});
	}
});

/**
 * DELETE /api/reservas/:id/productos/:productoReservaId
 * Eliminar un producto de una reserva
 */
app.delete(
	"/api/reservas/:id/productos/:productoReservaId",
	async (req, res) => {
		try {
			const { id, productoReservaId } = req.params;

			// Buscar el producto en la reserva
			const productoReserva = await ProductoReserva.findOne({
				where: {
					id: productoReservaId,
					reservaId: id,
				},
				include: [
					{
						model: Producto,
						as: "producto",
					},
				],
			});

			if (!productoReserva) {
				return res.status(404).json({
					success: false,
					error: "Producto no encontrado en la reserva",
				});
			}

			// Restaurar stock si está controlado
			const producto = productoReserva.producto;
			if (producto && producto.stock !== null) {
				await producto.update({
					stock: producto.stock + productoReserva.cantidad,
				});
			}

			// Eliminar el producto de la reserva
			await productoReserva.destroy();

			// Calcular nuevo total de productos
			const todosProductos = await ProductoReserva.findAll({
				where: { reservaId: id },
			});
			const totalProductos = todosProductos.reduce(
				(sum, pr) => sum + parseFloat(pr.subtotal || 0),
				0
			);

			res.json({
				success: true,
				mensaje: "Producto eliminado exitosamente",
				totalProductos,
			});
		} catch (error) {
			console.error("Error al eliminar producto de reserva:", error);
			res.status(500).json({
				success: false,
				error: "Error al eliminar producto de reserva",
			});
		}
	}
);

// --- UTILIDADES DE KEEP ALIVE ---
const scheduleKeepAlive = () => {
	const targetBase =
		process.env.RENDER_KEEP_ALIVE_URL || process.env.KEEP_ALIVE_URL || "";

	if (!targetBase) {
		return;
	}

	const normalized = targetBase.endsWith("/health")
		? targetBase
		: `${targetBase.replace(/\/$/, "")}/health`;
	const interval = Number(process.env.RENDER_KEEP_ALIVE_INTERVAL_MS || 300000);
	console.log(
		`Activando keep-alive cada ${interval / 1000}s hacia ${normalized}`
	);

	const timer = setInterval(() => {
		axios.get(normalized).catch((error) => {
			console.warn("Keep-alive fallido:", error.message);
		});
	}, interval);

	if (typeof timer.unref === "function") {
		timer.unref();
	}
};

// --- INICIALIZAR SERVIDOR ---
const PORT = process.env.PORT || 3001;

const startServer = async () => {
	try {
		await addPermitirAbonoColumn();
		await addArchivadaColumn();
		await initializeDatabase();
		console.log("📊 Base de datos MySQL conectada");

		// NOTA: Las migraciones de base de datos deben ejecutarse con el script
		// separado: npm run migrate o npm run start:migrate
		// Esto evita duplicar lógica y asegura que las migraciones se ejecuten
		// de forma controlada antes del inicio del servidor
	} catch (error) {
		console.error(
			"⚠️ Advertencia: No se pudo conectar a la base de datos:",
			error.message
		);
		console.log(
			"🔄 Continuando sin base de datos - algunas funciones estarán limitadas"
		);
	}

	app.listen(PORT, () => {
		console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
		scheduleKeepAlive();
	});
};

startServer().catch((error) => {
	console.error("❌ Error iniciando servidor:", error);
	process.exit(1);
});
