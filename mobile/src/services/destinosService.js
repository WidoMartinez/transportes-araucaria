// Servicio de destinos para la app móvil.
// Usa el endpoint GET /api/destinos del backend en Render.com.
import api from "./api";

/**
 * Obtiene la lista de destinos disponibles.
 * @returns {array} Lista de destinos con nombre, precio y coordenadas.
 */
export async function obtenerDestinos() {
  const respuesta = await api.get("/api/destinos");
  return respuesta.data?.destinos || respuesta.data || [];
}

/**
 * Obtiene los precios del servicio para un par origen-destino.
 * @returns {object} Tarifas por tipo de vehículo.
 */
export async function obtenerPricing() {
  const respuesta = await api.get("/pricing");
  return respuesta.data;
}
