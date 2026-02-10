import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Modelo para códigos de pago estandarizados
// Ejemplo: A-TCO-25 = Aeropuerto a Temuco por $25.000
const CodigoPago = sequelize.define(
	"CodigoPago",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		codigo: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: true,
			comment: "Código único de pago (formato: A-TCO-25)",
		},
		origen: {
			type: DataTypes.STRING(255),
			allowNull: false,
			comment: "Origen del traslado",
		},
		destino: {
			type: DataTypes.STRING(255),
			allowNull: false,
			comment: "Destino del traslado",
		},
		monto: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			comment: "Monto en pesos chilenos",
		},
		descripcion: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Descripción adicional del servicio",
		},
		vehiculo: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "Tipo de vehículo sugerido",
		},
		pasajeros: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 1,
			comment: "Número de pasajeros incluidos",
		},
		idaVuelta: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			comment: "Si incluye ida y vuelta",
		},
		permitirAbono: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: "permitir_abono",
			comment: "Si permite pagar solo el 40% como abono",
		},
		sillaInfantil: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: "silla_infantil",
			comment: "Si incluye silla de niño",
		},
		estado: {
			type: DataTypes.ENUM("activo", "usado", "vencido", "cancelado"),
			defaultValue: "activo",
			comment: "Estado del código de pago",
		},
		fechaVencimiento: {
			type: DataTypes.DATE,
			allowNull: true,
			comment: "Fecha de vencimiento del código (opcional)",
		},
		usosMaximos: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			comment: "Número máximo de usos permitidos",
		},
		usosActuales: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			comment: "Número de veces que se ha usado el código",
		},
		reservaId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "reserva_id",
			comment: "ID de la reserva creada al usar este código",
		},
		emailCliente: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "email_cliente",
			comment: "Email del cliente que usó el código",
		},
		nombreCliente: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "nombre_cliente",
			comment: "Nombre del cliente (pre-llenado opcional)",
		},
		telefonoCliente: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: "telefono_cliente",
			comment: "Teléfono del cliente (pre-llenado opcional)",
		},
		direccionCliente: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: "direccion_cliente",
			comment: "Dirección específica del cliente (pre-llenado opcional)",
		},
		reservaVinculadaId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "reserva_vinculada_id",
			comment: "ID de la reserva original si es un pago adicional",
		},
		codigoReservaVinculado: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: "codigo_reserva_vinculado",
			comment: "Código de la reserva original (ej: AR-20260107-0001)",
		},
		fechaUso: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "fecha_uso",
			comment: "Fecha y hora en que se usó el código",
		},
		duracionMinutos: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "duracion_minutos",
			comment: "Duración aproximada del viaje en minutos (para destinos personalizados 'Otro')",
		},
	duracionMinutos: {
		type: DataTypes.INTEGER,
		allowNull: true,
		field: "duracion_minutos",
		comment: "Duración aproximada del viaje en minutos (para destinos personalizados 'Otro')",
	},
		observaciones: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: "Observaciones adicionales",
		},
	},
	{
		tableName: "codigos_pago",
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		indexes: [
			{ fields: ["codigo"], unique: true },
			{ fields: ["estado"] },
			{ fields: ["fecha_vencimiento"] },
			{ fields: ["reserva_id"] },
			{ fields: ["email_cliente"] },
			{ fields: ["codigo_reserva_vinculado"] },
		],
	}
);

export default CodigoPago;
