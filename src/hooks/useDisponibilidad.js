// src/hooks/useDisponibilidad.js
/**
 * Hook personalizado para verificar disponibilidad de vehículos y oportunidades de retorno
 * Separa la lógica de negocio del componente UI
 */

import { useState, useCallback } from "react";
import {
  verificarDisponibilidad as verificarDisponibilidadService,
  verificarOportunidadesRetorno as verificarOportunidadesRetornoService,
  verificarBloqueo as verificarBloqueoService,
} from "../services/reservaService";
import { getDuracionEstimada } from "../constants/tiempos";

/**
 * Hook para verificar disponibilidad y oportunidades de descuento
 * @param {Array} destinosData - Datos de destinos para calcular duraciones
 * @returns {Object} Estado y funciones para manejar disponibilidad
 */
export const useDisponibilidad = (destinosData = []) => {
  const [verificando, setVerificando] = useState(false);
  const [descuentoRetorno, setDescuentoRetorno] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Verifica disponibilidad completa (bloques, capacidad y descuentos)
   * @param {Object} params - Parámetros de la verificación
   * @param {string} params.destino - Destino seleccionado
   * @param {string} params.origen - Origen seleccionado
   * @param {string} params.fecha - Fecha en formato YYYY-MM-DD
   * @param {string} params.hora - Hora en formato HH:MM
   * @param {number} params.pasajeros - Número de pasajeros
   * @returns {Promise<{disponible: boolean, mensaje: string|null}>}
   */
  const verificar = useCallback(
    async ({ destino, origen, fecha, hora, pasajeros }) => {
      if (!destino || !fecha || !hora) {
        return { disponible: true, mensaje: null };
      }

      setVerificando(true);
      setError(null);
      setDescuentoRetorno(null);

      try {
        // 1. Verificar bloqueos
        const resultadoBloqueo = await verificarBloqueoService({ fecha, hora });

        if (resultadoBloqueo.error) {
          setError({
            tipo: "red",
            mensaje: "No pudimos verificar disponibilidad. Intenta nuevamente.",
          });
          // Continuar en caso de error de red
        } else if (resultadoBloqueo.bloqueado) {
          return {
            disponible: false,
            mensaje: `Agenda completada. ${resultadoBloqueo.motivo || "Esta fecha/hora no está disponible para reservas."}`,
          };
        }

        // 2. Calcular duración del viaje
        const destinoObj = Array.isArray(destinosData)
          ? destinosData.find((d) => d.nombre === destino)
          : null;

        const duracionMinutos = getDuracionEstimada(destinoObj);

        // 3. Verificar capacidad de vehículos
        const resultadoDisponibilidad = await verificarDisponibilidadService({
          fecha,
          hora,
          duracionMinutos,
          pasajeros,
        });

        if (resultadoDisponibilidad.error) {
          setError({
            tipo: "red",
            mensaje: "No pudimos verificar capacidad. Intenta nuevamente.",
          });
          // Continuar en caso de error de red (fail open)
        } else if (!resultadoDisponibilidad.disponible) {
          return {
            disponible: false,
            mensaje:
              resultadoDisponibilidad.mensaje ||
              "No hay vehículos disponibles.",
          };
        }

        // 4. Verificar oportunidades de retorno con descuento
        const resultadoRetorno = await verificarOportunidadesRetornoService({
          origen,
          destino,
          fecha,
          hora,
        });

        if (resultadoRetorno.error) {
          // No es crítico, solo no mostramos descuentos
          console.warn("No se pudo verificar descuentos de retorno");
        } else if (resultadoRetorno.hayOportunidad) {
          setDescuentoRetorno(resultadoRetorno.descuento);
        }

        return { disponible: true, mensaje: null };
      } catch (err) {
        console.error("Error inesperado verificando disponibilidad:", err);
        setError({
          tipo: "desconocido",
          mensaje: "Ocurrió un error inesperado. Intenta nuevamente.",
        });
        // En caso de error inesperado, permitimos continuar (fail open)
        return { disponible: true, mensaje: null };
      } finally {
        setVerificando(false);
      }
    },
    [destinosData]
  );

  /**
   * Limpia el estado de verificación
   */
  const limpiar = useCallback(() => {
    setDescuentoRetorno(null);
    setError(null);
  }, []);

  return {
    verificando,
    descuentoRetorno,
    error,
    verificar,
    limpiar,
  };
};
