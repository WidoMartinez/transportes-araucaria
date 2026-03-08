
import dotenv from 'dotenv';
dotenv.config();
import Destino from './models/Destino.js';
import { setupAssociations } from './models/associations.js';

setupAssociations();

async function check() {
    try {
        const destino = await Destino.findOne({ where: { nombre: 'Coñaripe' } });
        if (destino) {
            console.log('--- Datos de Coñaripe ---');
            console.log(JSON.stringify(destino.toJSON(), null, 2));
        } else {
            console.log('Destino Coñaripe no encontrado');
        }
    } catch (e) {
        console.error(e);
    }
    process.exit();
}

check();
