import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Modelo para capturar datos de usuarios que no completan la reserva
// Útil para estrategias de remarketing
const Lead = sequelize.define(
	"Lead",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		// Datos de contacto
		nombre: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		telefono: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		// Datos del viaje (si los proporcionó)
		origen: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		destino: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		fecha: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		pasajeros: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		// Información de comportamiento
		ultimaPagina: {
			type: DataTypes.STRING(500),
			allowNull: true,
			comment: "Última página visitada antes de salir",
		},
		tiempoEnSitio: {
			type: DataTypes.INTEGER,
			allowNull: true,
			comment: "Tiempo total en el sitio en segundos",
		},
		pasoAlcanzado: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "Último paso del proceso de reserva alcanzado",
		},
		// Metadata técnica
		dispositivo: {
			type: DataTypes.STRING(50),
			allowNull: true,
			comment: "mobile, tablet, desktop",
		},
		navegador: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		sistemaOperativo: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		ipAddress: {
			type: DataTypes.STRING(45),
			allowNull: true,
		},
		userAgent: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		// Fuente de tráfico
		source: {
			type: DataTypes.STRING(100),
			allowNull: true,
			defaultValue: "web",
			comment: "De dónde llegó el usuario: web, google_ads, facebook, etc.",
		},
		utmSource: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		utmMedium: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		utmCampaign: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		utmTerm: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		utmContent: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		// Datos de remarketing
		convertido: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			comment: "Si el lead se convirtió en reserva",
		},
		reservaId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			comment: "ID de la reserva si se convirtió",
		},
		intentosContacto: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			comment: "Número de veces que se intentó contactar",
		},
		ultimoContacto: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		estadoRemarketing: {
			type: DataTypes.ENUM(
				"nuevo",
				"contactado",
				"interesado",
				"no_interesado",
				"convertido"
			),
			defaultValue: "nuevo",
		},
		notas: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Notas del equipo de ventas sobre el lead",
		},
	},
	{
		tableName: "leads",
		timestamps: true,
		indexes: [
			{ fields: ["email"] },
			{ fields: ["telefono"] },
			{ fields: ["convertido"] },
			{ fields: ["estadoRemarketing"] },
			{ fields: ["created_at"] },
			{ fields: ["source"] },
		],
	}
);

export default Lead;
