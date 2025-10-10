import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
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
import {
	ArrowRight,
	ArrowLeft,
	Calendar,
	MapPin,
	Users,
	Clock,
	Phone,
	Mail,
	User,
	CheckCircle2,
	Sparkles,
	Car,
	AlertCircle,
} from "lucide-react";
import CodigoDescuento from "./CodigoDescuento";

// Generar opciones de hora en intervalos de 15 minutos
const generateTimeOptions = () => {
	const options = [];
	for (let hour = 6; hour <= 20; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const timeString = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
			options.push({ value: timeString, label: timeString });
		}
	}
	return options;
};

function ReservasModerno({
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
	descuentoRate,
	baseDiscountRate,
	promotionDiscountRate,
	roundTripDiscountRate,
	personalizedDiscountRate,
	activePromotion,
	reviewChecklist,
	setReviewChecklist,
	canPay,
	handlePayment,
	loadingGateway,
	setFormData,
	onSubmitWizard,
	validarTelefono,
	validarHorarioReserva,
	codigoAplicado,
	codigoError,
	validandoCodigo,
	onAplicarCodigo,
	onRemoverCodigo,
}) {
	const [currentStep, setCurrentStep] = useState(0);
	const [stepError, setStepError] = useState("");
	const [isVisible, setIsVisible] = useState(false);

	const timeOptions = useMemo(() => generateTimeOptions(), []);

	useEffect(() => {
		setIsVisible(true);
	}, []);

	useEffect(() => {
		setStepError("");
	}, [currentStep]);

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", {
				style: "currency",
				currency: "CLP",
			}),
		[]
	);

	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	const baseDiscountPercentage = Math.round(baseDiscountRate * 100);
	const promoDiscountPercentage = Math.round(promotionDiscountRate * 100);
	const roundTripDiscountPercentage = Math.round(roundTripDiscountRate * 100);
	const personalizedDiscountPercentage = Math.round(
		personalizedDiscountRate * 100
	);

	// Validaciones de cada paso
	const validateStep1 = () => {
		if (!formData.origen?.trim()) {
			setStepError("Indica el origen de tu viaje.");
			return false;
		}
		if (!formData.destino) {
			setStepError("Selecciona un destino para continuar.");
			return false;
		}
		if (!formData.fecha) {
			setStepError("Selecciona la fecha de tu traslado.");
			return false;
		}
		if (!formData.hora) {
			setStepError("Selecciona la hora de recogida.");
			return false;
		}
		const validacion = validarHorarioReserva();
		if (!validacion.esValido) {
			setStepError(validacion.mensaje);
			return false;
		}
		return true;
	};

	const validateStep2 = () => {
		if (!formData.nombre?.trim()) {
			setStepError("Ingresa tu nombre completo.");
			return false;
		}
		if (!formData.telefono?.trim()) {
			setStepError("Ingresa tu número de teléfono.");
			return false;
		}
		const telefonoValido = validarTelefono(formData.telefono);
		if (!telefonoValido) {
			setStepError("El formato del teléfono no es válido.");
			return false;
		}
		if (!formData.email?.trim()) {
			setStepError("Ingresa tu correo electrónico.");
			return false;
		}
		return true;
	};

	const handleNext = () => {
		let isValid = false;
		if (currentStep === 0) {
			isValid = validateStep1();
		} else if (currentStep === 1) {
			isValid = validateStep2();
		}

		if (isValid) {
			setCurrentStep((prev) => Math.min(prev + 1, 2));
		}
	};

	const handleBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	};

	const steps = [
		{
			title: "Viaje",
			icon: MapPin,
			description: "Origen y destino",
		},
		{
			title: "Contacto",
			icon: User,
			description: "Tus datos",
		},
		{
			title: "Confirmar",
			icon: CheckCircle2,
			description: "Revisar y reservar",
		},
	];

	const origenFinal =
		formData.origen === "Otro"
			? formData.otroOrigen || "Por confirmar"
			: formData.origen || "Por confirmar";
	const destinoFinal =
		formData.destino === "Otro"
			? formData.otroDestino || "Por confirmar"
			: formData.destino || "Por confirmar";

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

	const slideVariants = {
		enter: (direction) => ({
			x: direction > 0 ? 300 : -300,
			opacity: 0,
		}),
		center: {
			x: 0,
			opacity: 1,
		},
		exit: (direction) => ({
			x: direction < 0 ? 300 : -300,
			opacity: 0,
		}),
	};

	const [direction, setDirection] = useState(0);

	const paginate = (newDirection) => {
		setDirection(newDirection);
	};

	return (
		<section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-12 px-4">
			<div className="container mx-auto max-w-6xl">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-12"
				>
					<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
						Reserva tu traslado
						<Sparkles className="inline-block ml-3 h-10 w-10 text-amber-500" />
					</h1>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Proceso simple y rápido. Completa los pasos y confirma tu reserva en
						minutos.
					</p>

					{/* Badges de descuentos */}
					<div className="flex flex-wrap justify-center gap-3 mt-6">
						{baseDiscountPercentage > 0 && (
							<Badge
								variant="secondary"
								className="text-base px-4 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200"
							>
								💰 {baseDiscountPercentage}% Descuento Online
							</Badge>
						)}
						{promoDiscountPercentage > 0 && (
							<Badge
								variant="default"
								className="text-base px-4 py-2 bg-emerald-500 text-white"
							>
								🎉 +{promoDiscountPercentage}% Promoción
							</Badge>
						)}
						{roundTripDiscountPercentage > 0 && (
							<Badge
								variant="default"
								className="text-base px-4 py-2 bg-purple-500 text-white"
							>
								🔄 +{roundTripDiscountPercentage}% Ida y vuelta
							</Badge>
						)}
					</div>
				</motion.div>

				{/* Progress Steps */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="mb-12"
				>
					<div className="flex items-center justify-center gap-4">
						{steps.map((step, index) => {
							const Icon = step.icon;
							const isActive = index === currentStep;
							const isCompleted = index < currentStep;

							return (
								<React.Fragment key={index}>
									<div className="flex flex-col items-center">
										<motion.div
											initial={false}
											animate={{
												scale: isActive ? 1.1 : 1,
												backgroundColor: isCompleted
													? "#10b981"
													: isActive
													? "#3b82f6"
													: "#e5e7eb",
											}}
											transition={{ duration: 0.3 }}
											className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
												isCompleted || isActive
													? "text-white"
													: "text-gray-400"
											}`}
										>
											{isCompleted ? (
												<CheckCircle2 className="h-8 w-8" />
											) : (
												<Icon className="h-8 w-8" />
											)}
										</motion.div>
										<span
											className={`text-sm font-medium ${
												isActive
													? "text-blue-600"
													: isCompleted
													? "text-emerald-600"
													: "text-gray-400"
											}`}
										>
											{step.title}
										</span>
										<span className="text-xs text-gray-500">
											{step.description}
										</span>
									</div>
									{index < steps.length - 1 && (
										<div
											className={`h-0.5 w-16 md:w-24 transition-colors duration-300 ${
												isCompleted ? "bg-emerald-500" : "bg-gray-300"
											}`}
										/>
									)}
								</React.Fragment>
							);
						})}
					</div>
				</motion.div>

				{/* Main Card with Steps */}
				<Card className="bg-white shadow-2xl border-0 overflow-hidden">
					<CardContent className="p-8 md:p-12">
						<AnimatePresence initial={false} custom={direction} mode="wait">
							<motion.div
								key={currentStep}
								custom={direction}
								variants={slideVariants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{
									x: { type: "spring", stiffness: 300, damping: 30 },
									opacity: { duration: 0.2 },
								}}
							>
								{/* Step 1: Viaje */}
								{currentStep === 0 && (
									<div className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											{/* Origen */}
											<div className="space-y-2">
												<Label
													htmlFor="origen"
													className="text-base font-semibold flex items-center gap-2"
												>
													<MapPin className="h-5 w-5 text-blue-600" />
													Origen
												</Label>
												<Select
													value={formData.origen}
													onValueChange={(value) =>
														handleInputChange({
															target: { name: "origen", value },
														})
													}
												>
													<SelectTrigger className="h-12 text-base">
														<SelectValue placeholder="Selecciona el origen" />
													</SelectTrigger>
													<SelectContent>
														{origenes.map((origen) => (
															<SelectItem key={origen} value={origen}>
																{origen}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											{/* Destino */}
											<div className="space-y-2">
												<Label
													htmlFor="destino"
													className="text-base font-semibold flex items-center gap-2"
												>
													<MapPin className="h-5 w-5 text-emerald-600" />
													Destino
												</Label>
												<Select
													value={formData.destino}
													onValueChange={(value) =>
														handleInputChange({
															target: { name: "destino", value },
														})
													}
												>
													<SelectTrigger className="h-12 text-base">
														<SelectValue placeholder="Selecciona el destino" />
													</SelectTrigger>
													<SelectContent>
														{destinos.map((destino) => (
															<SelectItem key={destino} value={destino}>
																{destino}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											{/* Fecha */}
											<div className="space-y-2">
												<Label
													htmlFor="fecha"
													className="text-base font-semibold flex items-center gap-2"
												>
													<Calendar className="h-5 w-5 text-purple-600" />
													Fecha
												</Label>
												<Input
													type="date"
													id="fecha"
													name="fecha"
													value={formData.fecha}
													onChange={handleInputChange}
													min={minDateTime}
													className="h-12 text-base"
												/>
											</div>

											{/* Hora */}
											<div className="space-y-2">
												<Label
													htmlFor="hora"
													className="text-base font-semibold flex items-center gap-2"
												>
													<Clock className="h-5 w-5 text-amber-600" />
													Hora
												</Label>
												<Select
													value={formData.hora}
													onValueChange={(value) =>
														handleInputChange({
															target: { name: "hora", value },
														})
													}
												>
													<SelectTrigger className="h-12 text-base">
														<SelectValue placeholder="Selecciona la hora" />
													</SelectTrigger>
													<SelectContent>
														{timeOptions.map((time) => (
															<SelectItem key={time.value} value={time.value}>
																{time.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											{/* Pasajeros */}
											<div className="space-y-2">
												<Label
													htmlFor="pasajeros"
													className="text-base font-semibold flex items-center gap-2"
												>
													<Users className="h-5 w-5 text-indigo-600" />
													Pasajeros
												</Label>
												<Input
													type="number"
													id="pasajeros"
													name="pasajeros"
													value={formData.pasajeros}
													onChange={handleInputChange}
													min="1"
													max={maxPasajeros}
													className="h-12 text-base"
												/>
											</div>

											{/* Tipo de viaje */}
											<div className="space-y-2">
												<Label
													htmlFor="tipoViaje"
													className="text-base font-semibold flex items-center gap-2"
												>
													<Car className="h-5 w-5 text-rose-600" />
													Tipo de viaje
												</Label>
												<Select
													value={formData.tipoViaje}
													onValueChange={(value) =>
														handleInputChange({
															target: { name: "tipoViaje", value },
														})
													}
												>
													<SelectTrigger className="h-12 text-base">
														<SelectValue placeholder="Selecciona tipo" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="ida">Solo ida</SelectItem>
														<SelectItem value="vuelta">Solo vuelta</SelectItem>
														<SelectItem value="ida-vuelta">
															Ida y vuelta
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
									</div>
								)}

								{/* Step 2: Contacto */}
								{currentStep === 1 && (
									<div className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											{/* Nombre */}
											<div className="space-y-2">
												<Label
													htmlFor="nombre"
													className="text-base font-semibold flex items-center gap-2"
												>
													<User className="h-5 w-5 text-blue-600" />
													Nombre completo
												</Label>
												<Input
													type="text"
													id="nombre"
													name="nombre"
													value={formData.nombre}
													onChange={handleInputChange}
													placeholder="Juan Pérez"
													className="h-12 text-base"
												/>
											</div>

											{/* Teléfono */}
											<div className="space-y-2">
												<Label
													htmlFor="telefono"
													className="text-base font-semibold flex items-center gap-2"
												>
													<Phone className="h-5 w-5 text-emerald-600" />
													Teléfono
												</Label>
												<Input
													type="tel"
													id="telefono"
													name="telefono"
													value={formData.telefono}
													onChange={handleInputChange}
													placeholder="+56 9 1234 5678"
													className="h-12 text-base"
												/>
												{phoneError && (
													<p className="text-sm text-red-600">{phoneError}</p>
												)}
											</div>

											{/* Email */}
											<div className="space-y-2 md:col-span-2">
												<Label
													htmlFor="email"
													className="text-base font-semibold flex items-center gap-2"
												>
													<Mail className="h-5 w-5 text-purple-600" />
													Email
												</Label>
												<Input
													type="email"
													id="email"
													name="email"
													value={formData.email}
													onChange={handleInputChange}
													placeholder="correo@ejemplo.com"
													className="h-12 text-base"
												/>
											</div>

											{/* Comentarios */}
											<div className="space-y-2 md:col-span-2">
												<Label htmlFor="comentarios" className="text-base font-semibold">
													Comentarios adicionales (opcional)
												</Label>
												<Textarea
													id="comentarios"
													name="comentarios"
													value={formData.comentarios}
													onChange={handleInputChange}
													placeholder="Equipaje adicional, necesidades especiales, etc."
													rows={4}
													className="text-base resize-none"
												/>
											</div>
										</div>
									</div>
								)}

								{/* Step 3: Confirmar */}
								{currentStep === 2 && (
									<div className="space-y-8">
										{/* Resumen del viaje */}
										<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 space-y-4">
											<h3 className="text-xl font-bold text-gray-900 mb-4">
												📋 Resumen de tu reserva
											</h3>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="flex items-start gap-3">
													<MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
													<div>
														<p className="text-sm text-gray-600">Ruta</p>
														<p className="font-semibold text-gray-900">
															{origenFinal} → {destinoFinal}
														</p>
													</div>
												</div>
												<div className="flex items-start gap-3">
													<Calendar className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
													<div>
														<p className="text-sm text-gray-600">Fecha y hora</p>
														<p className="font-semibold text-gray-900">
															{fechaLegible}
														</p>
														<p className="text-sm text-gray-700">
															{formData.hora} hrs
														</p>
													</div>
												</div>
												<div className="flex items-start gap-3">
													<Users className="h-5 w-5 text-indigo-600 mt-1 flex-shrink-0" />
													<div>
														<p className="text-sm text-gray-600">Pasajeros</p>
														<p className="font-semibold text-gray-900">
															{formData.pasajeros || 1} persona(s)
														</p>
													</div>
												</div>
												<div className="flex items-start gap-3">
													<Car className="h-5 w-5 text-rose-600 mt-1 flex-shrink-0" />
													<div>
														<p className="text-sm text-gray-600">Tipo de viaje</p>
														<p className="font-semibold text-gray-900">
															{formData.tipoViaje === "ida-vuelta"
																? "Ida y vuelta"
																: formData.tipoViaje === "ida"
																? "Solo ida"
																: "Solo vuelta"}
														</p>
													</div>
												</div>
											</div>
										</div>

										{/* Datos de contacto */}
										<div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 space-y-4">
											<h3 className="text-xl font-bold text-gray-900 mb-4">
												👤 Datos de contacto
											</h3>
											<div className="space-y-3">
												<p className="text-gray-900">
													<span className="font-semibold">Nombre:</span>{" "}
													{formData.nombre}
												</p>
												<p className="text-gray-900">
													<span className="font-semibold">Teléfono:</span>{" "}
													{formData.telefono}
												</p>
												<p className="text-gray-900">
													<span className="font-semibold">Email:</span>{" "}
													{formData.email}
												</p>
												{formData.comentarios && (
													<p className="text-gray-900">
														<span className="font-semibold">Comentarios:</span>{" "}
														{formData.comentarios}
													</p>
												)}
											</div>
										</div>

										{/* Código de descuento */}
										<div>
											<CodigoDescuento
												codigoAplicado={codigoAplicado}
												codigoError={codigoError}
												validandoCodigo={validandoCodigo}
												onAplicarCodigo={onAplicarCodigo}
												onRemoverCodigo={onRemoverCodigo}
											/>
										</div>

										{/* Precio */}
										{mostrarPrecio && (
											<div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6">
												<h3 className="text-xl font-bold text-gray-900 mb-4">
													💰 Detalle del precio
												</h3>
												<div className="space-y-3">
													{cotizacion.precioOriginal &&
														cotizacion.precioOriginal > cotizacion.precio && (
															<div className="flex justify-between text-gray-600">
																<span>Precio original:</span>
																<span className="line-through">
																	{formatCurrency(cotizacion.precioOriginal)}
																</span>
															</div>
														)}
													<div className="flex justify-between items-center text-2xl font-bold text-gray-900 border-t-2 border-amber-200 pt-3">
														<span>Total a pagar:</span>
														<span className="text-emerald-600">
															{formatCurrency(cotizacion.precio)}
														</span>
													</div>
													{descuentoRate > 0 && (
														<p className="text-sm text-emerald-700 bg-emerald-100 p-3 rounded-lg">
															✨ Ahorro total:{" "}
															{Math.round(descuentoRate * 100)}%
														</p>
													)}
												</div>
											</div>
										)}

										{requiereCotizacionManual && (
											<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
												<div className="flex items-start gap-3">
													<AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
													<div>
														<h4 className="font-semibold text-blue-900">
															Cotización personalizada
														</h4>
														<p className="text-sm text-blue-800 mt-1">
															Te contactaremos para confirmar el precio exacto
															según tu ruta.
														</p>
													</div>
												</div>
											</div>
										)}

										{/* Checkboxes de revisión */}
										<div className="space-y-3 bg-gray-50 p-6 rounded-xl">
											<div className="flex items-start gap-3">
												<Checkbox
													id="viaje-check"
													checked={reviewChecklist.viaje}
													onCheckedChange={(checked) =>
														setReviewChecklist((prev) => ({
															...prev,
															viaje: checked,
														}))
													}
												/>
												<Label
													htmlFor="viaje-check"
													className="text-sm leading-relaxed cursor-pointer"
												>
													Confirmo que los datos del viaje (origen, destino,
													fecha y hora) son correctos.
												</Label>
											</div>
											<div className="flex items-start gap-3">
												<Checkbox
													id="contacto-check"
													checked={reviewChecklist.contacto}
													onCheckedChange={(checked) =>
														setReviewChecklist((prev) => ({
															...prev,
															contacto: checked,
														}))
													}
												/>
												<Label
													htmlFor="contacto-check"
													className="text-sm leading-relaxed cursor-pointer"
												>
													Confirmo que mis datos de contacto son correctos y
													acepto recibir confirmación por WhatsApp y correo.
												</Label>
											</div>
										</div>

										{/* Botón de reservar */}
										<Button
											onClick={onSubmitWizard}
											disabled={
												!reviewChecklist.viaje ||
												!reviewChecklist.contacto ||
												isSubmitting
											}
											className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
										>
											{isSubmitting ? (
												<>
													<motion.div
														animate={{ rotate: 360 }}
														transition={{
															duration: 1,
															repeat: Infinity,
															ease: "linear",
														}}
													>
														⏳
													</motion.div>
													<span className="ml-2">Procesando...</span>
												</>
											) : (
												<>
													<CheckCircle2 className="h-6 w-6 mr-2" />
													Confirmar reserva
												</>
											)}
										</Button>
									</div>
								)}
							</motion.div>
						</AnimatePresence>

						{/* Error message */}
						{stepError && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
							>
								<div className="flex items-start gap-3">
									<AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
									<p className="text-sm text-red-800">{stepError}</p>
								</div>
							</motion.div>
						)}

						{/* Navigation buttons */}
						{currentStep < 2 && (
							<div className="flex justify-between gap-4 mt-8">
								{currentStep > 0 && (
									<Button
										onClick={() => {
											handleBack();
											paginate(-1);
										}}
										variant="outline"
										className="flex-1 h-12 text-base font-semibold"
									>
										<ArrowLeft className="h-5 w-5 mr-2" />
										Anterior
									</Button>
								)}
								<Button
									onClick={() => {
										handleNext();
										paginate(1);
									}}
									className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
								>
									Siguiente
									<ArrowRight className="h-5 w-5 ml-2" />
								</Button>
							</div>
						)}

						{currentStep === 2 && (
							<Button
								onClick={() => {
									handleBack();
									paginate(-1);
								}}
								variant="outline"
								className="w-full h-12 mt-4 text-base font-semibold"
							>
								<ArrowLeft className="h-5 w-5 mr-2" />
								Volver a editar
							</Button>
						)}
					</CardContent>
				</Card>

				{/* Footer info */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="text-center mt-8 text-gray-600"
				>
					<p className="text-sm">
						🔒 Tus datos están protegidos • ⚡ Respuesta en menos de 24 horas
					</p>
				</motion.div>
			</div>
		</section>
	);
}

export default ReservasModerno;
