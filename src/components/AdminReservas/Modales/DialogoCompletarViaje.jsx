import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { CheckCircle2 } from "lucide-react";

export function DialogoCompletarViaje({
	open,
	onOpenChange,
	opciones,
	onCompletarAmbas,
	onCompletarIda,
	onCompletarVuelta
}) {
	if (!opciones) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Completar Viaje de Ida y Vuelta</DialogTitle>
					<DialogDescription>
						Selecciona cómo deseas completar este servicio vinculado.
					</DialogDescription>
				</DialogHeader>
				
				<div className="space-y-4 py-4">
					<div className="p-3 bg-muted rounded-md text-sm whitespace-pre-line">
						{opciones?.mensaje}
					</div>
					
					<div className="space-y-2">
						<Button
							className="w-full justify-start h-auto py-3 text-left items-start"
							variant="outline"
							onClick={() => {
								if (confirm("¿Confirmas que deseas completar AMBOS tramos y agregar gastos?")) {
									onCompletarAmbas([opciones.reservaIda.id, opciones.reservaVuelta.id]);
								}
							}}
						>
							<div className="flex flex-col">
								<span className="font-semibold flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4 text-green-600" />
									Completar ambas juntas
								</span>
								<span className="text-xs text-muted-foreground mt-1">
									Marca IDA y VUELTA como completadas y permite ingresar gastos unificados.
								</span>
							</div>
						</Button>
						
						<Button
							className="w-full justify-start h-auto py-3 text-left items-start"
							variant="outline"
							onClick={() => {
								if (confirm("¿Confirmas que deseas completar solo la IDA y agregar gastos?")) {
									onCompletarIda(opciones.reservaIda.id);
								}
							}}
						>
							<div className="flex flex-col">
								<span className="font-semibold flex items-center gap-2">
									<div className="w-4 h-4 rounded-full border border-chocolate-600 flex items-center justify-center text-[10px] font-bold text-chocolate-600">1</div>
									Solo completar IDA
								</span>
								<span className="text-xs text-muted-foreground mt-1">
									Solo marca el tramo de ida como completado.
								</span>
							</div>
						</Button>
						
						<Button
							className="w-full justify-start h-auto py-3 text-left items-start"
							variant="outline"
							onClick={() => {
								if (confirm("¿Confirmas que deseas completar solo la VUELTA y agregar gastos?")) {
									onCompletarVuelta(opciones.reservaVuelta.id);
								}
							}}
						>
							<div className="flex flex-col">
								<span className="font-semibold flex items-center gap-2">
									<div className="w-4 h-4 rounded-full border border-chocolate-600 flex items-center justify-center text-[10px] font-bold text-chocolate-600">2</div>
									Solo completar VUELTA
								</span>
								<span className="text-xs text-muted-foreground mt-1">
									Solo marca el tramo de vuelta como completado.
								</span>
							</div>
						</Button>
					</div>
				</div>
				
				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						Cancelar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
