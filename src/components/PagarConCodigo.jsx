import React, { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { AddressAutocomplete } from "./ui/address-autocomplete";
import WhatsAppButton from "./WhatsAppButton";
import { 
	LoaderCircle, 
	CheckCircle, 
	AlertCircle, 
	CreditCard,
	MapPin,
	Calendar,
	Clock,
	ArrowRight,
	User,
	Phone,
	Mail,
	Plane,
	Building2,
	Shield,
	Baby,
	Info
} from "lucide-react";
import { getBackendUrl } from "../lib/backend";

// Formateador de moneda para pesos chilenos
const CURRENCY_FORMATTER = new Intl.NumberFormat("es-CL", {
	style: "currency",
	currency: "CLP",
});

// Opciones de hora en intervalos de 15 minutos (8:00 AM - 9:00 PM) - constante estática
const TIME_OPTIONS = (() => {
	const options = [];
	for (let hour = 8; hour <= 21; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const horaStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
			options.push(horaStr);
		}
	}
	return options;
})();

// Componente para pagar usando un código de pago estandarizado
function PagarConCodigo() {
	const [codigo, setCodigo] = useState("");
	const [validando, setValidando] = useState(false);
	const [codigoValidado, setCodigoValidado] = useState(null);
	const [error, setError] = useState("");
	const [showContactButton, setShowContactButton] = useState(false);
	const [step, setStep] = useState(1); // 1: Validar código, 2: Completar datos y pagar
	const [selectedPaymentType, setSelectedPaymentType] = useState("total"); // 'total' | 'abono'

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
	const [tiempoRestante, setTiempoRestante] = useState(null);

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
	const incluyeSillaInfantil = Boolean(codigoValidado?.sillaInfantil);

	// Calcular tiempo restante hasta el vencimiento del código
	const calcularTiempoRestante = (fechaVencimiento) => {
		if (!fechaVencimiento) return null;
		
		const ahora = new Date();
		const vencimiento = new Date(fechaVencimiento);
		const diff = vencimiento - ahora;
		
		if (diff <= 0) return { vencido: true, texto: 'Código vencido', urgente: true };
		
		const minutos = Math.floor(diff / 60000);
		const horas = Math.floor(minutos / 60);
		
		if (horas > 0) {
			const urgente = horas < 2;
			return { 
				vencido: false, 
				texto: `${horas}h ${minutos % 60}m`, 
				urgente
			};
		}
		return { 
			vencido: false, 
			texto: `${minutos} minutos`, 
			urgente: minutos < 15
		};
	};

	// Actualizar tiempo restante cada minuto
	useEffect(() => {
		if (!codigoValidado?.fechaVencimiento) return;
		
		const actualizar = () => {
			const tiempo = calcularTiempoRestante(codigoValidado.fechaVencimiento);
			setTiempoRestante(tiempo);
		};
		
		actualizar(); // Actualizar inmediatamente
		const intervalo = setInterval(actualizar, 60000); // Cada minuto
		
		return () => clearInterval(intervalo);
	}, [codigoValidado]);

	// Validar el código de pago
	const validarCodigo = async () => {
		if (!codigo.trim()) {
			setError("Por favor ingresa un código de pago");
			return;
		}

		setValidando(true);
		setValidando(true);
		setError("");
		setShowContactButton(false);

		try {
			const response = await fetch(
				`${backendUrl}/api/codigos-pago/${codigo.toUpperCase()}`
			);

			const data = await response.json();

			if (!response.ok || data.success === false) {
				const isExpiredOrUsed = data.estado === "vencido" || data.estado === "usado";
				
				if (isExpiredOrUsed) {
					setError("Lo sentimos, debido a la alta demanda, este cupo ha sido reservado por otro pasajero.");
					setShowContactButton(true);
				} else {
					setError(data.message || "Código inválido");
					setShowContactButton(false);
				}
				
				setCodigoValidado(null);
				return;
			}

			setCodigoValidado(data.codigoPago);

			// Pre-llenar formulario con datos del código si están disponibles
			setFormData((prev) => ({
				...prev,
				// Solo sobrescribir si el código tiene datos
				nombre: data.codigoPago.nombreCliente || prev.nombre,
				email: data.codigoPago.emailCliente || prev.email,
				telefono: data.codigoPago.telefonoCliente || prev.telefono,
				// Determinar qué campo de dirección usar según el sentido del viaje
				direccionDestino:
					data.codigoPago.origen === "Aeropuerto La Araucanía"
						? (data.codigoPago.direccionCliente || prev.direccionDestino)
						: prev.direccionDestino,
				direccionOrigen:
					data.codigoPago.destino === "Aeropuerto La Araucanía"
						? (data.codigoPago.direccionCliente || prev.direccionOrigen)
						: prev.direccionOrigen
			}));

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

		// Si NO es un pago vinculado, validar fecha, hora y dirección
		if (!codigoValidado?.codigoReservaVinculado) {
			if (!formData.fecha) {
				setError("Por favor selecciona la fecha del servicio");
				return false;
			}
			if (!formData.hora) {
				setError("Por favor selecciona la hora del servicio");
				return false;
			}
		}

		if (esIdaVuelta && !codigoValidado?.codigoReservaVinculado) {
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
		// Validar dirección obligatoria según sentido del viaje (solo si NO es pago vinculado)
		if (codigoValidado && !codigoValidado.codigoReservaVinculado) {
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
				sillaInfantil: incluyeSillaInfantil,
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

			let reservaId = null;
			let codigoReservaGenerado = null;

			// SI EL CÓDIGO YA ESTÁ VINCULADO A UNA RESERVA (POR ID O POR CÓDIGO AR-...), NO CREAMOS UNA NUEVA
			if (codigoValidado.reservaVinculadaId || codigoValidado.codigoReservaVinculado) {
				console.log("🔗 Pago vinculado detectado. Saltando creación de reserva express.");
				reservaId = codigoValidado.reservaVinculadaId || null;
				codigoReservaGenerado = codigoValidado.codigoReservaVinculado || null;
			} else {
				// FLUJO NORMAL: Crear reserva express
				const r = await fetch(`${backendUrl}/enviar-reserva-express`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(reservaPayload),
				});
				const rj = await r.json();
				if (!r.ok || rj.success === false) {
					throw new Error(rj.message || "No se pudo crear la reserva");
				}
				reservaId = rj.reservaId || rj.reserva?.id || null;
				codigoReservaGenerado =
					rj.codigoReserva ||
					rj.codigo_reserva ||
					rj.reserva?.codigoReserva ||
					null;
			}

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

			const description = `Traslado ${codigoValidado.origen} - ${codigoValidado.destino}${codigoValidado.descripcion ? ` (${codigoValidado.descripcion})` : ""}`;
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
					paymentOrigin: "pagar_con_codigo", // Identificador de flujo para redirección correcta
					codigoPagoId: codigoValidado.id,
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
						{codigoValidado?.codigoReservaVinculado && (
							<div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
								<Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
								<div className="flex-1">
									<p className="text-sm font-semibold text-primary">Pago de Diferencia</p>
									<p className="text-xs text-primary/80 mt-1">
										Este pago está vinculado a la reserva <strong>{codigoValidado.codigoReservaVinculado}</strong>. No se generará un nuevo viaje.
									</p>
									{codigoValidado.descripcion && (
										<div className="mt-2 pt-2 border-t border-primary/20">
											<p className="text-xs text-primary/70 font-medium">Motivo:</p>
											<p className="text-sm text-primary font-semibold italic">"{codigoValidado.descripcion}"</p>
										</div>
									)}
								</div>
							</div>
						)}
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
								<Alert variant="destructive" className="flex flex-col gap-4">
									<div className="flex items-center gap-2">
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>{error}</AlertDescription>
									</div>
									{showContactButton && (
										<div className="w-full flex justify-end">
											<WhatsAppButton 
												variant="outline" 
												size="sm" 
												className="bg-white/10 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
												message={`Hola, intenté pagar el código ${codigo} pero me indica que el cupo fue reservado. ¿Me pueden ayudar?`}
											>
												Contactar Soporte
											</WhatsAppButton>
										</div>
									)}
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
								{incluyeSillaInfantil && (
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">Extras:</span>
										<Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
											<Baby className="h-3 w-3 mr-1" /> Silla de Niño
										</Badge>
									</div>
								)}
								<div className="flex justify-between items-center pt-2 border-t">
									<span className="text-sm font-semibold">Total:</span>
									<span className="text-xl font-bold text-primary">{formatCurrency(montoTotal)}</span>
								</div>
							</div>

							{/* Alerta de tiempo restante */}
							{tiempoRestante && (
								<Alert 
									variant={tiempoRestante.vencido ? "destructive" : "default"}
									className={`${
										tiempoRestante.vencido 
											? 'bg-red-50 border-red-200' 
											: tiempoRestante.urgente 
												? 'bg-orange-50 border-orange-200' 
												: 'bg-blue-50 border-blue-200'
									}`}
								>
									<div className="flex items-start gap-3">
										<Clock className={`h-5 w-5 mt-0.5 ${
											tiempoRestante.vencido 
												? 'text-red-600' 
												: tiempoRestante.urgente 
													? 'text-orange-600' 
													: 'text-blue-600'
										}`} />
										<div className="flex-1">
											<p className={`font-semibold ${
												tiempoRestante.vencido 
													? 'text-red-700' 
													: tiempoRestante.urgente 
														? 'text-orange-700' 
														: 'text-blue-700'
											}`}>
												{tiempoRestante.vencido ? '⏰ Código Vencido' : `⏰ Tiempo restante: ${tiempoRestante.texto}`}
											</p>
											<p className={`text-sm mt-1 ${
												tiempoRestante.vencido 
													? 'text-red-600' 
													: tiempoRestante.urgente 
														? 'text-orange-600' 
														: 'text-blue-600'
											}`}>
												{tiempoRestante.vencido 
													? 'Este código ya no es válido. Por favor contacta a soporte.' 
													: tiempoRestante.urgente 
														? '¡Apúrate! Completa tu pago antes de que venza el código.' 
														: 'Completa tu pago antes de que venza el código.'
												}
											</p>
										</div>
									</div>
								</Alert>
							)}

							{/* Formulario de datos */}
							<div className="space-y-4">
								{codigoValidado?.codigoReservaVinculado ? (
									/* Vista de Resumen para Pagos Vinculados */
									<div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-4">
										<p className="text-sm font-semibold text-primary border-b border-primary/10 pb-2">
											Datos del Cliente (Asociados a la reserva)
										</p>
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
											<div className="space-y-1">
												<span className="text-xs text-muted-foreground block">Nombre</span>
												<span className="text-sm font-medium flex items-center gap-2">
													<User className="h-4 w-4 text-primary/60 flex-shrink-0" />
													<span className="break-words">{formData.nombre}</span>
												</span>
											</div>
											<div className="space-y-1">
												<span className="text-xs text-muted-foreground block">Email</span>
												<span className="text-sm font-medium flex items-center gap-2">
													<Mail className="h-4 w-4 text-primary/60 flex-shrink-0" />
													<span className="break-all">{formData.email}</span>
												</span>
											</div>
											<div className="space-y-1">
												<span className="text-xs text-muted-foreground block">Teléfono</span>
												<span className="text-sm font-medium flex items-center gap-2">
													<Phone className="h-4 w-4 text-primary/60 flex-shrink-0" />
													<span>{formData.telefono}</span>
												</span>
											</div>
										</div>
									</div>
								) : (
									/* Vista de Formulario para Códigos Normales */
									<>
										{/* Nombre */}
										<div className="space-y-2">
											<Label htmlFor="nombre" className="text-sm font-semibold text-foreground">
												Nombre completo <span className="text-red-500">*</span>
											</Label>
											<div className="relative">
												<User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
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
													<Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
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
													<Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
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
									</>
								)}

								{/* Datos de viaje (Fecha, Hora, Dirección, etc.) - OCULTOS SI ES PAGO VINCULADO */}
								{!codigoValidado?.codigoReservaVinculado && (
									<>
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
														{TIME_OPTIONS.map((hora) => (
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
															{TIME_OPTIONS.map((hora) => (
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
												<AddressAutocomplete
													id="direccionDestino"
													name="direccionDestino"
													value={formData.direccionDestino}
													onChange={handleInputChange}
													placeholder="Av. Alemania 1234, Temuco"
													className="w-full h-11 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
													required
												/>
											</div>
										)}
										{codigoValidado?.destino === "Aeropuerto La Araucanía" && (
											<div className="space-y-2">
												<Label htmlFor="direccionOrigen" className="text-sm font-semibold text-foreground">
													Dirección de origen <span className="text-red-500">*</span>
												</Label>
												<AddressAutocomplete
													id="direccionOrigen"
													name="direccionOrigen"
													value={formData.direccionOrigen}
													onChange={handleInputChange}
													placeholder="Av. O'Higgins 567, Temuco"
													className="w-full h-11 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
													required
												/>
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
									</>
								)}
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
