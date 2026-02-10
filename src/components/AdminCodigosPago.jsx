import React, { useEffect, useMemo, useState } from "react";
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
import { Alert, AlertDescription } from "./ui/alert";
import { LoaderCircle, Plus, Trash2, Copy, MessageCircle, MapPin, DollarSign, Clock } from "lucide-react";
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
	// Validar que el parámetro sea un número positivo
	// Se usa Math.max(0, ...) para convertir valores negativos a 0 de forma segura,
	// evitando fechas en el pasado que no tienen sentido para vencimientos
	const minutos = Math.max(0, Number(minutosAdelante) || 0);
	
	const fecha = new Date();
	// Usar setTime para manejar correctamente los cruces de día/mes/año
	fecha.setTime(fecha.getTime() + minutos * 60 * 1000);
	
	// Formatear manualmente sin conversión UTC
	const año = fecha.getFullYear();
	const mes = String(fecha.getMonth() + 1).padStart(2, '0');
	const dia = String(fecha.getDate()).padStart(2, '0');
	const horas = String(fecha.getHours()).padStart(2, '0');
	const minutosStr = String(fecha.getMinutes()).padStart(2, '0');
	
	return `${año}-${mes}-${dia}T${horas}:${minutosStr}`;
};

function AdminCodigosPago() {
	// Hook para detectar si es móvil (< 768px)
	const isMobile = useMediaQuery('(max-width: 767px)');
	
	const [codigosPago, setCodigosPago] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showCrearDialog, setShowCrearDialog] = useState(false);
	const [procesando, setProcesando] = useState(false);
	const [formData, setFormData] = useState({
		origen: "Aeropuerto La Araucanía",
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
		// Duración personalizada para destinos "Otro"
		duracionMinutos: "",
		// Datos del cliente (opcional - pre-llenado)
		nombreCliente: "",
		emailCliente: "",
		telefonoCliente: "",
		direccionCliente: "",
		codigoReservaVinculado: "",
		reservaVinculadaId: null,
	});
	const backendUrl = getBackendUrl();
	const { authenticatedFetch } = useAuthenticatedFetch();
	const [destinosOpciones, setDestinosOpciones] = useState(
		destinosBase.map((d) => d.nombre)
	);

	// Carga dinámica de destinos desde el backend (misma lógica del Hero)
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
		return () => {
			cancelado = true;
		};
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
					console.log("📍 Reserva vinculada encontrada:", r);
					setFormData(prev => ({
						...prev,
						nombreCliente: r.nombre || prev.nombreCliente || "",
						emailCliente: r.email || prev.emailCliente || "",
						telefonoCliente: r.telefono || prev.telefonoCliente || "",
						// Guardar el ID real para el backend
						reservaVinculadaId: r.id || prev.reservaVinculadaId,
						// Auto-completar origen, destino, pasajeros y vehículo
						origen: r.origen || prev.origen || "",
						destino: r.destino || prev.destino || "",
						pasajeros: r.pasajeros || prev.pasajeros || 1,
						vehiculo: r.vehiculo || prev.vehiculo || "",
						// Lógica inteligente de dirección:
						// Si el origen es aeropuerto, la dirección relevante es el destino.
						// Si el destino es aeropuerto, la dirección relevante es el origen.
						direccionCliente: (r.origen || "").includes("Aeropuerto") 
							? (r.direccionDestino || prev.direccionCliente || "")
							: (r.direccionOrigen || prev.direccionCliente || "")
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
		() => ["Aeropuerto La Araucanía", ...destinosOpciones, "Otro"],
		[destinosOpciones]
	);
	const destinos = useMemo(
		// Evitar que destino repita el origen seleccionado
		() => ["Aeropuerto La Araucanía", ...destinosOpciones, "Otro"],
		[destinosOpciones]
	);
	const destinosFiltrados = useMemo(() => {
		return destinos.filter(
			(d) => d === "Aeropuerto La Araucanía" || d !== formData.origen
		);
	}, [destinos, formData.origen]);
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
	
	// Calcular tiempo restante hasta el vencimiento
	const calcularTiempoRestante = (fechaVencimiento) => {
		if (!fechaVencimiento) return null;
		
		const ahora = new Date();
		const vencimiento = new Date(fechaVencimiento);
		const diff = vencimiento - ahora;
		
		if (diff <= 0) return { vencido: true, texto: 'Vencido', clase: 'text-red-600 font-bold' };
		
		const minutos = Math.floor(diff / 60000);
		const horas = Math.floor(minutos / 60);
		const dias = Math.floor(horas / 24);
		
		if (dias > 0) {
			return { 
				vencido: false, 
				texto: `${dias}d ${horas % 24}h`, 
				urgente: false,
				clase: 'text-green-600'
			};
		}
		if (horas > 0) {
			const urgente = horas < 2;
			return { 
				vencido: false, 
				texto: `${horas}h ${minutos % 60}m`, 
				urgente,
				clase: urgente ? 'text-orange-600 font-semibold' : 'text-green-600'
			};
		}
		return { 
			vencido: false, 
			texto: `${minutos}m`, 
			urgente: true,
			clase: 'text-red-600 font-bold animate-pulse'
		};
	};
	const cargarCodigos = async () => {
		setLoading(true);
		setError("");
		try {
			const response = await authenticatedFetch(`/api/codigos-pago`, {
				method: "GET",
			});
			const data = await response.json();
			if (!response.ok) {
				setError(data.message || "Error al cargar códigos");
				return;
			}
			setCodigosPago(data.codigosPago || []);
		} catch (e) {
			setError("Error al conectar con el servidor");
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		cargarCodigos();
		
		// Actualizar cada minuto para refrescar los tiempos restantes
		const intervalo = setInterval(() => {
			// Forzar re-render actualizando el timestamp
			setCodigosPago(prev => [...prev]);
		}, 60000); // 60 segundos
		
		return () => clearInterval(intervalo);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	// Maneja cambios en los campos del formulario, sincronizando origen/destino para todos los destinos
	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		let nuevoForm = { ...formData };
		if (name === "origen") {
			nuevoForm.origen = type === "checkbox" ? checked : value;
			// Si el origen es Aeropuerto, destino se fuerza a cualquier destino distinto de Aeropuerto
			if (value === "Aeropuerto La Araucanía") {
				nuevoForm.destino = "";
			} else {
				// Si el origen es cualquier destino, destino se fuerza a Aeropuerto
				nuevoForm.destino = "Aeropuerto La Araucanía";
			}
		} else if (name === "destino") {
			nuevoForm.destino = type === "checkbox" ? checked : value;
			// Si el destino es Aeropuerto, origen se fuerza a cualquier destino distinto de Aeropuerto
			if (value === "Aeropuerto La Araucanía") {
				nuevoForm.origen = "";
			} else {
				// Si el destino es cualquier destino, origen se fuerza a Aeropuerto
				nuevoForm.origen = "Aeropuerto La Araucanía";
			}
		} else {
			nuevoForm[name] = type === "checkbox" ? checked : value;
		}
		setFormData(nuevoForm);
	};

	// Efecto para establecer fecha de vencimiento por defecto al abrir el modal
	useEffect(() => {
		if (showCrearDialog && !formData.fechaVencimiento) {
			const fechaStr = obtenerFechaLocal(VEINTICUATRO_HORAS); // 24 horas por defecto
			setFormData((prev) => ({ ...prev, fechaVencimiento: fechaStr }));
		}
	}, [showCrearDialog, formData.fechaVencimiento]);

	const generarCodigoLocal = () => {
		const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/1/O/I
		const rand = Array.from(
			{ length: 6 },
			() => alphabet[Math.floor(Math.random() * alphabet.length)]
		).join("");
		return `PX-${rand}`;
	};

	const generarMensaje = (codigo) => {
		const urlPago = `https://www.transportesaraucaria.cl/#pagar-con-codigo`;
		let mensaje = `Hola, aquí tienes tu código de pago:\n\n${codigo.codigo}\n\nPuedes realizar el pago en el siguiente enlace:\n${urlPago}\n\nDetalles:\nOrigen: ${codigo.origen}\nDestino: ${codigo.destino}\nMonto: ${formatCurrency(codigo.monto)}`;
		
		// Agregar fecha de vencimiento si existe
		if (codigo.fechaVencimiento) {
			const fechaVenc = formatDate(codigo.fechaVencimiento);
			mensaje += `\n\n⏰ Válido hasta: ${fechaVenc}`;
		}
		
		return mensaje;
	};

	const copiarAlPortapapeles = (codigo) => {
		// Si recibimos el objeto completo, generamos el mensaje. Si es solo string (legacy), lo usamos directo.
		const texto = typeof codigo === "object" ? generarMensaje(codigo) : codigo;
		
		navigator.clipboard.writeText(texto).then(() => {
			// Idealmente mostrar un toast aquí
			alert("Copiado al portapapeles:\n\n" + texto);
		});
	};

	const enviarPorWhatsApp = (codigo) => {
		const mensaje = generarMensaje(codigo);
		const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
		window.open(url, "_blank");
	};
	const crearCodigo = async () => {
		// Validaciones mínimas
		const origenResuelto =
			formData.origen === "Otro"
				? (formData.otroOrigen || "").trim()
				: formData.origen;
		const destinoResuelto =
			formData.destino === "Otro"
				? (formData.otroDestino || "").trim()
				: formData.destino;
		if (!destinoResuelto) {
			setError("El destino es requerido");
			return;
		}
		// Validación: no permitir origen y destino iguales
		if (origenResuelto === destinoResuelto) {
			setError("No se permite un viaje con origen y destino iguales");
			return;
		}
		// Validación: duración obligatoria si origen O destino es "Otro"
		if ((formData.origen === "Otro" || formData.destino === "Otro") && (!formData.duracionMinutos || parseInt(formData.duracionMinutos) < 15)) {
			setError("La duración aproximada es obligatoria cuando el origen o destino es 'Otro' (mínimo 15 minutos)");
			return;
		}
		if (!formData.monto || parseFloat(formData.monto) <= 0) {
			setError("El monto debe ser mayor a 0");
			return;
		}
		setProcesando(true);
		setError("");
		try {
			const payload = {
				codigo: generarCodigoLocal(),
				origen: origenResuelto,
				destino: destinoResuelto,
				monto: parseFloat(formData.monto),
				descripcion: formData.descripcion || "",
				vehiculo: formData.vehiculo || "",
				pasajeros: parseInt(formData.pasajeros) || 1,
				idaVuelta: Boolean(formData.idaVuelta),
				permitirAbono: Boolean(formData.permitirAbono),
				sillaInfantil: Boolean(formData.sillaInfantil),
				fechaVencimiento: formData.fechaVencimiento
					? new Date(formData.fechaVencimiento).toISOString()
					: undefined,
				usosMaximos: parseInt(formData.usosMaximos) || 1,
				observaciones: formData.observaciones || "",
				// Duración personalizada (solo si origen O destino es "Otro")
				duracionMinutos: (formData.origen === "Otro" || formData.destino === "Otro") 
					? parseInt(formData.duracionMinutos) 
					: null,
				// Datos del cliente (opcionales)
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
			setFormData({
				origen: "Aeropuerto La Araucanía",
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
				// Resetear datos del cliente
				nombreCliente: "",
				emailCliente: "",
				telefonoCliente: "",
				direccionCliente: "",
				codigoReservaVinculado: "",
				reservaVinculadaId: null,
			});
			setShowCrearDialog(false);
			cargarCodigos();
		} catch {
			setError("Error al conectar con el servidor");
		} finally {
			setProcesando(false);
		}
	};
	const eliminarCodigo = async (codigo) => {
		if (!confirm(`¿Estás seguro de eliminar el código ${codigo}?`)) return;
		try {
			const response = await authenticatedFetch(`/api/codigos-pago/${codigo}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				const data = await response.json();
				setError(data.message || "Error al eliminar código");
				return;
			}
			cargarCodigos();
		} catch {
			setError("Error al conectar con el servidor");
		}
	};
	const getEstadoBadge = (estado) => {
		const badges = {
			activo: <Badge className="bg-green-500">Activo</Badge>,
			usado: <Badge variant="secondary">Usado</Badge>,
			vencido: <Badge variant="destructive">Vencido</Badge>,
			cancelado: <Badge variant="outline">Cancelado</Badge>,
		};
		return badges[estado] || <Badge>{estado}</Badge>;
	};
	return (
		<div className="container mx-auto py-8 px-4">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Códigos de Pago</h1>
					<p className="text-gray-600">
						Genera códigos para enviar por WhatsApp
					</p>
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
						<div className="text-center py-8 text-gray-500">
							No hay códigos registrados
						</div>
					) : isMobile ? (
						// Vista de tarjetas para móvil
						<div className="space-y-3">
							{codigosPago.map((c) => {
								const tiempo = c.fechaVencimiento ? calcularTiempoRestante(c.fechaVencimiento) : null;
								return (
									<div key={c.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
										{/* Header: Código y Estado */}
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<div className="font-mono font-bold text-lg truncate">{c.codigo}</div>
												<div className="flex items-center gap-2 mt-1 flex-wrap">
													{getEstadoBadge(c.estado)}
													{c.idaVuelta ? (
														<Badge className="bg-purple-600 text-white text-xs">
															Ida y vuelta
														</Badge>
													) : (
														<Badge variant="outline" className="text-xs">Solo ida</Badge>
													)}
												</div>
											</div>
										</div>

										{/* Botones de acción táctiles */}
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												className="flex-1 h-11"
												onClick={() => copiarAlPortapapeles(c)}
											>
												<Copy className="h-5 w-5 mr-2" />
												Copiar
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="flex-1 h-11"
												onClick={() => enviarPorWhatsApp(c)}
											>
												<MessageCircle className="h-5 w-5 mr-2" />
												WhatsApp
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="h-11 w-11 p-0"
												onClick={() => eliminarCodigo(c.codigo)}
												disabled={c.estado === "usado"}
											>
												<Trash2 className="h-5 w-5 text-red-500" />
											</Button>
										</div>

										{/* Ruta con íconos */}
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

										{/* Monto destacado */}
										<div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
											<DollarSign className="h-5 w-5 text-green-600" />
											<span className="text-xl font-bold text-green-700">
												{formatCurrency(c.monto)}
											</span>
										</div>

										{/* Usos y vencimiento */}
										<div className="grid grid-cols-2 gap-3 text-sm">
											<div className="bg-gray-50 p-2 rounded">
												<div className="text-gray-500 text-xs">Usos</div>
												<div className="font-semibold">
													{c.usosActuales} / {c.usosMaximos}
												</div>
											</div>
											<div className="bg-gray-50 p-2 rounded">
												<div className="text-gray-500 text-xs flex items-center gap-1">
													<Clock className="h-3 w-3" />
													Vencimiento
												</div>
												{c.fechaVencimiento ? (
													<div>
														<div className="text-xs text-gray-600">
															{formatDate(c.fechaVencimiento)}
														</div>
														{tiempo && (
															<div className={`font-semibold text-sm ${tiempo.clase}`}>
																{tiempo.urgente && !tiempo.vencido && '⏰ '}
																{tiempo.vencido && '❌ '}
																{tiempo.texto}
															</div>
														)}
													</div>
												) : (
													<span className="text-xs text-gray-400">Sin límite</span>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						// Vista de tabla para desktop
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Código</TableHead>
										<TableHead>Ruta</TableHead>
										<TableHead>Monto</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead>Usos</TableHead>
										<TableHead>Vence</TableHead>
										<TableHead>Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{codigosPago.map((c) => (
										<TableRow key={c.id}>
											<TableCell className="font-mono font-bold">
												{c.codigo}
											</TableCell>
											<TableCell>
												<div className="text-sm">
													<div>{c.origen}</div>
													<div className="text-gray-500">↓</div>
													<div>{c.destino}</div>
												</div>
											</TableCell>
											<TableCell>{formatCurrency(c.monto)}</TableCell>
											<TableCell>
												{c.idaVuelta ? (
													<Badge className="bg-purple-600 text-white">
														Ida y vuelta
													</Badge>
												) : (
													<Badge variant="outline">Solo ida</Badge>
												)}
											</TableCell>
											<TableCell>{getEstadoBadge(c.estado)}</TableCell>
											<TableCell>
												{c.usosActuales} / {c.usosMaximos}
											</TableCell>
											<TableCell className="text-sm">
												{c.fechaVencimiento ? (
													<div className="space-y-1">
														<div className="text-xs text-gray-500">
															{formatDate(c.fechaVencimiento)}
														</div>
														{(() => {
															const tiempo = calcularTiempoRestante(c.fechaVencimiento);
															if (!tiempo) return null;
															return (
																<div className={`font-medium ${tiempo.clase}`}>
																	{tiempo.urgente && !tiempo.vencido && '⏰ '}
																	{tiempo.vencido && '❌ '}
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
												<div className="flex gap-1">
													<Button
														variant="ghost"
														size="sm"
														title="Copiar Código"
														onClick={() => copiarAlPortapapeles(c)}
													>
														<Copy className="h-4 w-4 text-blue-500" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														title="Enviar por WhatsApp"
														onClick={() => enviarPorWhatsApp(c)}
													>
														<MessageCircle className="h-4 w-4 text-green-500" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => eliminarCodigo(c.codigo)}
														disabled={c.estado === "usado"}
													>
														<Trash2 className="h-4 w-4 text-red-500" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
			<Dialog open={showCrearDialog} onOpenChange={setShowCrearDialog}>
				<DialogContent className="w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-base md:text-lg">Crear Nuevo Código de Pago</DialogTitle>
						<DialogDescription className="text-sm">
							Completa origen, destino y monto. El código se generará
							automáticamente.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="monto" className="text-base">Monto</Label>
								<Input
									id="monto"
									name="monto"
									type="number"
									value={formData.monto}
									onChange={handleInputChange}
									placeholder="35000"
									min="0"
									step="1"
									required
									className="h-12 md:h-10 text-base"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="origen" className="text-base">Origen</Label>
								<select
									id="origen"
									name="origen"
									value={formData.origen}
									onChange={handleInputChange}
									className="h-12 md:h-10 border rounded px-3 w-full text-base"
								>
									{origenes.map((o) => (
										<option key={o} value={o}>
											{o}
										</option>
									))}
								</select>
								{formData.origen === "Otro" && (
									<Input
										id="otroOrigen"
										name="otroOrigen"
										value={formData.otroOrigen}
										onChange={handleInputChange}
										placeholder="Especifica el origen"
										className="h-12 md:h-10 text-base"
									/>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="destino" className="text-base">Destino</Label>
								<select
									id="destino"
									name="destino"
									value={formData.destino}
									onChange={handleInputChange}
									className="h-12 md:h-10 border rounded px-3 w-full text-base"
								>
									{destinosFiltrados.map((d) => (
										<option key={d} value={d}>
											{d}
										</option>
									))}
								</select>
								{formData.destino === "Otro" && (
									<Input
										id="otroDestino"
										name="otroDestino"
										value={formData.otroDestino}
										onChange={handleInputChange}
										placeholder="Especifica el destino"
										className="h-12 md:h-10 text-base"
									/>
								)}
							</div>
							{/* Campo de duración si origen O destino es "Otro" */}
							{(formData.origen === "Otro" || formData.destino === "Otro") && (
								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="duracionMinutos" className="text-base font-semibold text-orange-700">
										Duración Aproximada (minutos) *
									</Label>
									<Input
										id="duracionMinutos"
										name="duracionMinutos"
										type="number"
										value={formData.duracionMinutos}
										onChange={handleInputChange}
										placeholder="Ej: 90"
										min="15"
										max="300"
										required
										className="h-12 md:h-10 text-base border-orange-300 focus:border-orange-500"
									/>
									<p className="text-xs text-gray-600">
										<strong>Obligatorio:</strong> Tiempo estimado de viaje para calcular oportunidades de retorno
									</p>
								</div>
							)}
							<div className="space-y-2">
								<Label htmlFor="vehiculo" className="text-base">Vehículo (opcional)</Label>
								<Input
									id="vehiculo"
									name="vehiculo"
									value={formData.vehiculo}
									onChange={handleInputChange}
									placeholder="Sedan, Van, etc."
									className="h-12 md:h-10 text-base"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="pasajeros" className="text-base">Pasajeros</Label>
								<Input
									id="pasajeros"
									name="pasajeros"
									type="number"
									value={formData.pasajeros}
									onChange={handleInputChange}
									min="1"
									max="15"
									className="h-12 md:h-10 text-base"
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="idaVuelta">Tipo de viaje</Label>
								<div className="flex items-start gap-3 rounded border p-3">
									<input
										type="checkbox"
										id="idaVuelta"
										name="idaVuelta"
										checked={formData.idaVuelta}
										onChange={handleInputChange}
										className="mt-1 h-4 w-4"
									/>
									<div>
										<p className="font-medium">Incluir viaje de regreso</p>
										<p className="text-sm text-gray-500">
											Los clientes seguiran el flujo completo de reservas e
											ingresaran la fecha y hora del regreso al usar el codigo.
										</p>
									</div>
								</div>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="permitirAbono">Opciones de Pago</Label>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-start gap-3 rounded border p-3">
										<input
											type="checkbox"
											id="permitirAbono"
											name="permitirAbono"
											checked={formData.permitirAbono}
											onChange={handleInputChange}
											className="mt-1 h-4 w-4"
										/>
										<div>
											<p className="font-medium">Permitir abono del 40%</p>
											<p className="text-xs text-gray-500">
												Cliente puede pagar solo el 40% para reservar.
											</p>
										</div>
									</div>
									<div className="flex items-start gap-3 rounded border p-3 bg-blue-50 border-blue-100">
										<input
											type="checkbox"
											id="sillaInfantil"
											name="sillaInfantil"
											checked={formData.sillaInfantil}
											onChange={handleInputChange}
											className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
										/>
										<div>
											<p className="font-medium text-blue-900">Incluir Silla de Niño</p>
											<p className="text-xs text-blue-700">
												Se marcará en la reserva que requiere silla.
											</p>
										</div>
									</div>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="usosMaximos" className="text-base">Usos Máximos</Label>
								<Input
									id="usosMaximos"
									name="usosMaximos"
									type="number"
									value={formData.usosMaximos}
									onChange={handleInputChange}
									min="1"
									className="h-12 md:h-10 text-base"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="fechaVencimiento" className="text-base">Fecha de Vencimiento</Label>
								<div className="flex flex-col md:flex-row md:flex-wrap gap-2 mb-2">
									<Button 
										type="button" 
										variant="outline" 
										size="sm" 
										className="h-11 md:h-9 text-base md:text-sm"
										onClick={() => {
											setFormData(prev => ({ 
												...prev, 
												fechaVencimiento: obtenerFechaLocal(QUINCE_MINUTOS) 
											}));
										}}
									>
										15 min
									</Button>
									<Button 
										type="button" 
										variant="outline" 
										size="sm" 
										className="h-11 md:h-9 text-base md:text-sm"
										onClick={() => {
											setFormData(prev => ({ 
												...prev, 
												fechaVencimiento: obtenerFechaLocal(TREINTA_MINUTOS) 
											}));
										}}
									>
										30 min
									</Button>
									<Button 
										type="button" 
										variant="outline" 
										size="sm" 
										className="h-11 md:h-9 text-base md:text-sm"
										onClick={() => {
											setFormData(prev => ({ 
												...prev, 
												fechaVencimiento: obtenerFechaLocal(UNA_HORA) 
											}));
										}}
									>
										1 hora
									</Button>
									<Button 
										type="button" 
										variant="outline" 
										size="sm" 
										className="h-11 md:h-9 text-base md:text-sm"
										onClick={() => {
											setFormData(prev => ({ 
												...prev, 
												fechaVencimiento: obtenerFechaLocal(DOS_HORAS) 
											}));
										}}
									>
										2 horas
									</Button>
									<Button 
										type="button" 
										variant="outline" 
										size="sm" 
										className="h-11 md:h-9 text-base md:text-sm"
										onClick={() => {
											setFormData(prev => ({ 
												...prev, 
												fechaVencimiento: obtenerFechaLocal(VEINTICUATRO_HORAS) 
											}));
										}}
									>
										24 horas
									</Button>
								</div>
								<Input
									id="fechaVencimiento"
									name="fechaVencimiento"
									type="datetime-local"
									value={formData.fechaVencimiento}
									onChange={handleInputChange}
									className="h-12 md:h-10 text-base"
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="descripcion" className="text-base">Motivo / Descripción</Label>
								<Input
									id="descripcion"
									name="descripcion"
									value={formData.descripcion}
									onChange={handleInputChange}
									placeholder="Descripción del servicio..."
									className="h-12 md:h-10 text-base"
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="observaciones" className="text-base">Observaciones</Label>
								<Input
									id="observaciones"
									name="observaciones"
									value={formData.observaciones}
									onChange={handleInputChange}
									placeholder="Notas internas..."
									className="h-12 md:h-10 text-base"
								/>
							</div>
						</div>
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<div className="flex flex-col md:flex-row justify-end gap-3 pt-4">
							<Button
								variant="outline"
								onClick={() => setShowCrearDialog(false)}
								disabled={procesando}
								className="h-11 md:h-10 text-base"
							>
								Cancelar
							</Button>
							<Button onClick={crearCodigo} disabled={procesando} className="h-11 md:h-10 text-base">
								{procesando ? (
									<>
										<LoaderCircle className="h-5 w-5 md:h-4 md:w-4 mr-2 animate-spin" />
										Creando...
									</>
								) : (
									"Crear Código"
								)}
							</Button>
						</div>

						{/* Sección de Datos del Cliente (Opcional) */}
						<div className="space-y-2 md:col-span-2 pt-4 border-t">
							<Label className="text-sm md:text-base font-semibold text-foreground">
								Datos del Cliente (Opcional - Pre-llenado)
							</Label>
							<p className="text-xs md:text-sm text-muted-foreground mb-3">
								Si completas estos campos, el cliente no tendrá que ingresarlos al usar el código
							</p>
							
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Nombre */}
								<div className="space-y-2">
									<Label htmlFor="nombreCliente" className="text-base">Nombre Completo</Label>
									<Input
										id="nombreCliente"
										name="nombreCliente"
										value={formData.nombreCliente}
										onChange={handleInputChange}
										placeholder="Juan Pérez"
										className="h-12 md:h-10 text-base"
									/>
								</div>
								
								{/* Email */}
								<div className="space-y-2">
									<Label htmlFor="emailCliente" className="text-base">Email</Label>
									<Input
										id="emailCliente"
										name="emailCliente"
										type="email"
										value={formData.emailCliente}
										onChange={handleInputChange}
										placeholder="cliente@email.cl"
										className="h-12 md:h-10 text-base"
									/>
								</div>
								
								{/* Teléfono */}
								<div className="space-y-2">
									<Label htmlFor="telefonoCliente" className="text-base">Teléfono</Label>
									<Input
										id="telefonoCliente"
										name="telefonoCliente"
										value={formData.telefonoCliente}
										onChange={handleInputChange}
										placeholder="+56 9 1234 5678"
										className="h-12 md:h-10 text-base"
									/>
								</div>
								
								{/* Dirección */}
								<div className="space-y-2">
									<Label htmlFor="direccionCliente" className="text-base">Dirección Específica</Label>
									<Input
										id="direccionCliente"
										name="direccionCliente"
										value={formData.direccionCliente}
										onChange={handleInputChange}
										placeholder="Av. Alemania 1234, Temuco"
										className="h-12 md:h-10 text-base"
									/>
								</div>
							</div>
						</div>

						{/* Vinculación con Reserva Existente (Opcional) */}
						<div className="space-y-2 md:col-span-2 pt-4 border-t">
							<Label className="text-sm md:text-base font-semibold text-foreground">
								Vinculación con Reserva (Opcional)
							</Label>
							<p className="text-xs md:text-sm text-muted-foreground mb-3">
								Si este código es para un pago adicional de una reserva existente
							</p>
							
							<div className="space-y-2">
								<Label htmlFor="codigoReservaVinculado" className="text-base">Código de Reserva Original</Label>
								<Input
									id="codigoReservaVinculado"
									name="codigoReservaVinculado"
									value={formData.codigoReservaVinculado}
									onChange={handleInputChange}
									placeholder="AR-20260107-0001"
									className="h-12 md:h-10 text-base"
								/>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminCodigosPago;
