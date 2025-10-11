import React from "react";
import logoBlanco from "../assets/logoblanco.png";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

// Componente interno para manejar los enlaces del footer de manera consistente
const FooterLink = ({ href, children }) => (
	<a
		href={href}
		className="text-muted-foreground hover:text-white transition-colors"
	>
		{children}
	</a>
);

// Componente interno para los iconos de redes sociales
// eslint-disable-next-line no-unused-vars
const SocialIcon = ({ href, icon: Icon }) => (
	<a
		href={href}
		target="_blank"
		rel="noopener noreferrer"
		className="text-muted-foreground hover:text-white transition-colors"
	>
		<Icon className="h-5 w-5" />
	</a>
);

function Footer() {
	return (
		<footer className="bg-gray-900 text-white">
			<div className="container mx-auto px-4 py-12">
				<div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-12">
					{/* Logo y descripción breve */}
					<div className="flex flex-col items-center md:items-start max-w-xs">
						<img
							src={logoBlanco}
							alt="Transportes Araucanía"
							className="h-16 mb-3"
						/>
						<p className="text-muted-foreground text-sm text-center md:text-left">
							Transporte privado de pasajeros en La Araucanía
						</p>
					</div>

					{/* Enlaces rápidos */}
					<nav className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm">
						<FooterLink href="#servicios">Servicios</FooterLink>
						<FooterLink href="#destinos">Destinos</FooterLink>
						<FooterLink href="#contacto">Contacto</FooterLink>
						<FooterLink href="#">Términos</FooterLink>
					</nav>

					{/* Contacto */}
					<div className="flex flex-col items-center md:items-start gap-2 text-sm text-muted-foreground">
						<a
							href="tel:+56936643540"
							className="hover:text-white transition-colors"
						>
							+56 9 3664 3540
						</a>
						<a
							href="mailto:contacto@transportesaraucaria.cl"
							className="hover:text-white transition-colors"
						>
							contacto@transportesaraucaria.cl
						</a>
					</div>

					{/* Redes sociales */}
					<div className="flex gap-4">
						<SocialIcon href="#" icon={Facebook} />
						<SocialIcon href="#" icon={Instagram} />
						<SocialIcon href="#" icon={Twitter} />
						<SocialIcon href="#" icon={Linkedin} />
					</div>
				</div>
			</div>

			{/* Barra inferior minimalista */}
			<div className="border-t border-gray-800/50">
				<div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
					<p>
						&copy; {new Date().getFullYear()} Transportes Araucanía
					</p>
					<p>
						Desarrollado por{" "}
						<a
							href="https://anunciads.cl"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-white transition-colors"
						>
							anunciAds
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
