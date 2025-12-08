import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import {
	ChevronLeft,
	ChevronRight,
	Check,
	User,
	MapPin,
	Calendar,
	CheckCircle,
} from "lucide-react";
import { getBackendUrl } from "../../lib/backend";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Wizard de Creación de Reserva en 3 Pasos
 * 
 * Paso 1: Información del Cliente y Ruta
 * Paso 2: Detalles del Viaje y Servicios
 * Paso 3: Confirmación y Resumen
 */
function WizardReserva({ isOpen, onClose, onSuccess }) {
	const { accessToken } = useAuth();
	const [pasoActual, setPasoActual] = useState(1);
	const [creando, setCreando] = useState(false);
	const [errores, setErrores] = useState({});

	const [formData, setFormData] = useState({
		// Paso 1: Cliente y Ruta
		nombre: "",
		rut: "",
		email: "",
		telefono: "",
		origen: "",
		destino: "",
		fecha: "",
		hora: "08:00",
		pasajeros: 1,

		// Paso 2: Detalles
		idaVuelta: false,
		fechaRegreso: "",
		horaRegreso: "08:00",
		numeroVuelo: "",
		hotel: "",
		equipajeEspecial: "",
		sillaInfantil: false,
		mensaje: "",

		// Datos calculados
		precio: 0,
		totalConDescuento: 0,
	});

	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	// Destinos comunes para autocompletado
	const destinosComunes = [
		"Aeropuerto La Araucanía",
		"Temuco Centro",
		"Terminal de Buses Temuco",
		"Pucón",
		"Villarrica",
		"Angol",
		"Victoria",
		"Lautaro",
		"Cunco",
	];

	const handleChange = (campo, valor) => {
		setFormData((prev) => ({ ...prev, [campo]: valor }));
		// Limpiar error del campo
		if (errores[campo]) {
			setErrores((prev) => {
				const nuevos = { ...prev };
				delete nuevos[campo];
				return nuevos;
			});
		}
	};

	const validarPaso1 = () => {
		const nuevosErrores = {};

		if (!formData.nombre.trim()) {
			nuevosErrores.nombre = "El nombre es requerido";
		}
		if (!formData.email.trim()) {
			nuevosErrores.email = "El email es requerido";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			nuevosErrores.email = "Email inválido";
		}
		if (!formData.telefono.trim()) {
			nuevosErrores.telefono = "El teléfono es requerido";
		}
		if (!formData.origen.trim()) {
			nuevosErrores.origen = "El origen es requerido";
		}
		if (!formData.destino.trim()) {
			nuevosErrores.destino = "El destino es requerido";
		}
		if (!formData.fecha) {
			nuevosErrores.fecha = "La fecha es requerida";
		}

		setErrores(nuevosErrores);
		return Object.keys(nuevosErrores).length === 0;
	};

	const validarPaso2 = () => {
		const nuevosErrores = {};

		if (formData.idaVuelta && !formData.fechaRegreso) {
			nuevosErrores.fechaRegreso = "La fecha de regreso es requerida";
		}

		setErrores(nuevosErrores);
		return Object.keys(nuevosErrores).length === 0;
	};

	const siguientePaso = () => {
		if (pasoActual === 1 && validarPaso1()) {
			// Calcular precio aproximado (simplificado)
			calcularPrecio();
			setPasoActual(2);
		} else if (pasoActual === 2 && validarPaso2()) {
			// Recalcular precio con descuentos
			calcularPrecio();
			setPasoActual(3);
		}
	};

	const pasoAnterior = () => {
		setPasoActual((prev) => Math.max(1, prev - 1));
	};

	const calcularPrecio = () => {
		// Precio base simplificado (en producción, esto vendría del backend)
		let precio = 30000;

		// Ajuste por número de pasajeros
		if (formData.pasajeros > 4) {
			precio = precio * 1.5;
		}

		// Descuento por ida y vuelta (10%)
		let descuentoRoundTrip = 0;
		if (formData.idaVuelta) {
			precio = precio * 2;
			descuentoRoundTrip = precio * 0.1;
		}

		// Descuento online (5%)
		const descuentoOnline = precio * 0.05;

		const total = precio - descuentoRoundTrip - descuentoOnline;

		setFormData((prev) => ({
			...prev,
			precio: precio,
			descuentoRoundTrip: descuentoRoundTrip,
			descuentoOnline: descuentoOnline,
			totalConDescuento: total,
			abonoSugerido: Math.round(total * 0.5),
			saldoPendiente: Math.round(total * 0.5),
		}));
	};

	const handleCrear = async () => {
		setCreando(true);
		try {
			const response = await fetch(`${apiUrl}/api/reservas`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					...formData,
					estado: "pendiente",
					estadoPago: "pendiente",
					source: "admin_wizard",
				}),
			});

			if (response.ok) {
				onSuccess();
			} else {
				const error = await response.json();
				alert(`Error al crear reserva: ${error.message || "Error desconocido"}`);
			}
		} catch (error) {
			console.error("Error creando reserva:", error);
			alert("Error al crear la reserva. Intente nuevamente.");
		} finally {
			setCreando(false);
		}
	};

	const formatearMoneda = (valor) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(valor || 0);
	};

	const renderPaso1 = () => (
		<div className="space-y-4">
			<div className="flex items-center gap-2 mb-4">
				<User className="h-5 w-5 text-blue-600" />
				<h3 className="text-lg font-semibold">Información del Cliente y Ruta</h3>
			</div>

			{/* Cliente */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label htmlFor="nombre">
						Nombre Completo <span className="text-red-500">*</span>
					</Label>
					<Input
						id="nombre"
						value={formData.nombre}
						onChange={(e) => handleChange("nombre", e.target.value)}
						placeholder="Juan Pérez"
						className={errores.nombre ? "border-red-500" : ""}
					/>
					{errores.nombre && (
						<p className="text-red-500 text-xs mt-1">{errores.nombre}</p>
					)}
				</div>

				<div>
					<Label htmlFor="rut">RUT (Opcional)</Label>
					<Input
						id="rut"
						value={formData.rut}
						onChange={(e) => handleChange("rut", e.target.value)}
						placeholder="12345678-9"
					/>
				</div>

				<div>
					<Label htmlFor="email">
						Email <span className="text-red-500">*</span>
					</Label>
					<Input
						id="email"
						type="email"
						value={formData.email}
						onChange={(e) => handleChange("email", e.target.value)}
						placeholder="juan@example.com"
						className={errores.email ? "border-red-500" : ""}
					/>
					{errores.email && (
						<p className="text-red-500 text-xs mt-1">{errores.email}</p>
					)}
				</div>

				<div>
					<Label htmlFor="telefono">
						Teléfono <span className="text-red-500">*</span>
					</Label>
					<Input
						id="telefono"
						value={formData.telefono}
						onChange={(e) => handleChange("telefono", e.target.value)}
						placeholder="+56912345678"
						className={errores.telefono ? "border-red-500" : ""}
					/>
					{errores.telefono && (
						<p className="text-red-500 text-xs mt-1">{errores.telefono}</p>
					)}
				</div>
			</div>

			{/* Ruta */}
			<div className="grid grid-cols-2 gap-4 pt-4 border-t">
				<div>
					<Label htmlFor="origen">
						Origen <span className="text-red-500">*</span>
					</Label>
					<Select value={formData.origen} onValueChange={(v) => handleChange("origen", v)}>
						<SelectTrigger className={errores.origen ? "border-red-500" : ""}>
							<SelectValue placeholder="Seleccionar origen" />
						</SelectTrigger>
						<SelectContent>
							{destinosComunes.map((dest) => (
								<SelectItem key={dest} value={dest}>
									{dest}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errores.origen && (
						<p className="text-red-500 text-xs mt-1">{errores.origen}</p>
					)}
				</div>

				<div>
					<Label htmlFor="destino">
						Destino <span className="text-red-500">*</span>
					</Label>
					<Select value={formData.destino} onValueChange={(v) => handleChange("destino", v)}>
						<SelectTrigger className={errores.destino ? "border-red-500" : ""}>
							<SelectValue placeholder="Seleccionar destino" />
						</SelectTrigger>
						<SelectContent>
							{destinosComunes.map((dest) => (
								<SelectItem key={dest} value={dest}>
									{dest}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errores.destino && (
						<p className="text-red-500 text-xs mt-1">{errores.destino}</p>
					)}
				</div>

				<div>
					<Label htmlFor="fecha">
						Fecha <span className="text-red-500">*</span>
					</Label>
					<Input
						id="fecha"
						type="date"
						value={formData.fecha}
						onChange={(e) => handleChange("fecha", e.target.value)}
						min={new Date().toISOString().split("T")[0]}
						className={errores.fecha ? "border-red-500" : ""}
					/>
					{errores.fecha && (
						<p className="text-red-500 text-xs mt-1">{errores.fecha}</p>
					)}
				</div>

				<div>
					<Label htmlFor="hora">Hora</Label>
					<Input
						id="hora"
						type="time"
						value={formData.hora}
						onChange={(e) => handleChange("hora", e.target.value)}
					/>
				</div>

				<div>
					<Label htmlFor="pasajeros">Número de Pasajeros</Label>
					<Select
						value={formData.pasajeros.toString()}
						onValueChange={(v) => handleChange("pasajeros", parseInt(v))}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
								<SelectItem key={num} value={num.toString()}>
									{num} {num === 1 ? "pasajero" : "pasajeros"}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);

	const renderPaso2 = () => (
		<div className="space-y-4">
			<div className="flex items-center gap-2 mb-4">
				<Calendar className="h-5 w-5 text-blue-600" />
				<h3 className="text-lg font-semibold">Detalles del Viaje</h3>
			</div>

			{/* Ida y Vuelta */}
			<div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
				<Checkbox
					id="idaVuelta"
					checked={formData.idaVuelta}
					onCheckedChange={(checked) => handleChange("idaVuelta", checked)}
				/>
				<Label htmlFor="idaVuelta" className="cursor-pointer">
					Viaje de Ida y Vuelta (10% de descuento)
				</Label>
			</div>

			{/* Datos de regreso si es ida y vuelta */}
			{formData.idaVuelta && (
				<div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg">
					<div>
						<Label htmlFor="fechaRegreso">
							Fecha de Regreso <span className="text-red-500">*</span>
						</Label>
						<Input
							id="fechaRegreso"
							type="date"
							value={formData.fechaRegreso}
							onChange={(e) => handleChange("fechaRegreso", e.target.value)}
							min={formData.fecha || new Date().toISOString().split("T")[0]}
							className={errores.fechaRegreso ? "border-red-500" : ""}
						/>
						{errores.fechaRegreso && (
							<p className="text-red-500 text-xs mt-1">{errores.fechaRegreso}</p>
						)}
					</div>

					<div>
						<Label htmlFor="horaRegreso">Hora de Regreso</Label>
						<Input
							id="horaRegreso"
							type="time"
							value={formData.horaRegreso}
							onChange={(e) => handleChange("horaRegreso", e.target.value)}
						/>
					</div>
				</div>
			)}

			{/* Información adicional */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label htmlFor="numeroVuelo">Número de Vuelo (Opcional)</Label>
					<Input
						id="numeroVuelo"
						value={formData.numeroVuelo}
						onChange={(e) => handleChange("numeroVuelo", e.target.value)}
						placeholder="LA1234"
					/>
				</div>

				<div>
					<Label htmlFor="hotel">Hotel (Opcional)</Label>
					<Input
						id="hotel"
						value={formData.hotel}
						onChange={(e) => handleChange("hotel", e.target.value)}
						placeholder="Hotel Dreams"
					/>
				</div>
			</div>

			<div>
				<Label htmlFor="equipajeEspecial">Equipaje Especial (Opcional)</Label>
				<Textarea
					id="equipajeEspecial"
					value={formData.equipajeEspecial}
					onChange={(e) => handleChange("equipajeEspecial", e.target.value)}
					placeholder="Bicicletas, instrumentos musicales, etc."
					rows={2}
				/>
			</div>

			<div className="flex items-center space-x-2">
				<Checkbox
					id="sillaInfantil"
					checked={formData.sillaInfantil}
					onCheckedChange={(checked) => handleChange("sillaInfantil", checked)}
				/>
				<Label htmlFor="sillaInfantil" className="cursor-pointer">
					Requiere silla infantil
				</Label>
			</div>

			<div>
				<Label htmlFor="mensaje">Mensaje o Comentarios (Opcional)</Label>
				<Textarea
					id="mensaje"
					value={formData.mensaje}
					onChange={(e) => handleChange("mensaje", e.target.value)}
					placeholder="Cualquier información adicional..."
					rows={3}
				/>
			</div>
		</div>
	);

	const renderPaso3 = () => (
		<div className="space-y-4">
			<div className="flex items-center gap-2 mb-4">
				<CheckCircle className="h-5 w-5 text-green-600" />
				<h3 className="text-lg font-semibold">Confirmación y Resumen</h3>
			</div>

			{/* Resumen del Cliente */}
			<div className="bg-gray-50 p-4 rounded-lg">
				<h4 className="font-semibold mb-2">Cliente</h4>
				<div className="space-y-1 text-sm">
					<div>
						<span className="text-gray-600">Nombre:</span>{" "}
						<span className="font-medium">{formData.nombre}</span>
					</div>
					<div>
						<span className="text-gray-600">Email:</span>{" "}
						<span className="font-medium">{formData.email}</span>
					</div>
					<div>
						<span className="text-gray-600">Teléfono:</span>{" "}
						<span className="font-medium">{formData.telefono}</span>
					</div>
				</div>
			</div>

			{/* Resumen del Viaje */}
			<div className="bg-blue-50 p-4 rounded-lg">
				<h4 className="font-semibold mb-2">Viaje</h4>
				<div className="space-y-2 text-sm">
					<div className="flex items-center gap-2">
						<MapPin className="h-4 w-4 text-gray-400" />
						<span className="font-medium">{formData.origen}</span>
						<span className="text-gray-400">→</span>
						<span className="font-medium">{formData.destino}</span>
					</div>
					<div className="flex items-center gap-2">
						<Calendar className="h-4 w-4 text-gray-400" />
						<span>
							{new Date(formData.fecha).toLocaleDateString("es-CL", {
								weekday: "long",
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</span>
						<span className="text-gray-400">a las</span>
						<span className="font-medium">{formData.hora}</span>
					</div>
					{formData.idaVuelta && (
						<div className="bg-white p-2 rounded">
							<Badge className="bg-blue-600">Ida y Vuelta</Badge>
							<div className="mt-1">
								Regreso:{" "}
								{new Date(formData.fechaRegreso).toLocaleDateString("es-CL")} a las{" "}
								{formData.horaRegreso}
							</div>
						</div>
					)}
					<div>
						<span className="text-gray-600">Pasajeros:</span>{" "}
						<span className="font-medium">{formData.pasajeros}</span>
					</div>
				</div>
			</div>

			{/* Resumen Financiero */}
			<div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
				<h4 className="font-semibold mb-3">Resumen Financiero</h4>
				<div className="space-y-2 text-sm">
					<div className="flex justify-between">
						<span>Precio Base:</span>
						<span className="font-medium">{formatearMoneda(formData.precio)}</span>
					</div>
					{formData.descuentoRoundTrip > 0 && (
						<div className="flex justify-between text-green-700">
							<span>Descuento Ida y Vuelta (10%):</span>
							<span>-{formatearMoneda(formData.descuentoRoundTrip)}</span>
						</div>
					)}
					{formData.descuentoOnline > 0 && (
						<div className="flex justify-between text-green-700">
							<span>Descuento Online (5%):</span>
							<span>-{formatearMoneda(formData.descuentoOnline)}</span>
						</div>
					)}
					<div className="border-t border-green-300 pt-2 flex justify-between text-lg font-bold">
						<span>Total:</span>
						<span className="text-green-600">
							{formatearMoneda(formData.totalConDescuento)}
						</span>
					</div>
					<div className="flex justify-between text-sm text-gray-600">
						<span>Abono sugerido (50%):</span>
						<span>{formatearMoneda(formData.abonoSugerido)}</span>
					</div>
				</div>
			</div>

			<div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
				<p className="font-medium mb-1">⚠️ Importante:</p>
				<p className="text-gray-700">
					La reserva se creará con estado "Pendiente". Recuerda confirmarla y asignar
					vehículo/conductor cuando corresponda.
				</p>
			</div>
		</div>
	);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Nueva Reserva - Paso {pasoActual} de 3</DialogTitle>
				</DialogHeader>

				{/* Indicador de pasos */}
				<div className="flex items-center justify-center gap-2 mb-6">
					{[1, 2, 3].map((paso) => (
						<div key={paso} className="flex items-center">
							<div
								className={`
									w-8 h-8 rounded-full flex items-center justify-center font-semibold
									${
										paso < pasoActual
											? "bg-green-500 text-white"
											: paso === pasoActual
											? "bg-blue-500 text-white"
											: "bg-gray-200 text-gray-600"
									}
								`}
							>
								{paso < pasoActual ? <Check className="h-5 w-5" /> : paso}
							</div>
							{paso < 3 && (
								<div
									className={`w-16 h-1 ${
										paso < pasoActual ? "bg-green-500" : "bg-gray-200"
									}`}
								/>
							)}
						</div>
					))}
				</div>

				{/* Contenido del paso actual */}
				<div className="min-h-[400px]">
					{pasoActual === 1 && renderPaso1()}
					{pasoActual === 2 && renderPaso2()}
					{pasoActual === 3 && renderPaso3()}
				</div>

				{/* Botones de navegación */}
				<div className="flex justify-between pt-4 border-t">
					<Button
						variant="outline"
						onClick={pasoActual === 1 ? onClose : pasoAnterior}
						disabled={creando}
					>
						<ChevronLeft className="h-4 w-4 mr-2" />
						{pasoActual === 1 ? "Cancelar" : "Anterior"}
					</Button>

					{pasoActual < 3 ? (
						<Button onClick={siguientePaso}>
							Siguiente
							<ChevronRight className="h-4 w-4 ml-2" />
						</Button>
					) : (
						<Button onClick={handleCrear} disabled={creando} className="bg-green-600 hover:bg-green-700">
							{creando ? "Creando..." : "Crear Reserva"}
							<Check className="h-4 w-4 ml-2" />
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default WizardReserva;
