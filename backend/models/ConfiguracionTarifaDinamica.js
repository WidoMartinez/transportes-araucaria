import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo para configurar reglas de tarifa dinámica
 * Permite configurar recargos/descuentos por anticipación, días y horarios
 */
const ConfiguracionTarifaDinamica = sequelize.define(
	"ConfiguracionTarifaDinamica",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		nombre: {
			type: DataTypes.STRING(100),
			allowNull: false,
			comment: "Nombre descriptivo de la configuración",
		},
		tipo: {
			type: DataTypes.ENUM(
				"anticipacion",
				"dia_semana",
				"horario",
				"descuento_retorno"
			),
			allowNull: false,
			comment: "Tipo de regla de tarifa dinámica",
		},
		// Configuración para tipo "anticipacion"
		diasMinimos: {
			type: DataTypes.INTEGER,
			allowNull: true,
			comment: "Días mínimos de anticipación para esta regla",
		},
		diasMaximos: {
			type: DataTypes.INTEGER,
			allowNull: true,
			comment: "Días máximos de anticipación para esta regla (null = sin límite)",
		},
		// Configuración para tipo "dia_semana"
		diasSemana: {
			type: DataTypes.JSON,
			allowNull: true,
			comment: "Array de días de la semana: [0=domingo, 1=lunes, ..., 6=sábado]",
		},
		// Configuración para tipo "horario"
		horaInicio: {
			type: DataTypes.TIME,
			allowNull: true,
			comment: "Hora de inicio para el recargo (formato HH:MM:SS)",
		},
		horaFin: {
			type: DataTypes.TIME,
			allowNull: true,
			comment: "Hora de fin para el recargo (formato HH:MM:SS)",
		},
		// Valor del ajuste (porcentaje)
		porcentajeAjuste: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: false,
			comment: "Porcentaje de ajuste: positivo=recargo, negativo=descuento",
		},
		// Configuración de aplicación
		activo: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			comment: "Si la regla está activa",
		},
		prioridad: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			comment: "Orden de prioridad (mayor = se aplica primero)",
		},
		// Exclusiones por destino
		destinosExcluidos: {
			type: DataTypes.JSON,
			allowNull: true,
			comment: "Array de nombres de destinos excluidos de esta regla",
		},
		// Descripción y notas
		descripcion: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Descripción detallada de la regla",
		},
		// Configuración específica para descuento de retorno
		tiempoEsperaMaximo: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 240,
			comment: "Tiempo máximo de espera en minutos (para descuento retorno)",
		},
	},
	{
		tableName: "configuracion_tarifa_dinamica",
		timestamps: true,
		indexes: [
			{ fields: ["tipo"] },
			{ fields: ["activo"] },
			{ fields: ["prioridad"] },
		],
	}
);

export default ConfiguracionTarifaDinamica;
