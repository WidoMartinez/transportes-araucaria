import { useEffect, useMemo, useState } from "react";
import {
	Plane,
	Hotel,
	Route,
	CalendarClock,
	ShieldCheck,
	Luggage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getBackendUrl } from "@/lib/backend";

const FORMULARIO_INICIAL = {
	nombre: "",
	email: "",
	telefono: "",
	hotelCodigo: "",
	origenTipo: "aeropuerto",
	tipoServicio: "solo_ida",
	fechaIda: "",
	horaIda: "",
	fechaVuelta: "",
	horaVuelta: "",
	pasajeros: "1",
	observaciones: "",
};

const formatearCLP = (monto) =>
	new Intl.NumberFormat("es-CL", {
		style: "currency",
		currency: "CLP",
		maximumFractionDigits: 0,
	}).format(Number(monto || 0));

function TrasladosAeropuertoHoteles() {
	const [catalogo, setCatalogo] = useState(null);
	const [loadingCatalogo, setLoadingCatalogo] = useState(true);
	const [errorCatalogo, setErrorCatalogo] = useState("");
	const [form, setForm] = useState(FORMULARIO_INICIAL);
	const [enviando, setEnviando] = useState(false);
	const [errorFormulario, setErrorFormulario] = useState("");
	const [reservaCreada, setReservaCreada] = useState(null);

	useEffect(() => {
		const cargarCatalogo = async () => {
			try {
				setLoadingCatalogo(true);
				setErrorCatalogo("");
				const response = await fetch(
					`${getBackendUrl()}/api/traslados-hoteles/catalogo`,
				);
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "No se pudo cargar el servicio.");
				}

				setCatalogo(data);
			} catch (error) {
				console.error("Error cargando catálogo Aeropuerto-Hoteles:", error);
				setErrorCatalogo(
					error.message ||
						"No fue posible cargar el catálogo de hoteles por el momento.",
				);
			} finally {
				setLoadingCatalogo(false);
			}
		};

		cargarCatalogo();
	}, []);

	const hotelSeleccionado = useMemo(
		() =>
			catalogo?.hoteles?.find((hotel) => hotel.codigo === form.hotelCodigo) || null,
		[catalogo, form.hotelCodigo],
	);

	const montoCalculado = useMemo(() => {
		if (!hotelSeleccionado) return 0;
		return form.tipoServicio === "ida_vuelta"
			? hotelSeleccionado.tarifaIdaVuelta
			: hotelSeleccionado.tarifaSoloIda;
	}, [hotelSeleccionado, form.tipoServicio]);

	const cambiarCampo = (campo, valor) => {
		setForm((prev) => ({ ...prev, [campo]: valor }));
	};

	const cambiarOrigenTipo = (nuevoOrigen) => {
		setForm((prev) => ({
			...prev,
			origenTipo: nuevoOrigen,
			tipoServicio:
				nuevoOrigen === "hotel" ? "solo_ida" : prev.tipoServicio || "solo_ida",
			fechaVuelta: nuevoOrigen === "hotel" ? "" : prev.fechaVuelta,
			horaVuelta: nuevoOrigen === "hotel" ? "" : prev.horaVuelta,
		}));
	};

	const cambiarTipoServicio = (nuevoTipo) => {
		setForm((prev) => ({
			...prev,
			tipoServicio: nuevoTipo,
			fechaVuelta: nuevoTipo === "ida_vuelta" ? prev.fechaVuelta : "",
			horaVuelta: nuevoTipo === "ida_vuelta" ? prev.horaVuelta : "",
		}));
	};

	const limpiarFormulario = () => {
		setForm((prev) => ({
			...FORMULARIO_INICIAL,
			nombre: prev.nombre,
			email: prev.email,
			telefono: prev.telefono,
		}));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setErrorFormulario("");
		setReservaCreada(null);

		if (!form.nombre || !form.email || !form.telefono || !form.hotelCodigo) {
			setErrorFormulario(
				"Completa nombre, email, teléfono y hotel para continuar.",
			);
			return;
		}

		if (!form.fechaIda || !form.horaIda) {
			setErrorFormulario("Debes indicar fecha y hora de ida.");
			return;
		}

		if (form.tipoServicio === "ida_vuelta" && (!form.fechaVuelta || !form.horaVuelta)) {
			setErrorFormulario("Debes completar fecha y hora de vuelta.");
			return;
		}

		try {
			setEnviando(true);
			const response = await fetch(
				`${getBackendUrl()}/api/traslados-hoteles/reservas`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...form,
						pasajeros: Number(form.pasajeros || 1),
					}),
				},
			);

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "No se pudo crear la reserva.");
			}

			setReservaCreada(data.reserva);
			limpiarFormulario();
		} catch (error) {
			console.error("Error creando reserva Aeropuerto-Hoteles:", error);
			setErrorFormulario(
				error.message || "Ocurrió un error al enviar la solicitud.",
			);
		} finally {
			setEnviando(false);
		}
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<section className="border-b bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground">
				<div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
					<Badge className="mb-4 bg-white/15 text-white hover:bg-white/15">
						Servicio especializado
					</Badge>
					<h1 className="font-serif text-4xl md:text-5xl leading-tight">
						Traslados Aeropuerto La Araucanía a Hoteles de la Región
					</h1>
					<p className="mt-4 max-w-3xl text-sm md:text-base text-white/90">
						Reserva con tarifa fija y reglas claras de viaje. Este módulo es
						independiente y fue diseñado especialmente para traslados entre
						aeropuerto y hoteles principales de La Araucanía.
					</p>
					<div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<div className="rounded-xl border border-white/20 bg-white/10 p-3 text-sm">
							<div className="flex items-center gap-2 font-medium">
								<Route className="h-4 w-4" />
								Tarifas fijas
							</div>
							<p className="mt-1 text-white/85">Sin precio dinámico ni sorpresas.</p>
						</div>
						<div className="rounded-xl border border-white/20 bg-white/10 p-3 text-sm">
							<div className="flex items-center gap-2 font-medium">
								<Plane className="h-4 w-4" />
								Desde aeropuerto
							</div>
							<p className="mt-1 text-white/85">Permite solo ida o ida y vuelta.</p>
						</div>
						<div className="rounded-xl border border-white/20 bg-white/10 p-3 text-sm">
							<div className="flex items-center gap-2 font-medium">
								<Hotel className="h-4 w-4" />
								Desde hotel
							</div>
							<p className="mt-1 text-white/85">Permite solo ida al aeropuerto.</p>
						</div>
						<div className="rounded-xl border border-white/20 bg-white/10 p-3 text-sm">
							<div className="flex items-center gap-2 font-medium">
								<ShieldCheck className="h-4 w-4" />
								Gestión dedicada
							</div>
							<p className="mt-1 text-white/85">
								Administrador especializado para este servicio.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr]">
				<Card className="border-border">
					<CardHeader>
						<CardTitle>Reserva tu traslado</CardTitle>
					</CardHeader>
					<CardContent>
						{loadingCatalogo ? (
							<p className="text-sm text-muted-foreground">Cargando catálogo...</p>
						) : errorCatalogo ? (
							<Alert variant="destructive">
								<AlertTitle>No se pudo cargar el servicio</AlertTitle>
								<AlertDescription>{errorCatalogo}</AlertDescription>
							</Alert>
						) : (
							<form className="space-y-6" onSubmit={handleSubmit}>
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="nombre">Nombre completo</Label>
										<Input
											id="nombre"
											value={form.nombre}
											onChange={(e) => cambiarCampo("nombre", e.target.value)}
											placeholder="Tu nombre"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="telefono">Teléfono</Label>
										<Input
											id="telefono"
											value={form.telefono}
											onChange={(e) => cambiarCampo("telefono", e.target.value)}
											placeholder="+56 9..."
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={form.email}
										onChange={(e) => cambiarCampo("email", e.target.value)}
										placeholder="correo@ejemplo.com"
									/>
								</div>

								<div className="space-y-3">
									<Label>¿Desde dónde inicia tu viaje?</Label>
									<RadioGroup
										value={form.origenTipo}
										onValueChange={cambiarOrigenTipo}
										className="grid gap-3 md:grid-cols-2"
									>
										<div className="flex items-center gap-3 rounded-lg border p-3">
											<RadioGroupItem value="aeropuerto" id="origen-aeropuerto" />
											<Label htmlFor="origen-aeropuerto" className="cursor-pointer">
												Desde aeropuerto
											</Label>
										</div>
										<div className="flex items-center gap-3 rounded-lg border p-3">
											<RadioGroupItem value="hotel" id="origen-hotel" />
											<Label htmlFor="origen-hotel" className="cursor-pointer">
												Desde hotel
											</Label>
										</div>
									</RadioGroup>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label>Hotel destino/origen</Label>
										<Select
											value={form.hotelCodigo}
											onValueChange={(value) => cambiarCampo("hotelCodigo", value)}
										>
											<SelectTrigger>
												<SelectValue placeholder="Selecciona hotel" />
											</SelectTrigger>
											<SelectContent>
												{catalogo?.hoteles?.map((hotel) => (
													<SelectItem key={hotel.codigo} value={hotel.codigo}>
														{hotel.nombre} ({hotel.comuna})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Pasajeros</Label>
										<Select
											value={form.pasajeros}
											onValueChange={(value) => cambiarCampo("pasajeros", value)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{Array.from({ length: 7 }).map((_, index) => (
													<SelectItem key={index + 1} value={String(index + 1)}>
														{index + 1} pasajero{index > 0 ? "s" : ""}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-3">
									<Label>Tipo de viaje</Label>
									<RadioGroup
										value={form.tipoServicio}
										onValueChange={cambiarTipoServicio}
										className="grid gap-3 md:grid-cols-2"
									>
										<div className="flex items-center gap-3 rounded-lg border p-3">
											<RadioGroupItem value="solo_ida" id="tipo-solo-ida" />
											<Label htmlFor="tipo-solo-ida" className="cursor-pointer">
												Solo ida
											</Label>
										</div>
										<div
											className={`flex items-center gap-3 rounded-lg border p-3 ${
												form.origenTipo === "hotel"
													? "opacity-50 cursor-not-allowed"
													: ""
											}`}
										>
											<RadioGroupItem
												value="ida_vuelta"
												id="tipo-ida-vuelta"
												disabled={form.origenTipo === "hotel"}
											/>
											<Label htmlFor="tipo-ida-vuelta" className="cursor-pointer">
												Ida y vuelta (solo desde aeropuerto)
											</Label>
										</div>
									</RadioGroup>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="fecha-ida">Fecha ida</Label>
										<Input
											id="fecha-ida"
											type="date"
											value={form.fechaIda}
											onChange={(e) => cambiarCampo("fechaIda", e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="hora-ida">Hora ida</Label>
										<Input
											id="hora-ida"
											type="time"
											value={form.horaIda}
											onChange={(e) => cambiarCampo("horaIda", e.target.value)}
										/>
									</div>
								</div>

								{form.tipoServicio === "ida_vuelta" && (
									<div className="grid gap-4 md:grid-cols-2 rounded-xl border border-dashed border-border p-4">
										<div className="space-y-2">
											<Label htmlFor="fecha-vuelta">Fecha vuelta</Label>
											<Input
												id="fecha-vuelta"
												type="date"
												value={form.fechaVuelta}
												onChange={(e) => cambiarCampo("fechaVuelta", e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="hora-vuelta">Hora vuelta</Label>
											<Input
												id="hora-vuelta"
												type="time"
												value={form.horaVuelta}
												onChange={(e) => cambiarCampo("horaVuelta", e.target.value)}
											/>
										</div>
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="observaciones">Observaciones (opcional)</Label>
									<Textarea
										id="observaciones"
										value={form.observaciones}
										onChange={(e) => cambiarCampo("observaciones", e.target.value)}
										placeholder="Ej: equipaje voluminoso, silla infantil, etc."
									/>
								</div>

								{errorFormulario && (
									<Alert variant="destructive">
										<AlertTitle>No se pudo enviar</AlertTitle>
										<AlertDescription>{errorFormulario}</AlertDescription>
									</Alert>
								)}

								<Button type="submit" className="w-full" disabled={enviando}>
									{enviando ? "Enviando reserva..." : "Reservar traslado"}
								</Button>
							</form>
						)}
					</CardContent>
				</Card>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<Luggage className="h-4 w-4" />
								Resumen de tarifa fija
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Trayecto base</span>
								<span>
									{form.origenTipo === "aeropuerto"
										? "Aeropuerto → Hotel"
										: "Hotel → Aeropuerto"}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Hotel</span>
								<span>{hotelSeleccionado?.nombre || "Sin seleccionar"}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Servicio</span>
								<span>
									{form.tipoServicio === "ida_vuelta"
										? "Ida y vuelta"
										: "Solo ida"}
								</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between text-base font-semibold">
								<span>Total estimado</span>
								<span>{formatearCLP(montoCalculado)}</span>
							</div>
							<p className="text-xs text-muted-foreground">
								Valores definidos por hotel, sin tarifa dinámica para este
								servicio.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<CalendarClock className="h-4 w-4" />
								Reglas del módulo
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm text-muted-foreground">
							<p>1. Si partes desde el aeropuerto puedes reservar ida o ida y vuelta.</p>
							<p>2. Si partes desde hotel solo está disponible la ida al aeropuerto.</p>
							<p>3. Todas las reservas ingresan con estado inicial pendiente.</p>
						</CardContent>
					</Card>

					{reservaCreada && (
						<Alert className="border-primary/30 bg-primary/5">
							<AlertTitle>Reserva creada correctamente</AlertTitle>
							<AlertDescription className="space-y-1">
								<p>
									Código: <strong>{reservaCreada.codigoReserva}</strong>
								</p>
								<p>
									Monto: <strong>{formatearCLP(reservaCreada.montoTotal)}</strong>
								</p>
								<p>Estado inicial: {reservaCreada.estado}</p>
							</AlertDescription>
						</Alert>
					)}
				</div>
			</section>
		</div>
	);
}

export default TrasladosAeropuertoHoteles;
