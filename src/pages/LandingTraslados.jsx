// src/pages/LandingTraslados.jsx
// Landing page dedicada para la campaña de Google Ads de traslados privados
// Cubre cualquier tipo de traslado: aeropuerto, ciudad a ciudad, eventos, excursiones, etc.

import { useState } from "react";
import {
	CheckCircle,
	MapPin,
	Phone,
	MessageCircle,
	Users,
	Calendar,
	ArrowRight,
	Star,
	ShieldCheck,
	Clock,
	Car,
	Plane,
	Mountain,
	Building2,
	Wine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import logoColor from "../assets/logo.png";
import fondoTraslados from "../assets/fondotraslados.png";
import { getBackendUrl } from "../lib/backend";

// --- Constantes ---
const WHATSAPP_NUMBER = "+56942409065";
const PHONE_NUMBER = "+56942409065";

// --- Tracker de conversión Google Ads (campaña traslados) ---
const trackCotizacionConversion = () => {
	if (typeof window !== "undefined" && typeof window.gtag === "function") {
		// Evento de conversión específico para la campaña de traslados privados
		window.gtag("event", "conversion", {
			send_to: "AW-17529712870/traslados-cotizacion",
			event_category: "lead",
			event_label: "cotizacion_traslado_privado",
		});
		// Evento GA4 para analytics
		window.gtag("event", "generate_lead", {
			event_category: "traslados_privados",
			event_label: "formulario_cotizacion",
		});
	}
};

// --- Tracker clic WhatsApp ---
const trackWhatsAppTraslado = () => {
	if (typeof window !== "undefined" && typeof window.gtag === "function") {
		window.gtag("event", "conversion", {
			send_to: "AW-17529712870/M7-iCN_HtZUbEObh6KZB",
		});
		window.gtag("event", "click_whatsapp", {
			event_category: "traslados_privados",
			event_label: "whatsapp_traslado",
		});
	}
};

// --- Estado inicial del formulario ---
const FORM_INICIAL = {
	nombre: "",
	telefono: "",
	email: "",
	origen: "",
	destino: "",
	fecha: "",
	pasajeros: "1",
	mensaje: "",
};

// --- Lista de beneficios clave ---
const BENEFICIOS = [
	{
		icon: ShieldCheck,
		titulo: "Servicio Certificado",
		desc: "Conductores habilitados, vehículos al día y cobertura de seguro en cada viaje.",
	},
	{
		icon: Clock,
		titulo: "Puntualidad Garantizada",
		desc: "Monitoreo en tiempo real y confirmación de horario 24 horas antes.",
	},
	{
		icon: Car,
		titulo: "Flota Moderna",
		desc: "Autos, camionetas y vans para grupos de 1 a 7 pasajeros con climatización.",
	},
	{
		icon: MapPin,
		titulo: "Cualquier Destino",
		desc: "Traslados dentro de La Araucanía y a cualquier ciudad de Chile.",
	},
];

// --- Tipos de traslado que ofrecemos (para SEO y confianza) ---
const TIPOS_TRASLADO = [
	"✈️ Aeropuertos (Temuco, SCL, y más)",
	"🏔️ Lagos y parques nacionales",
	"🏙️ Ciudad a ciudad (Temuco ↔ Santiago, Valdivia, etc.)",
	"🎉 Eventos, matrimonios y celebraciones",
	"🏥 Traslados médicos y hospitalarios",
	"🎓 Universidades y colegios",
	"🏕️ Excursiones y turismo aventura",
	"🏢 Traslados corporativos y ejecutivos",
];

// --- Componente principal ---
function LandingTraslados() {
	const [form, setForm] = useState(FORM_INICIAL);
	const [enviando, setEnviando] = useState(false);
	const [enviado, setEnviado] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (e) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		// Validación mínima en frontera del sistema
		if (
			!form.nombre.trim() ||
			!form.telefono.trim() ||
			!form.origen.trim() ||
			!form.destino.trim()
		) {
			setError(
				"Por favor completa los campos obligatorios: nombre, teléfono, origen y destino.",
			);
			return;
		}

		setEnviando(true);
		try {
			// Enviar cotización al backend (endpoint reutilizable de contacto/leads)
			const res = await fetch(`${getBackendUrl()}/api/cotizacion-traslado`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});

			// Si el endpoint aún no existe, igual registramos la conversión y redirigimos a WhatsApp
			const mensaje = encodeURIComponent(
				`Hola, quiero cotizar un traslado privado:\n` +
					`📍 Origen: ${form.origen}\n` +
					`📍 Destino: ${form.destino}\n` +
					`📅 Fecha: ${form.fecha || "Por definir"}\n` +
					`👥 Pasajeros: ${form.pasajeros}\n` +
					`📝 ${form.mensaje || "Sin comentarios adicionales"}\n` +
					`👤 ${form.nombre} | ${form.telefono}`,
			);

			trackCotizacionConversion();

			if (res.ok) {
				setEnviado(true);
			} else {
				// Fallback: abrir WhatsApp con los datos del formulario
				window.open(
					`https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${mensaje}`,
					"_blank",
					"noopener,noreferrer",
				);
				setEnviado(true);
			}
		} catch {
			// Error de red: fallback a WhatsApp
			const mensaje = encodeURIComponent(
				`Hola, quiero cotizar un traslado privado:\n` +
					`📍 Origen: ${form.origen}\n` +
					`📍 Destino: ${form.destino}\n` +
					`📅 Fecha: ${form.fecha || "Por definir"}\n` +
					`👥 Pasajeros: ${form.pasajeros}\n` +
					`👤 ${form.nombre} | ${form.telefono}`,
			);
			trackCotizacionConversion();
			window.open(
				`https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${mensaje}`,
				"_blank",
				"noopener,noreferrer",
			);
			setEnviado(true);
		} finally {
			setEnviando(false);
		}
	};

	const abrirWhatsApp = () => {
		trackWhatsAppTraslado();
		window.open(
			`https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${encodeURIComponent("Hola, necesito cotizar un traslado privado.")}`,
			"_blank",
			"noopener,noreferrer",
		);
	};

	return (
		<div className="min-h-screen bg-white font-sans">
			{/* ========== HEADER MINIMALISTA ========== */}
			<header className="bg-[#FAFBF9] sm:bg-white border-b border-gray-100 sticky top-0 z-50">
				<div className="container mx-auto px-4 py-3 flex items-center justify-between">
					<a href="/" aria-label="Volver al inicio">
						<img src={logoColor} alt="Transportes Araucaria" className="h-10" />
					</a>
					<div className="flex items-center gap-3">
						<a
							href={`tel:${PHONE_NUMBER}`}
							className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
						>
							<Phone className="h-4 w-4" />
							{PHONE_NUMBER}
						</a>
						<Button
							onClick={abrirWhatsApp}
							size="sm"
							className="bg-green-600 hover:bg-green-700 text-white gap-1"
						>
							<MessageCircle className="h-4 w-4" />
							WhatsApp
						</Button>
					</div>
				</div>
			</header>

			{/* ========== HERO UNIFICADO CON FORMULARIO ========== */}
			<section className="relative min-h-[800px] flex items-center pt-12 pb-16 lg:pt-20 lg:pb-20 overflow-hidden">
				{/* Fondo full width 100% visible, invertida horizontalmente (efecto espejo) */}
				<div 
					className="absolute inset-0 w-full h-full z-0"
					style={{
						backgroundImage: `url(${fondoTraslados})`,
						backgroundSize: "cover",
						backgroundPosition: "center",
						transform: "scaleX(-1)"
					}}
				/>

				<div className="container mx-auto px-4 relative z-10 w-full">
					{/* Stack de Texto y Formulario alineado a la derecha, con los botones alineados a su altura via flexbox */}
					<div className="grid lg:grid-cols-12 gap-4 lg:gap-6 items-stretch mt-4 lg:mt-6 pb-8">
						
						{/* Bloque vacío a la izquierda para asentar el fondo pleno visualmente */}
						<div className="hidden lg:block lg:col-span-6 xl:col-span-7"></div>

						{/* Columna Derecha: Texto compacto arriba, Formulario chico abajo */}
						<div className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col gap-4 relative z-20 xl:pr-4">
							
							{/* Text Container (Compacto) */}
							<div className="bg-white/85 backdrop-blur-md p-5 sm:p-6 rounded-[2rem] shadow-xl border border-white/60 space-y-4">
								<h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold leading-[1.05] tracking-tight">
									<span className="text-[#592a15]">Traslados Privados</span>
									<br />
									<span className="text-[#1a1c20]">a cualquier</span>
									<span className="text-[#592a15]"> destino</span>
								</h1>
								<p className="text-[14px] sm:text-[15px] text-gray-800 font-medium leading-relaxed">
									Aeropuertos, ciudades, eventos o donde necesites en La Araucanía. Vehículos modernos y 100% seguros.
								</p>

								{/* Icon List (Compacta) */}
								<div className="grid grid-cols-2 gap-y-2 gap-x-3 pt-2">
									<div className="flex items-start gap-2">
										<Plane className="h-[18px] w-[18px] text-gray-600 shrink-0 mt-0.5" strokeWidth={1.5} />
										<span className="text-[13px] font-semibold text-[#2d3748] leading-tight">Aeropuertos</span>
									</div>
									<div className="flex items-start gap-2">
										<Mountain className="h-[18px] w-[18px] text-gray-600 shrink-0 mt-0.5" strokeWidth={1.5} />
										<span className="text-[13px] font-semibold text-[#2d3748] leading-tight">Turismo y Parques</span>
									</div>
									<div className="flex items-start gap-2">
										<Building2 className="h-[18px] w-[18px] text-gray-600 shrink-0 mt-0.5" strokeWidth={1.5} />
										<span className="text-[13px] font-semibold text-[#2d3748] leading-tight">Ciudad a Ciudad</span>
									</div>
									<div className="flex items-start gap-2">
										<Wine className="h-[18px] w-[18px] text-gray-600 shrink-0 mt-0.5" strokeWidth={1.5} />
										<span className="text-[13px] font-semibold text-[#2d3748] leading-tight">Eventos VIP</span>
									</div>
								</div>
							</div>

							{/* Form Container (Acortado) */}
							<div id="formulario-cotizacion">
								{enviado ? (
									<Card className="border border-green-200 bg-white/95 backdrop-blur-sm shadow-xl rounded-[2rem]">
										<CardContent className="pt-8 pb-8 text-center space-y-3">
											<CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
											<h3 className="text-xl font-bold text-green-800">
												¡Solicitud enviada!
											</h3>
											<p className="text-green-700 text-[15px]">
												Recibimos tu cotización. Te contactaremos rápido.
											</p>
											<Button
												onClick={abrirWhatsApp}
												className="bg-green-600 hover:bg-green-700 text-white gap-2 mt-2 h-10 w-full rounded-lg"
											>
												<MessageCircle className="h-4 w-4" />
												Seguir por WhatsApp
											</Button>
										</CardContent>
									</Card>
								) : (
									<Card className="shadow-2xl border-white/50 bg-white/95 backdrop-blur-md rounded-[2rem]">
										<CardHeader className="bg-gray-50/50 rounded-t-[2rem] border-b border-gray-100 pb-3 pt-4 px-5">
											<CardTitle className="flex items-center gap-2 text-lg text-[#391e10]">
												<Car className="h-[18px] w-[18px]" />
												Cotiza tu traslado
											</CardTitle>
										</CardHeader>
										<CardContent className="pt-4 px-5 pb-5">
											<form onSubmit={handleSubmit} className="space-y-3">
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1">
														<label className="text-[13px] font-medium" htmlFor="nombre">
															Nombre <span className="text-red-500">*</span>
														</label>
														<Input id="nombre" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required className="bg-white h-9 text-[13px] px-3" />
													</div>
													<div className="space-y-1">
														<label className="text-[13px] font-medium" htmlFor="telefono">
															Teléfono <span className="text-red-500">*</span>
														</label>
														<Input id="telefono" name="telefono" type="tel" placeholder="+569..." value={form.telefono} onChange={handleChange} required className="bg-white h-9 text-[13px] px-3" />
													</div>
												</div>

												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1">
														<label className="text-[13px] font-medium" htmlFor="origen">
															Origen <span className="text-red-500">*</span>
														</label>
														<Input id="origen" name="origen" placeholder="Ej: Temuco" value={form.origen} onChange={handleChange} required className="bg-white h-9 text-[13px] px-3" />
													</div>
													<div className="space-y-1">
														<label className="text-[13px] font-medium" htmlFor="destino">
															Destino <span className="text-red-500">*</span>
														</label>
														<Input id="destino" name="destino" placeholder="Ej: Pucón" value={form.destino} onChange={handleChange} required className="bg-white h-9 text-[13px] px-3" />
													</div>
												</div>

												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1">
														<label className="text-[13px] font-medium" htmlFor="fecha">
															Fecha de viaje
														</label>
														<Input id="fecha" name="fecha" type="date" value={form.fecha} onChange={handleChange} className="bg-white h-9 text-[13px] px-3" />
													</div>
													<div className="space-y-1">
														<label className="text-[13px] font-medium" htmlFor="pasajeros">
															N° Pasajeros
														</label>
														<div className="relative">
															<Users className="absolute left-2.5 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-gray-500" />
															<Input id="pasajeros" name="pasajeros" type="number" min="1" max="20" placeholder="1" value={form.pasajeros} onChange={handleChange} className="pl-8 bg-white h-9 text-[13px]" />
														</div>
													</div>
												</div>

												{error && (
													<p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5 mt-1">
														{error}
													</p>
												)}

												<Button type="submit" disabled={enviando} className="w-full text-[14px] font-semibold gap-2 bg-[#2a4e25] hover:bg-[#1a3317] h-10 rounded-xl mt-1">
													{enviando ? <>Enviando...</> : <>Solicitar cotización <ArrowRight className="h-3.5 w-3.5" /></>}
												</Button>
											</form>
										</CardContent>
									</Card>
								)}
							</div>

							{/* === BOTONES EXTRA EN LA MISA COLUMNA (Equilibrio perfecto) === */}
							<div className="flex flex-col sm:flex-row gap-4 w-full mt-2 lg:mt-3 relative z-20">
								<a href="/" className="w-full sm:w-1/2">
									<Button className="w-full bg-white/95 hover:bg-white text-[#592a15] border border-white/60 font-bold h-14 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md flex items-center justify-center gap-2.5 text-[14px] xl:text-[15px] transition-all">
										<Plane className="h-5 w-5" />
										Ir a Traslados Aeropuerto
									</Button>
								</a>
								<Button onClick={abrirWhatsApp} className="w-full sm:w-1/2 bg-[#25D366]/95 hover:bg-[#25D366] text-white border border-green-500/30 font-bold h-14 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md flex items-center justify-center gap-2.5 text-[14px] xl:text-[15px] transition-all">
									<MessageCircle className="h-6 w-6" />
									WhatsApp Directo
								</Button>
							</div>

						</div>
					</div>
				</div>
			</section>

			{/* ========== TIPOS DE TRASLADO ========== */}
			<section className="py-16 bg-white">
				<div className="container mx-auto px-4">
					<div className="text-center mb-10">
						<h2 className="text-3xl font-bold mb-3">
							¿Qué tipo de traslado necesitas?
						</h2>
						<p className="text-muted-foreground max-w-xl mx-auto">
							Cubrimos todo tipo de viajes. Si no ves el tuyo en la lista,
							contáctanos igual.
						</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
						{TIPOS_TRASLADO.map((tipo) => (
							<div
								key={tipo}
								className="flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary/5 hover:border-primary/30 transition-colors"
							>
								{tipo}
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ========== BENEFICIOS ========== */}
			<section className="py-16 bg-gray-50">
				<div className="container mx-auto px-4">
					<div className="text-center mb-10">
						<h2 className="text-3xl font-bold mb-3">¿Por qué elegirnos?</h2>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
						{BENEFICIOS.map((beneficio) => {
							const IconComp = beneficio.icon;
							return (
								<Card
									key={beneficio.titulo}
									className="text-center shadow-sm hover:shadow-md transition-shadow"
								>
									<CardContent className="pt-8 pb-6 space-y-3">
										<div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
											<IconComp className="h-6 w-6 text-primary" />
										</div>
										<h3 className="font-semibold text-base">
											{beneficio.titulo}
										</h3>
										<p className="text-sm text-muted-foreground">
											{beneficio.desc}
										</p>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</section>

			{/* ========== CTA FINAL ========== */}
			<section className="py-16 bg-slate-900 text-white text-center">
				<div className="container mx-auto px-4 space-y-6 max-w-xl">
					<h2 className="text-3xl font-bold">
						¿Listo para reservar tu traslado?
					</h2>
					<p className="text-slate-300">
						Respuesta inmediata por WhatsApp o cotización formal en el
						formulario de arriba.
					</p>
					<div className="flex flex-col sm:flex-row justify-center gap-4">
						<Button
							onClick={abrirWhatsApp}
							size="lg"
							className="bg-green-500 hover:bg-green-600 text-white gap-2 font-bold"
						>
							<MessageCircle className="h-5 w-5" />
							Escribir por WhatsApp
						</Button>
						<Button
							onClick={() =>
								document
									.getElementById("formulario-cotizacion")
									?.scrollIntoView({ behavior: "smooth" })
							}
							size="lg"
							variant="outline"
							className="border-white text-white hover:bg-white/10 gap-2"
						>
							<Calendar className="h-5 w-5" />
							Formulario de cotización
						</Button>
					</div>
					<a
						href={`tel:${PHONE_NUMBER}`}
						className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
					>
						<Phone className="h-4 w-4" />
						Llamar al {PHONE_NUMBER}
					</a>
				</div>
			</section>

			{/* ========== FOOTER SIMPLIFICADO ========== */}
			<footer className="bg-slate-950 text-slate-400 py-8 text-sm text-center">
				<div className="container mx-auto px-4 space-y-2">
					<p>
						© {new Date().getFullYear()} Transportes Araucaria. Todos los
						derechos reservados.
					</p>
					<p>
						<a
							href="/"
							className="hover:text-white transition-colors underline"
						>
							Volver al sitio principal
						</a>
					</p>
				</div>
			</footer>
		</div>
	);
}

export default LandingTraslados;
