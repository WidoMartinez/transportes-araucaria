import React, { useState, useMemo } from "react";
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
import { LoaderCircle, Check, ArrowRight, Calendar, MapPin, Clock, Users, X } from "lucide-react";
import CodigoDescuento from "./CodigoDescuento";

const generateTimeOptions = () => {
	const options = [];
	for (let hour = 6; hour <= 20; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
			options.push({ value: timeString, label: timeString });
		}
	}
	return options;
};

function ReservaMinimalista({
	formData,
	handleInputChange,
	origenes,
	destinos,
	maxPasajeros,
	minDateTime,
	phoneError,
	isSubmitting,
	cotizacion,
	pricing,
	baseDiscountRate,
	promotionDiscountRate,
	roundTripDiscountRate,
	personalizedDiscountRate,
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
	const [showForm, setShowForm] = useState(false);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [localErrors, setLocalErrors] = useState({});
	
	const timeOptions = useMemo(() => generateTimeOptions(), []);

	const baseDiscountPercentage = Math.round(baseDiscountRate * 100);
	const promoDiscountPercentage = Math.round(promotionDiscountRate * 100);
	const roundTripDiscountPercentage = Math.round(roundTripDiscountRate * 100);
	const personalizedDiscountPercentage = Math.round(personalizedDiscountRate * 100);

	const currencyFormatter = useMemo(
		() => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }),
		[]
	);
	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	const handleTimeChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setLocalErrors((prev) => ({ ...prev, [field]: null }));
	};

	const tieneCotizacionAutomatica = typeof cotizacion.precio === "number";
	const requiereCotizacionManual = formData.destino === "Otro" || (formData.destino && !tieneCotizacionAutomatica);
	const mostrarPrecio = tieneCotizacionAutomatica;

	const validateForm = () => {
		const errors = {};
		
		if (!formData.origen?.trim()) errors.origen = "Selecciona el origen";
		if (!formData.destino) errors.destino = "Selecciona el destino";
		if (!formData.fecha) errors.fecha = "Selecciona la fecha";
		if (!formData.hora) errors.hora = "Selecciona la hora";
		if (!formData.nombre?.trim()) errors.nombre = "Ingresa tu nombre";
		if (!formData.email?.trim()) errors.email = "Ingresa tu email";
		
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (formData.email && !emailRegex.test(formData.email)) {
			errors.email = "Email inválido";
		}
		
		if (!formData.telefono?.trim()) errors.telefono = "Ingresa tu teléfono";
		
		const validacion = validarHorarioReserva();
		if (!validacion.esValido) {
			errors.hora = validacion.mensaje;
		}

		if (formData.idaVuelta) {
			if (!formData.fechaRegreso) errors.fechaRegreso = "Fecha de regreso requerida";
			if (!formData.horaRegreso) errors.horaRegreso = "Hora de regreso requerida";
			
			if (formData.fecha && formData.hora && formData.fechaRegreso && formData.horaRegreso) {
				const salida = new Date(`${formData.fecha}T${formData.hora}`);
				const regreso = new Date(`${formData.fechaRegreso}T${formData.horaRegreso}`);
				if (regreso <= salida) {
					errors.fechaRegreso = "El regreso debe ser posterior a la ida";
				}
			}
		}

		if (!acceptedTerms) {
			errors.terms = "Debes aceptar los términos para continuar";
		}

		setLocalErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (validateForm()) {
			await onSubmitWizard();
		}
	};

	const totalDescuento = baseDiscountPercentage + promoDiscountPercentage + 
		roundTripDiscountPercentage + personalizedDiscountPercentage;

	if (!showForm) {
		return (
			<section
				id="inicio"
				className="relative bg-gradient-to-br from-primary via-primary/95 to-secondary text-white min-h-screen flex items-center overflow-hidden"
			>
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtMTEuMDQ2LTguOTU0LTIwLTIwLTIwUzAgMi45NTQgMCAxNHM4Ljk1NCAyMCAyMCAyMCAyMC04Ljk1NCAyMC0yMHptLTIwIDIwYy02LjYyNyAwLTEyLTUuMzczLTEyLTEycy41MzczLTEyIDEyLTEyIDEyIDUuMzczIDEyIDEyLTUuMzczIDEyLTEyIDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
				
				<div className="relative container mx-auto px-4 py-20 text-center">
					<div className="max-w-4xl mx-auto space-y-8">
						<div className="space-y-4">
							<Badge className="bg-accent/20 text-accent border-accent/30 text-lg px-6 py-2 font-semibold">
								✨ Descuento exclusivo web hasta {totalDescuento}%
							</Badge>
							
							<h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
								Traslados Premium
								<br />
								<span className="text-accent">en La Araucanía</span>
							</h1>
							
							<p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
								Conectamos el Aeropuerto con Pucón, Villarrica, Corralco y los principales destinos turísticos
							</p>
						</div>

						<div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
							<div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
								<div className="text-4xl mb-3">⚡</div>
								<h3 className="font-bold text-lg mb-2">Reserva en 2 minutos</h3>
								<p className="text-white/80 text-sm">Proceso simple y rápido, sin complicaciones</p>
							</div>
							<div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
								<div className="text-4xl mb-3">💰</div>
								<h3 className="font-bold text-lg mb-2">Mejor precio garantizado</h3>
								<p className="text-white/80 text-sm">Descuentos exclusivos solo online</p>
							</div>
							<div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
								<div className="text-4xl mb-3">🛡️</div>
								<h3 className="font-bold text-lg mb-2">Pago seguro</h3>
								<p className="text-white/80 text-sm">Flow y Mercado Pago, protección total</p>
							</div>
						</div>

						<Button
							onClick={() => setShowForm(true)}
							size="lg"
							className="bg-accent hover:bg-accent/90 text-accent-foreground px-12 py-7 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105 border-2 border-accent/20"
						>
							Reservar ahora <ArrowRight className="ml-2 h-6 w-6" />
						</Button>

						<p className="text-sm text-white/70">
							✓ Sin costos ocultos · ✓ Confirmación inmediata · ✓ Cancelación flexible
						</p>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section
			id="inicio"
			className="relative bg-gradient-to-br from-primary via-primary/95 to-secondary min-h-screen py-8 md:py-16"
		>
			<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtMTEuMDQ2LTguOTU0LTIwLTIwLTIwUzAgMi45NTQgMCAxNHM4Ljk1NCAyMCAyMCAyMCAyMC04Ljk1NCAyMC0yMHptLTIwIDIwYy02LjYyNyAwLTEyLTUuMzczLTEyLTEycy41MzczLTEyIDEyLTEyIDEyIDUuMzczIDEyIDEyLTUuMzczIDEyLTEyIDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

			<div className="relative container mx-auto px-4">
				<div className="max-w-5xl mx-auto">
					{/* Header */}
					<div className="text-center text-white mb-8">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowForm(false)}
							className="text-white/80 hover:text-white hover:bg-white/10 mb-4"
						>
							<X className="h-4 w-4 mr-2" /> Volver
						</Button>
						<h2 className="text-3xl md:text-4xl font-bold mb-3">Completa tu reserva</h2>
						<div className="flex flex-wrap items-center justify-center gap-2">
							{baseDiscountPercentage > 0 && (
								<Badge className="bg-accent text-accent-foreground">
									Web {baseDiscountPercentage}%
								</Badge>
							)}
							{promoDiscountPercentage > 0 && (
								<Badge className="bg-green-500 text-white">
									+{promoDiscountPercentage}% Promo
								</Badge>
							)}
							{roundTripDiscountPercentage > 0 && formData.idaVuelta && (
								<Badge className="bg-blue-500 text-white">
									+{roundTripDiscountPercentage}% Ida/Vuelta
								</Badge>
							)}
						</div>
					</div>

					<Card className="bg-white/98 backdrop-blur-sm shadow-2xl border-0">
						<CardContent className="p-6 md:p-10">
							<form onSubmit={handleSubmit} className="space-y-8">
								{/* Sección: Detalles del Viaje */}
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
											<MapPin className="h-5 w-5 text-primary" />
										</div>
										<h3 className="text-xl font-bold text-gray-900">Detalles del viaje</h3>
									</div>
									
									<div className="grid md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label htmlFor="origen" className="text-sm font-medium text-gray-700">
												Origen *
											</Label>
											<Select value={formData.origen} onValueChange={(value) => {
												handleInputChange({ target: { name: "origen", value } });
												setLocalErrors((prev) => ({ ...prev, origen: null }));
											}}>
												<SelectTrigger className={localErrors.origen ? "border-red-500" : ""}>
													<SelectValue placeholder="¿Desde dónde viajas?" />
												</SelectTrigger>
												<SelectContent>
													{origenes.map((origen) => (
														<SelectItem key={origen} value={origen}>
															{origen}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{localErrors.origen && (
												<p className="text-xs text-red-600">{localErrors.origen}</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="destino" className="text-sm font-medium text-gray-700">
												Destino *
											</Label>
											<Select value={formData.destino} onValueChange={(value) => {
												handleInputChange({ target: { name: "destino", value } });
												setLocalErrors((prev) => ({ ...prev, destino: null }));
											}}>
												<SelectTrigger className={localErrors.destino ? "border-red-500" : ""}>
													<SelectValue placeholder="¿A dónde te diriges?" />
												</SelectTrigger>
												<SelectContent>
													{destinos.map((destino) => (
														<SelectItem key={destino} value={destino}>
															{destino}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{localErrors.destino && (
												<p className="text-xs text-red-600">{localErrors.destino}</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="fecha" className="text-sm font-medium text-gray-700 flex items-center gap-2">
												<Calendar className="h-4 w-4" />
												Fecha de viaje *
											</Label>
											<Input
												id="fecha"
												type="date"
												name="fecha"
												min={minDateTime}
												value={formData.fecha}
												onChange={(e) => {
													handleInputChange(e);
													setLocalErrors((prev) => ({ ...prev, fecha: null }));
												}}
												className={localErrors.fecha ? "border-red-500" : ""}
											/>
											{localErrors.fecha && (
												<p className="text-xs text-red-600">{localErrors.fecha}</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="hora" className="text-sm font-medium text-gray-700 flex items-center gap-2">
												<Clock className="h-4 w-4" />
												Hora de recogida *
											</Label>
											<Select value={formData.hora} onValueChange={(value) => {
												handleTimeChange("hora", value);
											}}>
												<SelectTrigger className={localErrors.hora ? "border-red-500" : ""}>
													<SelectValue placeholder="Selecciona hora" />
												</SelectTrigger>
												<SelectContent>
													{timeOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{localErrors.hora && (
												<p className="text-xs text-red-600">{localErrors.hora}</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="pasajeros" className="text-sm font-medium text-gray-700 flex items-center gap-2">
												<Users className="h-4 w-4" />
												Número de pasajeros *
											</Label>
											<Select
												value={String(formData.pasajeros)}
												onValueChange={(value) =>
													handleInputChange({ target: { name: "pasajeros", value } })
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{[...Array(maxPasajeros)].map((_, i) => (
														<SelectItem key={i + 1} value={String(i + 1)}>
															{i + 1} pasajero{i > 0 ? "s" : ""}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>

									{/* Ida y Vuelta */}
									<div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
										<div className="flex items-start gap-3">
											<Checkbox
												id="ida-vuelta"
												checked={formData.idaVuelta}
												onCheckedChange={(value) => {
													const isRoundTrip = Boolean(value);
													setFormData((prev) => ({
														...prev,
														idaVuelta: isRoundTrip,
														fechaRegreso: isRoundTrip ? prev.fechaRegreso || prev.fecha : "",
														horaRegreso: isRoundTrip ? prev.horaRegreso : "",
													}));
												}}
											/>
											<div className="flex-1">
												<label htmlFor="ida-vuelta" className="text-sm font-medium text-gray-900 cursor-pointer">
													¿Reservar ida y vuelta? (+{roundTripDiscountPercentage}% descuento adicional)
												</label>
												<p className="text-xs text-gray-600 mt-1">
													Ahorra coordinando ambos traslados en una sola reserva
												</p>
											</div>
										</div>

										{formData.idaVuelta && (
											<div className="grid md:grid-cols-2 gap-4 mt-4">
												<div className="space-y-2">
													<Label htmlFor="fechaRegreso" className="text-sm font-medium text-gray-700">
														Fecha regreso *
													</Label>
													<Input
														id="fechaRegreso"
														type="date"
														name="fechaRegreso"
														min={formData.fecha || minDateTime}
														value={formData.fechaRegreso}
														onChange={(e) => {
															handleInputChange(e);
															setLocalErrors((prev) => ({ ...prev, fechaRegreso: null }));
														}}
														className={localErrors.fechaRegreso ? "border-red-500" : ""}
													/>
													{localErrors.fechaRegreso && (
														<p className="text-xs text-red-600">{localErrors.fechaRegreso}</p>
													)}
												</div>
												<div className="space-y-2">
													<Label htmlFor="horaRegreso" className="text-sm font-medium text-gray-700">
														Hora regreso *
													</Label>
													<Select
														value={formData.horaRegreso}
														onValueChange={(value) => handleTimeChange("horaRegreso", value)}
													>
														<SelectTrigger className={localErrors.horaRegreso ? "border-red-500" : ""}>
															<SelectValue placeholder="Hora" />
														</SelectTrigger>
														<SelectContent>
															{timeOptions.map((option) => (
																<SelectItem key={option.value} value={option.value}>
																	{option.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													{localErrors.horaRegreso && (
														<p className="text-xs text-red-600">{localErrors.horaRegreso}</p>
													)}
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Sección: Información de Contacto */}
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
											<Users className="h-5 w-5 text-primary" />
										</div>
										<h3 className="text-xl font-bold text-gray-900">Datos de contacto</h3>
									</div>

									<div className="grid md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
												Nombre completo *
											</Label>
											<Input
												id="nombre"
												name="nombre"
												value={formData.nombre}
												onChange={(e) => {
													handleInputChange(e);
													setLocalErrors((prev) => ({ ...prev, nombre: null }));
												}}
												placeholder="Juan Pérez"
												className={localErrors.nombre ? "border-red-500" : ""}
											/>
											{localErrors.nombre && (
												<p className="text-xs text-red-600">{localErrors.nombre}</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="email" className="text-sm font-medium text-gray-700">
												Email *
											</Label>
											<Input
												id="email"
												type="email"
												name="email"
												value={formData.email}
												onChange={(e) => {
													handleInputChange(e);
													setLocalErrors((prev) => ({ ...prev, email: null }));
												}}
												placeholder="tu@email.com"
												className={localErrors.email ? "border-red-500" : ""}
											/>
											{localErrors.email && (
												<p className="text-xs text-red-600">{localErrors.email}</p>
											)}
										</div>

										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
												Teléfono (WhatsApp) *
											</Label>
											<Input
												id="telefono"
												name="telefono"
												value={formData.telefono}
												onChange={(e) => {
													handleInputChange(e);
													validarTelefono(e.target.value);
													setLocalErrors((prev) => ({ ...prev, telefono: null }));
												}}
												placeholder="+56 9 1234 5678"
												className={localErrors.telefono || phoneError ? "border-red-500" : ""}
											/>
											{(localErrors.telefono || phoneError) && (
												<p className="text-xs text-red-600">{localErrors.telefono || phoneError}</p>
											)}
										</div>

										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="mensaje" className="text-sm font-medium text-gray-700">
												Comentarios adicionales (opcional)
											</Label>
											<Textarea
												id="mensaje"
												name="mensaje"
												value={formData.mensaje}
												onChange={handleInputChange}
												placeholder="Número de vuelo, equipaje especial, peticiones..."
												rows={3}
											/>
										</div>
									</div>
								</div>

								{/* Código de Descuento */}
								<div className="border-t pt-6">
									<CodigoDescuento
										onAplicar={onAplicarCodigo}
										onRemover={onRemoverCodigo}
										codigoAplicado={codigoAplicado}
										error={codigoError}
										validando={validandoCodigo}
									/>
								</div>

								{/* Resumen de Precio */}
								{mostrarPrecio && (
									<div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
										<div className="flex items-center justify-between mb-4">
											<h3 className="text-lg font-bold text-gray-900">Resumen de tu reserva</h3>
											<Badge variant="outline" className="text-sm">
												{cotizacion.vehiculo}
											</Badge>
										</div>
										
										<div className="space-y-3">
											<div className="flex justify-between text-sm">
												<span className="text-gray-600">Precio base</span>
												<span className="font-medium">{formatCurrency(pricing.precioBase)}</span>
											</div>
											
											{baseDiscountPercentage > 0 && (
												<div className="flex justify-between text-sm text-green-600">
													<span>Descuento web ({baseDiscountPercentage}%)</span>
													<span>-{formatCurrency(pricing.descuentoBase)}</span>
												</div>
											)}
											
											{promoDiscountPercentage > 0 && (
												<div className="flex justify-between text-sm text-green-600">
													<span>Promoción ({promoDiscountPercentage}%)</span>
													<span>-{formatCurrency(pricing.descuentoPromocion)}</span>
												</div>
											)}
											
											{roundTripDiscountPercentage > 0 && formData.idaVuelta && (
												<div className="flex justify-between text-sm text-green-600">
													<span>Ida y vuelta ({roundTripDiscountPercentage}%)</span>
													<span>-{formatCurrency(pricing.descuentoRoundTrip)}</span>
												</div>
											)}
											
											{personalizedDiscountPercentage > 0 && (
												<div className="flex justify-between text-sm text-green-600">
													<span>Descuento especial ({personalizedDiscountPercentage}%)</span>
													<span>-{formatCurrency(pricing.descuentoPersonalizado)}</span>
												</div>
											)}
											
											<div className="border-t pt-3">
												<div className="flex justify-between items-center">
													<span className="text-lg font-bold text-gray-900">Total a pagar</span>
													<span className="text-2xl font-bold text-accent">
														{formatCurrency(pricing.totalConDescuento)}
													</span>
												</div>
												<p className="text-xs text-gray-600 mt-1 text-right">
													Ahorro total: {formatCurrency(pricing.precioBase - pricing.totalConDescuento)}
												</p>
											</div>
										</div>
									</div>
								)}

								{requiereCotizacionManual && (
									<div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
										<p className="text-sm text-blue-900 font-medium">
											📋 Destino personalizado: Te enviaremos una cotización dentro de las próximas 2 horas.
										</p>
									</div>
								)}

								{/* Términos y Condiciones */}
								<div className="bg-gray-50 rounded-xl p-6 space-y-4">
									<div className="flex items-start gap-3">
										<Checkbox
											id="terms"
											checked={acceptedTerms}
											onCheckedChange={(value) => {
												setAcceptedTerms(Boolean(value));
												setLocalErrors((prev) => ({ ...prev, terms: null }));
											}}
										/>
										<div className="flex-1">
											<label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
												He leído y acepto los términos de servicio. Confirmo que la información es correcta y autorizo recibir confirmación por email y WhatsApp. *
											</label>
											{localErrors.terms && (
												<p className="text-xs text-red-600 mt-1">{localErrors.terms}</p>
											)}
										</div>
									</div>
								</div>

								{/* Botón de Envío */}
								<div className="pt-4">
									<Button
										type="submit"
										size="lg"
										disabled={isSubmitting}
										className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
									>
										{isSubmitting ? (
											<>
												<LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
												Procesando reserva...
											</>
										) : (
											<>
												<Check className="mr-2 h-5 w-5" />
												Confirmar y continuar al pago
											</>
										)}
									</Button>
									
									<p className="text-center text-xs text-gray-600 mt-4">
										Al confirmar, recibirás un email con los detalles y opciones de pago seguras
									</p>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}

export default ReservaMinimalista;
