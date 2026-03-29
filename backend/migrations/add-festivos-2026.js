/* eslint-env node */
// Migración para insertar feriados nacionales de Chile 2026
// Los feriados recurrentes (Año Nuevo, Navidad, etc.) ya están en la tabla.
// Esta migración agrega solo los feriados de fecha variable para el año 2026.
import sequelize from "../config/database.js";

const addFestivos2026 = async () => {
	try {
		console.log("🔄 Verificando feriados 2026 en tabla festivos...");

		// Comprobar si la tabla festivos existe antes de operar
		const [tablaExiste] = await sequelize.query(`
			SHOW TABLES LIKE 'festivos';
		`);

		if (tablaExiste.length === 0) {
			console.log("⏭️  Tabla festivos no existe aún, se omite migración 2026");
			return;
		}

		// Feriados de fecha variable para 2026 (los recurrentes ya están cubiertos)
		const festivos2026 = [
			// Semana Santa 2026: Pascua cae el 5 de abril
			{
				fecha: "2026-04-03",
				nombre: "Viernes Santo",
				tipo: "feriado_nacional",
				recurrente: false,
				descripcion: "Viernes Santo 2026",
			},
			{
				fecha: "2026-04-04",
				nombre: "Sábado Santo",
				tipo: "feriado_nacional",
				recurrente: false,
				descripcion: "Sábado Santo 2026",
			},
			// Pueblos Indígenas: 21 junio 2026 cae domingo → se traslada al lunes 22
			{
				fecha: "2026-06-22",
				nombre: "Día Nacional de los Pueblos Indígenas",
				tipo: "feriado_nacional",
				recurrente: false,
				descripcion: "Día Nacional de los Pueblos Indígenas 2026 (trasladado desde el 21/06 que cae domingo)",
			},
			// San Pedro y San Pablo: 29 junio 2026 cae lunes
			{
				fecha: "2026-06-29",
				nombre: "San Pedro y San Pablo",
				tipo: "feriado_nacional",
				recurrente: false,
				descripcion: "San Pedro y San Pablo 2026",
			},
			// Encuentro de Dos Mundos: 12 octubre 2026 cae lunes
			{
				fecha: "2026-10-12",
				nombre: "Encuentro de Dos Mundos",
				tipo: "feriado_nacional",
				recurrente: false,
				descripcion: "Encuentro de Dos Mundos 2026",
			},
		];

		let insertados = 0;
		let omitidos = 0;

		for (const festivo of festivos2026) {
			// Verificar si ya existe para evitar duplicados
			const [existe] = await sequelize.query(
				`SELECT id FROM festivos WHERE fecha = :fecha LIMIT 1`,
				{ replacements: { fecha: festivo.fecha } },
			);

			if (existe.length > 0) {
				omitidos++;
				continue;
			}

			await sequelize.query(
				`INSERT INTO festivos (fecha, nombre, tipo, recurrente, descripcion)
				 VALUES (:fecha, :nombre, :tipo, :recurrente, :descripcion)`,
				{
					replacements: {
						fecha: festivo.fecha,
						nombre: festivo.nombre,
						tipo: festivo.tipo,
						recurrente: festivo.recurrente ? 1 : 0,
						descripcion: festivo.descripcion,
					},
				},
			);
			insertados++;
		}

		if (insertados > 0) {
			console.log(`✅ ${insertados} feriados de 2026 insertados correctamente`);
		}
		if (omitidos > 0) {
			console.log(`⏭️  ${omitidos} feriados de 2026 ya existían, omitidos`);
		}
		console.log("✅ Migración de feriados 2026 completada");
	} catch (error) {
		console.error("❌ Error en migración de feriados 2026:", error.message);
		throw error;
	}
};

export default addFestivos2026;
