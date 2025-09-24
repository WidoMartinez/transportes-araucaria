import React from "react";
import logoBlanco from "../assets/logoblanco.png";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

// Componente interno para manejar los enlaces del footer de manera consistente
const FooterLink = ({ href, children }) => (
	<a
		href={href}
		className="text-muted-foreground hover:text-white transition-colors duration-300"
	>
		{children}
	</a>
);

// Componente interno para los iconos de redes sociales
const SocialIcon = ({ href, icon }) => {
        const IconComponent = icon;

        return (
                <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-white transition-colors duration-300"
                >
                        {IconComponent ? <IconComponent className="h-6 w-6" /> : null}
                </a>
        );
};

function Footer() {
	return (
		<footer className="bg-gray-900 text-white">
			<div className="container mx-auto px-4 py-16">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
					{/* Columna 1: Logo y Descripción */}
					<div className="space-y-4">
						<img
							src={logoBlanco}
							alt="Transportes Araucanía Logo"
							className="h-20"
						/>
						<p className="text-muted-foreground">
							Ofrecemos servicios de transporte privado de pasajeros con la más
							alta calidad, seguridad y puntualidad en la Región de La
							Araucanía.
						</p>
					</div>

					{/* Columna 2: Navegación */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg tracking-wider uppercase">
							Navegación
						</h3>
						<nav className="flex flex-col space-y-2">
							<FooterLink href="#servicios">Servicios</FooterLink>
							<FooterLink href="#destinos">Destinos</FooterLink>
							<FooterLink href="#contacto">Contacto</FooterLink>
							<FooterLink href="#">Términos y Condiciones</FooterLink>
						</nav>
					</div>

					{/* Columna 3: Contacto */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg tracking-wider uppercase">
							Contacto
						</h3>
						<div className="flex flex-col space-y-2 text-muted-foreground">
							<p>Temuco, Chile</p>
							<a
								href="tel:+56936643540"
								className="hover:text-white transition-colors duration-300"
							>
								+56 9 3664 3540
							</a>
							<a
								href="mailto:contacto@transportesaraucaria.cl"
								className="hover:text-white transition-colors duration-300"
							>
								contacto@transportesaraucaria.cl
							</a>
						</div>
					</div>

					{/* Columna 4: Redes Sociales */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg tracking-wider uppercase">
							Síguenos
						</h3>
						<div className="flex space-x-4">
							<SocialIcon href="#" icon={Facebook} />
							<SocialIcon href="#" icon={Instagram} />
							<SocialIcon href="#" icon={Twitter} />
							<SocialIcon href="#" icon={Linkedin} />
						</div>
					</div>
				</div>
			</div>

			{/* Barra inferior del Footer */}
			<div className="border-t border-gray-800">
				<div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
					<p>
						&copy; {new Date().getFullYear()} Transportes Araucanía. Todos los
						derechos reservados.
					</p>
					<p className="mt-4 md:mt-0">
						Diseñado y desarrollado por{" "}
						<a
							href="https://anunciads.cl"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-white font-semibold transition-colors duration-300"
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
