import { useEffect, useMemo, useRef, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import {
	calcularCotizacion,
	obtenerDesgloseTarifa,
	calcularAbono,
	formatoMonedaCLP,
} from "@/lib/pricing";
import { CheckCircle2, CreditCard, Gift, Sparkles } from "lucide-react";

const steps = [
	{ id: 0, title: "Datos del viaje", description: "Itinerario y contacto" },
	{
		id: 1,
		title: "Extras y beneficios",
		description: "Personaliza tu traslado",
	},
	{ id: 2, title: "Resumen y pago", description: "Confirma y abona en línea" },
];

const extrasCatalog = [
	{
		id: "meet_greet",
		name: "Meet & greet en aeropuerto",
		description:
			"Recepción personalizada en sala de llegadas y asistencia con equipaje.",
		amount: 8000,
	},
	{
		id: "silla_bebe",
		name: "Silla para bebé o niño",
		description:
			"Instalamos silla certificada antes del viaje para menores de hasta 6 años.",
		amount: 6000,
	},
	{
		id: "mascota",
		name: "Traslado de mascota",
		description:
			"Espacio y protección adicional para transportar a tu mascota con seguridad.",
		amount: 5000,
	},
	{
		id: "equipaje_extra",
		name: "Equipaje adicional",
		description:
			"Incluye carga de equipaje voluminoso (skis, tablas o equipamiento deportivo).",
		amount: 7000,
	},
];

const availableCoupons = {
	ARAUCANIA10: {
		code: "ARAUCANIA10",
		type: "percentage",
		value: 0.1,
		description: "10% de descuento exclusivo al reservar online.",
	},
	BIENVENIDA5000: {
		code: "BIENVENIDA5000",
		type: "flat",
		value: 5000,
		description: "Descuento de bienvenida en tu primera reserva.",
	},
};

const clubBenefits = [
	{
		id: "beneficio15",
		label: "3er viaje - 15% de descuento",
		discountRate: 0.15,
		description: "Aplica si este es tu tercer traslado con nosotros.",
	},
	{
		id: "beneficio25",
		label: "5to viaje VIP - 25% de descuento",
		discountRate: 0.25,
		description: "Incluye bebida de cortesía y atención prioritaria.",
	},
];

const paymentMethods = [
	{
		id: "mercadopago",
		label: "Tarjeta en línea (Mercado Pago 3-D Secure)",
		description: "Procesamiento inmediato sin salir del sitio.",
	},
	{
		id: "flow",
		label: "Transferencia Flow (próximamente)",
		description: "Disponible muy pronto para pagos por transferencia.",
		disabled: true,
	},
];

const telefonoRegex = /^(\+?56)?(\s?9)\s?(\d{4})\s?(\d{4})$/;

const ReservaWizard = ({
	destinos,
	onReservationConfirmed,
	onlineDiscountRate = 0,
	taxRate = 0,
	defaultDepositRate = 0.4,
}) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [wizardStatus, setWizardStatus] = useState("in-progress");
	const [tripData, setTripData] = useState({
		origen: "Aeropuerto La Araucanía",
		destino: destinos[0]?.nombre || "",
		otroDestino: "",
		fecha: "",
		hora: "",
		pasajeros: 1,
		nombre: "",
		telefono: "",
		email: "",
		notas: "",
	});
	const [customBaseFare, setCustomBaseFare] = useState("");
	const [selectedVehicle, setSelectedVehicle] = useState("");
	const [selectedExtras, setSelectedExtras] = useState([]);
	const [couponInput, setCouponInput] = useState("");
	const [appliedCoupon, setAppliedCoupon] = useState(null);
	const [couponFeedback, setCouponFeedback] = useState(null);
	const [selectedClubBenefit, setSelectedClubBenefit] = useState(null);
	const [paymentMode, setPaymentMode] = useState("deposit");
	const [depositPercentage, setDepositPercentage] = useState(
		Math.min(Math.max(Math.round(defaultDepositRate * 100), 20), 100)
	);
	const [selectedPaymentMethod, setSelectedPaymentMethod] =
		useState("mercadopago");
	const [paymentState, setPaymentState] = useState({
		status: "idle",
		loading: false,
		error: null,
		receiptUrl: null,
	});

	const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || "";
	const apiUrl =
		import.meta.env.VITE_API_URL ||
		"https://transportes-araucaria.onrender.com";

	const mercadopagoInitializedRef = useRef(false);

	useEffect(() => {
		if (!publicKey || mercadopagoInitializedRef.current) return;
		try {
			initMercadoPago(publicKey, { locale: "es-CL" });
			mercadopagoInitializedRef.current = true;
		} catch (error) {
			console.error("No se pudo inicializar Mercado Pago:", error);
		}
	}, [publicKey]);

	const destinoSeleccionado = useMemo(
		() => destinos.find((d) => d.nombre === tripData.destino),
		[destinos, tripData.destino]
	);

	const cotizacion = useMemo(() => {
		if (!tripData.destino || tripData.destino === "Otro") {
			return { precio: null, vehiculo: null };
		}
		return calcularCotizacion(destinoSeleccionado, tripData.pasajeros);
	}, [destinoSeleccionado, tripData.destino, tripData.pasajeros]);

	useEffect(() => {
		if (cotizacion.vehiculo && !selectedVehicle) {
			setSelectedVehicle(cotizacion.vehiculo);
		}
	}, [cotizacion.vehiculo, selectedVehicle]);

	const maxPasajerosSeleccionados = destinoSeleccionado?.maxPasajeros || 7;

	useEffect(() => {
		if (Number(tripData.pasajeros) > maxPasajerosSeleccionados) {
			setTripData((prev) => ({
				...prev,
				pasajeros: maxPasajerosSeleccionados,
			}));
		}
	}, [maxPasajerosSeleccionados, tripData.pasajeros]);

	const baseFareValue = useMemo(() => {
		const custom = parseInt(customBaseFare, 10);
		if (!Number.isNaN(custom) && custom > 0) {
			return custom;
		}
		return cotizacion.precio || 0;
	}, [customBaseFare, cotizacion.precio]);

	const extrasTotal = useMemo(
		() =>
			selectedExtras.reduce(
				(accumulator, extra) =>
					accumulator + (extra.amount || extra.precio || 0),
				0
			),
		[selectedExtras]
	);

	const pricingBreakdown = useMemo(
		() =>
			obtenerDesgloseTarifa({
				baseFare: baseFareValue,
				extrasTotal,
				onlineDiscountRate,
				coupon: appliedCoupon,
				clubBenefit: selectedClubBenefit,
				taxRate,
			}),
		[
			appliedCoupon,
			baseFareValue,
			extrasTotal,
			onlineDiscountRate,
			selectedClubBenefit,
			taxRate,
		]
	);

	const normalizedDepositRate =
		paymentMode === "full"
			? 1
			: Math.min(Math.max(depositPercentage / 100, 0.2), 1);
	const abonoCalculado = useMemo(
		() => calcularAbono(pricingBreakdown.total, normalizedDepositRate),
		[pricingBreakdown.total, normalizedDepositRate]
	);
	const paymentAmount =
		paymentMode === "full" ? pricingBreakdown.total : abonoCalculado.amount;
	const saldoPendiente = paymentMode === "full" ? 0 : abonoCalculado.remainder;

	const cardInitialization = useMemo(
		() => ({
			amount: Number(paymentAmount) || 0,
			payer: {
				email: tripData.email || "",
			},
		}),
		[paymentAmount, tripData.email]
	);

	const isStepValid = useMemo(() => {
		if (currentStep === 0) {
			const destinoValido =
				(tripData.destino && tripData.destino !== "Otro") ||
				tripData.otroDestino.trim() !== "";
			const contactoValido =
				tripData.nombre.trim() !== "" &&
				telefonoRegex.test(tripData.telefono.trim()) &&
				tripData.email.trim() !== "" &&
				tripData.fecha !== "" &&
				tripData.hora !== "";
			return destinoValido && contactoValido && baseFareValue > 0;
		}
		if (currentStep === 1) {
			return true;
		}
		return pricingBreakdown.total > 0;
	}, [
		baseFareValue,
		currentStep,
		pricingBreakdown.total,
		tripData.destino,
		tripData.email,
		tripData.fecha,
		tripData.hora,
		tripData.nombre,
		tripData.otroDestino,
		tripData.telefono,
	]);

	const handleTripChange = (field, value) => {
		setTripData((prev) => ({ ...prev, [field]: value }));
	};

	const toggleExtra = (extra) => {
		setSelectedExtras((prev) => {
			const exists = prev.find((item) => item.id === extra.id);
			if (exists) {
				return prev.filter((item) => item.id !== extra.id);
			}
			return [
				...prev,
				{
					id: extra.id,
					name: extra.name,
					amount: extra.amount,
					description: extra.description,
				},
			];
		});
	};

	const applyCoupon = () => {
		const normalized = couponInput.trim().toUpperCase();
		if (!normalized) {
			setCouponFeedback({
				type: "error",
				message: "Ingresa un código de cupón válido.",
			});
			return;
		}
		const coupon = availableCoupons[normalized];
		if (!coupon) {
			setAppliedCoupon(null);
			setCouponFeedback({
				type: "error",
				message: "El cupón ingresado no es válido.",
			});
			return;
		}
		setAppliedCoupon({ ...coupon, code: normalized });
		setCouponFeedback({
			type: "success",
			message: `Cupón ${normalized} aplicado correctamente.`,
		});
	};

	const removeCoupon = () => {
		setAppliedCoupon(null);
		setCouponInput("");
		setCouponFeedback(null);
	};

	const handleClubBenefitChange = (value) => {
		if (!value) {
			setSelectedClubBenefit(null);
			return;
		}
		const benefit = clubBenefits.find((item) => item.id === value);
		setSelectedClubBenefit(benefit || null);
	};

	const goToNextStep = () => {
		if (currentStep < steps.length - 1 && isStepValid) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const goToPreviousStep = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	const resetWizard = () => {
		setCurrentStep(0);
		setWizardStatus("in-progress");
		setTripData({
			origen: "Aeropuerto La Araucanía",
			destino: destinos[0]?.nombre || "",
			otroDestino: "",
			fecha: "",
			hora: "",
			pasajeros: 1,
			nombre: "",
			telefono: "",
			email: "",
			notas: "",
		});
		setCustomBaseFare("");
		setSelectedVehicle("");
		setSelectedExtras([]);
		setAppliedCoupon(null);
		setCouponInput("");
		setCouponFeedback(null);
		setSelectedClubBenefit(null);
		setPaymentMode("deposit");
		setDepositPercentage(
			Math.min(Math.max(Math.round(defaultDepositRate * 100), 20), 100)
		);
		setSelectedPaymentMethod("mercadopago");
		setPaymentState({
			status: "idle",
			loading: false,
			error: null,
			receiptUrl: null,
		});
	};

	const buildReservationPayload = (paymentResult) => {
		const destinoFinal =
			tripData.destino === "Otro"
				? tripData.otroDestino || "Destino personalizado"
				: tripData.destino;

		return {
			...tripData,
			destino: destinoFinal,
			origen: tripData.origen,
			precio: baseFareValue,
			vehiculo: selectedVehicle || cotizacion.vehiculo,
			extras: selectedExtras,
			coupon: appliedCoupon,
			clubBenefit: selectedClubBenefit,
			pricing: pricingBreakdown,
			payment: {
				status: "succeeded",
				method: "mercadopago",
				methodLabel: "Mercado Pago (tarjeta)",
				mode: paymentMode,
				amount: paymentAmount,
				balance: saldoPendiente,
				depositRate: normalizedDepositRate,
				receiptUrl: paymentResult?.receiptUrl || null,
				transactionId: paymentResult?.id || null,
				statusDetail: paymentResult?.statusDetail || null,
			},
			source: "Reserva Wizard Digital",
		};
	};

	const handleMercadoPagoSubmit = async (formData) => {
		setPaymentState({
			status: "processing",
			loading: true,
			error: null,
			receiptUrl: null,
		});

		try {
			const response = await fetch(`${apiUrl}/process-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token: formData.token,
					amount: paymentAmount,
					description: `Reserva online - ${
						tripData.destino === "Otro"
							? tripData.otroDestino || "Destino personalizado"
							: tripData.destino
					}`,
					installments: formData.installments,
					paymentMethodId: formData.payment_method_id,
					issuerId: formData.issuer_id,
					email: formData.payer?.email || tripData.email,
					identification: formData.payer?.identification,
					metadata: {
						mode: paymentMode,
						extras: selectedExtras.map((extra) => extra.id),
						coupon: appliedCoupon?.code || null,
						clubBenefit: selectedClubBenefit?.id || null,
					},
				}),
			});

			const result = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(result?.message || "No se pudo procesar el pago.");
			}

			const reservationPayload = buildReservationPayload({
				id: result.id,
				receiptUrl:
					result.receiptUrl ||
					result.point_of_interaction?.transaction_data?.ticket_url ||
					result.transaction_details?.external_resource_url ||
					null,
				statusDetail: result.statusDetail || result.status_detail,
			});

			try {
				await onReservationConfirmed(reservationPayload);
			} catch (error) {
				console.error("Error al registrar la reserva:", error);
				setPaymentState({
					status: "succeeded",
					loading: false,
					error:
						"Pago recibido, pero no pudimos registrar la reserva automáticamente. Nuestro equipo te contactará.",
					receiptUrl: reservationPayload.payment.receiptUrl,
				});
				setWizardStatus("completed");
				return;
			}

			setPaymentState({
				status: "succeeded",
				loading: false,
				error: null,
				receiptUrl: reservationPayload.payment.receiptUrl,
			});
			setWizardStatus("completed");
		} catch (error) {
			console.error("Error procesando el pago:", error);
			setPaymentState({
				status: "failed",
				loading: false,
				error: error.message || "No se pudo procesar el pago.",
				receiptUrl: null,
			});
			throw error;
		}
	};
	const renderStepContent = () => {
		if (wizardStatus === "completed") {
			return (
				<div className="flex flex-col items-center text-center space-y-4 py-12">
					<CheckCircle2 className="h-16 w-16 text-emerald-500" />
					<div className="space-y-2">
						<h3 className="text-2xl font-semibold">
							¡Pago recibido con éxito!
						</h3>
						<p className="text-muted-foreground max-w-xl">
							Tu reserva ha quedado confirmada y recibirás un correo con todos
							los detalles y comprobantes. Si necesitas realizar cambios,
							nuestro equipo estará encantado de ayudarte.
						</p>
						{paymentState.error && (
							<p className="text-sm text-amber-600">{paymentState.error}</p>
						)}
					</div>
					<div className="flex flex-col md:flex-row gap-3 mt-4">
						{paymentState.receiptUrl && (
							<Button asChild>
								<a
									href={paymentState.receiptUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									Ver comprobante de pago
								</a>
							</Button>
						)}
						<Button variant="outline" onClick={resetWizard}>
							Crear una nueva reserva
						</Button>
					</div>
				</div>
			);
		}

		if (currentStep === 0) {
			return (
				<div className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="origen-wizard">Origen</Label>
							<Input
								id="origen-wizard"
								value={tripData.origen}
								onChange={(event) =>
									handleTripChange("origen", event.target.value)
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="destino-wizard">Destino</Label>
							<select
								id="destino-wizard"
								className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary text-foreground"
								value={tripData.destino}
								onChange={(event) =>
									handleTripChange("destino", event.target.value)
								}
							>
								{destinos.map((destino) => (
									<option key={destino.nombre} value={destino.nombre}>
										{destino.nombre}
									</option>
								))}
								<option value="Otro">Otro destino</option>
							</select>
						</div>
						{tripData.destino === "Otro" && (
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="otroDestino-wizard">Describe tu destino</Label>
								<Input
									id="otroDestino-wizard"
									placeholder="Ej: Hotel en Curarrehue"
									value={tripData.otroDestino}
									onChange={(event) =>
										handleTripChange("otroDestino", event.target.value)
									}
								/>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="pasajeros-wizard">Pasajeros</Label>
							<select
								id="pasajeros-wizard"
								className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary text-foreground"
								value={tripData.pasajeros}
								onChange={(event) =>
									handleTripChange("pasajeros", Number(event.target.value))
								}
							>
								{Array.from(
									{ length: maxPasajerosSeleccionados },
									(_, index) => index + 1
								).map((num) => (
									<option key={num} value={num}>
										{num} pasajero(s)
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="fecha-wizard">Fecha</Label>
							<Input
								id="fecha-wizard"
								type="date"
								value={tripData.fecha}
								min={new Date().toISOString().split("T")[0]}
								onChange={(event) =>
									handleTripChange("fecha", event.target.value)
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="hora-wizard">Hora</Label>
							<Input
								id="hora-wizard"
								type="time"
								value={tripData.hora}
								onChange={(event) =>
									handleTripChange("hora", event.target.value)
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="nombre-wizard">Nombre</Label>
							<Input
								id="nombre-wizard"
								value={tripData.nombre}
								onChange={(event) =>
									handleTripChange("nombre", event.target.value)
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="telefono-wizard">Teléfono (Chile)</Label>
							<Input
								id="telefono-wizard"
								value={tripData.telefono}
								placeholder="Ej: +56 9 1234 5678"
								onChange={(event) =>
									handleTripChange("telefono", event.target.value)
								}
							/>
							{tripData.telefono &&
								!telefonoRegex.test(tripData.telefono.trim()) && (
									<p className="text-xs text-red-500">
										Ingresa un número chileno válido.
									</p>
								)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email-wizard">Correo electrónico</Label>
							<Input
								id="email-wizard"
								type="email"
								value={tripData.email}
								onChange={(event) =>
									handleTripChange("email", event.target.value)
								}
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="notas-wizard">Observaciones</Label>
							<Textarea
								id="notas-wizard"
								rows={3}
								placeholder="Ej: Solicito parada intermedia o detalles de vuelo."
								value={tripData.notas}
								onChange={(event) =>
									handleTripChange("notas", event.target.value)
								}
							/>
						</div>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-muted/40 rounded-lg p-4">
						<div className="space-y-2">
							<h4 className="font-semibold text-foreground">Tarifa estimada</h4>
							{cotizacion.precio ? (
								<p className="text-muted-foreground text-sm">
									Tarifa calculada automáticamente según destino y número de
									pasajeros.
								</p>
							) : (
								<p className="text-muted-foreground text-sm">
									Ingresa una tarifa base referencial para continuar con el
									proceso.
								</p>
							)}
							<div className="text-2xl font-bold text-primary">
								{formatoMonedaCLP(baseFareValue)}
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="tarifa-manual">
								Tarifa base manual (opcional)
							</Label>
							<Input
								id="tarifa-manual"
								type="number"
								min="0"
								step="1000"
								value={customBaseFare}
								onChange={(event) => setCustomBaseFare(event.target.value)}
							/>
							<Label htmlFor="vehiculo-wizard">Tipo de vehículo</Label>
							<Input
								id="vehiculo-wizard"
								value={selectedVehicle || cotizacion.vehiculo || ""}
								placeholder="Ej: Auto privado, Van 7 pax"
								onChange={(event) => setSelectedVehicle(event.target.value)}
							/>
						</div>
					</div>
				</div>
			);
		}
		if (currentStep === 1) {
			return (
				<div className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{extrasCatalog.map((extra) => {
							const checked = selectedExtras.some(
								(item) => item.id === extra.id
							);
							return (
								<div
									key={extra.id}
									className="flex items-start gap-3 p-4 border rounded-lg bg-white shadow-sm"
								>
									<Checkbox
										id={`extra-${extra.id}`}
										checked={checked}
										onCheckedChange={() => toggleExtra(extra)}
									/>
									<div>
										<Label
											htmlFor={`extra-${extra.id}`}
											className="font-semibold text-foreground"
										>
											{extra.name}
										</Label>
										<p className="text-sm text-muted-foreground">
											{extra.description}
										</p>
										<p className="text-sm font-semibold text-primary mt-1">
											{formatoMonedaCLP(extra.amount)}
										</p>
									</div>
								</div>
							);
						})}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="cupon-wizard">Código de cupón</Label>
							<div className="flex flex-col sm:flex-row gap-2">
								<Input
									id="cupon-wizard"
									value={couponInput}
									onChange={(event) => setCouponInput(event.target.value)}
									placeholder="Ej: ARAUCANIA10"
								/>
								<Button variant="outline" onClick={applyCoupon}>
									Aplicar
								</Button>
								{appliedCoupon && (
									<Button variant="ghost" onClick={removeCoupon}>
										Quitar
									</Button>
								)}
							</div>
							{couponFeedback && (
								<p
									className={`text-sm ${
										couponFeedback.type === "error"
											? "text-red-600"
											: "text-emerald-600"
									}`}
								>
									{couponFeedback.message}
								</p>
							)}
							{appliedCoupon && (
								<p className="text-xs text-muted-foreground">
									{appliedCoupon.description}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="beneficio-wizard">Beneficio Club Araucanía</Label>
							<select
								id="beneficio-wizard"
								className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary text-foreground"
								value={selectedClubBenefit?.id || ""}
								onChange={(event) =>
									handleClubBenefitChange(event.target.value)
								}
							>
								<option value="">No aplicar beneficio</option>
								{clubBenefits.map((benefit) => (
									<option key={benefit.id} value={benefit.id}>
										{benefit.label}
									</option>
								))}
							</select>
							{selectedClubBenefit && (
								<p className="text-xs text-muted-foreground flex items-center gap-2">
									<Gift className="h-4 w-4" />
									{selectedClubBenefit.description}
								</p>
							)}
						</div>
					</div>
				</div>
			);
		}
		if (currentStep === 2) {
			return (
				<div className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<div className="space-y-3 p-4 border rounded-lg bg-white shadow-sm">
							<h4 className="font-semibold text-foreground flex items-center gap-2">
								<Sparkles className="h-5 w-5 text-primary" /> Resumen de tarifas
							</h4>
							<div className="flex justify-between text-sm">
								<span>Tarifa base</span>
								<span>{formatoMonedaCLP(pricingBreakdown.baseFare)}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Extras</span>
								<span>{formatoMonedaCLP(pricingBreakdown.extrasTotal)}</span>
							</div>
							<div className="flex justify-between text-sm text-emerald-700">
								<span>Descuentos</span>
								<span>
									-{formatoMonedaCLP(pricingBreakdown.totalDiscounts)}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Impuestos</span>
								<span>{formatoMonedaCLP(pricingBreakdown.taxes)}</span>
							</div>
							<div className="flex justify-between font-semibold text-primary text-lg">
								<span>Total a pagar</span>
								<span>{formatoMonedaCLP(pricingBreakdown.total)}</span>
							</div>
							{selectedExtras.length > 0 && (
								<div className="pt-3 border-t text-sm space-y-1">
									<p className="font-semibold text-foreground">
										Extras incluidos
									</p>
									<ul className="list-disc pl-4 text-muted-foreground space-y-1">
										{selectedExtras.map((extra) => (
											<li key={extra.id}>
												{extra.name} ({formatoMonedaCLP(extra.amount)})
											</li>
										))}
									</ul>
								</div>
							)}
							{(pricingBreakdown.onlineDiscountValue > 0 ||
								pricingBreakdown.couponValue > 0 ||
								pricingBreakdown.clubBenefitValue > 0) && (
								<div className="pt-3 border-t text-sm space-y-1">
									<p className="font-semibold text-foreground">
										Beneficios aplicados
									</p>
									<ul className="list-disc pl-4 text-emerald-700 space-y-1">
										{pricingBreakdown.onlineDiscountValue > 0 && (
											<li>
												Descuento online{" "}
												{Math.round(
													(pricingBreakdown.onlineDiscountRate || 0) * 100
												)}
												%: -
												{formatoMonedaCLP(pricingBreakdown.onlineDiscountValue)}
											</li>
										)}
										{pricingBreakdown.couponValue > 0 && (
											<li>
												Cupón {appliedCoupon?.code}: -
												{formatoMonedaCLP(pricingBreakdown.couponValue)}
											</li>
										)}
										{pricingBreakdown.clubBenefitValue > 0 && (
											<li>
												Club Araucanía - {selectedClubBenefit?.label}: -
												{formatoMonedaCLP(pricingBreakdown.clubBenefitValue)}
											</li>
										)}
									</ul>
								</div>
							)}
						</div>
						<div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
							<h4 className="font-semibold text-foreground flex items-center gap-2">
								<CreditCard className="h-5 w-5 text-primary" /> Opciones de pago
							</h4>
							<RadioGroup
								value={paymentMode}
								onValueChange={setPaymentMode}
								className="space-y-3"
							>
								<div
									className={`border rounded-md p-3 ${
										paymentMode === "deposit"
											? "border-primary"
											: "border-muted"
									}`}
								>
									<div className="flex items-start gap-2">
										<RadioGroupItem value="deposit" id="payment-deposit" />
										<Label htmlFor="payment-deposit" className="flex-1">
											<span className="font-semibold block">Abonar ahora</span>
											<span className="text-sm text-muted-foreground">
												Reserva tu traslado abonando un porcentaje y paga el
												saldo al conductor.
											</span>
										</Label>
									</div>
									{paymentMode === "deposit" && (
										<div className="mt-3 space-y-2">
											<Label htmlFor="deposit-slider" className="text-sm">
												Porcentaje de abono en línea
											</Label>
											<Slider
												id="deposit-slider"
												min={20}
												max={100}
												step={5}
												value={[depositPercentage]}
												onValueChange={(value) =>
													setDepositPercentage(
														Math.min(Math.max(value[0], 20), 100)
													)
												}
												disabled={paymentState.loading}
											/>
											<div className="flex justify-between text-xs text-muted-foreground">
												<span>{depositPercentage}%</span>
												<span>100%</span>
											</div>
											<div className="text-sm space-y-1">
												<p>Abonas hoy: {formatoMonedaCLP(paymentAmount)}</p>
												<p>
													Saldo pendiente: {formatoMonedaCLP(saldoPendiente)}
												</p>
											</div>
										</div>
									)}
								</div>
								<div
									className={`border rounded-md p-3 ${
										paymentMode === "full" ? "border-primary" : "border-muted"
									}`}
								>
									<div className="flex items-start gap-2">
										<RadioGroupItem value="full" id="payment-full" />
										<Label htmlFor="payment-full" className="flex-1">
											<span className="font-semibold block">
												Pagar el total ahora
											</span>
											<span className="text-sm text-muted-foreground">
												Cancela el 100% y recibe la confirmación inmediata sin
												saldos pendientes.
											</span>
										</Label>
									</div>
								</div>
							</RadioGroup>
						</div>
					</div>
					<div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
						<h4 className="font-semibold text-foreground flex items-center gap-2">
							<CreditCard className="h-5 w-5 text-primary" /> Método de pago
						</h4>
						<RadioGroup
							value={selectedPaymentMethod}
							onValueChange={setSelectedPaymentMethod}
							className="space-y-3"
						>
							{paymentMethods.map((method) => (
								<div
									key={method.id}
									className={`border rounded-md p-3 ${
										selectedPaymentMethod === method.id
											? "border-primary"
											: "border-muted"
									} ${method.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
								>
									<div className="flex items-start gap-2">
										<RadioGroupItem
											value={method.id}
											id={`method-${method.id}`}
											disabled={method.disabled}
										/>
										<Label htmlFor={`method-${method.id}`} className="flex-1">
											<span className="font-semibold block">
												{method.label}
											</span>
											<span className="text-sm text-muted-foreground">
												{method.description}
											</span>
										</Label>
									</div>
								</div>
							))}
						</RadioGroup>
						{selectedPaymentMethod === "mercadopago" ? (
							publicKey ? (
								<div className="space-y-3">
									<CardPayment
										initialization={cardInitialization}
										onSubmit={handleMercadoPagoSubmit}
										locale="es-CL"
									/>
									{paymentState.loading && (
										<p className="text-sm text-muted-foreground">
											Procesando pago seguro...
										</p>
									)}
									{paymentState.status === "failed" && (
										<p className="text-sm text-red-600">{paymentState.error}</p>
									)}
									<p className="text-xs text-muted-foreground">
										Operamos con tokenización y autenticación 3-D Secure de
										Mercado Pago para resguardar tus datos.
									</p>
								</div>
							) : (
								<p className="text-sm text-amber-600">
									Configura la clave pública de Mercado Pago
									(VITE_MP_PUBLIC_KEY) para habilitar el pago en línea.
								</p>
							)
						) : (
							<p className="text-sm text-muted-foreground">
								Este método estará disponible próximamente.
							</p>
						)}
					</div>
				</div>
			);
		}

		return null;
	};
	return (
		<section id="reserva-digital" className="py-20 bg-slate-50">
			<div className="container mx-auto px-4">
				<Card className="shadow-xl border border-muted/40">
					<CardHeader className="space-y-4">
						<CardTitle className="text-3xl font-semibold text-foreground flex items-center gap-3">
							<Sparkles className="h-7 w-7 text-primary" /> Reserva digital
							asistida
						</CardTitle>
						<CardDescription className="text-muted-foreground">
							Diseñamos un asistente paso a paso para que puedas reservar, sumar
							extras y abonar en línea sin salir del sitio.
						</CardDescription>
						<div className="flex flex-wrap gap-3">
							{steps.map((step, index) => (
								<div
									key={step.id}
									className={`flex items-center gap-3 px-3 py-2 rounded-full border ${
										currentStep === index
											? "bg-primary/10 border-primary"
											: "bg-muted border-muted"
									}`}
								>
									<Badge
										variant={currentStep === index ? "default" : "secondary"}
										className="rounded-full"
									>
										{index + 1}
									</Badge>
									<div className="text-left">
										<p className="text-sm font-semibold text-foreground">
											{step.title}
										</p>
										<p className="text-xs text-muted-foreground">
											{step.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						{renderStepContent()}
						{wizardStatus !== "completed" && (
							<div className="flex flex-col md:flex-row items-center justify-between gap-3">
								<Button
									variant="outline"
									onClick={goToPreviousStep}
									disabled={currentStep === 0 || paymentState.loading}
								>
									Anterior
								</Button>
								{currentStep < steps.length - 1 ? (
									<Button onClick={goToNextStep} disabled={!isStepValid}>
										Continuar
									</Button>
								) : (
									<p className="text-xs text-muted-foreground text-center md:text-right">
										El pago se procesa con tokenización y 3-D Secure de Mercado
										Pago para tu tranquilidad.
									</p>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</section>
	);
};

export default ReservaWizard;
