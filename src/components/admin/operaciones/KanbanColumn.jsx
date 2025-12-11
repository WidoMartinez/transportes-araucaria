import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import ReservaCard from "./ReservaCard";
import { Loader2 } from "lucide-react";

/**
 * Columna Kanban con zona droppable
 * Contiene lista de reservas y permite soltar elementos
 */
function KanbanColumn({ 
	id, 
	titulo, 
	color, 
	icono: IconComponent, 
	descripcion,
	reservas = [],
	onReservaClick,
	loading = false
}) {
	// Configurar zona droppable
	const { setNodeRef, isOver } = useDroppable({
		id: id,
	});

	// Obtener IDs de reservas para SortableContext
	const reservaIds = reservas.map(r => r.id);

	// Obtener clases de color
	const getColorClasses = () => {
		const colors = {
			gray: {
				badge: "bg-gray-100 text-gray-800 border-gray-200",
				header: "bg-gray-50 border-gray-200",
				hover: "border-gray-400"
			},
			blue: {
				badge: "bg-blue-100 text-blue-800 border-blue-200",
				header: "bg-blue-50 border-blue-200",
				hover: "border-blue-400"
			},
			purple: {
				badge: "bg-purple-100 text-purple-800 border-purple-200",
				header: "bg-purple-50 border-purple-200",
				hover: "border-purple-400"
			},
			orange: {
				badge: "bg-orange-100 text-orange-800 border-orange-200",
				header: "bg-orange-50 border-orange-200",
				hover: "border-orange-400"
			},
			green: {
				badge: "bg-green-100 text-green-800 border-green-200",
				header: "bg-green-50 border-green-200",
				hover: "border-green-400"
			}
		};

		return colors[color] || colors.gray;
	};

	const colorClasses = getColorClasses();

	return (
		<Card 
			className={`flex flex-col h-full transition-all ${
				isOver ? `ring-2 ring-offset-2 ${colorClasses.hover} ring-opacity-50` : ""
			}`}
		>
			{/* Header de la columna */}
			<CardHeader className={`${colorClasses.header} border-b`}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{IconComponent && <IconComponent className="h-5 w-5" />}
						<CardTitle className="text-lg font-semibold">
							{titulo}
						</CardTitle>
					</div>
					<Badge 
						variant="outline" 
						className={`${colorClasses.badge} font-semibold`}
					>
						{reservas.length}
					</Badge>
				</div>
				{descripcion && (
					<p className="text-xs text-gray-500 mt-1">
						{descripcion}
					</p>
				)}
			</CardHeader>

			{/* Contenido de la columna - zona droppable */}
			<CardContent className="flex-1 overflow-y-auto p-3" ref={setNodeRef}>
				{loading ? (
					<div className="flex items-center justify-center h-32">
						<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
					</div>
				) : reservas.length === 0 ? (
					<div className="flex items-center justify-center h-32 text-center">
						<p className="text-sm text-gray-400">
							No hay reservas en este estado
						</p>
					</div>
				) : (
					<SortableContext 
						items={reservaIds} 
						strategy={verticalListSortingStrategy}
					>
						<div className="space-y-2">
							{reservas.map((reserva) => (
								<ReservaCard
									key={reserva.id}
									reserva={reserva}
									onClick={() => onReservaClick && onReservaClick(reserva)}
								/>
							))}
						</div>
					</SortableContext>
				)}
			</CardContent>
		</Card>
	);
}

export default KanbanColumn;
