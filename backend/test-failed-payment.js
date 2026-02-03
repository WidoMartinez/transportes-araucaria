import { testConnection } from "./config/database.js";
import Reserva from "./models/Reserva.js";
import Transaccion from "./models/Transaccion.js";

/**
 * Script de prueba para validar el registro de transacciones fallidas
 * Simula un webhook de Flow con status 3 (Rechazado)
 */

async function testFailedPaymentRecording() {
	console.log("🧪 Iniciando prueba de registro de transacciones fallidas...\n");

	try {
		// 1. Verificar conexión
		console.log("1️⃣ Verificando conexión a la base de datos...");
		const connected = await testConnection();
		if (!connected) {
			throw new Error("❌ No se pudo conectar a la base de datos");
		}
		console.log("✅ Conexión exitosa\n");

		// 2. Buscar una reserva existente para la prueba
		console.log("2️⃣ Buscando una reserva existente...");
		const reserva = await Reserva.findOne({
			order: [["created_at", "DESC"]],
		});

		if (!reserva) {
			throw new Error("❌ No se encontró ninguna reserva en la base de datos");
		}

		console.log(`✅ Reserva encontrada: ID ${reserva.id}, Código ${reserva.codigoReserva}\n`);

		// 3. Simular datos de un pago fallido de Flow
		console.log("3️⃣ Simulando pago fallido (status 3 - Rechazado)...");
		const mockPaymentData = {
			flowOrder: 999999999, // Número de orden ficticio
			status: 3, // Rechazado
			amount: 50000,
			paymentDate: new Date().toISOString(),
			commerceOrder: `${reserva.codigoReserva}-${Date.now()}`,
			payer: {
				email: reserva.email || "test@example.com",
			},
		};

		// 4. Crear transacción fallida
		console.log("4️⃣ Registrando transacción fallida...");
		const transaccion = await Transaccion.create({
			reservaId: reserva.id,
			codigoPagoId: null,
			monto: Number(mockPaymentData.amount),
			gateway: "flow",
			transaccionId: mockPaymentData.flowOrder.toString(),
			referencia: null,
			tipoPago: null,
			estado: "fallido",
			emailPagador: mockPaymentData.payer.email,
			metadata: {
				flowOrder: mockPaymentData.flowOrder,
				status: mockPaymentData.status,
				amount: mockPaymentData.amount,
				paymentDate: mockPaymentData.paymentDate,
				commerceOrder: mockPaymentData.commerceOrder,
				payer: mockPaymentData.payer,
			},
			notas: "Pago Rechazado por Flow. No se actualizó el estado de la reserva.",
		});

		console.log(`✅ Transacción fallida creada: ID ${transaccion.id}\n`);

		// 5. Verificar que la transacción se guardó correctamente
		console.log("5️⃣ Verificando transacción guardada...");
		const transaccionGuardada = await Transaccion.findByPk(transaccion.id);

		if (!transaccionGuardada) {
			throw new Error("❌ La transacción no se guardó correctamente");
		}

		console.log("✅ Transacción verificada:");
		console.log(`   - ID: ${transaccionGuardada.id}`);
		console.log(`   - Reserva ID: ${transaccionGuardada.reservaId}`);
		console.log(`   - Monto: $${transaccionGuardada.monto}`);
		console.log(`   - Estado: ${transaccionGuardada.estado}`);
		console.log(`   - Gateway: ${transaccionGuardada.gateway}`);
		console.log(`   - Flow Order: ${transaccionGuardada.transaccionId}\n`);

		// 6. Verificar que la reserva NO fue modificada
		console.log("6️⃣ Verificando que la reserva no fue modificada...");
		const reservaActualizada = await Reserva.findByPk(reserva.id);

		if (reservaActualizada.pagoMonto !== reserva.pagoMonto) {
			throw new Error("❌ La reserva fue modificada incorrectamente");
		}

		console.log("✅ La reserva mantiene su estado original (correcto)\n");

		// 7. Limpiar datos de prueba
		console.log("7️⃣ Limpiando datos de prueba...");
		await Transaccion.destroy({ where: { id: transaccion.id } });
		console.log("✅ Datos de prueba eliminados\n");

		console.log("🎉 ¡Todas las pruebas pasaron exitosamente!");
		console.log("✅ El sistema registra correctamente las transacciones fallidas");
	} catch (error) {
		console.error("\n❌ Error durante las pruebas:", error);
		throw error;
	}
}

// Ejecutar pruebas si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	testFailedPaymentRecording()
		.then(() => {
			console.log("\n🎯 Pruebas completadas exitosamente");
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n💥 Error en las pruebas:", error);
			process.exit(1);
		});
}

export default testFailedPaymentRecording;
