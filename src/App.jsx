// Archivo corregido: src/App.jsx

/* global gtag */
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
import { Checkbox } from "./components/ui/checkbox";
import { LoaderCircle } from "lucide-react"; // Importar el ícono de carga

// Importar nuevos componentes de sección
import Header from "./components/Header";
import Hero from "./components/Hero";
import Servicios from "./components/Servicios";
import Destinos from "./components/Destinos";
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

const DESCUENTO_ONLINE = 0.1;

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
		numeroVuelo: "",
		hotel: "",
		equipajeEspecial: "",
		sillaInfantil: "no",
		mensaje: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConfirmationAlert, setShowConfirmationAlert] = useState(false);
	const [phoneError, setPhoneError] = useState("");
	const [reviewChecklist, setReviewChecklist] = useState({
		viaje: false,
		contacto: false,
	});
	// NUEVO ESTADO: para controlar la carga de los botones de pago
	const [loadingGateway, setLoadingGateway] = useState(null);

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
			numeroVuelo: "",
			hotel: "",
			equipajeEspecial: "",
			sillaInfantil: "no",
			mensaje: "",
		});
	};

	const handleCloseAlert = () => {
		setShowConfirmationAlert(false);
		setReviewChecklist({ viaje: false, contacto: false });
		resetForm();
	};

	const handlePayment = async (gateway, type = "abono") => {
		// Iniciar estado de carga
		setLoadingGateway(`${gateway}-${type}`);

		const destinoFinal =
			formData.destino === "Otro" ? formData.otroDestino : formData.destino;
		const { vehiculo } = cotizacion;

		const amount = type === "total" ? totalConDescuento : abono;

		if (!amount) {
			alert(
				"Aún no tenemos un valor disponible para generar el enlace de pago. Por favor, revisa tu cotización o contáctanos."
			);
			setLoadingGateway(null); // Detener estado de carga
			return;
		}

		const description =
			type === "total"
				? `Pago total con descuento para ${destinoFinal} (${
						vehiculo || "Vehículo a confirmar"
				  })`
				: `Abono reserva (40%) para ${destinoFinal} (${
						vehiculo || "Vehículo a confirmar"
				  })`;

		const apiUrl =
			import.meta.env.VITE_API_URL ||
			"https://transportes-araucaria.onrender.com";

		try {
			const response = await fetch(`${apiUrl}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gateway,
					amount,
					description,
					email: formData.email,
				}),
			});
			const data = await response.json();
			if (data.url) {
				window.open(data.url, "_blank");
			} else {
				throw new Error(
					data.message || "No se pudo generar el enlace de pago."
				);
			}
		} catch (error) {
			console.error("Error al crear el pago:", error);
			alert(`Hubo un problema al generar el enlace de pago: ${error.message}`);
		} finally {
			// Detener estado de carga independientemente del resultado
			setLoadingGateway(null);
		}
	};

	const enviarReserva = async (source) => {
		if (!validarTelefono(formData.telefono)) {
			setPhoneError(
				"Por favor, introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
			);
			return { success: false, error: "telefono" };
		}
		setPhoneError("");

		const validacion = validarHorarioReserva();
		if (!validacion.esValido && formData.destino !== "Otro") {
			return { success: false, error: "horario", message: validacion.mensaje };
		}

		if (isSubmitting) {
			return { success: false, error: "procesando" };
		}

		setIsSubmitting(true);

		const destinoFinal =
			formData.destino === "Otro" ? formData.otroDestino : formData.destino;

		const dataToSend = {
			...formData,
			destino: destinoFinal,
			precio: cotizacion.precio,
			vehiculo: cotizacion.vehiculo,
			descuentoOnline,
			totalConDescuento,
			abonoSugerido: abono,
			saldoPendiente,
			source,
		};

		if (!dataToSend.nombre?.trim()) {
			dataToSend.nombre = "Cliente Potencial (Cotización Rápida)";
		}

		const emailApiUrl = "https://www.transportesaraucaria.cl/enviar_correo.php";

		try {
			const response = await fetch(emailApiUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSend),
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.message || "Error en el servidor PHP.");
			}

			setReviewChecklist({ viaje: false, contacto: false });
			setShowConfirmationAlert(true);

			if (typeof gtag === "function") {
				gtag("event", "conversion", {
					send_to: `AW-17529712870/8GVlCLP-05MbEObh6KZB`,
				});
			}

			return { success: true };
		} catch (error) {
			console.error("Error al enviar el formulario a PHP:", error);
			return {
				success: false,
				error: "server",
				message: error.message,
			};
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const result = await enviarReserva(
			"Formulario de Contacto - Transportes Araucaria"
		);

		if (!result.success) {
			if (result.error === "horario" && result.message) {
				alert(result.message);
			} else if (result.error === "server" && result.message) {
				alert(`Error: ${result.message}`);
			}
		}
	};

	const handleWizardSubmit = () => enviarReserva("Reserva Web Autogestionada");

	const whatsappUrl = useMemo(() => {
		const destinoFinal =
			formData.destino === "Otro" ? formData.otroDestino : formData.destino;
		const viajeInfo = `${destinoFinal} el ${formData.fecha} a las ${formData.hora}`;
		const extras = [];

		if (formData.numeroVuelo) {
			extras.push(`Vuelo: ${formData.numeroVuelo}`);
		}

		if (formData.hotel) {
			extras.push(`Alojamiento: ${formData.hotel}`);
		}

		if (formData.equipajeEspecial) {
			extras.push(`Equipaje: ${formData.equipajeEspecial}`);
		}

		if (formData.sillaInfantil && formData.sillaInfantil !== "no") {
			extras.push(`Silla infantil: ${formData.sillaInfantil}`);
		}

		const detalles = extras.length ? ` Detalles: ${extras.join(" | ")}.` : "";

		const message = `Hola, acabo de reservar en el sitio web. Mi nombre es ${
			formData.nombre || "Cliente"
		} y quisiera confirmar mi traslado a ${viajeInfo}.${detalles}`;
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

	const pricing = useMemo(() => {
		const precioBase = cotizacion.precio || 0;
		const descuentoOnline = Math.round(precioBase * DESCUENTO_ONLINE);
		const totalConDescuento = Math.max(precioBase - descuentoOnline, 0);
		const abono = Math.round(totalConDescuento * 0.4);
		const saldoPendiente = Math.max(totalConDescuento - abono, 0);

		return {
			precioBase,
			descuentoOnline,
			totalConDescuento,
			abono,
			saldoPendiente,
		};
	}, [cotizacion.precio]);

	const {
		precioBase,
		descuentoOnline,
		totalConDescuento,
		abono,
		saldoPendiente,
	} = pricing;

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", {
				style: "currency",
				currency: "CLP",
			}),
		[]
	);

	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	const canPay = reviewChecklist.viaje && reviewChecklist.contacto;
	const discountPercentage = Math.round(DESCUENTO_ONLINE * 100);
	const destinoFinal =
		formData.destino === "Otro" ? formData.otroDestino : formData.destino;

	const extrasList = [];
	if (formData.numeroVuelo) {
		extrasList.push({ label: "Vuelo", value: formData.numeroVuelo });
	}
	if (formData.hotel) {
		extrasList.push({ label: "Alojamiento", value: formData.hotel });
	}
	if (formData.sillaInfantil && formData.sillaInfantil !== "no") {
		extrasList.push({ label: "Silla infantil", value: formData.sillaInfantil });
	}
	if (formData.equipajeEspecial) {
		extrasList.push({
			label: "Equipaje",
			value: formData.equipajeEspecial,
			fullWidth: true,
		});
	}
	if (formData.mensaje) {
		extrasList.push({
			label: "Notas",
			value: formData.mensaje,
			fullWidth: true,
		});
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<AlertDialog
				open={showConfirmationAlert}
				onOpenChange={setShowConfirmationAlert}
			>
				<AlertDialogContent className="grid w-full max-h-[85vh] grid-rows-[1fr_auto] gap-0 overflow-hidden p-0 sm:max-w-[560px] md:max-w-[780px]">
					<div className="min-h-0 overflow-y-auto px-6 py-6">
						<AlertDialogHeader>
							<AlertDialogTitle className="text-2xl">
								¡Gracias, {formData.nombre || "viajero"}!
							</AlertDialogTitle>
							<AlertDialogDescription className="space-y-6 pt-2 text-left">
								{/* ... (contenido del modal sin cambios) ... */}
								<p>
									Tu solicitud quedó registrada y enviaremos un resumen a tu
									correo. Revisa los datos y elige cómo quieres confirmar tu
									reserva:
								</p>

								<div className="rounded-xl border border-muted bg-muted/40 p-4 space-y-3 text-sm">
									<div className="grid gap-2 sm:grid-cols-2">
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">Origen:</span>
											<span className="font-semibold text-foreground text-right">
												{formData.origen || "Por confirmar"}
											</span>
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">Destino:</span>
											<span className="font-semibold text-foreground text-right">
												{destinoFinal || "Por confirmar"}
											</span>
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">Fecha:</span>
											<span className="font-semibold text-foreground text-right">
												{formData.fecha || "Por definir"}
											</span>
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">Hora:</span>
											<span className="font-semibold text-foreground text-right">
												{formData.hora || "Por definir"}
											</span>
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">Pasajeros:</span>
											<span className="font-semibold text-foreground">
												{formData.pasajeros}
											</span>
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">Vehículo:</span>
											<span className="font-semibold text-foreground">
												{cotizacion.vehiculo || "A confirmar"}
											</span>
										</div>
									</div>
									{extrasList.length > 0 && (
										<div className="grid gap-2 text-xs sm:grid-cols-2">
											{extrasList.map((extra) => (
												<div
													key={extra.label}
													className={`flex items-start justify-between gap-2 ${
														extra.fullWidth ? "sm:col-span-2" : ""
													}`}
												>
													<span className="text-muted-foreground">
														{extra.label}:
													</span>
													<span className="font-medium text-foreground text-right whitespace-pre-wrap">
														{extra.value}
													</span>
												</div>
											))}
										</div>
									)}
								</div>

								<div className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-3 text-sm">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											Precio estándar
										</span>
										<span className="font-semibold text-foreground">
											{formatCurrency(precioBase)}
										</span>
									</div>
									<div className="flex items-center justify-between text-emerald-600">
										<span>Descuento online ({discountPercentage}%)</span>
										<span>-{formatCurrency(descuentoOnline)}</span>
									</div>
									<div className="flex items-center justify-between text-lg font-semibold text-accent">
										<span>Total con descuento</span>
										<span>{formatCurrency(totalConDescuento)}</span>
									</div>
									<div className="flex items-center justify-between">
										<span>Abono sugerido (40%)</span>
										<span>{formatCurrency(abono)}</span>
									</div>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>Saldo pendiente</span>
										<span>{formatCurrency(saldoPendiente)}</span>
									</div>
									<p className="text-xs text-muted-foreground">
										El descuento se asegura pagando en línea. Si eliges abonar,
										el saldo se cancela al conductor el día del servicio.
									</p>
								</div>

								<div className="space-y-3 rounded-lg border border-muted bg-muted/30 p-4 text-sm">
									<label className="flex items-start gap-3">
										<Checkbox
											id="check-viaje"
											checked={reviewChecklist.viaje}
											onCheckedChange={(checked) =>
												setReviewChecklist((prev) => ({
													...prev,
													viaje: Boolean(checked),
												}))
											}
										/>
										<div>
											<p className="font-medium text-foreground">
												Los datos del viaje están correctos.
											</p>
											<p className="text-xs text-muted-foreground">
												{formData.origen || "Origen por confirmar"} →{" "}
												{destinoFinal || "Destino por confirmar"}
											</p>
										</div>
									</label>
									<label className="flex items-start gap-3">
										<Checkbox
											id="check-contacto"
											checked={reviewChecklist.contacto}
											onCheckedChange={(checked) =>
												setReviewChecklist((prev) => ({
													...prev,
													contacto: Boolean(checked),
												}))
											}
										/>
										<div>
											<p className="font-medium text-foreground">
												Mis datos de contacto están bien.
											</p>
											<p className="text-xs text-muted-foreground">
												{formData.telefono || "Teléfono por confirmar"} ·{" "}
												{formData.email || "Email por confirmar"}
											</p>
										</div>
									</label>
									<p className="text-xs text-muted-foreground">
										¿Necesitas corregir algo? Cierra este resumen, ajusta los
										datos y vuelve a abrirlo antes de pagar.
									</p>
								</div>

								<div className="rounded-lg border border-emerald-500/40 bg-emerald-100/40 p-3 text-xs text-emerald-700">
									Tus pagos se procesan de forma segura con Flow y Mercado Pago
									(certificación PCI DSS). Revisa las políticas de cambios y
									cancelaciones en el correo de confirmación.
								</div>

								<div className="text-xs text-center text-muted-foreground">
									Recuerda que con cada viaje acumulas beneficios en nuestro{" "}
									<strong>Club Araucanía</strong>. ¡Tu 3er viaje tiene un 15% de
									descuento!
								</div>
							</AlertDialogDescription>
						</AlertDialogHeader>
					</div>

					<AlertDialogFooter className="w-full shrink-0 flex-col gap-4 border-t border-muted bg-background/95 px-6 py-4 shadow-[0_-12px_24px_-20px_rgba(15,23,42,0.45)] sm:flex-col">
						{totalConDescuento > 0 ? (
							<div className="space-y-4">
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<h4 className="text-sm font-semibold uppercase text-foreground">
											Abonar 40% ahora
										</h4>
										<span className="text-xs text-muted-foreground">
											Pagarás {formatCurrency(abono)} hoy.
										</span>
									</div>
									<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
										<Button
											onClick={() => handlePayment("flow", "abono")}
											disabled={!canPay || loadingGateway}
											className="w-full"
										>
											{loadingGateway === "flow-abono" ? (
												<>
													<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{" "}
													Procesando...
												</>
											) : (
												"Abonar con Flow"
											)}
										</Button>
										<Button
											onClick={() => handlePayment("mercadopago", "abono")}
											disabled={!canPay || loadingGateway}
											variant="secondary"
											className="w-full"
										>
											{loadingGateway === "mercadopago-abono" ? (
												<>
													<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{" "}
													Procesando...
												</>
											) : (
												"Abonar con Mercado Pago"
											)}
										</Button>
									</div>
								</div>
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<h4 className="text-sm font-semibold uppercase text-foreground">
											Pagar total con descuento
										</h4>
										<span className="text-xs text-muted-foreground">
											Cancela {formatCurrency(totalConDescuento)} ahora y
											olvídate del saldo.
										</span>
									</div>
									<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
										<Button
											onClick={() => handlePayment("flow", "total")}
											disabled={!canPay || loadingGateway}
											className="w-full"
										>
											{loadingGateway === "flow-total" ? (
												<>
													<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{" "}
													Procesando...
												</>
											) : (
												"Pagar total con Flow"
											)}
										</Button>
										<Button
											onClick={() => handlePayment("mercadopago", "total")}
											disabled={!canPay || loadingGateway}
											variant="secondary"
											className="w-full"
										>
											{loadingGateway === "mercadopago-total" ? (
												<>
													<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{" "}
													Procesando...
												</>
											) : (
												"Pagar total con Mercado Pago"
											)}
										</Button>
									</div>
								</div>
								{!canPay && (
									<p className="text-xs text-muted-foreground">
										Marca las casillas del checklist para habilitar los enlaces
										de pago.
									</p>
								)}
							</div>
						) : (
							<div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary">
								Definiremos el valor final contigo antes de enviar un enlace de
								pago. Nuestro equipo te contactará a la brevedad.
							</div>
						)}

						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
							<AlertDialogCancel
								onClick={handleCloseAlert}
								className="w-full sm:w-auto"
							>
								Editar datos
							</AlertDialogCancel>
							<AlertDialogAction asChild className="w-full sm:w-auto">
								<Button
									asChild
									variant="secondary"
									className="w-full sm:w-auto !whitespace-normal text-center"
								>
									<a
										href={whatsappUrl}
										target="_blank"
										rel="noopener noreferrer"
									>
										¿Problemas con el pago? Escríbenos por WhatsApp
									</a>
								</Button>
							</AlertDialogAction>
						</div>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Header />

			<main>
				<Hero
					formData={formData}
					handleInputChange={handleInputChange}
					destinos={destinos}
					maxPasajeros={maxPasajeros}
					minDateTime={minDateTime}
					phoneError={phoneError}
					setPhoneError={setPhoneError}
					isSubmitting={isSubmitting}
					cotizacion={cotizacion}
					pricing={pricing}
					descuentoRate={DESCUENTO_ONLINE}
					onSubmitWizard={handleWizardSubmit}
					validarTelefono={validarTelefono}
					validarHorarioReserva={validarHorarioReserva}
					showSummary={showConfirmationAlert}
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
