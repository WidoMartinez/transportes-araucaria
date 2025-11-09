import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo de Log de Auditoría Administrativa
 * Registra todas las acciones relevantes de los administradores
 */
const AdminAuditLog = sequelize.define(
	"AdminAuditLog",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		adminUserId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "admin_user_id",
			comment: "ID del usuario admin que realizó la acción",
		},
		accion: {
			type: DataTypes.STRING(100),
			allowNull: false,
			comment: "Tipo de acción realizada (login, logout, crear, editar, eliminar, etc.)",
		},
		entidad: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "Entidad afectada (reserva, vehiculo, conductor, etc.)",
		},
		entidadId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "entidad_id",
			comment: "ID del registro afectado",
		},
		detalles: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Detalles adicionales en formato JSON",
		},
		ip: {
			type: DataTypes.STRING(50),
			allowNull: true,
			comment: "Dirección IP desde donde se realizó la acción",
		},
		userAgent: {
			type: DataTypes.STRING(500),
			allowNull: true,
			field: "user_agent",
			comment: "User agent del navegador",
		},
		resultado: {
			type: DataTypes.ENUM("exitoso", "fallido", "bloqueado"),
			defaultValue: "exitoso",
			allowNull: false,
			comment: "Resultado de la acción",
		},
	},
	{
		tableName: "admin_audit_logs",
		timestamps: true,
		createdAt: "created_at",
		updatedAt: false,
		indexes: [
			{
				fields: ["admin_user_id"],
			},
			{
				fields: ["accion"],
			},
			{
				fields: ["created_at"],
			},
			{
				fields: ["resultado"],
			},
		],
	}
);

export default AdminAuditLog;
