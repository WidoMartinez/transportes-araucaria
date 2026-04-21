import React, { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
	Search,
	Calendar,
	MapPin,
	User,
	Phone,
	Mail,
	Clock,
	Users,
	DollarSign,
	AlertCircle,
	CheckCircle2,
	Loader2,
	FileText,
	CreditCard,
} from "lucide-react";

import { getBackendUrl } from "../lib/backend";
import SelectorPasarela from "./SelectorPasarela";
import { validatePaymentAmount } from "../utils/paymentValidation";
import ProductosReserva from "./ProductosReserva";

const API_URL = getBackendUrl() || "https://transportes-araucaria.onrender.com";

const normalizePhoneToE164 = (phone) => {
	if (!phone) return "";
	let cleaned = phone.replace(/[\s\-()]/g, "");
	if (cleaned.startsWith("+56")) return cleaned;
	if (cleaned.startsWith("56")) return "+" + cleaned;
	if (cleaned.startsWith("9") && cleaned.length >= 9) return "+56" + cleaned;
	return "+56" + cleaned;
};

function ConsultarReserva() {
	const [codigoReserva, setCodigoReserva] = useState("");
	const [reserva, setReserva] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [paying, setPaying] = useState(false);
	const [payError, setPayError] = useState(null);
	const [totalProductos, setTotalProductos] = useState(0);
	// Pasarela de pago seleccionada: "flow" | "mercadopago"
	const [pasarela, setPasarela] = useState("flow");

	const buscarReserva = async () => {
		if (!codigoReserva.trim()) {
			setError("Por favor ingresa un cÃ³digo de reserva");
			return;
		}

		setLoading(true);
		setError(null);
		setReserva(null);

		try {
			const response = await fetch(
				`${API_URL}/api/reservas/codigo/${codigoReserva.trim()}`,
			);

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("No se encontrÃ³ ninguna reserva con ese cÃ³digo");
				}
				throw new Error("Error al buscar la reserva");
			}

			const data = await response.json();
			setReserva(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const continuarPago = async (tipo, monto) => {
		if (!reserva) return;
		try {
			setPaying(true);
			setPayError(null);
			const apiBase =
				getBackendUrl() || "https://transportes-araucaria.onrender.com";

			// ValidaciÃ³n mÃ¡s robusta del monto
			const montoValidado = validatePaymentAmount(monto);

			if (montoValidado <= 0) {
				throw new Error("No hay monto disponible para generar el pago");
			}

			console.log(`ðŸ’° [ConsultarReserva] Iniciando pago (${pasarela}):`, {
				tipo,
				montoOriginal: monto,
				montoValidado: montoValidado,
				reservaId: reserva.id,
				codigoReserva: reserva.codigoReserva,
				email: reserva.email,
			});

			const description =
				tipo === "total"
					? `Pago total reserva ${reserva.codigoReserva} (${reserva.destino})`
					: tipo === "saldo"
						? `Pago saldo pendiente reserva ${reserva.codigoReserva} (${reserva.destino})`
						: tipo === "saldo_total"
							? `Pago saldo total y productos de reserva ${reserva.codigoReserva}`
							: `Abono 40% reserva ${reserva.codigoReserva} (${reserva.destino})`;

			// Endpoint y cuerpo segÃºn pasarela seleccionada
			const endpoint =
				pasarela === "mercadopago"
					? `${apiBase}/api/create-payment-mp`
					: `${apiBase}/create-payment`;

			const body =
				pasarela === "mercadopago"
					? {
							amount: montoValidado,
							description,
							email: reserva.email,
							nombre: reserva.nombre,
							telefono: reserva.telefono,
							reservaId: reserva.id,
							codigoReserva: reserva.codigoReserva,
							tipoPago: tipo,
							paymentOrigin: "consultar_reserva",
						}
					: {
							gateway: "flow",
							amount: montoValidado,
							description,
							email: reserva.email,
							reservaId: reserva.id,
							codigoReserva: reserva.codigoReserva,
							tipoPago: tipo,
							paymentOrigin: "consultar_reserva",
						};

			const resp = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (!resp.ok) {
				let errorMsg = `Error al generar pago (${resp.status})`;
				try {
					const errData = await resp.json();
					if (errData.message) errorMsg = errData.message;
				} catch {
					const detail = await resp.text().catch(() => "");
					if (detail) errorMsg += ` ${detail}`;
				}
				throw new Error(errorMsg);
			}
			const data = await resp.json();
			if (!data.url)
				throw new Error("Respuesta invÃ¡lida del servidor de pagos");
			// Lead de Google Ads antes de redirigir (con espera corta para evitar race condition)
			const waitForGtag = (timeoutMs = 2000) =>
				new Promise((resolve) => {
					if (typeof window.gtag === "function") {
						resolve(true);
						return;
					}
					const inicio = Date.now();
					const iv = setInterval(() => {
						if (typeof window.gtag === "function") {
							clearInterval(iv);
							resolve(true);
						} else if (Date.now() - inicio >= timeoutMs) {
							clearInterval(iv);
							resolve(false);
						}
					}, 50);
				});

			await waitForGtag();
			if (typeof window.gtag === "function") {
				const userData = {};
				if (reserva.email) userData.email = reserva.email.toLowerCase().trim();
				if (reserva.telefono)
					userData.phone_number = normalizePhoneToE164(reserva.telefono);
				if (reserva.nombre) {
					const nameParts = reserva.nombre.trim().split(" ");
					userData.address = {
						first_name: nameParts[0]?.toLowerCase() || "",
						last_name: nameParts.slice(1).join(" ")?.toLowerCase() || "",
						country: "CL",
					};
				}
				if (Object.keys(userData).length > 0) {
					window.gtag("set", "user_data", userData);
				}
				window.gtag("event", "conversion", {
					send_to: "AW-17529712870/8GVlCLP-05MbEObh6KZB",
				});
			}
			window.location.href = data.url;
		} catch (e) {
			console.error(`âŒ [ConsultarReserva] Error en pago:`, e);
			setPayError(e.message || "No se pudo iniciar el pago");
		} finally {
			setPaying(false);
		}
	};

	const formatDate = (date) => {
		if (!date) return "No especificada";
		return new Date(date + "T00:00:00").toLocaleDateString("es-CL", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(amount || 0);
	};

	// CORRECCIÃ“N: Calcular el precio base real considerando ida+vuelta
	const precioBaseReal = useMemo(() => {
		if (!reserva) return 0;
		// Si es ida y vuelta, el backend divide el precio total en 2 tramos
		// Por lo tanto, multiplicamos por 2 para mostrar el precio total
		return reserva.idaVuelta ? reserva.precio * 2 : reserva.precio;
	}, [reserva]);

	const getEstadoBadge = (estado) => {
		const estados = {
			pendiente: { variant: "secondary", icon: Clock, label: "Pendiente" },
			pendiente_detalles: {
				variant: "secondary",
				icon: AlertCircle,
				label: "Pendiente Detalles",
			},
			confirmada: {
				variant: "default",
				icon: CheckCircle2,
				label: "Confirmada",
			},
			completada: {
				variant: "default",
				icon: CheckCircle2,
				label: "Completada",
			},
			cancelada: {
				variant: "destructive",
				icon: AlertCircle,
				label: "Cancelada",
			},
		};

		const config = estados[estado] || estados.pendiente;
		const Icon = config.icon;

		return (
			<Badge variant={config.variant} className="gap-1">
				<Icon className="w-3 h-3" />
				{config.label}
			</Badge>
		);
	};

	const getEstadoPagoBadge = (estadoPago) => {
		const estados = {
			pendiente: {
				variant: "secondary",
				label: "Pendiente",
				className: "bg-muted text-muted-foreground",
			},
			aprobado: {
				variant: "outline",
				label: "Aprobado",
				className: "border-secondary/40 text-secondary",
			},
			parcial: {
				variant: "outline",
				label: "Pago parcial",
				className: "border-secondary/40 text-secondary",
			},
			pagado: { variant: "default", label: "Pago completado", className: "" },
			fallido: { variant: "destructive", label: "Fallido", className: "" },
			reembolsado: {
				variant: "outline",
				label: "Reembolsado",
				className: "border-border text-foreground",
			},
		};

		const key = (estadoPago || "").toLowerCase();
		const config = estados[key] || estados.pendiente;

		return (
			<Badge variant={config.variant} className={`rounded-full ${config.className}`}>
				{config.label}
			</Badge>
		);
	};

	const getPaymentOptions = () => {
		if (!reserva || reserva.estadoPago === "pagado") {
			return [];
		}

		const saldoPendiente = Number(reserva.saldoPendiente) || 0;
		const totalProds = Number(totalProductos) || 0;
		const saldoTotalGeneral = saldoPendiente + totalProds;

		// Escenario 1: Pagar el saldo total general (reserva confirmada con saldo y/o productos)
		if (
			(reserva.estado === "confirmada" || reserva.estado === "completada") &&
			saldoTotalGeneral > 0
		) {
			return [
				{
					tipo: "saldo_total",
					monto: saldoTotalGeneral,
					texto: `Pagar Saldo Total del Viaje (${formatCurrency(
						saldoTotalGeneral,
					)})`,
					variant: "default",
					className: "bg-secondary hover:bg-secondary/90",
				},
			];
		}

		// Escenario 2: Pagar solo el saldo pendiente de la reserva (sin productos)
		if (
			reserva.estadoPago === "parcial" &&
			saldoPendiente > 0 &&
			totalProds === 0
		) {
			return [
				{
					tipo: "saldo",
					monto: saldoPendiente,
					texto: `Pagar saldo pendiente (${formatCurrency(saldoPendiente)})`,
					variant: "secondary",
				},
			];
		}

		// Escenario 3: Pago inicial (reserva no confirmada)
		if (
			reserva.estado === "pendiente" ||
			reserva.estado === "pendiente_detalles"
		) {
			const options = [];
			if (reserva.abonoSugerido > 0) {
				options.push({
					tipo: "abono",
					monto: reserva.abonoSugerido,
					texto: "Continuar con el pago (40%)",
					variant: "default",
					className: "bg-primary hover:bg-primary/90",
				});
			}
			if (reserva.totalConDescuento > 0) {
				options.push({
					tipo: "total",
					monto: reserva.totalConDescuento,
					texto: "Pagar el 100%",
					variant: "outline",
				});
			}
			return options;
		}

		return [];
	};

	const paymentOptions = getPaymentOptions();

	return (
		<div className="min-h-screen bg-background">
			<section className="relative overflow-hidden bg-primary bg-pattern-mesh py-14 text-primary-foreground md:py-16">
				<div className="absolute inset-0 bg-primary/75" />
				<div className="absolute -right-40 -top-36 h-[300px] w-[300px] rounded-full bg-secondary/35 blur-[110px]" />
				<div className="absolute -left-40 bottom-[-110px] h-[260px] w-[260px] rounded-full bg-accent/30 blur-[110px]" />
				<div className="container relative z-10 mx-auto px-4 text-center">
					<Badge className="mb-4 rounded-full bg-accent px-4 py-1.5 text-accent-foreground">
						<Search className="mr-2 h-4 w-4" />
						Consulta en línea
					</Badge>
					<h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
						Consultar Reserva
					</h1>
					<p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/90 md:text-base">
						Ingresa tu código para ver estado, detalles del viaje y opciones de pago disponibles.
					</p>
				</div>
			</section>

			<div className="container mx-auto max-w-5xl space-y-6 px-4 py-8 md:py-10">
				<Card className="rounded-[2rem] border-border/70 bg-card py-5 shadow-sm">
					<CardHeader>
						<CardTitle>Buscar por código de reserva</CardTitle>
						<CardDescription>
							Formato esperado: AR-YYYYMMDD-XXXX (ejemplo: AR-20251015-0001).
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
							<div className="space-y-2">
								<Label htmlFor="codigo">Código de reserva</Label>
								<Input
									id="codigo"
									placeholder="AR-20251015-0001"
									value={codigoReserva}
									onChange={(e) => setCodigoReserva(e.target.value.toUpperCase())}
									onKeyPress={(e) => e.key === "Enter" && buscarReserva()}
									className="h-11 rounded-xl border-input font-mono"
								/>
							</div>
							<div className="flex items-end">
								<Button
									onClick={buscarReserva}
									disabled={loading}
									className="h-11 w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 md:w-auto"
								>
									{loading ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Buscando...
										</>
									) : (
										<>
											<Search className="h-4 w-4" />
											Buscar reserva
										</>
									)}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{error && (
					<Card className="rounded-2xl border-destructive/30 bg-destructive/5 py-4">
						<CardContent className="pt-0">
							<div className="flex items-center gap-2 text-destructive">
								<AlertCircle className="h-5 w-5" />
								<p>{error}</p>
							</div>
						</CardContent>
					</Card>
				)}

				{reserva && (
					<div className="space-y-6">
						<Card className="rounded-[2rem] border-secondary/25 bg-secondary/10 py-5 shadow-sm">
							<CardContent className="pt-0">
								<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
									<div>
										<Label className="text-xs font-semibold uppercase tracking-wider text-secondary">
											Código de reserva
										</Label>
										<p className="mt-1 font-mono text-2xl font-bold tracking-wider text-foreground md:text-3xl">
											{reserva.codigoReserva}
										</p>
									</div>
									<div className="flex flex-wrap gap-2">
										{getEstadoBadge(reserva.estado)}
										{getEstadoPagoBadge(reserva.estadoPago)}
									</div>
								</div>
							</CardContent>
						</Card>

						{!reserva.detallesCompletos && (
							<Card className="rounded-2xl border-destructive/35 bg-destructive/5 py-4">
								<CardContent className="pt-0">
									<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
										<div className="flex items-start gap-3">
											<div className="rounded-full bg-destructive/15 p-2">
												<MapPin className="h-5 w-5 text-destructive" />
											</div>
											<div>
												<h3 className="font-semibold text-destructive">Dirección faltante</h3>
												<p className="text-sm text-destructive/85">
													Aún no has proporcionado la dirección exacta. Completa el formulario para finalizar los datos operativos.
												</p>
											</div>
										</div>
										<Button
											variant="destructive"
											className="rounded-xl"
											onClick={() => {
												window.location.hash = `#completar-detalles?id=${reserva.id}`;
											}}
										>
											Completar dirección
										</Button>
									</div>
								</CardContent>
							</Card>
						)}

						<Card className="rounded-[2rem] border-border/70 py-5 shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<User className="h-5 w-5 text-secondary" />
									Información del cliente
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div>
										<Label className="text-muted-foreground">Nombre</Label>
										<p className="font-medium text-foreground">{reserva.nombre}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Email</Label>
										<p className="flex items-center gap-2 font-medium text-foreground">
											<Mail className="h-4 w-4 text-muted-foreground" />
											{reserva.email}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Teléfono</Label>
										<p className="flex items-center gap-2 font-medium text-foreground">
											<Phone className="h-4 w-4 text-muted-foreground" />
											{reserva.telefono}
										</p>
									</div>
									{reserva.rut && (
										<div>
											<Label className="text-muted-foreground">RUT</Label>
											<p className="font-medium text-foreground">{reserva.rut}</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-[2rem] border-border/70 py-5 shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPin className="h-5 w-5 text-secondary" />
									Detalles del viaje
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{reserva.idaVuelta && (
									<Badge className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
										Viaje ida y vuelta
									</Badge>
								)}

								<div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
									<h4 className="mb-3 font-semibold text-primary">Viaje de ida</h4>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<Label className="text-primary/80">Origen</Label>
											<p className="font-semibold text-foreground">
												{reserva.origen}
												{reserva.direccionOrigen && (
													<span className="mt-0.5 block text-sm font-normal italic text-muted-foreground">
														({reserva.direccionOrigen})
													</span>
												)}
											</p>
										</div>
										<div>
											<Label className="text-primary/80">Destino</Label>
											<p className="font-semibold text-foreground">
												{reserva.destino}
												{reserva.direccionDestino && (
													<span className="mt-0.5 block text-sm font-normal italic text-muted-foreground">
														({reserva.direccionDestino})
													</span>
												)}
											</p>
										</div>
										<div>
											<Label className="text-primary/80">Fecha</Label>
											<p className="flex items-center gap-2 font-semibold text-foreground">
												<Calendar className="h-4 w-4 text-primary" />
												{formatDate(reserva.fecha)}
											</p>
										</div>
										<div>
											<Label className="text-primary/80">Hora de recogida</Label>
											<p className="flex items-center gap-2 font-semibold text-foreground">
												<Clock className="h-4 w-4 text-primary" />
												{reserva.hora || "No especificada"}
											</p>
										</div>
									</div>
								</div>

								{reserva.idaVuelta && (
									<div className="rounded-2xl border border-secondary/25 bg-secondary/10 p-4">
										<h4 className="mb-3 font-semibold text-secondary">Viaje de vuelta</h4>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<div>
												<Label className="text-secondary/80">Origen</Label>
												<p className="font-semibold text-foreground">
													{reserva.destino}
													{reserva.direccionDestino && (
														<span className="mt-0.5 block text-sm font-normal italic text-muted-foreground">
															({reserva.direccionDestino})
														</span>
													)}
												</p>
											</div>
											<div>
												<Label className="text-secondary/80">Destino</Label>
												<p className="font-semibold text-foreground">
													{reserva.origen}
													{reserva.direccionOrigen && (
														<span className="mt-0.5 block text-sm font-normal italic text-muted-foreground">
															({reserva.direccionOrigen})
														</span>
													)}
												</p>
											</div>
											<div>
												<Label className="text-secondary/80">Fecha de regreso</Label>
												<p className="flex items-center gap-2 font-semibold text-foreground">
													<Calendar className="h-4 w-4 text-secondary" />
													{reserva.fechaRegreso ? formatDate(reserva.fechaRegreso) : "No especificada"}
												</p>
											</div>
											<div>
												<Label className="text-secondary/80">Hora de recogida</Label>
												<p className="flex items-center gap-2 font-semibold text-foreground">
													<Clock className="h-4 w-4 text-secondary" />
													{reserva.horaRegreso || "No especificada"}
												</p>
											</div>
										</div>

										{(!reserva.fechaRegreso || !reserva.horaRegreso) && (
											<div className="mt-3 rounded-xl border border-accent/35 bg-accent/10 p-3">
												<p className="text-sm font-semibold text-foreground">
													Información incompleta del viaje de vuelta
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													Nos comunicaremos contigo para confirmar fecha y hora del regreso.
												</p>
											</div>
										)}
									</div>
								)}

								<div className="grid grid-cols-1 gap-4 border-t border-border pt-4 md:grid-cols-2">
									<div>
										<Label className="text-muted-foreground">Pasajeros</Label>
										<p className="flex items-center gap-2 font-medium text-foreground">
											<Users className="h-4 w-4 text-muted-foreground" />
											{reserva.pasajeros}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Vehículo</Label>
										<p className="font-medium text-foreground">{reserva.vehiculo || "Por asignar"}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-[2rem] border-border/70 py-5 shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<DollarSign className="h-5 w-5 text-secondary" />
									Información de pago
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div>
										<Label className="text-muted-foreground">Precio base</Label>
										<p className="font-medium text-foreground">{formatCurrency(precioBaseReal)}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Total a pagar</Label>
										<p className="text-lg font-semibold text-secondary">
											{formatCurrency(reserva.totalConDescuento)}
										</p>
									</div>
									{reserva.abonoSugerido > 0 && (
										<>
											<div>
												<Label className="text-muted-foreground">Abono sugerido</Label>
												<p className="font-medium text-foreground">
													{formatCurrency(reserva.abonoSugerido)}
												</p>
											</div>
											<div>
												<Label className="text-muted-foreground">Saldo pendiente</Label>
												<p className="font-medium text-foreground">
													{formatCurrency(reserva.saldoPendiente)}
												</p>
											</div>
										</>
									)}
								</div>

								{reserva.estadoPago !== "pagado" && (
									<div className="mt-6 space-y-3">
										{payError && (
											<div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
												<div className="flex items-center gap-2">
													<AlertCircle className="h-4 w-4" />
													<span>{payError}</span>
												</div>
											</div>
										)}

										<SelectorPasarela pasarela={pasarela} onChange={setPasarela} />
										<div className="flex flex-wrap gap-3">
											{paymentOptions.map((option) => (
												<Button
													key={option.tipo}
													onClick={() => continuarPago(option.tipo, option.monto)}
													disabled={paying}
													variant={option.variant}
													className={`gap-2 rounded-xl ${option.className || ""}`}
												>
													{paying ? (
														<>
															<Loader2 className="h-4 w-4 animate-spin" />
															Generando pago...
														</>
													) : (
														<>
															<CreditCard className="h-4 w-4" />
															{option.texto}
														</>
													)}
												</Button>
											))}
										</div>
										<p className="text-xs text-muted-foreground">
											Se abrirá una ventana para completar el pago seguro con {pasarela === "mercadopago" ? "Mercado Pago" : "Flow"}.
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						<ProductosReserva
							reservaId={reserva.id}
							reserva={reserva}
							onTotalProductosChange={setTotalProductos}
						/>

						{(reserva.numeroVuelo || reserva.hotel || reserva.equipajeEspecial || reserva.sillaInfantil) && (
							<Card className="rounded-[2rem] border-border/70 py-5 shadow-sm">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<FileText className="h-5 w-5 text-secondary" />
										Servicios adicionales
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										{reserva.numeroVuelo && (
											<div>
												<Label className="text-muted-foreground">Número de vuelo</Label>
												<p className="font-medium text-foreground">{reserva.numeroVuelo}</p>
											</div>
										)}
										{reserva.hotel && (
											<div>
												<Label className="text-muted-foreground">Referencia / Hotel</Label>
												<p className="font-medium text-foreground">{reserva.hotel}</p>
											</div>
										)}
										{reserva.equipajeEspecial && (
											<div>
												<Label className="text-muted-foreground">Equipaje especial</Label>
												<p className="font-medium text-foreground">{reserva.equipajeEspecial}</p>
											</div>
										)}
										{reserva.sillaInfantil && (
											<div>
												<Label className="text-muted-foreground">Silla infantil</Label>
												<p className="font-medium text-foreground">Requerida</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						)}

						{reserva.mensaje && (
							<Card className="rounded-[2rem] border-border/70 py-5 shadow-sm">
								<CardHeader>
									<CardTitle>Observaciones</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-foreground/85">{reserva.mensaje}</p>
								</CardContent>
							</Card>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export default ConsultarReserva;

