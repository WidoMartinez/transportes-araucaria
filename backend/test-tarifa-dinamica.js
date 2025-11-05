/* eslint-env node */
// Test básico para endpoints de tarifa dinámica
import fetch from "axios";

const API_BASE_URL =
	process.env.API_URL || "https://transportes-araucaria.onrender.com";

async function testTarifaDinamica() {
	console.log("🧪 Iniciando tests de tarifa dinámica...\n");

	try {
		// Test 1: Listar configuraciones
		console.log("1️⃣ Test: Listar configuraciones de tarifa dinámica");
		const listResponse = await fetch.get(`${API_BASE_URL}/api/tarifa-dinamica`);
		console.log(`✅ Status: ${listResponse.status}`);
		console.log(`📊 Configuraciones encontradas: ${listResponse.data.length}`);
		if (listResponse.data.length > 0) {
			console.log(`   Primera configuración: ${listResponse.data[0].nombre}`);
		}
		console.log("");

		// Test 2: Calcular tarifa dinámica - Mismo día
		console.log("2️⃣ Test: Calcular tarifa - Mismo día (+25%)");
		const hoy = new Date().toISOString().split("T")[0];
		const calculoMismoDia = await fetch.post(
			`${API_BASE_URL}/api/tarifa-dinamica/calcular`,
			{
				precioBase: 60000,
				destino: "Pucón",
				fecha: hoy,
				hora: "08:00:00",
			}
		);
		console.log(`✅ Status: ${calculoMismoDia.status}`);
		console.log(`💰 Precio base: $${calculoMismoDia.data.precioBase}`);
		console.log(
			`📈 Ajuste total: ${calculoMismoDia.data.ajusteTotal}% ($${calculoMismoDia.data.ajusteMonto})`
		);
		console.log(`💵 Precio final: $${calculoMismoDia.data.precioFinal}`);
		console.log(`📋 Ajustes aplicados: ${calculoMismoDia.data.ajustesAplicados.length}`);
		calculoMismoDia.data.ajustesAplicados.forEach((ajuste) => {
			console.log(`   - ${ajuste.nombre}: ${ajuste.porcentaje}%`);
		});
		console.log("");

		// Test 3: Calcular tarifa dinámica - Fin de semana
		console.log("3️⃣ Test: Calcular tarifa - Fin de semana");
		const proximoSabado = new Date();
		proximoSabado.setDate(proximoSabado.getDate() + ((6 - proximoSabado.getDay() + 7) % 7 || 7));
		const fechaSabado = proximoSabado.toISOString().split("T")[0];
		const calculoFinSemana = await fetch.post(
			`${API_BASE_URL}/api/tarifa-dinamica/calcular`,
			{
				precioBase: 60000,
				destino: "Pucón",
				fecha: fechaSabado,
				hora: "14:00:00",
			}
		);
		console.log(`✅ Status: ${calculoFinSemana.status}`);
		console.log(`💰 Precio base: $${calculoFinSemana.data.precioBase}`);
		console.log(
			`📈 Ajuste total: ${calculoFinSemana.data.ajusteTotal}% ($${calculoFinSemana.data.ajusteMonto})`
		);
		console.log(`💵 Precio final: $${calculoFinSemana.data.precioFinal}`);
		console.log(`📋 Ajustes aplicados: ${calculoFinSemana.data.ajustesAplicados.length}`);
		calculoFinSemana.data.ajustesAplicados.forEach((ajuste) => {
			console.log(`   - ${ajuste.nombre}: ${ajuste.porcentaje}%`);
		});
		console.log("");

		// Test 4: Calcular tarifa dinámica - 30+ días de anticipación
		console.log("4️⃣ Test: Calcular tarifa - 30+ días anticipación (-15%)");
		const futuro = new Date();
		futuro.setDate(futuro.getDate() + 35);
		const fechaFuturo = futuro.toISOString().split("T")[0];
		const calculoAnticipacion = await fetch.post(
			`${API_BASE_URL}/api/tarifa-dinamica/calcular`,
			{
				precioBase: 60000,
				destino: "Pucón",
				fecha: fechaFuturo,
				hora: "10:00:00",
			}
		);
		console.log(`✅ Status: ${calculoAnticipacion.status}`);
		console.log(`💰 Precio base: $${calculoAnticipacion.data.precioBase}`);
		console.log(
			`📈 Ajuste total: ${calculoAnticipacion.data.ajusteTotal}% ($${calculoAnticipacion.data.ajusteMonto})`
		);
		console.log(`💵 Precio final: $${calculoAnticipacion.data.precioFinal}`);
		console.log(`📋 Ajustes aplicados: ${calculoAnticipacion.data.ajustesAplicados.length}`);
		calculoAnticipacion.data.ajustesAplicados.forEach((ajuste) => {
			console.log(`   - ${ajuste.nombre}: ${ajuste.porcentaje}%`);
		});
		console.log("");

		// Test 5: Calcular con múltiples ajustes (mismo día + sábado + horario temprano)
		console.log("5️⃣ Test: Múltiples ajustes - Mismo día + Sábado + Horario temprano");
		const calculoMultiple = await fetch.post(
			`${API_BASE_URL}/api/tarifa-dinamica/calcular`,
			{
				precioBase: 60000,
				destino: "Pucón",
				fecha: hoy,
				hora: "07:00:00",
			}
		);
		console.log(`✅ Status: ${calculoMultiple.status}`);
		console.log(`💰 Precio base: $${calculoMultiple.data.precioBase}`);
		console.log(
			`📈 Ajuste total: ${calculoMultiple.data.ajusteTotal}% ($${calculoMultiple.data.ajusteMonto})`
		);
		console.log(`💵 Precio final: $${calculoMultiple.data.precioFinal}`);
		console.log(`📋 Ajustes aplicados: ${calculoMultiple.data.ajustesAplicados.length}`);
		calculoMultiple.data.ajustesAplicados.forEach((ajuste) => {
			console.log(`   - ${ajuste.nombre}: ${ajuste.porcentaje}%`);
		});
		console.log("");

		console.log("✅ Todos los tests completados exitosamente");
	} catch (error) {
		console.error("❌ Error en tests:", error.message);
		if (error.response) {
			console.error(`   Status: ${error.response.status}`);
			console.error(`   Data:`, error.response.data);
		}
		process.exit(1);
	}
}

testTarifaDinamica();
