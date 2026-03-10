import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import sequelize from './config/database.js';
import Reserva from './models/Reserva.js';
import Transaccion from './models/Transaccion.js';

async function verify() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 3); // last 3 days
    
    const reservas = await Reserva.findAll({
      where: { created_at: { [sequelize.Sequelize.Op.gte]: ayer } },
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Found ${reservas.length} recent reservations.`);
    for (const r of reservas.slice(0, 5)) {
      console.log(`ID: ${r.id}, Code: ${r.codigoReserva}, Source: ${r.source}, Amount: ${r.precio}, Discount: ${r.totalConDescuento}, Paid: ${r.pagoMonto}`);
    }

    const transacciones = await Transaccion.findAll({
      where: { createdAt: { [sequelize.Sequelize.Op.gte]: ayer } },
      order: [['createdAt', 'DESC']]
    });

    console.log(`\nFound ${transacciones.length} recent transactions.`);
    for (const t of transacciones.slice(0, 5)) {
      console.log(`ReservaID: ${t.reservaId}, Amount: ${t.monto}, Status: ${t.estado}, Gateway: ${t.gateway}`);
    }

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
verify();
