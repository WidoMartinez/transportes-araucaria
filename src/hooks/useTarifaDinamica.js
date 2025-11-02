// src/hooks/useTarifaDinamica.js
import { useState, useEffect, useCallback } from "react";
import { getBackendUrl } from "../lib/backend";

const RAW_BACKEND_URL = getBackendUrl();
const API_BASE_URL =
        RAW_BACKEND_URL === "" ? "" : RAW_BACKEND_URL || "https://transportes-araucaria.onrender.com";

const buildApiUrl = (path) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

const ANTICIPACION_REGLAS = [
        {
                nombre: "Reserva para el mismo día",
                tipo: "anticipacion",
                porcentaje: 0.25,
                diasMin: 0,
                diasMax: 0,
                detalle: "Recargo por coordinar el servicio en el mismo día",
        },
        {
                nombre: "Reserva con 1 a 3 días",
                tipo: "anticipacion",
                porcentaje: 0.1,
                diasMin: 1,
                diasMax: 3,
                detalle: "Recargo moderado por planificación ajustada",
        },
        {
                nombre: "Reserva con 4 a 13 días",
                tipo: "anticipacion",
                porcentaje: 0,
                diasMin: 4,
                diasMax: 13,
                detalle: "Se aplica la tarifa base del destino",
        },
        {
                nombre: "Reserva con 14 a 20 días",
                tipo: "anticipacion",
                porcentaje: -0.05,
                diasMin: 14,
                diasMax: 20,
                detalle: "Descuento por agendar con antelación",
        },
        {
                nombre: "Reserva con 21 a 29 días",
                tipo: "anticipacion",
                porcentaje: -0.1,
                diasMin: 21,
                diasMax: 29,
                detalle: "Descuento preferencial por planificación temprana",
        },
        {
                nombre: "Reserva con 30 días o más",
                tipo: "anticipacion",
                porcentaje: -0.15,
                diasMin: 30,
                diasMax: Infinity,
                detalle: "Descuento máximo por organizar con suficiente anticipación",
        },
];

const HORARIO_PREMIUM = {
        horaLimite: 9,
        porcentaje: 0.15,
        nombre: "Horario premium",
        detalle: "Recargo por traslados antes de las 09:00 hrs",
};

const DIAS_ALTA_DEMANDA = {
        dias: new Set([0, 5, 6]),
        porcentaje: 0.1,
        nombre: "Alta demanda fin de semana",
        detalle: "Recargo por operar en viernes, sábado o domingo",
};

const redondearMoneda = (monto) => Math.round(monto);

const calcularDiasAnticipacion = (fechaViaje) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaNormalizada = new Date(fechaViaje);
        fechaNormalizada.setHours(0, 0, 0, 0);

        const diferenciaMs = fechaNormalizada.getTime() - hoy.getTime();
        const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
        return Number.isFinite(dias) && dias >= 0 ? dias : 0;
};

const crearFechaViaje = (fecha, hora) => {
        if (!fecha) return null;
        const horaSegura = hora && /^\d{2}:\d{2}$/.test(hora) ? `${hora}:00` : "00:00:00";
        const fechaISO = `${fecha}T${horaSegura}`;
        const fechaViaje = new Date(fechaISO);
        return Number.isNaN(fechaViaje.getTime()) ? null : fechaViaje;
};

const calcularTarifaLocal = ({ precioBase, destino, fecha, hora }) => {
        const fechaViaje = crearFechaViaje(fecha, hora);
        if (!fechaViaje) {
                throw new Error("Fecha u hora inválida para calcular la tarifa dinámica");
        }

        const diasAnticipacion = calcularDiasAnticipacion(fechaViaje);
        const ajustesAplicados = [];

        const reglaAnticipacion = ANTICIPACION_REGLAS.find(
                (regla) => diasAnticipacion >= regla.diasMin && diasAnticipacion <= regla.diasMax
        );

        if (reglaAnticipacion) {
                ajustesAplicados.push({
                        nombre: reglaAnticipacion.nombre,
                        tipo: reglaAnticipacion.tipo,
                        porcentaje: reglaAnticipacion.porcentaje,
                        detalle: `${reglaAnticipacion.detalle}. Días de anticipación: ${diasAnticipacion}.`,
                });
        }

        if (DIAS_ALTA_DEMANDA.dias.has(fechaViaje.getDay())) {
                        ajustesAplicados.push({
                                nombre: DIAS_ALTA_DEMANDA.nombre,
                                tipo: "demanda",
                                porcentaje: DIAS_ALTA_DEMANDA.porcentaje,
                                detalle: `${DIAS_ALTA_DEMANDA.detalle}.`,
                        });
        }

        const horaViaje = hora && /^\d{2}:\d{2}$/.test(hora) ? parseInt(hora.split(":")[0], 10) : fechaViaje.getHours();
        if (Number.isInteger(horaViaje) && horaViaje < HORARIO_PREMIUM.horaLimite) {
                ajustesAplicados.push({
                        nombre: HORARIO_PREMIUM.nombre,
                        tipo: "horario",
                        porcentaje: HORARIO_PREMIUM.porcentaje,
                        detalle: `${HORARIO_PREMIUM.detalle}.`,
                });
        }

        const ajusteTotal = ajustesAplicados.reduce((total, ajuste) => total + ajuste.porcentaje, 0);
        const precioFinal = redondearMoneda(precioBase * (1 + ajusteTotal));

        return {
                precioBase,
                ajusteTotal,
                ajusteMonto: precioFinal - precioBase,
                precioFinal,
                diasAnticipacion,
                ajustesAplicados: ajustesAplicados.map((ajuste) => ({
                        ...ajuste,
                        destino,
                })),
        };
};

/**
 * Hook para calcular tarifa dinámica
 * @param {number} precioBase - Precio base del viaje
 * @param {string} destino - Nombre del destino
 * @param {string} fecha - Fecha del viaje (YYYY-MM-DD)
 * @param {string} hora - Hora del viaje (HH:MM)
 * @returns {Object} Datos de tarifa dinámica
 */
export function useTarifaDinamica(precioBase, destino, fecha, hora) {
        const [tarifaDinamica, setTarifaDinamica] = useState(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);

        const calcular = useCallback(async () => {
                if (!precioBase || !destino || !fecha || !hora) {
                        setTarifaDinamica(null);
                        return;
                }

                try {
                        setLoading(true);
                        setError(null);

                        const data = calcularTarifaLocal({ precioBase, destino, fecha, hora });
                        setTarifaDinamica(data);
                } catch (err) {
                        console.error("Error calculando tarifa dinámica:", err);
                        setError(err.message);
                        setTarifaDinamica({
                                precioBase,
                                ajusteTotal: 0,
                                ajusteMonto: 0,
                                precioFinal: precioBase,
                                diasAnticipacion: 0,
                                ajustesAplicados: [],
                        });
                } finally {
                        setLoading(false);
                }
        }, [precioBase, destino, fecha, hora]);

	useEffect(() => {
		calcular();
	}, [calcular]);

	return {
		tarifaDinamica,
		loading,
		error,
		recalcular: calcular,
	};
}

/**
 * Hook para verificar disponibilidad de vehículos
 * @param {string} fecha - Fecha del viaje
 * @param {string} hora - Hora del viaje
 * @param {string} tipo - Tipo de vehículo (auto, van)
 * @returns {Object} Disponibilidad de vehículos
 */
export function useDisponibilidadVehiculos(fecha, hora, tipo = null) {
        const [disponibilidad, setDisponibilidad] = useState(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);

        const verificar = useCallback(async () => {
		if (!fecha || !hora) {
			setDisponibilidad(null);
			return;
		}

		try {
                        setLoading(true);
                        setError(null);

                        const response = await fetch(buildApiUrl("/api/vehiculos"));
                        if (!response.ok) {
                                throw new Error("Error al obtener la flota de vehículos");
                        }

                        const data = await response.json();
                        const vehiculos = Array.isArray(data)
                                ? data
                                : Array.isArray(data?.vehiculos)
                                ? data.vehiculos
                                : [];

                        const vehiculosFiltrados = vehiculos.filter((vehiculo) => {
                                if (!vehiculo) return false;
                                if (tipo && vehiculo.tipo !== tipo) return false;
                                return vehiculo.estado === "disponible";
                        });

                        const ocupados = vehiculos.filter((vehiculo) =>
                                tipo ? vehiculo?.tipo === tipo && vehiculo?.estado === "en_uso" : vehiculo?.estado === "en_uso"
                        );

                        setDisponibilidad({
                                total: tipo
                                        ? vehiculos.filter((vehiculo) => vehiculo?.tipo === tipo).length
                                        : vehiculos.length,
                                disponibles: vehiculosFiltrados.length,
                                ocupados: ocupados.length,
                                vehiculosDisponibles: vehiculosFiltrados,
                                hayDisponibilidad: vehiculosFiltrados.length > 0,
                        });
                } catch (err) {
                        console.error("Error verificando disponibilidad:", err);
                        setError(err.message);
                        setDisponibilidad({
                                total: 0,
                                disponibles: 0,
                                ocupados: 0,
                                vehiculosDisponibles: [],
                                hayDisponibilidad: true,
                        });
                } finally {
                        setLoading(false);
                }
        }, [fecha, hora, tipo]);

	useEffect(() => {
		verificar();
	}, [verificar]);

	return {
		disponibilidad,
		loading,
		error,
		reverificar: verificar,
	};
}
