
import Reserva from '../models/Reserva.js';
import Transaccion from '../models/Transaccion.js';
import CodigoPago from '../models/CodigoPago.js';
import { setupAssociations } from '../models/associations.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

async function check() {
    try {
        setupAssociations();
        console.log("🔍 Buscando transacciones del 2026-02-13 (hoy)...");
        
        const today = "2026-02-13";
        const txs = await Transaccion.findAll({
            where: {
                created_at: {
                    [Op.gte]: new Date(today + "T00:00:00Z"),
                    [Op.lt]: new Date(today + "T23:59:59Z")
                },
                estado: 'aprobado'
            },
            include: [
                { model: Reserva, as: 'reserva' }
            ],
            order: [['created_at', 'DESC']]
        });

        console.log(`📊 Encontradas ${txs.length} transacciones aprobadas.`);

        txs.forEach(tx => {
            const isCode = tx.codigoPagoId || (tx.reserva && tx.reserva.source === 'codigo_pago');
            console.log(`- ID: ${tx.id} | Reserva: ${tx.reservaId} (${tx.reserva ? tx.reserva.codigoReserva : 'N/A'}) | Monto: ${tx.monto} | Código: ${isCode ? 'SÍ' : 'NO'} | Referencia: ${tx.referencia || 'N/A'}`);
            
            if (isCode) {
                // Verificar si tiene email y nombre para la conversión
                const r = tx.reserva;
                if (r) {
                    console.log(`  📧 Email: ${r.email} | Nombre: ${r.nombre} | Teléfono: ${r.telefono}`);
                    const userData = { email: r.email || '', nombre: r.nombre || '', telefono: r.telefono || '' };
                    const encoded = Buffer.from(JSON.stringify(userData)).toString('base64');
                    console.log(`  🔗 Base64 D: ${encoded}`);
                    if (encoded.includes('+') || encoded.includes('/') || encoded.includes('=')) {
                        console.log(`  ⚠️  AVISO: Contiene caracteres especiales de URL (+, /, =)`);
                    }
                }
            }
        });

    } catch (error) {
        console.error("❌ Error running diagnostic:", error);
    } finally {
        await sequelize.close();
    }
}

check();
