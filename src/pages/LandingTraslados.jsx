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
			<header className="bg-white border-b sticky top-0 z-50 shadow-sm">
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

			{/* ========== HERO ========== */}
			<section
				className="relative py-16 md:py-24 overflow-hidden"
				style={{
					backgroundImage: `url(${fondoTraslados})`,
					backgroundSize: "contain",
					backgroundPosition: "right center",
					backgroundRepeat: "no-repeat",
					minHeight: "620px",
				}}
			>
				{/* Degradado blanco desde la izquierda para legibilidad del texto */}
				<div className="absolute inset-0 bg-linear-to-r from-white via-white/92 to-transparent pointer-events-none" />

				<div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10">
					{/* Texto hero */}
					<div className="space-y-6">
						<div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 text-sm font-medium text-green-800">
							<Star className="h-3.5 w-3.5 fill-green-600 text-green-600" />
							Transporte privado de confianza
						</div>
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
							<span className="text-[#6b2f0e]">Traslados Privados</span>
							<br />
							<span className="text-gray-800">a </span>
							<span className="text-gray-500 font-semibold">cualquier</span>
							<span className="text-[#6b2f0e]"> destino</span>
						</h1>
						<p className="text-lg text-gray-600 max-w-md">
							Aeropuertos, ciudades, parques, eventos o donde necesites.
							Servicio de transporte privado en La Araucanía y más allá, con
							conductores certificados y vehículos modernos.
						</p>

						{/* Tipos de traslado resumidos */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{TIPOS_TRASLADO.slice(0, 4).map((tipo) => (
								<div key={tipo} className="text-sm text-gray-700">
									{tipo}
								</div>
							))}
						</div>

						<div className="flex flex-wrap gap-3 pt-2">
							<Button
								onClick={() =>
									document
										.getElementById("formulario-cotizacion")
										?.scrollIntoView({ behavior: "smooth" })
								}
								size="lg"
								className="bg-[#2d5a27] hover:bg-[#1e3d1b] text-white font-bold gap-2"
							>
								Cotiza ahora gratis
								<ArrowRight className="h-4 w-4" />
							</Button>
							<Button
								onClick={abrirWhatsApp}
								size="lg"
								variant="outline"
								className="border-gray-400 text-gray-700 bg-white/80 hover:bg-white gap-2"
							>
								<MessageCircle className="h-4 w-4 text-green-600" />
								Escribir por WhatsApp
							</Button>
						</div>
					</div>

					{/* Tarjetas de stats */}
					<div className="grid grid-cols-2 gap-4 md:mt-40 lg:mt-48">
						{[
							{ valor: "+500", label: "Traslados realizados" },
							{ valor: "4.9★", label: "Calificación promedio" },
							{ valor: "24/7", label: "Disponibilidad" },
							{ valor: "100%", label: "Conductores certificados" },
						].map(({ valor, label }) => (
							<div
								key={label}
								className="bg-[#d9f0db]/80 border border-green-200 rounded-2xl p-6 text-center backdrop-blur-sm"
							>
								<div className="text-3xl font-bold text-[#2d5a27]">{valor}</div>
								<div className="text-sm text-gray-700 mt-1">{label}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ========== FORMULARIO DE COTIZACIÓN ========== */}
			<section id="formulario-cotizacion" className="py-16 bg-gray-50">
				<div className="container mx-auto px-4 max-w-2xl">
					<div className="text-center mb-10">
						<h2 className="text-3xl font-bold mb-3">Cotiza tu traslado</h2>
						<p className="text-muted-foreground">
							Completa el formulario y te respondemos en menos de 1 hora.
						</p>
					</div>

					{enviado ? (
						<Card className="border-green-200 bg-green-50">
							<CardContent className="pt-8 pb-8 text-center space-y-4">
								<CheckCircle className="h-14 w-14 text-green-600 mx-auto" />
								<h3 className="text-xl font-bold text-green-800">
									¡Solicitud enviada!
								</h3>
								<p className="text-green-700">
									Recibimos tu cotización. Te contactaremos a la brevedad por
									WhatsApp o teléfono.
								</p>
								<Button
									onClick={abrirWhatsApp}
									className="bg-green-600 hover:bg-green-700 text-white gap-2"
								>
									<MessageCircle className="h-4 w-4" />
									Seguir por WhatsApp
								</Button>
							</CardContent>
						</Card>
					) : (
						<Card className="shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Car className="h-5 w-5 text-primary" />
									Formulario de cotización
								</CardTitle>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSubmit} className="space-y-4">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-1">
											<label className="text-sm font-medium" htmlFor="nombre">
												Nombre <span className="text-red-500">*</span>
											</label>
											<Input
												id="nombre"
												name="nombre"
												placeholder="Tu nombre"
												value={form.nombre}
												onChange={handleChange}
												required
											/>
										</div>
										<div className="space-y-1">
											<label className="text-sm font-medium" htmlFor="telefono">
												Teléfono <span className="text-red-500">*</span>
											</label>
											<Input
												id="telefono"
												name="telefono"
												type="tel"
												placeholder="+56 9 XXXX XXXX"
												value={form.telefono}
												onChange={handleChange}
												required
											/>
										</div>
									</div>

									<div className="space-y-1">
										<label className="text-sm font-medium" htmlFor="email">
											Correo electrónico
										</label>
										<Input
											id="email"
											name="email"
											type="email"
											placeholder="tu@correo.cl"
											value={form.email}
											onChange={handleChange}
										/>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-1">
											<label className="text-sm font-medium" htmlFor="origen">
												Origen <span className="text-red-500">*</span>
											</label>
											<Input
												id="origen"
												name="origen"
												placeholder="Ej: Temuco, Aeropuerto La Araucanía"
												value={form.origen}
												onChange={handleChange}
												required
											/>
										</div>
										<div className="space-y-1">
											<label className="text-sm font-medium" htmlFor="destino">
												Destino <span className="text-red-500">*</span>
											</label>
											<Input
												id="destino"
												name="destino"
												placeholder="Ej: Pucón, Santiago, Panguipulli"
												value={form.destino}
												onChange={handleChange}
												required
											/>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-1">
											<label className="text-sm font-medium" htmlFor="fecha">
												Fecha del viaje
											</label>
											<Input
												id="fecha"
												name="fecha"
												type="date"
												value={form.fecha}
												onChange={handleChange}
											/>
										</div>
										<div className="space-y-1">
											<label
												className="text-sm font-medium"
												htmlFor="pasajeros"
											>
												N° de pasajeros
											</label>
											<div className="relative">
												<Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
												<Input
													id="pasajeros"
													name="pasajeros"
													type="number"
													min="1"
													max="20"
													placeholder="1"
													value={form.pasajeros}
													onChange={handleChange}
													className="pl-9"
												/>
											</div>
										</div>
									</div>

									<div className="space-y-1">
										<label className="text-sm font-medium" htmlFor="mensaje">
											Comentarios adicionales
										</label>
										<Textarea
											id="mensaje"
											name="mensaje"
											placeholder="Cuéntanos más sobre tu traslado (horario, equipaje especial, paradas, etc.)"
											value={form.mensaje}
											onChange={handleChange}
											rows={3}
										/>
									</div>

									{error && (
										<p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
											{error}
										</p>
									)}

									<Button
										type="submit"
										disabled={enviando}
										className="w-full text-base font-semibold gap-2"
										size="lg"
									>
										{enviando ? (
											<>Enviando cotización...</>
										) : (
											<>
												Solicitar cotización gratuita
												<ArrowRight className="h-4 w-4" />
											</>
										)}
									</Button>

									<p className="text-xs text-center text-muted-foreground">
										También puedes escribirnos directamente por{" "}
										<button
											type="button"
											onClick={abrirWhatsApp}
											className="text-green-600 underline font-medium"
										>
											WhatsApp
										</button>
									</p>
								</form>
							</CardContent>
						</Card>
					)}
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
