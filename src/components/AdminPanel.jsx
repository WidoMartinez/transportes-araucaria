import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function AdminPanel({ destinos, setDestinos }) {
	const [localDestinos, setLocalDestinos] = useState(destinos);

	useEffect(() => {
		setLocalDestinos(destinos);
	}, [destinos]);

	const handlePriceChange = (destinoIndex, vehicleType, newPrice) => {
		const updatedDestinos = [...localDestinos];
		updatedDestinos[destinoIndex].precios[vehicleType].base = parseInt(
			newPrice,
			10
		);
		setLocalDestinos(updatedDestinos);
	};

	const handleSave = () => {
		setDestinos(localDestinos);
		alert("Precios actualizados exitosamente!");
	};

	return (
		<section id="admin-panel" className="py-20 bg-muted/40">
			<div className="container mx-auto px-4">
				<Card className="max-w-4xl mx-auto">
					<CardHeader>
						<CardTitle className="text-2xl text-center">
							Panel de Administración de Precios
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						{localDestinos.map((destino, index) => (
							<div key={destino.nombre} className="border p-4 rounded-lg">
								<h3 className="text-xl font-semibold mb-4">{destino.nombre}</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{Object.keys(destino.precios).map((vehicleType) => (
										<div key={vehicleType}>
											<Label htmlFor={`${destino.nombre}-${vehicleType}`}>
												Precio Base (
												{vehicleType.charAt(0).toUpperCase() +
													vehicleType.slice(1)}
												)
											</Label>
											<Input
												id={`${destino.nombre}-${vehicleType}`}
												type="number"
												value={destino.precios[vehicleType].base}
												onChange={(e) =>
													handlePriceChange(index, vehicleType, e.target.value)
												}
											/>
										</div>
									))}
								</div>
							</div>
						))}
						<Button onClick={handleSave} className="w-full mt-6">
							Guardar Cambios
						</Button>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}

export default AdminPanel;
