// src/components/Testimonios/SeccionTestimonios.jsx
// Sección pública de testimonios moderados por el administrador.
// Muestra únicamente las evaluaciones que el admin ha aprobado para publicar.

import { useState, useEffect } from "react";
import { Star, Quote, UserCircle2 } from "lucide-react";
import { getBackendUrl } from "../../lib/backend";

// Renderiza estrellas para una calificación
function Estrellas({ valor }) {
	const filled = Math.round(Number(valor) || 0);
	return (
		<div className="flex gap-0.5">
			{[1, 2, 3, 4, 5].map((i) => (
				<Star
					key={i}
					className={`h-4 w-4 ${
						i <= filled ? "fill-amber-400 text-amber-400" : "text-gray-300"
					}`}
				/>
			))}
		</div>
	);
}

// Formatea la fecha de un testimonio en formato "Mes AAAA"
function formatMesAnio(fechaStr) {
	if (!fechaStr) return "";
	const fecha = new Date(fechaStr);
	if (isNaN(fecha.getTime())) return "";
	return fecha.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

function SeccionTestimonios() {
	const apiUrl = getBackendUrl();
	const [testimonios, setTestimonios] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		const cargarTestimonios = async () => {
			try {
				const resp = await fetch(`${apiUrl}/api/testimonios`);
				if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
				const data = await resp.json();
				setTestimonios(Array.isArray(data) ? data : []);
			} catch (err) {
				console.error("[SeccionTestimonios] Error al cargar:", err);
				setError(true);
			} finally {
				setCargando(false);
			}
		};

		cargarTestimonios();
	}, [apiUrl]);

	// No mostrar nada mientras carga o si hay error o sin testimonios
	if (cargando || error || testimonios.length === 0) {
		return null;
	}

	return (
		<section className="py-20 bg-transparent">
			<div className="container mx-auto px-4">
				{/* Encabezado */}
				<div className="text-center mb-14">
					<div className="inline-block bg-amber-100 text-amber-800 text-sm font-semibold px-4 py-2 rounded-full mb-4">
						⭐ Opiniones verificadas
					</div>
					<h2 className="text-4xl font-bold text-gray-900 mb-4">
						Lo que dicen nuestros pasajeros
					</h2>
					<p className="text-xl text-gray-500 max-w-2xl mx-auto">
						Experiencias reales de personas que viajaron con Transportes
						Araucaria
					</p>
				</div>

				{/* Grid de tarjetas */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{testimonios.map((t) => (
						<div
							key={t.id}
							className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col border border-amber-100"
						>
							{/* Comillas decorativas */}
							<Quote className="h-8 w-8 text-amber-200 mb-3 flex-shrink-0" />

							{/* Comentario */}
							<p className="text-gray-700 text-base leading-relaxed flex-1 italic mb-4">
								"{t.comentario}"
							</p>

							{/* Estrellas */}
							<div className="mb-3">
								<Estrellas valor={t.calificacion} />
							</div>

							{/* Divisor */}
							<div className="border-t border-amber-100 pt-3">
								{/* Avatar, nombre, ruta y fecha */}
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										{/* Avatar con inicial del nombre o ícono genérico */}
										<div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
											{t.nombre ? (
												<span className="text-amber-700 font-bold text-sm uppercase">
													{t.nombre.charAt(0)}
												</span>
											) : (
												<UserCircle2 className="w-5 h-5 text-amber-400" />
											)}
										</div>
										<div>
											<p className="font-semibold text-gray-900 text-sm leading-tight">
												{t.nombre}
											</p>
											{t.origen && t.destino && (
												<p className="text-xs text-amber-700 mt-0.5">
													{t.origen} → {t.destino}
												</p>
											)}
										</div>
									</div>
									{t.fecha && (
										<span className="text-xs text-gray-400 whitespace-nowrap capitalize">
											{formatMesAnio(t.fecha)}
										</span>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default SeccionTestimonios;
