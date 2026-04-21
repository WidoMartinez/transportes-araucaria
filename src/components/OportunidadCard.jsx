import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	ArrowRight,
	Clock,
	Calendar,
	MapPin,
	Car,
	Users,
	Percent,
	CheckCircle2,
} from "lucide-react";

/**
 * Componente para mostrar una tarjeta de oportunidad individual
 * @param {Object} oportunidad - Datos de la oportunidad
 * @param {Function} onReservar - Callback cuando se hace clic en reservar
 */
function OportunidadCard({ oportunidad, onReservar }) {
	const getTipoBadge = (tipo) => {
		if (tipo === "retorno_vacio") {
			return (
				<Badge
					variant="secondary"
					className="rounded-full bg-primary/10 px-3 py-1 text-primary"
				>
					Retorno disponible
				</Badge>
			);
		}
		return (
			<Badge
				variant="secondary"
				className="rounded-full bg-secondary/15 px-3 py-1 text-secondary"
			>
				Ida disponible
			</Badge>
		);
	};

	const formatFecha = (fecha) => {
		const opciones = {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		};
		return new Date(fecha + "T00:00:00").toLocaleDateString("es-CL", opciones);
	};

	const formatPrecio = (precio) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
			minimumFractionDigits: 0,
		}).format(precio);
	};

	return (
		<Card className="h-full rounded-[2rem] border-border/60 bg-card/95 py-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
			<CardHeader className="space-y-4 px-5 pb-0">
				<div className="flex items-start justify-between gap-2">
					{getTipoBadge(oportunidad.tipo)}
					<Badge className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
						-{oportunidad.descuento}%
					</Badge>
				</div>
				<CardTitle className="text-lg leading-tight md:text-xl">
					<div className="flex items-center gap-2">
						<MapPin className="h-4 w-4 text-secondary md:h-5 md:w-5" />
						<span className="line-clamp-1">{oportunidad.origen}</span>
						<ArrowRight className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" />
						<MapPin className="h-4 w-4 text-secondary md:h-5 md:w-5" />
						<span className="line-clamp-1">{oportunidad.destino}</span>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 px-5 pt-4">
				<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
					<div className="flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						<span>{formatFecha(oportunidad.fecha)}</span>
					</div>
					{oportunidad.horaAproximada && (
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4" />
							<span>Aprox. {oportunidad.horaAproximada}</span>
						</div>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
					<div className="flex items-center gap-2">
						<Car className="h-4 w-4" />
						<span>{oportunidad.vehiculo}</span>
					</div>
					<div className="flex items-center gap-2">
						<Users className="h-4 w-4" />
						<span>{oportunidad.capacidad}</span>
					</div>
				</div>

				<div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="text-sm text-muted-foreground line-through">
								{formatPrecio(oportunidad.precioOriginal)}
							</p>
							<p className="text-3xl font-bold text-secondary">
								{formatPrecio(oportunidad.precioFinal)}
							</p>
						</div>
						<Badge
							variant="outline"
							className="w-fit rounded-full border-secondary/30 bg-background/80 text-secondary"
						>
							<Percent className="mr-1 h-4 w-4" />
							Ahorra {formatPrecio(oportunidad.precioOriginal - oportunidad.precioFinal)}
						</Badge>
					</div>
				</div>

				<div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
					<p className="text-sm text-foreground">
						<strong>¿Por qué este precio?</strong>
						<br />
						{oportunidad.motivoDescuento}
					</p>
				</div>

				<div className="space-y-2">
					<div className="flex items-center gap-2 text-sm text-primary">
						<CheckCircle2 className="h-4 w-4" />
						<span>Traslado 100% privado solo para tu grupo</span>
					</div>
					<div className="flex items-center gap-2 text-sm text-primary">
						<CheckCircle2 className="h-4 w-4" />
						<span>Mismo estándar premium del servicio regular</span>
					</div>
					<div className="flex items-center gap-2 text-sm text-primary">
						<CheckCircle2 className="h-4 w-4" />
						<span>Conductor profesional certificado</span>
					</div>
				</div>

				<Button
					onClick={() => onReservar(oportunidad)}
					className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
					size="lg"
				>
					Reservar ahora
					<ArrowRight className="ml-2 h-5 w-5" />
				</Button>

				{oportunidad.validoHasta && (
					<p className="text-center text-xs text-muted-foreground">
						Válido hasta: {new Date(oportunidad.validoHasta).toLocaleString("es-CL")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

export default OportunidadCard;
