import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import { LoaderCircle, Calendar, Users } from "lucide-react";
import heroVan from "../assets/hero-van.png";
import flow from "../assets/formasPago/flow.png";
import CodigoDescuento from "./CodigoDescuento";
import { getBackendUrl } from "../lib/backend";

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
	const [stepError, setStepError] = useState("");
	const [showBookingModule, setShowBookingModule] = useState(false);
	const [paymentConsent, setPaymentConsent] = useState(false);
	const [selectedPaymentType, setSelectedPaymentType] = useState(null); // 'abono' o 'total'
	const [reservaActiva, setReservaActiva] = useState(null); // Reserva activa sin pagar encontrada
	const [verificandoReserva, setVerificandoReserva] = useState(false);

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", {
				style: "currency",
				currency: "CLP",
			}),
		[]
	);

	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	// Datos calculados
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
					console.log("⚠️ Se encontró reserva activa sin pagar:", data.reserva);
				} else {
					setReservaActiva(null);
				}
			}
		} catch (error) {
			console.error("Error verificando reserva activa:", error);
			// No mostramos error al usuario, simplemente continuamos
			setReservaActiva(null);
		} finally {
			setVerificandoReserva(false);
		}
	};

	// Validar datos antes de guardar o pagar
	const validarDatosReserva = () => {
		if (!formData.nombre?.trim()) {
			setStepError("Ingresa tu nombre completo.");
			return false;
		}

		if (!formData.email?.trim()) {
			setStepError("Ingresa tu correo electrónico.");
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setStepError("El correo electrónico no es válido.");
			return false;
		}

		if (!formData.telefono?.trim()) {
			setStepError("Ingresa tu teléfono móvil.");
			return false;
		}

		// Validación suave del teléfono (no bloquea el proceso)
		if (!validarTelefono(formData.telefono)) {
			setPhoneError("Verifica el formato del teléfono (ej: +56 9 1234 5678)");
		} else {
			setPhoneError("");
		}

		if (!paymentConsent) {
			setStepError("Debes aceptar los términos para continuar.");
			return false;
		}

		setStepError("");
		return true;
	};

	// Guardar reserva para continuar después (sin pago inmediato)
	const handleGuardarReserva = async () => {
		if (!validarDatosReserva()) {
			return;
		}

		// Procesar la reserva express (sin pago)
		const result = await onSubmitWizard();

		if (!result.success) {
			if (result.message) {
				setStepError(`Error: ${result.message}`);
			} else {
				setStepError("Ocurrió un error. Por favor, inténtalo de nuevo.");
			}
			return;
		}

		// Mostrar mensaje de éxito
		alert(
			"✅ Reserva guardada exitosamente. Te hemos enviado la confirmación por email. Podrás completar el pago más tarde usando el enlace que te enviamos."
		);
	};

	// Procesar pago (guarda reserva primero y luego redirige a pago)
	const handleProcesarPago = async (gateway, type) => {
		if (!validarDatosReserva()) {
			return;
		}

		// Primero guardar la reserva
		const result = await onSubmitWizard();

		if (!result.success) {
			if (result.message) {
				setStepError(`Error: ${result.message}`);
			} else {
				setStepError("Ocurrió un error. Por favor, inténtalo de nuevo.");
			}
			return;
		}

		// Si la reserva se guardó exitosamente, proceder con el pago usando los identificadores frescos
		handlePayment(gateway, type, {
			reservaId: result.reservaId,
			codigoReserva: result.codigoReserva,
		});
	};

	// Opciones de pago simplificadas
	const paymentOptions = useMemo(
		() => [
			{
				id: "abono",
				type: "abono",
				title: "Reservar con 40%",
				subtitle: "Paga el resto al llegar",
				amount: pricing.abono,
				recommended: true,
			},
			{
				id: "total",
				type: "total",
				title: "Pagar el 100%",
				subtitle: "Descuento completo aplicado",
				amount: pricing.totalConDescuento,
			},
		],
		[pricing.abono, pricing.totalConDescuento]
	);

	const paymentMethods = useMemo(
		() => [
			{
				id: "flow",
				gateway: "flow",
				title: "Flow",
				subtitle: "Webpay • Tarjetas • Transferencia",
				image: flow,
			},
		],
		[]
	);

	const baseDiscountPercentage = Math.round((baseDiscountRate || 0) * 100);
	const promoDiscountPercentage = Math.round(
		(promotionDiscountRate || 0) * 100
	);

	// Validar si todos los campos obligatorios del paso 2 están completos
	const todosLosCamposCompletos = useMemo(() => {
		const nombreValido = formData.nombre?.trim().length > 0;
		const emailValido =
			formData.email?.trim().length > 0 &&
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
		const telefonoValido = formData.telefono?.trim().length > 0;
		const consentimientoValido = paymentConsent;

		return (
			nombreValido && emailValido && telefonoValido && consentimientoValido
		);
	}, [
		formData.nombre,
		formData.email,
		formData.telefono,
		paymentConsent,
	]);

	return (
		<section
			id="inicio"
			className="relative bg-gradient-to-r from-primary to-secondary text-white min-h-screen flex items-center"
		>
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: `url(${heroVan})` }}
			></div>
			<div className="absolute inset-0 bg-black/50"></div>

			<div className="relative container mx-auto px-4 text-center pt-4 md:pt-6 pb-16 md:pb-24">
				{!showBookingModule && (
					<>
						<h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-2xl">
							Traslados Privados Aeropuerto La Araucanía
							<br />
							<span className="text-accent drop-shadow-lg text-3xl md:text-5xl">
								Reserva en 2 minutos
							</span>
						</h1>
						<p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-lg">
							Descubre La Araucanía con nuestros traslados privados: conectamos
							el aeropuerto directamente con Pucón, Villarrica, Malalcahuello y
							todos los destinos turísticos de la región.
							<br />
							<span className="text-accent font-bold">
								¡Aprovecha nuestro descuento web del {baseDiscountPercentage}%
								garantizado
								{promoDiscountPercentage > 0 &&
									` + ${promoDiscountPercentage}% extra`}
								!
							</span>
						</p>
					</>
				)}

				{!showBookingModule && (
					<div className="flex flex-col items-center justify-center space-y-6">
						<Button
							onClick={() => setShowBookingModule(true)}
							className="bg-accent hover:bg-accent/90 text-accent-foreground px-12 py-6 text-2xl font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 drop-shadow-lg animate-bounce hover:animate-none"
						>
							🚀 Reservar ahora
						</Button>
						<Button
							variant="outline"
							className="bg-transparent border-white text-white hover:bg-white/10"
							asChild
						>
							<a href="#consultar-reserva">Continuar con código</a>
						</Button>
						<p className="text-lg text-white/95 drop-shadow-md font-medium">
							Proceso súper rápido • Solo 2 pasos • Pago seguro
						</p>
					</div>
				)}

				{showBookingModule && (
					<div className="w-full">
						<div className="text-center mb-6">
							<h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-2xl mb-3">
								¡Reserva express y ahorra!
							</h3>
							<p className="text-lg md:text-xl text-white/95 drop-shadow-lg font-medium">
								Solo 2 pasos • Descuento del{" "}
								<span className="text-accent font-bold text-2xl">
									{baseDiscountPercentage}%
								</span>{" "}
								aplicado automáticamente
							</p>
						</div>

						<Card className="max-w-4xl mx-auto bg-gray-900 text-white shadow-2xl rounded-2xl border-none">
    <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna Izquierda: Detalles del Viaje */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="origen-express" className="text-gray-400">Origen</Label>
                    <select id="origen-express" name="origen" value={formData.origen} onChange={handleInputChange} className="h-12 w-full rounded-md border-gray-700 bg-gray-800 px-3 py-2 text-base text-white focus:ring-accent focus:border-accent">
                        {origenes.map(origen => <option key={origen} value={origen}>{origen}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="destino-express" className="text-gray-400">Destino</Label>
                    <select id="destino-express" name="destino" value={formData.destino} onChange={handleInputChange} className="h-12 w-full rounded-md border-gray-700 bg-gray-800 px-3 py-2 text-base text-white focus:ring-accent focus:border-accent">
                        <option value="">Seleccionar destino</option>
                        {destinos.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fecha-express" className="text-gray-400">Fecha</Label>
                        <Input id="fecha-express" type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} min={minDateTime} className="h-12 bg-gray-800 border-gray-700 text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pasajeros-express" className="text-gray-400">Pasajeros</Label>
                        <select id="pasajeros-express" name="pasajeros" value={formData.pasajeros} onChange={handleInputChange} className="h-12 w-full rounded-md border-gray-700 bg-gray-800 px-3 py-2 text-base text-white focus:ring-accent focus:border-accent">
                            {[...Array(maxPasajeros)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="ida-vuelta-express" checked={formData.idaVuelta} onCheckedChange={value => handleInputChange({ target: { name: 'idaVuelta', value: !!value }})} className="border-gray-600 data-[state=checked]:bg-accent" />
                    <label htmlFor="ida-vuelta-express" className="text-gray-400">¿Necesitas viaje de regreso?</label>
                </div>
                {formData.idaVuelta && (
                    <div className="space-y-2">
                        <Label htmlFor="fecha-regreso-express" className="text-gray-400">Fecha de regreso</Label>
                        <Input id="fecha-regreso-express" type="date" name="fechaRegreso" value={formData.fechaRegreso} onChange={handleInputChange} min={formData.fecha || minDateTime} className="h-12 bg-gray-800 border-gray-700 text-white" />
                    </div>
                )}
            </div>

            {/* Columna Derecha: Datos de Contacto y Pago */}
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre-express" className="text-gray-400">Nombre</Label>
                        <Input id="nombre-express" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Tu nombre" className="h-12 bg-gray-800 border-gray-700 text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="telefono-express" className="text-gray-400">Teléfono</Label>
                        <Input id="telefono-express" name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="+56 9..." className="h-12 bg-gray-800 border-gray-700 text-white" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email-express" className="text-gray-400">Correo electrónico</Label>
                    <Input id="email-express" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="tu@email.com" className="h-12 bg-gray-800 border-gray-700 text-white" />
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-gray-300">🎟️ ¿Tienes un código de descuento?</h4>
                    <CodigoDescuento
                        codigoAplicado={codigoAplicado}
                        codigoError={codigoError}
                        validandoCodigo={validandoCodigo}
                        onAplicarCodigo={onAplicarCodigo}
                        onRemoverCodigo={onRemoverCodigo}
                    />
                </div>

                {mostrarPrecio && (
                    <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total estimado:</span>
                            <span className="text-2xl font-bold text-accent">{formatCurrency(pricing.totalConDescuento)}</span>
                        </div>
                        {(pricing.descuentoBase + pricing.descuentoRoundTrip + pricing.descuentoCodigo) > 0 && (
                            <p className="text-xs text-green-400 text-right">
                                Ahorro: {formatCurrency(pricing.descuentoBase + pricing.descuentoRoundTrip + pricing.descuentoCodigo)}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Consentimiento y Pago */}
        <div className="border-t border-gray-800 pt-6 space-y-6">
            <div className="flex items-start gap-3">
                <Checkbox
                    id="payment-consent"
                    checked={paymentConsent}
                    onCheckedChange={(value) => setPaymentConsent(Boolean(value))}
                    className="border-gray-600 data-[state=checked]:bg-accent"
                />
                <label
                    htmlFor="payment-consent"
                    className="text-sm text-gray-400"
                >
                    Acepto recibir la confirmación por email y WhatsApp, y comprendo que podré especificar la hora exacta y detalles adicionales después de confirmar el pago.
                </label>
            </div>

            {mostrarPrecio && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <Button onClick={handleGuardarReserva} disabled={isSubmitting || !paymentConsent} variant="outline" className="text-gray-400 border-gray-600 hover:bg-gray-700">
                        Guardar y pagar después
                    </Button>
                    <Button onClick={() => handleProcesarPago('flow', 'abono')} disabled={isSubmitting || loadingGateway || !paymentConsent} className="bg-accent hover:bg-accent/90 text-black font-bold py-3 px-6 rounded-lg disabled:opacity-50">
                        {loadingGateway === 'flow-abono' ? <LoaderCircle className="animate-spin" /> : `Pagar abono ${formatCurrency(pricing.abono)}`}
                    </Button>
                    <Button onClick={() => handleProcesarPago('flow', 'total')} disabled={isSubmitting || loadingGateway || !paymentConsent} className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-6 rounded-lg disabled:opacity-50">
                        {loadingGateway === 'flow-total' ? <LoaderCircle className="animate-spin" /> : `Pagar total ${formatCurrency(pricing.totalConDescuento)}`}
                    </Button>
                </div>
            )}
        </div>

        {stepError && <div className="text-red-400 text-center pt-4">⚠️ {stepError}</div>}
    </CardContent>
</Card>
					</div>
				)}
			</div>
		</section>
	);
}

export default HeroExpress;
