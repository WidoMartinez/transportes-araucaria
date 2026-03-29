import re

with open('src/pages/LandingTraslados.jsx', 'r') as f:
    content = f.read()

hero_section_pattern = re.compile(
    r'({\/\* ========== HERO ========== \*\/}\s*<section.*?>).*?({\/\* ========== FORMULARIO DE COTIZACIÓN ========== \*\/})',
    re.DOTALL
)

new_hero = """{/* ========== HERO ========== */}
			<section className="relative py-24 md:py-32 flex items-center justify-center min-h-[600px] bg-black">
				{/* Background Image */}
				<div className="absolute inset-0 w-full h-full">
					<img
						src={heroVan}
						alt="Transporte Privado"
						className="w-full h-full object-cover opacity-60"
					/>
					<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/60" />
				</div>

				<div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center w-full">
					<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
						Tu viaje perfecto, comienza aquí
					</h1>
					<p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl font-medium">
						Transporte seguro y confortable para llegar a donde necesites.
					</p>

					{/* Horizontal Booking Form */}
					<div className="w-full max-w-5xl bg-white rounded-2xl md:rounded-full p-4 md:p-3 shadow-2xl mx-auto">
						<div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_1fr_1fr] gap-3 items-end w-full">
							<div className="relative bg-gray-50 rounded-xl md:rounded-full px-4 py-3 border border-gray-100 flex items-center gap-3">
								<MapPin className="h-5 w-5 text-gray-400 shrink-0" />
								<input type="text" name="origen" value={form.origen} onChange={handleChange} placeholder="Origen" className="bg-transparent border-none outline-hidden w-full text-sm font-medium text-gray-900 placeholder:text-gray-500" />
							</div>
							<div className="relative bg-gray-50 rounded-xl md:rounded-full px-4 py-3 border border-gray-100 flex items-center gap-3">
								<MapPin className="h-5 w-5 text-gray-400 shrink-0" />
								<input type="text" name="destino" value={form.destino} onChange={handleChange} placeholder="Destino" className="bg-transparent border-none outline-hidden w-full text-sm font-medium text-gray-900 placeholder:text-gray-500" />
							</div>
							<div className="relative bg-gray-50 rounded-xl md:rounded-full px-4 py-3 border border-gray-100 flex items-center gap-3">
								<Users className="h-5 w-5 text-gray-400 shrink-0" />
								<input type="number" name="pasajeros" min="1" max="20" value={form.pasajeros} onChange={handleChange} placeholder="Pasajeros" className="bg-transparent border-none outline-hidden w-full text-sm font-medium text-gray-900 placeholder:text-gray-500" />
							</div>
							<div className="relative bg-gray-50 rounded-xl md:rounded-full px-4 py-3 border border-gray-100 flex items-center gap-3">
								<Calendar className="h-5 w-5 text-gray-400 shrink-0" />
								<input type="date" name="fecha" value={form.fecha} onChange={handleChange} className="bg-transparent border-none outline-hidden w-full text-sm font-medium text-gray-900" />
							</div>
							<Button
								onClick={() =>
									document
										.getElementById("formulario-cotizacion")
										?.scrollIntoView({ behavior: "smooth" })
								}
								className="w-full h-full min-h-[50px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl md:rounded-full font-bold text-base transition-transform active:scale-95"
							>
								Reservar
							</Button>
						</div>
					</div>
				</div>
			</section>

			"""

new_content = hero_section_pattern.sub(new_hero + r'\2', content)

with open('src/pages/LandingTraslados.jsx', 'w') as f:
    f.write(new_content)

print("Hero updated successfully!")
