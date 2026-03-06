import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { Settings2 } from "lucide-react";

export function DialogoColumnas({
	columnasVisibles,
	setColumnasVisibles,
	COLUMN_DEFINITIONS,
	DEFAULT_COLUMNAS_VISIBLES,
	COLUMNAS_STORAGE_KEY,
}) {
	const handleRestablecer = () => {
		setColumnasVisibles(DEFAULT_COLUMNAS_VISIBLES);
		try {
			localStorage.setItem(
				COLUMNAS_STORAGE_KEY,
				JSON.stringify(DEFAULT_COLUMNAS_VISIBLES)
			);
		} catch (e) {
			console.warn("No se pudo restablecer columnas en localStorage:", e);
		}
	};

	const handleGuardar = () => {
		try {
			localStorage.setItem(
				COLUMNAS_STORAGE_KEY,
				JSON.stringify(columnasVisibles)
			);
			alert("Configuración de columnas guardada");
		} catch {
			alert("No se pudo guardar la configuración");
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Settings2 className="w-4 h-4 mr-2" />
					Columnas
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Configurar Columnas Visibles</DialogTitle>
					<DialogDescription>
						Selecciona las columnas que deseas ver en la tabla
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					{COLUMN_DEFINITIONS.map(({ key, label }) => (
						<div key={key} className="flex items-center space-x-2">
							<input
								type="checkbox"
								id={`col-${key}`}
								checked={Boolean(columnasVisibles[key])}
								onChange={(e) =>
									setColumnasVisibles({
										...columnasVisibles,
										[key]: e.target.checked,
									})
								}
								className="w-4 h-4"
							/>
							<Label htmlFor={`col-${key}`} className="cursor-pointer">
								{label}
							</Label>
						</div>
					))}
				</div>
				<div className="flex justify-end gap-2 mt-4">
					<Button variant="outline" onClick={handleRestablecer}>
						Restablecer columnas
					</Button>
					<Button onClick={handleGuardar}>Guardar columnas</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
