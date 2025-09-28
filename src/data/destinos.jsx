// src/data/destinos.js

// Importar imágenes de los destinos
import temucoImg from "../assets/temuco.jpg";
import villarricaImg from "../assets/villarrica.jpg";
import puconImg from "../assets/pucon.jpg";
import corralcoImg from "../assets/corralco.jpg";

/**
 * @typedef {object} PrecioVehiculo
 * @property {number} base - El precio base para el servicio en este tipo de vehículo.
 * @property {number} porcentajeAdicional - El porcentaje a añadir por cada pasajero adicional.
 */

/**
 * @typedef {object} Destino
 * @property {string} nombre - El nombre del destino.
 * @property {string} descripcion - Una breve descripción para mostrar en la tarjeta del destino.
 * @property {string} tiempo - Tiempo estimado de viaje desde el aeropuerto.
 * @property {string} imagen - La imagen importada para el destino.
 * @property {number} maxPasajeros - El número máximo de pasajeros permitido para este destino.
 * @property {number} minHorasAnticipacion - Las horas mínimas de anticipación para reservar.
 * @property {{auto: PrecioVehiculo, van?: PrecioVehiculo}} precios - Un objeto con los precios para cada tipo de vehículo.
 */

/**
 * @type {Destino[]}
 * Esta es la lista de destinos por defecto. Sirve como punto de partida si el servidor no responde
 * o si el archivo de configuración en el servidor está vacío.
 * El panel de administración te permitirá modificar, añadir o eliminar estos destinos dinámicamente.
 */
export const destinosBase = [
	{
		nombre: "Temuco",
		descripcion: "Centro comercial y administrativo de La Araucanía.",
		tiempo: "45 min",
		imagen: temucoImg,
		maxPasajeros: 7, // Habilitado para hasta 7 pasajeros
		minHorasAnticipacion: 5,
		precios: {
			auto: { base: 20000, porcentajeAdicional: 0.1 },
			van: { base: 45000, porcentajeAdicional: 0.1 }, // Precio base para la van en Temuco
		},
	},
	{
		nombre: "Villarrica",
		descripcion: "Turismo y naturaleza junto al lago.",
		tiempo: "1h 15min",
		imagen: villarricaImg,
		maxPasajeros: 7,
		minHorasAnticipacion: 5,
		precios: {
			auto: { base: 55000, porcentajeAdicional: 0.05 },
			van: { base: 200000, porcentajeAdicional: 0.05 },
		},
	},
	{
		nombre: "Pucón",
		descripcion: "Aventura, termas y volcán.",
		tiempo: "1h 30min",
		imagen: puconImg,
		maxPasajeros: 7,
		minHorasAnticipacion: 5,
		precios: {
			auto: { base: 60000, porcentajeAdicional: 0.05 },
			van: { base: 250000, porcentajeAdicional: 0.05 },
		},
	},
];

/**
 * @type {object[]}
 * Datos para la sección de destinos destacados o de temporada.
 */
export const destacadosData = [
	{
		nombre: "Corralco",
		titulo: "Visita Corralco en Temporada de Nieve",
		subtitulo: "Una Aventura Invernal Inolvidable",
		descripcion:
			"Disfruta de la majestuosa nieve en el centro de ski Corralco, a los pies del volcán Lonquimay. Ofrecemos traslados directos y seguros para que solo te preocupes de disfrutar las pistas y los paisajes.",
		imagen: corralcoImg,
	},
];
