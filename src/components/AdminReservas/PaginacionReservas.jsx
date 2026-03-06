import React from "react";
import { Button } from "../ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginacionReservas({
	currentPage,
	setCurrentPage,
	totalPages,
	totalReservas,
	itemsPerPage,
	setItemsPerPage,
}) {
	return (
		<div className="flex items-center justify-between mt-4">
			<p className="text-sm text-muted-foreground mr-4">
				Página {currentPage} de {totalPages}
			</p>
			<p className="text-sm text-muted-foreground mr-4">
				Total: {totalReservas} registros
			</p>
			<div className="flex items-center gap-2 mr-4">
				<span className="text-sm text-muted-foreground">Filas:</span>
				<Select
					value={String(itemsPerPage)}
					onValueChange={(val) => {
						setItemsPerPage(Number(val));
						setCurrentPage(1);
					}}
				>
					<SelectTrigger className="w-[80px] h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="20">20</SelectItem>
						<SelectItem value="50">50</SelectItem>
						<SelectItem value="100">100</SelectItem>
						<SelectItem value="-1">Todas</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
					disabled={currentPage === 1}
				>
					<ChevronLeft className="w-4 h-4" />
					Anterior
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
					disabled={currentPage === totalPages}
				>
					Siguiente
					<ChevronRight className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
}
