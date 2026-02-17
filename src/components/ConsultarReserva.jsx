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
import { validatePaymentAmount } from "../utils/paymentValidation";
import ProductosReserva from "./ProductosReserva";

const API_URL = getBackendUrl() || "https://transportes-araucaria.onrender.com";

function ConsultarReserva() {
	const [codigoReserva, setCodigoReserva] = useState("");
	const [reserva, setReserva] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [paying, setPaying] = useState(false);
	const [payError, setPayError] = useState(null);
	const [totalProductos, setTotalProductos] = useState(0);

	const buscarReserva = async () => {
		if (!codigoReserva.trim()) {
			setError("Por favor ingresa un código de reserva");
			return;
		}

		setLoading(true);
		setError(null);
		setReserva(null);

		try {
			const response = await fetch(
				`${API_URL}/api/reservas/codigo/${codigoReserva.trim()}`
			);

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("No se encontró ninguna reserva con ese código");
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

			// Validación más robusta del monto
			const montoValidado = validatePaymentAmount(monto);
			
			if (montoValidado <= 0) {
				throw new Error("No hay monto disponible para generar el pago");
			}
			
			console.log(`💰 [ConsultarReserva] Iniciando pago:`, {
				tipo,
				montoOriginal: monto,
				montoValidado: montoValidado,
				reservaId: reserva.id,
				codigoReserva: reserva.codigoReserva,
				email: reserva.email
			});
			
			const description =
				tipo === "total"
					? `Pago total reserva ${reserva.codigoReserva} (${reserva.destino})`
					: tipo === "saldo"
					? `Pago saldo pendiente reserva ${reserva.codigoReserva} (${reserva.destino})`
					: tipo === "saldo_total"
					? `Pago saldo total y productos de reserva ${reserva.codigoReserva}`
					: `Abono 40% reserva ${reserva.codigoReserva} (${reserva.destino})`;

			const resp = await fetch(`${apiBase}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gateway: "flow",
					amount: montoValidado,
					description,
					email: reserva.email,
					reservaId: reserva.id,
					codigoReserva: reserva.codigoReserva,
					tipoPago: tipo,
					paymentOrigin: "consultar_reserva",
				}),
			});
			if (!resp.ok) {
				const detail = await resp.text().catch(() => "");
				throw new Error(`Error al generar pago (${resp.status}) ${detail}`);
			}
			const data = await resp.json();
			if (!data.url)
				throw new Error("Respuesta inválida del servidor de pagos");
			window.location.href = data.url;
		} catch (e) {
			console.error(`❌ [ConsultarReserva] Error en pago:`, e);
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
			pendiente: { variant: "secondary", label: "Pendiente" },
			aprobado: { variant: "outline", label: "Aprobado" },
			parcial: { variant: "outline", label: "Pago parcial" },
			pagado: { variant: "default", label: "Pago completado" },
			fallido: { variant: "destructive", label: "Fallido" },
			reembolsado: { variant: "outline", label: "Reembolsado" },
		};

		const key = (estadoPago || "").toLowerCase();
		const config = estados[key] || estados.pendiente;

		return <Badge variant={config.variant}>{config.label}</Badge>;
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
						saldoTotalGeneral
					)})`,
					variant: "default",
					className: "bg-chocolate-600 hover:bg-chocolate-700 animate-pulse",
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
					className: "bg-green-600 hover:bg-green-700",
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
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Encabezado */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-slate-900 mb-2">
						Consultar Reserva
					</h1>
					<p className="text-slate-600">
						Ingresa tu código de reserva para ver los detalles de tu viaje
					</p>
				</div>

				{/* Buscador */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Buscar por Código de Reserva</CardTitle>
						<CardDescription>
							El código tiene el formato: AR-YYYYMMDD-XXXX (Ej:
							AR-20251015-0001)
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex gap-4">
							<div className="flex-1">
								<Label htmlFor="codigo">Código de Reserva</Label>
								<Input
									id="codigo"
									placeholder="AR-20251015-0001"
									value={codigoReserva}
									onChange={(e) =>
										setCodigoReserva(e.target.value.toUpperCase())
									}
									onKeyPress={(e) => e.key === "Enter" && buscarReserva()}
									className="font-mono"
								/>
							</div>
							<div className="flex items-end">
								<Button
									onClick={buscarReserva}
									disabled={loading}
									className="gap-2"
								>
									{loading ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Buscando...
										</>
									) : (
										<>
											<Search className="w-4 h-4" />
											Buscar
										</>
									)}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Error */}
				{error && (
					<Card className="mb-8 border-red-200 bg-red-50">
						<CardContent className="pt-6">
							<div className="flex items-center gap-2 text-red-800">
								<AlertCircle className="w-5 h-5" />
								<p>{error}</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Resultado */}
				{reserva && (
					<div className="space-y-6">
						{/* Código de Reserva Destacado */}
						<Card className="border-2 border-chocolate-200 bg-chocolate-50">
							<CardContent className="pt-6">
								<div className="flex items-center justify-between">
									<div>
										<Label className="text-chocolate-700 text-sm font-medium">
											Código de Reserva
										</Label>
										<p className="text-3xl font-bold text-chocolate-900 tracking-wider font-mono">
											{reserva.codigoReserva}
										</p>
									</div>
									<div className="flex gap-2">
										{getEstadoBadge(reserva.estado)}
										{getEstadoPagoBadge(reserva.estadoPago)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Información del Cliente */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<User className="w-5 h-5" />
									Información del Cliente
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Nombre</Label>
										<p className="font-medium">{reserva.nombre}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Email</Label>
										<p className="font-medium flex items-center gap-2">
											<Mail className="w-4 h-4 text-muted-foreground" />
											{reserva.email}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Teléfono</Label>
										<p className="font-medium flex items-center gap-2">
											<Phone className="w-4 h-4 text-muted-foreground" />
											{reserva.telefono}
										</p>
									</div>
									{reserva.rut && (
										<div>
											<Label className="text-muted-foreground">RUT</Label>
											<p className="font-medium">{reserva.rut}</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Detalles del Viaje */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPin className="w-5 h-5" />
									Detalles del Viaje
								</CardTitle>
							</CardHeader>
							<CardContent>
								{/* Indicador del tipo de viaje */}
								{reserva.idaVuelta && (
									<div className="mb-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
										</svg>
										<span className="font-semibold text-sm">Viaje Ida y Vuelta</span>
									</div>
								)}

								{/* Viaje de Ida */}
								<div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-4 mb-4">
									<h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
										</svg>
										VIAJE DE IDA
									</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<Label className="text-green-700 font-medium">Origen</Label>
											<p className="font-semibold text-gray-900">{reserva.origen}</p>
										</div>
										<div>
											<Label className="text-green-700 font-medium">Destino</Label>
											<p className="font-semibold text-gray-900">{reserva.destino}</p>
										</div>
										<div>
											<Label className="text-green-700 font-medium">📅 Fecha</Label>
											<p className="font-semibold text-gray-900 flex items-center gap-2">
												<Calendar className="w-4 h-4 text-green-700" />
												{formatDate(reserva.fecha)}
											</p>
										</div>
										<div>
											<Label className="text-green-700 font-medium">🕐 Hora de Recogida</Label>
											<p className="font-semibold text-gray-900 flex items-center gap-2">
												<Clock className="w-4 h-4 text-green-700" />
												{reserva.hora || "No especificada"}
											</p>
										</div>
									</div>
								</div>

								{/* Viaje de Vuelta - SOLO si es ida y vuelta */}
								{reserva.idaVuelta && (
									<div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
										<h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
											</svg>
											VIAJE DE VUELTA
										</h4>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<Label className="text-blue-700 font-medium">Origen</Label>
												<p className="font-semibold text-gray-900">{reserva.destino}</p>
											</div>
											<div>
												<Label className="text-blue-700 font-medium">Destino</Label>
												<p className="font-semibold text-gray-900">{reserva.origen}</p>
											</div>
											<div>
												<Label className="text-blue-700 font-medium">📅 Fecha de Regreso</Label>
												<p className="font-semibold text-gray-900 flex items-center gap-2">
													<Calendar className="w-4 h-4 text-blue-700" />
													{reserva.fechaRegreso ? formatDate(reserva.fechaRegreso) : "⚠️ No especificada"}
												</p>
											</div>
											<div>
												<Label className="text-blue-700 font-medium">🕐 Hora de Recogida</Label>
												<p className="font-semibold text-gray-900 flex items-center gap-2">
													<Clock className="w-4 h-4 text-blue-700" />
													{reserva.horaRegreso || "⚠️ No especificada"}
												</p>
											</div>
										</div>
										
										{/* Advertencia si falta información */}
										{(!reserva.fechaRegreso || !reserva.horaRegreso) && (
											<div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
												<svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
												</svg>
												<div>
													<p className="text-sm font-semibold text-yellow-800">Información Incompleta del Viaje de Vuelta</p>
													<p className="text-xs text-yellow-700 mt-1">Nos comunicaremos contigo para confirmar la fecha y hora del regreso.</p>
												</div>
											</div>
										)}
									</div>
								)}

								{/* Información de pasajeros y vehículo */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
									<div>
										<Label className="text-muted-foreground">👥 Pasajeros</Label>
										<p className="font-medium flex items-center gap-2">
											<Users className="w-4 h-4 text-muted-foreground" />
											{reserva.pasajeros}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">🚙 Vehículo</Label>
										<p className="font-medium">
											{reserva.vehiculo || "Por asignar"}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Información de Pago */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<DollarSign className="w-5 h-5" />
									Información de Pago
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Precio Base</Label>
										<p className="font-medium">
											{formatCurrency(reserva.precio)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Total a Pagar
										</Label>
										<p className="font-medium text-lg text-green-600">
											{formatCurrency(reserva.totalConDescuento)}
										</p>
									</div>
									{reserva.abonoSugerido > 0 && (
										<>
											<div>
												<Label className="text-muted-foreground">
													Abono Sugerido
												</Label>
												<p className="font-medium">
													{formatCurrency(reserva.abonoSugerido)}
												</p>
											</div>
											<div>
												<Label className="text-muted-foreground">
													Saldo Pendiente
												</Label>
												<p className="font-medium">
													{formatCurrency(reserva.saldoPendiente)}
												</p>
											</div>
										</>
									)}
								</div>

								{/* Acciones de pago si está pendiente */}
								{reserva.estadoPago !== "pagado" && (
									<div className="mt-6 space-y-3">
										{payError && (
											<div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm">
												<AlertCircle className="w-4 h-4" />
												<span>{payError}</span>
											</div>
										)}
										<div className="flex flex-wrap gap-3">
											{paymentOptions.map((option) => (
												<Button
													key={option.tipo}
													onClick={() =>
														continuarPago(option.tipo, option.monto)
													}
													disabled={paying}
													variant={option.variant}
													className={`gap-2 ${option.className || ""}`}
												>
													{paying ? (
														<>
															<Loader2 className="w-4 h-4 animate-spin" />
															Generando pago...
														</>
													) : (
														<>
															<CreditCard className="w-4 h-4" />
															{option.texto}
														</>
													)}
												</Button>
											))}
										</div>
										<p className="text-xs text-muted-foreground">
											Se abrirá una ventana para completar el pago de forma
											segura con Flow.
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Productos Adicionales - Similar a Uber Eats */}
						<ProductosReserva
							reservaId={reserva.id}
							reserva={reserva}
							onTotalProductosChange={setTotalProductos}
						/>

						{/* Servicios Adicionales */}
						{(reserva.numeroVuelo ||
							reserva.hotel ||
							reserva.equipajeEspecial ||
							reserva.sillaInfantil) && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<FileText className="w-5 h-5" />
										Servicios Adicionales
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{reserva.numeroVuelo && (
											<div>
												<Label className="text-muted-foreground">
													Número de Vuelo
												</Label>
												<p className="font-medium">{reserva.numeroVuelo}</p>
											</div>
										)}
										{reserva.hotel && (
											<div>
												<Label className="text-muted-foreground">Hotel</Label>
												<p className="font-medium">{reserva.hotel}</p>
											</div>
										)}
										{reserva.equipajeEspecial && (
											<div>
												<Label className="text-muted-foreground">
													Equipaje Especial
												</Label>
												<p className="font-medium">
													{reserva.equipajeEspecial}
												</p>
											</div>
										)}
										{reserva.sillaInfantil && (
											<div>
												<Label className="text-muted-foreground">
													Silla Infantil
												</Label>
												<p className="font-medium">✅ Requerida</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Observaciones */}
						{reserva.mensaje && (
							<Card>
								<CardHeader>
									<CardTitle>Observaciones</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-slate-700">{reserva.mensaje}</p>
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
