/* global process */
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Configuración de la base de datos MySQL en Hostinger
const sequelize = new Sequelize({
	database: process.env.DB_NAME || "u419311572_transportes_araucaria",
	username: process.env.DB_USER || "u419311572_admin",
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST || "srv1551.hstgr.io",
	port: process.env.DB_PORT || 3306,
	dialect: "mysql",
	// Habilitar logging condicional para diagnóstico (DB_LOGGING=true en .env)
	logging: process.env.DB_LOGGING === 'true' ? console.log : false,
	pool: {
		max: 5,
		min: 0,
		acquire: 90000, // Aumentado a 90 segundos para Render
		idle: 10000,
	},
	// Evitar conversiones automáticas de zona horaria que pueden desplazar DATE/DATEONLY
	timezone: process.env.DB_TIMEZONE || "-04:00",
	dialectOptions: {
		connectTimeout: 90000, // Timeout de conexión: 90 segundos para Render
		timezone: process.env.DB_TIMEZONE || "-04:00",
	},
	retry: {
		max: 5, // Aumentado a 5 reintentos para mayor tolerancia en Render/Hostinger
	},
	define: {
		timestamps: true,
		underscored: true,
		freezeTableName: true,
	},
});

// Función para probar la conexión
export const testConnection = async () => {
	try {
		await sequelize.authenticate();
		console.log("✅ Conexión a la base de datos establecida correctamente.");
		return true;
	} catch (error) {
		console.error("❌ Error al conectar con la base de datos:", error);
		return false;
	}
};

// Función para sincronizar los modelos con la base de datos
export const syncDatabase = async (force = false, models = []) => {
	try {
		// Decidir si permitir alter:
		// - En producción se deshabilita por seguridad a menos que DB_ALLOW_ALTER=true
		// - En desarrollo se permite por defecto
		const allowAlter =
			(process.env.DB_ALLOW_ALTER && process.env.DB_ALLOW_ALTER === "true") ||
			process.env.NODE_ENV !== "production";

		// Si se proporcionan modelos específicos, sincronizarlos en orden
		if (models && models.length > 0) {
			console.log(`🔄 Sincronizando ${models.length} modelos...`);
			for (const model of models) {
				try {
					// alter: crea/modifica solo si está permitido y no se forza recreate
					await model.sync({ force, alter: allowAlter && !force });
					console.log(`✅ Modelo ${model.name} sincronizado`);
				} catch (modelError) {
					console.error(
						`❌ Error sincronizando modelo ${model.name}:`,
						modelError.message
					);
					// Intentar sin alter si falla (por ejemplo, por límite de índices)
					try {
						await model.sync({ force: false, alter: false });
						console.log(
							`✅ Modelo ${model.name} creado/sincronizado sin alter`
						);
					} catch (retryError) {
						console.error(
							`❌ Error crítico en ${model.name}:`,
							retryError.message
						);
					}
				}
			}
		} else {
			// Sincronización general de todos los modelos registrados
			// Intentar con alter solo si está permitido; si falla, reintentar sin alter
			const initialAlter = allowAlter && !force;
			try {
				await sequelize.sync({ force, alter: initialAlter });
			} catch (error) {
				console.error(
					`⚠️ Error al sincronizar con alter=${initialAlter}:`,
					error.message
				);
				// Si el fallo es por demasiados índices o cualquier otro problema al aplicar cambios,
				// reintentar sin alter para evitar ejecutar ALTER TABLE que puedan fallar en producción.
				try {
					await sequelize.sync({ force, alter: false });
					console.log(
						"✅ Sincronización completada sin usar alter (seguro para producción)."
					);
				} catch (retryErr) {
					console.error(
						"❌ Reintento de sincronización sin alter también falló:",
						retryErr
					);
					throw retryErr;
				}
			}
		}
		console.log("✅ Base de datos sincronizada correctamente.");
		return true;
	} catch (error) {
		console.error("❌ Error al sincronizar la base de datos:", error);
		return false;
	}
};

export default sequelize;
