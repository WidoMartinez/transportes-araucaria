
// Mock logic simulation
async function testSplitLogic() {
    console.log("--- TEST LOGICA DE SPLIT ---");
    
    // CASO 1: Pago Total ($100.000)
    await runScenario("Pago Total", 100000, 100000, 50000, 50000);
    
    // CASO 2: Pago Abono ($40.000) - Umbral 40% = $40.000 (20k cada uno)
    await runScenario("Pago Abono", 100000, 40000, 50000, 50000);

    // CASO 3: Pago Parcial Insuficiente ($10.000)
    await runScenario("Pago Insuficiente", 100000, 10000, 50000, 50000);
}

async function runScenario(nombre, totalViaje, pagoMonto, totalIda, totalVuelta) {
    console.log(`\n🧪 ESCENARIO: ${nombre}`);
    console.log(`Datos: Total Viaje $${totalViaje}, Pago Entrante $${pagoMonto}`);
    console.log(`Ida: $${totalIda} | Vuelta: $${totalVuelta}`);

    // LOGICA COPIADA DEL BACKEND
    let montoActual = pagoMonto;
    let montoIda = montoActual;
    let montoVuelta = 0;
    
    const totalConjunto = totalIda + totalVuelta;

    if (totalConjunto > 0) {
        const factorIda = totalIda / totalConjunto;
        montoIda = Math.round(montoActual * factorIda);
        montoVuelta = montoActual - montoIda;
        console.log(`> Split Calculado: Ida $${montoIda} | Vuelta $${montoVuelta}`);
    }

    // Simulacion Ida
    evaluateReserva("IDA", totalIda, montoIda);
    // Simulacion Vuelta
    evaluateReserva("VUELTA", totalVuelta, montoVuelta);
}

function evaluateReserva(tipo, total, pago) {
    const umbral = total * 0.4;
    let estado = "pendiente";
    
    if (pago >= total && total > 0) {
        estado = "confirmada (PAGAD0)";
    } else if (pago >= umbral) {
        estado = "confirmada (ABONADO)";
    } else if (pago > 0) {
        estado = "pendiente (PARCIAL INSUFICIENTE)";
    }

    console.log(`  [${tipo}] Meta: $${total} (Umbral $${umbral}) | Recibido: $${pago} -> Estado Final: ${estado}`);
}

testSplitLogic();
