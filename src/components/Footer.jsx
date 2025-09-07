import React from "react";
import { Button } from "./ui/button";
import logoblanco from "../assets/logoblanco.png";

function Footer() {
	return (
		<footer className="bg-primary text-white py-12">
			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div>
						<div>
							<img
								src={logoblanco}
								alt="Transportes Araucaria Logo"
								className="h-26 mb-4"
							/>
						</div>
						<p className="opacity-90 mb-4">
							Tu mejor opción para traslados desde el Aeropuerto La Araucanía
							hacia toda la región.
						</p>
						<div className="flex space-x-4">
							<Button
								variant="outline"
								size="sm"
								className="text-white border-white hover:bg-white hover:text-primary"
							>
								Facebook
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="text-white border-white hover:bg-white hover:text-primary"
							>
								Instagram
							</Button>
						</div>
					</div>

					<div>
						<h4 className="text-lg font-semibold mb-4">Servicios</h4>
						<ul className="space-y-2 opacity-90">
							<li>Transfer Aeropuerto - Temuco</li>
							<li>Transfer Aeropuerto - Villarrica</li>
							<li>Transfer Aeropuerto - Pucón</li>
							<li>Tours personalizados</li>
							<li>Traslados empresariales</li>
						</ul>
					</div>

					<div>
						<h4 className="text-lg font-semibold mb-4">Destinos</h4>
						<ul className="space-y-2 opacity-90">
							<li>Temuco Centro</li>
							<li>Villarrica</li>
							<li>Pucón</li>
							<li>Lican Ray</li>
							<li>Curarrehue</li>
						</ul>
					</div>

					<div>
						<h4 className="text-lg font-semibold mb-4">Contacto</h4>
						<div className="space-y-2 opacity-90">
							<p>
								<a href="tel:+56936643540" className="hover:underline">
									+56 9 3664 3540
								</a>
							</p>
							<p>contacto@transportesaraucaria.cl</p>
							<p>Temuco, La Araucanía</p>
							<p>Disponible 24/7</p>
						</div>
					</div>
				</div>

				<div className="border-t border-white/20 mt-8 pt-8 text-center opacity-90">
					<p>
						&copy; 2024 Transportes Araucaria. Todos los derechos reservados.
					</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
