import React from "react";
import {
	Phone,
	Mail,
	MapPin,
	MessageCircle,
	Facebook,
	Instagram,
} from "lucide-react";
import logoBlanco from "../assets/logoblanco.png";

// Columnas de links del footer — preservando los del proyecto original
const footerLinks = {
	Servicios: [
		{ label: "Traslado individual", href: "#servicios" },
		{ label: "Grupos y eventos", href: "#servicios" },
		{ label: "Tours a medida", href: "#tours" },
		{ label: "Traslados privados", href: "/traslados" },
	],
	Destinos: [
		{ label: "Pucón", href: "#destinos" },
		{ label: "Villarrica", href: "#destinos" },
		{ label: "Lican Ray", href: "#destinos" },
		{ label: "Coñaripe", href: "#destinos" },
		{ label: "Malalcahuello", href: "#destinos" },
	],
	Empresa: [
		{ label: "Sobre nosotros", href: "#" },
		{ label: "Conductores", href: "#" },
		{ label: "Nuestra flota", href: "#" },
		{ label: "Términos y condiciones", href: "#" },
	],
};

function Footer() {
	return (
		<footer id="contacto" className="bg-[#111F0A] text-slate-400">
			<div className="mx-auto max-w-7xl px-6 py-20">
				<div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
					{/* Columna de marca */}
					<div>
						{/* Logo original con imagen PNG del proyecto */}
						<a href="#inicio" className="flex items-center gap-3 text-white">
							<img
								src={logoBlanco}
								alt="Transportes Araucaria"
								className="h-16 object-contain"
							/>
						</a>

						<p className="mt-5 max-w-xs text-sm leading-relaxed">
							Servicio profesional de traslados privados entre el Aeropuerto
							Araucanía y los principales destinos del sur de Chile. Puntualidad
							y calidad garantizadas.
						</p>

						{/* Información de contacto */}
						<ul className="mt-7 space-y-3 text-sm">
							<li>
								<a
									href="mailto:contacto@transportesaraucaria.cl"
									className="flex items-center gap-2.5 transition-colors hover:text-white"
								>
									<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
										<Mail className="h-3.5 w-3.5 text-[#8C5E42]" />
									</span>
									contacto@transportesaraucaria.cl
								</a>
							</li>
							<li className="flex items-center gap-2.5">
								<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
									<MapPin className="h-3.5 w-3.5 text-[#8C5E42]" />
								</span>
								Temuco, Región de La Araucanía
							</li>
						</ul>

						{/* Redes sociales */}
						<div className="mt-6 flex gap-3">
							<a
								href="https://web.facebook.com/rutaaraucaria/"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Facebook"
								className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10 hover:text-white"
							>
								<Facebook className="h-4 w-4" />
							</a>
							<a
								href="https://www.instagram.com/rutaaraucaria/"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Instagram"
								className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10 hover:text-white"
							>
								<Instagram className="h-4 w-4" />
							</a>
							<a
								href="https://wa.me/56936643540"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="WhatsApp"
								className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10 hover:text-white"
							>
								<MessageCircle className="h-4 w-4" />
							</a>
						</div>
					</div>

					{/* Columnas de links */}
					{Object.entries(footerLinks).map(([title, links]) => (
						<div key={title}>
							<p className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white font-serif">
								{title}
							</p>
							<ul className="space-y-4 text-sm font-sans">
								{links.map((link) => (
									<li key={link.label}>
										<a
											href={link.href}
											className="transition-all duration-300 hover:text-white hover:translate-x-1 inline-block"
										>
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				{/* Divisor */}
				<div className="my-12 h-px bg-white/6" />

				{/* Barra inferior */}
				<div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
					<p>
						© {new Date().getFullYear()} Transportes Araucaria · Todos los
						derechos reservados.
					</p>
					<div className="flex items-center gap-6">
						<a href="#" className="transition-colors hover:text-slate-400">
							Política de privacidad
						</a>
						<a href="#" className="transition-colors hover:text-slate-400">
							Términos de servicio
						</a>
						<span>
							Diseñado por{" "}
							<a
								href="https://anunciads.cl"
								target="_blank"
								rel="noopener noreferrer"
								className="transition-colors hover:text-slate-400 font-medium"
							>
								anunciAds
							</a>
						</span>
					</div>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
