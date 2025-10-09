import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { CheckCircle2, LoaderCircle, Clock } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

function CompletarDetalles() {
	const [reservaId, setReservaId] = useState(null);
	const [reserva, setReserva] = useState(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	const [detalles, setDetalles] = useState({
		hora: "",
		numeroVuelo: "",
		hotel: "",
		sillaInfantil: "no",
		equipajeEspecial: "",
		mensaje: "",
	});

	const timeOptions = generateTimeOptions();

	// Obtener reservaId de la URL
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const id = params.get("reservaId");
		if (id) {
			setReservaId(id);
		} else {
			setError("No se encontró el ID de la reserva en la URL");
			setLoading(false);
		}
	}, []);

	// Cargar datos de la reserva
	useEffect(() => {
		const cargarReserva = async () => {
			if (!reservaId) return;

			try {
				setLoading(true);
				const response = await fetch(`${API_BASE_URL}/api/reservas/${reservaId}`);

				if (!response.ok) {
					throw new Error("No se pudo cargar la reserva");
				}

				const data = await response.json();
				setReserva(data);

				// Pre-llenar con datos existentes si los hay
				setDetalles({
					hora: data.hora || "",
					numeroVuelo: data.numeroVuelo || "",
					hotel: data.hotel || "",
					sillaInfantil: data.sillaInfantil ? "si" : "no",
					equipajeEspecial: data.equipajeEspecial || "",
					mensaje: data.mensaje || "",
				});
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		cargarReserva();
	}, [reservaId]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setDetalles((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleTimeChange = (value) => {
		setDetalles((prev) => ({
			...prev,
			hora: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!detalles.hora) {
			setError("Por favor, selecciona la hora de recogida");
			return;
		}

		try {
			setSubmitting(true);
			setError(null);

			const response = await fetch(
				`${API_BASE_URL}/completar-reserva-detalles/${reservaId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(detalles),
				}
			);

			if (!response.ok) {
				throw new Error("No se pudieron actualizar los detalles");
			}

			const data = await response.json();
			
			if (data.success) {
				setSuccess(true);
				// Actualizar la reserva con los nuevos datos
				setReserva(data.reserva);
			} else {
				throw new Error(data.message || "Error al actualizar detalles");
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<LoaderCircle className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
					<p className="text-gray-600">Cargando información de tu reserva...</p>
				</div>
			</div>
		);
	}

	if (error && !reserva) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
				<Card className="max-w-md w-full">
					<CardContent className="p-6">
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
						<div className="mt-4">
							<Button
								onClick={() => (window.location.href = "/")}
								variant="outline"
								className="w-full"
							>
								Volver al inicio
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
				<Card className="max-w-2xl w-full">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
								<CheckCircle2 className="w-8 h-8 text-white" />
							</div>
							<div>
								<CardTitle className="text-2xl text-green-900">
									¡Detalles actualizados correctamente!
								</CardTitle>
								<p className="text-green-700 mt-1">
									Tu reserva está confirmada
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="bg-white rounded-lg p-6 shadow-sm">
							<h3 className="font-semibold text-lg mb-4">Resumen de tu reserva</h3>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-gray-600">Origen</p>
									<p className="font-semibold">{reserva.origen}</p>
								</div>
								<div>
									<p className="text-gray-600">Destino</p>
									<p className="font-semibold">{reserva.destino}</p>
								</div>
								<div>
									<p className="text-gray-600">Fecha</p>
									<p className="font-semibold">
										{new Date(reserva.fecha).toLocaleDateString("es-CL")}
									</p>
								</div>
								<div>
									<p className="text-gray-600">Hora de recogida</p>
									<p className="font-semibold">{detalles.hora} hrs</p>
								</div>
								<div>
									<p className="text-gray-600">Pasajeros</p>
									<p className="font-semibold">{reserva.pasajeros}</p>
								</div>
								{detalles.numeroVuelo && (
									<div>
										<p className="text-gray-600">Número de vuelo</p>
										<p className="font-semibold">{detalles.numeroVuelo}</p>
									</div>
								)}
								{detalles.hotel && (
									<div className="col-span-2">
										<p className="text-gray-600">Hotel/Dirección</p>
										<p className="font-semibold">{detalles.hotel}</p>
									</div>
								)}
							</div>
						</div>

						<Alert>
							<AlertDescription>
								Recibirás un correo de confirmación con todos los detalles de tu reserva.
								Si tienes alguna pregunta, no dudes en contactarnos.
							</AlertDescription>
						</Alert>

						<Button
							onClick={() => (window.location.href = "/")}
							className="w-full"
						>
							Volver al inicio
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
			<div className="max-w-3xl mx-auto">
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
								<Clock className="w-6 h-6 text-white" />
							</div>
							<div>
								<CardTitle className="text-2xl">Completa los detalles de tu reserva</CardTitle>
								<p className="text-sm text-muted-foreground mt-1">
									Tu pago ha sido confirmado. Ahora necesitamos algunos detalles adicionales.
								</p>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-6">
						{/* Resumen de la reserva pagada */}
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<div className="flex items-start gap-2">
								<CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
								<div className="flex-1">
									<h3 className="font-semibold text-green-900 mb-2">
										✅ Reserva confirmada y pagada
									</h3>
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>
											<span className="text-green-700">Origen:</span>{" "}
											<span className="font-medium text-green-900">{reserva.origen}</span>
										</div>
										<div>
											<span className="text-green-700">Destino:</span>{" "}
											<span className="font-medium text-green-900">{reserva.destino}</span>
										</div>
										<div>
											<span className="text-green-700">Fecha:</span>{" "}
											<span className="font-medium text-green-900">
												{new Date(reserva.fecha).toLocaleDateString("es-CL")}
											</span>
										</div>
										<div>
											<span className="text-green-700">Pasajeros:</span>{" "}
											<span className="font-medium text-green-900">{reserva.pasajeros}</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{/* Formulario para completar detalles */}
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="hora" className="text-base font-semibold">
										Hora de recogida <span className="text-red-500">*</span>
									</Label>
									<Select value={detalles.hora} onValueChange={handleTimeChange}>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona la hora de recogida" />
										</SelectTrigger>
										<SelectContent>
											{timeOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground">
										Hora en la que te recogeremos en el punto de origen
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="numeroVuelo">Número de vuelo (opcional)</Label>
										<Input
											id="numeroVuelo"
											name="numeroVuelo"
											value={detalles.numeroVuelo}
											onChange={handleInputChange}
											placeholder="Ej: LA123"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="sillaInfantil">¿Necesitas alzador infantil?</Label>
										<select
											id="sillaInfantil"
											name="sillaInfantil"
											value={detalles.sillaInfantil}
											onChange={handleInputChange}
											className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
										>
											<option value="no">No requiero</option>
											<option value="1 silla">Sí, 1 alzador</option>
											<option value="2 sillas">Sí, 2 alzadores</option>
										</select>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="hotel">Hotel o dirección final (opcional)</Label>
									<Input
										id="hotel"
										name="hotel"
										value={detalles.hotel}
										onChange={handleInputChange}
										placeholder="Ej: Hotel Antumalal, Pucón"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="equipajeEspecial">
										Equipaje especial o comentarios (opcional)
									</Label>
									<Textarea
										id="equipajeEspecial"
										name="equipajeEspecial"
										value={detalles.equipajeEspecial}
										onChange={handleInputChange}
										placeholder="Cuéntanos sobre equipaje voluminoso, mascotas u otros detalles..."
										rows={3}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="mensaje">Mensaje adicional para el conductor (opcional)</Label>
									<Textarea
										id="mensaje"
										name="mensaje"
										value={detalles.mensaje}
										onChange={handleInputChange}
										placeholder="Cualquier información adicional que quieras compartir..."
										rows={2}
									/>
								</div>
							</div>

							<div className="flex gap-3">
								<Button
									type="submit"
									disabled={submitting || !detalles.hora}
									className="flex-1"
								>
									{submitting ? (
										<>
											<LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
											Guardando...
										</>
									) : (
										"Confirmar detalles"
									)}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => (window.location.href = "/")}
								>
									Volver
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<p className="text-center text-sm text-muted-foreground mt-6">
					¿Tienes problemas? Contáctanos al{" "}
					<a href="tel:+56912345678" className="font-medium text-primary hover:underline">
						+56 9 1234 5678
					</a>
				</p>
			</div>
		</div>
	);
}

export default CompletarDetalles;
