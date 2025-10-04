import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sequelize, { testConnection, syncDatabase } from "./config/database.js";
import CodigoDescuento from "./models/CodigoDescuento.js";
import Destino from "./models/Destino.js";
import Promocion from "./models/Promocion.js";
import DescuentoGlobal from "./models/DescuentoGlobal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateData() {
	try {
		console.log("🚀 Iniciando migración de datos...");

		// Probar conexión
		const connected = await testConnection();
		if (!connected) {
			throw new Error("No se pudo conectar a la base de datos");
		}

		// Sincronizar modelos (crear tablas)
		await syncDatabase(false); // false = no forzar recreación

		// Leer datos existentes del JSON
		const pricingDataPath = path.join(__dirname, "data", "pricing.json");
		const pricingData = JSON.parse(await readFile(pricingDataPath, "utf8"));

		console.log("📊 Migrando destinos...");
		// Migrar destinos
		if (pricingData.destinos && pricingData.destinos.length > 0) {
			for (const destino of pricingData.destinos) {
				await Destino.upsert({
					nombre: destino.nombre,
					precioIda: destino.precioIda,
					precioVuelta: destino.precioVuelta,
					precioIdaVuelta: destino.precioIdaVuelta,
					activo: destino.activo !== false,
					orden: destino.orden || 0,
				});
			}
		}

		console.log("🎯 Migrando promociones...");
		// Migrar promociones
		if (pricingData.dayPromotions && pricingData.dayPromotions.length > 0) {
			for (const promocion of pricingData.dayPromotions) {
				await Promocion.upsert({
					nombre: promocion.nombre,
					dia: promocion.dia,
					tipo: promocion.tipo,
					valor: promocion.valor,
					activo: promocion.activo !== false,
					descripcion: promocion.descripcion,
				});
			}
		}

		console.log("💰 Migrando descuentos globales...");
		// Migrar descuentos globales
		if (pricingData.descuentosGlobales) {
			const descuentos = pricingData.descuentosGlobales;

			// Descuento Online
			if (descuentos.descuentoOnline) {
				await DescuentoGlobal.upsert({
					tipo: "descuentoOnline",
					nombre: descuentos.descuentoOnline.nombre,
					valor: descuentos.descuentoOnline.valor,
					activo: descuentos.descuentoOnline.activo,
					descripcion: "Descuento por reserva online",
				});
			}

			// Descuento Round Trip
			if (descuentos.descuentoRoundTrip) {
				await DescuentoGlobal.upsert({
					tipo: "descuentoRoundTrip",
					nombre: descuentos.descuentoRoundTrip.nombre,
					valor: descuentos.descuentoRoundTrip.valor,
					activo: descuentos.descuentoRoundTrip.activo,
					descripcion: "Descuento por ida y vuelta",
				});
			}

			// Descuentos personalizados
			if (
				descuentos.descuentosPersonalizados &&
				descuentos.descuentosPersonalizados.length > 0
			) {
				for (const descuento of descuentos.descuentosPersonalizados) {
					await DescuentoGlobal.upsert({
						tipo: "descuentoPersonalizado",
						nombre: descuento.nombre,
						valor: descuento.valor,
						activo: descuento.activo,
						descripcion: descuento.descripcion,
					});
				}
			}
		}

		console.log("🎫 Migrando códigos de descuento...");
		// Migrar códigos de descuento
		if (
			pricingData.codigosDescuento &&
			pricingData.codigosDescuento.length > 0
		) {
			for (const codigo of pricingData.codigosDescuento) {
				await CodigoDescuento.upsert({
					id: codigo.id,
					codigo: codigo.codigo,
					descripcion: codigo.descripcion,
					tipo: codigo.tipo,
					valor: codigo.valor,
					activo: codigo.activo,
					limiteUsos: codigo.limiteUsos,
					usosActuales: codigo.usosActuales,
					fechaVencimiento: codigo.fechaVencimiento,
					destinosAplicables: codigo.destinosAplicables,
					montoMinimo: codigo.montoMinimo,
					combinable: codigo.combinable,
					exclusivo: codigo.exclusivo,
					fechaCreacion: codigo.fechaCreacion,
					creadoPor: codigo.creadoPor,
					limiteUsosPorUsuario: codigo.limiteUsosPorUsuario,
					usuariosQueUsaron: codigo.usuariosQueUsaron,
				});
			}
		}

		console.log("✅ Migración completada exitosamente!");

		// Mostrar estadísticas
		const destinosCount = await Destino.count();
		const promocionesCount = await Promocion.count();
		const descuentosCount = await DescuentoGlobal.count();
		const codigosCount = await CodigoDescuento.count();

		console.log("\n📈 Estadísticas de migración:");
		console.log(`- Destinos: ${destinosCount}`);
		console.log(`- Promociones: ${promocionesCount}`);
		console.log(`- Descuentos globales: ${descuentosCount}`);
		console.log(`- Códigos de descuento: ${codigosCount}`);
	} catch (error) {
		console.error("❌ Error durante la migración:", error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	migrateData()
		.then(() => {
			console.log("🎉 Proceso de migración finalizado");
			process.exit(0);
		})
		.catch((error) => {
			console.error("💥 Error en la migración:", error);
			process.exit(1);
		});
}

export default migrateData;
