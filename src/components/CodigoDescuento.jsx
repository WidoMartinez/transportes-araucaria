import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CheckCircle2, XCircle, LoaderCircle, Gift } from "lucide-react";
import { Badge } from "./ui/badge";

function CodigoDescuento({
	codigoAplicado,
	onCodigoChange,
	onAplicarCodigo,
	onRemoverCodigo,
	isValidating,
	error,
	precioBase,
}) {
	const [codigoInput, setCodigoInput] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		if (codigoInput.trim()) {
			onAplicarCodigo(codigoInput.trim().toUpperCase());
			setCodigoInput("");
		}
	};

	const handleRemover = () => {
		onRemoverCodigo();
		setCodigoInput("");
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const calcularDescuento = (codigo) => {
		if (codigo.tipo === "porcentaje") {
			return Math.round(precioBase * (codigo.valor / 100));
		} else {
			return Math.min(codigo.valor, precioBase);
		}
	};

	return (
		<div className="space-y-3">
			{/* Campo para ingresar código */}
			{!codigoAplicado && (
				<form onSubmit={handleSubmit} className="flex gap-2">
					<Input
						placeholder="Ingresa tu código de descuento"
						value={codigoInput}
						onChange={(e) => setCodigoInput(e.target.value)}
						className="flex-1"
						disabled={isValidating}
					/>
					<Button
						type="submit"
						disabled={!codigoInput.trim() || isValidating}
						className="bg-purple-600 hover:bg-purple-700"
					>
						{isValidating ? (
							<LoaderCircle className="w-4 h-4 animate-spin" />
						) : (
							"Aplicar"
						)}
					</Button>
				</form>
			)}

			{/* Mostrar código aplicado */}
			{codigoAplicado && (
				<div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="w-5 h-5 text-green-600" />
						<div>
							<p className="font-semibold text-green-800">
								Código aplicado: {codigoAplicado.codigo}
							</p>
							<p className="text-sm text-green-600">
								{codigoAplicado.descripcion}
							</p>
							<p className="text-sm text-green-600">
								Descuento: {formatCurrency(calcularDescuento(codigoAplicado))}
								{codigoAplicado.tipo === "porcentaje" && (
									<span> ({codigoAplicado.valor}%)</span>
								)}
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleRemover}
						className="text-red-600 hover:text-red-700 hover:bg-red-50"
					>
						<XCircle className="w-4 h-4" />
					</Button>
				</div>
			)}

			{/* Mostrar error */}
			{error && (
				<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
					<XCircle className="w-5 h-5 text-red-600" />
					<div>
						<p className="font-semibold text-red-800">Código inválido</p>
						<p className="text-sm text-red-600">{error}</p>
					</div>
				</div>
			)}

			{/* Información adicional */}
			{codigoAplicado && (
				<div className="text-xs text-slate-500 space-y-1">
					{codigoAplicado.combinable && (
						<Badge variant="secondary" className="text-xs">
							Combinable con otros descuentos
						</Badge>
					)}
					{codigoAplicado.exclusivo && (
						<Badge variant="destructive" className="text-xs">
							Exclusivo - reemplaza otros descuentos
						</Badge>
					)}
					{codigoAplicado.fechaVencimiento && (
						<p>
							Válido hasta:{" "}
							{new Date(codigoAplicado.fechaVencimiento).toLocaleDateString(
								"es-CL"
							)}
						</p>
					)}
				</div>
			)}
		</div>
	);
}

export default CodigoDescuento;
