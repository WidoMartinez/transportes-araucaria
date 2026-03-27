/**
 * PricingService.js
 * Servicio centralizado de cálculo de precios para Transportes Araucanía.
 *
 * RESPONSABILIDAD ÚNICA: toda la lógica de precios vive aquí, tanto para
 * cotizaciones del frontend como para validación al momento de crear una reserva.
 *
 * Reemplaza el useMemo `pricing` disperso en App.jsx y el proceso asíncrono
 * de tarifa dinámica con debounce, unificando el cálculo en una sola función.
 */

import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Destino from "../models/Destino.js";
import DescuentoGlobal from "../models/DescuentoGlobal.js";
import Promocion from "../models/Promocion.js";
import CodigoDescuento from "../models/CodigoDescuento.js";
import Configuracion from "../models/Configuracion.js";
import ConfiguracionTarifaDinamica from "../models/ConfiguracionTarifaDinamica.js";
import Festivo from "../models/Festivo.js";

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Porcentaje máximo de descuento permitido sobre el precio base (75%) */
const LIMITE_DESCUENTO = 0.75;

/** Porcentaje de abono inicial sobre el total (40%) */
const PORCENTAJE_ABONO = 0.4;

// ─── Utilidades internas ─────────────────────────────────────────────────────

/**
 * Convierte un valor a número finito, devolviendo `fallback` si falla.
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
const toNum = (value, fallback = 0) => {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
};

/**
 * Verifica si una hora (HH:MM) está dentro de un rango (puede cruzar medianoche).
 * @param {string} hora   - Hora a evaluar "HH:MM"
 * @param {string} inicio - Hora de inicio "HH:MM"
 * @param {string} fin    - Hora de fin "HH:MM"
 * @returns {boolean}
 */
const horaEnRango = (hora, inicio, fin) => {
	const h = hora.substring(0, 5);
	const i = inicio.substring(0, 5);
	const f = fin.substring(0, 5);
	// Rango que cruza medianoche (ej: 22:00 - 06:00)
	if (i > f) return h >= i || h <= f;
	return h >= i && h <= f;
};

/**
 * Normaliza un array JSON que puede venir como string o como array.
 * @param {*} valor
 * @returns {Array}
 */
const normalizarArray = (valor) => {
	if (!valor) return [];
	if (Array.isArray(valor)) return valor;
	try {
		const parsed = JSON.parse(valor);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

// ─── Cálculo de precio base por vehículo ─────────────────────────────────────

/**
 * Calcula el precio base de un tramo según destino, cantidad de pasajeros y
 * si el usuario solicitó upgrade a Van.
 *
 * @param {object} destinoInfo  - Objeto con campos `precios`, `maxPasajeros`
 * @param {number} pasajeros    - Cantidad de pasajeros
 * @param {boolean} upgradeVan  - Si el usuario eligió Van voluntariamente (1-3 pax)
 * @returns {{ precio: number|null, vehiculo: string, esUpgradeVan: boolean }}
 */
export const calcularPrecioBase = (destinoInfo, pasajeros, upgradeVan = false) => {
	const pax = parseInt(pasajeros, 10);

	if (!destinoInfo || !Number.isFinite(pax) || pax <= 0) {
		return { precio: null, vehiculo: null, esUpgradeVan: false };
	}

	const maxPax = destinoInfo.maxPasajeros || 4;
	const preciosAuto = destinoInfo.precios?.auto;
	const preciosVan = destinoInfo.precios?.van;

	if (pax >= 1 && pax <= 3) {
		if (upgradeVan) {
			// Upgrade voluntario: precio base de van sin escala por pasajeros adicionales
			if (!preciosVan) return { precio: null, vehiculo: "Van de Pasajeros (Upgrade)", esUpgradeVan: true };
			return {
				precio: Math.round(toNum(preciosVan.base)),
				vehiculo: "Van de Pasajeros (Upgrade)",
				esUpgradeVan: true,
			};
		}
		// Sedán: precio base + porcentaje adicional por cada pasajero desde el 2do
		if (!preciosAuto) return { precio: null, vehiculo: "Sedán", esUpgradeVan: false };
		const base = toNum(preciosAuto.base);
		const pctAdicional = toNum(preciosAuto.porcentajeAdicional, 0.1);
		const adicionales = pax - 1;
		return {
			precio: Math.round(base + adicionales * base * pctAdicional),
			vehiculo: "Sedán",
			esUpgradeVan: false,
		};
	}

	if (pax >= 4 && pax <= maxPax) {
		// Van obligatoria: precio base van + porcentaje adicional por cada pasajero desde el 5to
		if (!preciosVan) return { precio: null, vehiculo: "Van (Consultar)", esUpgradeVan: false };
		const base = toNum(preciosVan.base);
		const pctAdicional = toNum(preciosVan.porcentajeAdicional, 0.1);
		const adicionales = pax - 4;
		return {
			precio: Math.round(base + adicionales * base * pctAdicional),
			vehiculo: "Van de Pasajeros",
			esUpgradeVan: false,
		};
	}

	return { precio: null, vehiculo: "Consultar disponibilidad", esUpgradeVan: false };
};

// ─── Cálculo de tarifa dinámica ───────────────────────────────────────────────

/**
 * Aplica los ajustes de tarifa dinámica (anticipación, día semana, horario, festivo)
 * a un precio base dado.
 *
 * @param {number}  precioBase
 * @param {string}  destino    - Nombre del destino (para exclusiones)
 * @param {string}  fecha      - Formato YYYY-MM-DD
 * @param {string}  [hora]     - Formato HH:MM (opcional)
 * @returns {Promise<{ precioAjustado: number, ajustes: Array, porcentajeTotal: number }>}
 */
export const calcularTarifaDinamica = async (precioBase, destino, fecha, hora) => {
	const ajustes = [];
	let porcentajeTotal = 0;

	try {
		// Parsear fecha evitando problemas de zona horaria
		const [year, month, day] = fecha.split("-").map(Number);
		const fechaViaje = new Date(year, month - 1, day);
		const diaSemana = fechaViaje.getDay();

		// Calcular días de anticipación basándose solo en la fecha (sin hora)
		const ahora = new Date();
		const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
		const diasAnticipacion = Math.floor((fechaViaje - hoyInicio) / (1000 * 60 * 60 * 24));

		// Verificar festivo
		const festivo = await Festivo.findOne({
			where: {
				activo: true,
				[Op.or]: [
					{ fecha },
					{
						recurrente: true,
						[Op.and]: sequelize.where(
							sequelize.fn("DATE_FORMAT", sequelize.col("fecha"), "%m-%d"),
							sequelize.fn("DATE_FORMAT", fecha, "%m-%d"),
						),
					},
				],
			},
		});

		if (festivo?.porcentajeRecargo) {
			ajustes.push({
				nombre: `Festivo: ${festivo.nombre}`,
				tipo: "festivo",
				porcentaje: parseFloat(festivo.porcentajeRecargo),
				detalle: festivo.nombre,
			});
			porcentajeTotal += parseFloat(festivo.porcentajeRecargo);
		}

		// Obtener configuraciones activas ordenadas por prioridad
		const configuraciones = await ConfiguracionTarifaDinamica.findAll({
			where: { activo: true },
			order: [["prioridad", "DESC"]],
		});

		for (const config of configuraciones) {
			// Omitir si el destino está excluido
			const excluidos = Array.isArray(config.destinosExcluidos) ? config.destinosExcluidos : [];
			if (excluidos.includes(destino)) continue;

			let aplica = false;
			let detalle = "";

			switch (config.tipo) {
				case "anticipacion":
					if (
						diasAnticipacion >= config.diasMinimos &&
						(config.diasMaximos === null || diasAnticipacion <= config.diasMaximos)
					) {
						aplica = true;
						detalle = `${config.diasMinimos}${config.diasMaximos ? `-${config.diasMaximos}` : "+"} días de anticipación`;
					}
					break;

				case "dia_semana":
					if (Array.isArray(config.diasSemana) && config.diasSemana.includes(diaSemana)) {
						const nombresDias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
						aplica = true;
						detalle = nombresDias[diaSemana];
					}
					break;

				case "horario":
					if (hora && config.horaInicio && config.horaFin) {
						aplica = horaEnRango(hora, config.horaInicio, config.horaFin);
						detalle = `Horario ${config.horaInicio.substring(0,5)} - ${config.horaFin.substring(0,5)}`;
					}
					break;

				case "descuento_retorno":
					// Pendiente: requiere lógica de disponibilidad de vehículos
					break;
			}

			if (aplica) {
				ajustes.push({
					nombre: config.nombre,
					tipo: config.tipo,
					porcentaje: parseFloat(config.porcentajeAjuste),
					detalle,
				});
				porcentajeTotal += parseFloat(config.porcentajeAjuste);
			}
		}
	} catch (error) {
		console.error("Error en calcularTarifaDinamica:", error);
		// En caso de error retornamos sin ajustes para no bloquear la cotización
	}

	const ajusteMonto = Math.round((precioBase * porcentajeTotal) / 100);
	const precioAjustado = Math.max(0, precioBase + ajusteMonto);

	return { precioAjustado, ajustes, porcentajeTotal };
};

// ─── Cálculo de descuentos ────────────────────────────────────────────────────

/**
 * Retorna la promoción aplicable con mayor porcentaje para un tramo dado.
 *
 * @param {Array}  promociones      - Array de promociones del sistema
 * @param {string} destinoNombre    - Nombre del destino
 * @param {string} fecha            - Formato YYYY-MM-DD
 * @param {string} hora             - Formato HH:MM
 * @param {string} tipoViaje        - "ida" | "vuelta" | "ambos"
 * @returns {object|null}
 */
const obtenerMejorPromocion = (promociones, destinoNombre, fecha, hora, tipoViaje) => {
	if (!Array.isArray(promociones) || promociones.length === 0) return null;

	const diasSemana = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

	let diaSemana = null;
	if (fecha) {
		const [y, m, d] = fecha.split("-").map(Number);
		diaSemana = diasSemana[new Date(y, m - 1, d).getDay()];
	}

	const aplicables = promociones.filter((promo) => {
		if (!promo.activo) return false;

		// Filtro por destino
		if (promo.destino && promo.destino !== destinoNombre) return false;

		// Filtro por tipo de viaje
		const tv = promo.aplicaTipoViaje || {};
		if (tipoViaje === "ida"    && !tv.ida    && !tv.ambos) return false;
		if (tipoViaje === "vuelta" && !tv.vuelta && !tv.ambos) return false;
		if (tipoViaje === "ambos"  && !tv.ambos) return false;

		// Filtro por día de semana
		if (promo.aplicaPorDias && promo.dias?.length > 0) {
			if (!diaSemana) return false;
			const diasNorm = promo.dias.map((d) => d.toLowerCase());
			if (!diasNorm.includes(diaSemana)) return false;
		}

		// Filtro por horario
		if (promo.aplicaPorHorario) {
			if (!hora || !promo.horaInicio || !promo.horaFin) return false;
			if (!horaEnRango(hora, promo.horaInicio, promo.horaFin)) return false;
		}

		return true;
	});

	if (aplicables.length === 0) return null;
	return aplicables.reduce(
		(mejor, p) => (p.descuentoPorcentaje > (mejor?.descuentoPorcentaje ?? 0) ? p : mejor),
		null
	);
};

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Calcula el precio completo de una cotización incluyendo:
 * - precio base por tipo de vehículo
 * - tarifa dinámica (anticipación, día, horario, festivo)
 * - todos los descuentos (online, personalizado, promoción, ida/vuelta, código)
 * - sillas infantiles
 * - abono (40%) y saldo pendiente
 *
 * @param {object} params
 * @param {string}  params.origen
 * @param {string}  params.destino
 * @param {number}  params.pasajeros
 * @param {string}  params.fecha             - Formato YYYY-MM-DD
 * @param {string}  [params.hora]            - Formato HH:MM
 * @param {boolean} [params.idaVuelta]
 * @param {string}  [params.fechaRegreso]    - Formato YYYY-MM-DD (requerido si idaVuelta=true)
 * @param {string}  [params.horaRegreso]     - Formato HH:MM
 * @param {boolean} [params.upgradeVan]
 * @param {string}  [params.codigoDescuento] - Código de descuento a aplicar
 * @param {boolean} [params.sillaInfantil]
 * @param {number}  [params.cantidadSillas]
 * @returns {Promise<object>} Desglose completo del precio
 */
export const cotizar = async ({
	origen,
	destino,
	pasajeros,
	fecha,
	hora,
	idaVuelta = false,
	fechaRegreso,
	horaRegreso,
	upgradeVan = false,
	codigoDescuento: codigoStr,
	sillaInfantil = false,
	cantidadSillas = 1,
}) => {
	// ── 1. Cargar configuración de precios (paralelo) ─────────────────────────
	const [destinos, descuentosGlobales, promocionesRaw, codigosDescuento, configSillas] =
		await Promise.all([
			Destino.findAll({ where: { activo: true } }),
			DescuentoGlobal.findAll(),
			Promocion.findAll({ where: { activo: true } }),
			CodigoDescuento.findAll({ where: { activo: true } }),
			Configuracion.getValorParseado("config_sillas", {
				habilitado: false,
				maxSillas: 2,
				precioPorSilla: 5000,
			}),
		]);

	// ── 2. Identificar destino ────────────────────────────────────────────────
	const tramo = [origen, destino].find((l) => l !== "Aeropuerto La Araucanía");
	const destinoInfo = destinos.find((d) => d.nombre === tramo);

	if (!destinoInfo) {
		return {
			error: "Destino no encontrado o no disponible.",
			totalConDescuento: null,
		};
	}

	// Normalizar precios del destino (mismo formato que buildPricingPayload)
	const destinoConPrecios = {
		...destinoInfo.toJSON(),
		precios: {
			auto: {
				base: destinoInfo.precioIda,
				porcentajeAdicional: destinoInfo.porcentajeAdicionalAuto || 0.1,
			},
			van: {
				base: destinoInfo.precioBaseVan
					? Number(destinoInfo.precioBaseVan)
					: destinoInfo.precioIda * 1.8,
				porcentajeAdicional: destinoInfo.porcentajeAdicionalVan || 0.1,
			},
		},
	};

	// ── 3. Precio base por vehículo ───────────────────────────────────────────
	const resultBase = calcularPrecioBase(destinoConPrecios, pasajeros, upgradeVan);
	if (!resultBase.precio) {
		return {
			error: "No se pudo calcular el precio base para los parámetros indicados.",
			totalConDescuento: null,
			vehiculo: resultBase.vehiculo,
		};
	}

	// ── 4. Tarifa dinámica (IDA) ──────────────────────────────────────────────
	const tarifaIda = await calcularTarifaDinamica(resultBase.precio, tramo, fecha, hora);
	const precioIda = tarifaIda.precioAjustado;

	// ── 5. Tarifa dinámica (VUELTA) si aplica ─────────────────────────────────
	let precioVuelta = 0;
	let tarifaVuelta = { precioAjustado: 0, ajustes: [], porcentajeTotal: 0 };
	if (idaVuelta && fechaRegreso) {
		const resultVuelta = calcularPrecioBase(destinoConPrecios, pasajeros, upgradeVan);
		tarifaVuelta = await calcularTarifaDinamica(
			resultVuelta.precio,
			tramo,
			fechaRegreso,
			horaRegreso,
		);
		precioVuelta = tarifaVuelta.precioAjustado;
	}

	const precioBase = idaVuelta ? precioIda + precioVuelta : precioIda;

	// ── 6. Procesar descuentos globales ───────────────────────────────────────
	let tdOnline = 0, tdPersonalizados = 0, tdRoundTrip = 0;

	descuentosGlobales.forEach((dg) => {
		if (dg.tipo === "descuentoOnline" && dg.activo) {
			// Se aplica por tramo
			const pct = toNum(dg.valor) / 100;
			tdOnline = idaVuelta ? Math.round(precioIda * pct) * 2 : Math.round(precioIda * pct);
		} else if (dg.tipo === "descuentoRoundTrip" && dg.activo && idaVuelta) {
			tdRoundTrip = Math.round(precioBase * (toNum(dg.valor) / 100));
		} else if (dg.tipo === "descuentoPersonalizado" && dg.activo) {
			const pct = toNum(dg.valor) / 100;
			const monto = idaVuelta ? Math.round(precioIda * pct) * 2 : Math.round(precioIda * pct);
			tdPersonalizados += monto;
		}
	});

	// ── 7. Promoción aplicable ────────────────────────────────────────────────
	// Normalizar promociones al mismo formato que buildPricingPayload
	const promociones = promocionesRaw.map((p) => {
		let meta = {};
		try { meta = JSON.parse(p.descripcion || "{}"); } catch { /* ignorar */ }
		return {
			id: meta.sourceId || `promo-${p.id}`,
			nombre: meta.nombre || p.nombre || "",
			destino: meta.destino || "",
			descuentoPorcentaje: toNum(meta.porcentaje ?? p.valor, 0),
			aplicaPorDias: meta.aplicaPorDias !== undefined ? Boolean(meta.aplicaPorDias) : true,
			dias: normalizarArray(meta.dias),
			aplicaPorHorario: Boolean(meta.aplicaPorHorario),
			horaInicio: meta.horaInicio || p.horaInicio || "",
			horaFin: meta.horaFin || p.horaFin || "",
			aplicaTipoViaje: meta.aplicaTipoViaje || { ida: true, vuelta: true, ambos: true },
			activo: meta.activo !== undefined ? Boolean(meta.activo) : Boolean(p.activo),
		};
	});

	const tipoViajeStr = idaVuelta ? "ambos" : "ida";
	const mejorPromo = obtenerMejorPromocion(promociones, tramo, fecha, hora, tipoViajeStr);
	const tdPromocion = mejorPromo
		? idaVuelta
			? Math.round(precioIda * (mejorPromo.descuentoPorcentaje / 100)) * 2
			: Math.round(precioIda * (mejorPromo.descuentoPorcentaje / 100))
		: 0;

	// ── 8. Código de descuento ────────────────────────────────────────────────
	let tdCodigo = 0;
	let codigoInfo = null;

	if (codigoStr) {
		const codigoNorm = codigoStr.toUpperCase().trim();
		const ahora = new Date().toISOString().split("T")[0];
		const codigo = codigosDescuento.find((c) => {
			if (c.codigo !== codigoNorm) return false;
			if (!c.activo) return false;
			if (c.fechaExpiracion && c.fechaExpiracion < ahora) return false;
			if (c.usoMaximo && c.usosActuales >= c.usoMaximo) return false;
			const destinos = normalizarArray(c.destinosAplicables);
			if (destinos.length > 0 && !destinos.includes(tramo)) return false;
			return true;
		});

		if (codigo) {
			if (codigo.tipo === "porcentaje") {
				tdCodigo = Math.round(precioBase * (toNum(codigo.porcentaje) / 100));
			} else {
				// Descuento de monto fijo
				tdCodigo = Math.min(toNum(codigo.porcentaje), precioBase);
			}
			codigoInfo = { codigo: codigo.codigo, tipo: codigo.tipo, valor: codigo.porcentaje };
		} else {
			// Código no válido — no bloqueamos la cotización, solo no aplica descuento
			codigoInfo = { codigo: codigoStr, valido: false };
		}
	}

	// ── 9. Calcular total con límite del 75% ──────────────────────────────────
	const descuentoTotalSinLimite = tdOnline + tdPromocion + tdRoundTrip + tdPersonalizados + tdCodigo;
	const descuentoMaximo = Math.round(precioBase * LIMITE_DESCUENTO);
	const descuentoAplicado = Math.min(descuentoTotalSinLimite, descuentoMaximo);
	const limiteAplicado = descuentoTotalSinLimite > descuentoMaximo;

	// ── 10. Sillas infantiles ─────────────────────────────────────────────────
	const precioPorSilla = toNum(configSillas.precioPorSilla, 5000);
	const cantSillas = sillaInfantil ? Math.max(1, parseInt(cantidadSillas, 10) || 1) : 0;
	const costoSillas = cantSillas * precioPorSilla;

	// ── 11. Total, abono y saldo ──────────────────────────────────────────────
	const totalConDescuento = Math.round(Math.max(precioBase - descuentoAplicado, 0) + costoSillas);
	const abono = Math.round(totalConDescuento * PORCENTAJE_ABONO);
	const saldoPendiente = Math.max(totalConDescuento - abono, 0);

	// ── 12. Armar respuesta ───────────────────────────────────────────────────
	return {
		// Datos de vehículo
		vehiculo: resultBase.vehiculo,
		esUpgradeVan: resultBase.esUpgradeVan,

		// Precios base
		precioBaseIda: resultBase.precio,
		precioBaseVuelta: idaVuelta ? resultBase.precio : 0,
		precioBase,

		// Tarifa dinámica
		tarifaDinamica: {
			ida: {
				precioAjustado: precioIda,
				ajustes: tarifaIda.ajustes,
				porcentajeTotal: tarifaIda.porcentajeTotal,
			},
			...(idaVuelta && {
				vuelta: {
					precioAjustado: precioVuelta,
					ajustes: tarifaVuelta.ajustes,
					porcentajeTotal: tarifaVuelta.porcentajeTotal,
				},
			}),
		},

		// Descuentos individuales
		descuentos: {
			online: tdOnline,
			personalizados: tdPersonalizados,
			promocion: tdPromocion,
			roundTrip: tdRoundTrip,
			codigo: tdCodigo,
			total: descuentoAplicado,
			limiteAplicado,
			promocionActiva: mejorPromo
				? { nombre: mejorPromo.nombre, porcentaje: mejorPromo.descuentoPorcentaje }
				: null,
			codigoAplicado: codigoInfo,
		},

		// Extras
		extras: { sillas: costoSillas, cantidadSillas: cantSillas },

		// Totales
		totalConDescuento,
		abono,
		saldoPendiente,
	};
};

/**
 * Valida que el monto enviado por el frontend al crear una reserva sea coherente
 * con el precio calculado por el servidor. Tolerancia del 1% por redondeos.
 *
 * @param {number} montoCliente - Total enviado por el cliente
 * @param {number} montoServidor - Total calculado por el servidor
 * @returns {{ valido: boolean, diferencia: number }}
 */
export const validarMonto = (montoCliente, montoServidor) => {
	if (!montoServidor) return { valido: false, diferencia: null };
	const diferencia = Math.abs(montoCliente - montoServidor);
	const tolerancia = Math.round(montoServidor * 0.01); // 1%
	return { valido: diferencia <= tolerancia, diferencia };
};
