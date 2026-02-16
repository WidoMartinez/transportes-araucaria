import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Reserva from './models/Reserva.js';
import Cliente from './models/Cliente.js';
import sequelize from './config/database.js';

async function restoreReserva() {
    const t = await sequelize.transaction();
    try {
        console.log('--- Iniciando restauración de reserva ---');
        
        // 1. Obtener la reserva huérfana (vuelta)
        const reservaVuelta = await Reserva.findOne({ 
            where: { codigoReserva: 'AR-20260204-0005' },
            transaction: t 
        });

        if (!reservaVuelta) {
            throw new Error('No se encontró la reserva de vuelta AR-20260204-0005');
        }

        console.log(`Reserva vuelta encontrada: ID ${reservaVuelta.id} - ${reservaVuelta.codigoReserva}`);

        // 2. Preparar datos para el tramo de ida (asumiendo datos inversos)
        const nuevaReservaData = {
            clienteId: reservaVuelta.clienteId,
            nombre: reservaVuelta.nombre,
            email: reservaVuelta.email,
            telefono: reservaVuelta.telefono,
            rut: reservaVuelta.rut,
            fecha: reservaVuelta.fecha, // Asumimos misma fecha por defecto, o ajustar si es necesario
            hora: "00:00", // Hora por definir, poner placeholder
            origen: reservaVuelta.destino, // Inverso
            destino: reservaVuelta.origen, // Inverso
            direccionOrigen: reservaVuelta.direccionDestino,
            direccionDestino: reservaVuelta.direccionOrigen,
            pasajeros: reservaVuelta.pasajeros,
            precio: reservaVuelta.precio, // Asumimos mismo precio base
            vehiculo: reservaVuelta.vehiculo,
            tipoTramo: 'ida',
            estado: reservaVuelta.estado,
            estadoPago: reservaVuelta.estadoPago,
            metodoPago: reservaVuelta.metodoPago,
            pagoMonto: reservaVuelta.pagoMonto, // Comparten monto si fue pago único
            pagoId: reservaVuelta.pagoId,
            observaciones: "RESTAURADA AUTOMÁTICAMENTE - Tramo de ida recuperado",
            tramoHijoId: reservaVuelta.id,
            esCliente: reservaVuelta.esCliente,
            codigoReserva: `AR-20260204-RECUP-1`, // Código único
            source: 'Recuperación Sistema',
            totalConDescuento: reservaVuelta.totalConDescuento || 0,
            abonoPagado: reservaVuelta.abonoPagado || false,
            saldoPagado: reservaVuelta.saldoPagado || false,
            cantidadSillasInfantiles: reservaVuelta.cantidadSillasInfantiles || 0,
        };

        // 3. Crear la nueva reserva de ida
        const nuevaReserva = await Reserva.create(nuevaReservaData, { transaction: t });
        console.log(`Nueva reserva de ida creada con ID: ${nuevaReserva.id}`);

        // 4. Actualizar la reserva de vuelta para vincular al nuevo padre
        await reservaVuelta.update({
            tramoPadreId: nuevaReserva.id
        }, { transaction: t });

        console.log(`Reserva vuelta actualizada con tramoPadreId: ${nuevaReserva.id}`);

        await t.commit();
        console.log('✅ Restauración completada exitosamente.');

    } catch (error) {
        await t.rollback();
        console.error('❌ Error en la restauración:', error);
    } finally {
        process.exit();
    }
}

restoreReserva();
