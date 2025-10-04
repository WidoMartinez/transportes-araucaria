import { testConnection, syncDatabase } from "./config/database.js";
import CodigoDescuento from "./models/CodigoDescuento.js";
import Destino from "./models/Destino.js";
import Promocion from "./models/Promocion.js";
import DescuentoGlobal from "./models/DescuentoGlobal.js";

async function testDatabase() {
	console.log("🧪 Iniciando pruebas de base de datos...\n");

	try {
		// 1. Probar conexión
		console.log("1️⃣ Probando conexión a la base de datos...");
		const connected = await testConnection();
		if (!connected) {
			throw new Error("❌ No se pudo conectar a la base de datos");
		}
		console.log("✅ Conexión exitosa\n");

		// 2. Sincronizar modelos
		console.log("2️⃣ Sincronizando modelos...");
		await syncDatabase(false);
		console.log("✅ Modelos sincronizados\n");

		// 3. Probar operaciones CRUD básicas
		console.log("3️⃣ Probando operaciones CRUD...");

		// Crear un destino de prueba
		const destinoTest = await Destino.create({
			nombre: "Destino de Prueba",
			precioIda: 15000,
			precioVuelta: 15000,
			precioIdaVuelta: 25000,
			activo: true,
			orden: 999,
		});
		console.log("✅ Destino creado:", destinoTest.nombre);

		// Crear una promoción de prueba
		const promocionTest = await Promocion.create({
			nombre: "Promoción de Prueba",
			dia: "lunes",
			tipo: "porcentaje",
			valor: 10,
			activo: true,
			descripcion: "Promoción de prueba para lunes",
		});
		console.log("✅ Promoción creada:", promocionTest.nombre);

		// Crear un descuento global de prueba
		const descuentoTest = await DescuentoGlobal.create({
			tipo: "descuentoPersonalizado",
			nombre: "Descuento de Prueba",
			valor: 5000,
			activo: true,
			descripcion: "Descuento de prueba",
		});
		console.log("✅ Descuento global creado:", descuentoTest.nombre);

		// Crear un código de descuento de prueba
		const codigoTest = await CodigoDescuento.create({
			id: "PRUEBA123",
			codigo: "PRUEBA123",
			descripcion: "Código de Prueba",
			tipo: "porcentaje",
			valor: 15,
			activo: true,
			limiteUsos: 10,
			usosActuales: 0,
			fechaVencimiento: "2024-12-31",
			destinosAplicables: ["Destino de Prueba"],
			montoMinimo: 10000,
			combinable: true,
			exclusivo: false,
			fechaCreacion: new Date().toISOString().split("T")[0],
			creadoPor: "test",
			limiteUsosPorUsuario: 1,
			usuariosQueUsaron: [],
		});
		console.log("✅ Código de descuento creado:", codigoTest.codigo);

		// 4. Probar consultas
		console.log("\n4️⃣ Probando consultas...");

		const destinos = await Destino.findAll();
		console.log(`✅ Destinos encontrados: ${destinos.length}`);

		const promociones = await Promocion.findAll();
		console.log(`✅ Promociones encontradas: ${promociones.length}`);

		const descuentos = await DescuentoGlobal.findAll();
		console.log(`✅ Descuentos globales encontrados: ${descuentos.length}`);

		const codigos = await CodigoDescuento.findAll();
		console.log(`✅ Códigos de descuento encontrados: ${codigos.length}`);

		// 5. Limpiar datos de prueba
		console.log("\n5️⃣ Limpiando datos de prueba...");

		await Destino.destroy({ where: { nombre: "Destino de Prueba" } });
		await Promocion.destroy({ where: { nombre: "Promoción de Prueba" } });
		await DescuentoGlobal.destroy({ where: { nombre: "Descuento de Prueba" } });
		await CodigoDescuento.destroy({ where: { codigo: "PRUEBA123" } });

		console.log("✅ Datos de prueba eliminados");

		console.log("\n🎉 ¡Todas las pruebas pasaron exitosamente!");
		console.log("✅ La base de datos está lista para usar");
	} catch (error) {
		console.error("\n❌ Error durante las pruebas:", error);
		throw error;
	}
}

// Ejecutar pruebas si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	testDatabase()
		.then(() => {
			console.log("\n🎯 Pruebas completadas exitosamente");
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n💥 Error en las pruebas:", error);
			process.exit(1);
		});
}

export default testDatabase;
