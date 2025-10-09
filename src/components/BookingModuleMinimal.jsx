import React, { useEffect, useMemo, useState } from "react";
import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "./ui/select";
import {
        Collapsible,
        CollapsibleContent,
        CollapsibleTrigger,
} from "./ui/collapsible";
import { ChevronDown, LoaderCircle } from "lucide-react";
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

const formatDateLong = (dateString) => {
        if (!dateString) return "Por confirmar";
        const parsed = new Date(`${dateString}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) return dateString;
        return parsed.toLocaleDateString("es-CL", {
                dateStyle: "long",
                timeZone: "America/Santiago",
        });
};

function BookingModuleMinimal({ data, status, handlers }) {
        const {
                formData,
                origenes = [],
                destinos = [],
                maxPasajeros = 7,
                minDateTime,
                cotizacion = {},
                pricing = {},
                descuentoRate = 0,
                baseDiscountRate = 0,
                promotionDiscountRate = 0,
                roundTripDiscountRate = 0,
                personalizedDiscountRate = 0,
                activePromotion = null,
        } = data || {};

        const {
                phoneError = "",
                canPay = false,
                loadingGateway = null,
                reviewChecklist = { viaje: false, contacto: false },
                isSubmitting = false,
                codigoAplicado = null,
                codigoError = null,
                validandoCodigo = false,
        } = status || {};

        const {
                onInputChange,
                onSetFormData,
                onValidateTelefono,
                onSetPhoneError,
                onSetReviewChecklist,
                onSubmit,
                onPayment,
                onAplicarCodigo,
                onRemoverCodigo,
        } = handlers || {};

        const [sectionsOpen, setSectionsOpen] = useState({
                viaje: true,
                contacto: true,
                extras: false,
        });
        const [reservationReady, setReservationReady] = useState(false);
        const [reservationLoading, setReservationLoading] = useState(false);
        const [ctaError, setCtaError] = useState("");

        const timeOptions = useMemo(() => generateTimeOptions(), []);
        const currencyFormatter = useMemo(
                () =>
                        new Intl.NumberFormat("es-CL", {
                                style: "currency",
                                currency: "CLP",
                                minimumFractionDigits: 0,
                        }),
                []
        );
        const formatCurrency = (value) => currencyFormatter.format(value || 0);

        const mostrarPrecio = typeof cotizacion?.precio === "number";
        const vehiculoSugerido = cotizacion?.vehiculo || "A confirmar";

        const baseDiscountPercentage = Math.round((baseDiscountRate || 0) * 100);
        const promoDiscountPercentage = Math.round((promotionDiscountRate || 0) * 100);
        const roundTripDiscountPercentage = Math.round((roundTripDiscountRate || 0) * 100);
        const personalizedDiscountPercentage = Math.round(
                (personalizedDiscountRate || 0) * 100
        );
        const codigoPercentage =
                codigoAplicado?.tipo === "porcentaje" ? Number(codigoAplicado.valor) || 0 : 0;
        const totalDiscountPercentage = Math.min(
                Math.round((descuentoRate || 0) * 100) + codigoPercentage,
                75
        );

        const fechaLegible = useMemo(() => formatDateLong(formData?.fecha), [formData?.fecha]);
        const horaLegible = formData?.hora ? `${formData.hora} hrs` : "Por confirmar";
        const pasajerosLabel = `${formData?.pasajeros || "1"} pasajero(s)`;

        const promotionDetails = useMemo(() => {
                if (!activePromotion) return null;
                const parts = [];
                const promoDays = Array.isArray(activePromotion.dias)
                        ? activePromotion.dias
                        : [];
                if (activePromotion.aplicaPorDias && promoDays.length > 0) {
                        parts.push(`Días: ${promoDays.join(", ")}`);
                }
                if (
                        activePromotion.aplicaPorHorario &&
                        activePromotion.horaInicio &&
                        activePromotion.horaFin
                ) {
                        parts.push(
                                `Horario: ${activePromotion.horaInicio} - ${activePromotion.horaFin} hrs`
                        );
                }
                return parts.join(" · ");
        }, [activePromotion]);

        const paymentOptions = useMemo(
                () => [
                        {
                                id: "flow-abono",
                                label: "Flow · Abonar 40%",
                                helper: "Reserva confirmada abonando ahora",
                                amount: pricing?.abono || 0,
                                gateway: "flow",
                                type: "abono",
                                image: flow,
                                disabled: !mostrarPrecio || (pricing?.abono || 0) <= 0,
                        },
                        {
                                id: "flow-total",
                                label: "Flow · Pagar total",
                                helper: "Webpay, tarjetas y transferencia",
                                amount: pricing?.totalConDescuento || 0,
                                gateway: "flow",
                                type: "total",
                                image: flow,
                                disabled: !mostrarPrecio || (pricing?.totalConDescuento || 0) <= 0,
                        },
                        {
                                id: "mp-total",
                                label: "Mercado Pago · Total",
                                helper: "Tarjetas y billetera Mercado Pago",
                                amount: pricing?.totalConDescuento || 0,
                                gateway: "mercadopago",
                                type: "total",
                                image: merPago,
                                disabled: !mostrarPrecio || (pricing?.totalConDescuento || 0) <= 0,
                        },
                ],
                [mostrarPrecio, pricing?.abono, pricing?.totalConDescuento]
        );

        useEffect(() => {
                setReservationReady(false);
        }, [
                formData?.origen,
                formData?.otroOrigen,
                formData?.destino,
                formData?.otroDestino,
                formData?.fecha,
                formData?.hora,
                formData?.pasajeros,
                formData?.nombre,
                formData?.telefono,
                formData?.email,
                formData?.idaVuelta,
                formData?.fechaRegreso,
                formData?.horaRegreso,
                formData?.numeroVuelo,
                formData?.hotel,
                formData?.equipajeEspecial,
                formData?.sillaInfantil,
                formData?.mensaje,
        ]);

        useEffect(() => {
                if (!canPay) {
                        setReservationReady(false);
                }
        }, [canPay]);

        const handleUpdateField = (name, value) => {
                if (typeof onSetFormData === "function") {
                        onSetFormData((prev) => ({ ...prev, [name]: value }));
                }
        };

        const handleRoundTripToggle = (value) => {
                if (typeof onSetFormData !== "function") return;
                const idaVuelta = Boolean(value);
                onSetFormData((prev) => ({
                        ...prev,
                        idaVuelta,
                        fechaRegreso: idaVuelta ? prev.fechaRegreso || prev.fecha : "",
                        horaRegreso: idaVuelta ? prev.horaRegreso : "",
                }));
        };

        const handleChecklistChange = (field, value) => {
                if (typeof onSetReviewChecklist === "function") {
                        onSetReviewChecklist((prev) => ({ ...prev, [field]: Boolean(value) }));
                }
        };

        const handlePhoneBlur = () => {
                if (typeof onValidateTelefono === "function") {
                        const isValid = onValidateTelefono(formData?.telefono || "");
                        if (!isValid) {
                                onSetPhoneError?.(
                                        "Introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
                                );
                        } else {
                                onSetPhoneError?.("");
                        }
                }
        };

        const handleConfirmAndPay = async () => {
                if (!canPay || reservationLoading) {
                        if (!canPay) {
                                setCtaError("Marca ambas casillas para habilitar el pago en línea.");
                        }
                        return;
                }
                if (!formData?.nombre || !formData?.email || !formData?.telefono) {
                        setCtaError("Completa los datos de contacto antes de continuar.");
                        return;
                }
                if (typeof onValidateTelefono === "function") {
                        const isValidPhone = onValidateTelefono(formData.telefono || "");
                        if (!isValidPhone) {
                                onSetPhoneError?.(
                                        "Introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
                                );
                                setCtaError("Revisa el número de teléfono indicado.");
                                return;
                        }
                        onSetPhoneError?.("");
                }

                if (typeof onSubmit !== "function") {
                        setReservationReady(true);
                        setCtaError("");
                        return;
                }

                setReservationLoading(true);
                setCtaError("");
                try {
                        const result = await onSubmit();
                        if (!result?.success) {
                                if (result?.error === "horario" && result?.message) {
                                        setCtaError(result.message);
                                } else if (result?.error === "telefono") {
                                        setCtaError("Revisa el número de teléfono ingresado.");
                                } else if (result?.message) {
                                        setCtaError(result.message);
                                } else {
                                        setCtaError("No pudimos confirmar tu reserva. Intenta nuevamente.");
                                }
                                setReservationReady(false);
                                return;
                        }
                        setReservationReady(true);
                        setCtaError("");
                } finally {
                        setReservationLoading(false);
                }
        };

        const origenFinal =
                formData?.origen === "Otro"
                        ? formData?.otroOrigen || "Por confirmar"
                        : formData?.origen || "Por confirmar";
        const destinoFinal =
                formData?.destino === "Otro"
                        ? formData?.otroDestino || "Por confirmar"
                        : formData?.destino || "Por confirmar";

        const toggleSection = (key) => (open) => {
                setSectionsOpen((prev) => ({ ...prev, [key]: open }));
        };

        return (
                <div className="relative flex flex-col gap-8 pb-28">
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                                <div className="space-y-6">
                                        <Collapsible
                                                open={sectionsOpen.viaje}
                                                onOpenChange={toggleSection("viaje")}
                                        >
                                                <Card className="border-slate-200 bg-white/95 shadow-sm">
                                                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                                                                <div className="space-y-1">
                                                                        <CardTitle className="text-lg font-semibold text-slate-900">
                                                                                Datos del viaje
                                                                        </CardTitle>
                                                                        <p className="text-sm text-slate-500">
                                                                                Define origen, destino, fecha y pasajeros de tu traslado.
                                                                        </p>
                                                                </div>
                                                                <CollapsibleTrigger asChild>
                                                                        <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                                                        >
                                                                                <ChevronDown
                                                                                        className={`h-4 w-4 transition-transform ${
                                                                                                sectionsOpen.viaje
                                                                                                        ? "rotate-180"
                                                                                                        : "rotate-0"
                                                                                        }`}
                                                                                />
                                                                        </Button>
                                                                </CollapsibleTrigger>
                                                        </CardHeader>
                                                        <CollapsibleContent>
                                                                <CardContent className="space-y-6">
                                                                        <div className="grid gap-4 md:grid-cols-2">
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="origen">Origen</Label>
                                                                                        <Select
                                                                                                value={formData?.origen || ""}
                                                                                                onValueChange={(value) =>
                                                                                                        handleUpdateField("origen", value)
                                                                                                }
                                                                                        >
                                                                                                <SelectTrigger id="origen">
                                                                                                        <SelectValue placeholder="Selecciona el origen" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                        {origenes.map((origen) => (
                                                                                                                <SelectItem key={origen} value={origen}>
                                                                                                                        {origen}
                                                                                                                </SelectItem>
                                                                                                        ))}
                                                                                                        {!origenes.includes("Otro") && (
                                                                                                                <SelectItem value="Otro">Otro</SelectItem>
                                                                                                        )}
                                                                                                </SelectContent>
                                                                                        </Select>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="destino">Destino</Label>
                                                                                        <Select
                                                                                                value={formData?.destino || ""}
                                                                                                onValueChange={(value) =>
                                                                                                        handleUpdateField("destino", value)
                                                                                                }
                                                                                        >
                                                                                                <SelectTrigger id="destino">
                                                                                                        <SelectValue placeholder="Selecciona el destino" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                        <SelectItem value="">
                                                                                                                Selecciona destino
                                                                                                        </SelectItem>
                                                                                                        {destinos.map((destino) => (
                                                                                                                <SelectItem key={destino} value={destino}>
                                                                                                                        {destino}
                                                                                                                </SelectItem>
                                                                                                        ))}
                                                                                                        {!destinos.includes("Otro") && (
                                                                                                                <SelectItem value="Otro">Otro</SelectItem>
                                                                                                        )}
                                                                                                </SelectContent>
                                                                                        </Select>
                                                                                </div>
                                                                        </div>
                                                                        {formData?.origen === "Otro" && (
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="otro-origen">Especifica el origen</Label>
                                                                                        <Input
                                                                                                id="otro-origen"
                                                                                                name="otroOrigen"
                                                                                                value={formData?.otroOrigen || ""}
                                                                                                onChange={onInputChange}
                                                                                                placeholder="Ej: Hotel en Temuco"
                                                                                        />
                                                                                </div>
                                                                        )}
                                                                        {formData?.destino === "Otro" && (
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="otro-destino">Especifica el destino</Label>
                                                                                        <Input
                                                                                                id="otro-destino"
                                                                                                name="otroDestino"
                                                                                                value={formData?.otroDestino || ""}
                                                                                                onChange={onInputChange}
                                                                                                placeholder="Ej: Centro de ski Corralco"
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
                                                                                                value={formData?.fecha || ""}
                                                                                                onChange={onInputChange}
                                                                                                min={minDateTime}
                                                                                        />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="hora">Hora</Label>
                                                                                        <Select
                                                                                                value={formData?.hora || ""}
                                                                                                onValueChange={(value) =>
                                                                                                        handleUpdateField("hora", value)
                                                                                                }
                                                                                        >
                                                                                                <SelectTrigger id="hora">
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
                                                                                        <Select
                                                                                                value={formData?.pasajeros || "1"}
                                                                                                onValueChange={(value) =>
                                                                                                        handleUpdateField("pasajeros", value)
                                                                                                }
                                                                                        >
                                                                                                <SelectTrigger id="pasajeros">
                                                                                                        <SelectValue placeholder="N.º de pasajeros" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                        {Array.from({ length: maxPasajeros }, (_, index) => index + 1).map((num) => (
                                                                                                                <SelectItem key={num} value={String(num)}>
                                                                                                                        {num}
                                                                                                                </SelectItem>
                                                                                                        ))}
                                                                                                </SelectContent>
                                                                                        </Select>
                                                                                </div>
                                                                        </div>
                                                                        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                                                                                <div className="flex items-start gap-3">
                                                                                        <Checkbox
                                                                                                id="ida-vuelta"
                                                                                                checked={Boolean(formData?.idaVuelta)}
                                                                                                onCheckedChange={handleRoundTripToggle}
                                                                                        />
                                                                                        <div className="space-y-1">
                                                                                                <label
                                                                                                        htmlFor="ida-vuelta"
                                                                                                        className="text-sm font-medium text-slate-700"
                                                                                                >
                                                                                                        Reservar ida y vuelta
                                                                                                </label>
                                                                                                <p className="text-xs text-slate-500">
                                                                                                        Coordina regreso con descuento adicional del {roundTripDiscountPercentage}%.
                                                                                                </p>
                                                                                        </div>
                                                                                </div>
                                                                                {formData?.idaVuelta && (
                                                                                        <div className="grid gap-4 md:grid-cols-2">
                                                                                                <div className="space-y-2">
                                                                                                        <Label htmlFor="fecha-regreso">Fecha regreso</Label>
                                                                                                        <Input
                                                                                                                id="fecha-regreso"
                                                                                                                type="date"
                                                                                                                name="fechaRegreso"
                                                                                                                value={formData?.fechaRegreso || ""}
                                                                                                                onChange={onInputChange}
                                                                                                                min={formData?.fecha || minDateTime}
                                                                                                        />
                                                                                                </div>
                                                                                                <div className="space-y-2">
                                                                                                        <Label htmlFor="hora-regreso">Hora regreso</Label>
                                                                                                        <Select
                                                                                                                value={formData?.horaRegreso || ""}
                                                                                                                onValueChange={(value) =>
                                                                                                                        handleUpdateField("horaRegreso", value)
                                                                                                                }
                                                                                                        >
                                                                                                                <SelectTrigger id="hora-regreso">
                                                                                                                        <SelectValue placeholder="Selecciona la hora" />
                                                                                                                </SelectTrigger>
                                                                                                                <SelectContent>
                                                                                                                        {timeOptions.map((option) => (
                                                                                                                                <SelectItem
                                                                                                                                        key={`regreso-${option.value}`}
                                                                                                                                        value={option.value}
                                                                                                                                >
                                                                                                                                        {option.label}
                                                                                                                                </SelectItem>
                                                                                                                        ))}
                                                                                                        </SelectContent>
                                                                                                        </Select>
                                                                                                </div>
                                                                                        </div>
                                                                                )}
                                                                        </div>
                                                                </CardContent>
                                                        </CollapsibleContent>
                                                </Card>
                                        </Collapsible>

                                        <Collapsible
                                                open={sectionsOpen.contacto}
                                                onOpenChange={toggleSection("contacto")}
                                        >
                                                <Card className="border-slate-200 bg-white/95 shadow-sm">
                                                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                                                                <div className="space-y-1">
                                                                        <CardTitle className="text-lg font-semibold text-slate-900">
                                                                                Datos de contacto
                                                                        </CardTitle>
                                                                        <p className="text-sm text-slate-500">
                                                                                Te enviaremos la confirmación y seguimiento del traslado.
                                                                        </p>
                                                                </div>
                                                                <CollapsibleTrigger asChild>
                                                                        <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                                                        >
                                                                                <ChevronDown
                                                                                        className={`h-4 w-4 transition-transform ${
                                                                                                sectionsOpen.contacto
                                                                                                        ? "rotate-180"
                                                                                                        : "rotate-0"
                                                                                        }`}
                                                                                />
                                                                        </Button>
                                                                </CollapsibleTrigger>
                                                        </CardHeader>
                                                        <CollapsibleContent>
                                                                <CardContent className="space-y-4">
                                                                        <div className="grid gap-4 md:grid-cols-2">
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="nombre">Nombre completo</Label>
                                                                                        <Input
                                                                                                id="nombre"
                                                                                                name="nombre"
                                                                                                value={formData?.nombre || ""}
                                                                                                onChange={onInputChange}
                                                                                                placeholder="Quien coordina la reserva"
                                                                                        />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="telefono">Teléfono móvil</Label>
                                                                                        <Input
                                                                                                id="telefono"
                                                                                                name="telefono"
                                                                                                value={formData?.telefono || ""}
                                                                                                onChange={onInputChange}
                                                                                                onBlur={handlePhoneBlur}
                                                                                                placeholder="+56 9 1234 5678"
                                                                                        />
                                                                                        {phoneError && (
                                                                                                <p className="text-xs text-red-600">{phoneError}</p>
                                                                                        )}
                                                                                </div>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="email">Correo electrónico</Label>
                                                                                <Input
                                                                                        id="email"
                                                                                        type="email"
                                                                                        name="email"
                                                                                        value={formData?.email || ""}
                                                                                        onChange={onInputChange}
                                                                                        placeholder="Recibirás la confirmación aquí"
                                                                                />
                                                                        </div>
                                                                </CardContent>
                                                        </CollapsibleContent>
                                                </Card>
                                        </Collapsible>

                                        <Collapsible
                                                open={sectionsOpen.extras}
                                                onOpenChange={toggleSection("extras")}
                                        >
                                                <Card className="border-slate-200 bg-white/95 shadow-sm">
                                                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                                                                <div className="space-y-1">
                                                                        <CardTitle className="text-lg font-semibold text-slate-900">
                                                                                Información adicional
                                                                        </CardTitle>
                                                                        <p className="text-sm text-slate-500">
                                                                                Añade detalles para personalizar tu experiencia.
                                                                        </p>
                                                                </div>
                                                                <CollapsibleTrigger asChild>
                                                                        <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                                                        >
                                                                                <ChevronDown
                                                                                        className={`h-4 w-4 transition-transform ${
                                                                                                sectionsOpen.extras
                                                                                                        ? "rotate-180"
                                                                                                        : "rotate-0"
                                                                                        }`}
                                                                                />
                                                                        </Button>
                                                                </CollapsibleTrigger>
                                                        </CardHeader>
                                                        <CollapsibleContent>
                                                                <CardContent className="space-y-4">
                                                                        <div className="grid gap-4 md:grid-cols-2">
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="numero-vuelo">Número de vuelo</Label>
                                                                                        <Input
                                                                                                id="numero-vuelo"
                                                                                                name="numeroVuelo"
                                                                                                value={formData?.numeroVuelo || ""}
                                                                                                onChange={onInputChange}
                                                                                                placeholder="Ej: LA123"
                                                                                        />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="hotel">Hotel o dirección</Label>
                                                                                        <Input
                                                                                                id="hotel"
                                                                                                name="hotel"
                                                                                                value={formData?.hotel || ""}
                                                                                                onChange={onInputChange}
                                                                                                placeholder="Dónde te recogemos o dejamos"
                                                                                        />
                                                                                </div>
                                                                        </div>
                                                                        <div className="grid gap-4 md:grid-cols-2">
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="equipaje">Equipaje especial</Label>
                                                                                        <Input
                                                                                                id="equipaje"
                                                                                                name="equipajeEspecial"
                                                                                                value={formData?.equipajeEspecial || ""}
                                                                                                onChange={onInputChange}
                                                                                                placeholder="Tablas, equipos deportivos, etc."
                                                                                        />
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                        <Label htmlFor="silla-infantil">Silla infantil</Label>
                                                                                        <Select
                                                                                                value={formData?.sillaInfantil || "no"}
                                                                                                onValueChange={(value) =>
                                                                                                        handleUpdateField("sillaInfantil", value)
                                                                                                }
                                                                                        >
                                                                                                <SelectTrigger id="silla-infantil">
                                                                                                        <SelectValue placeholder="¿Requieres silla?" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                        <SelectItem value="no">No requerida</SelectItem>
                                                                                                        <SelectItem value="si">Sí, necesito silla</SelectItem>
                                                                                                </SelectContent>
                                                                                        </Select>
                                                                                </div>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                                <Label htmlFor="mensaje">Comentarios</Label>
                                                                                <Textarea
                                                                                        id="mensaje"
                                                                                        name="mensaje"
                                                                                        value={formData?.mensaje || ""}
                                                                                        onChange={onInputChange}
                                                                                        placeholder="Comparte indicaciones adicionales."
                                                                                />
                                                                        </div>
                                                                        <CodigoDescuento
                                                                                codigoAplicado={codigoAplicado}
                                                                                codigoError={codigoError}
                                                                                validandoCodigo={validandoCodigo}
                                                                                onAplicarCodigo={onAplicarCodigo}
                                                                                onRemoverCodigo={onRemoverCodigo}
                                                                        />
                                                                </CardContent>
                                                        </CollapsibleContent>
                                                </Card>
                                        </Collapsible>
                                </div>

                                <Card className="border-slate-200 bg-white/95 shadow-sm">
                                        <CardHeader>
                                                <CardTitle className="text-lg font-semibold text-slate-900">
                                                        Resumen del traslado
                                                </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                                <div className="space-y-3 text-sm text-slate-600">
                                                        <div>
                                                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                                                        Origen
                                                                </p>
                                                                <p className="text-base font-medium text-slate-900">{origenFinal}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                                                        Destino
                                                                </p>
                                                                <p className="text-base font-medium text-slate-900">{destinoFinal}</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                        <p className="text-xs uppercase tracking-wide text-slate-400">
                                                                                Fecha
                                                                        </p>
                                                                        <p className="text-base font-medium text-slate-900">
                                                                                {fechaLegible}
                                                                        </p>
                                                                </div>
                                                                <div>
                                                                        <p className="text-xs uppercase tracking-wide text-slate-400">
                                                                                Hora
                                                                        </p>
                                                                        <p className="text-base font-medium text-slate-900">{horaLegible}</p>
                                                                </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                        <p className="text-xs uppercase tracking-wide text-slate-400">
                                                                                Pasajeros
                                                                        </p>
                                                                        <p className="text-base font-medium text-slate-900">
                                                                                {pasajerosLabel}
                                                                        </p>
                                                                </div>
                                                                <div>
                                                                        <p className="text-xs uppercase tracking-wide text-slate-400">
                                                                                Vehículo sugerido
                                                                        </p>
                                                                        <p className="text-base font-medium text-slate-900">
                                                                                {vehiculoSugerido}
                                                                        </p>
                                                                </div>
                                                        </div>
                                                        {formData?.idaVuelta && (
                                                                <p className="text-xs font-medium text-slate-500">
                                                                        Ida y vuelta coordinada. Reconfirmaremos horarios para ambos trayectos.
                                                                </p>
                                                        )}
                                                </div>

                                                <Separator />

                                                {mostrarPrecio ? (
                                                        <div className="space-y-4">
                                                                <div className="flex items-center justify-between text-sm text-slate-600">
                                                                        <span>Precio base</span>
                                                                        <span className="font-semibold text-slate-900">
                                                                                {formatCurrency(pricing?.precioBase)}
                                                                        </span>
                                                                </div>
                                                                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-600">
                                                                        <div className="flex items-center justify-between">
                                                                                <span>Descuento base ({baseDiscountPercentage}%)</span>
                                                                                <span className="font-medium">
                                                                                        -{formatCurrency(pricing?.descuentoBase || 0)}
                                                                                </span>
                                                                        </div>
                                                                        {promoDiscountPercentage > 0 && (
                                                                                <div className="flex items-center justify-between">
                                                                                        <span>
                                                                                                {activePromotion?.descripcion ||
                                                                                                        `Promo adicional (+${promoDiscountPercentage}%)`}
                                                                                                {promotionDetails ? ` · ${promotionDetails}` : ""}
                                                                                        </span>
                                                                                        <span className="font-medium">
                                                                                                -{formatCurrency(pricing?.descuentoPromocion || 0)}
                                                                                        </span>
                                                                                </div>
                                                                        )}
                                                                        {roundTripDiscountPercentage > 0 && formData?.idaVuelta && (
                                                                                <div className="flex items-center justify-between">
                                                                                        <span>Ida y vuelta (+{roundTripDiscountPercentage}%)</span>
                                                                                        <span className="font-medium">
                                                                                                -{formatCurrency(pricing?.descuentoRoundTrip || 0)}
                                                                                        </span>
                                                                                </div>
                                                                        )}
                                                                        {personalizedDiscountPercentage > 0 && (
                                                                                <div className="flex items-center justify-between">
                                                                                        <span>Descuentos especiales (+{personalizedDiscountPercentage}%)</span>
                                                                                        <span className="font-medium">
                                                                                                -{formatCurrency(pricing?.descuentosPersonalizados || 0)}
                                                                                        </span>
                                                                                </div>
                                                                        )}
                                                                        {codigoAplicado && (
                                                                                <div className="flex items-center justify-between text-purple-700">
                                                                                        <span className="font-medium">
                                                                                                🎟️ Código {codigoAplicado.codigo}
                                                                                        </span>
                                                                                        <span className="font-semibold">
                                                                                                -{formatCurrency(pricing?.descuentoCodigo || 0)}
                                                                                        </span>
                                                                                </div>
                                                                        )}
                                                                        <div className="flex items-center justify-between text-slate-700">
                                                                                <span>Ahorro total aplicado</span>
                                                                                <span className="font-semibold">
                                                                                        -{formatCurrency(pricing?.descuentoOnline || 0)}
                                                                                        <span className="ml-1 text-xs text-slate-400">
                                                                                                ({totalDiscountPercentage}% máximo aplicado)
                                                                                        </span>
                                                                                </span>
                                                                        </div>
                                                                </div>
                                                                <div className="rounded-lg border border-slate-200 bg-white p-4">
                                                                        <p className="text-sm text-slate-500">Total con descuento</p>
                                                                        <p className="text-2xl font-semibold text-slate-900">
                                                                                {formatCurrency(pricing?.totalConDescuento || 0)}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500">
                                                                                Abono mínimo online: {formatCurrency(pricing?.abono || 0)}
                                                                        </p>
                                                                </div>
                                                        </div>
                                                ) : (
                                                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-600">
                                                                Calcularemos tu tarifa manualmente y te contactaremos para confirmar el monto exacto.
                                                        </div>
                                                )}

                                                <Separator />

                                                <div className="space-y-3 text-sm text-slate-600">
                                                        <p className="font-medium text-slate-700">Antes de continuar</p>
                                                        <div className="flex items-start gap-3">
                                                                <Checkbox
                                                                        id="check-viaje"
                                                                        checked={Boolean(reviewChecklist?.viaje)}
                                                                        onCheckedChange={(value) => handleChecklistChange("viaje", value)}
                                                                />
                                                                <label
                                                                        htmlFor="check-viaje"
                                                                        className="text-sm leading-relaxed text-slate-600"
                                                                >
                                                                        Confirmo que revisé origen, destino, fecha y hora de mi traslado.
                                                                </label>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                                <Checkbox
                                                                        id="check-contacto"
                                                                        checked={Boolean(reviewChecklist?.contacto)}
                                                                        onCheckedChange={(value) => handleChecklistChange("contacto", value)}
                                                                />
                                                                <label
                                                                        htmlFor="check-contacto"
                                                                        className="text-sm leading-relaxed text-slate-600"
                                                                >
                                                                        Acepto recibir la confirmación y enlace de pago por email y WhatsApp.
                                                                </label>
                                                        </div>
                                                        {!canPay && (
                                                                <p className="text-xs text-slate-500">
                                                                        Marca ambas casillas para habilitar el botón de confirmación.
                                                                </p>
                                                        )}
                                                </div>

                                                <Separator />

                                                <div className="space-y-4">
                                                        <p className="text-sm font-medium text-slate-700">Elige tu medio de pago</p>
                                                        <div className="grid gap-3">
                                                                {paymentOptions.map((option) => {
                                                                        const isLoading =
                                                                                loadingGateway === `${option.gateway}-${option.type}`;
                                                                        return (
                                                                                <button
                                                                                        key={option.id}
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                                onPayment?.(option.gateway, option.type)
                                                                                        }
                                                                                        disabled={
                                                                                                option.disabled ||
                                                                                                !reservationReady ||
                                                                                                isSubmitting ||
                                                                                                isLoading
                                                                                        }
                                                                                        className={`flex w-full items-center gap-4 rounded-lg border bg-white/90 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                                                                                                option.disabled || !reservationReady
                                                                                                        ? "border-slate-200 text-slate-400"
                                                                                                        : "border-slate-300 hover:border-slate-400"
                                                                                        } ${isLoading ? "opacity-70" : ""}`}
                                                                                >
                                                                                        <div className="h-14 w-14 overflow-hidden rounded-md border border-slate-200 bg-white p-2">
                                                                                                <img
                                                                                                        src={option.image}
                                                                                                        alt={option.label}
                                                                                                        className="h-full w-full object-contain"
                                                                                                        loading="lazy"
                                                                                                />
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                                <p className="font-semibold text-slate-800">{option.label}</p>
                                                                                                <p className="text-sm text-slate-500">{option.helper}</p>
                                                                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                                                                        {formatCurrency(option.amount)}
                                                                                                </p>
                                                                                                {!reservationReady && (
                                                                                                        <p className="text-xs text-slate-400">
                                                                                                                Confirma primero para habilitar el pago.
                                                                                                        </p>
                                                                                                )}
                                                                                        </div>
                                                                                        {isLoading && (
                                                                                                <LoaderCircle className="h-5 w-5 animate-spin text-slate-500" />
                                                                                        )}
                                                                                </button>
                                                                                );
                                                                        })}
                                                        </div>
                                                        {reservationReady && mostrarPrecio && (
                                                                <p className="text-xs text-slate-500">
                                                                        Abriremos el portal de pago en una nueva pestaña. Podrás reenviar el enlace desde tu correo.
                                                                </p>
                                                        )}
                                                        {reservationReady && !mostrarPrecio && (
                                                                <p className="text-xs text-slate-500">
                                                                        Hemos recibido tu solicitud. Te contactaremos con el valor confirmado y enlace de pago.
                                                                </p>
                                                        )}
                                                        {!mostrarPrecio && !reservationReady && (
                                                                <p className="text-xs text-slate-500">
                                                                        Una vez confirmemos la tarifa te enviaremos el enlace de pago correspondiente.
                                                                </p>
                                                        )}
                                                </div>
                                                {ctaError && (
                                                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                                                {ctaError}
                                                        </div>
                                                )}
                                        </CardContent>
                                </Card>
                        </div>

                        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
                                <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                                        <div className="flex flex-col">
                                                <span className="text-xs uppercase tracking-wide text-slate-400">
                                                        Total con descuento
                                                </span>
                                                <span className="text-lg font-semibold text-slate-900">
                                                        {mostrarPrecio
                                                                ? formatCurrency(pricing?.totalConDescuento || 0)
                                                                : "A confirmar"}
                                                </span>
                                        </div>
                                        <Button
                                                type="button"
                                                className="min-w-[180px] bg-slate-900 text-slate-50 hover:bg-slate-800"
                                                disabled={
                                                        !canPay ||
                                                        reservationLoading ||
                                                        isSubmitting ||
                                                        loadingGateway !== null
                                                }
                                                onClick={handleConfirmAndPay}
                                        >
                                                {reservationLoading ? (
                                                        <>
                                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                                Preparando pago...
                                                        </>
                                                ) : reservationReady ? (
                                                        "Listo para pagar"
                                                ) : (
                                                        "Confirmar y pagar"
                                                )}
                                        </Button>
                                </div>
                        </div>
                </div>
        );
}

export default BookingModuleMinimal;
