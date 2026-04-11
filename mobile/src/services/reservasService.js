// Servicio de reservas para la app móvil.
// Usa los endpoints del backend en Render.com: /enviar-reserva, /api/reservas/*
import api from "./api";

/**
 * Crea una nueva reserva de traslado.
 * @param {object} datos - Datos de la reserva.
 * @param {string} datos.nombre
 * @param {string} datos.email
 * @param {string} datos.telefono
 * @param {string} datos.origen
 * @param {string} datos.destino
 * @param {string} datos.fecha - Formato YYYY-MM-DD
 * @param {string} datos.hora - Formato HH:MM
 * @param {number} datos.pasajeros
 * @returns {object} Respuesta del servidor con código de reserva.
 */
export async function crearReserva(datos) {
  const respuesta = await api.post("/enviar-reserva", {
    ...datos,
    source: "mobile",
  });
  return respuesta.data;
}

/**
 * Verifica disponibilidad de vehículos para los parámetros dados.
 * @param {string} fecha - Formato YYYY-MM-DD
 * @param {string} hora - Formato HH:MM
 * @param {string} origen
 * @param {string} destino
 * @param {number} pasajeros
 * @returns {{ disponible: boolean, vehiculos: array }}
 */
export async function verificarDisponibilidad(fecha, hora, origen, destino, pasajeros) {
  const respuesta = await api.post("/api/disponibilidad/verificar", {
    fecha,
    hora,
    origen,
    destino,
    pasajeros,
  });
  return respuesta.data;
}

/**
 * Obtiene las reservas del usuario autenticado.
 * @returns {array} Lista de reservas del usuario.
 */
export async function obtenerMisReservas() {
  const respuesta = await api.get("/api/reservas/mis-reservas");
  return respuesta.data?.reservas || [];
}

/**
 * Obtiene el detalle de una reserva por su código.
 * @param {string} codigoReserva - Código único de la reserva.
 * @returns {object} Datos completos de la reserva.
 */
export async function obtenerReserva(codigoReserva) {
  const respuesta = await api.get(`/api/reservas/${codigoReserva}`);
  return respuesta.data?.reserva;
}

/**
 * Valida que el horario sea factible (no bloqueado, no festivo, etc.).
 * @param {string} fecha - Formato YYYY-MM-DD
 * @param {string} hora - Formato HH:MM
 * @returns {{ valido: boolean, motivo?: string }}
 */
export async function validarHorario(fecha, hora) {
  const respuesta = await api.post("/api/disponibilidad/validar-horario", {
    fecha,
    hora,
  });
  return respuesta.data;
}
