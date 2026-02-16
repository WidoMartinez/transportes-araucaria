import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import Reserva from './models/Reserva.js';
import { Op } from 'sequelize';

async function findByEmail() {
    try {
        const found = await Reserva.findOne({ where: { codigoReserva: 'AR-20260204-0005' } });
        if (!found) {
            console.log('Reserva AR-20260204-0005 no encontrada.');
            return;
        }

        console.log(`--- Buscando reservas para: ${found.email} ---`);
        const reservas = await Reserva.findAll({
            where: { email: found.email },
            order: [['id', 'ASC']]
        });

        reservas.forEach(r => {
            console.log(`ID: ${r.id} | Código: ${r.codigoReserva} | Fecha: ${r.fecha} | Trayecto: ${r.origen} -> ${r.destino} | Estado: ${r.estado} | Archivada: ${r.archivada} | Tipo: ${r.tipoTramo}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

findByEmail();
