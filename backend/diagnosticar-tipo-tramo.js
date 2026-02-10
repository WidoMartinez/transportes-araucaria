import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Cargar .env desde el directorio backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Configuración directa con credenciales
const sequelize = new Sequelize({
    database: "u419311572_araucaria",
    username: "u419311572_admin",
    password: "TeamoGadiel7.",
    host: "srv1551.hstgr.io",
    port: 3306,
    dialect: "mysql",
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 90000,
        idle: 10000,
    },
    timezone: "-04:00",
    dialectOptions: {
        connectTimeout: 90000,
        timezone: "-04:00",
    },
});

async function diagnosticarTipoTramo() {
    try {
        console.log("🔍 Iniciando diagnóstico de tipo_tramo...\n");
        
        // 1. Verificar conexión
        console.log("1️⃣ Verificando conexión a la base de datos...");
        await sequelize.authenticate();
        console.log("✅ Conexión exitosa\n");

        // 2. Verificar existencia de columna tipo_tramo
        console.log("2️⃣ Verificando existencia de columna tipo_tramo...");
        const columns = await sequelize.query(
            "SHOW COLUMNS FROM reservas LIKE 'tipo_tramo'",
            { type: QueryTypes.SELECT }
        );
        
        if (columns.length === 0) {
            console.log("❌ La columna tipo_tramo NO EXISTE en la tabla reservas");
            console.log("   → Solución: Ejecutar migración add-tramos-fields.js\n");
            return;
        }
        
        console.log("✅ La columna tipo_tramo existe");
        console.log("   Detalles:", JSON.stringify(columns[0], null, 2));
        console.log("");

        // 3. Contar reservas por tipo_tramo
        console.log("3️⃣ Contando reservas por tipo_tramo...");
        const counts = await sequelize.query(
            "SELECT tipo_tramo, COUNT(*) as total FROM reservas GROUP BY tipo_tramo",
            { type: QueryTypes.SELECT }
        );
        
        console.log("   Distribución:");
        counts.forEach(row => {
            console.log(`   - ${row.tipo_tramo || 'NULL'}: ${row.total} reservas`);
        });
        console.log("");

        // 4. Verificar reservas ida y vuelta recientes
        console.log("4️⃣ Analizando últimas 10 reservas con ida_vuelta o vinculadas...");
        const reservasVinculadas = await sequelize.query(
            `SELECT 
                id, 
                codigo_reserva, 
                tipo_tramo, 
                tramo_padre_id, 
                tramo_hijo_id, 
                ida_vuelta,
                fecha,
                created_at
            FROM reservas 
            WHERE ida_vuelta = 1 OR tramo_padre_id IS NOT NULL OR tramo_hijo_id IS NOT NULL
            ORDER BY created_at DESC 
            LIMIT 10`,
            { type: QueryTypes.SELECT }
        );

        if (reservasVinculadas.length === 0) {
            console.log("   ℹ️  No se encontraron reservas ida y vuelta o vinculadas");
        } else {
            console.log(`   Encontradas ${reservasVinculadas.length} reservas:\n`);
            console.log("   ID | Código | Tipo | Padre | Hijo | IV | Fecha");
            console.log("   " + "-".repeat(70));
            reservasVinculadas.forEach(r => {
                console.log(`   ${r.id} | ${r.codigo_reserva} | ${r.tipo_tramo || 'NULL'} | ${r.tramo_padre_id || '-'} | ${r.tramo_hijo_id || '-'} | ${r.ida_vuelta} | ${r.fecha}`);
            });
        }
        console.log("");

        // 5. Detectar problemas específicos
        console.log("5️⃣ Detectando problemas específicos...");
        
        // Buscar reservas hijas (tienen padre) que NO sean tipo 'vuelta'
        const hijasIncorrectas = await sequelize.query(
            `SELECT id, codigo_reserva, tipo_tramo, tramo_padre_id 
             FROM reservas 
             WHERE tramo_padre_id IS NOT NULL AND tipo_tramo != 'vuelta'`,
            { type: QueryTypes.SELECT }
        );

        if (hijasIncorrectas.length > 0) {
            console.log(`   ⚠️  PROBLEMA DETECTADO: ${hijasIncorrectas.length} reservas hijas con tipo incorrecto`);
            console.log("   Deberían ser 'vuelta' pero son:");
            hijasIncorrectas.forEach(r => {
                console.log(`   - Reserva ${r.id} (${r.codigo_reserva}): tipo_tramo = '${r.tipo_tramo}'`);
            });
        } else {
            console.log("   ✅ Todas las reservas hijas tienen tipo 'vuelta'");
        }

        // Buscar reservas padres (tienen hijo) que NO sean tipo 'ida'
        const padresIncorrectos = await sequelize.query(
            `SELECT id, codigo_reserva, tipo_tramo, tramo_hijo_id 
             FROM reservas 
             WHERE tramo_hijo_id IS NOT NULL AND tipo_tramo != 'ida'`,
            { type: QueryTypes.SELECT }
        );

        if (padresIncorrectos.length > 0) {
            console.log(`   ⚠️  PROBLEMA DETECTADO: ${padresIncorrectos.length} reservas padres con tipo incorrecto`);
            console.log("   Deberían ser 'ida' pero son:");
            padresIncorrectos.forEach(r => {
                console.log(`   - Reserva ${r.id} (${r.codigo_reserva}): tipo_tramo = '${r.tipo_tramo}'`);
            });
        } else {
            console.log("   ✅ Todas las reservas padres tienen tipo 'ida'");
        }

        console.log("\n" + "=".repeat(70));
        console.log("📊 RESUMEN DEL DIAGNÓSTICO");
        console.log("=".repeat(70));
        
        if (hijasIncorrectas.length === 0 && padresIncorrectos.length === 0) {
            console.log("✅ No se detectaron problemas en los datos actuales");
            console.log("   El problema podría estar en:");
            console.log("   - Reservas creadas antes de la implementación de tramos");
            console.log("   - Un flujo específico que no está usando la lógica correcta");
        } else {
            console.log("⚠️  Se detectaron problemas que requieren corrección");
            console.log(`   - Reservas hijas incorrectas: ${hijasIncorrectas.length}`);
            console.log(`   - Reservas padres incorrectas: ${padresIncorrectos.length}`);
            console.log("\n   Ejecuta el script fix-tipo-tramo.js para corregir");
        }
        
        console.log("=".repeat(70));

    } catch (error) {
        console.error("\n❌ Error durante el diagnóstico:", error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

diagnosticarTipoTramo()
    .then(() => {
        console.log("\n✅ Diagnóstico completado");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Error fatal:", error.message);
        process.exit(1);
    });
