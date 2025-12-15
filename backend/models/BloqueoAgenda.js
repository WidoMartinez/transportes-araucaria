import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo para gestionar bloqueos de agenda
 * Permite bloquear días, horarios o fechas específicas para reservas
 */
const BloqueoAgenda = sequelize.define(
	"BloqueoAgenda",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		fechaInicio: {
			type: DataTypes.DATEONLY,
			allowNull: false,
			field: "fecha_inicio",
			comment: "Fecha de inicio del bloqueo (YYYY-MM-DD)",
		},
		fechaFin: {
			type: DataTypes.DATEONLY,
			allowNull: true,
			field: "fecha_fin",
			comment: "Fecha de fin del bloqueo (opcional, para rangos de fechas)",
		},
		horaInicio: {
			type: DataTypes.TIME,
			allowNull: true,
			field: "hora_inicio",
			comment: "Hora de inicio del bloqueo (HH:MM:SS, opcional para bloqueos horarios)",
		},
		horaFin: {
			type: DataTypes.TIME,
			allowNull: true,
			field: "hora_fin",
			comment: "Hora de fin del bloqueo (HH:MM:SS, opcional para bloqueos horarios)",
		},
		tipo: {
			type: DataTypes.ENUM("dia_completo", "rango_horario", "fecha_especifica"),
			allowNull: false,
			defaultValue: "dia_completo",
			comment: "Tipo de bloqueo: día completo, rango horario específico, o fecha específica",
		},
		motivo: {
			type: DataTypes.STRING(255),
			allowNull: true,
			comment: "Motivo o razón del bloqueo (ej: mantenimiento, evento especial)",
		},
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			comment: "Si el bloqueo está activo o no",
		},
		descripcion: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Descripción detallada o notas adicionales sobre el bloqueo",
		},
	},
	{
		tableName: "bloqueos_agenda",
		timestamps: true,
		indexes: [
			{ fields: ["fecha_inicio"] },
			{ fields: ["fecha_fin"] },
			{ fields: ["activo"] },
			{ fields: ["tipo"] },
			// Índice compuesto para búsquedas por rango de fechas
			{ fields: ["fecha_inicio", "fecha_fin", "activo"] },
		],
	}
);

export default BloqueoAgenda;
