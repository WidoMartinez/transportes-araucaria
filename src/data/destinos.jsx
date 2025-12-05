// src/data/destinos.js

// Importar imágenes de los destinos
import temucoImg from "../assets/temuco.jpg";
import villarricaImg from "../assets/villarrica.jpg";
import puconImg from "../assets/pucon.jpg";
import corralcoImg from "../assets/corralco.jpg";
import icalmaImg from "../assets/icalma.jpg";
import lonquimayImg from "../assets/lonquimay.jpg";
import conguillioImg from "../assets/conguilllio.jpg";
import heroVan from "../assets/hero-van.png"; // Fix: Import heroVan

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
	{
		nombre: "Icalma",
		titulo: "Laguna Icalma",
		subtitulo: "Naturaleza Glaciar y Cultura Pehuenche",
		descripcion:
			"Descubre la hermosa Laguna Icalma, un cuerpo de agua de origen glaciar rodeado de bosques nativos y montañas. Ideal para pesca, navegación, senderismo y conocer la rica cultura pehuenche de la zona.",
		imagen: icalmaImg,
	},
	{
		nombre: "Lonquimay",
		titulo: "Volcán Lonquimay",
		subtitulo: "Aventura y Naturaleza Pura",
		descripcion:
			"Descubre la majestuosidad del volcán Lonquimay y sus alrededores. Trekking, observación de flora y fauna, y paisajes volcánicos únicos te esperan en este destino de aventura.",
		imagen: lonquimayImg,
	},
	{
		nombre: "Conguillío",
		titulo: "Parque Nacional Conguillío",
		subtitulo: "La Araucanía en su Estado Puro",
		descripcion:
			"Explora uno de los parques nacionales más hermosos de Chile. Bosques de araucarias milenarias, lagos cristalinos y el volcán Llaima te ofrecen una experiencia natural incomparable.",
		imagen: conguillioImg,
	},
];

/**
 * @type {object}
 * Información turística enriquecida para el panel dinámico (HeroExpress).
 * Contiene datos interesantes, distancias, y puntos de interés.
 */
export const destinosInfo = {
	"Temuco": {
		titulo: "Capital de La Araucanía",
		bajada: "Historia, cultura y comercio en el corazón de la región.",
		distancia: "25 km desde Aeropuerto ZCO",
		tiempo: "25 min aprox.",
		puntosInteres: ["Cerro Ñielol", "Museo Ferroviario", "Mercado Municipal"],
		datoCurioso: "Es la puerta de entrada a la cultura Mapuche y grandes parques nacionales.",
		imagen: temucoImg
	},
	"Villarrica": {
		titulo: "Villarrica: Lago y Volcán",
		bajada: "Naturaleza imponente y vida lacustre.",
		distancia: "65 km desde Aeropuerto ZCO",
		tiempo: "55 min aprox.",
		puntosInteres: ["Costanera del Lago", "Volcán Villarrica", "Ferias Artesanales"],
		datoCurioso: "Su nombre en mapudungún significa 'Ruka Pillañ' (Casa del Pillán).",
		imagen: villarricaImg
	},
	"Pucón": {
		titulo: "Pucón: Centro de Aventura",
		bajada: "La capital del turismo aventura en el sur de Chile.",
		distancia: "105 km desde Aeropuerto ZCO",
		tiempo: "1h 20m aprox.",
		puntosInteres: ["Volcán Villarrica", "Termas Geométricas", "Ojos del Caburgua"],
		datoCurioso: "Es uno de los destinos más populares de Chile por su oferta de deportes extremos y termas.",
		imagen: puconImg
	},
	"Corralco": {
		titulo: "Corralco y Malalcahuello",
		bajada: "Nieve, araucarias y paisajes volcánicos.",
		distancia: "120 km desde Aeropuerto ZCO",
		tiempo: "2h 00m aprox.",
		puntosInteres: ["Centro de Ski Corralco", "Reserva Nacional", "Cráter Navidad"],
		datoCurioso: "Se ubica en la ladera del volcán Lonquimay, rodeado de un bosque de araucarias milenarias.",
		imagen: corralcoImg
	},
	"Icalma": {
		titulo: "Laguna Icalma",
		bajada: "Tranquilidad y cultura en la frontera andina.",
		distancia: "130 km desde Aeropuerto ZCO",
		tiempo: "2h 30m aprox.",
		puntosInteres: ["Laguna Icalma", "Batea Mahuida", "Mirador del Biobío"],
		datoCurioso: "Sus aguas cristalinas reflejan las montañas y son ideales para la desconexión total.",
		imagen: icalmaImg
	},
	"Lonquimay": {
		titulo: "Lonquimay",
		bajada: "La esencia de la cordillera de La Araucanía.",
		distancia: "150 km desde Aeropuerto ZCO",
		tiempo: "2h 30m aprox.",
		puntosInteres: ["Túnel Las Raíces", "Cuesta Las Raíces", "Río Biobío"],
		datoCurioso: "Alberga el Túnel Las Raíces, que fue el túnel ferroviario más largo de Sudamérica.",
		imagen: lonquimayImg
	},
	"Conguillío": {
		titulo: "Parque Nacional Conguillío",
		bajada: "Paisajes prehistóricos y naturaleza virgen.",
		distancia: "120 km desde Aeropuerto ZCO",
		tiempo: "2h 00m aprox.",
		puntosInteres: ["Lago Conguillío", "Volcán Llaima", "Laguna Arcoíris"],
		datoCurioso: "Fue elegido por la BBC para filmar 'Caminando con Dinosaurios' por su paisaje jurásico.",
		imagen: conguillioImg
	},
	"Aeropuerto La Araucanía": {
		titulo: "Aeropuerto La Araucanía",
		bajada: "Tu punto de conexión con el sur de Chile.",
		distancia: "A 20 km de Temuco",
		tiempo: "Ubicación Central",
		puntosInteres: ["Conectividad Total", "Servicio 24/7", "Seguridad"],
		datoCurioso: "Es el principal terminal aéreo de la región, inaugurado en 2014.",
		imagen: heroVan
	}
};
