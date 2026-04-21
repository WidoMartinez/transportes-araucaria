import React, { useEffect, useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "./ui/card";
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
	ExternalLink,
	Trash2,
} from "lucide-react";

const LEAD_SEND_TO = "AW-17529712870/8GVlCLP-05MbEObh6KZB";
const PURCHASE_SEND_TO = "AW-17529712870/yZz-CJqiicUbEObh6KZB";

function normalizePhoneToE164(phone) {
	if (!phone) return "";
	let cleaned = phone.replace(/[\s\-()]/g, "");
	if (cleaned.startsWith("+56")) return cleaned;
	if (cleaned.startsWith("56")) return `+${cleaned}`;
	if (cleaned.startsWith("9") && cleaned.length >= 9) return `+56${cleaned}`;
	return `+56${cleaned}`;
}

function encodeUserDataToD({ email, nombre, telefono }) {
	const payload = {
		email: (email || "").trim(),
		nombre: (nombre || "").trim(),
		telefono: (telefono || "").trim(),
	};
	const bytes = new TextEncoder().encode(JSON.stringify(payload));
	let binary = "";
	bytes.forEach((b) => {
		binary += String.fromCharCode(b);
	});
	return encodeURIComponent(btoa(binary));
}

function TestGoogleAds() {
	const [logs, setLogs] = useState([]);
	const [gtagAvailable, setGtagAvailable] = useState(false);
	const [token, setToken] = useState(`TEST_${Date.now()}`);
	const [reservaId, setReservaId] = useState("900001");
	const [amount, setAmount] = useState("59670");
	const [email, setEmail] = useState("test@transportesaraucaria.cl");
	const [nombre, setNombre] = useState("Usuario Prueba");
	const [telefono, setTelefono] = useState("+56987654321");

	const parsedAmount = Number(amount);
	const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

	const addLog = (message, type = "info") => {
		const timestamp = new Date().toLocaleTimeString("es-CL");
		setLogs((prev) => [...prev, { message, type, timestamp }]);
	};

	const clearLogs = () => setLogs([]);

	const refreshGtagStatus = () => {
		const available =
			typeof window !== "undefined" && typeof window.gtag === "function";
		setGtagAvailable(available);
		addLog(
			available
				? "gtag disponible para pruebas."
				: "gtag no disponible. Revisa bloqueadores y carga de script.",
			available ? "success" : "error",
		);
		return available;
	};

	useEffect(() => {
		const t = setTimeout(() => refreshGtagStatus(), 500);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const waitForGtag = (timeoutMs = 3000) =>
		new Promise((resolve) => {
			if (typeof window !== "undefined" && typeof window.gtag === "function") {
				resolve(true);
				return;
			}
			const startTime = Date.now();
			const iv = setInterval(() => {
				if (
					typeof window !== "undefined" &&
					typeof window.gtag === "function"
				) {
					clearInterval(iv);
					resolve(true);
				} else if (Date.now() - startTime >= timeoutMs) {
					clearInterval(iv);
					resolve(false);
				}
			}, 50);
		});

	const encodedD = useMemo(
		() => encodeUserDataToD({ email, nombre, telefono }),
		[email, nombre, telefono],
	);

	const simulatedTransactionId = useMemo(() => {
		const suffix = token ? token.substring(0, 8) : Date.now().toString().slice(-8);
		return reservaId ? `${reservaId}_${suffix}` : `test_${suffix}`;
	}, [reservaId, token]);

	const flowSuccessUrl = useMemo(() => {
		const q = new URLSearchParams({
			token,
			status: "success",
			reserva_id: reservaId,
			amount: String(parsedAmount || ""),
			d: encodedD,
		});
		return `/flow-return?${q.toString()}`;
	}, [token, reservaId, parsedAmount, encodedD]);

	const mpSuccessUrl = useMemo(() => {
		const q = new URLSearchParams({
			status: "success",
			reserva_id: reservaId,
			amount: String(parsedAmount || ""),
			collection_id: token,
			payment_id: token,
			d: encodedD,
		});
		return `/mp-return?${q.toString()}`;
	}, [token, reservaId, parsedAmount, encodedD]);

	const expressSuccessUrl = useMemo(() => {
		const q = new URLSearchParams({
			flow_payment: "success",
			token,
			reserva_id: reservaId,
			amount: String(parsedAmount || ""),
			d: encodedD,
		});
		return `/?${q.toString()}`;
	}, [token, reservaId, parsedAmount, encodedD]);

	const validateScenario = () => {
		if (!amountValid) {
			addLog("Monto invalido. Debe ser numerico y mayor a 0.", "error");
			return false;
		}
		if (!token.trim()) {
			addLog("Token de prueba vacio.", "error");
			return false;
		}
		return true;
	};

	const buildUserData = () => {
		const userData = {};
		if (email) userData.email = email.toLowerCase().trim();
		if (telefono) userData.phone_number = normalizePhoneToE164(telefono);
		if (nombre) {
			const nameParts = nombre.trim().split(" ");
			userData.address = {
				first_name: nameParts[0]?.toLowerCase() || "",
				last_name: nameParts.slice(1).join(" ")?.toLowerCase() || "",
				country: "CL",
			};
		}
		return userData;
	};

	const triggerLeadDirect = async () => {
		clearLogs();
		addLog("Iniciando prueba Lead directa...", "info");
		if (!validateScenario()) return;
		const gtagReady = await waitForGtag();
		if (!gtagReady) {
			addLog("No se pudo obtener gtag dentro del timeout.", "error");
			return;
		}
		const userData = buildUserData();
		if (Object.keys(userData).length > 0) {
			window.gtag("set", "user_data", userData);
			addLog("Enhanced Conversions: user_data enviado con gtag set.", "success");
		}
		window.gtag("event", "conversion", { send_to: LEAD_SEND_TO });
		addLog(`Lead enviado a ${LEAD_SEND_TO}.`, "success");
	};

	const triggerPurchaseDirect = async () => {
		clearLogs();
		addLog("Iniciando prueba Purchase directa...", "info");
		if (!validateScenario()) return;
		const gtagReady = await waitForGtag();
		if (!gtagReady) {
			addLog("No se pudo obtener gtag dentro del timeout.", "error");
			return;
		}
		const userData = buildUserData();
		if (Object.keys(userData).length > 0) {
			window.gtag("set", "user_data", userData);
			addLog("Enhanced Conversions: user_data enviado con gtag set.", "success");
		}
		const conversionData = {
			send_to: PURCHASE_SEND_TO,
			value: parsedAmount,
			currency: "CLP",
			transaction_id: simulatedTransactionId,
		};
		window.gtag("event", "conversion", conversionData);
		addLog(
			`Purchase enviado. value=${parsedAmount}, transaction_id=${simulatedTransactionId}.`,
			"success",
		);
	};

	const navigateToSimulatedReturn = (url, label) => {
		clearLogs();
		if (!validateScenario()) return;
		addLog(`Abriendo simulacion ${label}...`, "info");
		addLog(`URL: ${url}`, "info");
		window.location.href = url;
	};

	const generateNewToken = () => {
		const newToken = `TEST_${Date.now()}`;
		setToken(newToken);
		addLog(`Nuevo token generado: ${newToken}`, "success");
	};

	const clearDedupKeys = () => {
		const prefixes = [
			"conversion_sent_",
			"flow_conversion_",
			"flow_conversion_express_",
			"mp_conversion_",
		];
		const sessionKeys = Object.keys(sessionStorage);
		let removed = 0;
		sessionKeys.forEach((k) => {
			if (prefixes.some((p) => k.startsWith(p))) {
				sessionStorage.removeItem(k);
				removed++;
			}
		});
		addLog(`Deduplicacion limpia. Keys eliminadas: ${removed}.`, "success");
	};

	const getLogIcon = (type) => {
		if (type === "success") return <CheckCircle className="w-4 h-4 text-green-600" />;
		if (type === "error") return <AlertCircle className="w-4 h-4 text-red-600" />;
		return <Info className="w-4 h-4 text-chocolate-600" />;
	};

	const getLogColor = (type) => {
		if (type === "success") return "text-green-700 bg-green-50 border-green-200";
		if (type === "error") return "text-red-700 bg-red-50 border-red-200";
		return "text-chocolate-700 bg-chocolate-50 border-chocolate-200";
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
			<div className="max-w-6xl mx-auto space-y-6">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-slate-900 mb-2">
						Pruebas Google Ads sin pago real
					</h1>
					<p className="text-slate-600">
						Simula retornos de pago con monto y Enhanced Conversions.
					</p>
					<Badge variant="outline" className="mt-2">
						Ruta: /test-google-ads
					</Badge>
				</div>

				<Alert className={gtagAvailable ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}>
					<div className="flex items-center gap-2">
						{gtagAvailable ? (
							<>
								<CheckCircle className="w-5 h-5 text-green-600" />
								<AlertDescription className="text-green-800">
									gtag disponible para pruebas.
								</AlertDescription>
							</>
						) : (
							<>
								<AlertCircle className="w-5 h-5 text-red-600" />
								<AlertDescription className="text-red-800">
									gtag no disponible. Revisa carga de script o adblock.
								</AlertDescription>
							</>
						)}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={refreshGtagStatus}
							className="ml-auto"
						>
							<RefreshCw className="w-4 h-4 mr-2" />
							Revisar
						</Button>
					</div>
				</Alert>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Escenario de prueba</CardTitle>
							<CardDescription>
								Define monto y datos de usuario para simular un pago aprobado.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="space-y-1">
									<Label>Token transaccion</Label>
									<Input value={token} onChange={(e) => setToken(e.target.value)} />
								</div>
								<div className="space-y-1">
									<Label>Reserva ID</Label>
									<Input
										value={reservaId}
										onChange={(e) => setReservaId(e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Monto (CLP)</Label>
									<Input value={amount} onChange={(e) => setAmount(e.target.value)} />
								</div>
								<div className="space-y-1">
									<Label>Email</Label>
									<Input value={email} onChange={(e) => setEmail(e.target.value)} />
								</div>
								<div className="space-y-1">
									<Label>Nombre</Label>
									<Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
								</div>
								<div className="space-y-1">
									<Label>Telefono</Label>
									<Input
										value={telefono}
										onChange={(e) => setTelefono(e.target.value)}
									/>
								</div>
							</div>

							<div className="flex flex-wrap gap-2">
								<Button type="button" variant="outline" onClick={generateNewToken}>
									<RefreshCw className="w-4 h-4 mr-2" />
									Nuevo token
								</Button>
								<Button type="button" variant="outline" onClick={clearDedupKeys}>
									<Trash2 className="w-4 h-4 mr-2" />
									Limpiar dedupe
								</Button>
								<Button type="button" variant="ghost" onClick={clearLogs}>
									Limpiar logs
								</Button>
							</div>

							<div className="space-y-2">
								<Button type="button" className="w-full" onClick={triggerLeadDirect}>
									<Zap className="w-4 h-4 mr-2" />
									Probar Lead directo
								</Button>
								<Button
									type="button"
									className="w-full"
									variant="secondary"
									onClick={triggerPurchaseDirect}
								>
									<Zap className="w-4 h-4 mr-2" />
									Probar Purchase directo con monto
								</Button>
								<Button
									type="button"
									className="w-full"
									variant="outline"
									onClick={() =>
										navigateToSimulatedReturn(flowSuccessUrl, "FlowReturn success")
									}
								>
									<ExternalLink className="w-4 h-4 mr-2" />
									Simular /flow-return success
								</Button>
								<Button
									type="button"
									className="w-full"
									variant="outline"
									onClick={() =>
										navigateToSimulatedReturn(mpSuccessUrl, "MPReturn success")
									}
								>
									<ExternalLink className="w-4 h-4 mr-2" />
									Simular /mp-return success
								</Button>
								<Button
									type="button"
									className="w-full"
									variant="outline"
									onClick={() =>
										navigateToSimulatedReturn(expressSuccessUrl, "App express success")
									}
								>
									<ExternalLink className="w-4 h-4 mr-2" />
									Simular /?flow_payment=success
								</Button>
							</div>

							<Alert>
								<Info className="w-4 h-4" />
								<AlertDescription>
									Se usa amount como valor de compra. Si es invalido, los retornos reales
									pueden caer al fallback.
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Eye className="w-5 h-5" />
								Logs
							</CardTitle>
							<CardDescription>
								Verifica llamadas y payloads sin pagar una reserva.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2 max-h-[520px] overflow-y-auto">
								{logs.length === 0 ? (
									<p className="text-sm text-muted-foreground py-6 text-center">
										Sin logs aun.
									</p>
								) : (
									logs.map((log, i) => (
										<div
											key={`${log.timestamp}-${i}`}
											className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${getLogColor(log.type)}`}
										>
											{getLogIcon(log.type)}
											<div className="flex-1">
												<p className="font-mono whitespace-pre-wrap break-all">
													{log.message}
												</p>
												<p className="text-xs opacity-70 mt-1">{log.timestamp}</p>
											</div>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>URLs de simulacion</CardTitle>
						<CardDescription>
							Puedes abrirlas manualmente para repetir pruebas.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<Label>FlowReturn success</Label>
							<p className="text-xs font-mono break-all bg-slate-100 p-2 rounded">
								{flowSuccessUrl}
							</p>
						</div>
						<div>
							<Label>MPReturn success</Label>
							<p className="text-xs font-mono break-all bg-slate-100 p-2 rounded">
								{mpSuccessUrl}
							</p>
						</div>
						<div>
							<Label>App express success</Label>
							<p className="text-xs font-mono break-all bg-slate-100 p-2 rounded">
								{expressSuccessUrl}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default TestGoogleAds;
