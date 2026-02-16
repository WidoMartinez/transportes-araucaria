import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Reserva from './models/Reserva.js';
import { Op } from 'sequelize';

async function findRelated() {
    try {
        console.log('--- Buscando reservas del 2026-02-04 ---');
        const reservas = await Reserva.findAll({
            where: {
                [Op.or]: [
                    { fecha: '2026-02-04' },
                    { codigoReserva: { [Op.like]: 'AR-20260204%' } }
                ]
            },
            order: [['id', 'ASC']]
        });

        reservas.forEach(r => {
            console.log(`ID: ${r.id} | Código: ${r.codigoReserva} | Nombre: ${r.nombre} | Trayecto: ${r.origen} -> ${r.destino} | Estado: ${r.estado} | Padre: ${r.tramoPadreId} | Hijo: ${r.tramoHijoId} | Tipo: ${r.tipoTramo}`);
        });

        if (reservas.length === 0) {
            console.log('No se encontraron reservas.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

findRelated();
