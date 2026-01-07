import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { 
Settings, 
MessageCircle, 
CheckCircle, 
XCircle, 
Loader2,
AlertCircle 
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";

/**
 * Panel de Configuración General del Sistema
 * Permite gestionar configuraciones globales como el modal de WhatsApp
 */
function AdminConfiguracion() {
const [whatsappInterceptActivo, setWhatsappInterceptActivo] = useState(true);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [feedback, setFeedback] = useState(null);
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
`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/configuracion/whatsapp-intercept`
);

if (!response.ok) {
throw new Error("Error al cargar configuración");
}

const data = await response.json();
setWhatsappInterceptActivo(data.activo);
} catch (error) {
console.error("Error cargando configuración:", error);
showFeedback("error", "Error al cargar la configuración");
} finally {
setLoading(false);
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
			}
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
			`Modal de WhatsApp ${nuevoEstado ? "activado" : "desactivado"} correctamente`
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
<h1 className="text-2xl font-bold text-gray-900">Configuración General</h1>
<p className="text-gray-600">Gestiona las configuraciones globales del sistema</p>
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
Controla si aparece el modal cuando los usuarios intentan contactar por WhatsApp
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
{saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
</div>
</div>

{/* Información Adicional */}
<div className="border-t pt-4">
<h4 className="font-medium text-gray-900 mb-2">Comportamiento:</h4>
<div className="space-y-2 text-sm text-gray-600">
<div className="flex items-start gap-2">
<CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
<p>
<strong>Activo:</strong> Muestra un modal incentivando la reserva online con información
de descuentos y beneficios antes de abrir WhatsApp.
</p>
</div>
<div className="flex items-start gap-2">
<XCircle className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
<p>
<strong>Inactivo:</strong> Abre WhatsApp directamente sin mostrar el modal.
</p>
</div>
</div>
</div>

{/* Nota sobre tracking */}
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
<p className="text-sm text-blue-900">
<strong>Nota:</strong> El tracking de conversiones de Google Ads se mantiene activo en ambos casos.
</p>
</div>
</CardContent>
</Card>

{/* Sección para futuras configuraciones */}
<Card className="border-dashed">
<CardContent className="py-8 text-center">
<Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
<p className="text-gray-500 text-sm">
Más configuraciones estarán disponibles próximamente
</p>
</CardContent>
</Card>
</div>
);
}

export default AdminConfiguracion;
