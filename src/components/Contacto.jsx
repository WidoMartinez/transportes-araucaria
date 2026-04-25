import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { trackWhatsAppConversion } from "../lib/tracking";

// AVISO: Este archivo se despliega manualmente en Hostinger (frontend y PHP en Hostinger).
// Cualquier cambio local debe subirse manualmente al servidor.

// Componente interno para reutilizar la lógica de mostrar información de contacto
const InfoItem = ({ icon: Icon, title, children, delay = 0 }) => (
	<motion.div
		initial={{ opacity: 0, y: 10 }}
		whileInView={{ opacity: 1, y: 0 }}
		viewport={{ once: true }}
		transition={{ duration: 0.5, delay }}
		className="flex items-start space-x-4 p-4 rounded-xl hover:bg-cafe-50/50 transition-colors duration-300 border border-transparent hover:border-cafe-100"
	>
		<div className="flex-shrink-0">
			<div className="p-2.5 rounded-lg bg-cafe-100 text-primary">
				<Icon className="h-6 w-6" />
			</div>
		</div>
		<div>
			<p className="font-semibold text-lg text-forest-800">{title}</p>
			<div className="text-muted-foreground">{children}</div>
		</div>
	</motion.div>
);

function Contacto() {
	const containerRef = React.useRef(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start end", "end start"],
	});
	const yParallax = useTransform(scrollYProgress, [0, 1], [0, -60]);

	return (
		<section
			id="contacto"
			ref={containerRef}
			className="relative overflow-hidden bg-secondary py-24 bg-pattern-premium"
		>
			{/* Capa de iconos con Parallax */}
			<motion.div 
				style={{ y: yParallax }}
				className="absolute inset-0 pointer-events-none bg-pattern-icons z-0 opacity-60" 
			/>

			{/* Decoración de fondo unificada (solo tonos café) */}
			<div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_top_left,rgba(196,137,94,0.12),transparent_70%),radial-gradient(circle_at_bottom_right,rgba(140,94,66,0.18),transparent_70%)]" />

			
			<div className="container mx-auto px-4 relative z-10">
				<motion.div 
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-16"
				>
					<h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white font-serif">
						Hablemos
					</h2>
					<p className="text-lg text-cafe-100/90 max-w-2xl mx-auto">
						Estamos disponibles para atenderte 24/7 y responder a todas tus consultas sobre nuestros servicios de transporte.
					</p>
				</motion.div>

				<div className="max-w-4xl mx-auto">
					<motion.div
						initial={{ opacity: 0, scale: 0.98 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<Card className="shadow-2xl border-none overflow-hidden bg-white shadow-black/40">
							<CardHeader className="pb-2 border-b border-cafe-50 bg-cafe-50/30">
								<CardTitle className="text-2xl text-center text-forest-800 font-serif">
									Información de Contacto
								</CardTitle>
								<CardDescription className="text-center text-cafe-600">
									Contáctanos directamente por cualquiera de estos medios.
								</CardDescription>
							</CardHeader>

							
							<CardContent className="p-8">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

									
									<InfoItem icon={Mail} title="Email" delay={0.2}>
										<a
											href="mailto:contacto@transportesaraucaria.cl"
											className="hover:text-primary transition-colors duration-300 font-medium break-all"
										>
											contacto@transportesaraucaria.cl
										</a>
									</InfoItem>
									
									<InfoItem icon={MapPin} title="Ubicación" delay={0.3}>
										<p className="font-medium">Temuco, Región de La Araucanía</p>
									</InfoItem>
									
									<InfoItem icon={Clock} title="Horarios" delay={0.4}>
										<p className="font-medium">Disponible 24 horas, 7 días a la semana.</p>
									</InfoItem>
								</div>

								<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-cafe-50">
									<Button 
										asChild
										className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-2 h-12 px-8 rounded-full shadow-lg hover:shadow-green-200 transition-all duration-300"
									>
										<a 
											href="https://wa.me/56936643540" 
											target="_blank" 
											rel="noopener noreferrer"
											onClick={() => void trackWhatsAppConversion("Contacto")}
										>
											<MessageCircle className="h-5 w-5 fill-current" />
											Contactar por WhatsApp
										</a>
									</Button>
									

								</div>
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</div>
		</section>
	);
}

export default Contacto;

