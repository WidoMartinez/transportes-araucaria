import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import {
	Baby,
	LoaderCircle,
	ArrowLeft,
	MapPin,
	Calendar,
	Clock,
	Users,
	CheckCircle2,
	ShieldCheck,
} from "lucide-react";
import { getBackendUrl } from "../lib/backend";
import { motion, AnimatePresence } from "framer-motion";
import SelectorPasarela from "./SelectorPasarela";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarPicker } from "./ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { TERMINOS_CONDICIONES, POLITICA_PRIVACIDAD } from "../data/legal";

const AEROPUERTO_LABEL = "Aeropuerto La Araucanía";

const TIME_GROUP_LABELS = {
	manana: "Mañana",
	tarde: "Tarde",
	noche: "Noche",
};

const MotionDiv = motion.div;
const MotionH1 = motion.h1;
const MotionP = motion.p;

// Función para generar opciones de hora en intervalos de 15 minutos (6:00 AM - 10:00 PM)
const generateTimeOptions = () => {
	const options = [];
	for (let hour = 6; hour <= 22; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			if (hour === 22 && minute > 0) break;
			const timeString = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
			options.push({ value: timeString, label: timeString });
		}
	}
	return options;
};

const getTimeGroup = (timeValue) => {
	const hour = Number.parseInt(String(timeValue).split(":")[0], 10);
	if (hour < 12) return "manana";
	if (hour < 18) return "tarde";
	return "noche";
};

function LegalDialog({ triggerLabel, title, description, sections }) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<button
					type="button"
					className="inline-flex items-center rounded-full border border-[#8C5E42]/20 bg-[#8C5E42]/5 px-3 py-1 text-[11px] font-semibold text-[#8C5E42] transition-colors hover:bg-[#8C5E42]/10"
				>
					{triggerLabel}
				</button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl rounded-4xl border border-slate-200 bg-white p-0 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
				<div className="border-b border-slate-100 px-6 py-5 md:px-8">
					<DialogHeader className="text-left">
						<DialogTitle className="text-2xl font-bold text-slate-900">
							{title}
						</DialogTitle>
						<DialogDescription className="text-sm leading-6 text-slate-500">
							{description}
						</DialogDescription>
					</DialogHeader>
				</div>
				<ScrollArea className="max-h-[65vh] px-6 py-5 md:px-8">
					<div className="space-y-4 pb-2">
						{sections.map((section) => (
							<div key={section.titulo} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
								<h4 className="text-sm font-bold text-slate-900">{section.titulo}</h4>
								{Array.isArray(section.contenido) ? (
									<ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
										{section.contenido.map((item) => (
											<li key={item}>• {item}</li>
										))}
									</ul>
								) : (
									<p className="mt-3 text-sm leading-6 text-slate-600">
										{section.contenido}
									</p>
								)}
							</div>
						))}
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}

function HeroSelectField({
	label,
	icon,
	value,
	placeholder,
	description,
	onValueChange,
	items,
	groups,
	triggerClassName,
}) {
	const IconComponent = icon;
	const normalizedValue = value === "" || value === null || value === undefined ? undefined : String(value);

	return (
		<div className="space-y-2">
			<Label className="text-[10px] uppercase tracking-widest text-[#8C5E42] font-bold">{label}</Label>
			<Select value={normalizedValue} onValueChange={onValueChange}>
				<SelectTrigger
					className={cn(
						"w-full min-h-11 rounded-xl border-slate-200 bg-slate-50/90 px-3 py-2 text-left shadow-none transition-all hover:border-slate-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-[#8C5E42]/20",
						triggerClassName,
					)}
				>
					<div className="flex min-w-0 items-center gap-2">
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#8C5E42] shadow-sm">
							<IconComponent className="h-4 w-4" />
						</span>
						<div className="min-w-0 flex-1 truncate text-sm">
							<SelectValue placeholder={placeholder} />
						</div>
					</div>
				</SelectTrigger>
				<SelectContent className="rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-[0_14px_40px_rgba(15,23,42,0.14)] backdrop-blur-sm">
					{groups
						? groups.map((group, index) => (
							<SelectGroup key={group.label}>
								<SelectLabel>{group.label}</SelectLabel>
								{group.items.map((item) => (
									<SelectItem key={item.value} value={item.value}>
										{item.label}
									</SelectItem>
								))}
								{index < groups.length - 1 ? <div className="my-1 h-px bg-slate-100" /> : null}
							</SelectGroup>
						))
						: items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
				</SelectContent>
			</Select>
			{description ? <p className="px-1 text-xs leading-5 text-slate-500">{description}</p> : null}
		</div>
	);
}

function HeroExpress({
	formData,
	handleInputChange,
	setFormData,
	origenes,
	destinos,
	maxPasajeros,
	minDateTime,
	isSubmitting,
	pricing,
	handlePayment,
	loadingGateway,
	onSubmitWizard,
	validarTelefono,
	configSillas,
}) {
	const [currentStep, setCurrentStep] = useState(0);
	const [stepError, setStepError] = useState("");
	const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
	const [pasarela, setPasarela] = useState("flow");
	const [paymentConsent, setPaymentConsent] = useState(false);

	// Estado para el DatePicker de fecha
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [returnDatePickerOpen, setReturnDatePickerOpen] = useState(false);
	const timeOptions = useMemo(() => generateTimeOptions(), []);
	const passengerCount = Number.parseInt(formData.pasajeros, 10) || 1;
	const groupedTimeOptions = useMemo(() => {
		const groups = { manana: [], tarde: [], noche: [] };
		timeOptions.forEach((item) => {
			groups[getTimeGroup(item.value)].push(item);
		});
		return Object.entries(groups)
			.filter(([, items]) => items.length > 0)
			.map(([key, items]) => ({ label: TIME_GROUP_LABELS[key], items }));
	}, [timeOptions]);
	const hasChildSeatOption = Boolean(configSillas?.habilitado);
	const childSeatUnitPrice = Number(configSillas?.precioPorSilla) || 0;
	const childSeatLimit = useMemo(() => {
		const configuredLimit = Number(configSillas?.maxSillas) || 1;
		return Math.max(1, Math.min(configuredLimit, passengerCount));
	}, [configSillas?.maxSillas, passengerCount]);
	const childSeatOptions = useMemo(
		() =>
			Array.from({ length: childSeatLimit }, (_, index) => ({
				value: String(index + 1),
				label: index === 0 ? "1 silla" : `${index + 1} sillas`,
			})),
		[childSeatLimit],
	);
	const childSeatSummary = childSeatUnitPrice > 0
		? `${formatCurrency(childSeatUnitPrice)} por silla`
		: "Sin costo adicional";
	const updateField = (name, value) => {
		handleInputChange({ target: { name, value } });
	};

	useEffect(() => {
		if (!hasChildSeatOption || !formData.sillaInfantil || typeof setFormData !== "function") {
			return;
		}

		const currentCount = Number.parseInt(formData.cantidadSillasInfantiles, 10) || 1;
		const normalizedCount = Math.max(1, Math.min(childSeatLimit, currentCount));

		if (currentCount !== normalizedCount) {
			setFormData((prev) => ({
				...prev,
				cantidadSillasInfantiles: normalizedCount,
			}));
		}
	}, [childSeatLimit, formData.cantidadSillasInfantiles, formData.sillaInfantil, hasChildSeatOption, setFormData]);

	// Calcula la fecha mínima como objeto Date para el Calendar
	const fechaMinDate = useMemo(() => {
		if (!minDateTime) return new Date();
		const d = new Date(`${minDateTime}T12:00:00`);
		d.setHours(0, 0, 0, 0);
		return d;
	}, [minDateTime]);

	// Convierte string YYYY-MM-DD → Date para el Calendar
	const fechaSeleccionada = useMemo(() => {
		if (!formData.fecha) return undefined;
		return new Date(`${formData.fecha}T12:00:00`);
	}, [formData.fecha]);
	const fechaRegresoSeleccionada = useMemo(() => {
		if (!formData.fechaRegreso) return undefined;
		return new Date(`${formData.fechaRegreso}T12:00:00`);
	}, [formData.fechaRegreso]);

	// Formatea un Date a YYYY-MM-DD y llama a handleInputChange
	const handleDateSelect = (date, field) => {
		if (!date) return;
		const yyyy = date.getFullYear();
		const mm = String(date.getMonth() + 1).padStart(2, "0");
		const dd = String(date.getDate()).padStart(2, "0");
		updateField(field, `${yyyy}-${mm}-${dd}`);
		if (field === "fecha") setDatePickerOpen(false);
		if (field === "fechaRegreso") setReturnDatePickerOpen(false);
	};

	// Formatea fecha para mostrar en el botón trigger
	const formatFechaDisplay = (dateStr) => {
		if (!dateStr) return null;
		const date = new Date(`${dateStr}T12:00:00`);
		return date.toLocaleDateString("es-CL", {
			weekday: "short",
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	const handleChildSeatToggle = (checked) => {
		if (typeof setFormData === "function") {
			setFormData((prev) => ({
				...prev,
				sillaInfantil: checked,
				cantidadSillasInfantiles: checked
					? Math.max(1, Number.parseInt(prev.cantidadSillasInfantiles, 10) || 1)
					: 0,
			}));
			return;
		}

		updateField("sillaInfantil", checked);
		updateField("cantidadSillasInfantiles", checked ? 1 : 0);
	};

	// Lógica de navegación del formulario
	const handleStepOneNext = async () => {
		setStepError("");

		if (!formData.origen || !formData.destino || !formData.fecha || !formData.hora) {
			setStepError("Por favor completa todos los campos del viaje.");
			return;
		}

		if (formData.idaVuelta && !formData.fechaRegreso) {
			setStepError("Debes seleccionar una fecha para el regreso.");
			return;
		}

		setVerificandoDisponibilidad(true);
		try {
			const response = await fetch(`${getBackendUrl()}/api/disponibilidad/verificar`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					origen: formData.origen,
					destino: formData.destino,
					fecha: formData.fecha,
					hora: formData.hora,
					pasajeros: formData.pasajeros,
					idaVuelta: formData.idaVuelta,
				}),
			});
			const data = await response.json();

			if (data.disponible) {
				setCurrentStep(1);
			} else {
				setStepError(data.mensaje || "Lo sentimos, no hay disponibilidad para este horario/pasajeros.");
			}
		} catch {
			setStepError("Error al verificar disponibilidad. Reintenta.");
		} finally {
			setVerificandoDisponibilidad(false);
		}
	};

	const handleStepBack = () => {
		setCurrentStep(0);
		setStepError("");
	};

	// Maneja el pago: valida campos, crea la reserva y luego procesa el pago
	const handleProcesarPago = async (p, t) => {
		if (!paymentConsent) {
			setStepError("Debes aceptar los términos y condiciones para continuar.");
			return;
		}

		// Validar campos obligatorios del paso 2
		if (!formData.nombre?.trim()) {
			setStepError("Ingresa tu nombre completo.");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!formData.email?.trim() || !emailRegex.test(formData.email)) {
			setStepError("Ingresa un correo electrónico válido.");
			return;
		}

		if (!formData.telefono?.trim()) {
			setStepError("Ingresa tu número de teléfono de contacto.");
			return;
		}

		setStepError("");

		// Primero crear la reserva en el sistema
		const result = await onSubmitWizard();

		if (!result?.success) {
			setStepError(
				result?.message || "No se pudo crear la reserva. Intenta nuevamente."
			);
			return;
		}

		// Con la reserva creada, procesar el pago pasando los identificadores
		handlePayment(p, t, {
			reservaId: result.reservaId,
			codigoReserva: result.codigoReserva,
		});
	};

	return (
		<section id="inicio" className="relative min-h-screen scroll-mt-28 overflow-hidden bg-forest-600 bg-pattern-mesh md:scroll-mt-36">
			{/* Capa de patrón topográfico */}
			<div className="absolute inset-0 bg-pattern-topo pointer-events-none opacity-60" />

			{/* Decoraciones de fondo ambientales */}
			<div className="pointer-events-none absolute inset-0 select-none">
				<div className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-[#8C5E42]/10 blur-[120px] opacity-40" />
				<div className="absolute -left-32 bottom-0 h-[500px] w-[500px] rounded-full bg-forest-500/30 blur-[100px] opacity-50 transition-opacity duration-1000" />
			</div>

			{/* Grid principal */}
			<div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-28 md:pt-32 lg:grid-cols-[1fr_520px] lg:pt-36 xl:pt-40">

				{/* LADO IZQUIERDO: Branding de Marca */}
				<div className="flex flex-col justify-center py-12 lg:py-0">
					<MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex w-fit items-center gap-2 rounded-full border border-[#8C5E42]/30 bg-[#8C5E42]/12 px-4 py-1.5 text-xs font-semibold text-[#C4895E]">
						Aeropuerto Araucanía · Pucón · Villarrica
					</MotionDiv>

					<MotionH1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 font-serif text-[clamp(2.5rem,7vw,4.5rem)] font-medium leading-[1.1] text-white">
						Traslados <em className="not-italic text-[#C4895E]">privados</em>
						<br />
						desde la Región de La Araucanía.
					</MotionH1>

					<MotionP initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 max-w-md text-lg text-slate-300 leading-relaxed font-light">
						Tu puntualidad es nuestra prioridad. Coordinamos traslados exclusivos 
						con conductores locales en toda La Araucanía.
					</MotionP>

					<MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-12 flex flex-wrap gap-4">
						{["Disponible 24/7", "Conductores locales", "Confirmación rápida"].map(tag => (
							<div key={tag} className="flex items-center gap-2 text-sm text-slate-400">
								<CheckCircle2 className="h-4 w-4 text-[#8C5E42]" />
								{tag}
							</div>
						))}
					</MotionDiv>
				</div>

				{/* LADO DERECHO: Tarjeta de Reserva */}
				<div className="relative">
					<div className="absolute -inset-4 bg-[#8C5E42]/10 blur-[80px] rounded-[3rem] pointer-events-none" />

					<AnimatePresence mode="wait">
						{currentStep === 0 ? (
					<MotionDiv key="step0" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative bg-white p-6 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100">
						<div className="mb-5">
							<h2 className="text-xl font-bold text-slate-900 tracking-tight">Reserva tu viaje</h2>
							<p className="text-slate-500 text-sm">Cotización instantánea y pago 100% online</p>
						</div>

						<div className="space-y-3">
									<div className="grid grid-cols-1 gap-4">
										<HeroSelectField
											label="Origen"
											icon={MapPin}
											value={formData.origen}
											placeholder="Selecciona el punto de retiro"

											onValueChange={(value) => updateField("origen", value)}
											items={origenes.map((option) => ({ value: option, label: option }))}
										/>
										<HeroSelectField
											label="Destino"
											icon={MapPin}
											value={formData.destino}
											placeholder="Selecciona el destino"

											onValueChange={(value) => updateField("destino", value)}
											items={destinos.map((option) => ({ value: option, label: option }))}
										/>
									</div>



									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-1.5">
											<Label className="text-[10px] uppercase tracking-widest text-[#8C5E42] font-bold">Fecha</Label>
											<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
												<PopoverTrigger asChild>
													<button
														type="button"
														className="w-full min-h-11 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-left transition-all hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/20"
													>
														<div className="flex min-w-0 items-center gap-2">
															<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#8C5E42] shadow-sm">
																<Calendar className="h-4 w-4" />
															</span>
															{formData.fecha ? (
																<span className="capitalize text-sm font-medium text-slate-900 truncate">{formatFechaDisplay(formData.fecha)}</span>
															) : (
																<span className="text-sm text-slate-400 truncate">Seleccionar</span>
															)}
														</div>
													</button>
												</PopoverTrigger>
												<PopoverContent
													className="w-auto p-0 z-9999"
													align="start"
													side="top"
													sideOffset={8}
													avoidCollisions={true}
												>
													<CalendarPicker
														mode="single"
														selected={fechaSeleccionada}
														onSelect={(date) => handleDateSelect(date, "fecha")}
														disabled={(date) => date < fechaMinDate}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
										</div>
										<div className="space-y-1.5">
											<HeroSelectField
												label="Hora"
												icon={Clock}
												value={formData.hora}
												placeholder="Hora"
												onValueChange={(value) => updateField("hora", value)}
												groups={groupedTimeOptions}
											/>
										</div>
									</div>

									<HeroSelectField
										label="Pasajeros"
										icon={Users}
										value={formData.pasajeros}
										placeholder="Cantidad de pasajeros"

										onValueChange={(value) => updateField("pasajeros", value)}
										items={Array.from({ length: maxPasajeros }, (_, index) => ({
											value: String(index + 1),
											label: `${index + 1} ${index === 0 ? "pasajero" : "pasajeros"}`,
										}))}
									/>

									{hasChildSeatOption ? (
										<div className={cn(
											"rounded-[1.75rem] border p-4 transition-all",
											formData.sillaInfantil ? "border-[#8C5E42]/20 bg-[#8C5E42]/6" : "border-slate-200 bg-slate-50/80",
										)}>
											<div className="flex items-start justify-between gap-4">
												<div className="flex gap-3">
													<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8C5E42] shadow-sm">
														<Baby className="h-5 w-5" />
													</span>
													<div>
														<p className="text-sm font-bold text-slate-900">Sillas para niños</p>
														<p className="mt-1 text-xs leading-5 text-slate-500">
															{childSeatSummary}. Puedes solicitar hasta {childSeatLimit} {childSeatLimit === 1 ? "silla" : "sillas"} en esta reserva.
														</p>
													</div>
												</div>
												<Switch checked={Boolean(formData.sillaInfantil)} onCheckedChange={handleChildSeatToggle} />
											</div>

											{formData.sillaInfantil ? (
												<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
													<div className="rounded-2xl border border-white/80 bg-white/80 p-4">
														<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8C5E42]">Solicitud activa</p>
														<p className="mt-2 text-sm font-semibold text-slate-900">
															{Number.parseInt(formData.cantidadSillasInfantiles, 10) || 1} {Number.parseInt(formData.cantidadSillasInfantiles, 10) === 1 ? "silla solicitada" : "sillas solicitadas"}
														</p>
														<p className="mt-1 text-xs leading-5 text-slate-500">La cotización incorporará este extra automáticamente.</p>
													</div>
													<HeroSelectField
														label="Cantidad"
														icon={Baby}
														value={formData.cantidadSillasInfantiles || 1}
														placeholder="Cantidad"
														description="Cantidad de sillas a preparar"
														onValueChange={(value) => updateField("cantidadSillasInfantiles", Number.parseInt(value, 10))}
														items={childSeatOptions}
														triggerClassName="min-h-[54px]"
													/>
												</div>
											) : null}
										</div>
									) : null}

									<div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
										<div className="flex flex-col">
											<span className="text-sm font-bold text-slate-900">¿Necesitas regreso?</span>
											<span className="text-[10px] text-slate-400 font-medium">Descuento aplicado por ida y vuelta</span>
										</div>
										<Switch checked={formData.idaVuelta} onCheckedChange={(checked) => updateField("idaVuelta", checked)} />
									</div>

									{formData.idaVuelta ? (
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<div className="space-y-1.5">
												<Label className="text-[10px] uppercase tracking-widest text-[#8C5E42] font-bold">Fecha regreso</Label>
												<Popover open={returnDatePickerOpen} onOpenChange={setReturnDatePickerOpen}>
													<PopoverTrigger asChild>
														<button
															type="button"
															className="w-full min-h-11 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-left transition-all hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/20"
														>
															<div className="flex min-w-0 items-center gap-2">
																<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#8C5E42] shadow-sm">
																	<Calendar className="h-4 w-4" />
																</span>
															{formData.fechaRegreso ? (
																<span className="capitalize text-sm font-medium text-slate-900 truncate">{formatFechaDisplay(formData.fechaRegreso)}</span>
															) : (
																<span className="text-sm text-slate-400 truncate">Seleccionar</span>
															)}
															</div>
														</button>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0 z-9999" align="start" side="top" sideOffset={8} avoidCollisions>
														<CalendarPicker
															mode="single"
															selected={fechaRegresoSeleccionada}
															onSelect={(date) => handleDateSelect(date, "fechaRegreso")}
															disabled={(date) => date < (fechaSeleccionada || fechaMinDate)}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
											</div>
											<HeroSelectField
												label="Hora regreso"
												icon={Clock}
												value={formData.horaRegreso}
												placeholder="Opcional"
												onValueChange={(value) => updateField("horaRegreso", value)}
												groups={groupedTimeOptions}
											/>
										</div>
									) : null}

									{stepError && <p className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">⚠️ {stepError}</p>}

									<Button onClick={handleStepOneNext} disabled={verificandoDisponibilidad} className="w-full h-14 bg-forest-600 hover:bg-forest-700 text-white rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-[0.98]">
										{verificandoDisponibilidad ? <LoaderCircle className="h-5 w-5 animate-spin" /> : "Obtener Tarifa"}
									</Button>
								</div>
							</MotionDiv>
						) : (
							<MotionDiv key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="relative bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100">
								<div className="flex items-center gap-4 mb-8">
									<Button variant="ghost" size="icon" onClick={handleStepBack} className="rounded-full bg-slate-100 h-10 w-10">
										<ArrowLeft className="h-5 w-5" />
									</Button>
									<div>
										<h2 className="text-2xl font-bold text-slate-900">Tus datos</h2>
										<p className="text-slate-500 text-sm">Completa para finalizar la reserva</p>
									</div>
								</div>

								<div className="space-y-4">
									<div className="space-y-1.5">
										<Label className="text-[10px] uppercase tracking-widest text-[#8C5E42] font-bold">Nombre Completo</Label>
										<Input name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Tu nombre" className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
									</div>
									<div className="space-y-1.5">
										<Label className="text-[10px] uppercase tracking-widest text-[#8C5E42] font-bold">Correo Electrónico</Label>
										<Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="tu@email.com" className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
									</div>
									<div className="space-y-1.5">
										<Label className="text-[10px] uppercase tracking-widest text-[#8C5E42] font-bold">Teléfono (WhatsApp)</Label>
										<Input name="telefono" value={formData.telefono} onChange={handleInputChange} onBlur={(e) => validarTelefono(e.target.value)} placeholder="+56 9 ..." className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
									</div>

									<div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
										<div className="flex items-start gap-3">
											<Checkbox id="terms" checked={paymentConsent} onCheckedChange={(checked) => setPaymentConsent(Boolean(checked))} className="mt-1" />
											<div className="space-y-2">
												<label htmlFor="terms" className="block cursor-pointer text-xs font-medium leading-5 text-slate-700">
													He leído y acepto la documentación legal para procesar el pago.
												</label>
												<div className="flex flex-wrap gap-2">
													<LegalDialog
														triggerLabel="Términos y Condiciones"
														title="Términos y Condiciones"
														description="Revisa las condiciones del servicio antes de continuar con tu reserva."
														sections={TERMINOS_CONDICIONES}
													/>
													<LegalDialog
														triggerLabel="Política de Privacidad"
														title="Política de Privacidad"
														description="Aquí se explica cómo usamos y protegemos tus datos personales."
														sections={POLITICA_PRIVACIDAD}
													/>
												</div>
												<p className="text-[11px] leading-5 text-slate-400">Los documentos se abren en modales para que puedas revisarlos sin salir del flujo.</p>
											</div>
										</div>
									</div>

									{pricing && (
										<div className="space-y-4 pt-4 border-t border-slate-100">
											<SelectorPasarela pasarela={pasarela} onChange={setPasarela} />
											<Button onClick={() => handleProcesarPago(pasarela, "total")} disabled={!paymentConsent || isSubmitting || loadingGateway} className="w-full h-14 bg-[#8C5E42] hover:bg-[#9D6E52] text-white rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-[0.98]">
												{loadingGateway ? <LoaderCircle className="h-5 w-5 animate-spin" /> : "Pagar " + formatCurrency(pricing.totalConDescuento)}
											</Button>
											<p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
												<ShieldCheck className="h-3 w-3" /> Pago 100% encriptado y seguro
											</p>
										</div>
									)}
								</div>
							</MotionDiv>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Divisor de onda (Wave SVG) - Ajustado para eliminar línea negra y mejorar solapamiento */}
			<div className="absolute bottom-0 left-0 w-full overflow-hidden leading-0 transform rotate-180 pointer-events-none mb-[-1px]">
				<svg 
					viewBox="0 0 1200 120" 
					preserveAspectRatio="none" 
					className="h-12 w-full fill-[#F8F7F4] block translate-y-[1px]" 
					style={{ shapeRendering: "geometricPrecision" }}
				>
					<path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
				</svg>
			</div>
		</section>
	);
}

const formatCurrency = (val) => {
	return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(val);
};

export default HeroExpress;
