import React, { useState, useRef } from "react";
import {
	Users,
	MapPin,
	Plane,
	Star,
	Briefcase,
	ArrowLeft,
	ArrowRight,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "./animations/ScrollReveal";

// Tarjetas de servicios — con los datos reales del negocio
const services = [
	{
		icon: Plane,
		tag: "Nuevo servicio",
		title: "Aeropuerto ↔ Hoteles",
		description:
			"Servicio dedicado con valores fijos para hoteles principales de La Araucanía. Desde aeropuerto puedes reservar ida y vuelta; desde hotel, solo ida.",
		highlights: [
			"Tarifa fija por hotel",
			"Módulo especializado",
			"Admin dedicado",
		],
		accent: "#C4895E",
		bg: "#162B0E",
		ctaHref: "/aeropuerto-hoteles",
		ctaLabel: "Reservar Aeropuerto-Hoteles",
	},
	{
		icon: MapPin,
		tag: "Traslado privado",
		title: "Individual y familiar",
		description:
			"Sedan ejecutivo para hasta 4 pasajeros. Incluye seguimiento de vuelo en tiempo real y espera sin costo adicional por retrasos.",
		highlights: ["Seguimiento de vuelo", "Espera sin costo", "Hasta 4 pasajeros"],
		accent: "#C4895E",
		bg: "#1E3A14",
		ctaHref: "#inicio",
		ctaLabel: "Solicitar este servicio",
	},
	{
		icon: Users,
		tag: "Alta capacidad",
		title: "Grupos y Van",
		description:
			"Van ejecutiva para grupos de 5 a 15 personas. Coordinación directa con hoteles, agencias y organizadores de eventos.",
		highlights: [
			"Hasta 15 pasajeros",
			"Coordinación con hoteles",
			"Equipaje incluido",
			"Van ejecutiva",
		],
		accent: "#D4A373",
		bg: "#162B0E",
		ctaHref: "#inicio",
		ctaLabel: "Solicitar este servicio",
	},
	{
		icon: Briefcase,
		tag: "Cuenta corporativa",
		title: "Convenio empresas",
		description:
			"Facturación mensual consolidada, reportes de uso, atención prioritaria y tarifas preferenciales para empresas.",
		highlights: [
			"Facturación consolidada",
			"Atención prioritaria",
			"Tarifas preferenciales",
		],
		accent: "#B87D5A",
		bg: "#1E3A14",
		ctaHref: "#inicio",
		ctaLabel: "Solicitar este servicio",
	},
	{
		icon: Star,
		tag: "Tours privados",
		title: "Tours a medida",
		description:
			"Descubre la Araucanía Andina con nuestros tours privados. Volcanes, termas, lagos y senderos con conductor local experto.",
		highlights: [
			"Volcán Villarrica",
			"Termas y lagos",
			"Conductor local",
		],
		accent: "#C4895E",
		bg: "#1C3812",
		ctaHref: "#inicio",
		ctaLabel: "Solicitar este servicio",
	},
];

function Servicios() {
	const [active, setActive] = useState(0);
	const touchStartX = useRef(null);

	const prev = () => setActive((a) => (a - 1 + services.length) % services.length);
	const next = () => setActive((a) => (a + 1) % services.length);

	const handleTouchStart = (e) => {
		touchStartX.current = e.touches[0].clientX;
	};
	const handleTouchEnd = (e) => {
		if (touchStartX.current === null) return;
		const dx = e.changedTouches[0].clientX - touchStartX.current;
		if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
		touchStartX.current = null;
	};

	return (
		<section id="servicios" className="bg-transparent py-12 lg:py-24 overflow-hidden">
			<div className="w-full max-w-7xl mx-auto lg:mx-0 lg:max-w-none px-6">
				<div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
					<div className="max-w-xl">
						<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C5E42] mb-3 flex items-center gap-3">
							<span className="w-6 h-px bg-[#8C5E42] inline-block shrink-0" />
							Lo que ofrecemos
						</p>
						<h2 className="font-serif text-3xl md:text-5xl lg:text-5xl font-medium text-[#1E3A14] leading-tight tracking-tight">
							Nuestros <em className="not-italic text-[#8C5E42]">servicios</em>
						</h2>
					</div>
					<ScrollReveal direction="right" delay={0.2}>
						<p className="max-w-sm text-sm leading-relaxed text-slate-500 md:text-right font-light italic">
							"Cada traslado es coordinado con exactitud empresarial. Tu puntualidad es nuestra prioridad."
						</p>
					</ScrollReveal>
				</div>

				{/* Slider con swipe táctil - Balanceado con PromocionBanners */}
				<div
					className="relative h-[600px] md:h-auto md:aspect-[21/9] lg:aspect-square xl:aspect-[1.2/1] md:min-h-[520px] overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-900/30"
					onTouchStart={handleTouchStart}
					onTouchEnd={handleTouchEnd}
				>
					<AnimatePresence initial={false} mode="wait">
						<motion.div
							key={active}
							initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
							animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
							exit={{ opacity: 0, x: -50, filter: "blur(10px)" }}
							transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
							className="absolute h-full w-full"
							style={{ background: services[active].bg }}
						>
							<div className="grid h-full md:aspect-[21/9] lg:aspect-square xl:aspect-[1.2/1] md:min-h-[520px] items-center gap-0 lg:grid-cols-1 xl:grid-cols-[1fr_380px]">
								{/* Panel de texto */}
								<div className="flex flex-col justify-center px-6 py-10 md:px-14 pb-32 md:pb-32">
									<motion.span
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
										className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
										style={{
											borderColor: services[active].accent + "40",
											color: services[active].accent,
											backgroundColor: services[active].accent + "14",
										}}
									>
										{services[active].tag}
									</motion.span>

									<motion.div
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: 0.3 }}
										className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl"
										style={{ backgroundColor: services[active].accent + "18" }}
									>
										{React.createElement(services[active].icon, {
											className: "h-7 w-7",
											style: { color: services[active].accent }
										})}
									</motion.div>

									<motion.h3 
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.4 }}
										className="mt-4 font-serif text-3xl font-medium text-white md:text-4xl"
									>
										{services[active].title}
									</motion.h3>
									<motion.p 
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.5 }}
										className="mt-3 max-w-lg text-base leading-relaxed text-slate-400"
									>
										{services[active].description}
									</motion.p>

									<motion.div 
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.6 }}
										className="mt-8 flex flex-wrap gap-2"
									>
										{services[active].highlights.map((h) => (
											<span
												key={h}
												className="rounded-full px-3.5 py-1.5 text-xs font-medium text-white/80"
												style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
											>
												{h}
											</span>
										))}
									</motion.div>

									<motion.div 
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.7 }}
										className="mt-10"
									>
										<a
											href={services[active].ctaHref || "#inicio"}
											className="inline-flex h-10 items-center rounded-full px-6 text-sm font-semibold text-slate-900 shadow-md transition-all hover:opacity-90 active:scale-95"
											style={{ backgroundColor: services[active].accent }}
										>
											{services[active].ctaLabel || "Solicitar este servicio"}
										</a>
									</motion.div>
								</div>

								{/* Panel visual decorativo */}
								<div
									className="hidden h-full min-h-[520px] items-center justify-center md:flex lg:hidden xl:flex"
									style={{ backgroundColor: services[active].accent + "0A" }}
								>
									<motion.div
										initial={{ opacity: 0, scale: 0.5 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
										className="flex h-52 w-52 items-center justify-center rounded-full"
										style={{
											backgroundColor: services[active].accent + "15",
											boxShadow: `0 0 90px 24px ${services[active].accent}20`,
										}}
									>
										<div
											className="flex h-28 w-28 items-center justify-center rounded-full"
											style={{ backgroundColor: services[active].accent + "25" }}
										>
											{React.createElement(services[active].icon, {
												className: "h-14 w-14",
												style: { color: services[active].accent }
											})}
										</div>
									</motion.div>
								</div>
							</div>
						</motion.div>
					</AnimatePresence>

					{/* Navegación Interna Estandarizada */}
					<div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8 z-30 flex items-center justify-between pointer-events-none gap-4">
						{/* Indicadores (Izquierda) */}
						<div className="hidden shrink-0 sm:flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-sm pointer-events-auto">
							<span className="text-[10px] font-bold tracking-widest tabular-nums text-white uppercase">
								{String(active + 1).padStart(2, "0")} /{" "}
								{String(services.length).padStart(2, "0")}
							</span>
							<div className="flex gap-1.5">
								{services.map((_, i) => (
									<button
										key={i}
										type="button"
										onClick={() => setActive(i)}
										className={`h-1 rounded-full transition-all duration-500 ${
											i === active
												? "w-6 bg-[#8C5E42]"
												: "w-1.5 bg-white/20 hover:bg-white/40"
										}`}
									/>
								))}
							</div>
						</div>
						
						{/* Flechas (Derecha) */}
						<div className="flex gap-3 pointer-events-auto w-full sm:w-auto justify-end">
							<button
								type="button"
								onClick={prev}
								className="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 bg-white/90 backdrop-blur-md text-[#1E3A14] shadow-lg hover:bg-[#8C5E42] hover:text-white hover:border-[#8C5E42] transition-all duration-300 active:scale-95"
							>
								<ChevronLeft className="h-6 w-6" />
							</button>
							<button
								type="button"
								onClick={next}
								className="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 bg-white/90 backdrop-blur-md text-[#1E3A14] shadow-lg hover:bg-[#8C5E42] hover:text-white hover:border-[#8C5E42] transition-all duration-300 active:scale-95"
							>
								<ChevronRight className="h-6 w-6" />
							</button>
						</div>
					</div>
				</div>


			</div>
		</section>
	);
}

export default Servicios;
