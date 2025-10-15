/* eslint-env node */
/**
 * Prueba para verificar la generación de códigos de reserva
 */

import { testConnection, syncDatabase } from "./config/database.js";
import Reserva from "./models/Reserva.js";
import { Op } from "sequelize";
import sequelize from "./config/database.js";

// Función para generar código único de reserva (copiada del servidor)
const generarCodigoReserva = async () => {
	// Formato: RES-YYYYMMDD-XXXX donde XXXX es un contador diario
	const fecha = new Date();
	const year = fecha.getFullYear();
	const month = String(fecha.getMonth() + 1).padStart(2, '0');
	const day = String(fecha.getDate()).padStart(2, '0');
	const fechaStr = `${year}${month}${day}`;
	
	// Buscar la última reserva del día para obtener el siguiente número
	const inicioDelDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
	const finDelDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
	
	try {
		const reservasHoy = await Reserva.count({
			where: {
				createdAt: {
					[Op.gte]: inicioDelDia,
					[Op.lt]: finDelDia
				}
			}
		});
		
		// El contador empieza en 1 y se incrementa
		const contador = String(reservasHoy + 1).padStart(4, '0');
		const codigoReserva = `RES-${fechaStr}-${contador}`;
		
		// Verificar que no exista (por si acaso)
		const existe = await Reserva.findOne({ where: { codigoReserva } });
		if (existe) {
			// Si existe, agregar un sufijo aleatorio
			const sufijo = Math.random().toString(36).slice(2, 5).toUpperCase();
			return `RES-${fechaStr}-${contador}-${sufijo}`;
		}
		
		return codigoReserva;
	} catch (error) {
		console.error('Error generando código de reserva:', error);
		// Fallback: usar timestamp
		const timestamp = Date.now().toString().slice(-4);
		return `RES-${fechaStr}-${timestamp}`;
	}
};

async function testCodigoReserva() {
	console.log("🧪 Iniciando pruebas de código de reserva...\n");

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

		// 3. Probar generación de códigos
		console.log("3️⃣ Probando generación de códigos de reserva...");

		// Generar varios códigos
		const codigos = [];
		for (let i = 0; i < 3; i++) {
			const codigo = await generarCodigoReserva();
			codigos.push(codigo);
			console.log(`✅ Código generado: ${codigo}`);
		}

		// Verificar formato
		const formatoValido = /^RES-\d{8}-\d{4}(-[A-Z0-9]{3})?$/;
		for (const codigo of codigos) {
			if (!formatoValido.test(codigo)) {
				throw new Error(`❌ Formato de código inválido: ${codigo}`);
			}
		}
		console.log("✅ Todos los códigos tienen formato válido");

		// 4. Crear reservas de prueba con códigos
		console.log("\n4️⃣ Creando reservas de prueba...");

		const reservasPrueba = [];
		for (let i = 0; i < 3; i++) {
			const codigoReserva = await generarCodigoReserva();
			const reserva = await Reserva.create({
				codigoReserva,
				nombre: `Cliente Prueba ${i + 1}`,
				email: `prueba${i + 1}@test.com`,
				telefono: `+56912345${i}`,
				origen: "Santiago",
				destino: "Temuco",
				fecha: new Date(),
				hora: "10:00:00",
				pasajeros: 1,
				precio: 30000,
				totalConDescuento: 30000,
				estado: "pendiente",
				estadoPago: "pendiente",
			});
			reservasPrueba.push(reserva);
			console.log(`✅ Reserva creada con código: ${reserva.codigoReserva}`);
		}

		// 5. Verificar que los códigos son únicos
		console.log("\n5️⃣ Verificando unicidad de códigos...");
		const codigosReservas = reservasPrueba.map(r => r.codigoReserva);
		const codigosUnicos = new Set(codigosReservas);
		if (codigosUnicos.size !== codigosReservas.length) {
			throw new Error("❌ Se generaron códigos duplicados");
		}
		console.log("✅ Todos los códigos son únicos");

		// 6. Buscar reserva por código
		console.log("\n6️⃣ Probando búsqueda por código...");
		const codigoBuscar = reservasPrueba[0].codigoReserva;
		const reservaEncontrada = await Reserva.findOne({
			where: { codigoReserva: codigoBuscar }
		});
		if (!reservaEncontrada) {
			throw new Error("❌ No se pudo encontrar la reserva por código");
		}
		console.log(`✅ Reserva encontrada: ${reservaEncontrada.nombre} (${reservaEncontrada.codigoReserva})`);

		// 7. Limpiar datos de prueba
		console.log("\n7️⃣ Limpiando datos de prueba...");
		for (const reserva of reservasPrueba) {
			await reserva.destroy();
		}
		console.log("✅ Datos de prueba eliminados");

		console.log("\n🎉 ¡Todas las pruebas pasaron exitosamente!");
		console.log("✅ El sistema de códigos de reserva funciona correctamente");
	} catch (error) {
		console.error("\n❌ Error durante las pruebas:", error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

// Ejecutar pruebas si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	testCodigoReserva()
		.then(() => {
			console.log("\n🎯 Pruebas completadas exitosamente");
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n💥 Error en las pruebas:", error);
			process.exit(1);
		});
}

export default testCodigoReserva;
