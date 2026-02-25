import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
	DollarSign,
	TrendingUp,
	TrendingDown,
	CheckCircle2,
	AlertCircle,
	XCircle,
	Plus,
	History
} from 'lucide-react';
import { ESTADOS_PAGO } from '../../../types/reservas';

/**
 * Card con información financiera de la reserva
 * 
 * Muestra el resumen financiero incluyendo total, abono, saldo pendiente,
 * estado de pago e historial de transacciones.
 * 
 * @param {Object} props
 * @param {Object} props.financiero - Información financiera
 * @param {number} props.financiero.total - Total de la reserva
 * @param {number} [props.financiero.abono] - Abono pagado
 * @param {number} [props.financiero.saldo] - Saldo pendiente
 * @param {string} [props.financiero.estado_pago] - Estado del pago
 * @param {number} [props.financiero.descuento] - Descuento aplicado
 * @param {Array} [props.financiero.historial_pagos] - Historial de pagos
 * @param {boolean} [props.editable] - Si permite registrar pagos
 * @param {Function} [props.onRegistrarPago] - Callback para registrar pago
 */
const FinancieroCard = ({
	financiero,
	editable = false,
	onRegistrarPago
}) => {
	// Datos mock si no hay información financiera
	const financieroData = financiero || {
		total: 0,
		abono: 0,
		saldo: 0,
		estado_pago: ESTADOS_PAGO.SIN_PAGO,
		descuento: 0,
		historial_pagos: []
	};

	const {
		total,
		abono = 0,
		saldo = total,
		estado_pago,
		descuento = 0,
		historial_pagos = []
	} = financieroData;

	/**
	 * Formatea un monto a pesos chilenos
	 * @param {number} monto - Monto a formatear
	 * @returns {string} Monto formateado
	 */
	const formatearMonto = (monto) => {
		return new Intl.NumberFormat('es-CL', {
			style: 'currency',
			currency: 'CLP'
		}).format(monto);
	};

	/**
	 * Obtiene el badge del estado de pago
	 */
	const getBadgeEstadoPago = () => {
		switch (estado_pago) {
			case ESTADOS_PAGO.PAGADO:
				return (
					<Badge variant="default" className="flex items-center gap-1">
						<CheckCircle2 className="h-3 w-3" />
						Pagado
					</Badge>
				);
			case ESTADOS_PAGO.ABONO_PARCIAL:
				return (
					<Badge variant="secondary" className="flex items-center gap-1">
						<AlertCircle className="h-3 w-3" />
						Abono Parcial
					</Badge>
				);
			default:
				return (
					<Badge variant="destructive" className="flex items-center gap-1">
						<XCircle className="h-3 w-3" />
						Sin Pago
					</Badge>
				);
		}
	};

	/**
	 * Calcula el porcentaje pagado
	 */
	const porcentajePagado = total > 0 ? Math.round((abono / total) * 100) : 0;

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<DollarSign className="h-5 w-5" />
						Información Financiera
					</CardTitle>
					{getBadgeEstadoPago()}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Total de la reserva */}
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">Total de la Reserva</p>
					<p className="text-2xl font-bold">{formatearMonto(total)}</p>
				</div>

				{/* Descuento (si aplica) */}
				{descuento > 0 && (
					<div className="flex items-center justify-between pt-2 border-t">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<TrendingDown className="h-4 w-4 text-green-600" />
							<span>Descuento Aplicado</span>
						</div>
						<p className="text-sm font-medium text-green-600">
							-{formatearMonto(descuento)}
						</p>
					</div>
				)}

				{/* Abono pagado */}
				<div className="flex items-center justify-between pt-2 border-t">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<TrendingUp className="h-4 w-4" />
						<span>Abono Pagado</span>
					</div>
					<p className="text-sm font-semibold text-green-600">
						{formatearMonto(abono)}
					</p>
				</div>

				{/* Saldo pendiente */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<DollarSign className="h-4 w-4" />
						<span>Saldo Pendiente</span>
					</div>
					<p className={`text-sm font-semibold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
						{formatearMonto(saldo)}
					</p>
				</div>

				{/* Barra de progreso de pago */}
				<div className="space-y-2 pt-2 border-t">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Progreso de Pago</span>
						<span className="font-medium">{porcentajePagado}%</span>
					</div>
					<div className="w-full bg-secondary rounded-full h-2">
						<div
							className="bg-primary h-2 rounded-full transition-all duration-300"
							style={{ width: `${porcentajePagado}%` }}
						/>
					</div>
				</div>

				{/* Botón para registrar pago */}
				{editable && onRegistrarPago && saldo > 0 && (
					<div className="pt-4 border-t">
						<Button
							onClick={onRegistrarPago}
							className="w-full"
							variant={estado_pago === ESTADOS_PAGO.SIN_PAGO ? 'default' : 'outline'}
						>
							<Plus className="h-4 w-4 mr-2" />
							Registrar Pago
						</Button>
					</div>
				)}

				{/* Historial de pagos */}
				{historial_pagos.length > 0 && (
					<div className="pt-4 border-t space-y-3">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<History className="h-4 w-4" />
							<span>Historial de Pagos</span>
						</div>
						<div className="space-y-2">
							{historial_pagos.map((pago, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm"
								>
									<div className="space-y-1">
										<p className="font-medium">
											{formatearMonto(pago.monto)}
										</p>
										<p className="text-xs text-muted-foreground">
											{new Date(pago.fecha).toLocaleString('es-CL')}
										</p>
										{pago.metodo && (
											<Badge variant="outline" className="text-xs">
												{pago.metodo}
											</Badge>
										)}
									</div>
									{pago.referencia && (
										<div className="text-right">
											<p className="text-xs text-muted-foreground">
												Ref: {pago.referencia}
											</p>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Nota sobre saldo */}
				{saldo > 0 && (
					<div className="pt-2 border-t">
						<p className="text-xs text-muted-foreground text-center italic">
							El saldo pendiente debe ser pagado antes o al momento del servicio
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default FinancieroCard;
