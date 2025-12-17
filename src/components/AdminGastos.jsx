import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getBackendUrl } from "../lib/backend";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "./ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import {
	DollarSign,
	Plus,
	Edit,
	Trash2,
	Fuel,
	CreditCard,
	User,
	Car,
	Receipt,
	AlertCircle,
	Archive,
} from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { GastosTab } from "./admin/GastosTab";

function AdminGastos() {
	const { authenticatedFetch } = useAuthenticatedFetch();
	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	const [reservas, setReservas] = useState([]);
	const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
	const [mostrarCerradas, setMostrarCerradas] = useState(false);
	const [showCerrarDialog, setShowCerrarDialog] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetchReservas();
	}, []);

	useEffect(() => {
		fetchReservas();
	}, [mostrarCerradas]);

	// Leer parámetro reservaId de URL y seleccionar automáticamente
	useEffect(() => {
		const url = new URL(window.location.href);
		const reservaIdParam = url.searchParams.get("reservaId");
		
		if (reservaIdParam && reservas.length > 0 && !reservaSeleccionada) {
			const reserva = reservas.find(r => r.id.toString() === reservaIdParam);
			if (reserva) {
				setReservaSeleccionada(reserva);
				// Limpiar el parámetro de la URL
				url.searchParams.delete("reservaId");
				window.history.replaceState({}, "", url.toString());
			}
		}
	}, [reservas, reservaSeleccionada]);

	const fetchReservas = async () => {
		try {
			let url = `/api/reservas?estado=completada`;
			if (mostrarCerradas) {
				url += '&incluir_cerradas=true';
			}
			const response = await authenticatedFetch(url, {
				method: "GET",
			});
			if (response.ok) {
				const data = await response.json();
				setReservas(data.reservas || []);
			}
		} catch (error) {
			console.error("Error al cargar reservas:", error);
		}
	};

	const handleToggleGastosCerrados = async () => {
		if (!reservaSeleccionada) return;
		
		setLoading(true);
		try {
			const response = await authenticatedFetch(
				`/api/reservas/${reservaSeleccionada.id}/toggle-gastos`,
				{ method: "PATCH" }
			);
			
			if (response.ok) {
				const data = await response.json();
				// Recargar lista (la reserva desaparecerá si se cerró)
				await fetchReservas();
				setReservaSeleccionada(null);
				setShowCerrarDialog(false);
				
				// Mensaje de confirmación
				alert(data.message);
			} else {
				const error = await response.json();
				alert(`Error: ${error.error}`);
			}
		} catch (error) {
			console.error("Error:", error);
			alert("Error al actualizar estado de gastos");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Gestión de Gastos</h2>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Seleccionar Reserva</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="mostrar-cerradas"
							checked={mostrarCerradas}
							onChange={(e) => setMostrarCerradas(e.target.checked)}
							className="w-4 h-4 rounded"
						/>
						<label htmlFor="mostrar-cerradas" className="text-sm cursor-pointer">
							Mostrar también reservas con gastos cerrados
						</label>
					</div>
					<Select
						value={reservaSeleccionada?.id?.toString() || ""}
						onValueChange={(value) => {
							const reserva = reservas.find((r) => r.id.toString() === value);
							setReservaSeleccionada(reserva);
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Selecciona una reserva" />
						</SelectTrigger>
						<SelectContent>
							{reservas.map((reserva) => (
								<SelectItem key={reserva.id} value={reserva.id.toString()}>
									{reserva.codigoReserva} - {reserva.nombre} - {reserva.origen} → {reserva.destino} - ${reserva.totalConDescuento}{reserva.gastosCerrados ? " 🔒" : ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{reservaSeleccionada && (
				<>
					<GastosTab reserva={reservaSeleccionada} />
			
					<div className="flex justify-end mt-6">
						<AlertDialog open={showCerrarDialog} onOpenChange={setShowCerrarDialog}>
							<AlertDialogTrigger asChild>
								<Button variant="outline">
									<Archive className="w-4 h-4 mr-2" />
									{reservaSeleccionada?.gastosCerrados ? "Reabrir Gastos" : "Cerrar Gastos"}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										{reservaSeleccionada?.gastosCerrados
											? "¿Reabrir registro de gastos?"
											: "¿Cerrar registro de gastos?"}
									</AlertDialogTitle>
									<AlertDialogDescription>
										La reserva dejará de aparecer en la lista.
										Podrás reabrirla desde el panel de reservas si necesitas
										agregar más gastos después.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancelar</AlertDialogCancel>
									<AlertDialogAction onClick={handleToggleGastosCerrados}>
										{reservaSeleccionada?.gastosCerrados ? "Reabrir" : "Cerrar"}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</>
			)}
		</div>
	);
}

export default AdminGastos;
