import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "../../ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";
import { DollarSign, RefreshCw } from "lucide-react";

/**
 * Modal para registrar pago rápido de una reserva
 * Proporciona validación y mejor UX que el prompt nativo del navegador
 */

const METODOS_PAGO = [
	{ value: "efectivo", label: "Efectivo" },
	{ value: "transferencia", label: "Transferencia Bancaria" },
	{ value: "tarjeta", label: "Tarjeta de Crédito/Débito" },
	{ value: "flow", label: "Flow" },
	{ value: "otro", label: "Otro" },
];

export function PagoQuickDialog({ 
	reserva, 
	open, 
	onOpenChange, 
	onPagoRegistrado,
	authenticatedFetch,
	apiUrl 
}) {
	const [monto, setMonto] = useState(reserva?.totalConDescuento?.toString() || "");
	const [metodoPago, setMetodoPago] = useState("efectivo");
	const [referencia, setReferencia] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);

		// Validaciones
		const montoNumerico = parseFloat(monto);
		if (!monto || isNaN(montoNumerico) || montoNumerico <= 0) {
			setError("Ingrese un monto válido mayor a 0");
			return;
		}

		if (!metodoPago) {
			setError("Seleccione un método de pago");
			return;
		}

		setSaving(true);

		try {
			// Validar que reserva.id sea un número seguro
			const reservaId = parseInt(reserva.id, 10);
			if (isNaN(reservaId) || reservaId <= 0) {
				throw new Error("ID de reserva inválido");
			}

			const url = new URL(`/api/reservas/${reservaId}/pago`, apiUrl);
			const response = await authenticatedFetch(url.toString(), {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					estadoPago: "pagado",
					pagoMonto: montoNumerico,
					metodoPago: metodoPago,
					referenciaPago: referencia || null,
				}),
			});

			if (!response.ok) {
				throw new Error("Error al registrar pago");
			}

			// Resetear y notificar
			setMonto("");
			setMetodoPago("efectivo");
			setReferencia("");
			
			if (onPagoRegistrado) {
				onPagoRegistrado();
			}

			onOpenChange(false);
		} catch (err) {
			console.error("Error al registrar pago:", err);
			setError(err.message || "Error al registrar el pago");
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		setMonto(reserva?.totalConDescuento?.toString() || "");
		setMetodoPago("efectivo");
		setReferencia("");
		setError(null);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Registrar Pago - Reserva #{reserva?.codigoReserva}</DialogTitle>
					<DialogDescription>
						Ingrese los datos del pago recibido. La reserva se marcará como pagada.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
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
							{reserva.saldoPendiente > 0 && (
								<p className="text-orange-700 font-medium">
									Saldo pendiente: ${reserva.saldoPendiente?.toLocaleString("es-CL")}
								</p>
							)}
						</div>
					)}

					{/* Monto */}
					<div className="space-y-2">
						<Label htmlFor="monto">
							Monto Pagado (CLP) <span className="text-red-500">*</span>
						</Label>
						<div className="relative">
							<DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								id="monto"
								type="number"
								value={monto}
								onChange={(e) => setMonto(e.target.value)}
								placeholder="Ej: 50000"
								min="0"
								step="1"
								className="pl-10"
								autoFocus
							/>
						</div>
					</div>

					{/* Método de Pago */}
					<div className="space-y-2">
						<Label htmlFor="metodoPago">
							Método de Pago <span className="text-red-500">*</span>
						</Label>
						<Select value={metodoPago} onValueChange={setMetodoPago}>
							<SelectTrigger id="metodoPago">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{METODOS_PAGO.map((metodo) => (
									<SelectItem key={metodo.value} value={metodo.value}>
										{metodo.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Referencia */}
					<div className="space-y-2">
						<Label htmlFor="referencia">Referencia / Comprobante (opcional)</Label>
						<Input
							id="referencia"
							type="text"
							value={referencia}
							onChange={(e) => setReferencia(e.target.value)}
							placeholder="Nº de transferencia, voucher, etc."
						/>
					</div>

					{/* Error */}
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
							{error}
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
									Registrando...
								</>
							) : (
								"Registrar Pago"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default PagoQuickDialog;
