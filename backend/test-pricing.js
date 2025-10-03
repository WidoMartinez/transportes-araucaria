import fetch from "node-fetch";

async function testPricing() {
	try {
		console.log("🔍 Probando endpoint /pricing...");
		const response = await fetch(
			"https://transportes-araucaria.onrender.com/pricing"
		);

		if (!response.ok) {
			console.error(
				"❌ Error en la respuesta:",
				response.status,
				response.statusText
			);
			return;
		}

		const data = await response.json();
		console.log("📥 Datos recibidos:");
		console.log("- Destinos:", data.destinos?.length || 0);
		console.log("- Promociones:", data.dayPromotions?.length || 0);
		console.log("- Códigos:", data.codigosDescuento?.length || 0);

		// Verificar estructura de promociones
		if (data.dayPromotions && data.dayPromotions.length > 0) {
			console.log("\n🔍 Primera promoción:");
			const primera = data.dayPromotions[0];
			console.log("- ID:", primera.id);
			console.log("- Nombre:", primera.nombre);
			console.log("- Días:", primera.dias);
			console.log("- Aplica por días:", primera.aplicaPorDias);
			console.log("- Descuento:", primera.descuentoPorcentaje);
			console.log("- Tipo viaje:", primera.aplicaTipoViaje);
		}

		// Verificar si hay problemas con arrays
		console.log("\n🔍 Verificando arrays:");
		data.dayPromotions?.forEach((promo, index) => {
			if (!Array.isArray(promo.dias)) {
				console.error(
					`❌ Promoción ${index}: dias no es array:`,
					typeof promo.dias,
					promo.dias
				);
			}
		});
	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

testPricing();
