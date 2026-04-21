import React, { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Slider } from "./ui/slider";
import { Bell, BadgeCheck, Mail, MapPin, Percent } from "lucide-react";
import { getBackendUrl } from "../lib/backend";
import { cn } from "@/lib/utils";

/**
 * Componente para suscribirse a alertas de oportunidades
 */
function SuscripcionOportunidades() {
	const [formData, setFormData] = useState({
		email: "",
		nombre: "",
		descuentoMinimo: 40,
	});

	const [rutasSeleccionadas, setRutasSeleccionadas] = useState([]);
	const [loading, setLoading] = useState(false);
	const [mensaje, setMensaje] = useState(null);

	// Rutas comunes para seleccionar
	const rutasComunes = [
		{ origen: "Temuco", destino: "Pucón" },
		{ origen: "Pucón", destino: "Temuco" },
		{ origen: "Temuco", destino: "Villarrica" },
		{ origen: "Villarrica", destino: "Temuco" },
		{ origen: "Aeropuerto Temuco", destino: "Pucón" },
		{ origen: "Pucón", destino: "Aeropuerto Temuco" },
		{ origen: "Aeropuerto Temuco", destino: "Villarrica" },
		{ origen: "Villarrica", destino: "Aeropuerto Temuco" },
	];

	const toggleRuta = (ruta) => {
		const rutaStr = `${ruta.origen}-${ruta.destino}`;
		const exists = rutasSeleccionadas.find(
			(r) => `${r.origen}-${r.destino}` === rutaStr,
		);

		if (exists) {
			setRutasSeleccionadas(
				rutasSeleccionadas.filter(
					(r) => `${r.origen}-${r.destino}` !== rutaStr,
				),
			);
		} else {
			setRutasSeleccionadas([...rutasSeleccionadas, ruta]);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMensaje(null);

		if (!formData.email || rutasSeleccionadas.length === 0) {
			setMensaje({
				tipo: "error",
				texto: "Por favor completa el email y selecciona al menos una ruta",
			});
			setLoading(false);
			return;
		}

		try {
			const response = await fetch(`${getBackendUrl()}/api/oportunidades/suscribir`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					rutas: rutasSeleccionadas,
				}),
			});

			const data = await response.json();

			if (data.success) {
				setMensaje({
					tipo: "success",
					texto:
						"¡Suscripción exitosa! Te notificaremos cuando haya oportunidades en tus rutas.",
				});
				setFormData({ email: "", nombre: "", descuentoMinimo: 40 });
				setRutasSeleccionadas([]);
			} else {
				setMensaje({
					tipo: "error",
					texto: data.error || "Error al crear suscripción",
				});
			}
		} catch (error) {
			console.error("Error:", error);
			setMensaje({
				tipo: "error",
				texto: "Error de conexión. Por favor intenta nuevamente.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="mx-auto max-w-5xl overflow-hidden rounded-[2.25rem] border-border/60 bg-card/95 shadow-xl">
			<CardHeader className="bg-primary px-6 py-8 text-primary-foreground md:px-8">
				<div className="flex items-start gap-4 md:gap-5">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md">
						<Bell className="h-7 w-7 animate-pulse-subtle" />
					</div>
					<div className="space-y-1.5">
						<CardTitle className="text-2xl font-bold tracking-tight md:text-3xl">
							Recibe alertas de oportunidades
						</CardTitle>
						<CardDescription className="text-sm text-primary-foreground/85 md:text-base">
							Te avisaremos por email cuando aparezcan traslados disponibles en
							tus rutas favoritas y con descuento mínimo definido por ti.
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-6 py-6 md:px-8">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="email" className="flex items-center gap-2 text-sm">
								<Mail className="h-4 w-4 text-secondary" />
								Email *
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="tu@email.com"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								required
								className="h-11 rounded-xl border-input"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="nombre" className="text-sm">
								Nombre (opcional)
							</Label>
							<Input
								id="nombre"
								type="text"
								placeholder="Tu nombre"
								value={formData.nombre}
								onChange={(e) =>
									setFormData({ ...formData, nombre: e.target.value })
								}
								className="h-11 rounded-xl border-input"
							/>
						</div>
					</div>

					<div className="space-y-3">
						<Label className="flex items-center gap-2 text-sm">
							<MapPin className="h-4 w-4 text-secondary" />
							Selecciona tus rutas de interés *
						</Label>
						<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
							{rutasComunes.map((ruta, index) => {
								const rutaStr = `${ruta.origen}-${ruta.destino}`;
								const isSelected = rutasSeleccionadas.find(
									(r) => `${r.origen}-${r.destino}` === rutaStr,
								);
								return (
									<Button
										key={index}
										type="button"
										variant={isSelected ? "default" : "outline"}
										className={cn(
											"h-auto min-h-12 justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-all",
											isSelected
												? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
												: "border-border bg-background text-foreground hover:bg-muted",
										)}
										onClick={() => toggleRuta(ruta)}
									>
										<span>{ruta.origen} → {ruta.destino}</span>
										{isSelected && <BadgeCheck className="h-5 w-5" />}
									</Button>
								);
							})}
						</div>
						<p className="text-xs text-muted-foreground">
							Seleccionadas: {rutasSeleccionadas.length} ruta(s)
						</p>
					</div>

					<div className="space-y-4 rounded-2xl border border-border/60 bg-muted/40 p-4">
						<Label htmlFor="descuentoMinimo" className="flex items-center gap-2 text-sm">
							<Percent className="h-4 w-4 text-secondary" />
							Descuento mínimo para notificar: {formData.descuentoMinimo}%
						</Label>
						<Slider
							id="descuentoMinimo"
							min={30}
							max={70}
							step={5}
							value={[formData.descuentoMinimo]}
							onValueChange={(value) =>
								setFormData({
									...formData,
									descuentoMinimo: value[0] ?? 40,
								})
							}
						/>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>30%</span>
							<span>50%</span>
							<span>70%</span>
						</div>
					</div>

					{mensaje && (
						<Alert
							variant={mensaje.tipo === "error" ? "destructive" : "default"}
							className={
								mensaje.tipo === "success"
									? "border-primary/20 bg-primary/10 text-primary"
									: ""
							}
						>
							<AlertDescription>{mensaje.texto}</AlertDescription>
						</Alert>
					)}

					<Button
						type="submit"
						className="h-11 w-full rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90"
						disabled={loading}
					>
						{loading ? "Suscribiendo..." : "Suscribirme a alertas"}
					</Button>

					<p className="text-center text-xs text-muted-foreground">
						Podrás cancelar tu suscripción en cualquier momento.
					</p>
				</form>
			</CardContent>
		</Card>
	);
}

export default SuscripcionOportunidades;
