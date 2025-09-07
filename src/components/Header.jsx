import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";
import logo from "../assets/logo.png";

function Header() {
	return (
		<header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
			<div className="container mx-auto px-4">
				<div className="flex justify-between items-center h-19">
					<div>
						<img src={logo} alt="Transportes Araucaria Logo" className="h-28" />
					</div>
					<nav className="hidden md:flex space-x-6">
						<a
							href="#inicio"
							className="text-foreground hover:text-primary transition-colors"
						>
							Inicio
						</a>
						<a
							href="#servicios"
							className="text-foreground hover:text-primary transition-colors"
						>
							Servicios
						</a>
						<a
							href="#destinos"
							className="text-foreground hover:text-primary transition-colors"
						>
							Destinos
						</a>
						<a
							href="#destacados"
							className="text-foreground hover:text-primary transition-colors"
						>
							Temporada
						</a>
						<a
							href="#contacto"
							className="text-foreground hover:text-primary transition-colors"
						>
							Contacto
						</a>
					</nav>
					<div className="flex items-center space-x-4">
						<a
							href="tel:+56936643540"
							className="hidden md:flex items-center space-x-2 text-sm text-foreground hover:text-primary"
						>
							<Phone className="h-4 w-4" />
							<span>+56 9 3664 3540</span>
						</a>
						<a
							href="https://wa.me/56936643540"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button className="bg-accent hover:bg-accent/90">
								<MessageCircle className="h-4 w-4 mr-2" />
								WhatsApp
							</Button>
						</a>
					</div>
				</div>
			</div>
		</header>
	);
}

export default Header;
