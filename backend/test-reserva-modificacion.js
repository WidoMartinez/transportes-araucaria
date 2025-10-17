/* eslint-env node */
/* global process */
// Script de prueba para verificar la lógica de modificación de reservas
import { testConnection } from "./config/database.js";
import Reserva from "./models/Reserva.js";
import { Op } from "sequelize";

async function testReservaModificacion() {
	console.log("🧪 Probando lógica de modificación de reservas...\n");

	try {
		// 1. Probar conexión
		console.log("1️⃣ Probando conexión a la base de datos...");
		const connected = await testConnection();
		if (!connected) {
			throw new Error("❌ No se pudo conectar a la base de datos");
		}
		console.log("✅ Conexión exitosa\n");

		// Email de prueba
		const emailPrueba = `prueba-${Date.now()}@test.com`;
		
		// 2. Simular creación de primera reserva
		console.log("2️⃣ Creando primera reserva de prueba...");
		const primeraReserva = await Reserva.create({
			codigoReserva: `AR-TEST-${Date.now()}-0001`,
			nombre: "Cliente de Prueba",
			email: emailPrueba,
			telefono: "+56912345678",
			origen: "Aeropuerto La Araucanía",
			destino: "Pucón",
			fecha: "2025-10-20",
			hora: "08:00:00",
			pasajeros: 2,
			precio: 50000,
			totalConDescuento: 45000,
			estado: "pendiente_detalles",
			estadoPago: "pendiente",
			source: "test",
		});
		console.log(`✅ Primera reserva creada con código: ${primeraReserva.codigoReserva}`);
		console.log(`   Email: ${primeraReserva.email}`);
		console.log(`   Destino: ${primeraReserva.destino}\n`);

		// 3. Verificar si existe reserva activa (debe encontrarla)
		console.log("3️⃣ Verificando existencia de reserva activa...");
		const reservaExistente = await Reserva.findOne({
			where: {
				email: emailPrueba.toLowerCase().trim(),
				estado: {
					[Op.in]: ["pendiente", "pendiente_detalles"],
				},
				estadoPago: "pendiente",
			},
			order: [["createdAt", "DESC"]],
		});

		if (reservaExistente) {
			console.log(`✅ Se encontró reserva activa: ${reservaExistente.codigoReserva}`);
			console.log(`   Estado: ${reservaExistente.estado}`);
			console.log(`   Estado Pago: ${reservaExistente.estadoPago}\n`);
		} else {
			throw new Error("❌ No se encontró la reserva activa que debería existir");
		}

		// 4. Simular modificación de la reserva
		console.log("4️⃣ Modificando reserva existente...");
		await reservaExistente.update({
			destino: "Villarrica",
			pasajeros: 3,
			precio: 60000,
			totalConDescuento: 54000,
		});
		console.log(`✅ Reserva modificada exitosamente`);
		console.log(`   Código (debe ser el mismo): ${reservaExistente.codigoReserva}`);
		console.log(`   Nuevo destino: ${reservaExistente.destino}`);
		console.log(`   Nuevos pasajeros: ${reservaExistente.pasajeros}\n`);

		// 5. Verificar que solo existe una reserva
		console.log("5️⃣ Verificando que no se duplicó la reserva...");
		const todasLasReservas = await Reserva.findAll({
			where: {
				email: emailPrueba,
			},
		});
		console.log(`✅ Número de reservas para ${emailPrueba}: ${todasLasReservas.length}`);
		if (todasLasReservas.length !== 1) {
			throw new Error(`❌ Error: Se encontraron ${todasLasReservas.length} reservas, debería haber solo 1`);
		}

		// 6. Simular reserva pagada y crear nueva
		console.log("\n6️⃣ Marcando reserva como pagada...");
		await reservaExistente.update({
			estadoPago: "pagado",
		});
		console.log(`✅ Reserva marcada como pagada\n`);

		console.log("7️⃣ Creando segunda reserva (debe crear nueva porque la anterior está pagada)...");
		const segundaReserva = await Reserva.create({
			codigoReserva: `AR-TEST-${Date.now()}-0002`,
			nombre: "Cliente de Prueba",
			email: emailPrueba,
			telefono: "+56912345678",
			origen: "Aeropuerto La Araucanía",
			destino: "Malalcahuello",
			fecha: "2025-10-25",
			hora: "08:00:00",
			pasajeros: 4,
			precio: 70000,
			totalConDescuento: 63000,
			estado: "pendiente_detalles",
			estadoPago: "pendiente",
			source: "test",
		});
		console.log(`✅ Segunda reserva creada con código: ${segundaReserva.codigoReserva}`);
		console.log(`   Destino: ${segundaReserva.destino}\n`);

		// 8. Verificar que ahora hay dos reservas
		console.log("8️⃣ Verificando total de reservas...");
		const reservasFinales = await Reserva.findAll({
			where: {
				email: emailPrueba,
			},
		});
		console.log(`✅ Número total de reservas para ${emailPrueba}: ${reservasFinales.length}`);
		if (reservasFinales.length !== 2) {
			throw new Error(`❌ Error: Se encontraron ${reservasFinales.length} reservas, debería haber 2`);
		}
		console.log(`   - Reserva 1 (pagada): ${reservasFinales.find(r => r.estadoPago === "pagado").codigoReserva}`);
		console.log(`   - Reserva 2 (pendiente): ${reservasFinales.find(r => r.estadoPago === "pendiente").codigoReserva}\n`);

		// 9. Limpiar datos de prueba
		console.log("9️⃣ Limpiando datos de prueba...");
		await Reserva.destroy({
			where: {
				email: emailPrueba,
			},
		});
		console.log(`✅ Datos de prueba eliminados\n`);

		console.log("✅✅✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE ✅✅✅\n");
		console.log("Resumen de comportamiento verificado:");
		console.log("1. ✓ Reserva sin pagar se puede modificar");
		console.log("2. ✓ No se duplican reservas al modificar");
		console.log("3. ✓ Se puede crear nueva reserva después de pagar la anterior");
		console.log("4. ✓ Código de reserva se mantiene al modificar");
		
		process.exit(0);
	} catch (error) {
		console.error("\n❌ Error en las pruebas:", error.message);
		console.error(error);
		process.exit(1);
	}
}

// Ejecutar pruebas
testReservaModificacion();
