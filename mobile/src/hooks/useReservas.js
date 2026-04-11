// Hook para gestionar reservas desde la app móvil.
// Carga, crea y actualiza reservas usando el servicio de reservas.
import { useState, useEffect, useCallback } from "react";
import {
  obtenerMisReservas,
  crearReserva as crearReservaService,
  verificarDisponibilidad as verificarDisp,
} from "../services/reservasService";

/**
 * Hook de reservas.
 * @returns {{ reservas, cargando, error, recargar, crearReserva, verificarDisponibilidad }}
 */
export function useReservas() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Carga las reservas del usuario autenticado
  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerMisReservas();
      setReservas(data);
    } catch (err) {
      const mensaje = err?.response?.data?.error || "Error al cargar reservas";
      setError(mensaje);
      console.error("[useReservas] Error:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  /**
   * Crea una nueva reserva.
   * @param {object} datos - Datos del traslado.
   * @returns {object} Respuesta del servidor.
   */
  const crearReserva = useCallback(async (datos) => {
    setCargando(true);
    try {
      const resultado = await crearReservaService(datos);
      await recargar();
      return resultado;
    } catch (err) {
      const mensaje = err?.response?.data?.error || "Error al crear reserva";
      throw new Error(mensaje);
    } finally {
      setCargando(false);
    }
  }, [recargar]);

  /**
   * Verifica disponibilidad para los parámetros dados.
   */
  const verificarDisponibilidad = useCallback(async (params) => {
    const { fecha, hora, origen, destino, pasajeros } = params;
    return await verificarDisp(fecha, hora, origen, destino, pasajeros);
  }, []);

  return { reservas, cargando, error, recargar, crearReserva, verificarDisponibilidad };
}
