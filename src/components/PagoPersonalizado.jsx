import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LoaderCircle, DollarSign, MapPin, User, Mail, Phone, Key, Calendar, Clock } from "lucide-react";
import flow from "../assets/formasPago/flow.png";
import merPago from "../assets/formasPago/mp.png";

function PagoPersonalizado() {
	const [formData, setFormData] = useState({
		codigo: "",
		origen: "",
		destino: "",
		monto: "",
		nombre: "",
		email: "",
		telefono: "",
		direccion: "",
		fecha: "",
		hora: "",
		descripcion: "",
	});

	const [loadingGateway, setLoadingGateway] = useState(null);
	const [errors, setErrors] = useState({});
	const [codigoValido, setCodigoValido] = useState(false);
	const [errorCodigo, setErrorCodigo] = useState("");

	// Cargar datos desde URL si existen
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const codigo = params.get("codigo");
		const urlData = {
			codigo: codigo || "",
			origen: params.get("origen") || "",
			destino: params.get("destino") || "",
			monto: params.get("monto") || "",
			nombre: params.get("nombre") || "",
			email: params.get("email") || "",
			telefono: params.get("telefono") || "",
			direccion: params.get("direccion") || "",
			fecha: params.get("fecha") || "",
			hora: params.get("hora") || "",
			descripcion: params.get("descripcion") || "",
		};
		
		// Si hay código en URL, procesarlo automáticamente
		if (codigo) {
			procesarCodigo(codigo);
		} else if (Object.values(urlData).some(val => val !== "")) {
			setFormData(urlData);
			if (urlData.origen && urlData.destino && urlData.monto) {
				setCodigoValido(true);
			}
		}
	}, []);

	// Función para parsear códigos de pago
	// Formato: ORIGEN-DESTINO-MONTO
	// Ejemplos: A-CARAHUE-35, TEMUCO-PUCON-60, A-LONQUIMAY-45
	const procesarCodigo = (codigo) => {
		setErrorCodigo("");
		setCodigoValido(false);
		
		if (!codigo.trim()) {
			return;
		}

		// Convertir a mayúsculas para procesamiento
		const codigoUpper = codigo.toUpperCase().trim();
		
		// Intentar parsear el código
		// Formato esperado: ORIGEN-DESTINO-MONTO
		const partes = codigoUpper.split("-");
		
		if (partes.length < 3) {
			setErrorCodigo("Formato de código inválido. Usa: ORIGEN-DESTINO-MONTO (ej: A-CARAHUE-35)");
			return;
		}

		let origen = partes[0];
		const destino = partes[1];
		const montoStr = partes[2];

		// Mapear abreviaciones comunes
		const mapaOrigenes = {
			"A": "Aeropuerto La Araucanía",
			"AEROPUERTO": "Aeropuerto La Araucanía",
			"TEMUCO": "Temuco",
			"VILLARRICA": "Villarrica",
			"PUCON": "Pucón",
			"LONQUIMAY": "Lonquimay",
		};

		const mapaDestinos = {
			"CARAHUE": "Carahue",
			"TEMUCO": "Temuco",
			"VILLARRICA": "Villarrica",
			"PUCON": "Pucón",
			"LONQUIMAY": "Lonquimay",
			"CURACAUTIN": "Curacautín",
			"VICTORIA": "Victoria",
			"MALALCAHUELLO": "Malalcahuello",
			"CONGUILLÍO": "Parque Nacional Conguillío",
			"CONGUILLIO": "Parque Nacional Conguillío",
			"CORRALCO": "Corralco",
			"ICALMA": "Laguna Icalma",
		};

		// Convertir origen
		origen = mapaOrigenes[origen] || origen;
		
		// Convertir destino
		const destinoCompleto = mapaDestinos[destino] || destino;

		// Parsear monto (el número representa miles de pesos)
		const montoNumero = parseInt(montoStr);
		if (isNaN(montoNumero) || montoNumero <= 0) {
			setErrorCodigo("Monto inválido en el código");
			return;
		}

		// El monto en el código representa miles (ej: 35 = $35.000)
		const montoFinal = montoNumero * 1000;

		// Actualizar formulario con los datos del código
		setFormData((prev) => ({
			...prev,
			codigo: codigo,
			origen: origen,
			destino: destinoCompleto,
			monto: montoFinal.toString(),
		}));

		setCodigoValido(true);
		setErrorCodigo("");
	};

	const handleCodigoChange = (e) => {
		const codigo = e.target.value;
		setFormData((prev) => ({
			...prev,
			codigo: codigo,
		}));
		
		// Procesar el código en tiempo real
		if (codigo.trim()) {
			procesarCodigo(codigo);
		} else {
			setCodigoValido(false);
			setErrorCodigo("");
			// Limpiar campos de traslado
			setFormData((prev) => ({
				...prev,
				origen: "",
				destino: "",
				monto: "",
			}));
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		
		// Limpiar error del campo al escribir
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: "",
			}));
		}
	};

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", {
				style: "currency",
				currency: "CLP",
			}),
		[]
	);

	const formatCurrency = (value) => {
		const num = parseInt(value.toString().replace(/\D/g, "")) || 0;
		return currencyFormatter.format(num);
	};

	const handleMontoChange = (e) => {
		const value = e.target.value.replace(/\D/g, "");
		setFormData((prev) => ({
			...prev,
			monto: value,
		}));
		
		if (errors.monto) {
			setErrors((prev) => ({
				...prev,
				monto: "",
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.origen.trim()) {
			newErrors.origen = "El origen es requerido";
		}

		if (!formData.destino.trim()) {
			newErrors.destino = "El destino es requerido";
		}

		const monto = parseInt(formData.monto) || 0;
		if (monto <= 0) {
			newErrors.monto = "Ingresa un monto válido mayor a $0";
		}

		if (!formData.nombre.trim()) {
			newErrors.nombre = "El nombre es requerido";
		}

		if (!formData.email.trim()) {
			newErrors.email = "El email es requerido";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Email inválido";
		}

		if (!formData.telefono.trim()) {
			newErrors.telefono = "El teléfono es requerido";
		}

		if (!formData.direccion.trim()) {
			newErrors.direccion = "La dirección es requerida";
		}

		if (!formData.fecha.trim()) {
			newErrors.fecha = "La fecha es requerida";
		}

		if (!formData.hora.trim()) {
			newErrors.hora = "La hora es requerida";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handlePayment = async (gateway) => {
		if (!validateForm()) {
			return;
		}

		setLoadingGateway(gateway);

		const monto = parseInt(formData.monto) || 0;
		
		// Construir descripción detallada
		let description = formData.descripcion.trim()
			? formData.descripcion
			: `Traslado ${formData.origen} → ${formData.destino}`;
		
		description += ` | Fecha: ${formData.fecha} ${formData.hora} | Dirección: ${formData.direccion}`;

		const apiUrl =
			import.meta.env.VITE_API_URL ||
			"https://transportes-araucaria.onrender.com";

		try {
			const response = await fetch(`${apiUrl}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gateway,
					amount: monto,
					description,
					email: formData.email,
					reservationId: null,
				}),
			});

			if (!response.ok) {
				throw new Error(`Error del servidor: ${response.status}`);
			}

			const data = await response.json();
			if (data.url) {
				window.open(data.url, "_blank");
			} else {
				throw new Error(
					data.message || "No se pudo generar el enlace de pago."
				);
			}
		} catch (error) {
			console.error("Error al crear el pago:", error);
			alert(`Hubo un problema: ${error.message}`);
		} finally {
			setLoadingGateway(null);
		}
	};

	const isFormValid = useMemo(() => {
		return (
			formData.origen.trim() &&
			formData.destino.trim() &&
			parseInt(formData.monto) > 0 &&
			formData.nombre.trim() &&
			formData.email.trim() &&
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
			formData.telefono.trim() &&
			formData.direccion.trim() &&
			formData.fecha.trim() &&
			formData.hora.trim()
		);
	}, [formData]);

	return (
		<section className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-3">
						💳 Pago Personalizado
					</h1>
					<p className="text-lg text-gray-600">
						Genera tu enlace de pago para traslados personalizados
					</p>
					<Badge variant="secondary" className="mt-2">
						Para tramos y valores no disponibles en el sistema
					</Badge>
				</div>

				{/* Solo mostrar campo de código si NO viene de URL */}
				{!codigoValido && (
					<Card className="shadow-lg">
						<CardHeader>
							<CardTitle className="text-2xl">Ingresa tu código de pago</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Campo de código */}
							<div className="space-y-2">
								<Label htmlFor="codigo" className="text-base font-medium flex items-center gap-2">
									<Key className="w-4 h-4" />
									Código de pago
								</Label>
								<Input
									id="codigo"
									name="codigo"
									value={formData.codigo}
									onChange={handleCodigoChange}
									placeholder="Ingresa el código que recibiste"
									className={`text-lg font-mono ${errorCodigo ? "border-red-500" : codigoValido ? "border-green-500" : ""}`}
								/>
								{errorCodigo && (
									<p className="text-sm text-red-500">{errorCodigo}</p>
								)}
								<p className="text-xs text-gray-500">
									Ingresa el código que te proporcionó el administrador
								</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Mostrar datos del traslado solo cuando hay código válido o datos cargados */}
				{(codigoValido || (formData.origen && formData.destino && formData.monto)) && (
					<Card className="shadow-lg mt-6">
						<CardHeader>
							<CardTitle className="text-2xl">Datos del traslado</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Información del traslado (solo lectura si viene de código) */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="origen" className="text-base font-medium flex items-center gap-2">
										<MapPin className="w-4 h-4" />
										Origen <span className="text-destructive">*</span>
									</Label>
									<Input
										id="origen"
										name="origen"
										value={formData.origen}
										onChange={handleInputChange}
										placeholder="Ej: Aeropuerto La Araucanía"
										className={errors.origen ? "border-red-500" : ""}
										disabled={codigoValido}
									/>
									{errors.origen && (
										<p className="text-sm text-red-500">{errors.origen}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="destino" className="text-base font-medium flex items-center gap-2">
										<MapPin className="w-4 h-4" />
										Destino <span className="text-destructive">*</span>
									</Label>
									<Input
										id="destino"
										name="destino"
										value={formData.destino}
										onChange={handleInputChange}
										placeholder="Ej: Carahue"
										className={errors.destino ? "border-red-500" : ""}
										disabled={codigoValido}
									/>
									{errors.destino && (
										<p className="text-sm text-red-500">{errors.destino}</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="monto" className="text-base font-medium flex items-center gap-2">
									<DollarSign className="w-4 h-4" />
									Monto a pagar <span className="text-destructive">*</span>
								</Label>
								<Input
									id="monto"
									name="monto"
									value={formData.monto}
									onChange={handleMontoChange}
									placeholder="Ej: 25000"
									type="text"
									className={errors.monto ? "border-red-500" : ""}
									disabled={codigoValido}
								/>
								{formData.monto && (
									<p className="text-sm text-gray-600">
										{formatCurrency(formData.monto)}
									</p>
								)}
								{errors.monto && (
									<p className="text-sm text-red-500">{errors.monto}</p>
								)}
							</div>

						<div className="space-y-2">
							<Label htmlFor="descripcion" className="text-base font-medium">
								Descripción del servicio (opcional)
							</Label>
							<Input
								id="descripcion"
								name="descripcion"
								value={formData.descripcion}
								onChange={handleInputChange}
								placeholder="Ej: Transfer con equipaje especial"
							/>
						</div>

						{/* Datos del cliente */}
						<div className="border-t pt-6">
							<h3 className="text-xl font-semibold mb-4">Datos del cliente</h3>
							
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="nombre" className="text-base font-medium flex items-center gap-2">
										<User className="w-4 h-4" />
										Nombre completo <span className="text-destructive">*</span>
									</Label>
									<Input
										id="nombre"
										name="nombre"
										value={formData.nombre}
										onChange={handleInputChange}
										placeholder="Ej: Juan Pérez"
										className={errors.nombre ? "border-red-500" : ""}
									/>
									{errors.nombre && (
										<p className="text-sm text-red-500">{errors.nombre}</p>
									)}
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
											<Mail className="w-4 h-4" />
											Email <span className="text-destructive">*</span>
										</Label>
										<Input
											id="email"
											name="email"
											type="email"
											value={formData.email}
											onChange={handleInputChange}
											placeholder="correo@ejemplo.com"
											className={errors.email ? "border-red-500" : ""}
										/>
										{errors.email && (
											<p className="text-sm text-red-500">{errors.email}</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="telefono" className="text-base font-medium flex items-center gap-2">
											<Phone className="w-4 h-4" />
											Teléfono <span className="text-destructive">*</span>
										</Label>
										<Input
											id="telefono"
											name="telefono"
											type="tel"
											value={formData.telefono}
											onChange={handleInputChange}
											placeholder="+56 9 1234 5678"
											className={errors.telefono ? "border-red-500" : ""}
										/>
										{errors.telefono && (
											<p className="text-sm text-red-500">{errors.telefono}</p>
										)}
									</div>
								</div>

								{/* Nuevos campos requeridos */}
								<div className="space-y-2">
									<Label htmlFor="direccion" className="text-base font-medium flex items-center gap-2">
										<MapPin className="w-4 h-4" />
										Dirección de {formData.origen && formData.origen.toLowerCase().includes("aeropuerto") ? "llegada" : "origen"} <span className="text-destructive">*</span>
									</Label>
									<Input
										id="direccion"
										name="direccion"
										value={formData.direccion}
										onChange={handleInputChange}
										placeholder="Ej: Hotel Dreams, Calle Principal 123, Pucón"
										className={errors.direccion ? "border-red-500" : ""}
									/>
									{errors.direccion && (
										<p className="text-sm text-red-500">{errors.direccion}</p>
									)}
									<p className="text-xs text-gray-500">
										Dirección exacta donde debemos {formData.origen && formData.origen.toLowerCase().includes("aeropuerto") ? "dejarte" : "recogerte"}
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="fecha" className="text-base font-medium flex items-center gap-2">
											<Calendar className="w-4 h-4" />
											Fecha del traslado <span className="text-destructive">*</span>
										</Label>
										<Input
											id="fecha"
											name="fecha"
											type="date"
											value={formData.fecha}
											onChange={handleInputChange}
											className={errors.fecha ? "border-red-500" : ""}
											min={new Date().toISOString().split('T')[0]}
										/>
										{errors.fecha && (
											<p className="text-sm text-red-500">{errors.fecha}</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="hora" className="text-base font-medium flex items-center gap-2">
											<Clock className="w-4 h-4" />
											Hora del traslado <span className="text-destructive">*</span>
										</Label>
										<Input
											id="hora"
											name="hora"
											type="time"
											value={formData.hora}
											onChange={handleInputChange}
											className={errors.hora ? "border-red-500" : ""}
										/>
										{errors.hora && (
											<p className="text-sm text-red-500">{errors.hora}</p>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Botones de pago */}
						<div className="border-t pt-6">
							<h3 className="text-xl font-semibold mb-4">Selecciona tu método de pago</h3>
							
							{!isFormValid && (
								<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
									<p className="text-sm text-yellow-800">
										⚠️ Completa todos los campos requeridos para continuar con el pago
									</p>
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Mercado Pago */}
								<Button
									onClick={() => handlePayment("mercadopago")}
									disabled={!isFormValid || loadingGateway}
									className="h-auto py-4 flex flex-col items-center gap-2 bg-[#009ee3] hover:bg-[#0082c3] disabled:bg-gray-300"
								>
									{loadingGateway === "mercadopago" ? (
										<LoaderCircle className="animate-spin w-6 h-6" />
									) : (
										<>
											<img
												src={merPago}
												alt="Mercado Pago"
												className="h-8 object-contain"
											/>
											<span className="text-sm">Pagar con Mercado Pago</span>
										</>
									)}
								</Button>

								{/* Flow */}
								<Button
									onClick={() => handlePayment("flow")}
									disabled={!isFormValid || loadingGateway}
									className="h-auto py-4 flex flex-col items-center gap-2 bg-[#FF6B00] hover:bg-[#E55D00] disabled:bg-gray-300"
								>
									{loadingGateway === "flow" ? (
										<LoaderCircle className="animate-spin w-6 h-6" />
									) : (
										<>
											<img
												src={flow}
												alt="Flow"
												className="h-8 object-contain"
											/>
											<span className="text-sm">Pagar con Flow</span>
										</>
									)}
								</Button>
							</div>

							<div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
								<p className="text-sm text-blue-800">
									<strong>💡 Nota:</strong> Al hacer clic en un método de pago, se abrirá una nueva ventana
									para completar tu pago de forma segura.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				)}

				{/* Información adicional */}
				<div className="mt-8 text-center text-sm text-gray-600">
					<p>
						¿Necesitas ayuda? Contáctanos por{" "}
						<a
							href="https://wa.me/56912345678"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline"
						>
							WhatsApp
						</a>
					</p>
				</div>
			</div>
		</section>
	);
}

export default PagoPersonalizado;
