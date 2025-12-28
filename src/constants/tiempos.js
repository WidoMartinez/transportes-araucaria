// src/constants/tiempos.js
/**
 * Constantes centralizadas para tiempos de viaje y reservas
 */

/**
 * Duraciones estimadas de viaje por defecto
 */
export const DURACION_VIAJE = {
  /** Duración por defecto para viajes cortos (en minutos) */
  CORTA: 60,
  /** Duración por defecto para viajes largos (en minutos) */
  LARGA: 90,
};

/**
 * Tiempos mínimos de anticipación para reservas
 */
export const ANTICIPACION = {
  /** Horas mínimas de anticipación para reservar */
  MINIMO_HORAS: 5,
};

/**
 * Descuentos escalonados por tiempo de espera de retorno
 * Basado en los minutos transcurridos desde el término del servicio original
 */
export const DESCUENTOS_RETORNO = {
  /** Descuento máximo (50%) - exactamente 30 minutos */
  MAXIMO: {
    MINUTOS: 30,
    PORCENTAJE: 50,
  },
  /** Descuento intermedio (30%) - entre 31 y 45 minutos */
  INTERMEDIO: {
    MINUTOS_MAX: 45,
    PORCENTAJE: 30,
  },
  /** Descuento básico (20%) - entre 46 y 60 minutos */
  BASICO: {
    MINUTOS_MAX: 60,
    PORCENTAJE: 20,
  },
};

/**
 * Obtiene la duración estimada para un destino, con fallback a valor por defecto
 * @param {Object} destino - Objeto destino con duracionIdaMinutos
 * @param {boolean} esViajeCorto - Si es verdadero, usa duración corta como fallback
 * @returns {number} Duración estimada en minutos
 */
export const getDuracionEstimada = (destino, esViajeCorto = false) => {
  if (destino?.duracionIdaMinutos) {
    return destino.duracionIdaMinutos;
  }
  return esViajeCorto ? DURACION_VIAJE.CORTA : DURACION_VIAJE.LARGA;
};
