import "./App.css";
import { useState, useEffect, useMemo } from "react";
import { Button } from "./components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./components/ui/alert-dialog";
import {
	Phone,
	Mail,
	MapPin,
	Clock,
	Users,
	Shield,
	Star,
	Car,
	Plane,
	CheckCircle,
	MessageCircle,
	LoaderCircle,
} from "lucide-react";

// Importar imágenes
import heroVan from "./assets/hero-van.png";
import temucoImg from "./assets/temuco.jpg";
import villarricaImg from "./assets/villarrica.jpg";
import puconImg from "./assets/pucon.jpg";
import logo from "./assets/logo.png";
import logoblanco from "./assets/logoblanco.png";

// --- Estructura de datos con porcentaje de pasajero adicional al 5% ---
const destinos = [
	{
		nombre: "Temuco",
		descripcion: "Centro comercial y administrativo de La Araucanía.",
		tiempo: "45 min",
		imagen: temucoImg,
		maxPasajeros: 4,
		minHorasAnticipacion: 15,
		descuento: {
			porcentaje: 0.2,
			titulo: "¡Descuento Especial para tu Viaje a Temuco!",
			descripcion:
				"Si pagas por transferencia bancaria la totalidad del viaje, obtienes un 20% de descuento.",
			botonTexto: "Coordinar por WhatsApp",
			link: "https://wa.me/56936643540?text=Hola,%20quisiera%20pagar%20mi%20reserva%20a%20Temuco%20con%20descuento%20por%20transferencia.",
			requiereAbonoTotal: true,
		},
		precios: {
			sedan: { base: 20000, porcentajeAdicional: 0.1 },
		},
	},
	{
		nombre: "Villarrica",
		descripcion: "Turismo y naturaleza junto al lago.",
		tiempo: "1h 15min",
		imagen: villarricaImg,
		maxPasajeros: 7,
		minHorasAnticipacion: 24,
		descuento: {
			porcentaje: 0.1,
			titulo: "¡Paga Online y Ahorra en tu Viaje a Villarrica!",
			descripcion:
				"Paga ahora a través de Mercado Pago y obtén un 10% de descuento en tu reserva.",
			botonTexto: "Pagar con Mercado Pago",
			link: "https://link.mercadopago.cl/transportearaucaria",
			requiereAbonoTotal: false,
		},
		precios: {
			sedan: { base: 50000, porcentajeAdicional: 0.05 },
			van: { base: 200000, porcentajeAdicional: 0.05 },
		},
	},
	{
		nombre: "Pucón",
		descripcion: "Aventura, termas y volcán.",
		tiempo: "1h 30min",
		imagen: puconImg,
		maxPasajeros: 7,
		minHorasAnticipacion: 24,
		descuento: {
			porcentaje: 0.1,
			titulo: "¡Paga Online y Ahorra en tu Viaje a Pucón!",
			descripcion:
				"Paga ahora a través de Mercado Pago y obtén un 10% de descuento en tu reserva.",
			botonTexto: "Pagar con Mercado Pago",
			link: "https://link.mercadopago.cl/transportearaucaria",
			requiereAbonoTotal: false,
		},
		precios: {
			sedan: { base: 60000, porcentajeAdicional: 0.05 },
			van: { base: 250000, porcentajeAdicional: 0.05 },
		},
	},
];

// --- LÓGICA DE CÁLCULO CORREGIDA ---
const calcularCotizacion = (destino, pasajeros) => {
	if (!destino || !pasajeros) {
		return { precio: null, vehiculo: null };
	}

	const numPasajeros = parseInt(pasajeros);
	let vehiculoAsignado;
	let precioFinal;

	if (numPasajeros > 0 && numPasajeros <= 4) {
		vehiculoAsignado = "Sedan 5 Puertas";
		const precios = destino.precios.sedan;
		if (!precios) return { precio: null, vehiculo: vehiculoAsignado };

		// CORRECCIÓN: El precio base es para 1 pasajero. Se suma el adicional a partir del segundo.
		const pasajerosAdicionales = numPasajeros - 1;
		const costoAdicional = precios.base * precios.porcentajeAdicional;
		precioFinal = precios.base + pasajerosAdicionales * costoAdicional;
	} else if (numPasajeros >= 5 && numPasajeros <= 7) {
		vehiculoAsignado = "Van de Pasajeros";
		const precios = destino.precios.van;
		if (!precios) return { precio: null, vehiculo: vehiculoAsignado };

		// El precio base de la Van es para 5 pasajeros. Se suma el adicional a partir del sexto.
		const pasajerosAdicionales = numPasajeros - 5;
		const costoAdicional = precios.base * precios.porcentajeAdicional;
		precioFinal = precios.base + pasajerosAdicionales * costoAdicional;
	} else {
		vehiculoAsignado = "Consultar disponibilidad";
		precioFinal = null;
	}

	return { precio: Math.round(precioFinal), vehiculo: vehiculoAsignado };
};

function App() {
	const [formData, setFormData] = useState({
		nombre: "",
		telefono: "",
		email: "",
		origen: "Aeropuerto La Araucanía",
		destino: "",
		fecha: "",
		hora: "",
		pasajeros: "1",
		mensaje: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showDiscountAlert, setShowDiscountAlert] = useState(false);
	const [alertContent, setAlertContent] = useState(null);
	const [phoneError, setPhoneError] = useState("");

	const cotizacion = useMemo(() => {
		const destinoSeleccionado = destinos.find(
			(d) => d.nombre === formData.destino
		);
		return calcularCotizacion(destinoSeleccionado, formData.pasajeros);
	}, [formData.destino, formData.pasajeros]);

	const validarTelefono = (telefono) => {
		const regex = /^(\+?56)?(\s?9)\s?(\d{4})\s?(\d{4})$/;
		return regex.test(telefono);
	};

	const validarHorarioReserva = () => {
		const destinoSeleccionado = destinos.find(
			(d) => d.nombre === formData.destino
		);
		if (!destinoSeleccionado || !formData.fecha || !formData.hora) {
			return {
				esValido: false,
				mensaje: "Por favor, completa la fecha y hora.",
			};
		}

		const ahora = new Date();
		const fechaReserva = new Date(`${formData.fecha}T${formData.hora}`);
		const horasDeDiferencia = (fechaReserva - ahora) / (1000 * 60 * 60);

		const { minHorasAnticipacion } = destinoSeleccionado;

		if (horasDeDiferencia < minHorasAnticipacion) {
			return {
				esValido: false,
				mensaje: `Para ${destinoSeleccionado.nombre}, por favor reserva con al menos ${minHorasAnticipacion} horas de anticipación.`,
			};
		}

		return { esValido: true, mensaje: "" };
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		if (name === "telefono") {
			setPhoneError("");
		}
	};

	useEffect(() => {
		const destinoSeleccionado = destinos.find(
			(d) => d.nombre === formData.destino
		);
		if (
			destinoSeleccionado &&
			parseInt(formData.pasajeros) > destinoSeleccionado.maxPasajeros
		) {
			setFormData((prev) => ({ ...prev, pasajeros: "1" }));
		}
	}, [formData.destino]);

	const resetForm = () => {
		setFormData({
			nombre: "",
			telefono: "",
			email: "",
			origen: "Aeropuerto La Araucanía",
			destino: "",
			fecha: "",
			hora: "",
			pasajeros: "1",
			mensaje: "",
		});
	};

	const handleCloseAlert = () => {
		setShowDiscountAlert(false);
		resetForm();
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validarTelefono(formData.telefono)) {
			setPhoneError(
				"Por favor, introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
			);
			return;
		}
		setPhoneError("");

		const validacion = validarHorarioReserva();
		if (!validacion.esValido) {
			alert(validacion.mensaje);
			return;
		}

		if (isSubmitting) return;
		setIsSubmitting(true);

		const dataToSend = {
			...formData,
			precio: cotizacion.precio,
			vehiculo: cotizacion.vehiculo,
			source: e.target.querySelector('input[name="nombre"]')
				? "Formulario de Contacto - Transportes Araucaria"
				: "Formulario Rápido (Hero)",
		};
		if (!dataToSend.nombre)
			dataToSend.nombre = "Cliente Potencial (Cotización Rápida)";

		const apiUrl =
			import.meta.env.VITE_API_URL ||
			"https://transportes-araucaria.onrender.com";

		try {
			const response = await fetch(`${apiUrl}/send-email`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSend),
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.message || "Error en el servidor.");
			}

			const destinoSeleccionado = destinos.find(
				(d) => d.nombre === dataToSend.destino
			);
			if (destinoSeleccionado && destinoSeleccionado.descuento) {
				setAlertContent({
					...destinoSeleccionado.descuento,
					precio: cotizacion.precio,
				});
				setShowDiscountAlert(true);
			} else {
				alert("¡Gracias por tu solicitud! Te contactaremos pronto.");
				resetForm();
			}

			if (typeof gtag === "function") {
				gtag("event", "conversion", {
					send_to: `AW-17529712870/8GVlCLP-05MbEObh6KZB`,
				});
			}
		} catch (error) {
			console.error("Error al enviar el formulario:", error);
			alert(`Error: ${error.message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const servicios = [
		{
			icono: <Car className="h-8 w-8" />,
			titulo: "Transfer Privado",
			descripcion: "Servicio exclusivo para ti y tu grupo",
		},
		{
			icono: <Users className="h-8 w-8" />,
			titulo: "Transfer Compartido",
			descripcion: "Opción económica compartiendo el viaje",
		},
		{
			icono: <Clock className="h-8 w-8" />,
			titulo: "Disponible 24/7",
			descripcion: "Servicio disponible todos los días del año",
		},
		{
			icono: <Shield className="h-8 w-8" />,
			titulo: "Seguro y Confiable",
			descripcion: "Vehículos modernos y conductores profesionales",
		},
	];

	const testimonios = [
		{
			nombre: "María González",
			comentario:
				"Excelente servicio, muy puntual y cómodo. El conductor fue muy amable.",
			calificacion: 5,
		},
		{
			nombre: "Carlos Rodríguez",
			comentario:
				"Perfecto para llegar a Pucón desde el aeropuerto. Lo recomiendo 100%.",
			calificacion: 5,
		},
		{
			nombre: "Ana Martínez",
			comentario:
				"Muy profesional, vehículo limpio y precio justo. Volveré a usar el servicio.",
			calificacion: 5,
		},
	];

	const maxPasajeros = useMemo(() => {
		const destino = destinos.find((d) => d.nombre === formData.destino);
		return destino?.maxPasajeros || 7;
	}, [formData.destino]);

	const minDateTime = useMemo(() => {
		const destino = destinos.find((d) => d.nombre === formData.destino);
		const horasAnticipacion = destino?.minHorasAnticipacion || 24;

		const fechaMinima = new Date();
		fechaMinima.setHours(fechaMinima.getHours() + horasAnticipacion);

		const anio = fechaMinima.getFullYear();
		const mes = String(fechaMinima.getMonth() + 1).padStart(2, "0");
		const dia = String(fechaMinima.getDate()).padStart(2, "0");

		return `${anio}-${mes}-${dia}`;
	}, [formData.destino]);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<AlertDialog open={showDiscountAlert} onOpenChange={setShowDiscountAlert}>
				{alertContent && (
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{alertContent.titulo}</AlertDialogTitle>
							<AlertDialogDescription>
								{alertContent.descripcion}
								<br />
								<br />
								Precio Normal: $
								{new Intl.NumberFormat("es-CL").format(alertContent.precio)} CLP
								<br />
								<strong className="text-primary text-lg">
									Precio con Descuento: $
									{new Intl.NumberFormat("es-CL").format(
										alertContent.precio * (1 - alertContent.porcentaje)
									)}{" "}
									CLP
								</strong>
								<br />
								<br />
								{!alertContent.requiereAbonoTotal ? (
									<strong className="text-foreground">
										Abono del 40% para reservar: $
										{new Intl.NumberFormat("es-CL").format(
											alertContent.precio * (1 - alertContent.porcentaje) * 0.4
										)}{" "}
										CLP
									</strong>
								) : (
									<strong className="text-foreground">
										Para acceder al descuento, se debe transferir el total.
									</strong>
								)}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel onClick={handleCloseAlert}>
								Cerrar
							</AlertDialogCancel>
							<AlertDialogAction asChild>
								<a
									href={alertContent.link}
									target="_blank"
									rel="noopener noreferrer"
								>
									{alertContent.botonTexto}
								</a>
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				)}
			</AlertDialog>

			{/* Header */}
			<header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
				<div className="container mx-auto px-4">
					<div className="flex justify-between items-center h-19">
						<div>
							<img
								src={logo}
								alt="Transportes Araucaria Logo"
								className="h-28"
							/>
						</div>
						<nav className="hidden md:flex space-x-6">
							<a
								href="#inicio"
								className="text-foreground hover:text-primary transition-colors"
							>
								Inicio
							</a>
							<a
								href="#servicios"
								className="text-foreground hover:text-primary transition-colors"
							>
								Servicios
							</a>
							<a
								href="#destinos"
								className="text-foreground hover:text-primary transition-colors"
							>
								Destinos
							</a>
							<a
								href="#destinos"
								className="text-foreground hover:text-primary transition-colors"
							>
								Tarifas
							</a>
							<a
								href="#contacto"
								className="text-foreground hover:text-primary transition-colors"
							>
								Contacto
							</a>
						</nav>
						<div className="flex items-center space-x-4">
							<a
								href="tel:+56936643540"
								className="hidden md:flex items-center space-x-2 text-sm text-foreground hover:text-primary"
							>
								<Phone className="h-4 w-4" />
								<span>+56 9 3664 3540</span>
							</a>
							<a
								href="https://wa.me/56936643540"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Button>
									<MessageCircle className="h-4 w-4 mr-2" />
									WhatsApp
								</Button>
							</a>
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section
				id="inicio"
				className="relative bg-gradient-to-r from-primary to-secondary text-white py-24"
			>
				<div className="absolute inset-0 bg-black/30"></div>
				<div
					className="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style={{ backgroundImage: `url(${heroVan})` }}
				></div>
				<div className="relative container mx-auto px-4 text-center">
					<h2 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-down">
						Transfer Confiable desde
						<br />
						<span className="text-accent">Aeropuerto La Araucanía</span>
					</h2>
					<p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
						Traslados seguros y cómodos a Temuco, Villarrica y Pucón
					</p>

					{/* Formulario de reserva rápida */}
					<Card className="max-w-5xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl border">
						<CardHeader>
							<CardTitle className="text-foreground text-center text-2xl">
								Cotiza y Reserva tu Transfer
							</CardTitle>
						</CardHeader>
						<CardContent>
							<form
								onSubmit={handleSubmit}
								className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end"
							>
								<div className="text-left">
									<Label htmlFor="destino-hero">Destino</Label>
									<select
										id="destino-hero"
										name="destino"
										value={formData.destino}
										onChange={handleInputChange}
										className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary text-foreground"
										required
									>
										<option value="">Seleccionar</option>
										{destinos.map((d) => (
											<option key={d.nombre} value={d.nombre}>
												{d.nombre}
											</option>
										))}
									</select>
								</div>
								<div className="text-left">
									<Label htmlFor="pasajeros-hero">Pasajeros</Label>
									<select
										id="pasajeros-hero"
										name="pasajeros"
										value={formData.pasajeros}
										onChange={handleInputChange}
										className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary text-foreground"
										required
									>
										{[...Array(maxPasajeros)].map((_, i) => (
											<option key={i + 1} value={i + 1}>
												{i + 1} pasajero(s)
											</option>
										))}
									</select>
								</div>
								<div className="text-left">
									<Label htmlFor="fecha-hero">Fecha</Label>
									<Input
										id="fecha-hero"
										type="date"
										name="fecha"
										value={formData.fecha}
										onChange={handleInputChange}
										min={minDateTime}
										required
									/>
								</div>
								<div className="text-left">
									<Label htmlFor="hora-hero">Hora</Label>
									<Input
										id="hora-hero"
										type="time"
										name="hora"
										value={formData.hora}
										onChange={handleInputChange}
										required
									/>
								</div>
								<div className="text-left">
									<Label htmlFor="telefono-hero">Teléfono</Label>
									<Input
										id="telefono-hero"
										type="tel"
										name="telefono"
										placeholder="Ej: +569..."
										value={formData.telefono}
										onChange={handleInputChange}
										required
									/>
									{phoneError && (
										<p className="text-red-500 text-xs mt-1">{phoneError}</p>
									)}
								</div>
								<Button
									type="submit"
									className="w-full bg-accent hover:bg-accent/90 text-lg py-3"
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<>
											<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
											Enviando...
										</>
									) : (
										"Reservar"
									)}
								</Button>
							</form>
							{cotizacion.precio && (
								<div className="mt-4 p-4 bg-green-100 rounded-lg text-green-800 text-center transition-all duration-300 ease-in-out">
									<p className="font-bold">
										Precio Cotizado: $
										{new Intl.NumberFormat("es-CL").format(cotizacion.precio)}
									</p>
									<p>Vehículo Asignado: {cotizacion.vehiculo}</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Servicios */}
			<section id="servicios" className="py-20 bg-muted/40">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold mb-4">Nuestros Servicios</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Ofrecemos diferentes opciones de transporte para satisfacer tus
							necesidades
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
						{servicios.map((servicio, index) => (
							<Card
								key={index}
								className="text-center hover:shadow-xl transition-all duration-300 hover:scale-105"
							>
								<CardHeader>
									<div className="mx-auto text-primary mb-4">
										{servicio.icono}
									</div>
									<CardTitle className="text-xl">{servicio.titulo}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground">
										{servicio.descripcion}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Destinos */}
			<section id="destinos" className="py-20">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold mb-4">Principales Destinos</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Conectamos el aeropuerto con los destinos más populares de La
							Araucanía
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{destinos.map((destino, index) => (
							<Card
								key={index}
								className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col"
							>
								<div
									className="h-48 bg-cover bg-center"
									style={{ backgroundImage: `url(${destino.imagen})` }}
								></div>
								<CardHeader>
									<CardTitle className="flex justify-between items-center">
										{destino.nombre}
									</CardTitle>
									<CardDescription>{destino.descripcion}</CardDescription>
								</CardHeader>
								<CardContent className="flex-grow flex flex-col justify-between">
									<div>
										<p className="text-lg font-semibold text-primary mb-2">
											Desde $
											{new Intl.NumberFormat("es-CL").format(
												destino.precios.sedan.base
											)}{" "}
											CLP
										</p>
										<div className="flex justify-between items-center mb-4">
											<div className="flex items-center space-x-2">
												<Clock className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm">{destino.tiempo}</span>
											</div>
											<div className="flex items-center space-x-2">
												<Plane className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm">Desde aeropuerto</span>
											</div>
										</div>
									</div>
									<a href="#contacto">
										<Button className="w-full mt-2">Reservar Transfer</Button>
									</a>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* ¿Por qué elegirnos? */}
			<section className="py-20 bg-primary text-white">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold mb-4">
							¿Por qué elegir Transportes Araucaria?
						</h2>
						<p className="text-xl opacity-90 max-w-2xl mx-auto">
							Más de 10 años de experiencia brindando el mejor servicio de
							transfer en La Araucanía
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						<div className="flex items-start space-x-4">
							<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
							<div>
								<h3 className="text-xl font-semibold mb-2">
									Puntualidad Garantizada
								</h3>
								<p className="opacity-90">
									Llegamos siempre a tiempo para que no pierdas tu vuelo o
									conexión.
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
							<div>
								<h3 className="text-xl font-semibold mb-2">
									Vehículos Modernos
								</h3>
								<p className="opacity-90">
									Flota renovada con aire acondicionado, WiFi y máxima
									comodidad.
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
							<div>
								<h3 className="text-xl font-semibold mb-2">
									Conductores Profesionales
								</h3>
								<p className="opacity-90">
									Personal capacitado, con licencia profesional y conocimiento
									local.
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
							<div>
								<h3 className="text-xl font-semibold mb-2">
									Tarifas Competitivas
								</h3>
								<p className="opacity-90">
									Precios justos sin sorpresas, con descuentos para grupos.
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
							<div>
								<h3 className="text-xl font-semibold mb-2">Disponible 24/7</h3>
								<p className="opacity-90">
									Servicio disponible todos los días, adaptándonos a tu horario.
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
							<div>
								<h3 className="text-xl font-semibold mb-2">
									Seguimiento en Tiempo Real
								</h3>
								<p className="opacity-90">
									Monitoreo del vuelo y comunicación constante vía WhatsApp.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonios */}
			<section className="py-20 bg-muted/40">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold mb-4">
							Lo que dicen nuestros clientes
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Miles de pasajeros satisfechos respaldan nuestro servicio
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{testimonios.map((testimonio, index) => (
							<Card key={index} className="hover:shadow-lg transition-shadow">
								<CardHeader>
									<div className="flex items-center space-x-1 mb-2">
										{[...Array(testimonio.calificacion)].map((_, i) => (
											<Star
												key={i}
												className="h-5 w-5 fill-yellow-400 text-yellow-400"
											/>
										))}
									</div>
									<CardTitle className="text-lg">{testimonio.nombre}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground italic">
										"{testimonio.comentario}"
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Formulario de Contacto */}
			<section id="contacto" className="py-20">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold mb-4">Solicita tu Cotización</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Completa el formulario y te contactaremos en menos de 30 minutos
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
						<Card className="shadow-lg">
							<CardHeader>
								<CardTitle>Información de Contacto</CardTitle>
								<CardDescription>
									Estamos disponibles para atenderte las 24 horas del día
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center space-x-3">
									<Phone className="h-5 w-5 text-primary" />
									<div>
										<p className="font-semibold">Teléfono</p>
										<a
											href="tel:+56936643540"
											className="text-muted-foreground hover:text-primary"
										>
											+56 9 3664 3540
										</a>
									</div>
								</div>
								<div className="flex items-center space-x-3">
									<Mail className="h-5 w-5 text-primary" />
									<div>
										<p className="font-semibold">Email</p>
										<p className="text-muted-foreground">
											contacto@transportesaraucaria.cl
										</p>
									</div>
								</div>
								<div className="flex items-center space-x-3">
									<MapPin className="h-5 w-5 text-primary" />
									<div>
										<p className="font-semibold">Ubicación</p>
										<p className="text-muted-foreground">
											Temuco, Región de La Araucanía
										</p>
									</div>
								</div>
								<div className="flex items-center space-x-3">
									<Clock className="h-5 w-5 text-primary" />
									<div>
										<p className="font-semibold">Horarios</p>
										<p className="text-muted-foreground">Disponible 24/7</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="shadow-lg">
							<CardHeader>
								<CardTitle>Solicitar Cotización</CardTitle>
								<CardDescription>
									Completa tus datos y te enviaremos una cotización
									personalizada
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSubmit} className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<Label htmlFor="nombre">Nombre completo</Label>
											<Input
												name="nombre"
												value={formData.nombre}
												onChange={handleInputChange}
												required
											/>
										</div>
										<div>
											<Label htmlFor="telefono-form">Teléfono</Label>
											<Input
												id="telefono-form"
												name="telefono"
												value={formData.telefono}
												onChange={handleInputChange}
												required
											/>
											{phoneError && (
												<p className="text-red-500 text-xs mt-1">
													{phoneError}
												</p>
											)}
										</div>
									</div>
									<div>
										<Label htmlFor="email">Email</Label>
										<Input
											type="email"
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											required
										/>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<Label htmlFor="origen">Origen</Label>
											<Input
												name="origen"
												value={formData.origen}
												onChange={handleInputChange}
												required
											/>
										</div>
										<div>
											<Label htmlFor="destino-form">Destino</Label>
											<select
												id="destino-form"
												name="destino"
												value={formData.destino}
												onChange={handleInputChange}
												className="w-full p-2 border rounded-md"
												required
											>
												<option value="">Seleccionar destino</option>
												{destinos.map((d) => (
													<option key={d.nombre} value={d.nombre}>
														{d.nombre}
													</option>
												))}
												<option value="Otro">Otro destino</option>
											</select>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<Label htmlFor="fecha-form">Fecha</Label>
											<Input
												type="date"
												id="fecha-form"
												name="fecha"
												value={formData.fecha}
												onChange={handleInputChange}
												min={minDateTime}
												required
											/>
										</div>
										<div>
											<Label htmlFor="hora-form">Hora</Label>
											<Input
												type="time"
												id="hora-form"
												name="hora"
												value={formData.hora}
												onChange={handleInputChange}
												required
											/>
										</div>
									</div>
									<div>
										<Label htmlFor="pasajeros-form">Pasajeros</Label>
										<select
											id="pasajeros-form"
											name="pasajeros"
											value={formData.pasajeros}
											onChange={handleInputChange}
											className="w-full p-2 border rounded-md"
										>
											{[...Array(maxPasajeros)].map((_, i) => (
												<option key={i + 1} value={i + 1}>
													{i + 1} pasajero(s)
												</option>
											))}
										</select>
									</div>
									{cotizacion.precio && (
										<div className="p-4 bg-blue-100 rounded-lg text-blue-800 text-center transition-all duration-300 ease-in-out">
											<div className="flex justify-center items-center gap-4">
												<div>
													<p className="font-semibold">Precio Total:</p>
													<p className="text-2xl font-bold">
														$
														{new Intl.NumberFormat("es-CL").format(
															cotizacion.precio
														)}
													</p>
												</div>
												<div className="border-l-2 border-blue-300 h-12"></div>
												<div>
													<p className="font-semibold">Vehículo:</p>
													<p className="text-lg font-bold">
														{cotizacion.vehiculo}
													</p>
												</div>
											</div>
										</div>
									)}
									<div>
										<Label htmlFor="mensaje">
											Mensaje adicional (opcional)
										</Label>
										<Textarea
											name="mensaje"
											value={formData.mensaje}
											onChange={handleInputChange}
											placeholder="Cuéntanos sobre equipaje especial, necesidades particulares, etc."
										/>
									</div>
									<Button
										type="submit"
										className="w-full bg-primary hover:bg-primary/90"
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<>
												<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
												Enviando Solicitud...
											</>
										) : (
											"Enviar Solicitud"
										)}
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-primary text-white py-12">
				<div className="container mx-auto px-4">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div>
							<div>
								<img
									src={logoblanco}
									alt="Transportes Araucaria Logo"
									className="h-26 mb-4"
								/>
							</div>
							<p className="opacity-90 mb-4">
								Tu mejor opción para traslados desde el Aeropuerto La Araucanía
								hacia toda la región.
							</p>
							<div className="flex space-x-4">
								<Button
									variant="outline"
									size="sm"
									className="text-white border-white hover:bg-white hover:text-primary"
								>
									Facebook
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="text-white border-white hover:bg-white hover:text-primary"
								>
									Instagram
								</Button>
							</div>
						</div>

						<div>
							<h4 className="text-lg font-semibold mb-4">Servicios</h4>
							<ul className="space-y-2 opacity-90">
								<li>Transfer Aeropuerto - Temuco</li>
								<li>Transfer Aeropuerto - Villarrica</li>
								<li>Transfer Aeropuerto - Pucón</li>
								<li>Tours personalizados</li>
								<li>Traslados empresariales</li>
							</ul>
						</div>

						<div>
							<h4 className="text-lg font-semibold mb-4">Destinos</h4>
							<ul className="space-y-2 opacity-90">
								<li>Temuco Centro</li>
								<li>Villarrica</li>
								<li>Pucón</li>
								<li>Lican Ray</li>
								<li>Curarrehue</li>
							</ul>
						</div>

						<div>
							<h4 className="text-lg font-semibold mb-4">Contacto</h4>
							<div className="space-y-2 opacity-90">
								<p>
									<a href="tel:+56936643540" className="hover:underline">
										+56 9 3664 3540
									</a>
								</p>
								<p>contacto@transportesaraucaria.cl</p>
								<p>Temuco, La Araucanía</p>
								<p>Disponible 24/7</p>
							</div>
						</div>
					</div>

					<div className="border-t border-white/20 mt-8 pt-8 text-center opacity-90">
						<p>
							&copy; 2024 Transportes Araucaria. Todos los derechos reservados.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default App;
