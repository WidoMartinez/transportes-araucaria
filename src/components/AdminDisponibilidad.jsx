// src/components/AdminDisponibilidad.jsx
import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Switch } from "./ui/switch";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { AlertCircle, CheckCircle2, Save, Info } from "lucide-react";

function AdminDisponibilidad() {
	const { authenticatedFetch } = useAuthenticatedFetch();
	const [configuracion, setConfiguracion] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Cargar configuración actual
	useEffect(() => {
		cargarConfiguracion();
	}, []);

	const cargarConfiguracion = async () => {
		try {
			setLoading(true);
			setError("");
			const response = await authenticatedFetch(
				`/api/disponibilidad/configuracion`
			);

			if (!response.ok) {
				throw new Error("Error al cargar la configuración");
			}

			const data = await response.json();
			setConfiguracion(data);
		} catch (err) {
			console.error("Error cargando configuración:", err);
			setError("Error al cargar la configuración de disponibilidad");
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (campo, valor) => {
		setConfiguracion((prev) => ({
			...prev,
			[campo]: valor,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		// Validaciones del cliente
		if (configuracion.holguraOptima < 30) {
			setError("La holgura óptima no puede ser menor a 30 minutos");
			return;
		}

		if (configuracion.holguraMaximaDescuento < configuracion.holguraOptima) {
			setError("La holgura máxima debe ser mayor o igual a la holgura óptima");
			return;
		}

		if (
			configuracion.descuentoMinimo < 0 ||
			configuracion.descuentoMinimo > 100
		) {
			setError("El descuento mínimo debe estar entre 0 y 100");
			return;
		}

		if (
			configuracion.descuentoMaximo < configuracion.descuentoMinimo ||
			configuracion.descuentoMaximo > 100
		) {
			setError(
				"El descuento máximo debe ser mayor o igual al mínimo y no superar 100"
			);
			return;
		}

		try {
			setSaving(true);
			const response = await authenticatedFetch(
				`/api/disponibilidad/configuracion/${configuracion.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(configuracion),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al guardar la configuración");
			}

			const data = await response.json();
			setConfiguracion(data.config);
			setSuccess("Configuración guardada exitosamente");
			setTimeout(() => setSuccess(""), 3000);
		} catch (err) {
			console.error("Error guardando configuración:", err);
			setError(err.message || "Error al guardar la configuración");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Cargando configuración...</p>
				</div>
			</div>
		);
	}

	if (!configuracion) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>
					No se pudo cargar la configuración de disponibilidad.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold text-gray-900">
					Configuración de Disponibilidad
				</h1>
				<p className="text-gray-600 mt-2">
					Gestiona los parámetros del sistema de disponibilidad de vehículos y
					descuentos por retorno vacío
				</p>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{success && (
				<Alert className="border-green-200 bg-green-50">
					<CheckCircle2 className="h-4 w-4 text-green-600" />
					<AlertDescription className="text-green-600">
						{success}
					</AlertDescription>
				</Alert>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Estado del sistema */}
				<Card>
					<CardHeader>
						<CardTitle>Estado del Sistema</CardTitle>
						<CardDescription>
							Activa o desactiva el sistema de descuentos por retorno
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label htmlFor="activo">
									Sistema de descuentos por retorno
								</Label>
								<p className="text-sm text-gray-500">
									Cuando está activo, el sistema calculará y aplicará descuentos
									automáticamente
								</p>
							</div>
							<Switch
								id="activo"
								checked={configuracion.activo}
								onCheckedChange={(checked) =>
									handleInputChange("activo", checked)
								}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Configuración de tiempos de holgura */}
				<Card>
					<CardHeader>
						<CardTitle>Tiempos de Holgura entre Viajes</CardTitle>
						<CardDescription>
							Define los tiempos mínimos, óptimos y máximos entre viajes
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert className="border-blue-200 bg-blue-50">
							<Info className="h-4 w-4 text-blue-600" />
							<AlertDescription className="text-blue-600">
								<strong>Holgura mínima:</strong> 30 minutos (fijo, no
								modificable). Es el tiempo mínimo obligatorio entre la llegada
								de un viaje y la salida del siguiente.
							</AlertDescription>
						</Alert>

						<div className="space-y-2">
							<Label htmlFor="holguraMinima">
								Holgura mínima (minutos) - No modificable
							</Label>
							<Input
								id="holguraMinima"
								type="number"
								value={30}
								disabled
								className="bg-gray-100"
							/>
							<p className="text-sm text-gray-500">
								Tiempo mínimo obligatorio entre viajes (restricción absoluta del
								sistema)
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="holguraOptima">Holgura óptima (minutos) *</Label>
							<Input
								id="holguraOptima"
								type="number"
								min="30"
								value={configuracion.holguraOptima}
								onChange={(e) =>
									handleInputChange("holguraOptima", parseInt(e.target.value))
								}
								required
							/>
							<p className="text-sm text-gray-500">
								Tiempo óptimo de descanso del conductor. Se aplica el descuento
								máximo cuando se alcanza este tiempo.
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="holguraMaximaDescuento">
								Holgura máxima para descuento (minutos) *
							</Label>
							<Input
								id="holguraMaximaDescuento"
								type="number"
								min={configuracion.holguraOptima}
								value={configuracion.holguraMaximaDescuento}
								onChange={(e) =>
									handleInputChange(
										"holguraMaximaDescuento",
										parseInt(e.target.value)
									)
								}
								required
							/>
							<p className="text-sm text-gray-500">
								Tiempo máximo de espera para aplicar descuento por retorno. Más
								allá de este tiempo no se considerará oportunidad de retorno.
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Configuración de descuentos */}
				<Card>
					<CardHeader>
						<CardTitle>Descuentos por Retorno</CardTitle>
						<CardDescription>
							Define los porcentajes de descuento mínimo y máximo
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert className="border-blue-200 bg-blue-50">
							<Info className="h-4 w-4 text-blue-600" />
							<AlertDescription className="text-blue-600">
								El descuento se calcula gradualmente: desde el mínimo (para
								holgura mínima de 30 min) hasta el máximo (para holgura óptima o
								superior).
							</AlertDescription>
						</Alert>

						<div className="space-y-2">
							<Label htmlFor="descuentoMinimo">Descuento mínimo (%) *</Label>
							<Input
								id="descuentoMinimo"
								type="number"
								min="0"
								max="100"
								step="0.01"
								value={configuracion.descuentoMinimo}
								onChange={(e) =>
									handleInputChange(
										"descuentoMinimo",
										parseFloat(e.target.value)
									)
								}
								required
							/>
							<p className="text-sm text-gray-500">
								Descuento aplicado cuando el tiempo de espera es exactamente la
								holgura mínima (30 minutos).
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="descuentoMaximo">Descuento máximo (%) *</Label>
							<Input
								id="descuentoMaximo"
								type="number"
								min={configuracion.descuentoMinimo}
								max="100"
								step="0.01"
								value={configuracion.descuentoMaximo}
								onChange={(e) =>
									handleInputChange(
										"descuentoMaximo",
										parseFloat(e.target.value)
									)
								}
								required
							/>
							<p className="text-sm text-gray-500">
								Descuento aplicado cuando el tiempo de espera es igual o
								superior a la holgura óptima.
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Configuración de horarios */}
				<Card>
					<CardHeader>
						<CardTitle>Restricciones de Horario</CardTitle>
						<CardDescription>
							Define los horarios límite para aplicar descuentos por retorno
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="horaLimiteRetornos">
								Hora límite para retornos *
							</Label>
							<Input
								id="horaLimiteRetornos"
								type="time"
								value={
									configuracion.horaLimiteRetornos
										? configuracion.horaLimiteRetornos.substring(0, 5)
										: "20:00"
								}
								onChange={(e) =>
									handleInputChange(
										"horaLimiteRetornos",
										`${e.target.value}:00`
									)
								}
								required
							/>
							<p className="text-sm text-gray-500">
								Los viajes de retorno que inicien después de esta hora no
								recibirán descuento.
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Descripción adicional */}
				<Card>
					<CardHeader>
						<CardTitle>Descripción</CardTitle>
						<CardDescription>
							Agrega notas o comentarios sobre esta configuración
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="descripcion">Descripción (opcional)</Label>
							<textarea
								id="descripcion"
								className="w-full min-h-[100px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={configuracion.descripcion || ""}
								onChange={(e) =>
									handleInputChange("descripcion", e.target.value)
								}
								placeholder="Describe los cambios o motivos de esta configuración..."
							/>
						</div>
					</CardContent>
				</Card>

				{/* Botón de guardar */}
				<div className="flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={cargarConfiguracion}
						disabled={saving}
					>
						Cancelar
					</Button>
					<Button type="submit" disabled={saving}>
						{saving ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
								Guardando...
							</>
						) : (
							<>
								<Save className="w-4 h-4 mr-2" />
								Guardar Configuración
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}

export default AdminDisponibilidad;
