import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "./ui/card";
import {
	Settings,
	MessageCircle,
	CheckCircle,
	XCircle,
	Loader2,
	AlertCircle,
	Target,
	Clock,
	Baby,
	CreditCard,
	Upload,
	Trash2,
	ImageIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { getBackendUrl } from "../lib/backend";
import { invalidarCachePasarelas } from "../hooks/usePasarelasConfig";

/**
 * Panel de Configuración General del Sistema
 * Permite gestionar configuraciones globales como el modal de WhatsApp
 */
function AdminConfiguracion() {
	const [whatsappInterceptActivo, setWhatsappInterceptActivo] = useState(true);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [feedback, setFeedback] = useState(null);
	const [generandoOportunidades, setGenerandoOportunidades] = useState(false);
	const [resultadoOportunidades, setResultadoOportunidades] = useState(null);
	const [configOfertas, setConfigOfertas] = useState({
		anticipacionRetorno: 2,
		anticipacionIda: 3,
	});
	const [configSillas, setConfigSillas] = useState({
		habilitado: false,
		maxSillas: 2,
		precioPorSilla: 5000,
	});

	// Estado para la configuración de pasarelas de pago
	const [configPasarelas, setConfigPasarelas] = useState({
		flow: {
			habilitado: true,
			nombre: "Flow",
			descripcion: "Tarjeta / Débito",
			imagen_url: null,
		},
		mercadopago: {
			habilitado: true,
			nombre: "Mercado Pago",
			descripcion: "MP / Débito / Cuotas",
			imagen_url: null,
		},
	});
	const [savingPasarelas, setSavingPasarelas] = useState(false);
	const [uploadingImagen, setUploadingImagen] = useState(null); // id de pasarela en proceso de subida
	const inputFlowRef = useRef(null);
	const inputMpRef = useRef(null);

	const { authenticatedFetch } = useAuthenticatedFetch();

	// Cargar configuración actual al montar el componente
	useEffect(() => {
		cargarConfiguracion();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const cargarConfiguracion = async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`${getBackendUrl()}/api/configuracion/whatsapp-intercept`,
			);

			if (!response.ok) {
				throw new Error("Error al cargar configuración");
			}

			const data = await response.json();
			setWhatsappInterceptActivo(data.activo);

			// Cargar ofertas y sillas
			const resExtra = await fetch(
				`${getBackendUrl()}/api/configuracion/ofertas-sillas`,
			);
			if (resExtra.ok) {
				const dataExtra = await resExtra.json();
				if (dataExtra.ofertas) setConfigOfertas(dataExtra.ofertas);
				if (dataExtra.sillas) setConfigSillas(dataExtra.sillas);
			}

			// Cargar configuración de pasarelas de pago
			const resPasarelas = await fetch(
				`${getBackendUrl()}/api/configuracion/pasarelas-pago`,
			);
			if (resPasarelas.ok) {
				const dataPasarelas = await resPasarelas.json();
				if (dataPasarelas.pasarelas)
					setConfigPasarelas(dataPasarelas.pasarelas);
			}
		} catch (error) {
			console.error("Error cargando configuración:", error);
			showFeedback("error", "Error al cargar la configuración");
		} finally {
			setLoading(false);
		}
	};

	const handleSaveExtras = async () => {
		try {
			setSaving(true);
			const response = await authenticatedFetch(
				`/api/configuracion/ofertas-sillas`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						ofertas: configOfertas,
						sillas: configSillas,
					}),
				},
			);

			if (!response.ok) throw new Error("Error al guardar configuración");

			showFeedback(
				"success",
				"Configuración de ofertas y sillas guardada correctamente",
			);
		} catch (error) {
			console.error("Error guardando extras:", error);
			showFeedback("error", "Error al guardar la configuración");
		} finally {
			setSaving(false);
		}
	};

	const handleToggleWhatsApp = async () => {
		const nuevoEstado = !whatsappInterceptActivo;

		try {
			setSaving(true);

			const response = await authenticatedFetch(
				`/api/configuracion/whatsapp-intercept`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ activo: nuevoEstado }),
				},
			);

			if (!response.ok) {
				throw new Error("Error al guardar configuración");
			}

			await response.json();
			setWhatsappInterceptActivo(nuevoEstado);

			// Actualizar localStorage para caché en el frontend
			localStorage.setItem("whatsapp_intercept_activo", nuevoEstado.toString());

			showFeedback(
				"success",
				`Modal de WhatsApp ${nuevoEstado ? "activado" : "desactivado"} correctamente`,
			);
		} catch (error) {
			console.error("Error guardando configuración:", error);
			showFeedback("error", "Error al guardar la configuración");
		} finally {
			setSaving(false);
		}
	};

	const showFeedback = (type, message) => {
		setFeedback({ type, message });
		setTimeout(() => setFeedback(null), 5000);
	};

	// --- Funciones de Pasarelas de Pago ---

	/**
	 * Guarda la configuración general de las pasarelas (habilitado, nombre, descripción).
	 */
	const handleSavePasarelas = async () => {
		try {
			setSavingPasarelas(true);
			const response = await authenticatedFetch(
				"/api/configuracion/pasarelas-pago",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(configPasarelas),
				},
			);
			if (!response.ok) throw new Error("Error al guardar pasarelas");
			const data = await response.json();
			if (data.pasarelas) setConfigPasarelas(data.pasarelas);
			invalidarCachePasarelas();
			showFeedback(
				"success",
				"Configuración de pasarelas guardada correctamente",
			);
		} catch (error) {
			console.error("Error guardando pasarelas:", error);
			showFeedback("error", "Error al guardar la configuración de pasarelas");
		} finally {
			setSavingPasarelas(false);
		}
	};

	/**
	 * Sube la imagen de una pasarela a Cloudinary.
	 */
	const handleSubirImagenPasarela = async (gatewayId, archivo) => {
		if (!archivo) return;
		try {
			setUploadingImagen(gatewayId);
			const token =
				localStorage.getItem("adminToken") ||
				sessionStorage.getItem("adminToken");
			const formData = new FormData();
			formData.append("imagen", archivo);
			const response = await fetch(
				`${getBackendUrl()}/api/configuracion/pasarelas-pago/${gatewayId}/imagen`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: formData,
				},
			);
			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || "Error al subir imagen");
			}
			const data = await response.json();
			if (data.pasarelas) setConfigPasarelas(data.pasarelas);
			invalidarCachePasarelas();
			showFeedback(
				"success",
				`Imagen de ${configPasarelas[gatewayId]?.nombre} actualizada`,
			);
		} catch (error) {
			console.error(`Error subiendo imagen para pasarela ${gatewayId}:`, error);
			showFeedback("error", error.message || "Error al subir la imagen");
		} finally {
			setUploadingImagen(null);
		}
	};

	/**
	 * Elimina la imagen de una pasarela de Cloudinary.
	 */
	const handleEliminarImagenPasarela = async (gatewayId) => {
		try {
			setUploadingImagen(gatewayId);
			const response = await authenticatedFetch(
				`/api/configuracion/pasarelas-pago/${gatewayId}/imagen`,
				{ method: "DELETE" },
			);
			if (!response.ok) throw new Error("Error al eliminar imagen");
			const data = await response.json();
			if (data.pasarelas) setConfigPasarelas(data.pasarelas);
			invalidarCachePasarelas();
			showFeedback("success", "Imagen eliminada correctamente");
		} catch (error) {
			console.error(`Error eliminando imagen de pasarela ${gatewayId}:`, error);
			showFeedback("error", "Error al eliminar la imagen");
		} finally {
			setUploadingImagen(null);
		}
	};

	const handleGenerarOportunidades = async () => {
		try {
			setGenerandoOportunidades(true);
			setResultadoOportunidades(null);

			const response = await authenticatedFetch(`/api/oportunidades/generar`, {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error("Error al generar oportunidades");
			}

			const data = await response.json();
			setResultadoOportunidades(data);

			if (data.totalGeneradas > 0) {
				showFeedback(
					"success",
					`✅ ${data.totalGeneradas} oportunidades generadas exitosamente`,
				);
			} else {
				showFeedback(
					"success",
					"No se generaron nuevas oportunidades (ya existen o no hay reservas elegibles)",
				);
			}
		} catch (error) {
			console.error("Error generando oportunidades:", error);
			showFeedback("error", "Error al generar oportunidades");
			setResultadoOportunidades({ error: error.message });
		} finally {
			setGenerandoOportunidades(false);
		}
	};

	const handleRegenerarOportunidades = async () => {
		try {
			setGenerandoOportunidades(true);
			setResultadoOportunidades(null);

			const response = await authenticatedFetch(
				`/api/oportunidades/regenerar`,
				{
					method: "GET",
				},
			);

			if (!response.ok) {
				throw new Error("Error al regenerar oportunidades");
			}

			const data = await response.json();
			setResultadoOportunidades(data);

			showFeedback(
				"success",
				`✅ Eliminadas ${data.eliminadas} oportunidades antiguas. Generadas ${data.totalGeneradas} nuevas oportunidades`,
			);
		} catch (error) {
			console.error("Error regenerando oportunidades:", error);
			showFeedback("error", "Error al regenerar oportunidades");
			setResultadoOportunidades({ error: error.message });
		} finally {
			setGenerandoOportunidades(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="p-3 bg-primary/10 rounded-lg">
					<Settings className="w-6 h-6 text-primary" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						Configuración General
					</h1>
					<p className="text-gray-600">
						Gestiona las configuraciones globales del sistema
					</p>
				</div>
			</div>

			{/* Feedback Alert */}
			{feedback && (
				<Alert variant={feedback.type === "error" ? "destructive" : "default"}>
					{feedback.type === "success" ? (
						<CheckCircle className="h-4 w-4" />
					) : (
						<AlertCircle className="h-4 w-4" />
					)}
					<AlertDescription>{feedback.message}</AlertDescription>
				</Alert>
			)}

			{/* Configuración Modal WhatsApp */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-100 rounded-lg">
							<MessageCircle className="w-5 h-5 text-green-600" />
						</div>
						<div className="flex-1">
							<CardTitle>Modal de Intercepción de WhatsApp</CardTitle>
							<CardDescription>
								Controla si aparece el modal cuando los usuarios intentan
								contactar por WhatsApp
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Estado Actual */}
					<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
						<div className="flex items-center gap-3">
							<div
								className={`p-2 rounded-full ${
									whatsappInterceptActivo
										? "bg-green-100 text-green-600"
										: "bg-gray-200 text-gray-500"
								}`}
							>
								{whatsappInterceptActivo ? (
									<CheckCircle className="w-5 h-5" />
								) : (
									<XCircle className="w-5 h-5" />
								)}
							</div>
							<div>
								<p className="font-medium text-gray-900">
									Estado: {whatsappInterceptActivo ? "Activo" : "Inactivo"}
								</p>
								<p className="text-sm text-gray-600">
									{whatsappInterceptActivo
										? "El modal aparece antes de abrir WhatsApp"
										: "WhatsApp se abre directamente sin modal"}
								</p>
							</div>
						</div>

						{/* Toggle Switch */}
						<div className="flex items-center gap-3">
							<Switch
								checked={whatsappInterceptActivo}
								onCheckedChange={handleToggleWhatsApp}
								disabled={saving}
								className="data-[state=checked]:bg-green-600"
							/>
							{saving && (
								<Loader2 className="w-4 h-4 animate-spin text-gray-400" />
							)}
						</div>
					</div>

					{/* Información Adicional */}
					<div className="border-t pt-4">
						<h4 className="font-medium text-gray-900 mb-2">Comportamiento:</h4>
						<div className="space-y-2 text-sm text-gray-600">
							<div className="flex items-start gap-2">
								<CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
								<p>
									<strong>Activo:</strong> Muestra un modal incentivando la
									reserva online con información de descuentos y beneficios
									antes de abrir WhatsApp.
								</p>
							</div>
							<div className="flex items-start gap-2">
								<XCircle className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
								<p>
									<strong>Inactivo:</strong> Abre WhatsApp directamente sin
									mostrar el modal.
								</p>
							</div>
						</div>
					</div>

					{/* Nota sobre tracking */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
						<p className="text-sm text-blue-900">
							<strong>Nota:</strong> El tracking de conversiones de Google Ads
							se mantiene activo en ambos casos.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Generación Manual de Oportunidades */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-purple-100 rounded-lg">
							<Target className="w-5 h-5 text-purple-600" />
						</div>
						<div className="flex-1">
							<CardTitle>Generación Manual de Oportunidades</CardTitle>
							<CardDescription>
								Genera oportunidades de traslado desde reservas confirmadas
								existentes
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Información */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h4 className="font-medium text-blue-900 mb-2">
							ℹ️ ¿Qué hace esto?
						</h4>
						<div className="text-sm text-blue-800 space-y-1">
							<p>• Busca todas las reservas confirmadas con fechas futuras</p>
							<p>• Genera oportunidades con 50% de descuento para:</p>
							<p className="ml-4">- Retornos vacíos (destino → origen)</p>
							<p className="ml-4">- Idas vacías (Temuco → origen, si aplica)</p>
							<p className="mt-2">
								<strong>Nota:</strong> Las nuevas reservas generan oportunidades
								automáticamente. Este botón es solo para reservas existentes.
							</p>
						</div>
					</div>

					{/* Botones de generación */}
					<div className="grid grid-cols-2 gap-3">
						<Button
							onClick={handleGenerarOportunidades}
							disabled={generandoOportunidades}
							variant="default"
							size="lg"
						>
							{generandoOportunidades ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Generando...
								</>
							) : (
								<>
									<Target className="w-4 h-4 mr-2" />
									Generar Nuevas
								</>
							)}
						</Button>

						<Button
							onClick={handleRegenerarOportunidades}
							disabled={generandoOportunidades}
							variant="outline"
							size="lg"
							className="border-purple-300 text-purple-700 hover:bg-purple-50"
						>
							{generandoOportunidades ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Regenerando...
								</>
							) : (
								<>
									<Target className="w-4 h-4 mr-2" />
									Regenerar Todas
								</>
							)}
						</Button>
					</div>

					{/* Resultados */}
					{resultadoOportunidades && !resultadoOportunidades.error && (
						<div className="border-t pt-4">
							<div className="bg-green-50 border border-green-200 rounded-lg p-4">
								<div className="flex items-start gap-3">
									<CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
									<div className="flex-1">
										<h4 className="font-medium text-green-900 mb-2">
											Proceso Completado
										</h4>
										<p className="text-sm text-green-800 mb-3">
											Total generadas:{" "}
											<strong>{resultadoOportunidades.totalGeneradas}</strong>{" "}
											oportunidades
										</p>

										{resultadoOportunidades.detalles &&
											resultadoOportunidades.detalles.length > 0 && (
												<div className="space-y-2">
													<p className="text-sm font-medium text-green-900">
														Detalle por reserva:
													</p>
													<div className="max-h-40 overflow-y-auto space-y-1">
														{resultadoOportunidades.detalles.map(
															(detalle, idx) => (
																<div
																	key={idx}
																	className="text-xs bg-white rounded p-2"
																>
																	<p className="font-medium text-gray-900">
																		{detalle.reserva}
																	</p>
																	<p className="text-gray-600">
																		{detalle.oportunidades.join(", ")}
																	</p>
																</div>
															),
														)}
													</div>
												</div>
											)}

										<div className="mt-3 pt-3 border-t border-green-200">
											<a
												href="/oportunidades"
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm text-green-700 hover:text-green-800 font-medium underline"
											>
												→ Ver oportunidades generadas
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Error */}
					{resultadoOportunidades && resultadoOportunidades.error && (
						<div className="border-t pt-4">
							<div className="bg-red-50 border border-red-200 rounded-lg p-4">
								<div className="flex items-start gap-3">
									<XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
									<div>
										<h4 className="font-medium text-red-900 mb-1">Error</h4>
										<p className="text-sm text-red-800">
											{resultadoOportunidades.error}
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Configuración de Ofertas (Anticipación) */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 rounded-lg">
							<Clock className="w-5 h-5 text-blue-600" />
						</div>
						<div className="flex-1">
							<CardTitle>Anticipación de Ofertas</CardTitle>
							<CardDescription>
								Define cuántas horas antes del viaje deben expirar las ofertas
								automáticamente
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Anticipación Retornos (horas)
							</label>
							<Input
								type="number"
								value={configOfertas.anticipacionRetorno}
								onChange={(e) =>
									setConfigOfertas({
										...configOfertas,
										anticipacionRetorno: parseInt(e.target.value),
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Anticipación Idas (horas)
							</label>
							<Input
								type="number"
								value={configOfertas.anticipacionIda}
								onChange={(e) =>
									setConfigOfertas({
										...configOfertas,
										anticipacionIda: parseInt(e.target.value),
									})
								}
							/>
						</div>
					</div>
					<Button
						onClick={handleSaveExtras}
						disabled={saving}
						className="w-full"
					>
						{saving ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<Settings className="w-4 h-4 mr-2" />
						)}
						Guardar Configuración de Ofertas
					</Button>
				</CardContent>
			</Card>

			{/* Configuración de Sillas Infantiles */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-amber-100 rounded-lg">
							<Baby className="w-5 h-5 text-amber-600" />
						</div>
						<div className="flex-1">
							<CardTitle>Sillas Infantiles</CardTitle>
							<CardDescription>
								Gestiona la disponibilidad y el costo adicional de sillas para
								niños
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
						<div>
							<p className="font-medium text-gray-900">
								Ofrecer Silla Infantil
							</p>
							<p className="text-sm text-gray-600">
								Habilitar la opción en el formulario de reserva
							</p>
						</div>
						<Switch
							checked={configSillas.habilitado}
							onCheckedChange={(val) =>
								setConfigSillas({ ...configSillas, habilitado: val })
							}
							disabled={saving}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Máximo de Sillas por Reserva
							</label>
							<Input
								type="number"
								value={configSillas.maxSillas}
								onChange={(e) =>
									setConfigSillas({
										...configSillas,
										maxSillas: parseInt(e.target.value),
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Precio por Silla (CLP)
							</label>
							<Input
								type="number"
								value={configSillas.precioPorSilla}
								onChange={(e) =>
									setConfigSillas({
										...configSillas,
										precioPorSilla: parseInt(e.target.value),
									})
								}
							/>
						</div>
					</div>

					<Button
						onClick={handleSaveExtras}
						disabled={saving}
						variant="outline"
						className="w-full border-amber-200 text-amber-900 hover:bg-amber-50"
					>
						{saving ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<Settings className="w-4 h-4 mr-2" />
						)}
						Guardar Configuración de Sillas
					</Button>
				</CardContent>
			</Card>

			{/* ===== Configuración de Pasarelas de Pago ===== */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-indigo-100 rounded-lg">
							<CreditCard className="w-5 h-5 text-indigo-600" />
						</div>
						<div className="flex-1">
							<CardTitle>Pasarelas de Pago</CardTitle>
							<CardDescription>
								Habilita o deshabilita cada pasarela y sube una imagen
								representativa que reemplazará al botón genérico en todos los
								flujos de pago.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Sección por cada pasarela */}
					{[
						{
							id: "flow",
							label: "Flow",
							colorCls: "bg-blue-50 border-blue-200",
							badgeCls: "bg-blue-100 text-blue-800",
						},
						{
							id: "mercadopago",
							label: "Mercado Pago",
							colorCls: "bg-sky-50 border-sky-200",
							badgeCls: "bg-sky-100 text-sky-800",
						},
					].map(({ id, label, colorCls, badgeCls }) => {
						const cfg = configPasarelas[id] || {};
						const inputRef = id === "flow" ? inputFlowRef : inputMpRef;
						const estaSubiendo = uploadingImagen === id;
						return (
							<div
								key={id}
								className={`rounded-xl border p-4 space-y-4 ${colorCls}`}
							>
								{/* Encabezado pasarela */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<span
											className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}
										>
											{label}
										</span>
										<div>
											<p className="text-sm font-medium text-gray-900">
												{cfg.habilitado ? "Habilitada" : "Deshabilitada"}
											</p>
											<p className="text-xs text-gray-500">
												{cfg.habilitado
													? "Aparece en los formularios de pago"
													: "Oculta en todos los flujos de pago"}
											</p>
										</div>
									</div>
									<Switch
										checked={Boolean(cfg.habilitado)}
										onCheckedChange={(val) =>
											setConfigPasarelas((prev) => ({
												...prev,
												[id]: { ...prev[id], habilitado: val },
											}))
										}
										disabled={savingPasarelas}
										className="data-[state=checked]:bg-indigo-600"
									/>
								</div>

								{/* Nombre y descripción personalizable */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div className="space-y-1">
										<Label className="text-xs font-medium">
											Nombre visible
										</Label>
										<Input
											value={cfg.nombre || ""}
											onChange={(e) =>
												setConfigPasarelas((prev) => ({
													...prev,
													[id]: { ...prev[id], nombre: e.target.value },
												}))
											}
											placeholder={label}
											className="bg-white text-sm"
										/>
									</div>
									<div className="space-y-1">
										<Label className="text-xs font-medium">
											Descripción breve
										</Label>
										<Input
											value={cfg.descripcion || ""}
											onChange={(e) =>
												setConfigPasarelas((prev) => ({
													...prev,
													[id]: { ...prev[id], descripcion: e.target.value },
												}))
											}
											placeholder="Ej: Tarjeta / Débito"
											className="bg-white text-sm"
										/>
									</div>
								</div>

								{/* Imagen representativa */}
								<div className="space-y-2">
									<Label className="text-xs font-medium">
										Imagen representativa
									</Label>
									<div className="flex items-start gap-4">
										{/* Vista previa */}
										<div className="w-24 h-14 rounded-lg border bg-white flex items-center justify-center overflow-hidden shrink-0">
											{cfg.imagen_url ? (
												<img
													src={cfg.imagen_url}
													alt={`Logo ${label}`}
													className="w-full h-full object-contain p-1"
												/>
											) : (
												<ImageIcon className="w-8 h-8 text-gray-300" />
											)}
										</div>
										{/* Acciones */}
										<div className="flex flex-col gap-2 flex-1">
											<input
												ref={inputRef}
												type="file"
												accept="image/jpeg,image/png,image/gif,image/webp"
												className="hidden"
												onChange={(e) => {
													const archivo = e.target.files?.[0];
													if (archivo) handleSubirImagenPasarela(id, archivo);
													e.target.value = ""; // resetear input
												}}
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => inputRef.current?.click()}
												disabled={estaSubiendo}
												className="gap-2 text-xs"
											>
												{estaSubiendo ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<Upload className="w-3 h-3" />
												)}
												{cfg.imagen_url ? "Cambiar imagen" : "Subir imagen"}
											</Button>
											{cfg.imagen_url && (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => handleEliminarImagenPasarela(id)}
													disabled={estaSubiendo}
													className="gap-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
												>
													<Trash2 className="w-3 h-3" />
													Eliminar imagen
												</Button>
											)}
											<p className="text-[11px] text-gray-500">
												JPG, PNG, WebP • Máx. 5MB • Se guarda en Cloudinary
											</p>
										</div>
									</div>
								</div>
							</div>
						);
					})}

					{/* Botón guardar configuración de pasarelas */}
					<Button
						onClick={handleSavePasarelas}
						disabled={savingPasarelas}
						className="w-full gap-2"
					>
						{savingPasarelas ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<CreditCard className="w-4 h-4" />
						)}
						Guardar Configuración de Pasarelas
					</Button>

					{/* Nota informativa */}
					<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
						<p className="text-xs text-indigo-900">
							<strong>Nota:</strong> Los cambios se reflejan inmediatamente en
							todos los formularios de pago (Hero de Reserva, Consultar Reserva
							y Pagar con Código). Al deshabilitar una pasarela esta desaparece
							del selector de pago para los clientes.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default AdminConfiguracion;
