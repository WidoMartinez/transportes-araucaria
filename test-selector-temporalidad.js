// Test para diagnosticar el problema del selector de temporalidad
// Este script simula el comportamiento de AdminEstadisticas.jsx

import {
    endOfDay,
    startOfDay,
    startOfMonth,
    endOfMonth,
    subDays,
    subMonths,
} from "date-fns";

// Función construirRango copiada de AdminEstadisticas.jsx
function construirRango(tipo, personalizado = {}) {
    const hoy = new Date();

    const formatearEtiqueta = (fechaInicio, fechaFin, fallback) => {
        if (!fechaInicio || !fechaFin) {
            return fallback;
        }
        return `Del ${fechaInicio.toLocaleDateString("es-CL")} al ${fechaFin.toLocaleDateString("es-CL")}`;
    };

    switch (tipo) {
        case "todos":
            return {
                tipo,
                fechaInicio: null,
                fechaFin: null,
                etiqueta: "Todo el historial",
            };
        case "ultimos-15": {
            const fechaFin = endOfDay(hoy);
            const fechaInicio = startOfDay(subDays(hoy, 14));
            return {
                tipo,
                fechaInicio,
                fechaFin,
                etiqueta: "Últimos 15 días",
            };
        }
        case "ultimos-30": {
            const fechaFin = endOfDay(hoy);
            const fechaInicio = startOfDay(subDays(hoy, 29));
            return {
                tipo,
                fechaInicio,
                fechaFin,
                etiqueta: "Últimos 30 días",
            };
        }
        case "mes-actual": {
            const fechaFin = endOfDay(endOfMonth(hoy));
            const fechaInicio = startOfDay(startOfMonth(hoy));
            return {
                tipo,
                fechaInicio,
                fechaFin,
                etiqueta: "Este mes",
            };
        }
        case "mes-pasado": {
            const mesAnterior = subMonths(hoy, 1);
            const fechaInicio = startOfDay(startOfMonth(mesAnterior));
            const fechaFin = endOfDay(endOfMonth(mesAnterior));
            return {
                tipo,
                fechaInicio,
                fechaFin,
                etiqueta: "Mes pasado",
            };
        }
        case "personalizado": {
            const { fechaInicio, fechaFin } = personalizado;
            return {
                tipo,
                fechaInicio: fechaInicio ? startOfDay(fechaInicio) : null,
                fechaFin: fechaFin ? endOfDay(fechaFin) : null,
                etiqueta: formatearEtiqueta(fechaInicio, fechaFin, "Rango personalizado"),
            };
        }
        default:
            return {
                tipo,
                fechaInicio: null,
                fechaFin: null,
                etiqueta: "Todo el historial",
            };
    }
}

// Función para construir query params
function construirQueryFechas(rangoAplicado, parametrosAdicionales = {}) {
    const params = new URLSearchParams();
    if (rangoAplicado.fechaInicio) {
        params.append("from", rangoAplicado.fechaInicio.toISOString());
    }
    if (rangoAplicado.fechaFin) {
        params.append("to", rangoAplicado.fechaFin.toISOString());
    }
    Object.entries(parametrosAdicionales).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== "") {
            params.append(clave, valor);
        }
    });
    const query = params.toString();
    return query ? `?${query}` : "";
}

// PRUEBAS
console.log("=== DIAGNÓSTICO DEL SELECTOR DE TEMPORALIDAD ===\n");

const opciones = [
    "ultimos-15",
    "ultimos-30",
    "mes-actual",
    "mes-pasado",
    "todos"
];

opciones.forEach(opcion => {
    console.log(`\n📅 Probando opción: "${opcion}"`);
    const rango = construirRango(opcion);
    
    console.log(`   Etiqueta: ${rango.etiqueta}`);
    console.log(`   Fecha Inicio: ${rango.fechaInicio ? rango.fechaInicio.toISOString() : "null"}`);
    console.log(`   Fecha Fin: ${rango.fechaFin ? rango.fechaFin.toISOString() : "null"}`);
    
    const query = construirQueryFechas(rango);
    console.log(`   Query generado: ${query || "(vacío)"}`);
    
    // Verificar si las fechas son válidas
    if (rango.fechaInicio && isNaN(rango.fechaInicio.getTime())) {
        console.log(`   ❌ ERROR: fechaInicio es inválida`);
    }
    if (rango.fechaFin && isNaN(rango.fechaFin.getTime())) {
        console.log(`   ❌ ERROR: fechaFin es inválida`);
    }
    
    // Verificar que fechaFin >= fechaInicio
    if (rango.fechaInicio && rango.fechaFin && rango.fechaFin < rango.fechaInicio) {
        console.log(`   ❌ ERROR: fechaFin es anterior a fechaInicio`);
    }
});

// Probar cambio de opción (simular useEffect)
console.log("\n\n=== SIMULANDO CAMBIO DE SELECTOR ===\n");

let rangoAplicado = construirRango("ultimos-30");
console.log("1. Estado inicial: ultimos-30");
console.log(`   Rango: ${JSON.stringify(rangoAplicado, null, 2)}`);

console.log("\n2. Usuario cambia a 'mes-actual'");
const nuevoRango = construirRango("mes-actual");
console.log(`   Nuevo rango: ${JSON.stringify(nuevoRango, null, 2)}`);

console.log("\n3. Comparando objetos (React detectaría cambio?)");
console.log(`   rangoAplicado === nuevoRango: ${rangoAplicado === nuevoRango}`);
console.log(`   ✅ Son objetos diferentes, useEffect DEBERÍA dispararse`);

rangoAplicado = nuevoRango;

console.log("\n4. Query que se enviaría al backend:");
const query = construirQueryFechas(rangoAplicado);
console.log(`   ${query}`);

console.log("\n\n=== CONCLUSIÓN ===");
console.log("Si este test muestra que las fechas se calculan correctamente,");
console.log("el problema podría estar en:");
console.log("1. El useEffect no se está disparando");
console.log("2. Las funciones fetch no se están llamando");
console.log("3. El backend no está respondiendo");
console.log("4. Los datos se están cargando pero no se muestran en la UI");
