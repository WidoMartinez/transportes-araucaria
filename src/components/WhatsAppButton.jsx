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
	const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
		message
	)}`;

	// Tracking de conversión de Google Ads — con deduplicación por sesión
	// Si el componente se usa en una vista que ya tiene su propio tracker (p.ej. LandingTraslados),
	// la sesión ya tendrá la clave seteada y no se vuelve a disparar.
	const WHATSAPP_CONV_KEY = "wa_conversion_fired";
	const handleClick = () => {
		if (typeof window !== "undefined" && window.gtag) {
			if (sessionStorage.getItem(WHATSAPP_CONV_KEY)) {
				console.info("ℹ️ [WhatsAppButton] Conversión WhatsApp ya registrada esta sesión, se omite.");
				return;
			}
			sessionStorage.setItem(WHATSAPP_CONV_KEY, "1");
			window.gtag("event", "conversion", {
				send_to: "AW-17529712870/M7-iCN_HtZUbEObh6KZB",
				value: 1.0,
				currency: "CLP",
			});
			console.log("✅ [WhatsAppButton] Conversión de clic en WhatsApp enviada.");
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
