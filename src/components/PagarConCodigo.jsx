import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
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
	User, 
	MapPin, 
	Calendar, 
	Clock, 
	ArrowRight, 
	ArrowLeft, 
	Plane, 
	Building2,
	MessageSquare,
	Shield,
	Sparkles,
	Users,
	Car
} from "lucide-react";
import flow from "../assets/formasPago/flow.png";
import { getBackendUrl } from "../lib/backend";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Componente PagarConCodigo
 * 
 * Permite a los usuarios pagar su servicio de traslado usando un código
 * de pago estandarizado que reciben por WhatsApp.
 * 
 * Flujo:
 * 1. Usuario ingresa el código de pago
 * 2. Sistema valida el código y muestra el resumen del servicio
 * 3. Usuario completa sus datos personales
 * 4. Usuario selecciona método y monto de pago
 * 5. Se redirige al gateway de pago (Flow)
 */
function PagarConCodigo() {
	// Estado del código y validación
	const [codigo, setCodigo] = useState("");
	const [validando, setValidando] = useState(false);
	const [codigoValidado, setCodigoValidado] = useState(null);
	const [error, setError] = useState("");
	
	// Control de pasos del formulario: 1 = Validar código, 2 = Completar datos y pagar
	const [step, setStep] = useState(1);
	
	// Tipo de pago seleccionado: 'total' o 'abono'
	const [selectedPaymentType, setSelectedPaymentType] = useState("total");

	// Datos del cliente para completar la reserva
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

	// Estados de procesamiento
	const [procesando, setProcesando] = useState(false);
	const [loadingGateway, setLoadingGateway] = useState(null);

	// URL del backend en Render.com
	const backendUrl =
		getBackendUrl() || "https://transportes-araucaria.onrender.com";

	// Formateador de moneda para pesos chilenos
	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", {
				style: "currency",
				currency: "CLP",
			}),
		[]
	);

	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	// Cálculos de montos basados en el código validado
	const montoTotal = codigoValidado ? Number(codigoValidado.monto) || 0 : 0;
	const abonoSugerido = codigoValidado
		? Math.max(Math.round(montoTotal * 0.4), 0)
		: 0;
	const saldoPendiente = Math.max(montoTotal - abonoSugerido, 0);
	const montoSeleccionado =
		selectedPaymentType === "abono" ? abonoSugerido : montoTotal;
	const esIdaVuelta = Boolean(codigoValidado?.idaVuelta);

	// Genera opciones de hora en intervalos de 15 minutos (8:00 AM - 9:00 PM)
	const timeOptions = useMemo(() => {
		const options = [];
		for (let hour = 8; hour <= 21; hour++) {
			for (let minute = 0; minute < 60; minute += 15) {
				const horaStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
				options.push(horaStr);
			}
		}
		return options;
	}, []);

	/**
	 * Valida el código de pago ingresado contra el backend
	 * Si es válido, muestra el resumen del servicio y avanza al paso 2
	 */
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

			// Código válido - guardar datos y avanzar al siguiente paso
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

	/**
	 * Maneja cambios en los campos del formulario
	 */
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	/**
	 * Valida los datos del formulario antes de proceder al pago
	 * Retorna true si todos los campos obligatorios están completos y válidos
	 */
	const validarDatos = () => {
		// Validación de nombre
		if (!formData.nombre.trim()) {
			setError("Por favor ingresa tu nombre completo");
			return false;
		}
		
		// Validación de email
		if (!formData.email.trim()) {
			setError("Por favor ingresa tu correo electrónico");
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setError("El correo electrónico no es válido");
			return false;
		}
		
		// Validación de teléfono
		if (!formData.telefono.trim()) {
			setError("Por favor ingresa tu teléfono");
			return false;
		}
		
		// Validación de fecha y hora
		if (!formData.fecha) {
			setError("Por favor selecciona la fecha del servicio");
			return false;
		}
		if (!formData.hora) {
			setError("Por favor selecciona la hora del servicio");
			return false;
		}
		
		// Validaciones específicas para viajes de ida y vuelta
		if (esIdaVuelta) {
			if (!formData.fechaRegreso) {
				setError("Por favor indica la fecha del viaje de regreso");
				return false;
			}
			if (!formData.horaRegreso) {
				setError("Por favor indica la hora del viaje de regreso");
				return false;
			}
			// Validar que el regreso sea posterior a la ida
			const salida = new Date(`${formData.fecha}T${formData.hora}`);
			const regreso = new Date(
				`${formData.fechaRegreso}T${formData.horaRegreso}`
			);
			if (Number.isNaN(regreso.getTime())) {
				setError("La fecha de regreso no es válida");
				return false;
			}
			if (!Number.isNaN(salida.getTime()) && regreso <= salida) {
				setError(
					"El regreso debe ser posterior al viaje de ida. Revisa la fecha y hora ingresadas."
				);
				return false;
			}
		}
		
		// Validación de dirección según sentido del viaje
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

	/**
	 * Procesa el pago mediante Flow
	 * 
	 * Flujo:
	 * 1. Valida los datos del formulario
	 * 2. Crea una reserva express en el backend
	 * 3. Genera un enlace de pago con Flow
	 * 4. Redirige al usuario al gateway de pago
	 * 
	 * IMPORTANTE: El backend mantiene la reserva en estado 'pendiente' 
	 * hasta recibir la confirmación de pago exitosa desde Flow vía webhook
	 */
	const procesarPagoConCodigoFlow = async () => {
		if (!validarDatos() || !codigoValidado) return;
		setProcesando(true);
		setLoadingGateway("flow");
		setError("");

		// Validar que el monto sea positivo
		if (!montoSeleccionado || montoSeleccionado <= 0) {
			setError(
				"El monto a pagar no es válido. Contacta a soporte para obtener ayuda."
			);
			setProcesando(false);
			setLoadingGateway(null);
			return;
		}

		// Descripción del pago para mostrar en Flow
		const descripcionPago =
			selectedPaymentType === "abono"
				? `Abono 40% - Código ${codigoValidado.codigo}`
				: `Pago total - Código ${codigoValidado.codigo}`;

		try {
			// Paso 1: Crear reserva express con los datos del formulario
			const reservaPayload = {
				nombre: formData.nombre,
				email: formData.email,
				telefono: formData.telefono,
				origen: codigoValidado.origen,
				destino: codigoValidado.destino,
				direccionDestino: formData.direccionDestino,
				direccionOrigen: formData.direccionOrigen,
				estado: "pendiente",
				estadoPago: "pendiente",
				fecha: formData.fecha,
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

			// Enviar reserva al backend
			const r = await fetch(`${backendUrl}/enviar-reserva-express`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(reservaPayload),
			});
			const rj = await r.json();
			if (!r.ok || rj.success === false) {
				throw new Error(rj.message || "No se pudo crear la reserva");
			}

			// Obtener identificadores de la reserva creada
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
					"- confirmación pendiente de pago vía webhook"
				);
			}

			// Paso 2: Crear enlace de pago con Flow
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
			
			// Redirigir al usuario a Flow para completar el pago
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

	// Componente de indicador de progreso
	const StepIndicator = ({ currentStep }) => (
		<div className="flex items-center justify-center gap-3 mb-8">
			{/* Paso 1 */}
			<div className="flex items-center">
				<div className={`
					w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
					transition-all duration-300
					${currentStep >= 1 
						? 'bg-primary text-primary-foreground shadow-lg' 
						: 'bg-muted text-muted-foreground'}
				`}>
					{currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
				</div>
				<span className={`ml-2 text-sm font-medium hidden sm:inline ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
					Validar
				</span>
			</div>
			
			{/* Línea conectora */}
			<div className={`w-12 h-1 rounded transition-all duration-300 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`} />
			
			{/* Paso 2 */}
			<div className="flex items-center">
				<div className={`
					w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
					transition-all duration-300
					${currentStep >= 2 
						? 'bg-primary text-primary-foreground shadow-lg' 
						: 'bg-muted text-muted-foreground'}
				`}>
					2
				</div>
				<span className={`ml-2 text-sm font-medium hidden sm:inline ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
					Datos y Pago
				</span>
			</div>
		</div>
	);

	return (
		<section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 py-8 md:py-16">
			<div className="container mx-auto px-4">
				{/* Encabezado principal */}
				<motion.div 
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="text-center mb-8"
				>
					<div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
						<CreditCard className="h-4 w-4" />
						<span className="text-sm font-medium">Pago Seguro</span>
					</div>
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
						Pagar con Código
					</h1>
					<p className="text-gray-600 max-w-md mx-auto">
						Ingresa el código que recibiste por WhatsApp para completar tu reserva de traslado
					</p>
				</motion.div>

				{/* Indicador de progreso */}
				<StepIndicator currentStep={step} />

				<div className="max-w-4xl mx-auto">
					<AnimatePresence mode="wait">
						{/* =============== PASO 1: VALIDAR CÓDIGO =============== */}
						{step === 1 && (
							<motion.div
								key="step1"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								transition={{ duration: 0.3 }}
							>
								<Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
									<CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-primary/10 rounded-lg">
												<Sparkles className="h-6 w-6 text-primary" />
											</div>
											<div>
												<CardTitle className="text-xl">Ingresa tu código de pago</CardTitle>
												<CardDescription>
													El código tiene formato como: A-TCO-25, P-VLL-30
												</CardDescription>
											</div>
										</div>
									</CardHeader>

									<CardContent className="p-6 md:p-8 space-y-6">
										{/* Campo de código con diseño mejorado */}
										<div className="space-y-3">
											<Label htmlFor="codigo" className="text-base font-medium flex items-center gap-2">
												<CreditCard className="h-4 w-4 text-primary" />
												Código de Pago
											</Label>
											<div className="flex flex-col sm:flex-row gap-3">
												<div className="relative flex-1">
													<Input
														id="codigo"
														type="text"
														value={codigo}
														onChange={(e) => setCodigo(e.target.value.toUpperCase())}
														onKeyDown={(e) => e.key === 'Enter' && validarCodigo()}
														placeholder="Ej: A-TCO-25"
														className="text-xl font-mono uppercase tracking-wider h-14 px-4 border-2 focus:border-primary transition-colors"
														disabled={validando}
														aria-describedby="codigo-hint"
													/>
													{codigo && (
														<motion.div 
															initial={{ scale: 0 }}
															animate={{ scale: 1 }}
															className="absolute right-3 top-1/2 -translate-y-1/2"
														>
															<Badge variant="secondary" className="text-xs">
																{codigo.length} caracteres
															</Badge>
														</motion.div>
													)}
												</div>
												<Button
													onClick={validarCodigo}
													disabled={validando || !codigo.trim()}
													className="h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
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
											</div>
											<p id="codigo-hint" className="text-sm text-muted-foreground">
												Presiona Enter o haz clic en el botón para validar
											</p>
										</div>

										{/* Mensaje de error */}
										<AnimatePresence>
											{error && (
												<motion.div
													initial={{ opacity: 0, y: -10 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: -10 }}
												>
													<Alert variant="destructive" className="border-2">
														<AlertCircle className="h-5 w-5" />
														<AlertDescription className="font-medium">{error}</AlertDescription>
													</Alert>
												</motion.div>
											)}
										</AnimatePresence>

										{/* Sección de ayuda */}
										<div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
											<div className="flex gap-4">
												<div className="p-2 bg-blue-100 rounded-lg h-fit">
													<MessageSquare className="h-5 w-5 text-blue-600" />
												</div>
												<div>
													<h4 className="font-semibold text-blue-900 mb-1">¿No tienes un código?</h4>
													<p className="text-sm text-blue-800">
														Contáctanos por WhatsApp y te enviaremos tu código de pago personalizado 
														con todos los detalles de tu traslado.
													</p>
												</div>
											</div>
										</div>

										{/* Características de seguridad */}
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<Shield className="h-4 w-4 text-green-600" />
												<span>Pago 100% seguro</span>
											</div>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<CheckCircle className="h-4 w-4 text-green-600" />
												<span>Confirmación inmediata</span>
											</div>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<CreditCard className="h-4 w-4 text-green-600" />
												<span>Múltiples métodos</span>
											</div>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						)}

						{/* =============== PASO 2: COMPLETAR DATOS Y PAGAR =============== */}
						{step === 2 && codigoValidado && (
							<motion.div
								key="step2"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
								className="space-y-6"
							>
								{/* Resumen del servicio - Tarjeta destacada */}
								<Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
									<div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -translate-y-16 translate-x-16" />
									<CardContent className="p-6 relative">
										<div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
											<div className="flex items-start gap-4">
												<div className="p-3 bg-green-100 rounded-xl">
													<CheckCircle className="h-8 w-8 text-green-600" />
												</div>
												<div>
													<h3 className="text-xl font-bold text-green-900 mb-1">
														¡Código Validado!
													</h3>
													<Badge className="bg-green-600 text-white font-mono text-base px-3 py-1">
														{codigoValidado.codigo}
													</Badge>
												</div>
											</div>
											<div className="text-right">
												<p className="text-sm text-green-700 mb-1">Total del servicio</p>
												<p className="text-3xl font-bold text-green-800">
													{formatCurrency(codigoValidado.monto)}
												</p>
											</div>
										</div>

										{/* Detalles del viaje en grid */}
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
											<div className="bg-white/60 rounded-lg p-4 flex items-start gap-3">
												<MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
												<div>
													<p className="text-xs text-green-700 font-medium">Origen</p>
													<p className="font-semibold text-green-900">{codigoValidado.origen}</p>
												</div>
											</div>
											<div className="bg-white/60 rounded-lg p-4 flex items-start gap-3">
												<MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
												<div>
													<p className="text-xs text-green-700 font-medium">Destino</p>
													<p className="font-semibold text-green-900">{codigoValidado.destino}</p>
												</div>
											</div>
											<div className="bg-white/60 rounded-lg p-4 flex items-start gap-3">
												<Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
												<div>
													<p className="text-xs text-green-700 font-medium">Pasajeros</p>
													<p className="font-semibold text-green-900">{codigoValidado.pasajeros} persona(s)</p>
												</div>
											</div>
											{codigoValidado.vehiculo && (
												<div className="bg-white/60 rounded-lg p-4 flex items-start gap-3">
													<Car className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
													<div>
														<p className="text-xs text-green-700 font-medium">Vehículo</p>
														<p className="font-semibold text-green-900">{codigoValidado.vehiculo}</p>
													</div>
												</div>
											)}
										</div>

										{esIdaVuelta && (
											<div className="mt-4 flex items-center gap-2">
												<Badge className="bg-blue-500 text-white">
													🔄 Ida y Vuelta
												</Badge>
												<span className="text-sm text-green-700">
													Este servicio incluye traslado de ida y regreso
												</span>
											</div>
										)}

										{codigoValidado.descripcion && (
											<p className="mt-4 text-sm text-green-800 bg-white/40 rounded-lg p-3">
												{codigoValidado.descripcion}
											</p>
										)}
									</CardContent>
								</Card>

								{/* Formulario de datos del cliente */}
								<Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
									<CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-primary/10 rounded-lg">
												<User className="h-6 w-6 text-primary" />
											</div>
											<div>
												<CardTitle className="text-xl">Completa tus datos</CardTitle>
												<CardDescription>
													Ingresa la información necesaria para tu traslado
												</CardDescription>
											</div>
										</div>
									</CardHeader>

									<CardContent className="p-6 space-y-6">
										{/* Aviso para ida y vuelta */}
										{esIdaVuelta && (
											<Alert className="bg-purple-50 border-purple-200 text-purple-800">
												<Calendar className="h-4 w-4" />
												<AlertDescription>
													Este servicio incluye <strong>ida y vuelta</strong>. Por favor indica también la fecha y hora de regreso.
												</AlertDescription>
											</Alert>
										)}

										{/* Campos del formulario */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
											{/* Nombre */}
											<div className="space-y-2">
												<Label htmlFor="nombre" className="flex items-center gap-2">
													<User className="h-4 w-4 text-muted-foreground" />
													Nombre completo <span className="text-red-500">*</span>
												</Label>
												<Input
													id="nombre"
													name="nombre"
													value={formData.nombre}
													onChange={handleInputChange}
													placeholder="Juan Pérez"
													className="h-12"
													required
												/>
											</div>

											{/* Email */}
											<div className="space-y-2">
												<Label htmlFor="email" className="flex items-center gap-2">
													<span className="text-muted-foreground">@</span>
													Correo electrónico <span className="text-red-500">*</span>
												</Label>
												<Input
													id="email"
													name="email"
													type="email"
													value={formData.email}
													onChange={handleInputChange}
													placeholder="tu@email.cl"
													className="h-12"
													required
												/>
											</div>

											{/* Teléfono */}
											<div className="space-y-2">
												<Label htmlFor="telefono" className="flex items-center gap-2">
													<span className="text-muted-foreground">📱</span>
													Teléfono <span className="text-red-500">*</span>
												</Label>
												<Input
													id="telefono"
													name="telefono"
													value={formData.telefono}
													onChange={handleInputChange}
													placeholder="+56 9 1234 5678"
													className="h-12"
													required
												/>
											</div>

											{/* Número de vuelo */}
											<div className="space-y-2">
												<Label htmlFor="numeroVuelo" className="flex items-center gap-2">
													<Plane className="h-4 w-4 text-muted-foreground" />
													Número de vuelo (opcional)
												</Label>
												<Input
													id="numeroVuelo"
													name="numeroVuelo"
													value={formData.numeroVuelo}
													onChange={handleInputChange}
													placeholder="LA1234"
													className="h-12"
												/>
											</div>

											{/* Fecha del servicio */}
											<div className="space-y-2">
												<Label htmlFor="fecha" className="flex items-center gap-2">
													<Calendar className="h-4 w-4 text-muted-foreground" />
													Fecha del servicio <span className="text-red-500">*</span>
												</Label>
												<Input
													id="fecha"
													name="fecha"
													type="date"
													value={formData.fecha}
													onChange={handleInputChange}
													min={new Date().toISOString().split("T")[0]}
													className="h-12"
													required
												/>
											</div>

											{/* Hora del servicio */}
											<div className="space-y-2">
												<Label htmlFor="hora" className="flex items-center gap-2">
													<Clock className="h-4 w-4 text-muted-foreground" />
													Hora del servicio <span className="text-red-500">*</span>
												</Label>
												<select
													id="hora"
													name="hora"
													value={formData.hora}
													onChange={handleInputChange}
													required
													className="h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
												>
													<option value="">Selecciona la hora</option>
													{timeOptions.map((hora) => (
														<option key={hora} value={hora}>{hora}</option>
													))}
												</select>
											</div>

											{/* Campos para ida y vuelta */}
											{esIdaVuelta && (
												<>
													<div className="space-y-2">
														<Label htmlFor="fechaRegreso" className="flex items-center gap-2">
															<Calendar className="h-4 w-4 text-muted-foreground" />
															Fecha de regreso <span className="text-red-500">*</span>
														</Label>
														<Input
															id="fechaRegreso"
															name="fechaRegreso"
															type="date"
															value={formData.fechaRegreso}
															onChange={handleInputChange}
															min={formData.fecha || new Date().toISOString().split("T")[0]}
															className="h-12"
															required={esIdaVuelta}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="horaRegreso" className="flex items-center gap-2">
															<Clock className="h-4 w-4 text-muted-foreground" />
															Hora de regreso <span className="text-red-500">*</span>
														</Label>
														<select
															id="horaRegreso"
															name="horaRegreso"
															value={formData.horaRegreso}
															onChange={handleInputChange}
															required={esIdaVuelta}
															className="h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
														>
															<option value="">Selecciona la hora de regreso</option>
															{timeOptions.map((hora) => (
																<option key={`regreso-${hora}`} value={hora}>{hora}</option>
															))}
														</select>
														<p className="text-xs text-muted-foreground">
															La hora de regreso debe ser posterior al viaje de ida
														</p>
													</div>
												</>
											)}

											{/* Dirección de destino (cuando origen es aeropuerto) */}
											{codigoValidado?.origen === "Aeropuerto La Araucanía" && (
												<div className="space-y-2 md:col-span-2">
													<Label htmlFor="direccionDestino" className="flex items-center gap-2">
														<MapPin className="h-4 w-4 text-muted-foreground" />
														Dirección de destino <span className="text-red-500">*</span>
													</Label>
													<Input
														id="direccionDestino"
														name="direccionDestino"
														value={formData.direccionDestino}
														onChange={handleInputChange}
														placeholder="Ej: Av. Alemania 1234, Temuco"
														className="h-12"
														required
													/>
												</div>
											)}

											{/* Dirección de origen (cuando destino es aeropuerto) */}
											{codigoValidado?.destino === "Aeropuerto La Araucanía" && (
												<div className="space-y-2 md:col-span-2">
													<Label htmlFor="direccionOrigen" className="flex items-center gap-2">
														<MapPin className="h-4 w-4 text-muted-foreground" />
														Dirección de origen <span className="text-red-500">*</span>
													</Label>
													<Input
														id="direccionOrigen"
														name="direccionOrigen"
														value={formData.direccionOrigen}
														onChange={handleInputChange}
														placeholder="Ej: Av. O'Higgins 567, Temuco"
														className="h-12"
														required
													/>
												</div>
											)}

											{/* Hotel */}
											<div className="space-y-2 md:col-span-2">
												<Label htmlFor="hotel" className="flex items-center gap-2">
													<Building2 className="h-4 w-4 text-muted-foreground" />
													Hotel o alojamiento (opcional)
												</Label>
												<Input
													id="hotel"
													name="hotel"
													value={formData.hotel}
													onChange={handleInputChange}
													placeholder="Hotel Dreams Araucanía"
													className="h-12"
												/>
											</div>

											{/* Mensaje adicional */}
											<div className="space-y-2 md:col-span-2">
												<Label htmlFor="mensaje" className="flex items-center gap-2">
													<MessageSquare className="h-4 w-4 text-muted-foreground" />
													Mensaje adicional (opcional)
												</Label>
												<textarea
													id="mensaje"
													name="mensaje"
													value={formData.mensaje}
													onChange={handleInputChange}
													placeholder="Información adicional sobre tu viaje, equipaje especial, etc."
													rows={3}
													className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
												/>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Mensaje de error general */}
								<AnimatePresence>
									{error && (
										<motion.div
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -10 }}
										>
											<Alert variant="destructive" className="border-2">
												<AlertCircle className="h-5 w-5" />
												<AlertDescription className="font-medium">{error}</AlertDescription>
											</Alert>
										</motion.div>
									)}
								</AnimatePresence>

								{/* Sección de pago */}
								<Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
									<CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-primary/10 rounded-lg">
												<CreditCard className="h-6 w-6 text-primary" />
											</div>
											<div>
												<CardTitle className="text-xl">Método de Pago</CardTitle>
												<CardDescription>
													Elige cómo deseas realizar tu pago
												</CardDescription>
											</div>
										</div>
									</CardHeader>

									<CardContent className="p-6 space-y-6">
										{/* Selección de monto */}
										<div className="space-y-4">
											<h4 className="font-semibold text-lg flex items-center gap-2">
												<span>💰</span> Monto a pagar
											</h4>
											<p className="text-sm text-muted-foreground">
												{codigoValidado?.permitirAbono 
													? "Elige si deseas pagar la totalidad o abonar el 40% para reservar tu traslado."
													: "Completa el pago total del servicio para confirmar tu reserva."
												}
											</p>
											
											<div className={`grid gap-4 ${codigoValidado?.permitirAbono ? "md:grid-cols-2" : "md:grid-cols-1 max-w-md"}`}>
												{codigoValidado?.permitirAbono && (
													<button
														type="button"
														onClick={() => setSelectedPaymentType("abono")}
														disabled={procesando || abonoSugerido <= 0}
														className={`
															relative p-5 rounded-xl border-2 text-left transition-all duration-200
															${selectedPaymentType === "abono"
																? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
																: "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
															}
															${procesando ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
														`}
													>
														{selectedPaymentType === "abono" && (
															<div className="absolute -top-2 -right-2">
																<span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
																	<CheckCircle className="h-4 w-4" />
																</span>
															</div>
														)}
														<div className="flex items-center gap-3 mb-2">
															<span className="text-2xl">💳</span>
															<span className="font-semibold text-base">Abonar 40%</span>
														</div>
														<p className="text-2xl font-bold text-primary mb-1">
															{formatCurrency(abonoSugerido)}
														</p>
														<p className="text-xs text-muted-foreground">
															Reserva ahora, paga el resto después
														</p>
													</button>
												)}
												
												<button
													type="button"
													onClick={() => setSelectedPaymentType("total")}
													disabled={procesando || montoTotal <= 0}
													className={`
														relative p-5 rounded-xl border-2 text-left transition-all duration-200
														${selectedPaymentType === "total"
															? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
															: "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
														}
														${procesando ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
													`}
												>
													{selectedPaymentType === "total" && (
														<div className="absolute -top-2 -right-2">
															<span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
																<CheckCircle className="h-4 w-4" />
															</span>
														</div>
													)}
													<div className="flex items-center gap-3 mb-2">
														<span className="text-2xl">✨</span>
														<span className="font-semibold text-base">Pagar 100%</span>
														{!codigoValidado?.permitirAbono && (
															<Badge className="bg-green-100 text-green-700 text-xs">Recomendado</Badge>
														)}
													</div>
													<p className="text-2xl font-bold text-primary mb-1">
														{formatCurrency(montoTotal)}
													</p>
													<p className="text-xs text-muted-foreground">
														Pago completo del servicio
													</p>
												</button>
											</div>

											{/* Resumen del pago */}
											<div className="bg-gray-50 rounded-lg p-4 space-y-2">
												<div className="flex justify-between text-sm">
													<span>Monto a pagar ahora:</span>
													<span className="font-bold text-lg">{formatCurrency(montoSeleccionado)}</span>
												</div>
												{selectedPaymentType === "abono" && (
													<div className="flex justify-between text-sm text-amber-700">
														<span>Saldo pendiente (al momento del servicio):</span>
														<span className="font-medium">{formatCurrency(saldoPendiente)}</span>
													</div>
												)}
											</div>
										</div>

										{/* Botón de pago con Flow */}
										<div className="pt-4 border-t">
											<Button
												onClick={procesarPagoConCodigoFlow}
												disabled={procesando || !montoSeleccionado || montoSeleccionado <= 0}
												className="w-full h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/90"
												size="lg"
											>
												{loadingGateway === "flow" ? (
													<>
														<LoaderCircle className="h-6 w-6 animate-spin mr-3" />
														Procesando...
													</>
												) : (
													<>
														<img
															src={flow}
															alt="Flow"
															className="h-7 w-auto object-contain mr-3 brightness-0 invert"
														/>
														Pagar {formatCurrency(montoSeleccionado)} con Flow
														<ArrowRight className="h-5 w-5 ml-3" />
													</>
												)}
											</Button>
											<p className="text-center text-xs text-muted-foreground mt-3">
												Serás redirigido a Flow para completar el pago de forma segura
											</p>
											<div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
												<span className="flex items-center gap-1">
													<Shield className="h-3 w-3" /> Webpay
												</span>
												<span className="flex items-center gap-1">
													<CreditCard className="h-3 w-3" /> Tarjetas
												</span>
												<span className="flex items-center gap-1">
													<span>🏦</span> Transferencia
												</span>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Botón para volver */}
								<div className="flex justify-start">
									<Button
										type="button"
										variant="ghost"
										onClick={() => {
											setStep(1);
											setCodigoValidado(null);
											setError("");
											setSelectedPaymentType("total");
										}}
										disabled={procesando}
										className="text-muted-foreground hover:text-foreground"
									>
										<ArrowLeft className="h-4 w-4 mr-2" />
										Usar otro código
									</Button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</section>
	);
}

export default PagarConCodigo;
