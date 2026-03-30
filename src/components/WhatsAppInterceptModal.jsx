// src/components/WhatsAppInterceptModal.jsx

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
	X, 
	Zap, 
	CheckCircle2, 
	Mail, 
	Clock, 
	Percent, 
	MessageCircle, 
	ShieldCheck,
	MousePointerClick,
	CalendarCheck,
	Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Modal de intercepción para WhatsApp
 * Muestra beneficios de reservar online con descuento dinámico o enfoque en rapidez
 */
export default function WhatsAppInterceptModal({
	isOpen,
	onClose,
	onReserve,
	discountData = { valor: 0, activo: false },
}) {
	const hasDiscount = discountData.activo && discountData.valor > 0;

	// Tracking de eventos
	const trackEvent = (action) => {
		if (typeof window !== "undefined" && typeof window.gtag === "function") {
			window.gtag("event", action, {
				event_category: "whatsapp_intercept_modal",
				event_label: hasDiscount ? `discount_${discountData.valor}` : "no_discount",
			});

			// Si es clic en WhatsApp, enviar también conversión de Google Ads (igual que en Header)
			if (action === "modal_whatsapp_selected") {
				window.gtag("event", "conversion", {
					send_to: "AW-17529712870/M7-iCN_HtZUbEObh6KZB",
				});
				console.log("💰 Conversión de clic en WhatsApp (Modal) enviada.");
			}
		}
	};

	React.useEffect(() => {
		if (isOpen) {
			trackEvent("modal_intercept_shown");
		}
	}, [isOpen]);

	const handleReserve = () => {
		trackEvent("modal_online_selected");
		onReserve();
	};

	const handleWhatsApp = () => {
		trackEvent("modal_whatsapp_selected");
		// Abrir WhatsApp en nueva pestaña
		window.open("https://wa.me/56936643540", "_blank", "noopener,noreferrer");
		onClose();
	};

	const benefits = hasDiscount
		? [
				{
					icon: Percent,
					title: `${discountData.valor}% de Descuento`,
					description: "Exclusivo para reservas online",
					highlight: true,
					color: "text-amber-500",
					bg: "bg-amber-500/10"
				},
				{
					icon: ShieldCheck,
					title: "Confirmación Instantánea",
					description: "Recibe tu comprobante al instante",
					color: "text-emerald-500",
					bg: "bg-emerald-500/10"
				},
				{
					icon: Mail,
					title: "Comprobante por Email",
					description: "Toda la información en tu correo",
					color: "text-blue-500",
					bg: "bg-blue-500/10"
				},
				{
					icon: MousePointerClick,
					title: "Sin Esperas",
					description: "Reserva en menos de 2 minutos",
					color: "text-purple-500",
					bg: "bg-purple-500/10"
				},
		  ]
		: [
				{
					icon: Zap,
					title: "Confirmación Instantánea",
					description: "Sin esperar respuesta de WhatsApp",
					highlight: true,
					color: "text-amber-500",
					bg: "bg-amber-500/10"
				},
				{
					icon: Sparkles,
					title: "Disponibilidad en Tiempo Real",
					description: "Ve horarios y precios actualizados",
					color: "text-emerald-500",
					bg: "bg-emerald-500/10"
				},
				{
					icon: Mail,
					title: "Comprobante Automático",
					description: "Recibe tu reserva por email",
					color: "text-blue-500",
					bg: "bg-blue-500/10"
				},
				{
					icon: CalendarCheck,
					title: "Disponible 24/7",
					description: "Reserva a cualquier hora del día",
					color: "text-rose-500",
					bg: "bg-rose-500/10"
				},
		  ];

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Overlay */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
					/>

					{/* Modal Container */}
					<div className="fixed inset-0 z-[9999] overflow-y-auto">
						<div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
							<motion.div
								initial={{ opacity: 0, scale: 0.9, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.9, y: 20 }}
								transition={{ type: "spring", duration: 0.5 }}
								className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl text-left my-8"
							>
								{/* Header */}
								<div className="relative bg-[#2a4e25] text-white p-6 pb-8">
									<div className="absolute inset-0 bg-gradient-to-br from-[#2a4e25] to-[#1a3317] opacity-95" />
									<div className="relative z-10 text-center">
										<button
											onClick={onClose}
											className="absolute -top-1 -right-1 p-2 hover:bg-white/20 rounded-full transition-colors"
											aria-label="Cerrar"
										>
											<X className="w-5 h-5" />
										</button>

										<div className="mb-4">
											{hasDiscount ? (
												<>
													<motion.div
														initial={{ scale: 0, rotate: -15 }}
														animate={{ scale: 1, rotate: 0 }}
														transition={{ delay: 0.2, type: "spring" }}
														className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-md shadow-inner" 
													>
														<Percent className="w-8 h-8" />
													</motion.div>
													<h2 className="text-2xl font-extrabold mb-1 tracking-tight">
														Ahorra {discountData.valor}% Online
													</h2>
													<p className="text-white/80 font-medium">
														Obtén tarifa exclusiva reservando ahora mismo
													</p>
												</>
											) : (
												<>
													<motion.div
														initial={{ scale: 0, scaleY: 0 }}
														animate={{ scale: 1, scaleY: 1 }}
														transition={{ delay: 0.2, type: "spring" }}
														className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-md shadow-inner"
													>
														<Zap className="w-8 h-8" />
													</motion.div>
													<h2 className="text-2xl font-extrabold mb-1 tracking-tight">
														Sáltate la Fila
													</h2>
													<p className="text-white/80 font-medium">
														Confirmación instantánea sin esperar chats
													</p>
												</>
											)}
										</div>
									</div>
								</div>

								{/* Benefits */}
								<div className="p-6 space-y-4">
									{benefits.map((benefit, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 0.1 * index }}
											className={cn(
												"flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
												benefit.highlight 
													? "bg-[#2a4e25]/5 border border-[#2a4e25]/20 shadow-sm"
													: "hover:bg-gray-50 border border-transparent"
											)}
										>
											<div className={cn(
												"p-2.5 rounded-xl border border-white shadow-sm flex items-center justify-center",
												benefit.bg
											)}>
												<benefit.icon className={cn("w-5 h-5", benefit.color)} />
											</div>
											<div className="flex-1">
												<h3 className="font-bold text-gray-900 leading-none mb-1">
													{benefit.title}
												</h3>
												<p className="text-sm text-gray-500 font-medium">{benefit.description}</p>
											</div>
										</motion.div>
									))}
								</div>

								{/* Actions */}
								<div className="p-6 pt-0 space-y-3">
									<Button
										onClick={handleReserve}
										className="group w-full bg-[#2a4e25] hover:bg-[#1a3317] text-white py-7 text-lg font-bold rounded-2xl shadow-xl shadow-[#2a4e25]/20 transition-all flex items-center justify-center gap-2"
									>
										<Sparkles className="w-5 h-5 transition-transform group-hover:scale-125" />
										Reservar Online Ahora
									</Button>

									<button
										onClick={handleWhatsApp}
										className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-900 font-bold transition-colors text-sm"
									>
										<MessageCircle className="w-4 h-4" />
										Preguntar algo por WhatsApp
									</button>
								</div>
							</motion.div>
						</div>
					</div>
				</>
			)}
		</AnimatePresence>
	);
}
