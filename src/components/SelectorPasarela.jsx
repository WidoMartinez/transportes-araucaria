/**
 * Componente reutilizable para seleccionar la pasarela de pago.
 * Lee la configuración del backend mediante el hook usePasarelasConfig.
 * Muestra solo las pasarelas habilitadas con su imagen o texto por defecto.
 * Se usa en HeroExpress, ConsultarReserva y PagarConCodigo.
 */
import { useEffect } from "react";
import { usePasarelasConfig } from "../hooks/usePasarelasConfig";

// Íconos de respaldo cuando no hay imagen configurada
const EMOJI_DEFAULT = {
	flow: "💳",
	mercadopago: "🟦",
};

/**
 * Props:
 * - pasarela {string}: pasarela actualmente seleccionada ("flow" | "mercadopago")
 * - onChange {function}: callback cuando el usuario cambia la selección
 * - className {string}: clases adicionales para el contenedor
 */
export default function SelectorPasarela({
	pasarela,
	onChange,
	className = "",
}) {
	const { pasarelasHabilitadas } = usePasarelasConfig();

	// Si la pasarela activa queda deshabilitada por cambio de config, auto-cambiar a la primera disponible
	useEffect(() => {
		if (pasarelasHabilitadas.length > 0) {
			const estaActiva = pasarelasHabilitadas.some((p) => p.id === pasarela);
			if (!estaActiva) {
				onChange(pasarelasHabilitadas[0].id);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pasarelasHabilitadas]);

	// Si la config ya cargó y solo hay una pasarela activa, no necesitamos selector
	// (la selección automática ya se hizo en el useEffect de arriba)
	if (pasarelasHabilitadas.length <= 1) {
		return null;
	}

	return (
		<div className={`space-y-1 ${className}`}>
			<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
				Método de pago
			</p>

			<div className="flex gap-2">
				{pasarelasHabilitadas.map((p) => {
					const activa = pasarela === p.id;
					return (
						<button
							key={p.id}
							type="button"
							onClick={() => onChange(p.id)}
							aria-pressed={activa}
							className={`flex-1 py-2 px-3 rounded-lg border-2 text-left transition-all flex items-center gap-2 min-h-[52px] ${
								activa
									? "border-primary bg-primary/5 text-primary"
									: "border-input text-muted-foreground hover:border-primary/50"
							}`}
						>
							{/* Imagen o emoji de respaldo */}
							{p.imagen_url ? (
								<img
									src={p.imagen_url}
									alt={p.nombre}
									className="h-7 w-auto max-w-[60px] object-contain shrink-0"
									loading="lazy"
								/>
							) : (
								<span className="text-lg shrink-0">
									{EMOJI_DEFAULT[p.id] ?? "💳"}
								</span>
							)}
							{/* Textos */}
							<div className="min-w-0">
								<p className="text-xs font-semibold leading-tight truncate">
									{p.nombre}
								</p>
								{p.descripcion && (
									<p className="text-[10px] text-muted-foreground leading-tight truncate">
										{p.descripcion}
									</p>
								)}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
