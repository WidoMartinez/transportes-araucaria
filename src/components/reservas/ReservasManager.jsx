import React, { useEffect, useState } from 'react';
import { useReservas } from '../../contexts/ReservasContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
	LayoutList,
	LayoutGrid,
	Calendar as CalendarIcon,
	RefreshCw,
	Plus,
	Search,
	Filter
} from 'lucide-react';
import { VISTAS_GESTOR, ETIQUETAS_ESTADO } from '../../types/reservas';
import ClienteCard from './cards/ClienteCard';
import ViajeCard from './cards/ViajeCard';
import AsignacionCard from './cards/AsignacionCard';
import FinancieroCard from './cards/FinancieroCard';
import Timeline from './Timeline';
import ActionPanel from './ActionPanel';

/**
 * Gestor Integral de Reservas - Componente Principal
 * 
 * Componente contenedor principal que integra todas las funcionalidades
 * del nuevo sistema de gestión de reservas. Proporciona:
 * - Navegación entre vistas (Lista, Kanban, Calendario)
 * - Toolbar con acciones globales
 * - Visualización de detalles de reserva
 * - Sistema de notificaciones
 * - Manejo de errores
 * 
 * @component
 */
const ReservasManager = () => {
	const {
		reservas,
		selectedReserva,
		loading,
		error,
		vistaActiva,
		filtros,
		fetchReservas,
		setSelectedReserva,
		cambiarVista,
		clearFilters
	} = useReservas();

	const [mostrarFiltros, setMostrarFiltros] = useState(false);

	// Cargar reservas al montar el componente
	useEffect(() => {
		// Solo cargar si no hay reservas y no está cargando
		if (reservas.length === 0 && !loading) {
			// En esta fase inicial, usamos datos mock
			// En fases futuras se descomentaría: fetchReservas();
		}
	}, []);

	/**
	 * Datos mock para demostración
	 * En fases futuras, esto se reemplazará con datos reales del backend
	 */
	const reservaMock = {
		id: 1,
		codigo: 'AR-20231208-0001',
		estado: 'confirmada',
		cliente: {
			nombre: 'Juan Pérez González',
			email: 'juan.perez@example.com',
			telefono: '+56912345678',
			rut: '12.345.678-9',
			tipo: 'cliente',
			es_frecuente: true,
			total_reservas: 5
		},
		viaje: {
			origen: 'Temuco Centro',
			destino: 'Aeropuerto La Araucanía',
			fecha: '2024-01-15T00:00:00Z',
			hora: '08:00',
			pasajeros: 3,
			tipo: 'ida_vuelta',
			regreso: {
				fecha: '2024-01-20T00:00:00Z',
				hora: '18:00'
			},
			numero_vuelo: 'LA1234',
			hotel: 'Hotel Dreams',
			equipaje_extra: true,
			observaciones: 'Cliente requiere silla de bebé'
		},
		asignacion: {
			vehiculo_id: 1,
			vehiculo_nombre: 'Van Mercedes ABC-123',
			vehiculo_tipo: 'Van 10 pasajeros',
			conductor_id: 1,
			conductor_nombre: 'Pedro Martínez',
			conductor_telefono: '+56987654321',
			estado: 'confirmada'
		},
		financiero: {
			total: 45000,
			abono: 20000,
			saldo: 25000,
			estado_pago: 'abono_parcial',
			descuento: 5000,
			historial_pagos: [
				{
					monto: 20000,
					fecha: '2024-01-10T10:30:00Z',
					metodo: 'Transferencia',
					referencia: 'TRF-001'
				}
			]
		},
		historial: [
			{
				tipo: 'creacion',
				timestamp: '2024-01-10T10:00:00Z',
				usuario: 'Admin'
			},
			{
				tipo: 'cambio_estado',
				timestamp: '2024-01-10T10:15:00Z',
				usuario: 'Admin',
				datos: {
					estado_anterior: 'borrador',
					estado_nuevo: 'pendiente'
				}
			},
			{
				tipo: 'pago',
				timestamp: '2024-01-10T10:30:00Z',
				usuario: 'Admin',
				datos: {
					monto: 20000,
					metodo: 'Transferencia'
				}
			},
			{
				tipo: 'cambio_estado',
				timestamp: '2024-01-10T11:00:00Z',
				usuario: 'Admin',
				datos: {
					estado_anterior: 'pendiente',
					estado_nuevo: 'confirmada',
					comentario: 'Cliente confirmó vía email'
				}
			},
			{
				tipo: 'asignacion',
				timestamp: '2024-01-10T14:00:00Z',
				usuario: 'Admin',
				datos: {
					vehiculo_nombre: 'Van Mercedes ABC-123',
					conductor_nombre: 'Pedro Martínez'
				}
			}
		]
	};

	// Usar la reserva mock si no hay reserva seleccionada (para demostración)
	const reservaActual = selectedReserva || reservaMock;

	/**
	 * Maneja el cambio de vista
	 */
	const handleCambiarVista = (vista) => {
		cambiarVista(vista);
	};

	/**
	 * Maneja la recarga de datos
	 */
	const handleRecargar = () => {
		clearFilters();
		// En fases futuras: fetchReservas();
	};

	return (
		<div className="w-full h-full space-y-6">
			{/* Toolbar superior */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between flex-wrap gap-4">
						{/* Título y contador */}
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold">Gestor de Reservas</h1>
							<Badge variant="secondary">
								{reservas.length || 1} {reservas.length === 1 ? 'reserva' : 'reservas'}
							</Badge>
						</div>

						{/* Acciones globales */}
						<div className="flex items-center gap-2">
							{/* Botones de vista */}
							<div className="flex items-center gap-1 border rounded-lg p-1">
								<Button
									variant={vistaActiva === VISTAS_GESTOR.LISTA ? 'default' : 'ghost'}
									size="sm"
									onClick={() => handleCambiarVista(VISTAS_GESTOR.LISTA)}
								>
									<LayoutList className="h-4 w-4" />
								</Button>
								<Button
									variant={vistaActiva === VISTAS_GESTOR.KANBAN ? 'default' : 'ghost'}
									size="sm"
									onClick={() => handleCambiarVista(VISTAS_GESTOR.KANBAN)}
									disabled
								>
									<LayoutGrid className="h-4 w-4" />
								</Button>
								<Button
									variant={vistaActiva === VISTAS_GESTOR.CALENDARIO ? 'default' : 'ghost'}
									size="sm"
									onClick={() => handleCambiarVista(VISTAS_GESTOR.CALENDARIO)}
									disabled
								>
									<CalendarIcon className="h-4 w-4" />
								</Button>
							</div>

							{/* Filtros */}
							<Button
								variant="outline"
								size="sm"
								onClick={() => setMostrarFiltros(!mostrarFiltros)}
							>
								<Filter className="h-4 w-4 mr-2" />
								Filtros
							</Button>

							{/* Recargar */}
							<Button
								variant="outline"
								size="sm"
								onClick={handleRecargar}
								disabled={loading}
							>
								<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
							</Button>

							{/* Nueva reserva */}
							<Button size="sm" disabled>
								<Plus className="h-4 w-4 mr-2" />
								Nueva Reserva
							</Button>
						</div>
					</div>

					{/* Barra de filtros (futuro) */}
					{mostrarFiltros && (
						<div className="mt-4 pt-4 border-t">
							<p className="text-sm text-muted-foreground">
								Los filtros se implementarán en la Fase 2
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Mensaje de error */}
			{error && (
				<Card className="border-destructive">
					<CardContent className="p-4">
						<p className="text-sm text-destructive">Error: {error}</p>
					</CardContent>
				</Card>
			)}

			{/* Contenido principal - Vista de detalles de reserva */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Columna principal - Cards de información */}
				<div className="lg:col-span-2 space-y-6">
					{/* Información del cliente */}
					<ClienteCard cliente={reservaActual.cliente} />

					{/* Detalles del viaje */}
					<ViajeCard viaje={reservaActual.viaje} />

					{/* Grid de asignación y financiero */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<AsignacionCard
							asignacion={reservaActual.asignacion}
							editable={false}
						/>
						<FinancieroCard
							financiero={reservaActual.financiero}
							editable={false}
						/>
					</div>

					{/* Timeline de actividad */}
					<Timeline
						eventos={reservaActual.historial}
						limite={5}
					/>
				</div>

				{/* Columna lateral - Panel de acciones */}
				<div className="space-y-6">
					<ActionPanel
						reserva={reservaActual}
						onCambiarEstado={(estado) => console.log('Cambiar estado a:', estado)}
						onNotificar={() => console.log('Enviar notificación')}
						onImprimir={() => console.log('Imprimir reserva')}
						onDuplicar={() => console.log('Duplicar reserva')}
						deshabilitado
					/>

					{/* Información adicional */}
					<Card>
						<CardContent className="p-4 space-y-2">
							<h4 className="text-sm font-medium text-muted-foreground">
								Información del Sistema
							</h4>
							<div className="space-y-1 text-xs text-muted-foreground">
								<p>• Vista actual: {vistaActiva}</p>
								<p>• Esta es la Fase 1 (estructura base)</p>
								<p>• Los datos mostrados son de demostración</p>
								<p>• La integración completa se hará en Fase 2</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default ReservasManager;
