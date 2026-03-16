/**
 * Script de diagnóstico de conexión a BD
 * Prueba la conectividad desde Render a Hostinger con métricas detalladas
 */

import sequelize from "../config/database.js";
import dns from "dns";
import { promisify } from "util";

const dnsLookup = promisify(dns.lookup);

async function testDatabaseConnection() {
    console.log("🔍 Ejecutando diagnóstico de conexión a BD...\n");
    console.log("📋 Configuración:");
    console.log(`   Host: ${process.env.DB_HOST || 'srv1551.hstgr.io'}`);
    console.log(`   Puerto: ${process.env.DB_PORT || 3306}`);
    console.log(`   Base de datos: ${process.env.DB_NAME || 'u419311572_transportes_araucania'}\n`);

    // 1. Resolución DNS
    try {
        console.log("1️⃣ Probando resolución DNS...");
        const startDns = Date.now();
        const address = await dnsLookup(process.env.DB_HOST || 'srv1551.hstgr.io');
        const dnsDuration = Date.now() - startDns;
        console.log(`   ✅ DNS resuelto: ${address.address} (${dnsDuration}ms)\n`);
    } catch (error) {
        console.error(`   ❌ Error en resolución DNS: ${error.message}\n`);
        return;
    }

    // 2. Conexión TCP (authenticate)
    try {
        console.log("2️⃣ Probando conexión TCP a BD...");
        const startTcp = Date.now();
        await sequelize.authenticate();
        const tcpDuration = Date.now() - startTcp;
        console.log(`   ✅ Conexión establecida (${tcpDuration}ms)\n`);
    } catch (error) {
        console.error(`   ❌ Error de conexión TCP:`, {
            mensaje: error.message,
            código: error.parent?.code || error.code,
            timeout: error.parent?.timeout,
            duración: error.parent?.timeout ? `>${error.parent.timeout}ms` : 'N/A'
        });
        console.log("\n");
        return;
    }

    // 3. Consulta simple
    try {
        console.log("3️⃣ Probando consulta simple...");
        const startQuery = Date.now();
        const [results] = await sequelize.query("SELECT 1 as test");
        const queryDuration = Date.now() - startQuery;
        console.log(`   ✅ Consulta exitosa (${queryDuration}ms)\n`);
    } catch (error) {
        console.error(`   ❌ Error en consulta: ${error.message}\n`);
        return;
    }

    // 4. Pool de conexiones
    try {
        console.log("4️⃣ Estado del pool de conexiones:");
        const pool = sequelize.connectionManager.pool;
        if (pool) {
            console.log(`   - Total: ${pool.size}`);
            console.log(`   - Disponibles: ${pool.available}`);
            console.log(`   - En uso: ${pool.using}`);
            console.log(`   - Esperando: ${pool.waiting}\n`);
        } else {
            console.log(`   ⚠️ Pool no disponible\n`);
        }
    } catch (error) {
        console.log(`   ⚠️ No se pudo obtener estado del pool\n`);
    }

    // 5. Múltiples conexiones paralelas
    try {
        console.log("5️⃣ Probando 5 conexiones paralelas...");
        const startParallel = Date.now();
        const promises = Array.from({ length: 5 }, (_, i) =>
            sequelize.query(`SELECT ${i + 1} as conn_test`)
                .then(() => ({ index: i + 1, success: true }))
                .catch(err => ({ index: i + 1, success: false, error: err.message }))
        );
        const results = await Promise.all(promises);
        const parallelDuration = Date.now() - startParallel;
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`   ✅ Exitosas: ${successful}/5`);
        if (failed > 0) {
            console.log(`   ❌ Fallidas: ${failed}/5`);
            results.filter(r => !r.success).forEach(r => {
                console.log(`      - Conexión ${r.index}: ${r.error}`);
            });
        }
        console.log(`   ⏱️ Duración total: ${parallelDuration}ms\n`);
    } catch (error) {
        console.error(`   ❌ Error en prueba paralela: ${error.message}\n`);
    }

    console.log("✅ Diagnóstico completado");
}

// Ejecutar diagnóstico
testDatabaseConnection()
    .then(() => {
        console.log("\n💡 Si los tiempos de respuesta son superiores a 5000ms, considera:");
        console.log("   1. Aumentar timeouts en config/database.js");
        console.log("   2. Contactar soporte de Hostinger para revisar límites de conexión");
        console.log("   3. Revisar firewall/restricciones de IP en Hostinger");
        process.exit(0);
    })
    .catch(err => {
        console.error("\n❌ Error fatal en diagnóstico:", err);
        process.exit(1);
    });
