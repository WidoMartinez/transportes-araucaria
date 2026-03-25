import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Importar modelos
import Reserva from './models/Reserva.js';
import sequelize from './config/database.js';

async function diagnosticar() {
    console.log("🔍 Iniciando Diagnóstico de Integridad de Tramos (Ida/Vuelta)...");
    
    try {
        await sequelize.authenticate();
        console.log("✅ Conexión a BD exitosa.");

        // 1. Verificar existencia de columnas
        const [results] = await sequelize.query("SHOW COLUMNS FROM reservas LIKE 'tipo_tramo'");
        if (results.length === 0) {
            console.error("❌ ERROR: La columna 'tipo_tramo' NO existe en la tabla reservas.");
        } else {
            console.log("✅ Columna 'tipo_tramo' detectada.");
        }

        // 2. Resumen de tipos de tramo
        const estadisticas = await Reserva.findAll({
            attributes: [
                'tipo_tramo',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['tipo_tramo']
        });

        console.log("\n📊 Distribución de Reservas por Tipo:");
        estadisticas.forEach(stat => {
            console.log(`- ${stat.getDataValue('tipo_tramo') || 'NULO'}: ${stat.getDataValue('count')}`);
        });

        // 3. Detectar inconsistencias
        console.log("\n⚠️ Buscando inconsistencias...");
        
        // Hijas que no son 'vuelta'
        const HijasMalas = await Reserva.findAll({
            where: {
                tramoPadreId: { [Op.ne]: null },
                tipo_tramo: { [Op.ne]: 'vuelta' }
            }
        });

        if (HijasMalas.length > 0) {
            console.error(`❌ ERROR: Se detectaron ${HijasMalas.length} reservas hijas que no están marcadas como 'vuelta'.`);
        } else {
            console.log("✅ Integridad de vínculos hijos: OK.");
        }

        // Padres que no son 'ida'
        const PadresMalos = await Reserva.findAll({
            where: {
                tramoHijoId: { [Op.ne]: null },
                tipo_tramo: { [Op.ne]: 'ida' }
            }
        });

        if (PadresMalos.length > 0) {
            console.error(`❌ ERROR: Se detectaron ${PadresMalos.length} reservas padres que no están marcadas como 'ida'.`);
        } else {
            console.log("✅ Integridad de vínculos padres: OK.");
        }

        // 4. Listar últimas vinculadas
        console.log("\n🔗 Últimas 5 Reservas Vinculadas:");
        const vinculadas = await Reserva.findAll({
            where: {
                [Op.or]: [
                    { tramoPadreId: { [Op.ne]: null } },
                    { tramoHijoId: { [Op.ne]: null } }
                ]
            },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        vinculadas.forEach(r => {
            console.log(`- #${r.id} (${r.codigoReserva}) | Tipo: ${r.tipo_tramo} | Padre: ${r.tramoPadreId || '-'} | Hijo: ${r.tramoHijoId || '-'}`);
        });

    } catch (error) {
        console.error("❌ Fallo crítico en el diagnóstico:", error);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

diagnosticar();
