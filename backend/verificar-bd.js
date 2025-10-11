#!/usr/bin/env node
/**
 * Script de Verificación Completa de la Base de Datos MySQL en Hostinger
 * 
 * Este script verifica la integridad y estado operativo de la base de datos
 * después de la eliminación del sistema alternativo basado en JSON.
 */

import dotenv from "dotenv";
import sequelize, { testConnection, syncDatabase } from "./config/database.js";
import CodigoDescuento from "./models/CodigoDescuento.js";
import Destino from "./models/Destino.js";
import Promocion from "./models/Promocion.js";
import DescuentoGlobal from "./models/DescuentoGlobal.js";
import Reserva from "./models/Reserva.js";

dotenv.config();

// Colores para la consola
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
	console.log("\n" + "=".repeat(70));
	log(title, colors.bright + colors.cyan);
	console.log("=".repeat(70));
}

function logSuccess(message) {
	log(`✅ ${message}`, colors.green);
}

function logError(message) {
	log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
	log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
	log(`ℹ️  ${message}`, colors.blue);
}

/**
 * Verificar conexión a la base de datos
 */
async function verificarConexion() {
	logSection("1. VERIFICACIÓN DE CONEXIÓN A LA BASE DE DATOS");
	
	try {
		logInfo("Intentando conectar a la base de datos...");
		logInfo(`Host: ${process.env.DB_HOST || "srv1551.hstgr.io"}`);
		logInfo(`Base de datos: ${process.env.DB_NAME || "u419311572_transportes_araucaria"}`);
		logInfo(`Usuario: ${process.env.DB_USER || "u419311572_admin"}`);
		
		await sequelize.authenticate();
		logSuccess("Conexión establecida correctamente");
		
		// Obtener información del servidor
		const [results] = await sequelize.query("SELECT VERSION() as version");
		logInfo(`Versión de MySQL: ${results[0].version}`);
		
		return true;
	} catch (error) {
		logError("Error al conectar con la base de datos");
		console.error(error.message);
		return false;
	}
}

/**
 * Verificar existencia de tablas
 */
async function verificarTablas() {
	logSection("2. VERIFICACIÓN DE TABLAS");
	
	const tablasEsperadas = [
		"destinos",
		"promociones",
		"descuentos_globales",
		"codigos_descuento",
		"reservas",
	];
	
	const tablasEncontradas = [];
	const tablasFaltantes = [];
	
	try {
		for (const tabla of tablasEsperadas) {
			const [results] = await sequelize.query(`SHOW TABLES LIKE '${tabla}'`);
			
			if (results.length > 0) {
				logSuccess(`Tabla encontrada: ${tabla}`);
				tablasEncontradas.push(tabla);
			} else {
				logWarning(`Tabla no encontrada: ${tabla}`);
				tablasFaltantes.push(tabla);
			}
		}
		
		if (tablasFaltantes.length > 0) {
			logWarning(`\nSe encontraron ${tablasFaltantes.length} tablas faltantes`);
			logInfo("Intentando crear tablas automáticamente...");
			await syncDatabase(false);
			logSuccess("Tablas sincronizadas correctamente");
		}
		
		return { tablasEncontradas, tablasFaltantes };
	} catch (error) {
		logError("Error al verificar tablas");
		console.error(error.message);
		return { tablasEncontradas: [], tablasFaltantes: tablasEsperadas };
	}
}

/**
 * Verificar estructura de columnas de cada tabla
 */
async function verificarEstructuraTablas() {
	logSection("3. VERIFICACIÓN DE ESTRUCTURA DE TABLAS");
	
	const tablas = {
		destinos: Destino,
		promociones: Promocion,
		descuentos_globales: DescuentoGlobal,
		codigos_descuento: CodigoDescuento,
		reservas: Reserva,
	};
	
	const resultados = {};
	
	try {
		for (const [nombreTabla, Modelo] of Object.entries(tablas)) {
			try {
				const [columnas] = await sequelize.query(`DESCRIBE ${nombreTabla}`);
				
				logInfo(`\nTabla: ${nombreTabla}`);
				logInfo(`Columnas encontradas: ${columnas.length}`);
				
				// Mostrar algunas columnas clave
				const columnasImportantes = columnas.slice(0, 5).map((col) => col.Field);
				logInfo(`Primeras columnas: ${columnasImportantes.join(", ")}`);
				
				resultados[nombreTabla] = {
					existe: true,
					columnas: columnas.length,
					detalles: columnas,
				};
				
				logSuccess(`Estructura verificada para ${nombreTabla}`);
			} catch (error) {
				logWarning(`No se pudo verificar estructura de ${nombreTabla}`);
				resultados[nombreTabla] = {
					existe: false,
					error: error.message,
				};
			}
		}
		
		return resultados;
	} catch (error) {
		logError("Error al verificar estructura de tablas");
		console.error(error.message);
		return {};
	}
}

/**
 * Verificar datos existentes en cada tabla
 */
async function verificarDatos() {
	logSection("4. VERIFICACIÓN DE DATOS EXISTENTES");
	
	const modelos = {
		Destinos: Destino,
		Promociones: Promocion,
		"Descuentos Globales": DescuentoGlobal,
		"Códigos de Descuento": CodigoDescuento,
		Reservas: Reserva,
	};
	
	const conteos = {};
	
	try {
		for (const [nombre, Modelo] of Object.entries(modelos)) {
			try {
				const count = await Modelo.count();
				conteos[nombre] = count;
				
				if (count > 0) {
					logSuccess(`${nombre}: ${count} registros`);
					
					// Mostrar ejemplo de datos
					const ejemplo = await Modelo.findOne({
						limit: 1,
						order: [["created_at", "DESC"]],
					});
					
					if (ejemplo) {
						logInfo(`  Último registro creado: ${ejemplo.created_at || "N/A"}`);
					}
				} else {
					logWarning(`${nombre}: Sin registros`);
				}
			} catch (error) {
				logError(`Error al contar ${nombre}: ${error.message}`);
				conteos[nombre] = -1;
			}
		}
		
		return conteos;
	} catch (error) {
		logError("Error al verificar datos");
		console.error(error.message);
		return {};
	}
}

/**
 * Probar operaciones CRUD básicas
 */
async function probarOperacionesCRUD() {
	logSection("5. PRUEBA DE OPERACIONES CRUD");
	
	const resultados = {
		crear: false,
		leer: false,
		actualizar: false,
		eliminar: false,
	};
	
	try {
		// Crear
		logInfo("Probando CREATE...");
		const destinoPrueba = await Destino.create({
			nombre: "DESTINO_PRUEBA_VERIFICACION",
			precioIda: 10000,
			precioVuelta: 10000,
			precioIdaVuelta: 18000,
			activo: false,
			orden: 999,
		});
		logSuccess("CREATE: OK");
		resultados.crear = true;
		
		// Leer
		logInfo("Probando READ...");
		const destinoLeido = await Destino.findOne({
			where: { nombre: "DESTINO_PRUEBA_VERIFICACION" },
		});
		if (destinoLeido) {
			logSuccess("READ: OK");
			resultados.leer = true;
		}
		
		// Actualizar
		logInfo("Probando UPDATE...");
		await destinoLeido.update({ precioIda: 11000 });
		const destinoActualizado = await Destino.findByPk(destinoLeido.id);
		if (destinoActualizado.precioIda === "11000.00" || destinoActualizado.precioIda === 11000) {
			logSuccess("UPDATE: OK");
			resultados.actualizar = true;
		}
		
		// Eliminar
		logInfo("Probando DELETE...");
		await destinoPrueba.destroy();
		const destinoEliminado = await Destino.findOne({
			where: { nombre: "DESTINO_PRUEBA_VERIFICACION" },
		});
		if (!destinoEliminado) {
			logSuccess("DELETE: OK");
			resultados.eliminar = true;
		}
		
		return resultados;
	} catch (error) {
		logError("Error en pruebas CRUD");
		console.error(error.message);
		return resultados;
	}
}

/**
 * Verificar integridad referencial
 */
async function verificarIntegridadReferencial() {
	logSection("6. VERIFICACIÓN DE INTEGRIDAD REFERENCIAL");
	
	try {
		// Verificar reservas con códigos de descuento
		const reservasConCodigo = await Reserva.count({
			where: {
				codigoDescuento: {
					[sequelize.Sequelize.Op.ne]: null,
				},
			},
		});
		
		logInfo(`Reservas con código de descuento: ${reservasConCodigo}`);
		
		if (reservasConCodigo > 0) {
			// Verificar que los códigos existan
			const reservasConCodigoInvalido = await sequelize.query(
				`SELECT COUNT(*) as count 
				 FROM reservas r 
				 LEFT JOIN codigos_descuento cd ON r.codigo_descuento = cd.codigo 
				 WHERE r.codigo_descuento IS NOT NULL 
				 AND cd.codigo IS NULL`,
				{ type: sequelize.QueryTypes.SELECT }
			);
			
			if (reservasConCodigoInvalido[0].count > 0) {
				logWarning(
					`Se encontraron ${reservasConCodigoInvalido[0].count} reservas con códigos inválidos`
				);
			} else {
				logSuccess("Integridad referencial de códigos de descuento: OK");
			}
		}
		
		return true;
	} catch (error) {
		logError("Error al verificar integridad referencial");
		console.error(error.message);
		return false;
	}
}

/**
 * Generar reporte final
 */
function generarReporte(resultados) {
	logSection("REPORTE FINAL DE VERIFICACIÓN");
	
	const {
		conexion,
		tablas,
		estructura,
		datos,
		crud,
		integridad,
	} = resultados;
	
	// Calcular estado general
	const todoOK =
		conexion &&
		tablas.tablasFaltantes.length === 0 &&
		crud.crear &&
		crud.leer &&
		crud.actualizar &&
		crud.eliminar &&
		integridad;
	
	console.log("\n");
	log("╔═══════════════════════════════════════════════════════════════════╗", colors.bright);
	log("║              ESTADO DEL SISTEMA DE BASE DE DATOS                 ║", colors.bright);
	log("╚═══════════════════════════════════════════════════════════════════╝", colors.bright);
	
	console.log("\n📊 RESUMEN:");
	console.log(`   • Conexión a BD: ${conexion ? "✅ OK" : "❌ FALLO"}`);
	console.log(`   • Tablas creadas: ${tablas.tablasEncontradas.length}/5`);
	console.log(`   • Operaciones CRUD: ${Object.values(crud).filter(Boolean).length}/4`);
	console.log(`   • Integridad referencial: ${integridad ? "✅ OK" : "⚠️ REVISAR"}`);
	
	console.log("\n📈 DATOS:");
	for (const [nombre, count] of Object.entries(datos)) {
		console.log(`   • ${nombre}: ${count >= 0 ? count : "ERROR"} registros`);
	}
	
	console.log("\n");
	if (todoOK) {
		log("═══════════════════════════════════════════════════════════════════", colors.green);
		log("✅ SISTEMA OPERATIVO - La base de datos está funcionando correctamente", colors.green + colors.bright);
		log("═══════════════════════════════════════════════════════════════════", colors.green);
	} else {
		log("═══════════════════════════════════════════════════════════════════", colors.yellow);
		log("⚠️  SE DETECTARON ALGUNOS PROBLEMAS - Revisar detalles arriba", colors.yellow + colors.bright);
		log("═══════════════════════════════════════════════════════════════════", colors.yellow);
	}
	
	console.log("\n📝 RECOMENDACIONES:");
	if (!conexion) {
		logWarning("   1. Verificar credenciales de conexión en archivo .env");
		logWarning("   2. Confirmar que el acceso remoto esté habilitado en Hostinger");
	}
	if (tablas.tablasFaltantes.length > 0) {
		logWarning("   1. Ejecutar 'npm run migrate' para crear tablas faltantes");
	}
	if (Object.values(datos).some((count) => count === 0)) {
		logInfo("   1. Algunas tablas están vacías - normal si es primera instalación");
		logInfo("   2. Considerar ejecutar 'npm run migrate' para migrar datos del JSON");
	}
	if (!integridad) {
		logWarning("   1. Revisar y limpiar datos inconsistentes");
		logWarning("   2. Considerar agregar restricciones de clave foránea");
	}
	
	console.log("\n");
}

/**
 * Función principal
 */
async function main() {
	console.clear();
	log("╔═══════════════════════════════════════════════════════════════════╗", colors.bright + colors.cyan);
	log("║     VERIFICACIÓN COMPLETA DE BASE DE DATOS - HOSTINGER MYSQL     ║", colors.bright + colors.cyan);
	log("║              Sistema de Transportes Araucaria                    ║", colors.bright + colors.cyan);
	log("╚═══════════════════════════════════════════════════════════════════╝", colors.bright + colors.cyan);
	log(`\nFecha: ${new Date().toLocaleString("es-CL")}`, colors.cyan);
	
	const resultados = {
		conexion: false,
		tablas: { tablasEncontradas: [], tablasFaltantes: [] },
		estructura: {},
		datos: {},
		crud: { crear: false, leer: false, actualizar: false, eliminar: false },
		integridad: false,
	};
	
	try {
		// 1. Verificar conexión
		resultados.conexion = await verificarConexion();
		
		if (!resultados.conexion) {
			logError("\nNo se pudo establecer conexión. Abortando verificación.");
			process.exit(1);
		}
		
		// 2. Verificar tablas
		resultados.tablas = await verificarTablas();
		
		// 3. Verificar estructura
		resultados.estructura = await verificarEstructuraTablas();
		
		// 4. Verificar datos
		resultados.datos = await verificarDatos();
		
		// 5. Probar CRUD
		resultados.crud = await probarOperacionesCRUD();
		
		// 6. Verificar integridad
		resultados.integridad = await verificarIntegridadReferencial();
		
		// 7. Generar reporte
		generarReporte(resultados);
		
		process.exit(0);
	} catch (error) {
		logError("\n❌ Error fatal durante la verificación:");
		console.error(error);
		process.exit(1);
	} finally {
		await sequelize.close();
	}
}

// Ejecutar script
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error("Error fatal:", error);
		process.exit(1);
	});
}

export default main;
