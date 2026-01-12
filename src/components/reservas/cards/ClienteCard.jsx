import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { User, Mail, Phone, FileText, Star } from 'lucide-react';
import { TIPOS_CLIENTE } from '../../../types/reservas';

/**
 * Card con información del cliente
 * 
 * Muestra los datos principales del cliente asociado a una reserva,
 * incluyendo su tipo (cliente/cotizador) e indicadores de cliente frecuente.
 * 
 * @param {Object} props
 * @param {Object} props.cliente - Datos del cliente
 * @param {string} props.cliente.nombre - Nombre completo
 * @param {string} props.cliente.email - Email de contacto
 * @param {string} props.cliente.telefono - Teléfono de contacto
 * @param {string} [props.cliente.rut] - RUT del cliente
 * @param {string} props.cliente.tipo - Tipo de cliente (cliente/cotizador)
 * @param {boolean} [props.cliente.es_frecuente] - Indica si es cliente frecuente
 * @param {number} [props.cliente.total_reservas] - Total de reservas del cliente
 * @param {boolean} [props.editable] - Si permite edición (futuro)
 * @param {Function} [props.onEdit] - Callback al editar (futuro)
 */
const ClienteCard = ({
	cliente,
	editable = false,
	onEdit
}) => {
	// Datos mock si no hay cliente
	const clienteData = cliente || {
		nombre: 'Sin información',
		email: 'N/A',
		telefono: 'N/A',
		rut: null,
		tipo: TIPOS_CLIENTE.COTIZADOR,
		es_frecuente: false,
		total_reservas: 0
	};

	const {
		nombre,
		email,
		telefono,
		rut,
		tipo,
		es_frecuente,
		total_reservas
	} = clienteData;

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<User className="h-5 w-5" />
						Información del Cliente
					</CardTitle>
					<div className="flex gap-2">
						{es_frecuente && (
							<Badge variant="default" className="flex items-center gap-1">
								<Star className="h-3 w-3" />
								Frecuente
							</Badge>
						)}
						<Badge
							variant={tipo === TIPOS_CLIENTE.CLIENTE ? 'default' : 'secondary'}
						>
							{tipo === TIPOS_CLIENTE.CLIENTE ? 'Cliente' : 'Cotizador'}
						</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Nombre */}
				<div className="space-y-1">
					<p className="text-sm text-muted-foreground">Nombre Completo</p>
					<p className="font-medium">{nombre}</p>
				</div>

				{/* Email */}
				<div className="space-y-1">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Mail className="h-4 w-4" />
						<span>Email</span>
					</div>
					<a
						href={`mailto:${email}`}
						className="text-sm text-blue-600 hover:underline"
					>
						{email}
					</a>
				</div>

				{/* Teléfono */}
				<div className="space-y-1">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Phone className="h-4 w-4" />
						<span>Teléfono</span>
					</div>
					<a
						href={`tel:${telefono}`}
						className="text-sm text-blue-600 hover:underline"
					>
						{telefono}
					</a>
				</div>

				{/* RUT (opcional) */}
				{rut && (
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<FileText className="h-4 w-4" />
							<span>RUT</span>
						</div>
						<p className="text-sm">{rut}</p>
					</div>
				)}

				{/* Estadísticas del cliente */}
				{total_reservas > 0 && (
					<div className="pt-4 border-t">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Total de Reservas</span>
							<Badge variant="outline">{total_reservas}</Badge>
						</div>
					</div>
				)}

				{/* Botón de edición (futuro) */}
				{editable && onEdit && (
					<div className="pt-4">
						<button
							onClick={onEdit}
							className="text-sm text-blue-600 hover:underline"
						>
							Editar información del cliente
						</button>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default ClienteCard;
