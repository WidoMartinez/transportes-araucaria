// src/hooks/useTarifaDinamica.js
import { useState, useEffect, useCallback } from "react";

const API_BASE_URL =
        import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";

const MILISEGUNDOS_DIA = 1000 * 60 * 60 * 24;

const REGLAS_ANTICIPACION = [
        {
                minimo: 0,
                maximo: 0,
                porcentaje: 25,
                descripcion: "Recargo por reserva el mismo día",
        },
        {
                minimo: 1,
                maximo: 3,
                porcentaje: 10,
                descripcion: "Recargo por reserva con poca anticipación",
        },
        {
                minimo: 4,
                maximo: 13,
                porcentaje: 0,
                descripcion: "Precio estándar por anticipación",
        },
        {
                minimo: 14,
                maximo: 20,
                porcentaje: -5,
                descripcion: "Descuento por reserva con anticipación media",
        },
        {
                minimo: 21,
                maximo: 29,
                porcentaje: -10,
                descripcion: "Descuento por reserva con alta anticipación",
        },
        {
                minimo: 30,
                maximo: null,
                porcentaje: -15,
                descripcion: "Descuento máximo por reserva con mucha anticipación",
        },
];

const DIAS_ALTA_DEMANDA = new Set([0, 5, 6]);

const construirFechaViaje = (fecha, hora) => {
        const horaNormalizada = hora?.length === 5 ? hora : `${hora}`.slice(0, 5);
        const fechaIso = `${fecha}T${horaNormalizada || "00:00"}:00`;
        const fechaViaje = new Date(fechaIso);

        if (Number.isNaN(fechaViaje.getTime())) {
                throw new Error("Fecha u hora del viaje inválidas");
        }

        return fechaViaje;
};

const calcularDiasAnticipacion = (fechaViaje) => {
        const hoy = new Date();
        const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const inicioViaje = new Date(
                fechaViaje.getFullYear(),
                fechaViaje.getMonth(),
                fechaViaje.getDate()
        );
        const diferencia = Math.floor((inicioViaje - inicioHoy) / MILISEGUNDOS_DIA);

        return Math.max(0, diferencia);
};

const encontrarReglaAnticipacion = (diasAnticipacion) =>
        REGLAS_ANTICIPACION.find((regla) => {
                if (regla.maximo === null) {
                        return diasAnticipacion >= regla.minimo;
                }
                return diasAnticipacion >= regla.minimo && diasAnticipacion <= regla.maximo;
        }) || {
                minimo: 0,
                maximo: null,
                porcentaje: 0,
                descripcion: "Sin ajustes por anticipación",
        };

const calcularTarifaLocal = (precioBase, destino, fecha, hora) => {
        const base = Number(precioBase);
        if (!Number.isFinite(base) || base <= 0) {
                throw new Error("El precio base debe ser un número positivo");
        }

        const fechaViaje = construirFechaViaje(fecha, hora);
        const diasAnticipacion = calcularDiasAnticipacion(fechaViaje);
        const ajustesAplicados = [];

        const reglaAnticipacion = encontrarReglaAnticipacion(diasAnticipacion);
        if (reglaAnticipacion.porcentaje !== 0) {
                        ajustesAplicados.push({
                                tipo: "anticipacion",
                                descripcion: reglaAnticipacion.descripcion,
                                porcentaje: reglaAnticipacion.porcentaje,
                        });
        }

        const diaSemana = fechaViaje.getDay();
        if (DIAS_ALTA_DEMANDA.has(diaSemana)) {
                ajustesAplicados.push({
                        tipo: "dia_semana",
                        descripcion: "Recargo por día de alta demanda (viernes a domingo)",
                        porcentaje: 10,
                });
        }

        const horaViaje = fechaViaje.getHours();
        if (horaViaje < 9) {
                ajustesAplicados.push({
                        tipo: "horario",
                        descripcion: "Recargo por horario temprano (antes de las 09:00)",
                        porcentaje: 15,
                });
        }

        const ajusteAnticipacion =
                reglaAnticipacion.porcentaje !== 0 ? reglaAnticipacion.porcentaje : 0;
        const ajusteExtra = ajustesAplicados
                .filter((ajuste) => ajuste.tipo !== "anticipacion")
                .reduce((acc, ajuste) => acc + ajuste.porcentaje, 0);
        const ajusteTotal = ajusteAnticipacion + ajusteExtra;
        const precioFinal = Math.round(base * (1 + ajusteTotal / 100) * 100) / 100;
        const ajusteMonetario = Number((precioFinal - base).toFixed(2));

        if (reglaAnticipacion.porcentaje === 0) {
                ajustesAplicados.unshift({
                        tipo: "anticipacion",
                        descripcion: reglaAnticipacion.descripcion,
                        porcentaje: 0,
                });
        }

        return {
                precioBase: base,
                ajusteTotal,
                ajusteMonto: ajusteMonetario,
                precioFinal,
                diasAnticipacion,
                destino,
                ajustesAplicados,
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
                // No calcular si faltan datos
                if (!precioBase || !destino || !fecha || !hora) {
                        setTarifaDinamica(null);
                        return;
                }

                try {
                        setLoading(true);
                        setError(null);

                        try {
                                const response = await fetch(
                                        `${API_BASE_URL}/api/tarifa-dinamica/calcular`,
                                        {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                        precioBase,
                                                        destino,
                                                        fecha,
                                                        hora: hora + ":00",
                                                }),
                                        }
                                );

                                if (response.ok) {
                                        const data = await response.json();
                                        setTarifaDinamica(data);
                                        return;
                                }

                                console.warn(`El endpoint /api/tarifa-dinamica/calcular respondió ${response.status}, se usa cálculo local.`);
                        } catch (remoteError) {
                                console.info(
                                        "Servicio remoto de tarifa dinámica no disponible, usando cálculo local.",
                                        remoteError
                                );
                        }

                        const resultadoLocal = calcularTarifaLocal(precioBase, destino, fecha, hora);
                        setTarifaDinamica(resultadoLocal);
                } catch (err) {
                        console.error("Error calculando tarifa dinámica:", err);
                        setError(err.message);
                        // En caso de error, devolver precio base sin ajustes
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

                        const params = new URLSearchParams({ estado: "disponible" });
                        if (tipo) {
                                params.set("tipo", tipo);
                        }

                        const endpoint = `${API_BASE_URL}/api/vehiculos?${params.toString()}`;
                        const response = await fetch(endpoint);

                        if (!response.ok) {
                                throw new Error("Error al verificar disponibilidad");
                        }

                        const data = await response.json();
                        const disponibles = Array.isArray(data.vehiculos)
                                ? data.vehiculos.length
                                : 0;
                        setDisponibilidad({
                                hayDisponibilidad: disponibles > 0,
                                disponibles,
                        });
                } catch (err) {
                        console.error("Error verificando disponibilidad:", err);
                        setError(err.message);
                        setDisponibilidad({ hayDisponibilidad: true, disponibles: 0 });
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
