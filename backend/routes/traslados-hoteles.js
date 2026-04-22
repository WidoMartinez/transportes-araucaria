/* eslint-env node */
// Rutas para el módulo especializado Aeropuerto La Araucanía <-> Hoteles

import { Op } from "sequelize";
import TrasladoHotelAeropuerto from "../models/TrasladoHotelAeropuerto.js";
import HotelTraslado from "../models/HotelTraslado.js";
import Configuracion from "../models/Configuracion.js";

const AEROPUERTO_NOMBRE = "Aeropuerto La Araucanía";

const ESTADOS_VALIDOS = ["pendiente", "confirmada", "completada", "cancelada"];
const TIPOS_SERVICIO_VALIDOS = ["solo_ida", "ida_vuelta"];

const normalizarTexto = (value = "") => String(value || "").trim();
const esEmailValido = (email = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const fechaHoyISO = () => new Date().toISOString().split("T")[0];
const normalizarCodigo = (value = "") =>
	normalizarTexto(value)
		.toLowerCase()
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);

const obtenerCatalogoHoteles = async ({ soloActivos = true } = {}) => {
	const where = soloActivos ? { activo: true } : {};
	const hoteles = await HotelTraslado.findAll({
		where,
		order: [
			["orden", "ASC"],
			["nombre", "ASC"],
		],
	});

	return hoteles.map((hotel) => ({
		id: hotel.id,
		codigo: hotel.codigo,
		nombre: hotel.nombre,
		comuna: hotel.comuna,
		tarifaSoloIda: Number(hotel.tarifaSoloIda),
		tarifaIdaVuelta: Number(hotel.tarifaIdaVuelta),
		activo: Boolean(hotel.activo),
		orden: hotel.orden,
	}));
};

const obtenerHotelPorCodigo = async (codigo = "", { soloActivos = true } = {}) => {
	const where = {
		codigo,
		...(soloActivos ? { activo: true } : {}),
	};
	const hotel = await HotelTraslado.findOne({ where });
	if (!hotel) return null;

	return {
		id: hotel.id,
		codigo: hotel.codigo,
		nombre: hotel.nombre,
		comuna: hotel.comuna,
		tarifaSoloIda: Number(hotel.tarifaSoloIda),
		tarifaIdaVuelta: Number(hotel.tarifaIdaVuelta),
		activo: Boolean(hotel.activo),
		orden: hotel.orden,
	};
};

const generarCodigoTraslado = async () => {
	const hoy = new Date();
	const year = hoy.getFullYear();
	const month = String(hoy.getMonth() + 1).padStart(2, "0");
	const day = String(hoy.getDate()).padStart(2, "0");
	const fechaCodigo = `${year}${month}${day}`;
	const prefijo = `TH-${fechaCodigo}-`;

	const ultimaReserva = await TrasladoHotelAeropuerto.findOne({
		where: {
			codigoReserva: {
				[Op.like]: `${prefijo}%`,
			},
		},
		order: [["created_at", "DESC"]],
	});

	const ultimoCorrelativo = ultimaReserva?.codigoReserva
		? Number(String(ultimaReserva.codigoReserva).split("-").pop())
		: 0;
	const nuevoCorrelativo = Number.isFinite(ultimoCorrelativo)
		? ultimoCorrelativo + 1
		: 1;

	return `${prefijo}${String(nuevoCorrelativo).padStart(4, "0")}`;
};

const serializarCatalogo = async () => {
	const hoteles = await obtenerCatalogoHoteles({ soloActivos: true });
	return {
	aeropuerto: AEROPUERTO_NOMBRE,
	reglas: {
		desdeAeropuerto: "Permite solo ida o ida y vuelta.",
		desdeHotel: "Permite solo ida al aeropuerto (sin vuelta).",
	},
	hoteles,
	};
};

const setupTrasladosHotelesRoutes = (app, authAdmin) => {
	// Catálogo público del servicio con hoteles y tarifas fijas
	app.get("/api/traslados-hoteles/catalogo", async (_req, res) => {
		try {
			const catalogo = await serializarCatalogo();
			return res.json(catalogo);
		} catch (error) {
			console.error("❌ Error cargando catálogo Aeropuerto-Hoteles:", error);
			return res.status(500).json({
				error: "No se pudo cargar el catálogo de hoteles.",
			});
		}
	});

	// Crear reserva pública del servicio Aeropuerto-Hoteles
	app.post("/api/traslados-hoteles/reservas", async (req, res) => {
		try {
			const nombre = normalizarTexto(req.body?.nombre);
			const email = normalizarTexto(req.body?.email).toLowerCase();
			const telefono = normalizarTexto(req.body?.telefono);
			const hotelCodigo = normalizarTexto(req.body?.hotelCodigo);
			const origenTipo = normalizarTexto(req.body?.origenTipo);
			const tipoServicio = normalizarTexto(req.body?.tipoServicio || "solo_ida");
			const fechaIda = normalizarTexto(req.body?.fechaIda);
			const horaIda = normalizarTexto(req.body?.horaIda);
			const fechaVuelta = normalizarTexto(req.body?.fechaVuelta);
			const horaVuelta = normalizarTexto(req.body?.horaVuelta);
			const observaciones = normalizarTexto(req.body?.observaciones).slice(0, 500);
			const pasajeros = Number.parseInt(req.body?.pasajeros, 10) || 1;
			const sillaInfantil = Boolean(req.body?.sillaInfantil);
			const cantidadSillasInfantiles = Number.parseInt(req.body?.cantidadSillasInfantiles, 10) || 0;

			if (!nombre || !email || !telefono || !hotelCodigo || !origenTipo) {
				return res.status(400).json({
					error:
						"Faltan campos obligatorios: nombre, email, teléfono, hotel y origen.",
				});
			}

			if (!esEmailValido(email)) {
				return res.status(400).json({
					error: "El formato del email no es válido.",
				});
			}

			if (!fechaIda || !horaIda) {
				return res.status(400).json({
					error: "La fecha y hora de ida son obligatorias.",
				});
			}

			// Validaciones de anticipación y reglas de negocio
			const configAnticipacion = await Configuracion.getValorParseado("hotel_anticipacion_horas", 3);
			const fechaViaje = new Date(`${fechaIda}T${horaIda}`);
			const ahora = new Date();
			const diffHoras = (fechaViaje - ahora) / (1000 * 60 * 60);

			if (diffHoras < configAnticipacion) {
				return res.status(400).json({
					error: `Para este servicio debes reservar con al menos ${configAnticipacion} horas de anticipación.`,
				});
			}

			if (!["aeropuerto", "hotel"].includes(origenTipo)) {
				return res.status(400).json({
					error: "El origen debe ser 'aeropuerto' o 'hotel'.",
				});
			}

			if (!TIPOS_SERVICIO_VALIDOS.includes(tipoServicio)) {
				return res.status(400).json({
					error: "Tipo de servicio inválido.",
				});
			}

			const configMaxPax = await Configuracion.getValorParseado("hotel_max_pasajeros", 8);
			if (pasajeros < 1 || pasajeros > configMaxPax) {
				return res.status(400).json({
					error: `Este servicio permite entre 1 y ${configMaxPax} pasajeros.`,
				});
			}

			const hotel = await obtenerHotelPorCodigo(hotelCodigo, { soloActivos: true });
			if (!hotel) {
				return res.status(400).json({
					error:
						"El hotel seleccionado no existe o está desactivado en el catálogo.",
				});
			}

			// Regla de negocio solicitada por el cliente:
			// si parte desde el hotel, solo se permite ida (sin vuelta).
			if (origenTipo === "hotel" && tipoServicio !== "solo_ida") {
				return res.status(400).json({
					error: "Desde hotel solo se permite reserva de ida al aeropuerto.",
				});
			}

			if (tipoServicio === "ida_vuelta") {
				if (origenTipo !== "aeropuerto") {
					return res.status(400).json({
						error:
							"La modalidad ida y vuelta está disponible solo cuando el viaje inicia en aeropuerto.",
					});
				}
				if (!fechaVuelta || !horaVuelta) {
					return res.status(400).json({
						error:
							"Para ida y vuelta debes indicar fecha y hora de retorno desde el hotel.",
					});
				}
				if (fechaVuelta < fechaIda) {
					return res.status(400).json({
						error: "La fecha de vuelta no puede ser anterior a la fecha de ida.",
					});
				}
			}

			const configSillas = await Configuracion.getValorParseado("config_sillas", { precioPorSilla: 5000 });
			const configPrecioSilla = Number(configSillas?.precioPorSilla) || 5000;
			const baseMonto =
				tipoServicio === "ida_vuelta"
					? hotel.tarifaIdaVuelta
					: hotel.tarifaSoloIda;

			const extraSillas = sillaInfantil ? (Number(cantidadSillasInfantiles) || 0) * configPrecioSilla : 0;
			const montoTotal = Number(baseMonto) + extraSillas;

			const origen =
				origenTipo === "aeropuerto" ? AEROPUERTO_NOMBRE : hotel.nombre;
			const destino =
				origenTipo === "aeropuerto" ? hotel.nombre : AEROPUERTO_NOMBRE;

			const codigoReserva = await generarCodigoTraslado();

			const reservaCreada = await TrasladoHotelAeropuerto.create({
				codigoReserva,
				nombre,
				email,
				telefono,
				hotelCodigo: hotel.codigo,
				hotelNombre: hotel.nombre,
				origenTipo,
				origen,
				destino,
				tipoServicio,
				fechaIda,
				horaIda,
				fechaVuelta: tipoServicio === "ida_vuelta" ? fechaVuelta : null,
				horaVuelta: tipoServicio === "ida_vuelta" ? horaVuelta : null,
				pasajeros,
				sillaInfantil: !!sillaInfantil,
				cantidadSillasInfantiles: sillaInfantil ? (Number(cantidadSillasInfantiles) || 0) : 0,
				montoTotal,
				moneda: "CLP",
				observaciones: observaciones || null,
				estado: "pendiente",
				// Se guarda como cotizador hasta que el pago sea confirmado
				source: "cotizador",
			});

			return res.status(201).json({
				success: true,
				message: "Cotización registrada. Completa el pago para confirmar tu reserva.",
				reserva: {
					id: reservaCreada.id,
					codigoReserva: reservaCreada.codigoReserva,
					hotel: reservaCreada.hotelNombre,
					origen: reservaCreada.origen,
					destino: reservaCreada.destino,
					tipoServicio: reservaCreada.tipoServicio,
					montoTotal: Number(reservaCreada.montoTotal),
					estado: reservaCreada.estado,
				},
			});
		} catch (error) {
			console.error("❌ Error creando reserva Aeropuerto-Hoteles:", error);
			return res.status(500).json({
				error: "No se pudo crear la reserva. Intenta nuevamente.",
			});
		}
	});

	// Listado administrativo especializado
	app.get(
		"/api/admin/traslados-hoteles/reservas",
		authAdmin,
		async (req, res) => {
			try {
				const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
				const limit = Math.min(
					Math.max(Number.parseInt(req.query.limit, 10) || 20, 1),
					100,
				);
				const offset = (page - 1) * limit;

				const where = {};
				const estado = normalizarTexto(req.query.estado);
				const hotelCodigo = normalizarTexto(req.query.hotelCodigo);
				const q = normalizarTexto(req.query.q);

				if (estado && ESTADOS_VALIDOS.includes(estado)) {
					where.estado = estado;
				}

				if (hotelCodigo) {
					where.hotelCodigo = hotelCodigo;
				}

				if (q) {
					where[Op.or] = [
						{ codigoReserva: { [Op.like]: `%${q}%` } },
						{ nombre: { [Op.like]: `%${q}%` } },
						{ email: { [Op.like]: `%${q}%` } },
						{ telefono: { [Op.like]: `%${q}%` } },
					];
				}

				const sourceFiltro = normalizarTexto(req.query.source);
				const SOURCES_VALIDOS = ["cotizador", "web_hoteles", "admin"];
				if (sourceFiltro && SOURCES_VALIDOS.includes(sourceFiltro)) {
					where.source = sourceFiltro;
				}

				const estadoPagoFiltro = normalizarTexto(req.query.estadoPago);
				const ESTADOS_PAGO_VALIDOS = ["pendiente", "aprobado", "pagado", "fallido", "reembolsado"];
				if (estadoPagoFiltro && ESTADOS_PAGO_VALIDOS.includes(estadoPagoFiltro)) {
					where.estadoPago = estadoPagoFiltro;
				}

				const fechaDesde = normalizarTexto(req.query.fechaDesde);
				const fechaHasta = normalizarTexto(req.query.fechaHasta);
				if (fechaDesde || fechaHasta) {
					where.fechaIda = {};
					if (fechaDesde) where.fechaIda[Op.gte] = fechaDesde;
					if (fechaHasta) where.fechaIda[Op.lte] = fechaHasta;
				}

				const { count, rows } = await TrasladoHotelAeropuerto.findAndCountAll({
					where,
					limit,
					offset,
					order: [["created_at", "DESC"]],
				});

				const resumenEstado = await TrasladoHotelAeropuerto.findAll({
					attributes: [
						"estado",
						[
							TrasladoHotelAeropuerto.sequelize.fn(
								"COUNT",
								TrasladoHotelAeropuerto.sequelize.col("id"),
							),
							"total",
						],
					],
					group: ["estado"],
					raw: true,
				});

				const resumen = {
					total: count,
					pendiente: 0,
					confirmada: 0,
					completada: 0,
					cancelada: 0,
				};

				resumenEstado.forEach((item) => {
					const estadoItem = String(item.estado || "");
					if (Object.prototype.hasOwnProperty.call(resumen, estadoItem)) {
						resumen[estadoItem] = Number(item.total) || 0;
					}
				});

				// Conteo global de cotizadores (sin importar filtros activos)
				const totalCotizadores = await TrasladoHotelAeropuerto.count({
					where: { source: "cotizador" },
				});
				const totalReservasConfirmadas = await TrasladoHotelAeropuerto.count({
					where: { source: "web_hoteles" },
				});

				return res.json({
					page,
					limit,
					total: count,
					totalPages: Math.max(Math.ceil(count / limit), 1),
					resumen,
					totalCotizadores,
					totalReservasConfirmadas,
					hoteles: await obtenerCatalogoHoteles({ soloActivos: false }),
					reservas: rows,
				});
			} catch (error) {
				console.error("❌ Error listando reservas Aeropuerto-Hoteles:", error);
				return res.status(500).json({
					error: "No se pudo obtener el listado del módulo Aeropuerto-Hoteles.",
				});
			}
		},
	);

	// Listado administrativo de hoteles/tarifas del módulo
	app.get("/api/admin/traslados-hoteles/hoteles", authAdmin, async (_req, res) => {
		try {
			const hoteles = await obtenerCatalogoHoteles({ soloActivos: false });
			return res.json({ hoteles });
		} catch (error) {
			console.error("❌ Error listando hoteles de traslados:", error);
			return res.status(500).json({
				error: "No se pudo obtener el catálogo de hoteles.",
			});
		}
	});

	// Crear hotel con tarifas fijas para el módulo
	app.post("/api/admin/traslados-hoteles/hoteles", authAdmin, async (req, res) => {
		try {
			const nombre = normalizarTexto(req.body?.nombre);
			const comuna = normalizarTexto(req.body?.comuna);
			const codigoInput = normalizarTexto(req.body?.codigo);
			const codigo = normalizarCodigo(codigoInput || nombre);
			const orden = Number.parseInt(req.body?.orden, 10) || 0;
			const tarifaSoloIda = Number.parseFloat(req.body?.tarifaSoloIda);
			const tarifaIdaVuelta = Number.parseFloat(req.body?.tarifaIdaVuelta);
			const activo = req.body?.activo !== false;

			if (!nombre || !comuna || !codigo) {
				return res.status(400).json({
					error: "Nombre, comuna y código son obligatorios.",
				});
			}

			if (
				!Number.isFinite(tarifaSoloIda) ||
				!Number.isFinite(tarifaIdaVuelta) ||
				tarifaSoloIda <= 0 ||
				tarifaIdaVuelta <= 0
			) {
				return res.status(400).json({
					error: "Las tarifas deben ser números mayores a 0.",
				});
			}

			if (tarifaIdaVuelta < tarifaSoloIda) {
				return res.status(400).json({
					error:
						"La tarifa ida y vuelta no puede ser menor que la tarifa solo ida.",
				});
			}

			const existe = await HotelTraslado.findOne({ where: { codigo } });
			if (existe) {
				return res.status(400).json({
					error: "Ya existe un hotel con ese código.",
				});
			}

			const hotel = await HotelTraslado.create({
				codigo,
				nombre,
				comuna,
				tarifaSoloIda,
				tarifaIdaVuelta,
				activo,
				orden,
			});

			return res.status(201).json({
				success: true,
				message: "Hotel creado correctamente.",
				hotel,
			});
		} catch (error) {
			console.error("❌ Error creando hotel de traslados:", error);
			return res.status(500).json({
				error: "No se pudo crear el hotel.",
			});
		}
	});

	// Actualizar hotel/tarifas del módulo
	app.put(
		"/api/admin/traslados-hoteles/hoteles/:id",
		authAdmin,
		async (req, res) => {
			try {
				const id = Number.parseInt(req.params.id, 10);
				if (!Number.isFinite(id)) {
					return res.status(400).json({ error: "ID de hotel inválido." });
				}

				const hotel = await HotelTraslado.findByPk(id);
				if (!hotel) {
					return res.status(404).json({ error: "Hotel no encontrado." });
				}

				const nombre = normalizarTexto(req.body?.nombre);
				const comuna = normalizarTexto(req.body?.comuna);
				const codigoInput = normalizarTexto(req.body?.codigo);
				const codigo = normalizarCodigo(codigoInput || hotel.codigo);
				const orden = Number.parseInt(req.body?.orden, 10) || 0;
				const tarifaSoloIda = Number.parseFloat(req.body?.tarifaSoloIda);
				const tarifaIdaVuelta = Number.parseFloat(req.body?.tarifaIdaVuelta);
				const activo = req.body?.activo !== false;

				if (!nombre || !comuna || !codigo) {
					return res.status(400).json({
						error: "Nombre, comuna y código son obligatorios.",
					});
				}

				if (
					!Number.isFinite(tarifaSoloIda) ||
					!Number.isFinite(tarifaIdaVuelta) ||
					tarifaSoloIda <= 0 ||
					tarifaIdaVuelta <= 0
				) {
					return res.status(400).json({
						error: "Las tarifas deben ser números mayores a 0.",
					});
				}

				if (tarifaIdaVuelta < tarifaSoloIda) {
					return res.status(400).json({
						error:
							"La tarifa ida y vuelta no puede ser menor que la tarifa solo ida.",
					});
				}

				const existeCodigo = await HotelTraslado.findOne({
					where: {
						codigo,
						id: { [Op.ne]: id },
					},
				});
				if (existeCodigo) {
					return res.status(400).json({
						error: "Ya existe otro hotel con ese código.",
					});
				}

				await hotel.update({
					nombre,
					comuna,
					codigo,
					tarifaSoloIda,
					tarifaIdaVuelta,
					activo,
					orden,
				});

				return res.json({
					success: true,
					message: "Hotel actualizado correctamente.",
					hotel,
				});
			} catch (error) {
				console.error("❌ Error actualizando hotel de traslados:", error);
				return res.status(500).json({
					error: "No se pudo actualizar el hotel.",
				});
			}
		},
	);

	// Detalle completo de una reserva (admin)
	app.get(
		"/api/admin/traslados-hoteles/reservas/:id",
		authAdmin,
		async (req, res) => {
			try {
				const id = Number.parseInt(req.params.id, 10);
				if (!Number.isFinite(id)) {
					return res.status(400).json({ error: "ID de reserva inválido." });
				}
				const reserva = await TrasladoHotelAeropuerto.findByPk(id);
				if (!reserva) {
					return res.status(404).json({ error: "Reserva no encontrada." });
				}
				return res.json({ reserva });
			} catch (error) {
				console.error("❌ Error obteniendo detalle reserva hotel:", error);
				return res.status(500).json({ error: "No se pudo obtener la reserva." });
			}
		},
	);

	// Crear reserva desde el panel admin (sin restricción de anticipación)
	app.post(
		"/api/admin/traslados-hoteles/reservas",
		authAdmin,
		async (req, res) => {
			try {
				const nombre = normalizarTexto(req.body?.nombre);
				const email = normalizarTexto(req.body?.email).toLowerCase();
				const telefono = normalizarTexto(req.body?.telefono);
				const hotelCodigo = normalizarTexto(req.body?.hotelCodigo);
				const origenTipo = normalizarTexto(req.body?.origenTipo);
				const tipoServicio = normalizarTexto(req.body?.tipoServicio || "solo_ida");
				const fechaIda = normalizarTexto(req.body?.fechaIda);
				const horaIda = normalizarTexto(req.body?.horaIda);
				const fechaVuelta = normalizarTexto(req.body?.fechaVuelta);
				const horaVuelta = normalizarTexto(req.body?.horaVuelta);
				const observaciones = normalizarTexto(req.body?.observaciones).slice(0, 500);
				const pasajeros = Number.parseInt(req.body?.pasajeros, 10) || 1;
				const sillaInfantil = Boolean(req.body?.sillaInfantil);
				const cantidadSillasInfantiles = Number.parseInt(req.body?.cantidadSillasInfantiles, 10) || 0;
				const montoManual = req.body?.montoTotal != null ? Number(req.body.montoTotal) : null;

				if (!nombre || !email || !telefono || !hotelCodigo || !origenTipo) {
					return res.status(400).json({ error: "Faltan campos obligatorios." });
				}
				if (!esEmailValido(email)) {
					return res.status(400).json({ error: "El formato del email no es válido." });
				}
				if (!fechaIda || !horaIda) {
					return res.status(400).json({ error: "La fecha y hora de ida son obligatorias." });
				}
				if (!["aeropuerto", "hotel"].includes(origenTipo)) {
					return res.status(400).json({ error: "El origen debe ser 'aeropuerto' o 'hotel'." });
				}
				if (!TIPOS_SERVICIO_VALIDOS.includes(tipoServicio)) {
					return res.status(400).json({ error: "Tipo de servicio inválido." });
				}
				if (origenTipo === "hotel" && tipoServicio !== "solo_ida") {
					return res.status(400).json({ error: "Desde hotel solo se permite ida al aeropuerto." });
				}
				if (tipoServicio === "ida_vuelta" && (!fechaVuelta || !horaVuelta)) {
					return res.status(400).json({ error: "Para ida y vuelta se requiere fecha y hora de vuelta." });
				}

				const hotel = await obtenerHotelPorCodigo(hotelCodigo, { soloActivos: false });
				if (!hotel) {
					return res.status(400).json({ error: "Hotel no encontrado en el catálogo." });
				}

				const configSillas = await Configuracion.getValorParseado("config_sillas", { precioPorSilla: 5000 });
				const configPrecioSilla = Number(configSillas?.precioPorSilla) || 5000;
				const baseMonto = tipoServicio === "ida_vuelta" ? hotel.tarifaIdaVuelta : hotel.tarifaSoloIda;
				const extraSillas = sillaInfantil ? (Number(cantidadSillasInfantiles) || 0) * configPrecioSilla : 0;
				const montoTotal = montoManual != null && montoManual > 0 ? montoManual : Number(baseMonto) + extraSillas;

				const origen = origenTipo === "aeropuerto" ? AEROPUERTO_NOMBRE : hotel.nombre;
				const destino = origenTipo === "aeropuerto" ? hotel.nombre : AEROPUERTO_NOMBRE;
				const codigoReserva = await generarCodigoTraslado();

				const reservaCreada = await TrasladoHotelAeropuerto.create({
					codigoReserva,
					nombre,
					email,
					telefono,
					hotelCodigo: hotel.codigo,
					hotelNombre: hotel.nombre,
					origenTipo,
					origen,
					destino,
					tipoServicio,
					fechaIda,
					horaIda,
					fechaVuelta: tipoServicio === "ida_vuelta" ? fechaVuelta : null,
					horaVuelta: tipoServicio === "ida_vuelta" ? horaVuelta : null,
					pasajeros,
					sillaInfantil: !!sillaInfantil,
					cantidadSillasInfantiles: sillaInfantil ? (Number(cantidadSillasInfantiles) || 0) : 0,
					montoTotal,
					moneda: "CLP",
					observaciones: observaciones || null,
					estado: "confirmada",
					source: "admin",
				});

				return res.status(201).json({
					success: true,
					message: "Reserva creada desde admin.",
					reserva: reservaCreada,
				});
			} catch (error) {
				console.error("❌ Error creando reserva hotel desde admin:", error);
				return res.status(500).json({ error: "No se pudo crear la reserva." });
			}
		},
	);

	// Actualizar datos de una reserva (admin)
	app.put(
		"/api/admin/traslados-hoteles/reservas/:id",
		authAdmin,
		async (req, res) => {
			try {
				const id = Number.parseInt(req.params.id, 10);
				if (!Number.isFinite(id)) {
					return res.status(400).json({ error: "ID de reserva inválido." });
				}
				const reserva = await TrasladoHotelAeropuerto.findByPk(id);
				if (!reserva) {
					return res.status(404).json({ error: "Reserva no encontrada." });
				}

				const campos = {};
				const { nombre, email, telefono, pasajeros, sillaInfantil,
					cantidadSillasInfantiles, fechaIda, horaIda, fechaVuelta,
					horaVuelta, observaciones, montoTotal, hotelCodigo, tipoServicio, origenTipo,
					source } = req.body || {};

				if (nombre !== undefined) campos.nombre = normalizarTexto(nombre);
				if (email !== undefined) {
					const emailNorm = normalizarTexto(email).toLowerCase();
					if (!esEmailValido(emailNorm)) return res.status(400).json({ error: "Email inválido." });
					campos.email = emailNorm;
				}
				if (telefono !== undefined) campos.telefono = normalizarTexto(telefono);
				if (pasajeros !== undefined) campos.pasajeros = Number.parseInt(pasajeros, 10) || 1;
				if (sillaInfantil !== undefined) campos.sillaInfantil = Boolean(sillaInfantil);
				if (cantidadSillasInfantiles !== undefined) campos.cantidadSillasInfantiles = Number.parseInt(cantidadSillasInfantiles, 10) || 0;
				if (fechaIda !== undefined) campos.fechaIda = normalizarTexto(fechaIda);
				if (horaIda !== undefined) campos.horaIda = normalizarTexto(horaIda);
				if (fechaVuelta !== undefined) campos.fechaVuelta = normalizarTexto(fechaVuelta) || null;
				if (horaVuelta !== undefined) campos.horaVuelta = normalizarTexto(horaVuelta) || null;
				if (observaciones !== undefined) campos.observaciones = normalizarTexto(observaciones).slice(0, 500) || null;
				if (montoTotal !== undefined && Number(montoTotal) > 0) campos.montoTotal = Number(montoTotal);

				const SOURCES_PERMITIDOS = ["cotizador", "web_hoteles", "admin"];
				if (source !== undefined && SOURCES_PERMITIDOS.includes(normalizarTexto(source))) {
					campos.source = normalizarTexto(source);
				}

				if (hotelCodigo !== undefined) {
					const hotel = await obtenerHotelPorCodigo(normalizarTexto(hotelCodigo), { soloActivos: false });
					if (!hotel) return res.status(400).json({ error: "Hotel no encontrado." });
					campos.hotelCodigo = hotel.codigo;
					campos.hotelNombre = hotel.nombre;
					const tipoSvc = tipoServicio || reserva.tipoServicio;
					const origenT = origenTipo || reserva.origenTipo;
					campos.origen = origenT === "aeropuerto" ? AEROPUERTO_NOMBRE : hotel.nombre;
					campos.destino = origenT === "aeropuerto" ? hotel.nombre : AEROPUERTO_NOMBRE;
					campos.tipoServicio = tipoSvc;
					campos.origenTipo = origenT;
				}

				await reserva.update(campos);
				return res.json({ success: true, message: "Reserva actualizada.", reserva });
			} catch (error) {
				console.error("❌ Error actualizando reserva hotel:", error);
				return res.status(500).json({ error: "No se pudo actualizar la reserva." });
			}
		},
	);

	// Actualizar estado de pago de una reserva (admin)
	app.patch(
		"/api/admin/traslados-hoteles/reservas/:id/pago",
		authAdmin,
		async (req, res) => {
			try {
				const id = Number.parseInt(req.params.id, 10);
				if (!Number.isFinite(id)) {
					return res.status(400).json({ error: "ID de reserva inválido." });
				}
				const reserva = await TrasladoHotelAeropuerto.findByPk(id);
				if (!reserva) {
					return res.status(404).json({ error: "Reserva no encontrada." });
				}

				const ESTADOS_PAGO = ["pendiente", "aprobado", "pagado", "fallido", "reembolsado"];
				const estadoPago = normalizarTexto(req.body?.estadoPago);
				if (!ESTADOS_PAGO.includes(estadoPago)) {
					return res.status(400).json({ error: "Estado de pago inválido." });
				}

				const campos = /** @type {Record<string, unknown>} */ ({ estadoPago });
				if (req.body?.metodoPago !== undefined) campos.metodoPago = normalizarTexto(req.body.metodoPago) || null;
				if (req.body?.pagoId !== undefined) campos.pagoId = normalizarTexto(req.body.pagoId) || null;
				if (req.body?.pagoGateway !== undefined) campos.pagoGateway = normalizarTexto(req.body.pagoGateway) || null;
				if (req.body?.pagoMonto !== undefined && Number(req.body.pagoMonto) > 0) {
					campos.pagoMonto = Number(req.body.pagoMonto);
				}
				if (estadoPago === "pagado" && !reserva.pagoFecha) {
					campos.pagoFecha = new Date();
				}

				await reserva.update(campos);
				return res.json({ success: true, message: `Pago actualizado a ${estadoPago}.`, reserva });
			} catch (error) {
				console.error("❌ Error actualizando pago reserva hotel:", error);
				return res.status(500).json({ error: "No se pudo actualizar el pago." });
			}
		},
	);

	// Cambio de estado administrativo dedicado
	app.patch(
		"/api/admin/traslados-hoteles/reservas/:id/estado",
		authAdmin,
		async (req, res) => {
			try {
				const id = Number.parseInt(req.params.id, 10);
				const estado = normalizarTexto(req.body?.estado);

				if (!Number.isFinite(id)) {
					return res.status(400).json({ error: "ID de reserva inválido." });
				}

				if (!ESTADOS_VALIDOS.includes(estado)) {
					return res.status(400).json({ error: "Estado inválido." });
				}

				const reserva = await TrasladoHotelAeropuerto.findByPk(id);
				if (!reserva) {
					return res.status(404).json({ error: "Reserva no encontrada." });
				}

				await reserva.update({ estado });

				return res.json({
					success: true,
					message: `Estado actualizado a ${estado}.`,
					reserva,
				});
			} catch (error) {
				console.error("❌ Error actualizando estado Aeropuerto-Hoteles:", error);
				return res.status(500).json({
					error: "No se pudo actualizar el estado de la reserva.",
				});
			}
		},
	);
};

export default setupTrasladosHotelesRoutes;
