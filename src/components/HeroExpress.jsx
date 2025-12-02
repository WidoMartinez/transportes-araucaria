import React, { useMemo, useState, useEffect } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { LoaderCircle, ArrowRight, ArrowLeft, MapPin, Calendar, Clock, Users, CheckCircle2, ShieldCheck, CreditCard } from "lucide-react";
import heroVan from "../assets/hero-van.png";
import { getBackendUrl } from "../lib/backend";
import { motion, AnimatePresence } from "framer-motion";

// Función para generar opciones de hora en intervalos de 15 minutos (6:00 AM - 8:00 PM)
const generateTimeOptions = () => {
	const options = [];
	for (let hour = 6; hour <= 20; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const timeString = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
			const displayTime = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
			options.push({ value: timeString, label: displayTime });
		}
	}
	return options;
};

function HeroExpress({
	formData,
	handleInputChange,
	origenes,
	destinos,
	destinosData = [], // Data completa para imágenes
	maxPasajeros,
	minDateTime,
	phoneError,
	setPhoneError,
	isSubmitting,
	cotizacion,
	pricing,
	baseDiscountRate,
	promotionDiscountRate,
	handlePayment,
	loadingGateway,
	onSubmitWizard,
	validarTelefono,
	codigoAplicado,
	codigoError,
	validandoCodigo,
	onAplicarCodigo,
	onRemoverCodigo,
}) {
	const [currentStep, setCurrentStep] = useState(0);
	const [stepError, setStepError] = useState("");
	const [paymentConsent, setPaymentConsent] = useState(false);
	const [selectedPaymentType, setSelectedPaymentType] = useState("total");
	const [reservaActiva, setReservaActiva] = useState(null);
	const [verificandoReserva, setVerificandoReserva] = useState(false);
	const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
	const [descuentoRetorno, setDescuentoRetorno] = useState(null);

	const timeOptions = useMemo(() => generateTimeOptions(), []);

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", {
				style: "currency",
				currency: "CLP",
			}),
		[]
	);

	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	const fechaLegible = useMemo(() => {
		if (!formData.fecha) return "Por confirmar";
		const parsed = new Date(`${formData.fecha}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) return formData.fecha;
		return parsed.toLocaleDateString("es-CL", {
			dateStyle: "long",
			timeZone: "America/Santiago",
		});
	}, [formData.fecha]);

	const tieneCotizacionAutomatica = typeof cotizacion.precio === "number";
	const requiereCotizacionManual =
		formData.destino === "Otro" ||
		(formData.destino && !tieneCotizacionAutomatica);
	const mostrarPrecio = tieneCotizacionAutomatica;

	// Imagen dinámica basada en el destino seleccionado
	const selectedDestinoImage = useMemo(() => {
		// Prioridad: Destino seleccionado -> Origen seleccionado (si no es aeropuerto/otro) -> Default
		const targetName = formData.destino !== "Aeropuerto La Araucanía" && formData.destino !== "Otro"
			? formData.destino
			: (formData.origen !== "Aeropuerto La Araucanía" && formData.origen !== "Otro" ? formData.origen : null);

		if (targetName && Array.isArray(destinosData)) {
			const dest = destinosData.find(d => d.nombre === targetName);
			if (dest && dest.imagen) return dest.imagen;
		}
		return heroVan;
	}, [formData.destino, formData.origen, destinosData]);

	// Texto dinámico para el panel visual
	const visualText = useMemo(() => {
		if (currentStep === 1) return { title: "Resumen de tu viaje", subtitle: "Estás a un paso de confirmar." };
		if (formData.destino && formData.destino !== "Aeropuerto La Araucanía" && formData.destino !== "Otro") {
			return { title: `Viaja a ${formData.destino}`, subtitle: "Comodidad y seguridad garantizada." };
		}
		if (formData.origen && formData.origen !== "Aeropuerto La Araucanía" && formData.origen !== "Otro") {
			return { title: `Viaja desde ${formData.origen}`, subtitle: "Comenzamos el viaje donde tú estés." };
		}
		return { title: "Transporte Privado", subtitle: "Conecta con Pucón, Villarrica y toda la región." };
	}, [formData.destino, formData.origen, currentStep]);


	const verificarReservaActiva = async (email) => {
		if (!email || !email.trim()) {
			setReservaActiva(null);
			return;
		}
		setVerificandoReserva(true);
		try {
			const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(
				`${apiUrl}/api/reservas/verificar-activa/${encodeURIComponent(email.trim())}`
			);
			if (response.ok) {
				const data = await response.json();
				setReservaActiva(data.tieneReservaActiva ? data.reserva : null);
			}
		} catch (error) {
			console.error("Error verificando reserva activa:", error);
			setReservaActiva(null);
		} finally {
			setVerificandoReserva(false);
		}
	};

	const verificarDisponibilidadYRetorno = async () => {
		if (!formData.destino || !formData.fecha || !formData.hora) {
			return { disponible: true, descuento: null };
		}
		setVerificandoDisponibilidad(true);
		try {
			// Buscar el destino seleccionado para obtener la duración estimada
			// Si destinosData está disponible, usarlo para más precisión, sino fallback a default
			const destinoObj = Array.isArray(destinosData)
				? destinosData.find(d => d.nombre === formData.destino)
				: null;

			const duracionMinutos = destinoObj?.duracionIdaMinutos || 60;

			const respDisponibilidad = await fetch(
				`${getBackendUrl()}/api/disponibilidad/verificar`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						fecha: formData.fecha,
						hora: formData.hora,
						duracionMinutos: duracionMinutos,
						pasajeros: formData.pasajeros || 1,
					}),
				}
			);

			if (!respDisponibilidad.ok) return { disponible: true, descuento: null };

			const dataDisponibilidad = await respDisponibilidad.json();
			if (!dataDisponibilidad.disponible) {
				return { disponible: false, mensaje: dataDisponibilidad.mensaje, descuento: null };
			}

			const respRetorno = await fetch(
				`${getBackendUrl()}/api/disponibilidad/oportunidades-retorno`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						origen: formData.origen,
						destino: formData.destino,
						fecha: formData.fecha,
						hora: formData.hora,
					}),
				}
			);

			if (respRetorno.ok) {
				const dataRetorno = await respRetorno.json();
				if (dataRetorno.hayOportunidad && dataRetorno.descuento > 0) {
					return {
						disponible: true,
						descuento: {
							porcentaje: dataRetorno.descuento,
							mensaje: dataRetorno.mensaje,
							detalles: dataRetorno.detalles,
						},
					};
				}
			}
			return { disponible: true, descuento: null };
		} catch (error) {
			console.error("Error verificando disponibilidad y retorno:", error);
			return { disponible: true, descuento: null };
		} finally {
			setVerificandoDisponibilidad(false);
		}
	};

	const handleStepOneNext = async () => {
		if (!formData.origen?.trim()) return setStepError("Selecciona el origen.");
		if (!formData.destino) return setStepError("Selecciona el destino.");
		if (!formData.fecha) return setStepError("Selecciona la fecha.");
		if (!formData.hora) return setStepError("Selecciona la hora.");

		const fechaSeleccionada = new Date(`${formData.fecha}T00:00:00`);
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);

		if (fechaSeleccionada < hoy) return setStepError("La fecha no puede ser pasada.");

		if (formData.idaVuelta) {
			if (!formData.fechaRegreso) return setStepError("Selecciona la fecha de regreso.");
			const fechaRegreso = new Date(`${formData.fechaRegreso}T00:00:00`);
			if (fechaRegreso < fechaSeleccionada) return setStepError("La fecha de regreso no puede ser anterior a la ida.");
		}

		const resultado = await verificarDisponibilidadYRetorno();
		if (!resultado.disponible) {
			setStepError(resultado.mensaje || "No hay vehículos disponibles.");
			return;
		}
		setDescuentoRetorno(resultado.descuento || null);
		setStepError("");
		setCurrentStep(1);
	};

	const validarDatosReserva = () => {
		if (!formData.nombre?.trim()) return setStepError("Falta tu nombre.");
		if (!formData.email?.trim()) return setStepError("Falta tu email.");
		if (!formData.telefono?.trim()) return setStepError("Falta tu teléfono.");
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) return setStepError("Email inválido.");
		if (!validarTelefono(formData.telefono)) {
			setPhoneError("Formato inválido (ej: +56 9 1234 5678)");
			return false;
		}
		setPhoneError("");
		if (!paymentConsent) return setStepError("Debes aceptar los términos.");
		setStepError("");
		return true;
	};

	const handleGuardarReserva = async () => {
		if (!validarDatosReserva()) return;
		const result = await onSubmitWizard();
		if (!result.success) {
			setStepError(result.message || "Error al guardar.");
			return;
		}
		// alert("✅ Reserva guardada."); // Esto lo maneja el App.jsx
	};

	const handleProcesarPago = async (gateway, type) => {
		if (!validarDatosReserva()) return;
		const result = await onSubmitWizard();
		if (!result.success) {
			setStepError(result.message || "Error al procesar.");
			return;
		}
		handlePayment(gateway, type, {
			reservaId: result.reservaId,
			codigoReserva: result.codigoReserva,
		});
	};

	const handleStepBack = () => {
		setStepError("");
		setCurrentStep(0);
	};

	const paymentOptions = useMemo(
		() => [
			{
				id: "total",
				type: "total",
				title: "Pagar Total",
				amount: pricing.totalConDescuento,
				recommended: true,
			},
		],
		[pricing.totalConDescuento]
	);

	return (
		<section id="inicio" className="relative w-full min-h-screen flex flex-col lg:grid lg:grid-cols-2 bg-background">

			{/* Mobile Header (Visual) */}
			<div className="lg:hidden relative h-[30vh] w-full overflow-hidden bg-primary">
				<img
					src={selectedDestinoImage}
					alt="Destino"
					className="w-full h-full object-cover opacity-60"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
				<div className="absolute bottom-4 left-4 z-10">
					<h1 className="text-2xl font-bold text-foreground leading-tight">
						{visualText.title}
					</h1>
					<p className="text-sm text-muted-foreground font-medium">
						{visualText.subtitle}
					</p>
				</div>
			</div>

			{/* Left Panel: Interaction (Form) */}
			<div className="relative flex flex-col justify-start lg:justify-center px-6 py-8 lg:p-16 xl:p-24 overflow-y-auto bg-card z-10 -mt-6 rounded-t-[2rem] lg:mt-0 lg:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none">

				<AnimatePresence mode="wait">
					{currentStep === 0 && (
						<motion.div
							key="step0"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
							className="space-y-6 w-full max-w-lg mx-auto"
						>
							<div className="mb-6 hidden lg:block">
								<h2 className="text-4xl font-bold tracking-tight text-foreground mb-2">{visualText.title}</h2>
								<p className="text-muted-foreground text-lg">{visualText.subtitle}</p>
							</div>

							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="origen" className="text-sm font-semibold text-foreground">Origen</Label>
										<div className="relative">
											<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<select
												id="origen"
												name="origen"
												value={formData.origen}
												onChange={handleInputChange}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
											>
												{origenes.map((o) => (
													<option key={o} value={o}>{o}</option>
												))}
											</select>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="destino" className="text-sm font-semibold text-foreground">Destino</Label>
										<div className="relative">
											<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<select
												id="destino"
												name="destino"
												value={formData.destino}
												onChange={handleInputChange}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
											>
												<option value="">Seleccionar...</option>
												{destinos.map((d) => (
													<option key={d} value={d}>{d}</option>
												))}
											</select>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="fecha" className="text-sm font-semibold text-foreground">Fecha</Label>
										<div className="relative">
											<Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<input
												id="fecha"
												type="date"
												name="fecha"
												value={formData.fecha}
												onChange={handleInputChange}
												min={minDateTime}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="hora" className="text-sm font-semibold text-foreground">Hora</Label>
										<div className="relative">
											<Clock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<select
												id="hora"
												name="hora"
												value={formData.hora}
												onChange={(e) => handleInputChange({ target: { name: "hora", value: e.target.value } })}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
											>
												<option value="" disabled>Seleccionar...</option>
												{timeOptions.map((t) => (
													<option key={t.value} value={t.value}>{t.label}</option>
												))}
											</select>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="pasajeros" className="text-sm font-semibold text-foreground">Pasajeros</Label>
									<div className="relative">
										<Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
										<select
											id="pasajeros"
											name="pasajeros"
											value={formData.pasajeros}
											onChange={handleInputChange}
											className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
										>
											{[...Array(maxPasajeros)].map((_, i) => (
												<option key={i + 1} value={i + 1}>
													{i + 1} {i === 0 ? "persona" : "personas"}
												</option>
											))}
										</select>
									</div>
								</div>

								{/* Checkboxes Row with improved mobile wrapping */}
								<div className="flex flex-col sm:flex-row gap-3 pt-2">
									<div
										className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${formData.idaVuelta ? 'bg-muted border-primary' : 'border-border hover:bg-muted/50'}`}
										onClick={() => {
											const newValue = !formData.idaVuelta;
											handleInputChange({ target: { name: "idaVuelta", value: newValue } });
											if (!newValue) handleInputChange({ target: { name: "fechaRegreso", value: "" } });
											else if (formData.fecha) handleInputChange({ target: { name: "fechaRegreso", value: formData.fecha } });
										}}
									>
										<Checkbox
											id="idaVuelta"
											checked={formData.idaVuelta}
											className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
										/>
										<Label htmlFor="idaVuelta" className="cursor-pointer font-medium text-foreground">Necesito regreso</Label>
									</div>

									<div
										className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${formData.sillaInfantil ? 'bg-muted border-primary' : 'border-border hover:bg-muted/50'}`}
										onClick={() => handleInputChange({ target: { name: "sillaInfantil", value: !formData.sillaInfantil } })}
									>
										<Checkbox
											id="sillaInfantil"
											checked={formData.sillaInfantil}
											className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
										/>
										<Label htmlFor="sillaInfantil" className="cursor-pointer font-medium text-foreground">Silla de niño</Label>
									</div>
								</div>

								{formData.idaVuelta && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										className="space-y-2 pt-2"
									>
										<Label className="text-sm font-semibold text-foreground">Fecha de Regreso</Label>
										<div className="relative">
											<Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<input
												type="date"
												name="fechaRegreso"
												value={formData.fechaRegreso}
												onChange={handleInputChange}
												min={formData.fecha || minDateTime}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</motion.div>
								)}
							</div>

							{stepError && (
								<div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
									{stepError}
								</div>
							)}

							<Button
								onClick={handleStepOneNext}
								className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-bold shadow-lg transition-transform active:scale-95"
								disabled={isSubmitting || verificandoDisponibilidad}
							>
								{verificandoDisponibilidad ? (
									<LoaderCircle className="h-6 w-6 animate-spin" />
								) : (
									<span className="flex items-center gap-2">
										Reservar Ahora <ArrowRight className="h-5 w-5" />
									</span>
								)}
							</Button>
						</motion.div>
					)}

					{currentStep === 1 && (
						<motion.div
							key="step1"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							transition={{ duration: 0.3 }}
							className="space-y-6 w-full max-w-lg mx-auto"
						>
							<div className="flex items-center gap-4 mb-2">
								<Button variant="ghost" size="icon" onClick={handleStepBack} className="rounded-full hover:bg-muted">
									<ArrowLeft className="h-5 w-5" />
								</Button>
								<div>
									<h2 className="text-2xl font-bold text-foreground">Detalles y Pago</h2>
									<p className="text-sm text-muted-foreground">Completa tus datos para finalizar.</p>
								</div>
							</div>

							<div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
								<div className="flex justify-between items-start">
									<div>
										<p className="text-xs font-bold text-muted-foreground uppercase">Ruta</p>
										<p className="font-semibold text-foreground text-sm md:text-base">
											{formData.origen === "Otro" ? formData.otroOrigen : formData.origen}
											<span className="mx-2 text-muted-foreground">→</span>
											{formData.destino === "Otro" ? formData.otroDestino : formData.destino}
										</p>
									</div>
								</div>
								<div className="flex justify-between">
									<div>
										<p className="text-xs font-bold text-muted-foreground uppercase">Fecha</p>
										<p className="font-medium text-sm">{fechaLegible} - {formData.hora}</p>
									</div>
									<div className="text-right">
										<p className="text-xs font-bold text-muted-foreground uppercase">Total</p>
										<p className="font-bold text-lg text-foreground">{formatCurrency(pricing.totalConDescuento)}</p>
									</div>
								</div>
								{descuentoRetorno && (
									<div className="flex items-center gap-2 text-xs font-medium text-accent bg-accent/10 p-2 rounded-lg">
										<CheckCircle2 className="h-4 w-4" />
										¡Descuento por retorno aplicado!
									</div>
								)}
							</div>

							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="nombre" className="font-semibold text-foreground">Nombre Completo</Label>
									<Input
										id="nombre"
										name="nombre"
										value={formData.nombre}
										onChange={handleInputChange}
										placeholder="Tu nombre completo"
										className="bg-muted/50 border-input h-11"
									/>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="email" className="font-semibold text-foreground">Email</Label>
										<div className="relative">
											<Input
												id="email"
												type="email"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												onBlur={(e) => verificarReservaActiva(e.target.value)}
												placeholder="tu@email.com"
												className="bg-muted/50 border-input h-11"
											/>
											{verificandoReserva && <span className="absolute right-3 top-3 text-xs text-muted-foreground">...</span>}
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="telefono" className="font-semibold text-foreground">Teléfono</Label>
										<Input
											id="telefono"
											name="telefono"
											value={formData.telefono}
											onChange={handleInputChange}
											placeholder="+56 9 1234 5678"
											className={`bg-muted/50 border-input h-11 ${phoneError ? "border-destructive" : ""}`}
										/>
										{phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
									</div>
								</div>
							</div>

							<div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
								<Checkbox
									id="terms"
									checked={paymentConsent}
									onCheckedChange={(c) => setPaymentConsent(!!c)}
									className="mt-1 data-[state=checked]:bg-primary"
								/>
								<Label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
									Acepto los <span className="underline font-medium text-foreground">términos y condiciones</span> y la política de privacidad.
								</Label>
							</div>

							{stepError && (
								<div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
									{stepError}
								</div>
							)}

							<div className="pt-2">
								{mostrarPrecio && !requiereCotizacionManual ? (
									<Button
										onClick={() => handleProcesarPago("flow", "total")}
										disabled={isSubmitting || !!loadingGateway}
										className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-bold shadow-lg flex items-center justify-center gap-2"
									>
										{loadingGateway ? <LoaderCircle className="animate-spin" /> : (
											<>
												<CreditCard className="h-5 w-5" />
												Pagar {formatCurrency(pricing.totalConDescuento)}
											</>
										)}
									</Button>
								) : (
									<Button
										onClick={handleGuardarReserva}
										disabled={isSubmitting}
										className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-bold shadow-lg"
									>
										{isSubmitting ? <LoaderCircle className="animate-spin" /> : "Solicitar Reserva"}
									</Button>
								)}
								<p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
									<ShieldCheck className="h-3 w-3" /> Pago 100% seguro vía Flow
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Right Panel: Dynamic Visuals (Desktop) */}
			<div className="relative hidden lg:block h-full overflow-hidden bg-accent sticky top-0">
				<AnimatePresence mode="wait">
					<motion.img
						key={selectedDestinoImage}
						src={selectedDestinoImage}
						alt="Destino"
						initial={{ opacity: 0, scale: 1.1 }}
						animate={{ opacity: 0.6, scale: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 1 }}
						className="absolute inset-0 w-full h-full object-cover"
					/>
				</AnimatePresence>

				<div className="absolute inset-0 bg-gradient-to-t from-accent/90 via-accent/20 to-transparent" />

				<div className="absolute bottom-20 left-16 max-w-xl z-10">
					<motion.div
						key={visualText.title}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<h1 className="text-6xl font-bold text-primary-foreground mb-4 tracking-tight leading-none">
							{visualText.title}
						</h1>
						<p className="text-xl text-primary-foreground/90 font-medium border-l-4 border-primary-foreground pl-4">
							{visualText.subtitle}
						</p>
					</motion.div>
				</div>
			</div>
		</section>
	);
}

export default HeroExpress;
