
import Reserva from './models/Reserva.js';
import { setupAssociations } from './models/associations.js';
import { Op } from 'sequelize';
import sequelize from './config/database.js';

async function diagnostic() {
  setupAssociations();
  
  const yesterday = '2026-03-07';
  
  console.log(`--- Diagnóstico Reservas para ${yesterday} ---`);
  
  const reservations = await Reserva.findAll({
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

  console.log(`\nReservas Encontradas (${reservations.length}):`);
  reservations.forEach(r => {
    console.log(`- ID: ${r.id}, Code: ${r.codigoReserva}, Email: ${r.email}, Total: ${r.totalConDescuento}, Pago: ${r.pagoMonto}, Estado: ${r.estado}, PagoEstado: ${r.estadoPago}, Metodo: ${r.metodoPago}, CreatedAt: ${r.getDataValue('created_at')}`);
  });

  process.exit(0);
}

diagnostic();
