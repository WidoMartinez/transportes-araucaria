import React from "react";
import { Facebook, Instagram, ExternalLink } from "lucide-react";

// URLs oficiales de las redes sociales de Ruta Araucanía
const REDES_SOCIALES = [
	{
		nombre: "Facebook",
		usuario: "@rutaaraucaria",
		descripcion: "Publicamos noticias, ofertas y novedades de nuestros viajes.",
		href: "https://web.facebook.com/rutaaraucaria/",
		icon: Facebook,
		colorFondo: "bg-[#1877F2]/10 hover:bg-[#1877F2]/20",
		colorIcono: "text-[#1877F2]",
		colorBorde: "border-[#1877F2]/20",
	},
	{
		nombre: "Instagram",
		usuario: "@rutaaraucaria",
		descripcion: "Fotos, paisajes y momentos únicos de la Araucanía.",
		href: "https://www.instagram.com/rutaaraucaria/",
		icon: Instagram,
		colorFondo: "bg-[#E1306C]/10 hover:bg-[#E1306C]/20",
		colorIcono: "text-[#E1306C]",
		colorBorde: "border-[#E1306C]/20",
	},
];

// Componente de tarjeta para cada red social
const TarjetaRedSocial = ({
	nombre,
	usuario,
	descripcion,
	href,
	icon,
	colorFondo,
	colorIcono,
	colorBorde,
}) => {
	// Almacenar en variable con mayúscula para usarla como componente JSX
	const Icon = icon;
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 group cursor-pointer ${colorFondo} ${colorBorde}`}
			aria-label={`Visitar ${nombre} de Transportes Araucaria`}
		>
			{/* Ícono */}
			<div
				className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm ${colorIcono}`}
			>
				<Icon className="w-6 h-6" />
			</div>

			{/* Texto */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-semibold text-gray-800">{nombre}</span>
					<ExternalLink className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
				</div>
				<p className="text-sm text-gray-500 mt-0.5">{usuario}</p>
				<p className="text-sm text-gray-600 mt-1 leading-snug">{descripcion}</p>
			</div>
		</a>
	);
};

// Sección principal de redes sociales
function SeccionRedesSociales() {
	return (
		<section className="w-full py-16 bg-amber-50/60" id="redes-sociales">
			<div className="container mx-auto px-4 max-w-4xl">
				{/* Encabezado */}
				<div className="text-center mb-10">
					<p className="text-sm font-semibold uppercase tracking-widest text-amber-700 mb-2">
						Comunidad
					</p>
					<h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
						Síguenos en redes sociales
					</h2>
					<p className="text-gray-500 max-w-lg mx-auto text-base">
						Somos una empresa pequeña y en crecimiento. Cada follow nos ayuda a
						llegar a más personas de La Araucanía.
					</p>
				</div>

				{/* Tarjetas de redes sociales */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
					{REDES_SOCIALES.map((red) => (
						<TarjetaRedSocial key={red.nombre} {...red} />
					))}
				</div>

				{/* Mensaje de cierre orgánico */}
				<p className="text-center text-gray-400 text-sm mt-8">
					✨ Compartimos experiencias reales de nuestros pasajeros y los
					hermosos paisajes de la Araucanía.
				</p>
			</div>
		</section>
	);
}

export default SeccionRedesSociales;
