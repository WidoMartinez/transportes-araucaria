import { useState, useEffect, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
	Star,
	Quote,
	Facebook,
	Instagram,
	ExternalLink,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { getBackendUrl } from "../lib/backend";
import AvatarPasajeroComentario from "./AvatarPasajeroComentario";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";

// URLs oficiales de las redes sociales
const REDES_SOCIALES = [
	{
		nombre: "Facebook",
		usuario: "@rutaaraucaria",
		href: "https://web.facebook.com/rutaaraucaria/",
		icon: Facebook,
		color: "#1877F2",
		descripcion: "Noticias, rutas y novedades para planificar tu traslado.",
	},
	{
		nombre: "Instagram",
		usuario: "@rutaaraucaria",
		href: "https://www.instagram.com/rutaaraucaria/",
		icon: Instagram,
		color: "#E1306C",
		descripcion: "Paisajes, experiencias y momentos reales de cada viaje.",
	},
];

function Estrellas({ valor }) {
	const filled = Math.round(Number(valor) || 0);
	return (
		<div className="flex gap-0.5">
			{[1, 2, 3, 4, 5].map((i) => (
				<Star
					key={i}
					className={`h-3 w-3 ${
						i <= filled ? "fill-amber-400 text-amber-400" : "text-gray-300"
					}`}
				/>
			))}
		</div>
	);
}

function obtenerUbicacionTestimonio(testimonio) {
	if (testimonio.destino) return testimonio.destino;
	if (testimonio.origen && testimonio.destino) {
		return `${testimonio.origen} a ${testimonio.destino}`;
	}
	if (testimonio.origen) return testimonio.origen;
	return "Pasajero verificado";
}

function SeccionComunidad() {
	const apiUrl = getBackendUrl();
	const [testimonios, setTestimonios] = useState([]);
	const [cargando, setCargando] = useState(true);
	const containerRef = useRef(null);
	const plugin = useRef(
		Autoplay({ delay: 3500, stopOnInteraction: true, stopOnMouseEnter: true })
	);
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start end", "end start"],
	});
	const yParallax = useTransform(scrollYProgress, [0, 1], [0, -60]);

	useEffect(() => {
		const cargarTestimonios = async () => {
			try {
				const resp = await fetch(`${apiUrl}/api/testimonios`);
				if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
				const data = await resp.json();
				// Solo mostrar los primeros 2 o 3 en este modo unificado para no alargar demasiado la sección
				setTestimonios(Array.isArray(data) ? data.slice(0, 4) : []);
			} catch (err) {
				console.error("[SeccionComunidad] Error al cargar:", err);
			} finally {
				setCargando(false);
			}
		};
		cargarTestimonios();
	}, [apiUrl]);

	if (cargando && testimonios.length === 0) return null;

	return (
		<section
			ref={containerRef}
			className="relative overflow-hidden bg-secondary py-20 md:py-24 bg-pattern-premium"
			id="comunidad"
		>
			{/* Capa de iconos con Parallax */}
			<motion.div 
				style={{ y: yParallax }}
				className="absolute inset-0 pointer-events-none bg-pattern-icons z-0 opacity-60" 
			/>

			{/* Decoración de fondo unificada (solo tonos café) */}
			<div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_top_left,rgba(196,137,94,0.12),transparent_70%),radial-gradient(circle_at_bottom_right,rgba(140,94,66,0.18),transparent_70%)]" />
			<div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
					<div className="lg:col-span-8">
						<motion.div
							initial={{ opacity: 0, y: 18 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, amount: 0.25 }}
						>
							<Card className="overflow-hidden rounded-4xl border-white/10 bg-primary py-0 text-primary-foreground shadow-[0_24px_80px_-36px_rgba(17,24,39,0.38)] backdrop-blur-sm">
								<div className="border-b border-white/10 bg-linear-to-r from-white/6 via-primary to-secondary/12">
									<CardHeader className="gap-5 px-6 py-8 md:px-8 md:py-9">
										<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
											<div className="max-w-2xl space-y-4">
												<Badge className="w-fit rounded-full border border-white/14 bg-white/6 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary-foreground hover:bg-white/6">
													<Star className="mr-2 h-3.5 w-3.5 fill-amber-400 text-amber-400" />
													Opiniones verificadas
												</Badge>
												<CardTitle className="font-serif text-4xl leading-tight font-medium text-primary-foreground md:text-5xl">
													Lo que dicen nuestros <em className="not-italic text-cafe-200">pasajeros</em>
												</CardTitle>
												<CardDescription className="max-w-xl text-sm leading-7 text-primary-foreground/72 md:text-base">
													Experiencias reales de pasajeros que reservaron sus traslados con Transportes Araucaria.
												</CardDescription>
											</div>
											<div className="grid min-w-[220px] grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/7 p-3 text-left shadow-xs backdrop-blur-sm">
												<div>
													<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cafe-200">
														Selección
													</p>
													<p className="mt-2 text-2xl font-semibold text-primary-foreground">{testimonios.length}</p>
													<p className="text-sm text-primary-foreground/70">reseñas visibles</p>
												</div>
												<div>
													<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cafe-200">
														Enfoque
													</p>
													<p className="mt-2 text-sm font-semibold text-primary-foreground md:text-base">Viajes confiables</p>
													<p className="mt-1 text-sm text-primary-foreground/70">trato cercano y puntualidad</p>
												</div>
											</div>
										</div>
									</CardHeader>
								</div>

								<CardContent className="px-4 py-5 md:px-6 md:py-6">
									<Carousel
										plugins={[plugin.current]}
										opts={{ align: "center", loop: true }}
										className="mx-auto w-full"
										onMouseEnter={plugin.current.stop}
										onMouseLeave={plugin.current.reset}
									>
										<CarouselContent className="-ml-4">
											{testimonios.map((t) => (
												<CarouselItem key={t.id} className="basis-full pl-4">
													<div className="h-full py-2">
														<Card className="h-full rounded-[1.75rem] border-white/10 bg-forest-700/88 py-0 text-primary-foreground shadow-[0_18px_50px_-32px_rgba(17,24,39,0.36)] transition-all duration-300 hover:-translate-y-1 hover:border-cafe-300/40 hover:shadow-[0_24px_56px_-30px_rgba(140,94,66,0.32)]">
															<CardContent className="flex h-full min-h-80 flex-col gap-6 p-6 md:p-8">
																<div className="flex items-start justify-between gap-4">
																	<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-cafe-200">
																		<Quote className="h-6 w-6" />
																	</div>
																	<div className="rounded-full border border-amber-300/30 bg-white/8 px-3 py-1.5">
																		<Estrellas valor={t.calificacion} />
																	</div>
																</div>

																<p className="flex-1 text-base leading-8 text-primary-foreground/82 italic md:text-[1.05rem]">
																	"{t.comentario || "Experiencia verificada de un pasajero de Transportes Araucaria."}"
																</p>

																<Separator className="bg-white/10" />

																<div className="flex items-center gap-3">
																	<AvatarPasajeroComentario
																		nombre={t.nombre}
																		origen={t.origen}
																		destino={t.destino}
																		comentario={t.comentario}
																		compacto
																	/>
																	<div className="min-w-0 flex-1">
																		<p className="truncate text-sm font-bold text-primary-foreground md:text-base">
																			{t.nombre || "Pasajero verificado"}
																		</p>
																		<p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cafe-200">
																			{obtenerUbicacionTestimonio(t)}
																		</p>
																	</div>
																</div>
															</CardContent>
														</Card>
													</div>
												</CarouselItem>
											))}
										</CarouselContent>

										<CarouselPrevious className="-left-2 hidden h-11 w-11 border-white/10 bg-white/8 text-primary-foreground shadow-xs transition-colors hover:border-cafe-300/40 hover:bg-secondary hover:text-secondary-foreground md:flex" />
										<CarouselNext className="-right-2 hidden h-11 w-11 border-white/10 bg-white/8 text-primary-foreground shadow-xs transition-colors hover:border-cafe-300/40 hover:bg-secondary hover:text-secondary-foreground md:flex" />
									</Carousel>
								</CardContent>
							</Card>
						</motion.div>
					</div>

					<div className="lg:col-span-4 lg:sticky lg:top-24">
						<motion.div
							initial={{ opacity: 0, y: 18 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, amount: 0.25 }}
						>
							<Card className="rounded-4xl border-white/10 bg-primary py-0 text-primary-foreground shadow-[0_22px_70px_-36px_rgba(17,24,39,0.36)] backdrop-blur-sm">
								<CardHeader className="gap-3 px-6 py-6 md:px-7 md:py-7">
									<Badge className="w-fit rounded-full border border-white/14 bg-white/6 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary-foreground hover:bg-white/6">
										Comunidad
									</Badge>
									<CardTitle className="font-serif text-4xl font-medium leading-tight text-primary-foreground md:text-5xl">
										Síguenos
									</CardTitle>
									<CardDescription className="text-sm leading-6 text-primary-foreground/72 md:text-[15px]">
										Descubre novedades, recorridos y postales del sur de Chile en nuestros canales oficiales.
									</CardDescription>
								</CardHeader>

								<CardContent className="space-y-3 px-4 pb-4 md:px-5 md:pb-5">
									{REDES_SOCIALES.map((red, idx) => {
										const Icon = red.icon;
										return (
											<motion.a
												key={red.nombre}
												href={red.href}
												target="_blank"
												rel="noopener noreferrer"
												initial={{ opacity: 0, x: 18 }}
												whileInView={{ opacity: 1, x: 0 }}
												viewport={{ once: true }}
												transition={{ delay: idx * 0.08 }}
												className="group block"
											>
												<Card className="rounded-3xl border-white/10 bg-forest-700/88 py-0 text-primary-foreground shadow-none transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-cafe-300/35 group-hover:shadow-[0_18px_45px_-34px_rgba(140,94,66,0.4)]">
													<CardContent className="flex items-start gap-3.5 p-4">
														<div
															className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/7 shadow-xs transition-transform duration-300 group-hover:scale-105"
															style={{ color: red.color }}
														>
															<Icon className="h-5 w-5" />
														</div>
														<div className="min-w-0 flex-1 space-y-1.5">
															<div className="flex items-start justify-between gap-3">
																<div>
																	<p className="text-[1.05rem] font-semibold text-primary-foreground">{red.nombre}</p>
																	<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cafe-200">{red.usuario}</p>
																</div>
																<ExternalLink className="mt-1 h-4 w-4 text-primary-foreground/60 transition-colors group-hover:text-cafe-200" />
															</div>
															<p className="text-[13px] leading-5 text-primary-foreground/72">{red.descripcion}</p>
															<Button variant="ghost" className="h-auto px-0 py-0 text-[13px] font-semibold text-cafe-200 hover:bg-transparent hover:text-primary-foreground">
																Visitar perfil
															</Button>
														</div>
													</CardContent>
												</Card>
											</motion.a>
										);
									})}

									<Card className="rounded-3xl border-white/10 bg-white/6 py-0 shadow-none">
										<CardContent className="p-4">
											<p className="text-[13px] leading-6 text-primary-foreground/74">
												Compartimos experiencias reales y los paisajes más hermosos del sur de Chile todos los días para que el viaje comience antes de reservar.
											</p>
										</CardContent>
									</Card>
								</CardContent>
							</Card>
						</motion.div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default SeccionComunidad;
