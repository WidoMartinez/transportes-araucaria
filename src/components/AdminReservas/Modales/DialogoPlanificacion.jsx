import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Printer, RefreshCw } from "lucide-react";

export function DialogoPlanificacion({
	open,
	onOpenChange,
	calendarStartDate,
	setCalendarStartDate,
	calendarEndDate,
	setCalendarEndDate,
	handleGenerarCalendario,
	generatingCalendar,
}) {
	const setToday = () => {
		const today = new Date();
		const str = today.toISOString().split("T")[0];
		setCalendarStartDate(str);
		setCalendarEndDate(str);
	};

	const setTomorrow = () => {
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		setCalendarStartDate(today.toISOString().split("T")[0]);
		setCalendarEndDate(tomorrow.toISOString().split("T")[0]);
	};

	const setNextWeek = () => {
		const today = new Date();
		const nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);
		setCalendarStartDate(today.toISOString().split("T")[0]);
		setCalendarEndDate(nextWeek.toISOString().split("T")[0]);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Generar Planificación</DialogTitle>
					<DialogDescription>
						Selecciona el rango de fechas para generar la vista de impresión
						tipo calendario.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="flex flex-col gap-2">
						<Label>Fecha Inicio</Label>
						<Input
							type="date"
							value={calendarStartDate}
							onChange={(e) => setCalendarStartDate(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Fecha Término</Label>
						<Input
							type="date"
							value={calendarEndDate}
							onChange={(e) => setCalendarEndDate(e.target.value)}
						/>
					</div>
					<div className="flex gap-2 justify-center pt-2">
						<Button variant="ghost" size="sm" onClick={setToday}>
							Hoy
						</Button>
						<Button variant="ghost" size="sm" onClick={setTomorrow}>
							Mañana
						</Button>
						<Button variant="ghost" size="sm" onClick={setNextWeek}>
							Próx. 7 días
						</Button>
					</div>
					<Button
						onClick={handleGenerarCalendario}
						disabled={generatingCalendar}
						className="w-full"
					>
						{generatingCalendar ? (
							<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Printer className="mr-2 h-4 w-4" />
						)}
						Generar Vista de Impresión
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
