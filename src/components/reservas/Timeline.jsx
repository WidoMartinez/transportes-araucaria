import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
	Clock,
	Plus,
	RefreshCw,
	DollarSign,
	Edit,
	MessageSquare,
	Mail,
	CheckCircle2,
	AlertCircle
} from 'lucide-react';
import { TIPOS_EVENTO, ETIQUETAS_ESTADO } from '../../types/reservas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Timeline visual de actividad de una reserva
 * 
 * Muestra una línea de tiempo cronológica con todos los eventos
 * importantes de la reserva: creación, cambios de estado, asignaciones,
 * pagos, comentarios y notificaciones.
 * 
 * @param {Object} props
 * @param {Array} props.eventos - Lista de eventos del timeline
 * @param {string} props.eventos[].tipo - Tipo de evento
 * @param {string} props.eventos[].timestamp - Fecha y hora del evento (ISO 8601)
 * @param {string} props.eventos[].usuario - Usuario que realizó la acción
 * @param {Object} props.eventos[].datos - Datos específicos del evento
 * @param {boolean} [props.compacto] - Si debe mostrar versión compacta
 * @param {number} [props.limite] - Límite de eventos a mostrar
 */
const Timeline = ({ eventos = [], compacto = false, limite }) => {
	/**
	 * Obtiene el ícono según el tipo de evento
	 * @param {string} tipo - Tipo de evento
	 * @returns {JSX.Element} Componente de ícono
	 */
	const getIcono = (tipo) => {
		const iconProps = { className: "h-4 w-4" };
		
		switch (tipo) {
			case TIPOS_EVENTO.CREACION:
				return <Plus {...iconProps} />;
			case TIPOS_EVENTO.CAMBIO_ESTADO:
				return <RefreshCw {...iconProps} />;
			case TIPOS_EVENTO.ASIGNACION:
			case TIPOS_EVENTO.REASIGNACION:
				return <CheckCircle2 {...iconProps} />;
			case TIPOS_EVENTO.PAGO:
				return <DollarSign {...iconProps} />;
			case TIPOS_EVENTO.MODIFICACION:
				return <Edit {...iconProps} />;
			case TIPOS_EVENTO.COMENTARIO:
				return <MessageSquare {...iconProps} />;
			case TIPOS_EVENTO.NOTIFICACION:
				return <Mail {...iconProps} />;
			default:
				return <AlertCircle {...iconProps} />;
		}
	};

	/**
	 * Obtiene el color según el tipo de evento
	 * @param {string} tipo - Tipo de evento
	 * @returns {string} Clase de color
	 */
	const getColorClase = (tipo) => {
		switch (tipo) {
			case TIPOS_EVENTO.CREACION:
				return 'bg-blue-500';
			case TIPOS_EVENTO.CAMBIO_ESTADO:
				return 'bg-purple-500';
			case TIPOS_EVENTO.ASIGNACION:
			case TIPOS_EVENTO.REASIGNACION:
				return 'bg-green-500';
			case TIPOS_EVENTO.PAGO:
				return 'bg-emerald-500';
			case TIPOS_EVENTO.MODIFICACION:
				return 'bg-yellow-500';
			case TIPOS_EVENTO.COMENTARIO:
				return 'bg-gray-500';
			case TIPOS_EVENTO.NOTIFICACION:
				return 'bg-cyan-500';
			default:
				return 'bg-gray-400';
		}
	};

	/**
	 * Formatea el timestamp
	 * @param {string} timestamp - Timestamp ISO
	 * @returns {string} Fecha formateada
	 */
	const formatearFecha = (timestamp) => {
		try {
			if (compacto) {
				return format(new Date(timestamp), 'dd/MM/yy HH:mm', { locale: es });
			}
			return format(new Date(timestamp), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
		} catch {
			return 'Fecha inválida';
		}
	};

	/**
	 * Genera la descripción del evento
	 * @param {Object} evento - Evento a describir
	 * @returns {JSX.Element} Descripción formateada
	 */
	const getDescripcion = (evento) => {
		const { tipo, datos = {} } = evento;

		switch (tipo) {
			case TIPOS_EVENTO.CREACION:
				return <span>Reserva creada</span>;

			case TIPOS_EVENTO.CAMBIO_ESTADO:
				return (
					<span>
						Estado cambiado de{' '}
						<Badge variant="outline" className="text-xs mx-1">
							{ETIQUETAS_ESTADO[datos.estado_anterior] || datos.estado_anterior}
						</Badge>
						a{' '}
						<Badge variant="outline" className="text-xs mx-1">
							{ETIQUETAS_ESTADO[datos.estado_nuevo] || datos.estado_nuevo}
						</Badge>
						{datos.comentario && (
							<span className="block text-xs text-muted-foreground mt-1 italic">
								"{datos.comentario}"
							</span>
						)}
					</span>
				);

			case TIPOS_EVENTO.ASIGNACION:
				return (
					<span>
						Recursos asignados: {datos.vehiculo_nombre} / {datos.conductor_nombre}
					</span>
				);

			case TIPOS_EVENTO.REASIGNACION:
				return (
					<span>
						Recursos reasignados: {datos.vehiculo_nombre} / {datos.conductor_nombre}
						{datos.motivo && (
							<span className="block text-xs text-muted-foreground mt-1 italic">
								Motivo: {datos.motivo}
							</span>
						)}
					</span>
				);

			case TIPOS_EVENTO.PAGO:
				return (
					<span>
						Pago registrado:{' '}
						<span className="font-semibold">
							{new Intl.NumberFormat('es-CL', {
								style: 'currency',
								currency: 'CLP'
							}).format(datos.monto)}
						</span>
						{datos.metodo && (
							<Badge variant="secondary" className="text-xs ml-2">
								{datos.metodo}
							</Badge>
						)}
					</span>
				);

			case TIPOS_EVENTO.MODIFICACION:
				return <span>Datos de la reserva actualizados</span>;

			case TIPOS_EVENTO.COMENTARIO:
				return (
					<span>
						Comentario agregado
						{datos.comentario && (
							<span className="block text-xs text-muted-foreground mt-1 italic">
								"{datos.comentario}"
							</span>
						)}
					</span>
				);

			case TIPOS_EVENTO.NOTIFICACION:
				return (
					<span>
						Notificación enviada
						{datos.tipo && (
							<Badge variant="secondary" className="text-xs ml-2">
								{datos.tipo}
							</Badge>
						)}
					</span>
				);

			default:
				return <span>Evento desconocido</span>;
		}
	};

	// Filtrar eventos si hay límite
	const eventosAMostrar = limite ? eventos.slice(0, limite) : eventos;

	// Si no hay eventos
	if (eventosAMostrar.length === 0) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Timeline de Actividad
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p className="text-sm">No hay eventos registrados</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Timeline de Actividad
					</CardTitle>
					<Badge variant="outline">{eventosAMostrar.length} eventos</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{eventosAMostrar.map((evento, index) => (
						<div key={index} className="flex gap-4">
							{/* Línea vertical y punto */}
							<div className="flex flex-col items-center">
								<div className={`
									rounded-full p-2 ${getColorClase(evento.tipo)} 
									text-white flex items-center justify-center
								`}>
									{getIcono(evento.tipo)}
								</div>
								{index < eventosAMostrar.length - 1 && (
									<div className="w-0.5 h-full bg-border mt-2" />
								)}
							</div>

							{/* Contenido del evento */}
							<div className="flex-1 pb-8">
								<div className="space-y-1">
									{/* Descripción */}
									<div className={compacto ? 'text-sm' : 'text-base'}>
										{getDescripcion(evento)}
									</div>

									{/* Metadatos */}
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<span>{formatearFecha(evento.timestamp)}</span>
										<span>•</span>
										<span>Por {evento.usuario || 'Sistema'}</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Indicador de más eventos */}
				{limite && eventos.length > limite && (
					<div className="text-center pt-4 border-t">
						<p className="text-sm text-muted-foreground">
							+ {eventos.length - limite} eventos más
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default Timeline;
