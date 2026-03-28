import React from 'react';
import { ReservasProvider } from '../../contexts/ReservasContext';
import ReservasManager from './ReservasManager';

/**
 * Componente Demo para visualizar el Gestor de Reservas
 * 
 * Envuelve el ReservasManager con el provider necesario
 * para poder visualizar el componente de forma independiente.
 * 
 * Este componente es solo para demostración en Fase 1
 * y no debe integrarse en el sistema principal todavía.
 */
const ReservasManagerDemo = () => {
	return (
		<ReservasProvider>
			<div className="min-h-screen bg-background p-6">
				<ReservasManager />
			</div>
		</ReservasProvider>
	);
};

export default ReservasManagerDemo;
