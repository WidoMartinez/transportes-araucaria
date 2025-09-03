import "./App.css";
import { useState } from "react";
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
} from "lucide-react";

// Importar imágenes
import heroVan from "./assets/hero-van.png";
import temucoImg from "./assets/temuco.jpg";
import villarricaImg from "./assets/villarrica.jpg";
import puconImg from "./assets/pucon.jpg";

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

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Identifica si el formulario es el del 'hero' (no tiene campo de nombre)
		const isHeroForm = !e.target.querySelector('input[name="nombre"]');

		const dataToSend = {
			...formData,
			source: isHeroForm
				? "Formulario Rápido (Hero)"
				: "Formulario de Contacto - Transportes Araucaria",
		};

		// Para el formulario del hero, el nombre no es requerido, pero lo seteamos para el backend
		if (isHeroForm && !dataToSend.nombre) {
			dataToSend.nombre = "Cliente Potencial (Cotización Rápida)";
		}

		// **CORRECCIÓN:** Usar la nueva URL del servidor de Render
		const apiUrl =
			import.meta.env.VITE_API_URL ||
			"https://transportes-araucaria.onrender.com";

		try {
			const response = await fetch(`${apiUrl}/send-email`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSend),
			});

			const result = await response.json();

			if (response.ok) {
				alert("¡Gracias por tu solicitud! Te contactaremos pronto.");
				// Limpiar el formulario después del envío exitoso
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
			} else {
				throw new Error(
					result.message || "Hubo un problema al enviar tu solicitud."
				);
			}
		} catch (error) {
			console.error("Error al enviar el formulario:", error);
			alert(`Error: ${error.message}`);
		}
	};

	const destinos = [
		{
			nombre: "Temuco",
			descripcion: "Centro comercial y administrativo de La Araucanía",
			precio: "$15.000",
			tiempo: "45 min",
			imagen: temucoImg,
		},
		{
			nombre: "Villarrica",
			descripcion: "Turismo y naturaleza junto al lago",
			precio: "$50.000",
			tiempo: "1h 15min",
			imagen: villarricaImg,
		},
		{
			nombre: "Pucón",
			descripcion: "Aventura, termas y volcán",
			precio: "$60.000",
			tiempo: "1h 30min",
			imagen: puconImg,
		},
	];

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

	return (
		<div className="min-h-screen bg-background text-foreground">
			{/* Header */}
			<header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
				<div className="container mx-auto px-4 py-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center space-x-2">
							<Car className="h-8 w-8 text-primary" />
							<h1 className="text-2xl font-bold text-primary">
								Transportes Araucaria
							</h1>
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
								href="tel:+56964355581"
								className="hidden md:flex items-center space-x-2 text-sm text-foreground hover:text-primary"
							>
								<Phone className="h-4 w-4" />
								<span>+56964355581</span>
							</a>
							<a
								href="https://wa.me/56964355581"
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
					<Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl border">
						<CardHeader>
							<CardTitle className="text-foreground text-center text-2xl">
								Reserva tu Transfer
							</CardTitle>
						</CardHeader>
						<CardContent>
							<form
								onSubmit={handleSubmit}
								className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
							>
								<div>
									<Label htmlFor="destino" className="text-left">
										Destino
									</Label>
									<select
										name="destino"
										value={formData.destino}
										onChange={handleInputChange}
										className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
										required
									>
										<option value="">Seleccionar</option>
										<option value="Temuco">Temuco</option>
										<option value="Villarrica">Villarrica</option>
										<option value="Pucón">Pucón</option>
									</select>
								</div>
								<div>
									<Label htmlFor="fecha" className="text-left">
										Fecha
									</Label>
									<Input
										type="date"
										name="fecha"
										value={formData.fecha}
										onChange={handleInputChange}
										required
									/>
								</div>
								<div>
									<Label htmlFor="hora" className="text-left">
										Hora
									</Label>
									<Input
										type="time"
										name="hora"
										value={formData.hora}
										onChange={handleInputChange}
										required
									/>
								</div>
								<div>
									<Label htmlFor="telefono" className="text-left">
										Teléfono
									</Label>
									<Input
										type="tel"
										name="telefono"
										placeholder="Ej: +569..."
										value={formData.telefono}
										onChange={handleInputChange}
										required
									/>
								</div>
								<div className="flex items-end">
									<Button
										type="submit"
										className="w-full bg-accent hover:bg-accent/90 text-lg py-3"
									>
										Cotizar Ahora
									</Button>
								</div>
							</form>
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
								className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
							>
								<div
									className="h-48 bg-cover bg-center"
									style={{ backgroundImage: `url(${destino.imagen})` }}
								></div>
								<CardHeader>
									<CardTitle className="flex justify-between items-center">
										{destino.nombre}
										<span className="text-2xl font-bold text-primary">
											{destino.precio}
										</span>
									</CardTitle>
									<CardDescription>{destino.descripcion}</CardDescription>
								</CardHeader>
								<CardContent>
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
									<a href="#contacto">
										<Button className="w-full">Reservar Transfer</Button>
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
											href="tel:+56964355581"
											className="text-muted-foreground hover:text-primary"
										>
											+56964355581
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
											<Label htmlFor="telefono">Teléfono</Label>
											<Input
												name="telefono"
												value={formData.telefono}
												onChange={handleInputChange}
												required
											/>
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
												name="destino"
												value={formData.destino}
												onChange={handleInputChange}
												className="w-full p-2 border rounded-md"
												required
											>
												<option value="">Seleccionar destino</option>
												<option value="Temuco">Temuco</option>
												<option value="Villarrica">Villarrica</option>
												<option value="Pucón">Pucón</option>
												<option value="Otro">Otro destino</option>
											</select>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<Label htmlFor="fecha-form">Fecha</Label>
											<Input
												type="date"
												name="fecha"
												value={formData.fecha}
												onChange={handleInputChange}
												required
											/>
										</div>
										<div>
											<Label htmlFor="hora-form">Hora</Label>
											<Input
												type="time"
												name="hora"
												value={formData.hora}
												onChange={handleInputChange}
												required
											/>
										</div>
										<div>
											<Label htmlFor="pasajeros">Pasajeros</Label>
											<select
												name="pasajeros"
												value={formData.pasajeros}
												onChange={handleInputChange}
												className="w-full p-2 border rounded-md"
											>
												<option value="1">1 pasajero</option>
												<option value="2">2 pasajeros</option>
												<option value="3">3 pasajeros</option>
												<option value="4">4 pasajeros</option>
												<option value="5+">5+ pasajeros</option>
											</select>
										</div>
									</div>
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
									>
										Enviar Solicitud
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
							<div className="flex items-center space-x-2 mb-4">
								<Car className="h-8 w-8" />
								<h3 className="text-xl font-bold">Transportes Araucaria</h3>
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
									<a href="tel:+56964355581" className="hover:underline">
										+56964355581
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
