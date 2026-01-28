// src/components/WhatsAppButton.jsx
import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

/**
 * Componente reutilizable para botón de contacto por WhatsApp
 * @param {Object} props
 * @param {string} props.message - Mensaje pre-configurado (opcional)
 * @param {string} props.className - Clases CSS adicionales (opcional)
 * @param {string} props.variant - Variante del botón (default, outline, etc.)
 * @param {string} props.size - Tamaño del botón
 * @param {string} props.children - Texto del botón (opcional, default: "Contactar por WhatsApp")
 */
const WhatsAppButton = ({
	message = "Hola, necesito más información sobre un traslado",
	className = "",
	variant = "default",
	size = "default",
	children = "Contactar por WhatsApp",
	...props
}) => {
	const phoneNumber = "56936643540"; // Número de WhatsApp de Transportes Araucaria

	// Construir URL de WhatsApp con mensaje pre-cargado
	const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

	// Tracking de conversión de Google Ads
	// Nota: Usa la misma cuenta de Google Ads que el resto del sitio (AW-17529712870)
	// con la etiqueta específica para clics en WhatsApp (M7-iCN_HtZUbEObh6KZB)
	const handleClick = () => {
		if (typeof window !== "undefined" && window.gtag) {
			window.gtag("event", "conversion", {
				send_to: "AW-17529712870/M7-iCN_HtZUbEObh6KZB",
				value: 1.0,
				currency: "CLP",
			});
			console.log("💬 Conversión de clic en WhatsApp enviada a Google Ads.");
		}
	};

	return (
		<Button
			variant={variant}
			size={size}
			className={`gap-2 ${className}`}
			asChild
			onClick={handleClick}
			{...props}
		>
			<a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
				<MessageCircle className="h-5 w-5" />
				{children}
			</a>
		</Button>
	);
};

export default WhatsAppButton;
