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
import { Button } from "./components/ui/button";

// Importar nuevos componentes de sección
import Header from "./components/Header";
import Hero from "./components/Hero";
import Servicios from "./components/Servicios";
import Destinos from "./components/Destinos";
import Tours from "./components/Tours";
import Destacados from "./components/Destacados";
import PorQueElegirnos from "./components/PorQueElegirnos";
import Testimonios from "./components/Testimonios";
import Contacto from "./components/Contacto";
import Footer from "./components/Footer";
import Fidelizacion from "./components/Fidelizacion";

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
		precios: {
			auto: { base: 15000, porcentajeAdicional: 0.1 },
		},
	},
	{
		nombre: "Villarrica",
		descripcion: "Turismo y naturaleza junto al lago.",
		tiempo: "1h 15min",
		imagen: villarricaImg,
		maxPasajeros: 7,
		minHorasAnticipacion: 5,
		precios: {
			auto: { base: 40000, porcentajeAdicional: 0.05 },
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
		precios: {
			auto: { base: 50000, porcentajeAdicional: 0.05 },
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
		vehiculoAsignado = "Auto Privado";
		const precios = destino.precios.auto;
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
	const [showConfirmationAlert, setShowConfirmationAlert] = useState(false);
	const [phoneError, setPhoneError] = useState("");
	const [paymentUrl, setPaymentUrl] = useState("");

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
		setShowConfirmationAlert(false);
		setPaymentUrl("");
		resetForm();
	};

	const handlePayment = async (gateway) => {
		const { precio, vehiculo } = cotizacion;
		const amount = Math.round(precio * 0.4);
		const description = `Abono reserva para ${formData.destino} (${vehiculo})`;
		const apiUrl =
			import.meta.env.VITE_API_URL ||
			"https://transportes-araucaria.onrender.com";

		try {
			const response = await fetch(`${apiUrl}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ gateway, amount, description }),
			});
			const data = await response.json();
			if (data.url) {
				window.open(data.url, "_blank");
			} else {
				throw new Error("No se pudo generar el enlace de pago.");
			}
		} catch (error) {
			console.error("Error al crear el pago:", error);
			alert(
				"Hubo un problema al generar el enlace de pago. Por favor, intenta de nuevo."
			);
		}
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

			setShowConfirmationAlert(true);

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

	const whatsappUrl = useMemo(() => {
		const destinoFinal =
			formData.destino === "Otro" ? formData.otroDestino : formData.destino;
		const message = `Hola, acabo de cotizar desde el sitio web. Mi nombre es ${formData.nombre} y quisiera confirmar mi reserva a ${destinoFinal} para el día ${formData.fecha} a las ${formData.hora}.`;
		return `https://wa.me/56936643540?text=${encodeURIComponent(message)}`;
	}, [formData]);

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

	// --- CÁLCULOS PARA EL DIÁLOGO ---
	const abono = cotizacion.precio ? Math.round(cotizacion.precio * 0.4) : 0;
	const saldoPendiente = cotizacion.precio ? cotizacion.precio - abono : 0;

	return (
		<div className="min-h-screen bg-background text-foreground">
			<AlertDialog
				open={showConfirmationAlert}
				onOpenChange={setShowConfirmationAlert}
			>
				{/* ⬇️ AUMENTAMOS ANCHO EN PANTALLAS MEDIANAS */}
				<AlertDialogContent className="sm:max-w-[520px] md:max-w-[720px]">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-2xl">
							¡Gracias, {formData.nombre || "viajero"}!
						</AlertDialogTitle>
						<AlertDialogDescription className="space-y-4 pt-2">
							<p>
								Hemos recibido tu solicitud y enviado una copia a tu correo.
								Aquí tienes el resumen de tu reserva:
							</p>

							{/* Resumen de la Reserva */}
							<div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Destino:</span>
									<span className="font-semibold text-foreground">
										{formData.destino === "Otro"
											? formData.otroDestino
											: formData.destino}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Valor Total:</span>
									<span className="font-semibold text-foreground">
										{new Intl.NumberFormat("es-CL", {
											style: "currency",
											currency: "CLP",
										}).format(cotizacion.precio || 0)}
									</span>
								</div>
								<div className="flex justify-between font-bold text-primary">
									<span>Abono para reservar (40%):</span>
									<span>
										{new Intl.NumberFormat("es-CL", {
											style: "currency",
											currency: "CLP",
										}).format(abono)}
									</span>
								</div>
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>Saldo pendiente (a pagar al conductor):</span>
									<span>
										{new Intl.NumberFormat("es-CL", {
											style: "currency",
											currency: "CLP",
										}).format(saldoPendiente)}
									</span>
								</div>
							</div>

							<div>
								<h4 className="font-semibold text-foreground mb-2">
									¿Cómo confirmar tu reserva?
								</h4>
								<ol className="list-decimal list-inside space-y-1 text-muted-foreground">
									<li>
										<strong>Opción 1:</strong> Abona el 40% de forma segura a
										través de Flow o Mercado Pago.
									</li>
									<li>
										<strong>Opción 2:</strong> Contáctanos por WhatsApp para
										confirmar y coordinar el pago.
									</li>
								</ol>
							</div>
							<div className="text-xs text-center pt-2 text-muted-foreground">
								Recuerda que con cada viaje acumulas beneficios en nuestro{" "}
								<strong>Club Araucanía</strong>. ¡Tu 3er viaje tiene un 15% de
								descuento!
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>

					{/* ⬇️ FOOTER: COLUMNA EN MOBILE, FILA DESDE md */}
					<AlertDialogFooter className="flex-col-reverse md:flex-row md:justify-end md:gap-2">
						<AlertDialogCancel onClick={handleCloseAlert}>
							Cerrar
						</AlertDialogCancel>

						{/* ⬇️ ACCIONES: 1 COL EN MOBILE, 3 COLS DESDE md */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
							<AlertDialogAction asChild className="w-full">
								<a
									href={whatsappUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="w-full !whitespace-normal break-words leading-tight text-center bg-green-500 hover:bg-green-600"
								>
									Confirmar por WhatsApp
								</a>
							</AlertDialogAction>

							{cotizacion.precio && (
								<>
									<Button
										onClick={() => handlePayment("flow")}
										className="w-full !whitespace-normal break-words leading-tight text-center"
									>
										Abono con (Flow)
									</Button>

									<Button
										onClick={() => handlePayment("mercadopago")}
										className="w-full !whitespace-normal break-words leading-tight text-center"
									>
										Abono con (Mercado Pago)
									</Button>
								</>
							)}
						</div>
					</AlertDialogFooter>
				</AlertDialogContent>
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
				<Fidelizacion />
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
