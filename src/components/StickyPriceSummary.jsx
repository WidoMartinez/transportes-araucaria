import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowRight, Tag } from "lucide-react";

/**
 * Componente de resumen persistente del precio
 * Muestra información del viaje y desglose de precios en todos los pasos del wizard
 */
function StickyPriceSummary({
	origen,
	destino,
	fecha,
	pasajeros,
	pricing,
	descuentoRate,
	visible = true,
	onToggle,
}) {
	// En móvil, si no es visible, no renderizar
	if (!visible && window.innerWidth < 768) return null;

	const formatCurrency = (value) =>
		new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(value || 0);

	return (
		<div className="fixed bottom-4 right-4 z-50 md:sticky md:top-24 md:h-fit">
			<Card className="shadow-lg border-2 w-80 max-w-full">
				<CardContent className="p-4 space-y-3">
					{/* Header */}
					<div className="flex items-center justify-between">
						<h3 className="font-semibold text-sm">Resumen de tu viaje</h3>
						<button
							onClick={onToggle}
							className="md:hidden text-muted-foreground hover:text-foreground"
							aria-label="Cerrar resumen"
						>
							✕
						</button>
					</div>

					{/* Ruta */}
					<div className="flex items-center gap-2 text-sm">
						<span className="font-medium truncate">{origen}</span>
						<ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
						<span className="font-medium truncate">{destino}</span>
					</div>

					{/* Detalles */}
					<div className="space-y-1 text-xs text-muted-foreground">
						<p>📅 {fecha || "Fecha por seleccionar"}</p>
						<p>👥 {pasajeros || 1} pasajero(s)</p>
					</div>

					{/* Precio */}
					{pricing && (
						<>
							<div className="border-t pt-3 space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Precio base</span>
									<span className="line-through">
										{formatCurrency(pricing.precioBase)}
									</span>
								</div>

								{descuentoRate > 0 && (
									<div className="flex justify-between text-sm items-center">
										<span className="text-green-600 flex items-center gap-1">
											<Tag className="h-3 w-3" />
											Descuento
										</span>
										<span className="text-green-600 font-medium">
											-{formatCurrency(pricing.descuentoOnline)}
										</span>
									</div>
								)}
							</div>

							<div className="border-t pt-3">
								<div className="flex justify-between items-center">
									<span className="font-semibold">Total</span>
									<span className="text-2xl font-bold text-primary">
										{formatCurrency(pricing.totalConDescuento)}
									</span>
								</div>
							</div>

							{descuentoRate > 0 && (
								<Badge className="w-full justify-center" variant="secondary">
									Ahorras {descuentoRate}%
								</Badge>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default StickyPriceSummary;
