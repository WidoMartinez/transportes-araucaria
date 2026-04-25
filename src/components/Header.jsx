import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
	Phone,
	MessageCircle,
	RotateCcw,
	Menu,
	MapPin,
	Calendar,
	Briefcase,
	Star,
	ChevronRight,
} from "lucide-react";
import logo from "../assets/logo.png";
import AvatarDropdown from "./AvatarDropdown";
import {
	motion,
	useScroll,
	useMotionValueEvent,
} from "framer-motion";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import WhatsAppInterceptModal from "./WhatsAppInterceptModal";
import { usePricingData } from "../hooks/usePricingData";
import { getBackendUrl } from "../lib/backend";
import { trackWhatsAppConversion } from "../lib/tracking";

// --- Trackers ---

// --- Menu Items Data ---
const MENU_ITEMS = [
	{ label: "Inicio", href: "#inicio", icon: Star },
	{ label: "Servicios", href: "#servicios", icon: Briefcase },
	{ label: "Traslados", href: "/traslados", icon: MapPin },
	{ label: "Oportunidades", href: "/oportunidades", icon: Star },
	{ label: "Destinos", href: "#destinos", icon: MapPin },
	{ label: "Contacto", href: "#contacto", icon: Phone },
];

// Detecta si un href corresponde a la ruta actual
const matchesRoute = (href) => {
	if (!href.startsWith("/")) return false;
	return window.location.pathname === href || window.location.pathname.startsWith(href + "/");
};

function Header() {
	const HeaderAnimado = motion.header;
	const ContenedorAnimado = motion.div;
	const [isScrolled, setIsScrolled] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	// Flag: solo detectar sección activa después de que el usuario haya scrolleado
	const hasScrolled = useRef(false);
	const [showModal, setShowModal] = useState(false);
	const [whatsappInterceptEnabled, setWhatsappInterceptEnabled] =
		useState(true);
	// href del ítem activo (sección visible o ruta actual)
	// Inicia en null para que ningún ítem esté marcado hasta que el IntersectionObserver detecte la sección visible
	const [activeHref, setActiveHref] = useState(() => {
		const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
		const routeItem = MENU_ITEMS.find(
			(item) => item.href.startsWith("/") && pathname === item.href,
		);
		return routeItem ? routeItem.href : null;
	});
	const { scrollY } = useScroll();
	const { discountOnline } = usePricingData();

	// Cargar configuración de modal WhatsApp al montar
	useEffect(() => {
		const cargarConfiguracion = async () => {
			try {
				// Intentar obtener de localStorage primero (caché)
				const cachedValue = localStorage.getItem("whatsapp_intercept_activo");
				if (cachedValue !== null) {
					setWhatsappInterceptEnabled(cachedValue === "true");
				}
				// Consultar al backend para tener el valor más actualizado
				const response = await fetch(
					`${getBackendUrl()}/api/configuracion/whatsapp-intercept`,
				);
				if (response.ok) {
					const data = await response.json();
					setWhatsappInterceptEnabled(data.activo);
					localStorage.setItem(
						"whatsapp_intercept_activo",
						data.activo.toString(),
					);
				}
			} catch (error) {
				console.error(
					"Error cargando configuración WhatsApp intercept:",
					error,
				);
			}
		};
		cargarConfiguracion();
	}, []);

	// Detectar scroll para cambiar estilo del header y habilitar detección de sección activa
	useMotionValueEvent(scrollY, "change", (latest) => {
		if (latest > 20) {
			hasScrolled.current = true;
			if (!isScrolled) setIsScrolled(true);
		} else if (latest <= 20 && isScrolled) {
			setIsScrolled(false);
		}
	});

	// Detectar sección activa con IntersectionObserver (solo para hash links)
	useEffect(() => {
		// Si estamos en una ruta específica, no observar secciones
		const pathname = window.location.pathname;
		const isRoutePage = MENU_ITEMS.some(
			(item) => item.href.startsWith("/") && pathname === item.href,
		);
		if (isRoutePage) return;

		// Obtener los ids de las secciones con hash
		const hashItems = MENU_ITEMS.filter((item) => item.href.startsWith("#"));
		const sectionIds = hashItems.map((item) => item.href.slice(1));

		const observers = [];
		sectionIds.forEach((id) => {
			const el = document.getElementById(id);
			if (!el) return;
			const observer = new IntersectionObserver(
				([entry]) => {
					// Solo marcar activo si el usuario ya hizo scroll (evita que #inicio quede marcado al cargar)
					if (entry.isIntersecting && hasScrolled.current) {
						setActiveHref(`#${id}`);
					}
				},
				{ rootMargin: "-40% 0px -50% 0px", threshold: 0 },
			);
			observer.observe(el);
			observers.push(observer);
		});

		return () => observers.forEach((o) => o.disconnect());
	}, []);

	const handleUpdatePricing = async () => {
		setIsUpdating(true);
		try {
			if (window.recargarDatosPrecios) {
				await window.recargarDatosPrecios();
				console.log("✅ Precios actualizados manualmente");
			} else {
				window.location.reload();
			}
		} catch (error) {
			console.error("Error al actualizar precios:", error);
		} finally {
			setTimeout(() => setIsUpdating(false), 1000);
		}
	};

	// Handlers para modal de intercepción WhatsApp
	const handleWhatsAppClick = (e) => {
		e.preventDefault();
		if (!whatsappInterceptEnabled) {
			void trackWhatsAppConversion("Header");
			window.open("https://wa.me/56936643540", "_blank", "noopener,noreferrer");
			return;
		}
		setShowModal(true);
	};

	const handleReserveFromModal = () => {
		setShowModal(false);
		const reservaSection = document.querySelector("#inicio");
		if (reservaSection) {
			reservaSection.scrollIntoView({ behavior: "smooth" });
		}
	};

	const handleCloseModal = () => {
		setShowModal(false);
	};

	return (
		<>
			<HeaderAnimado
				className={cn(
					// z-40: los Popovers y Dialogs de Radix usan Portal con z-50, así quedan siempre encima del nav
					"fixed inset-x-0 top-0 z-40 transition-all duration-300",
					isScrolled
						? "bg-forest-600/95 shadow-lg shadow-black/20 backdrop-blur-md"
						: "bg-forest-600",
				)}
				initial={{ y: -100 }}
				animate={{ y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					{/* Logo original con imagen PNG del proyecto */}
					<a href="#inicio" className="flex items-center gap-3 text-white z-50">
						<img
							src={logo}
							alt="Transportes Araucaria"
							className={cn(
								"transition-all duration-300 object-contain brightness-0 invert",
								isScrolled ? "h-16 md:h-20" : "h-24 md:h-28",
							)}
						/>
					</a>
					{/* Botón de actualización de precios — invisible, accesible solo por teclado/admin */}
					<button
						onClick={handleUpdatePricing}
						disabled={isUpdating}
						className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:p-2 focus:rounded focus:bg-white/10 focus:text-white/60"
						title="Actualizar precios"
						tabIndex={-1}
					>
						<RotateCcw size={14} className={isUpdating ? "animate-spin" : ""} />
					</button>

					{/* Desktop Navigation — estilo ruta-araucaria: texto gris que ilumina al hover, activo con color del proyecto */}
					<ul className="hidden items-center gap-7 xl:flex">
						{MENU_ITEMS.filter((item) => !item.highlight).map((link) => {
							const isActive = activeHref === link.href || matchesRoute(link.href);
							return (
								<li key={link.href}>
									<a
										href={link.href}
										className={cn(
											"relative text-[13px] tracking-wide no-underline transition-colors duration-200",
											isActive
												? "text-[#C4895E] font-semibold"
												: "text-white/55 font-medium hover:text-white",
										)}
									>
										{link.label}
									</a>
								</li>
							);
						})}
					</ul>

					{/* Desktop CTAs — grupo reducido, mayoría en AvatarDropdown */}
					<div className="hidden xl:flex items-center gap-2">


						{/* WhatsApp — botón principal */}
						<ContenedorAnimado whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
							<Button
								onClick={handleWhatsAppClick}
								className="rounded-full bg-[#8C5E42] text-white hover:bg-[#7A5038] shadow shadow-[#8C5E42]/30 hover:shadow-md hover:shadow-[#8C5E42]/40 transition-all font-semibold"
								size="sm"
							>
								<MessageCircle className="w-4 h-4" />
								WhatsApp
							</Button>
						</ContenedorAnimado>

						{/* Separador vertical + accesos rápidos */}
						<Separator orientation="vertical" className="h-5 bg-white/15 mx-1" />
						<AvatarDropdown />
					</div>

					{/* Mobile Menu Trigger */}
					<div className="xl:hidden flex items-center gap-2">
						{/* Botón WhatsApp compacto en mobile */}
						<Button
							onClick={handleWhatsAppClick}
							size="icon"
							className="flex h-9 w-9 rounded-full bg-[#8C5E42] text-white hover:bg-[#7A5038] shadow-md shadow-[#8C5E42]/30 transition-all md:hidden"
							aria-label="WhatsApp"
						>
							<MessageCircle className="w-4 h-4" />
						</Button>
						<div className="hidden md:block">
							<AvatarDropdown />
						</div>
						<Sheet>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="rounded-lg text-white hover:bg-white/10 hover:text-white"
									aria-label="Abrir menú"
								>
									<Menu className="h-5 w-5" />
								</Button>
							</SheetTrigger>
							<SheetContent
								side="right"
								className="w-[300px] sm:w-[360px] p-0 flex flex-col border-l-0 shadow-2xl bg-forest-600 text-white"
							>
								{/* Cabecera del panel mobile con logo */}
								<div className="p-6 pb-4">
									<SheetTitle className="text-left flex items-center gap-3 text-white">
										<img
											src={logo}
											alt="Transportes Araucaria"
											className="h-10 brightness-0 invert"
										/>
									</SheetTitle>
								</div>

								<Separator className="bg-white/10" />

								{/* Links de navegación mobile */}
								<div className="flex-1 overflow-y-auto py-4 px-3">
									<p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-2">
										Navegación
									</p>
									<nav className="flex flex-col space-y-0.5">
										{MENU_ITEMS.map((item) => (
											<SheetClose key={item.href} asChild>
												<a
													href={item.href}
													className={cn(
														"group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
														item.highlight
															? "bg-[#8C5E42]/15 text-[#C4895E] hover:bg-[#8C5E42]/25"
															: "text-white/70 hover:bg-white/8 hover:text-white",
													)}
												>
													<span className="flex items-center gap-3">
														<div
															className={cn(
																"flex h-8 w-8 items-center justify-center rounded-lg",
																item.highlight
																	? "bg-[#8C5E42]/20 text-[#C4895E]"
																	: "bg-white/8 text-white/50 group-hover:bg-white/12 group-hover:text-white/80",
															)}
														>
															<item.icon className="w-3.5 h-3.5" />
														</div>
														{item.label}
													</span>
													{item.highlight && (
														<Badge
															variant="secondary"
															className="text-[9px] px-1.5 py-0.5 bg-[#8C5E42]/20 text-[#C4895E] border-0 font-semibold"
														>
															CTA
														</Badge>
													)}
													{!item.highlight && (
														<ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
													)}
												</a>
											</SheetClose>
										))}

										{/* Enlaces de gestión sutiles solicitado por el usuario */}
										<div className="pt-4 mt-2 border-t border-white/5">
											<p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-1">
												Mi Reserva
											</p>
											<SheetClose asChild>
												<a href="#consultar-reserva" className="flex items-center gap-3 px-3 py-2 text-xs text-white/60 hover:text-[#C4895E] transition-colors">
													<RotateCcw className="w-3 h-3" />
													Consultar reserva
												</a>
											</SheetClose>
											<SheetClose asChild>
												<a href="#pagar-con-codigo" className="flex items-center gap-3 px-3 py-2 text-xs text-white/60 hover:text-[#C4895E] transition-colors">
													<Briefcase className="w-3 h-3" />
													Pagar con código
												</a>
											</SheetClose>
										</div>
									</nav>
								</div>

								<Separator className="bg-white/10" />

								{/* Acciones rápidas en el footer del panel mobile */}
								<div className="p-4 bg-forest-700 space-y-2">

									<Button
										onClick={handleWhatsAppClick}
										className="w-full rounded-xl bg-[#8C5E42] text-white hover:bg-[#7A5038] font-semibold shadow-lg shadow-[#8C5E42]/20 transition-all"
									>
										<MessageCircle className="w-5 h-5" />
										Chatear por WhatsApp
									</Button>
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</nav>
			</HeaderAnimado>

			{/* Modal de Intercepción WhatsApp — fuera del header para evitar problemas de stacking */}
			<WhatsAppInterceptModal
				isOpen={showModal}
				onClose={handleCloseModal}
				onReserve={handleReserveFromModal}
				discountData={discountOnline}
			/>
		</>
	);
}

export default Header;
