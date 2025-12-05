import React, { useState, useMemo } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { 
	LoaderCircle, 
	CheckCircle, 
	AlertCircle, 
	CreditCard,
	MapPin,
	Calendar,
	Clock,
	ArrowRight,
	Users,
	Plane,
	Building2,
	Shield
} from "lucide-react";
import { getBackendUrl } from "../lib/backend";

// Formateador de moneda para pesos chilenos
const CURRENCY_FORMATTER = new Intl.NumberFormat("es-CL", {
	style: "currency",
	currency: "CLP",
});

// Genera opciones de hora en intervalos de 15 minutos (8:00 AM - 9:00 PM)
const generateTimeOptions = () => {
	const options = [];
	for (let hour = 8; hour <= 21; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const horaStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
			options.push(horaStr);
		}
	}
	return options;
};

// Componente para pagar usando un código de pago estandarizado
function PagarConCodigo() {
	const [codigo, setCodigo] = useState("");
	const [validando, setValidando] = useState(false);
	const [codigoValidado, setCodigoValidado] = useState(null);
	const [error, setError] = useState("");
	const [step, setStep] = useState(1); // 1: Validar código, 2: Completar datos y pagar
	const [selectedPaymentType, setSelectedPaymentType] = useState("total"); // 'total' | 'abono'
	
	// Opciones de hora para selectores
	const timeOptions = useMemo(() => generateTimeOptions(), []);

	// Datos del cliente
	const [formData, setFormData] = useState({
		nombre: "",
		email: "",
		telefono: "",
		fecha: "",
		hora: "",
		fechaRegreso: "",
		horaRegreso: "",
		numeroVuelo: "",
		hotel: "",
		mensaje: "",
		direccionDestino: "",
		direccionOrigen: "",
	});

	const [procesando, setProcesando] = useState(false);
	const [loadingGateway, setLoadingGateway] = useState(null);

	const backendUrl =
		getBackendUrl() || "https://transportes-araucaria.onrender.com";

	// Función para formatear moneda usando el formateador a nivel de módulo
	const formatCurrency = (value) => CURRENCY_FORMATTER.format(value || 0);

	const montoTotal = codigoValidado ? Number(codigoValidado.monto) || 0 : 0;
	const abonoSugerido = codigoValidado
		? Math.max(Math.round(montoTotal * 0.4), 0)
		: 0;
	const saldoPendiente = Math.max(montoTotal - abonoSugerido, 0);
	const montoSeleccionado =
		selectedPaymentType === "abono" ? abonoSugerido : montoTotal;
	const esIdaVuelta = Boolean(codigoValidado?.idaVuelta);

	// Validar el código de pago
	const validarCodigo = async () => {
		if (!codigo.trim()) {
			setError("Por favor ingresa un código de pago");
			return;
		}

		setValidando(true);
		setError("");

		try {
			const response = await fetch(
				`${backendUrl}/api/codigos-pago/${codigo.toUpperCase()}`
			);

			const data = await response.json();

			if (!response.ok) {
				setError(data.message || "Código inválido");
				setCodigoValidado(null);
				return;
			}

			setCodigoValidado(data.codigoPago);
			setSelectedPaymentType("total");
			setStep(2);
		} catch (error) {
			console.error("Error validando código:", error);
			setError("Error al validar el código. Intenta nuevamente.");
		} finally {
			setValidando(false);
		}
	};

	// Manejar cambios en el formulario
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Validar datos del formulario
	const validarDatos = () => {
		if (!formData.nombre.trim()) {
			setError("Por favor ingresa tu nombre completo");
			return false;
		}
		if (!formData.email.trim()) {
			setError("Por favor ingresa tu correo electrónico");
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setError("El correo electrónico no es válido");
			return false;
		}
		if (!formData.telefono.trim()) {
			setError("Por favor ingresa tu teléfono");
			return false;
		}
		if (!formData.fecha) {
			setError("Por favor selecciona la fecha del servicio");
			return false;
		}
		if (!formData.hora) {
			setError("Por favor selecciona la hora del servicio");
			return false;
		}
		if (esIdaVuelta) {
			if (!formData.fechaRegreso) {
				setError("Por favor indica la fecha del viaje de regreso");
				return false;
			}
			if (!formData.horaRegreso) {
				setError("Por favor indica la hora del viaje de regreso");
				return false;
			}
			const salida = new Date(`${formData.fecha}T${formData.hora}`);
			const regreso = new Date(
				`${formData.fechaRegreso}T${formData.horaRegreso}`
			);
			if (Number.isNaN(regreso.getTime())) {
				setError("La fecha de regreso no es valida");
				return false;
			}
			if (!Number.isNaN(salida.getTime()) && regreso <= salida) {
				setError(
					"El regreso debe ser posterior al viaje de ida. Revisa la fecha y hora ingresadas."
				);
				return false;
			}
		}
		// Validar dirección obligatoria según sentido del viaje
		if (codigoValidado) {
			if (
				codigoValidado.origen === "Aeropuerto La Araucanía" &&
				!formData.direccionDestino.trim()
			) {
				setError("Por favor ingresa la dirección de destino");
				return false;
			}
			if (
				codigoValidado.destino === "Aeropuerto La Araucanía" &&
				!formData.direccionOrigen.trim()
			) {
				setError("Por favor ingresa la dirección de origen");
				return false;
			}
		}
		setError("");
		return true;
	};

	// Pago con código: crea reserva express y genera link de Flow
	// IMPORTANTE: El backend debe mantener la reserva en estado 'pendiente' hasta recibir la confirmación de pago exitosa desde Flow.
	// No debe cambiar el estado a 'confirmada' antes de recibir el webhook/callback de Flow.
	const procesarPagoConCodigoFlow = async () => {
		if (!validarDatos() || !codigoValidado) return;
		setProcesando(true);
		setLoadingGateway("flow");
		setError("");

		if (!montoSeleccionado || montoSeleccionado <= 0) {
			setError(
				"El monto a pagar no es válido. Contacta a soporte para obtener ayuda."
			);
			setProcesando(false);
			setLoadingGateway(null);
			return;
		}

		const descripcionPago =
			selectedPaymentType === "abono"
				? `Abono 40% - Código ${codigoValidado.codigo}`
				: `Pago total - Código ${codigoValidado.codigo}`;

		try {
			const reservaPayload = {
				nombre: formData.nombre,
				email: formData.email,
				telefono: formData.telefono,
				origen: codigoValidado.origen,
				destino: codigoValidado.destino,
				direccionDestino: formData.direccionDestino,
				direccionOrigen: formData.direccionOrigen,
				// Estado inicial: pendiente hasta confirmar el pago
				estado: "pendiente",
				estadoPago: "pendiente",
				// Usar fecha y hora proporcionadas por el cliente (enviar solo si existen)
				fecha: formData.fecha,
				// hora se añade condicionalmente más abajo
				pasajeros: codigoValidado.pasajeros || 1,
				precio: montoTotal,
				totalConDescuento: montoTotal,
				vehiculo: codigoValidado.vehiculo || "Por asignar",
				numeroVuelo: formData.numeroVuelo,
				hotel: formData.hotel,
				mensaje: formData.mensaje,
				idaVuelta: esIdaVuelta,
				referenciaPago: codigoValidado.codigo,
				source: "codigo_pago",
				abonoSugerido: selectedPaymentType === "abono" ? abonoSugerido : 0,
				saldoPendiente:
					selectedPaymentType === "abono" ? saldoPendiente : montoTotal,
				tipoPago: selectedPaymentType,
			};

			// Añadir hora solo si el usuario la proporcionó
			if (formData.hora && formData.hora.trim()) {
				reservaPayload.hora = formData.hora;
			}
			if (esIdaVuelta && formData.fechaRegreso) {
				reservaPayload.fechaRegreso = formData.fechaRegreso;
			}
			if (esIdaVuelta && formData.horaRegreso && formData.horaRegreso.trim()) {
				reservaPayload.horaRegreso = formData.horaRegreso;
			}

			const r = await fetch(`${backendUrl}/enviar-reserva-express`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(reservaPayload),
			});
			const rj = await r.json();
			if (!r.ok || rj.success === false) {
				throw new Error(rj.message || "No se pudo crear la reserva");
			}

			// NOTA: no llamamos a `/completar-reserva-detalles/:id` desde el frontend porque
			// ese endpoint en el backend marca la reserva como 'confirmada'. El backend
			// debe marcar confirmada solo cuando reciba el webhook/callback de pago.
			// Simplemente registramos el ID de reserva si existe y seguimos con el flujo
			// de pago (no bloquear el proceso).
			const reservaId = rj.reservaId || rj.reserva?.id || null;
			const codigoReservaGenerado =
				rj.codigoReserva ||
				rj.codigo_reserva ||
				rj.reserva?.codigoReserva ||
				null;
			const codigoPagoNormalizado = (codigoValidado.codigo || "")
				.toString()
				.toUpperCase();
			if (reservaId) {
				console.log(
					"Reserva creada (detalles pendientes) ID:",
					reservaId,
					"- no se llamará a completar-reserva-detalles desde frontend"
				);
			}

			const description = `Traslado ${codigoValidado.origen} - ${codigoValidado.destino}`;
			const p = await fetch(`${backendUrl}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gateway: "flow",
					amount: parseFloat(montoSeleccionado),
					description: `${description} • ${descripcionPago}`,
					email: formData.email,
					reservaId,
					codigoReserva: codigoReservaGenerado,
					tipoPago: selectedPaymentType,
					referenciaPago: codigoPagoNormalizado,
				}),
			});
			const pj = await p.json();
			if (p.ok && pj.url) {
				window.location.href = pj.url;
			} else {
				throw new Error(pj.message || "No se pudo generar el enlace de pago");
			}
		} catch (e) {
			setError(e.message || "Error al procesar el pago.");
		} finally {
			setProcesando(false);
			setLoadingGateway(null);
		}
	};

	return (
		<section id="pagar-con-codigo" className="relative w-full min-h-screen flex flex-col lg:flex-row bg-background">
			{/* Panel izquierdo: Formulario */}
			<div className="relative flex flex-col justify-start lg:justify-center px-6 py-8 lg:p-16 xl:p-24 overflow-y-auto bg-card z-10 w-full lg:w-1/2">
				<div className="space-y-6 w-full max-w-lg mx-auto">
					{/* Encabezado */}
					<div className="mb-6">
						<h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-2">
							Pagar con Código
						</h2>
						<p className="text-muted-foreground text-lg">
							{step === 1 
								? "Ingresa el código que recibiste por WhatsApp."
								: `Código: ${codigoValidado?.codigo || ""}`
							}
						</p>
					</div>

					{/* =============== PASO 1: VALIDAR CÓDIGO =============== */}
					{step === 1 && (
						<div className="space-y-4">
							{/* Campo de código */}
							<div className="space-y-2">
								<Label htmlFor="codigo" className="text-sm font-semibold text-foreground">
									Código de Pago
								</Label>
								<div className="relative">
									<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
									<Input
										id="codigo"
										type="text"
										value={codigo}
										onChange={(e) => setCodigo(e.target.value.toUpperCase())}
										onKeyDown={(e) => e.key === 'Enter' && validarCodigo()}
										placeholder="Ej: A-TCO-25"
										className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm font-mono uppercase tracking-wider focus:ring-2 focus:ring-ring focus:border-transparent"
										disabled={validando}
									/>
								</div>
							</div>

							{/* Mensaje de error */}
							{error && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							{/* Botón validar */}
							<Button
								onClick={validarCodigo}
								disabled={validando || !codigo.trim()}
								className="w-full h-12 text-base font-semibold"
								size="lg"
							>
								{validando ? (
									<>
										<LoaderCircle className="h-5 w-5 animate-spin mr-2" />
										Validando...
									</>
								) : (
									<>
										Validar Código
										<ArrowRight className="h-5 w-5 ml-2" />
									</>
								)}
							</Button>

							{/* Texto de ayuda */}
							<p className="text-sm text-muted-foreground text-center">
								¿No tienes código? Contáctanos por WhatsApp.
							</p>
						</div>
					)}

					{/* =============== PASO 2: COMPLETAR DATOS Y PAGAR =============== */}
					{step === 2 && codigoValidado && (
						<div className="space-y-6">
							{/* Resumen del viaje */}
							<div className="bg-muted/50 rounded-lg p-4 space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Ruta:</span>
									<span className="font-medium">{codigoValidado.origen} → {codigoValidado.destino}</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Pasajeros:</span>
									<span className="font-medium">{codigoValidado.pasajeros} persona(s)</span>
								</div>
								{esIdaVuelta && (
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">Tipo:</span>
										<Badge variant="secondary">Ida y Vuelta</Badge>
									</div>
								)}
								<div className="flex justify-between items-center pt-2 border-t">
									<span className="text-sm font-semibold">Total:</span>
									<span className="text-xl font-bold text-primary">{formatCurrency(montoTotal)}</span>
								</div>
							</div>

							{/* Formulario de datos */}
							<div className="space-y-4">
								{/* Nombre */}
								<div className="space-y-2">
									<Label htmlFor="nombre" className="text-sm font-semibold text-foreground">
										Nombre completo <span className="text-red-500">*</span>
									</Label>
									<div className="relative">
										<Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
										<Input
											id="nombre"
											name="nombre"
											value={formData.nombre}
											onChange={handleInputChange}
											placeholder="Juan Pérez"
											className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
										/>
									</div>
								</div>

								{/* Email y Teléfono */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="email" className="text-sm font-semibold text-foreground">
											Email <span className="text-red-500">*</span>
										</Label>
										<div className="relative">
											<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<Input
												id="email"
												name="email"
												type="email"
												value={formData.email}
												onChange={handleInputChange}
												placeholder="tu@email.cl"
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="telefono" className="text-sm font-semibold text-foreground">
											Teléfono <span className="text-red-500">*</span>
										</Label>
										<div className="relative">
											<Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<Input
												id="telefono"
												name="telefono"
												value={formData.telefono}
												onChange={handleInputChange}
												placeholder="+56 9 1234 5678"
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</div>
								</div>

								{/* Fecha y Hora */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="fecha" className="text-sm font-semibold text-foreground">
											Fecha <span className="text-red-500">*</span>
										</Label>
										<div className="relative">
											<Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<Input
												id="fecha"
												name="fecha"
												type="date"
												value={formData.fecha}
												onChange={handleInputChange}
												min={new Date().toISOString().split("T")[0]}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="hora" className="text-sm font-semibold text-foreground">
											Hora <span className="text-red-500">*</span>
										</Label>
										<div className="relative">
											<Clock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<select
												id="hora"
												name="hora"
												value={formData.hora}
												onChange={handleInputChange}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
											>
												<option value="">Seleccionar...</option>
												{timeOptions.map((hora) => (
													<option key={hora} value={hora}>{hora}</option>
												))}
											</select>
										</div>
									</div>
								</div>

								{/* Campos de regreso para ida y vuelta */}
								{esIdaVuelta && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="fechaRegreso" className="text-sm font-semibold text-foreground">
												Fecha regreso <span className="text-red-500">*</span>
											</Label>
											<div className="relative">
												<Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
												<Input
													id="fechaRegreso"
													name="fechaRegreso"
													type="date"
													value={formData.fechaRegreso}
													onChange={handleInputChange}
													min={formData.fecha || new Date().toISOString().split("T")[0]}
													className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="horaRegreso" className="text-sm font-semibold text-foreground">
												Hora regreso <span className="text-red-500">*</span>
											</Label>
											<div className="relative">
												<Clock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
												<select
													id="horaRegreso"
													name="horaRegreso"
													value={formData.horaRegreso}
													onChange={handleInputChange}
													className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
												>
													<option value="">Seleccionar...</option>
													{timeOptions.map((hora) => (
														<option key={`regreso-${hora}`} value={hora}>{hora}</option>
													))}
												</select>
											</div>
										</div>
									</div>
								)}

								{/* Dirección (según sentido del viaje) */}
								{codigoValidado?.origen === "Aeropuerto La Araucanía" && (
									<div className="space-y-2">
										<Label htmlFor="direccionDestino" className="text-sm font-semibold text-foreground">
											Dirección de destino <span className="text-red-500">*</span>
										</Label>
										<div className="relative">
											<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<Input
												id="direccionDestino"
												name="direccionDestino"
												value={formData.direccionDestino}
												onChange={handleInputChange}
												placeholder="Av. Alemania 1234, Temuco"
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</div>
								)}
								{codigoValidado?.destino === "Aeropuerto La Araucanía" && (
									<div className="space-y-2">
										<Label htmlFor="direccionOrigen" className="text-sm font-semibold text-foreground">
											Dirección de origen <span className="text-red-500">*</span>
										</Label>
										<div className="relative">
											<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<Input
												id="direccionOrigen"
												name="direccionOrigen"
												value={formData.direccionOrigen}
												onChange={handleInputChange}
												placeholder="Av. O'Higgins 567, Temuco"
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</div>
								)}

								{/* Campos opcionales en fila */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="numeroVuelo" className="text-sm font-semibold text-foreground">
											Nº de vuelo (opcional)
										</Label>
										<div className="relative">
											<Plane className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<Input
												id="numeroVuelo"
												name="numeroVuelo"
												value={formData.numeroVuelo}
												onChange={handleInputChange}
												placeholder="LA1234"
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="hotel" className="text-sm font-semibold text-foreground">
											Hotel (opcional)
										</Label>
										<div className="relative">
											<Building2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<Input
												id="hotel"
												name="hotel"
												value={formData.hotel}
												onChange={handleInputChange}
												placeholder="Hotel Dreams"
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Mensaje de error */}
							{error && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							{/* Selección de monto */}
							{codigoValidado?.permitirAbono && (
								<div className="space-y-3">
									<Label className="text-sm font-semibold text-foreground">Monto a pagar</Label>
									<div className="grid grid-cols-2 gap-3">
										<button
											type="button"
											onClick={() => setSelectedPaymentType("abono")}
											className={`p-4 rounded-lg border-2 text-left transition-all ${
												selectedPaymentType === "abono"
													? "border-primary bg-primary/5"
													: "border-input hover:border-primary/50"
											}`}
										>
											<p className="text-sm font-medium">Abono 40%</p>
											<p className="text-lg font-bold">{formatCurrency(abonoSugerido)}</p>
										</button>
										<button
											type="button"
											onClick={() => setSelectedPaymentType("total")}
											className={`p-4 rounded-lg border-2 text-left transition-all ${
												selectedPaymentType === "total"
													? "border-primary bg-primary/5"
													: "border-input hover:border-primary/50"
											}`}
										>
											<p className="text-sm font-medium">Pago Total</p>
											<p className="text-lg font-bold">{formatCurrency(montoTotal)}</p>
										</button>
									</div>
								</div>
							)}

							{/* Botón de pago */}
							<Button
								onClick={procesarPagoConCodigoFlow}
								disabled={procesando || !montoSeleccionado || montoSeleccionado <= 0}
								className="w-full h-12 text-base font-semibold"
								size="lg"
							>
								{loadingGateway === "flow" ? (
									<>
										<LoaderCircle className="h-5 w-5 animate-spin mr-2" />
										Procesando...
									</>
								) : (
									<>
										Pagar {formatCurrency(montoSeleccionado)}
										<ArrowRight className="h-5 w-5 ml-2" />
									</>
								)}
							</Button>

							{/* Botón volver */}
							<button
								type="button"
								onClick={() => {
									setStep(1);
									setCodigoValidado(null);
									setError("");
									setSelectedPaymentType("total");
								}}
								disabled={procesando}
								className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								← Usar otro código
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Panel derecho: Visual (solo en desktop) */}
			<div className="hidden lg:flex lg:w-1/2 relative bg-primary">
				<div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
				<div className="relative z-10 flex flex-col items-center justify-center p-16 text-primary-foreground">
					<CreditCard className="h-24 w-24 mb-8 opacity-90" />
					<h2 className="text-4xl font-bold mb-4 text-center">Pago Seguro</h2>
					<p className="text-xl opacity-90 text-center max-w-md">
						Completa tu pago de forma rápida y segura con tu código de reserva.
					</p>
					<div className="mt-12 space-y-4 text-center">
						<div className="flex items-center gap-3">
							<CheckCircle className="h-6 w-6" />
							<span className="text-lg">Confirmación inmediata</span>
						</div>
						<div className="flex items-center gap-3">
							<Shield className="h-6 w-6" />
							<span className="text-lg">Pago 100% seguro</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default PagarConCodigo;
