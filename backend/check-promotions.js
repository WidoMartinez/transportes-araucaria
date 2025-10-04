import sequelize from "./config/database.js";
import Promocion from "./models/Promocion.js";
import fs from "fs";

async function checkPromotions() {
	try {
		console.log("🔍 Verificando promociones en la base de datos...");

		const promociones = await Promocion.findAll();
		console.log(`📊 Promociones encontradas: ${promociones.length}`);

		if (promociones.length === 0) {
			console.log(
				"⚠️ No hay promociones en la BD. Verificando datos originales..."
			);

			// Leer datos originales del JSON
			const pricingData = JSON.parse(
				fs.readFileSync("./data/pricing.json", "utf8")
			);
			console.log(
				`📄 Promociones en JSON: ${pricingData.dayPromotions?.length || 0}`
			);

			if (pricingData.dayPromotions && pricingData.dayPromotions.length > 0) {
				console.log("🔄 Migrando promociones desde JSON...");

				for (const promo of pricingData.dayPromotions) {
					// Convertir la promoción del formato JSON al formato de BD
					await Promocion.create({
						nombre: promo.nombre,
						dia: "lunes", // Por defecto, se puede ajustar
						tipo: "porcentaje",
						valor: promo.descuentoPorcentaje || 0,
						activo: promo.activo !== false,
						descripcion: promo.descripcion || "",
					});
					console.log(`✅ Migrada: ${promo.nombre}`);
				}

				console.log("🎉 Migración de promociones completada");
			}
		} else {
			console.log("✅ Promociones ya existen en la BD");
			promociones.forEach((promo) => {
				console.log(`- ${promo.nombre} (${promo.dia}): ${promo.valor}%`);
			});
		}
	} catch (error) {
		console.error("❌ Error:", error.message);
	} finally {
		await sequelize.close();
	}
}

checkPromotions();
