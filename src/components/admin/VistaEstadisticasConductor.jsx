// src/components/admin/VistaEstadisticasConductor.jsx
// Ejemplo de integración de EstadisticasConductor en el panel de administración
import { useState } from "react";
import EstadisticasConductor from "../EstadisticasConductor";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft, Users } from "lucide-react";

/**
 * Componente wrapper para integrar EstadisticasConductor en AdminPanel
 * Ejemplo de uso con selector de conductor
 */
function VistaEstadisticasConductor() {
	const [conductorSeleccionado, setConductorSeleccionado] = useState(null);

	// Si hay un conductor seleccionado, mostrar sus estadísticas
	if (conductorSeleccionado) {
		return (
			<div className="space-y-4">
				{/* Botón para volver */}
				<Button
					variant="outline"
					onClick={() => setConductorSeleccionado(null)}
					className="mb-4"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Volver a la lista
				</Button>

				{/* Componente de estadísticas */}
				<EstadisticasConductor conductorId={conductorSeleccionado} />
			</div>
		);
	}

	// Si no hay conductor seleccionado, mostrar mensaje o lista
	return (
		<div className="space-y-6 p-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="w-5 h-5" />
						Estadísticas de Conductores
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-gray-600 mb-4">
						Seleccione un conductor desde el módulo de Conductores para ver sus
						estadísticas detalladas.
					</p>
					<p className="text-sm text-gray-500">
						También puede acceder desde: <strong>AdminConductores</strong> →
						Ver Estadísticas
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

export default VistaEstadisticasConductor;
