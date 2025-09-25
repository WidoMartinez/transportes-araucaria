import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import heroVan from "../assets/hero-van.png";

function Hero({
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
	descuentoRate,
	onSubmitWizard,
	validarTelefono,
	validarHorarioReserva,
	showSummary,
}) {
	const [currentStep, setCurrentStep] = useState(0);
	const [stepError, setStepError] = useState("");

	const steps = useMemo(
		() => [
			{
				title: "1. Tu viaje",
				description: "Selecciona origen, destino, fecha y pasajeros.",
			},
			{
				title: "2. Tus datos",
				description: "Completa la información de contacto y extras.",
			},
			{
				title: "3. Revisar y pagar",
				description: "Confirma el resumen y paga online con descuento.",
			},
		],
		[]
	);

	const progressValue = useMemo(() => {
		const safeStep = Math.min(currentStep, steps.length - 1);
		return Math.round(((safeStep + 1) / steps.length) * 100);
	}, [currentStep, steps.length]);

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", {
				style: "currency",
				currency: "CLP",
			}),
		[]
	);

	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	useEffect(() => {
		if (showSummary) {
			setCurrentStep(2);
		}
	}, [showSummary]);

	useEffect(() => {
		if (
			!showSummary &&
			!formData.destino &&
			!formData.fecha &&
			!formData.nombre &&
			!formData.telefono
		) {
			setCurrentStep(0);
		}
	}, [
		showSummary,
		formData.destino,
		formData.fecha,
		formData.nombre,
		formData.telefono,
	]);

	useEffect(() => {
		setStepError("");
	}, [currentStep]);

	const handleStepOneNext = () => {
		if (!formData.origen.trim()) {
			setStepError("Indica el origen de tu viaje.");
			return;
		}

		if (!formData.destino) {
			setStepError("Selecciona un destino para continuar.");
			return;
		}

		if (!formData.fecha) {
			setStepError("Selecciona la fecha de tu traslado.");
			return;
		}

		if (!formData.hora) {
			setStepError("Selecciona la hora de recogida.");
			return;
		}

		const validacion = validarHorarioReserva();
		if (!validacion.esValido) {
			setStepError(validacion.mensaje);
			return;
		}

		setStepError("");
		setCurrentStep(1);
	};

	const handleStepTwoNext = async () => {
		if (!formData.nombre.trim()) {
			setStepError("Ingresa el nombre del pasajero principal.");
			return;
		}

		if (!formData.email.trim()) {
			setStepError(
				"Necesitamos un correo electrónico para enviar la confirmación."
			);
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setStepError("El correo electrónico ingresado no es válido.");
			return;
		}

		if (!formData.telefono.trim()) {
			setStepError("Indica un teléfono móvil de contacto.");
			return;
		}

		if (!validarTelefono(formData.telefono)) {
			setPhoneError(
				"Por favor, introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
			);
			setStepError("Revisa el número de teléfono antes de continuar.");
			return;
		}

		setPhoneError("");
		setStepError("");

		const result = await onSubmitWizard();

		if (!result.success) {
			if (result.error === "horario" && result.message) {
				setStepError(result.message);
				setCurrentStep(0);
			} else if (result.error === "server" && result.message) {
				setStepError(`No pudimos enviar tu reserva: ${result.message}`);
			} else if (result.error === "telefono") {
				setStepError("Revisa el número de teléfono ingresado.");
			}
		}
	};

	const handleStepBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	};

	const discountPercentage = Math.round(descuentoRate * 100);
	const mostrarPrecio = Boolean(cotizacion.precio);

	return (
		<section
			id="inicio"
			className="relative bg-gradient-to-r from-primary to-secondary text-white min-h-screen flex items-center"
		>
			<div className="absolute inset-0 bg-black/30"></div>
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: `url(${heroVan})` }}
			></div>
			<div className="relative container mx-auto px-4 text-center">
				<h2 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-down">
					Tu Traslado Privado y Exclusivo
					<br />
					<span className="text-accent">en un Auto Confortable</span>
				</h2>
				<p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
					Diseñamos una reserva guiada paso a paso para que confirmes y pagues
					tu viaje de forma autónoma, asegurando el {discountPercentage}% de
					descuento online.
				</p>

				<Card className="max-w-5xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl border text-left">
					<CardHeader className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<CardTitle className="text-foreground text-2xl">
								Reserva tu viaje en línea
							</CardTitle>
							<Badge variant="secondary" className="text-sm">
								Descuento web {discountPercentage}%
							</Badge>
						</div>
						<div className="space-y-4">
							<div className="grid gap-4 md:grid-cols-3">
								{steps.map((step, index) => {
									const isCompleted = index < currentStep;
									const isActive = index === currentStep;

									return (
										<div
											key={step.title}
											className={`flex items-start gap-3 rounded-lg border p-3 transition ${
												isActive
													? "border-primary bg-primary/10"
													: isCompleted
													? "border-green-500/50 bg-green-500/10"
													: "border-muted bg-muted/40"
											}`}
										>
											<div
												className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
													isCompleted
														? "border-green-500 bg-green-500/20 text-green-600"
														: isActive
														? "border-primary bg-primary/20 text-primary"
														: "border-muted-foreground/40 text-muted-foreground"
												}`}
											>
												{isCompleted ? (
													<CheckCircle2 className="h-6 w-6" />
												) : (
													index + 1
												)}
											</div>
											<div>
												<p className="font-semibold text-foreground">
													{step.title}
												</p>
												<p className="text-sm text-muted-foreground">
													{step.description}
												</p>
											</div>
										</div>
									);
								})}
							</div>
							<Progress value={progressValue} className="h-2" />
						</div>
					</CardHeader>
					<CardContent className="space-y-8">
						{currentStep === 0 && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label htmlFor="origen-hero">Origen</Label>
										<select
											id="origen-hero"
											name="origen"
											value={formData.origen}
											onChange={handleInputChange}
											className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
											required
										>
											{origenes.map((origen) => (
												<option key={origen} value={origen}>
													{origen}
												</option>
											))}
										</select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="destino-hero">Destino</Label>
										<select
											id="destino-hero"
											name="destino"
											value={formData.destino}
											onChange={handleInputChange}
											className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
											required
										>
											<option value="">Seleccionar destino</option>
											{destinos.map((d) => (
												<option key={d} value={d}>
													{d}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div className="space-y-2">
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
									<div className="space-y-2">
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
									<div className="space-y-2">
										<Label htmlFor="pasajeros-hero">Pasajeros</Label>
										<select
											id="pasajeros-hero"
											name="pasajeros"
											value={formData.pasajeros}
											onChange={handleInputChange}
											className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
											required
										>
											{[...Array(maxPasajeros)].map((_, i) => (
												<option key={i + 1} value={i + 1}>
													{i + 1} pasajero(s)
												</option>
											))}
										</select>
									</div>
								</div>
								<div className="text-center text-sm text-muted-foreground">
									¿No encuentras tu destino?{" "}
									<a href="#contacto" className="text-primary hover:underline">
										Contáctanos
									</a>{" "}
									para una cotización personalizada.
								</div>
								{mostrarPrecio ? (
									<div className="rounded-xl border border-primary/20 bg-primary/10 p-6 text-foreground">
										<div className="grid gap-4 md:grid-cols-2 md:items-center">
											<div className="space-y-1">
												<p className="text-sm uppercase tracking-wide text-muted-foreground">
													Vehículo sugerido
												</p>
												<p className="text-2xl font-semibold">
													{cotizacion.vehiculo}
												</p>
												<p className="text-sm text-muted-foreground">
													Tarifa estimada para {formData.pasajeros} pasajero(s).
												</p>
											</div>
											<div className="text-left md:text-right space-y-1">
												<Badge className="mb-1 md:ml-auto" variant="default">
													Ahorra {discountPercentage}% online
												</Badge>
												<p className="text-xs text-muted-foreground uppercase tracking-wide">
													Precio estándar
												</p>
												<p className="text-xl font-semibold">
													{formatCurrency(pricing.precioBase)}
												</p>
												<p className="text-xs text-muted-foreground uppercase tracking-wide">
													Total con descuento
												</p>
												<p className="text-2xl font-bold text-accent">
													{formatCurrency(pricing.totalConDescuento)}
												</p>
												<p className="text-sm font-medium text-emerald-500">
													Ahorro inmediato{" "}
													{formatCurrency(pricing.descuentoOnline)}
												</p>
											</div>
										</div>
									</div>
								) : (
									<div className="rounded-xl border border-dashed border-primary/40 bg-white/40 p-6 text-primary">
										<p className="font-semibold">
											Calcularemos el valor exacto y te lo enviaremos junto con
											la confirmación.
										</p>
										<p className="text-sm text-primary/80">
											Indícanos tu destino para sugerirte el vehículo más
											conveniente.
										</p>
									</div>
								)}

								<div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
									<p className="text-sm text-muted-foreground">
										Revisaremos disponibilidad en tiempo real antes de pasar al
										pago.
									</p>
									<Button
										type="button"
										className="w-full sm:w-auto bg-accent hover:bg-accent/90"
										onClick={handleStepOneNext}
										disabled={isSubmitting}
									>
										Continuar con mis datos
									</Button>
								</div>
							</div>
						)}

						{currentStep === 1 && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label htmlFor="nombre-hero">Nombre completo</Label>
										<Input
											id="nombre-hero"
											name="nombre"
											value={formData.nombre}
											onChange={handleInputChange}
											placeholder="Ej: Juan Pérez"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="email-hero">Email</Label>
										<Input
											id="email-hero"
											type="email"
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											placeholder="tu@email.cl"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label htmlFor="telefono-hero">Teléfono móvil</Label>
										<Input
											id="telefono-hero"
											name="telefono"
											value={formData.telefono}
											onChange={handleInputChange}
											placeholder="+56 9 1234 5678"
										/>
										{phoneError && (
											<p className="text-sm text-red-500">{phoneError}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="numeroVuelo-hero">
											Número de vuelo (si aplica)
										</Label>
										<Input
											id="numeroVuelo-hero"
											name="numeroVuelo"
											value={formData.numeroVuelo}
											onChange={handleInputChange}
											placeholder="Ej: LA123"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label htmlFor="hotel-hero">Hotel o dirección final</Label>
										<Input
											id="hotel-hero"
											name="hotel"
											value={formData.hotel}
											onChange={handleInputChange}
											placeholder="Ej: Hotel Antumalal"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="sillaInfantil-hero">
											¿Necesitas silla infantil?
										</Label>
										<select
											id="sillaInfantil-hero"
											name="sillaInfantil"
											value={formData.sillaInfantil}
											onChange={handleInputChange}
											className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
										>
											<option value="no">No requiero</option>
											<option value="1 silla">Sí, 1 silla</option>
											<option value="2 sillas">Sí, 2 sillas</option>
										</select>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="equipajeEspecial-hero">
										Equipaje extra o comentarios para el conductor
									</Label>
									<Textarea
										id="equipajeEspecial-hero"
										name="equipajeEspecial"
										value={formData.equipajeEspecial}
										onChange={handleInputChange}
										placeholder="Cuéntanos sobre equipaje voluminoso, mascotas u otros detalles relevantes."
									/>
								</div>

								{mostrarPrecio && (
									<div className="rounded-xl border border-secondary/30 bg-secondary/10 p-6 text-foreground">
										<h4 className="text-lg font-semibold mb-2">
											Resumen económico
										</h4>
										<div className="grid gap-2 text-sm">
											<div className="flex items-center justify-between">
												<span>Abono online (40%)</span>
												<span className="font-semibold">
													{formatCurrency(pricing.abono)}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span>Saldo con descuento</span>
												<span className="font-semibold">
													{formatCurrency(pricing.saldoPendiente)}
												</span>
											</div>
											<div className="flex items-center justify-between text-emerald-600">
												<span>Ahorro asegurado</span>
												<span className="font-semibold">
													{formatCurrency(pricing.descuentoOnline)}
												</span>
											</div>
										</div>
										<p className="mt-3 text-xs text-muted-foreground">
											Podrás elegir entre abonar el 40% o pagar el total con
											descuento en el siguiente paso.
										</p>
									</div>
								)}

								<div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
									<Button
										type="button"
										variant="outline"
										className="w-full sm:w-auto"
										onClick={handleStepBack}
										disabled={isSubmitting}
									>
										Volver al paso anterior
									</Button>
									<Button
										type="button"
										className="w-full sm:w-auto bg-accent hover:bg-accent/90"
										onClick={handleStepTwoNext}
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<>
												<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
												Generando resumen...
											</>
										) : (
											"Revisar resumen y pagar"
										)}
									</Button>
								</div>
							</div>
						)}

						{stepError && (
							<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
								{stepError}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</section>
	);
}

export default Hero;
