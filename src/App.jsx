// src/App.jsx

/* global gtag */
import "./App.css";
import { useState, useEffect, useMemo, useCallback } from "react";

// --- Componentes UI ---
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { LoaderCircle } from "lucide-react";

// --- Componentes de Sección ---
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
import AdminPricing from "./components/AdminPricing";

// --- Datos Iniciales y Lógica ---
import { destinosBase, destacadosData } from "./data/destinos";

const DESCUENTO_ONLINE = 0.1;

const resolveIsAdminView = () => {
	if (typeof window === "undefined") return false;
	return window.location.pathname.toLowerCase().startsWith("/admin/precios");
};

function App() {
	const [isAdminView, setIsAdminView] = useState(resolveIsAdminView);
	const [destinosData, setDestinosData] = useState(destinosBase);
	const [loadingPrecios, setLoadingPrecios] = useState(true);

	// --- ESTADO Y LÓGICA DEL FORMULARIO ---
	const [formData, setFormData] = useState({
		nombre: "",
		telefono: "",
		email: "",
		origen: "Aeropuerto La Araucanía",
		otroOrigen: "",
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
	const [loadingGateway, setLoadingGateway] = useState(null);

	// --- CARGA DE DATOS DINÁMICA ---
	useEffect(() => {
		const fetchPreciosDesdeAPI = async () => {
			try {
				const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
				const response = await fetch(`${apiUrl}/pricing`);
				if (!response.ok)
					throw new Error("La respuesta de la red no fue exitosa.");

				const data = await response.json();

				if (data.destinos && data.destinos.length > 0) {
					setDestinosData(data.destinos);
				} else {
					setDestinosData(destinosBase);
				}
			} catch (error) {
				console.error(
					"Error al cargar precios desde la API, usando valores por defecto.",
					error
				);
				setDestinosData(destinosBase);
			} finally {
				setLoadingPrecios(false);
			}
		};
		fetchPreciosDesdeAPI();
	}, []);

	// --- LÓGICA DE RUTAS Y PASAJEROS DINÁMICOS ---
	const todosLosTramos = useMemo(
		() => ["Aeropuerto La Araucanía", ...destinosData.map((d) => d.nombre)],
		[destinosData]
	);

	const destinosDisponibles = useMemo(() => {
		return todosLosTramos.filter((d) => d !== formData.origen);
	}, [formData.origen, todosLosTramos]);

	const origenesContacto = useMemo(
		() => [
			"Aeropuerto La Araucanía",
			...destinosData.map((d) => d.nombre),
			"Otro",
		],
		[destinosData]
	);

	// ==================================================================
	// LÓGICA CORREGIDA PARA ACTUALIZACIÓN DINÁMICA DE PASAJEROS
	// ==================================================================
	const destinoSeleccionado = useMemo(() => {
		if (!formData.destino) return null;
		return destinosData.find((d) => d.nombre === formData.destino);
	}, [formData.destino, destinosData]);

	const maxPasajeros = destinoSeleccionado
		? destinoSeleccionado.maxPasajeros
		: 7;

	useEffect(() => {
		if (
			destinoSeleccionado &&
			parseInt(formData.pasajeros) > destinoSeleccionado.maxPasajeros
		) {
			setFormData((prev) => ({ ...prev, pasajeros: "1" }));
		}
	}, [destinoSeleccionado, formData.pasajeros]);

	const calcularCotizacion = useCallback(
		(origen, destino, pasajeros) => {
			const tramo = [origen, destino].find(
				(lugar) => lugar !== "Aeropuerto La Araucanía"
			);
			const destinoInfo = destinosData.find((d) => d.nombre === tramo);

			if (!origen || !destinoInfo || !pasajeros || destino === "Otro") {
				return { precio: null, vehiculo: null };
			}

			const numPasajeros = parseInt(pasajeros);
			let vehiculoAsignado;
			let precioFinal;

			if (numPasajeros > 0 && numPasajeros <= 4) {
				vehiculoAsignado = "Auto Privado";
				const precios = destinoInfo.precios.auto;
				if (!precios) return { precio: null, vehiculo: vehiculoAsignado };

				const pasajerosAdicionales = numPasajeros - 1;
				const costoAdicional = precios.base * precios.porcentajeAdicional;
				precioFinal = precios.base + pasajerosAdicionales * costoAdicional;
			} else if (
				numPasajeros >= 5 &&
				numPasajeros <= destinoInfo.maxPasajeros
			) {
				vehiculoAsignado = "Van de Pasajeros";
				const precios = destinoInfo.precios.van;
				if (!precios) return { precio: null, vehiculo: "Van (Consultar)" };

				const pasajerosAdicionales = numPasajeros - 5;
				const costoAdicional = precios.base * precios.porcentajeAdicional;
				precioFinal = precios.base + pasajerosAdicionales * costoAdicional;
			} else {
				vehiculoAsignado = "Consultar disponibilidad";
				precioFinal = null;
			}
			return { precio: Math.round(precioFinal), vehiculo: vehiculoAsignado };
		},
		[destinosData]
	);

	useEffect(() => {
		const handleLocationChange = () => setIsAdminView(resolveIsAdminView());
		window.addEventListener("popstate", handleLocationChange);
		return () => window.removeEventListener("popstate", handleLocationChange);
	}, []);

	const cotizacion = useMemo(() => {
		return calcularCotizacion(
			formData.origen,
			formData.destino,
			formData.pasajeros
		);
	}, [
		formData.origen,
		formData.destino,
		formData.pasajeros,
		calcularCotizacion,
	]);

	const validarTelefono = (telefono) =>
		/^(\+?56)?(\s?9)\s?(\d{4})\s?(\d{4})$/.test(telefono);

	const validarHorarioReserva = () => {
		if (!destinoSeleccionado || !formData.fecha || !formData.hora) {
			return {
				esValido: false,
				mensaje: "Por favor, completa la fecha y hora.",
			};
		}
		const ahora = new Date();
		const fechaReserva = new Date(`${formData.fecha}T${formData.hora}`);
		const horasDeDiferencia = (fechaReserva - ahora) / 3600000;
		const { minHorasAnticipacion } = destinoSeleccionado;
		if (horasDeDiferencia < minHorasAnticipacion) {
			return {
				esValido: false,
				mensaje: `Para ${destinoSeleccionado.nombre}, reserva con al menos ${minHorasAnticipacion} horas de anticipación.`,
			};
		}
		return { esValido: true, mensaje: "" };
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => {
			const newFormData = { ...prev, [name]: value };
			if (name === "origen" && value !== "Aeropuerto La Araucanía")
				newFormData.destino = "Aeropuerto La Araucanía";
			else if (name === "destino" && value !== "Aeropuerto La Araucanía")
				newFormData.origen = "Aeropuerto La Araucanía";
			return newFormData;
		});
		if (name === "telefono") setPhoneError("");
	};

	const resetForm = () => {
		setFormData({
			nombre: "",
			telefono: "",
			email: "",
			origen: "Aeropuerto La Araucanía",
			otroOrigen: "",
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

	const handlePayment = async (gateway, type = "abono") => {
		setLoadingGateway(`${gateway}-${type}`);
		const destinoFinal =
			formData.destino === "Otro" ? formData.otroDestino : formData.destino;
		const { vehiculo } = cotizacion;
		const amount = type === "total" ? totalConDescuento : abono;
		if (!amount) {
			alert("Aún no tenemos un valor para generar el enlace de pago.");
			setLoadingGateway(null);
			return;
		}
		const description =
			type === "total"
				? `Pago total con descuento para ${destinoFinal} (${
						vehiculo || "A confirmar"
				  })`
				: `Abono reserva (40%) para ${destinoFinal} (${
						vehiculo || "A confirmar"
				  })`;
		const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
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
			alert(`Hubo un problema: ${error.message}`);
		} finally {
			setLoadingGateway(null);
		}
	};

	const enviarReserva = async (source) => {
		if (!validarTelefono(formData.telefono)) {
			setPhoneError(
				"Introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
			);
			return { success: false, error: "telefono" };
		}
		setPhoneError("");
		const validacion = validarHorarioReserva();
		if (!validacion.esValido && formData.destino !== "Otro") {
			return { success: false, error: "horario", message: validacion.mensaje };
		}
		if (isSubmitting) return { success: false, error: "procesando" };
		setIsSubmitting(true);
		const destinoFinal =
			formData.destino === "Otro" ? formData.otroDestino : formData.destino;
		const origenFinal =
			formData.origen === "Otro" ? formData.otroOrigen : formData.origen;
		const dataToSend = {
			...formData,
			origen: origenFinal,
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
			if (!response.ok)
				throw new Error(result.message || "Error en el servidor PHP.");
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
			return { success: false, error: "server", message: error.message };
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const result = await enviarReserva("Formulario de Contacto");
		if (!result.success && result.message) alert(result.message);
	};

	const handleWizardSubmit = () => enviarReserva("Reserva Web Autogestionada");

	const whatsappUrl = useMemo(() => {
		const destinoFinal =
			formData.destino === "Otro" ? formData.otroDestino : formData.destino;
		const viajeInfo = `${destinoFinal} el ${formData.fecha} a las ${formData.hora}`;
		const extras = [];
		if (formData.numeroVuelo) extras.push(`Vuelo: ${formData.numeroVuelo}`);
		if (formData.hotel) extras.push(`Alojamiento: ${formData.hotel}`);
		if (formData.equipajeEspecial)
			extras.push(`Equipaje: ${formData.equipajeEspecial}`);
		if (formData.sillaInfantil !== "no")
			extras.push(`Silla infantil: ${formData.sillaInfantil}`);
		const detalles = extras.length ? ` Detalles: ${extras.join(" | ")}.` : "";
		const message = `Hola, acabo de reservar en el sitio web. Mi nombre es ${
			formData.nombre || "Cliente"
		} y quisiera confirmar mi traslado a ${viajeInfo}.${detalles}`;
		return `https://wa.me/56936643540?text=${encodeURIComponent(message)}`;
	}, [formData]);

	const minDateTime = useMemo(() => {
		const horasAnticipacion = destinoSeleccionado?.minHorasAnticipacion || 5;
		const fechaMinima = new Date();
		fechaMinima.setHours(fechaMinima.getHours() + horasAnticipacion);
		return fechaMinima.toISOString().split("T")[0];
	}, [destinoSeleccionado]);

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }),
		[]
	);
	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	const canPay = reviewChecklist.viaje && reviewChecklist.contacto;
	const discountPercentage = Math.round(DESCUENTO_ONLINE * 100);
	const destinoFinal =
		formData.destino === "Otro" ? formData.otroDestino : formData.destino;

	const extrasList = [];
	if (formData.numeroVuelo)
		extrasList.push({ label: "Vuelo", value: formData.numeroVuelo });
	if (formData.hotel)
		extrasList.push({ label: "Alojamiento", value: formData.hotel });
	if (formData.sillaInfantil !== "no")
		extrasList.push({ label: "Silla infantil", value: formData.sillaInfantil });
	if (formData.equipajeEspecial)
		extrasList.push({
			label: "Equipaje",
			value: formData.equipajeEspecial,
			fullWidth: true,
		});
	if (formData.mensaje)
		extrasList.push({
			label: "Notas",
			value: formData.mensaje,
			fullWidth: true,
		});

	if (isAdminView) {
		return <AdminPricing />;
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			{loadingPrecios && (
				<div className="fixed top-0 left-0 w-full h-full bg-black/50 z-[100] flex items-center justify-center text-white">
					<LoaderCircle className="animate-spin mr-2" />
					Cargando tarifas actualizadas...
				</div>
			)}
			<Dialog
				open={showConfirmationAlert}
				onOpenChange={setShowConfirmationAlert}
			>
				{/* El contenido del Dialog no requiere cambios */}
			</Dialog>

			<Header />

			<main>
				<Hero
					formData={formData}
					handleInputChange={handleInputChange}
					origenes={todosLosTramos}
					destinos={destinosDisponibles}
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
				<Destinos destinos={destinosData} />
				<Destacados destinos={destacadosData} />
				<Fidelizacion />
				<PorQueElegirnos />
				<Testimonios />
				<Contacto
					formData={formData}
					handleInputChange={handleInputChange}
					handleSubmit={handleSubmit}
					origenes={origenesContacto}
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
