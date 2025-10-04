/* global gtag */
import { useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	CheckCircle,
	Clock,
	Globe2,
	MessageCircle,
	Phone,
	ShieldCheck,
	Truck,
} from "lucide-react";
import logo from "../assets/logo.png";
import camionford from "../assets/camionford.png";

const initialFormState = {
	nombre: "",
	empresa: "",
	email: "",
	telefono: "",
	origen: "Temuco",
	destino: "",
	fecha: "",
	tipoCarga: "",
	volumen: "",
	mensaje: "",
};

const REQUIRED_FIELDS = ["nombre", "telefono", "email", "origen", "destino"];

const trackWhatsAppClick = (context) => {
	if (typeof gtag === "function") {
		gtag("event", "conversion", {
			send_to: "AW-17529712870/M7-iCN_HtZUbEObh6KZB",
			value: context?.value || 1,
			currency: "CLP",
		});
	}
};

function FletesLanding() {
	const [formData, setFormData] = useState(initialFormState);
	const [feedback, setFeedback] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const whatsappMessage = useMemo(() => {
		const baseMessage = `Hola Transportes Araucaria, necesito coordinar un flete nacional desde ${
			formData.origen || "La Araucanía"
		} hacia ${formData.destino || "[destino]"}.`;
		const details = [];
		if (formData.tipoCarga)
			details.push(`Tipo de carga: ${formData.tipoCarga}`);
		if (formData.volumen)
			details.push(`Volumen/Peso aprox.: ${formData.volumen}`);
		if (formData.fecha) details.push(`Fecha estimada: ${formData.fecha}`);
		if (formData.nombre) details.push(`Contacto: ${formData.nombre}`);
		if (formData.telefono) details.push(`Teléfono: ${formData.telefono}`);
		if (formData.empresa) details.push(`Empresa: ${formData.empresa}`);
		if (formData.mensaje) details.push(`Notas: ${formData.mensaje}`);
		return `https://wa.me/56936643540?text=${encodeURIComponent(
			[baseMessage, ...details].join("\n")
		)}`;
	}, [formData]);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setFeedback(null);

		const missingField = REQUIRED_FIELDS.find(
			(field) => !formData[field]?.trim()
		);
		if (missingField) {
			setFeedback({
				type: "error",
				message: "Por favor completa los campos obligatorios marcados con *.",
			});
			return;
		}

		setIsSubmitting(true);

		const payload = {
			// Datos principales que espera el PHP
			nombre: formData.nombre,
			email: formData.email,
			telefono: formData.telefono,
			origen: formData.origen,
			destino: formData.destino,
			fecha: formData.fecha,
			mensaje: `SOLICITUD DE FLETE NACIONAL

Datos de contacto:
- Nombre: ${formData.nombre}
- Empresa: ${formData.empresa || "No especificada"}
- Email: ${formData.email}
- Teléfono: ${formData.telefono}

Detalles del servicio:
- Origen: ${formData.origen}
- Destino: ${formData.destino}
- Fecha de carga: ${formData.fecha || "No especificada"}
- Tipo de carga: ${formData.tipoCarga || "No especificado"}
- Volumen/Peso: ${formData.volumen || "No especificado"}
- Notas adicionales: ${formData.mensaje || "Ninguna"}

Canal: Landing de Fletes
Tipo: Flete Nacional`,
			source: "landing-fletes",
			// Datos adicionales para tracking
			canal: "landing-fletes",
			tipoSolicitud: "FLETE_NACIONAL",
			fechaSolicitud: new Date().toISOString(),
		};

		try {
			const response = await fetch(
				"https://www.transportesaraucaria.cl/enviar_correo_mejorado.php",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			if (!response.ok) {
				throw new Error(
					`No se pudo registrar la solicitud (${response.status}).`
				);
			}

			try {
				const apiUrl =
					import.meta.env.VITE_API_URL ||
					"https://transportes-araucaria.onrender.com";
				await fetch(`${apiUrl}/enviar-reserva`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...payload,
						origen: payload.detalleServicio.origen,
						destino: payload.detalleServicio.destino,
						servicio: "Flete Nacional",
						source: "landing-fletes",
					}),
				});
			} catch (apiError) {
				console.warn(
					"Aviso: error al registrar el lead en la API principal",
					apiError
				);
			}

			if (typeof gtag === "function") {
				gtag("event", "conversion", {
					send_to: "AW-17529712870/8GVlCLP-05MbEObh6KZB",
					value: 1,
					currency: "CLP",
				});
			}

			setFeedback({
				type: "success",
				message:
					"Recibimos tu solicitud de flete. Te contactaremos en minutos.",
			});
			setFormData(initialFormState);
		} catch (error) {
			console.error("Error al enviar la solicitud de flete", error);
			setFeedback({
				type: "error",
				message:
					"Ocurrió un problema al enviar tu solicitud. Escríbenos por WhatsApp para ayudarte de inmediato.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const sellingPoints = [
		{
			icon: Truck,
			title: "Cobertura nacional puerta a puerta",
			description:
				"Coordinamos retiros en La Araucanía y entregas en todo Chile con conductores certificados.",
		},
		{
			icon: ShieldCheck,
			title: "Carga segura y asegurada",
			description:
				"Protocolos de trazabilidad, seguimiento en vivo y pólizas acordes al tipo de mercadería.",
		},
		{
			icon: Clock,
			title: "Respuesta en menos de 15 minutos",
			description:
				"Equipo especializado en fletes urgentes, programados y contratos recurrentes para empresas.",
		},
	];

	const trustSignals = [
		"Integración con Google Ads y Analytics",
		"Atención 24/7 desde La Araucanía",
		"Conductores con licencia profesional",
		"Servicio corporativo y pymes",
	];

	const workflow = [
		{
			title: "Diagnóstico express",
			description:
				"Te contactamos en minutos para definir requisitos, tipo de carga y plazos de entrega.",
		},
		{
			title: "Plan logístico personalizado",
			description:
				"Coordinamos vehículos, permisos y aseguramos la documentación según normativa vigente.",
		},
		{
			title: "Seguimiento y confirmación",
			description:
				"Te mantenemos informado en cada hito y confirmamos la entrega con pruebas de recepción.",
		},
	];

	const feedbackClassName =
		feedback?.type === "success"
			? "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
			: "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

	return (
		<div id="fletes" className="min-h-screen bg-background text-foreground animate-fade-in">
			<header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border">
				<div className="container mx-auto flex items-center justify-between px-4 py-4">
					<a href="/" className="flex items-center gap-3 animate-slide-in-left">
						<img
							src={logo}
							alt="Transportes Araucaria"
							className="h-20 md:h-24 transition-transform duration-300 hover:scale-105"
						/>
					</a>
					<div className="hidden md:flex items-center gap-3 animate-slide-in-right">
						<a
							href={whatsappMessage}
							onClick={() => trackWhatsAppClick({ value: 1 })}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg focus-visible:ring-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl">
								<MessageCircle className="h-4 w-4 mr-2 animate-pulse" />
								Cotizar por WhatsApp
							</Button>
						</a>
						<a href="#cotizar">
							<Button
								variant="outline"
								className="border-primary text-primary hover:bg-primary/10 focus-visible:ring-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg"
							>
								Formulario Express
							</Button>
						</a>
					</div>
				</div>
			</header>

			<main>
				<section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-white to-accent/10">
					<div className="container mx-auto px-4 py-24 lg:py-32 grid gap-12 lg:grid-cols-2 items-center">
						<div className="animate-slide-in-left">
							<div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-medium text-primary animate-bounce-in">
								<CheckCircle className="h-4 w-4 animate-pulse" />
								Fletes desde La Araucanía a todo Chile
							</div>
							<h1 className="mt-6 text-4xl sm:text-5xl font-bold leading-tight animate-fade-in-up">
								Logística nacional con base en La Araucanía para empresas que
								necesitan velocidad y control.
							</h1>
							<p className="mt-6 text-lg text-muted-foreground max-w-xl animate-fade-in-up animation-delay-200">
								Administramos fletes dedicados desde Temuco, Padre Las Casas y
								gran La Araucanía hacia cualquier región del país. Coordinamos
								desde cargas paletizadas hasta insumos industriales, con
								seguimiento en tiempo real y soporte 24/7.
							</p>
							<div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
								<a
									href={whatsappMessage}
									target="_blank"
									rel="noopener noreferrer"
									onClick={() => trackWhatsAppClick({ value: 1 })}
								>
									<Button
										size="lg"
										className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg focus-visible:ring-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl"
									>
										<MessageCircle className="h-5 w-5 mr-2 animate-pulse" />
										Habla con logística ahora
									</Button>
								</a>
								<a href="#cotizar">
									<Button
										size="lg"
										variant="outline"
										className="border-primary text-primary hover:bg-primary/10 focus-visible:ring-primary/30 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
									>
										Solicitar propuesta en 15 minutos
									</Button>
								</a>
							</div>
							<div className="mt-10 grid grid-cols-2 gap-6">
								<div className="rounded-xl border border-border bg-white/80 p-6 shadow-sm animate-fade-in-up animation-delay-600 transition-all duration-300 hover:scale-105 hover:shadow-lg">
									<p className="text-3xl font-bold text-primary animate-count-up">
										98%
									</p>
									<p className="text-sm text-muted-foreground">
										Entregas a tiempo reportadas por clientes corporativos 2023.
									</p>
								</div>
								<div className="rounded-xl border border-border bg-white/80 p-6 shadow-sm animate-fade-in-up animation-delay-800 transition-all duration-300 hover:scale-105 hover:shadow-lg">
									<p className="text-3xl font-bold text-primary animate-count-up">
										+1.200
									</p>
									<p className="text-sm text-muted-foreground">
										Viajes y fletes coordinados en los últimos 18 meses para
										pymes y grandes cuentas.
									</p>
								</div>
							</div>
						</div>
						<div className="relative animate-slide-in-right">
							<div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent rounded-3xl blur-3xl opacity-40 animate-pulse" />
							<img
								src={camionford}
								alt="Camión de referencia para fletes"
								className="relative w-full rounded-3xl shadow-2xl border border-transparent transition-transform duration-500 hover:scale-105"
								loading="lazy"
								decoding="async"
							/>
						</div>
					</div>
				</section>

				<section className="py-20">
					<div className="container mx-auto px-4">
						<h2 className="text-3xl font-semibold text-center">
							Por qué las empresas eligen nuestro servicio de fletes
						</h2>
						<p className="mt-4 text-center text-muted-foreground max-w-2xl mx-auto">
							Solucionamos la logística para industrias, comercios y proveedores
							que necesitan transportar carga con trazabilidad y soporte humano
							en cada tramo.
						</p>
						<div className="mt-12 grid gap-8 md:grid-cols-3">
							{sellingPoints.map(
								({ icon: Icon, title, description }, index) => (
									<Card
										key={title}
										className={`border-border/60 animate-fade-in-up transition-all duration-300 hover:scale-105 hover:shadow-lg`}
										style={{ animationDelay: `${index * 0.2}s` }}
									>
										<CardHeader>
											<div className="flex items-center gap-3">
												<span className="rounded-full bg-primary/10 p-3 text-primary">
													<Icon className="h-6 w-6" />
												</span>
												<CardTitle className="text-xl">{title}</CardTitle>
											</div>
										</CardHeader>
										<CardContent>
											<p className="text-muted-foreground">{description}</p>
										</CardContent>
									</Card>
								)
							)}
						</div>
						<div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
							{trustSignals.map((item) => (
								<div key={item} className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-primary" />
									<span>{item}</span>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="bg-gray-50 py-20">
					<div className="container mx-auto px-4">
						<div className="grid gap-10 lg:grid-cols-2">
							<div>
								<h2 className="text-3xl font-semibold">
									Desde la Araucanía al resto del país, con inteligencia
									logística
								</h2>
								<p className="mt-4 text-muted-foreground">
									Somos la unidad especializada de Transportes Araucaria para
									fletes nacionales. Administramos rutas recurrentes hacia
									Santiago, Biobío, Los Lagos, Tarapacá y más, con tarifas
									eficientes y coordinación directa con tus centros de
									distribución.
								</p>
								<ul className="mt-6 space-y-4">
									<li className="flex items-start gap-3">
										<Phone className="h-5 w-5 text-primary mt-1" />
										<span>
											Equipo comercial dedicado y línea directa para
											contingencias 24/7.
										</span>
									</li>
									<li className="flex items-start gap-3">
										<Truck className="h-5 w-5 text-primary mt-1" />
										<span>
											Camiones, camionetas cerradas y vehículos refrigerados
											según necesidad.
										</span>
									</li>
									<li className="flex items-start gap-3">
										<ShieldCheck className="h-5 w-5 text-primary mt-1" />
										<span>
											Protocolos de seguridad, cobertura de seguro y checklists
											digitales en cada carga.
										</span>
									</li>
								</ul>
							</div>
							<div className="rounded-3xl border border-dashed border-primary/40 bg-white p-8 shadow-sm">
								<h3 className="text-2xl font-semibold">
									Cómo trabajamos tu solicitud
								</h3>
								<div className="mt-8 space-y-6">
									{workflow.map(({ title, description }, index) => (
										<div key={title} className="flex gap-4">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
												{index + 1}
											</div>
											<div>
												<p className="font-semibold">{title}</p>
												<p className="text-sm text-muted-foreground">
													{description}
												</p>
											</div>
										</div>
									))}
								</div>
								<div className="mt-8 rounded-2xl border-2 border-primary/60 bg-primary/10 px-6 py-4 text-sm text-primary shadow-lg">
									<span className="font-bold text-primary">
										¿Necesitas disponibilidad hoy mismo?
									</span>{" "}
									<span className="text-primary/80">
										Escríbenos por WhatsApp para activar el plan de contingencia
										y salida inmediata.
									</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section id="cotizar" className="py-20">
					<div className="container mx-auto px-4">
						<div className="grid gap-10 lg:grid-cols-5">
							<div className="lg:col-span-2">
								<h2 className="text-3xl font-semibold">
									Obtén una cotización rápida
								</h2>
								<p className="mt-4 text-muted-foreground">
									Completa el formulario y uno de nuestros ejecutivos de
									logística te contactará en menos de 15 minutos para coordinar
									el retiro.
								</p>
								<div className="mt-6 space-y-4 text-sm text-muted-foreground">
									<p className="flex items-center gap-3">
										<Phone className="h-4 w-4 text-primary" />
										<span>+56 9 3664 3540 logística 24/7</span>
									</p>
									<a
										href={whatsappMessage}
										target="_blank"
										rel="noopener noreferrer"
										onClick={() => trackWhatsAppClick({ value: 1 })}
										className="flex items-center gap-3 text-primary hover:underline"
									>
										<MessageCircle className="h-4 w-4" />
										<span>Chat inmediato por WhatsApp</span>
									</a>
								</div>
							</div>
							<div className="lg:col-span-3 animate-fade-in-up animation-delay-400">
								<Card className="shadow-xl border-border/60 transition-all duration-300 hover:shadow-2xl">
									<CardHeader>
										<CardTitle>Formulario de fletes</CardTitle>
										<CardDescription>
											InformaciÃ³n clave para generar una propuesta a medida.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<form onSubmit={handleSubmit} className="grid gap-4">
											<div className="grid gap-4 md:grid-cols-2">
												<div>
													<label className="text-sm font-medium">
														Nombre y apellido *
													</label>
													<Input
														required
														name="nombre"
														value={formData.nombre}
														onChange={handleChange}
														placeholder="Ej. Carolina Mella"
													/>
												</div>
												<div>
													<label className="text-sm font-medium">
														Empresa (opcional)
													</label>
													<Input
														name="empresa"
														value={formData.empresa}
														onChange={handleChange}
														placeholder="Nombre de la empresa"
													/>
												</div>
											</div>
											<div className="grid gap-4 md:grid-cols-2">
												<div>
													<label className="text-sm font-medium">
														Correo electrónico *
													</label>
													<Input
														type="email"
														name="email"
														required
														value={formData.email}
														onChange={handleChange}
														placeholder="correo@empresa.cl"
													/>
												</div>
												<div>
													<label className="text-sm font-medium">
														Teléfono de contacto *
													</label>
													<Input
														type="tel"
														name="telefono"
														required
														value={formData.telefono}
														onChange={handleChange}
														placeholder="Ej. +56 9 1234 5678"
													/>
												</div>
											</div>
											<div className="grid gap-4 md:grid-cols-2">
												<div>
													<label className="text-sm font-medium">
														Origen en La Araucanía *
													</label>
													<Input
														name="origen"
														required
														value={formData.origen}
														onChange={handleChange}
														placeholder="Ciudad o punto de retiro"
													/>
												</div>
												<div>
													<label className="text-sm font-medium">
														Destino en Chile *
													</label>
													<Input
														name="destino"
														required
														value={formData.destino}
														onChange={handleChange}
														placeholder="Ciudad o dirección de entrega"
													/>
												</div>
											</div>
											<div className="grid gap-4 md:grid-cols-2">
												<div>
													<label className="text-sm font-medium">
														Fecha estimada
													</label>
													<Input
														type="date"
														name="fecha"
														value={formData.fecha}
														onChange={handleChange}
													/>
												</div>
												<div>
													<label className="text-sm font-medium">
														Tipo de carga
													</label>
													<Input
														name="tipoCarga"
														value={formData.tipoCarga}
														onChange={handleChange}
														placeholder="Ej. pallets, maquinaria, refrigerados"
													/>
												</div>
											</div>
											<div>
												<label className="text-sm font-medium">
													Volumen o peso estimado
												</label>
												<Input
													name="volumen"
													value={formData.volumen}
													onChange={handleChange}
													placeholder="Ej. 12 pallets, 4 toneladas"
												/>
											</div>
											<div>
												<label className="text-sm font-medium">
													Notas adicionales
												</label>
												<Textarea
													name="mensaje"
													rows={4}
													value={formData.mensaje}
													onChange={handleChange}
													placeholder="Restricciones de horario, documentos, referencias, etc."
												/>
											</div>
											{feedback && (
												<div className={feedbackClassName}>
													{feedback.message}
												</div>
											)}
											<Button
												type="submit"
												className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg focus-visible:ring-primary/30"
												size="lg"
												disabled={isSubmitting}
											>
												{isSubmitting
													? "Enviando solicitud..."
													: "Solicitar cotización"}
											</Button>
										</form>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</section>
			</main>

			<section className="bg-primary text-primary-foreground py-16 text-center">
				<div className="container mx-auto px-4 max-w-3xl">
					<h2 className="text-3xl font-semibold">
						Listos para movilizar tu carga desde la Araucanía
					</h2>
					<p className="mt-4 text-primary-foreground/90">
						Optimiza tus campañas de Google Ads dirigiendo a tus prospectos a
						esta landing especializada y convierte visitas en clientes
						fidelizados.
					</p>
					<div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
						<a
							href={whatsappMessage}
							target="_blank"
							rel="noopener noreferrer"
							onClick={() => trackWhatsAppClick({ value: 1 })}
						>
							<Button
								size="lg"
								className="bg-white text-primary hover:bg-primary/10 shadow-lg border-2 border-primary/20 focus-visible:ring-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl"
							>
								<MessageCircle className="h-5 w-5 mr-2" />
								Conversar por WhatsApp
							</Button>
						</a>
						<a href="#cotizar">
							<Button
								size="lg"
								variant="outline"
								className="border-2 border-white text-primary hover:bg-white/10 focus-visible:ring-white/30 shadow-lg bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl"
							>
								Completar formulario
							</Button>
						</a>
					</div>
				</div>
			</section>
		</div>
	);
}

export default FletesLanding;
