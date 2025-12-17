import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "../../ui/dialog";
import {
	Fuel,
	CreditCard,
	User,
	Car,
	Receipt,
	DollarSign,
	Plus,
	RefreshCw,
} from "lucide-react";

/**
 * Componente para agregar gastos rápidamente desde el panel de reservas
 * Se integra como modal inline para agregar gastos asociados a una reserva específica
 */

// Constante para la tasa de comisión de Flow
const FLOW_COMMISSION_RATE = 3.19; // Porcentaje

const TIPOS_GASTO = [
	{ value: "combustible", label: "Combustible", icon: Fuel },
	{ value: "comision_flow", label: `Comisión Flow (${FLOW_COMMISSION_RATE}%)`, icon: CreditCard },
	{ value: "pago_conductor", label: "Pago al Conductor", icon: User },
	{ value: "peaje", label: "Peaje", icon: Receipt },
	{ value: "mantenimiento", label: "Mantenimiento", icon: Car },
	{ value: "estacionamiento", label: "Estacionamiento", icon: Car },
	{ value: "otro", label: "Otro", icon: DollarSign },
];

export function GastoQuickAdd({ 
	reserva, 
	open, 
	onOpenChange, 
	onGastoCreado,
	apiUrl,
	authenticatedFetch 
}) {
	const [formData, setFormData] = useState({
		tipoGasto: "",
		monto: "",
		descripcion: "",
		fecha: new Date().toISOString().split("T")[0],
		comprobante: "",
	});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	// Calcular comisión Flow automáticamente
	useEffect(() => {
		if (formData.tipoGasto === "comision_flow" && reserva) {
			const comision = (parseFloat(reserva.totalConDescuento || 0) * FLOW_COMMISSION_RATE) / 100;
			setFormData(prev => ({ ...prev, monto: comision.toFixed(0) }));
		}
	}, [formData.tipoGasto, reserva]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);

		// Validaciones
		if (!formData.tipoGasto || !formData.monto) {
			setError("Tipo de gasto y monto son obligatorios");
			return;
		}

		setSaving(true);

		try {
			const payload = {
				reservaId: reserva.id,
				tipoGasto: formData.tipoGasto,
				monto: parseFloat(formData.monto),
				descripcion: formData.descripcion || null,
				fecha: formData.fecha,
				comprobante: formData.comprobante || null,
				// Heredar conductor y vehículo de la reserva si están disponibles
				conductorId: reserva.conductorId || null,
				vehiculoId: reserva.vehiculoId || null,
			};

			// Construir URL de forma segura
			const url = new URL('/api/gastos', apiUrl);
			const response = await authenticatedFetch(url.toString(), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al crear el gasto");
			}

			const data = await response.json();
			
			// Resetear formulario
			setFormData({
				tipoGasto: "",
				monto: "",
				descripcion: "",
				fecha: new Date().toISOString().split("T")[0],
				comprobante: "",
			});

			// Notificar al componente padre
			if (onGastoCreado) {
				onGastoCreado(data.gasto);
			}

			// Cerrar modal
			onOpenChange(false);
		} catch (err) {
			console.error("Error al crear gasto:", err);
			setError(err.message || "Error al crear el gasto");
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		setFormData({
			tipoGasto: "",
			monto: "",
			descripcion: "",
			fecha: new Date().toISOString().split("T")[0],
			comprobante: "",
		});
		setError(null);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Agregar Gasto - Reserva #{reserva?.codigoReserva}</DialogTitle>
					<DialogDescription>
						Registra un gasto asociado a esta reserva. Los gastos se incluirán en el cálculo de utilidad.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Tipo de Gasto */}
					<div className="space-y-2">
						<Label htmlFor="tipoGasto">
							Tipo de Gasto <span className="text-red-500">*</span>
						</Label>
						<Select
							value={formData.tipoGasto}
							onValueChange={(value) =>
								setFormData({ ...formData, tipoGasto: value })
							}
						>
							<SelectTrigger id="tipoGasto">
								<SelectValue placeholder="Selecciona el tipo de gasto" />
							</SelectTrigger>
							<SelectContent>
								{TIPOS_GASTO.map((tipo) => {
									const IconComponent = tipo.icon;
									return (
										<SelectItem key={tipo.value} value={tipo.value}>
											<div className="flex items-center gap-2">
												<IconComponent className="w-4 h-4" />
												{tipo.label}
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</div>

					{/* Monto */}
					<div className="space-y-2">
						<Label htmlFor="monto">
							Monto (CLP) <span className="text-red-500">*</span>
						</Label>
						<Input
							id="monto"
							type="number"
							value={formData.monto}
							onChange={(e) =>
								setFormData({ ...formData, monto: e.target.value })
							}
							placeholder="Ej: 15000"
							min="0"
							step="1"
							disabled={formData.tipoGasto === "comision_flow"}
						/>
						{formData.tipoGasto === "comision_flow" && (
							<p className="text-xs text-muted-foreground">
								Calculado automáticamente: {FLOW_COMMISSION_RATE}% de ${reserva?.totalConDescuento || 0}
							</p>
						)}
					</div>

					{/* Fecha */}
					<div className="space-y-2">
						<Label htmlFor="fecha">Fecha</Label>
						<Input
							id="fecha"
							type="date"
							value={formData.fecha}
							onChange={(e) =>
								setFormData({ ...formData, fecha: e.target.value })
							}
						/>
					</div>

					{/* Descripción */}
					<div className="space-y-2">
						<Label htmlFor="descripcion">Descripción</Label>
						<Textarea
							id="descripcion"
							value={formData.descripcion}
							onChange={(e) =>
								setFormData({ ...formData, descripcion: e.target.value })
							}
							placeholder="Detalles adicionales del gasto..."
							rows={2}
						/>
					</div>

					{/* Comprobante */}
					<div className="space-y-2">
						<Label htmlFor="comprobante">Comprobante (opcional)</Label>
						<Input
							id="comprobante"
							type="text"
							value={formData.comprobante}
							onChange={(e) =>
								setFormData({ ...formData, comprobante: e.target.value })
							}
							placeholder="URL o número de comprobante"
						/>
					</div>

					{/* Error */}
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
							{error}
						</div>
					)}

					{/* Información de la reserva */}
					{reserva && (
						<div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm space-y-1">
							<p className="font-semibold text-blue-900">Reserva:</p>
							<p className="text-blue-800">
								{reserva.origen} → {reserva.destino}
							</p>
							<p className="text-blue-700">
								Total: ${reserva.totalConDescuento?.toLocaleString("es-CL")}
							</p>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={saving}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={saving}>
							{saving ? (
								<>
									<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
									Guardando...
								</>
							) : (
								<>
									<Plus className="w-4 h-4 mr-2" />
									Agregar Gasto
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default GastoQuickAdd;
