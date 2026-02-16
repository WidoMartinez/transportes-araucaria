import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');
console.log('Cargando .env desde:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('❌ Error al cargar .env:', result.error);
} else {
    console.log('✅ .env cargado correctamente');
}

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD definido:', !!process.env.DB_PASSWORD);
console.log('DB_HOST:', process.env.DB_HOST);

import Reserva from './models/Reserva.js';
import { Op } from 'sequelize';

async function checkReserva() {
    console.log('--- Buscando reserva AR-20260204-0005 ---');
    try {
        const reserva = await Reserva.findOne({
            where: {
                codigoReserva: 'AR-20260204-0005'
            }
        });

        if (reserva) {
            console.log('✅ Reserva encontrada:');
            console.log(JSON.stringify(reserva.toJSON(), null, 2));
        } else {
            console.log('❌ Reserva no encontrada con ese código excato.');
            
            // Buscar por similitud por si hubo un error en el código
            const similares = await Reserva.findAll({
                where: {
                    codigoReserva: { [Op.like]: '%20260204-0005%' }
                }
            });
            
            if (similares.length > 0) {
                console.log(`🔍 Se encontraron ${similares.length} reservas similares:`);
                similares.forEach(r => console.log(`- ${r.codigoReserva} (Estado: ${r.estado}, Archivada: ${r.archivada})`));
            } else {
                console.log('🔍 No se encontraron reservas similares.');
            }
        }
    } catch (error) {
        console.error('❌ Error en la consulta:', error);
    } finally {
        process.exit();
    }
}

checkReserva();
