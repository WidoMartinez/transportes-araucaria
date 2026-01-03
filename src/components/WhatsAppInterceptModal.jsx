/* global gtag */
// src/components/WhatsAppInterceptModal.jsx

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, CheckCircle, Mail, Clock, Percent, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
		if (typeof gtag === "function") {
			gtag("event", action, {
				event_category: "whatsapp_intercept_modal",
				event_label: hasDiscount ? `discount_${discountData.valor}` : "no_discount",
			});
		}
		console.log(`📊 Evento: ${action}`, { hasDiscount, discount: discountData.valor });
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
				},
				{
					icon: CheckCircle,
					title: "Confirmación Instantánea",
					description: "Recibe tu comprobante al instante",
				},
				{
					icon: Mail,
					title: "Comprobante por Email",
					description: "Toda la información en tu correo",
				},
				{
					icon: Zap,
					title: "Sin Esperas",
					description: "Reserva en menos de 2 minutos",
				},
		  ]
		: [
				{
					icon: Zap,
					title: "Confirmación Instantánea",
					description: "Sin esperar respuesta de WhatsApp",
					highlight: true,
				},
				{
					icon: CheckCircle,
					title: "Disponibilidad en Tiempo Real",
					description: "Ve horarios y precios actualizados",
				},
				{
					icon: Mail,
					title: "Comprobante Automático",
					description: "Recibe tu reserva por email",
				},
				{
					icon: Clock,
					title: "Disponible 24/7",
					description: "Reserva a cualquier hora del día",
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
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
					/>

					{/* Modal Container with safe scrolling layout */}
					<div className="fixed inset-0 z-[9999] overflow-y-auto">
						<div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
							<motion.div
								initial={{ opacity: 0, scale: 0.9, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.9, y: 20 }}
								transition={{ type: "spring", duration: 0.5 }}
								className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl text-left my-8"
							>
								{/* Header */}
								<div className="relative bg-[#6B4423] text-white p-6 pb-8">
									<div className="absolute inset-0 bg-gradient-to-br from-[#6B4423] to-[#8B5A3C] opacity-90" />
									<div className="relative z-10">
										<button
											onClick={onClose}
											className="absolute -top-2 -right-2 p-2 hover:bg-white/20 rounded-full transition-colors"
											aria-label="Cerrar"
										>
											<X className="w-5 h-5" />
										</button>

										<div className="text-center">
											{hasDiscount ? (
												<>
													<motion.div
														initial={{ scale: 0 }}
														animate={{ scale: 1 }}
														transition={{ delay: 0.2, type: "spring" }}
														className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4" 
													>
														<Percent className="w-8 h-8" />
													</motion.div>
													<h2 className="text-2xl font-bold mb-2">
														¡Reserva Online y Ahorra {discountData.valor}%!
													</h2>
													<p className="text-white/90">
														Obtén tu descuento exclusivo reservando ahora
													</p>
												</>
											) : (
												<>
													<motion.div
														initial={{ scale: 0 }}
														animate={{ scale: 1 }}
														transition={{ delay: 0.2, type: "spring" }}
														className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4"
													>
														<Zap className="w-8 h-8" />
													</motion.div>
													<h2 className="text-2xl font-bold mb-2">
														¡Reserva más rápido aquí!
													</h2>
													<p className="text-white/90">
														Confirmación instantánea sin esperas
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
											className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
												benefit.highlight
													? "bg-[#6B4423]/5 border border-[#6B4423]/20"
													: "hover:bg-gray-50"
											}`}
										>
											<div
												className={`p-2 rounded-lg ${
													benefit.highlight
														? "bg-[#6B4423]/10 text-[#6B4423]"
														: "bg-gray-100 text-gray-600"
												}`}
											>
												<benefit.icon className="w-5 h-5" />
											</div>
											<div className="flex-1">
												<h3
													className={`font-semibold ${
														benefit.highlight ? "text-[#6B4423]" : "text-gray-900"
													}`}
												>
													{benefit.title}
												</h3>
												<p className="text-sm text-gray-600">{benefit.description}</p>
											</div>
										</motion.div>
									))}
								</div>

							{/* Actions */}
							<div className="p-6 pt-0 space-y-3">
								<Button
									onClick={handleReserve}
									className="w-full bg-[#6B4423] hover:bg-[#8B5A3C] text-white py-6 text-lg font-semibold rounded-xl shadow-lg shadow-[#6B4423]/20"
								>
									<CheckCircle className="w-5 h-5 mr-2" />
									Reservar Ahora
								</Button>

								<button
									onClick={handleWhatsApp}
									className="w-full flex items-center justify-center gap-2 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
								>
									<MessageCircle className="w-4 h-4" />
									Continuar a WhatsApp
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
