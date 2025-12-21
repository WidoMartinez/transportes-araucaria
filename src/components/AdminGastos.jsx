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

const TIPOS_GASTO = [
	{ value: "combustible", label: "Combustible", icon: Fuel },
	{ value: "comision_flow", label: "Comisión Flow (3.19%)", icon: CreditCard },
	{ value: "pago_conductor", label: "Pago al Conductor", icon: User },
	{ value: "peaje", label: "Peaje", icon: Receipt },
	{ value: "mantenimiento", label: "Mantenimiento", icon: Car },
	{ value: "estacionamiento", label: "Estacionamiento", icon: Car },
	{ value: "otro", label: "Otro", icon: DollarSign },
];

function AdminGastos() {
	const { authenticatedFetch } = useAuthenticatedFetch();
	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	const [reservas, setReservas] = useState([]);
	const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
	const [gastos, setGastos] = useState([]);
	const [totalGastos, setTotalGastos] = useState(0);
	const [loading, setLoading] = useState(false);
	const [showBulkDialog, setShowBulkDialog] = useState(false);
	const [draftGastos, setDraftGastos] = useState([]);
	const [savingBulk, setSavingBulk] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showCerrarDialog, setShowCerrarDialog] = useState(false);
	const [mostrarCerradas, setMostrarCerradas] = useState(false);
	const [gastoToDelete, setGastoToDelete] = useState(null);
	const [conductores, setConductores] = useState([]);
	const [vehiculos, setVehiculos] = useState([]);

	const [formData, setFormData] = useState({
		tipoGasto: "",
		monto: "",
		porcentaje: "",
		descripcion: "",
		fecha: new Date().toISOString().split("T")[0],
		comprobante: "",
		conductorId: "",
		vehiculoId: "",
		observaciones: "",
	});

	const [editingGasto, setEditingGasto] = useState(null);

	useEffect(() => {
		fetchReservas();
		fetchConductores();
		fetchVehiculos();
	}, []);

	useEffect(() => {
		fetchReservas();
	}, [mostrarCerradas]);

	useEffect(() => {
		if (reservaSeleccionada?.id) {
			fetchGastos(reservaSeleccionada.id);
			// Refrescar datos de la reserva para asegurar que IDs de conductor/vehiculo esten actualizados
			fetchReservaDetalle(reservaSeleccionada.id);
		}
	}, [reservaSeleccionada?.id]);

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

	const fetchConductores = async () => {
		try {
			const response = await authenticatedFetch(`/api/conductores`, {
				method: "GET",
			});
			if (response.ok) {
				const data = await response.json();
				setConductores(data.conductores || []);
			}
		} catch (error) {
			console.error("Error al cargar conductores:", error);
		}
	};

	const fetchVehiculos = async () => {
		try {
			const response = await authenticatedFetch(`/api/vehiculos`, {
				method: "GET",
			});
			if (response.ok) {
				const data = await response.json();
				setVehiculos(data.vehiculos || []);
			}
		} catch (error) {
			console.error("Error al cargar vehículos:", error);
		}
	};

	const fetchGastos = async (reservaId) => {
		setLoading(true);
		try {
			const response = await authenticatedFetch(`/api/reservas/${reservaId}/gastos`, {
				method: "GET",
			});
			if (response.ok) {
				const data = await response.json();
				setGastos(data.gastos || []);
				setTotalGastos(data.totalGastos || 0);
			}
		} catch (error) {
			console.error("Error al cargar gastos:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchReservaDetalle = async (reservaId) => {
		try {
			const response = await authenticatedFetch(`/api/reservas/${reservaId}`, {
				method: "GET",
			});
			if (response.ok) {
				const data = await response.json();
				// Support both wrapped response { success: true, reserva: ... } and direct object response
				const reservaData = data.reserva || (data.id ? data : null);
				
				console.log("AdminGastos: Detalles de reserva actualizados:", reservaData);

				if (reservaData) {
					// Actualizar la reserva seleccionada con datos frescos (IDs de conductor/vehiculo)
					setReservaSeleccionada(prev => {
                        // Solo actualizar si hay cambios criticos para evitar re-renders innecesarios
                        if (prev && prev.id === reservaData.id) {
                            console.log("AdminGastos: Actualizando estado con nuevos datos:", {
                                conductorId: reservaData.conductorId,
                                vehiculoId: reservaData.vehiculoId
                            });
                            return { ...prev, ...reservaData };
                        }
                        return reservaData;
                    });
				}
			}
		} catch (error) {
			console.error("Error al actualizar detalles de reserva:", error);
		}
	};

	const createDraftGasto = useCallback(
		(initialTipoGasto = "") => {
			const defaultConductorId =
				reservaSeleccionada?.conductorId != null
					? reservaSeleccionada.conductorId.toString()
					: "";
			const defaultVehiculoId =
				reservaSeleccionada?.vehiculoId != null
					? reservaSeleccionada.vehiculoId.toString()
					: "";

			const fechaPorDefecto =
				reservaSeleccionada?.fecha ??
				new Date().toISOString().split("T")[0];

			const draft = {
				id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
				tipoGasto: initialTipoGasto,
				monto: "",
				porcentaje: "",
				descripcion: "",
				fecha: fechaPorDefecto,
				comprobante: "",
				conductorId: defaultConductorId,
				vehiculoId: defaultVehiculoId,
				observaciones: "",
			};

			if (
				initialTipoGasto === "comision_flow" &&
				reservaSeleccionada?.totalConDescuento
			) {
				const porcentaje = 3.19;
				const base = parseFloat(reservaSeleccionada.totalConDescuento) || 0;
				draft.porcentaje = porcentaje.toString();
				draft.monto = base > 0 ? ((base * porcentaje) / 100).toFixed(2) : "";
			}

			return draft;
		},
		[reservaSeleccionada]
	);

	useEffect(() => {
		if (!reservaSeleccionada?.id) {
			setDraftGastos([]);
			setShowBulkDialog(false);
			return;
		}

		const initialDrafts = TIPOS_GASTO.map((tipo) => createDraftGasto(tipo.value));
		setDraftGastos(initialDrafts);
		setShowBulkDialog(true);
	}, [reservaSeleccionada?.id, createDraftGasto]);

	const handleBulkDialogChange = (open) => {
		if (open) {
			setDraftGastos((prev) =>
				prev.length > 0 ? prev : [createDraftGasto()]
			);
		}
		setShowBulkDialog(open);
	};

	const handleAddDraftGasto = () => {
		setDraftGastos((prev) => [...prev, createDraftGasto()]);
	};

	const handleRemoveDraftGasto = (id) => {
		setDraftGastos((prev) => prev.filter((draft) => draft.id !== id));
	};

	const updateDraftGasto = (id, changes) => {
		setDraftGastos((prev) =>
			prev.map((draft) => (draft.id === id ? { ...draft, ...changes } : draft))
		);
	};

	const isDraftWithData = (draft) => {
		if (!draft) return false;
		const montoVal = draft.monto != null && String(draft.monto).trim() !== "";
		const textFields = [draft.descripcion, draft.comprobante, draft.observaciones]
			.map((campo) => (campo != null ? String(campo).trim() : ""))
			.filter(Boolean);
		return montoVal || textFields.length > 0;
	};

	const handleDraftTipoChange = (id, value) => {
		const draftActual = draftGastos.find((draft) => draft.id === id);

		if (value === "comision_flow" && reservaSeleccionada) {
			const porcentaje = 3.19;
			const base = parseFloat(reservaSeleccionada.totalConDescuento || 0);
			const montoCalc = Number.isFinite(base)
				? ((base * porcentaje) / 100).toFixed(2)
				: "";
			updateDraftGasto(id, {
				tipoGasto: value,
				porcentaje: porcentaje.toString(),
				monto: montoCalc,
			});
			return;
		}

		updateDraftGasto(id, {
			tipoGasto: value,
			porcentaje: "",
			monto:
				draftActual && draftActual.tipoGasto === "comision_flow"
					? ""
					: draftActual?.monto || "",
		});
	};

	const handleDraftFieldChange = (id, field, value) => {
		updateDraftGasto(id, { [field]: value });
	};

	const handleSaveBulkGastos = async () => {
		if (!reservaSeleccionada) {
			alert("Selecciona una reserva primero");
			return;
		}

		if (draftGastos.length === 0) {
			alert("Agrega al menos un gasto");
			return;
		}

		const hasIncompleteDraft = draftGastos.some((draft) => {
			if (!isDraftWithData(draft)) {
				return false;
			}

			const hasTipo = Boolean(draft.tipoGasto);
			const hasMonto =
				draft.monto != null && String(draft.monto).trim() !== "";
			const hasFecha =
				draft.fecha != null && String(draft.fecha).trim() !== "";

			return !(hasTipo && hasMonto && hasFecha);
		});

		if (hasIncompleteDraft) {
			alert("Completa tipo, monto y fecha para todos los gastos antes de guardar");
			return;
		}

		const validDrafts = draftGastos.filter((draft) => {
			if (!isDraftWithData(draft)) return false;
			const hasTipo = Boolean(draft.tipoGasto);
			const hasMonto =
				draft.monto != null && String(draft.monto).trim() !== "";
			const hasFecha =
				draft.fecha != null && String(draft.fecha).trim() !== "";
			return hasTipo && hasMonto && hasFecha;
		});

		if (validDrafts.length === 0) {
			alert("Agrega al menos un gasto con tipo, monto y fecha");
			return;
		}

		setSavingBulk(true);
		try {
			for (const draft of validDrafts) {
				const response = await authenticatedFetch(`/api/gastos`, {
					method: "POST",
					body: JSON.stringify({
						reservaId: reservaSeleccionada.id,
						tipoGasto: draft.tipoGasto,
						monto: draft.monto,
						porcentaje: draft.porcentaje || null,
						descripcion: draft.descripcion || null,
						fecha: draft.fecha,
						comprobante: draft.comprobante || null,
						conductorId: draft.conductorId || null,
						vehiculoId: draft.vehiculoId || null,
						observaciones: draft.observaciones || null,
					}),
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || "Error al guardar gasto");
				}
			}

			await fetchGastos(reservaSeleccionada.id);
			const refreshedDrafts = TIPOS_GASTO.map((tipo) =>
				createDraftGasto(tipo.value)
			);
			setDraftGastos(refreshedDrafts);
			setShowBulkDialog(false);
		} catch (error) {
			console.error("Error al guardar gastos:", error);
			alert(error.message || "Error al guardar gastos");
		} finally {
			setSavingBulk(false);
		}
	};

	const handleUpdateGasto = async () => {
		if (!editingGasto) return;

		setLoading(true);
		try {
			const response = await authenticatedFetch(`/api/gastos/${editingGasto.id}`, {
				method: "PUT",
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				await fetchGastos(reservaSeleccionada.id);
				setShowEditDialog(false);
				resetForm();
				setEditingGasto(null);
			} else {
				const error = await response.json();
				alert(`Error: ${error.error}`);
			}
		} catch (error) {
			console.error("Error al actualizar gasto:", error);
			alert("Error al actualizar gasto");
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteGasto = async () => {
		if (!gastoToDelete) return;

		setLoading(true);
		try {
			const response = await authenticatedFetch(`/api/gastos/${gastoToDelete.id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				await fetchGastos(reservaSeleccionada.id);
				setShowDeleteDialog(false);
				setGastoToDelete(null);
			} else {
				const error = await response.json();
				alert(`Error: ${error.error}`);
			}
		} catch (error) {
			console.error("Error al eliminar gasto:", error);
			alert("Error al eliminar gasto");
		} finally {
			setLoading(false);
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
				setGastos([]);
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

	const openEditDialog = (gasto) => {
		setEditingGasto(gasto);
		setFormData({
			tipoGasto: gasto.tipoGasto,
			monto: gasto.monto,
			porcentaje: gasto.porcentaje || "",
			descripcion: gasto.descripcion || "",
			fecha: gasto.fecha ? new Date(gasto.fecha).toISOString().split("T")[0] : "",
			comprobante: gasto.comprobante || "",
			conductorId: gasto.conductorId || "",
			vehiculoId: gasto.vehiculoId || "",
			observaciones: gasto.observaciones || "",
		});
		setShowEditDialog(true);
	};

	const resetForm = () => {
		setFormData({
			tipoGasto: "",
			monto: "",
			porcentaje: "",
			descripcion: "",
			fecha: new Date().toISOString().split("T")[0],
			comprobante: "",
			conductorId: "",
			vehiculoId: "",
			observaciones: "",
		});
	};

	const calcularMontoComisionFlow = useCallback(() => {
		if (reservaSeleccionada) {
			const porcentaje = 3.19;
			const monto = (parseFloat(reservaSeleccionada.totalConDescuento) * porcentaje) / 100;
			setFormData(prev => ({ 
				...prev, 
				porcentaje: porcentaje.toString(), 
				monto: monto.toFixed(2) 
			}));
		}
	}, [reservaSeleccionada]);

	useEffect(() => {
		if (formData.tipoGasto === "comision_flow") {
			calcularMontoComisionFlow();
		}
	}, [formData.tipoGasto, calcularMontoComisionFlow]);

	const getTipoGastoLabel = (tipo) => {
		const tipoObj = TIPOS_GASTO.find((t) => t.value === tipo);
		return tipoObj ? tipoObj.label : tipo;
	};

	const getTipoGastoIcon = (tipo) => {
		const tipoObj = TIPOS_GASTO.find((t) => t.value === tipo);
		const Icon = tipoObj ? tipoObj.icon : DollarSign;
		return <Icon className="w-4 h-4" />;
	};

	const getNombreConductor = (conductor) => {
		if (!conductor) return "";

		const limpiarParte = (valor) => {
			if (valor == null) return null;
			const texto = String(valor).trim();
			if (
				texto === "" ||
				texto.toLowerCase() === "undefined" ||
				texto.toLowerCase() === "null"
			) {
				return null;
			}
			return texto;
		};

		if (typeof conductor === "string") {
			return limpiarParte(conductor) ?? "";
		}

		const partes = [conductor.nombre, conductor.apellido]
			.map(limpiarParte)
			.filter(Boolean);

		return partes.join(" ");
	};

	const getDetalleVehiculo = (vehiculo) => {
		if (!vehiculo) return "";
		const partes = [
			vehiculo.patente,
			[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" "),
		].filter(Boolean);
		return partes.join(" · ");
	};

	const conductorAsignadoReserva =
		reservaSeleccionada?.conductorId != null
			? conductores.find(
					(conductor) => conductor.id === Number(reservaSeleccionada.conductorId)
			  )
			: null;

	const vehiculoAsignadoReserva =
		reservaSeleccionada?.vehiculoId != null
			? vehiculos.find(
					(vehiculo) => vehiculo.id === Number(reservaSeleccionada.vehiculoId)
			  )
			: null;

	const totalDraftMonto = draftGastos.reduce((acc, draft) => {
		const value = parseFloat(draft.monto);
		return acc + (Number.isNaN(value) ? 0 : value);
	}, 0);

	const totalPagoConductor = useMemo(() => {
		return gastos.reduce((acc, gasto) => {
			if (gasto.tipoGasto !== "pago_conductor") return acc;
			const monto = parseFloat(gasto.monto);
			return acc + (Number.isNaN(monto) ? 0 : monto);
		}, 0);
	}, [gastos]);

	const totalReservaNeta = useMemo(() => {
		const valor = reservaSeleccionada?.totalConDescuento ?? 0;
		return parseFloat(valor) || 0;
	}, [reservaSeleccionada?.totalConDescuento]);

	const utilidadNegocio = totalReservaNeta - totalGastos;

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
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Gastos de la Reserva</CardTitle>
								<p className="text-sm text-muted-foreground mt-1">
									{reservaSeleccionada.codigoReserva} - {reservaSeleccionada.nombre}
								</p>
							</div>
							<div className="flex items-center gap-4">
								<div className="text-right">
									<p className="text-sm text-muted-foreground">Total Gastos</p>
									<p className="text-2xl font-bold text-red-600">
										${totalGastos.toLocaleString("es-CL")}
									</p>
								</div>
				
				<Dialog open={showBulkDialog} onOpenChange={handleBulkDialogChange}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="w-4 h-4 mr-2" />
							Registrar gastos
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-4xl">
						<DialogHeader>
							<DialogTitle>Registrar gastos de la reserva</DialogTitle>
							<DialogDescription>
								Agrega varios gastos y guardalos en un solo paso.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="rounded-lg border bg-muted/20 p-4 text-sm">
								<p className="font-medium">
									{reservaSeleccionada.codigoReserva} - {reservaSeleccionada.nombre}
								</p>
								<div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
									<span>Conductor:</span>
									{conductorAsignadoReserva ? (
										<Badge variant="secondary">
											{getNombreConductor(conductorAsignadoReserva)}
										</Badge>
									) : (
										<Badge variant="outline">Sin asignar</Badge>
									)}
									<span>Vehiculo:</span>
									{vehiculoAsignadoReserva ? (
										<Badge variant="secondary">
											{getDetalleVehiculo(vehiculoAsignadoReserva)}
										</Badge>
									) : (
										<Badge variant="outline">Sin asignar</Badge>
									)}
								</div>
							</div>

							{draftGastos.length === 0 ? (
								<div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
									No hay gastos en preparacion. Usa "Agregar gasto" para comenzar.
								</div>
							) : (
								<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
									{draftGastos.map((draft, index) => (
										<div
											key={draft.id}
											className="space-y-4 rounded-lg border bg-background p-4 shadow-sm"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
														{index + 1}
													</div>
													<div className="flex items-center gap-2 text-sm font-semibold">
														{getTipoGastoIcon(draft.tipoGasto)}
														<span>
															{draft.tipoGasto
																? getTipoGastoLabel(draft.tipoGasto)
																: "Selecciona un tipo"}
														</span>
													</div>
												</div>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleRemoveDraftGasto(draft.id)}
													disabled={savingBulk}
													title="Eliminar gasto"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>

											<div className="grid gap-4 md:grid-cols-2">
												<div>
													<Label>Tipo de gasto *</Label>
													<Select
														value={draft.tipoGasto || "none"}
														onValueChange={(value) => {
															handleDraftTipoChange(
																draft.id,
																value === "none" ? "" : value
															);
														}}
													>
														<SelectTrigger>
															<SelectValue placeholder="Selecciona el tipo" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="none">Selecciona el tipo</SelectItem>
														{TIPOS_GASTO.map((tipo) => {
															return (
																<SelectItem key={tipo.value} value={tipo.value}>
																	{tipo.label}
																</SelectItem>
															);
														})}
														</SelectContent>
													</Select>
												</div>
												<div>
													<Label>Monto *</Label>
													<Input
														type="number"
														step="0.01"
														value={draft.monto}
														onChange={(e) => {
															handleDraftFieldChange(
																draft.id,
																"monto",
																e.target.value
															);
														}}
														disabled={draft.tipoGasto === "comision_flow"}
													/>
												</div>
												<div>
													<Label>Comprobante</Label>
													<Input
														value={draft.comprobante}
														onChange={(e) => {
															handleDraftFieldChange(
																draft.id,
																"comprobante",
																e.target.value
															);
														}}
														placeholder="Numero de comprobante o referencia"
													/>
												</div>
											</div>

											{(() => {
												const conductorSeleccionado =
													conductorAsignadoReserva ||
													conductores.find(
														(c) => c.id.toString() === (draft.conductorId || "")
													);
												const vehiculoSeleccionado =
													vehiculoAsignadoReserva ||
													vehiculos.find(
														(v) => v.id.toString() === (draft.vehiculoId || "")
													);

												return (
													<div className="grid gap-4 md:grid-cols-2">
														<div>
															<Label>Fecha del servicio</Label>
															<Input value={draft.fecha} readOnly disabled />
															<p className="text-xs text-muted-foreground mt-1">
																Se toma desde la reserva seleccionada.
															</p>
														</div>
														<div className="space-y-1">
															<Label>Asignación logística</Label>
															<p className="text-sm text-muted-foreground">
																<span className="font-medium">Conductor:</span>{" "}
																{conductorSeleccionado
																	? getNombreConductor(conductorSeleccionado)
																	: "Sin asignar"}
															</p>
															<p className="text-sm text-muted-foreground">
																<span className="font-medium">Vehículo:</span>{" "}
																{vehiculoSeleccionado
																	? getDetalleVehiculo(vehiculoSeleccionado)
																	: "Sin asignar"}
															</p>
														</div>
													</div>
												);
											})()}

											{draft.tipoGasto === "comision_flow" && (
												<div className="rounded-md bg-chocolate-50 p-3 text-xs text-chocolate-800">
													<AlertCircle className="mr-2 inline h-4 w-4" />
													El monto se calcula automaticamente como el 3.19% del total de la reserva.
												</div>
											)}

											<div className="grid gap-4 md:grid-cols-2">
												<div>
													<Label>Descripcion</Label>
													<Textarea
														value={draft.descripcion}
														onChange={(e) => {
															handleDraftFieldChange(
																draft.id,
																"descripcion",
																e.target.value
															);
														}}
														placeholder="Detalle del gasto"
													/>
												</div>
												<div>
													<Label>Observaciones</Label>
													<Textarea
														value={draft.observaciones}
														onChange={(e) => {
															handleDraftFieldChange(
																draft.id,
																"observaciones",
																e.target.value
															);
														}}
														placeholder="Notas internas"
													/>
												</div>
											</div>
									</div>
								))}
							</div>
							)}

							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<Button
									type="button"
									variant="outline"
									onClick={handleAddDraftGasto}
									disabled={savingBulk}
								>
									<Plus className="mr-2 h-4 w-4" />
									Agregar gasto
								</Button>
								<div className="text-right text-sm">
									<p>
										Nuevos gastos:{" "}
										<strong>
											${totalDraftMonto.toLocaleString("es-CL")}
										</strong>
									</p>
									<p className="text-muted-foreground">
										Se sumara al total actual de ${totalGastos.toLocaleString("es-CL")}.
									</p>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => handleBulkDialogChange(false)}
								disabled={savingBulk}
							>
								Cancelar
							</Button>
							<Button
								onClick={handleSaveBulkGastos}
								disabled={savingBulk || draftGastos.length === 0}
							>
								{savingBulk ? "Guardando..." : "Guardar gastos"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			
			{/* Botón Cerrar Gastos */}
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
						</CardHeader>
						<CardContent>
							{loading ? (
								<p>Cargando gastos...</p>
							) : gastos.length === 0 ? (
								<p className="text-muted-foreground text-center py-8">
									No hay gastos registrados para esta reserva
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Tipo</TableHead>
											<TableHead>Monto</TableHead>
											<TableHead>Fecha</TableHead>
											<TableHead>Conductor</TableHead>
											<TableHead>Vehículo</TableHead>
											<TableHead>Descripción</TableHead>
											<TableHead>Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{gastos.map((gasto) => (
											<TableRow key={gasto.id}>
												<TableCell>
													<div className="flex items-center gap-2">
														{getTipoGastoIcon(gasto.tipoGasto)}
														<span>{getTipoGastoLabel(gasto.tipoGasto)}</span>
													</div>
												</TableCell>
												<TableCell className="font-semibold">
													${parseFloat(gasto.monto).toLocaleString("es-CL")}
												</TableCell>
												<TableCell>
													{new Date(gasto.fecha).toLocaleDateString("es-CL")}
												</TableCell>
												<TableCell>
													{gasto.conductor
														? getNombreConductor(gasto.conductor)
														: "-"}
												</TableCell>
												<TableCell>
													{gasto.vehiculo
														? `${gasto.vehiculo.patente}`
														: "-"}
												</TableCell>
												<TableCell className="max-w-xs truncate">
													{gasto.descripcion || "-"}
												</TableCell>
												<TableCell>
													<div className="flex gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => openEditDialog(gasto)}
														>
															<Edit className="w-4 h-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => {
																setGastoToDelete(gasto);
																setShowDeleteDialog(true);
															}}
														>
															<Trash2 className="w-4 h-4 text-red-600" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Resumen Financiero</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
								<div className="p-4 bg-green-50 rounded-lg">
									<p className="text-sm text-green-800 font-medium">Total Reserva</p>
									<p className="text-2xl font-bold text-green-600">
										${totalReservaNeta.toLocaleString("es-CL")}
									</p>
								</div>
								<div className="p-4 bg-red-50 rounded-lg">
									<p className="text-sm text-red-800 font-medium">Total Gastos</p>
									<p className="text-2xl font-bold text-red-600">
										${totalGastos.toLocaleString("es-CL")}
									</p>
								</div>
								<div className="p-4 bg-chocolate-50 rounded-lg">
									<p className="text-sm text-chocolate-800 font-medium">Utilidad del Negocio</p>
									<p className="text-2xl font-bold text-chocolate-600">
										${utilidadNegocio.toLocaleString("es-CL")}
									</p>
									<p className="text-xs text-chocolate-700 mt-1">
										Ingresos menos todos los gastos asociados a la reserva.
									</p>
								</div>
								<div className="p-4 bg-amber-50 rounded-lg">
									<p className="text-sm text-amber-800 font-medium">Pago al Conductor</p>
									<p className="text-2xl font-bold text-amber-600">
										${totalPagoConductor.toLocaleString("es-CL")}
									</p>
									<p className="text-xs text-amber-700 mt-1">
										Suma de los gastos registrados como pago al conductor.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			)}

			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Editar Gasto</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Tipo de Gasto *</Label>
							<Select
								value={formData.tipoGasto}
								onValueChange={(value) =>
									setFormData({ ...formData, tipoGasto: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TIPOS_GASTO.map((tipo) => (
										<SelectItem key={tipo.value} value={tipo.value}>
											{tipo.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label>Monto *</Label>
							<Input
								type="number"
								step="0.01"
								value={formData.monto}
								onChange={(e) =>
									setFormData({ ...formData, monto: e.target.value })
								}
							/>
						</div>



						<div>
							<Label>Descripción</Label>
							<Textarea
								value={formData.descripcion}
								onChange={(e) =>
									setFormData({ ...formData, descripcion: e.target.value })
								}
							/>
						</div>



						<div>
							<Label>Observaciones</Label>
							<Textarea
								value={formData.observaciones}
								onChange={(e) =>
									setFormData({ ...formData, observaciones: e.target.value })
								}
							/>
						</div>

						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setShowEditDialog(false);
									resetForm();
									setEditingGasto(null);
								}}
							>
								Cancelar
							</Button>
							<Button onClick={handleUpdateGasto} disabled={loading}>
								{loading ? "Guardando..." : "Guardar Cambios"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setGastoToDelete(null)}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteGasto} disabled={loading}>
							{loading ? "Eliminando..." : "Eliminar"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default AdminGastos;
