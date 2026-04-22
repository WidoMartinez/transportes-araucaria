/* eslint-env node */
// Migración para catálogo administrable de hoteles del módulo Aeropuerto-Hoteles
import sequelize from "../config/database.js";

const HOTELES_SEMILLA = [
	{
		codigo: "dreams-temuco",
		nombre: "Hotel Dreams Araucanía",
		comuna: "Temuco",
		tarifaSoloIda: 32000,
		tarifaIdaVuelta: 59000,
	},
	{
		codigo: "frontera-temuco",
		nombre: "Hotel Frontera Plaza",
		comuna: "Temuco",
		tarifaSoloIda: 30000,
		tarifaIdaVuelta: 56000,
	},
	{
		codigo: "diego-almagro-temuco",
		nombre: "Hotel Diego de Almagro Temuco",
		comuna: "Temuco",
		tarifaSoloIda: 30000,
		tarifaIdaVuelta: 56000,
	},
	{
		codigo: "enjoy-pucon",
		nombre: "Enjoy Pucón",
		comuna: "Pucón",
		tarifaSoloIda: 85000,
		tarifaIdaVuelta: 160000,
	},
	{
		codigo: "antumalal-pucon",
		nombre: "Hotel Antumalal",
		comuna: "Pucón",
		tarifaSoloIda: 85000,
		tarifaIdaVuelta: 160000,
	},
	{
		codigo: "park-lake-villarrica",
		nombre: "Hotel Park Lake Villarrica",
		comuna: "Villarrica",
		tarifaSoloIda: 79000,
		tarifaIdaVuelta: 149000,
	},
	{
		codigo: "malalcahuello-thermal",
		nombre: "Malalcahuello Thermal Hotel & Spa",
		comuna: "Malalcahuello",
		tarifaSoloIda: 98000,
		tarifaIdaVuelta: 186000,
	},
	{
		codigo: "corralco-resort",
		nombre: "Corralco Mountain & Ski Resort",
		comuna: "Lonquimay",
		tarifaSoloIda: 115000,
		tarifaIdaVuelta: 219000,
	},
];

const addHotelesTrasladoTable = async () => {
	try {
		console.log("🔄 Verificando tabla hoteles_traslado...");

		const [results] = await sequelize.query(`
			SHOW TABLES LIKE 'hoteles_traslado';
		`);

		if (results.length === 0) {
			console.log("📋 Creando tabla hoteles_traslado...");

			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS hoteles_traslado (
					id INT AUTO_INCREMENT PRIMARY KEY,
					codigo VARCHAR(80) NOT NULL UNIQUE,
					nombre VARCHAR(255) NOT NULL,
					comuna VARCHAR(120) NOT NULL,
					tarifa_solo_ida DECIMAL(10,2) NOT NULL,
					tarifa_ida_vuelta DECIMAL(10,2) NOT NULL,
					activo TINYINT(1) NOT NULL DEFAULT 1,
					orden INT NOT NULL DEFAULT 0,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					INDEX idx_hoteles_traslado_activo_orden (activo, orden)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
				COMMENT='Catálogo administrable de hoteles con tarifas fijas para traslados';
			`);

			console.log("✅ Tabla hoteles_traslado creada exitosamente");
		} else {
			console.log("✅ Tabla hoteles_traslado ya existe");
		}

		const [conteoRows] = await sequelize.query(
			"SELECT COUNT(*) AS total FROM hoteles_traslado",
		);
		const total = Number(conteoRows?.[0]?.total || 0);

		if (total === 0) {
			console.log("📦 Insertando hoteles semilla para catálogo de traslados...");
			for (let index = 0; index < HOTELES_SEMILLA.length; index += 1) {
				const hotel = HOTELES_SEMILLA[index];
				await sequelize.query(
					`
					INSERT INTO hoteles_traslado (
						codigo, nombre, comuna, tarifa_solo_ida, tarifa_ida_vuelta, activo, orden
					) VALUES (
						:codigo, :nombre, :comuna, :tarifaSoloIda, :tarifaIdaVuelta, 1, :orden
					)
				`,
					{
						replacements: {
							codigo: hotel.codigo,
							nombre: hotel.nombre,
							comuna: hotel.comuna,
							tarifaSoloIda: hotel.tarifaSoloIda,
							tarifaIdaVuelta: hotel.tarifaIdaVuelta,
							orden: index + 1,
						},
					},
				);
			}
			console.log("✅ Hoteles semilla creados");
		}
	} catch (error) {
		console.error("❌ Error en migración hoteles_traslado:", error);
		throw error;
	}
};

export default addHotelesTrasladoTable;
