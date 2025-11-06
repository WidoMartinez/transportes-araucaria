import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo de Usuario Administrador
 * Gestiona los usuarios con acceso al panel administrativo
 */
const AdminUser = sequelize.define(
	"AdminUser",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		username: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: true,
			comment: "Nombre de usuario único para login",
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true,
			},
			comment: "Email del administrador",
		},
		password: {
			type: DataTypes.STRING(255),
			allowNull: false,
			comment: "Contraseña hasheada con bcrypt",
		},
		nombre: {
			type: DataTypes.STRING(100),
			allowNull: false,
			comment: "Nombre completo del administrador",
		},
		rol: {
			type: DataTypes.ENUM("superadmin", "admin", "operador"),
			defaultValue: "admin",
			allowNull: false,
			comment: "Rol del usuario: superadmin (acceso completo), admin (gestión), operador (solo lectura)",
		},
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			allowNull: false,
			comment: "Indica si el usuario está activo",
		},
		ultimoAcceso: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "ultimo_acceso",
			comment: "Fecha y hora del último acceso exitoso",
		},
		intentosFallidos: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
			field: "intentos_fallidos",
			comment: "Contador de intentos de login fallidos",
		},
		bloqueadoHasta: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "bloqueado_hasta",
			comment: "Fecha hasta la cual el usuario está bloqueado",
		},
		tokenRefresh: {
			type: DataTypes.STRING(500),
			allowNull: true,
			field: "token_refresh",
			comment: "Token de actualización para renovar JWT",
		},
	},
	{
		tableName: "admin_users",
		timestamps: true,
		createdAt: "createdAt",
		updatedAt: "updatedAt",
		indexes: [
			{
				fields: ["username"],
			},
			{
				fields: ["email"],
			},
			{
				fields: ["activo"],
			},
		],
	}
);

export default AdminUser;
