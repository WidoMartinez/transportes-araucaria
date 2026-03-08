
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
        
        const txs = await Transaccion.findAll({
            where: {
                created_at: {
                    [Op.between]: [new Date(start), new Date(end)]
                }
            },
            include: [{ model: Reserva, as: 'reserva' }],
            order: [['created_at', 'ASC']]
        });

        console.log(`\n🔍 ANALIZANDO DATA DE CONVERSIÓN PARA ${txs.length} TRANSACCIONES:`);
        txs.forEach(tx => {
            const r = tx.reserva;
            if (r) {
                const userData = { 
                    email: r.email || '', 
                    nombre: r.nombre || '', 
                    telefono: r.telefono || '' 
                };
                const json = JSON.stringify(userData);
                const encoded = Buffer.from(json).toString('base64');
                
                console.log(`\n--- Reserva: ${r.codigoReserva} ---`);
                console.log(`Nombre: "${r.nombre}"`);
                console.log(`Email: "${r.email}"`);
                console.log(`JSON: ${json}`);
                console.log(`Base64: ${encoded}`);
                
                const hasSpecial = encoded.includes('+') || encoded.includes('/') || encoded.includes('=');
                if (hasSpecial) {
                    console.log(`⚠️  ALERTA: El Base64 contiene caracteres conflictivos (+, /, =)`);
                }
                
                // Verificar si hay caracteres no ASCII en el email o nombre
                const nonAscii = /[^\x00-\x7F]/.test(r.nombre) || /[^\x00-\x7F]/.test(r.email);
                if (nonAscii) {
                    console.log(`⚠️  ALERTA: Contiene caracteres NO-ASCII (acentos, etc)`);
                }
            }
        });

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await sequelize.close();
    }
}

check();
