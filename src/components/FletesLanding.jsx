import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Truck, MapPin, Clock, Shield, CheckCircle, Phone, Mail } from "lucide-react";

// Función para tracking de conversión de WhatsApp
const trackWhatsAppClick = () => {
	if (typeof gtag === "function") {
		gtag("event", "conversion", {
			send_to: "AW-17529712870/M7-iCN_HtZUbEObh6KZB",
		});
		console.log("Conversión de clic en WhatsApp (Fletes) enviada.");
	}
};

function FletesLanding() {
	const [formData, setFormData] = useState({
		nombre: "",
		telefono: "",
		email: "",
		origen: "",
		destino: "",
		tipoCarga: "",
		peso: "",
		dimensiones: "",
		fechaRecogida: "",
		observaciones: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	// Optimización SEO y Google Ads
	useEffect(() => {
		// Actualizar meta tags para SEO
		document.title = "Fletes desde La Araucanía - Transporte de Carga a Todo Chile | Transportes Araucaria";
		
		// Meta description optimizada para Google Ads
		const metaDescription = document.querySelector('meta[name="description"]');
		if (metaDescription) {
			metaDescription.setAttribute('content', 'Servicio de fletes desde La Araucanía a todo Chile. Transporte seguro de carga, envíos nacionales, cotización inmediata. ¡Contáctanos por WhatsApp!');
		} else {
			const meta = document.createElement('meta');
			meta.name = 'description';
			meta.content = 'Servicio de fletes desde La Araucanía a todo Chile. Transporte seguro de carga, envíos nacionales, cotización inmediata. ¡Contáctanos por WhatsApp!';
			document.head.appendChild(meta);
		}

		// Structured Data para Google
		const structuredData = {
			"@context": "https://schema.org",
			"@type": "LocalBusiness",
			"name": "Transportes Araucaria - Servicios de Fletes",
			"description": "Servicio de fletes y transporte de carga desde La Araucanía a todo Chile",
			"url": "https://www.transportesaraucaria.cl/fletes",
			"telephone": "+56936643540",
			"address": {
				"@type": "PostalAddress",
				"addressLocality": "Temuco",
				"addressRegion": "La Araucanía",
				"addressCountry": "Chile"
			},
			"serviceArea": {
				"@type": "Country",
				"name": "Chile"
			},
			"hasOfferCatalog": {
				"@type": "OfferCatalog",
				"name": "Servicios de Fletes",
				"itemListElement": [
					{
						"@type": "Offer",
						"itemOffered": {
							"@type": "Service",
							"name": "Fletes Nacionales",
							"description": "Transporte de carga desde La Araucanía a todo Chile"
						}
					}
				]
			}
		};

		// Agregar structured data al DOM
		const script = document.createElement('script');
		script.type = 'application/ld+json';
		script.textContent = JSON.stringify(structuredData);
		document.head.appendChild(script);

		// Tracking de página vista para Google Ads
		if (typeof gtag === "function") {
			gtag('config', 'GA_MEASUREMENT_ID', {
				page_title: 'Fletes desde La Araucanía',
				page_location: window.location.href
			});
		}

		return () => {
			// Cleanup
			const existingScript = document.querySelector('script[type="application/ld+json"]');
			if (existingScript) {
				document.head.removeChild(existingScript);
			}
		};
	}, []);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Enviar datos al backend
			const response = await fetch("https://www.transportesaraucaria.cl/enviar_correo_mejorado.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					tipo: "fletes",
					source: "formulario-fletes"
				}),
			});

			if (response.ok) {
				setShowSuccess(true);
				setFormData({
					nombre: "",
					telefono: "",
					email: "",
					origen: "",
					destino: "",
					tipoCarga: "",
					peso: "",
					dimensiones: "",
					fechaRecogida: "",
					observaciones: "",
				});
			}
		} catch (error) {
			console.error("Error al enviar formulario:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const serviciosFletes = [
		{
			icon: <Truck className="h-8 w-8 text-blue-600" />,
			title: "Fletes Nacionales",
			description: "Transporte de carga desde La Araucanía a todo Chile",
			features: ["Cobertura nacional", "Seguimiento en tiempo real", "Seguro incluido"]
		},
		{
			icon: <Shield className="h-8 w-8 text-green-600" />,
			title: "Carga Segura",
			description: "Manejo especializado de mercancías delicadas",
			features: ["Embalaje profesional", "Manejo cuidadoso", "Documentación completa"]
		},
		{
			icon: <Clock className="h-8 w-8 text-orange-600" />,
			title: "Entrega Rápida",
			description: "Servicios express y programados",
			features: ["Entrega en 24-48h", "Programación flexible", "Confirmación previa"]
		}
	];

	const destinosPrincipales = [
		"Santiago", "Valparaíso", "Concepción", "Antofagasta", 
		"Temuco", "Valdivia", "Puerto Montt", "Iquique"
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			{/* Hero Section - Optimizado para Google Ads */}
			<section className="relative py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center">
						<h1 className="text-4xl md:text-6xl font-bold mb-6">
							Fletes desde La Araucanía a Todo Chile
						</h1>
						<p className="text-xl md:text-2xl mb-8 text-blue-100">
							🚛 Transporte de carga seguro y confiable. Envíos nacionales desde Temuco, Villarrica, Pucón y toda La Araucanía
						</p>
						<div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
							<p className="text-lg font-semibold mb-2">✅ Servicios Disponibles:</p>
							<div className="flex flex-wrap justify-center gap-4 text-sm">
								<span className="bg-white/20 px-3 py-1 rounded-full">Fletes Santiago</span>
								<span className="bg-white/20 px-3 py-1 rounded-full">Fletes Valparaíso</span>
								<span className="bg-white/20 px-3 py-1 rounded-full">Fletes Concepción</span>
								<span className="bg-white/20 px-3 py-1 rounded-full">Fletes Antofagasta</span>
								<span className="bg-white/20 px-3 py-1 rounded-full">Fletes Puerto Montt</span>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button 
								size="lg" 
								className="bg-white text-blue-600 hover:bg-blue-50 text-lg font-semibold px-8 py-4 border-2 border-white"
								onClick={() => document.getElementById('formulario-fletes').scrollIntoView({ behavior: 'smooth' })}
							>
								📋 Cotizar Flete Gratis
							</Button>
							<Button 
								size="lg" 
								variant="outline" 
								className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg font-semibold px-8 py-4 bg-transparent"
								onClick={trackWhatsAppClick}
							>
								<MessageCircle className="h-5 w-5 mr-2" />
								WhatsApp +56 9 3664 3540
							</Button>
						</div>
						<p className="text-sm mt-4 text-blue-200">
							💬 Respuesta en menos de 2 horas | 🚚 Seguimiento en tiempo real | 🛡️ Seguro incluido
						</p>
					</div>
				</div>
			</section>

			{/* Servicios */}
			<section className="py-16 bg-white">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Nuestros Servicios de Fletes
						</h2>
						<p className="text-xl text-gray-600">
							Soluciones de transporte adaptadas a tus necesidades
						</p>
					</div>
					
					<div className="grid md:grid-cols-3 gap-8">
						{serviciosFletes.map((servicio, index) => (
							<Card key={index} className="text-center hover:shadow-lg transition-shadow">
								<CardHeader>
									<div className="flex justify-center mb-4">
										{servicio.icon}
									</div>
									<CardTitle className="text-xl">{servicio.title}</CardTitle>
									<CardDescription className="text-base">
										{servicio.description}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<ul className="space-y-2">
										{servicio.features.map((feature, idx) => (
											<li key={idx} className="flex items-center text-sm text-gray-600">
												<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
												{feature}
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Destinos */}
			<section className="py-16 bg-gray-50">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Destinos Principales
						</h2>
						<p className="text-xl text-gray-600">
							Llevamos tu carga a las principales ciudades de Chile
						</p>
					</div>
					
					<div className="flex flex-wrap justify-center gap-3">
						{destinosPrincipales.map((destino, index) => (
							<Badge key={index} variant="secondary" className="px-4 py-2 text-base bg-blue-100 text-blue-800 border border-blue-200">
								<MapPin className="h-4 w-4 mr-2" />
								{destino}
							</Badge>
						))}
					</div>
				</div>
			</section>

			{/* Formulario de Contacto */}
			<section id="formulario-fletes" className="py-16 bg-white">
				<div className="container mx-auto px-4">
					<div className="max-w-2xl mx-auto">
						<div className="text-center mb-8">
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
								Solicita tu Cotización
							</h2>
							<p className="text-xl text-gray-600">
								Completa el formulario y te contactaremos en menos de 2 horas
							</p>
						</div>

						{showSuccess ? (
							<Card className="text-center py-8">
								<CardContent>
									<CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
									<h3 className="text-2xl font-bold text-gray-900 mb-2">
										¡Solicitud Enviada!
									</h3>
									<p className="text-gray-600 mb-4">
										Hemos recibido tu solicitud. Te contactaremos pronto.
									</p>
									<Button 
										onClick={() => setShowSuccess(false)}
										className="bg-blue-600 hover:bg-blue-700 text-white"
									>
										Enviar Otra Solicitud
									</Button>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardHeader>
									<CardTitle>Información del Flete</CardTitle>
									<CardDescription>
										Proporciona los detalles de tu carga para una cotización precisa
									</CardDescription>
								</CardHeader>
								<CardContent>
									<form onSubmit={handleSubmit} className="space-y-6">
										<div className="grid md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Nombre Completo *
												</label>
												<Input
													name="nombre"
													value={formData.nombre}
													onChange={handleInputChange}
													required
													placeholder="Tu nombre completo"
													className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Teléfono *
												</label>
												<Input
													name="telefono"
													value={formData.telefono}
													onChange={handleInputChange}
													required
													placeholder="+56 9 1234 5678"
													type="tel"
													className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
												/>
											</div>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Email
											</label>
											<Input
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												type="email"
												placeholder="tu@email.com"
												className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
											/>
										</div>

										<div className="grid md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Origen *
												</label>
												<Input
													name="origen"
													value={formData.origen}
													onChange={handleInputChange}
													required
													placeholder="Ciudad de origen"
													className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Destino *
												</label>
												<Input
													name="destino"
													value={formData.destino}
													onChange={handleInputChange}
													required
													placeholder="Ciudad de destino"
													className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
												/>
											</div>
										</div>

										<div className="grid md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Tipo de Carga *
												</label>
												<Input
													name="tipoCarga"
													value={formData.tipoCarga}
													onChange={handleInputChange}
													required
													placeholder="Ej: Muebles, equipos, documentos"
													className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Peso Aproximado
												</label>
												<Input
													name="peso"
													value={formData.peso}
													onChange={handleInputChange}
													placeholder="Ej: 50 kg, 200 kg"
													className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
												/>
											</div>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Dimensiones
											</label>
											<Input
												name="dimensiones"
												value={formData.dimensiones}
												onChange={handleInputChange}
												placeholder="Ej: 100x50x30 cm"
												className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Fecha de Recogida Deseada
											</label>
											<Input
												name="fechaRecogida"
												value={formData.fechaRecogida}
												onChange={handleInputChange}
												type="date"
												className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Observaciones Adicionales
											</label>
											<Textarea
												name="observaciones"
												value={formData.observaciones}
												onChange={handleInputChange}
												placeholder="Información adicional sobre la carga, requisitos especiales, etc."
												rows={4}
												className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
											/>
										</div>

										<div className="flex flex-col sm:flex-row gap-4">
											<Button 
												type="submit" 
												className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
												disabled={isSubmitting}
											>
												{isSubmitting ? "Enviando..." : "Solicitar Cotización"}
											</Button>
											<Button 
												type="button" 
												variant="outline" 
												className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-3"
												onClick={trackWhatsAppClick}
											>
												<MessageCircle className="h-4 w-4 mr-2" />
												WhatsApp
											</Button>
										</div>
									</form>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</section>

			{/* Beneficios y Garantías */}
			<section className="py-16 bg-gray-50">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							¿Por Qué Elegirnos para tus Fletes?
						</h2>
						<p className="text-xl text-gray-600">
							Más de 5 años transportando carga desde La Araucanía
						</p>
					</div>
					
					<div className="grid md:grid-cols-3 gap-8">
						<Card className="text-center">
							<CardContent className="pt-6">
								<Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
								<h3 className="text-xl font-bold mb-2">Seguro Total</h3>
								<p className="text-gray-600">Cobertura completa para tu carga. Tranquilidad garantizada.</p>
							</CardContent>
						</Card>
						
						<Card className="text-center">
							<CardContent className="pt-6">
								<Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
								<h3 className="text-xl font-bold mb-2">Entrega Puntual</h3>
								<p className="text-gray-600">Cumplimos con los tiempos acordados. Confiabilidad al 100%.</p>
							</CardContent>
						</Card>
						
						<Card className="text-center">
							<CardContent className="pt-6">
								<MapPin className="h-12 w-12 text-orange-600 mx-auto mb-4" />
								<h3 className="text-xl font-bold mb-2">Cobertura Nacional</h3>
								<p className="text-gray-600">Llevamos tu carga a cualquier ciudad de Chile.</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Testimonios */}
			<section className="py-16 bg-white">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Lo Que Dicen Nuestros Clientes
						</h2>
						<p className="text-xl text-gray-600">
							Clientes satisfechos con nuestros servicios de fletes
						</p>
					</div>
					
					<div className="grid md:grid-cols-3 gap-8">
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center mb-4">
									<div className="flex text-yellow-400">
										{"★".repeat(5)}
									</div>
								</div>
								<p className="text-gray-600 mb-4">
									"Excelente servicio. Envié muebles desde Temuco a Santiago y llegaron perfectos. Muy recomendable."
								</p>
								<div className="font-semibold">María González</div>
								<div className="text-sm text-gray-500">Temuco</div>
							</CardContent>
						</Card>
						
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center mb-4">
									<div className="flex text-yellow-400">
										{"★".repeat(5)}
									</div>
								</div>
								<p className="text-gray-600 mb-4">
									"Rápido, seguro y económico. La mejor opción para fletes desde La Araucanía."
								</p>
								<div className="font-semibold">Carlos Rodríguez</div>
								<div className="text-sm text-gray-500">Villarrica</div>
							</CardContent>
						</Card>
						
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center mb-4">
									<div className="flex text-yellow-400">
										{"★".repeat(5)}
									</div>
								</div>
								<p className="text-gray-600 mb-4">
									"Profesionales y confiables. Siempre uso sus servicios para mis envíos de negocio."
								</p>
								<div className="font-semibold">Ana Martínez</div>
								<div className="text-sm text-gray-500">Pucón</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Contacto Directo - Optimizado para Conversión */}
			<section className="py-16 bg-blue-600 text-white">
				<div className="container mx-auto px-4 text-center">
					<h2 className="text-3xl md:text-4xl font-bold mb-6">
						🚛 ¿Necesitas una Cotización Inmediata?
					</h2>
					<p className="text-xl mb-8 text-blue-100">
						Contáctanos ahora y obtén tu cotización en menos de 2 horas
					</p>
					<div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8">
						<div className="grid md:grid-cols-2 gap-6 text-left">
							<div>
								<h3 className="text-lg font-semibold mb-3">📞 Contacto Directo</h3>
								<p className="mb-2">WhatsApp: +56 9 3664 3540</p>
								<p className="mb-2">Teléfono: +56 9 3664 3540</p>
								<p className="text-sm text-blue-200">Disponible de Lunes a Viernes 8:00 - 18:00</p>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-3">⚡ Respuesta Rápida</h3>
								<p className="mb-2">✅ Cotización en 2 horas</p>
								<p className="mb-2">✅ Seguimiento en tiempo real</p>
								<p className="mb-2">✅ Seguro incluido</p>
							</div>
						</div>
					</div>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button 
							size="lg" 
							className="bg-white text-blue-600 hover:bg-blue-50 text-lg font-semibold px-8 py-4 border-2 border-white"
							onClick={trackWhatsAppClick}
						>
							<MessageCircle className="h-5 w-5 mr-2" />
							WhatsApp: +56 9 3664 3540
						</Button>
						<Button 
							size="lg" 
							variant="outline" 
							className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg font-semibold px-8 py-4 bg-transparent"
						>
							<Phone className="h-5 w-5 mr-2" />
							Llamar Ahora
						</Button>
					</div>
					<p className="text-sm mt-4 text-blue-200">
						💬 También puedes usar el formulario de arriba para una cotización detallada
					</p>
				</div>
			</section>
		</div>
	);
}

export default FletesLanding;