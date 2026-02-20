import React, { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "./ui/dialog";
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
import { Alert, AlertDescription } from "./ui/alert";
import {
	LoaderCircle,
	Plus,
	Trash2,
	Copy,
	MessageCircle,
	MapPin,
	DollarSign,
	Clock,
	Pencil,
	Ban,
	ArrowUpDown,
	User,
	CheckCircle2,
	XCircle,
} from "lucide-react";
import { destinosBase } from "../data/destinos";
import { getBackendUrl } from "../lib/backend";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { useMediaQuery } from "../hooks/useMediaQuery";

const AEROPUERTO = "Aeropuerto La Araucanía";
const OPCION_OTRO = "Otro";
const DESTINO_BASE_POR_DEFECTO = destinosBase[0]?.nombre || "";

// Constantes de tiempo en minutos para los botones de vencimiento
const QUINCE_MINUTOS = 15;
const TREINTA_MINUTOS = 30;
const UNA_HORA = 60;
const DOS_HORAS = 120;
const VEINTICUATRO_HORAS = 24 * 60;

/**
 * Genera una fecha/hora local sin conversión a UTC
 * @param {number} minutosAdelante - Cantidad de minutos a agregar desde la hora actual (debe ser >= 0)
 * @returns {string} Fecha formateada en formato 'YYYY-MM-DDTHH:mm' (compatible con datetime-local)
 *
 * Soluciona el problema de desfase horario al usar toISOString() que convierte a UTC.
 * Chile está en UTC-3 (o UTC-4 en horario de verano), causando un desfase de 3-4 horas.
 */
const obtenerFechaLocal = (minutosAdelante) => {
	const minutos = Math.max(0, Number(minutosAdelante) || 0);
	const fecha = new Date();
	fecha.setTime(fecha.getTime() + minutos * 60 * 1000);
	const año = fecha.getFullYear();
	const mes = String(fecha.getMonth() + 1).padStart(2, "0");
	const dia = String(fecha.getDate()).padStart(2, "0");
	const horas = String(fecha.getHours()).padStart(2, "0");
	const minutosStr = String(fecha.getMinutes()).padStart(2, "0");
	return `${año}-${mes}-${dia}T${horas}:${minutosStr}`;
};

const formatCurrency = (value) =>
	new Intl.NumberFormat("es-CL", {
		style: "currency",
		currency: "CLP",
	}).format(value || 0);

const formatDate = (date) => {
	if (!date) return "-";
	return new Date(date).toLocaleDateString("es-CL", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const generarMensaje = (codigo) => {
	const urlPago = `https://www.transportesaraucaria.cl/#pagar-con-codigo`;
	let mensaje = `Hola, aquí tienes tu código de pago:\n\n${codigo.codigo}\n\nPuedes realizar el pago en el siguiente enlace:\n${urlPago}\n\nDetalles:\nOrigen: ${codigo.origen}\nDestino: ${codigo.destino}\nMonto: ${formatCurrency(codigo.monto)}`;
	if (codigo.idaVuelta) mensaje += `\nTipo: Ida y vuelta`;
	if (codigo.fechaVencimiento) {
		mensaje += `\n\n⏰ Válido hasta: ${formatDate(codigo.fechaVencimiento)}`;
	}
	return mensaje;
};

const FORM_INICIAL = {
	origen: AEROPUERTO,
	otroOrigen: "",
	destino: "",
	otroDestino: "",
	monto: "",
	descripcion: "",
	vehiculo: "",
	pasajeros: 1,
	idaVuelta: false,
	permitirAbono: false,
	sillaInfantil: false,
	fechaVencimiento: "",
	usosMaximos: 1,
	observaciones: "",
	duracionMinutos: "",
	nombreCliente: "",
	emailCliente: "",
	telefonoCliente: "",
	direccionCliente: "",
	codigoReservaVinculado: "",
	reservaVinculadaId: null,
};

function AdminCodigosPago() {
	const isMobile = useMediaQuery("(max-width: 767px)");

	const [codigosPago, setCodigosPago] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showCrearDialog, setShowCrearDialog] = useState(false);
	const [procesando, setProcesando] = useState(false);
	const [formData, setFormData] = useState(FORM_INICIAL);

	// Estado para ordenamiento
	const [sortKey, setSortKey] = useState("created_at");
	const [sortDir, setSortDir] = useState("desc");

	// Estado para diálogos de confirmación
	const [confirmEliminar, setConfirmEliminar] = useState(null); // código string
	const [confirmCancelar, setConfirmCancelar] = useState(null); // código string

	// Estado para edición
	const [codigoEditando, setCodigoEditando] = useState(null);
	const [formEdicion, setFormEdicion] = useState({ monto: "", fechaVencimiento: "", usosMaximos: "", observaciones: "" });

	const backendUrl = getBackendUrl();
	const { authenticatedFetch } = useAuthenticatedFetch();
	const [destinosOpciones, setDestinosOpciones] = useState(
		destinosBase.map((d) => d.nombre)
	);

	// Carga dinámica de destinos desde el backend
	useEffect(() => {
		let cancelado = false;
		const cargar = async () => {
			try {
				const resp = await fetch(`${backendUrl}/pricing`);
				if (!resp.ok) return;
				const data = await resp.json();
				const lista = Array.isArray(data?.destinos)
					? data.destinos
							.map((d) => (typeof d?.nombre === "string" ? d.nombre : null))
							.filter(Boolean)
					: [];
				if (!cancelado && lista.length > 0) setDestinosOpciones(lista);
			} catch {
				// fallback a destinosBase
			}
		};
		cargar();
		return () => { cancelado = true; };
	}, [backendUrl]);

	// Buscar reserva vinculada automáticamente para pre-llenar datos
	useEffect(() => {
		const codigo = formData.codigoReservaVinculado?.trim().toUpperCase();
		if (!codigo || !codigo.startsWith("AR-") || codigo.length < 13) return;

		const buscar = async () => {
			try {
				const resp = await authenticatedFetch(`/api/reservas/buscar/${codigo}`);
				if (!resp.ok) return;
				const data = await resp.json();
				if (data.success && data.reserva) {
					const r = data.reserva;
					setFormData((prev) => ({
						...prev,
						nombreCliente: r.nombre || prev.nombreCliente || "",
						emailCliente: r.email || prev.emailCliente || "",
						telefonoCliente: r.telefono || prev.telefonoCliente || "",
						reservaVinculadaId: r.id || prev.reservaVinculadaId,
						origen: r.origen || prev.origen || "",
						destino: r.destino || prev.destino || "",
						pasajeros: r.pasajeros || prev.pasajeros || 1,
						vehiculo: r.vehiculo || prev.vehiculo || "",
						direccionCliente: (r.origen || "").includes("Aeropuerto")
							? r.direccionDestino || prev.direccionCliente || ""
							: r.direccionOrigen || prev.direccionCliente || "",
					}));
				}
			} catch (e) {
				console.error("Error buscando reserva vinculada:", e);
			}
		};

		const timer = setTimeout(buscar, 600);
		return () => clearTimeout(timer);
	}, [formData.codigoReservaVinculado, authenticatedFetch]);

	const origenes = useMemo(
		() => [AEROPUERTO, ...destinosOpciones, OPCION_OTRO],
		[destinosOpciones]
	);
	const destinos = useMemo(
		() => [AEROPUERTO, ...destinosOpciones, OPCION_OTRO],
		[destinosOpciones]
	);
	const destinosFiltrados = useMemo(
		() => destinos.filter((d) => d !== formData.origen),
		[destinos, formData.origen]
	);



	// Calcular tiempo restante hasta el vencimiento
	const calcularTiempoRestante = useCallback((fechaVencimiento) => {
		if (!fechaVencimiento) return null;
		const ahora = new Date();
		const vencimiento = new Date(fechaVencimiento);
		const diff = vencimiento - ahora;

		if (diff <= 0) return { vencido: true, texto: "Vencido", clase: "text-red-600 font-bold" };

		const minutos = Math.floor(diff / 60000);
		const horas = Math.floor(minutos / 60);
		const dias = Math.floor(horas / 24);

		if (dias > 0) {
			return { vencido: false, texto: `${dias}d ${horas % 24}h`, urgente: false, clase: "text-green-600" };
		}
		if (horas > 0) {
			const urgente = horas < 2;
			return { vencido: false, texto: `${horas}h ${minutos % 60}m`, urgente, clase: urgente ? "text-orange-600 font-semibold" : "text-green-600" };
		}
		return { vencido: false, texto: `${minutos}m`, urgente: true, clase: "text-red-600 font-bold animate-pulse" };
	}, []);

	const cargarCodigos = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const response = await authenticatedFetch(`/api/codigos-pago`, { method: "GET" });
			const data = await response.json();
			if (!response.ok) {
				setError(data.message || "Error al cargar códigos");
				return;
			}
			setCodigosPago(data.codigosPago || []);
		} catch {
			setError("Error al conectar con el servidor");
		} finally {
			setLoading(false);
		}
	}, [authenticatedFetch]);

	useEffect(() => {
		cargarCodigos();

		// Refresco real del servidor cada 60 segundos
		const intervalo = setInterval(() => {
			cargarCodigos();
		}, 60000);

		return () => clearInterval(intervalo);
	}, [cargarCodigos]);

	// ── Estadísticas ──────────────────────────────────────────────────────────
	const estadisticas = useMemo(() => {
		const activos = codigosPago.filter((c) => c.estado === "activo").length;
		const usados = codigosPago.filter((c) => c.estado === "usado").length;
		const vencidos = codigosPago.filter((c) => c.estado === "vencido").length;
		const cancelados = codigosPago.filter((c) => c.estado === "cancelado").length;
		return { activos, usados, vencidos, cancelados, total: codigosPago.length };
	}, [codigosPago]);

	// ── Ordenamiento ──────────────────────────────────────────────────────────
	const codigosOrdenados = useMemo(() => {
		const arr = [...codigosPago];
		arr.sort((a, b) => {
			let va = a[sortKey];
			let vb = b[sortKey];
			if (sortKey === "monto" || sortKey === "usosActuales") {
				va = Number(va) || 0;
				vb = Number(vb) || 0;
			} else if (sortKey === "fechaVencimiento" || sortKey === "created_at") {
				va = va ? new Date(va).getTime() : 0;
				vb = vb ? new Date(vb).getTime() : 0;
			} else {
				va = String(va || "").toLowerCase();
				vb = String(vb || "").toLowerCase();
			}
			if (va < vb) return sortDir === "asc" ? -1 : 1;
			if (va > vb) return sortDir === "asc" ? 1 : -1;
			return 0;
		});
		return arr;
	}, [codigosPago, sortKey, sortDir]);

	const handleSort = (key) => {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("desc");
		}
	};

	// ── Formulario ───────────────────────────────────────────────────────────
	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		let nuevoForm = { ...formData };
		if (name === "origen") {
			nuevoForm.origen = type === "checkbox" ? checked : value;
			if (value === AEROPUERTO) {
				if (formData.destino === AEROPUERTO) nuevoForm.destino = destinosOpciones[0] || "Temuco";
			} else if (value === OPCION_OTRO) {
				nuevoForm.destino = AEROPUERTO;
			} else {
				nuevoForm.destino = AEROPUERTO;
			}
		} else if (name === "destino") {
			nuevoForm.destino = type === "checkbox" ? checked : value;
			if (value === AEROPUERTO) {
				if (formData.origen === AEROPUERTO) nuevoForm.origen = destinosOpciones[0] || "Temuco";
			} else if (value === OPCION_OTRO) {
				nuevoForm.origen = AEROPUERTO;
			} else {
				if (formData.origen === value) nuevoForm.origen = AEROPUERTO;
			}
		} else {
			nuevoForm[name] = type === "checkbox" ? checked : value;
		}
		setFormData(nuevoForm);
	};

	// Efecto para establecer valores por defecto al abrir el modal
	useEffect(() => {
		if (showCrearDialog) {
			setFormData((prev) => {
				const updates = {};
				if (!prev.fechaVencimiento) {
					updates.fechaVencimiento = obtenerFechaLocal(VEINTICUATRO_HORAS);
				}
				return Object.keys(updates).length ? { ...prev, ...updates } : prev;
			});
		}
	}, [showCrearDialog]);

	const generarCodigoLocal = () => {
		const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/1/O/I
		const rand = Array.from(
			{ length: 6 },
			() => alphabet[Math.floor(Math.random() * alphabet.length)]
		).join("");
		return `PX-${rand}`;
	};



	const copiarAlPortapapeles = (codigo) => {
		const texto = typeof codigo === "object" ? generarMensaje(codigo) : codigo;
		navigator.clipboard.writeText(texto).then(() => {
			toast.success("Copiado al portapapeles", { description: "El mensaje listo para WhatsApp fue copiado." });
		}).catch(() => {
			toast.error("No se pudo copiar al portapapeles");
		});
	};

	const enviarPorWhatsApp = (codigo) => {
		const mensaje = generarMensaje(codigo);
		const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
		window.open(url, "_blank");
	};

	const crearCodigo = async () => {
		const origenResuelto = formData.origen === OPCION_OTRO ? (formData.otroOrigen || "").trim() : formData.origen;
		const destinoResuelto = formData.destino === OPCION_OTRO ? (formData.otroDestino || "").trim() : formData.destino;
		if (!destinoResuelto) { setError("El destino es requerido"); return; }
		if (origenResuelto === destinoResuelto) { setError("No se permite un viaje con origen y destino iguales"); return; }
		if ((formData.origen === OPCION_OTRO || formData.destino === OPCION_OTRO) && (!formData.duracionMinutos || parseInt(formData.duracionMinutos) < 15)) {
			setError("La duración aproximada es obligatoria cuando el origen o destino es 'Otro' (mínimo 15 minutos)");
			return;
		}
		if (!formData.monto || parseFloat(formData.monto) <= 0) { setError("El monto debe ser mayor a 0"); return; }

		setProcesando(true);
		setError("");
		try {
			const codigoGenerado = generarCodigoLocal();
			const payload = {
				codigo: codigoGenerado,
				origen: origenResuelto,
				destino: destinoResuelto,
				monto: parseFloat(formData.monto),
				descripcion: formData.descripcion || "",
				vehiculo: formData.vehiculo || "",
				pasajeros: parseInt(formData.pasajeros) || 1,
				idaVuelta: Boolean(formData.idaVuelta),
				permitirAbono: Boolean(formData.permitirAbono),
				sillaInfantil: Boolean(formData.sillaInfantil),
				fechaVencimiento: formData.fechaVencimiento ? new Date(formData.fechaVencimiento).toISOString() : undefined,
				usosMaximos: parseInt(formData.usosMaximos) || 1,
				observaciones: formData.observaciones || "",
				duracionMinutos: (formData.origen === OPCION_OTRO || formData.destino === OPCION_OTRO) ? parseInt(formData.duracionMinutos) : null,
				nombreCliente: formData.nombreCliente.trim() || null,
				emailCliente: formData.emailCliente.trim() || null,
				telefonoCliente: formData.telefonoCliente.trim() || null,
				direccionCliente: formData.direccionCliente.trim() || null,
				codigoReservaVinculado: formData.codigoReservaVinculado.trim() || null,
				reservaVinculadaId: formData.reservaVinculadaId || null,
			};
			const response = await authenticatedFetch(`/api/codigos-pago`, {
				method: "POST",
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (!response.ok || data.success === false) {
				setError(data.message || "Error al crear código");
				return;
			}

			setFormData(FORM_INICIAL);
			setShowCrearDialog(false);
			await cargarCodigos();

			toast.success(`Código ${codigoGenerado} creado`, {
				description: "¿Deseas enviarlo por WhatsApp ahora?",
				action: {
					label: "Abrir WhatsApp",
					onClick: () => enviarPorWhatsApp({ ...payload, codigo: codigoGenerado }),
				},
				duration: 8000,
			});
		} catch {
			setError("Error al conectar con el servidor");
		} finally {
			setProcesando(false);
		}
	};

	// ── Eliminar ─────────────────────────────────────────────────────────────
	const eliminarCodigo = async (codigo) => {
		try {
			const response = await authenticatedFetch(`/api/codigos-pago/${codigo}`, { method: "DELETE" });
			if (!response.ok) {
				const data = await response.json();
				toast.error(data.message || "Error al eliminar código");
				return;
			}
			toast.success(`Código ${codigo} eliminado`);
			setCodigosPago((prev) => prev.filter((c) => c.codigo !== codigo));
		} catch {
			toast.error("Error al conectar con el servidor");
		} finally {
			setConfirmEliminar(null);
		}
	};

	// ── Cancelar ─────────────────────────────────────────────────────────────
	const cancelarCodigo = async (codigo) => {
		try {
			const response = await authenticatedFetch(`/api/codigos-pago/${codigo}/cancelar`, { method: "PUT" });
			if (!response.ok) {
				const data = await response.json();
				toast.error(data.message || "Error al cancelar código");
				return;
			}
			toast.success(`Código ${codigo} cancelado`);
			setCodigosPago((prev) => prev.map((c) => c.codigo === codigo ? { ...c, estado: "cancelado" } : c));
		} catch {
			toast.error("Error al conectar con el servidor");
		} finally {
			setConfirmCancelar(null);
		}
	};

	// ── Editar ────────────────────────────────────────────────────────────────
	const abrirEdicion = (c) => {
		setCodigoEditando(c);
		setFormEdicion({
			monto: String(c.monto || ""),
			fechaVencimiento: c.fechaVencimiento ? obtenerFechaLocal(0).slice(0, 16) : "",
			usosMaximos: String(c.usosMaximos || 1),
			observaciones: c.observaciones || "",
		});
		// Pre-cargar fecha real del registro
		if (c.fechaVencimiento) {
			const d = new Date(c.fechaVencimiento);
			const año = d.getFullYear();
			const mes = String(d.getMonth() + 1).padStart(2, "0");
			const dia = String(d.getDate()).padStart(2, "0");
			const h = String(d.getHours()).padStart(2, "0");
			const m = String(d.getMinutes()).padStart(2, "0");
			setFormEdicion((prev) => ({ ...prev, fechaVencimiento: `${año}-${mes}-${dia}T${h}:${m}` }));
		}
	};

	const guardarEdicion = async () => {
		if (!codigoEditando) return;
		const monto = parseFloat(formEdicion.monto);
		if (!isFinite(monto) || monto <= 0) {
			toast.error("El monto debe ser mayor a 0");
			return;
		}
		setProcesando(true);
		try {
			const payload = {
				monto,
				usosMaximos: parseInt(formEdicion.usosMaximos) || 1,
				observaciones: formEdicion.observaciones,
				fechaVencimiento: formEdicion.fechaVencimiento
					? new Date(formEdicion.fechaVencimiento).toISOString()
					: null,
			};
			const response = await authenticatedFetch(`/api/codigos-pago/${codigoEditando.codigo}`, {
				method: "PUT",
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (!response.ok || data.success === false) {
				toast.error(data.message || "Error al editar código");
				return;
			}
			toast.success(`Código ${codigoEditando.codigo} actualizado`);
			setCodigosPago((prev) => prev.map((c) => c.codigo === codigoEditando.codigo ? data.codigoPago : c));
			setCodigoEditando(null);
		} catch {
			toast.error("Error al conectar con el servidor");
		} finally {
			setProcesando(false);
		}
	};

	// ── Badge de estado ───────────────────────────────────────────────────────
	const getEstadoBadge = (estado) => {
		const badges = {
			activo: <Badge className="bg-green-500">Activo</Badge>,
			usado: <Badge variant="secondary">Usado</Badge>,
			vencido: <Badge variant="destructive">Vencido</Badge>,
			cancelado: <Badge variant="outline" className="text-gray-500">Cancelado</Badge>,
		};
		return badges[estado] || <Badge>{estado}</Badge>;
	};

	// ── Botones de acción por estado ──────────────────────────────────────────
	const renderAcciones = (c, compact = false) => {
		const puedeEliminar = c.estado !== "usado";
		const puedeCancelar = c.estado !== "usado" && c.estado !== "cancelado";
		const puedeEditar = c.estado !== "usado" && c.estado !== "cancelado";
		const puedeReactivar = c.estado === "cancelado";
		const size = compact ? "sm" : "sm";
		const ghost = compact ? "ghost" : "ghost";
		return (
			<div className={compact ? "flex gap-2" : "flex gap-1"}>
				<Button variant={ghost} size={size} title="Copiar mensaje" onClick={() => copiarAlPortapapeles(c)}>
					<Copy className={compact ? "h-5 w-5" : "h-4 w-4 text-blue-500"} />
				</Button>
				<Button variant={ghost} size={size} title="Enviar por WhatsApp" onClick={() => enviarPorWhatsApp(c)}>
					<MessageCircle className={compact ? "h-5 w-5" : "h-4 w-4 text-green-500"} />
				</Button>
				{puedeEditar && (
					<Button variant={ghost} size={size} title="Editar código" onClick={() => abrirEdicion(c)}>
						<Pencil className={compact ? "h-5 w-5" : "h-4 w-4 text-yellow-600"} />
					</Button>
				)}
				{puedeReactivar && (
					<Button variant={ghost} size={size} title="Reactivar código" onClick={() => abrirEdicion(c)}>
						<CheckCircle2 className={compact ? "h-5 w-5" : "h-4 w-4 text-green-600"} />
					</Button>
				)}
				{puedeCancelar && (
					<Button variant={ghost} size={size} title="Cancelar sin eliminar" onClick={() => setConfirmCancelar(c.codigo)}>
						<Ban className={compact ? "h-5 w-5" : "h-4 w-4 text-orange-500"} />
					</Button>
				)}
				{puedeEliminar && (
					<Button variant={ghost} size={size} title="Eliminar" onClick={() => setConfirmEliminar(c.codigo)}>
						<Trash2 className={compact ? "h-5 w-5" : "h-4 w-4 text-red-500"} />
					</Button>
				)}
			</div>
		);
	};

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<div className="container mx-auto py-8 px-4">
			{/* Cabecera */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Códigos de Pago</h1>
					<p className="text-gray-600">Genera códigos para enviar por WhatsApp</p>
				</div>
				<Button onClick={() => setShowCrearDialog(true)}>
					<Plus className="h-4 w-4 mr-2" /> Nuevo Código
				</Button>
			</div>

			{error && (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Panel de estadísticas */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
				{[
					{ label: "Activos", value: estadisticas.activos, color: "text-green-600", bg: "bg-green-50 border-green-200", icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
					{ label: "Usados", value: estadisticas.usados, color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: <User className="h-5 w-5 text-slate-400" /> },
					{ label: "Vencidos", value: estadisticas.vencidos, color: "text-red-600", bg: "bg-red-50 border-red-200", icon: <XCircle className="h-5 w-5 text-red-400" /> },
					{ label: "Cancelados", value: estadisticas.cancelados, color: "text-gray-500", bg: "bg-gray-50 border-gray-200", icon: <Ban className="h-5 w-5 text-gray-400" /> },
				].map(({ label, value, color, bg, icon }) => (
					<div key={label} className={`flex items-center gap-3 border rounded-lg p-3 ${bg}`}>
						{icon}
						<div>
							<div className={`text-2xl font-bold ${color}`}>{value}</div>
							<div className="text-xs text-gray-500">{label}</div>
						</div>
					</div>
				))}
			</div>

			{/* Lista */}
			<Card>
				<CardHeader>
					<CardTitle>Lista de Códigos</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex justify-center py-8">
							<LoaderCircle className="h-8 w-8 animate-spin" />
						</div>
					) : codigosPago.length === 0 ? (
						<div className="text-center py-8 text-gray-500">No hay códigos registrados</div>
					) : isMobile ? (
						// Vista tarjetas móvil
						<div className="space-y-3">
							{codigosOrdenados.map((c) => {
								const tiempo = c.fechaVencimiento ? calcularTiempoRestante(c.fechaVencimiento) : null;
								return (
									<div key={c.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<div className="font-mono font-bold text-lg truncate">{c.codigo}</div>
												<div className="flex items-center gap-2 mt-1 flex-wrap">
													{getEstadoBadge(c.estado)}
													{c.idaVuelta ? (
														<Badge className="bg-purple-600 text-white text-xs">Ida y vuelta</Badge>
													) : (
														<Badge variant="outline" className="text-xs">Solo ida</Badge>
													)}
												</div>
											</div>
										</div>

										{renderAcciones(c, true)}

										{/* Ruta */}
										<div className="space-y-1 text-sm">
											<div className="flex items-start gap-2">
												<MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
												<div className="flex-1">
													<div className="font-medium">{c.origen}</div>
													<div className="text-gray-500 ml-1">↓</div>
													<div className="font-medium">{c.destino}</div>
												</div>
											</div>
										</div>

										{/* Cliente vinculado */}
										{(c.nombreCliente || c.codigoReservaVinculado) && (
											<div className="flex items-center gap-2 bg-blue-50 p-2 rounded text-sm">
												<User className="h-4 w-4 text-blue-500 flex-shrink-0" />
												<div className="min-w-0">
													{c.nombreCliente && <div className="font-medium text-blue-800 truncate">{c.nombreCliente}</div>}
													{c.codigoReservaVinculado && <div className="text-blue-600 text-xs font-mono">{c.codigoReservaVinculado}</div>}
												</div>
											</div>
										)}

										{/* Monto */}
										<div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
											<DollarSign className="h-5 w-5 text-green-600" />
											<span className="text-xl font-bold text-green-700">{formatCurrency(c.monto)}</span>
										</div>

										{/* Usos y vencimiento */}
										<div className="grid grid-cols-2 gap-3 text-sm">
											<div className="bg-gray-50 p-2 rounded">
												<div className="text-gray-500 text-xs">Usos</div>
												<div className="font-semibold">{c.usosActuales} / {c.usosMaximos}</div>
											</div>
											<div className="bg-gray-50 p-2 rounded">
												<div className="text-gray-500 text-xs flex items-center gap-1">
													<Clock className="h-3 w-3" />Vencimiento
												</div>
												{c.fechaVencimiento ? (
													<div>
														<div className="text-xs text-gray-600">{formatDate(c.fechaVencimiento)}</div>
														{tiempo && (
															<div className={`font-semibold text-sm ${tiempo.clase}`}>
																{tiempo.urgente && !tiempo.vencido && "⏰ "}
																{tiempo.vencido && "❌ "}
																{tiempo.texto}
															</div>
														)}
													</div>
												) : (
													<span className="text-xs text-gray-400">Sin límite</span>
												)}
											</div>
										</div>

										{/* Fecha de uso (historial básico) */}
										{c.fechaUso && (
											<div className="text-xs text-gray-500 border-t pt-2">
												Usado: {formatDate(c.fechaUso)}{c.emailCliente ? ` · ${c.emailCliente}` : ""}
											</div>
										)}
									</div>
								);
							})}
						</div>
					) : (
						// Vista tabla desktop
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Código</TableHead>
										<TableHead>
											<button className="flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("origen")}>
												Ruta <ArrowUpDown className="h-3 w-3" />
											</button>
										</TableHead>
										<TableHead>
											<button className="flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("monto")}>
												Monto <ArrowUpDown className="h-3 w-3" />
											</button>
										</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead>
											<button className="flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("estado")}>
												Estado <ArrowUpDown className="h-3 w-3" />
											</button>
										</TableHead>
										<TableHead>Usos</TableHead>
										<TableHead>
											<button className="flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("fechaVencimiento")}>
												Vence <ArrowUpDown className="h-3 w-3" />
											</button>
										</TableHead>
										<TableHead>Cliente</TableHead>
										<TableHead>Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{codigosOrdenados.map((c) => (
										<TableRow key={c.id}>
											<TableCell className="font-mono font-bold">{c.codigo}</TableCell>
											<TableCell>
												<div className="text-sm">
													<div>{c.origen}</div>
													<div className="text-gray-400">↓</div>
													<div>{c.destino}</div>
												</div>
											</TableCell>
											<TableCell>{formatCurrency(c.monto)}</TableCell>
											<TableCell>
												{c.idaVuelta ? (
													<Badge className="bg-purple-600 text-white">Ida y vuelta</Badge>
												) : (
													<Badge variant="outline">Solo ida</Badge>
												)}
											</TableCell>
											<TableCell>{getEstadoBadge(c.estado)}</TableCell>
											<TableCell>{c.usosActuales} / {c.usosMaximos}</TableCell>
											<TableCell className="text-sm">
												{c.fechaVencimiento ? (
													<div className="space-y-1">
														<div className="text-xs text-gray-500">{formatDate(c.fechaVencimiento)}</div>
														{(() => {
															const tiempo = calcularTiempoRestante(c.fechaVencimiento);
															if (!tiempo) return null;
															return (
																<div className={`font-medium ${tiempo.clase}`}>
																	{tiempo.urgente && !tiempo.vencido && "⏰ "}
																	{tiempo.vencido && "❌ "}
																	{tiempo.texto}
																</div>
															);
														})()}
													</div>
												) : (
													<span className="text-gray-400">Sin vencimiento</span>
												)}
											</TableCell>
											<TableCell>
												{c.nombreCliente || c.codigoReservaVinculado ? (
													<div className="text-sm min-w-0">
														{c.nombreCliente && <div className="font-medium truncate max-w-[120px]" title={c.nombreCliente}>{c.nombreCliente}</div>}
														{c.codigoReservaVinculado && <div className="text-xs text-blue-600 font-mono">{c.codigoReservaVinculado}</div>}
														{c.fechaUso && <div className="text-xs text-gray-400 mt-1">Usado: {formatDate(c.fechaUso)}</div>}
													</div>
												) : (
													<span className="text-gray-400 text-xs">—</span>
												)}
											</TableCell>
											<TableCell>{renderAcciones(c, false)}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* ── Dialog Crear ─────────────────────────────────────────────────── */}
			<Dialog open={showCrearDialog} onOpenChange={setShowCrearDialog}>
				<DialogContent className="w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-base md:text-lg">Crear Nuevo Código de Pago</DialogTitle>
						<DialogDescription className="text-sm">
							Completa origen, destino y monto. El código se generará automáticamente.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Monto */}
							<div className="space-y-2">
								<Label htmlFor="monto" className="text-base font-semibold">Monto del Servicio</Label>
								<div className="relative">
									<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
									<Input id="monto" name="monto" type="number" value={formData.monto} onChange={handleInputChange} placeholder="Ej: 35000" min="0" step="1" required className="pl-9 h-12 md:h-10 text-base border-slate-300" />
								</div>
							</div>

							{/* Sentido de Dirección */}
							<div className="space-y-2">
								<Label className="text-base">Dirección del Viaje</Label>
								<div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
									<Button
										type="button"
										variant={formData.origen === AEROPUERTO ? "default" : "ghost"}
										className="flex-1 h-10 text-xs md:text-sm px-2"
										onClick={() => {
											setFormData(prev => ({
												...prev,
												origen: AEROPUERTO,
												destino: prev.destino === AEROPUERTO ? (destinosOpciones.find(d => d === "Pucón") || destinosOpciones[0] || "Temuco") : prev.destino
											}));
										}}
									>
										Desde Aeropuerto
									</Button>
									<Button
										type="button"
										variant={formData.destino === AEROPUERTO ? "default" : "ghost"}
										className="flex-1 h-10 text-xs md:text-sm px-2"
										onClick={() => {
											setFormData(prev => ({
												...prev,
												origen: prev.origen === AEROPUERTO ? (destinosOpciones.find(d => d === "Pucón") || destinosOpciones[0] || "Temuco") : prev.origen,
												destino: AEROPUERTO
											}));
										}}
									>
										Hacia Aeropuerto
									</Button>
								</div>
							</div>
						</div>

						{/* Selectores de Ruta Inteligentes */}
						<div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
							<div className="flex items-center gap-3 mb-4 text-slate-500 font-medium text-sm">
								<MapPin className="h-4 w-4" />
								{formData.origen === AEROPUERTO ? "Origen: Aeropuerto" : formData.destino === AEROPUERTO ? "Destino: Aeropuerto" : "Ruta personalizada"}
							</div>

							<div className="grid grid-cols-1 gap-4">
								{/* Selector de Destino (Solo si el origen es Aeropuerto) */}
								{formData.origen === AEROPUERTO && (
									<div className="space-y-2">
										<Label htmlFor="destino" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Destino</Label>
										<select
											id="destino"
											name="destino"
											value={formData.destino}
											onChange={handleInputChange}
											className="h-12 md:h-10 border border-slate-300 rounded-lg px-3 w-full text-lg font-medium bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
										>
											<option value="">Selecciona destino...</option>
											{destinosFiltrados.filter(d => d !== OPCION_OTRO).map((d) => <option key={d} value={d}>{d}</option>)}
											<option value={OPCION_OTRO}>Otro (Especificar)</option>
										</select>
										{formData.destino === OPCION_OTRO && (
											<Input id="otroDestino" name="otroDestino" value={formData.otroDestino} onChange={handleInputChange} placeholder="¿A dónde vamos?" className="mt-2 h-12 md:h-10 text-base" />
										)}
									</div>
								)}

								{/* Selector de Origen (Solo si el destino es Aeropuerto) */}
								{formData.destino === AEROPUERTO && (
									<div className="space-y-2">
										<Label htmlFor="origen" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Origen</Label>
										<select
											id="origen"
											name="origen"
											value={formData.origen}
											onChange={handleInputChange}
											className="h-12 md:h-10 border border-slate-300 rounded-lg px-3 w-full text-lg font-medium bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
										>
											<option value="">Selecciona origen...</option>
											{origenes.filter(o => o !== AEROPUERTO && o !== OPCION_OTRO).map((o) => <option key={o} value={o}>{o}</option>)}
											<option value={OPCION_OTRO}>Otro (Especificar)</option>
										</select>
										{formData.origen === OPCION_OTRO && (
											<Input id="otroOrigen" name="otroOrigen" value={formData.otroOrigen} onChange={handleInputChange} placeholder="¿Desde dónde salimos?" className="mt-2 h-12 md:h-10 text-base" />
										)}
									</div>
								)}

								{/* Fallback por si acaso no hay aeropuerto en ninguno (ruta custom) */}
								{formData.origen !== AEROPUERTO && formData.destino !== AEROPUERTO && (
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="origen">Origen</Label>
											<select id="origen" name="origen" value={formData.origen} onChange={handleInputChange} className="w-full border p-2 rounded bg-white">
												{origenes.map(o => <option key={o} value={o}>{o}</option>)}
											</select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="destino">Destino</Label>
											<select id="destino" name="destino" value={formData.destino} onChange={handleInputChange} className="w-full border p-2 rounded bg-white">
												{destinosFiltrados.map(d => <option key={d} value={d}>{d}</option>)}
											</select>
										</div>
									</div>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Duración (si origen o destino es Otro) */}
							{(formData.origen === OPCION_OTRO || formData.destino === OPCION_OTRO) && (
								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="duracionMinutos" className="text-base font-semibold text-orange-700">Duración Aproximada (minutos) *</Label>
									<Input id="duracionMinutos" name="duracionMinutos" type="number" value={formData.duracionMinutos} onChange={handleInputChange} placeholder="Ej: 90" min="15" max="300" required className="h-12 md:h-10 text-base border-orange-300" />
									<p className="text-xs text-gray-600"><strong>Obligatorio:</strong> Tiempo estimado de viaje para calcular oportunidades de retorno</p>
								</div>
							)}
							{/* Vehículo */}
							<div className="space-y-2">
								<Label htmlFor="vehiculo" className="text-base">Vehículo</Label>
								<select id="vehiculo" name="vehiculo" value={formData.vehiculo} onChange={handleInputChange} className="h-12 md:h-10 border rounded px-3 w-full text-base">
									<option value="">Seleccionar tipo...</option>
									<option value="sedan">Sedan</option>
									<option value="van">Van</option>
									<option value="minibus">Minibus</option>
								</select>
							</div>
							{/* Pasajeros */}
							<div className="space-y-2">
								<Label htmlFor="pasajeros" className="text-base">Pasajeros</Label>
								<Input id="pasajeros" name="pasajeros" type="number" value={formData.pasajeros} onChange={handleInputChange} min="1" max="15" className="h-12 md:h-10 text-base" />
							</div>
							{/* Tipo de viaje */}
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="idaVuelta">Tipo de viaje</Label>
								<div className="flex items-start gap-3 rounded border p-3">
									<input type="checkbox" id="idaVuelta" name="idaVuelta" checked={formData.idaVuelta} onChange={handleInputChange} className="mt-1 h-4 w-4" />
									<div>
										<p className="font-medium">Incluir viaje de regreso</p>
										<p className="text-sm text-gray-500">Los clientes seguirán el flujo completo e ingresarán la fecha y hora del regreso al usar el código.</p>
									</div>
								</div>
							</div>
							{/* Opciones de pago */}
							<div className="space-y-2 md:col-span-2">
								<Label>Opciones de Pago</Label>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-start gap-3 rounded border p-3">
										<input type="checkbox" id="permitirAbono" name="permitirAbono" checked={formData.permitirAbono} onChange={handleInputChange} className="mt-1 h-4 w-4" />
										<div>
											<p className="font-medium">Permitir abono del 40%</p>
											<p className="text-xs text-gray-500">Cliente puede pagar solo el 40% para reservar.</p>
										</div>
									</div>
									<div className="flex items-start gap-3 rounded border p-3 bg-blue-50 border-blue-100">
										<input type="checkbox" id="sillaInfantil" name="sillaInfantil" checked={formData.sillaInfantil} onChange={handleInputChange} className="mt-1 h-4 w-4" />
										<div>
											<p className="font-medium text-blue-900">Incluir Silla de Niño</p>
											<p className="text-xs text-blue-700">Se marcará en la reserva que requiere silla.</p>
										</div>
									</div>
								</div>
							</div>
							{/* Usos máximos */}
							<div className="space-y-2">
								<Label htmlFor="usosMaximos" className="text-base">Usos Máximos</Label>
								<Input id="usosMaximos" name="usosMaximos" type="number" value={formData.usosMaximos} onChange={handleInputChange} min="1" className="h-12 md:h-10 text-base" />
							</div>
							{/* Fecha de vencimiento */}
							<div className="space-y-2">
								<Label htmlFor="fechaVencimiento" className="text-base">Fecha de Vencimiento</Label>
								<div className="flex flex-wrap gap-2 mb-2">
									{[
										{ label: "15 min", mins: QUINCE_MINUTOS },
										{ label: "30 min", mins: TREINTA_MINUTOS },
										{ label: "1 hora", mins: UNA_HORA },
										{ label: "2 horas", mins: DOS_HORAS },
										{ label: "24 horas", mins: VEINTICUATRO_HORAS },
									].map(({ label, mins }) => (
										<Button key={label} type="button" variant="outline" size="sm" className="h-9 text-sm" onClick={() => setFormData((prev) => ({ ...prev, fechaVencimiento: obtenerFechaLocal(mins) }))}>
											{label}
										</Button>
									))}
								</div>
								<Input id="fechaVencimiento" name="fechaVencimiento" type="datetime-local" value={formData.fechaVencimiento} onChange={handleInputChange} className="h-12 md:h-10 text-base" />
							</div>
							{/* Descripción */}
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="descripcion" className="text-base">Motivo / Descripción</Label>
								<Input id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleInputChange} placeholder="Descripción del servicio..." className="h-12 md:h-10 text-base" />
							</div>
							{/* Observaciones */}
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="observaciones" className="text-base">Observaciones</Label>
								<Input id="observaciones" name="observaciones" value={formData.observaciones} onChange={handleInputChange} placeholder="Notas internas..." className="h-12 md:h-10 text-base" />
							</div>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="flex flex-col md:flex-row justify-end gap-3 pt-4">
							<Button variant="outline" onClick={() => setShowCrearDialog(false)} disabled={procesando} className="h-11 md:h-10">Cancelar</Button>
							<Button onClick={crearCodigo} disabled={procesando} className="h-11 md:h-10">
								{procesando ? <><LoaderCircle className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear Código"}
							</Button>
						</div>

						{/* Datos del Cliente */}
						<div className="space-y-2 pt-4 border-t">
							<Label className="text-sm md:text-base font-semibold">Datos del Cliente (Opcional - Pre-llenado)</Label>
							<p className="text-xs md:text-sm text-muted-foreground mb-3">Si completas estos campos, el cliente no tendrá que ingresarlos al usar el código</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="nombreCliente">Nombre Completo</Label>
									<Input id="nombreCliente" name="nombreCliente" value={formData.nombreCliente} onChange={handleInputChange} placeholder="Juan Pérez" className="h-12 md:h-10 text-base" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="emailCliente">Email</Label>
									<Input id="emailCliente" name="emailCliente" type="email" value={formData.emailCliente} onChange={handleInputChange} placeholder="cliente@email.cl" className="h-12 md:h-10 text-base" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="telefonoCliente">Teléfono</Label>
									<Input id="telefonoCliente" name="telefonoCliente" value={formData.telefonoCliente} onChange={handleInputChange} placeholder="+56 9 1234 5678" className="h-12 md:h-10 text-base" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="direccionCliente">Dirección Específica</Label>
									<Input id="direccionCliente" name="direccionCliente" value={formData.direccionCliente} onChange={handleInputChange} placeholder="Av. Alemania 1234, Temuco" className="h-12 md:h-10 text-base" />
								</div>
							</div>
						</div>

						{/* Vinculación con Reserva */}
						<div className="space-y-2 pt-4 border-t">
							<Label className="text-sm md:text-base font-semibold">Vinculación con Reserva (Opcional)</Label>
							<p className="text-xs md:text-sm text-muted-foreground mb-3">Si este código es para un pago adicional de una reserva existente</p>
							<div className="space-y-2">
								<Label htmlFor="codigoReservaVinculado">Código de Reserva Original</Label>
								<Input id="codigoReservaVinculado" name="codigoReservaVinculado" value={formData.codigoReservaVinculado} onChange={handleInputChange} placeholder="AR-20260107-0001" className="h-12 md:h-10 text-base" />
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── Dialog Editar ─────────────────────────────────────────────────── */}
			<Dialog open={!!codigoEditando} onOpenChange={(open) => { if (!open) setCodigoEditando(null); }}>
				<DialogContent className="w-[95vw] md:max-w-md">
					<DialogHeader>
						<DialogTitle>{codigoEditando?.estado === 'cancelado' ? `Reactivar código ${codigoEditando?.codigo}` : `Editar ${codigoEditando?.codigo}`}</DialogTitle>
						<DialogDescription>
							{codigoEditando?.estado === 'cancelado' 
								? "Para reactivar este código, ajusta su vencimiento a una fecha futura y pulsa Guardar."
								: "Modifica el monto, vencimiento, usos máximos u observaciones del código."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="edit-monto">Monto</Label>
							<Input id="edit-monto" type="number" value={formEdicion.monto} onChange={(e) => setFormEdicion((p) => ({ ...p, monto: e.target.value }))} min="0" className="h-10" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-usos">Usos Máximos</Label>
							<Input id="edit-usos" type="number" value={formEdicion.usosMaximos} onChange={(e) => setFormEdicion((p) => ({ ...p, usosMaximos: e.target.value }))} min="1" className="h-10" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-vencimiento">Fecha de Vencimiento</Label>
							<div className="flex flex-wrap gap-2 mb-2">
								{[
									{ label: "+1h", mins: UNA_HORA },
									{ label: "+2h", mins: DOS_HORAS },
									{ label: "+24h", mins: VEINTICUATRO_HORAS },
								].map(({ label, mins }) => (
									<Button key={label} type="button" variant="outline" size="sm" onClick={() => setFormEdicion((p) => ({ ...p, fechaVencimiento: obtenerFechaLocal(mins) }))}>
										{label}
									</Button>
								))}
							</div>
							<Input id="edit-vencimiento" type="datetime-local" value={formEdicion.fechaVencimiento} onChange={(e) => setFormEdicion((p) => ({ ...p, fechaVencimiento: e.target.value }))} className="h-10" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-obs">Observaciones</Label>
							<Input id="edit-obs" value={formEdicion.observaciones} onChange={(e) => setFormEdicion((p) => ({ ...p, observaciones: e.target.value }))} placeholder="Notas internas..." className="h-10" />
						</div>
					</div>
					<div className="flex justify-end gap-3 pt-2">
						<Button variant="outline" onClick={() => setCodigoEditando(null)} disabled={procesando}>Cancelar</Button>
						<Button onClick={guardarEdicion} disabled={procesando}>
							{procesando ? <><LoaderCircle className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : "Guardar"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── AlertDialog Eliminar ────────────────────────────────────────── */}
			<AlertDialog open={!!confirmEliminar} onOpenChange={(open) => { if (!open) setConfirmEliminar(null); }}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar código {confirmEliminar}?</AlertDialogTitle>
						<AlertDialogDescription>Esta acción no se puede deshacer. El código será eliminado permanentemente.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => eliminarCodigo(confirmEliminar)}>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ── AlertDialog Cancelar ────────────────────────────────────────── */}
			<AlertDialog open={!!confirmCancelar} onOpenChange={(open) => { if (!open) setConfirmCancelar(null); }}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Cancelar código {confirmCancelar}?</AlertDialogTitle>
						<AlertDialogDescription>El código quedará marcado como cancelado y no podrá ser usado (pero el registro se conserva).</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>No, mantener</AlertDialogCancel>
						<AlertDialogAction className="bg-orange-600 hover:bg-orange-700" onClick={() => cancelarCodigo(confirmCancelar)}>
							Sí, cancelar código
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default AdminCodigosPago;
