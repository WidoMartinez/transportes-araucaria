import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Cargar .env desde el directorio backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

// Configuración directa con credenciales
const sequelize = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
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

async function diagnosticarOportunidades() {
    try {
        console.log("🔍 Diagnóstico de Generación de Oportunidades\n");
        console.log("=".repeat(80));
        
        // 1. Verificar conexión
        console.log("\n1️⃣ Verificando conexión a la base de datos...");
        await sequelize.authenticate();
        console.log("✅ Conexión exitosa\n");

        // 2. Buscar reservas del 12 de febrero
        console.log("2️⃣ Buscando reservas para el 12 de febrero de 2026...");
        const reservas = await sequelize.query(
            `SELECT 
                id, 
                codigo_reserva,
                origen,
                destino,
                fecha,
                hora,
                estado,
                vehiculo,
                pasajeros,
                precio
            FROM reservas 
            WHERE fecha = '2026-02-12' 
            AND estado IN ('confirmada', 'completada')
            ORDER BY hora ASC`,
            { type: QueryTypes.SELECT }
        );

        console.log(`\n📋 Encontradas ${reservas.length} reservas confirmadas:\n`);
        console.log("ID | Código | Origen → Destino | Hora | Vehículo | Pax | Estado");
        console.log("-".repeat(100));
        reservas.forEach(r => {
            console.log(`${r.id} | ${r.codigo_reserva} | ${r.origen} → ${r.destino} | ${r.hora} | ${r.vehiculo || 'N/A'} | ${r.pasajeros} | ${r.estado}`);
        });

        // 3. Buscar oportunidades existentes para esas reservas
        console.log("\n3️⃣ Verificando oportunidades generadas para estas reservas...");
        const oportunidades = await sequelize.query(
            `SELECT 
                o.id,
                o.codigo,
                o.tipo,
                o.origen,
                o.destino,
                o.fecha,
                o.hora_aproximada,
                o.estado,
                o.reserva_relacionada_id,
                r.codigo_reserva as reserva_codigo
            FROM oportunidades o
            LEFT JOIN reservas r ON o.reserva_relacionada_id = r.id
            WHERE o.fecha = '2026-02-12'
            ORDER BY o.hora_aproximada ASC`,
            { type: QueryTypes.SELECT }
        );

        console.log(`\n📊 Encontradas ${oportunidades.length} oportunidades para el 12 de febrero:\n`);
        if (oportunidades.length > 0) {
            console.log("ID | Código | Tipo | Origen → Destino | Hora | Estado | Reserva Relacionada");
            console.log("-".repeat(100));
            oportunidades.forEach(o => {
                console.log(`${o.id} | ${o.codigo} | ${o.tipo} | ${o.origen} → ${o.destino} | ${o.hora_aproximada} | ${o.estado} | ${o.reserva_codigo || 'N/A'}`);
            });
        } else {
            console.log("⚠️  No se encontraron oportunidades para esta fecha");
        }

        // 4. Análisis de por qué no se generaron oportunidades
        console.log("\n4️⃣ Análisis de generación de oportunidades...\n");
        
        for (const reserva of reservas) {
            console.log(`\n📍 Reserva ${reserva.codigo_reserva} (ID: ${reserva.id})`);
            console.log(`   Ruta: ${reserva.origen} → ${reserva.destino}`);
            console.log(`   Hora: ${reserva.hora}`);
            
            // Verificar si cumple reglas de negocio
            const AEROPUERTO = "Aeropuerto La Araucanía";
            const BASE_CIUDAD = "Temuco";
            
            // Regla 1: Al menos uno debe ser aeropuerto
            if (reserva.origen !== AEROPUERTO && reserva.destino !== AEROPUERTO) {
                console.log(`   ❌ NO cumple: No incluye Aeropuerto`);
                continue;
            }
            
            // Regla 2: Excluir Temuco Ciudad
            if (reserva.origen === BASE_CIUDAD || reserva.destino === BASE_CIUDAD) {
                console.log(`   ❌ NO cumple: Incluye Temuco Ciudad`);
                continue;
            }
            
            console.log(`   ✅ Cumple reglas de negocio`);
            
            // Verificar si existe oportunidad de retorno
            const oportunidadRetorno = oportunidades.find(o => 
                o.reserva_relacionada_id === reserva.id && o.tipo === 'retorno_vacio'
            );
            
            if (oportunidadRetorno) {
                console.log(`   ✅ Oportunidad de retorno EXISTE: ${oportunidadRetorno.codigo}`);
            } else {
                console.log(`   ⚠️  Oportunidad de retorno NO EXISTE`);
                console.log(`   → Debería generarse: ${reserva.destino} → ${reserva.origen}`);
                
                // Calcular hora aproximada
                if (reserva.hora) {
                    const [horas, minutos] = reserva.hora.split(":");
                    const horaSalida = new Date();
                    horaSalida.setHours(parseInt(horas), parseInt(minutos), 0, 0);
                    // Asumir 60 min de viaje + 30 min buffer
                    const horaDisponible = new Date(horaSalida.getTime() + 90 * 60000);
                    const horaAproximada = `${String(horaDisponible.getHours()).padStart(2, "0")}:${String(horaDisponible.getMinutes()).padStart(2, "0")}`;
                    console.log(`   → Hora aproximada calculada: ${horaAproximada}`);
                }
            }
            
            // Verificar si existe oportunidad de ida vacía
            if (reserva.origen !== AEROPUERTO) {
                const oportunidadIda = oportunidades.find(o => 
                    o.reserva_relacionada_id === reserva.id && o.tipo === 'ida_vacia'
                );
                
                if (oportunidadIda) {
                    console.log(`   ✅ Oportunidad de ida vacía EXISTE: ${oportunidadIda.codigo}`);
                } else {
                    console.log(`   ⚠️  Oportunidad de ida vacía NO EXISTE`);
                    console.log(`   → Debería generarse: ${AEROPUERTO} → ${reserva.origen}`);
                }
            }
        }

        console.log("\n" + "=".repeat(80));
        console.log("📊 RESUMEN");
        console.log("=".repeat(80));
        console.log(`Total de reservas confirmadas: ${reservas.length}`);
        console.log(`Total de oportunidades generadas: ${oportunidades.length}`);
        console.log(`Oportunidades esperadas (mínimo): ${reservas.length} (1 retorno por reserva)`);
        
        if (oportunidades.length < reservas.length) {
            console.log(`\n⚠️  PROBLEMA DETECTADO: Faltan ${reservas.length - oportunidades.length} oportunidades`);
            console.log(`\n💡 Solución: Ejecutar el endpoint de regeneración de oportunidades`);
            console.log(`   curl -X GET http://localhost:8080/api/oportunidades/regenerar`);
        } else {
            console.log(`\n✅ Todas las oportunidades esperadas están generadas`);
        }
        console.log("=".repeat(80));

    } catch (error) {
        console.error("\n❌ Error durante el diagnóstico:", error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

diagnosticarOportunidades()
    .then(() => {
        console.log("\n✅ Diagnóstico completado");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Error fatal:", error.message);
        process.exit(1);
    });
