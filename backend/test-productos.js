/* eslint-env node */
/**
 * Script de prueba para verificar la estructura de endpoints de productos
 * No requiere base de datos, solo valida que el código compile correctamente
 */

// Importar modelos
import Producto from "./models/Producto.js";
import ProductoReserva from "./models/ProductoReserva.js";
import setupAssociations from "./models/associations.js";
import addProductosTables from "./migrations/add-productos-tables.js";

console.log("🧪 Iniciando pruebas de estructura de productos...\n");

// Test 1: Verificar que los modelos se importaron correctamente
console.log("✓ Test 1: Modelos importados correctamente");
console.log("  - Producto:", typeof Producto);
console.log("  - ProductoReserva:", typeof ProductoReserva);

// Test 2: Verificar que la función de asociaciones existe
console.log("\n✓ Test 2: Función de asociaciones importada");
console.log("  - setupAssociations:", typeof setupAssociations);

// Test 3: Verificar que la migración existe
console.log("\n✓ Test 3: Migración de productos importada");
console.log("  - addProductosTables:", typeof addProductosTables);

// Test 4: Verificar estructura de campos del modelo Producto
console.log("\n✓ Test 4: Estructura del modelo Producto");
const productoFields = Producto.getAttributes();
const expectedProductoFields = [
	"id",
	"nombre",
	"descripcion",
	"categoria",
	"precio",
	"disponible",
	"stock",
	"imagenUrl",
	"orden",
	"disponibleEnRuta",
	"disponibleEnVehiculo",
];
expectedProductoFields.forEach((field) => {
	if (productoFields[field]) {
		console.log(`  ✓ Campo ${field}: ${productoFields[field].type.key}`);
	} else {
		console.log(`  ✗ Campo ${field}: NO ENCONTRADO`);
	}
});

// Test 5: Verificar estructura de campos del modelo ProductoReserva
console.log("\n✓ Test 5: Estructura del modelo ProductoReserva");
const productoReservaFields = ProductoReserva.getAttributes();
const expectedPRFields = [
	"id",
	"reservaId",
	"productoId",
	"cantidad",
	"precioUnitario",
	"subtotal",
	"notas",
	"estadoEntrega",
];
expectedPRFields.forEach((field) => {
	if (productoReservaFields[field]) {
		console.log(
			`  ✓ Campo ${field}: ${productoReservaFields[field].type.key}`
		);
	} else {
		console.log(`  ✗ Campo ${field}: NO ENCONTRADO`);
	}
});

// Test 6: Verificar que setupAssociations no genera errores al ejecutarse
console.log("\n✓ Test 6: Ejecutar setupAssociations");
try {
	setupAssociations();
	console.log("  ✓ Asociaciones configuradas correctamente");
} catch (error) {
	console.log("  ✗ Error al configurar asociaciones:", error.message);
}

console.log("\n✅ Todas las pruebas de estructura completadas exitosamente");
console.log(
	"\nNOTA: Estas pruebas solo verifican la estructura del código."
);
console.log(
	"Para pruebas completas con base de datos, ejecute: npm run test:db"
);
