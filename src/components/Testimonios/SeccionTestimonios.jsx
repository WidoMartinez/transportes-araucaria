import { useState, useEffect } from "react";
import { Star, Quote, UserCircle2 } from "lucide-react";
import { getBackendUrl } from "../../lib/backend";
import { motion } from "framer-motion";

// Renderiza estrellas para una calificación
function Estrellas({ valor }) {
	const filled = Math.round(Number(valor) || 0);
	return (
		<div className="flex gap-0.5">
			{[1, 2, 3, 4, 5].map((i) => (
				<Star
					key={i}
					className={`h-4 w-4 ${
						i <= filled ? "fill-amber-400 text-amber-400" : "text-gray-300"
					}`}
				/>
			))}
		</div>
	);
}

// Formatea la fecha de un testimonio en formato "Mes AAAA"
function formatMesAnio(fechaStr) {
	if (!fechaStr) return "";
	const fecha = new Date(fechaStr);
	if (isNaN(fecha.getTime())) return "";
	return fecha.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

import { Card, CardContent } from "@/components/ui/card";

function SeccionTestimonios() {
	const apiUrl = getBackendUrl();
	const [testimonios, setTestimonios] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		const cargarTestimonios = async () => {
			try {
				const resp = await fetch(`${apiUrl}/api/testimonios`);
				if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
				const data = await resp.json();
				setTestimonios(Array.isArray(data) ? data : []);
			} catch (err) {
				console.error("[SeccionTestimonios] Error al cargar:", err);
				setError(true);
			} finally {
				setCargando(false);
			}
		};

		cargarTestimonios();
	}, [apiUrl]);

	if (cargando || error || testimonios.length === 0) {
		return null;
	}

	return (
		<section className="py-24 bg-[#F8F7F4]">
			<div className="container mx-auto px-6">
				{/* Encabezado */}
				<div className="max-w-3xl mx-auto text-center mb-20">
					<motion.div 
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E3A14]/5 border border-[#1E3A14]/10 text-[#1E3A14] text-[10px] font-bold tracking-widest uppercase mb-6"
					>
						<Star className="h-3 w-3 fill-amber-400 text-amber-400" />
						Opiniones Verificadas
					</motion.div>
					
					<h2 className="font-serif text-4xl md:text-6xl font-medium text-[#1E3A14] mb-6 leading-tight">
						Lo que dicen nuestros <em className="not-italic text-[#8C5E42]">pasajeros</em>
					</h2>
					<p className="text-lg text-slate-500 font-light leading-relaxed">
						Experiencias reales de personas que confiaron en nuestro servicio de traslados locales.
					</p>
				</div>

				{/* Grid de tarjetas */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{testimonios.map((t, idx) => (
						<motion.div
							key={t.id}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: idx * 0.1 }}
						>
							<Card className="h-full border-none shadow-[0_15px_50px_-20px_rgba(0,0,0,0.08)] bg-white rounded-[2rem] overflow-hidden hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] transition-all duration-500">
								<CardContent className="p-10 flex flex-col h-full">
									<div className="mb-6 flex justify-between items-start">
										<Quote className="h-10 w-10 text-[#8C5E42]/10" />
										<Estrellas valor={t.calificacion} />
									</div>

									<p className="text-slate-600 text-lg leading-relaxed font-light italic mb-10 flex-1">
										"{t.comentario}"
									</p>

									<div className="flex items-center gap-4 pt-8 border-t border-slate-50">
										<div className="w-12 h-12 rounded-2xl bg-[#1E3A14]/5 flex items-center justify-center border border-[#1E3A14]/10">
											<span className="text-[#1E3A14] font-bold text-lg uppercase">
												{t.nombre?.charAt(0) || "U"}
											</span>
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-bold text-[#1E3A14] text-base truncate">
												{t.nombre}
											</p>
											{t.origen && t.destino && (
												<p className="text-xs text-[#8C5E42] font-semibold uppercase tracking-wider mt-0.5">
													{t.origen} → {t.destino}
												</p>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}

export default SeccionTestimonios;
