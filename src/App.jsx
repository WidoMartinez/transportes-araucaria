import "./App.css";
import { useState, useEffect, useMemo } from "react";

// Componentes de la interfaz de usuario y AlertDialog
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

// Importar nuevos componentes de sección
import Header from "./components/Header";
import Hero from "./components/Hero";
import Servicios from "./components/Servicios";
import Destinos from "./components/Destinos";
import Destacados from "./components/Destacados.";
import PorQueElegirnos from "./components/PorQueElegirnos";
import Testimonios from "./components/Testimonios";
import Contacto from "./components/Contacto";
import Footer from "./components/Footer";

// Importar imágenes
import temucoImg from "./assets/temuco.jpg";
import villarricaImg from "./assets/villarrica.jpg";
import puconImg from "./assets/pucon.jpg";
import corralcoImg from "./assets/corralco.jpg";

// --- DATOS Y LÓGICA ---

const destinos = [
	{
		nombre: "Temuco",
		descripcion: "Centro comercial y administrativo de La Araucanía.",
		tiempo: "45 min",
		imagen: temucoImg,
		maxPasajeros: 4,
		minHorasAnticipacion: 5,
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
		minHorasAnticipacion: 5,
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
		minHorasAnticipacion: 5,
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

const destacadosData = [
	{
		nombre: "Corralco",
		titulo: "Visita Corralco en Temporada de Nieve",
		subtitulo: "Una Aventura Invernal Inolvidable",
		descripcion:
			"Disfruta de la majestuosa nieve en el centro de ski Corralco, a los pies del volcán Lonquimay. Ofrecemos traslados directos y seguros para que solo te preocupes de disfrutar las pistas y los paisajes.",
		imagen: corralcoImg,
	},
];

const calcularCotizacion = (destino, pasajeros) => {
	if (!destino || !pasajeros || destino.nombre === "Otro") {
		return { precio: null, vehiculo: null };
	}

	const numPasajeros = parseInt(pasajeros);
	let vehiculoAsignado;
	let precioFinal;

	if (numPasajeros > 0 && numPasajeros <= 4) {
		vehiculoAsignado = "Sedan 5 Puertas";
		const precios = destino.precios.sedan;
		if (!precios) return { precio: null, vehiculo: vehiculoAsignado };

		const pasajerosAdicionales = numPasajeros - 1;
		const costoAdicional = precios.base * precios.porcentajeAdicional;
		precioFinal = precios.base + pasajerosAdicionales * costoAdicional;
	} else if (numPasajeros >= 5 && numPasajeros <= 7) {
		vehiculoAsignado = "Van de Pasajeros";
		const precios = destino.precios.van;
		if (!precios) return { precio: null, vehiculo: vehiculoAsignado };

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
		otroDestino: "",
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
	}, [formData.destino, formData.pasajeros]);

	const resetForm = () => {
		setFormData({
			nombre: "",
			telefono: "",
			email: "",
			origen: "Aeropuerto La Araucanía",
			destino: "",
			otroDestino: "",
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
		if (!validacion.esValido && formData.destino !== "Otro") {
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

		if (dataToSend.destino === "Otro") {
			dataToSend.destino = dataToSend.otroDestino;
		}

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

	const maxPasajeros = useMemo(() => {
		const destino = destinos.find((d) => d.nombre === formData.destino);
		return destino?.maxPasajeros || 7;
	}, [formData.destino]);

	const minDateTime = useMemo(() => {
		const destino = destinos.find((d) => d.nombre === formData.destino);
		const horasAnticipacion = destino?.minHorasAnticipacion || 5;

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

			<Header />

			<main>
				<Hero
					formData={formData}
					handleInputChange={handleInputChange}
					handleSubmit={handleSubmit}
					cotizacion={cotizacion}
					destinos={destinos}
					maxPasajeros={maxPasajeros}
					minDateTime={minDateTime}
					phoneError={phoneError}
					isSubmitting={isSubmitting}
				/>
				<Servicios />
				<Destinos destinos={destinos} />
				<Destacados destinos={destacadosData} />
				<PorQueElegirnos />
				<Testimonios />
				<Contacto
					formData={formData}
					handleInputChange={handleInputChange}
					handleSubmit={handleSubmit}
					cotizacion={cotizacion}
					destinos={destinos}
					maxPasajeros={maxPasajeros}
					minDateTime={minDateTime}
					phoneError={phoneError}
					isSubmitting={isSubmitting}
				/>
			</main>

			<Footer />
		</div>
	);
}

export default App;
