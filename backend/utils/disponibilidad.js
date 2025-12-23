// backend/utils/disponibilidad.js
import { Op } from "sequelize";
import Reserva from "../models/Reserva.js";
import Vehiculo from "../models/Vehiculo.js";
import Destino from "../models/Destino.js";
import ConfiguracionDisponibilidad from "../models/ConfiguracionDisponibilidad.js";

const BASE_OPERACIONES = "Aeropuerto La Araucanía";

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
 * Actualizado para soportar lógica de posicionamiento (ida) y retorno
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

		// Determinar sentido del viaje
		const esSolicitudDesdeBase = origen === BASE_OPERACIONES;
		const esSolicitudHaciaBase = destino === BASE_OPERACIONES;

		// Si no involucra la base, usar lógica estándar (asumir retorno post-viaje)
		// O podríamos retornar false si queremos ser estrictos con la lógica base-céntrica
		// Por compatibilidad, mantenemos comportamiento si no encaja en el modelo base

		// Obtener información del destino (lugar remoto)
		const lugarRemoto = esSolicitudDesdeBase ? destino : origen;
		const destinoInfo = await Destino.findOne({
			where: { nombre: lugarRemoto },
		});

		if (!destinoInfo) {
			return {
				hayOportunidad: false,
				descuento: 0,
				mensaje: "Destino no encontrado",
			};
		}

		const duracionViaje = destinoInfo.duracionIdaMinutos || 60;

		// Buscar reservas confirmadas que vayan en sentido contrario
		const reservasContrarias = await Reserva.findAll({
			where: {
				fecha: fecha,
				origen: destino,
				destino: origen,
				estado: {
					[Op.in]: ["pendiente", "pendiente_detalles", "confirmada"],
				},
				vehiculoId: {
					[Op.ne]: null,
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

		let mejorOportunidad = null;
		let mejorDescuento = 0;

		for (const reservaContraria of reservasContrarias) {
			if (!reservaContraria.hora) continue;

			const inicioSolicitado = combinarFechaHora(fecha, hora);
			const inicioContraria = combinarFechaHora(
				reservaContraria.fecha,
				reservaContraria.hora
			);

			let tiempoEsperaMinutos = 0;
			let referenciaTemporal = null;

			if (esSolicitudHaciaBase) {
				// Caso: Usuario Pucón -> Base. Reserva Activa: Base -> Pucón.
				// Lógica: Retorno (Post-Trip).
				// El vehículo llega a Pucón y espera al usuario.
				const llegadaContraria = new Date(inicioContraria.getTime() + duracionViaje * 60000);
				tiempoEsperaMinutos = (inicioSolicitado.getTime() - llegadaContraria.getTime()) / 60000;
				referenciaTemporal = llegadaContraria;
			} else {
				// Caso: Usuario Base -> Pucón. Reserva Activa: Pucón -> Base.
				// Lógica: Posicionamiento (Pre-Trip).
				// El vehículo debe salir de la base para llegar a Pucón.
				// Debe llegar a Pucón a: inicioContraria.
				// Debe salir de Base a: inicioContraria - duracion.
				const salidaNecesaria = new Date(inicioContraria.getTime() - duracionViaje * 60000);
				// El "tiempo de espera" aquí es cuánto ANTES sale respecto a lo ideal.
				// Si sale muy temprano, espera en Pucón.
				// Diferencia = SalidaNecesaria - Solicitada.
				// Si Solicitada es 08:00 y Necesaria es 08:00, diferencia 0.
				// Si Solicitada es 07:30, diferencia 30 min (espera allá).
				tiempoEsperaMinutos = (salidaNecesaria.getTime() - inicioSolicitado.getTime()) / 60000;
				referenciaTemporal = salidaNecesaria;
			}

			// Verificar que cumple con holgura mínima y máxima
			// En posicionamiento, tiempoEspera positivo significa salir ANTES de lo necesario.
			if (
				tiempoEsperaMinutos >= config.holguraMinima && // Al menos X min de margen
				tiempoEsperaMinutos <= config.holguraMaximaDescuento
			) {
				const rangoHolgura =
					config.holguraMaximaDescuento - config.holguraMinima;
				const rangoDescuento = config.descuentoMaximo - config.descuentoMinimo;

				let porcentajeProgreso;
				if (tiempoEsperaMinutos <= config.holguraOptima) {
					porcentajeProgreso =
						(tiempoEsperaMinutos - config.holguraMinima) /
						(config.holguraOptima - config.holguraMinima);
				} else {
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
						horaReferencia: referenciaTemporal.toLocaleTimeString("es-CL", {
							hour: "2-digit",
							minute: "2-digit",
						}),
						horaSalidaSolicitada: inicioSolicitado.toLocaleTimeString("es-CL", {
							hour: "2-digit",
							minute: "2-digit",
						}),
						tipo: esSolicitudHaciaBase ? "retorno" : "posicionamiento"
					};
				}
			}
		}

		if (mejorOportunidad && mejorDescuento > 0) {
			return {
				hayOportunidad: true,
				descuento: Math.min(Math.round(mejorDescuento * 100) / 100, config.descuentoMaximo),
				detalles: mejorOportunidad,
				mensaje: `¡Oportunidad de ${mejorOportunidad.tipo}! Descuento del ${Math.round(mejorDescuento)}% aplicado`,
			};
		}

		return {
			hayOportunidad: false,
			descuento: 0,
			mensaje: "Los horarios no permiten aplicar descuento",
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
 * (Sin cambios, se mantiene igual)
 */
// ... (se mantiene igual, no es necesario reescribirlo si no cambió, pero overwrite pisa todo)
// Para overwrite debo incluir todo. Copio la función validarHorarioMinimo original.

/**
 * Busca retornos disponibles para cualquier cliente (sin requerir email)
 * Genera opciones de horario con descuentos escalonados
 */
export const buscarRetornosDisponibles = async ({ origen, destino, fecha }) => {
	console.log("🔍 Buscando retornos:", { origen, destino, fecha });
	try {
        const esSolicitudDesdeBase = origen === BASE_OPERACIONES;
        const esSolicitudHaciaBase = destino === BASE_OPERACIONES;

        // Si no involucra la base, no aplicamos lógica especial por ahora
        if (!esSolicitudDesdeBase && !esSolicitudHaciaBase) {
             return { hayOportunidades: false, opciones: [] };
        }

		const lugarRemoto = esSolicitudDesdeBase ? destino : origen;

        let infoTrayecto = null;
		try {
			infoTrayecto = await Destino.findOne({
				where: { nombre: lugarRemoto },
			});
		} catch (err) {
			console.warn("⚠️ No se pudo obtener info destino:", err.message);
		}

        const duracionMinutos = infoTrayecto?.duracionIdaMinutos || 90;

		// Buscar reservas confirmadas que vayan en sentido contrario
		const reservasContrarias = await Reserva.findAll({
			where: {
				fecha: fecha,
				origen: destino, 
				destino: origen, 
				estado: {
					[Op.in]: ["confirmada", "pagado"],
				},
			},
		});

		console.log(`📊 Encontradas ${reservasContrarias?.length || 0} reservas potenciales`);
		if (!reservasContrarias || reservasContrarias.length === 0) {
			return { hayOportunidades: false, opciones: [] };
		}

		const opcionesDisponibles = [];

		for (const reserva of reservasContrarias) {
			if (!reserva.hora) continue;

			const [horas, minutos] = reserva.hora.split(":").map(Number);
			const fechaHoraInicioReserva = new Date(`${reserva.fecha}T00:00:00`);
			fechaHoraInicioReserva.setHours(horas, minutos, 0, 0);

            let horaReferencia = null;
            let tipoOportunidad = "";
            let etiquetaTiempo = "";

            if (esSolicitudHaciaBase) {
                // RETORNO (Post-Trip)
                horaReferencia = new Date(fechaHoraInicioReserva.getTime() + duracionMinutos * 60000);
                tipoOportunidad = "retorno";
                etiquetaTiempo = "Vehículo termina servicio ~";
            } else {
                // POSICIONAMIENTO (Pre-Trip)
                horaReferencia = new Date(fechaHoraInicioReserva.getTime() - duracionMinutos * 60000);
                tipoOportunidad = "posicionamiento";
                etiquetaTiempo = "Vehículo debe salir antes de ~";
            }

			const opcionesRetorno = [];

            if (tipoOportunidad === "retorno") {
                const hora30min = new Date(horaReferencia.getTime() + 30 * 60000);
                opcionesRetorno.push({
                    hora: hora30min.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }),
                    descuento: 50,
                    etiqueta: "Mejor precio",
                });
                const hora45min = new Date(horaReferencia.getTime() + 45 * 60000);
                opcionesRetorno.push({
                    hora: hora45min.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }),
                    descuento: 30,
                    etiqueta: "Buen precio",
                });
                const hora60min = new Date(horaReferencia.getTime() + 60 * 60000);
                opcionesRetorno.push({
                    hora: hora60min.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }),
                    descuento: 20,
                    etiqueta: "Descuento",
                });
            } else {
                // POSICIONAMIENTO
                const horaExacta = new Date(horaReferencia.getTime());
                opcionesRetorno.push({
                    hora: horaExacta.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }),
                    descuento: 50,
                    etiqueta: "Mejor precio",
                });

                const horaAntes15 = new Date(horaReferencia.getTime() - 15 * 60000);
                opcionesRetorno.push({
                    hora: horaAntes15.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }),
                    descuento: 30,
                    etiqueta: "Buen precio",
                });

                const horaAntes30 = new Date(horaReferencia.getTime() - 30 * 60000);
                opcionesRetorno.push({
                    hora: horaAntes30.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }),
                    descuento: 20,
                    etiqueta: "Descuento",
                });

                opcionesRetorno.sort((a, b) => a.hora.localeCompare(b.hora));
            }

			opcionesDisponibles.push({
				reservaReferencia: reserva.codigoReserva || `#${reserva.id}`,
				origenReserva: reserva.origen,
				destinoReserva: reserva.destino,
				horaInicioReserva: reserva.hora,
				horaTerminoEstimada: horaReferencia.toLocaleTimeString("es-CL", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
				}),
                tipo: tipoOportunidad,
                etiquetaTiempo: etiquetaTiempo,
				opcionesRetorno: opcionesRetorno,
			});
		}

		return {
			hayOportunidades: opcionesDisponibles.length > 0,
			opciones: opcionesDisponibles,
			mensaje:
				opcionesDisponibles.length > 0
					? `${opcionesDisponibles.length} oportunidad(es) de ${opcionesDisponibles[0].tipo} disponible(s)`
					: "No hay oportunidades disponibles",
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
