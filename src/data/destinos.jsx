// src/data/destinos.js

// Importar imágenes
import temucoImg from "../assets/temuco.jpg";
import villarricaImg from "../assets/villarrica.jpg";
import puconImg from "../assets/pucon.jpg";
import corralcoImg from "../assets/corralco.jpg";

// Estructura base de destinos. Se exporta para ser usada en toda la aplicación.
export const destinosBase = [
	{
		nombre: "Temuco",
		descripcion: "Centro comercial y administrativo de La Araucanía.",
		tiempo: "45 min",
		imagen: temucoImg,
		maxPasajeros: 4,
		minHorasAnticipacion: 5,
		precios: {
			auto: { base: 20000, porcentajeAdicional: 0.1 },
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

// Datos derivados que también se exportan para mantener la consistencia
export const todosLosTramos = [
	"Aeropuerto La Araucanía",
	...destinosBase.map((d) => d.nombre),
];

export const origenesContacto = ["Aeropuerto La Araucanía", "Otro"];

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
