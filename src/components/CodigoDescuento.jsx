import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CheckCircle2, XCircle, LoaderCircle } from "lucide-react";
import { Badge } from "./ui/badge";

function CodigoDescuento({
	codigoAplicado,
	codigoError,
	validandoCodigo,
	onAplicarCodigo,
	onRemoverCodigo,
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

	return (
		<div className="space-y-4">
			{/* Campo para ingresar código */}
			{!codigoAplicado && (
                                <form onSubmit={handleSubmit} className="space-y-3">
                                        <div className="flex gap-3">
                                                <Input
                                                        placeholder="Ej: VERANO2024, ESTUDIANTE10K, PRIMERAVEZ"
                                                        value={codigoInput}
                                                        onChange={(e) => setCodigoInput(e.target.value)}
                                                        className="flex-1 text-lg font-medium border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                                        disabled={validandoCodigo}
                                                />
                                                <Button
                                                        type="submit"
                                                        disabled={!codigoInput.trim() || validandoCodigo}
                                                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                                >
                                                        {validandoCodigo ? (
                                                                <LoaderCircle className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                                "Aplicar código"
                                                        )}
                                                </Button>
                                        </div>
                                        <p className="text-xs text-blue-600 font-medium">
                                                Los códigos se aplican automáticamente al resumen de precios
                                        </p>
                                </form>
                        )}

			{/* Mostrar código aplicado */}
			{codigoAplicado && (
                                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 shadow-lg">
                                        <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                                                <CheckCircle2 className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                                <p className="font-bold text-green-800 text-lg">
                                                                        Código aplicado: {codigoAplicado.codigo}
                                                                </p>
								<p className="text-sm text-green-700 font-medium">
									{codigoAplicado.descripcion}
								</p>
								<p className="text-sm text-green-600">
									{codigoAplicado.tipo === "porcentaje"
										? `Descuento: ${codigoAplicado.valor}%`
										: `Descuento: ${formatCurrency(codigoAplicado.valor)}`}
								</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRemover}
							className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
						>
							<XCircle className="w-5 h-5" />
						</Button>
					</div>
				</div>
			)}

			{/* Mostrar error */}
			{codigoError && (
                                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 shadow-lg">
                                        <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                                                        <XCircle className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                        <p className="font-bold text-red-800 text-lg">
                                                                Código inválido
                                                        </p>
							<p className="text-sm text-red-600 font-medium">{codigoError}</p>
						</div>
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
