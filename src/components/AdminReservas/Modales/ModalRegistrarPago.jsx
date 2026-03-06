import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";
import { Button } from "../../ui/button";

export function ModalRegistrarPago({
	open,
	onOpenChange,
	selectedReserva,
	regPagoMonto,
	setRegPagoMonto,
	regPagoMetodo,
	setRegPagoMetodo,
	regPagoReferencia,
	setRegPagoReferencia,
	handleRegistrarPago,
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Registrar pago manual</DialogTitle>
					<DialogDescription>
						Registra un pago y guarda un historial con origen manual/web.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 mt-2">
					<div className="space-y-2">
						<Label>Monto (CLP)</Label>
						<Input
							type="number"
							value={regPagoMonto}
							onChange={(e) => setRegPagoMonto(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>Método</Label>
						<Select
							value={regPagoMetodo}
							onValueChange={(v) => setRegPagoMetodo(v)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="efectivo">Efectivo</SelectItem>
								<SelectItem value="transferencia">Transferencia</SelectItem>
								<SelectItem value="flow">Flow</SelectItem>
								<SelectItem value="otro">Otro</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Referencia</Label>
						<Input
							value={regPagoReferencia}
							onChange={(e) => setRegPagoReferencia(e.target.value)}
						/>
					</div>
					<div className="flex justify-end gap-2 pt-4 border-t">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancelar
						</Button>
						<Button onClick={handleRegistrarPago}>Registrar</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
