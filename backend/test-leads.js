// Test script para verificar el modelo Lead y los endpoints
import dotenv from "dotenv";
import { testConnection, syncDatabase } from "./config/database.js";
import Lead from "./models/Lead.js";
import Reserva from "./models/Reserva.js";

dotenv.config();

async function testLeadModel() {
	console.log("\n=== TEST DEL MODELO LEAD ===\n");

	try {
		// 1. Verificar conexión
		console.log("1️⃣ Verificando conexión a la base de datos...");
		const connected = await testConnection();
		if (!connected) {
			throw new Error("No se pudo conectar a la base de datos");
		}

		// 2. Sincronizar modelos
		console.log("\n2️⃣ Sincronizando modelos con la base de datos...");
		await syncDatabase(false); // false = no borrar datos existentes

		// 3. Crear un lead de prueba
		console.log("\n3️⃣ Creando lead de prueba...");
		const leadPrueba = await Lead.create({
			nombre: "Juan Pérez Test",
			email: "juan.test@example.com",
			telefono: "+56912345678",
			origen: "Temuco",
			destino: "Aeropuerto",
			fecha: "2025-10-15",
			pasajeros: 2,
			ultimaPagina: "/reservas",
			tiempoEnSitio: 180,
			pasoAlcanzado: "cotizacion",
			dispositivo: "desktop",
			navegador: "Chrome",
			sistemaOperativo: "Windows",
			source: "test",
			utmSource: "test",
			estadoRemarketing: "nuevo",
		});

		console.log("✅ Lead creado con ID:", leadPrueba.id);

		// 4. Buscar el lead
		console.log("\n4️⃣ Buscando lead por email...");
		const leadEncontrado = await Lead.findOne({
			where: { email: "juan.test@example.com" },
		});

		if (leadEncontrado) {
			console.log("✅ Lead encontrado:", {
				id: leadEncontrado.id,
				nombre: leadEncontrado.nombre,
				email: leadEncontrado.email,
				destino: leadEncontrado.destino,
				estadoRemarketing: leadEncontrado.estadoRemarketing,
			});
		} else {
			console.log("❌ No se encontró el lead");
		}

		// 5. Actualizar el lead
		console.log("\n5️⃣ Actualizando lead (marcando como contactado)...");
		await leadEncontrado.update({
			intentosContacto: leadEncontrado.intentosContacto + 1,
			ultimoContacto: new Date(),
			estadoRemarketing: "contactado",
			notas: "Cliente contactado vía telefónica, interesado en el viaje.",
		});

		console.log("✅ Lead actualizado correctamente");

		// 6. Listar todos los leads no convertidos
		console.log("\n6️⃣ Listando leads no convertidos...");
		const leadsNoConvertidos = await Lead.findAll({
			where: { convertido: false },
			limit: 5,
			order: [["createdAt", "DESC"]],
		});

		console.log(`✅ Se encontraron ${leadsNoConvertidos.length} leads no convertidos`);
		leadsNoConvertidos.forEach((lead) => {
			console.log(`  - ${lead.nombre} (${lead.email}) - ${lead.estadoRemarketing}`);
		});

		// 7. Simular conversión de lead a reserva
		console.log("\n7️⃣ Creando reserva de prueba...");
		const reservaPrueba = await Reserva.create({
			nombre: "Juan Pérez Test",
			email: "juan.test@example.com",
			telefono: "+56912345678",
			origen: "Temuco",
			destino: "Aeropuerto",
			fecha: "2025-10-15",
			hora: "08:00:00",
			pasajeros: 2,
			precio: 50000,
			totalConDescuento: 45000,
			source: "test",
			estado: "confirmada",
			estadoPago: "pendiente",
		});

		console.log("✅ Reserva creada con ID:", reservaPrueba.id);

		// 8. Marcar lead como convertido
		console.log("\n8️⃣ Marcando lead como convertido...");
		await leadEncontrado.update({
			convertido: true,
			reservaId: reservaPrueba.id,
			estadoRemarketing: "convertido",
		});

		console.log("✅ Lead marcado como convertido con reserva ID:", reservaPrueba.id);

		// 9. Verificar lead convertido
		const leadConvertido = await Lead.findByPk(leadEncontrado.id);
		console.log("✅ Estado final del lead:", {
			convertido: leadConvertido.convertido,
			reservaId: leadConvertido.reservaId,
			estadoRemarketing: leadConvertido.estadoRemarketing,
		});

		// 10. Limpieza (eliminar datos de prueba)
		console.log("\n🧹 Limpiando datos de prueba...");
		await reservaPrueba.destroy();
		await leadPrueba.destroy();
		console.log("✅ Datos de prueba eliminados");

		console.log("\n✅ ¡Todos los tests pasaron exitosamente!");
		console.log("\n📊 RESUMEN:");
		console.log("  ✅ Modelo Lead funciona correctamente");
		console.log("  ✅ Creación de leads OK");
		console.log("  ✅ Búsqueda de leads OK");
		console.log("  ✅ Actualización de leads OK");
		console.log("  ✅ Conversión de lead a reserva OK");
		console.log("  ✅ Limpieza de datos OK");

		process.exit(0);
	} catch (error) {
		console.error("\n❌ Error en los tests:", error);
		console.error(error.stack);
		process.exit(1);
	}
}

// Ejecutar tests
testLeadModel();
