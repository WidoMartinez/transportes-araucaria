import { MapPin, Mountain, Plane, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const IMAGENES_AVATAR = [
	"/avatares/testimonio-1.svg",
	"/avatares/testimonio-2.svg",
	"/avatares/testimonio-3.svg",
	"/avatares/testimonio-4.svg",
];

const PRESETS_AVATAR = {
	aeropuerto: {
		Icono: Plane,
		badgeClassName: "bg-[#8C5E42] text-white",
		fallbackClassName: "bg-[#8C5E42]/10 text-[#8C5E42]",
	},
	grupo: {
		Icono: Users,
		badgeClassName: "bg-forest-600 text-white",
		fallbackClassName: "bg-forest-600/10 text-forest-600",
	},
	turismo: {
		Icono: Mountain,
		badgeClassName: "bg-[#C4895E] text-white",
		fallbackClassName: "bg-[#C4895E]/15 text-[#8C5E42]",
	},
	default: {
		Icono: MapPin,
		badgeClassName: "bg-slate-900 text-white",
		fallbackClassName: "bg-slate-900/5 text-forest-600",
	},
};

function obtenerIniciales(nombre = "") {
	const partes = nombre.trim().split(/\s+/).filter(Boolean);

	if (partes.length === 0) return "TA";
	if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

	return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function obtenerIndiceAvatar(nombre = "") {
	const texto = nombre.trim() || "transportes-araucaria";
	let acumulado = 0;

	for (let indice = 0; indice < texto.length; indice += 1) {
		acumulado = (acumulado + texto.charCodeAt(indice)) % IMAGENES_AVATAR.length;
	}

	return acumulado;
}

function resolverPresetAvatar({ origen, destino, comentario }) {
	const texto = `${origen || ""} ${destino || ""} ${comentario || ""}`.toLowerCase();

	if (
		texto.includes("grupo") ||
		texto.includes("van") ||
		texto.includes("personas")
	) {
		return PRESETS_AVATAR.grupo;
	}

	if (
		texto.includes("aeropuerto") ||
		texto.includes("vuelo") ||
		texto.includes("terminal")
	) {
		return PRESETS_AVATAR.aeropuerto;
	}

	if (
		/(pucón|pucon|villarrica|lican|coñaripe|conaripe|liquiñe|liquine|malalcahuello|conguillío|conguillio|volcán|volcan|caburgua|curarrehue|araucanía|araucania)/.test(
			texto,
		)
	) {
		return PRESETS_AVATAR.turismo;
	}

	return PRESETS_AVATAR.default;
}

function AvatarPasajeroComentario({
	nombre,
	origen,
	destino,
	comentario,
	className,
	compacto = false,
}) {
	const preset = resolverPresetAvatar({ origen, destino, comentario });
	const { Icono, badgeClassName, fallbackClassName } = preset;
	const imagenAvatar = IMAGENES_AVATAR[obtenerIndiceAvatar(nombre)];

	return (
		<div
			className={cn(
				"relative isolate h-12 w-12 shrink-0",
				compacto && "h-11 w-11",
				className,
			)}
		>
			<Avatar className="h-full w-full rounded-2xl border border-forest-600/10 bg-white shadow-sm">
				<AvatarImage src={imagenAvatar} alt={nombre || "Pasajero verificado"} className="object-cover" />
				<AvatarFallback
					className={cn(
						"rounded-2xl font-bold uppercase tracking-[0.08em]",
						compacto ? "text-sm" : "text-base",
						fallbackClassName,
					)}
				>
					{obtenerIniciales(nombre)}
				</AvatarFallback>
			</Avatar>

			<span
				className={cn(
					"absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-sm",
					badgeClassName,
				)}
			>
				<Icono className="h-2.5 w-2.5" />
			</span>
		</div>
	);
}

export default AvatarPasajeroComentario;