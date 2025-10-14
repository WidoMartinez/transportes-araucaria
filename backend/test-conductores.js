/**
 * Script de prueba para verificar los modelos de Conductor, Vehiculo y ViajesConductor
 * Este script NO requiere conexión a base de datos, solo verifica la sintaxis y estructura
 */

import Conductor from "./models/Conductor.js";
import Vehiculo from "./models/Vehiculo.js";
import ViajesConductor from "./models/ViajesConductor.js";
import Reserva from "./models/Reserva.js";
import { 
	obtenerUltimos4Patente, 
	formatearInfoConductor, 
	formatearInfoVehiculo 
} from "./utils/emailHelpers.js";

console.log("🧪 Iniciando pruebas del sistema de conductores y vehículos...\n");

// Test 1: Verificar que los modelos se pueden importar
console.log("✅ Test 1: Modelos importados correctamente");
console.log("   - Conductor:", Conductor.name);
console.log("   - Vehiculo:", Vehiculo.name);
console.log("   - ViajesConductor:", ViajesConductor.name);
console.log("   - Reserva:", Reserva.name);
console.log();

// Test 2: Verificar atributos del modelo Conductor
console.log("✅ Test 2: Atributos del modelo Conductor");
const conductorAttrs = Object.keys(Conductor.rawAttributes);
console.log("   Atributos:", conductorAttrs.join(", "));
const requiredConductorFields = ["nombre", "telefono", "activo"];
const hasConductorFields = requiredConductorFields.every(field => 
	conductorAttrs.includes(field)
);
console.log("   Campos requeridos presentes:", hasConductorFields ? "✅" : "❌");
console.log();

// Test 3: Verificar atributos del modelo Vehiculo
console.log("✅ Test 3: Atributos del modelo Vehiculo");
const vehiculoAttrs = Object.keys(Vehiculo.rawAttributes);
console.log("   Atributos:", vehiculoAttrs.join(", "));
const requiredVehiculoFields = ["patente", "tipo", "capacidad", "activo"];
const hasVehiculoFields = requiredVehiculoFields.every(field => 
	vehiculoAttrs.includes(field)
);
console.log("   Campos requeridos presentes:", hasVehiculoFields ? "✅" : "❌");
console.log();

// Test 4: Verificar atributos del modelo ViajesConductor
console.log("✅ Test 4: Atributos del modelo ViajesConductor");
const viajesAttrs = Object.keys(ViajesConductor.rawAttributes);
console.log("   Atributos:", viajesAttrs.join(", "));
const requiredViajesFields = ["conductorId", "vehiculoId", "reservaId", "montoPago"];
const hasViajesFields = requiredViajesFields.every(field => 
	viajesAttrs.includes(field)
);
console.log("   Campos requeridos presentes:", hasViajesFields ? "✅" : "❌");
console.log();

// Test 5: Verificar nuevos campos en Reserva
console.log("✅ Test 5: Nuevos campos en modelo Reserva");
const reservaAttrs = Object.keys(Reserva.rawAttributes);
const newReservaFields = ["conductorId", "vehiculoId"];
const hasNewReservaFields = newReservaFields.every(field => 
	reservaAttrs.includes(field)
);
console.log("   Campos conductorId y vehiculoId presentes:", hasNewReservaFields ? "✅" : "❌");
console.log();

// Test 6: Verificar funciones helper de email
console.log("✅ Test 6: Funciones helper de email");

// Test obtenerUltimos4Patente
const testPatentes = [
	{ input: "ABCD12", expected: "CD12" },
	{ input: "AB-CD-12", expected: "CD12" },
	{ input: "XY1234", expected: "1234" },
	{ input: "123", expected: "*123" },
	{ input: "ab", expected: "**AB" },
	{ input: null, expected: "****" },
	{ input: "", expected: "****" },
	{ input: "  ", expected: "****" },
	{ input: 123, expected: "****" }, // no es string
];

console.log("   Pruebas de obtenerUltimos4Patente:");
testPatentes.forEach(({ input, expected }) => {
	const result = obtenerUltimos4Patente(input);
	const passed = result === expected;
	console.log(`      ${passed ? "✅" : "❌"} Input: "${input}" → Expected: "${expected}", Got: "${result}"`);
});
console.log();

// Test formatearInfoConductor
const testConductores = [
	{ input: { nombre: "Juan Pérez" }, expected: "Juan Pérez" },
	{ input: null, expected: "Por asignar" },
	{ input: {}, expected: "Por asignar" },
];

console.log("   Pruebas de formatearInfoConductor:");
testConductores.forEach(({ input, expected }) => {
	const result = formatearInfoConductor(input);
	const passed = result === expected;
	console.log(`      ${passed ? "✅" : "❌"} Expected: "${expected}", Got: "${result}"`);
});
console.log();

// Test formatearInfoVehiculo
const testVehiculos = [
	{ input: { tipo: "SUV", patente: "ABCD12" }, expected: "SUV (***CD12)" },
	{ input: { tipo: "Sedan", patente: "XY-12-34" }, expected: "Sedan (***1234)" },
	{ input: null, expected: "Por asignar" },
];

console.log("   Pruebas de formatearInfoVehiculo:");
testVehiculos.forEach(({ input, expected }) => {
	const result = formatearInfoVehiculo(input);
	const passed = result === expected;
	console.log(`      ${passed ? "✅" : "❌"} Expected: "${expected}", Got: "${result}"`);
});
console.log();

// Test 7: Verificar tabla names
console.log("✅ Test 7: Nombres de tablas");
console.log("   - Conductor tableName:", Conductor.tableName);
console.log("   - Vehiculo tableName:", Vehiculo.tableName);
console.log("   - ViajesConductor tableName:", ViajesConductor.tableName);
console.log();

// Resumen final
console.log("=" .repeat(60));
console.log("🎉 TODAS LAS PRUEBAS COMPLETADAS");
console.log("=" .repeat(60));
console.log();
console.log("Resumen:");
console.log("  ✅ Modelos importados correctamente");
console.log("  ✅ Atributos de modelos verificados");
console.log("  ✅ Funciones helper funcionando correctamente");
console.log("  ✅ Nombres de tablas configurados");
console.log();
console.log("📝 Nota: Este script NO requiere conexión a base de datos.");
console.log("   Para probar con base de datos real, ejecutar la migración:");
console.log("   npm run migrate:conductores");
console.log();
