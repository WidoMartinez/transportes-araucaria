
import Reserva from './models/Reserva.js';
import Transaccion from './models/Transaccion.js';
import { setupAssociations } from './models/associations.js';
import { Op } from 'sequelize';
import sequelize from './config/database.js';

async function check() {
    try {
        setupAssociations();
        const start = "2026-03-07T00:00:00Z";
        const end = "2026-03-07T23:59:59Z";
        
        console.log(`🔍 Buscando datos entre ${start} y ${end}...`);
        
        const txs = await Transaccion.findAll({
            where: {
                created_at: {
                    [Op.between]: [new Date(start), new Date(end)]
                }
            },
            include: [{ model: Reserva, as: 'reserva' }],
            order: [['created_at', 'DESC']]
        });

        console.log(`\n📊 TRANSACCIONES (${txs.length}):`);
        txs.forEach(tx => {
            console.log(`- ID: ${tx.id} | Reserva: ${tx.reservaId} (${tx.reserva ? tx.reserva.codigoReserva : 'N/A'}) | Monto: ${tx.monto} | Estado: ${tx.estado} | FlowID: ${tx.transaccionId} | Fecha: ${tx.created_at}`);
        });

        const res = await Reserva.findAll({
            where: {
                created_at: {
                    [Op.between]: [new Date(start), new Date(end)]
                }
            },
            order: [['created_at', 'DESC']]
        });

        console.log(`\n📋 RESERVAS (${res.length}):`);
        res.forEach(r => {
            console.log(`- ID: ${r.id} | Código: ${r.codigoReserva} | Estado: ${r.estado} | Pago: ${r.estadoPago} | Monto: ${r.pagoMonto} | Email: ${r.email} | Creada: ${r.createdAt}`);
        });

        // Buscar reservas que NO tienen transacción pero fueron creadas ayer
        const missingTxs = res.filter(r => !txs.some(tx => tx.reservaId === r.id));
        if (missingTxs.length > 0) {
            console.log(`\n⚠️ RESERVAS SIN TRANSACCIÓN ASOCIADA (${missingTxs.length}):`);
            missingTxs.forEach(r => {
                console.log(`- ID: ${r.id} | Código: ${r.codigoReserva} | Estado Pago: ${r.estadoPago}`);
            });
        }

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await sequelize.close();
    }
}

check();
