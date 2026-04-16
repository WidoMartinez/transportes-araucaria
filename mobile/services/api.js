/**
 * Servicio de API para conectar la app móvil con el backend de Transportes Araucaria.
 * El backend está alojado en Render.com.
 *
 * Para desarrollo local, configurar EXPO_PUBLIC_BACKEND_URL en el archivo .env
 */

// URL base del backend. En producción apunta al servidor Render.com
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://transportes-araucaria.onrender.com';

/**
 * Realiza una petición fetch al backend con manejo de errores estándar.
 * @param {string} endpoint - Ruta relativa del endpoint (ej: '/api/reservas')
 * @param {RequestInit} opciones - Opciones de fetch (method, body, headers, etc.)
 * @returns {Promise<any>} Datos de respuesta en formato JSON
 */
const fetchAPI = async (endpoint, opciones = {}) => {
  const url = `${BACKEND_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...opciones.headers,
    },
    ...opciones,
  };

  try {
    const respuesta = await fetch(url, config);

    // Si la respuesta no es exitosa, lanzar error con el mensaje del servidor
    if (!respuesta.ok) {
      const datosError = await respuesta.json().catch(() => ({}));
      const mensajeError = datosError.error || datosError.message || `Error ${respuesta.status}`;
      throw new Error(mensajeError);
    }

    return await respuesta.json();
  } catch (error) {
    // Registrar el error para diagnóstico
    console.error(`[API] Error en ${endpoint}:`, error.message);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DE RESERVAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene la lista de reservas del sistema.
 * @returns {Promise<Array>} Lista de reservas
 */
export const obtenerReservas = () => fetchAPI('/api/reservas');

/**
 * Obtiene el detalle de una reserva por su ID.
 * @param {number|string} id - ID de la reserva
 * @returns {Promise<Object>} Datos de la reserva
 */
export const obtenerReserva = (id) => fetchAPI(`/api/reservas/${id}`);

/**
 * Crea una nueva reserva.
 * @param {Object} datosReserva - Datos de la nueva reserva
 * @returns {Promise<Object>} Reserva creada
 */
export const crearReserva = (datosReserva) =>
  fetchAPI('/api/reservas', {
    method: 'POST',
    body: JSON.stringify(datosReserva),
  });

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DE DISPONIBILIDAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica la disponibilidad para una fecha y número de pasajeros.
 * @param {Object} params - Parámetros de verificación
 * @param {string} params.fecha - Fecha del viaje (YYYY-MM-DD)
 * @param {number} params.pasajeros - Número de pasajeros
 * @returns {Promise<Object>} Resultado de disponibilidad
 */
export const verificarDisponibilidad = (params) =>
  fetchAPI(
    `/api/disponibilidad/verificar?fecha=${params.fecha}&pasajeros=${params.pasajeros}`
  );

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DE PRECIOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene la lista de tarifas disponibles.
 * @returns {Promise<Array>} Lista de tarifas
 */
export const obtenerTarifas = () => fetchAPI('/api/tarifas');
