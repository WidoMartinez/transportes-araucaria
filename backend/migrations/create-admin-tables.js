/**
 * Migración: Crear tablas de administración y auditoría
 * Crea las tablas admin_users y admin_audit_logs
 */

import sequelize from "../config/database.js";
import AdminUser from "../models/AdminUser.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import { hashPassword } from "../utils/auth.js";

const runMigration = async () => {
	try {
		console.log("🔄 Iniciando migración: Crear tablas de administración...");

		// Conectar a la base de datos
		await sequelize.authenticate();
		console.log("✅ Conexión a base de datos establecida");

		// Crear tabla de usuarios administradores
		await AdminUser.sync({ force: false });
		console.log("✅ Tabla admin_users creada/verificada");

		// Crear tabla de logs de auditoría
		await AdminAuditLog.sync({ force: false });
		console.log("✅ Tabla admin_audit_logs creada/verificada");

		// Verificar si existe al menos un superadmin
		const adminCount = await AdminUser.count({
			where: { rol: "superadmin" },
		});

		if (adminCount === 0) {
			console.log(
				"⚠️  No se encontró ningún superadmin. Creando usuario por defecto..."
			);

			// Crear usuario superadmin por defecto
			// IMPORTANTE: Cambiar estos valores en producción
			const defaultPassword = "Admin123!";
			const hashedPassword = await hashPassword(defaultPassword);

			await AdminUser.create({
				username: "admin",
				email: "admin@transportesaraucaria.cl",
				password: hashedPassword,
				nombre: "Administrador Principal",
				rol: "superadmin",
				activo: true,
			});

			console.log("✅ Usuario superadmin creado:");
			console.log("   Usuario: admin");
			console.log("   Contraseña: Admin123!");
			console.log(
				"   ⚠️  IMPORTANTE: Cambie esta contraseña inmediatamente después del primer login"
			);
		} else {
			console.log(
				`✅ Encontrados ${adminCount} usuario(s) superadmin existente(s)`
			);
		}

		console.log("✅ Migración completada exitosamente");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error en migración:", error);
		process.exit(1);
	}
};

runMigration();
