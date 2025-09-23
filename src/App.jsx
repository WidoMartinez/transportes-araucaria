import "./App.css";
import { useState, useEffect, useMemo } from "react";

// Componentes de la interfaz de usuario y AlertDialog
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { Button } from "./components/ui/button";

// Importar nuevos componentes de sección
import Header from "./components/Header";
import Hero from "./components/Hero";
import Servicios from "./components/Servicios";
import Destinos from "./components/Destinos";
import Tours from "./components/Tours";
import Destacados from "./components/Destacados";
import PorQueElegirnos from "./components/PorQueElegirnos";
import Testimonios from "./components/Testimonios";
import Contacto from "./components/Contacto";
import Footer from "./components/Footer";
import Fidelizacion from "./components/Fidelizacion";

// Importar imágenes
import { destinos as destinosConfig, destacadosData } from "./lib/data";
import {
        calcularCotizacion,
        obtenerDesgloseTarifa,
        formatoMonedaCLP,
} from "./lib/pricing";
import ReservaWizard from "./components/ReservaWizard";

// --- DATOS Y LÓGICA ---

const destinos = destinosConfig;

const ONLINE_DISCOUNT_RATE = Number(import.meta.env.VITE_ONLINE_DISCOUNT ?? 0.1);
const TAX_RATE = Number(import.meta.env.VITE_TAX_RATE ?? 0.19);
const DEFAULT_DEPOSIT_RATE = Number(import.meta.env.VITE_DEPOSIT_RATE ?? 0.4);

function App() {
        const [formData, setFormData] = useState({
                nombre: "",
                telefono: "",
                email: "",
                origen: "Aeropuerto La Araucanía",
                destino: "",
                otroDestino: "",
                fecha: "",
                hora: "",
                pasajeros: "1",
                mensaje: "",
        });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [showConfirmationAlert, setShowConfirmationAlert] = useState(false);
        const [phoneError, setPhoneError] = useState("");
        const [reservationData, setReservationData] = useState(null);

	const cotizacion = useMemo(() => {
		const destinoSeleccionado = destinos.find(
			(d) => d.nombre === formData.destino
		);
		return calcularCotizacion(destinoSeleccionado, formData.pasajeros);
	}, [formData.destino, formData.pasajeros]);

	const validarTelefono = (telefono) => {
		const regex = /^(\+?56)?(\s?9)\s?(\d{4})\s?(\d{4})$/;
		return regex.test(telefono);
	};

	const validarHorarioReserva = () => {
		const destinoSeleccionado = destinos.find(
			(d) => d.nombre === formData.destino
		);
		if (!destinoSeleccionado || !formData.fecha || !formData.hora) {
			return {
				esValido: false,
				mensaje: "Por favor, completa la fecha y hora.",
			};
		}

		const ahora = new Date();
		const fechaReserva = new Date(`${formData.fecha}T${formData.hora}`);
		const horasDeDiferencia = (fechaReserva - ahora) / (1000 * 60 * 60);

		const { minHorasAnticipacion } = destinoSeleccionado;

		if (horasDeDiferencia < minHorasAnticipacion) {
			return {
				esValido: false,
				mensaje: `Para ${destinoSeleccionado.nombre}, por favor reserva con al menos ${minHorasAnticipacion} horas de anticipación.`,
			};
		}

		return { esValido: true, mensaje: "" };
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		if (name === "telefono") {
			setPhoneError("");
		}
	};

	useEffect(() => {
		const destinoSeleccionado = destinos.find(
			(d) => d.nombre === formData.destino
		);
		if (
			destinoSeleccionado &&
			parseInt(formData.pasajeros) > destinoSeleccionado.maxPasajeros
		) {
			setFormData((prev) => ({ ...prev, pasajeros: "1" }));
		}
	}, [formData.destino, formData.pasajeros]);

        const resetForm = () => {
                setFormData({
                        nombre: "",
                        telefono: "",
                        email: "",
                        origen: "Aeropuerto La Araucanía",
                        destino: "",
                        otroDestino: "",
                        fecha: "",
                        hora: "",
                        pasajeros: "1",
                        mensaje: "",
                });
        };

        const handleCloseAlert = () => {
                setShowConfirmationAlert(false);
                setReservationData(null);
                resetForm();
        };

        const sendReservation = async (payload) => {
                const apiUrl =
                        import.meta.env.VITE_API_URL ||
                        "https://transportes-araucaria.onrender.com";

                const response = await fetch(`${apiUrl}/send-email`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                });

                const result = await response.json().catch(() => ({ message: "" }));

                if (!response.ok) {
                        throw new Error(result.message || "Error en el servidor.");
                }

                setReservationData(payload);
                setShowConfirmationAlert(true);

                if (typeof window !== "undefined" && typeof window.gtag === "function") {
                        window.gtag("event", "conversion", {
                                send_to: `AW-17529712870/8GVlCLP-05MbEObh6KZB`,
                        });
                }

                return result;
        };

        const handleSubmit = async (e) => {
                e.preventDefault();

                if (!validarTelefono(formData.telefono)) {
                        setPhoneError(
                                "Por favor, introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
			);
			return;
		}
		setPhoneError("");

		const validacion = validarHorarioReserva();
		if (!validacion.esValido && formData.destino !== "Otro") {
			alert(validacion.mensaje);
			return;
		}

                if (isSubmitting) return;
                setIsSubmitting(true);

                const source = e.target.querySelector('input[name="nombre"]')
                        ? "Formulario de Contacto - Transportes Araucaria"
                        : "Formulario Rápido (Hero)";

                const destinoFinal =
                        formData.destino === "Otro" ? formData.otroDestino : formData.destino;

                const pricingBreakdown = obtenerDesgloseTarifa({
                        baseFare: cotizacion.precio || 0,
                        extrasTotal: 0,
                        onlineDiscountRate: 0,
                        coupon: null,
                        clubBenefit: null,
                        taxRate: TAX_RATE,
                });

                const dataToSend = {
                        ...formData,
                        destino: destinoFinal,
                        precio: cotizacion.precio,
                        vehiculo: cotizacion.vehiculo,
                        source,
                        extras: [],
                        coupon: null,
                        clubBenefit: null,
                        pricing: pricingBreakdown,
                        payment: null,
                };

                if (!dataToSend.nombre) {
                        dataToSend.nombre = "Cliente Potencial (Cotización Rápida)";
                }

                try {
                        await sendReservation(dataToSend);
                } catch (error) {
                        console.error("Error al enviar el formulario:", error);
                        alert(`Error: ${error.message}`);
                } finally {
                        setIsSubmitting(false);
		}
	};

        const resumenReserva = useMemo(() => {
                if (reservationData) {
                        return reservationData;
                }

                const destinoFinal =
                        formData.destino === "Otro" ? formData.otroDestino : formData.destino;

                return {
                        ...formData,
                        destino: destinoFinal,
                        precio: cotizacion.precio,
                        vehiculo: cotizacion.vehiculo,
                        extras: [],
                        coupon: null,
                        clubBenefit: null,
                        pricing: obtenerDesgloseTarifa({
                                baseFare: cotizacion.precio || 0,
                                extrasTotal: 0,
                                onlineDiscountRate: 0,
                                coupon: null,
                                clubBenefit: null,
                                taxRate: TAX_RATE,
                        }),
                        payment: null,
                };
        }, [reservationData, formData, cotizacion.precio, cotizacion.vehiculo]);

        const whatsappUrl = useMemo(() => {
                const destinoFinal = resumenReserva?.destino || "";
                const fecha = resumenReserva?.fecha || formData.fecha;
                const hora = resumenReserva?.hora || formData.hora;
                const nombre = resumenReserva?.nombre || formData.nombre;

                const message = `Hola, acabo de cotizar desde el sitio web. Mi nombre es ${nombre} y quisiera confirmar mi reserva a ${destinoFinal} para el día ${fecha} a las ${hora}.`;
                return `https://wa.me/56936643540?text=${encodeURIComponent(message)}`;
        }, [formData.fecha, formData.hora, formData.nombre, resumenReserva]);

	const maxPasajeros = useMemo(() => {
		const destino = destinos.find((d) => d.nombre === formData.destino);
		return destino?.maxPasajeros || 7;
	}, [formData.destino]);

        const minDateTime = useMemo(() => {
                const destino = destinos.find((d) => d.nombre === formData.destino);
                const horasAnticipacion = destino?.minHorasAnticipacion || 5;

                const fechaMinima = new Date();
                fechaMinima.setHours(fechaMinima.getHours() + horasAnticipacion);

		const anio = fechaMinima.getFullYear();
		const mes = String(fechaMinima.getMonth() + 1).padStart(2, "0");
		const dia = String(fechaMinima.getDate()).padStart(2, "0");

		return `${anio}-${mes}-${dia}`;
	}, [formData.destino]);

        const pricing = resumenReserva?.pricing || {
                baseFare: 0,
                extrasTotal: 0,
                onlineDiscountRate: 0,
                onlineDiscountValue: 0,
                couponValue: 0,
                clubBenefitValue: 0,
                taxes: 0,
                total: 0,
                totalDiscounts: 0,
        };
        const extrasSeleccionados = resumenReserva?.extras || [];
        const couponInfo = resumenReserva?.coupon;
        const clubBenefitInfo = resumenReserva?.clubBenefit;
        const paymentInfo = resumenReserva?.payment;

	return (
		<div className="min-h-screen bg-background text-foreground">
			<AlertDialog
				open={showConfirmationAlert}
				onOpenChange={setShowConfirmationAlert}
			>
				{/* ⬇️ AUMENTAMOS ANCHO EN PANTALLAS MEDIANAS */}
                                <AlertDialogContent className="sm:max-w-[520px] md:max-w-[720px]">
                                        <AlertDialogHeader>
                                                <AlertDialogTitle className="text-2xl">
                                                        ¡Gracias, {resumenReserva?.nombre || "viajero"}!
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="space-y-4 pt-2 text-sm">
                                                        <p>
                                                                Hemos recibido tu solicitud y enviado un detalle a tu correo.
                                                                Aquí tienes el resumen de tu reserva:
                                                        </p>

                                                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                                                <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Destino:</span>
                                                                        <span className="font-semibold text-foreground">
                                                                                {resumenReserva?.destino || "Por confirmar"}
                                                                        </span>
                                                                </div>
                                                                {resumenReserva?.vehiculo && (
                                                                        <div className="flex justify-between">
                                                                                <span className="text-muted-foreground">
                                                                                        Vehículo sugerido:
                                                                                </span>
                                                                                <span className="font-semibold text-foreground">
                                                                                        {resumenReserva.vehiculo}
                                                                                </span>
                                                                        </div>
                                                                )}
                                                                <div className="pt-3 border-t border-border/60 space-y-2">
                                                                        <div className="flex justify-between">
                                                                                <span>Tarifa base</span>
                                                                                <span>{formatoMonedaCLP(pricing.baseFare)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                                <span>Extras</span>
                                                                                <span>{formatoMonedaCLP(pricing.extrasTotal)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-emerald-700">
                                                                                <span>Descuentos aplicados</span>
                                                                                <span>
                                                                                        -{formatoMonedaCLP(pricing.totalDiscounts)}
                                                                                </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                                <span>Impuestos</span>
                                                                                <span>{formatoMonedaCLP(pricing.taxes)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between font-bold text-primary">
                                                                                <span>Total confirmado</span>
                                                                                <span>{formatoMonedaCLP(pricing.total)}</span>
                                                                        </div>
                                                                </div>
                                                        </div>

                                                        {extrasSeleccionados.length > 0 && (
                                                                <div className="bg-muted/30 border border-muted rounded-lg p-4 space-y-2">
                                                                        <h4 className="font-semibold text-foreground text-base">
                                                                                Extras incluidos
                                                                        </h4>
                                                                        <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                                                                                {extrasSeleccionados.map((extra) => (
                                                                                        <li key={extra.id || extra.nombre || extra.name}>
                                                                                                {extra.label || extra.name || extra.descripcion} (
                                                                                                {formatoMonedaCLP(extra.amount || extra.precio || 0)})
                                                                                        </li>
                                                                                ))}
                                                                        </ul>
                                                                </div>
                                                        )}

                                                        {(pricing.onlineDiscountValue > 0 ||
                                                                pricing.couponValue > 0 ||
                                                                pricing.clubBenefitValue > 0) && (
                                                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                                                                        <h4 className="font-semibold text-emerald-900 text-base">
                                                                                Beneficios y descuentos
                                                                        </h4>
                                                                        <ul className="list-disc pl-4 text-emerald-800 space-y-1">
                                                                                {pricing.onlineDiscountValue > 0 && (
                                                                                        <li>
                                                                                                Descuento online {Math.round((pricing.onlineDiscountRate || 0) * 100)}%: -
                                                                                                {" "}
                                                                                                {formatoMonedaCLP(pricing.onlineDiscountValue)}
                                                                                        </li>
                                                                                )}
                                                                                {pricing.couponValue > 0 && (
                                                                                        <li>
                                                                                                Cupón {couponInfo?.code?.toUpperCase() || "aplicado"}
                                                                                                {couponInfo?.description
                                                                                                        ? ` (${couponInfo.description})`
                                                                                                        : ""}
                                                                                                : - {formatoMonedaCLP(pricing.couponValue)}
                                                                                        </li>
                                                                                )}
                                                                                {pricing.clubBenefitValue > 0 && (
                                                                                        <li>
                                                                                                Club Araucanía - {clubBenefitInfo?.label || "Beneficio"}: -
                                                                                                {" "}
                                                                                                {formatoMonedaCLP(pricing.clubBenefitValue)}
                                                                                        </li>
                                                                                )}
                                                                        </ul>
                                                                </div>
                                                        )}

                                                        {paymentInfo?.status === "succeeded" ? (
                                                                <div className="rounded-lg border border-emerald-300 bg-emerald-100 p-4 space-y-2">
                                                                        <h4 className="font-semibold text-emerald-900 text-base">
                                                                                Pago confirmado en línea
                                                                        </h4>
                                                                        <p className="text-emerald-900">
                                                                                Método: {paymentInfo.methodLabel || paymentInfo.method}
                                                                        </p>
                                                                        <p className="text-emerald-900">
                                                                                Monto acreditado: {formatoMonedaCLP(paymentInfo.amount)}
                                                                        </p>
                                                                        {paymentInfo.mode === "deposit" && (
                                                                                <p className="text-emerald-900">
                                                                                        Saldo pendiente: {formatoMonedaCLP(paymentInfo.balance)}
                                                                                </p>
                                                                        )}
                                                                        {paymentInfo.receiptUrl && (
                                                                                <p>
                                                                                        <a
                                                                                                href={paymentInfo.receiptUrl}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="text-primary underline font-semibold"
                                                                                        >
                                                                                                Ver comprobante de pago
                                                                                        </a>
                                                                                </p>
                                                                        )}
                                                                </div>
                                                        ) : (
                                                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                                                                        <h4 className="font-semibold text-amber-900 text-base">
                                                                                Próximo paso
                                                                        </h4>
                                                                        <p className="text-amber-900">
                                                                                Puedes completar tu abono seguro desde el asistente digital
                                                                                o coordinar con nuestro equipo por WhatsApp.
                                                                        </p>
                                                                </div>
                                                        )}

                                                        <div className="text-xs text-center pt-2 text-muted-foreground">
                                                                Recuerda que con cada viaje acumulas beneficios en nuestro{" "}
                                                                <strong>Club Araucanía</strong>. ¡Tu 3er viaje tiene un 15% de
                                                                descuento!
                                                        </div>
                                                </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter className="flex-col-reverse md:flex-row md:justify-end md:gap-2">
                                                <AlertDialogCancel onClick={handleCloseAlert}>
                                                        Cerrar
                                                </AlertDialogCancel>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                                                        <AlertDialogAction asChild className="w-full">
                                                                <a
                                                                        href={whatsappUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="w-full !whitespace-normal break-words leading-tight text-center bg-green-500 hover:bg-green-600"
                                                                >
                                                                        Confirmar por WhatsApp
                                                                </a>
                                                        </AlertDialogAction>

                                                        {!paymentInfo && (
                                                                <Button asChild className="w-full !whitespace-normal break-words leading-tight text-center">
                                                                        <a href="#reserva-digital">Abrir asistente de pago</a>
                                                                </Button>
                                                        )}

                                                        {paymentInfo?.receiptUrl && (
                                                                <Button
                                                                        asChild
                                                                        variant="outline"
                                                                        className="w-full !whitespace-normal break-words leading-tight text-center"
                                                                >
                                                                        <a
                                                                                href={paymentInfo.receiptUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                        >
                                                                                Ver comprobante
                                                                        </a>
                                                                </Button>
                                                        )}
                                                </div>
                                        </AlertDialogFooter>
                                </AlertDialogContent>
			</AlertDialog>

			<Header />

                        <main>
                                <Hero
                                        formData={formData}
                                        handleInputChange={handleInputChange}
                                        handleSubmit={handleSubmit}
                                        cotizacion={cotizacion}
                                        destinos={destinos}
                                        maxPasajeros={maxPasajeros}
                                        minDateTime={minDateTime}
                                        phoneError={phoneError}
                                        isSubmitting={isSubmitting}
                                />
                                <ReservaWizard
                                        destinos={destinos}
                                        onReservationConfirmed={sendReservation}
                                        onlineDiscountRate={ONLINE_DISCOUNT_RATE}
                                        taxRate={TAX_RATE}
                                        defaultDepositRate={DEFAULT_DEPOSIT_RATE}
                                />
                                <Servicios />
                                <Destinos destinos={destinos} />

                                <Destacados destinos={destacadosData} />
				<Fidelizacion />
				<PorQueElegirnos />
				<Testimonios />
				<Contacto
					formData={formData}
					handleInputChange={handleInputChange}
					handleSubmit={handleSubmit}
					cotizacion={cotizacion}
					destinos={destinos}
					maxPasajeros={maxPasajeros}
					minDateTime={minDateTime}
					phoneError={phoneError}
					isSubmitting={isSubmitting}
				/>
			</main>

			<Footer />
		</div>
	);
}

export default App;
