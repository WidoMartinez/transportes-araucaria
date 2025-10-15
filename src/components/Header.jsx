/* global gtag */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, RotateCcw } from "lucide-react";
import logo from "../assets/logo.png";

// Función para encapsular el seguimiento de la conversión con el NUEVO ID
const trackWhatsAppClick = () => {
	if (typeof gtag === "function") {
		gtag("event", "conversion", {
			send_to: "AW-17529712870/M7-iCN_HtZUbEObh6KZB", // ID de conversión actualizado
		});
		console.log("Conversión de clic en WhatsApp (Header) enviada.");
	}
};

function Header() {
	const [isUpdating, setIsUpdating] = useState(false);

	const handleUpdatePricing = async () => {
		setIsUpdating(true);
		try {
			if (window.recargarDatosPrecios) {
				await window.recargarDatosPrecios();
				console.log("✅ Precios actualizados manualmente");
			} else {
				window.location.reload();
			}
		} catch (error) {
			console.error("Error al actualizar precios:", error);
		} finally {
			setTimeout(() => setIsUpdating(false), 1000);
		}
	};

	return (
		<header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
			<div className="container mx-auto px-4">
				<div className="flex justify-between items-center h-19">
					<div className="flex items-center gap-4">
						<img src={logo} alt="Transportes Araucaria Logo" className="h-28" />
						{/* Botón de actualización - visible al hacer hover */}
						<button
							onClick={handleUpdatePricing}
							disabled={isUpdating}
							className="opacity-30 hover:opacity-100 transition-all duration-300 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 hover:scale-110"
							title="Actualizar precios y descuentos (Ctrl+Shift+U)"
						>
							<RotateCcw
								size={16}
								className={isUpdating ? "animate-spin" : ""}
							/>
						</button>
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
							href="#tours"
							className="text-foreground hover:text-primary transition-colors"
						>
							Tours
						</a>
						<a
							href="#destacados"
							className="text-foreground hover:text-primary transition-colors"
						>
							Temporada
						</a>
						<a
							href={import.meta.env.DEV ? "/#fletes" : "/fletes"}
							className="text-foreground hover:text-primary transition-colors"
						>
							Fletes
						</a>
						<a
							href="#consultar-reserva"
							className="text-foreground hover:text-primary transition-colors font-medium"
						>
							Consultar Reserva
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
						{/* Se mantiene el evento onClick con la nueva función de seguimiento */}
						<a
							href="https://wa.me/56936643540"
							target="_blank"
							rel="noopener noreferrer"
							onClick={trackWhatsAppClick}
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

