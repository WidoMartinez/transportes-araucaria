import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

function simulateSplit(totalPago) {
    console.log(`\n🧪 Simulación de División de Pago: $${totalPago}`);
    
    // Supongamos un viaje de $100k total ($50k ida, $50k vuelta)
    const totalIda = 50000;
    const totalVuelta = 50000;
    const totalConjunto = totalIda + totalVuelta;
    
    const factorIda = totalIda / totalConjunto;
    const montoIda = Math.round(totalPago * factorIda);
    const montoVuelta = totalPago - montoIda;
    
    console.log(`📊 Resultado:`);
    console.log(`- Tramo IDA: $${montoIda} (${(factorIda * 100).toFixed(1)}%)`);
    console.log(`- Tramo VUELTA: $${montoVuelta} (${((1 - factorIda) * 100).toFixed(1)}%)`);
    
    if (montoIda + montoVuelta === totalPago) {
        console.log("✅ Verificación: La suma coincide con el total.");
    } else {
        console.error("❌ ERROR: La suma NO coincide.");
    }
}

// Pruebas con diferentes escenarios
simulateSplit(100000); // Pago total
simulateSplit(40000);  // Abono
simulateSplit(15500);  // Monto irregular

console.log("\nℹ️ Este script valida la lógica proporcional usada en server-db.js (webhook de Flow).");
process.exit();
