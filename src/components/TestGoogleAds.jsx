/* global gtag */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
	CheckCircle,
	AlertCircle,
	Info,
	RefreshCw,
	Zap,
	Eye,
	Copy,
	ExternalLink
} from "lucide-react";

/**
 * Componente de Prueba para Etiqueta de Google Ads
 * 
 * Este componente permite verificar que la etiqueta de conversión de Google Ads
 * se dispara correctamente sin necesidad de realizar pagos reales.
 * 
 * SOLO PARA DESARROLLO Y TESTING
 * 
 * Nota: Este componente está disponible en todas las builds para permitir verificación
 * en staging/producción sin realizar pagos reales. El acceso puede controlarse mediante
 * rutas protegidas o variables de entorno si se desea restricción adicional.
 */
function TestGoogleAds() {
	const [testToken, setTestToken] = useState("TEST_TOKEN_" + Date.now());
	const [logs, setLogs] = useState([]);
	const [gtagAvailable, setGtagAvailable] = useState(false);
	const [eventFired, setEventFired] = useState(false);

	// Verificar disponibilidad de gtag al cargar
	useEffect(() => {
		const checkGtag = () => {
			const available = typeof gtag === "function";
			setGtagAvailable(available);
			addLog(
				available ? "✅ gtag está disponible" : "❌ gtag NO está disponible",
				available ? "success" : "error"
			);
		};
		
		// Dar tiempo a que se cargue gtag
		setTimeout(checkGtag, 500);
	}, []);

	const addLog = (message, type = "info") => {
		const timestamp = new Date().toLocaleTimeString("es-CL");
		setLogs(prev => [...prev, { message, type, timestamp }]);
	};

	const clearLogs = () => {
		setLogs([]);
		setEventFired(false);
	};

	const fireConversionEvent = () => {
		clearLogs();
		addLog("🚀 Iniciando prueba de evento de conversión...", "info");

		if (!gtagAvailable) {
			addLog("❌ ERROR: gtag no está disponible. Asegúrate de que el script de Google Ads esté cargado.", "error");
			return;
		}

		try {
			const conversionData = {
				send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB",
				value: 1.0,
				currency: "CLP",
				transaction_id: testToken,
				// Datos de prueba para conversiones avanzadas
				email: 'test@transportesaraucaria.cl',
				phone_number: '+56936643540',
				address: {
					first_name: 'usuario',
					last_name: 'prueba',
					country: 'CL'
				}
			};

			addLog(`📦 Datos de conversión preparados:`, "info");
			addLog(`   - send_to: ${conversionData.send_to}`, "info");
			addLog(`   - value: ${conversionData.value}`, "info");
			addLog(`   - currency: ${conversionData.currency}`, "info");
			addLog(`   - transaction_id: ${conversionData.transaction_id}`, "info");
			addLog(`   - email: ${conversionData.email}`, "info");
			addLog(`   - phone_number: ${conversionData.phone_number}`, "info");
			addLog(`   - address.first_name: ${conversionData.address.first_name}`, "info");
			addLog(`   - address.last_name: ${conversionData.address.last_name}`, "info");
			addLog(`   - address.country: ${conversionData.address.country}`, "info");

			gtag("event", "conversion", conversionData);
			
			addLog("✅ Evento de conversión Google Ads disparado exitosamente", "success");
			addLog(`🔑 Token usado: ${testToken}`, "success");
			addLog("📊 Conversiones avanzadas: Datos de usuario incluidos", "success");
			setEventFired(true);

			// Instrucciones post-disparo
			addLog("📊 Ahora verifica en DevTools → Network:", "info");
			addLog("   1. Busca peticiones a 'google-analytics.com' o 'doubleclick.net'", "info");
			addLog("   2. Verifica que el transaction_id aparezca en la petición", "info");
			addLog("   3. Verifica que los datos de usuario estén incluidos", "info");

		} catch (error) {
			addLog(`❌ ERROR al disparar evento: ${error.message}`, "error");
			console.error("Error detallado:", error);
		}
	};

	const generateNewToken = () => {
		const newToken = "TEST_TOKEN_" + Date.now();
		setTestToken(newToken);
		addLog(`🔄 Nuevo token generado: ${newToken}`, "info");
	};

	const copyToken = async () => {
		try {
			await navigator.clipboard.writeText(testToken);
			addLog(`📋 Token copiado al portapapeles: ${testToken}`, "success");
		} catch (error) {
			addLog(`❌ Error al copiar: ${error.message}. Copia manualmente el token.`, "error");
		}
	};

	const openFlowReturn = () => {
		const encodedToken = encodeURIComponent(testToken);
		const url = `/flow-return?token=${encodedToken}`;
		addLog(`🔗 Abriendo FlowReturn con token: ${testToken}`, "info");
		window.location.href = url;
	};

	const getLogIcon = (type) => {
		switch (type) {
			case "success":
				return <CheckCircle className="w-4 h-4 text-green-600" />;
			case "error":
				return <AlertCircle className="w-4 h-4 text-red-600" />;
			default:
				return <Info className="w-4 h-4 text-blue-600" />;
		}
	};

	const getLogColor = (type) => {
		switch (type) {
			case "success":
				return "text-green-700 bg-green-50 border-green-200";
			case "error":
				return "text-red-700 bg-red-50 border-red-200";
			default:
				return "text-blue-700 bg-blue-50 border-blue-200";
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
			<div className="max-w-5xl mx-auto space-y-6">
				{/* Header */}
				<div className="text-center">
					<h1 className="text-4xl font-bold text-slate-900 mb-2">
						🧪 Prueba de Etiqueta Google Ads
					</h1>
					<p className="text-slate-600 text-lg">
						Verifica el disparo de eventos de conversión sin realizar pagos reales
					</p>
					<Badge variant="outline" className="mt-2">
						Solo para desarrollo y testing
					</Badge>
				</div>

				{/* Estado de gtag */}
				<Alert className={gtagAvailable ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}>
					<div className="flex items-center gap-2">
						{gtagAvailable ? (
							<>
								<CheckCircle className="w-5 h-5 text-green-600" />
								<AlertDescription className="text-green-800">
									<strong>gtag disponible:</strong> El script de Google Ads se cargó correctamente.
								</AlertDescription>
							</>
						) : (
							<>
								<AlertCircle className="w-5 h-5 text-red-600" />
								<AlertDescription className="text-red-800">
									<strong>gtag no disponible:</strong> Asegúrate de que el script de Google Ads esté en index.html y no haya bloqueadores de anuncios activos.
								</AlertDescription>
							</>
						)}
					</div>
				</Alert>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Panel de Control */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Zap className="w-5 h-5" />
								Panel de Control
							</CardTitle>
							<CardDescription>
								Genera y dispara eventos de conversión de prueba
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Token Input */}
							<div className="space-y-2">
								<Label htmlFor="testToken">Token de Prueba (transaction_id)</Label>
								<div className="flex gap-2">
									<Input
										id="testToken"
										value={testToken}
										onChange={(e) => setTestToken(e.target.value)}
										className="font-mono text-sm"
										placeholder="TEST_TOKEN_123"
									/>
									<Button
										onClick={copyToken}
										variant="outline"
										size="icon"
										title="Copiar token"
									>
										<Copy className="w-4 h-4" />
									</Button>
								</div>
								<p className="text-xs text-muted-foreground">
									Este token se usará como transaction_id único para prevenir duplicados
								</p>
							</div>

							{/* Botones de Acción */}
							<div className="space-y-2">
								<Button
									onClick={fireConversionEvent}
									disabled={!gtagAvailable}
									className="w-full"
									size="lg"
								>
									<Zap className="w-4 h-4 mr-2" />
									Disparar Evento de Conversión
								</Button>

								<Button
									onClick={generateNewToken}
									variant="outline"
									className="w-full"
								>
									<RefreshCw className="w-4 h-4 mr-2" />
									Generar Nuevo Token
								</Button>

								<Button
									onClick={openFlowReturn}
									variant="secondary"
									className="w-full"
								>
									<ExternalLink className="w-4 h-4 mr-2" />
									Ir a /flow-return con este token
								</Button>

								<Button
									onClick={clearLogs}
									variant="ghost"
									className="w-full"
								>
									Limpiar Logs
								</Button>
							</div>

							{/* Estado del Evento */}
							{eventFired && (
								<Alert className="border-green-300 bg-green-50">
									<CheckCircle className="w-5 h-5 text-green-600" />
									<AlertDescription className="text-green-800">
										<strong>Evento disparado exitosamente.</strong> Revisa los logs y DevTools → Network.
									</AlertDescription>
								</Alert>
							)}
						</CardContent>
					</Card>

					{/* Panel de Logs */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Eye className="w-5 h-5" />
								Logs de Ejecución
							</CardTitle>
							<CardDescription>
								Seguimiento en tiempo real del disparo de eventos
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{logs.length === 0 ? (
									<p className="text-sm text-muted-foreground text-center py-8">
										No hay logs todavía. Dispara un evento para comenzar.
									</p>
								) : (
									logs.map((log, index) => (
										<div
											key={index}
											className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${getLogColor(log.type)}`}
										>
											{getLogIcon(log.type)}
											<div className="flex-1">
												<p className="font-mono whitespace-pre-wrap">{log.message}</p>
												<p className="text-xs opacity-70 mt-1">{log.timestamp}</p>
											</div>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Instrucciones */}
				<Card>
					<CardHeader>
						<CardTitle>📖 Instrucciones de Uso</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h3 className="font-semibold mb-2">1. Preparación</h3>
							<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
								<li>Abre DevTools del navegador (F12)</li>
								<li>Ve a la pestaña "Network" (Red)</li>
								<li>Filtra por "collect" o "google-analytics"</li>
								<li>Mantén la pestaña "Console" visible para ver logs</li>
							</ul>
						</div>

						<div>
							<h3 className="font-semibold mb-2">2. Disparar Evento</h3>
							<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
								<li>Haz clic en "Disparar Evento de Conversión"</li>
								<li>Revisa los logs en el panel derecho</li>
								<li>Verifica que aparezca "✅ Evento disparado exitosamente"</li>
							</ul>
						</div>

						<div>
							<h3 className="font-semibold mb-2">3. Verificar en Network</h3>
							<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
								<li>Busca peticiones a "google-analytics.com" o "doubleclick.net"</li>
								<li>Verifica que contenga el parámetro "transaction_id" con tu token</li>
								<li>Confirma que "send_to" sea "AW-17529712870/yZz-CJqiicUbEObh6KZB"</li>
							</ul>
						</div>

						<div>
							<h3 className="font-semibold mb-2">4. Probar FlowReturn</h3>
							<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
								<li>Haz clic en "Ir a /flow-return con este token"</li>
								<li>La página debería mostrar "¡Pago Exitoso!"</li>
								<li>El evento de conversión se disparará automáticamente</li>
								<li>Verifica en consola: "✅ Evento de conversión Google Ads disparado"</li>
							</ul>
						</div>

						<Alert>
							<Info className="w-4 h-4" />
							<AlertDescription>
								<strong>Nota:</strong> Los eventos disparados con tokens de prueba NO aparecerán en Google Ads.
								Solo los tokens reales de Flow (después de pagos exitosos) incrementarán el contador de conversiones.
							</AlertDescription>
						</Alert>
					</CardContent>
				</Card>

				{/* Información Técnica */}
				<Card>
					<CardHeader>
						<CardTitle>🔧 Información Técnica</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<Label className="text-muted-foreground">ID de Conversión</Label>
								<p className="font-mono">AW-17529712870</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Etiqueta de Conversión</Label>
								<p className="font-mono">yZz-CJqiicUbEObh6KZB</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Valor</Label>
								<p className="font-mono">1.0 CLP</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Evento</Label>
								<p className="font-mono">conversion</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Archivo de Implementación</Label>
								<p className="font-mono text-xs">src/components/FlowReturn.jsx</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Script de Google Ads</Label>
								<p className="font-mono text-xs">index.html (líneas 32-38)</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default TestGoogleAds;
