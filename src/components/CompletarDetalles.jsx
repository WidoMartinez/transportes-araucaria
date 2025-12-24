import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	CheckCircle2,
	LoaderCircle,
	Clock,
	MapPin,
	Phone,
	Mail,
} from "lucide-react";

import { getBackendUrl } from "../lib/backend";

// Función para generar opciones de hora en intervalos de 15 minutos (6:00 AM - 8:00 PM)
const generateTimeOptions = () => {
	const options = [];
	for (let hour = 6; hour <= 20; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const timeString = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
			const displayTime = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
			options.push({ value: timeString, label: displayTime });
		}
	}
	return options;
};

function CompletarDetalles({ reservaId, onComplete, onCancel, initialAmount }) {
	const [reserva, setReserva] = useState(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const [detalles, setDetalles] = useState({
		hora: "",
		numeroVuelo: "",
		hotel: "",
		sillaInfantil: "no",
		equipajeEspecial: "",
		idaVuelta: false,
		fechaRegreso: "",
		horaRegreso: "",
	});

	const timeOptions = generateTimeOptions();

	// Cargar datos de la reserva
	useEffect(() => {
		const cargarReserva = async () => {
			if (!reservaId) {
				setError("ID de reserva no válido");
				setLoading(false);
				return;
			}

			try {
				const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
				const response = await fetch(`${apiUrl}/api/reservas/${reservaId}`);

				if (!response.ok) {
					throw new Error("No se pudo cargar la información de la reserva");
				}

				const data = await response.json();
				setReserva(data.reserva);

				// Pre-llenar campos si ya existen datos
				setDetalles({
					hora: data.reserva?.hora || "",
					numeroVuelo: data.reserva?.numeroVuelo || "",
					hotel: data.reserva?.hotel || "",
					sillaInfantil: data.reserva?.sillaInfantil ? "si" : "no",
					equipajeEspecial: data.reserva?.equipajeEspecial || "",
					idaVuelta: Boolean(data.reserva?.idaVuelta),
					fechaRegreso: data.reserva?.fechaRegreso || "",
					horaRegreso: data.reserva?.horaRegreso || "",
				});
			} catch (err) {
				console.error("Error cargando reserva:", err);
				setError("No se pudo cargar la información de la reserva");
			} finally {
				setLoading(false);
			}
		};


		cargarReserva();
	}, [reservaId]);

	// Tracking de conversión como respaldo (por si FlowReturn falló)
	useEffect(() => {
		// Esperar a que la reserva esté cargada para tener el valor real
		if (reservaId && reserva && typeof window.gtag === 'function') {
			// Usar un flag en sessionStorage para evitar duplicar el evento en la misma sesión
			const conversionKey = `conversion_sent_${reservaId}`;
			if (!sessionStorage.getItem(conversionKey)) {
				// Determinar el valor de la conversión
				// Determinar el valor de la conversión
				// FIXED: Priorizar initialAmount si existe (viene de la transacción real)
				let value = Number(initialAmount);
				
				// Si no hay initialAmount, usar fallback de reserva
				if (!value || value <= 0) {
					value = Number(reserva.totalConDescuento || reserva.precio || reserva.abonoSugerido || 0);
				}
				
				// Blindaje final: Nunca enviar 0 a Google Ads
				if (value <= 0) { 
					value = 1.0;
					console.warn("⚠️ Valor de conversión era 0, ajustado a 1.0 para tracking");
				}
				
				console.log("📊 Disparando conversión de respaldo en CompletarDetalles con valor:", value);
				window.gtag('event', 'conversion', {
					'send_to': 'AW-17529712870/yZz-CJqiicUbEObh6KZB',
					'value': value,
					'currency': 'CLP',
					'transaction_id': reservaId.toString()
				});
				sessionStorage.setItem(conversionKey, 'true');
			}
		}
	}, [reservaId, reserva]);

	const handleInputChange = (field, value) => {
		setDetalles((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		setError("");

		// Validaciones básicas
		if (!detalles.hora) {
			setError("Por favor, selecciona la hora de recogida.");
			setSubmitting(false);
			return;
		}

		if (detalles.idaVuelta && !detalles.fechaRegreso) {
			setError("Por favor, especifica la fecha de regreso.");
			setSubmitting(false);
			return;
		}

		if (detalles.idaVuelta && !detalles.horaRegreso) {
			setError("Por favor, especifica la hora de regreso.");
			setSubmitting(false);
			return;
		}

		try {
			const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(
				`${apiUrl}/completar-reserva-detalles/${reservaId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(detalles),
				}
			);

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || "Error al actualizar los detalles");
			}

			console.log("✅ Detalles completados exitosamente");
			setSuccess(true);

			// Llamar callback si existe
			if (onComplete) {
				onComplete(result.reserva);
			}
		} catch (err) {
			console.error("Error completando detalles:", err);
			setError(err.message || "Error interno del servidor");
		} finally {
			setSubmitting(false);
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return "No especificada";
		const date = new Date(dateString);
		return date.toLocaleDateString("es-CL", {
			dateStyle: "long",
			timeZone: "America/Santiago",
		});
	};

	const formatCurrency = (value) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(value || 0);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Card className="w-full max-w-md p-6 text-center">
					<LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">
						Cargando información de la reserva...
					</p>
				</Card>
			</div>
		);
	}

	if (error && !reserva) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Card className="w-full max-w-md p-6 text-center">
					<div className="text-red-500 mb-4">⚠️</div>
					<h3 className="font-semibold mb-2">Error</h3>
					<p className="text-muted-foreground mb-4">{error}</p>
					{onCancel && (
						<Button onClick={onCancel} variant="outline">
							Volver al inicio
						</Button>
					)}
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Card className="w-full max-w-md p-6 text-center">
					<CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
					<h3 className="text-2xl font-bold text-green-700 mb-2">
						¡Detalles completados!
					</h3>
					<p className="text-muted-foreground mb-6">
						Tu reserva ha sido actualizada exitosamente. Recibirás una
						confirmación por email con todos los detalles.
					</p>
					{onCancel && (
						<Button onClick={onCancel} className="w-full">
							Volver al inicio
						</Button>
					)}
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Header con confirmación de pago */}
				<div className="mb-8 text-center">
					<div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
						<CheckCircle2 className="h-5 w-5" />
						<span className="font-semibold">¡Pago confirmado!</span>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Completa los detalles de tu reserva
					</h1>
					<p className="text-lg text-muted-foreground">
						Ahora especifica los detalles de tu traslado para completar la
						reserva
					</p>
				</div>

				{/* Resumen de la reserva pagada */}
				{reserva && (
					<Card className="mb-8 border-green-200 bg-green-50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-green-800">
								<CheckCircle2 className="h-5 w-5" />
								Reserva confirmada - ID: #{reserva.id}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<MapPin className="h-4 w-4" />
										<span>Ruta</span>
									</div>
									<p className="font-semibold text-lg">
										{reserva.origen} → {reserva.destino}
									</p>
								</div>
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Clock className="h-4 w-4" />
										<span>Fecha</span>
									</div>
									<p className="font-semibold text-lg">
										{formatDate(reserva.fecha)}
									</p>
								</div>
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<span>💰</span>
										<span>Total pagado</span>
									</div>
									<p className="font-semibold text-lg text-green-600">
										{formatCurrency(reserva.totalConDescuento)}
									</p>
								</div>
							</div>

							<div className="mt-4 pt-4 border-t border-green-200">
								<div className="flex items-center gap-4 text-sm">
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4" />
										<span>{reserva.email}</span>
									</div>
									<div className="flex items-center gap-2">
										<Phone className="h-4 w-4" />
										<span>{reserva.telefono}</span>
									</div>
									<Badge variant="secondary">
										{reserva.pasajeros}{" "}
										{reserva.pasajeros === 1 ? "pasajero" : "pasajeros"}
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Formulario de detalles */}
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">
							Especifica los detalles de tu traslado
						</CardTitle>
						<p className="text-muted-foreground">
							Completa la información necesaria para coordinar tu traslado
						</p>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Hora de recogida */}
							<div className="space-y-2">
								<Label htmlFor="hora" className="text-base font-medium">
									<span className="flex items-center gap-2">
										<Clock className="h-4 w-4" />
										Hora de recogida *
									</span>
								</Label>
								<Select
									value={detalles.hora}
									onValueChange={(value) => handleInputChange("hora", value)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona la hora de recogida" />
									</SelectTrigger>
									<SelectContent>
										{timeOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label} hrs
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-sm text-muted-foreground">
									Coordinaremos la recogida según el horario seleccionado
								</p>
							</div>

							{/* Información del vuelo */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label
										htmlFor="numeroVuelo"
										className="text-base font-medium"
									>
										Número de vuelo (opcional)
									</Label>
									<Input
										id="numeroVuelo"
										value={detalles.numeroVuelo}
										onChange={(e) =>
											handleInputChange("numeroVuelo", e.target.value)
										}
										placeholder="Ej: LA123, JA456"
									/>
									<p className="text-sm text-muted-foreground">
										Nos ayuda a monitorear retrasos del vuelo
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="hotel" className="text-base font-medium">
										Hotel o dirección final
									</Label>
									<Input
										id="hotel"
										value={detalles.hotel}
										onChange={(e) => handleInputChange("hotel", e.target.value)}
										placeholder="Ej: Hotel Antumalal, Calle Principal 123"
									/>
									<p className="text-sm text-muted-foreground">
										Dirección específica dentro del destino
									</p>
								</div>
							</div>

							{/* Silla infantil */}
							<div className="space-y-2">
								<Label
									htmlFor="sillaInfantil"
									className="text-base font-medium"
								>
									¿Necesitas alzador infantil?
								</Label>
								<Select
									value={detalles.sillaInfantil}
									onValueChange={(value) =>
										handleInputChange("sillaInfantil", value)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="no">No requiero</SelectItem>
										<SelectItem value="1 silla">Sí, 1 alzador</SelectItem>
										<SelectItem value="2 sillas">Sí, 2 alzadores</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Equipaje especial */}
							<div className="space-y-2">
								<Label
									htmlFor="equipajeEspecial"
									className="text-base font-medium"
								>
									Equipaje extra o comentarios especiales
								</Label>
								<Textarea
									id="equipajeEspecial"
									value={detalles.equipajeEspecial}
									onChange={(e) =>
										handleInputChange("equipajeEspecial", e.target.value)
									}
									placeholder="Cuéntanos sobre equipaje voluminoso, mascotas, requerimientos especiales, etc."
									rows={3}
								/>
							</div>

							{/* Ida y vuelta */}
							<div className="rounded-lg border border-muted/40 bg-muted/10 p-4 space-y-4">
								<div className="flex items-start gap-3">
									<Checkbox
										id="ida-vuelta"
										checked={detalles.idaVuelta}
										onCheckedChange={(value) => {
											const isRoundTrip = Boolean(value);
											handleInputChange("idaVuelta", isRoundTrip);
											if (!isRoundTrip) {
												handleInputChange("fechaRegreso", "");
												handleInputChange("horaRegreso", "");
											}
										}}
									/>
									<label
										htmlFor="ida-vuelta"
										className="text-sm font-medium leading-relaxed cursor-pointer"
									>
										¿También necesitas el regreso?
										<span className="block text-muted-foreground font-normal">
											Coordina ida y vuelta en una sola reserva
										</span>
									</label>
								</div>

								{detalles.idaVuelta && (
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-4 border-t border-muted/40">
										<div className="space-y-2">
											<Label htmlFor="fecha-regreso">Fecha de regreso</Label>
											<Input
												id="fecha-regreso"
												type="date"
												value={detalles.fechaRegreso}
												onChange={(e) =>
													handleInputChange("fechaRegreso", e.target.value)
												}
												min={reserva?.fecha}
												required={detalles.idaVuelta}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="hora-regreso">Hora de regreso</Label>
											<Select
												value={detalles.horaRegreso}
												onValueChange={(value) =>
													handleInputChange("horaRegreso", value)
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Selecciona la hora de regreso" />
												</SelectTrigger>
												<SelectContent>
													{timeOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label} hrs
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
								)}
							</div>

							{/* Error message */}
							{error && (
								<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
									⚠️ {error}
								</div>
							)}

							{/* Botones */}
							<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between pt-6 border-t">
								{onCancel && (
									<Button
										type="button"
										variant="outline"
										onClick={onCancel}
										disabled={submitting}
										className="w-full sm:w-auto"
									>
										Cancelar
									</Button>
								)}

								<Button
									type="submit"
									disabled={submitting || !detalles.hora}
									className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
								>
									{submitting ? (
										<>
											<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
											Guardando detalles...
										</>
									) : (
										"✅ Completar reserva"
									)}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default CompletarDetalles;
