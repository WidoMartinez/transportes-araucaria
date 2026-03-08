
import Reserva from './models/Reserva.js';
import Transaccion from './models/Transaccion.js';
import { setupAssociations } from './models/associations.js';
import { Op } from 'sequelize';
import sequelize from './config/database.js';

async function diagnostic() {
  setupAssociations();
  
  const yesterday = '2026-03-07';
  
  console.log(`--- Diagnóstico para ${yesterday} ---`);
  
  // Traer todas las transacciones recientes
  const allTransactions = await Transaccion.findAll({
    limit: 100,
    order: [['id', 'DESC']]
  });

  const transactions = allTransactions.filter(t => {
    const date = new Date(t.getDataValue('created_at'));
    return date.toISOString().split('T')[0] === yesterday;
  });

  console.log(`\nTransacciones (${transactions.length}):`);
  transactions.forEach(t => {
    console.log(`- ID: ${t.id}, Monto: ${t.monto}, Status: ${t.estado}, ReservaID: ${t.reservaId}, Ref: ${t.referencia}, ID Trans: ${t.transaccionId}`);
  });

  const reservas = await Reserva.findAll({
    where: {
      [Op.or]: [
        {
          createdAt: {
            [Op.between]: [new Date(yesterday + 'T00:00:00'), new Date(yesterday + 'T23:59:59')]
          }
        },
        {
          fecha: yesterday
        }
      ]
    }
  });

  console.log(`\nReservas (${reservas.length}):`);
  reservas.forEach(r => {
    console.log(`- ID: ${r.id}, Code: ${r.codigoReserva}, Email: ${r.email}, Total: ${r.totalConDescuento}, Pago: ${r.pagoMonto}, Estado: ${r.estado}, PagoEstado: ${r.estadoPago}, Ref: ${r.referenciaPago}`);
  });

  process.exit(0);
}

diagnostic();
