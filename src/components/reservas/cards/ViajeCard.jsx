import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
	MapPin,
	Calendar,
	Clock,
	Users,
	ArrowRight,
	ArrowRightLeft,
	Plane,
	Building2,
	Briefcase
} from 'lucide-react';
import { TIPOS_VIAJE } from '../../../types/reservas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Card con detalles del viaje
 * 
 * Muestra la información completa del viaje incluyendo origen, destino,
 * fechas, horarios, número de pasajeros e información adicional.
 * 
 * @param {Object} props
 * @param {Object} props.viaje - Datos del viaje
 * @param {string} props.viaje.origen - Lugar de origen
 * @param {string} props.viaje.destino - Lugar de destino
 * @param {string} props.viaje.fecha - Fecha del viaje (ISO 8601)
 * @param {string} props.viaje.hora - Hora del viaje (HH:mm)
 * @param {number} props.viaje.pasajeros - Número de pasajeros
 * @param {string} props.viaje.tipo - Tipo de viaje (ida/ida_vuelta)
 * @param {Object} [props.viaje.regreso] - Información de regreso (si aplica)
 * @param {string} [props.viaje.numero_vuelo] - Número de vuelo
 * @param {string} [props.viaje.hotel] - Hotel de destino
 * @param {boolean} [props.viaje.equipaje_extra] - Indica equipaje extra
 * @param {string} [props.viaje.observaciones] - Observaciones adicionales
 */
const ViajeCard = ({ viaje }) => {
	// Datos mock si no hay viaje
	const viajeData = viaje || {
		origen: 'Sin información',
		destino: 'Sin información',
		fecha: new Date().toISOString(),
		hora: '00:00',
		pasajeros: 0,
		tipo: TIPOS_VIAJE.IDA
	};

	const {
		origen,
		destino,
		fecha,
		hora,
		pasajeros,
		tipo,
		regreso,
		numero_vuelo,
		hotel,
		equipaje_extra,
		observaciones
	} = viajeData;

	/**
	 * Formatea una fecha para mostrar
	 * @param {string} fechaISO - Fecha en formato ISO
	 * @returns {string} Fecha formateada
	 */
	const formatearFecha = (fechaISO) => {
		try {
			return format(new Date(fechaISO), "d 'de' MMMM 'de' yyyy", { locale: es });
		} catch {
			return 'Fecha inválida';
		}
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<MapPin className="h-5 w-5" />
						Detalles del Viaje
					</CardTitle>
					<Badge variant={tipo === TIPOS_VIAJE.IDA_VUELTA ? 'default' : 'secondary'}>
						{tipo === TIPOS_VIAJE.IDA_VUELTA ? (
							<span className="flex items-center gap-1">
								<ArrowRightLeft className="h-3 w-3" />
								Ida y Vuelta
							</span>
						) : (
							<span className="flex items-center gap-1">
								<ArrowRight className="h-3 w-3" />
								Solo Ida
							</span>
						)}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Ruta de viaje */}
				<div className="space-y-2">
					<div className="flex items-start gap-3">
						<div className="flex-1">
							<p className="text-sm text-muted-foreground">Origen</p>
							<p className="font-medium text-lg">{origen}</p>
						</div>
						<ArrowRight className="h-5 w-5 mt-6 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm text-muted-foreground">Destino</p>
							<p className="font-medium text-lg">{destino}</p>
						</div>
					</div>
				</div>

				{/* Fecha y hora de ida */}
				<div className="grid grid-cols-2 gap-4 pt-2 border-t">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Calendar className="h-4 w-4" />
							<span>Fecha de Ida</span>
						</div>
						<p className="text-sm font-medium">{formatearFecha(fecha)}</p>
					</div>
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Clock className="h-4 w-4" />
							<span>Hora</span>
						</div>
						<p className="text-sm font-medium">{hora}</p>
					</div>
				</div>

				{/* Fecha y hora de regreso (si aplica) */}
				{tipo === TIPOS_VIAJE.IDA_VUELTA && regreso && (
					<div className="grid grid-cols-2 gap-4 pt-2 border-t">
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Calendar className="h-4 w-4" />
								<span>Fecha de Regreso</span>
							</div>
							<p className="text-sm font-medium">
								{formatearFecha(regreso.fecha)}
							</p>
						</div>
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Clock className="h-4 w-4" />
								<span>Hora</span>
							</div>
							<p className="text-sm font-medium">{regreso.hora}</p>
						</div>
					</div>
				)}

				{/* Número de pasajeros */}
				<div className="space-y-1 pt-2 border-t">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Users className="h-4 w-4" />
						<span>Pasajeros</span>
					</div>
					<p className="text-lg font-semibold">{pasajeros}</p>
				</div>

				{/* Información adicional */}
				{(numero_vuelo || hotel || equipaje_extra) && (
					<div className="space-y-3 pt-2 border-t">
						<p className="text-sm font-medium text-muted-foreground">
							Información Adicional
						</p>

						{numero_vuelo && (
							<div className="flex items-center gap-2 text-sm">
								<Plane className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">Vuelo:</span>
								<span className="font-medium">{numero_vuelo}</span>
							</div>
						)}

						{hotel && (
							<div className="flex items-center gap-2 text-sm">
								<Building2 className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">Hotel:</span>
								<span className="font-medium">{hotel}</span>
							</div>
						)}

						{equipaje_extra && (
							<div className="flex items-center gap-2 text-sm">
								<Briefcase className="h-4 w-4 text-muted-foreground" />
								<Badge variant="secondary">Equipaje Extra</Badge>
							</div>
						)}
					</div>
				)}

				{/* Observaciones */}
				{observaciones && (
					<div className="space-y-1 pt-2 border-t">
						<p className="text-sm font-medium text-muted-foreground">
							Observaciones
						</p>
						<p className="text-sm text-muted-foreground italic">
							{observaciones}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default ViajeCard;
