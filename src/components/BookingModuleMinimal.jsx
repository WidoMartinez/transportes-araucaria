import React, { useEffect, useMemo, useState } from "react";
import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import {
        Collapsible,
        CollapsibleContent,
        CollapsibleTrigger,
} from "./ui/collapsible";
import { LoaderCircle, ChevronDown, CreditCard, CheckCircle2 } from "lucide-react";
import CodigoDescuento from "./CodigoDescuento";
import flow from "../assets/formasPago/flow.png";
import merPago from "../assets/formasPago/mp.png";

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

function BookingModuleMinimal({
        formData,
        origenes,
        destinos,
        maxPasajeros,
        minDateTime,
        phoneError,
        setPhoneError,
        isSubmitting,
        cotizacion,
        pricing,
        discountInfo,
        reviewChecklist,
        setReviewChecklist,
        canPay,
        handlers,
        payments,
        setFormData,
        codigo,
}) {
        const {
                onInputChange,
                onSubmit,
                validarTelefono,
                validarHorarioReserva,
        } = handlers;
        const { handlePayment, loadingGateway } = payments;
        const {
                aplicado: codigoAplicado,
                error: codigoError,
                validando: validandoCodigo,
                onAplicar: onAplicarCodigo,
                onRemover: onRemoverCodigo,
        } = codigo;

        const [formError, setFormError] = useState("");
        const [statusMessage, setStatusMessage] = useState("");
        const [hasPreparedPayment, setHasPreparedPayment] = useState(false);
        const [preparingPayment, setPreparingPayment] = useState(false);
        const [selectedCharge, setSelectedCharge] = useState(null);
        const [selectedMethod, setSelectedMethod] = useState(null);
        const [extrasOpen, setExtrasOpen] = useState(false);
        const [messageOpen, setMessageOpen] = useState(false);

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

        const tieneCotizacionAutomatica = typeof cotizacion?.precio === "number";
        const requiereCotizacionManual =
                formData.destino === "Otro" ||
                (formData.destino && !tieneCotizacionAutomatica);
        const mostrarPrecio = !requiereCotizacionManual && tieneCotizacionAutomatica;

        const totalDiscount = Math.max((pricing?.precioBase || 0) - (pricing?.totalConDescuento || 0), 0);
        const totalDiscountPercentage = pricing?.precioBase
                ? Math.round((totalDiscount / pricing.precioBase) * 100)
                : Math.round((discountInfo?.total || 0) * 100);

        const baseDiscountPercentage = Math.round((discountInfo?.base || 0) * 100);
        const promotionDiscountPercentage = Math.round((discountInfo?.promotion || 0) * 100);
        const roundTripDiscountPercentage = Math.round((discountInfo?.roundTrip || 0) * 100);
        const personalizedDiscountPercentage = Math.round((discountInfo?.personalized || 0) * 100);

        const chargeOptions = useMemo(
                () => [
                        {
                                id: "abono",
                                type: "abono",
                                title: "Abonar 40%",
                                subtitle: "Reserva tu traslado pagando una fracción",
                                amount: pricing?.abono || 0,
                                disabled:
                                        !mostrarPrecio ||
                                        !pricing?.abono ||
                                        pricing.abono <= 0,
                        },
                        {
                                id: "total",
                                type: "total",
                                title: "Pagar total",
                                subtitle: "Aprovecha todo el descuento online",
                                amount: pricing?.totalConDescuento || 0,
                                disabled:
                                        !mostrarPrecio ||
                                        !pricing?.totalConDescuento ||
                                        pricing.totalConDescuento <= 0,
                        },
                ],
                [mostrarPrecio, pricing?.abono, pricing?.totalConDescuento]
        );

        const paymentMethods = useMemo(
                () => [
                        {
                                id: "flow",
                                gateway: "flow",
                                title: "Flow",
                                subtitle: "Webpay y transferencia",
                                image: flow,
                        },
                        {
                                id: "mercadopago",
                                gateway: "mercadopago",
                                title: "Mercado Pago",
                                subtitle: "Tarjetas y billetera digital",
                                image: merPago,
                        },
                ],
                []
        );

        const selectedChargeData = useMemo(
                () => chargeOptions.find((option) => option.id === selectedCharge) || null,
                [chargeOptions, selectedCharge]
        );

        const selectedMethodData = useMemo(
                () => paymentMethods.find((method) => method.id === selectedMethod) || null,
                [paymentMethods, selectedMethod]
        );

        const selectedCombinationLoading = selectedChargeData && selectedMethodData
                ? loadingGateway === `${selectedMethodData.gateway}-${selectedChargeData.type}`
                : false;
        const isAnotherGatewayLoading = Boolean(loadingGateway && !selectedCombinationLoading);

        useEffect(() => {
                const defaultCharge = chargeOptions.find((option) => !option.disabled);
                setSelectedCharge((prev) =>
                        prev && chargeOptions.some((option) => option.id === prev && !option.disabled)
                                ? prev
                                : defaultCharge?.id || null
                );
        }, [chargeOptions]);

        useEffect(() => {
                const defaultMethod = paymentMethods[0];
                setSelectedMethod((prev) =>
                        prev && paymentMethods.some((method) => method.id === prev)
                                ? prev
                                : defaultMethod?.id || null
                );
        }, [paymentMethods]);

        useEffect(() => {
                setHasPreparedPayment(false);
        }, [
                formData.origen,
                formData.destino,
                formData.fecha,
                formData.hora,
                formData.pasajeros,
                formData.nombre,
                formData.email,
                formData.telefono,
                formData.idaVuelta,
                formData.fechaRegreso,
                formData.horaRegreso,
        ]);

        const handleTimeChange = (field, value) => {
                setFormData((prev) => ({
                        ...prev,
                        [field]: value,
                }));
        };

        const handleRoundTripToggle = (value) => {
                const isRoundTrip = Boolean(value);
                setFormData((prev) => {
                        if (isRoundTrip) {
                                return {
                                        ...prev,
                                        idaVuelta: true,
                                        fechaRegreso: prev.fechaRegreso || prev.fecha,
                                        horaRegreso: prev.horaRegreso,
                                };
                        }
                        return {
                                ...prev,
                                idaVuelta: false,
                                fechaRegreso: "",
                                horaRegreso: "",
                        };
                });
        };

        const validateBeforePayment = () => {
                if (!formData.origen?.trim()) {
                        return "Indica el origen de tu viaje.";
                }
                if (!formData.destino) {
                        return "Selecciona el destino del traslado.";
                }
                if (formData.destino === "Otro" && !formData.otroDestino.trim()) {
                        return "Describe el destino para cotizar tu viaje.";
                }
                if (!formData.fecha) {
                        return "Selecciona la fecha del traslado.";
                }
                if (!formData.hora) {
                        return "Selecciona la hora de recogida.";
                }
                const validacionHorario = validarHorarioReserva();
                if (!validacionHorario.esValido) {
                        return validacionHorario.mensaje || "Revisa la fecha y hora seleccionadas.";
                }
                if (formData.idaVuelta) {
                        if (!formData.fechaRegreso) {
                                return "Selecciona la fecha de regreso.";
                        }
                        if (!formData.horaRegreso) {
                                return "Selecciona la hora del regreso.";
                        }
                        const salida = new Date(`${formData.fecha}T${formData.hora}`);
                        const regreso = new Date(`${formData.fechaRegreso}T${formData.horaRegreso}`);
                        if (Number.isNaN(regreso.getTime()) || regreso <= salida) {
                                return "El regreso debe ser posterior al viaje de ida.";
                        }
                }
                if (!formData.nombre?.trim()) {
                        return "Ingresa el nombre del pasajero principal.";
                }
                if (!formData.email?.trim()) {
                        return "Necesitamos un correo para enviarte la confirmación.";
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                        return "El correo electrónico ingresado no es válido.";
                }
                if (!formData.telefono?.trim()) {
                        return "Indica un número de contacto.";
                }
                if (!validarTelefono(formData.telefono)) {
                        setPhoneError(
                                "Por favor, introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
                        );
                        return "Revisa el número de teléfono antes de continuar.";
                }
                setPhoneError("");
                return "";
        };

        const handleConfirmAndPay = async () => {
                if (isSubmitting || preparingPayment) return;

                const validationError = validateBeforePayment();
                if (validationError) {
                        setFormError(validationError);
                        setStatusMessage("");
                        return;
                }

                setFormError("");

                if (!hasPreparedPayment) {
                        setPreparingPayment(true);
                        const result = await onSubmit();
                        setPreparingPayment(false);
                        if (!result?.success) {
                                if (result?.error === "horario" && result?.message) {
                                        setFormError(result.message);
                                } else if (result?.message) {
                                        setFormError(result.message);
                                } else {
                                        setFormError("No pudimos preparar tu reserva. Intenta nuevamente.");
                                }
                                return;
                        }
                        setHasPreparedPayment(true);
                        setStatusMessage("Resumen listo. Revisa y confirma tu pago.");
                        return;
                }

                if (isAnotherGatewayLoading) {
                        setStatusMessage("Estamos procesando un pago en otra ventana. Espera unos segundos.");
                        return;
                }

                if (selectedCombinationLoading) {
                        setStatusMessage("Tu pago se está iniciando. Espera un momento...");
                        return;
                }

                if (!canPay) {
                        setStatusMessage(
                                "Confirma que revisaste tu viaje y tus datos para habilitar el pago."
                        );
                        return;
                }

                if (!selectedChargeData || selectedChargeData.disabled || !selectedMethodData) {
                        setStatusMessage("Selecciona una combinación de pago disponible.");
                        return;
                }

                await handlePayment(selectedMethodData.gateway, selectedChargeData.type);
        };

        const infoRow = (label, value) => (
                <div className="flex items-start justify-between text-sm text-slate-600">
                        <span className="font-medium text-slate-500">{label}</span>
                        <span className="text-slate-700 text-right">{value}</span>
                </div>
        );

        return (
                <div className="relative">
                        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm">
                                <CardHeader className="pb-2">
                                        <CardTitle className="text-2xl font-semibold text-slate-900">
                                                Reserva tu traslado
                                        </CardTitle>
                                        <CardDescription className="text-sm text-slate-500">
                                                Completa los datos esenciales y confirma tu pago online con descuentos
                                                garantizados.
                                        </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                        <div className="flex flex-col gap-8 lg:flex-row">
                                                <div className="flex-1 space-y-8">
                                                        <section className="space-y-4">
                                                                <h3 className="text-lg font-semibold text-slate-800">
                                                                        Detalles del viaje
                                                                </h3>
                                                                <div className="grid gap-4 md:grid-cols-2">
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="origen">Origen</Label>
                                                                                <select
                                                                                        id="origen"
                                                                                        name="origen"
                                                                                        value={formData.origen}
                                                                                        onChange={onInputChange}
                                                                                        className="flex h-11 w-full items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                                                >
                                                                                        {origenes.map((origen) => (
                                                                                                <option key={origen} value={origen}>
                                                                                                        {origen}
                                                                                                </option>
                                                                                        ))}
                                                                                </select>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="destino">Destino</Label>
                                                                                <select
                                                                                        id="destino"
                                                                                        name="destino"
                                                                                        value={formData.destino}
                                                                                        onChange={onInputChange}
                                                                                        className="flex h-11 w-full items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                                                >
                                                                                        <option value="">Selecciona destino</option>
                                                                                        {destinos.map((destino) => (
                                                                                                <option key={destino} value={destino}>
                                                                                                        {destino}
                                                                                                </option>
                                                                                        ))}
                                                                                </select>
                                                                        </div>
                                                                </div>
                                                                {formData.destino === "Otro" && (
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="otro-destino">Describe tu destino</Label>
                                                                                <Input
                                                                                        id="otro-destino"
                                                                                        name="otroDestino"
                                                                                        value={formData.otroDestino}
                                                                                        onChange={onInputChange}
                                                                                        placeholder="Ej: Hotel en Pucón, cabañas en Lican Ray, etc."
                                                                                />
                                                                        </div>
                                                                )}
                                                                <div className="grid gap-4 md:grid-cols-3">
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="fecha">Fecha</Label>
                                                                                <Input
                                                                                        id="fecha"
                                                                                        type="date"
                                                                                        name="fecha"
                                                                                        value={formData.fecha}
                                                                                        onChange={onInputChange}
                                                                                        min={minDateTime}
                                                                                />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                                <Label>Hora</Label>
                                                                                <Select
                                                                                        value={formData.hora}
                                                                                        onValueChange={(value) => handleTimeChange("hora", value)}
                                                                                >
                                                                                        <SelectTrigger>
                                                                                                <SelectValue placeholder="Selecciona la hora" />
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
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="pasajeros">Pasajeros</Label>
                                                                                <select
                                                                                        id="pasajeros"
                                                                                        name="pasajeros"
                                                                                        value={formData.pasajeros}
                                                                                        onChange={onInputChange}
                                                                                        className="flex h-11 w-full items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                                                >
                                                                                        {Array.from({ length: maxPasajeros }, (_, i) => i + 1).map((value) => (
                                                                                                <option key={value} value={value}>
                                                                                                        {value}
                                                                                                </option>
                                                                                        ))}
                                                                                </select>
                                                                        </div>
                                                                </div>
                                                                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                                                                        <div className="flex items-start gap-3">
                                                                                <Checkbox
                                                                                        id="ida-vuelta"
                                                                                        checked={formData.idaVuelta}
                                                                                        onCheckedChange={handleRoundTripToggle}
                                                                                />
                                                                                <div>
                                                                                        <Label htmlFor="ida-vuelta" className="text-sm font-medium text-slate-700">
                                                                                                ¿Deseas ida y vuelta?
                                                                                        </Label>
                                                                                        <p className="text-xs text-slate-500">
                                                                                                Coordina ambas rutas en una sola solicitud y obtén un descuento adicional.
                                                                                        </p>
                                                                                </div>
                                                                        </div>
                                                                        {formData.idaVuelta && (
                                                                                <div className="grid gap-4 md:grid-cols-2">
                                                                                        <div className="space-y-2">
                                                                                                <Label htmlFor="fecha-regreso">Fecha regreso</Label>
                                                                                                <Input
                                                                                                        id="fecha-regreso"
                                                                                                        type="date"
                                                                                                        name="fechaRegreso"
                                                                                                        min={formData.fecha || minDateTime}
                                                                                                        value={formData.fechaRegreso}
                                                                                                        onChange={onInputChange}
                                                                                                />
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                                <Label>Hora regreso</Label>
                                                                                                <Select
                                                                                                        value={formData.horaRegreso}
                                                                                                        onValueChange={(value) => handleTimeChange("horaRegreso", value)}
                                                                                                >
                                                                                                        <SelectTrigger>
                                                                                                                <SelectValue placeholder="Selecciona hora de regreso" />
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
                                                                                </div>
                                                                        )}
                                                                </div>
                                                        </section>

                                                        <section className="space-y-4">
                                                                <h3 className="text-lg font-semibold text-slate-800">
                                                                        Datos de contacto
                                                                </h3>
                                                                <div className="grid gap-4 md:grid-cols-2">
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="nombre">Nombre</Label>
                                                                                <Input
                                                                                        id="nombre"
                                                                                        name="nombre"
                                                                                        value={formData.nombre}
                                                                                        onChange={onInputChange}
                                                                                        placeholder="Nombre y apellido"
                                                                                />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="email">Correo electrónico</Label>
                                                                                <Input
                                                                                        id="email"
                                                                                        type="email"
                                                                                        name="email"
                                                                                        value={formData.email}
                                                                                        onChange={onInputChange}
                                                                                        placeholder="tu@correo.cl"
                                                                                />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="telefono">Teléfono</Label>
                                                                                <Input
                                                                                        id="telefono"
                                                                                        name="telefono"
                                                                                        value={formData.telefono}
                                                                                        onChange={onInputChange}
                                                                                        placeholder="+56 9 XXXX XXXX"
                                                                                />
                                                                                {phoneError && (
                                                                                        <p className="text-xs text-red-600">{phoneError}</p>
                                                                                )}
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="numeroVuelo">Número de vuelo (opcional)</Label>
                                                                                <Input
                                                                                        id="numeroVuelo"
                                                                                        name="numeroVuelo"
                                                                                        value={formData.numeroVuelo}
                                                                                        onChange={onInputChange}
                                                                                        placeholder="Ej: LA123"
                                                                                />
                                                                        </div>
                                                                </div>
                                                        </section>

                                                        <Collapsible open={extrasOpen} onOpenChange={setExtrasOpen}>
                                                                <CollapsibleTrigger asChild>
                                                                        <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-700"
                                                                        >
                                                                                Opciones adicionales
                                                                                <ChevronDown
                                                                                        className={`h-4 w-4 transition-transform ${extrasOpen ? "rotate-180" : "rotate-0"}`}
                                                                                />
                                                                        </Button>
                                                                </CollapsibleTrigger>
                                                                <CollapsibleContent className="mt-4 space-y-4">
                                                                        <div className="grid gap-4 md:grid-cols-2">
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="hotel">Hotel o dirección</Label>
                                                                                        <Input
                                                                                                id="hotel"
                                                                                                name="hotel"
                                                                                                value={formData.hotel}
                                                                                                onChange={onInputChange}
                                                                                                placeholder="Lugar exacto de recogida o destino"
                                                                                        />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="sillaInfantil">Silla infantil</Label>
                                                                                        <select
                                                                                                id="sillaInfantil"
                                                                                                name="sillaInfantil"
                                                                                                value={formData.sillaInfantil}
                                                                                                onChange={onInputChange}
                                                                                                className="flex h-11 w-full items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                                                        >
                                                                                                <option value="no">No necesito</option>
                                                                                                <option value="si">Sí, incluir silla</option>
                                                                                        </select>
                                                                                </div>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="equipajeEspecial">Equipaje especial</Label>
                                                                                <Input
                                                                                        id="equipajeEspecial"
                                                                                        name="equipajeEspecial"
                                                                                        value={formData.equipajeEspecial}
                                                                                        onChange={onInputChange}
                                                                                        placeholder="Tablas, equipos deportivos u otro equipaje voluminoso"
                                                                                />
                                                                        </div>
                                                                </CollapsibleContent>
                                                        </Collapsible>

                                                        <Collapsible open={messageOpen} onOpenChange={setMessageOpen}>
                                                                <CollapsibleTrigger asChild>
                                                                        <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-700"
                                                                        >
                                                                                Comentarios al equipo
                                                                                <ChevronDown
                                                                                        className={`h-4 w-4 transition-transform ${messageOpen ? "rotate-180" : "rotate-0"}`}
                                                                                />
                                                                        </Button>
                                                                </CollapsibleTrigger>
                                                                <CollapsibleContent className="mt-4">
                                                                        <Textarea
                                                                                name="mensaje"
                                                                                value={formData.mensaje}
                                                                                onChange={onInputChange}
                                                                                placeholder="Indícanos detalles importantes, horarios de vuelo o instrucciones especiales."
                                                                                className="min-h-[120px]"
                                                                        />
                                                                </CollapsibleContent>
                                                        </Collapsible>
                                                </div>

                                                <aside className="lg:w-[360px] xl:w-[400px] space-y-4">
                                                        <Card className="border-slate-200 bg-slate-50/80">
                                                                <CardHeader className="pb-3">
                                                                        <CardTitle className="text-lg font-semibold text-slate-800">
                                                                                Resumen del traslado
                                                                        </CardTitle>
                                                                        <CardDescription className="text-xs text-slate-500">
                                                                                {mostrarPrecio
                                                                                        ? "Valores estimados en base a tu selección."
                                                                                        : "Necesitamos confirmar el valor de este destino. Te contactaremos con la cotización."}
                                                                        </CardDescription>
                                                                </CardHeader>
                                                                <CardContent className="space-y-3">
                                                                        <div className="space-y-2">
                                                                                {infoRow("Origen", formData.origen || "Por confirmar")}
                                                                                {infoRow(
                                                                                        "Destino",
                                                                                        formData.destino === "Otro"
                                                                                                ? formData.otroDestino || "Por confirmar"
                                                                                                : formData.destino || "Por confirmar"
                                                                                )}
                                                                                {infoRow(
                                                                                        "Fecha",
                                                                                        formData.fecha
                                                                                                ? new Date(`${formData.fecha}T00:00:00`).toLocaleDateString(
                                                                                                        "es-CL",
                                                                                                        { dateStyle: "long" }
                                                                                                )
                                                                                                : "Por confirmar"
                                                                                )}
                                                                                {infoRow(
                                                                                        "Hora",
                                                                                        formData.hora ? `${formData.hora} hrs` : "Por confirmar"
                                                                                )}
                                                                                {infoRow(
                                                                                        "Pasajeros",
                                                                                        `${formData.pasajeros || "1"} pasajero(s)`
                                                                                )}
                                                                                {formData.idaVuelta &&
                                                                                        infoRow(
                                                                                                "Incluye regreso",
                                                                                                formData.fechaRegreso
                                                                                                        ? `${new Date(
                                                                                                                  `${formData.fechaRegreso}T00:00:00`
                                                                                                          ).toLocaleDateString("es-CL", { dateStyle: "medium" })} · ${formData.horaRegreso} hrs`
                                                                                                        : "Pendiente"
                                                                                        )}
                                                                        </div>
                                                                        <Separator />
                                                                        <div className="space-y-2 text-sm text-slate-600">
                                                                                {mostrarPrecio ? (
                                                                                        <>
                                                                                                <div className="flex items-center justify-between">
                                                                                                        <span className="text-slate-500">Precio base</span>
                                                                                                        <span className="font-semibold text-slate-700">
                                                                                                                {formatCurrency(pricing?.precioBase)}
                                                                                                        </span>
                                                                                                </div>
                                                                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                                                                        <span>Descuentos aplicados</span>
                                                                                                        <span>
                                                                                                                -{formatCurrency(totalDiscount)}
                                                                                                                {totalDiscountPercentage > 0 && (
                                                                                                                        <span className="ml-1 text-slate-400">
                                                                                                                                ({totalDiscountPercentage}% aprox.)
                                                                                                                        </span>
                                                                                                                )}
                                                                                                        </span>
                                                                                                </div>
                                                                                                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                                                                                                        <span>Total con descuento</span>
                                                                                                        <span>{formatCurrency(pricing?.totalConDescuento)}</span>
                                                                                                </div>
                                                                                                <div className="space-y-1 text-xs text-slate-500">
                                                                                                        <p>Base online: {baseDiscountPercentage}%</p>
                                                                                                        {promotionDiscountPercentage > 0 && (
                                                                                                                <p>
                                                                                                                        Promo activa: {promotionDiscountPercentage}%
                                                                                                                        {discountInfo?.activePromotion?.descripcion
                                                                                                                                ? ` · ${discountInfo.activePromotion.descripcion}`
                                                                                                                                : ""}
                                                                                                                </p>
                                                                                                        )}
                                                                                                        {roundTripDiscountPercentage > 0 && (
                                                                                                                <p>Ida y vuelta: {roundTripDiscountPercentage}%</p>
                                                                                                        )}
                                                                                                        {personalizedDiscountPercentage > 0 && (
                                                                                                                <p>Beneficios extra: {personalizedDiscountPercentage}%</p>
                                                                                                        )}
                                                                                                </div>
                                                                                        </>
                                                                                ) : (
                                                                                        <p className="text-sm text-slate-600">
                                                                                                Estamos validando la tarifa para este destino. Te enviaremos la cotización y un enlace de pago.
                                                                                        </p>
                                                                                )}
                                                                        </div>
                                                                        <Separator />
                                                                        <div className="space-y-3">
                                                                                <p className="text-sm font-medium text-slate-600">Selecciona cómo prefieres pagar</p>
                                                                                <div className="grid gap-2">
                                                                                        {chargeOptions.map((option) => (
                                                                                                <Button
                                                                                                        key={option.id}
                                                                                                        type="button"
                                                                                                        variant={selectedCharge === option.id ? "default" : "outline"}
                                                                                                        onClick={() => setSelectedCharge(option.id)}
                                                                                                        disabled={option.disabled || requiereCotizacionManual}
                                                                                                        className={`flex h-auto flex-col items-start gap-1 rounded-lg border ${
                                                                                                                selectedCharge === option.id
                                                                                                                        ? "border-slate-900 bg-slate-900 text-white"
                                                                                                                        : "border-slate-200 bg-white text-slate-700"
                                                                                                        } px-4 py-3 text-left`}
                                                                                                >
                                                                                                        <span className="text-sm font-semibold">
                                                                                                                {option.title}
                                                                                                        </span>
                                                                                                        <span className="text-xs text-slate-500">
                                                                                                                {option.subtitle}
                                                                                                        </span>
                                                                                                        <span className="text-base font-semibold">
                                                                                                                {formatCurrency(option.amount)}
                                                                                                        </span>
                                                                                                </Button>
                                                                                        ))}
                                                                                </div>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                                <p className="text-sm font-medium text-slate-600">Métodos disponibles</p>
                                                                                <div className="grid gap-2">
                                                                                        {paymentMethods.map((method) => (
                                                                                                <button
                                                                                                        key={method.id}
                                                                                                        type="button"
                                                                                                        onClick={() => setSelectedMethod(method.id)}
                                                                                                        className={`flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                                                                                                                selectedMethod === method.id
                                                                                                                        ? "border-slate-900 bg-white text-slate-900"
                                                                                                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                                                                                        }`}
                                                                                                >
                                                                                                        <div className="flex items-center gap-3">
                                                                                                                <div className="h-9 w-14 overflow-hidden rounded-md bg-white">
                                                                                                                        <img
                                                                                                                                src={method.image}
                                                                                                                                alt={method.title}
                                                                                                                                className="h-full w-full object-contain"
                                                                                                                        />
                                                                                                                </div>
                                                                                                                <div className="text-left">
                                                                                                                        <p className="text-sm font-semibold">{method.title}</p>
                                                                                                                        <p className="text-xs text-slate-500">{method.subtitle}</p>
                                                                                                                </div>
                                                                                                        </div>
                                                                                                        {selectedMethod === method.id && (
                                                                                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                                                                        )}
                                                                                                </button>
                                                                                        ))}
                                                                                </div>
                                                                        </div>
                                                                        <Separator />
                                                                        <div className="space-y-4 text-sm text-slate-600">
                                                                                <div className="flex items-start gap-3">
                                                                                        <Checkbox
                                                                                                id="check-viaje"
                                                                                                checked={reviewChecklist.viaje}
                                                                                                onCheckedChange={(value) =>
                                                                                                        setReviewChecklist((prev) => ({
                                                                                                                ...prev,
                                                                                                                viaje: Boolean(value),
                                                                                                        }))
                                                                                                }
                                                                                        />
                                                                                        <label htmlFor="check-viaje" className="leading-tight">
                                                                                                Confirmo que revisé origen, destino y fechas seleccionadas.
                                                                                        </label>
                                                                                </div>
                                                                                <div className="flex items-start gap-3">
                                                                                        <Checkbox
                                                                                                id="check-contacto"
                                                                                                checked={reviewChecklist.contacto}
                                                                                                onCheckedChange={(value) =>
                                                                                                        setReviewChecklist((prev) => ({
                                                                                                                ...prev,
                                                                                                                contacto: Boolean(value),
                                                                                                        }))
                                                                                                }
                                                                                        />
                                                                                        <label htmlFor="check-contacto" className="leading-tight">
                                                                                                Confirmo que mis datos de contacto son correctos para recibir la coordinación.
                                                                                        </label>
                                                                                </div>
                                                                        </div>
                                                                </CardContent>
                                                        </Card>

                                                        <Card className="border-slate-200 bg-white/80">
                                                                <CardHeader className="pb-2">
                                                                        <CardTitle className="text-base font-semibold text-slate-800">
                                                                                ¿Tienes un código de descuento?
                                                                        </CardTitle>
                                                                </CardHeader>
                                                                <CardContent>
                                                                        <CodigoDescuento
                                                                                codigoAplicado={codigoAplicado}
                                                                                codigoError={codigoError}
                                                                                validandoCodigo={validandoCodigo}
                                                                                onAplicarCodigo={onAplicarCodigo}
                                                                                onRemoverCodigo={onRemoverCodigo}
                                                                        />
                                                                </CardContent>
                                                        </Card>
                                                </aside>
                                        </div>
                                </CardContent>
                                {(formError || statusMessage) && (
                                        <CardFooter className="flex flex-col items-start gap-2 border-t border-slate-100 bg-slate-50/80 py-4">
                                                {formError && <p className="text-sm text-red-600">{formError}</p>}
                                                {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
                                        </CardFooter>
                                )}
                        </Card>

                        <div className="sticky bottom-4 z-30 mt-4">
                                <Card className="border-slate-200 bg-slate-900 text-white shadow-lg">
                                        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                        <CreditCard className="h-5 w-5" />
                                                        <div>
                                                                <p className="text-sm font-medium">
                                                                        {mostrarPrecio
                                                                                ? `Pagarás ${formatCurrency(
                                                                                          selectedChargeData?.amount || pricing?.totalConDescuento || 0
                                                                                  )}`
                                                                                : "Confirmaremos el valor antes del pago"}
                                                                </p>
                                                                <p className="text-xs text-slate-300">
                                                                        {canPay
                                                                                ? "Listo para procesar tu pago online."
                                                                                : "Confirma tu información para habilitar el pago."}
                                                                </p>
                                                        </div>
                                                </div>
                                                <Button
                                                        type="button"
                                                        onClick={handleConfirmAndPay}
                                                        disabled={
                                                                preparingPayment ||
                                                                isSubmitting ||
                                                                selectedCombinationLoading ||
                                                                isAnotherGatewayLoading ||
                                                                requiereCotizacionManual
                                                        }
                                                        className="w-full bg-white text-slate-900 hover:bg-slate-100 sm:w-auto"
                                                >
                                                        {preparingPayment || isSubmitting ? (
                                                                <span className="flex items-center gap-2">
                                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                                        Preparando resumen...
                                                                </span>
                                                        ) : selectedCombinationLoading ? (
                                                                <span className="flex items-center gap-2">
                                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                                        Iniciando pago...
                                                                </span>
                                                        ) : (
                                                                "Confirmar y pagar"
                                                        )}
                                                </Button>
                                        </CardContent>
                                </Card>
                        </div>
                </div>
        );
}

export default BookingModuleMinimal;
