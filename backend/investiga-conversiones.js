import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

import Reserva from './models/Reserva.js';
import { Op } from 'sequelize';

async function investigaConversiones() {
    const dateFilter = '2026-02-19';
    console.log(`🔍 Buscando reservas del día: ${dateFilter}`);
    try {
        const reservas = await Reserva.findAll({
            where: {
                created_at: {
                    [Op.gte]: new Date(`${dateFilter}T00:00:00`),
                    [Op.lte]: new Date(`${dateFilter}T23:59:59`)
                }
            },
            order: [['createdAt', 'DESC']]
        });

        console.log(`Se encontraron ${reservas.length} reservas creadas ayer.`);
        
        reservas.forEach(r => {
            console.log(`ID: ${r.id} | Código: ${r.codigoReserva} | Estado: ${r.estado} | Pago: ${r.estadoPago} | Monto: ${r.pagoMonto} | Total: ${r.totalConDescuento} | CreatedAt: ${r.createdAt}`);
        });

    } catch (error) {
        console.error('❌ Error en la consulta:', error);
    } finally {
        process.exit();
    }
}

investigaConversiones();
