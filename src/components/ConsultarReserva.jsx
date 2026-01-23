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
	AlertTriangle,
	CheckCircle2,
	Loader2,
	FileText,
	CreditCard,
} from "lucide-react";

import { getBackendUrl } from "../lib/backend";
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

			if (!monto || monto <= 0) {
				throw new Error("No hay monto disponible para generar el pago");
			}
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
					amount: monto,
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
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2">
										<MapPin className="w-5 h-5" />
										Detalles del Viaje
									</CardTitle>
									{reserva.idaVuelta ? (
										<Badge className="bg-blue-600 hover:bg-blue-700 text-white">
											🔄 Ida y Vuelta
										</Badge>
									) : (
										<Badge className="bg-green-600 hover:bg-green-700 text-white">
											➡️ Solo Ida
										</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{/* Tarjeta de VIAJE DE IDA */}
									<div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
										<h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
											🚗 VIAJE DE IDA
										</h4>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<Label className="text-muted-foreground">Origen</Label>
												<p className="font-medium">{reserva.origen}</p>
											</div>
											<div>
												<Label className="text-muted-foreground">Destino</Label>
												<p className="font-medium">{reserva.destino}</p>
											</div>
											<div>
												<Label className="text-muted-foreground">Fecha</Label>
												<p className="font-medium flex items-center gap-2">
													<Calendar className="w-4 h-4 text-muted-foreground" />
													{formatDate(reserva.fecha)}
												</p>
											</div>
											<div>
												<Label className="text-muted-foreground">Hora</Label>
												<p className="font-medium flex items-center gap-2">
													<Clock className="w-4 h-4 text-muted-foreground" />
													{reserva.hora || "No especificada"}
												</p>
											</div>
											<div>
												<Label className="text-muted-foreground">Pasajeros</Label>
												<p className="font-medium flex items-center gap-2">
													<Users className="w-4 h-4 text-muted-foreground" />
													{reserva.pasajeros}
												</p>
											</div>
											<div>
												<Label className="text-muted-foreground">Vehículo</Label>
												<p className="font-medium">
													{reserva.vehiculo || "Por asignar"}
												</p>
											</div>
										</div>
									</div>

									{/* Tarjeta de VIAJE DE VUELTA */}
									{reserva.idaVuelta && (
										<div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
											<h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
												🚗 VIAJE DE VUELTA
											</h4>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<Label className="text-muted-foreground">Origen (Regreso)</Label>
													<p className="font-medium">{reserva.destino}</p>
												</div>
												<div>
													<Label className="text-muted-foreground">Destino (Regreso)</Label>
													<p className="font-medium">{reserva.origen}</p>
												</div>
												<div>
													<Label className="text-muted-foreground">
														Fecha Regreso
													</Label>
													<p className="font-medium flex items-center gap-2">
														<Calendar className="w-4 h-4 text-muted-foreground" />
														{reserva.fechaRegreso ? formatDate(reserva.fechaRegreso) : "-"}
													</p>
												</div>
												<div>
													<Label className="text-muted-foreground">
														Hora Regreso
													</Label>
													<p className="font-medium flex items-center gap-2">
														<Clock className="w-4 h-4 text-muted-foreground" />
														{reserva.horaRegreso || "No especificada"}
													</p>
												</div>
												<div>
													<Label className="text-muted-foreground">Pasajeros</Label>
													<p className="font-medium flex items-center gap-2">
														<Users className="w-4 h-4 text-muted-foreground" />
														{reserva.pasajeros}
													</p>
												</div>
												<div>
													<Label className="text-muted-foreground">Vehículo</Label>
													<p className="font-medium">
														{reserva.vehiculo || "Por asignar"}
													</p>
												</div>
											</div>
										</div>
									)}

									{/* Alerta de información faltante */}
									{reserva.idaVuelta && (!reserva.fechaRegreso || !reserva.horaRegreso) && (
										<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
											<div className="flex items-start gap-2">
												<AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
												<div>
													<p className="font-semibold text-yellow-800">
														⚠️ Información Incompleta del Viaje de Vuelta
													</p>
													<p className="text-sm text-yellow-700 mt-1">
														Esta reserva está marcada como "Ida y Vuelta" pero falta:
														{!reserva.fechaRegreso && " Fecha de Regreso"}
														{!reserva.fechaRegreso && !reserva.horaRegreso && " y"}
														{!reserva.horaRegreso && " Hora de Regreso"}
													</p>
												</div>
											</div>
										</div>
									)}
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
