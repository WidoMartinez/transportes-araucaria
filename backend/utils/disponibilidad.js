// backend/utils/disponibilidad.js
import { Op } from "sequelize";
import Reserva from "../models/Reserva.js";
import Vehiculo from "../models/Vehiculo.js";
import Destino from "../models/Destino.js";
import ConfiguracionDisponibilidad from "../models/ConfiguracionDisponibilidad.js";

/**
 * Obtiene la configuración activa de disponibilidad
 */
export const obtenerConfiguracionDisponibilidad = async () => {
	try {
		const config = await ConfiguracionDisponibilidad.findOne({
			where: { activo: true },
			order: [["createdAt", "DESC"]],
		});

		// Si no existe configuración, retornar valores por defecto
		if (!config) {
			return {
				holguraMinima: 30,
				holguraOptima: 60,
				holguraMaximaDescuento: 180,
				descuentoMinimo: 1.0,
				descuentoMaximo: 40.0,
				horaLimiteRetornos: "20:00:00",
				activo: true,
			};
		}

		return config;
	} catch (error) {
		console.error("Error obteniendo configuración de disponibilidad:", error);
		// Retornar valores por defecto en caso de error
		return {
			holguraMinima: 30,
			holguraOptima: 60,
			holguraMaximaDescuento: 180,
			descuentoMinimo: 1.0,
			descuentoMaximo: 40.0,
			horaLimiteRetornos: "20:00:00",
			activo: true,
		};
	}
};

/**
 * Convierte una hora en formato "HH:MM:SS" o "HH:MM" a minutos desde medianoche
 */
const horaAMinutos = (hora) => {
	if (!hora) return 0;
	const partes = hora.split(":");
	const horas = parseInt(partes[0], 10) || 0;
	const minutos = parseInt(partes[1], 10) || 0;
	return horas * 60 + minutos;
};

/**
 * Combina fecha y hora en un objeto Date
 */
const combinarFechaHora = (fecha, hora) => {
	const fechaObj = new Date(fecha);
	if (!hora) return fechaObj;
	
	const [horas, minutos] = hora.split(":").map(Number);
	fechaObj.setHours(horas, minutos, 0, 0);
	return fechaObj;
};

/**
 * Verifica si hay vehículos disponibles para una fecha, hora y duración dada
 * @param {Date} fecha - Fecha del viaje
 * @param {string} hora - Hora de inicio (formato HH:MM:SS o HH:MM)
 * @param {number} duracionMinutos - Duración estimada del viaje en minutos
 * @param {number} pasajeros - Número de pasajeros
 * @param {number} excludeReservaId - ID de reserva a excluir (para modificaciones)
 * @returns {Object} { disponible: boolean, vehiculosDisponibles: Array, mensaje: string }
 */
export const verificarDisponibilidadVehiculos = async ({
	fecha,
	hora,
	duracionMinutos = 60,
	pasajeros = 1,
	excludeReservaId = null,
}) => {
	try {
		const config = await obtenerConfiguracionDisponibilidad();
		const holguraMinima = config.holguraMinima || 30;

		// Obtener todos los vehículos disponibles con capacidad suficiente
		const vehiculosTotales = await Vehiculo.findAll({
			where: {
				estado: {
					[Op.in]: ["disponible", "en_uso"],
				},
				capacidad: {
					[Op.gte]: pasajeros,
				},
			},
		});

		if (vehiculosTotales.length === 0) {
			return {
				disponible: false,
				vehiculosDisponibles: [],
				mensaje: "No hay vehículos con capacidad suficiente en el sistema",
			};
		}

		// Calcular el rango de tiempo que ocuparía el viaje solicitado
		const inicioSolicitado = combinarFechaHora(fecha, hora);
		const finSolicitado = new Date(
			inicioSolicitado.getTime() + duracionMinutos * 60000
		);

		// Buscar reservas que podrían causar conflicto
		const whereClause = {
			fecha: fecha,
			estado: {
				[Op.in]: ["pendiente", "pendiente_detalles", "confirmada"],
			},
		};

		if (excludeReservaId) {
			whereClause.id = { [Op.ne]: excludeReservaId };
		}

		const reservasExistentes = await Reserva.findAll({
			where: whereClause,
			include: [
				{
					model: Vehiculo,
					as: "vehiculo_asignado",
					required: false,
				},
			],
		});

		// Obtener destinos para duraciones
		const destinosMap = {};
		const destinos = await Destino.findAll();
		destinos.forEach((d) => {
			destinosMap[d.nombre] = {
				duracionIda: d.duracionIdaMinutos || 60,
				duracionVuelta: d.duracionVueltaMinutos || 60,
			};
		});

		// Verificar qué vehículos están ocupados en el rango de tiempo solicitado
		const vehiculosOcupados = new Set();

		for (const reserva of reservasExistentes) {
			const destinoInfo = destinosMap[reserva.destino] || {
				duracionIda: 60,
				duracionVuelta: 60,
			};

			// Calcular inicio y fin de la reserva existente (ida)
			if (reserva.hora && reserva.fecha) {
				const duracionReserva = reserva.idaVuelta
					? destinoInfo.duracionIda
					: destinoInfo.duracionIda;

				const inicioReserva = combinarFechaHora(reserva.fecha, reserva.hora);
				const finReserva = new Date(
					inicioReserva.getTime() + duracionReserva * 60000
				);

				// Agregar holgura mínima
				const finReservaConHolgura = new Date(
					finReserva.getTime() + holguraMinima * 60000
				);

				// Verificar si hay conflicto de horarios
				const hayConflicto =
					(inicioSolicitado >= inicioReserva &&
						inicioSolicitado < finReservaConHolgura) ||
					(finSolicitado > inicioReserva && finSolicitado <= finReservaConHolgura) ||
					(inicioSolicitado <= inicioReserva && finSolicitado >= finReservaConHolgura);

				if (hayConflicto && reserva.vehiculoId) {
					vehiculosOcupados.add(reserva.vehiculoId);
				}
			}

			// Si es ida y vuelta, también verificar el regreso
			if (reserva.idaVuelta && reserva.horaRegreso && reserva.fechaRegreso) {
				const duracionReservaVuelta = destinoInfo.duracionVuelta;
				const inicioReservaVuelta = combinarFechaHora(
					reserva.fechaRegreso,
					reserva.horaRegreso
				);
				const finReservaVuelta = new Date(
					inicioReservaVuelta.getTime() + duracionReservaVuelta * 60000
				);
				const finReservaVueltaConHolgura = new Date(
					finReservaVuelta.getTime() + holguraMinima * 60000
				);

				// Verificar si la reserva solicitada entra en conflicto con el regreso
				const fechaSolicitadaStr = new Date(fecha).toISOString().split("T")[0];
				const fechaRegresoStr = new Date(reserva.fechaRegreso)
					.toISOString()
					.split("T")[0];

				if (fechaSolicitadaStr === fechaRegresoStr) {
					const hayConflictoVuelta =
						(inicioSolicitado >= inicioReservaVuelta &&
							inicioSolicitado < finReservaVueltaConHolgura) ||
						(finSolicitado > inicioReservaVuelta &&
							finSolicitado <= finReservaVueltaConHolgura) ||
						(inicioSolicitado <= inicioReservaVuelta &&
							finSolicitado >= finReservaVueltaConHolgura);

					if (hayConflictoVuelta && reserva.vehiculoId) {
						vehiculosOcupados.add(reserva.vehiculoId);
					}
				}
			}
		}

		// Filtrar vehículos disponibles
		const vehiculosDisponibles = vehiculosTotales.filter(
			(v) => !vehiculosOcupados.has(v.id)
		);

		return {
			disponible: vehiculosDisponibles.length > 0,
			vehiculosDisponibles: vehiculosDisponibles.map((v) => ({
				id: v.id,
				patente: v.patente,
				tipo: v.tipo,
				capacidad: v.capacidad,
			})),
			mensaje:
				vehiculosDisponibles.length > 0
					? `${vehiculosDisponibles.length} vehículo(s) disponible(s)`
					: "No hay vehículos disponibles en este horario. Por favor seleccione otro horario.",
		};
	} catch (error) {
		console.error("Error verificando disponibilidad de vehículos:", error);
		return {
			disponible: false,
			vehiculosDisponibles: [],
			mensaje: "Error verificando disponibilidad",
			error: error.message,
		};
	}
};

/**
 * Busca oportunidades de retorno (viajes en sentido contrario que podrían aprovechar el regreso)
 * @param {string} origen - Origen del viaje solicitado
 * @param {string} destino - Destino del viaje solicitado
 * @param {Date} fecha - Fecha del viaje solicitado
 * @param {string} hora - Hora del viaje solicitado
 * @returns {Object} { hayOportunidad: boolean, descuento: number, detalles: Object }
 */
export const buscarOportunidadesRetorno = async ({
	origen,
	destino,
	fecha,
	hora,
}) => {
	try {
		const config = await obtenerConfiguracionDisponibilidad();

		if (!config.activo) {
			return {
				hayOportunidad: false,
				descuento: 0,
				mensaje: "Sistema de descuentos por retorno desactivado",
			};
		}

		// Verificar que la hora de inicio esté dentro del rango permitido
		const horaLimite = horaAMinutos(config.horaLimiteRetornos);
		const horaSolicitada = horaAMinutos(hora);

		if (horaSolicitada > horaLimite) {
			return {
				hayOportunidad: false,
				descuento: 0,
				mensaje: `No se aplican descuentos para viajes después de las ${config.horaLimiteRetornos}`,
			};
		}

		// Obtener información del destino
		const destinoInfo = await Destino.findOne({
			where: { nombre: destino },
		});

		if (!destinoInfo) {
			return {
				hayOportunidad: false,
				descuento: 0,
				mensaje: "Destino no encontrado",
			};
		}

		const duracionViaje = destinoInfo.duracionIdaMinutos || 60;

		// Buscar reservas confirmadas que vayan en sentido contrario el mismo día
		// (del destino solicitado al origen solicitado)
		const reservasContrarias = await Reserva.findAll({
			where: {
				fecha: fecha,
				origen: destino, // Inverted: origin of request is destination of existing reservation
				destino: origen, // Inverted: destination of request is origin of existing reservation
				estado: {
					[Op.in]: ["pendiente", "pendiente_detalles", "confirmada"],
				},
				vehiculoId: {
					[Op.ne]: null, // Debe tener vehículo asignado
				},
			},
		});

		if (reservasContrarias.length === 0) {
			return {
				hayOportunidad: false,
				descuento: 0,
				mensaje: "No hay viajes en sentido contrario para optimizar",
			};
		}

		// Calcular el mejor descuento basado en los tiempos de espera
		let mejorOportunidad = null;
		let mejorDescuento = 0;

		for (const reservaContraria of reservasContrarias) {
			if (!reservaContraria.hora) continue;

			// Calcular cuándo llegaría el vehículo al destino de la reserva contraria
			const inicioContraria = combinarFechaHora(
				reservaContraria.fecha,
				reservaContraria.hora
			);
			const duracionContraria = destinoInfo.duracionVueltaMinutos || duracionViaje;
			const llegadaContraria = new Date(
				inicioContraria.getTime() + duracionContraria * 60000
			);

			// Calcular cuándo iniciaría el viaje solicitado
			const inicioSolicitado = combinarFechaHora(fecha, hora);

			// Calcular tiempo de espera (diferencia entre llegada y nueva salida)
			const tiempoEsperaMinutos =
				(inicioSolicitado.getTime() - llegadaContraria.getTime()) / 60000;

			// Verificar que cumple con holgura mínima y máxima
			if (
				tiempoEsperaMinutos >= config.holguraMinima &&
				tiempoEsperaMinutos <= config.holguraMaximaDescuento
			) {
				// Calcular descuento gradual
				const rangoHolgura =
					config.holguraMaximaDescuento - config.holguraMinima;
				const rangoDescuento = config.descuentoMaximo - config.descuentoMinimo;

				// Interpolación: a menor tiempo de espera (más cercano a holguraMinima), menor descuento
				// A mayor tiempo de espera (más cercano a holguraOptima o más), mayor descuento
				let porcentajeProgreso;
				if (tiempoEsperaMinutos <= config.holguraOptima) {
					// Entre holguraMinima y holguraOptima: progreso proporcional
					porcentajeProgreso =
						(tiempoEsperaMinutos - config.holguraMinima) /
						(config.holguraOptima - config.holguraMinima);
				} else {
					// Entre holguraOptima y holguraMaxima: ya alcanzó el máximo
					porcentajeProgreso = 1;
				}

				const descuento =
					config.descuentoMinimo + rangoDescuento * porcentajeProgreso;

				if (descuento > mejorDescuento) {
					mejorDescuento = descuento;
					mejorOportunidad = {
						reservaId: reservaContraria.id,
						vehiculoId: reservaContraria.vehiculoId,
						tiempoEsperaMinutos: Math.round(tiempoEsperaMinutos),
						horaLlegadaVehiculo: llegadaContraria.toLocaleTimeString("es-CL", {
							hour: "2-digit",
							minute: "2-digit",
						}),
						horaSalidaSolicitada: inicioSolicitado.toLocaleTimeString("es-CL", {
							hour: "2-digit",
							minute: "2-digit",
						}),
					};
				}
			}
		}

		if (mejorOportunidad && mejorDescuento > 0) {
			return {
				hayOportunidad: true,
				descuento: Math.min(Math.round(mejorDescuento * 100) / 100, config.descuentoMaximo),
				detalles: mejorOportunidad,
				mensaje: `¡Oportunidad de retorno! Descuento del ${Math.round(mejorDescuento)}% aplicado (${mejorOportunidad.tiempoEsperaMinutos} min de espera)`,
			};
		}

		return {
			hayOportunidad: false,
			descuento: 0,
			mensaje: "Los tiempos de espera no permiten aplicar descuento por retorno",
		};
	} catch (error) {
		console.error("Error buscando oportunidades de retorno:", error);
		return {
			hayOportunidad: false,
			descuento: 0,
			mensaje: "Error buscando oportunidades de retorno",
			error: error.message,
		};
	}
};

/**
 * Valida que el horario seleccionado cumple con el tiempo mínimo entre viajes
 * @returns {Object} { valido: boolean, mensaje: string }
 */
export const validarHorarioMinimo = async ({
	fecha,
	hora,
	vehiculoId = null,
	excludeReservaId = null,
}) => {
	try {
		const config = await obtenerConfiguracionDisponibilidad();
		const holguraMinima = config.holguraMinima || 30;

		// Si no hay vehículo asignado, no podemos validar específicamente
		// (se validará cuando se asigne el vehículo)
		if (!vehiculoId) {
			return {
				valido: true,
				mensaje: "Horario válido (pendiente asignación de vehículo)",
			};
		}

		// Buscar reservas del mismo vehículo en fechas cercanas
		const inicioSolicitado = combinarFechaHora(fecha, hora);

		const whereClause = {
			vehiculoId: vehiculoId,
			fecha: fecha,
			estado: {
				[Op.in]: ["pendiente", "pendiente_detalles", "confirmada"],
			},
		};

		if (excludeReservaId) {
			whereClause.id = { [Op.ne]: excludeReservaId };
		}

		const reservasVehiculo = await Reserva.findAll({
			where: whereClause,
		});

		// Obtener destinos para duraciones
		const destinosMap = {};
		const destinos = await Destino.findAll();
		destinos.forEach((d) => {
			destinosMap[d.nombre] = {
				duracionIda: d.duracionIdaMinutos || 60,
				duracionVuelta: d.duracionVueltaMinutos || 60,
			};
		});

		for (const reserva of reservasVehiculo) {
			if (!reserva.hora) continue;

			const destinoInfo = destinosMap[reserva.destino] || {
				duracionIda: 60,
				duracionVuelta: 60,
			};

			const inicioReserva = combinarFechaHora(reserva.fecha, reserva.hora);
			const duracionReserva = destinoInfo.duracionIda;
			const finReserva = new Date(
				inicioReserva.getTime() + duracionReserva * 60000
			);

			// Calcular diferencia de tiempo
			const diferenciaMinutos = Math.abs(
				(inicioSolicitado.getTime() - finReserva.getTime()) / 60000
			);

			if (diferenciaMinutos < holguraMinima) {
				return {
					valido: false,
					mensaje: `El horario seleccionado no cumple con el tiempo mínimo de ${holguraMinima} minutos entre viajes. Diferencia actual: ${Math.round(diferenciaMinutos)} minutos.`,
				};
			}
		}

		return {
			valido: true,
			mensaje: "Horario válido",
		};
	} catch (error) {
		console.error("Error validando horario mínimo:", error);
		return {
			valido: false,
			mensaje: "Error validando horario",
			error: error.message,
		};
	}
};

/**
 * Busca retornos disponibles para cualquier cliente (sin requerir email)
 * Genera opciones de horario con descuentos escalonados
 * @param {string} origen - Origen del viaje solicitado
 * @param {string} destino - Destino del viaje solicitado
 * @param {Date} fecha - Fecha del viaje solicitado
 * @returns {Object} { hayOportunidades: boolean, opciones: Array }
 */
export const buscarRetornosDisponibles = async ({ origen, destino, fecha }) => {
	try {
		// Buscar reservas confirmadas que vayan en sentido contrario
		// (del destino solicitado al origen solicitado)
		const reservasContrarias = await Reserva.findAll({
			where: {
				fecha: fecha,
				origen: destino, // Invertido: origen de la solicitud es destino de reserva existente
				destino: origen, // Invertido: destino de la solicitud es origen de reserva existente
				estado: {
					[Op.in]: ["confirmada", "pagado"],
				},
			},
		});

		if (reservasContrarias.length === 0) {
			return {
				hayOportunidades: false,
				opciones: [],
				mensaje: "No hay viajes disponibles para optimizar",
			};
		}

		// Obtener información de destinos
		const destinosMap = {};
		const destinos = await Destino.findAll();
		destinos.forEach((d) => {
			destinosMap[d.nombre] = {
				duracionIda: d.duracionIdaMinutos || 90,
				duracionVuelta: d.duracionVueltaMinutos || 90,
			};
		});

		const opciones = [];

		for (const reservaContraria of reservasContrarias) {
			if (!reservaContraria.hora) continue;

			const destinoInfo = destinosMap[reservaContraria.destino] || {
				duracionIda: 90,
				duracionVuelta: 90,
			};

			// Calcular hora de término del servicio de ida
			const inicioReserva = combinarFechaHora(
				reservaContraria.fecha,
				reservaContraria.hora
			);
			const duracionReserva = destinoInfo.duracionIda;
			const horaTermino = new Date(
				inicioReserva.getTime() + duracionReserva * 60000
			);

			// Generar opciones de retorno con descuentos escalonados
			const opcionesRetorno = [];

			// Opción 1: 30 minutos después (50% descuento)
			const hora30min = new Date(horaTermino.getTime() + 30 * 60000);
			opcionesRetorno.push({
				hora: hora30min.toLocaleTimeString("es-CL", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
				}),
				descuento: 50,
				etiqueta: "Mejor precio",
			});

			// Opción 2: 45 minutos después (30% descuento)
			const hora45min = new Date(horaTermino.getTime() + 45 * 60000);
			opcionesRetorno.push({
				hora: hora45min.toLocaleTimeString("es-CL", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
				}),
				descuento: 30,
				etiqueta: "Buen precio",
			});

			// Opción 3: 60 minutos después (20% descuento)
			const hora60min = new Date(horaTermino.getTime() + 60 * 60000);
			opcionesRetorno.push({
				hora: hora60min.toLocaleTimeString("es-CL", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
				}),
				descuento: 20,
				etiqueta: "Descuento",
			});

			opciones.push({
				reservaReferencia: reservaContraria.codigoReserva || `#${reservaContraria.id}`,
				origenReserva: reservaContraria.origen,
				destinoReserva: reservaContraria.destino,
				horaInicioReserva: reservaContraria.hora,
				horaTerminoEstimada: horaTermino.toLocaleTimeString("es-CL", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
				}),
				opcionesRetorno: opcionesRetorno,
			});
		}

		return {
			hayOportunidades: opciones.length > 0,
			opciones: opciones,
			mensaje:
				opciones.length > 0
					? `${opciones.length} oportunidad(es) de retorno disponible(s)`
					: "No hay oportunidades de retorno disponibles",
		};
	} catch (error) {
		console.error("Error buscando retornos disponibles:", error);
		return {
			hayOportunidades: false,
			opciones: [],
			mensaje: "Error buscando retornos disponibles",
			error: error.message,
		};
	}
};
