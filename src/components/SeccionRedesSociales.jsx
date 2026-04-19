import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Facebook, Instagram, ExternalLink } from "lucide-react";

// URLs oficiales de las redes sociales de Ruta Araucanía
const REDES_SOCIALES = [
	{
		nombre: "Facebook",
		usuario: "@rutaaraucaria",
		descripcion: "Noticias, ofertas y novedades de nuestros viajes.",
		href: "https://web.facebook.com/rutaaraucaria/",
		icon: Facebook,
		color: "#1877F2",
	},
	{
		nombre: "Instagram",
		usuario: "@rutaaraucaria",
		descripcion: "Fotos, paisajes y momentos únicos de la región.",
		href: "https://www.instagram.com/rutaaraucaria/",
		icon: Instagram,
		color: "#E1306C",
	},
];

// Sección principal de redes sociales
function SeccionRedesSociales() {
	return (
		<section className="py-24 bg-white" id="redes-sociales">
			<div className="container mx-auto px-6 max-w-5xl">
				{/* Encabezado */}
				<div className="max-w-3xl mx-auto text-center mb-16">
					<motion.div 
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8C5E42]/5 border border-[#8C5E42]/10 text-[#8C5E42] text-[10px] font-bold tracking-widest uppercase mb-6"
					>
						Comunidad
					</motion.div>
					
					<h2 className="font-serif text-4xl md:text-6xl font-medium text-[#1E3A14] mb-6 leading-tight">
						Síguenos en <em className="not-italic text-[#8C5E42]">redes sociales</em>
					</h2>
					<p className="text-lg text-slate-500 font-light leading-relaxed">
						Únete a nuestra comunidad y descubre la belleza de La Araucanía a través de nuestros viajes.
					</p>
				</div>

				{/* Tarjetas de redes sociales */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
					{REDES_SOCIALES.map((red, idx) => {
						const Icon = red.icon;
						return (
							<motion.div
								key={red.nombre}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: idx * 0.1 }}
							>
								<a
									href={red.href}
									target="_blank"
									rel="noopener noreferrer"
									className="block group"
								>
									<Card className="border-none shadow-[0_15px_50px_-20px_rgba(0,0,0,0.08)] bg-[#F8F7F4]/50 rounded-[2rem] overflow-hidden group-hover:bg-white group-hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] transition-all duration-500 border border-transparent group-hover:border-slate-100">
										<CardContent className="p-8 flex items-center gap-6">
											<div 
												className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-sm transition-transform duration-500 group-hover:scale-110"
												style={{ color: red.color }}
											>
												<Icon className="w-8 h-8" />
											</div>
											
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<h3 className="font-bold text-[#1E3A14] text-xl">{red.nombre}</h3>
													<ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-[#8C5E42] transition-colors" />
												</div>
												<p className="text-[#8C5E42] text-sm font-semibold tracking-wide uppercase mt-0.5">{red.usuario}</p>
												<p className="text-slate-500 text-sm mt-2 font-light leading-snug">{red.descripcion}</p>
											</div>
										</CardContent>
									</Card>
								</a>
							</motion.div>
						);
					})}
				</div>

				{/* Mensaje de cierre */}
				<motion.p 
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					className="text-center text-slate-400 text-sm mt-16 font-light"
				>
					✨ Compartimos experiencias reales y los paisajes más hermosos del sur de Chile.
				</motion.p>
			</div>
		</section>
	);
}

export default SeccionRedesSociales;
