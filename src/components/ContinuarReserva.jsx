import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "./ui/dialog";
import {
	Search,
	LoaderCircle,
	CheckCircle2,
	AlertCircle,
	AlertTriangle,
	MapPin,
	Calendar,
	Clock,
	Users,
	CreditCard,
	FileText,
} from "lucide-react";

import { getBackendUrl } from "../lib/backend";

// Función para formatear precio
const formatCurrency = (amount) => {
	return new Intl.NumberFormat("es-CL", {
		style: "currency",
		currency: "CLP",
	}).format(amount);
};

// Función para formatear fecha
const formatDate = (dateString) => {
	if (!dateString) return "-";
	const date = new Date(dateString);
	return date.toLocaleDateString("es-CL", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

function ContinuarReserva({ onComplete, onCancel, onPayReservation }) {
	const [reservaId, setReservaId] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [reservaEncontrada, setReservaEncontrada] = useState(null);
	const [observaciones, setObservaciones] = useState("");
	const [guardandoObservaciones, setGuardandoObservaciones] = useState(false);

	const buscarReserva = async (e) => {
		e.preventDefault();
		if (!reservaId.trim()) {
			setError("Por favor, ingresa un ID de reserva");
			return;
		}

		setLoading(true);
		setError("");
		setReservaEncontrada(null);

		try {
			const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(`${apiUrl}/api/reservas/${reservaId.trim()}`);

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("No se encontró una reserva con ese ID");
				}
				throw new Error("Error al buscar la reserva");
			}

			const data = await response.json();
			setReservaEncontrada(data.reserva);

			// Pre-cargar observaciones existentes si las hay
			if (data.reserva.observaciones) {
				setObservaciones(data.reserva.observaciones);
			}
		} catch (err) {
			console.error("Error buscando reserva:", err);
			setError(err.message || "No se pudo cargar la información de la reserva");
		} finally {
			setLoading(false);
		}
	};

	const guardarObservaciones = async () => {
		if (!reservaEncontrada || !observaciones.trim()) {
			setError("Por favor, ingresa alguna observación");
			return;
		}

		setGuardandoObservaciones(true);
		setError("");

		try {
			const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(
				`${apiUrl}/api/reservas/${reservaEncontrada.id}/observaciones`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						observaciones: observaciones.trim(),
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Error al guardar las observaciones");
			}

			// Mostrar confirmación y cerrar
			alert("✅ Observaciones guardadas exitosamente");
			if (onComplete) {
				onComplete();
			}
		} catch (err) {
			console.error("Error guardando observaciones:", err);
			setError("No se pudieron guardar las observaciones. Intenta de nuevo.");
		} finally {
			setGuardandoObservaciones(false);
		}
	};

	const handleContinuarPago = () => {
		if (onPayReservation && reservaEncontrada) {
			onPayReservation(reservaEncontrada);
		}
	};

	const handleCerrar = () => {
		setReservaId("");
		setReservaEncontrada(null);
		setError("");
		setObservaciones("");
		if (onCancel) {
			onCancel();
		}
	};

	// Determinar el estado de la reserva
	const getEstadoBadge = (estado) => {
		const estados = {
			pendiente: { color: "bg-yellow-500", text: "Pendiente" },
			confirmada: { color: "bg-chocolate-500", text: "Confirmada" },
			completada: { color: "bg-green-500", text: "Completada" },
			cancelada: { color: "bg-red-500", text: "Cancelada" },
		};
		const info = estados[estado?.toLowerCase()] || {
			color: "bg-gray-500",
			text: estado || "Desconocido",
		};
		return (
			<Badge className={`${info.color} text-white`}>{info.text}</Badge>
		);
	};

	const getEstadoPagoBadge = (estadoPago) => {
		const estados = {
			pendiente: { color: "bg-orange-500", text: "Pago Pendiente" },
			pagado: { color: "bg-green-500", text: "Pagado" },
			parcial: { color: "bg-yellow-500", text: "Pago Parcial" },
			reembolsado: { color: "bg-purple-500", text: "Reembolsado" },
		};
		const info = estados[estadoPago?.toLowerCase()] || {
			color: "bg-gray-500",
			text: estadoPago || "Sin info",
		};
		return (
			<Badge className={`${info.color} text-white`}>{info.text}</Badge>
		);
	};

	return (
		<div className="w-full">
			<Card className="bg-white/95 backdrop-blur-sm shadow-lg border">
				<CardHeader>
					<CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
						<Search className="h-6 w-6 text-primary" />
						Continuar con una reserva existente
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Ingresa el ID de tu reserva para continuar con el proceso o agregar
						detalles adicionales
					</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={buscarReserva} className="space-y-4">
						<div className="flex gap-3">
							<div className="flex-1 space-y-2">
								<Label htmlFor="reserva-id">ID de Reserva</Label>
								<Input
									id="reserva-id"
									type="text"
									placeholder="Ej: 12345"
									value={reservaId}
									onChange={(e) => setReservaId(e.target.value)}
									disabled={loading}
									className="text-lg"
								/>
							</div>
							<div className="flex items-end">
								<Button
									type="submit"
									disabled={loading || !reservaId.trim()}
									className="bg-primary hover:bg-primary/90"
								>
									{loading ? (
										<>
											<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
											Buscando...
										</>
									) : (
										<>
											<Search className="mr-2 h-4 w-4" />
											Buscar
										</>
									)}
								</Button>
							</div>
						</div>

						{error && (
							<div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
								<AlertCircle className="h-5 w-5" />
								<span>{error}</span>
							</div>
						)}
					</form>
				</CardContent>
			</Card>

			{/* Dialog para mostrar información de la reserva */}
			<Dialog
				open={!!reservaEncontrada}
				onOpenChange={(open) => {
					if (!open) handleCerrar();
				}}
			>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold">
							Reserva #{reservaEncontrada?.id}
						</DialogTitle>
						<DialogDescription>
							Información detallada de tu reserva
						</DialogDescription>
					</DialogHeader>

					{reservaEncontrada && (
						<div className="space-y-6">
							{/* Estados */}
							<div className="flex gap-2 flex-wrap">
								{getEstadoBadge(reservaEncontrada.estado)}
								{getEstadoPagoBadge(reservaEncontrada.estadoPago)}
							</div>

							{/* Información del viaje */}
							<Card className="bg-gray-50">
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="text-lg">Detalles del viaje</CardTitle>
										{reservaEncontrada.idaVuelta ? (
											<Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
												🔄 Ida y Vuelta
											</Badge>
										) : (
											<Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
												➡️ Solo Ida
											</Badge>
										)}
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									{/* Tarjeta de VIAJE DE IDA */}
									<div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
										<h5 className="font-semibold text-blue-900 text-sm mb-2 flex items-center gap-2">
											🚗 VIAJE DE IDA
										</h5>
										<div className="space-y-2">
											<div className="flex items-center gap-2 text-sm">
												<MapPin className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium">Ruta:</span>
												<span>
													{reservaEncontrada.origen} → {reservaEncontrada.destino}
												</span>
											</div>
											<div className="flex items-center gap-2 text-sm">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium">Fecha:</span>
												<span>{formatDate(reservaEncontrada.fecha)}</span>
											</div>
											{reservaEncontrada.hora && (
												<div className="flex items-center gap-2 text-sm">
													<Clock className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">Hora:</span>
													<span>{reservaEncontrada.hora}</span>
												</div>
											)}
											<div className="flex items-center gap-2 text-sm">
												<Users className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium">Pasajeros:</span>
												<span>{reservaEncontrada.pasajeros}</span>
											</div>
										</div>
									</div>

									{/* Tarjeta de VIAJE DE VUELTA */}
									{reservaEncontrada.idaVuelta && (
										<div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
											<h5 className="font-semibold text-green-900 text-sm mb-2 flex items-center gap-2">
												🚗 VIAJE DE VUELTA
											</h5>
											<div className="space-y-2">
												<div className="flex items-center gap-2 text-sm">
													<MapPin className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">Ruta:</span>
													<span>
														{reservaEncontrada.destino} → {reservaEncontrada.origen}
													</span>
												</div>
												<div className="flex items-center gap-2 text-sm">
													<Calendar className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">Fecha Regreso:</span>
													<span>{reservaEncontrada.fechaRegreso ? formatDate(reservaEncontrada.fechaRegreso) : "-"}</span>
												</div>
												<div className="flex items-center gap-2 text-sm">
													<Clock className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">Hora Regreso:</span>
													<span>{reservaEncontrada.horaRegreso || "No especificada"}</span>
												</div>
												<div className="flex items-center gap-2 text-sm">
													<Users className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">Pasajeros:</span>
													<span>{reservaEncontrada.pasajeros}</span>
												</div>
											</div>
										</div>
									)}

									{/* Alerta de información faltante */}
									{reservaEncontrada.idaVuelta && (!reservaEncontrada.fechaRegreso || !reservaEncontrada.horaRegreso) && (
										<div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
											<div className="flex items-start gap-2">
												<AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
												<div>
													<p className="font-semibold text-yellow-800 text-xs">
														⚠️ Información Incompleta del Viaje de Vuelta
													</p>
													<p className="text-xs text-yellow-700 mt-1">
														Esta reserva está marcada como "Ida y Vuelta" pero falta:
														{!reservaEncontrada.fechaRegreso && " Fecha de Regreso"}
														{!reservaEncontrada.fechaRegreso && !reservaEncontrada.horaRegreso && " y"}
														{!reservaEncontrada.horaRegreso && " Hora de Regreso"}
													</p>
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Información del cliente */}
							<Card className="bg-gray-50">
								<CardHeader>
									<CardTitle className="text-lg">
										Información de contacto
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2 text-sm">
									<div>
										<span className="font-medium">Nombre:</span>{" "}
										{reservaEncontrada.nombre}
									</div>
									<div>
										<span className="font-medium">Email:</span>{" "}
										{reservaEncontrada.email}
									</div>
									<div>
										<span className="font-medium">Teléfono:</span>{" "}
										{reservaEncontrada.telefono}
									</div>
								</CardContent>
							</Card>

							{/* Información de pago */}
							{reservaEncontrada.precioTotal && (
								<Card className="bg-gray-50">
									<CardHeader>
										<CardTitle className="text-lg flex items-center gap-2">
											<CreditCard className="h-5 w-5" />
											Información de pago
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2 text-sm">
										<div>
											<span className="font-medium">Total:</span>{" "}
											{formatCurrency(reservaEncontrada.precioTotal)}
										</div>
										{reservaEncontrada.metodoPago && (
											<div>
												<span className="font-medium">Método de pago:</span>{" "}
												{reservaEncontrada.metodoPago}
											</div>
										)}
									</CardContent>
								</Card>
							)}

							{/* Sección de observaciones */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<FileText className="h-5 w-5 text-muted-foreground" />
									<Label htmlFor="observaciones" className="text-base font-medium">
										Observaciones adicionales
									</Label>
								</div>
								<Textarea
									id="observaciones"
									placeholder="Agrega cualquier detalle adicional (equipaje especial, necesidades especiales, etc.)"
									value={observaciones}
									onChange={(e) => setObservaciones(e.target.value)}
									rows={4}
								/>
								<p className="text-xs text-muted-foreground">
									Puedes agregar o actualizar información adicional sobre tu
									reserva
								</p>
							</div>

							{/* Acciones según el estado */}
							<DialogFooter className="flex flex-col sm:flex-row gap-3">
								<Button
									variant="outline"
									onClick={handleCerrar}
									disabled={guardandoObservaciones}
								>
									Cerrar
								</Button>

								{observaciones.trim() !== reservaEncontrada.observaciones && (
									<Button
										onClick={guardarObservaciones}
										disabled={guardandoObservaciones || !observaciones.trim()}
										className="bg-chocolate-600 hover:bg-chocolate-700"
									>
										{guardandoObservaciones ? (
											<>
												<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
												Guardando...
											</>
										) : (
											<>
												<CheckCircle2 className="mr-2 h-4 w-4" />
												Guardar observaciones
											</>
										)}
									</Button>
								)}

								{reservaEncontrada.estadoPago?.toLowerCase() !==
									"pagado" && (
									<Button
										onClick={handleContinuarPago}
										className="bg-green-600 hover:bg-green-700"
									>
										<CreditCard className="mr-2 h-4 w-4" />
										Continuar con el pago
									</Button>
								)}

								{reservaEncontrada.estadoPago?.toLowerCase() === "pagado" &&
									(!reservaEncontrada.hora ||
										!reservaEncontrada.hotel) && (
										<Button
											onClick={() => {
												if (onComplete) {
													onComplete(reservaEncontrada.id);
												}
											}}
											className="bg-primary hover:bg-primary/90"
										>
											<CheckCircle2 className="mr-2 h-4 w-4" />
											Completar detalles
										</Button>
									)}
							</DialogFooter>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default ContinuarReserva;
