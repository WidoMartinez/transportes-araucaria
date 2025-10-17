import React, { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "./ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
	Search,
	ChevronLeft,
	ChevronRight,
	Edit,
	Eye,
	DollarSign,
	Calendar,
	User,
	Phone,
	Mail,
	MapPin,
	Clock,
	Users,
	FileText,
	TrendingUp,
	CheckCircle2,
	XCircle,
	AlertCircle,
	RefreshCw,
	Plus,
	Star,
	History,
	Settings2,
	Trash2,
	CheckSquare,
	Square,
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
} from "./ui/alert-dialog";

function AdminReservas() {
	const [reservas, setReservas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedReserva, setSelectedReserva] = useState(null);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [showNewDialog, setShowNewDialog] = useState(false);
	const [saving, setSaving] = useState(false);
	// Estados para editar ruta con 'otro'
	const [editOrigenEsOtro, setEditOrigenEsOtro] = useState(false);
	const [editDestinoEsOtro, setEditDestinoEsOtro] = useState(false);
	const [editOtroOrigen, setEditOtroOrigen] = useState("");
	const [editOtroDestino, setEditOtroDestino] = useState("");
	
	// Estados para asignación de vehículo/conductor
	const [showAsignarDialog, setShowAsignarDialog] = useState(false);
	const [vehiculos, setVehiculos] = useState([]);
	const [conductores, setConductores] = useState([]);
	const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState("");
	const [conductorSeleccionado, setConductorSeleccionado] = useState("");
	const [loadingAsignacion, setLoadingAsignacion] = useState(false);
	const [enviarNotificacion, setEnviarNotificacion] = useState(true);
	// Estados para pre-cargar y validar contra asignación actual
	const [assignedPatente, setAssignedPatente] = useState("");
	const [assignedConductorNombre, setAssignedConductorNombre] = useState("");
	const [assignedVehiculoId, setAssignedVehiculoId] = useState(null);
	const [assignedConductorId, setAssignedConductorId] = useState(null);
	const [historialAsignaciones, setHistorialAsignaciones] = useState([]);
	const [loadingHistorial, setLoadingHistorial] = useState(false);

	const fetchHistorialAsignaciones = async (reservaId) => {
		try {
			setLoadingHistorial(true);
			const ADMIN_TOKEN = localStorage.getItem("adminToken");
			const resp = await fetch(`${apiUrl}/api/reservas/${reservaId}/asignaciones`, {
				headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {},
			});
			if (resp.ok) {
				const data = await resp.json();
				setHistorialAsignaciones(Array.isArray(data.historial) ? data.historial : []);
			} else {
				setHistorialAsignaciones([]);
			}
		} catch (e) {
			setHistorialAsignaciones([]);
		} finally {
			setLoadingHistorial(false);
		}
	};

	// Filtros y búsqueda
	const [searchTerm, setSearchTerm] = useState("");
	const [estadoFiltro, setEstadoFiltro] = useState("todos");
	const [estadoPagoFiltro, setEstadoPagoFiltro] = useState("todos");
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");

	// Paginación
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalReservas, setTotalReservas] = useState(0);
	const itemsPerPage = 20;

	// Estadísticas
	const [estadisticas, setEstadisticas] = useState({
		totalReservas: 0,
		reservasPendientes: 0,
		reservasConfirmadas: 0,
		reservasPagadas: 0,
		totalIngresos: 0,
	});

	// Formulario de edición
        const [formData, setFormData] = useState({
                estado: "",
                estadoPago: "",
                metodoPago: "",
                referenciaPago: "",
                tipoPago: "",
                montoPagado: "",
                observaciones: "",
                numeroVuelo: "",
                hotel: "",
                equipajeEspecial: "",
		sillaInfantil: false,
		horaRegreso: "",
	});

	// Formulario de nueva reserva
	const [newReservaForm, setNewReservaForm] = useState({
		nombre: "",
		rut: "",
		email: "",
		telefono: "",
		clienteId: null,
		origen: "",
		destino: "",
		fecha: "",
		hora: "08:00",
		pasajeros: 1,
		precio: 0,
		vehiculo: "sedan",
		numeroVuelo: "",
		hotel: "",
		equipajeEspecial: "",
		sillaInfantil: false,
		idaVuelta: false,
		fechaRegreso: "",
		horaRegreso: "",
		abonoSugerido: 0,
		saldoPendiente: 0,
		totalConDescuento: 0,
		mensaje: "",
		estado: "confirmada",
		estadoPago: "pendiente",
		metodoPago: "",
		observaciones: "",
	});

	// Catálogo de destinos (para selects)
	const [destinosCatalog, setDestinosCatalog] = useState([]);
	const [origenEsOtro, setOrigenEsOtro] = useState(false);
	const [destinoEsOtro, setDestinoEsOtro] = useState(false);
	const [otroOrigen, setOtroOrigen] = useState("");
	const [otroDestino, setOtroDestino] = useState("");

	const fetchDestinosCatalog = async () => {
		try {
			const resp = await fetch(`${apiUrl}/pricing`);
			if (resp.ok) {
				const data = await resp.json();
				const names = Array.isArray(data.destinos)
					? data.destinos.map((d) => d.nombre).filter(Boolean)
					: [];
				setDestinosCatalog(names);
			}
		} catch (e) {
			setDestinosCatalog([]);
		}
	};

	// Estados para autocompletado de clientes
	const [clienteSugerencias, setClienteSugerencias] = useState([]);
	const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);
	const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

	// Estados para columnas visibles
	const [columnasVisibles, setColumnasVisibles] = useState({
		id: true,
		cliente: true,
		contacto: true,
		rut: false,
		ruta: true,
		fechaHora: true,
		pasajeros: true,
		total: true,
		estado: true,
		pago: true,
		saldo: true,
		esCliente: false,
		numViajes: false,
		acciones: true,
	});

	// Estado para modal de historial de cliente
	const [showHistorialDialog, setShowHistorialDialog] = useState(false);
	const [historialCliente, setHistorialCliente] = useState(null);

	// Estados para acciones masivas
	const [selectedReservas, setSelectedReservas] = useState([]);
	const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
	const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
	const [showBulkPaymentDialog, setShowBulkPaymentDialog] = useState(false);
	const [bulkEstado, setBulkEstado] = useState("");
	const [bulkEstadoPago, setBulkEstadoPago] = useState("");
	const [processingBulk, setProcessingBulk] = useState(false);

	const apiUrl =
		import.meta.env.VITE_API_URL ||
		"https://transportes-araucaria.onrender.com";

	// Cargar estadísticas
	const fetchEstadisticas = async () => {
		try {
			const response = await fetch(`${apiUrl}/api/reservas/estadisticas`);
			if (response.ok) {
				const data = await response.json();
				setEstadisticas(data);
			} else {
				console.warn(
					`Error cargando estadísticas: ${response.status} ${response.statusText}`
				);
				// Establecer estadísticas por defecto en caso de error
				setEstadisticas({
					totalReservas: 0,
					reservasPendientes: 0,
					reservasConfirmadas: 0,
					reservasPagadas: 0,
					totalIngresos: 0,
				});
			}
		} catch (error) {
			console.error("Error cargando estadísticas:", error);
			// Establecer estadísticas por defecto en caso de error
			setEstadisticas({
				totalReservas: 0,
				reservasPendientes: 0,
				reservasConfirmadas: 0,
				reservasPagadas: 0,
				totalIngresos: 0,
			});
		}
	};

	// Cargar vehículos disponibles
	const fetchVehiculos = async () => {
		try {
			const response = await fetch(`${apiUrl}/api/vehiculos`);
			if (response.ok) {
				const data = await response.json();
				setVehiculos(data.vehiculos || []);
			}
		} catch (error) {
			console.error("Error cargando vehículos:", error);
		}
	};

	// Cargar conductores disponibles
	const fetchConductores = async () => {
		try {
			const response = await fetch(`${apiUrl}/api/conductores`);
			if (response.ok) {
				const data = await response.json();
				setConductores(data.conductores || []);
			}
		} catch (error) {
			console.error("Error cargando conductores:", error);
		}
	};

	// Abrir diálogo de asignación
	const handleAsignar = (reserva) => {
		setSelectedReserva(reserva);
		// Derivar patente del label "TIPO PATENTE"
		const pat = (reserva.vehiculo || "")
			.trim()
			.split(" ")
			.pop()
			.toUpperCase();
		setAssignedPatente(pat || "");
		// Intentar extraer nombre de conductor desde observaciones
		const obs = (reserva.observaciones || "").toString();
		const m = obs.match(/Conductor asignado:\s*([^(|\n]+?)(?:\s*\(|$)/i);
		const nombreCon = m ? m[1].trim() : "";
		setAssignedConductorNombre(nombreCon);
		// Intentar preseleccionar si los catálogos ya existen
		let preVeh = "";
		if (vehiculos.length > 0 && pat) {
			const found = vehiculos.find((v) => (v.patente || "").toUpperCase() === pat);
			if (found) {
				preVeh = found.id.toString();
				setAssignedVehiculoId(found.id);
			}
		}
		let preCon = "none";
		if (conductores.length > 0 && nombreCon) {
			const foundC = conductores.find(
				(c) => (c.nombre || "").toLowerCase() === nombreCon.toLowerCase()
			);
			if (foundC) {
				preCon = foundC.id.toString();
				setAssignedConductorId(foundC.id);
			}
		}
		setVehiculoSeleccionado(preVeh);
		setConductorSeleccionado(preCon);
		setEnviarNotificacion(true);
		setShowAsignarDialog(true);
		// Cargar vehículos y conductores si aún no se han cargado
		if (vehiculos.length === 0) fetchVehiculos();
		if (conductores.length === 0) fetchConductores();
	};

	// Pre-cargar selección cuando se abren catálogos
	useEffect(() => {
		if (!showAsignarDialog) return;
		if (!vehiculoSeleccionado && assignedPatente && vehiculos.length > 0) {
			const found = vehiculos.find((v) => (v.patente || "").toUpperCase() === assignedPatente);
			if (found) {
				setVehiculoSeleccionado(found.id.toString());
				setAssignedVehiculoId(found.id);
			}
		}
		if (assignedConductorNombre && conductores.length > 0) {
			const foundC = conductores.find(
				(c) => (c.nombre || "").toLowerCase() === assignedConductorNombre.toLowerCase()
			);
			if (foundC) {
				setConductorSeleccionado(foundC.id.toString());
				setAssignedConductorId(foundC.id);
			}
		}
	}, [showAsignarDialog, vehiculos, conductores, assignedPatente, assignedConductorNombre]);

	// Guardar asignación de vehículo/conductor
	const handleGuardarAsignacion = async () => {
		if (!vehiculoSeleccionado) {
			alert("Debe seleccionar al menos un vehículo");
			return;
		}

		setLoadingAsignacion(true);
		try {
			const ADMIN_TOKEN = localStorage.getItem("adminToken");
			const response = await fetch(
				`${apiUrl}/api/reservas/${selectedReserva.id}/asignar`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${ADMIN_TOKEN}`,
					},
					body: JSON.stringify({
						vehiculoId: parseInt(vehiculoSeleccionado),
						conductorId:
							conductorSeleccionado && conductorSeleccionado !== "none"
								? parseInt(conductorSeleccionado)
								: null,
						sendEmail: Boolean(enviarNotificacion),
					}),
				}
			);

			if (response.ok) {
				await fetchReservas(); // Recargar reservas
				setShowAsignarDialog(false);
				alert("Vehículo y conductor asignados correctamente");
				// Refrescar historial si estamos viendo detalles
				if (showDetailDialog && selectedReserva?.id) {
					setLoadingHistorial(true);
					try {
						const ADMIN_TOKEN = localStorage.getItem("adminToken");
						const resp = await fetch(`${apiUrl}/api/reservas/${selectedReserva.id}/asignaciones`, {
							headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {},
						});
						if (resp.ok) {
							const data = await resp.json();
							setHistorialAsignaciones(Array.isArray(data.historial) ? data.historial : []);
						}
					} catch (e) {
						// noop
					}
					setLoadingHistorial(false);
				}
			} else {
				const data = await response.json();
				alert(data.error || "Error al asignar vehículo/conductor");
			}
		} catch (error) {
			console.error("Error asignando vehículo/conductor:", error);
			alert("Error al asignar vehículo/conductor");
		} finally {
			setLoadingAsignacion(false);
		}
	};

	// Cargar reservas
	const fetchReservas = async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				page: currentPage,
				limit: itemsPerPage,
			});

			if (estadoFiltro !== "todos") {
				params.append("estado", estadoFiltro);
			}

			if (fechaDesde) {
				params.append("fecha_desde", fechaDesde);
			}

			if (fechaHasta) {
				params.append("fecha_hasta", fechaHasta);
			}

			const response = await fetch(`${apiUrl}/api/reservas?${params}`);

			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}

                        const data = await response.json();
                        const reservasNormalizadas = (data.reservas || []).map((reserva) => {
                                const cliente = reserva.cliente || {};
                                return {
                                        ...reserva,
                                        esCliente:
                                                reserva.esCliente !== undefined
                                                        ? reserva.esCliente
                                                        : cliente.esCliente || false,
                                        clasificacionCliente: cliente.clasificacion || null,
                                        totalReservas:
                                                reserva.totalReservas !== undefined
                                                        ? reserva.totalReservas
                                                        : cliente.totalReservas || 0,
                                        abonoPagado: Boolean(reserva.abonoPagado),
                                        saldoPagado: Boolean(reserva.saldoPagado),
                                };
                        });
                        setReservas(reservasNormalizadas);
			setTotalPages(data.pagination?.totalPages || 1);
			setTotalReservas(data.pagination?.total || 0);
		} catch (error) {
			console.error("Error cargando reservas:", error);
			setError(error.message || "Error al cargar las reservas");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReservas();
		fetchEstadisticas();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, estadoFiltro, fechaDesde, fechaHasta]);

	// Filtrar reservas localmente por búsqueda
	const reservasFiltradas = useMemo(() => {
		let filtered = reservas;

		// Filtro de búsqueda
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(r) =>
					r.nombre?.toLowerCase().includes(term) ||
					r.email?.toLowerCase().includes(term) ||
					r.telefono?.toLowerCase().includes(term) ||
					r.id?.toString().includes(term)
			);
		}

		// Filtro de estado de pago
		if (estadoPagoFiltro !== "todos") {
			filtered = filtered.filter((r) => r.estadoPago === estadoPagoFiltro);
		}

		return filtered;
	}, [reservas, searchTerm, estadoPagoFiltro]);

	// Abrir modal de edición
        const handleEdit = (reserva) => {
                setSelectedReserva(reserva);
                setFormData({
                        nombre: reserva.nombre || "",
                        email: reserva.email || "",
                        telefono: reserva.telefono || "",
                        origen: reserva.origen || "",
                        destino: reserva.destino || "",
                        fecha: (reserva.fecha || "").toString().substring(0,10),
                        hora: reserva.hora || "",
                        pasajeros: String(reserva.pasajeros || ""),
                        estado: reserva.estado || "",
                        estadoPago: reserva.estadoPago || "",
                        metodoPago: reserva.metodoPago || "",
                        referenciaPago: reserva.referenciaPago || "",
                        tipoPago: "",
                        montoPagado:
                                reserva.pagoMonto !== undefined && reserva.pagoMonto !== null
                                        ? String(reserva.pagoMonto)
                                        : "",
                        observaciones: reserva.observaciones || "",
                        numeroVuelo: reserva.numeroVuelo || "",
                        hotel: reserva.hotel || "",
                        equipajeEspecial: reserva.equipajeEspecial || "",
			sillaInfantil: reserva.sillaInfantil || false,
			horaRegreso: reserva.horaRegreso || "",
                        idaVuelta: Boolean(reserva.idaVuelta),
                        fechaRegreso: (reserva.fechaRegreso || "").toString().substring(0,10),
                });
		// Reset edición de ruta
		setEditOrigenEsOtro(false);
		setEditDestinoEsOtro(false);
		setEditOtroOrigen("");
		setEditOtroDestino("");
		// Cargar catálogo de destinos para selects
		fetchDestinosCatalog();
                setShowEditDialog(true);
        };

	// Abrir modal de detalles
	const handleViewDetails = async (reserva) => {
		setSelectedReserva(reserva);
		setShowDetailDialog(true);

		// Cargar historial de asignaciones (uso interno)
		try {
			setLoadingHistorial(true);
			const ADMIN_TOKEN = localStorage.getItem("adminToken");
			const resp = await fetch(`${apiUrl}/api/reservas/${reserva.id}/asignaciones`, {
				headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {},
			});
			if (resp.ok) {
				const data = await resp.json();
				setHistorialAsignaciones(Array.isArray(data.historial) ? data.historial : []);
			} else {
				setHistorialAsignaciones([]);
			}
		} catch (e) {
			setHistorialAsignaciones([]);
		} finally {
			setLoadingHistorial(false);
		}
	};

	// Guardar cambios
	const handleSave = async () => {
		if (!selectedReserva) return;

		setSaving(true);
		try {
            // Actualizar datos generales de la reserva
            try {
                const ADMIN_TOKEN = localStorage.getItem("adminToken");
                const generalResp = await fetch(`${apiUrl}/api/reservas/${selectedReserva.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
                    body: JSON.stringify({
                        nombre: formData.nombre,
                        email: formData.email,
                        telefono: formData.telefono,
                        fecha: formData.fecha,
                        hora: formData.hora,
                        pasajeros: Number(formData.pasajeros) || selectedReserva.pasajeros,
                        numeroVuelo: formData.numeroVuelo,
                        hotel: formData.hotel,
                        equipajeEspecial: formData.equipajeEspecial,
                        sillaInfantil: Boolean(formData.sillaInfantil),
                        idaVuelta: Boolean(formData.idaVuelta),
                        fechaRegreso: formData.fechaRegreso || null,
                        horaRegreso: formData.horaRegreso || null,
                        mensaje: selectedReserva.mensaje,
                    }),
                });
                if (!generalResp.ok) {
                    const t = await generalResp.text();
                    console.warn("No se pudo actualizar datos generales:", t);
                }
            } catch (e) {
                console.warn("Error actualizando datos generales (no crítico):", e.message);
            }
			// Actualizar ruta si cambió
			const origenFinalEdit = editOrigenEsOtro ? (editOtroOrigen || formData.origen) : formData.origen;
			const destinoFinalEdit = editDestinoEsOtro ? (editOtroDestino || formData.destino) : formData.destino;
			if ((origenFinalEdit && origenFinalEdit !== selectedReserva.origen) || (destinoFinalEdit && destinoFinalEdit !== selectedReserva.destino)) {
				// Crear destino si es 'otro' y no existe
				if (editDestinoEsOtro && destinoFinalEdit && !destinosCatalog.includes(destinoFinalEdit)) {
					try {
						const ADMIN_TOKEN = localStorage.getItem("adminToken");
						await fetch(`${apiUrl}/api/destinos`, {
							method: "POST",
							headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
							body: JSON.stringify({ nombre: destinoFinalEdit, activo: false, precioIda: 0, precioVuelta: 0, precioIdaVuelta: 0 }),
						});
					} catch {}
				}
				// También registrar origen si es 'otro' y no existe
				if (editOrigenEsOtro && origenFinalEdit && !destinosCatalog.includes(origenFinalEdit)) {
					try {
						const ADMIN_TOKEN = localStorage.getItem("adminToken");
						await fetch(`${apiUrl}/api/destinos`, {
							method: "POST",
							headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
							body: JSON.stringify({ nombre: origenFinalEdit, activo: false, precioIda: 0, precioVuelta: 0, precioIdaVuelta: 0 }),
						});
					} catch {}
				}
				// Actualizar ruta
				const ADMIN_TOKEN = localStorage.getItem("adminToken");
				const rutaResp = await fetch(`${apiUrl}/api/reservas/${selectedReserva.id}/ruta`, {
					method: "PUT",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
					body: JSON.stringify({ origen: origenFinalEdit, destino: destinoFinalEdit }),
				});
				if (!rutaResp.ok) {
					throw new Error("Error al actualizar la ruta");
				}
			}
			// Actualizar estado
            const estadoResponse = await fetch(
                `${apiUrl}/api/reservas/${selectedReserva.id}/estado`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ estado: formData.estado, observaciones: formData.observaciones }),
                }
            );

			if (!estadoResponse.ok) {
				throw new Error("Error al actualizar el estado");
			}

                        const montoPagadoValue =
                                formData.montoPagado !== ""
                                        ? Number.parseFloat(formData.montoPagado)
                                        : null;

                        // Actualizar pago
                        const pagoResponse = await fetch(
                                `${apiUrl}/api/reservas/${selectedReserva.id}/pago`,
                                {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                                estadoPago: formData.estadoPago,
                                                metodoPago: formData.metodoPago,
                                                referenciaPago: formData.referenciaPago,
                                                tipoPago: formData.tipoPago || null,
                                                montoPagado:
                                                        montoPagadoValue !== null &&
                                                        !Number.isNaN(montoPagadoValue)
                                                                ? montoPagadoValue
                                                                : null,
                                        }),
                                }
                        );

			if (!pagoResponse.ok) {
				throw new Error("Error al actualizar el pago");
			}

			// Recargar datos
			await fetchReservas();
			await fetchEstadisticas();
			setShowEditDialog(false);
			setSelectedReserva(null);
		} catch (error) {
			console.error("Error guardando cambios:", error);
			alert("Error al guardar los cambios: " + error.message);
		} finally {
			setSaving(false);
		}
	};

	// Función para obtener el badge del estado
	const getEstadoBadge = (estado) => {
		const estados = {
			pendiente: { variant: "secondary", label: "Pendiente", icon: Clock },
			pendiente_detalles: {
				variant: "outline",
				label: "Pendiente Detalles",
				icon: AlertCircle,
			},
			confirmada: {
				variant: "default",
				label: "Confirmada",
				icon: CheckCircle2,
			},
			cancelada: { variant: "destructive", label: "Cancelada", icon: XCircle },
			completada: {
				variant: "default",
				label: "Completada",
				icon: CheckCircle2,
			},
		};

		const config = estados[estado] || estados.pendiente;
		const Icon = config.icon;

		return (
			<Badge variant={config.variant} className="flex items-center gap-1">
				<Icon className="w-3 h-3" />
				{config.label}
			</Badge>
		);
	};

	// Función para obtener el badge del estado de pago
	const getEstadoPagoBadge = (estadoPago) => {
		const estados = {
			pendiente: { variant: "secondary", label: "Pendiente" },
			pagado: { variant: "default", label: "Pagado" },
			fallido: { variant: "destructive", label: "Fallido" },
			reembolsado: { variant: "outline", label: "Reembolsado" },
		};

		const config = estados[estadoPago] || estados.pendiente;

		return <Badge variant={config.variant}>{config.label}</Badge>;
	};

	// Formatear moneda
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(amount || 0);
	};

	// Formatear fecha
	const formatDate = (date) => {
		if (!date) return "-";
		return new Date(date).toLocaleDateString("es-CL");
	};

	// Buscar clientes para autocompletar
	const buscarClientes = async (query) => {
		if (!query || query.length < 2) {
			setClienteSugerencias([]);
			setMostrandoSugerencias(false);
			return;
		}

		try {
			const response = await fetch(
				`${apiUrl}/api/clientes/buscar?query=${encodeURIComponent(query)}`
			);
			if (response.ok) {
				const data = await response.json();
				setClienteSugerencias(data.clientes || []);
				setMostrandoSugerencias(data.clientes && data.clientes.length > 0);
			}
		} catch (error) {
			console.error("Error buscando clientes:", error);
		}
	};

	// Seleccionar cliente desde autocompletado
	const seleccionarCliente = (cliente) => {
		setClienteSeleccionado(cliente);
		setNewReservaForm({
			...newReservaForm,
			nombre: cliente.nombre,
			rut: cliente.rut || "",
			email: cliente.email,
			telefono: cliente.telefono,
			clienteId: cliente.id,
		});
		setMostrandoSugerencias(false);
		setClienteSugerencias([]);
	};

	// Ver historial de un cliente
	const verHistorialCliente = async (clienteId) => {
		try {
			const response = await fetch(
				`${apiUrl}/api/clientes/${clienteId}/historial`
			);
			if (response.ok) {
				const data = await response.json();
				setHistorialCliente(data);
				setShowHistorialDialog(true);
			}
		} catch (error) {
			console.error("Error obteniendo historial del cliente:", error);
			alert("Error al cargar el historial del cliente");
		}
	};

	// Marcar/desmarcar cliente manualmente
	const toggleClienteManual = async (clienteId, esCliente) => {
		try {
			const response = await fetch(
				`${apiUrl}/api/clientes/${clienteId}/marcar-cliente`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						esCliente: !esCliente,
						marcadoManualmente: true,
					}),
				}
			);

			if (response.ok) {
				await fetchReservas();
				alert(
					`Cliente ${
						!esCliente ? "marcado" : "desmarcado"
					} como cliente exitosamente`
				);
			}
		} catch (error) {
			console.error("Error actualizando cliente:", error);
			alert("Error al actualizar el cliente");
		}
	};

	// Abrir modal de nueva reserva
	const handleNewReserva = () => {
		setClienteSeleccionado(null);
		setClienteSugerencias([]);
		setMostrandoSugerencias(false);
		setNewReservaForm({
			nombre: "",
			rut: "",
			email: "",
			telefono: "",
			clienteId: null,
			origen: "",
			destino: "",
			fecha: "",
			hora: "08:00",
			pasajeros: 1,
			precio: 0,
			vehiculo: "sedan",
			numeroVuelo: "",
			hotel: "",
			equipajeEspecial: "",
			sillaInfantil: false,
			idaVuelta: false,
			fechaRegreso: "",
			horaRegreso: "",
			abonoSugerido: 0,
			saldoPendiente: 0,
			totalConDescuento: 0,
			mensaje: "",
			estado: "confirmada",
			estadoPago: "pendiente",
			metodoPago: "",
			observaciones: "",
		});
		setShowNewDialog(true);
		fetchDestinosCatalog();
	};

	// Guardar nueva reserva
	const handleSaveNewReserva = async () => {
		// Validaciones básicas
		if (
			!newReservaForm.nombre ||
			!newReservaForm.email ||
			!newReservaForm.telefono
		) {
			alert(
				"Por favor completa los campos obligatorios: Nombre, Email y Teléfono"
			);
			return;
		}
		const origenFinal = origenEsOtro ? (otroOrigen || newReservaForm.origen) : newReservaForm.origen;
		const destinoFinal = destinoEsOtro ? (otroDestino || newReservaForm.destino) : newReservaForm.destino;

		if (!origenFinal || !destinoFinal) {
			alert("Por favor completa los campos obligatorios: Origen y Destino");
			return;
		}
		if (!newReservaForm.fecha) {
			alert("Por favor selecciona una fecha");
			return;
		}

		setSaving(true);
		try {
			// Primero, crear o actualizar el cliente
			let clienteId = newReservaForm.clienteId;

			if (!clienteId) {
				const clienteResponse = await fetch(
					`${apiUrl}/api/clientes/crear-o-actualizar`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							rut: newReservaForm.rut || null,
							nombre: newReservaForm.nombre,
							email: newReservaForm.email,
							telefono: newReservaForm.telefono,
						}),
					}
				);

				if (clienteResponse.ok) {
					const clienteData = await clienteResponse.json();
					clienteId = clienteData.cliente.id;
				}
			}

			// Calcular saldo pendiente si no está establecido
			const total =
				parseFloat(newReservaForm.totalConDescuento) ||
				parseFloat(newReservaForm.precio) ||
				0;
			const abono = parseFloat(newReservaForm.abonoSugerido) || 0;
			const saldo = total - abono;

			// Crear destino si es 'otro' y no existe
			if (destinoEsOtro && destinoFinal && !destinosCatalog.includes(destinoFinal)) {
				try {
					const ADMIN_TOKEN = localStorage.getItem("adminToken");
					await fetch(`${apiUrl}/api/destinos`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${ADMIN_TOKEN}`,
						},
						body: JSON.stringify({ nombre: destinoFinal, activo: false, precioIda: 0, precioVuelta: 0, precioIdaVuelta: 0 }),
					});
				} catch (e) {
					console.warn("No se pudo registrar destino nuevo (no crítico)", e.message);
				}
			}

			const reservaData = {
				...newReservaForm,
				clienteId: clienteId,
				origen: origenFinal,
				destino: destinoFinal,
				totalConDescuento: total,
				saldoPendiente: saldo,
				source: "manual",
			};

			const response = await fetch(`${apiUrl}/enviar-reserva`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(reservaData),
			});

			if (!response.ok) {
				throw new Error("Error al crear la reserva");
			}

			// Recargar datos
			await fetchReservas();
			await fetchEstadisticas();
			setShowNewDialog(false);
			alert("Reserva creada exitosamente");
		} catch (error) {
			console.error("Error creando reserva:", error);
			alert("Error al crear la reserva: " + error.message);
		} finally {
			setSaving(false);
		}
	};

	// Seleccionar/deseleccionar todas las reservas
	const toggleSelectAll = () => {
		if (selectedReservas.length === reservasFiltradas.length) {
			setSelectedReservas([]);
		} else {
			setSelectedReservas(reservasFiltradas.map((r) => r.id));
		}
	};

	// Seleccionar/deseleccionar una reserva
	const toggleSelectReserva = (id) => {
		if (selectedReservas.includes(id)) {
			setSelectedReservas(selectedReservas.filter((rid) => rid !== id));
		} else {
			setSelectedReservas([...selectedReservas, id]);
		}
	};

	// Eliminar reservas seleccionadas
	const handleBulkDelete = async () => {
		setProcessingBulk(true);
		try {
			const promises = selectedReservas.map((id) =>
				fetch(`${apiUrl}/api/reservas/${id}`, {
					method: "DELETE",
				})
			);

			await Promise.all(promises);

			await fetchReservas();
			await fetchEstadisticas();
			setSelectedReservas([]);
			setShowBulkDeleteDialog(false);
			alert(`${selectedReservas.length} reserva(s) eliminada(s) exitosamente`);
		} catch (error) {
			console.error("Error eliminando reservas:", error);
			alert("Error al eliminar algunas reservas");
		} finally {
			setProcessingBulk(false);
		}
	};

	// Cambiar estado de reservas seleccionadas
	const handleBulkChangeStatus = async () => {
		if (!bulkEstado) {
			alert("Por favor selecciona un estado");
			return;
		}

		setProcessingBulk(true);
		try {
			const promises = selectedReservas.map((id) =>
				fetch(`${apiUrl}/api/reservas/${id}/estado`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ estado: bulkEstado }),
				})
			);

			await Promise.all(promises);

			await fetchReservas();
			await fetchEstadisticas();
			setSelectedReservas([]);
			setShowBulkStatusDialog(false);
			setBulkEstado("");
			alert(`Estado actualizado para ${selectedReservas.length} reserva(s)`);
		} catch (error) {
			console.error("Error actualizando estado:", error);
			alert("Error al actualizar el estado de algunas reservas");
		} finally {
			setProcessingBulk(false);
		}
	};

	// Cambiar estado de pago de reservas seleccionadas
	const handleBulkChangePayment = async () => {
		if (!bulkEstadoPago) {
			alert("Por favor selecciona un estado de pago");
			return;
		}

		setProcessingBulk(true);
		try {
			const promises = selectedReservas.map((id) =>
				fetch(`${apiUrl}/api/reservas/${id}/pago`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ estadoPago: bulkEstadoPago }),
				})
			);

			await Promise.all(promises);

			await fetchReservas();
			await fetchEstadisticas();
			setSelectedReservas([]);
			setShowBulkPaymentDialog(false);
			setBulkEstadoPago("");
			alert(
				`Estado de pago actualizado para ${selectedReservas.length} reserva(s)`
			);
		} catch (error) {
			console.error("Error actualizando estado de pago:", error);
			alert("Error al actualizar el estado de pago de algunas reservas");
		} finally {
			setProcessingBulk(false);
		}
	};

	if (loading && reservas.length === 0) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
					<p>Cargando reservas...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Encabezado y Estadísticas */}
			<div>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-3xl font-bold">Gestión de Reservas</h2>
					<Button onClick={handleNewReserva} className="gap-2">
						<Plus className="w-4 h-4" />
						Nueva Reserva
					</Button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Total Reservas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<FileText className="w-4 h-4 text-blue-500" />
								<span className="text-2xl font-bold">
									{estadisticas.totalReservas}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Pendientes
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 text-yellow-500" />
								<span className="text-2xl font-bold">
									{estadisticas.reservasPendientes}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Confirmadas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="w-4 h-4 text-green-500" />
								<span className="text-2xl font-bold">
									{estadisticas.reservasConfirmadas}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Pagadas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<DollarSign className="w-4 h-4 text-green-600" />
								<span className="text-2xl font-bold">
									{estadisticas.reservasPagadas}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Ingresos Totales
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<TrendingUp className="w-4 h-4 text-green-600" />
								<span className="text-xl font-bold">
									{formatCurrency(estadisticas.totalIngresos)}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Filtros y Búsqueda */}
			<Card>
				<CardHeader>
					<CardTitle>Filtros de Búsqueda</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						<div className="space-y-2">
							<Label>Buscar</Label>
							<div className="relative">
								<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Nombre, email, teléfono, ID..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-8"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Estado</Label>
							<Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									<SelectItem value="pendiente">Pendiente</SelectItem>
									<SelectItem value="pendiente_detalles">
										Pendiente Detalles
									</SelectItem>
									<SelectItem value="confirmada">Confirmada</SelectItem>
									<SelectItem value="cancelada">Cancelada</SelectItem>
									<SelectItem value="completada">Completada</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Estado de Pago</Label>
							<Select
								value={estadoPagoFiltro}
								onValueChange={setEstadoPagoFiltro}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									<SelectItem value="pendiente">Pendiente</SelectItem>
									<SelectItem value="pagado">Pagado</SelectItem>
									<SelectItem value="fallido">Fallido</SelectItem>
									<SelectItem value="reembolsado">Reembolsado</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Fecha Desde</Label>
							<Input
								type="date"
								value={fechaDesde}
								onChange={(e) => setFechaDesde(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label>Fecha Hasta</Label>
							<Input
								type="date"
								value={fechaHasta}
								onChange={(e) => setFechaHasta(e.target.value)}
							/>
						</div>
					</div>

					<div className="mt-4 flex justify-between items-center">
						<p className="text-sm text-muted-foreground">
							Mostrando {reservasFiltradas.length} de {totalReservas} reservas
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setSearchTerm("");
								setEstadoFiltro("todos");
								setEstadoPagoFiltro("todos");
								setFechaDesde("");
								setFechaHasta("");
								setCurrentPage(1);
							}}
						>
							<RefreshCw className="w-4 h-4 mr-2" />
							Limpiar Filtros
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Tabla de Reservas */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Lista de Reservas</CardTitle>
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline" size="sm">
								<Settings2 className="w-4 h-4 mr-2" />
								Columnas
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Configurar Columnas Visibles</DialogTitle>
								<DialogDescription>
									Selecciona las columnas que deseas ver en la tabla
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-2">
								{Object.entries(columnasVisibles).map(([key, value]) => (
									<div key={key} className="flex items-center space-x-2">
										<input
											type="checkbox"
											id={`col-${key}`}
											checked={value}
											onChange={(e) =>
												setColumnasVisibles({
													...columnasVisibles,
													[key]: e.target.checked,
												})
											}
											className="w-4 h-4"
										/>
										<Label
											htmlFor={`col-${key}`}
											className="cursor-pointer capitalize"
										>
											{key === "id" && "ID"}
											{key === "cliente" && "Cliente"}
											{key === "contacto" && "Contacto"}
											{key === "rut" && "RUT"}
											{key === "ruta" && "Ruta"}
											{key === "fechaHora" && "Fecha/Hora"}
											{key === "pasajeros" && "Pasajeros"}
											{key === "total" && "Total"}
											{key === "estado" && "Estado"}
											{key === "pago" && "Pago"}
											{key === "saldo" && "Saldo"}
											{key === "esCliente" && "Es Cliente"}
											{key === "numViajes" && "Núm. Viajes"}
											{key === "acciones" && "Acciones"}
										</Label>
									</div>
								))}
							</div>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
							<p className="font-medium">Error:</p>
							<p>{error}</p>
						</div>
					)}

					{/* Barra de acciones masivas */}
					{selectedReservas.length > 0 && (
						<div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-md mb-4">
							<div className="flex items-center justify-between flex-wrap gap-2">
								<div className="flex items-center gap-2">
									<CheckSquare className="w-4 h-4 text-blue-600" />
									<span className="font-medium text-blue-900">
										{selectedReservas.length} reserva(s) seleccionada(s)
									</span>
								</div>
								<div className="flex gap-2 flex-wrap">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowBulkStatusDialog(true)}
									>
										Cambiar Estado
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowBulkPaymentDialog(true)}
									>
										Cambiar Estado Pago
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => setShowBulkDeleteDialog(true)}
									>
										<Trash2 className="w-4 h-4 mr-1" />
										Eliminar
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelectedReservas([])}
									>
										Cancelar
									</Button>
								</div>
							</div>
						</div>
					)}

					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12">
										<input
											type="checkbox"
											checked={
												reservasFiltradas.length > 0 &&
												selectedReservas.length === reservasFiltradas.length
											}
											onChange={toggleSelectAll}
											className="w-4 h-4 cursor-pointer"
										/>
									</TableHead>
									{columnasVisibles.id && <TableHead>ID</TableHead>}
									{columnasVisibles.cliente && <TableHead>Cliente</TableHead>}
									{columnasVisibles.contacto && <TableHead>Contacto</TableHead>}
									{columnasVisibles.rut && <TableHead>RUT</TableHead>}
									{columnasVisibles.esCliente && <TableHead>Tipo</TableHead>}
									{columnasVisibles.numViajes && <TableHead>Viajes</TableHead>}
									{columnasVisibles.ruta && <TableHead>Ruta</TableHead>}
									{columnasVisibles.fechaHora && (
										<TableHead>Fecha/Hora</TableHead>
									)}
									{columnasVisibles.pasajeros && (
										<TableHead>Pasajeros</TableHead>
									)}
									{columnasVisibles.total && <TableHead>Total</TableHead>}
									{columnasVisibles.estado && <TableHead>Estado</TableHead>}
									{columnasVisibles.pago && <TableHead>Pago</TableHead>}
									{columnasVisibles.saldo && <TableHead>Saldo</TableHead>}
									{columnasVisibles.acciones && <TableHead>Acciones</TableHead>}
								</TableRow>
							</TableHeader>
							<TableBody>
								{reservasFiltradas.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={
												Object.values(columnasVisibles).filter(Boolean).length +
												1
											}
											className="text-center py-8"
										>
											<div className="text-muted-foreground">
												<FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
												<p>No se encontraron reservas</p>
											</div>
										</TableCell>
									</TableRow>
								) : (
									reservasFiltradas.map((reserva) => (
										<TableRow key={reserva.id}>
											<TableCell className="w-12">
												<input
													type="checkbox"
													checked={selectedReservas.includes(reserva.id)}
													onChange={() => toggleSelectReserva(reserva.id)}
													className="w-4 h-4 cursor-pointer"
												/>
											</TableCell>
											{columnasVisibles.id && (
												<TableCell className="font-medium">
													<div className="space-y-1">
														<div>#{reserva.id}</div>
														{reserva.codigoReserva && (
															<div className="text-xs text-blue-600 font-mono">
																{reserva.codigoReserva}
															</div>
														)}
													</div>
												</TableCell>
											)}
											{columnasVisibles.cliente && (
												<TableCell>
													<div className="flex items-center gap-2">
														<User className="w-4 h-4 text-muted-foreground" />
														<span className="font-medium">
															{reserva.nombre}
														</span>
													</div>
												</TableCell>
											)}
											{columnasVisibles.contacto && (
												<TableCell>
													<div className="space-y-1 text-sm">
														<div className="flex items-center gap-1">
															<Mail className="w-3 h-3 text-muted-foreground" />
															<span className="truncate max-w-[150px]">
																{reserva.email}
															</span>
														</div>
														<div className="flex items-center gap-1">
															<Phone className="w-3 h-3 text-muted-foreground" />
															<span>{reserva.telefono}</span>
														</div>
													</div>
												</TableCell>
											)}
											{columnasVisibles.rut && (
												<TableCell>
													<span className="text-sm">{reserva.rut || "-"}</span>
												</TableCell>
											)}
											{columnasVisibles.esCliente && (
												<TableCell>
                                                                                                {reserva.clienteId ? (
                                                                                                        <Badge
                                                                                                                variant={
                                                                                                                        reserva.esCliente ? "default" : "secondary"
                                                                                                                }
                                                                                                                className="cursor-pointer"
                                                                                                                onClick={() =>
                                                                                                                        toggleClienteManual(
                                                                                                                                reserva.clienteId,
                                                                                                                                reserva.esCliente
                                                                                                                        )
                                                                                                                }
                                                                                                        >
                                                                                                                {reserva.esCliente ? (
                                                                                                                        <>
                                                                                                                                <Star className="w-3 h-3 mr-1" />
                                                                                                                                Cliente
                                                                                                                        </>
                                                                                                                ) : (
                                                                                                                        "Cotizador"
                                                                                                                )}
                                                                                                        </Badge>
                                                                                                ) : (
                                                                                                        <span className="text-xs text-muted-foreground">
                                                                                                                -
                                                                                                        </span>
                                                                                                )}
                                                                                                {reserva.clasificacionCliente && (
                                                                                                        <div className="mt-1">
                                                                                                                <Badge variant="outline">
                                                                                                                        {reserva.clasificacionCliente}
                                                                                                                </Badge>
                                                                                                        </div>
                                                                                                )}
                                                                                        </TableCell>
                                                                                )}
											{columnasVisibles.numViajes && (
												<TableCell>
													{reserva.clienteId ? (
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																verHistorialCliente(reserva.clienteId)
															}
														>
															<History className="w-3 h-3 mr-1" />
															{reserva.totalReservas || "Ver"}
														</Button>
													) : (
														<span className="text-xs text-muted-foreground">
															-
														</span>
													)}
												</TableCell>
											)}
											{columnasVisibles.ruta && (
												<TableCell>
													<div className="space-y-1 text-sm">
														<div className="flex items-center gap-1">
															<MapPin className="w-3 h-3 text-green-500" />
															<span className="font-medium">
																{reserva.origen}
															</span>
														</div>
														<div className="flex items-center gap-1">
															<MapPin className="w-3 h-3 text-red-500" />
															<span className="font-medium">
																{reserva.destino}
															</span>
														</div>
													</div>
												</TableCell>
											)}
											{columnasVisibles.fechaHora && (
												<TableCell>
													<div className="space-y-1 text-sm">
														<div className="flex items-center gap-1">
															<Calendar className="w-3 h-3 text-muted-foreground" />
															<span>{formatDate(reserva.fecha)}</span>
														</div>
														<div className="flex items-center gap-1">
															<Clock className="w-3 h-3 text-muted-foreground" />
															<span>{reserva.hora || "-"}</span>
														</div>
													</div>
												</TableCell>
											)}
											{columnasVisibles.pasajeros && (
												<TableCell>
													<div className="flex items-center gap-1">
														<Users className="w-4 h-4 text-muted-foreground" />
														<span className="font-medium">
															{reserva.pasajeros}
														</span>
													</div>
												</TableCell>
											)}
											{columnasVisibles.total && (
												<TableCell className="font-semibold">
													{formatCurrency(reserva.totalConDescuento)}
												</TableCell>
											)}
											{columnasVisibles.estado && (
												<TableCell>{getEstadoBadge(reserva.estado)}</TableCell>
											)}
											{columnasVisibles.pago && (
												<TableCell>
													{getEstadoPagoBadge(reserva.estadoPago)}
												</TableCell>
											)}
											{columnasVisibles.saldo && (
												<TableCell>
													<span
														className={
															reserva.saldoPendiente > 0
																? "text-red-600 font-semibold"
																: "text-green-600 font-semibold"
														}
													>
														{formatCurrency(reserva.saldoPendiente)}
													</span>
												</TableCell>
											)}
											{columnasVisibles.acciones && (
												<TableCell>
													<div className="flex gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleViewDetails(reserva)}
														>
															<Eye className="w-4 h-4" />
														</Button>
														<Button
															variant="default"
															size="sm"
															onClick={() => handleEdit(reserva)}
														>
															<Edit className="w-4 h-4" />
														</Button>
														{/* Solo mostrar botón de asignar si está pagado */}
														{reserva.estadoPago === "pagado" && !reserva.vehiculo && (
															<Button
																variant="secondary"
																size="sm"
																onClick={() => handleAsignar(reserva)}
																title="Asignar vehículo y conductor"
															>
																🚗
															</Button>
														)}
													</div>
												</TableCell>
											)}
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Paginación */}
					<div className="flex items-center justify-between mt-4">
						<p className="text-sm text-muted-foreground">
							Página {currentPage} de {totalPages}
						</p>
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
								onClick={() =>
									setCurrentPage((p) => Math.min(totalPages, p + 1))
								}
								disabled={currentPage === totalPages}
							>
								Siguiente
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Modal de Detalles */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							Detalles de Reserva #{selectedReserva?.id}
						</DialogTitle>
						<DialogDescription>
							Información completa de la reserva
						</DialogDescription>
					</DialogHeader>

					{selectedReserva && (
						<div className="space-y-6">
							{/* Código de Reserva */}
							{selectedReserva.codigoReserva && (
								<div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<div>
											<Label className="text-blue-700 text-sm font-medium">
												Código de Reserva
											</Label>
											<p className="text-2xl font-bold text-blue-900 tracking-wider">
												{selectedReserva.codigoReserva}
											</p>
										</div>
										<div className="bg-blue-100 p-2 rounded">
											<svg
												className="w-6 h-6 text-blue-700"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</div>
									</div>
								</div>
							)}

							{/* Información del Cliente */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información del Cliente
								</h3>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                                <Label className="text-muted-foreground">Nombre</Label>
                                                                                <p className="font-medium">{selectedReserva.nombre}</p>
                                                                        </div>
                                                                        <div>
                                                                                <Label className="text-muted-foreground">Email</Label>
                                                                                <p className="font-medium">{selectedReserva.email}</p>
                                                                        </div>
                                                                        <div>
                                                                                <Label className="text-muted-foreground">Teléfono</Label>
                                                                                <p className="font-medium">{selectedReserva.telefono}</p>
                                                                        </div>
                                                                        {(selectedReserva.cliente?.clasificacion ||
                                                                                selectedReserva.clasificacionCliente) && (
                                                                                <div>
                                                                                        <Label className="text-muted-foreground">
                                                                                                Clasificación
                                                                                        </Label>
                                                                                        <div className="mt-1">
                                                                                                <Badge variant="outline">
                                                                                                        {selectedReserva.cliente?.clasificacion ||
                                                                                                                selectedReserva.clasificacionCliente}
                                                                                                </Badge>
                                                                                        </div>
                                                                                </div>
                                                                        )}
                                                                </div>
                                                        </div>

							{/* Detalles del Viaje */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Detalles del Viaje
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Origen</Label>
										<p className="font-medium">{selectedReserva.origen}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Destino</Label>
										<p className="font-medium">{selectedReserva.destino}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Fecha</Label>
										<p className="font-medium">
											{formatDate(selectedReserva.fecha)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Hora</Label>
										<p className="font-medium">{selectedReserva.hora || "-"}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Pasajeros</Label>
										<p className="font-medium">{selectedReserva.pasajeros}</p>
									</div>
										<div>
											<div className="flex items-center justify-between">
												<Label className="text-muted-foreground">Vehículo</Label>
												{selectedReserva.estadoPago === "pagado" && (
													<Button
														variant="outline"
														size="xs"
														onClick={() => handleAsignar(selectedReserva)}
													>
														Reasignar
													</Button>
												)}
											</div>
											<p className="font-medium">
												{selectedReserva.vehiculo || "-"}
											</p>
										</div>
									{selectedReserva.idaVuelta && (
										<>
											<div>
												<Label className="text-muted-foreground">
													Fecha Regreso
												</Label>
												<p className="font-medium">
													{formatDate(selectedReserva.fechaRegreso)}
												</p>
											</div>
											<div>
												<Label className="text-muted-foreground">
													Hora Regreso
												</Label>
												<p className="font-medium">
													{selectedReserva.horaRegreso || "-"}
												</p>
											</div>
										</>
									)}
								</div>
							</div>

							{/* Historial de Asignaciones (interno) */}
							<div>
								<h3 className="font-semibold text-lg mb-3">Historial de Asignaciones</h3>
								{loadingHistorial ? (
									<p className="text-sm text-muted-foreground">Cargando historial...</p>
								) : historialAsignaciones.length === 0 ? (
									<p className="text-sm text-muted-foreground">Sin cambios de asignación</p>
								) : (
									<div className="space-y-2">
										{historialAsignaciones.map((h) => (
											<div key={h.id} className="p-2 border rounded-md text-sm">
												<div className="flex justify-between">
													<span>
														Vehículo: <strong>{h.vehiculo || "-"}</strong>
														{h.conductor && (
															<>
																{" "}• Conductor: <strong>{h.conductor}</strong>
															</>
														)}
													</span>
													<span className="text-muted-foreground">
														{new Date(h.created_at).toLocaleString("es-CL")}
													</span>
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Información Adicional */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información Adicional
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">
											Número de Vuelo
										</Label>
										<p className="font-medium">
											{selectedReserva.numeroVuelo || "-"}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Hotel</Label>
										<p className="font-medium">
											{selectedReserva.hotel || "-"}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Equipaje Especial
										</Label>
										<p className="font-medium">
											{selectedReserva.equipajeEspecial || "-"}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Silla Infantil
										</Label>
										<p className="font-medium">
											{selectedReserva.sillaInfantil ? "Sí" : "No"}
										</p>
									</div>
								</div>
							</div>

							{/* Información Financiera */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información Financiera
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Precio Base</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.precio)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Descuento Base
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.descuentoBase)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Descuento Promoción
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.descuentoPromocion)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Descuento Round Trip
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.descuentoRoundTrip)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Descuento Online
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.descuentoOnline)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Total con Descuento
										</Label>
										<p className="font-bold text-lg">
											{formatCurrency(selectedReserva.totalConDescuento)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Abono Sugerido
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.abonoSugerido)}
										</p>
									</div>
                                                                        <div>
                                                                                <Label className="text-muted-foreground">
                                                                                        Saldo Pendiente
                                                                                </Label>
                                                                                <p
                                                                                        className={`font-bold ${
                                                                                                selectedReserva.saldoPendiente > 0
                                                                                                        ? "text-red-600"
                                                                                                        : "text-green-600"
                                                                                        }`}
                                                                                >
                                                                                        {formatCurrency(selectedReserva.saldoPendiente)}
                                                                                </p>
                                                                        </div>
                                                                        <div>
                                                                                <Label className="text-muted-foreground">
                                                                                        Estado del Abono
                                                                                </Label>
                                                                                <div className="mt-1">
                                                                                        <Badge
                                                                                                variant={
                                                                                                        selectedReserva.abonoPagado
                                                                                                                ? "default"
                                                                                                                : "secondary"
                                                                                                }
                                                                                        >
                                                                                                {selectedReserva.abonoPagado
                                                                                                        ? "Abono pagado"
                                                                                                        : "Pendiente"}
                                                                                        </Badge>
                                                                                </div>
                                                                        </div>
                                                                        <div>
                                                                                <Label className="text-muted-foreground">
                                                                                        Estado del Saldo
                                                                                </Label>
                                                                                <div className="mt-1">
                                                                                        <Badge
                                                                                                variant={
                                                                                                        selectedReserva.saldoPagado
                                                                                                                ? "default"
                                                                                                                : "secondary"
                                                                                                }
                                                                                        >
                                                                                                {selectedReserva.saldoPagado
                                                                                                        ? "Saldo pagado"
                                                                                                        : "Pendiente"}
                                                                                        </Badge>
                                                                                </div>
                                                                        </div>
                                                                        <div>
                                                                                <Label className="text-muted-foreground">
                                                                                        Código de Descuento
                                                                                </Label>
                                                                                <p className="font-medium">
											{selectedReserva.codigoDescuento || "-"}
										</p>
									</div>
								</div>
							</div>

							{/* Estado y Pago */}
							<div>
								<h3 className="font-semibold text-lg mb-3">Estado y Pago</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Estado</Label>
										<div className="mt-1">
											{getEstadoBadge(selectedReserva.estado)}
										</div>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Estado de Pago
										</Label>
										<div className="mt-1">
											{getEstadoPagoBadge(selectedReserva.estadoPago)}
										</div>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Método de Pago
										</Label>
										<p className="font-medium">
											{selectedReserva.metodoPago || "-"}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Referencia de Pago
										</Label>
										<p className="font-medium">
											{selectedReserva.referenciaPago || "-"}
										</p>
									</div>
								</div>
							</div>

							{/* Observaciones y Mensaje */}
							{(selectedReserva.observaciones || selectedReserva.mensaje) && (
								<div>
									<h3 className="font-semibold text-lg mb-3">
										Notas y Comentarios
									</h3>
									{selectedReserva.mensaje && (
										<div className="mb-3">
											<Label className="text-muted-foreground">
												Mensaje del Cliente
											</Label>
											<p className="mt-1 p-3 bg-muted rounded-md">
												{selectedReserva.mensaje}
											</p>
										</div>
									)}
									{selectedReserva.observaciones && (
										<div>
											<Label className="text-muted-foreground">
												Observaciones Internas
											</Label>
											<p className="mt-1 p-3 bg-muted rounded-md">
												{selectedReserva.observaciones}
											</p>
										</div>
									)}
								</div>
							)}

							{/* Información Técnica */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información Técnica
								</h3>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<Label className="text-muted-foreground">Origen</Label>
										<p>{selectedReserva.source || "web"}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">IP</Label>
										<p>{selectedReserva.ipAddress || "-"}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Fecha de Creación
										</Label>
										<p>{formatDate(selectedReserva.created_at)}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Última Actualización
										</Label>
										<p>{formatDate(selectedReserva.updated_at)}</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Modal de Edición */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Editar Reserva #{selectedReserva?.id}</DialogTitle>
						<DialogDescription>
							Actualiza el estado, pago y detalles de la reserva
						</DialogDescription>
					</DialogHeader>

					{selectedReserva && (
						<div className="space-y-4">
						{/* Información del Cliente (editable) */}
						<div className="bg-muted p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1">
								<Label>Nombre</Label>
								<Input value={formData.nombre || ""} onChange={(e)=>setFormData({...formData, nombre:e.target.value})} />
							</div>
							<div className="space-y-1">
								<Label>Email</Label>
								<Input type="email" value={formData.email || ""} onChange={(e)=>setFormData({...formData, email:e.target.value})} />
							</div>
							<div className="space-y-1">
								<Label>Teléfono</Label>
								<Input value={formData.telefono || ""} onChange={(e)=>setFormData({...formData, telefono:e.target.value})} />
							</div>
							<div className="space-y-1">
								<Label>Fecha</Label>
								<Input type="date" value={formData.fecha || ""} onChange={(e)=>setFormData({...formData, fecha:e.target.value})} />
							</div>
							<div className="space-y-1">
								<Label>Hora</Label>
								<Input type="time" value={formData.hora || ""} onChange={(e)=>setFormData({...formData, hora:e.target.value})} />
							</div>
							<div className="space-y-1">
								<Label>Pasajeros</Label>
								<Input type="number" min="1" value={formData.pasajeros || ""} onChange={(e)=>setFormData({...formData, pasajeros:e.target.value})} />
							</div>
						</div>

							{/* Estado */}
							<div className="space-y-2">
								<Label htmlFor="estado">Estado de la Reserva</Label>
								<Select
									value={formData.estado}
									onValueChange={(value) =>
										setFormData({ ...formData, estado: value })
									}
								>
									<SelectTrigger id="estado">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pendiente">Pendiente</SelectItem>
										<SelectItem value="pendiente_detalles">
											Pendiente Detalles
										</SelectItem>
										<SelectItem value="confirmada">Confirmada</SelectItem>
										<SelectItem value="cancelada">Cancelada</SelectItem>
										<SelectItem value="completada">Completada</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Estado de Pago */}
							<div className="space-y-2">
								<Label htmlFor="estadoPago">Estado de Pago</Label>
								<Select
									value={formData.estadoPago}
									onValueChange={(value) =>
										setFormData({ ...formData, estadoPago: value })
									}
								>
									<SelectTrigger id="estadoPago">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pendiente">Pendiente</SelectItem>
										<SelectItem value="pagado">Pagado</SelectItem>
										<SelectItem value="fallido">Fallido</SelectItem>
										<SelectItem value="reembolsado">Reembolsado</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Método de Pago */}
							<div className="space-y-2">
								<Label htmlFor="metodoPago">Método de Pago</Label>
								<Select
									value={formData.metodoPago}
									onValueChange={(value) =>
										setFormData({ ...formData, metodoPago: value })
									}
								>
									<SelectTrigger id="metodoPago">
										<SelectValue placeholder="Seleccionar método" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="flow">Flow</SelectItem>
										<SelectItem value="transferencia">Transferencia</SelectItem>
										<SelectItem value="efectivo">Efectivo</SelectItem>
										<SelectItem value="otro">Otro</SelectItem>
									</SelectContent>
								</Select>
							</div>

                                                        {/* Referencia de Pago */}
                                                        <div className="space-y-2">
                                                                <Label htmlFor="referenciaPago">
                                                                        Referencia de Pago (opcional)
                                                                </Label>
                                                                <Input
                                                                        id="referenciaPago"
                                                                        placeholder="ID de transacción, número de transferencia, etc."
                                                                        value={formData.referenciaPago}
                                                                        onChange={(e) =>
                                                                                setFormData({ ...formData, referenciaPago: e.target.value })
                                                                        }
                                                                />
                                                        </div>

                                                        {/* Tipo de pago registrado */}
                                                        <div className="space-y-2">
                                                                <Label htmlFor="tipoPago">Tipo de Pago Registrado</Label>
                                                                <Select
                                                                        value={formData.tipoPago}
                                                                        onValueChange={(value) =>
                                                                                setFormData({ ...formData, tipoPago: value })
                                                                        }
                                                                >
                                                                        <SelectTrigger id="tipoPago">
                                                                                <SelectValue placeholder="Selecciona el tipo de pago" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                                <SelectItem value="abono">Abono</SelectItem>
                                                                                <SelectItem value="saldo">Saldo</SelectItem>
                                                                                <SelectItem value="total">Pago total</SelectItem>
                                                                        </SelectContent>
                                                                </Select>
                                                        </div>

                                                        {/* Monto del pago */}
                                                        <div className="space-y-2">
                                                                <Label htmlFor="montoPagado">Monto Registrado (CLP)</Label>
                                                                <Input
                                                                        id="montoPagado"
                                                                        type="number"
                                                                        min="0"
                                                                        step="1000"
                                                                        placeholder="Ej: 40000"
                                                                        value={formData.montoPagado}
                                                                        onChange={(e) =>
                                                                                setFormData({ ...formData, montoPagado: e.target.value })
                                                                        }
                                                                />
                                                        </div>

                                                        {/* Observaciones */}
                                                        <div className="space-y-2">
                                                                <Label htmlFor="observaciones">Observaciones Internas</Label>
								<Textarea
									id="observaciones"
									placeholder="Notas internas sobre la reserva..."
									value={formData.observaciones}
									onChange={(e) =>
										setFormData({ ...formData, observaciones: e.target.value })
									}
									rows={4}
								/>
							</div>

							{/* Resumen Financiero */}
							<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
								<h4 className="font-semibold mb-2 text-blue-900">
									Resumen Financiero
								</h4>
                                                                <div className="space-y-1 text-sm">
                                                                        <div className="flex justify-between">
                                                                                <span>Total:</span>
                                                                                <span className="font-semibold">
                                                                                        {formatCurrency(selectedReserva.totalConDescuento)}
                                                                                </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                                <span>Abono Sugerido:</span>
                                                                                <span className="font-semibold">
                                                                                        {formatCurrency(selectedReserva.abonoSugerido)}
                                                                                </span>
                                                                        </div>
                                                                        <div className="flex justify-between border-t border-blue-300 pt-1">
                                                                                <span className="font-semibold">Saldo Pendiente:</span>
                                                                                <span
                                                                                        className={`font-bold ${
                                                                                                selectedReserva.saldoPendiente > 0
                                                                                                        ? "text-red-600"
                                                                                                        : "text-green-600"
                                                                                        }`}
                                                                                >
                                                                                        {formatCurrency(selectedReserva.saldoPendiente)}
                                                                                </span>
                                                                        </div>
                                                                        <div className="flex justify-between pt-1">
                                                                                <span>Estado del Abono:</span>
                                                                                <Badge
                                                                                        variant={
                                                                                                selectedReserva.abonoPagado
                                                                                                        ? "default"
                                                                                                        : "secondary"
                                                                                        }
                                                                                >
                                                                                        {selectedReserva.abonoPagado
                                                                                                ? "Abono pagado"
                                                                                                : "Pendiente"}
                                                                                </Badge>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                                <span>Estado del Saldo:</span>
                                                                                <Badge
                                                                                        variant={
                                                                                                selectedReserva.saldoPagado
                                                                                                        ? "default"
                                                                                                        : "secondary"
                                                                                        }
                                                                                >
                                                                                        {selectedReserva.saldoPagado
                                                                                                ? "Saldo pagado"
                                                                                                : "Pendiente"}
                                                                                </Badge>
                                                                        </div>
                                                                </div>
                                                        </div>

							{/* Botones */}
							<div className="flex justify-end gap-2 pt-4">
								<Button
									variant="outline"
									onClick={() => setShowEditDialog(false)}
									disabled={saving}
								>
									Cancelar
								</Button>
								<Button onClick={handleSave} disabled={saving}>
									{saving ? (
										<>
											<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
											Guardando...
										</>
									) : (
										"Guardar Cambios"
									)}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Modal de Nueva Reserva */}
			<Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Nueva Reserva Manual</DialogTitle>
						<DialogDescription>
							Crea una nueva reserva ingresando manualmente los datos del
							cliente y del viaje
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6">
						{/* Información del Cliente */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Información del Cliente
							</h3>

							{/* Indicador de cliente existente */}
							{clienteSeleccionado && (
								<div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
									<p className="font-medium">
										✓ Cliente existente seleccionado
									</p>
                                                                        <p className="text-sm">
                                                                                {clienteSeleccionado.esCliente && (
                                                                                        <Badge variant="default" className="mr-2">
                                                                                                Cliente
                                                                                        </Badge>
                                                                                )}
                                                                                {clienteSeleccionado.clasificacion && (
                                                                                        <Badge variant="outline" className="mr-2">
                                                                                                {clienteSeleccionado.clasificacion}
                                                                                        </Badge>
                                                                                )}
                                                                                {clienteSeleccionado.totalReservas > 0 && (
                                                                                        <span className="text-xs">
                                                                                                {clienteSeleccionado.totalReservas} reserva(s) previa(s)
                                                                                        </span>
                                                                                )}
									</p>
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2 relative">
									<Label htmlFor="new-nombre">
										Nombre Completo <span className="text-red-500">*</span>
									</Label>
									<Input
										id="new-nombre"
										placeholder="Juan Pérez (escribe para buscar)"
										value={newReservaForm.nombre}
										onChange={(e) => {
											setNewReservaForm({
												...newReservaForm,
												nombre: e.target.value,
											});
											buscarClientes(e.target.value);
										}}
										onBlur={() =>
											setTimeout(() => setMostrandoSugerencias(false), 200)
										}
										onFocus={() => {
											if (
												newReservaForm.nombre.trim().length > 0 &&
												clienteSugerencias.length > 0
											) {
												setMostrandoSugerencias(true);
											}
										}}
									/>
									{/* Sugerencias de autocompletado */}
									{mostrandoSugerencias && clienteSugerencias.length > 0 && (
										<div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
											{clienteSugerencias.map((cliente) => (
												<div
													key={cliente.id}
													className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
													onClick={() => seleccionarCliente(cliente)}
												>
													<div className="font-medium">{cliente.nombre}</div>
													<div className="text-sm text-gray-600">
														{cliente.email} • {cliente.telefono}
														{cliente.rut && ` • RUT: ${cliente.rut}`}
													</div>
													{cliente.esCliente && (
														<Badge variant="default" className="text-xs mt-1">
															Cliente • {cliente.totalReservas} reservas
														</Badge>
													)}
												</div>
											))}
										</div>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-rut">RUT (opcional)</Label>
									<Input
										id="new-rut"
										placeholder="12345678-9"
										value={newReservaForm.rut}
										onChange={(e) => {
											setNewReservaForm({
												...newReservaForm,
												rut: e.target.value,
											});
											buscarClientes(e.target.value);
										}}
										onBlur={() =>
											setTimeout(() => setMostrandoSugerencias(false), 200)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-email">
										Email <span className="text-red-500">*</span>
									</Label>
									<Input
										id="new-email"
										type="email"
										placeholder="juan@example.com"
										value={newReservaForm.email}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												email: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-telefono">
										Teléfono <span className="text-red-500">*</span>
									</Label>
									<Input
										id="new-telefono"
										placeholder="+56912345678"
										value={newReservaForm.telefono}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												telefono: e.target.value,
											})
										}
									/>
								</div>
							</div>
						</div>

						{/* Detalles del Viaje */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Detalles del Viaje
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                        <Label htmlFor="new-origen">
                                                Origen <span className="text-red-500">*</span>
                                        </Label>
                                        {!origenEsOtro ? (
                                                <select
                                                        id="new-origen"
                                                        className="border rounded-md h-10 px-3 w-full"
                                                        value={newReservaForm.origen}
                                                        onChange={(e) => setNewReservaForm({ ...newReservaForm, origen: e.target.value })}
                                                >
                                                        <option value="">Seleccionar origen</option>
                                                        <option value="Aeropuerto La Araucanía">Aeropuerto La Araucanía</option>
                                                        {destinosCatalog.map((n) => (
                                                                <option key={n} value={n}>{n}</option>
                                                        ))}
                                                </select>
                                        ) : (
                                                <Input
                                                        id="new-origen-otro"
                                                        placeholder="Especificar origen"
                                                        value={otroOrigen}
                                                        onChange={(e) => setOtroOrigen(e.target.value)}
                                                />
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={origenEsOtro} onChange={(e) => setOrigenEsOtro(e.target.checked)} />
                                                        Origen no está en la lista
                                                </label>
                                        </div>
                                </div>
                                <div className="space-y-2">
                                        <Label htmlFor="new-destino">
                                                Destino <span className="text-red-500">*</span>
                                        </Label>
                                        {!destinoEsOtro ? (
                                                <select
                                                        id="new-destino"
                                                        className="border rounded-md h-10 px-3 w-full"
                                                        value={newReservaForm.destino}
                                                        onChange={(e) => setNewReservaForm({ ...newReservaForm, destino: e.target.value })}
                                                >
                                                        <option value="">Seleccionar destino</option>
                                                        {destinosCatalog.map((n) => (
                                                                <option key={n} value={n}>{n}</option>
                                                        ))}
                                                </select>
                                        ) : (
                                                <Input
                                                        id="new-destino-otro"
                                                        placeholder="Especificar destino"
                                                        value={otroDestino}
                                                        onChange={(e) => setOtroDestino(e.target.value)}
                                                />
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={destinoEsOtro} onChange={(e) => setDestinoEsOtro(e.target.checked)} />
                                                        Destino no está en la lista (se agregará a la base de datos como inactivo)
                                                </label>
                                        </div>
                                </div>
								<div className="space-y-2">
									<Label htmlFor="new-fecha">
										Fecha <span className="text-red-500">*</span>
									</Label>
									<Input
										id="new-fecha"
										type="date"
										value={newReservaForm.fecha}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												fecha: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-hora">Hora</Label>
									<Input
										id="new-hora"
										type="time"
										value={newReservaForm.hora}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												hora: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-pasajeros">Pasajeros</Label>
									<Input
										id="new-pasajeros"
										type="number"
										min="1"
										value={newReservaForm.pasajeros}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												pasajeros: parseInt(e.target.value) || 1,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-vehiculo">Vehículo</Label>
									<Select
										value={newReservaForm.vehiculo}
										onValueChange={(value) =>
											setNewReservaForm({ ...newReservaForm, vehiculo: value })
										}
									>
										<SelectTrigger id="new-vehiculo">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="sedan">Sedan</SelectItem>
											<SelectItem value="van">Van</SelectItem>
											<SelectItem value="minibus">Minibus</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Ida y Vuelta */}
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="new-idavuelta"
									checked={newReservaForm.idaVuelta}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											idaVuelta: e.target.checked,
										})
									}
									className="w-4 h-4"
								/>
								<Label htmlFor="new-idavuelta">Incluir viaje de regreso</Label>
							</div>

							{newReservaForm.idaVuelta && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
									<div className="space-y-2">
										<Label htmlFor="new-fecharegreso">Fecha Regreso</Label>
										<Input
											id="new-fecharegreso"
											type="date"
											value={newReservaForm.fechaRegreso}
											onChange={(e) =>
												setNewReservaForm({
													...newReservaForm,
													fechaRegreso: e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="new-horaregreso">Hora Regreso</Label>
										<Input
											id="new-horaregreso"
											type="time"
											value={newReservaForm.horaRegreso}
											onChange={(e) =>
												setNewReservaForm({
													...newReservaForm,
													horaRegreso: e.target.value,
												})
											}
										/>
									</div>
								</div>
							)}
						</div>

						{/* Información Adicional */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Información Adicional (Opcional)
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="new-vuelo">Número de Vuelo</Label>
									<Input
										id="new-vuelo"
										placeholder="LA123"
										value={newReservaForm.numeroVuelo}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												numeroVuelo: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-hotel">Hotel</Label>
									<Input
										id="new-hotel"
										placeholder="Hotel Gran Pucón"
										value={newReservaForm.hotel}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												hotel: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="new-equipaje">Equipaje Especial</Label>
									<Input
										id="new-equipaje"
										placeholder="Esquíes, bicicletas, etc."
										value={newReservaForm.equipajeEspecial}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												equipajeEspecial: e.target.value,
											})
										}
									/>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="new-silla"
										checked={newReservaForm.sillaInfantil}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												sillaInfantil: e.target.checked,
											})
										}
										className="w-4 h-4"
									/>
									<Label htmlFor="new-silla">Requiere silla infantil</Label>
								</div>
							</div>
						</div>

						{/* Información Financiera */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Información Financiera
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="new-precio">Precio Total (CLP)</Label>
									<Input
										id="new-precio"
										type="number"
										min="0"
										placeholder="50000"
										value={newReservaForm.precio}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												precio: parseFloat(e.target.value) || 0,
												totalConDescuento: parseFloat(e.target.value) || 0,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-abono">Abono Sugerido (CLP)</Label>
									<Input
										id="new-abono"
										type="number"
										min="0"
										placeholder="25000"
										value={newReservaForm.abonoSugerido}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												abonoSugerido: parseFloat(e.target.value) || 0,
											})
										}
									/>
								</div>
							</div>
							<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
								<p className="text-sm">
									<strong>Saldo Pendiente:</strong>{" "}
									{formatCurrency(
										(parseFloat(newReservaForm.precio) || 0) -
											(parseFloat(newReservaForm.abonoSugerido) || 0)
									)}
								</p>
							</div>
						</div>

						{/* Estado y Pago */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Estado y Pago
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="new-estado">Estado de la Reserva</Label>
									<Select
										value={newReservaForm.estado}
										onValueChange={(value) =>
											setNewReservaForm({ ...newReservaForm, estado: value })
										}
									>
										<SelectTrigger id="new-estado">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="pendiente">Pendiente</SelectItem>
											<SelectItem value="confirmada">Confirmada</SelectItem>
											<SelectItem value="completada">Completada</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-estadopago">Estado de Pago</Label>
									<Select
										value={newReservaForm.estadoPago}
										onValueChange={(value) =>
											setNewReservaForm({
												...newReservaForm,
												estadoPago: value,
											})
										}
									>
										<SelectTrigger id="new-estadopago">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="pendiente">Pendiente</SelectItem>
											<SelectItem value="pagado">Pagado</SelectItem>
										</SelectContent>
									</Select>
								</div>
								{newReservaForm.estadoPago === "pagado" && (
									<div className="space-y-2">
										<Label htmlFor="new-metodopago">Método de Pago</Label>
										<Select
											value={newReservaForm.metodoPago}
											onValueChange={(value) =>
												setNewReservaForm({
													...newReservaForm,
													metodoPago: value,
												})
											}
										>
											<SelectTrigger id="new-metodopago">
												<SelectValue placeholder="Seleccionar método" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="efectivo">Efectivo</SelectItem>
												<SelectItem value="transferencia">
													Transferencia
												</SelectItem>
												<SelectItem value="flow">Flow</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</div>
						</div>

						{/* Observaciones */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Observaciones Internas
							</h3>
							<Textarea
								placeholder="Notas adicionales sobre esta reserva..."
								value={newReservaForm.observaciones}
								onChange={(e) =>
									setNewReservaForm({
										...newReservaForm,
										observaciones: e.target.value,
									})
								}
								rows={3}
							/>
						</div>

						{/* Botones */}
						<div className="flex justify-end gap-2 pt-4 border-t">
							<Button
								variant="outline"
								onClick={() => setShowNewDialog(false)}
								disabled={saving}
							>
								Cancelar
							</Button>
							<Button onClick={handleSaveNewReserva} disabled={saving}>
								{saving ? (
									<>
										<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
										Guardando...
									</>
								) : (
									<>
										<Plus className="w-4 h-4 mr-2" />
										Crear Reserva
									</>
								)}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Modal de Historial de Cliente */}
			<Dialog open={showHistorialDialog} onOpenChange={setShowHistorialDialog}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							Historial del Cliente
							{historialCliente && ` - ${historialCliente.cliente.nombre}`}
						</DialogTitle>
						<DialogDescription>
							Todas las reservas y estadísticas del cliente
						</DialogDescription>
					</DialogHeader>

					{historialCliente && (
						<div className="space-y-6">
							{/* Información del Cliente */}
							<div className="bg-muted p-4 rounded-lg">
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<Label className="text-muted-foreground">Email</Label>
										<p className="font-medium">
											{historialCliente.cliente.email}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Teléfono</Label>
										<p className="font-medium">
											{historialCliente.cliente.telefono}
										</p>
									</div>
									{historialCliente.cliente.rut && (
										<div>
											<Label className="text-muted-foreground">RUT</Label>
											<p className="font-medium">
												{historialCliente.cliente.rut}
											</p>
										</div>
									)}
                                                                        <div>
                                                                                <Label className="text-muted-foreground">Tipo</Label>
                                                                                <div>
                                                                                        {historialCliente.cliente.esCliente ? (
                                                                                                <Badge variant="default">
                                                                                                        <Star className="w-3 h-3 mr-1" />
                                                                                                        Cliente
                                                                                                </Badge>
                                                                                        ) : (
                                                                                                <Badge variant="secondary">Cotizador</Badge>
                                                                                        )}
                                                                                </div>
                                                                        </div>
                                                                        {historialCliente.cliente.clasificacion && (
                                                                                <div>
                                                                                        <Label className="text-muted-foreground">
                                                                                                Clasificación
                                                                                        </Label>
                                                                                        <div>
                                                                                                <Badge variant="outline">
                                                                                                        {historialCliente.cliente.clasificacion}
                                                                                                </Badge>
                                                                                        </div>
                                                                                </div>
                                                                        )}
                                                                </div>
                                                        </div>

							{/* Estadísticas */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<Card>
									<CardContent className="p-4">
										<p className="text-sm text-muted-foreground">
											Total Reservas
										</p>
										<p className="text-2xl font-bold">
											{historialCliente.estadisticas.totalReservas}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4">
										<p className="text-sm text-muted-foreground">
											Reservas Pagadas
										</p>
										<p className="text-2xl font-bold text-green-600">
											{historialCliente.estadisticas.totalPagadas}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4">
										<p className="text-sm text-muted-foreground">
											Reservas Pendientes
										</p>
										<p className="text-2xl font-bold text-orange-600">
											{historialCliente.estadisticas.totalPendientes}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4">
										<p className="text-sm text-muted-foreground">
											Total Gastado
										</p>
										<p className="text-2xl font-bold text-blue-600">
											{formatCurrency(
												historialCliente.estadisticas.totalGastado
											)}
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Lista de Reservas */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Historial de Reservas ({historialCliente.reservas.length})
								</h3>
								<div className="space-y-2 max-h-96 overflow-y-auto">
									{historialCliente.reservas.map((reserva) => (
										<div
											key={reserva.id}
											className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
											onClick={() => {
												setShowHistorialDialog(false);
												handleViewDetails(reserva);
											}}
										>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-medium">#{reserva.id}</span>
														{getEstadoBadge(reserva.estado)}
														{getEstadoPagoBadge(reserva.estadoPago)}
													</div>
													<div className="text-sm text-muted-foreground">
														<div className="flex items-center gap-2">
															<MapPin className="w-3 h-3" />
															{reserva.origen} → {reserva.destino}
														</div>
														<div className="flex items-center gap-2 mt-1">
															<Calendar className="w-3 h-3" />
															{formatDate(reserva.fecha)} •{" "}
															{reserva.hora || "-"}
														</div>
													</div>
												</div>
												<div className="text-right">
													<p className="font-semibold">
														{formatCurrency(reserva.totalConDescuento)}
													</p>
													{reserva.saldoPendiente > 0 && (
														<p className="text-sm text-red-600">
															Saldo: {formatCurrency(reserva.saldoPendiente)}
														</p>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Dialog de confirmación para eliminar masivamente */}
			<AlertDialog
				open={showBulkDeleteDialog}
				onOpenChange={setShowBulkDeleteDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							¿Eliminar reservas seleccionadas?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción eliminará permanentemente {selectedReservas.length}{" "}
							reserva(s). Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={processingBulk}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBulkDelete}
							disabled={processingBulk}
							className="bg-red-600 hover:bg-red-700"
						>
							{processingBulk ? (
								<>
									<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
									Eliminando...
								</>
							) : (
								"Eliminar"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Dialog para cambio masivo de estado */}
			<AlertDialog
				open={showBulkStatusDialog}
				onOpenChange={setShowBulkStatusDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Cambiar estado de reservas seleccionadas
						</AlertDialogTitle>
						<AlertDialogDescription>
							Selecciona el nuevo estado para {selectedReservas.length}{" "}
							reserva(s):
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="py-4">
						<Select value={bulkEstado} onValueChange={setBulkEstado}>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pendiente">Pendiente</SelectItem>
								<SelectItem value="pendiente_detalles">
									Pendiente Detalles
								</SelectItem>
								<SelectItem value="confirmada">Confirmada</SelectItem>
								<SelectItem value="cancelada">Cancelada</SelectItem>
								<SelectItem value="completada">Completada</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={processingBulk}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBulkChangeStatus}
							disabled={processingBulk || !bulkEstado}
						>
							{processingBulk ? (
								<>
									<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
									Actualizando...
								</>
							) : (
								"Actualizar Estado"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Dialog para cambio masivo de estado de pago */}
			<AlertDialog
				open={showBulkPaymentDialog}
				onOpenChange={setShowBulkPaymentDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Cambiar estado de pago de reservas seleccionadas
						</AlertDialogTitle>
						<AlertDialogDescription>
							Selecciona el nuevo estado de pago para {selectedReservas.length}{" "}
							reserva(s):
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="py-4">
						<Select value={bulkEstadoPago} onValueChange={setBulkEstadoPago}>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un estado de pago" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pendiente">Pendiente</SelectItem>
								<SelectItem value="pagado">Pagado</SelectItem>
								<SelectItem value="fallido">Fallido</SelectItem>
								<SelectItem value="reembolsado">Reembolsado</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={processingBulk}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBulkChangePayment}
							disabled={processingBulk || !bulkEstadoPago}
						>
							{processingBulk ? (
								<>
									<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
									Actualizando...
								</>
							) : (
								"Actualizar Estado de Pago"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Dialog para asignar vehículo y conductor */}
			<Dialog open={showAsignarDialog} onOpenChange={setShowAsignarDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							Asignar Vehículo y Conductor - Reserva #
							{selectedReserva?.id}
						</DialogTitle>
						<DialogDescription>
							Asigna un vehículo y opcionalmente un conductor a esta reserva
							pagada
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Información de la reserva */}
						<div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
							<p>
								<strong>Cliente:</strong> {selectedReserva?.nombre}
							</p>
                            <div className="flex items-center justify-between gap-3">
                                <p className="m-0">
                                    <strong>Ruta:</strong> {selectedReserva?.origen} → {selectedReserva?.destino}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowAsignarDialog(false);
                                        handleEdit(selectedReserva);
                                    }}
                                >
                                    Editar ruta
                                </Button>
                            </div>
							<p>
								<strong>Fecha:</strong>{" "}
								{selectedReserva?.fecha
									? new Date(selectedReserva.fecha).toLocaleDateString(
											"es-CL"
									  )
									: ""}
							</p>
							<p>
								<strong>Pasajeros:</strong> {selectedReserva?.pasajeros}
							</p>
						</div>

						{/* Selector de vehículo */}
						<div className="space-y-2">
							<Label htmlFor="vehiculo">
								Vehículo <span className="text-red-500">*</span>
							</Label>
							<Select
								value={vehiculoSeleccionado}
								onValueChange={setVehiculoSeleccionado}
							>
								<SelectTrigger id="vehiculo">
									<SelectValue placeholder="Selecciona un vehículo" />
								</SelectTrigger>
								<SelectContent>
										{vehiculos.map((v) => (
											<SelectItem
												key={v.id}
												value={v.id.toString()}
												disabled={assignedVehiculoId !== null && assignedVehiculoId === v.id}
											>
											{v.patente} - {v.tipo} ({v.marca} {v.modelo}) -{" "}
											{v.capacidad} pasajeros
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						{/* Selector de conductor (opcional) */}
						<div className="space-y-2">
							<Label htmlFor="conductor">Conductor (opcional)</Label>
							<Select
								value={conductorSeleccionado}
								onValueChange={setConductorSeleccionado}
							>
								<SelectTrigger id="conductor">
									<SelectValue placeholder="Selecciona un conductor (opcional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Sin asignar</SelectItem>
										{conductores.map((c) => (
											<SelectItem
												key={c.id}
												value={c.id.toString()}
												disabled={assignedConductorId !== null && assignedConductorId === c.id}
											>
											{c.nombre} - {c.rut}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

							{/* Sin edición de ruta en reasignación */}

						{/* Enviar notificación */}
						<div className="flex items-center gap-2 pt-2">
							<Checkbox
								id="enviar-notificacion"
								checked={enviarNotificacion}
								onCheckedChange={(v) => setEnviarNotificacion(Boolean(v))}
							/>
							<label htmlFor="enviar-notificacion" className="text-sm text-muted-foreground cursor-pointer">
								Enviar notificación por correo al cliente
							</label>
						</div>

						{/* Mostrar asignaciones actuales si existen */}
						{(selectedReserva?.vehiculo_asignado ||
							selectedReserva?.conductor_asignado) && (
							<div className="bg-blue-50 p-3 rounded-lg space-y-1 text-sm">
								<p className="font-semibold">Asignación actual:</p>
								{selectedReserva.vehiculo_asignado && (
									<p>
										🚗 Vehículo:{" "}
										{selectedReserva.vehiculo_asignado.patente} (
										{selectedReserva.vehiculo_asignado.tipo})
									</p>
								)}
								{selectedReserva.conductor_asignado && (
									<p>
										👤 Conductor:{" "}
										{selectedReserva.conductor_asignado.nombre}
									</p>
								)}
							</div>
						)}
					</div>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => setShowAsignarDialog(false)}
							disabled={loadingAsignacion}
						>
							Cancelar
						</Button>
						{(() => {
							const sameAssignment =
								assignedVehiculoId !== null &&
								vehiculoSeleccionado &&
								Number(vehiculoSeleccionado) === Number(assignedVehiculoId) &&
								(String(assignedConductorId ?? "none") === String(conductorSeleccionado || "none"));
							return (
								<Button
							onClick={handleGuardarAsignacion}
							disabled={loadingAsignacion || !vehiculoSeleccionado || sameAssignment}
						>
							{loadingAsignacion ? (
								<>
									<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
									Guardando...
								</>
							) : (
								sameAssignment ? "Sin cambios" : "Asignar"
							)}
							</Button>
							);
						})()}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminReservas;
