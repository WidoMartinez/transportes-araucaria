// src/services/reservaService.js
/**
 * Servicio para operaciones relacionadas con reservas
 * Centraliza la lógica de negocio de reservas
 */

import { getBackendUrl } from "../lib/backend";

/**
 * Verifica si un email tiene una reserva activa pendiente
 * @param {string} email - Email del usuario
 * @returns {Promise<{tieneReserva: boolean, reserva: Object|null, error: Error|null}>}
 */
export const verificarReservaActiva = async (email) => {
  if (!email || !email.trim()) {
    return { tieneReserva: false, reserva: null, error: null };
  }

  try {
    const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
    const response = await fetch(
      `${apiUrl}/api/reservas/verificar-activa/${encodeURIComponent(email.trim())}`
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      tieneReserva: data.tieneReservaActiva,
      reserva: data.tieneReservaActiva ? data.reserva : null,
      error: null,
    };
  } catch (error) {
    console.error("Error verificando reserva activa:", error);
    return {
      tieneReserva: false,
      reserva: null,
      error: error,
    };
  }
};

/**
 * Verifica la disponibilidad de vehículos para una fecha y hora
 * @param {Object} params - Parámetros de la verificación
 * @param {string} params.fecha - Fecha en formato YYYY-MM-DD
 * @param {string} params.hora - Hora en formato HH:MM
 * @param {number} params.duracionMinutos - Duración estimada del viaje
 * @param {number} params.pasajeros - Número de pasajeros
 * @returns {Promise<{disponible: boolean, mensaje: string|null, error: Error|null}>}
 */
export const verificarDisponibilidad = async ({
  fecha,
  hora,
  duracionMinutos,
  pasajeros,
}) => {
  if (!fecha || !hora) {
    return { disponible: true, mensaje: null, error: null };
  }

  try {
    const response = await fetch(
      `${getBackendUrl()}/api/disponibilidad/verificar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          hora,
          duracionMinutos,
          pasajeros: pasajeros || 1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      disponible: data.disponible,
      mensaje: data.disponible ? null : data.mensaje,
      error: null,
    };
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    // En caso de error de red, permitimos continuar (fail open)
    return {
      disponible: true,
      mensaje: null,
      error: error,
    };
  }
};

/**
 * Verifica oportunidades de retorno con descuento
 * @param {Object} params - Parámetros de la verificación
 * @param {string} params.origen - Origen del viaje
 * @param {string} params.destino - Destino del viaje
 * @param {string} params.fecha - Fecha en formato YYYY-MM-DD
 * @param {string} params.hora - Hora en formato HH:MM
 * @returns {Promise<{hayOportunidad: boolean, descuento: Object|null, error: Error|null}>}
 */
export const verificarOportunidadesRetorno = async ({
  origen,
  destino,
  fecha,
  hora,
}) => {
  try {
    const response = await fetch(
      `${getBackendUrl()}/api/disponibilidad/oportunidades-retorno`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origen, destino, fecha, hora }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.hayOportunidad && data.descuento > 0) {
      return {
        hayOportunidad: true,
        descuento: {
          porcentaje: data.descuento,
          mensaje: data.mensaje,
          detalles: data.detalles,
        },
        error: null,
      };
    }

    return { hayOportunidad: false, descuento: null, error: null };
  } catch (error) {
    console.error("Error verificando oportunidades de retorno:", error);
    return {
      hayOportunidad: false,
      descuento: null,
      error: error,
    };
  }
};

/**
 * Verifica si una fecha/hora está bloqueada
 * @param {Object} params - Parámetros de la verificación
 * @param {string} params.fecha - Fecha en formato YYYY-MM-DD
 * @param {string} params.hora - Hora en formato HH:MM
 * @returns {Promise<{bloqueado: boolean, motivo: string|null, error: Error|null}>}
 */
export const verificarBloqueo = async ({ fecha, hora }) => {
  try {
    const response = await fetch(`${getBackendUrl()}/api/bloqueos/verificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, hora }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      bloqueado: data.bloqueado,
      motivo: data.bloqueado ? data.motivo : null,
      error: null,
    };
  } catch (error) {
    console.error("Error verificando bloqueo:", error);
    // En caso de error, permitimos continuar (fail open)
    return {
      bloqueado: false,
      motivo: null,
      error: error,
    };
  }
};
