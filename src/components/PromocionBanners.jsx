import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "./ui/button";
import ReservaRapidaModal from "./ReservaRapidaModal";
import { getBackendUrl } from "../lib/backend";

/**
 * Componente de carrusel de banners promocionales
 * Muestra promociones activas con imágenes clicables
 * Al hacer clic, abre modal de reserva rápida con datos pre-cargados
 */
export default function PromocionBanners() {
	const [promociones, setPromociones] = useState([]);
	const [selectedPromocion, setSelectedPromocion] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Configurar embla carousel con autoplay
	const [emblaRef, emblaApi] = useEmblaCarousel(
		{ loop: true, align: "start" },
		[Autoplay({ delay: 5000, stopOnInteraction: true })],
	);

	const [selectedIndex, setSelectedIndex] = useState(0);

	const onSelect = useCallback(() => {
		if (!emblaApi) return;
		setSelectedIndex(emblaApi.selectedScrollSnap());
	}, [emblaApi]);

	useEffect(() => {
		if (!emblaApi) return;
		onSelect();
		emblaApi.on("select", onSelect);
	}, [emblaApi, onSelect]);

	// Cargar promociones activas
	useEffect(() => {
		fetch(`${getBackendUrl()}/api/promociones-banner/activas`)
			.then((res) => res.json())
			.then((data) => {
				if (Array.isArray(data)) {
					setPromociones(data);

					// Lógica de Deep Link: abrir modal si viene ?promo=ID en la URL
					const urlParams = new URLSearchParams(window.location.search);
					const promoIdFromUrl = urlParams.get("promo");

					if (promoIdFromUrl && data.length > 0) {
						const matchingPromo = data.find(
							(p) => p.id.toString() === promoIdFromUrl,
						);
						if (matchingPromo) {
							console.log(
								"🔗 Deep Link detectado: Abriendo promoción",
								matchingPromo.nombre,
							);
							setSelectedPromocion(matchingPromo);
							setIsModalOpen(true);
						}
					}
				}
			})
			.catch((error) => {
				console.error("Error al cargar promociones:", error);
			});
	}, []);

	// Navegar al banner anterior
	const scrollPrev = useCallback(() => {
		if (emblaApi) emblaApi.scrollPrev();
	}, [emblaApi]);

	// Navegar al banner siguiente
	const scrollNext = useCallback(() => {
		if (emblaApi) emblaApi.scrollNext();
	}, [emblaApi]);

	// Manejar clic en banner
	const handleBannerClick = (promocion) => {
		setSelectedPromocion(promocion);
		setIsModalOpen(true);
	};

	// No mostrar nada si no hay promociones
	if (promociones.length === 0) {
		return null;
	}

	return (
		<>
			<section className="bg-transparent py-12 lg:py-24 overflow-hidden">
				<div className="w-full max-w-7xl mx-auto lg:mx-0 lg:max-w-none px-6">
					{/* Encabezado de la Sección */}
					<div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
						<div className="max-w-xl">
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C5E42] mb-3">
								Ocasiones Especiales
							</p>
							<h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-medium text-[#1E3A14] leading-tight tracking-tight">
								Ofertas <em className="not-italic text-[#8C5E42]">exclusivas</em>
							</h2>
						</div>
						<p className="max-w-xs text-sm leading-relaxed text-slate-500 md:text-right font-light italic">
							Aprovecha nuestros traslados en promoción y viaja con la comodidad de siempre al mejor precio de la región.
						</p>
					</div>

					<div className="relative group/carousel">
						{/* Carrusel */}
						<div className="overflow-hidden rounded-[2.5rem]" ref={emblaRef}>
							<div className="flex">
								{promociones.map((promo) => (
									<div
										key={promo.id}
										className="flex-[0_0_100%] min-w-0"
									>
										<div
											className="relative aspect-[4/5] md:aspect-[21/9] lg:aspect-square xl:aspect-[1.2/1] min-h-[480px] md:min-h-[520px] rounded-[2.5rem] overflow-hidden group/banner shadow-2xl shadow-slate-900/30 transition-all duration-700 cursor-pointer"
											onClick={() => handleBannerClick(promo)}
										>
											{/* Fondo Sólido de Marca */}
											<div className="absolute inset-0 bg-[#1E3A14]" />

											{/* Imagen del administrador (con velado oscuro para contraste) */}
											{promo.imagen_url && (
												<img
													src={
														promo.imagen_url.startsWith("http")
															? promo.imagen_url
															: `${getBackendUrl()}${promo.imagen_url}`
													}
													alt={promo.nombre}
													className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover/banner:scale-105"
													style={{
														objectPosition: promo.posicion_imagen || "center",
													}}
													onError={(e) => {
														e.target.style.display = 'none';
													}}
												/>
											)}

											{/* Degradado para legibilidad del texto */}
											<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

											{/* Contenido Editorial */}
											<div className="absolute inset-0 p-8 md:p-16 pb-24 md:pb-32 flex flex-col justify-end text-white z-10">
												<div className="max-w-2xl translate-y-4 group-hover/banner:translate-y-0 transition-transform duration-700">
													<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#8C5E42] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-6 border border-white/20">
														<span className="h-1.5 w-1.5 rounded-full bg-[#8C5E42] animate-pulse" />
														{promo.tipo_viaje === "ida_vuelta"
															? "Tarifa Ida y Vuelta"
															: "Oferta de Temporada"}
													</span>

													<h3 className="font-serif text-3xl md:text-5xl lg:text-6xl font-medium mb-6 leading-[1.1] tracking-tight">
														{promo.nombre}
													</h3>

													<div className="flex flex-col gap-2 mb-10">
														<div className="flex items-baseline gap-3">
															<span className="font-serif text-4xl md:text-7xl font-bold text-white leading-none">
																$
																{Number(promo.precio).toLocaleString("es-CL", {
																	maximumFractionDigits: 0,
																})}
															</span>
															<span className="text-xs md:text-xl text-slate-300 font-light italic">
																Precio final
															</span>
														</div>
														<p className="text-sm md:text-2xl font-light text-slate-200">
															Traslado desde <span className="font-semibold text-white">{promo.origen}</span> hacia <span className="font-semibold text-white">{promo.destino}</span>
														</p>
													</div>

													<div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full">
														<div className="flex items-center gap-2 text-white/60 font-bold uppercase tracking-[0.2em] text-[10px]">
															<Users className="h-4 w-4" />
															<span>Hasta {promo.max_pasajeros} personas</span>
														</div>

														<Button
															className="bg-[#8C5E42] hover:bg-[#A67B5B] text-white font-bold text-sm md:text-base h-14 md:h-16 px-10 rounded-2xl shadow-xl transition-all duration-500 transform hover:-translate-y-1 active:scale-95 w-full sm:w-auto uppercase tracking-wider order-first sm:order-last"
															onClick={(e) => {
																e.stopPropagation();
																handleBannerClick(promo);
															}}
														>
															Reservar ahora
														</Button>
													</div>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Navegación elegante (Simetría Total) */}
						{promociones.length > 1 && (
							<div className="absolute bottom-8 left-8 right-8 z-20 flex items-center justify-between pointer-events-none">
								{/* Indicadores (Izquierda) */}
								<div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-sm pointer-events-auto">
									<span className="text-[10px] font-bold tracking-widest tabular-nums text-white uppercase">
										{String(selectedIndex + 1).padStart(2, "0")} /{" "}
										{String(promociones.length).padStart(2, "0")}
									</span>
									<div className="flex gap-1.5">
										{promociones.map((_, i) => (
											<button
												key={i}
												type="button"
												onClick={() => emblaApi && emblaApi.scrollTo(i)}
												className={`h-1 rounded-full transition-all duration-500 ${
													i === selectedIndex
														? "w-6 bg-[#8C5E42]"
														: "w-1.5 bg-white/20 hover:bg-white/40"
												}`}
											/>
										))}
									</div>
								</div>

								{/* Flechas (Derecha) */}
								<div className="flex gap-3 pointer-events-auto">
									<Button
										variant="ghost"
										size="icon"
										className="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 bg-white/90 backdrop-blur-md text-[#1E3A14] shadow-lg hover:bg-[#8C5E42] hover:text-white hover:border-[#8C5E42] transition-all duration-300 active:scale-95"
										onClick={scrollPrev}
									>
										<ChevronLeft className="h-6 w-6" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 bg-white/90 backdrop-blur-md text-[#1E3A14] shadow-lg hover:bg-[#8C5E42] hover:text-white hover:border-[#8C5E42] transition-all duration-300 active:scale-95"
										onClick={scrollNext}
									>
										<ChevronRight className="h-6 w-6" />
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			</section>


			{/* Modal de reserva rápida */}
			<ReservaRapidaModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				promocion={selectedPromocion}
			/>
		</>
	);
}
