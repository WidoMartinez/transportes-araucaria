// src/hooks/useReservaActiva.js
/**
 * Hook personalizado para manejar verificación de reservas activas
 * Separa la lógica de negocio del componente UI
 */

import { useState, useCallback } from "react";
import { verificarReservaActiva as verificarReservaActivaService } from "../services/reservaService";
import { getDuracionEstimada } from "../constants/tiempos";

/**
 * Hook para verificar y gestionar reservas activas del usuario
 * @param {Array} destinosData - Datos de destinos para calcular duraciones
 * @returns {Object} Estado y funciones para manejar reservas activas
 */
export const useReservaActiva = (destinosData = []) => {
  const [reservaActiva, setReservaActiva] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [horaTerminoServicio, setHoraTerminoServicio] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Verifica si un email tiene una reserva activa
   * @param {string} email - Email del usuario
   */
  const verificar = useCallback(
    async (email) => {
      if (!email || !email.trim()) {
        setReservaActiva(null);
        setHoraTerminoServicio(null);
        setError(null);
        return;
      }

      setVerificando(true);
      setError(null);

      try {
        const resultado = await verificarReservaActivaService(email);

        if (resultado.error) {
          setError({
            tipo: "red",
            mensaje: "No pudimos verificar tu reserva. Intenta nuevamente.",
          });
          setReservaActiva(null);
          setHoraTerminoServicio(null);
          return;
        }

        const reserva = resultado.reserva;
        setReservaActiva(reserva);

        // Calcular hora de término del servicio si hay reserva activa
        if (reserva && reserva.fecha && reserva.hora) {
          const destinoObj = Array.isArray(destinosData)
            ? destinosData.find((d) => d.nombre === reserva.destino)
            : null;

          const duracionMinutos = getDuracionEstimada(destinoObj);

          // Calcular hora de término del servicio original
          const [horas, minutos] = reserva.hora.split(":").map(Number);
          const fechaHoraInicio = new Date(`${reserva.fecha}T00:00:00`);
          fechaHoraInicio.setHours(horas, minutos, 0, 0);

          const horaTermino = new Date(
            fechaHoraInicio.getTime() + duracionMinutos * 60 * 1000
          );
          setHoraTerminoServicio(horaTermino);
        } else {
          setHoraTerminoServicio(null);
        }
      } catch (err) {
        console.error("Error inesperado verificando reserva:", err);
        setError({
          tipo: "desconocido",
          mensaje: "Ocurrió un error inesperado. Intenta nuevamente.",
        });
        setReservaActiva(null);
        setHoraTerminoServicio(null);
      } finally {
        setVerificando(false);
      }
    },
    [destinosData]
  );

  /**
   * Limpia el estado de reserva activa
   */
  const limpiar = useCallback(() => {
    setReservaActiva(null);
    setHoraTerminoServicio(null);
    setError(null);
  }, []);

  return {
    reservaActiva,
    horaTerminoServicio,
    verificando,
    error,
    verificar,
    limpiar,
  };
};
