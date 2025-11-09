// Script de inicialización de la base de datos
// Se ejecuta automáticamente al iniciar el servidor en Render.com

/* global process */
import bcrypt from 'bcrypt';
import AdminUser from './models/AdminUser.js';
import { testConnection, syncDatabase } from './config/database.js';

/**
 * Inicializa la base de datos y crea el usuario admin por defecto
 */
export const initializeDatabase = async () => {
	try {
		console.log('🔄 Iniciando configuración de base de datos...');

		// 1. Probar conexión
		const connected = await testConnection();
		if (!connected) {
			throw new Error('No se pudo conectar a la base de datos');
		}

		// 2. Sincronizar modelo AdminUser (crear tabla si no existe)
		console.log('🔄 Sincronizando tabla admin_users...');
		await syncDatabase(false, [AdminUser]);

		// 3. Verificar si existe usuario admin
		const adminExists = await AdminUser.findOne({
			where: { username: 'admin' }
		});

		if (!adminExists) {
			console.log('👤 Creando usuario administrador por defecto...');
			
			// Generar hash de contraseña
			const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
			const hashedPassword = await bcrypt.hash(defaultPassword, 10);

			// Crear usuario admin
			await AdminUser.create({
				username: 'admin',
				email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@transportes-araucaria.com',
				password: hashedPassword,
				nombre: 'Administrador Principal',
				rol: 'superadmin',
				activo: true
			});

			console.log('✅ Usuario administrador creado exitosamente');
			console.log('📝 Credenciales por defecto:');
			console.log('   Usuario: admin');
			console.log(`   Contraseña: ${defaultPassword}`);
			console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
		} else {
			console.log('✅ Usuario administrador ya existe');
		}

		console.log('✅ Base de datos inicializada correctamente');
		return true;

	} catch (error) {
		console.error('❌ Error al inicializar base de datos:', error);
		throw error;
	}
};
