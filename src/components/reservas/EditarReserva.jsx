import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { getBackendUrl } from "../../lib/backend";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Componente simplificado para editar información básica de una reserva
 * Enfocado en cambios de estado y observaciones
 */
function EditarReserva({ reserva, isOpen, onClose, onActualizado }) {
	const { accessToken } = useAuth();
	const [guardando, setGuardando] = useState(false);
	const [formData, setFormData] = useState({
		estado: reserva.estado || "pendiente",
		estadoPago: reserva.estadoPago || "pendiente",
		metodoPago: reserva.metodoPago || "",
		referenciaPago: reserva.referenciaPago || "",
		observaciones: reserva.observaciones || "",
	});

	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	const handleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleGuardar = async () => {
		setGuardando(true);
		try {
			const response = await fetch(`${apiUrl}/api/reservas/${reserva.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				onActualizado();
			} else {
				const error = await response.json();
				alert(`Error al guardar: ${error.message || "Error desconocido"}`);
			}
		} catch (error) {
			console.error("Error guardando reserva:", error);
			alert("Error al guardar los cambios. Intente nuevamente.");
		} finally {
			setGuardando(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Editar Reserva #{reserva.id}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Estado de Reserva */}
					<div>
						<Label htmlFor="estado">Estado de Reserva</Label>
						<Select
							value={formData.estado}
							onValueChange={(value) => handleChange("estado", value)}
						>
							<SelectTrigger id="estado">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pendiente">Pendiente</SelectItem>
								<SelectItem value="pendiente_detalles">Pendiente Detalles</SelectItem>
								<SelectItem value="confirmada">Confirmada</SelectItem>
								<SelectItem value="completada">Completada</SelectItem>
								<SelectItem value="cancelada">Cancelada</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Estado de Pago */}
					<div>
						<Label htmlFor="estadoPago">Estado de Pago</Label>
						<Select
							value={formData.estadoPago}
							onValueChange={(value) => handleChange("estadoPago", value)}
						>
							<SelectTrigger id="estadoPago">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pendiente">Pendiente</SelectItem>
								<SelectItem value="aprobado">Aprobado</SelectItem>
								<SelectItem value="parcial">Parcial</SelectItem>
								<SelectItem value="pagado">Pagado</SelectItem>
								<SelectItem value="fallido">Fallido</SelectItem>
								<SelectItem value="reembolsado">Reembolsado</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Método de Pago */}
					<div>
						<Label htmlFor="metodoPago">Método de Pago</Label>
						<Select
							value={formData.metodoPago}
							onValueChange={(value) => handleChange("metodoPago", value)}
						>
							<SelectTrigger id="metodoPago">
								<SelectValue placeholder="Seleccionar método" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">Sin especificar</SelectItem>
								<SelectItem value="Flow">Flow</SelectItem>
								<SelectItem value="Transferencia">Transferencia</SelectItem>
								<SelectItem value="Efectivo">Efectivo</SelectItem>
								<SelectItem value="Otro">Otro</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Referencia de Pago */}
					<div>
						<Label htmlFor="referenciaPago">Referencia de Pago</Label>
						<Textarea
							id="referenciaPago"
							value={formData.referenciaPago}
							onChange={(e) => handleChange("referenciaPago", e.target.value)}
							placeholder="Ej: ID de transacción, número de operación, etc."
							rows={2}
						/>
					</div>

					{/* Observaciones */}
					<div>
						<Label htmlFor="observaciones">Observaciones Internas</Label>
						<Textarea
							id="observaciones"
							value={formData.observaciones}
							onChange={(e) => handleChange("observaciones", e.target.value)}
							placeholder="Notas privadas sobre la reserva..."
							rows={4}
						/>
					</div>

					{/* Resumen Financiero */}
					<div className="bg-gray-50 p-4 rounded-lg">
						<div className="text-sm font-semibold mb-2">Resumen Financiero</div>
						<div className="space-y-1 text-sm">
							<div className="flex justify-between">
								<span>Total a pagar:</span>
								<span className="font-semibold">
									{new Intl.NumberFormat("es-CL", {
										style: "currency",
										currency: "CLP",
									}).format(reserva.totalConDescuento || 0)}
								</span>
							</div>
							{reserva.abonoSugerido > 0 && (
								<div className="flex justify-between">
									<span>Abono sugerido:</span>
									<span className="text-blue-600">
										{new Intl.NumberFormat("es-CL", {
											style: "currency",
											currency: "CLP",
										}).format(reserva.abonoSugerido)}
									</span>
								</div>
							)}
							{reserva.saldoPendiente > 0 && (
								<div className="flex justify-between">
									<span>Saldo pendiente:</span>
									<span className="text-red-600 font-semibold">
										{new Intl.NumberFormat("es-CL", {
											style: "currency",
											currency: "CLP",
										}).format(reserva.saldoPendiente)}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={guardando}>
						Cancelar
					</Button>
					<Button onClick={handleGuardar} disabled={guardando}>
						{guardando ? "Guardando..." : "Guardar Cambios"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default EditarReserva;
