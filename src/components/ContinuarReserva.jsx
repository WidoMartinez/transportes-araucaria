import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import {
	Search,
	LoaderCircle,
	CheckCircle2,
	AlertCircle,
	MapPin,
	Calendar,
	Clock,
	Users,
	CreditCard,
	FileText,
} from "lucide-react";

import { getBackendUrl } from "../lib/backend";

// Función para formatear precio
const formatCurrency = (amount) => {
	return new Intl.NumberFormat("es-CL", {
		style: "currency",
		currency: "CLP",
	}).format(amount);
};

// Función para formatear fecha
const formatDate = (dateString) => {
	if (!dateString) return "-";
	const date = new Date(dateString);
	return date.toLocaleDateString("es-CL", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

function ContinuarReserva({ onComplete, onCancel, onPayReservation }) {
	const [reservaId, setReservaId] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [reservaEncontrada, setReservaEncontrada] = useState(null);
	const [observaciones, setObservaciones] = useState("");
	const [guardandoObservaciones, setGuardandoObservaciones] = useState(false);

	const buscarReserva = async (e) => {
		e.preventDefault();
		if (!reservaId.trim()) {
			setError("Por favor, ingresa un ID de reserva");
			return;
		}

		setLoading(true);
		setError("");
		setReservaEncontrada(null);

		try {
			const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(`${apiUrl}/api/reservas/${reservaId.trim()}`);

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("No se encontró una reserva con ese ID");
				}
				throw new Error("Error al buscar la reserva");
			}

			const data = await response.json();
			setReservaEncontrada(data.reserva);

			// Pre-cargar observaciones existentes si las hay
			if (data.reserva.observaciones) {
				setObservaciones(data.reserva.observaciones);
			}
		} catch (err) {
			console.error("Error buscando reserva:", err);
			setError(err.message || "No se pudo cargar la información de la reserva");
		} finally {
			setLoading(false);
		}
	};

	const guardarObservaciones = async () => {
		if (!reservaEncontrada || !observaciones.trim()) {
			setError("Por favor, ingresa alguna observación");
			return;
		}

		setGuardandoObservaciones(true);
		setError("");

		try {
			const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(
				`${apiUrl}/api/reservas/${reservaEncontrada.id}/observaciones`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						observaciones: observaciones.trim(),
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Error al guardar las observaciones");
			}

			// Mostrar confirmación y cerrar
			alert("✅ Observaciones guardadas exitosamente");
			if (onComplete) {
				onComplete();
			}
		} catch (err) {
			console.error("Error guardando observaciones:", err);
			setError("No se pudieron guardar las observaciones. Intenta de nuevo.");
		} finally {
			setGuardandoObservaciones(false);
		}
	};

	const handleContinuarPago = () => {
		if (onPayReservation && reservaEncontrada) {
			onPayReservation(reservaEncontrada);
		}
	};

	const handleCerrar = () => {
		setReservaId("");
		setReservaEncontrada(null);
		setError("");
		setObservaciones("");
		if (onCancel) {
			onCancel();
		}
	};

	// Determinar el estado de la reserva
        const getEstadoBadge = (estado) => {
                const estados = {
                        pendiente: {
                                estilo: "bg-amber-100/80 text-amber-800 border border-amber-200",
                                text: "Pendiente",
                        },
                        confirmada: {
                                estilo: "bg-blue-100/80 text-blue-800 border border-blue-200",
                                text: "Confirmada",
                        },
                        completada: {
                                estilo: "bg-emerald-100/80 text-emerald-800 border border-emerald-200",
                                text: "Completada",
                        },
                        cancelada: {
                                estilo: "bg-rose-100/80 text-rose-800 border border-rose-200",
                                text: "Cancelada",
                        },
                };
                const info = estados[estado?.toLowerCase()] || {
                        estilo: "bg-gray-100 text-gray-700 border border-gray-200",
                        text: estado || "Desconocido",
                };
                return (
                        <Badge className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${info.estilo}`}>
                                {info.text}
                        </Badge>
                );
        };

        const getEstadoPagoBadge = (estadoPago) => {
                const estados = {
                        pendiente: {
                                estilo: "bg-orange-100/80 text-orange-800 border border-orange-200",
                                text: "Pago pendiente",
                        },
                        pagado: {
                                estilo: "bg-emerald-100/80 text-emerald-800 border border-emerald-200",
                                text: "Pagado",
                        },
                        parcial: {
                                estilo: "bg-amber-100/80 text-amber-800 border border-amber-200",
                                text: "Pago parcial",
                        },
                        reembolsado: {
                                estilo: "bg-purple-100/80 text-purple-800 border border-purple-200",
                                text: "Reembolsado",
                        },
                };
                const info = estados[estadoPago?.toLowerCase()] || {
                        estilo: "bg-gray-100 text-gray-700 border border-gray-200",
                        text: estadoPago || "Sin info",
                };
                return (
                        <Badge className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${info.estilo}`}>
                                {info.text}
                        </Badge>
                );
        };

	return (
		<div className="w-full">
			<Card className="bg-white/95 backdrop-blur-sm shadow-lg border">
				<CardHeader>
					<CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
						<Search className="h-6 w-6 text-primary" />
						Continuar con una reserva existente
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Ingresa el ID de tu reserva para continuar con el proceso o agregar
						detalles adicionales
					</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={buscarReserva} className="space-y-4">
						<div className="flex gap-3">
							<div className="flex-1 space-y-2">
								<Label htmlFor="reserva-id">ID de Reserva</Label>
								<Input
									id="reserva-id"
									type="text"
									placeholder="Ej: 12345"
									value={reservaId}
									onChange={(e) => setReservaId(e.target.value)}
									disabled={loading}
									className="text-lg"
								/>
							</div>
							<div className="flex items-end">
								<Button
									type="submit"
									disabled={loading || !reservaId.trim()}
									className="bg-primary hover:bg-primary/90"
								>
									{loading ? (
										<>
											<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
											Buscando...
										</>
									) : (
										<>
											<Search className="mr-2 h-4 w-4" />
											Buscar
										</>
									)}
								</Button>
							</div>
						</div>

						{error && (
							<div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
								<AlertCircle className="h-5 w-5" />
								<span>{error}</span>
							</div>
						)}
					</form>
				</CardContent>
			</Card>

			{/* Dialog para mostrar información de la reserva */}
			<Dialog
				open={!!reservaEncontrada}
				onOpenChange={(open) => {
					if (!open) handleCerrar();
				}}
			>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader className="p-0">
                                                <div className="rounded-2xl bg-gradient-to-r from-primary/15 via-white to-primary/15 border border-primary/10 p-5 shadow-inner">
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                                <div>
                                                                        <DialogTitle className="text-2xl font-bold text-gray-900">
                                                                                Reserva #{reservaEncontrada?.id}
                                                                        </DialogTitle>
                                                                        <DialogDescription className="text-sm text-gray-600">
                                                                                Resumen visual con los datos clave de tu reserva
                                                                        </DialogDescription>
                                                                </div>
                                                                <div className="flex gap-2 flex-wrap">
                                                                        {getEstadoBadge(reservaEncontrada?.estado)}
                                                                        {getEstadoPagoBadge(reservaEncontrada?.estadoPago)}
                                                                </div>
                                                        </div>
                                                </div>
                                        </DialogHeader>

                                        {reservaEncontrada && (
                                                <div className="grid gap-5 pt-4 lg:grid-cols-[2fr,1fr]">
                                                        <div className="space-y-4">
                                                                <Card className="bg-gradient-to-br from-primary/5 via-white to-primary/10 border border-primary/20 shadow-sm">
                                                                        <CardHeader className="pb-2">
                                                                                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                                                        <MapPin className="h-5 w-5 text-primary" />
                                                                                        Ruta y fecha
                                                                                </CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-3 text-sm text-gray-800">
                                                                                <div className="flex items-center gap-2">
                                                                                        <span className="font-semibold">Trayecto:</span>
                                                                                        <span className="font-medium text-gray-900">
                                                                                                {reservaEncontrada.origen} → {reservaEncontrada.destino}
                                                                                        </span>
                                                                                </div>
                                                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                                                <div>
                                                                                                        <p className="text-xs text-muted-foreground">Fecha</p>
                                                                                                        <p className="font-medium text-gray-900">{formatDate(reservaEncontrada.fecha)}</p>
                                                                                                </div>
                                                                                        </div>
                                                                                        {reservaEncontrada.hora && (
                                                                                                <div className="flex items-center gap-2">
                                                                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                                                                        <div>
                                                                                                                <p className="text-xs text-muted-foreground">Hora</p>
                                                                                                                <p className="font-medium text-gray-900">{reservaEncontrada.hora}</p>
                                                                                                        </div>
                                                                                                </div>
                                                                                        )}
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                                                        <div>
                                                                                                <p className="text-xs text-muted-foreground">Pasajeros</p>
                                                                                                <p className="font-medium text-gray-900">{reservaEncontrada.pasajeros}</p>
                                                                                        </div>
                                                                                        {reservaEncontrada.idaVuelta && (
                                                                                                <Badge variant="outline" className="ml-auto bg-white/70 text-primary border-primary/30 px-3 py-1 text-xs rounded-full">
                                                                                                        Viaje ida y vuelta
                                                                                                </Badge>
                                                                                        )}
                                                                                </div>
                                                                        </CardContent>
                                                                </Card>

                                                                <Card className="bg-white/80 border border-slate-200 shadow-sm">
                                                                        <CardHeader className="pb-2">
                                                                                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                                                        <FileText className="h-5 w-5 text-primary" />
                                                                                        Información de contacto
                                                                                </CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-2 text-sm text-gray-800">
                                                                                <div className="flex items-center gap-2">
                                                                                        <span className="font-semibold text-gray-900">Nombre:</span>
                                                                                        <span>{reservaEncontrada.nombre}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                        <span className="font-semibold text-gray-900">Email:</span>
                                                                                        <span>{reservaEncontrada.email}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                        <span className="font-semibold text-gray-900">Teléfono:</span>
                                                                                        <span>{reservaEncontrada.telefono}</span>
                                                                                </div>
                                                                        </CardContent>
                                                                </Card>

                                                                {reservaEncontrada.precioTotal && (
                                                                        <Card className="bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 border border-emerald-200 shadow-sm">
                                                                                <CardHeader className="pb-2">
                                                                                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                                                                <CreditCard className="h-5 w-5 text-emerald-600" />
                                                                                                Información de pago
                                                                                        </CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent className="space-y-3 text-sm text-gray-800">
                                                                                        <div className="flex items-center justify-between">
                                                                                                <span className="font-semibold text-gray-900">Total</span>
                                                                                                <span className="text-lg font-bold text-emerald-700">
                                                                                                        {formatCurrency(reservaEncontrada.precioTotal)}
                                                                                                </span>
                                                                                        </div>
                                                                                        {reservaEncontrada.metodoPago && (
                                                                                                <div className="flex items-center gap-2 text-sm">
                                                                                                        <span className="font-semibold text-gray-900">Método:</span>
                                                                                                        <span>{reservaEncontrada.metodoPago}</span>
                                                                                                </div>
                                                                                        )}
                                                                                </CardContent>
                                                                        </Card>
                                                                )}

                                                                <Card className="bg-white/80 border border-slate-200 shadow-sm">
                                                                        <CardHeader className="pb-2">
                                                                                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                                                        <FileText className="h-5 w-5 text-primary" />
                                                                                        Observaciones adicionales
                                                                                </CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-3">
                                                                                <Textarea
                                                                                        id="observaciones"
                                                                                        placeholder="Agrega cualquier detalle adicional (equipaje especial, necesidades especiales, etc.)"
                                                                                        value={observaciones}
                                                                                        onChange={(e) => setObservaciones(e.target.value)}
                                                                                        rows={4}
                                                                                />
                                                                                <p className="text-xs text-muted-foreground">
                                                                                        Complementa tu reserva con indicaciones clave para el equipo de coordinación.
                                                                                </p>
                                                                                {observaciones.trim() !== (reservaEncontrada.observaciones || "") && (
                                                                                        <Button
                                                                                                onClick={guardarObservaciones}
                                                                                                disabled={guardandoObservaciones || !observaciones.trim()}
                                                                                                className="bg-blue-600 hover:bg-blue-700"
                                                                                        >
                                                                                                {guardandoObservaciones ? (
                                                                                                        <>
                                                                                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                                                                                Guardando...
                                                                                                        </>
                                                                                                ) : (
                                                                                                        <>
                                                                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                                                                Guardar observaciones
                                                                                                        </>
                                                                                                )}
                                                                                        </Button>
                                                                                )}
                                                                        </CardContent>
                                                                </Card>
                                                        </div>

                                                        <div className="space-y-4">
                                                                <Card className="h-full bg-white/80 border border-primary/10 shadow-lg">
                                                                        <CardHeader className="pb-3">
                                                                                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                                                                        Acciones principales
                                                                                </CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-4 text-sm text-gray-800">
                                                                                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-3 space-y-2">
                                                                                        <div className="flex items-center justify-between">
                                                                                                <span className="text-xs uppercase tracking-wide text-muted-foreground">Estado</span>
                                                                                                <div className="flex gap-2 flex-wrap justify-end">
                                                                                                        {getEstadoBadge(reservaEncontrada.estado)}
                                                                                                        {getEstadoPagoBadge(reservaEncontrada.estadoPago)}
                                                                                                </div>
                                                                                        </div>
                                                                                        <div className="flex items-center justify-between">
                                                                                                <span className="text-xs uppercase tracking-wide text-muted-foreground">Ruta</span>
                                                                                                <span className="font-semibold text-gray-900">{reservaEncontrada.origen} → {reservaEncontrada.destino}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center justify-between">
                                                                                                <span className="text-xs uppercase tracking-wide text-muted-foreground">Fecha</span>
                                                                                                <span className="font-medium text-gray-900">{formatDate(reservaEncontrada.fecha)}</span>
                                                                                        </div>
                                                                                </div>

                                                                                <div className="space-y-3">
                                                                                        {reservaEncontrada.estadoPago?.toLowerCase() !== "pagado" && (
                                                                                                <Button
                                                                                                        onClick={handleContinuarPago}
                                                                                                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
                                                                                                >
                                                                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                                                                        Continuar con el pago
                                                                                                </Button>
                                                                                        )}

                                                                                        {reservaEncontrada.estadoPago?.toLowerCase() === "pagado" &&
                                                                                                (!reservaEncontrada.hora || !reservaEncontrada.hotel) && (
                                                                                                        <Button
                                                                                                                onClick={() => {
                                                                                                                        if (onComplete) {
                                                                                                                                onComplete(reservaEncontrada.id);
                                                                                                                        }
                                                                                                                }}
                                                                                                                className="w-full bg-primary hover:bg-primary/90"
                                                                                                        >
                                                                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                                                                Completar detalles
                                                                                                        </Button>
                                                                                                )}

                                                                                        <Button
                                                                                                variant="outline"
                                                                                                onClick={handleCerrar}
                                                                                                disabled={guardandoObservaciones}
                                                                                                className="w-full"
                                                                                        >
                                                                                                Cerrar
                                                                                        </Button>
                                                                                </div>
                                                                        </CardContent>
                                                                </Card>
                                                        </div>
                                                </div>
                                        )}
                                </DialogContent>
                        </Dialog>
                </div>
        );
}

export default ContinuarReserva;
