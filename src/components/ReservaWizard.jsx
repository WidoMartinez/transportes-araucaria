import React, {
        createContext,
        useCallback,
        useContext,
        useEffect,
        useMemo,
        useState,
} from "react";
import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
} from "./ui/dialog";
import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
        CalendarDays,
        CheckCircle2,
        ClipboardList,
        LoaderCircle,
        Luggage,
        MapPin,
        ShieldCheck,
        Users,
} from "lucide-react";

const ReservaWizardContext = createContext(null);

export const useReservaWizard = () => {
        const context = useContext(ReservaWizardContext);
        if (!context) {
                throw new Error(
                        "useReservaWizard debe utilizarse dentro de un ReservaWizard"
                );
        }
        return context;
};

const LOCAL_STORAGE_KEY = "reserva-wizard-state-v1";

const steps = [
        {
                title: "Datos del viaje",
                description:
                        "Selecciona origen, destino, fecha y pasajeros para tu traslado.",
        },
        {
                title: "Extras y preferencias",
                description:
                        "Define paradas intermedias, tipo de equipaje y códigos promocionales.",
        },
        {
                title: "Datos del pasajero",
                description:
                        "Ingresa la información de contacto y facturación del pasajero.",
        },
        {
                title: "Resumen y políticas",
                description:
                        "Revisa los detalles, acepta las políticas y confirma tu reserva.",
        },
];

const equipajeOptions = [
        {
                value: "ligero",
                label: "Ligero (1 bolso o mochila)",
                extra: 0,
        },
        {
                value: "estandar",
                label: "Estándar (1-2 maletas medianas)",
                extra: 3000,
        },
        {
                value: "voluminoso",
                label: "Voluminoso / deportivo",
                extra: 7000,
        },
];

const PROMO_CODES = {
        BIENVENIDO10: {
                descuento: 0.1,
                descripcion: "10% de descuento de bienvenida.",
        },
        CORPORATIVO15: {
                descuento: 0.15,
                descripcion: "15% para convenios corporativos.",
        },
};

const defaultFormData = {
        origen: "Aeropuerto La Araucanía",
        destino: "",
        otroDestino: "",
        fecha: "",
        hora: "",
        pasajeros: "1",
        paradas: "0",
        equipaje: "estandar",
        codigoPromocional: "",
        preferencias: "",
        nombre: "",
        telefono: "",
        email: "",
        rut: "",
        razonSocial: "",
        mensaje: "",
        aceptaPoliticas: false,
};

const stepValidationFields = [
        ["origen", "destino", "otroDestino", "fecha", "hora", "pasajeros"],
        ["equipaje"],
        ["nombre", "telefono", "email"],
        ["aceptaPoliticas"],
];

const phoneRegex = /^(\+?56)?(\s?9)\s?(\d{4})\s?(\d{4})$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rutRegex = /^[0-9]+-[0-9kK]$/;

function sanitizeParadasValue(value) {
        if (value === "" || value === null || value === undefined) return "";
        const numericValue = Number(value);
        if (Number.isNaN(numericValue) || numericValue < 0) return "0";
        if (numericValue > 6) return "6";
        return String(Math.trunc(numericValue));
}

function ReservaWizard({ destinos, children }) {
        const [open, setOpen] = useState(false);
        const [formData, setFormData] = useState(defaultFormData);
        const [currentStep, setCurrentStep] = useState(0);
        const [errors, setErrors] = useState({});
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [showConfirmationAlert, setShowConfirmationAlert] = useState(false);
        const [latestReservation, setLatestReservation] = useState(null);
        const [hasPersistedData, setHasPersistedData] = useState(false);

        const destinosPorNombre = useMemo(() => {
                const map = new Map();
                destinos.forEach((destino) => {
                        map.set(destino.nombre, destino);
                });
                return map;
        }, [destinos]);

        const selectedDestino = useMemo(
                () => destinosPorNombre.get(formData.destino),
                [destinosPorNombre, formData.destino]
        );

        const maxPasajeros = selectedDestino?.maxPasajeros || 7;

        const minDate = useMemo(() => {
                const anticipacion = selectedDestino?.minHorasAnticipacion || 5;
                const fechaMinima = new Date();
                fechaMinima.setHours(fechaMinima.getHours() + anticipacion);
                const anio = fechaMinima.getFullYear();
                const mes = String(fechaMinima.getMonth() + 1).padStart(2, "0");
                const dia = String(fechaMinima.getDate()).padStart(2, "0");
                return `${anio}-${mes}-${dia}`;
        }, [selectedDestino]);

        const minTimeForSelectedDate = useMemo(() => {
                if (!formData.fecha) return "00:00";
                const anticipacion = selectedDestino?.minHorasAnticipacion || 5;
                const fechaMinima = new Date();
                fechaMinima.setHours(fechaMinima.getHours() + anticipacion);

                const fechaSeleccionada = new Date(`${formData.fecha}T00:00:00`);
                if (Number.isNaN(fechaSeleccionada.getTime())) return "00:00";

                if (
                        fechaSeleccionada.getFullYear() === fechaMinima.getFullYear() &&
                        fechaSeleccionada.getMonth() === fechaMinima.getMonth() &&
                        fechaSeleccionada.getDate() === fechaMinima.getDate()
                ) {
                        const horas = String(fechaMinima.getHours()).padStart(2, "0");
                        const minutos = String(fechaMinima.getMinutes()).padStart(2, "0");
                        return `${horas}:${minutos}`;
                }

                return "00:00";
        }, [formData.fecha, selectedDestino]);

        const hasProgress = useMemo(() => {
                if (hasPersistedData) return true;
                return (
                        Boolean(formData.destino) ||
                        Boolean(formData.fecha) ||
                        Boolean(formData.hora) ||
                        Boolean(formData.nombre) ||
                        Boolean(formData.telefono) ||
                        Boolean(formData.email) ||
                        (formData.paradas && formData.paradas !== "0") ||
                        Boolean(formData.codigoPromocional) ||
                        Boolean(formData.preferencias) ||
                        Boolean(formData.mensaje)
                );
        }, [formData, hasPersistedData]);

        useEffect(() => {
                if (typeof window === "undefined") return;
                try {
                        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
                        if (!stored) return;
                        const parsed = JSON.parse(stored);
                        if (parsed?.formData) {
                                setFormData((prev) => ({
                                        ...prev,
                                        ...parsed.formData,
                                }));
                        }
                        if (typeof parsed?.currentStep === "number") {
                                setCurrentStep(() => {
                                        const step = parsed.currentStep;
                                        if (step < 0) return 0;
                                        if (step >= steps.length) return steps.length - 1;
                                        return step;
                                });
                        }
                        setHasPersistedData(true);
                } catch (error) {
                        console.error("No se pudo recuperar el estado del wizard", error);
                }
        }, []);

        useEffect(() => {
                if (typeof window === "undefined") return;
                const shouldPersist =
                        Boolean(formData.destino) ||
                        Boolean(formData.fecha) ||
                        Boolean(formData.hora) ||
                        Boolean(formData.nombre) ||
                        Boolean(formData.telefono) ||
                        Boolean(formData.email) ||
                        (formData.paradas && formData.paradas !== "0") ||
                        Boolean(formData.codigoPromocional) ||
                        Boolean(formData.preferencias) ||
                        Boolean(formData.mensaje) ||
                        formData.aceptaPoliticas;

                if (shouldPersist) {
                        const payload = {
                                formData,
                                currentStep,
                        };
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
                        setHasPersistedData(true);
                } else {
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                        setHasPersistedData(false);
                }
        }, [formData, currentStep]);

        const getFieldError = useCallback(
                (field, data) => {
                        switch (field) {
                                case "origen":
                                        return data.origen?.trim()
                                                ? ""
                                                : "Indica el punto de origen.";
                                case "destino":
                                        return data.destino
                                                ? ""
                                                : "Selecciona un destino.";
                                case "otroDestino":
                                        if (data.destino === "Otro" && !data.otroDestino?.trim()) {
                                                return "Especifica el destino.";
                                        }
                                        return "";
                                case "fecha":
                                case "hora": {
                                        if (!data.fecha || !data.hora) {
                                                return "Selecciona fecha y hora válidas.";
                                        }
                                        const fechaReserva = new Date(
                                                `${data.fecha}T${data.hora}`
                                        );
                                        if (Number.isNaN(fechaReserva.getTime())) {
                                                return "La fecha u hora no son válidas.";
                                        }
                                        const ahora = new Date();
                                        if (fechaReserva <= ahora) {
                                                return "La reserva debe ser en un horario futuro.";
                                        }
                                        if (data.destino && data.destino !== "Otro") {
                                                const destinoSeleccionado =
                                                        destinosPorNombre.get(data.destino);
                                                if (destinoSeleccionado) {
                                                        const diffHoras =
                                                                (fechaReserva - ahora) /
                                                                (1000 * 60 * 60);
                                                        if (
                                                                diffHoras <
                                                                destinoSeleccionado.minHorasAnticipacion
                                                        ) {
                                                                return `Para ${destinoSeleccionado.nombre}, reserva con al menos ${destinoSeleccionado.minHorasAnticipacion} horas de anticipación.`;
                                                        }
                                                }
                                        }
                                        return "";
                                }
                                case "pasajeros": {
                                        if (!data.pasajeros) {
                                                return "Indica la cantidad de pasajeros.";
                                        }
                                        const pasajeros = Number(data.pasajeros);
                                        if (Number.isNaN(pasajeros) || pasajeros < 1) {
                                                return "Debe haber al menos un pasajero.";
                                        }
                                        const destinoSeleccionado =
                                                destinosPorNombre.get(data.destino);
                                        const maximo = destinoSeleccionado?.maxPasajeros || 7;
                                        if (pasajeros > maximo) {
                                                return `Para este destino el máximo es de ${maximo} pasajeros.`;
                                        }
                                        return "";
                                }
                                case "paradas": {
                                        if (data.paradas === "" || data.paradas === null) {
                                                return "";
                                        }
                                        const paradas = Number(data.paradas);
                                        if (Number.isNaN(paradas) || paradas < 0) {
                                                return "Ingresa un número válido de paradas.";
                                        }
                                        if (paradas > 6) {
                                                return "Máximo 6 paradas adicionales por viaje.";
                                        }
                                        return "";
                                }
                                case "equipaje":
                                        return data.equipaje ? "" : "Selecciona el tipo de equipaje.";
                                case "codigoPromocional": {
                                        if (!data.codigoPromocional) return "";
                                        const code = data.codigoPromocional.trim().toUpperCase();
                                        if (!/^[A-Z0-9]{4,12}$/.test(code)) {
                                                return "El código debe tener entre 4 y 12 caracteres alfanuméricos.";
                                        }
                                        return "";
                                }
                                case "nombre":
                                        return data.nombre?.trim().length >= 3
                                                ? ""
                                                : "Ingresa el nombre completo.";
                                case "telefono":
                                        return phoneRegex.test(data.telefono)
                                                ? ""
                                                : "Formato válido: +56 9 XXXX XXXX.";
                                case "email":
                                        return emailRegex.test(data.email?.trim())
                                                ? ""
                                                : "Ingresa un correo válido.";
                                case "rut":
                                        if (!data.rut) return "";
                                        return rutRegex.test(data.rut.trim())
                                                ? ""
                                                : "Formato esperado: 12345678-9";
                                case "razonSocial":
                                        if (!data.razonSocial) return "";
                                        return data.razonSocial.trim().length >= 3
                                                ? ""
                                                : "La razón social debe tener al menos 3 caracteres.";
                                case "mensaje":
                                        if (!data.mensaje) return "";
                                        return data.mensaje.trim().length >= 5
                                                ? ""
                                                : "Describe tus comentarios con más detalle.";
                                case "aceptaPoliticas":
                                        return data.aceptaPoliticas
                                                ? ""
                                                : "Debes aceptar las políticas de servicio.";
                                default:
                                        return "";
                        }
                },
                [destinosPorNombre]
        );

        const applyValidation = useCallback(
                (currentErrors, field, data) => {
                        const nextErrors = { ...currentErrors };
                        const assignError = (name, message) => {
                                if (message) {
                                        nextErrors[name] = message;
                                } else {
                                        delete nextErrors[name];
                                }
                        };

                        if (field === "fecha" || field === "hora") {
                                const message = getFieldError("fecha", data);
                                assignError("fecha", message);
                                assignError("hora", message);
                        } else {
                                assignError(field, getFieldError(field, data));
                        }

                        if (field === "destino") {
                                assignError("otroDestino", getFieldError("otroDestino", data));
                                assignError("pasajeros", getFieldError("pasajeros", data));
                                const dateMessage = getFieldError("fecha", data);
                                assignError("fecha", dateMessage);
                                assignError("hora", dateMessage);
                        }

                        if (field === "pasajeros") {
                                assignError("pasajeros", getFieldError("pasajeros", data));
                        }

                        return nextErrors;
                },
                [getFieldError]
        );

        const handleFieldChange = useCallback(
                (field, rawValue) => {
                        setFormData((prev) => {
                                let value = rawValue;
                                if (field === "codigoPromocional" && typeof value === "string") {
                                        value = value.toUpperCase();
                                }
                                if (field === "paradas") {
                                        value = sanitizeParadasValue(value);
                                }
                                if (field === "aceptaPoliticas") {
                                        value = Boolean(value);
                                }

                                const next = {
                                        ...prev,
                                        [field]: value,
                                };

                                if (field === "destino" && value !== "Otro") {
                                        next.otroDestino = "";
                                }

                                setErrors((prevErrors) => applyValidation(prevErrors, field, next));

                                return next;
                        });
                },
                [applyValidation]
        );

        useEffect(() => {
                const pasajeros = Number(formData.pasajeros);
                if (!Number.isNaN(pasajeros) && pasajeros > maxPasajeros) {
                        const ajustado = String(maxPasajeros);
                        setFormData((prev) => ({
                                ...prev,
                                pasajeros: ajustado,
                        }));
                        setErrors((prevErrors) =>
                                applyValidation(prevErrors, "pasajeros", {
                                        ...formData,
                                        pasajeros: ajustado,
                                })
                        );
                }
        }, [formData, maxPasajeros, applyValidation]);

        const validateStep = useCallback(
                (stepIndex, data = formData) => {
                        const fields = stepValidationFields[stepIndex] || [];
                        let nextErrors = { ...errors };
                        let hasError = false;

                        fields.forEach((field) => {
                                if (field === "fecha" || field === "hora") {
                                        const message = getFieldError("fecha", data);
                                        if (message) {
                                                nextErrors.fecha = message;
                                                nextErrors.hora = message;
                                                hasError = true;
                                        } else {
                                                delete nextErrors.fecha;
                                                delete nextErrors.hora;
                                        }
                                } else {
                                        const message = getFieldError(field, data);
                                        if (message) {
                                                nextErrors[field] = message;
                                                hasError = true;
                                        } else {
                                                delete nextErrors[field];
                                        }
                                }
                        });

                        setErrors(nextErrors);
                        return !hasError;
                },
                [errors, formData, getFieldError]
        );

        const goToStep = useCallback((index) => {
                setCurrentStep(() => {
                        if (index < 0) return 0;
                        if (index >= steps.length) return steps.length - 1;
                        return index;
                });
        }, []);

        const nextStep = useCallback(() => {
                const isValid = validateStep(currentStep);
                if (!isValid) return;
                setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        }, [currentStep, validateStep]);

        const previousStep = useCallback(() => {
                setCurrentStep((prev) => Math.max(prev - 1, 0));
        }, []);

        const resetWizard = useCallback(() => {
                setFormData(defaultFormData);
                setCurrentStep(0);
                setErrors({});
                setHasPersistedData(false);
                if (typeof window !== "undefined") {
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                }
        }, []);

        const startWizard = useCallback(
                (initialValues = {}, options = {}) => {
                        setFormData((prev) => {
                                const merged = {
                                        ...prev,
                                        ...initialValues,
                                };
                                if (merged.destino && merged.destino !== "Otro") {
                                        merged.otroDestino = merged.otroDestino || "";
                                }
                                setErrors((prevErrors) => {
                                        let result = { ...prevErrors };
                                        Object.keys(initialValues).forEach((field) => {
                                                result = applyValidation(result, field, merged);
                                        });
                                        return result;
                                });
                                return merged;
                        });

                        if (options.reset) {
                                setErrors({});
                                setCurrentStep(options.step ?? 0);
                        } else if (typeof options.step === "number") {
                                goToStep(options.step);
                        }

                        setOpen(true);
                },
                [applyValidation, goToStep]
        );

        const closeWizard = useCallback(() => {
                setOpen(false);
        }, []);

        const calcularCotizacion = useCallback(
                (destinoSeleccionado, pasajeros) => {
                        if (!destinoSeleccionado || !pasajeros || destinoSeleccionado.nombre === "Otro") {
                                return { precio: null, vehiculo: null, breakdown: null };
                        }

                        const numPasajeros = Number(pasajeros);
                        let vehiculoAsignado = null;
                        let precioBase = null;

                        if (numPasajeros > 0 && numPasajeros <= 4) {
                                vehiculoAsignado = "Auto Privado";
                                const precios = destinoSeleccionado.precios.auto;
                                if (!precios) return { precio: null, vehiculo: vehiculoAsignado, breakdown: null };
                                const pasajerosAdicionales = numPasajeros - 1;
                                const costoAdicional = precios.base * precios.porcentajeAdicional;
                                precioBase = precios.base + pasajerosAdicionales * costoAdicional;
                        } else if (numPasajeros >= 5 && numPasajeros <= 7) {
                                vehiculoAsignado = "Van de Pasajeros";
                                const precios = destinoSeleccionado.precios.van;
                                if (!precios) return { precio: null, vehiculo: vehiculoAsignado, breakdown: null };
                                const pasajerosAdicionales = numPasajeros - 5;
                                const costoAdicional = precios.base * precios.porcentajeAdicional;
                                precioBase = precios.base + pasajerosAdicionales * costoAdicional;
                        } else {
                                vehiculoAsignado = "Consultar disponibilidad";
                                precioBase = null;
                        }

                        if (!precioBase) {
                                return {
                                        precio: null,
                                        vehiculo: vehiculoAsignado,
                                        breakdown: null,
                                };
                        }

                        const paradas = Number(formData.paradas) || 0;
                        const extraParadas = paradas * 5000;

                        const equipajeData = equipajeOptions.find(
                                (option) => option.value === formData.equipaje
                        );
                        const extraEquipaje = equipajeData?.extra || 0;

                        const subtotal = precioBase + extraParadas + extraEquipaje;

                        const promoCode = formData.codigoPromocional
                                ? formData.codigoPromocional.trim().toUpperCase()
                                : "";
                        const promo = promoCode ? PROMO_CODES[promoCode] : null;
                        const descuento = promo ? Math.round(subtotal * promo.descuento) : 0;
                        const total = Math.max(subtotal - descuento, 0);

                        return {
                                precio: Math.round(total),
                                vehiculo: vehiculoAsignado,
                                breakdown: {
                                        base: Math.round(precioBase),
                                        paradas: extraParadas,
                                        equipaje: extraEquipaje,
                                        descuento,
                                        subtotal: Math.round(subtotal),
                                },
                                codigoPromocionalAplicado: promo ? promoCode : null,
                                promoDescripcion: promo?.descripcion || null,
                        };
                },
                [formData.paradas, formData.equipaje, formData.codigoPromocional]
        );

        const cotizacion = useMemo(() => {
                const destino =
                        formData.destino === "Otro"
                                ? null
                                : destinosPorNombre.get(formData.destino);
                return calcularCotizacion(destino, formData.pasajeros);
        }, [calcularCotizacion, destinosPorNombre, formData.destino, formData.pasajeros]);

        const progressValue = useMemo(
                () => ((currentStep + 1) / steps.length) * 100,
                [currentStep]
        );

        const promoFeedback = useMemo(() => {
                if (!formData.codigoPromocional) return null;
                const code = formData.codigoPromocional.trim().toUpperCase();
                if (!/^[A-Z0-9]{4,12}$/.test(code)) {
                                return {
                                        type: "error",
                                        message:
                                                "El código debe tener entre 4 y 12 caracteres alfanuméricos.",
                                };
                }
                if (PROMO_CODES[code]) {
                        return {
                                type: "success",
                                message: PROMO_CODES[code].descripcion,
                        };
                }
                return {
                        type: "neutral",
                        message: "Validaremos tu código al momento de confirmar.",
                };
        }, [formData.codigoPromocional]);

        const renderStepContent = () => {
                switch (currentStep) {
                        case 0:
                                return (
                                        <div className="space-y-6">
                                                <p className="text-muted-foreground">
                                                        Cuéntanos cuándo y hacia dónde viajas. Guardamos tu progreso
                                                        automáticamente para que puedas retomarlo cuando quieras.
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div className="space-y-2">
                                                                <Label htmlFor="origen">Origen</Label>
                                                                <Input
                                                                        id="origen"
                                                                        value={formData.origen}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "origen",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        placeholder="Ej: Aeropuerto La Araucanía"
                                                                />
                                                                {errors.origen && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.origen}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="destino">Destino</Label>
                                                                <select
                                                                        id="destino"
                                                                        value={formData.destino}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "destino",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                                >
                                                                        <option value="">Selecciona destino</option>
                                                                        {destinos.map((destino) => (
                                                                                <option
                                                                                        key={destino.nombre}
                                                                                        value={destino.nombre}
                                                                                >
                                                                                        {destino.nombre}
                                                                                </option>
                                                                        ))}
                                                                        <option value="Otro">Otro destino</option>
                                                                </select>
                                                                {errors.destino && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.destino}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        {formData.destino === "Otro" && (
                                                                <div className="space-y-2 md:col-span-2">
                                                                        <Label htmlFor="otroDestino">Especificar destino</Label>
                                                                        <Input
                                                                                id="otroDestino"
                                                                                value={formData.otroDestino}
                                                                                onChange={(event) =>
                                                                                        handleFieldChange(
                                                                                                "otroDestino",
                                                                                                event.target.value
                                                                                        )
                                                                                }
                                                                                placeholder="Ingresa el destino final"
                                                                        />
                                                                        {errors.otroDestino && (
                                                                                <p className="text-sm text-destructive">
                                                                                        {errors.otroDestino}
                                                                                </p>
                                                                        )}
                                                                </div>
                                                        )}
                                                        <div className="space-y-2">
                                                                <Label htmlFor="fecha">Fecha</Label>
                                                                <Input
                                                                        id="fecha"
                                                                        type="date"
                                                                        min={minDate}
                                                                        value={formData.fecha}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "fecha",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                />
                                                                {errors.fecha && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.fecha}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="hora">Hora</Label>
                                                                <Input
                                                                        id="hora"
                                                                        type="time"
                                                                        min={minTimeForSelectedDate}
                                                                        value={formData.hora}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "hora",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                />
                                                                {errors.hora && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.hora}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="pasajeros">Pasajeros</Label>
                                                                <select
                                                                        id="pasajeros"
                                                                        value={formData.pasajeros}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "pasajeros",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                                >
                                                                        {Array.from({ length: maxPasajeros }, (_, index) => (
                                                                                <option key={index + 1} value={index + 1}>
                                                                                        {index + 1} pasajero(s)
                                                                                </option>
                                                                        ))}
                                                                </select>
                                                                <p className="text-xs text-muted-foreground">
                                                                        Máximo {maxPasajeros} pasajeros para este destino.
                                                                </p>
                                                                {errors.pasajeros && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.pasajeros}
                                                                        </p>
                                                                )}
                                                        </div>
                                                </div>
                                        </div>
                                );
                        case 1:
                                return (
                                        <div className="space-y-6">
                                                <p className="text-muted-foreground">
                                                        Personaliza tu viaje. Estos datos nos ayudan a asignar el vehículo
                                                        adecuado y calcular los extras correspondientes.
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div className="space-y-2">
                                                                <Label htmlFor="paradas">
                                                                        Paradas adicionales (opcional)
                                                                </Label>
                                                                <Input
                                                                        id="paradas"
                                                                        type="number"
                                                                        min="0"
                                                                        max="6"
                                                                        value={formData.paradas}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "paradas",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                />
                                                                <p className="text-xs text-muted-foreground">
                                                                        Considera $5.000 por cada parada adicional.
                                                                </p>
                                                                {errors.paradas && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.paradas}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="equipaje">Tipo de equipaje</Label>
                                                                <select
                                                                        id="equipaje"
                                                                        value={formData.equipaje}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "equipaje",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                                >
                                                                        {equipajeOptions.map((option) => (
                                                                                <option key={option.value} value={option.value}>
                                                                                        {option.label}
                                                                                </option>
                                                                        ))}
                                                                </select>
                                                                {errors.equipaje && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.equipaje}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2 md:col-span-2">
                                                                <Label htmlFor="codigoPromocional">
                                                                        Código promocional (opcional)
                                                                </Label>
                                                                <Input
                                                                        id="codigoPromocional"
                                                                        value={formData.codigoPromocional}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "codigoPromocional",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        placeholder="Ej: BIENVENIDO10"
                                                                />
                                                                {promoFeedback && (
                                                                        <p
                                                                                className={`text-sm ${
                                                                                        promoFeedback.type === "error"
                                                                                                ? "text-destructive"
                                                                                                : promoFeedback.type === "success"
                                                                                                ? "text-green-600"
                                                                                                : "text-muted-foreground"
                                                                                }`}
                                                                        >
                                                                                {promoFeedback.message}
                                                                        </p>
                                                                )}
                                                                {errors.codigoPromocional && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.codigoPromocional}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2 md:col-span-2">
                                                                <Label htmlFor="preferencias">
                                                                        Preferencias o necesidades especiales
                                                                </Label>
                                                                <Textarea
                                                                        id="preferencias"
                                                                        value={formData.preferencias}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "preferencias",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        placeholder="Ej: Silla infantil, mascota pequeña, música tranquila, etc."
                                                                        rows={4}
                                                                />
                                                        </div>
                                                </div>
                                        </div>
                                );
                        case 2:
                                return (
                                        <div className="space-y-6">
                                                <p className="text-muted-foreground">
                                                        Necesitamos tus datos de contacto para enviarte la confirmación y
                                                        coordinar el servicio. Si requieres factura, ingresa los datos
                                                        tributarios.
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div className="space-y-2">
                                                                <Label htmlFor="nombre">Nombre completo</Label>
                                                                <Input
                                                                        id="nombre"
                                                                        value={formData.nombre}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "nombre",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        placeholder="Ej: Juan Pérez"
                                                                />
                                                                {errors.nombre && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.nombre}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="telefono">Teléfono móvil</Label>
                                                                <Input
                                                                        id="telefono"
                                                                        value={formData.telefono}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "telefono",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        placeholder="+56 9 XXXX XXXX"
                                                                />
                                                                {errors.telefono && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.telefono}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="email">Correo electrónico</Label>
                                                                <Input
                                                                        id="email"
                                                                        type="email"
                                                                        value={formData.email}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "email",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        placeholder="tu@email.cl"
                                                                />
                                                                {errors.email && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.email}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2">
                                                                <Label htmlFor="rut">RUT o ID tributario (opcional)</Label>
                                                                <Input
                                                                        id="rut"
                                                                        value={formData.rut}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "rut",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        placeholder="12345678-9"
                                                                />
                                                                {errors.rut && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.rut}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2 md:col-span-2">
                                                                <Label htmlFor="razonSocial">
                                                                        Razón social / Empresa (opcional)
                                                                </Label>
                                                                <Input
                                                                        id="razonSocial"
                                                                        value={formData.razonSocial}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "razonSocial",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        placeholder="Nombre de la empresa o contribuyente"
                                                                />
                                                                {errors.razonSocial && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.razonSocial}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="space-y-2 md:col-span-2">
                                                                <Label htmlFor="mensaje">
                                                                        Comentarios adicionales (opcional)
                                                                </Label>
                                                                <Textarea
                                                                        id="mensaje"
                                                                        value={formData.mensaje}
                                                                        onChange={(event) =>
                                                                                handleFieldChange(
                                                                                        "mensaje",
                                                                                        event.target.value
                                                                                )
                                                                        }
                                                                        placeholder="Cuéntanos detalles importantes del viaje."
                                                                        rows={4}
                                                                />
                                                                {errors.mensaje && (
                                                                        <p className="text-sm text-destructive">
                                                                                {errors.mensaje}
                                                                        </p>
                                                                )}
                                                        </div>
                                                </div>
                                        </div>
                                );
                        case 3:
                                return (
                                        <div className="space-y-6">
                                                <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                                                        <h4 className="font-semibold text-foreground">
                                                                Revisa y confirma los detalles de tu reserva
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                                Si necesitas corregir algo, vuelve a los pasos anteriores antes
                                                                de confirmar.
                                                        </p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2 rounded-lg border p-4">
                                                                <div className="flex items-center space-x-2">
                                                                        <MapPin className="h-4 w-4 text-primary" />
                                                                        <h5 className="font-semibold">Trayecto</h5>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Origen: <strong>{formData.origen}</strong>
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Destino: <strong>{formData.destino === "Otro" ? formData.otroDestino || "Por confirmar" : formData.destino}</strong>
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Fecha y hora: <strong>{formData.fecha || "-"} {formData.hora || ""}</strong>
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Pasajeros: <strong>{formData.pasajeros}</strong>
                                                                </p>
                                                        </div>
                                                        <div className="space-y-2 rounded-lg border p-4">
                                                                <div className="flex items-center space-x-2">
                                                                        <ClipboardList className="h-4 w-4 text-primary" />
                                                                        <h5 className="font-semibold">Extras</h5>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Paradas adicionales: <strong>{Number(formData.paradas) > 0 ? `${formData.paradas}` : "No"}</strong>
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Equipaje: <strong>{equipajeOptions.find((option) => option.value === formData.equipaje)?.label || "Por confirmar"}</strong>
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Código promocional: <strong>{formData.codigoPromocional || "N/A"}</strong>
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Preferencias: <strong>{formData.preferencias || "Sin observaciones"}</strong>
                                                                </p>
                                                        </div>
                                                        <div className="space-y-2 rounded-lg border p-4">
                                                                <div className="flex items-center space-x-2">
                                                                        <Users className="h-4 w-4 text-primary" />
                                                                        <h5 className="font-semibold">Pasajero titular</h5>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Nombre: <strong>{formData.nombre || "-"}</strong>
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Teléfono: <strong>{formData.telefono || "-"}</strong>
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                        Email: <strong>{formData.email || "-"}</strong>
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                        RUT / ID: <strong>{formData.rut || "N/A"}</strong>
                                                                </p>
                                                        </div>
                                                        <div className="space-y-2 rounded-lg border p-4">
                                                                <div className="flex items-center space-x-2">
                                                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                                                        <h5 className="font-semibold">Políticas clave</h5>
                                                                </div>
                                                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                                                        <li>Reservas modificables hasta 12 horas antes sin costo.</li>
                                                                        <li>Abono del 40% para confirmar y saldo al conductor.</li>
                                                                        <li>Incluye seguro de pasajeros y monitoreo de vuelo.</li>
                                                                </ul>
                                                        </div>
                                                </div>
                                                <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                        <CalendarDays className="h-4 w-4 text-primary" />
                                                                        <h5 className="font-semibold">Resumen económico</h5>
                                                                </div>
                                                                {cotizacion.codigoPromocionalAplicado && (
                                                                        <span className="text-xs font-semibold text-green-600">
                                                                                Código aplicado: {cotizacion.codigoPromocionalAplicado}
                                                                        </span>
                                                                )}
                                                        </div>
                                                        {cotizacion.breakdown ? (
                                                                <div className="space-y-2 text-sm text-muted-foreground">
                                                                        <div className="flex justify-between">
                                                                                <span>Base del destino</span>
                                                                                <span className="font-semibold text-foreground">
                                                                                        {new Intl.NumberFormat("es-CL", {
                                                                                                style: "currency",
                                                                                                currency: "CLP",
                                                                                        }).format(cotizacion.breakdown.base)}
                                                                                </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                                <span>Extras paradas</span>
                                                                                <span className="font-semibold text-foreground">
                                                                                        {new Intl.NumberFormat("es-CL", {
                                                                                                style: "currency",
                                                                                                currency: "CLP",
                                                                                        }).format(cotizacion.breakdown.paradas)}
                                                                                </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                                <span>Extras equipaje</span>
                                                                                <span className="font-semibold text-foreground">
                                                                                        {new Intl.NumberFormat("es-CL", {
                                                                                                style: "currency",
                                                                                                currency: "CLP",
                                                                                        }).format(cotizacion.breakdown.equipaje)}
                                                                                </span>
                                                                        </div>
                                                                        {cotizacion.breakdown.descuento > 0 && (
                                                                                <div className="flex justify-between text-green-600">
                                                                                        <span>Descuento aplicado</span>
                                                                                        <span className="font-semibold">
                                                                                                -
                                                                                                {new Intl.NumberFormat("es-CL", {
                                                                                                        style: "currency",
                                                                                                        currency: "CLP",
                                                                                                }).format(cotizacion.breakdown.descuento)}
                                                                                        </span>
                                                                                </div>
                                                                        )}
                                                                        <Separator />
                                                                        <div className="flex justify-between text-base text-foreground font-semibold">
                                                                                <span>Total estimado</span>
                                                                                <span>
                                                                                        {cotizacion.precio
                                                                                                ? new Intl.NumberFormat("es-CL", {
                                                                                                          style: "currency",
                                                                                                          currency: "CLP",
                                                                                                  }).format(cotizacion.precio)
                                                                                                : "A coordinar"}
                                                                                </span>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground">
                                                                                Vehículo sugerido: {cotizacion.vehiculo || "Por confirmar"}
                                                                        </p>
                                                                </div>
                                                        ) : (
                                                                <p className="text-sm text-muted-foreground">
                                                                        Calcularemos el valor final contigo. Para destinos fuera del
                                                                        listado o grupos mayores, coordinaremos por WhatsApp.
                                                                </p>
                                                        )}
                                                </div>
                                                <div className="flex items-start space-x-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                                                        <Checkbox
                                                                id="aceptaPoliticas"
                                                                checked={formData.aceptaPoliticas}
                                                                onCheckedChange={(checked) =>
                                                                        handleFieldChange(
                                                                                "aceptaPoliticas",
                                                                                Boolean(checked)
                                                                        )
                                                                }
                                                        />
                                                        <Label htmlFor="aceptaPoliticas" className="text-sm text-muted-foreground leading-relaxed">
                                                                Acepto las políticas de servicio, las condiciones de pago y el
                                                                tratamiento de datos personales conforme a la legislación
                                                                chilena.
                                                        </Label>
                                                </div>
                                                {errors.aceptaPoliticas && (
                                                        <p className="text-sm text-destructive">
                                                                {errors.aceptaPoliticas}
                                                        </p>
                                                )}
                                        </div>
                                );
                        default:
                                return null;
                }
        };

        const handleSubmit = useCallback(async () => {
                for (let index = 0; index < stepValidationFields.length; index += 1) {
                        const isValid = validateStep(index);
                        if (!isValid) {
                                goToStep(index);
                                return;
                        }
                }

                setIsSubmitting(true);

                const destinoFinal =
                        formData.destino === "Otro" ? formData.otroDestino : formData.destino;

                const dataToSend = {
                        ...formData,
                        destino: destinoFinal,
                        precio: cotizacion.precio,
                        vehiculo: cotizacion.vehiculo,
                        breakdown: cotizacion.breakdown,
                        codigoPromocionalAplicado: cotizacion.codigoPromocionalAplicado,
                        source: "Reserva Wizard",
                };

                if (!dataToSend.nombre) {
                        dataToSend.nombre = "Cliente Wizard";
                }

                const apiUrl =
                        import.meta.env.VITE_API_URL ||
                        "https://transportes-araucaria.onrender.com";

                try {
                        const response = await fetch(`${apiUrl}/send-email`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(dataToSend),
                        });

                        if (!response.ok) {
                                const result = await response.json();
                                throw new Error(result.message || "Error en el servidor");
                        }

                        const abono = cotizacion.precio
                                ? Math.round(cotizacion.precio * 0.4)
                                : 0;
                        const saldoPendiente = cotizacion.precio
                                ? cotizacion.precio - abono
                                : 0;

                        const whatsappMessage = `Hola, completé mi reserva a ${destinoFinal} para el día ${formData.fecha} a las ${formData.hora}. Somos ${formData.pasajeros} pasajero(s). Extras: paradas ${formData.paradas || 0}, equipaje ${formData.equipaje}.`;

                        const resumen = {
                                ...formData,
                                destino: destinoFinal,
                                precio: cotizacion.precio,
                                vehiculo: cotizacion.vehiculo,
                                breakdown: cotizacion.breakdown,
                                codigoPromocionalAplicado: cotizacion.codigoPromocionalAplicado,
                                promoDescripcion: cotizacion.promoDescripcion,
                                abono,
                                saldoPendiente,
                                whatsappUrl: `https://wa.me/56936643540?text=${encodeURIComponent(
                                        whatsappMessage
                                )}`,
                        };

                        setLatestReservation(resumen);
                        setShowConfirmationAlert(true);
                        setOpen(false);
                        resetWizard();

                        if (typeof gtag === "function") {
                                gtag("event", "conversion", {
                                        send_to: `AW-17529712870/8GVlCLP-05MbEObh6KZB`,
                                });
                        }
                } catch (error) {
                        console.error("Error al enviar la reserva", error);
                        alert(`Error: ${error.message}`);
                } finally {
                        setIsSubmitting(false);
                }
        }, [cotizacion, formData, goToStep, resetWizard, validateStep]);

        const handlePayment = useCallback(
                async (gateway) => {
                        if (!latestReservation?.precio) {
                                alert("Primero necesitamos confirmar el valor del viaje.");
                                return;
                        }
                        const amount = Math.round(latestReservation.precio * 0.4);
                        const description = `Abono reserva para ${latestReservation.destino} (${latestReservation.vehiculo})`;
                        const apiUrl =
                                import.meta.env.VITE_API_URL ||
                                "https://transportes-araucaria.onrender.com";

                        try {
                                const response = await fetch(`${apiUrl}/create-payment`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ gateway, amount, description }),
                                });
                                const data = await response.json();
                                if (data.url) {
                                        window.open(data.url, "_blank");
                                } else {
                                        throw new Error("No se pudo generar el enlace de pago.");
                                }
                        } catch (error) {
                                console.error("Error al crear el pago", error);
                                alert(
                                        "Hubo un problema al generar el enlace de pago. Por favor, intenta de nuevo."
                                );
                        }
                },
                [latestReservation]
        );

        const handleCloseAlert = useCallback(() => {
                setShowConfirmationAlert(false);
                setLatestReservation(null);
        }, []);

        const contextValue = useMemo(
                () => ({
                        startWizard,
                        closeWizard,
                        isOpen: open,
                        currentStep,
                        hasProgress,
                        resetWizard,
                        formData,
                        cotizacion,
                        steps,
                }),
                [
                        startWizard,
                        closeWizard,
                        open,
                        currentStep,
                        hasProgress,
                        resetWizard,
                        formData,
                        cotizacion,
                ]
        );

        return (
                <ReservaWizardContext.Provider value={contextValue}>
                        {children}

                        <Dialog open={open} onOpenChange={setOpen}>
                                <DialogContent className="sm:max-w-3xl lg:max-w-4xl p-0 overflow-hidden">
                                        <div className="flex flex-col max-h-[85vh]">
                                                <div className="border-b bg-muted/60 px-6 py-5">
                                                        <DialogHeader>
                                                                <p className="text-sm font-medium text-primary uppercase tracking-wide">
                                                                        Paso {currentStep + 1} de {steps.length}
                                                                </p>
                                                                <DialogTitle className="text-2xl text-foreground">
                                                                        {steps[currentStep].title}
                                                                </DialogTitle>
                                                                <p className="text-sm text-muted-foreground">
                                                                        {steps[currentStep].description}
                                                                </p>
                                                        </DialogHeader>
                                                        <div className="mt-4">
                                                                <Progress value={progressValue} />
                                                        </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto px-6 py-6">
                                                        {renderStepContent()}
                                                </div>
                                                <div className="border-t bg-background px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                                <div className="flex items-center gap-1">
                                                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                                                        Progreso guardado automáticamente
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                        <Luggage className="h-4 w-4 text-primary" />
                                                                        Puedes añadir equipaje y paradas más adelante
                                                                </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                                {currentStep > 0 && (
                                                                        <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                onClick={previousStep}
                                                                        >
                                                                                Anterior
                                                                        </Button>
                                                                )}
                                                                {currentStep < steps.length - 1 && (
                                                                        <Button type="button" onClick={nextStep}>
                                                                                Continuar
                                                                        </Button>
                                                                )}
                                                                {currentStep === steps.length - 1 && (
                                                                        <Button
                                                                                type="button"
                                                                                onClick={handleSubmit}
                                                                                disabled={isSubmitting}
                                                                        >
                                                                                {isSubmitting ? (
                                                                                        <>
                                                                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                                                                Confirmando...
                                                                                        </>
                                                                                ) : (
                                                                                        "Confirmar reserva"
                                                                                )}
                                                                        </Button>
                                                                )}
                                                        </div>
                                                </div>
                                        </div>
                                </DialogContent>
                        </Dialog>

                        <AlertDialog
                                open={showConfirmationAlert}
                                onOpenChange={setShowConfirmationAlert}
                        >
                                <AlertDialogContent className="sm:max-w-[520px] md:max-w-[720px]">
                                        <AlertDialogHeader>
                                                <AlertDialogTitle className="text-2xl">
                                                        ¡Gracias, {latestReservation?.nombre || "viajero"}!
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="space-y-4 pt-2">
                                                        <p>
                                                                Hemos recibido tu solicitud y enviado una copia a tu correo.
                                                                Aquí tienes el resumen de tu reserva:
                                                        </p>
                                                        {latestReservation && (
                                                                <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                                                                        <div className="flex justify-between">
                                                                                <span className="text-muted-foreground">Destino:</span>
                                                                                <span className="font-semibold text-foreground">
                                                                                        {latestReservation.destino || "Por confirmar"}
                                                                                </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                                <span className="text-muted-foreground">Fecha:</span>
                                                                                <span className="font-semibold text-foreground">
                                                                                        {latestReservation.fecha} {latestReservation.hora}
                                                                                </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                                <span className="text-muted-foreground">Pasajeros:</span>
                                                                                <span className="font-semibold text-foreground">
                                                                                        {latestReservation.pasajeros}
                                                                                </span>
                                                                        </div>
                                                                        {latestReservation.breakdown && (
                                                                                <>
                                                                                        <div className="flex justify-between">
                                                                                                <span className="text-muted-foreground">Valor total:</span>
                                                                                                <span className="font-semibold text-foreground">
                                                                                                        {new Intl.NumberFormat("es-CL", {
                                                                                                                style: "currency",
                                                                                                                currency: "CLP",
                                                                                                        }).format(latestReservation.precio || 0)}
                                                                                                </span>
                                                                                        </div>
                                                                                        <div className="flex justify-between font-bold text-primary">
                                                                                                <span>Abono (40%):</span>
                                                                                                <span>
                                                                                                        {new Intl.NumberFormat("es-CL", {
                                                                                                                style: "currency",
                                                                                                                currency: "CLP",
                                                                                                        }).format(latestReservation.abono)}
                                                                                                </span>
                                                                                        </div>
                                                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                                                                <span>Saldo al conductor:</span>
                                                                                                <span>
                                                                                                        {new Intl.NumberFormat("es-CL", {
                                                                                                                style: "currency",
                                                                                                                currency: "CLP",
                                                                                                        }).format(latestReservation.saldoPendiente)}
                                                                                                </span>
                                                                                        </div>
                                                                                        {latestReservation.codigoPromocionalAplicado && (
                                                                                                <div className="flex justify-between text-xs text-green-600">
                                                                                                        <span>Cupón aplicado:</span>
                                                                                                        <span>
                                                                                                                {latestReservation.codigoPromocionalAplicado}
                                                                                                                {latestReservation.promoDescripcion
                                                                                                                        ? ` (${latestReservation.promoDescripcion})`
                                                                                                                        : ""}
                                                                                                        </span>
                                                                                                </div>
                                                                                        )}
                                                                                </>
                                                                        )}
                                                                </div>
                                                        )}
                                                        <div className="text-xs text-center pt-2 text-muted-foreground">
                                                                Recuerda que con cada viaje acumulas beneficios en nuestro
                                                                <strong> Club Araucanía</strong>. ¡Tu 3er viaje tiene un 15% de
                                                                descuento!
                                                        </div>
                                                </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flex-col-reverse md:flex-row md:justify-end md:gap-2">
                                                <AlertDialogCancel onClick={handleCloseAlert}>
                                                        Cerrar
                                                </AlertDialogCancel>
                                                {latestReservation && (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                                                                <AlertDialogAction asChild className="w-full">
                                                                        <a
                                                                                href={latestReservation.whatsappUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="w-full !whitespace-normal break-words leading-tight text-center bg-green-500 hover:bg-green-600"
                                                                        >
                                                                                Confirmar por WhatsApp
                                                                        </a>
                                                                </AlertDialogAction>
                                                                {latestReservation.precio && (
                                                                        <>
                                                                                <Button
                                                                                        onClick={() => handlePayment("flow")}
                                                                                        className="w-full !whitespace-normal break-words leading-tight text-center"
                                                                                >
                                                                                        Abono con Flow
                                                                                </Button>
                                                                                <Button
                                                                                        onClick={() => handlePayment("mercadopago")}
                                                                                        className="w-full !whitespace-normal break-words leading-tight text-center"
                                                                                >
                                                                                        Abono con Mercado Pago
                                                                                </Button>
                                                                        </>
                                                                )}
                                                        </div>
                                                )}
                                        </AlertDialogFooter>
                                </AlertDialogContent>
                        </AlertDialog>
                </ReservaWizardContext.Provider>
        );
}

export default ReservaWizard;
