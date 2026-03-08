
import Reserva from './models/Reserva.js';
import { setupAssociations } from './models/associations.js';
import sequelize from './config/database.js';

async function diagnostic() {
  setupAssociations();
  
  const ids = [535, 536, 537];

  const reservas = await Reserva.findAll({
    where: {
      id: ids
    }
  });

  console.log(`\nDetalles de Reservas:`);
  reservas.forEach(r => {
    console.log(`- ID: ${r.id}, Nombre: ${r.nombre}, Email: ${r.email}`);
  });

  process.exit(0);
}

diagnostic();
