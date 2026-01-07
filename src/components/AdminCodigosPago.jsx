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
import { LoaderCircle, Plus, Trash2, Copy, MessageCircle } from "lucide-react";
import { destinosBase } from "../data/destinos";
import { getBackendUrl } from "../lib/backend";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";

const AEROPUERTO = "Aeropuerto La Araucanía";
const OPCION_OTRO = "Otro";
const DESTINO_BASE_POR_DEFECTO = destinosBase[0]?.nombre || "";

function AdminCodigosPago() {
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
		// Datos del cliente (opcional - pre-llenado)
		nombreCliente: "",
		emailCliente: "",
		telefonoCliente: "",
		direccionCliente: "",
		codigoReservaVinculado: "",
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
						nombreCliente: r.nombre || prev.nombreCliente,
						emailCliente: r.email || prev.emailCliente,
						telefonoCliente: r.telefono || prev.telefonoCliente,
						// Guardar el ID real para el backend
						reservaVinculadaId: r.id || prev.reservaVinculadaId,
						// Lógica inteligente de dirección:
						// Si el origen es aeropuerto, la dirección relevante es el destino.
						// Si el destino es aeropuerto, la dirección relevante es el origen.
						direccionCliente: (r.origen || "").includes("Aeropuerto") 
							? r.direccionDestino 
							: r.direccionOrigen
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
			// Por defecto 24 horas desde ahora
			const manana = new Date();
			manana.setHours(manana.getHours() + 24);
			// Formato requerido para input datetime-local: YYYY-MM-DDTHH:mm
			const fechaStr = manana.toISOString().slice(0, 16);
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
		return `Hola, aquí tienes tu código de pago:\n\n${codigo.codigo}\n\nPuedes realizar el pago en el siguiente enlace:\n${urlPago}\n\nDetalles:\nOrigen: ${codigo.origen}\nDestino: ${codigo.destino}\nMonto: ${formatCurrency(codigo.monto)}`;
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
				fechaVencimiento: formData.fechaVencimiento || undefined,
				usosMaximos: parseInt(formData.usosMaximos) || 1,
				observaciones: formData.observaciones || "",
				// Datos del cliente (opcionales)
				nombreCliente: formData.nombreCliente.trim() || null,
				emailCliente: formData.emailCliente.trim() || null,
				telefonoCliente: formData.telefonoCliente.trim() || null,
				direccionCliente: formData.direccionCliente.trim() || null,
				codigoReservaVinculado: formData.codigoReservaVinculado.trim() || null,
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
				// Resetear datos del cliente
				nombreCliente: "",
				emailCliente: "",
				telefonoCliente: "",
				direccionCliente: "",
				codigoReservaVinculado: "",
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
					) : (
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
												{formatDate(c.fechaVencimiento)}
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
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Crear Nuevo Código de Pago</DialogTitle>
						<DialogDescription>
							Completa origen, destino y monto. El código se generará
							automáticamente.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="monto">Monto</Label>
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
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="origen">Origen</Label>
								<select
									id="origen"
									name="origen"
									value={formData.origen}
									onChange={handleInputChange}
									className="h-10 border rounded px-3"
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
									/>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="destino">Destino</Label>
								<select
									id="destino"
									name="destino"
									value={formData.destino}
									onChange={handleInputChange}
									className="h-10 border rounded px-3"
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
									/>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="vehiculo">Vehículo (opcional)</Label>
								<Input
									id="vehiculo"
									name="vehiculo"
									value={formData.vehiculo}
									onChange={handleInputChange}
									placeholder="Sedan, Van, etc."
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="pasajeros">Pasajeros</Label>
								<Input
									id="pasajeros"
									name="pasajeros"
									type="number"
									value={formData.pasajeros}
									onChange={handleInputChange}
									min="1"
									max="15"
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
								<Label htmlFor="usosMaximos">Usos Máximos</Label>
								<Input
									id="usosMaximos"
									name="usosMaximos"
									type="number"
									value={formData.usosMaximos}
									onChange={handleInputChange}
									min="1"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
								<Input
									id="fechaVencimiento"
									name="fechaVencimiento"
									type="datetime-local"
									value={formData.fechaVencimiento}
									onChange={handleInputChange}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="descripcion">Descripción</Label>
								<Input
									id="descripcion"
									name="descripcion"
									value={formData.descripcion}
									onChange={handleInputChange}
									placeholder="Descripción del servicio..."
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="observaciones">Observaciones</Label>
								<Input
									id="observaciones"
									name="observaciones"
									value={formData.observaciones}
									onChange={handleInputChange}
									placeholder="Notas internas..."
								/>
							</div>
						</div>
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<div className="flex justify-end gap-3 pt-4">
							<Button
								variant="outline"
								onClick={() => setShowCrearDialog(false)}
								disabled={procesando}
							>
								Cancelar
							</Button>
							<Button onClick={crearCodigo} disabled={procesando}>
								{procesando ? (
									<>
										<LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
										Creando...
									</>
								) : (
									"Crear Código"
								)}
							</Button>
						</div>

						{/* Sección de Datos del Cliente (Opcional) */}
						<div className="space-y-2 md:col-span-2 pt-4 border-t">
							<Label className="text-sm font-semibold text-foreground">
								Datos del Cliente (Opcional - Pre-llenado)
							</Label>
							<p className="text-xs text-muted-foreground mb-3">
								Si completas estos campos, el cliente no tendrá que ingresarlos al usar el código
							</p>
							
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Nombre */}
								<div className="space-y-2">
									<Label htmlFor="nombreCliente">Nombre Completo</Label>
									<Input
										id="nombreCliente"
										name="nombreCliente"
										value={formData.nombreCliente}
										onChange={handleInputChange}
										placeholder="Juan Pérez"
									/>
								</div>
								
								{/* Email */}
								<div className="space-y-2">
									<Label htmlFor="emailCliente">Email</Label>
									<Input
										id="emailCliente"
										name="emailCliente"
										type="email"
										value={formData.emailCliente}
										onChange={handleInputChange}
										placeholder="cliente@email.cl"
									/>
								</div>
								
								{/* Teléfono */}
								<div className="space-y-2">
									<Label htmlFor="telefonoCliente">Teléfono</Label>
									<Input
										id="telefonoCliente"
										name="telefonoCliente"
										value={formData.telefonoCliente}
										onChange={handleInputChange}
										placeholder="+56 9 1234 5678"
									/>
								</div>
								
								{/* Dirección */}
								<div className="space-y-2">
									<Label htmlFor="direccionCliente">Dirección Específica</Label>
									<Input
										id="direccionCliente"
										name="direccionCliente"
										value={formData.direccionCliente}
										onChange={handleInputChange}
										placeholder="Av. Alemania 1234, Temuco"
									/>
								</div>
							</div>
						</div>

						{/* Vinculación con Reserva Existente (Opcional) */}
						<div className="space-y-2 md:col-span-2 pt-4 border-t">
							<Label className="text-sm font-semibold text-foreground">
								Vinculación con Reserva (Opcional)
							</Label>
							<p className="text-xs text-muted-foreground mb-3">
								Si este código es para un pago adicional de una reserva existente
							</p>
							
							<div className="space-y-2">
								<Label htmlFor="codigoReservaVinculado">Código de Reserva Original</Label>
								<Input
									id="codigoReservaVinculado"
									name="codigoReservaVinculado"
									value={formData.codigoReservaVinculado}
									onChange={handleInputChange}
									placeholder="AR-20260107-0001"
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
