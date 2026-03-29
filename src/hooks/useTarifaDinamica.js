// src/hooks/useTarifaDinamica.js
import { useState, useEffect, useCallback } from "react";

const API_BASE_URL =
        import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";

/**
 * Construye el objeto de tarifa sin ajustes (precio base plano).
 * Se utiliza cuando el backend no está disponible para evitar mostrar
 * precios calculados con reglas hardcodeadas que puedan diferir de la BD.
 */
const tarifaSinAjustes = (precioBase) => ({
        precioBase,
        ajusteTotal: 0,
        ajusteMonto: 0,
        precioFinal: precioBase,
        diasAnticipacion: 0,
        ajustesAplicados: [],
});

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
                        } else {
                                // Backend disponible pero respondió error: mostrar precio base sin ajustes
                                console.warn(
                                        `Tarifa dinámica: el backend respondió ${response.status}. Se muestra precio base sin ajustes.`
                                );
                                setTarifaDinamica(tarifaSinAjustes(precioBase));
                        }
                } catch (remoteError) {
                        // Backend no disponible (Render durmiendo, red, etc.): precio base sin ajustes
                        console.info(
                                "Tarifa dinámica: backend no disponible. Se muestra precio base sin ajustes.",
                                remoteError.message
                        );
                        setTarifaDinamica(tarifaSinAjustes(precioBase));
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
