import React, { useMemo, useState } from "react";
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
import { LoaderCircle, ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import heroVan from "../assets/hero-van.png";
import { getBackendUrl } from "../lib/backend";

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
	const [selectedPaymentType, setSelectedPaymentType] = useState(null); // 'abono' o 'total'
	const [reservaActiva, setReservaActiva] = useState(null); // Reserva activa sin pagar encontrada
	const [verificandoReserva, setVerificandoReserva] = useState(false);
	const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
	const [descuentoRetorno, setDescuentoRetorno] = useState(null); // Información de descuento por retorno

	// Generar opciones de tiempo en intervalos de 15 minutos
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

	// Verificar si el email tiene una reserva activa sin pagar
	const verificarReservaActiva = async (email) => {
		if (!email || !email.trim()) {
			setReservaActiva(null);
			return;
		}

		setVerificandoReserva(true);
		try {
			const apiUrl =
				getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(
				`${apiUrl}/api/reservas/verificar-activa/${encodeURIComponent(
					email.trim()
				)}`
			);

			if (response.ok) {
				const data = await response.json();
				if (data.tieneReservaActiva) {
					setReservaActiva(data.reserva);
				} else {
					setReservaActiva(null);
				}
			}
		} catch (error) {
			console.error("Error verificando reserva activa:", error);
			setReservaActiva(null);
		} finally {
			setVerificandoReserva(false);
		}
	};

	// Verificar disponibilidad y buscar oportunidades de retorno
	const verificarDisponibilidadYRetorno = async () => {
		if (!formData.destino || !formData.fecha || !formData.hora) {
			return { disponible: true, descuento: null };
		}

		setVerificandoDisponibilidad(true);
		try {
			// Buscar el destino seleccionado para obtener la duración estimada
			const destinoSeleccionado = destinos.find(
				(d) => d.nombre === formData.destino
			);
			const duracionMinutos = destinoSeleccionado?.duracionIdaMinutos || 60;

			// 1. Verificar disponibilidad de vehículos
			const respDisponibilidad = await fetch(
				`${getBackendUrl()}/api/disponibilidad/verificar`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						fecha: formData.fecha,
						hora: formData.hora,
						duracionMinutos: duracionMinutos,
						pasajeros: formData.pasajeros || 1,
					}),
				}
			);

			if (!respDisponibilidad.ok) {
				return { disponible: true, descuento: null };
			}

			const dataDisponibilidad = await respDisponibilidad.json();

			if (!dataDisponibilidad.disponible) {
				return {
					disponible: false,
					mensaje: dataDisponibilidad.mensaje,
					descuento: null,
				};
			}

			// 2. Buscar oportunidades de retorno
			const respRetorno = await fetch(
				`${getBackendUrl()}/api/disponibilidad/oportunidades-retorno`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
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

	// Validaciones del primer paso
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

		if (resultado.descuento) {
			setDescuentoRetorno(resultado.descuento);
		} else {
			setDescuentoRetorno(null);
		}

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
		} else {
			setPhoneError("");
		}

		if (!paymentConsent) return setStepError("Acepta los términos.");

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
		alert("✅ Reserva guardada. Revisa tu email para pagar después.");
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

	const handleStepBack = () => setCurrentStep(0);

	const paymentOptions = useMemo(
		() => [
			{
				id: "abono",
				type: "abono",
				title: "Abonar 40%",
				amount: pricing.abono,
				recommended: true,
			},
			{
				id: "total",
				type: "total",
				title: "Pagar 100%",
				amount: pricing.totalConDescuento,
			},
		],
		[pricing.abono, pricing.totalConDescuento]
	);

	const todosLosCamposCompletos = useMemo(() => {
		if (currentStep !== 1) return false;
		return (
			formData.nombre?.trim().length > 0 &&
			formData.email?.trim().length > 0 &&
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
			formData.telefono?.trim().length > 0 &&
			paymentConsent
		);
	}, [currentStep, formData, paymentConsent]);

        return (
                <section
                        id="inicio"
                        className="flex flex-col lg:flex-row min-h-screen w-full bg-white overflow-hidden lg:rounded-3xl shadow-xl xl:max-w-6xl xl:mx-auto"
                >
                        {/* Left Panel - Visual & Branding */}
                        <div className="relative w-full lg:w-[36%] xl:w-[34%] lg:max-w-[520px] h-48 lg:h-auto bg-zinc-900 flex-shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-900/45 to-zinc-950/70 z-10"></div>
                                <img
                                        src={heroVan}
                                        alt="Transporte Privado"
                                        className="absolute inset-0 w-full h-full object-cover opacity-80 grayscale-[30%]"
                                />
				<div className="absolute inset-0 z-20 flex flex-col justify-center lg:justify-end p-6 lg:p-12 text-white">
					<div className="max-w-md">
						<h1 className="text-3xl lg:text-5xl font-bold tracking-tight mb-3 text-shadow">
							Tu viaje comienza aquí.
						</h1>
						<p className="text-lg text-white/90 font-medium hidden lg:block">
							Conecta con Pucón, Villarrica y toda la región. Sin esperas, sin escalas.
						</p>
						<div className="flex gap-3 mt-6 lg:hidden">
							{/* Mobile Quick Stats or badges could go here */}
							<Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-0">
								Disponible 24/7
							</Badge>
						</div>
					</div>
				</div>
			</div>

                        {/* Right Panel - Booking Form */}
                        <div className="w-full lg:w-[64%] xl:w-[66%] flex flex-col bg-white relative">
                                <div className="flex-1 p-6 md:p-12 lg:p-16 max-w-2xl mx-auto w-full flex flex-col justify-center">

					{/* Header Form */}
					<div className="mb-8 space-y-2">
						<div className="flex items-center justify-between">
							<h2 className="text-2xl font-semibold text-zinc-900">
								{currentStep === 0 ? "Reserva tu traslado" : "Finaliza tu reserva"}
							</h2>
							<div className="text-sm font-medium text-zinc-400">
								Paso {currentStep + 1} de 2
							</div>
						</div>
						<div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
							<div
								className="h-full bg-zinc-900 transition-all duration-500 ease-out"
								style={{ width: currentStep === 0 ? '50%' : '100%' }}
							></div>
						</div>
					</div>

					{/* Form Step 1 */}
					{currentStep === 0 && (
						<div className="space-y-6 animate-fade-in-down">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="space-y-1.5">
									<Label htmlFor="hero-origen" className="text-zinc-600 font-normal">Origen</Label>
									<div className="relative">
										<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
										<select
											id="hero-origen"
											name="origen"
											value={formData.origen}
											onChange={handleInputChange}
											className="flex h-11 w-full items-center justify-between rounded-md border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 appearance-none"
										>
											{origenes.map((origen) => (
												<option key={origen} value={origen}>{origen}</option>
											))}
										</select>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="hero-destino" className="text-zinc-600 font-normal">Destino</Label>
									<div className="relative">
										<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
										<select
											id="hero-destino"
											name="destino"
											value={formData.destino}
											onChange={handleInputChange}
											className="flex h-11 w-full items-center justify-between rounded-md border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 appearance-none"
										>
											<option value="">Seleccionar destino</option>
											{destinos.map((d) => (
												<option key={d} value={d}>{d}</option>
											))}
										</select>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="hero-fecha" className="text-zinc-600 font-normal">Fecha</Label>
									<Input
										id="hero-fecha"
										type="date"
										name="fecha"
										value={formData.fecha}
										onChange={handleInputChange}
										min={minDateTime}
										className="h-11 border-zinc-200 focus:ring-zinc-900 pl-3"
									/>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="hero-hora" className="text-zinc-600 font-normal">Hora</Label>
									<Select
										value={formData.hora}
										onValueChange={(value) => handleInputChange({ target: { name: "hora", value } })}
									>
										<SelectTrigger id="hero-hora" className="h-11 border-zinc-200 focus:ring-zinc-900">
											<SelectValue placeholder="Seleccionar hora" />
										</SelectTrigger>
										<SelectContent>
											{timeOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="hero-pasajeros" className="text-zinc-600 font-normal">Pasajeros</Label>
									<select
										id="hero-pasajeros"
										name="pasajeros"
										value={formData.pasajeros}
										onChange={handleInputChange}
										className="flex h-11 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0"
									>
										{[...Array(maxPasajeros)].map((_, i) => (
											<option key={i + 1} value={i + 1}>
												{i + 1} {i === 0 ? "persona" : "personas"}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Round Trip Toggle */}
							<div className="flex items-center space-x-3 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
								<Checkbox
									id="hero-idaVuelta"
									checked={formData.idaVuelta}
									onCheckedChange={(value) => {
										const isRoundTrip = Boolean(value);
										handleInputChange({ target: { name: "idaVuelta", value: isRoundTrip } });
										if (!isRoundTrip) handleInputChange({ target: { name: "fechaRegreso", value: "" } });
										else if (formData.fecha) handleInputChange({ target: { name: "fechaRegreso", value: formData.fecha } });
									}}
									className="data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900"
								/>
								<div className="flex-1">
									<label htmlFor="hero-idaVuelta" className="text-sm font-medium text-zinc-900 cursor-pointer select-none">
										Añadir regreso
									</label>
									{formData.idaVuelta && (
										<div className="mt-3">
											<Label htmlFor="hero-fechaRegreso" className="sr-only">Fecha regreso</Label>
											<Input
												id="hero-fechaRegreso"
												type="date"
												name="fechaRegreso"
												value={formData.fechaRegreso}
												onChange={handleInputChange}
												min={formData.fecha || minDateTime}
												className="h-10 bg-white border-zinc-200"
											/>
										</div>
									)}
								</div>
							</div>

							{/* Dynamic Pricing Display */}
							{mostrarPrecio && (
								<div className="mt-6 p-5 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-between">
									<div>
										<p className="text-sm text-zinc-500">Total estimado</p>
										<div className="flex items-baseline gap-2">
											<span className="text-3xl font-bold text-zinc-900 tracking-tight">
												{formatCurrency(pricing.totalConDescuento)}
											</span>
											{pricing.totalConDescuento < pricing.precioBase && (
												<span className="text-sm text-zinc-400 line-through">
													{formatCurrency(pricing.precioBase)}
												</span>
											)}
										</div>
										{pricing.descuentoBase > 0 && (
											<Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200 font-normal">
												Ahorras {formatCurrency(pricing.precioBase - pricing.totalConDescuento)}
											</Badge>
										)}
									</div>
									{/* Return Discount Alert */}
									{descuentoRetorno && (
										<div className="hidden sm:block text-right">
											<Badge className="bg-green-600 hover:bg-green-700">
												¡Oportunidad de Retorno!
											</Badge>
										</div>
									)}
								</div>
							)}

							{stepError && (
								<p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-md">
									{stepError}
								</p>
							)}

							<Button
								onClick={handleStepOneNext}
								className="w-full h-12 text-base bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/10 transition-all duration-300"
								disabled={isSubmitting || verificandoDisponibilidad}
							>
								{verificandoDisponibilidad ? (
									<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<>
										Continuar <ArrowRight className="ml-2 h-4 w-4" />
									</>
								)}
							</Button>
						</div>
					)}

					{/* Form Step 2 */}
					{currentStep === 1 && (
						<div className="space-y-6 animate-fade-in-down">
							{/* Summary Card */}
							<div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100 text-sm text-zinc-600 flex justify-between items-start">
								<div>
									<p className="font-medium text-zinc-900">
										{formData.origen === "Otro" ? formData.otroOrigen : formData.origen} → {formData.destino === "Otro" ? formData.otroDestino : formData.destino}
									</p>
									<p className="mt-1">
										{fechaLegible} • {formData.hora} • {formData.pasajeros} pax
									</p>
									{formData.idaVuelta && (
										<p className="text-zinc-500 mt-1">+ Regreso el {new Date(formData.fechaRegreso).toLocaleDateString("es-CL")}</p>
									)}
								</div>
								<Button variant="ghost" size="sm" onClick={handleStepBack} className="h-auto p-0 text-zinc-400 hover:text-zinc-900 hover:bg-transparent">
									Editar
								</Button>
							</div>

							<div className="grid gap-5">
								<div className="space-y-1.5">
									<Label htmlFor="hero-nombre" className="text-zinc-600 font-normal">Nombre completo</Label>
									<Input
										id="hero-nombre"
										name="nombre"
										value={formData.nombre}
										onChange={handleInputChange}
										className="h-11 border-zinc-200 focus:ring-zinc-900"
										placeholder="Como aparece en tu ID"
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									<div className="space-y-1.5">
										<Label htmlFor="hero-email" className="text-zinc-600 font-normal">Email</Label>
										<Input
											id="hero-email"
											type="email"
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											onBlur={(e) => verificarReservaActiva(e.target.value)}
											className="h-11 border-zinc-200 focus:ring-zinc-900"
										/>
										{verificandoReserva && <span className="text-xs text-zinc-400">Verificando...</span>}
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="hero-telefono" className="text-zinc-600 font-normal">Teléfono</Label>
										<Input
											id="hero-telefono"
											name="telefono"
											value={formData.telefono}
											onChange={handleInputChange}
											className="h-11 border-zinc-200 focus:ring-zinc-900"
											placeholder="+56 9 ..."
										/>
										{phoneError && <span className="text-xs text-red-500">{phoneError}</span>}
									</div>
								</div>
							</div>

							{/* Payment Consent */}
							<div className="flex items-start space-x-3 pt-2">
								<Checkbox
									id="hero-payment-consent"
									checked={paymentConsent}
									onCheckedChange={(value) => setPaymentConsent(Boolean(value))}
									className="mt-1 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900"
								/>
								<label htmlFor="hero-payment-consent" className="text-xs text-zinc-500 leading-snug cursor-pointer">
									Acepto recibir la confirmación y entiendo que podré ajustar detalles después del pago.
								</label>
							</div>

							{/* Action Buttons */}
							{mostrarPrecio && !requiereCotizacionManual && todosLosCamposCompletos ? (
								<div className="space-y-3 pt-2">
									{!selectedPaymentType ? (
										<div className="grid grid-cols-2 gap-3">
											{paymentOptions.map((option) => (
												<button
													key={option.id}
													type="button"
													onClick={() => setSelectedPaymentType(option.type)}
													className={`p-3 rounded-lg border text-left transition-all ${
														option.recommended
															? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
															: "border-zinc-200 hover:border-zinc-400"
													}`}
												>
													<div className="text-xs text-zinc-500 mb-1">{option.title}</div>
													<div className="font-bold text-zinc-900">{formatCurrency(option.amount)}</div>
												</button>
											))}
										</div>
									) : (
										<div className="space-y-3">
											<div className="flex items-center justify-between text-sm bg-zinc-50 p-3 rounded-md">
												<span>Pagar: <strong>{formatCurrency(selectedPaymentType === 'total' ? pricing.totalConDescuento : pricing.abono)}</strong></span>
												<button onClick={() => setSelectedPaymentType(null)} className="text-zinc-500 underline text-xs">Cambiar</button>
											</div>
											<Button
												type="button"
												onClick={() => handleProcesarPago("flow", selectedPaymentType)}
												disabled={isSubmitting || !!loadingGateway}
												className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white"
											>
												{loadingGateway ? <LoaderCircle className="animate-spin" /> : "Ir a Pagar (Webpay/Tarjetas)"}
											</Button>
										</div>
									)}
								</div>
							) : (
								<div className="space-y-3 pt-2">
									{todosLosCamposCompletos ? (
										<Button
											onClick={handleGuardarReserva}
											className="w-full h-12 bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-50"
											disabled={isSubmitting}
										>
											{isSubmitting ? <LoaderCircle className="animate-spin" /> : "Guardar y Pagar Después"}
										</Button>
									) : (
										<div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-md">
											Completa todos los campos para ver opciones de pago.
										</div>
									)}
								</div>
							)}

							{stepError && (
								<p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-md">
									{stepError}
								</p>
							)}

							<Button variant="ghost" onClick={handleStepBack} className="w-full text-zinc-500 hover:text-zinc-900 hover:bg-transparent h-auto py-2">
								<ArrowLeft className="mr-2 h-4 w-4" /> Volver
							</Button>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

export default HeroExpress;
